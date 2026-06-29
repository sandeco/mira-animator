# Cómo usar

Esta página recorre el flujo completo, desde una carpeta vacía hasta un deck animado listo.

## 1. Instala y vincula

```bash
cd mi-carpeta-de-slides
npx mira-animator install
npx mira-animator link ../mi-proyecto --name=miproyecto
```

Mira [Instalación](instalacao.md) y [Fuentes vinculadas](fontes.md) para más detalles.

## 2. Crea un deck

Crear un deck es conversacional — solo habla con `/mira-new` dentro de Claude:

```text
/mira-new crea una nueva presentación llamada 'mi-clase'
```

Pregunta el nombre del tema, la plantilla del deck, el tema base, el color principal y referencias, luego monta la carpeta `decks/<tema>/` y ofrece accionar el pipeline. También puedes indicar la plantilla y el tema en la misma frase:

```text
/mira-new crea una presentación llamada 'mi-clase' con la plantilla aula-capitulo y el tema mira-dark
```

**Plantillas de deck**

| Plantilla | Para |
|---|---|
| `aula-capitulo` | Una clase o conferencia a partir de un capítulo / módulo |
| `pitch-projeto` | Un pitch de proyecto |
| `demo-tecnica` | Una demo técnica / walkthrough |
| `animacao-livre` | Un escenario negro, sin texto, solo para la animacion de Mira |

**Temas:** `mira-dark`, `light-minimal`, `corporate-blue`, `neon-emerald`.

## 3. Rellena el deck

De vuelta en Claude, apunta un deck a una fuente en lenguaje natural:

> *"rellena el deck mi-clase con el contenido de la fuente miproyecto"*

Esto dispara el [pipeline de agentes](pipeline.md):

```mermaid
flowchart LR
    E[mira-extract] --> P[mira-planner]
    P --> C[mira-copywriter]
    C --> B[mira-builder]
    B --> A[mira-animator]
    A --> V[mira-validator]
```

Cada orquestador **pausa entre los agentes** y te mantiene en control. El planner, en particular, te muestra el plan de slides y espera aprobación antes de montar nada.

## 4. Ajusta las animaciones

Con el deck montado, puedes moldear el movimiento:

- **Tamaño** — *"pon las animaciones en 6/10"* o *"este slide está pequeño, déjalo en 7/10"*. El agente `mira-size-animator` escala la percepción de tamaño de cada animación en una escala de 1 a 10 (el valor por defecto que genera `mira-animator` es 3/10).
- **Metáfora** — *"convierte este concepto en una metáfora animada"*. El agente `mira-animated-metaphor` reemplaza la animación de un slide por una analogía concreta de la vida diaria, manteniendo el título y las píldoras.
- **Visuales** — pide a `mira-visuals` paneles estáticos, diagramas o infografías, o a `mira-chart` gráficos de datos a partir de un CSV/JSON, una imagen, o incluso un boceto a mano.
- **3D, QR e imágenes:** coloca un elemento 3D real y auto-rotante con `/mira-3d`, un código QR escaneable (a partir de un enlace o texto) con `/mira-qrcode`, o una imagen que ya tienes con `/mira-image`. Un slide 3D que carga un `.glb` necesita un servidor local (el agente arranca uno y escribe un lanzador de doble clic); todo lo demás se abre desde `file://`.
- **Morph de formas:** haz que una forma SVG se transforme en otra en bucle con `/mira-svg-morph` (pasas los archivos), o `/mira-icon-morph` para hacerlo a partir de conceptos en palabras, con íconos buscados y licenciados en Iconify.
- **Animar un SVG:** haz que un SVG que provees se mueva (batir, girar, deslizar, pulsar, dibujar) con `/mira-svg-animator`; si es un path único fusionado, separa la parte a animar.

## 5. Abre y presenta

El deck es un `decks/mi-clase/index.html` autocontenido. Doble clic — corre desde `file://`, sin servidor. Navega card por card. Para hacer un video, graba la pantalla con el viewport ajustado a la resolución del formato objetivo.

## 6. Exporta a otros formatos (opcional)

A partir del mismo deck 16:9, sin tocar el original, puedes generar versiones cuadrada, vertical, en regla de los tercios y con transición disolvencia. Mira [Formatos de vídeo](formatos.md).

## Una nota sobre el idioma

Mira genera el contenido del deck en el idioma en que trabajas. La regla de idioma compartida vive en `agents/_shared/idioma.md` y la respetan todos los agentes, así que los slides salen en tu idioma, no en el predeterminado del agente.
