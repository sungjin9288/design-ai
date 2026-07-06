# Agent SDK walkthrough

A concrete, copy-pastable walkthrough of driving design-ai entirely through the **programmatic Agent SDK** (`@design-ai/cli/sdk`) — the read-only verbs plus the opt-in `learn.*` local-write namespace. This is a different surface than [`docs/integrations/sdk-walkthrough.md`](sdk-walkthrough.md) (which embeds corpus Markdown into a model's system prompt via the Anthropic/OpenAI SDKs); this page is for driving design-ai's own deterministic functions — `route`, `pack`, `check`, `learn.captureFromCheck` — from your own Node.js program or agent runtime. See [`docs/SDK.md`](../SDK.md) for the full API reference.

## Prerequisites

```bash
npm install @design-ai/cli
```

```js
import { route, pack, check, learn } from "@design-ai/cli/sdk";
```

Only the `./sdk` subpath is exported — no CLI shell-out, no MCP server, no separate corpus clone. TypeScript types (`RouteResult`, `Pack`, `CheckReport`, `CaptureResult`, …) resolve automatically from `cli/sdk/index.d.ts` as long as your `tsconfig.json` sets `moduleResolution: "node16"` / `"nodenext"` (or `"bundler"`), so the subpath `types` condition is honored.

## Setup

Nothing to configure. The 8 read-only verbs (`route`, `prompt`, `pack`, `search`, `recall`, `check`, `routes`, `version`) never write to disk. The single write surface is the `learn` namespace (`learn.remember`, `learn.feedback`, `learn.captureFromCheck`) — every `learn.*` call writes only the local learning profile, and only when you call it. Point `DESIGN_AI_LEARNING_FILE` at a temp path any time you want to keep that write out of your real profile — which is what every walkthrough below does, so running these scripts never touches `~/.design-ai/learning.json`.

## Walkthrough 1: route a brief to a design-ai route

**Goal**: get a scored route recommendation for a task brief, so an agent knows which command/skills/knowledge to use next.

```js
import { route } from "@design-ai/cli/sdk";

const brief =
  "커뮤니티 앱의 게시물 신고 및 사용자 차단 플로우 설계 — " +
  "신고 사유 선택, 처리 상태 안내, 차단 후 상호작용 차단 범위";

const routed = route(brief, { limit: 3, explain: true });
console.log(routed.map((r) => `[${r.confidence}] ${r.id} score=${r.score}`));
```

```
[ '[low] design-from-brief score=1' ]
```

This is real output from dogfooding this exact brief — see [`docs/DOGFOOD-SDK-FINDINGS.md`](../DOGFOOD-SDK-FINDINGS.md) for the full run and the route-table gap it surfaced (F-1: no dedicated flow-design route yet, so a report/block brief falls back to `design-from-brief`). `route()` still returns a usable recommendation — that's what makes it safe to chain into `pack()` unconditionally, even on a low-confidence match.

## Walkthrough 2: pack a bounded context bundle

**Goal**: turn the same brief into a ready-to-use prompt plus a byte-bounded bundle of the corpus files an agent should read before authoring the artifact.

```js
import { pack } from "@design-ai/cli/sdk";

const packed = pack(brief, {
  routeId: routed[0].id,
  withRecall: true,
  recallLimit: 5,
  maxBytes: 60000,
});

console.log(packed.summary);
```

```
{
  totalFiles: 15,
  includedFiles: 15,
  truncatedFiles: 10,
  missingFiles: 0,
  usedBytes: 60000,
  maxBytes: 60000,
  remainingBytes: 0,
  usedRatio: 1,
  status: 'partial'
}
```

`pack()` never exceeds `maxBytes` — it fills the budget exactly (60,000/60,000 bytes here) and reports which files got truncated in `packed.warnings`, so an agent can decide whether to raise the budget or read a truncated file's remainder directly. `packed.plan` carries the same ready-to-use prompt `prompt()` would return; `packed.files` is the bounded bundle itself.

## Walkthrough 3: author the artifact (this is the agent's job)

**Goal**: the SDK does not write design artifacts — that's the LLM/agent's job, using `packed.plan` and `packed.files` as grounding. This walkthrough embeds a short sample artifact string so the script is runnable end-to-end without a live model call; in a real agent, replace `SAMPLE_ARTIFACT` with the model's actual Markdown output.

```js
// In a real agent, this string is the model's response — produced by
// feeding `packed.plan.prompt` and `packed.files` to your LLM call, then
// taking the Markdown it returns. Kept short here so the script runs
// standalone. See flow-example.test.mjs for the same constant (kept in
// lockstep with this walkthrough — the comment there points back here).
const SAMPLE_ARTIFACT = `# 게시물 신고 및 사용자 차단 플로우

Grounded in knowledge/patterns/ui-reasoning.md and knowledge/PRINCIPLES.md.

## 신고 플로우
1. 게시물 상세에서 "신고" 메뉴 선택 (keyboard: Tab으로 접근, Enter로 실행)
2. 신고 사유 목록에서 선택 (스팸, 욕설/혐오, 음란물, 사기, 기타) — 라디오 그룹, arrow key로 이동
3. 기타 선택 시 상세 사유 텍스트 입력 (최대 500자)
4. 제출 후 "신고가 접수되었습니다" 확인 화면 표시
5. 처리 상태: 접수 → 검토 중 → 조치 완료 (마이페이지 > 신고 내역에서 확인 가능)

## 차단 플로우
1. 사용자 프로필에서 "차단" 메뉴 선택
2. 확인 다이얼로그: "OO님을 차단하시겠어요?" — focus trap 적용, Escape로 취소
3. 차단 후 상호작용 범위: 서로의 게시물/댓글 비노출, DM 차단, 팔로우 자동 해제
4. 차단 사실은 상대방에게 통지되지 않음 (비통지 원칙)

## 반응형 동작
- Mobile: 전체 화면 시트로 신고 사유 목록 표시
- Desktop: 중앙 정렬 모달, 최대 너비 480px
- Tablet: mobile과 동일한 시트 레이아웃

## 접근성
- 신고 사유 목록: role="radiogroup", 각 항목 aria-checked
- 차단 확인 다이얼로그: focus-visible 스타일, aria-modal="true"
- Screen reader: 신고 접수 완료 시 aria-live="polite"로 상태 안내
- 대비: 경고/오류 텍스트는 최소 4.5:1 contrast ratio 확보 (WCAG AA)

## 하지 말아야 할 것 (Don't)
- Don't: 차단 시 상대방에게 알림을 보내지 마세요 (비통지 원칙 위반)
- Avoid: 신고 사유를 하나의 텍스트 필드로만 받는 방식 (분류 불가)
`;
```

## Walkthrough 4: check the artifact

**Goal**: score the authored artifact for grounding, accessibility, responsive, and route-specific requirements before shipping it.

```js
import { check } from "@design-ai/cli/sdk";

const checked = check(SAMPLE_ARTIFACT, { routeId: routed[0].id });
console.log(`${checked.status} ${checked.score}`);
```

```
warn 8/10
```

`checked.results` is the per-check breakdown (10 checks total here: 8 pass, 2 warns, 0 fail). One warn is `route-design-from-brief-design-system-foundation` — a route-specific check reporting that a flow-design artifact is missing design-system-foundation evidence, which is exactly what you'd expect from the F-1 route gap in walkthrough 1. The other, `korean-context`, flags that this short sample mentions no Korean-specific UX/market consideration — the fuller dogfooded artifact addressed it (정보통신망법 처리 기한 안내) and scored `warn 9/10` with only the route warn left. `check()` never writes anything; it's as read-only as `route` and `pack`.

## Walkthrough 5: capture check results into local learning

**Goal**: turn the check's non-pass results into local learning-profile entries — the one write in this whole flow, and it's opt-in and explicit.

```js
import { learn } from "@design-ai/cli/sdk";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// Point DESIGN_AI_LEARNING_FILE at a temp file so this never touches your
// real profile (~/.design-ai/learning.json by default).
const dir = mkdtempSync(path.join(tmpdir(), "design-ai-sdk-walkthrough-"));
process.env.DESIGN_AI_LEARNING_FILE = path.join(dir, "learning.json");

const captured = learn.captureFromCheck(SAMPLE_ARTIFACT, { routeId: routed[0].id });
console.log(`added ${captured.addedCount}, skipped ${captured.skippedCount}`);
```

```
added 2, skipped 0
```

Both non-pass results (the two warns from walkthrough 4) got captured into the temp profile at `process.env.DESIGN_AI_LEARNING_FILE`. Calling `captureFromCheck` again with the same artifact adds nothing new — every candidate is skipped as `duplicate-entry-text` (`added 0, skipped 2` on the second call), so re-running the flow on an unchanged artifact never grows the profile.

## Full script

Everything above, assembled into one runnable file:

```js
import { route, pack, check, learn } from "@design-ai/cli/sdk";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// Never touch the real profile — point learning writes at a temp file.
const dir = mkdtempSync(path.join(tmpdir(), "design-ai-sdk-walkthrough-"));
process.env.DESIGN_AI_LEARNING_FILE = path.join(dir, "learning.json");

const brief =
  "커뮤니티 앱의 게시물 신고 및 사용자 차단 플로우 설계 — " +
  "신고 사유 선택, 처리 상태 안내, 차단 후 상호작용 차단 범위";

// 1. route — score the brief against the route catalog.
const routed = route(brief, { limit: 3, explain: true });
const routeId = routed[0].id;
console.log(routed.map((r) => `[${r.confidence}] ${r.id} score=${r.score}`));

// 2. pack — bounded context bundle + ready-to-use prompt.
const packed = pack(brief, { routeId, withRecall: true, recallLimit: 5, maxBytes: 60000 });
console.log(packed.summary);

// 3. author — the LLM/agent writes the artifact here, grounded in
// packed.plan + packed.files. Embedded as a short sample so this script
// runs standalone. Kept in lockstep with cli/sdk/flow-example.test.mjs.
const SAMPLE_ARTIFACT = `# 게시물 신고 및 사용자 차단 플로우
...`; // see Walkthrough 3 above for the full text

// 4. check — score the artifact.
const checked = check(SAMPLE_ARTIFACT, { routeId });
console.log(`${checked.status} ${checked.score}`);

// 5. learn.captureFromCheck — the one write, opt-in, into the temp profile.
const captured = learn.captureFromCheck(SAMPLE_ARTIFACT, { routeId });
console.log(`added ${captured.addedCount}, skipped ${captured.skippedCount}`);
```

This exact flow was dogfooded end-to-end before this walkthrough was written — see [`docs/DOGFOOD-SDK-FINDINGS.md`](../DOGFOOD-SDK-FINDINGS.md) for the full run, the numbers above, and the corpus/route gaps the run surfaced. The SDK verdict from that run: zero friction — the flow above is the walkthrough.

## Read-only vs `learn.*` write boundary

- `route`, `prompt`, `pack`, `search`, `recall`, `check`, `routes`, `version` — pure, read-only. No file writes, no network calls, no learning-usage sidecar writes, even when `prompt`/`pack`'s `withLearning` option is set (that option only **reads** the local learning profile).
- `learn.remember`, `learn.feedback`, `learn.captureFromCheck` — the only write surface, grouped under the `learn` namespace so the read/write boundary is visible at the call site. Every `learn.*` call writes exactly one file: the local learning profile at `DESIGN_AI_LEARNING_FILE` (or its default path).

See [`docs/SDK.md`](../SDK.md) for the full verb-by-verb reference, including `search`, `recall`, `prompt`, and `routes`, which this walkthrough doesn't exercise directly.

## Next

- [`docs/SDK.md`](../SDK.md) — full Agent SDK reference (all 8 read-only verbs + `learn.*`)
- [`docs/AGENT-SDK.md`](../AGENT-SDK.md) — design rationale and phased plan
- [`docs/DOGFOOD-SDK-FINDINGS.md`](../DOGFOOD-SDK-FINDINGS.md) — the real end-to-end run this walkthrough is based on
- [`docs/integrations/sdk-walkthrough.md`](sdk-walkthrough.md) — the Anthropic/OpenAI SDK pattern (embedding corpus Markdown in a system prompt, a different surface than this page)

This exact flow also has a `node --test` regression guard in the repo's source checkout (`cli/sdk/flow-example.test.mjs`, not shipped in the npm package) that runs on every `npm test`.
