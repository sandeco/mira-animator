---
name: mira-studio
description: >-
  Gera um deck VERTICAL 9:16 (1080x1920) pronto para gravar no OBS Studio, onde
  cada slide declara um de três layouts: camera (webcam ao vivo em tela cheia),
  split (animação quadrada estilo mira-squared em cima + câmera embaixo) e full
  (animação vertical estilo mira-vertical). A câmera do apresentador é embutida
  ao vivo no slide via getUserMedia (módulo mira/mira-camera.js), sem chroma
  key: no OBS basta capturar a janela. Sem câmera, a área vira verde chroma
  #00FF00 como plano B. Use SEMPRE que o usuário disser /mira-studio,
  deck para OBS, deck com câmera, slide com câmera, meio a meio, câmera
  embutida, deck para gravar vídeo comigo falando, ou pedir slides que misturam
  câmera e animação num vídeo vertical.
---

# Skill: Mira Studio (9:16 com câmera embutida, pronto para OBS)

Cria decks verticais 9:16 para gravação de vídeo (Reels, Shorts, TikTok, videoaula) em que o apresentador aparece AO VIVO dentro do próprio slide. Cada slide declara um layout, e o usuário escolhe **slide a slide, na conversa**:

- **`camera`** — a webcam preenche a coluna inteira (você falando).
- **`split`** — quadrado 1:1 no topo com título + animação (padrão `mira-squared`) e a câmera preenchendo o resto embaixo (você + a metáfora).
- **`full`** — animação vertical em tela cheia (padrão `mira-vertical`, sem câmera).

> **Fonte da verdade:** o padrão desta skill está congelado no deck de referência (validado em 2026-07-11). Resolva o arquivo nesta ordem:
> 1. `mira-templates/decks/mira-studio-demo/index.html` (projeto com Mira instalado)
> 2. `templates/decks/mira-studio-demo/index.html` (repositório fonte do Mira)
> 3. `node_modules/mira-animator/templates/decks/mira-studio-demo/index.html`
>
> Se nenhum existir, peça para rodar `npx mira-animator update`. Em dúvida sobre um valor exato, o resultado deve bater com o deck de referência.

## O resultado, em uma frase

Uma coluna 9:16 central (laterais `#333333`) onde cada slide de CONTEÚDO (`body > section`) declara `data-layout="camera|split|full"` (capa e encerramento, sem `data-layout`, mantêm layout próprio): nas áreas `.cam-area` o módulo `mira/mira-camera.js` injeta o feed da webcam ao vivo (`object-fit: cover`, espelhado estilo selfie), nas áreas de animação valem as regras congeladas das skills irmãs, e o deck inteiro está pronto para o OBS capturar a janela sem chroma key.

## Fluxo conversacional (como o usuário monta o deck)

O usuário descreve o roteiro e diz o layout de cada slide, por exemplo: "slide 1 só câmera, slide 2 meio a meio sobre X, slide 3 só animação sobre Y". Para cada slide:

1. `camera` → gere só `<section data-layout="camera"><div class="cam-area"></div></section>`. Nada de texto por cima (a fala é do apresentador).
2. `split` → título curto (máx. 6 palavras) + metáfora animada PENSADA PARA O QUADRADO (radial/orbital/hub rende mais) + `.cam-area` embaixo.
3. `full` → título curto + metáfora animada PENSADA PARA O RETRATO (eixo dominante vertical: fluxo desce, comparação empilha).

Se o usuário não declarar o layout de um slide, pergunte. A capa é opcional (deck de gravação pode começar direto no primeiro slide do roteiro); quando houver capa, ela segue a diretiva do título com `text-wrap: balance`.

## Dimensão

O quadro é **9:16 cravado e generalista para a tela**: `--fmt-w: calc(100vh * 9 / 16)`, `--fmt-h: 100vh` (numa tela 1080p, ~607x1080; o OBS recorta a coluna e grava em 1080x1920). Não fixe pixels. Diferente do `mira-vertical` clássico (`100vw/3`), aqui a proporção exata importa porque a saída é vídeo 9:16.

## As regras herdadas (não reinvente)

