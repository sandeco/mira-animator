---
name: mira-design-audience-journey
description: >-
  Projetar a experiência psicológica, emocional e intelectual do público ao longo de uma história
  MIRA, convertendo Story Bible, roteiro ou beats narrativos em uma Audience Journey Map que
  controla atenção, curiosidade, imersão, emoção, entretenimento, revelações e sabedoria. Usar antes
  de transformar uma história em sequência de slides, especialmente quando o objetivo for fazer o
  público sentir que viveu a história. Não usar para pesquisar fatos, criar a premissa inicial nem
  estruturar toda a trama. NÃO usar para animar slides, que é do /mira-animator.
---

# MIRA Design Audience Journey

## Onde isto entra no Mira

Cadeia narrativa do Mira, em ordem: `/mira-premise-forge`, `/mira-concept-storyteller`, `/mira-story-architect`, `/mira-design-audience-journey`, `/mira-direct-slide-sequence`, `/mira-direct-scene`, `/mira-direct-cinematic-motion`. No fim, o `/mira-animator` escreve a animação dentro do `index.html` do deck, e o `/mira-builder` monta o resto.

**Etapa 4.** Recebe a Story Bible. Entrega o Audience Journey Map, que diz o que muda na cabeça do público a cada beat.

Nenhuma skill desta cadeia escreve HTML, e nenhuma delas cria a metáfora animada: o método de metáfora, a rubrica de 85 e o código do slide são do `/mira-animator`.

Idioma e formatação seguem `agents/_shared/idioma.md`: português brasileiro com acentuação correta e UTF-8 direto, nunca entidades HTML nem escapes Unicode. Travessão é proibido em qualquer texto entregue, inclusive narração e texto de tela: use vírgula, dois-pontos ou reescreva a frase.

## Resultado

Transformar uma história já arquitetada em uma experiência de público deliberada. Entregar um **MIRA Audience Journey Map** que diga, em cada beat, o que o ouvinte:

- percebe;
- sabe e ainda não sabe;
- acredita;
- pergunta;
- prevê;
- sente e por quê;
- deseja que aconteça;
- teme perder;
- reconsidera;
- leva consigo como sabedoria.

O público não deve apenas assistir. Deve montar hipóteses, antecipar consequências, sofrer revisões de significado e terminar capaz de aplicar a descoberta fora da história.

Receber preferencialmente a saída de `mira-story-architect` e entregar o resultado a `mira-direct-slide-sequence`.

## Os seis efeitos obrigatórios

Projetar os seis efeitos como um único sistema, não como camadas decorativas:

1. **Atenção inicial:** criar uma perturbação compreensível e uma pergunta urgente.
2. **Emoção causada:** produzir sentimento por acontecimento, avaliação, vínculo e consequência.
3. **Experiência incorporada:** fazer o público simular decisões e consequências junto ao protagonista.
4. **Sabedoria:** converter experiência em um critério portátil para agir no mundo.
5. **Curiosidade justa:** reter respostas, motivos e significados sem esconder premissas indispensáveis.
6. **Entretenimento inteligente:** usar jogo, ironia, padrão, contraste e participação para tornar a descoberta prazerosa.

Bloquear histórias que atinjam um efeito destruindo outro. Confusão não é curiosidade; sofrimento gratuito não é emoção; segunda pessoa não garante imersão; surpresa aleatória não é entretenimento; uma frase moral no fim não é sabedoria.

## Entradas

Obter ou inferir:

- premissa e princípio organizador;
- âncora de verdade, limites e objetivo educativo;
- Story Bible, cenas ou beats disponíveis;
- público, repertório, resistências e contexto de exibição;
- transformação intelectual e emocional desejada;
- duração e quantidade aproximada de slides;
- tom, intensidade e limites éticos.

Quando faltar causalidade, personagem, escolha ou revelação, devolver para `mira-story-architect`. Quando faltar fidelidade conceitual, devolver para `mira-concept-storyteller`. Não reparar uma fundação fraca apenas com técnicas de atenção.

## Leis da jornada

### Estado antes de conteúdo

