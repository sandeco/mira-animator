---
schema_version: 1
id: BUG-20260801-ADQX
display_number: 14
title: Comentários-banner órfãos do template fazem o Salvar da reordenação embaralhar comentário em vez de slide, e num deck gerado o index.html sai com o marcador de fim duplicado
status: active
phase: delivering
severity: high
priority: P1
created: 2026-08-01
updated: 2026-08-01

origin:
  type: inspection
  external_ref: "reprodução do BUG-20260801-F74X"

area: unclassified
module: unclassified
feature: unclassified
labels:
  - corrompe-arquivo
  - descoberto-em-reproducao

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: "3/3 nos dois regimes: recusa (deck gerado de 3 slides) e corrupção (deck gerado de 4 slides)"
  confirmed_triggers:
    - "deck montado pelo pipeline (buildSkeleton + assembleRun), que preserva os comentários-banner do template"
    - "uso das setas de reordenação do modo E seguido de Salvar"
    - "o caminho do composeSource ser exercido, isto é, o deck NÃO estar em modo 'replace'"

blocking: []

relationships:
  - bug: BUG-20260801-F74X
    type: related-to
    state: confirmed
    evidence:
      - ref: "evidence/banners-vs-secoes.md"
        observation: >-
          descoberto durante a reprodução do F74X e bloqueava o critério de aceite dele
          (deck gerado): sem esta correção o Salvar recusava com "Nº de blocos no arquivo
          (4) ≠ nº de slides na tela (3)" e a reordenação não acontecia

traceability:
  specs:
    - "_reversa_sdd/mira-fast/sdd/05-fase-3-montagem.md#r1-validacao-estrutural-antes-de-concatenar-rf09"
    - "_reversa_sdd/addenda/bug-BUG-20260801-ADQX-v001.md#r1f-os-marcadores-de-montagem-sao-invariantes-para-a-autoria"
    - "_reversa_sdd/addenda/bug-BUG-20260801-ADQX-v001.md#r1g-o-que-conta-como-fronteira-de-slide-na-reordenacao"
    - "_reversa_sdd/addenda/bug-BUG-20260801-ADQX-v001.md#r1h-section-citado-em-comentario-nao-conta"
  affected_code:
    - "templates/authoring/mira-edit.js:298"
    - "templates/authoring/mira-edit.js:333-370"
  root_cause:
    state: confirmed
    hypothesis: >-
      o MARKER do mira-edit casa com os comentários-banner
      <!-- === SLIDE N · … === --> que o template traz para documentar os slides de
      demonstração. O esqueleto gerado preserva esses comentários, mas as seções reais são
      injetadas entre @MIRA:FAST:SLIDES:START e :END, ANTES deles. Os banners ficam órfãos,
      fora da região reordenável, e o reorderSource fatia o arquivo por eles porque a única
      condição para escolher esse caminho era marks.length >= 2.
    causal_path:
      - "buildSkeleton copia o template inteiro, banners inclusive"
      - "assembleRun injeta as <section> geradas entre SLIDES:START e SLIDES:END"
      - "os quatro banners do template sobram depois do bloco, sem slides correspondentes"
      - "no Salvar, reorderSource acha marks.length = 4 >= 2 e escolhe o caminho dos banners"
      - "a região reordenável termina em 14203 e três dos quatro banners começam depois disso"
      - "contagem divergente: recusa e a reordenação não acontece"
      - "contagem coincidente: reescreve embaralhando os banners, duplicando @MIRA:FAST:SLIDES:END"
    evidence:
      - ref: "evidence/banners-vs-secoes.md"
        observation: >-
          3 <section> contra 4 banners no mesmo arquivo, com os deslocamentos mostrando os
          banners 2, 3 e 4 fora da região reordenável; e o diff da corrupção com
          SLIDES:END indo de 1 para 2
    code_refs:
      - file: "templates/authoring/mira-edit.js"
        symbol: "MARKER / reorderSource"
        commit: "c7adeb2"
  reproduction_tests:
    - "test/mira-studio-builders.test.mjs::BUG-20260801-ADQX · reordenar num deck gerado não embaralha os banners órfãos"
    - "test/mira-studio-builders.test.mjs::BUG-20260801-ADQX · reordenar num deck gerado move a <section>, não o comentário"
  regression_tests:
    - "test/mira-studio-builders.test.mjs::BUG-20260801-ADQX · deck com banners coerentes continua reordenando por eles"

spec_verdict: spec-gap

