import { join } from 'path';
import { existsSync, mkdirSync, cpSync, readFileSync, writeFileSync, readdirSync } from 'fs';
import { MIRA_ROOT, PROJECT_ROOT, loadConfig, saveConfig } from '../utils/paths.js';
import { applyOffline } from '../../templates/vendor/offline-core.mjs';
import { ensureResponsive } from '../utils/responsive.js';

// Lidos do disco, não fixos no código: um template gerado pelo /mira-image-template e copiado
// para templates/decks/ passa a valer na hora, sem editar esta lista. O base.css e o
// responsive.css não são temas, são a camada compartilhada.
const NAO_SAO_TEMAS = new Set(['base', 'responsive']);

// o template padrão do Mira: aparece SEMPRE em primeiro na lista, marcado
// como recomendado. Lista alfabética esconderia a recomendação no meio.
export const DECK_PADRAO = 'mira-default';

function listarDecks() {
  const dir = join(MIRA_ROOT, 'templates', 'decks');
  if (!existsSync(dir)) return [];
  const todos = readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isDirectory() && existsSync(join(dir, d.name, 'index.html')))
    .map(d => d.name)
    .sort();
  return todos.includes(DECK_PADRAO)
    ? [DECK_PADRAO, ...todos.filter(n => n !== DECK_PADRAO)]
    : todos;
}

// rótulo para a lista impressa: o padrão vem anotado
function rotularDecks(decks) {
  return decks.map(n => (n === DECK_PADRAO ? n + ' (recomendado)' : n)).join(', ');
}

function listarThemes() {
  const dir = join(MIRA_ROOT, 'templates', 'themes');
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter(f => f.endsWith('.css'))
    .map(f => f.slice(0, -4))
    .filter(n => !NAO_SAO_TEMAS.has(n))
    .sort();
}

const DECKS = listarDecks();
const THEMES = listarThemes();

