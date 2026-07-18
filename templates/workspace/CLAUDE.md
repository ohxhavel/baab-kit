# {{name}}

This is a **BaaB workspace** — Business-as-a-Book. Everything this business knows
and runs lives here as governed markdown: one canonical home per fact, every folder
carrying its own instructions, everything indexed and lintable.

You (an AI agent or a person) are reading the root kit. It tells you how to work in
this tree. Read the kit for a folder before you act inside it.

## The tree

- `registry/` — the business-entity registry. One 1-pager per entity (the business
  itself lives at `registry/{{slug}}/`). Spawn new entities, never hand-roll them.
- `projects/` — product and internal projects, one folder each.
- `clients/` — client accounts, one folder each.
- `infrastructure/` — the managed tools and accounts this business runs on.
- `operations/` — runbooks, SOPs, and recurring process docs.
- `knowledge/` — concepts, lessons, and reference material.
- `_standards/` — the laws every note obeys. Read these once.
- `inbox/` — a single place to drop unsorted notes before they're routed.

## The four laws

1. **Frontmatter on every note.** Type, id, status, dates. See [[frontmatter]].
2. **Names are lowercase-hyphenated.** No spaces, no numeric prefixes. See [[naming]].
3. **One canonical home per fact.** Link to it; never copy it. See [[lifecycle]].
4. **Spawn from templates, never freehand.** Use `baab new <kind> <slug>`. This keeps
   every entity, project, and client shaped the same way.

## Working here

- Create things with the CLI: `baab new project <slug>`, `baab new client <slug>`,
  `baab new entity <slug>`, `baab new app <slug>`.
- After edits, run `baab index` to refresh search and regenerate the `_registry.md`
  rosters, then `baab doctor` to check the tree against the four laws.
- `baab search "<query>"` searches everything. `baab status` shows the overview.
- Secrets are never written as values. Reference them as `op://vault/item/field`.

## For Claude Code / Claude cloud

The `.claude/` folder ships a **workspace-manager** agent, a **workspace-status**
command, and a **spawn-entity** skill. `.mcp.json` is where you wire up MCP servers
this business uses. This workspace is meant to be developed further from here — treat
it as clean, governed infrastructure, not a finished artifact.
