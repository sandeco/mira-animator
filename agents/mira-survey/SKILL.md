---
name: mira-survey
description: >-
  Cria um slide de ENQUETE AO VIVO: a plateia escaneia um QR-code, vota num
  Google Forms, e o resultado se atualiza em TEMPO REAL no slide (donut 3D
  girando ou barras). Recebe dois links — o de votação (vira o QR gerado local)
  e o da planilha de respostas (o slide lê a contagem via endpoint gviz/JSONP).
  Use SEMPRE que o usuário disser /mira-survey, enquete, enquete ao vivo,
  votação em tempo real, poll, resultado ao vivo no slide, QR de enquete, a
  plateia vota e o slide atualiza, tipo Mentimeter, tipo Slido, ou pedir um
  slide que mostra votação em tempo real. Para um QR sem votação use
  /mira-qrcode; para um gráfico estático use /mira-chart.
---

# Skill: Enquete ao vivo no slide (QR + resultado em tempo real)

Cria um slide onde a plateia escaneia um QR-code, vota num Google Forms, e o resultado aparece **se atualizando ao vivo** no slide (donut 3D girando ou barras). Casos típicos: pergunta ao público numa palestra, termômetro de opinião, quiz de abertura.

> **Fonte da verdade:** layout e técnica validados e congelados em `decks/teste-survey/index.html`. Os tamanhos e posições abaixo são EXATOS; em dúvida sobre uma medida, copie do artefato.

## O modelo mental

O Mira **não é dono da votação**. Ele precisa só de **uma fonte de dados que devolve a contagem atual e muda com o tempo**. Essa fonte é uma planilha do Google ligada a um Google Forms:

1. A plateia abre o **link de votação** (Google Forms) pelo QR e responde.
2. Cada resposta vira uma linha na **planilha** de respostas.
3. O slide lê a planilha a cada poucos segundos e redesenha o gráfico.

Então a skill recebe **dois links** e faz duas coisas com eles:

| Link | De onde vem | Para que serve no slide |
|---|---|---|
| **Votação** | `forms.gle/...` ou `docs.google.com/forms/...` | vira o **QR-code** (gerado localmente como SVG inline) |
| **Planilha** | `docs.google.com/spreadsheets/d/<ID>/...` | dela sai o **`SHEET_ID`**, que alimenta o **gráfico ao vivo** |

## Passo 0: ter os dois links (se faltar, PEÇA)

Antes de gerar qualquer coisa, confirme que tem os dois links. **Se faltar um ou os dois, pergunte e pare**, não invente nem use placeholder. Texto sugerido quando faltar:

> Para montar a enquete ao vivo eu preciso de dois links do seu Google Forms:
> 1. O **link de votação** (o `forms.gle/...` que a plateia abre para responder).
> 2. O **link da planilha de respostas** (em Respostas → ícone do Sheets → a planilha; o endereço `docs.google.com/spreadsheets/...`).
> Pode colar os dois aqui?

**A planilha precisa estar pública para leitura.** Lembre o usuário: abrir a planilha → **Compartilhar** → "Qualquer pessoa com o link" → **Leitor**. Sem isso o slide não lê os votos.

Extraia o `SHEET_ID` do link da planilha com o padrão `/spreadsheets/d/<ID>/`. Ex.: de
`https://docs.google.com/spreadsheets/d/1qAtv9OH2VXaHcieI5F4uI8ebYNUrzngbgSOPkcbMtNE/edit`
o ID é `1qAtv9OH2VXaHcieI5F4uI8ebYNUrzngbgSOPkcbMtNE`.

## Passo 1: verificar a leitura antes de montar

Confirme que a planilha está pública e leia o estado atual buscando o endpoint gviz (é exatamente o que o slide vai usar). No terminal:

```
curl -sL "https://docs.google.com/spreadsheets/d/<SHEET_ID>/gviz/tq?tqx=out:json" | head -c 800
```

- Se vier `google.visualization.Query.setResponse({...})` com `"status":"ok"`, está público e legível. O `label` da **última coluna** é a **pergunta** (vira o título do slide); os valores dessa coluna são as **opções**.
- Se vier HTML de login ou erro, a planilha **não está pública**: peça ao usuário para ajustar o compartilhamento e tente de novo.

Assuma **uma pergunta de múltipla escolha** (planilha com 2 colunas: carimbo de data/hora + resposta). O slide conta a **última coluna**. Se a planilha tiver várias perguntas, avise que o gráfico vai usar a última coluna e pergunte se é essa a desejada.