- **Área de animação do `split`:** é um quadrado (`aspect-ratio: 1/1`, lado = largura da coluna) com área segura proporcional de `4.63%` (50/1080), título dentro no topo e animação preenchendo o resto com `casarPalco` + `fitToArea` (código canônico em `agents/mira-squared/SKILL.md`). Vale o CRITÉRIO Nº 1: a animação preenche a maior parte do quadrado.
- **Slide `full`:** título no topo (máx. 2 linhas, IIFE `fitTitles`), palco ocupando todo o resto, metáfora com eixo vertical, `casarPalco` + `fitToArea` (playbook de composição em `agents/mira-vertical/SKILL.md`).
- **Regra Zero:** toda animação tem loop interno infinito com generation counter (`window.__slugGen`).
- **Idioma:** `agents/_shared/idioma.md`. Proibido travessão; acentuação correta.
- **Fonte mínima:** nenhum texto renderiza abaixo de 13px (SVG: `font-size >= 24` para `W = 960`).
- **Cor:** laranja da marca `#FF904D`; sem arco-íris.
- **Todo deck:** os 5 módulos em `mira/` referenciados antes de `</body>`, nesta ordem: `mira-edit.js`, `mira-edit-free.js`, `mira-draw.js`, `mira-camera.js`, `mira-record.js`. Libs vendoradas em `assets/vendor/`.

## O módulo mira/mira-camera.js (contrato)

Fonte canônica em `templates/authoring/mira-camera.js`; copie para `mira/` do deck. O que ele garante:

- **Stream único por sessão:** um só `getUserMedia({video, audio: false})` memoizado; todas as `.cam-area` compartilham o mesmo `MediaStream` (uma permissão, sem flicker). Cada `.cam-area` é um SINK `<video>` separado desse stream único — o stream nunca é duplicado, mas os elementos de vídeo sim.
- **Escalabilidade (muitos slides de câmera):** com mais de 2 `.cam-area`, o módulo anexa o stream só nas câmeras do slide visível (e vizinhos, via `IntersectionObserver`) e solta ao sair, mantendo ~O(1) sinks ativos mesmo em decks de 10/30 slides de câmera (evita 30 texturas de vídeo ociosas). O stream/permissão continua único; só o `srcObject` dos `<video>` é ligado/desligado. Deck com ≤2 câmeras anexa tudo (custo desprezível). A gravação é indiferente ao total de slides: captura só a coluna do slide visível e encoda no Worker.
- **Vídeo sempre mudo:** o áudio da gravação é do OBS/microfone.
- **Fallback verde chroma:** sem câmera (contexto `file://`, permissão negada, sem dispositivo), cada `.cam-area` ganha `.cam-fallback` (fundo `#00FF00` PURO, nada por cima) e um aviso discreto aparece FORA da área, sumindo em 5s. Plano B: filtro Chroma Key do OBS.
- **Tecla C:** alterna espelhamento (`body.cam-mirror`, padrão LIGADO, estilo selfie). Fica quieto durante os modos E/P e digitação.
- **Encerramento:** tracks paradas no `pagehide`.

A skill NÃO reimplementa nada disso: só marca as áreas com `.cam-area` e inclui o script.

## O módulo mira/mira-record.js (gravação nativa, sem OBS)

Fonte canônica em `templates/authoring/mira-record.js`; copie para `mira/` do deck. Painel de gravação no lado DIREITO da tela (fora da coluna, portanto fora do vídeo):

