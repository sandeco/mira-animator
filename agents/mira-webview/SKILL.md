---
name: mira-webview
description: >-
  Coloca um site vivo DENTRO de um slide do Mira (novo ou existente), ocupando o
  slide inteiro, edge to edge, via iframe full-bleed. Resolve os dois problemas
  reais de embutir um site num deck: (1) o iframe rouba o foco do teclado e
  quebra a navegacao por seta do deck, entao uma guarda de interacao deixa o
  site so visivel ate o apresentador clicar, e Esc devolve o controle ao deck;
  (2) muitos sites bloqueiam incorporacao (X-Frame-Options / CSP frame-ancestors),
  entao tem camada de fallback com link e a opcao de baixar o site para
  assets/webview/ e rodar offline por file protocol. Herda a Regra Zero do
  mira-animator, mas o site fica firme e o loop interno vai na guarda (pill
  pulsando e borda respirando em laranja) enquanto nao se esta interagindo. Use
  SEMPRE que o usuario disser /mira-webview, webview, embutir site, colocar um
  site no slide, site dentro do slide, iframe no slide, incorporar pagina,
  mostrar um site na apresentacao, abrir um site no deck, ou pedir um slide que
  seja uma pagina web ao vivo.
---

# Skill: site vivo ocupando o slide inteiro

Insere num slide um site que ocupa **o slide inteiro** (edge to edge, sem moldura por padrão), via `<iframe>` full-bleed. Casos típicos: demonstrar o produto ao vivo, abrir a landing page durante o pitch, mostrar um dashboard, um CodePen, um mapa, uma doc.

O ponto difícil de embutir um site num deck não é o iframe, é a **convivência com o deck**: o iframe rouba o foco do teclado (quebra a navegação por seta) e muitos sites recusam ser incorporados. Esta skill resolve os dois.

## Os dois problemas (e as soluções)

1. **Foco / navegação.** Assim que o iframe pega foco, `ArrowRight/ArrowDown/PageDown` vão para o site, não para o deck, e o apresentador fica preso no slide. **Solução: guarda de interação.** Por padrão o site fica **visível mas não clicável** (uma camada transparente por cima). O apresentador **clica para interagir**; para voltar a navegar o deck, aperta **Esc** (ou clica fora). Simples e à prova de falha em qualquer navegador.

2. **Sites que bloqueiam incorporação.** Google, YouTube (home), bancos, Instagram e muitos outros mandam `X-Frame-Options: DENY` ou `Content-Security-Policy: frame-ancestors` e aparecem **em branco / "recusou conectar"** dentro do iframe.

   **Duas verdades duras, apuradas na prática (ver `dev/BUGS.md`, B2):**

   - **O bloqueio é indetectável em runtime.** Um iframe bloqueado e um iframe cross-origin
     perfeitamente saudável lançam **o mesmo `SecurityError`** ao se tocar no `contentDocument`.
     Não existe teste confiável dentro do navegador. Não tente.
   - **Fallback ATRÁS do iframe não funciona.** O iframe bloqueado não fica transparente: o
     Chrome desenha **a própria página de erro**, cinza e opaca, por cima. Quem está atrás
     nunca aparece. O usuário vê "recusou conectar" e mais nada.

   **Solução: decidir em tempo de AUTORIA, não em runtime.** Quem monta o slide confere o
   domínio antes e declara o resultado no HTML:

   ```bash
   curl -sI https://exemplo.com | grep -iE 'x-frame-options|content-security-policy'
   ```

   Se bloquear, marque o container com `data-blocked` e o fallback é promovido **ACIMA** do
   iframe (`z-index` maior), não atrás:

   ```css
   .webview[data-blocked] iframe          { display: none; }
   .webview[data-blocked] .webview-fallback { display: flex; }   /* fica por cima, não atrás */
   ```

   Para apresentação crítica, o melhor continua sendo **baixar o site para
   `assets/webview/<slug>/` e apontar o iframe para o arquivo local**: nunca bloqueia, funciona
   offline por `file://`, e é o que combina com a ética offline-first do Mira.

Antes de gerar, **avise o usuário** se o domínio for um dos que costumam bloquear e ofereça a opção local/offline.

