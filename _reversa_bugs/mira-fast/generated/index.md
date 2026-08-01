<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-07-31T23:55:00Z a partir de 7 bugs -->

# Índice de bugs · mira-fast

Contexto: pipeline de geração de decks do `/mira-fast` (contratos de formato, validação e
montagem). Closure policy: `package`.

## Resumo por status

| status | bugs |
|---|---|
| open | 5 |
| active | 2 |
| resolved | 0 |

## Resumo por phase

| phase | bugs |
|---|---|
| triaging | 5 |
| delivering | 2 |

## Bugs abertos e ativos

| # | ID | prio | sev | status/phase | título | bloqueado |
|---|---|---|---|---|---|---|
| 4 | [K4NR](../bugs/BUG-20260731-K4NR-validador-section-em-comentario/bug.md) | P1 | high | **active** · delivering | validateSkeleton reprova o esqueleto por section citado em comentário | não |
| 9 | [BNO4](../bugs/BUG-20260731-BNO4-contagem-de-section-conta-comentario/bug.md) | P1 | high | **active** · delivering | Folha aprovada derruba a montagem pela contagem final de section | não |
| 5 | [VPVV](../bugs/BUG-20260731-VPVV-capa-sem-classe-vira-camera/bug.md) | P1 | high | open · triaging | Contrato não exige class="capa" e a capa vira slide de câmera vazio | não |
| 7 | [JJ6X](../bugs/BUG-20260731-JJ6X-remontagem-sobrescreve-roteiro/bug.md) | P1 | high | open · triaging | Re-montagem sobrescreve o roteiro.md editado pelo usuário | não |
| 6 | [UDTY](../bugs/BUG-20260731-UDTY-full-sem-full-wrap/bug.md) | P2 | medium | open · triaging | Contrato do layout full omite .full-wrap e perde a área segura | não |
| 10 | [ETPU](../bugs/BUG-20260731-ETPU-falha-tardia-deixa-deck-meio-instalado/bug.md) | P2 | medium | open · triaging | Falha tardia deixa o deck meio instalado | não |
| 11 | [AMOM](../bugs/BUG-20260731-AMOM-validador-studio-frouxo/bug.md) | P2 | medium | open · triaging | Validador de fragmento Studio aceita palco sem .anim-stage | não |

## Corrigidos, aguardando entrega

Os dois `active` estão em `delivering`: código corrigido, testes verdes, veredito de spec
aprovado, **falta merge e versão publicada**. A closure policy `package` não permite fechar
antes disso, e nenhum deles recebe `DONE.md` até lá.

| # | ID | resolution_kind | causa raiz | veredito | adendo |
|---|---|---|---|---|---|
| 4 | K4NR | `fixed` | confirmed | `spec-gap` | [bug-BUG-20260731-K4NR-v001.md](../../../_reversa_sdd/addenda/bug-BUG-20260731-K4NR-v001.md) |
| 9 | BNO4 | `fixed` | confirmed | `spec-correta` | nenhum |

Correção aplicada em 2026-07-31: `agents/mira-fast/scripts/validate-run.mjs`,
`agents/mira-fast/scripts/assemble-run.mjs` e `test/mira-fast-section-count.test.mjs`.
Suíte completa em 111/111.

## Resolvidos

Nenhum. Nenhuma pasta tem `DONE.md`.

## Restritos

Nenhum bug com `visibility: restricted`.

## Inconsistências

Nenhuma. Validação global sobre os 11 bugs dos dois contextos: IDs únicos, `display_number`
de 1 a 11 sem lacuna, nenhuma autorrelação, todas as relações apontam para IDs existentes,
nenhum ciclo de `duplicate-of`, nenhum `status: resolved` sem `resolution_kind`, nenhum
`DONE.md` órfão. Os dois `resolution_kind: fixed` têm `root_cause.state: confirmed`,
`regression_tests` não vazio e `spec_verdict` preenchido, como o invariante exige.

## Origem

| origin.type | bugs |
|---|---|
| inspection | 6 (VPVV, UDTY, JJ6X, BNO4, ETPU, AMOM) |
| manual-report | 1 (K4NR) |

## Observação de classificação

`taxonomy.yaml` continua vazio; todos entram como `unclassified`. Propostas nas Agent Notes:
`area: geracao-de-decks`, `module: mira-fast`, com `feature` em `contrato-de-formato`
(VPVV, UDTY), `validacao-de-esqueleto` (K4NR, BNO4), `validacao-de-fragmento` (AMOM),
`roteiro-md` (JJ6X) e `montagem-fase-3` (ETPU).
