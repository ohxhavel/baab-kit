import path from 'node:path';

/** Normalize a path to posix separators. All stored/compared paths use this. */
export function toPosix(p: string): string {
  return p.split(path.sep).join('/');
}

/** Workspace-relative posix path from an absolute path. */
export function relPosix(root: string, abs: string): string {
  return toPosix(path.relative(root, abs));
}
