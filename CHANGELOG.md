# Changelog

Mudanças de cada versão do `mira-animator`, em linguagem de quem usa.

O histórico começa na 0.1.51. Para o que veio antes, veja o `git log`.

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
