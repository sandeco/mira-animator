/**
 * Folha de contato: um HTML único, tudo inline, abre por `file://`.
 *
 * Duas decisões de layout, e as duas vêm de um defeito observado:
 *
 * 1. **Uma opção por bloco, empilhadas, com um "OU" entre elas.** A primeira
 *    versão punha as opções concorrentes em colunas paralelas, e ler na
 *    horizontal fundia as duas histórias numa só. Opção concorrente é
 *    alternativa excludente, não continuação: o layout tem que dizer isso
 *    sozinho, antes de qualquer legenda.
 * 2. **Texto ao lado do quadro, centrado na vertical com a cena.** O quadro
 *    mostra a relação entre os objetos; o texto explica o que está acontecendo
 *    e a que parte do conceito aquilo responde. Alinhado ao topo, o texto
 *    flutuava longe da cena que descreve.
 */
import { escapeXml } from './sketch.mjs';

const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F'];

function semDeclaracaoXml(svg) {
  return svg.replace(/<\?xml[^>]*\?>\s*/, '');
}

/** `option-a-xerox` vira `Xerox`, para o caso de não haver `option.json`. */
function rotuloDaPasta(nome) {
  const base = nome.split('/').pop() || nome;
  return base
    .replace(/^option-[a-z]-/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase());
}

/**
 * `left`, `top-right` viram algo legível na linha de "em cena".
 * A preposição vem junto porque "à" não serve para todas: seria "à centro".
 */
const POS_PT = {
  left: 'à esquerda', center: 'ao centro', right: 'à direita',
  top: 'no topo', bottom: 'na base',
  'top-left': 'no topo à esquerda', 'top-right': 'no topo à direita',
  'bottom-left': 'na base à esquerda', 'bottom-right': 'na base à direita',
};

function emCena(quadro) {
  const partes = [];
  for (const [pos, o] of Object.entries(quadro.composition || {})) {
    const nome = o.label || o.object;
    const estado = o.state
      ? ' (' + Object.entries(o.state).map(([k, v]) => `${k} ${v}`).join(', ') + ')'
      : '';
    partes.push(`${escapeXml(nome)}${escapeXml(estado)} ${escapeXml(POS_PT[pos] || pos)}`);
  }
  return partes.join(', ');
}

/**
 * O painel explica a cena, sem virar parede de texto.
 *
 * A `explicacao` é o campo que carrega a explicação de verdade, em 1 a 3
 * frases, escrito por quem monta a cena. Sem ele o painel cai para a
 * `annotation`, que é curta demais para explicar sozinha: foi o que o autor
 * apontou em 2026-08-14, depois de eu ter cortado demais.
 */
function bloco(quadro) {
  const ref = Object.values(quadro.concept_reference || {}).join(' · ');
  const explicacao = quadro.explicacao || (quadro.annotation || []).join(' ');
  const cena = emCena(quadro);

  return `<li class="quadro">
  <div class="img">${semDeclaracaoXml(quadro.svg)}</div>
  <div class="txt">
    <span class="num">${String(quadro.slide).padStart(2, '0')}</span>
    <h3>${escapeXml(quadro.intent)}</h3>
    ${explicacao ? `<p class="expl">${escapeXml(explicacao)}</p>` : ''}
    ${cena ? `<p class="cena"><span>Em cena</span> ${cena}</p>` : ''}
    ${ref ? `<p class="ref">${escapeXml(ref)}</p>` : ''}
  </div>
</li>`;
}

function opcao(nome, quadros, meta, i, total) {
  const letra = LETRAS[i] || String(i + 1);
  const titulo = escapeXml(meta.titulo || rotuloDaPasta(nome));
  const linhas = [];
  if (meta.metafora) linhas.push(`<div><dt>Metáfora</dt><dd>${escapeXml(meta.metafora)}</dd></div>`);
  if (meta.representa) linhas.push(`<div><dt>Representa</dt><dd>${escapeXml(meta.representa)}</dd></div>`);
  if (meta.distorce) linhas.push(`<div><dt>O que distorce</dt><dd>${escapeXml(meta.distorce)}</dd></div>`);

  const corpo = quadros.sort((a, b) => a.slide - b.slide).map(bloco).join('');
  const separador =
    i < total - 1
      ? '<div class="ou"><span>OU</span></div>'
      : '';

  return `<article class="opcao">
  <header>
    <span class="tag">Opção ${letra}</span>
    <h2>${titulo}</h2>
    <p class="pasta">${escapeXml(nome)}</p>
    ${linhas.length ? `<dl>${linhas.join('')}</dl>` : ''}
  </header>
  <ol class="quadros">${corpo}</ol>
</article>${separador}`;
}

