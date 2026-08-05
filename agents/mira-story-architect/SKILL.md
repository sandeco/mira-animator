---
name: mira-story-architect
description: >-
  Arquitetar histórias completas e de alto impacto para o MIRA a partir de uma premissa ou contrato
  conceitual, gerando premissa validada, sete passos estruturais, rede de personagens, tema ou
  argumento moral, mundo ficcional, rede de símbolos, trama, teia de cenas, construção de cenas e
  diálogo sinfônico. Usar quando o usuário pedir para desenvolver, estruturar, aprofundar ou auditar
  uma história narrativa para slides, animação ou roteiro MIRA. Não usar para pesquisar notícias e
  gerar apenas premissas, nem para montar ou animar o deck, que são do /mira-builder e do /mira-
  animator.
---

# MIRA Story Architect

## Onde isto entra no Mira

Cadeia narrativa do Mira, em ordem: `/mira-premise-forge`, `/mira-concept-storyteller`, `/mira-story-architect`, `/mira-design-audience-journey`, `/mira-direct-slide-sequence`, `/mira-direct-scene`, `/mira-direct-cinematic-motion`. No fim, o `/mira-animator` escreve a animação dentro do `index.html` do deck, e o `/mira-builder` monta o resto.

**Etapa 3.** Recebe premissa e contrato conceitual. Entrega a Story Bible.

Nenhuma skill desta cadeia escreve HTML, e nenhuma delas cria a metáfora animada: o método de metáfora, a rubrica de 85 e o código do slide são do `/mira-animator`.

Idioma e formatação seguem `agents/_shared/idioma.md`: português brasileiro com acentuação correta e UTF-8 direto, nunca entidades HTML nem escapes Unicode. Travessão é proibido em qualquer texto entregue, inclusive narração e texto de tela: use vírgula, dois-pontos ou reescreva a frase.

## Resultado

Transformar uma premissa arrebatadora em uma **MIRA Story Bible**: uma arquitetura narrativa completa, causalmente integrada e pronta para ser convertida em experiência de público e sequência de slides.

Exigir que toda história seja simultaneamente:

- **surpreendente:** produzir descobertas merecidas e inevitáveis em retrospecto;
- **educativa:** permitir ao público reconstruir o conceito correto;
- **emocional:** fazer consequências, escolhas e transformações serem sentidas.

Não avançar por checklist mecânico. Fazer cada camada alterar e fortalecer todas as outras.

## Entradas

Obter ou inferir:

- premissa escolhida;
- âncora de verdade e invariantes conceituais;
- público e conhecimento prévio;
- transformação intelectual e emocional desejada;
- formato, duração e quantidade aproximada de slides;
- tom, limites éticos e restrições visuais.

Quando a premissa vier de notícia ou informação atual, exigir um breve factual verificado. Quando faltar uma premissa forte, usar `mira-premise-forge` se disponível ou executar o gate de premissa antes de continuar. Quando faltar a âncora conceitual, usar `mira-concept-storyteller` se disponível.

## Três gates de impacto

Aplicar os três gates em cada módulo e na arquitetura final.

### Surpresa merecida

Criar expectativa, fornecer pistas justas, produzir reversão de significado e pagar a promessa. Reter respostas ou motivos, nunca premissas indispensáveis. Rejeitar reviravoltas arbitrárias, segredos impossíveis de inferir e escaladas que não nasçam da causalidade.

### Educação incorporada

Fazer ações e consequências demonstrarem o mecanismo do conceito. Associar cada beat a uma função de aprendizagem. Rejeitar cenas espetaculares que ensinem uma relação falsa, simplifiquem além do limite ou dependam de exposição posterior para fazer sentido.

### Emoção causada

Fazer a emoção nascer de desejo, vínculo, risco, perda, escolha e consequência. Rejeitar pedidos diretos para o público sentir algo, melodrama sem causa e personagens que sofram apenas para fabricar intensidade.

Consultar [impact-gates.md](references/impact-gates.md) para os testes e critérios de pontuação.

## Fluxo estrutural obrigatório

### 0. Trancar a premissa

Expressar a história inteira em uma frase com colisão, protagonista ou força central, desejo, obstáculo, risco e transformação prometida. Validar que a premissa provoca **“Eu preciso ver essa história”** e preserva a âncora de verdade.

Se a premissa não passar, gerar novas candidatas e não construir as etapas seguintes.

### 1. Construir os sete passos-chave

Definir:

1. fraqueza e necessidade;
2. desejo;
3. oponente;
4. plano;
5. confronto decisivo;
6. autorrevelação;
7. novo equilíbrio.

Construir uma cadeia causal: cada passo deve tornar o próximo necessário. Fazer a autorrevelação corrigir o erro inicial e demonstrá-la por uma decisão observável.

### 2. Construir a rede de personagens

Projetar personagens como posições diferentes diante do mesmo problema moral ou conceitual. Incluir protagonista, oponente, aliado, falso aliado ou falso oponente apenas quando cumprirem função real.

Para cada personagem, definir desejo, valor dominante, estratégia, fraqueza, relação com o protagonista e contribuição para a transformação. Evitar personagens redundantes e antagonistas que sejam maus sem representar uma alternativa viável.

