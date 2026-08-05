/**
 * MIRA — sincronização de plugins do usuário.
 *
 * Este arquivo é COPIADO para `.mira/bin/plugin-sync.js` de cada projeto na
 * instalação/atualização. Ele NÃO importa nada do pacote: roda com Node puro,
 * porque é chamado tanto pelo hook de início de sessão quanto pelo CLI.
 *
 * Contrato:
 *   - NUNCA lança para fora: erro vira registro de recusa, nunca exceção.
 *   - NUNCA bloqueia: sem rede, sem espera, sem processo filho.
 *   - Só remove caminho que ele mesmo registrou em `state.json#plugins[].targets`.
 *
 * O plugin mora em `mira-plugins/<id>/` (casa, do usuário) e é ativado como
 * cópia em `<skillsDir>/<id>/` (derivada, do Mira). Apagar a casa desativa.
 */

import {
  existsSync, readFileSync, writeFileSync, renameSync,
  readdirSync, cpSync, rmSync, mkdirSync,
} from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';

export const PLUGINS_DIR = 'mira-plugins';
export const MANIFEST_NAME = 'mira-plugin.json';
export const SKILL_NAME = 'SKILL.md';
export const RESERVED_PREFIX = 'mira-';

// Usado só quando a instalação é anterior a esta feature e não tem `skillsDirs`.
const FALLBACK_SKILLS_DIRS = ['.claude/skills', '.agents/skills', '.kiro/skills'];

// Engines que o Mira consegue sincronizar sozinha: são as que recebem hook de
// início de sessão. As demais dependem de `mira plugin sync`.
const ENGINES_WITH_HOOK = ['claude-code'];

const EXECUTABLE_EXT = new Set([
  '.js', '.mjs', '.cjs', '.sh', '.bat', '.cmd', '.ps1', '.exe', '.py', '.rb', '.php',
]);

const ID_RE = /^[a-z0-9]+(-[a-z0-9]+)+$/;
const VERSION_RE = /^\d+\.\d+\.\d+$/;

// Teto de segurança na varredura: plugin é pequeno; pasta gigante é sintoma de
// erro e não pode custar o orçamento de milissegundos do hook.
const MAX_FILES_SCAN = 2000;

function readJson(path) {
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return null; }
}

function writeJsonAtomic(path, data) {
  const tmp = `${path}.tmp`;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n', 'utf8');
  renameSync(tmp, path);
}

function toPosix(p) {
  return String(p).replace(/\\/g, '/');
}

/** Compara versões "a.b.c". Retorna true se `a` for menor que `b`. */
function semverLt(a, b) {
  const norm = (v) => String(v || '0').split('-')[0].split('.').map((n) => parseInt(n, 10) || 0);
  const pa = norm(a), pb = norm(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const da = pa[i] || 0, db = pb[i] || 0;
    if (da < db) return true;
    if (da > db) return false;
  }
  return false;
}

/** Lista caminhos relativos de arquivos dentro de `dir`, com teto de segurança. */
function walkFiles(dir, base = '', acc = []) {
  if (acc.length >= MAX_FILES_SCAN) return acc;
  let entries;
  try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return acc; }
  for (const entry of entries) {
    if (acc.length >= MAX_FILES_SCAN) break;
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) walkFiles(join(dir, entry.name), rel, acc);
    else acc.push(rel);
  }
  return acc;
}

/**
 * Procura arquivo executável na pasta.
 *   { found: '<caminho>' }  achou
 *   { found: null }         varreu tudo e não achou
 *   { truncated: true }     bateu no teto: a varredura não é conclusiva
 *
 * O teto existe pelo orçamento de milissegundos do hook, mas não pode virar
 * porta dos fundos: pasta grande demais é recusada em vez de aceita por
 * omissão, senão bastaria enterrar o executável depois do limite.
 */
function findExecutable(dir) {
  const arquivos = walkFiles(dir);
  for (const rel of arquivos) {
    if (EXECUTABLE_EXT.has(extname(rel).toLowerCase())) return { found: rel };
  }
  if (arquivos.length >= MAX_FILES_SCAN) return { found: null, truncated: true };
  return { found: null };
}

export function resolveSkillsDirs(projectRoot, state) {
  const listed = Array.isArray(state?.skillsDirs) ? state.skillsDirs.filter(Boolean) : [];
  if (listed.length) return listed;
  return FALLBACK_SKILLS_DIRS.filter((d) => existsSync(join(projectRoot, d)));
}

