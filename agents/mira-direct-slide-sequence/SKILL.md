---
name: mira-direct-slide-sequence
description: >-
  Converter uma MIRA Story Bible e uma Audience Journey Map em uma sequência cinematográfica de
  cenas-slide, produzindo um MIRA Slide Score com função dramática, quadro inicial, ação, virada,
  revelação, informação retida, narração, texto mínimo, metáfora visual e transição causal para cada
  slide. Usar quando a história e a jornada do público já existem e precisam virar storyboard ou
  plano de slides. Não usar para pesquisar fatos, criar a premissa, arquitetar toda a história,
  encenar o quadro nem coreografar animações. NÃO usar para montar o deck: o plano de slides que
  vira HTML é do /mira-planner com o /mira-builder, e a animação é do /mira-animator.
---

# MIRA Direct Slide Sequence

## Onde isto entra no Mira

Cadeia narrativa do Mira, em ordem: `/mira-premise-forge`, `/mira-concept-storyteller`, `/mira-story-architect`, `/mira-design-audience-journey`, `/mira-direct-slide-sequence`, `/mira-direct-scene`, `/mira-direct-cinematic-motion`, `/mira-scene-brief`. No fim, o `/mira-animator` (ou o `/mira-cine-animator`, no deck cinematográfico) escreve a animação dentro do `index.html` do deck, e o `/mira-builder` monta o resto.

**Etapa 5.** Recebe Story Bible e Audience Journey Map. Entrega o MIRA Slide Score, uma cena por slide.

Nenhuma skill desta cadeia escreve HTML, e nenhuma delas cria a metáfora animada: o método de metáfora, a rubrica de 85 e o código do slide são do `/mira-animator`.

Idioma e formatação seguem `agents/_shared/idioma.md`: português brasileiro com acentuação correta e UTF-8 direto, nunca entidades HTML nem escapes Unicode. Travessão é proibido em qualquer texto entregue, inclusive narração e texto de tela: use vírgula, dois-pontos ou reescreva a frase.

## Resultado

Transformar história e jornada do público em um **MIRA Slide Score**: uma montagem de cenas-slide em que cada quadro cria necessidade para o seguinte e cada transição preserva ação, pergunta, emoção ou símbolo.

Tratar o slide como uma cena narrativa, não como página, tópico ou contêiner de conteúdo. Cada slide deve possuir:

- estado visual inicial;
- acontecimento observável;
- mudança de estado;
- virada ou revelação;
- efeito no público;
- gancho causal;
- estado de saída aproveitado pela próxima cena.

Receber preferencialmente `mira-story-architect` + `mira-design-audience-journey` e entregar o resultado a `mira-direct-scene`, que encena o quadro antes de `mira-direct-cinematic-motion` coreografar o movimento.

## Regras invioláveis

### Uma cena, um acontecimento dominante

Dar a cada slide uma função dramática e uma afirmação principal. Quando houver dois acontecimentos independentes, dividir. Quando dois slides repetirem a mesma mudança, fundir.

### Imagem e fala fazem trabalhos diferentes

Fazer a imagem mostrar ação, relação, escala, consequência ou transformação. Fazer a narração orientar interpretação, fornecer contexto invisível ou criar contraponto. Não narrar literalmente o que já está evidente.

### Texto de tela é evidência, não roteiro

Usar somente palavras indispensáveis: nome, número, regra, escolha, rótulo contrastante ou frase memorável. Não usar parágrafos para compensar uma cena vazia.

### Regra Zero

Nenhum slide pode depender de um estado completamente estático. Planejar entrada, acontecimento, estado vivo e saída, mesmo quando a cena pede silêncio ou contemplação. A encenação do quadro será definida por `mira-direct-scene` e o movimento detalhado por `mira-direct-cinematic-motion`.

### Transição é causal

Fazer a próxima cena nascer de uma pergunta, ação, objeto, direção, forma, som, valor ou consequência da cena anterior. Evitar transições bonitas que reiniciem a história.

## Entradas

Obter ou inferir:

- premissa e princípio organizador;
- Story Bible, teia de cenas e beats;
- Audience Journey Map e ledgers;
- âncora de verdade e limites;
- público e contexto de apresentação;
- duração, proporção e quantidade aproximada de slides;
- tom, linguagem visual disponível e restrições de produção;
- grau de dependência da narração ao vivo.

