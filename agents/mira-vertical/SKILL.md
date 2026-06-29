---
name: mira-vertical
description: >-
  Gera uma versão VERTICAL (9:16, generalista para a tela atual: largura da tela
  dividida por 3 por altura cheia, ex. 640x1080 numa tela 1080p) de um deck do
  Mira, a partir do 16:9 original, OU cria slides verticais DO ZERO quando não
  há deck de origem, para vídeo vertical (Reels, Shorts, TikTok, Stories). Na
  conversão, não toca no original: cria um novo arquivo index-9x16.html ao lado.
  Cada slide fica com só o título no topo e a animação num canvas alto e
  padronizado logo abaixo; o título encolhe até caber em 2 linhas e o viewBox da
  animação é esticado em altura. O eixo de cada animação é reformulado para o
  retrato (fluxo horizontal vira vertical, comparação lado a lado vira
  empilhada). Texto, cores, timings e loop ficam intactos. Use SEMPRE que o
  usuário disser /mira-vertical, versão vertical, deixa vertical, formato 9:16,
  1080x1920, apresentação vertical, para Reels, para Shorts, para Stories, para
  TikTok, vídeo vertical, modo retrato, ou cria um slide vertical.
---

# Skill: Versão Vertical do Deck (9:16) com canvas alto, só título + animação

Transforma um deck 16:9 do Mira numa versão **vertical generalista para a tela atual**, para gravar como vídeo vertical (Reels, Shorts, TikTok, Stories). Cada slide de conteúdo vira **só o título no topo + a animação grande num canvas alto e padronizado**. Tem dois modos:

- **Modo conversão (padrão quando existe deck 16:9):** reformula um deck existente, slide a slide, conforme o playbook abaixo.
- **Modo criação nativa (quando NÃO existe deck de origem, ou o usuário pede um slide novo já vertical):** cria o slide do zero direto na geometria retrato, sem passar pelo 16:9. Veja a seção "Criação do zero na geometria nativa".

> **Fonte da verdade:** o padrão desta skill foi validado e aprovado no deck de referência `specs/slides-verticais/index-9x16.html`, e as regras estão congeladas na spec `specs/slides-verticais/mira-vertical-9x16-spec.md` (com o comparativo elemento por elemento em `mira-vertical-comparacao.md`). Quando em dúvida sobre um valor exato, o resultado deve ficar **idêntico ao deck de referência**.

## O resultado, em uma frase (leia primeiro)

Num slide de conteúdo da versão vertical aparecem **apenas duas coisas**: o **título principal colado no topo** (1 ou 2 linhas, nunca mais) e a **animação grande ocupando o canvas alto** logo abaixo, de ponta a ponta na largura da coluna. **Somem:** o subtítulo, o header do card (ícone + label + botão Replay) e a base do card (legenda uppercase + grade de pílulas). As laterais fora da coluna ficam **#333333**. Capa e encerramento (que não têm `.glass-card`) mantêm o layout próprio.

## Criação do zero na geometria nativa

Quando não houver deck 16:9 de origem, ou o usuário pedir "cria um slide vertical sobre X", NÃO crie um 16:9 intermediário para converter depois. A animação nasce pensada para o retrato:

1. **Herde as regras criativas do `agents/mira-animator/SKILL.md`:** Regra Zero (loop interno obrigatório), liberdade criativa de metáfora, regra de idioma, regra de título (sem ícone, máximo 6 palavras), estrutura do card com glass-card. Tudo vale igual. Manter a estrutura do glass-card (header, `.anim-stage`, base de pílulas) é o que deixa o mesmo CSS desta skill esconder header/base e exibir só título + animação.
2. **Geometria nativa desde a concepção:** o arquivo já nasce como `index-9x16.html` (na pasta do deck novo), com o bloco `<style id="mira-formato-9x16">` desta skill no head, canvas alto padrão (`aspect-ratio: 128 / 203`) e `viewBox` retrato casando (`W = 960`, `H = W * 203 / 128 ≈ 1523`).
3. **Metáfora escolhida JÁ para o vertical:** o eixo dominante nasce na altura (fluxo desce, comparação empilha, rede espalha na vertical, escada sobe íngreme). Não componha mentalmente em 16:9 para depois girar; o playbook de reflow vira aqui um playbook de composição.
4. **Mesmos critérios de aprovação do modo conversão:** título no topo em no máximo 2 linhas, assunto ocupando bem a largura útil, nada cortado, REGRA DE FONTE MÍNIMA respeitada.
5. Se o deck vertical (`index-9x16.html`) já existir, o slide novo é adicionado nele, no padrão dos demais.

