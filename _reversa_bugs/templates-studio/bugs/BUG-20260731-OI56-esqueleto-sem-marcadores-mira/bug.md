---
schema_version: 1
id: BUG-20260731-OI56
display_number: 3
title: Fase 1 parte do template cru em vez do caminho canônico e o esqueleto nasce reprovado nos quatro formatos
status: active
phase: delivering
severity: high
priority: P1
created: 2026-07-31
updated: 2026-08-01

origin:
  type: manual-report
  external_ref: null

area: unclassified
module: unclassified
feature: unclassified
labels:
  - escopo-revisado

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: "3/3 caminhos testados reprovam; o quarto (CLI canônico + mira-default) passa"
  suspected_triggers: []

blocking: []

relationships:
  - bug: BUG-20260731-K4NR
    type: related-to
    state: proposed
    evidence: []
  - bug: BUG-20260801-VPUH
    type: caused-by
    state: supported
    evidence:
      - ref: "evidence/caminhos-comparados.md"
        observation: >-
          mesmo pelo caminho canônico, o esqueleto Studio continua reprovando por falta do
          bloco @MIRA:THEME, porque o template não traz o marcador que o CLI substitui.
          Essa metade do defeito é o BUG-20260801-VPUH.

traceability:
  specs:
    - "_reversa_sdd/mira-fast/sdd/01-invocacao-e-formatos.md#r7-montagem-do-esqueleto-do-deck"
    - "_reversa_sdd/mira-fast/sdd/05-fase-3-montagem.md#r5-titulo-da-capa-rf12-diretiva-do-claudemd"
    - "_reversa_sdd/addenda/bug-BUG-20260731-K4NR-v001.md#r1b-validacao-do-esqueleto"
  affected_code:
    - "agents/mira-fast/SKILL.md:48"
    - "agents/mira-fast/SKILL.md:132"
    - "agents/mira-fast/SKILL.md:135-143"
    - "lib/commands/new.js:118"
    - "lib/utils/responsive.js:33-55"
    - "agents/mira-fast/scripts/assemble-run.mjs:197-210"
  root_cause:
    state: confirmed
    hypothesis: >-
      A instrução da Fase 1 manda copiar o arquivo do template e abrir os slots à mão. A spec
      01#R7 manda preferir o caminho canônico do CLI, deixando a cópia manual como fallback.
      A skill implementou o fallback como padrão. Copiar o arquivo pula ensureResponsive(),
      que é quem injeta o bloco @MIRA:RESPONSIVE, e o esqueleto chega à Fase 3 reprovado.
    causal_path:
      - "agents/mira-fast/SKILL.md:132 manda a Fase 1 partir do arquivo do template"
      - "a cópia do arquivo não passa por lib/commands/new.js nem por ensureResponsive()"
      - "o bloco @MIRA:RESPONSIVE nunca é injetado: nenhum dos 8 templates o traz"
      - "validateSkeleton exige o bloco (assemble-run.mjs:205) e aborta a montagem"
      - "nos formatos Studio soma-se a falta do @MIRA:THEME, que é o BUG-20260801-VPUH"
    evidence:
      - ref: "evidence/caminhos-comparados.md"
        observation: >-
          quatro caminhos medidos: template Studio cru reprova por THEME e RESPONSIVE;
          Studio pelo CLI reprova só por THEME; mira-default cru reprova por RESPONSIVE;
          mira-default pelo CLI passa em tudo.
      - ref: "evidence/codigo-observado.md"
        observation: "nenhum dos 8 templates tem @MIRA:RESPONSIVE, e nunca precisou ter"
    code_refs:
      - file: "agents/mira-fast/SKILL.md"
        symbol: "Fase 1, item 6"
        commit: "558a406"
      - file: "lib/utils/responsive.js"
        symbol: "ensureResponsive"
        commit: "558a406"
  reproduction_tests:
    - "test/mira-fast-esqueleto-real.test.mjs::esqueleto real de mira-studio passa em validateSkeleton"
    - "test/mira-fast-esqueleto-real.test.mjs::esqueleto real de mira-studio-full passa em validateSkeleton"
    - "evidence/comparar-caminhos.mjs"
  regression_tests:
    - "test/mira-fast-esqueleto-real.test.mjs::esqueleto real de mira continua passando em validateSkeleton"
    - "test/mira-fast-esqueleto-real.test.mjs::esqueleto real de mira-vertical continua passando em validateSkeleton"
    - "test/mira-fast-esqueleto-real.test.mjs::o bloco @MIRA:RESPONSIVE é do CLI, não do template"
    - "test/mira-fast-esqueleto-real.test.mjs::mira-default continua temável, com o marcador e fora do conjunto agnóstico"

