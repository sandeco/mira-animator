---
name: mira-asset-scout
description: >-
  Decidir a origem de cada elemento visual de uma cena antes de alguém desenhá-lo: o que é simples
  vira desenho procedural, o que é complexo (figura humana, mão, rosto, animal, veículo, anatomia
  articulada) vira SVG de fonte aberta buscado na web e embutido inline, e o que não se acha vira um
  pedido curto e específico ao autor. Existe porque agente de animação insiste em desenhar à mão o
  que não sabe desenhar, e entrega boneco de trapézio com cabeça de círculo. Usar antes do
  /mira-animator e do /mira-cine-animator, quando a cena tiver referente concreto, ou quando o autor
  disser que os desenhos ficaram toscos. Não usar para animar o SVG (isso é /mira-svg-animator), nem
  para transformar uma forma em outra (/mira-svg-morph, /mira-icon-morph), nem para gerar imagem
  (/mira-image).
---

# MIRA Asset Scout

Antes de desenhar, decida de onde o elemento vem. Esta skill não anima e não escreve cena: ela
classifica os referentes de uma cena e devolve, para cada um, **desenhar**, **buscar** ou **pedir**.

## Por que ela existe

Um deck cinematográfico saiu com a cidade excelente e as pessoas horríveis. A cidade é procedural:
retângulos sorteados com semente, janelas, antenas, silhueta com idade. Repetição e silhueta leem
bem. A pessoa era isto, uma função inteira:

```js
/* ANTI-EXEMPLO. Não faça isto. */
gg.append('path').attr('d', 'M -16 0 L -13 -46 C -13 -58 -8 -64 0 -64 C 8 -64 13 -58 13 -46 L 16 0 Z');
gg.append('circle').attr('cx', 0).attr('cy', -76).attr('r', 13);
```

Trapézio com bola em cima. O agente sabia a regra do ícone flat, tinha a regra na frente, e ainda
assim desenhou à mão, porque a regra dizia "prefira" e prefência se ignora. Aqui não tem preferência:
tem lista.

## A trava: o que é PROIBIDO desenhar à mão

Se o referente da cena está nesta lista, `path` escrito à mão está **fora**. Não há exceção por
"vai ser pequeno", "é só silhueta" ou "é estilizado":

1. **Figura humana** inteira ou parcial: pessoa em pé, andando, sentada, multidão, silhueta de gente.
2. **Mão, dedo, braço, perna, pé.**
3. **Rosto**, cabeça com feições, expressão, olho, boca.
4. **Animal** de qualquer espécie.
5. **Veículo** reconhecível: carro, ônibus, avião, navio, bicicleta, foguete com estágios.
6. **Anatomia articulada** em geral: esqueleto, órgão, músculo, planta com folhagem.
7. **Objeto de uso com muitos detalhes**: instrumento musical, ferramenta, mobília, aparelho.
8. **Marca, logo ou personagem de terceiros.** Aqui a saída nunca é buscar: é arte original ou nada.

