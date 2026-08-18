> Documento entregue pelo autor em 2026-08-18 junto com o `/reversa-debugger`.
> Copiado aqui VERBATIM como evidência do relato. É uma **proposta normativa do autor**,
> não spec efetiva: não está em `_reversa_sdd/` e não tem adendo. Ver os bugs deste contexto.

# Especificação de Arquitetura: Sincronização Determinística de Tempo e Passagem de Slides (Mira)

**Status:** Proposta Normativa / Correção Geral
**Escopo:** Todos os decks e templates do ecossistema Mira (`mira-default`, `mira-sequence`, `mira-animator`, `aula-capitulo`, etc.)
**Objetivo:** Eliminar o vazamento de frames de slides futuros e descontinuidade temporal em transições animadas.

---

## 1. O Problema Geral

Em apresentações interativas com HTML, D3.js e SVG, dois problemas recorrentes quebram a ilusão de continuidade e causam saltos visuais:

1. **Vazamento Temporal de Relógio (Timer Leak):**
   * Se um slide inicia um timer (`d3.timer`, `requestAnimationFrame`, `setInterval` ou timeline GSAP) antes de entrar na tela, o tempo decorrido (`elapsed`) continua avançando em segundo plano.
   * Ao navegar para o slide, a animação não começa do início: o espectador vê a cena já no meio ou no fim do ciclo.

2. **Vazamento Espacial de Interpolação (Scroll/Frame Leak):**
   * Quando o CSS global define `html { scroll-behavior: smooth }`, comandos padrão como `scrollIntoView({ behavior: 'instant' })` podem sofrer interpolação em navegadores modernos (Chrome, Edge, Safari), deixando vazar visualmente a rolagem e os frames intermediários do slide seguinte.

---

## 2. Pilares da Solução Normativa

Para garantir que **qualquer deck** funcione com precisão cirúrgica de tempo e corte seco, a especificação define quatro regras inegociáveis.

```
+-----------------------------------------------------------------------------+
|                               MIRA ENGINE                                   |
|                                                                             |
|  [ Slide Fora da Tela ]  ---> Executa quadro(0) contínuo (congelado no t=0) |
|  [ Slide Entra na Tela ] ---> Reseta relógio: ms_local = ms - t_entrada     |
|  [ Passagem de Sequência]---> window.scrollTo(instant) em corte absoluto    |
|  [ Gravação de Pose ]    ---> Guarda ms > 0 (nunca sobrescreve com t=0)     |
+-----------------------------------------------------------------------------+
```

---

## 3. Regras Arquiteturais Obrigatórias

### Regra 1: O Regente de Tempo Universal (`reger`)

Todo slide com animação baseada em tempo **NUNCA** deve instanciar `d3.timer` direto com contagem global. Deve sempre ser acoplado a uma função regente que gerencia o ciclo de vida via `IntersectionObserver`.

* **Comportamento quando fora da tela (`visivel === false`):**
  * Invoca `quadro(0)` a cada frame.
  * O slide fica perfeitamente desenhado na sua pose inicial (0 ms), pronto para ser exibido instantaneamente sem telas pretas.
* **Comportamento ao entrar na tela (`visivel === true`):**
  * Trava `state.relogio = ms_global`.
  * Fornece à função de desenho apenas o tempo relativo: `ms_local = ms_global - state.relogio`.
  * Garante que o primeiro frame visível seja rigorosamente 0 ms.

### Regra 2: Corte Seco Absoluto na Navegação Sequencial

Para slides que compõem uma sequência contínua (`data-mira-seq` e `data-mira-seq-de`), o mecanismo de navegação deve usar salto por coordenadas absolutas em vez de rolagem relativa:

```javascript
// CORRETO (Corte Seco Garantido em nível de viewport):
window.scrollTo({ top: secaoAlvo.offsetTop, behavior: 'instant' });

// INCORRETO (Pode herdar interpolação suave do CSS html):
secaoAlvo.scrollIntoView({ behavior: 'instant' });
```

### Regra 3: Guarda de Gravação de Pose Viva (`ms > 0`)

Ao gravar a pose viva no barramento compartilhado (`MiraSeq.gravar`), a gravação **deve conter a guarda `ms > 0`**:

