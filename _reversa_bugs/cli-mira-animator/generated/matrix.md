<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-08-01T01:30:00Z a partir de 1 bug -->

# Matriz de relações BUG ↔ BUG · cli-mira-animator

## Arestas canônicas gravadas neste contexto

| origem | tipo | destino | contexto do destino | state | evidência |
|---|---|---|---|---|---|
| VPUH | related-to | OI56 | **templates-studio** | supported | o marcador ausente é o único sintoma de template do OI56, e é a causa deste bug |

## Arestas que chegam de outro contexto

| origem | contexto | tipo | destino | state | evidência |
|---|---|---|---|---|---|
| OI56 | templates-studio | **caused-by** | VPUH | supported | mesmo pelo caminho canônico, o esqueleto Studio reprovava por falta do `@MIRA:THEME` |

A aresta `caused-by` é direcional e está gravada uma vez só, no OI56. Ela diz que a metade
Studio do OI56 era causada por este bug, e é a razão de os dois terem sido corrigidos juntos.

## Cluster

Contexto de um bug só. Ele fecha o cluster "geração de decks Studio pelo `/mira-fast`", que
nasceu em `templates-studio` e se espalhou por três contextos.

O que este contexto acrescenta ao cluster: os outros bugs são do pipeline de geração; este é
do CLI, e atinge gente que nunca usou o `/mira-fast`. Foi encontrado por inspeção, não por
relato, e ninguém tinha reclamado dele porque não quebra nada visível: o deck abre, só ignora
a flag.
