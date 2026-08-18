---
schema_version: 1
id: BUG-20260818-V4LD
display_number: 22
title: O /mira-validator aprova deck com timer órfão porque o checklist não tem nenhum item sobre tempo, corte seco ou plano B da continuação
status: open
phase: triaging
severity: low
priority: P3
created: 2026-08-18
updated: 2026-08-18

origin:
  type: manual-report
  external_ref: null

area: unclassified
module: unclassified
feature: unclassified
labels:
  - spec-gap
  - sincronia-temporal
  - validacao

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: "leitura do checklist: 9 seções, nenhuma sobre tempo"
  suspected_triggers: []

blocking: []

relationships:
  - bug: BUG-20260818-T3RG
    type: related-to
    state: proposed
    evidence: []

traceability:
  specs:
    - "agents/mira-validator/SKILL.md#L30"
  affected_code:
    - "agents/mira-validator/SKILL.md:30-113"
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

# O /mira-validator aprova deck com timer órfão porque o checklist não tem nenhum item sobre tempo, corte seco ou plano B da continuação

## Summary

O checklist do `/mira-validator` tem nove seções: cores, identidade visual, vídeos, layout
dos cards, tipografia, estrutura e navegação, conteúdo e composição, assets do capítulo e
segurança. Nenhuma delas olha para o eixo do tempo.

A consequência é a que se vê no BUG-20260818-T3RG: quatro templates oficiais rodam timer
solto e nenhum deles jamais foi reprovado por isso, porque não existe item que reprove.

Omissão de ferramenta, não defeito de deck. Por isso `low`/`P3`.

## Expected Behavior

**Não há spec.** `spec-gap`. O documento do autor
([`../../intake/spec-sincronia-determinista-proposta.md`](../../intake/spec-sincronia-determinista-proposta.md),
seção 5) propõe cinco itens de validação:

1. Sem timers órfãos: nenhum slide chama `d3.timer`, `setTimeout` em cadeia ou `setInterval`
   sem passar por um portão de entrada.
2. Quadro zero testado: carregar, esperar, rolar até o meio do deck, o slide entra no
   quadro 0.
3. Guarda `ms > 0` em toda chamada de `MiraSeq.gravar`.
4. Corte seco testado: nenhum frame em movimento do slide de baixo durante a passagem de um
   par `@MIRA:SEQ`.
5. Plano B: todo slide de continuação renderiza sozinho, sem depender da origem.

Três desses cinco já são regra escrita na `/mira-sequence` (itens 3, 4 e 5, este último com o
nome `poseEntrega(F)`, ver `agents/mira-sequence/SKILL.md:114` e `:188-189`). O que falta é
alguém conferir.

## Actual Behavior

`agents/mira-validator/SKILL.md`, seção "Checklist de Verificações", linhas 30 a 113:

```
### A. Cores (crítico)
### B. Identidade Visual (crítico)
### C. Vídeos (crítico)
### D. Layout dos Cards (importante)
### E. Tipografia (importante)
### F. Estrutura e Navegação (importante)
### G. Conteúdo e Composição (qualidade)
### H. Assets do Capítulo (importante)
### I. Segurança (importante)
```

A seção F, que pelo nome seria a candidata, trata da estrutura das `<section>` e dos
elementos de navegação, não do comportamento da passagem. Busca por `timer`,
`IntersectionObserver`, `reger`, `scrollIntoView` e `ms > 0` no arquivo inteiro: nenhuma
ocorrência.

## Steps to Reproduce

1. Rodar `/mira-validator` sobre `templates/decks/aula-capitulo/index.html`, que tem dois
   `d3.timer` sem portão de entrada (linhas 331 e 371) e nenhum `IntersectionObserver`.
2. Ler o relatório.

Esperado: um apontamento sobre timer sem portão de entrada.
Observado: nada. O deck passa nos critérios existentes.

## Evidence

- [`../../intake/relato-20260818-1211.md`](../../intake/relato-20260818-1211.md), linha
  "Checklist no validador" da tabela de varredura.
- [`../../intake/spec-sincronia-determinista-proposta.md`](../../intake/spec-sincronia-determinista-proposta.md),
  seção 5.

## Suspected Area

`agents/mira-validator/SKILL.md`, uma seção nova no checklist (seria a J) mais uma linha na
tabela de severidade.

## Acceptance Criteria

1. O checklist ganha uma seção de sincronia temporal com, no mínimo, o item de timer sem
   portão de entrada e o de guarda `ms > 0`.
2. Rodar o validador sobre `templates/decks/aula-capitulo/index.html` reprova nos itens
   novos, e sobre `templates/decks/mira-default/index.html` aprova.
3. Os itens que só se verificam com o olho (quadro zero e corte seco, itens 2 e 4 da
   proposta) entram como verificação manual declarada, não como se o validador soubesse
   checar sozinho. Validador que finge checar o que não checa é pior que validador sem o item.
4. O item do plano B usa o nome que o projeto de fato usa, `poseEntrega(F)`, e não
   `posePlanoB()`.
5. A severidade dos itens novos é decidida com o autor: nada nesta lista é da família
   "crítico" das cores e da identidade visual.

## Traceability

- **Spec:** `agents/mira-validator/SKILL.md#L30`, o próprio checklist.
- **Código afetado:** o SKILL.md do validador.
- **Causa raiz:** o validador nasceu olhando aparência estática; o eixo do tempo entrou no
  Mira depois, com o `reger` e a `/mira-sequence`, e o checklist não acompanhou. Confirmar
  por `git log` no fix.
- **Testes:** nenhum.

## Agent Notes

- Este bug depende de o BUG-20260818-T3RG definir qual é a regra. Escrever item de checklist
  antes de a regra estar decidida produz um validador que reprova o que o projeto aceita.
- **Proposta de taxonomia:** `area: qualidade`, `module: validador`,
  `feature: sincronia-temporal`.
