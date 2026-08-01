<!-- GENERATED, DO NOT EDIT: regenerado por /reversa-debugger-graph em 2026-07-31T23:55:00Z a partir de 7 bugs -->

# Matriz BUG ↔ SPEC · mira-fast

Spec efetiva = original + adendos vigentes. **Um adendo vigente desde 2026-07-31:**
`_reversa_sdd/addenda/bug-BUG-20260731-K4NR-v001.md`.

| seção de spec | open | active | resolved |
|---|---|---|---|
| `mira-fast/sdd/01-invocacao-e-formatos.md#r7-montagem-do-esqueleto-do-deck` | — | — | — |
| `mira-fast/sdd/03-fase-1-plano.md#r9-especificidade-por-formato` | VPVV, UDTY | — | — |
| `mira-fast/sdd/04-fase-2-enxame.md#r6-contrato-de-saida-rigido` | AMOM | BNO4 | — |
| `mira-fast/sdd/04-fase-2-enxame.md#r9-ondas-e-falhas` | — | BNO4 | — |
| `mira-fast/sdd/05-fase-3-montagem.md#r1-validacao-estrutural-antes-de-concatenar-rf09` | AMOM | K4NR, BNO4 | — |
| `mira-fast/sdd/05-fase-3-montagem.md#r4-modulos-de-autoria-rf11-diretiva-do-claudemd` | ETPU | — | — |
| `mira-fast/sdd/05-fase-3-montagem.md#r5-titulo-da-capa-rf12-diretiva-do-claudemd` | VPVV | — | — |
| `mira-fast/sdd/05-fase-3-montagem.md#r6-raiz-limpa-c3-diretiva-do-claudemd` | ETPU | — | — |
| `mira-fast/sdd/05-fase-3-montagem.md#r7-roteiromd-do-mira-studio-full-rf17` | JJ6X | — | — |
| `mira-fast/sdd/05-fase-3-montagem.md#r7b-a-pasta-de-trabalho-permanece` | JJ6X | — | — |
| `sdd/enquadramento-seguro-de-plataforma.md` | UDTY | — | — |
| **`addenda/bug-BUG-20260731-K4NR-v001.md#r1d`** (novo) | — | K4NR, BNO4 | — |
| **spec-gap** | — | K4NR *(resolvido pelo adendo)* | — |

## Leitura

**A seção mais atingida é `05-fase-3-montagem.md#R1`**, com três bugs. É a seção que define
a validação estrutural antes de concatenar, e os três apontam para o mesmo tipo de falha:
ela especifica oito checagens sobre os **fragmentos** e nada sobre o **esqueleto** nem sobre
a saída final. Tudo que roda fora dos fragmentos existe só no código. É a lacuna que
explica K4NR, BNO4 e a assimetria do AMOM ao mesmo tempo.

**Duas seções aparecem em dupla no mesmo bug**, o que é sinal de conflito e não de simples
violação:

- JJ6X toca R7 (o `roteiro.md` é a fonte da verdade, feito para o usuário editar) e R7b (a
  pasta de trabalho nunca é apagada). O código honra R7b com cuidado e atropela R7 sem
  cerimônia. A spec nunca disse o que acontece na **segunda** montagem, e é exatamente aí
  que o arquivo morre.
- ETPU toca R4 (o que copiar para o deck) e R6 (raiz limpa). Nenhuma das duas prevê o estado
  intermediário que a falha produz: raiz com launcher e sem deck.

**Uma seção sem bug nenhum e ainda assim relevante**:
`01-invocacao-e-formatos.md#r7-montagem-do-esqueleto-do-deck` aparece na tabela sem bugs
porque o BUG-20260731-OI56, que a cita, vive no contexto `templates-studio`. Ver a
spec-matrix de lá.

**Lacuna declarada, agora parcialmente fechada.** O K4NR carregava `spec-gap` e o veredito
humano de 2026-07-31 confirmou o rótulo: as regras de esqueleto e de saída existiam só no
código. O adendo `bug-BUG-20260731-K4NR-v001.md` as especifica pela primeira vez, em R1b,
R1c e R1d.

O que o adendo **não** fecha, e continua valendo como lacuna: quem é o dono dos blocos
`@MIRA:THEME` e `@MIRA:RESPONSIVE`. Ele diz que o esqueleto precisa tê-los quando chega à
Fase 3 (E2 e E3), não quem os cria. Essa pergunta é do BUG-20260731-OI56, no contexto
`templates-studio`, e segue aberta.

O **AMOM** continua apontando para `05#R1` e `04#R6` sem rótulo de `spec-gap`, e com razão:
a spec tem o que dizer sobre o comportamento esperado dele (o contrato de saída prescreve
`.anim-stage` e o id do svg). O defeito ali é o validador não cobrar o que o contrato já
manda, não a ausência de contrato.

## Adendos

| adendo | vigente desde | tipo | bugs |
|---|---|---|---|
| [`bug-BUG-20260731-K4NR-v001.md`](../../../_reversa_sdd/addenda/bug-BUG-20260731-K4NR-v001.md) | 2026-07-31 | aditivo | K4NR (`spec-gap`), citado por BNO4 |

Conteúdo: R1b (validação do esqueleto, E1 a E8), R1c (validação da saída como defesa em
profundidade), **R1d (o que conta como elemento `section`, única mudança normativa)** e R1e
(o acordo entre validador e montagem, registro do que `04#R6` e `#R9` já diziam).

A spec original não foi tocada. Correção futura entra como `v002`.
