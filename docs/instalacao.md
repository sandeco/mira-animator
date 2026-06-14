# Installation

## Requirements

- **Node.js 18.20.2+**
- An AI coding agent that reads skills — Mira is built for **Claude Code**, which loads the agents from `.claude/skills/`.

## Install

Create (or enter) a folder dedicated to your slides — **never** the project you want to present about — and run:

```bash
cd my-slides-folder
npx mira-animator install
```

The installer:

1. Copies the agents to `.claude/skills/`.
2. Copies the templates to `mira-templates/` (themes, slide blueprints, deck skeletons).
3. Creates the `decks/` folder, where all generated presentations live.
4. Writes `mira.config.json` (configuration and linked sources) and `CLAUDE.md` (entry instructions for the agent).

After it finishes, the folder looks roughly like this:

```
my-slides-folder/
├── .claude/skills/        # the Mira agents
├── mira-templates/        # themes, slides, deck skeletons
├── decks/                 # your generated presentations (starts empty)
├── mira.config.json       # config + linked sources
└── CLAUDE.md              # agent entry instructions
```

!!! warning "Install in a dedicated folder"
    Mira is **not** installed inside the project you want to present. It installs into its own working folder and reads from [linked sources](fontes.md). The agents read from sources but write only to `decks/`. Your source projects are never modified.

## Background videos (optional)

Some decks use video backgrounds in their headers. Those files are not bundled in the npm package to keep it small. To download them, run the `/mira-get-videos` skill in Claude — it fetches the background videos into `mira-templates/videos_header/`.

If a deck's header looks empty where a video should be, that is the fix.

## Updating

```bash
npx mira-animator update
```

This refreshes the agents and templates to the latest version.

## Uninstalling

```bash
npx mira-animator uninstall
```

This removes Mira from the current folder.

## Next step

Link the content you want to present about → [Linked sources](fontes.md).
