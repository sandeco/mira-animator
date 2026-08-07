/* =====================================================================
   mira-foco.js — MODO CAMERA, tecla C.  PROTOTIPO PARA TESTE.

   Ainda NAO e peca do Mira: vive so neste deck, para provar a ideia
   antes de entrar em templates/authoring/. Nao toca em nenhuma linha
   do mira-cinema.js, do mira-edit.js nem do mira-draw.js.

   O QUE RESOLVE
   Tres bugs de camera apareceram na mesma tarde, todos invisiveis no
   codigo e obvios na tela:
     1. cue apontando para grupo que se move (getBBox medido no load,
        camera voa para um canto vazio);
     2. plano de ator em z baixo (colado na lente, escapa do quadro);
     3. zoom que enquadra regiao sem nada dentro.
   O modo camera torna os tres erros de AUTORIA, detectados na hora.

   O DESENHO
   - a bolinha E O QUADRO, nao um ponto: ela declara a regiao que vai
     preencher a tela. Bolinha pequena, zoom forte;
   - o numero dentro dela e a ORDEM dos cues;
   - duas caixinhas na bolinha selecionada: beat de entrada e duracao
     em beats. Ciclo e numero da CENA, entao fica na barra;
   - cor e veredito: laranja ok, VERMELHO quando o retangulo nao tem
     nenhum elemento dentro, AMARELO quando dois focos se sobrepoem
     no tempo;
   - nao existe bolinha para o quadro base: toda cena comeca e volta
     para ele, e isso e implicito.

   TECLA
   C esta livre: nenhum outro modulo do deck (edicao, edicao livre,
   pintura) escuta o C sozinho. Era Z de zoom, e o nome ficou pequeno
   quando o tremor entrou no painel: zoom virou UM tipo de cue, nao o
   assunto do modo.
   ===================================================================== */
