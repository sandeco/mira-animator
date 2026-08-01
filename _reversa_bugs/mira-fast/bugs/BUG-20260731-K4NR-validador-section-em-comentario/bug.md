---
schema_version: 1
id: BUG-20260731-K4NR
display_number: 4
title: validateSkeleton reprova o esqueleto por section citado em comentário de documentação
status: active
phase: delivering
severity: high
priority: P1
created: 2026-07-31
updated: 2026-07-31

origin:
  type: manual-report
  external_ref: null

area: unclassified
module: unclassified
feature: unclassified
labels:
  - spec-gap

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: "3/3 antes da correção, 0/3 depois (evidence/reproduce.mjs)"
  suspected_triggers: []

blocking: []

relationships: []

traceability:
  specs:
    - "_reversa_sdd/mira-fast/sdd/05-fase-3-montagem.md#r1-validacao-estrutural-antes-de-concatenar-rf09"
    - "_reversa_sdd/addenda/bug-BUG-20260731-K4NR-v001.md#r1d-o-que-conta-como-elemento-section-a-regra-que-faltava"
  affected_code:
    - "agents/mira-fast/scripts/assemble-run.mjs:231-234"
    - "agents/mira-fast/scripts/assemble-run.mjs:339-342"
    - "agents/mira-ultrafast/scripts/build-skeleton.mjs:20-25"
  root_cause:
    state: confirmed
    hypothesis: >-
      Não existe no pipeline nenhuma função que separe marcação de prosa. Quatro pontos
      decidem se há um elemento section aplicando regex sobre texto bruto, que inclui
      comentário HTML, comentário JavaScript e conteúdo de script e style.
    causal_path:
      - "um comentário legítimo cita <section> ao explicar a estrutura"
      - "o trecho analisado (esqueleto, saída ou fragmento) contém esse texto"
      - "/<section\\b/i casa com o texto do comentário"
      - "a checagem conclui que existe elemento onde há apenas uma frase"
      - "esqueleto reprovado, contagem inflada ou fragmento dado como desbalanceado"
    evidence:
      - ref: "evidence/reproduction.md"
        observation: "3/3 determinístico, com caso de controle que monta trocando <section> por secoes no mesmo comentário"
      - ref: "evidence/reproduce.mjs"
        observation: "exit 0 antes da correção, exit 1 depois"
      - ref: "fix/CHG-002.diff"
        observation: "a implementação que separa marcação de prosa num único ponto"
    code_refs:
      - file: "agents/mira-fast/scripts/assemble-run.mjs"
        symbol: "validateSkeleton"
        commit: "558a406"
      - file: "agents/mira-fast/scripts/validate-run.mjs"
        symbol: "validateFragment"
        commit: "558a406"
  reproduction_tests:
    - "test/mira-fast-section-count.test.mjs::K4NR: comentário do esqueleto citando a tag não impede a montagem"
    - "test/mira-fast-section-count.test.mjs::K4NR: comentário JavaScript do esqueleto citando a tag não impede a montagem"
    - "_reversa_bugs/mira-fast/bugs/BUG-20260731-K4NR-validador-section-em-comentario/evidence/reproduce.mjs"
  regression_tests:
    - "test/mira-fast-section-count.test.mjs::regressão: section REAL fora do slot continua reprovando o esqueleto"
    - "test/mira-fast-section-count.test.mjs::regressão: countSections conta elemento e ignora prosa"
    - "test/mira-fast-section-count.test.mjs::regressão: stripNonMarkup preserva as tags de script e style, só esvazia o conteúdo"

spec_verdict: spec-gap

change_risk:
  classification: baixa
  reasons:
    - "blast radius: 4 pontos em 2 arquivos, todos lógica de validação do pipeline de build"
    - "sem contrato externo: scripts internos, sem consumidor fora do repositório"
    - "sem estado histórico: nenhum reparo de dados envolvido"
    - "funções puras, sem estado compartilhado nem concorrência"
    - "reversível pelo diff, sem migração"

