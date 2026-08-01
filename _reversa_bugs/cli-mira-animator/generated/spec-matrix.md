<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-08-01T01:30:00Z a partir de 1 bug -->

# Matriz BUG ↔ SPEC · cli-mira-animator

Spec efetiva = original + adendos vigentes.

| seção de spec | open | active | resolved |
|---|---|---|---|
| `mira-fast/sdd/01-invocacao-e-formatos.md#r7-montagem-do-esqueleto-do-deck` | — | VPUH | — |
| **`addenda/bug-BUG-20260801-VPUH-v001.md#r7d`** (novo) | — | VPUH | — |
| **spec-gap** | — | VPUH *(resolvido pelo adendo)* | — |

## Leitura

O `01#R7` era a única seção próxima do defeito, e por isso mesmo expôs a lacuna: ele
estabelece o caminho canônico e trata `--theme` como parâmetro efetivo, mas nunca diz que
existem templates que não aceitam tema, nem o que o CLI faz quando o marcador falta.

O `sandeco-just-animation-template` era exceção **codificada sem spec** desde sempre. O
adendo regulariza isso: R7b nomeia o conjunto `THEME_AGNOSTIC` e o critério de entrada, R7c
explica por que o bloco existe mesmo em template agnóstico, e R7d proíbe o CLI de declarar
tema que não aplicou.

## Adendos

| adendo | desde | tipo | seção alvo |
|---|---|---|---|
| [`bug-BUG-20260801-VPUH-v001.md`](../../../_reversa_sdd/addenda/bug-BUG-20260801-VPUH-v001.md) | 2026-08-01 | aditivo | `01-invocacao-e-formatos.md`, complementa R7 |

Imutável. Correção futura entra como `v002`.

O adendo declara o que **não** decide: se os Studio deveriam ser temáveis, e se o
`mesa-tatica` deveria. Os três entraram em `THEME_AGNOSTIC` por preservação de comportamento,
não por análise de produto.
