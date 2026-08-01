import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const MARKERS = Object.freeze({
  cssStart: '<!-- @MIRA:FAST:CSS:START -->', cssEnd: '<!-- @MIRA:FAST:CSS:END -->',
  slidesStart: '<!-- @MIRA:FAST:SLIDES:START -->', slidesEnd: '<!-- @MIRA:FAST:SLIDES:END -->',
  jsStart: '<!-- @MIRA:FAST:JS:START -->', jsEnd: '<!-- @MIRA:FAST:JS:END -->',
});

function findRoot(start) {
  let current = resolve(start);
  while (dirname(current) !== current) {
    if (existsSync(join(current, 'templates', 'decks', 'mira-default', 'index.html'))) return current;
    current = dirname(current);
  }
  throw new Error('raiz do Mira não encontrada');
}

function assertSkeleton(html) {
  for (const marker of Object.values(MARKERS)) {
    if (html.split(marker).length !== 2) throw new Error(`marcador ausente ou duplicado: ${marker}`);
  }
  if (/<section\b/i.test(html)) throw new Error('esqueleto ainda contém section');
}

function stripSlides(html) {
  const section = /^[ \t]*<section\b[^>]*>[\s\S]*?^[ \t]*<\/section>[ \t]*\n?/gmi;
  const first = section.exec(html);
  if (!first) throw new Error('template sem slides reconhecíveis');
  section.lastIndex = 0;
  let inserted = false;
  html = html.replace(section, () => {
    if (inserted) return '';
    inserted = true;
    return `${MARKERS.slidesStart}\n${MARKERS.slidesEnd}\n`;
  });
  return html;
}

function openSlots(html, moduleNames) {
  const compatibility = [];
  if (!html.includes('/* @MIRA:THEME:START */')) compatibility.push('/* @MIRA:THEME:START */\n/* tema preservado do template canônico */\n/* @MIRA:THEME:END */');
  compatibility.push('body > section:first-of-type h1,\nbody > section:first-of-type h2 { text-wrap: balance; }');
  if (!html.includes('/* @MIRA:RESPONSIVE:START */')) compatibility.push('/* @MIRA:RESPONSIVE:START */\n/* geometria responsiva preservada do template canônico */\n/* @MIRA:RESPONSIVE:END */');
  if (compatibility.length) html = html.replace('</head>', `<style id="mira-ultrafast-contract">\n${compatibility.join('\n')}\n</style>\n</head>`);
  html = html.replace('</head>', `${MARKERS.cssStart}\n${MARKERS.cssEnd}\n</head>`);
  for (const module of moduleNames) {
    const escaped = module.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    html = html.replace(new RegExp(`\\s*<script\\b[^>]*src=["']mira/${escaped}["'][^>]*>\\s*</script>`, 'gi'), '');
  }
  html = html.replace('</body>', `${MARKERS.jsStart}\n${MARKERS.jsEnd}\n</body>`);
  // Tags citadas em comentários não são elementos; encode para os validadores.
  html = html.replaceAll('<section>', '&lt;section&gt;').replaceAll('</section>', '&lt;/section&gt;');
  assertSkeleton(html);
  return html;
}

export function buildMiraSkeleton(projectRoot) {
  const sourcePath = join(projectRoot, 'templates', 'decks', 'mira-default', 'index.html');
  let html = readFileSync(sourcePath, 'utf8').replace(/\r\n?/g, '\n');
  const slidesStart = html.indexOf('<!-- === SLIDE 1');
  const navigationLabel = html.indexOf('Navegação slide a slide');
  const navigationStart = navigationLabel < 0 ? -1 : html.lastIndexOf('<script>', navigationLabel);
  if (slidesStart < 0 || navigationStart < slidesStart) throw new Error('template mira-default mudou: limites não reconhecidos');
  html = `${html.slice(0, slidesStart)}${MARKERS.slidesStart}\n${MARKERS.slidesEnd}\n\n${html.slice(navigationStart)}`;
  // O cabeçalho documental contém uma tag de exemplo; codifique-a para que
  // validadores estruturais não a confundam com um slide real.
  html = html.replaceAll('<section>', '&lt;section&gt;').replaceAll('</section>', '&lt;/section&gt;');
  if (!html.includes('/* @MIRA:RESPONSIVE:START */')) {
    html = html.replace('</head>', '<style id="mira-ultrafast-responsive">\n/* @MIRA:RESPONSIVE:START */\n/* responsividade preservada do MIRA-DEFAULT */\n/* @MIRA:RESPONSIVE:END */\n</style>\n</head>');
  }
  html = html.replace('</head>', `${MARKERS.cssStart}\n${MARKERS.cssEnd}\n</head>`);
  html = html.replace(/\n<script defer src="mira\/mira-edit\.js"><\/script>[\s\S]*?<script defer src="mira\/mira-draw\.js"><\/script>/,
    `\n${MARKERS.jsStart}\n${MARKERS.jsEnd}`);
  assertSkeleton(html);
  return html;
}

function buildFromTemplate(projectRoot, relativePath, modules) {
  let html = readFileSync(join(projectRoot, relativePath), 'utf8').replace(/\r\n?/g, '\n');
  html = stripSlides(html);
  return openSlots(html, modules);
}

function buildVerticalSkeleton(projectRoot) {
  let html = buildMiraSkeleton(projectRoot);
  html = html.replace('<title>Mira-Default</title>', '<title>Mira Vertical</title>');
  html = html.replace('/* @MIRA:RESPONSIVE:END */', `
/* @MIRA:ULTRAFAST:VERTICAL */
:root { --fmt-w: min(100vw, calc(100vh * 9 / 16)); --fmt-h: calc(var(--fmt-w) * 16 / 9); }
.anim-stage { aspect-ratio: 128 / 203; }
/* @MIRA:RESPONSIVE:END */`);
  return html;
}

export function buildSkeleton(format, deckDir, options = {}) {
  const projectRoot = options.projectRoot ?? findRoot(process.cwd());
  const builders = {
    mira: () => buildMiraSkeleton(projectRoot),
    'mira-studio': () => buildFromTemplate(projectRoot, 'templates/decks/mira-studio-demo/index.html', ['mira-edit.js', 'mira-edit-free.js', 'mira-draw.js', 'mira-camera.js', 'mira-record.js']),
    'mira-studio-full': () => buildFromTemplate(projectRoot, 'templates/decks/mira-studio-full-demo/index-16x9.html', ['mira-edit.js', 'mira-edit-free.js', 'mira-draw.js', 'mira-camera.js', 'mira-record-16x9.js']),
    'mira-vertical': () => buildVerticalSkeleton(projectRoot),
  };
  if (!builders[format]) throw new Error(`formato inválido: ${format}`);
  const output = join(resolve(deckDir), 'mira', 'fast', 'esqueleto.html');
  mkdirSync(dirname(output), { recursive: true });
  writeFileSync(output, builders[format](), 'utf8');
  return output;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [, , format, deckDir] = process.argv;
  if (!format || !deckDir) throw new Error('uso: build-skeleton.mjs <formato> <deck_dir>');
  process.stdout.write(`${buildSkeleton(format, deckDir)}\n`);
}
