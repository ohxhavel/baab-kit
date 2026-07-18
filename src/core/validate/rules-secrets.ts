import type { Diagnostic } from '../types.js';
import type { RuleContext } from './context.js';

// Secret-value signatures. `op://vault/item/field` references are explicitly
// allowed (that's the sanctioned way to reference a secret) and never matched.
const SIGNATURES: Array<{ label: string; re: RegExp }> = [
  { label: 'AWS access key id', re: /\bAKIA[0-9A-Z]{16}\b/ },
  { label: 'GitHub token', re: /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{36,}\b/ },
  { label: 'GitHub fine-grained PAT', re: /\bgithub_pat_[A-Za-z0-9_]{22,}\b/ },
  { label: 'Slack token', re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/ },
  { label: 'OpenAI-style key', re: /\bsk-[A-Za-z0-9]{20,}\b/ },
  { label: 'private key block', re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  {
    label: 'inline credential',
    re: /\b(api[_-]?key|secret|token|password|passwd)\b\s*[:=]\s*['"]?[A-Za-z0-9+/_-]{16,}['"]?/i,
  },
];

/** Detect committed secret *values* (as opposed to `op://` references). */
export function secretRules(ctx: RuleContext): Diagnostic[] {
  const out: Diagnostic[] = [];
  for (const doc of ctx.docs) {
    // Scan body + serialized frontmatter values.
    const haystack = `${doc.body}\n${JSON.stringify(doc.frontmatter)}`;
    const lines = haystack.split('\n');
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      if (line.includes('op://')) continue; // sanctioned reference form
      for (const sig of SIGNATURES) {
        if (sig.re.test(line)) {
          out.push({
            rule: 'BAAB008',
            severity: 'error',
            path: doc.relPath,
            line: i + 1,
            message: `Possible ${sig.label} committed as a value. Use an op:// reference instead.`,
          });
          break;
        }
      }
    }
  }
  return out;
}
