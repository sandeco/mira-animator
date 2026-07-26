import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PIPELINE_CORE } from '../lib/installer/agent-sets.js';
import { Writer } from '../lib/installer/writer.js';
import {
  validateFragment, validatePlan, validateRun, validateSlideFile,
} from '../agents/mira-fast/scripts/validate-run.mjs';

const roots = [];
function tempRoot() {
  const root = mkdtempSync(join(tmpdir(), 'mira-fast-test-'));
  roots.push(root);
  return root;
}

test.after(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true });
});

const staticSlide = {
  n: 1,
  slug_stage: 'capa',
  tipo: 'capa',
  modo_folha: 'estatica',
  titulo: 'Concorrência sem mistério',
};

const animatedSlide = {
  n: 2,
  slug_stage: 'corrida',
  js_id: 'corrida',
  tipo: 'animado',
  modo_folha: 'animada',
  titulo: 'Dois fluxos, uma panela',
  subtitulo: 'Quem chega primeiro serve.',
  conceito: 'condição de corrida',
  frase_causal: 'Quando dois fluxos escrevem, o resultado muda porque a ordem interfere.',
  metafora: 'duas mãos servindo da mesma panela',
  familia: 'cozinha',
  verbo_causal: 'sobrepor',
  silhueta: 'panela e conchas',
  espaco: 'duas colunas',
  movimento: 'alternância',
  tempo: 'rajada com pausa',
  pilulas: ['Leitura', 'Escrita', 'Trava'],
  icone_moldura: 'layers',
};

function miraPlan(overrides = {}) {
  return {
    versao: 2,
    slug: 'concorrencia',
    formato: 'mira',
    arquivo_saida: 'index.html',
    deck_dir: 'decks/concorrencia',
    titulo_deck: 'Concorrência',
    paleta: { primaria: '#FF904D', fundo: '#000000', modo: 'cor-unica' },
    tom: 'didático e direto',
    total_slides: 2,
    slides: [staticSlide, animatedSlide],
    ledger: [{ n: 2, assinatura: 'cozinha | sobrepor | panela | colunas | alternância | rajada' }],
    ...overrides,
  };
}

const staticFragment = `<!-- @MIRA:FAST slide=01 stage=capa kind=static -->
<section><h1>Concorrência sem mistério</h1></section>
<!-- @MIRA:FAST css -->
<style></style>
<!-- @MIRA:FAST js -->
<script></script>`;

const animatedFragment = `<!-- @MIRA:FAST slide=02 stage=corrida kind=animated -->
<section><!-- @MIRA:SIZE 3/10 --><div id="corrida-stage"></div></section>
<!-- @MIRA:FAST css -->
<style></style>
<!-- @MIRA:FAST js -->
<script>
function animateCorrida() {
  clearTimeout(window.__corridaTimer);
  window.__corridaGen = (window.__corridaGen || 0) + 1;
}
</script>`;

