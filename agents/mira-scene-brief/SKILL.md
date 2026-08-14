---
name: mira-scene-brief
description: >-
  Destilar a cadeia narrativa do MIRA em um briefing de cena curto e autossuficiente por slide, para
  que quem desenha a animação nunca precise ler a cadeia inteira. Cada briefing traz título de tela,
  função dramática, âncoras de entrada e de saída, objetos com o nome real, história em três tempos,
  loop, temperamento, proibições e, no deck cinematográfico, a direção de cinema do slide (câmera,
  planos, atmosfera). Usar depois do Motion Score, como última etapa antes do
  /mira-animator, quando o deck tiver dois ou mais slides. Não usar para criar a premissa, estruturar
  a história, encenar o quadro nem coreografar o movimento, que são das skills anteriores da cadeia.
  NÃO usar para animar: escrever o código do slide é do /mira-animator. NÃO usar em deck de um slide
  só, onde não existe âncora entre cenas e a destilação não paga o passo.
---

# MIRA Scene Brief

## Onde isto entra no Mira

Cadeia narrativa, em ordem: `/mira-premise-forge`, `/mira-concept-storyteller`,
`/mira-story-architect`, `/mira-design-audience-journey`, `/mira-direct-slide-sequence`,
`/mira-direct-scene`, `/mira-direct-cinematic-motion`, **`/mira-scene-brief`**. Depois o
`/mira-animator` (ou o `/mira-cine-animator`, no deck cinematográfico) escreve a animação, um slide
por vez.

**Etapa 8, e é a última que produz texto.** Recebe Slide Score, Encenação e Motion Score. Entrega um
briefing por slide.

Idioma e formatação seguem `agents/_shared/idioma.md`. Travessão é proibido em qualquer texto.

## O problema que esta skill existe para resolver

A cadeia produz cerca de 28 mil palavras de direção antes de qualquer imagem existir. Quem desenha o
slide chegava lendo 13 mil palavras acumuladas para produzir uma cena, e o efeito medido não era um
slide melhor: era um slide genérico, porque ninguém decide bem com 13 mil palavras na frente.

A troca é essa: **a cadeia continua inteira, mas ela para de ser lida.** O implementador recebe cerca
de 180 palavras que bastam, e só elas.

Isso só funciona se o briefing for **autossuficiente**. Briefing que precisa de nota de rodapé, de
"veja o Slide Score para o resto" ou de explicação do autor por fora não passou, ele apenas empurrou
o problema para a frente.

## O teste que define se um briefing está pronto

Não é contagem de palavras, e fixar um número vira corte por esporte, que estraga mais do que
resolve. O teste é:

> **Um slide gerado só com este briefing sai bom, sem ninguém explicar nada por fora?**

Se o autor precisou completar de boca, faltou no briefing. Se o implementador teve que abrir a
cadeia, faltou no briefing. É verificável e não depende de contar palavra.

Como referência prática, e não como teto: os briefings validados têm cerca de 180 palavras, contra
320 do slide equivalente no Slide Score. O ganho não veio de encurtar, veio de escolher.

## Formato do briefing, nove campos, mais um décimo só de deck cinematográfico

Todos obrigatórios. Campo vazio é decisão não tomada, e ela vai reaparecer como invenção do
implementador.

| Campo | O que traz | Erro comum |
|---|---|---|
| **Título de tela** | o texto literal que vai aparecer | escrever o assunto em vez da frase |
| **Função dramática** | o que o público sente ao entrar e ao sair | "explicar o conceito", que não é função |
| **Âncora de entrada** | o que já está em cena, herdado do slide anterior | "nenhuma" quando não é o primeiro |
| **Âncora de saída** | o que fica, e onde, para o próximo começar dali | descrever sem dizer a POSIÇÃO |
| **Objetos em cena, com o nome real** | o que se desenha, nomeado como a coisa é | "um elemento representando dados" |
| **História em três tempos** | começo, virada, consequência | três tempos que são o mesmo tempo |
| **Loop** | o que repete, e o repouso antes de reiniciar | esquecer o repouso, e o loop vira nervoso |
| **Temperamento** | `sereno`, `natural` ou `tenso` | `tenso` por padrão, que é o vício |
| **Proibições** | o que não pode aparecer nesta cena | deixar vazio quando a cadeia proibiu algo |
| **Cinema** (só deck cinematográfico) | a direção de cinema DESTE slide, destilada do Motion Score e da Encenação | omitir o campo e a câmera do deck inteiro morrer no caminho |

**O campo Cinema** só existe quando o deck tem o `mira-cinema.js` e o implementador é o
`/mira-cine-animator`. Ele traz, em até 6 linhas: os cues de câmera do slide (tipo, alvo com posição
no quadro, beat, duração e razão narrativa de cada um, prontos para virarem marcadores
`@MIRA:FOCO`), os planos de profundidade com a oclusão declarada, e a intenção de atmosfera se
houver. Sem chamada de API e sem código: é direção em texto, como o resto do briefing. Este campo é
o único caminho pelo qual a câmera do Motion Score chega em quem escreve o código; sem ele o deck
cinematográfico sai sem câmera, que foi o defeito medido.

## Quando existir conceito alinhado, ele entra como referência

Alguns decks têm `storyboard/concept-brief.md` e quadros em `storyboard/approved/`. Isso nasce
quando o autor **pede explicitamente** o `/mira-concept-align` e o `/mira-storyboard`, porque a ideia
estava confusa. É fluxo alternativo, não o caminho normal, e **a maioria dos decks não tem**.

