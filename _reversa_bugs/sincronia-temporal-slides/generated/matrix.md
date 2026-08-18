<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-08-18T15:11:00Z a partir de 4 bugs -->

# Matriz de relações BUG ↔ BUG · sincronia-temporal-slides

## Arestas canônicas gravadas neste contexto

| origem | tipo | destino | contexto do destino | state | evidência |
|---|---|---|---|---|---|
| T3RG | related-to | V4LD | sincronia-temporal-slides | proposed | nenhuma. A hipótese é de ordem: o validador não reprova timer órfão, e por isso quatro templates convivem com ele desde sempre. Falta mostrar que o item de checklist teria pegado esses casos |
| R7MC | related-to | S5CT | sincronia-temporal-slides | proposed | nenhuma. Os dois são a passagem de slide, em caminhos diferentes: o S5CT é o glitch observado no teclado, o R7MC é o `'smooth'` escrito na mão no caminho do celular. Não é duplicata. A hipótese é que a correção do S5CT precise ser repetida no R7MC |
| V4LD | related-to | T3RG | sincronia-temporal-slides | proposed | o item de checklist do V4LD depende da regra que o T3RG vai definir; escrever antes produz validador que reprova o que o projeto aceita |
| S5CT | related-to | R7MC | sincronia-temporal-slides | proposed | mesmo defeito de continuidade, outro caminho de navegação. Enquanto o mecanismo do S5CT não estiver medido, não dá para dizer se o R7MC sofre do mesmo |

## Arestas que chegam de outro contexto

Nenhuma.

## Arestas propostas e recusadas

Não foi criada aresta entre o T3RG e os bugs de `templates-studio` que tocam
`mira-studio-demo/index.html` (BUG-20260731-JZNJ, BUG-20260731-S3TX). Vizinhança de arquivo
não é parentesco: lá o defeito é o builder do roteiro descartando o palco, aqui é o timer sem
portão de entrada. A sobreposição é operacional, e está registrada como aviso no corpo do
T3RG, não como relação.

## Bugs sem nenhuma aresta

Nenhum. O contexto é um cluster só, com dois pares: o par da regra 1 (T3RG ↔ V4LD, defeito e
ausência de verificação) e o par da regra 2 (S5CT ↔ R7MC, o glitch observado no teclado e o
caminho do celular que ninguém patcheia).

## Estado epistemológico

| state | arestas |
|---|---|
| supported | 0 |
| confirmed | 0 |
| proposed | 4 |
| rejected | 0 |

Todas as arestas são hipótese. Nenhuma entra em priorização automática nem no impact score.
Um contexto novo começa assim de propósito: parentesco entre bugs se prova corrigindo, não
registrando.
