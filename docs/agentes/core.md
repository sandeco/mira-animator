# Core agents

The heart of deck creation. See how they connect in the [Agent pipeline](../pipeline.md).

## `/mira-new`
The front door for a new deck. It asks only for the theme name and **creates the `decks/<theme>/` structure right away, with `references/` ready**, so you can drop your PDF, document or screenshots in before deciding anything else. Then it stops and asks whether you would rather describe the presentation in chat or put the files in the folder. Only after that does it collect the rest conversationally (deck template, base theme, primary color) and assemble the deck for the pipeline to fill. It does **not** generate slides: it prepares the ground and, at the end, offers to trigger the pipeline.

## `/mira-fast`
A whole deck in a single call. Where `/mira-new` opens the normal chain with pauses, `/mira-fast` plans the deck and fans out **one leaf per slide in parallel**, then assembles the final file deterministically. It asks nothing: not content, not format, not theme, not continuity. Quality matches the normal chain, without the human gates in between.

```text
/mira-fast <topic or path>                       -> default 16:9
/mira-fast /mira-studio <topic or path>          -> Studio 9:16
/mira-fast /mira-studio-full <topic or path>     -> Studio Full 16:9
/mira-fast /mira-vertical <topic or path>        -> vertical 9:16
```

Before planning anything it creates the `decks/<theme>/` structure with `references/` and shows you its full path, so material dropped there is already part of the plan. It **never infers the format** from the topic, and a source you point at that does not exist on disk **fails immediately**, telling you about the references folder, instead of inventing a deck out of nothing. A mistyped path does not become an entirely imagined presentation.

Requires Claude Code 2.1.154 or newer with **Dynamic workflows** enabled in `/config`. For a single slide, use `/mira-animator`.

## `/mira-references`
Creates and organizes the per-theme references folder, `references/`, inside the deck's theme, and automatically includes whatever material is already there. This is how you tell Mira the content source for a specific presentation — always per theme, local to the theme. Use it before creating a slide when the theme has no references folder yet.

## `/mira-animator`
Mira's heart, the **M** in Metáforas Inteligentes Responsivas Animadas (Intelligent Responsive Animated Metaphors). From the slide's concept it distills the dynamic, invents a **concrete everyday analogy** and animates it with a **mandatory internal loop**. Two mother-rules live here: *no animation is literal, every animation is a metaphor*, and *no animation is static, every animation enters with choreography and then continues in an internal loop.* It works in two modes, **create** a new animated slide and **replace** an existing slide's animation in place, keeping the title, subtitle and pills (*"turn these slides into metaphors"*). It stamps each animation with a `<!-- @MIRA:SIZE 3/10 -->` marker so `mira-size-animator` can scale it later. Also handles *"turn this image into an animated slide."*

## `/mira-animated-metaphor`
Compatibility alias for `/mira-animator` (replace mode), kept because it is cited in published material. Calling either is the same thing: the rules live only in `mira-animator`.

## `/mira-img-animator`
Animates an existing image — bringing a static figure to life in the deck's style.

## `/mira-size-animator`
Adjusts the perceived size of a deck's animations on a 1–10 scale, where **3/10** is what `mira-animator` generates by default. It reads the `@MIRA:SIZE` marker of each animation, reports the current level, and scales the composition (radii, lengths, spacing, internal fonts and glow inside the SVG) to fill more or less of the stage — without changing the stage height or breaking the internal loop. *"Put the animations at 6/10," "this slide at 2/10."*

!!! note "Size and distance"
    On the vertical (9:16) format, growing the elements also shrinks the distances between them. On the horizontal (16:9) format, only the elements grow — the distances stay as they are.

## `/mira-image`
Places an image you already have (a local file or a URL) into a slide, in a clean card where it sits large and well-framed. It copies the image into the deck's `assets/` folder and references it by a relative path, so the deck stays self-contained and opens straight from `file://` with no server (a plain `<img>` is not subject to the CORS block that affects `.glb`). Same clean card as `mira-3d` and `mira-qrcode`: just the title and the maximized image, with no caption underneath. The image stays static (`object-fit: contain` by default, so nothing is cropped); the internal loop lives in the frame (a breathing glow), never distorting the image. To **generate** a new image use `mira-visuals`; to **animate** an existing image use `mira-img-animator`; this one only **places** a ready image.

## `/mira-get-videos`
Downloads Mira's background videos into `mira-templates/videos_header/`. Use it when a header looks empty, or right after install if you want the video backgrounds.
