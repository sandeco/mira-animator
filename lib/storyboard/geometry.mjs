/**
 * Posições nomeadas → coordenadas. O agente escreve `left`, `center`, `right`;
 * quem calcula pixel é aqui. É o que impede o agente de inventar coordenada.
 */

export const STAGE = {
  w: 1600,
  h: 900,
  pad: 80,          // margem interna
  footer: 140,      // faixa de baixo reservada para a annotation
};

/** Área útil do desenho, já descontando margem e rodapé. */
function canvas() {
  return {
    x: STAGE.pad,
    y: STAGE.pad,
    w: STAGE.w - STAGE.pad * 2,
    h: STAGE.h - STAGE.pad - STAGE.footer,
  };
}

const COLS = { left: 0, center: 1, right: 2 };
const ROWS = { top: 0, middle: 1, bottom: 2 };

/** Decompõe o nome da posição em coluna e linha. */
function axes(name) {
  const parts = String(name).split('-');
  let col = 'center';
  let row = 'middle';
  for (const p of parts) {
    if (p in COLS) col = p;
    else if (p in ROWS) row = p;
    else if (p === 'top' || p === 'bottom') row = p;
  }
  return { col, row };
}

export const POSITIONS = [
  'left', 'center', 'right',
  'top', 'bottom',
  'top-left', 'top-right',
  'bottom-left', 'bottom-right',
];

const ORDER_COL = ['left', 'center', 'right'];
const ORDER_ROW = ['top', 'middle', 'bottom'];

/**
 * A grade 3x3 é fixa, mas usar sempre as 9 células deixa quadro de 2 objetos
 * encostado num canto, com um terço vazio, e a cena inteira desequilibrada.
 * Então a grade colapsa: só as faixas realmente ocupadas dividem o espaço.
 *
 * Dois objetos em `left` e `center` viram duas faixas de metade cada, e não
 * as duas primeiras de três. Uma faixa só ocupa a altura toda, que é o que
 * faz o quadro preencher em vez de flutuar no meio.
 */
function trilhas(usadas, ordem, extrator) {
  const set = new Set(usadas.map((n) => extrator(axes(n))));
  const ativas = ordem.filter((k) => set.has(k));
  return ativas.length ? ativas : [ordem[1]];
}

/**
 * Caixa de um objeto numa posição nomeada.
 * @param {string} name       uma das POSITIONS
 * @param {number} scale      0.5 a 2.0
 * @param {string[]} usadas   todas as posições declaradas na cena
 */
export function boxFor(name, scale = 1, usadas = null) {
  if (!POSITIONS.includes(name)) {
    throw new Error(
      `posição desconhecida: "${name}". Disponíveis: ${POSITIONS.join(', ')}`
    );
  }
  const c = canvas();
  const { col, row } = axes(name);
  const todas = usadas && usadas.length ? usadas : [name];

  const cols = trilhas(todas, ORDER_COL, (a) => a.col);
  const rows = trilhas(todas, ORDER_ROW, (a) => a.row);

  const iCol = Math.max(0, cols.indexOf(col));
  const iRow = Math.max(0, rows.indexOf(row));

  const cellW = c.w / cols.length;
  const cellH = c.h / rows.length;

  // Folga horizontal maior quando há vizinho, porque a seta passa no meio.
  const fillW = cols.length > 1 ? 0.68 : 0.5;
  // Folga vertical para o label caber embaixo.
  const fillH = rows.length > 1 ? 0.78 : 0.62;

  const baseW = cellW * fillW * scale;
  const baseH = cellH * fillH * scale;

  const cx = c.x + cellW * (iCol + 0.5);
  const cy = c.y + cellH * (iRow + 0.5);

  return {
    x: cx - baseW / 2,
    y: cy - baseH / 2,
    w: baseW,
    h: baseH,
    cx,
    cy,
  };
}

/** Ponto de saída/entrada de seta na borda de uma caixa, no eixo horizontal. */
export function edge(box, side) {
  if (side === 'right') return { x: box.x + box.w, y: box.cy };
  if (side === 'left') return { x: box.x, y: box.cy };
  if (side === 'top') return { x: box.cx, y: box.y };
  return { x: box.cx, y: box.y + box.h };
}

/** Faixa da annotation, no rodapé. */
export function footerBox() {
  return {
    x: STAGE.pad,
    y: STAGE.h - STAGE.footer + 10,
    w: STAGE.w - STAGE.pad * 2,
    h: STAGE.footer - 30,
  };
}
