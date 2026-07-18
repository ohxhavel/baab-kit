import type { Diagnostic } from '../types.js';
import type { RuleContext } from './context.js';

/** Governed folders must carry a kit + index; registries must be current. */
export function kitRules(ctx: RuleContext): Diagnostic[] {
  const out: Diagnostic[] = [];
  const paths = new Set(ctx.allRelPaths);

  for (const [folder, cfg] of Object.entries(ctx.config.folders)) {
    for (const required of ['CLAUDE.md', '_index.md']) {
      if (!paths.has(`${folder}/${required}`)) {
        out.push({
          rule: 'BAAB007',
          severity: 'warning',
          path: `${folder}/${required}`,
          message: `Governed folder "${folder}" is missing ${required}.`,
        });
      }
    }

    if (cfg.kinds.length === 0) continue;

    // BAAB010: every spawned member should appear in the folder's registry JSON.
    const members = ctx.docs
      .filter((d) => {
        const rest = d.relPath.startsWith(`${folder}/`) ? d.relPath.slice(folder.length + 1) : '';
        const parts = rest.split('/');
        return parts.length === 2 && parts[1] === '_index.md';
      })
      .map((d) =>
        typeof d.frontmatter.id === 'string' ? d.frontmatter.id : d.relPath.split('/')[1],
      );

    const reg = ctx.docs.find((d) => d.relPath === `${folder}/_registry.md`);
    const listed = new Set<string>();
    if (reg) {
      const json = reg.body.match(/```json\s*([\s\S]*?)```/);
      if (json) {
        try {
          for (const row of JSON.parse(json[1]) as Array<{ id?: string }>) {
            if (row.id) listed.add(row.id);
          }
        } catch {
          // malformed block — treated as empty, members will flag below
        }
      }
    }
    for (const id of members) {
      if (!listed.has(id)) {
        out.push({
          rule: 'BAAB010',
          severity: 'warning',
          path: `${folder}/_registry.md`,
          message: `Member "${id}" is not listed in the registry — run \`baab index\`.`,
        });
      }
    }
  }
  return out;
}
