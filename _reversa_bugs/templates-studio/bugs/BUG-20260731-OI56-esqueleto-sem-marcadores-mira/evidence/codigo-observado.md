# Código observado — BUG-20260731-OI56

Extraído de `/workspaces/.mira` no commit `558a406`, em 2026-07-31.

## Marcadores @MIRA nos templates

```
$ grep -c "@MIRA:" templates/decks/mira-studio-demo/index.html
0
0

$ grep -n "@MIRA:" templates/decks/mira-default/index.html
42:/* @MIRA:THEME:START */
62:/* @MIRA:THEME:END */
222:       o bloco @MIRA:THEME, e um hex escrito aqui deixaria a animação
```

O `mira-studio-demo` não tem marcador nenhum. O `mira-default` tem só `@MIRA:THEME`;
falta `@MIRA:RESPONSIVE` e faltam os seis slots `@MIRA:FAST:*`.

## Tema atual do mira-studio-demo, sem a convenção --mira-*

```css
18:        :root {
19-            --fmt-w: calc(100vh * 9 / 16);   /* coluna 9:16 cravada (saída OBS 1080x1920) */
20-            --fmt-h: 100vh;
21-            --accent: #FF904D;
22-            --bg: #0d0d0f;
23-            --ink: #f4f4f5;
24-            --muted: rgba(244, 244, 245, .58);
25-            --line: rgba(255, 255, 255, .12);
26-        }
27-        * { margin: 0; padding: 0; box-sizing: border-box; }
28-        html { background: #333333; scroll-behavior: smooth; scroll-snap-type: y proximity; }
```

## O validador: agents/mira-fast/scripts/assemble-run.mjs

Marcadores exigidos (15 a 22):

```js
export const SLOT_MARKERS = Object.freeze({
  cssStart: '<!-- @MIRA:FAST:CSS:START -->',
  cssEnd: '<!-- @MIRA:FAST:CSS:END -->',
  slidesStart: '<!-- @MIRA:FAST:SLIDES:START -->',
  slidesEnd: '<!-- @MIRA:FAST:SLIDES:END -->',
  jsStart: '<!-- @MIRA:FAST:JS:START -->',
  jsEnd: '<!-- @MIRA:FAST:JS:END -->',
});
```

validateSkeleton, checagens de bloco (197 a 210):

```js
function validateSkeleton(skeleton, format) {
  const errors = [];
  for (const marker of Object.values(SLOT_MARKERS)) {
    if (count(skeleton, marker) !== 1) errors.push(`marcador de esqueleto ausente ou duplicado: ${marker}`);
  }
  if (!skeleton.includes('/* @MIRA:THEME:START */') || !skeleton.includes('/* @MIRA:THEME:END */')) {
    errors.push('esqueleto sem bloco @MIRA:THEME');
  }
  if (!skeleton.includes('/* @MIRA:RESPONSIVE:START */') || !skeleton.includes('/* @MIRA:RESPONSIVE:END */')) {
    errors.push('esqueleto sem bloco @MIRA:RESPONSIVE');
  }
  if (!/body\s*>\s*section:first-of-type h1[\s\S]{0,160}body\s*>\s*section:first-of-type h2[\s\S]{0,120}text-wrap\s*:\s*balance/.test(skeleton)) {
    errors.push('esqueleto sem balanceamento de título da capa');
  }
```

## A mitigação que já existe: agents/mira-ultrafast/scripts/build-skeleton.mjs

Blocos injetados com conteúdo vazio (41 a 47):

```js
function openSlots(html, moduleNames) {
  const compatibility = [];
  if (!html.includes('/* @MIRA:THEME:START */')) compatibility.push('/* @MIRA:THEME:START */\n/* tema preservado do template canônico */\n/* @MIRA:THEME:END */');
  compatibility.push('body > section:first-of-type h1,\nbody > section:first-of-type h2 { text-wrap: balance; }');
  if (!html.includes('/* @MIRA:RESPONSIVE:START */')) compatibility.push('/* @MIRA:RESPONSIVE:START */\n/* geometria responsiva preservada do template canônico */\n/* @MIRA:RESPONSIVE:END */');
  if (compatibility.length) html = html.replace('</head>', `<style id="mira-ultrafast-contract">\n${compatibility.join('\n')}\n</style>\n</head>`);
  html = html.replace('</head>', `${MARKERS.cssStart}\n${MARKERS.cssEnd}\n</head>`);
```