Se a jornada do público não disser o que muda em cada beat, devolver para `mira-design-audience-journey`. Se a cena não possuir ação, conflito ou causalidade, devolver para `mira-story-architect`.

## Fluxo obrigatório

### 0. Trancar a frase de montagem

Definir em uma frase como a sequência inteira progride visualmente:

```text
O público acompanha [processo visual] que se transforma de [estado inicial]
em [estado final] à medida que descobre [ouro da história].
```

Essa frase deve nascer do princípio organizador. Ela orientará recorrências, contraste, ritmo e continuidade.

### 1. Definir o orçamento de cenas

Derivar quantidade de slides de acontecimentos e duração, não de um número arbitrário.

- Dar slide próprio a uma mudança decisiva de estado, revelação, escolha ou consequência.
- Agrupar explicações subordinadas dentro da mesma ação.
- Reservar espaço para pausas, antecipação e payoff.
- Não aumentar a contagem apenas para variar imagens.

Quando não houver duração, assumir uma história curta de 10 a 14 cenas-slide e ajustar pela densidade conceitual.

### 2. Desenhar a macrosequência

Usar a gramática adequada em [sequence-grammar.md](references/sequence-grammar.md). Uma sequência de impacto costuma incluir:

1. perturbação inicial;
2. promessa ou pergunta;
3. orientação mínima;
4. primeira tentativa;
5. contradição;
6. escalada;
7. reinterpretação intermediária;
8. custo humano;
9. crise ou escolha;
10. revelação principal;
11. prova por nova ação;
12. novo equilíbrio e sabedoria.

Não aplicar como molde fixo. Preservar a cadeia causal da Story Bible.

### 3. Converter beats em cenas-slide

Para cada beat da jornada, decidir se ele:

- merece uma cena própria;
- deve ser combinado com outro;
- precisa ser desdobrado para permitir previsão e consequência;
- deve ocorrer apenas na narração;
- deve ser removido por não alterar estado.

Exigir que cada slide altere pelo menos dois dos seguintes: ação, informação, emoção, relação, valor, interpretação, espaço ou tempo.

### 4. Projetar o primeiro quadro

O primeiro quadro deve orientar antes de mover. Definir:

- objeto ou personagem dominante;
- relação espacial importante;
- estado inicial legível;
- tensão já presente;
- informação que pode ser inferida sem fala;
- área de composição para texto indispensável.

Evitar cenários genéricos. O primeiro quadro deve carregar arena, regra e pergunta local.

### 5. Projetar a ação visual

Escolher um verbo observável que expresse o mecanismo:

- dividir, comprimir, competir, distribuir, ocultar, pesar;
- aproximar, corroer, acumular, inverter, contaminar, conectar;
- abrir, bloquear, transformar, falhar, substituir, iluminar.

Rejeitar verbos vazios como “aparecer”, “flutuar” ou “brilhar” quando não comunicarem significado.

Usar [visual-metaphor-and-continuity.md](references/visual-metaphor-and-continuity.md) para preservar relações conceituais e símbolos.

### 6. Construir a microestrutura da cena

Cada slide deve seguir a menor forma necessária:

```text
orientação → expectativa → ação → resistência → virada → estado de saída
```

Nem toda cena precisa exibir seis fases separadas. A virada é obrigatória: ao final, algo deve estar diferente e exigir continuação.

### 7. Distribuir informação e revelações

Copiar os ledgers da Audience Journey para a montagem:

- mostrar cada fato lógico até o prazo necessário;
- posicionar pistas no quadro, na ação ou na fala;
- impedir que texto revele antecipadamente o significado da imagem;
- fazer o payoff usar elemento já visto;
- registrar exatamente o que permanece retido após cada slide.

Não esconder regras de comparação, escala, identidade funcional ou condição causal indispensável.

### 8. Escrever narração e texto de tela

Para cada slide:

- escrever narração curta, falável e rítmica;
- usar contraponto quando a imagem já comunica o literal;
- colocar termo técnico somente após ou durante sua demonstração;
- limitar texto de tela ao mínimo que precisa ser lido;
- preservar números, nomes e ressalvas factuais quando forem evidência.

