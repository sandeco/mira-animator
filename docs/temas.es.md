# Temas y plantillas

La apariencia de Mira viene de tres capas en `templates/`. Separan *identidad* (colores, tipografía), *estructura* (tipos de slide) y *ejemplos completos* (decks ejecutables).

```
templates/
├── themes/     # identidad visual vía CSS variables
├── slides/     # blueprints de tipos de slide
└── decks/      # presentaciones completas y ejecutables
```

## Temas

Un tema es un conjunto de CSS variables que definen la identidad visual del deck — colores, acentos, superficies. Al crear un deck, el tema elegido se inyecta en el marcador `/* @MIRA:THEME */`, así que todo el deck hereda una paleta consistente.

| Tema | Vibra |
|---|---|
| `mira-dark` | Oscuro, glassmorphism, acentos neón — el predeterminado. |
| `light-minimal` | Claro, limpio, minimalista. |
| `corporate-blue` | Profesional, azul, corporativo. |
| `neon-emerald` | Oscuro con acentos esmeralda vivos. |

Elige un tema al crear, de forma conversacional con `/mira-new`:

```text
/mira-new crea una presentación llamada 'mi-clase' con el tema neon-emerald
```

## Blueprints de slide

La capa `slides/` guarda blueprints para los **tipos** recurrentes de slide: portada, concepto con animación, comparación, timeline, código, cierre. El builder monta un deck componiendo estos blueprints y rellenándolos con tu contenido. Son cards glassmorphism modulares — glass-card, icon-hero, attribute-pills, replay-btn — navegados uno a uno.

## Plantillas de deck

La capa `decks/` guarda presentaciones completas y ejecutables que sirven de **esqueleto**. Al ejecutar `new`, eliges una plantilla de deck que define la forma general de la presentación:

| Plantilla de deck | Para |
|---|---|
| `aula-capitulo` | Una clase o conferencia a partir de un capítulo / módulo. |
| `pitch-projeto` | Un pitch de proyecto. |
| `demo-tecnica` | Una demo técnica o walkthrough. |
| `sandeco-just-animation-template` | Un escenario #000000, sin texto, solo para animacion libre. |

## Los marcadores `@MIRA:`

Mira usa marcadores en comentario HTML/CSS para coordinar entre los agentes:

| Marcador | Significado |
|---|---|
| `/* @MIRA:THEME */` | Dónde se inyecta el CSS del tema en el deck. |
| `<!-- @MIRA:SIZE N/10 -->` | La percepción de tamaño de una animación. `mira-animator` estampa `3/10`; `mira-size-animator` lo lee y reescribe. |

Normalmente no tocas estos marcadores a mano — los agentes los gestionan — pero saber que existen ayuda a entender cómo está armado un deck.