**Dimensão (leia primeiro, é o erro mais comum).** O quadro vertical é **generalista para a tela atual**, não um tamanho fixo em pixels. A **altura é a altura cheia da tela** (`100vh`) e a **largura é a largura da tela dividida por 3** (`calc(100vw / 3)`). Numa tela 1080p isso dá 640x1080; numa tela maior ou menor, escala junto. O quadro vertical é a **coluna central** (um terço da largura) ocupando toda a altura, com sobra dos dois lados como margem em #333333. Por que não 1080x1920 fixo: além de não caber numa tela de 1080 de altura, prenderia o resultado a uma única resolução. (A regra largura/3 dá uma coluna um tiquinho mais larga que o 9:16 cravado. Se a plataforma exigir 9:16 exato, use `--fmt-w: calc(100vh * 9 / 16)`.)

A abordagem **não é** moldura fixa que só encolhe: é **reformulação por slide**. Um `viewBox` 16:9 dentro de um quadro estreito e alto encaixa pela largura e ocupa só uma faixa fina, perdendo todo o impacto. Por isso aqui o palco vira **canvas alto** e a geometria de cada animação é **reformulada no JS da cópia** para subir e descer pela altura.

## RESULTADO OBRIGATÓRIO (é o ponto desta skill, leia)

Estes 9:16 são para assistir no **smartphone**: a animação domina a tela e o título é o único texto de apoio. Três coisas têm que estar certas:

1. **Composição enxuta: só título + animação.** Se aparecer subtítulo, header do card (ícone/label/Replay) ou a base de pílulas num slide de conteúdo, está ERRADO. Sobra do `.glass-card` apenas o filho do meio, o `.anim-stage`, sem fundo/borda/sombra/padding, de ponta a ponta.

2. **Título no topo, no máximo 2 linhas.** O título fica colado no topo (não centralizado vertical) e nunca quebra o slide em 3 ou 4 linhas. Títulos longos (com palavras grandes como "documentação") encolhem sozinhos até caber em 2 linhas, via o script de auto-ajuste. Títulos curtos ficam no tamanho cheio.

3. **Animação vertical e maximizada no canvas alto.** Toda animação cujo eixo dominante era horizontal DEVE ser refeita na vertical (o que ia para o lado passa a ir de cima para baixo; lado a lado vira empilhado). Nada de partícula correndo numa faixa fina, nem blocos lado a lado encolhidos. O canvas é alto (128/203) e o `viewBox` é esticado em altura para casar, sem letterbox e sem distorção.

Antes de entregar, olhe o resultado e responda: **cada slide de conteúdo mostra só o título (no máx. 2 linhas, no topo) e a animação vertical ocupando o canvas alto, com as laterais em #333333?** Se a resposta for não, refaça. Esse é o critério de aprovação.

## REGRA DE IDIOMA

Siga `agents/_shared/idioma.md`. Texto visível em português correto. Proibido travessão (—): use vírgula ou dois-pontos.

## REGRA DE FONTE MÍNIMA: 13px RENDERIZADOS (IMPERATIVO, INEGOCIÁVEL)

