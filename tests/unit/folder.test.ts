import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { readConfig } from '../../src/core/config.js';
import { BaabError, InvalidSlugError } from '../../src/core/errors.js';
import { addFolder } from '../../src/core/folder.js';
import { createWorkspace } from '../../src/core/scaffold.js';
import type { Workspace } from '../../src/core/types.js';
import { validate } from '../../src/core/validate/index.js';
import { loadWorkspace } from '../../src/core/workspace.js';
import { tempDir } from '../helpers.js';

describe('addFolder', () => {
  let dir: string;
  let cleanup: () => Promise<void>;
  let ws: Workspace;

  beforeEach(async () => {
    ({ dir, cleanup } = await tempDir());
    const root = path.join(dir, 'Acme');
    await createWorkspace({ name: 'Acme', dir: root, git: false });
    ws = await loadWorkspace(root);
  });
  afterEach(() => cleanup());

  it('creates a governed folder, registers it, and stays doctor-clean', async () => {
    const result = await addFolder(ws, { name: 'strategy', kinds: [] });
    expect(result.filesCreated).toContain('strategy/CLAUDE.md');
    expect(result.filesCreated).toContain('strategy/_index.md');

    const cfg = await readConfig(ws.root);
    expect(cfg.folders.strategy).toEqual({ kinds: [] });

    const errors = (await validate(await loadWorkspace(ws.root))).filter(
      (d) => d.severity === 'error',
    );
    expect(errors).toEqual([]);
  });

  it('generates a registry for a folder that hosts a kind', async () => {
    await addFolder(ws, { name: 'campaigns', kinds: ['project'] });
    const reg = await readFile(path.join(ws.root, 'campaigns', '_registry.md'), 'utf8');
    expect(reg).toContain('baab:registry:start');
  });

  it('rejects an invalid folder name', async () => {
    await expect(addFolder(ws, { name: 'Bad Name' })).rejects.toBeInstanceOf(InvalidSlugError);
  });

  it('rejects a folder that already exists', async () => {
    await expect(addFolder(ws, { name: 'projects' })).rejects.toBeInstanceOf(BaabError);
  });
});
