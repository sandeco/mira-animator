---
schema_version: 1
id: BUG-20260731-AMOM
display_number: 11
title: Validador de fragmento dos formatos Studio aceita palco sem .anim-stage e svg sem id
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
  suspected_triggers: []

blocking: []

relationships:
  - bug: BUG-20260731-UDTY
    type: related-to
    state: proposed
    evidence: []

traceability:
  specs:
    - "_reversa_sdd/mira-fast/sdd/05-fase-3-montagem.md#r1-validacao-estrutural-antes-de-concatenar-rf09"
    - "_reversa_sdd/mira-fast/sdd/04-fase-2-enxame.md#r6-contrato-de-saida-rigido"
  affected_code:
    - "agents/mira-fast/scripts/validate-run.mjs:182-198"
    - "agents/mira-fast/scripts/validate-run.mjs:162-175"
    - "test/mira-fast-assemble.test.mjs:170-172"
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

Em aberto.

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
