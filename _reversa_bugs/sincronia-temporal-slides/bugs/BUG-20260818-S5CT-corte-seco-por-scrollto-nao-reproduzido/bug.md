---
schema_version: 1
id: BUG-20260818-S5CT
display_number: 21
title: Passar o slide com a seta num deck sequencial dá um glitch de um quadro, aparece um frame adiantado e a cena volta para o começo
status: open
phase: triaging
severity: high
priority: P1
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
  - precisa-reproducao

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: "relatado pelo autor como constante ao apertar a seta para baixo num deck feito com /mira-sequence; ainda não medido quadro a quadro"
  suspected_triggers:
    - "scroll-snap-type: y proximity no mesmo seletor html do CSS base, reajustando a posição DEPOIS do salto instantâneo"
    - "IntersectionObserver com threshold 0.6 piscando (false->true->false->true) durante o assentamento da rolagem, e cada reentrada zera o relógio"
    - "html { scroll-behavior: smooth }, hipótese do documento de origem, contrariada pela decisão escrita em agents/mira-sequence/SKILL.md:138"

blocking: []

relationships:
  - bug: BUG-20260818-R7MC
    type: related-to
    state: proposed
    evidence: []

traceability:
  specs:
    - "agents/mira-sequence/SKILL.md#L134"
    - "agents/mira-sequence/SKILL.md#L138"
    - "agents/mira-sequence/SKILL.md#L146"
  affected_code:
    - "agents/mira-sequence/SKILL.md:134"
    - "agents/mira-sequence/references/exemplo-bola.html:452"
    - "agents/mira-sequence/references/exemplo-bola.html:225-245"
    - "templates/decks/mira-default/index.html:101"
    - "templates/decks/mira-default/index.html:288-308"
    - "templates/decks/mira-default/index.html:562"
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

# Passar o slide com a seta num deck sequencial dá um glitch de um quadro, aparece um frame adiantado e a cena volta para o começo

> **A pasta deste bug tem um slug errado.** Ela nasceu como
> `corte-seco-por-scrollto-nao-reproduzido`, quando o registro tinha só a solução proposta e
> nenhum sintoma. O sintoma apareceu depois, na mesma sessão, e o bug é outro. A pasta **não
> é renomeada**: o endereço de um bug é imutável, e o título no front matter é que manda.

## Summary

Num deck feito com `/mira-sequence`, apertar a seta para baixo dá um **glitch de um quadro**:
aparece rapidamente um frame adiantado, e em seguida a cena volta para o início. Relatado
pelo autor como comportamento constante, não esporádico.

O sintoma é o que a camada de sequência inteira existe para evitar. Um par sequencial só lê
como continuidade se o corte for absolutamente limpo: um quadro estranho no meio já mata a
ilusão.

**Histórico deste registro, que importa para não repetir o erro:** o bug entrou primeiro como
uma proposta de solução (trocar `scrollIntoView({behavior:'instant'})` por
`window.scrollTo({top: offsetTop, behavior:'instant'})`), vinda de um documento gerado pelo
Gemini, sem sintoma anexado. Registrei como não reproduzido e rebaixei a severidade. O autor
então descreveu o sintoma, que é real e reprodutível. **A solução proposta pode estar certa
pelo motivo errado**, e é isso que este bug precisa separar.

## Expected Behavior

**Não há spec.** `spec-gap`. O contrato de fato é `agents/mira-sequence/SKILL.md`, peça 4:
num par `data-mira-seq` / `data-mira-seq-de`, a passagem é corte seco, sem rolagem visível e
sem quadro intermediário, nos dois sentidos. E `agents/mira-sequence/SKILL.md:146` proíbe
mexer no `html { scroll-behavior: smooth }` do CSS.

Esperado: entre o último quadro do slide de origem e o primeiro do slide de continuação não
existe nenhum quadro que não pertença a nenhum dos dois.

## Actual Behavior

Nas palavras do autor: "você dá a seta para baixo num arquivo que foi feito com mira
sequence, ele dá um glitchzinho, aparece um frame no futuro rapidamente, volta para iniciar a
apresentação, fica estranho".

Duas coisas distintas dentro de um mesmo sintoma, e essa separação é o trabalho do fix:

1. **Um quadro adiantado aparece.** Alguma coisa é pintada num estado que não é nem o fim da
   origem nem o começo da continuação.
2. **A cena volta para o começo.** Depois do quadro estranho, a animação reinicia.

O item 2 tem mecanismo conhecido e barato de confirmar: o `reger` zera o relógio **toda vez**
que o slide reentra na tela (`exemplo-bola.html:238-244`, `mira-default:301-307`). Basta o
`isIntersecting` piscar uma vez a mais no assentamento da rolagem para a cena reiniciar.

## Steps to Reproduce

1. Abrir `agents/mira-sequence/references/exemplo-bola.html` no Chrome (é o artefato de
   referência da skill, com o par sequencial funcionando).
2. Apertar a seta para baixo na passagem do par.
3. Gravar a tela a 60 fps e ir quadro a quadro.

Observado: um quadro adiantado, depois reinício.
Esperado: corte limpo, a bola continua de onde estava.

## Evidence

