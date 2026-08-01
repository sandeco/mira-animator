<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-08-01T17:45:00Z a partir de 6 bugs -->

# Índice de bugs · templates-studio

Contexto: templates de deck dos formatos Studio (builder do `roteiro.md`, teleprompter e
esqueleto). Closure policy: `package`.

## Resumo por status

| status | bugs |
|---|---|
| open | 0 |
| active | 6 |
| resolved | 0 |

## Resumo por phase

| phase | bugs |
|---|---|
| delivering | 6 |

## Bugs abertos e ativos

| # | ID | prio | sev | status/phase | título | bloqueado |
|---|---|---|---|---|---|---|
| 2 | [S3TX](../bugs/BUG-20260731-S3TX-studio-full-apaga-slides/bug.md) | P0 | critical | **active** · delivering | studio-full apaga os slides gerados | não |
| 1 | [JZNJ](../bugs/BUG-20260731-JZNJ-builder-roteiro-descarta-palco/bug.md) | P1 | critical | **active** · delivering | builder descarta o palco do slide | não |
| 3 | [OI56](../bugs/BUG-20260731-OI56-esqueleto-sem-marcadores-mira/bug.md) | P1 | high | **active** · delivering | esqueleto sem marcadores @MIRA | não |
| 13 | [F74X](../bugs/BUG-20260801-F74X-reorder-nao-leva-roteiro/bug.md) | P1 | high | **active** · delivering | reordenar no 9:16 não move o bloco do roteiro.md | não |
| 14 | [ADQX](../bugs/BUG-20260801-ADQX-banners-orfaos-corrompem-deck-gerado/bug.md) | P1 | high | **active** · delivering | banners órfãos corrompem o deck gerado | não |
| 8 | [RNYU](../bugs/BUG-20260731-RNYU-falas-de-demonstracao-vazam/bug.md) | P2 | medium | **active** · delivering | falas de demonstração vazam | não |

## Corrigidos nesta sessão de 2026-08-01

- [F74X](../bugs/BUG-20260801-F74X-reorder-nao-leva-roteiro/bug.md) — veredito `spec-gap`,
  risco `média`. O contrato `window.miraOrderSource` existia só no `mira-studio-full`. A
  reprodução mostrou que a implementação de referência do 16:9 **também** está errada para
  deck gerado: ela delega a ordem ao `roteiro.md` sem mover a `<section>`. Corrigido com
  `mode: 'accompany'` no 9:16, que move os dois arquivos na mesma permutação.
- [ADQX](../bugs/BUG-20260801-ADQX-banners-orfaos-corrompem-deck-gerado/bug.md) — veredito
  `spec-gap`, risco `baixa`. Descoberto na reprodução do F74X, que ele bloqueava. Os
  comentários-banner do template sobrevivem órfãos no deck gerado e o `reorderSource`
  fatiava o arquivo por eles.

**O `mira-studio-full` (16:9) tem o mesmo defeito do F74X, medido e não corrigido.** Ele
segue em `mode: 'replace'`: em deck gerado, o texto anda e o palco fica, e com layouts
diferentes os palcos `<slug>-stage` são destruídos. Falta bug próprio.

## Corrigidos, aguardando entrega

6 bug(s) em `delivering`: código corrigido, testes verdes, veredito de spec
registrado, **falta merge e versão publicada**. A closure policy `package` não permite fechar
antes disso, e nenhum deles recebe `DONE.md` até lá.

- [JZNJ](../bugs/BUG-20260731-JZNJ-builder-roteiro-descarta-palco/bug.md) — veredito `spec-gap`, risco `média`
- [S3TX](../bugs/BUG-20260731-S3TX-studio-full-apaga-slides/bug.md) — veredito `spec-gap`, risco `média`
- [OI56](../bugs/BUG-20260731-OI56-esqueleto-sem-marcadores-mira/bug.md) — veredito `spec-correta`, risco `baixa`
- [RNYU](../bugs/BUG-20260731-RNYU-falas-de-demonstracao-vazam/bug.md) — veredito `spec-gap`, risco `baixa`
- [F74X](../bugs/BUG-20260801-F74X-reorder-nao-leva-roteiro/bug.md) — veredito `spec-gap`, risco `média`
- [ADQX](../bugs/BUG-20260801-ADQX-banners-orfaos-corrompem-deck-gerado/bug.md) — veredito `spec-gap`, risco `baixa`

## Cobertura de teste

| ID | reprodução | regressão |
|---|---|---|
| JZNJ | 1 | 3 |
| S3TX | 2 | 3 |
| OI56 | 3 | 4 |
| RNYU | 3 | 2 |
| F74X | 2 | 4 |
| ADQX | 2 | 1 |

Suíte completa do projeto depois das duas correções: **157 testes, 157 passando, 0 falhas.**
