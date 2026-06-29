---
name: mira-survey
description: >-
  Cria um slide de ENQUETE AO VIVO no Mira: a plateia escaneia um QR-code, vota
  num Google Forms, e o resultado se atualiza em TEMPO REAL no slide (donut 3D
  girando, padrão, ou gráfico de barras). Recebe dois links: o de VOTAÇÃO
  (forms.gle/...), que vira o QR gerado localmente como SVG inline, e o da
  PLANILHA de respostas (docs.google.com/spreadsheets/...), de onde o slide lê a
  contagem. A leitura é pelo endpoint gviz por JSONP a cada poucos segundos,
  então funciona até por file:// sem erro de CORS; nunca usa o Publicar na web
  CSV (cacheado por minutos). A planilha precisa estar pública. Se faltar um dos
  links, o agente pede antes de gerar. Use SEMPRE que o usuário disser
  /mira-survey, enquete, enquete ao vivo, votação em tempo real, poll, resultado
  ao vivo no slide, QR de enquete, a plateia vota e o slide atualiza, tipo
  Mentimeter, tipo Slido, ou pedir um slide que mostra votação em tempo real.
  Para um QR sem votação use /mira-qrcode; para um gráfico estático use
  /mira-chart.
---

# Skill: Enquete ao vivo no slide (QR + resultado em tempo real)

Cria um slide onde a plateia escaneia um QR-code, vota num Google Forms, e o resultado aparece **se atualizando ao vivo** no slide (donut 3D girando ou barras). Casos típicos: pergunta para o público durante uma palestra, termômetro de opinião, quiz de abertura.

> **Fonte da verdade:** layout e técnica validados com o usuário e congelados no artefato `decks/teste-survey/index.html`. Os tamanhos e posições abaixo são EXATOS, não improvise: foram ajustados um a um e aprovados. Quando em dúvida sobre qualquer medida, copie do artefato.

## O modelo mental (leia, é o ponto central)

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

## A ARMADILHA (não caia nela)

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

## A disposição (EXATA, validada com o usuário)

Layout em duas colunas (`grid-template-columns: 1fr 520px`), tema escuro, laranja da marca `#FF904D`:

- **Esquerda (gráfico):** a **pergunta centralizada** no topo (texto 42px) + linha "ao vivo" com bolinha pulsando; abaixo, o gráfico grande e centralizado.
- **Donut 3D:** wrapper de **562px**, inclinado para trás (`rotateX(50deg)`) com perspectiva, **girando devagar** (uma volta a cada 36s), com **profundidade real** (9 camadas SVG empilhadas em `translateZ`, as de baixo mais escuras = a parede lateral). O donut sobe **50px** (`translateY(-50px)`). No centro, o **total de votos** (número 86px, parado). Abaixo do donut, a **legenda** centralizada (cor + opção + contagem + %).
- **Direita (QR):** card escuro arredondado, conteúdo subido (centralizado com `padding-bottom:200px`, ~80px acima do centro): "**Vote agora**" (39px, "agora" em laranja), a instrução "Aponte a câmera do celular para o QR-code" (23px), e o **QR num cartão branco** de **390px**. **Nunca** mostre o link de votação por extenso em lugar nenhum do slide, só o QR.

Essas medidas são fixas. Não as recalcule "no olho": gere a partir do template abaixo.

## Os dois tipos de gráfico

A skill gera **um dos dois** (pergunte ao usuário se ele não disser; o padrão é o donut):

- **Donut 3D (padrão):** o que está no template canônico abaixo.
- **Barras:** mesma esquerda (pergunta + ao vivo) e mesma direita (QR), trocando só o miolo do gráfico por barras horizontais animadas (ver "Variante: barras"). Use barras quando o usuário pedir, ou quando houver muitas opções (5+), onde o donut fica difícil de ler.

A camada de dados (leitura gviz + animação) é **idêntica** nos dois; muda só o desenho.

## Template canônico (donut 3D): copie e preencha

