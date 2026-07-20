---
name: mira-qrcode
description: >-
  Insere num slide do Mira (novo ou existente) um QR code escaneável, grande e
  centralizado, gerado de um link ou texto. O QR é gerado LOCALMENTE (pacote npm
  qrcode) e embutido como SVG inline: funciona por file://, sem API nem CDN em
  apresentação. Card limpo no padrão mira-3d (só o título, no máximo 6 palavras,
  e o QR central, sem legenda do link); módulos escuros sobre cartão branco,
  laranja só na moldura e no título. Herda a Regra Zero do mira-animator, mas o
  QR fica ESTÁTICO e o loop interno vai na moldura. Use SEMPRE que o usuário
  disser /mira-qrcode, QR code, qrcode, código QR, gera um QR, coloca um QR no
  slide, QR do link, QR de inscrição, QR de CTA, código para escanear, ou pedir
  um slide com um link escaneável.
---

# Skill: QR code grande e central no slide

Insere num slide um QR code escaneável, grande e central, gerado de um link ou texto do usuário. Casos típicos: CTA de fim de deck, material complementar, link de inscrição.

> **Fonte da verdade:** decisões congeladas em `BRAINSTORM_MIRA_QRCODE.md` (2026-06-11) e padrão visual validado em `decks/teste-qrcode/index.html` (QR de sandeco.com.br, 25x25 módulos, nível M). Em dúvida sobre CSS da moldura ou estrutura do card, copie do teste.

## Como o QR é gerado

O QR é gerado **localmente, ao criar o slide**, e **embutido como SVG inline** no HTML. Zero dependência na apresentação: nada de JS por CDN nem API externa; o slide funciona aberto por `file://`. Se o link mudar, regere o slide pela skill.

**NUNCA use `npx qrcode`.** Validado pelo usuário em 2026-06-11: `npx qrcode` **trava no Windows** (sem saída e sem erro). Use o pacote instalado localmente + um one-liner Node.

Receita (executada na criação do slide):

1. **Instale o pacote uma vez** numa pasta temporária reaproveitável (ex.: `%TEMP%/mira-qr`). Se já existir `node_modules/qrcode` lá, pule esta etapa.
   ```
   npm install qrcode --no-save --prefix "<pasta-temp>"
   ```
2. **Gere o SVG** rodando o Node a partir dessa pasta (ou com `NODE_PATH` apontando para o `node_modules` dela). Substitua `DADO` pelo link/texto exato do usuário:
   ```
   node -e "require('qrcode').toString('DADO',{type:'svg',errorCorrectionLevel:'M',margin:0,color:{dark:'#0a0a0a',light:'#ffffff'}},(e,s)=>{if(e)throw e;process.stdout.write(s)})"
   ```
   - `margin:0`: a zona de silêncio NÃO vem no SVG; quem a garante é o padding do cartão branco (ver CSS). Não deixe o QR encostar na borda.
   - `errorCorrectionLevel:'M'`: padrão. Use `'Q'` para escanear de longe (projeção em sala grande); custa mais módulos, mas tolera mais ruído.
   - `color`: módulos `#0a0a0a` sobre branco. **Não inverta** (claro sobre escuro não escaneia bem).
3. **Embuta o SVG do stdout inline** dentro do `.qr-card`. Mantenha o `viewBox` e o `shape-rendering="crispEdges"`, e **remova `width`/`height` fixos em pixels** que o pacote tenha adicionado, para o CSS (`width:100%`) controlar o tamanho. Acrescente um comentário HTML com o dado codificado, ex.: `<!-- QR gerado localmente (pacote npm qrcode, ECC M) para https://... -->`.

## REGRA ZERO (herdada, com ressalva do QR)

Todo slide do Mira tem loop interno, mas o **QR fica estático**: nada animado pode passar por cima dos módulos, senão quebra o escaneio. O loop interno vai **na moldura**:

- **Pulso de brilho** no cartão (`box-shadow` laranja indo e voltando).
- **Cantos respirando/orbitando** ao redor do cartão.

Descreva o loop em uma frase ("o cartão pulsa um brilho laranja e os quatro cantos respiram, o QR no centro fica firme").

## Composição do card (padrão do mira-3d: limpo, elemento maximizado)

- **Só o título + o QR.** Título no topo (sem ícone, máximo 6 palavras). **Sem legenda com o link por extenso** embaixo.
- **QR grande e central.** Cartão branco com o QR ocupando boa parte da altura útil. No teste: `width: min(62vh, 80vw)`.
- **Escaneabilidade manda no estilo:** módulos escuros (`#0a0a0a`) sobre **cartão branco**, zona de silêncio proporcional ao módulo (4 módulos, via --qr-quiet; padding fixo não cumpre a norma). O laranja (`#FF904D`) fica **na moldura e no título**, nunca dentro dos módulos.

## CSS + HTML canônico (gerar conforme o teste)

