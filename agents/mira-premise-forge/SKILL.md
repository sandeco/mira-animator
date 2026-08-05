---
name: mira-premise-forge
description: >-
  Pesquisar notícias, lançamentos, tendências e informações atuais, desenterrar o momento Eureca
  escondido nelas e transformá-lo em premissas arrebatadoras, factualmente defensáveis e visualmente
  potentes para histórias MIRA. Usar quando o usuário pedir premissas, loglines ou ideias de
  história baseadas em fatos recentes, notícias, artigos, disputas tecnológicas, mudanças sociais,
  descobertas científicas ou acontecimentos reais. Não usar para desenvolver toda a estrutura da
  história, nem para criar ou animar slides, que são do /mira-builder e do /mira-animator.
---

# MIRA Premise Forge

## Onde isto entra no Mira

Cadeia narrativa do Mira, em ordem: `/mira-premise-forge`, `/mira-concept-storyteller`, `/mira-story-architect`, `/mira-design-audience-journey`, `/mira-direct-slide-sequence`, `/mira-direct-scene`, `/mira-direct-cinematic-motion`. No fim, o `/mira-animator` escreve a animação dentro do `index.html` do deck, e o `/mira-builder` monta o resto.

**Etapa 1.** Recebe um tema, uma notícia ou um fato. Entrega o Premise Brief. Pode ser pulada quando a premissa já existe.

Nenhuma skill desta cadeia escreve HTML, e nenhuma delas cria a metáfora animada: o método de metáfora, a rubrica de 85 e o código do slide são do `/mira-animator`.

Idioma e formatação seguem `agents/_shared/idioma.md`: português brasileiro com acentuação correta e UTF-8 direto, nunca entidades HTML nem escapes Unicode. Travessão é proibido em qualquer texto entregue, inclusive narração e texto de tela: use vírgula, dois-pontos ou reescreva a frase.

## Resultado

Transformar realidade atual em uma descoberta narrativa que provoque primeiro **“Eureca, era isso que estava escondido aqui”** e depois **“Eu preciso ver essa história”**, sem distorcer os fatos que lhe dão força.

Entregar um **Premise Brief** pronto para alimentar `mira-concept-storyteller` e `mira-story-architect`.

## Regra inviolável

Não dramatizar uma afirmação atual antes de verificá-la. Separar:

- **fato:** sustentado diretamente por fonte adequada;
- **inferência:** conclusão plausível derivada dos fatos;
- **interpretação:** leitura estratégica, política, moral ou cultural;
- **incerteza:** ponto ainda não resolvido ou dependente de métrica.

Fazer a premissa nascer da tensão verdadeira entre os fatos. Nunca fabricar uma “verdade” mais cinematográfica.

## Princípio do ouro enterrado

A manchete é apenas o terreno. A premissa nasce do ouro conceitual enterrado nela: uma relação causal, inversão, consequência ou mudança de critério que ainda não é óbvia.

Não aceitar como premissa:

- resumo da notícia;
- tema com linguagem dramática;
- comparação de atributos sem consequência;
- paradoxo verbal sem mecanismo;
- surpresa que não muda a compreensão do público.

Exigir uma descoberta capaz de ser expressa assim:

> **Eu pensava X. Agora percebo Y, porque Z. Isso muda W.**

Essa descoberta é o **momento Eureca**. Ela deve conter o germe da surpresa, da aprendizagem e da emoção; esses efeitos não podem ser adicionados depois como decoração.

## Entrada

Obter ou inferir:

- notícia, afirmação, tema ou tendência;
- público;
- conceito que a história deverá ensinar;
- escala: pessoa, empresa, país, setor ou humanidade;
- tom e duração desejados;
- período de atualidade relevante;
- limites políticos, éticos ou culturais.

## Fluxo obrigatório

### 1. Construir o brief factual atual

Pesquisar a web sempre que o tema puder ter mudado. Preferir, nesta ordem:

1. documentação, relatório técnico ou anúncio primário;
2. pesquisa científica ou avaliação independente;
3. veículo jornalístico reconhecido com apuração própria;
4. análise especializada claramente identificada como interpretação.

