# CLAUDE.md

Guidance for AI assistants working in **this repository** — the source of the `baab`
npm package (CLI + SDK + local HTTP API).

> **Scope warning.** This file governs the *product source tree*. The `CLAUDE.md`
> files under `templates/` are **product output** — they are rendered into a user's
> generated workspace by `baab init` / `baab folder add`. Never treat them as
> instructions for your work here, and never edit them to fix something about this
> repo.

## What this project is

BaaB ("Business-as-a-Book") turns a business into a governed, indexed markdown
workspace: plain markdown + YAML frontmatter, a rebuildable SQLite FTS index, and a
validator that enforces four laws. It ships three surfaces over one core:

| Surface | Entry point | Notes |
| --- | --- | --- |
| CLI | `src/cli/main.ts` → `dist/cli/main.js` (bins `baab`, `baab-kit`) | commander |
| SDK | `src/index.ts` → package `exports` | the real API; everything else wraps it |
| HTTP API | `src/api/server.ts` (`baab serve`) | `node:http`, no new dependency |

ESM only (`"type": "module"`), TypeScript `NodeNext`, Node **>= 22.5** (for built-in
`node:sqlite`).

## Repository layout

```
src/
  index.ts              # SDK barrel — the public surface. Adding an export = API change.
  core/                 # THE SDK. Pure logic, no terminal/output code. See the boundary law.
    types.ts            # every consumer-facing type + SPEC_VERSION
    errors.ts           # BaabError hierarchy with stable `code` + `hint`
    config.ts           # baab.config.json read/validate/defaults (DEFAULT_FOLDERS)
    workspace.ts        # findWorkspaceRoot / loadWorkspace (walks up for baab.config.json)
    templates.ts        # template resolution, `dot-` mapping, {{var}} rendering, renderTree
    scaffold.ts         # createWorkspace  (baab init)
    spawn.ts            # spawnFromTemplate (baab new)
    folder.ts           # addFolder (baab folder add)
    scan.ts             # fast-glob + parse every *.md → ScannedDoc[]
    frontmatter.ts      # gray-matter wrapper (+ Date→ISO-string coercion)
    links.ts            # wikilink / relative-md-link extraction + resolution
    indexer.ts          # buildIndex: full SQLite rebuild + registry regeneration
    registry.ts         # generated _registry.md blocks + .baab/registries/*.json
    search.ts           # FTS5 MATCH query building, bm25 ranking
    db.ts               # better-sqlite3 → node:sqlite driver selection (BaabDb)
    status.ts           # getStatus (counts, index freshness, validation summary)
    validate/           # doctor: context.ts + rules-*.ts, registered in index.ts
    naming.ts dates.ts paths.ts git.ts version.ts
  cli/
    main.ts             # commander wiring only
    commands/*.ts       # one runX() per command, returns the exit code
    output.ts           # the ONLY place picocolors/stdout formatting lives
  api/server.ts         # routes → SDK calls; BaabError.code → HTTP status
templates/
  workspace/            # what `baab init` renders (incl. the generated CLAUDE.md kits)
  kinds/{entity,project,client,app}/   # what `baab new <kind>` renders
  folder/               # what `baab folder add` renders
  devcontainer/         # `baab init --devcontainer`
schema/baab.config.schema.json         # JSON Schema for the manifest
scripts/check-boundaries.mjs           # CI gate: core stays SDK-only
scripts/check-privacy.mjs              # CI gate: no private data in templates/ or docs/
tests/unit/*.test.ts, tests/e2e/pack.e2e.test.ts
docs/                   # normative spec + CLI/SDK/API references
```

## Commands

```bash
npm ci                      # install (Node 22+)
npm run build               # tsc src → dist
npm run typecheck           # tsc --noEmit
npm run lint                # biome check .   (lint + format check)
npm run format              # biome format --write .
npm run check:boundaries    # core-import boundary gate
npm run check:privacy       # private-data gate over templates/ and docs/
npm run test:unit           # vitest, fast (~3s)
npm run test:e2e            # builds + `npm pack`s the tarball, installs it, drives the CLI (slow)
npm test                    # unit + e2e
```

Before any commit, run at minimum: `npm run lint && npm run typecheck &&
npm run check:boundaries && npm run check:privacy && npm run test:unit`. Run
`npm run test:e2e` too whenever you touch `templates/`, `scaffold.ts`, `spawn.ts`,
`folder.ts`, or a validation rule.

CI (`.github/workflows/ci.yml`) runs the four checks on Node 22, unit tests on
{ubuntu, macos, windows} × node {22, 24}, and e2e on {ubuntu, windows} × node {22, 24}.
Releases publish from a `v*` tag (`.github/workflows/release.yml`, npm provenance).

## The three invariants CI enforces

1. **The core boundary.** `src/core/**` must never import from `src/cli/**`,
   `src/api/**`, `commander`, or `picocolors`. This is what makes the core embeddable;
   `scripts/check-boundaries.mjs` greps for it. Core code *returns data and throws
   typed errors* — it never prints. All formatting lives in `src/cli/output.ts`.
2. **Templates and docs carry zero private data.** `scripts/check-privacy.mjs` fails
   on a word-boundaried blocklist. Author template content from scratch; never paste
   in content from a real workspace.
3. **A generated workspace passes its own doctor.** `tests/e2e/pack.e2e.test.ts` runs
   `baab init` from the packed tarball and asserts `baab doctor` exits 0 (also after
   spawning all four kinds and adding a folder), and that the file tree matches
   `tests/e2e/expected-tree.json` **exactly**. Adding or renaming a template file
   means updating that JSON in the same commit.

