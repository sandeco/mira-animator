import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const FORMATS = new Set(['mira', 'mira-studio', 'mira-studio-full', 'mira-vertical']);
const OUTPUTS = {
  mira: 'index.html',
  'mira-studio': 'index.html',
  'mira-studio-full': 'index-16x9.html',
  'mira-vertical': 'index-9x16.html',
};
const MODES = new Set(['estatica', 'animada']);
const TYPES = new Set(['capa', 'animado', 'card', 'cta', 'encerramento']);
const STATIC_TYPES = new Set(['capa', 'card', 'cta', 'encerramento']);
const ANIMATED_FIELDS = [
  'js_id', 'titulo', 'conceito', 'frase_causal', 'metafora', 'familia',
  'verbo_causal', 'silhueta', 'espaco', 'movimento', 'tempo',
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Remove do texto tudo que não é marcação: comentário HTML e o conteúdo de
 * <script> e <style>. Uma tag citada em documentação não é um elemento, e as
 * checagens estruturais precisam enxergar essa diferença.
 * As tags de script e style permanecem; só o conteúdo delas some.
 */
export function stripNonMarkup(value) {
  return String(value)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/(<script\b[^>]*>)[\s\S]*?(<\/script>)/gi, '$1$2')
    .replace(/(<style\b[^>]*>)[\s\S]*?(<\/style>)/gi, '$1$2');
}

/** Aberturas de `section` que são elemento de verdade. */
export function countSections(value) {
  return (stripNonMarkup(value).match(/<section\b/gi) ?? []).length;
}

/** Fechamentos de `section` que são elemento de verdade. */
export function countClosingSections(value) {
  return (stripNonMarkup(value).match(/<\/section>/gi) ?? []).length;
}

function markerCount(fragment, marker) {
  return fragment.split(marker).length - 1;
}

function readPlan(deckDir) {
  const planPath = join(deckDir, 'mira', 'fast', 'plano.json');
  if (!existsSync(planPath)) return { error: `plano ausente: ${planPath}` };
  try {
    return { plan: JSON.parse(readFileSync(planPath, 'utf8').replace(/^\uFEFF/, '')) };
  } catch (error) {
    return { error: `plano inválido: ${error.message}` };
  }
}

