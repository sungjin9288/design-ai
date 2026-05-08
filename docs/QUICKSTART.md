# Quickstart

Five minutes from clone to first design output.

## 1. Install (Claude Code)

```bash
git clone https://github.com/sungjin/design-ai.git ~/dev/design-ai
cd ~/dev/design-ai
./install.sh
```

That symlinks 19 skills, 15 commands, and 4 review agents under `~/.claude/`. Restart Claude Code (or open a new session) to pick them up.

Verify:

```bash
./install.sh --status
```

Should show 19 skills, 4 agents, 15 commands installed.

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
# Re-extract from refs/ (gitignored upstream sources)
./tools/extractors/run-all.sh

# Run audits manually
python3 tools/audit/frontmatter-check.py
python3 tools/audit/link-check.py
python3 tools/audit/korean-copy-check.py
python3 tools/audit/check-coverage.py

# Render HTML token preview
python3 tools/preview/render-tokens.py
```

CI runs the four audits on every PR.

## Next

- [`docs/USING.md`](USING.md) — per-agent setup deep dive.
- [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) — three-layer architecture explanation.
- [`docs/CONTRIBUTING.md`](CONTRIBUTING.md) — adding knowledge / skills / extractors.
- [`docs/PLUGIN-PACKAGING.md`](PLUGIN-PACKAGING.md) — packaging details (this file).
- [`docs/MCP-INTEGRATION.md`](MCP-INTEGRATION.md) — Figma / Notion / GitHub / Slack / Linear MCPs.

## Issues

If a skill produces output that's wrong / generic / hallucinatory: that's a knowledge gap. Open an issue with the skill name + the prompt + expected vs actual. Most fixes land in `knowledge/` (not the skill itself), keeping playbooks small and corpus large.