change_set:
  - id: CHG-001
    kind: test
    artifact: test/mira-fast-section-count.test.mjs
    purpose: quatro testes de reprodução e quatro de regressão
    diff: fix/CHG-001.diff
  - id: CHG-002
    kind: code
    artifact: agents/mira-fast/scripts/validate-run.mjs
    purpose: cria stripNonMarkup, countSections e countClosingSections e usa na contagem do fragmento
    diff: fix/CHG-002.diff
  - id: CHG-003
    kind: code
    artifact: agents/mira-fast/scripts/assemble-run.mjs
    purpose: validateSkeleton e a contagem da saída passam a usar countSections; erro passa a apontar o fragmento culpado
    diff: fix/CHG-003.diff
  - id: CHG-004
    kind: specification
    artifact: _reversa_sdd/addenda/bug-BUG-20260731-K4NR-v001.md
    purpose: adendo aditivo que especifica as checagens de esqueleto e de saída e a regra do que conta como elemento
    diff: null

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

# validateSkeleton reprova o esqueleto por section citado em comentário de documentação

## Summary

A checagem que impede `<section>` fora do slot de slides roda uma regex sobre texto cru.
Comentário HTML, comentário JS e string literal contam como tag de verdade. Templates bem
documentados, que explicam a estrutura citando `<section>` na prosa, reprovam sempre.

No `mira-studio-demo` são doze menções documentais, todas fora do slot. Qualquer uma
derruba a montagem com `esqueleto contém <section> fora do slot de slides`.

O defeito é do validador, não da documentação do template. Reescrever comentário resolve um
arquivo por vez e volta a acontecer no próximo template que documentar bem.

## Expected Behavior

`_reversa_sdd/mira-fast/sdd/05-fase-3-montagem.md#r1-validacao-estrutural-antes-de-concatenar-rf09`
define o que a Fase 3 valida antes de concatenar. As oito checagens V1 a V8 são sobre os
**fragmentos** `slide-NN.html`, e V8 é balanceamento de abertura e fechamento de `<section>`
dentro do fragmento.

A intenção da checagem sobre o esqueleto é impedir que sobre um slide de exemplo fora do
slot. O comportamento esperado é reagir a **elemento** `section`, não a texto que menciona
a palavra.

## Actual Behavior

`agents/mira-fast/scripts/assemble-run.mjs`, linhas 231 a 234:

```js
if (slidesStart >= 0 && slidesEnd > slidesStart) {
  const outside = `${skeleton.slice(0, slidesStart)}${skeleton.slice(slidesEnd + SLOT_MARKERS.slidesEnd.length)}`;
  if (/<section\b/i.test(outside)) errors.push('esqueleto contém <section> fora do slot de slides');
}
```

`outside` é a string do arquivo. Nada distingue tag de texto.

Gatilhos em `templates/decks/mira-studio-demo/index.html`, todos fora do slot de slides,
todos em comentário: linhas 38, 121, 176, 211, 232, 283, 318, 325, 333, 832, 1066 e 1068.
Exemplos: "cada `<section>` é um slide", "é IRMÃO das `<section>`, nunca filho", "O overlay
NÃO entra no vídeo porque é IRMÃO das `<section>`".

## Steps to Reproduce

1. Montar um esqueleto a partir de `templates/decks/mira-studio-demo/index.html`,
   preservando os comentários de documentação e abrindo os seis slots.
2. Rodar `node agents/mira-fast/scripts/assemble-run.mjs "<deck_dir>"`.
3. A montagem aborta com `esqueleto contém <section> fora do slot de slides`, mesmo sem
   nenhuma tag `section` real fora do slot.

Na prática, hoje o BUG-20260731-OI56 aborta antes, na checagem de marcadores. Para isolar
este bug, satisfaça os marcadores primeiro.

## Evidence

- `evidence/codigo-observado.md` — a checagem, as doze menções documentais do template e as
  duas checagens irmãs, extraídos deste repositório no commit `558a406`.
