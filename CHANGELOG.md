# Changelog

Mudanças de cada versão do `mira-animator`, em linguagem de quem usa.

O histórico começa na 0.1.51. Para o que veio antes, veja o `git log`.

## 0.1.61

### Corrigido

**O áudio da gravação nativa sai em stereo.** A tecla R gravava sempre em mono, nos dois
formatos. O gravador nunca pedia o número de canais: abria o microfone com `audio: true` e
copiava para o AAC o que a track dissesse, com um `|| 1` que fechava o caminho em mono quando
ela não dizia nada. Medido na máquina do autor, com o diagnóstico novo: `channelCount: 1`, com
cancelamento de eco, supressão de ruído e ganho automático todos ligados. Essa cadeia de voz do
Chrome opera em um canal.

Agora a captação pede 2 canais como **ideal**, nunca `exact`: `exact` faria a gravação falhar
em microfone mono e sair sem áudio nenhum, que é pior que o defeito. Se a track vier com 1 canal
mesmo assim, o sinal passa por um grafo Web Audio com destino stereo e o canal é duplicado nos
dois lados. **Isso é declarado, sempre**: o painel mostra `stereo (dup)` e o diagnóstico traz
`mic.stereoDuplicado: true`. Chamar mono duplicado de stereo seria pior que entregar mono.

Os filtros de voz **não** foram desligados. Desligá-los é o único jeito de tirar stereo real de
um dispositivo que a cadeia esteja achatando, mas muda o som de todas as gravações e sem
cancelamento de eco uma caixa aberta volta a vazar para o microfone. Essa troca é decisão de
quem grava, e fica para uma próxima volta.

**Áudio e vídeo alinhados no MP4.** As duas trilhas eram zeradas **cada uma na própria origem**,
e a distância real entre o início das duas capturas era descartada. Medido em duas gravações
seguidas: 1,1 ms numa e **30,4 ms na outra**. O desvio varia conforme a latência de
inicialização de cada pipeline, e 30 ms é acima do limiar em que a boca desencontra da voz para
quem sabe olhar.

Não confundir com o drift do Premiere, corrigido na 0.1.55 pela grade CFR: aquele é
**progressivo** e vem de VFR. Este é um deslocamento que já nasce com o arquivo, e sobreviveu às
duas correções de relógio anteriores.

A correção não é trocar a constante do muxer. `firstTimestampBehavior: 'offset'` destrói o
alinhamento, e `'cross-track-offset'` sozinho destrói o arquivo: o vídeo já chega ao muxer
rebaseado em zero pela grade CFR, então o mínimo entre as duas trilhas dá zero e o áudio iria
parar a minutos de distância. Agora as duas trilhas são levadas a uma **origem comum** antes do
muxer, com uma fila de espera até as duas âncoras serem conhecidas e uma guarda: se os relógios
estiverem em bases incomparáveis, o gravador volta ao comportamento antigo e **avisa**, em vez
de entregar arquivo torto em silêncio.

### Novo

**O painel de gravação mostra o que antes ninguém conseguia ver.** Ao lado dos contadores da
grade CFR aparecem agora `mic 2ch` (ou `stereo (dup)`) e `A/V ±N ms`, o desvio medido entre as
âncoras das duas trilhas. O diagnóstico JSON ganhou `mic{}` com as settings reais do microfone e
`av{firstVideoUs, firstAudioUs, deltaMs}`.

Sem isso, nenhum dos dois defeitos acima era verificável por quem grava, e foi exatamente por
isso que uma afirmação errada sobre a sincronia sobreviveu tanto tempo na documentação.

**Contagem regressiva no `/mira-studio`.** O 9:16 ganhou a contagem de 5 segundos antes de
começar a gravar que o `/mira-studio-full` já tinha. Ela aparece para você e não entra no vídeo.

### Nota

Deck que já existe **não** recebe estas correções sozinho. Rode `mira edit <deck>` para atualizar
a cópia do gravador dentro dele. Deck novo já nasce corrigido.

## 0.1.60

### Novo

**`/mira-sequence`, uma animação que continua no slide seguinte.**

Todo slide do Mira começa do zero. A animação entra coreografada, roda o loop dela e acaba ali,
porque o slide seguinte é outro palco com outra história. Faltava o caso em que a cena não acabou:
a bola quica pela tela e para no centro, e o que você quer é **continuar dali**, com a bola só
subindo e descendo, sem que ninguém perceba que trocou de slide.

O `/mira-sequence` cria esse slide seguinte. Ele nasce na pose exata em que o anterior estava,
sem entrada nenhuma, e a passagem entre os dois é um corte seco. Na plateia lê como uma animação
só, que muda de comportamento no meio.

O problema real não é copiar o último quadro, é que **loop perpétuo não tem último quadro**: a bola
está onde estiver no instante em que você aperta a seta. Por isso a continuidade é resolvida por
uma pose viva. O slide de origem publica a posição real dos atores num barramento a cada quadro, e
o slide de continuação trava essa pose no instante em que entra. Entregando com a bola no ar, ela
continua do ar. Existe ainda uma pose de repouso declarada como plano B, obrigatória, que faz o
slide funcionar sozinho para quem abrir o deck direto nele e para o `/mira-slide-to-video`, que
grava cada slide isolado a partir do zero.

