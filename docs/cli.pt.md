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

## Criar um deck (`/mira-new`)

Criar um deck **não** é um comando de CLI — você faz isso conversando com o Mira no Claude, pela skill `/mira-new`:

```text
/mira-new crie uma nova apresentação chamada 'minha-aula'
```

Ela monta `decks/<nome>/` a partir de um template e registra o deck. Você pode já indicar o template e o tema na própria frase:

```text
/mira-new crie uma apresentação chamada 'minha-aula' com o template aula-capitulo e o tema mira-dark
```

| Escolha | Valores |
|---|---|
| Template | `aula-capitulo`, `pitch-projeto`, `demo-tecnica`, `animacao-livre` |
| Tema | `mira-dark`, `light-minimal`, `corporate-blue`, `neon-emerald` |

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
