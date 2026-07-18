import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TemplateNotFoundError } from './errors.js';
import type { TemplateVars } from './types.js';

/**
 * Templates ship in the package tarball at `<pkg>/templates`. This file lives at
 * `<pkg>/dist/core/templates.js` at runtime and `<pkg>/src/core/templates.ts`
 * under test; three levels up is the package root in both cases.
 */
function packageRoot(): string {
  return path.resolve(fileURLToPath(import.meta.url), '../../../');
}

/** Absolute path to a bundled template dir, or a caller-supplied override. */
export function resolveWorkspaceTemplateDir(override?: string): string {
  if (override) return path.resolve(override);
  return path.join(packageRoot(), 'templates', 'workspace');
}

/** Absolute path to a bundled kind template dir, or a caller-supplied override. */
export function resolveKindTemplateDir(kind: string, override?: string): string {
  if (override) return path.resolve(override);
  return path.join(packageRoot(), 'templates', 'kinds', kind);
}

/** Absolute path to the bundled devcontainer template dir. */
export function resolveDevcontainerTemplateDir(): string {
  return path.join(packageRoot(), 'templates', 'devcontainer');
}

/** Absolute path to the bundled governed-folder template dir. */
export function resolveFolderTemplateDir(override?: string): string {
  if (override) return path.resolve(override);
  return path.join(packageRoot(), 'templates', 'folder');
}

const KNOWN_VARS = ['name', 'slug', 'id', 'date', 'year', 'kind'] as const;

/**
 * Replace `{{var}}` tokens for the six known variables only. Unknown `{{...}}`
 * tokens pass through untouched — templates legitimately document the
 * placeholder convention, and we must not eat those examples.
 */
export function renderString(input: string, vars: TemplateVars): string {
  let out = input;
  for (const key of KNOWN_VARS) {
    const value = vars[key] ?? '';
    out = out.split(`{{${key}}}`).join(value);
  }
  return out;
}

/**
 * Template files use a `dot-` prefix for names that must become dotfiles in the
 * generated workspace (`dot-gitignore` → `.gitignore`, `dot-claude/` → `.claude/`).
 * This guarantees npm packs them — npm strips real dotfiles like `.gitignore`
 * from tarballs.
 */
function unDotSegment(segment: string): string {
  return segment.startsWith('dot-') ? `.${segment.slice(4)}` : segment;
}

/** Apply dot-mapping and variable rendering across every path segment. */
function renderRelPath(rel: string, vars: TemplateVars): string {
  return rel
    .split('/')
    .map((seg) => renderString(unDotSegment(seg), vars))
    .join('/');
}

async function exists(p: string): Promise<boolean> {
  try {
    await access(p);
    return true;
  } catch {
    return false;
  }
}

/** Recursively collect files (posix-relative to `dir`). */
async function walkFiles(dir: string, base = ''): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(path.join(dir, entry.name), rel)));
    } else {
      files.push(rel);
    }
  }
  return files;
}

/**
 * Render every file under `srcDir` into `destDir`, interpolating variables in
 * both file contents and path segments. Scaffolding is additive: existing files
 * are left untouched (skipped), never overwritten. Returns the list of files
 * actually created (workspace-relative posix).
 */
export async function renderTree(
  srcDir: string,
  destDir: string,
  vars: TemplateVars,
): Promise<string[]> {
  if (!(await exists(srcDir))) throw new TemplateNotFoundError(srcDir);
  const rels = await walkFiles(srcDir);
  const created: string[] = [];
  for (const rel of rels) {
    const outRel = renderRelPath(rel, vars);
    const outAbs = path.join(destDir, outRel);
    if (await exists(outAbs)) {
      // Never clobber; scaffolding is additive.
      continue;
    }
    await mkdir(path.dirname(outAbs), { recursive: true });
    const raw = await readFile(path.join(srcDir, rel), 'utf8');
    await writeFile(outAbs, renderString(raw, vars), 'utf8');
    created.push(outRel);
  }
  return created.sort();
}
