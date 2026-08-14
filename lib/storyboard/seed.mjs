/**
 * Ponto único de derivação de semente do storyboard.
 *
 * Medido em 2026-08-14: `rough.generator()` SEM `seed` produz saída diferente a
 * cada chamada. O RNF-05 (mesma cena, mesmo SVG byte a byte) sustenta o
 * versionamento inteiro do /mira-storyboard, então nenhuma primitiva pode
 * chamar o Rough sem semente.
 *
 * Por isso a derivação vive aqui e só aqui: uma primitiva que esqueça de pedir
 * semente quebra o determinismo sem erro nenhum, e o defeito só apareceria como
 * diff fantasma entre duas versões do storyboard.
 */

/** FNV-1a 32 bits. Determinístico, sem dependência, sem relógio. */
function hash32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/**
 * Semente de um elemento.
 * @param {string} sceneId  identidade estável da cena (nome do arquivo sem extensão)
 * @param {number} index    índice do elemento dentro da cena
 * @returns {number} inteiro positivo, estável entre execuções e máquinas
 */
export function seedFor(sceneId, index) {
  if (typeof sceneId !== 'string' || !sceneId) {
    throw new Error('seedFor: sceneId obrigatório e não vazio');
  }
  if (!Number.isInteger(index) || index < 0) {
    throw new Error(`seedFor: index deve ser inteiro >= 0, veio ${index}`);
  }
  // O +1 evita semente 0, que o Rough trata como "sem semente".
  return (hash32(`${sceneId}#${index}`) % 2147483646) + 1;
}
