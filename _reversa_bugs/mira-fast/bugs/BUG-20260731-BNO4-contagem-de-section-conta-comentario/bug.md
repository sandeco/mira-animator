---
schema_version: 1
id: BUG-20260731-BNO4
display_number: 9
title: Folha aprovada pelo validate-run derruba a montagem porque a contagem final conta section citado em comentário
status: active
phase: delivering
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
  rate: "3/3 antes da correção, 0/3 depois (cápsula compartilhada com K4NR)"
  suspected_triggers: []

blocking: []

relationships:
  - bug: BUG-20260731-K4NR
    type: related-to
    state: supported
    evidence:
      - ref: "evidence/reproduction.md"
        observation: >-
          o mesmo deck reproduz os dois defeitos, e a mesma função (countSections) corrige
          os dois. Causa raiz idêntica, confirmada por execução.
  - bug: BUG-20260731-ETPU
    type: related-to
    state: supported
    evidence:
      - ref: "evidence/execucao.md"
        observation: >-
          a falha deste bug é o que expõe a instalação parcial do ETPU: quando a contagem
          derruba a montagem, módulos, launcher e vendor já foram copiados para o deck.

traceability:
  specs:
    - "_reversa_sdd/mira-fast/sdd/05-fase-3-montagem.md#r1-validacao-estrutural-antes-de-concatenar-rf09"
    - "_reversa_sdd/mira-fast/sdd/04-fase-2-enxame.md#r6-contrato-de-saida-rigido"
    - "_reversa_sdd/mira-fast/sdd/04-fase-2-enxame.md#r9-ondas-e-falhas"
    - "_reversa_sdd/addenda/bug-BUG-20260731-K4NR-v001.md#r1e-o-acordo-entre-validador-e-montagem"
  affected_code:
    - "agents/mira-fast/scripts/assemble-run.mjs:339-342"
    - "agents/mira-fast/scripts/validate-run.mjs:131-133"
  root_cause:
    state: confirmed
    hypothesis: >-
      A mesma causa raiz do BUG-20260731-K4NR: nenhuma função separa marcação de prosa, e a
      contagem final roda sobre a saída inteira, que inclui o CSS e o JavaScript vindos das
      folhas. O validador da folha conta só até o marcador de CSS, então os dois lados
      discordam sobre o mesmo fragmento.
    causal_path:
      - "a folha escreve um comentário legítimo citando <section> no bloco js"
      - "validate-run conta section apenas em htmlBlock e aprova a folha com zero erros"
      - "a folha grava result-NN.json com ok true, de boa-fé"
      - "assemble-run conta section na saída inteira, que já contém o js da folha"
      - "a contagem passa do esperado e a montagem morre, sem apontar a folha culpada"
    evidence:
      - ref: "evidence/reproduction.md"
        observation: "validate-run aprova com [] e a montagem falha com 'saída possui 3 section(s), esperado 2', 3/3"
      - ref: "fix/CHG-003.diff"
        observation: "a contagem passa a usar countSections e a mensagem passa a apontar o fragmento"
    code_refs:
      - file: "agents/mira-fast/scripts/assemble-run.mjs"
        symbol: "assembleRun"
        commit: "558a406"
  reproduction_tests:
    - "test/mira-fast-section-count.test.mjs::BNO4: comentário no JS da folha não infla a contagem final"
    - "test/mira-fast-section-count.test.mjs::BNO4: comentário HTML no fragmento não desbalanceia a contagem do fragmento"
    - "_reversa_bugs/mira-fast/bugs/BUG-20260731-K4NR-validador-section-em-comentario/evidence/reproduce.mjs"
  regression_tests:
    - "test/mira-fast-section-count.test.mjs::regressão: fragmento com duas sections reais continua reprovando"
    - "test/mira-fast-section-count.test.mjs::regressão: countSections conta elemento e ignora prosa"
    - "test/mira-fast-section-count.test.mjs::regressão: section REAL fora do slot continua reprovando o esqueleto"

spec_verdict: spec-correta

change_risk:
  classification: baixa
  reasons:
    - "mesma correção do BUG-20260731-K4NR, nos mesmos dois arquivos"
    - "sem contrato externo, sem dados, sem concorrência"
    - "reversível pelo diff"

change_set:
  - id: CHG-001
    kind: test
    artifact: test/mira-fast-section-count.test.mjs
    purpose: testes de reprodução e regressão compartilhados com o K4NR
    diff: fix/CHG-001.diff
  - id: CHG-002
    kind: code
    artifact: agents/mira-fast/scripts/validate-run.mjs
    purpose: a contagem do fragmento passa a usar countSections e countClosingSections
    diff: fix/CHG-002.diff
  - id: CHG-003
    kind: code
    artifact: agents/mira-fast/scripts/assemble-run.mjs
    purpose: a contagem da saída passa a usar countSections e o erro passa a apontar o fragmento culpado
    diff: fix/CHG-003.diff

delivery:
  branch: agent/documentacao-completa-mira
  base_commit: 558a406
  committed: false
  pr: null
  merged: false
  published_version: null