## A armadilha

**Nunca** use o endpoint "Publicar na web → CSV" (`/pub?output=csv`) para ler os votos: ele é **cacheado pelo Google por até ~5 minutos**, e o "tempo real" viraria mentira (votos com minutos de atraso). Use **só o `gviz`**, que lê o estado vivo. A leitura é por **JSONP** (injeção de `<script>` com `responseHandler`), que **fura o CORS** e funciona com o deck aberto por `file://`.

## Passo 2: gerar o QR-code localmente (jeito do /mira-qrcode)

O QR do **link de votação** é gerado **localmente** e embutido como **SVG inline**, sem API externa nem CDN. Receita (igual ao `/mira-qrcode`; **não** use `npx qrcode`, que trava no Windows):

1. Instale o pacote uma vez numa pasta temp reaproveitável (pule se já existir):
   ```
   npm install qrcode --no-save --prefix "<pasta-temp>"
   ```
2. Gere o SVG (troque `LINK_VOTACAO` pelo link de votação exato):
   ```
   node -e "require('qrcode').toString('LINK_VOTACAO',{type:'svg',errorCorrectionLevel:'M',margin:0,color:{dark:'#0a0a0a',light:'#ffffff'}},(e,s)=>{if(e)throw e;process.stdout.write(s)})"
   ```
3. Cole o `<svg>` inteiro dentro do `.qr-card` (substituindo o SVG de exemplo do template). Mantenha o `viewBox` e o `shape-rendering="crispEdges"`. O CSS (`.qr-card svg{width:390px;height:390px}`) controla o tamanho. Acrescente o comentário `<!-- QR gerado localmente (pacote npm qrcode, ECC M) para LINK_VOTACAO -->`.

## A disposição (medidas EXATAS)

Layout em duas colunas (`grid-template-columns: 1fr 520px`), tema escuro, laranja da marca `#FF904D`:

- **Esquerda (gráfico):** a **pergunta centralizada** no topo (texto 42px) + linha "ao vivo" com bolinha pulsando; abaixo, o gráfico grande e centralizado.
- **Donut 3D:** wrapper de **562px**, inclinado para trás (`rotateX(50deg)`) com perspectiva, **girando devagar** (uma volta a cada 36s), com **profundidade real** (9 camadas SVG empilhadas em `translateZ`, as de baixo mais escuras = a parede lateral). O donut sobe **50px** (`translateY(-50px)`). No centro, o **total de votos** (número 86px, parado). Abaixo do donut, a **legenda** centralizada (cor + opção + contagem + %).
- **Direita (QR):** card escuro arredondado, conteúdo subido (centralizado com `padding-bottom:200px`, ~80px acima do centro): "**Vote agora**" (39px, "agora" em laranja), a instrução "Aponte a câmera do celular para o QR-code" (23px), e o **QR num cartão branco** de **390px**. **Nunca** mostre o link de votação por extenso em lugar nenhum do slide, só o QR.

Não recalcule no olho; gere a partir do template abaixo.

## Os dois tipos de gráfico

A skill gera **um dos dois** (pergunte ao usuário se ele não disser; o padrão é o donut):

- **Donut 3D (padrão):** o que está no template canônico abaixo.
- **Barras:** mesma esquerda (pergunta + ao vivo) e mesma direita (QR), trocando só o miolo do gráfico por barras horizontais animadas (ver "Variante: barras"). Use barras quando o usuário pedir, ou quando houver muitas opções (5+), onde o donut fica difícil de ler.

A camada de dados (leitura gviz + animação) é **idêntica** nos dois; muda só o desenho.

## Template canônico (donut 3D): copie e preencha

O template completo (donut 3D, um arquivo HTML standalone) está em
[`references/survey-donut-template.html`](references/survey-donut-template.html).
Copie-o para o `index.html` do deck. Os **dois únicos pontos a preencher** são: o
`SHEET_ID` no CONFIG e o `<svg>` do QR dentro do `.qr-card` (Passo 2). O título sai
sozinho do `label` da planilha.

## Variante: gráfico de barras

Quando o usuário pedir barras, parta do mesmo template e faça SÓ estas trocas (a camada de dados não muda):

**1. CSS:** acrescente o bloco de barras (pode remover o CSS do donut `.pie-wrap`/`.pie3d`/`.center-total`/`.legend`, ou deixar, não atrapalha):

