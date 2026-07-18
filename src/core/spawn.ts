import path from 'node:path';
import { today, year } from './dates.js';
import { DuplicateIdError, InvalidSlugError, UnknownKindError } from './errors.js';
import { buildIndex } from './indexer.js';
import { isValidSlug } from './naming.js';
import { scanDocs } from './scan.js';
import { renderTree, resolveKindTemplateDir } from './templates.js';
import type { Kind, SpawnResult, TemplateVars, Workspace } from './types.js';

export interface SpawnOptions {
  kind: Kind;
  slug: string;
  /** Display name; defaults to a title-cased slug. */
  name?: string;
  /** Override template dir. */
  templateDir?: string;
  /** Skip the post-spawn index rebuild (tests). */
  skipIndex?: boolean;
}

/** Title-case a slug for a default display name: "acme-corp" → "Acme Corp". */
function titleize(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Find the governed folder that hosts a given kind. */
export function folderForKind(ws: Workspace, kind: string): string | null {
  for (const [folder, cfg] of Object.entries(ws.config.folders)) {
    if (cfg.kinds.includes(kind as Kind)) return folder;
  }
  return null;
}

/** All kinds spawnable in this workspace. */
export function knownKinds(ws: Workspace): string[] {
  return [...new Set(Object.values(ws.config.folders).flatMap((c) => c.kinds))];
}

/**
 * Spawn a new entity/project/client/app from its template into the right
 * governed folder. Enforces the naming law and id uniqueness — the "never
 * freehand" rule as a command.
 */
export async function spawnFromTemplate(ws: Workspace, opts: SpawnOptions): Promise<SpawnResult> {
  if (!isValidSlug(opts.slug)) throw new InvalidSlugError(opts.slug);

  const folder = folderForKind(ws, opts.kind);
  if (!folder) throw new UnknownKindError(opts.kind, knownKinds(ws));

  // Id uniqueness across the whole workspace.
  const docs = await scanDocs(ws);
  const clash = docs.find((d) => d.frontmatter.id === opts.slug);
  if (clash) throw new DuplicateIdError(opts.slug, clash.relPath);

  const vars: TemplateVars = {
    name: opts.name ?? titleize(opts.slug),
    slug: opts.slug,
    id: opts.slug,
    date: today(),
    year: year(),
    kind: opts.kind,
  };

  const templateDir = resolveKindTemplateDir(opts.kind, opts.templateDir);
  const targetDir = path.join(ws.root, folder, opts.slug);
  const created = await renderTree(templateDir, targetDir, vars);

  if (!opts.skipIndex) {
    await buildIndex(ws);
  }

  return {
    kind: opts.kind,
    slug: opts.slug,
    targetDir,
    filesCreated: created.map((c) => path.posix.join(folder, opts.slug, c)),
  };
}
