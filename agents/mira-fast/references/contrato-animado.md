# Folha animada

Aplique quando `modo_folha` for `animada`.

## História e movimento

- Preserve a frase causal e a metáfora do plano.
- Encene estado inicial, causa, transformação, consequência e recuperação em 5 a 7 beats.
- Mostre uma ação focal por vez.
- Faça a causa preceder o efeito por 120 a 400 ms.
- Use antecipação de 8% a 15% e sustente a consequência por 400 a 900 ms.
- Esconda o corte do loop.
- Represente objetos concretos por silhuetas ou ícones flat, nunca bolinhas genéricas.
- Use easing coerente com massa e intenção.

## Protocolo obrigatório

- Use `kind=animated`.
- Coloque `<!-- @MIRA:SIZE 3/10 -->` imediatamente antes de `#<slug_stage>-stage`.
- Use `slug_stage` nos ids DOM e `js_id` nos identificadores JavaScript.
- Defina `function animate<PascalJsId>()`.
- Limpe timers anteriores com `clearInterval` ou `clearTimeout`.
- Incremente `window.__<js_id>Gen`; toda recursão compara a geração capturada.
- Limpe o palco antes de reconstruir a cena.
- Use `replay-<slug_stage>` para replay quando o formato o exibir.
- Mantenha algum movimento ambiente depois da entrada.
- Em callbacks de `d3.timer`, use `try/catch` para não congelar a fila global do D3.

Esqueleto JavaScript:

```html
<script>
function animateExemplo() {
  clearTimeout(window.__exemploTimer);
  window.__exemploGen = (window.__exemploGen || 0) + 1;
  const myGen = window.__exemploGen;
  const svg = d3.select('#exemplo-svg');
  svg.selectAll('*').remove();

  function loop() {
    if (myGen !== window.__exemploGen) return;
    window.__exemploTimer = setTimeout(loop, 1000);
  }
  loop();
}
</script>
```

Substitua `exemplo` pelos campos do plano. O contrato do formato define a geometria e o HTML.
