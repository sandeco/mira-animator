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
| `new <nome>` | Cria um deck a partir de um template. |
| `edit <deck>` | Instala/atualiza as **ferramentas de autoria** (modo edição E — reordenar, edição livre, crop com Alt — e pintura P) num deck já existente. |
| `memoria <subcomando>` | Consulta e administra a memória local de preferências. |
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

Há duas formas de criar um deck. Pela CLI:

```bash
npx mira-animator new minha-aula [--deck=<template>] [--theme=<tema>]
```

Ou conversando com a skill `/mira-new`:

```text
/mira-new crie uma apresentação chamada 'minha-aula' com o template aula-capitulo e o tema mira-dark
```

As duas formas montam `decks/<nome>/`, criam `references/`, instalam os modos de edição e pintura em `mira/`, copiam as bibliotecas offline para `assets/vendor/` e registram o deck. A lista é lida dinamicamente de `templates/`; rode `npx mira-animator new` sem nome para consultar os valores instalados.

| Escolha | Valores |
|---|---|
| Template | `mira-default` (padrão), `aula-capitulo`, `pitch-projeto`, `demo-tecnica`, `sandeco-just-animation-template`, `mesa-tatica`, `mira-studio-demo`, `mira-studio-full-demo` |
| Tema | `mira-dark`, `light-minimal`, `corporate-blue`, `neon-emerald` |

## `edit`

```bash
npx mira-animator edit <deck>
```

Aplica as **ferramentas de autoria** num deck que já existe: copia `mira-edit.js`, `mira-edit-free.js` e `mira-draw.js` para `<deck>/mira/` e injeta os scripts antes de `</body>`. Abra o deck e aperte **E** para editar (reordenar slides + edição livre: mover, redimensionar, girar, duplicar, excluir, editar texto e **recortar com Alt + alça**, estilo OBS Studio) ou **P** para desenhar por cima, depois salve. Decks novos já vêm com tudo. É também o comando de **migração**: rode `npx mira-animator edit <deck>` em decks antigos para atualizá-los à versão mais recente das ferramentas (incluindo o crop com Alt). Veja [Agentes úteis](agentes/uteis.md) para como o reorder e o salvar funcionam.

## `memoria`

```bash
npx mira-animator memoria lembrancas [--papel capa] [--formato 16x9] [--tema mira-dark] [--eixo cor] [--registro nome]
npx mira-animator memoria nota "menos texto por slide" --eixo densidade
npx mira-animator memoria consolidar [--simular]
npx mira-animator memoria estado <arquivo.md> <ativo|suspenso|revogado|candidato|observado>
npx mira-animator memoria listar
npx mira-animator memoria onde
```

`lembrancas` seleciona as preferências aplicáveis ao contexto; `--registro` guarda a proveniência fora do deck. `nota` grava uma ordem explícita já ativa. `consolidar` encontra correções recorrentes e cria candidatas; `--simular` não grava. `estado` altera o ciclo de vida sem apagar a nota. `listar` mostra notas e reforços; `onde` mostra os caminhos da memória e da evidência. Por padrão, tudo fica em `~/.mira-memory/`; `MIRA_MEMORY_DIR` permite mudar esse local.

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
