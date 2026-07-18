import { buildIndex } from '../../core/indexer.js';
import { loadWorkspace } from '../../core/workspace.js';
import { info, printJson, success, warn } from '../output.js';

export async function runIndex(flags: { json?: boolean }): Promise<number> {
  const ws = await loadWorkspace(process.cwd());
  const stats = await buildIndex(ws);

  if (flags.json) {
    printJson(stats);
    return 0;
  }

  success(`Indexed ${stats.documents} documents (${stats.driver})`);
  info(`  ${stats.links} links, ${stats.brokenLinks} broken`);
  info(`  registries: ${stats.registries.folders.join(', ')} (${stats.registries.rows} rows)`);
  if (stats.brokenLinks > 0)
    warn(`${stats.brokenLinks} broken links — run \`baab doctor\` for details`);
  return 0;
}
