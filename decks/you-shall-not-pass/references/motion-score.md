# Motion Score · You Shall Not Pass

Cena única, ciclo de 24 s, loop perpétuo. Recriação da ponte de Khazad-dûm com os
assets do autor. A história foi dada por ele; este documento registra o que ficou
decidido e por quê, para a próxima sessão não refazer as descobertas.

## Decisões de direção (do autor, não negociar sem ele)

- **A CÂMERA É DO AUTOR.** O script não escreve um cue sequer e não existe nenhum
  `@MIRA:FOCO` nesta cena. Ele coloca à mão, pelos marcadores ou pela tecla C. **Não
  reinstale trava de câmera:** houve uma versão com `cena.camera = cena.base` por
  quadro, e ela impediria qualquer câmera que ele adicionasse.
- **Quadro cheio por trava CONDICIONAL.** O motor deixa a cena com um enquadramento
  herdado (783x441 em vez do quadro cheio) e um reset único não resolve, porque ele é
  reescrito depois; foi testado e falhou. A trava no derivador resolve, e ela **se
  desliga sozinha** quando existir um `@MIRA:FOCO` de verdade na section (a checagem
  `temCue` exige dígito depois de FOCO, senão os comentários explicativos contariam).
  Ou seja: quadro cheio hoje, câmera do autor amanhã, sem ninguém remover nada.
- **Sem planos de profundidade** (`Prof.plano` removido). O parallax deslocava as
  camadas entre si e tirava de registro coisas calculadas na MESMA coordenada: o fogo
  da cabeça escorregava para fora dos olhos.
- **O baque não sacode a tela.** O chão responde (cascalho e poeira), mas o tremor de
  quadro é câmera, então é do autor. Um `@MIRA:FOCO tipo=tremor beat=7.37 dur=0.35`
  cai exatamente no impacto.
- **Sem grade de cor.** A `brasa` punha vinheta 0.18, contraste 1.10, exposição -0.10 e
  grão sobre a cena inteira. É tratamento de câmera; saiu. `MiraCinema.palco` fica só
  pela timeline e pelo tique da atmosfera.
- **Vinheta: `div.vinheta`, camada FIXA DA TELA, não elemento do SVG.** É o que decide
  se ela funciona. A câmera escreve no `viewBox`, então um `rect` desenhado dentro do
  SVG seria ampliado e cortado junto com a cena a cada zoom e deixaria de escurecer as
  bordas do quadro. Como irmã do palco dentro da `<section>`, ela é imune a zoom,
  travelling e tremor. Estática (radial-gradient CSS, custo zero por quadro), porque
  filtro de tela cheia animado é proibido no Mira por causa da captura de vídeo.
- **A câmera desta cena é do autor**, montada por ele no modo câmera: tensão sustentada
  no ciclo, zoom no Balrog em 4.25, tremor no baque em 7.413, zoom no Gandalf em 8.5 e
  abertura para quadro cheio em 15.25. Não mexer sem ele.
- **ARMADILHA QUE CUSTOU HORAS: nunca escreva o token do marcador de foco em comentário
  dentro da `<section>`.** O `lerMarcadores` do mira-foco.js testa `/@MIRA:FOCO\b/`, sem
  exigir número nem campos. Um comentário em português dizendo "esta cena não tem
  @MIRA:FOCO" é lido como marcador e vira um cue de ZOOM com os padrões (cx 480, cy 230,
  r 220), que dá o enquadramento `88.11 9.56 783.79 440.88`. Era esse o "zoom que
  ninguém pediu", e ele sobrevivia a toda remoção de cue porque a própria explicação de
  que não havia cue É o cue. Fale de câmera sem escrever o token.
- **`preserveAspectRatio="xMidYMid meet"` no palco, NUNCA `slice`.** Este foi o "zoom"
  que sobrevivia a tudo: com `slice` o SVG é ampliado para cobrir a caixa e o excesso é
  cortado (igual `background-size: cover`), então qualquer erro de arredondamento na
  medição do palco vira zoom na tela. Com `meet` o quadro 0..960 x 0..540 aparece
  inteiro. Verificado com moldura de borda e marcadores de canto. O `slice` da imagem
  de fundo (`ponte.jpg`, 1920x1080) pode ficar: ela é 16:9 exata, então não corta nada.

## Geografia e pontos de referência

Assets ativos: `balrog2.svg` (já virado para a direita, sem flip) e o `gandalf.svg`
atualizado, ambos em canvas 1440x810. **Olhos, boca e ponta da vara não são coordenadas
estimadas**: saem de marcações dentro dos próprios SVGs (bolinhas brancas nos olhos do
Balrog, bolinha cinza na ponta da vara), convertidas pela MESMA matriz do encaixe
(`fit.mundo(p)`). Mexer nos retângulos de destino não quebra nada, os pontos seguem.