Fora da lista e com geometria descritível em uma frase ("uma torre de retângulos", "um cabo em
curva", "uma grade de células", "uma planta baixa em linhas"), desenhe. Procedural é melhor mesmo:
aceita semente, variação, animação parte a parte, e é o que fez a cidade funcionar.

## As três saídas

### DESENHAR

Geometria simples, repetição, abstração legítima (fluxo, sinal, energia, dado, malha, planta).
Segue as regras do `/mira-animator`. Nada a fazer aqui.

### BUSCAR

O referente está na lista e existe pronto em fonte aberta.

**Primeiro, garanta que você consegue buscar.** Em vários harnesses as ferramentas de web chegam
diferidas: o nome aparece, o schema não, e a chamada falha. Carregue antes de tentar, com
`ToolSearch` na consulta `select:WebSearch,WebFetch`. Se elas não existirem nem depois disso, você
não tem BUSCAR: vá para PEDIR e **diga o motivo na primeira linha do pedido**, "não tenho acesso à
web nesta sessão". Buscar em silêncio, falhar em silêncio e desenhar à mão assim mesmo é o pior dos
três caminhos, e é o que esta skill existe para impedir.

**Fontes, nesta ordem.** Vá para a mais específica que resolva:

| Necessidade | Fonte | Licença |
|---|---|---|
| Ícone de objeto, ação, símbolo | Google Material Symbols (eixo *fill*) | Apache-2.0 |
| Qualquer ícone, catálogo enorme | API do Iconify | varia por set, confira |
| Figura humana ilustrada, cena com pessoas | unDraw | livre, sem atribuição |
| Pessoa montável (pose, roupa, cabelo) | Humaaans, Open Peeps | CC0 |
| Clipart geral, animal, veículo, objeto | Openclipart | CC0 |
| Silhueta científica, organismo | PhyloPic | CC0 ou CC-BY, confira item a item |

**Só MIT, Apache-2.0, CC0 ou CC-BY.** Nada de "gratuito para uso pessoal", nada de site que exige
cadastro para baixar, nada de arte com IP protegida. Se a licença não estiver escrita na página,
trate como proibida e vá para PEDIR.

**Regras de embutir, e são duras porque o deck abre por `file://`:**

- **Inline, sempre.** O SVG entra como `path`/`g` dentro do `<svg>` da cena, ou como `<symbol>` num
  `<defs>` do deck. `<img src>` remoto, CDN, `<use href>` externo e `fetch` estão proibidos: o deck
  tem que abrir offline com duplo clique.
- **Guarde a fonte** em `decks/<slug>/references/assets/<nome>.svg`, com o link de origem e a licença
  no topo em comentário. É o que permite refazer sem buscar de novo.
- **Normalize:** remova fundo opaco, `width`/`height` fixos e estilos inline do exportador; deixe
  `viewBox` limpo; prefira caminho único quando o elemento não se move por partes.
- **Recolore para os tokens do deck** (`--mira-primary`, `--mira-text`, `--rev-*`). Cor de fora do
  tema é erro, mesmo que a original seja bonita.
- **Se a cena move uma PARTE** (o braço acena, a roda gira), a parte precisa ser elemento separado
  com `id`. Path único fundido não anima parte, e quem separa por `clipPath` ou editando o `d` é o
  `/mira-svg-animator`. Deixe isso escrito no briefing.
- **Atribuição no `CREDITS.md`** do deck sempre que a licença pedir (CC-BY, Apache-2.0). Uma linha:
  nome do asset, autor, link, licença.

### PEDIR

Não achou em fonte aberta, ou o referente é marca/personagem de terceiros, ou a cena precisa de algo
específico demais (o rosto de uma pessoa real, o produto do cliente).

**Pare e peça, com pedido curto e fechado.** Não abra pergunta genérica. O formato:

> Cena 04 precisa de **uma pessoa de pé, de perfil, olhando para cima**. Não achei equivalente em
> fonte aberta.
> Escolha uma:
> **(a)** me passe o SVG, salvo em `decks/<slug>/references/assets/`;
> **(b)** troco por silhueta abstrata (um vulto sem feições, que a grade de cor sustenta);
> **(c)** corto a figura e a cena passa a ser sobre o objeto, não sobre quem olha.
> Sem resposta, sigo pela (b).

Três coisas fazem esse pedido valer: ele nomeia a cena, descreve o que falta em uma frase, e tem
plano de continuidade. Um pedido sem plano B trava o deck inteiro por um boneco.

## Entrega

Uma tabela, uma linha por referente, e nada mais. Ela vai colada no briefing da cena, e é curta de
propósito porque quem desenha lê pouco:

| Cena | Referente | Saída | Origem / o que fazer |
|---|---|---|---|
| 01 | skyline de prédios | DESENHAR | procedural, semente fixa |
| 04 | pessoa de pé | BUSCAR | Openclipart CC0, inline, recolorir para `--rev-blueprint` |
| 07 | mão apontando | PEDIR | não achei; plano B é seta |

Se todos derem DESENHAR, diga isso em uma linha e saia. Cena sem referente concreto não precisa
desta skill.

## Onde ela entra

Depois do `/mira-scene-brief` e **antes** do `/mira-animator` ou do `/mira-cine-animator`. O briefing
diz quais objetos a cena tem com o nome real; esta skill diz de onde cada um vem. Em deck de um slide
só, roda direto sobre o Motion Score.

Em deck já pronto, roda no diagnóstico: leia as funções de desenho do `index.html`, ache as que caem
na lista de proibidos e devolva a tabela do que precisa ser substituído.

## Quando NÃO usar

| Caso | Use |
|---|---|
| Dar movimento a um SVG que já existe | `/mira-svg-animator` |
| Uma forma virando outra | `/mira-svg-morph`, `/mira-icon-morph` |
| Gerar imagem nova (bitmap, IA) | `/mira-image`, `/mira-image-prompt` |
| Organizar a pasta de material do deck | `/mira-references` |
| Escrever a animação | `/mira-animator` |
