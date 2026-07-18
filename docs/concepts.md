# Concepts

BaaB models a business as a **book**: one coherent, governed document tree that any
person or agent can pick up and navigate. This page explains the ideas behind it.

## A workspace is markdown

A BaaB workspace is a directory of plain markdown files with YAML frontmatter. That's
a deliberate choice: markdown is portable, diff-friendly, readable without any tool,
and works in Obsidian, VS Code, or a plain editor. Nothing is locked in a database.
The SQLite index under `.baab/` is derived state — delete it and `baab index` rebuilds
it exactly.

## Governed folders and kits

The tree has a fixed set of governed folders (`registry`, `projects`, `clients`,
`infrastructure`, `operations`, `knowledge`). Each carries a `CLAUDE.md` **kit** — a
short set of instructions for how to work in that folder — and an `_index.md` map of
contents. The kit is what makes the workspace legible to an agent: it can read the kit
for a folder and know the rules before acting.

## Spawn, never freehand

New things aren't created by hand. You run `baab new <kind> <slug>`, and the CLI copies
a template into the right folder, fills in the frontmatter, and gives the new entity a
unique id. This is the single most important discipline in BaaB: it's why every
project looks like every other project, why the registries never drift, and why an
agent can reason about the tree without surprises.

The four kinds:

- **entity** — a business (the workspace's own business is the first one).
- **project** — a product or internal initiative.
- **client** — a customer account.
- **app** — a managed tool or service the business runs on.

## One canonical home per fact

Every fact lives in exactly one note. When another note needs it, it links — with a
wikilink (`[[note-id]]`) or a relative markdown link. Copies drift out of sync; links
don't. `baab doctor` flags links that resolve to nothing, so the graph stays honest.

## The index and registries

`baab index` does two things:

1. Builds a SQLite full-text index (`.baab/index.sqlite`) over every note's title,
   body, and tags, plus a link graph. `baab search` queries it.
2. Regenerates each folder's `_registry.md` — a machine-readable roster (a markdown
   table plus a JSON block) built from the frontmatter of that folder's members. The
   frontmatter is the source of truth; the table can never drift because it's
   generated, never hand-edited.

## Validation

`baab doctor` runs a set of rules (BAAB001–BAAB010) covering frontmatter presence and
schema, naming, broken links, missing kits, stale registries, and — importantly —
committed secret values. It exits non-zero when it finds an error, so it fits in CI
or a pre-commit hook. A freshly created workspace passes with zero errors; that's a
guarantee the tooling holds itself to.

## Secrets

BaaB never wants a secret value in the tree. Reference secrets as
`op://vault/item/field` (the 1Password reference syntax, but any placeholder works).
The doctor's secret rule scans for committed credentials — AWS keys, GitHub tokens,
private keys, inline `key: value` credentials — and fails if it finds one, while
explicitly allowing `op://` references.

## Built for agents

The generated `.claude/` folder ships a **workspace-manager** agent, a
**workspace-status** command, and a **spawn-entity** skill, and `.mcp.json` is ready
for you to wire up MCP servers. A workspace is meant to be handed to Claude Code and
developed further — it's clean infrastructure, not a finished artifact.
