<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-08-01T17:45:00Z a partir de 6 bugs -->

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
| F74X | related-to | JZNJ | templates-studio | proposed | o reaproveitamento por posição introduzido pelo JZNJ é o mecanismo que prende texto e título à posição; o JZNJ o introduziu corretamente e este bug é a consequência não coberta daquele casamento |
| F74X | related-to | S3TX | templates-studio | proposed | mesmo par de arquivos, mesma assimetria entre os dois builders Studio, invertida: lá o 16:9 estava atrás, aqui é o 9:16 |
| F74X | blocked-by | ADQX | templates-studio | **confirmed** | sem a correção do ADQX o Salvar recusava em deck gerado e os critérios de aceite 1 e 2 do F74X não tinham como passar; corrigidos no mesmo ciclo |
| ADQX | related-to | F74X | templates-studio | **confirmed** | descoberto durante a reprodução do F74X, e era o que bloqueava o critério dele para deck gerado |

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
| confirmed | 2 |
| proposed | 3 |
| rejected | 0 |

Aresta `proposed` é hipótese e não entra no grafo como fato.
