# Formatos de vídeo

Un deck 16:9 es la fuente de verdad. A partir de él, Mira genera archivos extra para otras proporciones y transiciones — **sin nunca tocar el original**. Cada agente de formato escribe un nuevo archivo al lado del `index.html`.

```
decks/mi-clase/
├── index.html              # el deck 16:9 original
├── index-1x1.html          # mira-squared
├── index-9x16.html         # mira-vertical
├── index-thirds.html       # mira-thirds
└── index-dissolve.html     # mira-transition-dissolve
```

## Cuadrado — `/mira-squared`

Una versión **1:1 (1080×1080)**, para el feed de Instagram, LinkedIn y otros espacios cuadrados. Fija cada slide en el marco cuadrado y reduce los espacios laterales, con marco fijo y ajuste ligero. Centrado por defecto, con opción de alinear a la izquierda o a la derecha. También puede crear slides cuadrados desde cero en la geometría nativa cuando no hay deck de origen.

→ `index-1x1.html`

## Vertical — `/mira-vertical`

Una versión **9:16 (1080×1920)**, para Reels, Shorts, TikTok y Stories. Cada slide de contenido se reduce a solo el título principal arriba y un canvas de animación alto y estandarizado debajo — subtítulo, header del card y píldoras de la base salen, y el título se encoge solo hasta caber en máximo 2 líneas. El movimiento clave: el **eje de cada animación se reformula para el retrato** (un flujo horizontal pasa a vertical, una elipse ancha pasa a alta, una comparación lado a lado pasa a apilada). Texto, colores, timings y el bucle quedan intactos — solo cambian posición, eje y altura del viewBox. Fuera de la columna, el fondo queda `#333333`.

→ `index-9x16.html`

!!! tip "Aumentar elementos en vertical"
    En 9:16, cuando le pides a `mira-size-animator` que aumente los elementos, también reduce las distancias entre ellos para que la composición quede compacta. En 16:9, solo aumentan los elementos.

## Regla de los tercios — `/mira-thirds`

Una variante de **composición** que **no** cambia la proporción. Empuja el contenido de cada slide (título, animación y píldoras) a las columnas 1 y 2 de una grilla 3×3 — los dos tercios de la izquierda — y deja la columna de la derecha entera libre. Esa columna libre queda reservada para que superpongas texto, lower-third o el video del presentador durante la edición.

Compone sobre cualquier base: 16:9, el cuadrado 1:1 o el vertical 9:16. El lado libre es la derecha por defecto y puede invertirse a la izquierda.

→ `index-thirds.html`

## Transición disolvencia — `/mira-transition-dissolve`

Una variante de **transición**. Cambia el scroll suave entre cards por un **crossfade** real (disolvencia, estilo Canva/Keynote) usando la View Transitions API (same-document). Un slide se deshace en el otro.

Por ser same-document, funciona directo desde `file://` sin servidor (Chrome/Edge). Los navegadores sin la API simplemente navegan normalmente.

→ `index-dissolve.html`

## Consejo de grabación

Para convertir cualquiera de estos en video, abre el archivo y graba la pantalla con el viewport del navegador ajustado a la resolución del formato (1920×1080, 1080×1080 o 1080×1920). Los bucles internos mantienen cada slide vivo mientras grabas.
