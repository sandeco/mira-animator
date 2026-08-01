---
schema_version: 1
id: BUG-20260731-S3TX
display_number: 2
title: Template mira-studio-full apaga todos os slides gerados e os substitui pelo deck de demonstração
status: open
phase: triaging
severity: critical
priority: P0
created: 2026-07-31
updated: 2026-07-31

origin:
  type: manual-report
  external_ref: null

area: unclassified
module: unclassified
feature: unclassified
labels: []

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: "não executado nesta sessão; leitura de código indica falha incondicional"
  suspected_triggers: []

blocking: []

relationships:
  - bug: BUG-20260731-JZNJ
    type: related-to
    state: proposed
    evidence: []

traceability:
  specs:
    - "_reversa_sdd/mira-fast/sdd/04-fase-2-enxame.md#r6-contrato-de-saida-rigido"
    - "_reversa_sdd/mira-fast/sdd/05-fase-3-montagem.md#r3-registro-de-triggers-rf10"
    - "_reversa_sdd/mira-fast/sdd/05-fase-3-montagem.md#r7-roteiromd-do-mira-studio-full-rf17"
    - "_reversa_sdd/mira-fast/sdd/03-fase-1-plano.md#r9-especificidade-por-formato"
  affected_code:
    - "templates/decks/mira-studio-full-demo/index-16x9.html:711-719"
    - "templates/decks/mira-studio-full-demo/index-16x9.html:780-793"
    - "templates/decks/mira-studio-full-demo/index-16x9.html:795-819"
    - "templates/decks/mira-studio-full-demo/index-16x9.html:820-824"
    - "agents/mira-fast/scripts/assemble-run.mjs:124-142"
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

# Template mira-studio-full apaga todos os slides gerados e os substitui pelo deck de demonstração

## Summary

O template do formato `mira-studio-full` não reaproveita os slides do HTML: ele remove
todas as seções do `body` e recria a tela inteira a partir do `roteiro.md`, ou, quando não
há `roteiro.md`, a partir de um array `DEFAULT` de cinco slides de demonstração embutido
no arquivo. A remoção é incondicional, fora de qualquer guarda de protocolo.

Num deck gerado pelo `/mira-fast`, isso significa que todo o trabalho da Fase 2 é apagado
no load, tanto por `file://` quanto por HTTP. Os palcos recriados usam o id genérico
`sv-slide-N` e as animações que tocam são as duas do próprio template
(`animLinha`/`animOrbita`), não as geradas.

Este defeito é mais grave que o BUG-20260731-JZNJ: alcança os dois protocolos e substitui
o conteúdo, não só o palco.

## Expected Behavior

`_reversa_sdd/mira-fast/sdd/04-fase-2-enxame.md#r6-contrato-de-saida-rigido` e
`_reversa_sdd/mira-fast/sdd/05-fase-3-montagem.md#r3-registro-de-triggers-rf10` valem para
todos os formatos: os slides escritos pela Fase 2 são o conteúdo do deck, com palco de id
`<slug_stage>-stage` e animação registrada contra esse id.

`_reversa_sdd/mira-fast/sdd/05-fase-3-montagem.md#r7-roteiromd-do-mira-studio-full-rf17`
declara o `roteiro.md` "fonte da verdade daquele formato", gerado a partir do plano com
layout, título e animação declarativa por slide.

`_reversa_sdd/mira-fast/sdd/03-fase-1-plano.md#r9-especificidade-por-formato` confirma que
o plano do `mira-studio-full` produz layout, texto da fala e o conteúdo do `roteiro.md`.

As duas exigências convivem se, e somente se, o `roteiro.md` governar texto, layout e
título **sem destruir** os slides. Nenhuma seção de spec autoriza descartar o HTML da Fase
2 nem substituir a animação gerada por uma animação declarativa do template.

## Actual Behavior

Em `templates/decks/mira-studio-full-demo/index-16x9.html`:

- linha 780: a guarda `if (location.protocol === 'http:' || ...)` cobre apenas a **busca**
  do `roteiro.md`. Nada mais.
- linha 791: `var slides = spec || DEFAULT;` — sem `roteiro.md`, cai no array `DEFAULT` da
  linha 712, com os cinco slides de demonstração do template.
- linha 793: `document.querySelectorAll('body > section').forEach(function (s) { s.remove(); });`
  — remoção incondicional de todas as seções, inclusive por `file://`.
- linhas 795 a 819: recria cada seção do zero. Linha 806:
  `svg.id = 'sv-slide-' + (i + 1)`.
- linhas 820 a 824: dispara `animOrbita`/`animLinha` contra `sv-slide-N`.

Com `roteiro.md` presente, a estrutura sobrevive mas o conteúdo animado não: `parseAnim`
(linha 719) só entende `linha:` e `orbita:` e, sem o campo, devolve o `def` da linha 720,
que é a animação de demonstração `CRIAÇÃO, GRAVAÇÃO, EDIÇÃO, FINALIZAÇÃO`.

