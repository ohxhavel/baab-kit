# Troubleshooting

## `ExperimentalWarning: SQLite is an experimental feature`

When BaaB falls back to Node's built-in `node:sqlite` backend (because
`better-sqlite3` isn't installed), Node prints an experimental-feature warning to
stderr on first use. It's harmless — search still works. To silence it, either:

- Install `better-sqlite3` (it's an optional dependency; when present, BaaB uses it and
  no warning appears), or
- Run node with `--no-warnings`, or set `NODE_NO_WARNINGS=1`.

## `No SQLite backend available` (`SQLITE_UNAVAILABLE`)

BaaB needs one of two SQLite backends: the built-in `node:sqlite` (Node **22.5+**) or
the optional `better-sqlite3` native module. You'll only see this error if you're on a
Node older than 22.5 **and** `better-sqlite3` failed to build. Fix either side:

- **Upgrade to Node 22.5+** (recommended — `node:sqlite` needs no native build), or
- Install build tools so `better-sqlite3` can compile (`python3` + a C++ toolchain).

This is why BaaB requires Node 22.5+: it guarantees a working backend everywhere with
zero native compilation.

## Forcing the faster backend

`better-sqlite3` is faster than `node:sqlite`. It's an optional dependency, so it's
installed automatically when prebuilt binaries exist for your platform. If it didn't
install, add it explicitly:

```bash
npm install better-sqlite3
```

`baab index --json` and `baab status --json` report which driver is in use
(`"driver": "better-sqlite3"` or `"node:sqlite"`). To force one, set
`BAAB_SQLITE_DRIVER=node` (use the built-in backend and skip the native module) or
`BAAB_SQLITE_DRIVER=better`.

## `Not a workspace` (`NOT_A_WORKSPACE`)

Commands other than `init` look for `baab.config.json` by walking up from the current
directory. Run them from inside a workspace, or `cd` into one. `baab init <name>`
creates a new workspace.

## Doctor flags a link that Obsidian resolves fine

BaaB resolves wikilinks by unique basename match, close to Obsidian's behavior. If two
notes share a basename, a bare `[[name]]` is ambiguous — disambiguate with a relative
path (`[label](../folder/name.md)`) or a more specific target.

## `git` step was skipped on `init`

`baab init` makes an initial commit only if `git` is on your PATH. If it isn't, the
workspace is still created — just without a repo. Run `git init` yourself later, or
re-run with `--no-git` to skip intentionally. On machines with commit signing enforced
globally, the initial commit is made with signing disabled so it never blocks on a key.