Planejar primeiro a mudança de estado do público; selecionar informação e imagem depois. Todo beat precisa alterar pelo menos dois estados relevantes.

### Emoção precisa de causa

Especificar sempre:

```text
acontecimento → avaliação do público → emoção → impulso ou nova decisão
```

Não escrever apenas “gerar tensão”, “emocionar” ou “causar impacto”.

### Retenção justa

Manter dois registros separados:

- **ledger lógico:** fatos necessários para compreender e inferir;
- **ledger de revelação:** resposta, motivo, relação ou significado que pode ser adiado.

Entregar a informação necessária antes da inferência. Reter a resposta, o motivo, o significado ou a consequência enquanto houver pistas justas e prazo de payoff.

### Imersão por responsabilidade simulada

Fazer o público sentir presença ao compartilhar desejo, incerteza, previsão e escolha. Não depender de “imagine que você...” nem de detalhes sensoriais sem função.

### Sabedoria por transferência

Fazer a conclusão surgir de experiência → reflexão → princípio → aplicação. A história só produz sabedoria quando muda a pergunta que o público fará diante de uma situação diferente.

## Fluxo obrigatório

### 0. Trancar o contrato de experiência

Condensar:

- **pergunta irresistível:** o que o público precisa descobrir;
- **crença inicial:** interpretação plausível que será tensionada;
- **promessa emocional:** o que será sentido e por qual tipo de acontecimento;
- **promessa educativa:** o que será compreendido;
- **sabedoria final:** novo critério de decisão;
- **imagem inesquecível:** transformação visual que poderá condensar a jornada.

Se esses itens não nascerem da mesma premissa, devolver a história para arquitetura.

### 1. Modelar o público real

Definir:

- repertório e vocabulário;
- crenças prováveis;
- desejo ou problema que torna o tema relevante;
- resistência, medo ou cansaço;
- nível de risco que tolera;
- o que já viu muitas vezes;
- o que teria força para surpreendê-lo honestamente.

Evitar um “público geral” abstrato. Quando não houver dados, assumir um perfil provisório e declarar a suposição.

### 2. Desenhar os estados inicial e final

Usar o modelo completo em [audience-state-model.md](references/audience-state-model.md).

Definir ao menos:

| Estado | Início | Final |
|---|---|---|
| Saber | informação disponível | compreensão reconstruída |
| Acreditar | modelo mental inicial | modelo mental revisado |
| Perguntar | curiosidade aberta | pergunta respondida ou elevada |
| Sentir | disposição emocional | emoção transformada |
| Querer | resultado desejado | novo compromisso ou critério |
| Prever | hipótese inicial | interpretação retrospectiva |

### 3. Criar a lacuna de atenção inicial

Nos primeiros segundos, combinar:

- normalidade reconhecível;
- anomalia visual ou causal;
- consequência relevante;
- pergunta sem resposta imediata;
- promessa implícita de que observar resolverá o enigma.

Não abrir com agenda, definição, contexto histórico extenso ou afirmação genérica. O gancho deve conter o DNA da premissa e produzir uma ação seguinte inevitável.

### 4. Construir os ledgers de informação

Para cada beat, registrar:

- informação já entregue;
- inferência agora possível;
- hipótese provável do público;
- informação retida;
- pista justa disponível;
- momento máximo de revelação;
- recompensa do payoff.

Consultar [curiosity-and-revelation-ledgers.md](references/curiosity-and-revelation-ledgers.md). Não manter mais perguntas abertas do que o público consegue distinguir.

### 5. Compor a curva de curiosidade

Alternar:

1. pergunta;
2. exploração;
3. resposta parcial;
4. complicação;
5. pista recontextualizada;
6. revelação;
7. nova pergunta mais profunda.

Usar curiosidade epistêmica, causal, humana, moral e de previsão. Evitar cliffhangers artificiais no fim de todos os beats.

### 6. Compor a curva emocional

Planejar contraste e recuperação. Emoção constante vira ruído.

Mapear:

- vínculo criado;
- expectativa;
- ameaça ou oportunidade;
- perda, ganho ou custo;
- silêncio ou respiro;
- crise;
- escolha;
- consequência;
- emoção residual.

