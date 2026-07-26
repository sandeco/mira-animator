# Mira

**Convierte tus proyectos, libros y PDFs en presentaciones HTML animadas — creadas por un equipo de agentes de IA.**

*Mira* significa "mira" / "observa" en español. También es un acrónimo: **M**etáforas **I**nteligentes **R**esponsivas y **A**nimadas. El nombre es la promesa: *mira esto* — y el movimiento te hace mirar.

Mira es un conjunto de agentes, skills y plantillas para crear presentaciones HTML animadas (Tailwind + glassmorphism + animación vectorial programática) a partir del contenido que ya tienes. Sigue la filosofía de [Reversa](https://github.com/sandeco/reversa): se instala en una carpeta de trabajo aislada y lee contenido de **fuentes vinculadas**, sin mezclar nada con los proyectos de origen.

El resultado es un `index.html` autocontenido que se abre directo desde `file://` — sin servidor, sin build — listo para presentar o grabar en video.

---

## En un minuto

```bash
# 1. instala Mira en una carpeta nueva de slides
cd mi-carpeta-de-slides
npx mira-animator install

# 2. vincula el contenido sobre el que quieres presentar
npx mira-animator link ../mi-proyecto --name=miproyecto
```

Luego abre el proyecto en Claude y crea un deck conversando con él:

```text
/mira-new crea una nueva presentación llamada 'mi-clase'
```

Después di:

> *"rellena el deck mi-clase con el contenido de la fuente miproyecto"*

El pipeline de agentes lee la fuente, planifica los slides, escribe el texto, monta el HTML y coreografía las animaciones.

---

## Qué hace diferente a Mira

- **Fuentes vinculadas, no invasión.** Mira lee de las fuentes que vinculas, pero escribe solo en `decks/`. Tus proyectos de origen nunca se tocan.
- **Todo se mueve.** Cada slide de concepto recibe una animación en bucle continuo. La regla de oro de Mira: ninguna animación es estática — *entra* con coreografía y *después* entra en bucle.
- **Metáforas, no viñetas.** El agente `mira-animator` convierte conceptos abstractos en analogías concretas y animadas de la vida diaria.
- **Varios formatos desde un solo deck.** Un deck 16:9 se convierte en versiones 1:1, 9:16, regla de los tercios y transición disolvencia — sin tocar el original.
- **Más que slides.** Coloca un **elemento 3D** real (auto-rotante, arrastrable) o un **código QR** escaneable directo en un card, con `/mira-3d` y `/mira-qrcode`.
- **Corre en cualquier lugar.** La salida es HTML puro. Doble clic en el archivo. Sin servidor, sin toolchain.

---

## Por dónde seguir

| Quieres… | Lee |
|---|---|
| Entender el problema que Mira resuelve | [Por qué Mira](por-que-mira.md) |
| Instalarlo | [Instalación](instalacao.md) |
| Entender el modelo de fuentes vinculadas | [Fuentes vinculadas](fontes.md) |
| Crear tu primer deck | [Cómo usar](uso.md) |
| Ver todos los comandos | [CLI](cli.md) |
| Entender el equipo de agentes | [Pipeline de agentes](pipeline.md) · [Agentes](agentes.md) |
| Exportar a formatos de redes sociales | [Formatos de vídeo](formatos.md) |
| Personalizar la apariencia | [Temas y plantillas](temas.md) |
