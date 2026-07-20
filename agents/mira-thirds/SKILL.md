---
name: mira-thirds
description: >-
  Reenquadra um deck do Mira na regra dos terços, sem mudar a proporção: joga
  título + animação nos 2/3 da esquerda de um grid 3x3 e deixa a coluna da
  direita em cinza #333, limpa, para você sobrepor texto, lower-third ou câmera
  na edição. A animação é reformulada por metáfora para preencher os 2/3; não
  toca no original (cria arquivo -thirds ao lado). Aplica sobre 16:9, 1:1
  (mira-squared) ou 9:16 (mira-vertical), ou cria slides do zero; lado cinza à
  direita por padrão, com opção de inverter.
  Use SEMPRE que o usuário disser /mira-thirds, regra dos terços, rule of thirds,
  composição em terços, anima à esquerda, deixa a direita livre, coluna livre,
  dois terços à esquerda, grid 3x3, espaço para texto/câmera ao lado, abre espaço
  à direita, cria um slide em terços, ou pedir a animação encostada num lado e o
  outro terço livre em cinza.
---

# Skill: Regra dos Terços (animação preenchendo 2/3, um terço livre em cinza)

Reenquadra um deck do Mira na **regra dos terços**: divide o quadro num grid 3x3 e joga o conteúdo do slide (título + animação) para as **colunas 1 e 2** (os dois terços da esquerda), deixando a **coluna 3 (direita) inteira em cinza #333, limpa**, para você sobrepor texto, lower-third ou câmera na edição. A animação é **reformulada por metáfora para preencher os 2/3**, no padrão de qualidade do `/mira-vertical`.

```
   COL 1        COL 2        COL 3
┌──────────┬──────────┬──────────┐
│ TÍTULO   │          │          │
├──────────┼──────────┤  CINZA   │  ← #333, limpa
│ ANIMAÇÃO preenche 2/3│ (você    │     você sobrepõe
├──────────┼──────────┤  sobrepõe│     na edição
│          │          │  depois) │
└──────────┴──────────┴──────────┘
   conteúdo nas colunas 1+2      direita cinza livre
```

Tem dois modos: **conversão** (padrão quando existe deck de origem, passos abaixo) e **criação nativa** (quando não existe deck, ou o usuário pede um slide novo já em terços).

> **Fonte da verdade:** o padrão desta skill está congelado na spec `_reversa_sdd/responsividade/sdd/mira-thirds.md` (score 92) e no mockup `_reversa_sdd/responsividade/sdd/referencias/3.jpg`. Quando em dúvida sobre um valor exato, o resultado deve bater com o mockup.

## O resultado, em uma frase

Num slide de conteúdo, nos **2/3 da esquerda**: o **título no topo** (1 ou 2 linhas) e a **animação grande preenchendo o box dos 2/3** abaixo. A **coluna 3 (direita) fica cinza #333, vazia** (sem título, animação ou pílula). Somem o subtítulo, o header do card e a base de pílulas. Capa e encerramento (sem `.glass-card`) mantêm o layout próprio.

## CRITÉRIO Nº 1

A animação tem que preencher a maior parte do box dos 2/3; isso vale mais que a perfeição do reflow por metáfora. Nunca aceite a animação como faixa fina com área vazia (ou preta) em volta. Antes de entregar, cheque cada slide: se sobra muita área vazia, refaça.

## ÁREA SEGURA: 50px do BOX dos 2/3, com título E animação dentro

Todo deck desta skill leva área segura de 50px no box dos 2/3, e **a animação tem que sempre CHEGAR na margem** (fit-to-área-segura, item C), nunca parar antes dela. Validado nas imagens de referência (`_reversa_sdd/responsividade/margem_ref/`). A área segura pertence ao **box dos 2/3 de altura cheia** (o bloco do slide), NÃO ao palco da animação:

**(A) Margem de 50px das bordas do box dos 2/3, tudo dentro dela.** O bloco do slide (`body > section:has(.glass-card) > div`) cobre os 2/3 de altura cheia e leva `padding: 50px; box-sizing: border-box;` (já no bloco canônico). **Título e animação vivem DENTRO da área segura**: o título é a primeira coisa dentro dela (nunca colado na borda do quadro) e a animação preenche o resto, sem vazar para o 1/3 cinza (os 50px valem também na divisa com a coluna cinza). ERRADO: pôr os 50px como padding do `.anim-stage`, o que deixa o título fora da margem e a área segura só na animação. CERTO: a margem abraça o box dos 2/3 inteiro.

