---
name: mira-3d
description: >-
  Adiciona elementos VERDADEIRAMENTE 3D (profundidade real, rotação contínua,
  arrastar e zoom) ao canvas de um slide do Mira, num card limpo onde o 3D é
  maximizado. Escolhe sozinha entre três camadas: CSS 3D puro (formas simples),
  Three.js procedural (esfera de partículas, rede de nós, low-poly de
  primitivas) e glTF (.glb fornecido ou modelo gratuito buscado na web). Herda a
  Regra Zero do mira-animator: o 3D sempre gira sozinho, pausa no arrasto e
  retoma. Atenção ao servidor: um slide que carrega um .glb local NÃO abre por
  file:// (o navegador bloqueia o fetch), só por HTTP; nesse caso a skill sobe
  um servidor local, devolve o link http://localhost e gera um launcher de
  duplo-clique. As camadas CSS 3D e procedural abrem direto. Use SEMPRE que o
  usuário disser /mira-3d, elemento 3D, objeto 3D no slide, coloca um cérebro ou
  robô 3D, esfera de partículas, rede de nós em 3D, carrega esse .glb, modelo
  glTF, ou pedir um slide com profundidade real e rotação.
---

# Skill: Elemento 3D no canvas do slide

Adiciona um elemento **com profundidade real** dentro do card de um slide do Mira: o objeto gira sozinho, o usuário pode arrastar para rotacionar e dar zoom, e o card fica limpo, com o 3D ocupando a maior parte da altura útil.

> **Fonte da verdade:** as decisões desta skill foram congeladas em `BRAINSTORM_MIRA_3D.md` (sessão de 2026-06-11) e o padrão técnico foi validado no slide de teste `decks/teste-3d/` (cérebro glTF) e `decks/teste-3d-drone/`. Quando em dúvida sobre o scaffold Three.js, copie o do teste.

## REGRA ZERO (herdada do mira-animator, INEGOCIÁVEL)

O elemento 3D **nunca entra estático**. Tem que haver movimento perpétuo: rotação automática contínua (`autoRotate`), órbita de câmera ou equivalente. A interação do usuário convive com isso: ao arrastar, o giro automático pausa; após alguns segundos de inatividade, retoma. Se você não consegue descrever o loop em uma frase ("o cérebro gira devagar sozinho e o usuário pode girá-lo na mão"), o slide está incompleto.

## REGRA DE INTERATIVIDADE (obrigatória)

No mínimo **rotacionar (arrastar) e dar zoom (scroll)**. Em Three.js use `OrbitControls`; em model-viewer use `camera-controls`. Pan fica desligado (`enablePan = false`), para o objeto não escapar do enquadramento.

## Regras transversais (herdadas)

- **Idioma:** siga `agents/_shared/idioma.md`. Texto visível em português correto, UTF-8 direto. **Proibido travessão (—):** use vírgula ou dois-pontos.
- **Título:** sem ícone, no máximo 6 palavras, colado no topo (mesma estrutura do `agents/mira-animator/SKILL.md`).
- **Offline no mesmo padrão dos decks:** o deck do Mira nasce offline (libs locais em `assets/vendor/`, abre por `file://`). O Three.js segue a mesma regra: **vendore-o local** (ver "Vendorar o Three") e use o `importmap` apontando para `assets/vendor/three/`, **nunca** para unpkg. Um slide 3D com importmap de CDN quebra atrás de firewall, igual qualquer outra CDN.

## As três camadas (a skill escolhe, o usuário não)

A skill decide a camada a partir da descrição do elemento. Da mais leve para a mais pesada:

1. **CSS 3D puro.** Cubos, cards em camadas, parallax de profundidade. Zero script novo, só `perspective` + `transform-style: preserve-3d` + uma animação CSS em loop. Para formas simples e geométricas.
2. **Three.js procedural (cavalo de batalha).** Abstratos (esfera de partículas, rede de nós 3D, torus, anel orbital) e objetos reconhecíveis em **low-poly montado de primitivas** (robô de caixas e esferas, livro de paralelepípedos, foguete de cones e cilindros). A LLM escreve a geometria direto no código. **Não depende de nenhum arquivo local.**
3. **glTF (GLTFLoader ou model-viewer).** Quando o usuário **fornece um `.glb`**, ou quando aceita a oferta de **buscar um modelo gratuito na web** (ver "Modelos da web"). É a única camada que carrega um **arquivo local**, e por isso é a única que **exige servidor HTTP** (ver "O servidor").

