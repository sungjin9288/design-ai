# Contributing

## Adding a new source repo

1. Add to `refs/` via sparse clone:
   ```bash
   git clone --depth 1 --filter=blob:none --sparse https://github.com/<org>/<repo>.git refs/<name>
   git -C refs/<name> sparse-checkout init --cone
   git -C refs/<name> sparse-checkout set <only the dirs you need>
   ```
2. Add it to the table in `README.md`.
3. Write or update an extractor in `tools/extractors/<source>.py`.
4. Run `./tools/extractors/run-all.sh`.
5. Verify generated files in `knowledge/` cite the new source.

## Adding a new skill

1. Create `skills/<skill-name>/`.
2. Author `PLAYBOOK.md` with the step-by-step process.
3. Author `SKILL.md` — same content, with frontmatter:
   ```markdown
   ---
   name: <skill-name>
   description: <one sentence — the trigger condition>
   ---
   ```
4. Author `TEMPLATE.md` if the skill produces a structured artifact.
5. Add a worked example in `skills/<skill-name>/examples/`.
6. Update `skills/README.md` index.

## Adding a new agent persona

1. Create `agents/<persona>.md` with frontmatter:
   ```markdown
   ---
   name: <persona>
   description: <when to spawn>
   tools: [Read, Grep, Glob]
   ---
   ```
2. Body: persona description, scope, output format.
3. Update `agents/README.md` index.

## Adding a slash command

1. Create `commands/<name>.md` with frontmatter:
   ```markdown
   ---
   description: <what /name does>
   ---
   ```
2. Body: the prompt template the command expands to.
3. Update `commands/README.md` index.

## Editing knowledge files

- Generated files: edit the extractor, re-run, do not edit output by hand.
- Hand-written files: must include `<!-- hand-written -->` at the top of the body.
- Mixed files: not allowed. Split into one generated + one hand-written file with cross-links.

## Citation rules

When a knowledge file references upstream source:
```markdown
---
source: refs/ant-design/components/button/Button.tsx
extracted_at: 2026-05-07
---
```

Multi-source files use a list:
```yaml
sources:
  - refs/ant-design/components/button/Button.tsx
  - refs/mui/packages/mui-material/src/Button/Button.js
  - refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/button.tsx
```

## Quarterly stability review

Operationalized in v4.6. Run quarterly (March / June / September / December — or per-major) to keep knowledge fresh and stability levels honest.

### Step 1 — Generate the report

```bash
python3 tools/audit/stability-review.py --output docs/STABILITY-REVIEW.md
```

This produces a markdown report with sections:
- **Summary table** — counts by stability level, oldest file per level.
- **experimental → stable promotion candidates** — files that held up ≥ 6 months.
- **beta → stable promotion candidates** — files that held up ≥ 3 months.
- **Stable files due for re-review** — `last_updated ≥ 12 months ago`.
- **Deprecated files** — confirm removal plan.
- **Files without `stability`** — add the metadata.

### Step 2 — Walk the report

For each section, decide per file:
- Still accurate? → Bump `last_updated`.
- Needs revision? → Edit + bump.
- Obsolete? → Mark `stability: deprecated` and add a deprecation note.
- Promotion candidate confirmed? → Promote.

### Step 3 — Apply changes via the bulk tools

```bash
# Bulk bump last_updated for files that are still accurate
python3 tools/migrations/bump-last-updated.py knowledge/a11y/contrast.md knowledge/a11y/keyboard-and-focus.md

# Promote experimental → stable (verifies current level matches --from)
python3 tools/migrations/promote-stability.py --from experimental --to stable knowledge/foo.md knowledge/bar.md

# Demote stable → deprecated when superseded (rare)
python3 tools/migrations/promote-stability.py --from stable --to deprecated knowledge/old-pattern.md
```

Both tools support `--dry-run` and write atomically (temp + rename).

### Step 4 — Document outcome

Add a section to the next minor release in `CHANGELOG.md`:

```markdown
### Stability review (Q3 2026)
- Promoted to stable: knowledge/foo.md, knowledge/bar.md
- Demoted to deprecated: knowledge/old-pattern.md
- Reviewed + bumped: 12 files
```

### Step 5 — Commit + close

```bash
git add knowledge/ docs/STABILITY-REVIEW.md CHANGELOG.md
git commit -m "chore: quarterly stability review (Q3 2026)"
```

The `STABILITY-REVIEW.md` file is per-quarter — keep the latest one in `docs/` so contributors can see the most-recent decision history.

### Slash command

