import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assembleRun } from '../agents/mira-fast/scripts/assemble-run.mjs';
import { buildSkeleton } from '../agents/mira-ultrafast/scripts/build-skeleton.mjs';

/**
 * Builder do roteiro.md dos formatos Studio, em navegador de verdade.
 *
 *   BUG-20260731-JZNJ  mira-studio: o builder descartava o palco gerado e a
 *                      animação nunca tocava sob HTTP
 *   BUG-20260731-S3TX  mira-studio-full: o builder apagava TODOS os slides e os
 *                      substituía pelo deck de demonstração embutido
 *   BUG-20260731-VPVV  a capa gerada virava um slide de câmera vazio
 *   BUG-20260731-UDTY  o slide full nascia sem .full-wrap
 *   BUG-20260731-RNYU  o teleprompter em file:// mostrava as falas do template
 *
 * Estes defeitos são de runtime: só aparecem depois que o IIFE do template roda
 * sobre o DOM. Reproduzi-los sem navegador seria reimplementar o navegador, então
 * o teste roda o deck de verdade no Chromium do puppeteer, servido por HTTP e
 * aberto por file://, que são os dois protocolos onde o comportamento diverge.
 *
 * Se o Chromium não puder subir (ambiente sem download do puppeteer), os casos
 * são pulados com a razão à vista, nunca dados como verdes.
 */

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const limpar = [];

let browser = null;
let motivoSemBrowser = null;

async function abrirBrowser() {
  if (browser || motivoSemBrowser) return browser;
  try {
    const puppeteer = await import('puppeteer');
    browser = await puppeteer.default.launch({
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--allow-file-access-from-files'],
    });
  } catch (error) {
    motivoSemBrowser = error.message;
  }
  return browser;
}

test.after(async () => {
  if (browser) await browser.close();
  for (const dir of limpar) rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
});

// ------------------------------------------------------------------ servidor

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.cjs': 'text/javascript; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
};

/** Servidor estático mínimo, com o /__mira_save que o builder usa ao semear. */
function servir(dir) {
  const salvos = [];
  const server = createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/__mira_save') {
      let corpo = '';
      req.on('data', (parte) => { corpo += parte; });
      req.on('end', () => {
        try { salvos.push(JSON.parse(corpo)); } catch { /* corpo inválido não interessa ao teste */ }
        res.writeHead(200).end('{}');
      });
      return;
    }
    const relativo = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^([/\\])+/, '');
    const caminho = join(dir, relativo || 'index.html');
    if (!resolve(caminho).startsWith(resolve(dir)) || !existsSync(caminho) || statSync(caminho).isDirectory()) {
      res.writeHead(404).end('nao encontrado');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[extname(caminho)] ?? 'application/octet-stream' });
    createReadStream(caminho).pipe(res);
  });
  return new Promise((ok) => {
    server.listen(0, '127.0.0.1', () => ok({
      url: `http://127.0.0.1:${server.address().port}`,
      salvos,
      fechar: () => new Promise((pronto) => server.close(pronto)),
    }));
  });
}

/** Carrega a URL e devolve o retrato do DOM depois que o builder rodou. */
async function retratar(url) {
  const page = await browser.newPage();
  const erros = [];
  page.on('pageerror', (erro) => erros.push(erro.message));
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok))));
  const retrato = await page.evaluate(() => {
    const secoes = Array.from(document.querySelectorAll('body > section'));
    return {
      total: secoes.length,
      secoes: secoes.map((sec) => ({
        layout: sec.getAttribute('data-layout'),
        classe: sec.className,
        titulo: (sec.querySelector('h1, h2')?.textContent ?? '').replace(/\s+/g, ' ').trim(),
        palcos: Array.from(sec.querySelectorAll('.anim-stage')).map((palco) => ({
          id: palco.id,
          svg: palco.querySelector('svg')?.id ?? null,
        })),
        temCam: !!sec.querySelector('.cam-area'),
        temFullWrap: !!sec.querySelector('.full-wrap'),
        html: sec.innerHTML.length,
      })),
      teleprompter: (document.getElementById('tp-ov-body')?.textContent
        ?? document.getElementById('mp-body')?.textContent ?? '').replace(/\s+/g, ' ').trim(),
    };
  });
  await page.close();
  return { ...retrato, erros };
}

// ------------------------------------------------------------------ fixtures

const FALAS = [
  'Fala propria do slide um, escrita pelo plano.',
  'Fala propria do slide dois, escrita pelo plano.',
  'Fala propria do slide tres, escrita pelo plano.',
];

