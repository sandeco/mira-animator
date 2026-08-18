---
schema_version: 1
id: BUG-20260818-T3RG
display_number: 19
title: Quatro templates oficiais disparam d3.timer no load sem regente, e a animação com etapas é vista no meio do ciclo por quem chega no slide
status: open
phase: triaging
severity: medium
priority: P2
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
  - templates

visibility: normal
security_suspected: false

reproduction:
  classification: deterministic
  rate: "não medido em navegador; divergência confirmada por leitura de código nos 4 arquivos"
  suspected_triggers: []

blocking: []

relationships:
  - bug: BUG-20260818-V4LD
    type: related-to
    state: proposed
    evidence: []

traceability:
  specs:
    - "agents/mira-sequence/references/exemplo-bola.html#L225-L245"
    - "templates/decks/mira-default/index.html#L288-L308"
  affected_code:
    - "templates/decks/mira-studio-demo/index.html:838"
    - "templates/decks/mira-studio-demo/index.html:870"
    - "templates/decks/demo-tecnica/index.html:380"
    - "templates/decks/mira-studio-demo/index.html:724"
    - "templates/decks/mira-studio-demo/index.html:744"
    - "templates/decks/aula-capitulo/index.html:331"
    - "templates/decks/aula-capitulo/index.html:371"
    - "templates/decks/demo-tecnica/index.html:344"
    - "templates/decks/pitch-projeto/index.html:332"
    - "templates/decks/pitch-projeto/index.html:343"
    - "templates/decks/pitch-projeto/index.html:374"
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

# Quatro templates oficiais disparam d3.timer no load sem regente, e a animação com etapas é vista no meio do ciclo por quem chega no slide

## Summary

O `mira-default` tem o regente `reger(svgId, quadro)`: fora da tela chama `quadro(0)`, e ao
entrar zera o relógio. Outros dois templates chegam ao mesmo resultado por outro caminho
(reconstroem a cena na entrada). Quatro não fazem nem um nem outro: chamam `d3.timer` na
carga da página e nunca mais olham para a visibilidade do slide.

O estrago **não é uniforme**, e isso importa para quem for corrigir:

| Ocorrência | Animação | Dano |
|---|---|---|
| `mira-studio-demo:838` (`build()` em 870) | fluxo com `ETAPAS`, nós acendendo em ordem dentro de um `CICLO` | **real**: quem chega vê o fluxo já pela metade, com nós acesos sem ter visto acender |
| `demo-tecnica:380` | órbita com entrada coreografada (`transition().delay()` por satélite) | **real**: a coreografia de entrada toca com o slide fora da tela e nunca mais se repete |
| `mira-studio-demo:724` | satélites em órbita perpétua | cosmético |
| `aula-capitulo:331`, `demo-tecnica:344`, `pitch-projeto:332` | campo de partículas auto-similar na capa | cosmético: não existe "começo" perceptível |
| `pitch-projeto:343` e `:374`, `aula-capitulo:423` | `setInterval` de alternância (spotlight, rotação) | cosmético, mas é `setInterval` rodando a apresentação inteira |

Registrado como **um** bug e não como quatro: é a mesma classe de defeito, a mesma correção
e o mesmo teste de regressão. A severidade `medium` é a média honesta entre duas ocorrências
que doem e o resto que é ruído.

## Expected Behavior

**Não há spec.** Nenhum `architecture.md` foi extraído para `_reversa_sdd/`, e o documento
que o autor colou nesta sessão
([`../../intake/spec-sincronia-determinista-proposta.md`](../../intake/spec-sincronia-determinista-proposta.md))
é proposta normativa, não spec efetiva: não está em `_reversa_sdd/` e não tem adendo.

O comportamento esperado está escrito como **código de referência**, em dois lugares que
concordam entre si:

- `templates/decks/mira-default/index.html:288-308`, o `reger` real do template padrão.
- `agents/mira-sequence/references/exemplo-bola.html:225-245`, com o comentário explicando
  que é o `quadro(0)` perpétuo do slide congelado que obriga a guarda `ms > 0`.

Regra, na forma em que o código já a pratica: **o primeiro quadro que o espectador vê é o
quadro 0 da história**. Seja congelando o relógio (regente), seja reconstruindo a cena na
entrada. O que não pode é o tempo correr com o slide fora da tela.

A decisão que o fix precisa tomar com o autor: se a regra vale para **todo** timer ou só
para animação com começo perceptível. Um campo de partículas congelado em `quadro(0)` fica
parado atrás do slide, o que é correto e invisível; a mudança tem custo zero de aparência,
mas mexe em quatro templates publicados.

## Actual Behavior