In Claude Code:

```
/stability-review
```

Runs the report-generation step + summarizes the candidates inline.

## Cross-source API reconciliation (when adopting upstream changes)

When upstream design systems (Ant / MUI / shadcn) ship new versions, our component specs may drift from the canonical APIs. Two tools surface and resolve the drift.

### 1. Detect drift — `component_spec_conflict_check.py`

```bash
# All multi-source canonicals (33 components currently)
python3 tools/extractors/component_spec_conflict_check.py --multi-source

# Fast quarterly-review summary
python3 tools/extractors/component_spec_conflict_check.py --multi-source --summary-only

# Single component
python3 tools/extractors/component_spec_conflict_check.py --name button

# CI gating: exit 1 on HIGH/CRITICAL
python3 tools/extractors/component_spec_conflict_check.py --multi-source --strict
```

Severity:
- `CRITICAL` — same prop, incompatible types (e.g., `boolean` vs `unknown`)
- `HIGH` — deprecation drift across sources
- `MEDIUM` — type/default refinements
- `LOW` — prop only in one source

### 2. Propose unified API — `component_spec_reconcile.py`

```bash
# Generate reconciliation proposal
python3 tools/extractors/component_spec_reconcile.py --name button

# Bulk review session
python3 tools/extractors/component_spec_reconcile.py --multi-source

# JSON for tooling
python3 tools/extractors/component_spec_reconcile.py --name button --json

# Preview HIGH-confidence row updates without writing
python3 tools/extractors/component_spec_reconcile.py --name button --apply-high --dry-run

# Apply HIGH-confidence row updates for one component
python3 tools/extractors/component_spec_reconcile.py --name button --apply-high

# Bulk preview; add --force only after reviewing the dry-run output
python3 tools/extractors/component_spec_reconcile.py --multi-source --apply-high --dry-run
python3 tools/extractors/component_spec_reconcile.py --multi-source --apply-high --force
```

Output groups proposals by confidence:
- **HIGH** — all sources agree; safe to auto-adopt.
- **MEDIUM** — review before adopt (e.g., library-specific prop, compatible refinement).
- **MANUAL** — incompatible types or no majority on default; human design call required.

`--apply-high` is deliberately narrow: it updates only existing rows in the spec's API table, preserving descriptions and narrative sections. It does not add missing props, does not apply MEDIUM/MANUAL proposals, and requires `--force` for multi-source writes.

For each prop, the proposal includes:
- Recommended type (most-specific compatible across sources).
- Recommended default (majority value).
- Recommended deprecation status (lean toward deprecated if any source deprecates).
- Migration note (when adoption requires care — deprecation timeline, library-specific exceptions).

### Workflow — quarterly upstream review

1. Pull latest `refs/`:
   ```bash
   bash tools/clone-refs.sh
   ```

2. Detect drift:
   ```bash
   python3 tools/extractors/component_spec_conflict_check.py --multi-source --summary-only
   python3 tools/extractors/component_spec_conflict_check.py --multi-source > /tmp/conflicts.md
   ```

3. For each component with HIGH/CRITICAL conflicts, generate proposal:
   ```bash
   python3 tools/extractors/component_spec_reconcile.py --name <component>
   ```

4. Review the MANUAL-confidence items first — they need design calls.

5. Apply safe HIGH-confidence rows with `--apply-high --dry-run`, then `--apply-high` for the reviewed component. Apply MEDIUM/MANUAL rows by hand: update API table, add migration notes, bump `last_updated`.

6. Document the upstream-review pass in CHANGELOG.

## Style

- Markdown over prose.
- Tables for any comparison.
- Code blocks tagged with language (`json`, `tsx`, `css`).
- Links to local files use relative paths.
- Links to upstream use the GitHub canonical URL, not local `refs/` (so docs survive if `refs/` is wiped).

## Generated artifacts and preflight

Do not use a CI check to regenerate tracked files. Generate locally, review the diff,
and let the check command prove that the committed artifact is current.

```bash
# Update the coverage report after changing routes, skills, examples, or knowledge.
npm run coverage:generate

# Verify the committed report without changing it.
npm run coverage:check

# Run every non-publishing release gate except the packed-tarball execution smoke.
npm run release:preflight

# Run the complete local release gate, including one packed-tarball smoke.
npm run release:check
```

Use `release:preflight` inside a workflow that will build and smoke its own final
tarball. Use `release:check` before a release PR or tag when no later step owns that
artifact. Both commands are read-only with respect to tracked source and generated
reports.
