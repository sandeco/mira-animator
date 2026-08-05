import {
  existsSync, mkdirSync, writeFileSync,
  readFileSync, cpSync, appendFileSync,
  readdirSync, statSync,
} from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { askMergeStrategy } from './prompts.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..');
const AGENTS_DIR = join(REPO_ROOT, 'agents');
const TEMPLATES_DIR = join(REPO_ROOT, 'templates');
const RUNTIME_DIR = join(REPO_ROOT, 'lib', 'runtime');
const WORKFLOWS_DIR = join(REPO_ROOT, 'workflows');

// Comando do hook de início de sessão. Roda o script local (Node puro), que só
// lê o cache e sai — nunca bloqueia a sessão.
const NOTICE_COMMAND = 'node .mira/bin/version-notice.js';

export class Writer {
  constructor(projectRoot) {
    this.projectRoot = projectRoot;
    this.createdFiles = [];   // dirs + arquivos — usados pelo uninstall via state.json
    this.manifestPaths = [];  // só arquivos — usados no manifest SHA-256
  }

  _rel(absPath) {
    return absPath
      .replace(this.projectRoot + '\\', '')
      .replace(this.projectRoot + '/', '');
  }

  _register(absPath) {
    const rel = this._rel(absPath);
    if (!this.createdFiles.includes(rel)) this.createdFiles.push(rel);
    try {
      if (!statSync(absPath).isDirectory()) {
        if (!this.manifestPaths.includes(rel)) this.manifestPaths.push(rel);
      }
    } catch { /* ignore */ }
  }

  _registerFilesInDir(dirPath) {
    try {
      for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
        const full = join(dirPath, entry.name);
        if (entry.isDirectory()) this._registerFilesInDir(full);
        else {
          const rel = this._rel(full);
          if (!this.manifestPaths.includes(rel)) this.manifestPaths.push(rel);
        }
      }
    } catch { /* ignore */ }
  }

  _mkdir(dir) {
    mkdirSync(dir, { recursive: true });
  }

  // Instala um agente nas skills de uma engine
  installSkill(agentId, skillsDir, { force = false } = {}) {
    const src = join(AGENTS_DIR, agentId);
    const dest = join(this.projectRoot, skillsDir, agentId);

    if (!existsSync(src)) {
      console.warn(`  Agente não encontrado: ${agentId}`);
      return;
    }
    if (existsSync(dest) && !force) return;

    this._mkdir(dirname(dest));
    cpSync(src, dest, { recursive: true, force: true });
    this._register(dest);
    this._registerFilesInDir(dest);
  }

  // Instala o motor executável do Mira Fast no Claude Code.
  installClaudeWorkflow(workflowId, { force = false } = {}) {
    const src = join(WORKFLOWS_DIR, `${workflowId}.js`);
    const dest = join(this.projectRoot, '.claude', 'workflows', `${workflowId}.js`);

    if (!existsSync(src)) {
      console.warn(`  Workflow não encontrado: ${workflowId}`);
      return;
    }
    if (existsSync(dest) && !force) return;

    this._mkdir(dirname(dest));
    cpSync(src, dest, { force: true });
    this._register(dest);
  }
  // Instala o arquivo de entrada da engine (CLAUDE.md, AGENTS.md, .cursorrules...)
  async installEntryFile(engine, vars = {}, { force = false } = {}) {
    if (!engine.entryFile || !engine.entryTemplate) return;

    const templatePath = join(TEMPLATES_DIR, 'engines', engine.entryTemplate);
    const destPath = join(this.projectRoot, engine.entryFile);
    if (!existsSync(templatePath)) return;

    let content = readFileSync(templatePath, 'utf8');
    for (const [key, value] of Object.entries(vars)) {
      content = content.replaceAll(`{{${key}}}`, value);
    }

    if (!existsSync(destPath) || force) {
      this._mkdir(dirname(destPath));
      writeFileSync(destPath, content, 'utf8');
      this._register(destPath);
      return;
    }

    const strategy = await askMergeStrategy(engine.entryFile);
    if (strategy === 'merge') {
      appendFileSync(destPath, '\n\n' + content, 'utf8');
    }
  }

  // Copia mira-templates (themes, slides, decks) para o projeto
  installTemplates() {
    const dest = join(this.projectRoot, 'mira-templates');
    for (const sub of ['themes', 'slides', 'decks', 'vendor', 'authoring', 'remote', 'studio']) {
      cpSync(join(TEMPLATES_DIR, sub), join(dest, sub), { recursive: true, force: true });
    }
    this._register(dest);
    this._registerFilesInDir(dest);
  }

  // Cria a pasta de decks do usuário (não rastreada para uninstall — é conteúdo do usuário)
  ensureDecksDir() {
    this._mkdir(join(this.projectRoot, 'decks'));
  }

  // Cria a casa dos plugins do usuário. Também não é rastreada: apagar o Mira
  // não pode levar junto o plugin que ele escreveu, mesma regra do decks/.
  ensurePluginsDir() {
    this._mkdir(join(this.projectRoot, 'mira-plugins'));
  }

  // Copia os scripts de runtime para `.mira/bin/` (Node puro, sem deps):
  // o aviso de versão e o sincronizador de plugins que ele chama.
  installRuntime() {
    for (const file of ['version-notice.js', 'plugin-sync.js']) {
      const dest = join(this.projectRoot, '.mira', 'bin', file);
      this._mkdir(dirname(dest));
      cpSync(join(RUNTIME_DIR, file), dest, { force: true });
      this._register(dest);
    }
  }

  // Registra o hook SessionStart do Claude Code em `.claude/settings.json`,
  // mesclando com o que já existir. Só faz sentido para a engine claude-code.
  installSessionHook(engineId) {
    if (engineId !== 'claude-code') return;
    const settingsPath = join(this.projectRoot, '.claude', 'settings.json');

    let settings = {};
    if (existsSync(settingsPath)) {
      try { settings = JSON.parse(readFileSync(settingsPath, 'utf8')) || {}; }
      catch { return; } // settings inválido/manual — não arrisca sobrescrever
    }

    settings.hooks ??= {};
    settings.hooks.SessionStart ??= [];

    const alreadySet = settings.hooks.SessionStart.some((entry) =>
      (entry?.hooks ?? []).some((h) => h?.command === NOTICE_COMMAND)
    );
    if (alreadySet) return;

    settings.hooks.SessionStart.push({
      hooks: [{ type: 'command', command: NOTICE_COMMAND }],
    });

    this._mkdir(dirname(settingsPath));
    const isNew = !existsSync(settingsPath);
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf8');
    if (isNew) this._register(settingsPath);
  }

  // Aplica a estratégia de git escolhida
  applyGitStrategy(strategy) {
    if (strategy !== 'gitignore') return;
    const gitignorePath = join(this.projectRoot, '.gitignore');
    // mira-plugins/ NÃO entra: é fonte do usuário e ele deve versionar. Só o
    // pacote gerado fica de fora, que é artefato de distribuição.
    const block = '\n# Mira\ndecks/\nmira-templates/\n.mira/\nmira-plugins/*.mplug\n';
    if (existsSync(gitignorePath)) {
      const current = readFileSync(gitignorePath, 'utf8');
      if (!current.includes('# Mira')) appendFileSync(gitignorePath, block, 'utf8');
    } else {
      writeFileSync(gitignorePath, block.trimStart(), 'utf8');
      this._register(gitignorePath);
    }
  }
}
