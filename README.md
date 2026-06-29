# Mira

<small>by sandeco</small>

**Turn your projects, books and PDFs into animated HTML presentations — built by a team of AI agents.**

*Mira* means "look" / "see" in Spanish — and it is also an acronym: **M**etáforas **I**nteligentes **R**esponsivas e **A**nimadas (Smart, Responsive, Animated Metaphors).

[![English Docs](https://img.shields.io/badge/DOCS-English-009c3b?style=for-the-badge&logo=material-for-mkdocs&logoColor=white&labelColor=2d2d2d)](https://sandeco.github.io/mira-animator/)<br>
[![Português Docs](https://img.shields.io/badge/DOCS-Portugu%C3%AAs-ffcc00?style=for-the-badge&logo=material-for-mkdocs&logoColor=black&labelColor=2d2d2d)](https://sandeco.github.io/mira-animator/pt/)<br>
[![Español Docs](https://img.shields.io/badge/DOCS-Espa%C3%B1ol-c60b1e?style=for-the-badge&logo=material-for-mkdocs&logoColor=white&labelColor=2d2d2d)](https://sandeco.github.io/mira-animator/es/)

Mira is a set of agents, skills and templates for creating animated HTML presentations (Tailwind + glassmorphism + programmatic vector animation) out of the content in your projects, books or PDFs. It follows the [Reversa](https://github.com/sandeco/reversa) philosophy: it installs into an isolated working folder and reads content from **linked sources**, never mixing anything with the source projects.

---

## Why Mira exists

Good slides are slow to make. The content already exists — in a repo, a book chapter, a PDF, a paper — but turning it into a presentation that actually holds attention means hours of layout, copy, and motion design.

Mira closes that gap. You point it at a source, and a pipeline of specialized agents reads the material, plans the slides, writes the copy, builds the HTML, and choreographs the animations. Every concept gets a **continuously looping animation**; the heavy ideas can be rendered as an **animated visual metaphor**. The result is a self-contained `index.html` that opens straight from `file://` — no server, no build step — ready to present or to screen-record for video.

**Mira is the bridge between content you already have and a presentation that moves.**

---

## Installation

In your slides working folder (never inside the project you want to present about):

```bash
cd my-slides-folder
npx mira-animator install
```

The installer copies the agents to `.claude/skills/`, the templates to `mira-templates/`, creates the `decks/` folder, and writes `mira.config.json` + `CLAUDE.md`.

**Requirements:** Node.js 18.20.2+

> Mira **never** writes inside your source projects. The agents read from linked sources and write only to `decks/`.

---

## Core concept: linked sources

Mira is never installed inside the project you want to present. Instead, you **link sources**:

```bash
# a folder from another project
npx mira-animator link C:/projects/reversa --name=reversa

# a PDF in the current folder
npx mira-animator link ./inbox/paper.pdf

# list linked sources
npx mira-animator sources
```

The agents read from the sources, but write only to `decks/`.

---

## Creating a deck

In Claude, just talk to `/mira-new` in plain language. It drives the creation conversationally (theme name, deck template, base theme, primary color and references), assembles the `decks/<theme>/` folder and, at the end, offers to trigger the pipeline.

```text
/mira-new create a new presentation called 'my-class'
```

You can spell out the template and theme in the same sentence:

```text
/mira-new create a presentation called 'my-class' with the aula-capitulo template and the mira-dark theme
```

**Deck templates:** `aula-capitulo`, `pitch-projeto`, `demo-tecnica`, `animacao-livre`.
**Themes:** `mira-dark`, `light-minimal`, `corporate-blue`, `neon-emerald`.

Then, in Claude: *"fill the deck my-class with content from the reversa source"*.

---

## Agent pipeline

```
mira-extract          reads the linked source and produces a briefing
mira-planner          slide plan + user approval
mira-copywriter       text and image refinement
mira-builder          HTML assembly (glass-cards)
mira-animator         animations with a mandatory internal loop
mira-size-animator    tunes the perceived size of animations on a 1-10 scale (base 3/10)
mira-animated-metaphor turns a slide's animation into a visual metaphor of the concept
mira-visuals          static images: panels, diagrams, charts and infographics
mira-validator        final conformance report
```

Support skills: `mira-img-animator` (animates existing images), `mira-chart` (data charts from CSV/JSON, images or hand sketches, with a best-type recommendation) and `mira-image-template` (builds a new deck template from screenshots and/or a logo, recognizing the design system and layout, then registers it for `mira-new`). Entry and helpers: `mira-new`, `mira-references`, `mira-get-videos`.

On-slide elements: `mira-3d` (a true 3D element, auto-rotating and draggable, choosing CSS 3D, procedural Three.js or a glTF `.glb`; a `.glb` slide needs a local server, so the agent starts one and writes a double-click launcher), `mira-qrcode` (a scannable QR code from a link or text, generated locally as inline SVG, works from `file://`), `mira-image` (places an image you already have into a slide, copied into `assets/` and referenced by a relative path, image static with the loop on the frame, works from `file://`), `mira-svg-morph` (one SVG shape morphs into another in a continuous loop, GSAP MorphSVG vendored locally, works from `file://`), `mira-icon-morph` (the same morph from concepts in words, sourcing licensed icons from the Iconify API) and `mira-svg-animator` (animates an SVG you provide: flap, spin, slide or draw, splitting a single merged path to move one part).

Each orchestrator pauses between agents and keeps you in control of every step.

---

## Video formats

Starting from the 16:9 deck, without touching the original:

| Skill | Output | Format | Use |
|-------|--------|--------|-----|
| `mira-squared` | `index-1x1.html` | 1:1 (1080×1080) | Feed, LinkedIn |
| `mira-vertical` | `index-9x16.html` | 9:16 (1080×1920) | Reels, Shorts, Stories, TikTok |
| `mira-thirds` | `index-thirds.html` | rule of thirds | leaves a third free for text / presenter video |
| `mira-transition-dissolve` | `index-dissolve.html` | dissolve | real crossfade between slides (Canva style) |

`mira-squared` and `mira-vertical` lock the slides to the target ratio (fixed frame) and shrink the side gaps. `mira-thirds` is a **composition** variant (it does not change the ratio): it pushes content into the left two-thirds and leaves the right column free to overlay text, a lower-third or the presenter's video in editing. `mira-transition-dissolve` swaps the scroll between slides for a real crossfade via the View Transitions API — it works on `file://` with no server (Chrome/Edge).

---

## Themes & templates

Three layers under `templates/`:

- **`themes/`** — visual identity via CSS variables. The theme is injected into the deck at creation (`/* @MIRA:THEME */`).
- **`slides/`** — blueprints for slide types: cover, concept-with-animation, comparison, timeline, code, closing.
- **`decks/`** — complete, runnable presentations that serve as skeletons.

---

## CLI commands

```bash
npx mira-animator install            # install Mira in the current folder
npx mira-animator link <path>        # link a content source (--name, --type)
npx mira-animator sources            # list linked sources
npx mira-animator status             # show install and deck state
npx mira-animator update             # update agents and templates
npx mira-animator uninstall          # remove Mira from the current folder
```

| Command | Description |
|---|---|
| `install` | Installs Mira in the current folder (agents, templates, config) |
| `link <path>` | Links a folder or file as a content source. Options: `--name=<alias>` `--type=projeto\|pdf\|latex\|texto` |
| `sources` | Lists linked sources |
| `status` | Shows install and deck state |
| `update` | Updates agents and templates to the latest version |
| `uninstall` | Removes Mira from the current folder |

> Creating a deck is **not** a CLI command — you do it conversationally in Claude with `/mira-new` (see [Creating a deck](#creating-a-deck)).

---

## Contributing

Contributions are welcome. Open an issue to discuss before submitting a PR.

```bash
git clone https://github.com/sandeco/mira-animator.git
cd mira-animator
npm install
```

---

## License

MIT — see [LICENSE](LICENSE) for details.
