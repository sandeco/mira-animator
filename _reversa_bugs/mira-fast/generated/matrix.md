<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-07-31T23:55:00Z a partir de 7 bugs -->

# Matriz de relações BUG ↔ BUG · mira-fast

## Arestas canônicas gravadas neste contexto

| origem | tipo | destino | contexto do destino | state | evidência |
|---|---|---|---|---|---|
| BNO4 | related-to | K4NR | mira-fast | **supported** | mesmo deck reproduz os dois; a mesma função corrige os dois |
| BNO4 | related-to | ETPU | mira-fast | **supported** | a falha do BNO4 é o que expõe a instalação parcial do ETPU |
| VPVV | related-to | JZNJ | **templates-studio** | proposed | nenhuma |
| UDTY | related-to | VPVV | mira-fast | proposed | nenhuma |
| AMOM | related-to | UDTY | mira-fast | proposed | nenhuma |

Sem aresta própria: K4NR, JJ6X, ETPU.

## Arestas que chegam de outro contexto

| origem | contexto da origem | tipo | destino | state |
|---|---|---|---|---|
| OI56 | templates-studio | related-to | K4NR | proposed |

## Arestas derivadas

| origem | tipo | destino | derivada de |
|---|---|---|---|
| K4NR | related-to | BNO4 | aresta em BNO4 (**supported**) |
| ETPU | related-to | BNO4 | aresta em BNO4 (**supported**) |
| JZNJ | related-to | VPVV | aresta em VPVV (cruza contexto) |
| VPVV | related-to | UDTY | aresta em UDTY |
| UDTY | related-to | AMOM | aresta em AMOM |
| K4NR | related-to | OI56 | aresta em OI56 (cruza contexto) |

## Promoções de 2026-07-31

Duas arestas saíram de `proposed` durante a correção do K4NR e do BNO4. As duas eram
hipótese de parentesco levantada no registro; passaram a ter evidência.

| aresta | antes | depois | o que virou evidência |
|---|---|---|---|
| BNO4 → K4NR | proposed | supported | a cápsula de reprodução monta um deck que dispara os dois defeitos, e a mesma função (`countSections`) corrige os dois. Causa raiz idêntica, confirmada por execução. |
| BNO4 → ETPU | proposed | supported | ao provocar a falha do BNO4 num deck limpo, módulos, servidor, launcher e vendor apareceram instalados sem `index.html`. A falha de um é o gatilho observável do outro. |

Nenhuma aresta foi rejeitada. A relação **OI56 ↔ K4NR** continua `proposed`: os dois
coocorrem na mesma execução falha da Fase 3, mas a investigação não produziu evidência de
vínculo causal, e coocorrência não é parentesco.

## Clusters

### Cluster A: contrato de formato incompleto (VPVV, UDTY, AMOM)

Corrente `AMOM ── UDTY ── VPVV ── JZNJ`, todas as arestas ainda `proposed`. Os três nascem em
`agents/mira-fast/references/formato-mira-studio.md`. Intocado por esta correção.

### Cluster B: `<section>` como texto (K4NR, BNO4) mais o efeito colateral (ETPU)

`ETPU ── BNO4 ── K4NR`, agora com as duas arestas `supported`. **K4NR e BNO4 foram corrigidos
em 2026-07-31**; o ETPU continua aberto e é o único do cluster que sobra.

Isso muda a leitura do cluster: a causa estrutural foi tratada num único ponto
(`countSections` em `validate-run.mjs`), e o que resta é a consequência operacional, que
existe independentemente do gatilho.

### Isolado: JJ6X

Sem relação. Intocado.