**(B) O palco ocupa o resto da área segura + viewBox casado em runtime.** No canônico, o bloco do slide, o `.glass-card` e o `.anim-stage` formam uma cadeia flex (`flex: 1 1 auto; min-height: 0`): o palco estica da base do título até a margem de baixo, na largura toda da área segura, sem `aspect-ratio` fixo. Como a altura do título varia (1 ou 2 linhas), a razão do palco não é fixa: case o `viewBox` à razão REAL do palco em runtime, no início de cada build/replay (o `H` autorado, `H = W * 1080/1280`, é só valor inicial):

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

**(C) A animação PREENCHE até a margem (fit-to-área-segura).** Não basta caber: a animação tem que ocupar todo o palco, encostando na margem sem cruzar. Envolva TODO o desenho num grupo `<g>` e, a cada quadro, escale/translade esse grupo para a bounding box dele preencher `[EDGE, W-EDGE] × [EDGE, H-EDGE]` (EDGE ≈ 14, só a folga de stroke/glow; a margem de 50px vem do padding do BLOCO dos 2/3):

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

Vale para QUALQUER metáfora (grafo, fluxo, orbital, partículas): componha livre e deixe o fit preencher. O fit substitui o antigo clamp de margem e garante preenchimento determinístico. O 1/3 cinza continua intocado (o fit escala só o conteúdo do palco, que já vive nos 2/3).

**(D) A margem é TRANSPARENTE.** A área segura é espaço vazio (o padding de 50px do bloco dos 2/3), sem nenhuma pintura: nada de faixa vermelha, moldura, borda ou CSS/JS de debug no arquivo entregue. Se precisar conferir, meça no DevTools ou pinte temporariamente e REMOVA antes de entregar. **Validação (a olho):** título e animação inteiros dentro dos 50px do box dos 2/3 (altura cheia, inclusive na divisa com o 1/3 cinza), e a animação encostando na margem. Título colado na borda do quadro ou margem só na animação = ERRADO.

## O 1/3 cinza é sagrado

Nada de título, pílula ou elemento da animação invade o terço reservado. Ele fica **cinza #333, limpo**, para sobreposição na edição (a versão antiga deixava o terço com a cor do slide).

## Criação do zero na geometria nativa

Quando não houver deck de origem, ou o usuário pedir "cria um slide em terços sobre X", NÃO crie um slide centralizado para reenquadrar depois. O slide nasce composto em terços:

1. **Herde as regras criativas do `agents/mira-animator/SKILL.md`:** Regra Zero (loop interno obrigatório), liberdade criativa de metáfora, regra de idioma, regra de título (sem ícone, máximo 6 palavras), estrutura do card com glass-card.
2. **Composição nativa:** o arquivo nasce com o bloco `<style id="mira-formato-thirds">` desta skill no head, o conteúdo autorado para viver nas colunas 1+2 e a coluna 3 em cinza #333. A animação já nasce preenchendo o box dos 2/3.
3. **Vantagem da autoria nativa:** aqui você PODE compor a animação com o assunto principal sobre a linha de força entre a COL 2 e a COL 3, que é o ponto forte da regra dos terços.

## REGRA DE IDIOMA

Siga `agents/_shared/idioma.md`. Texto visível em português correto. Proibido travessão (—): use vírgula ou dois-pontos.

## Regra de Ouro: nunca destrua o original (modo conversão)

- O deck de origem (`index.html`, `index-1x1.html` ou `index-9x16.html`) **permanece intacto**.
- Você cria um **arquivo novo** ao lado, com sufixo `-thirds`.
- O que continua **intocado** mesmo na cópia: textos, rótulos, cores, easing, durações, loop interno e o `generation counter` (`window.__slugGen`). Você reposiciona, oculta e reformula a geometria, não reescreve a animação do zero.

## Composição é ortogonal ao formato

Esta skill **não muda a proporção** do quadro: desloca o conteúdo para os 2/3 de um lado e pinta o outro terço de cinza. Por isso combina sobre qualquer formato:

