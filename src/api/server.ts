import {
  type IncomingMessage,
  type Server,
  type ServerResponse,
  createServer as httpCreateServer,
} from 'node:http';
import { BaabError } from '../core/errors.js';
import { addFolder } from '../core/folder.js';
import { buildIndex } from '../core/indexer.js';
import { scanDocs } from '../core/scan.js';
import { search } from '../core/search.js';
import { spawnFromTemplate } from '../core/spawn.js';
import { getStatus } from '../core/status.js';
import type { Kind, Workspace } from '../core/types.js';
import { validate } from '../core/validate/index.js';
import { baabVersion } from '../core/version.js';

export interface ServeOptions {
  host?: string;
  port?: number;
  /** Enable mutating endpoints (POST). Default false — read-only. */
  write?: boolean;
}

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = 4100;

/** Map a thrown error to an HTTP status code. */
function statusFor(err: unknown): number {
  if (err instanceof BaabError) {
    switch (err.code) {
      case 'NOT_A_WORKSPACE':
      case 'TEMPLATE_NOT_FOUND':
        return 404;
      case 'INVALID_SLUG':
      case 'UNKNOWN_KIND':
      case 'DUPLICATE_ID':
      case 'FOLDER_EXISTS':
      case 'WORKSPACE_EXISTS':
        return 409;
      case 'CONFIG_ERROR':
        return 400;
      default:
        return 500;
    }
  }
  return 500;
}

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  const text = JSON.stringify(body, null, 2);
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(text);
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  if (chunks.length === 0) return {};
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  return JSON.parse(raw);
}

const OPENAPI = {
  openapi: '3.0.0',
  info: { title: 'BaaB workspace API', version: 1 },
  paths: {
    '/health': { get: { summary: 'Liveness + version' } },
    '/status': { get: { summary: 'Workspace overview' } },
    '/doctor': { get: { summary: 'Validation diagnostics' } },
    '/search': {
      get: { summary: 'Full-text search', parameters: ['q', 'type', 'tag', 'status', 'limit'] },
    },
    '/documents': { get: { summary: 'Document metadata list' } },
    '/registry/{folder}': { get: { summary: 'Members of a governed folder' } },
    '/index': { post: { summary: 'Rebuild index (write)' } },
    '/new': { post: { summary: 'Spawn a member (write)' } },
    '/folder': { post: { summary: 'Add a governed folder (write)' } },
  },
};

/**
 * Build (but do not start) the workspace HTTP API server. Read-only unless
 * `opts.write` is set. Every layer here is a thin wrapper over the SDK.
 */
export function createServer(ws: Workspace, opts: ServeOptions = {}): Server {
  return httpCreateServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://localhost');
      const parts = url.pathname.split('/').filter(Boolean);
      const method = req.method ?? 'GET';

      // ---- read endpoints ----
      if (method === 'GET' && parts.length === 0) {
        return sendJson(res, 200, {
          name: 'baab',
          version: baabVersion(),
          workspace: ws.config.name,
        });
      }
      if (method === 'GET' && parts[0] === 'health') {
        return sendJson(res, 200, { ok: true, version: baabVersion() });
      }
      if (method === 'GET' && parts[0] === 'openapi.json') {
        return sendJson(res, 200, OPENAPI);
      }
      if (method === 'GET' && parts[0] === 'status') {
        return sendJson(res, 200, await getStatus(ws));
      }
      if (method === 'GET' && parts[0] === 'doctor') {
        const diagnostics = await validate(ws);
        return sendJson(res, 200, {
          errors: diagnostics.filter((d) => d.severity === 'error').length,
          warnings: diagnostics.filter((d) => d.severity === 'warning').length,
          diagnostics,
        });
      }
      if (method === 'GET' && parts[0] === 'search') {
        const q = url.searchParams.get('q') ?? '';
        const limitRaw = url.searchParams.get('limit');
        const hits = await search(ws, q, {
          type: url.searchParams.get('type') ?? undefined,
          tag: url.searchParams.get('tag') ?? undefined,
          status: url.searchParams.get('status') ?? undefined,
          limit: limitRaw ? Number(limitRaw) : undefined,
        });
        return sendJson(res, 200, hits);
      }
      if (method === 'GET' && parts[0] === 'documents') {
        const docs = await scanDocs(ws);
        return sendJson(
          res,
          200,
          docs.map((d) => ({
            path: d.relPath,
            id: d.frontmatter.id ?? null,
            type: d.frontmatter.type ?? null,
            status: d.frontmatter.status ?? null,
            title: d.title,
          })),
        );
      }
      if (method === 'GET' && parts[0] === 'registry' && parts[1]) {
        const folder = parts[1];
        const docs = await scanDocs(ws);
        const members = docs
          .filter((d) => {
            const rest = d.relPath.startsWith(`${folder}/`)
              ? d.relPath.slice(folder.length + 1)
              : '';
            const seg = rest.split('/');
            return seg.length === 2 && seg[1] === '_index.md';
          })
          .map((d) => ({
            id: d.frontmatter.id ?? null,
            title: d.title,
            type: d.frontmatter.type ?? null,
            status: d.frontmatter.status ?? null,
            path: d.relPath,
          }));
        return sendJson(res, 200, members);
      }

      // ---- write endpoints ----
      const isWrite = method === 'POST' && ['index', 'new', 'folder'].includes(parts[0] ?? '');
      if (isWrite && !opts.write) {
        return sendJson(res, 403, {
          error: 'read-only',
          message: 'This API is read-only. Start `baab serve --write` to enable mutations.',
        });
      }
      if (method === 'POST' && parts[0] === 'index') {
        return sendJson(res, 200, await buildIndex(ws));
      }
      if (method === 'POST' && parts[0] === 'new') {
        const body = (await readBody(req)) as { kind?: string; slug?: string; name?: string };
        if (!body.kind || !body.slug) {
          return sendJson(res, 400, {
            error: 'bad-request',
            message: 'kind and slug are required.',
          });
        }
        const result = await spawnFromTemplate(ws, {
          kind: body.kind as Kind,
          slug: body.slug,
          name: body.name,
        });
        return sendJson(res, 201, result);
      }
      if (method === 'POST' && parts[0] === 'folder') {
        const body = (await readBody(req)) as { name?: string; kinds?: Kind[] };
        if (!body.name) {
          return sendJson(res, 400, { error: 'bad-request', message: 'name is required.' });
        }
        const result = await addFolder(ws, { name: body.name, kinds: body.kinds ?? [] });
        return sendJson(res, 201, result);
      }

      return sendJson(res, 404, {
        error: 'not-found',
        message: `No route for ${method} ${url.pathname}`,
      });
    } catch (err) {
      const code = err instanceof BaabError ? err.code : 'INTERNAL';
      const message = err instanceof Error ? err.message : String(err);
      sendJson(res, statusFor(err), { error: code, message });
    }
  });
}

/** Start the server and resolve once it is listening. */
export function startServer(
  ws: Workspace,
  opts: ServeOptions = {},
): Promise<{ server: Server; url: string; host: string; port: number }> {
  const host = opts.host ?? DEFAULT_HOST;
  const port = opts.port ?? DEFAULT_PORT;
  const server = createServer(ws, opts);
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      const addr = server.address();
      const actualPort = typeof addr === 'object' && addr ? addr.port : port;
      resolve({ server, url: `http://${host}:${actualPort}`, host, port: actualPort });
    });
  });
}
