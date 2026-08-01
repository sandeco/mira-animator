<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-08-01T06:00:00Z a partir de 4 bugs -->

# Matriz de relações BUG ↔ BUG · templates-studio

## Arestas canônicas gravadas neste contexto

| origem | tipo | destino | contexto do destino | state | evidência |
|---|---|---|---|---|---|
| JZNJ | related-to | OI56 | templates-studio | **supported** | sem o esqueleto pelo caminho canônico (correção do OI56) não há deck gerado para servir; a reprodução deste bug depende daquela correção |
| JZNJ | related-to | S3TX | templates-studio | **supported** | mesma política invertida nos dois builders, mesma correção, arquivos diferentes |
| S3TX | related-to | JZNJ | templates-studio | **supported** | os dois builders sofriam da mesma política (recriar por padrão) e receberam a mesma correção (preservar por padrão), em arquivos diferentes |
| OI56 | related-to | K4NR | **mira-fast** | proposed | nenhuma |
| OI56 | caused-by | VPUH | **cli-mira-animator** | **supported** | mesmo pelo caminho canônico, o esqueleto Studio continua reprovando por falta do bloco @MIRA:THEME, porque o template não traz o marcador que o CLI substitui. Essa metade do defeito é o BUG-20260801-VPUH. |
| RNYU | related-to | JZNJ | templates-studio | **supported** | mesma origem: a Fase 1 herda o runtime inteiro do template e a Fase 3 não o adaptava ao deck gerado. Lá era o palco, aqui é a fala. |
| RNYU | related-to | S3TX | templates-studio | **supported** | R7e e R3e são a mesma regra: nenhum artefato publicado carrega conteúdo de demonstração do template |

Todos os bugs deste contexto têm ao menos uma aresta própria.

## Arestas que chegam de outro contexto

| origem | contexto da origem | tipo | destino | state |
|---|---|---|---|---|
| VPVV | mira-fast | related-to | JZNJ | **supported** |
| VPUH | cli-mira-animator | related-to | OI56 | **supported** |

## Estado epistemológico

| state | arestas |
|---|---|
| supported | 6 |
| confirmed | 0 |
| proposed | 1 |
| rejected | 0 |

Aresta `proposed` é hipótese e não entra no grafo como fato.
