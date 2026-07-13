# Agent SDK 워크스루

**프로그래밍 방식 Agent SDK** (`@design-ai/cli/sdk`) — 읽기 전용 함수들과 opt-in `learn.*` 로컬 쓰기 네임스페이스 — 로 design-ai를 완전히 구동하는 구체적이고 복사해서 바로 쓸 수 있는 워크스루예요. [`docs/integrations/sdk-walkthrough.md`](sdk-walkthrough.ko.md)(Anthropic/OpenAI SDK로 코퍼스 마크다운을 모델의 시스템 프롬프트에 임베드하는 방식)와는 다른 표면이에요. 이 문서는 여러분 자신의 Node.js 프로그램이나 에이전트 런타임에서 design-ai 자체의 결정적 함수 — `route`, `pack`, `check`, `learn.captureFromCheck` — 를 직접 호출하는 방법을 다뤄요. 전체 API 레퍼런스는 [`docs/SDK.md`](../SDK.md)를 참고하세요.

## 사전 준비

```bash
npm install @design-ai/cli
```

```js
import { route, pack, check, learn } from "@design-ai/cli/sdk";
```

`./sdk` 서브패스만 export돼요 — CLI 셸 실행도, MCP 서버도, 별도 코퍼스 클론도 필요 없어요. TypeScript 타입(`RouteResult`, `Pack`, `CheckReport`, `CaptureResult`, …)은 `tsconfig.json`에서 `moduleResolution: "node16"` / `"nodenext"` (또는 `"bundler"`)로 설정돼 있으면 `cli/sdk/index.d.ts`에서 자동으로 resolve돼요. 서브패스 `types` 조건이 이렇게 지켜져요.

## 설치

설정할 게 없어요. 9개 읽기 전용 함수(`artifact`, `route`, `prompt`, `pack`, `search`, `recall`, `check`, `routes`, `version`)는 디스크에 절대 쓰지 않아요. 유일한 쓰기 표면은 `learn` 네임스페이스(`learn.remember`, `learn.feedback`, `learn.captureFromCheck`)예요 — 모든 `learn.*` 호출은 로컬 학습 프로필에만, 그것도 명시적으로 호출했을 때만 써요. 아래 모든 워크스루가 하는 것처럼 `DESIGN_AI_LEARNING_FILE`을 임시 경로로 지정하면 언제든 이 쓰기를 실제 프로필 바깥에 격리할 수 있어요 — 그래서 아래 스크립트를 실행해도 `~/.design-ai/learning.json`은 전혀 건드리지 않아요.

## 워크스루 1: 브리프를 design-ai 라우트로 라우팅

**목표**: 작업 브리프에 대한 점수화된 라우트 추천을 받아서, 에이전트가 다음에 어떤 명령/스킬/지식을 써야 할지 알게 하기.

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

이건 바로 이 브리프로 실제 dogfooding한 출력이에요 — 전체 실행 기록과 이 결과가 드러낸 라우트 테이블 갭은 [`docs/DOGFOOD-SDK-FINDINGS.md`](../DOGFOOD-SDK-FINDINGS.md)를 참고하세요(F-1: 전용 flow-design 라우트가 아직 없어서 신고/차단 브리프가 `design-from-brief`로 폴백해요). `route()`는 낮은 confidence 매치여도 여전히 쓸 수 있는 추천을 반환해요 — 그래서 `pack()`으로 무조건 체이닝해도 안전해요.

## 워크스루 2: 바운드된 컨텍스트 번들 pack

**목표**: 같은 브리프를 아티팩트 작성 전에 에이전트가 읽어야 할 코퍼스 파일들의 바이트 상한 번들 + 바로 쓸 수 있는 프롬프트로 변환하기.

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

`pack()`은 `maxBytes`를 절대 넘지 않아요 — 여기서는 예산을 정확히 채우고(60,000/60,000 바이트) `packed.warnings`에 어떤 파일이 잘렸는지 보고해요. 그래서 에이전트가 예산을 늘릴지, 잘린 파일의 나머지를 직접 읽을지 판단할 수 있어요. `packed.plan`은 `prompt()`가 반환할 것과 같은 바로 쓸 수 있는 프롬프트를 담고 있고, `packed.files`가 바운드된 번들 자체예요.

