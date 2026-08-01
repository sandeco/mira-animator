/**
 * Os quatro caminhos de obtenção do esqueleto, medidos contra validateSkeleton.
 * Evidência de BUG-20260731-OI56 e da metade Studio, BUG-20260801-VPUH.
 *
 *   node _reversa_bugs/templates-studio/bugs/BUG-20260731-OI56-esqueleto-sem-marcadores-mira/evidence/comparar-caminhos.mjs
 *
 * Autocontido: cria a própria instalação temporária e roda o CLI real. Não
 * depende de nenhum deck pré-existente.
 *
 * ANTES da correção de 2026-08-01, os três primeiros caminhos reprovavam.
 * DEPOIS, só a cópia manual reprova, e de propósito: é justamente por isso que
 * a Fase 1 passou a usar o caminho canônico (CHG-005).
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SLOT_MARKERS, validateSkeleton } from '../../../../../agents/mira-fast/scripts/assemble-run.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..');
const SECTION_RE = /^[ \t]*<section\b[^>]*>[\s\S]*?^[ \t]*<\/section>[ \t]*\n?/gmi;

function abrirSlots(html) {
  html = html.replace(/\r\n?/g, '\n');
  const corpo = html.search(/<body\b[^>]*>/i);
  const cabeca = html.slice(0, corpo);
  let resto = html.slice(corpo);
  let posto = false;
  resto = resto.replace(SECTION_RE, () => {
    if (posto) return '';
    posto = true;
    return `${SLOT_MARKERS.slidesStart}\n${SLOT_MARKERS.slidesEnd}\n`;
  });
  html = cabeca + resto;
  html = html.replace('</head>', `${SLOT_MARKERS.cssStart}\n${SLOT_MARKERS.cssEnd}\n</head>`);
  return html.replace('</body>', `${SLOT_MARKERS.jsStart}\n${SLOT_MARKERS.jsEnd}\n</body>`);
}

const sandbox = mkdtempSync(join(tmpdir(), 'oi56-'));
writeFileSync(join(sandbox, 'mira.config.json'), '{"version":"0.0.0","engines":["claude-code"]}\n');

function viaCli(deckTemplate, nome) {
  execFileSync(process.execPath, [
    join(ROOT, 'bin', 'mira.js'), 'new', nome, `--deck=${deckTemplate}`, '--theme=mira-dark',
  ], { cwd: sandbox, stdio: 'pipe' });
  return readFileSync(join(sandbox, 'decks', nome, 'index.html'), 'utf8');
}

const casos = [
  ['template Studio CRU (cópia manual)', () => readFileSync(join(ROOT, 'templates/decks/mira-studio-demo/index.html'), 'utf8'), 'mira-studio'],
  ['Studio via CLI canônico', () => viaCli('mira-studio-demo', 'studio'), 'mira-studio'],
  ['mira-default CRU (cópia manual)', () => readFileSync(join(ROOT, 'templates/decks/mira-default/index.html'), 'utf8'), 'mira'],
  ['mira-default via CLI canônico', () => viaCli('mira-default', 'padrao'), 'mira'],
];

for (const [nome, obter, formato] of casos) {
  const erros = validateSkeleton(abrirSlots(obter()), formato);
  console.log(`${nome.padEnd(38)} ${erros.length ? 'REPROVA: ' + erros.join(' | ') : 'PASSA'}`);
}

rmSync(sandbox, { recursive: true, force: true });
console.log('\nA cópia manual continuar reprovando é o esperado: é a razão de a Fase 1');
console.log('ter passado a usar o caminho canônico (CHG-005 do BUG-20260731-OI56).');