Validado empiricamente pelo usuário (teste de legibilidade em 2026-06-11): abaixo de 13px renderizados na tela, o texto fica ilegível no vertical. **Nenhum texto visível pode renderizar com menos de 13px.** Sem exceção: rótulos de nós, legendas de eixo, e qualquer texto SVG que permaneça visível.

- **Texto SVG (a pegadinha):** o `font-size` no SVG é em unidades do `viewBox`, não pixels de tela. O que renderiza um `font-size` SVG em pixels é a razão entre a **largura da coluna** e a **largura do `viewBox` (`W`)**, que **não muda** quando esticamos só a altura. Como a geometria do conteúdo (incluindo as fontes) é a mesma do reflow retrato e não é tocada (ver "Esticar o viewBox em altura"), o mínimo já validado continua valendo: no setup padrão (coluna de 1/3 da tela, `W ≈ 960`), use **`font-size >= 24`** para qualquer texto SVG (24 unidades renderizam ~12,9px). Se um slide tiver outro `W`, escale o mínimo na proporção da largura do `viewBox`.
- **Texto HTML** que sobrar visível (raro, já que header e base somem): `font-size` computado >= 13px. No Tailwind, `text-xs` (12px) está **PROIBIDO**; o menor permitido é `text-sm` (14px).
- **Se o texto não couber com 13px:** encurte o texto ou recomponha o layout. **Nunca** resolva diminuindo a fonte abaixo do mínimo.

## Regra de Ouro: nunca destrua o original

- O deck 16:9 (`index.html`) **permanece intacto**. Você nunca edita o arquivo de origem.
- Você cria um **arquivo novo** ao lado: `index-9x16.html`, e é nele que todo o reflow e a composição acontecem.
- O que você pode mudar na cópia: **geometria, layout e composição** (viewBox, coordenadas, eixo de espalhamento, altura do canvas, ocultar subtítulo/header/base via CSS, posição do título).
- O que continua **intocado** mesmo na cópia: textos, rótulos, cores, easing, durações, a lógica do loop interno e o `generation counter` (`window.__slugGen`) que evita vazamento. Você reposiciona e oculta, não reescreve a animação do zero.

## Como o Mira monta um slide (o que você vai reformular)

- Cada slide é um `body > section` com `class="min-h-screen flex flex-col items-center justify-center ..."`.
- O bloco do slide é o filho direto da `section`: `<div class="... max-w-6xl/max-w-5xl">`, com um `.text-center` (título `h2` + subtítulo `p`) e o `.glass-card` dentro.
- O `.glass-card` tem **três filhos diretos**: o **header** (1º `div`: ícone + label + sublinha + botão Replay), o **`.anim-stage`** (o palco da animação, o filho do meio) e a **base** (último `div`, o `.border-t`: legenda uppercase + grade de pílulas).
- O palco `.anim-stage` é `aspect-ratio: 16/9` no 16:9. Dentro dele há um `<svg id="sv-...">` que preenche 100% x 100%, com `preserveAspectRatio="xMidYMid meet"`.
- O `viewBox` da animação é definido **no JS** de cada slide (IIFE), normalmente como `const W = 960, H = 540; ... .attr('viewBox', \`0 0 ${W} ${H}\`)` (às vezes `1280 720`). As coordenadas derivam de `W` e `H`.
- Alguns slides já trazem um zoom do `mira-size-animator`: o `viewBox` vira `${(W - W/SZ)/2} ${(H - H/SZ)/2} ${W/SZ} ${H/SZ}` com uma constante `SZ`. Preserve essa fórmula (é o nível de tamanho do slide), só case a altura ao canvas alto.
- A navegação (barra de progresso, botão de próximo, teclado) é fixa e continua funcionando.

## As três viradas de chave

A reformulação gira em torno de três regras mecânicas.

### 1. Composição: só título + animação (CSS escopado)

Tudo via CSS no bloco injetado, escopado aos slides de conteúdo com `:has(.glass-card)` (capa e encerramento, sem `.glass-card`, ficam de fora):

