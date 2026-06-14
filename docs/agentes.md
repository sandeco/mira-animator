# Agents

Every Mira agent is a Claude skill: invoke it with its `/name`, or just describe what you want and the agent triggers itself. This page describes each one. For how they connect, see the [Agent pipeline](pipeline.md).

## Entry & scaffolding

### `/mira-new`
The front door for a new deck. Collects the requirements of a presentation conversationally (theme name, deck template, base theme, primary color and references) and assembles the `decks/<theme>/` folder ready for the pipeline to fill. It does **not** generate slides — it prepares the ground and, at the end, offers to trigger the pipeline.

### `/mira-references`
Creates and organizes the per-theme references folder, `references/`, inside the deck's theme, and automatically includes whatever material is already there. This is how you tell Mira the content source for a specific presentation — always per theme, local to the theme. Use it before creating a slide when the theme has no references folder yet.

### `/mira-get-videos`
Downloads Mira's background videos into `mira-templates/videos_header/`. Use it when a header looks empty, or right after install if you want the video backgrounds.

## The main pipeline

### `/mira-extract`
The context extractor. Reads a linked source from `mira.config.json` (project folder, PDF, LaTeX or text) and produces a structured briefing that feeds the planner. First link in the chain.

### `/mira-planner`
Content planner. Analyzes a chapter's content (LaTeX, PDF or text) and produces a detailed slide plan **before** any visual assembly — how many slides, what each one covers, the structure — and waits for approval.

### `/mira-copywriter`
Refines slide copy and specifies images, bringing the text down to slide altitude (short, punchy, presentable) rather than paragraph altitude.

### `/mira-builder`
The atomic assembly engine. Builds interactive HTML/Tailwind presentations from modular glassmorphism components (glass-card, icon-hero, attribute-pills, replay-btn) with card-by-card navigation.

### `/mira-animator`
Creates concept slides with creative animations and a **mandatory internal loop**. Mira's mother-rule lives here: *no animation is static — every animation enters with choreography and then continues in an internal loop.* It stamps each animation with a `<!-- @MIRA:SIZE 3/10 -->` marker so `mira-size-animator` can scale it later. Also handles *"turn this image into an animated slide."*

### `/mira-validator`
Analyzes the HTML produced by `mira-builder` and validates visual, structural and asset conformance — a final quality report. Run it after a build, or to diagnose an existing deck.

## Motion tuning

### `/mira-size-animator`
Adjusts the perceived size of a deck's animations on a 1–10 scale, where **3/10** is what `mira-animator` generates by default. It reads the `@MIRA:SIZE` marker of each animation, reports the current level, and scales the composition (radii, lengths, spacing, internal fonts and glow inside the SVG) to fill more or less of the stage — without changing the stage height or breaking the internal loop. *"Put the animations at 6/10," "this slide at 2/10."*

!!! note "Size and distance"
    On the vertical (9:16) format, growing the elements also shrinks the distances between them. On the horizontal (16:9) format, only the elements grow — the distances stay as they are.

### `/mira-animated-metaphor`
Turns a slide's animation (or all of them) into an animated **visual metaphor**. From the slide's concept, it invents a concrete everyday analogy and animates it in the `mira-animator` style (internal loop required), replacing the animation in place while keeping the title, subtitle and pills.

## Visuals & data

### `/mira-visuals`
Static images for slides: panels, diagrams, charts and infographics — when a concept is better shown as a fixed, dense visual than as motion.

### `/mira-image-prompt`
Builds structured JSON prompts for photorealistic image generation.

### `/mira-img-animator`
Animates an existing image — bringing a static figure to life in the deck's style.

### `/mira-chart`
Turns data into charts with impact: from a CSV/JSON, from an image of a chart, or from a hand-drawn sketch — and recommends the best chart type from a gallery.

## Video formats

### `/mira-squared`
Generates a **square** (1:1, 1080×1080) version of a deck from the 16:9 original, or creates square slides from scratch. Writes a new `index-1x1.html` next to the original (centered by default, optionally left/right aligned). For Instagram feed, LinkedIn, etc.

### `/mira-vertical`
Generates a **vertical** (9:16) version. Each content slide keeps only the main title at the top and a tall, standardized animation canvas below; the title auto-shrinks to fit at most two lines, and each animation's axis is reworked for portrait (horizontal flow becomes vertical, side-by-side comparison becomes stacked). Writes `index-9x16.html`. For Reels, Shorts, TikTok, Stories.

### `/mira-thirds`
Reframes a deck on the **rule of thirds** without changing the aspect ratio. Pushes each slide's content into columns 1 and 2 of a 3×3 grid (the left two-thirds) and leaves the right column free — for you to overlay text, a lower-third or the presenter's video in editing. Works on top of 16:9, 1:1 or 9:16. Writes a `-thirds` file. Free side is the right by default; can be flipped.

### `/mira-transition-dissolve`
Applies a **dissolve** transition (a real crossfade, Canva/Keynote style) to slide navigation using the View Transitions API (same-document), which works on `file://` with no server. Writes `index-dissolve.html` next to the original. Browsers without the API navigate normally.
