<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-08-01T01:30:00Z a partir de 4 bugs -->

# Índice de bugs · templates-studio

Contexto: templates de deck dos formatos Studio (`mira-studio`, `mira-studio-full`).
Closure policy: `package`.

## Resumo por status

| status | bugs |
|---|---|
| open | 3 |
| active | 1 |
| resolved | 0 |

## Resumo por phase

| phase | bugs |
|---|---|
| triaging | 3 |
| delivering | 1 |

## Bugs abertos e ativos

| # | ID | prio | sev | labels | título | caminho | bloqueado |
|---|---|---|---|---|---|---|---|
| 2 | [S3TX](../bugs/BUG-20260731-S3TX-studio-full-apaga-slides/bug.md) | P0 | critical | — | mira-studio-full apaga todos os slides gerados | `bugs/BUG-20260731-S3TX-studio-full-apaga-slides/` | não |
| 1 | [JZNJ](../bugs/BUG-20260731-JZNJ-builder-roteiro-descarta-palco/bug.md) | P1 | critical | — | Builder do roteiro.md descarta o palco e a animação nunca toca | `bugs/BUG-20260731-JZNJ-builder-roteiro-descarta-palco/` | não |
| 3 | [OI56](../bugs/BUG-20260731-OI56-esqueleto-sem-marcadores-mira/bug.md) | P1 | high | **active** · delivering | Fase 1 parte do template cru e o esqueleto nasce reprovado nos quatro formatos | `bugs/BUG-20260731-OI56-esqueleto-sem-marcadores-mira/` | não |
| 8 | [RNYU](../bugs/BUG-20260731-RNYU-falas-de-demonstracao-vazam/bug.md) | P2 | medium | — | Falas de demonstração vazam para todo deck e viram o teleprompter em file:// | `bugs/BUG-20260731-RNYU-falas-de-demonstracao-vazam/` | não |

Nenhum `blocking` preenchido. As dependências de ordem estão nas Agent Notes.

## Corrigido, aguardando entrega

| # | ID | resolution_kind | causa raiz | veredito | adendo |
|---|---|---|---|---|---|
| 3 | OI56 | `fixed` | confirmed | `spec-correta` | nenhum (o adendo do BUG-20260801-VPUH cobre o gap vizinho) |

Corrigido em 2026-08-01 junto com o BUG-20260801-VPUH, do contexto `cli-mira-animator`.
**Escopo revisado**: registrado como defeito de template dos formatos Studio, provou-se
defeito de instrução da Fase 1, atingindo os quatro formatos. Dois dos três sintomas
originais foram desmentidos com medição.

## Resolvidos

Nenhum. Nenhuma pasta tem `DONE.md`.

## Restritos

Nenhum bug com `visibility: restricted`.

## Inconsistências

Nenhuma. Validação global sobre os 11 bugs dos dois contextos passou.

## Origem

| origin.type | bugs |
|---|---|
| manual-report | 3 (JZNJ, S3TX, OI56) |
| inspection | 1 (RNYU) |

## Confirmação por execução

A varredura `../inspections/2026-07-31-decks-studio/report.md` reproduziu JZNJ e OI56 em
execução, com a saída anexada ao relatório. O S3TX continua baseado em leitura de código: a
varredura montou um deck 9:16 e não chegou a montar um 16:9.

## Observação de classificação

`taxonomy.yaml` continua vazio. Propostas nas Agent Notes: `area: geracao-de-decks`,
`module: templates-studio`, com `feature` em `builder-roteiro` (JZNJ, S3TX),
`contrato-de-esqueleto` (OI56) e `teleprompter` (RNYU).