- **Grava SOMENTE a área dos slides:** captura a própria aba (`getDisplayMedia` com `preferCurrentTab`) e tenta recortar a track para a coluna 9:16 via **Region Capture** (`CropTarget.fromElement` + `track.cropTo`). O Worker nunca confia só na Promise: valida `displayWidth/displayHeight` de cada frame. Entrada 9:16 segue direta; full-tab é recortada pelas coordenadas normalizadas no `OffscreenCanvas`; se a proporção do frame já não corresponder ao viewport congelado, a fração incompatível é descartada e entra um crop central 9:16 seguro. Nunca estique o frame. Saída H.264 `avc1` com resolução constante por sessão: **1080x1920** em Alta ou a resolução 9:16 nativa em Desempenho.
- **Pipeline em Worker (desempenho — a razão de não travar):** todo o caminho captura→escala→encode→mux roda **fora do main thread**, num Worker dedicado. `MediaStreamTrackProcessor` puxa `VideoFrame`s direto da track recortada (sem `<video>`, sem `requestVideoFrameCallback`, sem canvas no main thread) e o `readable` é transferido ao Worker; lá dentro o `VideoEncoder` (fixo em 1080x1920, escala interna; fallback `OffscreenCanvas` no próprio Worker) codifica com backpressure (`encodeQueueSize>=2` descarta), timestamps VFR preservados, keyframe a cada 2 s, e o mp4-muxer faz o mux (`cross-track-offset` para o A/V). O Worker é criado por **Blob URL de dentro do próprio módulo** — não há arquivo `.js` novo para copiar no deck. O main thread só renderiza a página (câmera ao vivo + animações) e recebe o MP4 pronto no fim. **É isso que mantém câmera e slides fluidos durante a gravação, com CPU ou GPU** — o encoder de hardware só acelera a compressão, não a preparação do frame.
- **Três informações separadas, sem promessa de NVENC:** (1) `GPUs instaladas`, inventário Win32 vindo de `/__mira/gpus`; (2) `Renderer ativo`, detectado pelo WebGL e escolhido pelo Chrome/Windows; (3) `encoder` **Auto / Hardware preferido / Software (CPU)**, que mapeia para `hardwareAcceleration` (`no-preference`/`prefer-hardware`/`prefer-software`). GPUs instaladas NUNCA viram opções do encoder: uma página não escolhe a placa física nem confirma NVENC. O teste real de encode confirma apenas que a preferência foi aceita. Em `file://`, o painel explica que o inventário requer o launcher/localhost. Se o renderer continuar na integrada, oriente Configurações do Windows > Sistema > Tela > Gráficos para o `chrome.exe`; não automatize configuração do sistema. O mux MP4 usa `assets/vendor/mp4-muxer.js`; áudio do microfone usa AAC quando suportado.
- **Fallback de compatibilidade:** navegador sem WebCodecs/`MediaStreamTrackProcessor`/`OffscreenCanvas` cai no caminho antigo — `MediaRecorder` sobre um canvas fixo 1080x1920 alimentado por `requestVideoFrameCallback` (MP4/`avc1` 12 Mbps, ou WebM com aviso). Só roda quando não há o pipeline em Worker.
- **Métricas reais ao vivo:** durante a gravação o painel mostra `fps efetivo · % descartado · fila do encoder · Mbps real · MB` (reportado pelo Worker). É o diagnóstico honesto — se o % descartado sobe ou o fps cai de 20, é o sinal para trocar para o modo Desempenho ou checar `chrome://gpu`. Abaixo de ~20 fps por 3s o painel também avisa uma vez (trecho de tela estática não conta como lentidão). Em notebook, grave na tomada.
- **Diagnóstico de recorte e navegação:** o painel registra `input`, `crop`, `output`, caminho `direct/canvas`, maior long task, gap de rAF e gap PTS na janela de cada `mira-navigation`. Ao finalizar, o botão **salvar diagnóstico JSON** permite anexar as métricas à evidência. Os limites Windows são long task ≤50 ms e gap PTS ≤100 ms na troca.
- **Qualidade × Desempenho:** seletor no painel. **Alta** = 1080×1920 (padrão de reels). **Desempenho** = grava na resolução NATIVA da coluna (~608×1080 num display comum), ~3× menos pixels a codificar — a alavanca real para máquina fraca, independente de CPU/GPU. Resolução constante mantém o MP4 `avc1` válido; o bitrate é escalado proporcionalmente.
- **Gravação longa — direto no disco, sem teto (padrão):** a chave **`salvar direto no disco`** (ligada por padrão) faz o Worker escrever o MP4 **no arquivo enquanto grava** (File System Access + `FileSystemWritableFileStreamTarget` do mp4-muxer, com `fastStart: false`). Nada acumula em RAM: a gravação dura o que o disco aguentar, e o `finalize()` deixa de copiar centenas de MB. O usuário escolhe o arquivo **uma vez, antes de começar** (o `showSaveFilePicker` exige ativação do usuário, por isso vem antes do seletor de captura); ao parar, o arquivo já está lá — não há download. **Preço honesto:** sem o buffer inteiro em mãos, o índice do MP4 (`moov`) vai para o **fim** do arquivo. Parar normalmente escreve o índice e o vídeo abre em qualquer player; um travamento do navegador no meio deixa um MP4 com os dados e **sem índice** (ilegível sem reparo). Se o seletor for cancelado, a gravação nem começa (e o arquivo de 0 byte é removido).
- **Gravação em memória (fallback):** sem File System Access (`file://`, outros navegadores) a chave fica desligada e cinza, e o mux volta a ser in-memory — com o teto real do `ArrayBuffer` (~2 GB): avisa por volta de ~384 MB e PARA sozinha perto de ~512 MB, que a 12 Mbps são uns **6 minutos**. Nesse modo, para clipes longos, grave em partes.
- **Microfone opcional:** toggle no painel, mixado na gravação (a câmera já está composta no slide).
- **Controles:** botão Gravar/Parar no painel ou tecla **R** (quieta nos modos E/P e digitação). Ao iniciar, o usuário escolhe "Esta guia" no seletor do navegador. O arquivo baixa sozinho ao parar (`mira-reels-<timestamp>.mp4`, ou `-PARCIAL` quando houve perda no caminho de encode/leitura/flush).
- **Recorte da coluna:** tenta **Element Capture** (`restrictTo` na seção visível) quando o deck declara `window.__miraElemCapture`; a track já sai 9:16 e o teleprompter fica fora do vídeo. O `restrictTo` é **reaplicado a cada troca de slide** (evento `mira-navigation` e `scroll`), senão o vídeo congela no slide anterior. Sem a flag ou sem suporte, cai no **Region Capture** de sempre.
- O painel some em telas estreitas (a coluna ocupa tudo) e nunca aparece na gravação.

