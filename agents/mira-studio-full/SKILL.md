---
name: mira-studio-full
description: >-
  Gera um deck HORIZONTAL 16:9 (1920x1080, arquivo index-16x9.html) pronto para
  gravar videoaula sem OBS, onde cada slide declara um de três layouts: camera
  (webcam ao vivo em tela cheia), thirds (animação nos dois terços da esquerda
  + câmera ao vivo no terço direito) e full (animação em tela cheia, sem
  câmera). Os slides nascem do roteiro.md (layout,
  título e animação declarativa linha/orbita por cabeçalho), o teleprompter em
  overlay fica fora do vídeo via Element Capture e a gravação nativa sai em MP4
  full-hd pela tecla R, com painel de encoder, câmera, microfone e gravação
  direta no disco. Use SEMPRE que o usuário disser /mira-studio-full, deck 16:9
  com câmera, videoaula com câmera embutida, studio horizontal, gravar aula em
  full hd, terços com câmera, ou pedir slides horizontais que misturam câmera e
  animação num vídeo 16:9. Para vídeo VERTICAL 9:16 (Reels, Shorts, TikTok),
  use /mira-studio.
---

# Skill: Mira Studio Full (16:9 com câmera embutida, gravação nativa)

Cria decks horizontais 16:9 full-hd para gravação de videoaula em que o apresentador aparece AO VIVO dentro do próprio slide. Cada slide declara um layout no `roteiro.md`:

- **`camera`** — a webcam preenche o quadro inteiro (você falando).
- **`thirds`** — título + animação declarativa nos 2/3 da esquerda e a câmera ao vivo no 1/3 direito (separados por uma linha sutil).
- **`full`** — título + animação no quadro inteiro, sem câmera (a fala fica em off, lida no teleprompter).

> **Fonte da verdade:** o padrão desta skill está congelado no deck de referência. Resolva o arquivo nesta ordem:
> 1. `mira-templates/decks/mira-studio-full-demo/index-16x9.html` (projeto com Mira instalado)
> 2. `templates/decks/mira-studio-full-demo/index-16x9.html` (repositório fonte do Mira)
> 3. `node_modules/mira-animator/templates/decks/mira-studio-full-demo/index-16x9.html`
>
> Se nenhum existir, peça para rodar `npx mira-animator update`. Em dúvida sobre um valor exato, o resultado deve bater com o deck de referência.

## O resultado, em uma frase

Um quadro 16:9 cravado à janela (letterbox `#333333` quando a tela não é 16:9) chamado `index-16x9.html`, onde cada `body > section` declara `data-layout="camera|thirds|full"`, os slides NASCEM do `roteiro.md` (layout, título e animação `linha:`/`orbita:` por cabeçalho; texto da fala sincronizando ao vivo), a webcam entra ao vivo pelas `.cam-area` (`mira/mira-camera.js`), o teleprompter em overlay fica FORA do vídeo via Element Capture, e a tecla **R** grava um MP4 1920x1080 direto no disco pelo `mira/mira-record-16x9.js`, sem OBS.

## Diferenças para o /mira-studio (não confunda)

| | `/mira-studio` | `/mira-studio-full` |
|---|---|---|
| Formato | 9:16 vertical (coluna) | 16:9 horizontal (quadro cobre a janela) |
| Arquivo | `index.html` | `index-16x9.html` |
| Layouts | `capa`, `camera`, `split`, `full` | `camera`, `thirds`, `full` |
| Animações | autorais (escritas à mão por slide) | declarativas no roteiro (`linha:` / `orbita:`), autoral opcional |
| Gravador | `mira-record.js` (1080x1920) | `mira-record-16x9.js` (1920x1080) |
| Painel de gravação | na margem, fora da coluna | SOBRE o slide (some do vídeo via Element Capture) |
| Launcher | `mira-studio-windows.bat` | `mira-studio-16x9-windows.bat` / `-apple.command` |

Pedido de vertical/Reels/Shorts dentro desta skill: aponte para `/mira-studio`.

## Dimensão (o bloco de formato canônico)

O quadro é 16:9 cravado e generalista para a tela: `--fmt-w: min(100vw, calc(100vh * 16 / 9))` e `--fmt-h: min(100vh, calc(100vw * 9 / 16))`. Em tela cheia num display 1080p fecha exatos 1920x1080; em janela menor encolhe mantendo a proporção. Regras que acompanham (todas no deck de referência):

