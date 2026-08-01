---
schema_version: 1
id: BUG-20260731-AMOM
display_number: 11
title: Validador de fragmento dos formatos Studio aceita palco sem .anim-stage e svg sem id
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
  suspected_triggers: []

blocking: []

relationships:
  - bug: BUG-20260731-UDTY
    type: related-to
    state: supported
    evidence:
      - ref: "fix/plan.html"
        observation: "corrigidos juntos no mesmo bloco do validador, como as Agent Notes pediam: o contrato do full omitia o wrapper e o validador não cobrava nem o que o contrato já dizia"

traceability:
  specs:
    - "_reversa_sdd/mira-fast/sdd/05-fase-3-montagem.md#r1-validacao-estrutural-antes-de-concatenar-rf09"
    - "_reversa_sdd/mira-fast/sdd/04-fase-2-enxame.md#r6-contrato-de-saida-rigido"
  affected_code:
    - "agents/mira-fast/scripts/validate-run.mjs:182-198"
    - "agents/mira-fast/scripts/validate-run.mjs:162-175"
    - "test/mira-fast-assemble.test.mjs:170-172"
  root_cause:
    state: confirmed
    hypothesis: >-
      As checagens de palco cresceram junto com o formato mira e nunca foram estendidas aos
      Studio. O fixture de test/mira-fast-assemble.test.mjs consagrava o fragmento frouxo,
      então a lacuna nunca produziu vermelho e nada no repositório apontava para ela.
    causal_path:
      - "validateFragment cobra .anim-stage e id do svg apenas no ramo format === 'mira'"
      - "o ramo dos formatos Studio cobra só data-layout e a presença dos wrappers"
      - "fragmento animado Studio sem .anim-stage e sem id no svg passa com zero erros"
      - "o palco não recebe altura (a classe carrega flex e min-height no template)"
      - "animação que faça svg.node().closest('.anim-stage') recebe null e quebra"
      - "o fixture do repositório usa exatamente esse fragmento frouxo e o teste passa"
    evidence:
      - ref: "evidence/execucao.md"
        observation: "mesmo fragmento: mira-studio aprova com [], formato mira coleta cinco erros"
      - ref: "fix/CHG-002.diff"
        observation: "ao apertar o validador, os dois fixtures Studio ficaram vermelhos, confirmando que consagravam a lacuna"
    code_refs:
      - file: "agents/mira-fast/scripts/validate-run.mjs"
        symbol: "validateFragment"
        commit: "456b38b"
  reproduction_tests:
    - "test/mira-studio-contrato.test.mjs::BUG-20260731-AMOM · animado Studio sem .anim-stage é reprovado nos dois formatos"
    - "test/mira-studio-contrato.test.mjs::BUG-20260731-AMOM · animado Studio sem id no <svg> é reprovado nos dois formatos"
  regression_tests:
    - "test/mira-studio-contrato.test.mjs::BUG-20260731-AMOM · palco completo passa nos quatro layouts animados dos Studio"
    - "test/mira-studio-contrato.test.mjs::BUG-20260731-AMOM · a assimetria com o formato mira não volta"

spec_verdict: spec-correta

change_set:
  - id: CHG-001
    kind: code
    artifact: "agents/mira-fast/scripts/validate-run.mjs"
  - id: CHG-002
    kind: test
    artifact: "test/mira-fast-assemble.test.mjs"
  - id: CHG-003
    kind: specification
    artifact: "agents/mira-ultrafast/references/formato-mira-studio.md, agents/mira-ultrafast/references/formato-mira-studio-full.md"
  - id: CHG-004
    kind: test
    artifact: "test/mira-studio-contrato.test.mjs"

change_risk: baixa
addenda: []

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

# Validador de fragmento dos formatos Studio aceita palco sem .anim-stage e svg sem id

## Summary

`validateFragment` é rigoroso com o formato `mira` e frouxo com os formatos Studio. Um
fragmento animado sem `class="anim-stage"` e com `<svg>` sem id passa nos formatos Studio com
**zero erros**. O mesmo fragmento, no formato `mira`, coleta cinco erros.

`.anim-stage` é a classe que carrega o dimensionamento do palco no template
(`flex: 1 1 auto; min-height: 0; width: 100%`, e `.anim-stage svg { width:100%; height:100% }`).
Sem ela o palco não recebe altura e o SVG cai no tamanho padrão de elemento substituído.
Nada no pipeline avisa.

## Expected Behavior

