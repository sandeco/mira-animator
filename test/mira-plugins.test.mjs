/* =====================================================================
   mira-plugins.test.mjs
   ---------------------------------------------------------------------
   Sistema de plugins do usuário (feature 007-mira-plugins).

   Três blocos: validação de manifesto, reconciliação casa contra registro,
   e as travas de segurança e robustez.

   Rodar:  node --test test/mira-plugins.test.mjs
   ===================================================================== */
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, existsSync, readFileSync, cpSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { syncPlugins, safeSync, validatePlugin, inspectPlugins } from '../lib/runtime/plugin-sync.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');

/* A versão real do pacote, não um literal: foi exatamente isso que deixou
   passar um esqueleto com `miraMin` maior que a versão publicada. */
const VERSAO_PACOTE = JSON.parse(readFileSync(join(RAIZ, 'package.json'), 'utf8')).version;

/* ---------------------------------------------------------------- fixture */

/* Projeto de mentira: um `.mira/state.json` mínimo, os diretórios de skills
   pedidos e um agente nativo dentro do primeiro deles, para provar depois que
   a sincronização nunca encosta nele. */
function projeto({
  agents = ['mira-animator'],
  engines = ['claude-code'],
  skillsDirs = ['.claude/skills'],
  plugins = [],
  createdFiles = [],
  version = VERSAO_PACOTE,
} = {}) {
  const root = mkdtempSync(join(tmpdir(), 'mira-plug-'));
  mkdirSync(join(root, '.mira'), { recursive: true });
  mkdirSync(join(root, 'mira-plugins'), { recursive: true });
  for (const dir of skillsDirs) mkdirSync(join(root, dir), { recursive: true });
  for (const agente of agents) {
    const dir = join(root, skillsDirs[0], agente);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'SKILL.md'), `---\nname: ${agente}\n---\n`, 'utf8');
  }
  writeFileSync(
    join(root, '.mira', 'state.json'),
    JSON.stringify({ version, engines, agents, skillsDirs, plugins, createdFiles }, null, 2),
    'utf8',
  );
  return root;
}

/* Pasta de plugin. `manifest: null` grava JSON quebrado; `skill: false` omite
   o SKILL.md; `extra` escreve arquivos avulsos dentro da pasta. */
function plugin(root, id, { manifest = {}, skill = true, extra = {}, semManifesto = false } = {}) {
  const dir = join(root, 'mira-plugins', id);
  mkdirSync(dir, { recursive: true });
  if (!semManifesto) {
    const conteudo = manifest === null
      ? '{ isso nao e json'
      : JSON.stringify({ id, version: '0.1.0', author: 'teste', tier: 'prompt-only', ...manifest }, null, 2);
    writeFileSync(join(dir, 'mira-plugin.json'), conteudo, 'utf8');
  }
  if (skill) writeFileSync(join(dir, 'SKILL.md'), `---\nname: ${id}\n---\n\nCorpo.\n`, 'utf8');
  for (const [rel, conteudo] of Object.entries(extra)) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), conteudo, 'utf8');
  }
  return dir;
}

function estado(root) {
  return JSON.parse(readFileSync(join(root, '.mira', 'state.json'), 'utf8'));
}

function limpar(root) {
  rmSync(root, { recursive: true, force: true });
}

function codigo(root, id, ctx = {}) {
  const veredito = validatePlugin(root, id, {
    nativeAgents: new Set(estado(root).agents),
    otherPluginIds: new Set(),
    miraVersion: estado(root).version,
    ...ctx,
  });
  return veredito.ok ? 'OK' : veredito.code;
}

/* ------------------------------------------------- 1. validação de manifesto */

test('manifesto ausente é recusado', () => {
  const root = projeto();
  plugin(root, 'autor-alfa', { semManifesto: true });
  assert.equal(codigo(root, 'autor-alfa'), 'MANIFEST_MISSING');
  limpar(root);
});

test('manifesto malformado é recusado sem lançar', () => {
  const root = projeto();
  plugin(root, 'autor-alfa', { manifest: null });
  assert.equal(codigo(root, 'autor-alfa'), 'MANIFEST_INVALID');
  limpar(root);
});

test('campo obrigatório ausente é recusado', () => {
  const root = projeto();
  plugin(root, 'autor-alfa', { manifest: { author: undefined } });
  assert.equal(codigo(root, 'autor-alfa'), 'FIELD_MISSING');
  limpar(root);
});

