import { spawn } from 'node:child_process';

/** Run a git command in `cwd`; resolve on exit 0, reject otherwise. */
function git(cwd: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn('git', args, { cwd, stdio: 'ignore' });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`git ${args.join(' ')} exited with code ${code}`));
    });
  });
}

/** True when the `git` binary is available on PATH. */
export async function gitAvailable(): Promise<boolean> {
  try {
    await git(process.cwd(), ['--version']);
    return true;
  } catch {
    return false;
  }
}

/**
 * Initialize a git repo in `dir` and make an initial commit. Identity flags are
 * passed inline so this works in CI and on machines with no global git identity.
 */
export async function initRepo(dir: string): Promise<void> {
  await git(dir, ['init', '-b', 'main']);
  await git(dir, ['add', '-A']);
  await git(dir, [
    '-c',
    'user.name=baab',
    '-c',
    'user.email=init@baab.local',
    // The host may have commit signing on globally; a fresh workspace commit must
    // not depend on the user's signing key being available.
    '-c',
    'commit.gpgsign=false',
    'commit',
    '-m',
    'chore: initialize baab workspace',
  ]);
}
