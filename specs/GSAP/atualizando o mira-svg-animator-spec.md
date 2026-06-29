# Spec: Atualização da skill /mira-svg-animator, morfagem líquida de um SVG em outro

**Versão:** 1.0
**Status:** Em Revisão
**Autor:** sandeco (via sessão Claude Code)
**Data:** 2026-06-19
**Reviewers:** sessão responsável por atualizar a skill `/mira-svg-animator`

---

## 1. Resumo

Atualizar a skill `/mira-svg-animator` para ganhar um novo modo: além de animar UM svg (bater asas, girar roda, desenhar traço), ela passa a saber **transformar um svg em outro**, com uma morfagem **líquida, sólida, sem buracos**. Hoje a própria skill diz que "a forma não vira outra (isso é morph)" e deixa isso de fora; esta atualização traz a morfagem para dentro, como um tipo de movimento a mais. A técnica validada NÃO morfa a arte detalhada nem uma silhueta feita pela união de todos os paths (isso abre furos durante a transição). Ela extrai **um único contorno externo** (uma curva fechada só) de cada arte e morfa contorno em contorno com o **MorphSVGPlugin** do GSAP, enquanto a arte detalhada faz cross-fade com esse contorno nas pontas. As animações em loop de partes que a skill já sabe fazer (ex.: rodas girando, via recorte circular + `<use>`) continuam rodando o tempo todo, inclusive durante o morph. Tudo foi validado no slide 7 do deck `decks/testes-gsap/index.html` (moto vira carro) e esta spec é a fonte da verdade para reproduzir e generalizar o resultado dentro da `/mira-svg-animator`.

---

## 2. Contexto e Motivação

**Problema:**
A `/mira-svg-animator` anima UM svg, mas não sabe **transformar uma forma em outra**. O SKILL.md atual lista os movimentos (bater, girar, deslizar, pulsar, balançar, desenhar traço, percorrer curva) e afirma explicitamente que "a forma não vira outra (isso é morph)", colocando o morph fora do escopo. Quando o usuário pediu "a moto morfa nesse carro", não havia receita na skill, e as tentativas ingênuas falharam:

1. **Cross-dissolve** (uma arte some por opacidade enquanto a outra aparece): não lê como transformação, parece um corte/fade. Reprovado: "não está morfando um svg em outro".
2. **Morfar a silhueta concatenada** (unir todos os subpaths de cada arte num path só e morfar): durante a transição os subpaths de sentidos de preenchimento opostos se cruzam e o `fill-rule` **abre buracos** na imagem intermediária. Reprovado com print: "quando a moto vai virar um carro fica uns buracos na imagem".

**Evidências:**
Iteração visual no deck `decks/testes-gsap` (sandbox de GSAP), slide "Da moto ao carro", com `assets/moto.svg` e `assets/carro.svg` (ambos viewBox `0 0 1440 810`, ilustrações chapadas multi-path: 37 e ~30 paths, paletas totalmente diferentes). Casos concretos:
- Cross-dissolve: aprovado tecnicamente mas o usuário queria morph de verdade.
- Silhueta concatenada (moto 33 subpaths, carro 64 subpaths): no meio do morph aparecem furos e cacos (subpaths cruzando).
- Solução final (contorno único por arte): o quadro intermediário vira um blob sólido, sem furos, que escorre da forma da moto para a do carro. Aprovado: "ficou muito bom".

**Por que agora:**
O resultado foi validado e o sandeco quer **atualizar a `/mira-svg-animator`** para que a morfagem entre elementos seja feita sempre assim, evitando que outras sessões reinventem (e caiam de novo nos buracos). Esta spec congela a regra para a sessão que mantém a skill.

---

## 3. Goals (Objetivos)

- [ ] G-01: A `/mira-svg-animator` ganha um modo de morfagem: dada uma arte de origem A e uma de destino B, gera um slide onde A vira B com morph real (a forma de A transforma na de B), não cross-dissolve.
- [ ] G-02: A transição é **líquida e sólida**: em nenhum quadro intermediário aparece buraco, caco ou subpath solto.
- [ ] G-03: A morfagem é **reversível** (o gatilho alterna A para B e B para A) e ignora novo gatilho enquanto anima.
- [ ] G-04: As animações de parte que a skill já oferece (regra zero: roda girando etc.) continuam rodando antes, durante e depois do morph.
- [ ] G-05: O elemento morfado fica **centralizado** no palco, medindo o bounding box real das artes.
- [ ] G-06: Tudo roda offline: GSAP e MorphSVGPlugin vendorados; nenhum CDN em runtime; abre por `file://`.
- [ ] G-07: A extração do contorno único é determinística e reproduzível (mesma arte, mesmo contorno), gerada na criação do deck e embutida no HTML.
- [ ] G-08: O SKILL.md da `/mira-svg-animator` é atualizado: o morph deixa de ser "fora do escopo" e vira um movimento documentado, com o checklist e o scaffold correspondentes.

