---
schema_version: 1
id: BUG-20260731-VPVV
display_number: 5
title: Contrato do mira-studio não exige class="capa" e a capa gerada vira um slide de câmera vazio
status: active
phase: delivering
severity: high
priority: P1
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
  - bug: BUG-20260731-JZNJ
    type: related-to
    state: supported
    evidence:
      - ref: "evidence/execucao.md"
        observation: "os dois aparecem no mesmo builder e no mesmo load, mas por mecanismos independentes: aqui a capa não tem palco, ela depende do clone de capaBase. Correções separadas, como o registro previa."
  - bug: BUG-20260731-UDTY
    type: related-to
    state: supported
    evidence:
      - ref: "fix/plan.html"
        observation: "mesma lacuna vista de dois ângulos: contrato de formato omisso e validador que não cobra"

traceability:
  specs:
    - "_reversa_sdd/mira-fast/sdd/03-fase-1-plano.md#r9-especificidade-por-formato"
    - "_reversa_sdd/mira-fast/sdd/05-fase-3-montagem.md#r5-titulo-da-capa-rf12-diretiva-do-claudemd"
  affected_code:
    - "agents/mira-fast/references/formato-mira-studio.md:7-9"
    - "agents/mira-fast/references/contrato-estatico.md:14"
    - "agents/mira-fast/scripts/validate-run.mjs:182-184"
    - "templates/decks/mira-studio-demo/index.html:433"
    - "templates/decks/mira-studio-demo/index.html:441-445"
    - "templates/decks/mira-studio-demo/index.html:64"
    - "templates/decks/mira-studio-demo/index.html:479-480"
  root_cause:
    state: confirmed
    hypothesis: >-
      O contrato do /mira-fast foi escrito depois do template e não espelhou a exigência da
      classe. Como o validador só conferia a ausência de data-layout, a omissão do contrato
      nunca produziu erro: contrato sem validação é contrato esquecido.
    causal_path:
      - "formato-mira-studio.md descreve a capa como 'section sem data-layout' e omite class=capa"
      - "a folha emite <section> pelada, e validate-run aprova"
      - "em file:// as regras section.capa e .capa::before não se aplicam"
      - "sob HTTP querySelector('body > section.capa') devolve null"
      - "a condição s.layout === 'capa' && capaBase é falsa e o fluxo escorre até o else"
      - "a capa vira <section data-layout=camera><div class=cam-area></div></section>"
      - "semear() rotula o slide 1 como camera e a perda vira permanente no roteiro.md"
    evidence:
      - ref: "evidence/execucao.md"
        observation: "1/1 na varredura de 2026-07-31, executando o parse do próprio deck gerado"
      - ref: "fix/CHG-004.diff"
        observation: "o validador reprovava zero vezes antes; três casos vermelhos passaram a existir"
    code_refs:
      - file: "agents/mira-fast/references/formato-mira-studio.md"
        symbol: "Layout capa"
        commit: "5433675"
      - file: "agents/mira-fast/scripts/validate-run.mjs"
        symbol: "validateFragment"
        commit: "456b38b"
  reproduction_tests:
    - "test/mira-studio-contrato.test.mjs::BUG-20260731-VPVV · capa Studio sem class=\"capa\" é reprovada"
    - "test/mira-studio-contrato.test.mjs::BUG-20260731-VPVV · encerramento no layout capa também exige a classe"
  regression_tests:
    - "test/mira-studio-contrato.test.mjs::BUG-20260731-VPVV · capa Studio com class=\"capa\" passa"
    - "test/mira-studio-builders.test.mjs::BUG-20260731-VPVV · a capa gerada continua capa sob HTTP"

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
    artifact: "_reversa_sdd/addenda/bug-BUG-20260731-VPVV-v001.md"

change_risk: baixa
addenda:
  - "_reversa_sdd/addenda/bug-BUG-20260731-VPVV-v001.md"

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

# Contrato do mira-studio não exige class="capa" e a capa gerada vira um slide de câmera vazio

## Summary

O layout `capa` do formato `mira-studio` depende da classe CSS `capa` na `<section>`, mas
nenhum contrato do `/mira-fast` manda emiti-la. A capa gerada sai como `<section>` pelada.

Três consequências, todas verificadas: em `file://` a capa perde o estilo próprio; sob HTTP
o builder do roteiro não encontra `body > section.capa`, cai no ramo padrão e **transforma a
capa num slide de câmera vazio**, título e subtítulo incluídos; e a semeadura do
`roteiro.md` rotula esse slide como `camera`.