spec_verdict: spec-correta

change_risk:
  classification: baixa
  reasons:
    - "nenhuma linha de CSS efetivo mudou: os templates ganharam só comentários delimitadores"
    - "sem contrato externo, sem dados, sem concorrência"
    - "reversível pelo diff"
    - "não verificado em navegador: não há um neste ambiente. Nenhuma afirmação depende de renderização"

change_set:
  - id: CHG-001
    kind: test
    artifact: test/mira-fast-esqueleto-real.test.mjs
    purpose: esqueleto derivado de template real, nos quatro formatos, contra validateSkeleton
    diff: fix/CHG-001.diff
  - id: CHG-002
    kind: code
    artifact: agents/mira-fast/scripts/assemble-run.mjs
    purpose: exporta validateSkeleton para o teste poder chamá-la direto
    diff: fix/CHG-002.diff
  - id: CHG-005
    kind: documentation
    artifact: agents/mira-fast/SKILL.md
    purpose: Fase 1 passa a usar o caminho canônico nos quatro formatos
    diff: fix/CHG-005.diff

delivery:
  branch: agent/documentacao-completa-mira
  base_commit: 558a406
  committed: false
  pr: null
  merged: false
  published_version: null

closure:
  policy: package
  satisfied: false
resolution_kind: fixed
---

# Fase 1 parte do template cru em vez do caminho canônico e o esqueleto nasce reprovado nos quatro formatos

> **Escopo revisado em 2026-08-01.** Este bug foi registrado como "o template
> `mira-studio-demo` não tem nenhum marcador `@MIRA:` e a montagem falha". A investigação
> desmentiu dois dos três sintomas e mostrou que o defeito não é de template nem é exclusivo
> dos formatos Studio. O ID e a pasta não mudam; o enunciado, sim. O texto original está
> preservado no histórico do git e o relato bruto em `../../intake/`.

## Summary

A Fase 1 monta o esqueleto copiando o arquivo do template e abrindo os slots à mão. Esse
caminho pula o `ensureResponsive()` do CLI, que é quem injeta o bloco `@MIRA:RESPONSIVE`.
Como **nenhum** dos oito templates traz esse bloco, o esqueleto chega à Fase 3 sem ele e a
montagem aborta.

Vale para os quatro formatos, não só para os Studio. O formato `mira`, que segue a instrução
mais explícita da skill, também reprova.

Nos formatos Studio soma-se um segundo bloco ausente, o `@MIRA:THEME`, que é defeito
separado, registrado como BUG-20260801-VPUH.

## Expected Behavior

`_reversa_sdd/mira-fast/sdd/01-invocacao-e-formatos.md#r7-montagem-do-esqueleto-do-deck` é
explícita sobre a ordem de preferência:

> Preferir o caminho canônico do projeto:
> `npx mira-animator new <slug> --deck=<template> --theme=<tema>`
> [...] **Fallback sem `npx`**: cópia manual do esqueleto de `templates/decks/<template>/`
> mais `node templates/vendor/apply-offline.mjs` e instalação dos módulos de autoria.

O caminho canônico injeta o tema (`new.js:110`) e a camada responsiva (`new.js:118` chamando
`ensureResponsive`). O esqueleto produzido por ele satisfaz E2 e E3 do adendo
`bug-BUG-20260731-K4NR-v001.md`.

A cópia manual é fallback, para quando não há `npx`. Não é o caminho padrão.

## Actual Behavior

`agents/mira-fast/SKILL.md` nunca menciona `npx mira-animator new`. Ela manda copiar:

- linha 48: "No formato `mira`, use sempre `mira-templates/decks/mira-default/index.html`
  como fonte canônica; não pergunte por template."
- linha 132: "Para `mira`, parte obrigatoriamente de
  `mira-templates/decks/mira-default/index.html`, preserva o marcador `MIRA-DEFAULT`, o
  runtime e o CSS `.slide-main`/`.slide-centro`, remove os slides de exemplo e abre os seis
  slots."
- linhas 135-143: lista os seis marcadores de slot que o esqueleto precisa conter.

Ou seja: a skill implementou o **fallback** da spec como se fosse o padrão, e nunca cita o
comando canônico.

Consequência medida em quatro caminhos, com os slides de exemplo removidos e os seis slots
abertos em todos eles:

