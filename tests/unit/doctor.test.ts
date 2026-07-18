import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createWorkspace } from '../../src/core/scaffold.js';
import type { Workspace } from '../../src/core/types.js';
import { validate } from '../../src/core/validate/index.js';
import { loadWorkspace } from '../../src/core/workspace.js';
import { tempDir } from '../helpers.js';

async function write(ws: Workspace, rel: string, content: string): Promise<void> {
  const abs = path.join(ws.root, rel);
  await mkdir(path.dirname(abs), { recursive: true });
  await writeFile(abs, content, 'utf8');
}

/** Rule ids present in a validation run over the workspace. */
async function rules(ws: Workspace): Promise<Set<string>> {
  return new Set((await validate(ws)).map((d) => d.rule));
}

describe('doctor rules', () => {
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

  it('BAAB001: flags a scoped note with no frontmatter', async () => {
    await write(ws, 'operations/no-fm.md', '# Just a heading, no frontmatter');
    expect(await rules(ws)).toContain('BAAB001');
  });

  it('BAAB002: flags a note missing a required key', async () => {
    await write(ws, 'operations/partial.md', '---\ntype: runbook\nid: partial\n---\n\nbody');
    expect(await rules(ws)).toContain('BAAB002');
  });

  it('BAAB003: flags a type outside the enum', async () => {
    await write(
      ws,
      'operations/weird.md',
      '---\ntype: wizardry\nid: weird\nstatus: active\ncreated: 2026-01-01\nupdated: 2026-01-01\n---\n\nbody',
    );
    expect(await rules(ws)).toContain('BAAB003');
  });

  it('BAAB004: flags a duplicate id', async () => {
    const fm = (id: string) =>
      `---\ntype: concept\nid: ${id}\nstatus: active\ncreated: 2026-01-01\nupdated: 2026-01-01\n---\n\nbody`;
    await write(ws, 'operations/one.md', fm('twins'));
    await write(ws, 'operations/two.md', fm('twins'));
    expect(await rules(ws)).toContain('BAAB004');
  });

  it('BAAB005: flags a bad filename', async () => {
    await write(
      ws,
      'operations/BadName.md',
      '---\ntype: concept\nid: badname\nstatus: active\ncreated: 2026-01-01\nupdated: 2026-01-01\n---\n\nbody',
    );
    expect(await rules(ws)).toContain('BAAB005');
  });

  it('BAAB006: flags a broken link', async () => {
    await write(
      ws,
      'operations/linky.md',
      '---\ntype: concept\nid: linky\nstatus: active\ncreated: 2026-01-01\nupdated: 2026-01-01\n---\n\nsee [[does-not-exist-anywhere]]',
    );
    expect(await rules(ws)).toContain('BAAB006');
  });

  it('BAAB008: flags a committed secret value, not an op:// ref', async () => {
    await write(
      ws,
      'operations/leak.md',
      '---\ntype: concept\nid: leak\nstatus: active\ncreated: 2026-01-01\nupdated: 2026-01-01\n---\n\ntoken = AKIAIOSFODNN7EXAMPLE',
    );
    expect(await rules(ws)).toContain('BAAB008');
  });

  it('BAAB008: does NOT flag an op:// reference', async () => {
    await write(
      ws,
      'operations/safe.md',
      '---\ntype: concept\nid: safe\nstatus: active\ncreated: 2026-01-01\nupdated: 2026-01-01\n---\n\nkey: op://vault/item/field',
    );
    const found = (await validate(ws)).filter((d) => d.rule === 'BAAB008');
    expect(found).toEqual([]);
  });

  it('BAAB007: flags a governed folder missing its kit', async () => {
    await rm(path.join(ws.root, 'operations', 'CLAUDE.md'));
    expect(await rules(ws)).toContain('BAAB007');
  });

  it('BAAB009: flags a deprecated note without superseded_by', async () => {
    await write(
      ws,
      'operations/old.md',
      '---\ntype: concept\nid: old\nstatus: deprecated\ncreated: 2026-01-01\nupdated: 2026-01-01\n---\n\nbody',
    );
    expect(await rules(ws)).toContain('BAAB009');
  });

  it('BAAB010: flags a spawned member missing from its registry', async () => {
    // Write a project member's _index.md directly, without running `baab index`,
    // so projects/_registry.md does not yet list it.
    await write(
      ws,
      'projects/ghost/_index.md',
      '---\ntype: project\nid: ghost\nstatus: planned\ncreated: 2026-01-01\nupdated: 2026-01-01\n---\n\n# Ghost',
    );
    expect(await rules(ws)).toContain('BAAB010');
  });

  it('a freshly created workspace has zero errors', async () => {
    const errors = (await validate(ws)).filter((d) => d.severity === 'error');
    expect(errors).toEqual([]);
  });
});
