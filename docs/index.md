# Mira

**Turn your projects, books and PDFs into animated HTML presentations — built by a team of AI agents.**

*Mira* means "look" / "see" in Spanish. It is also an acronym: **M**etáforas **I**nteligentes **R**esponsivas e **A**nimadas (Smart, Responsive, Animated Metaphors). The name is the promise: *look at this* — and motion makes you look.

Mira is a set of agents, skills and templates for creating animated HTML presentations (Tailwind + glassmorphism + programmatic vector animation) out of the content you already have. It follows the [Reversa](https://github.com/sandeco/reversa) philosophy: it installs into an isolated working folder and reads content from **linked sources**, never mixing anything with the source projects.

The output is a self-contained `index.html` that opens straight from `file://` — no server, no build step — ready to present or to screen-record for video.

---

## In one minute

```bash
# 1. install Mira in a fresh slides folder
cd my-slides-folder
npx mira-animator install

# 2. link the content you want to present about
npx mira-animator link ../my-project --name=myproject

# 3. create a deck
npx mira-animator new my-talk --deck=aula-capitulo --theme=mira-dark
```

Then open the project in Claude and say:

> *"fill the deck my-talk with content from the myproject source"*

The agent pipeline reads the source, plans the slides, writes the copy, builds the HTML and choreographs the animations.

---

## What makes Mira different

- **Linked sources, not invasion.** Mira reads from sources you link but writes only to `decks/`. Your source projects are never touched.
- **Everything moves.** Every concept slide gets a continuously looping animation. Mira's golden rule: no animation is static — it *enters* with choreography and *then* loops.
- **Metaphors, not bullet points.** The `mira-animated-metaphor` agent turns abstract concepts into concrete, animated everyday analogies.
- **Many formats from one deck.** A single 16:9 deck becomes 1:1, 9:16, rule-of-thirds, and dissolve-transition variants — without touching the original.
- **Runs anywhere.** Output is plain HTML. Double-click the file. No server, no toolchain.

---

## Where to go next

| You want to… | Read |
|---|---|
| Understand the problem Mira solves | [Why Mira](por-que-mira.md) |
| Install it | [Installation](instalacao.md) |
| Learn the linked-sources model | [Linked sources](fontes.md) |
| Build your first deck | [How to use](uso.md) |
| See every command | [CLI](cli.md) |
| Understand the agent team | [Agent pipeline](pipeline.md) · [Agents](agentes.md) |
| Export to social formats | [Video formats](formatos.md) |
| Customize the look | [Themes and templates](temas.md) |