```html
<style>
  /* Cartão claro do QR: contraste alto e zona de silêncio PROPORCIONAL AO MÓDULO.
     A norma pede 4 módulos de margem em volta do QR. Padding fixo (ex.: 28px) NÃO cumpre
     isso: num cartão de ~670px com 33 módulos, o módulo tem ~18px, e 4 módulos são ~74px.
     Com padding fixo o QR ainda escaneia de perto, no celular novo, e falha justo onde
     dói: projetado, de longe, com a câmera torta.
     Ajuste --qr-modules para a versão real do seu QR (o pacote qrcode reporta; uma URL
     típica com ECC M cai em 33 ou 37). */
  .qr-card {
    --qr-modules: 33;                                   /* módulos por lado do QR gerado */
    --qr-card-size: min(62vh, 80vw);
    --qr-quiet: calc(4 * var(--qr-card-size) / (var(--qr-modules) + 8));  /* 4 módulos */
    position: relative;
    background: #ffffff;
    border-radius: 24px;
    padding: var(--qr-quiet);
    width: var(--qr-card-size);
    animation: qr-glow 3s ease-in-out infinite;   /* loop interno na moldura */
  }
  .qr-card svg { display: block; width: 100%; height: auto; }
  @keyframes qr-glow {
    0%, 100% { box-shadow: 0 0 25px rgba(255,144,77,0.25), 0 0 60px rgba(255,144,77,0.10); }
    50%      { box-shadow: 0 0 45px rgba(255,144,77,0.55), 0 0 110px rgba(255,144,77,0.25); }
  }
  /* Cantos animados orbitando o cartão (nunca sobre os módulos) */
  .qr-corner { position: absolute; width: 34px; height: 34px; border: 3px solid #FF904D; animation: qr-breathe 3s ease-in-out infinite; }
  .qr-corner.tl { top:-12px; left:-12px; border-right:none; border-bottom:none; border-radius:12px 0 0 0; --dx:-6px; --dy:-6px; }
  .qr-corner.tr { top:-12px; right:-12px; border-left:none; border-bottom:none; border-radius:0 12px 0 0; --dx:6px; --dy:-6px; }
  .qr-corner.bl { bottom:-12px; left:-12px; border-right:none; border-top:none; border-radius:0 0 0 12px; --dx:-6px; --dy:6px; }
  .qr-corner.br { bottom:-12px; right:-12px; border-left:none; border-top:none; border-radius:0 0 12px 0; --dx:6px; --dy:6px; }
  @keyframes qr-breathe {
    0%, 100% { transform: translate(0,0); opacity: 0.6; }
    50%      { transform: translate(var(--dx), var(--dy)); opacity: 1; }
  }
</style>

<section class="min-h-screen flex flex-col items-center justify-center px-6 pt-3 pb-6">
  <div class="w-full max-w-6xl flex flex-col items-center" data-aos="fade-up" data-aos-delay="100">
    <!-- Título do slide: SEM ícone, no máximo 6 palavras -->
    <div class="text-center mb-6">
      <h2 class="text-4xl md:text-5xl font-bold mb-2">
        Acesse <span class="primary-color italic">seu-link-aqui</span>
      </h2>
    </div>
    <div class="qr-card">
      <div class="qr-corner tl"></div>
      <div class="qr-corner tr"></div>
      <div class="qr-corner bl"></div>
      <div class="qr-corner br"></div>
      <!-- QR gerado localmente (pacote npm qrcode, ECC M) para https://... -->
      <!-- <svg ...viewBox="0 0 N N" shape-rendering="crispEdges">...</svg> gerado no passo 3 -->
    </div>
  </div>
</section>
```

## Passos

1. **Receber o destino + o dado.** Slide novo ou slide N do deck X, e o link/texto a codificar. Se faltar o dado, pergunte.
2. **Gerar o QR localmente** (seção "Como o QR é gerado"): instalar `qrcode` em pasta temp (sem npx), rodar o one-liner Node, capturar o SVG.
3. **Montar o card limpo:** título no topo (sem ícone, máx. 6 palavras, sem legenda do link), cartão branco com o QR inline grande e central, moldura com glow + cantos. Inserir como `<section>` no padrão do deck; preservar o sistema de navegação.
4. **Conferir escaneabilidade:** módulos escuros sobre branco, não invertido, zona de silêncio de 4 módulos preservada, nada animado por cima dos módulos. **Decodifique o QR de verdade** (ex.: `jsqr` sobre um print do cartão renderizado) antes de entregar: um QR bonito que não escaneia é um desastre em sala.
5. **Reportar.** Caminho do arquivo, o dado codificado, o nível de correção (M/Q) e o loop interno em uma frase. Lembre que não há dependência de runtime nem servidor: abre direto, inclusive por file://.

## Checklist

- [ ] QR gerado localmente (pacote `qrcode`), embutido como SVG inline; **não** usou `npx qrcode` nem CDN nem API externa.
- [ ] Slide abre por `file://` sem nada externo (sem dependência de apresentação).
- [ ] Módulos escuros (`#0a0a0a`) sobre cartão branco; cores não invertidas; ECC M (ou Q se for de longe).
- [ ] Zona de silêncio de **4 módulos** (`--qr-quiet`, não padding fixo); o QR não encosta na borda.
- [ ] Card limpo: só título + QR; sem legenda com o link por extenso embaixo.
- [ ] Título sem ícone, no máximo 6 palavras.
- [ ] Loop interno só na moldura (glow + cantos); **nada animado sobre os módulos**; QR estático.
- [ ] Laranja só na moldura/título, nunca dentro dos módulos.
- [ ] Comentário HTML registra o dado codificado.
- [ ] Nenhum travessão (—); acentuação UTF-8 correta (segue `agents/_shared/idioma.md`).
```
