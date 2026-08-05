---
name: mira-concept-storyteller
description: >-
  Transformar conceitos em histórias explicativas, analogias narrativas ou roteiros que usem desejo,
  ação, conflito, revelação e transformação sem distorcer o conteúdo. Usar quando o usuário pedir
  para compreender ou ensinar um conceito por meio de história, metáfora, parábola, personagem,
  narrativa, animação conceitual, roteiro audiovisual, apresentação narrativa ou deck MIRA; usar
  também para revisar a fidelidade conceitual de uma narrativa explicativa. Não usar para ficção
  puramente criativa, storytelling de marca, biografias ou apresentações genéricas sem objetivo de
  explicar um conceito. NÃO usar para criar a metáfora animada de um slide, que é do /mira-animator.
---

# MIRA Concept Storyteller

## Onde isto entra no Mira

Cadeia narrativa do Mira, em ordem: `/mira-premise-forge`, `/mira-concept-storyteller`, `/mira-story-architect`, `/mira-design-audience-journey`, `/mira-direct-slide-sequence`, `/mira-direct-scene`, `/mira-direct-cinematic-motion`. No fim, o `/mira-animator` escreve a animação dentro do `index.html` do deck, e o `/mira-builder` monta o resto.

**Etapa 2.** Recebe o Premise Brief ou um conceito a ensinar. Entrega o Concept Contract, que é o que a história não pode distorcer.

Nenhuma skill desta cadeia escreve HTML, e nenhuma delas cria a metáfora animada: o método de metáfora, a rubrica de 85 e o código do slide são do `/mira-animator`.

Idioma e formatação seguem `agents/_shared/idioma.md`: português brasileiro com acentuação correta e UTF-8 direto, nunca entidades HTML nem escapes Unicode. Travessão é proibido em qualquer texto entregue, inclusive narração e texto de tela: use vírgula, dois-pontos ou reescreva a frase.

## Resultado

Transformar um conceito em uma experiência narrativa que o público consiga sentir, acompanhar e depois explicar com precisão. Inspirar a construção dramática em John Truby sem copiar seus textos nem converter seus princípios em fórmula rígida.

Otimizar três resultados ao mesmo tempo:

1. **Fidelidade:** preservar as relações essenciais e os limites do conceito.
2. **Envolvimento:** criar uma pergunta cuja resposta importe ao ouvinte.
3. **Transformação:** tornar visível uma mudança de entendimento, decisão ou estado.

Nunca salvar uma metáfora atraente sacrificando a correção conceitual.

## Gate zero: premissa arrebatadora

Exigir uma premissa antes de desenvolver qualquer história destinada ao MIRA. Tratar a premissa como a menor expressão da história inteira: uma colisão específica entre personagem ou força, desejo, obstáculo, risco e possibilidade de transformação.

Gerar internamente de três a cinco candidatas e selecionar a que mais produz a reação: **“Eu preciso ver essa história.”** Não escolher pela grandiosidade superficial. Escolher pela combinação de:

- conflito compreensível imediatamente;
- pergunta magnética ou formulação “E se...?”;
- forças ou mundos que normalmente não coexistiriam;
- consequência humana, emocional ou intelectual relevante;
- potência visual e cinética para slides MIRA;
- espaço para revelações e escalada;
- ligação estrutural com o conceito que precisa ser ensinado;
- transformação prometida sem entregar o desfecho.

Rejeitar premissas que sejam apenas tema, cenário, slogan, pergunta genérica ou metáfora decorativa. Para conceitos técnicos, preservar a âncora de verdade: o conflito da premissa deve dramatizar o mecanismo real, não substituí-lo por uma falsidade mais emocionante.

Se nenhuma candidata for arrebatadora e conceitualmente fiel, gerar novas opções antes de continuar. Em toda saída MIRA, mostrar a premissa escolhida antes da arquitetura ou dos slides.

## Regra central: contador, história e ouvinte

Projetar a explicação como uma relação ativa entre:

- **Contador:** controlar ordem, ênfase e momento das revelações.
- **História:** encadear desejo, ação, conflito, consequência, revelação e transformação.
- **Ouvinte:** formular hipóteses, notar consequências e reconstruir o princípio.

Fazer o ouvinte descobrir junto com o protagonista. Não antecipar toda a conclusão, mas nunca criar surpresa por omissão injusta de informação necessária.

## Calibrar a entrada

Extrair do pedido, quando disponível:

- conceito e recorte;
- público e conhecimento prévio;
- objetivo de aprendizagem;
- formato e canal;
- tom, duração e extensão;
- elementos obrigatórios, proibidos ou sensíveis.

Classificar o núcleo como um ou mais destes tipos:

