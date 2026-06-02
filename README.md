# Design AI

[![Audit](https://img.shields.io/badge/audit-passing-brightgreen)](https://github.com/sungjin9288/design-ai/actions/workflows/audit.yml)
[![Docs](https://img.shields.io/badge/docs-mkdocs-indigo)](https://sungjin9288.github.io/design-ai/)
[![Knowledge files](https://img.shields.io/badge/knowledge-92-blue)](knowledge/PRINCIPLES.md)
[![Examples](https://img.shields.io/badge/examples-223-blue)](examples/README.md)
[![Skills](https://img.shields.io/badge/skills-20-blue)](skills/README.md)

> 🇺🇸 English / [🇰🇷 한국어](https://sungjin9288.github.io/design-ai/ko/)

A model-agnostic design knowledge base + skill system. Drop it in front of any AI coding agent (Claude Code, Codex CLI, Cursor, Aider) and it becomes a senior product designer with 20+ years of experience — opinionated, accessible-by-default, Korean-market-fluent.

> **Not a model. Not a fine-tune.** A structured corpus of design expertise + agent-ready instructions that turn a general-purpose LLM into an expert.

## Coverage at a glance

| Domain | Knowledge | Worked examples | Skill |
|---|---|---|---|
| Design tokens (W3C DTCG, OKLCH) | ✓ | ✓ | `color-palette` |
| Components (Ant + MUI + shadcn synthesis) | ✓ | 47 specs | `component-spec-writer` |
| UX patterns (auth, pricing, hero, forms, etc.) | ✓ | ✓ | `ux-audit`, `design-critique` |
| Website improvement control tower | ✓ | ✓ | `website-improvement` |
| Korean i18n (Hangul, payments, app store, fintech) | ✓ | ✓ | (cross-cutting) |
| Documentation (Diátaxis, slide deck, report, email) | ✓ | ✓ | `document-author`, `slide-deck-author` |
| **Motion** (CSS / Framer / GSAP / Lottie / Rive) | ✓ | 4 specs | `motion-designer` |
| **Illustration** (spot / hero / mascot / SVG) | ✓ | 2 specs | `illustration-designer` |
| **Print** (CMYK, bleed, KFDA, 분리배출) | ✓ | 2 specs | `print-designer` |
| **Video** (codecs, captions, KR ad disclosure) | ✓ | 2 specs | `video-designer` |
| **Game UI** (HUD / menu / 확률 표시 / PC bang) | ✓ | 2 specs | `game-ui-designer` |
| **Conversational** (voice, chatbot, AI chat / 해요체) | ✓ | 2 specs | `conversational-ui-designer` |
| **Spatial** (VR / AR / Vision Pro / comfort) | ✓ | 2 specs | `spatial-designer` |

## Install (Claude Code)

### Option A: NPM (one command, recommended)

```bash
npx @design-ai/cli install
```

Or globally:

```bash
npm install -g @design-ai/cli
design-ai install
```

### Option B: Homebrew

```bash
brew tap sungjin9288/design-ai https://github.com/sungjin9288/design-ai.git
brew install design-ai
design-ai install
```

### Option C: Git clone (for contributors)

```bash
git clone https://github.com/sungjin9288/design-ai.git
cd design-ai
./install.sh
```

Any of the three: you get all 20 skills, 17 commands, and 4 agents under `~/.claude/` with `design-` prefix. Restart Claude Code; try:

```
/design-component-spec Banner
/design-motion-design landing hero loop
/design-spatial Vision Pro productivity app
/design-website-improvement Korean SaaS homepage conversion and SEO control tower
/design-from-brief Korean fintech for freelancers
```

CLI commands: `design-ai install [--json]`, `update [--dry-run] [--json]`, `uninstall [--json]`, `status [--json]`, `list [skills|commands|agents] [--json]`, `route <brief|--from-file file|--stdin|--list> [--limit N] [--explain] [--json]`, `routes [--json]`, `prompt <brief|--from-file file|--stdin> [--out file] [--route id] [--with-learning] [--learning-category kind] [--learning-limit N] [--json]`, `pack <brief|--from-file file|--stdin> [--out file] [--route id] [--with-learning] [--learning-category kind] [--learning-limit N] [--max-bytes N] [--json]`, `learn [--init|--remember text|--feedback text|--list|--export|--query text|--explain|--backup|--redact|--verify|--diff|--restore|--restore-backups [--prune]|--import|--audit [--fix]|--curate|--stats|--usage|--eval-template|--eval [--strict]|--forget id|--clear] [--json|--report] [--out file]`, `check <artifact.md|--stdin|--examples> [--route id|--all-routes] [--issues-only] [--strict] [--learn [--yes] [--learning-file path]] [--json]`, `workspace [--root path] [--learning-file path] [--learning-usage path] [--learning-eval path] [--strict] [--json]`, `site <workspace.json|--stdin> [--strict] [--json|--mcp-check|--mcp-plan|--tasks|--bundle|--report|--prompts|--prompt id [--task id]] [--out file] | site <bundle-dir> --bundle-check [--json] | site <bundle-dir> --bundle-compare other-bundle-dir [--json] | site <bundle-dir> --bundle-handoff [--json] | site --sample [--out file] | site --prompt-list [--json]`, `examples [query|--route id] [--limit N] [--json]`, `search <query> [--dir kind] [--limit N] [--json]`, `show <file[:line]> [--lines N:M] [--context N] [--json]`, `audit [--strict] [--quiet] [--json]`, `doctor [--strict] [--json] [--fix]`, `version [--json]`, `help [command|--json]`.

See [`docs/DISTRIBUTION.md`](docs/DISTRIBUTION.md) for the full distribution guide.

## Install (other agents)

| Agent | Setup |
|---|---|
| **Codex CLI** | Open this dir as project root. `AGENTS.md` is read automatically. [Walkthrough](docs/integrations/codex-walkthrough.md). |
| **Cursor** | Open this dir; symlink or copy `AGENTS.md` to `.cursorrules`. [Walkthrough](docs/integrations/cursor-walkthrough.md). |
| **Aider** | Pass `AGENTS.md` as system prompt. [Walkthrough](docs/integrations/aider-walkthrough.md). |
| **Anthropic / OpenAI SDK** | Embed relevant skill `PLAYBOOK.md` files in your prompt. [Walkthrough](docs/integrations/sdk-walkthrough.md). |
| **VS Code** | Install the `design-ai` extension — sidebar tree + quick-pick commands. [Walkthrough](docs/integrations/vscode-walkthrough.md). |
| **Plain prompt** | Paste any `skills/*/PLAYBOOK.md` body — each is self-contained. |

See [`docs/USING.md`](docs/USING.md) for per-agent setup details, or the linked walkthroughs for concrete example sessions.

## What you get

```
design-ai/
├── AGENTS.md                # Universal entry point (any AI coding agent)
├── CLAUDE.md                # Claude Code overlay
├── README.md                # You are here
├── CHANGELOG.md             # Release notes
├── install.sh               # Symlink installer for Claude Code
│
├── .claude-plugin/          # Plugin manifest (plugin.json)
│
├── refs/                    # Sparse-cloned upstream sources (gitignored)
│
├── knowledge/               # 92 hand-written + extracted knowledge files
│   ├── design-tokens/       # Token systems (W3C DTCG, OKLCH, HCT)
│   ├── components/          # Component synthesis (Ant + MUI + shadcn)
│   ├── patterns/            # Auth, pricing, landing hero, brand, email, ...
│   ├── colors/              # Palette systems, accessibility
│   ├── typography/          # Type scales, font pairings (Pretendard + ...)
│   ├── layout/              # Grid, spacing, responsive
│   ├── icons/               # Icon system metadata
│   ├── a11y/                # WCAG, keyboard, focus, contrast
│   ├── motion/              # Principles + 5 deep dives
│   ├── illustration/        # System / spot / hero / mascot / SVG
│   ├── print/               # Fundamentals / stationery / brochures / ...
│   ├── video/               # Fundamentals / marketing / social / ...
│   ├── game-ui/             # Fundamentals / HUD / menus / accessibility
│   ├── conversational/      # Voice / chatbot / AI chat / Korean
│   ├── spatial/             # VR / AR / panels / comfort
│   └── i18n/                # Korean typography, payments, app store, ...
│
├── examples/                # 223 worked outputs (what "good" looks like)
│
├── skills/                  # 20 reusable playbooks (task-focused)
│   ├── design-system-builder/   illustration-designer/
│   ├── component-spec-writer/   print-designer/
│   ├── color-palette/           video-designer/
│   ├── ux-audit/                game-ui-designer/
│   ├── design-critique/         conversational-ui-designer/
│   ├── handoff-spec/            spatial-designer/
│   ├── design-system-qa/        document-author/
│   ├── design-pr-review/        website-improvement/
│   ├── figma-token-sync/        slide-deck-author/
│   ├── motion-designer/
│   └── design-broadcast/
│
├── agents/                  # 4 sub-agents (parallel reviews)
│   ├── design-critic.md         a11y-reviewer.md
│   ├── component-architect.md   token-extractor.md
│
├── commands/                # 17 slash commands
│   ├── design-from-brief.md     motion-design.md
│   ├── component-spec.md        illustration.md
│   ├── design-review.md         website-improvement.md
│   ├── print.md
│   ├── palette-from-brand.md    video.md
│   ├── document-from-brief.md   game-ui.md
│   ├── slide-deck.md            conversational.md
│   ├── iterate.md               spatial.md
│   ├── extract-tokens.md
│   └── stability-review.md
│
├── tools/                   # Maintenance pipeline
│   ├── extractors/          # 11 source extractors + component drift tooling
│   ├── audit/               # 8 active audits + package/release smoke helpers
│   └── preview/             # HTML token swatches + contrast matrix
│
└── docs/                    # Architecture + integration guides
    ├── QUICKSTART.md            ROADMAP.md
    ├── ARCHITECTURE.md          USING.md
    ├── CONTRIBUTING.md          PLUGIN-PACKAGING.md
    ├── CODEX-INTEGRATION.md     FIGMA-INTEGRATION.md
    ├── CURSOR-INTEGRATION.md    MCP-INTEGRATION.md
    ├── AIDER-INTEGRATION.md     TOKEN-SYNC.md
    └── DOGFOOD-FINDINGS.md
```

## First-time tour (5 minutes)

See [`docs/QUICKSTART.md`](docs/QUICKSTART.md). The shortest path:

1. Install (`./install.sh`).
2. In Claude Code, try `/design-component-spec Banner`. You get a developer-ready spec for a Banner component (anatomy, API, variants, states, tokens, ARIA, keyboard, edge cases).
3. Run `/design-design-review` against a Figma link or screenshot. You get a parallel UX + a11y + design critique.

## Korean market focus

design-ai is built for the Korean market with parity for international:

- **Hangul typography** — Pretendard / NanumSquare / 본명조 defaults; size + leading rules differ from Latin.
- **Korean payments** — Toss / KakaoPay / NaverPay / Apple Pay / Samsung Pay flows; PASS / NICE / KCB 본인인증.
- **Voice** — 합쇼체 (formal) vs 해요체 (friendly) selection per brand.
- **Print** — 명함 90×50mm, KFDA / KATS regulatory, 분리배출 표시 recycling marks.
- **Video** — 자막 conventions, 표시광고법 ad disclosure, KFDA / KFTC compliance.
- **Game** — PC bang culture, 확률 표시 mandatory, GRAC ratings, gacha pity / 천장.
- **Stock charts** — KR red=up / blue=down (opposite of West) — encoded in design tokens.

International defaults remain available; Korean conventions are opt-in via skill / command parameters.

## Source material

The knowledge is synthesized from battle-tested sources, not invented:

| Source | Why |
|---|---|
| [ant-design](https://github.com/ant-design/ant-design) | Mature enterprise component API, dense token system |
| [mui/material-ui](https://github.com/mui/material-ui) | Material Design React reference |
| [shadcn-ui](https://github.com/shadcn-ui/ui) | Modern Radix-based copy-paste model |
| [material-design-icons](https://github.com/google/material-design-icons) | Canonical icon set |
| [nerd-fonts](https://github.com/ryanoasis/nerd-fonts) | Developer typography glyph metadata |
| [material-design-lite](https://github.com/google/material-design-lite) | Historical CSS-first Material reference |
| [awesome-design-md](https://github.com/VoltAgent/awesome-design-md) | Curated design markdown guides |
| [ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | UI/UX patterns + palettes + font pairings |
| [open-design](https://github.com/nexu-io/open-design) | Open source design system reference |

Refresh refs/ on demand: `./tools/extractors/run-all.sh`.

## Status

See [`docs/ROADMAP.md`](docs/ROADMAP.md) for the full phase log and [`docs/PRODUCT-READINESS.md`](docs/PRODUCT-READINESS.md) for the current completion boundary. Currently at **v4.52.0** (public registry learning restore/prune smoke + learning restore rollback backup pruning + learning restore rollback backup inventory + learning restore rollback backup + learning profile restore + learning profile diff + workspace curation report next actions + learning curation Markdown reports + workspace learning curation next actions + learning usage curation review + workspace learning usage readiness + workspace learning eval freshness guard + workspace sibling learning eval checkpoint auto-detection + shell-safe workspace learning eval commands + workspace learning eval-template hints + public registry learning eval template smoke + learning eval template generation + public registry workspace learning eval smoke + workspace learning eval readiness + local learning eval strict gate + local learning eval checkpoints + local learning usage report + usage sidecar + archive-first curation + website improvement target-repo handoff prompt + handoff bundle compare + fingerprint verification + bundle export + MCP action plan export + readiness check + prompt template listing + task-selected prompt export + control tower + 90% component coverage).

Core design consulting workflows are locally release-ready. The website improvement control tower is available as a zero-dependency static Web App at [`docs/website-console/index.html`](docs/website-console/index.html), plus a `website-improvement` route/skill/command for Site Profiles, audit checklists, MCP readiness, refactor prompts, and handoff reports. Local learning preferences are available through `design-ai learn`, starter profile bootstrap via preview-first `learn --init`, explicit `learn --feedback` keep/improve/avoid guidance, explicit `check --learn --yes` capture for local QA warning/failure results, read-only `design-ai workspace` dogfood readiness snapshots for git, canonical repository remote/metadata alignment, learning, optional or sibling `--learning-usage` sidecar summaries with stale selected-id/profile-mismatch readiness warnings, optional `--learning-eval` checkpoint summaries with freshness metadata, automatic sibling `learning-eval.json` checkpoint detection, checkpoint freshness warnings when the active learning profile changed after checkpoint generation or no longer matches checkpoint metadata, shell-safe learning usage/eval next-action commands for local paths, usage-aware `learn --curate --usage-file` next actions when learning profile audit or usage sidecar drift needs review, companion `learn --curate --report --out learning-curation-report.md` workspace report next actions before archive cleanup, eval-template bootstrap next-action hints when a clean learning profile has entries but no checkpoint, and release-script state with `--strict` readiness gating, `design-ai site` sample workspace generation, prompt template listing, deterministic MCP readiness checks through `--mcp-check`, Markdown MCP action plan export through `--mcp-plan`, complete handoff bundle export through `--bundle --out`, handoff bundle fingerprint verification through `--bundle-check --strict --json`, handoff bundle comparison through `--bundle-compare --strict --json`, target-repo handoff prompt generation from a verified bundle through `--bundle-handoff --strict --json`, refactor task generation, single prompt template export with task selection, and validation/report/prompt generation from Website Console JSON exports, full portable `learn --backup --json` profile export with safe `--out` file output and `--force` overwrite control, redacted portable `learn --redact --json` profile export for sharing from the local profile or portable JSON via `--from-file` / `--stdin`, non-mutating `learn --verify` import validation, read-only `learn --diff` profile comparison against portable JSON, preview-first full-profile `learn --restore` replacement from portable backups with automatic rollback backup and optional `--backup-file` path, read-only `learn --restore-backups` inventory for sibling rollback backups, preview-first `learn --restore-backups --prune --keep N` cleanup for older sibling rollback backups, portable `learn --import` dry-run/confirmed profile merge, query-filtered `learn --list --explain` / `learn --export` inspection without recency fallback, read-only `learn --audit` cleanup suggestions / `learn --stats`, read-only `learn --usage` reports for local prompt/pack usage sidecar activity, runnable `learn --eval-template` checkpoint generation from the active profile, read-only `learn --eval` checkpoint reports for deterministic local learning selection QA with `--strict` failure gating and sanitized checkpoint metadata, safe `learn --audit --fix --dry-run` previews plus confirmed `--fix --yes` cleanup, archive-first `learn --curate` preview/apply flow for duplicate and sensitive learning entries plus `learn --curate --report --out` Markdown audit trails and advisory usage review hints for profile mismatch, stale selected ids, and unused active entries, and opt-in `prompt`/`pack --with-learning` with brief-relevance ranking, category/limit scoping, selection scoring metadata, learned-context audit summaries, and local `learning.usage.json` sidecar events that store selected entry ids plus a short brief hash instead of raw brief text; AI model training or fine-tuning remains outside the shipped scope.

The corpus has been audited under CI checks since v1.7. It currently runs 8 audits:
- Frontmatter validity
- Internal link resolution
- Korean copy quality
- Raw hex color hygiene in examples
- Integration walkthrough completeness
- Stale-content freshness
- Component coverage report freshness
- Top worked example QA for every routed workflow

All 8 pass on every commit to `main`.

## Contributing

See [`docs/CONTRIBUTING.md`](docs/CONTRIBUTING.md). The bar:
- Run `npm run release:check` as the core gate before release PRs or tags. It covers `npm test` CLI unit tests, `npm run audit:strict` all 8 audits, `git diff --check` whitespace checks, `npm run package:check` package contents checks, `npm run release:metadata` release metadata checks, `npm run release:self-test` release assertion self-tests (including audit runner exit-code and coverage timestamp preservation fixtures), and `npm run package:smoke` packed-tarball smoke for installed-bin plus one-shot `npm exec --package <tarball>` paths including `design-ai workspace --strict --json` workspace strict failure/success readiness checks plus workspace `--learning-usage` sidecar summaries and workspace `--learning-eval` checkpoint summaries with freshness metadata, `design-ai site --stdin --json` Website Console export validation, `design-ai site --sample` Website Console sample workspace coverage, `design-ai site --prompt-list --json` Website Console prompt template listing, `design-ai site --stdin --mcp-check --json` Website Console MCP readiness check, `design-ai site --stdin --mcp-plan` Website Console MCP action plan, `design-ai site --stdin --bundle --out <dir>` Website Console handoff bundle, `design-ai site <bundle-dir> --bundle-check --strict --json` Website Console handoff bundle check with SHA-256 checksum verification and bundle digest/fingerprint verification, `design-ai site <bundle-dir> --bundle-compare <other-bundle-dir> --strict --json` Website Console handoff bundle compare with bundle digest comparison, `design-ai site <bundle-dir> --bundle-handoff --strict --json` Website Console target-repo handoff prompt from a verified bundle digest, `design-ai site --stdin --tasks` Website Console refactor task generation, `design-ai site --stdin --prompt codex-implementation --task task-homepage-cta` Website Console task-selected single prompt generation, human `design-ai version` and machine-readable version metadata from JSON `design-ai version --json`, `design-ai help` top-level help, the `design-ai help --json` topic catalog, command alias help and functional alias output, command-specific help topic output, all three `list` catalog domains in human and JSON mode, human / JSON corpus discovery output, route JSON output, route catalog output, and route stdin input, explicit `show --lines` output and `route --explain` output, unknown command failure, unknown help-topic failure, unknown list-domain failure, and unknown search-dir failure, unknown route-id suggestion, unknown option suggestion, unknown value suggestion, and numeric range failure, prompt JSON output, prompt markdown output, prompt from-file output, prompt stdin output, pack JSON output, pack markdown output, pack from-file output, and pack stdin output, prompt/pack forced `--out` overwrite and prompt/pack file-write confirmations, check examples output, check artifact output, check stdin output, check all-routes output, and check learning capture output, human `design-ai audit --strict --quiet` output and JSON `design-ai audit --strict --quiet --json` machine-readable repository-audit output, JSON `design-ai learn --feedback` output plus learn feedback `--out` file-write confirmation, JSON `design-ai learn --init` output, JSON `design-ai learn --backup` output, JSON `design-ai learn --redact` output, `design-ai learn --redact --from-file` output, `design-ai learn --redact --stdin` output, learn JSON `--out` file-write confirmation and forced overwrite coverage, JSON `design-ai learn --verify` output plus learn verify `--out` file-write confirmation, JSON `design-ai learn --restore` preview/apply output plus learn restore `--out` file-write confirmation plus learn restore rollback backup verification plus learn restore `--backup-file` path coverage plus design-ai learn --restore-backups restore rollback backup inventory coverage plus design-ai learn --restore-backups --prune restore rollback backup pruning coverage, JSON `design-ai learn --import` dry-run/apply output plus learn import `--out` file-write confirmation, human / JSON `design-ai learn --stats` profile summary output plus learn stats `--out` file-write confirmation, query-filtered human learn list explanation and export JSON output, brief-relevant prompt/pack learning selection, prompt/pack learning usage sidecar recording, human / JSON `design-ai learn --usage` usage sidecar report plus learn usage `--out` file-write confirmation, human / JSON `design-ai learn --eval-template` checkpoint generation plus generated checkpoint strict validation, human / JSON `design-ai learn --eval` checkpoint report plus learn eval `--out` file-write confirmation plus learn eval `--strict` failure gate, human / JSON `design-ai learn --audit` cleanup suggestion output plus learn audit `--out` file-write confirmation, human / JSON `design-ai learn --curate` archive-first curation output plus usage-aware curation JSON review, human `design-ai update --dry-run` output, `design-ai update --dry-run --json` machine-readable update plan, human diagnostics output from `design-ai doctor --strict`, machine-readable diagnostics output from `design-ai doctor --json`, human `design-ai install` output plus `design-ai install --json` machine-readable install lifecycle output, human `design-ai status` output plus JSON status including `design-ai status --json` machine-readable install-state output, and human `design-ai uninstall` output plus `design-ai uninstall --json` machine-readable uninstall lifecycle output.
- After npm publish completes, run `npm run registry:smoke` to verify the public `npm exec --package` install path, including human `design-ai version` and machine-readable version metadata from JSON `design-ai version --json`, `design-ai help` top-level help, the `design-ai help --json` topic catalog, functional aliases, all three `list` catalog domains in human and JSON mode, human / JSON corpus discovery output, route JSON output, route catalog output, and route stdin input, explicit `show --lines` output and `route --explain` output, unknown command failure, unknown help-topic failure, unknown list-domain failure, and unknown search-dir failure, unknown route-id suggestion, unknown option suggestion, unknown value suggestion, and numeric range failure, prompt JSON output, prompt markdown output, prompt from-file output, prompt stdin output, pack JSON output, pack markdown output, pack from-file output, and pack stdin output, prompt/pack forced `--out` overwrite and prompt/pack file-write confirmations, check examples output, check artifact output, check stdin output, check all-routes output, and check learning capture output, human `design-ai audit --strict --quiet` output and JSON `design-ai audit --strict --quiet --json` machine-readable repository-audit output, public registry JSON `design-ai learn --verify` output plus public registry learn verify `--out` file-write confirmation, public registry JSON `design-ai learn --backup` output plus public registry learn backup `--out` file-write confirmation, public registry human / JSON `design-ai learn --stats` profile summary output plus public registry learn stats `--out` file-write confirmation, human `design-ai update --dry-run` output, `design-ai update --dry-run --json` machine-readable update plan, human diagnostics output from `design-ai doctor --strict`, machine-readable diagnostics output from `design-ai doctor --json`, and human `design-ai install` output plus `design-ai install --json` machine-readable install lifecycle output, human `design-ai status` output plus JSON status including `design-ai status --json` machine-readable install-state output, and human `design-ai uninstall` output plus `design-ai uninstall --json` machine-readable uninstall lifecycle output.
- Registry smoke also verifies public registry `design-ai workspace --strict --json` workspace strict failure/success readiness checks from the published package path.
- Registry smoke also verifies public registry `design-ai workspace --learning-eval learning-eval.json --strict --json` checkpoint summaries with freshness metadata plus auto-detected learning usage sidecar summaries from the published package path.
- Registry smoke also verifies public registry JSON `design-ai learn --feedback` output plus public registry learn feedback `--out` file-write confirmation, public registry `design-ai learn --feedback --from-file`, public registry `design-ai learn --feedback --stdin`, public registry JSON `design-ai learn --init` preview/apply output, and public registry learn init duplicate-skip output.
- Registry smoke also verifies public registry JSON `design-ai learn --restore` preview/apply output plus public registry learn restore `--out` file-write confirmation, public registry learn restore rollback backup verification, public registry learn restore `--backup-file` path coverage, public registry `design-ai learn --restore-backups` restore rollback backup inventory coverage, and public registry `design-ai learn --restore-backups --prune` restore rollback backup pruning coverage.
- Registry smoke also verifies public registry JSON `design-ai learn --import` dry-run/apply output plus public registry learn import `--out` file-write confirmation plus public registry JSON `design-ai learn --redact` output, public registry `design-ai learn --redact --from-file`, public registry `design-ai learn --redact --stdin`, and public registry learn redact `--out` file-write confirmation.
- Registry smoke also verifies public registry human / JSON `design-ai learn --audit` cleanup suggestion output plus public registry learn audit `--out` file-write confirmation and public registry `design-ai learn --audit --fix --dry-run` cleanup preview and confirmed apply output.
- Registry smoke also verifies public registry query-filtered learn list explanation/export JSON output, public registry brief-relevant prompt/pack learning selection and prompt/pack learning usage sidecar recording with public registry prompt/pack --with-learning, and public registry `design-ai learn --eval-template` checkpoint generation plus public registry generated checkpoint strict validation.
- Knowledge files use `<!-- hand-written -->` marker if hand-authored.
- Skill PLAYBOOKs include a verification phase checklist.
- Korean strings spelled out in Korean (no machine translation passing through).
- All audits pass.
- Before pushing for CI, run `npm run ci:local` when you need local parity with the non-publishing GitHub workflows. It wraps `release:check`, Python syntax checks, knowledge size budget, VS Code extension compile/unit tests, the MkDocs build, and the MkDocs warning policy used by the docs deployment workflow: no non-`refs/` warnings, with refs-only warnings capped at the accepted baseline.

## License

MIT. See [LICENSE](https://github.com/sungjin9288/design-ai/blob/main/LICENSE).

## Changelog

See [CHANGELOG.md](CHANGELOG.md). Highlights:

- **v3.0** — Stabilization: plugin manifest, install.sh, CHANGELOG, README overhaul, QUICKSTART.
- **v2.7** — AR / VR / spatial design.
- **v2.6** — Voice / conversational UI.
- **v2.5** — Game UI.
- **v2.4** — Video content.
- **v2.3** — Print / physical design.
- **v2.2** — Illustration systems.
- **v2.1** — Motion design depth.
- **v2.0** — Documentation worked examples + 7 component specs.
- **v1.x** — MCP integrations, document design + brand + email, coverage push, foundations.
