---
name: mira-cinema-deck
description: >-
  Orquestrar o deck cinematográfico de ponta a ponta: a cadeia narrativa do Story Team decide a
  história, o deck nasce com o modo cinema instalado e o mira-animator implementa a partitura com
  câmera, profundidade e grade de cor. Usar quando o usuário pedir deck cinematográfico, deck com
  história, deck com câmera, usar o Story Team, ou a sequência inteira da premissa até o HTML
  animado. Não usar para slide avulso, que é do mira-animator, nem para deck rápido, que é do
  mira-fast e não tem cinema.
---

# MIRA Cinema Deck

Um tema entra; sai um deck com história, encenação e câmera. Esta skill **não escreve HTML nem
inventa metáfora**: ela conduz a ordem, instala o que precisa existir e passa o bastão. Quem
escreve a animação é o **`/mira-cine-animator`**, o irmão cinematográfico que herda o método
inteiro do `/mira-animator` por referência. Num deck que existe para ser cinema, rotear para o
irmão comum entrega um deck comum, e foi exatamente o defeito do deck de 2026-08-07.

## Por que ela existe

A cadeia narrativa e o modo cinema já existiam separados, e não se encontravam sozinhos:

- o `/mira-direct-cinematic-motion` escreve partitura de câmera, mas se o deck não tiver o
  `mira-cinema.js` ele é obrigado a produzir direção **sem** câmera, grade nem planos;
- o `mira-cinema.js` é opt-in e não entra em deck nenhum por padrão;
- sem alguém instalar o módulo **antes** da direção, a cadeia inteira degrada em silêncio e o
  usuário recebe um deck comum achando que pediu cinema.

Esta skill é o que fecha esse laço, e a ordem abaixo é o motivo dela.

## Pré-condições, checadas antes de qualquer coisa

1. **Story Team instalado.** Confira se `/mira-premise-forge` existe. O Story Team é obrigatório e
   chega em toda instalação; se mesmo assim não existir, pare e diga:
   > "O Story Team não está instalado. Rode `npx mira-animator update` para trazê-lo."

   Não emule os agentes narrativos dentro desta skill. Um orquestrador que finge ser a cadeia
   entrega texto sem o método dela.
2. **Fonte ou tema.** Sem material nenhum, pergunte de onde vem a história antes de começar.

## A ordem, e por que é essa

### Fase 0, o deck nasce com cinema

**ANTES da direção, não depois.** É a única ordem que funciona:

```bash
npx mira-animator new <slug> --cinema
```

Isso instala quatro coisas, e as quatro são necessárias:

| Arquivo | Para quê |
|---|---|
| `mira/mira-cinema.js` + `assets/vendor/gsap.min.js` | a câmera, os planos, a grade e o ritmo |
| `mira/mira-foco.js` | o modo câmera da **tecla C**, onde o autor ajusta os cues na tela |
| `servidor.bat` na raiz do deck | `http://localhost`, sem o qual o `Ctrl+S` do modo câmera não grava direto no arquivo |

As tags entram na ordem certa (GSAP, depois o cinema, depois o foco, e os três antes dos módulos de
autoria). A instalação é do CLI, e não sua: copiar biblioteca e injetar tag é passo determinístico, e
é onde um agente falha em silêncio.

Confira que `decks/<slug>/mira/mira-cinema.js`, `decks/<slug>/mira/mira-foco.js` e
`decks/<slug>/servidor.bat` existem antes de seguir. Faltando o primeiro, pare: toda a direção de
câmera das fases seguintes seria descartada. Faltando os outros dois, o deck sai certo e o autor não
consegue ajustar nada nele, que foi o que já aconteceu: a tecla C não fazia nada porque o
`mira-foco.js` não era instalado por ninguém. Se faltar, rode `npx mira-animator update`.

Coloque o material-fonte em `decks/<slug>/references/` agora.

**Se o autor pediu "só prepare", pare aqui, e pare dizendo como voltar.** Encerre com a frase
literal:

> Deck preparado em `<caminho absoluto>`. Coloque o material em `references/` e volte com
> **`/mira-cinema-deck continuar`**. Sem esse comando a cadeia narrativa não roda, e o deck sai
> sem encenação nem partitura.