`agents/mira-fast/scripts/assemble-run.mjs` linhas 124 a 142 gera esse `roteiro.md` e o
campo `animacao_declarativa` (linha 138) é opcional. Quando o plano não o preenche, o deck
gerado exibe a animação de demonstração do template.

## Steps to Reproduce

1. Gerar um deck com `/mira-fast <fonte> /mira-studio-full` com pelo menos um slide
   `thirds` ou `full` animado.
2. Abrir o `index-16x9.html` do deck por `file://`.
3. Observar: os slides exibidos são os do array `DEFAULT` do template, não os gerados.
4. Servir por HTTP com o `roteiro.md` ao lado e recarregar.
5. Observar: layout, título e falas vêm do `roteiro.md`, mas os palcos são `sv-slide-N` e
   a animação é a declarativa do template, não a da Fase 2.
6. No DevTools, confirmar que `document.getElementById('<slug_stage>-stage')` devolve
   `null` nos dois casos.

## Evidence

- `evidence/codigo-observado.md` — trechos exatos do builder do template e do gerador de
  `roteiro.md`, com arquivo e linha, extraídos deste repositório no commit `558a406`.
- `../../intake/relato-20260731-2105.md` — problema 3 da anotação, com o motivo pelo qual
  o handoff original concluiu o contrário.

## Suspected Area

O IIFE "slides nascem do roteiro.md" de
`templates/decks/mira-studio-full-demo/index-16x9.html`, linhas 702 a 825. A linha 793 é o
ponto exato: remove antes de saber se havia algo que valia preservar.

Área suspeita secundária, não confirmada: o `roteiro.md` deste formato carrega a animação
como texto declarativo (`linha:` / `orbita:`), um vocabulário fechado de duas famílias. O
`/mira-fast` produz animação em D3 arbitrária. Os dois modelos de animação podem ser
incompatíveis por construção, e não só mal integrados. O fix precisa decidir isso antes de
escolher a correção.

## Acceptance Criteria

1. Deck `mira-studio-full` gerado pelo `/mira-fast` exibe os slides da Fase 2, por
   `file://` e por HTTP.
2. Os palcos mantêm os ids `<slug_stage>-stage` e `<slug_stage>-svg` e as animações
   geradas tocam.
3. O `roteiro.md` continua governando texto da fala, layout e título, conforme
   `05-fase-3-montagem.md#r7-roteiromd-do-mira-studio-full-rf17`.
4. Deck `mira-studio-full` escrito à mão, sem ids de slug, com animação declarativa
   `linha:` ou `orbita:` no `roteiro.md`, continua funcionando como hoje.
5. O array `DEFAULT` de demonstração nunca substitui conteúdo real: sem `roteiro.md`, o
   deck mostra o que está no HTML.
6. Teste de regressão automatizado cobre 1, 4 e 5.

## Traceability

| Eixo | Referência |
|---|---|
| Spec | `04-fase-2-enxame.md#r6-contrato-de-saida-rigido`, `05-fase-3-montagem.md#r3-registro-de-triggers-rf10`, `05-fase-3-montagem.md#r7-roteiromd-do-mira-studio-full-rf17`, `03-fase-1-plano.md#r9-especificidade-por-formato` |
| Código afetado | `templates/decks/mira-studio-full-demo/index-16x9.html` (711-719, 780-793, 795-819, 820-824) |
| Código do outro lado | `agents/mira-fast/scripts/assemble-run.mjs` (124-142) |
| Causa raiz | não investigada; é do `/reversa-debugger-fix` |
| Testes de reprodução | nenhum |
| Testes de regressão | nenhum |

## Resolution

Em aberto.

## Agent Notes

- **O handoff original deu este formato como provavelmente seguro.** A conclusão veio de um
  `grep` num caminho que não existe: o arquivo não é `mira-studio-full-demo/index.html` e
  sim `mira-studio-full-demo/index-16x9.html`. O diretório contém apenas `index-16x9.html`
  e `roteiro.md`. Nenhuma correção foi aplicada a este formato, nem aqui nem na cópia
  instalada do usuário.
- **Não foi reproduzido em execução.** A classificação `deterministic` vem de leitura de
  código, não de deck rodando. O `/reversa-debugger-fix` deve reproduzir antes de
  diagnosticar, porque a severidade P0 depende disso.
- **Mecanismo diferente do BUG-20260731-JZNJ.** Lá é `montarSecao`/`palco` preservando a
  estrutura e trocando o palco, guardado por `if (!isHttp) return`. Aqui é remoção total
  sem guarda, com fallback para conteúdo de demonstração. Arquivos diferentes, correções
  provavelmente diferentes. Registrado como `related-to`, não `duplicate-of`.
- **O caminho ultrafast consome este template.**
  `agents/mira-ultrafast/scripts/build-skeleton.mjs` linha 102 aponta para
  `index-16x9.html` e não toca no builder.
- **Proposta de taxonomia:** `area: geracao-de-decks`, `module: templates-studio`,
  `feature: builder-roteiro`.
