---
name: mira-animator
description: Cria slides individuais com animações criativas e looping interno obrigatório, no padrão dos decks de referência em mira-templates/decks/. Combina o esqueleto visual da skill mira-builder (glass-card, icon-hero, attribute-pills, replay-btn) com a profundidade técnica das diretrizes D3 em references/ (D3.js v7+ ou 3D CSS) e a regra-mãe da skill, NENHUMA animação é estática, toda animação ENTRA com coreografia e DEPOIS continua em loop interno. Use SEMPRE que o usuário disser, "criar slide animado", "novo slide com animação", "adicionar card com D3", "/mira-animator", "slide criativo para o deck", "slide com flip cards", "slide com battle arena", "slide com staircase", ou pedir explicitamente "looping na animação", "animação contínua", "movimento contínuo no slide". Também use quando o usuário enviar uma imagem e pedir "transforme isso em um slide animado" ou "anima essa figura".
---

# Skill: Slides com Animação Criativa e Looping Interno

## REGRA ZERO, OBRIGATÓRIA, INEGOCIÁVEL

**Toda animação criada por esta skill DEVE ter um loop interno contínuo.**

Uma animação que só entra com fade-up e para é proibida. O slide tem que continuar respirando depois da entrada, com alguma coisa em movimento perpétuo. Exemplos válidos de loop interno:

- Partícula viajando por uma linha de A para B repetidamente
- Pulso radial em um elemento central (raio expande e contrai)
- Anel orbital com `stroke-dashoffset` girando
- Spotlight sequencial percorrendo elementos um por um
- Cards flipados pulsando em cascata
- Climber/orbe percorrendo um caminho e reiniciando
- Música/agente piscando em uníssono aleatório

Se você não conseguir descrever o loop em uma frase ("uma esfera laranja sobe a escada e volta ao começo"), a animação está incompleta.

## REGRA DE LIBERDADE CRIATIVA

Não use sempre o mesmo formato. **Varie a metáfora visual** conforme o conceito do slide:

- Conceito hierárquico, hub-and-spoke (SPEC no centro, satélites ao redor)
- Conceito evolutivo, staircase com climber
- Conceito comparativo, battle arena com VS badge e duelos
- Conceito de revelação, flip cards 3D
- Conceito de orquestração, pontos pulsando em uníssono
- Conceito de fluxo, partículas viajando entre nós

Não caia em "8 cards retangulares enfileirados". O usuário já reclamou disso antes. Cada slide é uma micro-narrativa visual.

## REGRA DE IDIOMA

Textos visíveis em português brasileiro, acentuação 100% correta, UTF-8 direto:
- "não", "é", "código", "função", "também", "está", "à medida que"
- NUNCA usar Unicode escapes (`é`) ou entidades HTML (`&eacute;`) no body
- Charset declarado: `<meta charset="UTF-8">`

## REGRA DE FORMATAÇÃO

- Proibido travessão (—) em qualquer texto. Substituir por vírgula, dois-pontos ou reescrever.
- Proibido `\destaque{}` ou `\textcolor{}` em LaTeX. Aqui é HTML, mas a regra geral é: títulos limpos, ênfase via `<span class="primary-color italic">`.

## REGRA DE TÍTULO

- **Sem ícone no título.** Não coloque `icon-hero` nem qualquer `<i data-lucide>` acima ou ao lado do `<h2>` do slide. O título é só texto (com ênfase via `<span class="primary-color italic">`). Ícones continuam permitidos dentro do card (header da animação, pílulas de atributo), nunca no título.
- **No máximo 6 palavras no título**, a não ser que o usuário peça explicitamente mais. Se o título natural passar de 6 palavras, encurte mantendo o sentido.
- **Título colado no topo.** A `<section>` usa `px-6 pt-3 pb-6` e o wrapper do card não leva `pt-10 md:pt-16`. O bloco do título fecha com `mb-2`.

## Quando o Usuário Aciona a Skill

1. Usuário aciona com `/mira-animator` ou frase equivalente.
2. Usuário normalmente envia uma imagem de referência (figura de livro, diagrama do projeto, print), ou descreve o conceito que quer animar.
3. Você decide a metáfora visual mais forte para esse conceito.
4. Você implementa diretamente (não pede aprovação prévia se o usuário já deu contexto suficiente).

## Onde o Slide é Inserido

Como um novo card dentro do deck do tema, em `slides/<tema>/index.html`. Se o deck ainda não existir, crie a partir de um esqueleto em `mira-templates/decks/` (aula-capitulo, pitch-projeto, demo-tecnica ou sandeco-just-animation-template), respeitando a estrutura do template escolhido.

