# Agentes

Todo agente do Mira é uma skill do Claude: invoque com seu `/nome`, ou apenas descreva o que você quer e o agente se aciona sozinho. Esta página descreve cada um. Para como eles se conectam, veja o [Pipeline de agentes](pipeline.md).

## Entrada e montagem

### `/mira-new`
A porta de entrada de um novo deck. Coleta os requisitos de uma apresentação de forma conversacional (nome do tema, template do deck, tema base, cor principal e referências) e monta a pasta `decks/<tema>/` pronta para o pipeline preencher. **Não** gera slides — prepara o terreno e, ao final, oferece acionar o pipeline.

### `/mira-references`
Cria e organiza a pasta de referências por tema, `references/`, dentro do tema do deck, e inclui automaticamente o material que já estiver lá. É a forma de informar a fonte de conteúdo de uma apresentação específica — sempre por tema, local ao tema. Use antes de criar um slide quando o tema ainda não tiver pasta de referências.

### `/mira-get-videos`
Baixa os vídeos de fundo do Mira para `mira-templates/videos_header/`. Use quando um cabeçalho parecer vazio, ou logo após instalar se você quiser os fundos em vídeo.

## O pipeline principal

### `/mira-extract`
O extrator de contexto. Lê uma fonte vinculada no `mira.config.json` (pasta de projeto, PDF, LaTeX ou texto) e produz um briefing estruturado que alimenta o planner. Primeiro elo da cadeia.

### `/mira-planner`
Planejador de conteúdo. Analisa o conteúdo de um capítulo (LaTeX, PDF ou texto) e produz um plano de slides detalhado **antes** de qualquer montagem visual — quantos slides, o que cada um cobre, a estrutura — e espera aprovação.

### `/mira-copywriter`
Refina o texto dos slides e especifica imagens, trazendo o texto para a altura de slide (curto, direto, apresentável) em vez da altura de parágrafo.

### `/mira-builder`
O motor de montagem atômica. Monta apresentações HTML/Tailwind interativas a partir de componentes glassmorphism modulares (glass-card, icon-hero, attribute-pills, replay-btn) com navegação card a card.

### `/mira-animator`
Cria slides de conceito com animações criativas e **loop interno obrigatório**. A regra-mãe do Mira vive aqui: *nenhuma animação é estática — toda animação entra com coreografia e depois continua em loop interno.* Estampa cada animação com um marcador `<!-- @MIRA:SIZE 3/10 -->` para o `mira-size-animator` escalar depois. Também trata *"transforme essa imagem num slide animado."*

### `/mira-validator`
Analisa o HTML produzido pelo `mira-builder` e valida conformidade visual, estrutural e de assets — um relatório final de qualidade. Rode após uma montagem, ou para diagnosticar um deck existente.

## Ajuste de movimento

### `/mira-size-animator`
Ajusta a percepção de tamanho das animações de um deck numa escala de 1 a 10, onde **3/10** é o que o `mira-animator` gera por padrão. Lê o marcador `@MIRA:SIZE` de cada animação, reporta o nível atual, e escala a composição (raios, comprimentos, espaçamentos, fontes internas e glow dentro do SVG) para preencher mais ou menos o palco — sem mudar a altura do palco nem quebrar o loop interno. *"Coloca as animações em 6/10," "esse slide em 2/10."*

!!! note "Tamanho e distância"
    No formato vertical (9:16), aumentar os elementos também encolhe as distâncias entre eles. No formato horizontal (16:9), só os elementos aumentam — as distâncias ficam como estão.

### `/mira-animated-metaphor`
Transforma a animação de um slide (ou de todos) numa **metáfora visual** animada. A partir do conceito do slide, inventa uma analogia concreta do cotidiano e a anima no padrão do `mira-animator` (loop interno obrigatório), substituindo a animação no lugar e mantendo título, subtítulo e pílulas.

## Visuais e dados

### `/mira-visuals`
Imagens estáticas para slides: painéis, diagramas, gráficos e infográficos — quando um conceito fica melhor como um visual fixo e denso do que como movimento.

### `/mira-image-prompt`
Monta prompts JSON estruturados para geração de imagem fotorrealista.

### `/mira-img-animator`
Anima uma imagem existente — dá vida a uma figura estática no estilo do deck.

### `/mira-chart`
Transforma dados em gráficos com impacto: a partir de um CSV/JSON, de uma imagem de gráfico, ou de um rascunho à mão — e recomenda o melhor tipo de gráfico a partir de uma galeria.

## Formatos de vídeo

### `/mira-squared`
Gera uma versão **quadrada** (1:1, 1080×1080) de um deck a partir do original 16:9, ou cria slides quadrados do zero. Escreve um novo `index-1x1.html` ao lado do original (centralizado por padrão, opcionalmente alinhado à esquerda/direita). Para feed do Instagram, LinkedIn, etc.

### `/mira-vertical`
Gera uma versão **vertical** (9:16). Cada slide de conteúdo fica só com o título principal no topo e uma animação num canvas alto e padronizado abaixo; o título encolhe sozinho para caber em no máximo 2 linhas, e o eixo de cada animação é reformulado para o retrato (fluxo horizontal vira vertical, comparação lado a lado vira empilhada). Escreve `index-9x16.html`. Para Reels, Shorts, TikTok, Stories.

### `/mira-thirds`
Reenquadra um deck na **regra dos terços** sem mudar a proporção. Empurra o conteúdo de cada slide para as colunas 1 e 2 de um grid 3×3 (os dois terços da esquerda) e deixa a coluna da direita livre — para você sobrepor texto, lower-third ou o vídeo do apresentador na edição. Funciona por cima do 16:9, 1:1 ou 9:16. Escreve um arquivo `-thirds`. Lado livre é a direita por padrão; pode ser invertido.

### `/mira-transition-dissolve`
Aplica uma transição **dissolve** (crossfade real, estilo Canva/Keynote) à navegação entre slides usando a View Transitions API (same-document), que funciona em `file://` sem servidor. Escreve `index-dissolve.html` ao lado do original. Navegadores sem a API navegam normalmente.
