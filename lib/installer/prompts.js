import inquirer from 'inquirer';
import chalk from 'chalk';
import { applyOrangeTheme, ORANGE_PREFIX } from './orange-prompts.js';
import { PIPELINE_CORE, VISUAL_TEAM } from './agent-sets.js';

applyOrangeTheme();

export { PIPELINE_CORE, VISUAL_TEAM };

const P = { prefix: ORANGE_PREFIX };
const promptTitle = (number, message, suffix = 'none') => {
  const tail = suffix === 'checkbox' ? '\n\n' : suffix === 'list' ? '\n' : '';
  return `\n${number}. ${message}${tail}`;
};

export async function runInstallPrompts(detectedEngines, overrides = {}) {
  const interactive = Boolean(process.stdin.isTTY) && !overrides.yes;

  if (!interactive) {
    const detectedIds = detectedEngines.filter(e => e.detected).map(e => e.id);
    const engines = overrides.engines?.length ? overrides.engines : (detectedIds.length ? detectedIds : ['claude-code']);
    const teams = overrides.teams?.length ? overrides.teams : ['core', 'visual'];

    const agents = [...PIPELINE_CORE];
    if (teams.includes('visual')) agents.push(...VISUAL_TEAM);

    return {
      engines,
      teams,
      project_name: overrides.projectName || process.cwd().split(/[\\/]/).pop(),
      user_name: overrides.userName || 'usuário',
      chat_language: overrides.chatLanguage || 'pt-br',
      git_strategy: overrides.gitStrategy || 'commit',
      agents: [...new Set(agents)],
    };
  }

  const engineChoices = detectedEngines.map(e => ({
    name: `${e.name}${e.star ? ' (recomendado)' : ''}`,
    value: e.id,
    checked: e.detected,
  }));

  const answers = await inquirer.prompt([
    {
      ...P,
      type: 'checkbox',
      name: 'engines',
      message: promptTitle(1, 'Engines a suportar', 'checkbox'),
      choices: engineChoices,
      loop: false,
      pageSize: 13,
      validate: (selected) => selected.length > 0 || 'Selecione pelo menos uma engine.',
    },
    {
      ...P,
      type: 'checkbox',
      name: 'teams',
      message: promptTitle(2, 'Times de agentes a instalar', 'checkbox'),
      choices: [
        { name: `Pipeline Core ${chalk.gray('(extract, planner, copywriter, builder, animator, size-animator, animated-metaphor, squared, vertical, thirds, validator)')}`, value: 'core', checked: true, disabled: 'sempre instalado' },
        { name: `Visual Team ${chalk.gray('(visuals, image-prompt, img-animator, chart)')}`, value: 'visual', checked: true },
      ],
      loop: false,
    },
    {
      ...P,
      type: 'input',
      name: 'project_name',
      message: promptTitle(3, 'Nome do projeto de slides:'),
      default: process.cwd().split(/[\\/]/).pop(),
      validate: (v) => v.trim().length > 0 || 'O nome não pode ser vazio.',
    },
    {
      ...P,
      type: 'input',
      name: 'user_name',
      message: promptTitle(4, 'Como os agentes devem te chamar?'),
      validate: (v) => v.trim().length > 0 || 'O nome não pode ser vazio.',
    },
    {
      ...P,
      type: 'input',
      name: 'chat_language',
      message: promptTitle(5, 'Idioma de interação com os agentes:'),
      default: 'pt-br',
    },
    {
      ...P,
      type: 'list',
      name: 'git_strategy',
      message: promptTitle(6, 'Como tratar os decks no git?', 'list'),
      loop: false,
      choices: [
        { name: 'Comitar com o projeto (recomendado para equipes)', value: 'commit' },
        { name: 'Adicionar ao .gitignore (uso pessoal)', value: 'gitignore' },
      ],
    },
  ]);

  const agents = [...PIPELINE_CORE];
  if ((answers.teams ?? []).includes('visual')) agents.push(...VISUAL_TEAM);

  return { ...answers, agents: [...new Set(agents)] };
}

export async function askMergeStrategy(filePath) {
  if (!process.stdin.isTTY) return 'skip';

  const { strategy } = await inquirer.prompt([
    {
      ...P,
      type: 'list',
      name: 'strategy',
      message: `\nO arquivo "${filePath}" já existe. O que fazer?\n\n`,
      loop: false,
      choices: [
        { name: 'Merge: adicionar o conteúdo do Mira ao final', value: 'merge' },
        { name: 'Pular: manter o arquivo como está', value: 'skip' },
      ],
    },
  ]);
  return strategy;
}
