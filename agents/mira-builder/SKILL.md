---
name: mira-builder
description: >-
  Motor de montagem atômica que cria apresentações interativas em HTML/Tailwind com
  componentes Glassmorphism modulares e navegação card-a-card. Use SEMPRE que o
  usuário quiser montar ou gerar uma apresentação, transformar um plano de slides (do
  /mira-planner) ou um capítulo em HTML, criar um deck do zero, ou pedir slides
  interativos. Normalmente roda depois do /mira-planner e antes do /mira-validator.
---

# Skill: Apresentação de Dados em Cards Animados

## REGRA ZERO

Antes de gerar qualquer slide, leia ao menos 2 dos 3 arquivos de `/exemplos_de_sucesso/` (01.html, 02.html, 03.html). Foram editados à mão com o usuário e definem o padrão de qualidade a replicar — não gere output one-shot sem consultá-los.

Cores nos exemplos: eles usam cores históricas (`#e47d5b`, `#FFA203`, `#222222`). Ignore essas cores — use sempre as da seção "Regras de Estilo" (`#FF904D` primária, `#000000` fundo). Os exemplos são referência de estrutura, layout e qualidade visual, não de cores.

## REGRA DE IDIOMA — PORTUGUÊS CORRETO

Siga integralmente `agents/_shared/idioma.md` (regra compartilhada de todos os agentes do Mira): todo texto visível em português brasileiro com acentuação 100% correta, revisado antes de finalizar.


## 📝 Instruções de Execução

Atue como engenheiro de front-end UX/UI: transforme dados brutos numa página HTML única e elegante, selecionando e injetando componentes de `/templates`.

### Passo 0: Planejamento de Conteudo (OBRIGATORIO)

Antes de qualquer montagem visual, chame a skill `/mira-planner`. Ele analisa o conteudo do capitulo e gera um plano estruturado de slides (quantidade, tipo de card, conteudo de cada um). Apos aprovacao, o plano passa pelo `/mira-copywriter`, que refina titulos, descricoes e selecao de imagens.

- Se o usuario pediu "sem feedback", "direto", "sem confirmacao" ou similar: o pipeline roda sem pedir aprovacao.
- Caso contrario: o planejador apresenta o plano; apos aprovacao o copywriter refina e mostra as mudancas antes de continuar.

Use o plano refinado pelo copywriter como guia. Nao invente slides fora do plano.

### Passo 1: Leitura de Referencias
1. **Leia 2+ exemplos** de `exemplos_de_sucesso/` (padrao visual)
2. **Leia as imagens** em `decks/<deck>/assets/` (ja inventariadas pelo planejador)
3. **Identifique a logo** em `logo_canal/canal_sandeco_logo.png` (sera copiada para o destino)
4. **Leia `video_lista.md`** para confirmar o video escolhido pelo planejador

### Passo 1.5: Lembrancas do Usuario (memoria de preferencias)

Primeiro, deixe a memoria em dia. O comando le as correcoes que o usuario ja fez e promove a candidata o que ja se repetiu o bastante:

```bash
npx mira-animator memoria consolidar
```

Se aparecer nota **candidata**, avise o usuario em uma linha e siga: candidata **nao e aplicada** ate ele ativar com `memoria estado <arquivo> ativo`. Nao insista, nao pare a montagem.

Depois pergunte o que se aplica a este deck. **Uma consulta por papel de slide que o deck tem** (a nota so aparece quando o papel dela e informado, entao a consulta generica nao alcanca nota de escopo):

```bash
npx mira-animator memoria lembrancas --papel capa --formato 16x9 --registro <slug>
npx mira-animator memoria lembrancas --papel conteudo --formato 16x9 --registro <slug>
npx mira-animator memoria lembrancas --papel encerramento --formato 16x9 --registro <slug>
```

Ajuste `--formato` ao deck (`16x9`, `9x16`, `1x1`). O `--registro` recebe o **slug do deck**, nao um caminho: a proveniencia (o que foi aplicado, o que foi ignorado e por que) vai para a pasta de memoria do Mira, fora do deck. **Nunca grave lembranca dentro do deck**: o pacote tem o perfil do usuario em texto puro e deck publicado e drop-and-run, subiria junto.

Se qualquer um desses comandos falhar (versao do Mira sem o comando, pasta inexistente), **gere normalmente e siga**: memoria e opcional, nunca trava a montagem.

O comando devolve texto legivel, uma linha por lembranca, com o escopo e a confianca. Como usar:

- **Lembranca ativa vale como orientacao**, nao como ordem: aplique quando o slide se encaixa no escopo dela.
- **A marca manda acima da memoria.** Cor #FF904D, `text-wrap: balance` na capa e area segura continuam nao-negociaveis; lembranca que conflita com isso e descartada.
- **Nao interrompa slide a slide.** Se duas lembrancas se contradizem no mesmo slide, siga o padrao do Mira e junte a duvida numa pergunta so no fim.
- **Sem memoria ainda?** O comando responde "Nenhuma lembranca se aplica". Gere normal, isso e o esperado no comeco.

