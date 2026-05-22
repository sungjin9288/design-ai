# Session log

A single-page narrative of how design-ai grew from v2.0 (foundation) to v4.13 (mature, dogfooded, 90%+ canonical coverage). Useful for adopters, contributors, and future maintainers.

For per-version detail, see [`CHANGELOG.md`](../CHANGELOG.md).
For per-phase detail, see [`docs/ROADMAP.md`](ROADMAP.md).

## At a glance

| Surface | v2.0 (start) | v3.12 | v4.13 (now) |
|---|---|---|---|
| Knowledge files | 55 | 91 | 92 |
| Worked examples | 83 | 160 | 220 |
| Skills | 12 | 19 | 19 |
| Slash commands | 8 | 15 | 16 |
| Review agents | 4 | 4 | 4 |
| Component coverage | ~24% | 55.3% | 90.5% |
| Distribution channels | 1 (manual) | 4 | 4 (npm / Homebrew / git / VS Code) |
| Integration walkthroughs | 0 | 5 (EN+KO) | 5 (EN+KO) |
| Site languages | 0 | 2 | 2 (EN+KO) |
| CI audits | 4 | 6 | 8 |
| CLI / extension unit tests | 0 | 0 | 170 |
| VS Code integration tests | 0 | 0 | 8 (e2e infra) |
| Dogfood findings docs | 1 | 1 | 5 |

## The arc

v2.0 was the foundation: design tokens, components synthesized from Ant + MUI + shadcn, UX patterns, accessibility, Korean i18n. The corpus could already turn an LLM into a senior product designer for Korean fintech / SaaS.

v3.x extended the corpus across **six adjacent design domains** (motion, illustration, print, video, game UI, conversational, spatial), then made the result **distributable** (npm CLI, Homebrew tap, public doc site, VS Code extension), then **localized for the primary market** (Korean translations of high-traffic pages + integration walkthroughs), then **prepared for stable release** (versioned frontmatter, stale-content audit, release checklist).

## Phase log

### v2.x — Domain expansion

The corpus had product UI / design system depth. v2.x added six adjacent domains every modern designer needs.

- **v2.1 (Phase 12)** — Motion design depth. 5 knowledge files, 4 component specs, motion-designer skill, /motion-design command. Covered CSS / Framer Motion / GSAP / Lottie / Rive decision tree. Reduced-motion-safe by default.
- **v2.2 (Phase 13)** — Illustration systems. Style / voice / mascot / SVG optimization. Korean fintech mascot conventions (Kakao Friends, Toss money characters).
- **v2.3 (Phase 14)** — Print / physical design. CMYK, bleed, business cards, brochures, packaging. Korean print conventions (명함 90×50, KFDA / KATS regulatory, 분리배출 표시).
- **v2.4 (Phase 15)** — Video content. Codecs, captions, marketing / social / in-product. Korean video conventions (자막, 표시광고법 ad disclosure, KFDA / KFTC compliance).
- **v2.5 (Phase 16)** — Game UI. Russell taxonomy, HUD design, menu systems, accessibility. Korean gaming conventions (PC bang, 확률 표시 mandatory, GRAC ratings, gacha pity).
- **v2.6 (Phase 17)** — Voice / conversational UI. Voice assistants, chatbots, AI chat (LLM). Korean voice ecosystem (Bixby / Clova / NUGU / Kakao i), 해요체 vs 합쇼체.
- **v2.7 (Phase 18)** — AR / VR / spatial design. Milgram continuum, comfort zones, locomotion, mobile AR vs headset MR. Korean Galaxy XR context.

By v2.7, the corpus covered every adjacent domain a modern designer encounters. 91 knowledge files, 99 worked examples.

### v3.0 → v3.4 — Distribution

The corpus existed; nobody could install it. v3.x made it real.

- **v3.0 (Phase 19)** — Stabilization. `.claude-plugin/plugin.json` Claude Code plugin manifest. `install.sh` automated installer. CHANGELOG.md, LICENSE, QUICKSTART.md. CI now ran 5 audits.
- **v3.1 (Phase 20)** — NPM CLI distribution. `@design-ai/cli` npm package; `npx @design-ai/cli install` — adopters could go from zero to installed in one command.
- **v3.2 (Phase 21)** — Public doc site. mkdocs-material on GitHub Pages with brand-colored palette, Pretendard for Korean, full nav covering all 91 knowledge files + 99 examples.
- **v3.3 (Phase 22)** — Component coverage push. 23.6% → 30.7% (47 → 61 of 199 canonical components). 13 new specs covering shadcn flagship primitives (sidebar, command, sheet, dropdown, navigation-menu, etc.).
- **v3.4 (Phase 23)** — Multi-agent integration + Homebrew. Worked walkthroughs for Codex CLI / Cursor / Aider / SDK proving the "model-agnostic" tagline. Homebrew formula. Integration audit added to CI.

