# Contributing to BaaB

Thanks for helping. This is a small, focused tool — the bar is correctness, clarity,
and keeping the surface lean.

## Setup

```bash
npm install
npm run build
npm test
```

Requires Node 22+ (which ships `node:sqlite`, so no native build is needed).

## The commands you'll run

| Command | What |
| --- | --- |
| `npm run build` | Compile `src` → `dist` with tsc. |
| `npm run typecheck` | Type-check without emitting. |
| `npm run lint` | Biome (lint + format check). |
| `npm run format` | Biome autoformat. |
| `npm run check:boundaries` | Enforce the SDK/CLI/API import boundary. |
| `npm run check:privacy` | Fail if any private data appears in `templates/` or `docs/`. |
| `npm test` | Full suite (unit + e2e). |
| `npm run test:unit` | Unit tests only (fast). |
| `npm run test:e2e` | The packed-CLI end-to-end test. |

## Rules that CI enforces

1. **The core boundary.** `src/core/**` is the SDK. It must never import from
   `src/cli/**`, `src/api/**`, or any terminal/output library (`commander`,
   `picocolors`). `npm run check:boundaries` fails the build if it does. This is what
   keeps the SDK embeddable — the CLI and the HTTP API are both thin layers over it.

2. **Templates carry zero private data.** Everything under `templates/` and `docs/` is
   authored from scratch and generic. A CI grep-gate fails on business-specific
   strings. Never copy content from a real workspace into a template.

3. **A generated workspace passes its own doctor.** The e2e test runs `baab init`
   from the packed tarball and asserts `baab doctor` exits 0. If you change a template
   or a validation rule, keep this invariant — it pins the spec, templates, and
   validator together.

## Where things live

- `src/core/` — the SDK: workspace, scaffold, spawn, folder, index, search, validate.
- `src/cli/` — commander wiring over the SDK.
- `src/api/` — the local HTTP API (`node:http`) over the SDK.
- `templates/workspace/` — what `baab init` renders.
- `templates/kinds/` — what `baab new` renders.
- `tests/unit/`, `tests/e2e/` — vitest.
- `docs/` — the normative spec and references.

## Adding a validation rule

Add a `rules-*.ts` under `src/core/validate/`, register it in
`src/core/validate/index.ts`, give it a `BAABxxx` id, document it in
`docs/workspace-spec.md`, and add a failing-fixture test in `tests/unit/doctor.test.ts`.

## Pull requests

Keep them focused. Run `npm test` and `npm run lint` before opening one. Match the
surrounding code's style — the writing law in the generated `_standards/writing.md`
applies to our own prose too.