closure:
  policy: package
  satisfied: false
resolution_kind: fixed
---

# Folha aprovada pelo validate-run derruba a montagem porque a contagem final conta section citado em comentário

## Summary

A checagem final da montagem conta `<section` na saída inteira com uma regex sobre texto
cru, incluindo o CSS e o JavaScript que vieram das folhas. Uma folha que apenas **comente**
a estrutura que desenha, escrevendo `<section>` no comentário, infla a contagem e derruba a
Fase 3 inteira.

O pior é a ordem: a folha roda o validador que o contrato manda rodar, recebe aprovação com
zero erros, grava `ok: true`, e a montagem morre depois com uma mensagem que não aponta para
ela. A folha não tem como saber que é a culpada.

## Expected Behavior

`_reversa_sdd/mira-fast/sdd/05-fase-3-montagem.md#r1-validacao-estrutural-antes-de-concatenar-rf09`
coloca a validação estrutural **antes** de concatenar, e a checagem V8 é balanceamento de
`<section>` no fragmento. A intenção da contagem final é confirmar que saiu um slide por
entrada do plano.

`_reversa_sdd/mira-fast/sdd/04-fase-2-enxame.md#r9-ondas-e-falhas` define o ciclo da folha:
validar, gravar status, e uma segunda tentativa quando falha. Fragmento aprovado pelo
validador não pode derrubar a montagem depois.

Contagem de elemento deve contar elemento, não texto que menciona a palavra.

## Actual Behavior

`agents/mira-fast/scripts/assemble-run.mjs:339-342`:

```js
const sectionCount = (output.match(/<section\b/gi) ?? []).length;
if (sectionCount !== plan.slides.length) {
  throw new Error(`saída possui ${sectionCount} section(s), esperado ${plan.slides.length}`);
}
```

`output` já contém o CSS e o JS gerados a partir das folhas.

`validate-run.mjs:131-133` conta `<section` apenas em `htmlBlock`, ou seja, só até o marcador
de CSS. Comentário dentro do bloco `js` não é olhado por ninguém até a montagem.

Reproduzido nesta varredura. Acrescentei ao JS da folha 3 um comentário legítimo:

```js
// o palco vive dentro da <section> data-layout=split
```

Resultado:

```
validate-run --slide 3 aprova o fragmento? true []
assemble FALHOU: saída possui 5 section(s), esperado 4
```

A montagem já tinha instalado os módulos quando morreu; ver BUG-20260731-ETPU.

## Steps to Reproduce

1. Num deck `mira-fast` pronto para a Fase 3, acrescentar ao bloco `js` de uma folha um
   comentário contendo `<section>`.
2. `node agents/mira-fast/scripts/validate-run.mjs "<deck>" --slide N` → `ok: true`, sem
   erros.
3. `node agents/mira-fast/scripts/assemble-run.mjs "<deck>"` → falha com
   `saída possui N+1 section(s), esperado N`.

## Evidence

- `evidence/execucao.md` — script da reprodução, saída dos dois comandos.

## Suspected Area

`assemble-run.mjs:339-342`. Mesma raiz do BUG-20260731-K4NR, que trata da checagem irmã em
`validateSkeleton` (linha 233): as duas confundem tag com texto. São bugs distintos porque
o gatilho, o caminho e o sintoma diferem: lá é comentário do esqueleto e a falha vem antes
de qualquer trabalho; aqui é comentário da folha, o validador aprova antes e a falha vem no
fim.

Área secundária: a assimetria entre `validate-run` (conta em `htmlBlock`) e `assemble-run`
(conta na saída inteira). Mesmo depois de corrigida a regex, os dois deveriam usar o mesmo
critério, senão o desacordo volta com outro gatilho.

## Acceptance Criteria

1. Folha cujo CSS ou JS mencione `<section>` em comentário ou string monta sem erro.
2. Saída com número de `<section>` real diferente do plano continua sendo rejeitada.
3. `validate-run` e `assemble-run` usam o mesmo critério de contagem, num único ponto.
4. Quando a contagem falhar, a mensagem diz qual slide contribuiu com o excesso.
5. Teste de regressão com os dois casos: comentário (passa) e section real a mais (reprova).

## Traceability

| Eixo | Referência |
|---|---|
| Spec | `05-fase-3-montagem.md#r1-validacao-estrutural-antes-de-concatenar-rf09`, `04-fase-2-enxame.md#r9-ondas-e-falhas` |
| Código afetado | `agents/mira-fast/scripts/assemble-run.mjs` (339-342) |
| Assimetria | `agents/mira-fast/scripts/validate-run.mjs` (131-133) |
| Testes | nenhum |

## Resolution

Corrigido em 2026-07-31, junto com o BUG-20260731-K4NR. **Não fechado**: a closure policy é
`package` e exige merge e versão publicada. Estado atual `active` / `delivering`.

### Causa raiz (confirmed)

A mesma do K4NR, manifestada num par de checagens que discordavam entre si:

- `validate-run.mjs:131-133` conta `<section` apenas em `htmlBlock`, ou seja, até o marcador
  de CSS. O bloco `js` fica fora do alcance dele.
