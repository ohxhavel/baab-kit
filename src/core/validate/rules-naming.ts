import { isValidFilename } from '../naming.js';
import type { Diagnostic } from '../types.js';
import { type RuleContext, isScoped } from './context.js';

/** Filename naming law: lowercase-hyphenated, no numeric prefix, `_` reserved. */
export function namingRules(ctx: RuleContext): Diagnostic[] {
  const out: Diagnostic[] = [];
  for (const doc of ctx.docs) {
    if (!isScoped(doc.relPath, ctx.config)) continue;
    const base = doc.relPath.split('/').pop() ?? '';
    if (!isValidFilename(base)) {
      out.push({
        rule: 'BAAB005',
        severity: 'warning',
        path: doc.relPath,
        message: `Filename "${base}" is not lowercase-hyphenated (or uses a numeric/underscore prefix).`,
      });
    }
  }
  return out;
}
