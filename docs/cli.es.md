# CLI

Todos los comandos se ejecutan con `npx mira-animator <comando>` (el binario también está disponible como `mira` una vez instalado).

```bash
npx mira-animator --help        # lista los comandos
npx mira-animator --version      # muestra la versión
```

## Comandos

| Comando | Descripción |
|---|---|
| `install` | Instala Mira en la carpeta actual (agentes, plantillas, config). |
| `link <ruta>` | Vincula una carpeta o archivo como fuente de contenido. |
| `sources` | Lista las fuentes vinculadas. |
| `new <nombre>` | Crea un deck a partir de una plantilla. |
| `edit <deck>` | Instala/actualiza las **herramientas de autoría** (modo edición E — reordenar, edición libre, crop con Alt — y dibujo P) en un deck existente, y **actualiza el grabador nativo** en los decks Studio. |
| `memoria <subcomando>` | Consulta y administra la memoria local de preferencias. |
| `status` | Muestra el estado de la instalación y los decks. |
| `update` | Actualiza agentes y plantillas a la última versión. |
| `uninstall` | Elimina Mira de la carpeta actual. |

## `install`

```bash
npx mira-animator install
```

Copia los agentes a `.claude/skills/`, las plantillas a `mira-templates/`, crea `decks/` y escribe `mira.config.json` + `CLAUDE.md`. Mira [Instalación](instalacao.md).

## `link`

```bash
npx mira-animator link <ruta> [--name=<alias>] [--type=projeto|pdf|latex|texto]
```

Vincula una carpeta o archivo como fuente de contenido de solo lectura.

| Opción | Significado |
|---|---|
| `--name=<alias>` | Alias corto usado después para referirte a la fuente. |
| `--type=...` | `projeto`, `pdf`, `latex` o `texto`. Inferido si se omite. |

Mira [Fuentes vinculadas](fontes.md).

## `sources`

```bash
npx mira-animator sources
```

Lista cada fuente vinculada con su alias, tipo y ruta.

## `new`

Hay dos formas de crear un deck. Desde la CLI:

```bash
npx mira-animator new mi-clase [--deck=<plantilla>] [--theme=<tema>]
```

O conversando con `/mira-new`:

```text
/mira-new crea una presentación llamada 'mi-clase' con la plantilla aula-capitulo y el tema mira-dark
```

Ambas formas montan `decks/<nombre>/`, crean `references/`, instalan las herramientas de edición y dibujo en `mira/`, copian las bibliotecas offline a `assets/vendor/` y registran el deck. Las opciones se leen dinámicamente desde `templates/`; ejecuta `npx mira-animator new` sin nombre para ver los valores instalados.

| Elección | Valores |
|---|---|
| Plantilla | `mira-default` (por defecto), `aula-capitulo`, `pitch-projeto`, `demo-tecnica`, `sandeco-just-animation-template`, `mesa-tatica`, `mira-studio-demo`, `mira-studio-full-demo` |
| Tema | `mira-dark`, `light-minimal`, `corporate-blue`, `neon-emerald` |

## `edit`

```bash
npx mira-animator edit <deck>
```

Aplica las **herramientas de autoría** a un deck que ya existe: copia `mira-edit.js`, `mira-edit-free.js` y `mira-draw.js` a `<deck>/mira/` e inyecta los scripts antes de `</body>`. Abre el deck y pulsa **E** para editar (reordenar slides + edición libre: mover, redimensionar, girar, duplicar, eliminar, editar texto y **recortar con Alt + asa**, estilo OBS Studio) o **P** para dibujar encima, luego guarda. Los decks nuevos ya vienen con todo. También es el comando de **migración**: ejecuta `npx mira-animator edit <deck>` en decks antiguos para actualizarlos a la última versión de las herramientas (incluido el crop con Alt). **También actualiza el grabador** (`mira-record.js` / `mira-record-16x9.js`) en los decks Studio, que es como las correcciones de audio y de sincronía A/V de 0.1.61 llegan a un deck que ya existe — un deck creado antes de esa versión conserva el grabador antiguo hasta que ejecutes esto. Mira [Agentes útiles](agentes/uteis.md) para saber cómo funcionan el reorder y el guardado.

## `memoria`

```bash
npx mira-animator memoria lembrancas [--papel portada] [--formato 16x9] [--tema mira-dark] [--eixo color] [--registro nombre]
npx mira-animator memoria nota "menos texto por slide" --eixo densidad
npx mira-animator memoria consolidar [--simular]
npx mira-animator memoria estado <archivo.md> <ativo|suspenso|revogado|candidato|observado>
npx mira-animator memoria listar
npx mira-animator memoria onde
```

`lembrancas` selecciona las preferencias aplicables al contexto; `--registro` guarda la procedencia fuera del deck. `nota` crea una instrucción explícita activa. `consolidar` detecta correcciones recurrentes y crea candidatas; `--simular` no escribe. `estado` cambia el ciclo de vida sin borrar la nota. `listar` muestra notas y refuerzos; `onde` muestra las rutas de memoria y evidencia. Todo vive en `~/.mira-memory/` por defecto; `MIRA_MEMORY_DIR` permite cambiar esa ruta.

## `storyboard`

Concept Storyboard: el borrador barato que valida la idea antes de que se convierta en animación.

```bash
npx mira-animator storyboard render <deck>/storyboard
npx mira-animator storyboard render <deck>/storyboard --no-png
npx mira-animator storyboard verify <deck>
```

El `render` lee cada escena `.json` de la carpeta y escribe el `.svg` y el `.png` al lado de cada una, más la hoja de contacto `storyboard/index.html`, que abre en `file://` sin servidor. La rasterización usa Chrome headless; sin él los SVG y la hoja salen igual y solo se omite el PNG.

El `verify` responde una sola pregunta: ¿el concepto aprobado llegó a las diapositivas? Compara los marcadores `@MIRA:CONCEPT` contra `storyboard/approved/`, y reporta referencia rota, diapositiva sin marcador y briefing sin la sección obligatoria. **Nunca escribe ni corrige nada**: corregir es decisión tuya. Un deck sin `storyboard/concept-brief.md` simplemente *no está vinculado*, lo cual no es un defecto: lo dice en una línea y sale con 0.

## `status`

```bash
npx mira-animator status
```

Muestra el estado de la instalación y los decks existentes.

## `update`

```bash
npx mira-animator update
```

Actualiza los agentes y plantillas a la última versión.

## `uninstall`

```bash
npx mira-animator uninstall
```

Elimina Mira de la carpeta actual.
