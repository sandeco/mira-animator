# Schema do MIRA Motion Score

## Sumário

1. Cartão da cena
2. Beat de timeline
3. Testes

## 1. Cartão da cena

```text
scene_id:
purpose:
audience_in:
audience_out:
temperamento:          sereno | natural | tenso, com ciclo, beats e repouso
dominant_verb:
initial_frame:
scene_graph:           atores com id, papel e plano
camera:                cues escolhidos, com razão de cada um
timeline:
internal_loop:
exit_transition:
stack:                 D3 com SVG, mira-cinema.js, CSS 3D
grade:                 preset do deck
responsive_rules:      16:9, 1:1, 9:16, terços
performance_budget:
reduced_motion:
fallback:              como a cena fica sem câmera, planos e grade
fidelity_constraints:
```

## 2. Beat de timeline

| Campo | Uso |
|---|---|
| `label` | posição na timeline, por nome. Nunca delay acumulado |
| `duration_ms` | Duração |
| `target` | `id` semântico do ator |
| `action` | Verbo ou mudança de estado |
| `from` | Estado inicial explícito |
| `to` | Estado final explícito |
| `easing` | Comportamento percebido, dentro da família do temperamento |
| `enquadramento` | Cue de câmera com razão narrativa, quando houver |
| `plano` | Plano de profundidade do ator, e onde ocorre a oclusão |
| `luz` | 🟡 planejado. Fica vazio enquanto a luz de cena não existir |
| `sync_anchor` | Palavra, pausa ou evento da narração ao vivo |
| `narrative_function` | Orientar, antecipar, agir, resistir, impactar, revelar, acomodar, sair |
| `cleanup` | Recurso, timer ou listener a liberar |

## 3. Testes

- estado em `t = 0` é reproduzível;
- a mesma seed produz o mesmo quadro, medido com a timeline pausada;
- Replay não duplica execução, listeners nem nós;
- o loop fecha sem salto perceptível;
- há uma janela contínua de 1 s sem evento focal no ciclo;
- nenhum cue de câmera sem razão, e o teto do temperamento é respeitado;
- reduced motion preserva informação e ordem;
- o fallback sem câmera, sem planos e com grade `neutra` mantém ação e payoff;
- texto permanece legível durante a câmera, com os fixos marcados;
- a transição termina no primeiro quadro válido da próxima cena;
- o deck abre por `file://` com duplo clique.