| Item | Valor |
|---|---|
| Balrog (retângulo destino) | x 30, y 75, w 375, h 342 |
| Gandalf (retângulo destino) | x 450, y 257, w 137, h 105 |
| OLHO_REF_A / B (local do balrog2) | (622.56, 335.41) / (643.98, 339.42) |
| BOCA_REF (local do balrog2) | (654, 356) |
| CAJADO_REF (local do gandalf) | (364.91, 269.57) |
| PIVO do braço (mundo) | (510, 300) |
| BRACO, retângulo do clip | x 438, y 248, w 74, h 66 |
| ANG_BRACO | 26 graus |

O offset de 231 nas referências do Balrog não é arbitrário: no asset o path vive dentro
de um `translate(231,0)`, e as bolinhas estão no espaço root. Medidas conferidas com
render de grade numérica.

## A regra que custou caro: efeito acompanha ator

**Tudo que pertence a um ator mora dentro do grupo que o anima.** Foi a causa de duas
rodadas de correção. O Balrog é animado (ergue, gira, desaba) e o Gandalf também (corpo
sobe, braço gira 26 graus). Efeito preso ao palco fica parado enquanto o dono se move e
escorrega para fora dele.

- `balrogGesto` contém, nesta ordem: fogo atrás da cabeça, corpo, fogo do corpo, faíscas
  que escapam, chamas da boca, olhos.
- `bracoOuter` (o que gira) contém a luz da vara, as partículas de magia e o bloom. Por
  isso a luz usa `CAJADO` (posição em repouso) e não a ponta já girada: quem gira é o grupo.
- Cascalho e poeira do baque ficam FORA do `balrogGesto`, porque pertencem ao chão.

## Beat sheet

| t (s) | Acontecimento |
|---|---|
| 1.5 | Balrog agacha (antecipação) |
| 1.85 | Ergue-se, devagar (power2.out, 1,3 s) |
| 3.4 | Os olhos flamejam |
| 4.6 / 5.8 | Dois jatos de chama pela boca |
| 4.75 → 5.95 | O corpo pega fogo, e no 2º jato toma tudo |
| 6.6 | Estica no alto (o pico antes da queda) |
| 6.95 | **DESABA** (power3.in, 0,42 s), assimetria de peso |
| 7.37 | **BAQUE**: tela treme, cascalho salta, poeira abre, corpo repica |
| 8.0 | Gandalf: antecipação |
| 8.45 | O braço gira 26° no ombro, o corpo sobe |
| 8.9 | A luz acende na ponta; a magia começa a orbitar |
| 9.8 | "YOU SHALL NOT PASS!" surge; sai em 12.4 |
| 13.0 | O brilho cresce, a magia se adensa, o mundo escurece |
| 14.4 | Bloom engole a cena; 15.1 branco pleno |
| 15.8 | Sob o branco, tudo reseta (invisível) |
| 16.6 | Cartela MIRA ANIMATOR; 17.3 by sandeco; sai em 20.2 |
| 21.8 | O branco dissolve na cena inicial: o corte do loop mora aqui |

## Dois relógios

- **História** (`cena.tl`): gestos, jatos, fala, bloom, cartela. Só ANOTA intensidades em
  `boost` (olho, fogo, corpo, magia, tremor, impacto, mundoEscuro).
- **Atmosfera** (`cena.aoAtualizar`, relógio acumulado, teto 0,1 s/quadro): brasas do ar,
  respiração das fornalhas, chamas dos olhos, fogo do corpo, faíscas, magia, cascalho.
  Lê o `boost` e soma por cima. Nunca para.

## Efeitos, e por que são assim

- **Olhos = chamas, não bolas, e apontando PARA FRENTE.** O autor rejeitou círculos e
  depois rejeitou chama subindo. Cada olho é uma labareda redesenhada por quadro
  (`pathChama`), com o grupo girado 85 graus no próprio olho, então ela sai para a
  direita, na direção que o bicho encara. Base larga, ponta que balança, língua interna
  clara, núcleo e três faíscas. Nunca apagam de todo (`vivo` tem piso 0,22).
- **Jato da boca: `transformOrigin` local, nunca `svgOrigin`.** Com as chamas dentro do
  `balrogGesto`, uma origem em coordenada global do palco sai do lugar assim que o bicho
  se move, e o jato deixa de sair da boca. Defeito real, pego em verificação.
- **Fogo no corpo:** a silhueta vira `clipPath`, uma maré de ignição sobe por dentro e 95
  partículas circulam clipadas, mais 40 faíscas que ESCAPAM sem clip. Os tons são
  saturados de propósito: amarelo pálido sobre preto vira cinza esverdeado e mata a
  leitura de silhueta.
- **Magia da vara:** 30 partículas brancas frias orbitando e subindo. É o contraponto
  deliberado às brasas quentes do Balrog.
