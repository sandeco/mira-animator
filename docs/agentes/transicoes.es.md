# Transiciones

Efectos de transición entre slides.

## `/mira-transition-dissolve`
Aplica una transición **disolvencia** (crossfade real, estilo Canva/Keynote) a la navegación entre slides usando la View Transitions API (same-document), que funciona en `file://` sin servidor. Escribe `index-dissolve.html` al lado del original. Los navegadores sin la API navegan normalmente.

## `/mira-sequence`
El caso opuesto: **ninguna transición**. Crea el slide siguiente ya en la pose exacta en la que estaba el anterior, y el paso entre los dos es un corte seco, así que el par se lee como un solo slide cuya animación cambia de comportamiento a la mitad. Un loop perpetuo no tiene último fotograma, así que el slide de origen publica la pose viva de sus actores y la continuación la fija en el instante en que entra: si entregas con la pelota en el aire, sigue en el aire. Una pose de reposo declarada es el plan B obligatorio, lo que hace que el slide funcione solo en `mira-slide-to-video` y para quien abra el deck directamente en él. La transición global del deck nunca se toca, el corte seco es de ese par y de nada más.
