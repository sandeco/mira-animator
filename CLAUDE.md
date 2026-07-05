# CLAUDE.md

Instruções do projeto MIRA. Siga à risca.

## Estrutura de pastas de um deck (diretiva)

A raiz de um deck contém SOMENTE `index.html` e os launchers (`remote-control-windows.bat` / `remote-control-apple.command`, quando o remote estiver instalado). Todo o resto tem lugar fixo:

- **`mira/`**: arquivos de apoio do Mira (`mira-edit.js`, `mira-draw.js`, `mira-tactics.js`, `mira-remote-server.cjs`, `mira-remote.html`). Os `<script>` do deck apontam para `mira/mira-*.js`.
- **`assets/`**: imagens, logos, fontes e libs vendoradas (`assets/vendor/`).

Nunca gere ou copie `.js` de apoio para a raiz do deck. Ao mexer num deck antigo com JS na raiz, migre para `mira/` e reaponte as tags (o `npx mira-animator edit <deck>` faz essa migração).

## Organização de arquivos

- **Arquivos de brainstorm** (qualquer `BRAINSTORM_*.md` ou documento de ideação/brainstorming): devem ser SEMPRE salvos na pasta `brainstormings/`. NUNCA na raiz do projeto.
  - Ao criar um novo brainstorm, grave direto em `brainstormings/`.
  - Se encontrar algum brainstorm na raiz, mova-o para `brainstormings/`.
