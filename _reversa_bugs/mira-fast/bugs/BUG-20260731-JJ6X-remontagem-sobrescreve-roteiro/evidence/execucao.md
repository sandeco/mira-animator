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

Copiei o deck já montado, editei uma fala no `roteiro.md` como faria o usuário, e rodei a
Fase 3 outra vez:

```js
const editado = readFileSync(join(d1,'roteiro.md'),'utf8')
  .replace('Fala da capa.','FALA REESCRITA PELO USUARIO NO EDITOR DELE.');
writeFileSync(join(d1,'roteiro.md'), editado);
assembleRun(d1, { projectRoot: ROOT });
```

## Saída

```
=== EXP 1: re-montagem sobrescreve o roteiro.md editado pelo usuario? ===
edicao do usuario sobreviveu? false
voltou para a fala do plano?  true
```

A montagem devolveu `ok: true`. Nada no `montagem.log` menciona o `roteiro.md`.

## O código

```js
const roteiro = buildRoteiro(plan);                                               // 350
if (roteiro !== null) writeFileSync(join(deckDir, 'roteiro.md'), roteiro, 'utf8'); // 351
```

Sem `existsSync`, sem comparação, sem backup, sem log.
