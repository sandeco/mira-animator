---
name: mira-animated-typing
description: >-
  Gera a cena "prompt digitado em zoom": simula uma pessoa digitando um comando de agent harness
  (Claude Code, Codex) em fonte mono de terminal gigante sobre fundo escuro, cursor piscando estilo
  Windows, com janela deslizante quando o texto passa da tela. Aceita cor por trecho (color=#HEX),
  quebra de linha (/n) e print do texto como entrada. Zero dependências, roda por file://. Use SEMPRE
  que o usuário disser "/mira-animated-typing", "texto digitado em zoom", "animação de
  digitação", "simular digitando um comando", "prompt gigante sendo digitado", "efeito typing",
  "comando sendo escrito na tela", ou pedir uma cena de comando de agente digitado em tela cheia.
---

# Skill: Texto de Comando Digitado em Zoom

Slide autocontido que encena a digitação de um comando de agent harness em **zoom**. Spec completa em `_reversa_sdd/animated-typing/mira-animated-typing-spec.md`.

## REGRA DE IDIOMA

Siga `agents/_shared/idioma.md`. Todo texto visível em português brasileiro com acentuação correta. Proibido travessão (—): use vírgula ou dois-pontos.

## Sintaxe de invocação

```
/mira-animated-typing <color=#abb2f0>/mira-vertical</color> crie uma versão vertical do deck index.html
```

- O argumento é o **texto a digitar**, na ordem exata.
- Trechos envoltos em `<color=#HEX>...</color>` renderizam naquela cor (qualquer cor hex). A tag em si **nunca** aparece.
- Texto fora de tag renderiza em **branco** (`#FFFFFF`).
- `/n` no texto é **quebra de linha simulada** (o "Enter"): a linha atual sobe, o cursor volta ao início e a digitação continua na linha de baixo. O marcador nunca aparece; espaços imediatamente antes e depois dele são consumidos.
- `/p<ms>` no texto é **micro pausa**: a digitação para por aquele tempo em milissegundos naquele ponto exato (entre palavras ou entre linhas) e retoma sozinha, com o cursor aceso. Ex.: `um comando /p400 e o deck nasce`. O marcador nunca aparece; ele e os espaços colados a ele colapsam num único espaço (em borda de linha, somem).
- **Modo esperar Enter** (opt-in): quando o usuário pedir que a digitação comece só depois de um Enter ("começa quando eu der enter", "espera o enter"), gere com `WAIT_FOR_ENTER = true`: o cursor pisca **indefinidamente** até a pessoa pressionar Enter no teclado; a partir daí digita **uma vez até o fim e para** (sem loop), terminando com o cursor piscando.
- Sem argumento: pergunte qual texto digitar antes de gerar.

### Entrada por print (imagem)

Quando o usuário fornecer um **print do texto** em vez de (ou além de) texto no argumento, monte o texto a partir da imagem:

1. **Texto literal**: transcreva exatamente o que está escrito, com acentuação e pontuação.
2. **Quebras de linha**: cada linha visual da imagem vira uma quebra `/n`.
3. **Cores**: identifique a cor de cada palavra/trecho e mapeie para o hex mais próximo (trecho na cor padrão branca dispensa tag; os demais ganham `color=#HEX`).
4. Na dúvida (caractere ilegível, cor ambígua), **confirme a transcrição com o usuário** antes de gerar.

### Validação do argumento (na geração)

1. Divida o texto pelos `/n` em **linhas**; dentro de cada linha, parseie os segmentos `{ text, color }` na ordem. Espaços entre segmentos fazem parte do texto e são preservados (exceto os colados ao `/n`).
2. Tag sem fechamento: feche implicitamente no fim do texto e **avise** o usuário.
3. Cor que não é hex CSS válido: ignore a tag (trecho fica branco) e **avise**.
4. Tags aninhadas: **recuse** e peça o texto sem aninhamento.
5. `/n` dentro de uma tag de cor: a cor não atravessa a quebra; feche o segmento na quebra e reabra na linha seguinte com a mesma cor.
6. `/p` sem número (ou com valor não numérico): trate como texto literal e **avise** o usuário.

## Saída

- **Padrão:** deck novo em `decks/<slug>/index.html` (slug curto derivado do comando digitado, ex.: `zoom-text-mira-vertical`). A raiz do deck contém **somente** `index.html`, conforme a diretiva de estrutura do projeto.
- **Inserção em deck existente** (só quando o usuário pedir): a cena entra como `<section>` nova no padrão do deck alvo, com o início da animação disparado por IntersectionObserver (mesmo padrão dos triggers do deck).

## Anatomia da cena (regras não-negociáveis)

| Item | Regra |
|---|---|
| Fundo | `#212121`, tela inteira, sem nenhum outro elemento |
| Linha | `white-space: pre`, sem quebra automática, começando a ~60px da esquerda. A **linha ativa** fica sempre centralizada verticalmente |
| Fonte | stack de terminal: `'Cascadia Mono', 'Consolas', 'Ubuntu Mono', 'DejaVu Sans Mono', 'Liberation Mono', monospace` |
| Tamanho | gigante: `clamp(48px, 7.5vw, 160px)` |
| Cursor | barra vertical fina (~0.09em de largura, altura da linha). **Aceso fixo enquanto digita, piscando quando parado** (antes de começar e ao terminar), fase de ~530ms via `steps()` (período total ~1.06s), como o caret do Windows. Antes de começar a digitar, o cursor pisca **2 vezes completas** (2.12s) |
| Cadência | intervalo aleatório entre **100ms e 230ms** por caractere (ritmo humano, nunca metrônomo) |
| Janela deslizante | limiar = `larguraViewport - 100px`. Antes do limiar o texto cresce da esquerda; depois, `translateX` negativo no contêiner `.zoom-pan` mantém a borda direita do cursor **exatamente a 100px** da borda direita. O deslocamento é uma **câmera global**: todas as linhas deslocam juntas (a de cima pode quase sumir pela esquerda) |
| Micro pausa (`/p<ms>`) | a digitação congela pelo tempo indicado, com o cursor **aceso** (não pisca), e retoma sozinha. Vira um token `{ pause: ms }` entre os segmentos da linha |
| Quebra de linha (`/n`) | pausa de ~350ms (o "Enter"), o bloco sobe suave (~260ms) recentralizando a nova linha ativa, e a **câmera volta ao início** (`translateX(0)` no `.zoom-pan`, ~260ms): o começo de todas as linhas reaparece e a linha nova digita embaixo, alinhada à esquerda com a primeira palavra da linha anterior |
| Foco na linha ativa | linhas já concluídas (acima) caem para **`opacity: 0.5`** (transição de 260ms); a linha ativa fica em opacidade cheia |
| Suavidade | deslocamentos só por `transform` (nunca `left`/`margin`/`top`): `translateX` no `.zoom-pan` (90ms linear digitando, 260ms ease na volta do "Enter"), `translateY` no `.zoom-block` (260ms ease) |
| Loop | ao terminar: cursor piscando por ~2.6s, limpa e **recomeça do zero** (animação nunca fica morta). **Exceção:** no modo esperar Enter não há loop |
| Modo esperar Enter | `WAIT_FOR_ENTER = true`: cursor piscando indefinidamente até a tecla Enter; digita uma única vez até o fim e permanece com o cursor piscando (o cursor piscando é o loop interno da cena). Enter durante a digitação é ignorado |
| Reveal (zoom out) | só no modo esperar Enter: um **segundo Enter** após o fim dispara o zoom out, o bloco inteiro escala para caber em ~90% do viewport e fica **centralizado** na tela (horizontal e vertical), com todas as linhas em opacidade cheia e as linhas mantendo o alinhamento à esquerda entre si. Transição de ~700ms ease. Enter seguinte é ignorado |
| Reduced motion | `prefers-reduced-motion`: todas as linhas completas, já no estado final de deslocamento, cursor aceso sem piscar |
| Medição | posição do cursor por **geometria de layout** (`offsetLeft`/`offsetTop`), nunca `getBoundingClientRect` (o rect inclui o transform em trânsito e causa drift na ancoragem) |
| Resize | listener de `resize` reancora horizontal e vertical |

## Skeleton (fonte da verdade)

Gere o `index.html` a partir deste skeleton, trocando apenas `LINES` (e o `<title>`, que é o texto sem tags e sem `/n`):

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>TEXTO SEM TAGS AQUI</title>
<style>
  html, body { margin: 0; height: 100%; background: #212121; overflow: hidden; }
  .zoom-stage { position: fixed; inset: 0; overflow: hidden; }
  .zoom-block {
    position: absolute; top: 50%; left: 0; right: 0;
    will-change: transform;
    transition: transform 260ms ease;
  }
  .zoom-pan {
    will-change: transform;
    transition: transform 90ms linear;
  }
  .zoom-line {
    white-space: pre;
    font-family: 'Cascadia Mono', 'Consolas', 'Ubuntu Mono', 'DejaVu Sans Mono', 'Liberation Mono', monospace;
    font-size: clamp(48px, 7.5vw, 160px);
    line-height: 1.2;
    min-height: 1.2em;                         /* linha vazia (dois /n seguidos) mantém a altura */
    color: #fff;
    padding-left: 60px;
    transition: opacity 260ms ease;
  }
  .zoom-line.past { opacity: 0.5; }            /* linhas concluídas: mais transparentes, foco na ativa */
  .zoom-cursor {
    display: inline-block;
    width: 0.09em; height: 1.05em;
    background: #fff;
    vertical-align: -0.12em;
    margin-left: 0.04em;
  }
  .zoom-cursor.blink { animation: zoom-caret 1.06s steps(1, end) infinite; }
  @keyframes zoom-caret { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0; } }
</style>
</head>
<body>
<div class="zoom-stage">
  <div class="zoom-block" id="zoom-block"><div class="zoom-pan" id="zoom-pan"><span class="zoom-cursor blink" id="zoom-cursor"></span></div></div>
</div>
<script>
(function () {
  // LINES: cada linha é uma lista de segmentos { text, color }.
  // "/n" no argumento vira uma nova linha; tags color=#HEX viram a cor do segmento;
  // "/p300" vira um token { pause: 300 } entre segmentos (micro pausa de 300ms).
  const LINES = [
    [ { text: '/mira-vertical', color: '#abb2f0' },
      { text: ' crie uma versão vertical do deck index.html', color: '#ffffff' } ],
  ];
  const RIGHT_MARGIN = 100;                    // px de ancoragem do cursor à direita
  const TYPE_MIN = 100, TYPE_MAX = 230;        // ms por caractere
  const START_DELAY = 2120, END_PAUSE = 2600;  // 2120 = 2 piscadas completas de 1.06s antes de digitar
  const NEWLINE_PAUSE = 350;                   // pausa do "Enter"
  const WAIT_FOR_ENTER = false;                // true: espera a tecla Enter para digitar e NÃO faz loop

  const block = document.getElementById('zoom-block');
  const pan = document.getElementById('zoom-pan');
  const cursor = document.getElementById('zoom-cursor');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lineEls = [];
  let revealed = false;

  function activeLine() { return lineEls[lineEls.length - 1]; }

  function newLine() {
    lineEls.forEach(el => el.classList.add('past'));  // linhas concluídas perdem um pouco de opacidade
    const div = document.createElement('div');
    div.className = 'zoom-line';
    pan.appendChild(div);
    div.appendChild(cursor);                   // o cursor desce para a linha nova
    lineEls.push(div);
    followY();
    pan.style.transition = 'transform 260ms ease';  // a câmera volta ao início suave no "Enter"
    followX();
    setTimeout(() => { pan.style.transition = ''; }, 300);
    return div;
  }

  function segSpan(lineEl, color) {
    const s = document.createElement('span');
    s.style.color = color;
    lineEl.insertBefore(s, cursor);
    return s;
  }

  // Ancoragem por geometria de layout: offsetLeft/offsetTop ignoram o transform corrente (sem drift).
  function followX() {
    const caretEnd = cursor.offsetLeft + cursor.offsetWidth;
    const shift = Math.max(0, caretEnd - (window.innerWidth - RIGHT_MARGIN));
    pan.style.transform = 'translateX(' + (-shift) + 'px)';  // câmera: todas as linhas deslocam juntas
  }

  function followY() {
    const el = activeLine();                   // linha ativa sempre centralizada na vertical
    block.style.transform = 'translateY(' + (-(el.offsetTop + el.offsetHeight / 2)) + 'px)';
  }

  // Reveal (zoom out): mostra o texto inteiro centralizado na tela, cabendo em ~90% do viewport.
  function revealAll() {
    revealed = true;
    lineEls.forEach(el => el.classList.remove('past'));  // tudo em opacidade cheia
    const textW = Math.max.apply(null, lineEls.map(el => el.scrollWidth)) - 60;  // 60 = padding-left
    const totalH = pan.offsetHeight;
    const s = Math.min(window.innerWidth * 0.9 / textW, window.innerHeight * 0.9 / totalH, 1);
    const tx = (window.innerWidth - textW * s) / 2 - 60 * s;
    pan.style.transition = 'transform 700ms ease';
    block.style.transition = 'transform 700ms ease';
    pan.style.transformOrigin = 'top left';
    pan.style.transform = 'translate(' + tx + 'px, 0) scale(' + s + ')';
    block.style.transform = 'translateY(' + (-(totalH * s) / 2) + 'px)';
  }

  function typeAll(done) {
    cursor.classList.remove('blink');
    let li = 0, si = 0, ci = 0, span = null, lineEl = activeLine();
    (function step() {
      if (li >= LINES.length) { done(); return; }
      const segs = LINES[li];
      if (si >= segs.length) {                 // fim da linha: "Enter"
        li++; si = 0; ci = 0; span = null;
        if (li < LINES.length) { setTimeout(() => { lineEl = newLine(); step(); }, NEWLINE_PAUSE); return; }
        done(); return;
      }
      if (!span) {
        if (segs[si].pause) {                  // micro pausa "/pN": cursor aceso, digitação retoma sozinha
          const wait = segs[si].pause;
          si++;
          setTimeout(step, wait);
          return;
        }
        span = segSpan(lineEl, segs[si].color);
      }
      ci++;
      span.textContent = segs[si].text.slice(0, ci);
      if (ci >= segs[si].text.length) { si++; span = null; ci = 0; }
      followX();
      setTimeout(step, TYPE_MIN + Math.random() * (TYPE_MAX - TYPE_MIN));
    })();
  }

  function reset() {
    pan.appendChild(cursor);                   // tira o cursor da linha antiga antes de removê-la
    lineEls.forEach(el => el.remove());
    lineEls = [];
    block.style.transition = 'none';
    pan.style.transition = 'none';
    pan.style.transform = 'translateX(0)';
    newLine();
    void block.offsetWidth;                    // aplica o reset antes de reativar as transições
    block.style.transition = '';
    pan.style.transition = '';
  }

  function run() {
    reset();
    if (reduced) {                             // estático: tudo pronto, nem o blink anima
      LINES.forEach((segs, i) => {
        const el = i === 0 ? activeLine() : newLine();
        segs.forEach(sg => { if (sg.text) segSpan(el, sg.color).textContent = sg.text; });
      });
      followY(); followX();
      cursor.classList.remove('blink');
      return;
    }
    cursor.classList.remove('blink');
    void cursor.offsetWidth;                   // reinicia o ciclo de blink do zero (fase alinhada)
    cursor.classList.add('blink');
    if (WAIT_FOR_ENTER) {                      // pisca até o Enter; digita uma vez e para (sem loop)
      const start = (e) => {
        if (e.key !== 'Enter') return;
        window.removeEventListener('keydown', start);
        typeAll(() => {
          cursor.classList.add('blink');
          const reveal = (ev) => {             // segundo Enter no fim: zoom out revelando tudo
            if (ev.key !== 'Enter') return;
            window.removeEventListener('keydown', reveal);
            revealAll();
          };
          window.addEventListener('keydown', reveal);
        });
      };
      window.addEventListener('keydown', start);
      return;
    }
    setTimeout(() => typeAll(() => {
      cursor.classList.add('blink');
      setTimeout(run, END_PAUSE);              // loop: recomeça do zero
    }), START_DELAY);
  }

  window.addEventListener('resize', () => {
    if (revealed) { revealAll(); return; }     // reveal recalculado para o novo viewport
    followY(); followX();
  });
  run();
})();
</script>
</body>
</html>
```

## Modo inserção em deck existente

Quando o usuário pedir a cena **dentro** de um deck:

1. Adicione uma `<section>` `min-h-screen` com o mesmo palco (`.zoom-stage` vira `position: relative; height: 100vh` dentro da section, fundo `#212121` na section).
2. Prefixe ids e classes com um slug único (`zoomtext1-...`) para não colidir.
3. Em vez de `run()` imediato, dispare `run()` na primeira entrada da section na viewport via IntersectionObserver, seguindo o padrão de triggers do deck.
4. Não toque em nenhum outro slide.

## O que NÃO fazer

- Não usar CDN, D3, GSAP nem qualquer dependência: a cena é JS/CSS puro.
- Não quebrar linha automaticamente, não reduzir a fonte para "caber": o transbordo é o efeito; quebra só explícita via `/n`.
- Não usar `getBoundingClientRect` para ancorar o cursor (drift durante a transição).
- Não deixar a tag `color` nem o marcador `/n` (ou qualquer resto deles) aparecer no texto renderizado.
- Não gerar arquivos de apoio na raiz do deck: a cena é um `index.html` único.

## Verificação antes de entregar

1. Abrir mentalmente o fluxo: cursor pisca 2 vezes, digita com cursor aceso, texto cresce, ao cruzar `vw - 100px` desliza para a esquerda com o cursor ancorado; a cada `/n` a linha sobe e a digitação recomeça do início embaixo; termina piscando, recomeça.
2. Grep no arquivo gerado: nenhuma ocorrência de `<color`, `</color>` ou `/n` literal; `LINES` confere com o argumento parseado (linhas, ordem, textos e cores).
3. Texto fora de tag está `#ffffff`; fundo `#212121`; stack de fonte de terminal presente.
4. Reportar ao usuário o caminho do arquivo e os avisos de validação (tag sem fechamento, cor inválida), se houver.
