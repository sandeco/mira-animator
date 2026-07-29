# Agentes útiles

La cadena de contenido que alimenta el montaje. Mira cómo se conectan en el [Pipeline de agentes](../pipeline.md).

## `/mira-extract`
El extractor de contexto. Lee una fuente vinculada en `mira.config.json` (carpeta de proyecto, PDF, LaTeX o texto) y produce un briefing estructurado que alimenta al planner. Primer eslabón de la cadena.

## `/mira-planner`
Planificador de contenido. Analiza el contenido de un capítulo (LaTeX, PDF o texto) y produce un plan de slides detallado **antes** de cualquier montaje visual — cuántos slides, qué cubre cada uno, la estructura — y espera aprobación.

## `/mira-copywriter`
Refina el texto de los slides y especifica imágenes, bajando el texto a la altura de slide (corto, directo, presentable) en vez de la altura de párrafo.

## `/mira-validator`
Analiza el HTML generado y valida conformidad visual, estructural y de assets — un reporte final de calidad. Ejecútalo después de un montaje, o para diagnosticar un deck existente.

## Modo edición: `mira edit`
Reordena los slides de un deck **después** del montaje, sin regenerarlo. Los decks nuevos ya vienen con el modo edición incorporado; para activarlo en un deck que ya existe, ejecuta la CLI:

```bash
npx mira-animator edit <deck>   # nombre del deck, carpeta del deck o la ruta del index.html
```

Eso copia `mira-edit.js`, `mira-edit-free.js` y `mira-draw.js` a `<deck>/mira/` e inyecta las tres etiquetas antes de `</body>`. La edición libre carga después del editor base. Pulsa **E** para editar y **P** para dibujar.

**Cómo funciona el reorder**

1. Abre el deck y pulsa **E** (o añade `?edit=1` a la URL) para activar y desactivar el modo edición.
2. Cada slide muestra el número de su posición y flechas **↑ ↓**. Haz clic en ellas para subir o bajar el slide; la numeración se actualiza al instante.
3. Haz clic en **Guardar orden** para escribir el nuevo orden de vuelta en el `index.html` de origen. **Esc** o **Salir** abandona el modo (avisa antes si hay cambios sin guardar).

El guardado no serializa el DOM en vivo (que GSAP, D3 o Lucide ya modificaron): relee el archivo fuente y cambia solo los bloques de texto entre los marcadores `<!-- ... SLIDE ... -->`, de modo que el formato queda intacto. Funciona en el layout Mira (los slides son `<section>` en `<body>`) y en decks GSAP heredados (slides dentro de `<main>`).

Sirve el deck por HTTP para guardar sin ningún diálogo:

```bash
node lib/mira-serve.js decks/<nombre>
```

Desde `file://`, la File System Access API de Chrome te pide señalar el `index.html` una vez (recordado durante la sesión); los navegadores sin ella recurren a copiar el nuevo orden para que lo pases de vuelta.
