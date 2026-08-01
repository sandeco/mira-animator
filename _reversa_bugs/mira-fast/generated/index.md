<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-08-01T06:00:00Z a partir de 7 bugs -->

# Índice de bugs · mira-fast

Contexto: pipeline de geração de decks do `/mira-fast` (contratos de formato, validação e
montagem). Closure policy: `package`.

## Resumo por status

| status | bugs |
|---|---|
| open | 0 |
| active | 7 |
| resolved | 0 |

## Resumo por phase

| phase | bugs |
|---|---|
| delivering | 7 |

## Bugs abertos e ativos

| # | ID | prio | sev | status/phase | título | bloqueado |
|---|---|---|---|---|---|---|
| 4 | [K4NR](../bugs/BUG-20260731-K4NR-validador-section-em-comentario/bug.md) | P1 | high | **active** · delivering | esqueleto: section em comentário | não |
| 5 | [VPVV](../bugs/BUG-20260731-VPVV-capa-sem-classe-vira-camera/bug.md) | P1 | high | **active** · delivering | capa vira slide de câmera vazio | não |
| 7 | [JJ6X](../bugs/BUG-20260731-JJ6X-remontagem-sobrescreve-roteiro/bug.md) | P1 | high | **active** · delivering | re-montagem apaga o roteiro.md | não |
| 9 | [BNO4](../bugs/BUG-20260731-BNO4-contagem-de-section-conta-comentario/bug.md) | P1 | high | **active** · delivering | contagem final conta comentário | não |
| 6 | [UDTY](../bugs/BUG-20260731-UDTY-full-sem-full-wrap/bug.md) | P2 | medium | **active** · delivering | full sem .full-wrap | não |
| 10 | [ETPU](../bugs/BUG-20260731-ETPU-falha-tardia-deixa-deck-meio-instalado/bug.md) | P2 | medium | **active** · delivering | deck meio instalado | não |
| 11 | [AMOM](../bugs/BUG-20260731-AMOM-validador-studio-frouxo/bug.md) | P2 | medium | **active** · delivering | validador Studio frouxo | não |

## Corrigidos, aguardando entrega

7 bug(s) em `delivering`: código corrigido, testes verdes, veredito de spec
registrado, **falta merge e versão publicada**. A closure policy `package` não permite fechar
antes disso, e nenhum deles recebe `DONE.md` até lá.

- [K4NR](../bugs/BUG-20260731-K4NR-validador-section-em-comentario/bug.md) — veredito `spec-gap`, risco `baixa`
- [VPVV](../bugs/BUG-20260731-VPVV-capa-sem-classe-vira-camera/bug.md) — veredito `spec-gap`, risco `baixa`
- [UDTY](../bugs/BUG-20260731-UDTY-full-sem-full-wrap/bug.md) — veredito `spec-gap`, risco `baixa`
- [JJ6X](../bugs/BUG-20260731-JJ6X-remontagem-sobrescreve-roteiro/bug.md) — veredito `spec-gap`, risco `baixa`
- [BNO4](../bugs/BUG-20260731-BNO4-contagem-de-section-conta-comentario/bug.md) — veredito `spec-correta`, risco `baixa`
- [ETPU](../bugs/BUG-20260731-ETPU-falha-tardia-deixa-deck-meio-instalado/bug.md) — veredito `spec-gap`, risco `baixa`
- [AMOM](../bugs/BUG-20260731-AMOM-validador-studio-frouxo/bug.md) — veredito `spec-correta`, risco `baixa`

## Cobertura de teste

| ID | reprodução | regressão |
|---|---|---|
| K4NR | 3 | 3 |
| VPVV | 2 | 2 |
| UDTY | 1 | 2 |
| JJ6X | 1 | 2 |
| BNO4 | 3 | 3 |
| ETPU | 2 | 2 |
| AMOM | 2 | 2 |
