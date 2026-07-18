# CLI reference

All commands accept `--json` for machine-readable output. Commands that operate on an
existing workspace find it by walking up from the current directory to the nearest
`baab.config.json`.

## `baab init <name>`

Scaffold a new workspace.

```bash
baab init "Acme Corp"
baab init Acme --dir ./workspaces/acme --no-git
```

| Flag | Effect |
| --- | --- |
| `--dir <path>` | Target directory (default `./<name>`). Must be empty. |
| `--no-git` | Skip git initialization. |
| `--no-claude` | Omit the `.claude/` integration layer. |
| `--json` | Print the `InitResult` as JSON. |

Creates the tree, writes the manifest, seeds the business as a registry entity, builds
the index, and (unless `--no-git`) makes an initial commit.

## `baab new <kind> <slug>`

Spawn an entity, project, client, or app from its template.

```bash
baab new project q3-launch --name "Q3 Launch"
baab new client acme
baab new app vercel
```

| Flag | Effect |
| --- | --- |
| `--name <display>` | Display name (default: title-cased slug). |
| `--template <dir>` | Use a custom template directory. |
| `--json` | Print the `SpawnResult` as JSON. |

The slug must be lowercase-hyphenated and unique in the workspace. Spawning refreshes
the index and registries automatically.

## `baab index`

Rebuild the search index and regenerate every `_registry.md`.

```bash
baab index
baab index --json
```

The index is a full rebuild each run — it's disposable derived state, so this is
always correct and never needs a `--force`.

## `baab search <query>`

Full-text search across the workspace.

```bash
baab search "onboarding"
baab search launch --type project --limit 5
baab search runbook --tag operations --json
```

| Flag | Effect |
| --- | --- |
| `--type <type>` | Filter by frontmatter type. |
| `--tag <tag>` | Filter by tag. |
| `--status <status>` | Filter by status. |
| `--limit <n>` | Max results (default 20). |

Builds the index first if it's missing.

## `baab doctor` (alias `baab validate`)

Check the workspace against the four laws. Prints diagnostics grouped by severity and
**exits non-zero when there are errors** — suitable for CI.

```bash
baab doctor
baab doctor --json
```

## `baab status`

One-screen overview: entity/project/client/app counts, index freshness, and a
validation summary.

```bash
baab status
baab status --json
```
