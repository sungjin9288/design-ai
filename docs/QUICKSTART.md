# Quickstart

Five minutes from clone to first design output.

## 1. Install (Claude Code)

```bash
git clone https://github.com/sungjin9288/design-ai.git ~/dev/design-ai
cd ~/dev/design-ai
./install.sh
```

That symlinks 21 skills, 16 public slash commands, and 4 review agents under `~/.claude/`. Restart Claude Code (or open a new session) to pick them up.

Verify:

```bash
./install.sh --status
```

Should show 21 skills, 4 agents, and 16 public commands installed.

```bash
design-ai doctor
```

Use this when install state, runtime prerequisites, or symlink targets look wrong.
If the only warnings are missing design-ai symlinks, run `design-ai doctor --fix`.

```bash
design-ai route "audit a Figma signup flow for Korean fintech" --explain
design-ai routes
design-ai prompt "audit a Figma signup flow for Korean fintech"
design-ai artifact implementation-plan "refactor the account settings flow" --out implementation-plan.md
design-ai artifact critique-loop "revise the pricing page after design review" --out critique-loop.md
design-ai artifact design-contract "Korean fintech dashboard design system" --out DESIGN.md
design-ai review-pack korean-fintech
design-ai inspect page.html --brief "Review Korean fintech settings" --review-pack korean-fintech --locale ko-KR --viewport mobile --viewport desktop --json
design-ai benchmark --strict
design-ai pack "audit a Figma signup flow for Korean fintech" --max-bytes 80000
design-ai prompt --from-file product-brief.md --route design-review --out prompt.md
cat product-brief.md | design-ai pack --stdin --out prompt-pack.md
design-ai pack "audit a Figma signup flow for Korean fintech" --out audit-pack.md
design-ai check output.md --route component-spec --strict
design-ai check --examples --route design-from-brief --limit 1
design-ai check --examples --all-routes --issues-only
design-ai examples --route component-spec --limit 5
design-ai learn --init
design-ai learn --remember "Prefer dense Korean product UI" --category korean
design-ai learn --feedback "Keep audit findings short and evidence-led" --outcome keep
cat feedback.md | design-ai learn --feedback --stdin --outcome improve --category workflow
design-ai learn --backup --json --out learning-backup.json
design-ai learn --redact --json --out learning-redacted.json
design-ai learn --redact --from-file learning-backup.json --json --out learning-redacted.json --force
design-ai learn --verify --from-file learning-backup.json
design-ai learn --import --from-file learning-backup.json --dry-run
design-ai learn --list --category korean --limit 5
design-ai learn --list --query "keyboard accessibility" --explain --json
design-ai learn --audit
design-ai learn --audit --fix --dry-run
design-ai learn --stats --json
design-ai prompt "audit a Figma signup flow" --with-learning --learning-category korean --learning-limit 5
design-ai search Pretendard --dir knowledge --limit 5
design-ai show knowledge/PRINCIPLES.md:29
```

`design-ai benchmark` runs four packaged specialization cases and reports contract
validity, exact finding precision, permission boundaries, and remaining unverified
risk without an aggregate quality score. See [Product specialization benchmarks](BENCHMARKS.md).

Use CLI route + prompt + artifact + pack + check + examples + learn + search + show when you need the right command, reusable agent prompt, portable implementation/critique/DESIGN.md contract, bounded context, artifact QA, known-good references, opt-in local preferences, and exact knowledge file. `design-ai artifact` is read-only unless `--out` is explicit; even then it only writes the requested local file and keeps target-repo edits, dependency changes, migration, commit, push, deployment, and external writes behind human approval. `design-ai route --explain` shows why a route matched and how many referenced files are available. Generated prompts include the selected route id, routing reason, reference examples, files to read, execution rules, a suggested `design-ai check output.md --route <id> --strict` command, and a route-aware verification checklist. Generated packs add a context summary and warnings for truncated or unavailable files, and include the selected reference example files when available, so you can judge whether the bundle is complete before sending it to another agent. `design-ai learn` stores local preference entries, converts explicit `--feedback` into durable keep/improve/avoid guidance, accepts feedback from inline text, `--from-file`, or `--stdin`, supports category/query/limit filtering, creates full portable backups with `--backup --json`, creates shareable redacted backups with `--redact --json` from the local profile or portable JSON via `--redact --from-file` / `--redact --stdin`, writes JSON artifacts with `--out file` and refuses overwrites unless `--force` is provided, validates portable learning JSON with `--verify`, imports portable learning JSON with `--dry-run` preview plus confirmed `--yes` merge, includes non-mutating `--audit` inspection with cleanup suggestions, safe `--audit --fix --dry-run` previews plus confirmed `--fix --yes` cleanup, and `--stats` summaries, and includes confirmed `--forget`/`--clear` controls; `learn --list --query --explain` and `learn --export --query` show matching local preferences without recency fallback, with list explanations for score, matched tokens, and selection reason, while `prompt`/`pack --with-learning` includes entries only when explicitly requested, ranks them against the current brief before falling back to recency, can narrow injection with `--learning-category` plus `--learning-limit`, and carries a learned-context audit summary so warning profiles stay visible. `design-ai check` audits generated Markdown for grounding, unresolved markers, accessibility, responsive, screen-reader, misuse guidance, and route-specific evidence when `--route <id>` is provided. Add `--learn --yes` to capture warning/failure checks as local learning entries. Use `design-ai check --examples --route <id>` to run the same QA rules against worked examples for that workflow, or `design-ai check --examples --all-routes --issues-only` for a maintainer-wide example QA summary focused on gaps. `design-ai examples --route <id>` finds worked outputs for the workflow you selected. Use `--from-file` or `--stdin` for real product/design briefs that are too long for a shell line. Use `--route <id>` when automatic routing is close but you want a specific workflow; get ids from `design-ai routes`, `design-ai route --list`, or `design-ai route "..." --json`.

