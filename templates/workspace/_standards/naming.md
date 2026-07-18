---
type: standard
id: standard-naming
status: active
created: {{date}}
updated: {{date}}
tags: [standards, naming]
---

# Naming

Predictable names make a workspace navigable by both people and agents.

## Files and folders

- Lowercase, hyphen-separated: `client-onboarding.md`, `q3-launch/`.
- No spaces, no camelCase, no underscores between words.
- No numeric prefixes for ordering (`01-intro.md` is wrong). Order comes from
  frontmatter and links, not filenames.

## The underscore prefix

A single leading underscore marks a governance or meta file:

- `_index.md` — the map of contents for a folder.
- `_registry.md` — the generated roster of a folder's members.
- `_template/` — a template directory (if you keep one locally).

Don't use the underscore prefix for ordinary notes.

## Ids

An `id` in frontmatter follows the same rules and must be unique across the whole
workspace. When you spawn something with `baab new`, the slug you pass becomes both
the folder name and the id.
