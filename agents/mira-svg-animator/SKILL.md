---
name: mira-svg-animator
description: >-
  Anima num slide do Mira um SVG que o usuário FORNECE, dando movimento próprio
  à forma (não troca uma forma por outra, isso é morph). O usuário passa 1
  arquivo .svg e descreve o movimento em palavras: bater asas, girar uma roda,
  deslizar, pulsar, desenhar o contorno, percorrer uma curva. Usa GSAP vendorado
  localmente (offline, file://) e escolhe a técnica: transform, DrawSVGPlugin (o
  traço se desenha) ou MotionPathPlugin (curva). Ponto central: para animar uma
  PARTE ela precisa ser um elemento separado; se o SVG vier como path único
  fundido, a skill separa a parte por clipPath ou editando o path. Também remove
  fundo opaco e define a origem do movimento. Herda a Regra Zero e respeita
  prefers-reduced-motion. Use SEMPRE que o usuário disser /mira-svg-animator,
  anima esse svg, faz a borboleta bater asas, gira essa roda, faz esse desenho
  se mexer, desliza esse svg, faz pulsar, o traço se desenha sozinho, ou passar
  um SVG pedindo movimento. Para uma forma virando OUTRA use mira-svg-morph ou
  mira-icon-morph.
---

# Skill: animar um SVG que o usuário fornece

Dá vida a um SVG que o usuário já tem: a borboleta bate asas, a roda gira, o contorno se desenha, o objeto desliza. A forma não vira outra (isso é morph), ela ganha movimento próprio.

> **Fonte da verdade:** padrão validado em `decks/apresentacao-mira-gsap/borboleta-bate-asas.html` (sessão de 2026-06-19): asas batendo via `scaleX` em torno do eixo do corpo, fundo branco removido, antenas mantidas estáticas. A spec completa está em `specs/GSAP/mira-svg-animator-spec.md`. Quando em dúvida, copie desse exemplo.

## O ponto crítico: animar uma PARTE exige que a parte seja separada (leia)

GSAP só move o elemento que você entrega. Para mover **uma parte** (uma asa, uma roda, um braço), essa parte tem que ser um **elemento separado** no SVG (um `<g>`/`<path>` próprio). A maioria dos SVGs vem como **um path único fundido**, e aí o GSAP só consegue mover o desenho inteiro. Antes de animar uma parte, separe-a:

- **Corte por eixo com clipPath (recomendado para simetria).** Renderize a silhueta duas (ou mais) vezes, cada cópia recortada por um `clipPath` numa região (ex.: metade esquerda / metade direita no eixo do corpo). Cada cópia vira um grupo animável. Foi assim que a borboleta ganhou asa esquerda e direita.
- **Edite o path para isolar ou remover um trecho.** Se uma parte do path não deve se mover (ex.: as antenas dentro do path da asa), localize o trecho contínuo e substitua por uma reta curta que fecha a forma sem ele (ex.: trocar o desenho das antenas por `L x y` atravessando o topo do corpo). Assim o corte por eixo não duplica nem mexe nessa parte.

Se a parte não isolar de jeito limpo, **avise** e ofereça animar o SVG inteiro (rotação/pulso global) em vez de uma parte.

## Remova o fundo

Se o SVG tiver fundo opaco (ex.: `<rect fill="#ffffff">` cobrindo tudo, ou um fundo de cor), **remova/oculte** esse elemento antes de animar, senão ele tampa o card escuro do Mira. Se o fundo for ambíguo (gradiente, imagem), pergunte qual elemento é o fundo.

## A origem do movimento (svgOrigin)

Rotação e escala precisam girar em torno do ponto certo, não do canto do SVG. Defina a origem em coordenadas do SVG com `svgOrigin: 'X Y'` (ex.: o eixo da dobradiça das asas no corpo, ou o centro de uma roda). Se a dobradiça não for óbvia, use o centro geométrico da parte e diga qual ponto usou.

## Vendorar o GSAP (offline é inegociável)

Baixe para `assets/gsap/` do deck só o que a técnica usar (uma vez por deck; se já existir, pule):

```
curl -s https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js              -o assets/gsap/gsap.min.js
curl -s https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/DrawSVGPlugin.min.js     -o assets/gsap/DrawSVGPlugin.min.js     # só se for "o traço se desenha"
curl -s https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/MotionPathPlugin.min.js  -o assets/gsap/MotionPathPlugin.min.js  # só se for "percorre uma curva"
```

GSAP e plugins são gratuitos e redistribuíveis desde abril de 2025. Referencie por caminho relativo no `<head>` e registre os plugins (`gsap.registerPlugin(DrawSVGPlugin, MotionPathPlugin)`) quando usá-los.

## A técnica conforme o movimento

- **Bater, girar, deslizar, pulsar, balançar** → `transform` (`rotation`, `scale`/`scaleX`/`scaleY`, `x`/`y`, `skewX`) com `repeat: -1` e `yoyo` quando for vai e volta.
- **O traço se desenha** → `DrawSVGPlugin` no contorno (a forma precisa de `stroke`; se só tiver preenchimento, adicione um stroke).
- **Percorre uma curva** → `MotionPathPlugin` num path-guia.

