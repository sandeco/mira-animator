# Specialized agents

Features that extend a deck or produce a focused artifact outside the main pipeline.

## `/mira-image-prompt`

Runs a three-round interview and produces a structured JSON prompt for cinematic product imagery. It covers the product, scene, action, composition, camera, lighting, palette, resolution and aspect ratio, then asks for approval before producing the final JSON. It is optimized for Nano Banana 2 through Google Antigravity, but also works as a base for other image generators.

## `/mira-webview`

Embeds a website or application into a full-bleed slide through an `iframe`. It accepts either a public URL or a local project copied under `assets/webview/`. An interaction guard blocks input until the presenter clicks; the live site then receives mouse and keyboard normally. Sites that deny embedding through `X-Frame-Options` or CSP require a local alternative or a capture.

## `/mira-tactics`

Builds a football tactics board from the bundled `mesa-tatica` template: responsive pitch, real teams and formations, chibi players or discs, live movement, arrows, zones, drawing, keyframe recording and smooth replay. Plays can be saved as JSON. The `V` key adapts the pitch to a vertical deck, and its state can be synchronized by `mira-remote-control`.

## `/mira-remote-control`

Turns a phone into a mirror, remote and telestrator over the local network, with no app, account or internet. It installs the server and mirroring shell under `mira/`, leaving only the Windows/macOS launchers in the deck root. The notebook is the stage, the first external device becomes the controller, and later devices mirror. The QR code joins the session; press `C` to show it again.

## `/mira-offline`

Converts every HTML file in an existing deck to run without a CDN. It copies Tailwind, AOS, Lucide, D3, Inter and, when needed, Three.js to `assets/vendor/`, rewrites paths and removes external font connections. It is idempotent and should run after the deck is finished. Decks created by `new` already start offline; this skill covers older or modified decks.
