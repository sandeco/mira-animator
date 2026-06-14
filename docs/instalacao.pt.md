# Instalação

## Requisitos

- **Node.js 18.20.2+**
- Um agente de código com IA que leia skills — o Mira é feito para o **Claude Code**, que carrega os agentes de `.claude/skills/`.

## Instalar

Crie (ou entre em) uma pasta dedicada aos seus slides — **nunca** o projeto sobre o qual você quer apresentar — e rode:

```bash
cd minha-pasta-de-slides
npx mira-animator install
```

O instalador:

1. Copia os agentes para `.claude/skills/`.
2. Copia os templates para `mira-templates/` (temas, blueprints de slide, esqueletos de deck).
3. Cria a pasta `decks/`, onde ficam todas as apresentações geradas.
4. Escreve `mira.config.json` (configuração e fontes vinculadas) e `CLAUDE.md` (instruções de entrada para o agente).

Ao terminar, a pasta fica mais ou menos assim:

```
minha-pasta-de-slides/
├── .claude/skills/        # os agentes do Mira
├── mira-templates/        # temas, slides, esqueletos de deck
├── decks/                 # suas apresentações geradas (começa vazia)
├── mira.config.json       # config + fontes vinculadas
└── CLAUDE.md              # instruções de entrada do agente
```

!!! warning "Instale numa pasta dedicada"
    O Mira **não** é instalado dentro do projeto sobre o qual você quer apresentar. Ele se instala na própria pasta de trabalho e lê de [fontes vinculadas](fontes.md). Os agentes leem das fontes mas escrevem só em `decks/`. Seus projetos de origem nunca são modificados.

## Vídeos de fundo (opcional)

Alguns decks usam vídeos de fundo nos cabeçalhos. Esses arquivos não vêm no pacote npm, para mantê-lo leve. Para baixá-los, rode a skill `/mira-get-videos` no Claude — ela busca os vídeos para `mira-templates/videos_header/`.

Se o cabeçalho de um deck parecer vazio onde deveria haver um vídeo, essa é a correção.

## Atualizar

```bash
npx mira-animator update
```

Atualiza os agentes e templates para a última versão.

## Desinstalar

```bash
npx mira-animator uninstall
```

Remove o Mira da pasta atual.

## Próximo passo

Vincule o conteúdo sobre o qual você quer apresentar → [Fontes vinculadas](fontes.md).
