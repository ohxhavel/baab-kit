---
type: standard
id: standard-frontmatter
status: active
created: {{date}}
updated: {{date}}
tags: [standards, frontmatter]
---

# Frontmatter

Every governed note starts with a YAML frontmatter block. It's what makes the
workspace machine-readable — search, registries, and status all read these fields.

```yaml
---
type: project
id: my-thing
status: active
created: 2026-01-15
updated: 2026-01-15
tags: [product]
---
```

## Required fields

| Field | Meaning |
| --- | --- |
| `type` | What kind of note this is (see the enum below). |
| `id` | A unique slug for this note, unique across the whole workspace. |
| `status` | Where it sits in its lifecycle (see the enum below). |
| `created` | The date it was created, `YYYY-MM-DD`. |
| `updated` | The date it last changed, `YYYY-MM-DD`. |

`tags` is optional but recommended — a list of lowercase keywords.

## Type enum

`entity`, `client`, `project`, `app`, `runbook`, `concept`, `index`, `standard`,
`template`. You can extend this list in `baab.config.json` under
`frontmatter.types`.

## Status enum

`active`, `staged`, `planned`, `deprecated`, `archived`. When a note is
`deprecated`, set `superseded_by` to the id of whatever replaced it.

## Exemptions

`CLAUDE.md` kit files, `README.md` files, and anything under `inbox/` don't need
frontmatter. Everything else does.
