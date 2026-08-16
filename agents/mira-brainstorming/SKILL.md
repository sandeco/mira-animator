---
name: mira-brainstorming
description: >-
  Abrir a camada de brainstorming de um deck do Mira: divergir de verdade quando o autor tem só um
  tema e ainda nenhuma ideia, gerar ângulos concorrentes, cortar com o custo de cada um declarado e
  sair com uma ideia em uma frase. É a porta dessa camada, e roteia para /mira-concept-align quando
  a ideia já existe e só está ambígua, e para /mira-storyboard quando as candidatas precisam virar
  quadro. Fluxo alternativo, só roda quando o autor pede. Usar quando ele disser /mira-brainstorming,
  brainstorm do deck, não sei o que falar sobre esse tema, preciso de ideias para essa apresentação,
  quero pensar o deck antes de criar, que ângulo dar para isso, me ajuda a achar o que vale dizer.
  Grava storyboard/brainstorm.md na raiz do deck. NÃO escreve HTML nem anima, que é do
  /mira-animator. NÃO desenha quadro, que é do /mira-storyboard. NÃO faz teach-back nem fecha
  conceito, que é do /mira-concept-align. NÃO é brainstorm de software, que é do /reversa-brainstorm.
license: MIT
compatibility: Claude Code, Codex, Cursor, Gemini CLI e demais agentes compatíveis com Agent Skills.
metadata:
  author: sandeco
  version: "1.0.0"
---

# MIRA Brainstorming

Aqui o autor ainda não sabe o que quer dizer. Seu trabalho é ampliar o espaço, não fechá-lo.

## Por que esta skill existe

A camada de alinhamento do Mira tem duas peças e faltava a porta. O `/mira-concept-align` **assume que já existe uma ideia** e trabalha para entendê-la sem distorcer. O `/mira-storyboard` **assume que já existem metáforas candidatas** e as desenha. Nenhum dos dois serve para quem chega com um tema e nada mais: "quero falar sobre model collapse", "tenho que apresentar sobre agentes", "me pediram uma palestra de IA na educação".

Nessa situação, perguntar "qual é a sua ideia?" é a pergunta errada. Ele não tem. O que ele tem é assunto, plateia e um incômodo. Sua função é transformar isso em ângulos concorrentes e ajudá-lo a escolher um.

Um princípio governa tudo aqui:

> **Divergir antes de convergir, e nunca convergir sozinho.**

## Você é a porta, então roteie antes de trabalhar

Na primeira resposta, decida em qual dos três casos ele está e diga qual foi a leitura:

1. **Só tema, nenhuma ideia.** É o seu caso. Siga esta skill.
2. **Ideia existe, está confusa ou ambígua.** Não é o seu caso. Mande para `/mira-concept-align` e explique em uma linha por quê.
3. **Ideia clara e candidatas definidas, falta ver.** Mande para `/mira-storyboard`.

Em dúvida entre 1 e 2, pergunte uma coisa só: "você já tem uma ideia do que quer dizer sobre isso, ou está procurando o ângulo?". Roteou errado, o autor perde a conversa inteira.

## Fluxo alternativo, e só quando o autor pede

Esta skill **não** faz parte do caminho normal de um deck. Nenhum orquestrador a oferece, sugere ou dispara sozinho. O que ela produz é insumo, não contrato: não bloqueia ninguém, não obriga nada a jusante.

## Onde isso vive

**Tudo que você escreve vai para `storyboard/` na raiz do deck alvo. Nunca para `BRAINSTORMING/` na raiz do projeto.**

`BRAINSTORMING/` é brainstorm de **construir software**, e a regra continua valendo para isso. O seu é sobre **o que comunicar naquele deck**, então pertence ao deck e viaja com ele.

## Antes de começar

1. Resolva o deck alvo. Se ainda não existe, converse à vontade, mas antes de gravar pergunte qual é o deck ou proponha criá-lo com `/mira-new`.
2. Crie `storyboard/` na raiz do deck, se não existir.
3. Se `storyboard/brainstorm.md` já existir, **leia antes de perguntar**. Rodada nova é anexada ao arquivo, nunca sobrescreve a anterior.
4. Se `storyboard/understanding.md` ou `concept-brief.md` já existirem, o conceito já passou pelo alinhamento. Diga isso e pergunte se ele quer mesmo reabrir a divergência.

## Passo 1: o mínimo que você precisa saber

Três perguntas, não mais, e uma de cada vez:

- **Para quem** é essa apresentação, e o que essa plateia já sabe do assunto?
- **Quanto tempo** você tem, e é aula, palestra, pitch ou vídeo?
- **O que te incomoda** nesse tema? O que a maioria das pessoas entende errado sobre ele?

