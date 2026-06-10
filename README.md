# Mira

Slides animados com D3 — mire a atenção onde importa.

O Mira é um conjunto de agentes, skills e templates para criar apresentações HTML animadas (D3.js v7 + Tailwind + glassmorphism) a partir do conteúdo dos seus projetos, livros ou PDFs. Ele segue a filosofia do [Reversa](https://github.com/sandeco/reversa): instala-se numa pasta de trabalho isolada e lê conteúdo de fontes vinculadas, sem misturar nada com os projetos de origem.

## Instalação

```bash
cd minha-pasta-de-slides
npx mira-animator install
```

A instalação copia os agents para `.claude/skills/`, os templates para `mira-templates/`, cria a pasta `decks/` e escreve `mira.config.json` + `CLAUDE.md`.

## Conceito central: fontes vinculadas

O Mira nunca é instalado dentro do projeto sobre o qual você quer apresentar. Em vez disso, você vincula fontes:

```bash
# uma pasta de outro projeto
npx mira-animator link C:/projetos/reversa --name=reversa

# um PDF na própria pasta
npx mira-animator link ./inbox/artigo.pdf

# listar fontes
npx mira-animator sources
```

Os agentes leem das fontes, mas escrevem somente em `decks/`.

## Criando um deck

```bash
npx mira-animator new minha-aula --deck=aula-capitulo --theme=mira-dark
```

Templates de deck: `aula-capitulo`, `pitch-projeto`, `demo-tecnica`.
Temas: `mira-dark`, `light-minimal`, `corporate-blue`, `neon-emerald`.

Depois, no Claude: "preencha o deck minha-aula com o conteúdo da fonte reversa".

## Pipeline de agentes

```
mira-extract      lê a fonte vinculada e gera o briefing
mira-planner      plano de slides + aprovação do usuário
mira-copywriter   refinamento de texto e imagens
mira-builder      montagem do HTML (glass-cards)
mira-animator     animações D3 com loop interno (inclui diretrizes D3 em references/)
mira-size-animator ajusta a percepção de tamanho das animações numa escala de 1 a 10 (base 3/10)
mira-visuals      imagens estáticas: painéis, diagramas, gráficos e infográficos
mira-validator    relatório de conformidade final
```

Apoio: `mira-image-prompt` (prompts JSON para foto realista) e `mira-img-animator` (anima imagens existentes). Regra de idioma compartilhada em `agents/_shared/idioma.md`.

O `mira-size-animator` lê o marcador `<!-- @MIRA:SIZE N/10 -->` que o `mira-animator` estampa em cada animação (sempre 3/10 ao gerar) e escala a composição dentro do SVG para preencher mais ou menos o palco, sem alterar a altura do palco nem o loop interno. "Coloca as animações em 6/10" sobe o nível; "esse slide em 2/10" desce.

## Templates

Três camadas em `templates/`:

- `themes/` — identidade visual via CSS variables. O tema é injetado no deck na criação (`/* @MIRA:THEME */`).
- `slides/` — blueprints de tipos de slide: capa, conceito com animação D3, comparação, timeline, código, encerramento.
- `decks/` — apresentações completas e rodáveis que servem de esqueleto.

## Comandos

| Comando | Descrição |
|---|---|
| `npx mira-animator install` | Instala na pasta atual |
| `npx mira-animator link <caminho>` | Vincula fonte de conteúdo |
| `npx mira-animator sources` | Lista