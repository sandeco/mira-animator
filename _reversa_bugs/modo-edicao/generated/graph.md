<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-08-01T21:56:00Z a partir de 1 bugs -->

# Grafo de bugs · modo-edicao

```mermaid
graph LR
  subgraph modo-edicao
    B6UHJ["#15 6UHJ<br/>overlay engole o clique<br/>open · P1 · high"]
  end
  subgraph historico["fora do registro"]
    ESF["_reversa_sdd/edit-stuck-fix<br/>mesmo relato, causa diferente<br/>corrigido"]
  end
  ESF -.->|"relato equivalente, sem bug.md"| B6UHJ

  classDef open fill:#3a2a1a,stroke:#ff904d,stroke-width:2px,color:#fff
  classDef hist fill:#1e1e1e,stroke:#555,stroke-dasharray:4 3,color:#aaa
  class B6UHJ open
  class ESF hist
```

Um bug, sem arestas canônicas. A seta pontilhada não é relação tipada: marca que o mesmo sintoma
relatado pelo usuário já foi tratado uma vez, por outra causa, antes de existir o registro.
