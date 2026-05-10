# Changelog

User-facing release notes for design-ai. Versions follow semver.

## v4.7.0 — Dogfood v4 + 5 fixes (2026-05)

End-to-end practical test of the v4.6 corpus on a real Korean B2B HR onboarding scenario. Surfaced 5 actionable gaps; all 5 fixed in this commit.

### Added
- **`examples/cases/dogfood-v4-korean-hr-onboarding.md`** — real deliverable: tokens (palette + typography + spacing) → EmployeeInfoForm composition → document upload Card + confirmation Dialog → UX audit → stability review run. Cites every knowledge file + spec used.
- **`docs/DOGFOOD-V4-FINDINGS.md`** — self-critique. What worked since v3 (family-completed specs paid off; KR knowledge composes naturally; /stability-review dogfooded itself; single audit runner saved time). What broke (5 gaps surfaced + fixed). Time comparison v3 vs v4 (~3-5x faster on form/dialog/list-heavy work).
- **`examples/component-loading-button.md`** (Fix 1) — polished pattern spec for the loading-button pattern. MUI v6+ merged it into Button (`<Button loading>`); shadcn / Ant don't ship a separate one. Spec documents the **pattern** to apply to any Button.
- **`knowledge/patterns/b2b-onboarding-flows.md`** (Fix 3) — new knowledge file. B2B vs B2C differences, 5-9 step pacing, auto-save strategy, sensitive-data handling (주민등록번호, 통장 사본, 주소), bilingual KR+EN flows, state recovery, HR-vs-hire dual views.
- **Korean B2B SaaS palette row** (Fix 4) — added row 162 to `knowledge/colors/palettes-by-product-type.md`. Muted teal (`#0D9488`) + professional blue accent for HR / Payroll / Legal sensitive-data products.

### Changed
- **`tools/audit/stability-review.py`** (Fix 2) — added `GENERATED_ARTIFACTS` skip-list. `knowledge/COVERAGE.md` no longer reported as "missing stability metadata" (false positive — generated artifact, by design).
- **`tools/extractors/component_spec_scaffold_v2.py`** (Fix 5) — DRAFT banner now explicitly states "API table below is parsed directly from typed declarations — accurate and trustworthy". Distinguishes the trustworthy AST-extracted parts from the placeholder narrative parts. Reduces adopter ambiguity.
- **`package.json` + `.claude-plugin/plugin.json`** versions: 4.6.0 → 4.7.0.

