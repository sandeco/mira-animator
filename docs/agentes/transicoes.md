# Transitions

Slide-to-slide transition effects.

## `/mira-transition-dissolve`
Applies a **dissolve** transition (a real crossfade, Canva/Keynote style) to slide navigation using the View Transitions API (same-document), which works on `file://` with no server. Writes `index-dissolve.html` next to the original. Browsers without the API navigate normally.

## `/mira-sequence`
The opposite case: **no transition at all**. It creates the next slide already standing on the exact pose the previous one was in, and the passage between the two is a dry cut, so the pair reads as a single slide whose animation changes behaviour halfway through. A perpetual loop has no last frame, so the source slide publishes its actors' live pose and the continuation locks it the moment it enters: hand over with the ball mid-air and it carries on mid-air. A declared rest pose is the mandatory fallback, so the slide still works on its own for `mira-slide-to-video` and for anyone opening the deck straight on it. The deck's global transition is never touched, the dry cut belongs to that pair alone.
