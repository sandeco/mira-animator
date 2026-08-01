<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-07-31T22:40:00Z a partir de 4 bugs -->

# Grafo de relações · templates-studio

## Mermaid

Nenhuma aresta `supported` ou `confirmed` no registro. Todas as seis são `proposed` e
aparecem tracejadas.

```mermaid
graph LR
  S3TX["#2 S3TX<br/>studio-full apaga slides<br/>critical · P0 · open"]
  JZNJ["#1 JZNJ<br/>builder descarta o palco<br/>critical · P1 · open"]
  OI56["#3 OI56<br/>esqueleto sem @MIRA<br/>high · P1 · open"]
  RNYU["#8 RNYU<br/>falas de demonstração vazam<br/>medium · P2 · open"]
  K4NR["#4 K4NR<br/>validador vê section em comentário<br/>high · P1 · open<br/>(mira-fast)"]
  VPVV["#5 VPVV<br/>capa vira câmera<br/>high · P1 · open<br/>(mira-fast)"]

  S3TX -.related-to.- JZNJ
  RNYU -.related-to.- JZNJ
  VPVV -.related-to.- JZNJ
  JZNJ -.related-to.- OI56
  OI56 -.related-to.- K4NR

  classDef aberto fill:#2a1416,stroke:#c0392b,color:#f5f5f5
  classDef medio fill:#2a2413,stroke:#c8a02c,color:#f5f5f5
  classDef externo fill:#1a1a22,stroke:#7f8c8d,color:#cfcfcf
  class S3TX,JZNJ,OI56 aberto
  class RNYU medio
  class K4NR,VPVV externo
```

## Clusters

**Cluster único, agora com 11 bugs em dois contextos: a geração de decks Studio pelo
`/mira-fast`.** Depois do pente-fino de 2026-07-31, o cluster tem três famílias, não duas.

1. **Contrato de esqueleto (OI56, K4NR, BNO4)**: o esqueleto herdado do template não passa
   no validador, e o validador reage a texto que menciona `<section>`. Falha alta e
   explícita, na hora.
2. **Contrato de ids e envoltórios (JZNJ, S3TX, VPVV, UDTY, AMOM)**: o que a Fase 2 escreve
   é descartado ou mal envolvido pelo runtime do template. Falha silenciosa, descoberta na
   gravação.
3. **Ciclo de vida do `roteiro.md` e das falas (JJ6X, RNYU)**: o arquivo governa os slides
   numa direção e é destruído na outra, e as falas do plano não alcançam o `file://`.

O nó de maior grau é o **JZNJ**, com quatro arestas. Não é o culpado de nada: é o ponto onde
o runtime do template e o contrato do `/mira-fast` se encontram, e por isso quase todo
defeito da área passa por ele.

**Ordem de ataque sugerida**, do relatório da varredura:

1. OI56 e K4NR: sem eles não existe deck Studio gerado do zero para reproduzir o resto.
2. VPVV, UDTY, AMOM juntos: contrato e validador na mesma correção, senão o contrato
   corrigido volta a divergir.
3. S3TX, o mais destrutivo e o único que atinge `file://`; depois JZNJ.
4. JJ6X e RNYU, que são independentes e podem ir em paralelo.

## Impact score

`causados*3 + bloqueados*2 + regressões*4 + relacionados*1`, contando só arestas
`supported` e `confirmed`, com o peso de `related-to` limitado a 3.

| # | ID | impact score | arestas contadas |
|---|---|---|---|
| 2 | S3TX | 0 | nenhuma |
| 1 | JZNJ | 0 | nenhuma |
| 3 | OI56 | 0 | nenhuma |
| 8 | RNYU | 0 | nenhuma |

Todos zerados: as seis arestas do registro estão em `proposed` e relação proposta não
pontua, por invariante. O score só passa a significar algo depois que o
`/reversa-debugger-fix` promover ou rejeitar as arestas com evidência.

Enquanto isso, ordene por `severity` e `priority`. Se quiser um desempate por conectividade,
o JZNJ é o nó mais central do grafo, mas isso é topologia, não impacto medido.
