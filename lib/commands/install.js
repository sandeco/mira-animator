import { join, resolve } from 'path';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { detectEngines, ENGINES } from '../installer/detector.js';
import { checkExistingInstallation } from '../installer/validator.js';
import { runInstallPrompts } from '../installer/prompts.js';
import { Writer } from '../installer/writer.js';
import { buildManifest, saveManifest } from '../installer/manifest.js';
import { renderMiraLogo } from '../utils/banner.js';
import { loadConfig, saveConfig } from '../utils/paths.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');

function getVersion() {
  try {
    return JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')).version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

export default async function install() {
  const { default: chalk } = await import('chalk');
  const { default: ora } = await import('ora');

  const projectRoot = resolve(process.cwd());
  const version = getVersion();
  const DEFAULT_THEME = 'mira-dark'; // tema base fixo; a escolha de tema/template é por deck no /mira-new

  console.clear();
  console.log(chalk.hex('#FF904D')(renderMiraLogo()));
  console.log(chalk.gray('  Slides animados — direto das suas fontes.'));
  console.log('');
  console.log(chalk.bold('  Instalação'));

  const existing = checkExistingInstallation(projectRoot);
  if (existing.installed) {
    console.log(chalk.yellow(`\n  O Mira já está instalado (v${existing.version}) nesta pasta.`));
    const { default: inquirer } = await import('inquirer');
    const { proceed } = await inquirer.prompt([{
      prefix: '',
      type: 'confirm',
      name: 'proceed',
      message: '\nReinstalar / atualizar a configuração?',
      default: false,
    }]);
    if (!proceed) {
      console.log(chalk.gray('\n  Instalação cancelada.\n'));
      return;
    }
  }

  const detectedEngines = detectEngines(projectRoot);
  const detected = detectedEngines.filter(e => e.detected).map(e => e.name).join(', ');
  if (detected) console.log(chalk.gray(`\n  Engines detectadas: ${detected}`));

  const answers = await runInstallPrompts(detectedEngines);
  console.log('');

  const writer = new Writer(projectRoot);
  const selectedEngines = ENGINES.filter(e => answers.engines.includes(e.id));

  // 1. Agents por engine
  let spinner = ora('  Instalando agents...').start();
  for (const engine of selectedEngines) {
    for (const agentId of answers.agents) {
      writer.installSkill(agentId, engine.skillsDir);
    }
  }
  spinner.succeed(`  ${answers.agents.length} agents instalados para ${selectedEngines.length} engine(s)`);

  // 2. Arquivos de entrada (CLAUDE.md, AGENTS.md, ...)
  const vars = {
    PROJECT_NAME: answers.project_name,
    USER_NAME: answers.user_name,
    CHAT_LANGUAGE: answers.chat_language,
    DEFAULT_THEME,
  };
  const seenEntryFiles = new Set();
  for (const engine of selectedEngines) {
    if (!engine.entryFile || seenEntryFiles.has(engine.entryFile)) continue;
    seenEntryFiles.add(engine.entryFile);
    await writer.installEntryFile(engine, vars);
  }
  console.log(chalk.hex('#FF904D')('  ✔') + `  arquivos de entrada: ${[...seenEntryFiles].join(', ') || 'nenhum'}`);

  // 2b. Aviso de nova versão: script local + hook de início de sessão (Claude Code)
  writer.installRuntime();
  for (const engine of selectedEngines) writer.installSessionHook(engine.id);
  console.log(chalk.hex('#FF904D')('  ✔') + '  aviso de atualização ativado (.mira/bin/version-notice.js)');

  // 3. Templates + decks/
  spinner = ora('  Copiando templates...').start();
  writer.installTemplates();
  writer.ensureDecksDir();
  spinner.succeed('  mira-templates/ e decks/ prontos');

  // 4. Git strategy
  writer.applyGitStrategy(answers.git_strategy);

  // 5. mira.config.json
  const config = loadConfig() ?? { sources: [], decks: [] };
  config.version = version;
  config.projectName = answers.project_name;
  config.userName = answers.user_name;
  config.chatLanguage = answers.chat_language;
  config.defaultTheme = DEFAULT_THEME;
  config.installedAt = config.installedAt ?? new Date().toISOString();
  config.updatedAt = new Date().toISOString();

  saveConfig(config);

  // 7. State + manifest SHA-256
  const statePath = join(projectRoot, '.mira', 'state.json');
  mkdirSync(dirname(statePath), { recursive: true });
  writeFileSync(statePath, JSON.stringify({
    version,
    installedAt: config.installedAt,
    updatedAt: config.updatedAt,
    engines: answers.engines,
    agents: answers.agents,
    createdFiles: writer.createdFiles,
  }, null, 2), 'utf8');
  saveManifest(projectRoot, buildManifest(projectRoot, writer.manifestPaths));

  // Os próximos passos acontecem DENTRO do harness, não no terminal: é lá que o Mira vive.
  // Quem acabou de instalar precisa aprender a falar com o agente, não a decorar flags de CLI.
  console.log('');
  console.log(chalk.bold(`  Mira v${version} instalado, ${answers.user_name}!`));
  console.log(chalk.gray('  Agora fale com o Mira pelo seu agente (Claude Code, Codex, Antigravity...):'));
  console.log(chalk.gray('    /mira-new           criar o primeiro deck'));
  console.log(chalk.gray('    /mira-references    apontar o material que vira slide'));
  console.log(chalk.gray('    /mira-animator      dar vida aos slides'));
  console.log(chalk.gray('  (no Codex, sem a barra: mira-new)'));
  console.log(chalk.gray(`  Tema padrão: ${DEFAULT_THEME}`));
  console.log('');
}
