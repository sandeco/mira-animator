import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { countSections, validateRun } from './validate-run.mjs';

export const SLOT_MARKERS = Object.freeze({
  cssStart: '<!-- @MIRA:FAST:CSS:START -->',
  cssEnd: '<!-- @MIRA:FAST:CSS:END -->',
  slidesStart: '<!-- @MIRA:FAST:SLIDES:START -->',
  slidesEnd: '<!-- @MIRA:FAST:SLIDES:END -->',
  jsStart: '<!-- @MIRA:FAST:JS:START -->',
  jsEnd: '<!-- @MIRA:FAST:JS:END -->',
});

const FORMAT_MODULES = Object.freeze({
  mira: ['mira-edit.js', 'mira-edit-free.js', 'mira-draw.js'],
  'mira-vertical': ['mira-edit.js', 'mira-edit-free.js', 'mira-draw.js'],
  'mira-studio': ['mira-edit.js', 'mira-edit-free.js', 'mira-draw.js', 'mira-camera.js', 'mira-record.js'],
  'mira-studio-full': ['mira-edit.js', 'mira-edit-free.js', 'mira-draw.js', 'mira-camera.js', 'mira-record-16x9.js'],
});

const STUDIO_FILES = Object.freeze({
  'mira-studio': ['mira-studio-windows.bat'],
  'mira-studio-full': ['mira-studio-16x9-windows.bat', 'mira-studio-16x9-apple.command'],
});

function normalize(value) {
  return value.replace(/\r\n?/g, '\n');
}

function count(value, needle) {
  return value.split(needle).length - 1;
}

function replaceSlot(source, start, end, content) {
  if (count(source, start) !== 1 || count(source, end) !== 1) {
    throw new Error(`slot ausente ou duplicado: ${start} / ${end}`);
  }
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end);
  if (startIndex >= endIndex) throw new Error(`slot fora de ordem: ${start}`);
  return `${source.slice(0, startIndex + start.length)}\n${content.trim()}\n${source.slice(endIndex)}`;
}

