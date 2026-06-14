# Por que o Mira

## A lacuna

Bons slides são lentos de fazer. O conteúdo quase sempre já existe — num repositório, num capítulo de livro, num PDF, num artigo, num bloco de anotações. O que custa tempo é a *tradução*: transformar esse material numa apresentação que prende a atenção. Layout. Texto que cabe num slide em vez de num parágrafo. E, o mais difícil, o movimento — a animação que faz uma ideia abstrata fazer sentido.

A maioria pula o movimento por completo e entrega bullet points estáticos. As ideias são boas; a entrega é morna.

## A ideia

O Mira fecha essa lacuna com um time de agentes de IA especializados. Você aponta para uma fonte e o pipeline faz a tradução:

- **lê** o material e produz um briefing estruturado,
- **planeja** os slides e espera sua aprovação,
- **escreve** o texto na altura de slide (não de parágrafo),
- **monta** o HTML em glass-cards modulares,
- **coreografa** as animações — todo conceito ganha um movimento em loop contínuo,
- e pode **reexpressar** os conceitos difíceis como metáforas visuais animadas.

O resultado não é um deck de imagens estáticas. É um `index.html` autossuficiente em que todo conceito *se move* — e em que as ideias pesadas são mostradas como analogias concretas em vez de diagramas abstratos.

## A regra de ouro: nada é estático

A restrição que define o Mira, herdada por todo agente de animação, é simples e inegociável:

> Nenhuma animação é estática. Toda animação **entra** com coreografia e **depois** continua em loop interno.

Um slide que apenas fica parado é um bug, não um recurso. É isso que faz um deck do Mira parecer vivo na tela e o que faz funcionar como vídeo, não só como slideshow.

## A mesma filosofia do Reversa

O Mira segue a filosofia de **isolamento** do [Reversa](https://github.com/sandeco/reversa). O Reversa se instala dentro de um projeto legado para extrair especificações; o Mira se instala numa pasta de slides *separada* e lê de **fontes vinculadas**. Nos dois casos o princípio é o mesmo: a ferramenta lê o que existe e escreve apenas na própria saída, nunca misturando seus artefatos com o material de origem.

Isso significa que você pode apontar o Mira para um repositório de produção, um rascunho de livro ou o PDF de um cliente com total confiança: ele vai ler, mas nunca vai escrever de volta na fonte.

## Para quem é

- **Educadores** transformando um capítulo de livro ou módulo de curso numa aula animada.
- **Builders** transformando o README de um projeto num pitch ou numa demo técnica.
- **Pesquisadores** transformando um artigo numa apresentação que a plateia consegue acompanhar.
- **Criadores de conteúdo** que precisam da mesma ideia como uma palestra 16:9, um post quadrado de feed e um Reel vertical — a partir de uma única fonte de verdade.
