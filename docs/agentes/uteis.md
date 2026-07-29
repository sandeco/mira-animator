# Utility agents

The content chain that feeds the build. See how they connect in the [Agent pipeline](../pipeline.md).

## `/mira-extract`
The context extractor. Reads a linked source from `mira.config.json` (project folder, PDF, LaTeX or text) and produces a structured briefing that feeds the planner. First link in the chain.

## `/mira-planner`
Content planner. Analyzes a chapter's content (LaTeX, PDF or text) and produces a detailed slide plan **before** any visual assembly — how many slides, what each one covers, the structure — and waits for approval.

## `/mira-copywriter`
Refines slide copy and specifies images, bringing the text down to slide altitude (short, punchy, presentable) rather than paragraph altitude.

## `/mira-validator`
Analyzes the generated HTML and validates visual, structural and asset conformance — a final quality report. Run it after a build, or to diagnose an existing deck.

## Edit mode: `mira edit`
Reorder a deck's slides **after** the build, without regenerating it. New decks already ship with edit mode baked in; to add it to a deck that already exists, run the CLI:

```bash
npx mira-animator edit <deck>   # deck name, deck folder, or the index.html path
```

That copies `mira-edit.js`, `mira-edit-free.js` and `mira-draw.js` into `<deck>/mira/` and injects all three tags before `</body>`. Free editing loads after the base editor. Press **E** to edit and **P** to draw.

**How the reorder works**

1. Open the deck and press **E** (or add `?edit=1` to the URL) to toggle edit mode on and off.
2. Each slide shows its position number and **↑ ↓** arrows. Click them to move a slide up or down; the numbering updates live.
3. Click **Save order** to write the new order back to the source `index.html`. **Esc** or **Exit** leaves the mode (it warns first if you have unsaved changes).

Saving does not serialize the live DOM (already mutated by GSAP, D3 or Lucide): it re-reads the source file and swaps only the text blocks between the `<!-- ... SLIDE ... -->` markers, so the formatting stays intact. It works on the Mira layout (slides are `<section>` in `<body>`) and on legacy GSAP decks (slides inside `<main>`).

Serve the deck over HTTP to save with no dialog at all:

```bash
node lib/mira-serve.js decks/<name>
```

From `file://`, Chrome's File System Access API asks you to point at the `index.html` once (remembered for the session); browsers without it fall back to copying the new order for you to hand back.