O OBS continua como alternativa (captura de janela + recorte); a gravação nativa é o caminho sem instalação.

## Teleprompter que não entra no vídeo (padrão de todo deck mira-studio)

Todo deck nasce com o teleprompter em **duas peças**, mais o editor de overlays e a persistência no arquivo. Os blocos canônicos estão no deck de referência; copie-os como estão.

- **Painel lateral (`#mira-prompter`, tecla T):** fica na margem cinza, FORA da coluna. É o **editor**: as quatro chaves, o texto do slide (`#mp-body`, `contenteditable`) e o botão "Salvar no arquivo". **Some durante a gravação** (`html[data-mira-recording] #mira-prompter { display: none }`) — quem se lê no ar é o overlay.
- **Overlay central (`#tp-ov`, tecla O):** o retângulo que o apresentador lê, por cima da coluna (fundo preto 60%, texto branco 60%). É **irmão das `<section>`, nunca filho** — é exatamente isso que permite excluí-lo do vídeo.
- **Texto por slide:** vem do **`roteiro.md` na raiz do deck** (seção abaixo), não do HTML. Editar no painel reflete no overlay na hora, grava no `.md` e persiste em `localStorage['mira-tp-text']` (cópia de trabalho). O texto troca ao navegar (`scroll` + `mira-navigation`).
- **Element Capture (tecla G):** a gravação nativa restringe a captura à **subárvore da seção visível** (`RestrictionTarget.fromElement` + `track.restrictTo`), então tudo que não é descendente dela — o overlay e o painel — **não é pintado no vídeo**, mesmo sobreposto. O deck liga o recurso declarando `window.__miraElemCapture = true`; sem essa flag o `mira-record.js` usa o Region Capture de sempre.
- **Editor genérico de overlays (`.me-ov`, tecla E):** qualquer camada sobre a câmera marcada com `class="me-ov" data-me-chrome data-me-key="<id>"` (mais um filho `<div class="me-ov-grip" data-me-chrome></div>`) vira movível e redimensionável no modo E. O `data-me-chrome` é obrigatório: sem ele o `mira-edit-free` disputa o mesmo clique e seleciona o `<img>` interno em vez do grupo.
- **Salvar no arquivo (botão ou Ctrl+S):** grava o estado editável de LAYOUT (posições e tamanhos dos overlays, **sem o texto do roteiro**) no bloco `<script id="mira-studio-state" type="application/json">` do próprio `index.html` — em localhost por `POST /__mira_save`, em `file://` pela File System Access API. No load, um IIFE **semeia o `localStorage` a partir desse bloco**: o **arquivo é a fonte da verdade**, não o navegador. No template o bloco começa `{}`.

**Onde cada overlay mora (a regra de ouro):** o que deve entrar no vídeo (logo, selo, animação sobre a câmera) fica **DENTRO** da `<section>`; o que não deve (teleprompter, painéis) fica **FORA** dela, como filho direto de `body`.

### Restrições honestas (diga isto ao usuário, não prometa mais)

- Excluir o teleprompter do vídeo só funciona no **gravador nativo (tecla R)**. **No OBS não**: ele grava os pixels da janela, e nada exclui um overlay. Para gravar no OBS, use só o painel lateral (que já fica fora da coluna recortada).
- Element Capture exige **Chrome/Edge desktop recente** e **contexto seguro** (localhost ou https). Sem suporte, o deck cai no Region Capture e o **overlay some durante a gravação** (fallback no CSS, via `html[data-mira-recording]:not([data-mira-elemcapture])`), para não vazar.
- `body > section { isolation: isolate }` é **pré-requisito**: sem stacking context o Chrome aceita o `restrictTo` e não emite frame — o MP4 sai vazio.
- Salvar por localhost exige o **servidor com os endpoints** (`/__mira_save`, `/__mira_meta`): num deck antigo, **reinicie o launcher** depois de atualizar o `mira-studio-server.cjs`.

## Roteiro externo `roteiro.md` (todo deck de gravação nasce com um)

O roteiro NÃO mora mais dentro do HTML. Todo deck gerado leva um **`roteiro.md` na raiz**, ao lado do `index.html`: é dele que saem os slides (layout e título) e a fala de cada slide. O apresentador escreve o roteiro no editor de texto que quiser, versiona em git, e vê o resultado no deck aberto sem recarregar.