### v3.5 → v3.7 — Coverage acceleration

Build the leverage tool, then push coverage further.

- **v3.5 (Phase 24)** — Component spec scaffolder + coverage 30.7% → 36.2%. Built `tools/extractors/component_spec_scaffold.py` to scaffold drafts from upstream sources. Wrote 11 manual specs.
- **v3.6 (Phase 25)** — Korean i18n. README.ko.md, QUICKSTART.ko.md, DISTRIBUTION.ko.md, AGENTS.ko.md. mkdocs-static-i18n plugin; `/ko/` paths on the doc site. Direct lever for the user's stated 시장성 / 대중성 goal.
- **v3.7 (Phase 26)** — Coverage 36.2% → 45.2%. 18 specs across form / layout / overlay / navigation / utility primitives. Halfway-to-100% milestone.

### v3.8 — VS Code

- **v3.8 (Phase 27)** — VS Code extension. Full TypeScript scaffold with 4 sidebar trees (Skills / Knowledge / Examples / Walkthroughs), 8 commands, 2 settings (path / language). Vendor-neutral — pairs with Copilot Chat / Cursor / Continue / any AI assistant.

### v3.9 → v3.10 — Coverage + Korean depth

- **v3.9 (Phase 28)** — Coverage 45.2% → 55.3%. 18 specs (Switch / Tag / Snackbar / Sonner / Textarea / Popconfirm / Popper / SwipeableDrawer / Resizable / ImageList / BackTop / ClickAwayListener / Toolbar / Step / Zoom / SpeedDialAction / Slide). Majority canonical coverage.
- **v3.10 (Phase 29)** — Korean walkthroughs. Translated all 5 integration walkthroughs (Codex / Cursor / Aider / SDK / VS Code) to Korean. Korean copy check now scans 26 files.

### v3.11 → v3.12 — Release readiness

- **v3.11 (Phase 30)** — Versioned knowledge frontmatter. Migration script added `version: 1.0.0` + `last_updated: 2026-05` + `stability: stable` to all 91 knowledge files. Foundation for v4.0 stability + adopter version pinning.
- **v3.12 (Phase 31)** — Release readiness. `tools/audit/stale-check.py` operationalizes versioning (warn at 6mo, error at 12mo). `docs/RELEASE-CHECKLIST.md` codifies pre-release ritual. This SESSION-LOG.md.

### v4.0 — Stable graduation

- **v4.0 (Phase 32)** — Graduation release. No code changes from v3.12; just promotes the corpus to API-stable across 8 surfaces (knowledge / skills / commands / agents / CLI / plugin manifest / VS Code config / doc URLs). `docs/MIGRATION-v4.md` documents the deprecation policy: deprecate in 4.x → maintain in 4.x → remove in 5.0.

### v4.1 → v4.2 — Localization + launch prep

- **v4.1 (Phase 33)** — Korean adopter / contributor docs. `USING.ko.md` / `CONTRIBUTING.ko.md` / `ARCHITECTURE.ko.md` round out the foundational doc set in Korean. KR adopters now have full sense-making path without English friction.
- **v4.2 (Phase 34)** — Launch kit. Drafts ready for Show HN / dev.to / OKKY / hashnode KR / r/korea / r/programming / Twitter EN+KO threads. Per-channel tone matrix, posting cadence, FAQ, press kit. Posting is owner action (held until product-ready).

### v4.3 → v4.6 — Internal completeness

- **v4.3 (Phase 35)** — Internal completeness. Standardized 19/19 skill verification headings. Added `tools/audit/run-all.py` unified runner (~0.8s for all 6). 16 CLI unit tests. VS Code language toggle + corpus search command.
- **v4.4 (Phase 36)** — Component spec extractor v2 (TS AST). Replaced regex with TypeScript Compiler API. Correctly handles generics, intersection types, destructured defaults, JSDoc tags. Per-prop provenance from Ant + MUI + shadcn. Foundation for v4.5's coverage push.
- **v4.5 (Phase 37)** — Coverage 55.3% → 68.8%. 27 new specs (8 polished, 19 honest DRAFTs). Family-completion focus: Form / List / Dialog / Card / Accordion / Menu families all complete.
- **v4.6 (Phase 38)** — Stability re-review automation. Quarterly ritual operationalized: `stability-review.py` report + `promote-stability.py` + `bump-last-updated.py` bulk tools. `/stability-review` slash command. `docs/CONTRIBUTING.md` 5-step ritual.

