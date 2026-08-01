/**
 * Cápsula de reprodução de BUG-20260731-K4NR e BUG-20260731-BNO4.
 *
 * Hermética: monta um deck mínimo num diretório temporário, sem depender de
 * nenhum template do repositório. Roda os dois casos N vezes e imprime a taxa.
 *
 *   node _reversa_bugs/mira-fast/bugs/BUG-20260731-K4NR-validador-section-em-comentario/evidence/reproduce.mjs
 *
 * Exit code 0 = os dois defeitos reproduziram em todas as tentativas.
 * Exit code 1 = algum deixou de reproduzir (é o que se espera DEPOIS da correção).
 */
import { mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(import.meta.url), '../../../../../..');
const { assembleRun } = await import(join(ROOT, 'agents/mira-fast/scripts/assemble-run.mjs'));
const { validateSlideFile } = await import(join(ROOT, 'agents/mira-fast/scripts/validate-run.mjs'));

const TENTATIVAS = 3;
const MODULOS = ['mira-edit.js', 'mira-edit-free.js', 'mira-draw.js'];
const limpar = [];

function esqueleto({ comentarioComSection }) {
  const doc = comentarioComSection
    ? '<!-- o overlay é IRMÃO das <section>, nunca filho -->'
    : '<!-- o overlay é irmão das secoes, nunca filho -->';
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Cápsula</title>
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
<!-- @MIRA:FAST:CSS:START -->
<!-- @MIRA:FAST:CSS:END -->
</head>
<body>
${doc}
<!-- @MIRA:FAST:SLIDES:START -->
<!-- @MIRA:FAST:SLIDES:END -->
<!-- @MIRA:FAST:JS:START -->
<!-- @MIRA:FAST:JS:END -->
</body>
</html>
`;
}

function plano(deck) {
  return {
    formato: 'mira-vertical',
    arquivo_saida: 'index-9x16.html',
    deck_dir: deck,
    titulo_deck: 'Cápsula',
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

function fragmentoAnimado({ comentarioComSection }) {
  const doc = comentarioComSection
    ? '  // o palco vive dentro da <section> deste slide'
    : '  // o palco vive dentro da secao deste slide';
  return `<!-- @MIRA:FAST slide=02 stage=fluxo kind=animated -->
<section class="slide"><h2>Fluxo</h2><!-- @MIRA:SIZE 3/10 --><div class="anim-stage" id="fluxo-stage"><svg id="fluxo-svg" viewBox="0 0 960 1522.5"></svg></div></section>
<!-- @MIRA:FAST css -->
<style>#fluxo-stage { height: auto; aspect-ratio: 128 / 203; }</style>
<!-- @MIRA:FAST js -->
<script>
function animateFluxo() {
${doc}
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

function montarDeck({ sectionNoEsqueleto, sectionNaFolha }) {
  const root = mkdtempSync(join(tmpdir(), 'k4nr-'));
  limpar.push(root);
  const deck = join(root, 'decks', 'capsula');
  const fast = join(deck, 'mira', 'fast');
  const authoring = join(root, 'mira-templates', 'authoring');
  mkdirSync(fast, { recursive: true });
  mkdirSync(join(deck, 'references'), { recursive: true });
  mkdirSync(authoring, { recursive: true });
  for (const m of MODULOS) writeFileSync(join(authoring, m), `// ${m}\n`);
  writeFileSync(join(deck, 'references', 'quadro-metaforas.md'), '# Quadro\n');
  writeFileSync(join(fast, 'plano.json'), JSON.stringify(plano(deck), null, 2));
  writeFileSync(join(fast, 'esqueleto.html'), esqueleto({ comentarioComSection: sectionNoEsqueleto }));
  writeFileSync(join(fast, 'slide-01.html'),
    '<!-- @MIRA:FAST slide=01 stage=abertura kind=static -->\n'
    + '<section class="slide"><h1>Abertura</h1><p>Subtitulo.</p></section>\n'
    + '<!-- @MIRA:FAST css -->\n<style></style>\n<!-- @MIRA:FAST js -->\n<script></script>');
  writeFileSync(join(fast, 'slide-02.html'), fragmentoAnimado({ comentarioComSection: sectionNaFolha }));
  return { root, deck };
}

function tentar(cfg) {
  const { root, deck } = montarDeck(cfg);
  const validacao = validateSlideFile(deck, 2);
  try {
    assembleRun(deck, { projectRoot: root });
    return { montou: true, erro: null, validacaoOk: validacao.ok, validacaoErros: validacao.errors };
  } catch (error) {
    return { montou: false, erro: error.message, validacaoOk: validacao.ok, validacaoErros: validacao.errors };
  }
}

const casos = [
  {
    bug: 'BUG-20260731-K4NR',
    nome: 'comentário do esqueleto citando <section>, fora do slot de slides',
    cfg: { sectionNoEsqueleto: true, sectionNaFolha: false },
    defeito: (r) => !r.montou && /<section> fora do slot de slides/.test(r.erro ?? ''),
  },
  {
    bug: 'BUG-20260731-BNO4',
    nome: 'comentário no JS da folha citando <section>, com a folha aprovada pelo validador',
    cfg: { sectionNoEsqueleto: false, sectionNaFolha: true },
    defeito: (r) => r.validacaoOk && !r.montou && /section\(s\), esperado/.test(r.erro ?? ''),
  },
  {
    bug: 'controle',
    nome: 'sem nenhuma menção a <section> em comentário: tem que montar',
    cfg: { sectionNoEsqueleto: false, sectionNaFolha: false },
    defeito: (r) => r.montou,
  },
];

let tudoReproduziu = true;
for (const caso of casos) {
  let falhas = 0;
  let ultimo = null;
  for (let i = 0; i < TENTATIVAS; i++) {
    ultimo = tentar(caso.cfg);
    if (caso.defeito(ultimo)) falhas += 1;
  }
  const ok = falhas === TENTATIVAS;
  if (!ok) tudoReproduziu = false;
  console.log(`\n[${caso.bug}] ${caso.nome}`);
  console.log(`  taxa: ${falhas}/${TENTATIVAS}`);
  console.log(`  validate-run --slide 2 aprovou a folha? ${ultimo.validacaoOk} ${JSON.stringify(ultimo.validacaoErros)}`);
  console.log(`  montagem: ${ultimo.montou ? 'PASS' : 'FAIL'}${ultimo.erro ? ' :: ' + ultimo.erro : ''}`);
}

for (const dir of limpar) rmSync(dir, { recursive: true, force: true });
console.log(`\nresultado: ${tudoReproduziu ? 'os dois defeitos REPRODUZIRAM' : 'algum defeito NAO reproduziu'}`);
process.exit(tudoReproduziu ? 0 : 1);
