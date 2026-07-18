import { describe, expect, it } from 'vitest';
import { hasFrontmatter, parseDoc, serializeDoc } from '../../src/core/frontmatter.js';

describe('frontmatter', () => {
  it('parses type/id/status and keeps dates as strings', () => {
    const raw = [
      '---',
      'type: project',
      'id: demo',
      'status: active',
      'created: 2026-07-18',
      'updated: 2026-07-18',
      'tags: [a, b]',
      '---',
      '',
      '# Demo',
      'body text',
    ].join('\n');
    const doc = parseDoc('/x/demo.md', raw);
    expect(doc.frontmatter.type).toBe('project');
    expect(doc.frontmatter.id).toBe('demo');
    // The critical gotcha: unquoted YAML dates must not become Date objects.
    expect(doc.frontmatter.created).toBe('2026-07-18');
    expect(typeof doc.frontmatter.created).toBe('string');
    expect(doc.title).toBe('Demo');
  });

  it('round-trips without mangling the date', () => {
    const raw = ['---', 'id: x', 'created: 2026-01-01', '---', '', 'hi'].join('\n');
    const doc = parseDoc('/x/x.md', raw);
    const out = serializeDoc(doc);
    const again = parseDoc('/x/x.md', out);
    expect(again.frontmatter.created).toBe('2026-01-01');
  });

  it('derives title from filename when no h1 or title field', () => {
    const doc = parseDoc('/x/my-note.md', '---\nid: n\n---\n\njust body');
    expect(doc.title).toBe('my-note');
  });

  it('detects the presence of a frontmatter block', () => {
    expect(hasFrontmatter('---\nid: x\n---\n')).toBe(true);
    expect(hasFrontmatter('# no frontmatter')).toBe(false);
  });

  it('reports empty frontmatter as an empty object', () => {
    const doc = parseDoc('/x/plain.md', '# Just a heading\n\ntext');
    expect(Object.keys(doc.frontmatter)).toHaveLength(0);
  });
});
