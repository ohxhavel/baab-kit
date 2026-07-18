## What & why

Briefly: what does this change, and why?

## Checklist

- [ ] `npm test` passes (unit + e2e).
- [ ] `npm run lint` and `npm run typecheck` pass.
- [ ] `npm run check:boundaries` and `npm run check:privacy` pass.
- [ ] If I changed a template or a validation rule, a freshly `baab init`ed workspace
      still passes `baab doctor` (the e2e asserts this).
- [ ] Docs updated if behavior or the CLI/SDK/API surface changed.
- [ ] No private data or secret values added to `templates/` or `docs/`.

## Notes

Anything reviewers should know.