`mira-studio-demo/index.html`, o caso que mais dói. Nenhum `IntersectionObserver` no arquivo
inteiro. `build()` é chamado direto:

```javascript
// linha 838
var t = d3.timer(function (ms) {
    if (window.__fluxoGen !== gen) { t.stop(); return; }
    try {
        var m = ms % CICLO;
        var seg = Math.min(Math.floor(m / (TRAVEL + PAUSE)), ETAPAS.length - 2);
        ...
// linha 870
build();
```

O `gen` protege contra timer duplicado no replay. Não tem nada a ver com visibilidade: o
timer nasce com a página e o `ms` que chega no quadro é o tempo desde a carga do deck.

Abrir o deck e falar dois minutos na capa significa chegar no slide do fluxo com
`ms ≈ 120000`. Como o desenho usa `ms % CICLO`, a posição é essencialmente aleatória.

`aula-capitulo/index.html` não tem `IntersectionObserver` em lugar nenhum. `demo-tecnica` e
`pitch-projeto` têm, mas só em cima da digitação e dos contadores; a capa e a órbita ficam
de fora.

## Steps to Reproduce

1. Abrir `templates/decks/mira-studio-demo/index.html` no Chrome.
2. Ficar na capa por 60 segundos sem rolar.
3. Descer até o slide do fluxo com etapas.
4. Observar em que ponto do ciclo o fluxo está.

Esperado: a partícula parte do primeiro nó, com os outros apagados.
Observado: os nós já estão acesos, a partícula está no meio do percurso.

Comparação de controle: o mesmo teste em `templates/decks/mira-default/index.html` entra no
quadro 0.

## Evidence

- [`../../intake/relato-20260818-1211.md`](../../intake/relato-20260818-1211.md), tabela
  "Detalhe da regra 1, template por template", com o veredito de cada um dos oito templates.
- [`../../intake/spec-sincronia-determinista-proposta.md`](../../intake/spec-sincronia-determinista-proposta.md),
  regra 1 do documento do autor.

Não há evidência de navegador: o defeito foi estabelecido por leitura de código. O primeiro
passo do fix é filmar o passo a passo acima.

## Suspected Area

Os quatro templates em `templates/decks/`. O `mira-default` já tem o `reger` pronto para ser
copiado; nenhum código novo precisa ser inventado.

Cuidado com um ponto: `mira-studio-demo` e `mira-studio-full-demo` também aparecem em bugs do
contexto `templates-studio` (BUG-20260731-JZNJ, BUG-20260731-S3TX), que mexem nas mesmas
regiões desses arquivos. Conferir o estado desses bugs antes de aplicar patch.

## Acceptance Criteria

1. Nos quatro templates, todo timer de animação de slide está sob um portão de entrada:
   regente (`reger`) ou reconstrução na entrada com invalidação por geração.
2. Abrir o deck, esperar 60 s na capa e descer até o slide com etapas: a animação começa no
   quadro 0. Verificado em Chrome real, com registro em `evidence/`.
3. Os templates que já estão conformes (`mira-default`, `mira-studio-full-demo`,
   `sandeco-just-animation-template`) não mudam de comportamento.
4. `mesa-tatica` continua com o `requestAnimationFrame` disparado por comando, sem portão de
   visibilidade: lá o gatilho é o Play, e a reprodução é sincronizada por comando de propósito.
5. Teste de regressão que falhe se um template oficial voltar a chamar `d3.timer` fora de um
   portão de entrada.

## Traceability

- **Spec:** nenhuma. `spec-gap`. O contrato de fato é o código do `mira-default:288-308` e o
  comentário do `exemplo-bola.html:225-245`.
- **Código afetado:** listado no front matter, com linha.
- **Causa raiz:** não investigada. A hipótese óbvia é que esses templates são anteriores ao
  `reger` e nunca foram revisitados; confirmar por `git log` no fix.
- **Testes:** nenhum existe. `test/` tem cobertura de builders do Studio, não de tempo.

## Agent Notes

- **Não trate as cinco ocorrências como iguais.** Se o custo for alto, corrija as duas com
  dano real (`mira-studio-demo:838`, `demo-tecnica:380`) e registre a decisão sobre as
  cosméticas. Corrigir tudo por simetria também é defensável, e é barato: o `reger` já existe.
- **Proposta de taxonomia** (`taxonomy.yaml` está vazio): `area: decks`,
  `module: templates-de-deck`, `feature: sincronia-temporal`.
- O `threshold` do `reger` no `mira-default` é 0.6, o documento do autor propõe 0.5. Isso é
  escolha, não defeito. Não mexer sem motivo.