- **Subtítulo oculto:** `body > section:has(.glass-card) .text-center > p { display: none }`.
- **Header e base do card ocultos:** `body > section .glass-card > div:first-child, body > section .glass-card > div:last-child { display: none }`.
- **Chrome do card zerado:** `.glass-card` sem `background`, `border`, `box-shadow`, `backdrop-filter` e `padding`, para a animação ir de ponta a ponta.
- **Conteúdo colado no topo:** `body > section:has(.glass-card) { justify-content: flex-start; padding: 2.2vh 6px 1.4vh 6px }`.
- **Título proeminente:** `body > section h2 { font-size: clamp(35px, 5.6vh, 52px); line-height: 1.1 }` (base ~7/10 da escala). O auto-ajuste por JS reduz só quando passa de 2 linhas.

Não remova os elementos do HTML: o CSS é cirúrgico e reversível, e o escopo `:has(.glass-card)` preserva capa, encerramento e qualquer slide-régua.

### 2. Canvas alto padrão (128/203) + esticar o viewBox em altura

- **Palco alto:** `.anim-stage { height: auto !important; aspect-ratio: 128 / 203 !important }` em TODOS os slides (≈0,6305, bem mais alto que o 4:5 antigo). `height: auto` é obrigatório, senão um `height` fixo por slide venceria o `aspect-ratio`.
- **viewBox casando, esticado SÓ em altura:** para cada `<svg id="sv-...">`, mantenha `minX`, `minY` e a largura `W`, e troque a altura por **`H = W * 203 / 128`**. A geometria desenhada (coordenadas dos elementos) **NÃO muda**: o conteúdo renderiza no mesmo tamanho e posição de antes, e o canvas só cresce para baixo. `preserveAspectRatio="xMidYMid meet"` continua, e como o aspecto do `viewBox` passa a bater com o do palco, não há letterbox nem distorção.
  - Exemplo: `viewBox="140 175 1000 1250"` vira `viewBox="140 175 1000 1585.94"` (1000 * 203/128 = 1585,94).
  - Exemplo real do deck de referência: `601.5 → 601.5 * 203/128 = 953.94`; `833.34 → 1321.63`.

### 3. Reflow do eixo para o retrato (geometria vertical)

Antes (ou junto com) o esticão de altura, a geometria de cada animação é reformulada para subir e descer pela altura, conforme o playbook por metáfora abaixo. Esse é o passo que garante que a animação não fica como faixa fina horizontal: o eixo dominante horizontal vira vertical, elipse larga vira alta, comparação lado a lado vira empilhada. O loop interno e o `generation counter` ficam intactos.

> Diferença para a versão antiga da skill: antes o palco era 4:5 e a animação ficava centralizada no meio do palco. Agora o palco é 128/203 (mais alto), o `viewBox` é esticado só em altura (a geometria fica igual, a área nova cresce para baixo) e a composição é enxugada para só título + animação. O ajuste fino de espalhar o conteúdo para baixo (miolo vazio) e de ampliar uma animação são ferramentas por slide, não passos obrigatórios (ver "Ferramentas por slide").

## Auto-ajuste de título (script injetado)

Títulos longos quebram o slide em 3 ou 4 linhas. Um IIFE mede a altura real de cada `h2` e reduz a fonte 1px por vez (piso 18px) até caber em no máximo 2 linhas. Roda no `load`, no `document.fonts.ready` (reajusta quando a fonte Inter carrega) e no `resize` (debounced). Medir o render captura palavras longas reais (ex.: "documentação"), o que contar caracteres não pega. Injete junto aos outros scripts, antes de `lucide.createIcons()`:

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

## Playbook de reflow por metáfora

Aplique conforme a metáfora do slide. O princípio geral está no fim, para metáforas fora desta lista. (O eixo já era reformulado na versão anterior da skill; isto continua valendo.)

