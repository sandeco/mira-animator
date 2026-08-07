---
name: mira-cinema-deck
description: >-
  Orquestrar o deck cinematográfico de ponta a ponta: a cadeia narrativa do Story Team decide a
  história, o deck nasce com o modo cinema instalado e o mira-animator implementa a partitura com
  câmera, profundidade e grade de cor. Usar quando o usuário pedir deck cinematográfico, deck com
  história, deck com câmera, usar o Story Team, ou a sequência inteira da premissa até o HTML
  animado. Não usar para slide avulso, que é do mira-animator, nem para deck rápido, que é do
  mira-fast e não tem cinema.
---

# MIRA Cinema Deck

Um tema entra; sai um deck com história, encenação e câmera. Esta skill **não escreve HTML nem
inventa metáfora**: ela conduz a ordem, instala o que precisa existir e passa o bastão. Quem
escreve a animação continua sendo o `/mira-animator`.

## Por que ela existe

A cadeia narrativa e o modo cinema já existiam separados, e não se encontravam sozinhos:

- o `/mira-direct-cinematic-motion` escreve partitura de câmera, mas se o deck não tiver o
  `mira-cinema.js` ele é obrigado a produzir direção **sem** câmera, grade nem planos;
- o `mira-cinema.js` é opt-in e não entra em deck nenhum por padrão;
- sem alguém instalar o módulo **antes** da direção, a cadeia inteira degrada em silêncio e o
  usuário recebe um deck comum achando que pediu cinema.

Esta skill é o que fecha esse laço, e a ordem abaixo é o motivo dela.

## Pré-condições, checadas antes de qualquer coisa

1. **Story Team instalado.** Confira se `/mira-premise-forge` existe. O Story Team é obrigatório e
   chega em toda instalação; se mesmo assim não existir, pare e diga:
   > "O Story Team não está instalado. Rode `npx mira-animator update` para trazê-lo."

   Não emule os agentes narrativos dentro desta skill. Um orquestrador que finge ser a cadeia
   entrega texto sem o método dela.
2. **Fonte ou tema.** Sem material nenhum, pergunte de onde vem a história antes de começar.

## A ordem, e por que é essa

### Fase 0, o deck nasce com cinema

**ANTES da direção, não depois.** É a única ordem que funciona:

```bash
npx mira-animator new <slug> --cinema
```

Isso instala `mira/mira-cinema.js` e `assets/vendor/gsap.min.js` e injeta as tags na ordem certa
(GSAP antes do módulo, os dois antes dos módulos de autoria). A instalação é do CLI, e não sua:
copiar biblioteca e injetar tag é passo determinístico, e é onde um agente falha em silêncio.

Confira que `decks/<slug>/mira/mira-cinema.js` existe antes de seguir. Se não existir, pare: toda
a direção de câmera das fases seguintes seria descartada.

Coloque o material-fonte em `decks/<slug>/references/` agora.

### Fase 1, a história (Story Team)

Na ordem, um de cada vez, com o resultado de cada um alimentando o seguinte:

| # | Agente | Entrega |
|---|---|---|
| 1 | `/mira-premise-forge` | Premise Brief |
| 2 | `/mira-concept-storyteller` | Concept Contract |
| 3 | `/mira-story-architect` | Story Bible |
| 4 | `/mira-design-audience-journey` | Audience Journey Map |
| 5 | `/mira-direct-slide-sequence` | MIRA Slide Score, uma cena por slide |
| 6 | `/mira-direct-scene` | encenação: composição, planos com oclusão, enquadramento, grade do deck |
| 7 | `/mira-direct-cinematic-motion` | MIRA Motion Score: temperamento, beats, câmera, easing, loop |

**Dá para entrar no meio.** Se a premissa já existe, comece na 2; se a Story Bible está de pé, use
as três últimas. Diga ao usuário em qual etapa você entrou e por quê.

**Pare entre as etapas** e mostre a entrega. É deck que precisa convencer: vetar uma premissa custa
uma mensagem, vetar um deck pronto custa a geração inteira.

Grave cada entrega em `decks/<slug>/references/`, senão a etapa seguinte reconstrói de memória.

### Fase 2, o deck

| # | Agente | Papel |
|---|---|---|
| 8 | `/mira-builder` | monta o HTML a partir do Slide Score |
| 9 | `/mira-animator` | **implementa** a partitura: metáfora, câmera, planos e grade |
| 10 | `/mira-validator` | relatório de conformidade |

O passo 9 é onde o cinema vira código. O `/mira-animator` já conhece a API (`MiraCinema.palco`,
`Cam.*`, `Prof.*`, `Grade.*`) e os tetos. Entregue a ele o Motion Score inteiro, não um resumo.

## Depois de pronto: a câmera se ajusta na tela, não no código

O deck sai com a câmera que o Motion Score pediu, e ela quase nunca fica certa de primeira, porque
enquadramento é decisão de olho. O ajuste fino é do autor, no navegador, com a **tecla C**:

- quatro pistas, uma por efeito (zoom, travelling, tremor, tensão), para efeitos **sobrepostos** no
  tempo, que é o normal e não a exceção;
- a agulha da régua percorre a cena quadro a quadro, para achar o instante exato de um cue;
- intensidade e duração dos abalos em slider, com prévia ao vivo;
- `Ctrl+S` grava tudo como comentários `@MIRA:FOCO`, `@MIRA:CICLO`, `@MIRA:LOOP` e `@MIRA:VOLTA`
  dentro da `<section>`, no arquivo. Sobrevive ao F5 e ao próximo agente que abrir o deck.

Não reescreva no código cue que o autor ajustou na tela. Os marcadores são a fonte da verdade da
câmera depois que o deck existe: o código do slide conta a história, os marcadores enquadram.

## Regras que valem sobre tudo

- **A grade de cor é do DECK, uma só.** Quem decide é o `/mira-direct-scene`, na fase 1, e todos os
  slides herdam. Grade escolhida slide a slide vira ruído, e é assim que um deck vira dez filmes.
- **Temperamento `sereno` é o padrão.** `tenso` só quando a cena pede tensão. Pedido implícito não
  conta.
- **A nota de corte do `/mira-animator` (85, sem veto) é avaliada com o cinema desligado.** Câmera,
  grade e profundidade entram depois de a cena passar, nunca para fazê-la passar. Se ao desligar os
  quatro a animação deixa de contar a história, volte à metáfora.
- **Nenhum agente da fase 1 escreve HTML.** Se algum entregar código, descarte e peça direção.
- **`file://`, offline e ausência de build são premissa.** O deck tem que abrir com duplo clique.

## Quando NÃO usar esta skill

| Caso | Use |
|---|---|
| Um slide avulso | `/mira-animator` |
| Deck rápido, sem história | `/mira-fast` ou `/mira-ultrafast`, que não têm cinema de propósito |
| Deck de gravação com teleprompter | `/mira-studio` ou `/mira-studio-full` |
| Trocar a animação de um slide existente | `/mira-animator` no modo substituir |

## Entrega

Ao terminar, diga:

1. o caminho do deck e quantos slides tem;
2. a grade escolhida e o temperamento dominante;
3. quantos cues de câmera entraram, e em quais slides;
4. o que o usuário deve **olhar** para aprovar: a história aparece com o título escondido? o corte
   do loop aparece? o Replay deixa dois atores rodando? a câmera tem razão narrativa em cada cue?
5. o que ficou de fora, se ficou.

A conferência no navegador é do usuário. Não afirme que assistiu à animação.
