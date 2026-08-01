---
schema_version: 1
id: BUG-20260731-RNYU
display_number: 8
title: Falas de demonstração do template vazam para todo deck gerado e viram o teleprompter em file://
status: active
phase: delivering
severity: medium
priority: P2
created: 2026-07-31
updated: 2026-08-01

origin:
  type: inspection
  external_ref: null

area: unclassified
module: unclassified
feature: unclassified
labels: []

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: "1/1 nesta varredura"
  suspected_triggers:
    - "deck aberto por file:// (sem servidor)"
    - "localStorage vazio para a origem"

blocking: []

relationships:
  - bug: BUG-20260731-JZNJ
    type: related-to
    state: supported
    evidence:
      - ref: "fix/plan.html"
        observation: "mesma origem: a Fase 1 herda o runtime inteiro do template e a Fase 3 não o adaptava ao deck gerado. Lá era o palco, aqui é a fala."
  - bug: BUG-20260731-S3TX
    type: related-to
    state: supported
    evidence:
      - ref: "_reversa_sdd/addenda/bug-BUG-20260731-RNYU-v001.md"
        observation: "R7e e R3e são a mesma regra: nenhum artefato publicado carrega conteúdo de demonstração do template"

traceability:
  specs:
    - "_reversa_sdd/mira-fast/sdd/03-fase-1-plano.md#r9-especificidade-por-formato"
    - "_reversa_sdd/mira-fast/sdd/05-fase-3-montagem.md#r7-roteiromd-do-mira-studio-full-rf17"
    - "_reversa_sdd/MIRA-STUDIO-COM-TELEPROMPTER/SPEC.md#4-texto-por-slide--navegação"
  affected_code:
    - "templates/decks/mira-studio-demo/index.html:338-343"
    - "templates/decks/mira-studio-demo/index.html:849"
    - "templates/decks/mira-studio-demo/index.html:884"
    - "agents/mira-fast/scripts/assemble-run.mjs:350-351"
    - "templates/decks/mira-studio-full-demo/index-16x9.html:943-950"
  root_cause:
    state: confirmed
    hypothesis: >-
      O array de fala do teleprompter vive dentro do runtime que a Fase 1 herda inteiro, e a
      Fase 3 nunca o tocava. O único conteúdo de fala que a montagem emitia era o roteiro.md,
      que é HTTP-only por construção, então o caminho offline ficava sem nenhuma fala do plano.
    causal_path:
      - "o template declara as falas do próprio deck de demonstração no runtime (window.__miraScript / var SCRIPT)"
      - "a Fase 1 monta o esqueleto a partir do template e preserva o runtime"
      - "a Fase 3 grava roteiro.md e nunca reescreve o array"
      - "em file:// o builder do roteiro sai cedo e window.__miraRoteiro fica nulo"
      - "a precedência roteiro.md > localStorage > SCRIPT cai na terceira fonte"
      - "o apresentador lê as falas do deck de demonstração do Mira; do 5º slide em diante, nada"
    evidence:
      - ref: "evidence/execucao.md"
        observation: "as quatro falas do template continuavam no deck gerado com falas próprias"
      - ref: "fix/CHG-003.diff"
        observation: "o teleprompter em file://, com localStorage limpo, passa a mostrar a fala do plano"
    code_refs:
      - file: "templates/decks/mira-studio-demo/index.html"
        symbol: "window.__miraScript"
        commit: "456b38b"
      - file: "agents/mira-fast/scripts/assemble-run.mjs"
        symbol: "assembleRun"
        commit: "456b38b"
  reproduction_tests:
    - "test/mira-studio-contrato.test.mjs::BUG-20260731-RNYU · mira-studio: falas do plano substituem as do template"
    - "test/mira-studio-contrato.test.mjs::BUG-20260731-RNYU · mira-studio-full: falas do plano substituem as do template"
    - "test/mira-studio-builders.test.mjs::BUG-20260731-RNYU · o teleprompter em file:// mostra a fala do plano"
  regression_tests:
    - "test/mira-studio-contrato.test.mjs::BUG-20260731-RNYU · o fallback cobre todos os slides, não só os quatro primeiros"
    - "test/mira-studio-builders.test.mjs::BUG-20260731-RNYU · o teleprompter em file:// mostra a fala do plano"

