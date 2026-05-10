# Dogfood findings — mkdocs site build (Phase 42)

End-to-end verification of the doc site build. Last verified at v3.12 release. Re-verified at v4.7 with significant content additions (Korean docs, MIGRATION-v4, dogfood findings).

**Scope**: install mkdocs deps → run `tools/build-docs.sh` to populate `site-src/` → run `mkdocs build --clean` → verify HTML output → check Korean pages.

## What worked

### 1. Build succeeds end-to-end

```
INFO -  Documentation built in 15.84 seconds
```

Zero errors. 782 HTML files generated. Both English and Korean trees built.

### 2. Korean i18n routing works

`docs_structure: suffix` correctly maps `*.ko.md` files to `/ko/...` paths:

```
site/ko/docs/USING/index.html         ← from docs/USING.ko.md
site/ko/docs/CONTRIBUTING/index.html  ← from docs/CONTRIBUTING.ko.md
site/ko/docs/ARCHITECTURE/index.html  ← from docs/ARCHITECTURE.ko.md
site/ko/docs/QUICKSTART/index.html
site/ko/docs/DISTRIBUTION/index.html
site/ko/AGENTS/index.html
site/ko/CHANGELOG/index.html
... + 5 integration walkthroughs (codex/cursor/aider/sdk/vscode).ko.md
```

The v4.1 Korean adopter docs all rendered. The v4.7 dogfood findings docs (this one + Phase 39/40/41) also rendered to both languages.

### 3. Symlink-farm pattern still works

`tools/build-docs.sh` populates `site-src/` with symlinks to `knowledge/`, `examples/`, `skills/`, `commands/`, `agents/`, `docs/`, `index.md`, `CHANGELOG.md`, `AGENTS.md`, `CLAUDE.md`. mkdocs reads from `site-src/`. Build is idempotent — re-running is safe.

### 4. mkdocs-material 9.7+ + pymdown-extensions 10.21+ resolve cleanly

The version pins from `docs/requirements.txt` worked end-to-end. The pygments/pymdown interaction bug noted in v3.x is gone.

### 5. Build time acceptable

15.84 seconds for 782 pages including syntax-highlighted code blocks across 90 knowledge files + 190 examples + integration walkthroughs (EN+KO). Within the < 20s target documented in `docs/RELEASE-CHECKLIST.md`.

## Bugs surfaced — and fixed

### 1. `link-check.py` had a false-negative regex bug

**Found by**: mkdocs build emitted 10 warnings about broken paths in `examples/cases/dogfood-v4-korean-hr-onboarding.md`. The link-check audit had passed all of these.

**Root cause**: `link-check.py` strips inline backtick code spans from each line *before* matching link patterns. The regex required ≥ 1 char of link text. When a markdown link with backtick-wrapped text had its backtick contents stripped, it became an empty-text link, and the `+` quantifier failed to match. So *every link with backtick-wrapped text was silently skipped*.

```text
Before strip:  [`knowledge/typography/foo.md`](knowledge/typography/foo.md)
After strip:   [](knowledge/typography/foo.md)
Old regex:     \[([^\]]+)\]\(...\)   ← empty text → no match → unchecked
New regex:     \[([^\]]*)\]\(...\)   ← matches empty text → validates target
```

**Impact**: an entire class of broken links (the most common style in this corpus — citing files via backtick-wrapped paths) was never validated.

**Fix**: changed the regex from `+` to `*`. Now empty-text links match and validate.

**After fix**: 11 real broken links surfaced and got fixed:
- `docs/USING.ko.md`: 2 wrong relative paths (`../QUICKSTART.ko.md` should have been `QUICKSTART.ko.md` — both files are in `docs/`).
- `examples/cases/dogfood-v4-korean-hr-onboarding.md`: 5 paths to non-existent knowledge files (cited `knowledge/typography/korean-typography.md`, but the actual file is at `knowledge/i18n/korean-typography.md`).
- 4 dialog/flex specs referenced `component-dialog.md` and `component-stack.md` which didn't exist.

### 2. Missing primitive component specs

**Found by**: link-check (after fix) flagging `component-dialog.md` and `component-stack.md` as targets of multiple references.

**Symptom**: 4 v4.5 dialog sub-component specs cross-referenced the parent `component-dialog.md`, but it had never been written. Same for `component-flex.md` → `component-stack.md`.

**Severity**: HIGH — these are flagship MUI primitives. v4.5 family completion claimed Dialog was "complete" but the parent spec was missing.

**Fix**: generated both via v2 extractor.
- `examples/component-dialog.md` (2 sources, 15 props — Ant + MUI)
- `examples/component-stack.md` (1 source, 1 prop — MUI)

