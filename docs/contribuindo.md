# Contributing

Contributions are welcome. Open an issue to discuss the idea before submitting a pull request.

## Setup

```bash
git clone https://github.com/sandeco/mira-animator.git
cd mira-animator
npm install
```

## Project layout

```
mira-animator/
├── bin/mira.js          # CLI entry point
├── lib/                 # commands (install, link, sources, new, status, update, uninstall) and utils
├── agents/              # the Mira agents (skills), one folder each
│   └── _shared/         # rules shared by every agent (e.g. idioma.md)
├── templates/           # themes, slide blueprints, deck skeletons
└── docs/                # this documentation (MkDocs Material, 3 languages)
```

## Working on an agent

Each agent lives in `agents/<name>/` with a `SKILL.md` that defines its name, description and instructions. The description's trigger phrases are what make Claude invoke the skill, so keep them precise. Shared rules — like the language rule in `agents/_shared/idioma.md` — are inherited by every agent; prefer putting cross-cutting rules there.

## Working on the docs

The documentation is built with **MkDocs Material** and the **i18n** plugin, with three languages using the `suffix` structure: `page.md` (English, default), `page.pt.md` (Português), `page.es.md` (Español).

```bash
pip install mkdocs-material mkdocs-static-i18n
mkdocs serve      # preview at http://127.0.0.1:8000
```

When you add a page, add it to the `nav` in `mkdocs.yml`, add its English label to the `nav_translations` for `pt` and `es`, and create all three language files.

## Conventions

- Match the style and language idioms of the surrounding code.
- The CLI user-facing copy is in Portuguese; the docs are tri-lingual with English as the base.
- Don't break the `@MIRA:` markers — agents rely on them.

## License

MIT — see [LICENSE](https://github.com/sandeco/mira-animator/blob/main/LICENSE).
