---
schema_version: 1
id: BUG-20260731-UDTY
display_number: 6
title: Contrato do layout full omite .full-wrap e o slide perde a área segura do formato
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
  - bug: BUG-20260731-VPVV
    type: related-to
    state: supported
    evidence:
      - ref: "fix/plan.html"
        observation: "mesma lacuna: contrato de formato omisso e validador que não cobra. Corrigidos juntos, no mesmo arquivo de contrato e no mesmo bloco do validador."
  - bug: BUG-20260731-AMOM
    type: related-to
    state: supported
    evidence:
      - ref: "fix/plan.html"
        observation: "o AMOM já apontava para corrigir os dois juntos; o contrato do full omitia o wrapper e o validador não cobrava nem o que o contrato já dizia"

traceability:
  specs:
    - "_reversa_sdd/mira-fast/sdd/03-fase-1-plano.md#r9-especificidade-por-formato"
    - "_reversa_sdd/sdd/enquadramento-seguro-de-plataforma.md"
  affected_code:
    - "agents/mira-fast/references/formato-mira-studio.md:38-48"
    - "agents/mira-fast/scripts/validate-run.mjs:190"
    - "templates/decks/mira-studio-demo/index.html:103-108"
    - "templates/decks/mira-studio-demo/index.html:450-452"
  root_cause:
    state: confirmed
    hypothesis: >-
      Descuido de escrita do contrato, não decisão. O contrato irmão do 16x9 inclui os
      wrappers nos dois layouts que os exigem, e o contrato do mira-studio inclui .split-top
      no split. Só o full do mira-studio ficou de fora, e o validador não cobrava.
    causal_path:
      - "formato-mira-studio.md manda pendurar <h2> e palco direto na <section>"
      - "a folha emite o slide sem .full-wrap, e validate-run aprova"
      - "a regra section[data-layout=full] .full-wrap não se aplica a nada"
      - "em file:// o slide renderiza sem os 4,63% de área segura"
      - "sob HTTP o builder do roteiro CRIA o .full-wrap ao reconstruir e o padding volta"
      - "o mesmo deck exibe dois enquadramentos diferentes conforme o protocolo"
    evidence:
      - ref: "evidence/execucao.md"
        observation: "1/1: full-wrap só aparecia na regra CSS e no builder, nunca dentro do slide"
      - ref: "fix/CHG-004.diff"
        observation: "o caso em navegador mede o wrapper presente nos dois protocolos"
    code_refs:
      - file: "agents/mira-fast/references/formato-mira-studio.md"
        symbol: "Layout full"
        commit: "5433675"
  reproduction_tests:
    - "test/mira-studio-contrato.test.mjs::BUG-20260731-UDTY · full do mira-studio sem .full-wrap é reprovado"
  regression_tests:
    - "test/mira-studio-contrato.test.mjs::BUG-20260731-UDTY · full do mira-studio com .full-wrap passa"
    - "test/mira-studio-builders.test.mjs::BUG-20260731-UDTY · o slide full gerado tem .full-wrap nos dois protocolos"

spec_verdict: spec-gap

change_set:
  - id: CHG-001
    kind: specification
    artifact: "agents/mira-fast/references/formato-mira-studio.md"
  - id: CHG-002
    kind: code
    artifact: "agents/mira-fast/scripts/validate-run.mjs"
  - id: CHG-003
    kind: specification
    artifact: "agents/mira-ultrafast/references/formato-mira-studio.md"
  - id: CHG-004
    kind: test
    artifact: "test/mira-studio-contrato.test.mjs, test/mira-studio-builders.test.mjs"
  - id: CHG-005
    kind: specification
    artifact: "_reversa_sdd/addenda/bug-BUG-20260731-UDTY-v001.md"

change_risk: baixa
addenda:
  - "_reversa_sdd/addenda/bug-BUG-20260731-UDTY-v001.md"

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

Corrigido em 2026-08-01. **Não fechado**: closure policy `package`, exige merge e versão
publicada. Estado atual `active` / `delivering`.

### Causa raiz (confirmed)

Descuido de escrita do contrato, confirmado pela comparação que o registro já sugeria: o
contrato irmão `formato-mira-studio-full.md` inclui `.thirds-main` e `.full-main` nos dois
layouts que os exigem, e o próprio `formato-mira-studio.md` inclui `.split-top` no `split`.
Só o `full` do `mira-studio` ficou de fora.

O agravante é o que torna o defeito visível: sob HTTP o builder do roteiro **cria** o
`.full-wrap` ao reconstruir. O mesmo deck aparecia com um enquadramento em `file://` e outro
sob HTTP.

### O que mudou

1. **Contrato**: a seção "Layout `full`" passa a envolver `<h2>` e palco em
   `<div class="full-wrap">`, com uma frase explicando que o wrapper carrega a área segura de
   4,63%. A versão condensada do `/mira-ultrafast` recebeu a mesma exigência.
2. **Validador**: fragmento `full` do `mira-studio` sem o wrapper é reprovado com
   `full Studio exige full-wrap`, do mesmo jeito que já reprovava `split` sem `split-top`.

Conforme as Agent Notes, o valor do padding **não** saiu deste bug: continua vindo de
`_reversa_sdd/sdd/enquadramento-seguro-de-plataforma.md` e do CSS do template. O adendo fixa
que o slide gerado tem que receber essa geometria, não qual é ela.

### Veredito de spec: `spec-gap`

`03#R9` prevê o layout `full`, e a spec de enquadramento define a área segura. A ligação entre
as duas (qual elemento carrega o padding no slide gerado) nunca foi escrita. Adendo aditivo:

`_reversa_sdd/addenda/bug-BUG-20260731-UDTY-v001.md` — R9c, wrapper de área segura.

### Change set

| CHG | tipo | artefato | propósito |
|---|---|---|---|
| CHG-001 | `specification` | `agents/mira-fast/references/formato-mira-studio.md` | layout `full` com `.full-wrap` ([diff](fix/CHG-001.diff)) |
| CHG-002 | `code` | `agents/mira-fast/scripts/validate-run.mjs` | reprova `full` sem o wrapper ([diff](fix/CHG-002.diff)) |
| CHG-003 | `specification` | `agents/mira-ultrafast/references/formato-mira-studio.md` | a mesma exigência na versão condensada ([diff](fix/CHG-003.diff)) |
| CHG-004 | `test` | `test/mira-studio-contrato.test.mjs`, `test/mira-studio-builders.test.mjs` | validador reprova; enquadramento igual nos dois protocolos ([diff](fix/CHG-004.diff)) |
| CHG-005 | `specification` | `_reversa_sdd/addenda/bug-BUG-20260731-UDTY-v001.md` | adendo aditivo |

Plano da correção: [fix/plan.html](fix/plan.html).

### Prova vermelho → verde

```
antes  ✖ full do mira-studio sem .full-wrap é reprovado
       ✔ full do mira-studio com .full-wrap passa
       ✔ o slide full gerado tem .full-wrap nos dois protocolos

depois ✔ os três
```

### O que continua aberto

O `viewBox` fixo. O contrato dos Studio prescreve `viewBox="0 0 960 1522.5"` enquanto o
formato `mira` **proíbe** viewBox fixo e exige cálculo em JavaScript. A assimetria estava
anotada nas Agent Notes deste bug e continua de pé: não foi tocada, porque mexer nela é mudar
o contrato de animação dos dois formatos Studio, muito além do escopo deste defeito.

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
