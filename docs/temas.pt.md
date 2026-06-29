# Temas e templates

A aparência do Mira vem de três camadas em `templates/`. Elas separam *identidade* (cores, tipografia), *estrutura* (tipos de slide) e *exemplos completos* (decks rodáveis).

```
templates/
├── themes/     # identidade visual via CSS variables
├── slides/     # blueprints de tipos de slide
└── decks/      # apresentações completas e rodáveis
```

## Temas

Um tema é um conjunto de CSS variables que definem a identidade visual do deck — cores, acentos, superfícies. Ao criar um deck, o tema escolhido é injetado no marcador `/* @MIRA:THEME */`, então o deck inteiro herda uma paleta consistente.

| Tema | Vibe |
|---|---|
| `mira-dark` | Escuro, glassmorphism, acentos neon — o padrão. |
| `light-minimal` | Claro, limpo, minimalista. |
| `corporate-blue` | Profissional, azul, corporativo. |
| `neon-emerald` | Escuro com acentos esmeralda vivos. |

Escolha um tema na criação, de forma conversacional pelo `/mira-new`:

```text
/mira-new crie uma apresentação chamada 'minha-aula' com o tema neon-emerald
```

## Blueprints de slide

A camada `slides/` guarda blueprints para os **tipos** recorrentes de slide: capa, conceito com animação, comparação, timeline, código, encerramento. O builder monta um deck compondo esses blueprints e preenchendo com o seu conteúdo. São cards glassmorphism modulares — glass-card, icon-hero, attribute-pills, replay-btn — navegados um a um.

## Templates de deck

A camada `decks/` guarda apresentações completas e rodáveis que servem de **esqueleto**. Ao rodar `new`, você escolhe um template de deck que define o formato geral da apresentação:

| Template de deck | Para |
|---|---|
| `aula-capitulo` | Uma aula ou palestra a partir de um capítulo / módulo. |
| `pitch-projeto` | Um pitch de projeto. |
| `demo-tecnica` | Uma demo técnica ou walkthrough. |
| `sandeco-just-animation-template` | Um palco em #000000, sem texto, apenas para animacao livre. |

## Os marcadores `@MIRA:`

O Mira usa marcadores em comentário HTML/CSS para coordenar entre os agentes:

| Marcador | Significado |
|---|---|
| `/* @MIRA:THEME */` | Onde o CSS do tema é injetado no deck. |
| `<!-- @MIRA:SIZE N/10 -->` | A percepção de tamanho de uma animação. O `mira-animator` estampa `3/10`; o `mira-size-animator` lê e reescreve. |

Normalmente você não mexe nesses marcadores à mão — os agentes os gerenciam — mas saber que existem ajuda a entender como um deck é montado.