test('identificador sem hífen é recusado', () => {
  const root = projeto();
  plugin(root, 'alfa');
  assert.equal(codigo(root, 'alfa'), 'ID_FORMAT');
  limpar(root);
});

test('identificador diferente do nome da pasta é recusado', () => {
  const root = projeto();
  plugin(root, 'autor-alfa', { manifest: { id: 'autor-beta' } });
  assert.equal(codigo(root, 'autor-alfa'), 'ID_MISMATCH');
  limpar(root);
});

test('prefixo reservado ao core é recusado', () => {
  const root = projeto();
  plugin(root, 'mira-alfa');
  assert.equal(codigo(root, 'mira-alfa'), 'ID_RESERVED');
  limpar(root);
});

test('colisão com agente nativo é recusada', () => {
  const root = projeto({ agents: ['mira-animator', 'autor-alfa'] });
  plugin(root, 'autor-alfa');
  assert.equal(codigo(root, 'autor-alfa'), 'ID_COLLISION_NATIVE');
  limpar(root);
});

test('colisão com outro plugin já aceito é recusada', () => {
  const root = projeto();
  plugin(root, 'autor-alfa');
  assert.equal(codigo(root, 'autor-alfa', { otherPluginIds: new Set(['autor-alfa']) }), 'ID_COLLISION_PLUGIN');
  limpar(root);
});

test('versão fora do formato é recusada', () => {
  const root = projeto();
  plugin(root, 'autor-alfa', { manifest: { version: '1' } });
  assert.equal(codigo(root, 'autor-alfa'), 'VERSION_FORMAT');
  limpar(root);
});

test('categoria de risco não suportada é recusada', () => {
  const root = projeto();
  plugin(root, 'autor-alfa', { manifest: { tier: 'code' } });
  assert.equal(codigo(root, 'autor-alfa'), 'TIER_UNSUPPORTED');
  limpar(root);
});

test('plugin sem SKILL.md é recusado', () => {
  const root = projeto();
  plugin(root, 'autor-alfa', { skill: false });
  assert.equal(codigo(root, 'autor-alfa'), 'SKILL_MISSING');
  limpar(root);
});

test('caminho escapando da pasta é recusado', () => {
  const root = projeto();
  plugin(root, 'autor-alfa', { manifest: { description: '../fora' } });
  assert.equal(codigo(root, 'autor-alfa'), 'PATH_ESCAPE');
  limpar(root);
});

test('versão mínima do Mira maior que a instalada é recusada', () => {
  const root = projeto({ version: '0.1.50' });
  plugin(root, 'autor-alfa', { manifest: { miraMin: '9.9.9' } });
  assert.equal(codigo(root, 'autor-alfa'), 'MIRA_TOO_OLD');
  limpar(root);
});

test('plugin bem formado é aceito', () => {
  const root = projeto();
  plugin(root, 'autor-alfa');
  assert.equal(codigo(root, 'autor-alfa'), 'OK');
  limpar(root);
});

/* O esqueleto que o README manda copiar precisa passar na versão que está
   sendo publicada. Um `miraMin` à frente do package.json faria o primeiro
   plugin de todo mundo ser recusado. */
test('o esqueleto entregue em templates/ é válido na versão atual do pacote', () => {
  const root = projeto();
  const destino = join(root, 'mira-plugins', 'autor-exemplo');
  cpSync(join(RAIZ, 'templates', 'authoring', 'plugin-exemplo'), destino, { recursive: true });

  const veredito = validatePlugin(root, 'autor-exemplo', {
    nativeAgents: new Set(estado(root).agents),
    miraVersion: VERSAO_PACOTE,
  });

  assert.ok(veredito.ok, `esqueleto recusado: ${veredito.code} (${veredito.detail})`);
  limpar(root);
});

test('varredura truncada recusa em vez de aceitar por omissão', () => {
  const root = projeto();
  const dir = plugin(root, 'autor-alfa');
  // Acima do teto de varredura: a checagem de executável deixa de ser
  // conclusiva, então o plugin não pode passar.
  mkdirSync(join(dir, 'muitos'), { recursive: true });
  for (let i = 0; i < 2100; i++) writeFileSync(join(dir, 'muitos', `a${i}.txt`), 'x', 'utf8');

  assert.equal(codigo(root, 'autor-alfa'), 'TOO_MANY_FILES');
  limpar(root);
});

