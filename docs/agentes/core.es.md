# Agentes core

El corazón de la creación de decks. Mira cómo se conectan en el [Pipeline de agentes](../pipeline.md).

## `/mira-new`
La puerta de entrada de un nuevo deck. Recolecta los requisitos de una presentación de forma conversacional (nombre del tema, plantilla del deck, tema base, color principal y referencias) y monta la carpeta `decks/<tema>/` lista para que el pipeline la rellene. **No** genera slides — prepara el terreno y, al final, ofrece accionar el pipeline.

## `/mira-references`
Crea y organiza la carpeta de referencias por tema, `references/`, dentro del tema del deck, e incluye automáticamente el material que ya esté ahí. Es la forma de informar la fuente de contenido de una presentación específica — siempre por tema, local al tema. Úsala antes de crear un slide cuando el tema aún no tenga carpeta de referencias.

## `/mira-animator`
El corazón de Mira, la **M** de Metáforas Inteligentes Responsivas Animadas. A partir del concepto del slide destila la dinámica, inventa una **analogía concreta de la vida diaria** y la anima con **bucle interno obligatorio**. Aquí viven dos reglas madre: *ninguna animación es literal, toda animación es metáfora*, y *ninguna animación es estática, toda animación entra con coreografía y después continúa en bucle interno.* Funciona en dos modos, **crear** un slide animado nuevo y **reemplazar** la animación de un slide existente en el lugar, manteniendo título, subtítulo y píldoras (*"convierte estos slides en metáforas"*). Estampa cada animación con un marcador `<!-- @MIRA:SIZE 3/10 -->` para que `mira-size-animator` la escale después. También maneja *"convierte esta imagen en un slide animado."*

## `/mira-animated-metaphor`
Atajo compatible de `/mira-animator` (modo reemplazar), mantenido porque está citado en material publicado. Llamar a uno o al otro es lo mismo: las reglas viven solo en `mira-animator`.

## `/mira-img-animator`
Anima una imagen existente — le da vida a una figura estática al estilo del deck.

## `/mira-size-animator`
Ajusta la percepción de tamaño de las animaciones de un deck en una escala de 1 a 10, donde **3/10** es lo que `mira-animator` genera por defecto. Lee el marcador `@MIRA:SIZE` de cada animación, reporta el nivel actual, y escala la composición (radios, longitudes, espaciados, fuentes internas y glow dentro del SVG) para llenar más o menos el escenario — sin cambiar la altura del escenario ni romper el bucle interno. *"Pon las animaciones en 6/10," "este slide en 2/10."*

!!! note "Tamaño y distancia"
    En el formato vertical (9:16), aumentar los elementos también encoge las distancias entre ellos. En el formato horizontal (16:9), solo aumentan los elementos — las distancias quedan como están.

## `/mira-image`
Coloca una imagen que ya tienes (un archivo local o una URL) dentro de un slide, en un card limpio donde queda grande y bien encuadrada. Copia la imagen a la carpeta `assets/` del deck y la referencia por una ruta relativa, así que el deck se mantiene autosuficiente y se abre directo desde `file://` sin servidor (una `<img>` común no sufre el bloqueo de CORS que afecta al `.glb`). Mismo card limpio que `mira-3d` y `mira-qrcode`: solo el título y la imagen maximizada, sin leyenda debajo. La imagen queda estática (`object-fit: contain` por defecto, así que no se recorta nada); el bucle interno vive en el marco (un glow que respira), sin distorsionar nunca la imagen. Para **generar** una imagen nueva usa `mira-visuals`; para **animar** una imagen existente usa `mira-img-animator`; esta solo **coloca** una imagen lista.

## `/mira-get-videos`
Descarga los videos de fondo de Mira a `mira-templates/videos_header/`. Úsala cuando un encabezado se vea vacío, o justo después de instalar si quieres los fondos en video.
