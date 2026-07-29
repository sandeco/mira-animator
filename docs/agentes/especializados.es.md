# Agentes especializados

Recursos que amplían un deck o producen un artefacto específico fuera de la cadena principal.

## `/mira-image-prompt`

Conduce una entrevista en tres rondas y genera un prompt JSON estructurado para imágenes de producto con estética cinematográfica. Cubre producto, escena, acción, composición, cámara, iluminación, paleta, resolución y proporción. Muestra un resumen para aprobación antes del JSON final. Está optimizado para Nano Banana 2 mediante Google Antigravity, pero también sirve como base para otros generadores.

## `/mira-webview`

Inserta un sitio o aplicación en un slide mediante un `iframe` full-bleed. Acepta una URL pública o un proyecto local copiado a `assets/webview/`. Una guarda bloquea la interacción hasta que el presentador hace clic; después, el sitio recibe ratón y teclado normalmente. Los sitios que prohíben la incorporación mediante `X-Frame-Options` o CSP requieren una alternativa local o una captura.

## `/mira-tactics`

Crea una mesa táctica de fútbol a partir de la plantilla `mesa-tatica`: campo responsivo, equipos y formaciones reales, jugadores chibi o discos, movimiento en vivo, flechas, zonas, dibujo, grabación de fotogramas clave y replay fluido. Las jugadas pueden guardarse como JSON. La tecla `V` adapta el campo a un deck vertical y `mira-remote-control` puede sincronizar su estado.

## `/mira-remote-control`

Convierte el móvil en espejo, control y telestrator del deck por la red local, sin aplicación, cuenta ni internet. Instala el servidor y la shell en `mira/` y deja solo los lanzadores Windows/macOS en la raíz. El portátil es el escenario, el primer dispositivo externo se vuelve control y los demás reflejan. El QR abre la sesión; la tecla `C` vuelve a mostrarlo.

## `/mira-offline`

Convierte todos los HTML de un deck existente para funcionar sin CDN. Copia Tailwind, AOS, Lucide, D3, Inter y, cuando hace falta, Three.js a `assets/vendor/`, reescribe las rutas y elimina conexiones externas de fuentes. Es idempotente y debe ejecutarse después de terminar el deck. Los decks creados por `new` ya nacen offline; esta skill cubre decks antiguos o modificados.
