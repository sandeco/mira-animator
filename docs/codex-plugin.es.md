# Plugin de Codex

Mira incluye un wrapper de plugin local para Codex en `plugins/mira-animator/`. El plugin ayuda a Codex a preparar Mira en una carpeta dedicada de slides, vincular fuentes de solo lectura, crear decks y seguir el flujo de validación de Mira.

El plugin no cambia el runtime del paquete npm. Se distribuye desde este repositorio como una entrada de marketplace local de Codex.

## Instalar desde este repositorio

Clona el repositorio y registra su marketplace local:

```bash
git clone https://github.com/sandeco/mira-animator.git
cd mira-animator
codex plugin marketplace add .
codex plugin add mira-animator@mira-animator
```

Después de instalarlo, inicia una nueva conversación en Codex para que Codex cargue los metadatos de la skill del plugin.

## Usar el plugin

Pide a Codex que use Mira, por ejemplo:

```text
Usa el plugin mira-animator para preparar una carpeta de slides para este proyecto.
```

El plugin debe guiar a Codex para:

1. Elegir o crear una carpeta dedicada de slides.
2. Verificar que Node.js sea 18.20.2 o superior.
3. Ejecutar `npx mira-animator install` dentro de la carpeta de slides.
4. Incluir la engine `Codex` cuando el instalador de Mira pregunte qué engines debe soportar.
5. Vincular proyectos o documentos fuente con `npx mira-animator link`.
6. Crear y validar decks dentro de `decks/`.

## Regla importante de aislamiento

No instales Mira dentro del proyecto fuente que quieres presentar, salvo que esa carpeta sea intencionalmente la carpeta de slides. Mira debe leer fuentes vinculadas y escribir la salida generada solo dentro de la carpeta de slides, principalmente en `decks/`.

## Archivos para mantenedores

- `.agents/plugins/marketplace.json` expone el marketplace local del repositorio.
- `plugins/mira-animator/.codex-plugin/plugin.json` define los metadatos del plugin.
- `plugins/mira-animator/skills/mira-animator/SKILL.md` define el flujo de Mira orientado a Codex.

El plugin acredita a sandeco como creador de Mira y a Mario Mayerle (`https://mariomayerle.com`) como desarrollador del plugin.
