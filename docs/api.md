# API reference

`baab serve` runs a local HTTP API over a workspace — the third surface, alongside the
CLI and SDK, and a thin layer over the same core. It's built on Node's built-in
`http` (no extra dependency).

```bash
baab serve                       # read-only, http://127.0.0.1:4100
baab serve --port 8080 --write   # enable mutations
```

## Safety model

- **Binds to `127.0.0.1`** by default — local only.
- **Read-only by default.** Mutating endpoints (`POST`) return `403` unless you start
  with `--write`.
- **No authentication.** This is a local dev/agent API, not something to expose
  publicly. Hosted/multi-tenant + auth is on the [roadmap](roadmap.md), not in v1.

## Flags

| Flag | Default | Effect |
| --- | --- | --- |
| `--port <n>` | `4100` | Listen port. |
| `--host <host>` | `127.0.0.1` | Bind address. |
| `--write` | off | Enable the mutating `POST` endpoints. |
| `--json` | off | Print the server URL as JSON on startup. |

## Endpoints

### Read (always available)

| Method · Path | Returns |
| --- | --- |
| `GET /` | `{ name, version, workspace }` |
| `GET /health` | `{ ok, version }` |
| `GET /status` | Workspace overview (same shape as `baab status --json`). |
| `GET /doctor` | `{ errors, warnings, diagnostics[] }`. |
| `GET /search?q=&type=&tag=&status=&limit=` | Ranked `SearchHit[]`. |
| `GET /documents` | `[{ path, id, type, status, title }]` for every note. |
| `GET /registry/:folder` | Members of a governed folder. |
| `GET /openapi.json` | A minimal OpenAPI description of these routes. |

### Write (only with `--write`)

| Method · Path | Body | Returns |
| --- | --- | --- |
| `POST /index` | — | `IndexStats` after a full rebuild. |
| `POST /new` | `{ kind, slug, name? }` | `SpawnResult` (`201`). |
| `POST /folder` | `{ name, kinds? }` | `AddFolderResult` (`201`). |

## Errors

Errors are JSON `{ error, message }`. Status codes: `404` (no route / not a
workspace), `409` (invalid slug, duplicate id, unknown kind, folder exists), `400`
(bad request / config error), `403` (write attempted in read-only mode), `500`
(unexpected).

## Embedding

The server is exported from the SDK, so you can mount it in your own process:

```ts
import { loadWorkspace, startServer } from 'baab';

const ws = await loadWorkspace('./acme');
const { url } = await startServer(ws, { port: 4100, write: false });
console.log(`BaaB API on ${url}`);
```

`createServer(ws, opts)` returns an unstarted `http.Server` if you want to manage the
lifecycle yourself.