spec_verdict: spec-gap

change_set:
  - id: CHG-001
    kind: code
    artifact: "agents/mira-fast/scripts/assemble-run.mjs"
  - id: CHG-002
    kind: test
    artifact: "test/mira-studio-contrato.test.mjs"
  - id: CHG-003
    kind: test
    artifact: "test/mira-studio-builders.test.mjs"
  - id: CHG-004
    kind: specification
    artifact: "_reversa_sdd/addenda/bug-BUG-20260731-RNYU-v001.md"

change_risk: baixa
addenda:
  - "_reversa_sdd/addenda/bug-BUG-20260731-RNYU-v001.md"

delivery:
  branch: agent/documentacao-completa-mira
  base_commit: 456b38b
  committed: false
  pr: null
  merged: false
  published_version: null

closure:
  policy: package
  satisfied: false
resolution_kind: fixed
---

# Falas de demonstração do template vazam para todo deck gerado e viram o teleprompter em file://

## Summary

O array `window.__miraScript` do template carrega as quatro falas do deck de demonstração do
Mira. A Fase 3 não o toca. Todo deck `mira-studio` gerado nasce com esse texto embutido.

Como `__miraScript` é justamente o fallback do teleprompter quando não há `roteiro.md`, e
`roteiro.md` só é lido sob HTTP, um deck aberto por `file://` exibe no teleprompter as falas
de demonstração do Mira em vez do roteiro do usuário. As falas reais existem no plano e no
`roteiro.md`, mas nenhuma delas chega ao caminho offline.

## Expected Behavior

`validate-run.mjs:97-99` torna `fala` obrigatória em todo slide dos formatos Studio, e
`_reversa_sdd/mira-fast/sdd/03-fase-1-plano.md#r9-especificidade-por-formato` confirma que o
plano do Studio carrega o texto da fala.

`_reversa_sdd/MIRA-STUDIO-COM-TELEPROMPTER/SPEC.md`, seção 4, define o texto por slide como
conteúdo do deck.

O deck gerado deve mostrar as falas do plano, não as do template de demonstração. E um deck
entregue nunca deveria conter texto de exemplo de outro deck.

## Actual Behavior

`templates/decks/mira-studio-demo/index.html:338-343` declara:

```js
window.__miraScript = [
    'Um roteiro, três formatos. Este é o deck vertical do Mira Studio.',
    'Aqui a câmera preenche a coluna inteira: só você falando.',
    'No meio a meio, a metáfora animada fica no quadrado de cima e você embaixo.',
    'E na tela cheia, a animação toma conta: do roteiro ao vídeo pronto.'
];
```

A Fase 1 herda o runtime inteiro e a Fase 3 não reescreve nada disso: `grep` por
`__miraScript` em `agents/mira-fast/` e `agents/mira-ultrafast/` não devolve nada. No deck
que montei nesta varredura, com quatro falas próprias, essas quatro linhas do template
continuavam lá (linhas 350-355 da saída).

O teleprompter usa `var SCRIPT = window.__miraScript || []` (linha 849) e
`curText(i)` devolve `txt[i]` ou `SCRIPT[i]` (linha 884). A precedência documentada na linha
870 é `roteiro.md > localStorage > SCRIPT`. Em `file://` o builder do roteiro sai na linha
364 (`if (!isHttp) return`), `window.__miraRoteiro` fica nulo, e sobra o `SCRIPT`.

Dois efeitos:

