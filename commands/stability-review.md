---
description: Run the quarterly stability review report. Surfaces files due for promotion or re-review.
---

You are running the quarterly stability review for the design-ai knowledge corpus.

## Step 1 — Generate the report

Run:

```bash
python3 tools/audit/stability-review.py --output docs/STABILITY-REVIEW.md
```

This produces `docs/STABILITY-REVIEW.md` with:
- Summary by stability level (stable / beta / experimental / deprecated).
- Promotion candidates (experimental → stable after 6mo; beta → stable after 3mo).
- Stable files due for re-review (≥ 12 months old).
- Deprecated files awaiting removal in next major.
- Files missing the `stability` metadata.

## Step 2 — Read the report and summarize for the user

Read the generated `docs/STABILITY-REVIEW.md` and summarize:

```
Stability review summary:
- N files at stable, M at beta, K at experimental, J at deprecated.
- Promotion candidates: X experimental → stable, Y beta → stable.
- Re-review needed: Z stable files > 12 months old.
- Action items: ...
```

## Step 3 — Suggest the next bulk operation (don't run it without confirmation)

If there are promotion candidates, offer to run:

```bash
python3 tools/migrations/promote-stability.py --from <level> --to stable <files...>
```

If there are stale stable files, offer to run:

```bash
python3 tools/migrations/bump-last-updated.py <files...>
```

Both tools support `--dry-run`. Always dry-run first; ask the user to confirm before applying.

## Step 4 — Document the outcome

After the user confirms changes, suggest a CHANGELOG entry:

```markdown
### Stability review (Q<N> <YYYY>)
- Promoted to stable: <list>
- Reviewed + bumped: N files
```

## Reference

- Full ritual documentation: [`docs/CONTRIBUTING.md`](../docs/CONTRIBUTING.md) "Quarterly stability review"
- Tools:
  - [`tools/audit/stability-review.py`](../tools/audit/stability-review.py)
  - [`tools/migrations/promote-stability.py`](../tools/migrations/promote-stability.py)
  - [`tools/migrations/bump-last-updated.py`](../tools/migrations/bump-last-updated.py)

## Verification phase (run before declaring done)

- [ ] Did I run `stability-review.py` and read the output?
- [ ] Did I summarize the report for the user (counts + action items)?
- [ ] Did I dry-run any bulk operation before applying?
- [ ] Did I get user confirmation before running mutation commands?
- [ ] Did I propose a CHANGELOG entry for the changes?