Usar pelo menos duas fontes independentes para a afirmação central quando possível. Registrar data do fato, data da publicação, métrica usada e limitações. Consultar [current-facts-workflow.md](references/current-facts-workflow.md).

### 2. Escavar o ouro narrativo

Não saltar da pesquisa para uma logline. Investigar a realidade em camadas:

1. **superfície:** o que a manchete afirma;
2. **mecanismo:** o que faz o fenômeno acontecer;
3. **crença quebrada:** qual regra o público ainda supõe verdadeira;
4. **inversão:** o que passa a significar vitória, derrota, poder ou risco;
5. **consequência humana:** quem terá de agir, perder, escolher ou mudar;
6. **prova dramática:** que situação obrigará essa verdade a funcionar diante do público;
7. **sabedoria transferível:** que novo critério o público poderá usar na própria vida.

Para cada uma de pelo menos três hipóteses de ouro, completar:

- **Todo mundo olha para...**
- **Mas o que realmente está mudando é...**
- **Isso acontece porque...**
- **Se for verdade, então...**
- **A pessoa que mais perderia com isso é...**
- **A escolha que provaria essa verdade seria...**

Consultar [eureka-excavation.md](references/eureka-excavation.md). Não avançar enquanto a hipótese vencedora não revelar um mecanismo defensável e uma consequência dramática.

Depois da exploração horizontal, executar **escavação vertical** na hipótese mais forte:

1. atacar a hipótese com a melhor objeção disponível;
2. inverter causa e consequência;
3. trocar novamente a unidade de análise;
4. seguir o benefício até quem paga o custo;
5. retirar todo jargão e reescrever para uma pessoa inteligente de outra área;
6. condensar até restar uma única verdade inevitável.

Se a hipótese perder força sem jargão, ela ainda é uma análise especializada, não ouro narrativo.

### 3. Encontrar a fratura dramática

Extrair da realidade:

- forças ou mundos em colisão;
- assimetria inesperada;
- regra antiga que deixou de funcionar;
- vantagem visível e custo escondido;
- vencedor aparente e ameaça emergente;
- escolha impossível;
- contagem regressiva;
- consequência humana ou intelectual.

Formular a pergunta magnética: **“Que realidade contraditória o público precisa ver em funcionamento?”**

### 4. Formular e testar o momento Eureca

Condensar a hipótese vencedora:

```text
Eu pensava [crença inicial].
Agora percebo [verdade contraintuitiva], porque [mecanismo verificável].
Isso muda [critério, decisão ou visão de mundo].
```

Aplicar o **Gate Eureca**. Todas as respostas precisam ser “sim”:

- A descoberta vai além do que a manchete já diz?
- Ela revela uma relação causal, estratégica ou moral, não apenas uma coincidência?
- Ela corrige uma crença plausível do público?
- Ela muda a unidade pela qual o fenômeno deve ser julgado?
- Ela produz uma consequência humana sentível?
- Ela pode ser demonstrada por ação, escolha e resultado?
- Ela continua verdadeira quando removemos países, marcas e nomes próprios?
- Ela oferece sabedoria aplicável fora desta notícia?

Se falhar, retornar à escavação. Não polir uma hipótese rasa.

### 5. Catapultar o ouro pelas dez lentes da premissa

Para cada hipótese de ouro finalista, escrever uma **proto-premissa concreta** e submetê-la às dez lentes inspiradas no processo do capítulo 2 de *Anatomia da História*:

1. **convicção:** por que esta descoberta merece mudar o criador e o público;
2. **possibilidades e promessas:** que acontecimentos a ideia permite e quais o público espera ver;
3. **problemas inerentes:** que dificuldades conceituais, dramáticas, éticas ou visuais vêm embutidas;
4. **princípio organizador:** qual processo profundo e execução original unificam a história;
5. **melhor personagem:** quem revela o máximo da ideia por meio de ação e vulnerabilidade e não pode ser substituído por um porta-voz genérico;
6. **conflito central:** quem disputa com quem, pelo quê, e por que ambos não podem vencer;
7. **espinha causal:** como uma ação provoca a seguinte até a descoberta final;
8. **transformação:** de que crença e modo de agir o protagonista parte e aonde chega;
9. **escolha moral:** que decisão custosa revela o sentido da história;
10. **apelo ao público:** por que alguém além do criador precisa acompanhar até o fim.