**Métricas de sucesso:**

| Métrica | Baseline atual | Target | Prazo |
|---|---|---|---|
| Morph elemento em elemento na `/mira-svg-animator` | inexistente (fora do escopo) | modo de morph funcionando | na atualização da skill |
| Quadros intermediários com buraco/caco | ocorre (silhueta concatenada) | 0 | na atualização da skill |
| Morph reversível e com loop de partes preservado | n/a | sim | na atualização da skill |
| Reprodução fiel do slide de referência | n/a | idêntico ao slide 7 de `decks/testes-gsap` aprovado | na atualização da skill |
| Dependências externas em runtime | n/a | 0 (GSAP + MorphSVG locais) | na atualização da skill |
| SKILL.md cobrindo o movimento "uma forma vira outra" | ausente (declarado fora de escopo) | presente, com scaffold e checklist | na atualização da skill |

---

## 4. Non-Goals (Fora do Escopo)

- NG-01: Não morfar **preservando as cores internas** de uma arte na outra (gradiente de tinta path a path). A morfagem é de **forma** (silhueta), com a arte detalhada entrando/saindo por cross-fade nas pontas. Morph colorido path a path entre ilustrações diferentes não fica limpo e está fora do escopo.
- NG-02: Não criar uma skill nova nem quebrar a `/mira-svg-animator`. O morph é um MODO a mais da MESMA skill; os modos existentes (bater asas, girar, desenhar traço, etc.) seguem iguais.
- NG-03: Não exigir que as duas artes tenham o mesmo número de paths, as mesmas cores, nem correspondência entre partes. A técnica do contorno único é agnóstica a isso.
- NG-04: Não fazer a extração de contorno em runtime no navegador do espectador como passo obrigatório. O contorno é calculado na geração do deck (build-time) e embutido como `d`. Runtime só roda GSAP + MorphSVG (leve).
- NG-05: Não tratar morph encadeado de 3+ estados como requisito desta versão (A para B para C). A versão 1.0 cobre dois estados reversíveis. Encadeamento fica como questão aberta.
- NG-06: Não animar a posição/escala das partes durante o morph (ex.: rodas viajando para a nova distância entre eixos). Versão 1.0 mantém as partes girando no lugar; deslocamento de partes fica para versão futura.

---

## 5. Usuários e Personas

**Usuário primário:** sandeco e operadores do Mira que querem um slide onde uma figura vira outra (logo vira logo, ícone vira ícone, moto vira carro, semente vira árvore) usando a `/mira-svg-animator`. Esperam o comando entregar o morph pronto, líquido.
**Usuário secundário:** a sessão/dev que vai atualizar o SKILL.md e a lógica da `/mira-svg-animator` a partir desta spec.

**Jornada atual (sem a feature):**
1. O usuário tem dois SVGs e quer que um vire o outro.
2. A `/mira-svg-animator` diz que morph está fora do escopo; tentativas manuais caem em cross-dissolve (fraco) ou silhueta concatenada (buracos).

**Jornada futura (com a feature):**
1. O usuário roda `/mira-svg-animator` no modo morph, apontando origem (A.svg), destino (B.svg), gatilho e (opcional) partes em loop.
2. A skill vendora o GSAP+MorphSVG, extrai o contorno único de A e de B, monta o slide no padrão do deck (artes sobrepostas, contorno morfável, centralizado) e injeta a timeline.
3. O usuário abre o slide, dispara (Enter/clique/scroll), vê A escorrer líquido até virar B, e voltar.

---

## 6. Requisitos Funcionais

### 6.1 Requisitos Principais