- [`../../intake/relato-20260818-1211.md`](../../intake/relato-20260818-1211.md)
- [`../../intake/spec-sincronia-determinista-proposta.md`](../../intake/spec-sincronia-determinista-proposta.md),
  o documento gerado pelo Gemini, que propõe a solução sem descrever este sintoma.

Falta a gravação quadro a quadro. É o primeiro passo do fix e decide tudo que vem abaixo.

## Suspected Area

Três mecanismos, do mais provável para o menos. Todos produzem o sintoma relatado, e **só um
deles é o que o documento de origem acusa**.

### 1. `scroll-snap-type: y proximity` reajustando depois do salto (suspeito principal)

`templates/decks/mira-default/index.html:101` e `exemplo-bola.html:83`:

```css
html { background: #333333; scroll-behavior: smooth; scroll-snap-type: y proximity; }
```

O salto instantâneo do corte seco põe a página numa posição. O snap então avalia essa
posição e, se ela não coincidir exatamente com o ponto de encaixe, **corrige com animação
própria**. Nessa correção a borda entre as seções se move, e uma fatia da seção vizinha
aparece: exatamente "um frame no futuro rapidamente". Se a correção fizer o slide cruzar o
threshold de 0.6 do `IntersectionObserver` para baixo e para cima, o `reger` zera o relógio
de novo: exatamente "volta para iniciar".

**Isto explica por que a troca proposta pelo Gemini funcionaria, sem que a justificativa dele
esteja certa.** `window.scrollTo({top: alvo.offsetTop})` põe a página numa coordenada exata,
que coincide com o ponto de encaixe. `scrollIntoView({block:'start'})` resolve a posição
levando em conta `scroll-margin` e `scroll-padding`, e pode parar meio pixel fora. O remédio
seria o certo pelo motivo errado, e ninguém saberia disso depois.

Teste que decide, em um minuto: pôr `scroll-snap-type: none` no `html` e repetir a passagem.
Se o glitch some, é este.

### 2. `IntersectionObserver` piscando, e o `reger` zerando o relógio a cada reentrada

`exemplo-bola.html:238-244`: qualquer transição `false → true` zera `relogio`. Não existe
histerese nem debounce. Um único pisca no assentamento da rolagem reinicia a cena.

Isso não explica sozinho o quadro adiantado, mas explica a segunda metade do sintoma, e pode
estar somando com o mecanismo 1.

### 3. `scrollIntoView({behavior:'instant'})` herdando o `scroll-behavior: smooth` do CSS

É o que o documento de origem afirma. **É o menos provável dos três.**
`agents/mira-sequence/SKILL.md:138` argumenta explicitamente o contrário: `'auto'` herda o
CSS, `'instant'` não, e é exatamente por isso que os dois valores existem separados na
CSSOM-View. Se este for o mecanismo, uma decisão documentada do projeto está errada e vira
adendo, o que é um resultado sério e precisa de medição, não de suposição.

## Acceptance Criteria

1. Gravação quadro a quadro em `evidence/`, em Chrome com versão anotada, mostrando o quadro
   adiantado e o reinício.
2. Os três mecanismos foram discriminados, e não apenas o remédio aplicado. No mínimo: uma
   passada com `scroll-snap-type: none` e um log de cada disparo do `IntersectionObserver`
   durante a transição.
3. `spec_verdict` registrado. Se o mecanismo 3 for descartado, a decisão do
   `agents/mira-sequence/SKILL.md:138` continua valendo e o documento do Gemini é corrigido no
   ponto em que erra, para não voltar numa próxima sessão.
4. A correção cobre **todos** os caminhos de navegação, não só o teclado, e o caminho do
   celular é o BUG-20260818-R7MC.
5. Se a troca para `window.scrollTo` for adotada, ela usa
   `el.getBoundingClientRect().top + window.scrollY`, e não `offsetTop`. Ver Agent Notes.
6. A transição global do deck continua suave. O corte seco só existe se o resto for diferente
   dele (`exemplo-bola.html:411-424`).

## Traceability

- **Spec:** `agents/mira-sequence/SKILL.md#L134`, `#L138`, `#L146`.
- **Código afetado:** front matter, com linha.
- **Causa raiz:** não investigada, e não deve ser declarada antes da gravação. Três
  hipóteses concorrentes acima, nenhuma promovida.
- **Testes:** nenhum. Este defeito é visual e precisa de vídeo, não de asserção.

## Agent Notes

- **Não aplique o remédio sem discriminar o mecanismo.** Se o culpado for o `scroll-snap`, a
  troca de API esconde o defeito num caminho e o deixa vivo em todos os outros (o botão, a
  barra, o celular, o `/mira-slide-to-video`), porque cada um vai parar numa posição
  ligeiramente diferente.
- **`offsetTop` não é equivalente a `scrollIntoView`.** É relativo ao `offsetParent`. Enquanto
  o slide for filho direto do `body` coincide; num `.fullscreen-wrapper` posicionado (formatos
  Studio) não coincide, e o salto vai para o lugar errado sem erro no console.
- **A pasta deste bug tem slug antigo e não será renomeada.** O endereço de um bug é imutável.
- **Proposta de taxonomia:** `area: apresentacao`, `module: navegacao`,
  `feature: corte-seco-sequencial`.
