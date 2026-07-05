import { join } from 'path';
import { existsSync, mkdirSync, cpSync, readFileSync, writeFileSync } from 'fs';
import { MIRA_ROOT, PROJECT_ROOT, loadConfig, saveConfig } from '../utils/paths.js';
import { applyOffline } from '../../templates/vendor/offline-core.mjs';

const DECKS = ['aula-capitulo', 'pitch-projeto', 'demo-tecnica', 'sandeco-just-animation-template'];
const THEMES = ['mira-dark', 'light-minimal', 'corporate-blue', 'neon-emerald'];

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
  //    Exceção: o template de animação pura é multicor e theme-agnóstico. A cor
  //    dele vive na paleta do <script>, não numa cor única do tema. Manter o
  //    bloco @MIRA:THEME neutro do template e ignorar --theme evita que mira-dark
  //    (laranja + glass) imponha uma cor predominante a uma animação multicor.
  const animationOnly = deck === 'sandeco-just-animation-template';
  if (!animationOnly) {
    const themeCss = readFileSync(join(MIRA_ROOT, 'templates', 'themes', `${theme}.css`), 'utf8');
    const baseCss = readFileSync(join(MIRA_ROOT, 'templates', 'themes', 'base.css'), 'utf8');
    html = html.replace(
      /\/\* @MIRA:THEME:START \*\/[\s\S]*?\/\* @MIRA:THEME:END \*\//,
      '/* @MIRA:THEME:START */\n' + themeCss + '\n\n' + baseCss + '\n/* @MIRA:THEME:END */'
    );
  }

  writeFileSync(join(dest, 'index.html'), html, 'utf8');

  // 2.5. Copia as ferramentas de autoria para <deck>/mira/ (diretiva: a raiz do
  //      deck fica só com index.html e launchers; JS de apoio vive em mira/).
  //      Os templates já referenciam <script src="mira/mira-*.js">.
  //      - mira-edit.js: modo edição (reordenar slides) — tecla E
  //      - mira-draw.js: telestrator (desenhar sobre o slide) — tecla P
  //      - mira-tactics.js: quadro tático (peças arrastáveis) — tecla T
  mkdirSync(join(dest, 'mira'), { recursive: true });
  for (const tool of ['mira-edit.js', 'mira-draw.js', 'mira-tactics.js']) {
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
  config.decks = config.decks ?? [];
  config.decks.push({ name, template: deck, theme, createdAt: new Date().toISOString() });
  saveConfig(config);

  console.log(`\n  Deck "${name}" criado em decks/${name}/index.html`);
  console.log(`  Template: ${deck} | Tema: ${animationOnly ? 'animação multicor (theme-agnóstico)' : theme}`);
  if (offline) {
    console.log(`  Offline: libs locais em assets/vendor/ (${offline.copied} arquivos) — abre por file:// sem internet.`);
  } else {
    console.log('  Aviso: bundle offline nao encontrado (templates/vendor/). Rode "npx mira-animator update".');
  }
  console.log('  Abra no navegador ou peça ao agente para preencher com uma fonte vinculada.\n');
}