**Fluxo (partícula viajando entre nós).** Hoje é horizontal: `xs = scalePoint().range([120, W-120])`, partícula anima `cx`. Reflow para vertical:
- `const ys = d3.scalePoint().domain(d3.range(ETAPAS.length)).range([H * 0.10, H * 0.90]);` e `const cx = W / 2;` fixo.
- Linha vertical: `x1 = x2 = cx`, `y1 = ys(0)`, `y2 = ys(last)`.
- Nós: `translate(${cx}, ${ys(i)})`.
- Rótulo do nó: em vez de embaixo, jogue para o lado: `attr('dx', 70).attr('text-anchor', 'start')`, para o texto não colidir com o nó de baixo.
- Partícula: anima `cy` de `ys(0)` até `ys(last)`, com `cx` fixo.
- Pulsos e timings dos nós: iguais.

**Orbital (núcleo central + satélites).** Hoje é elipse larga: `rx = R, ry = R*0.62`. Reflow para elipse alta:
- Troque a compressão: `rx = R * 0.62, ry = R`.
- Satélites: `translate(${cx + Math.cos(d.angle) * R * 0.62}, ${cy + Math.sin(d.angle) * R})`.
- Aumente `R` para preencher a altura nova. Núcleo e pulso radial ficam no centro.

**Escada (orbe subindo degraus).** Reduza o avanço horizontal (`stepW` menor), aumente a subida (`stepH` maior) e recalcule `baseX`/`baseY` para a escada subir do rodapé até perto do topo do canvas alto. O orbe continua com o mesmo `climb()` e `easeBounceOut`.

**Comparação A vs B (dois cards lado a lado).** Layout HTML. Empilhe A em cima e B embaixo: troque o `grid md:grid-cols-2` por uma coluna só, mantendo o realce alternado (spotlight); se houver partícula viajando de A para B, faça-a descer.

**Transformação A → B lado a lado (planta → obra, antes → depois, entrada → saída).** Empilhe A em cima e B embaixo, cada um grande, e a seta/partícula de transformação **desce** de A para B. Nunca deixe os dois lado a lado encolhidos no topo. (É o caso típico de "miolo vazio": ver "Ferramentas por slide".)

**Rede / grafo / nuvem de nós (force layout).** Recentralize com `forceCenter(W/2, H/2)` no `H` novo; aumente o espalhamento (`forceManyBody().strength` mais negativo, maior `linkDistance`/`forceRadial`) até a nuvem usar a altura toda; cresça `forceCollide` com o raio dos nós; e clampe as posições em `[margem, H - margem]`:

```js
const MARGEM = 90;
sim.force('center', d3.forceCenter(W / 2, H / 2))
   .force('charge', d3.forceManyBody().strength(-340))
   .force('collide', d3.forceCollide(d => d.r + 8))
   .on('tick', () => {
     nodes.forEach(n => {
       n.x = Math.max(MARGEM, Math.min(W - MARGEM, n.x));
       n.y = Math.max(MARGEM, Math.min(H - MARGEM, n.y));
     });
     /* ...atualização de posições existente... */
   });
```

**Capa (partículas no fundo, tela cheia).** Costuma usar `W = innerWidth, H = innerHeight`: já preenche o retrato sozinho. Não tem `.glass-card`, então as regras de composição não a tocam. No máximo confira que cobre o quadro.

**Flip cards / battle arena (slide tipo exemplos).** O stage é HTML, não SVG com `viewBox` para esticar. Empilhe os cards numa coluna única (`flex-direction: column`) e deixe a cascata de reveal correr de cima para baixo. O canvas 128/203 vale como caixa.

**Fileira de muitos itens (timeline, 6+ etapas).** Girar para uma coluna única pode espremer os itens. Recomponha em grade de 2 colunas (ou serpentina), com itens grandes. A ordem de leitura segue a nova disposição.

