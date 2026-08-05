import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { resolveGlobalPaths } from '../lib/global/paths.js';
import { installGlobal, globalStatus } from '../lib/global/installation.js';

const roots = [];

function fixture() {
  const homeDir = mkdtempSync(join(tmpdir(), 'mira-global-'));
  roots.push(homeDir);
  return resolveGlobalPaths({ homeDir });
}

function fileSystem(overrides = {}) {
  return {
    exists: existsSync,
    rename: renameSync,
    remove: rmSync,
    ...overrides,
  };
}

function failStatePublication(paths) {
  return (source, destination) => {
    if (destination === paths.state && source.startsWith(`${paths.state}.staging-`)) {
      throw new Error('falha ao publicar state');
    }
    return renameSync(source, destination);
  };
}

function captureError(operation) {
  let thrown;
  try {
    operation();
  } catch (error) {
    thrown = error;
  }
  assert.ok(thrown, 'era esperado um erro');
  return thrown;
}

test.after(() => {
  for (const root of roots) rmSync(root, { recursive: true, force: true });
});

test('global: resolve caminhos a partir do home injetado', () => {
  const homeDir = resolve('/tmp/casa com espaco');
  const paths = resolveGlobalPaths({ homeDir });
  assert.equal(paths.root, join(homeDir, '.mira'));
  assert.equal(paths.current, join(homeDir, '.mira', 'current'));
  assert.equal(paths.state, join(homeDir, '.mira', 'state.json'));
});

test('global: install cria cache sem escrever no cwd', () => {
  const paths = fixture();
  const cwd = process.cwd();
  const outside = mkdtempSync(join(tmpdir(), 'mira-global-cwd-'));
  roots.push(outside);
  process.chdir(outside);
  try {
    installGlobal({ paths });
  } finally {
    process.chdir(cwd);
  }

  assert.ok(existsSync(join(paths.current, 'agents')));
  assert.ok(existsSync(join(paths.current, 'templates')));
  assert.ok(existsSync(join(paths.current, 'installation.json')));
  assert.ok(existsSync(paths.state));
  assert.deepEqual(requireDirectoryEntries(outside), []);
});

test('global: install é idempotente', () => {
  const paths = fixture();
  const first = installGlobal({ paths });
  const second = installGlobal({ paths });

  assert.equal(second.version, first.version);
  assert.equal(globalStatus({ paths }).corrupted, false);
});

test('global: update publica uma nova instalação', () => {
  const paths = fixture();
  installGlobal({ paths });
  const result = installGlobal({ paths, operation: 'update' });

  assert.equal(result.operation, 'update');
  assert.equal(globalStatus({ paths }).exists, true);
});

test('global: update preserva instalação anterior quando a publicação falha', () => {
  const paths = fixture();
  installGlobal({ paths });
  const installation = join(paths.current, 'installation.json');
  const before = readFileSync(installation, 'utf8');
  const stateBefore = readFileSync(paths.state, 'utf8');

  assert.throws(() => installGlobal({
    paths,
    operation: 'update',
    fileSystem: fileSystem({ rename: failStatePublication(paths) }),
  }), /falha ao publicar state/);

  assert.equal(readFileSync(installation, 'utf8'), before);
  assert.equal(readFileSync(paths.state, 'utf8'), stateBefore);
  assert.equal(globalStatus({ paths }).corrupted, false);
  assert.deepEqual(readdirSync(paths.root).filter((entry) => entry.includes('.staging-')), []);
});

test('global: falha ao restaurar state não impede tentativa de restaurar current', () => {
  const paths = fixture();
  installGlobal({ paths });
  const calls = [];

  const error = captureError(() => installGlobal({
    paths,
    operation: 'update',
    fileSystem: fileSystem({
      rename(source, destination) {
        if (destination === paths.state && source.startsWith(`${paths.state}.staging-`)) {
          throw new Error('falha ao publicar state');
        }
        if (destination === paths.state && source.startsWith(`${paths.state}.backup-`)) {
          calls.push('restore-state');
          throw new Error('falha ao restaurar state');
        }
        if (destination === paths.current && source.startsWith(`${paths.current}.backup-`)) {
          calls.push('restore-current');
        }
        return renameSync(source, destination);
      },
    }),
  }));

  assert.ok(error instanceof AggregateError);
  assert.ok(calls.includes('restore-current'));
  assert.match(error.message, /falha ao publicar state/);
  assert.match(error.message, /falha ao restaurar state/);
});