### v4.7 → v4.8 — Dogfood-driven hardening

- **v4.7 (Phase 39)** — Dogfood v4 (Korean B2B HR onboarding scenario). 5 corpus gaps surfaced and fixed inline: missing LoadingButton spec, stability-review false positive, b2b-onboarding knowledge file, KR B2B SaaS palette row, v2 banner accuracy claim. v3 vs v4 dogfood time: 3-5x faster on Form/Dialog/List work.
- **v4.8 (Phases 40-42)** — Three-surface dogfood: VS Code extension + npm distribution + mkdocs site build. Each surface surfaced real bugs (search preview lost matches past column 120, missing icon.png, tools/migrations/ not in npm allowlist, **link-check.py false-negative across entire audit history**, two missing flagship primitives — Dialog parent and Stack — that v4.5 family-completion claimed were shipped). All fixed.

### v4.9 — Polish + 80% coverage

- **v4.9 (Phases 43-44)** — Polished 18 of 21 v4.5/v4.7 DRAFT specs (only 3 accordion subs intentionally remain). Coverage push 68.8% → 80.9%. 26 new fully-polished specs. Every flagship MUI primitive now covered with parent + family children.

### v4.10 → v4.13 — Release hardening, drift tooling, and 90% coverage

- **v4.10 (Phases 45-47)** — VS Code real-instance e2e infrastructure, SESSION-LOG refresh, and component extractor v3 cross-source conflict detection.
- **v4.11 (Phase 48)** — CI wiring. Audit, unit tests, VS Code e2e, and informational conflict-check moved into GitHub workflows.
- **v4.12 (Phase 49)** — Reconciliation mode. `component_spec_reconcile.py` proposes unified API rows and can safely apply HIGH-confidence updates.
- **v4.13 (Phases 50-113)** — Closed all DRAFT spec debt, added raw-hex example hygiene, reached 90%+ canonical coverage, documented summary-first drift review, synced Korean maintenance docs, refreshed upstream refs, added `BorderBeam` coverage after Ant Design expanded the canonical index to 200, added a self-tested local CI parity gate for push-readiness, removed generated Ant Design swatch hash-link noise from MkDocs builds, tightened public docs links before Real-CI, narrowed MkDocs warnings to intentional `refs/` source links, made that non-`refs/` warning baseline enforceable inside `npm run ci:local`, reduced successful local CI docs output to a compact warning-policy summary, aligned the GitHub Pages docs workflow with the same docs-only policy path, added a local drift check so that workflow cannot silently bypass the policy later, tightened that check to inspect workflow commands and path entries, made Korean top-level site inputs trigger docs deployment, expanded the invariant to cover the main corpus directory triggers, capped the remaining refs-only MkDocs warning stream at the accepted 632-warning baseline, synced Korean distribution guidance with that warning-policy cap, added release metadata coverage so bilingual distribution policy drift fails before tagging, made that guard accept natural Korean policy terms without losing strictness, expanded it across README, RELEASE-CHECKLIST, and Distribution docs, required those docs to keep the `ci:local` command handoff, made the required policy-doc coverage set fail closed, rejected unexpected policy-doc coverage entries, fixed the checked docs order as deterministic release metadata, converted missing policy-doc files into structured loader errors, extended that structured input loading to package/plugin manifests plus CHANGELOG/ROADMAP, converted audit-count source failures into structured metadata errors, self-tested the human pass/fail output formatter, self-tested the release metadata JSON formatter plus summary key order, converted release metadata phrase validation to a shared table-driven guard path, self-tested that phrase guard table for label drift and invalid term groups, added a self-tested `design-ai check` JSON formatter for artifact/examples reports, added a self-tested `design-ai route` JSON formatter for recommendation/catalog reports, added a self-tested `design-ai prompt` JSON formatter for inferred/forced prompt plans, added a self-tested `design-ai pack` JSON formatter for complete/partial prompt-context bundles, added a self-tested `design-ai examples` JSON formatter for route-biased worked-example discovery, added a self-tested `design-ai search` JSON formatter for corpus search hits, added a self-tested `design-ai show` JSON formatter for corpus file output, guarded release-facing docs against dropping that corpus discovery JSON guidance, guarded release-facing docs against dropping explicit show-lines and route-explain smoke guidance, guarded release-facing docs against dropping suggestion and numeric range failure smoke guidance, guarded release-facing docs against dropping prompt/pack output-file confirmation smoke guidance, added a self-tested `design-ai help` JSON formatter for command discovery catalogs, guarded release-facing docs against dropping that help JSON topic catalog guidance, guarded release-facing docs against dropping command and functional alias smoke guidance, guarded release-facing docs against dropping command-specific help topic smoke guidance, added a self-tested `design-ai doctor` JSON formatter for install-health diagnostics, guarded release-facing docs against dropping that doctor strict diagnostics guidance, added self-tested `design-ai list --json` catalog output for shipped skills, commands, and agents, guarded release-facing docs against dropping that list JSON catalog guidance, added self-tested `design-ai status --json` install-state output for installed symlink verification, guarded release-facing docs against dropping that status JSON install-state guidance, added self-tested `design-ai audit --json` repository-gate output for CI/release automation, guarded release-facing docs against dropping that audit strict-quiet smoke guidance, added self-tested `design-ai version --json` metadata output for version-alignment automation, guarded release-facing README docs against dropping that version JSON smoke guidance, added self-tested `design-ai install --json` lifecycle output for install-count automation, guarded release-facing docs against dropping that install JSON smoke guidance, added self-tested `design-ai uninstall --json` lifecycle output for removal-count automation, guarded release-facing docs against dropping that uninstall JSON smoke guidance, made `design-ai update` reject unknown options before git/install lifecycle work starts, added human/JSON `design-ai update --dry-run` preview output so update smoke can validate planned git/install work without mutations, and guarded release-facing docs against dropping that update dry-run smoke guidance.
- **v4.13 (Phase 114)** — Guarded release-facing docs against dropping top-level help smoke guidance.
- **v4.13 (Phase 115)** — Guarded release-facing docs against dropping human version smoke guidance.
- **v4.13 (Phase 116)** — Guarded release-facing docs against dropping check examples/artifact/stdin/all-routes smoke guidance.
- **v4.13 (Phase 117)** — Guarded release-facing docs against dropping route JSON/catalog/stdin smoke guidance.
- **v4.13 (Phase 118)** — Guarded release-facing docs against dropping prompt/pack JSON/markdown/from-file/stdin smoke guidance.
- **v4.13 (Phase 119)** — Guarded release-facing docs against dropping human install/status/uninstall lifecycle smoke guidance.
- **v4.13 (Phase 120)** — Guarded release-facing docs against dropping unknown command/help/list/search-dir failure smoke guidance.
- **v4.13 (Phase 121)** — Guarded release-facing docs against dropping packed-tarball `npm exec --package <tarball>` smoke guidance.
- **v4.13 (Phase 122)** — Guarded release-facing docs against dropping public registry `npm exec --package @design-ai/cli@<version>` smoke guidance.
- **v4.13 (Phase 123)** — Guarded release-facing docs against dropping package contents check guidance.
- **v4.13 (Phase 124)** — Guarded release-facing docs against dropping CLI unit test guidance.
- **v4.13 (Phase 125)** — Guarded release-facing docs against dropping all-eight repository audit gate guidance.
- **v4.13 (Phase 126)** — Guarded release-facing docs against dropping whitespace check guidance.
- **v4.13 (Phase 127)** — Guarded release-facing docs against dropping release self-test guidance.
- **v4.13 (Phase 128)** — Guarded release-facing docs against dropping packed-tarball installed-bin smoke guidance.
- **v4.13 (Phase 129)** — Guarded release-facing docs against dropping release metadata check guidance.
- **v4.13 (Phase 130)** — Guarded release-facing docs against dropping packed-tarball smoke gate guidance.
- **v4.13 (Phase 131)** — Guarded release-facing docs against dropping the `release:check` core gate command.
- **v4.13 (Phase 132)** — Guarded release-facing docs against dropping the post-publish `registry:smoke` command.
- **v4.13 (Phase 133)** — Guarded release-facing docs against dropping the local `package:smoke` command.
- **v4.13 (Phase 134)** — Guarded release-facing docs against dropping the local `package:check` command.
- **v4.13 (Phase 135)** — Guarded release-facing docs against dropping the local `release:metadata` command.
- **v4.13 (Phase 136)** — Guarded release-facing docs against dropping the local `release:self-test` command.
- **v4.13 (Phase 137)** — Guarded release-facing docs against dropping the local `git diff --check` command.
- **v4.13 (Phase 138)** — Guarded release-facing docs against dropping the local `npm test` command.
- **v4.13 (Phase 139)** — Guarded release-facing docs against dropping the local `npm run audit:strict` command.
- **v4.13 (Phase 140)** — Split local `npm run ci:local` command drift from MkDocs warning-policy drift.
- **v4.13 (Phase 141)** — Guarded release-facing docs against dropping the local `design-ai help` command.
- **v4.13 (Phase 142)** — Split `design-ai help --json` command drift from help JSON topic catalog drift.
- **v4.13 (Phase 143)** — Split `design-ai version --json` command drift from machine-readable version metadata drift.
- **v4.13 (Phase 144)** — Split `design-ai install --json` command drift from machine-readable install lifecycle output drift.
- **v4.13 (Phase 145)** — Split `design-ai uninstall --json` command drift from machine-readable uninstall lifecycle output drift.
- **v4.13 (Phase 146)** — Split `design-ai status --json` command drift from machine-readable install-state output drift.
- **v4.13 (Phase 147)** — Split `design-ai audit --strict --quiet --json` command drift from machine-readable repository-audit output drift.
- **v4.13 (Phase 148)** — Split `design-ai doctor --strict` command drift from human diagnostics wording drift.
- **v4.13 (Phase 149)** — Split update dry-run command, JSON command, and machine-readable update plan drift.
- **v4.13 (Phase 150)** — Split command alias smoke drift from functional alias smoke drift.
- **v4.13 (Phase 151)** — Split list JSON mode drift from list catalog domain drift.
- **v4.13 (Phase 152)** — Split route JSON output, route catalog output, and route stdin input drift.
- **v4.13 (Phase 153)** — Split show-lines output drift from route-explain output drift.
- **v4.13 (Phase 154)** — Split unknown command, help-topic, list-domain, and search-dir failure drift.
- **v4.13 (Phase 155)** — Split route-id suggestion, option suggestion, value suggestion, and numeric range failure drift.
- **v4.13 (Phase 156)** — Split prompt JSON, prompt markdown, prompt from-file, prompt stdin, pack JSON, pack markdown, pack from-file, and pack stdin drift.

