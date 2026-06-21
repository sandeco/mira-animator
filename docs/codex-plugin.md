# Codex plugin

Mira includes a local Codex plugin wrapper under `plugins/mira-animator/`. The plugin helps Codex bootstrap Mira in a dedicated slides workspace, link sources read-only, create decks, and follow the Mira validation workflow.

The plugin does not change the npm package runtime. It is distributed from this repository as a local Codex marketplace entry.

## Install from this repository

Clone the repository and register its local marketplace:

```bash
git clone https://github.com/sandeco/mira-animator.git
cd mira-animator
codex plugin marketplace add .
codex plugin add mira-animator@mira-animator
```

After installing, start a new Codex thread so Codex can load the plugin's skill metadata.

## Use the plugin

Ask Codex to use Mira, for example:

```text
Use the mira-animator plugin to set up a slides workspace for this project.
```

The plugin should guide Codex to:

1. Choose or create a dedicated slides workspace.
2. Check that Node.js is version 18.20.2 or newer.
3. Run `npx mira-animator install` inside the slides workspace.
4. Include the `Codex` engine when the Mira installer asks which engines to support.
5. Link source projects or documents with `npx mira-animator link`.
6. Create and validate decks under `decks/`.

## Important isolation rule

Do not install Mira inside the source project you want to present unless that folder is intentionally the slides workspace. Mira should read linked sources and write generated output only inside the slides workspace, mainly under `decks/`.

## Files for maintainers

- `.agents/plugins/marketplace.json` exposes the repository-local marketplace.
- `plugins/mira-animator/.codex-plugin/plugin.json` defines the plugin metadata.
- `plugins/mira-animator/skills/mira-animator/SKILL.md` defines the Codex-facing Mira workflow.

The plugin credits sandeco as the Mira creator and Mario Mayerle (`https://mariomayerle.com`) as a plugin developer.
