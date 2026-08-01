# Código observado — BUG-20260731-JZNJ

Extraído de `/workspaces/.mira` no commit `558a406`, em 2026-07-31.

## Lado do template: templates/decks/mira-studio-demo/index.html

```js
                return out.replace(/\s+/g, ' ').trim();
            }

            var estaticas = Array.prototype.slice.call(document.querySelectorAll('body > section'));
            var capaBase = document.querySelector('body > section.capa');

            function palco(n) {
                return '<div class="anim-stage"><svg id="sv-slide-' + n +
                    '" preserveAspectRatio="xMidYMid meet"></svg></div>';
            }
            function montarSecao(s, n) {
                var sec;
                if (s.layout === 'capa' && capaBase) {
                    sec = capaBase.cloneNode(true);
```

```js
            window.__miraRoteiro = R;

            var novas = R.slides.map(function (s, i) { return montarSecao(s, i + 1); });
            var ancora = document.getElementById('mira-prompter');
            estaticas.forEach(function (sec) { sec.parentNode.removeChild(sec); });
            novas.forEach(function (sec) { document.body.insertBefore(sec, ancora); });
        })();
```

Guarda de protocolo (linha 362 a 364):

```js
            var isHttp = location.protocol === 'http:' || location.protocol === 'https:';
            window.__miraRoteiroPath = location.pathname.replace(/[^/]*$/, '') + 'roteiro.md';
            if (!isHttp) return;                    /* R-05: sem servidor, sem roteiro */

```

Documentação interna do template (linha 329 a 332):

```

           Este deck tem animação AUTORAL: o builder cria o palco vazio
           (svg#sv-slide-N, N = posição no roteiro) e cada animação escrita à
           mão se prende ao seu palco. Palco sem animação fica vazio, não quebra.
           Chrome autoral dentro da <section> (logo, selo .me-ov) precisa ser
```

## Lado do /mira-fast: agents/mira-fast/scripts/assemble-run.mjs

```js
function buildTriggers(plan) {
  const animated = plan.slides.filter((slide) => slide.modo_folha === 'animada');
  if (animated.length === 0) return '';
  const entries = animated.map((slide) => {
    const pascal = slide.js_id[0].toUpperCase() + slide.js_id.slice(1);
    return `    { stageId: ${JSON.stringify(`${slide.slug_stage}-stage`)}, replayId: ${JSON.stringify(`replay-${slide.slug_stage}`)}, run: animate${pascal} }`;
  }).join(',\n');
  return `(function miraFastBindAnimations() {
  const entries = [
${entries}
  ];
  const observed = new WeakSet();
  const replayBound = new WeakSet();
  const observer = new IntersectionObserver((changes) => {
    for (const change of changes) {
      if (!change.isIntersecting) continue;
      const entry = entries.find((item) => item.stageId === change.target.id);
      if (entry) entry.run();
    }
  }, { threshold: 0.4 });

  function bind() {
    for (const entry of entries) {
      const stage = document.getElementById(entry.stageId);
      if (stage && !observed.has(stage)) {
        observed.add(stage);
        observer.observe(stage);
      }
      const replay = document.getElementById(entry.replayId);
      if (replay && !replayBound.has(replay)) {
        replayBound.add(replay);
        replay.addEventListener('click', entry.run);
```

A Fase 3 grava roteiro.md também para mira-studio (linha 124 a 126):

```js
function buildRoteiro(plan) {
  if (!['mira-studio', 'mira-studio-full'].includes(plan.formato)) return null;
  const layouts = plan.formato === 'mira-studio'
    ? '`capa`, `camera`, `split` e `full`'
```
