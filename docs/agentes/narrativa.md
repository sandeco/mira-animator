# Storytelling agents

An eight-step narrative chain that turns a fact, a concept or a theme into a story, and the story into staged, choreographed scenes. It always comes installed, with the **Story Team**.

It sits **before** the deck. None of these agents writes HTML. They hand the result to `/mira-animator`, which writes the animation inside the deck's `index.html`, and to `/mira-builder`, which assembles the rest.

```text
cinema-deck (orquestra)
  |
  v
premise-forge -> concept-storyteller -> story-architect -> design-audience-journey
             -> direct-slide-sequence -> direct-scene -> direct-cinematic-motion
             -> scene-brief -> asset-scout
             -> mira-animator writes the deck
```

You can enter at any point. If the premise already exists, start at step 2. If the Story Bible is solid, use the last three.

## `/mira-cinema-deck`

The orchestrator of the whole chain. It creates the deck with cinema mode already installed
(`new --cinema`), runs the eight narrative agents in order with a pause between each, and hands the
Motion Score to `/mira-animator`, which turns it into code. It exists because the chain degrades
silently without it: with no `mira-cinema.js` in the deck, `/mira-direct-cinematic-motion` is forced
to produce direction **without** camera, grade or depth planes, and you get a plain deck thinking
you asked for cinema.

`--cinema` leaves `mira-cinema.js`, `mira-foco.js` (camera mode on the **C key**, where you tune the cues on screen and save with `Ctrl+S`) and a `servidor.bat` in the deck root. **A cinematic deck is authored through `servidor.bat`**, because `Ctrl+S` only writes straight into the file over `http://localhost`; on `file://` it falls back to the Chrome file picker. For presenting, double clicking `index.html` still works.

## `/mira-premise-forge`

Researches current facts, news, releases and disputes, digs out the Eureka moment hidden in them and turns it into a defensible, visually strong premise. Delivers a **Premise Brief** with the organizing principle, the causal spine and the factual limits the story may not cross.

## `/mira-concept-storyteller`

Establishes the **Concept Contract**: what the story has to teach, what it may simplify and what it may never distort. It is the anchor of truth that every later step is audited against.

## `/mira-story-architect`

Builds the **Story Bible**: seven structural steps, character web, theme, world, symbol network, plot, scene web and dialogue.

## `/mira-design-audience-journey`

Designs the audience's mental and emotional state beat by beat, producing an **Audience Journey Map** with curiosity and revelation ledgers: what is delivered, what is withheld, and when the payoff lands.

## `/mira-direct-slide-sequence`

Turns story and journey into a **MIRA Slide Score**: one scene per slide, with dramatic function, first frame, action, micro-turn, revelation, withheld information, narration, minimum on-screen text and a causal transition into the next slide.

## `/mira-direct-scene`

Directs the **staging**, everything that exists before movement: composition, blocking, silhouette and scale, 3 to 5 depth planes with declared occlusion, ground and support, base framing and safe area, legibility, the deck's single color grade, and visual continuity between adjacent slides.

## `/mira-direct-cinematic-motion`

Converts the staged scenes into a **MIRA Motion Score**: temperament, beats on a labeled timeline, the six camera cues, semantic easing, internal loop, exit transition, responsiveness, reduced motion and fallbacks. It ends in a handoff that `/mira-animator` implements.

## `/mira-scene-brief`

Distils the whole chain into a **short, self-contained scene brief per slide**: on-screen title, dramatic function, entry and exit anchors, objects named for what they really are, the story in three beats, loop, temperament and prohibitions. It is the last step that produces text, and it exists so whoever draws the slide never reads the chain: the chain stays whole, it just stops being read.

The anchor is the field that carries the deck. One slide's exit anchor is literally the next one's entry anchor, with a stated position, or the deck reads as pretty scenes with no story.

## `/mira-asset-scout`

Decides where every actor in the scene comes from, before anyone draws it. It returns a table with three possible outcomes per object: **draw**, when the geometry is simple and procedural (a skyline, a mesh, a blueprint in lines); **fetch**, when it already exists in an open source library, in which case the SVG is inlined into the deck, recoloured to the theme tokens and credited in `CREDITS.md`; **ask**, when nothing is found, so the author gets a short request with a plan B instead of the deck stalling.

It exists because of a ban list, not a preference. Human figures, hands, faces, animals, vehicles and articulated anatomy may **never** be hand drawn by whoever implements the scene. A cinematic deck once shipped with a flawless city and people shaped like a trapezium with a ball on top, because the previous rule said "prefer an icon" and a preference gets ignored.

## What these agents may not invent

They direct against what Mira actually runs. Mira has no animation engine, no IR and no compiler: the agent writes D3 with SVG, GSAP and CSS inside the deck, which opens from `file://` with a double click, offline and with no build.

So the output is direction in text, never a runtime contract, and the stack is D3 with SVG, GSAP through `mira-cinema.js`, and CSS 3D. PixiJS, Three.js, Lottie, Rive, Motion Canvas and Paper.js are out.

Scene light, declared anchors between slides and the atmosphere layer are planned and do not exist yet. Where a scene asks for one, the direction records the intent and marks it pending, without writing an API call.