**Gramática (uma linha por cabeçalho):**

```
<intro: texto livre, documenta a gramática para o usuário>

## Slide 1 | capa | Um roteiro, *três formatos*

Fala do apresentador neste slide.

## Slide 2 | camera

Fala do apresentador neste slide.
```

- `layout` (obrigatório): `capa`, `camera`, `split` ou `full`, comparado em minúsculas. Valor desconhecido cai em `camera`, o layout mais simples.
- `Título`: vale em `capa`, `split` e `full`; ignorado em `camera`. `*entre asteriscos*` vira `<span class="accent">`, montado por fragmento (**nunca `innerHTML`**).
- **Sem campo de animação.** As animações do mira-studio são AUTORAIS (metáfora escrita à mão por slide, não montada a partir de uma lista de itens). O builder cria só o palco vazio `svg#sv-slide-N`, com **N = posição do slide no arquivo**, e cada animação escrita à mão se prende ao seu palco. Palco sem animação fica vazio em vez de quebrar; avise o usuário quando o roteiro tiver mais slides do que animações autoradas.
- O número do cabeçalho é **rótulo, não índice**: o mapeamento é sempre pela **ordem de aparição**. Numeração duplicada ou fora de ordem não desloca texto nenhum.

**O que sincroniza e o que não:**

| Dado | Fonte da verdade | Quando vale |
|------|------------------|-------------|
| Layout, título | `roteiro.md` | lido uma vez, no **load** (mudou, recarregue) |
| Texto da fala | `roteiro.md` | **ao vivo**, nos dois sentidos |
| Posição/tamanho dos overlays | bloco `#mira-studio-state` no `index.html` | Ctrl+S |
| Cópia de trabalho do texto | `localStorage` | entre polls |

Precedência no load: `roteiro.md` > `localStorage` > array `SCRIPT[]` embutido. O texto **não** entra no `#mira-studio-state`: duas fontes da verdade fariam o seed do load restaurar texto velho por cima do arquivo.

**Como o deck consome (blocos canônicos no deck de referência):**

- Um IIFE **antes** das animações e dos `<script defer>` faz a leitura **síncrona** do `.md` (os módulos de câmera, gravação e edição precisam das `<section>` já no DOM), guarda texto bruto, intro e cabeçalhos, monta as seções e as insere antes do painel do teleprompter, removendo as estáticas.
- As `<section>` estáticas do HTML continuam lá como **fallback**: em `file://`, sem servidor ou com parse vazio, elas SÃO o deck. A ausência do roteiro nunca produz deck em branco.
- Sincronização: poll de leitura a cada **1,5 s**, escrita com debounce de **800 ms**, com quatro guards que não são opcionais: (1) escrita em voo ou agendada trava o poll, senão ele desfaz o que você acabou de digitar; (2) gravação em andamento trava o poll, para não piscar texto dentro do vídeo; (3) campo com foco recebe estado e overlay mas não é sobrescrito, senão o cursor salta; (4) conteúdo idêntico aborta poll e escrita.
- A escrita de volta remonta o arquivo com a **intro e os cabeçalhos capturados no load** mais os textos atuais. Cabeçalho nunca é reescrito a partir do estado do deck.
- Arquivo ausente (404) é **recriado uma vez** a partir dos slides e textos embutidos.

**Restrição honesta:** a escrita depende do `POST /__mira_save`. Ele existe no `mira/mira-studio-server.cjs` (launcher, que também cria o arquivo quando falta) e no `lib/mira-serve.js` (grava, mas só em arquivo que já existe). Em `file://` não há leitura nem escrita: o deck usa os slides embutidos, sem erro no console e sem sincronizar.

**Chrome autoral dentro da `<section>`** (logo, selo, `.me-ov` que deve entrar no vídeo) precisa ser emitido pelo builder, senão a reconstrução do load o descarta.

## Launcher `mira-studio-windows.bat` + `mira/mira-studio-server.cjs` (GPU dedicada, opcional)

Fontes canônicas em `templates/studio/`: o `.bat` vai para a RAIZ do deck (diretiva: raiz = `index.html` + launchers) e o `mira-studio-server.cjs` para a pasta `mira/`. O ciclo de vida segue o padrão comprovado do Mira Remote/mesa tática: Node em primeiro plano, navegador aberto pelo servidor somente depois de `listen()` confirmar readiness.

