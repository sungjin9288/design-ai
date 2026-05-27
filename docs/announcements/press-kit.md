# Press kit

Reusable assets for the v4.0 launch. Pick whichever fits the channel; don't reuse all of them in one post.

## One-liner

**EN**: design-ai turns any AI coding agent into a senior product designer with Korean market depth.

**KO**: design-ai는 모든 AI 코딩 에이전트를 한국 시장에 강한 시니어 프로덕트 디자이너로 바꿔 줘요.

## Two-liner

**EN**: design-ai is a model-agnostic knowledge base — 91 design files, 19 skills, 15 commands — that plugs into Claude Code, Codex CLI, Cursor, Aider, or any LLM. Korean fintech / SaaS conventions baked in.

**KO**: design-ai는 모델 무관 지식 베이스예요 — 디자인 파일 91개, 스킬 19개, 커맨드 15개 — Claude Code / Codex CLI / Cursor / Aider 어디든 연결돼요. 한국 핀테크 / SaaS 컨벤션이 기본 내장돼 있어요.

## Three-bullet summary

**EN**:
- **91 hand-curated knowledge files** synthesized from Ant Design + MUI + shadcn-ui — covers tokens, components, motion, illustration, print, video, game UI, conversational, spatial.
- **Korean market depth** — Toss / KakaoPay / Pretendard / 본인인증 / 합쇼체 vs 해요체 / KFDA / GRAC / 분리배출 conventions baked into every relevant domain.
- **Plugs into 5 AI tools** — Claude Code (skills + commands + agents), Codex CLI (AGENTS.md), Cursor (.cursorrules), Aider (--read), VS Code (sidebar extension), or plain prompts.

**KO**:
- **수작업 큐레이션 지식 91개** — Ant Design + MUI + shadcn-ui에서 종합. 토큰 / 컴포넌트 / 모션 / 일러스트 / 인쇄 / 영상 / 게임 UI / 음성 / 공간 모두 다뤄요.
- **한국 시장 깊이** — Toss / KakaoPay / Pretendard / 본인인증 / 합쇼체 vs 해요체 / KFDA / GRAC / 분리배출 컨벤션이 도메인마다 내장.
- **5개 AI 도구 연동** — Claude Code (스킬 + 커맨드 + 에이전트), Codex CLI (AGENTS.md), Cursor (.cursorrules), Aider (--read), VS Code (사이드바 확장).

## Stats card (v4.0.0)

```
design-ai v4.0.0 — Stable
─────────────────────────────────────
  91  knowledge files (all stable, all versioned)
 160  worked examples
  19  skills with playbooks
  15  slash commands
   4  review agents
55.3%  canonical component coverage
   4  distribution channels (npm / Homebrew / git / VS Code)
   5  integration walkthroughs (each EN + KO)
   2  site languages
   6  CI audits
─────────────────────────────────────
  npx @design-ai/cli install
```

## Origin / journey (300 words)

design-ai started as a personal Korean fintech design system. Over 32 phases (v2.0 → v4.0), it grew into a model-agnostic corpus that any AI coding agent can pick up.

The strategic moves that shaped it:
- **Knowledge first, skills second.** Skills without knowledge produce generic output. v2.x focused on depth (motion, illustration, print, video, game UI, conversational, spatial) before adding skills.
- **Distribution before mass content.** v3.0–3.4 made the corpus installable (npm CLI, Homebrew, doc site, plugin manifest) before pushing further coverage. A 30% corpus that adopters can install beats a 70% corpus locked in a private repo.
- **Korean primary audience early.** Every domain phase included Korean conventions (typography, voice, regulatory). Translations followed naturally.
- **Audit-driven quality.** 6 audits gate every PR. The audit count grew from 4 → 6 over the project; each new audit prevented a regression class.
- **One concern per phase.** Not "v2.1: motion + illustration + print" — separate phases. Easier to commit, easier to revert, easier to explain.

v4.0 graduates the corpus to API-stable. From v4.0 forward, deprecation cycles protect adopters: deprecate in 4.x, remove in 5.0.

What's next: VS Code marketplace publish, KR community feedback, coverage push 55% → 70%, semantic search index.

See [`docs/SESSION-LOG.md`](../SESSION-LOG.md) for the full narrative.

## FAQ

**Q: Is this a tool I install, or content I read?**
Both. The CLI installs symlinks into Claude Code so skills auto-load and slash commands work. Or read the markdown directly for any LLM.

**Q: Why "model-agnostic"?**
Knowledge is encoded as plain markdown + JSON. Same files work in Claude Code (skills), Codex CLI (AGENTS.md), Cursor (.cursorrules), Aider (--read), VS Code extension, or as system prompt for any LLM.

**Q: How is this different from Anthropic's Skills?**
Skills are the runtime; design-ai is the corpus. design-ai's skills are *implemented* using Claude Code's skill system, but the underlying knowledge files are vendor-neutral.

**Q: Why Korean focus?**
Author is Korean; primary audience is Korean designers / B2B / fintech. KR conventions are deep (Toss, Kakao, Pretendard, 본인인증, regulatory) and underserved by Western design systems.

**Q: Is the Korean content machine-translated?**
No. All Korean content is hand-written in natural Korean. The `korean-copy-check.py` audit specifically catches machine-translation artifacts.

**Q: Coverage is 55%. Why not 100%?**
Remaining canonicals are mostly sub-components (e.g., `Step.Item` of `Steps`) or transition primitives. The 55% covers all flagship primitives across Ant + MUI + shadcn. Coverage push to 70% is on the 4.x roadmap.

**Q: License?**
MIT. Use it commercially. Fork it. Translate it.

**Q: Can I contribute?**
Yes — see [`docs/CONTRIBUTING.md`](../CONTRIBUTING.md) (or [`docs/CONTRIBUTING.ko.md`](https://github.com/sungjin9288/design-ai/blob/main/docs/CONTRIBUTING.ko.md)).

## Links

- **Repo**: https://github.com/sungjin9288/design-ai
- **NPM**: https://www.npmjs.com/package/@design-ai/cli
- **Docs**: (deployed mkdocs URL — fill in after `docs.yml` workflow runs)
- **Changelog**: https://github.com/sungjin9288/design-ai/blob/main/CHANGELOG.md
- **License**: MIT

## Author

Sungjin Park — sungjin9288@gmail.com
