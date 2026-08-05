#!/usr/bin/env node
/**
 * MIRA — aviso de nova versão (não-bloqueante).
 *
 * Este arquivo é COPIADO para `.mira/bin/version-notice.js` de cada projeto
 * na instalação/atualização. Ele NÃO importa nada do pacote: roda sozinho com
 * Node puro, para poder ser chamado por um hook do harness (Claude Code) ou
 * pela instrução de início de sessão nos entry files (Codex, Cursor, etc.).
 *
 * Contrato:
 *   - NUNCA bloqueia a sessão: lê só o cache local e sai em milissegundos.
 *   - A checagem de rede acontece em segundo plano (processo destacado), para
 *     o PRÓXIMO início de sessão — nunca esperamos por ela.
 *   - Sempre sai com código 0. Qualquer erro é silencioso (fail-open).
 *   - Se há versão nova, imprime no stdout uma instrução para o assistente
 *     avisar o usuário e PERGUNTAR se pode atualizar (nunca atualiza sozinho).
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const PROJECT_ROOT = process.cwd();
const MIRA_DIR = join(PROJECT_ROOT, '.mira');
const STATE_PATH = join(MIRA_DIR, 'state.json');
const CONFIG_PATH = join(PROJECT_ROOT, 'mira.config.json');
const CACHE_PATH = join(MIRA_DIR, '.update-check.json');

const REGISTRY_URL = 'https://registry.npmjs.org/mira-animator/latest';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12h — não checa a rede mais que isso
const FETCH_TIMEOUT_MS = 3000;

function readJson(path) {
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return null; }
}

/** Compara "a" e "b" no estilo semver. Retorna 1 se a>b, -1 se a<b, 0 se iguais. */
function semverGt(a, b) {
  const norm = (v) => String(v || '0').split('-')[0].split('.').map((n) => parseInt(n, 10) || 0);
  const pa = norm(a), pb = norm(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const da = pa[i] || 0, db = pb[i] || 0;
    if (da > db) return true;
    if (da < db) return false;
  }
  return false;
}

function installedVersion() {
  const state = readJson(STATE_PATH);
  if (state?.version) return state.version;
  const config = readJson(CONFIG_PATH);
  return config?.version || null;
}

// ── Modo em segundo plano: só busca a última versão e grava o cache. ──────────
async function refresh() {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(REGISTRY_URL, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return;
    const data = await res.json();
    const latest = data?.version;
    if (!latest) return;
    writeFileSync(CACHE_PATH, JSON.stringify({ latest, checkedAt: new Date().toISOString() }, null, 2));
  } catch { /* offline / timeout / firewall — silencioso */ }
}

if (process.argv.includes('--refresh')) {
  await refresh();
  process.exit(0);
}

// ── Modo normal: lê só o cache, avisa se preciso, dispara refresh e sai. ──────
// ── Plugins do usuário: reconcilia `mira-plugins/` com o que está ativado. ───
// Sem rede e sem processo filho, dentro do mesmo orçamento de milissegundos.
// `safeSync` nunca lança, então uma pasta de plugin quebrada jamais impede o
// início da sessão.
// O import é dinâmico e dentro do try de propósito: se o arquivo irmão faltar
// ou estiver corrompido, um import estático explodiria ANTES de qualquer
// captura, jogando stack trace no início da sessão. O contrato deste script é
// sair sempre em silêncio.
async function syncUserPlugins() {
  let r;
  try {
    const { safeSync } = await import('./plugin-sync.js');
    r = safeSync(PROJECT_ROOT);
  } catch {
    return;
  }
  const linhas = [];
  if (r.activated.length) linhas.push(`ativado(s): ${r.activated.join(', ')}`);
  if (r.deactivated.length) linhas.push(`removido(s): ${r.deactivated.join(', ')}`);
  for (const item of r.rejected) linhas.push(`recusado: ${item.id} (${item.code} em ${item.file})`);
  if (!linhas.length) return;

  process.stdout.write(
    `[MIRA] Plugins: ${linhas.join(' | ')}.\n` +
    'INSTRUÇÃO AO ASSISTENTE: mencione isso ao usuário em UMA linha quando for oportuno. ' +
    'Plugin ativado só vira comando na próxima sessão. Não tome nenhuma ação por conta disso.\n'
  );
}

async function main() {
  const installed = installedVersion();
  if (!installed) process.exit(0); // pasta sem MIRA instalado — nada a fazer

  await syncUserPlugins();

  const cache = readJson(CACHE_PATH);
  const stale = !cache?.checkedAt || (Date.now() - Date.parse(cache.checkedAt)) > CACHE_TTL_MS;

  // Dispara a checagem de rede em segundo plano (para a PRÓXIMA sessão) e segue.
  if (stale) {
    try {
      const self = fileURLToPath(import.meta.url);
      spawn(process.execPath, [self, '--refresh'], {
        cwd: PROJECT_ROOT,
        detached: true,
        stdio: 'ignore',
      }).unref();
    } catch { /* não conseguiu destacar — tudo bem, tenta na próxima */ }
  }

  const latest = cache?.latest;
  if (latest && semverGt(latest, installed)) {
    process.stdout.write(
      `[MIRA] Atualização disponível: v${latest} (instalada: v${installed}).\n` +
      'INSTRUÇÃO AO ASSISTENTE: antes de qualquer outra coisa, avise o usuário em UMA linha ' +
      'que há uma versão nova do MIRA e PERGUNTE se ele quer que você atualize agora rodando ' +
      '`npx mira-animator update` nesta pasta. Só rode o comando se ele confirmar; se recusar, não insista.\n'
    );
  }
  process.exit(0);
}

await main();
