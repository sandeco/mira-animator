import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

export function resolveGlobalPaths({ homeDir = homedir() } = {}) {
  const root = join(resolve(homeDir), '.mira');
  return {
    root,
    current: join(root, 'current'),
    state: join(root, 'state.json'),
  };
}