export function validatePlan(plan) {
  const errors = [];
  if (!plan || typeof plan !== 'object') return ['plano.json não contém um objeto'];
  if (!FORMATS.has(plan.formato)) errors.push(`formato inválido: ${plan.formato}`);
  if (OUTPUTS[plan.formato] && plan.arquivo_saida !== OUTPUTS[plan.formato]) {
    errors.push(`arquivo_saida inválido para ${plan.formato}: ${plan.arquivo_saida}`);
  }
  for (const field of ['deck_dir', 'titulo_deck', 'paleta', 'tom']) {
    if (plan[field] === undefined || plan[field] === '') errors.push(`${field} obrigatório`);
  }
  if (!Array.isArray(plan.slides)) return [...errors, 'slides deve ser um array'];
  if (plan.total_slides !== plan.slides.length) {
    errors.push(`total_slides=${plan.total_slides} difere de slides.length=${plan.slides.length}`);
  }

  const stages = new Set();
  const jsIds = new Set();
  let animatedCount = 0;

  plan.slides.forEach((slide, index) => {
    const prefix = `slide ${index + 1}`;
    if (slide.n !== index + 1) errors.push(`${prefix}: n deve ser ${index + 1}`);
    if (!TYPES.has(slide.tipo)) errors.push(`${prefix}: tipo inválido`);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slide.slug_stage ?? '')) {
      errors.push(`${prefix}: slug_stage inválido`);
    } else if (stages.has(slide.slug_stage)) {
      errors.push(`${prefix}: slug_stage duplicado: ${slide.slug_stage}`);
    } else stages.add(slide.slug_stage);

    if (!MODES.has(slide.modo_folha)) errors.push(`${prefix}: modo_folha inválido`);
    const camera = slide.layout === 'camera';
    const animated = slide.modo_folha === 'animada';

    if (animated) animatedCount += 1;
    if (animated && slide.tipo !== 'animado') errors.push(`${prefix}: folha animada exige tipo animado`);
    if (!animated && slide.tipo === 'animado') errors.push(`${prefix}: tipo animado exige folha animada`);
    if ((STATIC_TYPES.has(slide.tipo) || camera) && animated) errors.push(`${prefix}: folha estática marcada como animada`);
    if (!camera && !slide.titulo) errors.push(`${prefix}: titulo obrigatório`);

    if (animated) {
      for (const field of ANIMATED_FIELDS) {
        if (slide[field] === undefined || slide[field] === '') errors.push(`${prefix}: ${field} obrigatório`);
      }
      if (!/^[a-z][A-Za-z0-9]*$/.test(slide.js_id ?? '')) {
        errors.push(`${prefix}: js_id inválido`);
      } else if (jsIds.has(slide.js_id)) {
        errors.push(`${prefix}: js_id duplicado: ${slide.js_id}`);
      } else jsIds.add(slide.js_id);
    }

    if (plan.formato === 'mira-studio') {
      if (!['capa', 'camera', 'split', 'full'].includes(slide.layout)) errors.push(`${prefix}: layout inválido para mira-studio`);
      if (slide.layout === 'capa' && !['capa', 'encerramento'].includes(slide.tipo)) errors.push(`${prefix}: layout capa exige tipo capa ou encerramento`);
      if (animated && !['split', 'full'].includes(slide.layout)) errors.push(`${prefix}: animação Studio exige layout split ou full`);
    }
    if (plan.formato === 'mira-studio-full') {
      if (!['camera', 'thirds', 'full'].includes(slide.layout)) errors.push(`${prefix}: layout inválido para mira-studio-full`);
      if (animated && !['thirds', 'full'].includes(slide.layout)) errors.push(`${prefix}: animação Studio Full exige layout thirds ou full`);
    }
    if (['mira-studio', 'mira-studio-full'].includes(plan.formato) && !slide.fala) {
      errors.push(`${prefix}: fala obrigatória no formato Studio`);
    }
    if (plan.formato === 'mira-vertical' && slide.layout !== undefined) {
      errors.push(`${prefix}: mira-vertical não usa layout`);
    }
  });

  if (!Array.isArray(plan.ledger)) {
    errors.push('ledger deve ser um array');
  } else if (plan.ledger.length !== animatedCount) {
    errors.push(`ledger possui ${plan.ledger.length} entrada(s), esperado ${animatedCount}`);
  }

  return errors;
}

