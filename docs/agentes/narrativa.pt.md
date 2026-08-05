# Agentes de narrativa

Uma cadeia narrativa de sete etapas que transforma um fato, um conceito ou um tema em história, e a história em cenas encenadas e coreografadas. É opcional: instale com o **Story Team**.

Ela fica **antes** do deck. Nenhum desses agentes escreve HTML. Eles entregam o resultado ao `/mira-animator`, que escreve a animação dentro do `index.html` do deck, e ao `/mira-builder`, que monta o resto.

```text
cinema-deck (orquestra)
  |
  v
premise-forge -> concept-storyteller -> story-architect -> design-audience-journey
             -> direct-slide-sequence -> direct-scene -> direct-cinematic-motion
             -> mira-animator escreve o deck
```

Dá para entrar em qualquer ponto. Se a premissa já existe, comece na etapa 2. Se a Story Bible está sólida, use as três últimas.

## `/mira-cinema-deck`

O orquestrador da cadeia inteira. Cria o deck já com o modo cinema instalado (`new --cinema`), roda
os sete agentes narrativos na ordem com pausa entre eles, e entrega o Motion Score ao
`/mira-animator`, que o transforma em código. Ele existe porque a cadeia degrada em silêncio sem
alguém no comando: sem o `mira-cinema.js` no deck, o `/mira-direct-cinematic-motion` é obrigado a
produzir direção **sem** câmera, grade nem planos de profundidade, e você recebe um deck comum
achando que pediu cinema.

## `/mira-premise-forge`

Pesquisa fatos atuais, notícias, lançamentos e disputas, desenterra o momento Eureca escondido neles e o transforma em uma premissa defensável e visualmente potente. Entrega um **Premise Brief** com o princípio organizador, a espinha causal e os limites factuais que a história não pode ultrapassar.

## `/mira-concept-storyteller`

Estabelece o **Concept Contract**: o que a história precisa ensinar, o que pode simplificar e o que nunca pode distorcer. É a âncora de verdade contra a qual todas as etapas seguintes são auditadas.

## `/mira-story-architect`

Constrói a **Story Bible**: sete passos estruturais, rede de personagens, tema, mundo, rede de símbolos, trama, teia de cenas e diálogo.

## `/mira-design-audience-journey`

Projeta o estado mental e emocional do público beat a beat, produzindo um **Audience Journey Map** com ledgers de curiosidade e revelação: o que é entregue, o que fica retido e quando o payoff acontece.

## `/mira-direct-slide-sequence`

Transforma história e jornada em um **MIRA Slide Score**: uma cena por slide, com função dramática, quadro inicial, ação, microvirada, revelação, informação retida, narração, texto de tela mínimo e transição causal para o slide seguinte.

## `/mira-direct-scene`

Dirige a **encenação**, tudo que existe antes do movimento: composição, blocking, silhueta e escala, 3 a 5 planos de profundidade com oclusão declarada, chão e apoio, enquadramento base e área segura, legibilidade, a grade de cor única do deck e a continuidade visual entre slides vizinhos.

## `/mira-direct-cinematic-motion`

Converte as cenas encenadas em um **MIRA Motion Score**: temperamento, beats em timeline com labels, os seis cues de câmera, easing semântico, loop interno, transição de saída, responsividade, reduced motion e fallbacks. Termina em um handoff que o `/mira-animator` implementa.

## O que esses agentes não podem inventar

Eles dirigem contra o que o Mira de fato executa. O Mira não tem motor de animação, IR nem compilador: quem escreve a cena é o agente, em D3 com SVG, GSAP e CSS, dentro do deck, que abre por `file://` com duplo clique, offline e sem build.

Por isso a saída é direção em texto, nunca um contrato de runtime, e a stack é D3 com SVG, GSAP pelo `mira-cinema.js` e CSS 3D. PixiJS, Three.js, Lottie, Rive, Motion Canvas e Paper.js estão fora.

Luz de cena, âncora declarada entre slides e camada de atmosfera estão planejadas e ainda não existem. Onde a cena pede uma delas, a direção registra a intenção e marca como pendente, sem escrever chamada de API.