## Patterns that didn't work

### Generic English-first localization

Korean translations done in v3.6 / v3.10 / v4.1 are full translations adapted to natural Korean — not literal English-to-Korean. Earlier attempts at machine-assisted translation produced awkward output that the `korean-copy-check.py` audit specifically catches.

### Coverage push fatigue (v3.x phase)

5 coverage pushes (v3.3, v3.5, v3.7, v3.9 each contributed). The sixth would have diminishing returns. v3.11's pivot to versioned frontmatter (instead of yet-another-coverage-push) was the right call. **Resolved later** in v4.4 — the TS AST extractor v2 made each subsequent spec significantly cheaper to scaffold (v4.5 added 27, v4.9 added 24 more).

### Speculative skills before reference content (v2.x phase)

Early temptation was to ship more skills. But skills are thin — they're playbooks pointing at knowledge. Without the knowledge depth, skills produce generic output. The session prioritized knowledge depth (v2.x) before adding new skills. No new skills shipped after v2.7 — the only addition was the `/stability-review` command (v4.6, ritual-driven, not content-driven).

### "It's audited so it's correct" (v3.x → v4.8)

The 6 audits passed for hundreds of commits while `link-check.py` had a false-negative regex that **silently skipped every backtick-wrapped link reference** — the most common style in this corpus. Surfaced only when v4.8's mkdocs build dogfood emitted warnings the audit missed. Fixed with one regex character (`+` → `*`). 11 real broken links surfaced immediately. Lesson: trust audits AND dogfood in parallel; passing audits ≠ no broken links.