Consultar [chapter-2-catapult.md](references/chapter-2-catapult.md) e preencher o cartão das dez lentes. Falha grave em princípio organizador, conflito, causalidade, transformação ou escolha moral elimina a hipótese.

### 6. Executar o ciclo premise–princípio–premissa

Não confundir:

- **premissa:** o que concretamente acontece;
- **princípio organizador:** o processo abstrato e original pelo qual a história prova seu ouro.

Executar pelo menos uma volta:

```text
proto-premissa concreta
→ induzir o princípio organizador
→ descobrir promessas e problemas
→ revisar personagem, conflito, causalidade e escolha
→ reescrever uma premissa mais original e orgânica
```

Gerar no mínimo três princípios organizadores possíveis para a mesma proto-premissa. Escolher o que melhor funde **processo da história + execução original + demonstração do conceito**. Não impor gênero, estrutura de slides ou metáfora decorativa de fora para dentro.

Aplicar o **teste do desabamento**: retirar o princípio organizador e imaginar a mesma trama. Se apenas a estética ou o motor visual mudar, ele era decoração. O princípio só passa se sua remoção romper a causalidade, a transformação ou a revelação central.

Repetir a volta somente enquanto houver ganho material. Registrar a diferença entre a primeira e a última versão para provar que o ouro foi realmente refinado.

### 7. Definir a promessa educativa e emocional

Antes da premissa, fixar:

- **aprendizagem:** o que o público conseguirá explicar;
- **erro inicial:** o que ele provavelmente acredita;
- **sabedoria:** que critério poderá aplicar fora da história;
- **emoção central:** curiosidade, tensão, assombro, perda, esperança ou ambivalência;
- **causa da emoção:** acontecimento que justificará senti-la.

### 8. Gerar famílias de premissa

Produzir no mínimo cinco candidatas, variando o princípio narrativo. Não trocar apenas nomes mantendo a mesma estrutura.

Usar, conforme o caso:

- colisão de forças;
- inversão de poder;
- vantagem assimétrica;
- falsa vitória;
- custo invisível;
- escolha impossível;
- convergência acelerada;
- contagem regressiva;
- regra quebrada;
- cavalo de Troia.

Consultar [premise-patterns.md](references/premise-patterns.md).

### 9. Escrever cada candidata

Para cada opção, entregar:

1. **“E se...?”**: princípio narrativo em forma de pergunta;
2. **premissa**: uma frase com ruptura, protagonista ou força, desejo, oposição, aposta e transformação prometida;
3. **ouro desenterrado**: verdade que a ação provará;
4. **princípio organizador**: processo profundo + execução original;
5. **protagonista, conflito e escolha**: síntese do motor humano;
6. **espinha causal**: ação inicial → escalada → descoberta → consequência;
7. **segredo da história**: relação cujo significado será revelado gradualmente;
8. **motor visual**: imagem ou transformação repetível em slides;
9. **promessa educativa**;
10. **emoção e sua causa**;
11. **limite factual**: o que a história não poderá afirmar.

### 10. Aplicar o gate “Eu preciso ver isso”

Pontuar de 0 a 5:

| Critério | Pergunta |
|---|---|
| Imediatismo | A tensão é compreendida em segundos? |
| Eureca | A premissa contém uma descoberta que reorganiza o significado do fato? |
| Colisão | Há forças realmente incompatíveis ou em competição? |
| Curiosidade | Surge uma pergunta difícil de abandonar? |
| Aposta | Algo relevante pode ser perdido ou transformado? |
| Surpresa | A premissa desafia uma expectativa plausível? |
| Educação | O conflito demonstra o conceito verdadeiro? |
| Emoção | Existe consequência humana ou intelectual sentível? |
| Visualidade | A ideia gera ações e estados animáveis? |
| Expansão | Ela sustenta uma história completa? |
| Organicidade | Personagem, conflito, transformação e escolha nascem do mesmo ouro? |
| Fidelidade | Cada afirmação é defensável pelo brief factual? |