```javascript
// CORRETO: Só grava se a animação estiver em execução ativa
if (ms > 0) {
    MiraSeq.gravar('id_da_cena', poseAtual);
}
```

* **Motivo:** como o regente chama `quadro(0)` enquanto o slide está congelado ou ao sair da tela, a ausência de `ms > 0` sobrescreveria a pose de entrega viva pelo frame zero, quebrando a posição que o slide seguinte esperava receber.

### Regra 4: Portão Matemático do Frame Zero na Continuação

Na função do slide de continuação, a equação de posição avaliada em ms = 0 **deve retornar exatamente a pose recebida (`base`)**:

    Posição(0) === base

* Exemplo com seno/cosseno:
  * `y = base.y - amplitude * (0.5 - 0.5 * Math.cos(2 * Math.PI * ms / CICLO))` em ms = 0, cos(0) = 1, logo y = base.y (Válido).
  * `y = base.y - amplitude * Math.sin(...)` com fase diferente de 0, em ms = 0, gera salto (Inválido).

---

## 4. Implementação Padrão de Referência (Drop-in Code)

Injetar este bloco no gerenciador de animação de qualquer template do Mira:

```javascript
/* ==========================================================
   MIRA ENGINE: REGENTE DE TEMPO E ANTI-VAZAMENTO DE FRAMES
   ========================================================== */

window.__miraSeq = window.__miraSeq || {};
var MiraSeq = {
    gravar: function (id, pose) { if (pose) window.__miraSeq[id] = pose; },
    ler: function (id) { return window.__miraSeq[id] || null; }
};

var RELOGIOS = {};

function reger(svgId, quadro) {
    var svg = document.getElementById(svgId);
    var slide = svg ? svg.closest('section') : null;
    if (!slide) return;

    RELOGIOS[svgId] = {
        relogio: null,
        visivel: false,
        forceReset: function () { this.relogio = null; }
    };

    var state = RELOGIOS[svgId];

    // Loop sincronizado: congelado em 0 quando fora da tela
    d3.timer(function (ms) {
        if (!state.visivel) {
            quadro(0);
            return;
        }
        if (state.relogio === null) {
            state.relogio = ms;
        }
        quadro(ms - state.relogio);
    });

    // Observer com threshold de 50% de área útil
    var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            var isVis = e.isIntersecting;
            if (isVis !== state.visivel) {
                state.visivel = isVis;
                if (isVis) {
                    state.relogio = null; // Reinicia a contagem no instante da entrada
                }
            }
        });
    }, { threshold: 0.5 });

    obs.observe(slide);
}

/* ==========================================================
   NAVEGAÇÃO COM CORTE SECO (SEM INTERPOLAÇÃO DE FRAMES)
   ========================================================== */
function navegarSlide(secoes, deIndex, paraIndex) {
    var de = secoes[deIndex];
    var para = secoes[paraIndex];
    var origem = de ? de.getAttribute('data-mira-seq') : null;
    var ehPar = origem && para && para.getAttribute('data-mira-seq-de') === origem;

    if (ehPar) {
        // Corte seco absoluto no par
        window.scrollTo({ top: para.offsetTop, behavior: 'instant' });
    } else {
        // Rolagem suave para slides normais
        para.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}
```

---

## 5. Checklist de Validação para o `/mira-validator`

Antes de aprovar qualquer deck animado ou sequencial:

- [ ] **Sem timers órfãos:** nenhum slide chama `d3.timer`, `setTimeout` em cadeia ou `setInterval` sem passar pelo `reger(svgId, quadro)`.
- [ ] **Quadro zero testado:** ao carregar a página e rolar para o meio do deck após 10 segundos, o slide entra rigorosamente no frame zero da sua história.
- [ ] **Guarda `ms > 0` presente:** toda instrução `MiraSeq.gravar` está dentro de `if (ms > 0)`.
- [ ] **Corte de rolagem testado:** ao avançar entre slides com `@MIRA:SEQ`, nenhum frame em movimento do slide inferior é avistado durante a transição.
- [ ] **Plano B obrigatório:** todo slide de continuação define `posePlanoB()` para ser renderizado individualmente sem erro caso acessado diretamente via link ou `/mira-slide-to-video`.