export function validateFragment(slide, fragment, plan = {}) {
  const errors = [];
  const expectedKind = slide.modo_folha === 'animada' ? 'animated' : 'static';
  const marker = `<!-- @MIRA:FAST slide=${String(slide.n).padStart(2, '0')} stage=${slide.slug_stage} kind=${expectedKind} -->`;
  const cssMarker = '<!-- @MIRA:FAST css -->';
  const jsMarker = '<!-- @MIRA:FAST js -->';
  const htmlPos = fragment.indexOf(marker);
  const cssPos = fragment.indexOf(cssMarker);
  const jsPos = fragment.indexOf(jsMarker);

  if (markerCount(fragment, marker) !== 1) errors.push('marcador inicial ausente, duplicado ou divergente do plano');
  if (markerCount(fragment, cssMarker) !== 1) errors.push('marcador css ausente ou duplicado');
  if (markerCount(fragment, jsMarker) !== 1) errors.push('marcador js ausente ou duplicado');
  if (!(htmlPos >= 0 && htmlPos < cssPos && cssPos < jsPos)) errors.push('marcadores fora de ordem');

  const htmlBlock = cssPos >= 0 ? fragment.slice(0, cssPos) : fragment;
  const jsBlock = jsPos >= 0 ? fragment.slice(jsPos + jsMarker.length) : '';
  const opens = countSections(htmlBlock);
  const closes = countClosingSections(htmlBlock);
  if (opens !== 1 || closes !== 1) errors.push(`section inválida: ${opens} abertura(s), ${closes} fechamento(s)`);
  if (htmlBlock.includes('—')) errors.push('travessão presente no HTML');

  if (slide.modo_folha === 'animada') {
    const pascal = slide.js_id ? slide.js_id[0].toUpperCase() + slide.js_id.slice(1) : '';
    if (!htmlBlock.includes('<!-- @MIRA:SIZE 3/10 -->')) errors.push('@MIRA:SIZE 3/10 ausente');
    if (pascal && !new RegExp(`function\\s+animate${escapeRegExp(pascal)}\\s*\\(`).test(fragment)) errors.push(`animate${pascal} ausente`);
    if (!fragment.includes(`window.__${slide.js_id}Gen`)) errors.push('generation counter ausente');
    if (!/clear(?:Interval|Timeout)\s*\(/.test(fragment)) errors.push('limpeza de timer ausente');
    if (!fragment.includes(`id="${slide.slug_stage}-stage"`) && !fragment.includes(`id='${slide.slug_stage}-stage'`)) errors.push('id do palco ausente');
    if (pascal) {
      const animateCalls = fragment.match(new RegExp(`\\banimate${escapeRegExp(pascal)}\\s*\\(`, 'g')) ?? [];
      if (animateCalls.length !== 1) errors.push('trigger da animação pertence ao montador');
    }
    if (/IntersectionObserver|DOMContentLoaded/.test(fragment)) errors.push('observer da animação pertence ao montador');
  } else if (htmlBlock.includes('<!-- @MIRA:SIZE')) {
    errors.push('folha estática não pode declarar @MIRA:SIZE');
  }

  const format = plan.formato;
  if (format === 'mira') {
    const oldMiraClasses = [
      'glass-card', 'mira-fast-card', 'mira-fast-static', 'mira-fast-pills',
      'attribute-pill', 'replay-btn', 'mira-fast-subtitle',
    ];
    for (const className of oldMiraClasses) {
      if (htmlBlock.includes(className)) errors.push(`mira-default não aceita ${className}`);
    }

    if (slide.modo_folha === 'animada') {
      if (!/class=["'][^"']*\bslide-main\b/.test(htmlBlock)) errors.push('mira animado exige .slide-main');
      if (!/<h2\b/i.test(htmlBlock)) errors.push('mira animado exige h2');
      if (!/class=["'][^"']*\banim-stage\b/.test(htmlBlock)) errors.push('mira animado exige .anim-stage');
      if (!new RegExp(`id=["']${escapeRegExp(slide.slug_stage)}-svg["']`).test(htmlBlock)) errors.push('id do svg ausente');
      if (/\bviewBox\s*=/i.test(htmlBlock)) errors.push('mira-default não aceita viewBox fixo no HTML');
      if (!/closest\(\s*["']\.anim-stage["']\s*\)/.test(jsBlock) || !/getBoundingClientRect\s*\(/.test(jsBlock)) {
        errors.push('mira animado exige geometria real do palco');
      }
      if (!/\.attr\(\s*["']viewBox["']\s*,/.test(jsBlock)) errors.push('mira animado deve calcular viewBox no JavaScript');
      if (!/getComputedStyle\s*\(\s*document\.documentElement\s*\)/.test(jsBlock) || !/getPropertyValue\(\s*["']--mira-primary["']\s*\)/.test(jsBlock)) {
        errors.push('mira animado deve ler --mira-primary');
      }
      if (/#(?:[0-9a-f]{3}|[0-9a-f]{6})\b/i.test(jsBlock)) errors.push('mira-default não aceita cor hexadecimal fixa no JavaScript');
    } else {
      if (!/class=["'][^"']*\bslide-centro\b/.test(htmlBlock)) errors.push('mira estático exige .slide-centro');
      const heading = slide.tipo === 'capa' ? 'h1' : 'h2';
      if (!new RegExp(`<${heading}\\b`, 'i').test(htmlBlock)) errors.push(`mira estático ${slide.tipo} exige ${heading}`);
    }
  }
  if (format === 'mira-studio') {
    if (slide.layout === 'capa') {
      if (/data-layout=/.test(htmlBlock)) errors.push('capa Studio não usa data-layout');
    } else if (!new RegExp(`data-layout=["']${escapeRegExp(slide.layout)}["']`).test(htmlBlock)) {
      errors.push(`data-layout=${slide.layout} ausente`);
    }
    if (slide.layout === 'camera' && !htmlBlock.includes('cam-area')) errors.push('camera Studio exige cam-area');
    if (slide.layout === 'split' && (!htmlBlock.includes('split-top') || !htmlBlock.includes('cam-area'))) errors.push('split Studio exige split-top e cam-area');
    if (slide.layout === 'full' && htmlBlock.includes('cam-area')) errors.push('full Studio não usa cam-area');
  }

  if (format === 'mira-studio-full') {
    if (!new RegExp(`data-layout=["']${escapeRegExp(slide.layout)}["']`).test(htmlBlock)) errors.push(`data-layout=${slide.layout} ausente`);
    if (slide.layout === 'camera' && !htmlBlock.includes('cam-area')) errors.push('camera Studio Full exige cam-area');
    if (slide.layout === 'thirds' && (!htmlBlock.includes('thirds-main') || !htmlBlock.includes('cam-area'))) errors.push('thirds exige thirds-main e cam-area');
    if (slide.layout === 'full' && (!htmlBlock.includes('full-main') || htmlBlock.includes('cam-area'))) errors.push('full Studio Full exige full-main e não usa cam-area');
  }

  if (format === 'mira-vertical' && slide.modo_folha === 'animada') {
    if (!/aspect-ratio\s*:\s*128\s*\/\s*203/.test(fragment)) errors.push('mira-vertical exige palco 128/203');
    if (!/viewBox=["'][^"']*\b(?:1522(?:\.5)?|1523|1585(?:\.9[0-9]*)?|2030)\b/.test(fragment)) errors.push('mira-vertical exige viewBox retrato');
  }

  return errors;
}

export function validateSlideFile(deckDir, slideNumber) {
  const loaded = readPlan(deckDir);
  if (loaded.error) return { ok: false, errors: [loaded.error] };
  const { plan } = loaded;
  const errors = validatePlan(plan);
  const slide = plan.slides?.find((item) => item.n === slideNumber);
  if (!slide) return { ok: false, errors: [...errors, `slide ${slideNumber}: ausente no plano`] };
  const file = join(deckDir, 'mira', 'fast', `slide-${String(slide.n).padStart(2, '0')}.html`);
  if (!existsSync(file)) return { ok: false, errors: [...errors, `slide ${slide.n}: fragmento ausente`] };
  const fragment = readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
  for (const error of validateFragment(slide, fragment, plan)) errors.push(`slide ${slide.n}: ${error}`);
  return { ok: errors.length === 0, errors, slide: slide.n };
}

export function validateRun(deckDir) {
  const loaded = readPlan(deckDir);
  if (loaded.error) return { ok: false, errors: [loaded.error] };
  const { plan } = loaded;
  const errors = validatePlan(plan);
  const expected = new Set();

  if (Array.isArray(plan.slides)) {
    for (const slide of plan.slides) {
      const name = `slide-${String(slide.n).padStart(2, '0')}.html`;
      expected.add(name);
      const file = join(deckDir, 'mira', 'fast', name);
      if (!existsSync(file)) {
        errors.push(`slide ${slide.n}: fragmento ausente`);
        continue;
      }
      const fragment = readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
      for (const error of validateFragment(slide, fragment, plan)) errors.push(`slide ${slide.n}: ${error}`);
    }
  }

  const fastDir = join(deckDir, 'mira', 'fast');
  if (existsSync(fastDir)) {
    for (const name of readdirSync(fastDir)) {
      if (/^slide-\d+\.html$/.test(name) && !expected.has(name)) errors.push(`fragmento inesperado: ${name}`);
    }
  }

  return { ok: errors.length === 0, errors, total: plan.slides?.length ?? 0 };
}

const currentFile = resolve(fileURLToPath(import.meta.url));
if (process.argv[1] && currentFile === resolve(process.argv[1])) {
  const deckDir = process.argv[2];
  const slideFlag = process.argv.indexOf('--slide');
  const slideNumber = slideFlag >= 0 ? Number(process.argv[slideFlag + 1]) : null;
  if (!deckDir || (slideFlag >= 0 && !Number.isInteger(slideNumber))) {
    console.error(JSON.stringify({ ok: false, errors: ['uso: validate-run.mjs <deck_dir> [--slide N]'] }, null, 2));
    process.exit(2);
  }
  const result = slideNumber === null ? validateRun(resolve(deckDir)) : validateSlideFile(resolve(deckDir), slideNumber);
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
}
