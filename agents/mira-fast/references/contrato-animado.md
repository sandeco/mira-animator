# Folha animada

Aplique quando `modo_folha` for `animada`.

## Temperamento

`sereno` é o padrão. `tenso` só quando o plano pedir tensão na cena.

| | `sereno` (padrão) | `natural` | `tenso` |
|---|---|---|---|
| Ciclo do loop | 9 a 14 s | 7 a 10 s | 4,5 a 7 s |
| Beats | 4 a 5 | 5 a 6 | 6 a 7 |
| Repouso antes de reiniciar | 1,2 a 2,0 s | 0,8 a 1,2 s | 0,4 a 0,7 s |
| Atraso causa e efeito | 250 a 500 ms | 150 a 350 ms | 120 a 250 ms |
| Famílias de easing | `sine`, `power1`, `power2` | `power2`, `power3` | `power4`, `expo`, `back` |
| Atores em movimento simultâneo | 1 focal, 1 ambiente | 1 focal, 2 apoios | livre |

`back`, `elastic` e `bounce` ficam fora do padrão: só em `tenso`, ou quando a física da metáfora os exigir.

Todo ciclo contém pelo menos **1 segundo contínuo sem evento focal**. Só ambiente.

## História e movimento

- Preserve a frase causal e a metáfora do plano.
- Encene estado inicial, causa, transformação, consequência e recuperação no número de beats do temperamento.
- Mostre uma ação focal por vez.
- Faça a causa preceder o efeito pelo atraso do temperamento.
- Use antecipação de 8% a 15% e sustente a consequência pelo repouso do temperamento.
- Esconda o corte do loop. Em `sereno`, prefira deriva lenta contínua a repetir o gesto focal.
- Represente objetos concretos por silhuetas ou ícones flat, nunca bolinhas genéricas.
- Use easing coerente com massa e intenção, dentro da família do temperamento.

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
- Defina somente a função de animação. Não a invoque, não crie `IntersectionObserver`, não ligue replay e não registre `DOMContentLoaded`; o montador Node gera esses triggers uma única vez.

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
