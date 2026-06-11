---
name: mira-vertical
description: Gera uma versão VERTICAL (9:16, generalista para a tela atual: largura da tela dividida por 3 por altura cheia, ex. 640x1080 numa tela 1080p) de um deck do Mira, a partir do deck 16:9 original, para vídeo vertical (Reels, Shorts, TikTok, Stories). Não toca no arquivo original: cria um novo arquivo index-9x16.html ao lado. Em vez de só encolher a animação para caber, REFORMULA a geometria de cada slide para o retrato: deixa o palco alto, reescreve o viewBox do SVG para vertical e reposiciona os elementos da animação (fluxo horizontal vira topo para base, elipse larga vira alta, comparação lado a lado vira empilhada) para aproveitar toda a altura do quadro. Texto, cores, timings e loop ficam intactos, só posição e eixo mudam. Use SEMPRE que o usuário disser "/mira-vertical", "versão vertical", "deixa vertical", "formato 9:16", "1080x1920", "apresentação vertical", "para Reels", "para Shorts", "para Stories", "para TikTok", "vídeo vertical", "modo retrato", ou pedir o deck num formato vertical.

---

# Skill: Versão Vertical do Deck (9:16, coluna de 1/3 da largura da tela) com reflow da animação

Transforma um deck 16:9 do Mira numa versão **vertical generalista para a tela atual**, para gravar como vídeo vertical.

**Dimensão (leia primeiro, é o erro mais comum).** O quadro vertical é **generalista para a tela atual**, não um tamanho fixo em pixels. A **altura é a altura cheia da tela** (`100vh`) e a **largura é a largura da tela dividida por 3** (`calc(100vw / 3)`). Numa tela 1080p isso dá 640x1080; numa tela maior ou menor, escala junto. O quadro vertical é a **coluna central** (um terço da largura) ocupando toda a altura, com sobra dos dois lados como margem. Por que não 1080x1920 fixo: além de não caber numa tela de 1080 de altura, prenderia o resultado a uma única resolução. (A regra largura/3 dá uma coluna um tiquinho mais larga que o 9:16 cravado. Se a plataforma exigir 9:16 exato, use `--fmt-w: calc(100vh * 9 / 16)`.)

A abordagem **não é** moldura fixa que só encolhe: é **reformulação por slide**. Um `viewBox` 16:9 dentro de um quadro estreito e alto encaixa pela largura e ocupa só uma faixa fina, perdendo todo o impacto. Por isso aqui o palco vira **retrato** e a geometria de cada animação é **reescrita no JS da cópia** para subir e descer pela altura: o assunto da animação passa a ocupar de 80 a 90% da altura do palco, centralizado, com margens mínimas.

## RESULTADO OBRIGATÓRIO (é o ponto desta skill, leia)

Estes 9:16 são para assistir no **smartphone**: a animação precisa ser **maximizada**, ocupando quase todo o palco, na altura e na largura. Reflow profundo não é enfeite, é a razão da skill existir. Encolher a animação 16:9 para caber numa faixa fina é o ERRO clássico. Na dúvida entre menor e maior, escolha **maior**: margens mínimas (cerca de 8% por lado) e nada de área vazia.

Três falhas estão **proibidas** (são exatamente o que sai errado num reflow raso):

1. **Horizontal que continuou horizontal.** Se, na versão vertical, o eixo dominante ainda corre da esquerda para a direita (dois blocos lado a lado, partícula andando na horizontal, rede espalhada na largura), está ERRADO. **Toda animação horizontal DEVE ser refeita na vertical:** o que ia para o lado passa a ir de cima para baixo; o que estava lado a lado passa a ficar empilhado (um em cima, outro embaixo). Não existe "deixa horizontal e diminui".

2. **Animação pequena com palco vazio.** Se sobrar faixa preta grande em cima e/ou embaixo da animação, está ERRADO. O assunto tem que ocupar **80 a 90% da ALTURA** do palco e usar bem a **largura** (elementos e rótulos espalhados até perto das bordas laterais, com margem pequena). Aumentar o `viewBox` não basta: **toda escala, raio, `range`, `domain` e espaçamento derivado das dimensões antigas tem que ser recalculado contra a altura nova.** Espalhe os elementos ao longo de quase toda a altura (ex.: `range([H*0.10, H*0.90])`) e cresça os tamanhos (raios, passos, distâncias) na mesma proporção.

