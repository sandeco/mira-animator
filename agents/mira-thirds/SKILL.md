---
name: mira-thirds
description: >-
  Reenquadra um deck do Mira na REGRA DOS TERÇOS, sem mudar a proporção do
  quadro. Empurra o conteúdo de cada slide (título, animação e pílulas) para as
  colunas 1 e 2 de um grid 3x3 (os dois terços da esquerda) e deixa a coluna da
  direita inteira livre, reservada para você sobrepor texto, lower-third ou o
  vídeo do apresentador na edição. Não toca no arquivo original: cria um novo
  arquivo com sufixo -thirds ao lado. Funciona por cima do deck 16:9, da versão
  1:1 (mira-squared) ou da 9:16 (mira-vertical), OU cria slides DO ZERO já
  compostos em terços. O lado livre é a direita por padrão, com opção de
  inverter para a esquerda. Use SEMPRE que o usuário disser /mira-thirds, regra
  dos terços, rule of thirds, composição em terços, anima à esquerda, deixa a
  direita livre, coluna livre, dois terços à esquerda, grid 3x3, espaço para
  texto ao lado, abre espaço à direita, cria um slide em terços, ou pedir o deck
  ou um slide novo com a animação encostada num lado e o outro terço livre.
---

# Skill: Reenquadramento na Regra dos Terços (animação em 2/3, um terço livre)

Reenquadra um deck do Mira na **regra dos terços** (rule of thirds): divide o quadro num grid 3x3 e joga todo o conteúdo do slide (título, animação e pílulas) para as **colunas 1 e 2** (os dois terços da esquerda), deixando a **coluna 3 (direita) inteira livre**. Essa coluna fica limpa de propósito, para você sobrepor depois texto, lower-third ou o vídeo do apresentador. A abordagem é a mesma do `mira-squared`/`mira-vertical`: **moldura fixa com ajuste leve**, só que aqui a mudança é de **composição**, não de proporção.

```
   COL 1        COL 2        COL 3
┌──────────┬──────────┬──────────┐
│██████████│██████████│          │
├──────────┼──────────┤  livre   │  ← você sobrepõe
│██ SLIDE ██│██ SLIDE ██│ (texto,  │     na edição
├──────────┼──────────┤  vídeo)  │
│██████████│██████████│          │
└──────────┴──────────┴──────────┘
   conteúdo nas colunas 1+2      direita livre
```

Tem dois modos: **conversão** (padrão quando existe deck de origem, passos abaixo) e **criação nativa** (quando não existe deck, ou o usuário pede um slide novo já em terços; seção a seguir).

## Criação do zero na geometria nativa

Quando não houver deck de origem, ou o usuário pedir "cria um slide em terços sobre X", NÃO crie um slide centralizado para reenquadrar depois. O slide nasce composto em terços:

1. **Herde as regras criativas do `agents/mira-animator/SKILL.md`:** Regra Zero (loop interno obrigatório), liberdade criativa de metáfora, regra de idioma, regra de título (sem ícone, máximo 6 palavras), estrutura do card com glass-card. Tudo vale igual.
2. **Composição nativa:** o arquivo nasce com o bloco `<style id="mira-formato-thirds">` desta skill no head e o conteúdo já autorado para viver nas colunas 1+2, com a coluna 3 livre. Proporção base: 16:9, salvo pedido de outro formato (aí combine com a moldura do mira-squared ou mira-vertical).
3. **Vantagem da autoria nativa (use):** diferente do reenquadramento, aqui você PODE compor a animação com o assunto principal sobre a linha de força entre a COL 2 e a COL 3, que é o ponto forte da regra dos terços. No reenquadramento isso é impossível sem mexer na animação; na criação nativa é a composição certa.
4. **A coluna livre continua sagrada:** nada de título, pílula ou elemento da animação invadindo o terço reservado, que segue limpo para sobreposição na edição.

## REGRA DE IDIOMA

Siga `agents/_shared/idioma.md`. Texto visível em português correto. Proibido travessão (—): use vírgula ou dois-pontos.

## Regra de Ouro: nunca destrua o original (modo conversão)

- O deck de origem (`index.html`, `index-1x1.html` ou `index-9x16.html`) **permanece intacto**.
- Você cria um **arquivo novo** ao lado, com sufixo `-thirds`.
- Nunca edite a lógica das animações, os textos, as cores ou a navegação. A transformação é só de **composição** (CSS de enquadramento).

## Composição é ortogonal ao formato

Esta skill **não muda a proporção** do quadro. Ela só desloca o conteúdo para os dois terços de um lado. Por isso combina por cima de qualquer formato:

- `index.html` (16:9) → `index-thirds.html`
- `index-1x1.html` (1:1) → `index-1x1-thirds.html`
- `index-9x16.html` (9:16) → `index-9x16-thirds.html`

Se o usuário não disser sobre qual arquivo aplicar, use o `index.html` (16:9). Se houver mais de um deck na pasta e ficar ambíguo, pergunte qual.

## Como o Mira monta um slide (o que você vai reenquadrar)

- Cada slide é um `body > section` com `class="min-h-screen flex flex-col items-center justify-center ..."`: ocupa a tela e **centraliza** o conteúdo na horizontal (`items-center`).
- O conteúdo do slide é um único bloco filho direto da `section`: `<div class="w-full max-w-6xl">`, com título, `glass-card` (header, `.anim-stage`, pílulas) dentro.
- A animação é um `<svg viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid meet">` dentro do `.anim-stage`: ela se ajusta à largura do bloco.
- A navegação (barra de progresso no topo, botão de próximo, teclado) é fixa e continua funcionando.
- O tema e o `base.css` estão inline no `<head>`; o Tailwind vem por CDN.

