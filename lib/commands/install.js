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

// Parser simples de flags para instalação não-interativa (sem TTY).
// Ex.: --yes --engines=claude-code,codex --teams=core,visual
//      --project-name="Meu Projeto" --user-name=Ana --chat-language=pt-br
//      --git-strategy=gitignore
function parseInstallArgs(args = []) {
  const overrides = {};
  for (const arg of args) {
    if (arg === '--yes' || arg === '-y') {
      overrides.yes = true;
      continue;
    }
    const match = arg.match(/^--([a-z-]+)=(.*)$/);
    if (!match) continue;
    const [, key, value] = match;
    switch (key) {
      case 'engines':
        overrides.engines = value.split(',').map(s => s.trim()).filter(Boolean);
        break;
      case 'teams':
        overrides.teams = value.split(',').map(s => s.trim()).filter(Boolean);
        break;
      case 'project-name':
        overrides.projectName = value;
        break;
      case 'user-name':
        overrides.userName = value;
        break;
      case 'chat-language':
        overrides.chatLanguage = value;
        break;
      case 'git-strategy':
        overrides.gitStrategy = value;
        break;
    }
  }
  return overrides;
}

export default async function install(args = []) {
  const { default: chalk } = await import('chalk');
  const { default: ora } = await import('ora');

  const overrides = parseInstallArgs(args);
  const interactive = Boolean(process.stdin.isTTY) && !overrides.yes;

  const projectRoot = resolve(process.cwd());
  const version = getVersion();
  const DEFAULT_THEME = 'mira-dark'; // tema base fixo; a escolha de tema/template é por deck no /mira-new

  if (interactive) console.clear();
  console.log(chalk.hex('#FF904D')(renderMiraLogo()));
  console.log(chalk.gray('  Slides animados — direto das suas fontes.'));
  console.log('');
  console.log(chalk.bold('  Instalação'));

  const existing = checkExistingInstallation(projectRoot);
  if (existing.installed) {
    console.log(chalk.yellow(`\n  O Mira já está instalado (v${existing.version}) nesta pasta.`));
    if (!interactive) {
      console.log(chalk.gray('  Sem TTY / --yes: atualizando configuração automaticamente.'));
    } else {
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
  }

  const detectedEngines = detectEngines(projectRoot);
  const detected = detectedEngines.filter(e => e.detected).map(e => e.name).join(', ');
  if (detected) console.log(chalk.gray(`\n  Engines detectadas: ${detected}`));

  const answers = await runInstallPrompts(detectedEngines, overrides);
  console.log('');

  const writer = new Writer(projectRoot);
  let selectedEngines = ENGINES.filter(e => answers.engines.includes(e.id));
  if (selectedEngines.length === 0) {
    selectedEngines = ENGINES.filter(e => e.id === 'claude-code');
  }

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

  console.log('');
  console.log(chalk.bold(`  Mira v${version} instalado, ${answers.user_name}!`));
  console.log(chalk.gray('  Próximos passos:'));
  console.log(chalk.gray('    npx mira-animator link <pasta>    vincular mais fontes'));
  console.log(chalk.gray('    npx mira-animator new <nome>      criar o primeiro deck'));
  console.log(chalk.gray(`    Tema padrão: ${DEFAULT_THEME}`));
  console.log('');
}
