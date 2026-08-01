<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-07-31T22:40:00Z a partir de 4 bugs -->

# Matriz de relações BUG ↔ BUG · templates-studio

Lista esparsa. Aresta canônica é gravada uma vez, no bug de origem; as inversas de relações
simétricas aparecem marcadas como derivadas e não existem em nenhum `bug.md`.

## Arestas canônicas gravadas neste contexto

| origem | tipo | destino | contexto do destino | state | evidência |
|---|---|---|---|---|---|
| S3TX | related-to | JZNJ | templates-studio | proposed | nenhuma |
| JZNJ | related-to | OI56 | templates-studio | proposed | nenhuma |
| OI56 | related-to | K4NR | **mira-fast** | proposed | nenhuma |
| RNYU | related-to | JZNJ | templates-studio | proposed | nenhuma |

## Arestas que chegam de outro contexto

| origem | contexto da origem | tipo | destino | state |
|---|---|---|---|---|
| VPVV | mira-fast | related-to | JZNJ | proposed |

## Arestas derivadas

| origem | tipo | destino | derivada de |
|---|---|---|---|
| JZNJ | related-to | S3TX | aresta em S3TX |
| OI56 | related-to | JZNJ | aresta em JZNJ |
| K4NR | related-to | OI56 | aresta em OI56 (cruza contexto) |
| JZNJ | related-to | RNYU | aresta em RNYU |
| JZNJ | related-to | VPVV | aresta em VPVV (cruza contexto) |

## Clusters

O JZNJ virou o nó de maior grau do registro inteiro: quatro arestas, três de dentro do
contexto e uma vinda do `mira-fast`. Não porque cause os outros, e sim porque é o ponto onde
o runtime do template e o contrato do `/mira-fast` se encontram; quase todo defeito desta
área toca esse encontro.

O que cada aresta afirma, todas ainda como hipótese (`proposed`):

- **S3TX ↔ JZNJ**: mesma classe de defeito, dois formatos, dois arquivos, mecanismos
  diferentes. Não é `duplicate-of`.
- **JZNJ ↔ OI56**: mesmo template, mesmo caminho de geração; OI56 é pré-requisito para
  reproduzir JZNJ do zero.
- **OI56 ↔ K4NR**: derrubam a mesma execução da Fase 3, por motivos independentes.
- **RNYU ↔ JZNJ**: os dois nascem de o deck gerado herdar o runtime do template sem
  adaptação. Um herda o builder, o outro herda o texto de demonstração.
- **VPVV ↔ JZNJ**: os dois se manifestam no mesmo `montarSecao`. Corrigir um não corrige o
  outro: a capa não tem palco a preservar, depende do clone de `capaBase`.

Leitura completa do cluster, com as duas famílias de defeito e a ordem sugerida de ataque,
em `graph.md` e em `../inspections/2026-07-31-decks-studio/report.md`, seção 3.
