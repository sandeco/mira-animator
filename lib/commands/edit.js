import { join, resolve, dirname, basename } from 'path';
import { existsSync, statSync, readFileSync, writeFileSync, cpSync, mkdirSync, rmSync } from 'fs';
import { MIRA_ROOT, PROJECT_ROOT } from '../utils/paths.js';
import { ensureResponsive } from '../utils/responsive.js';

/*
  npx mira-animator edit <deck>

  Aplica o modo edição (reordenar slides) num deck que já existe, sem
  regerá-lo. Copia mira-edit.js pra pasta do deck e injeta o
  <script src="mira-edit.js"> antes de </body> caso ainda não exista.

  <deck> pode ser:
    - o nome do deck   (procura em decks/<nome>/index.html)
    - a pasta do deck  (usa <pasta>/index.html)
    - o próprio .html
*/
export default async function editDeck(args) {
  const positional = args.filter(a => !a.startsWith('--'));
  const target = positional[0];

  if (!target) {
    console.error('\n  Uso: npx mira-animator edit <deck>');
    console.error('  <deck> = nome do deck, pasta do deck ou caminho do index.html\n');
    process.exit(1);
  }

  // resolve o index.html do deck
  const abs = resolve(PROJECT_ROOT, target);
  let indexPath;
  if (existsSync(abs) && statSync(abs).isFile() && /\.html?$/i.test(abs)) {
    indexPath = abs;
  } else if (existsSync(abs) && statSync(abs).isDirectory()) {
    indexPath = join(abs, 'index.html');
  } else {
    indexPath = join(PROJECT_ROOT, 'decks', target, 'index.html');
  }

  if (!existsSync(indexPath)) {
    console.error(`\n  Não encontrei o deck: ${indexPath}`);
    console.error('  Passe o nome do deck (decks/<nome>) ou o caminho do index.html.\n');
    process.exit(1);
  }

  const deckDir = dirname(indexPath);

  // Ferramentas de autoria embutidas no deck (mesmo padrão de distribuição):
  //  - mira-edit.js: modo edição (reordenar slides) — tecla E
  //  - mira-edit-free.js: edição livre estilo Canva — tecla E
  //  - mira-draw.js: telestrator (desenhar sobre o slide) — tecla P
  //
  // A ORDEM DESTE ARRAY É A ORDEM DE INJEÇÃO das tags. É a ordem canônica do CLAUDE.md:
  // mira-edit.js -> mira-edit-free.js -> mira-draw.js (o edit-free logo depois do edit).
  const tools = [
    { file: 'mira-edit.js', comment: 'Modo edição (reordenar slides): tecla E ou ?edit=1' },
    { file: 'mira-edit-free.js', comment: 'Edição livre (mover/redimensionar/rotacionar/duplicar/excluir/texto): tecla E' },
    { file: 'mira-draw.js', comment: 'Telestrator (desenhar sobre o slide): tecla P ou ?draw=1' }
  ];

  // 1. copia os scripts para <deck>/mira/ (diretiva: a raiz do deck fica só
  //    com index.html e launchers). Sempre por cima, pra atualizar.
  mkdirSync(join(deckDir, 'mira'), { recursive: true });
  for (const t of tools) {
    const src = join(MIRA_ROOT, 'templates', 'authoring', t.file);
    if (!existsSync(src)) {
      console.error(`\n  Script não encontrado em templates/authoring/${t.file}.`);
      console.error('  Rode "npx mira-animator update" e tente de novo.\n');
      process.exit(1);
    }
    cpSync(src, join(deckDir, 'mira', t.file));
  }

  // 2. injeta os <script src="mira/...">; decks antigos com o JS na raiz são
  //    migrados (tag reapontada e cópia da raiz removida)
  let html = readFileSync(indexPath, 'utf8');
  const injectedList = [];
  let migrated = false;
  for (const t of tools) {
    const rootTag = new RegExp(`src=["']${t.file.replace('.', '\\.')}["']`);
    if (rootTag.test(html)) {
      html = html.replace(rootTag, `src="mira/${t.file}"`);
      migrated = true;
      const rootCopy = join(deckDir, t.file);
      if (existsSync(rootCopy)) rmSync(rootCopy);
      continue;
    }
    if (new RegExp(`mira/${t.file.replace('.', '\\.')}`).test(html)) continue;
    const tag =
      `    <!-- ${t.comment} -->\n` +
      `    <script src="mira/${t.file}" defer></script>\n`;
    if (/<\/body>/i.test(html)) {
      html = html.replace(/<\/body>/i, tag + '</body>');
    } else {
      html += '\n' + tag;
    }
    injectedList.push(t.file);
  }
  // 2b. normaliza a ORDEM das três tags para a canônica do CLAUDE.md
  //     (mira-edit -> mira-edit-free -> mira-draw). Um deck legado costuma trazê-las
  //     fora de ordem; migrar sem reordenar deixaria o defeito de pé. Idempotente.
  let reordered = false;
  {
    const tagRe = /([ \t]*<!--[^\n]*-->\n)?[ \t]*<script src="mira\/(mira-edit|mira-edit-free|mira-draw)\.js" defer><\/script>\n/g;
    const achadas = [...html.matchAll(tagRe)];
    if (achadas.length === 3) {
      const atual = achadas.map(m => m[2]);
      const canonica = ['mira-edit', 'mira-edit-free', 'mira-draw'];
      if (atual.join() !== canonica.join()) {
        const porNome = Object.fromEntries(achadas.map(m => [m[2], m[0]]));
        const inicio = achadas[0].index;
        html = html.replace(tagRe, '');
        html = html.slice(0, inicio) + canonica.map(n => porNome[n]).join('') + html.slice(inicio);
        reordered = true;
      }
    }
  }

  // 3. retrofita a camada de responsividade (reflow mobile-first) em decks
  //    legados: injeta o bloco @MIRA:RESPONSIVE no <style> e conserta o
  //    <meta viewport>. Idempotente — não duplica se já estiver lá.
  const resp = ensureResponsive(html);
  html = resp.html;

  const injected = injectedList.length > 0;
  if (injected || migrated || reordered || resp.changed) writeFileSync(indexPath, html, 'utf8');

  const rel = 'decks/' + basename(deckDir);
  console.log(`\n  Ferramentas de autoria aplicadas em ${indexPath.startsWith(join(PROJECT_ROOT, 'decks')) ? rel : deckDir}`);
  console.log(`  Scripts: mira-edit.js + mira-draw.js + mira-edit-free.js copiados para ${basename(deckDir)}/mira/`);
  const tagsMsg = injected
    ? 'injetadas antes de </body> (' + injectedList.join(', ') + ')'
    : migrated
      ? 'migradas da raiz para mira/ (as cópias soltas na raiz foram removidas)'
      : reordered
        ? 'reordenadas para a ordem canônica (edit, edit-free, draw)'
        : 'já estavam referenciadas (só atualizei os scripts)';
  console.log(`  Tags:    ${tagsMsg}`);
  console.log(`  Mobile:  ${resp.action === 'noop' && !resp.viewportFixed ? 'camada responsiva já presente' : 'camada responsiva ' + (resp.action === 'updated' ? 'atualizada' : 'injetada') + (resp.viewportFixed ? ' + meta viewport corrigido' : '')}`);
  console.log('\n  Abra o deck e use: "E" reordena slides · "P" desenha por cima.');
  console.log('  Para salvar a ordem sem diálogo, sirva com:');
  console.log(`    node lib/mira-serve.js ${deckDir}\n`);
}
