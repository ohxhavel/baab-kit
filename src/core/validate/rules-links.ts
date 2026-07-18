import { extractLinks, resolveLink } from '../links.js';
import type { Diagnostic } from '../types.js';
import type { RuleContext } from './context.js';

/** Broken wikilinks and relative markdown links. */
export function linkRules(ctx: RuleContext): Diagnostic[] {
  const out: Diagnostic[] = [];
  for (const doc of ctx.docs) {
    for (const link of extractLinks(doc.body)) {
      const resolved = resolveLink(link, doc.relPath, ctx.allRelPaths);
      if (!resolved) {
        out.push({
          rule: 'BAAB006',
          severity: 'error',
          path: doc.relPath,
          message: `Broken ${link.kind}: "${link.target}" resolves to nothing.`,
        });
      }
    }
  }
  return out;
}