- `index.html` (16:9) → `index-thirds.html`
- `index-1x1.html` (1:1) → `index-1x1-thirds.html`
- `index-9x16.html` (9:16) → `index-9x16-thirds.html`

Se o usuário não disser sobre qual arquivo aplicar, use o `index.html` (16:9). Se houver mais de um deck na pasta e ficar ambíguo, pergunte qual.

## As três viradas de chave

### 1. Conteúdo nos 2/3 + 1/3 em cinza #333

Via CSS no bloco injetado:

- **Encosta o conteúdo no lado da animação:** `body > section { align-items: var(--thirds-align) }` (`flex-start` = animação à esquerda, cinza à direita, padrão).
- **Bloco do slide = box dos 2/3 de ALTURA CHEIA com a área segura:** `body > section > div { width: 66.667%; max-width: 66.667% }`, e nos slides de conteúdo o bloco vira coluna flex de altura cheia (`flex: 1 1 auto; min-height: 0`) com `padding: 50px` (a área segura; a seção zera o padding próprio).
- **Pinta o 1/3 de cinza:** um `linear-gradient` na `section` deixa os 2/3 no fundo do tema e o 1/3 em #333, de altura cheia, independente do conteúdo. Isso garante o terço cinza sólido do mockup.

### 2. Composição enxuta nos 2/3 (só título + animação)

Escopado com `:has(.glass-card)`, como no vertical: oculta subtítulo, header e base do card e zera o chrome do `.glass-card`, para a animação preencher o box dos 2/3. Título colado no topo, auto-ajustado para no máximo 2 linhas.

### 3. Palco = todo o resto da área segura + viewBox casado em runtime + reflow

- **Palco esticado (cadeia flex):** bloco do slide, `.glass-card` e `.anim-stage` com `flex: 1 1 auto; min-height: 0` (já no canônico); o `.anim-stage` fica SEM `aspect-ratio` fixo e SEM padding, ocupando da base do título até a margem de baixo, na largura toda da área segura.
- **viewBox casando:** para cada `<svg id="sv-...">`, autore a altura inicial como **`H = W * 1080 / 1280`** (mantendo `minX`, `minY`, `W`) e case à razão real do palco em runtime com `casarPalco` (seção da ÁREA SEGURA). `preserveAspectRatio="xMidYMid meet"`; sem letterbox nem distorção. Exemplo: `viewBox="0 0 960 540"` nasce `viewBox="0 0 960 810"` e o `casarPalco` ajusta o `H` ao palco medido.
- **Reflow por metáfora** para preencher o box (CRITÉRIO Nº 1), conforme o playbook abaixo. Loop e generation counter intactos.

## Auto-ajuste de título (script injetado)

O mesmo IIFE do vertical: mede a altura real de cada `h2` e reduz a fonte 1px por vez (piso 18px) até caber em 2 linhas. Roda no `load`, `document.fonts.ready` e `resize` (debounced). Injete antes de `lucide.createIcons()`:

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

## Playbook de reflow por metáfora (alvo: box dos 2/3, quase-quadrado ~1280×1080)

Objetivo: CRITÉRIO Nº 1, preencher a maior parte do box.

**Radial / orbital / hub.** Centrado no box; aumente o raio para preencher. Elipse quase circular (o box é quase-quadrado).

**Fluxo (partícula entre nós).** Eixo pode ficar horizontal (o box é levemente mais largo que alto), sempre reescalado para ocupar; ou na diagonal quando preencher melhor. Sem faixa fina.

**Comparação A vs B / transformação.** Lado a lado se couber grande, ou empilhe; realce alternado preservado.

**Rede / grafo (force layout).** `forceCenter` no centro do box; aumente espalhamento e `forceCollide` até usar o box; clampe as posições nas margens do box.

**Flip cards (stage HTML).** Sem `viewBox`; o box dos 2/3 vale como caixa; disponha os cards para preencher.

**Princípio geral:** identifique o eixo dominante e recomponha (escala e disposição) até o assunto ocupar a maior parte do box, com o loop preservado.

## Passos

