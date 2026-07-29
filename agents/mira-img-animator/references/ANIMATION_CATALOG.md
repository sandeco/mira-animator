# Catálogo de Animações D3.js para Imagens

Cada animação inclui: descrição visual, quando usar, e o padrão de código central.

---

## 1. Partículas (Particle Explosion / Assembly)

**Efeito visual:** A imagem se decompõe em milhares de partículas que flutuam aleatoriamente, e depois se reagrupam formando a imagem original. Pode funcionar ao contrário também (partículas → imagem).

**Quando usar:** Logos, ícones, fotos de rosto, qualquer imagem com boa definição de cores.

**Variantes:**
- `particle-explode` — Imagem começa formada, explode em partículas no hover/click
- `particle-assemble` — Partículas aleatórias se agrupam formando a imagem
- `particle-breathe` — Partículas oscilam suavemente, como respirando
- `particle-mouse-repel` — Partículas fogem do mouse e retornam à posição original

**Padrão central:**
```javascript
// 1. Carregar imagem em canvas offscreen e extrair pixels
const offscreen = document.createElement('canvas');
const ctx = offscreen.getContext('2d');
offscreen.width = img.width;
offscreen.height = img.height;
ctx.drawImage(img, 0, 0);
const imageData = ctx.getImageData(0, 0, img.width, img.height);

// 2. Amostrar pixels (sample rate controla densidade)
const particles = [];
const sampleRate = 4; // a cada N pixels
for (let y = 0; y < img.height; y += sampleRate) {
    for (let x = 0; x < img.width; x += sampleRate) {
        const i = (y * img.width + x) * 4;
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];
        const a = imageData.data[i + 3];
        if (a > 128) { // ignorar pixels transparentes
            particles.push({
                x: x, y: y,           // posição alvo (na imagem)
                ox: x, oy: y,         // posição original
                cx: Math.random() * width,  // posição atual (random start)
                cy: Math.random() * height,
                color: `rgb(${r},${g},${b})`,
                size: sampleRate * 0.8,
                vx: 0, vy: 0          // velocidade para física
            });
        }
    }
}

// 3. Animar com requestAnimationFrame
function animate() {
    ctx.clearRect(0, 0, width, height);
    for (const p of particles) {
        // Interpolar posição atual → posição alvo (easing)
        p.cx += (p.x - p.cx) * 0.05;
        p.cy += (p.y - p.cy) * 0.05;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.cx, p.cy, p.size, p.size);
    }
    requestAnimationFrame(animate);
}
```

**Performance:** Até ~50.000 partículas com Canvas. Acima disso, usar WebGL ou reduzir sample rate.

---

## 2. Wave / Ondulação

**Efeito visual:** A imagem sofre uma deformação senoidal, como ondas passando por ela. Pode ser horizontal, vertical, radial ou combinada.

**Quando usar:** Fotos, paisagens, retratos. Efeito contemplativo e hipnótico.

**Variantes:**
- `wave-horizontal` — Ondas horizontais passam pela imagem
- `wave-radial` — Ondas circulares emanam de um ponto (mouse ou centro)
- `wave-liquid` — Efeito de imagem submersa em água

**Padrão central (Canvas com pixel displacement):**
```javascript
function drawWave(time) {
    const source = sourceCtx.getImageData(0, 0, width, height);
    const target = mainCtx.createImageData(width, height);
    
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Deslocamento senoidal
            const dx = Math.sin(y * 0.02 + time * 0.003) * amplitude;
            const dy = Math.cos(x * 0.02 + time * 0.003) * amplitude;
            
            const sx = Math.round(x + dx);
            const sy = Math.round(y + dy);
            
            if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
                const si = (sy * width + sx) * 4;
                const ti = (y * width + x) * 4;
                target.data[ti] = source.data[si];
                target.data[ti+1] = source.data[si+1];
                target.data[ti+2] = source.data[si+2];
                target.data[ti+3] = source.data[si+3];
            }
        }
    }
    mainCtx.putImageData(target, 0, 0);
    requestAnimationFrame(() => drawWave(performance.now()));
}
```

---

## 3. Dissolve / Fade Particles