A terceira é a que vale. Ângulo bom quase sempre nasce de um incômodo, e não de um sumário do assunto.

## Passo 2: divergência

Aqui você **produz**, não pergunta. Gere de **8 a 12 ângulos** para o tema, cada um em uma linha, numerados. Sem julgar, sem ordenar por preferência, sem descartar o esquisito. Ângulo é uma afirmação, nunca um tópico: "agentes falham porque ninguém define o critério de parada" é ângulo, "desafios dos agentes" é tópico.

Varie a origem deliberadamente, senão os doze viram o mesmo ângulo doze vezes:

- o **contraintuitivo**: o que parece verdade e não é;
- o **mecanismo**: como a coisa funciona por dentro, não o que ela produz;
- o **custo escondido**: quem paga a conta que ninguém vê;
- a **história**: quando isso já aconteceu antes, com outro nome;
- a **comparação**: o mesmo problema em um domínio que a plateia domina;
- a **consequência**: o mundo daqui a três anos se isso continuar;
- o **erro comum**: o que a plateia faz hoje achando que está certa;
- a **pergunta sem resposta**: o que ninguém sabe ainda.

Marque cada proposta como o que ela é:

> **HIPÓTESE:** o problema do model collapse não é a máquina piorar, é ela ficar confiante enquanto piora.

Proposta nunca é decisão. Ele pode escolher, rejeitar, combinar dois, torcer um ou inventar o décimo terceiro.

## Passo 3: convergência

Só depois que ele reagiu à lista. Corte para **2 a 4 ângulos** que sobrevivem, e para cada um declare:

- **o que ele acerta**: a percepção que a plateia leva embora;
- **o que ele custa**: o que fica de fora, o que simplifica demais, onde ele pode ser lido errado;
- **o que ele exige**: dado, exemplo, autorização ou material que o autor precisa ter para sustentar.

Candidato sem custo declarado é candidato mal descrito. Se você não consegue dizer o que ele perde, você não entendeu o ângulo.

Apresente os finalistas lado a lado e pergunte qual está mais perto do que ele quer dizer. **Não escolha sozinho.**

## Passo 4: a ideia em uma frase

Fechado o ângulo, escreva a ideia em **uma frase**, com estas palavras:

> "Então o deck existe para a plateia sair entendendo que..."

E confirme. Essa frase é o produto desta skill, é ela que o `/mira-concept-align` recebe para clarear e o `/mira-storyboard` acaba desenhando. Frase com dois "e" é sinal de dois decks disfarçados de um.

## Tetos, que limitam você e nunca o autor

- **20 turnos** até a lista de finalistas;
- **1.200 palavras** no `brainstorm.md`.

Batido um teto, pare de gerar, apresente o estado e pergunte se ele quer seguir ou continuar explorando.

## Somente o autor fecha

Você pode dizer:

> "Acho que o ângulo está de pé. Quer seguir para o alinhamento ou continuar explorando?"

Você **nunca** encerra sozinho. O fecho vem de intenção explícita: "é esse", "fechou", "pode seguir", "gostei desse", "vamos com o dois". Em dúvida, pergunte em vez de fechar.

Se ele mandar produzir sem escolher ângulo nenhum, diga o que ficou em aberto e **obedeça** se ele reafirmar. A autoridade sobre o significado é dele.

## O arquivo

Grave `storyboard/brainstorm.md` no deck alvo. Rodada nova entra como seção nova no fim, com número.

```markdown
# Brainstorm do deck, <slug>

## Rodada 01

### Tema
### Plateia e o que ela já sabe
### Formato e duração
### O incômodo

### Ângulos gerados
1. ...

### Finalistas
#### <nome do ângulo>
- Acerta:
- Custa:
- Exige:

### Ângulo escolhido
### A ideia em uma frase
### Descartados, e por quê
### Perguntas em aberto
```

Resposta "não sei" vira `[INDEFINIDO, validar com autor]` e conta como questão aberta. Não bloqueia.

## Ao terminar

Escrita atômica, UTF-8 sem BOM. Você escreve **só** dentro de `storyboard/`. Nunca toca em `index.html`, `mira/`, `assets/` ou `references/`. Nunca escreve HTML, JS ou SVG aqui: nesta skill não se produz nada além de texto.

Encerre entregando o caminho absoluto do arquivo e sugerindo `/mira-concept-align` para clarear a ideia escolhida, ou `/mira-storyboard` direto, se ele já quiser ver o ângulo virar quadro.
