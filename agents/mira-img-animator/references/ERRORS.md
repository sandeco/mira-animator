# Tratamento de Erros

## Imagem não carrega

**Sintoma:** `img.onerror` disparado, ou imagem com dimensões 0.

**Ação:** Mostrar mensagem amigável no canvas:
```javascript
ctx.fillStyle = "#333";
ctx.fillRect(0, 0, width, height);
ctx.fillStyle = "#fff";
ctx.font = "18px sans-serif";
ctx.textAlign = "center";
ctx.fillText("Não foi possível carregar a imagem", width/2, height/2);
```

## Imagem muito grande (>10MB ou >4000px)

**Sintoma:** Performance degradada, browser travando.

**Ação:** Redimensionar antes de processar:
```javascript
const MAX_DIM = 1920;
let w = img.width, h = img.height;
if (w > MAX_DIM || h > MAX_DIM) {
    const scale = MAX_DIM / Math.max(w, h);
    w = Math.round(w * scale);
    h = Math.round(h * scale);
}
```

Avisar o usuário:
> "A imagem é grande (XxY pixels). Redimensionei para melhor performance. Se preferir manter o tamanho original, a animação pode ficar mais lenta."

## Muitas partículas (>50.000)

**Sintoma:** FPS abaixo de 30.

**Ação:** Aumentar automaticamente o `sampleRate` para reduzir o número de partículas.
Sugerir ao usuário usar Canvas ao invés de SVG.

## CORS bloqueando getImageData

**Sintoma:** `SecurityError` ao chamar `getImageData` em imagem de URL externa.

**Ação:** Isso acontece com imagens de URLs que não enviam headers CORS.
Solução: converter a imagem para base64 via script Python antes de embutir no HTML.
Se usando URL direto, adicionar `crossOrigin = "anonymous"` ao Image.

## Formato de imagem não suportado

**Sintoma:** Imagem não renderiza no canvas.

**Ação:** Canvas suporta PNG, JPG, GIF, WebP, SVG, BMP. Se o formato não é suportado, converter com o script:
```bash
python scripts/image_to_base64.py input.tiff --convert-to png
```

## Browser sem suporte a Canvas/SVG moderno

**Sintoma:** Animação não funciona em browsers antigos.

**Ação:** O código gerado assume browsers modernos (Chrome 90+, Firefox 88+, Safari 14+).
Para máxima compatibilidade, incluir check:
```javascript
if (!document.createElement("canvas").getContext) {
    document.body.innerHTML = "<p>Seu navegador não suporta Canvas.</p>";
}
```

## Imagem totalmente transparente ou monocromática

**Sintoma:** Nenhuma partícula extraída, ou todas com a mesma cor.

**Ação:** Ajustar `minAlpha` para 0, ou avisar o usuário:
> "A imagem parece ser totalmente transparente (ou quase). Verifique se é o arquivo correto."

Para imagens monocromáticas, sugerir efeitos que não dependem de variação de cor
(wave, pixelate, draw-on).
