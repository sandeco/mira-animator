/**
 * Camada de esboço. Envolve o Rough.js vendorado e devolve string SVG.
 *
 * Duas razões para existir em vez de as primitivas chamarem o Rough direto:
 *  1. semente obrigatória em toda chamada (ver seed.mjs);
 *  2. se o Rough sair de cena, troca-se este arquivo e nada mais.
 */
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
// Vendorado de propósito: `roughjs` não é dependência de package.json.
const rough = require(path.join(here, 'vendor', 'rough.cjs'));

const gen = rough.generator();

const INK = '#111111';

function assertSeed(seed) {
  if (!Number.isInteger(seed) || seed <= 0) {
    throw new Error(
      `sketch: seed obrigatória e inteira > 0, veio ${seed}. Use seedFor().`
    );
  }
}

/** Converte um Drawable do Rough em <path> SVG. */
function toSvg(drawable, strokeWidth) {
  return gen
    .toPaths(drawable)
    .map((p) => {
      const fill = p.fill && p.fill !== 'none' ? p.fill : 'none';
      const stroke = p.stroke && p.stroke !== 'none' ? p.stroke : INK;
      const w = p.strokeWidth || strokeWidth || 1.6;
      return `<path d="${p.d}" stroke="${stroke}" stroke-width="${w}" fill="${fill}" stroke-linecap="round"/>`;
    })
    .join('');
}

const base = (seed, extra = {}) => ({
  seed,
  roughness: 1.15,
  bowing: 1,
  stroke: INK,
  strokeWidth: 1.8,
  ...extra,
});

export function rect(x, y, w, h, seed, extra) {
  assertSeed(seed);
  return toSvg(gen.rectangle(x, y, w, h, base(seed, extra)));
}

export function circle(cx, cy, d, seed, extra) {
  assertSeed(seed);
  return toSvg(gen.circle(cx, cy, d, base(seed, extra)));
}

export function ellipse(cx, cy, w, h, seed, extra) {
  assertSeed(seed);
  return toSvg(gen.ellipse(cx, cy, w, h, base(seed, extra)));
}

export function line(x1, y1, x2, y2, seed, extra) {
  assertSeed(seed);
  return toSvg(gen.line(x1, y1, x2, y2, base(seed, extra)));
}

export function linePath(points, seed, extra) {
  assertSeed(seed);
  return toSvg(gen.linearPath(points, base(seed, extra)));
}

/** Texto não é esboço: vai como <text> normal, para continuar legível. */
export function text(str, x, y, size = 26, anchor = 'middle', extra = '') {
  return (
    `<text x="${x}" y="${y}" font-family="Segoe UI, Helvetica, Arial, sans-serif" ` +
    `font-size="${size}" fill="${INK}" text-anchor="${anchor}" ${extra}>${escapeXml(str)}</text>`
  );
}

/** Escapar não é paranoia: um `&` solto quebra o XML e o quadro some. */
export function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export { INK };
