# Agentes de narrativa

Una cadena narrativa de siete etapas que transforma un hecho, un concepto o un tema en historia, y la historia en escenas puestas en cuadro y coreografiadas. Es opcional: instálala con el **Story Team**.

Está **antes** del deck. Ninguno de estos agentes escribe HTML. Entregan el resultado a `/mira-animator`, que escribe la animación dentro del `index.html` del deck, y a `/mira-builder`, que monta el resto.

```text
cinema-deck (orquestra)
  |
  v
premise-forge -> concept-storyteller -> story-architect -> design-audience-journey
             -> direct-slide-sequence -> direct-scene -> direct-cinematic-motion
             -> mira-animator escribe el deck
```

Puedes entrar en cualquier punto. Si la premisa ya existe, empieza en la etapa 2. Si la Story Bible está sólida, usa las tres últimas.

## `/mira-cinema-deck`

El orquestador de toda la cadena. Crea el deck con el modo cine ya instalado (`new --cinema`),
ejecuta los siete agentes narrativos en orden con una pausa entre cada uno, y entrega el Motion
Score a `/mira-animator`, que lo convierte en código. Existe porque la cadena se degrada en
silencio sin él: sin `mira-cinema.js` en el deck, `/mira-direct-cinematic-motion` se ve obligado a
producir dirección **sin** cámara, gradación ni planos de profundidad, y recibes un deck común
creyendo que pediste cine.

## `/mira-premise-forge`

Investiga hechos actuales, noticias, lanzamientos y disputas, desentierra el momento Eureka escondido en ellos y lo convierte en una premisa defendible y visualmente potente. Entrega un **Premise Brief** con el principio organizador, la espina causal y los límites factuales que la historia no puede cruzar.

## `/mira-concept-storyteller`

Establece el **Concept Contract**: lo que la historia tiene que enseñar, lo que puede simplificar y lo que nunca puede distorsionar. Es el ancla de verdad contra la que se auditan todas las etapas siguientes.

## `/mira-story-architect`

Construye la **Story Bible**: siete pasos estructurales, red de personajes, tema, mundo, red de símbolos, trama, red de escenas y diálogo.

## `/mira-design-audience-journey`

Diseña el estado mental y emocional del público beat a beat, produciendo un **Audience Journey Map** con ledgers de curiosidad y revelación: qué se entrega, qué queda retenido y cuándo llega el payoff.

## `/mira-direct-slide-sequence`

Transforma historia y trayecto en un **MIRA Slide Score**: una escena por slide, con función dramática, cuadro inicial, acción, microgiro, revelación, información retenida, narración, texto en pantalla mínimo y transición causal hacia el slide siguiente.

## `/mira-direct-scene`

Dirige la **puesta en escena**, todo lo que existe antes del movimiento: composición, blocking, silueta y escala, de 3 a 5 planos de profundidad con oclusión declarada, suelo y apoyo, encuadre base y área segura, legibilidad, la única gradación de color del deck y la continuidad visual entre slides vecinos.

## `/mira-direct-cinematic-motion`

Convierte las escenas en un **MIRA Motion Score**: temperamento, beats en una timeline con labels, los seis cues de cámara, easing semántico, loop interno, transición de salida, responsividad, reduced motion y fallbacks. Termina en un handoff que `/mira-animator` implementa.

## Lo que estos agentes no pueden inventar

Dirigen contra lo que Mira realmente ejecuta. Mira no tiene motor de animación, ni IR ni compilador: quien escribe la escena es el agente, en D3 con SVG, GSAP y CSS, dentro del deck, que abre por `file://` con doble clic, offline y sin build.

Por eso la salida es dirección en texto, nunca un contrato de runtime, y el stack es D3 con SVG, GSAP por `mira-cinema.js` y CSS 3D. PixiJS, Three.js, Lottie, Rive, Motion Canvas y Paper.js quedan fuera.

Luz de escena, ancla declarada entre slides y capa de atmósfera están planificadas y todavía no existen. Donde la escena pide una de ellas, la dirección registra la intención y la marca como pendiente, sin escribir una llamada de API.
