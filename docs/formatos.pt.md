# Formatos de vídeo

Um deck 16:9 é a fonte de verdade. A partir dele, o Mira gera arquivos extras para outras proporções e transições — **sem nunca tocar no original**. Cada agente de formato escreve um novo arquivo ao lado do `index.html`.

```
decks/minha-aula/
├── index.html              # o deck 16:9 original
├── index-1x1.html          # mira-squared
├── index-9x16.html         # mira-vertical
├── index-thirds.html       # mira-thirds
└── index-dissolve.html     # mira-transition-dissolve
```

## Quadrado — `/mira-squared`

Uma versão **1:1 (1080×1080)**, para o feed do Instagram, LinkedIn e outros espaços quadrados. Fixa cada slide na moldura quadrada e reduz os espaços laterais, com moldura fixa e ajuste leve. Centralizado por padrão, com opção de alinhar à esquerda ou à direita. Também pode criar slides quadrados do zero na geometria nativa quando não há deck de origem.

→ `index-1x1.html`

## Vertical — `/mira-vertical`

Uma versão **9:16 (1080×1920)**, para Reels, Shorts, TikTok e Stories. Cada slide de conteúdo é reduzido a apenas o título principal no topo e um canvas de animação alto e padronizado abaixo — subtítulo, header do card e pílulas da base saem, e o título encolhe sozinho até caber em no máximo 2 linhas. O movimento-chave: o **eixo de cada animação é reformulado para o retrato** (um fluxo horizontal vira vertical, uma elipse larga vira alta, uma comparação lado a lado vira empilhada). Texto, cores, timings e o loop ficam intactos — só posição, eixo e altura do viewBox mudam. Fora da coluna, o fundo fica `#333333`.

→ `index-9x16.html`

!!! tip "Aumentar elementos no vertical"
    No 9:16, quando você pede ao `mira-size-animator` para aumentar os elementos, ele também reduz as distâncias entre eles para a composição ficar coesa. No 16:9, só os elementos aumentam.

## Regra dos terços — `/mira-thirds`

Uma variante de **composição** que **não** muda a proporção. Empurra o conteúdo de cada slide (título, animação e pílulas) para as colunas 1 e 2 de um grid 3×3 — os dois terços da esquerda — e deixa a coluna da direita inteira livre. Essa coluna livre fica reservada para você sobrepor texto, lower-third ou o vídeo do apresentador na edição.

Compõe por cima de qualquer base: 16:9, o quadrado 1:1 ou o vertical 9:16. O lado livre é a direita por padrão e pode ser invertido para a esquerda.

→ `index-thirds.html`

## Transição dissolve — `/mira-transition-dissolve`

Uma variante de **transição**. Troca o scroll suave entre cards por um **crossfade** real (dissolve, estilo Canva/Keynote) usando a View Transitions API (same-document). Um slide se desmancha no outro.

Por ser same-document, funciona direto do `file://` sem servidor (Chrome/Edge). Navegadores sem a API simplesmente navegam normalmente.

→ `index-dissolve.html`

## Dica de gravação

Para transformar qualquer um desses em vídeo, abra o arquivo e grave a tela com a viewport do navegador ajustada à resolução do formato (1920×1080, 1080×1080 ou 1080×1920). Os loops internos mantêm cada slide vivo enquanto você grava.
