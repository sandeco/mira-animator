---
schema_version: 1
id: BUG-20260731-JJ6X
display_number: 7
title: Re-montagem sobrescreve o roteiro.md editado pelo usuário sem aviso
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

relationships: []

traceability:
  specs:
    - "_reversa_sdd/mira-fast/sdd/05-fase-3-montagem.md#r7-roteiromd-do-mira-studio-full-rf17"
    - "_reversa_sdd/mira-fast/sdd/05-fase-3-montagem.md#r7b-a-pasta-de-trabalho-permanece"
  affected_code:
    - "agents/mira-fast/scripts/assemble-run.mjs:350-351"
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

# Re-montagem sobrescreve o roteiro.md editado pelo usuário sem aviso

## Summary

A Fase 3 grava `roteiro.md` incondicionalmente a partir do plano, sem checar se o arquivo já
existe nem se mudou. Rodar a montagem de novo num deck existente apaga tudo que o usuário
escreveu no roteiro e devolve as falas que a Fase 1 planejou.

Re-montar é operação normal: corrigir um fragmento e rodar a Fase 3 outra vez. E o
`roteiro.md` é, por decisão de projeto, o arquivo que o usuário abre no editor dele e que o
deck sincroniza ao vivo. É o pior arquivo do deck para se sobrescrever em silêncio.

## Expected Behavior

`_reversa_sdd/mira-fast/sdd/05-fase-3-montagem.md#r7-roteiromd-do-mira-studio-full-rf17`
declara o `roteiro.md` "a fonte da verdade daquele formato" e "feito para o usuário abrir no
editor dele". O `CLAUDE.md` do projeto repete: `roteiro.md` na raiz do deck é "fonte da
verdade do roteiro, feito para o usuário abrir no editor dele".

`R7b` mostra o cuidado que o resto da montagem tem com o que já está no deck: a pasta
`mira/fast/` "nunca é apagada", e `assemble-run.mjs:304-307` chega a abortar se
`references/` sumiu.

Conteúdo escrito pelo usuário não pode ser destruído por uma re-execução, ou a montagem
precisa avisar antes.

## Actual Behavior

`agents/mira-fast/scripts/assemble-run.mjs`:

```js
const roteiro = buildRoteiro(plan);                                    // 350
if (roteiro !== null) writeFileSync(join(deckDir, 'roteiro.md'), roteiro, 'utf8');  // 351
```

Sem `existsSync`, sem comparação, sem backup, sem entrada no `montagem.log`. O conteúdo vem
de `buildRoteiro` (linhas 124-142), montado a partir de `plan.slides[].fala`, que é o texto
da Fase 1.

Reproduzido nesta varredura: editei uma fala no `roteiro.md` de um deck já montado e rodei a
Fase 3 de novo.

```
edicao do usuario sobreviveu? false
voltou para a fala do plano?  true
```

Agravantes:

- O `montagem.log` não registra a escrita do `roteiro.md`, então nem o rastro fica.
- O deck grava o `roteiro.md` sozinho enquanto o usuário digita no teleprompter
  (debounce de 800 ms, `templates/decks/mira-studio-demo/index.html:961-963`). O trabalho
  destruído pode nunca ter passado por um editor de texto.
- Vale para `mira-studio` **e** `mira-studio-full` (`buildRoteiro` linha 125).

## Steps to Reproduce

1. Montar um deck `mira-studio` pelo `/mira-fast`.
2. Editar qualquer fala em `<deck>/roteiro.md`, no editor ou pelo teleprompter do deck.
3. Rodar `node agents/mira-fast/scripts/assemble-run.mjs "<deck>"` de novo.
4. Ler o `roteiro.md`: a edição sumiu, a fala do plano voltou.

## Evidence

- `evidence/execucao.md` — script da reprodução e saída.

## Suspected Area

`assemble-run.mjs:350-351`. A decisão de projeto que precede a correção: a Fase 3 deve
semear o `roteiro.md` só quando ele não existe, ou deve reconciliar plano e arquivo? Uma
re-montagem com fragmentos novos e roteiro antigo pode ficar fora de sincronia, então
"nunca sobrescrever" também tem custo. Registrar a escolha como veredito de spec.

## Acceptance Criteria

1. Re-montar um deck existente não destrói o `roteiro.md` editado.
2. A regra escolhida (semear só na ausência, ou reconciliar, ou pedir confirmação) fica
   escrita na spec efetiva.
3. Toda escrita ou omissão de escrita do `roteiro.md` aparece no `montagem.log`, conforme a
   proibição de silenciar (RNF06).
4. Teste de regressão: montar, editar o roteiro, montar de novo, verificar que a edição
   sobreviveu.

## Traceability

| Eixo | Referência |
|---|---|
| Spec | `05-fase-3-montagem.md#r7-roteiromd-do-mira-studio-full-rf17`, `#r7b-a-pasta-de-trabalho-permanece` |
| Diretiva | `CLAUDE.md`, estrutura de pastas de um deck |
| Código afetado | `agents/mira-fast/scripts/assemble-run.mjs` (350-351, 124-142) |
| Testes | nenhum |

## Resolution

Em aberto.

## Agent Notes

- Achado do pente-fino de 2026-07-31. Relatório em
  `../../inspections/2026-07-31-decks-studio/report.md`.
- **O `/mira-ultrafast` herda.** `agents/mira-ultrafast/scripts/assemble-run.mjs` delega para
  `assembleBaseline`, então o comportamento é idêntico.
- **Não confundir com o BUG-20260731-S3TX.** Lá o `roteiro.md` destrói os slides; aqui a
  montagem destrói o `roteiro.md`. Direções opostas, arquivos diferentes.
- **Proposta de taxonomia:** `area: geracao-de-decks`, `module: mira-fast`,
  `feature: roteiro-md`.