| ID | Requisito | Prioridade | Critério de Aceite |
|----|-----------|-----------|-------------------|
| RF-01 | A `/mira-svg-animator`, no modo morph, recebe: arte de origem A (svg), arte de destino B (svg), gatilho (enter/clique/scroll/auto), e lista opcional de partes em loop (seletor + tipo de animação + origem). Copia os SVGs para `assets/` do deck e nunca edita as fontes vinculadas. | Must | Rodar a skill no modo morph com dois SVGs gera um slide funcional; as fontes originais não são tocadas. |
| RF-02 | A skill vendora em `assets/gsap/` do deck só o necessário: `gsap.min.js` e `MorphSVGPlugin.min.js` (GSAP 3.13+, grátis desde 2025). Referência por caminho relativo; registra o plugin (`gsap.registerPlugin(MorphSVGPlugin)`). Nenhum CDN em runtime. | Must | `assets/gsap/` tem os dois arquivos; o HTML referencia local; abre por `file://` sem rede. |
| RF-03 | As duas artes devem compartilhar UM `<svg>` com o MESMO `viewBox`. Se os SVGs de origem tiverem viewBox diferentes, a skill normaliza (mesma caixa de coordenadas) antes de combinar. Cada arte fica num `<g id>` próprio; a de destino começa `opacity="0"`. | Must | O slide tem um `<svg>` com `#A-grupo` e `#B-grupo`; `#B-grupo` invisível no estado inicial; as duas no mesmo espaço de coordenadas. |
| RF-04 | A skill NÃO morfa a arte detalhada nem uma silhueta feita pela concatenação dos subpaths das artes. (Regra anti-buraco.) | Must | Inspeção: o alvo do morph é um `<path>` de contorno único (RF-05/RF-06), não o `<g>` de arte nem um path com dezenas de subpaths. |
| RF-05 | Para cada arte, a skill extrai **um contorno externo único** (uma subcurva fechada) pelo pipeline: rasterizar a arte num canvas, ler o alpha, fechar frestas com morfologia (dilate+erode), pegar o maior componente conexo, traçar a borda (Moore-neighbor 8-conexo), simplificar (Ramer-Douglas-Peucker) e suavizar (Catmull-Rom para bézier). Resultado em coordenadas absolutas do viewBox. | Must | Cada contorno é um `<path>` com UM `M...Z` (uma subcurva); preenchido sólido não tem buraco interno; segue a borda real da arte (inclui a concavidade entre as rodas). |
| RF-06 | O elemento que de fato morfa é um único `<path id="morph">` preenchido sólido (cor primária do tema + leve glow), `fill-rule="nonzero"`, que começa com o `d` do contorno de A. | Must | Existe `#morph` no SVG; `fill` usa a cor do tema; `d` inicial == contorno de A. |
| RF-07 | A transição (timeline GSAP) tem 3 fases: (1) arte A some por opacidade e o contorno aparece (~0.28s); (2) o contorno morfa de A para B via `morphSVG:{shape:'#contorno-B', shapeIndex:'auto'}` (~0.95s, ease `power2.inOut`); (3) o contorno some e a arte B aparece (~0.35s). | Must | Ao disparar, vê-se a arte virar contorno sólido, o contorno escorrer até a forma de B, e B aparecer. Sem buraco em nenhum quadro. |
| RF-08 | A morfagem é reversível: o gatilho alterna o destino (A para B, depois B para A). Uma trava `animando` ignora novo gatilho enquanto a timeline roda. | Must | Disparar duas vezes leva A->B->A; disparos durante a animação são ignorados. |
| RF-09 | O gatilho é configurável e escopado ao slide ativo. Para teclado/clique, só dispara quando o palco está em tela (checagem via `getBoundingClientRect`), para não conflitar com a navegação do deck. | Must | Em um deck multi-slide, o gatilho do morph só age quando o slide do morph está visível; não interfere nas setas de navegação. |
| RF-10 | As partes em loop (regra zero) continuam rodando antes, durante e depois do morph, inclusive nas artes ocultas. Para girar uma parte de um SVG fundido, reutilizar a técnica que a skill já tem: recorte circular + cópia `<use>` girando em torno do centro. | Must | Ex.: as rodas das duas artes giram sem parar; ao fim do morph a arte de destino já aparece com as rodas girando. |
| RF-11 | O elemento morfado fica centralizado: a skill mede o bounding box real de cada arte (`getBBox`) e define o `viewBox` do slide enquadrando o conteúdo (centro do destino no centro do quadro), com margem. | Must | A arte de destino aparece centrada no palco, sem sobra grande de um lado; medido pelo bbox, não pelo viewBox bruto do SVG de origem. |
| RF-12 | `prefers-reduced-motion`: sem giro de partes e sem morph animado; o gatilho faz troca instantânea (A oculta, B visível). | Must | Com reduced-motion ativo, disparar troca A por B na hora, sem loop e sem transição. |
| RF-13 | A extração de contorno acontece na **geração** do deck (build-time), e os dois `d` resultantes ficam embutidos no HTML. Runtime não rasteriza nem traça nada. | Must | O HTML final contém os `d` dos contornos; abrir o slide não dispara canvas/tracing; só GSAP+MorphSVG rodam. |
| RF-14 | Atualizar o SKILL.md da `/mira-svg-animator`: o morph deixa de ser declarado "fora do escopo"; vira um movimento documentado ("uma forma vira outra"), com o scaffold (seção 8) e o checklist desta spec; mantendo os movimentos antigos intactos. | Must | O SKILL.md não diz mais que a forma não pode virar outra; tem a seção de morph com scaffold e checklist. |
| RF-15 | Texto visível em pt-br correto; proibido travessão. Card no padrão do deck: título sem ícone, no máximo 6 palavras; marcador `@MIRA:SIZE`. | Must | Revisão não acha travessão; acentuação correta; título curto sem ícone. |

