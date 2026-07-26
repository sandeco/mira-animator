---
name: mira-copywriter
description: >
  Diretor criativo que refina o plano de slides do /mira-planner: reescreve títulos,
  descrições e conteúdo com técnicas de copywriting e avalia/melhora as imagens, chamando
  /mira-visuals para gerar as que faltam. Use SEMPRE que o /mira-planner terminar de gerar
  um plano, ou quando o usuário quiser melhorar o texto de uma apresentação, refinar as
  frases dos slides, aplicar copywriting, ou reescrever conteúdo de slides para ficar mais impactante.
---

# Skill: Copywriter de Slides

## Objetivo

Transformar o plano de slides do `/mira-planner` em conteúdo de alto impacto, refinando cada slide em três dimensões: texto (copywriting), visual (seleção e criação de imagens) e narrativa (arco da apresentação).

## Quando esta skill é chamada

1. **Automaticamente** pelo `/mira-planner` após gerar o plano aprovado
2. **Manualmente** pelo usuário para refinar slides existentes

## Principios de Copywriting para Slides

Slides não são artigos. Cada card tem 3-5 segundos para capturar atenção e funciona como um outdoor: impacto imediato, sem ambiguidade.

### Regras fundamentais

1. **Títulos como manchetes.** Cada título deve provocar curiosidade ou entregar um insight. "Requisitos do Sistema" vira "O Que Seu Sistema Realmente Precisa"; "Comparativo de Custos" vira "Onde Seu Orçamento Sangra".

2. **Números antes de palavras.** "O custo aumenta muito" é fraco; "O custo sobe 10x após o deploy" é forte. Havendo dados, lidere com o número.

3. **Verbos de ação, não de estado.** "A arquitetura é modular" é passivo; "Quebre sua arquitetura em módulos" é ativo. Prefira imperativos e verbos de movimento.

4. **Uma ideia por card.** Se o card precisa de "e também", divida em dois. O slide que tenta dizer tudo não diz nada.

5. **Subtítulos que completam.** O subtítulo não repete o título; adiciona contexto: quem, quando ou a consequência.

6. **Frases curtas.** Descrições de slide com no máximo 2 linhas. Se precisar de mais, o visual (tabela, gráfico, lista) carrega a informação.

7. **Gancho emocional.** Ao menos o primeiro e o último card devem provocar reação: surpresa, medo de ficar para trás ou desejo de agir.

## Fluxo de Execução

### Passo 1: Receber o plano

Do `/mira-planner`, receba:
- Lista de slides com template, conteúdo resumido e fonte no capítulo
- Imagens existentes em `decks/<deck>/assets/`
- Vídeo escolhido para o header

### Passo 2: Analisar o arco narrativo

Avalie a sequência de slides como uma história:

```
ABERTURA (slides 1-2)     → Problema ou dado impactante que gera curiosidade
DESENVOLVIMENTO (slides 3-N) → Conceitos, dados, comparativos que constroem o argumento
CTA (slide meio)          → Chamada para acao (ja obrigatorio pelo planejador)
CLIMAX (penultimo slide)  → Insight principal ou conclusao forte
FECHAMENTO (ultimo slide) → Resumo visual ou proximos passos
```

Se a sequência do planejador não segue esse arco, reorganize os slides (sem alterar os templates escolhidos, apenas a ordem e o conteúdo).

### Passo 3: Reescrever cada slide

Para cada slide, produza uma versão refinada:

```
## Slide N: [Titulo Original] → [Titulo Reescrito]
- **Template:** card_XXXX.html (manter o do planejador)
- **Titulo do card:** [frase de impacto, max 8 palavras]
- **Subtitulo:** [contexto complementar, max 12 palavras]
- **Conteudo:** [texto refinado, dados formatados, listas com bullets impactantes]
- **Icone Lucide:** [escolha intencional que reforce o conceito]
- **Imagem:** [existente em decks/<deck>/assets/ | a gerar via /mira-visuals | nenhuma]
- **Nota de copy:** [justificativa curta da escolha criativa]
```

### Técnicas por tipo de card

