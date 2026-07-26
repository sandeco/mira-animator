---
name: mira-validator
description: Valida o HTML gerado pela /mira-builder, checando conformidade visual, estrutural e de assets. Use SEMPRE que a /mira-builder terminar de gerar um index.html, ou quando o usuário quiser verificar a qualidade de uma apresentação existente, revisar se os slides seguem o padrão, ou diagnosticar problemas visuais em slides já criados.
---

# Skill: Validador de Slides

## Objetivo

Inspecionar o `index.html` gerado pela `/mira-builder` e produzir um relatório de conformidade: estilo, assets, estrutura HTML e boas práticas do padrão do projeto. Chamada automaticamente pela `/mira-builder` após gerar o HTML, ou manualmente para validar uma apresentação existente.

## Fluxo de Execução

### Passo 1: Localizar o arquivo

Identifique o `index.html` a validar:
- Chamado pela `/mira-builder`: caminho conhecido `decks/<deck>/index.html`
- Chamado pelo usuário: pergunte qual capítulo ou aceite o caminho direto

### Passo 2: Ler o HTML completo

Leia o `index.html` inteiro.

### Passo 3: Executar as verificações

Execute cada verificação abaixo e registre PASS ou FAIL com detalhes.

---

## Checklist de Verificações

### A. Cores (crítico)

| # | Verificação | Como checar |
|---|------------|-------------|
| A1 | Cor primária é `#FF904D` | Buscar ocorrências de `#FF904D` (deve existir). Buscar `#FFA203` ou `#e47d5b` (não deve existir) |
| A2 | Fundo é `#000000` | Buscar `background: #000000` no body. Buscar `#222222` ou `#1a1a2e` (não deve existir) |
| A3 | rgba usa `255, 144, 77` | Buscar `rgba(255, 144, 77` (deve existir). Buscar `rgba(255, 162, 3` (não deve existir) |

### B. Identidade Visual (crítico)

| # | Verificação | Como checar |
|---|------------|-------------|
| B1 | Logo no header | Buscar `<img` com `canal_sandeco_logo.png` dentro do `<header>` |
| B2 | Logo no footer | Buscar `<img` com `canal_sandeco_logo.png` após o `</main>` |
| B3 | Arquivo logo existe | Verificar se `canal_sandeco_logo.png` existe na pasta do slide |
| B4 | Nenhum SVG genérico no lugar da logo | Buscar `<svg` próximo de "sandeco" ou "logo" (não deve existir) |

### C. Vídeos (crítico)

| # | Verificação | Como checar |
|---|------------|-------------|
| C1 | Vídeo no header | Buscar `<video` dentro do `<header>` com `src="header-bg.mp4"` |
| C2 | Arquivo header-bg.mp4 existe | Verificar se o arquivo existe na pasta do slide |
| C3 | Atributos obrigatórios | Todo `<video` deve ter `autoplay`, `loop`, `muted`, `playsinline` |
| C4 | Opacidade 50% | Todo `<video` deve ter `opacity: 0.5` ou `opacity-50` |
| C5 | Overlay gradient | Após cada `<video`, deve haver um `<div` com `linear-gradient` |

### D. Layout dos Cards (importante)

| # | Verificação | Como checar |
|---|------------|-------------|
| D1 | Largura `max-w-5xl` | Cards devem usar `max-w-5xl`. Buscar `max-w-3xl`, `max-w-2xl`, `max-w-6xl` em cards (não deve existir, exceto dentro de parágrafos `<p>` onde `max-w-3xl` é permitido) |
| D2 | Padding adequado | Cards devem usar `p-8` ou `p-10`. Buscar `p-16` em cards (não deve existir) |
| D3 | Gap entre cards | `<main>` deve ter `gap-[60vh]` |
| D4 | Glassmorphism | Deve existir `backdrop-filter: blur(10px)` no CSS |

### E. Tipografia (importante)

| # | Verificação | Como checar |
|---|------------|-------------|
| E1 | Fonte Inter | Buscar `fonts.googleapis.com` com `Inter` no `<head>` |
| E2 | Títulos de card | Títulos `<h3>` dentro de cards devem usar `text-3xl` ou `text-4xl`. Buscar `text-5xl` em `<h3>` (não deve existir) |
| E3 | Título principal | O `<h1>` do header pode usar `text-5xl` ou `text-7xl` (permitido) |

