# CLAUDE.md

Instruções do projeto MIRA. Siga à risca.

## Estilo de resposta

Seja sempre breve. Vá direto ao ponto, sem preâmbulo nem resumos longos.

## Estrutura de pastas de um deck (diretiva)

A raiz de um deck contém SOMENTE `index.html` e os launchers (`remote-control-windows.bat` / `remote-control-apple.command`, quando o remote estiver instalado). Todo o resto tem lugar fixo:

- **`mira/`**: arquivos de apoio do Mira (`mira-edit.js`, `mira-draw.js`, `mira-remote-server.cjs`, `mira-remote.html`). Os `<script>` do deck apontam para `mira/mira-*.js`.
- **`assets/`**: imagens, logos, fontes e libs vendoradas (`assets/vendor/`).

Nunca gere ou copie `.js` de apoio para a raiz do deck. Ao mexer num deck antigo com JS na raiz, migre para `mira/` e reaponte as tags (o `npx mira-animator edit <deck>` faz essa migração).

## Modos de edição e pintura em todo deck (diretiva)

TODO deck (novo ou existente) tem que ter os modos de pintura (**tecla P**, `mira-draw.js`) e de edição (**tecla E**, `mira-edit.js` + `mira-edit-free.js`) funcionando. Ao criar ou mexer em qualquer deck, garanta os três arquivos em `mira/` e as tags antes do `</body>`:

```html
<script defer src="mira/mira-edit.js"></script>
<script defer src="mira/mira-edit-free.js"></script>
<script defer src="mira/mira-draw.js"></script>
```

`mira-edit-free.js` sempre depois de `mira-edit.js`. Se encontrar um deck sem esses módulos, instale-os na hora (copie de um deck atualizado ou de `templates/authoring/`).

## Diretriz de título da capa (não-negociável)

O título do **primeiro slide (a capa, o "header" do deck)** nunca pode quebrar com uma linha muito maior que a outra deixando artigo/preposição solto (ex.: "Responsividade em quatro" / "formatos"). O CSS base de todo deck deve levar `text-wrap: balance` escopado **só à capa** (`body > section:first-of-type h1, body > section:first-of-type h2`). Detalhes em `agents/_shared/titulo-capa.md`. Vale só para a capa; slides de conteúdo não entram nesta regra.

## Organização de arquivos

- **Arquivos de brainstorm** (qualquer `BRAINSTORM_*.md` ou documento de ideação/brainstorming): devem ser SEMPRE salvos na pasta `brainstormings/`. NUNCA na raiz do projeto.
  - Ao criar um novo brainstorm, grave direto em `brainstormings/`.
  - Se encontrar algum brainstorm na raiz, mova-o para `brainstormings/`.


---

# Reversa

> Framework de Engenharia Reversa instalado neste projeto.

## Como usar

Use o fluxo adequado no chat:

- `/reversa` — descobrir e documentar um sistema existente
- `/reversa-new` — criar PRD e specs para um projeto novo
- `/reversa-forward` — implementar ou evoluir código a partir das specs
- `/reversa-migrate` — planejar a migração de um sistema legado
- `/reversa-docs` — gerar o mini-site visual da documentação
- `/reversa-agents-help` — consultar o catálogo completo de agentes

## Comportamento ao ativar

Quando o usuário digitar `/reversa` ou a palavra `reversa` sozinha em uma mensagem:

1. Ative o skill `reversa` disponível em `.claude/skills/reversa/SKILL.md`
2. Se não encontrar em `.claude/skills/`, tente `.agents/skills/reversa/SKILL.md`
3. Leia o SKILL.md na íntegra e siga exatamente as instruções do Reversa

## Regra não-negociável

Nunca apague, modifique ou sobrescreva arquivos pré-existentes do projeto legado.
O Reversa escreve apenas em `.reversa/`, `_reversa_sdd/`, `_reversa_docs/` e `_reversa_forward/`.
