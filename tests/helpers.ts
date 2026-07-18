import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

/** Create a fresh temp directory; returns its path and a cleanup function. */
export async function tempDir(): Promise<{ dir: string; cleanup: () => Promise<void> }> {
  const dir = await mkdtemp(path.join(tmpdir(), 'baab-test-'));
  return {
    dir,
    cleanup: () => rm(dir, { recursive: true, force: true }),
  };
}
