import type { Diagnostic } from '../types.js';
import { type RuleContext, isScoped } from './context.js';

const REQUIRED = ['type', 'id', 'status', 'created', 'updated'] as const;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Frontmatter presence, required keys, enums, dup ids, deprecation hygiene. */
export function frontmatterRules(ctx: RuleContext): Diagnostic[] {
  const out: Diagnostic[] = [];
  const idOwners = new Map<string, string>();

  for (const doc of ctx.docs) {
    if (!isScoped(doc.relPath, ctx.config)) continue;
    const fm = doc.frontmatter;

    if (Object.keys(fm).length === 0) {
      out.push({
        rule: 'BAAB001',
        severity: 'error',
        path: doc.relPath,
        message: 'Missing frontmatter block (expected a YAML `---` header).',
      });
      continue;
    }

    for (const key of REQUIRED) {
      if (fm[key] === undefined || fm[key] === null || fm[key] === '') {
        out.push({
          rule: 'BAAB002',
          severity: 'error',
          path: doc.relPath,
          message: `Missing required frontmatter key "${key}".`,
        });
      }
    }

    if (typeof fm.type === 'string' && !ctx.config.frontmatter.types.includes(fm.type)) {
      out.push({
        rule: 'BAAB003',
        severity: 'error',
        path: doc.relPath,
        message: `type "${fm.type}" is not in the configured enum (${ctx.config.frontmatter.types.join(', ')}).`,
      });
    }
    if (typeof fm.status === 'string' && !ctx.config.frontmatter.statuses.includes(fm.status)) {
      out.push({
        rule: 'BAAB003',
        severity: 'error',
        path: doc.relPath,
        message: `status "${fm.status}" is not in the configured enum (${ctx.config.frontmatter.statuses.join(', ')}).`,
      });
    }

    for (const key of ['created', 'updated'] as const) {
      if (typeof fm[key] === 'string' && !DATE_RE.test(fm[key] as string)) {
        out.push({
          rule: 'BAAB003',
          severity: 'warning',
          path: doc.relPath,
          message: `${key} "${fm[key]}" is not a YYYY-MM-DD date.`,
        });
      }
    }

    if (typeof fm.id === 'string' && fm.id) {
      const prev = idOwners.get(fm.id);
      if (prev) {
        out.push({
          rule: 'BAAB004',
          severity: 'error',
          path: doc.relPath,
          message: `Duplicate id "${fm.id}" (also used by ${prev}).`,
        });
      } else {
        idOwners.set(fm.id, doc.relPath);
      }
    }

    if (fm.status === 'deprecated' && !fm.superseded_by) {
      out.push({
        rule: 'BAAB009',
        severity: 'warning',
        path: doc.relPath,
        message: 'status is "deprecated" but no `superseded_by` is set.',
      });
    }
  }

  return out;
}
