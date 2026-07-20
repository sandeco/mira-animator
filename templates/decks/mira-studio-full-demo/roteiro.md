# Roteiro · Mira Studio 16:9 (deck full-hd)

Este arquivo é a fonte da verdade do roteiro deste deck. Cada bloco `## Slide` vira um
slide, na ORDEM em que aparece aqui (o número é rótulo, não índice), e o texto abaixo do
cabeçalho é a sua fala: é ele que abastece o painel do teleprompter e o overlay de leitura.

**Cabeçalho:** `## Slide N | layout | Título | animação`

- `layout` (obrigatório): `camera` (só você na tela), `thirds` (animação nos 2/3 da
  esquerda + câmera ao vivo no 1/3 direito) ou `full` (só animação, quadro inteiro,
  sem câmera). Valor desconhecido cai em `camera`.
- `Título`: vale em `thirds` e `full`; ignorado em `camera`. Um trecho `*entre asteriscos*`
  sai pintado com a cor de destaque.
- `animação` (thirds/full): `linha: A, B, C, D` (etapas em diagonal com orbe percorrendo) ou
  `orbita: A, B, C @ NÚCLEO` (satélites girando em torno do núcleo).

**Como sincroniza:** com o deck servido pelo launcher (localhost), editar o texto aqui
aparece no deck em cerca de 1,5 s, e digitar no painel do teleprompter grava de volta neste
arquivo, sem tocar nesta introdução nem nos cabeçalhos. Layout, título e animação são lidos
uma vez, no load: mudou, recarregue a página. Em `file://` não há sincronização, o deck sobe
com os slides embutidos.

## Slide 1 | camera

Abertura direto na câmera: você em tela cheia, falando com a lente.

## Slide 2 | thirds | Linha de *Produção* | linha: CRIAÇÃO, GRAVAÇÃO, EDIÇÃO, FINALIZAÇÃO

No layout de terços, a animação ocupa os dois terços da esquerda e você aparece ao vivo no terço direito.

## Slide 3 | thirds | Órbita da *Produção* | orbita: CÂMERA, ÁUDIO, ROTEIRO @ PRODUÇÃO

Cada satélite é uma etapa orbitando o núcleo. Edite esta fala no painel do roteiro ou direto no roteiro.md.

## Slide 4 | full | Produção ao *Vivo* | linha: TEMA, ESTRUTURA, CONTEÚDO, VISUAL

Este é o layout full: só animação, ocupando o quadro inteiro, sem câmera.

## Slide 5 | camera

Encerramento direto na câmera. Tecla R grava e o MP4 sai em 1920x1080.
