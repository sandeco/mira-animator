import test from 'node:test';
import assert from 'node:assert/strict';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { assembleRun, SLOT_MARKERS } from '../agents/mira-fast/scripts/assemble-run.mjs';

const roots = [];
const allModules = [
  'mira-edit.js',
  'mira-edit-free.js',
  'mira-draw.js',
  'mira-camera.js',
  'mira-record.js',
  'mira-record-16x9.js',
];

test.after(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
});

function animatedSlide(format) {
  const slide = {
    n: 2,
    slug_stage: 'corrida',
    js_id: 'corrida',
    tipo: 'animado',
    modo_folha: 'animada',
    titulo: 'Dois fluxos, uma panela',
    conceito: 'condição de corrida',
    frase_causal: 'Quando dois fluxos escrevem, o resultado muda porque a ordem interfere.',
    metafora: 'duas mãos servindo da mesma panela',
    familia: 'cozinha',
    verbo_causal: 'sobrepor',
    silhueta: 'panela e conchas',
    espaco: 'duas colunas',
    movimento: 'alternância',
    tempo: 'rajada com pausa',
  };
  if (format === 'mira-studio') Object.assign(slide, { layout: 'split', fala: 'Explique a corrida.' });
  if (format === 'mira-studio-full') Object.assign(slide, { layout: 'thirds', fala: 'Explique a corrida.' });
  return slide;
}

function staticSlide(format) {
  if (format === 'mira-studio' || format === 'mira-studio-full') {
    return {
      n: 1,
      slug_stage: 'camera',
      tipo: 'card',
      modo_folha: 'estatica',
      layout: 'camera',
      fala: 'Abra olhando para a câmera.',
    };
  }
  return {
    n: 1,
    slug_stage: 'capa',
    tipo: 'capa',
    modo_folha: 'estatica',
    titulo: 'Concorrência sem mistério',
    subtitulo: 'Uma explicação visual',
  };
}

function planFor(format) {
  const outputs = {
    mira: 'index.html',
    'mira-studio': 'index.html',
    'mira-studio-full': 'index-16x9.html',
    'mira-vertical': 'index-9x16.html',
  };
  return {
    versao: 2,
    slug: `teste-${format}`,
    formato: format,
    arquivo_saida: outputs[format],
    deck_dir: `decks/teste-${format}`,
    titulo_deck: `Teste ${format}`,
    subtitulo_deck: 'Montagem determinística',
    paleta: { primaria: '#FF904D', fundo: '#000000', modo: 'cor-unica' },
    tom: 'didático e direto',
    total_slides: 2,
    slides: [staticSlide(format), animatedSlide(format)],
    ledger: [{ n: 2, assinatura: 'cozinha | sobrepor | panela | colunas | alternância | rajada' }],
  };
}

