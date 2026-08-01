---
schema_version: 1
id: BUG-20260731-JZNJ
display_number: 1
title: Builder do roteiro.md descarta o palco do slide e a animação nunca toca no mira-studio servido por HTTP
status: open
phase: triaging
severity: critical
priority: P1
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
  classification: environment-dependent
  rate: "não medido nesta sessão; relatado como praticamente 100% sob HTTP"
  suspected_triggers:
    - "deck servido por http:// ou https:// (mira-studio-server.cjs ou launcher)"
    - "existência de roteiro.md ao lado do index.html"
    - "dois ou mais slides de conteúdo animados"

blocking: []

relationships:
  - bug: BUG-20260731-OI56
    type: related-to
    state: proposed
    evidence: []

traceability:
  specs:
    - "_reversa_sdd/mira-fast/sdd/04-fase-2-enxame.md#r6-contrato-de-saida-rigido"
    - "_reversa_sdd/mira-fast/sdd/05-fase-3-montagem.md#r3-registro-de-triggers-rf10"
  affected_code:
    - "templates/decks/mira-studio-demo/index.html:432"
    - "templates/decks/mira-studio-demo/index.html:435-438"
    - "templates/decks/mira-studio-demo/index.html:439"
    - "templates/decks/mira-studio-demo/index.html:505-507"
    - "agents/mira-fast/scripts/assemble-run.mjs:84"
    - "agents/mira-fast/scripts/assemble-run.mjs:100-105"
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

# Builder do roteiro.md descarta o palco do slide e a animação nunca toca no mira-studio servido por HTTP

## Summary

O template canônico do formato `mira-studio` reconstrói todos os slides de conteúdo a
partir do `roteiro.md` quando o deck é servido por HTTP. A reconstrução cria um palco
novo com id genérico `sv-slide-N`, jogando fora o palco original com id derivado do
`slug_stage`. Como o registro de animações do `/mira-fast` procura os palcos por
`getElementById('<slug_stage>-stage')`, nenhum observer é registrado e nenhuma animação
de conteúdo toca. A falha é silenciosa: sem exceção, sem aviso no console, deck
aparentemente pronto.

O caminho `file://` não dispara a reconstrução, então o defeito só aparece no fluxo
recomendado para gravar com câmera, que é justamente o fluxo de produção do formato.

## Expected Behavior

`_reversa_sdd/mira-fast/sdd/04-fase-2-enxame.md#r6-contrato-de-saida-rigido` fixa o
contrato de saída de cada folha animada: o palco é `<div class="anim-stage"
id="<slug_stage>-stage">` contendo `<svg id="<slug_stage>-svg">`.

`_reversa_sdd/mira-fast/sdd/05-fase-3-montagem.md#r3-registro-de-triggers-rf10` fixa o
registro: o array de triggers é montado a partir do plano, com
`document.getElementById('<slug_stage>-stage')`, e o `.filter(s => s.stage)` existe para
absorver slide omitido por rejeição de fragmento.

Ou seja: o palco com id do slug precisa continuar no DOM depois que o runtime do formato
terminar de montar a tela. O `.filter` da spec cobre slide ausente por rejeição na
montagem, não palco apagado em tempo de execução.

## Actual Behavior

Servido por HTTP, o IIFE "ROTEIRO EXTERNO" de `templates/decks/mira-studio-demo/index.html`
lê o `roteiro.md`, monta seções novas e remove todas as antigas de uma vez:

- linha 432: `var estaticas = ... document.querySelectorAll('body > section')` captura
  todas as seções, sem filtro de seção fixa;
- linhas 435 a 438: `palco(n)` devolve sempre
  `<div class="anim-stage"><svg id="sv-slide-N" ...></svg></div>`, id genérico, e a `div`
  não recebe id nenhum;
- linha 439: `montarSecao(s, n)` chama `palco(n)` e nunca consulta a seção original;
- linhas 505 a 507: mapeia todas as seções novas e só então remove todas as originais.

Depois disso, `getElementById('<slug_stage>-stage')` devolve `null` para todos os slides.
Em `assemble-run.mjs` linhas 100 a 105, a guarda `if (stage && !observed.has(stage))`
simplesmente não registra o observer. Nenhuma animação roda e nada é reportado.

Agrava: `assemble-run.mjs` linhas 124 a 142 (`buildRoteiro`) grava `roteiro.md` também
para o formato `mira-studio` (linha 125). É a própria Fase 3 que arma o gatilho, porque
sem `roteiro.md` o `fetch` falharia e a reconstrução não aconteceria.

## Steps to Reproduce

1. Gerar um deck com `/mira-fast <fonte> /mira-studio` com pelo menos dois slides de
   conteúdo animados. Ver a nota de pré-requisito em Agent Notes.
