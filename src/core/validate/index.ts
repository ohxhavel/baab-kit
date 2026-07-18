import { type ScannedDoc, scanDocs } from '../scan.js';
import type { Diagnostic, Workspace } from '../types.js';
import type { RuleContext } from './context.js';
import { frontmatterRules } from './rules-frontmatter.js';
import { kitRules } from './rules-kits.js';
import { linkRules } from './rules-links.js';
import { namingRules } from './rules-naming.js';
import { secretRules } from './rules-secrets.js';

export interface ValidateOptions {
  /** Provide pre-scanned docs to avoid a re-scan (status reuse). */
  docs?: ScannedDoc[];
}

const RULES = [frontmatterRules, namingRules, linkRules, kitRules, secretRules];

/** Run every validation rule; returns diagnostics sorted by severity then path. */
export async function validate(ws: Workspace, opts: ValidateOptions = {}): Promise<Diagnostic[]> {
  const docs = opts.docs ?? (await scanDocs(ws));
  const ctx: RuleContext = {
    ws,
    config: ws.config,
    docs,
    allRelPaths: docs.map((d) => d.relPath),
  };

  const findings = RULES.flatMap((rule) => rule(ctx));
  const order = { error: 0, warning: 1 };
  return findings.sort(
    (a, b) =>
      order[a.severity] - order[b.severity] ||
      a.path.localeCompare(b.path) ||
      a.rule.localeCompare(b.rule),
  );
}

export type { RuleContext } from './context.js';
