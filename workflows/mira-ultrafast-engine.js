import { execFile } from 'node:child_process';
import { existsSync, renameSync, writeFileSync } from 'node:fs';
import { cpus } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';

export const meta = {
  name: 'mira-ultrafast-engine',
  description: 'Sobrepõe detalhamento e construção de folhas e mede cada etapa do deck Mira.',
};

const run = promisify(execFile);
const invocation = typeof args === 'string' ? JSON.parse(args) : (args ?? {});
const deckDir = resolve(invocation.deck_dir);
const format = invocation.formato ?? 'mira';
const outputs = { mira: 'index.html', 'mira-studio': 'index.html', 'mira-studio-full': 'index-16x9.html', 'mira-vertical': 'index-9x16.html' };
if (!outputs[format]) throw new Error(`MIRA_ULTRAFAST_FORMAT_INVALIDO: ${format}`);
const cpuCount = cpus().length;
const slots = Math.max(1, Math.min(16, cpuCount - 2));
const fastDir = join(deckDir, 'mira', 'fast');
const requiredPhaseZeroDirs = [
  deckDir,
  join(deckDir, 'references'),
  join(deckDir, 'assets'),
  join(deckDir, 'assets', 'vendor'),
  join(deckDir, 'mira'),
  fastDir,
];
const missingPhaseZeroDirs = requiredPhaseZeroDirs.filter((path) => !existsSync(path));
if (missingPhaseZeroDirs.length) {
  throw new Error(`MIRA_ULTRAFAST_FASE_ZERO_INCOMPLETA: ${missingPhaseZeroDirs.join(', ')}`);
}

const timings = { versao: 1, cpus: cpuCount, vagas_efetivas: slots, etapas: [] };
function now() { return new Date(); }
function mark(etapa, inicio, extra = {}) {
  const fim = now();
  timings.etapas.push({ etapa, inicio: inicio.toISOString(), fim: fim.toISOString(), duracao_ms: fim - inicio, ...extra });
  writeFileSync(join(fastDir, 'timings.json'), `${JSON.stringify(timings, null, 2)}\n`);
}
function writePlan(plan) {
  const temp = join(fastDir, 'plano.json.tmp');
  writeFileSync(temp, `${JSON.stringify(plan, null, 2)}\n`);
  renameSync(temp, join(fastDir, 'plano.json'));
}
async function command(script, commandArgs = []) {
  return run(process.execPath, [script, ...commandArgs], { cwd: process.cwd() });
}

const skeletonStart = now();
await command('.claude/skills/mira-ultrafast/scripts/build-skeleton.mjs', [format, deckDir]);
mark('fase_0_esqueleto', skeletonStart);

const memoryStart = now();
const memoryPromise = (async () => {
  try { await command('bin/mira.js', ['memoria', 'consolidar']); } catch { /* memória nunca bloqueia */ }
  const result = {};
  await Promise.all(['capa', 'conteudo'].map(async (papel) => {
    try {
      const { stdout } = await command('bin/mira.js', ['memoria', 'lembrancas', '--papel', papel, '--formato', format]);
      result[papel] = stdout.trim();
    } catch { result[papel] = ''; }
  }));
  mark('memoria', memoryStart);
  return result;
})();

const globalStart = now();
const plan = await agent(`
Planeje somente os globais e stubs do Mira Ultrafast. Invocação: ${JSON.stringify(invocation)}
Leia as fontes existentes em ${deckDir}/references, sem escrever nelas. Leia
.claude/skills/mira-fast/references/plano-schema.md e
.claude/skills/mira-fast/references/quadro-metaforas.md.
Retorne plano v2 completo na raiz, mas em cada slide animado decida agora conceito,
frase_causal e uma família exclusiva; deixe metáfora e os seis eixos para o detalhe.
Decida arco, N, ordem, títulos, paleta mira-dark, tom, slug_stage e js_id. Slides
estáticos já ficam completos. Não escreva arquivos e não gere HTML.
`, {
  label: 'mira-ultrafast: globais', phase: 'globais',
  schema: {
    type: 'object', required: ['versao', 'slug', 'deck_dir', 'formato', 'arquivo_saida', 'titulo_deck', 'paleta', 'tom', 'total_slides', 'slides'],
    properties: { versao: { type: 'number' }, slug: { type: 'string' }, deck_dir: { type: 'string' }, formato: { enum: ['mira', 'mira-studio', 'mira-studio-full', 'mira-vertical'] }, arquivo_saida: { type: 'string' }, titulo_deck: { type: 'string' }, subtitulo_deck: { type: 'string' }, paleta: { type: 'object' }, tom: { type: 'string' }, total_slides: { type: 'number' }, slides: { type: 'array', items: { type: 'object', additionalProperties: true } } },
    additionalProperties: true,
  },
});
plan.deck_dir = deckDir;
plan.formato = format;
plan.arquivo_saida = outputs[format];
plan.lembrancas = await memoryPromise;
plan.ledger = [];
writePlan(plan);
mark('globais', globalStart);

