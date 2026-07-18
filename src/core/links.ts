import path from 'node:path';
import { toPosix } from './paths.js';
import type { RawLink } from './types.js';

// [[target]] or [[target|alias]] or [[target#heading]]
const WIKILINK_RE = /\[\[([^\]]+?)\]\]/g;
// [text](./relative.md) — only local .md targets; skip http(s) and anchors.
const MDLINK_RE = /\[[^\]]*?\]\(([^)]+?\.md)(?:#[^)]*)?\)/g;

/** Extract wikilinks and relative markdown links from a document body. */
export function extractLinks(body: string): RawLink[] {
  const links: RawLink[] = [];
  // Strip fenced code blocks so we don't index example links.
  const cleaned = body.replace(/```[\s\S]*?```/g, '').replace(/`[^`]*`/g, '');

  for (const m of cleaned.matchAll(WIKILINK_RE)) {
    const raw = m[1].split('|')[0].split('#')[0].trim();
    if (raw) links.push({ target: raw, kind: 'wikilink' });
  }
  for (const m of cleaned.matchAll(MDLINK_RE)) {
    const raw = m[1].trim();
    if (raw.startsWith('http://') || raw.startsWith('https://')) continue;
    links.push({ target: raw, kind: 'markdown' });
  }
  return links;
}

/** Normalize a candidate path to its basename without extension, lowercased. */
function stem(p: string): string {
  return path.basename(p).replace(/\.md$/i, '').toLowerCase();
}

/**
 * Resolve a link to a workspace-relative posix path, or null if it can't be
 * found. Markdown links resolve relative to the source file. Wikilinks resolve
 * Obsidian-style: exact relative path first, else unique basename match anywhere.
 */
export function resolveLink(
  link: RawLink,
  fromRelPath: string,
  allRelPaths: string[],
): string | null {
  const set = new Set(allRelPaths);

  if (link.kind === 'markdown') {
    const dir = path.posix.dirname(fromRelPath);
    const resolved = toPosix(path.posix.normalize(path.posix.join(dir, link.target)));
    return set.has(resolved) ? resolved : null;
  }

  // Wikilink: try as a direct relative/absolute path with and without .md.
  const withExt = link.target.endsWith('.md') ? link.target : `${link.target}.md`;
  const direct = toPosix(path.posix.normalize(withExt.replace(/^\//, '')));
  if (set.has(direct)) return direct;

  // Fall back to basename match anywhere in the workspace.
  const wanted = stem(link.target);
  const matches = allRelPaths.filter((p) => stem(p) === wanted);
  if (matches.length === 1) return matches[0];
  // Ambiguous or missing → unresolved (doctor treats missing as error).
  return matches.length > 1 ? matches[0] : null;
}