## 워크스루 3: 아티팩트 작성 (여기는 에이전트의 역할)

**목표**: SDK는 디자인 아티팩트를 쓰지 않아요 — 그건 LLM/에이전트의 역할이에요. `packed.plan`과 `packed.files`를 grounding으로 사용해요. 이 워크스루는 라이브 모델 호출 없이도 스크립트가 끝까지 실행되도록 짧은 샘플 아티팩트 문자열을 임베드해요. 실제 에이전트에서는 `SAMPLE_ARTIFACT`를 모델의 실제 마크다운 출력으로 교체하세요.

```js
// 실제 에이전트에서는 이 문자열이 모델의 응답이에요 — `packed.plan.prompt`와
// `packed.files`를 LLM 호출에 넣고 반환된 마크다운을 받아서 만들어요.
// 스크립트가 단독으로 실행되도록 여기서는 짧게 유지해요.
// flow-example.test.mjs에 같은 상수가 있어요 (이 워크스루와 lockstep —
// 거기 주석이 여기를 다시 가리켜요).
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

## 워크스루 4: 아티팩트 check

**목표**: 작성된 아티팩트를 grounding, 접근성, 반응형, 라우트별 요구사항 기준으로 점수화해서 배포 전에 확인하기.

```js
import { check } from "@design-ai/cli/sdk";

const checked = check(SAMPLE_ARTIFACT, { routeId: routed[0].id });
console.log(`${checked.status} ${checked.score}`);
```

```
warn 8/10
```

`checked.results`가 체크별 세부 내역이에요 (여기서는 총 10개 체크: 8 pass, 2 warn, 0 fail). 하나는 `route-design-from-brief-design-system-foundation` — flow-design 아티팩트에 design-system-foundation 근거가 빠졌다고 보고하는 라우트별 체크로, 워크스루 1의 F-1 라우트 갭에서 정확히 예상되는 결과예요. 다른 하나는 `korean-context` — 이 짧은 샘플에 한국 시장 특화 고려가 빠졌다는 지적인데, 실제 dogfood의 더 긴 아티팩트는 이를 반영해서(정보통신망법 처리 기한 안내) 라우트 warn 하나만 남은 `warn 9/10`을 받았어요. `check()`도 `route`, `pack`처럼 아무것도 쓰지 않아요.

## 워크스루 5: check 결과를 로컬 학습으로 capture

**목표**: check의 non-pass 결과를 로컬 학습 프로필 엔트리로 전환하기 — 이 전체 플로우에서 유일한 쓰기이고, opt-in이며 명시적이에요.

```js
import { learn } from "@design-ai/cli/sdk";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// DESIGN_AI_LEARNING_FILE을 임시 파일로 지정해서 실제 프로필
// (기본값 ~/.design-ai/learning.json)을 절대 건드리지 않아요.
const dir = mkdtempSync(path.join(tmpdir(), "design-ai-sdk-walkthrough-"));
process.env.DESIGN_AI_LEARNING_FILE = path.join(dir, "learning.json");

const captured = learn.captureFromCheck(SAMPLE_ARTIFACT, { routeId: routed[0].id });
console.log(`added ${captured.addedCount}, skipped ${captured.skippedCount}`);
```

```
added 2, skipped 0
```

non-pass 결과 두 건(워크스루 4의 warn 둘)이 `process.env.DESIGN_AI_LEARNING_FILE`의 임시 프로필에 capture됐어요. 같은 아티팩트로 `captureFromCheck`를 다시 호출하면 아무것도 추가되지 않아요 — 모든 후보가 `duplicate-entry-text`로 skip되므로(두 번째 호출은 `added 0, skipped 2`), 변경 없는 아티팩트로 플로우를 재실행해도 프로필이 계속 커지지 않아요.

## 전체 스크립트

위 내용을 모두 하나의 실행 가능한 파일로 모으면:

```js
import { route, pack, check, learn } from "@design-ai/cli/sdk";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

// 실제 프로필을 건드리지 않도록 학습 쓰기를 임시 파일로 지정.
const dir = mkdtempSync(path.join(tmpdir(), "design-ai-sdk-walkthrough-"));
process.env.DESIGN_AI_LEARNING_FILE = path.join(dir, "learning.json");

