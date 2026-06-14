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
| `new <nombre>` | Crea un nuevo deck a partir de una plantilla. |
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

```bash
npx mira-animator new <nombre> [--deck=<plantilla>] [--theme=<tema>]
```

Crea un nuevo deck en `decks/<nombre>/` a partir de una plantilla.

| Opción | Valores |
|---|---|
| `--deck` | `aula-capitulo`, `pitch-projeto`, `demo-tecnica` |
| `--theme` | `mira-dark`, `light-minimal`, `corporate-blue`, `neon-emerald` |

También puedes crear decks de forma conversacional con la skill `/mira-new` en Claude.

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
