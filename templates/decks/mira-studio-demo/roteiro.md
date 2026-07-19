# Roteiro · Mira Studio (deck vertical 9:16)

Este arquivo é a fonte da verdade do roteiro deste deck. Cada bloco `## Slide` vira um
slide, na ORDEM em que aparece aqui (o número é rótulo, não índice), e o texto abaixo do
cabeçalho é a sua fala: é ele que abastece o painel do teleprompter e o overlay de leitura.

**Cabeçalho:** `## Slide N | layout | Título`

- `layout` (obrigatório): `capa`, `camera`, `split` ou `full`. Valor desconhecido cai em `camera`.
- `Título`: vale em `capa`, `split` e `full`; ignorado em `camera`. Um trecho `*entre asteriscos*`
  sai pintado com a cor de destaque.
- Sem campo de animação: as animações deste deck são autorais, escritas à mão no `index.html` e
  presas ao palco `sv-slide-N` (N = posição do slide neste arquivo).

**Como sincroniza:** com o deck servido em localhost, editar o texto aqui aparece no deck em
cerca de 1,5 s, e digitar no painel do teleprompter grava de volta neste arquivo, sem tocar nesta
introdução nem nos cabeçalhos. Layout e título são lidos uma vez, no load: mudou, recarregue a
página. Em `file://` não há sincronização, o deck sobe com os slides embutidos.

## Slide 1 | capa | Um roteiro, *três formatos*

Um roteiro, três formatos. Este é o deck vertical do Mira Studio.

## Slide 2 | camera

Aqui a câmera preenche a coluna inteira: só você falando.

## Slide 3 | split | Três formatos, *um roteiro*

No meio a meio, a metáfora animada fica no quadrado de cima e você embaixo.

## Slide 4 | full | Do roteiro *ao vídeo*

E na tela cheia, a animação toma conta: do roteiro ao vídeo pronto.
