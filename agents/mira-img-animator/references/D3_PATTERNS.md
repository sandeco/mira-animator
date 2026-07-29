# Padrões D3.js para Animação de Imagens

Referência rápida de padrões de código D3.js v7 testados e otimizados.

---

## Setup Base — Canvas

```javascript
const width = window.innerWidth;
const height = window.innerHeight;

const canvas = d3.select("#container")
    .append("canvas")
    .attr("width", width)
    .attr("height", height)
    .node();

const ctx = canvas.getContext("2d");

// Responsividade
window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    // Recalcular posições se necessário
});
```

## Setup Base — SVG

```javascript
const svg = d3.select("#container")
    .append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet");
```

## Carregar Imagem

```javascript
// Via base64 embutida (preferido para self-contained)
const img = new Image();
img.onload = () => { /* iniciar animação */ };
img.src = "data:image/png;base64,<BASE64_DATA>";

// Via URL
const img = new Image();
img.crossOrigin = "anonymous"; // necessário para getImageData
img.onload = () => { /* iniciar animação */ };
img.src = "https://example.com/image.png";
```

## Extrair Pixels

```javascript
function extractPixels(img, sampleRate = 4, minAlpha = 128) {
    const offscreen = document.createElement("canvas");
    offscreen.width = img.width;
    offscreen.height = img.height;
    const offCtx = offscreen.getContext("2d");
    offCtx.drawImage(img, 0, 0);
    const data = offCtx.getImageData(0, 0, img.width, img.height).data;
    
    const particles = [];
    for (let y = 0; y < img.height; y += sampleRate) {
        for (let x = 0; x < img.width; x += sampleRate) {
            const i = (y * img.width + x) * 4;
            if (data[i + 3] > minAlpha) {
                particles.push({
                    x, y,
                    r: data[i], g: data[i+1], b: data[i+2], a: data[i+3],
                    color: `rgb(${data[i]},${data[i+1]},${data[i+2]})`
                });
            }
        }
    }
    return particles;
}
```

## Loop de Animação com requestAnimationFrame

```javascript
let animationId;
let lastTime = 0;
const targetFPS = 60;
const frameInterval = 1000 / targetFPS;

function animate(currentTime) {
    animationId = requestAnimationFrame(animate);
    
    const delta = currentTime - lastTime;
    if (delta < frameInterval) return;
    lastTime = currentTime - (delta % frameInterval);
    
    // --- lógica de renderização aqui ---
    ctx.clearRect(0, 0, width, height);
    // ...
}

// Iniciar
requestAnimationFrame(animate);

// Pausar
function pause() { cancelAnimationFrame(animationId); }

// Retomar
function resume() { requestAnimationFrame(animate); }
```

## Easing Functions do D3

```javascript
// Easing suaves para movimentação de partículas
d3.easeQuadInOut    // aceleração suave
d3.easeCubicInOut   // aceleração mais acentuada
d3.easeElasticOut   // efeito elástico (bom para bounce)
d3.easeBounceOut    // efeito de quique
d3.easeBackOut      // overshoots e volta (snappy)
d3.easeSinInOut     // senoidal (bom para ondulação)

// Usar com interpolação manual:
function easeValue(current, target, factor = 0.05) {
    return current + (target - current) * factor;
}
```

## Interatividade — Mouse

```javascript
let mouse = { x: width / 2, y: height / 2 };

canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

// Touch support
canvas.addEventListener("touchmove", (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.touches[0].clientX - rect.left;
    mouse.y = e.touches[0].clientY - rect.top;
}, { passive: false });

// Repelir partículas do mouse
function repelFromMouse(particle, radius = 80, strength = 5) {
    const dx = particle.cx - mouse.x;
    const dy = particle.cy - mouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < radius) {
        const force = (radius - dist) / radius * strength;
        particle.cx += (dx / dist) * force;
        particle.cy += (dy / dist) * force;
    }
}
```

## Transições D3 (SVG)

```javascript
// Staggered entrance
svg.selectAll("circle")
    .data(particles)
    .enter()
    .append("circle")
    .attr("cx", d => d.cx)
    .attr("cy", d => d.cy)
    .attr("r", 0)
    .attr("fill", d => d.color)
    .transition()
    .duration(1000)
    .delay((d, i) => i * 2) // stagger
    .ease(d3.easeBackOut)
    .attr("cx", d => d.x)
    .attr("cy", d => d.y)
    .attr("r", d => d.size);
```

