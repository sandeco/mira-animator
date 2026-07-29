# CLI

All commands are run with `npx mira-animator <command>` (the binary is also available as `mira` once installed).

```bash
npx mira-animator --help        # list commands
npx mira-animator --version      # print version
```

## Commands

| Command | Description |
|---|---|
| `install` | Installs Mira in the current folder (agents, templates, config). |
| `link <path>` | Links a folder or file as a content source. |
| `sources` | Lists the linked sources. |
| `new <name>` | Creates a deck from a template. |
| `edit <deck>` | Installs/updates the **authoring tools** (edit mode E — reorder, free editing, Alt crop — and drawing P) in an existing deck. |
| `memoria <subcommand>` | Reads and manages the local preference memory. |
| `status` | Shows the state of the installation and the decks. |
| `update` | Updates agents and templates to the latest version. |
| `uninstall` | Removes Mira from the current folder. |

## `install`

```bash
npx mira-animator install
```

Copies the agents to `.claude/skills/`, the templates to `mira-templates/`, creates `decks/`, and writes `mira.config.json` + `CLAUDE.md`. See [Installation](instalacao.md).

## `link`

```bash
npx mira-animator link <path> [--name=<alias>] [--type=projeto|pdf|latex|texto]
```

Links a folder or file as a read-only content source.

| Option | Meaning |
|---|---|
| `--name=<alias>` | Short alias used later to refer to the source. |
| `--type=...` | `projeto`, `pdf`, `latex` or `texto`. Inferred when omitted. |

See [Linked sources](fontes.md).

## `sources`

```bash
npx mira-animator sources
```

Lists every linked source with its alias, type and path.

## `new`

There are two ways to create a deck. From the CLI:

```bash
npx mira-animator new my-talk [--deck=<template>] [--theme=<theme>]
```

Or conversationally with `/mira-new`:

```text
/mira-new create a presentation called 'my-talk' with the aula-capitulo template and the mira-dark theme
```

Both assemble `decks/<name>/`, create `references/`, install edit and drawing tools under `mira/`, copy offline libraries to `assets/vendor/`, and register the deck. The choices are read dynamically from `templates/`; run `npx mira-animator new` with no name to see the installed values.

| Choice | Values |
|---|---|
| Template | `mira-default` (default), `aula-capitulo`, `pitch-projeto`, `demo-tecnica`, `sandeco-just-animation-template`, `mesa-tatica`, `mira-studio-demo`, `mira-studio-full-demo` |
| Theme | `mira-dark`, `light-minimal`, `corporate-blue`, `neon-emerald` |

## `edit`

```bash
npx mira-animator edit <deck>
```

Retrofits the **authoring tools** into a deck that already exists: it copies `mira-edit.js`, `mira-edit-free.js` and `mira-draw.js` into `<deck>/mira/` and injects the scripts before `</body>`. Open the deck and press **E** to edit (reorder slides + free editing: move, resize, rotate, duplicate, delete, edit text and **crop with Alt + handle**, OBS Studio style) or **P** to draw on top, then save. New decks already ship with everything. It is also the **migration** command: run `npx mira-animator edit <deck>` on older decks to upgrade them to the latest tools (including Alt crop). See [Utility agents](agentes/uteis.md) for how the reorder and saving work.

## `memoria`

```bash
npx mira-animator memoria lembrancas [--papel cover] [--formato 16x9] [--tema mira-dark] [--eixo color] [--registro name]
npx mira-animator memoria nota "less text per slide" --eixo density
npx mira-animator memoria consolidar [--simular]
npx mira-animator memoria estado <file.md> <ativo|suspenso|revogado|candidato|observado>
npx mira-animator memoria listar
npx mira-animator memoria onde
```

`lembrancas` selects preferences for the current context; `--registro` records provenance outside the deck. `nota` creates an explicit active instruction. `consolidar` finds recurring corrections and creates candidates; `--simular` writes nothing. `estado` changes a note's lifecycle without deleting it. `listar` shows notes and reinforcement counts; `onde` prints memory and evidence paths. Data lives in `~/.mira-memory/` by default; set `MIRA_MEMORY_DIR` to override it.

## `status`

```bash
npx mira-animator status
```

Shows the installation state and the decks that exist.

## `update`

```bash
npx mira-animator update
```

Updates the agents and templates to the latest version.

## `uninstall`

```bash
npx mira-animator uninstall
```

Removes Mira from the current folder.
