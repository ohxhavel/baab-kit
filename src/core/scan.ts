import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import fg from 'fast-glob';
import { parseDoc } from './frontmatter.js';
import { relPosix } from './paths.js';
import type { ParsedDoc, Workspace } from './types.js';

/** A scanned document with filesystem metadata. */
export interface ScannedDoc extends ParsedDoc {
  relPath: string;
  mtime: number;
  size: number;
}

const IGNORE = ['**/node_modules/**', '**/.git/**', '**/.baab/**', '**/dist/**'];

/** Glob and parse every markdown file in the workspace (excluding derived state). */
export async function scanDocs(ws: Workspace): Promise<ScannedDoc[]> {
  const files = await fg('**/*.md', {
    cwd: ws.root,
    ignore: IGNORE,
    dot: true,
    absolute: true,
  });
  const docs: ScannedDoc[] = [];
  for (const abs of files.sort()) {
    const [raw, st] = await Promise.all([readFile(abs, 'utf8'), stat(abs)]);
    const parsed = parseDoc(abs, raw);
    docs.push({
      ...parsed,
      relPath: relPosix(ws.root, abs),
      mtime: Math.floor(st.mtimeMs),
      size: st.size,
    });
  }
  return docs;
}

/** Newest markdown mtime in the workspace (for index-staleness checks). */
export async function newestMtime(ws: Workspace): Promise<number> {
  const files = await fg('**/*.md', { cwd: ws.root, ignore: IGNORE, dot: true, absolute: true });
  let newest = 0;
  for (const abs of files) {
    const st = await stat(abs);
    newest = Math.max(newest, Math.floor(st.mtimeMs));
  }
  // Also consider the config file itself.
  try {
    const st = await stat(path.join(ws.root, 'baab.config.json'));
    newest = Math.max(newest, Math.floor(st.mtimeMs));
  } catch {
    // ignore
  }
  return newest;
}
