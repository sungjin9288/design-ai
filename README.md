# Design AI

[![Audit](https://img.shields.io/badge/audit-passing-brightgreen)](https://github.com/sungjin9288/design-ai/actions/workflows/audit.yml)
[![Docs](https://img.shields.io/badge/docs-live-indigo)](https://sungjin9288.github.io/design-ai/)
[![Knowledge files](https://img.shields.io/badge/knowledge-97-blue)](knowledge/PRINCIPLES.md)
[![Examples](https://img.shields.io/badge/examples-226-blue)](examples/README.md)
[![Skills](https://img.shields.io/badge/skills-21-blue)](skills/README.md)

> 🇺🇸 English / [🇰🇷 한국어](https://github.com/sungjin9288/design-ai/blob/main/README.ko.md)

A model-agnostic design knowledge base + skill system. Drop it in front of any AI coding agent (Claude Code, Codex CLI, Cursor, Aider) and it becomes a senior product designer with 20+ years of experience — opinionated, accessible-by-default, Korean-market-fluent.

> **Not a model. Not a fine-tune.** A structured corpus of design expertise + agent-ready instructions that turn a general-purpose LLM into an expert.

> **Distribution status, checked 2026-07-14:** GitHub Release `v5.0.0` and `@design-ai/cli@5.0.0` are public. npm `latest` points to `5.0.0`, the package carries SLSA provenance from GitHub Actions Trusted Publishing, and both the publish workflow and a separate live `npm run registry:smoke` passed. The Homebrew formula is pinned to `v5.0.0`, GitHub Pages docs are live, and `sungjin.design-ai-vscode@0.4.1` remains public on the VS Code Marketplace. See [`docs/external-status.md`](docs/external-status.md).

## Coverage at a glance

| Domain | Knowledge | Worked examples | Skill |
|---|---|---|---|
| Design tokens (W3C DTCG, OKLCH) | ✓ | ✓ | `color-palette` |
| Components (Ant + MUI + shadcn synthesis) | ✓ | 210 component specs | `component-spec-writer` |
| UX patterns (auth, pricing, hero, forms, etc.) | ✓ | ✓ | `ux-audit`, `design-critique` |
| Web/app interface craft (response, frequency, continuity, interruptibility) | ✓ | ✓ | `design-engineering-review` |
| Agentic design workflows (MCP, artifact contracts, human gates) | ✓ | ✓ | `agentic-design-development`, `website-improvement`, `design-system-builder` |
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

The current source installs 21 skills, 16 public slash commands, and 4 agents under `~/.claude/` with the `design-` prefix. Restart Claude Code; try:

```
/design-component-spec Banner
/design-motion-design landing hero loop
/design-spatial Vision Pro productivity app
/design-website-improvement Korean SaaS homepage conversion and SEO control tower
/design-from-brief Korean fintech for freelancers
```

CLI commands include `design-ai start <brief|--from-file file|--stdin> ...`, the canonical `design-ai review <source.html> --brief text ...` workflow, self-validating `design-ai review-handoff <review-workflow.json> --recipient name ...`, consumer-side `design-ai review-handoff-verify <review-handoff.json> --consumer name ...`, `design-ai review-pack [id]`, the lower-level `design-ai inspect <source.html> --brief text --review-pack <id> ...`, and approval-gated `design-ai verify-browser <quality-report.json> ...` alongside the existing install, route, prompt, artifact, pack, learn, check, workspace, site, corpus, audit, MCP, version, and help workflows. Run `design-ai help --json` for the complete machine-readable catalog or `design-ai help <command>` for exact options.

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
| **Node.js / Agent SDK** | `import { artifact, start, reviewHtml, reviewHandoff, verifyReviewHandoff, inspectHtml, route, prompt, pack, search, recall, check, routes, version } from "@design-ai/cli/sdk"` — call design-ai's deterministic verbs as functions, no CLI shell-out or MCP server needed. Read-only except the explicit `learn.*` namespace. [SDK reference](docs/SDK.md). [Walkthrough](docs/integrations/agent-sdk-walkthrough.md). |
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
├── knowledge/               # 96 hand-written + extracted knowledge files
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
├── examples/                # 226 worked outputs (what "good" looks like)
│
├── skills/                  # 21 reusable playbooks (task-focused)
│   ├── design-system-builder/   illustration-designer/
│   ├── component-spec-writer/   print-designer/
│   ├── color-palette/           video-designer/
│   ├── ux-audit/                game-ui-designer/
│   ├── design-critique/         conversational-ui-designer/
│   ├── handoff-spec/            spatial-designer/
│   ├── design-system-qa/        document-author/
│   ├── design-pr-review/        website-improvement/
│   ├── design-engineering-review/
│   ├── figma-token-sync/        slide-deck-author/
│   ├── motion-designer/
│   └── design-broadcast/
│
├── agents/                  # 4 sub-agents (parallel reviews)
│   ├── design-critic.md         a11y-reviewer.md
│   ├── component-architect.md   token-extractor.md
│
├── commands/                # 16 public slash commands
│   ├── design-from-brief.md     motion-design.md
│   ├── component-spec.md        illustration.md
│   ├── design-review.md         website-improvement.md
│   ├── print.md
│   ├── palette-from-brand.md    video.md
│   ├── document-from-brief.md   game-ui.md
│   ├── slide-deck.md            conversational.md
│   ├── iterate.md               spatial.md
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
| [OpenTag](https://github.com/CopilotKit/OpenTag) | Agentic inline results and human-gated action workflow reference |
| [WWIT](https://wwit.design/) | Korean app pattern taxonomy reference |
| [React Bits](https://reactbits.dev/) | Animated React component adoption-gate reference |

Maintainers can refresh refs/ with `./tools/extractors/run-all.sh`; token extraction is clone-only tooling, documented at `tools/extractors/README.md`.

## Status

See [`docs/ROADMAP.md`](docs/ROADMAP.md) for the full phase log and [`docs/PRODUCT-READINESS.md`](docs/PRODUCT-READINESS.md) for the current completion boundary. **v5.0.0** is the published baseline with 21 skills, 16 public commands, 4 review agents, 17 MCP tools, and 10 SDK exports. It adds the `agentic-design-development` route, the read-only `design_ai_site_bundle_handoff`, `design_ai_site_linked_preview`, and `design_ai_artifact` tools, the SDK `artifact()` adapter, and the `design-engineering-review` skill/route for evidence-grounded web/app interface craft review. The linked-preview operation reads only root project metadata and prepares an operator-controlled preview loop without starting a process, probing a URL, scanning source files, or mutating the target repo. The shared artifact operation produces `implementation-plan`, `critique-loop`, and agent-readable `DESIGN.md` contracts across CLI, SDK, MCP, and Website Console. The release also restores dashboard chart knowledge, makes token extraction clone-only, strengthens public-contract and PR verification, and records removal of the former public `extract-tokens` command at the major-version boundary.

The current unreleased source adds the read-only `design-ai start` entry flow, an evidence-backed HTML inspector, five opt-in Korean product review packs, the optional CLI-only browser evidence runner, and `design-ai benchmark` for repeatable specialization proof. `design-ai review`, SDK `reviewHtml()`, MCP `design_ai_review_html`, and Website Console combine the start plan and static report into one canonical session with exact source identity, artifact linkage, ordered stages, and a pending human decision. `design-ai review-handoff`, SDK `reviewHandoff()`, MCP `design_ai_review_handoff`, and Website Console turn that session into a self-validating but undelivered handoff. `design-ai review-handoff-verify`, SDK `verifyReviewHandoff()`, MCP `design_ai_verify_review_handoff`, and Website Console let the named consumer revalidate the exact handoff bytes and issue a separate receipt without claiming identity, transport, acceptance, target-repository intake, or implementation. `design-ai inspect`, SDK `inspectHtml()`, and MCP `design_ai_inspect_html` share the lower-level eight-lens quality report; `design-ai review-pack`, SDK `reviewPack()`, and MCP `design_ai_review_pack` expose the same fintech, commerce, SaaS, content, and game contracts. This brings the source contract to 23 MCP tools and 16 SDK exports. The CLI-only benchmark runs four packaged synthetic cases for new design, existing-product refactor, Korean product UX, and multi-agent handoff. It compares contract validity and exact finding IDs without an aggregate quality score or a claim of real customer adoption. Static markup defects are confirmed with source locations; interaction, motion, performance, keyboard, accessibility-tree, Korean wrapping and density, payment or probability disclosure, and rendered responsive behavior stay `unverified` until approved browser or scenario evidence exists. Website Console preserves imported receipt, handoff, review, quality, and browser JSON bytes, displays their contracts without upgrading evidence, and checks sidecar digest and viewport coverage. The browser runner adds no production browser dependency, accepts loopback previews only, compares the source-report digest after adapter exit, and confines its own sidecar files to `~/.design-ai/evidence/browser/`. Its user-supplied adapter executes only after `--yes`, attests to the requested network policy, and remains an unsandboxed macOS/Linux boundary whose target-repository, external-write, and restored intermediate source-mutation behavior is recorded as `unverified`.

Core design consulting workflows are locally release-ready. The website improvement control tower ships as a zero-dependency static Web App plus a `website-improvement` route/skill/command, covering Site Profiles, audit checklists, MCP readiness, refactor prompts, handoff evidence tracking, bundle export/verify/repair, linked-code preview readiness, and an explicit read-only intake → human approval → target-repo implementation → browser evidence contract. Greenfield homepage work can create a strict handoff from a repo URL or local path before a live URL exists; `design-ai site <workspace.json> --linked-preview --json` then detects the existing manual start command from root metadata. Browser and deployment evidence remains required after the operator starts a preview. Local learning preferences are available through `design-ai learn` — profile bootstrap, feedback capture, a read-only signals registry, skill-proposal generation from repeated QA signals, and full backup/restore/curate/audit tooling, all local-only and opt-in. AI model training or fine-tuning remains outside the shipped scope.

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
- Install the documentation toolchain once with `pip install -r docs/requirements.txt`; `release:check` includes the MkDocs build and warning policy.
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