3. **Animação cortada ou sobreposta.** Se algum elemento sai pela borda (cortado no topo ou na base) ou os rótulos se encavalam, está ERRADO. Todo elemento fica dentro de `[margem, H - margem]` e os rótulos não colidem (em retrato, jogue o rótulo para o lado do nó, nunca embaixo do nó de baixo).

Antes de entregar, olhe o resultado e responda: **a animação está maximizada, vertical, centralizada e inteira, ocupando 80 a 90% da altura e quase toda a largura útil do palco?** Se a resposta for não, refaça. Esse é o critério de aprovação.

## REGRA DE IDIOMA

Siga `agents/_shared/idioma.md`. Texto visível em português correto. Proibido travessão (—): use vírgula ou dois-pontos.

## REGRA DE FONTE MÍNIMA: 13px RENDERIZADOS (IMPERATIVO, INEGOCIÁVEL)

Validado empiricamente pelo usuário (teste de legibilidade em 2026-06-11): abaixo de 13px renderizados na tela, o texto fica ilegível no vertical. **Nenhum texto visível pode renderizar com menos de 13px.** Sem exceção: rótulos de nós, legendas de eixo, pílulas, subtítulos, tudo.

- **Texto HTML:** `font-size` computado >= 13px. No Tailwind, `text-xs` (12px) está **PROIBIDO**; o menor permitido é `text-sm` (14px).
- **Texto SVG (a pegadinha):** o `font-size` no SVG é em unidades do viewBox, não pixels de tela. No setup padrão desta skill (palco 4:5 na coluna de 1/3 da tela, `viewBox` com `H = 1200`), o mínimo validado empiricamente pelo usuário (teste lado a lado em 2026-06-11, `decks/teste-fonte-svg/`) é **`font-size >= 24`** (24 unidades renderizam ~12,9px na tela). Um `font-size: 13` no SVG renderiza ~8px e VIOLA a regra. Se o `viewBox` de um slide tiver outra altura, escale o mínimo na proporção: `font-size_minimo = 24 * H_viewBox / 1200`.
- **Se o texto não couber com 13px:** encurte o texto ou recomponha o layout (grade, serpentina, rótulo ao lado). **Nunca** resolva diminuindo a fonte abaixo do mínimo.

## Regra de Ouro: nunca destrua o original

- O deck 16:9 (`index.html`) **permanece intacto**. Você nunca edita o arquivo de origem.
- Você cria um **arquivo novo** ao lado: `index-9x16.html`, e é nele que todo o reflow acontece.
- O que você pode mudar na cópia: **geometria e layout** (viewBox, coordenadas, eixo de espalhamento, posição do título e das pílulas, palco retrato).
- O que continua **intocado** mesmo na cópia: textos, rótulos, cores, easing, durações, a lógica do loop interno e o `generation counter` (`window.__slugGen`) que evita vazamento. Você reposiciona, não reescreve a animação do zero.

## Como o Mira monta um slide (o que você vai reformular)

- Cada slide é um `body > section` com `class="min-h-screen flex flex-col items-center justify-center ..."`: centraliza o conteúdo.
- O bloco do slide é o filho direto da `section`: `<div class="... max-w-6xl/max-w-5xl">`, com título, `glass-card` (header, `.anim-stage`, pílulas) dentro.
- O palco `.anim-stage` é `aspect-ratio: 16/9` (base.css). Dentro dele há um `<svg>` que preenche 100% x 100%, com `preserveAspectRatio="xMidYMid meet"`.
- O `viewBox` da animação é definido **no JS** de cada slide, num bloco IIFE, normalmente como `const W = 960, H = 540; ... .attr('viewBox', \`0 0 ${W} ${H}\`)` (às vezes `1280 720`). As coordenadas (`cx = W/2`, `cy = H/2`, escalas, raios) derivam de `W` e `H`.
- Alguns slides já trazem um zoom de tamanho do `mira-size-animator`: o `viewBox` vira `${(W - W/SZ)/2} ${(H - H/SZ)/2} ${W/SZ} ${H/SZ}` com uma constante `SZ`. Preserve essa fórmula: ela é o nível de tamanho do slide.
- A navegação (barra de progresso no topo, botão de próximo, teclado) é fixa e continua funcionando.