**Trade-off que você deve pesar e, quando relevante, dizer ao usuário:** a camada glTF dá a maior fidelidade visual, mas amarra o slide a um servidor HTTP e, portanto, ao Node instalado na máquina de quem for apresentar. As camadas CSS 3D e procedural abrem direto no navegador (file://), sem servidor e sem Node. Se um objeto reconhecível puder ser bem representado em procedural low-poly, **ofereça essa opção** antes de cair no .glb, porque ela elimina a dependência de servidor para o leigo.

## O servidor (o ponto central, leia com atenção)

**Quando, e só quando, o slide carrega um `.glb` local (camada 3),** o navegador bloqueia o `fetch` do modelo em `file://` (política CORS). O slide precisa ser servido por HTTP. As camadas CSS 3D e procedural **não** disparam essa exigência, abrem direto.

Pré-requisito da camada glTF: **Node.js instalado** na máquina (o servidor usado é o `http-server`, rodado via `npx`). Avise o usuário disso na primeira vez.

Para um slide com `.glb`, faça **as duas coisas**:

### A) Subir o servidor agora e devolver o link (momento da construção)

Quando você (o agente) terminar de montar o slide glТF, **suba o servidor em segundo plano e entregue o link pronto** ao usuário. Não deixe o usuário descobrir sozinho que precisa de servidor.

1. Avise em uma linha: o slide usa um modelo 3D real e por isso precisa de um servidor local (e de Node instalado).
2. Suba o servidor servindo a pasta do deck, em segundo plano:
   ```
   npx --yes http-server <pasta-do-deck> -p 8137 -c-1
   ```
3. **Devolva o link clicável** ao usuário: `http://localhost:8137/index.html` (ou o arquivo do slide). É esse link que ele abre no navegador.
4. Se a porta 8137 estiver ocupada, escolha outra (8138, 8139...) e informe o link com a nova porta.

### B) Gerar o launcher de duplo-clique (momento da apresentação)

O servidor do item A só vive enquanto a sessão do Mira/Claude Code está aberta. Para a pessoa **apresentar depois** (Claude Code fechado), gere na pasta do deck um arquivo **`abrir-slide.cmd`** que ela abre com **duplo-clique**: ele sobe o servidor e abre o navegador no slide, sem terminal. Conteúdo exato a gerar (Windows):

```bat
@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js nao encontrado. Instale em https://nodejs.org e abra este arquivo de novo.
  pause
  exit /b 1
)
echo Abrindo a apresentacao 3D em http://localhost:8137
echo Esta janela e o servidor. Para encerrar a apresentacao, feche-a.
npx --yes http-server . -p 8137 -c-1 -o
```

Notas do launcher: `%~dp0` faz o servidor servir a pasta onde o `.cmd` está (a pasta do deck); o `-o` abre o navegador sozinho quando o servidor sobe; o `where node` dá uma mensagem clara se faltar Node, em vez de um erro críptico; a janela do console aberta É o servidor (fechar = parar). Se o usuário for apresentar em Mac/Linux, gere o equivalente `abrir-slide.command` com `#!/bin/sh`, `cd "$(dirname "$0")"` e a mesma linha do `npx`.

Diga ao usuário, em uma frase, que para apresentar depois basta dar duplo-clique em `abrir-slide.cmd`.

## Composição do card (decisão 5 do brainstorm)

Card **limpo**, com o 3D **maximizado**:

- **Sem pílulas de dica de interação** ("arraste para girar") e **sem linha de atribuição visível** no slide.
- O elemento 3D ocupa a maior parte da altura útil do card. No teste, o wrapper do canvas usa `height: 76vh; min-height: 480px`. O modelo é centralizado e escalado para **preencher o enquadramento** da câmera.
- Estrutura: o `.glass-card` envolve um `<div>` wrapper do canvas (o WebGL substitui o `<svg>` do mira-animator). Título no topo, sem ícone.

**Atribuição de licença:** quando a licença do modelo exigir (CC BY), a atribuição vai em **comentário HTML** no slide e no **README de assets do deck** (`assets/README.md`), nunca como texto visível no slide. Veja o padrão em `decks/teste-3d/index.html` (comentário) e `decks/teste-3d/assets/README.md`.

## Modelos da web (decisões 6 e 7 do brainstorm)

Quando o usuário pedir um **objeto reconhecível** (cérebro, robô, livro) **sem fornecer .glb**, e o procedural não bastar:

1. **Ofereça buscar um modelo gratuito na web** antes de cair no procedural. Se ele aceitar, busque, **valide a licença**, baixe para a pasta `assets/` do deck e insira a atribuição (comentário HTML + README).
2. **Só fontes com link direto e licença explícita (CC0 ou CC BY).** Marketplaces que exigem cadastro ficam fora do download automatizado.
3. Validado na prática: Allen Human Brain Atlas via repositório `hubmapconsortium/ccf-releases` (pasta `v1.2/models`, CC BY 4.0).
4. **Quando a busca não achar nada adequado, ou o usuário preferir escolher visualmente,** indique sites para ele baixar e fornecer o .glb: `sketchfab.com` (filtrar por downloadable + licença CC), `poly.pizza` (low-poly CC0/CC BY) e `hubmapconsortium/ccf-releases` (anatomia). Oriente a conferir licença e formato (.glb/.gltf) antes de baixar.

## Vendorar o Three (offline é inegociável, igual ao resto do deck)

Antes de inserir o slide 3D, **copie o Three vendorado para o deck** (uma vez por deck; se já existir, pule). A pasta já vem na instalação do Mira, em `mira-templates/vendor/three/` (core + `OrbitControls` + `GLTFLoader` + dep transitiva):

```bash
# da raiz do projeto; <deck> e a pasta do deck em decks/
mkdir -p decks/<deck>/assets/vendor/three
cp -r mira-templates/vendor/three/. decks/<deck>/assets/vendor/three/
```

Se o slide usar um addon **além** de OrbitControls/GLTFLoader, ele não está no bundle: baixe-o (com internet) para `assets/vendor/three/addons/<caminho>` preservando a estrutura, ou avise o usuário.

## Scaffold Three.js glTF (canônico, validado no teste)

Base de cena já testada em `decks/teste-3d/index.html`: importmap do Three.js, `OrbitControls`, auto-rotate com retomada, pausa por `IntersectionObserver`, resize. Reuse este esqueleto e troque o caminho do `.glb` e o enquadramento da câmera. **O importmap aponta para a cópia local** (os addons preservam seus imports bare `'three'` / `'three/addons/...'`, que o próprio importmap resolve):

```html
<script type="importmap">
{ "imports": {
    "three": "assets/vendor/three/three.module.js",
    "three/addons/": "assets/vendor/three/addons/"
} }
</script>
```

```js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const wrap = document.getElementById('SLUG-canvas-wrap');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(45, wrap.clientWidth / wrap.clientHeight, 0.1, 100);
camera.position.set(0, 0.4, 3.4);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(wrap.clientWidth, wrap.clientHeight);
wrap.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.55));
const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(2.5, 3, 4); scene.add(key);
const rim = new THREE.DirectionalLight(0xff7733, 2.2); rim.position.set(-4, -1.5, -3); scene.add(rim);

const holder = new THREE.Group(); scene.add(holder);
new GLTFLoader().load('assets/SLUG.glb', (gltf) => {
  const model = gltf.scene;
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  model.position.sub(box.getCenter(new THREE.Vector3()));   // centraliza
  holder.add(model);
  holder.scale.setScalar(2.7 / Math.max(size.x, size.y, size.z));  // preenche o enquadramento
}, undefined, () => {
  // file:// bloqueia o fetch do .glb: abrir por http://localhost (ver launcher abrir-slide.cmd)
});

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.06; controls.enablePan = false;
controls.minDistance = 1.8; controls.maxDistance = 6;
controls.autoRotate = true; controls.autoRotateSpeed = 2.0;   // Regra Zero: gira sozinho
let resume = null;
controls.addEventListener('start', () => { controls.autoRotate = false; clearTimeout(resume); });
controls.addEventListener('end', () => { resume = setTimeout(() => controls.autoRotate = true, 2500); });

let rafId = null;
function animate() { rafId = requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); }
new IntersectionObserver((es) => es.forEach(e => {     // pausa o render fora de tela
  if (e.isIntersecting && rafId === null) animate();
  else if (!e.isIntersecting && rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
}), { threshold: 0.1 }).observe(wrap);
new ResizeObserver(() => {
  const w = wrap.clientWidth, h = wrap.clientHeight; if (!w || !h) return;
  camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h);
}).observe(wrap);
```

Para a **camada procedural (2)**, o mesmo esqueleto de cena/luzes/controls/render vale: troque o bloco do `GLTFLoader` por geometria construída na hora (`THREE.IcosahedronGeometry` para esferas facetadas, `THREE.Points` para nuvem de partículas, grupos de `BoxGeometry`/`SphereGeometry` para um robô low-poly). Sem `.glb`, **não há servidor**: o slide abre direto.

## Passos

1. **Entender o pedido e escolher a camada.** Forma simples e geométrica → CSS 3D. Abstrato ou objeto montável de primitivas → procedural. `.glb` fornecido, ou objeto reconhecível em que o usuário aceita buscar um modelo → glTF.
2. **Se for objeto reconhecível sem .glb:** ofereça procedural (sem servidor) ou busca de modelo na web (com servidor). Deixe o trade-off do servidor claro.
3. **Localizar o destino.** Slide novo ou slide N do deck X, mesmo padrão de acionamento do mira-animator. Insira como uma `<section>` no padrão dos demais slides; preserve o sistema de navegação do deck.
4. **Vendorar o Three (camadas procedural e glTF):** copie `mira-templates/vendor/three/` para `decks/<deck>/assets/vendor/three/` (pule se já existir). O importmap do slide aponta para essa cópia local, nunca para unpkg. (A camada CSS 3D pura não usa Three e dispensa este passo.)
5. **Montar o slide:** card limpo, 3D maximizado, título sem ícone. Use o scaffold acima. Marque a atribuição em comentário HTML quando a licença exigir.
6. **Se a camada for glTF (.glb local):**
   - a) Suba o servidor em segundo plano e **devolva o link** `http://localhost:8137/index.html` ao usuário, avisando do Node.
   - b) Gere o launcher **`abrir-slide.cmd`** na pasta do deck (e o `assets/README.md` com fonte/licença, se baixou modelo da web).
