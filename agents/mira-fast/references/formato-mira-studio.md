# Formato Mira Studio 9:16

Saída final: `index.html`. Todo slide tem `fala` no plano; o roteiro e os módulos são responsabilidade da montagem.

## Layout `capa`

Use uma section sem `data-layout`, com título e subtítulo. Vale somente para tipo capa ou encerramento.

## Layout `camera`

Sempre estático e sem texto:

```html
<section data-layout="camera"><div class="cam-area"></div></section>
```

## Layout `split`

Quadrado 1:1 no topo e câmera no restante:

```html
<section data-layout="split">
  <div class="split-top">
    <h2>TÍTULO</h2>
    <!-- @MIRA:SIZE 3/10 -->
    <div class="anim-stage" id="SLUG-stage"><svg id="SLUG-svg" viewBox="0 0 960 960"></svg></div>
  </div>
  <div class="cam-area"></div>
</section>
```

Use metáfora radial, orbital ou hub e preencha o quadrado. Em folha estática, preserve `split-top` e `cam-area`, mas omita palco e marcador de animação.

## Layout `full`

Animação retrato sem câmera:

```html
<section data-layout="full">
  <h2>TÍTULO</h2>
  <!-- @MIRA:SIZE 3/10 -->
  <div class="anim-stage" id="SLUG-stage"><svg id="SLUG-svg" viewBox="0 0 960 1522.5"></svg></div>
</section>
```

Use eixo vertical dominante. Não inclua `.cam-area`.
