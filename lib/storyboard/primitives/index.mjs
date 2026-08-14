/**
 * Biblioteca de primitivas visuais do Concept Storyboard.
 *
 * Toda primitiva tem a mesma assinatura: (ctx) => string SVG.
 * ctx = { box, seed, label, state }
 *   box   : {x, y, w, h, cx, cy} vindo de geometry.boxFor()
 *   seed  : inteiro de seed.seedFor(), obrigatório
 *   label : texto curto sob a forma, opcional
 *   state : mapa de 0..1, por exemplo { degraded: 0.6 }
 *
 * Conjunto inicial mínimo (RF-12 da spec). Primitiva nova entra por demanda
 * real de um storyboard, nunca "por precaução".
 */
import { rect, circle, ellipse, line, linePath, text } from '../sketch.mjs';

const LABEL_GAP = 34;

function withLabel(body, ctx) {
  if (!ctx.label) return body;
  return body + text(ctx.label, ctx.box.cx, ctx.box.y + ctx.box.h + LABEL_GAP, 26);
}

/** Figura humana simples: cabeça, tronco, braços, pernas. */
function person(ctx) {
  const { box: b, seed: s } = ctx;
  const headD = Math.min(b.w, b.h) * 0.26;
  const headCy = b.y + headD / 2;
  const neck = headCy + headD / 2;
  const hip = b.y + b.h * 0.62;
  const foot = b.y + b.h * 0.95;
  const arm = b.w * 0.30;
  const legs = b.w * 0.20;
  return withLabel(
    circle(b.cx, headCy, headD, s) +
      line(b.cx, neck, b.cx, hip, s + 1) +
      line(b.cx - arm, neck + b.h * 0.13, b.cx + arm, neck + b.h * 0.13, s + 2) +
      line(b.cx, hip, b.cx - legs, foot, s + 3) +
      line(b.cx, hip, b.cx + legs, foot, s + 4),
    ctx
  );
}

/**
 * Foto: moldura com a "imagem" dentro.
 * `state.degraded` de 0 a 1 come o conteúdo: quanto maior, menos traço sobra.
 * É o que faz a degradação aparecer sem precisar de cor.
 */
function photo(ctx) {
  const { box: b, seed: s } = ctx;
  const d = Math.max(0, Math.min(1, Number(ctx.state?.degraded ?? 0)));
  const inset = b.w * 0.09;
  const ix = b.x + inset;
  const iy = b.y + inset;
  const iw = b.w - inset * 2;
  const ih = b.h - inset * 2;

  let inner = '';
  // Conteúdo da foto: um horizonte e um sol. Some conforme degrada.
  const total = 6;
  const keep = Math.round(total * (1 - d));
  for (let i = 0; i < keep; i++) {
    const t = (i + 1) / (total + 1);
    inner += line(ix + iw * 0.1, iy + ih * (0.35 + t * 0.55), ix + iw * 0.9, iy + ih * (0.35 + t * 0.55), s + 10 + i, {
      roughness: 1.1 + d * 2.6,
      strokeWidth: 1.4,
    });
  }
  if (d < 0.75) {
    inner += circle(ix + iw * 0.72, iy + ih * 0.26, iw * 0.20, s + 30, {
      roughness: 1.1 + d * 3,
    });
  }

  return withLabel(
    rect(b.x, b.y, b.w, b.h, s, { strokeWidth: 2.2 }) +
      rect(ix, iy, iw, ih, s + 5, { roughness: 1 + d * 1.5, strokeWidth: 1.3 }) +
      inner,
    ctx
  );
}

/** Copiadora: corpo, tampa, bandeja de saída. */
function copier(ctx) {
  const { box: b, seed: s } = ctx;
  const bodyY = b.y + b.h * 0.18;
  const bodyH = b.h * 0.62;
  return withLabel(
    rect(b.x, bodyY, b.w, bodyH, s, { strokeWidth: 2.2 }) +
      // tampa
      rect(b.x + b.w * 0.12, b.y, b.w * 0.76, b.h * 0.18, s + 1) +
      // painel
      line(b.x + b.w * 0.12, bodyY + bodyH * 0.28, b.x + b.w * 0.5, bodyY + bodyH * 0.28, s + 2) +
      // bandeja de saída
      linePath(
        [
          [b.x + b.w * 0.08, bodyY + bodyH],
          [b.x + b.w * 0.08, bodyY + bodyH + b.h * 0.1],
          [b.x + b.w * 0.62, bodyY + bodyH + b.h * 0.1],
        ],
        s + 3
      ),
    ctx
  );
}

/** Caixa genérica. */
function box(ctx) {
  const { box: b, seed: s } = ctx;
  return withLabel(rect(b.x, b.y, b.w, b.h, s, { strokeWidth: 2 }), ctx);
}

/** Círculo genérico. */
function circleP(ctx) {
  const { box: b, seed: s } = ctx;
  return withLabel(circle(b.cx, b.cy, Math.min(b.w, b.h) * 0.9, s), ctx);
}

/** Objeto sem primitiva registrada: caixa tracejada com o nome dentro. */
function unknown(ctx) {
  const { box: b, seed: s } = ctx;
  return withLabel(
    rect(b.x, b.y, b.w, b.h, s, { strokeLineDash: [12, 10], strokeWidth: 1.6 }) +
      text(ctx.name || '?', b.cx, b.cy, 30) +
      text('sem primitiva', b.cx, b.cy + 34, 20),
    ctx
  );
}

export const PRIMITIVES = {
  person,
  photo,
  copier,
  box,
  circle: circleP,
  unknown,
};

export function hasPrimitive(name) {
  return Object.prototype.hasOwnProperty.call(PRIMITIVES, name);
}

export function drawObject(name, ctx) {
  const fn = PRIMITIVES[name] || PRIMITIVES.unknown;
  return fn({ ...ctx, name });
}
