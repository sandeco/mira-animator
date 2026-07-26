# Formato Mira Studio Full 16:9

Saída final: `index-16x9.html`. Todo slide tem `fala`; roteiro, teleprompter e módulos pertencem à montagem.

## Layout `camera`

Sempre estático e sem texto:

```html
<section data-layout="camera"><div class="cam-area"></div></section>
```

## Layout `thirds`

Animação nos dois terços da esquerda e câmera no terço direito:

```html
<section data-layout="thirds">
  <div class="thirds-main">
    <h2>TÍTULO</h2>
    <!-- @MIRA:SIZE 3/10 -->
    <div class="anim-stage" id="SLUG-stage"><svg id="SLUG-svg" viewBox="0 0 1280 720"></svg></div>
  </div>
  <div class="cam-area"></div>
</section>
```

A montagem garante `thirds-main` com 66,667%, `cam-area` com 33,333%, padding de 50 px e divisor sutil.

## Layout `full`

```html
<section data-layout="full">
  <div class="full-main">
    <h2>TÍTULO</h2>
    <!-- @MIRA:SIZE 3/10 -->
    <div class="anim-stage" id="SLUG-stage"><svg id="SLUG-svg" viewBox="0 0 1280 720"></svg></div>
  </div>
</section>
```

Não inclua `.cam-area`. Folhas estáticas preservam `thirds-main` ou `full-main`, mas omitem o palco e o protocolo de animação.
