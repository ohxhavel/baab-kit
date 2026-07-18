import { mkdir, rm } from 'node:fs/promises';
import { openDb } from './db.js';
import { extractLinks, resolveLink } from './links.js';
import { updateRegistries } from './registry.js';
import { scanDocs } from './scan.js';
import type { IndexStats, Workspace } from './types.js';

const SCHEMA = `
CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT);

CREATE TABLE documents (
  doc_rowid   INTEGER PRIMARY KEY,
  path        TEXT NOT NULL UNIQUE,
  doc_id      TEXT,
  type        TEXT,
  status      TEXT,
  title       TEXT,
  created     TEXT,
  updated     TEXT,
  tags        TEXT,
  frontmatter TEXT,
  mtime       INTEGER,
  size        INTEGER
);
CREATE INDEX idx_documents_type   ON documents(type);
CREATE INDEX idx_documents_doc_id ON documents(doc_id);

CREATE VIRTUAL TABLE documents_fts USING fts5(
  title, body, tags, tokenize='porter unicode61'
);

CREATE TABLE links (
  source_path   TEXT NOT NULL,
  target_raw    TEXT NOT NULL,
  kind          TEXT,
  resolved_path TEXT
);
CREATE INDEX idx_links_source ON links(source_path);
`;

function tagString(fm: Record<string, unknown>): string {
  const t = fm.tags;
  if (Array.isArray(t)) return t.filter((x) => typeof x === 'string').join(' ');
  if (typeof t === 'string') return t;
  return '';
}

/**
 * Full rebuild of the SQLite index and generated registries. The database is
 * disposable derived state, so we recreate it from scratch every run — correct
 * by construction, no incremental-sync bugs. Workspaces are small enough that a
 * full pass is cheap.
 */
export async function buildIndex(ws: Workspace): Promise<IndexStats> {
  await mkdir(ws.stateDir, { recursive: true });
  await rm(ws.dbPath, { force: true });

  const docs = await scanDocs(ws);
  const allRelPaths = docs.map((d) => d.relPath);

  const db = openDb(ws.dbPath);
  let brokenLinks = 0;
  let linkCount = 0;
  try {
    db.exec('PRAGMA journal_mode = WAL;');
    db.exec(SCHEMA);
    db.exec('BEGIN');

    let rowid = 0;
    for (const doc of docs) {
      rowid += 1;
      const fm = doc.frontmatter;
      db.run(
        `INSERT INTO documents
          (doc_rowid, path, doc_id, type, status, title, created, updated, tags, frontmatter, mtime, size)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
        [
          rowid,
          doc.relPath,
          typeof fm.id === 'string' ? fm.id : null,
          typeof fm.type === 'string' ? fm.type : null,
          typeof fm.status === 'string' ? fm.status : null,
          doc.title,
          typeof fm.created === 'string' ? fm.created : null,
          typeof fm.updated === 'string' ? fm.updated : null,
          tagString(fm),
          JSON.stringify(fm),
          doc.mtime,
          doc.size,
        ],
      );
      db.run('INSERT INTO documents_fts (rowid, title, body, tags) VALUES (?,?,?,?)', [
        rowid,
        doc.title,
        doc.body,
        tagString(fm),
      ]);

      for (const link of extractLinks(doc.body)) {
        const resolved = resolveLink(link, doc.relPath, allRelPaths);
        if (!resolved) brokenLinks += 1;
        linkCount += 1;
        db.run(
          'INSERT INTO links (source_path, target_raw, kind, resolved_path) VALUES (?,?,?,?)',
          [doc.relPath, link.target, link.kind, resolved],
        );
      }
    }
    db.exec('COMMIT');

    const registries = await updateRegistries(ws, docs);
    const builtAtMs = Date.now();
    const builtAt = new Date(builtAtMs).toISOString();
    for (const [key, value] of [
      ['schema_version', '1'],
      ['built_at', builtAt],
      ['built_at_ms', String(builtAtMs)],
      ['baab_driver', db.driver],
      ['documents', String(docs.length)],
    ]) {
      db.run('INSERT OR REPLACE INTO meta (key, value) VALUES (?,?)', [key, value]);
    }

    return {
      driver: db.driver,
      documents: docs.length,
      links: linkCount,
      brokenLinks,
      registries,
      builtAt,
    };
  } finally {
    db.close();
  }
}
