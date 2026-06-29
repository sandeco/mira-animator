---
name: mira-new
description: >-
  Porta de entrada para um novo deck de slides do Mira. Coleta os requisitos de
  uma nova apresentação de forma conversacional (nome do tema, template do deck,
  tema base, cor principal e referências) e monta a pasta do tema em decks/
  pronta para o pipeline preencher. NÃO gera os slides, apenas prepara o terreno
  e, ao final, oferece acionar o pipeline. Use SEMPRE que o usuário disser
  /mira-new, novo deck, nova apresentação, criar deck, começar slides sobre,
  quero fazer slides de, novo tema de slides, iniciar uma apresentação, cria uma
  pasta de slides, ou pedir para começar uma apresentação do zero sobre algum
  assunto.
---

# Skill: Novo Deck (Mira)

## Objetivo

Ser a **porta de entrada** de uma nova apresentação. Em uma conversa curta, coletar o que o Mira precisa para montar a pasta do tema e, ao final, deixar tudo pronto para o pipeline (`/mira-extract` → `/mira-planner` → `/mira-builder` → ...).

## O que esta skill FAZ e o que NÃO faz

- **FAZ:** cria `decks/<tema>/` a partir de um template, aplica o tema base, opcionalmente sobrescreve a cor principal, prepara `decks/<tema>/references/` e registra o deck no `mira.config.json`.
- **NÃO FAZ:** não escreve conteúdo de slide, não extrai briefing, não anima. Isso é trabalho do pipeline. Esta skill **para no setup** e oferece o próximo passo.

## Regra de ouro

Tudo o que esta skill cria ou edita vive **dentro de `decks/<tema>/`**. Nunca toque em arquivos fora de `decks/` (a única exceção é registrar o deck no `mira.config.json` da raiz).

## Fluxo de Execução

### Passo 1: Coletar os requisitos (conversacional)

Pergunte de forma objetiva, oferecendo os defaults entre parênteses. Se o usuário já adiantou alguma resposta no pedido, não pergunte de novo.

1. **Nome do tema.** Texto livre. Gere um **slug** em kebab-case, minúsculo, sem acento (ex.: "Spec Driven Development" → `spec-driven-development`). Confirme o slug com o usuário se houver ambiguidade.
2. **Template do deck** (esqueleto). Liste **dinamicamente** as opções varrendo `mira-templates/decks/` (cada subpasta com `index.html` é um template). Os built-in são `aula-capitulo` (default), `pitch-projeto`, `demo-tecnica` e `sandeco-just-animation-template`; templates criados pelo `/mira-image-template` aparecem aqui automaticamente, junto com os existentes. Mostre todos e deixe o usuário escolher.
3. **Tema base** (identidade visual). Liste **dinamicamente** varrendo `mira-templates/themes/` (cada `.css`, exceto `base.css`, é um tema). Os built-in são `mira-dark` (default, laranja), `light-minimal`, `corporate-blue` e `neon-emerald`; temas gerados pelo `/mira-image-template` aparecem aqui também. **Se o template escolhido tiver um tema de mesmo nome** (caso dos templates derivados de imagem), use-o como **padrão** desse template, pois é a identidade que veio da imagem; o usuário ainda pode escolher outro.
4. **Cor principal** (opcional). Se o usuário não pedir, use a cor do tema base. Se pedir uma cor (hex `#RRGGBB` ou nome como "roxo"), converta para hex e trate como override no Passo 3. Confirme a cor escolhida.
5. **Descrição do tema.** Uma ou duas frases: do que trata, para quem, qual o objetivo. Isso vira a semente do briefing.
6. **Referências.** Pergunte se o usuário já tem material-fonte (PDF, livro, artigo, imagens, prints, links, código). Trate no Passo 4.

Se o deck `decks/<slug>/` já existir, avise e pergunte se é para usar outro nome.

### Passo 2: Montar o deck

Para os **templates built-in** (`aula-capitulo`, `pitch-projeto`, `demo-tecnica`, `sandeco-just-animation-template`) com um **tema built-in**, use o comando canônico do Mira, que copia o esqueleto, injeta o CSS do tema e registra no config:

```bash
npx mira-animator new <slug> --deck=<template> --theme=<tema-base>
```

Isso cria `decks/<slug>/index.html` com o tema base já embutido (entre os marcadores `/* @MIRA:THEME:START */` e `/* @MIRA:THEME:END */`). O comando **já deixa o deck offline por padrão**: copia as libs vendoradas (Tailwind, AOS, Lucide, D3, fonte Inter — embarcadas na instalação) para `decks/<slug>/assets/vendor/` e aponta o `<head>` para elas. O deck abre por `file://` sem internet e passa em firewall corporativo. Nada é baixado.

