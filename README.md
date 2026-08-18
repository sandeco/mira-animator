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

In Claude, just talk to `/mira-new` in plain language. It asks for the theme name and immediately creates the `decks/<theme>/` structure, with `references/` ready, so you can drop your source material in straight away, then it stops and asks whether you would rather describe the presentation in chat or put the files in that folder. From there it drives the rest conversationally (deck template, base theme, primary color), assembles the deck and, at the end, offers to trigger the pipeline.

```text
/mira-new create a new presentation called 'my-class'
```

You can spell out the template and theme in the same sentence:

```text
/mira-new create a presentation called 'my-class' with the aula-capitulo template and the mira-dark theme
```

**Deck templates:** `mira-default` (default), `aula-capitulo`, `pitch-projeto`, `demo-tecnica`, `sandeco-just-animation-template`.
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
mira-animator         animated metaphors with a mandatory internal loop (create or replace in place)
mira-size-animator    tunes the perceived size of animations on a 1-10 scale (base 3/10)
mira-animated-metaphor compatibility alias for mira-animator (replace mode)
mira-visuals          static images: panels, diagrams, charts and infographics
mira-validator        final conformance report
```

Support skills: `mira-img-animator` (animates existing images), `mira-chart` (data charts from CSV/JSON, images or hand sketches, with a best-type recommendation) and `mira-image-template` (builds a new deck template from screenshots and/or a logo, recognizing the design system and layout, then registers it for `mira-new`). Entry and helpers: `mira-new`, `mira-fast` (the whole deck in one call, slides generated in parallel), `mira-references`, `mira-get-videos`, `mira-offline` (turns a finished deck **self-contained / offline**: copies the libraries it would otherwise load from a CDN — Tailwind, AOS, Lucide, D3 and the Inter font — into the deck and rewrites the HTML to local paths, so it opens from `file://` even behind a corporate firewall; downloads nothing at runtime).

On-slide elements: `mira-3d` (a true 3D element, auto-rotating and draggable, choosing CSS 3D, procedural Three.js or a glTF `.glb`; a `.glb` slide needs a local server, so the agent starts one and writes a double-click launcher), `mira-qrcode` (a scannable QR code from a link or text, generated locally as inline SVG, works from `file://`), `mira-survey` (a live poll slide: the audience scans a QR to vote on a Google Form and a 3D donut or bar chart updates in real time by reading the responses sheet via gviz/JSONP, works from `file://`), `mira-quiz` (a live quiz slide: the audience answers a multiple-choice Google Form, the presenter reveals the correct answer on command, and percentages plus a basic ranking appear from the same gviz/JSONP sheet feed), `mira-chart-race` (a racing-chart slide: temporal data from a wide CSV animates over time, bars swapping rank or lines drawing in, playing once and stopping at the end, embedded inline so it works from `file://`), `mira-image` (places an image you already have into a slide, copied into `assets/` and referenced by a relative path, image static with the loop on the frame, works from `file://`), `mira-svg-morph` (one SVG shape morphs into another in a continuous loop, GSAP MorphSVG vendored locally, works from `file://`), `mira-icon-morph` (the same morph from concepts in words, sourcing licensed icons from the Iconify API), `mira-svg-animator` (animates an SVG you provide: flap, spin, slide or draw, splitting a single merged path to move one part) and `mira-animated-typing` (the "prompt typed in zoom" scene: giant terminal monospace text typed character by character with a Windows-style blinking cursor, sliding left once it reaches 100px before the right edge, per-span color via a `color=#HEX` tag, pure JS/CSS, works from `file://`).

Slide-to-slide continuity: `mira-sequence` creates the next slide already standing on the exact pose the previous one was in, with a dry cut between the two, so the pair reads as a single slide whose animation changes behaviour halfway through. A perpetual loop has no last frame, so the source slide publishes its actors' live pose and the continuation locks it the moment it enters: hand over with the ball mid-air and it carries on mid-air. A declared rest pose is the mandatory fallback, so the slide still works for anyone opening the deck straight on it and for `mira-slide-to-video`. The deck's global transition is never touched, the dry cut belongs to that pair alone.

A whole explanation as one long take: `mira-sequence-director` is the orchestrator above `mira-sequence`. You describe what you want to explain and it turns that into a chain of chained slides the audience reads as a single animation. It first applies a form test with the power to refuse, because an explanation that switches world, scale or subject halfway is not a long take. Approved, it writes a continuity script to `references/sequence-director-<id>.md` in the deck, declaring per scene which actors cross the cut, which enter, which leave, the action, the rest pose as an expression, and what changes next. Then it builds the chain serially: scene 1 through `mira-animator`, every following link through `mira-sequence`, each one written after reading the previous link's source, because link N+1's fallback pose has to carry the same expression as link N's rest.

