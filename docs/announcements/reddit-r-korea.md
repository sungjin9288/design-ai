# Reddit drafts

Two parallel posts:
- **r/programming** (English, technical) — 2.5M members
- **r/korea** (Korean / English mix, KR-focused) — 250k members
- **r/ClaudeAI** (English, Claude-specific) — niche but high-affinity

Reddit moderation can be strict — read each subreddit's rules before posting. Avoid promotional language; lead with value.

## r/programming draft

### Title

```
design-ai v4.0: open-source design knowledge base that plugs into Claude Code, Codex CLI, Cursor, and Aider
```

### Body

```markdown
After working on this for a few months, my open-source design knowledge
base hit v4.0 stable. Sharing the architectural choices since some
go against AI-tooling norms.

**What it is**: a model-agnostic markdown corpus (91 knowledge files,
160 worked examples, 19 skills, 15 slash commands) that any AI coding
agent can pick up.

**Why model-agnostic**: most AI design tools encode content as
vendor-specific skill files. design-ai uses plain markdown + JSON, so
the same content works in:

- Claude Code (skills + commands + agents)
- Codex CLI (AGENTS.md convention)
- Cursor (.cursorrules)
- Aider (--read flag)
- VS Code sidebar extension
- or as a system prompt for any LLM

**Korean market depth**: this is the part that distinguishes it from
generic AI design tools. Western design system docs treat non-English
markets as "localization concerns." design-ai treats Korean conventions
as deep domain knowledge — Toss/KakaoPay payment flows, 본인인증
integration, Pretendard typography, 해요체 vs 합쇼체 chatbot register,
KFDA/GRAC/분리배출 regulatory.

**Audit-driven quality**: 6 audits gate every PR — frontmatter shape,
360+ internal links, Korean voice/register, component coverage diff,
walkthrough completeness, stale-content (>12mo files fail CI).

**Try it**:

    npx @design-ai/cli install

GitHub: https://github.com/sungjin9288/design-ai
License: MIT

Questions, feedback, contributions welcome.
```

### Reply prep

- "Why not just use [some other tool]?" → "design-ai is corpus,
  others are runtime. Most aren't mutually exclusive."
- "55% coverage seems low" → "covers all flagship primitives across
  Ant + MUI + shadcn. 70% is on roadmap."
- "Korean focus" → "Western corpus is exhaustive; KR is additive."

### r/programming rules check

- ✅ Self-promotion: allowed if tool is open-source + adds technical value.
- ✅ Title: descriptive, not clickbait.
- ⚠️ Posting freq: max 1 self-promo per week.
- ❌ Don't link to NPM directly — link GitHub.

## r/korea draft

### Title

```
[OC] AI 코딩 도구를 시니어 디자이너로 만드는 오픈소스 (한국 시장 중심) v4.0
```

Or English-friendly:

```
[OSS] design-ai v4.0 — design knowledge base with deep Korean conventions (Toss/Kakao/Pretendard)
```

### Body

Two-language post (Reddit allows mixed):

```markdown
**한국어 (Korean)**

지난 몇 개월 만든 오픈소스 design-ai가 v4.0 stable에 도달해서 공유드려요.

design-ai는 Claude Code / Codex CLI / Cursor / Aider 같은 AI 코딩
도구를 시니어 프로덕트 디자이너처럼 동작하게 만드는 지식 베이스예요.

**한국 시장 컨벤션이 깊게 내장**:
- Toss / KakaoPay / NaverPay 결제 흐름
- 본인인증 (PASS / NICE / KCB) 통합 패턴
- Pretendard 폰트 fallback
- 해요체 vs 합쇼체 챗봇 톤 분기
- 확률 표시, GRAC 등급 (게임)
- KFDA, KFTC, 분리배출 표시 (규제)

**한국어 문서**: README / QUICKSTART / AGENTS / DISTRIBUTION /
USING / CONTRIBUTING / ARCHITECTURE 모두 한국어 버전 있어요.

설치: `npx @design-ai/cli install`

GitHub: https://github.com/sungjin9288/design-ai · MIT 라이선스

---

**English**

design-ai v4.0 — open-source design knowledge base with deep Korean
market conventions baked in (Toss, KakaoPay, Pretendard, 본인인증,
해요체/합쇼체, KFDA/GRAC/분리배출).

Plugs into Claude Code, Codex CLI, Cursor, Aider, or any LLM.

Install: `npx @design-ai/cli install`

GitHub: https://github.com/sungjin9288/design-ai · MIT
```

### r/korea rules check

- ⚠️ Self-promotion: stricter than r/programming. Lead with KR value.
- ⚠️ Use `[OC]` flair for original content.
- ✅ Bilingual posts allowed and encouraged.

## r/ClaudeAI draft

### Title

```
design-ai v4.0 — 91 knowledge files + 19 skills + 15 commands for Claude Code (and other agents)
```

### Body

```markdown
Sharing my open-source design corpus that's optimized for Claude Code
but works in any AI coding agent.

**Claude Code specifics**:
- 19 skills auto-loaded via the skill system
- 15 slash commands (`/design-design-review`, `/design-palette-from-brand`,
  etc.)
- 4 review agents (design-critic, a11y-reviewer, component-architect,
  token-extractor)
- Plugin manifest at `.claude-plugin/plugin.json`

**Install**:

    npx @design-ai/cli install

This symlinks everything into `~/.claude/{skills,commands,agents}` so
slash commands and skill auto-loading just work.

**Worth highlighting for r/ClaudeAI**:
- All 91 knowledge files have versioned frontmatter
  (`version`, `last_updated`, `stability`).
- Skills include verification phases (output must cite ≥2 references,
  cover all states, satisfy a11y).
- Korean fintech / SaaS conventions baked in for KR adopters.

GitHub: https://github.com/sungjin9288/design-ai · MIT
```

## Don't (for all subs)

- Don't post on weekends — weekday traffic is higher and quality
  comments more likely.
- Don't reply to comments in the first 10 minutes — let the thread
  organic-rank first.
- Don't use the exact same body across subs (Reddit shadow-bans
  cross-posters).
- Don't include promotional language ("Check out my new tool!"). Just
  describe what it is.

## Posting cadence

- Day 1: HN + dev.to.
- Day 2: r/programming.
- Day 3: r/korea + r/ClaudeAI.
- Day 4-7: Twitter threads, hashnode, OKKY.

Spread out so each post gets full discussion cycle without competing
with the previous.
