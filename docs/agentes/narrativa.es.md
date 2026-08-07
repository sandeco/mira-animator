# Agentes de narrativa

Una cadena narrativa de ocho etapas que transforma un hecho, un concepto o un tema en historia, y la historia en escenas puestas en cuadro y coreografiadas. Viene siempre instalada, con el **Story Team**.

Está **antes** del deck. Ninguno de estos agentes escribe HTML. Entregan el resultado a `/mira-animator`, que escribe la animación dentro del `index.html` del deck, y a `/mira-builder`, que monta el resto.

```text
cinema-deck (orquestra)
  |
  v
premise-forge -> concept-storyteller -> story-architect -> design-audience-journey
             -> direct-slide-sequence -> direct-scene -> direct-cinematic-motion
             -> scene-brief -> asset-scout
             -> mira-animator escribe el deck
```

Puedes entrar en cualquier punto. Si la premisa ya existe, empieza en la etapa 2. Si la Story Bible está sólida, usa las tres últimas.

## `/mira-cinema-deck`

El orquestador de toda la cadena. Crea el deck con el modo cine ya instalado (`new --cinema`),
ejecuta los ocho agentes narrativos en orden con una pausa entre cada uno, y entrega el Motion
Score a `/mira-animator`, que lo convierte en código. Existe porque la cadena se degrada en
silencio sin él: sin `mira-cinema.js` en el deck, `/mira-direct-cinematic-motion` se ve obligado a
producir dirección **sin** cámara, gradación ni planos de profundidad, y recibes un deck común
creyendo que pediste cine.

`--cinema` deja en el deck el `mira-cinema.js`, el `mira-foco.js` (modo cámara en la **tecla C**, donde ajustas los cues en pantalla y grabas con `Ctrl+S`) y un `servidor.bat` en la raíz. **Un deck cinematográfico se autora por el `servidor.bat`**, porque el `Ctrl+S` solo escribe directo en el archivo por `http://localhost`; en `file://` depende del selector de archivos de Chrome. Para presentar, el doble clic en `index.html` sigue valiendo.

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

## `/mira-scene-brief`

Destila toda la cadena en un **briefing de escena corto y autosuficiente por diapositiva**: título en pantalla, función dramática, anclas de entrada y de salida, objetos con su nombre real, historia en tres tiempos, loop, temperamento y prohibiciones. Es el último paso que produce texto, y existe para que quien dibuja la diapositiva nunca lea la cadena: la cadena sigue entera, solo deja de leerse.

El ancla es el campo que sostiene el deck. El ancla de salida de una diapositiva es literalmente la de entrada de la siguiente, con posición declarada, o el deck se lee como escenas bonitas sin historia.

## `/mira-asset-scout`

Decide de dónde viene cada actor de la escena, antes de que alguien lo dibuje. Devuelve una tabla con tres salidas posibles por objeto: **dibujar**, cuando la geometría es simple y procedural (un skyline, una malla, un plano en líneas); **buscar**, cuando ya existe en una fuente abierta, y entonces el SVG se incrusta inline en el deck, se recolorea a los tokens del tema y se acredita en `CREDITS.md`; **pedir**, cuando no se encuentra, y entonces el autor recibe una petición corta con plan B en lugar de que el deck se trabe.

Existe por una lista de prohibiciones, no por una preferencia. Figura humana, mano, rostro, animal, vehículo y anatomía articulada **nunca** pueden ser dibujados a mano por quien implementa la escena. Un deck cinematográfico salió con la ciudad impecable y las personas en forma de trapecio con una bola encima, porque la regla anterior decía "prefiere un icono" y una preferencia se ignora.

## Lo que estos agentes no pueden inventar

Dirigen contra lo que Mira realmente ejecuta. Mira no tiene motor de animación, ni IR ni compilador: quien escribe la escena es el agente, en D3 con SVG, GSAP y CSS, dentro del deck, que abre por `file://` con doble clic, offline y sin build.

Por eso la salida es dirección en texto, nunca un contrato de runtime, y el stack es D3 con SVG, GSAP por `mira-cinema.js` y CSS 3D. PixiJS, Three.js, Lottie, Rive, Motion Canvas y Paper.js quedan fuera.

Luz de escena, ancla declarada entre slides y capa de atmósfera están planificadas y todavía no existen. Donde la escena pide una de ellas, la dirección registra la intención y la marca como pendiente, sin escribir una llamada de API.