**Princípio geral (metáfora fora da lista), OBRIGATÓRIO:** identifique o **eixo dominante**. Se for horizontal, **gire 90 graus** para vertical (sempre). Se for radial e achatado, inverta a compressão. Cresça a escala e recomponha até o assunto ocupar bem o canvas alto, centralizado, com o loop interno preservado.

## Ferramentas por slide (caso a caso, não obrigatórias)

O canvas alto padrão é aplicado em todos os slides automaticamente. Estes ajustes são acionados **por slide (ou em todos), quando o usuário pedir** ou quando um slide claramente precisar.

**A) Esticar o canvas para baixo (miolo vazio).** Para slides de duas pontas (ex.: planta no topo + sistema embaixo) que ficam com um vão grande no meio: aumente a altura do palco daquele slide com um override de `aspect-ratio` no `#st-<slug>` (canvas ainda mais alto) e estique o `H` do `viewBox` daquele slide para casar, sem mexer na geometria. Quando pedido, espalhe o conteúdo: elemento de cima maior no topo, elemento de baixo maior no rodapé, com o token/scan cruzando o meio como respiro.

**B) Aumentar os elementos em X% (REGRA DO USUÁRIO: distâncias caem X% junto).** Quando o usuário pede para "aumentar os elementos" da animação, NÃO é zoom de `viewBox`. A regra fixa dele: **os elementos crescem X% E as distâncias entre eles reduzem X%**, ao mesmo tempo, para os elementos ficarem mais proeminentes **mantendo a proporção** do conjunto, sem estourar/cortar nas bordas. Reescale a geometria no JS daquela animação (ou de todas):
- **Tamanhos ×(1 + X/100):** raios, larguras, alturas, `font-size` (respeitando a fonte mínima), `stroke-width`, gaps internos de um elemento.
- **Distâncias ×(1 − X/100):** puxe cada POSIÇÃO para o centro do conteúdo (no vertical, `cx = 640`, `cy = 1015`): `nova_pos = centro + (pos − centro) × (1 − X/100)`. Isso encolhe o espaçamento entre elementos sem mexer no tamanho deles.
- Exemplo "+20%": tamanhos ×1,2 e posições puxadas para o centro ×0,8.
- Preserve loop, engine (`reset`/`track`/`alive`/`newSvg`), textos, cores, easing e durações. Não troque o `viewBox` por esse pedido (o `viewBox` segue `0 0 1280 2030` ou o do slide).

**C) Zoom geral no viewBox (ampliar "a cena" inteira em X%).** Diferente de (B): aqui cresce elemento E distância juntos, dando zoom na cena, e pode cortar nas bordas. Use só quando o usuário pedir explicitamente "dá zoom / aproxima a cena". `k = 1 + X/100`; `newW = W/k`, `newH = H/k`; recentrar no centro do conteúdo (`newMinX = cx − newW/2`, `newMinY = cy − newH/2`), mantendo o aspecto 128/203. Cuidado (EC-04): animações de fluxo que já preenchem a altura cortam as pontas com esse zoom; nelas prefira a ferramenta (B).

## Passos

