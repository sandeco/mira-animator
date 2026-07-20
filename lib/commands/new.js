import { join } from 'path';
import { existsSync, mkdirSync, cpSync, readFileSync, writeFileSync, readdirSync } from 'fs';
import { MIRA_ROOT, PROJECT_ROOT, loadConfig, saveConfig } from '../utils/paths.js';
import { applyOffline } from '../../templates/vendor/offline-core.mjs';
import { ensureResponsive } from '../utils/responsive.js';

// Lidos do disco, não fixos no código: um template gerado pelo /mira-image-template e copiado
// para templates/decks/ passa a valer na hora, sem editar esta lista. O base.css e o
// responsive.css não são temas, são a camada compartilhada.
const NAO_SAO_TEMAS = new Set(['base', 'responsive']);

function listarDecks() {
  const dir = join(MIRA_ROOT, 'templates', 'decks');
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isDirectory() && existsSync(join(dir, d.name, 'index.html')))
    .map(d => d.name)
    .sort();
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
    console.error(`  Decks:  ${DECKS.join(', ')}`);
    console.error(`  Themes: ${THEMES.join(', ')}\n`);
    process.exit(1);
  }

  const deck = flags.deck ?? 'aula-capitulo';
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
  //    Exceção: os templates de animação de tela cheia são theme-agnósticos e
  //    mantêm o próprio bloco @MIRA:THEME, ignorando --theme.
  //    - sandeco-just-animation-template: multicor, a cor vive na paleta do <script>.
  //    - mira-perfect: uma cor de marca única; CSS e paleta JS leem as variáveis
  //      do próprio bloco (--mira-primary etc.), então injetar base.css/tema de
  //      card quebraria o layout (replay-btn, fontes) sem ganhar nada.
  const animationOnly = deck === 'sandeco-just-animation-template' || deck === 'mira-perfect';
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
