# Changelog

Mudanças de cada versão do `mira-animator`, em linguagem de quem usa.

O histórico começa na 0.1.51. Para o que veio antes, veja o `git log`.

## 0.1.54

### Mudado

**O palco agora ocupa o quadro inteiro, e o título fica por cima dele.** No `mira-default`, a
animação era "o que sobrava depois do título": uma faixa no meio do slide, com margem em volta.
Agora o palco cobre a `<section>` de borda a borda, e o título passa a flutuar sobre ele.

Duas coisas para saber:

- **O título está acima de tudo que é do template.** Continua abaixo dos módulos de autoria
  (`mira-draw`, `mira-edit`), de propósito: senão você não conseguiria desenhar nem editar por
  cima dele.
- **A animação evita a faixa do título sozinha.** O `palco()` mede o título de verdade, no
  tamanho que ele tiver naquela tela, e entrega a área livre para a animação:
  `F.topo`, `F.alturaUtil` e `F.vy(k)`, que substitui o antigo `F.H * k`. A medida é refeita no
  resize, porque em tela estreita o título quebra em mais linhas e a faixa encolhe junto.

Nada focal sobe acima de `F.topo`. Movimento de ambiente pode atravessar, porque atrás do
título ele lê como profundidade e não como conflito. Os 50px de área segura das bordas
continuam valendo.

Deck que você já tem não muda.

**As apresentações vinham nervosas. Agora nascem serenas.** Se você achava que os slides do Mira
se mexiam rápido demais, que nada parava para respirar e que tudo tinha um quique a mais, não
era impressão sua: a orientação que o Mira seguia permitia até 7 acontecimentos em 4,5 segundos,
o que dá 640 milissegundos para cada um. Diante de uma faixa larga assim, o gerador escolhia
sempre o lado mais apertado.

A partir desta versão a cena declara um **temperamento**, e o padrão é `sereno`:

| | `sereno` (padrão) | `natural` | `tenso` |
|---|---|---|---|
| Ciclo do loop | 9 a 14 s | 7 a 10 s | 4,5 a 7 s |
| Acontecimentos | 4 a 5 | 5 a 6 | 6 a 7 |
| Pausa antes de recomeçar | 1,2 a 2,0 s | 0,8 a 1,2 s | 0,4 a 0,7 s |

`tenso` só entra quando você pede tensão na cena, uma torre desabando, um alarme. Pedido
implícito não conta.

Três consequências que você vai notar:

- **Todo ciclo tem pelo menos 1 segundo em que nada principal se mexe.** É a respiração da cena,
  e é o que separa uma animação de um letreiro luminoso.
- **Sumiram os quiques.** As curvas `back`, `elastic` e `bounce` saíram do padrão. Elas produzem
  aquele repique no fim do movimento, e repique repetido faz a cena parecer agitada mesmo quando
  é lenta. Continuam disponíveis em `tenso`, e quando a metáfora exige (uma mola é uma mola).
- **O estado vivo virou deriva lenta.** Em vez de repetir o gesto principal a cada poucos
  segundos, a cena prefere algo que respira ou avança quase imperceptivelmente. Gesto repetindo a
  cada 5 segundos é o que mais cansa numa apresentação longa.

O ciclo mais longo é deliberado: o slide é visto enquanto alguém fala por cima dele.

**Isso vale para decks NOVOS.** Nenhum deck que você já tem muda. Se misturar slides antigos e
novos no mesmo deck, os ritmos vão ficar visivelmente diferentes, e é esperado.

O `/mira-fast` herdou a mesma tabela, e o `/mira-ultrafast` herdou a linha do `sereno`.

### Adicionado

**`mira-cinema.js`, a base do modo cinematográfico, entra no pacote.** É o módulo que dá ao slide
câmera (enquadramento que se move), profundidade em planos com parallax, grade de cor e ritmo
por slide pela tecla `A`.

