# Roadmap

## Phase 1 — Foundation ✓ shipped (v1.0)

Three commits. See `git log --oneline`.

- [x] Project skeleton, entry docs (`README`, `AGENTS.md`, `CLAUDE.md`)
- [x] Sparse-cloned upstream sources into `refs/`
- [x] Architecture, contributing, using, Figma-integration, token-sync docs
- [x] 7 idempotent extractors (`tools/extractors/`)
- [x] 24 knowledge files / 10K+ lines (a11y, colors, components, design-tokens, i18n, icons, layout, motion, patterns, typography)
- [x] 6 skills with playbooks: design-system-builder, component-spec-writer, color-palette, ux-audit, design-critique, handoff-spec
- [x] 4 agent personas: design-critic, a11y-reviewer, token-extractor, component-architect
- [x] 4 slash commands: design-review, palette-from-brand, component-spec, extract-tokens
- [x] 6 worked examples: violet SaaS palette, Button, Input, Modal, Toast, Card
- [x] Dogfood validation: Korean fintech app design system bootstrap end-to-end
- [x] Self-critique published as [`docs/DOGFOOD-FINDINGS.md`](DOGFOOD-FINDINGS.md)

## Phase 2 — Depth ✓ shipped (v1.1)

Driven by the dogfood findings. Wrapped in 4 commits (Batch A–D).

### Knowledge gaps filled

- [x] `knowledge/patterns/money-and-amount.md` — currency display, amount input ergonomics, ± color semantics (separate axis from primary/error), Korean stock convention (red=up), tabular numerals, edge cases.
- [x] `knowledge/patterns/mobile-navigation.md` — bottom tab bar, top app bar, drawer (when NOT), stack, back navigation contract, search patterns, sheets.
- [x] `knowledge/patterns/list-and-feed.md` — list anatomy, settings/chat/transaction/search patterns, pull-to-refresh, infinite scroll vs Load More, empty/loading/error states, swipe actions, virtualization.
- [x] `knowledge/platforms/react-native.md` — web↔RN gap matrix, token translation, Pressable, touch targets/hitSlop, safe area, keyboard handling, animations (Reanimated), Pretendard loading, navigation, common pitfalls.
- [x] `knowledge/i18n/korean-payments.md` — vendor landscape, decision tree by product type, payment selector ordering, subscription disclosure, 청약철회, 본인인증, ESCROW, cost structure.

### More component specs (examples/)

- [x] Form (composition pattern with Zod + react-hook-form)
- [x] Table / DataTable (TanStack engine, mobile→card-list)
- [x] Tabs (underline / segmented / card / bottom-bar in one spec)
- [x] DatePicker (single / range / dateTime / quickRange, Korean formats)
- [x] Select / Combobox (single/multi/searchable/creatable/async)
- [x] Pagination (numbered / Load More / simple, URL sync)

### Skill upgrades