> **Caso especial, `sandeco-just-animation-template`:** é um deck de **animação pura, multi-slide** (cada `<section>` é uma animação de tela cheia, sem títulos nem texto sobreposto), e é **multicor e theme-agnóstico**. Por isso o `new` **ignora o `--theme`** para este template e mantém o bloco `@MIRA:THEME` neutro do próprio template; a cor vive numa paleta livre (nenhuma predominante), não na cor única do tema. Não aplique override de cor principal aqui. O preenchimento das animações segue a seção "Variante: sandeco-just-animation-template" do `mira-animator`.

> **Para templates ou temas criados pelo `/mira-image-template`** (e como fallback sem npx em qualquer caso): monte na mão a partir da cópia local. Copie `mira-templates/decks/<template>/index.html` para `decks/<slug>/index.html`, substitua o bloco entre os marcadores `@MIRA:THEME` pelo CSS de `mira-templates/themes/<tema>.css` seguido de `mira-templates/themes/base.css`, e adicione o deck em `mira.config.json` (`decks[]`). O CLI só conhece os decks e temas built-in, então templates/temas derivados de imagem **precisam** desta montagem local. **Depois de montar na mão, rode `node mira-templates/vendor/apply-offline.mjs decks/<slug>`** para deixar esse deck offline também (a montagem manual não passa pelo CLI, então não recebe o offline automático).

### Passo 3: Aplicar a cor principal custom (só se houver override)

Se o usuário escolheu uma cor diferente da do tema base, edite o bloco `:root` **dentro** dos marcadores `@MIRA:THEME` de `decks/<slug>/index.html`. A partir do hex `#RRGGBB` (componentes R, G, B em decimal), substitua **somente** estas variáveis derivadas da cor primária:

| Variável | Novo valor |
|---|---|
| `--mira-primary` | `#RRGGBB` |
| `--mira-glow-soft` | `rgba(R, G, B, 0.15)` |
| `--mira-glow-strong` | `rgba(R, G, B, 0.25)` |
| `--mira-icon-bg` | `rgba(R, G, B, 0.15)` |
| `--mira-icon-border` | `rgba(R, G, B, 0.30)` |
| `--mira-stage-glow` | `rgba(R, G, B, 0.06)` |
| `--mira-accent-2` | tom mais claro da primária |

Para o `--mira-accent-2`, clareie a cor primária misturando ~35% de branco: para cada componente, `novo = round(C + (255 - C) * 0.35)`, e escreva o resultado em hex.

**Não altere** as demais variáveis (`--mira-bg`, `--mira-text`, `--mira-text-soft`, `--mira-card-bg`, `--mira-card-border`, `--mira-pill-*`). Elas pertencem ao tema base e garantem o contraste correto. Assim o override de cor compõe com qualquer tema base.

### Passo 4: Preparar as referências

A pasta de referências deste deck é `decks/<slug>/references/`. Garanta que ela exista. A intake de material segue as regras do `/mira-references` (copiar, nunca mover nem editar o original), aplicadas aqui dentro de `decks/`:

- **Caminho de arquivo/pasta:** copie para `decks/<slug>/references/`.
- **Texto colado:** salve como `.md` em `references/`.
- **Link:** registre em `decks/<slug>/references/fontes.md`.
- **Descrição do tema (Passo 1.5):** salve como `decks/<slug>/references/_tema.md` (vira a semente do briefing que o `/mira-extract` vai ler).

Se o usuário ainda não tem material, tudo bem: diga que ele pode soltar arquivos em `decks/<slug>/references/` a qualquer momento. Para coletas maiores ou posteriores, acione o `/mira-references`.

### Passo 5: Resumo e próximo passo

Mostre um resumo curto:

```
Deck criado: decks/<slug>/
Template: <template> | Tema: <tema-base> | Cor principal: <hex>
Referências: <n> arquivo(s) em decks/<slug>/references/
```

Depois **ofereça** o próximo passo (não execute sem confirmar):

> "Pronto. Quer que eu acione o /mira-extract agora para gerar o briefing a partir das referências?"

## Regras Inegociáveis

- Esta skill **para no setup**. Só siga para o pipeline depois de o usuário confirmar.
- Escreva apenas dentro de `decks/<slug>/` (mais o registro em `mira.config.json`). Nunca edite o original de uma referência.
- O tema base deve ser um dos quatro válidos; a cor custom é aplicada **por cima** dele, editando só as variáveis derivadas da primária.
- Texto visível em português brasileiro com acentuação correta. Proibido travessão (—); use vírgula ou dois-pontos.
