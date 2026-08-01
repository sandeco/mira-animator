<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-08-01T17:45:00Z a partir de 6 bugs -->

# Grafo de relações · templates-studio

Aresta sólida é `supported` ou `confirmed`; tracejada é `proposed`, isto é, hipótese.

```mermaid
graph LR
  JZNJ["#1 JZNJ<br/>builder descarta o palco do slide<br/>critical · P1 · ACTIVE delivering"]
  S3TX["#2 S3TX<br/>studio-full apaga os slides gerados<br/>critical · P0 · ACTIVE delivering"]
  OI56["#3 OI56<br/>esqueleto sem marcadores @MIRA<br/>high · P1 · ACTIVE delivering"]
  F74X["#13 F74X<br/>reordenar no 9:16 não move o roteiro.md<br/>high · P1 · ACTIVE delivering"]
  ADQX["#14 ADQX<br/>banners órfãos corrompem o deck gerado<br/>high · P1 · ACTIVE delivering"]
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
  F74X -.related-to.- JZNJ
  F74X -.related-to.- S3TX
  F74X ---|blocked-by| ADQX
  ADQX ---|related-to| F74X
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
  class F74X entregando
  class ADQX entregando
  class K4NR entregando
  class VPUH entregando
  class VPVV entregando
```

## Leitura

Os 6 bug(s) deste contexto estão em `delivering`: corrigidos, testes verdes, veredito de
spec registrado, aguardando merge e publicação. Nenhum `DONE.md` foi gravado, porque a
closure policy `package` não está satisfeita.

O contexto inteiro conta uma história só: os dois builders Studio evoluíram em paralelo e
cada correção ficou de um lado. JZNJ e S3TX eram a mesma política invertida em arquivos
diferentes. F74X é a mesma assimetria uma camada acima, no contrato de reordenação. ADQX
apareceu na reprodução do F74X e o bloqueava, e a aresta `blocked-by` sai sólida porque isso
foi medido, não suposto: sem a correção dele o Salvar recusava em deck gerado.

As duas arestas de F74X para JZNJ e S3TX continuam tracejadas de propósito. São leitura de
padrão, não evidência causal: a reprodução confirmou a causa do F74X sem precisar delas.

**Não coberto por nenhum destes seis:** o `mira-studio-full` tem o mesmo defeito do F74X em
deck gerado, medido nesta sessão e sem bug próprio.