### 6.2 Fluxo Principal (Happy Path)

1. O usuário roda `/mira-svg-animator` no modo morph com A.svg (origem), B.svg (destino), gatilho e partes em loop opcionais.
2. A skill copia A.svg e B.svg para `assets/` e vendora `gsap.min.js` + `MorphSVGPlugin.min.js` em `assets/gsap/` (RF-02).
3. A skill normaliza as duas para o mesmo viewBox e mede o bbox de cada uma (RF-03, RF-11).
4. A skill extrai o contorno único de A e de B (RF-05), em coordenadas absolutas, na geração (RF-13).
5. A skill monta o SVG do slide: `#A-grupo` (com partes em loop) + `#B-grupo` (oculto, com partes em loop) + `#morph` (contorno de A, cor do tema + glow) + paths-fonte dos contornos de A e B no `<defs>` (RF-06, RF-10).
6. A skill define o `viewBox` centralizando o conteúdo (RF-11) e injeta a timeline reversível (RF-07, RF-08) com gatilho escopado (RF-09) e fallback reduced-motion (RF-12).
7. A skill reporta o caminho do slide, o movimento numa frase, o gatilho, e que abre por `file://`.

### 6.3 Fluxos Alternativos

**Fluxo Alternativo A, arte com partes em loop (ex.: veículo com rodas):**
1. O usuário passa os seletores das partes e seus centros.
2. A skill adiciona, em cada arte, o recorte circular + `<use>` girando (RF-10) e mantém os tweens infinitos rodando independente do morph.

**Fluxo Alternativo B, origem com viewBox diferente do destino:**
1. A skill normaliza ambos para uma caixa comum (translada/escala para o mesmo viewBox) antes de extrair contornos e combinar (RF-03).

**Fluxo Alternativo C, gatilho automático ou por scroll:**
1. Em vez de Enter, a skill liga o morph a um IntersectionObserver (dispara quando o slide entra) ou a um timer/clique, mantendo a trava `animando` e a reversibilidade.

---

## 7. Requisitos Não-Funcionais

| ID | Requisito | Valor alvo | Observação |
|----|-----------|-----------|------------|
| RNF-01 | Sem buracos (anti-furo) | 0 furos em qualquer quadro | Garantido por construção: morph de contorno ÚNICO (uma subcurva fechada) para contorno único. |
| RNF-02 | Offline total | 0 dependências de rede em runtime | GSAP + MorphSVGPlugin vendorados; referência relativa; abre por `file://`. |
| RNF-03 | Custo do contorno | ~50 a 150 pontos por contorno | RDP com epsilon ajustável; suave o bastante para ler liso, leve o bastante para o MorphSVG. |
| RNF-04 | Robustez do tracer | Fecha frestas, pega o maior componente | Close morfológico (dilate+erode) une partes encostadas; `largest connected component` descarta cacos soltos. |
| RNF-05 | Preservação de comportamento | Os modos antigos da skill, o loop interno das partes, a navegação do deck e os gatilhos seguem funcionando | O morph é aditivo; não pausa nem mata os tweens das partes (alvos diferentes). |
| RNF-06 | Reversibilidade estável | A->B->A sem acúmulo de estado | `morphSVG` parte sempre do `d` corrente; trava `animando` evita timelines sobrepostas. |
| RNF-07 | Idioma e estilo | pt-br correto, sem travessão | Segue `agents/_shared/idioma.md`. |

---

## 8. Design e Interface