const CAMPOS_ANIMADO = {
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

function planoStudio() {
  return {
    versao: 2,
    slug: 'teste-studio',
    formato: 'mira-studio',
    arquivo_saida: 'index.html',
    deck_dir: 'decks/teste-studio',
    titulo_deck: 'Deck gerado de teste',
    paleta: { primaria: '#FF904D', fundo: '#000000', modo: 'cor-unica' },
    tom: 'didático e direto',
    total_slides: 3,
    slides: [
      { n: 1, slug_stage: 'capa', tipo: 'capa', modo_folha: 'estatica', layout: 'capa', titulo: 'Corte de 80 por cento', fala: FALAS[0] },
      { n: 2, slug_stage: 'corrida', js_id: 'corrida', tipo: 'animado', modo_folha: 'animada', layout: 'split', titulo: 'Dois fluxos', fala: FALAS[1], ...CAMPOS_ANIMADO },
      { n: 3, slug_stage: 'panela', js_id: 'panela', tipo: 'animado', modo_folha: 'animada', layout: 'full', titulo: 'Uma panela', fala: FALAS[2], ...CAMPOS_ANIMADO },
    ],
    ledger: [
      { n: 2, assinatura: 'cozinha | sobrepor | panela | colunas | alternância | rajada' },
      { n: 3, assinatura: 'cozinha | sobrepor | panela | colunas | alternância | rajada' },
    ],
  };
}

function planoStudioFull() {
  return {
    versao: 2,
    slug: 'teste-studio-full',
    formato: 'mira-studio-full',
    arquivo_saida: 'index-16x9.html',
    deck_dir: 'decks/teste-studio-full',
    titulo_deck: 'Deck gerado de teste 16x9',
    paleta: { primaria: '#FF904D', fundo: '#000000', modo: 'cor-unica' },
    tom: 'didático e direto',
    total_slides: 3,
    slides: [
      { n: 1, slug_stage: 'abertura', tipo: 'card', modo_folha: 'estatica', layout: 'camera', fala: FALAS[0] },
      { n: 2, slug_stage: 'corrida', js_id: 'corrida', tipo: 'animado', modo_folha: 'animada', layout: 'thirds', titulo: 'Dois fluxos', fala: FALAS[1], ...CAMPOS_ANIMADO },
      { n: 3, slug_stage: 'panela', js_id: 'panela', tipo: 'animado', modo_folha: 'animada', layout: 'full', titulo: 'Uma panela', fala: FALAS[2], ...CAMPOS_ANIMADO },
    ],
    ledger: [
      { n: 2, assinatura: 'cozinha | sobrepor | panela | colunas | alternância | rajada' },
      { n: 3, assinatura: 'cozinha | sobrepor | panela | colunas | alternância | rajada' },
    ],
  };
}

function animacaoDe(slug, jsId) {
  const pascal = jsId[0].toUpperCase() + jsId.slice(1);
  return `<script>
function animate${pascal}() {
  clearTimeout(window.__${jsId}Timer);
  window.__${jsId}Gen = (window.__${jsId}Gen || 0) + 1;
  var svg = d3.select('#${slug}-svg');
  if (svg.empty()) return;
  var stage = svg.node().closest('.anim-stage');
  if (!stage) return;
  var r = stage.getBoundingClientRect();
  svg.attr('viewBox', '0 0 960 ' + Math.max(1, Math.round(960 * r.height / Math.max(1, r.width))));
  var cor = getComputedStyle(document.documentElement).getPropertyValue('--mira-primary').trim();
  svg.selectAll('*').remove();
  svg.append('circle').attr('cx', 480).attr('cy', 240).attr('r', 60).attr('fill', cor || 'currentColor');
  window.__tocou = window.__tocou || {};
  window.__tocou['${slug}'] = true;
}
</script>`;
}

function palco(slug) {
  return `<div class="anim-stage" id="${slug}-stage"><svg id="${slug}-svg" preserveAspectRatio="xMidYMid meet"></svg></div>`;
}

function fragmentoStudio(slide) {
  const cabecalho = `<!-- @MIRA:FAST slide=${String(slide.n).padStart(2, '0')} stage=${slide.slug_stage} kind=${slide.modo_folha === 'animada' ? 'animated' : 'static'} -->`;
  let html;
  if (slide.layout === 'capa') {
    html = `<section class="capa"><h1>${slide.titulo}</h1><p>Subtitulo curto do deck.</p></section>`;
  } else if (slide.layout === 'camera') {
    html = '<section data-layout="camera"><div class="cam-area"></div></section>';
  } else if (slide.layout === 'split') {
    html = `<section data-layout="split"><div class="split-top"><h2>${slide.titulo}</h2><!-- @MIRA:SIZE 3/10 -->${palco(slide.slug_stage)}</div><div class="cam-area"></div></section>`;
  } else if (slide.layout === 'thirds') {
    html = `<section data-layout="thirds"><div class="thirds-main"><h2>${slide.titulo}</h2><!-- @MIRA:SIZE 3/10 -->${palco(slide.slug_stage)}</div><div class="cam-area"></div></section>`;
  } else {
    const miolo = `<h2>${slide.titulo}</h2><!-- @MIRA:SIZE 3/10 -->${palco(slide.slug_stage)}`;
    const wrapper = slide.formatoPai === 'mira-studio-full' ? 'full-main' : 'full-wrap';
    html = `<section data-layout="full"><div class="${wrapper}">${miolo}</div></section>`;
  }
  const js = slide.modo_folha === 'animada' ? animacaoDe(slide.slug_stage, slide.js_id) : '<script></script>';
  return `${cabecalho}\n${html}\n<!-- @MIRA:FAST css -->\n<style></style>\n<!-- @MIRA:FAST js -->\n${js}`;
}

/** Monta um deck de verdade: esqueleto do template real + Fase 3 real. */
function deckGerado(plano) {
  const root = mkdtempSync(join(tmpdir(), 'mira-builders-'));
  limpar.push(root);
  const deck = join(root, 'deck');
  const fast = join(deck, 'mira', 'fast');
  mkdirSync(fast, { recursive: true });
  mkdirSync(join(deck, 'references'), { recursive: true });
  writeFileSync(join(deck, 'references', 'quadro-metaforas.md'), '# Quadro\n');
  buildSkeleton(plano.formato, deck, { projectRoot: ROOT });
  writeFileSync(join(fast, 'plano.json'), JSON.stringify(plano, null, 2));
  for (const slide of plano.slides) {
    writeFileSync(
      join(fast, `slide-${String(slide.n).padStart(2, '0')}.html`),
      fragmentoStudio({ ...slide, formatoPai: plano.formato }),
    );
  }
  assembleRun(deck, { projectRoot: ROOT });
  return deck;
}

/** Cópia fiel do deck de demonstração do template, com o roteiro.md ao lado. */
function deckDemonstracao(pasta, arquivo) {
  const root = mkdtempSync(join(tmpdir(), 'mira-demo-'));
  limpar.push(root);
  const deck = join(root, 'deck');
  mkdirSync(join(deck, 'assets', 'vendor'), { recursive: true });
  mkdirSync(join(deck, 'mira'), { recursive: true });
  const origem = join(ROOT, 'templates', 'decks', pasta);
  writeFileSync(join(deck, arquivo), readFileSync(join(origem, arquivo)));
  writeFileSync(join(deck, 'roteiro.md'), readFileSync(join(origem, 'roteiro.md')));
  for (const vendor of ['d3.v7.min.js', 'mp4-muxer.js']) {
    const de = join(ROOT, 'templates', 'vendor', vendor);
    if (existsSync(de)) writeFileSync(join(deck, 'assets', 'vendor', vendor), readFileSync(de));
  }
  for (const modulo of ['mira-edit.js', 'mira-edit-free.js', 'mira-draw.js', 'mira-camera.js', 'mira-record.js', 'mira-record-16x9.js']) {
    const de = join(ROOT, 'templates', 'authoring', modulo);
    if (existsSync(de)) writeFileSync(join(deck, 'mira', modulo), readFileSync(de));
  }
  return deck;
}

/** Roda o corpo com o browser pronto, ou pula o caso dizendo por quê. */
function casoDeNavegador(nome, corpo) {
  test(nome, async (t) => {
    if (!(await abrirBrowser())) {
      t.skip(`Chromium do puppeteer indisponível: ${motivoSemBrowser}`);
      return;
    }
    await corpo();
  });
}

// -------------------------------------------------- mira-studio (BUG JZNJ)

casoDeNavegador('BUG-20260731-JZNJ · deck gerado sob HTTP mantém os palcos com id de slug', async () => {
  const deck = deckGerado(planoStudio());
  const servidor = await servir(deck);
  try {
    const retrato = await retratar(`${servidor.url}/index.html`);
    assert.equal(retrato.total, 3, 'o builder mudou a quantidade de slides');

    const ids = retrato.secoes.flatMap((sec) => sec.palcos.map((p) => `${p.id}/${p.svg}`));
    assert.deepEqual(ids, ['corrida-stage/corrida-svg', 'panela-stage/panela-svg']);
    assert.ok(!ids.some((id) => id.includes('sv-slide')), 'palco genérico substituiu o palco gerado');
  } finally {
    await servidor.fechar();
  }
});

casoDeNavegador('BUG-20260731-JZNJ · a animação gerada toca em todos os slides sob HTTP', async () => {
  const deck = deckGerado(planoStudio());
  const servidor = await servir(deck);
  const page = await browser.newPage();
  try {
    await page.goto(`${servidor.url}/index.html`, { waitUntil: 'load' });
    // O observer só dispara quando o palco entra em tela: percorre o deck.
    // 'instant': o scroll-behavior smooth do template deixaria o observer
    // medindo o meio da rolagem em vez do slide já enquadrado.
    await page.evaluate(async () => {
      for (const sec of document.querySelectorAll('body > section')) {
        sec.scrollIntoView({ behavior: 'instant', block: 'center' });
        await new Promise((ok) => setTimeout(ok, 200));
      }
    });
    const tocou = await page.evaluate(() => window.__tocou ?? {});
    assert.deepEqual(tocou, { corrida: true, panela: true }, 'alguma animação gerada não tocou');
  } finally {
    await page.close();
    await servidor.fechar();
  }
});

casoDeNavegador('BUG-20260731-VPVV · a capa gerada continua capa sob HTTP', async () => {
  const deck = deckGerado(planoStudio());
  const servidor = await servir(deck);
  try {
    const capa = (await retratar(`${servidor.url}/index.html`)).secoes[0];
    assert.match(capa.classe, /\bcapa\b/, 'a capa perdeu a classe');
    assert.equal(capa.layout, null, 'a capa virou um slide com data-layout');
    assert.equal(capa.temCam, false, 'a capa virou área de câmera vazia');
    assert.match(capa.titulo, /Corte de 80 por cento/);
  } finally {
    await servidor.fechar();
  }
});

casoDeNavegador('BUG-20260731-UDTY · o slide full gerado tem .full-wrap nos dois protocolos', async () => {
  const deck = deckGerado(planoStudio());
  const servidor = await servir(deck);
  try {
    const http = await retratar(`${servidor.url}/index.html`);
    const file = await retratar(`file://${join(deck, 'index.html')}`);
    assert.equal(http.secoes[2].temFullWrap, true, 'full sem .full-wrap sob HTTP');
    assert.equal(file.secoes[2].temFullWrap, true, 'full sem .full-wrap em file://');
  } finally {
    await servidor.fechar();
  }
});

casoDeNavegador('BUG-20260731-JZNJ · o roteiro.md continua mandando no título', async () => {
  const deck = deckGerado(planoStudio());
  const roteiro = join(deck, 'roteiro.md');
  writeFileSync(roteiro, readFileSync(roteiro, 'utf8').replace('Dois fluxos', 'Titulo vindo do *roteiro*'), 'utf8');
  const servidor = await servir(deck);
  try {
    const retrato = await retratar(`${servidor.url}/index.html`);
    assert.match(retrato.secoes[1].titulo, /Titulo vindo do roteiro/, 'o título do roteiro.md não chegou ao slide');
    assert.deepEqual(retrato.secoes[1].palcos, [{ id: 'corrida-stage', svg: 'corrida-svg' }], 'o título trocado derrubou o palco');
  } finally {
    await servidor.fechar();
  }
});

casoDeNavegador('BUG-20260731-JZNJ · o deck de demonstração escrito à mão continua funcionando', async () => {
  const deck = deckDemonstracao('mira-studio-demo', 'index.html');
  const servidor = await servir(deck);
  try {
    const retrato = await retratar(`${servidor.url}/index.html`);
    assert.equal(retrato.total, 4, 'o deck de demonstração perdeu slides');
    const svgs = retrato.secoes.flatMap((sec) => sec.palcos.map((p) => p.svg));
    assert.deepEqual(svgs, ['sv-slide-3', 'sv-slide-4'], 'os palcos autorais sv-slide-N sumiram');
    assert.match(retrato.secoes[0].classe, /\bcapa\b/);
  } finally {
    await servidor.fechar();
  }
});

// --------------------------------------------- mira-studio-full (BUG S3TX)

casoDeNavegador('BUG-20260731-S3TX · deck gerado em file:// mantém os slides gerados', async () => {
  const deck = deckGerado(planoStudioFull());
  const retrato = await retratar(`file://${join(deck, 'index-16x9.html')}`);
  assert.equal(retrato.total, 3, 'o array DEFAULT do template substituiu os slides gerados');
  assert.deepEqual(
    retrato.secoes.flatMap((sec) => sec.palcos.map((p) => `${p.id}/${p.svg}`)),
    ['corrida-stage/corrida-svg', 'panela-stage/panela-svg'],
  );
  assert.ok(!retrato.secoes.some((sec) => /Linha de Produção|Órbita da Produção/.test(sec.titulo)),
    'títulos do deck de demonstração vazaram');
});

casoDeNavegador('BUG-20260731-S3TX · deck gerado sob HTTP mantém os slides e os palcos gerados', async () => {
  const deck = deckGerado(planoStudioFull());
  const servidor = await servir(deck);
  try {
    const retrato = await retratar(`${servidor.url}/index-16x9.html`);
    assert.equal(retrato.total, 3);
    assert.deepEqual(
      retrato.secoes.flatMap((sec) => sec.palcos.map((p) => `${p.id}/${p.svg}`)),
      ['corrida-stage/corrida-svg', 'panela-stage/panela-svg'],
    );
    assert.match(retrato.secoes[1].titulo, /Dois fluxos/);
  } finally {
    await servidor.fechar();
  }
});

casoDeNavegador('BUG-20260731-S3TX · a animação gerada toca no 16x9 sob HTTP', async () => {
  const deck = deckGerado(planoStudioFull());
  const servidor = await servir(deck);
  const page = await browser.newPage();
  try {
    await page.goto(`${servidor.url}/index-16x9.html`, { waitUntil: 'load' });
    // 'instant': o scroll-behavior smooth do template deixaria o observer
    // medindo o meio da rolagem em vez do slide já enquadrado.
    await page.evaluate(async () => {
      for (const sec of document.querySelectorAll('body > section')) {
        sec.scrollIntoView({ behavior: 'instant', block: 'center' });
        await new Promise((ok) => setTimeout(ok, 200));
      }
    });
    assert.deepEqual(await page.evaluate(() => window.__tocou ?? {}), { corrida: true, panela: true });
  } finally {
    await page.close();
    await servidor.fechar();
  }
});

casoDeNavegador('BUG-20260731-S3TX · o deck de demonstração 16x9 continua funcionando sob HTTP', async () => {
  const deck = deckDemonstracao('mira-studio-full-demo', 'index-16x9.html');
  const servidor = await servir(deck);
  try {
    const retrato = await retratar(`${servidor.url}/index-16x9.html`);
    assert.equal(retrato.total, 5, 'o deck de demonstração 16x9 perdeu slides');
    assert.match(retrato.secoes[1].titulo, /Linha de Produção/);
    assert.match(retrato.secoes[3].titulo, /Produção ao Vivo/);
    const svgs = retrato.secoes.flatMap((sec) => sec.palcos.map((p) => p.svg));
    assert.deepEqual(svgs, ['sv-slide-2', 'sv-slide-3', 'sv-slide-4'],
      'os palcos declarativos do deck de demonstração sumiram');
  } finally {
    await servidor.fechar();
  }
});

casoDeNavegador('BUG-20260731-S3TX · o deck de demonstração 16x9 continua funcionando em file://', async () => {
  const deck = deckDemonstracao('mira-studio-full-demo', 'index-16x9.html');
  const retrato = await retratar(`file://${join(deck, 'index-16x9.html')}`);
  assert.equal(retrato.total, 5);
  assert.deepEqual(
    retrato.secoes.flatMap((sec) => sec.palcos.map((p) => p.svg)),
    ['sv-slide-2', 'sv-slide-3', 'sv-slide-4'],
  );
});

// ------------------------------------------------------------- BUG RNYU

casoDeNavegador('BUG-20260731-RNYU · o teleprompter em file:// mostra a fala do plano', async () => {
  const deck = deckGerado(planoStudio());
  const html = readFileSync(join(deck, 'index.html'), 'utf8');
  assert.ok(!html.includes('Um roteiro, três formatos. Este é o deck vertical'),
    'a fala de demonstração do template ficou no deck gerado');

  const page = await browser.newPage();
  try {
    const url = `file://${join(deck, 'index.html')}`;
    // O critério do bug é "com localStorage limpo": em file:// a chave
    // `mira-tp-text` é a mesma para toda a origem, então o texto de um deck
    // aberto antes venceria o fallback e mascararia o que está sendo medido.
    await page.goto(url, { waitUntil: 'load' });
    await page.evaluate(() => localStorage.clear());
    await page.goto(url, { waitUntil: 'load' });
    const texto = await page.evaluate(() => (document.getElementById('mp-body')?.textContent ?? '').trim());
    assert.match(texto, /Fala propria do slide um/, `teleprompter mostrou: ${texto}`);
  } finally {
    await page.close();
  }
});

// ------------------------------------------------------------- BUG F74X
//
// BUG-20260801-F74X  reordenar slides no mira-studio 9:16 não movia o bloco
//                    correspondente do roteiro.md.
//
// A correção é "acompanhar", não "delegar": o mira-edit reordena as <section>
// como sempre E o deck grava o roteiro.md na MESMA permutação. Delegar só a
// ordem ao roteiro (o que o 16:9 faz) deixa o palco <slug>-stage parado embaixo
// do texto do vizinho, e quando os layouts diferem o builder recria a seção e
// destrói o palco gerado. Estes casos existem para travar as duas coisas.
//
// Eles dirigem o modo E de verdade (tecla `e`, seta ↑, botão Salvar): o defeito
// está no caminho de gravação, e olhar só o retrato do builder não distingue
// "reordenou certo" de "não reordenou nada".

/**
 * Servidor que GRAVA de verdade, com o compare-and-set por baseSha do
 * mira-studio-server.cjs. O `servir()` de cima só coleta os POST, o que basta
 * para o semear; aqui os arquivos precisam mudar no disco entre um load e outro.
 */
function servirGravando(dir) {
  const salvos = [];
  const server = createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/__mira_save') {
      let corpo = '';
      req.on('data', (parte) => { corpo += parte; });
      req.on('end', () => {
        let body;
        try { body = JSON.parse(corpo); } catch { res.writeHead(400).end('json inválido'); return; }
        const alvo = join(dir, normalize(decodeURIComponent(body.path)).replace(/^([/\\])+/, ''));
        if (!resolve(alvo).startsWith(resolve(dir))) { res.writeHead(403).end('fora da pasta'); return; }
        if (typeof body.baseSha === 'string' && body.baseSha) {
          const atual = existsSync(alvo)
            ? createHash('sha256').update(readFileSync(alvo)).digest('hex') : '';
          if (atual !== body.baseSha) { res.writeHead(409).end('conflito'); return; }
        }
        writeFileSync(alvo, body.content);
        salvos.push({ path: body.path, baseSha: typeof body.baseSha === 'string' && !!body.baseSha });
        res.writeHead(200).end('{}');
      });
      return;
    }
    const relativo = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^([/\\])+/, '');
    const caminho = join(dir, relativo || 'index.html');
    if (!resolve(caminho).startsWith(resolve(dir)) || !existsSync(caminho) || statSync(caminho).isDirectory()) {
      res.writeHead(404).end('nao encontrado');
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[extname(caminho)] ?? 'application/octet-stream' });
    createReadStream(caminho).pipe(res);
  });
  return new Promise((ok) => {
    server.listen(0, '127.0.0.1', () => ok({
      url: `http://127.0.0.1:${server.address().port}`,
      salvos,
      fechar: () => new Promise((pronto) => server.close(pronto)),
    }));
  });
}