- Deck com 4 ou menos slides: o apresentador lê as falas do deck de demonstração do Mira.
- Deck com mais de 4 slides: do quinto em diante o teleprompter fica vazio.

## Steps to Reproduce

1. Montar um deck `mira-studio` pelo `/mira-fast` com falas próprias no plano.
2. `grep -n "__miraScript = " -A6 <deck>/index.html`: as quatro falas do template estão lá.
3. Abrir o `index.html` por `file://`, com o `localStorage` limpo para a origem.
4. O teleprompter mostra "Um roteiro, três formatos. Este é o deck vertical do Mira Studio."
   em vez da fala do slide 1.

## Evidence

- `evidence/execucao.md` — trecho do deck gerado e a cadeia de precedência do teleprompter.

## Suspected Area

Duas pontas, e o fix precisa escolher qual tratar:

1. **O template** (`index.html:338-343`) embute dado de demonstração dentro do runtime que
   todo deck derivado herda. Conteúdo de exemplo deveria viver nas `<section>` de exemplo,
   que a Fase 1 remove, não numa variável do runtime, que ela preserva.
2. **A Fase 3** não emite as falas do plano em lugar nenhum que o `file://` alcance. Só grava
   `roteiro.md` (`assemble-run.mjs:350-351`), que é HTTP-only por construção.

A correção mais provável junta as duas: a montagem reescreve `__miraScript` com as falas do
plano, ou o template para de trazer texto e a montagem preenche.

## Acceptance Criteria

1. Deck `mira-studio` gerado não contém nenhuma das falas do deck de demonstração.
2. Aberto por `file://`, com `localStorage` limpo, o teleprompter mostra a fala do plano para
   cada slide, inclusive do quinto em diante.
3. Sob HTTP, o `roteiro.md` continua tendo precedência sobre o fallback.
4. Teste de regressão verifica 1 e a presença das falas do plano na saída.

## Traceability

| Eixo | Referência |
|---|---|
| Spec | `03-fase-1-plano.md#r9-especificidade-por-formato`, `05-fase-3-montagem.md#r7-roteiromd-do-mira-studio-full-rf17`, `MIRA-STUDIO-COM-TELEPROMPTER/SPEC.md` seção 4 |
| Código afetado | `templates/decks/mira-studio-demo/index.html` (338-343, 849, 884) |
| Lado da montagem | `agents/mira-fast/scripts/assemble-run.mjs` (350-351) |
| Testes | nenhum |

## Resolution

Corrigido em 2026-08-01. **Não fechado**: closure policy `package`, exige merge e versão
publicada. Estado atual `active` / `delivering`.

### A escolha entre as duas pontas

O registro apontava as duas e dizia que o fix precisava escolher. **Escolhida: a montagem
reescreve o array.**

| opção | por que não / por que sim |
|---|---|
| o template para de trazer texto e a montagem preenche | quebra o deck de demonstração, que precisa funcionar sozinho em `file://`. O template é um deck de verdade, não um molde vazio. |
| **a montagem reescreve o array com as falas do plano** | o deck de demonstração continua inteiro, o deck gerado ganha as falas certas, e o problema do quinto slide em diante se resolve junto, porque o array passa a ter uma entrada por slide do plano |

### Causa raiz (confirmed)

Mesma origem do BUG-20260731-JZNJ: a Fase 1 herda o runtime inteiro do template e a Fase 3 não
o adaptava ao deck gerado. Lá era o palco, aqui é a fala.

O `grep` que o registro citava se confirma: `__miraScript` não aparecia em `agents/mira-fast/`
nem em `agents/mira-ultrafast/`. Nenhum código do pipeline sabia que esse array existia.

### O que mudou

`applyScriptFallback(html, plan)` reescreve o literal com as falas do plano, uma entrada por
slide, na ordem do plano. Os dois formatos declaram o mesmo fallback com nomes diferentes, e os
dois estão cobertos:

