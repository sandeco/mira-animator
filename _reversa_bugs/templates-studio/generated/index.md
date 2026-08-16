<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-08-16T21:05:00Z a partir de 9 bugs -->

# Índice de bugs · templates-studio

Contexto: templates de deck dos formatos Studio (builder do `roteiro.md`, teleprompter,
esqueleto e **gravador nativo**). Closure policy: `package`.

## Resumo por status

| status | bugs |
|---|---|
| open | 1 |
| active | 8 |
| resolved | 0 |

## Resumo por phase

| phase | bugs |
|---|---|
| triaging | 1 |
| delivering | 8 |

## Bugs abertos e ativos

| # | ID | prio | sev | status/phase | título | bloqueado |
|---|---|---|---|---|---|---|
| 2 | [S3TX](../bugs/BUG-20260731-S3TX-studio-full-apaga-slides/bug.md) | P0 | critical | **active** · delivering | studio-full apaga os slides gerados | não |
| 1 | [JZNJ](../bugs/BUG-20260731-JZNJ-builder-roteiro-descarta-palco/bug.md) | P1 | critical | **active** · delivering | builder descarta o palco do slide | não |
| 3 | [OI56](../bugs/BUG-20260731-OI56-esqueleto-sem-marcadores-mira/bug.md) | P1 | high | **active** · delivering | esqueleto sem marcadores @MIRA | não |
| 13 | [F74X](../bugs/BUG-20260801-F74X-reorder-nao-leva-roteiro/bug.md) | P1 | high | **active** · delivering | reordenar no 9:16 não move o bloco do roteiro.md | não |
| 14 | [ADQX](../bugs/BUG-20260801-ADQX-banners-orfaos-corrompem-deck-gerado/bug.md) | P1 | high | **active** · delivering | banners órfãos corrompem o deck gerado | não |
| **16** | [**TW4D**](../bugs/BUG-20260815-TW4D-audio-mono-no-gravador-nativo/bug.md) | P1 | high | **active** · delivering | **áudio gravado em mono nos dois gravadores** | não |
| **17** | [**HYRG**](../bugs/BUG-20260815-HYRG-av-dessincronizado-por-deslocamento-constante/bug.md) | P1 | high | **active** · delivering | **A/V desalinhado: cada trilha zerada por conta própria** | não |
| 8 | [RNYU](../bugs/BUG-20260731-RNYU-falas-de-demonstracao-vazam/bug.md) | P2 | medium | **active** · delivering | falas de demonstração vazam | não |
| **18** | [**FJAU**](../bugs/BUG-20260816-FJAU-captura-entrega-metade-dos-quadros/bug.md) | P2 | medium | **open** · triaging | **captura entrega metade dos quadros (15-18 fps reais)** | não |

## Sessão de 2026-08-15/16: os três bugs do gravador

Os primeiros bugs deste contexto que atingem o **artefato final**, o MP4 publicado, e não o
deck. Dois corrigidos, um registrado e não atacado.

- [TW4D](../bugs/BUG-20260815-TW4D-audio-mono-no-gravador-nativo/bug.md) · **corrigido** —
  áudio saía mono. Medido: `channelCount: 1` com os três filtros de voz do Chrome ligados. A
  captação passa a pedir 2 canais como `ideal` e, quando a track insiste em 1, o canal é
  duplicado num grafo Web Audio, **declarado** como `stereo (dup)`. Veredito `spec-gap`.
  Os filtros de voz **não** foram desligados: isso muda o som do autor e ele não autorizou.
- [HYRG](../bugs/BUG-20260815-HYRG-av-dessincronizado-por-deslocamento-constante/bug.md) ·
  **corrigido** — áudio e vídeo desalinhados. Medido em duas gravações: -1,1 ms e **-30,4
  ms**, ou seja o desvio VARIA. Corrigido levando as duas trilhas a uma origem comum antes do
  muxer. Veredito `spec-desatualizada`.
- [FJAU](../bugs/BUG-20260816-FJAU-captura-entrega-metade-dos-quadros/bug.md) ·
  **registrado, não atacado** — a captura entrega 15-18 fps reais e o CFR completa o resto com
  duplicatas. Causa raiz em branco de propósito: não há medição que a isole, e a hipótese mais
  provável (a página não repinta, então não há quadro novo) transformaria a correção num aviso.

### Duas armadilhas que a medição desarmou

**A correção "óbvia" do HYRG teria quebrado o arquivo.** Trocar a constante do muxer para
`'cross-track-offset'` parecia certo depois que as medições mostraram os dois relógios na
mesma base. Mas o vídeo já chega ao muxer rebaseado em zero pela grade CFR, então
`Math.min(0, ~290 s) = 0` e o áudio iria parar a minutos de distância: exatamente o commit
`6e84363`. Nenhuma das duas constantes resolve sozinha.

**Uma medição não refuta um mecanismo variável.** Depois da primeira gravação (-1,1 ms) a
causa do HYRG foi dada por refutada. A segunda (-30,4 ms) mostrou que a desistência veio de
uma amostra só. Está registrado assim no bug.

## Corrigidos na sessão de 2026-08-01

- [F74X](../bugs/BUG-20260801-F74X-reorder-nao-leva-roteiro/bug.md) — veredito `spec-gap`,
  risco `média`. O contrato `window.miraOrderSource` existia só no `mira-studio-full`.
- [ADQX](../bugs/BUG-20260801-ADQX-banners-orfaos-corrompem-deck-gerado/bug.md) — veredito
  `spec-gap`, risco `baixa`. Descoberto na reprodução do F74X, que ele bloqueava.

**O `mira-studio-full` (16:9) tem o mesmo defeito do F74X, medido e não corrigido.** Falta
bug próprio.

## Corrigidos, aguardando entrega

8 bug(s) em `delivering`: código corrigido, testes verdes, veredito de spec registrado,
**falta merge e versão publicada**. A closure policy `package` não permite fechar antes
disso, e nenhum recebeu `DONE.md`.

## Cobertura de teste

| ID | reprodução | regressão |
|---|---|---|
| JZNJ | 1 | 3 |
| S3TX | 2 | 3 |
| OI56 | 3 | 4 |
| RNYU | 3 | 2 |
| F74X | 2 | 4 |
| ADQX | 2 | 1 |
| **TW4D** | 5 | 5 |
| **HYRG** | 4 | 4 |
| **FJAU** | 0 | 0 |

Suíte completa em 2026-08-16: **257 testes, 257 passando, 0 falhas, 0 `todo`.**

Suítes novas nesta sessão: `test/mira-record-sync.test.mjs` (alinhamento A/V, roda o Worker
de verdade) e `test/mira-record-audio.test.mjs` (trilha de áudio, asserção sobre o
código-fonte). `test/mira-record-cfr.test.mjs` segue 18/18, com uma asserção **atualizada**:
ela afirmava que `firstTimestampBehavior: 'offset'` resolvia o offset inicial, o que a
medição derrubou.

O FJAU não tem teste porque não foi atacado.
