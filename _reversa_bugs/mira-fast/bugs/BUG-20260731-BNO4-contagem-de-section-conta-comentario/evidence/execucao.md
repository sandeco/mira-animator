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

Acrescentei ao bloco `js` da folha 3 um comentário legítimo, do tipo que qualquer folha bem
escrita produziria:

```js
// o palco vive dentro da <section> data-layout=split
```

## Saída

```
=== EXP 4: fragmento cujo JS contem a string "<section" ===
validate-run --slide 3 aprova o fragmento? true []
assemble FALHOU: saída possui 5 section(s), esperado 4
```

A folha foi aprovada com **zero erros** pelo validador que o contrato manda ela rodar
(`contrato-base.md`), e gravaria `result-03.json` com `ok: true` de boa-fé. A montagem morreu
depois, com uma mensagem que não aponta para a folha 3.

## As duas contagens, com critérios diferentes

`assemble-run.mjs:339`, sobre a saída inteira, incluindo CSS e JS das folhas:

```js
const sectionCount = (output.match(/<section\b/gi) ?? []).length;
```

`validate-run.mjs:129-133`, só até o marcador de CSS:

```js
const htmlBlock = cssPos >= 0 ? fragment.slice(0, cssPos) : fragment;
const opens = (htmlBlock.match(/<section\b/gi) ?? []).length;
```

O bloco `js` fica fora do alcance do validador e dentro do alcance da montagem.
