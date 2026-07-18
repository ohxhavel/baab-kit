# SDK reference

`baab` exports a typed programmatic API. The CLI is a thin layer over exactly these
functions — anything the CLI does, you can do in code. `src/core` never imports the
CLI or any output library, so this surface is safe to embed (in a script, a server, or
another tool).

```ts
import {
  createWorkspace,
  loadWorkspace,
  spawnFromTemplate,
  buildIndex,
  search,
  validate,
  getStatus,
} from 'baab';
```

## Workspace lifecycle

### `createWorkspace(opts): Promise<InitResult>`

```ts
const result = await createWorkspace({
  name: 'Acme Corp',
  dir: './acme',
  git: true,      // default true
  claude: true,   // default true
});
// result.root, result.filesCreated, result.gitInitialized, result.indexStats
```

### `loadWorkspace(cwd?): Promise<Workspace>`

Walks up from `cwd` (default `process.cwd()`) to find `baab.config.json`. Throws
`NotAWorkspaceError` if none is found.

```ts
const ws = await loadWorkspace('./acme');
// ws.root, ws.config, ws.dbPath, ws.stateDir
```

### `spawnFromTemplate(ws, opts): Promise<SpawnResult>`

```ts
await spawnFromTemplate(ws, { kind: 'project', slug: 'q3-launch', name: 'Q3 Launch' });
```

Validates the slug and id uniqueness (`InvalidSlugError`, `DuplicateIdError`,
`UnknownKindError`), copies the kind template, and rebuilds the index. Pass
`skipIndex: true` to defer the rebuild.

### `addFolder(ws, opts): Promise<AddFolderResult>`

```ts
await addFolder(ws, { name: 'strategy', kinds: ['project'] });
```

Adds a governed folder (kit + index) and registers it in `baab.config.json`. Refuses a
name that already exists.

## HTTP API

### `startServer(ws, opts?): Promise<{ server, url, host, port }>`

Starts the local API (read-only unless `opts.write`). `createServer(ws, opts?)` returns
an unstarted `http.Server`. See the [API reference](api.md).

```ts
const { url } = await startServer(ws, { port: 4100 });
```

## Index, search, registries

### `buildIndex(ws): Promise<IndexStats>`

Full rebuild of `.baab/index.sqlite` plus regeneration of every `_registry.md`.

### `search(ws, query, opts?): Promise<SearchHit[]>`

```ts
const hits = await search(ws, 'launch', { type: 'project', limit: 5 });
// each hit: { path, docId, title, type, snippet, rank }
```

### `updateRegistries(ws, docs): Promise<RegistryResult>`

Lower-level: regenerate registries from an already-scanned document list. `buildIndex`
calls this for you.

## Validation and status

### `validate(ws, opts?): Promise<Diagnostic[]>`

```ts
const diags = await validate(ws);
const errors = diags.filter((d) => d.severity === 'error');
```

Each `Diagnostic`: `{ rule, severity, path, line?, message }`.

### `getStatus(ws): Promise<WorkspaceStatus>`

Counts, index freshness (`stale`), and a validation summary.

## Lower-level helpers

Also exported: `scanDocs`, `newestMtime`, `parseDoc`, `serializeDoc`, `extractLinks`,
`resolveLink`, `isValidSlug`, `slugify`, `openDb`, `detectDriver`, `readConfig`,
`defaultConfig`, and the full error hierarchy (`BaabError` and subclasses). See the
type definitions shipped with the package for exact signatures.
