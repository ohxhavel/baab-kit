import { existsSync } from 'node:fs';
import { openDb } from './db.js';
import { buildIndex } from './indexer.js';
import type { SearchHit, SearchOptions, Workspace } from './types.js';

/** Turn a free-text query into a safe FTS5 MATCH expression (prefix per term). */
export function toMatchExpr(query: string): string {
  const tokens = query.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return '""';
  return tokens
    .map((tok) => (/^[a-z0-9]+$/i.test(tok) ? `${tok}*` : `"${tok.replace(/"/g, '""')}"`))
    .join(' ');
}

/**
 * Full-text search over the workspace index. Builds the index first if it's
 * missing. Results are ranked by BM25 (lower = better; we negate so higher rank
 * = more relevant in the returned objects).
 */
export async function search(
  ws: Workspace,
  query: string,
  opts: SearchOptions = {},
): Promise<SearchHit[]> {
  if (!existsSync(ws.dbPath)) {
    await buildIndex(ws);
  }
  const db = openDb(ws.dbPath);
  try {
    const filters: string[] = ['documents_fts MATCH ?'];
    const params: unknown[] = [toMatchExpr(query)];
    if (opts.type) {
      filters.push('d.type = ?');
      params.push(opts.type);
    }
    if (opts.status) {
      filters.push('d.status = ?');
      params.push(opts.status);
    }
    if (opts.tag) {
      filters.push("(' ' || d.tags || ' ') LIKE ?");
      params.push(`% ${opts.tag} %`);
    }
    const limit = Math.max(1, Math.min(opts.limit ?? 20, 200));
    params.push(limit);

    const rows = db.all<{
      path: string;
      doc_id: string | null;
      title: string;
      type: string | null;
      snip: string;
      rank: number;
    }>(
      `SELECT d.path, d.doc_id, d.title, d.type,
              snippet(documents_fts, 1, '[', ']', '…', 12) AS snip,
              bm25(documents_fts) AS rank
         FROM documents_fts
         JOIN documents d ON d.doc_rowid = documents_fts.rowid
        WHERE ${filters.join(' AND ')}
        ORDER BY rank
        LIMIT ?`,
      params,
    );

    return rows.map((r) => ({
      path: r.path,
      docId: r.doc_id,
      title: r.title,
      type: r.type,
      snippet: r.snip,
      rank: -r.rank,
    }));
  } finally {
    db.close();
  }
}