Consultar [emotion-immersion-wisdom.md](references/emotion-immersion-wisdom.md). Fazer a maior emoção coincidir com a maior mudança de significado ou responsabilidade, não necessariamente com o maior espetáculo.

### 7. Projetar incorporação e participação

Em beats decisivos, criar uma participação válida:

- previsão antes do resultado;
- escolha entre valores concorrentes;
- reconhecimento de padrão;
- reconstrução de causa;
- comparação de consequências;
- revisão de uma crença própria.

Entregar informação suficiente para o público jogar. Não pedir participação cuja resposta já esteja óbvia nem exigir conhecimento não fornecido.

### 8. Projetar entretenimento com função

Usar conforme o tom:

- regra visual que se repete e evolui;
- ironia dramática;
- expectativa quebrada;
- transformação de objeto;
- recompensa por notar uma pista;
- escalada de padrão;
- callback;
- celebração inadequada que expõe a contradição;
- contraste entre cerimônia e resultado.

Todo jogo deve ensinar, tensionar, revelar personagem ou preparar payoff. Remover gag, efeito ou surpresa intercambiável.

### 9. Converter emoção em sabedoria

Projetar quatro degraus:

1. **experiência:** o público presencia uma consequência;
2. **reconhecimento:** percebe o padrão ou mecanismo;
3. **princípio:** consegue nomear o novo critério;
4. **transferência:** aplica o critério a outro contexto.

Completar:

> Quando eu encontrar [situação semelhante], em vez de perguntar [critério antigo], perguntarei [novo critério].

Se o princípio só funcionar dentro da metáfora, a história produziu lembrança, não sabedoria.

### 10. Montar a jornada beat a beat

Para cada beat, entregar:

- estado de entrada;
- acontecimento observado;
- ação mental solicitada ao público;
- informação entregue e retida;
- hipótese dominante;
- emoção e causa;
- desejo ou medo ativado;
- mudança de significado;
- estado de saída;
- necessidade criada para o próximo beat.

### 11. Aplicar o Gate UAU

Pontuar de 0 a 5:

| Critério | Teste |
|---|---|
| Captura | O início interrompe a atenção sem confundir? |
| Participação | O público precisa prever, escolher ou reinterpretar? |
| Curiosidade | As perguntas são distintas, justas e pagas? |
| Emoção | Cada sentimento possui causa e consequência? |
| Incorporação | O público simula responsabilidade, não apenas observa? |
| Surpresa | A revelação é inesperada e inevitável em retrospecto? |
| Entretenimento | O prazer nasce do mecanismo da história? |
| Educação | A sequência permite reconstruir o conceito correto? |
| Sabedoria | O aprendizado transfere para outra situação? |
| Memória | Existe uma imagem, escolha ou frase difícil de esquecer? |

Exigir média mínima 4 e nota mínima 4 em curiosidade, emoção, educação e sabedoria. Exigir nota 5 em justiça informacional e fidelidade conceitual.

## Contrato de saída: MIRA Audience Journey Map

Entregar:

1. contrato de experiência;
2. modelo do público e suposições;
3. estados inicial e final;
4. pergunta irresistível e promessa de payoff;
5. ledger lógico;
6. ledger de revelação;
7. curva de curiosidade;
8. curva emocional;
9. momentos de incorporação e participação;
10. escada de sabedoria;
11. jornada beat a beat;
12. Gate UAU e correções;
13. handoff para `mira-direct-slide-sequence`.

## Auditoria final

Bloquear e refazer se:

- o gancho não contiver a premissa em miniatura;
- a história exigir atenção antes de criar relevância;
- uma emoção for nomeada sem acontecimento causador;
- a imersão depender apenas de segunda pessoa ou sensorialidade;
- informação necessária for escondida para fabricar surpresa;
- perguntas forem acumuladas sem distinção ou payoff;
- entretenimento for removível sem afetar significado;
- a revelação não reinterpretar evidências anteriores;
- o público receber o princípio sem reconstruí-lo;
- a sabedoria não gerar um critério transferível;
- a jornada não criar necessidade causal para o próximo beat.