## 2. Three first tasks

### Task 1: Spec a component

```
/design-component-spec Banner
```

You get a developer-ready spec covering:
- Anatomy (parts table)
- API (props, types, defaults)
- States (default / hover / focus / active / disabled / loading / error)
- Variants (size, color, shape)
- Tokens consumed
- ARIA + keyboard contract
- Edge cases (empty / overflow / RTL / reduced motion)
- Code example
- Don't section

Iterate via natural language: "Add a closable variant", "What about Korean copy?".

### Task 2: Design review

Get a parallel UX + a11y + design critique on any artifact (screenshot, Figma link, URL):

```
/design-design-review [paste image or URL]
```

Returns: top recommendation, critical issues, accessibility findings, UX patterns to consider.

### Task 3: From scratch

```
/design-from-brief Korean fintech for freelancers — invoice, expense tracking, tax estimation. Trustworthy, calm, mobile-first. Pretendard typography, blue-led palette.
```

Generates a complete design system: palette + foundations + component baseline + 5-component starter set + handoff document.

## 3. Try a domain skill

The v2 expansion added 7 new domains. Each has a slash command:

| Command | Use |
|---|---|
| `/design-motion-design` | Spec motion (CSS / Framer Motion / GSAP / Lottie) |
| `/design-illustration` | Design or spec an illustration system |
| `/design-print` | Spec a print piece (business card, brochure, packaging) |
| `/design-video` | Spec video for marketing, social, in-product |
| `/design-game-ui` | Spec game UI (HUD, menus, inventory) |
| `/design-conversational` | Spec a chatbot, voice assistant, or AI chat |
| `/design-spatial` | Spec a VR / AR / Vision Pro experience |

Example:

```
/design-motion-design Hero loop for Korean fintech landing page. Toss-style restraint. 8 seconds. Mobile + desktop.
```

## 4. Browse the knowledge

When a skill needs context, it reads `knowledge/`. You can browse directly:

- [`knowledge/PRINCIPLES.md`](../knowledge/PRINCIPLES.md) — 30 load-bearing rules in one page.
- [`knowledge/COVERAGE.md`](../knowledge/COVERAGE.md) — what's documented and what's gap.
- [`knowledge/components/INDEX.md`](../knowledge/components/INDEX.md) — component coverage map.

## 5. For other agents

| Agent | How |
|---|---|
| **Codex CLI** | Open this dir as project root. `AGENTS.md` is auto-loaded. |
| **Cursor** | Open this dir; symlink `AGENTS.md` to `.cursorrules`. |
| **Aider** | `aider --read AGENTS.md` |
| **Plain prompt** | Paste any `skills/*/PLAYBOOK.md` body into your prompt. |
| **Anthropic SDK** | Embed PLAYBOOK.md in system prompt; reference relevant `knowledge/*.md` files. |

Each `PLAYBOOK.md` is self-contained and works without the rest of the repo if pasted whole.

## Korean defaults

If your audience is Korean:
- Skills auto-apply 해요체 (friendly) for B2C, 합쇼체 (formal) for B2B / banking.
- Pretendard typography is the default.
- 명함 90×50 (not international 85×55) for business cards.
- KFDA / 표시광고법 / 정보통신망법 / 게임산업진흥법 compliance built into print / video / game-ui skills.
- 본인인증 (PASS / NICE / KCB) flows in auth skill.
- KR stock-chart inversion (red=up, blue=down) in `knowledge/i18n/`.

Override via skill input: "international primary, English copy".

## Maintaining

```bash
# Maintainer-only: re-extract from refs/ (gitignored upstream sources)
./tools/extractors/run-all.sh

# Run audits manually
design-ai audit --strict

# Render HTML token preview
python3 tools/preview/render-tokens.py
```

CI runs the eight audits on every PR.

## Next

- [`docs/USING.md`](USING.md) — per-agent setup deep dive.
- [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) — three-layer architecture explanation.
- [`docs/CONTRIBUTING.md`](CONTRIBUTING.md) — adding knowledge / skills / extractors.
- [`docs/PLUGIN-PACKAGING.md`](PLUGIN-PACKAGING.md) — packaging details (this file).
- [`docs/MCP-INTEGRATION.md`](MCP-INTEGRATION.md) — Figma / Notion / GitHub / Slack / Linear MCPs.

## Issues

If a skill produces output that's wrong / generic / hallucinatory: that's a knowledge gap. Open an issue with the skill name + the prompt + expected vs actual. Most fixes land in `knowledge/` (not the skill itself), keeping playbooks small and corpus large.
