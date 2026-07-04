# Design AI

[![Audit](https://img.shields.io/badge/audit-passing-brightgreen)](https://github.com/sungjin9288/design-ai/actions/workflows/audit.yml)
[![Docs](https://img.shields.io/badge/docs-live-indigo)](https://sungjin9288.github.io/design-ai/)
[![Knowledge files](https://img.shields.io/badge/knowledge-94-blue)](knowledge/PRINCIPLES.md)
[![Examples](https://img.shields.io/badge/examples-221-blue)](examples/README.md)
[![Skills](https://img.shields.io/badge/skills-20-blue)](skills/README.md)

> 🇺🇸 English / [🇰🇷 한국어](https://github.com/sungjin9288/design-ai/blob/main/README.ko.md)

A model-agnostic design knowledge base + skill system. Drop it in front of any AI coding agent (Claude Code, Codex CLI, Cursor, Aider) and it becomes a senior product designer with 20+ years of experience — opinionated, accessible-by-default, Korean-market-fluent.

> **Not a model. Not a fine-tune.** A structured corpus of design expertise + agent-ready instructions that turn a general-purpose LLM into an expert.

> **Distribution status, checked 2026-07-04:** local `npm run release:check` passes, GitHub Pages docs are live, GitHub Release `v4.58.0` is published, `@design-ai/cli@4.58.0` is public on npm (`latest`) with provenance, and the live `npm run registry:smoke` passes cleanly against `@design-ai/cli@4.58.0`. The Homebrew formula is pinned to `v4.58.0`, and `sungjin.design-ai-vscode@0.4.1` is public on the VS Code Marketplace. See [`docs/external-status.md`](docs/external-status.md).

## Coverage at a glance

| Domain | Knowledge | Worked examples | Skill |
|---|---|---|---|
| Design tokens (W3C DTCG, OKLCH) | ✓ | ✓ | `color-palette` |
| Components (Ant + MUI + shadcn synthesis) | ✓ | 210 component specs | `component-spec-writer` |
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

### Option A: Git clone / local install

```bash
git clone https://github.com/sungjin9288/design-ai.git
cd design-ai
./install.sh
```

### Option B: NPM

Use this path for the public npm package.

```bash
npx @design-ai/cli install
```

Or globally:

```bash
npm install -g @design-ai/cli
design-ai install
```

### Option C: Homebrew tap

```bash
brew tap sungjin9288/design-ai https://github.com/sungjin9288/design-ai.git
brew install design-ai
design-ai install
```

Any available path installs all 20 skills, 17 commands, and 4 agents under `~/.claude/` with the `design-` prefix. Restart Claude Code; try:

```
/design-component-spec Banner
/design-motion-design landing hero loop
/design-spatial Vision Pro productivity app
/design-website-improvement Korean SaaS homepage conversion and SEO control tower
/design-from-brief Korean fintech for freelancers
```

CLI commands: `design-ai install [--json]`, `update [--dry-run] [--json]`, `uninstall [--json]`, `status [--json]`, `list [skills|commands|agents] [--json]`, `route <brief|--from-file file|--stdin|--list|--eval-template|--eval> [--limit N] [--explain] [--strict] [--json]`, `routes [--json]`, `prompt <brief|--from-file file|--stdin|--eval-template|--eval> [--out file] [--route id] [--with-learning] [--learning-category kind] [--learning-limit N] [--with-recall] [--recall-limit N] [--strict] [--json]`, `pack <brief|--from-file file|--stdin|--eval-template|--eval> [--out file] [--route id] [--with-learning] [--learning-category kind] [--learning-limit N] [--with-recall] [--recall-limit N] [--max-bytes N] [--strict] [--json]`, `learn [--init|--remember text|--feedback text|--list|--export|--query text|--explain|--recall query|--backup|--redact|--verify|--diff|--restore|--restore-backups [--prune]|--import|--audit [--fix]|--curate|--stats|--usage|--signals [--strict]|--agent-backlog [--strict]|--propose-skills [--min-evidence N] [--review-file path] [--review-check|--apply-plan] [--strict]|--eval-template|--eval [--strict]|--forget id|--clear] [--json|--report|--patch|--review-template] [--out file]`, `check <artifact.md|--stdin|--examples> [--route id|--all-routes] [--issues-only] [--strict] [--learn [--yes] [--learning-file path]] [--json]`, `workspace [--root path] [--learning-file path] [--learning-usage path] [--learning-eval path] [--strict] [--json]`, `site <workspace.json|--stdin> [--strict] [--json|--mcp-check [--probes]|--mcp-plan [--probes] [--json]|--next-actions [--json]|--graph|--tasks|--bundle|--report|--prompts|--prompt id [--task id]] [--out file] | site <bundle-dir> --bundle-check [--json] | site <bundle-dir> --bundle-compare other-bundle-dir [--json] | site <bundle-dir> --bundle-handoff [--task id] [--json] | site <bundle-dir> --bundle-repair [--yes] [--json] [--out file] | site --init --name name --live-url url [--next-actions] [--out file] | site --init --name name --live-url url --bundle --out dir | site --from-intake file.md|--stdin [--json|--next-actions [--json]|--tasks|--bundle [--tasks] --out dir] [--out file] | site --intake-template [--language en|ko] [--json] [--out file] | site --sample [--out file] | site --prompt-list [--json]`, `examples [query|--route id] [--limit N] [--json]`, `search <query> [--dir kind] [--limit N] [--ranked] [--embeddings [--provider "cmd args"]] [--json]`, `index [--build|--status|--verify] [--json] [--embeddings [--provider "cmd args"]]`, `show <file[:line]> [--lines N:M] [--context N] [--json]`, `audit [--strict] [--quiet] [--json]`, `doctor [--strict] [--json] [--fix]`, `mcp`, `version [--json]`, `help [command|--json]`.

See [`docs/DISTRIBUTION.md`](docs/DISTRIBUTION.md) for the full distribution guide.

## Install (other agents)

| Agent | Setup |
|---|---|
| **Codex CLI** | Open this dir as project root. `AGENTS.md` is read automatically. [Walkthrough](docs/integrations/codex-walkthrough.md). |
| **Claude Code / Codex via MCP** | Add `design-ai mcp` as a local stdio MCP server. [MCP server guide](docs/integrations/design-ai-mcp-server.md). |
| **Cursor** | Open this dir; symlink or copy `AGENTS.md` to `.cursorrules`. [Walkthrough](docs/integrations/cursor-walkthrough.md). |
| **Aider** | Pass `AGENTS.md` as system prompt. [Walkthrough](docs/integrations/aider-walkthrough.md). |
| **Anthropic / OpenAI SDK** | Embed relevant skill `PLAYBOOK.md` files in your prompt. [Walkthrough](docs/integrations/sdk-walkthrough.md). |
| **VS Code** | Install the public Marketplace extension for sidebar trees + quick-pick commands. [Walkthrough](docs/integrations/vscode-walkthrough.md). |
| **Node.js / Agent SDK** | `import { route, prompt, pack, search, recall, check, routes, version } from "@design-ai/cli/sdk"` — call design-ai's deterministic verbs as functions, no CLI shell-out or MCP server needed. Read-only (Phase A). [SDK reference](docs/SDK.md). |
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
├── knowledge/               # 94 hand-written + extracted knowledge files
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
├── examples/                # 221 worked outputs (what "good" looks like)
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

See [`docs/ROADMAP.md`](docs/ROADMAP.md) for the full phase log and [`docs/PRODUCT-READINESS.md`](docs/PRODUCT-READINESS.md) for the current completion boundary. Currently at **v4.58.0**: public npm publish, provenance-backed GitHub Actions release, public registry smoke, Website Console MCP readiness, workspace learning restore/eval coverage, handoff bundle verification, and 90%+ component coverage are complete.

Core design consulting workflows are locally release-ready. The website improvement control tower ships as a zero-dependency static Web App plus a `website-improvement` route/skill/command, covering Site Profiles, audit checklists, MCP readiness, refactor prompts, handoff evidence tracking, and bundle export/verify/repair. Local learning preferences are available through `design-ai learn` — profile bootstrap, feedback capture, a read-only signals registry, skill-proposal generation from repeated QA signals, and full backup/restore/curate/audit tooling, all local-only and opt-in. AI model training or fine-tuning remains outside the shipped scope.

Full assertion-level detail for every one of the surfaces above — including every `learn`, `site`, and `workspace` flag and what it verifies — lives in [`docs/RELEASE-GATES.md`](docs/RELEASE-GATES.md).

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
- Run `npm run release:check` as the core gate before release PRs or tags. It wraps `npm test` (CLI unit tests), `npm run audit:strict` (all 8 audits), `git diff --check` (whitespace), `npm run package:check` (package contents), `npm run release:metadata` (release metadata + Product Readiness guard), `npm run release:self-test` (release assertion self-tests), and `npm run package:smoke` (packed-tarball smoke covering install, `site`, `workspace`, `learn`, and help/version/audit surfaces for both installed-bin and one-shot `npm exec --package <tarball>` paths).
- After npm publish completes, run `npm run registry:smoke` to verify the same surfaces against the public `npm exec --package` install path.
- Knowledge files use `<!-- hand-written -->` marker if hand-authored.
- Skill PLAYBOOKs include a verification phase checklist.
- Korean strings spelled out in Korean (no machine translation passing through).
- All audits pass.
- Before pushing for CI, run `npm run ci:local` when you need local parity with the non-publishing GitHub workflows. It wraps `release:check`, Python syntax checks, knowledge size budget, VS Code extension compile/unit tests, the MkDocs build, and the MkDocs warning policy used by the docs deployment workflow: no non-`refs/` warnings, with refs-only warnings capped at the accepted baseline.

The exhaustive list of every command and flag that `release:check`, packed-tarball smoke, and registry smoke assert on is preserved in [`docs/RELEASE-GATES.md`](docs/RELEASE-GATES.md).

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