- **Técnico ou mecanístico:** exigir causalidade, estados, operações e restrições.
- **Estatístico ou probabilístico:** exigir condicionamento, população de referência, variabilidade e incerteza.
- **Abstrato, social ou normativo:** declarar a definição ou lente adotada, preservar tensões e reconhecer interpretações rivais relevantes.

Na falta de dados, assumir público geral adulto, narrativa curta e intuição antes do termo técnico. Perguntar apenas quando a ambiguidade mudar substancialmente o conceito, os invariantes ou o formato final. Se a precisão do tema for incerta, atual ou de alto risco, verificá-la em fontes apropriadas antes de narrativizar.

## Fluxo obrigatório

### 1. Fixar a âncora de verdade

Antes de criar a história, formular internamente um breve contrato conceitual:

- **Pergunta central:** o que o público deve conseguir responder?
- **Definição contextual:** o que o conceito significa neste pedido?
- **Mecanismo ou relação:** por que, como ou sob quais condições ele funciona?
- **Invariantes:** de duas a quatro relações que a metáfora não pode alterar.
- **Não é:** qual conceito vizinho ou erro comum deve ser distinguido?
- **Limite ou contracaso:** onde a explicação deixa de valer?
- **Estado epistêmico:** trata-se de fato estabelecido, modelo, interpretação ou posição normativa?

Para conceitos abstratos disputados, não inventar um mecanismo único. Escolher e nomear uma lente, mostrar a tensão central e evitar apresentar a história como prova de que aquela lente é a única possível.

Se o tema tiver várias camadas, escolher uma pergunta para a primeira história. Não tentar ensinar tudo de uma vez.

### 2. Escolher uma correspondência estrutural

Selecionar um processo, ambiente ou relação cuja dinâmica reproduza o núcleo conceitual. Mapear internamente:

| Origem conceitual | Elemento narrativo | Relação preservada | Falsa inferência a bloquear |
|---|---|---|---|
| objeto, agente ou variável | personagem, objeto ou estado | papel real no processo | identidade literal ou agência inventada |
| regra, operação ou fluxo | ação, costume ou transição | causalidade ou dependência | mera semelhança visual |
| limite, ruído ou incerteza | conflito ou informação incompleta | restrição real | vilão moral inexistente |
| resultado ou atualização | consequência ou revelação | mudança observável | conclusão mais forte que o conceito |

Usar essa tabela como ferramenta interna; mostrá-la somente quando ajudar a decodificação final.

Testar a metáfora contra falsas implicações frequentes:

- intenção, consciência ou vontade em processos que não as possuem;
- causalidade onde há apenas associação;
- certeza ou binariedade onde há probabilidade, grau ou distribuição;
- inversão de uma probabilidade condicional;
- equivalência entre peso matemático e importância, explicação ou causa;
- confusão entre treinamento e inferência, parte e todo, indivíduo e população;
- moralização de uma restrição técnica ou natural;
- universalização de uma lente cultural, filosófica ou normativa.

Substituir metáforas apenas decorativas. Uma boa imagem que não preserva a relação relevante é uma má explicação.

### 3. Construir o motor dramático

Definir na escala mínima necessária:

- **Protagonista:** quem vivencia o problema;
- **Desejo:** o que quer obter, evitar ou entender;
- **Necessidade:** o que precisa aprender ou mudar;
- **Erro inicial:** a hipótese incompleta que orienta suas primeiras ações;
- **Oponente:** a força real que bloqueia o desejo: pessoa, regra, ruído, incerteza, tempo, escala ou objetivos em tensão;
- **Aposta:** a consequência proporcional da falha;
- **Plano e ação:** as tentativas que produzem evidências;
- **Conflito:** o teste das hipóteses do protagonista;
- **Revelação:** a relação que reorganiza a interpretação;
- **Transformação:** a nova decisão, compreensão ou mudança de estado;
- **Novo equilíbrio:** o conceito funcionando depois da descoberta.

Não inserir vilões, sofrimento, reviravoltas ou escala épica sem função conceitual. Fazer o conflito representar uma restrição real do tema.

### 4. Escrever a premissa e o percurso do ouvinte

Condensar internamente a linha causal:

> Quando [problema], [protagonista] tenta [desejo], mas [força oposta]; suas ações revelam [princípio], levando a [transformação].

Planejar a experiência do ouvinte:

1. observar uma situação concreta;
2. formular uma pergunta ou hipótese;
3. acompanhar uma ação e sua consequência;
4. encontrar uma contradição ou limite;
5. reinterpretar as evidências;
6. ver a nova compreensão aplicada;
7. nomear o princípio com precisão.

Usar movimento linear para processos, espiral para aprofundamento, ramificado para casos alternativos, meandrante para descoberta de padrões e simultâneo para interações paralelas. Tratar a forma como instrumento, não como molde.