const detailSchema = {
  type: 'object', required: ['n', 'metafora', 'verbo_causal', 'silhueta', 'espaco', 'movimento', 'tempo'],
  properties: { n: { type: 'number' }, metafora: { type: 'string' }, verbo_causal: { type: 'string' }, silhueta: { type: 'string' }, espaco: { type: 'string' }, movimento: { type: 'string' }, tempo: { type: 'string' } },
  additionalProperties: false,
};
const leafSchema = { type: 'object', required: ['n', 'ok', 'validation'], properties: { n: { type: 'number' }, ok: { type: 'boolean' }, validation: { type: 'string' } }, additionalProperties: false };
const globals = { deck_dir: deckDir, formato: format, arquivo_saida: outputs[format], titulo_deck: plan.titulo_deck, subtitulo_deck: plan.subtitulo_deck, paleta: plan.paleta, tom: plan.tom, lembrancas: plan.lembrancas };

// Com poucas vagas, um único detalhador atende os slides animados enquanto as
// folhas estáticas já avançam. Com quatro ou mais, o detalhe usa fan-out.
const serialDetailPromise = slots < 4
  ? agent(`
Leia .claude/skills/mira-ultrafast/references/detalhamento.md e detalhe todos
os slides animados desta lista, preservando seus campos fixos:
${JSON.stringify(plan.slides)}
Retorne somente um array de detalhes.
`, {
    label: 'mira-ultrafast: detalhes seriais', phase: 'detalhar',
    schema: { type: 'array', items: detailSchema },
  })
  : null;

async function buildLeaf(slide, attempt) {
  const start = now();
  const mode = slide.modo_folha === 'animada' ? 'animado' : 'estatico';
  const result = await agent(`
Folha ${slide.n}, tentativa ${attempt}/2. Leia somente:
.claude/skills/mira-ultrafast/references/contrato-base.md,
.claude/skills/mira-ultrafast/references/contrato-${mode}.md e
.claude/skills/mira-ultrafast/references/formato-${format}.md.
Globais: ${JSON.stringify(globals)}
Slide: ${JSON.stringify(slide)}
Escreva somente mira/fast/slide-NN.html e result-NN.json em ${deckDir}.
Valide com node .claude/skills/mira-ultrafast/scripts/validate-run.mjs "${deckDir}" --slide ${slide.n}.
Retorne o status; não toque em nenhum outro arquivo.
`, { label: `mira-ultrafast: slide ${slide.n} tentativa ${attempt}`, phase: 'construir', schema: leafSchema });
  mark('folha', start, { n: slide.n, tentativa: attempt });
  return result;
}

async function buildWithRetry(slide) {
  const failures = [];
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try { const result = await buildLeaf(slide, attempt); if (result.ok) return { ...result, attempts: attempt }; failures.push(result.validation); }
    catch (error) { failures.push(String(error)); }
  }
  return { n: slide.n, ok: false, validation: failures.join(' | '), attempts: 2 };
}

const leaves = await pipeline(plan.slides, async (stub, index) => {
  let slide = stub;
  if (stub.modo_folha === 'animada') {
    const start = now();
    const detail = slots >= 4 ? await agent(`
Leia .claude/skills/mira-ultrafast/references/detalhamento.md.
Complete somente este slide: ${JSON.stringify(stub)}
Títulos vizinhos: ${JSON.stringify([plan.slides[index - 1]?.titulo, plan.slides[index + 1]?.titulo].filter(Boolean))}
`, { label: `mira-ultrafast: detalhe ${stub.n}`, phase: 'detalhar', schema: detailSchema })
      : (await serialDetailPromise).find((item) => item.n === stub.n);
    if (!detail) throw new Error(`detalhe ausente para slide ${stub.n}`);
    slide = { ...stub, ...detail };
    plan.slides[index] = slide;
    plan.ledger.push({ n: slide.n, assinatura: `${slide.familia} | ${slide.verbo_causal} | ${slide.silhueta} | ${slide.espaco} | ${slide.movimento} | ${slide.tempo}` });
    writePlan(plan);
    mark('detalhe', start, { n: slide.n });
  }
  return buildWithRetry(slide);
});

plan.slides.sort((a, b) => a.n - b.n);
plan.ledger.sort((a, b) => a.n - b.n);
writePlan(plan);
await command('.claude/skills/mira-ultrafast/scripts/render-board.mjs', [deckDir]);
const failed = leaves.filter((leaf) => !leaf.ok);
return { deck_dir: deckDir, arquivo_saida: outputs[format], folhas: leaves.length, total_slides: plan.slides.length, falhas: failed, pronto_para_montar: failed.length === 0, comando_montagem: `node .claude/skills/mira-ultrafast/scripts/assemble-run.mjs "${deckDir}"` };
