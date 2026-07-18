# Security policy

## Reporting a vulnerability

Please report security issues privately. Use GitHub's **"Report a vulnerability"**
flow on the [Security tab](https://github.com/ohxhavel/baab-kit/security/advisories/new),
or open a minimal issue asking for a private channel — do not post exploit details in a
public issue.

We'll acknowledge within a few days and keep you updated through to a fix and
disclosure.

## Scope and expectations

A few things worth knowing about BaaB's security posture:

- **The secret scanner is best-effort, not a guarantee.** `baab doctor`'s BAAB008 rule
  looks for common committed-credential patterns (AWS keys, GitHub tokens, private-key
  blocks, inline `key: value` credentials) and flags them. It will miss novel or
  obfuscated secrets. Treat it as a safety net, not a substitute for keeping secrets
  out of the tree entirely — reference them as `op://vault/item/field` instead.
- **The HTTP API (`baab serve`) is local-only by design.** It binds `127.0.0.1`, has no
  authentication, and is read-only unless you pass `--write`. Do not expose it to a
  network or the public internet. A hosted, authenticated mode is a future roadmap item.
- **BaaB executes no workspace content.** It reads and writes markdown and a local
  SQLite index; it does not evaluate or run anything from a workspace.

## Supported versions

BaaB is pre-1.0. Security fixes land on the latest published version.
