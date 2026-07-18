# Workspace spec (v1)

This is the normative description of a BaaB workspace: the tree `baab init` generates,
the manifest, and the frontmatter schema. The `spec` field in `baab.config.json` pins
the version; this document describes `spec: 1`.

## Tree

```
<Name>/
├── baab.config.json          # manifest (committed)
├── .baab/                    # derived state — index + registry JSON (gitignored)
├── .gitignore
├── CLAUDE.md                 # root kit
├── README.md
├── .mcp.json                 # MCP server stub
├── .claude/
│   ├── agents/workspace-manager.md
│   ├── commands/workspace-status.md
│   └── skills/spawn-entity/SKILL.md
├── _standards/
│   ├── _index.md
│   ├── frontmatter.md
│   ├── naming.md
│   ├── lifecycle.md
│   └── writing.md
├── inbox/                    # frontmatter-exempt drop zone
│   ├── CLAUDE.md
│   └── _index.md
├── registry/                 # kinds: [entity]
│   ├── CLAUDE.md · _index.md · _registry.md
│   └── <slug>/               # the workspace's own business, seeded at init
│       ├── _index.md
│       └── profile.md
├── projects/                 # kinds: [project]  — CLAUDE.md · _index.md · _registry.md
├── clients/                  # kinds: [client]   — CLAUDE.md · _index.md · _registry.md
├── infrastructure/           # kinds: [app]      — CLAUDE.md · _index.md · _registry.md
├── operations/               # free-form         — CLAUDE.md · _index.md
└── knowledge/                # free-form         — CLAUDE.md · _index.md
```

Folders that host kinds get a generated `_registry.md`; free-form folders don't.

## Manifest: `baab.config.json`

```jsonc
{
  "spec": 1,
  "name": "Acme Corp",
  "slug": "acme-corp",
  "createdWith": "baab@0.1.0",
  "folders": {
    "registry":       { "kinds": ["entity"] },
    "projects":       { "kinds": ["project"] },
    "clients":        { "kinds": ["client"] },
    "infrastructure": { "kinds": ["app"] },
    "operations":     { "kinds": [] },
    "knowledge":      { "kinds": [] }
  },
  "frontmatter": {
    "types": ["entity","client","project","app","runbook","concept","index","standard","template"],
    "statuses": ["active","staged","planned","deprecated","archived"]
  },
  "validate": { "ignore": ["inbox/**"] }
}
```

- `folders` maps each governed folder to the kinds that spawn there. Add a folder or a
  kind here to extend the workspace.
- `frontmatter.types` / `.statuses` are the validated enums — extend them to add your
  own document types without changing the tooling.
- `validate.ignore` lists globs exempt from frontmatter/naming rules.

## Frontmatter schema

Required on every markdown file **except** `CLAUDE.md`, `README.md`, anything under
`.claude/`, and any path matching `validate.ignore` (by default `inbox/**`).

```yaml
---
type: project          # one of frontmatter.types
id: q3-launch          # unique across the whole workspace
status: active         # one of frontmatter.statuses
created: 2026-01-15    # YYYY-MM-DD
updated: 2026-01-15    # YYYY-MM-DD
tags: [product]        # optional list
# optional:
superseded_by: <id>    # required when status: deprecated
---
```

Kind-specific notes may carry additional optional keys (e.g. a client's contacts
file). Those are documented per-template and validated only when present.

## Validation rules

| Rule | Severity | Check |
| --- | --- | --- |
| BAAB001 | error | Missing frontmatter on a scoped note |
| BAAB002 | error | Missing a required frontmatter key |
| BAAB003 | error / warning | `type`/`status` outside the enum (error); non-ISO date (warning) |
| BAAB004 | error | Duplicate `id` across the workspace |
| BAAB005 | warning | Filename not lowercase-hyphenated / numeric prefix |
| BAAB006 | error | Broken wikilink or relative markdown link |
| BAAB007 | warning | Governed folder missing `CLAUDE.md` or `_index.md` |
| BAAB008 | error | Committed secret **value** (`op://` refs exempt) |
| BAAB009 | warning | `status: deprecated` without `superseded_by` |
| BAAB010 | warning | Spawned member missing from its `_registry.md` (index stale) |

## Growth folders

v1 keeps the tree lean. Businesses that outgrow it commonly add `brand/`,
`automation/`, or `strategy/` folders — declare them in `folders` (with `kinds: []`
for free-form areas) and give each a `CLAUDE.md` + `_index.md`. Future spec versions
may standardize more of these.