`_reversa_sdd/mira-fast/sdd/04-fase-2-enxame.md#r6-contrato-de-saida-rigido` define o palco
como `<div class="anim-stage" id="<slug_stage>-stage">` com `<svg id="<slug_stage>-svg">`, e
`formato-mira-studio.md` repete a classe e os dois ids nos exemplos de `split` e `full`.

`_reversa_sdd/mira-fast/sdd/05-fase-3-montagem.md#r1-validacao-estrutural-antes-de-concatenar-rf09`
existe para que fragmento fora do contrato seja rejeitado com o motivo registrado, nunca
silenciado (RNF06).

Se o contrato prescreve, o validador deveria cobrar, nos quatro formatos.

## Actual Behavior

`validate-run.mjs` cobra do formato `mira` (linhas 162-175): `.slide-main`, `<h2>`,
`.anim-stage`, `id="<slug>-svg"`, ausência de viewBox fixo, cálculo do viewBox em JS, leitura
de `--mira-primary`, ausência de hexadecimal fixo.

Dos formatos Studio (linhas 182-198) cobra apenas `data-layout` e a presença ou ausência de
`cam-area`, `split-top`, `thirds-main`, `full-main`. Nada sobre `.anim-stage`, nada sobre o
id do `<svg>`. A única checagem comum é o `id="<slug_stage>-stage"` da linha 142.

Reproduzido nesta varredura. Peguei um fragmento `split` válido e troquei

```html
<div class="anim-stage" id="hub-central-stage"><svg id="hub-central-svg" viewBox="0 0 960 960">
```

por

```html
<div id="hub-central-stage"><svg viewBox="0 0 960 960">
```

Resultado:

```
mira-studio: validate-run aprova? true []
mira:        validate-run aprova? false
             mira animado exige .slide-main
             mira animado exige .anim-stage
             id do svg ausente
             mira-default não aceita viewBox fixo no HTML
             mira animado deve calcular viewBox no JavaScript
```

O fixture do próprio repositório consagra o fragmento frouxo:
`test/mira-fast-assemble.test.mjs:170-172` monta os fragmentos `mira-studio` e
`mira-studio-full` com `<div id="corrida-stage">`, sem `class="anim-stage"` e sem id no
`<svg>`, e o teste passa.

## Steps to Reproduce

1. Pegar um fragmento animado válido de um deck `mira-studio`.
2. Remover `class="anim-stage"` do palco e o `id` do `<svg>`.
3. `node agents/mira-fast/scripts/validate-run.mjs "<deck>" --slide N` → `ok: true`, zero
   erros.
4. Repetir com um plano de formato `mira`: cinco erros.

## Evidence

- `evidence/execucao.md` — script da reprodução e as duas saídas lado a lado.

## Suspected Area

`validate-run.mjs:182-198`. As checagens por formato cresceram junto com o `mira` e nunca
foram estendidas aos Studio. O fixture de teste sem `.anim-stage` sugere que a lacuna passou
despercebida desde a criação: se o validador cobrasse, o fixture não teria sido escrito
assim.

Consequência de segunda ordem, não observada em navegador: uma animação gerada que siga o
padrão do `mira` e faça `svg.node().closest('.anim-stage')` recebe `null` e quebra. As
animações do próprio template fazem exatamente isso
(`templates/decks/mira-studio-demo/index.html:521` e `650`).

## Acceptance Criteria

1. Fragmento animado dos formatos Studio sem `class="anim-stage"` é rejeitado.
2. Fragmento animado dos formatos Studio sem `id="<slug_stage>-svg"` é rejeitado.
3. Os fixtures de `test/mira-fast-assemble.test.mjs` são corrigidos para o contrato real, e
   passam a exercitar o que o contrato prescreve.
4. Teste de regressão cobre 1 e 2 nos quatro formatos, para a assimetria não voltar.

## Traceability

| Eixo | Referência |
|---|---|
| Spec | `04-fase-2-enxame.md#r6-contrato-de-saida-rigido`, `05-fase-3-montagem.md#r1-validacao-estrutural-antes-de-concatenar-rf09` |
| Contrato | `agents/mira-fast/references/formato-mira-studio.md`, `formato-mira-studio-full.md` |
| Código afetado | `agents/mira-fast/scripts/validate-run.mjs` (182-198), comparar com (162-175) |
| Fixture que consagra a lacuna | `test/mira-fast-assemble.test.mjs` (170-172) |
| Testes | nenhum cobre isto |

## Resolution

Corrigido em 2026-08-01. **Não fechado**: closure policy `package`, exige merge e versão
publicada. Estado atual `active` / `delivering`.