| Template | Técnica de copy |
|----------|----------------|
| `card_lista` | Cada bullet começa com número ou verbo de ação. Primeiro item é o mais impactante |
| `card_grid` | Títulos dos itens em 2-3 palavras. Descrições em 1 linha. Contraste entre itens |
| `card_tabela` | Headers claros e curtos. Destaque visual na coluna/linha mais reveladora |
| `card_code` | Comentário do arquivo deve ser provocativo, não técnico ("O código que muda tudo") |
| `card_citacao` | Citações reais com fonte. Se não houver, criar frase de efeito atribuída ao conceito |
| `card_d3` | Título deve antecipar a conclusão do gráfico ("Custo dispara após fase 3") |
| `card_timeline` | Cada etapa com verbo no infinitivo. Progresso visível de simples para complexo |
| `card_destaques` | Títulos curtos e comparação clara: "Sem processo" vs "Com processo" |
| `card_imagem` | Legenda que conta uma história, não descreve ("O momento em que tudo muda") |
| `card_video_bg` | Título grandioso, conteúdo minimalista. O vídeo faz o trabalho emocional |
| `card_progresso` | Percentuais que chocam. Labels que revelam o que o número significa |
| `card_cta` | Urgência sem desespero. Benefício claro. Um único verbo de ação no botão |

### Passo 4: Avaliar e melhorar as imagens

Para cada slide que usa ou poderia usar imagem:

1. **Imagem existente em `decks/<deck>/assets/`?** Avalie se é a melhor opção para o slide refinado. Se o novo ângulo de copy pede outra imagem, anote.

2. **Imagem necessária mas inexistente?** Gere um briefing para o `/mira-visuals`:
   - Descreva o conceito visual desejado
   - Indique se deve ser fullwidth (diagrama/gráfico) ou título NS5 (foto/cena)
   - Sugira o pipeline (Gemini para fotos, D3 para diagramas)
   - Indique o nome do arquivo de destino

3. **Card sem imagem que ganharia com uma?** `card_imagem` e `card_video_bg` funcionam melhor com visual forte. Se o conteúdo pede, sugira criação.

### Passo 5: Apresentar o plano refinado

Formate como tabela comparativa (antes/depois):

```
# Plano Refinado: [Nome do Capitulo]

## Mudancas principais
- [resumo das 3-5 maiores mudancas de copy]
- [imagens adicionadas/substituidas]
- [reordenacao de slides, se houver]

| # | Titulo Original | Titulo Refinado | Template | Imagem |
|---|----------------|-----------------|----------|--------|
| 1 | Requisitos     | O Que Realmente Importa | card_grid | existente |
| 2 | Custos         | Onde o Dinheiro Vai | card_d3 | a gerar |
| ... | | | | |

## Imagens a gerar (via /mira-visuals)
1. [descricao] → `decks/<deck>/assets/nome-arquivo.png`
2. ...
```

Pergunte ao usuário:
- "Refinei o conteúdo dos **XX slides**. As mudanças principais são: [lista]. Aprova?"
- "Identifiquei **X imagens** que precisam ser criadas. Posso chamar o /mira-visuals?"

### Passo 6: Modo sem feedback

Se o usuário pediu "sem feedback", "direto", "sem confirmação" ou similar:
- Aplique o refinamento sem apresentar para aprovação
- Chame o `/mira-visuals` automaticamente para imagens faltantes
- Passe o plano refinado direto para o `/mira-builder`

## Exemplo de transformação

**Antes (planejador):**
```
Slide 3: Custo de Mudanca
- Template: card_d3.html
- Conteudo: Grafico mostrando que o custo de mudanca aumenta ao longo das fases
- Icone: trending-up
```

**Depois (copywriter):**
```
Slide 3: O Preco de "Depois A Gente Arruma"
- Template: card_d3.html
- Titulo: O Preco de Mudar Tarde
- Subtitulo: Cada fase adiada multiplica o custo por 10x
- Conteudo: Grafico D3 com curva exponencial, eixo X = fases do projeto,
  eixo Y = custo relativo. Destaque visual na fase de manutencao (pico)
- Icone: flame
- Imagem: nenhuma (o D3 e o visual principal)
- Nota de copy: Trocamos "trending-up" por "flame" porque fogo comunica
  urgencia. O titulo usa uma frase que todo dev ja ouviu para criar identificacao.
```

## Integração no pipeline

```
/mira-planner → /mira-copywriter → /mira-builder → /mira-validator
```

O copywriter NÃO altera templates nem quantidade de slides (exceto se justificado por reorganização narrativa). Refina o conteúdo textual e visual dentro da estrutura definida pelo planejador.
