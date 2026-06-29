---
name: mira-squared
description: >-
  Gera uma versão QUADRADA (1:1, 1080x1080) de um deck do Mira, a partir do deck
  16:9 original, OU cria slides quadrados DO ZERO na geometria nativa quando não
  há deck de origem, para vídeo em formato quadrado (feed do Instagram,
  LinkedIn, etc.). Na conversão, não toca no arquivo original: cria um novo
  arquivo index-1x1.html ao lado, fixando cada slide em 1080x1080 e reduzindo os
  espaços laterais, com moldura fixa e ajuste leve. O slide fica centralizado
  por padrão, com opção de alinhar à esquerda ou à direita. Use SEMPRE que o
  usuário disser /mira-squared, versão quadrada, deixa quadrado, formato 1:1,
  1080x1080, apresentação quadrada, corta os lados, reduz os espaços laterais,
  vídeo quadrado, cria um slide quadrado, novo slide 1:1, ou pedir o deck ou um
  slide novo num formato quadrado.
---

# Skill: Versão Quadrada do Deck (1:1, 1080x1080)

Transforma um deck 16:9 do Mira numa versão **quadrada de 1080x1080**, reduzindo os espaços laterais de todos os slides. Útil para gravar a apresentação como vídeo quadrado. A abordagem é **moldura fixa com ajuste leve**: o conteúdo já é centralizado, então o quadrado corta a sobra lateral e encaixa o bloco central. Tem dois modos:

- **Modo conversão (padrão quando existe deck 16:9):** os passos abaixo.
- **Modo criação nativa (quando NÃO existe deck de origem, ou o usuário pede um slide novo já quadrado):** veja a seção "Criação do zero na geometria nativa".

## Criação do zero na geometria nativa

Quando não houver deck 16:9 de origem, ou o usuário pedir "cria um slide quadrado sobre X", NÃO crie um 16:9 intermediário para converter depois. A animação nasce pensada para o quadrado:

1. **Herde as regras criativas do `agents/mira-animator/SKILL.md`:** Regra Zero (loop interno obrigatório), liberdade criativa de metáfora, regra de idioma, regra de título (sem ícone, máximo 6 palavras), estrutura do card com glass-card. Tudo vale igual.
2. **Geometria nativa desde a concepção:** o arquivo já nasce como `index-1x1.html`, com o bloco `<style id="mira-formato-1x1">` desta skill no head. A animação usa `viewBox` quadrado (ex.: `W = 960, H = 960`) casando com um palco quadrado ou quase quadrado, sem letterbox, em vez do 16:9 que sobra faixa.
3. **Composição pensada para o 1:1:** metáforas radiais e centradas (orbital, hub-and-spoke, pulso central, grade 2x2) rendem mais no quadrado que fileiras largas. O assunto ocupa a maior parte do palco, centralizado.
4. Se o deck quadrado (`index-1x1.html`) já existir, o slide novo é adicionado nele, no padrão dos demais.

## REGRA DE IDIOMA

Siga `agents/_shared/idioma.md`. Texto visível em português correto. Proibido travessão (—): use vírgula ou dois-pontos.

## Regra de Ouro: nunca destrua o original

- O deck 16:9 (`index.html`) **permanece intacto**.
- Você cria um **arquivo novo** ao lado: `index-1x1.html`.
- Nunca edite a lógica das animações, os textos, as cores ou a navegação. A transformação é só de **enquadramento** (CSS de moldura).

## Como o Mira monta um slide (o que você vai reenquadrar)

- Cada slide é um `body > section` com `class="min-h-screen flex flex-col items-center justify-center ..."`: ocupa a tela inteira e centraliza o conteúdo.
- O conteúdo central usa `max-w-6xl` ou `max-w-5xl` com `px-6`.
- A navegação (barra de progresso no topo, botão de próximo no canto, teclado) é fixa e continua funcionando.
- O tema e o `base.css` estão inline no `<head>`; o Tailwind vem por CDN.

## Passos

