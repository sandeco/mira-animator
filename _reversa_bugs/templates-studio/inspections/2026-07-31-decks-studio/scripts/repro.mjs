import { mkdirSync, writeFileSync, copyFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { assembleRun } from '/workspaces/.mira/agents/mira-fast/scripts/assemble-run.mjs';

const ROOT = '/workspaces/.mira';
const BASE = '/tmp/claude-1000/-workspaces--mira/29f9cf5b-8d42-421c-8dee-88b6bc1e9364/scratchpad/pentefino';
const deck = join(BASE, 'decks', '2026-07-31 pente-fino-studio');
const fast = join(deck, 'mira', 'fast');
mkdirSync(fast, { recursive: true });
mkdirSync(join(deck, 'references'), { recursive: true });
writeFileSync(join(deck, 'references', 'quadro-metaforas.md'), '# Quadro\n');

// Esqueleto: o TEMPLATE REAL, cru, como a Fase 1 o herdaria.
const template = readFileSync(join(ROOT, 'templates/decks/mira-studio-demo/index.html'), 'utf8');
writeFileSync(join(fast, 'esqueleto.html'), template);

// Plano mínimo válido: capa + camera + split animado + full animado
const plan = {
  formato: 'mira-studio', arquivo_saida: 'index.html', deck_dir: deck,
  titulo_deck: 'Pente-fino Studio', paleta: 'mira-dark', tom: 'direto',
  total_slides: 4,
  slides: [
    { n:1, tipo:'capa', layout:'capa', modo_folha:'estatica', slug_stage:'abertura', titulo:'Corte de *80 por cento*', fala:'Fala da capa.' },
    { n:2, tipo:'card', layout:'camera', modo_folha:'estatica', slug_stage:'so-camera', fala:'Fala da camera.' },
    { n:3, tipo:'animado', layout:'split', modo_folha:'animada', slug_stage:'hub-central', js_id:'hubCentral',
      titulo:'Hub *central*', fala:'Fala do split.', conceito:'c', frase_causal:'f', metafora:'hub', familia:'radial',
      verbo_causal:'puxa', silhueta:'icone', espaco:'quadrado', movimento:'orbita', tempo:'1s' },
    { n:4, tipo:'animado', layout:'full', modo_folha:'animada', slug_stage:'fluxo-vertical', js_id:'fluxoVertical',
      titulo:'Fluxo *vertical*', fala:'Fala do full.', conceito:'c', frase_causal:'f', metafora:'fluxo', familia:'linear',
      verbo_causal:'desce', silhueta:'icone', espaco:'retrato', movimento:'descida', tempo:'1s' },
  ],
  ledger: [{ n:3, familia:'radial' }, { n:4, familia:'linear' }],
};
writeFileSync(join(fast, 'plano.json'), JSON.stringify(plan, null, 2));

// Fragmentos exatamente como formato-mira-studio.md manda
const frag = (n, stage, kind, html, js='') =>
`<!-- @MIRA:FAST slide=${String(n).padStart(2,'0')} stage=${stage} kind=${kind} -->
${html}
<!-- @MIRA:FAST css -->
<style></style>
<!-- @MIRA:FAST js -->
<script>${js}</script>`;

const anim = (jsId, stage) => `
function animate${jsId[0].toUpperCase()+jsId.slice(1)}() {
  clearTimeout(window.__${jsId}Timer);
  window.__${jsId}Gen = (window.__${jsId}Gen || 0) + 1;
  const myGen = window.__${jsId}Gen;
  const svg = d3.select('#${stage}-svg');
  svg.selectAll('*').remove();
  function loop(){ if (myGen !== window.__${jsId}Gen) return; window.__${jsId}Timer = setTimeout(loop, 1000); }
  loop();
}`;

// capa: "section sem data-layout, com titulo e subtitulo" (contrato, verbatim)
writeFileSync(join(fast,'slide-01.html'), frag(1,'abertura','static',
  '<section><h1>Corte de <span class="accent">80 por cento</span></h1><p>Subtitulo curto.</p></section>'));
writeFileSync(join(fast,'slide-02.html'), frag(2,'so-camera','static',
  '<section data-layout="camera"><div class="cam-area"></div></section>'));
writeFileSync(join(fast,'slide-03.html'), frag(3,'hub-central','animated',
  '<section data-layout="split"><div class="split-top"><h2>Hub <span class="accent">central</span></h2><!-- @MIRA:SIZE 3/10 --><div class="anim-stage" id="hub-central-stage"><svg id="hub-central-svg" viewBox="0 0 960 960"></svg></div></div><div class="cam-area"></div></section>',
  anim('hubCentral','hub-central')));
writeFileSync(join(fast,'slide-04.html'), frag(4,'fluxo-vertical','animated',
  '<section data-layout="full"><h2>Fluxo <span class="accent">vertical</span></h2><!-- @MIRA:SIZE 3/10 --><div class="anim-stage" id="fluxo-vertical-stage"><svg id="fluxo-vertical-svg" viewBox="0 0 960 1522.5"></svg></div></section>',
  anim('fluxoVertical','fluxo-vertical')));
for (const n of [1,2,3,4]) writeFileSync(join(fast,`result-0${n}.json`), JSON.stringify({n, ok:true, validation:'pass', attempts:1}));

try {
  const r = assembleRun(deck, { projectRoot: ROOT });
  console.log('MONTOU:', JSON.stringify(r, null, 2));
} catch (e) {
  console.log('FALHOU COM:\n' + e.message.split(' | ').map(x=>'  - '+x).join('\n'));
}