change_set:
  - id: CHG-001
    kind: code
    artifact: "templates/authoring/mira-edit.js"
  - id: CHG-002
    kind: test
    artifact: "test/mira-studio-builders.test.mjs"
  - id: CHG-003
    kind: specification
    artifact: "_reversa_sdd/addenda/bug-BUG-20260801-ADQX-v001.md"

change_risk: baixa
addenda:
  - "_reversa_sdd/addenda/bug-BUG-20260801-ADQX-v001.md"

delivery:
  branch: agent/documentacao-completa-mira
  base_commit: c7adeb2
  committed: false
  pr: null
  merged: false
  published_version: null

closure:
  policy: package
  satisfied: false
resolution_kind: fixed
---

# Comentários-banner órfãos do template fazem o Salvar da reordenação embaralhar comentário em vez de slide

## Summary

O `mira-edit.js` reordena o arquivo-fonte fatiando-o pelos comentários-banner
`<!-- === SLIDE N · … === -->` sempre que encontra dois ou mais deles. Num deck **gerado**
pelo pipeline, esses comentários sobrevivem à montagem sem os slides que descreviam: as
seções reais são injetadas entre `@MIRA:FAST:SLIDES:START` e `:END`, e os banners do
template ficam órfãos depois do bloco.

Fatiar por eles reordena comentário em vez de slide. Dois desfechos, conforme os números
coincidam:

- **contagem divergente** (3 slides, 4 banners): o Salvar recusa e a reordenação não
  acontece. Seguro, mas o usuário não consegue reordenar um deck gerado.
- **contagem coincidente** (4 slides, 4 banners): passa da guarda, grava um toast verde
  "Salvo", os slides **não** se movem, e o `index.html` sai com `@MIRA:FAST:SLIDES:END`
  duplicado, quebrando o contrato de marcadores da Fase 3.

Descoberto durante a reprodução do BUG-20260801-F74X, cujo critério de aceite para deck
gerado ele bloqueava.

## Expected Behavior

`_reversa_sdd/mira-fast/sdd/05-fase-3-montagem.md#r1-validacao-estrutural-antes-de-concatenar-rf09`
trata os marcadores `@MIRA:FAST:SLIDES:*` como contrato estrutural do deck montado. Um
artefato de autoria não pode duplicá-los nem movê-los.

Não há spec dizendo o que é fronteira de slide para o `mira-edit`. O comportamento correto,
derivado do próprio código: um comentário-banner só é fronteira legítima se delimitar de
fato um slide, isto é, se fatiar por ele produzir blocos com exatamente uma `<section>`
cada. Não sendo o caso, o arquivo tem que ser fatiado pelos próprios `<section>`, que é o
que o `reorderBySections` já faz e o que o deck realmente tem.

## Actual Behavior

`templates/authoring/mira-edit.js:298` define

```js
var MARKER = /<!--\s*=*\s*SLIDE\b[\s\S]*?-->/gi;
```

e `reorderSource` (`:333`) escolhe o caminho dos banners com a única condição
`marks.length >= 2`. Não há nenhuma verificação de que os banners encontrados correspondam
aos slides.

Ver `evidence/banners-vs-secoes.md` para os deslocamentos medidos, os dois regimes e o diff
da corrupção.

## Steps to Reproduce

1. Gerar um deck `mira-studio` com o pipeline (`buildSkeleton` + `assembleRun`), com 4
   slides, servido por HTTP.
2. Conferir: o arquivo tem 4 `<section>` e 4 banners `<!-- === SLIDE N · … === -->`.
3. Entrar no modo E, subir um slide, Salvar. O toast diz "Salvo".
4. Conferir o `index.html` no disco: os palcos `<slug>-stage` estão na mesma ordem de antes,
   `@MIRA:FAST:SLIDES:END` aparece duas vezes e há dois banners a mais.
5. Repetir com um deck de 3 slides: o Salvar recusa com `Nº de blocos no arquivo (4) ≠ nº de
   slides na tela (3).`

## Evidence

- `evidence/banners-vs-secoes.md` — contagens, deslocamentos, os dois regimes, o diff da
  corrupção e a saída em navegador real.
- `../BUG-20260801-F74X-reorder-nao-leva-roteiro/evidence/reproduction.md` — a cápsula onde
  o defeito apareceu pela primeira vez.

## Acceptance Criteria

1. Deck gerado: reordenar e salvar move as `<section>` de verdade no arquivo.
2. Deck gerado: `@MIRA:FAST:SLIDES:START` e `:END` continuam aparecendo uma vez cada, e o
   número de banners não muda.
