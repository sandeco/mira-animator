---
name: mira-animator
description: Use when a user wants to create animated HTML presentations with Mira, install or update Mira, link folders/PDFs/books as read-only sources, create decks, or manage Mira decks from Codex.
---

# Mira Animator

Use Mira to turn existing material into animated HTML presentations. Mira's upstream package is `mira-animator` from `https://github.com/sandeco/mira-animator`, with docs at `https://sandeco.github.io/mira-animator/`.

This Codex plugin wrapper credits sandeco as the Mira creator and Mario Mayerle (`https://mariomayerle.com`) as a plugin developer.

## Core Model

- Mira is installed into a dedicated slides working folder, not into the source project being presented.
- Source projects, PDFs, books, notes, and articles are linked as read-only sources in `mira.config.json`.
- Generated output belongs in `decks/<deck-name>/`.
- The normal workflow is: install Mira, link sources, create a deck, fill the deck through the Mira skill pipeline, validate the result.

## Safety Rules

- Never run `npx mira-animator install` inside a source project unless the user explicitly says that folder is the slides workspace.
- If the current directory looks like a product/repo source folder and the user did not name a slides workspace, create or propose a sibling folder such as `../<project-name>-mira-slides`.
- Do not edit, move, or delete linked source files. Read from linked sources only.
- Keep generated files under `decks/`, plus Mira's own workspace files such as `mira.config.json`, `.mira/`, `.agents/skills/`, `AGENTS.md`, and `mira-templates/`.
- On Windows, use PowerShell syntax and quote paths with spaces.

## Bootstrap

1. Confirm the slides workspace path.
2. Check Node.js:

```powershell
node --version
```

Mira requires Node.js 18.20.2 or newer. If Node is missing or too old, stop and report that blocker.

3. In the slides workspace, install Mira:

```powershell
npx mira-animator install
```

When the installer prompts for engines, include `Codex`. Install `Pipeline Core`; include `Visual Team` when the user wants images, charts, screenshots, or visual templates.

4. Verify the install:

```powershell
npx mira-animator status
```

Expected workspace files include `mira.config.json`, `AGENTS.md`, `.agents/skills/`, `mira-templates/`, and `decks/`.

If the project-local Mira skills are not available in the current Codex context after install, read the relevant `.agents/skills/<skill-name>/SKILL.md` file directly before doing that step. A new thread may be needed for automatic skill discovery.

## Link Sources

Use `link` from the slides workspace:

```powershell
npx mira-animator link "C:\path\to\source" --name=source-name
npx mira-animator sources
```

Use `--type=projeto`, `--type=pdf`, `--type=latex`, or `--type=texto` only when the type is not obvious or the user asked for a specific type.

## Create Decks

Create the deck shell with the CLI when the requested template and theme are built in:

```powershell
npx mira-animator new deck-slug --deck=aula-capitulo --theme=mira-dark
```

Built-in deck templates are `aula-capitulo`, `pitch-projeto`, and `demo-tecnica`.
Built-in themes are `mira-dark`, `light-minimal`, `corporate-blue`, and `neon-emerald`.

For custom templates or custom themes, follow the local `mira-new` skill instructions from `.agents/skills/mira-new/SKILL.md`.

## Production Workflow

For a full deck, use the local Mira skills in this order:

```text
mira-new -> mira-extract -> mira-planner -> mira-copywriter -> mira-builder -> mira-animator -> mira-validator
```

Use support skills when needed:

- `mira-references` for adding source files, pasted text, links, and reference folders.
- `mira-visuals`, `mira-image-prompt`, `mira-img-animator`, and `mira-chart` for visual assets and data visuals.
- `mira-3d`, `mira-qrcode`, and `mira-image` for special on-slide elements.
- `mira-squared`, `mira-vertical`, `mira-thirds`, and `mira-transition-dissolve` for format variants.

Pause for user approval at planning checkpoints unless the user explicitly asked for an unattended run.

## Validation

Before calling the work done:

- Run `npx mira-animator status`.
- Confirm the generated deck path, usually `decks/<deck-name>/index.html`.
- Run or read `mira-validator` output when a deck was generated or changed.
- For visual work, open or screenshot the HTML deck when browser tools are available, checking that slides render, animations are visible, and text is not overlapping.

Report the workspace path, linked sources, deck path, validation summary, and any skipped checks.