| formato | símbolo | status no log |
|---|---|---|
| `mira-studio` | `window.__miraScript` | `falas: N do plano` |
| `mira-studio-full` | `var SCRIPT` | `falas: N do plano` |
| `mira`, `mira-vertical` | não existe | `falas: formato sem teleprompter` |

Array duplicado no esqueleto aborta a montagem com mensagem explícita; array ausente segue com
o motivo no log. Nada é silencioso (RNF06).

A precedência do teleprompter não mudou: sob HTTP o `roteiro.md` continua vencendo, que é o
critério de aceite 3.

### Veredito de spec: `spec-gap`

A `SPEC.md` do teleprompter define o texto por slide como conteúdo do deck, e `validate-run`
torna `fala` obrigatória. O **fallback offline** nunca foi coberto por spec nenhuma. Adendo
aditivo gerado:

`_reversa_sdd/addenda/bug-BUG-20260731-RNYU-v001.md` — R7d (o fallback offline é conteúdo do
deck) e R7e (deck entregue não carrega exemplo de outro deck), esta última irmã da R3e do
adendo do BUG-20260731-S3TX.

### Change set

| CHG | tipo | artefato | propósito |
|---|---|---|---|
| CHG-001 | `code` | `agents/mira-fast/scripts/assemble-run.mjs` | `applyScriptFallback()` e a linha no log ([diff](fix/CHG-001.diff)) |
| CHG-002 | `test` | `test/mira-studio-contrato.test.mjs` | nenhuma fala de demonstração sobrevive; seis slides cobertos ([diff](fix/CHG-002.diff)) |
| CHG-003 | `test` | `test/mira-studio-builders.test.mjs` | teleprompter em `file://` com `localStorage` limpo ([diff](fix/CHG-003.diff)) |
| CHG-004 | `specification` | `_reversa_sdd/addenda/bug-BUG-20260731-RNYU-v001.md` | adendo aditivo |

Plano da correção: [fix/plan.html](fix/plan.html).

### Prova vermelho → verde

```
antes  ✖ mira-studio: falas do plano substituem as do template
       ✖ mira-studio-full: falas do plano substituem as do template
       ✖ o fallback cobre todos os slides, não só os quatro primeiros
       ✖ o teleprompter em file:// mostra a fala do plano

depois ✔ os quatro
```

### Descoberta durante a correção

A suspeita de confiança média que o registro guardava nas Agent Notes **se confirmou na
prática**, e de um jeito incômodo: a primeira versão do teste em navegador falhou mostrando
`"Abertura direto na câmera..."`, que é fala do deck de demonstração do **16x9**, num teste do
**9:16**. O texto veio do `localStorage`, que em `file://` é compartilhado por toda a origem
(chave literal `mira-tp-text`), gravado por um teste anterior.

Isso prova o que a varredura só suspeitava: dois decks na mesma origem compartilham o texto do
teleprompter. O teste passou a limpar a chave antes de medir, que é exatamente o que o critério
de aceite 2 pede ("com `localStorage` limpo"). **Escopar a chave por deck continua sem bug
próprio** e é candidato a registro futuro.

## Agent Notes

- Achado do pente-fino de 2026-07-31. Relatório em
  `../../inspections/2026-07-31-decks-studio/report.md`.
- **A precedência em `file://` também depende do `localStorage`, que não tem escopo por
  deck.** As chaves são as literais `mira-tp-text` e `mira-tp-ov-pos`
  (`index.html:871` e `887`), iguais para todo deck da mesma origem. Dois decks servidos na
  mesma porta compartilham o texto do teleprompter. Não registrei como bug próprio porque
  não consegui observar em navegador nesta varredura; fica anotado no relatório da varredura
  como suspeita de confiança média.
- **Não afeta a gravação sob HTTP**, o fluxo recomendado. Por isso `medium` e não `high`.
- **Proposta de taxonomia:** `area: geracao-de-decks`, `module: templates-studio`,
  `feature: teleprompter`.