**Efeito visual:** A imagem se dissolve gradualmente em partículas que desaparecem, como areia ao vento ou cinzas. Pode reverter.

**Quando usar:** Transições dramáticas, efeitos de "destruição" ou "materialização".

**Padrão central:**
```javascript
// Partículas com vida útil + gravidade/vento
particles.forEach(p => {
    p.life -= 0.01; // diminuir vida
    p.cy += p.gravity;
    p.cx += p.wind;
    p.gravity += 0.02; // aceleração
    p.size *= 0.99;    // encolher
    
    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.cx, p.cy, p.size, p.size);
});
// Remover partículas mortas
particles = particles.filter(p => p.life > 0);
```

---

## 4. Force-Directed Layout

**Efeito visual:** Elementos da imagem (formas, regiões de cor) são convertidos em nós de um grafo com simulação de forças D3, criando um layout orgânico e dinâmico.

**Quando usar:** Diagramas, logos com múltiplos elementos, imagens com regiões de cor distintas.

**Padrão central:**
```javascript
const simulation = d3.forceSimulation(nodes)
    .force("charge", d3.forceManyBody().strength(-30))
    .force("center", d3.forceCenter(width / 2, height / 2))
    .force("collision", d3.forceCollide().radius(d => d.radius))
    .force("x", d3.forceX(d => d.targetX).strength(0.1))
    .force("y", d3.forceY(d => d.targetY).strength(0.1))
    .on("tick", draw);

function draw() {
    ctx.clearRect(0, 0, width, height);
    nodes.forEach(d => {
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.radius, 0, 2 * Math.PI);
        ctx.fillStyle = d.color;
        ctx.fill();
    });
}
```

---

## 5. Draw-On / Stroke Animation

**Efeito visual:** A imagem aparece como se estivesse sendo desenhada traço por traço, revelando-se progressivamente.

**Quando usar:** Logos vetoriais, ilustrações line-art, diagramas com contornos claros.

**Padrão central (SVG path animation):**
```javascript
// Para SVGs com paths definidos
const paths = svg.selectAll("path");
paths.each(function() {
    const totalLength = this.getTotalLength();
    d3.select(this)
        .attr("stroke-dasharray", totalLength)
        .attr("stroke-dashoffset", totalLength)
        .transition()
        .duration(2000)
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0);
});
```

**Para imagens raster** — usar edge detection (Sobel) via canvas para criar paths:
```javascript
// Detecção de bordas simplificada
function sobelEdge(imageData) {
    // ... aplica kernel Sobel horizontal e vertical
    // Retorna novo ImageData com apenas as bordas
}
```

---

## 6. Pixelate / Mosaic Reveal

**Efeito visual:** A imagem começa como grandes blocos pixelados e progressivamente revela os detalhes completos. Ou vice-versa.

**Quando usar:** Revelações, loading states, efeitos retro/8-bit.

**Padrão central:**
```javascript
function drawPixelated(blockSize) {
    for (let y = 0; y < height; y += blockSize) {
        for (let x = 0; x < width; x += blockSize) {
            // Pegar cor média do bloco
            const i = (y * width + x) * 4;
            const r = imageData.data[i];
            const g = imageData.data[i + 1];
            const b = imageData.data[i + 2];
            ctx.fillStyle = `rgb(${r},${g},${b})`;
            ctx.fillRect(x, y, blockSize, blockSize);
        }
    }
}

// Animar blockSize de grande → 1
let blockSize = 64;
function animateReveal() {
    if (blockSize > 1) {
        blockSize = Math.max(1, blockSize * 0.95);
        drawPixelated(Math.round(blockSize));
        requestAnimationFrame(animateReveal);
    } else {
        ctx.drawImage(img, 0, 0); // imagem final em full res
    }
}
```

---

## 7. Voronoi Tessellation

**Efeito visual:** A imagem é fragmentada em polígonos Voronoi que se animam (rotação, escala, posição). Efeito de vidro quebrado ou mosaico artístico.

**Quando usar:** Fotos, arte, qualquer imagem para efeito artístico/editorial.

