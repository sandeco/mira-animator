---
name: mira-planner
description: >-
  Planeja o conteúdo de apresentações em slides HTML: analisa um capítulo (LaTeX, PDF ou texto) e gera um plano de slides antes da montagem visual. Use SEMPRE que a skill /mira-builder for acionada, ou quando o usuário quiser planejar o conteúdo de uma apresentação, definir quantos slides criar, ou revisar a estrutura antes de gerar o HTML.
---

# Skill: Planejador de Conteúdo para Slides

## Objetivo

Analisar o conteúdo-fonte de um capítulo e produzir um plano estruturado de slides que será usado pela skill `/mira-builder` para montar o HTML final. O plano garante que o conteúdo seja bem distribuído, visualmente variado e aprovado pelo usuário antes da geração.

## Quando esta skill é chamada

1. **Automaticamente** pela `/mira-builder` antes de gerar qualquer HTML
2. **Diretamente** pelo usuário quando quer planejar uma apresentação

## Fluxo de Execução

### Passo 1: Identificar a fonte de conteúdo

Localize o conteúdo do capítulo. As fontes possíveis são:
- `decks/<deck>/briefing.md` (gerado pelo /mira-extract a partir de uma fonte vinculada — PREFERENCIAL)
- Arquivo apontado diretamente pelo usuário (LaTeX, PDF, Markdown ou texto)
- PDF do capítulo na raiz do projeto
- Texto fornecido diretamente pelo usuário

Leia o conteúdo completo para entender os temas, seções e subseções.

### Passo 2: Inventariar os assets visuais

1. **Imagens:** Liste as imagens disponíveis em `decks/<deck>/assets/` e as sugeridas no briefing
2. **Vídeos:** Leia `video_lista.md` (dentro da skill `/mira-builder`) e selecione:
   - 1 vídeo para o header (o mais adequado ao tema do capítulo)
   - 0-3 vídeos opcionais para cards internos (os menos distrativos)
3. **Imagens faltantes:** Identifique se algum slide precisa de uma imagem que não existe. Anote para que a `/mira-builder` possa chamar a `/mira-visuals`

### Passo 3: Gerar o plano de slides

Para cada slide proposto, defina:

```
## Slide N: [Titulo do Slide]
- **Template:** card_XXXX.html
- **Conteudo resumido:** 2-3 frases descrevendo o que vai no slide
- **Dados visuais:** icone Lucide, imagem, video, grafico D3 (se aplicavel)
- **Fonte no capitulo:** secao/subsecao de onde vem o conteudo
```

### Regras de composição

- **Quantidade:** Sugira entre 8 e 20 slides, proporcional ao tamanho do capítulo
- **Variedade:** Use pelo menos 4 tipos diferentes de template
- **Ritmo:** Alterne entre cards densos (tabela, código, D3) e cards leves (citação, imagem, CTA)
- **Sequência proibida:** Nunca 2 cards do mesmo tipo seguidos
- **CTA obrigatório:** Posicione um `card_cta.html` entre os slides 4-8
- **Abertura forte:** O primeiro card deve ser impactante (grid com números, citação marcante, ou D3)
- **Fechamento forte:** O penúltimo card deve ser um resumo ou conclusão visual

### Templates disponíveis

| Template | Quando usar |
|----------|------------|
| `card_lista.html` | Estatísticas, listas com números |
| `card_grid.html` | Grids de 2-4 itens, categorias |
| `card_destaques.html` | Comparativos lado a lado (2-3 opções) |
| `card_timeline.html` | Cronogramas, processos sequenciais |
| `card_tabela.html` | Dados tabulares, comparações detalhadas |
| `card_code.html` | Trechos de código, comandos |
| `card_imagem.html` | Destaque de uma imagem com legenda |
| `card_citacao.html` | Citações, frases de impacto |
| `card_progresso.html` | Barras de progresso, métricas % |
| `card_cta.html` | Chamada para ação (livro, canal, etc.) |
| `card_d3.html` | Gráficos interativos D3.js |
| `card_video_bg.html` | Card com vídeo de fundo |

### Passo 4: Apresentar o plano ao usuário

Formate o plano como uma tabela resumida e apresente ao usuário:

```
# Plano de Slides: [Nome do Capitulo]

**Video header:** [N].mp4 - [descricao]
**Total de slides:** XX

| # | Titulo | Template | Conteudo Resumido |
|---|--------|----------|-------------------|
| 1 | ...    | card_grid | ... |
| 2 | ...    | card_lista | ... |
| ... | | | |
```

Pergunte ao usuário:
- "Este plano tem **XX slides**. Quer ajustar a quantidade?"
- "Quer trocar algum tipo de card ou reorganizar a ordem?"
- "Posso prosseguir com a geração?"

### Passo 5: Modo sem feedback

Se o usuário pediu para criar "sem feedback", "direto", "sem confirmação", "crie tudo", ou expressão similar:
- **Gere o plano normalmente** (ele é necessário para a qualidade do output)
- **NÃO apresente ao usuário** para aprovação
- **Prossiga direto** para o `/mira-copywriter` com o plano pronto
- Neste modo, use as regras de composição como guia autônomo

### Passo 6: Refinamento de Copy (OBRIGATÓRIO)

Após o plano ser aprovado (ou gerado em modo sem feedback), **chame a skill `/mira-copywriter`** para refinar títulos, descrições e seleção de imagens antes de passar para o `/mira-builder`.

## Saída

O plano é um documento intermediário, não salvo em arquivo: passa para o `/mira-copywriter` (refinamento) e depois para a `/mira-builder` (contexto de geração). Deve conter:

1. Vídeo escolhido para o header
2. Lista ordenada de slides com template + conteúdo
3. Imagens a usar (existentes e a gerar)
4. Vídeos adicionais para cards internos (se houver)
