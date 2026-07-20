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

**Deck templates:** `aula-capitulo`, `pitch-projeto`, `demo-tecnica`, `sandeco-just-animation-template`, `mira-perfect`.
**Themes:** `mira-dark`, `light-minimal`, `corporate-blue`, `neon-emerald`.

Then, in Claude: *"fill the deck my-class with content from the reversa source"*.

### Reordering slides (edit mode)

Every deck ships with a built-in edit mode. Open the deck and press **`E`** (or add `?edit=1` to the URL): each slide gets ↑ ↓ arrows to change its order. **Save** writes the new order back into `index.html` on disk, reordering the source blocks between the `<!-- SLIDE -->` markers without touching the animations.

Saving works two ways: over `file://` it uses the browser's file picker (Chrome/Edge); for silent saves, serve the folder with `node lib/mira-serve.js decks/<name>` and the order is written straight to disk. To add edit mode to an older deck that predates this feature, run `npx mira-animator edit <deck>`.

### Drawing over slides

Every deck also ships with a live-presentation telestrator, vanilla and `file://`-friendly:

- **`mira-draw.js`** — press **`P`** (or `?draw=1`): a telestrator to draw over the current slide — pen, highlighter, line, arrow, shapes, text and eraser, with colors, widths and undo. The slide's animation keeps running underneath.

For a dedicated tactics-table slide (animated chibi players, real lineups, recorded plays with replay, phone remote sync), the `mira-tactics` agent generates one from the bundled engine at `mira-templates/decks/mesa-tatica/index.html`.

`npx mira-animator edit <deck>` retrofits both authoring tools (edit, draw) into an older deck.

### Presenting with your phone (mira-remote-control)

The `mira-remote-control` agent turns any deck into a phone-controlled presentation over the local network, with no app, no login and no internet (the phone's own hotspot works). It copies a zero-dependency Node server and a mirroring shell into the deck's `mira/` folder, plus two double-click launchers (`remote-control-windows.bat` / `remote-control-apple.command`) in the deck root. Double-click the launcher, a QR appears in the corner of the deck, scan it with the phone: the QR disappears and the phone becomes mirror, remote control (next/prev) and pen: telestrator strokes land on the same spot of the slide on every screen, because every device renders the deck on a fixed 1280×720 stage scaled to fit. Roles are assigned by IP: the notebook is the stage, the first external device is the control, everyone else mirrors. Press **`C`** on the notebook to show the QR again. Without the launcher the deck still opens 100% via `file://`.

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

Support skills: `mira-img-animator` (animates existing images), `mira-chart` (data charts from CSV/JSON, images or hand sketches, with a best-type recommendation) and `mira-image-template` (builds a new deck template from screenshots and/or a logo, recognizing the design system and layout, then registers it for `mira-new`). Entry and helpers: `mira-new`, `mira-references`, `mira-get-videos`, `mira-offline` (turns a finished deck **self-contained / offline**: copies the libraries it would otherwise load from a CDN — Tailwind, AOS, Lucide, D3 and the Inter font — into the deck and rewrites the HTML to local paths, so it opens from `file://` even behind a corporate firewall; downloads nothing at runtime).

On-slide elements: `mira-3d` (a true 3D element, auto-rotating and draggable, choosing CSS 3D, procedural Three.js or a glTF `.glb`; a `.glb` slide needs a local server, so the agent starts one and writes a double-click launcher), `mira-qrcode` (a scannable QR code from a link or text, generated locally as inline SVG, works from `file://`), `mira-survey` (a live poll slide: the audience scans a QR to vote on a Google Form and a 3D donut or bar chart updates in real time by reading the responses sheet via gviz/JSONP, works from `file://`), `mira-quiz` (a live quiz slide: the audience answers a multiple-choice Google Form, the presenter reveals the correct answer on command, and percentages plus a basic ranking appear from the same gviz/JSONP sheet feed), `mira-chart-race` (a racing-chart slide: temporal data from a wide CSV animates over time, bars swapping rank or lines drawing in, playing once and stopping at the end, embedded inline so it works from `file://`), `mira-image` (places an image you already have into a slide, copied into `assets/` and referenced by a relative path, image static with the loop on the frame, works from `file://`), `mira-svg-morph` (one SVG shape morphs into another in a continuous loop, GSAP MorphSVG vendored locally, works from `file://`), `mira-icon-morph` (the same morph from concepts in words, sourcing licensed icons from the Iconify API), `mira-svg-animator` (animates an SVG you provide: flap, spin, slide or draw, splitting a single merged path to move one part) and `mira-animated-typing` (the "prompt typed in zoom" scene: giant terminal monospace text typed character by character with a Windows-style blinking cursor, sliding left once it reaches 100px before the right edge, per-span color via a `color=#HEX` tag, pure JS/CSS, works from `file://`).

Each orchestrator pauses between agents and keeps you in control of every step.

---

## Video formats

Starting from the 16:9 deck, without touching the original:

| Skill | Output | Format | Use |
|-------|--------|--------|-----|
| `mira-squared` | `index-1x1.html` | 1:1 (1080×1080) | Feed, LinkedIn |
| `mira-vertical` | `index-9x16.html` | 9:16 (1080×1920) | Reels, Shorts, Stories, TikTok |
| `mira-thirds` | `index-thirds.html` | rule of thirds | leaves a third free for text / presenter video |
| `mira-studio` | `decks/<name>/` | 9:16 (1080×1920) | recording deck with the presenter's webcam live inside the slide (OBS-ready, native MP4 recording) |
| `mira-studio-full` | `decks/<name>/index-16x9.html` | 16:9 (1920×1080) | full-hd recording deck with the webcam live inside the slide, roteiro.md-driven slides and an out-of-video teleprompter |
| `mira-transition-dissolve` | `index-dissolve.html` | dissolve | real crossfade between slides (Canva style) |

`mira-squared` and `mira-vertical` lock the slides to the target ratio (fixed frame) and shrink the side gaps. `mira-thirds` is a **composition** variant (it does not change the ratio): it pushes content into the left two-thirds and leaves the right column free to overlay text, a lower-third or the presenter's video in editing. `mira-transition-dissolve` swaps the scroll between slides for a real crossfade via the View Transitions API, it works on `file://` with no server (Chrome/Edge).

### From slides to an actual video file

`mira-slide-to-video` renders one or more slides of a deck into a single `.mp4`. It opens the deck in headless Chrome, records each slide in real time (the animation starts from zero, with no leak from the previous slide, framed to fill the frame) and stitches the clips together with ffmpeg. You pick which slide or slides go in, the resolution (16:9, 9:16, 1:1) and, when there is more than one slide, the per-slide time (4s by default, changeable) and the crossfade between them. Slides with a finite animation (like `mira-chart-race`) play in full. The original deck is never touched. Requires ffmpeg plus `puppeteer` and `puppeteer-screen-recorder` (installed on demand).

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
npx mira-animator new <name>         # create a deck from a template
npx mira-animator edit <deck>        # turn on edit mode (reorder slides) on an existing deck
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

**PolyForm Noncommercial 1.0.0** — MIRA é livre e gratuito para uso não-comercial
(pessoal, educacional, de pesquisa e por organizações sem fins comerciais).
**Não pode ser comercializado, vendido ou embutido em software comercial/proprietário.**
Veja o [LICENSE](LICENSE) para os termos completos.