## A virada de chave: viewBox retrato

A reformulação inteira gira em torno de uma regra simples e mecânica:

1. **Palco retrato.** No bloco de estilo injetado, troque o `.anim-stage` de 16:9 para retrato. Como a altura do quadro é a da tela e o título e as pílulas também comem altura, o padrão é `aspect-ratio: 4 / 5`. Numa tela 1080p o card fica com cerca de 580px de largura e o palco com cerca de 725px de altura (cerca de 67% da altura), deixando espaço para título e pílulas; em outras telas, escala junto. Sem letterbox.
2. **viewBox retrato casando com o palco.** No JS de cada animação, deixe o `viewBox` na mesma proporção do palco (4:5). Na prática, **aumente a altura**: de `W = 960, H = 540` para `W = 960, H = 1200` (proporção 4:5). Como `cx = W/2` e `cy = H/2` derivam de `W` e `H`, o centro se reposiciona sozinho. Esses são valores do `viewBox` (unidades do SVG), independentes da resolução da tela.
3. **Gire o eixo E cresça a escala (as duas coisas, sempre).** Aqui mora o impacto, e é o passo que mais falha:
   - **Girar o eixo.** Identifique o eixo dominante (onde os elementos se espalham). Se é horizontal, vira vertical: o `range` que ia `[120, W-120]` no X passa a `[H*0.10, H*0.90]` no Y, com o X fixo em `cx`. Lado a lado vira empilhado.
   - **Crescer para preencher.** Recalcule TODA medida derivada das dimensões antigas contra o `H` novo (≈ 2,2× maior): raios, `stepH`, distâncias de força, comprimento de linha, raio orbital, fontes dos rótulos (respeitando a REGRA DE FONTE MÍNIMA: 13px renderizados). Só trocar `H` de 540 para 1200 sem crescer as escalas deixa a animação minúscula no topo, com o resto do palco preto. Isso é falha.
   - **Quando girar não basta, recomponha.** Girar o eixo é a ferramenta mais comum, não o objetivo: o objetivo é **aproveitar o espaço do palco**. Se depois do giro ainda sobrar área vazia (ou se empilhar tudo numa coluna ficar espremido e ilegível), reorganize a disposição dos elementos para o retrato: uma fileira de muitos itens vira grade de 2 colunas, satélites se redistribuem ao redor de um núcleo maior, o objeto principal cresce e os secundários se reacomodam. A composição pode mudar; o critério é o palco bem aproveitado.

Sem o passo 3 completo (girar **e** crescer), os elementos ficam apertados numa faixa, com a metade de cima e de baixo do palco vazias. O passo 3 é o que faz a animação **preencher a vertical**.

## Playbook de reflow por metáfora

Aplique conforme a metáfora do slide. O princípio geral está no fim, para metáforas fora desta lista.

**Fluxo (partícula viajando entre nós).** Hoje é horizontal: `xs = scalePoint().range([120, W-120])`, partícula anima `cx`. Reflow para vertical:
- `const ys = d3.scalePoint().domain(d3.range(ETAPAS.length)).range([H * 0.10, H * 0.90]);` e `const cx = W / 2;` fixo.
- Linha vertical: `x1 = x2 = cx`, `y1 = ys(0)`, `y2 = ys(last)`.
- Nós: `translate(${cx}, ${ys(i)})`.
- Rótulo do nó: em vez de `dy: 92` (embaixo), jogue para o lado: `attr('dx', 70).attr('text-anchor', 'start')`, para o texto não colidir com o nó de baixo.
- Partícula: anima `cy` de `ys(0)` até `ys(last)`, com `cx` fixo.
- Pulsos e timings dos nós: iguais.