2. Confirmar que `decks/<slug>/roteiro.md` foi gravado pela Fase 3.
3. Abrir o `index.html` por `file://`: as animações tocam.
4. Servir o mesmo deck pelo `mira-studio-server.cjs` ou pelo launcher e abrir por
   `http://localhost:<porta>`.
5. Percorrer os slides: nenhuma animação de conteúdo toca.
6. No DevTools, inspecionar as seções: os palcos estão como `sv-slide-N` e
   `document.getElementById('<slug_stage>-stage')` devolve `null`.

## Evidence

- `evidence/codigo-observado.md` — trechos exatos dos dois lados do contrato, com arquivo
  e linha, extraídos deste repositório no commit `558a406`.
- `../../intake/handoff-original-20260731.md` — relato bruto original, verbatim.
- `../../intake/relato-20260731-2105.md` — anotação da conferência feita no repo fonte.

## Suspected Area

O IIFE "ROTEIRO EXTERNO" de `templates/decks/mira-studio-demo/index.html`, em especial
`palco()` e `montarSecao()`. O defeito é de integração, não de um lado só: o template é
internamente coerente (a doc dele, linha 331, declara que a animação autoral se prende a
`sv-slide-N`) e o `/mira-fast` é internamente coerente (ids por slug). Quem quebra é a
combinação, quando a Fase 1 herda o runtime do template sem adaptá-lo ao contrato de ids.

Consequência para o fix: a decisão de projeto é quem cede. Ou o builder do roteiro passa
a preservar o palco existente, ou o `/mira-fast` passa a emitir palcos `sv-slide-N` nos
formatos Studio. As duas resolvem o sintoma e têm custos diferentes.

## Acceptance Criteria

1. Deck `mira-studio` gerado pelo `/mira-fast` com dois ou mais slides animados, servido
   por HTTP, toca a animação de todos os slides de conteúdo, não só do primeiro.
2. Depois do load por HTTP, cada seção de conteúdo mantém no DOM o palco com os ids
   `<slug_stage>-stage` e `<slug_stage>-svg`.
3. O `roteiro.md` continua sendo a fonte da verdade de texto, layout e título: editar o
   `roteiro.md` continua refletindo no deck.
4. Deck `mira-studio` escrito à mão, com animação autoral presa a `sv-slide-N` e sem ids
   de slug, continua funcionando por HTTP. Este é o uso que o template documenta hoje e
   não pode ser sacrificado pelo fix.
5. Teste de regressão automatizado cobre 1 e 4 juntos.

## Traceability

| Eixo | Referência |
|---|---|
| Spec | `04-fase-2-enxame.md#r6-contrato-de-saida-rigido`, `05-fase-3-montagem.md#r3-registro-de-triggers-rf10` |
| Código afetado | `templates/decks/mira-studio-demo/index.html` (432, 435-438, 439, 505-507) |
| Código do outro lado | `agents/mira-fast/scripts/assemble-run.mjs` (84, 100-105, 124-142) |
| Causa raiz | não investigada; é do `/reversa-debugger-fix` |
| Testes de reprodução | nenhum |
| Testes de regressão | nenhum |

## Resolution

Em aberto.

## Agent Notes

- **Pré-requisito de reprodução do zero.** Gerar um deck `mira-studio` novo pelo
  `/mira-fast` esbarra antes em BUG-20260731-OI56 (esqueleto sem marcadores `@MIRA:`), que
  derruba a Fase 3. Para reproduzir este bug isoladamente, use um deck já montado ou
  contorne o OI56 primeiro. Foi por isso que a relação `related-to` com o OI56 foi
  proposta.
- **O fix do handoff não foi aplicado neste repositório.** O handoff descreve uma correção
  que reaproveita `original.querySelector('.anim-stage')` e preserva `original.className`.
  Ela foi aplicada só na cópia instalada em `SLIDES/`. Aqui o código está intacto.
- **Uma premissa do handoff está errada.** Ele afirma que `estaticas` já usa o filtro
  `:not([data-mira-fixed])`. Neste repositório a linha 432 é `body > section` puro, sem
  filtro, e `data-mira-fixed` não aparece no arquivo. Quem for corrigir precisa conferir se
  o filtro deve ser introduzido junto.
- **O caminho ultrafast está igualmente exposto.** `agents/mira-ultrafast/scripts/build-skeleton.mjs`
  linha 101 monta o esqueleto `mira-studio` a partir deste mesmo template e não toca no
  builder do roteiro.
- **Proposta de taxonomia** (as listas de `taxonomy.yaml` estão vazias):
  `area: geracao-de-decks`, `module: templates-studio`, `feature: builder-roteiro`.
