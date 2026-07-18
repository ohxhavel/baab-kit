---
name: spawn-entity
description: Standard way to add a new entity, project, client, or app to this BaaB workspace. Use whenever something new needs its own home in the tree — always spawn from a template with `baab new`, never create folders and files by hand.
---

# Spawning into the workspace

This workspace follows one hard rule: **new things are spawned from templates, never
created freehand.** That's what keeps every entity, project, client, and app shaped
the same way, correctly frontmattered, and picked up by the index and registries.

## Steps

1. Pick the kind: `entity` (a business), `project`, `client`, or `app` (a managed
   tool/service).
2. Pick a slug — lowercase, hyphen-separated, unique in the workspace
   (e.g. `acme-corp`, `q3-launch`).
3. Run it:

   ```bash
   baab new <kind> <slug>
   # optionally a display name:
   baab new project q3-launch --name "Q3 Launch"
   ```

4. Run `baab index` (spawning already rebuilds it, but run it after any manual edits)
   and `baab doctor` to confirm the tree is still clean.
5. Open the generated folder and fill in the details.

## Don't

- Don't `mkdir` a new project/client/app folder and write files by hand — it will be
  inconsistent and may fail `baab doctor`.
- Don't copy an existing entity's files to make a new one — spawn a fresh one so the
  frontmatter ids stay unique.
