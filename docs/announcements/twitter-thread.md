# X / Twitter thread drafts

Two parallel threads — one English, one Korean. Post 2 hours apart so they don't compete for retweets.

## English thread (8 tweets)

### 1/8 (hook)

```
After 32 phases, design-ai hit v4.0 stable today.

It turns any AI coding agent (Claude Code, Codex, Cursor, Aider) into
a senior product designer. With Korean market depth baked in.

  npx @design-ai/cli install

Architecture choices that shaped it 🧵
```

(images: stats card from press-kit.md)

### 2/8 (model-agnostic)

```
1/ Markdown is the source of truth, not vendor-specific skills.

Same content runs in Claude Code (skills + commands), Codex CLI
(AGENTS.md), Cursor (.cursorrules), Aider (--read), VS Code sidebar
extension, or as a system prompt for any LLM.

Lock-in costs adopters. Markdown costs nothing.
```

### 3/8 (Korean depth)

```
2/ Korean conventions aren't a footnote, they're domain depth:

• Toss / KakaoPay payment flow trees
• 본인인증 (PASS / NICE / KCB) integration
• Pretendard fallback chains
• 해요체 vs 합쇼체 chatbot register
• 확률 표시 (game UI)
• KFDA / GRAC / 분리배출 (regulatory)
```

### 4/8 (distribution before content)

```
3/ Distribution before mass content.

At 30% component coverage I built:
• npm CLI
• Homebrew formula
• mkdocs site (EN + KO)
• Claude plugin manifest
• VS Code extension

A 30% corpus adopters can install > 70% locked in a private repo.
Coverage caught up later (now 55%).
```

### 5/8 (audit-driven quality)

```
4/ 6 audits gate every PR:

• frontmatter shape
• 360+ internal links
• Korean voice/register
• component coverage diff
• integration walkthrough completeness
• stale-content (>12mo = CI failure)

Each new audit prevented a regression class.
```

### 6/8 (the journey)

```
v2.0 → v4.0 in numbers:

  Knowledge files     55 → 91
  Worked examples     83 → 160
  Skills              12 → 19
  Slash commands       8 → 15
  Coverage           24% → 55%
  Channels             1 → 4
  Languages            0 → 2
  Audits               4 → 6
```

### 7/8 (what v4.0 means)

```
v4.0 is a graduation release.

8 surfaces (knowledge / skills / commands / agents / CLI / plugin /
VS Code / docs) are now API-stable.

Deprecation policy: deprecate in 4.x → maintain in 4.x → remove in 5.0.

Adopters can pin and trust.
```

### 8/8 (CTA)

```
Try it:

  npx @design-ai/cli install

GitHub: https://github.com/sungjin/design-ai
Docs: (mkdocs URL)
License: MIT

Questions, feedback, or contributions: GitHub Issues.

Especially curious about your Cursor + Figma + Korean fintech setups.
```

## Korean thread (8 tweets, 한국어)

### 1/8 (훅)

```
오늘 design-ai가 v4.0 stable에 도달했어요.

모든 AI 코딩 에이전트 (Claude Code / Codex / Cursor / Aider)를 시니어
프로덕트 디자이너로 만드는 오픈소스. 한국 시장 컨벤션이 기본 내장.

  npx @design-ai/cli install

만들면서 한 선택들 🧵
```

### 2/8 (모델 무관)

```
1/ 마크다운이 진실의 원천. 벤더 전용 스킬 파일 아님.

같은 콘텐츠가 Claude Code (스킬 + 커맨드), Codex CLI (AGENTS.md),
Cursor (.cursorrules), Aider (--read), VS Code 확장에서 모두 동작.

Lock-in은 adopter한테 비용. 마크다운은 공짜.
```

### 3/8 (한국 시장 깊이)

```
2/ 한국 컨벤션은 footnote가 아니라 도메인 깊이:

• Toss / KakaoPay 결제 흐름 트리
• 본인인증 (PASS / NICE / KCB) 통합
• Pretendard fallback 체인
• 해요체 vs 합쇼체 챗봇 톤 분기
• 확률 표시 (게임 UI)
• KFDA / GRAC / 분리배출 (규제)
```

### 4/8 (배포 우선)

```
3/ 컨텐츠 양 늘리기 전에 배포 가능하게.

커버리지 30%일 때 만들어 놓은 것:
• npm CLI
• Homebrew formula
• mkdocs 사이트 (EN + KO)
• Claude plugin manifest
• VS Code 확장

설치 가능한 30% > private repo의 70%. 커버리지는 나중에 따라잡았어요
(현재 55%).
```

### 5/8 (감사 주도 품질)

```
4/ PR마다 6개 감사 게이팅:

• frontmatter 형식
• 360+ 내부 링크
• 한국어 voice / register
• 컴포넌트 커버리지 diff
• 통합 워크스루 완전성
• stale-content (>12개월 = CI 실패)

각 감사가 회귀 케이스 한 종류씩 막아 줘요.
```

### 6/8 (여정)

```
v2.0 → v4.0 숫자로:

  지식 파일      55 → 91
  워크드 예제    83 → 160
  스킬           12 → 19
  슬래시 커맨드   8 → 15
  커버리지      24% → 55%
  배포 채널       1 → 4
  언어            0 → 2
  CI 감사         4 → 6
```

### 7/8 (v4.0 의미)

```
v4.0은 그래듀에이션 릴리스.

8개 표면 (지식 / 스킬 / 커맨드 / 에이전트 / CLI / plugin / VS Code /
docs) 이 API stable.

deprecation 정책: 4.x에서 deprecate → 4.x 유지 → 5.0에서 제거.

adopter가 pin하고 믿을 수 있어요.
```

### 8/8 (CTA)

```
시작하기:

  npx @design-ai/cli install

GitHub: https://github.com/sungjin/design-ai
문서 (한국어): docs/USING.ko.md
라이선스: MIT

질문 / 피드백 / 기여: GitHub Issues.

Cursor + Figma + 한국 핀테크 워크플로 케이스 특히 궁금해요.
```

## Posting timing

- **English thread**: Tuesday-Thursday 8am PT (16:00 UTC).
- **Korean thread**: same day, KST 9am (00:00 UTC) — 8 hours offset
  from English to hit different timezones.
- Reply to first 5 comments in each thread within 30 minutes.

## Hashtags (last tweet only — clutters earlier ones)

EN: `#opensource #design #ai #claude #korea #cursor`
KO: `#오픈소스 #디자인 #AI #한국 #코드 #프론트엔드`

## Don't

- Don't use the same image in both threads (algorithm dedupe).
- Don't @-mention Anthropic / Claude unless tagged organically.
- Don't post both threads at the same minute — algorithm flags
  duplicates.
- Don't auto-translate the Korean thread from English. It's written
  in natural Korean.
