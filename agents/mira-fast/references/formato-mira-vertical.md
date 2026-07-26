# Formato Mira Vertical 9:16

Saída final: `index-9x16.html`. Não use `data-layout`.

## Folha animada

Exiba somente título e animação. Use eixo dominante na altura.

```html
<section class="slide">
  <h2>TÍTULO</h2>
  <!-- @MIRA:SIZE 3/10 -->
  <div class="anim-stage" id="SLUG-stage">
    <svg id="SLUG-svg" viewBox="0 0 960 1522.5" preserveAspectRatio="xMidYMid meet"></svg>
  </div>
</section>
```

Inclua no CSS do fragmento:

```css
#SLUG-stage { height: auto; aspect-ratio: 128 / 203; }
```

- Reformule fluxos horizontalmente largos para cima/baixo.
- Empilhe comparações.
- Use `font-size` SVG de pelo menos 24 no viewBox de largura 960.
- Não mostre subtítulo, cabeçalho, replay ou pílulas.

## Folha estática

Capa e encerramento usam título/subtítulo centralizados e não criam palco. Cards e CTA empilham conteúdo verticalmente.
