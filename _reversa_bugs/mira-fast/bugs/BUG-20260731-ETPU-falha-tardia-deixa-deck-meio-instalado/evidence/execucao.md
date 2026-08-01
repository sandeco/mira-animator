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

Apaguei do deck os arquivos de runtime e o `index.html`, provoquei a falha da linha 340 e
listei o que sobrou.

## Saída

```
=== EXP 4 ===
assemble FALHOU: saída possui 5 section(s), esperado 4
efeitos colaterais deixados pela falha:
    mira/mira-camera.js          CRIADO
    mira/mira-studio-server.cjs  CRIADO
    mira-studio-windows.bat      CRIADO
    assets/vendor/d3.v7.min.js   CRIADO
    index.html                   ausente
```

## Contraste: falha antes da instalação não deixa resíduo

```
=== EXP 2: falha na montagem deixa efeitos colaterais no deck? ===
falhou com: esqueleto contém <section> fora do slot de slides
  criado mesmo com a falha? mira/mira-camera.js          false
  criado mesmo com a falha? mira/mira-studio-server.cjs  false
  criado mesmo com a falha? mira-studio-windows.bat      false
  criado mesmo com a falha? assets/vendor/d3.v7.min.js   false
  criado mesmo com a falha? index.html                   false
```

A janela do problema é exatamente entre a linha 319 (`installRuntime`) e a 348
(`publishOutput`).