### Causa raiz (confirmed)

A hipótese do registro se confirmou, e a confirmação veio do próprio conserto: ao apertar o
validador, os dois fixtures Studio de `test/mira-fast-assemble.test.mjs` ficaram vermelhos na
hora, com `animado Studio exige .anim-stage | id do svg ausente`.

Isso fecha o caminho causal. O fixture não estava frouxo por acaso: ele foi escrito assim
**porque** o validador permitia, e enquanto ele existisse assim, nada no repositório apontava
para a lacuna.

### O que mudou

1. **Validador**: uma checagem comum aos dois formatos Studio, para folha animada, exigindo
   `class="anim-stage"` e `id="<slug_stage>-svg"`. É a mesma exigência que o formato `mira` já
   fazia, e a mesma que `04#R6` já escrevia.
2. **Fixtures**: `test/mira-fast-assemble.test.mjs` passa a emitir o palco do contrato, com a
   classe e os dois ids. Critério de aceite 3.
3. **Contratos condensados do `/mira-ultrafast`**: as duas versões terse passaram a listar a
   estrutura cobrada. O `/mira-ultrafast` reusa este mesmo validador, e sem isso teria começado
   a falhar sem que o agente soubesse o que emitir.

### Veredito de spec: `spec-correta`

Único caso desta rodada em que a spec já estava certa. `04#R6` define o palco como
`<div class="anim-stage" id="<slug_stage>-stage">` com `<svg id="<slug_stage>-svg">`, e
`05#R1` existe para que fragmento fora do contrato seja rejeitado com o motivo registrado. O
código é que divergia: cobrava do `mira` e não cobrava dos Studio.

Nenhum adendo gerado. A regra de processo que evita a repetição ("o validador cobra o que o
contrato prescreve") está em R1d do adendo do BUG-20260731-VPVV, que cita este bug.

### Change set

| CHG | tipo | artefato | propósito |
|---|---|---|---|
| CHG-001 | `code` | `agents/mira-fast/scripts/validate-run.mjs` | folha animada Studio exige `.anim-stage` e id do svg ([diff](fix/CHG-001.diff)) |
| CHG-002 | `test` | `test/mira-fast-assemble.test.mjs` | fixtures passam a exercitar o contrato real ([diff](fix/CHG-002.diff)) |
| CHG-003 | `specification` | contratos condensados do `/mira-ultrafast` | a estrutura cobrada, na versão terse ([diff](fix/CHG-003.diff)) |
| CHG-004 | `test` | `test/mira-studio-contrato.test.mjs` | cinco casos nos quatro layouts animados ([diff](fix/CHG-004.diff)) |

Plano da correção: [fix/plan.html](fix/plan.html).

### Prova vermelho → verde

```
antes  ✖ animado Studio sem .anim-stage é reprovado nos dois formatos
       ✖ animado Studio sem id no <svg> é reprovado nos dois formatos
       ✖ a assimetria com o formato mira não volta
       ✔ palco completo passa nos quatro layouts animados dos Studio

depois ✔ os quatro

efeito colateral esperado, e observado:
       ✖ montagem determinística cobre mira-studio        (fixture frouxo)
       ✖ montagem determinística cobre mira-studio-full   (fixture frouxo)
       → verdes depois do CHG-002
```

Suíte completa: 148 testes, 148 passando.

### O que continua aberto

O palco colapsado **não foi medido em pixels** no navegador. A afirmação sobre dimensionamento
continua vindo do CSS do template (`.anim-stage { flex: 1 1 auto; min-height: 0 }`), como as
Agent Notes já registravam, e nenhum teste de regressão visual foi escrito. O que os testes
provam é que o fragmento fora do contrato passa a ser rejeitado, que é o critério de aceite.

## Agent Notes

- Achado do pente-fino de 2026-07-31. Relatório em
  `../../inspections/2026-07-31-decks-studio/report.md`.
- **Só a assimetria do validador foi observada**, não o resultado visual do palco colapsado.
  A afirmação sobre dimensionamento vem do CSS do template
  (`index.html:111-112`), não de renderização medida. Quem for corrigir deve confirmar num
  navegador antes de escrever o teste de regressão visual, se houver.
- **Corrigir junto com o BUG-20260731-UDTY.** Os dois são a mesma lacuna vista de ângulos
  diferentes: o contrato do `full` omite o wrapper e o validador não cobra nem o que o
  contrato já diz.
- **Proposta de taxonomia:** `area: geracao-de-decks`, `module: mira-fast`,
  `feature: validacao-de-fragmento`.
