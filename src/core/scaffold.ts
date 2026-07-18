import { existsSync } from 'node:fs';
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { CONFIG_FILENAME, defaultConfig, serializeConfig } from './config.js';
import { today, year } from './dates.js';
import { WorkspaceExistsError } from './errors.js';
import { gitAvailable, initRepo } from './git.js';
import { buildIndex } from './indexer.js';
import { slugify } from './naming.js';
import { spawnFromTemplate } from './spawn.js';
import { renderTree, resolveWorkspaceTemplateDir } from './templates.js';
import type { InitResult, TemplateVars, Workspace } from './types.js';
import { baabVersion } from './version.js';
import { loadWorkspace } from './workspace.js';

export interface InitOptions {
  /** Display name of the workspace/business. */
  name: string;
  /** Target directory (default: ./<name>). */
  dir: string;
  /** Initialize a git repo + first commit (default: true). */
  git?: boolean;
  /** Include the .claude/ integration layer (default: true). */
  claude?: boolean;
  /** Override the workspace template dir. */
  templateDir?: string;
}

async function isEmptyDir(dir: string): Promise<boolean> {
  if (!existsSync(dir)) return true;
  const entries = await readdir(dir);
  return entries.filter((e) => e !== '.git').length === 0;
}

/**
 * Scaffold a complete workspace: render the template tree, write the manifest,
 * seed the workspace's own business entity, build the index, and (optionally)
 * initialize git. The workspace is born indexed and passing its own linter.
 */
export async function createWorkspace(opts: InitOptions): Promise<InitResult> {
  const name = opts.name.trim();
  const slug = slugify(name);
  const dir = path.resolve(opts.dir);

  if (!(await isEmptyDir(dir))) throw new WorkspaceExistsError(dir);
  await mkdir(dir, { recursive: true });

  const vars: TemplateVars = {
    name,
    slug,
    id: slug,
    date: today(),
    year: year(),
    kind: 'entity',
  };

  // 1. Render the workspace template tree.
  const created = await renderTree(resolveWorkspaceTemplateDir(opts.templateDir), dir, vars);

  // 2. Optionally drop the .claude/ layer if disabled.
  let files = created;
  if (opts.claude === false) {
    await rm(path.join(dir, '.claude'), { recursive: true, force: true });
    files = created.filter((f) => !f.startsWith('.claude/'));
  }

  // 3. Write the manifest.
  const config = defaultConfig(name, slug, `baab@${baabVersion()}`);
  await writeFile(path.join(dir, CONFIG_FILENAME), serializeConfig(config), 'utf8');
  files.push(CONFIG_FILENAME);

  // 4. Load the workspace and seed its own business entity into registry/.
  const ws: Workspace = await loadWorkspace(dir);
  const seed = await spawnFromTemplate(ws, {
    kind: 'entity',
    slug,
    name,
    skipIndex: true,
  });
  files.push(...seed.filesCreated);

  // 5. Build the index + registries.
  const indexStats = await buildIndex(ws);

  // 6. Optionally initialize git (after index so .baab is gitignored out).
  let gitInitialized = false;
  if (opts.git !== false && (await gitAvailable())) {
    await initRepo(dir);
    gitInitialized = true;
  }

  return {
    root: dir,
    filesCreated: files.sort(),
    gitInitialized,
    indexStats,
  };
}
