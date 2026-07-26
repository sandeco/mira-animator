---
name: mira-squared
description: >-
  Gera uma versão QUADRADA (1:1) de um deck do Mira a partir do 16:9 original, OU
  cria slides quadrados do zero quando não há deck de origem, para vídeo quadrado
  (feed do Instagram, LinkedIn, etc.). Não toca no original: cria index-1x1.html
  ao lado. Cada slide de conteúdo vira só o título no topo + a animação num canvas
  quadrado (lado = altura do 16:9, 100vh; laterais em #333), com o eixo reformulado
  por metáfora para preencher o quadrado. Texto, cores, timings e loop intactos.
  Use SEMPRE que o usuário disser /mira-squared,
  versão quadrada, deixa quadrado, formato 1:1, 1080x1080, apresentação quadrada,
  vídeo quadrado, cria um slide quadrado, novo slide 1:1, ou pedir o deck ou um
  slide novo num formato quadrado.
---

# Skill: Versão Quadrada do Deck (1:1) com canvas quadrado, só título + animação

Transforma um deck 16:9 do Mira numa versão **quadrada**, para gravar como vídeo quadrado (feed do Instagram, LinkedIn). Cada slide de conteúdo vira **só o título no topo + a animação grande num canvas quadrado**, reformulada por metáfora para preencher o quadrado. Tem dois modos:

- **Modo conversão (padrão quando existe deck 16:9):** reformula um deck existente, slide a slide, conforme o playbook abaixo.
- **Modo criação nativa (quando NÃO existe deck de origem, ou o usuário pede um slide novo já quadrado):** cria o slide do zero direto na geometria quadrada. Veja "Criação do zero na geometria nativa".

> **Fonte da verdade:** o padrão desta skill está congelado na spec `_reversa_sdd/responsividade/sdd/mira-squared-1x1.md` (score 92) e no mockup `_reversa_sdd/responsividade/sdd/referencias/1.jpg`. Quando em dúvida sobre um valor exato, o resultado deve bater com o mockup. O padrão de qualidade do reflow é o mesmo do `/mira-vertical`.

## O resultado, em uma frase

Num slide de conteúdo aparecem **apenas duas coisas, ambas DENTRO da área segura de 50px do quadro**: o **título principal no topo da área segura** (1 ou 2 linhas, nunca mais) e a **animação grande preenchendo todo o resto da área segura** logo abaixo. **Somem:** o subtítulo, o header do card (ícone + label + botão Replay) e a base do card (legenda uppercase + grade de pílulas). As laterais fora do quadrado ficam **#333333**. Capa e encerramento (que não têm `.glass-card`) mantêm o layout próprio.

## CRITÉRIO Nº 1 (prioridade do usuário)

A animação tem que **preencher a maior parte do quadrado**. Preencher bem o box vale mais que a perfeição do reflow por metáfora. Nunca é aceitável a animação ocupar só uma faixa fina com área vazia (ou preta) em volta. Antes de entregar, olhe cada slide: se sobra muita área vazia, refaça.

## ÁREA SEGURA: 50px medidos do QUADRO, com título E animação dentro

Todo deck desta skill leva área segura de 50px, e **a animação tem que sempre CHEGAR na margem** (fit-to-área-segura, item C), nunca parar antes dela. Validado nas imagens de referência (`_reversa_sdd/responsividade/margem_ref/`). A área segura pertence ao **quadro do slide** (o quadrado inteiro), NÃO ao palco da animação:

**(A) Margem de 50px medida da borda do QUADRO, e tudo dentro dela.** `body > section:has(.glass-card)` leva `padding: 50px; box-sizing: border-box;` (já no bloco canônico). O título é a primeira coisa dentro da margem (nunca colado na borda do quadro) e a animação preenche todo o resto. ERRADO: pôr os 50px como padding do `.anim-stage`, deixando o título fora da margem. CERTO: a margem abraça o QUADRO inteiro.

**(B) O palco ocupa TODO o resto da área segura + viewBox casado em runtime.** No canônico, o bloco do slide, o `.glass-card` e o `.anim-stage` formam uma cadeia flex (`flex: 1 1 auto; min-height: 0`): o palco estica da base do título até a margem de baixo, na largura toda da área segura, sem `aspect-ratio` fixo. Como a altura do título varia (1 ou 2 linhas), a razão do palco não é fixa: case o `viewBox` à razão REAL do palco em runtime, no início de cada build/replay (o `H` autorado, `H = W`, é só valor inicial):

```js
// F = FMT.<slug> (objeto {W, H} usado pela animação); svg = seleção d3 do <svg>
function casarPalco() {
  const r = svg.node().closest('.anim-stage').getBoundingClientRect();
  if (r.width > 0 && r.height > 0) F.H = Math.round(F.W * r.height / r.width);
  svg.attr('viewBox', `0 0 ${F.W} ${F.H}`);
}
// chame casarPalco() na 1ª linha do build/replay; re-case em resize e document.fonts.ready
// (o fitToArea a cada tick absorve a mudança sem precisar rebuildar)
```

**(C) A animação PREENCHE até a margem (fit-to-área-segura).** Não basta caber: tem que **ocupar todo o palco, encostando na margem sem cruzar**. Envolva TODO o desenho num grupo `<g>` e, a cada quadro, escale/translade esse grupo para a bounding box dele preencher `[EDGE, W-EDGE] × [EDGE, H-EDGE]` (EDGE ≈ 14, só a folga de stroke/glow; a margem de 50px vem do padding da SEÇÃO):

```js
const EDGE = 14;
function fitToArea(g) {                 // g = <g> que envolve TODO o desenho
  g.attr('transform', null);
  const b = g.node().getBBox();
  if (!b.width || !b.height) return;
  const tw = F.W - 2 * EDGE, th = F.H - 2 * EDGE;
  const s = Math.min(tw / b.width, th / b.height);
  const tx = EDGE + (tw - b.width * s) / 2 - b.x * s;
  const ty = EDGE + (th - b.height * s) / 2 - b.y * s;
  g.attr('transform', `translate(${tx},${ty}) scale(${s})`);
}
// no 'tick' da animação (ou depois de compor o quadro): fitToArea(root)
```

Vale para QUALQUER metáfora (grafo, fluxo, orbital, partículas): componha livre e deixe o fit preencher. O fit **substitui** o antigo clamp de margem e garante preenchimento determinístico (independe de o force layout espalhar bem).

**(D) A margem é TRANSPARENTE.** A área segura é só o espaço vazio do padding de 50px da seção, **sem nenhuma pintura**: nada de faixa vermelha, moldura, borda ou CSS/JS de debug no arquivo entregue. Para conferir durante o trabalho, meça no DevTools ou pinte temporariamente e REMOVA antes de entregar. **Validação (a olho):** título e animação inteiros dentro dos 50px, e a animação encostando na margem (não parando antes).

## Dimensão (erro mais comum)

O quadrado é **generalista para a tela atual**, não um tamanho fixo em pixels: o **lado é a altura cheia da tela** (`100vh`), a mesma do 16:9. Numa tela 1080p dá 1080x1080; em outra, escala junto. É a **coluna central** centralizada na horizontal, com sobra dos dois lados em #333333. Fixar 1080x1080 prenderia o resultado a uma única resolução.

Não é moldura fixa que só centraliza (a versão antiga fazia isso, deixando o `<svg>` 16:9 com faixa preta acima e abaixo). Aqui o QUADRO é o slide inteiro, o palco ocupa toda a área segura abaixo do título e a geometria de cada animação é **reformulada no JS da cópia** para preencher.

## Criação do zero na geometria nativa

Quando não houver deck 16:9 de origem, ou o usuário pedir "cria um slide quadrado sobre X", NÃO crie um 16:9 intermediário para converter depois. A animação nasce pensada para o quadrado:

1. **Herde as regras criativas do `agents/mira-animator/SKILL.md`:** Regra Zero (loop interno obrigatório), liberdade criativa de metáfora, regra de idioma, regra de título (sem ícone, máximo 6 palavras), estrutura do card com glass-card. Manter a estrutura do glass-card é o que deixa o mesmo CSS desta skill esconder header/base e exibir só título + animação.
2. **Geometria nativa desde a concepção:** o arquivo já nasce como `index-1x1.html` (na pasta do deck novo), com o bloco `<style id="mira-formato-1x1">` desta skill no head, área segura de 50px no quadro e `viewBox` inicial quadrado (`W = 960`, `H = 960`) casado em runtime pelo `casarPalco`.
3. **Metáfora escolhida JÁ para o quadrado:** metáforas radiais/centradas (orbital, hub-and-spoke, pulso central, grade 2x2) rendem mais no quadrado que fileiras largas. O assunto ocupa a maior parte do palco, centralizado.
4. Se o deck quadrado (`index-1x1.html`) já existir, o slide novo é adicionado nele, no padrão dos demais.

## REGRA DE IDIOMA

Siga `agents/_shared/idioma.md`. Texto visível em português correto. Proibido travessão (—): use vírgula ou dois-pontos.

## REGRA DE FONTE MÍNIMA: 13px RENDERIZADOS

Nenhum texto visível pode renderizar com menos de 13px. O `font-size` no SVG é em unidades do `viewBox`, não pixels de tela. Como o quadrado (lado = 100vh, ~1080px numa tela 1080p) é mais largo que a coluna do vertical, o mínimo do vertical (`font-size >= 24` para `W ≈ 960`) já fica folgado aqui; mantenha-o como piso. Texto HTML visível: `font-size` computado >= 13px (Tailwind `text-xs` PROIBIDO; menor permitido `text-sm`). Se não couber, encurte o texto, nunca diminua abaixo do mínimo.

## Regra de Ouro: nunca destrua o original

- O deck 16:9 (`index.html`) **permanece intacto**; todo o reflow e a composição acontecem num **arquivo novo** ao lado, `index-1x1.html`.
- Pode mudar na cópia: **geometria, layout e composição** (viewBox, coordenadas, eixo de espalhamento, ocultar subtítulo/header/base via CSS, posição do título).
- Continua **intocado** mesmo na cópia: textos, rótulos, cores, easing, durações, a lógica do loop interno e o `generation counter` (`window.__slugGen`) que evita vazamento. Você reposiciona e oculta, não reescreve a animação.

## As três viradas de chave

### 1. Composição: só título + animação (CSS escopado)

Tudo via CSS no bloco injetado, escopado aos slides de conteúdo com `:has(.glass-card)` (capa e encerramento, sem `.glass-card`, ficam de fora):

- **Subtítulo oculto:** `body > section:has(.glass-card) .text-center > p { display: none }`.
- **Header e base do card ocultos:** `body > section .glass-card > div:first-child, body > section .glass-card > div:last-child { display: none }`.
- **Chrome do card zerado:** `.glass-card` sem `background`, `border`, `box-shadow`, `backdrop-filter` e `padding`, para a animação ir de ponta a ponta.
- **Conteúdo colado no topo, DENTRO da área segura:** `body > section:has(.glass-card) { justify-content: flex-start; padding: 50px }`. O padding de 50px É a área segura.
- **Título proeminente:** `body > section h2 { font-size: clamp(35px, 5.6vh, 52px); line-height: 1.1 }`. O auto-ajuste por JS reduz só quando passa de 2 linhas.

Não remova os elementos do HTML: o CSS é cirúrgico e reversível, e o escopo `:has(.glass-card)` preserva capa, encerramento e qualquer slide-régua.

### 2. Palco = todo o resto da área segura + viewBox casado em runtime

- **Área segura no QUADRO:** `body > section:has(.glass-card) { padding: 50px }`. Título dentro, no topo dela.
- **Palco esticado (cadeia flex):** bloco do slide, `.glass-card` e `.anim-stage` com `flex: 1 1 auto; min-height: 0` (já no canônico); o `.anim-stage` fica SEM `aspect-ratio` fixo e SEM padding, ocupando da base do título até a margem de baixo, na largura toda.
- **viewBox casando:** para cada `<svg id="sv-...">`, autore a altura inicial como **`H = W`** (mantendo `minX`, `minY`, `W`) e case à razão real do palco em runtime com `casarPalco` (seção da ÁREA SEGURA). `preserveAspectRatio="xMidYMid meet"` continua; casado em runtime, não há letterbox nem distorção.
  - Exemplo: `viewBox="0 0 960 540"` nasce `viewBox="0 0 960 960"` e o `casarPalco` ajusta o `H` ao palco medido.
- Se o slide usa o zoom `SZ` do `mira-size-animator`, preserve a fórmula, só casando a altura ao palco.

### 3. Reflow do eixo para o quadrado (preencher a maior parte)

A geometria de cada animação é reformulada para preencher o quadrado, conforme o playbook por metáfora abaixo (garante o CRITÉRIO Nº 1). O loop interno e o `generation counter` ficam intactos.

## Auto-ajuste de título (script injetado)

Títulos longos quebram o slide em 3 ou 4 linhas. Um IIFE mede a altura real de cada `h2` e reduz a fonte 1px por vez (piso 18px) até caber em no máximo 2 linhas. Roda no `load`, no `document.fonts.ready` e no `resize` (debounced). Injete junto aos outros scripts, antes de `lucide.createIcons()`:

```js
(function () {
  const MAX_LINES = 2, MIN_FONT = 18;
  function fitTitles() {
    document.querySelectorAll('body > section h2').forEach(h2 => {
      h2.style.removeProperty('font-size');
      let font = parseFloat(getComputedStyle(h2).fontSize), guard = 0;
      while (h2.scrollHeight > parseFloat(getComputedStyle(h2).lineHeight) * MAX_LINES + 2 && font > MIN_FONT && guard < 90) {
        font -= 1; h2.style.setProperty('font-size', font + 'px', 'important'); guard++;
      }
    });
  }
  window.addEventListener('load', fitTitles);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitTitles);
  window.addEventListener('resize', () => { clearTimeout(window.__fitT); window.__fitT = setTimeout(fitTitles, 150); });
})();
```

## Playbook de reflow por metáfora (alvo: quadrado 1:1)

Aplique conforme a metáfora do slide, sempre visando o CRITÉRIO Nº 1. O princípio geral está no fim.

**Radial / orbital / hub (relógio, radar, núcleo + satélites).** Já é centrado; **aumente o raio** (`R`) para preencher o quadrado. No orbital, use elipse quase circular (`rx ≈ ry`), diferente da elipse achatada do 16:9. Núcleo e pulso radial no centro.

**Fluxo (partícula viajando entre nós).** O eixo pode **permanecer horizontal** (o quadrado é mais largo que o 9:16), sempre reescalado para ocupar a largura e boa parte da altura; ou disposto na **diagonal** quando isso preencher melhor. Não deixar como faixa fina no meio: aumente o espaçamento vertical dos nós e o raio deles.

**Comparação A vs B / transformação A → B.** Mantenha lado a lado se os dois blocos couberem no quadrado em tamanho grande; senão empilhe A em cima e B embaixo. O realce alternado (spotlight) e a partícula de transformação continuam.

**Rede / grafo / nuvem de nós (force layout).** Recentralize com `forceCenter(W/2, H/2)` no `H` novo (`H = W`); aumente o espalhamento (`forceManyBody().strength` mais negativo, maior `linkDistance`) até a nuvem usar o quadrado; cresça `forceCollide`; e clampe as posições no intervalo de `margem` até `W menos margem` em cada eixo.

**Flip cards / battle arena (stage HTML).** Não há `viewBox` para casar; o quadrado 1:1 vale como caixa. Disponha os cards (coluna ou grade 2x2) para preencher o quadrado.

**Fileira de muitos itens (timeline, 6+ etapas).** Recomponha em grade de 2 colunas (ou serpentina), com itens grandes, para preencher o quadrado.

**Princípio geral (metáfora fora da lista), OBRIGATÓRIO:** identifique o **eixo dominante** e recomponha (escala e disposição) até o assunto ocupar a maior parte do quadrado, centralizado, com o loop interno preservado. No quadrado não é preciso girar horizontal para vertical (como no 9:16): basta escalar e distribuir para preencher.

## Passos

1. **Localizar o deck.** Ache o `index.html` do deck (em `decks/<deck>/` ou `decks/<tema>/`). Se houver mais de um deck e o usuário não disser qual, pergunte. Se faltar `index.html`, ou ele não tiver `.glass-card` / `.anim-stage` / `<svg id="sv-...">`, **aborte com mensagem clara** sem criar arquivo parcial.
2. **Copiar para o novo arquivo.** Copie `index.html` para `index-1x1.html` na mesma pasta (caminhos relativos de logo, vídeo e imagens continuam válidos). O `index.html` fica byte a byte igual.
3. **Injetar a moldura + composição.** Logo antes de `</head>` do `index-1x1.html`, como último bloco de estilo (depois do Tailwind, para vencer a especificidade), insira o bloco `<style id="mira-formato-1x1">` canônico (abaixo): quadrado 100vh, fundo #333333 fora da coluna, composição só título + animação, canvas quadrado 1/1.
4. **Injetar o script de auto-ajuste de título.** Adicione o IIFE `fitTitles` (acima) no bloco de scripts, antes de `lucide.createIcons()`.
5. **Reformular cada animação no JS.** Para cada slide de conteúdo: autore o `H` inicial do `viewBox` como `H = W` (mantendo `minX`, `minY`, `W`), injete `casarPalco` (chamado na 1ª linha de cada build/replay; re-casado em resize e `document.fonts.ready`) e aplique o reflow do eixo com `fitToArea` preenchendo a área segura (playbook). Preserve textos, cores, easing, durações, loop e `generation counter`.
6. **Verificar o encaixe (CRITÉRIO Nº 1).** Confira que, no quadrado (lado = 100vh): (a) cada slide de conteúdo mostra só título + animação; (b) o título cabe em no máx. 2 linhas, colado no topo; (c) **a animação preenche a maior parte do quadrado**, sem faixa fina/preta nem distorção; (d) o loop interno ainda roda; (e) capa e encerramento mantêm o layout próprio.
7. **Reportar.** Informe o caminho `index-1x1.html`, que o quadrado é generalista para a tela (lado = altura do 16:9; numa tela 1080p, 1080x1080), o que foi reformulado por slide (uma linha por slide) e como gravar: abra em tela cheia num Chromium moderno (o `:has()` da composição exige Edge/Chrome atual) e recorte a coluna central quadrada.

### Bloco `<style id="mira-formato-1x1">` canônico (gerar exatamente isto)

```html
<style id="mira-formato-1x1">
  /* Versão quadrada generalista para a tela atual (reflow da animação).
     Lado = altura cheia da tela (= altura do 16:9). Numa tela 1080p, 1080x1080. */
  :root {
    --fmt-w: 100vh;   /* lado do quadrado = altura da tela */
    --fmt-h: 100vh;
  }
  html { background: #333333; }
  /* Centraliza a coluna na horizontal via flex (não margin:auto: o Preflight
     do Tailwind injeta body{margin:0} em runtime e venceria o margin:auto).
     Fundo FORA do quadrado (margens laterais) em #333333. */
  body {
    background: #333333;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  body > section {
    width: var(--fmt-w) !important;
    height: var(--fmt-h) !important;
    min-height: var(--fmt-h) !important;
    overflow: hidden;
    background: var(--mira-bg, #000) !important;
  }
  /* O conteúdo preenche a largura do quadrado */
  body > section .max-w-6xl,
  body > section .max-w-5xl,
  body > section .max-w-4xl,
  body > section .max-w-3xl,
  body > section .max-w-2xl { max-width: 100% !important; }
  /* AREA SEGURA: 50px medidos da borda do QUADRO. Titulo e animacao vivem DENTRO. */
  body > section:has(.glass-card) { justify-content: flex-start !important; padding: 50px !important; box-sizing: border-box !important; }
  /* Cadeia flex: o palco estica da base do titulo ate a margem de baixo da area segura. */
  body > section:has(.glass-card) > div { flex: 1 1 auto !important; min-height: 0 !important; display: flex !important; flex-direction: column !important; }
  body > section:has(.glass-card) .glass-card { flex: 1 1 auto !important; min-height: 0 !important; display: flex !important; flex-direction: column !important; }
  /* Palco = TODO o resto da area segura (sem aspect-ratio fixo; o viewBox e casado
     em runtime pelo casarPalco). Sem padding: a margem de 50px e da SECAO. */
  .anim-stage { flex: 1 1 auto !important; min-height: 0 !important; height: auto !important; width: 100% !important; aspect-ratio: auto !important; max-width: none !important; margin-inline: 0 !important; padding: 0 !important; box-sizing: border-box !important; }
  /* QUADRADO: cada slide de conteudo = somente o titulo principal + a animacao grande.
     Subtitulo, header do card (icone/label/Replay) e a base (legenda + pilulas) ficam ocultos;
     o card perde fundo/borda/padding para a animacao ir de ponta a ponta. A animacao (SVG) nao e tocada pelo CSS. */
  body > section h2 { font-size: clamp(35px, 5.6vh, 52px) !important; line-height: 1.1 !important; }
  body > section:has(.glass-card) .text-center > p { display: none !important; }            /* subtitulo */
  body > section:has(.glass-card) .text-center { margin: 0 0 14px 0 !important; padding: 0 !important; flex: 0 0 auto !important; }
  body > section .glass-card { background: none !important; border: none !important; box-shadow: none !important; backdrop-filter: none !important; padding: 0 !important; }
  body > section .glass-card > div:first-child,                                              /* header do card */
  body > section .glass-card > div:last-child { display: none !important; }                  /* base (pilulas) */
  .slide-counter { font-size: 13px !important; }
  /* Pílulas (quando reaproveitadas em algum slide): reduz colunas na coluna. */
  body > section [class*="md:grid-cols-4"] { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
  /* Flip cards (slide tipo exemplos): empilha/grade em vez de fileira larga. */
  #st-exemplos > div { flex-direction: column !important; gap: 14px !important; }
</style>
```

## Edge cases (do mais comum ao menos)

- **Título longo / palavra grande:** o auto-ajuste reduz a fonte até caber em 2 linhas. Título curto: fica no tamanho cheio.
- **Animação radial (relógio, radar) num canvas quadrado:** fica centrada e preenche bem o quadrado (o círculo casa melhor com 1:1 que com 16:9). Aumente o raio até perto das bordas.
- **Animação de fluxo horizontal:** reescale para ocupar o quadrado; pode manter o eixo horizontal (o quadrado é mais largo que o 9:16). Não deixar faixa fina.
- **Slide sem `.glass-card` (capa, encerramento, slide-régua):** as regras com `:has(.glass-card)` não se aplicam; layout próprio preservado.
- **Título de 1 linha num slide, 2 linhas noutro (razão do palco muda):** o `casarPalco` re-casa o `viewBox` em runtime por slide; nada a ajustar à mão.
- **Flip cards (stage HTML):** sem `viewBox` para casar; disponha os cards para preencher o quadrado.
- **Navegador sem `:has()`:** a composição depende dele; avise que a gravação precisa de um Chromium moderno (Edge/Chrome atual).

## Checklist

**Os que mais falham (cheque primeiro):**
- [ ] **CRITÉRIO Nº 1: a animação preenche a maior parte do quadrado** (nada de faixa fina/preta com área vazia em volta).
- [ ] Cada slide de conteúdo mostra SÓ título + animação: subtítulo, header do card e base de pílulas ocultos; card sem fundo/borda/padding.
- [ ] Nenhum título passa de 2 linhas: o IIFE de auto-ajuste está injetado; o título fica colado no topo DA ÁREA SEGURA (`justify-content: flex-start` + `padding: 50px` na seção).
- [ ] **ÁREA SEGURA no QUADRO: título E animação dentro da margem de 50px, e a animação CHEGANDO na margem.** A margem é transparente: nenhum CSS/JS de debug (faixa vermelha) no arquivo entregue.
- [ ] Palco esticado (cadeia flex, sem `aspect-ratio` fixo) e `viewBox` casado em runtime (`casarPalco`), sem distorção nem letterbox.
- [ ] Nenhum texto SVG renderiza abaixo de 13px (font-size SVG >= 24 no `W` padrão).

- [ ] `index.html` original intacto (byte a byte).
- [ ] `index-1x1.html` criado na mesma pasta do deck.
- [ ] Bloco `<style id="mira-formato-1x1">` canônico injetado antes de `</head>`.
- [ ] Fundo fora da coluna em #333333; cada `body > section` com largura e altura `100vh`, centralizado via flex (não `margin:auto`).
- [ ] Textos, cores, easing, durações, loop interno e generation counter intactos.
- [ ] Zoom `SZ` do mira-size-animator preservado nos slides que o usam (só com a altura casada).
- [ ] Capa e encerramento com layout próprio preservado.
- [ ] Navegação funcionando; nenhum slide corta o conteúdo no quadrado.
- [ ] Nenhum travessão (—); acentuação correta.
