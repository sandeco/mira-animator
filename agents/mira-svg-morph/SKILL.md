---
name: mira-svg-morph
description: >-
  Gera num slide do Mira (novo ou existente) uma forma SVG que MORFA em outra(s)
  em loop contínuo, com GSAP e MorphSVGPlugin vendorados localmente (deck
  offline, file://). O usuário aponta 2 ou mais arquivos .svg da pasta assets/
  do deck, na ordem do morph: 2 SVGs fazem ida e volta, N SVGs encadeiam (A vira
  B vira C ... vira A). A skill cola os paths inline com ids únicos, roda
  MorphSVGPlugin.convertToPath em formas que não são path (circle, rect,
  polygon) e monta a timeline em loop. Card limpo: título sem ícone, forma
  morfando grande e central, laranja FF904D. Herda a Regra Zero e respeita
  prefers-reduced-motion. MorphSVG morfa path em path: multi-path morfa par a
  par, só a silhueta, melhor quando os SVGs têm o mesmo viewBox. Use SEMPRE que
  o usuário disser /mira-svg-morph, morfa esse svg no outro, uma forma virando
  outra, morphing de svg, transição de forma, faz um ícone virar outro, ou der
  dois ou mais SVGs pedindo um virar o outro. Quando o usuário só descreve em
  palavras, use mira-icon-morph.
---

# Skill: SVG que morfa em outro, em loop

Gera um slide onde uma silhueta vetorial vira outra diante do espectador, em loop. É o ato visual de uma metáfora: o abstrato vira concreto, ou uma coisa revela a outra. O usuário traz os arquivos `.svg`; a skill faz o morph.

> **Fonte da verdade:** padrão validado em `decks/apresentacao-mira-gsap/` na sessão de 2026-06-19. `morph-demo.html` (dois SVGs, ida e volta), `morph-sequencia.html` (vários SVGs encadeados) e o GSAP já vendorado em `assets/gsap/`. A spec completa está em `specs/GSAP/mira-svg-morph-spec.md`. Quando em dúvida sobre o scaffold, copie desses arquivos.

## Como o morph funciona (o ponto crítico, leia)

O **MorphSVGPlugin** transforma o atributo `d` de um `<path>` no `d` de outro. Implicações que definem o que dá pra fazer:

- **Morfa `<path>` em `<path>`, não "SVG inteiro" em "SVG inteiro".** Cada SVG limpo de **path único** morfa liso. SVG com vários paths morfa **par a par** (path 1 vira path 1, path 2 vira path 2).
- **Multi-path com contagens diferentes:** pareie na ordem até o menor número de paths; os paths que sobram entram e saem por fade. Avise a assimetria ao usuário.
- **Morfa só a silhueta.** Cor, preenchimento e contorno animam à parte (aqui a cor é fixa no laranja Mira por padrão).
- **Não morfa raster (`<image>`/PNG) nem texto (`<text>`)** sem antes virar path. Se o SVG só tiver isso, avise e peça um contorno vetorial.
- **Mesmo viewBox nos dois.** Se forem diferentes, normalize para um viewBox comum (escala/translada), senão o morph "salta".
- **Formas de complexidade muito diferente** podem morfar "líquido". É aceitável; o MorphSVG já faz um mapeamento padrão.

## Vendorar o GSAP (offline é inegociável)

O deck do Mira abre por `file://`, então **nada de CDN em runtime**. Baixe os dois arquivos para `assets/gsap/` do deck (uma vez por deck; se já existirem, pule):

```
curl -s https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js          -o assets/gsap/gsap.min.js
curl -s https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/MorphSVGPlugin.min.js -o assets/gsap/MorphSVGPlugin.min.js
```

GSAP e MorphSVG são gratuitos e redistribuíveis desde abril de 2025 (inclusive comercial), então podem ficar commitados no deck. Referencie por caminho relativo no `<head>`:

```html
<script src="assets/gsap/gsap.min.js"></script>
<script src="assets/gsap/MorphSVGPlugin.min.js"></script>
```

## Inline + ids únicos + convertToPath (em tempo de geração)

No `file://` o `fetch` de SVG costuma ser bloqueado, então o inline é feito **agora, pela skill**, não no navegador:

1. **Ler cada `.svg`** apontado pelo usuário e extrair o `d` de cada `<path>`.
2. **Renomear ids** de paths, gradientes, filtros e clipPaths para valores únicos por arquivo (prefixo por índice, ex.: `m0-`, `m1-`), para não colidir entre vários SVGs no mesmo documento.
3. **Converter formas que não são path** (circle, rect, ellipse, polygon, polyline, line) com `MorphSVGPlugin.convertToPath(...)` antes do morph, ou já guardar o `d` equivalente.
4. **Guardar os `d` como constantes JS** (uma por forma), na ordem do morph.

## REGRA ZERO (herdada) + acessibilidade

Todo slide do Mira tem loop interno: a timeline do morph usa `repeat: -1` e nunca para. Descreva o loop em uma frase ("a nuvem vira lâmpada, vira olho, vira coração e volta, sem parar").

Respeite `prefers-reduced-motion`: quando ativo, **não** rode o loop; mostre a forma final estática.

## Composição do card (padrão do mira-animator: limpo, forma maximizada)

- **Só título + forma.** Título no topo, sem ícone, no máximo 6 palavras. A forma ocupa boa parte da altura útil do palco.
- **Laranja #FF904D** na forma, com glow suave. Fundo escuro do deck.
- Insira como `<section>` no padrão do deck e preserve o sistema de navegação (barra de progresso, próximo, teclado).

## Scaffold canônico (gerar conforme os arquivos de teste)

A forma morfante é um `<path>` dentro de um grupo que escala o sistema 0 0 24 24 (caso dos ícones) para o palco. Atenção ao glow: como o path vive no espaço 24x24 e é escalado, o `stdDeviation` do filtro fica pequeno (~0.7), senão o blur explode.

```html
<!-- @MIRA:SIZE 3/10 -->
<div class="anim-stage" id="SLUG-stage"><svg id="SLUG-svg" viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid meet"></svg></div>
```

```javascript
gsap.registerPlugin(MorphSVGPlugin);
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const MIRA_SIZE = 3;                  // 1..10, ponto único de ritmo/amplitude
const SPEED = 0.7 + MIRA_SIZE * 0.1;  // 1.0 em SIZE 3

// os d dos SVGs de entrada, na ordem do morph (já inlinados, ids únicos)
const FORMAS = [
  "M6.5 20q-2.28 0-3.89-1.57...Z",   // forma A (svg 1)
  "m12 21.35l-1.45-1.32C5.4...z"     // forma B (svg 2)  ...e assim por diante
];

function animateSlug() {
  const svg = document.getElementById('SLUG-svg');
  if (window.__slugTl) window.__slugTl.kill();           // anti-vazamento: mata o loop antigo
  const H = 300, s = (H / 24).toFixed(2);                // altura da forma no palco
  svg.innerHTML = `<defs>
      <filter id="SLUG-glow" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="0.7" result="b"/>
        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <g transform="translate(640 330) scale(${s}) translate(-12 -12)">
      <path id="SLUG-forma" d="${FORMAS[0]}" fill="#FF904D" filter="url(#SLUG-glow)"/>
    </g>`;
  if (REDUCE) { document.getElementById('SLUG-forma').setAttribute('d', FORMAS[FORMAS.length - 1]); return; }
  const seq = FORMAS.length === 2
    ? [FORMAS[1], FORMAS[0]]                              // 2 SVGs: ida e volta
    : FORMAS.slice(1).concat([FORMAS[0]]);               // N SVGs: encadeia e fecha o ciclo
  const tl = gsap.timeline({ repeat: -1, defaults: { ease: 'power2.inOut' } });
  seq.forEach(d => tl.to('#SLUG-forma', { duration: 1.3, morphSVG: d }, '+=0.7'));
  tl.timeScale(SPEED);
  window.__slugTl = tl;
}
```

Registre `animateSlug` no `setupAnimationTriggers()` do deck (mesmo padrão do mira-animator): dispara ao entrar na viewport e no botão Replay.

## Passos

1. **Receber destino + arquivos.** Slide novo ou slide N do deck X, e os 2+ `.svg` na ordem do morph. Se vier 1 só, avise que o morph precisa de 2 ou mais (veja Checklist). Se faltar arquivo, pergunte.
2. **Vendorar o GSAP** em `assets/gsap/` (pule se já houver).
3. **Inline + ids únicos + convertToPath:** ler cada SVG, extrair os `d`, renomear ids, converter formas não-path. Se as contagens de path diferirem, pareie até o menor e avise; se os viewBox diferirem, normalize e avise.
4. **Montar o card limpo:** título sem ícone (máx. 6 palavras), forma grande e central em #FF904D, marcador `@MIRA:SIZE 3/10`. Inserir como `<section>` no padrão do deck; preservar a navegação.
5. **Implementar a timeline** com o scaffold: loop `repeat: -1`, 2 = ida e volta, N = encadeia; `prefers-reduced-motion` mostra a forma final estática; registrar no trigger do deck.
6. **Reportar.** Caminho do arquivo, a sequência do morph e o loop em uma frase, os arquivos usados, e que abre por `file://` sem servidor.

## Checklist

- [ ] GSAP e MorphSVG vendorados em `assets/gsap/`; referenciados por caminho relativo; nenhum CDN em runtime.
- [ ] Slide abre por `file://` sem nada externo.
- [ ] 2 ou mais SVGs de entrada; com 1 só, a skill avisou em vez de gerar card incompleto.
- [ ] Paths inlinados; ids de paths/gradientes/filtros renomeados para únicos; 0 colisão.
- [ ] Formas não-path convertidas com `convertToPath`; nenhuma `circle`/`rect`/`polygon` crua no morph.
- [ ] Loop contínuo (`repeat: -1`): 2 = ida e volta, N = encadeia e fecha o ciclo.
- [ ] `prefers-reduced-motion` mostra a forma final estática, sem loop.
- [ ] Card limpo: só título + forma; título sem ícone, no máximo 6 palavras.
- [ ] Laranja #FF904D na forma; glow com `stdDeviation` pequeno (forma escalada).
- [ ] Marcador `@MIRA:SIZE 3/10` acima do palco; timeline registrada no trigger do deck.
- [ ] Anti-vazamento: a timeline antiga é morta (`kill`) antes de reconstruir/replay.
- [ ] Nenhum travessão (—); acentuação UTF-8 correta (segue `agents/_shared/idioma.md`).
