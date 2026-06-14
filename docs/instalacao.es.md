# Instalación

## Requisitos

- **Node.js 18.20.2+**
- Un agente de código con IA que lea skills — Mira está hecho para **Claude Code**, que carga los agentes desde `.claude/skills/`.

## Instalar

Crea (o entra en) una carpeta dedicada a tus slides — **nunca** el proyecto sobre el que quieres presentar — y ejecuta:

```bash
cd mi-carpeta-de-slides
npx mira-animator install
```

El instalador:

1. Copia los agentes a `.claude/skills/`.
2. Copia las plantillas a `mira-templates/` (temas, blueprints de slide, esqueletos de deck).
3. Crea la carpeta `decks/`, donde viven todas las presentaciones generadas.
4. Escribe `mira.config.json` (configuración y fuentes vinculadas) y `CLAUDE.md` (instrucciones de entrada para el agente).

Al terminar, la carpeta queda más o menos así:

```
mi-carpeta-de-slides/
├── .claude/skills/        # los agentes de Mira
├── mira-templates/        # temas, slides, esqueletos de deck
├── decks/                 # tus presentaciones generadas (empieza vacía)
├── mira.config.json       # config + fuentes vinculadas
└── CLAUDE.md              # instrucciones de entrada del agente
```

!!! warning "Instala en una carpeta dedicada"
    Mira **no** se instala dentro del proyecto sobre el que quieres presentar. Se instala en su propia carpeta de trabajo y lee de [fuentes vinculadas](fontes.md). Los agentes leen de las fuentes pero escriben solo en `decks/`. Tus proyectos de origen nunca se modifican.

## Videos de fondo (opcional)

Algunos decks usan videos de fondo en sus encabezados. Esos archivos no vienen en el paquete npm, para mantenerlo ligero. Para descargarlos, ejecuta la skill `/mira-get-videos` en Claude — busca los videos en `mira-templates/videos_header/`.

Si el encabezado de un deck se ve vacío donde debería haber un video, esa es la solución.

## Actualizar

```bash
npx mira-animator update
```

Actualiza los agentes y plantillas a la última versión.

## Desinstalar

```bash
npx mira-animator uninstall
```

Elimina Mira de la carpeta actual.

## Siguiente paso

Vincula el contenido sobre el que quieres presentar → [Fuentes vinculadas](fontes.md).