Quando o usuario der uma ordem explicita de gosto durante a conversa ("sempre menos texto", "na capa o titulo fica em cima"), grave:

```bash
npx mira-animator memoria nota "menos texto por slide, no maximo tres linhas" --eixo densidade
```

Eixos em uso: `cor`, `posicao`, `densidade`, `animacao`, `camera`, `tipografia`. Escopo opcional: `--papel capa|conteudo|encerramento`, `--formato 16x9|9x16|1x1`, `--tema <tema>`. Grave so preferencia que valha para os proximos decks; conserto de um slide especifico nao vira nota.

### Passo 2: Montagem dos Cards conforme o Plano
Para cada slide do plano aprovado, use o template indicado:
- **Demonstração de Código:** `card_code.html`
- **Dados Tabulares:** `card_tabela.html`
- **Comparativos/Preços:** `card_destaques.html`
- **Cronogramas/Processos:** `card_timeline.html`
- **Estatísticas/Listas:** `card_lista.html`
- **Destaque Visual:** `card_imagem.html`
- **Grids/Categorias:** `card_grid.html`
- **Metas/Progresso:** `card_progresso.html`
- **Citações/Insights:** `card_citacao.html`
- **Chamada para Acao (CTA):** `card_cta.html` (OBRIGATORIO: Inserir sempre no meio da apresentacao)
- **Graficos D3.js Interativos:** `card_d3.html`
- **Card com Video de Fundo:** `card_video_bg.html`

