---
schema_version: 1
id: BUG-20260731-JJ6X
display_number: 7
title: Re-montagem sobrescreve o roteiro.md editado pelo usuário sem aviso
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

relationships: []

traceability:
  specs:
    - "_reversa_sdd/mira-fast/sdd/05-fase-3-montagem.md#r7-roteiromd-do-mira-studio-full-rf17"
    - "_reversa_sdd/mira-fast/sdd/05-fase-3-montagem.md#r7b-a-pasta-de-trabalho-permanece"
  affected_code:
    - "agents/mira-fast/scripts/assemble-run.mjs:350-351"
    - "agents/mira-fast/scripts/assemble-run.mjs:124-142"
    - "_reversa_sdd/addenda/bug-BUG-20260731-JJ6X-v001.md#r7c-escrita-do-roteiromd"
  root_cause:
    state: confirmed
    hypothesis: >-
      A spec declarava o roteiro.md fonte da verdade do formato, mas nunca disse o que a
      re-montagem faz com um arquivo que já existe. Sem essa regra, a Fase 3 gravava
      incondicionalmente a partir do plano.
    causal_path:
      - "buildRoteiro(plan) monta o texto a partir de plan.slides[].fala, texto da Fase 1"
      - "writeFileSync(join(deckDir, 'roteiro.md'), roteiro) roda sem existsSync"
      - "não há comparação, backup nem entrada no montagem.log"
      - "a re-montagem devolve as falas do plano e apaga o que o usuário escreveu"
      - "o teleprompter grava o roteiro.md sozinho a cada 800 ms, então o trabalho destruído pode nunca ter passado por um editor"
    evidence:
      - ref: "evidence/execucao.md"
        observation: "1/1: edicao do usuario sobreviveu? false; voltou para a fala do plano? true"
      - ref: "fix/CHG-002.diff"
        observation: "montar, editar, montar de novo: a edição sobrevive byte a byte"
    code_refs:
      - file: "agents/mira-fast/scripts/assemble-run.mjs"
        symbol: "assembleRun"
        commit: "456b38b"
  reproduction_tests:
    - "test/mira-studio-contrato.test.mjs::BUG-20260731-JJ6X · re-montagem preserva o roteiro.md editado"
  regression_tests:
    - "test/mira-studio-contrato.test.mjs::BUG-20260731-JJ6X · re-montagem preserva o roteiro.md editado"
    - "test/mira-studio-contrato.test.mjs::BUG-20260731-JJ6X · a primeira montagem semeia o roteiro e registra no log"

spec_verdict: spec-gap

change_set:
  - id: CHG-001
    kind: code
    artifact: "agents/mira-fast/scripts/assemble-run.mjs"
  - id: CHG-002
    kind: test
    artifact: "test/mira-studio-contrato.test.mjs"
  - id: CHG-003
    kind: specification
    artifact: "_reversa_sdd/addenda/bug-BUG-20260731-JJ6X-v001.md"

change_risk: baixa
addenda:
  - "_reversa_sdd/addenda/bug-BUG-20260731-JJ6X-v001.md"

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

Corrigido em 2026-08-01. **Não fechado**: closure policy `package`, exige merge e versão
publicada. Estado atual `active` / `delivering`.

### A decisão de projeto que precedia a correção

O registro colocava a pergunta certa: semear só na ausência, ou reconciliar plano e arquivo?
E registrava o custo dos dois lados: "nunca sobrescrever" pode deixar roteiro antigo com
fragmentos novos.

**Escolhida: semear só na ausência.** O motivo é o próprio `05#R7`: o `roteiro.md` é declarado
fonte da verdade do formato e feito para o usuário abrir no editor dele. Reconciliar exigiria a
montagem decidir, fala a fala, quem está mais certo, o plano da Fase 1 ou o texto que o usuário
escreveu depois. Não existe critério honesto para isso. Quem reconcilia é o usuário, editando o
arquivo.

O custo é aceito e está escrito no adendo: uma re-montagem pode deixar roteiro e HTML fora de
sincronia. O log diz que preservou; conferir é do usuário. Sincronizar sozinho seria voltar a
decidir por ele, que é exatamente o defeito.

### Causa raiz (confirmed)

`assemble-run.mjs:350-351` gravava sem `existsSync`, sem comparação, sem backup e sem linha no
log. O agravante que o registro apontava se confirma: o deck grava o `roteiro.md` sozinho a
cada 800 ms enquanto o usuário digita no teleprompter, então o trabalho destruído podia nunca
ter passado por um editor de texto.

### O que mudou

| situação | antes | depois | linha no log |
|---|---|---|---|
| arquivo não existe | grava | grava | `roteiro.md: criado a partir do plano` |
| arquivo já existe | **sobrescreve em silêncio** | **não toca** | `roteiro.md: preservado (já existia; a montagem não sobrescreve)` |
| formato sem roteiro | nada, sem rastro | nada | `roteiro.md: não se aplica a este formato` |

Critério de aceite 3 atendido: toda escrita **e toda omissão** aparece no `montagem.log`. Antes
nem a escrita aparecia.

### Veredito de spec: `spec-gap`

`05#R7` declara o que o arquivo é; `R7b` mostra o cuidado do resto da montagem com o que já
está no deck. O que a re-montagem faz com um `roteiro.md` existente nunca foi escrito. Adendo
aditivo gerado, spec original intocada:

`_reversa_sdd/addenda/bug-BUG-20260731-JJ6X-v001.md` — R7c, com a tabela das três situações, o
porquê de semear e não reconciliar, e o custo aceito.

### Change set

| CHG | tipo | artefato | propósito |
|---|---|---|---|
| CHG-001 | `code` | `agents/mira-fast/scripts/assemble-run.mjs` | semeia só na ausência; status no `montagem.log` ([diff](fix/CHG-001.diff)) |
| CHG-002 | `test` | `test/mira-studio-contrato.test.mjs` | edição sobrevive à re-montagem; primeira montagem semeia e registra ([diff](fix/CHG-002.diff)) |
| CHG-003 | `specification` | `_reversa_sdd/addenda/bug-BUG-20260731-JJ6X-v001.md` | adendo aditivo |

Plano da correção: [fix/plan.html](fix/plan.html).

### Prova vermelho → verde

```
antes  ✖ re-montagem preserva o roteiro.md editado
       ✖ a primeira montagem semeia o roteiro e registra no log

depois ✔ os dois
```

O determinismo da montagem não mudou: o `roteiro.md` nunca entrou no hash da saída, e o teste
`montagem determinística` continua comparando dois runs byte a byte.

### Herança

O `/mira-ultrafast` delega para o mesmo `assembleRun` e herda a correção, como as Agent Notes
anteciparam.

## Agent Notes

- Achado do pente-fino de 2026-07-31. Relatório em
  `../../inspections/2026-07-31-decks-studio/report.md`.
- **O `/mira-ultrafast` herda.** `agents/mira-ultrafast/scripts/assemble-run.mjs` delega para
  `assembleBaseline`, então o comportamento é idêntico.
- **Não confundir com o BUG-20260731-S3TX.** Lá o `roteiro.md` destrói os slides; aqui a
  montagem destrói o `roteiro.md`. Direções opostas, arquivos diferentes.
- **Proposta de taxonomia:** `area: geracao-de-decks`, `module: mira-fast`,
  `feature: roteiro-md`.