7. **Reportar.** Diga: o caminho do arquivo; a camada escolhida e o loop em uma frase; se há servidor, o link e o lembrete do duplo-clique em `abrir-slide.cmd` para apresentar depois.

## Checklist

- [ ] O elemento 3D gira sozinho (Regra Zero) e pausa/retoma no arrasto.
- [ ] Interação de rotacionar e zoom funciona; pan desligado.
- [ ] Card limpo: sem pílula de dica, sem atribuição visível; 3D maximizado no card.
- [ ] Título sem ícone, no máximo 6 palavras, colado no topo.
- [ ] Render pausa fora de tela (`IntersectionObserver`); resize tratado.
- [ ] **Three vendorado:** `assets/vendor/three/` copiado e importmap apontando para ele; nenhum `unpkg`/CDN no importmap (deck 3D abre offline).
- [ ] **Camada glTF (.glb):** servidor subido e link `http://localhost:...` entregue ao usuário; aviso do Node dado.
- [ ] **Camada glTF (.glb):** launcher `abrir-slide.cmd` gerado na pasta do deck.
- [ ] **Camadas CSS 3D / procedural:** confirmado que abrem em file:// (nenhum servidor exigido).
- [ ] Atribuição (CC BY) em comentário HTML + `assets/README.md`, nunca visível no slide.
- [ ] Nenhum travessão (—); acentuação UTF-8 correta.
```