Concept alignment, before any production and always optional: `mira-brainstorming` (the door, for when only a theme exists: competing angles, cut down with each one's cost declared, closing on the single sentence the deck is about), `mira-concept-align` (clears the idea, detects ambiguity, teaches your own idea back to you and only closes when **you** say so) and `mira-storyboard` (draws the competing metaphors as real SVG plus PNG frames in `storyboard/` at the deck root, versioned, corrected in plain language). Approving a storyboard makes the deck **linked**, and from there the approved concept becomes mandatory, verifiable reading for everyone downstream: check it with `npx mira-animator storyboard verify <deck>`.

Storytelling chain (optional, installed with the **Story Team**), orchestrated end to end by `mira-cinema-deck` (creates the deck with cinema mode installed, runs the chain in order and hands the Motion Score to the animator): `mira-premise-forge` (digs the Eureka out of current facts and forges a defensible premise), `mira-concept-storyteller` (the concept contract: what the story must teach and may never distort), `mira-story-architect` (the Story Bible: structure, characters, theme, world, symbols and scenes), `mira-design-audience-journey` (attention, curiosity, emotion and revelation, beat by beat), `mira-direct-slide-sequence` (one scene per slide, each transition causal), `mira-direct-scene` (the staging: composition, blocking, depth planes with occlusion, framing, legibility and the deck's single color grade) `mira-direct-cinematic-motion` (the motion score: temperament, beats, camera, easing and internal loop) `mira-scene-brief` (distils it all into a short, self-contained scene brief per slide, carrying the anchor that links one slide to the next) and `mira-asset-scout` (decides where each actor comes from: draw it, fetch an open source SVG and inline it, or ask the author, since human figures, hands, faces, animals and vehicles may never be hand drawn). The chain runs before the main line and writes no HTML: it hands one brief at a time to `mira-animator`, which writes the animation into the deck.

Each orchestrator pauses between agents and keeps you in control of every step.

### One-shot: `mira-fast`

`mira-fast` is an alternative entry point that covers the whole chain in a single call. A central agent plans the deck, then **one leaf per slide runs in parallel**, and a deterministic script assembles the final file:

```text
/mira-fast spec driven development
/mira-fast /mira-studio <topic or path>       # Studio 9:16
/mira-fast /mira-studio-full <topic or path>  # Studio Full 16:9
/mira-fast /mira-vertical <topic or path>     # vertical 9:16
```

It asks nothing, from topic to final HTML, so you trade the approval pauses above for speed. Before planning it creates the `decks/<theme>/` structure with `references/` and shows you the full path, so material you drop there is part of the plan. It never infers the format from the topic, and a source you point at that does not exist on disk fails immediately instead of producing an invented deck. Requires Claude Code 2.1.154 or newer with **Dynamic workflows** enabled in `/config`.

---

## Video formats

Starting from the 16:9 deck, without touching the original:

| Skill | Output | Format | Use |
|-------|--------|--------|-----|
| `mira-squared` | `index-1x1.html` | 1:1 (1080×1080) | Feed, LinkedIn |
| `mira-vertical` | `index-9x16.html` | 9:16 (1080×1920) | Reels, Shorts, Stories, TikTok |
| `mira-thirds` | `index-thirds.html` | rule of thirds | leaves a third free for text / presenter video |
| `mira-studio` | `decks/<name>/` | 9:16 (1080×1920) | recording deck with the presenter's webcam live inside the slide (OBS-ready, native MP4 recording with **stereo audio** and A/V-aligned tracks) |
| `mira-studio-full` | `decks/<name>/index-16x9.html` | 16:9 (1920×1080) | full-hd recording deck with the webcam live inside the slide, roteiro.md-driven slides, an out-of-video teleprompter and the same **stereo + A/V-aligned** recorder |
| `mira-transition-dissolve` | `index-dissolve.html` | dissolve | real crossfade between slides (Canva style) |

`mira-squared` and `mira-vertical` lock the slides to the target ratio (fixed frame) and shrink the side gaps. `mira-thirds` is a **composition** variant (it does not change the ratio): it pushes content into the left two-thirds and leaves the right column free to overlay text, a lower-third or the presenter's video in editing. `mira-transition-dissolve` swaps the scroll between slides for a real crossfade via the View Transitions API, it works on `file://` with no server (Chrome/Edge).

### Recording yourself inside the deck (native recorder)

The Studio formats record straight from the browser: press **R** and the deck writes an MP4 to
disk, no OBS, no chroma key, no compositing in the editor. A 5-second countdown runs first and
never enters the video. What comes out of the recorder, as of **0.1.61**:

- **Stereo audio.** Two channels are requested as `ideal`, never `exact`, so a mono microphone
  can never break the recording. When the track still arrives mono, the channel is duplicated
  through a Web Audio graph and the panel labels it `stereo (dup)` — never plain `stereo`.
  Chrome's voice-processing filters (echo cancellation, noise suppression, auto gain) stay
  **on**: switching them off is the only way to pull real stereo out of a device the chain is
  flattening, but it changes how your audio sounds, so that call is yours.
- **Audio and video aligned.** Both tracks are brought to a common origin before muxing, so the
  real distance between the two capture starts survives in the file. It used to be discarded:
  each track was zeroed at its own first frame, and the offset measured up to 30 ms on real
  recordings — enough for a trained eye to catch.
- **Constant frame rate** (the `CFR (edit)` switch, on by default) so editors that conform VFR
  to a fixed grid, Adobe Premiere among them, stop accumulating lip-sync drift along the clip.
- **A panel that shows its work.** Live counters for effective fps, dropped and duplicated
  frames, plus `mic 2ch` and `A/V ±N ms`. The `save diagnostics JSON` button dumps everything,
  including `mic{}` (what the microphone actually delivered) and `av{}` (the measured offset).
  If a recording degrades, it is marked **PARTIAL** and the reason is named, never silent.

**A deck that already exists does not get these fixes on its own.** Run
`npx mira-animator edit <deck>` to update the recorder inside it. New decks ship corrected.

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
npx mira-animator memoria <sub>      # preference memory (lembrancas, nota, consolidar, estado)
npx mira-animator plugin <sub>       # your own agents (list, sync, validate, pack, add)
npx mira-animator status             # show install and deck state
npx mira-animator update             # update agents and templates
npx mira-animator uninstall          # remove Mira from the current folder
```

| Command | Description |
|---|---|
| `install` | Installs Mira in the current folder (agents, templates, config) |
| `link <path>` | Links a folder or file as a content source. Options: `--name=<alias>` `--type=projeto\|pdf\|latex\|texto` |
| `sources` | Lists linked sources |
| `new <name>` | Creates a deck from an installed template. Options: `--deck=<template>` `--theme=<theme>` |
| `edit <deck>` | Installs or updates edit, free-edit and drawing tools in an existing deck |
| `status` | Shows install and deck state |
| `update` | Updates agents and templates to the latest version |
| `uninstall` | Removes Mira from the current folder |
| `memoria <sub>` | Preference memory. `lembrancas` prints what applies to a slide, `nota` records an explicit order, `consolidar` turns repeated corrections into candidate notes, `estado` activates/suspends/revokes one |
| `plugin <sub>` | Your own agents. `list`, `sync`, `validate [<id>]`, `pack <id>`, `add <file>` (see [Plugins](#plugins-your-own-agents)) |

> You can create a deck directly with `npx mira-animator new <name>` or conversationally with `/mira-new` (see [Creating a deck](#creating-a-deck)).

---

## Plugins: your own agents

Mira ships 40+ agents. A **plugin** is an agent *you* write, living in `mira-plugins/` in your own
folder. It never touches the Mira package, and you can share it with anyone.

```
your-folder/
  mira-plugins/
    yourname-something/
      mira-plugin.json     manifest
      SKILL.md             the agent
      references/          optional
      assets/              optional
```

**Installing is putting the folder in `mira-plugins/`. Uninstalling is deleting it.** Mira
reconciles on session start: a new folder gets activated, a deleted one gets removed from your
skills directory. No command required either way. If none of your engines has a session hook,
run `npx mira-animator plugin sync` yourself.

```bash
npx mira-animator plugin list              # what you have and its state
npx mira-animator plugin sync              # reconcile now, without waiting for a session
npx mira-animator plugin validate          # check every manifest
npx mira-animator plugin pack <id>         # produce <id>-<version>.mplug to share
npx mira-animator plugin add <file>        # install someone else's .mplug
```

### Creating one

Use `/mira-new-plugin`. It checks whether [Reversa](https://github.com/sandeco/reversa) is
installed, installs it with your confirmation if not, then runs the spec and implementation
cycle writing straight into `mira-plugins/<id>/`.

Two things worth knowing before you start:

- **Your specs stay on your machine.** They live in `_reversa_sdd/` and `_reversa_forward/` and
  do not travel inside the `.mplug`. Whoever receives your plugin gets it working, not the specs.
- **Installing a plugin is not required to have Reversa.** Only creating one is.

### Rules Mira enforces

| Rule | Why |
|---|---|
| Id is `<author>-<name>`, lowercase with a hyphen | Readable and collision resistant |
| Id cannot start with `mira-` | Reserved for native agents, so your plugin never breaks when Mira ships a new one |
| Folder name, manifest `id` and SKILL.md `name` must match | Otherwise the agent is unreachable |
| No executable files (`.js`, `.sh`, `.bat`, `.ps1`, `.py`, …) | Plugins activate on their own at session start; third party code entering unattended is not a risk worth taking in v1 |
| Everything the plugin needs lives inside its own folder | So deleting the folder really uninstalls it |

Start from `mira-templates/authoring/plugin-exemplo/`, which is a valid skeleton.

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