| caminho | `@MIRA:THEME` | `@MIRA:RESPONSIVE` | resultado |
|---|---|---|---|
| `mira-studio-demo` cru, o que a Fase 1 faz hoje | ausente | ausente | **reprova** |
| `mira-studio-demo` via `npx mira-animator new` | ausente | presente | **reprova**, só pelo BUG-20260801-VPUH |
| `mira-default` cru, o que a `SKILL.md:132` manda | presente | ausente | **reprova** |
| `mira-default` via `npx mira-animator new` | presente | presente | **passa** |

O balanceamento do título da capa (E4) passa em todos: o template já o traz. Os seis slots
são abertos mecanicamente pela própria Fase 1, sem problema.

## Steps to Reproduce

1. Copiar `templates/decks/mira-default/index.html`, remover as `<section>` de exemplo e
   abrir os seis marcadores de slot, exatamente como `agents/mira-fast/SKILL.md:132` manda.
2. Usar esse arquivo como `mira/fast/esqueleto.html` de um deck com plano e fragmentos
   válidos.
3. `node agents/mira-fast/scripts/assemble-run.mjs "<deck>"` aborta com
   `esqueleto sem bloco @MIRA:RESPONSIVE`.
4. Repetir com o deck criado por `npx mira-animator new <slug> --deck=mira-default`: passa.
5. Repetir os passos 1 a 3 com `mira-studio-demo`: aborta com
   `esqueleto sem bloco @MIRA:THEME | esqueleto sem bloco @MIRA:RESPONSIVE`.

## Evidence

- `evidence/caminhos-comparados.md` — os quatro caminhos medidos, com o script.
- `evidence/codigo-observado.md` — levantamento dos marcadores nos oito templates e o corpo
  de `validateSkeleton`.
- `../../inspections/2026-07-31-decks-studio/report.md` — a varredura que confirmou o sintoma.

## Suspected Area

`agents/mira-fast/SKILL.md`, Fase 1, itens 6 e a lista de slots. É instrução, não código: a
correção é fazer a skill mandar usar o caminho canônico, com a cópia manual explicitamente
marcada como fallback, como a spec já diz.

O que **não** é área suspeita, e foi descartado pela investigação:

- **Os templates não precisam do bloco `@MIRA:RESPONSIVE`.** `ensureResponsive()`
  (`lib/utils/responsive.js:33-55`) o **insere** quando falta, e nenhum dos oito templates o
  traz. Nunca foi contrato de template.
- **Os slots `@MIRA:FAST:*` não são do template.** `agents/mira-fast/SKILL.md:132` atribui à
  Fase 1 abri-los, e ela consegue: no experimento, foram abertos mecanicamente nos quatro
  caminhos.
- **O balanceamento do título da capa já existe** no template (linhas 55-56 do
  `mira-studio-demo`). O handoff original não o listava e eu não havia verificado.

## Acceptance Criteria

1. `agents/mira-fast/SKILL.md` manda a Fase 1 usar `npx mira-animator new` como caminho
   primário do esqueleto, nos quatro formatos, com a cópia manual declarada como fallback,
   espelhando `01#R7`.
2. Deck gerado do zero pelo `/mira-fast` no formato `mira` passa em `validateSkeleton`.
3. Deck gerado do zero nos formatos Studio passa também, o que depende do BUG-20260801-VPUH
   estar corrigido.
4. Existe teste que alimenta `validateSkeleton` com um esqueleto derivado de **template
   real**, não sintético, para os quatro formatos. Sem isso o defeito volta sem ninguém ver:
   foi exatamente essa lacuna (F-test-01 do pente-fino) que deixou os quatro formatos
   quebrados sem nenhum teste vermelho.
5. A decisão sobre quem cria cada bloco fica registrada, complementando E2 e E3 do adendo
   `bug-BUG-20260731-K4NR-v001.md`.

## Traceability

| Eixo | Referência |
|---|---|
| Spec | `01-invocacao-e-formatos.md#r7-montagem-do-esqueleto-do-deck` |
| Adendo vigente | `bug-BUG-20260731-K4NR-v001.md`, E2 e E3 |
| Instrução divergente | `agents/mira-fast/SKILL.md` (48, 132, 135-143) |
| Quem injeta o que | `lib/commands/new.js:110` (tema), `:118` + `lib/utils/responsive.js:33-55` (responsivo) |
| Validador | `agents/mira-fast/scripts/assemble-run.mjs` (197-210) |
| Metade Studio do defeito | BUG-20260801-VPUH |
| Testes | nenhum |

