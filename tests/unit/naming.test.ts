import { describe, expect, it } from 'vitest';
import { isValidFilename, isValidSlug, slugify } from '../../src/core/naming.js';

describe('isValidSlug', () => {
  it('accepts lowercase-hyphenated slugs', () => {
    expect(isValidSlug('acme')).toBe(true);
    expect(isValidSlug('acme-corp')).toBe(true);
    expect(isValidSlug('q3-launch-2')).toBe(true);
  });
  it('rejects bad slugs', () => {
    expect(isValidSlug('Acme')).toBe(false);
    expect(isValidSlug('acme corp')).toBe(false);
    expect(isValidSlug('-acme')).toBe(false);
    expect(isValidSlug('acme_corp')).toBe(false);
    expect(isValidSlug('2fast')).toBe(false);
  });
});

describe('slugify', () => {
  it('coerces arbitrary text to a valid slug', () => {
    expect(slugify('Acme Corp')).toBe('acme-corp');
    expect(slugify('  Hello, World!  ')).toBe('hello-world');
    expect(isValidSlug(slugify('123 Go'))).toBe(true);
  });
});

describe('isValidFilename', () => {
  it('accepts governed and normal names', () => {
    expect(isValidFilename('_index.md')).toBe(true);
    expect(isValidFilename('_registry.md')).toBe(true);
    expect(isValidFilename('client-onboarding.md')).toBe(true);
    expect(isValidFilename('id0-acme.md')).toBe(true);
  });
  it('rejects numeric prefixes and bad casing', () => {
    expect(isValidFilename('01-intro.md')).toBe(false);
    expect(isValidFilename('MyNote.md')).toBe(false);
    expect(isValidFilename('has spaces.md')).toBe(false);
  });
});