## Duas fontes possíveis para o site

- **URL ao vivo (padrão).** `<iframe src="https://...">`. Depende de rede na hora da apresentação e de o site permitir incorporação. Ótimo para demos com internet e sites próprios.
- **Cópia local (recomendada para apresentação crítica / offline).** Baixe a página para `assets/webview/<slug>/index.html` (com seus assets) e aponte `src="assets/webview/<slug>/index.html"`. Nunca é bloqueado por X-Frame, roda por `file://`, alinhado com a ética offline-first do Mira (ver `mira-offline`). Guarde os arquivos **só** em `assets/` (diretiva de pastas do deck: a raiz do deck tem só `index.html` e launchers).

## REGRA ZERO (herdada, com ressalva do site)

Todo slide do Mira tem loop interno, mas o **site fica firme**: nada animado passa por cima do conteúdo do site. O loop interno vive **na guarda de interação**, e só enquanto o apresentador ainda não clicou:

- **Pill "clique para interagir"** pulsando (sobe e desce, com glow laranja).
- **Borda respirando** laranja por dentro da moldura do slide.

Ao clicar, a guarda some e o próprio site (vivo) passa a ser o movimento. Descreva o loop em uma frase ("enquanto não se clica, a borda respira laranja e a pill pulsa; ao clicar, o site assume").

## Composição (o site toma o slide inteiro)

