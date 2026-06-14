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
| `new <name>` | Creates a new deck from a template. |
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

```bash
npx mira-animator new <name> [--deck=<template>] [--theme=<theme>]
```

Creates a new deck under `decks/<name>/` from a template.

| Option | Values |
|---|---|
| `--deck` | `aula-capitulo`, `pitch-projeto`, `demo-tecnica` |
| `--theme` | `mira-dark`, `light-minimal`, `corporate-blue`, `neon-emerald` |

You can also create decks conversationally with the `/mira-new` skill in Claude.

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
