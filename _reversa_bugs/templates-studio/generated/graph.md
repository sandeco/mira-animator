<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-08-01T06:00:00Z a partir de 4 bugs -->

# Grafo de relações · templates-studio

Aresta sólida é `supported` ou `confirmed`; tracejada é `proposed`, isto é, hipótese.

```mermaid
graph LR
  JZNJ["#1 JZNJ<br/>builder descarta o palco do slide<br/>critical · P1 · ACTIVE delivering"]
  S3TX["#2 S3TX<br/>studio-full apaga os slides gerados<br/>critical · P0 · ACTIVE delivering"]
  OI56["#3 OI56<br/>esqueleto sem marcadores @MIRA<br/>high · P1 · ACTIVE delivering"]
  RNYU["#8 RNYU<br/>falas de demonstração vazam<br/>medium · P2 · ACTIVE delivering"]
  K4NR["#4 K4NR<br/>esqueleto: section em comentário<br/>high · P1 · ACTIVE delivering<br/>(mira-fast)"]
  VPUH["#12 VPUH<br/>--theme ignorado em silêncio<br/>medium · P2 · ACTIVE delivering<br/>(cli-mira-animator)"]
  VPVV["#5 VPVV<br/>capa vira slide de câmera vazio<br/>high · P1 · ACTIVE delivering<br/>(mira-fast)"]

  JZNJ ---|related-to| OI56
  JZNJ ---|related-to| S3TX
  S3TX ---|related-to| JZNJ
  OI56 -.related-to.- K4NR
  OI56 ---|caused-by| VPUH
  RNYU ---|related-to| JZNJ
  RNYU ---|related-to| S3TX
  VPVV ---|related-to| JZNJ
  VPUH ---|related-to| OI56

  classDef critico fill:#2a1014,stroke:#e05260,color:#f5f5f5
  classDef aberto fill:#2a1416,stroke:#c0392b,color:#f5f5f5
  classDef medio fill:#2a2413,stroke:#c8a02c,color:#f5f5f5
  classDef entregando fill:#12251c,stroke:#4fbf8b,color:#f5f5f5
  class JZNJ entregando
  class S3TX entregando
  class OI56 entregando
  class RNYU entregando
  class K4NR entregando
  class VPUH entregando
  class VPVV entregando
```

## Leitura

4 de 4 bug(s) deste contexto estão em `delivering`: corrigidos, testes verdes,
aguardando merge e publicação. Nenhum `DONE.md` foi gravado, porque a closure policy
`package` não está satisfeita.