**Orbital (núcleo central + satélites).** Hoje é elipse larga: `rx = R, ry = R*0.62`, satélites em `cos*R, sin*R*0.62`. Reflow para elipse alta:
- Troque a compressão: `rx = R * 0.62, ry = R`.
- Satélites: `translate(${cx + Math.cos(d.angle) * R * 0.62}, ${cy + Math.sin(d.angle) * R})`.
- Aumente `R` para preencher a altura nova (ex.: de 190 para um valor que use a maior parte de `H`). Núcleo e pulso radial ficam no centro, sem mudança.

**Escada (orbe subindo degraus).** Hoje sobe na diagonal com `stepW = 170, stepH = 80`. No retrato sobra altura e falta largura: deixe a subida mais íngreme. Reduza o avanço horizontal (`stepW` menor), aumente a subida (`stepH` maior) e recalcule `baseX`/`baseY` para a escada caber e subir do rodapé até perto do topo do palco alto. O orbe continua com o mesmo `climb()` e o mesmo `easeBounceOut`.

**Comparação A vs B (dois cards lado a lado).** Isso é layout HTML, não SVG. Lado a lado num quadro estreito fica espremido. Reflow: empilhe A em cima e B embaixo. Troque o `grid md:grid-cols-2` por uma coluna só (remova o `md:grid-cols-2`, ou force `grid-template-columns: 1fr`), mantendo o realce alternado (spotlight) e, se houver partícula viajando de A para B, faça-a ir de cima para baixo.

**Transformação A → B lado a lado (planta → obra, antes → depois, entrada → saída).** Dois objetos (SVG ou HTML) um ao lado do outro, com seta ou partícula de A para B. Em retrato, lado a lado fica minúsculo e sobra altura embaixo. Reflow: **empilhe A em cima e B embaixo**, cada um grande (cada metade usa quase toda a largura da coluna e 40 a 45% da altura), e a seta/partícula de transformação **desce** de A para B. Nunca deixe os dois lado a lado encolhidos no topo.

**Rede / grafo / nuvem de nós (force layout, "conhecimento acumulado", nós espalhados).** Costuma usar `d3.forceSimulation` com `forceCenter` e nós espalhados na largura. Em retrato, se o centro e as forças não mudam, os nós ficam amontoados, cortados no topo e sobrepostos. Reflow: **recentralize** com `forceCenter(W/2, H/2)` usando o `H` novo; **aumente o espalhamento** (mais `forceManyBody().strength` negativo e/ou maior `linkDistance`/raio do `forceRadial`) até a nuvem usar 80 a 90% da altura e quase toda a largura útil; **adicione/cresça `forceCollide`** com o raio dos nós para nada se sobrepor; e clampe as posições em `[margem, H - margem]` para nenhum nó vazar a borda. Na prática:

```js
const MARGEM = 90;
sim.force('center', d3.forceCenter(W / 2, H / 2))            // centro no H NOVO (1200), não no antigo
   .force('charge', d3.forceManyBody().strength(-340))       // mais repulsão que no 16:9, para espalhar na altura
   .force('collide', d3.forceCollide(d => d.r + 8))          // nada sobreposto
   .on('tick', () => {
     nodes.forEach(n => {                                    // nenhum nó vaza a borda
       n.x = Math.max(MARGEM, Math.min(W - MARGEM, n.x));
       n.y = Math.max(MARGEM, Math.min(H - MARGEM, n.y));
     });
     /* ...atualização de posições existente... */
   });
```

**Capa (partículas no fundo, tela cheia).** Costuma usar `W = innerWidth, H = innerHeight`: já preenche o retrato sozinho. Não precisa de reflow, no máximo confira que cobre o quadro.

**Flip cards / battle arena (tipos B e C do mira-animator).** Em retrato, empilhe os cards numa coluna única e deixe a cascata de reveal correr de cima para baixo, em vez de da esquerda para a direita.

**Fileira de muitos itens (timeline, ícones em linha, 6+ etapas).** Girar para uma coluna única pode espremer os itens até ficarem ilegíveis. Nesse caso não é só virar: **recomponha em grade de 2 colunas** (ou em serpentina: desce por uma coluna, sobe pela outra), com itens grandes, ocupando 80 a 90% da altura e quase toda a largura útil. A ordem de leitura e a sequência da animação seguem a nova disposição.

