---
name: mira-direct-scene
description: >-
  Dirigir a encenação de cada cena-slide do MIRA antes da coreografia, produzindo uma Encenação com
  composição, blocking dos atores, silhueta e escala, planos de profundidade com oclusão,
  enquadramento base, área segura, legibilidade, grade de cor do deck e continuidade visual entre
  slides adjacentes. Usar somente quando um MIRA Slide Score já existir, entre ele e o Motion Score,
  para planejar a encenação em texto. Não usar para criar a premissa, estruturar a história, definir
  a sequência de slides nem coreografar o movimento. NÃO usar para mexer num deck já feito:
  consertar animação, título ou composição de um slide existente é do /mira-animator, e o layout do
  deck é do /mira-builder.
---

# MIRA Direct Scene

## Onde isto entra no Mira

Cadeia narrativa do Mira, em ordem: `/mira-premise-forge`, `/mira-concept-storyteller`, `/mira-story-architect`, `/mira-design-audience-journey`, `/mira-direct-slide-sequence`, `/mira-direct-scene`, `/mira-direct-cinematic-motion`. No fim, o `/mira-animator` escreve a animação dentro do `index.html` do deck, e o `/mira-builder` monta o resto.

**Etapa 6.** Recebe o Slide Score. Entrega a Encenação, que é o quadro montado antes de qualquer movimento.

Nenhuma skill desta cadeia escreve HTML, e nenhuma delas cria a metáfora animada: o método de metáfora, a rubrica de 85 e o código do slide são do `/mira-animator`.

Idioma e formatação seguem `agents/_shared/idioma.md`: português brasileiro com acentuação correta e UTF-8 direto, nunca entidades HTML nem escapes Unicode. Travessão é proibido em qualquer texto entregue, inclusive narração e texto de tela: use vírgula, dois-pontos ou reescreva a frase.

## Resultado

Transformar cada cena-slide do **MIRA Slide Score** em uma **Encenação**: onde os atores estão, que tamanho têm, em que profundidade vivem, o que esconde o quê, que parte do quadro o olho lê primeiro, e que clima de cor o deck inteiro respira.

Direção de cena é o que existe **antes do movimento**. O `mira-direct-slide-sequence` decide o que acontece; esta skill decide como o quadro está montado quando acontece; o `mira-direct-cinematic-motion` decide como ele se move.

A Encenação é o que impede as duas falhas mais comuns de um deck MIRA: cena que flutua no vazio preto sem espaço nem chão, e deck que parece dez filmes diferentes.

## Regras invioláveis

### O quadro parado já conta

Congelar qualquer instante da cena deve produzir uma imagem que funciona sozinha. Se o quadro parado não diz quem age, sobre quem e com que consequência, o movimento vai carregar sozinho um peso que não é dele.

### Profundidade se prova por oclusão

Distribuir atores em planos só produz espaço quando **alguma coisa passa atrás de outra**. Parallax sem oclusão continua lendo como recorte deslizante. Toda cena com profundidade declara onde a oclusão acontece.

### A grade é do deck, não da cena

Escolher o clima de cor uma vez, para o deck inteiro. Grade por cena é como se obtém um deck que parece dez filmes diferentes. Desvio só quando é evento narrativo, e entra como transição, nunca como salto entre slides.

### Encenação não substitui história

Nenhum recurso de cinema pode ser a única mudança de estado da cena. Se ao desligar profundidade, grade e enquadramento a cena deixa de contar a história, a história não existia.

### O ator tem nome

Cada ator recebe um `id` estável, porque é por ele que a coreografia vai buscar plano, alvo de câmera e marcação de legibilidade. Ator sem `id` é ator que o implementador vai reinventar.

## Entradas

Obter ou inferir:

- MIRA Slide Score, com quadro inicial, ação e transição de cada cena;
- premissa, princípio organizador e imagem inesquecível;
- metáforas, símbolos e continuidade da Story Bible;
- tema do deck: cor primária, fundo, tipografia;
- template alvo (`mira-default`, deck com card, `sandeco-just-animation-template`, Studio) e formato (16:9, 1:1, 9:16, terços);
- se o deck vai carregar o `mira-cinema.js`, porque profundidade, câmera e grade dependem dele;
- destino: apresentação ao vivo, gravação ou exportação de vídeo.

Se a cena não tiver acontecimento observável, devolver para `mira-direct-slide-sequence`. Se não tiver metáfora concreta, devolver para o método do `/mira-animator`.

## Fluxo obrigatório

### 0. Trancar a linguagem visual do deck

Uma vez, para todos os slides. Definir:

