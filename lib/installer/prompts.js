import inquirer from 'inquirer';
import chalk from 'chalk';
import { applyOrangeTheme, ORANGE_PREFIX } from './orange-prompts.js';

applyOrangeTheme();

export const PIPELINE_CORE = [
  'mira-references',
  'mira-extract',
  'mira-planner',
  'mira-copywriter',
  'mira-builder',
  'mira-animator',
  'mira-size-animator',
  'mira-validator',
  'mira-get-videos',
  '_shared',
];

export const VISUAL_TEAM = [
  'mira-visuals',
  'mira-image-prompt',
  'mira-img-animator',
];

const P = { prefix: ORANGE_PREFIX };
const promptTitle = (number, message, suffix = 'none') => {
  const tail = suffix === 'checkbox' ? '\n\n' : suffix === 'list' ? '\n' : '';
  return `\n${number}. ${message}${tail}`;
};

export async function runInstallPrompts(detectedEngines) {
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
        { name: `Pipeline Core ${chalk.gray('(extract, planner, copywriter, builder, animator, size-animator, validator)')}`, value: 'core', checked: true, disabled: 'sempre instalado' },
        { name: `Visual Team ${chalk.gray('(visuals, image-prompt, img-animator)')}`, value: 'visual', checked: true },
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
      name: 'default_theme',
      message: promptTitle(6, 'Tema visual padrão dos decks', 'list'),
      loop: false,
      choices: [
        { name: 'mira-dark — preto + laranja, glassmorphism (clássico do canal)', value: 'mira-dark' },
        { name: 'light-minimal — claro, para projetor fraco e impressão', value: 'light-minimal' },
        { name: 'corporate-blue — azul profundo, pitch corporativo', value: 'corporate-blue' },
        { name: 'neon-emerald — verde neon, demos técnicas', value: 'neon-emerald' },
      ],
    },
    {
      ...P,
      type: 'list',
      name: 'git_strategy',
      message: promptTitle(7, 'Como tratar os decks no git?', 'list'),
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
