# Folha animada

- Use `.slide-main`, título e `.anim-stage`; sem glass-card, pílulas ou ícone.
- Inclua `<!-- @MIRA:SIZE 5/10 -->`. O SVG casa o `viewBox` com a caixa real: base W=960 e H calculado por `getBoundingClientRect()`; nunca fixe 1280×720.
- Declare `function animate<PascalJsId>()`, cancele timers anteriores e incremente `window.__<js_id>Gen`.
- Coreografia tem repouso, virada e consequência; reinicia de forma segura e entra em loop interno perpétuo.
- Temperamento `sereno`: ciclo de 9 a 14 s, 4 a 5 beats, pelo menos 1 s contínuo sem evento focal, easing `sine` ou `power1` a `power2`. Nada de `back`, `elastic` ou `bounce`.
- Use a metáfora e os seis eixos recebidos. D3 lê cores com `getComputedStyle`.