**Padrão central:**
```javascript
// Gerar pontos aleatórios e criar Voronoi
const points = d3.range(500).map(() => [
    Math.random() * width,
    Math.random() * height
]);

const delaunay = d3.Delaunay.from(points);
const voronoi = delaunay.voronoi([0, 0, width, height]);

// Preencher cada célula com a cor média dos pixels naquela região
for (let i = 0; i < points.length; i++) {
    const cell = voronoi.cellPolygon(i);
    if (!cell) continue;
    const [cx, cy] = d3.polygonCentroid(cell);
    const pixelColor = getPixelColor(Math.round(cx), Math.round(cy));
    
    ctx.beginPath();
    voronoi.renderCell(i, ctx);
    ctx.fillStyle = pixelColor;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.stroke();
}
```

---

## 8. ASCII / Text Art Animation

**Efeito visual:** A imagem é convertida em caracteres ASCII onde a luminosidade de cada pixel determina o caractere. Pode animar trocando caracteres ou fazendo efeito matrix.

**Quando usar:** Efeitos retro, terminal-style, tech aesthetic.

**Padrão central:**
```javascript
const chars = " .:-=+*#%@";
const charSize = 8;

function drawAscii() {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);
    ctx.font = `${charSize}px monospace`;
    ctx.fillStyle = "#0f0"; // verde matrix
    
    for (let y = 0; y < img.height; y += charSize) {
        for (let x = 0; x < img.width; x += charSize * 0.6) {
            const i = (y * img.width + x) * 4;
            const brightness = (imageData.data[i] + imageData.data[i+1] + imageData.data[i+2]) / 3;
            const charIndex = Math.floor((brightness / 255) * (chars.length - 1));
            ctx.fillText(chars[charIndex], x, y);
        }
    }
}
```

---

## 9. Morph / Shape Interpolation

**Efeito visual:** Uma forma se transforma suavemente em outra. Duas imagens (ou uma imagem e uma forma geométrica) se interpolam.

**Quando usar:** Transições entre estados, logos com variantes, antes/depois.

**Padrão central (usando partículas de duas fontes):**
```javascript
// Extrair partículas de imagem A e B (mesmo número)
const particlesA = extractPixels(imgA, sampleRate);
const particlesB = extractPixels(imgB, sampleRate);

// Garantir mesmo número de partículas
const count = Math.min(particlesA.length, particlesB.length);

// Interpolar entre as duas posições
function morphFrame(t) { // t = 0..1
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < count; i++) {
        const x = particlesA[i].x + (particlesB[i].x - particlesA[i].x) * t;
        const y = particlesA[i].y + (particlesB[i].y - particlesA[i].y) * t;
        const color = d3.interpolateRgb(particlesA[i].color, particlesB[i].color)(t);
        ctx.fillStyle = color;
        ctx.fillRect(x, y, sampleRate, sampleRate);
    }
}
```

---

## 10. Parallax / Depth Layers

**Efeito visual:** A imagem é dividida em camadas que se movem em velocidades diferentes com o mouse, criando efeito de profundidade.

**Quando usar:** Paisagens, imagens com planos definidos (frente/fundo), ilustrações em camadas.

**Padrão central:**
```javascript
const layers = [
    { img: bgLayer, speed: 0.1 },
    { img: midLayer, speed: 0.3 },
    { img: fgLayer, speed: 0.6 }
];

document.addEventListener('mousemove', (e) => {
    const dx = (e.clientX - width / 2) / width;
    const dy = (e.clientY - height / 2) / height;
    
    layers.forEach(layer => {
        const offsetX = dx * layer.speed * 50;
        const offsetY = dy * layer.speed * 50;
        ctx.drawImage(layer.img, offsetX, offsetY);
    });
});
```

---

## Combinando Efeitos

Os efeitos podem ser combinados para resultados mais ricos:

- **Partículas + Force** — Partículas que se reagrupam usando simulação de forças
- **Voronoi + Wave** — Células Voronoi que ondulam
- **Pixelate → Partículas** — Revelar com pixelate, depois explodir em partículas
- **ASCII + Mouse repel** — Arte ASCII onde caracteres fogem do mouse

Ao combinar, manter a performance em mente. Um efeito fluido é melhor que dois efeitos travando.
