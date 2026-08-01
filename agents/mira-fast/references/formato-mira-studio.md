# Formato Mira Studio 9:16

Saída final: `index.html`. Todo slide tem `fala` no plano; o roteiro e os módulos são responsabilidade da montagem.

## Layout `capa`

Section sem `data-layout` e **com `class="capa"`**, título e subtítulo. Vale somente para tipo capa ou encerramento.

```html
<section class="capa">
  <h1>TÍTULO</h1>
  <p>SUBTÍTULO</p>
</section>
```

A classe não é decoração: `section.capa` é o layout próprio da capa, e o builder do `roteiro.md` usa `body > section.capa` para reconhecer o slide. Sem ela a capa vira uma área de câmera vazia.

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
  <div class="full-wrap">
    <h2>TÍTULO</h2>
    <!-- @MIRA:SIZE 3/10 -->
    <div class="anim-stage" id="SLUG-stage"><svg id="SLUG-svg" viewBox="0 0 960 1522.5"></svg></div>
  </div>
</section>
```

O `.full-wrap` carrega a área segura do formato (4,63% do lado, o padrão `mira-squared`). Sem ele o slide encosta nas bordas. Use eixo vertical dominante e não inclua `.cam-area`.
