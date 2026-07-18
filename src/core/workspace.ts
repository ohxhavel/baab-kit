import { access } from 'node:fs/promises';
import path from 'node:path';
import { CONFIG_FILENAME, STATE_DIR, readConfig } from './config.js';
import { NotAWorkspaceError } from './errors.js';
import type { Workspace } from './types.js';

/** Walk up from `startDir` looking for a directory containing baab.config.json. */
export async function findWorkspaceRoot(startDir: string): Promise<string | null> {
  let dir = path.resolve(startDir);
  // Guard against infinite loop at the filesystem root.
  for (;;) {
    const candidate = path.join(dir, CONFIG_FILENAME);
    try {
      await access(candidate);
      return dir;
    } catch {
      // not here, go up
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/**
 * Load the workspace containing `cwd`. Walks up to find baab.config.json.
 * Throws NotAWorkspaceError if none is found.
 */
export async function loadWorkspace(cwd: string = process.cwd()): Promise<Workspace> {
  const root = await findWorkspaceRoot(cwd);
  if (!root) throw new NotAWorkspaceError(cwd);
  const config = await readConfig(root);
  const stateDir = path.join(root, STATE_DIR);
  return {
    root,
    config,
    stateDir,
    dbPath: path.join(stateDir, 'index.sqlite'),
  };
}
