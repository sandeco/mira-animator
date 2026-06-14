# Contribuir

Las contribuciones son bienvenidas. Abre un issue para discutir la idea antes de enviar un pull request.

## Setup

```bash
git clone https://github.com/sandeco/mira-animator.git
cd mira-animator
npm install
```

## Estructura del proyecto

```
mira-animator/
├── bin/mira.js          # punto de entrada del CLI
├── lib/                 # comandos (install, link, sources, new, status, update, uninstall) y utils
├── agents/              # los agentes de Mira (skills), una carpeta cada uno
│   └── _shared/         # reglas compartidas por todos los agentes (ej. idioma.md)
├── templates/           # temas, blueprints de slide, esqueletos de deck
└── docs/                # esta documentación (MkDocs Material, 3 idiomas)
```

## Trabajar en un agente

Cada agente vive en `agents/<nombre>/` con un `SKILL.md` que define nombre, descripción e instrucciones. Las frases de disparo de la descripción son lo que hacen que Claude invoque la skill, así que mantenlas precisas. Las reglas compartidas — como la regla de idioma en `agents/_shared/idioma.md` — son heredadas por todos los agentes; prefiere poner las reglas transversales ahí.

## Trabajar en la documentación

La documentación está hecha con **MkDocs Material** y el plugin **i18n**, con tres idiomas usando la estructura `suffix`: `pagina.md` (inglés, predeterminado), `pagina.pt.md` (Português), `pagina.es.md` (Español).

```bash
pip install mkdocs-material mkdocs-static-i18n
mkdocs serve      # preview en http://127.0.0.1:8000
```

Al añadir una página, inclúyela en el `nav` de `mkdocs.yml`, añade la etiqueta en inglés en las `nav_translations` de `pt` y `es`, y crea los tres archivos de idioma.

## Convenciones

- Sigue el estilo y los modismos del código que te rodea.
- El texto del CLI orientado al usuario está en portugués; la documentación es trilingüe con el inglés como base.
- No rompas los marcadores `@MIRA:` — los agentes dependen de ellos.

## Licencia

MIT — mira [LICENSE](https://github.com/sandeco/mira-animator/blob/main/LICENSE).