/* ------------------------------------------------------ 2. reconciliação */

test('pasta nova é ativada em todos os diretórios de skills', () => {
  const root = projeto({ skillsDirs: ['.claude/skills', '.agents/skills'] });
  plugin(root, 'autor-alfa');

  const r = syncPlugins(root);

  assert.deepEqual(r.activated, ['autor-alfa']);
  assert.ok(existsSync(join(root, '.claude/skills/autor-alfa/SKILL.md')));
  assert.ok(existsSync(join(root, '.agents/skills/autor-alfa/SKILL.md')));

  const s = estado(root);
  assert.equal(s.plugins.length, 1);
  assert.equal(s.plugins[0].id, 'autor-alfa');
  assert.deepEqual(s.plugins[0].targets.sort(), ['.agents/skills/autor-alfa', '.claude/skills/autor-alfa']);
  limpar(root);
});

test('os alvos ativados entram em createdFiles, para o uninstall limpar', () => {
  const root = projeto();
  plugin(root, 'autor-alfa');
  syncPlugins(root);
  assert.ok(estado(root).createdFiles.includes('.claude/skills/autor-alfa'));
  limpar(root);
});

test('apagar a pasta desativa o plugin', () => {
  const root = projeto();
  plugin(root, 'autor-alfa');
  syncPlugins(root);

  rmSync(join(root, 'mira-plugins', 'autor-alfa'), { recursive: true, force: true });
  const r = syncPlugins(root);

  assert.deepEqual(r.deactivated, ['autor-alfa']);
  assert.ok(!existsSync(join(root, '.claude/skills/autor-alfa')));
  assert.equal(estado(root).plugins.length, 0);
  assert.ok(!estado(root).createdFiles.includes('.claude/skills/autor-alfa'));
  limpar(root);
});

test('mudar a versão do manifesto reativa o plugin', () => {
  const root = projeto();
  plugin(root, 'autor-alfa');
  syncPlugins(root);

  plugin(root, 'autor-alfa', { manifest: { version: '0.2.0' } });
  const r = syncPlugins(root);

  assert.deepEqual(r.activated, ['autor-alfa']);
  assert.equal(estado(root).plugins[0].version, '0.2.0');
  limpar(root);
});

test('rodar duas vezes seguidas não faz nada na segunda', () => {
  const root = projeto();
  plugin(root, 'autor-alfa');
  syncPlugins(root);

  const r = syncPlugins(root);

  assert.deepEqual(r.activated, []);
  assert.deepEqual(r.deactivated, []);
  assert.equal(estado(root).plugins.length, 1);
  limpar(root);
});

test('cópia apagada à mão no skills dir é restaurada', () => {
  const root = projeto();
  plugin(root, 'autor-alfa');
  syncPlugins(root);

  rmSync(join(root, '.claude/skills/autor-alfa'), { recursive: true, force: true });
  const r = syncPlugins(root);

  assert.deepEqual(r.activated, ['autor-alfa']);
  assert.ok(existsSync(join(root, '.claude/skills/autor-alfa/SKILL.md')));
  limpar(root);
});

test('plugin recusado não impede a ativação dos válidos', () => {
  const root = projeto();
  plugin(root, 'autor-alfa');
  plugin(root, 'autor-beta', { manifest: null });

  const r = syncPlugins(root);

  assert.deepEqual(r.activated, ['autor-alfa']);
  assert.equal(r.rejected.length, 1);
  assert.equal(r.rejected[0].id, 'autor-beta');
  limpar(root);
});

test('a listagem separa ativos de recusados sem escrever nada', () => {
  const root = projeto();
  plugin(root, 'autor-alfa', { manifest: { name: 'Alfa' } });
  plugin(root, 'mira-proibido');

  const antes = readFileSync(join(root, '.mira', 'state.json'), 'utf8');
  const visao = inspectPlugins(root);

  assert.equal(visao.active.length, 1);
  assert.equal(visao.active[0].name, 'Alfa');
  assert.equal(visao.rejected.length, 1);
  assert.equal(visao.rejected[0].code, 'ID_RESERVED');
  assert.equal(readFileSync(join(root, '.mira', 'state.json'), 'utf8'), antes);
  limpar(root);
});

