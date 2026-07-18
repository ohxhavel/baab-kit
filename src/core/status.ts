import { existsSync } from 'node:fs';
import { openDb } from './db.js';
import { newestMtime, scanDocs } from './scan.js';
import type { SqliteDriver, Workspace, WorkspaceStatus } from './types.js';
import { validate } from './validate/index.js';

/** Read the index meta table into a simple map. */
function readMeta(dbPath: string): Record<string, string> {
  const db = openDb(dbPath);
  try {
    const rows = db.all<{ key: string; value: string }>('SELECT key, value FROM meta');
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  } catch {
    return {};
  } finally {
    db.close();
  }
}

/** Build a one-screen overview of the workspace. */
export async function getStatus(ws: Workspace): Promise<WorkspaceStatus> {
  const docs = await scanDocs(ws);
  const countType = (t: string) => docs.filter((d) => d.frontmatter.type === t).length;

  const diags = await validate(ws, { docs });

  const indexExists = existsSync(ws.dbPath);
  let builtAt: string | null = null;
  let driver: SqliteDriver | null = null;
  let stale = false;
  if (indexExists) {
    const meta = readMeta(ws.dbPath);
    builtAt = meta.built_at ?? null;
    driver = (meta.baab_driver as SqliteDriver) ?? null;
    const builtMs = Number(meta.built_at_ms ?? 0);
    stale = (await newestMtime(ws)) > builtMs;
  }

  return {
    name: ws.config.name,
    slug: ws.config.slug,
    root: ws.root,
    counts: {
      documents: docs.length,
      entities: countType('entity'),
      projects: countType('project'),
      clients: countType('client'),
      apps: countType('app'),
    },
    index: {
      exists: indexExists,
      builtAt,
      stale,
      driver,
    },
    validation: {
      errors: diags.filter((d) => d.severity === 'error').length,
      warnings: diags.filter((d) => d.severity === 'warning').length,
    },
  };
}
