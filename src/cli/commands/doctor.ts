import pc from 'picocolors';
import { validate } from '../../core/validate/index.js';
import { loadWorkspace } from '../../core/workspace.js';
import { dim, info, printJson, success } from '../output.js';

export async function runDoctor(flags: { json?: boolean }): Promise<number> {
  const ws = await loadWorkspace(process.cwd());
  const diags = await validate(ws);
  const errors = diags.filter((d) => d.severity === 'error');
  const warnings = diags.filter((d) => d.severity === 'warning');

  if (flags.json) {
    printJson({ errors: errors.length, warnings: warnings.length, diagnostics: diags });
    return errors.length > 0 ? 1 : 0;
  }

  if (diags.length === 0) {
    success('Workspace is clean — no errors, no warnings.');
    return 0;
  }

  for (const d of diags) {
    const tag = d.severity === 'error' ? pc.red(`error ${d.rule}`) : pc.yellow(`warn  ${d.rule}`);
    const loc = d.line ? `${d.path}:${d.line}` : d.path;
    info(`${tag}  ${loc}`);
    info(`  ${dim(d.message)}`);
  }
  info('');
  info(`${errors.length} error(s), ${warnings.length} warning(s).`);
  return errors.length > 0 ? 1 : 0;
}