- `../../intake/relato-20260731-2105.md` — anotação da conferência.

## Suspected Area

`validateSkeleton()` em `agents/mira-fast/scripts/assemble-run.mjs`, linhas 231 a 234.

Duas checagens irmãs sofrem do mesmo problema de raiz e precisam entrar no escopo do fix:

- **`assemble-run.mjs` linhas 339 a 342**, na saída final:
  `const sectionCount = (output.match(/<section\b/gi) ?? []).length;` seguido de
  `if (sectionCount !== plan.slides.length) throw ...`. Como o esqueleto do Studio carrega
  as menções documentais, essa contagem também infla. Não observado em produção, porque a
  `validateSkeleton` barra antes; anotado como área suspeita, não como ocorrência.
- **`agents/mira-ultrafast/scripts/build-skeleton.mjs` linhas 20 a 25**, `assertSkeleton()`,
  que faz `if (/<section\b/i.test(html)) throw new Error('esqueleto ainda contém section')`.
  Ali o autor contornou escapando `<section>` para `&lt;section&gt;` nas linhas 54 e 69. É
  o mesmo defeito, já sentido por outro caminho e contornado sem tratar a causa.

## Acceptance Criteria

1. Um esqueleto com comentários citando `<section>` fora do slot passa em
   `validateSkeleton()`.
2. Um esqueleto com uma tag `<section>` real fora do slot continua reprovando. A checagem
   não pode ser afrouxada até deixar de proteger.
3. A contagem de `<section>` da saída (linhas 339 a 342) usa o mesmo critério e não conta
   menção em comentário.
4. `assertSkeleton()` do `build-skeleton.mjs` passa a usar o mesmo critério, e o escape para
   `&lt;section&gt;` das linhas 54 e 69 deixa de ser necessário, ou fica registrado por que
   permanece.
5. Teste de regressão automatizado com dois casos: esqueleto com menção em comentário
   (passa) e esqueleto com tag real fora do slot (reprova).

## Traceability

| Eixo | Referência |
|---|---|
| Spec | `05-fase-3-montagem.md#r1-validacao-estrutural-antes-de-concatenar-rf09` |
| Lacuna de spec | R1 especifica V1 a V8 sobre os fragmentos; as checagens sobre o esqueleto existem só no código |
| Código afetado | `agents/mira-fast/scripts/assemble-run.mjs` (231-234), com irmãs em (339-342) e `agents/mira-ultrafast/scripts/build-skeleton.mjs` (20-25) |
| Gatilhos | `templates/decks/mira-studio-demo/index.html` linhas 38, 121, 176, 211, 232, 283, 318, 325, 333, 832, 1066, 1068 |
| Causa raiz | não investigada; é do `/reversa-debugger-fix` |
| Testes de reprodução | nenhum |
| Testes de regressão | nenhum |

## Resolution

Corrigido em 2026-07-31. **Não fechado**: a closure policy é `package` e exige merge e
versão publicada. Estado atual `active` / `delivering`.

### Causa raiz (confirmed)

Não existe no pipeline nenhuma função que separe marcação de prosa. Quatro pontos decidem se
há um elemento `section` aplicando uma regex sobre o texto bruto do arquivo, e texto bruto
inclui comentário HTML, comentário JavaScript e o conteúdo de `<script>` e `<style>`. Cada
ponto reimplementou a mesma pergunta com a mesma resposta errada.

O caminho causal, as evidências e os `code_refs` estão no bloco `root_cause` do front matter.
O que fecha a prova é o caso de controle da cápsula: o mesmo deck, com o mesmo comentário,
trocando `<section>` por `secoes`, monta com sucesso. A variável isolada é a sequência de
caracteres, não a estrutura do deck.

### Descobertas durante a correção

1. **O escopo era maior que o relato.** A cápsula reproduz em `mira-vertical`, não em Studio.
   O defeito é do validador e da contagem, e vale para os quatro formatos. O relato original
   o descrevia como problema do `mira-studio`.
