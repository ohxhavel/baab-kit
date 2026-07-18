import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TemplateNotFoundError } from '../../src/core/errors.js';
import { renderString, renderTree } from '../../src/core/templates.js';
import type { TemplateVars } from '../../src/core/types.js';
import { tempDir } from '../helpers.js';

const vars: TemplateVars = {
  name: 'Acme',
  slug: 'acme',
  id: 'acme',
  date: '2026-01-01',
  year: '2026',
  kind: 'entity',
};

describe('renderString', () => {
  it('replaces known vars and leaves unknown tokens intact', () => {
    expect(renderString('{{name}} / {{slug}} / {{other}}', vars)).toBe('Acme / acme / {{other}}');
  });
});

describe('renderTree', () => {
  let dir: string;
  let cleanup: () => Promise<void>;

  beforeEach(async () => {
    ({ dir, cleanup } = await tempDir());
  });
  afterEach(() => cleanup());

  it('renders contents, path vars, and dot- filenames; skips existing files', async () => {
    const src = path.join(dir, 'src');
    const dest = path.join(dir, 'dest');
    await mkdir(path.join(src, '{{slug}}'), { recursive: true });
    await writeFile(path.join(src, 'dot-gitignore'), 'ignore {{slug}}\n');
    await writeFile(path.join(src, '{{slug}}', 'note.md'), '# {{name}}\n');

    // Pre-create one destination file; render must not clobber it.
    await mkdir(dest, { recursive: true });
    await writeFile(path.join(dest, '.gitignore'), 'PRE-EXISTING\n');

    const created = await renderTree(src, dest, vars);

    // dot- mapping + var-in-path
    expect(created).toContain('acme/note.md');
    expect(await readFile(path.join(dest, 'acme', 'note.md'), 'utf8')).toBe('# Acme\n');
    // existing file untouched and NOT in the created list
    expect(await readFile(path.join(dest, '.gitignore'), 'utf8')).toBe('PRE-EXISTING\n');
    expect(created).not.toContain('.gitignore');
  });

  it('throws TemplateNotFoundError for a missing source dir', async () => {
    await expect(renderTree(path.join(dir, 'nope'), dir, vars)).rejects.toBeInstanceOf(
      TemplateNotFoundError,
    );
  });
});
