#!/usr/bin/env node

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { renderMiraLogo } from '../lib/utils/banner.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));

const [,, command, ...args] = process.argv;

const commands = {
  install:   () => import('../lib/commands/install.js'),
  link:      () => import('../lib/commands/link.js'),
  sources:   () => import('../lib/commands/sources.js'),
  new:       () => import('../lib/commands/new.js'),
  status:    () => import('../lib/commands/status.js'),
  update:    () => import('../lib/commands/update.js'),
  uninstall: () => import('../lib/commands/uninstall.js'),
};

if (!command || command === '--help' || command === '-h') {
  console.log(renderMiraLogo() + `
  mira v${pkg.version}

  Uso: npx mira-animator <comando>

  Comandos:
    install              Instala o Mira na pasta atual (agents, templates, config)
    link <caminho>       Vincula uma pasta ou arquivo como fonte de conteúdo
                         Opções: --name=<apelido>  --type=projeto|pdf|latex|texto
    sources              Lista as fontes vinculadas
    new <nome>           Cria um novo deck a partir de um template
                         Opções: --deck=aula-capitulo|pitch-projeto|demo-tecnica|sandeco-just-animation-template
                                 --theme=mira-dark|light-minimal|corporate-blue|neon-emerald
    status               Mostra o estado da instalação e dos decks
    update               Atualiza agents e templates para a última versão
    uninstall            Remove o Mira da pasta atual

  Documentação: https://github.com/sandeco/mira-animator
  `);
  process.exit(0);
}

if (command === '--version' || command === '-v') {
  console.log(pkg.version);
  process.exit(0);
}

if (!commands[command]) {
  console.error(`\n  Comando desconhecido: "${command}"`);
  console.error('  Execute "npx mira-animator --help" para ver os comandos disponíveis.\n');
  process.exit(1);
}

const mod = await commands[command]();
await mod.default(args);