1. **Localizar o deck.** Ache o arquivo de origem (`decks/<deck>/` ou `slides/<tema>/`). Padrão: `index.html`. Se o usuário pedir terços sobre a versão quadrada/vertical, use `index-1x1.html` ou `index-9x16.html`. Se faltar, ou não tiver `.glass-card`/`.anim-stage`/`<svg id="sv-...">`, **aborte com mensagem clara** sem criar arquivo parcial.
2. **Copiar para o novo arquivo.** Copie a origem para a versão `-thirds` na mesma pasta. A origem fica byte a byte igual.
3. **Confirmar o seletor.** Padrão do Mira: `body > section`, bloco do slide é o filho direto `body > section > div`. Ajuste se este deck embrulhar diferente.
4. **Injetar a moldura.** Logo antes de `</head>`, **como último bloco de estilo** (depois do Tailwind e de qualquer bloco `mira-squared`/`mira-vertical`), insira o `<style id="mira-formato-thirds">` canônico (abaixo): conteúdo nos 2/3, 1/3 cinza #333, composição só título + animação, canvas casado ao box.
5. **Injetar o auto-ajuste de título.** Adicione o IIFE `fitTitles` no bloco de scripts, antes de `lucide.createIcons()`.
6. **Reformular cada animação no JS.** Para cada slide de conteúdo: case o `H` do `viewBox` ao box (`H = W * 1080/1280`, mantendo `minX`, `minY`, `W`) e aplique o reflow para preencher o box (playbook). Preserve textos, cores, easing, durações, loop e generation counter.
7. **Verificar o encaixe (CRITÉRIO Nº 1).** Confira: (a) conteúdo nos 2/3 da esquerda (título + animação); (b) **a animação preenche a maior parte do box dos 2/3**, sem faixa fina/preta; (c) coluna 3 cinza #333 e limpa (nem título nem pílula invadem); (d) o loop roda; (e) a proporção do quadro não mudou; (f) capa/encerramento com layout próprio.
8. **Reportar.** Informe o caminho do arquivo `-thirds`, qual coluna ficou cinza (direita por padrão) e que a proporção não mudou (grave na mesma viewport do formato de origem).

### Bloco `<style id="mira-formato-thirds">` canônico (gerar exatamente isto)

```html
<style id="mira-formato-thirds">
  /* Regra dos terços: conteúdo nos 2/3, 1/3 em cinza #333. É composição, não muda
     a proporção do quadro: aplica sobre 16:9, 1:1 ou 9:16. */
  :root {
    /* Lado da animação:
       flex-start = animação à ESQUERDA, coluna da DIREITA cinza (padrão)
       flex-end   = animação à DIREITA,  coluna da ESQUERDA cinza (troque também o gradiente) */
    --thirds-align: flex-start;
    --thirds-width: 66.667%; /* 2 de 3 colunas */
  }
  /* O 1/3 livre pintado de cinza #333 de altura cheia, via gradiente na seção.
     Padrão (cinza à direita): tema nos 2/3, #333 no 1/3 direito.
     Para cinza à esquerda: inverta os stops (#333 até 33.333%, depois o tema). */
  body > section {
    /* ALTURA DEFINIDA, não min-height. O template usa `min-h-screen` do Tailwind, que dá
       min-height; sem `height`, a cadeia flex abaixo (flex: 1 1 auto) não tem o que
       distribuir e o palco vaza para fora da tela. */
    height: 100vh !important;
    align-items: var(--thirds-align) !important;
    background:
      linear-gradient(to right,
        var(--mira-bg, #000) 0,
        var(--mira-bg, #000) 66.667%,
        #333333 66.667%,
        #333333 100%) !important;
  }
  /* O bloco do slide (título + animação) ocupa só as colunas 1+2. */
  body > section > div {
    width: var(--thirds-width) !important;
    max-width: var(--thirds-width) !important;
  }
  /* AREA SEGURA: o box dos 2/3 cobre a ALTURA CHEIA e leva 50px de margem;
     titulo e animacao vivem DENTRO (inclusive na divisa com o 1/3 cinza). */
  body > section:has(.glass-card) { padding: 0 !important; }
  body > section:has(.glass-card) > div { flex: 1 1 auto !important; min-height: 0 !important; display: flex !important; flex-direction: column !important; padding: 50px !important; box-sizing: border-box !important; }
  body > section:has(.glass-card) .glass-card { flex: 1 1 auto !important; min-height: 0 !important; display: flex !important; flex-direction: column !important; }
  /* Palco = TODO o resto da area segura (sem aspect-ratio fixo; o viewBox e casado
     em runtime pelo casarPalco). Sem padding: a margem de 50px e do BLOCO dos 2/3. */
  .anim-stage { flex: 1 1 auto !important; min-height: 0 !important; height: auto !important; width: 100% !important; aspect-ratio: auto !important; max-width: none !important; margin-inline: 0 !important; padding: 0 !important; box-sizing: border-box !important; }
  /* Composição enxuta nos 2/3: só título + animação (escopo: slides com .glass-card). */
  body > section h2 { font-size: clamp(28px, 4vh, 44px) !important; line-height: 1.1 !important; }
  body > section:has(.glass-card) .text-center > p { display: none !important; }            /* subtitulo */
  body > section:has(.glass-card) .text-center { margin: 0 0 14px 0 !important; padding: 0 !important; flex: 0 0 auto !important; }
  body > section .glass-card { background: none !important; border: none !important; box-shadow: none !important; backdrop-filter: none !important; padding: 0 !important; }
  body > section .glass-card > div:first-child,                                              /* header do card */
  body > section .glass-card > div:last-child { display: none !important; }                  /* base (pilulas) */
</style>
```