- `body > section` com `margin: calc((100vh - var(--fmt-h)) / 2) 0` e `scroll-margin-top` igual: a sobra vertical vira faixa `#333` acima e abaixo, nunca o slide seguinte.
- `html` com `scroll-snap-type: y proximity`, `scrollbar-width: none` e `overflow-x: hidden`: a barra de rolagem roubava largura e criava scroll horizontal em F11. Navegação por teclado ou roda do mouse.
- `body > section { isolation: isolate }` é PRÉ-REQUISITO do Element Capture: sem stacking context o Chrome aceita o `restrictTo` e não emite frame nenhum (o MP4 sai vazio).
- `thirds`: `.thirds-main` com `width: 66.667%`, `padding: 50px` (área segura onde título e animação vivem), `h2` centrado no topo; `.cam-area` com `width: 33.333%` e `border-left: 1px solid var(--line)`.
- `full`: `.full-main` ocupando o quadro inteiro (`padding: 50px`, mesma área segura), `h2` centrado no topo, SEM `.cam-area` (o builder não a cria neste layout).
- Tema mira-dark embutido nas variáveis `--mira-*` (deck self-contained); destaque `#FF904D`.
- Primeiro slide com `h1/h2`: `text-wrap: balance` (diretiva do título da capa).

## Roteiro externo `roteiro.md` (os slides nascem dele)

Todo deck gerado leva um **`roteiro.md` na raiz**: é dele que saem os slides E as animações. O usuário escreve no editor que quiser e vê o resultado no deck aberto.

**Gramática (uma linha por cabeçalho):**

```
## Slide N | layout | Título | animação
```

- `layout` (obrigatório): `camera`, `thirds` ou `full`, comparado em minúsculas. Valor desconhecido cai em `camera`.
- `Título` (thirds/full): `*entre asteriscos*` vira `<span class="accent">`, montado por fragmento (**nunca `innerHTML`**).
- `animação` (thirds/full): **`linha: A, B, C, D`** (etapas em diagonal, orbe percorrendo e acendendo cada nó com pulso) ou **`orbita: A, B, C @ NÚCLEO`** (satélites girando em elipse em torno do núcleo). Sem o campo ou valor inválido, cai em `linha` padrão.
- O número do cabeçalho é **rótulo, não índice**: o mapeamento é sempre pela ordem de aparição.
- O texto abaixo do cabeçalho é a fala do slide (teleprompter e overlay).

**O que sincroniza e o que não:**

| Dado | Fonte da verdade | Quando vale |
|------|------------------|-------------|
| Layout, título, animação | `roteiro.md` | lido uma vez, no **load** (mudou, recarregue) |
| Texto da fala | `roteiro.md` | **ao vivo**, nos dois sentidos |
| Posição/tamanho/fonte do overlay + textos | bloco `#mira-studio-state` no `index-16x9.html` | Ctrl+S |
| Cópia de trabalho | `localStorage` | entre polls |

- Builder **síncrono antes** das animações e dos `<script defer>` (os módulos leem as `<section>` logo em seguida): busca o `.md`, guarda texto bruto, intro e cabeçalhos, remonta as seções antes do painel do teleprompter. As `<section>` estáticas do HTML ficam como fallback: em `file://` ou sem o arquivo, elas SÃO o deck.
- Sincronização: poll de leitura a cada **1,5 s**, escrita com debounce de **800 ms**. Guards obrigatórios: escrita em voo trava o poll; gravação em andamento trava o poll; campo com foco não é sobrescrito; conteúdo idêntico aborta.
- A escrita de volta remonta o arquivo com a intro e os cabeçalhos capturados no load, mais os textos atuais. Cabeçalho nunca é reescrito a partir do estado do deck. Arquivo ausente (404) é recriado uma vez.
- **Estado no arquivo:** diferente do 9:16, aqui o `#mira-studio-state` guarda **texto (`mira-tp-text`) E layout do overlay (`mira-tp-ov-pos`)**. O seed no load é **guardado por hash**: só sobrescreve o `localStorage` quando o bloco MUDOU desde o último seed, então ajustes locais ainda não salvos sobrevivem a um recarregar, e um arquivo atualizado sempre vence.

## As animações declarativas (animLinha e animOrbita)

Os dois geradores estão no deck de referência; copie-os como estão. Regras que carregam:

- **Regra Zero:** entrada coreografada (haste se desenha e nós pipocam; núcleo cresce e satélites acendem) e DEPOIS o loop perpétuo via `d3.timer`, com generation counter (`window.__animGen[svgId]`): cada rebuild mata o timer anterior no próximo tick.
- **Fora da tela o loop morre:** `IntersectionObserver` (threshold 0.35) reconstrói ao entrar e invalida a geração ao sair. Trocar de slide não acumula timers.
- `casarPalco` (viewBox casado ao box real do palco) + `fitOnce` sobre a parte ESTÁTICA, uma vez (reenquadrar a cada frame faz o palco reescalar junto com o que se move).
- Todo callback de `d3.timer` dentro de `try/catch`: uma exceção congela a fila inteira de timers do d3.
- Texto SVG: `font-size >= 24` para `W = 960`; cor da marca `#FF904D` via variáveis do tema; sem arco-íris.
- Animação AUTORAL além das duas: permitida, presa ao palco `svg#sv-slide-N` (N = posição do slide no arquivo), seguindo as mesmas regras. Palco sem animação fica vazio em vez de quebrar.

## Teleprompter que não entra no vídeo

Duas peças, mais o estado no arquivo. Blocos canônicos no deck de referência.

- **Painel lateral (`#mira-prompter`, tecla T):** o editor. Quatro chaves (T painel, O overlay, G Element Capture, E mover/redimensionar), slider de tamanho do texto do overlay por slide (padrão do deck: **34px**, caixa **621x454**), o texto do slide (`#mp-body`, `contenteditable`) e o botão "Salvar no arquivo". **Some durante a gravação** (`html[data-mira-recording] #mira-prompter { display: none }`).
- **Overlay central (`#tp-ov-wrap`/`#tp-ov`, tecla O):** o retângulo que o apresentador lê (fundo preto 60%, texto branco 60%), **irmão das `<section>`, nunca filho**: é isso que o exclui do vídeo no Element Capture.
- **Rolagem automática (teleprompter de verdade):** tecla **L** liga/pausa a rolagem do overlay (P é da caneta), **+ / -** ajustam a velocidade (10 a 200 px/s, persistida). Na troca de slide o texto volta ao topo e espera ~1 s antes de rolar. O degradê `.tp-ov-more` indica texto abaixo do corte; um toast discreto (`#tp-toast`) confirma liga/pausa e velocidade.
- **Modo E no overlay:** arrastar move; alça da borda direita muda largura, da borda de baixo muda altura, grip do canto muda as duas. Tudo por slide, persistido em `mira-tp-ov-pos`.
- **Element Capture (tecla G, LIGADO por padrão):** o deck declara `window.__miraElemCapture = true`; a gravação restringe a captura à subárvore da seção visível (`RestrictionTarget.fromElement` + `track.restrictTo`), então overlay, painel do teleprompter e painel de gravação **não são pintados no vídeo**, mesmo sobrepostos.
- **Cheat-sheet (tecla ?):** grade com todos os atalhos, fora do vídeo, Esc ou clique fecha.
- **Salvar (botão ou Ctrl+S):** grava textos e layout do overlay no bloco `<script id="mira-studio-state" type="application/json">` do próprio `index-16x9.html`: em localhost por `POST /__mira_save`, em `file://` pela File System Access API. O arquivo é a fonte da verdade, não o navegador.

**Onde cada overlay mora (regra de ouro):** o que deve entrar no vídeo (logo, selo, `.me-ov` com `data-me-chrome` + `data-me-key`) fica **DENTRO** da `<section>`; o que não deve (teleprompter, painéis) fica **FORA**, como filho direto de `body`.

## Desenho por slide (caneta P)

A caneta do `mira-draw.js` desenha sobre o slide ATUAL: ao trocar de slide os traços saem junto e voltam quando o slide volta (bloco canônico usando `miraDraw.getShapes/setShapes` por índice de slide). No palco do `mira-remote` o desenho é da shell (modelo global sincronizado): o bloco detecta `window.__MIRA_REMOTE_STAGE__` e não interfere.

## O módulo mira/mira-record-16x9.js (gravação nativa 1920x1080)

Fonte canônica em `templates/authoring/mira-record-16x9.js`; copie para `mira/` do deck. O que muda em relação ao gravador 9:16:

- **Painel SOBRE o slide:** no 16:9 o quadro cobre a janela, então o painel de gravação flutua sobre o slide (arrastável). Gravando **com** Element Capture ele continua visível para você e fora do MP4; gravando **sem** (Region Capture), ele é ocultado via CSS durante a gravação e a tecla R segue funcionando.
- **Contagem regressiva 3-2-1** antes de iniciar (fora do vídeo: aparece antes do pipeline).
- **Saída H.264 `avc1` com resolução constante por sessão:** **1920x1080** em Alta (padrão de videoaula) ou a resolução **16:9 nativa da janela** em Desempenho (menos pixels a codificar, a alavanca real para máquina fraca). Bitrate 12 Mbps escalado proporcionalmente; keyframe a cada 2 s.
- **Pipeline em Worker** idêntico ao padrão comprovado do 9:16: `MediaStreamTrackProcessor` puxa `VideoFrame`s da track restringida/recortada, o `readable` é transferido ao Worker (Blob URL, sem arquivo extra), `VideoEncoder` com backpressure (`encodeQueueSize>=2` descarta não-chave), timestamps VFR, áudio AAC no mesmo Worker, mux `mp4-muxer` com `cross-track-offset`. O main thread só renderiza a página.
- **Seletores de câmera e microfone no painel**, com medidor de nível (VU) do microfone. A troca de câmera é AO VIVO (`window.__miraCameraUse` do `mira-camera.js`), persiste em `mira-cam-device` e vale para os próximos loads.
- **Encoder Auto / Hardware preferido / Software (CPU)** (`hardwareAcceleration` é preferência, não garantia) e as três informações separadas: GPUs instaladas (`/__mira/gpus`, via launcher), renderer ativo (WebGL) e a preferência do encoder. GPUs instaladas nunca viram opções do encoder.
- **Gravação direta no disco** (File System Access + `FileSystemWritableFileStreamTarget`, `fastStart: false`): escolhe o arquivo uma vez antes de começar, nada acumula em RAM, sem teto de duração. Preço honesto: o índice `moov` vai para o fim; travamento no meio deixa MP4 sem índice. Fallback in-memory (~2 GB de teto, aviso ~384 MB, para sozinha ~512 MB) quando não há File System Access.
- **Métricas reais ao vivo** (fps efetivo, % descartado, fila do encoder, Mbps, MB) e **diagnóstico JSON** por `mira-navigation` (input/crop/output, long task, gap de rAF, gap PTS) com botão de salvar ao final.
- **Fallback de compatibilidade:** sem WebCodecs/`MediaStreamTrackProcessor`/`OffscreenCanvas`, cai no `MediaRecorder` sobre canvas fixo 1920x1080.
- **Tecla R** grava/para (quieta nos modos E/P e digitação). Ao iniciar, escolha "Esta guia" no seletor do navegador.

## Launcher `mira-studio-16x9-windows.bat` / `-apple.command` + `mira/mira-studio-server.cjs`

Fontes canônicas em `templates/studio/`: os launchers vão para a RAIZ do deck e o `mira-studio-server.cjs` para `mira/`. Mesmo ciclo de vida comprovado do Mira Remote: Node em primeiro plano, Chrome aberto pelo servidor somente depois de `listen()`.