Não existindo, ignore esta seção: nada muda.

Existindo, acrescente a cada briefing uma seção curta, com o que vale **naquele slide**:

```markdown
## Conceito aprovado

- **Quadro:** `storyboard/approved/slide-03.svg`
- **Intenção:** mostrar que a distância para a fonte original está aumentando
- **Elementos obrigatórios:** a fonte original permanece visível em quadro
- **Interpretações proibidas:** não sugerir que o modelo foi corrompido de fora
```

`Quadro` sai de `approved/`; `Intenção` é o `visual_intent` daquele quadro; os outros dois saem do
`concept-brief.md`. Slide sem quadro correspondente recebe `Quadro: sem quadro correspondente`, e os
outros campos trazem o que vale para o deck inteiro.

**Teto de 150 palavras**, senão o briefing volta a ser grande demais e o defeito que esta skill veio
consertar volta junto.

Isto é **referência para quem desenha**, não portão: briefing sem a seção não é inválido, e nada
trava por causa dela. Quem quiser conferir se a referência chegou nos slides roda
`npx mira-animator storyboard verify <deck>`, e o comando só relata.

E um cabeçalho para o CONJUNTO, uma vez só, não por slide:

- tema do deck;
- direção aprovada;
- **elemento de continuidade**: a coisa que atravessa os slides e muda de função entre eles;
- a frase que trava o método: cada briefing é autossuficiente, quem desenha recebe só o dele.

## A âncora é o campo que não pode falhar

Os outros oito descrevem uma cena. A âncora é o único que liga uma cena à outra, e é ela que separa
um deck de cenas bonitas sem história.

Regras, e são numéricas:

1. **A âncora de saída de um slide é, literalmente, a âncora de entrada do seguinte.** Se as duas
   frases não descrevem a mesma coisa no mesmo lugar, a continuidade não existe.
2. **Âncora tem POSIÇÃO.** "A árvore de arquivos" não é âncora. "A árvore de arquivos vazia, no lado
   direito do quadro" é.
3. **Âncora é um objeto em cena, nunca um conceito.** "A sensação de dúvida" não ancora nada.
4. **O primeiro slide não tem entrada, o último não tem saída.** Qualquer outro que tenha um dos dois
   vazios é erro.

Escrever a âncora obriga a olhar dois slides ao mesmo tempo, coisa que nenhuma etapa anterior da
cadeia faz. É o passo mais caro desta skill e o motivo dela existir separada.

## Fluxo

### 1. Ler a cadeia inteira, uma vez

É a única etapa que tem esse direito, e é o que compra o direito de todas as outras não terem.

### 2. Achar o elemento de continuidade

Um objeto que aparece em vários slides e **muda de função** entre eles. No deck validado era uma
árvore de arquivos: vazia e incômoda no primeiro, preenchida como resposta no segundo, comparada com
outra no terceiro.

Se não houver nenhum, pare e diga. Um deck sem elemento de continuidade não tem o que ancorar, e o
problema é da história, não do briefing.

### 3. Escrever um briefing por slide

Na ordem do deck, porque a âncora de saída de um é a entrada do outro e escrever fora de ordem
produz âncoras que não fecham.

### 4. Conferir o encadeamento

Leia só os campos de âncora, do primeiro ao último, ignorando o resto. Tem que ler como uma frase
contínua. Se travar em algum ponto, é ali que o deck vai parecer picotado na tela.

### 5. Entregar

Um arquivo em `references/briefings-de-cena.md` do deck, e o aviso ao `/mira-animator` de que ele
recebe **um briefing por vez**, nunca o arquivo inteiro.

Antes de passar o bastão, mande a lista de objetos ao **`/mira-asset-scout`**. Ele devolve, por
objeto, desenhar, buscar SVG de fonte aberta ou pedir ao autor, e essa tabela vai colada no briefing
do slide. Objeto nomeado sem origem declarada é o que produz figura humana desenhada à mão.

## Regras que valem sobre tudo

- **Nome real, não metáfora, quando a direção pediu a coisa real.** Se o Motion Score diz "mostrar a
  coisa real", os objetos são `terminal`, `árvore de arquivos`, `prd.md`. Não "um elemento que
  representa a estrutura".
- **Proibição herdada é obrigatória.** Se a cadeia proibiu métrica de produtividade, número de tempo
  economizado ou a expressão "agente de IA", isso desce para o campo de proibições de cada slide que
  poderia cair nessa tentação. O implementador não leu a cadeia e não tem como saber.
- **Nada de câmera, easing, cue nem API em deck comum.** O briefing diz o que acontece e o que se
  sente. Como filmar é do Motion Score, e escrever o código é do `/mira-animator`. **Em deck
  cinematográfico a câmera viaja no campo Cinema**, porque o implementador não recebe o Motion
  Score: descartá-la ali é descartá-la do deck. Continua sem API e sem código nos dois casos.
- **Um briefing não menciona outro.** "Como no slide anterior" quebra a autossuficiência, que é a
  única coisa que esta skill entrega. A continuidade viaja pela âncora, que é autocontida.
- **Esta skill não escreve HTML.** Se entregar código, descarte e peça o briefing.

## Quando NÃO usar

- **Deck de um slide.** Sem slide vizinho não existe âncora, e a destilação não paga o passo. Mande o
  Motion Score direto para o `/mira-animator`.
- **Consertar um slide que já existe.** É `/mira-animator`.
- **Antes do Motion Score.** Sem ele o briefing não tem loop nem temperamento, e vai inventar os dois.
