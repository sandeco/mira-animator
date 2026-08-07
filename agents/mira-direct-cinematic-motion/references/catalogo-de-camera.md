# Catálogo de câmera: a bolsa de ferramentas

Este arquivo **não é uma fila de trabalho**. É o inventário do que a linguagem de câmera oferece,
com o estado de cada peça no MIRA, para quando uma cena pedir.

Consulte quando a intenção dramática não couber nos cues que você já usa. Antes de descrever um
movimento, confira aqui se ele existe, se é barato ou se está fora do motor. Descrever efeito que o
motor não faz é instruir o implementador a inventar.

Fonte da linguagem: `evolução/camera efeitos/efeitos-cinematograficos-camera-mira.md`.
Verificação contra o código: `mira-cinema.js`, agosto de 2026.

---

## O teto de tudo: a câmera é um `viewBox`

O motor escreve quatro números por quadro: `x y largura altura`. Daí saem **deslocar** e **escalar**,
e nada mais. O que falta é o que separa o barato do caro:

| Falta no `viewBox` | O que fica de fora |
|---|---|
| rotação | roll, dutch angle, sway, correção de horizonte |
| eixo Z | dolly, orbit, crane, fly through |
| perspectiva | dolly zoom (Vertigo) não sai só de escala |

Os planos de profundidade recebem hoje **só `translate`**, nunca `scale`. É essa distinção que separa
"dolly falso e convincente" de "impossível".

---

## Prateleira 1: pronto, pode pedir hoje

| Ferramenta | Para que serve | No motor |
|---|---|---|
| Parallax | separar camadas de mundo, criar profundidade | `Prof.plano`, z de 0 a 1, até 5 planos |
| Rack focus | mudar a atenção sem mover a câmera | `Prof.foco` |
| Depth of field | dar sensação de lente real | `desfoque` por plano, raio até 4 |
| Inércia | peso, massa, intenção no movimento | 6 eases nomeados |
| Impact shake | pontuar uma pancada | `Cam.tremor` |
| Handheld, micro jitter, breathing | presença, quadro vivo | `Cam.tensao` |
| Occlusion reveal | transição natural por trás de um objeto | doutrina de oclusão, ordem no SVG |
| Pan, tilt, track, truck, pedestal | acompanhar, explorar, revelar altura | `Cam.revelar` |
| Zoom in e out, push in, pull back | pressão, revelação, contexto | `Cam.aproximar`, `Cam.recuar` |
| Quadro fixo | permitir julgamento | `Cam.segurar` |

**Uma advertência de uso, medida no deck de teste:** zoom quase não produz parallax. Zoom é lente, não
passo, e todas as camadas crescem igual. A separação entre o céu e o chão foi de 8 pontos de tela num
zoom contra 26 pontos num travelling da mesma distância. Quando a cena pedir profundidade, o cue é
`revelar`, não `aproximar`.

---

## Prateleira 2: existe no motor, falta o nome

Tudo aqui é composição do que já roda. Vira preset, não peça nova.

| Ferramenta | Sensação | Como se descreve hoje |
|---|---|---|
| Punch in | ênfase súbita numa frase, num clique | `aproximar` de 150 a 350 ms, escala 1,08 |
| Snap zoom, crash zoom | choque, humor, tensão | `aproximar` curto com ease agressivo |
| Whip pan | energia, transição | `revelar` muito rápido |
| Overshoot | peso e inércia, a câmera passa do ponto e volta | ease com `back`, ou tween em dois tempos |
| Floating camera, drift | atmosfera, cena que nunca assenta | `tensao` de amplitude mínima e período longo |
| Reframe | a sensação de um operador observando a ação | `revelar` curto, depois do acontecimento |
| Camera reveal, reveal zoom, camera rise | descoberta, escala, encerramento | composições de `revelar` e `recuar` |
| Lens breathing | realismo de lente durante mudança de foco | escala global de 1,5% junto do `Prof.foco` |
| Vignette dinâmica | convergir atenção no clímax | opacidade de um `<rect>` com gradiente radial |

Sobre a vinheta: a doutrina proíbe **filtro** de tela cheia animado, e com razão, é caro. Animar a
**opacidade de uma forma** não é filtro e não cai na proibição.

---

## Prateleira 3: precisa de peça nova, mas uma peça destrava várias

**Rotação por grupo raiz.** Um `<g>` envolvendo a cena, girando em torno do centro. Destrava quatro de
uma vez: roll, **dutch angle** (3 a 15 graus, tensão e perigo), cinematic sway (câmera suspensa,
drone, navio) e horizon correction (estabilização depois de uma ação brusca).

**Escala por plano.** Acrescentar `scale` proporcional ao z no parallax. Destrava:

- **dolly de verdade**, onde o que está perto cresce mais que o que está longe, que é a diferença
  física entre andar até o objeto e usar o zoom;
- **dolly zoom, o Vertigo**, que é dolly com zoom contrário. O sujeito fica do mesmo tamanho e o
  fundo se deforma. Choque, descoberta, mudança psicológica.

