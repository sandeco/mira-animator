# Themes and templates

Mira's look comes from three layers under `templates/`. They separate *identity* (colors, type), *structure* (slide types), and *complete examples* (runnable decks).

```
templates/
├── themes/     # visual identity via CSS variables
├── slides/     # blueprints for slide types
└── decks/      # complete, runnable presentations
```

## Themes

A theme is a set of CSS variables that define the deck's visual identity — colors, accents, surfaces. When you create a deck, the chosen theme is injected at the `/* @MIRA:THEME */` marker, so the whole deck inherits a consistent palette.

| Theme | Feel |
|---|---|
| `mira-dark` | Dark, glassmorphism, neon accents — the default. |
| `light-minimal` | Light, clean, minimal. |
| `corporate-blue` | Professional, blue, corporate. |
| `neon-emerald` | Dark with vivid emerald accents. |

Choose a theme at creation time, conversationally through `/mira-new`:

```text
/mira-new create a presentation called 'my-talk' with the neon-emerald theme
```

## Slide blueprints

The `slides/` layer holds blueprints for the recurring **types** of slide: cover, concept-with-animation, comparison, timeline, code, closing. The builder assembles a deck by composing these blueprints and filling them with your content. They are modular glassmorphism cards — glass-card, icon-hero, attribute-pills, replay-btn — navigated one at a time.

## Deck templates

The `decks/` layer holds complete, runnable presentations that serve as **skeletons**. When you run `new`, you pick a deck template that sets the overall shape of the presentation:

| Deck template | For |
|---|---|
| `aula-capitulo` | A class or lecture built from a chapter / module. |
| `pitch-projeto` | A project pitch. |
| `demo-tecnica` | A technical demo or walkthrough. |
| `sandeco-just-animation-template` | A #000000 stage with no text, only free-form animation. |

## The `@MIRA:` markers

Mira uses HTML/CSS comment markers to coordinate between agents:

| Marker | Meaning |
|---|---|
| `/* @MIRA:THEME */` | Where the theme CSS is injected into a deck. |
| `<!-- @MIRA:SIZE N/10 -->` | The perceived size of an animation. `mira-animator` stamps `3/10`; `mira-size-animator` reads and rewrites it. |

You normally don't touch these by hand — the agents manage them — but knowing they exist helps you understand how a deck is wired.
