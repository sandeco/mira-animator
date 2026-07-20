/**
 * mira-visuals :: converte um HTML (painel, infográfico, diagrama D3) em PNG.
 *
 *   node agents/mira-visuals/scripts/capture.cjs <input.html> <output.png> [largura] [altura]
 *
 * Abre o HTML por file:// no Chrome headless, espera as fontes e o D3 assentarem, e salva
 * um PNG do tamanho exato pedido.
 *
 * CommonJS (.cjs) de propósito, mesmo padrão do mira-slide-to-video: roda igual no repo-fonte
 * (que é "type": "module") e instalado em .claude/skills, sem virar ESM. O antecessor era um
 * .js com require() dentro de um pacote ESM, e por isso nunca rodou (ver dev/BUGS.md, B3).
 *
 * Resolve o navegador em três degraus:
 *   1. o pacote `puppeteer` completo (traz o próprio Chromium);
 *   2. `puppeteer-core` + o Chrome já baixado em ~/.cache/puppeteer;
 *   3. um Chrome do sistema.
 * Para forçar um binário: PUPPETEER_EXECUTABLE_PATH=/caminho/do/chrome
 */
const path = require('path');
const fs = require('fs');
const os = require('os');

function findChrome() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;

  const caches = [
    path.join(os.homedir(), '.cache', 'puppeteer', 'chrome'),
    '/root/.cache/puppeteer/chrome',
  ];
  for (const root of caches) {
    if (!fs.existsSync(root)) continue;
    for (const dir of fs.readdirSync(root)) {
      const candidatos = [
        path.join(root, dir, 'chrome-linux64', 'chrome'),
        path.join(root, dir, 'chrome-win64', 'chrome.exe'),
        path.join(root, dir, 'chrome-mac-x64', 'Google Chrome for Testing.app',
          'Contents', 'MacOS', 'Google Chrome for Testing'),
      ];
      for (const bin of candidatos) if (fs.existsSync(bin)) return bin;
    }
  }
  const doSistema = [
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  ];
  for (const bin of doSistema) if (fs.existsSync(bin)) return bin;
  return null;
}

function carregarPuppeteer() {
  try {
    return { puppeteer: require('puppeteer'), executablePath: undefined };
  } catch {
    let core;
    try {
      core = require('puppeteer-core');
    } catch {
      console.error('Instale o puppeteer:  npm install puppeteer --no-save');
      process.exit(1);
    }
    const executablePath = findChrome();
    if (!executablePath) {
      console.error('Chrome não encontrado. Rode "npx puppeteer browsers install chrome" ou defina PUPPETEER_EXECUTABLE_PATH.');
      process.exit(1);
    }
    return { puppeteer: core, executablePath };
  }
}

async function main() {
  const [, , inFile, outFile, wArg, hArg] = process.argv;
  if (!inFile || !outFile) {
    console.error('uso: node capture.cjs <input.html> <output.png> [largura] [altura]');
    process.exit(1);
  }

  const input = path.resolve(inFile);
  const output = path.resolve(outFile);
  const width = parseInt(wArg || '1920', 10);
  const height = parseInt(hArg || '1920', 10);

  if (!fs.existsSync(input)) {
    console.error(`não encontrei o HTML de entrada: ${input}`);
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(output), { recursive: true });

  const { puppeteer, executablePath } = carregarPuppeteer();
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath,
    args: ['--no-sandbox', '--allow-file-access-from-files', '--force-device-scale-factor=1'],
  });

  const page = await browser.newPage();
  const erros = [];
  page.on('pageerror', e => erros.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') erros.push('CONSOLE: ' + m.text()); });
  page.on('requestfailed', r => erros.push('REQFAIL: ' + r.url()));

  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.goto('file://' + input, { waitUntil: 'networkidle0' });
  await page.evaluateHandle('document.fonts.ready');
  await new Promise(r => setTimeout(r, 1200));   // deixa a animação de entrada assentar

  await page.screenshot({ path: output, clip: { x: 0, y: 0, width, height } });
  await browser.close();

  console.log(`PNG salvo: ${output} (${width}x${height})`);
  console.log(erros.length ? '--- ERROS ---\n' + [...new Set(erros)].join('\n') : 'sem erros de runtime');
}

main().catch(e => { console.error(e); process.exit(1); });
