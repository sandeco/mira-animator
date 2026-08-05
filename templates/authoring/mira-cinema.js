/* ==========================================================================
   mira-cinema.js — coreografia, câmera, profundidade e grade de cor.

   PRINCÍPIO, e tudo aqui decorre dele:

       O GSAP não anima elementos. Anima ESTADOS. Os renderizadores derivam.

   Duas fontes únicas de verdade por palco, `camera` e `luz`. Nada mais é
   global. Se cada elemento carregasse seu próprio filtro de luz e seu próprio
   fator de parallax, seriam N pontos para manter em sincronia, e quem escreve
   a animação (um LLM) os deixaria inconsistentes. Com estado único, o relâmpago
   clareia o ator, o chão, a sombra e a chuva porque os quatro leem a mesma
   variável, não porque alguém sincronizou quatro animações.

   Dependência: GSAP core. Nada mais. Sem build, sem rede em apresentação.

   ATENÇÃO, para quem for mexer: este arquivo é CÓDIGO-FONTE VERSIONADO, no
   mesmo pé de mira-edit.js e mira-draw.js. Ele é COPIADO para mira/ do deck na
   criação. Nunca é gerado por LLM a cada deck: a premissa inteira de que a
   biblioteca reduz a variância do gerador cai por terra se o módulo for
   reescrito a cada uso, porque voltaríamos a ter N implementações artesanais.
   ========================================================================== */