1. Sobe `mira/mira-studio-server.cjs` (Node puro): serve o deck em `http://127.0.0.1:8123` (ou próxima porta livre), expõe `/__mira/health` e `/__mira/gpus`. A consulta Win32 é uma Promise cacheada com estado `loading/ready/error`; o painel usa retry limitado. Falha de GPU não torna o HTTP do deck indisponível. O servidor também expõe **`GET /__mira_meta`** (caminho absoluto do alvo, usado pelo rótulo do mira-edit) e **`POST /__mira_save`** (grava o HTML no disco: é o "Salvar no arquivo" do deck e o Salvar da barra do mira-edit). O `/__mira_save` só aceita `.html`/`.htm`, só dentro do root servido (trava de path traversal) e até ~25 MB. O MIME inclui `.pdf` (slide `full` com PDF em `<iframe>` fica em branco sem ele).
2. Só depois do `listen()` bem-sucedido, o próprio servidor abre um Chrome dedicado (`--user-data-dir` em `%LOCALAPPDATA%\mira-studio\`) com `--force-high-performance-gpu`. A flag é uma **preferência**, não garantia: Windows/driver escolhem o adaptador final e o painel separa GPUs instaladas, renderer ativo e encoder hardware preferido. **Nenhuma escrita em registro ou configuração do Windows.**
3. O Node permanece em primeiro plano até `Ctrl+C`. Não use `start /wait chrome.exe` nem mate o servidor quando o comando Chrome retornar: se o mesmo perfil já estiver aberto, o Chrome encaminha a URL ao processo existente e retorna imediatamente.
4. stdout/stderr ficam visíveis e os eventos do servidor também são anexados a `mira/mira-studio.log`. Node ausente, portas esgotadas ou servidor ausente deixam mensagem acionável; não abra uma aba destinada a loading.

Sem GPU dedicada o launcher é inócuo (a flag aponta para a única GPU); o deck continua funcionando por `index.html`/serve normal.

## Bloco `<style id="mira-formato-multi">` canônico (gerar exatamente isto)

```html
<style id="mira-formato-multi">
  /* Coluna 9:16 cravada, generalista para a tela (saída OBS 1080x1920). */
  :root { --fmt-w: calc(100vh * 9 / 16); --fmt-h: 100vh; }
  html { background: #333333; }
  body { background: #333333; display: flex; flex-direction: column; align-items: center; }
  body > section {
    position: relative;
    width: var(--fmt-w); height: var(--fmt-h); min-height: var(--fmt-h);
    overflow: hidden; background: var(--mira-bg, #0d0d0f);
    display: flex; flex-direction: column;
    /* stacking context: EXIGIDO pelo Element Capture. Sem isto o Chrome aceita
       o restrictTo e NÃO emite frame nenhum (o MP4 sai vazio). Não remova. */
    isolation: isolate;
  }
  /* camera: webcam na coluna inteira */
  section[data-layout="camera"] .cam-area { flex: 1 1 auto; min-height: 0; }
  /* split: quadrado 1:1 no topo (área segura proporcional 50/1080) + câmera no resto */
  section[data-layout="split"] .split-top {
    width: 100%; aspect-ratio: 1 / 1; flex: 0 0 auto;
    display: flex; flex-direction: column; padding: 4.63%;
  }
  section[data-layout="split"] .split-top h2 { flex: 0 0 auto; }
  section[data-layout="split"] .cam-area { flex: 1 1 auto; min-height: 0; }
  /* full: animação vertical na coluna inteira */
  section[data-layout="full"] .full-wrap {
    flex: 1 1 auto; min-height: 0;
    display: flex; flex-direction: column; padding: 4.63% 4.63% 3%;
  }
  section[data-layout="full"] h2 { flex: 0 0 auto; }
  /* palco: preenche todo o resto (viewBox casado em runtime pelo casarPalco) */
  .anim-stage { flex: 1 1 auto; min-height: 0; width: 100%; }
  .anim-stage svg { width: 100%; height: 100%; display: block; }
</style>
```

Injete também o IIFE `fitTitles` (auto-ajuste de título para máx. 2 linhas) e a navegação por teclado quieta durante E/P (ambos no deck de referência).

## Transição padrão: dissolve fora da gravação

Todo deck mira-studio nasce com a transição **dissolve** (View Transitions same-document, o mesmo padrão do `mira-transition-dissolve`) aplicada DIRETO no `index.html`, sem arquivo `-dissolve` separado:

- Bloco CSS marcado `=== DISSOLVE`: `::view-transition-old(root), ::view-transition-new(root) { animation-duration: 0.55s; }` e um `view-transition-name` único para CADA elemento de UI fixa (`#mrc-panel`, `.cam-notice` e qualquer outro `position: fixed`), senão a UI pisca no crossfade.
- Na navegação, helper `dissolve(jump)` com fallback (`if (document.startViewTransition) ... else jump()`) e `scrollIntoView({ behavior: 'instant' })`, nunca `'smooth'` ou `'auto'` dentro da transição.
- **Durante a gravação nativa**, `mira-record.js` marca `<html data-mira-recording="true">`; nesse estado a navegação chama `jump()` diretamente, sem `startViewTransition`. Antes do salto, emita `window.dispatchEvent(new CustomEvent('mira-navigation', {detail:{from,to,at:performance.now()}}))` para abrir a janela de métricas. Os snapshots old/new disputam a captura da própria guia e podem criar hitch/gap no MP4. Ao terminar, o atributo é removido e o dissolve volta automaticamente.

Os dois blocos estão no deck de referência; detalhes e regras completas em `agents/mira-transition-dissolve/SKILL.md`.

## Teclas do deck (documente na entrega)

**T** painel lateral · **O** overlay central · **G** Element Capture · **E** editar (mover/redimensionar overlays) · **Ctrl+S** salvar no arquivo · **R** gravar · **C** espelhar câmera · **P** pintar · setas navegam. T/O/G ficam quietas nos modos E/P e durante a digitação.

## Passos

1. **Colher o roteiro.** Liste com o usuário os slides e o layout de cada um. Sem layout declarado, pergunte. O que ele vai FALAR em cada slide vai para o **`roteiro.md`**, não para dentro do HTML. Diga a ele, em uma linha, que dá para editar esse arquivo com o deck aberto: o texto aparece no teleprompter em cerca de 1,5 s.
2. **Criar a estrutura.** `decks/<nome>/` com `index.html`, **`roteiro.md`** (um bloco `## Slide` por slide combinado, já com a fala do usuário no corpo, e a intro documentando a gramática e os layouts DESTE deck), `mira/` (edit, edit-free, draw, camera, record copiados de `templates/authoring/` + `mira-studio-server.cjs` de `templates/studio/`), `assets/vendor/mp4-muxer.js` (de `templates/vendor/`, obrigatório para os encoders do painel), `assets/vendor/d3.v7.min.js` quando houver animação, e `mira-studio-windows.bat` na raiz (de `templates/studio/`, launcher com preferência de alto desempenho).
3. **Gerar os slides.** Um bloco `## Slide` no `roteiro.md` por slide e, no HTML, o `body > section` equivalente (fallback de `file://`) com `data-layout` correto; `.cam-area` nas áreas de câmera; animações nativas da geometria (quadrado no `split`, retrato no `full`) com `casarPalco` + enquadramento **uma vez** sobre a parte estática (reenquadrar a cada frame faz o palco reescalar junto com o que se move) e loop interno. Todo callback de `d3.timer` vai dentro de `try/catch`: uma exceção num deles congela a FILA inteira de timers do d3.
4. **Injetar os blocos canônicos.** `<style id="mira-formato-multi">` (com o `isolation: isolate`), o **builder do `roteiro.md`** (antes das animações e dos `<script defer>`), `fitTitles`, navegação com dissolve (transição padrão), o **teleprompter completo** (painel + overlay + sincronização com o `.md` + `SCRIPT[]` só como fallback + chaves + editor `.me-ov` + bloco `#mira-studio-state` vazio + seed + salvar/Ctrl+S) e os cinco `<script defer src="mira/...">` antes de `</body>` (`mira-edit.js` → `mira-edit-free.js` → `mira-draw.js` → `mira-camera.js` → `mira-record.js`).
5. **Verificar.** Servido em localhost: câmera nas áreas certas, permissão pedida uma vez, animações preenchendo, títulos em máx. 2 linhas. Painel lateral com as chaves T/O/G/E sincronizadas; editar o texto reflete no overlay; editar o `roteiro.md` no editor externo aparece no deck em ~1,5 s e digitar no painel grava no `.md` sem tocar na intro nem nos cabeçalhos; **Ctrl+S** grava posições e tamanhos, que sobrevivem ao reload. Gravando com `Element Capture: ON`, o overlay continua visível para você e **some do MP4** — e navegar entre slides durante a gravação não pode congelar o vídeo. Em `file://`: áreas verdes `#00FF00` puras.
6. **Reportar.** Caminho do deck, o `roteiro.md` como lugar de escrever a fala (editável com o deck aberto), layout de cada slide (uma linha por slide), a gravação nativa (tecla R; encoder Auto/Hardware preferido/Software no painel; launcher Windows para inventário e preferência de alto desempenho) e a receita OBS como alternativa: servir com `node lib/mira-serve.js decks/<nome>` (ou `npx mira-animator serve`), Chrome em tela cheia, Captura de Janela no OBS, recorte na coluna, gravação 1080x1920.

## Edge cases (do mais comum ao menos)

- **Aberto em `file://`:** `getUserMedia` não existe; todas as áreas de câmera ficam verde chroma e o aviso ensina a servir em localhost. O deck continua navegável e gravável (keying manual).
- **Permissão negada / sem webcam:** mesmo fallback verde; aviso específico.
- **Webcam 16:9 numa área 9:16 ou quadrada:** `object-fit: cover` corta as sobras, nunca distorce.
- **Título longo no `split`/`full`:** `fitTitles` reduz até 2 linhas; o `casarPalco` re-casa o palco à altura restante.
- **Vários slides com câmera:** todos compartilham o MESMO stream; trocar de slide não repete o prompt.
- **Tecla C durante edição (modo E) ou digitação:** o módulo ignora, sem conflito.
- **Deck sem nenhuma `.cam-area`:** o módulo fica inerte (não pede permissão à toa).

## Checklist

**Os que mais falham (cheque primeiro):**
- [ ] Cada slide com o `data-layout` que o usuário pediu, na ordem do roteiro.
- [ ] `split`: quadrado 1:1 exato no topo, animação PREENCHENDO o quadrado (Critério nº 1), câmera no resto.
- [ ] `full`: animação vertical preenchendo o palco, sem faixa fina.
- [ ] Câmera: stream único, mudo, espelhado por padrão, tecla C alternando.
- [ ] Fallback: em `file://` as áreas ficam `#00FF00` PURO, sem texto por cima.

**Teleprompter (o que mais quebra aqui):**
- [ ] `body > section { isolation: isolate }` presente (sem ele o Element Capture grava vídeo VAZIO).
- [ ] Painel `#mira-prompter` e overlay `#tp-ov-wrap` **fora** das `<section>`; overlays que devem entrar no vídeo, **dentro**.
- [ ] `roteiro.md` na raiz, com intro documentando a gramática e um `## Slide` por `<section>`; os layouts citados na intro batem com os que o deck aceita.
- [ ] Slides nascem do `.md`; sem o arquivo (ou em `file://`), o deck sobe com os slides padrão embutidos, sem erro no console.
- [ ] Numeração duplicada ou fora de ordem nos cabeçalhos não desloca os textos (mapeamento por ordem de aparição).
- [ ] Editar o `.md` aparece no deck em ~1,5 s; digitar no painel grava no `.md` com intro e cabeçalhos intactos; digitação contínua não tem o cursor roubado pelo poll.
- [ ] Durante a gravação o poll fica parado; `.md` apagado com o deck aberto é recriado.
- [ ] Builder do roteiro ANTES das animações e dos `<script defer>`; animação autoral presa ao palco `sv-slide-N`.
- [ ] `SCRIPT[]` continua no HTML só como fallback, e `mira-tp-text` NÃO entra no `#mira-studio-state`.
- [ ] `window.__miraElemCapture = true` declarado (é o opt-in que liga o Element Capture no mira-record).
- [ ] Bloco `#mira-studio-state` começa `{}`, com o IIFE de **seed antes** de qualquer leitor de `localStorage`.
- [ ] `.me-ov` com `data-me-chrome` (senão o mira-edit-free briga pelo clique) e `.me-ov-grip`.
- [ ] Restrições honestas ditas ao usuário: só no gravador nativo (R), não no OBS; Chrome desktop recente; localhost/https.

- [ ] Transição dissolve aplicada no `index.html` (bloco `=== DISSOLVE` + `dissolve()` na navegação; UI fixa com `view-transition-name`, inclusive `#mira-prompter` e `#tp-ov-wrap`).
- [ ] Durante recording, navegação instantânea sem `startViewTransition` e evento `mira-navigation` emitido antes do salto.
- [ ] Coluna `calc(100vh * 9/16)` x `100vh`, laterais `#333333`, centralizada via flex.
- [ ] `mira/` com os 5 módulos e tags na ordem certa antes de `</body>`.
- [ ] `assets/vendor/mp4-muxer.js` presente (encoders do painel), `mira-studio-windows.bat` na raiz e `mira/mira-studio-server.cjs` (launcher + inventário real de GPUs).
- [ ] Painel separa inventário de GPUs, renderer ativo e preferência do encoder; diagnóstico JSON disponível ao final.
- [ ] Loop interno em toda animação; generation counter presente.
- [ ] Nenhum texto abaixo de 13px renderizados; título máx. 2 linhas.
- [ ] Capa (se houver) com `text-wrap: balance`; sem travessão em texto visível.
- [ ] Receita OBS reportada ao final.