É a falha que já aconteceu: o autor preparou o deck, colocou o material e retomou com um comando
genérico de execução. A fase 1 inteira foi pulada em silêncio, o `/mira-animator` recebeu o
storyboard cru no lugar de um briefing por cena, e o deck saiu com desenho feito à mão sem
encenação. **Qualquer retomada tem que voltar por esta skill.** Ao receber `continuar`, leia o que
já existe em `references/`, diga em que etapa está entrando e por quê, e siga da fase 1.

### Fase 1, a história (Story Team)

Na ordem, um de cada vez, com o resultado de cada um alimentando o seguinte:

| # | Agente | Entrega |
|---|---|---|
| 1 | `/mira-premise-forge` | Premise Brief |
| 2 | `/mira-concept-storyteller` | Concept Contract |
| 3 | `/mira-story-architect` | Story Bible |
| 4 | `/mira-design-audience-journey` | Audience Journey Map |
| 5 | `/mira-direct-slide-sequence` | MIRA Slide Score, uma cena por slide |
| 6 | `/mira-direct-scene` | encenação: composição, planos com oclusão, enquadramento, grade do deck |
| 7 | `/mira-direct-cinematic-motion` | MIRA Motion Score: temperamento, beats, câmera, easing, loop |
| 7b | `/mira-scene-brief` | destila tudo em um briefing autossuficiente por slide, com a âncora que liga um ao outro e o campo **Cinema**, que carrega a câmera, os planos e a atmosfera daquele slide |
| 7c | `/mira-asset-scout` | decide a origem de cada ator: desenhar, buscar SVG de fonte aberta ou pedir ao autor |

**Dá para entrar no meio.** Se a premissa já existe, comece na 2; se a Story Bible está de pé, use
as três últimas. Diga ao usuário em qual etapa você entrou e por quê.

**Pare entre as etapas** e mostre a entrega. É deck que precisa convencer: vetar uma premissa custa
uma mensagem, vetar um deck pronto custa a geração inteira.

Grave cada entrega em `decks/<slug>/references/`, senão a etapa seguinte reconstrói de memória.

### Fase 2, o deck

| # | Agente | Papel |
|---|---|---|
| 8 | `/mira-builder` | monta o HTML a partir do Slide Score |
| 9 | `/mira-cine-animator` | **implementa** a partitura: metáfora, câmera, planos e grade, com a nota avaliada com o cinema ligado |
| 10 | `/mira-validator` | relatório de conformidade |

**O passo 8 monta DENTRO do deck que a fase 0 criou**, nunca num arquivo novo: o `index.html` de lá
já carrega as tags do GSAP, do `mira-cinema.js`, do `mira-foco.js` e dos módulos de autoria, na
ordem certa. Remover ou reordenar essas tags ao montar os slides desfaz a fase 0 em silêncio, e o
sintoma só aparece no passo 9, quando a câmera não tem motor. Depois do builder, confira que as tags
continuam lá.

Entre a fase 1 e o passo 9 entra o **`/mira-scene-brief`**, e ele muda o que o passo 9 recebe.

A cadeia produz cerca de 28 mil palavras antes de existir imagem. Quem desenhava o slide chegava
lendo 13 mil palavras acumuladas, e o resultado medido não era um slide melhor, era um slide
genérico: ninguém decide bem com 13 mil palavras na frente. O `/mira-scene-brief` destila tudo em um
briefing autossuficiente por slide, cerca de 180 palavras.

**A cadeia continua inteira. Ela só para de ser lida.**

Consequência para este orquestrador, e é a regra que mais muda:

- **entregue ao `/mira-cine-animator` um briefing por vez**, o daquele slide, e nada mais. Nem o Motion
  Score, nem o Slide Score, nem os briefings dos vizinhos. A única coisa que viaja junto é a tabela
  de origem do `/mira-asset-scout` daquele slide, que cabe em três linhas e evita que ele desenhe à
  mão o que não sabe desenhar;
- **confira que cada briefing tem o campo Cinema preenchido** (cues com alvo, beat, duração e razão,
  planos com oclusão). É por ele, e só por ele, que a câmera do Motion Score chega no implementador:
  briefing de deck cinematográfico sem esse campo volta para o `/mira-scene-brief` antes de qualquer
  código;
- se um slide sair errado, o defeito está **no briefing**, não no implementador. Corrija o briefing e
  gere de novo, em vez de mandar mais contexto junto. Mandar mais contexto desfaz o método.

