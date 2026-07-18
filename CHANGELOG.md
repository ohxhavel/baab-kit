# Changelog

All notable changes to this project are documented here. This project follows
[Semantic Versioning](https://semver.org/).

## [0.1.0] — unreleased

First public release.

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
- A typed SDK (`baab` package) that the CLI is a thin layer over; `src/core` is
  output-free and embeddable.
- Docs: concepts, workspace spec (v1), CLI and SDK references, Claude integration.