### Verified
- All 6 audits pass.
- Dogfood findings doc cites real knowledge files and specs throughout.
- Loading-button pattern spec follows established polished-spec style (when-to-use / anatomy / API / states / tokens / a11y / edge cases / code example / don't).
- B2B onboarding knowledge file: 9-step flow documented, sensitive-data rules explicit, KR-specific (주민번호 masking / 도로명 주소 API / 4대보험).

### What this validates
- **v4.0 graduation was correct** — the 8 stable surfaces all held up under real use.
- **v4.5 family completion was the right call** — Form / Dialog / List polished specs returned 3-5x productivity vs deriving from primitives.
- **v4.6 stability automation works** — one false positive surfaced and got fixed.

### What this does NOT validate
- VS Code extension under real adopter load (didn't exercise during this dogfood).
- npm install path on a fresh machine (would need clean-clone test).
- Multi-language doc site rendering (last verified at v3.12 release).

These belong in a separate **install / e2e test** — future work.

### v3 vs v4 dogfood time comparison
| Phase | v3 dogfood | v4 dogfood |
| --- | --- | --- |
| Brief → palette + tokens | ~12 min | ~6 min |
| First component spec | ~15 min (had to invent FormControl composition) | ~5 min (cited 5 family-completed specs) |
| Confirmation dialog | ~10 min | ~3 min |
| UX audit | ~8 min | ~5 min |
| Stability review | (didn't exist) | <1 min |

## v4.6.0 — Stability re-review automation (2026-05)

Operationalizes the quarterly stability review ritual described in `RELEASE-CHECKLIST.md` and `ARCHITECTURE.ko.md`. Until v4.6 this was a manual step; now it's a script + two bulk-mutation tools + a slash command.

### Added
- **`tools/audit/stability-review.py`** — generates a quarterly review markdown report. Sections:
  - Summary table (counts by stability level + oldest file per level).
  - Promotion candidates: experimental → stable (≥ 6 months held).
  - Promotion candidates: beta → stable (≥ 3 months held).
  - Stable files due for re-review (≥ 12 months old).
  - Deprecated files (review for next major).
  - Files missing `stability` metadata.
  - Ritual checklist at the bottom.
  - Configurable thresholds via `--warn-months` / `--promote-after` / `--stale-months`.
  - `--today YYYY-MM-DD` for testing future scenarios.
  - `--output <path>` writes report; default stdout.
- **`tools/migrations/promote-stability.py`** — bulk promote / demote `stability:` field:
  - Enforces `--from <level>` (verifies current state before mutating).
  - `--force` to override the check (rare).
  - `--dry-run` previews.
  - Atomic per-file (temp + rename).
  - Bumps `last_updated` to current month on promotion.
- **`tools/migrations/bump-last-updated.py`** — bulk-bump `last_updated` to current month:
  - Use after a quarterly review when files are still accurate.
  - `--dry-run`, `--today YYYY-MM` for testing.
  - Idempotent (no-op if already at target date).
- **`commands/stability-review.md`** — slash command `/stability-review` runs the report + summarizes inline + suggests next bulk operations (with confirmation gate before mutation). Verification phase included.
- **`docs/CONTRIBUTING.md`** "Quarterly stability review" — full 5-step ritual: generate report → walk it → apply via bulk tools → document outcome → commit. Examples included.

### Changed
- **`.claude-plugin/plugin.json`** — registered `/stability-review` as the 16th slash command.
- **`package.json` + `.claude-plugin/plugin.json` + `vscode-extension/package.json`** description strings updated: 15 commands → 16 commands.
- **`package.json` + `.claude-plugin/plugin.json`** versions: 4.5.0 → 4.6.0.

### Verified
- All 6 audits pass.
- Stability review runs correctly: surfaces files without `stability` (1 found: `knowledge/COVERAGE.md` — generated artifact, intentional).
- Promote tool dry-run correctly verifies `--from` level before allowing transition.
- Bump tool dry-run correctly identifies which files would change vs are already at target.
- Slash command file passes frontmatter + verification-phase checks.

### Workflow

```bash
# Quarter-start (once per Q):
python3 tools/audit/stability-review.py --output docs/STABILITY-REVIEW.md

# Read the report. For each candidate, decide.

# Apply decisions:
python3 tools/migrations/promote-stability.py --from experimental --to stable knowledge/foo.md
python3 tools/migrations/bump-last-updated.py knowledge/bar.md knowledge/baz.md

# Document outcome in CHANGELOG, commit.
```

Or in Claude Code: `/stability-review` — runs the report + walks you through.

### What this enables
- **Knowledge stays fresh.** No more "we should review old files sometime" — the script tells you exactly which.
- **Stability promotions become routine.** beta / experimental files don't accumulate; they're promoted when they hold up.
- **Deprecation hygiene.** Deprecated files are flagged at every review until removed; CHANGELOG captures removal plan.
- **Discoverable in Claude Code.** `/stability-review` surfaces the ritual as a one-command operation.

## v4.5.0 — Coverage push 55% → 68.8% (2026-05)

First coverage push using v2 extractor. Crosses 2/3 canonical coverage. Family-completion focus: List / Card / Dialog / Form-Control / Menu sub-components — the primitives most-used in real Korean B2B / fintech UIs.

### Added — 27 new component specs (110 → 137 of 199)
- **Family-complete (full real specs, polished narrative + tokens + a11y + Korean considerations)** — 6:
  - `list-item` (foundational MUI primitive)
  - `menu-item` (Select / Menu / context menu)
  - `dialog-title`, `dialog-content`, `dialog-actions` (Dialog triplet)
  - `card-content`, `card-actions` (Card triplet)
  - `form-control` (form-input wrapper)
- **v2-extracted drafts (DRAFT banner; accurate API table; narrative placeholders)** — 21:
  - List family: `list-item-button`, `list-item-icon`, `list-item-text`, `list-item-avatar`, `list-subheader`
  - Form family: `form-control-label`, `form-group`, `form-helper-text`, `form-label`
  - Card family: `card-header`, `card-media`
  - Dialog family: `dialog-content-text`
  - Accordion family: `accordion-actions`, `accordion-details`, `accordion-summary`
  - Menu family: `menu-list`
  - Standalone: `toggle-button`, `mobile-stepper`
  - Earlier in v4.4: `input-number`

### Changed
- **`tools/extractors/component_spec_scaffold_v2.py`** — `find_mui_source` now falls back to `.d.ts` (MUI ships compiled JS + types per component). This unlocks AST extraction for all MUI sub-components, not just the few with checked-in `.tsx`.
- **`package.json` + `.claude-plugin/plugin.json`** versions: 4.4.0 → 4.5.0.

### Verified
- All 6 audits pass.
- Coverage: 110 → 137 (55.3% → 68.8%).
- 6 polished specs follow established sub-component spec style (concise: when-to-use / anatomy / API table / states / tokens / a11y / edge cases / code example / don't).
- 21 v2 drafts retain "DRAFT — scaffolded via TS-AST" banner; honest signal to readers that narrative sections are placeholders.

### Coverage breakdown
| Category | v4.4.0 | v4.5.0 |
| --- | --- | --- |
| Foundational primitives (Button, Input, Card, Dialog, etc.) | ~95% | 100% (with sub-components) |
| Form family (FormControl + variants) | partial | complete |
| List family (ListItem + sub-roles) | partial | complete |
| Dialog family (Title / Content / Actions) | partial | complete |
| Card family (Content / Actions / Header / Media) | partial | complete |
| Transitions (Fade / Grow / Zoom / Slide) | partial | partial |
| Sub-components / utility types | thin | thin (intentional — most don't warrant specs) |

### Why drafts (and not polished for all 27)
v2-extracted drafts have:
- ✓ Accurate API table (props / types / defaults / deprecated / event handlers / source provenance)
- ✓ Standard structure (every spec has the same sections)
- ✗ Placeholder narrative (when-to-use / anatomy / Korean considerations / edge cases)

Honest banner > false completeness. The 6 polished specs prove the patterns apply; remaining 21 will land full content as user-feedback informs which need it.

### What this enables
- **Family completion** — designers searching for "ListItem variants" find them all together.
- **Real-world fintech UIs covered** — most Korean B2C app patterns lean on List + Form + Dialog + Card primitives. v4.5 fills gaps that previously forced ad-hoc references.
- **v2 extractor validated end-to-end** — 27 components extracted in one pass, no parser bugs surfaced.

## v4.4.0 — Component spec extractor v2 (2026-05)

Replaces regex-based component scaffolding with TypeScript AST parsing. Drafts are now produced from the same Compiler API that VS Code uses — no more missed generics, intersection types, or destructured defaults.

### Added
- **`tools/extractors/ts-ast/parse-component.mjs`** — Node.js parser using TypeScript Compiler API. Walks the AST to extract:
  - Interface declarations + extends chains.
  - Type aliases (object literals + intersections).
  - Property signatures with `?:` optional flag.
  - JSDoc tags: `@deprecated`, `@default` / `@defaultValue`, `@since`, prose comment.
  - Component declarations (`function`, arrow, `forwardRef`, `memo`).
  - Destructured defaults from function parameters.
  - Event handler detection (`on*` props).
- **`tools/extractors/ts-ast/package.json`** — local-only package with `typescript` dep. Not shipped via npm (`tools/extractors/` not in package allowlist).
- **`tools/extractors/component_spec_scaffold_v2.py`** — Python wrapper:
  - Invokes parser via subprocess; loads JSON.
  - Picks primary `Props` interface using heuristics (`<Name>Props` → `Base<Name>Props` → largest `*Props`).
  - **Merges props across Ant + MUI + shadcn** with provenance per prop.
  - Surfaces deprecated props in dedicated section.
  - Splits event handlers into separate "Events" table.
  - Falls back cleanly when refs/ or node_modules/ missing.

### Changed
- **`package.json` + `.claude-plugin/plugin.json`** versions: 4.3.0 → 4.4.0.

### Verified
- Parser round-trips real Ant Button (29+ props, multiple interfaces, deprecated `iconPosition` correctly flagged).
- Parser round-trips shadcn Button (intersection type `React.ComponentProps<"button"> & VariantProps<...> & {...}` + 3 destructured defaults).
- Parser round-trips MUI components.
- v2 wrapper produces clean spec for missing canonical: `examples/component-input-number.md` (14 props, 3 auto-flagged deprecated, default `variant="outlined"` from destructured).
- All 6 audits pass.
- 16 CLI unit tests pass.

### v1 vs v2 sample diff
Same component, two extractors:

| Capability | v1 (regex) | v2 (AST) |
| --- | --- | --- |
| Generic types `Props<T>` | ✗ misses | ✓ captured |
| `extends` chains | ✗ misses | ✓ captured |
| Intersection types | ✗ partial | ✓ full |
| Destructured defaults | ✗ misses | ✓ captured |
| `@deprecated` JSDoc | ✗ misses | ✓ flagged |
| `@default` JSDoc | ✗ misses | ✓ used |
| Event handler grouping | ✗ mixed in | ✓ separate section |
| Source provenance per prop | ✗ first-source-wins | ✓ all sources |

### What this enables
- **Faster coverage push** — drafts now require less manual cleanup. 14 props extracted with correct types where v1 needed regex tuning per source.
- **Safer multi-source merging** — provenance per prop means the human reviewer can see "this prop exists in Ant + MUI but not shadcn" at a glance.
- **Deprecation visibility** — surfaces deprecated props upfront so reviewers don't accidentally promote them.

### Setup (one-time)

```bash
cd tools/extractors/ts-ast
npm install
```

After setup, use v2 like v1:

```bash
python3 tools/extractors/component_spec_scaffold_v2.py --name <component>
python3 tools/extractors/component_spec_scaffold_v2.py --all-missing --limit 20
```

v1 (`component_spec_scaffold.py`) remains for backward compatibility but v2 is now preferred.

## v4.3.0 — Internal completeness (2026-05)

Tightens internal quality. Standardizes skill verification headings, strengthens the audit that enforces them, adds 3 VS Code commands (language-aware walkthroughs / README opener / corpus search), introduces a unified audit runner, and adds the first CLI unit tests.

### Added
- **`tools/audit/run-all.py`** — unified runner for all 6 audits. Single command instead of six. `--strict` flag fails CI on any audit failure. `--quiet` suppresses pass-output. ~0.8s end-to-end.
- **CLI tests** (`cli/lib/paths.test.mjs`, `cli/lib/log.test.mjs`) — 16 unit tests covering pure-logic helpers (path resolution, file/dir checks, color helpers in NO_COLOR mode). Uses Node 18+ built-in `node --test`. No new deps.
- **VS Code extension — `design-ai.openReadme`** — opens `README.ko.md` if `design-ai.language` is `ko`, else `README.md`.
- **VS Code extension — `design-ai.search`** — searches across `knowledge/`, `examples/`, `skills/`, `docs/`, `agents/`, `commands/`. Surfaces first match per file. Jumps to the matching line on selection. Korean / English UI strings via `getLanguagePreference()`.

### Changed
- **`tools/audit/check-coverage.py`** — strengthened skill verification check:
  - Strict: requires canonical `## Verification phase` level-2 heading.
  - Loose-only files (e.g., `### 7. Verification`) surfaced separately as a soft signal — encourages standardization.
- **`skills/figma-token-sync/PLAYBOOK.md`** — verification phase promoted from `### 7. Verification phase` to standalone `## Verification phase (run before declaring done)`.
- **`skills/slide-deck-author/PLAYBOOK.md`** — same standardization (`### 7. Verification` → `## Verification phase ...`).
- **VS Code extension — `design-ai.openWalkthrough`** — now language-aware. Prefers `.ko.md` when `design-ai.language` is `ko`; falls back to `.md`. Quick-pick labels show `[KO]` / `[EN]` tags.
- **VS Code extension — `design-ai.status`** — labels in Korean when `design-ai.language` is `ko` (소스 / 스킬 / 커맨드 / 에이전트).
- **VS Code extension — `commands.ts`** — extracted `readManifest()` helper with explicit `PluginManifest` interface. Removed unused `child_process` import.
- **`vscode-extension/package.json`** — extension version 0.1.0 → 0.2.0. Two new commands registered.
- **`package.json` scripts** — `npm test` now runs CLI tests. `npm run audit` uses unified runner. New `npm run audit:strict` for CI.
- **`package.json` + `.claude-plugin/plugin.json`** versions: 4.2.0 → 4.3.0.

### Verified
- All 6 audits pass (via unified runner, 0.81s).
- 16 CLI unit tests pass.
- VS Code extension compiles cleanly (`tsc --noEmit` zero errors).
- All 19 skills now have canonical `## Verification phase` heading.

### What this enables
- **One-command quality gate.** `npm run audit` runs all 6 in 0.8s with a unified summary. `npm run audit:strict` for CI.
- **Test-backed CLI.** First unit tests for the CLI surface — paths resolution and color helpers covered. Foundation for more tests.
- **Language-aware VS Code.** Korean adopters get Korean READMEs / walkthroughs / status labels by setting `design-ai.language: ko` once.
- **Searchable corpus.** No more "where was that knowledge file?" — VS Code search across the full corpus, jumps to the line.
- **Skill verification consistency.** All 19 skills use the same canonical heading. Future audit can fail (not just warn) on non-canonical formats.

## v4.2.0 — Launch kit (2026-05)

Ready-to-post announcement materials for the v4.0 launch. Drafts only — posting is owner action.

### Added
- **`docs/announcements/`** directory — 7 launch-channel drafts:
  - `README.md` — index, posting order (HN → dev.to → r/programming → KR channels), tracking template, channel tone matrix.
  - `press-kit.md` — reusable assets: one-liner / two-liner / three-bullet (EN + KO), stats card, origin narrative, FAQ, links.
  - `show-hn.md` — Show HN submission (title alts, body, comment-prep replies for likely questions).
  - `okky-post.ko.md` — OKKY long-form Korean post (해요체 voice, KR adoption focus, prepared 답글).
  - `hashnode-post.ko.md` — hashnode KR-tagged blog post (~800 words, technical retrospective tone).
  - `dev-to-korea.md` — dev.to post (English with Korean code/example fragments).
  - `twitter-thread.md` — parallel EN + KO threads (8 tweets each), hook → architecture → journey → CTA.
  - `reddit-r-korea.md` — r/programming + r/korea + r/ClaudeAI drafts with sub-specific rule notes.

### Changed
- `package.json` + `.claude-plugin/plugin.json`: 4.1.0 → 4.2.0.

### Verified
- All 6 audits pass.
- Drafts written in target voice per channel — no auto-translation; KR drafts in natural Korean (해요체).

### Posting strategy
- Stagger over 7 days, not same-day burst.
- Day 1: HN + dev.to (US/EU primary).
- Day 2: r/programming.
- Day 3: r/korea + r/ClaudeAI.
- Day 4-7: KR community (OKKY, hashnode), Twitter EN + KO threads.
- Track in `docs/announcements/posted.md` (created at first post).

### What this enables
- **Owner-ready launch.** Push the v4.0 tag, verify CI publish, then post in any order — no last-minute writing under pressure.
- **Channel-tailored tone.** Each draft uses the voice that channel rewards (HN: low-key engineer-to-engineer; OKKY: 해요체 KR community; dev.to: technical blog; Twitter: scannable hooks).
- **Reusable on future releases.** Press kit, FAQ, and stats card carry forward; just refresh numbers per release.

### Reminder

These are **drafts only**. Posting is your action — I won't push to remote, npm, or any external service without your explicit confirmation. The v4.0.0 git tag is also still local from Phase 32.

## v4.1.0 — Korean adopter / contributor docs (2026-05)

First 4.x minor. Continues v3.6 / v3.10 KR i18n investment. Korean adopters now have full Korean docs for using, contributing, and understanding the architecture — three foundational docs that previously existed only in English.

### Added
- **`docs/USING.ko.md`** — 사용자 가이드. Codex / Claude Code / Cursor / Aider / VS Code 통합, 토큰 예산 표, 한국 프로젝트 추가 컨텍스트 (KR 결제 / 타이포 / 음성 / 게임 / 영상 / 인쇄 / 일러스트 / 공간), 새로고침 주기.
- **`docs/CONTRIBUTING.ko.md`** — 기여 가이드. 소스 레포 추가, 새 스킬 / 에이전트 / 커맨드 추가, 지식 파일 편집, 버전 메타데이터 (v3.11+), 인용 규칙, 한국어 콘텐츠 기여 톤 가이드 (해요체 / 합쇼체 분기), 6개 감사, PR 워크플로.
- **`docs/ARCHITECTURE.ko.md`** — 아키텍처. 4 계층 다이어그램, model-agnostic 철학, 지식 / 추출기 / 스킬 파일 계약, 검증 단계, 6개 감사 표, 4개 배포 채널, i18n 구조.

### Changed
- **`mkdocs.yml`** — `nav_translations`에 `Using design-ai: 사용 가이드`, `Contributing: 기여 가이드` 추가. `docs_structure: suffix`로 `.ko.md` 파일은 자동으로 `/ko/...` 경로 매핑.
- **`package.json` + `.claude-plugin/plugin.json`** versions: 4.0.0 → 4.1.0.

### Verified
- All 6 audits pass.
- Korean copy check now scans 29 Korean-relevant files (was 26).
- Translations adapted to natural Korean — 해요체 voice for adopter-facing docs (USING / CONTRIBUTING), neutral technical tone for ARCHITECTURE.

### Translation choices
- 사용자 / 기여자 대상 본문: 해요체 (친근, 일상).
- 코드 블록 / 명령어: 영문 그대로.
- 기술 용어 (API, frontmatter, schema 등): 영문 그대로 자연스러우면 영문 유지.
- 한국 브랜드 / 컨벤션: 한국어 유지 (Toss, KakaoPay, Pretendard, 카카오톡).
- 직역 거부 — 한국어 자연스러움 우선.

### What this enables
- **Korean adopters** can read full sense-making docs in Korean (USING + ARCHITECTURE) before committing to adopt.
- **Korean contributors** can follow the contribution flow without English friction (CONTRIBUTING).
- **Lower English-friction barrier** for KR design / engineering teams evaluating design-ai for company adoption.
- **KR community announcement** (planned for 4.x): when design-ai is announced on OKKY / hashnode.kr / dev.to/korea, the linked docs are now Korean-native.

## v4.0.0 — Stable (2026-05)

**design-ai graduates to stable.** No code changes from v3.12.0 — this is a graduation release that promises API stability across skills, commands, agents, CLI, and plugin manifest. See [`docs/MIGRATION-v4.md`](docs/MIGRATION-v4.md) for the (deliberately small) migration story.

### What v4.0 means

| Surface | Promise |
|---|---|
| Knowledge files (91) | Frozen at `version: 1.0.0`, `stability: stable` |
| Skills (19) | API-stable; deprecation cycle required for removals |
| Slash commands (15) | API-stable; deprecation cycle required for removals |
| Review agents (4) | API-stable |
| CLI (`@design-ai/cli`) | Argv contract stable; pin to `^4.0.0` |
| Plugin manifest | Schema stable |
| VS Code extension | Configuration keys stable |
| Doc site | URL structure frozen |

### Added
- **`docs/MIGRATION-v4.md`** — graduation migration guide. TL;DR (no code changes), what v4.0 promises (API stability across 8 surfaces), what it does NOT promise (content evolution still expected), deprecation policy (deprecate in 4.x → remove in 5.0), upgrade instructions per channel.

### Changed
- **`package.json` + `.claude-plugin/plugin.json`** versions: 3.12.0 → 4.0.0.

### Verified
- All 6 audits pass (frontmatter / link / Korean copy / coverage / integration-check / stale-check).
- CLI smoke test: `version`, `help`, `status`, `list skills` all clean.
- NPM pack preview: tarball within budget; allowlist correct.
- Doc site builds.
- VS Code extension compiles.

### Deprecation policy (effective from v4.0)

Anything publicly documented follows: deprecate in 4.x → maintain in 4.x → remove in 5.0. Adopters always get one full minor cycle of warnings.

### What's still ahead (4.x)
- KR tech community announcement (OKKY, hashnode.kr, dev.to/korea).
- VS Code marketplace publish (1.0.0).
- Coverage push 55% → 70%.
- More Korean translations (CONTRIBUTING.ko.md, ARCHITECTURE.ko.md, USING.ko.md).
- Semantic search index (Algolia / Typesense).
- Component spec extractor v2 (TS AST parsing).

### The journey

v2.0 → v4.0 in one table:

| Surface | v2.0 | v4.0 |
|---|---|---|
| Knowledge files | 55 | 91 |
| Worked examples | 83 | 160 |
| Skills | 12 | 19 |
| Slash commands | 8 | 15 |
| Review agents | 4 | 4 |
| Component coverage | ~24% | 55.3% |
| Distribution channels | 1 | 4 (npm / Homebrew / git / VS Code) |
| Integration walkthroughs | 0 | 5 (each EN + KO) |
| Site languages | 0 | 2 (EN + KO) |
| CI audits | 4 | 6 |

See [`docs/SESSION-LOG.md`](docs/SESSION-LOG.md) for the full narrative.

## v3.12.0 — Release readiness (2026-05)

Operationalizes the versioned frontmatter from v3.11. Adds a stale-content audit, a release checklist, and a session log. Closes the v3.x arc — design-ai is now release-ready (versioned, audited, distributed, localized).

### Added
- **`tools/audit/stale-check.py`** — flags knowledge files whose `last_updated` is too old. Default thresholds: warn at 6 months, error at 12 months. Configurable via `--warn-months` / `--error-months`. Supports `--strict` (exit 1 on stale). `--today YYYY-MM-DD` for testing. Files without `last_updated` are skipped (backward-compatible).
- **`docs/RELEASE-CHECKLIST.md`** — pre-release ritual. 11 main sections (audits / version alignment / CHANGELOG / ROADMAP / CLI smoke test / NPM preview / doc site build / VS Code build / Korean copy spot-check / tag and push / post-tag) + major-version sections (migration guide / announcement template / stability re-review) + VS Code marketplace publish + Homebrew formula update + common failure modes table + stability promotion ritual.
- **`docs/SESSION-LOG.md`** — single-page narrative of how design-ai grew from v2.0 (foundation) to v3.12 (release-ready). At-a-glance metrics table, phase log organized by epochs (domain expansion / distribution / coverage acceleration / VS Code / Korean depth / release readiness), patterns that worked, patterns that didn't, repo structure, cross-references.

### Changed
- **`.github/workflows/audit.yml`** — added stale-content audit to CI. Strict mode on `push` to `main` (CI fails on ≥12-month-stale files); warn-only on PRs.
- **`package.json` + `.claude-plugin/plugin.json`** versions: 3.11.0 → 3.12.0.

### Verified
- All 6 audits pass (frontmatter / link / Korean copy / coverage / integration-check / stale-check).
- Stale-check tested with `--today 2027-08-15` — correctly flagged 75 files as 15 months stale (would fail CI under `--strict`).
- All 91 knowledge files within freshness window (≤ 6 months).

### What this enables
- **Confident releases** — RELEASE-CHECKLIST.md codifies the pre-tag ritual; nothing slips through.
- **Continuous freshness** — stale-check runs on every push to main; surfaces files that need review before they rot.
- **Project narrative** — adopters and contributors can read SESSION-LOG.md to understand the arc; future maintainers have context for design decisions.
- **v4.0 readiness** — design-ai is now versioned, audited, distributed (4 channels), localized (EN + KO), and release-checklisted. Ready to tag stable.

## v3.11.0 — Versioned knowledge frontmatter (2026-05)

Foundation for v4.0 stability. Every knowledge file now carries `version`, `last_updated`, and `stability` metadata. Adopters can pin to specific versions; future audits can flag stale content.

### Added
- **`tools/migrations/add-version-frontmatter.py`** — one-shot migration script. Idempotent. Adds `version: 1.0.0`, `last_updated: 2026-05`, `stability: stable` to all 91 knowledge frontmatters. Supports `--write` (apply) and dry-run.
- **`tools/audit/frontmatter-check.py`** — validates the new optional fields:
  - `version`: must be semver-shaped (e.g., `1.0.0`, `1.2.3-beta`).
  - `last_updated`: must be `YYYY-MM` or `YYYY-MM-DD`.
  - `stability`: must be one of `stable` / `beta` / `experimental` / `deprecated`.
  - Missing keys remain OK (backward-compatible).
- **`tools/migrations/`** directory — new home for one-shot migration scripts (separate from `tools/audit/` and `tools/extractors/`).

### Changed
- **All 91 knowledge files** — frontmatter extended with version metadata. No content changes.
- **`package.json` + `.claude-plugin/plugin.json`** versions: 3.10.0 → 3.11.0.

### Stability levels
| Level | Meaning |
| --- | --- |
| `stable` | Reviewed; canonical; safe to depend on |
| `beta` | Substantively complete but pending review or final polish |
| `experimental` | Active iteration; may change significantly |
| `deprecated` | Superseded; will be removed in a future major version |

All current knowledge starts at `stable` — they were all reviewed during their respective phases.

### Verified
- All 5 audits pass (frontmatter / link / Korean copy / coverage / integration-check).
- Migration script idempotent (re-running detects existing version keys, skips).
- All 91 files updated; format identical to existing convention.

### What this enables
- **Version pinning** — adopters can reference "knowledge v1.0.0" or "design-ai @ 3.11" with confidence.
- **Stale-content detection** — future audit can flag files with `last_updated > 12 months ago`.
- **Stability-aware skills** — skills can prefer `stable` knowledge over `experimental` when both exist.
- **Migration tracking** — `last_updated` reflects the substantive last review of each file (currently 2026-05 for all; will diverge over time).

## v3.10.0 — Korean integration walkthroughs (2026-05)

Five integration walkthroughs translated to Korean. Continues v3.6 KR i18n investment — primary audience (KR designers / developers) can now use Codex / Cursor / Aider / SDK / VS Code without English friction.

### Added
- **`docs/integrations/codex-walkthrough.ko.md`** — Codex CLI 워크스루 (4 sessions: 컴포넌트 spec / 디자인 시스템 / 비평 반복 / Figma 감사) + Codex 전용 팁 (파일 경로, MCP 설정, AGENTS.md 조각).
- **`docs/integrations/cursor-walkthrough.ko.md`** — Cursor 워크스루 (5 sessions: 인라인 spec / 기존 감사 / Figma 비평 / 토큰 생성 / Cmd+K 인플레이스 편집) + Composer 모드 + MCP 설정.
- **`docs/integrations/aider-walkthrough.ko.md`** — Aider 워크스루 (4 sessions: 구현 / 리팩토링 / 디자인 시스템 부트스트랩 / 감사-수정) + Aider 패턴 (architect mode, auto-test, bash alias).
- **`docs/integrations/sdk-walkthrough.ko.md`** — Anthropic + OpenAI SDK 워크스루 (5 sessions: prompt caching, 도구 사용, 스트리밍, 프로덕션 챗봇).
- **`docs/integrations/vscode-walkthrough.ko.md`** — VS Code 확장 워크스루 (5 sessions: 채팅 참조 / 기존 감사 / PLAYBOOK 생성 / 빠른 선택 / 멀티 파일 부트스트랩).

### Changed
- **`tools/audit/korean-copy-check.py`** — `.ko.md` 패턴 추가; 26개 한국어 관련 파일 스캔 (이전 17).
- **`package.json` + `.claude-plugin/plugin.json`** versions: 3.9.0 → 3.10.0.

### Verified
- All 5 audits pass.
- Korean copy check now scans `.ko.md` files (26 total).
- 358 internal links resolve.
- Translations adapted to natural Korean — 해요체 voice for adopter-facing content; not literal English-to-Korean.

### Voice / register choices
- 어댑터 / 사용자 대상 콘텐츠 — 해요체 (친근).
- 코드 블록은 영문 그대로 유지 (대부분의 명령어 / API).
- 한국어 브랜드 이름 / 컨벤션은 한국어 유지 (Toss, KakaoPay, Pretendard).
- Direct translation 거부 — 한국어 자연스러움 우선 ("Let's get started" → "시작해 봐요" 아닌 영어 직역 "시작합시다 우리는").

### What this enables
- **Korean adopters** can use any of 5 AI coding tools with full walkthroughs in Korean.
- **B2B 한국 팀** can share Korean walkthroughs with non-developer stakeholders.
- **Lower English-friction** for KR designers / developers evaluating design-ai.
- **Audit coverage** — Korean files now validated by korean-copy-check on every PR.

## v3.9.0 — Coverage push 45% → 55% (2026-05)

Component coverage 45.2% → **55.3%** (90 → 110 of 199 canonical components). Crosses majority canonical coverage. Form / overlay / transition primitives largely complete.

### Added (20 specs total — 18 new + 2 renames)

**Form / control primitives** (3):
- `component-switch.md` — sibling to form-controls; iOS-style toggle; Switch vs Checkbox decision
- `component-textarea.md` — multi-line input; Korean IME composition handling
- `component-textarea-autosize.md` — grows-with-content variant; CSS field-sizing + JS fallback

**Notifications** (2):
- `component-snackbar.md` — Material's Toast (bottom-anchored)
- `component-sonner.md` — modern shadcn toast library; stacking depth, promise wrapper

**Overlays** (3):
- `component-popconfirm.md` — inline confirmation popover; lightweight vs AlertDialog
- `component-popper.md` — low-level positioning primitive used by all overlays
- `component-click-away-listener.md` — outside-click utility wrapper

**Display / layout** (4):
- `component-tag.md` — closeable label / chip
- `component-resizable.md` — IDE-style resizable panel groups
- `component-image-list.md` — uniform-grid photo display
- `component-toolbar.md` — horizontal action container with role="toolbar"

**Mobile-first** (1):
- `component-swipeable-drawer.md` — swipe-to-open / swipe-to-close drawer

**Floating / scroll** (2):
- `component-back-top.md` — scroll-to-top button after threshold
- `component-speed-dial-action.md` — sub-action inside SpeedDial

**Transitions** (2):
- `component-zoom.md` — scale + fade transition primitive
- `component-slide.md` — direction-based slide transition

**Sub-components** (1):
- `component-step.md` — single Step inside Steps/Stepper

**Renames** (2):
- `component-autocomplete.md` → `component-auto-complete.md` (matches canonical)
- `component-mention.md` → `component-mentions.md` (matches canonical)

### Coverage
- Examples: 142 → 160 (+18)
- Component coverage: 90 → **110** (45.2% → **55.3%**)

### Versions
- CLI: 3.8.0 → 3.9.0
- Plugin / corpus: 3.8.0 → 3.9.0

### What this enables
- **Majority canonical coverage** — over half of the 199-component surface specced.
- **Notification family complete** — Toast / Snackbar / Sonner / Message / Notification / Banner / Alert all distinct + comparable.
- **Transition primitives complete** — Fade / Zoom / Slide / Grow / Collapse all referenced.
- **Form primitives complete** — Switch / Checkbox / Radio / Label / Textarea + autosize / Field family.

## v3.8.0 — VS Code extension (2026-05)

design-ai is now accessible inside VS Code via a dedicated extension. Surfaces the corpus as sidebar trees + quick-pick commands; pairs with any AI assistant (Copilot Chat, Cursor Chat, Continue, Claude in VS Code, etc.).

### Added
- **`vscode-extension/`** — TypeScript-based VS Code extension:
  - `package.json` manifest with 8 commands + 4 sidebar views + 2 settings.
  - `src/extension.ts` — entry point with path auto-probing.
  - `src/paths.ts` — locates design-ai source via setting / workspace folder / common locations / npm-global / Homebrew.
  - `src/commands.ts` — 8 commands (Install, Status, Open knowledge, Open spec, Open skill, Open walkthrough, Refresh, Settings).
  - `src/providers/trees.ts` — TreeDataProviders for Skills / Knowledge (recursive) / Examples / Walkthroughs.
  - `media/icon.svg` — gradient indigo/violet "D" mark.
  - `tsconfig.json`, `.vscodeignore`, `LICENSE`, `README.md`, `CHANGELOG.md`.
- **`docs/integrations/vscode-walkthrough.md`** — 5 worked sessions (browse + reference, audit existing, generate from PLAYBOOK, quick-pick across corpus, multi-file design system bootstrap).
- **`tools/audit/integration-check.py`** — added vscode-walkthrough.md to the validation list (now 5 walkthroughs).
- **`README.md`** — agent table now lists VS Code as a supported environment.
- **`mkdocs.yml`** — Integrations nav adds VS Code entry.

### Versions
- CLI: 3.7.0 → 3.8.0
- Plugin / corpus: 3.7.0 → 3.8.0
- VS Code extension: 0.1.0 (initial release; lives in `vscode-extension/`)

### What this enables
- **Millions of VS Code users** can browse design-ai content without leaving the editor.
- **Pair with any AI assistant** — Copilot Chat / Cursor / Continue / Claude / CodeWhisperer all work via `#file:` / `@file` references.
- **Korean preference setting** — `design-ai.language: "ko"` opens Korean translations of README / QUICKSTART / etc.
- **Doesn't compete with AI assistants** — provides design-aware **content** that complements any AI tool.

### How to publish (maintainer note)
The extension is scaffolded but not yet published to the VS Code Marketplace. To publish:
```bash
cd vscode-extension
npm install
npm run compile
npx @vscode/vsce package         # produces .vsix
npx @vscode/vsce publish         # requires Azure DevOps PAT + publisher account
```
Or distribute via the GitHub Releases page until marketplace publication.

## v3.7.0 — Coverage push 36% → 45% (2026-05)

Component coverage 36.2% → **45.2%** (72 → 90 of 199 canonical components). Crosses the halfway-to-100% threshold for canonical primitive coverage.

### Added (18 specs total — 17 new + 1 rename)

**Form / control primitives** (5):
- `component-checkbox.md` — sibling spec to form-controls; indeterminate state, KR marketing-consent rule
- `component-radio.md` + RadioGroup — mutually exclusive choice; KR payment-method picker
- `component-label.md` — htmlFor linking; required / optional indicators; KR conventions
- `component-icon.md` — base primitive; size scale, currentColor theming
- `component-icon-button.md` — icon-only variant; mandatory aria-label

**Layout primitives** (4):
- `component-box.md` — most generic styled `<div>` with system props
- `component-flex.md` — flex layout primitive; direction / gap / align / justify
- `component-grid.md` — 2D layout (Ant Row+Col / MUI v2 / modern CSS Grid)
- `component-space.md` — tiny inline-gap utility (sibling to Flex / Stack)

**Navigation / overlays** (3):
- `component-menu.md` — Ant-style structured nav; distinct from Dropdown / NavigationMenu / Sidebar
- `component-button-group.md` — visually unified action cluster
- `component-speed-dial.md` — FAB with 2-5 secondary action FABs (mobile compose pattern)

**Feedback / data** (3):
- `component-message.md` — top thin pill notification (Ant); distinct from Toast / Notification
- `component-notification.md` — richer corner card with title + description + actions
- `component-list.md` — semantic + styled wrapper around Item rows; pagination, virtualization

**Pickers** (2):
- `component-time-picker.md` — hour/minute/second; 24/12-hour; KR step conventions
- `component-tree-select.md` — dropdown hierarchical picker; distinct from Cascader / Tree

**Utility** (1):
- `component-backdrop.md` — semi-opaque scrim overlay

**Renamed** (1):
- `component-qrcode.md` → `component-qr-code.md` (matches canonical kebab-case naming)

### Coverage
- Examples: 124 → 142 (+18)
- Component coverage: 72 → **90** (36.2% → **45.2%**)
- Knowledge: 91 (no change)
- Skills: 19 (no change)
- Commands: 15 (no change)

### Versions
- CLI: 3.6.0 → 3.7.0
- Plugin / corpus: 3.6.0 → 3.7.0

### What this enables
- **Halfway to 100%** — 45.2% is a meaningful milestone; the canonical primitive surface is well-covered.
- **Form construction primitives complete** — Checkbox / Radio / Label / Field family / Switch (in form-controls) all covered. Form skill output uses real spec foundations.
- **Layout primitives covered** — Box / Flex / Grid / Stack / Space / Masonry — adopters can pick the right tool.
- **Notification family unified** — Toast / Message / Notification / Banner / Alert all distinct, comparable; team picks the right one.

## v3.6.0 — Doc site Korean i18n (2026-05)

design-ai's primary audience is Korean designers / developers. The doc site is now bilingual: English (default) + Korean translations of the highest-traffic pages.

### Added
- **`README.ko.md`** — Korean primary landing. Coverage table, install paths, agent table, project structure, Korean market focus.
- **`docs/QUICKSTART.ko.md`** — 5-minute getting-started in Korean.
- **`docs/DISTRIBUTION.ko.md`** — distribution guide in Korean (NPM / Homebrew / git clone).
- **`AGENTS.ko.md`** — universal agent entry point in Korean.
- **`mkdocs-static-i18n` plugin** — file-suffix-based translations (`README.ko.md`, `index.ko.md`); language switcher in mkdocs-material header.
- **mkdocs nav translations** — section labels (Home / Quickstart / Distribution / etc.) translated to Korean.
- **README badges** — language toggle at top of both English and Korean READMEs.

### Changed
- **`tools/build-docs.sh`** — symlinks Korean translations into `site-src/`.
- **`docs/requirements.txt`** — added `mkdocs-static-i18n>=1.3.0`.
- **`mkdocs.yml`** — `extra.alternate` declares English / Korean languages; `i18n` plugin configured.
- **`README.md`** (English) — language toggle to Korean version; examples count corrected to 124.
- **`package.json` + `.claude-plugin/plugin.json`** versions: 3.5.0 → 3.6.0.

### Verified
- All 5 audits pass.
- mkdocs build succeeds in 12s with both languages.
- Korean pages render at `/ko/` with translated nav.
- Search supports both English and Korean.

### What this enables
- **Korean B2C / B2B audiences** can browse the corpus without English friction.
- **SEO for the primary market** — Korean meta tags + content indexed by Naver / Google KR.
- **Lower adoption friction** — KR designers / developers evaluate in their native language before installing.

## v3.5.0 — Component spec scaffolder + coverage push (2026-05)

Component coverage 30.7% → **36.2%** (61 → 72 of 199 canonical components). Adds an extractor that scaffolds future spec drafts from upstream sources, accelerating future coverage pushes.

### Added (1 extractor + 11 specs)

**Extractor**:
- `tools/extractors/component_spec_scaffold.py` — given a canonical component name, reads its sources from `refs/{ant,mui,shadcn}` and emits a draft `examples/component-{name}.md`. Best-effort prop extraction from TS interfaces. Supports `--name`, `--all-missing`, `--limit`, `--dry-run`, `--force`. Graceful degradation when refs/ is missing (still produces template).

**11 component specs**:
- `component-alert-dialog.md` — destructive action confirmation; default focus on Cancel; `role="alertdialog"`.
- `component-bottom-navigation.md` — mobile primary nav; iOS / Android / M3 conventions; safe-area handling.
- `component-chart.md` — Recharts wrapper with theming + a11y; KR stock convention (red=up); engine-agnostic chart-type table.
- `component-combobox.md` — searchable select with WAI-ARIA combobox pattern; Korean IME composition handling.
- `component-field.md` — Field family form-wrapper (Field / FieldLabel / FieldDescription / FieldError / FieldGroup / FieldSet / FieldLegend).
- `component-item.md` — list-item primitive (Item / ItemMedia / ItemContent / ItemTitle / ItemDescription / ItemActions).
- `component-link.md` — text link primitive; Link vs Button decision; external indicator; underline policies.
- `component-paper.md` — MUI surface primitive; elevation + outlined; building block for Card / Modal / Drawer.
- `component-spinner.md` — indeterminate loading; Spinner vs Progress vs Skeleton; reduced-motion.
- `component-empty.md` — inline "no data" primitive; distinct from EmptyState (full-page custom).
- `component-masonry.md` — Pinterest-style staggered grid; CSS multicolumn vs JS measurement trade-offs; a11y reading order.

### Coverage
- Examples: 113 → 124 (+11)
- Component coverage: 61 → **72** (30.7% → **36.2%**)
- Knowledge: 91 (no change)
- Skills: 19 (no change)
- Commands: 15 (no change)

### Versions
- CLI: 3.4.0 → 3.5.0
- Plugin / corpus: 3.4.0 → 3.5.0

### What this enables
- **Future coverage pushes accelerate** — scaffold 30+ drafts in seconds, refine + ship.
- **Closer parity with shadcn-ui** — most flagship primitives now have specs (alert-dialog, command, sheet, dropdown, navigation-menu, menubar, sidebar, combobox, field, item).
- **Form scaffolding ready** — Field family enables structured form construction across the corpus.

## v3.4.0 — Multi-agent integration + Homebrew (2026-05)

Concrete proof of design-ai's "model-agnostic" tagline. Four worked-example walkthroughs (Codex CLI / Cursor / Aider / SDK), Homebrew formula for `brew install`, and a CI audit that keeps walkthroughs from drifting.

### Added
- **`docs/integrations/codex-walkthrough.md`** — 4 walkthroughs (component spec, design system, iterate critique, Figma audit) + Codex-specific tips (file paths, MCP config, AGENTS.md fragments).
- **`docs/integrations/cursor-walkthrough.md`** — 5 walkthroughs (inline component spec, audit existing component, Figma critique, token generation, `Cmd+K` inline edits) + Composer mode patterns.
- **`docs/integrations/aider-walkthrough.md`** — 4 walkthroughs (component impl, refactor to spec, design system bootstrap, audit-then-fix) + Aider-specific patterns (architect mode, auto-test, bash aliases).
- **`docs/integrations/sdk-walkthrough.md`** — Anthropic SDK + OpenAI SDK adoption with prompt caching, tool use, streaming. Production chatbot example.
- **`Formula/design-ai.rb`** — Homebrew formula for `brew install design-ai`. Tap-based distribution; future-ready for homebrew-core submission.
- **`Formula/README.md`** — Maintainer instructions for releasing new versions via Homebrew.
- **`tools/audit/integration-check.py`** — verifies each walkthrough has required sections (Prerequisites, Setup, ≥3 Walkthrough N, Next/cross-reference). Wired into CI.

### Changed
- **`docs/CODEX-INTEGRATION.md`**, **`docs/CURSOR-INTEGRATION.md`**, **`docs/AIDER-INTEGRATION.md`** — link to the new walkthroughs at the top.
- **`README.md`** — added Option B: Homebrew install path; agent table now links to per-agent walkthroughs.
- **`mkdocs.yml`** — Integrations nav restructured: each agent now has Setup + Walkthrough sub-entries; SDK and Distribution pages added at top level.
- **`.github/workflows/audit.yml`** — added `integration-check.py` step. CI now has 5 audits.

### Versions
- CLI: 3.3.0 → 3.4.0
- Plugin / corpus: 3.3.0 → 3.4.0

### What this enables
- **Model-agnostic adoption** — adopters can choose Codex, Cursor, Aider, or pure SDK without reverse-engineering setup.
- **Homebrew install** — Mac users get `brew install design-ai`. Cleaner than git clone for non-developer audiences.
- **Quality bar on integration docs** — CI fails if a walkthrough loses its standard structure (Prerequisites / Setup / Walkthroughs / Next).

## v3.3.0 — Component coverage push (2026-05)

Component spec coverage 23.6% → **30.7%** (47 → 61 of 199 canonical components).

### Added (15 component specs)

**Overlay primitives**:
- `component-badge.md` — standalone label + indicator dual modes
- `component-dropdown.md` — Dropdown / DropdownMenu (renamed from `component-dropdown-menu.md` to match canonical)
- `component-context-menu.md` — right-click / long-press triggered
- `component-hover-card.md` — hover-triggered floating preview
- `component-sheet.md` — side-anchored modal panel with mobile detents
- `component-command.md` — Command / CommandPalette (renamed from `component-command-palette.md`); cmdk-based searchable palette

**Navigation / layout**:
- `component-sidebar.md` — persistent collapsible navigation
- `component-navigation-menu.md` — top horizontal nav with mega-menu
- `component-menubar.md` — desktop-style File / Edit / View menus

**Utilities**:
- `component-aspect-ratio.md` — proportions wrapper
- `component-collapsible.md` — single expandable section primitive
- `component-toggle.md` — Toggle + ToggleGroup pressable buttons
- `component-scroll-area.md` — custom-styled scrollbar
- `component-banner.md` — persistent in-page strip (distinct from Alert + Toast)
- `component-kbd.md` — keyboard shortcut display (platform-aware symbols)
- `component-separator.md` — horizontal / vertical divider

### Coverage
- Examples: 99 → 113 (+14; 2 renamed, 13 net new + 2 small)
- Component coverage: 47 → **61** (23.6% → **30.7%**)
- Knowledge: 91 (no change)
- Skills: 19 (no change)
- Commands: 15 (no change)

### Versions
- CLI: 3.1.0 → 3.3.0
- Plugin / corpus: 3.1.0 → 3.3.0

(v3.2 didn't bump versions — that phase added the doc site without changing the corpus / CLI.)

## v3.2.0 — Public doc site (2026-05)

mkdocs-material site at GitHub Pages. The corpus is now browsable + searchable for prospective adopters before they install.

### Added
- **`mkdocs.yml`** — site config with full nav covering knowledge / skills / commands / agents / examples / integrations / reference. Material theme with brand-colored palette (indigo/violet) and Korean typography (Pretendard variable font from CDN).
- **`tools/build-docs.sh`** — populates `site-src/` with a symlink farm pointing to corpus content (mkdocs requires docs_dir to be a sibling of the config, not the parent — symlink farm is the standard workaround).
- **`docs/site-overrides/`** — theme customizations: `extra.css` (Pretendard for Korean, brand color tweaks, `word-break: keep-all` for Hangul), `main.html` (announcement bar + OpenGraph metadata), `logo.svg`, `favicon.svg`.
- **`docs/requirements.txt`** — pinned mkdocs-material dependencies (resolves a pygments/pymdown-extensions interaction bug in older 9.5.x).
- **`.github/workflows/docs.yml`** — auto-deploy to GitHub Pages on every push to main. Uses `actions/configure-pages@v4` + `actions/deploy-pages@v4`.
- **README badge** linking to the live doc site.

### Changed
- `tools/audit/link-check.py` and `korean-copy-check.py` — now skip `site-src/`, `site/`, `node_modules/` walk paths so audits don't double-count symlinked content.
- `.gitignore` — excludes `site/`, `site-src/` build artifacts.

### Local preview
```bash
pip install -r docs/requirements.txt
./tools/build-docs.sh
mkdocs serve
```

### What this enables
- **Discoverability** — prospective adopters can browse the corpus on the public site before deciding to install.
- **Search** — built-in mkdocs-material search across all 91 knowledge files + 99 examples + skill playbooks.
- **Korean readability** — Pretendard font + word-break rules render Hangul correctly throughout the site.
- **Lower-friction evaluation** — open-source contributors can read full skill / pattern docs without cloning.

## v3.1.0 — Distribution / NPM CLI (2026-05)

NPM CLI distribution. One-command install for adopters.

### Added
- **`@design-ai/cli` npm package** — `npx @design-ai/cli install` from any machine with Node ≥ 18.
- **CLI** (`cli/`): `install`, `update`, `uninstall`, `status`, `list`, `version`, `help`. Aliases (`i`, `u`, `s`, `ls`, `v`).
- **`docs/DISTRIBUTION.md`** — three install paths, CLI reference, versioning rules, publishing checklist, troubleshooting.
- **`.github/workflows/publish.yml`** — auto-publish on `v*` tag with version-match enforcement, audit run, `npm pack --dry-run`, `--provenance` attestation.
- **`.npmignore`** — safety net for what stays out of the npm tarball.

### Changed
- **`.claude-plugin/plugin.json`** version: 3.0.0 → 3.1.0 (aligned with CLI).
- **`README.md`** — lead with `npx @design-ai/cli install` as primary install path.

### What you can do now
```bash
npx @design-ai/cli install
design-ai status
design-ai list skills
design-ai update
```

## v3.0.0 — Stabilization (2026-05)

Productization phase. Makes design-ai installable as a Claude Code plugin and prepares the corpus for adopters beyond the original author.

### Added
- **`.claude-plugin/plugin.json`** — Claude Code plugin manifest. All 19 skills, 15 commands, 4 agents discoverable via plugin tooling.
- **`install.sh`** — automated installer with symlink approach; supports `--uninstall`, `--status`, custom prefix and target.
- **`docs/QUICKSTART.md`** — 5-minute getting-started for new adopters.
- **`CHANGELOG.md`** — this file.
- **CI** now runs the Korean copy check on every PR (previously only frontmatter / link / coverage).

### Changed
- **`README.md`** rewritten to reflect the v2 expansion (motion / illustration / print / video / game UI / conversational / spatial) and to lead adopters through install → first task.

### Stats
- 91 knowledge files
- 99 worked examples
- 19 skills (all with verification phase)
- 15 slash commands
- 4 review agents
- 7 reference extractors
- 5 audit tools (frontmatter, link, korean copy, coverage, changelog)

## v2.7.0 — Spatial / AR / VR (2026-05)

Final phase of v2 expansion. Spatial computing as a first-class design surface.

### Added
- **5 spatial knowledge files**: `spatial-design-fundamentals.md`, `vr-patterns.md`, `ar-patterns.md`, `spatial-ui-elements.md`, `comfort-and-accessibility.md`
- **2 component specs**: `component-spatial-panel.md` (anchoring, sizing, billboarding, hand+gaze input), `component-spatial-locomotion.md` (teleport / smooth / snap turn / room-scale)
- **Skill**: `spatial-designer`
- **Command**: `/spatial`

Korean Galaxy XR ecosystem context, motion sickness mitigations, vergence-accommodation guidance, comfort defaults for new users.

## v2.6.0 — Voice / Conversational UI (2026-05)

### Added
- **5 conversational knowledge files**: fundamentals (turn-taking, intents, modalities, latency, hallucinations), `voice-ui-patterns.md`, `chatbot-design.md`, `ai-chat-interfaces.md` (LLM streaming + markdown), `korean-voice-conventions.md`
- **2 component specs**: `component-chat-interface.md`, `component-voice-input.md`
- **Skill**: `conversational-ui-designer`
- **Command**: `/conversational`

Korean voice ecosystem (Bixby, Clova, NUGU, GiGA Genie, Kakao i), 해요체 / 합쇼체 selection, KakaoTalk channel chatbot, 개인정보보호법 / 정보통신망법 / 자본시장법 compliance.

## v2.5.0 — Game UI (2026-05)

### Added
- **5 game-ui knowledge files**: Russell taxonomy (diegetic / non-diegetic / spatial / non-spatial), HUD design (health / ammo / crosshair / mini-map / cooldowns), menu systems (main / pause / inventory / settings / store), Korean gaming conventions, game accessibility (4 axes)
- **2 component specs**: `component-game-hud.md`, `component-game-menu.md`
- **Skill**: `game-ui-designer`
- **Command**: `/game-ui`

Korean gaming context: PC bang culture, NEXON / NCSoft / Krafton / Smilegate, 게임산업진흥법, 확률 표시 mandatory, 본인인증 / PASS / NICE, GRAC ratings, gacha pity / 천장.

## v2.4.0 — Video content (2026-05)

### Added
- **5 video knowledge files**: fundamentals (codecs, resolution, framerate, bitrate, audio loudness, captions, color space), marketing video, social / short-form (Reels / Shorts / TikTok), in-product video (onboarding / help), Korean video conventions
- **2 component specs**: `component-video-player.md` (multi-lang captions, speed, transcript), `component-video-hero.md` (autoplay loop with art-direction)
- **Skill**: `video-designer`
- **Command**: `/video`

Korean platforms (YouTube / Naver TV / KakaoTV / SOOP), 자막 styling, voiceover (해요체 / 합쇼체), 표시광고법 ad disclosure, KFDA / KFTC compliance.

## v2.3.0 — Print / physical design (2026-05)

### Added
- **6 print knowledge files**: fundamentals (CMYK, bleed, DPI, paper), stationery, brochures and flyers, signage and posters, packaging (dielines), Korean print conventions
- **2 worked print specs**: `print-business-card-spec.md` (Korean 명함, premium tier), `print-packaging-spec.md` (cosmetics carton)
- **Skill**: `print-designer`
- **Command**: `/print`

Korean print specifics: 명함 90×50mm, KFDA / KATS regulatory content for cosmetics / food / supplements, 분리배출 표시 recycling marks, Pretendard typography for print.

## v2.2.0 — Illustration systems (2026-05)

### Added
- **5 illustration knowledge files**: `illustration-systems.md`, `spot-illustrations.md`, `hero-illustrations.md`, `mascot-design.md`, `svg-optimization.md`
- **2 component specs**: `component-empty-state.md` (with illustration registry), `component-illustration.md` (themeable SVG / Lottie display)
- **Skill**: `illustration-designer`
- **Command**: `/illustration`

Korean mascot conventions (Kakao Friends, Toss money characters, Naver / NaverPay characters), soft rounded geometry for B2C, mascot design + governance.

## v2.1.0 — Motion design depth (2026-05)

### Added
- **5 motion knowledge files**: `marketing-motion.md`, `app-loading-sequences.md`, `micro-interactions.md`, `choreography-depth.md`, `motion-tools.md`
- **4 component specs**: `component-loading-sequence.md` (splash + biometric gate + first-screen reveal), `component-page-transition.md`, `component-lottie-player.md`, `component-scroll-reveal.md`
- **Skill**: `motion-designer`
- **Command**: `/motion-design`

Tool decision tree (CSS / Framer Motion / GSAP / Lottie / Rive / react-spring), reduced-motion safety throughout.

## v2.0.0 — Completion (earlier 2026)

Final completion of v2.0 baseline scope.

### Added
- 6 doc / deck / report / email worked examples (Diátaxis tutorial / how-to / explanation; slide deck talk; UX audit report; Korean fintech transactional email).
- 7 component specs: `component-descriptions.md`, `component-hero-block.md`, `component-feature-grid.md`, `component-testimonial-carousel.md`, `component-pricing-cards.md`, `component-pass-auth.md` (Korean 본인인증), `component-otp-countdown.md`.
- 3 universal pattern knowledge files: `auth-flow-design.md`, `pricing-page-design.md`, `landing-hero-design.md`.

## v1.9.0 — Document design + brand + email

### Added
- 5 document design knowledge files (typography for long-form, information architecture / Diátaxis, technical writing voice, slide deck design, report design).
- 3 brand / medium files (`brand-identity.md`, `email-design.md`, `i18n/korean-app-store-visual.md`).
- `i18n/korean-document-style.md` — honorific level (합쇼체 vs 해요체), hierarchy, spacing.
- 4 doc component specs (Heading, Code, Callout, Blockquote).
- 1 email component spec (`email-layout.md` — bulletproof button, Outlook fallback).
- Skills: `document-author`, `slide-deck-author`.
- Commands: `/document-from-brief`, `/slide-deck`, `/design-review`.

## v1.8.0 — MCP integrations

### Added
- 4 MCP-aware skills: `design-pr-review` (GitHub), `figma-token-sync` (Figma), `design-broadcast` (Slack + Notion), `design-system-qa` (5 testing layers).
- `docs/MCP-INTEGRATION.md`, `docs/FIGMA-INTEGRATION.md`.

## v1.7.0 — Coverage push + automation

### Added
- 8 component specs (Alert, Tooltip, Form-controls, Skeleton, Progress, Avatar, Breadcrumb, Accordion).
- Audit tools: `frontmatter-check.py`, `link-check.py`, `korean-copy-check.py`, `check-coverage.py`.
- HTML preview generator (`tools/preview/render-tokens.py`).
- CI: GitHub Actions workflow for audits.

## v1.0.0 — Initial release

Foundation: AGENTS.md / CLAUDE.md / README.md / refs / knowledge / skills / commands / agents structure. Design tokens (W3C DTCG format), color (OKLCH-aware), typography, spacing, components (Ant Design + MUI + shadcn-ui canonical synthesis), accessibility (WCAG 2.1 AA), Korean i18n (Hangul typography, payments / 본인인증, app store conventions, fintech UX patterns). 11 worked component specs. 6 skills. Initial commands.
