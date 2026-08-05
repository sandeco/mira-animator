import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { MIRA_ROOT } from '../utils/paths.js';
import { resolveGlobalPaths } from './paths.js';

const DEFAULT_FILE_SYSTEM = Object.freeze({
  exists: existsSync,
  rename: renameSync,
  remove: rmSync,
});

function packageVersion() {
  return JSON.parse(readFileSync(join(MIRA_ROOT, 'package.json'), 'utf8')).version;
}

function readInstallation(current) {
  const path = join(current, 'installation.json');
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function collectError(errors, operation) {
  try {
    operation();
  } catch (error) {
    errors.push(error);
  }
}

function throwRecoveryError(error, recoveryErrors, phase) {
  if (recoveryErrors.length) {
    throw new AggregateError(
      [error, ...recoveryErrors],
      `${phase} falhou: ${error.message}; recuperação falhou: ${recoveryErrors.map((item) => item.message).join(' | ')}`,
    );
  }
  throw error;
}

function cleanupStaging(staging, stateStaging, fileSystem, error) {
  const cleanupErrors = [];
  collectError(cleanupErrors, () => {
    if (fileSystem.exists(staging)) fileSystem.remove(staging, { recursive: true, force: true });
  });
  collectError(cleanupErrors, () => {
    if (fileSystem.exists(stateStaging)) fileSystem.remove(stateStaging, { force: true });
  });
  throwRecoveryError(error, cleanupErrors, 'preparo da instalação global');
}

function publishGlobal(paths, staging, stateStaging, fileSystem) {
  const backup = `${paths.current}.backup-${process.pid}-${Date.now()}`;
  const stateBackup = `${paths.state}.backup-${process.pid}-${Date.now()}`;
  let backupCreated = false;
  let published = false;
  let stateBackupCreated = false;
  let statePublished = false;
  try {
    if (existsSync(paths.current)) {
      fileSystem.rename(paths.current, backup);
      backupCreated = true;
    }
    fileSystem.rename(staging, paths.current);
    published = true;
    if (existsSync(paths.state)) {
      fileSystem.rename(paths.state, stateBackup);
      stateBackupCreated = true;
    }
    fileSystem.rename(stateStaging, paths.state);
    statePublished = true;
  } catch (error) {
    const rollbackErrors = [];
    collectError(rollbackErrors, () => {
      if (statePublished && fileSystem.exists(paths.state)) fileSystem.remove(paths.state, { force: true });
    });
    collectError(rollbackErrors, () => {
      if (stateBackupCreated && fileSystem.exists(stateBackup)) fileSystem.rename(stateBackup, paths.state);
    });
    collectError(rollbackErrors, () => {
      if (published && fileSystem.exists(paths.current)) fileSystem.remove(paths.current, { recursive: true, force: true });
    });
    collectError(rollbackErrors, () => {
      if (backupCreated && fileSystem.exists(backup)) fileSystem.rename(backup, paths.current);
    });
    collectError(rollbackErrors, () => {
      if (fileSystem.exists(staging)) fileSystem.remove(staging, { recursive: true, force: true });
    });
    collectError(rollbackErrors, () => {
      if (fileSystem.exists(stateStaging)) fileSystem.remove(stateStaging, { force: true });
    });
    throwRecoveryError(error, rollbackErrors, 'publicação global');
  }

  const cleanupErrors = [];
  collectError(cleanupErrors, () => {
    if (backupCreated && fileSystem.exists(backup)) fileSystem.remove(backup, { recursive: true, force: true });
  });
  collectError(cleanupErrors, () => {
    if (stateBackupCreated && fileSystem.exists(stateBackup)) fileSystem.remove(stateBackup, { force: true });
  });
  if (cleanupErrors.length) {
    throw new AggregateError(
      cleanupErrors,
      `publicação global concluída, mas a limpeza de backup falhou: ${cleanupErrors.map((item) => item.message).join(' | ')}`,
    );
  }
}

export function installGlobal({ paths = resolveGlobalPaths(), operation = 'install', copyDirectory = cpSync, fileSystem = DEFAULT_FILE_SYSTEM } = {}) {
  const version = packageVersion();
  const now = new Date().toISOString();
  const prior = readInstallation(paths.current);
  const staging = `${paths.current}.staging-${process.pid}-${Date.now()}`;
  const stateStaging = `${paths.state}.staging-${process.pid}-${Date.now()}`;
  mkdirSync(paths.root, { recursive: true });

  try {
    copyDirectory(join(MIRA_ROOT, 'agents'), join(staging, 'agents'), { recursive: true, force: true });
    copyDirectory(join(MIRA_ROOT, 'templates'), join(staging, 'templates'), { recursive: true, force: true });
    writeFileSync(join(staging, 'installation.json'), JSON.stringify({
      version,
      installedAt: prior?.installedAt ?? now,
      updatedAt: now,
    }, null, 2) + '\n', 'utf8');
    writeFileSync(stateStaging, JSON.stringify({ version, updatedAt: now }, null, 2) + '\n', 'utf8');
  } catch (error) {
    cleanupStaging(staging, stateStaging, fileSystem, error);
  }

  publishGlobal(paths, staging, stateStaging, fileSystem);
  return { path: paths.current, version, operation };
}

export function globalStatus({ paths = resolveGlobalPaths() } = {}) {
  if (!existsSync(paths.current) && !existsSync(paths.state)) {
    return { exists: false, corrupted: false };
  }

  const installation = readInstallation(paths.current);
  const agents = existsSync(join(paths.current, 'agents'));
  const templates = existsSync(join(paths.current, 'templates'));
  let state = null;
  try {
    state = JSON.parse(readFileSync(paths.state, 'utf8'));
  } catch {
    // Estado ausente ou inválido também torna a instalação incompleta.
  }
  const corrupted = !installation || !state || !agents || !templates;
  return {
    exists: true,
    corrupted,
    path: paths.current,
    installedVersion: installation?.version ?? '?',
    packageVersion: packageVersion(),
    agents,
    templates,
  };
}