A ideia do reenquadramento: trocar a centralização (`items-center`) por encostar à esquerda (`flex-start`) e estreitar o bloco do slide para **2/3 da largura**. Aí o conteúdo passa a viver nas colunas 1+2 e a coluna 3 fica livre.

## Passos

1. **Localizar o deck.** Ache o arquivo de origem na pasta do deck (`decks/<deck>/` ou `slides/<tema>/`). Padrão: `index.html`. Se o usuário pedir terços sobre a versão quadrada ou vertical, use `index-1x1.html` ou `index-9x16.html`.
2. **Copiar para o novo arquivo.** Copie o arquivo de origem para a versão `-thirds` na mesma pasta (mesma pasta = caminhos relativos de logo, vídeo e imagens continuam válidos). Ex.: `index.html` → `index-thirds.html`.
3. **Confirmar o seletor dos slides.** O padrão do Mira é `body > section`, e o bloco do slide é o filho direto `body > section > div`. Se este deck embrulhar os slides de outro jeito, ajuste o seletor do override para casar com a estrutura real.
4. **Injetar a moldura.** Logo antes de `</head>` do arquivo `-thirds`, **como último bloco de estilo** (depois do Tailwind e de qualquer bloco de formato `mira-squared`/`mira-vertical`, para vencer a especificidade), insira:

```html
<style id="mira-formato-thirds">
  /* Regra dos terços: o conteúdo do slide ocupa as colunas 1+2 (2/3 da
     largura) e a coluna 3 fica livre. É composição, não muda a proporção
     do quadro: aplica sobre 16:9, 1:1 ou 9:16. */
  :root {
    /* Lado da animação:
       flex-start = conteúdo à ESQUERDA, coluna da DIREITA livre (padrão)
       flex-end   = conteúdo à DIREITA,  coluna da ESQUERDA livre */
    --thirds-align: flex-start;
    --thirds-width: 66.667%; /* 2 de 3 colunas */
  }
  /* O slide deixa de centralizar na horizontal e encosta no lado da animação. */
  body > section {
    align-items: var(--thirds-align) !important;
  }
  /* O bloco do slide (título + animação + pílulas) ocupa só as colunas 1+2. */
  body > section > div {
    width: var(--thirds-width) !important;
    max-width: var(--thirds-width) !important;
  }
</style>
```

**Lado livre (padrão: direita).** A coluna livre é a da direita por padrão (`--thirds-align: flex-start`, conteúdo à esquerda). Se o usuário pedir para liberar a esquerda e jogar a animação para a direita, troque só a variável para `--thirds-align: flex-end`. É a única linha que muda; o resto da moldura continua igual.

5. **Verificar o encaixe.** Confira mentalmente que, com o bloco em 2/3 da largura, a coluna 3 fica realmente vazia (nem título nem pílulas invadem o terço da direita) e que a animação não estoura na horizontal. Como o `.anim-stage` agora é mais estreito, o SVG (`viewBox` 16:9, `meet`) encaixa pela largura e sobra uma faixa fina acima/abaixo: é esperado no ajuste leve. Se um slide específico ficar apertado, ajuste só a largura dele com `body > section:nth-of-type(N) > div { max-width: 60% !important; }` dentro do mesmo bloco.
6. **Reportar.** Informe o caminho do arquivo `-thirds`, qual coluna ficou livre (direita por padrão) e que ela está reservada para sobreposição na edição (texto, lower-third, apresentador). Lembre que a proporção do quadro não mudou: para gravar, use a mesma viewport do formato de origem (16:9, 1080x1080 ou 1080x1920).

## Observações honestas

- A animação **continua centralizada dentro do seu bloco de 2/3**, com o `viewBox` 16:9 e `preserveAspectRatio` original. O foco visual fica no centro das colunas 1+2, perto da linha de força entre a COL 2 e a COL 3. Se você quiser o assunto exatamente sobre essa linha de força, isso é decisão de autoria da própria animação (no `mira-animator`), não deste reenquadramento.
- Os elementos fixos da navegação (barra de progresso, botão de próximo) seguem presos à viewport, como nos outros formatos. Quando você grava na resolução do formato de origem, eles ficam no lugar certo.
- Esta skill mexe só no enquadramento. Ela **não** escreve nada na coluna livre: essa coluna é deixada limpa de propósito para você compor por cima na edição. Se quiser que o texto do slide migre para a coluna da direita (layout dividido em vez de terço livre), isso é outra composição, fora do escopo desta skill.

## Checklist

- [ ] Arquivo de origem (`index.html` / `index-1x1.html` / `index-9x16.html`) intacto.
- [ ] Novo arquivo `-thirds` criado na mesma pasta do deck.
- [ ] Bloco `<style id="mira-formato-thirds">` injetado como último estilo antes de `</head>`.
- [ ] Cada `body > section` com `align-items: flex-start` (ou `flex-end`, se a esquerda for o lado livre).
- [ ] Cada `body > section > div` estreitado para 2/3 da largura (`--thirds-width`).
- [ ] Coluna livre realmente vazia: título e pílulas não invadem o terço reservado.
- [ ] Navegação, animações, textos e cores intocados.
- [ ] Proporção do quadro preservada (a skill não muda 16:9, 1:1 nem 9:16).
- [ ] Nenhum travessão (—); acentuação correta.
