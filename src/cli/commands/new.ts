import { spawnFromTemplate } from '../../core/spawn.js';
import type { Kind } from '../../core/types.js';
import { loadWorkspace } from '../../core/workspace.js';
import { info, printJson, success } from '../output.js';

export interface NewFlags {
  name?: string;
  template?: string;
  json?: boolean;
}

export async function runNew(kind: string, slug: string, flags: NewFlags): Promise<number> {
  const ws = await loadWorkspace(process.cwd());
  const result = await spawnFromTemplate(ws, {
    kind: kind as Kind,
    slug,
    name: flags.name,
    templateDir: flags.template,
  });

  if (flags.json) {
    printJson(result);
    return 0;
  }

  success(`Spawned ${kind} "${slug}" (${result.filesCreated.length} files)`);
  info(`  at ${result.targetDir}`);
  info('  index + registries refreshed');
  return 0;
}