## Variante: sandeco-just-animation-template (animação pura, multi-slide)

Quando o deck usa este template, ele NÃO é feito de cards. As regras de card desta skill (título, subtítulo, pílulas, glass-card, icon-hero, .anim-stage) ficam SUSPENSAS e valem estas:

- **Sem texto sobreposto.** Nada de título, subtítulo ou pílulas. Cada slide é só a animação de tela cheia sobre fundo preto. Labels mínimos DENTRO do SVG (parte da metáfora) são permitidos; título de slide, não.
- **Cada slide é uma `<section class="slide">`** filha direta do `<body>`, com um `<svg class="stage">` full-bleed (`position: absolute; inset: 0`).
- **Tamanho e enquadramento fixos:** `viewBox="155.15 87.27 969.70 545.45"` (nível 5/10) com `preserveAspectRatio="xMidYMid slice"`, e o marcador `<!-- @MIRA:SIZE 5/10 -->` na linha acima do svg. Componha o conteúdo centrado em (640, 360) ocupando o palco inteiro; não reserve espaço no topo, porque não há título.
- **Cor: paleta LIVRE multicor**, alto contraste com o preto, NENHUMA cor predominante. NÃO trave em `var(--mira-primary)` nem no laranja do tema. Distribua a paleta (`#00E5FF`, `#7CFF6B`, `#FFD166`, `#FF5C8A`, `#B388FF`, `#FF904D`, mais branco para neutros) entre os elementos.
- **Mantém** o loop interno perpétuo, o anti-vazamento por geração (`window.__slugGen`), o trigger por `IntersectionObserver` e o botão Replay.
- Para adicionar um slide, duplique uma `<section class="slide">` e registre a função em `ANIM.sN`.

## Estrutura Obrigatória do Card

```html
<!-- A <section> que envolve o card encosta o título no topo:
     class="min-h-screen flex flex-col items-center justify-center px-6 pt-3 pb-6" -->
<!-- Card N: Título descritivo -->
<div class="w-full max-w-6xl" data-aos="fade-up" data-aos-delay="100">
    <!-- Título do slide: SEM ícone, no máximo 6 palavras -->
    <div class="text-center mb-2">
        <h2 class="text-4xl md:text-5xl font-bold mb-2">
            Parte fixa <span class="primary-color italic">parte com ênfase</span>
        </h2>
        <p class="text-white/60 italic text-lg md:text-xl">Subtítulo curto e direto.</p>
    </div>

    <!-- Container visual com replay -->
    <div class="glass-card rounded-2xl p-1 md:p-2">
        <!-- Header bar interno -->
        <div class="flex items-center justify-between mb-2 px-1">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-[#FFA203]/15 flex items-center justify-center">
                    <i data-lucide="ICONE" class="w-5 h-5 primary-color"></i>
                </div>
                <div>
                    <p class="text-white font-bold text-sm">Subtítulo da animação</p>
                    <p class="text-white/50 text-xs italic">Frase complementar curta.</p>
                </div>
            </div>
            <button id="replay-SLUG" class="replay-btn" type="button">
                <i data-lucide="rotate-cw" class="w-4 h-4"></i>
                Replay
            </button>
        </div>

        <!-- Palco da animação -->
        <!-- @MIRA:SIZE 3/10 -->
        <div class="anim-stage" id="SLUG-stage">
            <svg id="SLUG-svg" viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid meet"></svg>
        </div>

        <!-- Atributos/pílulas no rodapé -->
        <div class="border-t border-white/10 pt-1 mt-1 mb-1">
            <p class="text-xs uppercase tracking-[3px] text-white/40 text-center mb-1">Tagline do slide</p>
            <div class="grid grid-cols-2 md:grid-cols-N gap-2">
                <div class="attribute-pill text-center p-1 rounded-xl">
                    <i data-lucide="..." class="w-4 h-4 primary-color mx-auto mb-1"></i>
                    <p class="text-sm font-semibold tracking-wide">Termo</p>
                </div>
                <!-- ...mais pílulas... -->
            </div>
        </div>
    </div>
</div>
```

**CSS específico do stage.** O tamanho padrão do canvas já vem do `.anim-stage` (no `base.css`): `height: clamp(400px, 60vh, 620px)`. Só adicione um override por slide no `<style>` se aquele slide específico precisar de mais ou menos altura:

```css
#SLUG-stage {
    height: clamp(400px, 60vh, 620px);
}

#SLUG-stage + .border-t {
    padding-top: 0.25rem;
    margin-top: 0.25rem;
    margin-bottom: 0.25rem;
}
```

## Marcador de Tamanho (@MIRA:SIZE)

