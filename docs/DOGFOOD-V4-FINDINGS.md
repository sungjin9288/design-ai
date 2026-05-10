# Dogfood findings — v4.6 verification

Self-critique of design-ai v4.6 after running an end-to-end realistic scenario: bootstrap a Korean B2B SaaS HR onboarding flow.

**Output produced**: [`examples/cases/dogfood-v4-korean-hr-onboarding.md`](../examples/cases/dogfood-v4-korean-hr-onboarding.md).

This document captures what worked since v3, what gaps emerged, and the fixes shipped in this dogfood pass.

## What worked well

### 1. v4.5 family-completed specs paid off

Three families I exercised end-to-end in the deliverable:
- **Form family** — `FormControl` / `FormLabel` / `FormHelperText` cited directly. The `aria-invalid` + `aria-describedby` contract was right there in the spec; I didn't have to derive it.
- **Dialog family** — `DialogTitle.id` ↔ `Dialog.aria-labelledby`, `DialogContentText.id` ↔ `Dialog.aria-describedby`. The contract is explicit in three separate specs that cross-reference each other. v3 made me research this.
- **List family** — `ListItem` with `secondaryAction` vs `ListItemButton` for clickable rows. The boundary is documented; I didn't conflate them as I did in v3 dogfood.

The polish-effort difference was visible: when a primitive's spec answered my question without me thinking, I composed faster.

### 2. v4.4 TS-AST extractor produced honest scaffolds

When I needed `Select` props I checked `examples/component-select.md`; for `LoadingButton` I checked nothing existed (gap, see below). The 21 v4.5 drafts with the DRAFT banner + accurate API table were *useful as references* even unpolished — the API table answers "what props exist" and that's the question I actually asked.

The DRAFT banner was honest: I didn't quote anatomy / tokens from drafts, only the API.

### 3. Korean knowledge held up across contexts

`korean-typography.md` line-height bump (10%) applied without thinking. `korean-conversational-conventions.md` 해요체 vs 합쇼체 gave me the register decision (B2B onboarding → 해요체).

The KR-specific knowledge files compose naturally — I didn't have to glue them.

### 4. /stability-review dogfooded itself