**Lado livre (padrão: direita).** A coluna cinza é a da direita por padrão (`--thirds-align: flex-start`, animação à esquerda). Se o usuário pedir cinza à esquerda e animação à direita, troque `--thirds-align: flex-end` **e** inverta os stops do gradiente (`#333` até 33.333%, depois o tema).

## Observações honestas

- A skill mexe só no enquadramento e na geometria da animação (para preencher o box). Ela **não** escreve nada na coluna cinza: fica limpa de propósito para você compor por cima na edição.
- Os elementos fixos de navegação (barra de progresso, botão de próximo) seguem presos à viewport, como nos outros formatos. Gravando na resolução do formato de origem, ficam no lugar certo.

## Edge cases

- **Elemento do slide invadindo o 1/3 cinza:** estreite o bloco daquele slide (`body > section:nth-of-type(N) > div { max-width: 60% !important }`); a coluna cinza permanece limpa.
- **Animação radial:** centrada no box dos 2/3; preenche bem (o box é quase-quadrado).
- **Animação de fluxo:** reescale para o box; pode manter horizontal (box levemente largo); sem faixa fina.
- **Terços sobre 1:1 ou 9:16:** aplique sobre essa origem; case o `aspect-ratio` do palco e o `viewBox` a "2/3 da largura do quadro por altura cheia" daquele formato.
- **Slide sem `.glass-card` (capa, encerramento):** as regras `:has(.glass-card)` não se aplicam; layout próprio preservado.
- **Navegador sem `:has()`:** avise que a composição precisa de um Chromium moderno.

## Checklist

**Os que mais falham (cheque primeiro):**
- [ ] **CRITÉRIO Nº 1: a animação preenche a maior parte do box dos 2/3** (nada de faixa fina/preta com sobra).
- [ ] Coluna 3 (direita) em **cinza #333, 100% limpa**: nenhum título/animação/pílula invade.
- [ ] Conteúdo nos 2/3 da esquerda: só título + animação (subtítulo, header e base ocultos).
- [ ] **ÁREA SEGURA no BOX dos 2/3: título E animação dentro da margem de 50px, e a animação CHEGANDO na margem.** A margem é transparente: nenhum CSS/JS de debug (faixa vermelha) no arquivo entregue.
- [ ] Palco esticado (cadeia flex, sem `aspect-ratio` fixo) e `viewBox` casado em runtime (`casarPalco`), sem distorção nem letterbox.
- [ ] Nenhum título passa de 2 linhas (IIFE de auto-ajuste injetado).

- [ ] Arquivo de origem intacto (byte a byte).
- [ ] Novo arquivo `-thirds` criado na mesma pasta.
- [ ] Bloco `<style id="mira-formato-thirds">` injetado como último estilo antes de `</head>`.
- [ ] Proporção do quadro preservada (a skill não muda 16:9, 1:1 nem 9:16).
- [ ] Textos, cores, easing, durações, loop interno e generation counter intactos.
- [ ] Capa e encerramento com layout próprio preservado.
- [ ] Nenhum travessão (—); acentuação correta.
