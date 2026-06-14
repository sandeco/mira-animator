# Why Mira

## The gap

Good slides are slow to make. The content almost always already exists — in a repository, a book chapter, a PDF, an academic paper, a set of notes. What costs time is the *translation*: turning that material into a presentation that holds attention. Layout. Copy that fits a slide instead of a paragraph. And, hardest of all, motion — the animation that makes an abstract idea click.

Most people skip the motion entirely and ship static bullet points. The ideas are good; the delivery is flat.

## The idea

Mira closes that gap with a team of specialized AI agents. You point it at a source and the pipeline does the translation:

- **reads** the material and produces a structured briefing,
- **plans** the slides and waits for your approval,
- **writes** the copy at slide altitude (not paragraph altitude),
- **builds** the HTML as modular glass-cards,
- **choreographs** the animations — every concept gets a continuously looping motion,
- and can **re-express** the hard concepts as animated visual metaphors.

The result is not a deck of static images. It is a self-contained `index.html` where every concept *moves* — and where the heavy ideas are shown as concrete analogies instead of abstract diagrams.

## The golden rule: nothing is static

Mira's defining constraint, inherited by every animation agent, is simple and non-negotiable:

> No animation is static. Every animation **enters** with choreography and **then** continues in an internal loop.

A slide that just sits there is a bug, not a feature. This is what makes a Mira deck feel alive on screen and what makes it work as a video, not just a slideshow.

## Same philosophy as Reversa

Mira follows the [Reversa](https://github.com/sandeco/reversa) philosophy of **isolation**. Reversa installs inside a legacy project to extract specifications; Mira installs into a *separate* slides folder and reads from **linked sources**. In both cases the principle is the same: the tool reads what exists and writes only to its own output, never mixing its artifacts with your source material.

That means you can point Mira at a production repository, a book draft, or a client's PDF with full confidence: it will read, but it will never write back into the source.

## Who it is for

- **Educators** turning a book chapter or course module into an animated class.
- **Builders** turning a project README into a pitch or a technical demo.
- **Researchers** turning a paper into a presentation that an audience can actually follow.
- **Content creators** who need the same idea as a 16:9 talk, a square feed post, and a vertical Reel — from one source of truth.