O `/mira-cine-animator` já conhece a API (`MiraCinema.palco`, `Cam.*`, `Prof.*`, `Grade.*`) e os
tetos, herdados do método do `/mira-animator`, e não precisa da cadeia para isso.

**Exceção:** deck de um slide só não tem âncora entre cenas, e aí a destilação não paga o passo.
Nesse caso o Motion Score vai direto para o passo 9.

## Depois de pronto: a câmera se ajusta na tela, não no código

O deck sai com a câmera que o Motion Score pediu, e ela quase nunca fica certa de primeira, porque
enquadramento é decisão de olho. O ajuste fino é do autor, no navegador, com a **tecla C**, o modo
câmera do `mira/mira-foco.js` (a **tecla A** é outra coisa, a barra de ritmo do `mira-cinema.js`):

- quatro pistas, uma por efeito (zoom, travelling, tremor, tensão), para efeitos **sobrepostos** no
  tempo, que é o normal e não a exceção;
- a agulha da régua percorre a cena quadro a quadro, para achar o instante exato de um cue;
- intensidade e duração dos abalos em slider, com prévia ao vivo;
- `Ctrl+S` grava tudo como comentários `@MIRA:FOCO`, `@MIRA:CICLO`, `@MIRA:LOOP` e `@MIRA:VOLTA`
  dentro da `<section>`, no arquivo. Sobrevive ao F5 e ao próximo agente que abrir o deck.

**E é por isso que deck cinematográfico se edita pelo `servidor.bat`, não por `file://`.** Em
`http://localhost` o `Ctrl+S` lê e reescreve o `index.html` direto, sem diálogo. Em `file://` ele
depende do seletor de arquivo do Chrome, pede permissão a cada sessão e falha em qualquer outro
navegador. O `npx mira-animator new <slug> --cinema` já deixa o `servidor.bat` na raiz do deck:
**mande o autor abrir por ele**, e diga isso na entrega. O deck continua abrindo por `file://` para
apresentar, o servidor é para autorar.

Não reescreva no código cue que o autor ajustou na tela. Os marcadores são a fonte da verdade da
câmera **desde o nascimento**: o implementador escreve a direção de câmera como `@MIRA:FOCO` dentro
da `<section>`, nunca como `Cam.*` inline na timeline (contrato no `/mira-animator`, seção do modo
cinema). Cue inline é invisível para a tecla C, e um deck com câmera que o autor não consegue
ajustar é um deck com câmera errada para sempre. O código do slide conta a história, os marcadores
enquadram.

## Regras que valem sobre tudo

- **A grade de cor é do DECK, uma só.** Quem decide é o `/mira-direct-scene`, na fase 1, e todos os
  slides herdam. Grade escolhida slide a slide vira ruído, e é assim que um deck vira dez filmes.
- **Temperamento `sereno` é o padrão.** `tenso` só quando a cena pede tensão. Pedido implícito não
  conta.
- **A nota de corte (85, sem veto) é avaliada com o cinema LIGADO**, porque quem implementa aqui é
  o `/mira-cine-animator` e essa é a inversão que o define. O teste que continua valendo: tirando o
  cinema, sobrar **menos história** é legítimo; sobrar **história nenhuma** reprova nos dois irmãos,
  porque aí não havia cena, havia efeito.
- **Nenhum agente da fase 1 escreve HTML.** Se algum entregar código, descarte e peça direção.
- **`file://`, offline e ausência de build são premissa.** O deck tem que abrir com duplo clique.

## Quando NÃO usar esta skill

| Caso | Use |
|---|---|
| Um slide avulso | `/mira-animator` |
| Deck rápido, sem história | `/mira-fast` ou `/mira-ultrafast`, que não têm cinema de propósito |
| Deck de gravação com teleprompter | `/mira-studio` ou `/mira-studio-full` |
| Trocar a animação de um slide existente | `/mira-animator` no modo substituir |

## Entrega

Ao terminar, diga:

1. o caminho do deck e quantos slides tem;
2. a grade escolhida e o temperamento dominante;
3. quantos cues de câmera entraram, e em quais slides;
4. o que o usuário deve **olhar** para aprovar: a história aparece com o título escondido? o corte
   do loop aparece? o Replay deixa dois atores rodando? a câmera tem razão narrativa em cada cue?
5. o que ficou de fora, se ficou.

A conferência no navegador é do usuário. Não afirme que assistiu à animação.
