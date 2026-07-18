import pc from 'picocolors';
import { BaabError } from '../core/errors.js';

/** Print a value as pretty JSON to stdout. */
export function printJson(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

export function info(msg: string): void {
  process.stdout.write(`${msg}\n`);
}

export function success(msg: string): void {
  process.stdout.write(`${pc.green('✓')} ${msg}\n`);
}

export function warn(msg: string): void {
  process.stderr.write(`${pc.yellow('!')} ${msg}\n`);
}

export function heading(msg: string): void {
  process.stdout.write(`\n${pc.bold(msg)}\n`);
}

export function dim(msg: string): string {
  return pc.dim(msg);
}

/** Format and print an error, returning the process exit code to use. */
export function reportError(err: unknown): number {
  if (err instanceof BaabError) {
    process.stderr.write(`${pc.red('error')} [${err.code}] ${err.message}\n`);
    if (err.hint) process.stderr.write(`${pc.dim(`hint: ${err.hint}`)}\n`);
    return 1;
  }
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`${pc.red('error')} ${message}\n`);
  return 1;
}
