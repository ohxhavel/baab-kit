import type { Server } from 'node:http';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startServer } from '../../src/api/server.js';
import { createWorkspace } from '../../src/core/scaffold.js';
import type { Workspace } from '../../src/core/types.js';
import { loadWorkspace } from '../../src/core/workspace.js';
import { tempDir } from '../helpers.js';

describe('HTTP API', () => {
  let cleanup: () => Promise<void>;
  let ws: Workspace;

  async function serve(write: boolean): Promise<{ server: Server; base: string }> {
    // Port 0 → ephemeral, avoids collisions.
    const { server, url } = await startServer(ws, { port: 0, write });
    return { server, base: url };
  }

  beforeAll(async () => {
    const t = await tempDir();
    cleanup = t.cleanup;
    const root = path.join(t.dir, 'Acme');
    await createWorkspace({ name: 'Acme', dir: root, git: false });
    ws = await loadWorkspace(root);
  });
  afterAll(() => cleanup());

  it('serves read endpoints', async () => {
    const { server, base } = await serve(false);
    try {
      const status = await (await fetch(`${base}/status`)).json();
      expect(status.name).toBe('Acme');
      expect(status.counts.entities).toBe(1);

      const doctor = await (await fetch(`${base}/doctor`)).json();
      expect(doctor.errors).toBe(0);

      const hits = await (await fetch(`${base}/search?q=registry`)).json();
      expect(Array.isArray(hits)).toBe(true);
      expect(hits.length).toBeGreaterThan(0);

      const docs = await (await fetch(`${base}/documents`)).json();
      expect(docs.length).toBeGreaterThan(0);
    } finally {
      server.close();
    }
  });

  it('blocks writes in read-only mode (403)', async () => {
    const { server, base } = await serve(false);
    try {
      const res = await fetch(`${base}/new`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind: 'project', slug: 'x' }),
      });
      expect(res.status).toBe(403);
    } finally {
      server.close();
    }
  });

  it('allows writes with --write and 404s unknown routes', async () => {
    const { server, base } = await serve(true);
    try {
      const res = await fetch(`${base}/new`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind: 'project', slug: 'api-project' }),
      });
      expect(res.status).toBe(201);

      const missing = await fetch(`${base}/nope`);
      expect(missing.status).toBe(404);
    } finally {
      server.close();
    }
  });
});