**Follow e lead camera.** Os cues medem o alvo uma vez, na criação. Seguir um ator que se move exige
remedir por quadro, e lead camera ainda pede deixar espaço na direção do movimento, que é composição,
não só posição.

---

## Prateleira 4: fora do motor

| Ferramenta | Por quê |
|---|---|
| Orbit, arc shot, crane, jib | exigem 3D. O `/mira-3d` **troca** o SVG por WebGL, não convive com o palco |
| Fly through, camera dive | atravessar escalas precisa de Z |
| Motion blur | desfoque direcional animado em área grande é dos filtros mais caros que existem |
| Radial blur | mesma coisa |
| Chromatic aberration | três cópias deslocadas ou `feColorMatrix` animado, filtro de tela cheia |

Os três últimos batem na mesma regra, e ela não é preciosismo: o deck roda em `file://` e é capturado
em vídeo. Filtro de tela cheia animado derruba quadro na captura.

Quando a cena pedir um destes, **descreva a intenção e marque como pendente**, sem inventar chamada.

---

## Índice por intenção: da cena para a ferramenta

As prateleiras acima respondem "isso existe?". Esta tabela responde a pergunta que a direção faz de
verdade: **"a cena precisa disso, com o que eu faço?"**

Leia o beat, ache a intenção, use a combinação. A coluna da direita já vem combinada de propósito:
efeito isolado quase nunca é a resposta.

| A cena precisa de | Combinação | Prateleira |
|---|---|---|
| **Orientar**, situar o mundo | `estabelecer` lento, quadro aberto, parallax fraco | 1 |
| **Descoberta**, o público entende junto | `revelar` até o objeto, depois `segurar` | 1 |
| **Revelação de escala**, "era muito maior" | reveal zoom: `recuar` longo, terminando em quadro cheio | 2 |
| **Pressão**, importância crescendo | push in lento e contínuo, com tensão fraca por baixo | 1 + 1 |
| **Ênfase súbita** numa frase, num número | punch in de 200 ms, escala 1,08, e volta | 2 |
| **Choque**, a coisa aconteceu agora | punch in + impact shake + vinheta fechando | 2 + 1 + 2 |
| **Ameaça em curso**, algo não está certo | tensão sustentada em loop, e dutch angle quando existir | 1 + 3 |
| **Desorientação**, o chão sumiu | dolly zoom (Vertigo), quando a escala por plano existir | 3 |
| **Busca**, procurar sem achar | `revelar` hesitante, ease `reluctant`, sem chegar ao alvo | 1 |
| **Acompanhar** um ator que se move | follow camera com atraso, quando existir; hoje, `revelar` por trecho | 3 |
| **Profundidade**, o mundo tem camadas | travelling lateral, NUNCA zoom, com 3 a 5 planos e oclusão | 1 |
| **Peso**, a câmera tem massa | overshoot no fim do movimento, ease `heavy` | 2 |
| **Presença**, alguém segura a câmera | handheld de amplitude mínima o tempo todo | 1 |
| **Atenção trocando de objeto** sem cortar | rack focus entre dois planos | 1 |
| **Consequência**, deixar o público julgar | `segurar` de 0,6 a 1,2 s, câmera imóvel | 1 |
| **Encerramento**, sair da cena | camera rise ou `recuar` até o quadro base | 2 |
| **Transição por objeto** em primeiro plano | occlusion reveal: passar atrás de algo que cobre o quadro | 1 |
| **Energia**, corte sem cortar | whip pan curto entre dois pontos de interesse | 2 |

Três armadilhas que essa tabela existe para evitar:

- **profundidade pedida e zoom entregue.** Zoom cresce tudo igual, é lente. Profundidade é travelling;
- **choque pedido e só shake entregue.** Choque é sequência, não um efeito. Ver abaixo;
- **efeito escolhido antes da intenção.** Se você achou a ferramenta bonita e depois procurou onde
  usar, o cue vai ler como decoração, e o `razao` obrigatório vai ficar difícil de escrever. Essa
  dificuldade é o sintoma, não a burocracia.

---

## Combinar vale mais que acrescentar

O efeito cinematográfico raramente vem de um cue só. Um trovão não é `shake`, é uma sequência:

```
0,00s  clarão
0,05s  recuo da câmera
0,10s  tremor com direção (raio é vertical, explosão lateral é horizontal)
0,30s  oscilações menores
0,80s  estabilização
```

E os canais do motor **somam**, então isso é escrevível hoje: enquadramento, tremor e tensão são
independentes. Tensão sustentada, com um tremor por cima, durante um push-in, é uma frase de câmera
legítima, não conflito.

O tremor direcional merece nota: a força tem origem. Impacto no chão é vertical com pouco horizontal;
explosão lateral é o contrário. Hoje o `Cam.tremor` sacode com o eixo y a 75% do x, um eixo dominante
fixo. Direção controlável é candidata a ferramenta futura.

---

## O princípio, que não muda

> Não animar apenas os objetos da cena. Animar também o observador da cena.

O MIRA já tem observador. O erro comum não é falta de efeito, é observador parado: cinco planos de
profundidade declarados e nenhum movimento de câmera para separá-los. Antes de pedir ferramenta nova,
confira se a cena está usando as da prateleira 1.