Exigir média mínima 4, nota mínima 4 em Eureca, curiosidade, visualidade e organicidade e nota 5 em fidelidade. Se nenhuma passar, voltar à pesquisa ou gerar nova família.

Aplicar ainda quatro **vetos absolutos**, independentemente da média:

- não existe perda, risco, culpa, renúncia ou sacrifício concreto antes da escolha;
- outro personagem genérico poderia ocupar o lugar do protagonista sem alterar a história;
- retirar o princípio organizador preserva a mesma trama;
- o ouro não pode ser explicado em linguagem comum sem perder o significado.

### 11. Executar auditoria adversarial

Tentar destruir a candidata vencedora:

- Ela generaliza um caso para todo um país, setor ou categoria?
- Confunde preço, custo, tamanho, parâmetros, memória, bytes, energia ou velocidade?
- Trata benchmark como capacidade universal?
- Transforma correlação em causalidade?
- Cria um vencedor definitivo onde os dados mostram segmentação?
- Converte concorrência complexa em caricatura nacional?
- Promete um segredo maior que o fato consegue pagar?
- A suposta descoberta é apenas a manchete reescrita?
- O “porque” contém um mecanismo ou apenas outra afirmação?
- A surpresa desaparece assim que retiramos os adjetivos?
- A consequência nasce do ouro encontrado ou foi enxertada depois?
- O princípio organizador é apenas gênero, estética ou metáfora decorativa?
- A história possui mais de uma espinha causal competindo por atenção?
- O personagem é realmente o melhor para revelar a ideia ou apenas um porta-voz conveniente?
- A escolha final testa o ouro ou apenas encerra a trama?
- A emoção possui um acontecimento e um custo observáveis ou é apenas fascínio intelectual?
- A premissa continua arrebatadora depois que todo jargão técnico é removido?

Corrigir a premissa ou declarar explicitamente o limite.

### 12. Selecionar e preparar o handoff

Escolher uma vencedora e explicar por que supera as demais. Preservar até duas alternativas quando oferecerem histórias genuinamente diferentes.

Entregar o brief à `mira-concept-storyteller` para garantir a metáfora e à `mira-story-architect` para construir a Story Bible.

## Contrato de saída: Premise Brief

Entregar:

1. realidade verificada, com data e fontes;
2. fatos, inferências, interpretações e incertezas;
3. mapa de escavação e três hipóteses de ouro;
4. momento Eureca vencedor;
5. cartão das dez lentes;
6. ciclo proto-premissa → princípio organizador → premissa refinada;
7. fratura dramática;
8. promessa educativa e emocional;
9. cinco ou mais candidatas;
10. matriz de pontuação;
11. premissa vencedora;
12. princípio organizador, personagem, conflito, espinha causal e escolha moral;
13. ouro, segredo e motor visual;
14. limites factuais;
15. handoff para arquitetura narrativa.

Quando o usuário pedir apenas uma premissa rápida, pesquisar e validar internamente, mostrar a vencedora e incluir uma justificativa e o limite factual em poucas linhas.

## Auditoria final

Bloquear e refazer se:

- a premissa depender de fato desatualizado ou sem fonte;
- a colisão for apenas geopolítica e não tiver mecanismo concreto;
- a história reforçar estereótipo nacional ou cultural;
- a pergunta puder ser respondida sem acompanhar acontecimentos;
- a premissa for apenas tema ou manchete reescrita;
- o momento Eureca não mudar a compreensão ou o critério de decisão do público;
- o ouro não puder ser expresso como crença quebrada + mecanismo + consequência;
- a premissa e o princípio organizador forem confundidos;
- não houver uma única espinha de causa e efeito;
- protagonista, conflito, transformação e escolha moral não nascerem da descoberta central;
- a substituição do protagonista por um observador genérico não alterar a história;
- a remoção do princípio organizador não fizer a trama desabar;
- não houver perda humana concreta antes da escolha final;
- o ouro depender de jargão para parecer profundo;
- os problemas e as promessas inerentes da ideia não forem identificados;
- o conceito não puder ser demonstrado visualmente;
- surpresa, educação ou emoção forem apenas adjetivos sem causa estrutural;
- a premissa não sustentar os sete passos e uma transformação.