(function () {
    'use strict';

    /* deck sem cinema nao tem camera, logo nao tem o que focar */
    if (!window.MiraCinema || !window.gsap || !window.Cam) return;

    var MIN_R = 45, MAX_R = 520;
    var LARANJA = '#FF904D', AMARELO = '#FFC766', VERMELHO = '#ff5f52';

    /* ---------- os tipos de cue ----------
       `quadro: true` significa que o cue ENQUADRA uma regiao, e por isso
       tem bolinha na tela: centro e tamanho sao a propria definicao dele.
       Tremor e tensao nao enquadram nada, sacodem o quadro onde ele
       estiver. Bolinha neles seria mentira desenhada, entao eles nao tem
       nenhuma, e o que os define e um numero, a amplitude.

       `cor` e a identidade do tipo na regua. Cada efeito tem a sua, e ela
       nao muda com o veredito: problema aparece como CONTORNO vermelho por
       cima, senao a cor deixaria de dizer que efeito e aquele, que e a
       unica coisa que ela precisa dizer numa regua de quatro pistas. */
    var TIPOS = [
        { id: 'aproximar', nome: 'zoom',       ic: 'lupa',  cor: '#FF904D', quadro: true },
        { id: 'revelar',   nome: 'travelling', ic: 'pan',   cor: '#5FB8F5', quadro: true },
        { id: 'tremor',    nome: 'tremor',     ic: 'pulso', cor: '#FF6E8A', quadro: false },
        { id: 'tensao',    nome: 'tensao',     ic: 'onda',  cor: '#B98CF0', quadro: false }
    ];
    function tipoDe(id) {
        for (var i = 0; i < TIPOS.length; i++) if (TIPOS[i].id === id) return TIPOS[i];
        return TIPOS[0];
    }

    /* estado por palco, na memoria. Loop e volta ao quadro base nascem
       DESMARCADOS por decisao do autor em 2026-08-06: quem quiser liga na
       tecla L e salva no marcador.
 A persistencia sai pelo botao Copiar,
       que gera os marcadores @MIRA:FOCO para o texto-fonte. */
    var mundos = {};
    var ativo = false, sel = -1, palco = null, camada = null;
    var painel = null, barra = null, saida = null;
    /* agulha: posicao 0..1 do ciclo. Vive fora do desenhar() porque a barra
       e reconstruida a cada redesenho e a agulha nao pode voltar para o zero
       toda vez que um bloco e arrastado. Sao varias, uma por pista. */
    var agulhas = [], relogio = null, agulhaP = 0;

    /* loop: true e o padrao, e nao e detalhe. O mira-cinema cria toda
       timeline com repeat:-1 (a Regra Zero: cena nao congela). Este estado
       e aplicado no load, entao um padrao `false` aqui DESLIGAVA o loop de
       todo slide de todo deck, calado, atropelando o motor. Era o defeito
       real: a cena rodava uma vez e parava no ultimo quadro, e nem o F5
       resolvia, porque a aplicacao se repete a cada carga. Slide que
       precisa parar no ultimo quadro declara `@MIRA:LOOP off`. */
    function estadoDe(cena) {
        if (!mundos[cena.id]) {
            mundos[cena.id] = { focos: [], ciclo: +(cena.tl.duration().toFixed(1)) || 12, beats: 5, loop: true, volta: false, passo: false };
            lerMarcadores(cena, mundos[cena.id]);
        }
        return mundos[cena.id];
    }

    /* le @MIRA:FOCO n cx= cy= r= beat= dur= tipo= de dentro da <section> */
    function lerMarcadores(cena, est) {
        if (!cena.slide) return;
        var it = document.createNodeIterator(cena.slide, NodeFilter.SHOW_COMMENT), n;
        while ((n = it.nextNode())) {
            var v = n.nodeValue || '';
            var ps = /@MIRA:PASSO\s+(on|off)/.exec(v);
            if (ps) { est.passo = (ps[1] === 'on'); continue; }
            var vt = /@MIRA:VOLTA\s+(on|off)/.exec(v);
            if (vt) { est.volta = (vt[1] === 'on'); continue; }
            var lp = /@MIRA:LOOP\s+(on|off)/.exec(v);
            if (lp) { est.loop = (lp[1] === 'on'); continue; }
            var c = /@MIRA:CICLO\s+([\d.]+)\s+BEATS\s+(\d+)/.exec(v);
            if (c) { est.ciclo = parseFloat(c[1]); est.beats = parseInt(c[2], 10); continue; }
            /* campo a campo, e nao um regex unico: tremor e tensao nao
               escrevem cx/cy/r, e zoom e travelling nao escrevem amp. Um
               regex com todos os campos obrigatorios so casaria com um dos
               dois formatos, e o outro sumiria calado na leitura.

               O `(?:^|\s)` antes da chave nao e enfeite: sem ele, procurar
               `r=` acha o "r=" de dentro de `dur=`, e todo cue voltaria do
               arquivo com o raio errado. */
            if (/@MIRA:FOCO\b/.test(v)) {
                var num = function (chave, padrao) {
                    var r = new RegExp('(?:^|\\s)' + chave + '=(-?[\\d.]+)').exec(v);
                    return r ? parseFloat(r[1]) : padrao;
                };
                var tp = /(?:^|\s)tipo=(\w+)/.exec(v);
                var id = tp ? tp[1] : 'aproximar';
                est.focos.push({
                    cx: num('cx', 480), cy: num('cy', 230), r: num('r', 220),
                    amp: num('amp', id === 'tremor' ? 0.006 : 0.003),
                    beat: num('beat', 0), dur: num('dur', 1),
                    tipo: id, razao: ''
                });
            }
        }
        est.focos.sort(function (a, b) { return a.beat - b.beat; });
    }

    /* ---------- geometria ---------- */
    function conformar(c, prop) {
        var p = c.w / c.h, w = c.w, h = c.h;
        if (p < prop) w = h * prop; else h = w / prop;
        return { x: c.x - (w - c.w) / 2, y: c.y - (h - c.h) / 2, w: w, h: h };
    }
    function quadroDe(cena, f) {
        return conformar({ x: f.cx - f.r, y: f.cy - f.r, w: f.r * 2, h: f.r * 2 },
            cena.proporcao || (cena.base.w / cena.base.h));
    }
    function fator(cena, f) { return cena.base.w / quadroDe(cena, f).w; }
    function k(cena) {
        var r = cena.caixa.getBoundingClientRect();
        return r.width / cena.base.w;
    }

    /* ---------- vereditos ----------
       (a) o retangulo tem alguma coisa dentro?
       O teste roda com a camera TRAVADA NA BASE, entao os planos estao
       sem translate e o getBBox de cada elemento ja esta em coordenada
       de base: e por isso que o modo precisa travar a camera. */
    function conteudoDentro(cena, f) {
        var q = quadroDe(cena, f);
        var alvos = cena.svg.querySelectorAll('text,[data-mira-traco-fixo],[data-mira-texto-fixo]');
        for (var i = 0; i < alvos.length; i++) {
            var b;
            try { b = alvos[i].getBBox(); } catch (e) { continue; }
            if (!b.width || !b.height) continue;
            if (b.x + b.width > q.x && b.x < q.x + q.w
                && b.y + b.height > q.y && b.y < q.y + q.h) return true;
        }
        return false;
    }
    /* (b) dois cues disputando o MESMO canal no mesmo intervalo.

       So conta entre cues do mesmo tipo. Efeitos de tipos diferentes rodam
       somados de proposito (cada um escreve num canal proprio no motor:
       camera, abalo, tensao), entao tensao sustentada com um tremor por
       cima durante um zoom nao e conflito, e uma frase de camera comum. O
       conflito real e dois zooms disputando o enquadramento, ou dois
       tremores disputando o mesmo canal de abalo. */
    function sobrepoe(est, i) {
        var a = est.focos[i];
        for (var j = 0; j < est.focos.length; j++) {
            if (j === i) continue;
            var b = est.focos[j];
            if (b.tipo !== a.tipo) continue;
            if (a.beat < b.beat + b.dur && b.beat < a.beat + a.dur) return true;
        }
        return false;
    }
    /* (c) forma opaca grande num plano de z baixo: colada na lente, ela
           cobre o quadro no primeiro movimento de camera */
    function planosSuspeitos(cena) {
        /* Ceu e horizonte em z baixo sao CORRETOS: e deles que o parallax
           nasce, e eles ficam ATRAS de tudo. O perigo e forma opaca grande
           num plano de z baixo que esteja NA FRENTE dos atores: colada na
           lente, ela cobre o quadro no primeiro movimento de camera.
           Logo o teste precisa da ordem no DOM, nao so do z. */
        var fora = [];
        var area = cena.base.w * cena.base.h;
        var filhos = Array.prototype.slice.call(cena.svg.children);

        /* o plano dos atores e o que tem mais texto: e onde os nomes de
           arquivo moram, e e o unico ancora confiavel sem convencao de id */
        var atores = -1, mais = 0;
        cena._planos.forEach(function (p) {
            var q = p.el.querySelectorAll('text').length;
            if (q > mais) { mais = q; atores = filhos.indexOf(p.el); }
        });
        if (atores < 0) return fora;

        cena._planos.forEach(function (p) {
            if (p.z >= 0.5) return;
            if (filhos.indexOf(p.el) < atores) return;   /* esta atras: ok */
            var b;
            try { b = p.el.getBBox(); } catch (e) { return; }
            if (b.width * b.height > area * 0.35) {
                fora.push((p.el.id || 'plano') + ' na frente em z=' + p.z);
            }
        });
        return fora;
    }

    /* a cor diz o TIPO, sempre. O veredito sai por fora, no contorno. */
    function corDe(cena, est, i) {
        return tipoDe(est.focos[i].tipo).cor;
    }

    /* null quando esta tudo certo; senao o motivo, que vira contorno e frase */
    function problemaDe(cena, est, i) {
        var f = est.focos[i];
        if (tipoDe(f.tipo).quadro && !conteudoDentro(cena, f)) return 'enquadra o vazio';
        if (sobrepoe(est, i)) return 'se sobrepoe a outro ' + tipoDe(f.tipo).nome;
        return null;
    }

    /* ---------- palco ativo ---------- */
    function ativoAgora() {
        var L = MiraCinema.palcos;
        for (var i = 0; i < L.length; i++) if (!L[i]._morta && L[i]._visivel) return L[i];
        return null;
    }

    /* trava a camera na base todo frame, enquanto o modo estiver ligado.
       Por que todo frame e nao uma vez: o mira-cinema reage a classe do
       body (E, P) e destrava sozinho. Reafirmar por tique e o unico jeito
       de nao brigar com ele sem editar o arquivo dele. */
    function manterParado() {
        if (!ativo || !palco || palco._morta) return;
        palco._presaNaBase = true;
        palco._congelada = false;
        if (!palco.tl.paused()) palco.tl.pause();
    }

    /* =================================================================
       CSS
       ================================================================= */
    /* ---------- icones: SVG inline, viewBox 24, stroke currentColor.
           Mesmo padrao do mira-edit.js e do mira-draw.js. ---------- */
    function icone(paths, tam) {
        return '<svg viewBox="0 0 24 24" width="' + (tam || 18) + '" height="' + (tam || 18)
            + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" '
            + 'stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>';
    }
    var IC = {
        alvo: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/>'
            + '<path d="M12 1v3M12 20v3M1 12h3M20 12h3"/>',
        mais: '<path d="M12 5v14M5 12h14"/>',
        play: '<path d="M6 4l14 8-14 8z"/>',
        salvar: '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>'
            + '<path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/>',
        lixo: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/>',
        loop: '<path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>'
            + '<path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
        volta: '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 5 5v6"/>',
        cima: '<path d="M18 15l-6-6-6 6"/>',
        baixo: '<path d="M6 9l6 6 6-6"/>',
        lupa: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/><path d="M11 8v6M8 11h6"/>',
        pan: '<path d="M2 12h20"/><path d="M6 8l-4 4 4 4"/><path d="M18 8l4 4-4 4"/>',
        ok: '<path d="M20 6 9 17l-5-5"/>',
        alerta: '<path d="M12 9v4"/><path d="M12 17h.01"/>'
            + '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>',
        fechar: '<path d="M18 6 6 18"/><path d="M6 6l12 12"/>',
        relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
        pulso: '<path d="M2 12h4l3-8 4 16 3-8h6"/>',
        onda: '<path d="M2 12c1.8-4.5 3.7-4.5 5.5 0s3.7 4.5 5.5 0 3.7-4.5 5.5 0"/>',
        entrada: '<path d="M4 4v16"/><path d="M9 12h11"/><path d="M16 8l4 4-4 4"/>',
        duracao: '<path d="M5 5v14M19 5v14"/><path d="M5 12h14"/>',
        passo: '<path d="M12 3v13"/><path d="M7 11l5 5 5-5"/><path d="M4 21h16"/>'
    };

    function estilo() {
        if (document.getElementById('mz-css')) return;
        var e = document.createElement('style');
        e.id = 'mz-css';
        e.textContent = [
            /* --- botao, no padrao .me-btn --- */
            '.mz-btn{display:inline-flex;align-items:center;gap:7px;',
            '  font:600 13px/1 Inter,system-ui,sans-serif;color:#fff;',
            '  background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);',
            '  padding:8px 12px;border-radius:10px;cursor:pointer;transition:all .18s ease}',
            '.mz-btn:hover{background:rgba(255,255,255,.12)}',
            '.mz-btn svg{flex:0 0 auto}',
            '.mz-btn.on{color:#101010;background:' + LARANJA + ';border-color:' + LARANJA + '}',
            '.mz-btn.on:hover{filter:brightness(1.08)}',
            '.mz-btn.mz-so-icone{padding:9px}',
            '.mz-tag{padding:0 4px}',
            /* --- barra unica do modo, no padrao #me-bar --- */
            '#mz-bar{position:fixed;left:50%;bottom:24px;transform:translateX(-50%) translateY(20px);',
            '  display:none;flex-direction:column;gap:10px;z-index:100000;padding:12px;',
            '  border-radius:16px;background:rgba(18,18,18,.86);backdrop-filter:blur(14px);',
            '  border:1px solid rgba(255,144,77,.35);box-shadow:0 18px 50px rgba(0,0,0,.5);',
            '  opacity:0;transition:opacity .25s ease,transform .25s ease;min-width:620px;',
            '  max-width:calc(100vw - 32px)}',
            '#mz-bar.on{display:flex;opacity:1;transform:translateX(-50%) translateY(0)}',
            '.mz-linha{display:flex;align-items:center;gap:10px;flex-wrap:wrap}',
            '.mz-tag{display:inline-flex;align-items:center;gap:7px;color:' + LARANJA + ';',
            '  font:700 12px/1 Inter,system-ui,sans-serif;letter-spacing:.5px;',
            '  text-transform:uppercase;padding:0 2px}',
            '.mz-sep{width:1px;height:22px;background:rgba(255,255,255,.14)}',
            '.mz-dica{color:rgba(255,255,255,.45);font:500 12px/1 Inter,system-ui,sans-serif}',
            /* --- numero com setas, no lugar do triangulo de texto --- */
            '.mz-num{display:inline-flex;align-items:center;gap:2px;padding:3px 4px 3px 9px;',
            '  border-radius:10px;background:rgba(255,255,255,.06);',
            '  border:1px solid rgba(255,255,255,.14)}',
            '.mz-num i{display:inline-flex;color:rgba(255,255,255,.5);margin-right:4px}',
            '.mz-num u{text-decoration:none;color:#fff;font:700 13px/1 ui-monospace,monospace;',
            '  min-width:30px;text-align:center;display:inline-block}',
            '.mz-num button{display:inline-flex;background:none;border:0;color:rgba(255,255,255,.7);',
            '  cursor:pointer;padding:2px;border-radius:6px}',
            '.mz-num button:hover{background:rgba(255,255,255,.12);color:#fff}',
            /* --- slider 0 a 100 --- */
            '.mz-slice{display:inline-flex;align-items:center;gap:8px;padding:3px 10px;',
            '  border-radius:10px;background:rgba(255,255,255,.06);',
            '  border:1px solid rgba(255,255,255,.14)}',
            '.mz-slice i{display:inline-flex;color:rgba(255,255,255,.5)}',
            '.mz-slice u{text-decoration:none;color:#fff;font:700 12px/1 ui-monospace,monospace;',
            '  min-width:52px;text-align:right;display:inline-block}',
            '.mz-slice input[type=range]{-webkit-appearance:none;appearance:none;width:104px;',
            '  height:4px;border-radius:3px;background:rgba(255,255,255,.22);outline:none;',
            '  cursor:pointer;margin:0}',
            '.mz-slice input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;',
            '  appearance:none;width:14px;height:14px;border-radius:50%;background:' + LARANJA + ';',
            '  border:2px solid #101010;cursor:grab}',
            '.mz-slice input[type=range]::-moz-range-thumb{width:14px;height:14px;border-radius:50%;',
            '  background:' + LARANJA + ';border:2px solid #101010;cursor:grab}',
            /* --- pistas: uma por tipo de cue --- */
            '.mz-pistas{display:flex;flex-direction:column;gap:3px}',
            '.mz-pista{display:flex;align-items:center;gap:7px}',
            '.mz-guar{width:26px;height:20px;flex:0 0 26px;border-radius:6px}',
            '.mz-guar:hover{background:rgba(255,255,255,.12)}',
            '.mz-trilha{position:relative;flex:1;height:20px;border-radius:6px;overflow:hidden;',
            '  background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.10);',
            '  cursor:crosshair}',
            '.mz-trilha i{position:absolute;top:0;bottom:0;width:1px;background:rgba(255,255,255,.10)}',
            '.mz-seg{position:absolute;top:2px;height:16px;border-radius:5px;cursor:grab;',
            '  display:flex;align-items:center;justify-content:center;color:#101010;',
            '  font:700 10px/1 Inter,system-ui,sans-serif;touch-action:none;',
            '  box-shadow:inset 0 0 0 1px rgba(0,0,0,.18)}',
            '.mz-seg:active{cursor:grabbing}',
            '.mz-seg.sel{box-shadow:inset 0 0 0 2px #fff,0 0 0 1px rgba(0,0,0,.4)}',
            /* problema NAO repinta o bloco: a cor e a identidade do tipo e
               precisa sobreviver ao aviso. O veredito vira contorno. */
            '.mz-seg.mal{outline:2px solid ' + VERMELHO + ';outline-offset:1px}',
            '.mz-seg .p{position:absolute;top:0;bottom:0;width:8px;cursor:ew-resize;',
            '  touch-action:none}',
            '.mz-seg .p.e{left:-2px;border-radius:6px 0 0 6px}',
            '.mz-seg .p.d{right:-2px;border-radius:0 6px 6px 0}',
            '.mz-seg .p:hover{background:rgba(0,0,0,.22)}',

            /* --- agulha: onde a cena esta AGORA ---
               pointer-events:none de proposito. A agulha e fina, e se ela
               capturasse o ponteiro o arraste morreria toda vez que o mouse
               alcancasse a propria agulha. Quem escuta e a regua. */
            '.mz-agulha{position:absolute;top:0;bottom:0;width:2px;margin-left:-1px;',
            '  background:#fff;pointer-events:none;z-index:4;',
            '  box-shadow:0 0 0 1px rgba(0,0,0,.55),0 0 7px rgba(255,255,255,.55)}',
            '.mz-relogio{margin-left:auto;font:600 11px/1 ui-monospace,SFMono-Regular,monospace;',
            '  color:rgba(255,255,255,.72);letter-spacing:.02em;flex:0 0 auto}',
            /* --- aviso de veredito --- */
            '.mz-vered{display:flex;align-items:center;gap:7px;',
            '  font:500 12px/1.3 Inter,system-ui,sans-serif}',
            '.mz-vered.bom{color:#8ecf9a}',
            '.mz-vered.ruim{color:' + VERMELHO + '}',
            /* --- camada e bolinhas --- */
            '.mz-camada{position:absolute;inset:0;z-index:9000;pointer-events:none}',
            '.mz-quadro{position:absolute;border:2px solid ' + AMARELO + ';border-radius:4px;',
            '  box-shadow:0 0 0 9999px rgba(0,0,0,.62);pointer-events:none}',
            '.mz-quadro b{position:absolute;left:-1px;top:-27px;display:inline-flex;',
            '  align-items:center;gap:6px;font:700 11px/1 Inter,system-ui,sans-serif;',
            '  color:#101010;background:' + AMARELO + ';padding:4px 8px;border-radius:7px}',
            '.mz-bola{position:absolute;border-radius:50%;border:2px solid ' + LARANJA + ';',
            '  background:radial-gradient(circle,rgba(255,144,77,.20),rgba(255,144,77,.05) 70%);',
            '  cursor:grab;display:flex;align-items:center;justify-content:center;',
            '  flex-direction:column;color:#fff;user-select:none;touch-action:none;',
            '  pointer-events:auto;transition:border-width .12s ease}',
            '.mz-bola:active{cursor:grabbing}',
            '.mz-bola.sel{border-width:3px}',
            '.mz-bola b{font:700 20px/1 Inter,system-ui,sans-serif}',
            '.mz-bola span{font:600 10px/1.5 ui-monospace,monospace;opacity:.7}',
            '.mz-anel{position:absolute;right:-7px;top:50%;width:14px;height:14px;margin-top:-7px;',
            '  border-radius:50%;background:' + LARANJA + ';border:2px solid rgba(18,18,18,.9);',
            '  cursor:ew-resize;touch-action:none;pointer-events:auto}',
            /* --- painel da bolinha selecionada --- */
            '.mz-cx{position:fixed;z-index:100100;display:none;align-items:center;gap:8px;',
            '  padding:8px;border-radius:14px;background:rgba(18,18,18,.92);',
            '  backdrop-filter:blur(14px);border:1px solid rgba(255,144,77,.4);',
            '  box-shadow:0 14px 36px rgba(0,0,0,.5)}',
            '.mz-cx.on{display:flex}',
            /* --- toast, no padrao #me-toast --- */
            '#mz-toast{position:fixed;right:20px;bottom:24px;z-index:100200;display:flex;',
            '  align-items:center;gap:9px;padding:11px 14px;border-radius:12px;color:#fff;',
            '  font:600 12px/1.3 Inter,system-ui,sans-serif;background:rgba(18,18,18,.92);',
            '  backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.16);',
            '  box-shadow:0 14px 36px rgba(0,0,0,.5);opacity:0;transform:translateY(8px);',
            '  transition:opacity .2s ease,transform .2s ease;pointer-events:none}',
            '#mz-toast.on{opacity:1;transform:translateY(0)}',
            '#mz-toast.ok{border-color:rgba(255,144,77,.5)}',
            '#mz-toast.ok svg{color:' + LARANJA + '}',
            '#mz-toast.err{border-color:rgba(255,90,90,.6)}',
            '#mz-toast.err svg{color:' + VERMELHO + '}',
            '#mz-passo{position:fixed;right:20px;top:20px;z-index:100200;display:none;',
            '  align-items:center;gap:8px;padding:8px 12px;border-radius:12px;color:#fff;',
            '  background:rgba(18,18,18,.9);backdrop-filter:blur(14px);',
            '  border:1px solid rgba(255,144,77,.4);box-shadow:0 10px 30px rgba(0,0,0,.45);',
            '  font:700 13px/1 ui-monospace,monospace;pointer-events:none}',
            '#mz-passo.on{display:flex}',
            '#mz-passo svg{color:' + LARANJA + '}',
            '#mz-passo em{font:500 11px/1 Inter,system-ui,sans-serif;font-style:normal;',
            '  color:rgba(255,255,255,.5)}',
            '.mz-textarea{width:100%;height:70px;display:none;padding:8px;border-radius:10px;',
            '  background:rgba(0,0,0,.4);color:rgba(255,255,255,.8);',
            '  border:1px solid rgba(255,255,255,.14);',
            '  font:400 11px/1.55 ui-monospace,Consolas,monospace;resize:none}',
            '.mz-textarea.on{display:block}'
        ].join('');
        document.head.appendChild(e);
    }

    /* botao SO DE ICONE. O rotulo existe, mas vive no title: o autor pediu
       comando limpo, e texto em botao de barra flutuante e o que mais suja. */
    function botao(ic, dica, aoClicar, ligado) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'mz-btn mz-so-icone' + (ligado ? ' on' : '');
        b.innerHTML = icone(ic, 18);
        if (dica) { b.title = dica; b.setAttribute('aria-label', dica); }
        b.onclick = aoClicar;
        return b;
    }

    /* =================================================================
       UI
       ================================================================= */
    /* ---------- slider 0 a 100 ----------
       Abalo nao tem unidade que o autor carregue na cabeca: "0,006 da
       largura do quadro" e "250 ms" nao se comparam com nada. Numa escala
       de 0 a 100 o gesto e direto, fraco de um lado, forte do outro, e o
       valor real fica com o modulo. O rotulo mostra a unidade de verdade
       ao lado, para quem quiser conferir.

       `aoVivo` dispara a cada quadro do arraste: sem isso o controle parece
       morto, porque o painel mantem a cena parada e nada se move enquanto
       se ajusta. */
    function deslize(ic, dica, get, set, rotulo, aoVivo) {
        var w = document.createElement('div');
        w.className = 'mz-slice';
        w.title = dica;
        w.innerHTML = '<i>' + icone(ic, 15) + '</i>';
        var faixa = document.createElement('input');
        faixa.type = 'range';
        faixa.min = 0; faixa.max = 100; faixa.step = 1;
        faixa.value = get();
        var eco = document.createElement('u');
        function pinta() { eco.textContent = rotulo(); }
        faixa.addEventListener('input', function () {
            set(+faixa.value);
            pinta();
            if (aoVivo) aoVivo();
        });
        /* o redesenho completo so ao SOLTAR: durante o arraste ele
           reconstruiria o proprio slider debaixo do dedo */
        faixa.addEventListener('change', function () { desenhar(); });
        w.appendChild(faixa); w.appendChild(eco);
        pinta();
        return w;
    }

    function spin(ic, dica, get, set) {
        var w = document.createElement('div');
        w.className = 'mz-num';
        w.title = dica;
        w.innerHTML = '<i>' + icone(ic, 15) + '</i>';
        var menos = document.createElement('button');
        menos.type = 'button';
        menos.innerHTML = icone(IC.baixo, 14);
        var campo = document.createElement('u');
        var mais = document.createElement('button');
        mais.type = 'button';
        mais.innerHTML = icone(IC.cima, 14);
        w.appendChild(menos); w.appendChild(campo); w.appendChild(mais);
        function pinta() { campo.textContent = get(); }
        menos.onclick = function () { set(-1); pinta(); desenhar(); };
        mais.onclick = function () { set(1); pinta(); desenhar(); };
        pinta();
        return w;
    }

    function montarUI() {
        estilo();
        painel = document.createElement('div');
        painel.className = 'mz-cx';
        document.body.appendChild(painel);

        barra = document.createElement('div');
        barra.id = 'mz-bar';
        document.body.appendChild(barra);
    }

    /* ---------- previa do abalo ----------
       O painel mantem a cena PARADA, entao mexer na intensidade nao movia
       nada e o controle parecia quebrado. Era o defeito de verdade, nao a
       calibragem: sem retorno na tela, qualquer numero parece nao fazer
       nada.

       A previa e uma tween SOLTA, fora da cena.tl. Isso e o que a faz rodar
       com a timeline pausada: quem esta parado e a linha do tempo da cena,
       nao o relogio do GSAP. E o tique do mira-cinema escreve o viewBox
       todo quadro mesmo no modo camera, entao o abalo aparece.

       Fora da cena.tl tambem significa fora do alcance do limparCamera, por
       isso a referencia fica guardada e e morta na mao. */
    var previa = null;
    function matarPrevia() {
        if (previa) { previa.kill(); previa = null; }
        if (palco && palco.abalo) { palco.abalo.x = 0; palco.abalo.y = 0; }
        if (palco && palco.tensao) { palco.tensao.x = 0; palco.tensao.y = 0; }
    }
    function previaAbalo(f) {
        if (!palco || palco._morta) return;
        matarPrevia();
        var est = estadoDe(palco);
        var spb = est.ciclo / est.beats;
        var o = {
            razao: 'previa do painel de camera',
            dur: f.dur * spb,
            amplitude: f.amp
        };
        previa = (f.tipo === 'tremor') ? Cam.tremor(palco, o) : Cam.tensao(palco, o);
    }

    function desenharPainel(est) {
        painel.innerHTML = '';
        if (sel < 0 || !est.focos[sel]) { painel.classList.remove('on'); return; }
        var f = est.focos[sel];
        painel.classList.add('on');

        var T = tipoDe(f.tipo);

        var tag = document.createElement('span');
        tag.className = 'mz-tag';
        tag.title = T.nome + ' selecionado';
        tag.style.color = T.cor;
        tag.innerHTML = icone(IC[T.ic], 15) + '<span>' + (sel + 1) + '</span>';
        painel.appendChild(tag);

        /* beat e duracao saem daqui: quem define tempo agora e a pista,
           arrastando o bloco. Dois campos a menos no painel.

           O tipo tambem saiu: agora ele e a PISTA em que o cue mora, e
           trocar de tipo pelo painel faria o bloco pular de pista debaixo
           do dedo. Para mudar de tipo, apaga e cria na pista certa. */
        var sp = document.createElement('span');
        sp.className = 'mz-sep';
        painel.appendChild(sp);

        if (!T.quadro) {
            var spb = est.ciclo / est.beats;
            /* tetos bem separados: no maximo, tensao tem pouco mais de um
               quarto da forca do tremor. E o que impede a tensao de virar
               tremor longo, que e o erro facil de cometer no slider. */
            var tetoAmp = f.tipo === 'tremor' ? 0.03 : 0.008;
            var durMin = f.tipo === 'tremor' ? 0.05 : 0.25;
            var durMax = f.tipo === 'tremor' ? 1.2 : est.ciclo;

            /* INTENSIDADE. 0 a 100 mapeado no teto do tipo. O teto de cada
               um e diferente porque sao efeitos diferentes: tremor precisa
               chegar a pancada, tensao nunca deve passar de inquietacao. */
            painel.appendChild(deslize(IC[T.ic], 'intensidade do ' + T.nome,
                function () { return Math.round((f.amp || 0) / tetoAmp * 100); },
                function (v) { f.amp = +(v / 100 * tetoAmp).toFixed(4); },
                function () { return Math.round((f.amp || 0) / tetoAmp * 100); },
                function () { previaAbalo(f); }));

            /* DURACAO. Tambem 0 a 100, sobre a faixa util do tipo.

               O bloco na pista sozinho nunca deu esse controle: com ciclo de
               16 s em 5 beats, um passo da grade e 800 ms, e o tremor
               inteiro vive entre 50 e 400 ms. A faixa util toda cabia dentro
               de UM passo da grade.

               `f.dur` continua em beats, fonte unica: o slider so converte.
               Assim o bloco na pista acompanha o controle e nunca mente
               sobre o tamanho do efeito. */
            painel.appendChild(deslize(IC.relogio, 'quanto tempo fica tenso',
                function () {
                    return Math.round((f.dur * spb - durMin) / (durMax - durMin) * 100);
                },
                function (v) {
                    var seg = durMin + v / 100 * (durMax - durMin);
                    f.dur = +(seg / spb).toFixed(4);
                },
                function () {
                    var ms = f.dur * spb;
                    return ms < 1 ? (Math.round(ms * 1000) + 'ms') : (ms.toFixed(1) + 's');
                },
                function () { previaAbalo(f); }));
        }

        painel.appendChild(botao(IC.lixo, '', function () {
            est.focos.splice(sel, 1); sel = -1; desenhar();
        }));

        var cx = palco.caixa.getBoundingClientRect();
        var largura = 430;
        var esq, topo;
        if (T.quadro) {
            var esc = k(palco);
            esq = cx.left + f.cx * esc - largura / 2;
            topo = cx.top + (f.cy - f.r) * esc - 62;
        } else {
            /* sem bolinha nao ha onde ancorar: o painel vai para o alto do
               palco, centrado, que e onde ele nao cobre o que esta em cena */
            esq = cx.left + cx.width / 2 - largura / 2;
            topo = cx.top + 14;
        }
        esq = Math.max(12, Math.min(window.innerWidth - largura - 12, esq));
        painel.style.left = Math.round(esq) + 'px';
        painel.style.top = Math.round(Math.max(12, topo)) + 'px';
    }

    function desenharBarra(est) {
        barra.innerHTML = '';
        barra.classList.add('on');

        var l1 = document.createElement('div');
        l1.className = 'mz-linha';

        var tag = document.createElement('span');
        tag.className = 'mz-tag';
        tag.title = 'modo camera';
        tag.innerHTML = icone(IC.alvo, 17);
        l1.appendChild(tag);

        l1.appendChild(botao(IC.play, 'rodar', prever));

        var s1 = document.createElement('span'); s1.className = 'mz-sep'; l1.appendChild(s1);

        l1.appendChild(spin(IC.relogio, 'ciclo em segundos', function () { return est.ciclo; }, function (d) {
            est.ciclo = Math.max(3, +(est.ciclo + d).toFixed(1));
        }));
        l1.appendChild(spin(IC.pulso, 'numero de beats', function () { return est.beats; }, function (d) {
            est.beats = Math.max(2, Math.min(9, est.beats + d));
        }));

        var s2 = document.createElement('span'); s2.className = 'mz-sep'; l1.appendChild(s2);

        /* loop e volta vivem AQUI, na mesma barra: dois paineis separados
           era metade da sujeira que o autor apontou */
        l1.appendChild(botao(IC.loop, 'loop', function () {
            est.loop = !est.loop; aplicarLoop(palco, est); desenhar();
        }, est.loop));
        l1.appendChild(botao(IC.passo, 'avancar por beat na seta para baixo', function () {
            est.passo = !est.passo;
            aplicarPasso(palco, est);
            desenhar();
            aviso(est.passo
                ? ('seta avanca 1 de ' + est.beats + ' beats, depois troca de slide')
                : 'a cena volta a rodar sozinha');
        }, est.passo));
        l1.appendChild(botao(IC.volta, 'volta ao base', function () {
            est.volta = !est.volta;
            montarCamera(palco, est);
            palco.tl.time(0);
            if (!est.volta) aviso('sem volta ao base o corte do loop pode aparecer');
            desenhar();
        }, est.volta));

        var s3 = document.createElement('span'); s3.className = 'mz-sep'; l1.appendChild(s3);
        l1.appendChild(botao(IC.salvar, 'salvar', salvar));
        l1.appendChild(botao(IC.fechar, '', desligar));
        barra.appendChild(l1);

        /* ---------- as pistas ----------
           UMA POR TIPO, empilhadas, como trilha de editor de video. Regua
           unica obrigava um efeito por instante: dois blocos no mesmo tempo
           viravam conflito visual mesmo quando o motor os soma sem briga
           nenhuma. Separadas, sobrepor no tempo passa a ser o gesto normal,
           que e o que se quer de camera.

           Cada pista tem um botao de tipo na guarita da esquerda: clicar
           cria um cue DAQUELE tipo, ja no ponto onde a agulha esta. E onde
           o autor esta olhando, entao e onde o cue deve nascer. */
        agulhas = [];
        var pistas = document.createElement('div');
        pistas.className = 'mz-pistas';

        TIPOS.forEach(function (T) {
            var pista = document.createElement('div');
            pista.className = 'mz-pista';

            var guar = botao(IC[T.ic], T.nome + ': clique para criar no ponto da agulha', function () {
                novoCue(est, T);
            });
            guar.className += ' mz-guar';
            guar.style.color = T.cor;
            pista.appendChild(guar);

            var trilha = document.createElement('div');
            trilha.className = 'mz-trilha';
            for (var b = 1; b < est.beats; b++) {
                var m = document.createElement('i');
                m.style.left = (b / est.beats * 100) + '%';
                trilha.appendChild(m);
            }

            est.focos.forEach(function (f, i) {
                if (f.tipo !== T.id) return;
                var mal = problemaDe(palco, est, i);
                var g = document.createElement('div');
                g.className = 'mz-seg' + (i === sel ? ' sel' : '') + (mal ? ' mal' : '');
                g.style.left = (f.beat / est.beats * 100) + '%';
                g.style.width = Math.max(4, f.dur / est.beats * 100) + '%';
                g.style.background = corDe(palco, est, i);
                /* abalo se le em tempo, nao em beat: a duracao dele e menor
                   que um beat inteiro e "0,078 beat" nao diz nada a ninguem */
                var spbT = est.ciclo / est.beats;
                g.title = T.nome + ' ' + (i + 1) + ' · ' + (f.beat * spbT).toFixed(2) + 's'
                    + ' por ' + (T.quadro ? (f.dur + ' beat') : (Math.round(f.dur * spbT * 1000) + ' ms'))
                    + (mal ? ' · ' + mal : '')
                    + ' · arraste para mover, bordas para redimensionar';

                var rot = document.createElement('span');
                rot.textContent = (i + 1);
                g.appendChild(rot);

                var ae = document.createElement('span');
                ae.className = 'p e';
                var ad = document.createElement('span');
                ad.className = 'p d';
                g.appendChild(ae); g.appendChild(ad);

                g.addEventListener('pointerdown', function (e) {
                    if (e.target === ae || e.target === ad) return;
                    sel = i; desenharBolas(est); desenharPainel(est);
                    arrastarSeg(e, est, f, 'mover', g, trilha);
                });
                ae.addEventListener('pointerdown', function (e) {
                    sel = i; arrastarSeg(e, est, f, 'inicio', g, trilha);
                });
                ad.addEventListener('pointerdown', function (e) {
                    sel = i; arrastarSeg(e, est, f, 'fim', g, trilha);
                });
                trilha.appendChild(g);
            });

            /* uma agulha por pista, mesma porcentagem: empilhadas elas leem
               como UMA linha vertical so, sem nenhuma conta de offset da
               guarita, que e o que uma agulha unica exigiria */
            var ag = document.createElement('div');
            ag.className = 'mz-agulha';
            trilha.appendChild(ag);
            agulhas.push(ag);

            trilha.addEventListener('pointerdown', function (e) {
                if (e.target.closest && e.target.closest('.mz-seg')) return;
                arrastarAgulha(e, est, trilha);
            });

            pista.appendChild(trilha);
            pistas.appendChild(pista);
        });
        barra.appendChild(pistas);

        /* veredito */
        var avisos = [];
        est.focos.forEach(function (f, i) {
            var mal = problemaDe(palco, est, i);
            if (mal) avisos.push(tipoDe(f.tipo).nome + ' ' + (i + 1) + ' ' + mal);
        });
        planosSuspeitos(palco).forEach(function (p) {
            avisos.push('forma grande em z baixo: ' + p + ' vai cobrir o quadro');
        });
        var l2 = document.createElement('div');
        l2.className = 'mz-vered ' + (avisos.length ? 'ruim' : 'bom');
        l2.innerHTML = icone(avisos.length ? IC.alerta : IC.ok, 15)
            + '<span>' + (avisos.length ? avisos.join(' · ')
                : 'uma pista por efeito, podem coexistir · icone da esquerda cria no ponto da agulha · Ctrl+S salva') + '</span>';
        relogio = document.createElement('span');
        relogio.className = 'mz-relogio';
        l2.appendChild(relogio);
        barra.appendChild(l2);

        /* a barra acabou de ser reconstruida: reponha a agulha onde ela
           estava, senao todo arraste de bloco jogaria a cena para o zero */
        porAgulha(est, agulhaP);

        saida = document.createElement('textarea');
        saida.className = 'mz-textarea';
        saida.readOnly = true;
        barra.appendChild(saida);
    }

    function desenharBolas(est) {
        camada.innerHTML = '';
        var esc = k(palco);

        /* so cue que ENQUADRA desenha moldura e bolinha. Tremor e tensao
           nao tem centro nem tamanho: o que os define e a amplitude, que
           mora no painel. Desenhar bolinha neles seria inventar uma
           posicao que o efeito nao usa. */
        if (sel >= 0 && est.focos[sel] && tipoDe(est.focos[sel].tipo).quadro) {
            var q = quadroDe(palco, est.focos[sel]);
            var mold = document.createElement('div');
            mold.className = 'mz-quadro';
            mold.style.left = Math.round(q.x * esc) + 'px';
            mold.style.top = Math.round(q.y * esc) + 'px';
            mold.style.width = Math.round(q.w * esc) + 'px';
            mold.style.height = Math.round(q.h * esc) + 'px';
            mold.innerHTML = '<b>' + icone(IC.alvo, 13) + 'foco ' + (sel + 1) + ' · '
                + fator(palco, est.focos[sel]).toFixed(2) + 'x</b>';
            camada.appendChild(mold);
        }

        est.focos.forEach(function (f, i) {
            if (!tipoDe(f.tipo).quadro) return;
            var b = document.createElement('div');
            b.className = 'mz-bola' + (i === sel ? ' sel' : '');
            b.style.left = Math.round((f.cx - f.r) * esc) + 'px';
            b.style.top = Math.round((f.cy - f.r) * esc) + 'px';
            b.style.width = b.style.height = Math.round(f.r * 2 * esc) + 'px';
            b.style.borderColor = corDe(palco, est, i);
            b.innerHTML = '<b>' + (i + 1) + '</b><span>' + fator(palco, f).toFixed(1) + 'x</span>';

            var anel = document.createElement('div');
            anel.className = 'mz-anel';
            b.appendChild(anel);

            b.addEventListener('pointerdown', function (e) {
                if (e.target === anel) return;
                e.preventDefault();
                sel = i; desenhar();
                arrastar(e, f, 'mover');
            });
            anel.addEventListener('pointerdown', function (e) {
                e.preventDefault(); e.stopPropagation();
                sel = i; desenhar();
                arrastar(e, f, 'raio');
            });
            b.addEventListener('wheel', function (e) {
                e.preventDefault();
                sel = i;
                f.r = Math.max(MIN_R, Math.min(MAX_R, f.r + (e.deltaY > 0 ? 14 : -14)));
                desenhar();
            }, { passive: false });

            camada.appendChild(b);
        });
    }

    /* ---------- arraste na regua de beats ----------
       Corpo do retangulo desloca o foco no tempo; alca da direita muda a
       duracao; alca da esquerda muda o inicio mantendo o FIM no lugar, que
       e o que se espera de uma faixa de tempo.

       Durante o arraste NAO se chama desenhar(): ele reconstroi a barra
       inteira e o elemento sob o dedo deixaria de existir no meio do gesto.
       Aqui so o estilo do proprio retangulo e reescrito, e o desenho
       completo acontece uma vez, ao soltar. */
    var PASSO_BEAT = 0.25;
    function quantiza(v) { return Math.round(v / PASSO_BEAT) * PASSO_BEAT; }

    /* cue novo nasce ONDE A AGULHA ESTA, nao no fim da fila: e o ponto que
       o autor esta olhando quando clica. Duracao padrao por tipo, porque
       tremor e um baque e tensao e um estado, e comecar os dois com o mesmo
       tamanho de bloco daria a impressao errada logo na criacao. */
    function novoCue(est, T) {
        var spb = est.ciclo / est.beats;
        /* abalo nasce sem encaixar na grade, pelo mesmo motivo do arraste */
        var beat = T.quadro
            ? Math.max(0, Math.min(est.beats - 0.5, quantiza(agulhaP * est.beats)))
            : Math.max(0, Math.min(est.beats - 0.05, +(agulhaP * est.beats).toFixed(4)));
        /* padrao dos abalos em SEGUNDOS, convertido para beats: 0,25 s de
           tremor e um impacto, e 4 s de tensao e um estado. Em beats os
           mesmos numeros mudariam de sentido a cada ciclo diferente. */
        var dur = T.id === 'tremor' ? 0.25 / spb
            : T.id === 'tensao' ? 4 / spb
            : 1;
        est.focos.push({
            cx: palco.base.w / 2, cy: palco.base.h / 2, r: 220,
            amp: T.id === 'tremor' ? 0.006 : 0.003,
            beat: beat, dur: +Math.min(dur, est.beats - beat).toFixed(4),
            tipo: T.id, razao: ''
        });
        sel = est.focos.length - 1;
        desenhar();
    }

    /* ---------- agulha: a cena no instante que a regua aponta ----------
       O modo camera trabalha com a timeline PARADA (o manterParado pausa
       todo tique). Parada, ela ainda responde a `time()`: buscar um
       instante manda o GSAP renderizar aquele quadro. E dai que sai o
       "mostrar em que ponto ela esta": arrastar a agulha e percorrer a
       cena quadro a quadro, com o Sabio, a luz e as camadas no lugar
       exato daquele segundo.

       NAO quantiza em beats de proposito. O bloco de cue quantiza porque
       ritmo e grade; a agulha e leitura, e ler exige chegar no 6,3 s que
       nenhuma grade de beats contem.

       A regua mede o CICLO declarado e a timeline tem a duracao real. Os
       dois nascem iguais (o ciclo e lido de tl.duration()), mas o ciclo e
       editavel na barra: o teto pela duracao real impede que aumentar o
       numero na barra mande a busca para depois do fim da cena. */
    function porAgulha(est, p) {
        agulhaP = Math.max(0, Math.min(1, p));
        for (var i = 0; i < agulhas.length; i++) agulhas[i].style.left = (agulhaP * 100) + '%';
        if (!palco || palco._morta) return;
        /* ZERA OS ABALOS ANTES DE BUSCAR. Tremor e tensao pintam em
           onUpdate e limpam em onComplete, e o GSAP nao dispara onComplete
           quando a busca vai para TRAS. Sem esta linha, passar a agulha por
           cima de um tremor e voltar deixava o canal preso no ultimo valor
           sorteado: o quadro inteiro ficava deslocado ate 2% da largura, em
           toda busca seguinte, e o defeito se leria como agulha imprecisa. */
        if (palco.abalo) { palco.abalo.x = 0; palco.abalo.y = 0; }
        if (palco.tensao) { palco.tensao.x = 0; palco.tensao.y = 0; }
        var t = Math.min(agulhaP * est.ciclo, palco.tl.duration());
        palco.tl.time(t);
        if (relogio) relogio.textContent = t.toFixed(2) + 's / ' + est.ciclo + 's';
    }

    function arrastarAgulha(ev, est, trilha) {
        ev.preventDefault();
        var r = trilha.getBoundingClientRect();
        function mover(e) {
            porAgulha(est, (e.clientX - r.left) / r.width);
        }
        function soltar() {
            window.removeEventListener('pointermove', mover);
            window.removeEventListener('pointerup', soltar);
        }
        window.addEventListener('pointermove', mover);
        window.addEventListener('pointerup', soltar);
        mover(ev);   /* o clique simples ja posiciona, sem precisar arrastar */
    }

    function arrastarSeg(ev, est, f, modo, el, trilha) {
        ev.preventDefault();
        ev.stopPropagation();
        var r = trilha.getBoundingClientRect();
        var porBeat = r.width / est.beats;
        var x0 = ev.clientX, b0 = f.beat, d0 = f.dur;
        /* ABALO NAO ENCAIXA NA GRADE. A grade de 1/4 de beat serve a zoom e
           travelling, que sao movimento com ritmo. Tremor dura menos que um
           passo dela inteiro, entao encaixar apagaria a unica dimensao que
           o autor quer ajustar. Grade para quem tem ritmo, continuo para
           quem tem so um instante. */
        var grade = tipoDe(f.tipo).quadro;
        var q = function (v) { return grade ? quantiza(v) : +v.toFixed(4); };
        var minimo = grade ? PASSO_BEAT : 0.01;
        function mover(e) {
            var db = (e.clientX - x0) / porBeat;
            if (modo === 'mover') {
                f.beat = Math.max(0, Math.min(est.beats - f.dur, q(b0 + db)));
            } else if (modo === 'fim') {
                f.dur = Math.max(minimo, Math.min(est.beats - f.beat, q(d0 + db)));
            } else {
                var fimFixo = b0 + d0;
                var novo = Math.max(0, Math.min(fimFixo - minimo, q(b0 + db)));
                f.beat = novo;
                f.dur = +(fimFixo - novo).toFixed(4);
            }
            el.style.left = (f.beat / est.beats * 100) + '%';
            el.style.width = Math.max(4, f.dur / est.beats * 100) + '%';
            el.title = 'beat ' + f.beat + ' por ' + f.dur;
        }
        function soltar() {
            window.removeEventListener('pointermove', mover);
            window.removeEventListener('pointerup', soltar);
            desenhar();
        }
        window.addEventListener('pointermove', mover);
        window.addEventListener('pointerup', soltar);
    }

    function arrastar(ev, f, modo) {
        var esc = k(palco);
        var x0 = ev.clientX, y0 = ev.clientY, cx0 = f.cx, cy0 = f.cy, r0 = f.r;
        function mover(e) {
            var dx = (e.clientX - x0) / esc, dy = (e.clientY - y0) / esc;
            if (modo === 'mover') { f.cx = cx0 + dx; f.cy = cy0 + dy; }
            else { f.r = Math.max(MIN_R, Math.min(MAX_R, r0 + dx)); }
            desenhar();
        }
        function soltar() {
            window.removeEventListener('pointermove', mover);
            window.removeEventListener('pointerup', soltar);
        }
        window.addEventListener('pointermove', mover);
        window.addEventListener('pointerup', soltar);
    }

    function desenhar() {
        if (!ativo || !palco) return;
        var est = estadoDe(palco);
        /* a selecao acompanha o OBJETO. Arrastar na regua reordena por beat,
           e um indice guardado apontaria para outro foco depois da ordenacao */
        var alvo = (sel >= 0) ? est.focos[sel] : null;
        est.focos.sort(function (a, b) { return a.beat - b.beat; });
        if (alvo) sel = est.focos.indexOf(alvo);
        desenharBolas(est);
        desenharBarra(est);
        desenharPainel(est);
    }

    /* =================================================================
       PREVER — a camera vem SO das bolinhas.

       Mata as tweens que o codigo do slide escreveu sobre cena.camera e
       monta a sequencia dos focos. E o comportamento final pretendido:
       o agente descreve a cena, a camera sai deste painel.
       ================================================================= */
    var alvos = {};
    function alvoDe(cena, i, f) {
        var id = 'mz-alvo-' + cena.id + '-' + i;
        var el = cena.svg.querySelector('#' + id);
        if (!el) {
            el = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            el.setAttribute('id', id);
            el.setAttribute('fill', 'none');
            el.setAttribute('pointer-events', 'none');
            cena.svg.appendChild(el);
        }
        var q = quadroDe(cena, f);
        el.setAttribute('x', q.x); el.setAttribute('y', q.y);
        el.setAttribute('width', q.w); el.setAttribute('height', q.h);
        return el;
    }

    /* mata todo cue de camera da cena, venha ele do codigo do slide ou de
       uma montagem anterior deste modulo */
    /* os TRES canais de camera do motor: enquadramento, tremor e tensao.
       Limpar so o primeiro deixava os abalos empilhando a cada remontagem,
       e a cena ia ficando mais tremida a cada Play. */
    function limparCamera(cena) {
        var canais = [cena.camera, cena.abalo, cena.tensao];
        cena.tl.getChildren(true, true, false).forEach(function (tw) {
            if (!tw.targets) return;
            var alvos = tw.targets();
            for (var i = 0; i < canais.length; i++) {
                if (canais[i] && alvos.indexOf(canais[i]) >= 0) { tw.kill(); return; }
            }
        });
        if (cena.abalo) { cena.abalo.x = 0; cena.abalo.y = 0; }
        if (cena.tensao) { cena.tensao.x = 0; cena.tensao.y = 0; }
    }

    /* MONTA a camera a partir dos focos, DENTRO da cena.tl.

       Dentro e nao numa timeline separada de proposito: assim a camera
       compartilha o relogio da historia, obedece o @MIRA:LOOP e o
       timeScale da tecla A, e um Replay reinicia os dois juntos. */
    function montarCamera(cena, est) {
        limparCamera(cena);
        if (!est.focos.length) return 0;
        var spb = est.ciclo / est.beats;
        /* ESTABELECER no instante 0 e RECUAR no fim existem por um motivo
           tecnico, nao decorativo: a tween de camera guarda o valor inicial
           no momento em que e criada, que e o quadro base. No reinicio do
           loop o GSAP restaura esse valor, entao sem o recuar a camera da um
           SALTO SECO do ultimo foco para o quadro cheio na virada do ciclo.
           Desligar isso (@MIRA:VOLTA off) e legitimo, mas ai o corte do loop
           aparece, a menos que o ultimo foco ja enquadre a cena quase toda. */
        if (est.volta) cena.tl.add(Cam.estabelecer(cena, { dur: 0.6 }), 0);
        est.focos.forEach(function (f, i) {
            /* ABALOS saem antes do alvoDe() de proposito: eles nao enquadram
               nada, e criar para eles um retangulo de mira no SVG poluiria a
               cena com um alvo que ninguem vai usar.

               TREMOR: duracao presa em 400 ms, que e o teto do Cam.tremor.
               Passar disso so renderia um aviso no console e o corte viria
               do mesmo jeito, entao e melhor cortar aqui, em silencio.

               TENSAO: sem teto. Ela e estado, nao pontuacao, e sustentar e
               exatamente o trabalho dela: o bloco pode cobrir a cena toda. */
            if (f.tipo === 'tremor') {
                cena.tl.add(Cam.tremor(cena, {
                    razao: 'tremor ' + (i + 1) + ' definido no modo camera',
                    dur: f.dur * spb,
                    amplitude: f.amp || 0.006
                }), f.beat * spb);
                return;
            }
            if (f.tipo === 'tensao') {
                cena.tl.add(Cam.tensao(cena, {
                    razao: 'tensao ' + (i + 1) + ' definida no modo camera',
                    dur: Math.max(0.3, f.dur * spb),
                    amplitude: f.amp || 0.003
                }), f.beat * spb);
                return;
            }
            var el = alvoDe(cena, i, f);
            var op = {
                alvo: el, dur: Math.max(0.3, f.dur * spb * 0.7), ease: 'sine.inOut',
                margem: 0.001, razao: 'foco ' + (i + 1) + ' definido no modo camera'
            };
            cena.tl.add(f.tipo === 'revelar' ? Cam.revelar(cena, op) : Cam.aproximar(cena, op),
                f.beat * spb);
        });
        if (est.volta) {
            cena.tl.add(Cam.recuar(cena, { dur: 1.0, razao: 'fecha o loop sem corte' }),
                Math.max(0.6, est.ciclo - 1.0));
        }
        return est.focos.length;
    }

    /* aplica os focos e volta a rodar */
    function prever() {
        var est = estadoDe(palco);
        var quantos = montarCamera(palco, est);
        ativo = false;
        gsap.ticker.remove(manterParado);
        palco._presaNaBase = false;
        if (camada) { camada.remove(); camada = null; }
        if (barra) barra.classList.remove('on');
        if (painel) painel.classList.remove('on');
        palco.tl.time(0).play();
        aviso(quantos ? (quantos + ' foco(s) na camera') : 'nenhum foco: camera no quadro base');
    }

    /* =================================================================
       COPIAR — marcadores para o texto-fonte
       ================================================================= */
    /* uma linha de marcador, usada tanto pelo Copiar quanto pelo Salvar:
       dois formatadores davam dois formatos que divergiam com o tempo.

       Cada tipo escreve SO o que usa. Gravar cx/cy/r num tremor seria
       registrar uma posicao que o efeito ignora, e quem abrisse o arquivo
       depois acreditaria nela. */
    function linhaFoco(f, i) {
        var s = '<!-- @MIRA:FOCO ' + (i + 1) + ' tipo=' + f.tipo;
        if (tipoDe(f.tipo).quadro) {
            s += ' cx=' + Math.round(f.cx) + ' cy=' + Math.round(f.cy)
                + ' r=' + Math.round(f.r);
        } else {
            /* CINCO casas, e nao tres. Com o teto da tensao em 0,008, o
               slider produz valores como 0,00024, e tres casas gravavam
               "0.000": a intensidade voltava ZERADA do arquivo. Precisao de
               gravacao menor que a do controle apaga o ajuste em silencio. */
            s += ' amp=' + (+(f.amp || 0)).toFixed(5);
        }
        return s + ' beat=' + f.beat + ' dur=' + f.dur + ' -->';
    }

    function copiar(est) {
        var l = ['<!-- @MIRA:CICLO ' + est.ciclo + ' BEATS ' + est.beats + ' -->'];
        est.focos.forEach(function (f, i) {
            l.push(linhaFoco(f, i));
        });
        var txt = l.join('\n');
        saida.value = txt;
        saida.classList.add('on');
        saida.select();
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(txt).catch(function () { });
        } else {
            try { document.execCommand('copy'); } catch (e) { }
        }
    }

    /* =================================================================
       AVISO curto no canto
       ================================================================= */
    function aviso(txt, erro) {
        estilo();
        var d = document.getElementById('mz-toast');
        if (!d) {
            d = document.createElement('div');
            d.id = 'mz-toast';
            document.body.appendChild(d);
        }
        d.className = erro ? 'err on' : 'ok on';
        d.innerHTML = icone(erro ? IC.alerta : IC.ok, 16) + '<span>' + txt + '</span>';
        clearTimeout(d._t);
        d._t = setTimeout(function () { d.className = d.className.replace(' on', ''); }, 2800);
    }

    /* =================================================================
       GRAVACAO no texto-fonte.

       Dois caminhos, os mesmos que o mira-edit.js usa:
         http(s)  ->  le a fonte e POST /__mira_save
         file://  ->  File System Access API: voce escolhe o index.html
                      uma vez e o handle fica guardado na sessao.

       O bloco de cada slide e localizado pelo ID DO SVG, nunca pela ordem
       dos slides: reordenar com a tecla E nao embaralha os focos.
       ================================================================= */
    function marcadores(est) {
        var l = ['<!-- @MIRA:LOOP ' + (est.loop ? 'on' : 'off') + ' -->',
                 '<!-- @MIRA:VOLTA ' + (est.volta ? 'on' : 'off') + ' -->',
                 '<!-- @MIRA:PASSO ' + (est.passo ? 'on' : 'off') + ' -->',
                 '<!-- @MIRA:CICLO ' + est.ciclo + ' BEATS ' + est.beats + ' -->'];
        est.focos.forEach(function (f, i) {
            l.push(linhaFoco(f, i));
        });
        return l;
    }

    /* TEM QUE LISTAR TODO MARCADOR QUE O marcadores() ESCREVE. A lista
       tinha so FOCO, CICLO e LOOP, mas o gravador ja emitia VOLTA e PASSO:
       eles nao eram limpos e o arquivo ganhava uma linha repetida de cada um
       a cada save. Com o PROF entrando agora, o mesmo aconteceria com ele.
       Escrever sem limpar é sempre acumulo, nunca atualizacao. */
    var LIMPA = /[ \t]*<!--\s*@MIRA:(FOCO|CICLO|LOOP|VOLTA|PASSO|PROF)\b[\s\S]*?-->[ \t]*\r?\n?/g;

    function compor(src) {
        Object.keys(mundos).forEach(function (id) {
            var est = mundos[id];
            var pos = src.indexOf('id="' + id + '"');
            if (pos < 0) { console.warn('[mira-foco] nao achei ' + id + ' na fonte'); return; }
            var ini = src.lastIndexOf('<section', pos);
            var fim = src.indexOf('</section>', pos);
            if (ini < 0 || fim < 0) return;
            var abre = src.indexOf('>', ini) + 1;
            var bloco = src.slice(abre, fim).replace(LIMPA, '');
            src = src.slice(0, abre) + '\n    ' + marcadores(est).join('\n    ') + bloco + src.slice(fim);
        });
        return src;
    }

    var punho = null;
    async function fonte() {
        if (location.protocol === 'http:' || location.protocol === 'https:') {
            var alvo = location.pathname;
            if (/\/$/.test(alvo)) alvo += 'index.html';
            var r = await fetch(alvo, { cache: 'no-store' });
            if (!r.ok) throw new Error('nao consegui ler ' + alvo + ' (HTTP ' + r.status + ')');
            return { texto: await r.text(), alvo: alvo, http: true };
        }
        if (!('showOpenFilePicker' in window)) {
            throw new Error('em file:// a gravacao exige Chrome, ou sirva o deck por http');
        }
        if (!punho) {
            var esc = await window.showOpenFilePicker({
                multiple: false,
                types: [{ description: 'deck', accept: { 'text/html': ['.html'] } }]
            });
            punho = esc[0];
        }
        var perm = await punho.queryPermission({ mode: 'readwrite' });
        if (perm !== 'granted') {
            perm = await punho.requestPermission({ mode: 'readwrite' });
            if (perm !== 'granted') throw new Error('permissao de escrita negada');
        }
        var arq = await punho.getFile();
        return { texto: await arq.text(), http: false };
    }

    async function salvar() {
        try {
            var f = await fonte();
            if (f.texto.indexOf('mira-foco.js') < 0) {
                throw new Error('esse arquivo nao parece ser o deck: nao achei mira-foco.js nele');
            }
            var saida = compor(f.texto);
            if (saida === f.texto) { aviso('nada mudou'); return; }
            if (f.http) {
                var r = await fetch('/__mira_save', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ path: f.alvo, content: saida })
                });
                if (!r.ok) throw new Error('servidor recusou (HTTP ' + r.status + ')');
            } else {
                var w = await punho.createWritable();
                await w.write(saida);
                await w.close();
            }
            aviso('salvo no index.html');
        } catch (e) {
            if (e && e.name === 'AbortError') return;
            console.error('[mira-foco] falha ao salvar:', e);
            aviso('falha ao salvar: ' + (e && e.message ? e.message : e), true);
        }
    }

    /* =================================================================
       TECLA L — loop do slide, on e off.

       Vale por SLIDE e nao por deck: um slide de fecho pode precisar parar
       no ultimo quadro enquanto os outros seguem em loop perpetuo.
       ================================================================= */
    var caixaLoop = null;   /* nao existe mais painel proprio: os checks
                               vivem na barra do modo camera */
    function aplicarLoop(cena, est) {
        cena.tl.repeat(est.loop ? -1 : 0);
        if (cena._visivel && !ativo) cena.tl.play();
    }

    /* L alterna o loop do slide na hora e avisa. Se a barra estiver aberta,
       o botao repinta junto. */
    function alternarLoop() {
        var cena = ativoAgora();
        if (!cena) { aviso('nenhum palco visivel neste slide', true); return; }
        var est = estadoDe(cena);
        est.loop = !est.loop;
        aplicarLoop(cena, est);
        if (ativo && palco === cena) desenhar();
        aviso('loop ' + (est.loop ? 'perpetuo' : 'uma vez so') + ' · Ctrl+S salva');
    }

    /* aplica o que estiver nos marcadores assim que os palcos existirem */
    window.addEventListener('load', function () {
        setTimeout(function () {
            MiraCinema.palcos.forEach(function (c) {
                if (c._morta) return;
                var est = estadoDe(c);
                if (!est.loop) aplicarLoop(c, est);
                /* a camera deste deck vem SO dos marcadores: sem isto,
                   salvar nao teria efeito nenhum depois do F5 */
                if (est.focos.length) montarCamera(c, est);
                if (est.passo) aplicarPasso(c, est);
            });
        }, 0);
    });

    /* =================================================================
       PASSO A PASSO na seta para baixo (tecla P do passador de slides).

       Com PASSO ligado, a cena nao roda sozinha: cada seta para baixo
       avanca UM BEAT, e so depois do ultimo a seta volta a trocar de slide.
       E o que permite conduzir a propria animacao com o passador.

       DETALHE QUE DECIDE SE FUNCIONA: o script de navegacao do deck
       registra o keydown durante o parsing, antes deste modulo. Em fase de
       BOLHA ele ganharia e trocaria de slide antes de eu ver a tecla. Por
       isso o listener abaixo e de CAPTURA, e usa stopImmediatePropagation
       apenas quando de fato consome o passo. Toda outra tecla passa
       intacta, senao o E e o P quebrariam.
       ================================================================= */
    var escoando = false;

    function passoDe(est, i) {
        return (est.ciclo / est.beats) * i;
    }

    function irAoPasso(cena, est, i) {
        i = Math.max(0, Math.min(est.beats, i));
        est._i = i;
        var alvo = passoDe(est, i);
        var agora = cena.tl.time();
        var dur = Math.abs(alvo - agora);
        escoando = true;
        cena.tl.tweenTo(alvo, {
            duration: dur, ease: 'none',
            onComplete: function () { escoando = false; cena.tl.pause(); }
        });
        pintarPasso(cena, est);
    }

    function aplicarPasso(cena, est) {
        if (est.passo) {
            est._i = 0;
            cena.tl.repeat(0);
            cena.tl.pause(0);
        } else {
            cena.tl.repeat(est.loop ? -1 : 0);
            if (cena._visivel && !ativo) cena.tl.play();
        }
        pintarPasso(cena, est);
    }

    /* guarda: o IntersectionObserver do mira-cinema chama play() quando o
       slide aparece, e nao existe API para desligar isso. Reafirmar a pausa
       por tique e o unico jeito de nao editar o arquivo dele. */
    var visivelAntes = null;
    function segurarPasso() {
        var cena = ativoAgora();
        if (cena !== visivelAntes) {
            /* trocou de slide: o passo recomeca do zero */
            if (cena) { var e0 = estadoDe(cena); if (e0.passo) { e0._i = 0; } }
            visivelAntes = cena;
            pintarPasso(cena, cena && estadoDe(cena));
        }
        if (!cena) return;
        var est = estadoDe(cena);
        if (!est.passo || escoando || ativo) return;
        if (!cena.tl.paused()) cena.tl.pause();
    }
    gsap.ticker.add(segurarPasso);

    /* indicador discreto: quem apresenta precisa saber quantos passos faltam
       antes de a seta trocar de slide */
    var selo = null;
    function pintarPasso(cena, est) {
        if (!est || !est.passo) { if (selo) selo.className = ''; return; }
        estilo();
        if (!selo) {
            selo = document.createElement('div');
            selo.id = 'mz-passo';
            document.body.appendChild(selo);
        }
        var i = est._i || 0;
        selo.className = 'on';
        selo.innerHTML = icone(IC.passo, 15)
            + '<span>' + i + '/' + est.beats + '</span>'
            + '<em>' + (i >= est.beats ? 'proxima seta troca de slide' : 'seta avanca') + '</em>';
    }

    var AVANCA = ['ArrowDown', 'ArrowRight', 'PageDown', ' ', 'Spacebar'];
    var VOLTA = ['ArrowUp', 'ArrowLeft', 'PageUp'];

    document.addEventListener('keydown', function (e) {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        var t = e.target;
        if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName || ''))) return;
        if (document.body.classList.contains('me-on')
            || document.body.classList.contains('mef-on')
            || document.body.classList.contains('md-on')) return;
        var frente = AVANCA.indexOf(e.key) >= 0, tras = VOLTA.indexOf(e.key) >= 0;
        if (!frente && !tras) return;
        var cena = ativoAgora();
        if (!cena) return;
        var est = estadoDe(cena);
        if (!est.passo) return;
        var i = est._i || 0;
        /* esgotou para frente, ou esta no inicio para tras: DEIXA PASSAR,
           e e a navegacao do deck que troca de slide */
        if (frente && i >= est.beats) return;
        if (tras && i <= 0) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        irAoPasso(cena, est, i + (frente ? 1 : -1));
    }, true);

    /* =================================================================
       liga e desliga
       ================================================================= */
    function ligar() {
        palco = ativoAgora();
        if (!palco) { console.warn('[mira-foco] nenhum palco visivel neste slide.'); return; }
        if (!painel) montarUI();
        camada = palco.caixa.querySelector('.mz-camada');
        if (!camada) {
            camada = document.createElement('div');
            camada.className = 'mz-camada';
            palco.caixa.appendChild(camada);
        }
        ativo = true;
        gsap.ticker.add(manterParado);
        var est = estadoDe(palco);
        if (!est.focos.length) sel = -1;
        /* a agulha nasce onde a cena PAROU, nao no zero: o modo entra no
           quadro que estava na tela, senao ligar o painel daria um salto */
        agulhaP = est.ciclo ? Math.min(1, palco.tl.time() / est.ciclo) : 0;
        desenhar();
    }

    function desligar() {
        ativo = false;
        matarPrevia();   /* senao um abalo solto continua sacudindo a cena */
        gsap.ticker.remove(manterParado);
        if (palco) montarCamera(palco, estadoDe(palco));
        if (camada) { camada.remove(); camada = null; }
        if (barra) barra.classList.remove('on');
        if (painel) painel.classList.remove('on');
        if (palco) { palco._presaNaBase = false; palco.tl.play(); }
    }

    document.addEventListener('keydown', function (e) {
        if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')
            && ativo) {
            e.preventDefault(); salvar(); return;
        }
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        var t = e.target;
        if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName || ''))) return;
        /* edicao e pintura mandam no teclado quando estao ligadas */
        if (document.body.classList.contains('me-on')
            || document.body.classList.contains('mef-on')
            || document.body.classList.contains('md-on')) return;
        /* C de CAMERA. Era Z de zoom, e o nome ficou pequeno: o painel
           deixou de ser so enquadramento quando o tremor entrou, e vai
           receber os outros tipos de cue. Zoom virou UM tipo dentro dele,
           nao o assunto. */
        if (e.key === 'c' || e.key === 'C') {
            e.preventDefault();
            ativo ? desligar() : ligar();
        } else if (e.key === 'l' || e.key === 'L') {
            e.preventDefault();
            alternarLoop();
        } else if (e.key === 'Escape' && ativo) {
            desligar();
        }
    });

    window.addEventListener('resize', function () { if (ativo) desenhar(); });
    window.addEventListener('scroll', function () {
        if (!ativo) return;
        var novo = ativoAgora();
        if (novo && novo !== palco) { desligar(); ligar(); }
    }, { passive: true });

    window.miraFoco = {
        versao: '0.7.0-prototipo',
        salvar: salvar,
        estado: mundos,
        ligar: ligar, desligar: desligar
    };
})();
