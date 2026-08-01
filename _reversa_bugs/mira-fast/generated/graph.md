<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-08-01T06:00:00Z a partir de 7 bugs -->

# Grafo de relações · mira-fast

Aresta sólida é `supported` ou `confirmed`; tracejada é `proposed`, isto é, hipótese.

```mermaid
graph LR
  K4NR["#4 K4NR<br/>esqueleto: section em comentário<br/>high · P1 · ACTIVE delivering"]
  VPVV["#5 VPVV<br/>capa vira slide de câmera vazio<br/>high · P1 · ACTIVE delivering"]
  UDTY["#6 UDTY<br/>full sem .full-wrap<br/>medium · P2 · ACTIVE delivering"]
  JJ6X["#7 JJ6X<br/>re-montagem apaga o roteiro.md<br/>high · P1 · ACTIVE delivering"]
  BNO4["#9 BNO4<br/>contagem final conta comentário<br/>high · P1 · ACTIVE delivering"]
  ETPU["#10 ETPU<br/>deck meio instalado<br/>medium · P2 · ACTIVE delivering"]
  AMOM["#11 AMOM<br/>validador Studio frouxo<br/>medium · P2 · ACTIVE delivering"]
  JZNJ["#1 JZNJ<br/>builder descarta o palco do slide<br/>critical · P1 · ACTIVE delivering<br/>(templates-studio)"]
  OI56["#3 OI56<br/>esqueleto sem marcadores @MIRA<br/>high · P1 · ACTIVE delivering<br/>(templates-studio)"]

  VPVV ---|related-to| JZNJ
  VPVV ---|related-to| UDTY
  UDTY ---|related-to| VPVV
  UDTY ---|related-to| AMOM
  BNO4 ---|related-to| K4NR
  BNO4 ---|related-to| ETPU
  AMOM ---|related-to| UDTY
  OI56 -.related-to.- K4NR

  classDef critico fill:#2a1014,stroke:#e05260,color:#f5f5f5
  classDef aberto fill:#2a1416,stroke:#c0392b,color:#f5f5f5
  classDef medio fill:#2a2413,stroke:#c8a02c,color:#f5f5f5
  classDef entregando fill:#12251c,stroke:#4fbf8b,color:#f5f5f5
  class K4NR entregando
  class VPVV entregando
  class UDTY entregando
  class JJ6X entregando
  class BNO4 entregando
  class ETPU entregando
  class AMOM entregando
  class JZNJ entregando
  class OI56 entregando
```

## Leitura

7 de 7 bug(s) deste contexto estão em `delivering`: corrigidos, testes verdes,
aguardando merge e publicação. Nenhum `DONE.md` foi gravado, porque a closure policy
`package` não está satisfeita.
