<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-08-01T21:56:00Z a partir de 1 bugs -->

# Matriz BUG ↔ SPEC · modo-edicao

Spec efetiva = original + adendos vigentes. Adendo aparece aqui como qualquer outra seção de spec,
porque é isso que ele é depois de vigente.

| bug | seção de spec | veredito |
|---|---|---|
| 6UHJ | `_reversa_sdd/mira-edit-livre/sdd/selecao-de-elemento.md#rf-04` | pendente |
| 6UHJ | `_reversa_sdd/mira-edit-livre/sdd/selecao-de-elemento.md#rf-05` | pendente |

RF-04: "manter no máximo um elemento selecionado por vez, trocando a seleção ao clicar em outro
elemento". RF-05: "limpar a seleção clicando numa área vazia do slide ou pressionando Esc". Ambos
`Must`. O veredito de spec é decisão humana e fica para o `/reversa-debugger-fix`.

## Adendos gerados por bugs deste contexto

Nenhum ainda.

## Bugs sem seção de spec

Nenhum: o 6UHJ tem spec definindo o comportamento esperado, então não recebe o label `spec-gap`.

## Referência histórica

`_reversa_sdd/edit-stuck-fix/MENSAGEM-PARA-CODEX.md` documenta a correção anterior do mesmo relato
(auto-cura de `textCtx`/`drag`/`altDown` presos). Verificado nesta sessão: a auto-cura está presente
em 50/50 cópias de `mira-edit-free.js` do repositório, então o 6UHJ não é regressão daquela.

> `_reversa_sdd/` está no `.gitignore`. As specs existem no disco e são referenciadas pelos
> `bug.md`, mas não entram nos commits.
