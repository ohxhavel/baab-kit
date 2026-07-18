# BaaB — Business-as-a-Book

Run your business as a governed, indexed, agent-ready markdown workspace. One
canonical home per fact, every folder carrying its own instructions, everything
full-text searchable and lintable — and prepared for Claude Code to develop further
from day one.

BaaB is a CLI and an SDK. It ships no server and needs no account: a workspace is
plain markdown with YAML frontmatter (Obsidian- and git-friendly) plus a rebuildable
SQLite index. Any business can adopt it for free.

```bash
npx baab init "Acme Corp"
cd "Acme Corp"
baab status
```

That scaffolds a complete workspace, seeds the business as its first registry entity,
builds a search index, and makes an initial git commit.

## Why

Most businesses accrete knowledge across a dozen tools and no single source of truth.
BaaB gives you one: a book. Every entity, project, client, and managed tool gets a
consistent home spawned from a template — never hand-rolled — so the structure stays
uniform enough for both people and AI agents to navigate. The `.claude/` layer means
an agent can manage and extend the workspace from the first minute.

## Install

```bash
npm install -g baab        # global CLI
# or per-project:
npm install baab
# or no install at all:
npx baab <command>
```

Requires Node 22+. Search uses Node's built-in `node:sqlite` out of the box (no
native build), and transparently uses `better-sqlite3` as a faster backend when it's
installed — either way, no setup.

## Commands

| Command | What it does |
| --- | --- |
| `baab init <name>` | Scaffold a new workspace (`--no-git`, `--no-claude`, `--dir`, `--json`). |
| `baab new <kind> <slug>` | Spawn an `entity`, `project`, `client`, or `app` from a template. |
| `baab index` | Rebuild the search index and regenerate the `_registry.md` rosters. |
| `baab search <query>` | Full-text search (`--type`, `--tag`, `--status`, `--limit`). |
| `baab doctor` | Check the workspace against the four laws. Exits non-zero on errors. |
| `baab status` | Overview: counts, index freshness, validation summary. |

Every command accepts `--json` for scripting and agents.

## The four laws

1. **Frontmatter on every note** — type, id, status, dates.
2. **Names are lowercase-hyphenated** — no spaces, no numeric prefixes.
3. **One canonical home per fact** — link to it, never copy it.
4. **Spawn from templates, never freehand** — `baab new` keeps everything uniform.

`baab doctor` enforces all four. A healthy workspace reports zero errors.

## What a workspace looks like

```
Acme Corp/
├── baab.config.json        # the manifest
├── CLAUDE.md               # root kit — how agents work in this tree
├── .claude/                # workspace-manager agent, status command, spawn skill
├── .mcp.json               # wire up MCP servers here
├── _standards/             # the four laws, written out
├── registry/               # business entities (Acme itself lives here)
├── projects/               # projects, one folder each
├── clients/                # client accounts
├── infrastructure/         # managed tools and accounts
├── operations/             # runbooks and SOPs
├── knowledge/              # concepts, lessons, reference
└── inbox/                  # unsorted drop zone
```

## SDK

The CLI is a thin layer over a programmatic core. Everything the CLI does, you can do
in code:

```ts
import { createWorkspace, spawnFromTemplate, loadWorkspace, buildIndex, search } from 'baab';

await createWorkspace({ name: 'Acme Corp', dir: './acme' });
const ws = await loadWorkspace('./acme');
await spawnFromTemplate(ws, { kind: 'project', slug: 'q3-launch' });
await buildIndex(ws);
const hits = await search(ws, 'launch');
```

See [docs/sdk.md](docs/sdk.md) for the full surface.

## Docs

- [Concepts](docs/concepts.md) — the model behind BaaB.
- [Workspace spec](docs/workspace-spec.md) — the normative tree + frontmatter schema.
- [CLI reference](docs/cli.md)
- [SDK reference](docs/sdk.md)
- [Claude integration](docs/claude-integration.md) — the `.claude/` layer and MCP.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). In short: `npm install && npm test`. The core
(`src/core`) is the SDK and must never import the CLI or any output library — a CI
check enforces this.

## License

MIT © ohxhavel
