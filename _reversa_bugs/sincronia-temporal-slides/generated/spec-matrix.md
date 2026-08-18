<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-08-18T15:11:00Z a partir de 4 bugs -->

# Matriz BUG ↔ SPEC · sincronia-temporal-slides

Spec efetiva = original + adendos vigentes.

| bug | seção de spec | veredito |
|---|---|---|
| T3RG | `templates/decks/mira-default/index.html#L288-L308` (código de referência) | spec-gap |
| T3RG | `agents/mira-sequence/references/exemplo-bola.html#L225-L245` | spec-gap |
| R7MC | `agents/mira-sequence/SKILL.md#L120` | spec-gap |
| R7MC | `agents/mira-sequence/SKILL.md#L134` | spec-gap |
| R7MC | `agents/mira-sequence/SKILL.md#L179` | spec-gap |
| S5CT | `agents/mira-sequence/SKILL.md#L138` | spec-gap, **em disputa** |
| S5CT | `agents/mira-sequence/SKILL.md#L146` | spec-gap, **em disputa** |
| V4LD | `agents/mira-validator/SKILL.md#L30` | spec-gap |

Todos `spec-gap`, e o motivo é estrutural: **este projeto não tem `architecture.md` nem
`domain.md` extraídos** em `_reversa_sdd/` (a `taxonomy.yaml` diz isso na primeira linha). Não
existe seção de spec que defina o comportamento temporal de um deck. O que existe é doutrina
escrita em dois lugares que não são spec:

1. **Código de referência**: o `reger` do `mira-default` e o `exemplo-bola.html` da
   `/mira-sequence`, ambos com comentário explicando o porquê.
2. **Skill**: `agents/mira-sequence/SKILL.md`, que é instrução para agente e funciona como
   contrato de fato.

Nenhum locator aponta para `_reversa_sdd/` porque inventar um envenenaria a rastreabilidade
que o registro existe para dar.

## O documento do autor não é spec efetiva

`intake/spec-sincronia-determinista-proposta.md` é **proposta normativa**. Não está em
`_reversa_sdd/`, não tem adendo e não passou por decisão registrada. Ele é evidência do
relato, e é a base do veredito que o `/reversa-debugger-fix` vai precisar arrancar do autor
em cada um dos quatro bugs.

## O único veredito em disputa

O S5CT é o caso incomum: **existe afirmação escrita, e o documento de origem diz que ela está
errada.** `agents/mira-sequence/SKILL.md:138` afirma que `'instant'` não herda o
`scroll-behavior` do CSS e que essa é a armadilha mais fácil da skill.

O sintoma do S5CT é real e o autor o reproduz. O que está em disputa não é o sintoma, é o
**mecanismo**. Há três candidatos no corpo do bug, e o `scroll-behavior` é o menos provável
dos três; o suspeito principal é o `scroll-snap-type: y proximity` do mesmo seletor `html`,
que reajusta a posição depois do salto instantâneo.

Isso cria um risco específico de rastreabilidade: **o remédio proposto pode funcionar sem que
a explicação esteja certa.** Se ele for aplicado sem medir, o registro vai guardar uma causa
raiz falsa, a decisão do `:138` vai ser revogada sem motivo, e o mecanismo real continua vivo
em todos os outros caminhos de navegação. Só vira `spec-desatualizada` com gravação quadro a
quadro, e a mudança sai por adendo, nunca editando o texto original em silêncio.

## Adendos gerados por bugs deste contexto

Nenhum. Nenhum bug foi corrigido ainda.
