---
name: mira-animated-metaphor
description: >-
  Fundida no mira-animator (v0.1.48), mantida como atalho compatível porque está citada em material publicado. Transforma a animação de um slide (ou de todos) numa METÁFORA visual animada: uma analogia concreta do cotidiano animada no padrão do mira-animator, substituída no lugar (mantém título, subtítulo e pílulas). Use SEMPRE que o usuário disser "/mira-animated-metaphor", "metáfora animada", "transforma em metáfora", "cria uma analogia", "anima como analogia", "transforma os slides em metáforas", "vira metáfora", "quero uma metáfora pra esse conceito", "anima essa ideia como analogia", "metáfora visual", ou pedir para reexpressar um conceito como comparação animada, no deck inteiro ou num slide específico.
---

# Skill: Metáfora Animada (fundida no mira-animator)

Esta skill foi **fundida no `mira-animator`** na v0.1.48. A metáfora deixou de ser uma etapa separada e virou o núcleo do animator: MIRA é Metáforas Inteligentes Responsivas Animadas, então toda animação que sai do Mira já é metáfora.

Ela continua aqui como **atalho compatível**, porque está citada em material publicado. Não há regra própria neste arquivo, e nada deve ser escrito aqui: a fonte da verdade é única.

## O que fazer quando esta skill for acionada

1. Leia `agents/mira-animator/SKILL.md` na íntegra.
2. Execute o **Modo SUBSTITUIR**, que é exatamente o comportamento desta skill: roda o método da metáfora e troca a animação do slide no lugar, mantendo título, subtítulo e pílulas, e reinicia o marcador para `<!-- @MIRA:SIZE 3/10 -->`.
3. Escopo: slide indicado (número do card, título ou id do stage) → só aquele. Sem indicação → todos os slides animados do deck.
4. Reporte slide a slide no formato `conceito → metáfora (loop em uma frase)`.

Para criar um slide animado novo em vez de substituir um existente, use o `mira-animator` direto (Modo CRIAR).

## Nota de manutenção

Toda evolução de metáfora animada acontece em `agents/mira-animator/SKILL.md`. Este arquivo será removido quando o material publicado que o cita for atualizado.