- **mundo:** de que material é feito esse universo, e que tipo de coisa habita nele;
- **escala dominante:** o público olha de perto, de longe ou de cima;
- **silhueta de família:** que formas se repetem e criam parentesco entre cenas;
- **grade:** um preset de cor para o deck inteiro (§6);
- **regra de cor:** uma cor de marca dominante, mais neutros. Paleta multicor só no template de animação pura.

Essas decisões nascem do princípio organizador. Um deck cuja identidade é o laranja não pode receber uma grade que apaga a marca.

### 1. Montar o quadro inicial

Para cada cena, converter o quadro descrito no Slide Score em composição concreta:

- ator dominante e onde ele fica;
- relação espacial que já carrega tensão antes de qualquer movimento;
- ponto onde o olho entra e para onde ele é levado;
- espaço vazio deliberado, que é o que dá ar à cena;
- **chão, horizonte ou superfície de apoio.** A maioria das cenas do MIRA flutua no vazio preto, e é a ausência de chão que faz o quadro parecer flutuante e barato. Se a cena vai ter sombra ou reflexo, o chão é obrigatório.

Usar [composicao-e-planos.md](references/composicao-e-planos.md).

### 2. Fazer o blocking dos atores

Marcar, por cena:

| Ator | `id` | Posição inicial | Escala | Papel na história | Posição final |
|---|---|---|---|---|---|

Regras de dosagem, todas numéricas:

- **1 ator focal por cena.** Os demais apoiam, e apoio ocupa menos área, menos contraste e menos detalhe.
- **No máximo 3 atores nomeados por cena.** Este teto é de **presença no quadro**, não de movimento: quantos se mexem ao mesmo tempo é o teto do temperamento, na skill de movimento. Acima de 3 presentes, o quadro vira inventário.
- **O ator focal ocupa entre 25% e 60% da altura útil.** Menos que isso some na projeção; mais que isso não deixa a consequência aparecer.

**Referente concreto vira ícone flat, não bolinha.** Se dá para nomear o objeto, desenhe o objeto. O círculo genérico só é legítimo para o que é genuinamente abstrato: fluxo, sinal, energia, propagação.

**E declare a origem de cada ator nomeado.** Figura humana, mão, rosto, animal, veículo e anatomia articulada não podem ser desenhados à mão por quem implementa: eles precisam de SVG de fonte aberta ou de arquivo do autor. Marque esses atores na encenação e mande o `/mira-asset-scout` resolver antes do animador. Encenação que pede uma pessoa em pé sem dizer de onde ela vem produz boneco de trapézio.

### 3. Distribuir a profundidade

Atribuir cada ator a um plano, com `z` de 0 (colado na câmera) a 1 (infinito):

- **3 a 5 planos por cena, nunca mais.**
- **Pelo menos uma oclusão real**, declarada com o instante em que acontece.
- Plano de fundo perde contraste e nitidez; plano da frente não pode disputar leitura com o focal.
- **Desfoque com raio máximo 4**, e só onde ele separa planos, nunca como clima geral.

Oclusão é doutrina, não API: ordem de empilhamento no SVG e máscara resolvem, e por isso ela funciona em qualquer deck. **Parallax e `z` dependem do `mira-cinema.js`**: em deck sem o módulo, encenar a profundidade por oclusão, escala, contraste e nitidez, e deixar os planos declarados para quando o módulo entrar.

### 4. Definir o enquadramento base

O enquadramento base é o quadro aberto da cena, e é nele que a área segura e o `@MIRA:SIZE` são medidos.

- **O palco ocupa o quadro inteiro** e o título flutua por cima dele.
- **Nada focal acima da faixa do título.** Movimento de ambiente pode atravessar, porque atrás do título ele lê como profundidade, não como conflito.
- **50 px de área segura** em todas as bordas, em qualquer formato.
- **Componha para preencher.** O palco de um slide sem card é bem maior que o palco dentro de um card, e uma composição calibrada para o menor fica pequena e perdida no maior.
- Marcar aqui as **regiões que valem um cue de câmera** na coreografia, com a razão narrativa de cada uma. Escolher o cue é da skill de movimento; oferecer o alvo é desta.

### 5. Garantir legibilidade

- **Hierarquia de valor:** o ator focal é o de maior contraste contra o fundo, sempre.
- **Texto dentro da cena é evidência**, não legenda. Rótulo só quando a imagem não consegue dizer.
- **Marcar os elementos de legibilidade crítica** como traço fixo ou texto fixo, senão qualquer aproximação de câmera engorda traço e tipografia.
- **Nenhum elemento indispensável na faixa do título nem na área segura.**
- Conferir o quadro em escala de cinza: se a hierarquia sumir, ela dependia de cor.

