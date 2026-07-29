# Agentes especializados

Recursos que ampliam um deck ou produzem um artefato específico fora da cadeia principal.

## `/mira-image-prompt`

Conduz uma entrevista em três rodadas e gera um prompt JSON estruturado para imagens de produto com estética cinematográfica. Cobre produto, cena, ação, composição, câmera, iluminação, paleta, resolução e proporção. Mostra um resumo para aprovação antes do JSON final. É otimizado para Nano Banana 2 via Google Antigravity, mas também serve como base para outros geradores.

## `/mira-webview`

Coloca um site ou aplicação dentro de um slide por meio de um `iframe` full-bleed. Aceita uma URL pública ou um projeto local copiado para `assets/webview/`. Uma guarda bloqueia a interação até o apresentador clicar; depois, o site recebe mouse e teclado normalmente. Sites que proíbem incorporação por `X-Frame-Options` ou CSP precisam de alternativa local ou captura.

## `/mira-tactics`

Cria uma mesa tática de futebol a partir do template `mesa-tatica`: campo responsivo, times e formações reais, jogadores chibi ou discos, movimentação ao vivo, setas, zonas, desenho, gravação de quadros-chave e replay suave. As jogadas podem ser salvas como JSON. A tecla `V` adapta o campo ao deck vertical e o estado pode ser sincronizado pelo `mira-remote-control`.

## `/mira-remote-control`

Transforma o celular em espelho, controle e telestrator do deck pela rede local, sem aplicativo, conta ou internet. Instala o servidor e a shell em `mira/` e deixa apenas os launchers Windows/macOS na raiz. O notebook é o palco, o primeiro aparelho externo vira controle e os demais espelham. O QR abre a sessão; a tecla `C` volta a mostrá-lo.

## `/mira-offline`

Converte todos os HTMLs de um deck existente para execução sem CDN. Copia Tailwind, AOS, Lucide, D3, Inter e, quando necessário, Three.js para `assets/vendor/`, reescreve os caminhos e remove conexões externas de fontes. É idempotente e deve rodar depois que o deck estiver pronto. Decks criados por `new` já nascem offline; esta skill serve para decks antigos ou modificados.