test('workflow usa pipeline, validação individual e retry limitado', () => {
  assert.ok(PIPELINE_CORE.includes('mira-fast'));
  const workflow = readFileSync(new URL('../workflows/mira-fast-engine.js', import.meta.url), 'utf8');
  assert.match(workflow, /pipeline\(plan\.slides/);
  assert.match(workflow, /async function buildWithRetry/);
  assert.match(workflow, /attempt <= 2/);
  assert.match(workflow, /--slide \$\{slide\.n\}/);
  assert.match(workflow, /contrato-animado\.md/);
  assert.match(workflow, /formato-\$\{plan\.formato\}\.md/);
  assert.ok(workflow.indexOf('pipeline(plan.slides') < workflow.indexOf("mira-fast: montagem"));
});

test('instalador copia o workflow para Claude Code', () => {
  const root = tempRoot();
  const writer = new Writer(root);
  writer.installClaudeWorkflow('mira-fast-engine');
  const installed = join(root, '.claude', 'workflows', 'mira-fast-engine.js');
  assert.ok(existsSync(installed));
  assert.match(readFileSync(installed, 'utf8'), /buildWithRetry/);
});

test('plano e fragmentos estático/animado válidos passam', () => {
  const plan = miraPlan();
  assert.deepEqual(validatePlan(plan), []);
  assert.deepEqual(validateFragment(staticSlide, staticFragment, plan), []);
  assert.deepEqual(validateFragment(animatedSlide, animatedFragment, plan), []);
});

test('folha animada sem protocolo é rejeitada', () => {
  const invalid = `<!-- @MIRA:FAST slide=02 stage=corrida kind=animated -->
<section><div id="corrida-stage"></div></section>
<!-- @MIRA:FAST css --><style></style>
<!-- @MIRA:FAST js --><script></script>`;
  const errors = validateFragment(animatedSlide, invalid, miraPlan());
  assert.ok(errors.some((error) => error.includes('@MIRA:SIZE')));
  assert.ok(errors.some((error) => error.includes('animateCorrida')));
  assert.ok(errors.some((error) => error.includes('generation counter')));
});

test('validação individual não depende do término das outras folhas', () => {
  const root = tempRoot();
  const fastDir = join(root, 'mira', 'fast');
  mkdirSync(fastDir, { recursive: true });
  writeFileSync(join(fastDir, 'plano.json'), JSON.stringify(miraPlan()));
  writeFileSync(join(fastDir, 'slide-01.html'), staticFragment);
  const result = validateSlideFile(root, 1);
  assert.equal(result.ok, true);
  assert.equal(result.slide, 1);
});

test('validação completa exige N folhas e rejeita fragmento extra', () => {
  const root = tempRoot();
  const fastDir = join(root, 'mira', 'fast');
  mkdirSync(fastDir, { recursive: true });
  writeFileSync(join(fastDir, 'plano.json'), JSON.stringify(miraPlan()));
  writeFileSync(join(fastDir, 'slide-01.html'), staticFragment);

  const missing = validateRun(root);
  assert.equal(missing.ok, false);
  assert.ok(missing.errors.includes('slide 2: fragmento ausente'));

  writeFileSync(join(fastDir, 'slide-02.html'), animatedFragment);
  writeFileSync(join(fastDir, 'slide-99.html'), staticFragment);
  const extra = validateRun(root);
  assert.equal(extra.ok, false);
  assert.ok(extra.errors.includes('fragmento inesperado: slide-99.html'));
  rmSync(join(fastDir, 'slide-99.html'));

  const complete = validateRun(root);
  assert.equal(complete.ok, true);
  assert.equal(complete.total, 2);
});

test('layouts Studio são validados pelo contrato do formato', () => {
  const camera = {
    n: 1, slug_stage: 'camera-01', tipo: 'card', modo_folha: 'estatica', layout: 'camera', fala: 'Abertura.',
  };
  const plan = {
    ...miraPlan(), formato: 'mira-studio', arquivo_saida: 'index.html', total_slides: 1,
    slides: [camera], ledger: [],
  };
  const valid = `<!-- @MIRA:FAST slide=01 stage=camera-01 kind=static -->
<section data-layout="camera"><div class="cam-area"></div></section>
<!-- @MIRA:FAST css --><style></style>
<!-- @MIRA:FAST js --><script></script>`;
  assert.deepEqual(validatePlan(plan), []);
  assert.deepEqual(validateFragment(camera, valid, plan), []);
  assert.ok(validateFragment(camera, valid.replace('cam-area', 'outra-area'), plan).some((error) => error.includes('cam-area')));
});

test('vertical exige palco e viewBox retrato', () => {
  const slide = { ...animatedSlide };
  const plan = {
    ...miraPlan(), formato: 'mira-vertical', arquivo_saida: 'index-9x16.html', slides: [staticSlide, slide],
  };
  const vertical = animatedFragment
    .replace('<style></style>', '<style>#corrida-stage { aspect-ratio: 128 / 203; }</style>')
    .replace('<div id="corrida-stage"></div>', '<div id="corrida-stage"><svg viewBox="0 0 960 1522.5"></svg></div>');
  assert.deepEqual(validateFragment(slide, vertical, plan), []);
  assert.ok(validateFragment(slide, animatedFragment, plan).some((error) => error.includes('128/203')));
});