## Resolution

Corrigido em 2026-08-01, junto com o BUG-20260801-VPUH. **Não fechado**: closure policy
`package` exige merge e versão publicada. Estado `active` / `delivering`.

### O que mudou

`agents/mira-fast/SKILL.md` passou a mandar a Fase 1 obter o esqueleto pelo caminho canônico
`npx mira-animator new`, nos quatro formatos, com a cópia manual declarada como fallback de
`01#R7`. É a mudança que faz o `ensureResponsive` rodar e o bloco `@MIRA:RESPONSIVE` existir.

Junto veio o CHG-001, que é o que impede a volta: nenhum teste do repositório alimentava o
pipeline com template real.

### Veredito de spec: `spec-correta` (aprovado em 2026-08-01)

`01#R7` já mandava preferir o caminho canônico e já declarava a cópia manual como fallback.
Foi a skill que divergiu da spec. **Nenhum adendo gerado por este bug.**

O adendo do VPUH (`bug-BUG-20260801-VPUH-v001.md`) toca o mesmo R7, mas por outro motivo:
lá havia gap de verdade.

### Prova

Os quatro caminhos, medidos por `evidence/comparar-caminhos.mjs`, que agora é autocontido:

```
antes                                    depois
Studio CRU        REPROVA THEME+RESP  →  REPROVA: só @MIRA:RESPONSIVE
Studio via CLI    REPROVA THEME       →  PASSA
mira-default CRU  REPROVA RESP        →  REPROVA: só @MIRA:RESPONSIVE
mira-default CLI  PASSA               →  PASSA
```

A cópia manual continuar reprovando é o desenho, não sobra: é a razão de a instrução ter
mudado. Quem copiar o arquivo à mão tem que injetar os dois blocos, e agora a skill diz isso.

Testes: 4 vermelhos → 8 verdes no arquivo do bug. Suíte completa **119 tests, 119 pass,
0 fail**.

### Uma correção de rumo, minha

No `plan.html` classifiquei `mira` e `mira-vertical` como reprodução. Errado: como o teste
aplica o `ensureResponsive`, eles já passavam. São regressão. A metade do defeito que atinge
o formato `mira` é de **instrução**, e nenhum teste unitário a pega; quem a prova é o teste
do `ensureResponsive` mais o CHG-005.

Houve também um bug no meu próprio helper de teste, corrigido dentro do Gate 1: a regex de
`<section>` casava com o exemplo documental do cabeçalho do `mira-default`, antes do `<body>`,
e punha o slot de slides dentro do `<head>`. Terceira aparição da mesma armadilha do K4NR.

### Nota sobre os diffs

`fix/CHG-002.diff` sai maior do que este bug: como nada foi commitado, o `git diff` de
`assemble-run.mjs` traz junto as mudanças do BUG-20260731-K4NR e do BUG-20260731-BNO4, de
2026-07-31. O que pertence a este bug é uma linha: `function validateSkeleton` virou
`export function validateSkeleton`.

### O que falta para fechar

Commit, merge e versão publicada. Sem `DONE.md` até lá.

## Agent Notes

- **O escopo mudou em 2026-08-01.** Registrado como defeito de template dos formatos Studio;
  é defeito de instrução da Fase 1 e atinge os quatro formatos. Dois dos três sintomas
  originais foram desmentidos com medição, não com argumento. A decisão de reescrever em vez
  de fechar como `invalid` foi do usuário.
- **A pasta não muda, o dono sim.** Pelo protocolo do registro, a pasta do bug é endereço
  definitivo e nunca se move. Ele continua em `templates-studio`, mas o arquivo dono hoje é
  `agents/mira-fast/SKILL.md`, do contexto `mira-fast`. Quem for procurar por arquivo, procure
  lá.
- **A relação com o VPUH é `caused-by`, não `related-to`.** A metade Studio deste bug só some
  quando o `@MIRA:THEME` entrar nos templates. Corrigir a skill sozinha faz o formato `mira`
  voltar a funcionar e deixa os Studio ainda reprovando.
- **O critério de aceite 4 é o que impede a regressão.** A causa de isto ter passado
  despercebido não é o código: é `test/mira-fast-assemble.test.mjs:100-128`, que constrói o
  esqueleto à mão já com todos os blocos. Enquanto o teste não tocar em template real, os
  quatro formatos podem quebrar de novo sem nenhum vermelho.
- **Proposta de taxonomia:** `area: geracao-de-decks`, `module: mira-fast`,
  `feature: contrato-de-esqueleto`.