function extractSingleTag(region, tag, slideNumber) {
  const matches = [...region.matchAll(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi'))];
  if (matches.length !== 1) {
    throw new Error(`slide ${slideNumber}: esperado exatamente um <${tag}>`);
  }
  return matches[0][1].trim();
}

function extractFragment(fragment, slide) {
  const header = `<!-- @MIRA:FAST slide=${String(slide.n).padStart(2, '0')} stage=${slide.slug_stage} kind=${slide.modo_folha === 'animada' ? 'animated' : 'static'} -->`;
  const cssMarker = '<!-- @MIRA:FAST css -->';
  const jsMarker = '<!-- @MIRA:FAST js -->';
  const headerEnd = fragment.indexOf(header) + header.length;
  const cssIndex = fragment.indexOf(cssMarker);
  const jsIndex = fragment.indexOf(jsMarker);
  if (headerEnd < header.length || cssIndex < headerEnd || jsIndex < cssIndex) {
    throw new Error(`slide ${slide.n}: envelope inválido`);
  }
  return {
    html: fragment.slice(headerEnd, cssIndex).trim(),
    css: extractSingleTag(fragment.slice(cssIndex + cssMarker.length, jsIndex), 'style', slide.n),
    js: extractSingleTag(fragment.slice(jsIndex + jsMarker.length), 'script', slide.n),
  };
}

function buildTriggers(plan) {
  const animated = plan.slides.filter((slide) => slide.modo_folha === 'animada');
  if (animated.length === 0) return '';
  const entries = animated.map((slide) => {
    const pascal = slide.js_id[0].toUpperCase() + slide.js_id.slice(1);
    return `    { stageId: ${JSON.stringify(`${slide.slug_stage}-stage`)}, replayId: ${JSON.stringify(`replay-${slide.slug_stage}`)}, run: animate${pascal} }`;
  }).join(',\n');
  return `(function miraFastBindAnimations() {
  const entries = [
${entries}
  ];
  const observed = new WeakSet();
  const replayBound = new WeakSet();
  const observer = new IntersectionObserver((changes) => {
    for (const change of changes) {
      if (!change.isIntersecting) continue;
      const entry = entries.find((item) => item.stageId === change.target.id);
      if (entry) entry.run();
    }
  }, { threshold: 0.4 });

  function bind() {
    for (const entry of entries) {
      const stage = document.getElementById(entry.stageId);
      if (stage && !observed.has(stage)) {
        observed.add(stage);
        observer.observe(stage);
      }
      const replay = document.getElementById(entry.replayId);
      if (replay && !replayBound.has(replay)) {
        replayBound.add(replay);
        replay.addEventListener('click', entry.run);
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
  new MutationObserver(bind).observe(document.documentElement, { childList: true, subtree: true });
})();`;
}

function buildRoteiro(plan) {
  if (!['mira-studio', 'mira-studio-full'].includes(plan.formato)) return null;
  const layouts = plan.formato === 'mira-studio'
    ? '`capa`, `camera`, `split` e `full`'
    : '`camera`, `thirds` e `full`';
  const lines = [
    `# ${plan.titulo_deck}`,
    '',
    `Layouts aceitos: ${layouts}. Edite as falas abaixo; o deck usa este arquivo como fonte da verdade.`,
    '',
  ];
  for (const slide of plan.slides) {
    const fields = [`## Slide ${slide.n}`, slide.layout];
    if (slide.titulo && slide.layout !== 'camera') fields.push(slide.titulo);
    if (slide.animacao_declarativa) fields.push(String(slide.animacao_declarativa));
    lines.push(fields.filter(Boolean).join(' | '), '', slide.fala ?? '', '');
  }
  return `${lines.join('\n').trimEnd()}\n`;
}

function findTemplateDir(projectRoot, kind) {
  for (const candidate of [
    join(projectRoot, 'mira-templates', kind),
    join(projectRoot, 'templates', kind),
  ]) {
    if (existsSync(candidate)) return candidate;
  }
  throw new Error(`templates/${kind} ausente; execute npx mira-animator update`);
}

function copyRequired(source, destination) {
  if (!existsSync(source)) throw new Error(`arquivo obrigatório ausente: ${source}`);
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(source, destination);
}

function installRuntime(projectRoot, deckDir, format) {
  const modules = FORMAT_MODULES[format];
  if (!modules) throw new Error(`formato sem módulos definidos: ${format}`);
  const authoringDir = findTemplateDir(projectRoot, 'authoring');
  for (const module of modules) {
    copyRequired(join(authoringDir, module), join(deckDir, 'mira', module));
  }

  if (!STUDIO_FILES[format]) return modules;
  const studioDir = findTemplateDir(projectRoot, 'studio');
  const vendorDir = findTemplateDir(projectRoot, 'vendor');
  copyRequired(join(studioDir, 'mira-studio-server.cjs'), join(deckDir, 'mira', 'mira-studio-server.cjs'));
  for (const launcher of STUDIO_FILES[format]) {
    copyRequired(join(studioDir, launcher), join(deckDir, launcher));
  }
  for (const vendor of ['d3.v7.min.js', 'mp4-muxer.js']) {
    copyRequired(join(vendorDir, vendor), join(deckDir, 'assets', 'vendor', vendor));
  }
  return modules;
}

function stripModuleTags(html, modules) {
  let result = html;
  for (const module of modules) {
    const escaped = module.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    result = result.replace(
      new RegExp(`\\s*<script\\b[^>]*\\bsrc=["']mira/${escaped}["'][^>]*>\\s*</script>`, 'gi'),
      '',
    );
  }
  return result;
}

function buildModuleTags(modules) {
  return modules.map((module) => `<script defer src="mira/${module}"></script>`).join('\n');
}

export function validateSkeleton(skeleton, format) {
  const errors = [];
  for (const marker of Object.values(SLOT_MARKERS)) {
    if (count(skeleton, marker) !== 1) errors.push(`marcador de esqueleto ausente ou duplicado: ${marker}`);
  }
  if (!skeleton.includes('/* @MIRA:THEME:START */') || !skeleton.includes('/* @MIRA:THEME:END */')) {
    errors.push('esqueleto sem bloco @MIRA:THEME');
  }
  if (!skeleton.includes('/* @MIRA:RESPONSIVE:START */') || !skeleton.includes('/* @MIRA:RESPONSIVE:END */')) {
    errors.push('esqueleto sem bloco @MIRA:RESPONSIVE');
  }
  if (!/body\s*>\s*section:first-of-type h1[\s\S]{0,160}body\s*>\s*section:first-of-type h2[\s\S]{0,120}text-wrap\s*:\s*balance/.test(skeleton)) {
    errors.push('esqueleto sem balanceamento de título da capa');
  }
  if (format === 'mira') {
    if (!skeleton.includes('MIRA-DEFAULT')) errors.push('formato mira exige esqueleto MIRA-DEFAULT');
    if (!/\.slide-main\s*\{/.test(skeleton) || !/\.slide-centro\s*\{/.test(skeleton)) {
      errors.push('esqueleto MIRA-DEFAULT sem .slide-main/.slide-centro');
    }
    if (!skeleton.includes('--mira-primary') || !skeleton.includes('--fmt-w') || !skeleton.includes('--fmt-h')) {
      errors.push('esqueleto MIRA-DEFAULT incompleto');
    }
  }
  const bodyOpen = skeleton.search(/<body\b[^>]*>/i);
  const bodyClose = skeleton.search(/<\/body>/i);
  const headClose = skeleton.search(/<\/head>/i);
  const cssStart = skeleton.indexOf(SLOT_MARKERS.cssStart);
  const slidesStart = skeleton.indexOf(SLOT_MARKERS.slidesStart);
  const slidesEnd = skeleton.indexOf(SLOT_MARKERS.slidesEnd);
  const jsStart = skeleton.indexOf(SLOT_MARKERS.jsStart);
  if (!(cssStart >= 0 && cssStart < headClose)) errors.push('slot CSS deve ficar dentro de <head>');
  if (!(bodyOpen >= 0 && bodyOpen < slidesStart && slidesStart < slidesEnd && slidesEnd < jsStart && jsStart < bodyClose)) {
    errors.push('slots de slides/JS fora de ordem no <body>');
  }
  if (slidesStart >= 0 && slidesEnd > slidesStart) {
    const outside = `${skeleton.slice(0, slidesStart)}${skeleton.slice(slidesEnd + SLOT_MARKERS.slidesEnd.length)}`;
    if (countSections(outside) > 0) errors.push('esqueleto contém <section> fora do slot de slides');
  }
  return errors;
}

function readLeafResults(deckDir, plan) {
  return plan.slides.map((slide) => {
    const path = join(deckDir, 'mira', 'fast', `result-${String(slide.n).padStart(2, '0')}.json`);
    if (!existsSync(path)) return { n: slide.n, ok: true, attempts: null, validation: 'status não informado; fragmento validado' };
    try {
      return JSON.parse(readFileSync(path, 'utf8').replace(/^\uFEFF/, ''));
    } catch {
      return { n: slide.n, ok: true, attempts: null, validation: 'status inválido; fragmento validado' };
    }
  });
}

function writeLog(deckDir, lines) {
  const path = join(deckDir, 'mira', 'fast', 'montagem.log');
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${lines.join('\n').trimEnd()}\n`, 'utf8');
}

function hash(value) {
  return createHash('sha256').update(value).digest('hex');
}

function publishOutput(outputPath, content) {
  const tempPath = `${outputPath}.mira-fast.tmp`;
  const backupPath = `${outputPath}.mira-fast.bak`;
  writeFileSync(tempPath, content, 'utf8');
  try {
    renameSync(tempPath, outputPath);
    return;
  } catch (error) {
    if (!existsSync(outputPath) || !['EEXIST', 'EPERM', 'EACCES'].includes(error.code)) {
      rmSync(tempPath, { force: true });
      throw error;
    }
  }

  rmSync(backupPath, { force: true });
  renameSync(outputPath, backupPath);
  try {
    renameSync(tempPath, outputPath);
    rmSync(backupPath, { force: true });
  } catch (error) {
    if (existsSync(backupPath) && !existsSync(outputPath)) renameSync(backupPath, outputPath);
    rmSync(tempPath, { force: true });
    throw error;
  }
}

export function assembleRun(deckPath, options = {}) {
  const deckDir = resolve(deckPath);
  const projectRoot = resolve(options.projectRoot ?? process.cwd());
  const log = ['[Mira Fast] Fase 3 determinística'];
  try {
    const validation = validateRun(deckDir);
    log.push(`validacao: ${validation.ok ? 'PASS' : 'FAIL'}`);
    if (!validation.ok) throw new Error(validation.errors.join(' | '));

    const planPath = join(deckDir, 'mira', 'fast', 'plano.json');
    const plan = JSON.parse(readFileSync(planPath, 'utf8').replace(/^\uFEFF/, ''));
    const leafResults = readLeafResults(deckDir, plan);
    const failedResults = leafResults.filter((result) => result.ok === false);
    if (failedResults.length) {
      throw new Error(`folha(s) com status de falha: ${failedResults.map((result) => result.n).join(', ')}`);
    }
    const skeletonPath = join(deckDir, 'mira', 'fast', 'esqueleto.html');
    if (!existsSync(skeletonPath)) throw new Error(`esqueleto ausente: ${skeletonPath}`);
    if (!existsSync(join(deckDir, 'references'))) throw new Error('pasta obrigatória references/ ausente');
    if (!existsSync(join(deckDir, 'references', 'quadro-metaforas.md'))) {
      throw new Error('references/quadro-metaforas.md ausente');
    }

    let skeleton = normalize(readFileSync(skeletonPath, 'utf8').replace(/^\uFEFF/, ''));
    const skeletonErrors = validateSkeleton(skeleton, plan.formato);
    if (skeletonErrors.length) throw new Error(skeletonErrors.join(' | '));

    const parts = plan.slides.map((slide) => {
      const fragmentPath = join(deckDir, 'mira', 'fast', `slide-${String(slide.n).padStart(2, '0')}.html`);
      const fragment = normalize(readFileSync(fragmentPath, 'utf8').replace(/^\uFEFF/, ''));
      return { slide, ...extractFragment(fragment, slide) };
    });

    const modules = installRuntime(projectRoot, deckDir, plan.formato);
    skeleton = stripModuleTags(skeleton, modules);
    const slides = parts
      .map(({ slide, html }) => `<!-- @MIRA:FAST:SLIDE ${String(slide.n).padStart(2, '0')} ${slide.slug_stage} -->\n${html}`)
      .join('\n\n');
    const css = `<style id="mira-fast-generated">\n${parts
      .map(({ slide, css: value }) => `/* slide ${String(slide.n).padStart(2, '0')}: ${slide.slug_stage} */\n${value}`)
      .join('\n\n')}\n</style>`;
    const leafJs = parts
      .filter(({ slide }) => slide.modo_folha === 'animada')
      .map(({ slide, js }) => `// slide ${String(slide.n).padStart(2, '0')}: ${slide.slug_stage}\n${js}`)
      .join('\n\n');
    const generatedJs = [leafJs, buildTriggers(plan)].filter(Boolean).join('\n\n');
    const js = `${generatedJs ? `<script id="mira-fast-generated">\n${generatedJs}\n</script>\n` : ''}${buildModuleTags(modules)}`;

    let output = replaceSlot(skeleton, SLOT_MARKERS.cssStart, SLOT_MARKERS.cssEnd, css);
    output = replaceSlot(output, SLOT_MARKERS.slidesStart, SLOT_MARKERS.slidesEnd, slides);
    output = replaceSlot(output, SLOT_MARKERS.jsStart, SLOT_MARKERS.jsEnd, js);
    output = `${output.trimEnd()}\n`;

    const sectionCount = countSections(output);
    if (sectionCount !== plan.slides.length) {
      const suspeitos = parts
        .filter(({ html }) => countSections(html) !== 1)
        .map(({ slide, html }) => `slide ${slide.n} (${slide.slug_stage}): ${countSections(html)}`);
      const detalhe = suspeitos.length ? `; fragmento(s) fora do esperado: ${suspeitos.join(', ')}` : '';
      throw new Error(`saída possui ${sectionCount} section(s), esperado ${plan.slides.length}${detalhe}`);
    }
    for (const module of modules) {
      if (count(output, `src="mira/${module}"`) !== 1) throw new Error(`módulo duplicado ou ausente: ${module}`);
    }

    const outputPath = join(deckDir, plan.arquivo_saida);
    publishOutput(outputPath, output);

    const roteiro = buildRoteiro(plan);
    if (roteiro !== null) writeFileSync(join(deckDir, 'roteiro.md'), roteiro, 'utf8');

    log.push(`formato: ${plan.formato}`, `slides: ${plan.slides.length}`, `saida: ${basename(outputPath)}`);
    for (const result of leafResults) {
      log.push(`slide ${result.n}: ok=${result.ok !== false}; attempts=${result.attempts ?? '?'}; validation=${result.validation ?? 'pass'}`);
    }
    log.push(`sha256: ${hash(output)}`, 'resultado: PASS');
    writeLog(deckDir, log);
    return {
      ok: true,
      deck_dir: deckDir,
      output: outputPath,
      slides: plan.slides.length,
      sha256: hash(output),
    };
  } catch (error) {
    log.push(`erro: ${error.message}`, 'resultado: FAIL');
    writeLog(deckDir, log);
    throw error;
  }
}

const currentFile = resolve(fileURLToPath(import.meta.url));
if (process.argv[1] && currentFile === resolve(process.argv[1])) {
  const deckDir = process.argv[2];
  if (!deckDir) {
    console.error(JSON.stringify({ ok: false, error: 'uso: assemble-run.mjs <deck_dir>' }, null, 2));
    process.exit(2);
  }
  try {
    console.log(JSON.stringify(assembleRun(deckDir), null, 2));
  } catch (error) {
    console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
    process.exit(1);
  }
}
