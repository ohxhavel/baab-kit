---
type: standard
id: standard-lifecycle
status: active
created: {{date}}
updated: {{date}}
tags: [standards, lifecycle]
---

# Lifecycle

How a note is born, changes, and retires — and the one rule that keeps the whole
workspace coherent.

## One canonical home per fact

Every fact lives in exactly one place. When another note needs it, **link** to that
place — never copy the fact. Copies drift; links don't. This is the single most
important rule in the workspace.

Link with a wikilink (`[[the-note-id]]`) or a relative markdown link
(`[label](../folder/note.md)`). `baab doctor` flags links that resolve to nothing.

## Status transitions

- `planned` → something intended but not started.
- `staged` → in progress, not yet live.
- `active` → the current, canonical version.
- `deprecated` → superseded but kept for reference. Set `superseded_by` to the id
  of the replacement.
- `archived` → retired and no longer maintained.

Update `updated:` whenever you change a note's substance.

## Creating and retiring

- Create with `baab new` so the note is shaped from its template.
- Retire by moving to `deprecated`/`archived` — don't delete history the rest of the
  workspace may still link to.