Toda animação nasce no nível de tamanho **3/10**. Por isso, na linha imediatamente acima do `.anim-stage`, estampe sempre o marcador:

```html
<!-- @MIRA:SIZE 3/10 -->
<div class="anim-stage" id="SLUG-stage"> ... </div>
```

Esse comentário é a memória do tamanho da animação. A skill `mira-size-animator` lê esse marcador para reportar e ajustar a percepção de tamanho (escalar a composição para cima ou para baixo) sem precisar adivinhar o nível atual. Gere uma animação por vez já com o marcador 3/10; não invente outro valor.

## Trigger System Obrigatório

Toda animação registra-se em `setupAnimationTriggers()`:

```javascript
const stages = [
    { stage: document.getElementById('SLUG-stage'), fn: animateSlug, replay: 'replay-SLUG' }
].filter(s => s.stage);
```

O `IntersectionObserver` já existente dispara `animateSlug()` quando o stage entra no viewport, e rearma ao sair. O botão Replay invoca a mesma função manualmente.

## Padrão Anti-Vazamento de Loops

Toda função de animação que usa `setInterval` ou `setTimeout` recursivo DEVE implementar geração:

```javascript
function animateSlug() {
    // Cancela todos os loops antigos antes de reiniciar
    clearInterval(window.__slugPulse);
    clearInterval(window.__slugFlow);

    window.__slugGen = (window.__slugGen || 0) + 1;
    const myGen = window.__slugGen;

    // Dentro de recursões/timeouts:
    function loop() {
        if (myGen !== window.__slugGen) return;  // outra geração tomou o controle
        // ...trabalho do loop...
        setTimeout(loop, 1000);
    }
}
```

Se isso não estiver presente, dois climbers correm ao mesmo tempo no Replay, vaza memória, animações ficam fora de sincronia.

## Tipos de Animação Suportados

### Tipo A: D3 SVG (orchestra, spec-center, climber)

Use quando o conceito tem **estrutura geométrica clara** (hub-spoke, escada, rede, gráfico).

Stack:
- `<svg viewBox="0 0 1280 720">` dentro do `.anim-stage`
- D3 v7+ via CDN (`https://d3js.org/d3.v7.min.js`)
- Use `d3.easeBackOut.overshoot(1.1)` para entradas com snap
- Use `d3.easeQuadInOut` para movimentos de partícula
- Use `attrTween` ou `stroke-dashoffset` para efeitos contínuos

Loops típicos:
- Pulso radial (`circle` com `r` indo e voltando via `setInterval`)
- Partículas viajando (criar, animar transição, destruir, repetir)
- `stroke-dashoffset` decrementando para "fluxo" em linhas tracejadas

### Tipo B: 3D Flip Cards (spec moderna)

Use quando o conceito é **revelação** ("o que tem dentro de X").

Stack:
- CSS: `perspective`, `transform-style: preserve-3d`, `backface-visibility: hidden`
- Curva: `cubic-bezier(0.34, 1.4, 0.64, 1)` com leve overshoot
- JS adiciona classe `.flipped` em cascata

Loop interno após reveal: um card por vez ganha brilho extra com `box-shadow` em loop.

### Tipo C: Battle Arena / Choreographed Reveal (SDD vs Agile)

Use quando o conceito é **comparação binária** ou **transformação A→B**.

Stack:
- Grid 3 colunas (A | center | B)
- Estados iniciais escondidos via CSS (`opacity: 0; transform: translateX(±40px)`)
- JS adiciona `.revealed` em cascata
- Cada lado tem sua própria transição (`agile` esquerda, `sdd` direita com bounce)

Loop interno: partícula viajando de A para B em cada linha (com `animation-delay` por linha gerando onda em cascata).

## Hierarquia Tipográfica Padrão

- Título do slide (h2): `text-4xl md:text-5xl font-bold`
- Subtítulo italic: `text-lg md:text-xl text-white/60 italic`
- Texto de card grande: `text-xl` ou `text-2xl`
- Texto de pílula: `text-sm` ou `text-base`
- Label uppercase tracked: `text-xs uppercase tracking-[3px]`

## Cores e Tema

- Primária: `#FFA203` (laranja, classe `.primary-color`, bg `.primary-bg`)
- Fundo: `#222222`
- Backgrounds dos cards: `rgba(255,255,255,0.30)` glassmorph ou `rgba(255,162,3,0.08)` orange
- Glow: `drop-shadow(0 0 N px rgba(255,162,3,0.55))` com N entre 20 e 40
- Linhas/contornos: tracejado `stroke-dasharray="5,5"` com `opacity` 0.5-0.7
- Texto secundário: `text-white/65` ou `text-white/70`
- Texto terciário: `text-white/40`

## Ícones

