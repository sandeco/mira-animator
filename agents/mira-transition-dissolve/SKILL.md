---
name: mira-transition-dissolve
description: Aplica transição DISSOLVE (crossfade real, estilo Canva/Keynote) à navegação entre slides de um deck do Mira, usando a View Transitions API same-document, que funciona em file:// sem servidor. Troca o scroll suave entre cards por um pulo instantâneo embrulhado em startViewTransition, fazendo um slide se desmanchar no outro. Não toca no arquivo original por padrão, cria index-dissolve.html ao lado. Use SEMPRE que o usuário disser "/mira-transition-dissolve", "transição dissolve", "dissolve nos slides", "crossfade entre slides", "fade entre slides", "transição de slides estilo Canva", "tira o scroll e põe fade", "transição suave entre cards", "aplica o dissolve", ou pedir qualquer transição de esmaecimento entre slides do deck.
---

# Skill: Transição Dissolve entre Slides

Esta skill transforma a navegação card-a-card de um deck do Mira (scroll suave entre `<section>`) em uma transição **dissolve**: o slide atual se desmancha no próximo via crossfade. O mecanismo é a **View Transitions API same-document**, que funciona com clique duplo no arquivo (`file://`), sem servidor, em Chrome e Edge. Navegadores sem a API caem no pulo normal, nada quebra.

## REGRA DE IDIOMA

Siga `agents/_shared/idioma.md`. Todo texto visível em português brasileiro com acentuação correta. Proibido travessão (—): use vírgula ou dois-pontos.

## Regra de Ouro: nunca destrua o original

- O deck de origem **permanece intacto**.
- Crie um **arquivo novo** ao lado, com sufixo `-dissolve` antes da extensão:
  - `index.html` → `index-dissolve.html`
  - `index-1x1.html` → `index-1x1-dissolve.html`
  - `index-9x16.html` → `index-9x16-dissolve.html`
- Só edite o arquivo original em vez de criar cópia se o usuário pedir explicitamente ("aplica direto no index.html").

## Pré-checagem (idempotência)

Antes de aplicar, verifique se o arquivo-alvo já contém `startViewTransition` ou o marcador `=== DISSOLVE`. Se contiver, a transição já está aplicada: reporte isso ao usuário e não duplique nada. Se o usuário quiser apenas mudar a velocidade, ajuste o `animation-duration` do bloco existente.

## Como o deck do Mira navega (estado de partida)

O template do `mira-builder` gera um HTML único com:

- Slides como `<section>` filhas diretas de `<body>`, cada uma `min-h-screen`.
- `html { scroll-behavior: smooth; }` no CSS.
- Um IIFE de controles com uma função `goTo(i)` que faz `scrollIntoView({ behavior: 'smooth' })`, mais chamadas de `window.scrollTo({ top: 0, behavior: 'smooth' })` para voltar ao início (botão flutuante no fim do deck, seta para cima no slide 1, tecla Home).
- UI fixa: `#mira-progress` (barra de progresso), `#mira-next` (botão flutuante), `.slide-counter` (contador).
- Animações D3 disparadas por IntersectionObserver. **Elas continuam funcionando sem nenhuma mudança**, porque o scroll continua acontecendo, só que instantâneo e escondido dentro da transição.

Decks antigos podem variar nos nomes. Se não encontrar `goTo` ou os IDs exatos, localize a função de navegação que chama `scrollIntoView` e os elementos com `position: fixed`, e aplique o mesmo princípio descrito abaixo.

## Aplicação (3 edições)

### 1. Bloco CSS do dissolve

Inserir no `<style>` principal, logo após as regras dos controles de slide (ou ao final do style, se a âncora não existir):

```css
/* === DISSOLVE (View Transitions same-document) === */
::view-transition-old(root), ::view-transition-new(root) { animation-duration: 0.55s; }
/* UI fixa não participa do crossfade do palco */
#mira-progress { view-transition-name: mira-progress; }
#mira-next { view-transition-name: mira-next; }
.slide-counter { view-transition-name: mira-counter; }
```

Regras:

- `0.55s` é o padrão. Se o usuário pedir mais lento ou mais rápido, ajuste (faixa sensata: 0.3s a 1.2s).
- **Todo elemento de UI com `position: fixed` precisa de um `view-transition-name` próprio e único**, senão ele pisca junto com o crossfade do palco. Se o deck tiver outros elementos fixos (logo, marca d'água), dê um nome a cada um seguindo o padrão `mira-<apelido>`.

### 2. Helper `dissolve` e novo `goTo`

Dentro do IIFE de controles, substituir a linha do `goTo`:

```js
function goTo(i) { const idx = Math.max(0, Math.min(cardSections.length - 1, i)); cardSections[idx].scrollIntoView({ behavior: 'smooth', block: 'start' }); }
```

por:

```js
function dissolve(jump) { if (document.startViewTransition) document.startViewTransition(jump); else jump(); }
function goTo(i) { const idx = Math.max(0, Math.min(cardSections.length - 1, i)); dissolve(() => cardSections[idx].scrollIntoView({ behavior: 'instant', block: 'start' })); }
```

Pontos críticos:

- `behavior: 'instant'`, e não `'auto'`: o deck tem `html { scroll-behavior: smooth; }` no CSS, e `'auto'` herdaria o suave, estragando o snapshot. `'instant'` força o pulo seco.
- O fallback `else jump()` é obrigatório: navegador sem a API navega normal.

### 3. Voltas ao topo também dissolvem

Toda chamada de `window.scrollTo({ top: 0, behavior: 'smooth' })` ligada à navegação (botão next no fim do deck, seta para cima no primeiro slide, tecla Home) vira:

```js
dissolve(() => window.scrollTo({ top: 0, behavior: 'instant' }))
```

No template padrão são 3 ocorrências: no listener de clique do `#mira-next` e em dois ramos do listener de `keydown` (setas para cima com `idx <= 0`, e tecla `Home`).

## O que NÃO fazer

- Não remover o `html { scroll-behavior: smooth; }` nem o listener de `scroll` (progresso e contador dependem dele).
- Não mexer no IntersectionObserver nem nas animações D3.
- Não aplicar view transition em scroll manual de roda de mouse: o dissolve vale para a navegação programática (teclado e botões). Rolar com a roda continua scroll normal, é o comportamento esperado.
- Não duplicar o helper `dissolve` se rodar de novo (ver pré-checagem).

## Verificação antes de entregar

1. O arquivo original está intacto e o `-dissolve.html` existe ao lado.
2. Grep no arquivo novo: `startViewTransition` aparece 1 vez, `behavior: 'smooth'` não aparece mais em chamadas de navegação (pode sobrar no CSS).
3. Abrir no Chrome ou Edge via clique duplo: setas e espaço fazem crossfade, contador e barra de progresso não piscam, animações D3 disparam ao chegar no slide.
4. Reportar ao usuário o caminho do arquivo gerado e lembrar que o efeito aparece em Chrome/Edge (demais navegadores navegam normal, sem quebrar).
