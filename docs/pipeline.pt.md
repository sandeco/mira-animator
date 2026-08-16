# Pipeline de agentes

O Mira é um **time de agentes**. Cada um faz um único trabalho e passa para o próximo. O orquestrador pausa entre as etapas para você ficar no controle.

```mermaid
flowchart TD
    S[mira-new<br/>monta o deck] --> E[mira-extract<br/>lê a fonte]
    E --> P[mira-planner<br/>planeja os slides]
    P --> C[mira-copywriter<br/>refina texto e imagens]
    C --> B[mira-builder<br/>monta o HTML]
    B --> A[mira-animator<br/>metáforas animadas]
    A --> V[mira-validator<br/>relatório de conformidade]
```

## A linha principal

| Etapa | Agente | O que faz |
|---|---|---|
| 0 | **mira-new** | Porta de entrada conversacional. Cria a estrutura de `decks/<tema>/` com a `references/` já na primeira ação, para você soltar o material-fonte antes de escolher qualquer coisa, e depois monta o deck (template, tema base, cor). Não gera slides, prepara o terreno. |
| 1 | **mira-extract** | Lê uma fonte vinculada (projeto, PDF, LaTeX ou texto) e produz um **briefing** estruturado. Primeiro elo da cadeia. |
| 2 | **mira-planner** | Analisa o briefing e propõe um **plano de slides** detalhado, e espera sua aprovação antes de montar qualquer coisa. |
| 3 | **mira-copywriter** | Refina o texto para a altura de slide e especifica imagens. |
| 4 | **mira-builder** | O motor de montagem. Monta HTML/Tailwind interativo a partir de cards glassmorphism modulares com navegação card a card. |
| 5 | **mira-animator** | Adiciona o movimento, e a metáfora. Todo slide de conceito vira uma **analogia concreta do cotidiano** animada, com **loop interno obrigatório**: entra com coreografia e depois entra em loop. Também substitui a animação de um slide existente no lugar. Estampa cada animação com o marcador `<!-- @MIRA:SIZE 3/10 -->`. |
| 6 | **mira-validator** | Analisa o HTML gerado e produz um relatório de conformidade: checagens visuais, estruturais e de assets. |

## O caminho paralelo: `mira-fast`

