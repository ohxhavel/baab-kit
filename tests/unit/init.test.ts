import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createWorkspace } from '../../src/core/scaffold.js';
import { tempDir } from '../helpers.js';

describe('createWorkspace options', () => {
  let dir: string;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    ({ dir, cleanup } = await tempDir());
  });
  afterEach(() => cleanup());

  it('--devcontainer generates a .devcontainer/', async () => {
    const root = path.join(dir, 'A');
    const result = await createWorkspace({ name: 'A', dir: root, git: false, devcontainer: true });
    expect(existsSync(path.join(root, '.devcontainer', 'devcontainer.json'))).toBe(true);
    expect(result.filesCreated).toContain('.devcontainer/devcontainer.json');
  });

  it('default init has no .devcontainer/', async () => {
    const root = path.join(dir, 'B');
    await createWorkspace({ name: 'B', dir: root, git: false });
    expect(existsSync(path.join(root, '.devcontainer'))).toBe(false);
  });

  it('--no-claude omits the .claude/ layer', async () => {
    const root = path.join(dir, 'C');
    const result = await createWorkspace({ name: 'C', dir: root, git: false, claude: false });
    expect(existsSync(path.join(root, '.claude'))).toBe(false);
    expect(result.filesCreated.some((f) => f.startsWith('.claude/'))).toBe(false);
  });

  it('--template uses a custom workspace template', async () => {
    const tpl = path.join(dir, 'tpl');
    await mkdir(tpl, { recursive: true });
    await writeFile(path.join(tpl, 'MARKER.md'), 'custom {{name}}\n');
    const root = path.join(dir, 'D');
    const result = await createWorkspace({ name: 'D', dir: root, git: false, templateDir: tpl });
    expect(result.filesCreated).toContain('MARKER.md');
    expect(existsSync(path.join(root, 'baab.config.json'))).toBe(true);
  });
});
