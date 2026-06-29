# Plano: evoluir o `sandeco-just-animation-template` (animação pura)

## Contexto

Ao montar um deck com o `sandeco-just-animation-template`, o resultado saía diferente do que o template promete (animação pura, multicor, sem texto). Três problemas apareceram na prática e este plano corrige a causa de cada um, não o sintoma.

## Problemas e causas

1. **Apareciam títulos nos slides.** O agente (mira-animator) é todo orientado a card (título, subtítulo, pílulas) e não tinha instrução de exceção para este template. Resultado: ele aplicava a estrutura de card mesmo num deck que deve ser só animação.

2. **Tudo saía numa cor só (laranja do tema).** Causa real no código: `lib/commands/new.js` (passo 2) substitui o bloco `@MIRA:THEME` do template pelo tema escolhido. Para este template, isso troca a paleta neutra/multicor por `mira-dark` (laranja + glass) e impõe `--mira-primary: #FF904D`, justamente uma cor predominante, que o template proíbe.

3. **Sobrava espaço e o tamanho/posição variavam.** O template usava `viewBox="0 0 W H"` dinâmico (innerWidth/Height) sem convenção de enquadramento. Sem um padrão, cada animação ficava num tamanho/centro diferente e podia sobrar área (agravado quando havia título reservando o topo).

## Decisão de design

O template passa a ser um **deck de animação pura multi-slide**: cada `<section>` é uma animação de tela cheia, sem texto sobreposto, multicor, com enquadramento fixo. Convenções:

- **Sem títulos.** Nada de título/subtítulo/pílulas/glass-card. Labels mínimos dentro do SVG (parte da metáfora) são permitidos.
- **Multicor, theme-agnóstico.** A cor vive numa paleta livre no JS (`#00E5FF, #7CFF6B, #FFD166, #FF5C8A, #B388FF, #FF904D` + branco), nenhuma predominante. O `--theme` é ignorado para este template.
- **Tamanho e posição fixos (nível 5/10).** Cada palco usa `viewBox="155.15 87.27 969.70 545.45"` com `preserveAspectRatio="xMidYMid slice"` e marcador `<!-- @MIRA:SIZE 5/10 -->`. Conteúdo centrado em (640, 360) ocupando o palco; não reservar topo.
- **Infra padrão Mira mantida:** loop interno perpétuo, anti-vazamento por geração, trigger por `IntersectionObserver`, Replay e navegação (barra de progresso + botão + teclado).

## Mudanças aplicadas (working tree, sem commit)

1. **`templates/decks/sandeco-just-animation-template/index.html`** — reescrito como scaffold multi-slide de animação pura: bloco `@MIRA:THEME` neutro, paleta multicor + helper `rgba()`, framework anti-vazamento (`play/track/stop/GEN`), trigger, navegação, e 2 slides-exemplo (campo multicor e órbita pulsante) centrados em 5/10, sem títulos. Comentários no topo fixam as 4 regras e ensinam a adicionar slides.

2. **`lib/commands/new.js`** — a injeção de tema (passo 2) passa a ser condicional: para `sandeco-just-animation-template` o tema NÃO é injetado (mantém o bloco neutro do template) e o `--theme` é ignorado. Log ajustado para "Tema: animação multicor (theme-agnóstico)".

3. **`agents/mira-animator/SKILL.md`** — nova seção "Variante: sandeco-just-animation-template (animação pura, multi-slide)" que SUSPENDE as regras de card e define: sem texto sobreposto, `<section class="slide">` + `<svg class="stage">` full-bleed, viewBox 5/10 centrado, paleta multicor sem cor predominante, infra mantida.

4. **`agents/mira-new/SKILL.md`** — nota no passo de montagem: este template é animação pura multi-slide, multicor e theme-agnóstico; o `new` ignora `--theme` e não se aplica override de cor principal.

## Critérios de aceitação

- [ ] `npx mira-animator new demo --deck=sandeco-just-animation-template --theme=mira-dark` gera um deck cujo `:root` continua com `--mira-primary: #ffffff` (tema NÃO injetado), e o `<head>` aponta para `assets/vendor/` (offline preservado).
- [ ] O deck gerado abre por `file://`, mostra 2 animações de tela cheia, multicolor, sem nenhum título, navegáveis por seta/scroll, com Replay.
- [ ] Cada `<svg>` usa `viewBox="155.15 87.27 969.70 545.45"` e marcador `@MIRA:SIZE 5/10`.
- [ ] Os demais templates (aula-capitulo, etc.) continuam recebendo o tema injetado normalmente.

## Propagação

Após revisar/commitar no repo, rodar `npx mira-animator update` nos projetos para atualizar `mira-templates/` e os agents. Decks já existentes não são afetados (o template só age no `new`).
