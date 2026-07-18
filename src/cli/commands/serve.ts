import { startServer } from '../../api/server.js';
import { loadWorkspace } from '../../core/workspace.js';
import { dim, info, success, warn } from '../output.js';

export interface ServeFlags {
  port?: string;
  host?: string;
  write?: boolean;
  json?: boolean;
}

export async function runServe(flags: ServeFlags): Promise<number> {
  const ws = await loadWorkspace(process.cwd());
  const { url } = await startServer(ws, {
    host: flags.host,
    port: flags.port ? Number(flags.port) : undefined,
    write: flags.write,
  });

  if (flags.json) {
    process.stdout.write(`${JSON.stringify({ url, write: Boolean(flags.write) })}\n`);
  } else {
    success(`BaaB API for "${ws.config.name}" on ${url}`);
    info(`  mode: ${flags.write ? 'read-write' : 'read-only'}`);
    info(dim('  GET  /status /doctor /search?q= /documents /registry/:folder /openapi.json'));
    if (flags.write) info(dim('  POST /index /new /folder'));
    if (!flags.write) warn('read-only — pass --write to enable POST endpoints');
    info(dim('  local dev API (127.0.0.1); not for public exposure. Ctrl-C to stop.'));
  }

  // Keep the process alive until interrupted.
  return new Promise<number>(() => {});
}