**A transição global do deck não é tocada.** O corte seco vale para o par e para mais nada, porque
ele só lê como continuidade se as outras passagens continuarem diferentes dele.

Vem com um deck de exemplo que abre e roda, em `references/exemplo-bola.html`.

## 0.1.59

### Novo

**`/mira-brainstorming`, a porta que faltava na camada de brainstorming.**

Os dois agentes da 0.1.58 assumem que já existe alguma coisa: o `/mira-concept-align` assume uma
ideia, o `/mira-storyboard` assume metáforas candidatas. Faltava o caso mais comum, o de chegar com
um tema e nada mais ("tenho que apresentar sobre agentes"). Nele, perguntar "qual é a sua ideia?" é
a pergunta errada, porque você ainda não tem uma.

O `/mira-brainstorming` pergunta plateia, formato e o que te incomoda no assunto, e a partir daí
**gera**: de 8 a 12 ângulos concorrentes, cada um vindo de uma origem diferente de propósito (o
contraintuitivo, o mecanismo por dentro, o custo escondido, o eco histórico, a consequência, o erro
que a plateia comete hoje). Você reage à lista, ele corta para 2 a 4 finalistas e declara **o que
cada um custa**, o que fica de fora e onde pode ser lido errado. Candidato sem custo declarado é
candidato mal descrito.

O fecho é uma frase só: "o deck existe para a plateia sair entendendo que...". É ela que o
`/mira-concept-align` recebe para clarear. Grava `storyboard/brainstorm.md` na raiz do deck,
anexando cada rodada sem apagar a anterior, e **só você escolhe o ângulo**.

Sendo a porta da camada, ele também roteia: chegou com a ideia pronta e só confusa, ele te manda
para o `/mira-concept-align`; chegou com as candidatas definidas, para o `/mira-storyboard`.

## 0.1.58

### Novo

**Dois agentes de brainstorming, para quando a ideia ainda não está clara.**

São **fluxo alternativo**: você chama quando quer, e nada no caminho normal muda por causa deles.
O que produzem é insumo, referência para quem for desenhar depois ou material para melhorar um deck
que saiu confuso.

O `/mira-concept-align` conversa antes de qualquer produção. Ele pergunta, detecta ambiguidade com
perguntas que já trazem as leituras concorrentes em vez do genérico "pode explicar melhor?", propõe
hipóteses rotuladas como hipóteses, e faz **teach-back**: explica a sua ideia com as palavras dele
para você corrigir o que ele entendeu errado. **Só você fecha o brainstorming.** Ele pode dizer que
acha que há alinhamento suficiente, e nunca encerra sozinho.

O `/mira-storyboard` é o Diretor Criativo. Ele transforma as metáforas candidatas em **quadros de
verdade**, SVG e PNG dentro de `storyboard/` na raiz do deck, em opções concorrentes lado a lado.
Você corrige em linguagem natural ("no slide 3 a fotografia original deve desaparecer"), sem tocar
em SVG nem em coordenada, e cada correção gera uma versão nova sem apagar a anterior.

A ideia é trocar o custo do erro: é muito melhor rejeitar um esboço de caixas e setas do que
rejeitar uma animação pronta.

**`npx mira-animator storyboard`**, com dois subcomandos:

- `render <pasta>` transforma as cenas em `.svg` e `.png` e monta uma folha de contato que abre em
  `file://`, com as opções concorrentes separadas por um "OU" e um texto ao lado de cada quadro
  explicando a cena;
- `verify <deck>` confere se o conceito chegou nos slides. **Só relata, nunca corrige**, e um deck
  sem conceito não é defeito nenhum.

O desenho é determinístico e roda offline, sem chamada de API e sem custo por quadro. O traço de
rascunho vem do Rough.js, embutido no pacote como o GSAP e o D3 já são.

### Corrigido

**`mira-fast`: falha na publicação não deixa mais lixo no deck.**

Quando o `index.html` do deck era uma pasta, a montagem movia a pasta para o lado, escrevia o
arquivo novo e então quebrava na limpeza, deixando para trás o `index.html` e uma pasta
`.mira-fast.bak` com o seu conteúdo dentro. Agora a publicação **falha limpa** nesse caso, sem tocar
na pasta, porque o plano B de troca existe para arquivo travado por outro processo e não para pasta.
Trocar a sua pasta por um arquivo apagaria o conteúdo dela em silêncio.

## 0.1.56

### Novo

**Dois agentes novos no Story Team, que agora tem 10.**

O `/mira-scene-brief` resolve um problema que aparecia como slide genérico. A cadeia narrativa
produz cerca de 28 mil palavras de direção, e quem desenhava o slide chegava lendo 13 mil palavras
acumuladas. Ninguém decide bem assim. Ele destila tudo num briefing curto e autossuficiente por
slide, e o animator passa a receber **um briefing por vez**. A cadeia continua inteira, ela só para
de ser lida.