- Lucide via CDN (`https://unpkg.com/lucide@latest`), `<i data-lucide="ICONE">`
- Sempre estilo outline/line (vazado), nunca filled
- Tamanhos: `w-4 h-4` (pequeno), `w-7 h-7` (médio), `w-12 h-12` (grande)
- Para ícones DENTRO de SVG D3, desenhar com `<path>`, `<rect>`, `<line>` (não usar `<i>` em SVG)

## Workflow de Execução

1. **Identificar o conceito** que o slide vai comunicar (revelação? comparação? hierarquia? evolução?)
2. **Escolher a metáfora visual** mais forte para esse conceito (não copiar uma metáfora já usada no mesmo capítulo se possível)
3. **Esboçar mentalmente o loop interno** ANTES de codar. Se não houver loop, parar e repensar.
4. **Ler um esqueleto em `mira-templates/decks/`** como referência de padrão visual e estrutural do deck.
5. **Adicionar o CSS específico** do novo stage no `<style>`.
6. **Inserir o HTML do card** dentro do `<main>` em posição lógica.
7. **Implementar a função JS** com:
   - Reset (clearInterval de loops anteriores + selectAll('*').remove() do svg)
   - Geração anti-vazamento (`window.__slugGen`)
   - Entrada coreografada com stagger
   - Loop interno contínuo
8. **Registrar o trigger** em `setupAnimationTriggers()`.
9. **Reportar ao usuário** descrevendo o loop interno em uma frase, para confirmar que a regra-mãe foi cumprida.

## Anti-padrões (NÃO FAÇA)

- ❌ Fade-up + parou. Sem loop interno.
- ❌ Pulse genérico em todos os elementos ao mesmo tempo (sem hierarquia visual).
- ❌ Animação durando 200ms sem easing customizado (parece bug, não criativo).
- ❌ Cor diferente do tema laranja/preto. Não tem azul, verde, rosa neste livro.
- ❌ Texto com travessão (—).
- ❌ Texto sem acento ou com `&eacute;`, `&ccedil;` etc.
- ❌ `setInterval` sem `clearInterval` correspondente no início da função.
- ❌ 4 cards retangulares idênticos enfileirados (a menos que seja uma grid intencional e única).
- ❌ Animação que precisa ser explicada para ser entendida. A metáfora visual deve ser óbvia.

## Checklist Antes de Entregar

- [ ] Título sem ícone (nenhum `icon-hero`/`<i>` acima ou ao lado do `<h2>`).
- [ ] Título com no máximo 6 palavras (salvo pedido explícito do usuário).
- [ ] Margem do título ao topo enxuta (seção `pt-3 pb-6`, wrapper sem `pt-10`, título `mb-2`).
- [ ] Canvas no padrão `.anim-stage` (`clamp(400px, 60vh, 620px)`) e `viewBox="0 0 1280 720"`.
- [ ] Marcador `<!-- @MIRA:SIZE 3/10 -->` na linha acima do `.anim-stage`.
- [ ] CSS do `#SLUG-stage` adicionado com height clamp.
- [ ] HTML do card está dentro de `<main>` na posição lógica.
- [ ] Função JS implementada com generation counter.
- [ ] Registrado em `setupAnimationTriggers()`.
- [ ] Botão Replay funciona (testado mentalmente: cliquei, reseta limpo, refaz).
- [ ] Loop interno está rodando após a entrada (descreva em uma frase).
- [ ] Nenhum travessão `—` no slide.
- [ ] Acentuação UTF-8 direta, sem entidades HTML.
- [ ] Pelo menos um elemento sempre em movimento depois da entrada.
- [ ] Metáfora visual diferente das já usadas no mesmo capítulo.

## Referência de Padrões

Os blueprints de card já prontos vivem em `mira-templates/slides/` (capa, comparação, métricas, fluxo, escada, orbital, encerramento), cada um com seu loop interno. Os esqueletos de deck completos vivem em `mira-templates/decks/`. Quando criar um novo slide, abra o blueprint mais próximo do que você quer fazer e use como base estrutural, variando a metáfora visual conforme o conceito.

## Sistema de Passagem de Slides (obrigatório)

Todo deck gerado deve manter o sistema de navegação que já vem nos esqueletos de `mira-templates/decks/`:

- Barra de progresso no topo (`#mira-progress`).
- Botão flutuante "próximo" no canto (`#mira-next`).
- Navegação por teclado: setas, PageUp/PageDown, Home/End e F para tela cheia, rolando seção a seção via `scrollIntoView`.

Cada slide é uma `<section class="min-h-screen">` filha direta do `<body>`. Nunca remova esse bloco ao editar ou montar um deck.
