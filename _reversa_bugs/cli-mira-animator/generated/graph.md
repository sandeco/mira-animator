<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-08-01T06:00:00Z a partir de 1 bugs -->

# Grafo de relações · cli-mira-animator

Aresta sólida é `supported` ou `confirmed`; tracejada é `proposed`, isto é, hipótese.

```mermaid
graph LR
  VPUH["#12 VPUH<br/>--theme ignorado em silêncio<br/>medium · P2 · ACTIVE delivering"]
  OI56["#3 OI56<br/>esqueleto sem marcadores @MIRA<br/>high · P1 · ACTIVE delivering<br/>(templates-studio)"]

  VPUH ---|related-to| OI56
  OI56 ---|caused-by| VPUH

  classDef critico fill:#2a1014,stroke:#e05260,color:#f5f5f5
  classDef aberto fill:#2a1416,stroke:#c0392b,color:#f5f5f5
  classDef medio fill:#2a2413,stroke:#c8a02c,color:#f5f5f5
  classDef entregando fill:#12251c,stroke:#4fbf8b,color:#f5f5f5
  class VPUH entregando
  class OI56 entregando
```

## Leitura

1 de 1 bug(s) deste contexto estão em `delivering`: corrigidos, testes verdes,
aguardando merge e publicação. Nenhum `DONE.md` foi gravado, porque a closure policy
`package` não está satisfeita.
