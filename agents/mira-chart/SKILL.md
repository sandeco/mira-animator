---
name: mira-chart
description: >
  Especialista em gráficos de dados para slides do Mira. Recebe dados (CSV, JSON, TSV,
  tabela markdown, texto colado) ou imagens (print de gráfico, foto de quadro branco,
  rascunho à mão) e gera um gráfico D3.js; usa o tipo pedido ou recomenda a melhor
  visualização. Use esta skill SEMPRE que o usuário disser: "criar gráfico", "plotar",
  "gráfico de barras", "gráfico de linhas", "pizza", "scatter", "visualizar esses dados",
  "transformar esse CSV em gráfico", "recriar esse gráfico", "desenhei um gráfico",
  "fiz um rascunho", ou qualquer combinação de dados + gráfico/visualização.
  Para imagens que não são gráficos use /mira-visuals; para animar um gráfico pronto
  use /mira-animator.
---

# Skill: Mira Chart, dados viram gráficos com impacto

Porta de entrada única para gráficos de dados no Mira: pega o que o usuário tem (planilha, JSON, print, rascunho à mão) e devolve um gráfico D3.js bonito, leve e impactante, pronto para o deck.

## Regras herdadas (obrigatórias)

1. **Idioma**: siga `agents/_shared/idioma.md`. Todo texto visível revisado, acentuação 100% correta.
2. **Cores**: parta das CSS variables do tema do deck (`--mira-primary` etc.). Paletas de apoio podem vir dos schemes do D3 (`d3.schemeTableau10`, `d3.interpolateViridis`), sempre harmonizadas com o tema.
3. **Diretrizes D3**: consulte `agents/mira-animator/references/diretrizes-d3.md` (v7, padrão `join`, escalas comentadas).
4. **Output**: salve SEMPRE em `decks/<nome-do-deck>/assets/`. Nunca escreva em fontes vinculadas.

## Entradas aceitas

| Entrada | Como tratar |
|---|---|
| Arquivo CSV / TSV / JSON | Ler o arquivo, inspecionar colunas e tipos |
| Tabela markdown ou texto colado no chat | Converter para array de objetos |
| Print de gráfico existente | Ler a imagem, extrair valores, labels e eixos visíveis |
| Foto de rascunho à mão / quadro branco | Interpretar a intenção e reconstruir como gráfico real |
| Só uma descrição ("quero mostrar X por Y") | Pedir os dados ou gerar dados de exemplo claramente marcados |

## Workflow

**1. Entender os dados.** Classifique cada campo: categórico, temporal, quantitativo, hierárquico, relacional (rede/fluxo) ou geográfico. Note a cardinalidade (3 categorias pedem outro gráfico que 300).

**2. Definir o tipo de gráfico.**
- Se o usuário indicou o tipo: use-o. Se for uma má escolha para aqueles dados (ex.: pizza com 12 fatias), entregue o que foi pedido e avise em uma linha qual alternativa funcionaria melhor.
- Se não indicou: recomende 1 tipo principal e até 2 alternativas, cada um com justificativa de uma linha, usando a matriz de `references/galeria-d3.md`. Comece a gerar pelo principal sem esperar confirmação.

**3. Reconstrução a partir de imagem.** Quando a entrada é um print ou rascunho:
- Extraia da imagem: tipo de gráfico, séries, valores (lidos ou estimados), labels, títulos e unidades.
- Valores estimados devem ser informados ao usuário ("li 42, 67 e ~85 do seu rascunho").
- Rascunho à mão é um sonho, não uma especificação: mantenha a intenção (tipo, comparação, tendência) e eleve tudo o mais, com hierarquia, cores e acabamento que o desenho não tinha.

**4. Gerar o gráfico em D3 v7.** Escalas comentadas, eixos limpos, padrão `join`. SVG por padrão; Canvas só acima de ~5000 pontos.

**5. Entregar no modo certo:**

| Modo | Quando | Como |
|---|---|---|
| Slide interativo | O gráfico vai num deck Mira | Preencher `agents/mira-builder/templates/card_d3.html` |
| Imagem PNG | Uso fora do deck, export, thumbnail | HTML standalone + `node agents/mira-visuals/scripts/capture.cjs <in.html> <out.png> <w> <h>` |
| Animado | Usuário pediu animação | Gerar a versão estática aqui e encadear /mira-animator |

## Princípios de design (beleza, impacto, leveza)

1. **O dado é o herói.** Zero chartjunk: sem grades pesadas, sem 3D, sem sombras decorativas, sem moldura competindo com o gráfico.
2. **Um insight por gráfico.** Destaque a série ou o ponto que conta a história (cor primária no foco, neutros no resto). O título antecipa a conclusão, padrão do mira-copywriter.
3. **Labels diretos nos dados** quando couber, em vez de legenda separada. Números-chave em fonte grande.
4. **Cores que impressionam, não que gritam.** Base no tema do deck; gradientes sutis e glow apenas no elemento de destaque. Máximo de 6 cores categóricas; para mais que isso, agrupe em "outros" ou troque o tipo de gráfico.
5. **Leveza**: respiro generoso (margens internas), tipografia mínima de 28px em canvas 1920, eixos com poucos ticks e formatação humana (`d3.format('~s')`: 1.2M, não 1200000).
6. **Acessibilidade**: contraste alto e paletas seguras para daltonismo quando houver muitas categorias (`d3.schemeTableau10` em vez de arco-íris).

## Checklist final

- [ ] Tipo de gráfico adequado aos dados (ou aviso dado, se escolha do usuário)
- [ ] Valores estimados de imagem/rascunho informados ao usuário
- [ ] Texto revisado (idioma.md)
- [ ] Cores do tema do deck, destaque em no máximo 1 elemento
- [ ] Eixos limpos, números em formato humano
- [ ] Salvo em `decks/<deck>/assets/`
