import { basename } from 'node:path';
import matter from 'gray-matter';
import type { ParsedDoc } from './types.js';

/**
 * gray-matter delegates YAML parsing to js-yaml, which eagerly turns
 * `created: 2026-07-18` into a JS Date. That breaks round-trips (a Date
 * re-serializes with a time+timezone) and confuses schema checks that expect a
 * string. We coerce any Date back to an ISO date string right after parsing so
 * the rest of the system only ever sees strings.
 */
function coerceDates(obj: Record<string, unknown>): Record<string, unknown> {
  for (const [key, value] of Object.entries(obj)) {
    if (value instanceof Date) {
      obj[key] = value.toISOString().slice(0, 10);
    } else if (Array.isArray(value)) {
      obj[key] = value.map((v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v));
    }
  }
  return obj;
}

/** Derive a human title: frontmatter `title`, else first H1, else filename. */
function deriveTitle(fm: Record<string, unknown>, body: string, path: string): string {
  if (typeof fm.title === 'string' && fm.title.trim()) return fm.title.trim();
  const h1 = body.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].trim();
  return basename(path).replace(/\.md$/, '');
}

/** Parse a markdown document's frontmatter and body. */
export function parseDoc(absPath: string, raw: string): ParsedDoc {
  const parsed = matter(raw);
  const frontmatter = coerceDates((parsed.data ?? {}) as Record<string, unknown>);
  const body = parsed.content ?? '';
  return {
    path: absPath,
    frontmatter,
    body,
    title: deriveTitle(frontmatter, body, absPath),
  };
}

/** Serialize a document back to markdown with YAML frontmatter. */
export function serializeDoc(doc: Pick<ParsedDoc, 'frontmatter' | 'body'>): string {
  // gray-matter's stringify emits `---\n<yaml>---\n<body>`.
  return matter.stringify(doc.body, doc.frontmatter);
}

/** True when a raw markdown string begins with a frontmatter block. */
export function hasFrontmatter(raw: string): boolean {
  return /^---\r?\n/.test(raw);
}