/** Entra no modo E, sobe o slide da posição `pos` (1-based) e salva. */
async function reordenarESalvar(page, pos) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.keyboard.press('e');
  await page.evaluate(() => new Promise((ok) => setTimeout(ok, 200)));
  assert.ok(await page.evaluate(() => document.body.classList.contains('me-on')),
    'a tecla E não abriu o modo de edição');
  await page.evaluate((k) => {
    const alvo = document.querySelectorAll('body > section')[k - 1];
    const seta = alvo && alvo.querySelector('.me-arr-up');
    if (!seta) throw new Error('seta de subir não encontrada no slide ' + k);
    seta.click();
  }, pos);
  await page.evaluate(() => new Promise((ok) => setTimeout(ok, 200)));
  await page.evaluate(() => document.getElementById('me-save').click());
  // o Salvar grava dois arquivos em sequência; 1,4 s cobre a ida e volta dos dois
  await new Promise((ok) => setTimeout(ok, 1400));
  return page.evaluate(() => document.getElementById('me-toast')?.textContent ?? '');
}

/** Título, palco e fala de cada slide, percorrendo o deck como o usuário faria. */
async function porSlide(page) {
  const total = await page.evaluate(() => document.querySelectorAll('body > section').length);
  const linhas = [];
  for (let i = 0; i < total; i++) {
    linhas.push(await page.evaluate(async (k) => {
      const secs = Array.from(document.querySelectorAll('body > section'));
      secs[k].scrollIntoView({ behavior: 'instant', block: 'center' });
      await new Promise((ok) => setTimeout(ok, 220));
      const svg = secs[k].querySelector('.anim-stage svg');
      return {
        palco: svg ? svg.id : null,
        titulo: (secs[k].querySelector('h1, h2')?.textContent ?? '').replace(/\s+/g, ' ').trim(),
        fala: (document.getElementById('tp-ov-body')?.textContent ?? '').replace(/\s+/g, ' ').trim(),
      };
    }, i));
  }
  return linhas;
}