1. **Localizar o deck.** Ache o `index.html` do deck (em `decks/<deck>/` ou `slides/<tema>/`). Se houver mais de um deck e o usuário não disser qual, pergunte. Se faltar `index.html`, ou ele não tiver `.glass-card` / `.anim-stage` / `<svg id="sv-...">`, **aborte com mensagem clara** sem criar arquivo parcial.
2. **Copiar para o novo arquivo.** Copie `index.html` para `index-9x16.html` na mesma pasta (mesma pasta = caminhos relativos de logo, vídeo e imagens continuam válidos). O `index.html` fica byte a byte igual.
3. **Injetar a moldura + composição.** Logo antes de `</head>` do `index-9x16.html`, como último bloco de estilo (depois do Tailwind, para vencer a especificidade), insira o bloco `<style id="mira-formato-9x16">` canônico (abaixo): quadro 9:16, fundo #333333 fora da coluna, composição só título + animação, título base 7/10, canvas alto 128/203.
4. **Injetar o script de auto-ajuste de título.** Adicione o IIFE `fitTitles` (acima) no bloco de scripts, antes de `lucide.createIcons()`.
5. **Reformular cada animação no JS.** Para cada slide de conteúdo: aplique o reflow do eixo para o retrato (playbook) e estique o `H` do `viewBox` para casar com 128/203 (`H = W * 203 / 128`), mantendo `minX`, `minY`, `W`. Preserve textos, cores, easing, durações, loop e `generation counter`. Se o slide usa o zoom `SZ` do `mira-size-animator`, mantenha a fórmula, só com a altura casada.
6. **Verificar o encaixe.** Confira mentalmente que, na coluna vertical (1/3 da largura da tela, altura cheia): (a) cada slide de conteúdo mostra só título + animação; (b) o título cabe em no máx. 2 linhas, colado no topo; (c) a animação é vertical e preenche o canvas alto, sem distorção nem letterbox; (d) o loop interno ainda roda; (e) capa e encerramento mantêm o layout próprio. Caso a caso, aplique as ferramentas por slide (esticar para baixo / ampliar X%).
7. **Reportar.** Informe o caminho `index-9x16.html`, que o quadro é generalista para a tela (largura/3 por altura cheia; numa tela 1080p, 640x1080), o que foi reformulado por slide (uma linha por slide: "fluxo agora vertical", "orbital em elipse alta", etc.) e como gravar: abra em tela cheia num Chromium moderno (o `:has()` da composição exige Edge/Chrome atual) e recorte a coluna central na ferramenta de captura.

### Bloco `<style id="mira-formato-9x16">` canônico (gerar exatamente isto)

```html
<style id="mira-formato-9x16">
  /* Versão vertical generalista para a tela atual (reflow da animação).
     Largura = largura da tela / 3. Altura = altura cheia da tela.
     Numa tela 1080p isso dá 640x1080; escala em qualquer resolução. */
  :root {
    --fmt-w: calc(100vw / 3);  /* use calc(100vh * 9 / 16) se precisar de 9:16 cravado */
    --fmt-h: 100vh;
  }
  html { background: #333333; }
  /* Centraliza a coluna na horizontal via flex (não margin:auto: o Preflight
     do Tailwind injeta body{margin:0} em runtime e venceria o margin:auto).
     Fundo FORA do slide (margens laterais) em #333333; a coluna do slide fica no fundo do tema. */
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
  /* O conteúdo preenche a largura estreita da coluna (margem lateral vem do px da seção) */
  body > section .max-w-6xl,
  body > section .max-w-5xl,
  body > section .max-w-4xl,
  body > section .max-w-3xl,
  body > section .max-w-2xl { max-width: 100% !important; }
  /* Tamanho padrao do canvas de TODOS os slides: alto (128/203), esticado para baixo.
     O viewBox de cada animacao foi esticado em altura para casar (sem distorcer). */
  .anim-stage { height: auto !important; aspect-ratio: 128 / 203 !important; }
  /* VERTICAL: cada slide de conteudo = somente o titulo principal + a animacao grande.
     Subtitulo, header do card (icone/label/Replay) e a base (legenda + pilulas) ficam ocultos;
     o card perde fundo/borda/padding para a animacao ir de ponta a ponta. A animacao (SVG) nao e tocada. */
  body > section h2 { font-size: clamp(35px, 5.6vh, 52px) !important; line-height: 1.1 !important; }
  body > section:has(.glass-card) .text-center > p { display: none !important; }            /* subtitulo */
  body > section:has(.glass-card) .text-center { margin-bottom: 8px !important; padding: 0 14px !important; }
  body > section:has(.glass-card) { justify-content: flex-start !important; padding: 2.2vh 6px 1.4vh 6px !important; }
  body > section .glass-card { background: none !important; border: none !important; box-shadow: none !important; backdrop-filter: none !important; padding: 0 !important; }
  body > section .glass-card > div:first-child,                                              /* header do card */
  body > section .glass-card > div:last-child { display: none !important; }                  /* base (pilulas) */
  .slide-counter { font-size: 13px !important; }
  /* Pílulas (quando reaproveitadas em algum slide): na coluna estreita reduz colunas. */
  body > section [class*="md:grid-cols-4"] { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
  body > section [class*="md:grid-cols-2"] { grid-template-columns: 1fr !important; }
  /* Flip cards (slide tipo exemplos): empilha em coluna em vez de fileira lado a lado. */
  #st-exemplos > div { flex-direction: column !important; gap: 14px !important; }
  #st-exemplos .flip-wrap { width: 88% !important; max-width: none !important; height: 30% !important; }
</style>
```

