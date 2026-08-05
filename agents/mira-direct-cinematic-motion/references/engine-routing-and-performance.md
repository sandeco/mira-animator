# Roteamento de stack e performance

## Sumário

1. O que o MIRA usa
2. Matriz de decisão
3. O que está fora
4. Orçamentos
5. Fallbacks

## 1. O que o MIRA usa

O MIRA não tem motor de animação. A cena é escrita caso a caso, dentro do `index.html` do deck, e roda por `file://` com duplo clique, sem build, sem servidor e sem rede. Três stacks cobrem tudo:

| Stack | Papel |
|---|---|
| **D3 v7 com SVG** | geometria, dados, escalas, trajetórias, caminhos traçados. Rota padrão |
| **GSAP pelo `mira-cinema.js`** | tempo, timeline com labels, câmera por `viewBox`, planos de profundidade, grade de cor, fator de ritmo |
| **CSS 3D** | virada de face, perspectiva, cascata |

O `mira-cinema.js` é código-fonte versionado, copiado para `mira/` do deck. **Não é gerado por LLM a cada deck**, e a premissa de que a biblioteca reduz a variância do gerador cai por terra se ele for reescrito a cada uso.

## 2. Matriz de decisão

| Necessidade | Stack | Observação |
|---|---|---|
| Dados e layout | D3 | Calcular com D3, coreografar com a timeline |
| Objetos semânticos, morph simples, traçado | D3 com SVG | `attrTween`, `stroke-dashoffset` |
| Muitos beats encadeados | GSAP com labels | Substitui o delay acumulado calculado à mão |
| Enquadramento que se move | `Cam.*` do `mira-cinema.js` | Anima `cena.camera`, o tique escreve o `viewBox` |
| Profundidade e parallax | `Prof.plano` | 3 a 5 planos, com oclusão declarada |
| Clima de cor do deck | `Grade.aplicar` | Um preset por deck, aplicado ao palco |
| Face que esconde outra | CSS 3D | `perspective`, `preserve-3d`, `backface-visibility` |

## 3. O que está fora

Fora do escopo, por decisão de produto, não por falta de tempo:

- PixiJS ou Three.js como renderizador do palco;
- Lottie, Rive, Motion Canvas, Paper.js;
- Deck IR, compilador, importador de HTML legado, adaptador de cena;
- qualquer coisa que exija servidor ou build.

**Duas portas ficam abertas, com condição declarada:**

- **Three.js** para uma cena isolada cuja semântica exija órbita real, servida por `mira-serve`. Caso pontual, nunca plataforma. Hoje existe como `/mira-3d`.
- **PixiJS** dentro de uma futura camada de atmosfera, e só se o experimento de custo justificar e o build global carregar em `file://`.

Fora dessas duas, propor motor novo é reabrir uma decisão fechada, e exige revisão da spec, não improviso na cena.

## 4. Orçamentos

Registrar por cena:

- nós do SVG ativos;
- planos de profundidade: 3 a 5, nunca mais;
- filtros: raio de desfoque no máximo 4, e desfoque animado só na troca de foco;
- grão: estático, sempre;
- glow: no máximo 1 elemento por cena;
- listeners, observers e timers, com o ponto onde cada um é liberado;
- tempo estimado de entrada da cena.

Filtro de tela cheia animado é o item mais caro do quadro. Palco fora de tela não deve ticar.

## 5. Fallbacks

Ordem típica:

```text
GSAP com câmera e planos → D3 com SVG sem câmera → estados estáticos sequenciais
```

O deck sem o `mira-cinema.js` cai no segundo degrau inteiro, e a cena precisa continuar contando a história ali. É a mesma trava do cinema desligado, vista pelo lado da robustez.

O fallback deve preservar:

- relação conceitual;
- ação dominante;
- ordem das revelações;
- texto ou evidência indispensável;
- transição causal.

Nunca usar fallback apenas como imagem vazia quando a ação ensina o conceito.
