# Claude integration

Every workspace `baab init` creates is ready to be managed by Claude Code (or Claude
in the cloud) from the first minute. This page explains the `.claude/` layer and how
to extend it. Skip it with `baab init --no-claude` if you don't want it.

## What ships

```
.claude/
├── agents/workspace-manager.md      # a governance agent
├── commands/workspace-status.md     # /workspace-status slash command
└── skills/spawn-entity/SKILL.md     # the "always spawn, never freehand" skill
.mcp.json                            # MCP server configuration (starts empty)
CLAUDE.md                            # the root kit, loaded into every session
```

### The root kit (`CLAUDE.md`)

Claude Code loads `CLAUDE.md` into context automatically. The generated one describes
the tree, the four laws, and how to work in the workspace — so an agent knows the
rules before it touches anything. Each governed folder has its own `CLAUDE.md` with
the specifics for that area.

### workspace-manager agent

A subagent scoped to keep the tree healthy: it spawns entities/projects/clients/apps
with `baab new`, runs `baab index` and `baab doctor` after changes, and searches for a
fact's existing home before writing a new note. Delegate structural and governance
work to it.

### workspace-status command

`/workspace-status` runs `baab status` and `baab doctor` and summarizes the result —
counts, index freshness, and anything the doctor flagged.

### spawn-entity skill

Encodes the fourth law as a reusable procedure: to add anything new, use
`baab new <kind> <slug>`, never `mkdir` and hand-written files. Claude loads the skill
when it's about to create structure.

## Wiring up MCP servers

`.mcp.json` starts empty:

```json
{ "mcpServers": {} }
```

Add the servers this business uses. For example, a filesystem-scoped server or a
hosted connector:

```jsonc
{
  "mcpServers": {
    "my-crm": {
      "command": "npx",
      "args": ["-y", "@example/mcp-crm"],
      "env": { "CRM_TOKEN": "op://vault/crm/token" }
    }
  }
}
```

Keep credentials as `op://` references and resolve them at runtime — never paste
values into `.mcp.json`. `baab doctor` scans the tree for committed secrets.

## Developing further

The workspace is clean, governed infrastructure — a starting point. Add projects,
wire up MCP servers, extend the frontmatter enums in `baab.config.json`, add growth
folders with `baab folder add`, or run `baab serve` to expose the workspace to an agent
over HTTP. Because the structure is uniform and every folder documents itself, an agent
can keep building on it without re-learning the layout each time. Generating the
workspace with `baab init --devcontainer` gives it a ready-to-code dev container too.