O `/mira-cine-animator` é o irmão do `/mira-animator` para o slide em que o cinema **é** a cena, e
não o tempero. Ele não copia o método, aponta para o outro e inverte duas travas: um recurso de
cinema pode ser a mudança de estado dominante, e a nota de corte é avaliada com o cinema ligado.
Como não há cópia, recurso novo que entra num aparece no outro sozinho.

**Tensão de câmera, e o tremor virou impacto de verdade.**

`Cam.tensao` é vibração fraca e sustentada, o quadro que não assenta enquanto a ameaça dura. O
`Cam.tremor` ganhou envoltória de impacto, com ataque e queda, no lugar da vibração uniforme.

E os dois **convivem com o resto**: enquadramento, tremor e tensão viraram canais separados que o
motor soma. Tensão sustentada, com um tremor por cima, durante um zoom, é uma frase de câmera
legítima agora, não um conflito.

**Modo câmera na tecla `C`.**

Quatro pistas, uma por tipo de efeito, para cues sobrepostos no tempo. Agulha que percorre a cena
quadro a quadro. Intensidade e duração em slider, com prévia ao vivo. Salva tudo como comentário
dentro da `<section>`, e sobrevive ao F5.

### Corrigido

**O loop dos slides estava desligado, em todo deck com o modo câmera.** Um padrão errado desligava
o loop de todos os slides na carga, por cima do que o motor já tinha configurado. Nem F5 resolvia,
porque a coisa se repetia a cada abertura. O sintoma era estranho o bastante para despistar: "as
partículas param no fim da animação".

**Poeira, fumaça e faísca morriam junto com a história.** Elas rodavam no relógio da cena, então um
slide que fecha no último quadro virava foto. Agora a atmosfera tem relógio próprio: a história pode
parar, o ar continua. No modo edição as duas congelam, para você não arrastar um elemento com fumaça
correndo por cima.

**Um tremor no meio de um zoom desfazia o zoom.** Efeito colateral de os dois disputarem o mesmo
canal. Com canais separados, não disputam mais.

Mais quatro correções menores no modo câmera: abalos que empilhavam a cada Play, quadro que ficava
deslocado ao voltar com a agulha, intensidade que voltava zerada do arquivo, e marcadores que
duplicavam a cada save.

### Documentação

**Catálogo de câmera**, nas referências do `/mira-direct-cinematic-motion`: 30 efeitos de linguagem
cinematográfica cruzados com o que o motor faz de verdade, em quatro prateleiras, mais um índice por
intenção ("a cena precisa de choque, com o que eu faço?").

Um fato medido que vale para quem dirige: **zoom quase não produz parallax**. Zoom é lente, não
passo, e todas as camadas crescem igual. Profundidade se pede com travelling.

## 0.1.55

### Corrigido

**O `update` não trazia time novo, e por isso o Story Team não apareceu para quem atualizou.**
Se você instalou o Mira antes da 0.1.54 e rodou `npx mira-animator update`, os sete agentes de
narrativa não chegaram. A regra era "só reinstalo o time que você já tinha", o que está certo para
quem recusou um time, mas deixava um buraco: um time lançado DEPOIS da sua instalação nunca chegava,
e não existia comando que o trouxesse sem refazer a instalação inteira.

Agora o `update` detecta time opcional disponível e não instalado, e pergunta uma vez. O padrão da
pergunta é **não**, para continuar respeitando quem recusou de propósito. Em execução não interativa
ele imprime a instrução em vez de travar.

### Adicionado

**`/mira-cinema-deck`: o orquestrador do deck cinematográfico.** A cadeia narrativa e o modo cinema
existiam separados e não se encontravam sozinhos. Sem o `mira-cinema.js` dentro do deck, o
`/mira-direct-cinematic-motion` era obrigado a escrever direção **sem** câmera, grade nem planos, e
você recebia um deck comum achando que tinha pedido cinema.

O `/mira-cinema-deck` fecha o laço: cria o deck já com o cinema instalado, roda as sete etapas
narrativas na ordem com pausa entre elas, e entrega o Motion Score ao `/mira-animator`, que agora
sabe implementá-lo. Instala junto com o Story Team.

**`npx mira-animator new <nome> --cinema`.** Instala `mira/mira-cinema.js` e
`assets/vendor/gsap.min.js` no deck e injeta as tags na ordem certa. Continua opt-in: deck sem a
flag não carrega o GSAP nem o módulo.

**O `mira-animator` aprendeu a API do cinema.** Era o elo quebrado: o diretor de movimento já
conhecia `MiraCinema.palco`, `Cam.*`, `Prof.*` e `Grade.*`, mas quem implementa não. Agora conhece,
com os tetos (2 cues em `sereno`, 3 a 5 planos, raio máximo 4, tremor de 400 ms, razão obrigatória)
e a trava de que a nota é avaliada com o cinema desligado.

**GSAP vendorizado no pacote** (`templates/vendor/gsap.min.js`, core sem plugins). O
`mira-cinema.js` depende dele e nada o copiava, então o modo cinema não abria offline.

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