## Expected Behavior

`_reversa_sdd/mira-fast/sdd/03-fase-1-plano.md#r9-especificidade-por-formato` prevê o layout
`capa` para o `mira-studio`, e `validate-run.mjs:90` exige tipo `capa` ou `encerramento`
nesse layout. `agents/mira-studio/SKILL.md:37` descreve capa e encerramento como slides
"sem `data-layout`, que mantêm layout próprio" — o layout próprio é a regra
`section.capa { justify-content: center; gap: 20px; padding: 7% 9%; }`.

`contrato-estatico.md:14` promete: "Capa preserva título e subtítulo".

A capa gerada deve, portanto, continuar sendo uma capa nos dois protocolos.

## Actual Behavior

`agents/mira-fast/references/formato-mira-studio.md`, seção "Layout `capa`", diz apenas:
"Use uma section sem `data-layout`, com título e subtítulo." Não menciona `class="capa"`.
`validate-run.mjs:182-184` só verifica que a capa **não** usa `data-layout`.

No deck que montei, a capa saiu assim:

```html
<section><h1>Corte de <span class="accent">80 por cento</span></h1><p>Subtitulo curto.</p></section>
```

Sem `class="capa"`:

1. `section.capa` (`index.html:64`) e `.capa::before` (linha 72) não se aplicam. A capa fica
   sem padding, alinhada ao topo, sem o glow.
2. `capaBase = document.querySelector('body > section.capa')` (linha 433) devolve `null`.
   Em `montarSecao` (linha 441), a condição `s.layout === 'capa' && capaBase` é falsa, o
   fluxo escorre até o `else` da linha 453 e a seção vira
   `<section data-layout="camera"><div class="cam-area"></div></section>`. **A capa some.**
3. `semear()` (linhas 479-480) usa `sec.classList.contains('capa') ? 'capa' : 'camera'`: se
   o `roteiro.md` precisar ser recriado, o slide 1 é gravado como `camera`, tornando a perda
   permanente no arquivo.

## Steps to Reproduce

1. Montar um deck `mira-studio` pelo `/mira-fast` com um slide `layout: capa`, com o
   fragmento escrito exatamente como `formato-mira-studio.md` prescreve.
2. `grep -c 'section class="capa"' <deck>/index.html` devolve `0`.
3. Servir por HTTP e abrir. O primeiro slide é uma área de câmera vazia.

Reproduzido nesta varredura executando o `parse()` do próprio deck gerado sobre o
`roteiro.md` gerado:

```
capaBase (body > section.capa) existe no deck? false
slide 1 layout=capa    -> ramo=camera (queda de layout desconhecido)
```

## Evidence

- `evidence/execucao.md` — saída completa da reprodução, com o comando e o deck usado.
- `../../../templates-studio/intake/relato-20260731-2105.md` — contexto do relato original.

## Suspected Area

`agents/mira-fast/references/formato-mira-studio.md`, seção "Layout `capa`". A omissão está
no contrato, não no template: o template define `section.capa` desde a origem e a skill
`mira-studio` documenta o comportamento. O contrato do `/mira-fast` foi escrito depois
(commit `5433675`, 2026-07-26) sem espelhar essa exigência.

Área secundária: `validate-run.mjs:182-191`, que não cobra a classe. Contrato sem validação
é contrato que vai ser esquecido de novo.

## Acceptance Criteria

1. `formato-mira-studio.md` prescreve explicitamente `<section class="capa">` para o layout
   `capa`, com exemplo, como já faz para `camera`, `split` e `full`.
2. `validate-run.mjs` reprova fragmento de layout `capa` sem a classe.
3. Deck `mira-studio` gerado do zero mantém a capa como capa sob HTTP: título e subtítulo
   visíveis, não uma `cam-area` vazia.
4. Teste de regressão automatizado cobre 2 e 3.

## Traceability

| Eixo | Referência |
|---|---|
| Spec | `03-fase-1-plano.md#r9-especificidade-por-formato`, `05-fase-3-montagem.md#r5-titulo-da-capa-rf12-diretiva-do-claudemd` |
| Contrato omisso | `agents/mira-fast/references/formato-mira-studio.md` (Layout capa) |
| Validador permissivo | `agents/mira-fast/scripts/validate-run.mjs` (182-191) |
| Onde quebra | `templates/decks/mira-studio-demo/index.html` (64, 433, 441-445, 479-480) |
| Causa raiz | não investigada; é do `/reversa-debugger-fix` |
| Testes | nenhum |

