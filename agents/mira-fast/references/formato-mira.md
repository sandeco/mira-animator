# Formato Mira 16:9

Saída final: `index.html`. A folha não escreve o arquivo final.

O formato usa sempre o template oficial `mira-default`: título no topo e animação ocupando todo o espaço restante. Não use card, pílulas, ícone de moldura, subtítulo de conteúdo ou botão de replay.

## Folha animada

Substitua `SLUG` pelo `slug_stage`:

```html
<section>
  <div class="slide-main">
    <h2>TÍTULO COM <span class="accent">DESTAQUE</span></h2>
    <!-- @MIRA:SIZE 3/10 -->
    <div class="anim-stage" id="SLUG-stage">
      <svg id="SLUG-svg" preserveAspectRatio="xMidYMid meet"></svg>
    </div>
  </div>
</section>
```

- O título deve ser idêntico ao plano e ter no máximo seis palavras.
- Não fixe `viewBox` no HTML.
- A metáfora deve preencher o palco flexível. O marcador `3/10` é relativo a esse palco maior.
- A função da animação calcula a geometria real:

```js
var svg = d3.select('#SLUG-svg');
var r = svg.node().closest('.anim-stage').getBoundingClientRect();
var H = Math.round(960 * r.height / r.width);
svg.attr('viewBox', '0 0 960 ' + H);
```

- Não use hex fixo no JavaScript. Leia a cor do tema:

```js
var primary = getComputedStyle(document.documentElement)
  .getPropertyValue('--mira-primary')
  .trim();
```

## Folha estática

Capa:

```html
<section>
  <div class="slide-centro">
    <h1>TÍTULO COM <span class="accent">DESTAQUE</span></h1>
  </div>
</section>
```

Card, CTA e encerramento usam a mesma estrutura com `h2`:

```html
<section>
  <div class="slide-centro">
    <h2>TÍTULO COM <span class="accent">DESTAQUE</span></h2>
  </div>
</section>
```

Não crie card interno. O CSS de escala, centralização e responsividade vem do esqueleto `mira-default`.