(function () {
    'use strict';

    if (typeof window.gsap === 'undefined') {
        console.error('[mira-cinema] GSAP não encontrado. Carregue mira/vendor/gsap.min.js ANTES deste arquivo.');
        return;
    }
    var gsap = window.gsap;

    /* ---------------------------------------------------------------------
       Registro de palcos vivos. É por ele que o MutationObserver da §7.2
       alcança todas as cenas de uma vez, e é ele que faz o ticker custar
       uma passada só por quadro, e não uma por cena.
       --------------------------------------------------------------------- */
    var PALCOS = [];
    var SVG_NS = 'http://www.w3.org/2000/svg';

    /* ---------------------------------------------------------------------
       PRNG semeado (mulberry32).

       Nenhuma animação usa Math.random(). Motivo imediato: exportação para
       vídeo e comparação lado a lado só fazem sentido se duas execuções
       produzirem o mesmo quadro. Motivo futuro: golden frames.
       --------------------------------------------------------------------- */
    function semear(txt) {
        var h = 1779033703 ^ String(txt).length;
        for (var i = 0; i < String(txt).length; i++) {
            h = Math.imul(h ^ String(txt).charCodeAt(i), 3432918353);
            h = (h << 13) | (h >>> 19);
        }
        return h >>> 0;
    }
    function mulberry32(a) {
        return function () {
            a |= 0; a = (a + 0x6D2B79F5) | 0;
            var t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    /* ---------------------------------------------------------------------
       Enquadramento na proporção do palco.

       A ARMADILHA que isto resolve: enquadrar um alvo de proporção diferente
       da do palco, sem corrigir, faz o preserveAspectRatio="xMidYMid meet"
       acrescentar margem inesperada num dos eixos. O resultado é um zoom que
       "não fecha" como o autor pediu, e o sintoma não sugere a causa.

       A caixa do alvo é EXPANDIDA (nunca cortada) até a proporção do palco.
       --------------------------------------------------------------------- */
    function conformar(caixa, proporcao) {
        var p = caixa.w / caixa.h;
        var w = caixa.w, h = caixa.h;
        if (p < proporcao) w = h * proporcao;   /* alvo mais estreito: alarga */
        else h = w / proporcao;                 /* alvo mais largo: engorda   */
        return {
            x: caixa.x - (w - caixa.w) / 2,
            y: caixa.y - (h - caixa.h) / 2,
            w: w, h: h
        };
    }

    function caixaDe(cena, seletor) {
        var el = typeof seletor === 'string' ? cena.svg.querySelector(seletor) : seletor;
        if (!el || typeof el.getBBox !== 'function') {
            console.warn('[mira-cinema] alvo não encontrado no palco: ' + seletor);
            return null;
        }
        var b = el.getBBox();
        if (!b.width || !b.height) {
            console.warn('[mira-cinema] alvo sem caixa mensurável (invisível ou vazio): ' + seletor);
            return null;
        }
        return { x: b.x, y: b.y, w: b.width, h: b.height };
    }

    function comMargem(caixa, margem) {
        var m = typeof margem === 'number' ? margem : 0.12;
        return {
            x: caixa.x - caixa.w * m,
            y: caixa.y - caixa.h * m,
            w: caixa.w * (1 + m * 2),
            h: caixa.h * (1 + m * 2)
        };
    }

    /* ---------------------------------------------------------------------
       Compensação de traço e texto no zoom.

       A ARMADILHA: fechar o enquadramento engorda traço e texto
       proporcionalmente. Um stroke-width: 2 vira 4 na tela num push-in de 2x,
       e a arte engorda a cada cue. O sintoma ("a cena engordou") não sugere a
       causa, e por isso o módulo trata, em vez de deixar para o gerador.
       --------------------------------------------------------------------- */
    function prepararFixos(cena) {
        var tracos = cena.svg.querySelectorAll('[data-mira-traco-fixo]');
        for (var i = 0; i < tracos.length; i++) {
            tracos[i].setAttribute('vector-effect', 'non-scaling-stroke');
        }
        var textos = cena.svg.querySelectorAll('[data-mira-texto-fixo]');
        cena._textosFixos = [];
        for (var j = 0; j < textos.length; j++) {
            var el = textos[j];
            var base = parseFloat(
                el.getAttribute('font-size') || window.getComputedStyle(el).fontSize
            ) || 16;
            cena._textosFixos.push({ el: el, base: base });
        }
    }
    function compensarTexto(cena) {
        if (!cena._textosFixos || !cena._textosFixos.length) return;
        /* a escala efetiva é a do ENQUADRAMENTO, não a do plano: o parallax
           translada, não escala, então não entra nesta conta */
        var escala = cena.camera.w / cena.base.w;
        for (var i = 0; i < cena._textosFixos.length; i++) {
            var t = cena._textosFixos[i];
            t.el.setAttribute('font-size', (t.base * escala).toFixed(3));
        }
    }

    /* =====================================================================
       MiraCinema.palco()

       Substituto drop-in do par palco() + reger() que hoje vive inline no
       template. Preserva os dois comportamentos:
         - casa o viewBox com a caixa real do palco (era o casar());
         - zera e toca quando o slide entra em tela, por IntersectionObserver
           com threshold 0.6 (era o reger());
         - congela no primeiro quadro enquanto o slide estiver fora de tela.

       A diferença é interna: a linha do tempo nasce paused e recebe play() no
       mesmo gatilho de hoje. O comportamento visível é idêntico ao atual, e
       essa é a condição de aceite número 1 da onda 1.
       ===================================================================== */
    function palco(svgId, opcoes) {
        opcoes = opcoes || {};
        var svg = document.getElementById(svgId);
        if (!svg) { console.warn('[mira-cinema] svg não encontrado: #' + svgId); return null; }

        /* REPLAY: recriar o palco do mesmo SVG destrói o anterior.
           Sem isto, dois palcos vivos disputam o mesmo atributo viewBox e
           dois conjuntos de derivadores rodam por quadro, que é justamente o
           defeito de Replay que este módulo existe para consertar. Matar só a
           timeline não basta: o palco antigo continua no registro e continua
           ticando. */
        for (var k = PALCOS.length - 1; k >= 0; k--) {
            if (PALCOS[k].id === svgId) PALCOS[k].destruir();
        }

        var caixa = svg.closest('.anim-stage') || svg.parentNode;
        var slide = svg.closest('section');

        var deckId = document.documentElement.getAttribute('data-mira-deck-id') || document.title || 'deck';
        var seed = opcoes.seed != null ? opcoes.seed : semear(deckId + '::' + svgId);

        var cena = {
            id: svgId,
            svg: svg,
            caixa: caixa,
            slide: slide,
            seed: seed,
            rnd: mulberry32(seed),

            /* estado único de enquadramento */
            camera: { x: 0, y: 0, w: 960, h: 460 },
            /* estado único de luz. A onda 1 só o transporta; quem escreve
               nele é o Luz.* da onda 2. Reservado aqui para que o canal e o
               tique já existam quando a luz chegar. */
            luz: { x: 0.5, y: 0.35, cor: '#ffffff', intensidade: 0 },
            base: { x: 0, y: 0, w: 960, h: 460 },

            tl: null,
            _derivadores: [],
            _planos: [],
            _visivel: false,
            _congelada: false,      /* pintura: câmera parada no enquadramento corrente */
            _presaNaBase: false,    /* edição: câmera parada no enquadramento base */
            _morta: false
        };

        /* ---- enquadramento base, e o handler de resize --------------------
           A CÂMERA é dona do atributo viewBox. O casar() de antes reescrevia
           o viewBox inteiro a cada resize e brigaria com qualquer cue em
           curso. Aqui ele só atualiza a BASE, e a câmera recompõe por cima:
           redimensionar no meio de um zoom não cancela o zoom nem salta. */
        var W = 960;
        function casar() {
            var r = caixa.getBoundingClientRect();
            var H = (r.width > 0 && r.height > 0) ? Math.round(W * r.height / r.width) : 460;
            var proporcaoAntiga = cena.base.w / cena.base.h;
            var zoom = cena.camera.w / cena.base.w;
            var cx = cena.camera.x + cena.camera.w / 2;
            var cy = cena.camera.y + cena.camera.h / 2;

            cena.base = { x: 0, y: 0, w: W, h: H };
            cena.proporcao = W / H;

            /* A PRIMEIRA medição casa a câmera com a base, sem preservar
               centro. Preservar o centro na primeira vez usa o palpite
               inicial (960x460) como referência, e a diferença para a altura
               real (por exemplo 459) vira um resíduo de meio ponto no eixo Y
               que nunca mais sai. Foi defeito real: o A1-01 pegou, comparando
               o viewBox com o do padrão antigo (`0 0 960 459` contra
               `0.00 0.50 960.00 459.00`). */
            if (!cena._casou || !isFinite(proporcaoAntiga) || cena._presaNaBase) {
                cena._casou = true;
                cena.camera.x = 0; cena.camera.y = 0; cena.camera.w = W; cena.camera.h = H;
            } else {
                /* preserva o zoom e o centro; só a proporção acompanha a caixa */
                var nw = W * zoom, nh = H * zoom;
                cena.camera.w = nw; cena.camera.h = nh;
                cena.camera.x = cx - nw / 2;
                cena.camera.y = cy - nh / 2;
            }
            escreverViewBox(cena);
        }
        casar();
        cena._casar = casar;
        window.addEventListener('resize', casar);

        prepararFixos(cena);

        /* ---- timeline -----------------------------------------------------
           UMA por palco, guardada em cena.tl, com kill() antes de recriar.
           Isso CONSERTA o defeito conhecido de Replay duplicar animação, em
           vez de criar um novo. */
        cena.tl = gsap.timeline({ paused: true, repeat: -1 });

        /* ---- regente ------------------------------------------------------
           Mesmo gatilho de hoje: IntersectionObserver com threshold 0.6. O
           slide precisa estar majoritariamente visível, senão o de baixo
           dispararia durante a rolagem. */
        if (slide && typeof IntersectionObserver === 'function') {
            cena._obs = new IntersectionObserver(function (entradas) {
                entradas.forEach(function (e) {
                    if (e.isIntersecting === cena._visivel) return;
                    cena._visivel = e.isIntersecting;
                    if (cena._visivel) {
                        cena.tl.time(0);            /* reentrada recomeça a história */
                        if (!bloqueado()) cena.tl.play();
                    } else {
                        cena.tl.pause();
                        cena.tl.time(0);            /* congelado no primeiro quadro */
                        aoTique(cena);
                    }
                });
            }, { threshold: 0.6 });
            cena._obs.observe(slide);
        } else {
            /* sem IntersectionObserver, roda solto: é o comportamento de
               antes, e degradar é melhor que ficar preto */
            cena._visivel = true;
            cena.tl.play();
        }

        if (opcoes.grade) Grade.aplicar(cena, opcoes.grade);

        /* O fator de ritmo do slide vale para palco NOVO também.
           Sem isto, um palco criado depois da carga (Replay, reordenação,
           slide montado em tempo de execução) nasceria em 1.0 mesmo numa
           <section> com @MIRA:SPEED 0.7, e o ritmo daquele slide mudaria
           sozinho ao dar Replay. Foi defeito real, pego por teste. */
        cena.fator = lerMarcador(slide);
        if (cena.fator !== 1) cena.tl.timeScale(cena.fator);

        PALCOS.push(cena);
        ligarTicker();

        /* ---- superfície pública ------------------------------------------ */
        cena.aoAtualizar = function (fn) {
            if (typeof fn === 'function') cena._derivadores.push(fn);
            return cena;
        };
        cena.destruir = function () {
            cena._morta = true;
            if (cena.tl) cena.tl.kill();
            if (cena._obs) cena._obs.disconnect();
            window.removeEventListener('resize', casar);
            cena._derivadores.length = 0;
            var i = PALCOS.indexOf(cena);
            if (i >= 0) PALCOS.splice(i, 1);
        };

        return cena;
    }

    /* ---------------------------------------------------------------------
       Aplicação por tique. UM callback no ticker do GSAP, para todos os
       palcos. Palco fora de tela não tica: um deck de 12 slides gasta o
       custo de 1.
       --------------------------------------------------------------------- */
    function escreverViewBox(cena) {
        var c = cena.camera;
        cena.svg.setAttribute('viewBox',
            c.x.toFixed(2) + ' ' + c.y.toFixed(2) + ' ' + c.w.toFixed(2) + ' ' + c.h.toFixed(2));
    }

    /* INVARIANTE: o enquadramento SEMPRE respeita a proporção do palco.

       Conformar só na criação do cue não basta. A tween congela o destino no
       instante em que é criada, e um resize no meio dela muda a proporção do
       palco por baixo: o cue termina num enquadramento fora de proporção, e o
       `preserveAspectRatio` acrescenta a margem inesperada que a §5.4 manda
       evitar. Foi defeito real, pego por teste com resize durante o cue.

       Aplicar aqui cobre TODO caminho de escrita (tween, atribuição direta,
       resize), porque o tique é o único lugar que escreve o viewBox. E é
       idempotente: conformar uma caixa que já está na proporção devolve ela
       mesma, então não há deriva quadro a quadro. */
    function conformarCamera(cena) {
        if (!cena.proporcao) return;
        var c = cena.camera;
        var p = c.w / c.h;
        if (Math.abs(p - cena.proporcao) < 1e-6) return;
        var novo = conformar({ x: c.x, y: c.y, w: c.w, h: c.h }, cena.proporcao);
        c.x = novo.x; c.y = novo.y; c.w = novo.w; c.h = novo.h;
    }

    function aoTique(cena) {
        /* 1. estado de câmera -> atributo viewBox */
        if (cena._presaNaBase) {
            cena.camera.x = cena.base.x; cena.camera.y = cena.base.y;
            cena.camera.w = cena.base.w; cena.camera.h = cena.base.h;
        }
        conformarCamera(cena);
        if (!cena._congelada) escreverViewBox(cena);

        /* 2. estado de luz -> variáveis CSS do palco */
        var s = cena.caixa && cena.caixa.style;
        if (s) {
            s.setProperty('--mira-luz-x', cena.luz.x);
            s.setProperty('--mira-luz-y', cena.luz.y);
            s.setProperty('--mira-luz-i', cena.luz.intensidade);
        }

        /* 3. parallax dos planos, derivado do MESMO estado de câmera */
        aplicarPlanos(cena);
        compensarTexto(cena);

        /* 4. derivadores registrados, na ordem de registro.
              É a única costura entre o SVG e a camada de atmosfera, e ser
              canal único é proposital: é o que garante que tudo derive do
              mesmo tique. */
        for (var i = 0; i < cena._derivadores.length; i++) {
            try { cena._derivadores[i](cena); }
            catch (e) { console.warn('[mira-cinema] derivador falhou:', e); }
        }
    }

    var tickerLigado = false;
    function ligarTicker() {
        if (tickerLigado) return;
        tickerLigado = true;
        gsap.ticker.add(function () {
            for (var i = 0; i < PALCOS.length; i++) {
                var c = PALCOS[i];
                if (c._morta || !c._visivel) continue;
                aoTique(c);
            }
        });
    }

    /* =====================================================================
       Cam — cues de câmera.

       Cada cue devolve uma TWEEN, para se encaixar na timeline mestra com
       label. Nenhum cue toca o viewBox direto: todos animam cena.camera, e o
       tique escreve. É o princípio da abertura do arquivo.
       ===================================================================== */
    var EASE = {
        decisive: 'power3.out',
        reluctant: 'power1.inOut',
        heavy: 'power2.in',
        fragile: 'sine.inOut',
        'reveal-breath': 'sine.out',
        'dread-creep': 'power1.in'
    };
    function curva(e) { return (e && EASE[e]) || e || 'sine.inOut'; }

    function exigirRazao(cue, o) {
        if (!o || !o.razao || !String(o.razao).trim()) {
            console.warn('[mira-cinema] Cam.' + cue + ' sem `razao`. '
                + 'Razão é obrigatória: custa uma string e é o que impede câmera decorativa.');
        }
    }

    function paraCaixa(cena, alvo, dur, ease) {
        var destino = conformar(alvo, cena.proporcao);
        return gsap.to(cena.camera, {
            x: destino.x, y: destino.y, w: destino.w, h: destino.h,
            duration: dur, ease: curva(ease)
        });
    }

    var Cam = {
        /* quadro aberto, mostra o mundo. É o enquadramento BASE, e é nele que
           o @MIRA:SIZE e a área segura são medidos. */
        estabelecer: function (cena, o) {
            o = o || {};
            return paraCaixa(cena, cena.base, o.dur != null ? o.dur : 0.8, o.ease);
        },
        aproximar: function (cena, o) {
            o = o || {};
            exigirRazao('aproximar', o);
            var c = caixaDe(cena, o.alvo);
            if (!c) return gsap.to({}, { duration: o.dur || 1 });
            return paraCaixa(cena, comMargem(c, o.margem), o.dur != null ? o.dur : 1.2, o.ease);
        },
        revelar: function (cena, o) {
            o = o || {};
            exigirRazao('revelar', o);
            var c = caixaDe(cena, o.alvo);
            if (!c) return gsap.to({}, { duration: o.dur || 1 });
            /* revelar mantém a ESCALA corrente e desloca o centro: é
               travelling, não zoom */
            var largura = cena.camera.w, altura = cena.camera.h;
            var alvo = {
                x: c.x + c.w / 2 - largura / 2,
                y: c.y + c.h / 2 - altura / 2,
                w: largura, h: altura
            };
            return gsap.to(cena.camera, {
                x: alvo.x, y: alvo.y,
                duration: o.dur != null ? o.dur : 1.4,
                ease: curva(o.ease || 'reveal-breath')
            });
        },
        recuar: function (cena, o) {
            o = o || {};
            exigirRazao('recuar', o);
            return paraCaixa(cena, cena.base, o.dur != null ? o.dur : 1.0, o.ease);
        },
        /* segurar sem se mexer: é a leitura da consequência, e é beat
           legítimo, não tempo morto */
        segurar: function (cena, o) {
            o = o || {};
            return gsap.to({}, { duration: o.dur != null ? o.dur : 0.6 });
        },
        /* TETO: 400 ms e amplitude contida. Tremor é o efeito mais fácil de
           estragar, e num slide sendo gravado ele lê como falha de captura,
           não como intenção. */
        tremor: function (cena, o) {
            o = o || {};
            exigirRazao('tremor', o);
            var dur = Math.min(o.dur != null ? o.dur : 0.25, 0.4);
            if (o.dur != null && o.dur > 0.4) {
                console.warn('[mira-cinema] Cam.tremor limitado a 400 ms (pedido: ' + o.dur + 's).');
            }
            var amp = Math.min(o.amplitude != null ? o.amplitude : 0.012, 0.02) * cena.camera.w;
            var x0 = cena.camera.x, y0 = cena.camera.y;
            return gsap.to(cena.camera, {
                duration: dur,
                ease: 'none',
                x: x0, y: y0,
                onUpdate: function () {
                    cena.camera.x = x0 + (cena.rnd() - 0.5) * amp;
                    cena.camera.y = y0 + (cena.rnd() - 0.5) * amp;
                },
                onComplete: function () { cena.camera.x = x0; cena.camera.y = y0; }
            });
        }
    };

    /* =====================================================================
       Prof — profundidade por planos.

       z de 0 (colado na câmera) a 1 (infinito). O fator de resposta ao
       movimento de câmera é (1 - z). Três a cinco planos, nunca mais.

       OCLUSÃO É DOUTRINA, NÃO API: ordem de empilhamento no SVG e máscara
       resolvem, e é a pista de profundidade mais forte que existe. Parallax
       sem oclusão continua lendo como recorte deslizante.
       ===================================================================== */
    var Prof = {
        plano: function (cena, seletor, o) {
            o = o || {};
            var el = cena.svg.querySelector(seletor);
            if (!el) { console.warn('[mira-cinema] plano não encontrado: ' + seletor); return null; }

            if (cena._planos.length >= 5) {
                console.warn('[mira-cinema] teto de 5 planos atingido; "' + seletor + '" ignorado. '
                    + 'Três a cinco planos, nunca mais.');
                return null;
            }

            var raio = Math.min(o.desfoque || 0, 4);
            if (o.desfoque > 4) {
                console.warn('[mira-cinema] desfoque limitado a raio 4 (pedido: ' + o.desfoque + ').');
            }

            var plano = {
                el: el,
                z: Math.max(0, Math.min(1, o.z != null ? o.z : 0.5)),
                raio: raio,
                nitido: true
            };

            if (raio > 0) plano.filtro = filtroDesfoque(cena, seletor, raio);
            if (raio > 0) el.setAttribute('filter', 'url(#' + plano.filtro.id + ')');
            if (o.escurecer) el.setAttribute('opacity', String(1 - Math.min(0.8, o.escurecer)));

            cena._planos.push(plano);
            return plano;
        },

        /* foco seletivo: troca qual plano está nítido durante um beat. É o
           único lugar onde o desfoque anima, porque feGaussianBlur animado em
           área grande é caro. */
        foco: function (cena, o) {
            o = o || {};
            var dur = o.dur != null ? o.dur : 0.5;
            var alvo = o.plano ? cena.svg.querySelector(o.plano) : null;
            var tweens = [];
            for (var i = 0; i < cena._planos.length; i++) {
                var p = cena._planos[i];
                if (!p.filtro) continue;
                var destino = (alvo && p.el === alvo) ? 0 : p.raio;
                tweens.push(gsap.to(p.filtro.op, {
                    attr: { stdDeviation: destino },
                    duration: dur, ease: 'sine.inOut'
                }));
            }
            return tweens.length ? gsap.timeline().add(tweens, 0) : gsap.to({}, { duration: dur });
        }
    };

    function aplicarPlanos(cena) {
        if (!cena._planos.length) return;
        var dx = cena.camera.x - cena.base.x;
        var dy = cena.camera.y - cena.base.y;
        for (var i = 0; i < cena._planos.length; i++) {
            var p = cena._planos[i];
            var f = 1 - p.z;                       /* z=1 (infinito) não se move */
            /* o plano se desloca CONTRA o movimento da câmera, na fração do
               seu z: é isso que produz parallax a partir do estado único */
            p.el.setAttribute('transform', 'translate(' + (dx * f).toFixed(3) + ',' + (dy * f).toFixed(3) + ')');
        }
    }

    /* ---------------------------------------------------------------------
       Filtros. Duas regras que o módulo garante e o agente precisa repetir
       quando escrever filtro à mão:

       1. Todo filtro declara REGIÃO EXPLÍCITA. O padrão recorta em -10% a
          +120% da caixa, e glow e blur saem com borda reta. O sintoma (o
          brilho tem uma borda reta) não sugere a causa.
       2. IDs são NAMESPACED por deck e slide, senão colidem entre slides no
          mesmo documento, e o deck mantém todas as <section> vivas.
       --------------------------------------------------------------------- */
    function defsDe(cena) {
        var d = cena.svg.querySelector('defs');
        if (!d) {
            d = document.createElementNS(SVG_NS, 'defs');
            cena.svg.insertBefore(d, cena.svg.firstChild);
        }
        return d;
    }
    function idUnico(cena, sufixo) {
        return 'mc-' + cena.id + '-' + String(sufixo).replace(/[^a-zA-Z0-9_-]/g, '') ;
    }
    function filtroDesfoque(cena, seletor, raio) {
        var id = idUnico(cena, 'blur-' + seletor);
        var f = document.createElementNS(SVG_NS, 'filter');
        f.setAttribute('id', id);
        f.setAttribute('x', '-20%'); f.setAttribute('y', '-20%');
        f.setAttribute('width', '140%'); f.setAttribute('height', '140%');
        var op = document.createElementNS(SVG_NS, 'feGaussianBlur');
        op.setAttribute('in', 'SourceGraphic');
        op.setAttribute('stdDeviation', String(raio));
        f.appendChild(op);
        defsDe(cena).appendChild(f);
        return { id: id, el: f, op: op };
    }

    /* =====================================================================
       Grade — grade de cor.

       TRÊS REGRAS que não são estilo, são arquitetura:

       1. A grade se aplica À CAMADA 3 APENAS (.anim-stage e o SVG). Nunca à
          <section>, jamais ao body. `filter` cria contexto de empilhamento e
          bloco de contenção: aplicada acima, descendente position:fixed passa
          a se posicionar pelo elemento filtrado (e o MIRA tem UI fixa em toda
          parte, inclusive o canvas de pintura), o título seria dessaturado
          junto com a cena (e lá vai o laranja da marca), e cada elemento
          filtrado vira camada de composição, multiplicada por N seções vivas.

       2. A grade é DO DECK, não da cena. A cena só desvia quando o desvio é
          evento narrativo, e entra como transição, nunca como salto.

       3. O GRÃO É ESTÁTICO. Grão animado quadro a quadro destrói a compressão
          na exportação para vídeo.
       ===================================================================== */
    var PRESETS = {
        'neutra':      { exposicao: 0,     contraste: 1,    saturacao: 1,    vinheta: 0,    grao: 0 },
        'noite-fria':  { exposicao: -0.30, contraste: 1.14, saturacao: 0.82, vinheta: 0.22, grao: 0.06 },
        'brasa':       { exposicao: -0.10, contraste: 1.10, saturacao: 1.06, vinheta: 0.18, grao: 0.05 },
        'clinica':     { exposicao: 0.05,  contraste: 1.06, saturacao: 0.94, vinheta: 0.10, grao: 0.03 },
        'penumbra':    { exposicao: -0.42, contraste: 1.20, saturacao: 0.76, vinheta: 0.30, grao: 0.07 }
    };

    var Grade = {
        presets: PRESETS,
        aplicar: function (cena, nome) {
            var p = typeof nome === 'string' ? PRESETS[nome] : nome;
            if (!p) { console.warn('[mira-cinema] grade desconhecida: ' + nome); return; }

            var alvo = cena.caixa;
            if (!alvo) return;

            /* brilho, contraste e saturação por filter do CSS: barato, e é
               subconjunto que qualquer navegador entrega */
            var css = 'brightness(' + (1 + p.exposicao).toFixed(3) + ') '
                + 'contrast(' + (p.contraste || 1).toFixed(3) + ') '
                + 'saturate(' + (p.saturacao != null ? p.saturacao : 1).toFixed(3) + ')';
            alvo.style.filter = css;

            /* vinheta: overlay em radial-gradient, custo zero, e ESTÁTICA */
            if (p.vinheta > 0) {
                var v = alvo.querySelector('.mc-vinheta');
                if (!v) {
                    v = document.createElement('div');
                    v.className = 'mc-vinheta';
                    v.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
                    if (getComputedStyle(alvo).position === 'static') alvo.style.position = 'relative';
                    alvo.appendChild(v);
                }
                v.style.background = 'radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,'
                    + p.vinheta.toFixed(2) + ') 100%)';
            }
            cena.grade = nome;
        }
    };

    /* =====================================================================
       Convivência com edição, edição livre e pintura.

       MECANISMO: MutationObserver sobre a classe do body. Os três módulos de
       autoria JÁ sinalizam estado por classe, o que foi verificado no código:
         mira-edit.js       -> me-on          (linhas 677 e 686)
         mira-edit-free.js  -> mef-on         (linha 909)
         mira-draw.js       -> md-on, md-has  (linhas 74 e 75)

       Nenhuma linha desses três arquivos precisa mudar, o que é o que mantém
       esta entrega aditiva.
       ===================================================================== */
    function tem(c) { return document.body.classList.contains(c); }
    function bloqueado() { return tem('mef-on') || tem('me-on'); }

    function reagirAoModo() {
        var edicaoLivre = tem('mef-on');
        var edicao = tem('me-on');
        var pintando = tem('md-on') || tem('md-has');

        for (var i = 0; i < PALCOS.length; i++) {
            var c = PALCOS[i];
            if (c._morta) continue;

            /* EDIÇÃO LIVRE é o conflito mais grave desta spec: uma timeline
               com repeat:-1 é dona do transform. O usuário arrasta, e a
               timeline sobrescreve no quadro seguinte. Sem esta pausa, a
               edição fica inutilizável. */
            if (edicaoLivre || edicao) {
                c.tl.pause();
                c._presaNaBase = true;
                c._congelada = false;
                aoTique(c);
                continue;
            }

            /* PINTURA: o traço vive em coordenadas de viewport. Câmera em
               movimento descola o traço do que estava embaixo. Só a CÂMERA
               congela; a timeline CONTINUA rodando, porque o problema é de
               coordenada, não de movimento. Segue congelada enquanto houver
               traço (md-has), não só enquanto md-on. */
            c._presaNaBase = false;
            c._congelada = pintando;

            /* ao sair de todos esses estados, a timeline retoma de onde parou */
            if (c._visivel && c.tl.paused()) c.tl.play();
        }
    }

    if (typeof MutationObserver === 'function') {
        new MutationObserver(reagirAoModo).observe(document.body, {
            attributes: true, attributeFilter: ['class']
        });
    }

    /* =====================================================================
       Ritmo — controle de velocidade POR SLIDE, tecla `A`.

       REGRA CENTRAL: não existe velocidade global. O [+] e o [-] alteram
       apenas o slide em tela, e cada slide guarda o seu próprio fator num
       marcador @MIRA:SPEED dentro da <section>.

       Por que por slide e não por deck: cada metáfora tem massa própria. Uma
       torre que desaba e uma maré que sobe não pedem o mesmo andamento, e um
       fator único forçaria as duas ao mesmo compasso.

       O mecanismo é cena.tl.timeScale(fator): vale a partir do quadro
       seguinte, SEM reiniciar e SEM salto, porque a timeline preserva o
       progresso e só muda a taxa.

       E o conjunto dos fatores do deck é TELEMETRIA DA DOUTRINA de
       temperamento: um slide em 0,7x é ajuste de caso; vinte slides em 0,7x
       é evidência de que o padrão `sereno` está rápido demais.
       ===================================================================== */
    var MIN = 0.4, MAX = 1.6, PASSO = 0.1;
    var MARCADOR = /@MIRA:SPEED\s+([0-9]*\.?[0-9]+)/;

    function secaoDe(el) { return el && el.closest ? el.closest('section') : null; }

    function lerMarcador(secao) {
        if (!secao) return 1;
        var achados = [];
        var it = document.createNodeIterator(secao, NodeFilter.SHOW_COMMENT);
        var n;
        while ((n = it.nextNode())) {
            var m = MARCADOR.exec(n.nodeValue || '');
            if (m) achados.push({ no: n, valor: parseFloat(m[1]) });
        }
        if (!achados.length) return 1;
        if (achados.length > 1) {
            console.warn('[mira-cinema] mais de um @MIRA:SPEED nesta <section>; vale o primeiro.');
        }
        var v = achados[0].valor;
        if (!isFinite(v)) {
            console.warn('[mira-cinema] @MIRA:SPEED não numérico; tratando como 1.0.');
            return 1;
        }
        if (v < MIN || v > MAX) {
            var fixo = Math.min(MAX, Math.max(MIN, v));
            console.warn('[mira-cinema] @MIRA:SPEED ' + v + ' fora da faixa ' + MIN + ' a ' + MAX
                + '; fixado em ' + fixo + '.');
            return fixo;
        }
        return v;
    }

    /* o slide ativo é o que o REGENTE considera ativo: mesmo critério do
       gatilho da animação, senão a barra ajustaria um slide e o usuário
       veria outro */
    function slideAtivo() {
        for (var i = 0; i < PALCOS.length; i++) {
            if (PALCOS[i]._visivel && PALCOS[i].slide) return PALCOS[i].slide;
        }
        return null;
    }
    function palcosDoSlide(secao) {
        var r = [];
        for (var i = 0; i < PALCOS.length; i++) {
            if (!PALCOS[i]._morta && PALCOS[i].slide === secao) r.push(PALCOS[i]);
        }
        return r;   /* se o slide tiver mais de um palco, o fator vale para todos */
    }

    function aplicarFator(secao, fator) {
        var alvos = palcosDoSlide(secao);
        for (var i = 0; i < alvos.length; i++) {
            alvos[i].fator = fator;
            alvos[i].tl.timeScale(fator);
        }
        return alvos.length;
    }

    var Ritmo = {
        MIN: MIN, MAX: MAX, PASSO: PASSO,
        ler: lerMarcador,
        /* aplica o marcador de cada <section> na carga. Slide sem marcador
           roda em 1.0, que é o comportamento de hoje. */
        hidratar: function () {
            var vistas = [];
            for (var i = 0; i < PALCOS.length; i++) {
                var s = PALCOS[i].slide;
                if (!s || vistas.indexOf(s) >= 0) continue;
                vistas.push(s);
                /* sempre por aplicarFator, para que TODOS os palcos do slide
                   fiquem com `fator` definido. O ramo que gravava só no
                   primeiro deixava os demais com `fator` undefined. */
                aplicarFator(s, lerMarcador(s));
            }
        },
        fatorDe: function (secao) {
            var a = palcosDoSlide(secao);
            return a.length ? (a[0].fator || 1) : 1;
        },
        ajustar: function (delta) {
            var s = slideAtivo();
            if (!s) return null;
            var atual = Ritmo.fatorDe(s);
            var novo = Math.round((atual + delta) * 10) / 10;
            novo = Math.min(MAX, Math.max(MIN, novo));
            var n = aplicarFator(s, novo);
            pintarBarra();
            return { secao: s, fator: novo, palcos: n };
        }
    };

    /* ---- barra, no mesmo padrão de E e P ------------------------------- */
    var barra = null, campoFator = null, campoSlide = null, aberta = false;

    function montarBarra() {
        if (barra) return;
        var css = document.createElement('style');
        css.textContent =
            '#mc-ritmo{position:fixed;left:50%;bottom:18px;transform:translate(-50%,140%);'
            + 'z-index:99000;display:flex;align-items:center;gap:10px;padding:8px 12px;'
            + 'background:rgba(6,9,15,.94);border:1px solid rgba(255,144,77,.45);border-radius:8px;'
            + 'font:600 13px/1.2 ui-monospace,Consolas,monospace;color:#fff;opacity:0;'
            + 'transition:transform .18s ease,opacity .18s ease;pointer-events:none}'
            + 'body.mc-ritmo-on #mc-ritmo{transform:translate(-50%,0);opacity:1;pointer-events:auto}'
            + '#mc-ritmo button{width:26px;height:26px;border-radius:5px;border:1px solid #39445c;'
            + 'background:#1b2130;color:#fff;font:700 15px/1 monospace;cursor:pointer}'
            + '#mc-ritmo button:disabled{opacity:.35;cursor:default}'
            + '#mc-ritmo .mc-slide{opacity:.6;font-weight:400}';
        document.head.appendChild(css);

        barra = document.createElement('div');
        barra.id = 'mc-ritmo';
        barra.innerHTML = '<button type="button" data-d="-1">−</button>'
            + '<span class="mc-fator">1.0x</span>'
            + '<button type="button" data-d="1">+</button>'
            + '<span class="mc-slide">—</span>';
        document.body.appendChild(barra);
        campoFator = barra.querySelector('.mc-fator');
        campoSlide = barra.querySelector('.mc-slide');

        barra.addEventListener('click', function (e) {
            var b = e.target.closest('button');
            if (!b) return;
            Ritmo.ajustar(parseFloat(b.getAttribute('data-d')) * PASSO);
        });
    }

    function pintarBarra() {
        if (!barra) return;
        var s = slideAtivo();
        if (!s) {
            campoFator.textContent = '—';
            campoSlide.textContent = 'nenhum palco no slide ativo';
            barra.querySelectorAll('button').forEach(function (b) { b.disabled = true; });
            return;
        }
        var f = Ritmo.fatorDe(s);
        campoFator.textContent = f.toFixed(1) + 'x';
        var secoes = Array.prototype.slice.call(document.querySelectorAll('body > section'));
        campoSlide.textContent = 'slide ' + (secoes.indexOf(s) + 1);
        barra.querySelectorAll('button').forEach(function (b) {
            var d = parseFloat(b.getAttribute('data-d'));
            b.disabled = (d > 0 && f >= MAX) || (d < 0 && f <= MIN);
        });
    }

    function alternarBarra(estado) {
        montarBarra();
        aberta = (typeof estado === 'boolean') ? estado : !aberta;
        document.body.classList.toggle('mc-ritmo-on', aberta);
        if (aberta) pintarBarra();
    }

    /* tecla A. Em uso hoje: E (edição), P (pintura), Z (desfazer), C
       (espelhamento da câmera), R (gravação). A está livre. */
    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        var t = e.target;
        if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName || ''))) return;
        if (e.key === 'a' || e.key === 'A') { e.preventDefault(); alternarBarra(); }
        else if (e.key === 'Escape' && aberta) { alternarBarra(false); }
    });

    /* aplica os marcadores assim que os palcos existirem */
    if (document.readyState === 'complete') setTimeout(function () { Ritmo.hidratar(); }, 0);
    else window.addEventListener('load', function () { setTimeout(function () { Ritmo.hidratar(); }, 0); });

    /* ---------------------------------------------------------------------
       Exposição pública.
       API em português, seguindo o que já existe nos templates: palco,
       casar, reger, quadro, cor.
       --------------------------------------------------------------------- */
    window.MiraCinema = {
        palco: palco,
        Cam: Cam,
        Prof: Prof,
        Grade: Grade,
        Ritmo: Ritmo,
        palcos: PALCOS,
        versao: '1.0.0'
    };
    /* atalhos, porque a animação do slide escreve Cam.aproximar(...) e não
       MiraCinema.Cam.aproximar(...) */
    window.Cam = Cam;
    window.Prof = Prof;
    window.Grade = Grade;
})();
