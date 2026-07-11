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
| `edit <deck>` | Instala/actualiza las **herramientas de autoría** (modo edición E — reordenar, edición libre, crop con Alt — y dibujo P) en un deck existente. |
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

## Crear un deck (`/mira-new`)

Crear un deck **no** es un comando de CLI — lo haces conversando con Mira en Claude, mediante la skill `/mira-new`:

```text
/mira-new crea una nueva presentación llamada 'mi-clase'
```

Monta `decks/<nombre>/` a partir de una plantilla y registra el deck. Puedes indicar la plantilla y el tema en la misma frase:

```text
/mira-new crea una presentación llamada 'mi-clase' con la plantilla aula-capitulo y el tema mira-dark
```

| Elección | Valores |
|---|---|
| Plantilla | `aula-capitulo`, `pitch-projeto`, `demo-tecnica`, `sandeco-just-animation-template` |
| Tema | `mira-dark`, `light-minimal`, `corporate-blue`, `neon-emerald` |

## `edit`

```bash
npx mira-animator edit <deck>
```

Aplica las **herramientas de autoría** a un deck que ya existe: copia `mira-edit.js`, `mira-edit-free.js` y `mira-draw.js` a `<deck>/mira/` e inyecta los scripts antes de `</body>`. Abre el deck y pulsa **E** para editar (reordenar slides + edición libre: mover, redimensionar, girar, duplicar, eliminar, editar texto y **recortar con Alt + asa**, estilo OBS Studio) o **P** para dibujar encima, luego guarda. Los decks nuevos ya vienen con todo. También es el comando de **migración**: ejecuta `npx mira-animator edit <deck>` en decks antiguos para actualizarlos a la última versión de las herramientas (incluido el crop con Alt). Mira [Agentes útiles](agentes/uteis.md) para saber cómo funcionan el reorder y el guardado.

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