function skeletonFor(format) {
  const miraDefault = format === 'mira'
    ? '/* MIRA-DEFAULT */ :root { --mira-primary: #FF904D; --fmt-w: 100vw; --fmt-h: 56.25vw; } .slide-main { display: flex; } .slide-centro { display: flex; }'
    : '';
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Teste</title>
<style>
/* @MIRA:THEME:START */
:root { --primary: #FF904D; }
/* @MIRA:THEME:END */
body > section:first-of-type h1,
body > section:first-of-type h2 { text-wrap: balance; }
/* @MIRA:RESPONSIVE:START */
body { max-width: 100%; }
${miraDefault}
/* @MIRA:RESPONSIVE:END */
</style>
${SLOT_MARKERS.cssStart}
${SLOT_MARKERS.cssEnd}
</head>
<body>
<div id="runtime-preservado" data-format="${format}"></div>
${SLOT_MARKERS.slidesStart}
${SLOT_MARKERS.slidesEnd}
<script id="roteiro-builder">window.__skeletonPreserved = ${JSON.stringify(format)};</script>
${SLOT_MARKERS.jsStart}
${SLOT_MARKERS.jsEnd}
</body>
</html>
`;
}

const animationJs = `<script>
function animateCorrida() {
  clearTimeout(window.__corridaTimer);
  window.__corridaGen = (window.__corridaGen || 0) + 1;
  const myGen = window.__corridaGen;
  var svg = d3.select('#corrida-svg');
  var r = svg.node().closest('.anim-stage').getBoundingClientRect();
  var H = Math.round(960 * r.height / r.width);
  svg.attr('viewBox', '0 0 960 ' + H);
  var primary = getComputedStyle(document.documentElement).getPropertyValue('--mira-primary').trim();
  svg.attr('color', primary);
  if (myGen !== window.__corridaGen) return;
}
</script>`;

function staticFragment(format) {
  let html;
  let css = '';
  if (format === 'mira') {
    html = '<section><div class="slide-centro"><h1>Concorrência <span class="accent">sem mistério</span></h1></div></section>';
  } else if (format === 'mira-studio' || format === 'mira-studio-full') {
    html = '<section data-layout="camera"><div class="cam-area"></div></section>';
  } else {
    html = '<section class="slide"><h1>Concorrência sem mistério</h1><p>Uma explicação visual</p></section>';
  }
  return `<!-- @MIRA:FAST slide=01 stage=${format.startsWith('mira-studio') ? 'camera' : 'capa'} kind=static -->
${html}
<!-- @MIRA:FAST css -->
<style>${css}</style>
<!-- @MIRA:FAST js -->
<script></script>`;
}

function animatedFragment(format) {
  let html;
  let css = '';
  if (format === 'mira') {
    html = '<section><div class="slide-main"><h2>Dois fluxos, <span class="accent">uma panela</span></h2><!-- @MIRA:SIZE 3/10 --><div class="anim-stage" id="corrida-stage"><svg id="corrida-svg" preserveAspectRatio="xMidYMid meet"></svg></div></div></section>';
  } else if (format === 'mira-studio') {
    html = '<section data-layout="split"><div class="split-top"><h2>Dois fluxos</h2><!-- @MIRA:SIZE 3/10 --><div id="corrida-stage"><svg viewBox="0 0 960 960"></svg></div></div><div class="cam-area"></div></section>';
  } else if (format === 'mira-studio-full') {
    html = '<section data-layout="thirds"><div class="thirds-main"><h2>Dois fluxos</h2><!-- @MIRA:SIZE 3/10 --><div id="corrida-stage"><svg viewBox="0 0 1280 720"></svg></div></div><div class="cam-area"></div></section>';
  } else {
    html = '<section class="slide"><h2>Dois fluxos</h2><!-- @MIRA:SIZE 3/10 --><div id="corrida-stage"><svg viewBox="0 0 960 1522.5"></svg></div></section>';
    css = '#corrida-stage { height: auto; aspect-ratio: 128 / 203; }';
  }
  return `<!-- @MIRA:FAST slide=02 stage=corrida kind=animated -->
${html}
<!-- @MIRA:FAST css -->
<style>${css}</style>
<!-- @MIRA:FAST js -->
${animationJs}`;
}

function fixture(format) {
  const root = mkdtempSync(join(tmpdir(), 'mira-fast-assemble-'));
  roots.push(root);
  const deck = join(root, 'decks', `teste-${format}`);
  const fast = join(deck, 'mira', 'fast');
  const authoring = join(root, 'mira-templates', 'authoring');
  const studio = join(root, 'mira-templates', 'studio');
  const vendor = join(root, 'mira-templates', 'vendor');
  mkdirSync(fast, { recursive: true });
  mkdirSync(join(deck, 'references'), { recursive: true });
  mkdirSync(authoring, { recursive: true });
  mkdirSync(studio, { recursive: true });
  mkdirSync(vendor, { recursive: true });
  for (const module of allModules) writeFileSync(join(authoring, module), `// ${module}\n`);
  for (const file of [
    'mira-studio-server.cjs',
    'mira-studio-windows.bat',
    'mira-studio-16x9-windows.bat',
    'mira-studio-16x9-apple.command',
  ]) writeFileSync(join(studio, file), `# ${file}\n`);
  for (const file of ['d3.v7.min.js', 'mp4-muxer.js']) writeFileSync(join(vendor, file), `// ${file}\n`);

  writeFileSync(join(deck, 'references', 'quadro-metaforas.md'), '# Quadro\n');
  writeFileSync(join(fast, 'plano.json'), JSON.stringify(planFor(format), null, 2));
  writeFileSync(join(fast, 'esqueleto.html'), skeletonFor(format));
  writeFileSync(join(fast, 'slide-01.html'), staticFragment(format));
  writeFileSync(join(fast, 'slide-02.html'), animatedFragment(format));
  writeFileSync(join(fast, 'result-01.json'), JSON.stringify({ n: 1, ok: true, validation: 'pass', attempts: 1 }));
  writeFileSync(join(fast, 'result-02.json'), JSON.stringify({ n: 2, ok: true, validation: 'pass', attempts: 1 }));
  return { root, deck, fast };
}

for (const format of ['mira', 'mira-studio', 'mira-studio-full', 'mira-vertical']) {
  test(`montagem determinística cobre ${format}`, () => {
    const { root, deck } = fixture(format);
    const first = assembleRun(deck, { projectRoot: root });
    const output = readFileSync(first.output, 'utf8');
    assert.equal(first.slides, 2);
    assert.equal((output.match(/<section\b/g) ?? []).length, 2);
    assert.ok(output.indexOf('@MIRA:FAST:SLIDE 01') < output.indexOf('@MIRA:FAST:SLIDE 02'));
    assert.match(output, /@MIRA:THEME:START/);
    assert.match(output, /@MIRA:RESPONSIVE:START/);
    assert.match(output, /id="runtime-preservado"/);
    assert.match(output, /id="mira-fast-generated"/);
    assert.match(output, /IntersectionObserver/);
    assert.match(output, /MutationObserver/);

    const expectedModules = format === 'mira-studio'
      ? ['mira-edit.js', 'mira-edit-free.js', 'mira-draw.js', 'mira-camera.js', 'mira-record.js']
      : format === 'mira-studio-full'
        ? ['mira-edit.js', 'mira-edit-free.js', 'mira-draw.js', 'mira-camera.js', 'mira-record-16x9.js']
        : ['mira-edit.js', 'mira-edit-free.js', 'mira-draw.js'];
    let previous = -1;
    for (const module of expectedModules) {
      assert.ok(existsSync(join(deck, 'mira', module)));
      const position = output.indexOf(`src="mira/${module}"`);
      assert.ok(position > previous, `${module} fora de ordem`);
      previous = position;
    }

    const firstBytes = readFileSync(first.output);
    const second = assembleRun(deck, { projectRoot: root });
    assert.deepEqual(readFileSync(second.output), firstBytes);
    assert.equal(second.sha256, first.sha256);
    assert.match(readFileSync(join(deck, 'mira', 'fast', 'montagem.log'), 'utf8'), /resultado: PASS/);

    if (format === 'mira-studio' || format === 'mira-studio-full') {
      assert.match(readFileSync(join(deck, 'roteiro.md'), 'utf8'), /## Slide 1 \| camera/);
      assert.ok(existsSync(join(deck, 'mira', 'mira-studio-server.cjs')));
      assert.ok(existsSync(join(deck, 'assets', 'vendor', 'd3.v7.min.js')));
      assert.ok(existsSync(join(deck, 'assets', 'vendor', 'mp4-muxer.js')));
    }
    assert.equal(basename(first.output), planFor(format).arquivo_saida);
  });
}

test('falha não substitui uma saída válida anterior', () => {
  const { root, deck, fast } = fixture('mira');
  const output = join(deck, 'index.html');
  writeFileSync(output, 'SAIDA ANTERIOR\n');
  writeFileSync(join(fast, 'result-02.json'), JSON.stringify({ n: 2, ok: false, validation: 'falhou', attempts: 2 }));
  assert.throws(() => assembleRun(deck, { projectRoot: root }), /status de falha/);
  assert.equal(readFileSync(output, 'utf8'), 'SAIDA ANTERIOR\n');
  assert.match(readFileSync(join(fast, 'montagem.log'), 'utf8'), /resultado: FAIL/);
});

test('esqueleto sem slot obrigatório é rejeitado', () => {
  const { root, deck, fast } = fixture('mira');
  const skeleton = readFileSync(join(fast, 'esqueleto.html'), 'utf8')
    .replace(SLOT_MARKERS.cssStart, '');
  writeFileSync(join(fast, 'esqueleto.html'), skeleton);
  assert.throws(() => assembleRun(deck, { projectRoot: root }), /marcador de esqueleto/);
  assert.equal(existsSync(join(deck, 'index.html')), false);
});