## Resolution

Corrigido em 2026-08-01. **Não fechado**: closure policy `package`, exige merge e versão
publicada. Estado atual `active` / `delivering`.

### Causa raiz (confirmed)

A omissão está no contrato, não no template: `section.capa` existe no template desde a origem
e a skill `mira-studio` documenta o comportamento. O contrato do `/mira-fast` foi escrito
depois (commit `5433675`) sem espelhar a exigência, e o validador nunca cobrou a classe. Sem
cobrança, a omissão não produzia erro em lugar nenhum do pipeline.

### O que mudou

Duas pontas, exatamente como os critérios de aceite 1 e 2 pediam:

1. **Contrato**: `formato-mira-studio.md` passa a prescrever `<section class="capa">` com
   exemplo e com o motivo (a classe é o layout próprio e é o seletor que o builder usa). A
   mesma exigência entrou na versão condensada que o `/mira-ultrafast` lê, que reusa o mesmo
   validador e teria começado a falhar sem isso.
2. **Validador**: fragmento de layout `capa` sem a classe é reprovado com
   `capa Studio exige class="capa" na section`.

O encerramento tinha o mesmo defeito (`validate-run` aceita `layout: capa` para tipo
`encerramento`) e está coberto por caso próprio, como as Agent Notes pediam.

### Veredito de spec: `spec-gap`

`03#R9` prevê o layout `capa`, mas como a capa se **marca** no HTML nunca foi escrito. Adendo
aditivo gerado, spec original intocada:

`_reversa_sdd/addenda/bug-BUG-20260731-VPVV-v001.md` — R9b (marcação de layout no
`mira-studio`, tabela dos quatro layouts) e R1d (regra de processo: o validador cobra o que o
contrato prescreve). R1d existe porque a mesma lacuna produziu três bugs desta rodada:
BUG-20260731-VPVV, BUG-20260731-UDTY e BUG-20260731-AMOM.

### Change set

| CHG | tipo | artefato | propósito |
|---|---|---|---|
| CHG-001 | `specification` | `agents/mira-fast/references/formato-mira-studio.md` | seção "Layout capa" com exemplo e o porquê ([diff](fix/CHG-001.diff)) |
| CHG-002 | `code` | `agents/mira-fast/scripts/validate-run.mjs` | reprova capa sem a classe ([diff](fix/CHG-002.diff)) |
| CHG-003 | `specification` | `agents/mira-ultrafast/references/formato-mira-studio.md` | a mesma exigência na versão condensada ([diff](fix/CHG-003.diff)) |
| CHG-004 | `test` | `test/mira-studio-contrato.test.mjs`, `test/mira-studio-builders.test.mjs` | validador reprova; a capa gerada continua capa sob HTTP ([diff](fix/CHG-004.diff)) |
| CHG-005 | `specification` | `_reversa_sdd/addenda/bug-BUG-20260731-VPVV-v001.md` | adendo aditivo |

Plano da correção: [fix/plan.html](fix/plan.html).

### Prova vermelho → verde

```
antes  ✖ capa Studio sem class="capa" é reprovada
       ✖ encerramento no layout capa também exige a classe
       ✔ capa Studio com class="capa" passa
       ✔ a capa gerada continua capa sob HTTP

depois ✔ os quatro
```

O caso em navegador já passava antes porque o fragmento do teste sempre emitiu a classe: ele
mede o **efeito** da regra (a capa não vira câmera vazia), não a ausência dela. O vermelho
honesto deste bug está no validador.

### O que não mudou

`semear()` continua rotulando o slide pelo `classList.contains('capa')`. Com o contrato
cobrado, ela passa a acertar sozinha; a função não foi tocada.

## Agent Notes

- Achado do pente-fino de 2026-07-31, não do handoff original. Relatório completo em
  `../../inspections/2026-07-31-decks-studio/report.md`.
- **Independente do BUG-20260731-JZNJ.** Corrigir o builder do roteiro para preservar o
  palco não resolve este: a capa não tem palco, ela depende do clone de `capaBase`. Os dois
  precisam de correção separada.
- **Encerramento tem o mesmo problema.** `validate-run.mjs:90` aceita `layout: capa` para
  tipo `encerramento`. Um encerramento também vira câmera vazia.
- **Proposta de taxonomia:** `area: geracao-de-decks`, `module: mira-fast`,
  `feature: contrato-de-formato`.
