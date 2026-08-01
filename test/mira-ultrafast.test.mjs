import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { PIPELINE_CORE } from '../lib/installer/agent-sets.js';
import { Writer } from '../lib/installer/writer.js';
import { buildMiraSkeleton, buildSkeleton, MARKERS } from '../agents/mira-ultrafast/scripts/build-skeleton.mjs';
import { appendTiming, effectiveSlots } from '../agents/mira-ultrafast/scripts/timings.mjs';
import { renderBoard } from '../agents/mira-ultrafast/scripts/render-board.mjs';

const roots = [];
test.after(() => roots.forEach((root) => rmSync(root, { recursive: true, force: true })));
function temp() { const root = mkdtempSync(join(tmpdir(), 'mira-ultrafast-')); roots.push(root); return root; }

test('skill e workflow ultrafast entram no instalador sem alterar o fast', () => {
  assert.ok(PIPELINE_CORE.includes('mira-fast'));
  assert.ok(PIPELINE_CORE.includes('mira-ultrafast'));
  const root = temp();
  const writer = new Writer(root);
  writer.installSkill('mira-ultrafast', '.claude/skills');
  writer.installClaudeWorkflow('mira-ultrafast-engine');
  assert.ok(existsSync(join(root, '.claude/skills/mira-ultrafast/SKILL.md')));
  assert.ok(existsSync(join(root, '.claude/workflows/mira-ultrafast-engine.js')));
});

test('esqueleto mira é determinístico, preserva runtime e abre seis slots', () => {
  const html = buildMiraSkeleton(resolve('.'));
  assert.match(html, /MIRA-DEFAULT/);
  assert.match(html, /Navegação slide a slide/);
  assert.doesNotMatch(html, /<section\b/);
  for (const marker of Object.values(MARKERS)) assert.equal(html.split(marker).length - 1, 1);
  assert.ok(html.indexOf(MARKERS.cssStart) < html.indexOf('</head>'));
  assert.ok(html.indexOf(MARKERS.slidesEnd) < html.indexOf(MARKERS.jsStart));
});

test('esqueletos determinísticos cobrem os quatro formatos', () => {
  for (const format of ['mira', 'mira-studio', 'mira-studio-full', 'mira-vertical']) {
    const deck = join(temp(), format);
    const output = buildSkeleton(format, deck, { projectRoot: resolve('.') });
    const html = readFileSync(output, 'utf8');
    assert.doesNotMatch(html, /<section\b/i, `${format}: section residual`);
    assert.match(html, /@MIRA:THEME:START/);
    assert.match(html, /@MIRA:RESPONSIVE:START/);
    assert.match(html, /text-wrap: balance/);
    for (const marker of Object.values(MARKERS)) assert.equal(html.split(marker).length - 1, 1, `${format}: ${marker}`);
  }
});

test('timings registra máquina e etapas comparáveis', () => {
  const deck = temp();
  mkdirSync(join(deck, 'mira/fast'), { recursive: true });
  appendTiming(deck, { etapa: 'folha', inicio: '2026-07-31T00:00:00.000Z', fim: '2026-07-31T00:00:00.125Z', n: 1, tentativa: 1 });
  const value = JSON.parse(readFileSync(join(deck, 'mira/fast/timings.json'), 'utf8'));
  assert.equal(value.etapas[0].duracao_ms, 125);
  assert.equal(value.vagas_efetivas, effectiveSlots(value.cpus));
});

test('quadro é renderizado do plano sem tocar em outras referências', () => {
  const deck = temp();
  mkdirSync(join(deck, 'mira/fast'), { recursive: true });
  mkdirSync(join(deck, 'references'), { recursive: true });
  writeFileSync(join(deck, 'references/fonte.md'), 'intacta\n');
  const slide = { n: 2, modo_folha: 'animada', conceito: 'fila', familia: 'rua', metafora: 'pedágio', verbo_causal: 'reter', silhueta: 'cabines', espaco: 'corredores', movimento: 'afunilar', tempo: 'ondas' };
  writeFileSync(join(deck, 'mira/fast/plano.json'), JSON.stringify({ slides: [slide], ledger: [{ n: 2, assinatura: 'rua | reter | cabines | corredores | afunilar | ondas' }] }));
  renderBoard(deck);
  assert.match(readFileSync(join(deck, 'references/quadro-metaforas.md'), 'utf8'), /pedágio/);
  assert.equal(readFileSync(join(deck, 'references/fonte.md'), 'utf8'), 'intacta\n');
});

test('workflow sobrepõe detalhe e construção, guarda fan-out e limita retry', () => {
  const source = readFileSync(new URL('../workflows/mira-ultrafast-engine.js', import.meta.url), 'utf8');
  assert.match(source, /pipeline\(plan\.slides/);
  assert.match(source, /slots < 4/);
  assert.match(source, /slots >= 4/);
  assert.match(source, /mira-studio-full/);
  assert.match(source, /mira-vertical/);
  assert.match(source, /attempt <= 2/);
  assert.match(source, /phase: 'detalhar'/);
  assert.match(source, /phase: 'construir'/);
  assert.match(source, /MIRA_ULTRAFAST_FASE_ZERO_INCOMPLETA/);
  assert.doesNotMatch(source, /mira-ultrafast: montagem/);
});
