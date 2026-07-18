import { getStatus } from '../../core/status.js';
import { loadWorkspace } from '../../core/workspace.js';
import { dim, heading, info, printJson } from '../output.js';

export async function runStatus(flags: { json?: boolean }): Promise<number> {
  const ws = await loadWorkspace(process.cwd());
  const status = await getStatus(ws);

  if (flags.json) {
    printJson(status);
    return 0;
  }

  heading(`${status.name}  ${dim(`(${status.slug})`)}`);
  info(`  ${dim(status.root)}`);
  info('');
  info(`  documents      ${status.counts.documents}`);
  info(`  entities       ${status.counts.entities}`);
  info(`  projects       ${status.counts.projects}`);
  info(`  clients        ${status.counts.clients}`);
  info(`  apps           ${status.counts.apps}`);
  info('');
  const idx = status.index;
  info(
    `  index          ${idx.exists ? (idx.stale ? 'stale — run `baab index`' : 'fresh') : 'not built'}${idx.driver ? dim(`  (${idx.driver})`) : ''}`,
  );
  info(
    `  validation     ${status.validation.errors} error(s), ${status.validation.warnings} warning(s)`,
  );
  return 0;
}
