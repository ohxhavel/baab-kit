import { addFolder } from '../../core/folder.js';
import type { Kind } from '../../core/types.js';
import { loadWorkspace } from '../../core/workspace.js';
import { info, printJson, success } from '../output.js';

export interface FolderAddFlags {
  kind?: string[];
  json?: boolean;
}

export async function runFolderAdd(name: string, flags: FolderAddFlags): Promise<number> {
  const ws = await loadWorkspace(process.cwd());
  const result = await addFolder(ws, {
    name,
    kinds: (flags.kind ?? []) as Kind[],
  });

  if (flags.json) {
    printJson(result);
    return 0;
  }

  success(`Added folder "${result.name}" (${result.filesCreated.length} files)`);
  if (result.kinds.length > 0) info(`  hosts kinds: ${result.kinds.join(', ')}`);
  info('  registered in baab.config.json; index refreshed');
  return 0;
}