const brief =
  "커뮤니티 앱의 게시물 신고 및 사용자 차단 플로우 설계 — " +
  "신고 사유 선택, 처리 상태 안내, 차단 후 상호작용 차단 범위";

// 1. route — 브리프를 라우트 카탈로그에 점수화.
const routed = route(brief, { limit: 3, explain: true });
const routeId = routed[0].id;
console.log(routed.map((r) => `[${r.confidence}] ${r.id} score=${r.score}`));

// 2. pack — 바운드된 컨텍스트 번들 + 바로 쓸 수 있는 프롬프트.
const packed = pack(brief, { routeId, withRecall: true, recallLimit: 5, maxBytes: 60000 });
console.log(packed.summary);

// 3. author — LLM/에이전트가 packed.plan + packed.files를 grounding으로
// 삼아 여기서 아티팩트를 작성해요. 스크립트가 단독 실행되도록 짧은 샘플로
// 임베드. cli/sdk/flow-example.test.mjs와 lockstep 유지.
const SAMPLE_ARTIFACT = `# 게시물 신고 및 사용자 차단 플로우
...`; // 전체 텍스트는 위 워크스루 3 참고

// 4. check — 아티팩트 점수화.
const checked = check(SAMPLE_ARTIFACT, { routeId });
console.log(`${checked.status} ${checked.score}`);

// 5. learn.captureFromCheck — 유일한 쓰기, opt-in, 임시 프로필로.
const captured = learn.captureFromCheck(SAMPLE_ARTIFACT, { routeId });
console.log(`added ${captured.addedCount}, skipped ${captured.skippedCount}`);
```

이 플로우는 이 워크스루를 작성하기 전에 실제로 end-to-end dogfooding됐어요 — 전체 실행 기록, 위 숫자들, 이 실행이 드러낸 코퍼스/라우트 갭은 [`docs/DOGFOOD-SDK-FINDINGS.md`](../DOGFOOD-SDK-FINDINGS.md)를 참고하세요. 그 실행의 SDK 결론: 마찰 없음 — 위 플로우가 곧 이 워크스루예요.

## 읽기 전용 vs `learn.*` 쓰기 경계

- `artifact`, `route`, `prompt`, `pack`, `search`, `recall`, `check`, `routes`, `version` — 순수 읽기 전용. 파일 쓰기, 네트워크 호출, 학습 사용량 사이드카 쓰기가 전혀 없어요. `prompt`/`pack`의 `withLearning` 옵션을 설정해도 마찬가지예요 (이 옵션은 로컬 학습 프로필을 **읽기만** 해요).
- `learn.remember`, `learn.feedback`, `learn.captureFromCheck` — 유일한 쓰기 표면. `learn` 네임스페이스로 묶여 있어서 호출 지점에서 읽기/쓰기 경계가 눈에 보여요. 모든 `learn.*` 호출은 정확히 파일 하나 — `DESIGN_AI_LEARNING_FILE`(또는 기본 경로)의 로컬 학습 프로필 — 만 써요.

전체 함수별 레퍼런스(이 워크스루가 직접 다루지 않는 `search`, `recall`, `prompt`, `routes` 포함)는 [`docs/SDK.md`](../SDK.md)를 참고하세요.

## 다음

- [`docs/SDK.md`](../SDK.md) — 전체 Agent SDK 레퍼런스 (9개 읽기 전용 함수 + `learn.*`)
- [`docs/AGENT-SDK.md`](../AGENT-SDK.md) — 설계 근거와 단계별 계획
- [`docs/DOGFOOD-SDK-FINDINGS.md`](../DOGFOOD-SDK-FINDINGS.md) — 이 워크스루의 근거가 된 실제 end-to-end 실행
- [`docs/integrations/sdk-walkthrough.ko.md`](sdk-walkthrough.ko.md) — Anthropic/OpenAI SDK 패턴 (코퍼스 마크다운을 시스템 프롬프트에 임베드, 이 문서와는 다른 표면)

이 플로우는 저장소 소스 체크아웃에 `node --test` 회귀 가드(`cli/sdk/flow-example.test.mjs`, npm 패키지에는 포함되지 않음)로도 있어서 `npm test` 때마다 실행돼요.
