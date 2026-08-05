# Câmera, easing e transições

## Sumário

1. Câmera
2. Easing
3. Transições
4. Erros frequentes

## 1. Câmera

| Movimento | Função narrativa | Como existe no MIRA |
|---|---|---|
| Quadro aberto | orientar, mostrar o mundo | `Cam.estabelecer` |
| Push-in | aumentar pressão, intimidade ou importância | `Cam.aproximar` |
| Pan ou track | acompanhar causalidade ou busca | `Cam.revelar`, que mantém a escala e desloca o centro |
| Pull-out | revelar escala, isolamento ou consequência | `Cam.recuar` |
| Quadro fixo | permitir julgamento, tensão ou clareza | `Cam.segurar` |
| Impacto | sacudir o ponto de vista | `Cam.tremor`, teto de 400 ms |
| Parallax | separar camadas de mundo e importância | `Prof.plano`, não é cue de câmera |
| Tilt e orbit | hierarquia vertical, ambiguidade espacial | não existem. Orbit exigiria 3D |
| Corte | romper tempo, valor ou ponto de vista | é a troca de slide, não um cue |

Começar pelo quadro mais informativo, não pelo mais espetacular. Todo cue declara a razão narrativa, e o teto por cena vem do temperamento: 2 em `sereno`, 3 em `natural`, livre em `tenso`.

## 2. Easing

Associar easing a comportamento, não a preferência estética:

- aceleração lenta mais parada pesada, massa e inevitabilidade;
- antecipação curta mais disparo, intenção ou ataque;
- overshoot moderado, excesso, humor ou instabilidade;
- desaceleração longa, reverência, assombro ou percepção;
- movimento linear, processo mecânico contínuo;
- quebra abrupta, falha ou interrupção.

Limitar famílias de easing no deck e reservar exceção para acontecimentos realmente diferentes. A família permitida vem do temperamento: `sine`, `power1` e `power2` em `sereno`. **`back`, `elastic` e `bounce` ficam fora do padrão**, liberados só em `tenso` ou quando a física da metáfora os exigir, com o motivo declarado.

Nomes de comportamento que o `mira-cinema.js` já entende: `decisive`, `reluctant`, `heavy`, `fragile`, `reveal-breath`, `dread-creep`.

## 3. Transições

| Tipo | Uso | Disponibilidade |
|---|---|---|
| Match de objeto | identidade atravessa a cena | 🟡 planejado, depende da âncora entre slides |
| Match de forma | relação abstrata continua | 🟡 planejado |
| Movimento contínuo | energia causal atravessa | disponível, por composição do primeiro quadro |
| Passagem de câmera | novo espaço nasce do anterior | disponível dentro do palco |
| Luz ou sombra | valor ou conhecimento muda | 🟡 planejado, a luz de cena ainda não existe |
| Som antecipado | próxima consequência invade antes da imagem | só em deck com áudio |
| Corte de contraste | choque deliberado | disponível |
| Dissolve | tempo, memória, ambiguidade ou suavidade | disponível, `/mira-transition-dissolve` |

Enquanto a âncora não existir, a continuidade entre slides é obtida por composição: o primeiro quadro do slide seguinte herda posição, silhueta e direção do último quadro do anterior. É trabalho de direção, não de API.

## 4. Erros frequentes

- câmera se move durante leitura importante;
- zoom substitui mudança dramática;
- todos os objetos usam bounce;
- transição esconde uma quebra causal;
- blur e glow reduzem legibilidade;
- aceleração extrema elimina antecipação;
- cortes frequentes impedem continuidade espacial;
- dissolve constante achata o ritmo;
- tremor num slide que vai ser gravado, que lê como falha de captura.