- [x] `color-palette` PLAYBOOK — added "mood → hue mapping" section + differentiation check + Korean considerations + verification phase.
- [x] `design-system-builder` PLAYBOOK — added "starter component set by category" with extension matrix for 8 product categories + verification phase.
- [x] `component-spec-writer` PLAYBOOK — added verification phase (cite ≥ 2 references, all states, ARIA, keyboard, RN/IME conditional).
- [x] `ux-audit` PLAYBOOK — verification phase (user goal stated, every issue cited, CRITICAL has WCAG section).
- [x] `design-critique` PLAYBOOK — verification phase (problem-fit first, hierarchy walk, single recommendation).
- [x] `handoff-spec` PLAYBOOK — verification phase (every screen, every component referenced or sub-spec'd).

### Tooling

- [x] `tools/audit/check-coverage.py` — coverage report. Outputs to `knowledge/COVERAGE.md` + console summary.
- [ ] CI lint that fails PRs introducing raw hex in `examples/` (must be a token alias). _(Phase 3)_

## Phase 23 — Multi-agent integration + Homebrew (v3.4) ✓ shipped

Concrete proof that design-ai's "model-agnostic" tagline is real. Until now, the corpus had been heavily exercised through Claude Code; this phase adds worked walkthroughs for Codex CLI / Cursor / Aider / SDK and a Homebrew formula for broader install reach.

### Added
- **4 integration walkthroughs** in `docs/integrations/`:
  - `codex-walkthrough.md` — 4 sessions (component spec, design system, iterate critique, Figma audit) + Codex-specific tips (paths, MCP config, AGENTS.md fragments).
  - `cursor-walkthrough.md` — 5 sessions (inline spec, audit existing, Figma critique, token gen, `Cmd+K` inline) + Composer mode + MCP config.
  - `aider-walkthrough.md` — 4 sessions (impl, refactor, design-system bootstrap, audit-then-fix) + Aider patterns (architect mode, auto-test, bash aliases).
  - `sdk-walkthrough.md` — Anthropic + OpenAI SDK adoption with prompt caching, tool use, streaming. Production chatbot example.
- **`Formula/design-ai.rb`** — Homebrew formula:
  - Installs corpus to `libexec`.
  - Wraps `install.sh` as `design-ai-install` binary.
  - Symlinks the npm CLI as `design-ai` if Node is present.
  - Includes a `test do` block validating plugin manifest + skill counts.
- **`Formula/README.md`** — maintainer release runbook (tag, release, get sha256, update formula, test, push).
- **`tools/audit/integration-check.py`** — verifies each walkthrough has required sections (Prerequisites / Setup / ≥3 Walkthroughs / Next). Catches structural drift over time.
- **`.github/workflows/audit.yml`** — wired the new audit into CI. 5 audits now run on every PR.

### Changed
- **`docs/CODEX-INTEGRATION.md`** + **`CURSOR-INTEGRATION.md`** + **`AIDER-INTEGRATION.md`** — top-of-file callouts linking to the corresponding walkthrough.
- **`README.md`** — Option B: Homebrew install path added; agent table links to per-agent walkthroughs.
- **`mkdocs.yml`** — Integrations nav restructured per agent (Setup + Walkthrough sub-entries); SDK + Distribution promoted to top-level entries.

### Verified
- All 5 audits pass (frontmatter / link / Korean / coverage / integration-check).
- Integration audit confirms all 4 walkthroughs have the required structure.
- CLI smoke tests still pass.
- mkdocs build with new nav succeeds.

### Versions
- CLI: 3.3.0 → 3.4.0
- Plugin / corpus: 3.3.0 → 3.4.0

### What this enables
- **Model-agnostic adoption** — adopters can choose Codex / Cursor / Aider / SDK without reverse-engineering setup. Each walkthrough is self-contained.
- **Homebrew install** — `brew install design-ai` lowers friction for Mac users (especially designers who aren't comfortable with npm or git clones).
- **Production SDK adoption** — concrete patterns (prompt caching, streaming, tool use, chatbot example) lower the barrier for embedding design-ai into products.
- **CI safeguards** — integration walkthroughs can't silently rot; audit catches missing sections.

### What's still ahead (v3.5+)
- Versioned knowledge files (`version:` in frontmatter for fine-grained pinning).
- Coverage push 30% → 40%+ (next batch of canonical specs).
- VS Code extension wrapper.
- Component spec extractor (scaffold from upstream diff).
- Semantic search index for the doc site (algolia / typesense).
- Internationalization of the doc site (English primary; Korean translation of key pages).

## Phase 22 — Component coverage push (v3.3) ✓ shipped

Component spec coverage from 23.6% → **30.7%** (47 → 61 of 199 canonical components).

### Added (15 specs total)

13 net new + 2 renames (to align filenames with canonical names from `knowledge/components/index.json`).

**Overlay primitives** (5):
- `component-badge.md` — Standalone label + Indicator dual modes (Ant + MUI + shadcn synthesis).
- `component-dropdown.md` — Dropdown / DropdownMenu; WAI-ARIA Menu pattern, sub-menus, checkbox / radio items, shortcuts. (Renamed from `component-dropdown-menu.md`.)
- `component-context-menu.md` — Right-click / long-press triggered; same Menu pattern as Dropdown.
- `component-hover-card.md` — Hover-triggered floating preview; profile previews, link previews.
- `component-sheet.md` — Side-anchored modal panel; mobile-first detents (peek vs full).
- `component-command.md` — Command / CommandPalette (cmdk-based); Cmd+K pattern, fuzzy match, async results, multi-page navigation. (Renamed from `component-command-palette.md`.)

**Navigation / layout** (3):
- `component-sidebar.md` — Persistent collapsible navigation (the shadcn flagship); icon-only mode, mobile offcanvas.
- `component-navigation-menu.md` — Top horizontal nav with mega-menu panels; marketing site / SaaS header.
- `component-menubar.md` — Desktop File / Edit / View pattern; hover-roving between menus, keyboard nav.

**Utilities** (7):
- `component-aspect-ratio.md` — Lock child to specific aspect ratio.
- `component-collapsible.md` — Single expandable section primitive.
- `component-toggle.md` — Toggle + ToggleGroup pressable buttons (single + multiple).
- `component-scroll-area.md` — Custom-styled scrollbar; visibility modes.
- `component-banner.md` — Persistent in-page strip (system status, trial, cookie consent); distinct from Alert + Toast.
- `component-kbd.md` — Keyboard shortcut display; platform-aware Mac/Win symbols.
- `component-separator.md` — Horizontal / vertical divider; decorative vs semantic.

### Renamed
- `component-dropdown-menu.md` → `component-dropdown.md` (matches canonical `dropdown` from Ant)
- `component-command-palette.md` → `component-command.md` (matches canonical `command` from shadcn)

### Cross-references updated
All in-corpus links updated via `sed`. `link-check.py` confirms no broken references.

### Coverage
- Examples: 99 → 113 (+14)
- Component coverage: 47 → **61** (23.6% → **30.7%**)
- Versions bumped: CLI 3.1.0 → 3.3.0, Plugin 3.1.0 → 3.3.0

### Verified
- All 4 audits pass (frontmatter / link / Korean / coverage).
- mkdocs build still succeeds.
- npm pack tarball clean.

### What this enables
- **Stronger component-spec-writer output** — more canonical patterns matched, better synthesis quality.
- **Closer parity with shadcn-ui** — most flagship primitives (sidebar, command, sheet, dropdown-menu) now have specs.
- **30%+ canonical coverage milestone** — the corpus now covers 30% of the canonical Ant + MUI + shadcn surface.

### What's still ahead (v3.4+)
- Versioned knowledge files (`version:` in frontmatter for fine-grained pinning).
- Cross-tool integration tests (Codex CLI / Cursor / Aider sessions captured as worked examples).
- Coverage push from 30% → 40%+ (more canonical specs).
- Homebrew formula.
- VS Code extension wrapper.
- Component spec extractor (scaffold a spec from upstream source diff).

## Phase 21 — Public doc site (v3.2) ✓ shipped

mkdocs-material site auto-deploying to GitHub Pages. Discoverability + search for prospective adopters before they install.

### Added
- **`mkdocs.yml`** — site config:
  - Material theme, indigo / violet brand palette (light + dark schemes via `prefers-color-scheme`).
  - Pretendard variable font for Korean, Inter for Latin, JetBrains Mono for code.
  - Full nav tree covering Knowledge / Skills / Commands / Agents / Examples / Integrations / Reference.
  - 17 markdown extensions enabled (admonition, tabs, tasklist, mermaid, etc).
- **`tools/build-docs.sh`** — populates `site-src/` with a symlink farm (mkdocs requires docs_dir to be a sibling/descendant of config, not parent). Idempotent. Index symlink: `site-src/index.md → ../README.md`.
- **`docs/site-overrides/`** — theme customizations:
  - `extra.css` — Pretendard variable font from jsDelivr CDN, brand color tweaks, Korean reading optimizations (`word-break: keep-all`, `font-feature-settings: "kern"`).
  - `main.html` — announcement bar pushing the npx install command + OpenGraph / Twitter Card metadata.
  - `logo.svg`, `favicon.svg` — gradient indigo/violet "D" mark.
- **`docs/requirements.txt`** — pinned mkdocs-material `>=9.7.0` (older 9.5.x had a pygments/pymdown-extensions interaction bug that caused build to crash on `highlight.pygments_lang_class: true`).
- **`.github/workflows/docs.yml`** — auto-deploy to GitHub Pages:
  - Triggers on push to main (paths-filtered to docs-relevant changes only) + manual dispatch.
  - Uses `actions/configure-pages@v4`, `actions/upload-pages-artifact@v3`, `actions/deploy-pages@v4`.
  - Concurrency-grouped under `pages` with `cancel-in-progress: false`.
  - Runs `./tools/build-docs.sh` then `mkdocs build --clean` (deliberately not `--strict` — informational cross-reference warnings aren't blocking; actual broken links are caught by the existing `link-check.py` audit on every PR).

### Changed
- **`README.md`** — added doc-site badge linking to the live site.
- **`tools/audit/link-check.py`** + **`korean-copy-check.py`** — now skip `site-src/`, `site/`, `node_modules/` walk paths so audits don't double-count symlinked content.
- **`.gitignore`** — excludes `site/`, `site-src/` build artifacts.

### Local preview
```bash
pip install -r docs/requirements.txt
./tools/build-docs.sh
mkdocs serve
# → http://127.0.0.1:8000
```

### Verified
- All 4 audits still pass (frontmatter / link / Korean copy / coverage).
- `mkdocs build --clean` succeeds in 8 seconds.
- 333 HTML files generated, 35MB total (includes search index + asset duplication).
- Theme overrides loaded (Pretendard, indigo brand colors, custom logo).

### What this enables
- **Discoverability** — prospective adopters can browse the corpus on the public site before deciding to install.
- **Search** — built-in mkdocs-material search across all 91 knowledge files + 99 examples + skill playbooks. Korean + English search both supported.
- **Korean readability** — Pretendard font + word-break rules render Hangul correctly across all pages.
- **Lower-friction evaluation** — open-source evaluators can read full skill / pattern docs without cloning.
- **SEO** — structured site improves Google indexing for design-ai content.

### What's still ahead (v3.3+)
- Versioned knowledge files (`version:` in frontmatter for fine-grained pinning).
- Cross-tool integration tests (Codex CLI / Cursor / Aider sessions captured as worked examples).
- Component coverage push 23.6% → 30%+.
- Homebrew formula.
- VS Code extension wrapper.
- Search analytics (which knowledge files are most-read).
- Versioned doc site (mkdocs `mike` plugin) for snapshotting v3.x docs.

## Phase 20 — Distribution (v3.1) ✓ shipped — productization phase

NPM CLI distribution. Adopters now go from zero to installed in one command (`npx @design-ai/cli install`) without cloning the repo.

### Added
- **`package.json`** — npm package `@design-ai/cli`, bin `design-ai`, ESM, Node ≥18.
- **`cli/`** — Node.js CLI:
  - `cli/bin/design-ai.mjs` — entry point.
  - `cli/lib/dispatch.mjs` — command router with aliases (`i` / `u` / `s` / `ls` / `v`).
  - `cli/lib/paths.mjs` — path resolution (npm package vs git clone, env overrides).
  - `cli/lib/log.mjs` — colorized terminal output (NO_COLOR-aware).
  - `cli/lib/exec.mjs` — shell exec helpers.
  - 7 commands: `install`, `update`, `uninstall`, `status`, `list`, `version`, `help`.
  - `install` / `uninstall` delegate to the existing `install.sh` (single source of truth).
  - `list` reads from `.claude-plugin/plugin.json` to show full catalog.
- **`.npmignore`** — safety net for what stays out of the npm tarball; primary control via `package.json` `files` allowlist.
- **`.github/workflows/publish.yml`** — auto-publish on `v*` tag. Verifies tag matches `package.json`, plugin.json matches package.json, runs all 4 audits, runs `npm pack --dry-run`, publishes with `--provenance`.
- **`docs/DISTRIBUTION.md`** — three install paths (npm / git clone / manual symlinks), CLI command reference, env override reference, versioning rules, publishing checklist, troubleshooting.

### Changed
- **`.claude-plugin/plugin.json`** version: 3.0.0 → 3.1.0 (aligned with CLI).
- **`README.md`** — lead with `npx @design-ai/cli install` as primary install path; git clone retained as Option B for contributors.
- **`docs/ROADMAP.md`** updated with this section.

### Coverage (no corpus change in this phase)
- Knowledge: 91 (no change)
- Examples: 99 (no change)
- Skills: 19 (no change)
- Commands: 15 (no change) — different from CLI commands; refers to slash commands
- New: NPM CLI with 7 commands, publish workflow, DISTRIBUTION docs

### What this enables
- **One-command install** — `npx @design-ai/cli install` works on any Node ≥ 18 machine.
- **Update path** — `design-ai update` pulls + reinstalls without manual git work.
- **Catalog browsing** — `design-ai list skills` shows what's available before deciding to install.
- **Cross-machine consistency** — npm-published version is the canonical reference; git clone tracks `main` for contributors.
- **Provenance attestation** — npm `--provenance` flag verifies builds came from this GitHub repo.

### What's still ahead (v3.x and beyond)
- Public doc site (mkdocs-material on GitHub Pages) for browsing knowledge without install.
- Versioned knowledge files (`version:` in frontmatter for fine-grained pinning).
- Cross-tool integration tests (Codex CLI / Cursor / Aider sessions captured as worked examples).
- Component coverage push 23.6% → 30%+.
- Homebrew formula.
- VS Code extension wrapper.

## Phase 19 — Stabilization (v3.0) ✓ shipped — productization phase

The v2 expansion proved the corpus works across 7 new design domains. Phase 19 is the stabilization step the user requested: "안정화 후 시장성, 대중성이 있으면 프로그램화 진행" — stabilize first, productize next.

### Added
- **`.claude-plugin/plugin.json`** — Claude Code plugin manifest. All 19 skills, 15 commands, 4 agents declared with names + paths + descriptions; supports plugin discovery and future `/plugin install` flow.
- **`install.sh`** — automated installer:
  - Symlinks `skills/`, `agents/`, `commands/` into `~/.claude/` with `design-` prefix.
  - Idempotent (safe to re-run).
  - Subcommands: `install` (default), `--uninstall`, `--status`, `--help`.
  - Configurable: `DESIGN_AI_PREFIX`, `CLAUDE_HOME` env overrides.
- **`CHANGELOG.md`** — full release history, v1.0 through v3.0, semver-compliant.
- **`README.md` overhaul** — coverage-at-a-glance table reflecting v2 expansion (motion / illustration / print / video / game UI / conversational / spatial); install instructions; first-task tour; Korean market focus section.
- **`docs/QUICKSTART.md`** — 5-minute getting-started for new adopters.
- **CI: Korean copy check** added to `audit.yml` (was missing despite the script existing).
- **CI: size budget** updated from 50K-line warning (long since exceeded) to 100K warn / 150K hard-cap.

### Changed
- Knowledge size now ~57K lines; budget recalibrated.
- `docs/ROADMAP.md` updated with v3.0 entry (this section).

### Coverage
- Knowledge: 91 (no change in this phase)
- Examples: 99 (no change)
- Skills: 19 (no change)
- Commands: 15 (no change)
- New: plugin manifest, install script, CHANGELOG, QUICKSTART
- CI checks: 4 → 5 (added korean-copy-check)

### What this enables
- **Adopters can install design-ai globally** with `./install.sh` instead of the manual symlink loop documented in `PLUGIN-PACKAGING.md`.
- **CHANGELOG.md** is the canonical reference for "what changed when" — adopters can pin to a version.
- **README** stops being a launch-day artifact and becomes a maintained adoption surface.
- **CI parity** — all 4 audits (frontmatter / link / Korean copy / coverage) run on every PR; no skipped checks.

### What's still ahead (v3.x and beyond)
- Versioned knowledge files (`version:` in frontmatter; `version` field optional today).
- Public doc site (mkdocs / docusaurus). Knowledge already markdown-friendly.
- NPM package distribution (`npx design-ai install`).
- Cross-tool integration tests (real sessions in Codex CLI / Cursor / Aider captured as worked examples).
- Component coverage push to 30%+ (currently 23.6%).

## Phase 18 — AR / VR / spatial design (v2.7) ✓ shipped — completes v2 expansion

Final phase of the v2 expansion. Adds spatial computing as a first-class design surface alongside motion / illustration / print / video / game UI / conversational. Covers fundamentals (Milgram continuum, FOV, comfort zones, units, vergence-accommodation), VR patterns (Quest / PSVR2 / Vision Pro immersive / locomotion), AR patterns (ARKit / ARCore / HoloLens / world + image + object anchors), spatial UI elements (panels, billboards, controls, menus), and comfort + accessibility (motion sickness mitigations, vision / hearing / motor / cognitive / photosensitive / mobility).

- [x] **5 spatial knowledge files**:
  - `spatial/spatial-design-fundamentals.md` — Milgram continuum, spatial units, visual angle, FOV, comfort zones (vertical + horizontal), stereoscopic depth, vergence-accommodation conflict, locomotion overview, comfort vignette, spatial audio, hand vs controller vs gaze, anchoring, resolution + PPD, performance budget, platforms, Korean market context.
  - `spatial/vr-patterns.md` — VR experience categories, three core principles (presence / comfort / use-the-body), HUD anti-patterns + diegetic alternatives, locomotion in detail (teleport / smooth / snap turn / room-scale / hybrid), spatial UI placement, hands + avatars, multiplayer / social, reading text in VR, cinema in VR, performance.
  - `spatial/ar-patterns.md` — three AR contexts (mobile handheld / glasses / world-anchored), visibility against real backgrounds, spatial mapping, anchoring strategies (world / image / body / screen), onboarding, common interactions, permission + privacy, tracking failure handling, Korean AR market.
  - `spatial/spatial-ui-elements.md` — panels (the core), billboarding, buttons (push / tap), sliders, menus (wrist / floating / radial / pie), input affordances (pointer / hand cursor / gaze / voice), notifications, lists, forms, Korean text in spatial, dialogs, loading / progress, icons.
  - `spatial/comfort-and-accessibility.md` — motion sickness triggers + mitigations, comfort settings menu, vision / hearing / motor / cognitive / photosensitive accessibility, eye strain, physical safety, wheelchair / mobility, Korean accessibility, hygiene for shared headsets, session length guidance.
- [x] **2 component specs**:
  - `component-spatial-panel.md` — floating 2D-in-3D panel; anchoring (world / wrist / hand / head), visual angle vs absolute sizing, billboarding, hand + gaze + ray-cast + direct-touch input handling, comfort positioning, occlusion.
  - `component-spatial-locomotion.md` — VR locomotion controller; teleport (with arc + landing indicator + fade), smooth (with vignette), snap-turn (with fade), room-scale, hybrid; comfort settings menu; one-handed + voice alt; comfort defaults for new users.
- [x] **`skills/spatial-designer/`** — pick mode (VR / AR / MR / WebXR) + platform; spec geometry, anchoring, locomotion, input, UI elements, comfort, accessibility, onboarding.
- [x] **`/spatial`** slash command.
- [x] AGENTS.md / skills/README / commands/README / examples/README / ROADMAP updated.

Coverage:
- Knowledge: 86 → 91 (+5 spatial).
- Examples: 97 → 99 (+2 spatial components).
- Skills: 18 → 19 (+ spatial-designer).
- Commands: 14 → 15 (+ /spatial).

### v2 expansion summary (Phases 12 → 18)

Phases 12-18 added 7 new design domains:

| Phase | Domain | Knowledge | Examples | Skill | Command |
|---|---|---|---|---|---|
| 12 | Motion design depth | 5 | 4 | motion-designer | /motion-design |
| 13 | Illustration systems | 5 | 2 | illustration-designer | /illustration |
| 14 | Print / physical design | 6 | 2 | print-designer | /print |
| 15 | Video content | 5 | 2 | video-designer | /video |
| 16 | Game UI | 5 | 2 | game-ui-designer | /game-ui |
| 17 | Voice / conversational | 5 | 2 | conversational-ui-designer | /conversational |
| 18 | Spatial / AR / VR | 5 | 2 | spatial-designer | /spatial |
| | **Total v2.1-v2.7** | **+36** | **+16** | **+7** | **+7** |

Full repo: knowledge 55→91, examples 83→99, skills 12→19, commands 8→15. Korean market focus across all phases. All audits pass throughout. Ready for v3 stabilization / productization phase.

## Phase 17 — Voice / conversational UI (v2.6) ✓ shipped

Conversational UI as a first-class design surface. Covers fundamentals (turn-taking, intents, modalities, latency, hallucinations), voice UI patterns, traditional chatbot design, AI chat (LLM-based) interfaces, and Korean conventions (Bixby, Clova, NUGU, KakaoTalk channel, 해요체 / 합쇼체).

- [x] **5 conversational knowledge files**:
  - `conversational/conversational-ui-fundamentals.md` — modalities, turn-taking, intents + slots, conversational design principles, streaming, latency budgets, personality, STT/TTS, code-switching.
  - `conversational/voice-ui-patterns.md` — wake word / tap-to-talk / multi-turn / voice search; smart speaker UX, phone assistant UX, in-car, IVR; Korean assistants; SSML; accessibility.
  - `conversational/chatbot-design.md` — rule-based / intent-based / hybrid; anatomy, conversation patterns (greeting, quick replies, forms, lists, cards, confirmation); KakaoTalk channel; human handoff.
  - `conversational/ai-chat-interfaces.md` — LLM chat: streaming, markdown / code rendering, stop / regenerate / continue, context length, hallucination handling, voice mode, memory, keyboard shortcuts.
  - `conversational/korean-voice-conventions.md` — KR voice assistants (Bixby / Clova / NUGU / GiGA Genie / Kakao i), 합쇼체 / 해요체 selection, code-switching, TTS / STT options, KR regulatory (개인정보보호법, 정보통신망법, 자본시장법), KakaoTalk channel.
- [x] **2 component specs**:
  - `component-chat-interface.md` — generic chat UI for chatbot / AI / live agent; markdown / code rendering, streaming, suggested chips, attachments, Korean IME handling.
  - `component-voice-input.md` — push-to-talk + transcript voice input; Web Speech / Clova / Whisper backends, listening visualization, permission handling, accessibility alt.
- [x] **`skills/conversational-ui-designer/`** — pick type, modality, persona, intents, flows, error recovery, KR compliance, accessibility.
- [x] **`/conversational`** slash command.
- [x] AGENTS.md / skills/README / commands/README / examples/README / ROADMAP updated.

Coverage:
- Knowledge: 81 → 86 (+5 conversational).
- Examples: 95 → 97 (+2 conversational components).
- Skills: 17 → 18 (+ conversational-ui-designer).
- Commands: 13 → 14 (+ /conversational).

## Phase 16 — Game UI (v2.5) ✓ shipped

Game UI as a first-class design surface. Covers fundamentals (diegetic / spatial taxonomy, genre conventions, platform variations), HUD design, menu systems, Korean gaming conventions (PC bang, 확률 표시, mobile gacha, MMO), and game accessibility.

- [x] **5 game UI knowledge files**:
  - `game-ui/game-ui-fundamentals.md` — Russell taxonomy (diegetic / non-diegetic / spatial / non-spatial), genre conventions (FPS / RPG / MMO / gacha / casual / strategy), platform variations (PC / console / mobile / VR), input methods, button prompts.
  - `game-ui/hud-design.md` — health bars, ammo / resources, crosshair, mini-map, damage numbers, cooldowns, buffs / debuffs, quest markers, notifications, subtitles, customization.
  - `game-ui/menu-systems.md` — main menu, pause, inventory (grid / list / Tetris / stacked), settings, store, gacha (확률 표시), quest log, character / stats, navigation patterns, transitions.
  - `game-ui/korean-gaming-conventions.md` — KR market context (NEXON / NCSoft / Krafton / Smilegate), 게임산업진흥에관한법률, 확률 표시 mandatory, 본인인증 / PASS / NICE, GRAC ratings, PC bang culture, auto-battle, daily login, VIP / 출석, gacha pity / 천장.
  - `game-ui/game-accessibility.md` — four axes (vision / hearing / motor / cognitive), universal options menu standard, subtitles + closed captions, color-blind modes (protanopia / deuteranopia / tritanopia), motor (remap / toggle hold / auto-aim), cognitive (HUD options / hints / save anywhere), motion sickness reduction.
- [x] **2 component specs**:
  - `component-game-hud.md` — composable HUD shell with anchored slots, customization, color-blind / contrast modes, UI scale, cross-platform input.
  - `component-game-menu.md` — composable menu shell with focus management, controller / d-pad nav, platform-specific button-prompt swapping, modal stacking.
- [x] **`skills/game-ui-designer/`** — pick genre, platform, layout, input handling, accessibility, KR compliance.
- [x] **`/game-ui`** slash command.
- [x] AGENTS.md / skills/README / commands/README / examples/README / ROADMAP updated.

Coverage:
- Knowledge: 76 → 81 (+5 game-ui).
- Examples: 93 → 95 (+2 game-ui components).
- Skills: 16 → 17 (+ game-ui-designer).
- Commands: 12 → 13 (+ /game-ui).

## Phase 15 — Video content (v2.4) ✓ shipped

Add video as a first-class design surface alongside motion / illustration / print. Covers fundamentals (codecs, resolution, captions, accessibility), marketing video, social/short-form (Reels / Shorts / TikTok), in-product video (onboarding / help), and Korean conventions (자막, 표시광고법, KFDA, 방송통신심의위원회). Two component specs for HTML5 video.

- [x] **5 video knowledge files**:
  - `video/video-fundamentals.md` — codecs (H.264/H.265/AV1), resolution, framerate, bitrate, audio loudness (-14 LUFS), captions (WebVTT), color space, file size estimation, accessibility.
  - `video/marketing-video.md` — hero loop / brand film / product demo; production budget tiers; Korean conventions (Toss / Kakao / Naver style).
  - `video/social-and-short-form.md` — Reels / Shorts / TikTok / vertical; hook in 1 second; safe areas; subtitle styling; algorithm signals.
  - `video/in-product-video.md` — onboarding / help / changelog; screen recording vs filmed; player UX; localization; reduced-motion fallback.
  - `video/korean-video-conventions.md` — KR platforms (YouTube / Naver TV / KakaoTV / SOOP), 자막 style conventions, voiceover (해요체 / 합쇼체), 표시광고법 ad disclosure, KFDA / KFTC compliance.
- [x] **2 component specs**:
  - `component-video-player.md` — accessible HTML5 player with multi-lang captions, speed control, transcript link, reduced-motion.
  - `component-video-hero.md` — autoplay loop with poster fallback, art-direction (mobile vs desktop video), slow-connection / reduced-motion skip, WCAG-compliant pause control.
- [x] **`skills/video-designer/`** — pick surface category, technical spec, length, captions, voiceover, music, KR compliance, file delivery.
- [x] **`/video`** slash command.
- [x] AGENTS.md / skills/README / commands/README / examples/README / ROADMAP updated.

Coverage:
- Knowledge: 71 → 76 (+5 video).
- Examples: 91 → 93 (+2 video components).
- Skills: 15 → 16 (+ video-designer).
- Commands: 11 → 12 (+ /video).

## Phase 14 — Print / physical design (v2.3) ✓ shipped

Expand beyond screen design into print + physical: business cards, stationery, brochures, posters, packaging. Korean print conventions (KFDA / KATS regulatory, 명함 size, 분리배출 표시, Pretendard typography for print) baked in. Includes 2 worked print specs.

- [x] **6 print knowledge files**:
  - `print/print-fundamentals.md` — CMYK vs RGB vs spot, DPI, bleed/trim/safe area, paper weight + finish, file formats, ICC.
  - `print/stationery.md` — business cards (KR 90×50 vs international 85×55), bilingual KR+EN, letterhead, envelopes.
  - `print/brochures-and-flyers.md` — flyer / bi-fold / tri-fold / Z-fold / booklet / saddle-stitched; reading order, gutter, imposition.
  - `print/signage-and-posters.md` — large-format; reading distance × size formula, materials, OOH compliance.
  - `print/packaging.md` — folding cartons, labels, mailers; dielines; sustainability.
  - `print/korean-print-conventions.md` — KR sizes, KFDA / KATS regulatory, 분리배출 표시, print districts, MOQ, lead times, costs.
- [x] **2 worked print specs**:
  - `print-business-card-spec.md` — Korean fintech 명함 (premium tier): 90×50, 350gsm uncoated, soft-touch + spot UV, Pretendard, Pantone + CMYK.
  - `print-packaging-spec.md` — Korean cosmetics folding carton: dieline, KFDA regulatory content, FSC + soy ink, press proof.
- [x] **`skills/print-designer/`** — pick piece type, spec dimensions / paper / color / finish / regulatory / file delivery.
- [x] **`/print`** slash command.
- [x] AGENTS.md / skills/README / commands/README / examples/README / ROADMAP updated.

Coverage:
- Knowledge: 65 → 71 (+6 print).
- Examples: 89 → 91 (+2 print specs).
- Skills: 14 → 15 (+ print-designer).
- Commands: 10 → 11 (+ /print).

## Phase 13 — Illustration systems (v2.2) ✓ shipped

Lift illustration from an unwritten gap into a full subsystem: knowledge per type, component specs, dedicated skill, slash command. Covers spot illustrations, hero illustrations, mascots (Korean fintech relevance), and SVG production. Korean-market conventions baked in.

- [x] **5 illustration knowledge files**:
  - `illustration/illustration-systems.md` — style, voice, system design (geometric vs organic, line weight, color treatment, perspective).
  - `illustration/spot-illustrations.md` — empty / success / error / onboarding / permissions; composition + sizing + voice.
  - `illustration/hero-illustrations.md` — marketing-led; conceptual / product-in-context / character-driven archetypes.
  - `illustration/mascot-design.md` — Kakao / Toss / Naver mascot conventions, design process, governance.
  - `illustration/svg-optimization.md` — SVGO, currentColor, accessibility, file size targets.
- [x] **2 component specs**:
  - `component-empty-state.md` — illustration + headline + description + CTA stack with registry + voice rules.
  - `component-illustration.md` — themeable SVG / Lottie display backed by typesafe illustration registry.
- [x] **`skills/illustration-designer/`** — pick scope, style, voice, color, format; spec assets; SVGO checklist.
- [x] **`/illustration`** slash command.
- [x] AGENTS.md / skills/README / commands/README / examples/README / ROADMAP updated.

Coverage:
- Knowledge: 60 → 65 (+5 illustration).
- Examples: 87 → 89 (+2 illustration components).
- Skills: 13 → 14 (+ illustration-designer).
- Commands: 9 → 10 (+ /illustration).

## Phase 12 — Motion design depth (v2.1) ✓ shipped

Lift motion from a single principles file into a full subsystem: knowledge per category, component specs, a dedicated skill, and a slash command. Covers marketing, app loading, micro-interactions, and multi-element choreography. Reduced-motion-safe by default.

- [x] **5 motion knowledge files**:
  - `motion/marketing-motion.md` — hero entrance, scroll-triggered, parallax, choreographed sequences, hover/cursor, loop animations; KR conventions.
  - `motion/app-loading-sequences.md` — cold launch / warm launch / route changes, splash strategy, View Transitions API, FLIP, progressive content loading.
  - `motion/micro-interactions.md` — 5 categories (press, state change, hover, focus, loading), 4 laws (be fast / functional / match input / no stagger redundancy).
  - `motion/choreography-depth.md` — 5 patterns (cascade, FLIP, View Transitions, choreographed sequences, reactive choreography), stagger formulas, exit choreography, timing diagrams.
  - `motion/motion-tools.md` — CSS / Framer Motion / GSAP / Lottie / Rive / react-spring decision tree + comparison matrix.
- [x] **4 motion component specs**:
  - `component-loading-sequence.md` — splash + biometric gate + first-screen reveal coordination.
  - `component-page-transition.md` — route-level wrapper (fade / slide / hero variants) using Framer Motion or View Transitions API.
  - `component-lottie-player.md` — designer-led After Effects animation embed with lazy-load, offscreen pause, poster fallback.
  - `component-scroll-reveal.md` — viewport-triggered animation primitive (fade-up / fade-in-blur / scale-in) with stagger.
- [x] **`skills/motion-designer/`** — pick category, duration tier, easing, tool; choreograph; verify reduced motion + performance budget.
- [x] **`/motion-design`** slash command.
- [x] AGENTS.md / skills/README / commands/README / examples/README / ROADMAP updated.

Coverage:
- Knowledge: 55 → 60 (+5 motion).
- Examples: 83 → 87 (+4 motion components).
- Skills: 12 → 13 (+ motion-designer).
- Commands: 8 → 9 (+ /motion-design).

## Phase 11 — Completion (v2.0) ✓ shipped

Final completion of v2.0 scope. Adds the worked examples that prove the documentation skills work end-to-end, plus a focused component coverage push, plus 3 universal pattern knowledge files.

- [x] **6 doc/deck/report/email worked examples**:
  - `doc-tutorial-example.md` (Diátaxis tutorial)
  - `doc-how-to-example.md` (how-to with Korean localization)
  - `doc-explanation-example.md` (W3C DTCG choice rationale)
  - `slide-deck-example.md` (17-slide Korean conference talk)
  - `report-example.md` (UX audit with severity-aggregated findings)
  - `email-transactional-example.md` (Korean fintech receipt email)
- [x] **7 component specs**:
  - `component-descriptions.md` (key-value list, dl semantics)
  - `component-hero-block.md` (landing hero with 4 layouts + video variants)
  - `component-feature-grid.md` (3-up/4-up feature display)
  - `component-testimonial-carousel.md` (single-large/3-up/auto-scroll variants)
  - `component-pricing-cards.md` (2-4 tier pricing with anchoring + KR subscription disclosure)
  - `component-pass-auth.md` (Korean 본인인증 wrapper — PASS/NICE/KCB)
  - `component-otp-countdown.md` (SMS code expiration + resend cooldown)
- [x] **3 universal pattern knowledge files**:
  - `auth-flow-design.md` — signup / login / reset / 2FA / KakaoTalk / 본인인증
  - `pricing-page-design.md` — tier strategy, anchoring, billing toggle, FAQ, KR legal
  - `landing-hero-design.md` — 6 archetypes, headline formulas, video rules, A/B testing
- [x] AGENTS.md / examples/README / ROADMAP updated.

Coverage:
- Knowledge: 52 → 55 (+3 patterns).
- Examples: 70 → 83 (+13: 6 doc examples + 7 component specs).
- Component spec coverage: ~24% → ~27% (more canonical-matched + 4 new custom).
- Total lines: ~52K → ~62K.

## Phase 10 — Document design + brand + email (v1.9) ✓ shipped

Expansion beyond product UI into the full design domain.

- [x] **5 document design knowledge files**:
  - `document-typography.md` — long-form reading (body 18px+, vertical rhythm, paragraph styling).
  - `information-architecture.md` — Diátaxis 4 types, sidebar structure, naming, versioning, search.
  - `technical-writing.md` — active/imperative/second-person voice, sentence length, code samples, voice-per-doc-type.
  - `slide-deck-design.md` — talk vs pitch vs reading archetypes, message-led titles, layouts.
  - `report-design.md` — TL;DR pyramid, audit format, severity rating, research findings template.
- [x] **3 brand/medium knowledge files**:
  - `brand-identity.md` — logo / color / type / voice / imagery foundations.
  - `email-design.md` — HTML email constraints, transactional vs marketing, bulletproof button, Korean spam law.
  - `i18n/korean-app-store-visual.md` — icon design, screenshot composition, Korean storefront expectations.
- [x] **`i18n/korean-document-style.md`** — honorific level (합쇼체 vs 해요체), hierarchy (가/나/다 + numeric), spacing rules, common Korean technical-writing errors.
- [x] **4 doc component specs**:
  - `component-callout.md` — info/warning/note for docs (distinct from Alert).
  - `component-blockquote.md` — attributed quotations.
  - `component-doc-page.md` — full doc site layout (header / sidebar / TOC / footer).
  - `component-email-layout.md` — table-based responsive email scaffolding.
- [x] **2 new skills**: `document-author` (Diátaxis-aware doc writing), `slide-deck-author` (deck outlining).
- [x] **2 new commands**: `/document-from-brief`, `/slide-deck`.
- [x] **PRINCIPLES.md** extended with rules 36–41 (documentation & long-form).
- [x] AGENTS.md / examples/README / skills/README / commands/README / ROADMAP updated.

Coverage:
- Knowledge: 43 → 52 (28 hand-written + 15 generated → 37 hand-written + 15 generated).
- Skills: 10 → 12 (all with verification phase).
- Commands: 6 → 8.
- Examples: 66 → 70.
- Total lines: ~42K → ~52K.

## Phase 9 — MCP integrations (v1.8) ✓ shipped

- [x] **MCP-INTEGRATION.md** overview — supported MCPs (Tier 1: Figma/Notion/GitHub/Slack; Tier 2: Linear/Atlassian/Asana/Intercom), setup per agent, graceful fallback strategy, MCP catalog with design-ai relevance.
- [x] **5 per-MCP integration guides** in `docs/integrations/`:
  - `figma-mcp.md` — read variables/components, audit Figma designs, spec components from Figma, write tokens (limited), Code Connect via MCP.
  - `notion-mcp.md` — mirror knowledge to Notion, capture design decisions, read brand briefs, weekly status.
  - `github-mcp.md` — PR design review, issue creation for design debt, status reports, token-bump notifications.
  - `slack-mcp.md` — design review summaries, token version notifications, palette artifacts, scheduled status posts.
  - `linear-mcp.md` — convert audit findings to issues, track design system rollout, severity → priority mapping.
- [x] **3 MCP-aware skills**:
  - `skills/design-pr-review/` — reviews GitHub PRs for design compliance (uses GitHub MCP, falls back to markdown output).
  - `skills/figma-token-sync/` — bidirectional token sync Figma↔code (uses Figma MCP, falls back to Tokens Studio).
  - `skills/design-broadcast/` — post artifacts to Slack/Notion (uses Slack + Notion MCPs, falls back to formatted paste).
- [x] AGENTS.md adds "Use MCPs when available" section + skill lookup entries. Skills: 7 → 10.

## Phase 8 — Last big push (v1.7) ✓ shipped

- [x] **10 component specs**: FloatButton, QRCode, Splitter, Anchor, AppBar, Layout, InputOTP, Watermark, Code, Typography. Coverage 18.6% → ~22%.
- [x] **3 Korean fintech custom specs**: StockChart (KR-inverted convention), KRWAmount (display-only), PaymentReceipt (Korean dotted-divider receipt).
- [x] **Figma plugin scaffold** (`tools/figma-plugin/`): manifest.json, code.ts (sandbox), ui.html (paste-to-import), Code Connect examples for Button/Input/Card.
- [x] **CI workflows** (`.github/workflows/`): audit.yml (frontmatter + link + coverage validation on PR + size budget), release.yml (CHANGELOG + tarball on tag push).
- [x] **Korean copy validator** (`tools/audit/korean-copy-check.py`): heuristic scan of Korean-relevant files for English UI strings, suggests Korean equivalents.
- [x] AGENTS.md / examples/README / ROADMAP updated. Examples: 53 → 66.

## Phase 7 — Coverage push + automation tooling (v1.6) ✓ shipped

- [x] **Cursor + Aider integration guides** (docs/CURSOR-INTEGRATION.md, docs/AIDER-INTEGRATION.md): `.cursorrules` template, `@`-mention patterns, Aider `--read` configuration, per-task aliases.
- [x] **10 component specs** (Cascader, ColorPicker, Transfer, Spin, Segmented, AutoComplete, Mention, Timeline, Tour, Affix): coverage 14.6% → 19.6%.
- [x] **3 Korean fintech custom specs**: CategoryPicker (가계부 emoji-first), TransactionListItem (high-volume row), AccountCard (banking card).
- [x] **3 automation tools** (`tools/audit/`):
  - `changelog-generate.py` — generates CHANGELOG.md from git log
  - `frontmatter-check.py` — validates YAML frontmatter on knowledge files
  - `link-check.py` — validates internal markdown links resolve
- [x] AGENTS.md / examples/README / README updated. Knowledge: 43 → 43 (added 0 — all of v1.6 was examples + tooling). Examples: 40 → 53.

## Phase 6 — Token references + QA + integrations ✓ shipped (v1.5)

- [x] 3 design token reference docs:
  - `knowledge/design-tokens/tailwind-v4.md` — OKLCH defaults, full color/spacing/typography/motion
  - `knowledge/design-tokens/material-3.md` — HCT tonal palettes, container pattern, M3 type scale
  - `knowledge/design-tokens/polaris-and-carbon.md` — Shopify + IBM enterprise reference
- [x] New skill: `design-system-qa` — 5-layer test pyramid audit (TypeScript / token drift / contract / a11y / visual regression)
- [x] `knowledge/patterns/design-system-qa.md` — full QA layer model
- [x] `docs/CODEX-INTEGRATION.md` — Codex CLI deep-dive: skill invocation, slash command translation, MCP setup, token budget per task, common pitfalls
- [x] `docs/PLUGIN-PACKAGING.md` — current symlink approach + future Claude Code plugin format, distribution channels, versioning, CI for releases
- [x] AGENTS.md / skills/README / README updated. Skills: 6 → 7.
- [x] Token references: 1 → 4. Knowledge: 39 → 43.

## Phase 5 — Coverage push + data viz + Korean fintech ✓ shipped (v1.4)

- [x] 8 component specs: Tag+Badge, Tree, Statistic, Upload, Result+Empty, Carousel, Image, Calendar.
- [x] 3 Korean fintech custom specs: BiometricGate, PaymentMethodSelector, PaymentBrandButton (KakaoPay/NaverPay/Toss/Apple/Samsung).
- [x] 3 data visualization knowledge files: dashboard-composition (3 archetypes, KPI→chart→table), chart-color-encoding (sequential/diverging/categorical, colorblind, KR stock convention), realtime-data (WebSocket vs polling, optimistic UI, disconnection, throttling).
- [x] Component spec coverage: 23 → ~32 worked specs (~16% — exceeds the 20% canonical target since several specs cover multiple canonical components).
- [x] PRINCIPLES.md extended with data viz rules (31–35).
- [x] AGENTS.md / examples/README / ROADMAP updated.

## Phase 4 — Depth + agent priming ✓ shipped (v1.3)

- [x] `knowledge/PRINCIPLES.md` — agent priming cheat sheet. 30 load-bearing rules across the system, each citing its deeper file. Loaded at session start.
- [x] 5 universal pattern knowledge files: `empty-states.md`, `error-states.md`, `onboarding.md`, `search-ux.md`, `settings-page.md`.
- [x] 6 more component specs: Drawer, Slider, Popover, Divider, Steps, Rate.
- [x] 2 custom component specs (Korean fintech): `component-amount-input.md`, `component-address-input.md` — proves the system handles non-upstream patterns.
- [x] Component spec coverage: 19 → 27 worked specs (8.5% → ~13%).
- [x] AGENTS.md updated with new lookup-table entries. ROADMAP marked.

## Phase 3 — Connective ✓ shipped (v1.2)

- [x] `/design-from-brief` — full design from a one-paragraph product brief. Orchestrates color-palette + design-system-builder + handoff-spec.
- [x] `/iterate` — apply a critique and produce a revision + changelog.
- [x] HTML preview generator (`tools/preview/render-tokens.py`) — extracts tokens, renders light+dark swatches, contrast matrix, live component previews, theme toggle.
- [x] Component spec coverage push: 11 → 19 worked specs (5% → 8.5%). New: Alert, Tooltip, Form-controls (Switch/Checkbox/Radio combined), Skeleton, Progress, Avatar, Breadcrumb, Accordion.
- [ ] Optional embedding index if knowledge base exceeds 100K tokens. _(Deferred — base is currently ~13K lines / well under threshold.)_

## Phase 4 — Multi-tool

- [ ] Codex CLI: real-world session against this repo, captured as a worked example.
- [ ] Cursor `.cursorrules` overlay.
- [ ] Aider configuration.

## Phase 5 — Maturity

- [ ] Versioned knowledge files (semver headers).
- [ ] CHANGELOG that summarizes upstream-source updates affecting `refs/`.
- [ ] Public site (knowledge/ as a browsable doc site).
- [ ] Plugin packaging — install design-ai as a Claude Code plugin / VS Code extension.

## Out of scope

- Image generation. We produce specs, tokens, and code-ready artifacts. Visual mockups go through Figma / external tools.
- Brand strategy. We assume a brand has constraints and translate them into tokens/components.
- Custom font design. We pair existing fonts.
- Implementing actual product code. design-ai produces the contract; the consuming product implements.
