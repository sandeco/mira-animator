# Grade de cor e continuidade entre cenas

## Sumário

1. O que a grade faz
2. Escolher o preset
3. Onde a grade se aplica
4. Continuidade entre slides
5. Erros frequentes

## 1. O que a grade faz

A grade de cor é o clima do deck: exposição, contraste, saturação, vinheta e grão aplicados por igual a todas as cenas. É ela que produz a sensação de obra única, e é a razão de ser decidida uma vez só.

Ela não conserta cena mal encenada. Uma cena rasa com grade bonita continua rasa, e a grade é justamente o tipo de recurso que faz isso passar despercebido numa primeira olhada.

## 2. Escolher o preset

| Preset | Exposição | Contraste | Saturação | Vinheta | Grão | Quando |
|---|---|---|---|---|---|---|
| `neutra` | 0 | 1,00 | 1,00 | 0 | 0 | o tema já resolve, ou o deck é claro |
| `noite-fria` | -0,30 | 1,14 | 0,82 | 0,22 | 0,06 | tensão, distância, análise |
| `brasa` | -0,10 | 1,10 | 1,06 | 0,18 | 0,05 | calor, urgência, deck de marca quente |
| `clinica` | +0,05 | 1,06 | 0,94 | 0,10 | 0,03 | precisão, dado, demonstração técnica |
| `penumbra` | -0,42 | 1,20 | 0,76 | 0,30 | 0,07 | mistério, ameaça, revelação tardia |

Critério de escolha, nesta ordem:

1. **O tema sobrevive?** Saturação baixa num deck cuja identidade é uma cor forte apaga a marca. Se apagar, o preset não é oferecido.
2. **O clima é o da história?** A grade responde ao princípio organizador, não ao gosto do momento.
3. **O deck é claro ou escuro?** Preset escuro em tema claro destrói a legibilidade do texto.

Desvio de grade em uma cena só se justifica quando a mudança de clima **é** o acontecimento, e aí entra como transição, nunca como salto entre slides.

## 3. Onde a grade se aplica

Apenas ao palco, a camada onde vive a animação.

Aplicada acima disso, o filtro cria bloco de contenção e contexto de empilhamento: todo elemento de posição fixa passa a se posicionar pelo elemento filtrado, o título é dessaturado junto com a cena, e cada seção filtrada vira uma camada de composição a mais. Não é preferência de estilo, é o que quebra a interface.

O grão é estático, sempre. Grão que muda a cada quadro destrói a compressão na exportação para vídeo.

## 4. Continuidade entre slides

Um deck lê como sequência quando o par de slides vizinhos compartilha alguma coisa. Escolher uma lógica por par:

| Lógica | O que atravessa |
|---|---|
| Objeto | o mesmo elemento continua, com função nova |
| Silhueta | a forma se repete em posição equivalente |
| Direção | o movimento que saiu à direita entra pela esquerda |
| Escala | o quadro seguinte herda o tamanho aparente do anterior |
| Valor | a cor ou o contraste sobrevive à troca |
| Consequência | o estado final vira o estado inicial seguinte |

🟡 Âncora declarada e match cut estão planejados no MIRA e ainda não existem. Enquanto isso, a continuidade é obtida por composição do primeiro quadro, o que já cobre a maior parte dos casos.

Quando a âncora chegar, ela exige que os dois lados sejam da **mesma família de silhueta**. Ancorar um círculo em um retângulo produz interpolação que lê como defeito.

Par sem continuidade natural é aceitável. Forçar continuidade entre cenas que não se parecem é pior que cortar limpo.

## 5. Erros frequentes

- uma grade por cena, que produz um deck parecendo dez filmes;
- grade escolhida pela beleza do preset, contra o tema do deck;
- filtro aplicado na seção ou no corpo da página, quebrando a interface fixa;
- grão animado;
- vinheta forte comendo a área segura;
- continuidade forçada entre slides que não têm nada em comum;
- clima que muda no meio do deck sem que nada na história tenha mudado.