**Princípio geral (metáfora fora da lista), OBRIGATÓRIO:** identifique o **eixo dominante** da animação, onde os elementos se espalham. Se for horizontal, **gire 90 graus** para vertical (sempre, não é opcional). Se for radial e achatado, inverta a compressão (de `ry` menor para `rx` menor). Em todos os casos, **cresça a escala e recomponha o que for preciso** até o assunto ocupar 80 a 90% da **altura** e quase toda a largura útil, centralizado, com o loop interno preservado. A meta não é "girar", é **maximizar o aproveitamento do palco**: girar é o caminho mais comum para isso. Se ao terminar a animação não estiver maximizada e vertical, o reflow não foi feito: refaça.

## Passos

1. **Localizar o deck.** Ache o `index.html` do deck (em `decks/<deck>/` ou `slides/<tema>/`). Se houver mais de um deck e o usuário não disser qual, pergunte.
2. **Copiar para o novo arquivo.** Copie `index.html` para `index-9x16.html` na mesma pasta (mesma pasta = os caminhos relativos de logo, vídeo e imagens continuam válidos).
3. **Injetar a moldura retrato.** Logo antes de `</head>` do `index-9x16.html`, como último bloco de estilo (depois do Tailwind, para vencer a especificidade), insira:

```html
<style id="mira-formato-9x16">
  /* Versão vertical generalista para a tela atual (reflow da animação).
     Largura = largura da tela / 3. Altura = altura cheia da tela.
     Numa tela 1080p isso dá 640x1080; escala em qualquer resolução. */
  :root {
    --fmt-w: calc(100vw / 3);  /* use calc(100vh * 9 / 16) se precisar de 9:16 cravado */
    --fmt-h: 100vh;
  }
  html { background: var(--mira-bg, #000); }
  /* Centraliza a coluna na horizontal via flex.
     Não usar margin:auto na body: o Preflight do Tailwind (Play CDN) injeta
     body{margin:0} em runtime e venceria o margin:auto, prendendo o slide à esquerda. */
  body {
    background: var(--mira-bg, #000);
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  body > section {
    width: var(--fmt-w) !important;
    height: var(--fmt-h) !important;
    min-height: var(--fmt-h) !important;
    overflow: hidden;
  }
  /* O conteúdo preenche a largura estreita da coluna (a margem lateral vem do px-6 da seção) */
  body > section .max-w-6xl,
  body > section .max-w-5xl,
  body > section .max-w-4xl { max-width: 100% !important; }
  /* PALCO RETRATO: a animação deixa de ser faixa 16:9 e vira retrato.
     O viewBox do SVG é reescrito no JS para casar com esta proporção. */
  .anim-stage {
    aspect-ratio: 4 / 5 !important;
    height: auto !important;   /* anula height fixo por slide (clamp) para a proporção 4:5 mandar no tamanho do palco */
    width: 100% !important;
  }
</style>
```

4. **Reescrever a geometria de cada animação.** Para cada bloco de animação no JS do `index-9x16.html`, aplique a virada de chave (viewBox retrato) e o reflow do eixo conforme o playbook. Preserve textos, cores, easing, durações, loop e `generation counter`. Se o slide usa o zoom `SZ` do `mira-size-animator`, mantenha a fórmula do `viewBox`, só com as dimensões retrato.
5. **Reflow da composição do slide.** Garanta que o título fica no topo, o palco retrato grande no meio e as pílulas/legenda empilhadas embaixo, tudo dentro da **altura da tela** (`100vh`; a altura é apertada, título e pílulas precisam ser enxutos). Comparações lado a lado viram empilhadas (uma coluna).
6. **Verificar o encaixe.** Confira mentalmente que, na coluna vertical (um terço da largura da tela, altura cheia): (a) título + palco + pílulas cabem sem cortar na altura; (b) a animação preenche 80 a 90% da altura do palco e quase toda a largura útil, sem faixa vazia em cima e embaixo; (c) o conteúdo cabe na largura estreita da coluna sem estourar lateralmente; (d) o eixo da animação está vertical (nada de partícula correndo numa faixa fina no meio); (e) o loop interno ainda roda. Se um slide estourar a altura, reduza o palco dele com `body > section:nth-of-type(N) .anim-stage { aspect-ratio: 1 / 1 !important; }` e ajuste o `H` do viewBox daquele slide para casar.
7. **Reportar.** Informe o caminho `index-9x16.html`, que o quadro é **generalista para a tela** (largura da tela / 3 por altura cheia; numa tela 1080p, 640x1080), o que foi reformulado em cada slide (em uma linha por slide: "fluxo agora vertical", "orbital em elipse alta", etc.) e como gravar: abra em tela cheia e recorte a **coluna central** (largura = um terço da largura da tela, altura cheia) na ferramenta de captura (OBS, device toolbar, Puppeteer). Para entregar numa largura específica, escale a coluna uniformemente.

