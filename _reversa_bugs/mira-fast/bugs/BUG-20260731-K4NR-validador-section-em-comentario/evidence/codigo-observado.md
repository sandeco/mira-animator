# Código observado — BUG-20260731-K4NR

Extraído de `/workspaces/.mira` no commit `558a406`, em 2026-07-31.

## A checagem: agents/mira-fast/scripts/assemble-run.mjs (231 a 234)

```js
  if (slidesStart >= 0 && slidesEnd > slidesStart) {
    const outside = `${skeleton.slice(0, slidesStart)}${skeleton.slice(slidesEnd + SLOT_MARKERS.slidesEnd.length)}`;
    if (/<section\b/i.test(outside)) errors.push('esqueleto contém <section> fora do slot de slides');
  }
```

## Checagem irmã na saída final (339 a 342)

```js
    const sectionCount = (output.match(/<section\b/gi) ?? []).length;
    if (sectionCount !== plan.slides.length) {
      throw new Error(`saída possui ${sectionCount} section(s), esperado ${plan.slides.length}`);
    }
```

## Checagem irmã no ultrafast: build-skeleton.mjs (20 a 25) e o contorno (53 a 54)

```js
function assertSkeleton(html) {
  for (const marker of Object.values(MARKERS)) {
    if (html.split(marker).length !== 2) throw new Error(`marcador ausente ou duplicado: ${marker}`);
  }
  if (/<section\b/i.test(html)) throw new Error('esqueleto ainda contém section');
}
```

```js
  // Tags citadas em comentários não são elementos; encode para os validadores.
  html = html.replaceAll('<section>', '&lt;section&gt;').replaceAll('</section>', '&lt;/section&gt;');
```

## Os doze gatilhos em templates/decks/mira-studio-demo/index.html

Todos são menção em comentário, nenhum é tag real. HTML e JS misturados.

```
38:        /* cada <section> é um slide: coluna 9:16 central, laterais em #333333 */
121:              por cima da coluna. É IRMÃO das <section>, nunca filho — é isso
176:        /* overlay central: o que se lê no ar. Irmão das <section>, não filho. */
211:           DEVA entrar no vídeo — ela fica DENTRO da <section>. */
232:         As <section> abaixo são o FALLBACK: em http(s) o builder do roteiro.md
283:    <!-- TELEPROMPTER · overlay central (o que se lê no ar). IRMÃO das <section>:
318:           "## Slide N | layout | Título" vira uma <section>, na ORDEM em que
325:           <section> estáticas, que SÃO o conjunto de slides padrão.
333:           Chrome autoral dentro da <section> (logo, selo .me-ov) precisa ser
832:           O overlay NÃO entra no vídeo porque é IRMÃO das <section> e o
1066:           Overlay que DEVE entrar no vídeo (logo, selo) fica DENTRO da <section>.
1068:           dentro da <section> precisa ser emitido pelo builder do roteiro,
```

Para comparação, uma tentativa de listar só as tags reais com `grep -nE "^\s*<section\b"`.
Note que a linha 325 é comentário e entra assim mesmo: a heurística de indentação também
não separa tag de texto. Ilustra o problema em vez de resolvê-lo.

```
234:    <section class="capa">
246:    <section data-layout="camera">
251:    <section data-layout="split">
260:    <section data-layout="full">
325:           <section> estáticas, que SÃO o conjunto de slides padrão.
```
