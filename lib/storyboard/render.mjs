/**
 * Cena semântica (JSON) → SVG.
 *
 * O agente escreve o que a cena SIGNIFICA; este arquivo decide como ela
 * APARECE. Separar as duas camadas é o que impede o desenho de oscilar de
 * quadro para quadro e o autor de julgar o traço em vez da ideia.
 */
import { boxFor, edge, footerBox, STAGE, POSITIONS } from './geometry.mjs';
import { seedFor } from './seed.mjs';
import { drawObject, hasPrimitive } from './primitives/index.mjs';
import { line, linePath, text, escapeXml, INK } from './sketch.mjs';

const ARROW_KINDS = ['arrow', 'curvedArrow', 'motionArrow'];

/** Valida a cena e devolve a lista de problemas. Vazia = cena válida. */
export function validateScene(scene, file = 'cena') {
  const errs = [];
  if (!Number.isInteger(scene.slide) || scene.slide < 1) {
    errs.push(`${file}: campo "slide" obrigatório, inteiro >= 1`);
  }
  if (!scene.concept_reference || typeof scene.concept_reference !== 'object') {
    errs.push(`${file}: campo "concept_reference" obrigatório (mapa)`);
  }
  if (!scene.visual_intent || typeof scene.visual_intent !== 'string') {
    errs.push(`${file}: campo "visual_intent" obrigatório (texto)`);
  } else if (scene.visual_intent.length > 140) {
    errs.push(`${file}: "visual_intent" tem ${scene.visual_intent.length} chars, máximo 140`);
  }
  if (!scene.composition || typeof scene.composition !== 'object') {
    errs.push(`${file}: campo "composition" obrigatório`);
    return errs;
  }
  const names = Object.keys(scene.composition);
  if (names.length === 0) {
    errs.push(`${file}: "composition" vazia, não há o que desenhar`);
  }
  for (const pos of names) {
    if (!POSITIONS.includes(pos)) {
      errs.push(`${file}: posição "${pos}" desconhecida. Disponíveis: ${POSITIONS.join(', ')}`);
    }
  }
  for (const [pos, obj] of Object.entries(scene.composition)) {
    if (!obj || !obj.object) errs.push(`${file}: "${pos}" sem campo "object"`);
  }
  for (const act of scene.actions || []) {
    const kind = ARROW_KINDS.find((k) => k in act);
    if (!kind) {
      errs.push(`${file}: ação sem tipo reconhecido. Use: ${ARROW_KINDS.join(', ')}`);
      continue;
    }
    const { from, to } = act[kind];
    for (const ref of [from, to]) {
      const r = resolveRef(scene, ref);
      if (r.erro) errs.push(`${file}: ${r.erro}`);
    }
  }
  return errs;
}

/**
 * Resolve a referência de uma seta.
 *
 * Aceita nome de POSIÇÃO (`left`, `center`) ou nome de OBJETO (`copier`).
 * A posição é sempre inequívoca; o nome do objeto só vale quando aparece uma
 * vez só na cena. Cena com dois `photo` e uma seta `from: photo` é ambígua, e
 * ambiguidade aqui desenharia a seta no objeto errado em silêncio.
 */
export function resolveRef(scene, ref) {
  const comp = scene.composition || {};
  if (Object.prototype.hasOwnProperty.call(comp, ref)) return { pos: ref };

  const posicoes = Object.entries(comp)
    .filter(([, o]) => o && o.object === ref)
    .map(([pos]) => pos);

  if (posicoes.length === 1) return { pos: posicoes[0] };
  if (posicoes.length === 0) {
    return {
      erro: `ação aponta para "${ref}", que não existe na cena. ` +
        `Posições: ${Object.keys(comp).join(', ')}. ` +
        `Objetos: ${Object.values(comp).map((o) => o && o.object).join(', ')}`,
    };
  }
  return {
    erro: `ação aponta para "${ref}", que aparece ${posicoes.length} vezes (${posicoes.join(', ')}). ` +
      `Use o nome da posição para dizer qual.`,
  };
}