2. **Havia um terceiro ponto afetado, não registrado por nenhum dos dois bugs.**
   `validate-run.mjs:131-133`: um comentário HTML dentro do bloco de HTML do fragmento
   desbalanceia a contagem do próprio fragmento
   (`section inválida: 2 abertura(s), 1 fechamento(s)`). Entrou nesta correção porque o
   critério de aceite 3 do BUG-20260731-BNO4 já exigia critério único entre `validate-run` e
   `assemble-run`. Não virou bug novo.
3. **A contagem da saída (`assemble-run.mjs:339`) é inalcançável por entrada válida.**
   Fragmento com `section` real a mais é barrado antes por `validateFragment`. Hoje, a única
   forma de disparar aquela linha era o próprio defeito. Ela permanece como defesa em
   profundidade, agora documentada como tal no adendo (R1c). Por isso o teste de regressão
   prometido no plano para esse caminho foi substituído pelo unitário de `countSections`, que
   protege o mesmo invariante por um caminho alcançável.

### Veredito de spec: `spec-gap` (aprovado pelo usuário em 2026-07-31)

`05-fase-3-montagem.md#R1` especifica V1 a V8 e todas são sobre os fragmentos. As checagens
de esqueleto e de saída, e a definição do que conta como elemento `section`, nunca existiram
em spec nenhuma. Adendo aditivo gerado, spec original intocada:

`_reversa_sdd/addenda/bug-BUG-20260731-K4NR-v001.md`

Ele acrescenta R1b (validação do esqueleto, E1 a E8), R1c (validação da saída, defesa em
profundidade), **R1d (o que conta como elemento `section`)** e R1e (o acordo entre validador
e montagem). R1d é a única mudança normativa de comportamento; o resto documenta o que já
existia. O adendo declara explicitamente o que **não** decide: quem é o dono dos blocos
`@MIRA:THEME` e `@MIRA:RESPONSIVE`, lacuna que continua aberta no BUG-20260731-OI56.

### Change set

| CHG | tipo | artefato | propósito |
|---|---|---|---|
| CHG-001 | `test` | `test/mira-fast-section-count.test.mjs` | 4 testes de reprodução, 4 de regressão ([diff](fix/CHG-001.diff)) |
| CHG-002 | `code` | `agents/mira-fast/scripts/validate-run.mjs` | `stripNonMarkup`, `countSections`, `countClosingSections`, usadas na contagem do fragmento ([diff](fix/CHG-002.diff)) |
| CHG-003 | `code` | `agents/mira-fast/scripts/assemble-run.mjs` | linhas 233 e 339 passam a usar `countSections`; erro passa a apontar o fragmento culpado ([diff](fix/CHG-003.diff)) |
| CHG-004 | `specification` | `_reversa_sdd/addenda/bug-BUG-20260731-K4NR-v001.md` | adendo aditivo do veredito `spec-gap` |

O núcleo da correção, de `fix/CHG-002.diff`:

```js
export function stripNonMarkup(value) {
  return String(value)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/(<script\b[^>]*>)[\s\S]*?(<\/script>)/gi, '$1$2')
    .replace(/(<style\b[^>]*>)[\s\S]*?(<\/style>)/gi, '$1$2');
}

export function countSections(value) {
  return (stripNonMarkup(value).match(/<section\b/gi) ?? []).length;
}
```

As tags de `script` e `style` permanecem; só o conteúdo é esvaziado. A limpeza é aplicada
**dentro** da contagem, nunca na variável compartilhada: se `htmlBlock` fosse limpo antes das
outras checagens, a verificação de `<!-- @MIRA:SIZE 3/10 -->` (`validate-run.mjs:138`)
passaria a falhar sempre.

### Testes, vermelho para verde

Antes da correção, com os testes já aplicados:

