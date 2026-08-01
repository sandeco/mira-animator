---
name: mira-ultrafast
description: Cria decks Mira, Studio, Studio Full e Vertical com planejamento e folhas sobrepostos, instrumentação e montagem determinística.
---

# Mira Ultrafast

Produz o mesmo contrato visual e estrutural do `/mira-fast`, removendo trabalho determinístico dos agentes.

## Motor obrigatório

**ORDEM ABSOLUTA:** a primeira ação é criar, de uma vez, a pasta do deck e toda a árvore interna. Antes de mensagem intermediária, validação de fonte, leitura, memória, planejamento, pergunta ou workflow, resolva `deck_id = YYYY-MM-DD <slug>` e crie `decks/<deck_id>/`, `references/`, `assets/`, `assets/vendor/`, `mira/` e `mira/fast/`. Nenhuma pasta fica para depois.

1. Resolva o slug e crie essa estrutura completa na sessão principal. Nenhuma outra ação pode vir antes.
2. Informe o caminho absoluto de `references/`, sem pausar.
3. Invoque o workflow `.claude/workflows/mira-ultrafast-engine.js` com um objeto estruturado contendo os argumentos originais, `slug`, `deck_dir` absoluto e o `formato` solicitado. O workflow recusa executar se qualquer pasta da Fase Zero estiver ausente.
4. Não emule o workflow. Sem workflow, falhe com `MIRA_ULTRAFAST_PARALLELISM_UNAVAILABLE`.
5. Após sucesso, rode `node .claude/skills/mira-ultrafast/scripts/assemble-run.mjs "<deck_dir>"` e abra o `arquivo_saida` retornado.

Formatos aceitos: `mira`, `mira-studio`, `mira-studio-full` e `mira-vertical`. Sem formato explícito, use `mira`; formato desconhecido falha, nunca é inferido pelo tema.

## Invariantes

- N slides geram N folhas; cada folha escreve somente `slide-NN.html` e `result-NN.json`.
- Capa, card, CTA e encerramento são estáticos; metáforas são animadas.
- A ordem final é `slides[].n`; retries são sequenciais e limitados a dois.
- Plano, fragmentos e saída têm escritores exclusivos.
- Nunca apague `mira/fast/` nem material em `references/`. O único arquivo Mira nessa pasta é `quadro-metaforas.md`.
- Não há agente de montagem.
- Toda animação usa CSS variables, pt-br, `@MIRA:SIZE 5/10`, coreografia e loop perpétuo.

## Artefatos

O motor escreve `mira/fast/{esqueleto.html,plano.json,timings.json,slide-NN.html,result-NN.json}`. O quadro é renderizado deterministicamente a partir do plano. A montagem instala, nesta ordem, `mira-edit.js`, `mira-edit-free.js`, `mira-draw.js`.

Compare desempenho pela mediana de três execuções na mesma máquina e modelo.