export default async function newDeck(args) {
  const config = loadConfig();
  if (!config) {
    console.error('\n  Mira não está instalado nesta pasta. Execute "npx mira-animator install" primeiro.\n');
    process.exit(1);
  }

  const positional = args.filter(a => !a.startsWith('--'));
  const flags = Object.fromEntries(
    args.filter(a => a.startsWith('--')).map(a => {
      const [k, v] = a.slice(2).split('=');
      return [k, v ?? true];
    })
  );

  const name = positional[0];
  if (!name) {
    console.error('\n  Uso: npx mira-animator new <nome> [--deck=...] [--theme=...]\n');
    console.error(`  Decks:  ${rotularDecks(DECKS)}`);
    console.error(`  Themes: ${THEMES.join(', ')}\n`);
    process.exit(1);
  }

  // mira-default: título em cima e animação ocupando o slide inteiro. É o
  // padrão do Mira; os outros templates continuam disponíveis via --deck.
  const deck = flags.deck ?? DECK_PADRAO;
  const theme = flags.theme ?? config.defaultTheme ?? 'mira-dark';

  if (!DECKS.includes(deck)) {
    console.error(`\n  Deck desconhecido: "${deck}". Opções: ${DECKS.join(', ')}\n`);
    process.exit(1);
  }
  if (!THEMES.includes(theme)) {
    console.error(`\n  Tema desconhecido: "${theme}". Opções: ${THEMES.join(', ')}\n`);
    process.exit(1);
  }

  const dest = join(PROJECT_ROOT, 'decks', name);
  if (existsSync(dest)) {
    console.error(`\n  O deck "${name}" já existe em decks/${name}.\n`);
    process.exit(1);
  }

  mkdirSync(dest, { recursive: true });

  // 1. Copia o esqueleto do deck
  const deckSrc = join(MIRA_ROOT, 'templates', 'decks', deck, 'index.html');
  let html = readFileSync(deckSrc, 'utf8');

  // 2. Injeta o tema escolhido (inline, para o deck ser auto-contido).
  //    Exceção: o animation-pure é theme-agnóstico e mantém o próprio bloco
  //    @MIRA:THEME, ignorando --theme, porque é multicor: a cor vive na paleta
  //    do <script>, não numa primária única.
  //    O mira-default NÃO entra aqui: ele aceita tema de propósito (é o padrão
  //    do Mira, trocar de tema tem que funcionar). Ele neutraliza no próprio
  //    CSS o que o base.css impõe ao palco (altura fixa, glow, cantos).
  const animationOnly = deck === 'sandeco-just-animation-template';
  if (!animationOnly) {
    const themeCss = readFileSync(join(MIRA_ROOT, 'templates', 'themes', `${theme}.css`), 'utf8');
    const baseCss = readFileSync(join(MIRA_ROOT, 'templates', 'themes', 'base.css'), 'utf8');
    html = html.replace(
      /\/\* @MIRA:THEME:START \*\/[\s\S]*?\/\* @MIRA:THEME:END \*\//,
      '/* @MIRA:THEME:START */\n' + themeCss + '\n\n' + baseCss + '\n/* @MIRA:THEME:END */'
    );
  }

  // 2.1. Camada de responsividade (reflow mobile-first). Vale para TODO deck,
  //      inclusive o animation-only: é só reflow, não impõe cor nem tema.
  //      Garante que o slide 16:9 fique legível no celular sem mobile.html separado.
  html = ensureResponsive(html).html;

  writeFileSync(join(dest, 'index.html'), html, 'utf8');

  // 2.5. Copia as ferramentas de autoria para <deck>/mira/ (diretiva: a raiz do
  //      deck fica só com index.html e launchers; JS de apoio vive em mira/).
  //      Os templates já referenciam <script src="mira/mira-*.js">.
  //      - mira-edit.js: modo edição (reordenar slides) — tecla E
  //      - mira-draw.js: telestrator (desenhar sobre o slide) — tecla P
  //      - mira-edit-free.js: edição livre estilo Canva (mover/redimensionar/
  //        rotacionar/duplicar/excluir/editar texto) — junto do modo edição (E)
  mkdirSync(join(dest, 'mira'), { recursive: true });
  for (const tool of ['mira-edit.js', 'mira-draw.js', 'mira-edit-free.js']) {
    const src = join(MIRA_ROOT, 'templates', 'authoring', tool);
    if (existsSync(src)) cpSync(src, join(dest, 'mira', tool));
  }

  // 3. Modo offline por padrão: copia as libs vendoradas (já embarcadas na instalação)
  //    para decks/<name>/assets/vendor/ e aponta o <head> para elas. O deck nasce
  //    self-contained, abre por file:// e passa em firewall corporativo. Nada é
  //    baixado aqui — só copiado de templates/vendor/.
  const vendorSrc = join(MIRA_ROOT, 'templates', 'vendor');
  let offline = null;
  if (existsSync(vendorSrc)) {
    offline = applyOffline(dest, vendorSrc);
  }

  // 4. Registra no config
  // Substitui a entrada se o deck já constar (mesmo padrão do `link` com sources): recriar um
  // deck com o mesmo nome não pode deixar duas linhas contando histórias diferentes no config.
  config.decks = config.decks ?? [];
  const entrada = { name, template: deck, theme, createdAt: new Date().toISOString() };
  const idx = config.decks.findIndex(d => d.name === name);
  if (idx >= 0) config.decks[idx] = entrada;
  else config.decks.push(entrada);
  saveConfig(config);

  console.log(`\n  Deck "${name}" criado em decks/${name}/index.html`);
  console.log(`  Template: ${deck} | Tema: ${animationOnly ? 'próprio do template (theme-agnóstico)' : theme}`);
  if (offline) {
    console.log(`  Offline: libs locais em assets/vendor/ (${offline.copied} arquivos) — abre por file:// sem internet.`);
  } else {
    console.log('  Aviso: bundle offline nao encontrado (templates/vendor/). Rode "npx mira-animator update".');
  }
  console.log('  Abra no navegador ou peça ao agente para preencher com uma fonte vinculada.\n');
}