Gere o slide a partir deste HTML. Os **dois únicos pontos a preencher** são: o `SHEET_ID` no CONFIG, e o `<svg>` do QR dentro do `.qr-card` (Passo 2). O título sai sozinho do `label` da planilha.

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Mira - Enquete em tempo real</title>
<style>
  :root{ --bg:#15151a; --panel:#1d1d24; --ink:#f4f4f6; --muted:#9a9aa6; --orange:#FF904D; --line:#2a2a33; }
  *{box-sizing:border-box; margin:0; padding:0;}
  html,body{height:100%;}
  body{ background:var(--bg); color:var(--ink); font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; overflow:hidden; }
  .stage{ height:100vh; display:grid; grid-template-columns:1fr 520px; gap:48px; padding:56px 64px; align-items:center; }
  .left{height:100%; display:flex; flex-direction:column;}
  .q{font-size:42px; font-weight:700; line-height:1.15; margin-bottom:8px; text-align:center;}
  .live{display:flex; align-items:center; justify-content:center; gap:10px; color:var(--muted); font-size:18px;}
  .dot{width:11px; height:11px; border-radius:50%; background:#39d353; box-shadow:0 0 0 0 rgba(57,211,83,.6); animation:pulse 1.6s infinite;}
  .dot.off{background:#888; animation:none; box-shadow:none;}
  @keyframes pulse{0%{box-shadow:0 0 0 0 rgba(57,211,83,.55)}70%{box-shadow:0 0 0 12px rgba(57,211,83,0)}100%{box-shadow:0 0 0 0 rgba(57,211,83,0)}}
  .chartrow{flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:34px;}
  .pie-wrap{position:relative; flex:0 0 auto; width:562px; height:562px; perspective:1400px; transform:translateY(-50px);}
  svg{display:block;}
  .pie3d{position:absolute; inset:0; transform-style:preserve-3d; animation:spin3d 36s linear infinite;}
  .pie3d .layer{position:absolute; inset:0; width:100%; height:100%;}
  @keyframes spin3d{from{transform:rotateX(50deg) rotateZ(0deg);}to{transform:rotateX(50deg) rotateZ(360deg);}}
  .center-total{position:absolute; inset:0; z-index:5; display:flex; flex-direction:column; align-items:center; justify-content:center; pointer-events:none;}
  .center-total b{font-size:86px; line-height:1; color:var(--ink);}
  .center-total span{font-size:28px; color:var(--muted); margin-top:4px; text-transform:uppercase; letter-spacing:.08em;}
  .legend{display:flex; flex-direction:column; gap:14px; width:300px;}
  .leg{display:flex; align-items:center; gap:14px; font-size:24px;}
  .sw{width:18px; height:18px; border-radius:5px; flex:0 0 auto;}
  .leg .name{flex:1; font-weight:600;}
  .leg .num{color:var(--muted); font-weight:600;}
  .leg .pct{width:64px; text-align:right; font-variant-numeric:tabular-nums;}
  .empty{color:var(--muted); font-size:22px;}
  .right{ background:var(--panel); border:1px solid var(--line); border-radius:28px; padding:40px 36px 200px; display:flex; flex-direction:column; align-items:center; gap:22px; height:100%; justify-content:center; }
  .right h2{font-size:39px; font-weight:700; text-align:center;}
  .right p{color:var(--muted); font-size:23px; text-align:center; line-height:1.4;}
  .qr-card{background:#fff; padding:18px; border-radius:20px; line-height:0;}
  .qr-card svg{width:390px; height:390px; display:block;}
  .accent{color:var(--orange);}
</style>
</head>
<body>
  <div class="stage">
    <div class="left">
      <div class="head">
        <div class="q" id="question">Carregando enquete...</div>
        <div class="live"><span class="dot" id="dot"></span><span id="status">conectando...</span></div>
      </div>
      <div class="chartrow">
        <div class="pie-wrap">
          <div class="pie3d" id="pie3d"></div>
          <div class="center-total"><b id="total">0</b><span>votos</span></div>
        </div>
        <div class="legend" id="legend"><div class="empty">Aguardando votos...</div></div>
      </div>
    </div>
    <div class="right">
      <h2>Vote <span class="accent">agora</span></h2>
      <p>Aponte a câmera do celular<br>para o QR-code</p>
      <div class="qr-card">
        <!-- QR gerado localmente (pacote npm qrcode, ECC M) para LINK_VOTACAO -->
        <!-- COLE AQUI o <svg> do QR gerado no Passo 2 (substitua este comentário) -->
      </div>
    </div>
  </div>

<script>
  // ===== CONFIG (preencher o SHEET_ID) =====
  var SHEET_ID  = "COLE_O_SHEET_ID_AQUI";
  var INTERVALO = 3000; // ms entre leituras
  var PALETTE   = ["#FF904D","#4DC4D9","#7DD957","#FFD24D","#FF6B6B","#5C9DFF","#FF9EC4"];

  // ===== camadas 3D do donut (extrusao por empilhamento) =====
  var LAYERS = 9, DEPTH = 36, layerEls = [];
  (function buildLayers(){
    var pie3d = document.getElementById("pie3d");
    for(var i=0;i<LAYERS;i++){
      var el = document.createElementNS("http://www.w3.org/2000/svg","svg");
      el.setAttribute("viewBox","0 0 300 300");
      el.setAttribute("class","layer");
      el.style.transform = "translateZ(" + (-(i*(DEPTH/(LAYERS-1)))) + "px)";
      el.style.filter = "brightness(" + (1 - 0.55*(i/(LAYERS-1))).toFixed(3) + ")";
      pie3d.appendChild(el);
      layerEls.push(el);
    }
  })();

  var target = {}, displayed = {}, colorMap = {}, lastOk = 0;

  // ===== Leitura via gviz (JSONP, sem CORS, funciona por file://) =====
  function poll(){
    var s = document.createElement("script");
    s.src = "https://docs.google.com/spreadsheets/d/" + SHEET_ID +
            "/gviz/tq?tqx=out:json;responseHandler:miraPoll&headers=1&_=" + Date.now();
    s.onerror = function(){ setStatus(false); s.remove(); };
    s.onload  = function(){ s.remove(); };
    document.body.appendChild(s);
  }
  window.miraPoll = function(resp){
    if(!resp || !resp.table){ setStatus(false); return; }
    var cols = resp.table.cols || [];
    var ansIdx = cols.length - 1;               // última coluna = resposta
    if(cols[ansIdx] && cols[ansIdx].label){ document.getElementById("question").textContent = cols[ansIdx].label; }
    var rows = resp.table.rows || [], counts = {};
    for(var i=0;i<rows.length;i++){
      var c = rows[i].c && rows[i].c[ansIdx], v = c && c.v;
      if(v!==null && v!==undefined && v!==""){ counts[v] = (counts[v]||0) + 1; }
    }
    target = counts;
    Object.keys(counts).sort().forEach(function(opt){
      if(!(opt in colorMap)) colorMap[opt] = PALETTE[Object.keys(colorMap).length % PALETTE.length];
      if(!(opt in displayed)) displayed[opt] = 0;
    });
    lastOk = Date.now(); setStatus(true);
  };
  function setStatus(ok){
    var dot = document.getElementById("dot"), st = document.getElementById("status");
    if(ok){ dot.className = "dot"; st.textContent = "ao vivo"; }
    else  { dot.className = "dot off"; st.textContent = "sem conexao com a planilha"; }
  }

  // ===== Animação (lerp suave) =====
  function tick(){
    var keys = {};
    Object.keys(target).forEach(function(k){keys[k]=1;});
    Object.keys(displayed).forEach(function(k){keys[k]=1;});
    Object.keys(keys).forEach(function(o){
      var t = target[o]||0, d = displayed[o]||0;
      d = d + (t-d)*0.15; if(Math.abs(t-d) < 0.01) d = t; displayed[o] = d;
    });
    draw();
    requestAnimationFrame(tick);
  }

  // ===== Desenho do DONUT =====
  function draw(){
    var cx=150, cy=150, r=140, hole=86;
    var opts = Object.keys(displayed).filter(function(o){ return (target[o]||0)>0 || displayed[o]>0.01; });
    var total = opts.reduce(function(s,o){ return s + displayed[o]; }, 0);
    var svg = "";
    if(total <= 0.0001){
      svg = '<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="#2a2a33" stroke-width="2"/>';
    } else {
      var ang = -Math.PI/2;
      opts.slice().sort().forEach(function(o){
        var frac = displayed[o]/total; if(frac <= 0) return;
        if(frac >= 0.9999){ svg += '<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="'+colorMap[o]+'"/>'; return; }
        var a0=ang, a1=ang+frac*2*Math.PI; ang=a1;
        var x0=cx+r*Math.cos(a0), y0=cy+r*Math.sin(a0), x1=cx+r*Math.cos(a1), y1=cy+r*Math.sin(a1);
        var large=(a1-a0)>Math.PI?1:0;
        svg += '<path d="M'+cx+' '+cy+' L'+x0.toFixed(2)+' '+y0.toFixed(2)+' A'+r+' '+r+' 0 '+large+' 1 '+x1.toFixed(2)+' '+y1.toFixed(2)+' Z" fill="'+colorMap[o]+'"/>';
      });
    }
    svg += '<circle cx="'+cx+'" cy="'+cy+'" r="'+hole+'" fill="#15151a"/>';
    for(var li=0; li<layerEls.length; li++){ layerEls[li].innerHTML = svg; }
    document.getElementById("total").textContent = Math.round(total);
    var leg = document.getElementById("legend");
    var ord = opts.slice().sort(function(a,b){ return (target[b]||0)-(target[a]||0); });
    if(ord.length === 0){ leg.innerHTML = '<div class="empty">Aguardando votos...</div>'; return; }
    var realTotal = ord.reduce(function(s,o){ return s+(target[o]||0); },0) || 1, html = "";
    ord.forEach(function(o){
      var n = target[o]||0, pct = Math.round(100*n/realTotal);
      html += '<div class="leg"><span class="sw" style="background:'+colorMap[o]+'"></span>'+
              '<span class="name">'+escapeHtml(o)+'</span><span class="num">'+n+'</span><span class="pct">'+pct+'%</span></div>';
    });
    leg.innerHTML = html;
  }

  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }

  // ===== start =====
  poll(); setInterval(poll, INTERVALO); requestAnimationFrame(tick);
</script>
</body>
</html>
```

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