### 3. Formular tema e argumento moral

Converter o tema em disputa encarnada por ações. Definir:

- pergunta moral ou humana;
- valor inicial do protagonista;
- valores concorrentes;
- ações moralmente relevantes;
- consequência dessas ações;
- posição final demonstrada pela estrutura.

Não declarar a moral como sermão. Fazer o público alcançá-la ao avaliar escolhas e consequências.

### 4. Projetar o mundo ficcional

Criar um mundo que pressione o protagonista e materialize o conceito. Definir arena, regras, hierarquias, limites, recursos, espaços de poder, passagens, clima e transformação visual do ambiente.

Fazer o mundo mudar junto com a história. Rejeitar cenários intercambiáveis que poderiam ser substituídos sem alterar a trama.

### 5. Construir a rede de símbolos

Escolher símbolos recorrentes ligados à premissa, aos personagens, ao mundo e ao argumento moral. Definir para cada símbolo:

- significado inicial;
- aparições e variações;
- mudança de significado;
- payoff visual ou emocional.

Usar poucos símbolos fortes. Evitar símbolos meramente decorativos ou explicados verbalmente.

### 6. Construir a trama e as revelações

Planejar uma sequência de ações em que o protagonista persegue o desejo, o oponente responde, as estratégias se adaptam e as revelações aumentam em intensidade.

Manter dois registros:

- **ledger lógico:** fatos necessários antes de cada inferência;
- **ledger de revelação:** respostas, motivos e significados ainda retidos.

Fazer cada revelação mudar a interpretação do que já foi visto e acelerar a história. Preparar a surpresa com pistas que ganhem novo significado depois do payoff.

### 7. Tecer a teia de cenas

Organizar as cenas como um encadeamento de causa e efeito, não como tópicos. Registrar para cada cena:

- objetivo dramático;
- mudança de estado;
- emoção causada;
- conhecimento produzido;
- pista, retenção ou revelação;
- símbolo ativado;
- gancho causal para a próxima cena.

Remover cenas que não alterem ação, informação, emoção ou relação.

### 8. Construir cenas decisivas

Tratar cada cena como uma minihistória. Definir desejo local, oponente local, estratégia, conflito crescente, virada e estado de saída.

Entrar tarde, sair cedo e terminar no ponto de maior mudança útil. Fazer ações visíveis carregarem o significado que será transformado em animação MIRA.

### 9. Escrever diálogo sinfônico

Trabalhar o diálogo em trilhas simultâneas:

- **melodia:** o que é dito e move a ação;
- **harmonia:** emoção e relação entre os personagens;
- **tensão subterrânea:** intenção, valor, segredo ou conflito não declarado;
- **ritmo:** pausas, repetição, contraste, silêncio e aceleração.

Dar voz, vocabulário, cadência e estratégia verbal próprios a cada personagem. Evitar diálogo expositivo que repita a imagem ou diga diretamente o tema.

### 10. Preparar o handoff para o MIRA

Converter a arquitetura em beats narrativos, sem decidir ainda o layout final. Para cada beat, entregar:

- estado de entrada do público;
- ação e transformação visível;
- informação disponível e retida;
- emoção e sua causa;
- função educativa;
- motivo ou símbolo visual;
- transição causal.

Entregar esse material à skill de jornada do público e, depois, à direção de sequência de slides. Se essas skills não existirem, marcar o handoff como provisório.

## Contrato de saída: MIRA Story Bible

Entregar nesta ordem:

1. premissa arrebatadora;
2. promessa de impacto: surpresa, aprendizagem e emoção;
3. âncora de verdade e limites;
4. sete passos-chave;
5. rede de personagens;
6. tema e argumento moral;
7. mundo ficcional;
8. rede de símbolos;
9. trama e mapa de revelações;
10. teia de cenas;
11. fichas das cenas decisivas;
12. partitura de diálogo sinfônico;
13. handoff em beats para o MIRA;
14. auditoria final de impacto e coerência.

Usar tabelas para matrizes e correspondências. Escrever a história completa apenas quando o usuário solicitar; esta skill deve primeiro garantir a arquitetura.

## Auditoria final

Bloquear a entrega e corrigir se qualquer resposta essencial for negativa:

- A premissa é específica, visual, conceitualmente fiel e impossível de ignorar?
- Os sete passos formam uma cadeia causal?
- Os personagens expressam estratégias e valores diferentes?
- O argumento moral emerge de escolhas e consequências?
- O mundo pressiona a história e muda com ela?
- Os símbolos evoluem e recebem payoff?
- A trama aumenta ação, risco e compreensão?
- Toda informação retida tem pistas e prazo de revelação?
- Cada cena altera pelo menos dois estados relevantes?
- O diálogo opera em mais de uma trilha?
- A surpresa reinterpreta evidências já vistas?
- O conceito foi compreendido, sentido e transferido para fora da história?

Consultar [truby-architecture.md](references/truby-architecture.md) para os schemas completos de cada módulo e o formato da MIRA Story Bible.
