import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/** This package's version, read from package.json (one level above dist/src). */
export function baabVersion(): string {
  try {
    const pkg = require('../../package.json') as { version?: string };
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}
