# Mira Studio Full: sua videoaula gravada dentro do slide, sem OBS

Você abre um arquivo, aperta **R**, fala olhando para o teleprompter e sai do outro lado com um **MP4 1920x1080** pronto para a timeline. Sem cena de OBS, sem chroma key, sem recorte, sem montar overlay na edição.

O `/mira-studio-full` gera um deck **16:9 full HD** onde a sua webcam entra **ao vivo dentro do slide** e a gravação é do próprio deck.

## O teleprompter fica na sua tela e não entra no vídeo

Esse é o pulo do gato. O texto da fala aparece grande, no meio da tela, por cima do slide, e **não é pintado no MP4**. Você lê olhando praticamente para a câmera e o espectador vê só você e a animação.

- **L** liga e pausa a rolagem automática, **+ / -** ajustam a velocidade.
- Você arrasta a caixa de leitura, muda largura, altura e tamanho da fonte, e cada slide guarda o seu ajuste.
- Os painéis de controle também ficam fora do vídeo, então você mexe em tudo durante a gravação sem sujar o take.

Isso vale para o gravador nativo (tecla R) em Chrome ou Edge desktop recente, aberto pelo launcher do deck. No OBS não existe exclusão de overlay: lá ele grava os pixels da janela, então é só desligar o teleprompter antes.

## Três enquadramentos, declarados no roteiro

Cada slide escolhe como você aparece:

- **camera**: seu rosto ocupando o quadro inteiro. Abertura, virada de assunto, encerramento.
- **thirds**: animação nos dois terços da esquerda e você ao vivo no terço da direita. É o formato de aula.
- **full**: só a animação no quadro inteiro, sua voz em off lendo o teleprompter.

## O roteiro é um .md que você edita com o deck aberto

O deck nasce de um `roteiro.md` na raiz. Cada bloco é um slide:

```
## Slide 3 | thirds | O que muda no *fluxo* | linha: Entrada, Processo, Saída
Aqui vai o texto que você vai ler no teleprompter.
```

Layout, título, animação e fala saem daí. Você escreve no seu editor favorito, salva, e **a fala aparece no deck em cerca de 1,5 segundo**, nos dois sentidos: digitar no painel do deck também grava no arquivo. Reordenar os blocos leva palco, título e fala juntos, sem embaralhar nada.

## Animação sem escrever uma linha de código

Duas palavras no cabeçalho do slide resolvem a ilustração:

- `linha: A, B, C` desenha as etapas em diagonal, com um orbe percorrendo e acendendo cada nó.
- `orbita: A, B, C @ NÚCLEO` põe os satélites girando em torno do centro.

As duas entram coreografadas e depois ficam em loop perpétuo, pausando sozinhas quando o slide sai da tela.

## Gravação feita para quem edita depois

- **H.264, 1920x1080, 12 Mbps**, contagem regressiva 3-2-1 antes de começar.
- **Gravação direta no disco**: você escolhe o arquivo uma vez e nada acumula na memória, então não existe teto de duração.
- **CFR ligado por padrão**. Traduzindo: o MP4 entra no Premiere sem aquela dessincronia progressiva em que a boca vai se afastando da voz ao longo da aula. Esse detalhe sozinho já economiza retrabalho.
- **Modo Desempenho** grava na resolução nativa da janela para máquina mais fraca.
- Painel com **seletor de câmera e de microfone, com medidor de nível**. Trocar de câmera é ao vivo, sem recarregar.

## Ainda dá para riscar por cima

Tecla **P** libera a caneta e você desenha sobre o slide para apontar o que importa. O traço é por slide: sai quando você avança e volta quando você retorna.

## Atalhos que você vai usar todo dia

Setas e espaço navegam · **T** painel do roteiro · **O** overlay de leitura · **L** rolagem · **+/-** velocidade · **E** mover e redimensionar a caixa · **Ctrl+S** salvar no arquivo · **R** gravar · **C** espelhar câmera · **P** caneta · **?** lista completa.

## Uma linha para quem pensa em Shorts

Este é o formato **horizontal 16:9**, de videoaula. Para vertical 9:16 (Reels, Shorts, TikTok), o comando é o `/mira-studio`.

---

**Como começar:** rode `/mira-studio-full` e diga do que é a aula. O deck sai pronto, com o `roteiro.md` para você preencher e o launcher que abre o Chrome já em tela cheia.