## REGRA ZERO (herdada) + acessibilidade

Movimento perpétuo em loop (`repeat: -1`). Descreva o loop em uma frase ("as asas batem sem parar em torno do corpo"). Respeite `prefers-reduced-motion`: quando ativo, mostre o SVG no estado final estático, sem loop.

## Composição do card (padrão do mira-animator: limpo, SVG maximizado)

Título no topo, sem ícone, no máximo 6 palavras. O SVG ocupa boa parte da altura útil. Identidade laranja #FF904D quando fizer sentido recolorir (não altere a arte sem pedido). Insira como `<section>` no padrão do deck e preserve a navegação. Estampe `@MIRA:SIZE 3/10` acima do palco.

## Scaffold canônico (bater asas, validado na borboleta)

Silhueta de path único cortada no eixo do corpo em duas cópias (asa esquerda/direita), cada uma flapando por `scaleX` em torno da dobradiça. O corpo fica estático por cima cobrindo a emenda.

```html
<svg id="SLUG-svg" viewBox="... ..." preserveAspectRatio="xMidYMid meet">
  <defs>
    <clipPath id="SLUG-clip-l"><rect x="0" y="0" width="EIXO" height="H"/></clipPath>
    <clipPath id="SLUG-clip-r"><rect x="EIXO" y="0" width="RESTO" height="H"/></clipPath>
  </defs>
  <g clip-path="url(#SLUG-clip-l)"><g id="SLUG-lwing"><path d="SILHUETA_SEM_PARTES_FIXAS" fill="..."/></g></g>
  <g clip-path="url(#SLUG-clip-r)"><g id="SLUG-rwing"><path d="SILHUETA_SEM_PARTES_FIXAS" fill="..."/></g></g>
  <path id="SLUG-corpo" d="CORPO_E_PARTES_FIXAS" fill="..."/>   <!-- estático, por cima da emenda -->
</svg>
```

```javascript
const REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
const MIRA_SIZE = 3, SPEED = 0.7 + MIRA_SIZE * 0.1;  // ponto único de ritmo/amplitude
if (!REDUCE) {
  const flap = { scaleX: 0.34, svgOrigin: 'EIXO_X EIXO_Y', duration: 0.55, ease: 'sine.inOut', repeat: -1, yoyo: true };
  const tl = gsap.timeline();
  tl.to('#SLUG-lwing', { ...flap }, 0).to('#SLUG-rwing', { ...flap }, 0);
  tl.timeScale(SPEED);
}
```

Outras técnicas (mesma ideia de loop + svgOrigin + reduced-motion):
```javascript
// girar uma roda em torno do próprio centro
gsap.to('#SLUG-roda', { rotation: 360, svgOrigin: 'CX CY', duration: 1.4, ease: 'none', repeat: -1 });
// o contorno se desenha (precisa de DrawSVGPlugin e stroke na forma)
gsap.fromTo('#SLUG-traco', { drawSVG: '0%' }, { drawSVG: '100%', duration: 2.2, ease: 'power1.inOut', repeat: -1, yoyo: true });
```

## Passos

1. **Receber destino + SVG + movimento.** Slide novo ou slide N do deck X, o `.svg` e a descrição do movimento. Se faltar arquivo ou a descrição, pergunte.
2. **Copiar o SVG para `assets/`**, **remover o fundo** opaco e **inspecionar a estrutura** (partes separadas ou path único).
3. **Separar a parte a animar** se for path único (corte por eixo com clipPath ou edição do path para isolar/remover trechos fixos). Definir a **origem** do movimento.
4. **Escolher a técnica** (transform / DrawSVG / MotionPath) e **vendorar** só os arquivos GSAP necessários em `assets/gsap/`.
5. **Montar o card** no padrão do deck (título sem ícone máx. 6 palavras, marcador @MIRA:SIZE), implementar a timeline em loop com `prefers-reduced-motion`, e registrar no trigger do deck.
6. **Reportar.** Caminho do arquivo, o movimento em uma frase, a técnica e a origem usadas, se separou parte e como, e que abre por `file://`.

## Checklist

- [ ] GSAP (e só os plugins usados) vendorados em `assets/gsap/`; caminho relativo; nenhum CDN em runtime.
- [ ] Slide abre por `file://` sem nada externo.
- [ ] Fundo opaco removido (ex.: `<rect>` branco).
- [ ] Parte a animar é um elemento separado; em path único, separada por clipPath ou edição do path, sem arrastar o resto.
- [ ] Nada que deve ficar parado se move em cópia (ex.: antenas removidas do path da asa).
- [ ] Origem do movimento no ponto certo (`svgOrigin`), não no canto.
- [ ] Técnica coerente com o pedido (transform / DrawSVG / MotionPath).
- [ ] Loop contínuo (`repeat: -1`), `yoyo` quando for vai e volta.
- [ ] `prefers-reduced-motion` mostra o estado final estático, sem loop.
- [ ] Card limpo: título sem ícone, no máximo 6 palavras; marcador `@MIRA:SIZE 3/10`; timeline registrada no trigger do deck.
- [ ] Nenhum travessão (—); acentuação UTF-8 correta (segue `agents/_shared/idioma.md`).
