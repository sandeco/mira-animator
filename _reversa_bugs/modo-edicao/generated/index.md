<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-08-01T21:56:00Z a partir de 1 bugs -->

# Índice de bugs · modo-edicao

Contexto: modo de edição do deck (tecla E): `mira-edit.js` e `mira-edit-free.js` em
`templates/authoring/`, propagados para `mira/` de cada deck. Closure policy: `package`.

## Resumo por status

| status | bugs |
|---|---|
| open | 1 |
| active | 0 |
| resolved | 0 |

## Resumo por phase

| phase | bugs |
|---|---|
| triaging | 1 |

## Bugs abertos e ativos

| # | ID | prio | sev | status/phase | título | bloqueado |
|---|---|---|---|---|---|---|
| 15 | [6UHJ](../bugs/BUG-20260801-6UHJ-overlay-de-selecao-engole-o-clique/bug.md) | P1 | high | **open** · triaging | O overlay de seleção engole o clique e nunca desseleciona | não |

## Cobertura de teste

| ID | reprodução | regressão |
|---|---|---|
| 6UHJ | 0 | 0 |

Nenhum teste ainda: o bug está em `triaging`. Os testes nascem no `/reversa-debugger-fix`.

## Reprodução

| ID | classificação | taxa |
|---|---|---|
| 6UHJ | deterministic | 10/10 |

## Alerta de propagação

A fonte canônica do código afetado é `templates/authoring/mira-edit-free.js`, mas o arquivo está
copiado em ~50 decks sob `decks/`, `examples/` e `tests/`. Corrigir o template não conserta deck já
instalado; a propagação é `npx mira-animator edit <deck>` mais versão publicada, que é justamente o
que a `closure_policy: package` exige.