## Edge cases (do mais comum ao menos)

- **Título longo / palavra grande** (ex.: "Contratos operacionais, não documentação para ler"): o auto-ajuste reduz a fonte até caber em 2 linhas. Título curto: fica no tamanho cheio.
- **Animação radial (relógio, radar) num canvas alto:** fica centrada e preenche a largura; a sobra vertical é inerente ao círculo. A ampliação por slide pode aumentar até o limite da largura.
- **Fluxo vertical (pipeline) que já preenche a altura:** NÃO aplicar zoom global (corta as pontas). O canvas alto já a acomoda.
- **Miolo vazio (duas pontas):** esticar o canvas para baixo e espalhar os elementos (ferramenta A).
- **Slide sem `.glass-card` (capa, encerramento, slide-régua):** as regras com `:has(.glass-card)` não se aplicam; layout próprio preservado.
- **Canvas alto excede a coluna numa tela larga:** o excedente é cortado pelo `overflow: hidden` da seção, e o corte cai na área vazia inferior do canvas, não no conteúdo. Ajuste fino por slide se necessário.
- **Navegador sem `:has()`:** a composição depende dele; avise que a gravação precisa de um Chromium moderno (Edge/Chrome atual).

## Checklist

**Os que mais falham (cheque primeiro, é para tela de smartphone):**
- [ ] Cada slide de conteúdo mostra SÓ título + animação: subtítulo, header do card e base de pílulas ocultos; card sem fundo/borda/padding.
- [ ] Nenhum título passa de 2 linhas: o IIFE de auto-ajuste está injetado e o título longo encolhe; o título fica colado no topo (`justify-content: flex-start`).
- [ ] Nenhuma animação ficou horizontal: todo eixo que corria na largura agora corre na altura; nada de blocos lado a lado.
- [ ] Canvas alto em todos os slides (`aspect-ratio: 128 / 203`) e `viewBox` esticado SÓ em altura (`H = W * 203 / 128`), sem distorção nem letterbox.
- [ ] Nenhum texto SVG renderiza abaixo de 13px (font-size SVG >= 24 no `W` padrão; escala com a largura do viewBox).

- [ ] `index.html` original intacto (byte a byte).
- [ ] `index-9x16.html` criado na mesma pasta do deck.
- [ ] Bloco `<style id="mira-formato-9x16">` canônico injetado antes de `</head>`.
- [ ] Fundo fora da coluna em #333333; cada `body > section` com largura `calc(100vw / 3)` e altura `100vh`, centralizado via flex (não `margin:auto`).
- [ ] Geometria do conteúdo de cada animação preservada (só a altura do viewBox mudou); textos, cores, easing, durações, loop interno e generation counter intactos.
- [ ] Zoom `SZ` do mira-size-animator preservado nos slides que o usam (só com a altura casada).
- [ ] Ferramentas por slide aplicadas onde fazia sentido (esticar para baixo no miolo vazio; ampliar X% onde pedido), sem cortar pontas.
- [ ] Capa e encerramento com layout próprio preservado.
- [ ] Navegação funcionando; nenhum slide corta o conteúdo na coluna vertical.
- [ ] Nenhum travessão (—); acentuação correta.