/* --------------------------------------------- 3. segurança e robustez */

test('arquivo executável na pasta é recusado e nomeado', () => {
  const root = projeto();
  plugin(root, 'autor-alfa', { extra: { 'scripts/faz.js': 'console.log(1)' } });

  const r = syncPlugins(root);

  assert.deepEqual(r.activated, []);
  assert.equal(r.rejected[0].code, 'TIER_MISMATCH');
  assert.match(r.rejected[0].file, /faz\.js$/);
  assert.ok(!existsSync(join(root, '.claude/skills/autor-alfa')));
  limpar(root);
});

test('plugin ativo que ganha executável é desativado na sincronização seguinte', () => {
  const root = projeto();
  plugin(root, 'autor-alfa');
  syncPlugins(root);

  writeFileSync(join(root, 'mira-plugins', 'autor-alfa', 'malicioso.sh'), 'rm -rf /\n', 'utf8');
  const r = syncPlugins(root);

  assert.deepEqual(r.deactivated, ['autor-alfa']);
  assert.ok(!existsSync(join(root, '.claude/skills/autor-alfa')));
  limpar(root);
});

test('alvo registrado que não termina no id do plugin nunca é apagado', () => {
  const root = projeto({
    plugins: [{ id: 'autor-fantasma', version: '0.1.0', author: 'x', tier: 'prompt-only', targets: ['.claude/skills/mira-animator'] }],
  });

  const r = syncPlugins(root);

  assert.deepEqual(r.deactivated, ['autor-fantasma']);
  assert.ok(existsSync(join(root, '.claude/skills/mira-animator/SKILL.md')), 'agente nativo foi apagado');
  limpar(root);
});

test('alvo registrado apontando para a casa do usuário nunca é apagado', () => {
  const root = projeto({
    plugins: [{ id: 'autor-alfa', version: '0.1.0', author: 'x', tier: 'prompt-only', targets: ['mira-plugins/autor-alfa'] }],
  });
  plugin(root, 'autor-alfa');
  // O registro aponta para a casa; a reconciliação vai reativar por targets
  // divergentes, mas não pode apagar a pasta do usuário no caminho.
  syncPlugins(root);

  assert.ok(existsSync(join(root, 'mira-plugins/autor-alfa/SKILL.md')), 'casa do plugin foi apagada');
  limpar(root);
});

test('agentes nativos continuam intactos depois de ativar e desativar', () => {
  const root = projeto();
  plugin(root, 'autor-alfa');
  syncPlugins(root);
  rmSync(join(root, 'mira-plugins', 'autor-alfa'), { recursive: true, force: true });
  syncPlugins(root);

  assert.ok(existsSync(join(root, '.claude/skills/mira-animator/SKILL.md')));
  limpar(root);
});

test('estado corrompido não derruba a sincronização', () => {
  const root = projeto();
  writeFileSync(join(root, '.mira', 'state.json'), '{ quebrado', 'utf8');
  plugin(root, 'autor-alfa');

  const r = safeSync(root);

  assert.deepEqual(r.activated, []);
  assert.deepEqual(r.rejected, []);
  limpar(root);
});

test('pasta sem Mira instalado não faz nada e não lança', () => {
  const root = mkdtempSync(join(tmpdir(), 'mira-plug-vazio-'));
  const r = safeSync(root);
  assert.deepEqual(r.activated, []);
  limpar(root);
});

test('instalação antiga sem skillsDirs cai no fallback dos diretórios existentes', () => {
  const root = projeto({ skillsDirs: ['.claude/skills'] });
  const s = estado(root);
  delete s.skillsDirs;
  writeFileSync(join(root, '.mira', 'state.json'), JSON.stringify(s, null, 2), 'utf8');
  plugin(root, 'autor-alfa');

  const r = syncPlugins(root);

  assert.deepEqual(r.activated, ['autor-alfa']);
  assert.ok(existsSync(join(root, '.claude/skills/autor-alfa/SKILL.md')));
  limpar(root);
});

test('engine sem gancho de início de sessão é reportada', () => {
  const root = projeto({ engines: ['codex', 'cursor'], skillsDirs: ['.agents/skills'] });
  const r = syncPlugins(root);
  assert.equal(r.hasSessionHook, false);
  assert.deepEqual(r.enginesWithoutHook, ['codex', 'cursor']);
  limpar(root);
});
