# Session log

A single-page narrative of how design-ai grew from v2.0 (foundation) to v3.12 (release-ready). Useful for adopters, contributors, and future maintainers.

For per-version detail, see [`CHANGELOG.md`](../CHANGELOG.md).
For per-phase detail, see [`docs/ROADMAP.md`](ROADMAP.md).

## At a glance

| Surface | v2.0 (start) | v3.12 (now) |
|---|---|---|
| Knowledge files | 55 | 91 |
| Worked examples | 83 | 160 |
| Skills | 12 | 19 |
| Slash commands | 8 | 15 |
| Review agents | 4 | 4 |
| Component coverage | ~24% | 55.3% |
| Distribution channels | 1 (manual) | 4 (npm / Homebrew / git clone / VS Code) |
| Integration walkthroughs | 0 | 5 (each in EN + KO) |
| Site languages | 0 (no site) | 2 (EN + KO) |
| CI audits | 4 | 6 |

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

## Patterns that worked

### One concern per phase

Each phase had a single, focused theme. Not "v2.1: motion + illustration + print" — separate phases. Easier to commit, easier to revert, easier to explain.

### Korean market depth

The user stated Korean primary audience early. Every domain phase included Korean conventions (typography, voice, regulatory, conventions). The translations in v3.6 / v3.10 were natural extensions of investments already made.

### Audit-driven quality

Every phase that touched files passed all 5 audits before commit. The CI workflow caught regressions immediately. The audits themselves grew from 4 → 6 over the session (added Korean copy in v3.0, integration check in v3.4, stale check in v3.12).

### Distribution before mass content

v3.0-3.4 prioritized making the corpus *installable* before pushing more content. Coverage pushes happened only AFTER adopters could install the result. The trade-off was right: a 30% corpus that adopters can install beats a 70% corpus locked in a private repo.

### Versioning as foundation

v3.11's versioned frontmatter looks small but enabled v3.12's stale-content audit and v4.0's stability story. Foundation work compounds.

### Integration walkthroughs as proof

The "model-agnostic" tagline was a claim until v3.4 added concrete walkthroughs for Codex / Cursor / Aider / SDK. Then it was demonstrated. v3.10 doubled down with Korean translations of those same walkthroughs.

## Patterns that didn't work

### Speculative skills before reference content

Early temptation was to ship more skills. But skills are thin — they're playbooks pointing at knowledge. Without the knowledge depth, skills produce generic output. The session prioritized knowledge depth (v2.x) before adding new skills (which is why no new skills shipped after v2.7).

### Generic English-first localization

Korean translations done in v3.6 / v3.10 are full translations adapted to natural Korean — not literal English-to-Korean. Earlier attempts at machine-assisted translation produced awkward output that the korean-copy-check audit specifically catches.

### Coverage push fatigue

5 coverage pushes (v3.3, v3.5, v3.7, v3.9 each contributed). The sixth would have diminishing returns — most remaining canonicals are sub-components or transitions. v3.11's pivot to versioned frontmatter (instead of yet-another-coverage-push) was the right call.

## What's next

v3.12 leaves design-ai in shippable shape. Logical v4.0 path:

1. Decide: is v3.12 the v4.0 release? (Likely yes — versioned, audited, distributed, localized.)
2. Tag v4.0.0; run `RELEASE-CHECKLIST.md`.
3. Submit announcement to KR tech communities (OKKY, hashnode.kr, dev.to/korea).
4. VS Code marketplace publish.
5. Continue iteration: more skills, more coverage, more translations.

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
├── knowledge/  (91 files, all versioned 1.0.0)
├── examples/   (160 files)
├── skills/     (19, all with verification phase)
├── agents/     (4)
├── commands/   (15)
├── docs/                              Architecture + integrations
├── tools/
│   ├── extractors/                   Source → knowledge pipeline
│   ├── audit/                        6 audit scripts
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