```
✖ K4NR: comentário do esqueleto citando a tag não impede a montagem
✖ K4NR: comentário JavaScript do esqueleto citando a tag não impede a montagem
✖ BNO4: comentário no JS da folha não infla a contagem final
✖ BNO4: comentário HTML no fragmento não desbalanceia a contagem do fragmento
✔ regressão: section REAL fora do slot continua reprovando o esqueleto
✔ regressão: fragmento com duas sections reais continua reprovando
```

Depois:

```
✔ K4NR: comentário do esqueleto citando a tag não impede a montagem
✔ K4NR: comentário JavaScript do esqueleto citando a tag não impede a montagem
✔ BNO4: comentário no JS da folha não infla a contagem final
✔ BNO4: comentário HTML no fragmento não desbalanceia a contagem do fragmento
✔ regressão: section REAL fora do slot continua reprovando o esqueleto
✔ regressão: countSections conta elemento e ignora prosa
✔ regressão: stripNonMarkup preserva as tags de script e style, só esvazia o conteúdo
✔ regressão: fragmento com duas sections reais continua reprovando
```

Suíte completa: `npm test` → **111 tests, 111 pass, 0 fail**.

Cápsula invertida, que é a prova independente do teste unitário:

```
$ node evidence/reproduce.mjs
[BUG-20260731-K4NR] ... taxa: 0/3 ... montagem: PASS
[BUG-20260731-BNO4] ... taxa: 0/3 ... montagem: PASS
[controle]          ... taxa: 3/3 ... montagem: PASS
EXIT=1   (antes da correção: EXIT=0)
```

### O que falta para fechar

`closure.policy: package`. Falta commit, merge e versão publicada. Enquanto isso o bug fica
`active` / `delivering` e **não recebe `DONE.md`**. Quando publicar, rode
`/reversa-debugger-fix BUG-20260731-K4NR` de novo para registrar `delivery` e gravar a trava.

## Agent Notes

- **O handoff oferece duas correções e chama de "aplicada" a mais fraca.** Reescrever os
  comentários do template trocando `<section>` por crase é remendo no sintoma, arquivo por
  arquivo. A correção que ataca a causa é limpar comentários HTML e JS de `outside` antes
  da regex. Este bug foi registrado contra o validador de propósito; a reescrita de
  comentário fica como alternativa avaliada, não como recomendação.
- **Cuidado ao limpar comentários.** Remover `<!--...-->` resolve os comentários HTML, mas
  parte dos gatilhos do template está em comentário **JS** (`/* ... */`), dentro de
  `<script>`. Uma limpeza que só trate HTML deixa passar as linhas 38, 176 e 232, entre
  outras. Conferir cada uma das doze antes de dar o fix por concluído.
- **Proposta de taxonomia:** `area: geracao-de-decks`, `module: mira-fast`,
  `feature: validacao-de-esqueleto`.

### Acrescentado na correção, 2026-07-31

- **`build-skeleton.mjs` ficou de fora por decisão do usuário.**
  `agents/mira-ultrafast/scripts/build-skeleton.mjs` tem o mesmo defeito na linha 24
  (`assertSkeleton`) e o contorna escapando `<section>` para `&lt;section&gt;` nas linhas 54
  e 69. O critério de aceite 4 deste bug pede que ele passe a usar `countSections` e que o
  escape deixe de ser necessário. Não foi tocado porque é arquivo novo, ainda não commitado:
  um erro meu ali não teria como ser desfeito pelo git. **O contorno permanece e continua
  funcionando** (escapar para entidade também produz zero elementos pela nova regra). Depois
  que o arquivo for commitado, isto vira um CHG próprio.
- **O escape do `build-skeleton.mjs` agora é redundante, não errado.** Com R1d valendo, um
  comentário citando a tag já não derruba nada. Remover o escape passa a ser limpeza, não
  correção.
- **Quem escrever nova checagem que conte `section`** deve chamar `countSections` ou
  `countClosingSections` de `validate-run.mjs`. Regex própria reintroduz o defeito; foi
  assim que ele nasceu em quatro lugares. Está normativo em R1d do adendo.
