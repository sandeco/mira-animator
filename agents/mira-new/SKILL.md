---
name: mira-new
description: >-
  Porta de entrada para um novo deck do Mira: coleta requisitos
  conversacionalmente e monta a pasta em decks/ pronta para o pipeline. NÃO gera
  slides, só prepara o terreno.
  Use SEMPRE que o usuário disser /mira-new, novo deck, nova apresentação, criar
  deck, começar slides sobre, quero fazer slides de, novo tema de slides,
  iniciar uma apresentação, cria uma pasta de slides, ou pedir para começar uma
  apresentação do zero sobre algum assunto.
---

# Skill: Novo Deck (Mira)

## Objetivo

Porta de entrada de uma nova apresentação. Numa conversa curta, colete o que o Mira precisa para montar a pasta do tema e deixe tudo pronto para o pipeline (`/mira-extract` → `/mira-planner` → `/mira-builder` → ...).

- **FAZ:** cria a estrutura de `decks/<tema>/` (com `references/`) **na primeira ação**, para o usuário já ter onde soltar o material-fonte; depois monta o deck a partir de um template, aplica o tema base, opcionalmente sobrescreve a cor principal e registra o deck no `mira.config.json`.
- **NÃO FAZ:** não escreve conteúdo de slide, não extrai briefing, não anima. A skill **para no setup** e oferece o próximo passo.

## Regra de ouro

Tudo o que esta skill cria ou edita vive **dentro de `decks/<tema>/`**. Nunca toque em arquivos fora de `decks/`, com a única exceção de registrar o deck no `mira.config.json` da raiz.

## Fluxo de Execução

### Passo 1: Nome do tema (única pergunta antes da pasta existir)

Pergunte **só o nome do tema**. Texto livre. Gere um **slug** em kebab-case, minúsculo, sem acento (ex.: "Spec Driven Development" → `spec-driven-development`). Confirme se houver ambiguidade.

Não pergunte template, tema, cor nem descrição ainda. Com o slug na mão, vá direto para o Passo 2.

### Passo 2: Criar a estrutura AGORA e parar

**Antes de qualquer outra pergunta, antes de copiar qualquer template**, crie a estrutura de pastas do deck:

```
decks/<slug>/
decks/<slug>/references/
decks/<slug>/assets/
decks/<slug>/mira/
```

Isso não é detalhe de ordem, é o ponto da skill. Sem a pasta no disco, o usuário não tem onde soltar o PDF, o print ou o documento que ele já tem na mão, e a conversa trava. A pasta primeiro, as escolhas depois.

**Se `decks/<slug>/index.html` já existir**, aí sim é um deck montado de verdade: avise e pergunte se é para usar outro nome. **Se só a pasta existir, sem `index.html`**, é esqueleto de uma sessão anterior: **retome dentro dele**, liste o que já tem em `references/` e siga. Nunca peça outro nome nesse caso.

Com as pastas criadas, **pare** e ofereça os dois caminhos, sempre com o **caminho absoluto** da pasta de referências (caminho relativo não ajuda quem vai arrastar arquivo no explorador):

> "Criei a estrutura em `<caminho absoluto de decks/<slug>>`. A pasta de referências está pronta:
> `<caminho absoluto de decks/<slug>/references>`
>
> Como você prefere começar?
> **1.** Me contar aqui no chat do que trata a apresentação, e eu já registro.
> **2.** Colocar os arquivos (PDF, doc, prints, links) nessa pasta e me avisar quando terminar."

Trate a resposta assim, e nos dois casos o material **tem que acabar dentro de `references/`**:

- **Escolheu 1 (texto no chat):** ouça a descrição e salve **na hora** como `decks/<slug>/references/_tema.md`. Não deixe para depois.
- **Escolheu 2 (vai soltar arquivos):** espere o aviso. Quando ele disser que terminou, **liste o que você encontrou** em `references/` antes de continuar. Se estiver vazia, diga isso e pergunte se ele quer descrever por texto no lugar.
- **Os dois:** vale, salve o `_tema.md` e liste os arquivos.

Só depois de ter referência ou descrição registrada siga para o Passo 3.

### Passo 3: Coletar o resto dos requisitos (conversacional)

Pergunte de forma objetiva, com os defaults entre parênteses. Se o usuário já adiantou uma resposta, não pergunte de novo.

1. **Template do deck** (esqueleto). Liste **dinamicamente** varrendo `mira-templates/decks/` (cada subpasta com `index.html` é um template), incluindo os do `/mira-image-template`, que aparecem lá automaticamente.

   **`mira-default` vem SEMPRE em primeiro na lista, com o rótulo `(recomendado)` ao lado.** Os demais seguem em ordem alfabética. Mostre todos e deixe o usuário escolher: recomendado não é obrigatório. Se ele não escolher nenhum, use o `mira-default` sem perguntar de novo.

   ```text
   1. mira-default (recomendado) — título em cima, animação ocupando o slide inteiro
   2. aula-capitulo — aula ou palestra a partir de um capítulo
   3. demo-tecnica — demo técnica / walkthrough
   4. pitch-projeto — pitch de projeto
   5. sandeco-just-animation-template — palco preto, só animação, sem texto
   ```