## Observações honestas

- Reflow profundo muda a animação **de propósito**: um fluxo que ia da esquerda para a direita passa a descer pela tela. A coreografia de entrada e o loop são os mesmos, mas o caminho gira. Isso é o esperado, é o que dá impacto no vertical.
- Os elementos fixos da navegação (barra de progresso, botão de próximo) ficam presos à viewport, ocupando a largura cheia da tela, não da coluna. Como a coluna fica centralizada, eles continuam visíveis dentro dela; ao recortar a coluna central na captura, ficam no lugar. É cosmético da pré-visualização em tela cheia.
- O `viewBox` retrato casa com o palco 4:5, então não sobra letterbox dentro do palco. A sobra de respiro fica acima do título e abaixo das pílulas, que é o enquadramento natural do vertical.
- A largura é a largura da tela dividida por 3 (a regra que o usuário pediu). Ela fica um pouco mais larga que o 9:16 cravado. Se a plataforma exigir 9:16 exato, troque `--fmt-w` para `calc(100vh * 9 / 16)`; o resto do reflow não muda.
- Esta skill mexe na **proporção e na geometria**. Se o usuário quiser só o reenquadramento de composição (regra dos terços) por cima do vertical, isso é o `mira-thirds`, aplicado sobre o `index-9x16.html`.

## Checklist

**Os que mais falham (cheque primeiro, são para tela de smartphone):**
- [ ] Nenhum texto renderiza abaixo de 13px: HTML sem `text-xs`, SVG com `font-size >= 24` no viewBox padrão H=1200 (outro H: `24 * H_viewBox / 1200`).
- [ ] Nenhuma animação ficou horizontal: todo eixo que corria na largura agora corre na altura; nada de blocos lado a lado encolhidos.
- [ ] A animação está MAXIMIZADA: ocupa 80 a 90% da ALTURA do palco e quase toda a largura útil, sem faixa preta em cima ou embaixo (escalas, raios e forças crescidos contra o H novo, não só o viewBox).
- [ ] Nada cortado nem sobreposto: todo elemento dentro de `[margem, H - margem]`, rótulos sem colisão.

- [ ] `index.html` original intacto.
- [ ] `index-9x16.html` criado na mesma pasta do deck.
- [ ] Bloco `<style id="mira-formato-9x16">` injetado antes de `</head>`, com `.anim-stage { aspect-ratio: 4 / 5 }`.
- [ ] Cada `body > section` com largura `calc(100vw / 3)` e altura `100vh` (generalista para a tela; numa tela 1080p, 640x1080), conteúdo centralizado via flex (não `margin:auto`).
- [ ] viewBox de cada animação reescrito para retrato (altura aumentada, ex.: H de 540 para 1200).
- [ ] Eixo de espalhamento de cada animação reformulado (horizontal virou vertical; elipse larga virou alta; comparação lado a lado virou empilhada; fileira longa virou grade, se coluna única espremia).
- [ ] Animação preenche 80 a 90% da altura, centralizada, sem faixa vazia.
- [ ] Textos, cores, easing, durações, loop interno e generation counter preservados.
- [ ] Zoom `SZ` do mira-size-animator preservado nos slides que o usam.
- [ ] Navegação funcionando; nenhum slide corta conteúdo na coluna vertical (1/3 da largura da tela, altura cheia).
- [ ] Nenhum travessão (—); acentuação correta.
