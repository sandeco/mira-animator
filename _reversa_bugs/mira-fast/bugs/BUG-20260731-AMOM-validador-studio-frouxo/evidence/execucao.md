# Execução observada

Varredura `/reversa-depth-inspection` de 2026-07-31, no repositório fonte `/workspaces/.mira`,
commit `558a406`. Todos os trechos abaixo são saída real de comando, não reconstrução.

## Deck usado na reprodução

Montei `decks/2026-07-31 pente-fino-studio` num diretório temporário, com quatro slides
(capa, camera, split animado, full animado). Os fragmentos foram escritos exatamente como
`agents/mira-fast/references/formato-mira-studio.md` prescreve, sem nenhuma liberdade. O
esqueleto veio do template real, preparado por
`agents/mira-ultrafast/scripts/build-skeleton.mjs`, que é hoje a única forma automática de
obter um esqueleto válido a partir de `templates/decks/mira-studio-demo/index.html`.

Os scripts da reprodução estão no scratchpad da sessão e são reexecutáveis:
`repro.mjs`, `repro2.mjs`, `repro3.mjs`, `repro4.mjs`, `repro5.mjs`, `parse-test.mjs`.


## Experimento

Peguei o fragmento `split` válido do deck e removi `class="anim-stage"` do palco e o `id` do
`<svg>`:

```html
<!-- antes -->
<div class="anim-stage" id="hub-central-stage"><svg id="hub-central-svg" viewBox="0 0 960 960">
<!-- depois -->
<div id="hub-central-stage"><svg viewBox="0 0 960 960">
```

Depois rodei o mesmo fragmento sob os dois formatos, mudando só `plano.formato`.

## Saída

```
=== EXP 5: fragmento Studio SEM class="anim-stage" e SEM id do svg ===
validate-run aprova? true []

=== EXP 6: mesmo fragmento no formato mira (para comparar) ===
validate-run aprova no formato mira? false
erros que SO o formato mira cobra: [
  'slide 3: mira animado exige .slide-main',
  'slide 3: mira animado exige .anim-stage',
  'slide 3: id do svg ausente',
  'slide 3: mira-default não aceita viewBox fixo no HTML',
  'slide 3: mira animado deve calcular viewBox no JavaScript'
]
```

Zero erros contra cinco erros, para o mesmo fragmento.

## O fixture do repositório já nasce fora do contrato

`test/mira-fast-assemble.test.mjs:170-172`:

```js
} else if (format === 'mira-studio') {
  html = '<section data-layout="split"><div class="split-top"><h2>Dois fluxos</h2><!-- @MIRA:SIZE 3/10 --><div id="corrida-stage"><svg viewBox="0 0 960 960"></svg></div></div><div class="cam-area"></div></section>';
```

Sem `class="anim-stage"`, sem `id="corrida-svg"`. O teste passa.

## O CSS que depende da classe, no template

```css
.anim-stage { flex: 1 1 auto; min-height: 0; width: 100%; }
.anim-stage svg { width: 100%; height: 100%; display: block; }
```
