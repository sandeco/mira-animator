import { join, resolve } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { ENGINES } from '../installer/detector.js';
import { PIPELINE_CORE, VISUAL_TEAM, STORY_TEAM } from '../installer/agent-sets.js';
import { checkExistingInstallation } from '../installer/validator.js';
import { Writer } from '../installer/writer.js';
import { buildManifest, saveManifest, loadManifest, fileStatus } from '../installer/manifest.js';
import { syncPlugins } from '../runtime/plugin-sync.js';
import { loadConfig, saveConfig } from '../utils/paths.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');

export default async function update() {
  const { default: chalk } = await import('chalk');
  const projectRoot = resolve(process.cwd());

  const existing = checkExistingInstallation(projectRoot);
  if (!existing.installed) {
    console.error('\n  O Mira não está instalado nesta pasta. Execute "npx mira-animator install".\n');
    process.exit(1);
  }

  const state = existing.state;
  const version = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')).version;
  const manifest = loadManifest(projectRoot);
  const writer = new Writer(projectRoot);

  // Preserva customizações: arquivos modificados pelo usuário não são sobrescritos
  const modifiedSet = new Set(
    Object.entries(manifest)
      .filter(([rel, hash]) => fileStatus(projectRoot, rel, hash) === 'modified')
      .map(([rel]) => rel)
  );

  const backups = new Map();
  for (const rel of modifiedSet) {
    const abs = join(projectRoot, rel);
    if (existsSync(abs)) backups.set(rel, readFileSync(abs));
  }

  // Agentes a instalar: os que já existiam + os novos do core atual
  // (e o time visual, se este projeto já o tinha). Assim agentes lançados
  // depois da instalação original passam a chegar no "update".
  const priorAgents = state.agents ?? [];
  const hadVisual = VISUAL_TEAM.some(a => priorAgents.includes(a));

  /* Time OPCIONAL lançado DEPOIS da instalação original.
     A regra "só reinstala o time que você já tinha" é certa para quem
     recusou um time, mas deixava um buraco: um time novo, que não existia
     quando você instalou, nunca chegava pelo update, e não havia comando
     nenhum que o trouxesse sem refazer a instalação inteira. O update
     pergunta uma vez, e continua respeitando o não.
     O Story Team saiu daqui: é obrigatório e chega sempre. */
  const novos = [];
  if (!hadVisual && !priorAgents.some(a => VISUAL_TEAM.includes(a))) {
    novos.push({ id: 'visual', nome: 'Visual Team', agentes: VISUAL_TEAM });
  }
  const aAdicionar = [];
  const interativo = process.stdout.isTTY && !process.env.MIRA_NAO_PERGUNTAR;
  for (const time of novos) {
    if (!interativo) {
      console.log(chalk.gray(`\n  Time opcional disponível e não instalado: ${time.nome}`));
      console.log(chalk.gray(`  Para adicionar: npx mira-animator install (e marque "${time.nome}")`));
      continue;
    }
    const { default: inquirer } = await import('inquirer');
    const { quer } = await inquirer.prompt([{
      type: 'confirm', name: 'quer', default: false,
      message: `Instalar o ${time.nome}? (${time.agentes.length} agentes novos, opcional)`
    }]);
    if (quer) aAdicionar.push(...time.agentes);
  }

  const agentsToInstall = [...new Set([
    ...priorAgents,
    ...PIPELINE_CORE,
    ...STORY_TEAM,
    ...(hadVisual ? VISUAL_TEAM : []),
    ...aAdicionar,
  ])];

  const selectedEngines = ENGINES.filter(e => (state.engines ?? []).includes(e.id));
  for (const engine of selectedEngines) {
    for (const agentId of agentsToInstall) {
      writer.installSkill(agentId, engine.skillsDir, { force: true });
    }
    if (engine.id === 'claude-code') {
      if (agentsToInstall.includes('mira-fast')) writer.installClaudeWorkflow('mira-fast-engine', { force: true });
      if (agentsToInstall.includes('mira-ultrafast')) writer.installClaudeWorkflow('mira-ultrafast-engine', { force: true });
    }
  }
  writer.installTemplates();
  writer.ensurePluginsDir();

  // Mantém o script de aviso e o hook atualizados
  writer.installRuntime();
  for (const engine of selectedEngines) writer.installSessionHook(engine.id);

  for (const [rel, content] of backups) {
    writeFileSync(join(projectRoot, rel), content);
  }

  state.version = version;
  state.updatedAt = new Date().toISOString();
  state.agents = agentsToInstall;
  // Regravado a cada update para acompanhar mudança de engine. `plugins` é do
  // usuário e nunca é reconstruído aqui, só garantido como array.
  state.skillsDirs = [...new Set(selectedEngines.map(e => e.skillsDir))];
  state.plugins = Array.isArray(state.plugins) ? state.plugins : [];
  state.createdFiles = [...new Set([...(state.createdFiles ?? []), ...writer.createdFiles])];
  writeFileSync(join(projectRoot, '.mira', 'state.json'), JSON.stringify(state, null, 2), 'utf8');
  saveManifest(projectRoot, buildManifest(projectRoot, [...new Set([...Object.keys(manifest), ...writer.manifestPaths])]));

  // Reconcilia os plugins do usuário depois que o estado já está gravado.
  syncPlugins(projectRoot);

  const config = loadConfig();
  if (config) {
    config.version = version;
    config.updatedAt = state.updatedAt;
    saveConfig(config);
  }

  console.log(`\n  Mira atualizado para v${version}.`);
  if (modifiedSet.size > 0) console.log(chalk.yellow(`  ${modifiedSet.size} arquivo(s) modificados por você foram preservados.`));
  console.log('');
}