These are DRAFT-banner specs but the API tables are accurate and the cross-references resolve.

### 3. `navigation.instant` incompatible with mkdocs-static-i18n

**Found by**: mkdocs build emitted `WARNING - mkdocs_static_i18n: mkdocs-material language switcher contextual link is not compatible with theme.features = navigation.instant`.

**Symptom**: with `navigation.instant` enabled, clicking the EN ↔ KO language switcher would fail to navigate to the contextual mirror page (e.g., from `/docs/USING/` the KO toggle should go to `/ko/docs/USING/` — but instant-loading bypassed this).

**Fix**: commented out `- navigation.instant` in `mkdocs.yml` `theme.features` with an inline note. SPA-style instant navigation traded for working language switcher — right call for a bilingual site.

### 4. Wrong knowledge file paths in dogfood deliverable

**Found by**: link-check (after fix).

**Symptom**: my v4.7 dogfood deliverable cited fictional knowledge file paths (`knowledge/typography/korean-typography.md`, `knowledge/typography/pretendard-and-fallbacks.md`, `knowledge/conversational/korean-conversational-conventions.md`, `knowledge/colors/semantic-aliases.md`). The corpus actually has those concepts but at different paths.

**Fix**: corrected each to actual paths:
- `knowledge/typography/korean-typography.md` → `knowledge/i18n/korean-typography.md`
- `knowledge/typography/pretendard-and-fallbacks.md` → removed (Pretendard info lives in i18n/korean-typography.md)
- `knowledge/conversational/korean-conversational-conventions.md` → `knowledge/conversational/korean-voice-conventions.md`
- `knowledge/colors/semantic-aliases.md` → `knowledge/colors/color-theory.md`

This matters because the dogfood deliverable is itself an example for adopters — citing fake paths would mislead them.

## Known acceptable warnings (not fixed)

- **280 warnings: `brand-references.md` → `refs/`** — `refs/` is gitignored upstream sources. The links are intentional (point to upstream brand examples for context). Acceptable.
- **112 warnings: `components/INDEX.md` → various** — index file references files outside site scope; acceptable.
- **~150 warnings: `#1677FF`, `#722ED1` etc. anchor links** — Ant Design tokens spec uses hex codes inline; mkdocs misreads as anchor links. Cosmetic only; doesn't break the site. Could be fixed with `attr_list` extension or by escaping the `#` differently.
- **~70 warnings: `.py`, `.yml`, `.ko.md` files referenced from doc but not in nav** — files exist in repo, just not promoted to mkdocs-tracked content. Acceptable for repo-local utility links.

Total remaining warnings: 631. All surveyed; none blocking.

## Performance

| Step | Time |
| --- | --- |
| `pip install -r docs/requirements.txt` (cold) | ~30 s |
| `./tools/build-docs.sh` (symlink farm) | <1 s |
| `mkdocs build --clean` | 15.84 s |
| Output: 782 HTML pages, 2 languages, full nav | |

## What this validates

- mkdocs build pipeline works end-to-end at v4.7.
- All v4.x docs (MIGRATION-v4, USING.ko, CONTRIBUTING.ko, ARCHITECTURE.ko, dogfood findings, announcements) render.
- Korean i18n routing produces `/ko/...` paths correctly.
- Build time within RELEASE-CHECKLIST budget (< 20s).
- mkdocs-material 9.7+ + pymdown 10.21+ stable.

## What this does NOT validate

- GitHub Pages deployment (would need actual push to gh-pages branch).
- Custom domain DNS + HTTPS.
- Search index population (mkdocs-material's built-in search; tested locally but not at scale).
- Mobile rendering of Korean Hangul typography.
- Cross-link rendering (anchor jumps work in built HTML, not just resolved at build).

These belong in a deployment-time test (Phase 43+ if launch becomes imminent).

## Cross-reference

- [`docs/DOGFOOD-V4-FINDINGS.md`](DOGFOOD-V4-FINDINGS.md) — Phase 39 (corpus content)
- [`docs/DOGFOOD-V4-VSCODE-FINDINGS.md`](DOGFOOD-V4-VSCODE-FINDINGS.md) — Phase 40 (VS Code extension)
- [`docs/DOGFOOD-V4-NPM-FINDINGS.md`](DOGFOOD-V4-NPM-FINDINGS.md) — Phase 41 (npm distribution)
- [`docs/RELEASE-CHECKLIST.md`](RELEASE-CHECKLIST.md) — "Doc site build" step 7 of pre-release ritual
