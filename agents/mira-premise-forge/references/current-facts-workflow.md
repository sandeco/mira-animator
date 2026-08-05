# Workflow de fatos atuais

## Sumário

1. Hierarquia de fontes
2. Tabela de evidências
3. Testes de atualidade
4. Tratamento de conflito
5. Riscos técnicos frequentes

## 1. Hierarquia de fontes

| Nível | Fonte | Uso |
|---|---|---|
| A | relatório técnico, documentação, paper, base oficial | especificações e afirmações primárias |
| B | avaliação independente, benchmark com metodologia | comparação e teste de alegações |
| C | Reuters, AP, Nature, Financial Times ou equivalente | contexto, adoção, disputa e consequências |
| D | análise, opinião, rede social | pistas e interpretações, nunca suporte único de fato central |

Uma fonte primária pode estar correta sobre sua própria configuração e ainda ser promocional sobre superioridade. Procurar avaliação independente para comparações.

## 2. Tabela de evidências

| Afirmação | Tipo | Data do fato | Fonte | Métrica e escopo | Confiança | Pode entrar na premissa? |
|---|---|---|---|---|---|---|

Classificar como fato, inferência, interpretação ou incerteza. Não fundir os campos na redação.

## 3. Testes de atualidade

- Verificar se houve lançamento posterior.
- Comparar data do benchmark com a versão do modelo.
- Distinguir preço promocional de preço estável.
- Confirmar se “aberto” significa código aberto, pesos abertos ou apenas acesso por API.
- Registrar região, modalidade, comprimento de contexto e condições de execução.

## 4. Tratamento de conflito

Quando fontes discordarem:

1. comparar definições e métricas;
2. verificar versão e data;
3. procurar diferença entre declaração da empresa e avaliação externa;
4. manter a disputa como incerteza quando não houver resolução;
5. usar a própria incerteza como tensão narrativa se ela for central.

## 5. Riscos técnicos frequentes

- **Parâmetros não são bytes:** tamanho em parâmetros, memória de pesos e arquivo quantizado são medidas relacionadas, mas diferentes.
- **Preço não é custo total:** tokens, hardware, latência, retries, ferramentas e operação podem mudar o resultado.
- **Benchmark não é inteligência universal:** desempenho depende de tarefas, harness, amostragem e critério.
- **MoE exige contexto:** parâmetros totais e parâmetros ativos por token não são intercambiáveis.
- **Aberto tem graus:** pesos disponíveis não implicam dados, treinamento ou licença totalmente abertos.
- **País não é laboratório único:** empresas de uma mesma origem podem usar estratégias e escalas opostas.
