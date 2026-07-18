# {{name}}

A [BaaB](https://github.com/ohxhavel/baab-kit) workspace — this business as a
governed, indexed markdown book.

## Quick start

```bash
baab status                 # overview of the workspace
baab new project my-thing   # spawn a new project from the template
baab index                  # rebuild the search index + registries
baab search "onboarding"    # full-text search across every note
baab doctor                 # check the tree against the four laws
```

## Layout

| Folder | What lives here |
| --- | --- |
| `registry/` | Business entities (this business is at `registry/{{slug}}/`) |
| `projects/` | Projects, one folder each |
| `clients/` | Client accounts, one folder each |
| `infrastructure/` | Managed tools and accounts |
| `operations/` | Runbooks and SOPs |
| `knowledge/` | Concepts, lessons, reference |
| `_standards/` | The laws every note obeys |
| `inbox/` | Unsorted drop zone |

Read `CLAUDE.md` for how to work in this tree. Every folder has its own `CLAUDE.md`
with the specifics for that area.

Created {{date}} with `baab`.