test('global: falha ao restaurar current não impede restauração de state', () => {
  const paths = fixture();
  installGlobal({ paths });
  const stateBefore = readFileSync(paths.state, 'utf8');
  const calls = [];

  assert.throws(() => installGlobal({
    paths,
    operation: 'update',
    fileSystem: fileSystem({
      rename(source, destination) {
        if (destination === paths.state && source.startsWith(`${paths.state}.staging-`)) {
          throw new Error('falha ao publicar state');
        }
        if (destination === paths.current && source.startsWith(`${paths.current}.backup-`)) {
          calls.push('restore-current');
          throw new Error('falha ao restaurar current');
        }
        if (destination === paths.state && source.startsWith(`${paths.state}.backup-`)) {
          calls.push('restore-state');
        }
        return renameSync(source, destination);
      },
    }),
  }), /falha ao restaurar current/);

  assert.ok(calls.includes('restore-state'));
  assert.equal(readFileSync(paths.state, 'utf8'), stateBefore);
});

test('global: AggregateError mantém falha original e todas as falhas de recuperação', () => {
  const paths = fixture();
  installGlobal({ paths });

  const error = captureError(() => installGlobal({
    paths,
    operation: 'update',
    fileSystem: fileSystem({
      rename(source, destination) {
        if (destination === paths.state && source.startsWith(`${paths.state}.staging-`)) {
          throw new Error('falha original');
        }
        if (source.includes('.backup-') && destination === paths.state) throw new Error('falha restore state');
        if (source.includes('.backup-') && destination === paths.current) throw new Error('falha restore current');
        return renameSync(source, destination);
      },
    }),
  }));

  assert.ok(error instanceof AggregateError);
  assert.deepEqual(error.errors.map((item) => item.message), [
    'falha original',
    'falha restore state',
    'falha restore current',
  ]);
});

test('global: limpeza de backup pós-commit não desfaz a instalação publicada', () => {
  const paths = fixture();
  installGlobal({ paths });
  writeFileSync(join(paths.current, 'somente-anterior.txt'), 'antigo', 'utf8');
  let cleanupFailed = false;

  const error = captureError(() => installGlobal({
    paths,
    operation: 'update',
    fileSystem: fileSystem({
      remove(path, options) {
        if (!cleanupFailed && path.startsWith(`${paths.current}.backup-`)) {
          cleanupFailed = true;
          throw new Error('falha ao limpar backup current');
        }
        return rmSync(path, options);
      },
    }),
  }));

  assert.ok(error instanceof AggregateError);
  assert.equal(existsSync(join(paths.current, 'somente-anterior.txt')), false);
  assert.equal(globalStatus({ paths }).corrupted, false);
});

test('global: status ausente não é corrupção', () => {
  const status = globalStatus({ paths: fixture() });
  assert.deepEqual(status, { exists: false, corrupted: false });
});

test('global: status válido informa versões e integridade', () => {
  const paths = fixture();
  const installed = installGlobal({ paths });
  const status = globalStatus({ paths });

  assert.equal(status.exists, true);
  assert.equal(status.corrupted, false);
  assert.equal(status.installedVersion, installed.version);
  assert.equal(status.packageVersion, installed.version);
  assert.equal(status.path, paths.current);
});

test('global: status detecta cache corrompido', () => {
  const paths = fixture();
  installGlobal({ paths });
  writeFileSync(join(paths.current, 'installation.json'), '{invalido', 'utf8');

  assert.equal(globalStatus({ paths }).corrupted, true);
});

function requireDirectoryEntries(directory) {
  return existsSync(directory) ? readdirSync(directory) : [];
}