- Os launchers 16:9 exportam **`MIRA_STUDIO_PAGE=/index-16x9.html`** (página inicial servida) e **`MIRA_STUDIO_FULLSCREEN=1`** (Chrome abre em `--start-fullscreen`: F11 já na abertura, para o quadro fechar 1920x1080 exato).
- O servidor serve o deck em `http://127.0.0.1:8123` (ou próxima porta livre), expõe `/__mira/health`, `/__mira/gpus`, `GET /__mira_meta` e `POST /__mira_save` (`.html`/`.htm`/`.md`, só dentro do root, até ~25 MB; o `.md` é a escrita do `roteiro.md` pelo teleprompter). MIME inclui `.md` e `.pdf`.
- Chrome dedicado (`--user-data-dir` em `%LOCALAPPDATA%\mira-studio\`) com `--force-high-performance-gpu` (preferência, não garantia). **Nenhuma escrita em registro, nenhum `node -e`** (launcher AV-clean).
- Num deck antigo, depois de atualizar o servidor, **reinicie o launcher**: os endpoints são novos.

## Transição padrão: dissolve fora da gravação

Igual ao `/mira-studio`: bloco `=== DISSOLVE` (View Transitions same-document, 0.55s) com `view-transition-name` para CADA UI fixa (`#mrc-panel`, `.cam-notice`, `#mira-prompter`, `#tp-ov-wrap`), helper `dissolve(jump)` com fallback e `scrollIntoView({ behavior: 'instant' })`. Durante a gravação (`html[data-mira-recording]`) a navegação chama `jump()` direto, sem `startViewTransition`, emitindo antes o evento `mira-navigation` com `{from, to, at}`.

## Teclas do deck (documente na entrega)

Setas/espaço navegam · **T** painel do roteiro · **O** overlay de leitura · **L** liga/pausa a rolagem · **+/-** velocidade · **G** Element Capture · **E** mover/redimensionar overlay · **Ctrl+S** salvar no arquivo · **R** gravar · **C** espelhar câmera · **P** caneta de desenho · **?** lista de atalhos. Todas quietas nos modos E/P e durante a digitação.

## Passos

1. **Colher o roteiro.** Liste com o usuário os slides e o layout de cada um (`camera` ou `thirds`); sem layout declarado, pergunte. Para cada `thirds`, defina título curto e a animação (`linha:` com 2+ etapas ou `orbita:` com satélites e núcleo). A fala de cada slide vai para o **`roteiro.md`**, não para dentro do HTML. Diga em uma linha que dá para editar esse arquivo com o deck aberto (~1,5 s).
2. **Criar a estrutura.** `decks/<nome>/` com `index-16x9.html` (a partir do deck de referência), **`roteiro.md`** (um bloco `## Slide` por slide combinado, com a fala do usuário e a intro documentando a gramática), `mira/` (edit, edit-free, draw, camera, record-16x9 copiados de `templates/authoring/` + `mira-studio-server.cjs` de `templates/studio/`), `assets/vendor/mp4-muxer.js` e `assets/vendor/d3.v7.min.js` (de `templates/vendor/`), e os launchers `mira-studio-16x9-windows.bat` / `mira-studio-16x9-apple.command` na raiz (de `templates/studio/`).
3. **Gerar os slides.** No `roteiro.md`, cabeçalhos com layout/título/animação; no HTML, as `body > section` equivalentes como fallback de `file://` (mesma ordem, mesmos títulos). `.cam-area` em toda seção. As animações declarativas saem dos geradores canônicos; animação autoral extra se prende ao palco `sv-slide-N`.
4. **Conferir os blocos canônicos.** Bloco de formato 16:9 (com `isolation: isolate` e o letterbox), builder do roteiro ANTES das animações e dos `<script defer>`, `fitTitles`, navegação com dissolve, teleprompter completo (painel + overlay + rolagem L/+/- + sincronização + `SCRIPT[]` fallback + bloco `#mira-studio-state` + seed por hash + salvar/Ctrl+S), desenho por slide, cheat-sheet `?`, e os cinco `<script defer src="mira/...">` antes de `</body>` nesta ordem: `mira-edit.js` → `mira-edit-free.js` → `mira-draw.js` → `mira-camera.js` → `mira-record-16x9.js`.
5. **Verificar.** Servido pelo launcher: quadro 16:9 sem scroll horizontal, câmera no lugar certo por layout, permissão pedida uma vez, animações preenchendo os 2/3, títulos em máx. 2 linhas, editar o `roteiro.md` externo reflete em ~1,5 s, digitar no painel grava no `.md` sem tocar intro/cabeçalhos, Ctrl+S grava e sobrevive ao reload, gravando com Element Capture o overlay some do MP4 e navegar durante a gravação não congela o vídeo. Em `file://`: áreas verdes `#00FF00` puras.
6. **Reportar.** Caminho do deck, o `roteiro.md` como lugar da fala e das animações, layout de cada slide, o launcher (tela cheia + GPU + endpoints), a gravação nativa (tecla R, painel, gravação no disco) e a receita OBS como alternativa (Chrome em tela cheia + Captura de Janela, 1920x1080 direto, sem recorte).

## Edge cases (do mais comum ao menos)

- **Aberto em `file://`:** sem `getUserMedia` e sem sincronização do roteiro; áreas de câmera em verde chroma `#00FF00` puro com aviso fora da área; o deck sobe com os slides embutidos, navegável.
- **Permissão negada / sem webcam:** mesmo fallback verde; aviso específico.
- **Tela que não é 16:9 (ultrawide, 16:10):** letterbox `#333` acima e abaixo (ou nas laterais), quadro sempre proporcional, slide seguinte nunca vaza.
- **Webcam 16:9 num terço vertical:** `object-fit: cover` corta as sobras, nunca distorce.
- **Título longo no `thirds`:** `fitTitles` reduz até 2 linhas (mínimo 18px).
- **Roteiro com mais/menos slides que o HTML embutido:** o `roteiro.md` manda; o mapeamento por ordem de aparição nunca desloca textos.
- **Numeração duplicada ou fora de ordem nos cabeçalhos:** irrelevante, o número é rótulo.
- **Janela estreita demais:** o painel de gravação some (`mrc-tight`); teclas continuam.

## Restrições honestas (diga isto ao usuário, não prometa mais)

- Excluir o teleprompter do vídeo só funciona no **gravador nativo (tecla R)** com **Element Capture** (Chrome/Edge desktop recente, localhost/https). Sem suporte, cai no Region Capture e o overlay e os painéis **somem da tela durante a gravação** (fallback no CSS), para não vazarem no vídeo.
- **No OBS não há exclusão de overlay:** ele grava os pixels da janela. Para gravar no OBS, desligue overlay e painéis (T/O) e grave a janela inteira em 1920x1080.
- `body > section { isolation: isolate }` é pré-requisito do Element Capture; sem ele o MP4 sai vazio.
- Salvar por localhost exige o servidor com os endpoints (`/__mira_save`, `/__mira_meta`): deck antigo, reinicie o launcher.
- `hardwareAcceleration` é preferência: o painel reporta métricas reais em vez de prometer NVENC.

## Checklist

**Os que mais falham (cheque primeiro):**
- [ ] Arquivo do deck chamado `index-16x9.html`; launchers 16:9 na raiz apontando para ele (`MIRA_STUDIO_PAGE`).
- [ ] `body > section { isolation: isolate }` presente (sem ele o Element Capture grava vídeo VAZIO).
- [ ] Sem scroll horizontal em F11 (scrollbars escondidas + `overflow-x: hidden`).
- [ ] Cada slide com o layout que o usuário pediu, na ordem do roteiro; `thirds` com animação preenchendo os 2/3 e câmera no 1/3 direito; `full` só animação no quadro inteiro, sem `.cam-area`.
- [ ] Fallback: em `file://` as áreas ficam `#00FF00` PURO, sem texto por cima.

**Roteiro e teleprompter:**
- [ ] `roteiro.md` na raiz com a gramática de 4 campos (`layout | Título | animação`) documentada na intro.
- [ ] Slides nascem do `.md`; sem o arquivo, o deck sobe com os slides embutidos, sem erro no console.
- [ ] Builder do roteiro ANTES das animações e dos `<script defer>`.
- [ ] Editar o `.md` aparece em ~1,5 s; digitar no painel grava com intro e cabeçalhos intactos; poll parado durante gravação e digitação; `.md` apagado é recriado.
- [ ] Painel `#mira-prompter` e `#tp-ov-wrap` FORA das `<section>`; overlays do vídeo DENTRO.
- [ ] Rolagem automática: L liga/pausa, +/- velocidade persistida, volta ao topo na troca de slide.
- [ ] `window.__miraElemCapture` default true; chave G sincronizada no painel.
- [ ] Bloco `#mira-studio-state` presente com seed POR HASH antes de qualquer leitor de `localStorage` (texto E overlay entram no estado).
- [ ] Slider de fonte do overlay por slide; padrão do deck 34px / caixa 621x454.

**Gravação:**
- [ ] `mira/mira-record-16x9.js` (não o `mira-record.js` 9:16) e `assets/vendor/mp4-muxer.js` presentes.
- [ ] Painel flutuante arrastável; some do MP4 com Element Capture; oculto na gravação sem EC.
- [ ] Seletores de câmera/microfone com VU; troca de câmera ao vivo funcionando (`__miraCameraUse`).
- [ ] Saída 1920x1080 (Alta) ou nativa (Desempenho); gravação direta no disco ligada por padrão em localhost.
- [ ] Navegar durante a gravação não congela o vídeo (`restrictTo` reaplicado a cada `mira-navigation`/`scroll`).

**Gerais:**
- [ ] Transição dissolve com `view-transition-name` em TODA UI fixa; navegação instantânea durante a gravação, com evento `mira-navigation` antes do salto.
- [ ] `mira/` com os 5 módulos na ordem certa antes de `</body>` + `mira-studio-server.cjs`.
- [ ] Animações com entrada coreografada + loop perpétuo, generation counter e pausa fora da tela (IntersectionObserver).
- [ ] Nenhum texto abaixo de 13px (SVG: `font-size >= 24` para `W = 960`); título máx. 2 linhas; cor `#FF904D`; sem travessão em texto visível.
- [ ] Modos E (edição) e P (pintura) funcionando; desenho por slide.
- [ ] Receita OBS reportada ao final.
