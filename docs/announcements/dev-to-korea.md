# dev.to post draft

Target: <https://dev.to/new>. Tags: `#korea`, `#ai`, `#design`, `#claude`, `#opensource`.

## Title

```
design-ai v4.0: turn any AI coding agent into a senior product designer (with Korean market depth)
```

Alt titles:
- `Building a model-agnostic design knowledge base for Claude Code, Codex CLI, Cursor`
- `Why I built a design system corpus that works in 5 different AI tools`

## Cover image

1280×720 — same template as hashnode (logo + stats card + install command).

## Body

```markdown
After 32 phases over the last few months, my open-source design knowledge
base — `design-ai` — hit v4.0 stable last week. Sharing the architectural
choices that shaped it, since a few of them go against common AI-tooling
conventions.

```bash
npx @design-ai/cli install
```

GitHub: https://github.com/sungjin/design-ai · License: MIT

## What design-ai is

A hand-curated design knowledge base that turns any AI coding agent into
a senior product designer. It plugs into:

- **Claude Code** — skills + commands + review agents
- **Codex CLI** — `AGENTS.md` convention
- **Cursor** — `.cursorrules`
- **Aider** — `--read` flag
- **VS Code** — sidebar extension (vendor-neutral, pairs with Copilot Chat / Cursor / Continue)
- **Plain prompts** — concatenate as system prompt for any LLM

Contains 91 knowledge files, 160 worked examples, 19 skills with
playbooks, 15 slash commands, 4 review agents, and 5 integration
walkthroughs (each in English and Korean).

## Three architectural choices

### 1. Markdown is the source of truth, not vendor-specific skill files

Most AI design tools encode their content as Claude-specific skills,
Cursor-specific rules, or vendor templates. That locks adopters in.

design-ai uses plain markdown + JSON. The Claude Code skill system is
just one ergonomic surface on top — `SKILL.md` is `PLAYBOOK.md` with
frontmatter wrapping. Same content works in Codex via `AGENTS.md`, in
Cursor via `.cursorrules`, in Aider via `--read`, in VS Code via the
sidebar extension, or as raw system prompt.

Trade-off: lose some Claude-specific ergonomics (e.g., automatic skill
invocation). Gain: portability across the entire AI tooling ecosystem.

### 2. Korean market is a first-class citizen, not a footnote

Most Western design system documentation treats non-English markets as
"localization concerns" — typography fallbacks, RTL, currency formatting.
design-ai treats Korean conventions as deep domain knowledge:

- **Payments**: Toss / KakaoPay / NaverPay decision tree, 본인인증
  (PASS / NICE / KCB) integration, 청약철회 disclosure, 표시광고법.
- **Typography**: Pretendard primary, fallback chain, 한글 optical
  adjustments.
- **Voice/chatbot**: 해요체 vs 합쇼체 register branching, Bixby /
  Clova / NUGU / Kakao i platform conventions.
- **Game UI**: 확률 표시 (mandatory probability disclosure), GRAC
  ratings, PC bang usability.
- **Video**: KFDA / KFTC ad disclosure, 자막 conventions.
- **Print**: 명함 90×50, 분리배출 표시 (recycling marks), KFDA / KATS
  regulatory.

Foundational docs (`README`, `QUICKSTART`, `AGENTS`, `DISTRIBUTION`,
`USING`, `CONTRIBUTING`, `ARCHITECTURE`) all have Korean equivalents.
5 integration walkthroughs translated. Audit script
(`korean-copy-check.py`) catches machine-translation artifacts.

### 3. Distribution before mass content

When the corpus was at ~30% component coverage, the temptation was to
push to 70% before doing anything else. Instead, I built distribution:

- npm CLI (`@design-ai/cli`)
- Homebrew formula
- Public mkdocs-material doc site (with English + Korean)
- Claude Code plugin manifest
- VS Code extension

A 30% corpus that adopters can install in one command beats a 70%
corpus locked in a private repo. Coverage push to 55% happened after
distribution was solid.

## v2.0 → v4.0 in numbers

| Surface | v2.0 | v4.0 |
|---|---|---|
| Knowledge files | 55 | 91 |
| Worked examples | 83 | 160 |
| Skills | 12 | 19 |
| Slash commands | 8 | 15 |
| Component coverage | ~24% | 55.3% |
| Distribution channels | 1 | 4 |
| Integration walkthroughs | 0 | 5 (EN + KO) |
| Site languages | 0 | 2 |
| CI audits | 4 | 6 |

## 6 audits gating CI

Every PR must pass:

1. `frontmatter-check.py` — YAML validity + version field shape
2. `link-check.py` — 360+ internal links resolve
3. `korean-copy-check.py` — Korean voice / register / typography
4. `check-coverage.py` — component coverage diff
5. `integration-check.py` — walkthrough completeness
6. `stale-check.py` — knowledge freshness (>12mo = CI failure)

Audit count grew from 4 → 6 over the project. Each new audit prevented
a regression class:

- `korean-copy-check` (v3.0) — auto-translation artifacts
- `integration-check` (v3.4) — walkthroughs missing required sections
- `stale-check` (v3.12) — content rotting under stable version pin

## Try it

```bash
# Quickest
npx @design-ai/cli install

# Or git clone
git clone https://github.com/sungjin/design-ai
cd design-ai && ./install.sh

# Or Homebrew (macOS)
brew tap sungjin/design-ai
brew install design-ai
```

After installing, in Claude Code:

```
/design-palette-from-brand
> Brand: Korean B2B SaaS, calm professional voice, primary blue.
```

In Codex CLI:

```bash
cd /path/to/design-ai
codex "Generate a color palette for a Korean fintech app"
```

In Cursor: drop `docs/integrations/cursor-walkthrough.md` into your
chat or follow the walkthrough.

## What's next (4.x roadmap)

- VS Code marketplace publish (1.0.0)
- Coverage push 55% → 70%
- Semantic search index (Algolia / Typesense)
- Component spec extractor v2 (TypeScript AST parsing)
- Quarterly stability re-review ritual (operationalized via stale-check)

## Feedback welcome

- GitHub Issues for bugs / feature requests / Korean convention
  additions.
- Korean translation / content contributions welcome — see
  [`docs/CONTRIBUTING.ko.md`](https://github.com/sungjin/design-ai/blob/main/docs/CONTRIBUTING.ko.md).
- Especially curious about: Cursor + Figma workflows, B2B SaaS team
  adoption patterns, non-Korean fintech market additions.

Thanks for reading.

— [@sungjin9288](https://github.com/sungjin)
```

## Posting tips

- **Best time**: Tuesday-Thursday 9-11am PT — dev.to algorithm
  weighs early engagement.
- **Reading time**: ~6 min (dev.to surfaces this).
- **Cover image**: matters a lot for click-through; see press-kit.md
  for spec.
- **Reply within 30min** to first comments — boosts thread visibility.
- **Cross-post**: dev.to → hashnode (set canonical URL) is OK; same
  text but different audiences.

## Don't

- Don't use auto-translation banners ("originally in Korean") —
  the post is written in English directly.
- Don't tag `#javascript` or `#react` aggressively — those tags
  drown out smaller-tag visibility.
- Don't post both dev.to and hashnode same hour. Stagger by 24h.
