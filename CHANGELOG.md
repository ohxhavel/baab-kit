# Changelog

All notable changes to this project are documented here. This project follows
[Semantic Versioning](https://semver.org/).

## [0.1.0] — unreleased

First public release. Requires Node 22+ (ships `node:sqlite`, so search works with no
native build; `better-sqlite3` is used as a faster optional backend when present).

### Added

- `baab init <name>` — scaffold a complete workspace (governed tree, standards, root
  and per-folder kits, `.claude/` integration layer, seeded business entity, git
  init) that passes its own doctor out of the box.
- `baab new <kind> <slug>` — spawn an entity, project, client, or app from a template.
- `baab index` — full-text SQLite index (better-sqlite3 with a `node:sqlite` fallback)
  plus generated `_registry.md` rosters.
- `baab search <query>` — FTS5 search with type/tag/status filters.
- `baab doctor` — ten validation rules (frontmatter, naming, links, kits, secrets),
  non-zero exit on errors.
- `baab status` — workspace overview with index-freshness detection.
- `baab folder add <name>` — add a governed folder the templated way (kit + index +
  config registration), with optional `--kind`.
- `baab serve` — a local HTTP API over the workspace (`node:http`, no new dependency).
  Read-only by default, binds `127.0.0.1`; `--write` enables `POST /index`, `/new`,
  `/folder`. Endpoints: status, doctor, search, documents, registry, openapi.
- `baab init --devcontainer` (generate a Codespaces-ready `.devcontainer/`) and
  `baab init --template <dir>` (use a custom workspace template).
- A typed SDK (`baab` package) that the CLI and API are both thin layers over;
  `src/core` is output-free and embeddable (`createServer`/`startServer` exported too).
- Docs: concepts, workspace spec (v1), CLI/SDK/API references, Claude integration,
  troubleshooting, roadmap, and a docs index.

[0.1.0]: https://github.com/ohxhavel/baab-kit/releases/tag/v0.1.0
