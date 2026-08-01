---
schema_version: 1
id: BUG-20260731-VPVV
display_number: 5
title: Contrato do mira-studio não exige class="capa" e a capa gerada vira um slide de câmera vazio
status: open
phase: triaging
severity: high
priority: P1
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
  - bug: BUG-20260731-JZNJ
    type: related-to
    state: proposed
    evidence: []

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

Em aberto.

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
