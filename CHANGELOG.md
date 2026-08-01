# Changelog

Mudanças de cada versão do `mira-animator`, em linguagem de quem usa.

O histórico começa na 0.1.51. Para o que veio antes, veja o `git log`.

## 0.1.52

### Corrigido

**Mudar a ordem dos slides agora leva o texto do roteiro junto.** Era o problema mais chato do
Studio: você movia um slide e o teleprompter continuava mostrando a fala de quem estava
naquela posição antes. A animação tocava debaixo do texto errado.

Cada slide passou a ter um nome próprio, que aparece nos dois arquivos: uma linha
`<!-- mira-slide-id: ... -->` no `roteiro.md` e um `data-mira-slide-id` no slide do
`index.html`. O deck reconhece o slide pelo nome, não mais pela posição.

Na prática: você pode mudar a ordem onde preferir, no seu editor de texto ou no modo de edição
do deck (tecla **E**), e o slide vai inteiro — desenho, título e fala juntos. Vale para os dois
formatos, o vertical 9:16 e o 16:9.

Deck que você já tem continua funcionando como antes e não precisa de conversão. O nome só
entra em deck novo.

**Reordenar no modo E não perdia mais o roteiro (9:16).** No deck vertical, o Salvar reescrevia
só o `index.html` e deixava o `roteiro.md` intocado, e no reload o deck voltava para a ordem
antiga. Agora o Salvar grava os dois na mesma ordem. Se qualquer um dos dois recusar (roteiro
com número de slides diferente do da tela, ou arquivo alterado por fora), nada é gravado e os
dois continuam iguais.

**Reordenar durante a gravação é recusado**, com aviso, em vez de bagunçar o take.

**Deck gerado não corrompe mais ao salvar uma reordenação.** Os comentários de exemplo que o
template usa para documentar os slides sobreviviam no deck montado, sem os slides que
descreviam. O Salvar embaralhava esses comentários em vez dos slides: ou recusava, ou gravava
um arquivo com o marcador de fim duplicado, com aviso verde de "Salvo".

### Ainda não resolvido

**A caneta não acompanha a reordenação.** Desenho feito com a tecla **P** continua guardado pela
posição do slide, nos dois formatos. Mudou a ordem, o desenho fica no lugar antigo.

## 0.1.51

### Novidade

**Novo comando `/mira-ultrafast`** — versão mais rápida do `/mira-fast` para gerar deck.

### Corrigido

**Deck de gravação parou de quebrar.** Era o problema mais grave: você gerava um deck Studio e
ele não funcionava, sem dar erro nenhum.

- **16:9** — o deck apagava os seus slides no momento de abrir e mostrava os slides de exemplo
  do Mira no lugar.
- **9:16** — os slides ficavam lá, mas nenhuma animação tocava quando o deck era servido pelo
  launcher (o jeito certo de gravar com câmera).

Os dois eram silenciosos: nada aparecia no console, o deck parecia pronto.

**Seu `roteiro.md` não é mais apagado.** Antes, rodar a montagem de novo jogava fora tudo que
você tinha escrito no roteiro e devolvia o texto original. Agora a montagem só cria o arquivo
quando ele não existe.

**As falas do teleprompter agora são as suas.** Todo deck gerado nascia com as quatro falas do
deck de demonstração do Mira embutidas. Aberto sem servidor, o teleprompter mostrava o texto
errado.

**A capa voltou a ser capa.** No 9:16, a capa virava uma tela de câmera vazia: título e
subtítulo sumiam.

**Slide de tela cheia com o enquadramento certo.** A animação ficava colada nas bordas, sem a
margem de segurança para Reels e Shorts.

**Montagem que falha não deixa bagunça.** Antes, um erro deixava os launchers e os arquivos de
apoio na pasta sem o `index.html` — você clicava no launcher e o servidor subia servindo um
deck que não existia.

**Validação mais rigorosa.** O Mira agora recusa slide fora do padrão antes de montar, em vez
de deixar passar e quebrar depois.
