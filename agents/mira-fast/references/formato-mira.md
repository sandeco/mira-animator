# Formato Mira 16:9

Saída final: `index.html`. A folha não escreve o arquivo final.

## Folha animada

Use o card Mira completo: moldura, cabeçalho, palco e base de pílulas.

```html
<section>
  <div class="w-full max-w-6xl">
    <div class="glass-card rounded-3xl p-4">
      <div class="flex items-center justify-between">
        <div><h2>TÍTULO</h2><p>SUBTÍTULO</p></div>
        <button id="replay-SLUG" class="replay-btn" type="button">Replay</button>
      </div>
      <!-- @MIRA:SIZE 3/10 -->
      <div class="anim-stage" id="SLUG-stage">
        <svg id="SLUG-svg" viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid meet"></svg>
      </div>
      <div class="border-t border-white/10"><div class="attribute-pill">PÍLULAS</div></div>
    </div>
  </div>
</section>
```

- Título: máximo seis palavras, idêntico ao plano, sem ícone.
- Subtítulo, pílulas e ícone de moldura são obrigatórios.
- `viewBox="0 0 1280 720"`.
- Use somente cores da paleta.

## Folha estática

Capa, card, CTA e encerramento usam uma única section e as classes visuais já presentes no esqueleto. Não crie palco vazio. Capa usa `h1`; demais usam `h2` quando houver título.
