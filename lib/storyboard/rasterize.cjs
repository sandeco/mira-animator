/**
 * SVG do storyboard → PNG, via Chrome headless.
 *
 * Segue o padrão de agents/mira-visuals/scripts/capture.cjs: resolve o Chrome
 * em três níveis e carrega o puppeteer tarde. Não é dependência de runtime.
 *
 * Por que embrulhar o SVG num HTML em vez de abrir o .svg direto: abrindo o
 * arquivo puro, o Chrome dimensiona pela janela e o viewBox 16:9 não manda em
 * nada. O shim fixa o tamanho em pixel e o quadro sai no enquadramento certo.
 *
 * CommonJS de propósito: o puppeteer entra por require, como no resto do repo.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

function findChrome() {
  if (process.env.MIRA_CHROME) return process.env.MIRA_CHROME;
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  const la = (process.env.LOCALAPPDATA || '').replace(/\\/g, '/');
  const cands = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    la ? la + '/Google/Chrome/Application/chrome.exe' : null,
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean);
  for (const c of cands) { try { if (fs.existsSync(c)) return c; } catch (_) {} }
  return undefined;
}

function carregarPuppeteer() {
  try {
    return { puppeteer: require('puppeteer'), executablePath: undefined };
  } catch (_) {}
  try {
    const core = require('puppeteer-core');
    const executablePath = findChrome();
    if (!executablePath) return null;
    return { puppeteer: core, executablePath };
  } catch (_) {}
  return null;
}

/** HTML mínimo que fixa o SVG no tamanho declarado. Sem fonte remota. */
function shim(svg, w, h) {
  const semDecl = svg.replace(/<\?xml[^>]*\?>\s*/, '');
  return `<!doctype html><meta charset="utf-8">
<style>
  html,body{margin:0;padding:0;background:#fff}
  svg{display:block;width:${w}px;height:${h}px}
</style>
${semDecl}`;
}

/** file:// que o Chrome entende nos tres sistemas. */
function fileUrl(p) {
  const abs = path.resolve(p).split('\\').join('/');
  return 'file://' + (abs.startsWith('/') ? '' : '/') + abs;
}

/** Ha algo desenhavel no SVG? Barato, e roda sem navegador. */
function temDesenho(svg) {
  return /<(path|rect|circle|ellipse|line|polyline|polygon|text)\b/.test(svg);
}

/**
 * Nivel 3: Chrome do sistema por linha de comando, SEM biblioteca nenhuma.
 *
 * Existe porque os niveis 1 e 2 dependem de `puppeteer` ou `puppeteer-core`, e
 * numa instalacao de usuario final do npm nao existe nenhum dos dois. Sem este
 * nivel o PNG simplesmente nunca sai para quem instala o pacote, que era o
 * defeito encontrado ao testar a instalacao limpa em 2026-08-14.
 *
 * O preco: sem pagina controlada, nao da para consultar `parsererror` nem
 * contar elementos desenhaveis. A checagem vira a pre-checagem em `temDesenho`,
 * feita no Node antes de chamar o Chrome.
 */
function rasterizeViaChromeCli(itens, dim, chrome, tmp, res) {
  for (const item of itens) {
    if (!temDesenho(item.svg)) {
      res.falhas.push({ id: item.id, motivo: 'quadro sem nenhum elemento desenhável' });
      continue;
    }
    const htmlPath = path.join(tmp, `${item.id}.html`);
    fs.writeFileSync(htmlPath, shim(item.svg, dim.width, dim.height), 'utf8');
    fs.mkdirSync(path.dirname(item.out), { recursive: true });

    const r = spawnSync(chrome, [
      '--headless', '--disable-gpu', '--no-sandbox',
      '--allow-file-access-from-files',
      '--default-background-color=FFFFFFFF',
      `--window-size=${dim.width},${dim.height}`,
      `--screenshot=${path.resolve(item.out)}`,
      fileUrl(htmlPath),
    ], { encoding: 'utf8', timeout: 60000 });

    if (r.error || !fs.existsSync(item.out)) {
      res.falhas.push({ id: item.id, motivo: `Chrome não gerou o PNG${r.error ? ': ' + r.error.message : ''}` });
      continue;
    }
    res.ok.push(item.out);
  }
  return res;
}

/**
 * Rasteriza uma lista de SVG.
 * @param {Array<{svg:string,out:string,id:string}>} itens
 * @param {{width:number,height:number}} dim
 * @returns {Promise<{ok:string[], falhas:Array<{id:string,motivo:string}>, indisponivel:boolean}>}
 */
async function rasterize(itens, dim = { width: 1600, height: 900 }) {
  const res = { ok: [], falhas: [], indisponivel: false };
  if (!itens.length) return res;

  const carregado = carregarPuppeteer();
  if (!carregado) {
    // Niveis 1 e 2 ausentes. Nivel 3: Chrome do sistema, sem biblioteca.
    const chrome = findChrome();
    if (!chrome) {
      res.indisponivel = true;
      return res;
    }
    const tmpCli = fs.mkdtempSync(path.join(os.tmpdir(), 'mira-sb-'));
    res.viaChromeCli = true;
    try {
      return rasterizeViaChromeCli(itens, dim, chrome, tmpCli, res);
    } finally {
      try { fs.rmSync(tmpCli, { recursive: true, force: true }); } catch (_) {}
    }
  }

  const { puppeteer, executablePath } = carregado;
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath,
    args: ['--no-sandbox', '--allow-file-access-from-files', '--force-device-scale-factor=1'],
  });

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mira-sb-'));
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: dim.width, height: dim.height, deviceScaleFactor: 1 });

    for (const item of itens) {
      const htmlPath = path.join(tmp, `${item.id}.html`);
      fs.writeFileSync(htmlPath, shim(item.svg, dim.width, dim.height), 'utf8');
      await page.goto('file://' + htmlPath.replace(/\\/g, '/'), { waitUntil: 'load' });
      await page.evaluateHandle('document.fonts.ready');

      // Quadro quebrado é detectado DENTRO da página, antes do screenshot.
      // Um `&` sem escape faz o Chrome renderizar erro de parse, e o autor
      // abriria um PNG em branco achando que o desenho ficou vazio.
      const diag = await page.evaluate(() => ({
        parseError: !!document.querySelector('parsererror'),
        desenhaveis: document.querySelectorAll('svg path, svg rect, svg circle, svg line, svg text').length,
      }));

      if (diag.parseError) {
        res.falhas.push({ id: item.id, motivo: 'XML malformado, o Chrome acusou parsererror' });
        continue;
      }
      if (diag.desenhaveis === 0) {
        res.falhas.push({ id: item.id, motivo: 'quadro sem nenhum elemento desenhável' });
        continue;
      }

      fs.mkdirSync(path.dirname(item.out), { recursive: true });
      await page.screenshot({
        path: item.out,
        clip: { x: 0, y: 0, width: dim.width, height: dim.height },
      });
      res.ok.push(item.out);
    }
  } finally {
    await browser.close();
    try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}
  }
  return res;
}

module.exports = { rasterize, findChrome };
