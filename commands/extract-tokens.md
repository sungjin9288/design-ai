---
description: Refresh the knowledge base — pull upstream sources, run all extractors, regenerate knowledge/.
---

Refresh the design knowledge base.

## Steps

1. **Optional pull**: if `$ARGUMENTS` contains `--pull`, run `git -C refs/<repo> pull` for each subdirectory in `refs/` first. Skip otherwise (faster, uses cached state).

2. **Run all extractors**:
   ```bash
   bash tools/extractors/run-all.sh
   ```

3. **Verify outputs**: list every file in `knowledge/` modified in the last 60 seconds. Confirm:
   - YAML frontmatter is valid (parses, has `title`, `source`, `extracted_at`).
   - File is non-empty.
   - File is under 1 MB.

4. **Report**:
   ```
   Updated:
     - knowledge/design-tokens/ant-design.md (33 tokens, 13 presets)
     - knowledge/typography/mui-type-scale.md (13 variants)
     - ...

   Skipped (hand-written):
     - knowledge/colors/color-theory.md
     - ...
   ```

## Done when

- All extractors ran exit-zero.
- Generated files have valid frontmatter.
- Hand-written files are untouched.
- Summary report printed.
