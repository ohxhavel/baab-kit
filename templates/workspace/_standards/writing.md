---
type: standard
id: standard-writing
status: active
created: {{date}}
updated: {{date}}
tags: [standards, writing]
---

# Writing

Notes exist to be read later, usually by someone who has lost the context you have
now. Write for them.

## Principles

- **Lead with the point.** The first line says what this note is and why it matters.
- **Be concrete.** Names, dates, paths, numbers. "The launch is blocked on the DNS
  cutover" beats "there are some blockers."
- **Say it once.** If a fact belongs to another note, link to it (see [[lifecycle]]).
- **No filler.** Cut sentences that don't change what the reader would do next.
- **Plain sentences.** Skip the arrow chains and abbreviations; write it out.

## Secrets

Never write a secret value into a note. Reference it as `op://vault/item/field` (or
whatever secret manager your business uses). `baab doctor` scans for committed
credentials and will fail the check if it finds one.

## Structure

Short notes are prose. Longer notes get headings. Tables are for enumerable facts,
not for hiding explanation in cells. A note that needs a diagram gets a diagram.