### Passo 3: Configuração de Componentes
Para cada template selecionado:
1. **Placeholders:** Substitua termos entre colchetes pelos dados reais
2. **Ícones:** Use nomes compatíveis com [Lucide](https://lucide.dev/icons)
3. **Animações:** Incremente `data-aos-delay` em 100ms por card (100, 200, 300...)

### Passo 4: Montagem do Arquivo Final

**Destino:** `decks/<deck>/index.html`

**Arquivos a copiar para a pasta de destino ANTES de gerar o HTML:**
1. `logo_canal/canal_sandeco_logo.png` (ou logo definido no mira.config.json) → `decks/<deck>/logo.png`
2. Um video de `videos_header/` escolhido via `video_lista.md` → `decks/<deck>/header-bg.mp4`
3. Videos adicionais para cards internos (opcional) → `decks/<deck>/video-card-N.mp4`
4. Imagens de `decks/<deck>/assets/` relevantes ao conteudo (referenciar com caminho relativo)

**Concatenação:**
1. **Layout Base (Início):** `layout_base.html` até `<body>`
2. **Abertura:** `header.html` com vídeo local e logo Sandeco
3. **Corpo:** Sequência de cards dos Passos 2 e 3
4. **Encerramento:** `footer.html` com logo Sandeco + fechamento de `layout_base.html`

## 🎯 Regras de Composicao

### Quantidade e Variedade de Cards
- **Minimo:** 8 cards por apresentacao
- **Maximo:** 20 cards por apresentacao
- **Variedade:** Usar pelo menos 3 tipos diferentes de template (nao repetir o mesmo tipo em sequencia)
- **Ritmo visual:** Alternar entre cards densos (tabela, codigo, D3) e cards leves (citacao, imagem, CTA)
- **CTA obrigatorio:** Inserir `card_cta.html` no meio da apresentacao (entre os cards 4-8)

### Geracao de Imagens
- Se um slide precisa de imagem que nao existe em `decks/<deck>/assets/`, chame a skill `/mira-visuals` para gera-la antes de montar o slide.

### Passo 5: Validacao Automatica (OBRIGATORIO)

Apos gerar o `index.html` e copiar os assets, chame a skill `/mira-validator`. Ela checa cores, logos, videos, layout e estrutura; corrija falhas criticas antes de apresentar ao usuario.

## 🎨 Regras de Estilo e Design

### Cores (OBRIGATÓRIO — usar exatamente estas)
- **Fundo:** `#000000` (preto puro)
- **Cor primária:** `#FF904D` (coral/laranja)
- **rgba equivalente:** `rgba(255, 144, 77, ...)`
- **Cor de erro/vibe coding:** `#FF6464`

### Identidade Visual (OBRIGATÓRIO)
- **Logo Canal Sandeco:** `canal_sandeco_logo.png` como `<img>` no header E no footer. NUNCA usar SVG genérico.
- **Video de fundo no header:** Sempre um arquivo `.mp4` LOCAL na mesma pasta do HTML, com `opacity-50` (50%) e overlay gradient.

### Layout dos Cards
- **Largura:** `max-w-5xl` (NÃO `max-w-3xl`, NÃO `max-w-6xl`)
- **Padding:** `p-8` ou `p-10` (NÃO `p-16`)
- **Gap entre slides:** `gap-[60vh]`
- **Glassmorphism:** `backdrop-filter: blur(10px)` e bordas semi-transparentes

### Tipografia
- **Fonte:** Inter (Google Fonts) — adicionar no `<head>`
- **Títulos de card:** `text-3xl` ou `text-4xl` (NÃO `text-5xl`)
- **Corpo:** `text-base` ou `text-lg`

### Responsividade (OBRIGATÓRIO)
Todo slide 16:9 DEVE reorganizar em retrato para abrir bem no celular — sem `mobile.html` separado, sem "print cortado".
- **Camada base:** o `layout_base.html` já traz o bloco `@MIRA:RESPONSIVE` (reflow mobile-first: fontes via `clamp`, grids empilham, padding reduz, palcos escalam). NUNCA remova esse bloco. Fonte da verdade: `templates/themes/responsive.css`.
- **Escreva mobile-first:** títulos com breakpoint (`text-4xl md:text-6xl`, nunca `text-6xl` sozinho num H1); grids `grid-cols-1 md:grid-cols-2`; nada de largura fixa em `px`.
- **Sem overflow horizontal:** imagens/tabelas/svg com `max-w-full`; tabela larga dentro de `overflow-x-auto`.
- **`<meta viewport>`** deve conter `width=device-width` e `viewport-fit=cover`.

### Imagens do Capítulo
- Incluir as imagens relevantes de `decks/<deck>/assets/` nos slides correspondentes
- Usar `class="w-full rounded-lg"` para imagens de largura total
- Copiar as imagens para a pasta de destino do slide

### Videos (OBRIGATORIO)
- **Selecao:** consultar `video_lista.md` para escolher o video adequado ao tema
- **Header:** sempre um video de fundo no header (copiado como `header-bg.mp4`)
- **Cards internos:** opcionalmente, videos adicionais como fundo de cards
- **Atributos:** `autoplay loop muted playsinline`
- **Opacidade:** sempre `opacity: 0.5` via `style="opacity: 0.5;"` ou `class="opacity-50"`
- **Overlay:** sempre gradient overlay por cima, para legibilidade do texto

Exemplo de video em card interno:
```html
<div class="relative overflow-hidden rounded-2xl">
    <video autoplay loop muted playsinline class="absolute inset-0 w-full h-full object-cover" style="opacity: 0.5;">
        <source src="video-card-1.mp4" type="video/mp4">
    </video>
    <div class="absolute inset-0" style="background: linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.5));"></div>
    <div class="relative z-10 p-8">
        <!-- conteudo do card -->
    </div>
</div>
```

### Seguranca
- No `card_code.html`, converter `<` e `>` em `&lt;` e `&gt;`
- Tabelas: colunas do `<thead>` devem bater com `<tbody>`

## 🧭 Navegação Card-a-Card

### Comportamento
- **Espaçamento:** `setupFullScreenWrappers()` envolve cada card em container `min-h-screen`
- **Botão "Começar":** No header, leva ao primeiro card
- **Botão flutuante:** `#next-card` fixo no canto inferior direito, aparece após 300px de scroll
- **Barra de progresso:** Fixa no topo
- **Teclado:** Seta Direita/Baixo/PageDown avança; Seta Esquerda/Cima/PageUp retrocede

### Implementação
Já integrado nos templates `layout_base.html` e `header.html`.

## 🖼️ Checklist de Assets por Slide

Para cada apresentação gerada, garantir:
- [ ] `canal_sandeco_logo.png` copiada para pasta de destino
- [ ] `header-bg.mp4` (video escolhido via `video_lista.md`) copiado para pasta de destino
- [ ] Videos adicionais para cards internos copiados (se aplicavel)
- [ ] Imagens de `decks/<deck>/assets/` relevantes referenciadas
- [ ] Logo aparece no header (dentro do `<div>` central, após subtítulo)
- [ ] Logo aparece no footer (antes do copyright)
- [ ] Video toca no fundo do header com overlay gradient e `opacity: 0.5`
- [ ] Todos os videos usam `autoplay loop muted playsinline` com `opacity: 0.5`
- [ ] Cores usam #FF904D (NÃO #FFA203)
- [ ] Fundo usa #000000 (NÃO #222222)
- [ ] NÃO há número de slides no header (remover `[DESTAQUE_NUMERICO]`)

## 🚀 Saída Esperada
Um `index.html` completo e autossuficiente: vídeo de fundo no header, logo Sandeco no header e footer, imagens do capítulo nos slides relevantes, scripts de animação (AOS), ícones (Lucide), navegação card-a-card e qualidade visual compatível com os exemplos de sucesso.