Não inserir notas de produção no conteúdo visível.

### 9. Projetar continuidade e transições

Escolher uma lógica dominante por transição:

- **causal:** consequência atravessa para a próxima cena;
- **objeto:** elemento persistente muda de função;
- **match:** forma, cor ou movimento encontra equivalente;
- **espacial:** câmera atravessa limite ou revela nova escala;
- **temporal:** estado envelhece, acelera ou retrocede;
- **simbólica:** símbolo muda de significado;
- **sonora:** fala ou som começa antes da mudança visual;
- **contraste:** corte deliberado cria choque de valor.

Registrar o ponto de saída e o primeiro quadro seguinte. Não detalhar easing ou implementação.

### 10. Compor ritmo e variedade

Alternar de forma intencional:

- escala íntima e ampla;
- movimento e suspensão;
- densidade e vazio;
- humor e consequência;
- exterior e interior;
- antecipação e aceleração;
- imagem única e comparação;
- continuidade fluida e corte brusco.

Evitar duas metáforas funcionalmente idênticas em sequência. Variar silhueta sem romper o mundo, os símbolos ou o princípio organizador.

### 11. Projetar o slide UAU

Escolher um ou dois momentos culminantes, não transformar todos em clímax.

Um slide UAU deve combinar:

- imagem que só poderia existir nesta história;
- transformação visível irreversível;
- payoff de pista ou símbolo;
- mudança emocional causada;
- descoberta conceitual;
- continuação ou consequência imediata.

Se o slide continuar impressionante após remover o conceito, provavelmente é espetáculo genérico.

### 12. Produzir o MIRA Slide Score

Usar o schema em [slide-score-schema.md](references/slide-score-schema.md). Para cada slide, especificar:

- número e título de trabalho;
- função dramática;
- estado do público na entrada e saída;
- quadro inicial;
- ação e microvirada;
- informação entregue, pista e retenção;
- emoção e causa;
- metáfora ou símbolo;
- narração;
- texto de tela;
- transição causal;
- requisitos de fidelidade;
- handoff para movimento.

### 13. Aplicar o Gate UAU de montagem

Pontuar de 0 a 5:

| Critério | Teste |
|---|---|
| Gancho | A primeira cena exige a segunda? |
| Causalidade | Cada cena nasce da anterior? |
| Visualidade | A ação comunica antes da explicação? |
| Revelação | Pistas e payoffs estão na ordem certa? |
| Ritmo | Há ondas de aceleração, pausa e impacto? |
| Emoção | Consequências são sentidas no momento correto? |
| Participação | O público prevê ou reinterpreta antes da resposta? |
| Continuidade | Objetos, símbolos e estados atravessam cenas? |
| Singularidade | Os slides pertencem somente a esta história? |
| Fidelidade | A montagem preserva mecanismo e limites? |
| Fechamento | O final paga o gancho e produz sabedoria? |

Exigir média mínima 4, fidelidade 5 e nenhuma cena indispensável abaixo de 4 em causalidade ou visualidade.

## Contrato de saída: MIRA Slide Score

Entregar:

1. premissa;
2. frase de montagem;
3. duração e orçamento de cenas;
4. macrosequência;
5. mapa de continuidade e símbolos;
6. ritmo geral;
7. tabela completa slide a slide;
8. slides UAU e respectivos payoffs;
9. ledger final de informações e revelações;
10. auditoria de fidelidade e montagem;
11. handoff para `mira-direct-scene`.

## Auditoria final

Bloquear e refazer se:

- a sequência parecer uma agenda ilustrada;
- uma cena existir apenas para explicar;
- dois slides consecutivos repetirem função ou metáfora;
- o primeiro quadro não orientar espaço, objeto e tensão;
- a ação não possuir verbo significativo;
- a narração repetir a imagem;
- o texto de tela carregar a maior parte do conceito;
- informação indispensável for escondida;
- a transição apenas trocar de página;
- o slide UAU puder pertencer a qualquer história;
- o fechamento resumir em vez de provar a transformação;
- menos de 80% das cenas dependerem majoritariamente de imagem e ação para comunicar sua mudança central.
