# Padrões React para Animação D3.js

Quando o usuário pedir a saída como componente React (.jsx), seguir estes padrões.

## Componente Base

```jsx
import { useState, useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";

export default function D3ImageAnimation() {
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [particles, setParticles] = useState([]);
    const mouseRef = useRef({ x: 0, y: 0 });

    // Carregar imagem e extrair pixels
    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            const extracted = extractPixels(img, 4);
            setParticles(extracted);
        };
        img.src = IMAGE_BASE64; // constante com a imagem
        
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    // Loop de animação
    useEffect(() => {
        if (particles.length === 0) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext("2d");
        
        const animate = () => {
            if (!isPlaying) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Lógica de animação com particles
            particles.forEach(p => {
                // ... atualizar posições
                ctx.fillStyle = p.color;
                ctx.fillRect(p.cx, p.cy, p.size, p.size);
            });
            
            animationRef.current = requestAnimationFrame(animate);
        };
        
        animate();
        return () => cancelAnimationFrame(animationRef.current);
    }, [particles, isPlaying]);

    // Mouse tracking
    const handleMouseMove = useCallback((e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        mouseRef.current = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }, []);

    return (
        <div className="relative w-full h-screen bg-black">
            <canvas
                ref={canvasRef}
                width={window.innerWidth}
                height={window.innerHeight}
                onMouseMove={handleMouseMove}
                className="block"
            />
            <div className="fixed bottom-5 left-1/2 -translate-x-1/2 flex gap-3 z-50
                            bg-black/70 px-5 py-2.5 rounded-full backdrop-blur-sm">
                <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="bg-transparent border border-white/30 text-white
                             px-4 py-1.5 rounded-full cursor-pointer text-sm
                             hover:bg-white/10"
                >
                    {isPlaying ? "⏸" : "▶"}
                </button>
                <button
                    onClick={() => {
                        // Reset logic
                    }}
                    className="bg-transparent border border-white/30 text-white
                             px-4 py-1.5 rounded-full cursor-pointer text-sm
                             hover:bg-white/10"
                >
                    ↺
                </button>
            </div>
        </div>
    );
}
```

## Notas Importantes para React

1. **Refs para animação** — Sempre usar `useRef` para `requestAnimationFrame` ID e dados mutáveis (mouse position, particles state durante animação). O `useState` causa re-renders desnecessários.

2. **Cleanup** — Sempre cancelar `requestAnimationFrame` no return do `useEffect`.

3. **Canvas no React** — O canvas é controlado imperativamente via ref, não declarativamente. O React gerencia apenas os controles de UI.

4. **Tailwind** — Usar classes utilitárias do Tailwind para layout e controles. Não usar CSS custom para o que Tailwind resolve.

5. **Sem localStorage** — Artifacts no Claude.ai não suportam localStorage/sessionStorage. Manter tudo em state/refs.

6. **Imagem embutida** — A imagem deve ser uma constante base64 no topo do arquivo ou recebida via props.

## Componente com Props Customizáveis

```jsx
export default function D3ImageAnimation({
    imageSrc = DEFAULT_IMAGE_BASE64,
    animationType = "particle-assemble",
    sampleRate = 4,
    particleSize = 3,
    speed = 1,
    interactive = true,
    backgroundColor = "#0a0a0a"
}) {
    // ... implementação usando as props
}
```
