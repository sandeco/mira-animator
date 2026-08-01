---
schema_version: 1
id: BUG-20260731-UDTY
display_number: 6
title: Contrato do layout full omite .full-wrap e o slide perde a área segura do formato
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
  - bug: BUG-20260731-VPVV
    type: related-to
    state: proposed
    evidence: []

traceability:
  specs:
    - "_reversa_sdd/mira-fast/sdd/03-fase-1-plano.md#r9-especificidade-por-formato"
    - "_reversa_sdd/sdd/enquadramento-seguro-de-plataforma.md"
  affected_code:
    - "agents/mira-fast/references/formato-mira-studio.md:38-48"
    - "agents/mira-fast/scripts/validate-run.mjs:190"
    - "templates/decks/mira-studio-demo/index.html:103-108"
    - "templates/decks/mira-studio-demo/index.html:450-452"
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

# Contrato do layout full omite .full-wrap e o slide perde a área segura do formato

## Summary

No formato `mira-studio`, o padding de área segura do layout `full` mora na regra
`section[data-layout="full"] .full-wrap`. O contrato do `/mira-fast` para esse layout não
inclui o `.full-wrap`: manda pendurar `<h2>` e o palco direto na `<section>`.

Resultado: o slide `full` gerado renderiza sem o padding, colado nas bordas. E como o
builder do roteiro **cria** o `.full-wrap` ao reconstruir, o mesmo deck aparece de um jeito
em `file://` e de outro sob HTTP.

## Expected Behavior

O template define a geometria do layout `full` em `index.html:103-108`:

```css
section[data-layout="full"] .full-wrap {
    flex: 1 1 auto; min-height: 0;
    display: flex; flex-direction: column;
    padding: 4.63% 4.63% 3%;
}
```

Os 4,63% são a área segura do padrão `mira-squared` (o próprio template documenta na linha
89: "50/1080 do lado = 4.63%"). O slide gerado pelo `/mira-fast` deve receber essa mesma
geometria, como recebe nos outros layouts.

O contrato irmão `formato-mira-studio-full.md` inclui os wrappers (`.thirds-main`,
`.full-main`) nos dois layouts que os exigem. O contrato do `mira-studio` inclui
`.split-top` no `split`. Só o `full` do `mira-studio` ficou de fora.

## Actual Behavior

`agents/mira-fast/references/formato-mira-studio.md`, seção "Layout `full`", prescreve:

```html
<section data-layout="full">
  <h2>TÍTULO</h2>
  <!-- @MIRA:SIZE 3/10 -->
  <div class="anim-stage" id="SLUG-stage"><svg id="SLUG-svg" viewBox="0 0 960 1522.5"></svg></div>
</section>
```

Sem `.full-wrap`. O slide gerado nesta varredura saiu exatamente assim
(`index.html` do deck, linha 270), e a regra de padding não se aplica a nada.

`validate-run.mjs:190` só verifica que o layout `full` não contém `cam-area`. Não cobra o
wrapper.

Sob HTTP, `montarSecao` (linhas 450-452) monta
`<div class="full-wrap"><h2></h2>` + palco. O wrapper aparece e o padding volta. Os dois
protocolos exibem o mesmo slide com enquadramentos diferentes.

## Steps to Reproduce

1. Montar um deck `mira-studio` com um slide `layout: full` animado, fragmento escrito como
   o contrato manda.
2. `grep -n "full-wrap" <deck>/index.html` só encontra a regra CSS (linha 103) e o builder
   (linha 464). Nenhuma ocorrência dentro do slide.
3. Abrir por `file://`: animação encostada nas bordas da coluna.
4. Servir por HTTP e recarregar: o padding aparece.

## Evidence

- `evidence/execucao.md` — HTML do slide gerado e a localização das duas ocorrências de
  `full-wrap` no deck.

## Suspected Area

`agents/mira-fast/references/formato-mira-studio.md`, seção "Layout `full`". Comparar com a
seção "Layout `split`" do mesmo arquivo e com as duas seções de
`formato-mira-studio-full.md`, que trazem os wrappers. A omissão parece descuido de escrita
do contrato, não decisão.

## Acceptance Criteria

1. O contrato do layout `full` do `mira-studio` inclui `<div class="full-wrap">` envolvendo
   `<h2>` e o palco.
2. `validate-run.mjs` reprova fragmento `full` sem o wrapper, como já reprova `split` sem
   `split-top`.
3. Slide `full` gerado renderiza com o mesmo enquadramento em `file://` e sob HTTP.
4. Teste de regressão cobre 2 e 3.

## Traceability

| Eixo | Referência |
|---|---|
| Spec | `03-fase-1-plano.md#r9-especificidade-por-formato` |
| Spec de enquadramento | `_reversa_sdd/sdd/enquadramento-seguro-de-plataforma.md` |
| Contrato omisso | `agents/mira-fast/references/formato-mira-studio.md` (Layout full) |
| Validador permissivo | `agents/mira-fast/scripts/validate-run.mjs:190` |
| Geometria esperada | `templates/decks/mira-studio-demo/index.html` (103-108) |
| Testes | nenhum |

## Resolution

Em aberto.

## Agent Notes

- Achado do pente-fino de 2026-07-31. Relatório em
  `../../inspections/2026-07-31-decks-studio/report.md`.
- **Toca o trabalho de áreas seguras.** O brief registrado em `.reversa/state.json` é
  "áreas seguras de plataforma no mira-studio 9:16 para Reels e Shorts". Um slide `full`
  sem os 4,63% é exatamente o enquadramento que aquele trabalho tenta garantir. Vale
  conferir `_reversa_sdd/sdd/enquadramento-seguro-de-plataforma.md` antes de corrigir, para
  o valor do padding sair de lá e não deste bug.
- **O viewBox fixo é assunto separado.** O contrato manda `viewBox="0 0 960 1522.5"`, mas o
  palco real não tem essa proporção (há `<h2>` acima e padding em volta). No formato `mira`
  o validador **proíbe** viewBox fixo e exige cálculo em JavaScript
  (`validate-run.mjs:167-171`); nos formatos Studio, prescreve o oposto. Não registrei como
  bug porque não observei o resultado visual, mas quem corrigir este deve olhar junto.
- **Proposta de taxonomia:** `area: geracao-de-decks`, `module: mira-fast`,
  `feature: contrato-de-formato`.