**Componentes afetados:** SKILL.md da `/mira-svg-animator` (novo movimento "uma forma vira outra", com scaffold e checklist); um novo slide (`<section>`) no deck, com um `<svg>` combinando as duas artes e o contorno morfável; tags de `<script>` do GSAP e do MorphSVGPlugin no `<head>`; um IIFE com os giros de parte e a timeline de morph. Uma ferramenta de **build-time** (headless Chrome ou equivalente) para extrair os contornos.

### 8.1 Estrutura do SVG do slide (a skill deve gerar este esqueleto)

```html
<svg id="morph-svg" viewBox="MINX MINY W H" preserveAspectRatio="xMidYMid meet"
     xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <!-- clipPaths originais das duas artes + clips circulares das partes que giram -->
    <clipPath id="A-clip-1"><circle cx="CX" cy="CY" r="R"/></clipPath>
    <!-- ... -->
    <!-- paths-fonte dos contornos (nao renderizam; o MorphSVG le o d) -->
    <path id="sil-A" d="CONTORNO_A_UNICO_Z"/>
    <path id="sil-B" d="CONTORNO_B_UNICO_Z"/>
  </defs>

  <!-- ARTE A (detalhada) + partes em loop -->
  <g id="A-grupo">
    <g id="A-art"> ...paths de A... </g>
    <g clip-path="url(#A-clip-1)"><g id="A-parte-1"><use href="#A-art"/></g></g>
  </g>

  <!-- ARTE B (detalhada), comeca oculta -->
  <g id="B-grupo" opacity="0">
    <g id="B-art"> ...paths de B... </g>
    <g clip-path="url(#B-clip-1)"><g id="B-parte-1"><use href="#B-art"/></g></g>
  </g>

  <!-- elemento que MORFA: contorno unico, solido, cor do tema + glow. Comeca na forma de A -->
  <path id="morph" d="CONTORNO_A_UNICO_Z" fill="var(--mira-primary)" fill-rule="nonzero"
        opacity="0" style="filter:drop-shadow(0 0 22px rgba(66,136,241,0.55))"/>
</svg>
```

### 8.2 Timeline do morph (a skill deve injetar esta lógica)

```js
(function () {
  if (typeof gsap === "undefined") return;
  if (window.MorphSVGPlugin) gsap.registerPlugin(MorphSVGPlugin);
  const REDUCE = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // 1) partes em loop (regra zero): giram sempre, inclusive nas artes ocultas
  if (!REDUCE) {
    const girar = (sel, cx, cy) => gsap.to(sel, {
      rotation: 360, svgOrigin: cx + " " + cy, duration: 1.5, ease: "none", repeat: -1
    });
    girar("#A-parte-1", AX, AY);  // ex.: rodas
    girar("#B-parte-1", BX, BY);
  }

  let atual = "A", animando = false;
  const stage = document.getElementById("morph-stage");
  function noSlide() { const r = stage.getBoundingClientRect(); return r.top < innerHeight*0.65 && r.bottom > innerHeight*0.35; }

  // 2) morph de CONTORNO UNICO -> CONTORNO UNICO (liquido, sem buraco)
  function morph(destino) {
    const sai   = destino === "B" ? "#A-grupo" : "#B-grupo";
    const entra = destino === "B" ? "#B-grupo" : "#A-grupo";
    const alvo  = destino === "B" ? "#sil-B"   : "#sil-A";
    atual = destino;
    if (REDUCE) { gsap.set(sai, {opacity:0}); gsap.set(entra, {opacity:1}); return; }
    animando = true;
    gsap.timeline({ onComplete(){ animando = false; } })
      .to(sai,      { opacity: 0, duration: 0.28, ease: "power1.in" }, 0)
      .to("#morph", { opacity: 1, duration: 0.28, ease: "power1.in" }, 0)
      .to("#morph", { morphSVG: { shape: alvo, shapeIndex: "auto" }, duration: 0.95, ease: "power2.inOut" }, 0.2)
      .to("#morph", { opacity: 0, duration: 0.32, ease: "power1.out" }, 1.0)
      .to(entra,    { opacity: 1, duration: 0.38, ease: "power1.out" }, 1.0);
  }

  // 3) gatilho escopado ao slide ativo, reversivel, com trava
  window.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" || !noSlide() || animando) return;
    e.preventDefault();
    morph(atual === "A" ? "B" : "A");
  });
})();
```

### 8.3 Extração do contorno único (ferramenta de build-time, algoritmo de referência)

