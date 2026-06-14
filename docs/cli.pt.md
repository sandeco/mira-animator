# CLI

Todos os comandos são executados com `npx mira-animator <comando>` (o binário também está disponível como `mira` depois de instalado).

```bash
npx mira-animator --help        # lista os comandos
npx mira-animator --version      # mostra a versão
```

## Comandos

| Comando | Descrição |
|---|---|
| `install` | Instala o Mira na pasta atual (agentes, templates, config). |
| `link <caminho>` | Vincula uma pasta ou arquivo como fonte de conteúdo. |
| `sources` | Lista as fontes vinculadas. |
| `new <nome>` | Cria um novo deck a partir de um template. |
| `status` | Mostra o estado da instalação e dos decks. |
| `update` | Atualiza agentes e templates para a última versão. |
| `uninstall` | Remove o Mira da pasta atual. |

## `install`

```bash
npx mira-animator install
```

Copia os agentes para `.claude/skills/`, os templates para `mira-templates/`, cria `decks/` e escreve `mira.config.json` + `CLAUDE.md`. Veja [Instalação](instalacao.md).

## `link`

```bash
npx mira-animator link <caminho> [--name=<apelido>] [--type=projeto|pdf|latex|texto]
```

Vincula uma pasta ou arquivo como fonte de conteúdo somente leitura.

| Opção | Significado |
|---|---|
| `--name=<apelido>` | Apelido curto usado depois para referenciar a fonte. |
| `--type=...` | `projeto`, `pdf`, `latex` ou `texto`. Inferido quando omitido. |

Veja [Fontes vinculadas](fontes.md).

## `sources`

```bash
npx mira-animator sources
```

Lista cada fonte vinculada com apelido, tipo e caminho.

## `new`

```bash
npx mira-animator new <nome> [--deck=<template>] [--theme=<tema>]
```

Cria um novo deck em `decks/<nome>/` a partir de um template.

| Opção | Valores |
|---|---|
| `--deck` | `aula-capitulo`, `pitch-projeto`, `demo-tecnica` |
| `--theme` | `mira-dark`, `light-minimal`, `corporate-blue`, `neon-emerald` |

Você também pode criar decks de forma conversacional com a skill `/mira-new` no Claude.

## `status`

```bash
npx mira-animator status
```

Mostra o estado da instalação e os decks existentes.

## `update`

```bash
npx mira-animator update
```

Atualiza os agentes e templates para a última versão.

## `uninstall`

```bash
npx mira-animator uninstall
```

Remove o Mira da pasta atual.
