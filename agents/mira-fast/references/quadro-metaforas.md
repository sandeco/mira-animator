# Quadro de metáforas do deck (Fase 1)

Este é o método em lote do `/mira-animator`, Passada 1, adaptado ao `/mira-fast`. Fonte completa e autoritativa: `agents/mira-animator/SKILL.md`. Aqui está só o que a Fase 1 executa e o que muda no contexto do enxame.

## Por que o quadro vem antes, e centralizado

Parece contradizer "nada de sequencial". Não contradiz: **a Fase 1 é o que torna a Fase 2 paralelizável.**

O `/mira-animator` exige que as metáforas de um deck sejam diferentes entre si, e isso só se garante olhando todos os slides juntos. Se cada folha escolhesse a metáfora sozinha, elas colidiriam, e alguém teria que refazer depois. Como a Fase 1 entrega a metáfora já eleita para cada slide, duas folhas não têm como colidir. **A diversidade é garantida na largada, não corrigida na chegada.**

E o quadro é barato: é raciocínio em texto, sem código.

## Os cinco passos

> O método do `/mira-animator` roda A/B de duas candidatas antes de eleger. **Isso não acontece aqui.** No `/mira-fast` a metáfora é escolhida direto e submetida aos portões; a diversidade fica por conta da distribuição de famílias e do ledger.

### 1. Frase causal de cada slide

Molde obrigatório:

> `Quando [causa], [estado] muda de [A] para [B] porque [mecanismo]. Se [falha], [consequência].`

Escreva a de todos os slides antes de inventar qualquer cena. É a frase causal que vai ser testada, não o título.

### 2. Distribuir as famílias de domínio pelo deck

Com as frases lado a lado, **atribua uma família a cada slide antes de pensar em cena alguma**. Famílias disponíveis:

| Família | Exemplos de sistema |
|---|---|
| casa | despensa, torneira, disjuntor, varal, geladeira |
| rua | semáforo, calçada, obra, feira, sinalização |
| trabalho manual | marcenaria, solda, costura, alvenaria, oficina |
| natureza | represa, raiz, maré, colmeia, erosão |
| corpo | respiração, cicatriz, equilíbrio, digestão, reflexo |
| transporte | cancela, esteira de bagagem, baldeação, doca, pedágio |
| comércio | caixa, estoque, fila do balcão, entrega, troco |
| jogo | tabuleiro, rodízio de turno, cartas na mão, placar |

**O deck não pode morar em duas famílias.** Um deck de 10 slides usa 6 ou mais famílias distintas.

### 3. Escolher a metáfora, direto

Uma metáfora por slide, dentro da família já atribuída no passo 2.

> **Sem A/B.** Gerar duas candidatas e compará-las é método do `/mira-animator`, e **não roda no `/mira-fast`**. Aqui a diversidade vem de outro lugar: as famílias já foram distribuídas pelo deck antes de qualquer cena existir (passo 2), e o ledger varre as colisões no fim (passo 5). O A/B custa deliberação serial na única fase que trava o paralelismo, e entrega uma garantia que a distribuição de famílias já dá.

Metáfora já usada em outro slide está queimada, e isso só se enxerga com o quadro montado. É por isso que a escolha acontece aqui e não dentro da folha.

Proibido pensar em coreografia ou técnica neste passo. Só sistemas do mundo.

### 4. Portões baratos sobre a metáfora escolhida

Aplique os três portões que não exigem implementação. Eles não comparam candidatas, eles **aprovam ou reprovam** a que você escolheu:

| Portão | Rejeita quem |
|---|---|
| **Mapeamento 1 para 1** | preserva os substantivos mas troca direção, condição, ordem ou consequência; deixa parte sem correspondente dos dois lados; mistura duas metáforas |
| **Especificidade** | serve sem alteração para três conceitos não relacionados (é decoração) |
| **Distância lexical** | é a associação imediata do termo (orquestração para maestro, fluxo para rio, memória para gaveta). Só vence se a outra falhar num portão duro |

Reprovou em qualquer portão, troque por outra metáfora **da mesma família** e aplique os portões de novo. Não vale abrir uma rodada de comparação: escolha, teste, siga.

### 5. Fechar o quadro

Para cada slide animado, preencha os seis eixos:

`família | verbo causal | silhueta dominante | organização espacial | movimento principal | assinatura temporal`

**Assinaturas temporais válidas:** acumulação com colapso, rajada com pausa, fluxo interrompido, alternância, onda em cascata, perseguição, compressão e liberação.

O quadro fechado **já é o ledger preenchido**, planejado em vez de checado depois.

## O ledger, cinco critérios de rejeição

Antes de gravar o `plano.json`, varra todos os pares de slides animados. **Rejeite e reescolha** a candidata que:

1. reutiliza **sistema do cotidiano** de qualquer outro slide do deck;
2. repete a **família de um vizinho** (slide anterior ou seguinte);
3. coincide com um vizinho em **4 dos 6 eixos**;
4. repete o **movimento dominante** de um adjacente;
5. usa **partícula, órbita ou pulso** como movimento dominante quando outro slide do deck já usa.

Ao reescolher, gere uma substituta dentro da família atribuída ao slide.

## O gate humano não existe aqui

O `/mira-animator` manda apresentar o quadro ao usuário antes de codar quando o deck tem mais de 4 slides. **No `/mira-fast` esse gate não se aplica**, por incompatibilidade com a proposta: parar para confirmar é perder o recurso escasso.

A troca é consciente e tem compensação obrigatória:

1. O quadro fica salvo em `decks/<slug>/references/quadro-metaforas.md`, para revisão depois.
2. Slide que não ficou bom se conserta chamando `/mira-animator` **nele, isoladamente**, o que é barato porque o deck gerado é um deck Mira normal.

## Formato do `quadro-metaforas.md`

Espelho humano do plano, gravado pela Fase 1 junto com o `plano.json`:

```markdown
# Quadro de metáforas, <titulo_deck>

Deck: decks/<slug> · Formato: <formato> · Slides animados: N

| # | Conceito | Frase causal | Metáfora | Assinatura |
|---|---|---|---|---|
| 2 | condição de corrida | Quando dois fluxos escrevem... | duas mãos servindo da mesma panela | cozinha \| sobrepor \| panela e conchas \| duas colunas \| alternância \| rajada com pausa |
| 3 | exclusão mútua | Quando o acesso passa por uma cancela... | cancela com ticket único | transporte \| reter \| cancela e carros \| corredor com gargalo \| fluxo interrompido \| compressão e liberação |

## Famílias usadas
cozinha, transporte, natureza, corpo, comércio, jogo

## Conferência do ledger
Nenhum par de vizinhos compartilha família. Nenhum sistema do cotidiano se repete. Nenhum par coincide em 4 dos 6 eixos.
```

## Eco no chat, informativo e sem pergunta

Ao fechar o quadro, imprima um resumo compacto e **siga direto para a Fase 2**. O eco termina sem interrogação:

```
Deck: decks/programacao-concorrente (mira, 16:9) · 10 slides
 2  Dois fluxos, uma panela      duas mãos na mesma panela        cozinha
 3  A cancela que ordena         cancela com ticket único         transporte
 ...
Disparando 9 folhas.
```

Proibido escrever "posso continuar?", "quer ajustar?" ou qualquer variação. O usuário julga o resultado, não o plano.