- `assemble-run.mjs:339` conta na saída inteira, que já contém o CSS e o JavaScript vindos
  das folhas.

Um comentário no bloco `js` da folha cai exatamente no vão entre os dois: aprovado por quem
valida, contado por quem monta. A folha grava `ok: true` de boa-fé e a montagem morre depois,
com uma mensagem que não apontava para ela.

### Veredito de spec: `spec-correta` (aprovado pelo usuário em 2026-07-31)

`04-fase-2-enxame.md#R6` fixa o contrato de saída da folha e `#R9` fixa o ciclo validar,
gravar status, montar. A spec já estabelecia que fragmento aprovado pelo validador é
montável. Foi o código que divergiu dela. **Nenhum adendo foi gerado por este bug.**

O adendo do K4NR registra esse acordo em R1e por ser o ponto onde a falta da regra do que
conta como elemento o violava na prática. Registro, não mudança: R1e não altera a spec, cita
o que `04#R6` e `#R9` já diziam.

### Change set

Compartilhado com o K4NR; ver a tabela completa em
[`../BUG-20260731-K4NR-validador-section-em-comentario/bug.md`](../BUG-20260731-K4NR-validador-section-em-comentario/bug.md).
O que é deste bug:

| CHG | tipo | artefato | propósito |
|---|---|---|---|
| CHG-001 | `test` | `test/mira-fast-section-count.test.mjs` | reprodução do comentário no JS e do comentário HTML no fragmento ([diff](fix/CHG-001.diff)) |
| CHG-002 | `code` | `agents/mira-fast/scripts/validate-run.mjs` | a contagem do fragmento passa a usar `countSections`/`countClosingSections` ([diff](fix/CHG-002.diff)) |
| CHG-003 | `code` | `agents/mira-fast/scripts/assemble-run.mjs` | a contagem da saída passa a usar `countSections`; o erro passa a apontar o culpado ([diff](fix/CHG-003.diff)) |

A mensagem de erro, que antes só dizia o total:

```js
const suspeitos = parts
  .filter(({ html }) => countSections(html) !== 1)
  .map(({ slide, html }) => `slide ${slide.n} (${slide.slug_stage}): ${countSections(html)}`);
const detalhe = suspeitos.length ? `; fragmento(s) fora do esperado: ${suspeitos.join(', ')}` : '';
```

### Manifestação nova, encontrada durante o diagnóstico

O critério de aceite 3 deste bug exigia critério único entre `validate-run` e `assemble-run`.
Procurando os pontos, achei um terceiro que nenhum dos dois bugs descrevia: um comentário
**HTML** dentro do bloco de HTML do fragmento desbalanceia a contagem do próprio fragmento.

```
sem comentario : []
com <section>  : ["section inválida: 2 abertura(s), 1 fechamento(s)"]
```

Não virou bug novo: já estava dentro do escopo declarado deste. Corrigido no CHG-002 e
coberto por teste de reprodução próprio.

### Sobre a contagem da saída ser inalcançável

Durante a correção ficou claro que `assemble-run.mjs:339` não é alcançável por entrada
válida: fragmento com `section` real a mais é barrado antes por `validateFragment`. A única
forma de disparar aquela linha era o próprio defeito.

Consequência para os testes: o teste de regressão que o plano prometia para esse caminho
("saída com section a mais continua reprovando") não é construtível sem burlar o pipeline.
Foi substituído pelo unitário `countSections conta elemento e ignora prosa`, que protege o
mesmo invariante por um caminho alcançável. A linha permanece como defesa em profundidade e
está documentada assim em R1c do adendo do K4NR.

### Relações promovidas

| aresta | antes | depois | evidência |
|---|---|---|---|
| BNO4 → K4NR | `proposed` | `supported` | mesmo deck reproduz os dois; a mesma função corrige os dois |
| BNO4 → ETPU | `proposed` | `supported` | a falha deste bug é o que expõe a instalação parcial do ETPU |

### Testes

Vermelho para verde na saída completa registrada em
[`../BUG-20260731-K4NR-validador-section-em-comentario/bug.md`](../BUG-20260731-K4NR-validador-section-em-comentario/bug.md).
Suíte completa: **111 tests, 111 pass, 0 fail**. Cápsula: `EXIT=0` antes, `EXIT=1` depois.

### O que falta para fechar

`closure.policy: package`. Falta commit, merge e versão publicada. Sem `DONE.md` até lá.

## Agent Notes

- Achado do pente-fino de 2026-07-31. Relatório em
  `../../inspections/2026-07-31-decks-studio/report.md`.
- **Corrigir junto com o BUG-20260731-K4NR.** As duas checagens têm a mesma raiz e a
  correção provavelmente é o mesmo utilitário. Registrados separados porque fecham por
  critérios diferentes e um pode ser corrigido sem o outro.
- **O `/mira-ultrafast` herda**, porque delega para o mesmo `assembleRun`.
- **Proposta de taxonomia:** `area: geracao-de-decks`, `module: mira-fast`,
  `feature: validacao-de-esqueleto`.
