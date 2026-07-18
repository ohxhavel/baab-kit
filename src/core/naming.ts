// Naming law: lowercase letters, digits, hyphens. No leading underscore
// (reserved for governance/meta files), no purely numeric prefix segment.

const SLUG_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/** True when `slug` obeys the naming law. */
export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}

/** Coerce arbitrary text into a valid slug. */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/^([0-9])/, 's$1') // avoid a leading digit
    .replace(/-{2,}/g, '-');
}

/**
 * True when a markdown filename obeys the naming law. Governance files may start
 * with a single underscore (`_index.md`, `_registry.md`, `_template`).
 */
export function isValidFilename(name: string): boolean {
  const base = name.replace(/\.md$/, '');
  const meta = base.startsWith('_') ? base.slice(1) : base;
  if (meta === '') return false;
  // No numeric-only prefix like "01-foo"; allow "id0-foo" (starts with a letter).
  if (/^\d/.test(meta)) return false;
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(meta);
}