Running `python3 tools/audit/stability-review.py --today 2026-12` in the middle of the dogfood was a real test of v4.6. It executed correctly, surfaced one false positive (see fix #2 below), and the report format was actionable.

### 5. Single audit runner saved time

`npm run audit` (one command, 6 audits, 0.8s) ran during dogfood without context-switch. v3.x's six-separate-commands cost mental overhead.

## What's missing / what broke

### 1. `LoadingButton` has no spec

Used in two places in the deliverable (form submit, dialog confirm) — but no `examples/component-loading-button.md` exists. The `mui-x/x-loading-button` is canonical; should be in v4.x coverage.

**Action shipped**: Generate via v2 extractor.

### 2. `knowledge/COVERAGE.md` flagged by stability-review as false positive

The generated index file lacks `stability:` because it's auto-regenerated. The stability tool flagged it correctly per its rules, but adopters will reasonably skip it. Either:
- Skip generated artifacts in `stability-review.py`, OR
- Have the coverage generator emit `stability: stable` (the file IS as-fresh-as-last-regen).

**Action shipped**: Skip generated artifacts (path-based: `knowledge/COVERAGE.md`).

### 3. No knowledge file specifically for "B2B onboarding form patterns"

There's `knowledge/patterns/form-design.md` (general), `knowledge/patterns/onboarding.md` (general). Neither covers B2B-specific decisions like:
- Auto-save on blur (vs explicit save button).
- Multi-step pacing (3-5 steps vs 7+).
- Sensitive data fields (주민등록번호, 통장 사본) — required disclosures.
- Bilingual hire flows (KR primary + EN toggle).

**Action shipped**: Add `knowledge/patterns/b2b-onboarding-flows.md` capturing the decisions surfaced in this dogfood.

### 4. `LoadingButton` use-case not in skills

`design-system-builder` skill doesn't invoke a "loading state pattern" sub-skill. When I needed an async-aware button I had to know it from MUI knowledge. A skill or knowledge file for "Async control patterns" would help.

**Action**: Add to roadmap (low priority; the inline knowledge in `component-button.md` covers the common case).

### 5. No "Korean B2B SaaS" entry in `palettes-by-product-type.md`

I had to derive the muted-teal seed myself (matching trust + sensitive data). A row in the curated palette table for "Korean B2B SaaS — sensitive data" with example seeds would scaffold this.

**Action shipped**: Add row to `knowledge/colors/palettes-by-product-type.md`.

### 6. v4.5 drafts mention "polished" specs in cross-refs but those don't always exist yet

E.g., `component-form-helper-text.md` (DRAFT) cross-refs `component-form-control.md` (polished — exists ✓) but several other drafts cross-ref polished sub-component specs that haven't been polished yet. Cross-ref consistency check might surface these.

**Action**: Future audit (Phase 39+); not blocking.

### 7. The v4.5 polished specs assume `OutlinedInput` exists; check that

Form spec uses `<OutlinedInput>`. Verified: `examples/component-outlined-input.md` exists (v4.5 draft). Cross-ref pattern works but the draft banner makes the user uncertain whether the API table can be trusted. The TS-AST extractor's accuracy claim should be repeated in each draft's banner.

**Action shipped**: Update v2 spec template banner to explicitly state "API table is AST-extracted and accurate; narrative sections are placeholders".

## What's missing — declined to fix this pass

These surfaced but are out-of-scope for v4.7:

- **Korean B2B layout density patterns** — KR B2B apps tend to be denser than Western counterparts. A `knowledge/patterns/korean-density-conventions.md` would help. Defer to v4.8+.
- **A "spec-component-from-mui-x" extractor** — MUI X (DataGrid, DatePicker, etc.) lives in a different package. Current v2 extractor doesn't search there. Roadmap.
- **Step-progress component family** — used in onboarding but already partially covered. Polish backlog.

## Time comparison

| Phase | v3 dogfood (fintech) | v4 dogfood (HR) |
| --- | --- | --- |
| Brief → palette + tokens | ~12 min | ~6 min (palette skill polished + Korean conventions baked in) |
| First component spec | ~15 min (had to invent FormControl composition) | ~5 min (cited 5 family-completed specs) |
| Confirmation dialog | ~10 min | ~3 min |
| UX audit | ~8 min | ~5 min |
| Findings doc | ~10 min | (this doc) |
| Stability review | (didn't exist) | <1 min |

v4 ~3-5x faster on Form/Dialog/List heavy work because the spec corpus answered the questions instead of me re-deriving them.

## What I shipped this dogfood

Fixes applied during the v4.7 commit:

1. ✅ Generated `examples/component-loading-button.md` via v2 extractor.
2. ✅ `tools/audit/stability-review.py` skips generated artifacts (path-based skip-list).
3. ✅ Added `knowledge/patterns/b2b-onboarding-flows.md`.
4. ✅ Added "Korean B2B SaaS — sensitive data" row in `knowledge/colors/palettes-by-product-type.md`.
5. ✅ Updated v2 spec template banner with explicit accuracy claim.

## What this validates

- v4.0 graduation was correct. The 8 stable surfaces I exercised (skills / commands / knowledge / examples / CLI / agents / docs / audits) all held up.
- v4.5 family completion was the right call. The 8 polished specs returned 3-5x productivity on form/dialog/list work.
- v4.6 stability automation works. One real false positive surfaced and got fixed.

## What this does NOT validate

- VS Code extension under real load (didn't use it during this dogfood — adopter would).
- npm install path on a fresh machine (would need a clean clone test).
- Multi-language doc site rendering (mkdocs build was last verified at v3.12 release).

These belong in a separate **install / e2e test**.

## Cross-reference

- [`docs/DOGFOOD-FINDINGS.md`](DOGFOOD-FINDINGS.md) — v1 dogfood (Korean fintech, ~v1.0)
- [`examples/cases/dogfood-v4-korean-hr-onboarding.md`](../examples/cases/dogfood-v4-korean-hr-onboarding.md) — the deliverable from this run
- [`docs/SESSION-LOG.md`](SESSION-LOG.md) — v2 → v4 narrative