```css
  .bars{ width:100%; max-width:880px; display:flex; flex-direction:column; gap:30px; }
  .bar-head{ display:flex; justify-content:space-between; align-items:baseline; margin-bottom:10px; }
  .bar-name{ font-size:30px; font-weight:600; }
  .bar-meta{ font-size:26px; color:var(--muted); font-variant-numeric:tabular-nums; }
  .bar-meta b{ color:var(--ink); }
  .bar-track{ height:34px; background:#22222b; border-radius:10px; overflow:hidden; }
  .bar-fill{ height:100%; border-radius:10px; width:0; }
```

**2. Markup:** troque o miolo de `.chartrow` (o `.pie-wrap` + a `.legend`) por:

```html
      <div class="chartrow">
        <div class="bars" id="bars"><div class="empty">Aguardando votos...</div></div>
      </div>
```

**3. JS:** remova a IIFE `buildLayers` (não há camadas 3D) e troque a função `draw` do donut por esta `draw` de barras (a largura é relativa ao líder; o número e o % são sobre o total):

```js
  function draw(){
    var opts = Object.keys(displayed).filter(function(o){ return (target[o]||0)>0 || displayed[o]>0.01; });
    var box = document.getElementById("bars");
    var ord = opts.slice().sort(function(a,b){ return (target[b]||0)-(target[a]||0); });
    if(ord.length === 0){ box.innerHTML = '<div class="empty">Aguardando votos...</div>'; return; }
    var totalReal = ord.reduce(function(s,o){ return s+(target[o]||0); },0) || 1;
    var maxD = 0.0001; opts.forEach(function(o){ if(displayed[o]>maxD) maxD = displayed[o]; });
    var html = "";
    ord.forEach(function(o){
      var n = target[o]||0, pct = Math.round(100*n/totalReal), w = Math.max(0, displayed[o]/maxD*100);
      html += '<div class="bar"><div class="bar-head"><span class="bar-name">'+escapeHtml(o)+'</span>'+
              '<span class="bar-meta"><b>'+n+'</b> · '+pct+'%</span></div>'+
              '<div class="bar-track"><div class="bar-fill" style="width:'+w.toFixed(1)+'%;background:'+colorMap[o]+'"></div></div></div>';
    });
    box.innerHTML = html;
  }
```

## Passos

1. **Ter os dois links.** Link de votação + link da planilha. Se faltar qualquer um, **pergunte e pare** (Passo 0). Lembre o usuário de deixar a planilha "qualquer pessoa com o link → Leitor".
2. **Extrair o `SHEET_ID`** do link da planilha e **verificar o gviz** com `curl` (Passo 1). Se não estiver público, peça o ajuste de compartilhamento.
3. **Escolher o gráfico.** Donut (padrão) ou barras. Se o usuário não disse e há 5+ opções, sugira barras.
4. **Gerar o QR localmente** (Passo 2) e colar o `<svg>` inline no `.qr-card`.
5. **Montar o slide** a partir do template canônico (ou da variante de barras), preenchendo `SHEET_ID` e o QR. Salvar em `decks/<nome-da-enquete>/index.html`.
6. **Reportar.** Caminho do arquivo; o tipo de gráfico; lembrar que o slide precisa de internet (lê a planilha ao vivo) e que abre por duplo-clique (`file://`), sem servidor; e que para trocar a pergunta basta editar o Form (a planilha e o slide acompanham sozinhos).

## Checklist

- [ ] Os dois links foram fornecidos; se faltou, o agente pediu antes de gerar.
- [ ] Planilha pública (Leitor); `gviz` verificado e devolvendo `status: ok`.
- [ ] Leitura por **gviz + JSONP** (funciona por `file://`); **nunca** "Publicar na web → CSV" (cache de 5 min).
- [ ] QR gerado **localmente** (pacote `qrcode`), SVG inline; **não** usou `npx qrcode`, CDN ou API externa.
- [ ] O **link de votação não aparece por extenso** no slide; só o QR.
- [ ] Disposição EXATA: pergunta centralizada no topo, donut 562px girando 3D subido 50px (ou barras), total 86px no centro, legenda centralizada embaixo; QR 390px no painel direito subido.
- [ ] Laranja `#FF904D` como primeira cor; tema escuro; donut gira sozinho (loop interno).
- [ ] Texto revisado, acentuação correta (segue `agents/_shared/idioma.md`); nenhum travessão (—).
- [ ] Salvo em `decks/<deck>/`; nada escrito em fontes vinculadas.