Roda na geração do deck (headless Chrome serve), por arte, e devolve UM `d` de curva fechada em coordenadas absolutas do viewBox. Validado neste projeto.

```js
// W,H = resolucao do raster (ex.: 480x270 para um viewBox 1440x810); SX,SY = viewBoxW/W, viewBoxH/H
// 1. rasterizar a arte num canvas (data URL via XMLSerializer) e ler o alpha
// 2. mask = alpha > 50
// 3. close morfologico: dilate(2) depois erode(2)  -> fecha frestas sem inchar; depois dilate(1) leve -> mais liquido
// 4. largest(): manter so o maior componente conexo (8-conn) -> descarta cacos soltos
// 5. trace(): Moore-neighbor 8-conexo, sentido horario, criterio de parada de Jacob -> borda ordenada
// 6. rdp(pts, ~1.1): simplificar (Ramer-Douglas-Peucker)
// 7. smoothClosed(): Catmull-Rom -> bezier cubico fechado, escalando por (SX,SY)
//    d = "M x0 y0 C ... C ... Z"   (UMA subcurva fechada)
```

Pontos chave do algoritmo (os que evitam os erros conhecidos):
- **Só o contorno EXTERNO.** O Moore tracing pega a borda do componente; furos internos (vão entre rodas que é fechado, miolo de roda) viram região cheia, porque não traçamos contornos internos. Resultado: silhueta sólida.
- **Close morfológico antes de traçar.** Junta partes que se encostam (ex.: para-lama tocando o pneu) num componente só e arredonda de leve, deixando o morph mais líquido.
- **Maior componente conexo.** Se a arte tem um caco solto (ex.: espelho destacado no raster), ele é descartado para manter UM contorno. Se uma parte importante ficar solta, aumentar o `dilate` do close para reconectar.

### 8.4 Centralização (build-time)

```js
// medir o bbox de cada arte com getBBox (headless) e enquadrar:
// cx = centro do conteudo de destino (B); H precisa incluir A e B
// viewBox = "MINX MINY W H" com (MINX+W/2, MINY+H/2) == centro do destino
// ex. validado (moto+carro, viewBox de origem 1440x810): "87 38 1320 776" centraliza o carro (centro 747,426)
```

**Estados da UI:**
- Estado inicial: arte A visível, com partes em loop girando; B oculta.
- Durante o morph: contorno sólido (cor do tema + glow) escorrendo de A para B; sem buracos.
- Estado final: arte B visível, partes girando; reversível pelo mesmo gatilho.
- reduced-motion: troca instantânea, sem loop e sem transição.

---

## 9. Modelo de Dados

> Não aplicável. A feature gera HTML estático (um slide). Os únicos "dados" são os dois `d` de contorno embutidos no HTML, calculados na geração. Não há persistência nem migração.

---

## 10. Integrações e Dependências

| Dependência | Tipo | Impacto se indisponível |
|-------------|------|------------------------|
| GSAP 3.13+ (`gsap.min.js`) | Obrigatória (vendorada) | Sem ela não há timeline; vendorar em `assets/gsap/`. |
| MorphSVGPlugin (`MorphSVGPlugin.min.js`, grátis desde 2025) | Obrigatória (vendorada) | Sem ele não há morph de forma; vendorar junto. Baixar de cdnjs 3.13.0 na geração e referenciar local. |
| Dois SVGs de origem/destino (artes chapadas, viewBox conhecido) | Obrigatória | Sem as duas artes não há o que morfar; abortar com mensagem clara. |
| Headless Chrome/Edge (ou equivalente com canvas + getBBox) na GERAÇÃO | Obrigatória em build-time | Usado para rasterizar/traçar contorno e medir bbox. Não é dependência de runtime. Rodar com `--allow-file-access-from-files` para o canvas não dar taint ao ler o SVG. |
| Técnica de giro de parte já presente na `/mira-svg-animator` (clip circular + `<use>`) | Opcional | Só quando houver partes em loop (rodas, hélices). |

---

## 11. Edge Cases e Tratamento de Erros