- **Full-bleed:** a `<section>` do slide vai com **`padding: 0`**, `height: 100vh`, `overflow: hidden`. O iframe preenche `inset: 0` (100% x 100%), `border: 0`. Sem título nem chrome por padrão: o site é o slide.
- **Sem moldura visível por padrão.** Se o usuário pedir contexto, ofereça uma **barra de endereço fake** opcional no topo (mostrando a URL), mas isso reduz a área do site; o padrão é edge to edge.
- **Laranja (#FF904D)** aparece só na guarda (pill + borda), nunca sobreposto ao site.

## CSS + HTML canônico (gerar assim)

Substitua `SLUG` por um id curto único (ex.: `demo-produto`), `URL` pela fonte (link ou `assets/webview/.../index.html`) e `TITULO_DESCRITIVO` por um title acessível. As strings visíveis já vêm acentuadas: mantenha a acentuação (segue `agents/_shared/idioma.md`).

```html
<style>
  /* Slide de webview: o site ocupa o slide inteiro, sem moldura por padrao. */
  .webview-slide {
    position: relative;
    width: 100%;
    height: 100vh;
    overflow: hidden;
    background: #000;
    padding: 0;                 /* full-bleed: o site vai edge to edge */
  }
  .webview-frame {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    border: 0; display: block;
    background: #fff;
    pointer-events: none;       /* bloqueado ate o apresentador clicar */
    z-index: 1;
  }
  .webview-slide.interacting .webview-frame { pointer-events: auto; }

  /* Fallback: fica ATRAS do iframe. So aparece se o site recusar
     incorporacao (X-Frame-Options). NAO fica atras do iframe (a pagina de erro do Chrome e
     opaca e cobriria o fallback): e promovido ACIMA dele via [data-blocked], declarado em
     tempo de autoria depois de conferir o site no curl. */
  .webview-fallback {
    position: absolute; inset: 0; z-index: 0;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 14px; text-align: center; padding: 32px;
    color: #fff; background: #0a0a0a;
    font: 500 18px/1.4 system-ui, sans-serif;
  }
  .webview-fallback a { color: #FF904D; text-decoration: underline; font-weight: 700; }

  /* Guarda de interacao: intercepta o clique para nao roubar a navegacao do
     deck. Loop interno (REGRA ZERO) vive aqui, so enquanto nao se interage. */
  .webview-guard {
    position: absolute; inset: 0; z-index: 2;
    display: flex; align-items: flex-end; justify-content: center;
    padding-bottom: 28px; cursor: pointer; background: transparent;
    transition: opacity .35s ease;
  }
  .webview-guard::after {       /* borda que respira laranja por dentro */
    content: ""; position: absolute; inset: 0; pointer-events: none;
    animation: wv-border 3s ease-in-out infinite;
  }
  @keyframes wv-border {
    0%,100% { box-shadow: inset 0 0 0 3px rgba(255,144,77,0.25), inset 0 0 40px rgba(255,144,77,0.10); }
    50%     { box-shadow: inset 0 0 0 3px rgba(255,144,77,0.60), inset 0 0 80px rgba(255,144,77,0.22); }
  }
  .webview-hint {
    position: relative; z-index: 1;
    font: 600 15px/1 system-ui, sans-serif; color: #fff;
    background: rgba(10,10,10,0.72); backdrop-filter: blur(6px);
    border: 1px solid rgba(255,144,77,0.55); border-radius: 999px;
    padding: 10px 18px; display: inline-flex; align-items: center; gap: 8px;
    animation: wv-pulse 2.4s ease-in-out infinite;
  }
  @keyframes wv-pulse {
    0%,100% { transform: translateY(0);    box-shadow: 0 0 0 rgba(255,144,77,0); }
    50%     { transform: translateY(-4px); box-shadow: 0 8px 30px rgba(255,144,77,0.35); }
  }
  .webview-slide.interacting .webview-guard { opacity: 0; pointer-events: none; }
</style>

<section class="webview-slide" id="webview-SLUG">
  <!-- Fallback: aparece so se o site recusar incorporacao (X-Frame-Options) -->
  <div class="webview-fallback">
    <p>Este site não permite ser incorporado.</p>
    <p><a href="URL" target="_blank" rel="noopener">Abrir em nova aba</a></p>
  </div>

  <iframe
    class="webview-frame"
    src="URL"
    title="TITULO_DESCRITIVO"
    loading="eager"
    referrerpolicy="no-referrer-when-downgrade"
    allow="fullscreen; autoplay; encrypted-media; clipboard-read; clipboard-write; geolocation *">
  </iframe>

  <!-- Guarda de interacao + loop interno (REGRA ZERO) -->
  <div class="webview-guard" role="button" tabindex="0" aria-label="Clique para navegar no site">
    <span class="webview-hint">Clique para navegar no site &middot; Esc volta ao deck</span>
  </div>
</section>

<script>
  (function () {
    var slide = document.getElementById('webview-SLUG');
    if (!slide) return;
    var guard = slide.querySelector('.webview-guard');
    var frame = slide.querySelector('.webview-frame');
    function enter() { slide.classList.add('interacting'); try { frame.focus(); } catch (e) {} }
    function leave() { slide.classList.remove('interacting'); try { frame.blur(); } catch (e) {} try { window.focus(); } catch (e) {} }
    guard.addEventListener('click', enter);
    guard.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enter(); }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') leave(); });

    /* Ponte de teclado (OBRIGATÓRIA): com o foco dentro do iframe, o deck
       não ouve tecla nenhuma — Esc não sai e os modos E/P morrem. Em iframe
       same-origin (cópia local), escuta lá dentro: Esc sai; E/P saem e
       reenviam a tecla para o deck. Cross-origin não permite a ponte
       (mais um motivo para preferir a cópia local). */
    function typingInFrame(doc) {
      var t = doc.activeElement;
      return t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
    }
    function bindFrameKeys() {
      try {
        var doc = frame.contentDocument;
        if (!doc || doc.__mwvKeys) return;
        doc.__mwvKeys = true;
        doc.addEventListener('keydown', function (e) {
          if (e.key === 'Escape') { e.preventDefault(); leave(); return; }
          if (/^[ep]$/i.test(e.key) && !typingInFrame(doc)) {
            e.preventDefault(); e.stopPropagation();
            leave();
            document.dispatchEvent(new KeyboardEvent('keydown', { key: e.key, bubbles: true }));
          }
        }, true);
      } catch (err) { /* cross-origin: sem ponte */ }
    }
    frame.addEventListener('load', bindFrameKeys);
    bindFrameKeys();

    /* Fora da interação o iframe nunca fica com o foco (sites roubam foco
       no load); devolve o teclado ao deck. */
    window.addEventListener('blur', function () {
      setTimeout(function () {
        if (!slide.classList.contains('interacting') && document.activeElement === frame) {
          try { frame.blur(); } catch (e) {}
          try { window.focus(); } catch (e) {}
        }
      }, 0);
    });
  })();
</script>
```

Por que funciona: a guarda (z-index 2, fundo transparente) deixa o site **visível** mas captura o clique, então o teclado do deck nunca é roubado sem intenção; ao clicar entra em `interacting` (iframe ganha `pointer-events`), e **Esc** sai. A camada de fallback (z-index 0) só aparece por baixo se o iframe vier em branco por bloqueio. A ponte de teclado garante que **Esc/E/P continuam funcionando mesmo com o foco dentro do site** — sem ela o deck fica surdo depois do primeiro clique no iframe.

## Barra de endereço fake (opcional, só se o usuário pedir contexto)

Reduz a área do site em ~48px no topo. Use quando o apresentador quiser mostrar QUAL é a URL. Neste caso a `.webview-frame` vai com `top: 44px` em vez de `inset: 0`.

```html
<div style="position:absolute;inset:0 0 auto 0;z-index:3;height:44px;display:flex;align-items:center;gap:10px;padding:0 16px;background:rgba(10,10,10,0.85);border-bottom:1px solid rgba(255,144,77,0.35);font:600 13px/1 system-ui;color:#fff">
  <span style="width:10px;height:10px;border-radius:50%;background:#FF904D"></span>
  <span style="opacity:.8">URL</span>
</div>
```

## Passos

1. **Receber destino + fonte.** Slide novo ou slide N do deck X, e a URL (ou "quero offline"). Se faltar a URL, pergunte.
2. **Checar bloqueio.** Se o domínio costuma bloquear incorporação (Google, YouTube home, Instagram, bancos, X/Twitter), **avise** e ofereça: (a) tentar ao vivo com fallback, ou (b) baixar para `assets/webview/<slug>/` e rodar local. Para apresentação sem internet garantida, **recomende a cópia local**.
3. **Se local:** baixar o site (HTML + assets essenciais) para `assets/webview/<slug>/`, apontar `src` para o arquivo local. Guardar tudo em `assets/`, nada na raiz do deck.
4. **Montar o slide full-bleed:** `<section class="webview-slide">` com `padding:0` e `height:100vh`, iframe `inset:0`, guarda de interação e fallback, conforme o canônico. Trocar `SLUG`, `URL`, `TITULO_DESCRITIVO`. Inserir como `<section>` no deck preservando a navegação existente.
5. **Conferir:** o site toma o slide inteiro; clicar entra em interação; **Esc** volta a navegar o deck; fallback tem link válido; nada animado por cima do site.
6. **Reportar:** caminho do arquivo, a URL/fonte (ao vivo ou local), se o domínio pode bloquear, e o loop interno em uma frase. Lembre o apresentador: **clique para interagir, Esc para voltar ao deck**.

## Checklist

- [ ] Site ocupa o slide inteiro: `<section>` com `padding:0`, `height:100vh`, iframe `inset:0`, `border:0`.
- [ ] Guarda de interação presente: site só fica clicável após clique; **Esc** devolve a navegação ao deck (testado).
- [ ] Ponte de teclado presente: **Esc/E/P funcionam com o foco dentro do iframe** (testado clicando no site e apertando as três teclas).
- [ ] Camada de fallback com link "abrir em nova aba" caso o site recuse incorporação.
- [ ] Se o domínio costuma bloquear, o usuário foi avisado e a opção local/offline foi oferecida.
- [ ] Cópia local (quando usada) fica em `assets/webview/<slug>/`; nada de arquivo de apoio na raiz do deck.
- [ ] Loop interno só na guarda (pill pulsando + borda respirando); **nada animado sobre o site**; o site fica firme.
- [ ] Laranja (#FF904D) só na guarda; nunca sobreposto ao conteúdo do site.
- [ ] `id` do slide e do script batem (`webview-SLUG` único no deck); navegação do deck preservada.
- [ ] Abre por `file://` quando a fonte é local; quando é ao vivo, o fallback cobre o caso sem rede.
- [ ] Nenhum travessão; textos visíveis acentuados corretamente (segue `agents/_shared/idioma.md`).
```