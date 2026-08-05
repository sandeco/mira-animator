# Mira — bibliotecas vendoradas (modo offline)

Cópias locais e pinadas das libs que um deck do Mira normalmente carrega por CDN.
Existem para o modo offline (`/mira-offline`): empresas com firewall costumam liberar
o registry do npm (por isso `npx mira-animator install` funciona) mas bloquear CDNs
avulsas (`cdn.tailwindcss.com`, `unpkg.com`, `fonts.googleapis.com`). Com estas cópias
o deck abre 100% local, por `file://`, sem bater em nenhuma origem externa.

Estas libs viajam dentro do pacote npm (`templates/` é publicado) e o instalador as
copia para `mira-templates/vendor/` no projeto. A skill `/mira-offline` copia daqui
para `<deck>/assets/vendor/` e reescreve os HTMLs do deck para caminhos relativos.

## Conteúdo e versões

| Arquivo | Versão | Origem |
|---|---|---|
| `tailwind.js` | Play CDN (runtime) | `https://cdn.tailwindcss.com` |
| `aos.css` / `aos.js` | 2.3.1 | `https://unpkg.com/aos@2.3.1/dist/` |
| `lucide.js` | 1.21.0 (UMD) | `https://unpkg.com/lucide@1.21.0/dist/umd/lucide.min.js` |
| `d3.v7.min.js` | 7.9.0 | `https://d3js.org/d3.v7.min.js` |
| `gsap.min.js` | 3.13.0 | `https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js` |
| `inter.css` + `fonts/*.woff2` | Inter v20 (variável) | `https://fonts.googleapis.com/css2?family=Inter` |
| `three/` (core + OrbitControls + GLTFLoader + BufferGeometryUtils) | three 0.160.0 | `https://unpkg.com/three@0.160.0` |
| `mp4-muxer.js` | 5.2.2 (UMD, global `Mp4Muxer`) | `https://registry.npmjs.org/mp4-muxer/-/mp4-muxer-5.2.2.tgz` (build/mp4-muxer.js) |

Notas:
- **Tailwind** é o Play CDN (compila no navegador em runtime). Funciona por `file://`;
  imprime no console um aviso "not for production" — inofensivo para um deck.
- **Inter** é fonte variável: um único woff2 por subset cobre todo o eixo 100–900.
  Guardamos só os subsets `latin` e `latin-ext` (acentos PT-BR vivem no `latin`,
  U+00C0–00FF). `inter.css` referencia os woff2 por caminho relativo.
- **Three.js** (`three/`): só é copiado para o deck quando ele usa 3D (mira-3d).
  Cobre o scaffold canônico (OrbitControls + GLTFLoader). Um addon fora desse par
  precisa ser adicionado aqui (rode o fecho transitivo a partir do novo entry point).
- **GSAP** (`gsap.min.js`): core, sem plugins. É a única dependência do
  `mira-cinema.js` (câmera, profundidade, grade), que precisa dele em TODO deck
  que ligue o cinema, inclusive por `file://` e sem rede. Por isso ele passou a
  viver aqui, e não só por-deck.
  As skills de morph continuam vendorando a própria cópia em `assets/gsap/`,
  porque elas também precisam de `DrawSVGPlugin` e `MotionPathPlugin`, que NÃO
  ficam aqui. As duas cópias coexistem de propósito: o core para o cinema, o
  conjunto com plugins para o morph.
- **mp4-muxer** (MIT): muxer MP4 usado pelo `mira-record.js` no caminho WebCodecs
  (encoder GPU/CPU forçado, estilo OBS). O `mira-record.js` o carrega sob demanda de
  `<deck>/assets/vendor/mp4-muxer.js` — decks `mira-studio` devem receber esta cópia.

## Como regenerar (com internet aberta)

```bash
cd templates/vendor
UA="Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0"
curl -sL -A "$UA" https://cdn.tailwindcss.com -o tailwind.js
curl -sL https://unpkg.com/aos@2.3.1/dist/aos.css -o aos.css
curl -sL https://unpkg.com/aos@2.3.1/dist/aos.js  -o aos.js
curl -sL https://unpkg.com/lucide@1.21.0/dist/umd/lucide.min.js -o lucide.js
curl -sL https://d3js.org/d3.v7.min.js -o d3.v7.min.js
# Inter: baixar o css2 com UA de Chrome (sem isso vem TTF), manter latin/latin-ext,
# baixar os woff2 e reescrever os src para fonts/inter-<subset>.woff2 (uma woff2 por
# subset, font-weight: 100 900, por ser fonte variável).
```
