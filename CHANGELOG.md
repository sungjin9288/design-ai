# Changelog

User-facing release notes for design-ai. Versions follow semver.

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
