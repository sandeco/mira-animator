import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assembleRun, SLOT_MARKERS } from '../agents/mira-fast/scripts/assemble-run.mjs';
import { countSections, stripNonMarkup, validateFragment } from '../agents/mira-fast/scripts/validate-run.mjs';

/**
 * BUG-20260731-K4NR e BUG-20260731-BNO4.
 *
 * As checagens estruturais do pipeline decidem se existe um elemento `section`
 * aplicando regex sobre texto bruto. Comentário HTML, comentário JavaScript e
 * conteúdo de <script>/<style> contam como marcação. Uma frase de documentação
 * que mencione a tag derruba a montagem.
 *
 * Os quatro primeiros testes são de REPRODUÇÃO: provam que o defeito existe, um por
 * ponto de checagem afetado. Falham hoje.
 * Os dois últimos são de REGRESSÃO: protegem o que a checagem existe para pegar,
 * porque o jeito errado de corrigir isto é afrouxar a regex até ela não proteger mais.
 * Passam hoje e precisam continuar passando depois.
 */

const roots = [];
const MODULOS = ['mira-edit.js', 'mira-edit-free.js', 'mira-draw.js'];

test.after(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
});

function skeleton({ doc = '', extra = '' } = {}) {
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Fixture</title>
<style>
/* @MIRA:THEME:START */
:root { --mira-primary: #FF904D; }
/* @MIRA:THEME:END */
body > section:first-of-type h1,
body > section:first-of-type h2 { text-wrap: balance; }
/* @MIRA:RESPONSIVE:START */
body { max-width: 100%; }
/* @MIRA:RESPONSIVE:END */
</style>
${SLOT_MARKERS.cssStart}
${SLOT_MARKERS.cssEnd}
</head>
<body>
${doc}
${extra}
${SLOT_MARKERS.slidesStart}
${SLOT_MARKERS.slidesEnd}
${SLOT_MARKERS.jsStart}
${SLOT_MARKERS.jsEnd}
</body>
</html>
`;
}

function plan(deckDir) {
  return {
    formato: 'mira-vertical',
    arquivo_saida: 'index-9x16.html',
    deck_dir: deckDir,
    titulo_deck: 'Fixture',
    paleta: 'mira-dark',
    tom: 'direto',
    total_slides: 2,
    ledger: [{ n: 2, familia: 'linear' }],
    slides: [
      { n: 1, tipo: 'capa', modo_folha: 'estatica', slug_stage: 'abertura', titulo: 'Abertura' },
      {
        n: 2, tipo: 'animado', modo_folha: 'animada', slug_stage: 'fluxo', js_id: 'fluxo',
        titulo: 'Fluxo', conceito: 'c', frase_causal: 'f', metafora: 'fluxo', familia: 'linear',
        verbo_causal: 'desce', silhueta: 'icone', espaco: 'retrato', movimento: 'descida', tempo: '1s',
      },
    ],
  };
}

const staticFragment = `<!-- @MIRA:FAST slide=01 stage=abertura kind=static -->
<section class="slide"><h1>Abertura</h1><p>Subtitulo.</p></section>
<!-- @MIRA:FAST css -->
<style></style>
<!-- @MIRA:FAST js -->
<script></script>`;

function animatedFragment({ jsDoc = '' } = {}) {
  return `<!-- @MIRA:FAST slide=02 stage=fluxo kind=animated -->
<section class="slide"><h2>Fluxo</h2><!-- @MIRA:SIZE 3/10 --><div class="anim-stage" id="fluxo-stage"><svg id="fluxo-svg" viewBox="0 0 960 1522.5"></svg></div></section>
<!-- @MIRA:FAST css -->
<style>#fluxo-stage { height: auto; aspect-ratio: 128 / 203; }</style>
<!-- @MIRA:FAST js -->
<script>
function animateFluxo() {
${jsDoc}
  clearTimeout(window.__fluxoTimer);
  window.__fluxoGen = (window.__fluxoGen || 0) + 1;
  const myGen = window.__fluxoGen;
  const svg = d3.select('#fluxo-svg');
  svg.selectAll('*').remove();
  function loop() { if (myGen !== window.__fluxoGen) return; window.__fluxoTimer = setTimeout(loop, 1000); }
  loop();
}
</script>`;
}

function deckFixture({ skeletonOptions, jsDoc } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'mira-fast-section-'));
  roots.push(root);
  const deck = join(root, 'decks', 'fixture');
  const fast = join(deck, 'mira', 'fast');
  const authoring = join(root, 'mira-templates', 'authoring');
  mkdirSync(fast, { recursive: true });
  mkdirSync(join(deck, 'references'), { recursive: true });
  mkdirSync(authoring, { recursive: true });
  for (const module of MODULOS) writeFileSync(join(authoring, module), `// ${module}\n`);
  writeFileSync(join(deck, 'references', 'quadro-metaforas.md'), '# Quadro\n');
  writeFileSync(join(fast, 'plano.json'), JSON.stringify(plan(deck), null, 2));
  writeFileSync(join(fast, 'esqueleto.html'), skeleton(skeletonOptions));
  writeFileSync(join(fast, 'slide-01.html'), staticFragment);
  writeFileSync(join(fast, 'slide-02.html'), animatedFragment({ jsDoc }));
  return { root, deck };
}

/* ---------- REPRODUÇÃO ---------- */

test('K4NR: comentário do esqueleto citando a tag não impede a montagem', () => {
  const { root, deck } = deckFixture({
    skeletonOptions: { doc: '<!-- o overlay é IRMÃO das <section>, nunca filho -->' },
  });
  const result = assembleRun(deck, { projectRoot: root });
  assert.equal(result.ok, true);
  assert.equal(result.slides, 2);
});

test('K4NR: comentário JavaScript do esqueleto citando a tag não impede a montagem', () => {
  const { root, deck } = deckFixture({
    skeletonOptions: { extra: '<script>/* cada <section> é um slide */</script>' },
  });
  const result = assembleRun(deck, { projectRoot: root });
  assert.equal(result.ok, true);
});

test('BNO4: comentário no JS da folha não infla a contagem final', () => {
  const { root, deck } = deckFixture({ jsDoc: '  // o palco vive dentro da <section> deste slide' });
  const result = assembleRun(deck, { projectRoot: root });
  assert.equal(result.ok, true);
  assert.equal(result.slides, 2);
});

test('BNO4: comentário HTML no fragmento não desbalanceia a contagem do fragmento', () => {
  const slide = { n: 2, modo_folha: 'estatica', tipo: 'card', slug_stage: 'x', titulo: 'T' };
  const fragment = `<!-- @MIRA:FAST slide=02 stage=x kind=static -->
<section class="slide"><!-- uma <section> por slide --><h2>T</h2></section>
<!-- @MIRA:FAST css -->
<style></style>
<!-- @MIRA:FAST js -->
<script></script>`;
  assert.deepEqual(validateFragment(slide, fragment, { formato: 'mira-vertical' }), []);
});

/* ---------- REGRESSÃO ---------- */

test('regressão: section REAL fora do slot continua reprovando o esqueleto', () => {
  const { root, deck } = deckFixture({ skeletonOptions: { extra: '<section id="intruso"></section>' } });
  assert.throws(
    () => assembleRun(deck, { projectRoot: root }),
    /<section> fora do slot de slides/,
  );
});

test('regressão: countSections conta elemento e ignora prosa', () => {
  assert.equal(countSections('<section><section></section></section>'), 2);
  assert.equal(countSections('<!-- irmão das <section>, nunca filho -->'), 0);
  assert.equal(countSections('<script>/* cada <section> é um slide */</script>'), 0);
  assert.equal(countSections('<style>/* <section> vira slide */</style>'), 0);
  assert.equal(countSections('<!-- doc --><section class="a">x</section>'), 1);
});

test('regressão: stripNonMarkup preserva as tags de script e style, só esvazia o conteúdo', () => {
  assert.equal(stripNonMarkup('<script>var a = 1;</script>'), '<script></script>');
  assert.equal(stripNonMarkup('<style>a { color: red }</style>'), '<style></style>');
  assert.equal(stripNonMarkup('<p>texto</p>'), '<p>texto</p>');
});

test('regressão: fragmento com duas sections reais continua reprovando', () => {
  const slide = { n: 2, modo_folha: 'estatica', tipo: 'card', slug_stage: 'x', titulo: 'T' };
  const fragment = `<!-- @MIRA:FAST slide=02 stage=x kind=static -->
<section class="slide"><h2>T</h2></section><section class="extra"></section>
<!-- @MIRA:FAST css -->
<style></style>
<!-- @MIRA:FAST js -->
<script></script>`;
  const errors = validateFragment(slide, fragment, { formato: 'mira-vertical' });
  assert.ok(errors.some((error) => /section inválida/.test(error)), errors.join(' | '));
});
