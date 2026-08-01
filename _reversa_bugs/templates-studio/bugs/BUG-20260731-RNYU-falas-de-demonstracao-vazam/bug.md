---
schema_version: 1
id: BUG-20260731-RNYU
display_number: 8
title: Falas de demonstração do template vazam para todo deck gerado e viram o teleprompter em file://
status: open
phase: triaging
severity: medium
priority: P2
created: 2026-07-31
updated: 2026-07-31

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
    state: proposed
    evidence: []

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
  root_cause: null
  reproduction_tests: []
  regression_tests: []

spec_verdict: null

change_set: []

closure:
  policy: package
  satisfied: false
resolution_kind: null
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

Em aberto.

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