### F. Estrutura e Navegação (importante)

| # | Verificação | Como checar |
|---|------------|-------------|
| F1 | Barra de progresso | Buscar `id="reading-progress"` |
| F2 | Botão próximo card | Buscar `id="next-card"` |
| F3 | Botão começar no header | Buscar `id="header-next-btn"` |
| F4 | AOS inicializado | Buscar `AOS.init` |
| F5 | Lucide inicializado | Buscar `lucide.createIcons` |
| F6 | D3.js carregado | Buscar `d3.v7` no `<head>` (se houver cards D3) |
| F7 | setupFullScreenWrappers | Buscar `setupFullScreenWrappers` |

### G. Conteúdo e Composição (qualidade)

| # | Verificação | Como checar |
|---|------------|-------------|
| G1 | Mínimo de cards | Contar elementos `glass-card` ou cards dentro de `<main>`. Mínimo: 8 |
| G2 | Variedade de templates | Identificar tipos de cards usados. Mínimo: 3 tipos diferentes |
| G3 | CTA presente | Buscar indicadores de card CTA (botão de ação, link para livro/canal) |
| G4 | Sem cards repetidos em sequência | Verificar se não há 2 cards do mesmo tipo seguidos |
| G5 | Sem placeholders residuais | Buscar `[TITULO]`, `[DESCRICAO]`, `[DELAY]`, `[ICONE]` e outros placeholders não substituídos |
| G6 | Sem número de slides no header | Buscar `[DESTAQUE_NUMERICO]` (não deve existir) |

### H. Assets do Capítulo (importante)

| # | Verificação | Como checar |
|---|------------|-------------|
| H1 | Imagens referenciadas existem | Para cada `<img src="...">` no HTML, verificar se o arquivo existe na pasta |
| H2 | Vídeos referenciados existem | Para cada `<source src="...mp4">`, verificar se o arquivo existe na pasta |

### I. Segurança (importante)

| # | Verificação | Como checar |
|---|------------|-------------|
| I1 | Código escapado | Em blocos `<code>` ou `<pre>`, buscar `<` e `>` não escapados (exceto tags HTML internas). Deve usar `&lt;` e `&gt;` |

---

## Passo 4: Gerar o Relatório

Apresente o relatório neste formato:

```
# Relatorio de Validacao: [Capitulo]

**Arquivo:** decks/<deck>/index.html
**Data:** YYYY-MM-DD
**Total de verificacoes:** XX
**Passou:** XX | **Falhou:** XX | **Avisos:** XX

## Resultados

### Criticos (devem ser corrigidos)
- [FAIL] A1: Cor #FFA203 encontrada nas linhas 45, 112
- [PASS] B1: Logo presente no header

### Importantes (recomendado corrigir)
- [FAIL] D1: Card na linha 89 usa max-w-3xl em vez de max-w-5xl
- [PASS] E1: Fonte Inter carregada

### Qualidade (sugestoes)
- [WARN] G4: Cards 3 e 4 sao ambos card_lista
- [PASS] G1: 12 cards encontrados

## Correcoes Sugeridas

Para cada FAIL, indique:
1. **Linha(s):** onde esta o problema
2. **Atual:** o que esta escrito
3. **Correto:** o que deveria estar
4. **Como corrigir:** instrucao especifica de edicao
```

### Níveis de severidade

- **Crítico** (categorias A, B, C): Problemas visuais graves ou assets faltantes. Não publicar sem corrigir.
- **Importante** (categorias D, E, F, H, I): Desvios do padrão que afetam qualidade mas não impedem o uso.
- **Qualidade** (categoria G): Sugestões de composição e variedade.

## Passo 5: Oferecer correção automática

Após o relatório, pergunte:

> "Encontrei **X problemas**. Quer que eu corrija automaticamente os itens críticos e importantes?"

Se aceitar, aplique as correções no `index.html` com edições pontuais (Edit tool) e rode a validação de novo para confirmar.

## Notas

- NÃO modifica o conteúdo textual dos slides, apenas problemas técnicos e de conformidade
- Problema ambíguo (ex: card poderia ser lista ou grid): classifique como WARN, não FAIL
- Placeholders residuais (G5) são sempre FAIL crítico: indicam montagem incompleta
