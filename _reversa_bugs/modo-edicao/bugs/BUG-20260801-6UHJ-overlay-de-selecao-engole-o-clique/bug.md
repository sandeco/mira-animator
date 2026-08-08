---
schema_version: 1
id: BUG-20260801-6UHJ
display_number: 15
title: O overlay de seleção engole o clique e nunca desseleciona, travando a edição até o F5
status: open
phase: diagnosing
severity: high
priority: P1
created: 2026-08-01
updated: 2026-08-01

origin:
  type: manual-report
  external_ref: null

area: unclassified
module: unclassified
feature: unclassified
labels: [modo-edicao, mira-edit-free, usabilidade]

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: "10/10"
  suspected_triggers: []

blocking: []

relationships: []

traceability:
  specs:
    - "_reversa_sdd/mira-edit-livre/sdd/selecao-de-elemento.md#rf-04"
    - "_reversa_sdd/mira-edit-livre/sdd/selecao-de-elemento.md#rf-05"
  affected_code:
    - "templates/authoring/mira-edit-free.js"
  root_cause:
    state: confirmed
    hypothesis: >-
      A superficie de arraste da moldura (#mef-overlay .mef-body, inset:0,
      pointer-events:auto) captura o pointerdown de tudo que esta na caixa do
      elemento selecionado, e onDocDown sai em isChrome antes de qualquer
      select(), entao a selecao nunca troca nem e limpa.
    causal_path:
      - "CSS cria superficie que captura ponteiro sobre a caixa inteira do selecionado"
      - "pointerdown chega em DIV.mef-body, nunca no elemento de conteudo"
      - "onDocDown classifica o alvo como chrome e retorna antes de select()"
      - "onOverlayDown assume o gesto e so sabe arrastar o elemento antigo"
    evidence:
      - ref: evidence/reproduction.md
        observation: "elementFromPoint no centro do alvo devolve DIV.mef-body; 10/10"
      - ref: evidence/experimento-causal.md
        observation: "neutralizando so o .mef-body, o clique chega ao SPAN.accent e a selecao troca; elo necessario e suficiente"
    code_refs:
      - file: templates/authoring/mira-edit-free.js
        symbol: onDocDown
        commit: 7d66ae70fbc1764ec29de28cf1d27a190a94f981
      - file: templates/authoring/mira-edit-free.js
        symbol: injectStyles (regra #mef-overlay .mef-body)
        commit: 7d66ae70fbc1764ec29de28cf1d27a190a94f981
  reproduction_tests: []
  regression_tests: []

spec_verdict: null

change_set: []

change_risk:
  classification: media
  reasons:
    - "alcance amplo: todo deck do Mira usa o modo E"
    - "codigo estreito: a mudanca vive dentro de um handler"
    - "sem contrato externo, sem dados, sem concorrencia"
    - "reversivel: diff pequeno, sem migracao"
    - "risco real: calibracao do limiar de 4px entre clique e arraste"

closure:
  policy: package
  satisfied: false
resolution_kind: null
---

# O overlay de seleção engole o clique e nunca desseleciona, travando a edição até o F5

## Summary

No modo de edição (tecla E), o overlay do elemento selecionado cobre a área desse elemento com um
`div` que captura ponteiro (`#mef-overlay .mef-body`, `inset:0`, `pointer-events:auto`). O
manipulador global `onDocDown` descarta qualquer clique que caia em chrome antes de tocar na
seleção, então clicar no overlay nunca troca nem limpa a seleção. Consequência prática: enquanto um
elemento está selecionado, tudo que está debaixo da moldura dele fica inalcançável por clique, e o
gesto vira um arraste do elemento antigo. O autor percebe isso como "depois que eu mexo num
elemento e salvo, não consigo mais editar", e recorre ao F5.

O relator associa o travamento ao ato de salvar. O ato de salvar não foi reproduzido como causa
(ver Open Questions em Agent Notes); o que se reproduz é o estado em que ele fica depois de salvar:
o elemento continua selecionado, com a moldura parada por cima do resto do conteúdo.

## Expected Behavior

Spec efetiva `_reversa_sdd/mira-edit-livre/sdd/selecao-de-elemento.md`:

- **RF-04 (Must)**: "O sistema deve manter no máximo um elemento selecionado por vez, trocando a
  seleção ao clicar em outro elemento." Critério de aceite: "Clicar num segundo elemento remove o
  contorno do primeiro e o aplica ao segundo."
- **RF-05 (Must)**: "O usuário deve poder limpar a seleção clicando numa área vazia do slide ou
  pressionando Esc."

Ou seja: clicar num segundo elemento troca a seleção, mesmo que esse segundo elemento esteja dentro
ou debaixo da caixa do primeiro.

## Actual Behavior

Com um elemento selecionado, um clique cuja coordenada cai dentro da moldura:

1. atinge `#mef-overlay .mef-body`, não o elemento de conteúdo;
2. `onDocDown` (capture, `document`) roda, cai em `if (isChrome(e.target)) return;` e sai sem
   chamar `select()`: a seleção não troca nem é limpa;
3. `onOverlayDown` roda em seguida e inicia um arraste **do elemento antigo**.

Resultado visível: a moldura não sai do lugar e o elemento que o autor queria editar não é
selecionado nem alterado. Quando ele insiste, o gesto move de novo o elemento anterior.

Elementos aninhados são o caso pior: com o `<h1>` selecionado, o `<span class="accent">` que mora
dentro dele fica **permanentemente** inalcançável, porque a moldura do pai cobre o filho inteiro.

Saídas existentes, nenhuma óbvia: clicar numa área realmente vazia, ou Esc. E Esc é armadilha:
quando não há nada selecionado, `mira-edit.js` trata Esc como "sair do modo de edição" e fecha o
modo E inteiro.

## Steps to Reproduce

Ambiente confirmado: deck servido por `node lib/mira-serve.js`, Chrome (Puppeteer 1366x768).

1. Servir um deck: `node lib/mira-serve.js decks/teste-mira-default 5200`
2. Abrir `http://127.0.0.1:5200/index.html` e pressionar `E`
3. Clicar no `<h1>` da capa: ele é selecionado, moldura laranja aparece
4. Clicar no `<span class="accent">` que está **dentro** desse `<h1>`
5. Observado: a seleção não troca. `document.elementFromPoint` no centro do span devolve
   `DIV.mef-body`. Repetível 10/10.
6. Variante com o mesmo efeito: arrastar o `<h1>` para cima de um `<p>` vizinho e depois tentar
   clicar nesse `<p>`.

Script: `evidence/repro-overlay.mjs` (`node repro-overlay.mjs`).

## Evidence

- `evidence/overlay-engole-clique.png`: `.mef-body` pintado de vermelho translúcido cobrindo o
  `<span>` tracejado, que não pode ser clicado
- `evidence/repro-overlay.mjs`: reprodução dirigida, imprime `quemRecebeuOClique`
- `evidence/repro-varredura.mjs` + `evidence/saida-varredura.txt`: varredura em 5 decks
  (`demo-tecnica`, `pitch-projeto`, `mira-studio-demo`, `mira-studio-full-demo`,
  `teste-mira-default`): a rodada 2 falha em selecionar sempre que o alvo cai debaixo da moldura
  deixada pela rodada 1
- `evidence/repro-ciclo-salvar.mjs`: ciclo `mover → salvar → redimensionar → salvar → recortar →
  salvar → outro elemento → salvar`, que **não** falhou; é a evidência negativa que separa este bug
  do ato de salvar
- `evidence/trecho-onDocDown.md`: o código exato

## Suspected Area

`templates/authoring/mira-edit-free.js`, dois pontos:

1. `onDocDown`, a linha `if (isChrome(e.target)) return;`: sai antes de qualquer `select()`.
   O comentário no código diz "clique no overlay/barra: tratado à parte", mas o tratamento à parte
   (`onOverlayDown`) só sabe arrastar, nunca reselecionar.
2. O CSS `#mef-overlay .mef-body{position:absolute;inset:0;pointer-events:auto;cursor:move}`: a
   área de arraste é a caixa inteira do elemento, então não sobra nenhum pixel do próprio elemento
   (nem dos filhos dele) para receber clique.

Direção plausível para o fix (do registrador, não decidida): no `pointerdown` sobre o `.mef-body`,
usar `document.elementsFromPoint` para descobrir o que está embaixo e, se for um editável
**diferente** do selecionado, trocar a seleção em vez de arrastar. Alternativa mais barata: restringir
a zona de arraste (só borda/handles, ou exigir um segundo clique no já selecionado para arrastar).
Qualquer uma precisa preservar o gesto de mover o elemento já selecionado, que é o caso comum.

## Acceptance Criteria

1. Com o `<h1>` selecionado, clicar no `<span>` que está dentro dele passa a selecionar o `<span>`
   (RF-04), em 10/10 tentativas
2. Arrastar o elemento **já selecionado** pelo corpo da moldura continua movendo esse elemento
3. Clicar em área vazia continua limpando a seleção (RF-05)
4. O ciclo editar → salvar → editar outro elemento → salvar completa sem F5 em pelo menos 3 rodadas
   seguidas, nos templates `mira-studio-demo` e `mira-studio-full-demo`
5. Teste de regressão automatizado cobrindo os itens 1 e 2

## Traceability

| Eixo | Valor |
|---|---|
| Spec | `_reversa_sdd/mira-edit-livre/sdd/selecao-de-elemento.md#rf-04` e `#rf-05` |
| Código afetado | `templates/authoring/mira-edit-free.js` (`onDocDown`, `onOverlayDown`, `injectStyles`) |
| Root cause | não confirmada (é do `/reversa-debugger-fix`) |
| Testes de reprodução | nenhum ainda |
| Testes de regressão | nenhum ainda |

Observação de propagação: a fonte canônica é `templates/authoring/mira-edit-free.js`, mas o arquivo
está copiado em ~50 decks sob `decks/`, `examples/` e `tests/`. Corrigir só o template não conserta
os decks já instalados; a `closure_policy: package` deste registro exige a versão publicada, e o
`npx mira-animator edit <deck>` é o caminho de propagação.

## Agent Notes

**Open question herdada, não resolvida por este registro.** O relator liga o travamento ao salvar, e
esse mesmo relato já apareceu antes, em `_reversa_sdd/edit-stuck-fix/MENSAGEM-PARA-CODEX.md`
("edito um elemento, salvo e o modo de edição trava... tenho que dar F5"). Naquela vez a causa foi
outra: `textCtx` e `body.mef-text-editing` presos quando o `blur` não chegava, com o CSS
`display:none!important` escondendo a moldura. A correção de auto-cura daquele ciclo **está
presente** em todos os `mira-edit-free.js` do repositório (`commitActiveTextEdit` verificado em
50/50 cópias), e o relato de agora é sobre `http://127.0.0.1` (launcher), não sobre `file://`, que
era o ambiente do diálogo que roubava o foco.

Logo depois do registro, o relator observou que "agora parece estar funcionando", sem que nenhuma
linha de código tivesse mudado (a sessão só escreveu em `_reversa_bugs/` e no espelho de
rastreabilidade). Isso reforça que o sintoma **dele** pode ser intermitente, com gatilho não
isolado, enquanto o defeito descrito neste bug segue determinístico e reconferido em 10/10 depois
dessa observação.

Portanto: ou o defeito de agora é só este bug visto pelo ângulo do usuário, ou existe um segundo
mecanismo específico do salvar que a reprodução não pegou. Antes de fechar como resolvido, quem
corrigir deve confirmar com o relator que o F5 deixou de ser necessário no deck real dele. O que
NÃO foi reproduzido, e por isso não virou bug separado:

- salvar deixando o botão Salvar apagado nas edições seguintes (5 decks, 3+ rodadas cada: reativou
  sempre, com a contagem subindo)
- salvar impedindo que o arraste altere um elemento recém-selecionado fora da moldura anterior

**Armadilha adjacente, deliberadamente não registrada como bug separado** (é comportamento
intencional do `mira-edit.js`, só vira problema junto com este bug): com nada selecionado, Esc
fecha o modo E. Quem tenta usar Esc para escapar do overlay preso acaba saindo da edição. Se o fix
mudar a semântica do Esc, precisa de veredito de spec.

**Proposta de taxonomia** (`taxonomy.yaml` está com as listas vazias, por isso este bug ficou
`unclassified`):

```yaml
area: [autoria]
module: [modo-edicao]
feature: [selecao-de-elemento, transform-direto, persistencia-de-edicao]
```
