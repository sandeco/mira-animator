# Código observado — BUG-20260731-S3TX

Extraído de `/workspaces/.mira` no commit `558a406`, em 2026-07-31.

## templates/decks/mira-studio-full-demo/index-16x9.html

Cabeçalho do builder (702 a 719), com o array DEFAULT de demonstração:

```js
        /* ---------- slides nascem do roteiro.md ----------
           Cada "## Slide N | layout | Título | animação" vira um slide:
             layout: camera (só você) ou thirds (animação 2/3 + câmera 1/3)
             Título (thirds): *palavra* vira a cor de destaque
             animação (thirds): "linha: A, B, C, D" ou "orbita: A, B, C @ NÚCLEO"
           Layout, título e animação valem ao recarregar; o TEXTO sincroniza ao
           vivo (bloco do teleprompter). Sem roteiro.md (file:// ou 404), o deck
           monta os 5 slides padrão abaixo. A busca é síncrona de propósito: os
           módulos (câmera, gravação, edição) leem as seções logo em seguida. */
        (function () {
            var DEFAULT = [
                { layout: 'camera' },
                { layout: 'thirds', titulo: 'Linha de *Produção*', anim: { tipo: 'linha', itens: ['CRIAÇÃO', 'GRAVAÇÃO', 'EDIÇÃO', 'FINALIZAÇÃO'] } },
                { layout: 'thirds', titulo: 'Órbita da *Produção*', anim: { tipo: 'orbita', itens: ['CÂMERA', 'ÁUDIO', 'ROTEIRO'], centro: 'PRODUÇÃO' } },
                { layout: 'full', titulo: 'Produção ao *Vivo*', anim: { tipo: 'linha', itens: ['TEMA', 'ESTRUTURA', 'CONTEÚDO', 'VISUAL'] } },
                { layout: 'camera' }
            ];
            function parseAnim(s) {
```

Vocabulário fechado da animação declarativa (719 a 735):

```js
            function parseAnim(s) {
                var def = { tipo: 'linha', itens: ['CRIAÇÃO', 'GRAVAÇÃO', 'EDIÇÃO', 'FINALIZAÇÃO'] };
                if (!s) return def;
                var m = s.match(/^(linha|orbita)\s*:\s*(.+)$/i);
                if (!m) return def;
                var resto = m[2], centro = '';
                if (resto.indexOf('@') !== -1) {
                    var ab = resto.split('@');
                    resto = ab[0];
                    centro = (ab[1] || '').trim();
                }
                var itens = resto.split(',').map(function (x) { return x.trim(); }).filter(Boolean);
                if (m[1].toLowerCase() === 'orbita') {
                    return itens.length ? { tipo: 'orbita', itens: itens, centro: centro || 'NÚCLEO' } : def;
                }
                return itens.length >= 2 ? { tipo: 'linha', itens: itens } : def;
            }
```

Guarda de protocolo cobrindo só a busca, e a remoção incondicional (779 a 794):

```js
            var spec = null;
            if (location.protocol === 'http:' || location.protocol === 'https:') {
                try {
                    var x = new XMLHttpRequest();
                    x.open('GET', '/roteiro.md', false);
                    x.send();
                    if (x.status === 200 && x.responseText) {
                        window.__miraMdText = x.responseText;
                        spec = parseMd(x.responseText);
                    }
                } catch (e) { spec = null; }
            }
            var slides = spec || DEFAULT;
            /* remonta as seções (as estáticas do HTML são só fallback sem JS) */
            document.querySelectorAll('body > section').forEach(function (s) { s.remove(); });
            var anchor = document.getElementById('mira-prompter');
```

Recriação das seções com id genérico, e disparo das animações (795 a 825):

```js
            slides.forEach(function (sl, i) {
                var sec = document.createElement('section');
                sec.setAttribute('data-layout', sl.layout);
                if (sl.layout !== 'camera') {
                    var main = document.createElement('div');
                    main.className = sl.layout === 'full' ? 'full-main' : 'thirds-main';
                    var h2 = document.createElement('h2');
                    h2.appendChild(tituloFrag(sl.titulo));
                    var stage = document.createElement('div');
                    stage.className = 'anim-stage';
                    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                    svg.id = 'sv-slide-' + (i + 1);
                    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                    stage.appendChild(svg);
                    main.appendChild(h2);
                    main.appendChild(stage);
                    sec.appendChild(main);
                }
                if (sl.layout !== 'full') {
                    var cam = document.createElement('div');
                    cam.className = 'cam-area';
                    sec.appendChild(cam);
                }
                document.body.insertBefore(sec, anchor);
            });
            slides.forEach(function (sl, i) {
                if (sl.layout === 'camera') return;
                if (sl.anim.tipo === 'orbita') animOrbita('sv-slide-' + (i + 1), sl.anim.itens, sl.anim.centro);
                else animLinha('sv-slide-' + (i + 1), sl.anim.itens);
            });
        })();
```

## agents/mira-fast/scripts/assemble-run.mjs

Geração do roteiro.md, com animacao_declarativa opcional (124 a 142):

```js
function buildRoteiro(plan) {
  if (!['mira-studio', 'mira-studio-full'].includes(plan.formato)) return null;
  const layouts = plan.formato === 'mira-studio'
    ? '`capa`, `camera`, `split` e `full`'
    : '`camera`, `thirds` e `full`';
  const lines = [
    `# ${plan.titulo_deck}`,
    '',
    `Layouts aceitos: ${layouts}. Edite as falas abaixo; o deck usa este arquivo como fonte da verdade.`,
    '',
  ];
  for (const slide of plan.slides) {
    const fields = [`## Slide ${slide.n}`, slide.layout];
    if (slide.titulo && slide.layout !== 'camera') fields.push(slide.titulo);
    if (slide.animacao_declarativa) fields.push(String(slide.animacao_declarativa));
    lines.push(fields.filter(Boolean).join(' | '), '', slide.fala ?? '', '');
  }
  return `${lines.join('\n').trimEnd()}\n`;
}
```

## Conteúdo do diretório do template

```
index-16x9.html
roteiro.md
```

Confirma que `index.html`, caminho usado pelo grep do handoff original, não existe.