| Cenário | Trigger | Comportamento esperado |
|---------|---------|----------------------|
| EC-01: Subpaths com sentidos de preenchimento opostos | Silhueta concatenada (abordagem errada) | NÃO usar. Usar contorno único (RF-05): por construção não há subpath para se cruzar, então não há buraco. |
| EC-02: Arte com parte destacada no raster (ex.: espelho da moto) | `largest()` descarta o caco | Se a parte for importante e sumir, aumentar o `dilate` do close para reconectar antes de traçar; reavaliar. |
| EC-03: Furo interno fechado (miolo de roda, vão entre rodas se enclausurado) | Tracer ignora contornos internos | Vira região cheia (silhueta sólida). É o comportamento desejado para morph líquido. |
| EC-04: Origem e destino com viewBox diferentes | SVGs de proveniências distintas | Normalizar para uma caixa comum antes de combinar e traçar (RF-03). Se as proporções diferirem muito, enquadrar pelo bbox da união. |
| EC-05: Artes muito diferentes em silhueta (poucos vs muitos pontos) | Contornos com contagens de pontos distintas | OK: o MorphSVG subdivide para casar; `shapeIndex:"auto"` alinha o ponto de partida para o morph não rodar de um jeito estranho. |
| EC-06: Dente/ponta feia no contorno (ex.: guidão fino vira espinho) | Detalhe fino e isolado vira ponta na silhueta | Aumentar o fechamento morfológico (dilate maior) e/ou o epsilon do RDP para arredondar; é trade-off entre fidelidade e suavidade. |
| EC-07: Gatilho disparado fora do slide do morph | Tecla/clique em outro slide | Gate por `getBoundingClientRect` ignora; não conflita com a navegação (que usa setas, não Enter). |
| EC-08: Gatilho repetido durante a animação | Spam de Enter/clique | Trava `animando` ignora até a timeline terminar. |
| EC-09: Canvas com taint ao rasterizar (build-time) | Política do navegador headless | Rodar com `--allow-file-access-from-files`; SVG sem recursos externos não suja o canvas. |
| EC-10: Plugin MorphSVG ausente/não carregado | Falha ao vendorar | `if (window.MorphSVGPlugin) gsap.registerPlugin(...)`; sem ele, fazer fallback para troca instantânea e avisar na geração. |
| EC-11: Verificação headless do morph (teste) | Ticker rAF não roda sob `--virtual-time-budget` | Forçar o avanço com `gsap.globalTimeline.time(t)` para medir/screenshotar o estado em t; conferir que o `d` interpola e que não há buraco no quadro do meio. |
| EC-12: reduced-motion | Usuário com preferência de menos movimento | Troca instantânea, sem morph nem loop (RF-12). |

---

## 12. Segurança e Privacidade

> Não aplicável em termos de dados. A skill gera HTML estático local e vendora bibliotecas open source (GSAP + MorphSVGPlugin, licença redistribuível desde 2025). Observação operacional: nunca tocar nas fontes vinculadas do Mira; copiar os SVGs para `assets/` do deck e trabalhar nas cópias.

---

## 13. Plano de Rollout

- **Estratégia:** atualizar o SKILL.md da `/mira-svg-animator` adicionando o movimento "uma forma vira outra" (scaffold da seção 8 + checklist), a ferramenta de extração de contorno (build-time) e a regra anti-buraco. Registrar esta spec em `specs/GSAP/` como fonte da verdade, ao lado da spec base da `/mira-svg-animator`.
- **Como reverter (rollback):** a skill é versionada; reverter o SKILL.md para a versão anterior. Slides já gerados são HTML estático e não são afetados.
- **Monitoramento pós-deploy:** gerar 1 ou 2 morphs de pares diferentes (ex.: logo->logo, ícone->ícone) e conferir: morph real (não cross-dissolve), zero buracos no quadro do meio, reversível, partes em loop preservadas, centralizado, offline, sem travessão; e que os modos antigos da skill seguem funcionando.

---

## 14. Open Questions

| # | Pergunta | Impacto | Dono | Prazo |
|---|---------|---------|------|-------|
| OQ-01 | Suportar morph encadeado de 3+ estados (A->B->C) e/ou um "carrossel de formas"? Hoje é dois estados reversíveis. | Médio | sandeco | versão futura |
| OQ-02 | A cor/glow do contorno deve ser sempre a primária do tema, ou parametrizável (ex.: gradiente entre a cor de A e a de B)? Hoje é a primária. | Baixo | sandeco | ao fechar a atualização |
| OQ-03 | Deslocar as partes durante o morph (ex.: rodas viajando para a nova distância entre eixos) para vender ainda mais a transformação? Hoje giram no lugar. | Médio | sandeco | versão futura |
| OQ-04 | A extração de contorno deve virar um utilitário reaproveitável dentro da `/mira-svg-animator` (também útil no movimento "o traço se desenha")? | Médio | sandeco | ao fechar a atualização |
| OQ-05 | Parametrizar a resolução do raster e o epsilon do RDP por arte (controle fino de suavidade vs fidelidade), ou deixar defaults validados? | Baixo | sandeco | opcional |