1. **Localizar o deck.** Ache o `index.html` do deck (em `decks/<deck>/` ou `slides/<tema>/`). Se houver mais de um deck e o usuário não disser qual, pergunte.
2. **Copiar para o novo arquivo.** Copie `index.html` para `index-1x1.html` na mesma pasta (mesma pasta = os caminhos relativos de logo, vídeo e imagens continuam válidos).
3. **Confirmar o seletor dos slides.** O padrão do Mira é `body > section`. Se este deck embrulhar os slides de outro jeito, ajuste o seletor do override para casar com a estrutura real.
4. **Injetar a moldura.** Logo antes de `</head>` do `index-1x1.html`, insira este bloco (depois do Tailwind, para vencer a especificidade):

```html
<style id="mira-formato-1x1">
  /* Versão quadrada 1080x1080, moldura fixa */
  :root {
    --fmt-w: 1080px;
    --fmt-h: 1080px;
    --fmt-align: center; /* posição do slide: center (padrão), flex-start (esquerda), flex-end (direita) */
  }
  html { background: var(--mira-bg, #000); }
  /* Centraliza cada slide na horizontal via flex.
     Não usar margin:auto na body: o Preflight do Tailwind (Play CDN) injeta
     body{margin:0} em runtime, entra por último na cascata e venceria o margin:auto,
     prendendo o slide à esquerda. */
  body {
    background: var(--mira-bg, #000);
    display: flex;
    flex-direction: column;
    align-items: var(--fmt-align);
  }
  body > section {
    width: var(--fmt-w) !important;
    height: var(--fmt-h) !important;
    min-height: var(--fmt-h) !important;
    overflow: hidden;
  }
  /* reduz o excesso lateral: o conteúdo passa a usar a largura do quadrado */
  body > section .max-w-6xl,
  body > section .max-w-5xl { max-width: 1000px !important; }
  /* palco coerente com a altura do quadrado (valor fixo, não depende da janela) */
  .anim-stage { height: 560px !important; }
</style>
```

**Posição do slide (padrão: centro).** O slide fica centralizado por padrão. Se o usuário pedir o slide encostado num lado, troque só a variável `--fmt-align`: `center` (padrão), `flex-start` (esquerda) ou `flex-end` (direita). É a única linha que muda; o resto da moldura continua igual.

5. **Verificar o encaixe.** Confira mentalmente que, num quadro 1080x1080, cada slide cabe sem cortar conteúdo na vertical (título + card + pílulas) e que o conteúdo não estoura na horizontal. Se um slide específico ficar apertado na altura, reduza só o palco dele (ex.: `#st-XXXX { height: 480px !important; }`) dentro do mesmo bloco.
6. **Reportar.** Informe o caminho `index-1x1.html`, a resolução alvo 1080x1080, e como gravar: ajuste a viewport do navegador ou da ferramenta de captura (OBS browser source, device toolbar, Puppeteer) para exatamente 1080x1080. Como o arquivo já tem tamanho fixo, ele bate com o quadro.

## Observações honestas

- Os elementos fixos da navegação (barra de progresso, botão de próximo) ficam presos à viewport. Quando você grava na resolução exata 1080x1080, viewport e moldura coincidem e eles ficam no lugar certo. Numa janela maior só para pré-visualizar, eles podem encostar na borda da janela, não da moldura. É só cosmético da pré-visualização.
- A animação tem `viewBox` 16:9. Dentro do quadrado ela aparece centralizada com `preserveAspectRatio`, podendo sobrar uma faixa fina acima e abaixo. Isso é esperado no ajuste leve.

## Checklist

- [ ] `index.html` original intacto.
- [ ] `index-1x1.html` criado na mesma pasta do deck.
- [ ] Bloco `<style id="mira-formato-1x1">` injetado antes de `</head>`.
- [ ] Cada `body > section` fixado em 1080x1080.
- [ ] Slide centralizado por padrão (`--fmt-align: center`), via flex na `body`, não por `margin:auto`.
- [ ] Espaços laterais reduzidos (max-width do conteúdo trazido para a largura do quadrado).
- [ ] Navegação, animações, textos e cores intocados.
- [ ] Nenhum slide corta conteúdo na vertical num quadro 1080x1080.
- [ ] Nenhum travessão (—); acentuação correta.