## Patterns that worked

### Dogfood drives next-pass quality (v4.x discovery)

Phases 39-42 (four dogfood passes — corpus / VS Code / npm / mkdocs) surfaced more real bugs in 4 commits than the previous 30 phases combined. Every dogfood found ≥3 actionable gaps. The ratio of "found-by-dogfood" to "found-by-audit" was high enough that future phases should plan dogfood as a first-class step, not afterthought.

### Honest DRAFT banners > false completeness

v2 extractor produced accurate API tables but placeholder narrative. v4.5 + v4.7 + v4.9 left ~24 DRAFT specs explicitly banner-marked, which was better than silently shipping incomplete specs as "done". v4.13 then closed the public DRAFT debt once the specs were polished enough to stand behind.

### One concern per phase (v2.0 onward)

Each phase had a single, focused theme. Not "v2.1: motion + illustration + print" — separate phases. Easier to commit, easier to revert, easier to explain. Held through v4.x except where two phases were truly inseparable (43+44 = polish + coverage; 40-42 = three surfaces of one dogfood pass).

### Korean market depth (v2.0 onward)

The user stated Korean primary audience early. Every domain phase included Korean conventions (typography, voice, regulatory, conventions). The translations in v3.6 / v3.10 / v4.1 were natural extensions of investments already made.