---

## 15. Decisões Tomadas (Decision Log)

| Decisão | Alternativas consideradas | Racional |
|---------|--------------------------|---------|
| Morph é um MODO da `/mira-svg-animator`, não skill nova | Criar `/mira-svg-morph` separada | O morph é "dar vida a um svg" no mesmo espírito da skill; reaproveita o giro de parte, o scaffold de card, o vendor de GSAP e a regra zero. Manter numa skill só evita duplicação e confusão. |
| Morfar UM contorno externo por arte | (a) cross-dissolve; (b) silhueta concatenando todos os subpaths; (c) morph path a path da arte colorida | (a) não lê como transformação; (b) abre buracos (subpaths de sentidos opostos se cruzam); (c) impraticável entre ilustrações diferentes. Contorno único é sólido por construção, líquido, e agnóstico a contagem de paths/cores. |
| Extrair o contorno por raster + boundary tracing | (a) união booleana com biblioteca de geometria (paper.js, clipper); (b) silhueta radial a partir do centroide | (a) pesado e exige libs; (b) falha em formas côncavas (rodas, vãos). Raster + Moore tracing + RDP + suavização é robusto, sem dependência de runtime, e roda no próprio Chrome headless da geração. |
| Cross-fade arte<->contorno nas pontas | Mostrar só o contorno o tempo todo, ou só a arte | A arte detalhada entra/sai por opacidade enquanto o contorno cobre a fase de transformação; assim o espectador vê a figura detalhada virar uma forma sólida, escorrer, e virar a outra figura detalhada. |
| Contorno calculado em build-time e embutido | Traçar em runtime no navegador do espectador | Tracing usa canvas e é assíncrono/pesado; em runtime atrasaria o slide. Build-time embute só dois `d` curtos; runtime roda apenas GSAP+MorphSVG. |
| Partes em loop continuam girando (alvos separados do morph) | Pausar os giros durante o morph | Mantém a regra zero do Mira e dá continuidade: a arte de destino já surge com as partes em movimento. Os tweens de parte têm alvos diferentes da timeline de morph, então não conflitam. |
| Centralizar medindo o bbox real (getBBox) | Usar o viewBox bruto do SVG de origem | O conteúdo raramente preenche o viewBox de origem de forma centrada; medir o bbox e enquadrar pelo centro do destino coloca a figura no centro do palco. |
| `shapeIndex:"auto"` no morphSVG | Índice fixo / sem alinhamento | Alinha automaticamente o ponto de partida das duas curvas, evitando que o morph gire/torça de forma estranha. |

---

## Apêndice

### Referências
- Slide de referência aprovado: `decks/testes-gsap/index.html`, slide 7 "Da moto ao carro" (origem `assets/moto.svg`, destino `assets/carro.svg`).
- Skill a atualizar: `.claude/skills/mira-svg-animator/SKILL.md` (hoje declara o morph fora do escopo; reaproveitar a técnica de giro de parte, clip circular + `<use>`).
- Plugins GSAP gratuitos desde 2025: vendorar `gsap.min.js` e `MorphSVGPlugin.min.js` (cdnjs 3.13.0) na geração; nenhum CDN em runtime.
- Convenção de idioma: `agents/_shared/idioma.md` (pt-br correto, sem travessão).

### Glossário rápido
- **Contorno único:** uma única subcurva fechada (`M...Z`) que descreve a borda externa de uma arte. Sólido quando preenchido, sem buracos internos.
- **Silhueta concatenada (NÃO usar):** path feito juntando o `d` de todos os subpaths de uma arte. Durante o morph, abre buracos.
- **Close morfológico:** dilate seguido de erode sobre a máscara de alpha; fecha frestas e arredonda de leve.
- **Moore-neighbor tracing:** algoritmo clássico para extrair a borda ordenada de um componente em uma máscara binária.

### Histórico de Revisões
| Versão | Data | Autor | Mudanças |
|--------|------|-------|---------|
| 1.0 | 2026-06-19 | sandeco (via sessão Claude Code) | Criação inicial, congelando a técnica de morfagem líquida (contorno único + MorphSVG) validada no slide 7 de `decks/testes-gsap`, como atualização da `/mira-svg-animator`. |