/** Abre o deck com o localStorage limpo: as chaves do teleprompter são por origem. */
async function abrirLimpo(page, url) {
  // Salvar que falha deixa `dirty` ligado, e o beforeunload do mira-edit passa a
  // pedir confirmação para sair. Sem aceitar o diálogo, o goto trava até o
  // timeout e uma asserção falha vira "Navigation timeout", escondendo a causa.
  if (!page.__miraDialogo) {
    page.__miraDialogo = true;
    page.on('dialog', (d) => d.accept().catch(() => {}));
  }
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => localStorage.clear());
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok))));
}

/** Cabeçalhos `## …` do roteiro.md, na ordem em que estão no arquivo. */
const cabecalhos = (md) => (md.match(/^##[^\n]*$/gm) ?? []).map((l) => l.trim());

casoDeNavegador('BUG-20260801-F74X · reordenar no 9:16 grava o roteiro.md junto com o index.html', async () => {
  const deck = deckDemonstracao('mira-studio-demo', 'index.html');
  const roteiro = join(deck, 'roteiro.md');
  const mdAntes = readFileSync(roteiro, 'utf8');
  const htmlAntes = readFileSync(join(deck, 'index.html'), 'utf8');
  const servidor = await servirGravando(deck);
  const page = await browser.newPage();
  try {
    await abrirLimpo(page, `${servidor.url}/index.html`);

    assert.ok(
      await page.evaluate(() => !!(window.miraOrderSource && typeof window.miraOrderSource.commit === 'function')),
      'o deck 9:16 não registrou window.miraOrderSource',
    );
    assert.equal(await page.evaluate(() => window.miraOrderSource.mode), 'accompany',
      'a fonte de ordem do 9:16 tem que ACOMPANHAR o HTML, não substituí-lo');

    await reordenarESalvar(page, 3);

    // a fonte externa vai PRIMEIRO: se ela recusar, o HTML não chega a ser tocado
    assert.deepEqual(servidor.salvos.map((s) => s.path), ['/roteiro.md', '/index.html'],
      `gravação fora do esperado: ${JSON.stringify(servidor.salvos)}`);
    assert.equal(servidor.salvos[0].baseSha, true, 'gravou o roteiro.md sem compare-and-set');

    const mdDepois = readFileSync(roteiro, 'utf8');
    assert.notEqual(mdDepois, mdAntes, 'o roteiro.md não mudou no disco');
    assert.notEqual(readFileSync(join(deck, 'index.html'), 'utf8'), htmlAntes,
      'o index.html não mudou no disco');

    const [a, b] = [cabecalhos(mdAntes), cabecalhos(mdDepois)];
    assert.equal(b.length, a.length, 'o roteiro.md ganhou ou perdeu blocos');
    assert.equal(b[1], a[2], 'o bloco do slide movido não subiu no roteiro.md');
    assert.equal(b[2], a[1], 'o bloco deslocado não desceu no roteiro.md');
  } finally {
    await page.close();
    await servidor.fechar();
  }
});

casoDeNavegador('BUG-20260801-F74X · palco, título e fala andam juntos num deck gerado', async () => {
  const deck = deckGerado(planoStudio());
  const servidor = await servirGravando(deck);
  const page = await browser.newPage();
  try {
    await abrirLimpo(page, `${servidor.url}/index.html`);
    const antes = await porSlide(page);
    assert.deepEqual(antes.map((l) => l.palco), [null, 'corrida-svg', 'panela-svg'],
      'o deck gerado não nasceu com os palcos de slug');

    await reordenarESalvar(page, 3);
    await abrirLimpo(page, `${servidor.url}/index.html`);
    const depois = await porSlide(page);

    assert.equal(depois.length, antes.length, 'o deck mudou de tamanho ao reordenar');
    // o slide inteiro subiu: palco, título e fala do MESMO slide na posição 2
    assert.equal(depois[1].palco, antes[2].palco,
      `o palco não acompanhou: esperava ${antes[2].palco}, veio ${depois[1].palco}`);
    assert.equal(depois[1].titulo, antes[2].titulo,
      `o título não acompanhou: esperava "${antes[2].titulo}", veio "${depois[1].titulo}"`);
    assert.equal(depois[1].fala, antes[2].fala,
      `a fala não acompanhou: esperava "${antes[2].fala}", veio "${depois[1].fala}"`);
    // e o deslocado desceu inteiro
    assert.equal(depois[2].palco, antes[1].palco, 'o palco do slide deslocado não desceu');
    assert.equal(depois[2].titulo, antes[1].titulo, 'o título do slide deslocado não desceu');
    assert.equal(depois[2].fala, antes[1].fala, 'a fala do slide deslocado não desceu');
    // nenhum palco de slug virou genérico (é o BUG-JZNJ voltando por outra porta)
    assert.ok(!depois.some((l) => l.palco && /^sv-slide-/.test(l.palco)),
      `um palco de slug virou genérico: ${JSON.stringify(depois.map((l) => l.palco))}`);
  } finally {
    await page.close();
    await servidor.fechar();
  }
});

casoDeNavegador('BUG-20260801-F74X · o mira-slide-id não vaza para o teleprompter', async () => {
  const deck = deckDemonstracao('mira-studio-demo', 'index.html');
  const servidor = await servirGravando(deck);
  const page = await browser.newPage();
  try {
    await abrirLimpo(page, `${servidor.url}/index.html`);
    await reordenarESalvar(page, 3);

    // o carimbo tem que estar NO ARQUIVO (é o que dá identidade ao bloco)...
    assert.match(readFileSync(join(deck, 'roteiro.md'), 'utf8'), /<!--\s*mira-slide-id:/,
      'o roteiro.md não recebeu o id por bloco');

    // ...e não pode aparecer em NENHUMA fala lida em câmera.
    await abrirLimpo(page, `${servidor.url}/index.html`);
    for (const linha of await porSlide(page)) {
      assert.ok(!/mira-slide-id/.test(linha.fala), `o id vazou para a fala: "${linha.fala}"`);
      assert.ok(!/<!--/.test(linha.fala), `comentário HTML vazou para a fala: "${linha.fala}"`);
    }
  } finally {
    await page.close();
    await servidor.fechar();
  }
});

casoDeNavegador('BUG-20260801-F74X · roteiro.md com outra contagem aborta sem gravar nada', async () => {
  const deck = deckDemonstracao('mira-studio-demo', 'index.html');
  const roteiro = join(deck, 'roteiro.md');
  const htmlAntes = readFileSync(join(deck, 'index.html'), 'utf8');
  const servidor = await servirGravando(deck);
  const page = await browser.newPage();
  try {
    await abrirLimpo(page, `${servidor.url}/index.html`);

    // alguém apaga um bloco no editor enquanto o deck está aberto
    const original = readFileSync(roteiro, 'utf8');
    const marcas = [...original.matchAll(/^##[ \t]+/gm)].map((m) => m.index);
    const mutilado = original.slice(0, marcas[marcas.length - 1]);
    writeFileSync(roteiro, mutilado);

    const toast = await reordenarESalvar(page, 3);

    assert.match(toast, /roteiro\.md|Recarregue/i, `sem aviso de divergência; toast: "${toast}"`);
    assert.deepEqual(servidor.salvos, [], 'gravou apesar da divergência de contagem');
    assert.equal(readFileSync(roteiro, 'utf8'), mutilado, 'o roteiro.md foi alterado mesmo assim');
    assert.equal(readFileSync(join(deck, 'index.html'), 'utf8'), htmlAntes,
      'o index.html foi reordenado sozinho: os dois arquivos saíram de sincronia');
  } finally {
    await page.close();
    await servidor.fechar();
  }
});

casoDeNavegador('BUG-20260801-F74X · reordenar durante a gravação é recusado', async () => {
  const deck = deckDemonstracao('mira-studio-demo', 'index.html');
  const servidor = await servirGravando(deck);
  const page = await browser.newPage();
  try {
    await abrirLimpo(page, `${servidor.url}/index.html`);
    await page.evaluate(() => document.documentElement.setAttribute('data-mira-recording', ''));

    const titulos = () => page.evaluate(() => Array.from(document.querySelectorAll('body > section'))
      .map((s) => (s.querySelector('h1, h2')?.textContent ?? '(camera)').replace(/\s+/g, ' ').trim()));
    const ordemAntes = await titulos();
    const toast = await reordenarESalvar(page, 3);

    assert.match(toast, /gravação/i, `sem aviso de gravação em andamento; toast: "${toast}"`);
    assert.deepEqual(await titulos(), ordemAntes, 'a ordem mudou durante a gravação');
    assert.deepEqual(servidor.salvos, [], 'gravou durante a gravação');
  } finally {
    await page.close();
    await servidor.fechar();
  }
});

casoDeNavegador('BUG-20260801-F74X · o 16:9 não muda de comportamento', async () => {
  const deck = deckDemonstracao('mira-studio-full-demo', 'index-16x9.html');
  const htmlAntes = readFileSync(join(deck, 'index-16x9.html'), 'utf8');
  const servidor = await servirGravando(deck);
  const page = await browser.newPage();
  try {
    await page.goto(`${servidor.url}/index-16x9.html`, { waitUntil: 'load' });
    await page.evaluate(() => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok))));
    // o 16:9 continua em 'replace' (delega a ordem e recarrega). O defeito dele
    // com deck gerado é outro bug; aqui só garantimos que este fix não o tocou.
    assert.notEqual(await page.evaluate(() => window.miraOrderSource && window.miraOrderSource.mode), 'accompany');
    await reordenarESalvar(page, 3);
    assert.deepEqual(servidor.salvos.map((s) => s.path), ['/roteiro.md'],
      'o 16:9 passou a gravar o index-16x9.html também');
    assert.equal(readFileSync(join(deck, 'index-16x9.html'), 'utf8'), htmlAntes,
      'o 16:9 passou a reescrever o index-16x9.html');
  } finally {
    await page.close();
    await servidor.fechar();
  }
});

// ------------------------------------------------------------- BUG ADQX
//
// BUG-20260801-ADQX  os comentários-banner <!-- === SLIDE N · … === --> do
//                    template sobrevivem à montagem e ficam órfãos fora do
//                    bloco @MIRA:FAST:SLIDES. O reorderSource fatiava o arquivo
//                    por eles, então o Salvar da reordenação embaralhava
//                    comentário em vez de slide: recusava por contagem, ou
//                    (quando os números coincidiam) gravava um arquivo com o
//                    marcador @MIRA:FAST:SLIDES:END duplicado.
//
// Descoberto durante a reprodução do BUG-20260801-F74X, que ele bloqueava.

/** Quantas vezes cada marcador estrutural aparece no arquivo. */
function marcadores(html) {
  return {
    inicio: (html.match(/@MIRA:FAST:SLIDES:START/g) ?? []).length,
    fim: (html.match(/@MIRA:FAST:SLIDES:END/g) ?? []).length,
    banners: (html.match(/<!--\s*=*\s*SLIDE\b/gi) ?? []).length,
    secoes: (html.match(/<section\b[^>]*>/gi) ?? []).length,
  };
}

casoDeNavegador('BUG-20260801-ADQX · reordenar num deck gerado não embaralha os banners órfãos', async () => {
  const deck = deckGerado(planoStudio());
  const arquivo = join(deck, 'index.html');
  const antes = marcadores(readFileSync(arquivo, 'utf8'));
  // o deck gerado nasce mesmo com banners a mais: é essa a armadilha
  assert.ok(antes.banners > antes.secoes,
    `fixture inválido: ${antes.banners} banners para ${antes.secoes} seções`);

  const servidor = await servirGravando(deck);
  const page = await browser.newPage();
  try {
    await abrirLimpo(page, `${servidor.url}/index.html`);
    const toast = await reordenarESalvar(page, 3);

    assert.ok(!/Falha ao salvar/i.test(toast), `o Salvar recusou: "${toast}"`);
    const depois = marcadores(readFileSync(arquivo, 'utf8'));
    assert.equal(depois.fim, 1, 'o marcador @MIRA:FAST:SLIDES:END foi duplicado');
    assert.equal(depois.inicio, 1, 'o marcador @MIRA:FAST:SLIDES:START foi duplicado');
    assert.equal(depois.banners, antes.banners, 'os banners órfãos foram multiplicados');
    assert.equal(depois.secoes, antes.secoes, 'o arquivo ganhou ou perdeu <section>');
  } finally {
    await page.close();
    await servidor.fechar();
  }
});

casoDeNavegador('BUG-20260801-ADQX · reordenar num deck gerado move a <section>, não o comentário', async () => {
  const deck = deckGerado(planoStudio());
  const arquivo = join(deck, 'index.html');
  const palcosNoArquivo = (html) => (html.match(/id="([a-z]+)-stage"/g) ?? []);
  const antes = palcosNoArquivo(readFileSync(arquivo, 'utf8'));
  assert.deepEqual(antes, ['id="corrida-stage"', 'id="panela-stage"'], 'fixture inválido');

  const servidor = await servirGravando(deck);
  const page = await browser.newPage();
  try {
    await abrirLimpo(page, `${servidor.url}/index.html`);
    await reordenarESalvar(page, 3);
    assert.deepEqual(palcosNoArquivo(readFileSync(arquivo, 'utf8')),
      ['id="panela-stage"', 'id="corrida-stage"'],
      'as <section> não trocaram de lugar no arquivo');
  } finally {
    await page.close();
    await servidor.fechar();
  }
});

casoDeNavegador('BUG-20260801-ADQX · deck com banners coerentes continua reordenando por eles', async () => {
  // No deck de demonstração cada banner delimita de fato um slide, então o
  // caminho dos banners segue valendo: a guarda não pode derrubar o caso bom.
  const deck = deckDemonstracao('mira-studio-demo', 'index.html');
  const arquivo = join(deck, 'index.html');
  const antes = readFileSync(arquivo, 'utf8');
  // o banner da capa é multi-linha, então o corpo precisa de [\s\S] e não [^>]
  const ordemBanners = (html) => (html.match(/<!--\s*=*\s*SLIDE\s+\d+[\s\S]*?-->/gi) ?? [])
    .map((b) => (/SLIDE\s+(\d+)/i.exec(b) ?? [])[1]);
  assert.deepEqual(ordemBanners(antes), ['1', '2', '3', '4'], 'fixture inválido');

  const servidor = await servirGravando(deck);
  const page = await browser.newPage();
  try {
    await abrirLimpo(page, `${servidor.url}/index.html`);
    await reordenarESalvar(page, 3);
    const depois = readFileSync(arquivo, 'utf8');
    assert.deepEqual(ordemBanners(depois), ['1', '3', '2', '4'],
      'o banner não acompanhou o slide que ele descreve');
    assert.equal(marcadores(depois).banners, marcadores(antes).banners,
      'o número de banners mudou');
  } finally {
    await page.close();
    await servidor.fechar();
  }
});

// ------------------------------------------------------- IDENTIDADE DO SLIDE
//
// Casamento bloco ↔ seção por IDENTIDADE, não por posição.
//
// O caminho que o roteiro.md existe para servir é o usuário editá-lo no editor
// dele. Reordenar blocos ali movia título e fala e deixava o palco parado
// embaixo do texto do vizinho, nos DOIS formatos, porque o builder casava
// roteiro.md[i] com a seção da posição i. Com `<!-- mira-slide-id -->` no bloco
// e `data-mira-slide-id` na <section>, a ordem de cada arquivo deixa de importar.

/** Troca dois blocos de lugar dentro do roteiro.md, como se fosse no editor. */
function trocarBlocosNoRoteiro(caminho, a, b) {
  const md = readFileSync(caminho, 'utf8');
  const marcas = [...md.matchAll(/^##[ \t]+/gm)].map((m) => m.index);
  const intro = md.slice(0, marcas[0]);
  const blocos = marcas.map((ini, k) => md.slice(ini, k + 1 < marcas.length ? marcas[k + 1] : md.length));
  const perm = [...blocos.keys()];
  [perm[a], perm[b]] = [perm[b], perm[a]];
  writeFileSync(caminho, intro + perm.map((k) => blocos[k]).join(''));
}

casoDeNavegador('identidade · 9:16 · reordenar no roteiro.md leva o slide inteiro junto', async () => {
  const deck = deckGerado(planoStudio());
  const servidor = await servirGravando(deck);
  const page = await browser.newPage();
  try {
    await abrirLimpo(page, `${servidor.url}/index.html`);
    const antes = await porSlide(page);

    trocarBlocosNoRoteiro(join(deck, 'roteiro.md'), 1, 2);
    await abrirLimpo(page, `${servidor.url}/index.html`);
    const depois = await porSlide(page);

    // o slide 3 subiu inteiro: palco, título e fala chegam juntos na posição 2
    assert.equal(depois[1].palco, antes[2].palco,
      `o palco não acompanhou: esperava ${antes[2].palco}, veio ${depois[1].palco}`);
    assert.equal(depois[1].titulo, antes[2].titulo, 'o título não acompanhou');
    assert.equal(depois[1].fala, antes[2].fala, 'a fala não acompanhou');
    assert.equal(depois[2].palco, antes[1].palco, 'o palco do deslocado não desceu');
    assert.equal(depois[2].titulo, antes[1].titulo, 'o título do deslocado não desceu');
    assert.equal(depois[2].fala, antes[1].fala, 'a fala do deslocado não desceu');
    assert.ok(!depois.some((l) => l.palco && /^sv-slide-/.test(l.palco)),
      `um palco de slug virou genérico: ${JSON.stringify(depois.map((l) => l.palco))}`);
  } finally {
    await page.close();
    await servidor.fechar();
  }
});

casoDeNavegador('identidade · 16:9 · reordenar no roteiro.md leva o slide inteiro junto', async () => {
  const deck = deckGerado(planoStudioFull());
  const servidor = await servirGravando(deck);
  const page = await browser.newPage();
  try {
    await abrirLimpo(page, `${servidor.url}/index-16x9.html`);
    const antes = await porSlide(page);

    trocarBlocosNoRoteiro(join(deck, 'roteiro.md'), 1, 2);
    await abrirLimpo(page, `${servidor.url}/index-16x9.html`);
    const depois = await porSlide(page);

    assert.equal(depois[1].palco, antes[2].palco,
      `o palco não acompanhou no 16:9: esperava ${antes[2].palco}, veio ${depois[1].palco}`);
    assert.equal(depois[1].titulo, antes[2].titulo, 'o título não acompanhou no 16:9');
    assert.equal(depois[1].fala, antes[2].fala, 'a fala não acompanhou no 16:9');
    assert.ok(!depois.some((l) => l.palco && /^sv-slide-/.test(l.palco)),
      `um palco de slug virou genérico no 16:9: ${JSON.stringify(depois.map((l) => l.palco))}`);
  } finally {
    await page.close();
    await servidor.fechar();
  }
});

casoDeNavegador('identidade · a montagem carimba o mesmo id nos dois arquivos', async () => {
  for (const [plano, arquivo] of [[planoStudio(), 'index.html'], [planoStudioFull(), 'index-16x9.html']]) {
    const deck = deckGerado(plano);
    const html = readFileSync(join(deck, arquivo), 'utf8');
    const md = readFileSync(join(deck, 'roteiro.md'), 'utf8');
    const noHtml = [...html.matchAll(/data-mira-slide-id="([^"]+)"/g)].map((m) => m[1]);
    const noMd = [...md.matchAll(/<!--\s*mira-slide-id:\s*([^\s>]+)\s*-->/g)].map((m) => m[1]);
    const esperado = plano.slides.map((s) => s.slug_stage);
    assert.deepEqual(noHtml, esperado, `${arquivo}: ids da <section> fora do esperado`);
    assert.deepEqual(noMd, esperado, `${arquivo}: ids do roteiro.md fora do esperado`);
  }
});

casoDeNavegador('identidade · deck sem id continua casando por posição', async () => {
  // Deck já existente no disco do usuário: nem o HTML nem o roteiro têm id.
  // O builder tem que cair no comportamento de antes, sem exigir migração.
  const deck = deckGerado(planoStudio());
  const arquivo = join(deck, 'index.html');
  const roteiro = join(deck, 'roteiro.md');
  writeFileSync(arquivo, readFileSync(arquivo, 'utf8').replace(/\sdata-mira-slide-id="[^"]*"/g, ''));
  writeFileSync(roteiro, readFileSync(roteiro, 'utf8').replace(/<!--\s*mira-slide-id:[^>]*-->\n/g, ''));

  const servidor = await servirGravando(deck);
  const page = await browser.newPage();
  try {
    await abrirLimpo(page, `${servidor.url}/index.html`);
    const retrato = await porSlide(page);
    assert.deepEqual(retrato.map((l) => l.palco), [null, 'corrida-svg', 'panela-svg'],
      'deck sem id perdeu os palcos ao cair no casamento posicional');
    assert.match(retrato[1].fala, /slide dois/, 'deck sem id desalinhou a fala');
  } finally {
    await page.close();
    await servidor.fechar();
  }
});

casoDeNavegador('identidade · o mira-slide-id não vaza para a fala em nenhum formato', async () => {
  for (const [plano, arquivo] of [[planoStudio(), 'index.html'], [planoStudioFull(), 'index-16x9.html']]) {
    const deck = deckGerado(plano);
    const servidor = await servirGravando(deck);
    const page = await browser.newPage();
    try {
      await abrirLimpo(page, `${servidor.url}/${arquivo}`);
      for (const linha of await porSlide(page)) {
        assert.ok(!/mira-slide-id/.test(linha.fala), `${arquivo}: o id vazou para a fala: "${linha.fala}"`);
        assert.ok(!/<!--/.test(linha.fala), `${arquivo}: comentário vazou para a fala: "${linha.fala}"`);
      }
    } finally {
      await page.close();
      await servidor.fechar();
    }
  }
});