### 5. Redigir com causalidade visível

Fazer o público observar o conceito em ação antes de nomeá-lo, salvo quando o pedido exigir abordagem diretamente didática ou quando o termo prévio evitar confusão.

- Conectar cada cena ao desejo ou à pergunta central.
- Converter abstrações em escolhas, relações, mudanças de estado e consequências.
- Introduzir detalhes sensoriais somente quando reforçarem o mecanismo.
- Manter a tensão proporcional ao tema.
- Demonstrar a transformação por nova ação ou decisão, não apenas por discurso.
- Remover cenas que não ensinem, tensionem ou transformem.
- Não dar fala humana a sistemas técnicos se isso sugerir intenção ou consciência inexistentes; quando antropomorfizar por conveniência, marcar o limite na decodificação.

### 6. Decodificar sem desfazer a história

Depois da narrativa, explicar apenas o necessário para transferir o aprendizado:

1. nomear o conceito;
2. mapear os elementos decisivos;
3. explicitar a relação preservada;
4. declarar onde a analogia deixa de funcionar;
5. sintetizar o conceito em uma frase reutilizável.

Preferir uma tabela quando houver três ou mais correspondências relevantes. Em saídas curtas, usar dois parágrafos: **onde a analogia funciona** e **onde ela termina**. Não transformar a decodificação em uma segunda aula longa.

## Contrato de saída

Obedecer primeiro ao formato explícito do usuário. Não expor automaticamente a âncora de verdade, a matriz interna ou a premissa.

### Sem formato especificado

Entregar nesta ordem:

1. título;
2. história;
3. decodificação concisa;
4. limite da analogia;
5. síntese conceitual em uma frase.

Preservar a revelação apresentando a história antes da explicação. Usar “moral” somente quando o gênero ou o tema a justificar; em conceitos técnicos e estatísticos, preferir “síntese”.

### Analogia ou explicação breve

Entregar a situação e a consequência em um a três parágrafos, seguidas do funcionamento e do limite da analogia. Manter um arco mínimo de desejo, ação, conflito, revelação e transformação mesmo quando não houver cenas completas.

### Roteiro audiovisual ou cinematográfico

Separar por cena: visual e ação, som ou narração, função conceitual e transição. Fazer imagem e movimento carregarem o mecanismo; não usar texto na tela para compensar uma cena conceitualmente vazia.

### Deck ou MIRA

Abrir a entrega com a premissa escolhida. Organizar cada slide por função dramática, visual e movimento, texto de tela mínimo, narração, relação conceitual e transição. Distribuir setup, tensão, ruptura, resolução e síntese conforme o tema. Se o usuário pedir o arquivo de apresentação final, combinar esta arquitetura narrativa com a skill de apresentações e seu fluxo de criação e validação visual.

### Revisão de uma narrativa existente

Entregar: diagnóstico de fidelidade, trechos ou escolhas de risco, correções propostas e versão revisada quando solicitada. Distinguir erro factual, falsa implicação, ambiguidade produtiva e simples preferência estética.

## Auditoria de fidelidade antes de entregar

Responder internamente:

- O ouvinte consegue reconstruir a definição ou lente correta?
- A história preserva mecanismo e relações, não apenas aparência ou vocabulário?
- Desejo e ação produzem uma cadeia causal compreensível?
- O conflito corresponde a uma restrição real?
- A revelação decorre de evidências mostradas?
- A transformação corrige o erro inicial por meio de uma decisão ou mudança observável?
- A metáfora inventa agência, causalidade, certeza, escala ou julgamento moral?
- Em estatística, a direção do condicionamento, a população de referência e a incerteza foram preservadas?
- Em IA, treinamento, inferência, representação e comportamento foram distinguidos quando relevantes?
- Em conceitos abstratos, a lente e suas alternativas foram tratadas honestamente?
- O limite da analogia está explícito e a síntese cabe em uma frase correta?
- A premissa provoca “eu preciso ver essa história” sem prometer algo que o conceito não pode pagar?
- O formato final corresponde ao pedido e mantém a revelação na ordem adequada?

Se qualquer resposta essencial for “não”, redesenhar a correspondência ou o conflito. Em tensão entre impacto dramático e precisão, preservar a precisão. Declarar todo limite inevitável que possa induzir uma interpretação errada.

## Referência

Consultar [truby-framework.md](references/truby-framework.md) para escolher formas narrativas, mapear conceitos complexos, revisar riscos de fidelidade ou estruturar um roteiro/deck mais elaborado. Consultar obrigatoriamente os cartões de risco da referência para conceitos de IA, estatísticos ou abstratos disputados.
