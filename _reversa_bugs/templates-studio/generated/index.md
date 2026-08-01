<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-08-01T06:00:00Z a partir de 4 bugs -->

# Índice de bugs · templates-studio

Contexto: templates de deck dos formatos Studio (builder do `roteiro.md`, teleprompter e
esqueleto). Closure policy: `package`.

## Resumo por status

| status | bugs |
|---|---|
| open | 0 |
| active | 4 |
| resolved | 0 |

## Resumo por phase

| phase | bugs |
|---|---|
| delivering | 4 |

## Bugs abertos e ativos

| # | ID | prio | sev | status/phase | título | bloqueado |
|---|---|---|---|---|---|---|
| 2 | [S3TX](../bugs/BUG-20260731-S3TX-studio-full-apaga-slides/bug.md) | P0 | critical | **active** · delivering | studio-full apaga os slides gerados | não |
| 1 | [JZNJ](../bugs/BUG-20260731-JZNJ-builder-roteiro-descarta-palco/bug.md) | P1 | critical | **active** · delivering | builder descarta o palco do slide | não |
| 3 | [OI56](../bugs/BUG-20260731-OI56-esqueleto-sem-marcadores-mira/bug.md) | P1 | high | **active** · delivering | esqueleto sem marcadores @MIRA | não |
| 8 | [RNYU](../bugs/BUG-20260731-RNYU-falas-de-demonstracao-vazam/bug.md) | P2 | medium | **active** · delivering | falas de demonstração vazam | não |

## Corrigidos, aguardando entrega

4 bug(s) em `delivering`: código corrigido, testes verdes, veredito de spec
registrado, **falta merge e versão publicada**. A closure policy `package` não permite fechar
antes disso, e nenhum deles recebe `DONE.md` até lá.

- [JZNJ](../bugs/BUG-20260731-JZNJ-builder-roteiro-descarta-palco/bug.md) — veredito `spec-gap`, risco `média`
- [S3TX](../bugs/BUG-20260731-S3TX-studio-full-apaga-slides/bug.md) — veredito `spec-gap`, risco `média`
- [OI56](../bugs/BUG-20260731-OI56-esqueleto-sem-marcadores-mira/bug.md) — veredito `spec-correta`, risco `baixa`
- [RNYU](../bugs/BUG-20260731-RNYU-falas-de-demonstracao-vazam/bug.md) — veredito `spec-gap`, risco `baixa`

## Cobertura de teste

| ID | reprodução | regressão |
|---|---|---|
| JZNJ | 1 | 3 |
| S3TX | 2 | 3 |
| OI56 | 3 | 4 |
| RNYU | 3 | 2 |
