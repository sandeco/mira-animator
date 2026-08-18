# Transitions

Slide-to-slide transition effects.

## `/mira-transition-dissolve`
Applies a **dissolve** transition (a real crossfade, Canva/Keynote style) to slide navigation using the View Transitions API (same-document), which works on `file://` with no server. Writes `index-dissolve.html` next to the original. Browsers without the API navigate normally.

## `/mira-sequence`
The opposite case: **no transition at all**. It creates the next slide already standing on the exact pose the previous one was in, and the passage between the two is a dry cut, so the pair reads as a single slide whose animation changes behaviour halfway through. A perpetual loop has no last frame, so the source slide publishes its actors' live pose and the continuation locks it the moment it enters: hand over with the ball mid-air and it carries on mid-air. Going back reverses the continuation briefly and returns the source to its recorded rest instead of restarting it. A declared rest pose is the mandatory fallback, so the slide still works on its own for `mira-slide-to-video` and for anyone opening the deck straight on it. The deck's global transition is never touched, the dry cut belongs to that pair alone.

## `/mira-sequence-director`
The orchestrator above `/mira-sequence`. You describe what you want to explain, it turns that into a **long take**: one scene that transforms from beginning to end, cut into slides the audience reads as a single animation. It first applies a form test with the power to refuse, because an explanation that switches world, scale or subject halfway is not a long take and forcing one reads worse than ordinary slides. Approved, it writes a **continuity script** to `references/sequence-director-<id>.md` in the deck, declaring per scene the pair id, which actors cross the cut (and therefore enter with no choreography at all), which enter, which leave, the action, the rest pose written as an expression, and what changes next, which is literally the one input `/mira-sequence` cannot deduce on its own. Then it builds the chain **serially**: scene 1 through `/mira-animator`, every following link through `/mira-sequence`, each one written after reading the previous link's source. Serial is not a preference: link N+1's fallback pose has to carry the same expression as link N's rest, which is a source-code dependency, so parallel fan-out does not apply.
