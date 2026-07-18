import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const REPO = path.resolve(fileURLToPath(import.meta.url), '../../..');
const EXPECTED: string[] = JSON.parse(
  readFileSync(path.join(REPO, 'tests/e2e/expected-tree.json'), 'utf8'),
);

// On Windows the npm executable is `npm.cmd`; execFileSync won't resolve a bare
// `npm` there.
const NPM = process.platform === 'win32' ? 'npm.cmd' : 'npm';

// Strings that would indicate the source vault leaked into the public product.
// `op://` (the sanctioned reference form) and the public repo URL are allowed.
const FORBIDDEN = /\bsimpl|\bhnwiii|savor|carddex|strikesync|feel-good|heritage-farms/i;

/** Run the installed baab CLI in `cwd`, returning stdout. */
function baab(cliJs: string, cwd: string, args: string[]): string {
  return execFileSync('node', [cliJs, ...args], { cwd, encoding: 'utf8' });
}

/** Recursively list files under `dir`, posix-relative, excluding .git/.baab. */
async function listFiles(dir: string, base = ''): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const e of entries) {
    if (e.name === '.git' || e.name === '.baab') continue;
    const rel = base ? `${base}/${e.name}` : e.name;
    if (e.isDirectory()) out.push(...(await listFiles(path.join(dir, e.name), rel)));
    else out.push(rel);
  }
  return out.sort();
}

describe('packed CLI end-to-end', () => {
  let work: string;
  let cliJs: string;
  let wsDir: string;

  beforeAll(async () => {
    work = await mkdtemp(path.join(tmpdir(), 'baab-e2e-'));
    // Build + pack the real tarball.
    execFileSync(NPM, ['run', 'build'], { cwd: REPO, stdio: 'ignore', shell: true });
    const packOut = execFileSync(NPM, ['pack', '--pack-destination', work], {
      cwd: REPO,
      encoding: 'utf8',
      shell: true,
    });
    const tgz = packOut.trim().split('\n').pop() as string;

    // Install into a fresh project.
    const proj = path.join(work, 'proj');
    mkdirSync(proj, { recursive: true });
    execFileSync(NPM, ['init', '-y'], { cwd: proj, stdio: 'ignore', shell: true });
    execFileSync(NPM, ['install', path.join(work, tgz)], {
      cwd: proj,
      stdio: 'ignore',
      shell: true,
    });
    cliJs = path.join(proj, 'node_modules', 'baab', 'dist', 'cli', 'main.js');
    expect(existsSync(cliJs)).toBe(true);

    // init BaaB.
    baab(cliJs, proj, ['init', 'BaaB']);
    wsDir = path.join(proj, 'BaaB');
  }, 120_000);

  afterAll(() => rm(work, { recursive: true, force: true }));

  it('generates exactly the expected workspace tree', async () => {
    const files = await listFiles(wsDir);
    expect(files).toEqual(EXPECTED);
  });

  it('initializes a git repo with one commit', () => {
    const log = execFileSync('git', ['log', '--oneline'], { cwd: wsDir, encoding: 'utf8' });
    expect(log.trim().split('\n')).toHaveLength(1);
  });

  it('writes a parseable config with the right name/slug', async () => {
    const cfg = JSON.parse(await readFile(path.join(wsDir, 'baab.config.json'), 'utf8'));
    expect(cfg.name).toBe('BaaB');
    expect(cfg.slug).toBe('baab');
    expect(cfg.spec).toBe(1);
  });

  it('contains no leaked private data', async () => {
    for (const rel of await listFiles(wsDir)) {
      const text = await readFile(path.join(wsDir, rel), 'utf8');
      expect(text, `forbidden string in ${rel}`).not.toMatch(FORBIDDEN);
    }
  });

  it('builds an index with zero broken links', () => {
    const out = JSON.parse(baab(cliJs, wsDir, ['index', '--json']));
    expect(out.documents).toBeGreaterThan(0);
    expect(out.brokenLinks).toBe(0);
  });

  it('passes its own doctor (exit 0, zero errors)', () => {
    const out = JSON.parse(baab(cliJs, wsDir, ['doctor', '--json']));
    expect(out.errors).toBe(0);
  });

  it('spawns project + client and stays doctor-clean', () => {
    baab(cliJs, wsDir, ['new', 'project', 'demo']);
    baab(cliJs, wsDir, ['new', 'client', 'acme']);
    const out = JSON.parse(baab(cliJs, wsDir, ['doctor', '--json']));
    expect(out.errors).toBe(0);
    const reg = readFileSync(path.join(wsDir, 'projects/_registry.md'), 'utf8');
    expect(reg).toContain('demo');
  });

  it('searches and reports status', () => {
    const hits = JSON.parse(baab(cliJs, wsDir, ['search', 'registry', '--json']));
    expect(hits.length).toBeGreaterThan(0);
    const status = JSON.parse(baab(cliJs, wsDir, ['status', '--json']));
    expect(status.counts.entities).toBe(1);
    expect(status.counts.projects).toBe(1);
    expect(status.counts.clients).toBe(1);
  });
});
