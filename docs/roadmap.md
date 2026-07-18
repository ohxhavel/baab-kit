# Roadmap

BaaB v1 ships three surfaces over one core: **CLI**, **SDK**, and a local **HTTP API**
(`baab serve`). What's below is deliberately deferred — the design is intentionally
lean, and `spec: 1` plus config-extensible enums are the pressure valve that lets these
land without breaking existing workspaces.

## Deferred to v1.x

- **Semantic search / embeddings.** Today's index is SQLite FTS5 (lexical). A vector
  index over the same documents would add "find related notes" and natural-language
  retrieval. It'd be an optional add-on so the zero-dependency default stays intact.
- **Cloud sync.** Workspaces are local markdown + git today. A sync layer (push/pull a
  workspace to a hosted store, or reconcile across devices) is a natural extension —
  the derived `.baab/` index stays local and rebuildable either way.
- **Hosted / multi-tenant API + auth.** The v1 API is local-only and unauthenticated
  by design. A hosted mode would need authentication, per-workspace isolation, and
  rate limiting before it could be exposed beyond localhost.
- **Spec migration (`baab migrate`).** `baab.config.json` pins a `spec` version. At
  `spec: 1` there's nothing to migrate, so no migrator exists yet. When a `spec: 2`
  introduces a breaking structural change, `baab migrate` will upgrade a workspace in
  place and bump the version. Until then, the forward-compat contract is: a newer
  workspace opened by an older CLI fails fast with a clear "upgrade the CLI" error.
- **More kinds and growth-folder templates.** v1 ships four kinds (entity, project,
  client, app) and lets you add governed folders with `baab folder add`. Richer
  built-in folder/kind templates (brand, automation, strategy) may ship as presets.

## Not planned

- A required cloud account or backend. BaaB is local-first on purpose; any hosted
  capability will always be opt-in on top of the free, offline core.

Have a request? Open an issue — see [CONTRIBUTING](../CONTRIBUTING.md).