- **Ar do abismo:** 165 brasas em três camadas (fundo pequeno e lento, meio, frente
  grande e rápido) mais 46 fagulhas que sobem da lava sob o arco e apagam no caminho. A
  profundidade vem da diferença de tamanho e velocidade entre as camadas, não do número.
  Cada uma tem seu próprio fator de deriva (`giro`), senão as 165 viram uma cortina só.
  Somam-se 13 volutas de **fumaça** (parte atrás dos atores, parte na frente), 11 bancos
  de **névoa quente** derivando de lado e 54 pontos de **cinza** escura em suspensão,
  que é o contrapeso: brasa sozinha só tem luz e o ar fica sem matéria.
- **Vapor do vão da ponte:** 18 volutas quentes subindo da lava, presas ao arco por
  `clipPath`. O recorte não é enfeite: a ponte é parte da FOTO de fundo, então sem ele o
  vapor passaria por cima da alvenaria. A poça de lava também deriva e muda de raio,
  senão o brilho do vão fica cravado no mesmo lugar a cena inteira.
- **Jato da boca: contorno turbulento, não pétala escalada.** A primeira versão eram três
  formas fixas girando e crescendo, e o autor reprovou por parecer artificial, com razão:
  contorno liso e sempre idêntico lê como origami. Agora a timeline só anima uma
  intensidade (`boost.jato`) e a silhueta nasce por quadro em `pathJato`, com dois senos
  de frequências diferentes fervendo a borda; três camadas (externa, média, núcleo) dão o
  gradiente térmico, e 22 gotas de cuspe se soltam à frente.
- **Origem da boca:** `BOCA_REF` local (626, 370), grupo girado 8 graus. Chegou aqui
  depois de quatro tentativas erradas (focinho, lábio inferior, peito), e a lição é o
  método: **calibre contra os OLHOS, nunca estimando pixel a olho na imagem**. Os olhos
  têm coordenada conhecida e exata (vêm das bolinhas do asset), então servem de régua:
  meça a distância entre eles na captura, converta para unidades de palco e posicione o
  alvo por diferença. O ponto pedido pelo autor ficava ~14 unidades de palco abaixo do
  centro dos olhos.
- **Cuidado ao desenhar grade de calibração:** ela precisa ser filha do `balrogGesto`,
  senão não herda o gesto (o bicho está erguido em `y -16`) e as leituras saem ~36
  unidades locais deslocadas. Foi o que produziu o erro do "fogo no peito".
- Conversão útil: o encaixe escala o asset em ~0,44, então 15 px de tela valem cerca de
  23 unidades no espaço local.
- **Asa direita articulada:** recorte POLIGONAL, não retângulo, porque um retângulo que
  cubra a asa pega a cabeça junto e ela passaria a balançar também. O polígono
  (`ASA_PTS`) desce pela borda da asa e passa por cima do crânio; o corpo usa o
  complemento (`evenodd`). Bate com dois senos de períodos diferentes, amplitude de
  poucos graus, para não ficar metronômico nem virar voo.
- **Removido:** a elipse da labareda contínua da boca, que lia como mancha solta no rosto.

## Tipografia da fala

A fala é **Cinzel Decorative** (SIL Open Font License 1.1), vendorada em
`assets/vendor/fonts/`, então o deck continua abrindo offline por `file://`. Quatro
palavras empilhadas e centradas em x 524, na parede de rocha acima do Gandalf (área
escolhida pelo autor).

- **Corpo 13, entrelinha 17.** Em 44 o bloco escrevia por cima do Gandalf.
- **Ritmo 3/10 (pedido do autor).** Cada palavra leva 1,2 s para surgir e espera 0,55 s
  antes da próxima; a leitura completa fecha por volta de 12,2 s.
- **A frase NÃO tem fade de saída.** Ela fica no ar até o clarão branco cobrir a tela,
  e só então é zerada, escondida sob o branco em 15,8 s. Quem apaga a fala é a luz do
  cajado, não uma transição. Isso funciona porque o `branco` é criado depois dela no
  grupo `topo` e desenha por cima.

**Por que não é a fonte do filme.** A réplica conhecida do letreiro de O Senhor dos
Anéis é a **Aniron**, de Pete Klassen (2004), e existe também a **Ringbearer** (2002),
do mesmo autor, que replica o logo. As duas são licenciadas para **uso privado apenas**,
sem uso comercial e sem modificação, o que não se sustenta num deck que vira vídeo de
canal. A caligrafia original dos filmes é de Daniel Reeve, e nunca foi distribuída como
fonte. Se o autor quiser a Aniron para uso pessoal, basta pôr o arquivo em
`assets/vendor/fonts/` e trocar o nome no `@font-face` do `index.html`.

## Assinatura do ledger

`confronto mítico | barrar | silhueta vertical contra fornalha | diagonal da ponte | erguer, desabar e clarão | clímax único com cartela`