2. **Tema base** (identidade visual). Liste **dinamicamente** varrendo `mira-templates/themes/` (cada `.css`, exceto `base.css`, é um tema). Built-in: `mira-dark` (default, laranja), `light-minimal`, `corporate-blue` e `neon-emerald`; temas do `/mira-image-template` aparecem aqui também. **Se o template escolhido tiver um tema de mesmo nome** (templates derivados de imagem), use-o como **padrão** desse template, pois é a identidade que veio da imagem; o usuário ainda pode escolher outro.
3. **Cor principal** (opcional). Sem pedido, use a cor do tema base. Se pedir uma cor (hex `#RRGGBB` ou nome como "roxo"), converta para hex e trate como override no Passo 5. Confirme a cor.
4. **Descrição do tema**, só se ele escolheu o caminho 2 no Passo 2 e ainda não descreveu nada. Uma ou duas frases: do que trata, para quem, qual o objetivo. Salve como `references/_tema.md`. Se o `_tema.md` já existe, pule.

### Passo 4: Montar o deck

Para os **templates built-in** (`mira-default`, `aula-capitulo`, `pitch-projeto`, `demo-tecnica`, `sandeco-just-animation-template`) com um **tema built-in**, use o comando canônico do Mira, que copia o esqueleto, injeta o CSS do tema e registra no config:

```bash
npx mira-animator new <slug> --deck=<template> --theme=<tema-base>
```

A pasta já existe desde o Passo 2, e isso não é problema: o CLI só recusa quando encontra um `index.html` montado, então ele escreve dentro do esqueleto e **preserva o que estiver em `references/`**.

Isso cria `decks/<slug>/index.html` com o tema base embutido (entre `/* @MIRA:THEME:START */` e `/* @MIRA:THEME:END */`). O comando **já deixa o deck offline por padrão**: copia as libs vendoradas (Tailwind, AOS, Lucide, D3, fonte Inter, embarcadas na instalação) para `decks/<slug>/assets/vendor/` e aponta o `<head>` para elas. O deck abre por `file://` sem internet e passa em firewall corporativo. Nada é baixado.

> **Caso especial, `sandeco-just-animation-template`:** deck de **animação pura, multi-slide** (cada `<section>` é uma animação de tela cheia, sem títulos nem texto sobreposto), **multicor e theme-agnóstico**. Por isso o `new` **ignora o `--theme`** e mantém o bloco `@MIRA:THEME` neutro do próprio template; a cor vive numa paleta livre (nenhuma predominante), não na cor única do tema. Não aplique override de cor aqui. O preenchimento segue a seção "Variante: sandeco-just-animation-template" do `mira-animator`.

> **`mira-default` é o padrão.** Se o usuário não escolher template, é este: **um título em cima e a animação ocupando todo o resto do quadro 16:9**, sem card, sem pílulas, sem moldura. Quadro 16:9 fixo com faixa cinza nas sobras, navegação por seta, modos E e P. Ao contrário do animation-pure, ele **aceita `--theme` normalmente**. Não tem câmera nem terços: quem vai gravar com webcam usa `/mira-studio-full` (16:9) ou `/mira-studio` (9:16). O preenchimento segue a seção "Variante: mira-default" do `mira-animator`.
>
> Use `aula-capitulo` quando o deck for **denso de conteúdo** (tabela, código, timeline, comparativo): lá o slide é um card com texto ao redor da animação, que é outro trabalho.

> **Para templates ou temas do `/mira-image-template`** (e como fallback sem npx em qualquer caso): monte na mão a partir da cópia local. Copie `mira-templates/decks/<template>/index.html` para `decks/<slug>/index.html`, substitua o bloco entre os marcadores `@MIRA:THEME` pelo CSS de `mira-templates/themes/<tema>.css` seguido de `mira-templates/themes/base.css`, e adicione o deck em `mira.config.json` (`decks[]`). O CLI só conhece decks e temas built-in, então templates/temas derivados de imagem **precisam** desta montagem local. **Depois, rode `node mira-templates/vendor/apply-offline.mjs decks/<slug>`** para deixar esse deck offline (a montagem manual não passa pelo CLI, então não recebe o offline automático). **Por fim, instale as ferramentas de autoria** — a montagem manual não copia os módulos de edição/pintura. Rode `npx mira-animator edit decks/<slug>`; sem npx, copie `mira-edit.js`, `mira-edit-free.js` e `mira-draw.js` de `mira-templates/authoring/` para `decks/<slug>/mira/` e injete antes do `</body>` as três tags `<script defer src="mira/...">` (com `mira-edit-free.js` depois de `mira-edit.js`).