3. Deck escrito à mão, com banners coerentes: continua reordenando pelos banners, que
   acompanham o slide que descrevem. A correção não pode derrubar o caso bom.

## Traceability

| Eixo | Referência |
|---|---|
| Spec | `05-fase-3-montagem.md#r1-validacao-estrutural-antes-de-concatenar-rf09` (marcadores como contrato) |
| Código afetado | `templates/authoring/mira-edit.js` (298, 333-370) |
| Causa raiz | `confirmed` |
| Testes de reprodução | 2 casos em `test/mira-studio-builders.test.mjs` |
| Testes de regressão | 1 caso (deck com banners coerentes) |

## Resolution

Corrigido em 2026-08-01, no mesmo ciclo do BUG-20260801-F74X, que ele bloqueava. **Não
fechado**: closure policy `package` exige merge e versão publicada. Estado `active` /
`delivering`.

### Causa raiz (confirmed)

`reorderSource` escolhia o caminho dos comentários-banner com a única condição
`marks.length >= 2`, sem verificar se os banners encontrados correspondiam aos slides. Num
deck gerado eles são órfãos, fora da região reordenável.

### O que mudou ([CHG-001](fix/CHG-001.diff))

Uma guarda em `reorderSource`, para decks do padrão Mira (`kind === 'section'`): o caminho
dos banners só vale se cada bloco fatiado contiver **exatamente uma** `<section>`. Não
valendo, o arquivo é fatiado pelos próprios `<section>` (`reorderBySections`), que é o que o
deck realmente tem.

Contagem de banners não serve de critério: num deck gerado ela pode coincidir com o número
de slides por acaso, e aí a reordenação embaralha comentário com toast verde.

### Uma segunda passada foi necessária

A primeira versão da guarda contava `<section>` no texto cru e por isso incluía o
`<section>` **citado dentro de comentário** de documentação, que estes templates usam bastante.
Resultado: o deck escrito à mão era desviado para o `reorderBySections`, que tropeça no mesmo
problema e falhava com "Achei um `<section>` sem fechamento no arquivo". Três testes que
estavam verdes ficaram vermelhos e apontaram isso na hora.

Corrigido removendo os comentários antes de contar. É a mesma armadilha do
BUG-20260731-K4NR, agora num consumidor diferente.

### Veredito de spec: `spec-gap`

A `R1` da Fase 3 trata os marcadores como contrato **do lado do pipeline**. O que nunca foi
escrito é o que conta como fronteira de slide para uma ferramenta de **autoria**, nem que os
marcadores são invariantes que ela não pode tocar. Adendo aditivo em
`_reversa_sdd/addenda/bug-BUG-20260801-ADQX-v001.md`: R1f, R1g e R1h.

### Prova vermelho → verde

```
antes  ✖ reordenar num deck gerado não embaralha os banners órfãos
       ✖ reordenar num deck gerado move a <section>, não o comentário
       ✖ deck com banners coerentes continua reordenando por eles

depois ✔ os três
```

Suíte completa do projeto: **157 testes, 157 passando, 0 falhas.**

### O que continua aberto

- **O 16:9 está latente, não imune.** Ele registra `miraOrderSource` em `replace`, então o
  `composeSource` nunca é chamado para a ordem. Qualquer deck 16:9 sem o hook (sem
  `roteiro.md`, ou fora de HTTP) cai no mesmo caminho.
- **`reorderBySections` também não ignora comentários** ao contar `<section>`. A guarda
  evita mandar para lá os decks que sofreriam disso, mas a fragilidade continua no código.
- **O esqueleto continua carregando banners órfãos.** A correção é do lado do consumidor.
  Fazer o `buildSkeleton` não copiar os banners de demonstração seria o conserto na fonte, e
  é trabalho separado.

## Agent Notes

- **O 16:9 está latente, não imune.** O `mira-studio-full` registra `miraOrderSource` em
  modo `replace`, então o `composeSource` nunca é chamado para a ordem. Qualquer deck 16:9
  que perca o hook (sem `roteiro.md`, ou fora de HTTP) cai no mesmo caminho.
- **A guarda é conservadora de propósito.** Ela só desvia para o `reorderBySections` quando
  os banners comprovadamente não delimitam slides. Deck escrito à mão com banners corretos
  continua no caminho de sempre, e o comentário segue acompanhando o slide.
- **Proposta de taxonomia**: `area: autoria-de-decks`, `module: mira-edit`,
  `feature: reordenacao-de-slides`.
