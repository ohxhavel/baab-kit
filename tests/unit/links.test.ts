import { describe, expect, it } from 'vitest';
import { extractLinks, resolveLink } from '../../src/core/links.js';

describe('extractLinks', () => {
  it('extracts wikilinks with aliases and headings', () => {
    const links = extractLinks('see [[foo]] and [[bar|Bar]] and [[baz#head]]');
    expect(links).toEqual([
      { target: 'foo', kind: 'wikilink' },
      { target: 'bar', kind: 'wikilink' },
      { target: 'baz', kind: 'wikilink' },
    ]);
  });

  it('extracts relative markdown links but skips http', () => {
    const links = extractLinks('[a](./a.md) [ext](https://x.com/y.md) [b](../b.md)');
    expect(links).toEqual([
      { target: './a.md', kind: 'markdown' },
      { target: '../b.md', kind: 'markdown' },
    ]);
  });

  it('ignores links inside code fences', () => {
    const links = extractLinks('```\n[[not-a-link]]\n```\nreal [[link]]');
    expect(links).toEqual([{ target: 'link', kind: 'wikilink' }]);
  });
});

describe('resolveLink', () => {
  const all = ['a/_index.md', 'b/note.md', 'c/deep/thing.md'];

  it('resolves a markdown link relative to its source', () => {
    const r = resolveLink({ target: './note.md', kind: 'markdown' }, 'b/other.md', all);
    expect(r).toBe('b/note.md');
  });

  it('resolves a wikilink by unique basename anywhere', () => {
    const r = resolveLink({ target: 'thing', kind: 'wikilink' }, 'a/_index.md', all);
    expect(r).toBe('c/deep/thing.md');
  });

  it('returns null for a broken markdown link', () => {
    const r = resolveLink({ target: './missing.md', kind: 'markdown' }, 'b/other.md', all);
    expect(r).toBeNull();
  });

  it('returns null for a wikilink that matches nothing', () => {
    const r = resolveLink({ target: 'nope', kind: 'wikilink' }, 'a/_index.md', all);
    expect(r).toBeNull();
  });
});
