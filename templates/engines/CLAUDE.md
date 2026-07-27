# {{PROJECT_NAME}} — Pasta de criação de slides (Mira)

Esta pasta é uma instalação do **Mira**: agentes e templates para criar apresentações HTML animadas com D3.js. Trate {{USER_NAME}} pelo nome e interaja em {{CHAT_LANGUAGE}}.

## Regras para o agente

1. **Fontes vinculadas**: o conteúdo das apresentações vem das fontes listadas em `mira.config.json` (`sources[]`). Leia das fontes, mas NUNCA crie, edite ou apague arquivos dentro delas. Todo output vai para `decks/`.
2. **Pipeline**: para criar slides, siga a ordem: `/mira-extract` → `/mira-planner` → `/mira-copywriter` → `/mira-builder` + `/mira-animator` → `/mira-validator`.
3. **Regra zero de animação**: toda animação ENTRA com coreografia e DEPOIS continua em loop interno perpétuo. Animação estática é proibida.
4. **Tema**: o tema padrão deste projeto é `{{DEFAULT_THEME}}`. Use SEMPRE as CSS variables do tema (`var(--mira-primary)` etc.) — nunca cores hardcoded. Temas em `mira-templates/themes/`.
5. **Idioma**: siga `_shared/idioma.md` — todo texto visível em português brasileiro com acentuação 100% correta.
6. **Templates**: blueprints de slides em `mira-templates/slides/`, decks completos em `mira-templates/decks/`, cards atômicos em `mira-builder/templates/` (dentro das skills).
7. **Offline / firewall**: por padrão o deck carrega libs por CDN (Tailwind, AOS, Lucide, D3, fonte Inter). Se o usuário disser que o slide é bloqueado pelo firewall da empresa ou precisa rodar sem internet, use `/mira-offline` para deixar o deck self-contained (libs locais em `assets/vendor/`, abre por `file://`).

## Início da sessão

Um hook `SessionStart` já roda `node .mira/bin/version-notice.js` automaticamente. Se aparecer uma linha `[MIRA] Atualização disponível...` no contexto, siga a instrução dela: avise o usuário em uma linha e pergunte se ele quer que você atualize com `npx mira-animator update`. Só atualize se ele confirmar. (Se o hook estiver desligado, rode o script você mesmo no primeiro turno.)

## Estrutura de cada deck

A raiz contém somente o HTML final, launchers aplicáveis, `roteiro.md` nos decks de gravação e a pasta obrigatória `references/`. Arquivos de apoio ficam em `mira/`; imagens, fontes e bibliotecas ficam em `assets/`.

## Estrutura

```
mira.config.json     fontes vinculadas, tema padrão, decks criados
decks/               apresentações geradas (uma pasta por deck)
mira-templates/      themes, slides e decks de referência
.mira/               estado da instalação (não editar manualmente)
```