### 6. Escolher a grade do deck

Um preset, herdado por todos os slides:

| Preset | Clima |
|---|---|
| `neutra` | sem grade, cor do tema pura |
| `noite-fria` | escuro, contrastado, dessaturado |
| `brasa` | escuro e quente, saturação levemente alta |
| `clinica` | claro, contraste baixo, quase sem vinheta |
| `penumbra` | muito escuro, alto contraste, vinheta forte |

- **A grade é derivada do tema, não imposta sobre ele.** Preset que apaga a cor da marca não é oferecido.
- **A grade se aplica ao palco**, nunca à seção do slide e jamais ao corpo da página: fora do palco ela dessatura o título e desloca toda a interface fixa.
- **Grão estático.** Grão animado destrói a compressão na exportação para vídeo.
- Registrar a grade escolhida como decisão do deck, no artefato de planejamento.

### 7. Costurar a continuidade entre slides adjacentes

Para cada par de slides vizinhos, declarar o que atravessa:

- elemento que persiste e muda de função;
- silhueta que se repete em posição equivalente;
- direção de movimento que continua;
- escala que herda a anterior;
- cor que sobrevive à troca.

O primeiro quadro de um slide herda posição, silhueta e direção do último quadro do anterior. É trabalho de composição, e é o que faz slides vizinhos parecerem do mesmo filme.

🟡 **Âncora entre slides e match cut estão planejados e ainda não existem no MIRA.** Declarar a intenção de âncora quando ela for natural, marcar como pendente, e resolver a continuidade por composição enquanto isso. Par sem âncora natural é aceitável; ancorar à força produz interpolação que lê como defeito.

### 8. Variar sem quebrar o mundo

Ao longo do deck, alternar deliberadamente: escala íntima e ampla, densidade e vazio, centro e periferia, um ator e confronto de dois.

**Rejeitar** a cena que repete do vizinho a silhueta dominante, a organização espacial e a escala ao mesmo tempo. Repetição só vale como motivo narrativo declarado.

### 9. Aplicar o Gate de encenação

Pontuar de 0 a 5:

| Critério | Teste |
|---|---|
| Orientação | O quadro parado diz quem age e sobre quem? |
| Hierarquia | O olho encontra o ator focal sem procurar? |
| Profundidade | Existe oclusão real, e não só camadas em velocidades diferentes? |
| Chão | A cena tem apoio, ou flutua no vazio? |

Em deck sem o `mira-cinema.js`, a linha **Profundidade** é avaliada só pela oclusão, e a de **Chão** vale só quando a cena pede sombra ou reflexo. Critério indisponível é inerte, não reprovação: cena não perde nota por não ter recurso que o deck não carrega.
| Legibilidade | Título, texto e traço sobrevivem à aproximação e à projeção? |
| Coerência de deck | Slides adjacentes parecem do mesmo filme? |
| Especificidade | Esta encenação pertence a esta história? |
| Robustez | Sem grade, sem planos e sem câmera, a cena ainda conta a história? |

Exigir média mínima 4, nota 5 em robustez e nenhuma cena decisiva abaixo de 4 em orientação ou legibilidade.

## Contrato de saída: Encenação

Entregar:

1. linguagem visual do deck: mundo, escala dominante, silhueta de família, grade e regra de cor;
2. tabela de blocking por cena, com `id`, posição, escala e papel;
3. mapa de planos por cena, com `z` e a oclusão declarada;
4. enquadramento base, área segura e regiões candidatas a cue de câmera;
5. marcação de legibilidade: o que é fixo, o que é texto indispensável;
6. mapa de continuidade entre pares adjacentes, com o que atravessa;
7. pendências marcadas como planejadas, sem chamada de API;
8. Gate de encenação e correções;
9. handoff para `mira-direct-cinematic-motion`.

## Auditoria final

Bloquear e refazer se:

- o quadro parado não orientar espaço, ator e tensão;
- houver mais de 5 planos, ou planos declarados sem nenhuma oclusão;
- a cena precisar de sombra ou reflexo e não tiver chão;
- o ator focal disputar contraste com o ambiente;
- a grade for escolhida slide a slide, ou apagar a cor da marca;
- algo focal ocupar a faixa do título ou a área segura;
- dois slides vizinhos repetirem silhueta, espaço e escala juntos;
- a encenação depender de luz de cena, âncora ou atmosfera, que ainda não existem;
- a cena, descrita sem grade, sem planos e sem câmera, deixar de contar a história.
