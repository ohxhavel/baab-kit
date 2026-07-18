import { existsSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { CONFIG_FILENAME, serializeConfig } from './config.js';
import { today, year } from './dates.js';
import { BaabError, InvalidSlugError } from './errors.js';
import { buildIndex } from './indexer.js';
import { isValidSlug } from './naming.js';
import { renderTree, resolveFolderTemplateDir } from './templates.js';
import type { Kind, TemplateVars, Workspace } from './types.js';

export interface AddFolderOptions {
  /** Folder name / slug (lowercase-hyphenated). */
  name: string;
  /** Kinds this folder hosts (empty = free-form area). */
  kinds?: Kind[];
  /** Override the folder template dir. */
  templateDir?: string;
  /** Skip the post-add index rebuild (tests). */
  skipIndex?: boolean;
}

export interface AddFolderResult {
  name: string;
  kinds: Kind[];
  filesCreated: string[];
}

/**
 * Add a governed folder to the workspace — the templated, config-registered way to
 * grow the tree, so folder creation obeys the same "never freehand" discipline as
 * spawning members. Renders CLAUDE.md + _index.md and records the folder (and any
 * kinds it hosts) in baab.config.json.
 */
export async function addFolder(ws: Workspace, opts: AddFolderOptions): Promise<AddFolderResult> {
  if (!isValidSlug(opts.name)) throw new InvalidSlugError(opts.name);
  if (ws.config.folders[opts.name]) {
    throw new BaabError(
      `Folder "${opts.name}" already exists in baab.config.json.`,
      'FOLDER_EXISTS',
      'Pick a different name, or edit the existing folder directly.',
    );
  }
  const targetDir = path.join(ws.root, opts.name);
  if (existsSync(targetDir)) {
    throw new BaabError(
      `Directory "${opts.name}" already exists on disk.`,
      'FOLDER_EXISTS',
      'Pick a different name.',
    );
  }

  const kinds = opts.kinds ?? [];
  const vars: TemplateVars = {
    name: opts.name,
    slug: opts.name,
    id: opts.name,
    date: today(),
    year: year(),
    kind: kinds[0] ?? '',
  };

  const created = await renderTree(resolveFolderTemplateDir(opts.templateDir), targetDir, vars);

  // Register the folder in the manifest.
  ws.config.folders[opts.name] = { kinds };
  await writeFile(path.join(ws.root, CONFIG_FILENAME), serializeConfig(ws.config), 'utf8');

  if (!opts.skipIndex) {
    await buildIndex(ws);
  }

  return {
    name: opts.name,
    kinds,
    filesCreated: created.map((c) => path.posix.join(opts.name, c)),
  };
}