### Passo 4.5: Lembranças do usuário (memória de preferências)

Com o deck montado e antes de preencher qualquer slide, consulte o que este usuário já corrigiu em decks anteriores:

```bash
npx mira-animator memoria consolidar
npx mira-animator memoria lembrancas --papel capa --formato 16x9
npx mira-animator memoria lembrancas --papel conteudo --formato 16x9
```

Uma consulta por papel de slide (nota de escopo só aparece quando o papel dela é informado). Ajuste `--formato` ao deck.

- Lembrança ativa é **orientação**, não ordem: aplique onde o slide se encaixa no escopo dela.
- A marca manda acima da memória: `#FF904D`, `text-wrap: balance` na capa e área segura continuam inegociáveis.
- Nota **candidata** não é aplicada. Se aparecer alguma, avise em uma linha e siga.
- Se o comando falhar por qualquer motivo, **gere normalmente e siga**. Memória nunca trava a criação.

### Passo 5: Aplicar a cor principal custom (só se houver override)

Se o usuário escolheu cor diferente da do tema base, edite o `:root` **dentro** dos marcadores `@MIRA:THEME` de `decks/<slug>/index.html`. A partir do hex `#RRGGBB` (componentes R, G, B em decimal), substitua **somente** estas variáveis derivadas da primária:

| Variável | Novo valor |
|---|---|
| `--mira-primary` | `#RRGGBB` |
| `--mira-glow-soft` | `rgba(R, G, B, 0.15)` |
| `--mira-glow-strong` | `rgba(R, G, B, 0.25)` |
| `--mira-icon-bg` | `rgba(R, G, B, 0.15)` |
| `--mira-icon-border` | `rgba(R, G, B, 0.30)` |
| `--mira-stage-glow` | `rgba(R, G, B, 0.06)` |
| `--mira-accent-2` | tom mais claro da primária |

Para `--mira-accent-2`, clareie a primária misturando ~35% de branco: para cada componente, `novo = round(C + (255 - C) * 0.35)`, e escreva em hex.

**Não altere** as demais variáveis (`--mira-bg`, `--mira-text`, `--mira-text-soft`, `--mira-card-bg`, `--mira-card-border`, `--mira-pill-*`). Elas pertencem ao tema base e garantem o contraste. Assim o override de cor compõe com qualquer tema base.

### Passo 6: Fechar a intake de referências

A pasta `decks/<slug>/references/` existe desde o Passo 2 e já pode ter material. Aqui você só absorve o que chegou depois. A intake segue as regras do `/mira-references` (copiar, nunca mover nem editar o original), aplicadas dentro de `decks/`:

- **Caminho de arquivo/pasta:** copie para `decks/<slug>/references/`.
- **Texto colado:** salve como `.md` em `references/`.
- **Link:** registre em `decks/<slug>/references/fontes.md`.
- **Descrição do tema:** salve como `decks/<slug>/references/_tema.md` (semente do briefing que o `/mira-extract` vai ler), se ainda não foi salva no Passo 2.

Se ainda não há material, tudo bem: repita o **caminho absoluto** da pasta e diga que ele pode soltar arquivos lá a qualquer momento. Para coletas maiores ou posteriores, acione o `/mira-references`.

### Passo 7: Resumo e próximo passo

Mostre um resumo curto:

```
Deck criado: decks/<slug>/
Template: <template> | Tema: <tema-base> | Cor principal: <hex>
Referências: <n> arquivo(s) em decks/<slug>/references/
```

Depois **ofereça** o próximo passo (não execute sem confirmar):

> "Pronto. Quer que eu acione o /mira-extract agora para gerar o briefing a partir das referências?"

## Regras Inegociáveis

- **A estrutura de pastas nasce antes de qualquer escolha.** Colhido o nome, crie `decks/<slug>/` com `references/`, `assets/` e `mira/` na hora. Não pergunte template, tema nem cor antes disso.
- **Há duas paradas obrigatórias.** A primeira logo depois de criar as pastas, para o usuário escolher entre descrever por texto ou soltar arquivos em `references/`, sempre com o **caminho absoluto** à mostra. A segunda no fim, antes do pipeline.
- **Pasta existente sem `index.html` é esqueleto, não conflito.** Retome dentro dela e liste o que há em `references/`. Só peça outro nome quando existir `decks/<slug>/index.html`.
- A skill **para no setup**. Só siga para o pipeline após o usuário confirmar.
- Escreva apenas dentro de `decks/<slug>/` (mais o registro em `mira.config.json`). Nunca edite o original de uma referência.
- O tema base deve ser um dos temas válidos (built-in ou derivado de imagem via `/mira-image-template`); a cor custom é aplicada **por cima** dele, só nas variáveis derivadas da primária.
- Texto visível em português brasileiro com acentuação correta. Proibido travessão (—); use vírgula ou dois-pontos.