A linha principal não é o único jeito de chegar num deck. O **[`/mira-fast`](agentes/core.md#mira-fast)** é uma porta de entrada alternativa que cobre a cadeia toda numa única chamada: um agente central planeja o deck e então **uma folha por slide roda em paralelo**, com montagem determinística no fim.

Ele não é uma etapa desta tabela, é um substituto dela. Você troca as pausas de aprovação entre os agentes por velocidade: o `/mira-fast` não pergunta nada, do tema ao HTML final. Use a linha principal quando quiser aprovar o plano de slides antes de montar; use o `/mira-fast` quando quiser o deck pronto de uma vez.

## A cadeia narrativa

Instalada sempre, com o **Story Team**, roda **antes** da linha principal: decide qual é a história, antes de alguém decidir quais são os slides. Nenhum desses agentes escreve HTML, e nenhum deles cria a metáfora animada, que continua sendo do `mira-animator`.

| Etapa | Agente | O que faz |
|---|---|---|
| -1 | **mira-brainstorming** + **mira-concept-align** + **mira-storyboard** | Opcional, e oferecido antes de tudo: acha o ângulo quando só existe um tema, clareia a ideia e depois a desenha como rascunho barato em `storyboard/`, para você rejeitar um mal-entendido antes de ele virar animação. Fechando essa etapa o deck vira **vinculado**, e a partir daí o conceito aprovado é leitura obrigatória para os agentes seguintes. |
| 0 | **mira-cinema-deck** | Orquestra a cadeia inteira: cria o deck com `--cinema`, roda as oito etapas na ordem e entrega ao `mira-animator`. Sem ele, a direção de câmera é escrita e nunca implementada. |
| 1 | **mira-premise-forge** | Pesquisa fatos atuais e transforma o Eureca escondido neles em um **Premise Brief** defensável. |
| 2 | **mira-concept-storyteller** | Fixa o **Concept Contract**: o que a história precisa ensinar e nunca pode distorcer. |
| 3 | **mira-story-architect** | Constrói a **Story Bible**: estrutura, personagens, tema, mundo, símbolos, trama e cenas. |
| 4 | **mira-design-audience-journey** | Projeta o **Audience Journey Map**: atenção, curiosidade, emoção e revelação, beat a beat. |
| 5 | **mira-direct-slide-sequence** | Transforma a história em um **MIRA Slide Score**, uma cena por slide, com transição causal para a seguinte. |
| 6 | **mira-direct-scene** | Dirige a **encenação**: composição, blocking, planos de profundidade com oclusão, enquadramento, legibilidade e a grade de cor única do deck. |
| 7 | **mira-direct-cinematic-motion** | Escreve o **MIRA Motion Score**: temperamento, beats, câmera, easing, loop interno, e o handoff que o `mira-animator` implementa. |
| 8 | **mira-scene-brief** | Destila a cadeia num **briefing de cena curto e autossuficiente por slide**, para quem desenha a animação nunca ler a cadeia. Carrega a âncora que liga um slide ao seguinte. |
| 9 | **mira-asset-scout** | Decide a **origem de cada ator** da cena: desenhar (geometria simples), buscar SVG de fonte aberta e embutir inline, ou pedir o arquivo ao autor. Figura humana, mão, rosto, animal e veículo ficam proibidos de ser desenhados à mão. |

Para o slide em que o cinema **é** a cena, e não o tempero, o `mira-animator` tem um irmão: o **`mira-cine-animator`**. Ele herda o método inteiro por referência e inverte duas travas, então um movimento de câmera, um plano de profundidade ou a atmosfera podem ser a mudança de estado dominante, e a nota de corte é avaliada com o cinema ligado. Chamado explicitamente, nunca por padrão.

Vale a pena para um deck que precisa convencer, ensinar ou ser gravado. Para um deck interno rápido, a linha principal já resolve.

## Agentes de ajuste de movimento

Estes rodam por cima de um deck existente.

| Agente | O que faz |
|---|---|
| **mira-animated-metaphor** | Atalho compatível do `mira-animator` (modo substituir), mantido por estar citado em material publicado. |
| **mira-size-animator** | Lê o marcador `@MIRA:SIZE N/10` e escala a percepção de tamanho das animações (raios, comprimentos, espaçamentos, fontes internas, glow) numa escala de 1 a 10, sem mudar a altura do palco nem quebrar o loop. *"Coloca as animações em 6/10."* |

## Agentes visuais / de imagem

| Agente | O que faz |
|---|---|
| **mira-visuals** | Imagens estáticas para slides: painéis, diagramas, gráficos e infográficos. |
| **mira-img-animator** | Anima uma imagem existente. |
| **mira-chart** | Transforma dados em gráficos — a partir de CSV/JSON, de uma imagem, ou de um rascunho à mão — e recomenda o melhor tipo de gráfico. |
| **mira-chart-race** | Gráfico de corrida: dados temporais (CSV largo) viram animação que toca uma vez e para no fim, barras que trocam de posição ou linhas desenhadas no tempo. |
| **mira-image-template** | Cria um novo template de deck a partir de imagem(ns) — prints de telas e/ou logomarca — reconhecendo o design system e a disposição dos elementos, e registra para o `mira-new` usar. |

## Agentes de elementos no slide

Estes inserem um elemento específico num slide.

| Agente | O que faz |
|---|---|
| **mira-3d** | Adiciona um elemento 3D de verdade (profundidade real, rotação automática, arrastar/zoom) num card limpo, escolhendo CSS 3D, Three.js procedural ou um `.glb` glTF. Um slide com `.glb` precisa de servidor HTTP local (o agente sobe um e gera um launcher `abrir-slide.cmd`; precisa de Node.js); CSS 3D e procedural abrem por `file://`. |
| **mira-qrcode** | Insere um QR code grande, central e escaneável a partir de um link ou texto, gerado localmente e embutido como SVG inline, então funciona por `file://` sem dependência de runtime. |
| **mira-survey** | Cria um slide de enquete ao vivo: QR-code para a plateia votar num Google Forms e um gráfico (donut 3D ou barras) que se atualiza em tempo real lendo a planilha de respostas pelo endpoint `gviz` por JSONP (funciona por `file://`). Recebe o link de votação e o da planilha; se faltar, pede. |
| **mira-quiz** | Cria um slide de quiz ao vivo: QR-code para a plateia responder num Google Forms, leitura da planilha via `gviz` por JSONP, resposta correta revelada pelo apresentador e porcentagens exibidas só depois da revelação. |
| **mira-image** | Coloca uma imagem que você já tem (arquivo local ou URL) num slide, copiada para `assets/` e referenciada por caminho relativo. Card limpo, imagem estática com o loop na moldura. Funciona por `file://` sem servidor. Para gerar uma imagem veja `mira-visuals`; para animar uma veja `mira-img-animator`. |
| **mira-svg-morph** | Gera um slide onde uma forma SVG morfa em outra em loop contínuo (GSAP + MorphSVGPlugin vendorados localmente). Você passa 2+ arquivos `.svg`; 2 vão e voltam, N encadeiam. Cola os paths inline com ids únicos e roda `convertToPath`. Funciona por `file://`. |
| **mira-icon-morph** | O mesmo morph a partir de conceitos em palavras: busca na API do Iconify, valida a licença (MIT/Apache/CC0/CC-BY), registra atribuição no `CREDITS.md` e recusa IP protegida. Reaproveita o núcleo de render do `mira-svg-morph`. |
| **mira-svg-animator** | Anima um SVG que você fornece: bater, girar, deslizar, pulsar, desenhar o contorno ou percorrer uma curva (GSAP transform / DrawSVG / MotionPath, vendorado). Para mover uma parte ela precisa ser um elemento separado; num path único fundido, a skill separa a parte (corte por eixo ou edição do path) e remove fundos opacos. Funciona por `file://`. |
| **mira-animated-typing** | Cena de "prompt digitado em zoom": linha única de fonte mono de terminal gigante sobre fundo escuro, digitada caractere a caractere com cursor piscando estilo Windows; ao chegar a 100px da borda direita o texto desliza para a esquerda com o cursor ancorado. Cor por trecho via tag `color=#HEX` (a tag nunca aparece). JS/CSS puro, loop contínuo, funciona por `file://`. |

## Agentes de apoio

| Agente | O que faz |
|---|---|
| **mira-references** | Cria e organiza a pasta `references/` por tema; inclui automaticamente o material que você deixar lá. |
| **mira-get-videos** | Baixa os vídeos de fundo para `mira-templates/videos_header/`. |

## Agentes de formato

Estes produzem arquivos extras ao lado do seu deck sem tocar no original. Veja [Formatos de vídeo](formatos.md).

| Agente | Saída | Formato |
|---|---|---|
| **mira-squared** | `index-1x1.html` | quadrado 1:1 |
| **mira-vertical** | `index-9x16.html` | vertical 9:16 |
| **mira-thirds** | `index-thirds.html` | regra dos terços |
| **mira-studio** | `decks/<nome>/` | deck de gravação 9:16 com câmera embutida ao vivo (pronto para OBS) |
| **mira-studio-full** | `decks/<nome>/index-16x9.html` | deck de gravação 16:9 full-hd com câmera embutida, roteiro.md e teleprompter fora do vídeo |
| **mira-transition-dissolve** | `index-dissolve.html` | transição dissolve |
| **mira-slide-to-video** | `deck.mp4` | vídeo MP4 da animação real dos slides |

Para a descrição completa de cada agente, veja [Agentes](agentes.md).
