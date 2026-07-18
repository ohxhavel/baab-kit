---
description: Report this BaaB workspace's health — status overview plus a validation pass.
---

Run the workspace status and validation checks, then summarize for the user.

1. Run `baab status` and read the overview (entity/project/client/app counts, index
   freshness, validation summary).
2. Run `baab doctor` and read the diagnostics.
3. If the index is stale, run `baab index` first, then re-run the two commands.

Report back:
- The counts and whether the index is fresh.
- Any doctor errors (these must be fixed) and warnings (these should be).
- A one-line recommendation for what to do next if anything is off.
