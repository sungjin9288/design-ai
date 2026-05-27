# Show HN draft

Submission target: <https://news.ycombinator.com/submit>

## Title (max 80 chars)

```
Show HN: design-ai – senior product designer for any AI coding agent
```

Alt titles (rotate if first doesn't catch):
- `Show HN: Design knowledge base for Claude Code, Codex, Cursor, Aider`
- `Show HN: design-ai – 91 design files, 19 skills, model-agnostic`

## URL field

`https://github.com/sungjin9288/design-ai`

## Text field (Show HN body, optional but recommended)

```
Hey HN —

design-ai is a hand-curated design knowledge base that turns any AI
coding agent into a senior product designer. It plugs into Claude
Code (skills + commands + agents), Codex CLI (AGENTS.md), Cursor
(.cursorrules), Aider (--read), or any LLM via plain prompts.

What's in it:
- 91 knowledge files synthesized from Ant Design + MUI + shadcn-ui
- Tokens, components, motion, illustration, print, video, game UI,
  conversational, and spatial design
- 19 skills with playbooks, 15 slash commands, 4 review agents
- 160 worked examples
- 6 CI audits gating every PR

What makes it different:
- Model-agnostic — markdown is the source of truth, not vendor-
  specific skill files
- Korean fintech / SaaS conventions baked in (Toss, KakaoPay,
  Pretendard, 본인인증, KFDA, GRAC, 분리배출)
- All knowledge files versioned (semver + last_updated + stability)
- Stale-content audit fails CI on files >12 months old

Try it:
  npx @design-ai/cli install

License: MIT.

This is v4.0 — the API is now stable across 8 surfaces. Deprecation
policy: deprecate in 4.x, remove in 5.0.

Happy to answer questions about the architecture choices, the
audit setup, or why I went corpus-first instead of model-fine-tuning.
```

## Comment-prep notes (for replying in thread)

Likely questions and prepared responses:

### "How is this different from just asking Claude to be a designer?"

> The corpus is the difference. A bare LLM produces generic design output —
> reasonable but not opinionated, not Korean-aware, not citing real design
> system precedent. design-ai's knowledge files cite Ant / MUI / shadcn for
> every claim, encode KR conventions (Pretendard, 본인인증, 합쇼체 vs
> 해요체), and the skills enforce verification phases (output must cite
> ≥2 references, cover all states, satisfy a11y).

### "Why model-agnostic? Just use Claude Code skills."

> Same content needs to work in Codex CLI (AGENTS.md convention), Cursor
> (.cursorrules), Aider (--read flag), VS Code extension. Encoding it
> only as Claude skill files locks adopters in. Markdown + JSON is the
> source of truth; the skill system is just one ergonomic surface on top.

### "55% component coverage seems low."

> 55% covers every flagship primitive across Ant + MUI + shadcn. Remaining
> 45% is mostly sub-components (Step.Item, Form.Field) and transition
> primitives. Coverage push to 70% is on the 4.x roadmap. I prioritized
> distribution + audit infrastructure over chasing 100% coverage on a
> private repo.

### "Korean-focused — does it work for English markets?"

> Yes. The non-Korean portions cover Western design systems exhaustively.
> Korean material is additive, in dedicated files (e.g.,
> korean-payments.md, korean-typography.md). Adopters who don't load
> KR-specific files get the Western corpus only.

### "Why no fine-tuning?"

> Fine-tuning means re-training every time a design system updates.
> Markdown is grep-able, human-auditable, version-controllable, and
> works with any LLM. If knowledge grows past ~100K tokens I'd add an
> embedding index — but it currently fits comfortably in context.

## After-submission tasks

- Refresh the HN tab every 10 min in the first 90 minutes — early
  upvote velocity decides front page.
- Reply to *every* substantive comment within 30 min. Show HN's
  ranking partly considers author engagement.
- If frontpaged: tag the moment in `docs/announcements/posted.md`
  with screenshot + final position.

## Don't

- Don't ask friends to upvote — HN flags vote rings.
- Don't reply defensively to criticism. Acknowledge, then offer
  evidence or roadmap.
- Don't post during US night (KST morning) — HN audience is mostly
  US/EU; aim Tuesday-Thursday 8-10am PT.