### Audit-driven quality (v2.0 onward)

Every phase that touched files passed the active audit gate before commit. The audits themselves grew from 4 → 8 over the session (added Korean copy, integration, stale, coverage, raw-hex hygiene, and example QA). Each new audit prevented a regression class. v4.8 strengthened the existing link-check.

### Distribution before mass content (v3.0 → v3.4)

v3.0-3.4 prioritized making the corpus *installable* before pushing more content. Coverage pushes happened only AFTER adopters could install the result. The trade-off was right: a 30% corpus that adopters can install beats a 70% corpus locked in a private repo. v4.x validated this — the dogfood passes (npm, mkdocs) only worked because distribution was solid.

### Versioning as foundation (v3.11 → v4.6)

v3.11's versioned frontmatter looks small but enabled v3.12's stale-check, v4.0's stability story, and v4.6's quarterly review automation. Foundation work compounds across multiple later phases.

### Integration walkthroughs as proof (v3.4 → v3.10)

The "model-agnostic" tagline was a claim until v3.4 added concrete walkthroughs for Codex / Cursor / Aider / SDK. Then it was demonstrated. v3.10 doubled down with Korean translations of those same walkthroughs.

## What's next (v4.13+)

v4.13 leaves design-ai with 90%+ canonical coverage, no public DRAFT spec debt, a repeatable refs refresh path, and a local CI parity command that covers release, docs, and VS Code workflow surfaces. Logical paths:

1. **Real-CI verification** — push the branch, observe audit / unit / package / docs workflows green.
2. **External launch** — publish only after CI and owner review; announcement drafts already exist under `docs/announcements/`.
3. **Targeted upstream follow-up** — add specs only when upstream adds product-relevant primitives or HIGH/CRITICAL drift changes.

When the owner is ready to push externally, `npm run ci:local` is green, RELEASE-CHECKLIST is ritualized, announcements are drafted, and install paths are verified.

## Repo structure

```
design-ai/
├── AGENTS.md / AGENTS.ko.md           Universal entry points
├── CLAUDE.md                          Claude Code overlay
├── README.md / README.ko.md           Human entry points
├── CHANGELOG.md                       Release notes
├── LICENSE                            MIT
├── install.sh                         Symlink installer
├── package.json                       NPM CLI manifest
├── mkdocs.yml                         Doc site config
├── .claude-plugin/plugin.json         Plugin manifest
├── .github/workflows/                 CI (audit / publish / docs)
├── refs/                              Upstream sources (gitignored)
├── knowledge/  (92 files; generated coverage report + versioned corpus)
├── examples/   (220 files)
├── skills/     (19, all with verification phase)
├── agents/     (4)
├── commands/   (16)
├── docs/                              Architecture + integrations
├── tools/
│   ├── extractors/                   Source → knowledge pipeline
│   ├── audit/                        8 active audits + release helpers
│   ├── migrations/                   One-shot migration scripts
│   └── preview/                      HTML preview generator
├── cli/                               NPM CLI source
├── vscode-extension/                  VS Code extension source
└── Formula/design-ai.rb               Homebrew formula
```

## Cross-reference

- [`CHANGELOG.md`](../CHANGELOG.md) — per-version detail
- [`docs/ROADMAP.md`](ROADMAP.md) — per-phase detail
- [`docs/RELEASE-CHECKLIST.md`](RELEASE-CHECKLIST.md) — pre-release ritual
- [`docs/CONTRIBUTING.md`](CONTRIBUTING.md) — for contributors
- [`docs/USING.md`](USING.md) — for adopters
- [`docs/QUICKSTART.md`](QUICKSTART.md) — 5-minute start