## Paleta de Cores com D3

```javascript
// Escala de cores para mapear luminosidade → cor
const colorScale = d3.scaleSequential(d3.interpolateViridis)
    .domain([0, 255]);

// Interpolar entre duas cores
const blend = d3.interpolateRgb("#ff0000", "#0000ff");
const midColor = blend(0.5); // roxo

// Paleta categórica
const palette = d3.schemeTableau10;
```

## Force Simulation

```javascript
const simulation = d3.forceSimulation(nodes)
    .force("charge", d3.forceManyBody().strength(-20))
    .force("center", d3.forceCenter(width/2, height/2))
    .force("collision", d3.forceCollide().radius(d => d.radius + 1))
    .force("x", d3.forceX(d => d.targetX).strength(0.05))
    .force("y", d3.forceY(d => d.targetY).strength(0.05))
    .alphaDecay(0.01)  // decaimento mais lento = animação mais longa
    .on("tick", render);

// Reaquecer a simulação (ex: após click)
simulation.alpha(0.5).restart();
```

## Voronoi com D3

```javascript
const points = particles.map(p => [p.x, p.y]);
const delaunay = d3.Delaunay.from(points);
const voronoi = delaunay.voronoi([0, 0, width, height]);

// Renderizar células
for (let i = 0; i < points.length; i++) {
    ctx.beginPath();
    voronoi.renderCell(i, ctx);
    ctx.fillStyle = particles[i].color;
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.1)";
    ctx.stroke();
}
```

## Controles de UI

```html
<div id="controls" style="position:fixed; bottom:20px; left:50%;
     transform:translateX(-50%); display:flex; gap:10px; z-index:100;">
    <button onclick="togglePlay()">⏯ Play/Pause</button>
    <button onclick="reset()">🔄 Reset</button>
    <input type="range" id="speed" min="0.1" max="3" step="0.1" value="1">
    <label for="speed">Velocidade</label>
</div>
```

## Template Completo Mínimo

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Animação D3</title>
    <script src="https://d3js.org/d3.v7.min.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #0a0a0a; overflow: hidden; }
        canvas { display: block; }
        #controls {
            position: fixed; bottom: 20px; left: 50%;
            transform: translateX(-50%); display: flex; gap: 12px;
            z-index: 100; background: rgba(0,0,0,0.7);
            padding: 10px 20px; border-radius: 25px;
            backdrop-filter: blur(10px);
        }
        #controls button {
            background: none; border: 1px solid rgba(255,255,255,0.3);
            color: white; padding: 6px 16px; border-radius: 15px;
            cursor: pointer; font-size: 14px;
        }
        #controls button:hover { background: rgba(255,255,255,0.1); }
    </style>
</head>
<body>
    <canvas id="canvas"></canvas>
    <div id="controls">
        <button onclick="togglePlay()">⏯</button>
        <button onclick="resetAnimation()">↺</button>
    </div>
    <script>
        // ===== CONFIG =====
        const canvas = document.getElementById("canvas");
        const ctx = canvas.getContext("2d");
        let W = canvas.width = window.innerWidth;
        let H = canvas.height = window.innerHeight;
        let running = true;
        let mouse = { x: W/2, y: H/2 };
        
        window.addEventListener("resize", () => {
            W = canvas.width = window.innerWidth;
            H = canvas.height = window.innerHeight;
        });
        canvas.addEventListener("mousemove", e => {
            mouse.x = e.clientX; mouse.y = e.clientY;
        });
        canvas.addEventListener("touchmove", e => {
            e.preventDefault();
            mouse.x = e.touches[0].clientX;
            mouse.y = e.touches[0].clientY;
        }, { passive: false });
        
        // ===== IMAGEM =====
        const img = new Image();
        img.onload = init;
        img.src = "data:image/png;base64,__BASE64__";
        
        let particles = [];
        
        function init() {
            // Extrair pixels, criar partículas
            // ... (personalizar por tipo de animação)
            animate();
        }
        
        function animate() {
            if (!running) return;
            ctx.clearRect(0, 0, W, H);
            // ... (lógica de animação)
            requestAnimationFrame(animate);
        }
        
        function togglePlay() {
            running = !running;
            if (running) animate();
        }
        function resetAnimation() {
            // ... (resetar partículas às posições iniciais)
        }
    </script>
</body>
</html>
```
