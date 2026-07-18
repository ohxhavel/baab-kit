import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DuplicateIdError, InvalidSlugError } from '../../src/core/errors.js';
import { buildIndex } from '../../src/core/indexer.js';
import { createWorkspace } from '../../src/core/scaffold.js';
import { search } from '../../src/core/search.js';
import { spawnFromTemplate } from '../../src/core/spawn.js';
import { getStatus } from '../../src/core/status.js';
import type { Workspace } from '../../src/core/types.js';
import { validate } from '../../src/core/validate/index.js';
import { loadWorkspace } from '../../src/core/workspace.js';
import { tempDir } from '../helpers.js';

describe('workspace lifecycle', () => {
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

  it('creates a workspace that passes its own doctor', async () => {
    const diags = await validate(ws);
    const errors = diags.filter((d) => d.severity === 'error');
    expect(errors).toEqual([]);
  });

  it('seeds the business as an entity in the registry', async () => {
    const status = await getStatus(ws);
    expect(status.counts.entities).toBe(1);
    expect(status.slug).toBe('acme');
  });

  it('spawns each kind and stays doctor-clean', async () => {
    await spawnFromTemplate(ws, { kind: 'project', slug: 'launch', skipIndex: true });
    await spawnFromTemplate(ws, { kind: 'client', slug: 'globex', skipIndex: true });
    await spawnFromTemplate(ws, { kind: 'app', slug: 'vercel', skipIndex: true });
    await buildIndex(ws);
    const errors = (await validate(ws)).filter((d) => d.severity === 'error');
    expect(errors).toEqual([]);
  });

  it('rejects an invalid slug', async () => {
    await expect(
      spawnFromTemplate(ws, { kind: 'project', slug: 'Bad Slug', skipIndex: true }),
    ).rejects.toBeInstanceOf(InvalidSlugError);
  });

  it('rejects a duplicate id', async () => {
    await spawnFromTemplate(ws, { kind: 'project', slug: 'dup', skipIndex: true });
    await buildIndex(ws);
    await expect(
      spawnFromTemplate(ws, { kind: 'client', slug: 'dup', skipIndex: true }),
    ).rejects.toBeInstanceOf(DuplicateIdError);
  });

  it('regenerates registries idempotently', async () => {
    await spawnFromTemplate(ws, { kind: 'project', slug: 'launch', skipIndex: true });
    await buildIndex(ws);
    const regPath = path.join(ws.root, 'projects', '_registry.md');
    const first = await readFile(regPath, 'utf8');
    await buildIndex(ws);
    const second = await readFile(regPath, 'utf8');
    expect(second).toBe(first);
  });

  it('preserves prose outside the registry markers', async () => {
    const regPath = path.join(ws.root, 'projects', '_registry.md');
    const withProse = `${await readFile(regPath, 'utf8')}\n\nHand-written footnote.\n`;
    await writeFile(regPath, withProse, 'utf8');
    await buildIndex(ws);
    expect(await readFile(regPath, 'utf8')).toContain('Hand-written footnote.');
  });

  it('finds seeded content via full-text search', async () => {
    const hits = await search(ws, 'registry');
    expect(hits.length).toBeGreaterThan(0);
  });

  it('reports a fresh index right after building', async () => {
    const status = await getStatus(ws);
    expect(status.index.exists).toBe(true);
    expect(status.index.stale).toBe(false);
  });
});
