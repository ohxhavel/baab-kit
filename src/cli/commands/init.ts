import path from 'node:path';
import { createWorkspace } from '../../core/scaffold.js';
import { info, printJson, success } from '../output.js';

export interface InitFlags {
  dir?: string;
  git?: boolean;
  claude?: boolean;
  devcontainer?: boolean;
  template?: string;
  json?: boolean;
}

export async function runInit(name: string, flags: InitFlags): Promise<number> {
  const dir = flags.dir ?? path.join(process.cwd(), name);
  const result = await createWorkspace({
    name,
    dir,
    git: flags.git,
    claude: flags.claude,
    devcontainer: flags.devcontainer,
    templateDir: flags.template,
  });

  if (flags.json) {
    printJson(result);
    return 0;
  }

  success(`Created workspace "${name}" at ${result.root}`);
  info(
    `  ${result.filesCreated.length} files · index: ${result.indexStats.documents} docs · ${result.indexStats.driver}`,
  );
  if (result.gitInitialized) info('  git initialized with an initial commit');
  info('');
  info('Next:');
  info(`  cd ${path.relative(process.cwd(), result.root) || '.'}`);
  info('  baab status');
  info('  baab new project my-first-project');
  return 0;
}