/**
 * @param {Array} quadros  {opcao, slide, intent, svg, composition, annotation, concept_reference}
 * @param {Object} metas   { '<pasta da opção>': {titulo, metafora, representa, distorce} }
 */
export function folhaDeContato(quadros, metas = {}) {
  const porOpcao = new Map();
  for (const q of quadros) {
    if (!porOpcao.has(q.opcao)) porOpcao.set(q.opcao, []);
    porOpcao.get(q.opcao).push(q);
  }
  const nomes = [...porOpcao.keys()].sort();
  const corpo = nomes
    .map((n, i) => opcao(n, porOpcao.get(n), metas[n] || {}, i, nomes.length))
    .join('');

  const chamada =
    nomes.length > 1
      ? `<p class="sub"><b>${nomes.length} caminhos diferentes para a mesma ideia, não uma história em ${nomes.length} partes.</b> Escolha um, peça as mudanças que quiser nele, ou peça um caminho novo.</p>`
      : '<p class="sub">Rascunho para validar significado, não acabamento. Peça as mudanças em linguagem natural.</p>';

  return `<!doctype html><meta charset="utf-8"><title>Concept Storyboard</title>
<style>
  :root{color-scheme:light}
  *{box-sizing:border-box}
  body{margin:0;padding:32px 28px 64px;background:#f2f2f0;color:#141414;
       font-family:Segoe UI,Helvetica,Arial,sans-serif;line-height:1.5}
  h1{font-size:22px;margin:0 0 8px;letter-spacing:-.01em}
  p.sub{margin:0 0 32px;color:#555;font-size:14px;max-width:70ch}
  p.sub b{color:#141414}

  .opcao{background:#fff;border:1px solid #d8d8d4;border-radius:10px;
         padding:24px 24px 8px;margin:0 auto;max-width:1180px}
  .opcao header{border-bottom:2px solid #141414;padding-bottom:16px;margin-bottom:24px}
  .tag{display:inline-block;background:#141414;color:#fff;font-size:11px;
       letter-spacing:.14em;text-transform:uppercase;padding:4px 10px;border-radius:3px}
  .opcao h2{font-size:26px;margin:12px 0 2px;letter-spacing:-.02em}
  .pasta{margin:0;color:#8a8a86;font-size:12px;font-family:Consolas,monospace}
  .opcao dl{display:flex;flex-wrap:wrap;gap:8px 40px;margin:16px 0 0}
  .opcao dl div{max-width:46ch}
  .opcao dt{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#8a8a86}
  .opcao dd{margin:2px 0 0;font-size:14px}

  .ou{display:flex;align-items:center;gap:16px;max-width:1180px;margin:36px auto}
  .ou::before,.ou::after{content:"";flex:1;height:1px;background:#c9c9c4}
  .ou span{font-size:12px;letter-spacing:.22em;color:#8a8a86;font-weight:600}

  ol.quadros{list-style:none;margin:0;padding:0}
  .quadro{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(260px,1fr);
          gap:32px;align-items:center;padding:0 0 28px;margin-bottom:28px;
          border-bottom:1px solid #ececea}
  .quadro:last-child{border-bottom:0}
  .img{border:1px solid #e2e2de;border-radius:6px;overflow:hidden;background:#fff}
  .img svg{display:block;width:100%;height:auto}

  .txt .num{display:inline-block;font-size:12px;font-family:Consolas,monospace;
            color:#8a8a86;border:1px solid #d8d8d4;border-radius:3px;padding:1px 7px}
  .txt h3{font-size:17px;margin:10px 0 12px;letter-spacing:-.01em;line-height:1.35}
  .expl{margin:0 0 14px;font-size:14px;color:#3a3a3a;line-height:1.6}
  .cena{margin:0;font-size:13px;color:#5a5a56;line-height:1.55}
  .cena span{display:block;font-size:10.5px;letter-spacing:.11em;
             text-transform:uppercase;color:#a0a09c;margin-bottom:3px}
  .ref{margin:14px 0 0;font-family:Consolas,monospace;font-size:11px;color:#b4b4b0;
       word-break:break-word}

  @media (max-width:900px){ .quadro{grid-template-columns:1fr} }
</style>
<h1>Concept Storyboard</h1>
${chamada}
${corpo}`;
}