**Ele ainda não é ligado em nenhum deck**, e isso é de propósito: o Mira só torna um recurso
padrão depois de ele se provar. Nesta versão o arquivo viaja junto para que os primeiros decks
possam optar por ele, mas o `new` e o `edit` não o instalam, e nenhum template o carrega. Na
prática, se você não for atrás dele, nada muda para você.

**Chegou o Story Team, sete agentes que cuidam da história antes do deck existir.** Se você já
sentiu que o Mira monta slides bonitos sobre um conteúdo que ainda não virou história, é este time.
Ele é **opcional**: aparece como uma terceira caixa na instalação, desmarcada por padrão. Quem não
marcar não muda nada.

A ordem é `/mira-premise-forge`, `/mira-concept-storyteller`, `/mira-story-architect`,
`/mira-design-audience-journey`, `/mira-direct-slide-sequence`, `/mira-direct-scene` e
`/mira-direct-cinematic-motion`. Dá para entrar em qualquer ponto: se a premissa já existe, comece
na segunda; se a história já está de pé, use as três últimas.

Três coisas para saber:

- **Nenhum deles escreve HTML nem inventa metáfora.** Eles produzem direção em texto, e quem escreve
  a animação continua sendo o `/mira-animator`, com o método de metáfora e a nota de corte de sempre.
- **O `/mira-direct-scene` é a peça nova de verdade.** Ele cuida do que existe antes do movimento:
  onde os atores estão, que tamanho têm, o que passa atrás do quê, se a cena tem chão, e qual é a
  grade de cor do deck inteiro. É o que separa um deck que parece um filme de um deck que parece
  dez filmes.
- **Eles dirigem contra o Mira que existe.** Nada de motor de animação, IR ou compilador, e nada de
  PixiJS, Three.js, Lottie ou Rive. Luz de cena, âncora entre slides e atmosfera estão marcadas como
  planejadas, então o agente registra a intenção em vez de chamar API que não existe.

### Conhecido

O teste `BUG-20260731-ETPU`, sobre o rollback do `mira-fast` deixar arquivo para trás quando a
gravação falha tarde, continua vermelho. É anterior a esta versão e não foi tocado aqui.

## 0.1.53

### Adicionado

**Plugins: agora você pode escrever os seus próprios agentes do Mira.** Até aqui, criar um agente
novo exigia mexer em seis lugares dentro do pacote publicado, ou seja, só quem tem acesso ao
repositório conseguia. Agora não.

Um plugin é uma pasta em `mira-plugins/`, na sua instalação, com um `SKILL.md` e um
`mira-plugin.json`. **Instalar é colocar a pasta lá. Desinstalar é apagar a pasta.** Não tem
comando obrigatório em nenhum dos dois casos: no início da sessão o Mira olha a pasta e acerta o
que mudou, ativando o que apareceu e removendo o que sumiu.

Para compartilhar, `npx mira-animator plugin pack <id>` gera um arquivo `.mplug` que você manda
por onde quiser. Quem recebe roda `npx mira-animator plugin add <arquivo>`, ou simplesmente
coloca a pasta em `mira-plugins/`. Instalar plugin de outra pessoa não exige nada além do Mira.

Para criar, use **`/mira-new-plugin`**. Ele confere se o Reversa está instalado na sua pasta,
instala com a sua confirmação se faltar, e conduz a especificação e a implementação escrevendo
direto dentro de `mira-plugins/<id>/`. Duas coisas para saber antes: as specs ficam na sua
máquina e não viajam dentro do pacote, e criar plugin exige Reversa, mas usar não exige.

Comandos novos: `plugin list`, `plugin sync`, `plugin validate`, `plugin pack` e `plugin add`.

Três regras que o Mira aplica sozinho: o identificador não pode começar com `mira-`, que fica
reservado aos agentes nativos; a pasta não pode conter arquivo executável, porque plugin é
ativado sem passo intermediário e código de terceiro entrando assim é risco que não se conserta
depois; e tudo que o plugin usa mora dentro da própria pasta, para que apagar a pasta desinstale
de verdade.

Nada da instalação atual muda. Seus decks, agentes e templates continuam iguais.

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
