# Dogfood findings — VS Code extension (Phase 40)

Headless validation of the VS Code extension that was scaffolded in v3.8 and extended in v4.3 / v4.6 with new commands.

**Scope of this dogfood**: extension's pure logic (search algorithm, walkthrough pairing, README picking, manifest reading, glob/path utilities), shippability check via `.vsix` packaging, and command-manifest ↔ implementation parity.

**Out of scope**: an actual VS Code instance running the extension. That requires `@vscode/test-electron` (boots a headless VS Code) and was deferred to a future pass — the pure-logic surface tested here exercises the parts that historically had bugs.

## What worked

### 1. Pure logic was 100% extractable

The `vscode` API touches surface (window dialogs, quick-pick UI, document opening) is *small* relative to the work each command does. The work itself — file traversal, search matching, language-pair resolution, glob conversion — is pure Node.js. Extracted to `src/lib.ts`.

After extraction:
- `src/commands.ts` shrank from 423 → 310 lines (27% smaller).
- All non-`vscode` logic is now testable via `node --test`.
- 25 unit tests pass against `out/lib.js` (the *exact JS that ships*, not a transpiled shadow).

### 2. .vsix builds cleanly

After 2 fixes (below), `npx @vscode/vsce package` produces `design-ai-vscode-0.2.0.vsix`:
- 13 files, 19.65 KB packed.
- 5 compiled JS files + 2 icons + LICENSE + CHANGELOG + README + manifest.
- No `src/`, `test/`, `*.map`, `node_modules/`, or `.vsix` regressions.

### 3. Command-manifest ↔ implementation parity verified

10 commands in `package.json` `contributes.commands`, 10 commands registered via `vscode.commands.registerCommand` in source. Zero drift.

### 4. Compile remains clean

`tsc --noEmit` zero errors after the lib extraction. TypeScript types caught two small issues during the refactor (one `null` vs `undefined`, one missing return type) before tests ran.

## Bugs surfaced — and fixed

### 1. Search preview lost the matching keyword

**Found by**: writing `searchCorpus("Pretendard")` test asserting the preview contains "pretendard".

**Symptom**: 6 of ~20 hits had previews that didn't contain the search term. The preview was always `line.trim().slice(0, 120)` from line *start*. If the match appeared past character 120, the user saw context but not the match.

**Example before**:
```
file: docs/QUICKSTART.md:57
preview: /design-from-brief Korean fintech for freelancers — invoice, expense tracking, tax estimation. Trustworthy, calm, mobile
                                                                                                                       ^^^ truncated; actual match "Pretendard" was at column 142 ^^^
```

**Fix**: introduced `buildPreview(line, query)` that centers the preview on the match. ~50 chars before + match + remainder, with `…` markers on either side.

**After**:
```
preview: …calm, mobile-first. **Pretendard** typography. Compliance with…
```

This is a real adopter-facing improvement — search results that don't show the matched term are confusing.

### 2. Missing icon.png

**Found by**: `vsce package` failure with `ERROR The specified icon 'extension/media/icon.png' wasn't found in the extension.`

**Symptom**: `package.json` declared `"icon": "media/icon.png"` but only `media/icon.svg` existed. The extension would have failed to publish to the marketplace.

**Fix**: generated a 128x128 PNG via PIL, matching the SVG's brand-teal gradient + white "D".

This is a **must-fix** before VS Code marketplace publish.

### 3. test/ directory leaked into .vsix

**Found by**: inspecting the `.vsix` content listing — `test/lib.test.mjs` was in the package.

**Symptom**: tests bloat the package by ~2KB and ship test fixtures to adopters.

**Fix**: added `test/**` and `*.vsix` to `.vscodeignore`.

After fix: 14 files → 13 files, 21.96 KB → 19.65 KB.

## Bugs not fixed (deferred)

### 4. No headless VS Code integration test

The pure-logic tests are necessary but not sufficient. The `vscode` API surface (window.showQuickPick, workspace.openTextDocument, configuration.get) isn't covered. A real adopter session could surface bugs in:
- Quick-pick item rendering (long labels truncating).
- Configuration change propagation.
- Tree provider refresh on file changes.

**Action**: add `@vscode/test-electron` in a future phase. ~150 LOC + a CI matrix entry (Linux + macOS).

### 5. No icon at intended quality

The PIL-generated icon is functional but not the polished brand icon a real launch would ship. It looks like a placeholder.

**Action**: replace with a designer-rendered 128x128 PNG before marketplace publish. This is launch-blocker-only.

### 6. Configuration onChange handler edge cases

`vscode.workspace.onDidChangeConfiguration` triggers a full tree refresh when `design-ai.path` changes — but if the new path is invalid, the trees clear without surfacing an error. Adopters might think the extension broke.

**Action**: surface a warning in the new path is invalid (re-run `findDesignAiPath()` and message if it returns undefined).

## What this validates

- Extension code shape is correct — lib/cmds split is testable.
- Manifest is internally consistent.
- `.vsix` ships clean (after gitignore fix).
- All 10 commands route to actual handlers.
- Search algorithm now correct.

## What this does NOT validate

- Actual UI rendering inside VS Code.
- Configuration change handling under real VS Code load.
- Tree providers' performance on large knowledge corpora.
- Marketplace publish flow (needs Azure DevOps PAT setup).

These are real-VS-Code-instance concerns — Phase 40 stops at the boundary.

## File-level summary

| File | Status |
| --- | --- |
| `vscode-extension/src/extension.ts` | Unchanged |
| `vscode-extension/src/commands.ts` | Refactored to import from lib.ts (310 lines, was 423) |
| `vscode-extension/src/lib.ts` | **New** — 8 pure helpers (searchCorpus / pairWalkthroughs / chooseWalkthrough / readManifest / pickReadme / walkMd / globToRegex / splitGlob) |
| `vscode-extension/src/paths.ts` | Unchanged |
| `vscode-extension/test/lib.test.mjs` | **New** — 25 unit tests |
| `vscode-extension/.vscodeignore` | Updated — exclude `test/`, `*.vsix` |
| `vscode-extension/media/icon.png` | **New** — 128x128 placeholder (designer should replace) |

## Cross-reference

- [`docs/DOGFOOD-V4-FINDINGS.md`](DOGFOOD-V4-FINDINGS.md) — Phase 39 dogfood (corpus content)
- Phase 41 — npm fresh-install test (next)
- Phase 42 — mkdocs site build verification (after npm)
