/**
 * Executor do storyboard: pasta com cenas .json → .svg + .png + folha de contato.
 *
 * Uso: node lib/storyboard/build.mjs <pasta-storyboard> [--no-png]
 *
 * A pasta é a `storyboard/` na raiz de um deck. Cada opção concorrente é uma
 * subpasta dentro de uma versão:
 *   storyboard/concept-v01/option-a-xerox/slide-01.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { renderScene, validateScene } from './render.mjs';
import { STAGE } from './geometry.mjs';
import { folhaDeContato } from './sheet.mjs';

const require = createRequire(import.meta.url);
const { rasterize } = require('./rasterize.cjs');

/** Acha toda cena .json sob a raiz, em qualquer profundidade. */
function acharCenas(raiz) {
  const out = [];
  (function anda(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) anda(p);
      else if (e.isFile() && e.name.endsWith('.json') && e.name !== 'option.json') out.push(p);
    }
  })(raiz);
  return out.sort();
}

export async function build(raiz, { png = true } = {}) {
  if (!fs.existsSync(raiz)) throw new Error(`pasta não encontrada: ${raiz}`);

  const arquivos = acharCenas(raiz);
  const rel = (p) => path.relative(raiz, p).replace(/\\/g, '/');
  const relatorio = {
    cenas: 0, svg: [], png: [], erros: [], avisos: [], desconhecidos: new Set(), pngFalhou: [],
  };
  const paraRasterizar = [];
  const quadros = [];

  for (const arq of arquivos) {
    const id = path.basename(arq, '.json');
    let cena;
    try {
      cena = JSON.parse(fs.readFileSync(arq, 'utf8'));
    } catch (e) {
      relatorio.erros.push(`${rel(arq)}: JSON inválido, ${e.message}`);
      continue;
    }

    const errs = validateScene(cena, rel(arq));
    if (errs.length) {
      relatorio.erros.push(...errs);
      continue; // não desenha quadro incompleto
    }

    const sceneId = `${rel(path.dirname(arq))}/${id}`;
    const { svg, warnings, unknownObjects } = renderScene(cena, sceneId);
    const svgPath = arq.replace(/\.json$/, '.svg');
    fs.writeFileSync(svgPath, svg, 'utf8');

    relatorio.cenas += 1;
    relatorio.svg.push(rel(svgPath));
    warnings.forEach((w) => relatorio.avisos.push(`${rel(arq)}: ${w}`));
    unknownObjects.forEach((u) => relatorio.desconhecidos.add(u));

    quadros.push({
      opcao: rel(path.dirname(arq)),
      slide: cena.slide,
      intent: cena.visual_intent,
      explicacao: cena.explicacao,
      annotation: cena.annotation,
      composition: cena.composition,
      concept_reference: cena.concept_reference,
      svg,
      png: rel(arq.replace(/\.json$/, '.png')),
    });
    paraRasterizar.push({ svg, out: arq.replace(/\.json$/, '.png'), id: sceneId.replace(/[\\/]/g, '_') });
  }

  if (png && paraRasterizar.length) {
    const r = await rasterize(paraRasterizar, { width: STAGE.w, height: STAGE.h });
    if (r.indisponivel) {
      relatorio.pngFalhou.push(
        'Chrome ou puppeteer não alcançáveis: os SVG e a folha de contato foram gerados, o PNG não. ' +
        'Defina MIRA_CHROME ou instale o Chrome.'
      );
    } else {
      relatorio.png = r.ok.map((p) => rel(p));
      r.falhas.forEach((f) => relatorio.pngFalhou.push(`${f.id}: ${f.motivo}`));
    }
  }

  // Pasta sem nenhuma cena não gera folha de contato: uma folha vazia parece
  // storyboard sem quadros, quando o que houve foi não achar cena nenhuma.
  if (quadros.length) {
    const metas = {};
    for (const nome of new Set(quadros.map((q) => q.opcao))) {
      const meta = path.join(raiz, nome, 'option.json');
      if (!fs.existsSync(meta)) continue;
      try {
        metas[nome] = JSON.parse(fs.readFileSync(meta, 'utf8'));
      } catch (e) {
        relatorio.avisos.push(`${nome}/option.json inválido, ignorado: ${e.message}`);
      }
    }
    fs.writeFileSync(path.join(raiz, 'index.html'), folhaDeContato(quadros, metas), 'utf8');
    relatorio.folha = path.join(raiz, 'index.html');
  }
  relatorio.desconhecidos = [...relatorio.desconhecidos];
  return relatorio;
}

// CLI
if (process.argv[1] && process.argv[1].endsWith('build.mjs')) {
  const raiz = process.argv[2];
  const png = !process.argv.includes('--no-png');
  if (!raiz) {
    console.error('uso: node lib/storyboard/build.mjs <pasta-storyboard> [--no-png]');
    process.exit(2);
  }
  build(path.resolve(raiz), { png })
    .then((r) => {
      console.log(`cenas: ${r.cenas} | svg: ${r.svg.length} | png: ${r.png.length}`);
      if (r.desconhecidos.length) console.log('objetos sem primitiva:', r.desconhecidos.join(', '));
      r.avisos.forEach((a) => console.log('aviso:', a));
      r.pngFalhou.forEach((a) => console.log('png:', a));
      r.erros.forEach((e) => console.log('ERRO:', e));
      if (r.folha) console.log('folha de contato:', r.folha);
      else console.log('nenhuma cena .json encontrada em', path.resolve(raiz));
      process.exit(r.erros.length ? 1 : 0);
    })
    .catch((e) => { console.error(e.message); process.exit(1); });
}