export function listPluginFolders(projectRoot) {
  const root = join(projectRoot, PLUGINS_DIR);
  if (!existsSync(root)) return [];
  try {
    return readdirSync(root, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
  } catch {
    return [];
  }
}

function fail(code, file, detail) {
  return { ok: false, code, file: toPosix(file), detail: detail ?? null };
}

/**
 * Valida a pasta de um plugin. Devolve `{ ok:true, manifest }` ou
 * `{ ok:false, code, file, detail }`. Nunca lança.
 *
 * ctx: { nativeAgents:Set, otherPluginIds:Set, miraVersion:string }
 */
export function validatePlugin(projectRoot, id, ctx = {}) {
  const nativeAgents = ctx.nativeAgents ?? new Set();
  const otherPluginIds = ctx.otherPluginIds ?? new Set();
  const dir = join(projectRoot, PLUGINS_DIR, id);
  const manifestPath = join(dir, MANIFEST_NAME);

  if (!existsSync(manifestPath)) return fail('MANIFEST_MISSING', manifestPath);

  const manifest = readJson(manifestPath);
  if (!manifest || typeof manifest !== 'object') return fail('MANIFEST_INVALID', manifestPath);

  for (const field of ['id', 'version', 'author', 'tier']) {
    if (!manifest[field]) return fail('FIELD_MISSING', manifestPath, field);
  }

  if (!ID_RE.test(String(manifest.id))) return fail('ID_FORMAT', manifestPath, String(manifest.id));
  if (String(manifest.id) !== id) return fail('ID_MISMATCH', manifestPath, `${manifest.id} != ${id}`);
  if (id.startsWith(RESERVED_PREFIX)) return fail('ID_RESERVED', dir, id);
  if (nativeAgents.has(id)) return fail('ID_COLLISION_NATIVE', dir, id);
  if (otherPluginIds.has(id)) return fail('ID_COLLISION_PLUGIN', dir, id);
  if (!VERSION_RE.test(String(manifest.version))) return fail('VERSION_FORMAT', manifestPath, String(manifest.version));

  // Primeira entrega aceita apenas `prompt-only`. O campo já é obrigatório para
  // que plugins de hoje continuem válidos quando `code` for liberado.
  if (manifest.tier !== 'prompt-only') return fail('TIER_UNSUPPORTED', manifestPath, String(manifest.tier));

  if (!existsSync(join(dir, SKILL_NAME))) return fail('SKILL_MISSING', join(dir, SKILL_NAME));

  for (const value of Object.values(manifest)) {
    if (typeof value === 'string' && value.includes('..')) return fail('PATH_ESCAPE', manifestPath, value);
  }

  if (manifest.miraMin && ctx.miraVersion && semverLt(ctx.miraVersion, manifest.miraMin)) {
    return fail('MIRA_TOO_OLD', manifestPath, `${ctx.miraVersion} < ${manifest.miraMin}`);
  }

  const varredura = findExecutable(dir);
  if (varredura.truncated) {
    return fail('TOO_MANY_FILES', dir, `mais de ${MAX_FILES_SCAN} arquivos`);
  }
  if (varredura.found) {
    // Com `tier` restrito a prompt-only, achar executável é sempre divergência
    // entre o que o manifesto declara e o que a pasta contém.
    return fail('TIER_MISMATCH', join(dir, varredura.found), varredura.found);
  }

  return { ok: true, manifest };
}

/** Remove as cópias ativadas de um plugin. Só apaga o que está registrado. */
function removeTargets(projectRoot, entry) {
  const removed = [];
  for (const rel of entry?.targets ?? []) {
    const posix = toPosix(rel);
    // Trava dupla: o caminho tem que terminar no id do plugin e jamais pode
    // apontar para dentro da casa do usuário.
    if (basename(posix) !== entry.id) continue;
    if (posix === PLUGINS_DIR || posix.startsWith(`${PLUGINS_DIR}/`)) continue;
    const abs = join(projectRoot, rel);
    if (!existsSync(abs)) { removed.push(rel); continue; }
    try { rmSync(abs, { recursive: true, force: true }); removed.push(rel); } catch { /* ignora */ }
  }
  return removed;
}

/** Copia a pasta do plugin para cada diretório de skills. Devolve os alvos. */
function copyToSkillsDirs(projectRoot, id, skillsDirs) {
  const src = join(projectRoot, PLUGINS_DIR, id);
  const targets = [];
  for (const skillsDir of skillsDirs) {
    const rel = `${toPosix(skillsDir)}/${id}`;
    const dest = join(projectRoot, skillsDir, id);
    try {
      mkdirSync(dirname(dest), { recursive: true });
      rmSync(dest, { recursive: true, force: true });
      cpSync(src, dest, { recursive: true, force: true });
      targets.push(rel);
    } catch { /* diretório indisponível: segue para o próximo */ }
  }
  return targets;
}

function targetsIntact(projectRoot, entry, skillsDirs) {
  const expected = skillsDirs.map((d) => `${toPosix(d)}/${entry.id}`);
  const current = (entry.targets ?? []).map(toPosix);
  if (expected.length !== current.length) return false;
  if (!expected.every((t) => current.includes(t))) return false;
  return current.every((rel) => existsSync(join(projectRoot, rel)));
}

function emptyResult(extra = {}) {
  return {
    activated: [], deactivated: [], rejected: [],
    skillsDirs: [], hasSessionHook: false, enginesWithoutHook: [],
    ...extra,
  };
}

/**
 * Reconcilia `mira-plugins/` contra o registro em `.mira/state.json`.
 * Ativa o que apareceu, reativa o que mudou de versão, desativa o que sumiu.
 */
export function syncPlugins(projectRoot) {
  const statePath = join(projectRoot, '.mira', 'state.json');
  const state = readJson(statePath);
  if (!state) return emptyResult(); // pasta sem Mira instalado

  const skillsDirs = resolveSkillsDirs(projectRoot, state);
  const engines = Array.isArray(state.engines) ? state.engines : [];
  const meta = {
    skillsDirs,
    hasSessionHook: engines.some((e) => ENGINES_WITH_HOOK.includes(e)),
    enginesWithoutHook: engines.filter((e) => !ENGINES_WITH_HOOK.includes(e)),
  };

  const registered = Array.isArray(state.plugins) ? state.plugins : [];
  const nativeAgents = new Set(Array.isArray(state.agents) ? state.agents : []);
  const present = listPluginFolders(projectRoot);

  const activated = [], deactivated = [], rejected = [];
  const accepted = new Map();
  const droppedTargets = [];

  // 1. Desativa o que sumiu da casa.
  for (const entry of registered) {
    if (!entry?.id) continue;
    if (present.includes(entry.id)) { accepted.set(entry.id, entry); continue; }
    droppedTargets.push(...removeTargets(projectRoot, entry));
    deactivated.push(entry.id);
  }

  // 2. Ativa, reativa ou recusa o que está na casa.
  for (const id of present) {
    const existing = accepted.get(id);
    const others = new Set([...accepted.keys()].filter((k) => k !== id));
    const verdict = validatePlugin(projectRoot, id, { nativeAgents, otherPluginIds: others, miraVersion: state.version });

    if (!verdict.ok) {
      rejected.push({ id, code: verdict.code, file: verdict.file, detail: verdict.detail });
      if (existing) {
        droppedTargets.push(...removeTargets(projectRoot, existing));
        accepted.delete(id);
        deactivated.push(id);
      }
      continue;
    }

    const sameVersion = existing && String(existing.version) === String(verdict.manifest.version);
    if (sameVersion && targetsIntact(projectRoot, existing, skillsDirs)) continue;

    if (existing) droppedTargets.push(...removeTargets(projectRoot, existing));
    const targets = copyToSkillsDirs(projectRoot, id, skillsDirs);
    accepted.set(id, {
      id,
      version: String(verdict.manifest.version),
      author: String(verdict.manifest.author),
      tier: String(verdict.manifest.tier),
      activatedAt: new Date().toISOString(),
      targets,
    });
    activated.push(id);
  }

  // 3. Persiste o registro e mantém `createdFiles` coerente, que é o que o
  //    `uninstall` consome para limpar as cópias ativadas.
  const plugins = [...accepted.values()];
  const pluginTargets = new Set(plugins.flatMap((p) => p.targets ?? []));
  const dropped = new Set(droppedTargets.filter((t) => !pluginTargets.has(t)));
  const created = (Array.isArray(state.createdFiles) ? state.createdFiles : [])
    .filter((rel) => !dropped.has(rel));
  for (const rel of pluginTargets) if (!created.includes(rel)) created.push(rel);

  state.plugins = plugins;
  state.createdFiles = created;
  try { writeJsonAtomic(statePath, state); } catch { /* estado somente leitura: segue */ }

  return { activated, deactivated, rejected, ...meta };
}

/** Invólucro para o hook: nunca lança, nunca impede o início da sessão. */
export function safeSync(projectRoot) {
  try { return syncPlugins(projectRoot); } catch { return emptyResult(); }
}

/** Leitura consolidada para exibição, sem escrever nada. */
export function inspectPlugins(projectRoot) {
  const state = readJson(join(projectRoot, '.mira', 'state.json'));
  if (!state) return emptyResult({ installed: false, active: [], present: [] });

  const skillsDirs = resolveSkillsDirs(projectRoot, state);
  const engines = Array.isArray(state.engines) ? state.engines : [];
  const registered = Array.isArray(state.plugins) ? state.plugins : [];
  const nativeAgents = new Set(Array.isArray(state.agents) ? state.agents : []);
  const present = listPluginFolders(projectRoot);

  const active = [], rejected = [];
  const seen = new Set();
  for (const id of present) {
    const verdict = validatePlugin(projectRoot, id, { nativeAgents, otherPluginIds: seen, miraVersion: state.version });
    if (!verdict.ok) { rejected.push({ id, code: verdict.code, file: verdict.file, detail: verdict.detail }); continue; }
    seen.add(id);
    const entry = registered.find((p) => p?.id === id);
    active.push({
      id,
      version: String(verdict.manifest.version),
      author: String(verdict.manifest.author),
      tier: String(verdict.manifest.tier),
      name: verdict.manifest.name ? String(verdict.manifest.name) : id,
      description: verdict.manifest.description ? String(verdict.manifest.description) : '',
      activated: Boolean(entry),
    });
  }

  return {
    installed: true,
    present,
    active,
    rejected,
    activated: [],
    deactivated: [],
    skillsDirs,
    hasSessionHook: engines.some((e) => ENGINES_WITH_HOOK.includes(e)),
    enginesWithoutHook: engines.filter((e) => !ENGINES_WITH_HOOK.includes(e)),
  };
}