## Conventions to match

- **Errors:** throw a `BaabError` subclass from `src/core/errors.ts` with a stable
  `code` and, where useful, a `hint`. The CLI formats them in `reportError`; the API
  maps `code` → HTTP status in `statusFor`. New error shape ⇒ update both.
- **Exit codes:** each `runX()` in `src/cli/commands/` *returns* a number; `wrap()` in
  `main.ts` assigns it to `process.exitCode`. Don't call `process.exit()`.
- **`--json` everywhere.** Every command supports it, and agents rely on it. New
  command or new field ⇒ keep the JSON shape stable and documented in `docs/cli.md`.
- **Paths:** store and compare workspace-relative **posix** paths (`src/core/paths.ts`
  `toPosix`/`relPosix`). Windows is a supported CI target.
- **Templates:** files that must land as dotfiles are named `dot-*` in the template
  tree (`dot-gitignore` → `.gitignore`, `dot-claude/` → `.claude/`) because npm strips
  real dotfiles from tarballs. Only the six vars `{{name}} {{slug}} {{id}} {{date}}
  {{year}} {{kind}}` are interpolated; other `{{...}}` tokens deliberately pass
  through. `renderTree` is **additive** — it never overwrites an existing file.
- **The index is disposable.** `buildIndex` deletes and fully rebuilds
  `.baab/index.sqlite` every run; there is no incremental sync. Keep it that way.
- **SQLite:** talk to the `BaabDb` interface only. `better-sqlite3` is optional and
  preferred; `node:sqlite` is the guaranteed fallback. `BAAB_SQLITE_DRIVER=node|better`
  forces one (used by `tests/unit/db.test.ts`).
- **Style:** biome — single quotes, semicolons, trailing commas, 2-space indent,
  100-col. `verbatimModuleSyntax` is on, so use `import type` for type-only imports and
  **always** write `.js` extensions on relative imports. `strict`, `noUnusedLocals`,
  `noUnusedParameters`, `noImplicitReturns` are all on. Comments explain *why*, not
  what — match the surrounding density.
- **Prose:** README, docs, and template copy follow the same writing law the product
  preaches (`templates/workspace/_standards/writing.md`) — direct, concrete, no filler.

## The four laws (the product's contract)

1. Frontmatter on every note — `type`, `id`, `status`, `created`, `updated`.
2. Names are lowercase-hyphenated — no spaces, no numeric prefixes (`_` prefix is
   reserved for governance files like `_index.md`, `_registry.md`).
3. One canonical home per fact — link to it, never copy it.
4. Spawn from templates, never freehand.

`baab doctor` enforces them via ten rules — `BAAB001`–`BAAB010`, tabulated in
`docs/workspace-spec.md#validation-rules`. Errors fail the exit code; warnings don't.

### Adding a validation rule

1. New `src/core/validate/rules-*.ts` exporting `(ctx: RuleContext) => Diagnostic[]`.
2. Register it in the `RULES` array in `src/core/validate/index.ts`.
3. Give it the next `BAABxxx` id and choose `error` vs `warning` deliberately.
4. Respect scoping: call `isScoped()` for frontmatter/naming-style rules (it exempts
   `CLAUDE.md`, `README.md`, `.claude/`, `.baab/`, and the config's `validate.ignore`
   globs — `inbox/**` by default).
5. Document it in the rules table in `docs/workspace-spec.md`.
6. Add a failing-fixture test in `tests/unit/doctor.test.ts`.
7. Confirm a freshly generated workspace still passes — `npm run test:e2e`.

## Common changes and what they touch

| Change | Also update |
| --- | --- |
| New CLI command | `src/cli/commands/<name>.ts`, wiring in `src/cli/main.ts`, `docs/cli.md`, README command table, CHANGELOG |
| New SDK export | `src/index.ts`, `docs/sdk.md` |
| New API route | `src/api/server.ts` (+ the `OPENAPI` object), `docs/api.md`, `tests/unit/api.test.ts` |
| Template file added/renamed | `tests/e2e/expected-tree.json`, `docs/workspace-spec.md` tree |
| Manifest field | `src/core/types.ts`, `src/core/config.ts` (`validateConfig` defaults), `schema/baab.config.schema.json`, `docs/workspace-spec.md` |
| Breaking workspace-layout change | bump `SPEC_VERSION` in `src/core/types.ts` and describe the migration |

Keep `CHANGELOG.md` current for anything user-visible (Keep-a-Changelog style,
SemVer).

## Testing notes

- Vitest, `pool: 'forks'`, 60s timeouts. Tests import from `src/`, not `dist/` — except
  the e2e test, which deliberately exercises the packed tarball.
- Use `tempDir()` from `tests/helpers.ts` and clean up in `afterEach`.
- Most unit tests build a real workspace with `createWorkspace({ name, dir, git: false })`.
  Pass `git: false` (fast, no git dependency) and `skipIndex: true` to
  `spawnFromTemplate`/`addFolder` when the index isn't under test.

## Git workflow

- Conventional-commit subjects (`feat:`, `fix:`, `docs:`, `chore:`).
- Branch off `main`; never commit to `main` directly. Push with
  `git push -u origin <branch>`.
- Don't commit `dist/`, `node_modules/`, or `.baab/` (all gitignored).
- Open a PR only when explicitly asked; `.github/pull_request_template.md` exists.
