/* ==============================================================
   MIRA MOTION BLUR
   Efeito de velocidade para DISPAROS: rastro de fantasmas + blur
   direcional, os dois dirigidos pela velocidade normalizada do
   movimento. Parado, o efeito desliga sozinho (opacidade 0,
   stdDeviation 0), então ele nunca polui o repouso.

   Regras de uso:
   - o rastro é ANALÍTICO: cada fantasma é a posição de onde o
     ator estava há k*passo ms, calculada da própria função do
     movimento. Nada de histórico guardado: o regente congela e
     zera o relógio, e histórico viraria lixo na tela.
   - movimento RETO: crie o filtro com filtro() e aplique no grupo
     que contém rastro + ator; o conjunto borra num risco contínuo.
   - trajetória CURVA: use ator(), que gira o blur para o ângulo
     do voo; o rastro fica fora do rig, nítido.

   Depende do d3 (v7). Carregue após o d3 e antes da animação:
     <script src="mira/mira-motion-blur.js"></script>
   ============================================================== */
(function () {
    'use strict';

    function defsDe(camada) {
        var no = camada.node();
        var svg = d3.select(no.ownerSVGElement || no);
        var defs = svg.select('defs');
        return defs.empty() ? svg.append('defs') : defs;
    }

    /* filtro de blur horizontal; região larga para o borrão não
       ser recortado na caixa do elemento */
    function criarFiltro(camada, id, max) {
        var desvio = defsDe(camada).append('filter')
            .attr('id', id)
            .attr('x', '-150%').attr('y', '-150%')
            .attr('width', '400%').attr('height', '400%')
            .append('feGaussianBlur').attr('stdDeviation', '0,0');
        return {
            url: 'url(#' + id + ')',
            forca: function (f) { desvio.attr('stdDeviation', (f * max) + ',0'); }
        };
    }

    window.miraMotionBlur = {

        /* velocidade -> força 0..1. `vel` sai por diferença central da
           função do movimento; `pico` é o máximo dela (easeCubicInOut:
           3 / duração do disparo em ms). */
        forca: function (vel, pico) {
            return Math.min(1, Math.abs(vel / pico));
        },

        /* Perfil PADRÃO de deslocamento de objeto (A -> B): explode
           até h e assenta com cauda longa, chegando de rastejo. A
           velocidade é uma logística (platô máximo, joelho suave em h,
           cauda exponencial), sem emenda: emenda de fase o olho lê
           como engasgo. h = ponto da virada (padrão .5); k = dureza do
           freio (padrão 10, maior = freia mais seco). Devolve o easing
           com `.pico` (derivada máxima por unidade de t) anexado, para
           normalizar a força do blur: picoMs = ease.pico / duraçãoMs. */
        explodeAssenta: function (h, k) {
            h = h || .5; k = k || 10;
            function F(t) { return t - Math.log(1 + Math.exp(k * (t - h))) / k; }
            var v0 = 1 / (F(1) - F(0));
            function ease(t) {
                if (t <= 0) return 0;
                if (t >= 1) return 1;
                return (F(t) - F(0)) * v0;
            }
            ease.pico = v0;
            return ease;
        },

        /* Movimento RETO. Devolve { url, forca(f) }: aplique
           .attr('filter', url) no grupo rastro+ator e chame forca(f)
           a cada quadro. */
        filtro: function (camada, id, opts) {
            return criarFiltro(camada, id, (opts && opts.max) || 16);
        },

        /* Trajetória CURVA. Rig de dois grupos: o de fora posiciona e
           GIRA para o ângulo do voo; o filtro borra sempre no eixo x
           local, girado ele vira blur na direção do movimento. Desenhe
           o ator dentro de `forma`. */
        ator: function (camada, id, opts) {
            var filtro = criarFiltro(camada, id, (opts && opts.max) || 12);
            var gPos = camada.append('g');
            var gForma = gPos.append('g').attr('filter', filtro.url).append('g');
            return {
                forma: gForma,
                mover: function (x, y, angGraus) {
                    gPos.attr('transform',
                        'translate(' + x + ',' + y + ') rotate(' + (angGraus || 0) + ')');
                },
                /* esticar=true soma squash & stretch: alonga no eixo do
                   voo e achata no outro, proporcional à força */
                forca: function (f, esticar) {
                    filtro.forca(f);
                    if (esticar) gForma.attr('transform',
                        'scale(' + (1 + .5 * f) + ',' + (1 - .22 * f) + ')');
                }
            };
        },

        /* Rastro de n fantasmas. `montar(g, k, n)` desenha a forma de
           cada fantasma (k = 1 é o mais perto do ator). A cada quadro,
           chame atualizar(posicoes, f) com posicoes[k-1] = {x, y, ang?}
           = onde o ator estava há k*passo ms. Opacidade e encolhimento
           decaem sozinhos ao longo do rastro. */
        eco: function (camada, n, montar, opts) {
            var base = (opts && opts.opacidade) || .4;
            var g = camada.append('g');
            var clones = [];
            for (var k = 1; k <= n; k++) {
                var c = g.append('g');
                montar(c, k, n);
                clones.push(c);
            }
            return {
                atualizar: function (posicoes, f) {
                    clones.forEach(function (c, i) {
                        var pnt = posicoes[i], k = i + 1;
                        c.attr('transform', 'translate(' + pnt.x + ',' + pnt.y + ')'
                            + (pnt.ang ? ' rotate(' + pnt.ang + ')' : '')
                            + ' scale(' + (1 - .55 * k / (n + 1)) + ')')
                            .attr('opacity', f * base * (1 - k / (n + 1)));
                    });
                }
            };
        }
    };
})();