function arrowHead(x, y, dir, seed) {
  const s = 18;
  const sign = dir === 'left' ? -1 : 1;
  return linePath(
    [
      [x - sign * s, y - s * 0.7],
      [x, y],
      [x - sign * s, y + s * 0.7],
    ],
    seed
  );
}

/**
 * Renderiza uma cena em SVG.
 * @returns {{svg: string, warnings: string[], unknownObjects: string[]}}
 */
export function renderScene(scene, sceneId) {
  const warnings = [];
  const unknownObjects = [];
  const boxes = {};
  let body = '';
  let i = 0;

  // 1. objetos, indexados por POSIÇÃO: duas fotos na mesma cena são comuns,
  // e indexar por nome de objeto faria a segunda apagar a primeira.
  const usadas = Object.keys(scene.composition);
  for (const [pos, o] of Object.entries(scene.composition)) {
    const scale = Math.max(0.5, Math.min(2, Number(o.scale ?? 1)));
    const b = boxFor(pos, scale, usadas);
    boxes[pos] = b;
    if (!hasPrimitive(o.object)) unknownObjects.push(o.object);
    let label = o.label;
    if (label && label.length > 24) {
      warnings.push(`label "${label}" truncado para 24 caracteres`);
      label = label.slice(0, 23) + '…';
    }
    body += drawObject(o.object, {
      box: b,
      seed: seedFor(sceneId, i),
      label,
      state: o.state,
    });
    i += 1;
  }

  // 2. setas
  for (const act of scene.actions || []) {
    const kind = ARROW_KINDS.find((k) => k in act);
    if (!kind) continue;
    const { from, to, label } = act[kind];
    const rf = resolveRef(scene, from);
    const rt = resolveRef(scene, to);
    if (rf.erro || rt.erro) {
      warnings.push(rf.erro || rt.erro);
      continue;
    }
    const a = boxes[rf.pos];
    const b = boxes[rt.pos];
    if (!a || !b) continue;
    const leftToRight = a.cx <= b.cx;
    const p1 = edge(a, leftToRight ? 'right' : 'left');
    const p2 = edge(b, leftToRight ? 'left' : 'right');
    const gap = 14;
    const x1 = p1.x + (leftToRight ? gap : -gap);
    const x2 = p2.x - (leftToRight ? gap : -gap);
    const seed = seedFor(sceneId, 100 + i);
    body += line(x1, p1.y, x2, p2.y, seed, { strokeWidth: 2 });
    body += arrowHead(x2, p2.y, leftToRight ? 'right' : 'left', seed + 1);
    if (label) {
      body += text(label, (x1 + x2) / 2, Math.min(p1.y, p2.y) - 18, 22);
    }
    i += 1;
  }

  // 3. annotation no rodapé
  const notes = (scene.annotation || []).slice(0, 2);
  if (notes.length > 2) warnings.push('annotation tem mais de 2 linhas, o excedente foi cortado');
  const f = footerBox();
  notes.forEach((n, k) => {
    body += text(n, STAGE.w / 2, f.y + 34 + k * 34, 25);
  });
  if (notes.length) {
    body += line(f.x, f.y - 6, f.x + f.w, f.y - 6, seedFor(sceneId, 900), {
      strokeWidth: 1.2,
      roughness: 0.9,
    });
  }

  if (Object.keys(scene.composition).length > 5) {
    warnings.push('cena com mais de 5 objetos: quadro de conceito costuma parar de comunicar');
  }

  const svg =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<!-- visual_intent: ${escapeXml(scene.visual_intent)} -->\n` +
    `<!-- concept_reference: ${escapeXml(JSON.stringify(scene.concept_reference))} -->\n` +
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${STAGE.w} ${STAGE.h}" width="${STAGE.w}" height="${STAGE.h}">\n` +
    `<rect x="0" y="0" width="${STAGE.w}" height="${STAGE.h}" fill="#ffffff"/>\n` +
    `<text x="${STAGE.pad}" y="52" font-family="Segoe UI, Helvetica, Arial, sans-serif" font-size="24" fill="${INK}" opacity="0.55">${escapeXml(String(scene.slide).padStart(2, '0'))}</text>\n` +
    body +
    `\n</svg>\n`;

  return { svg, warnings, unknownObjects };
}
