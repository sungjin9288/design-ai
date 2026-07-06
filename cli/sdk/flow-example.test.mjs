// Runs the same route -> pack -> author -> check -> learn.captureFromCheck
// flow documented in docs/integrations/agent-sdk-walkthrough.md (and its
// .ko.md mirror). BRIEF and SAMPLE_ARTIFACT below are kept in lockstep with
// that walkthrough — if either changes, update both places. This is the
// dogfooded flow from docs/DOGFOOD-SDK-FINDINGS.md, re-run here as a
// standing regression guard rather than a one-off exploration script.
//
// Learning writes are isolated to a temp DESIGN_AI_LEARNING_FILE via
// withLearningEnv, the same helper cli/sdk/learn-adapter.test.mjs uses, so
// this test never touches a real local learning profile.

import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { check, learn, pack, route } from "./index.mjs";
import { withLearningEnv } from "../lib/learn-test-support.mjs";

// Same brief as docs/integrations/agent-sdk-walkthrough.md Walkthrough 1 —
// the dogfooded brief from docs/DOGFOOD-SDK-FINDINGS.md.
const BRIEF =
  "커뮤니티 앱의 게시물 신고 및 사용자 차단 플로우 설계 — " +
  "신고 사유 선택, 처리 상태 안내, 차단 후 상호작용 차단 범위";

// Same sample artifact as docs/integrations/agent-sdk-walkthrough.md
// Walkthrough 3. Stands in for the LLM/agent's authored output so the flow
// is runnable without a live model call.
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

function withTempLearningFile(fn) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-ai-sdk-flow-example-"));
  const learningFile = path.join(dir, "learning.json");
  const usageFile = path.join(dir, "learning.usage.json");
  try {
    return withLearningEnv({ learningFile, usageFile }, () => fn({ dir, learningFile, usageFile }));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("route() returns at least one scored recommendation for the dogfooded brief", () => {
  const routed = route(BRIEF, { limit: 3, explain: true });
  assert.ok(Array.isArray(routed));
  assert.ok(routed.length >= 1, "expected at least one route result");
  assert.equal(typeof routed[0].id, "string");
  assert.equal(typeof routed[0].score, "number");
});

test("pack() respects maxBytes and includes plan + files", () => {
  const routed = route(BRIEF, { limit: 3, explain: true });
  const routeId = routed[0].id;

  const packed = pack(BRIEF, {
    routeId,
    withRecall: true,
    recallLimit: 5,
    maxBytes: 60000,
  });

  assert.ok(packed.usedBytes <= packed.maxBytes, "pack() must never exceed maxBytes");
  assert.equal(packed.maxBytes, 60000);
  assert.ok(packed.plan && typeof packed.plan === "object", "expected a plan object");
  assert.ok(Array.isArray(packed.files), "expected a files array");
  assert.ok(packed.files.length >= 1, "expected at least one packed file");
});

test("check() returns a report with results for the sample artifact", () => {
  return withTempLearningFile(() => {
    const routed = route(BRIEF, { limit: 3, explain: true });
    const routeId = routed[0].id;

    const checked = check(SAMPLE_ARTIFACT, { routeId });

    assert.equal(typeof checked.status, "string");
    assert.ok(Array.isArray(checked.results));
    assert.ok(checked.results.length >= 1, "expected at least one check result");
    assert.equal(typeof checked.total, "number");
  });
});

test("learn.captureFromCheck() writes entries to the temp profile and the profile file exists after", () => {
  return withTempLearningFile(({ learningFile }) => {
    const routed = route(BRIEF, { limit: 3, explain: true });
    const routeId = routed[0].id;

    const checked = check(SAMPLE_ARTIFACT, { routeId });
    assert.ok(checked.results.length >= 1);

    const captured = learn.captureFromCheck(SAMPLE_ARTIFACT, { routeId });

    assert.ok(captured.addedCount >= 0, "addedCount must be a non-negative count");
    assert.equal(captured.dryRun, false);
    assert.equal(captured.applied, true);
    assert.ok(existsSync(learningFile), "expected the temp learning profile file to exist after capture");
  });
});

test("full flow: route -> pack -> check -> learn.captureFromCheck runs end-to-end", () => {
  return withTempLearningFile(({ learningFile }) => {
    const routed = route(BRIEF, { limit: 3, explain: true });
    assert.ok(routed.length >= 1);
    const routeId = routed[0].id;

    const packed = pack(BRIEF, { routeId, withRecall: true, recallLimit: 5, maxBytes: 60000 });
    assert.ok(packed.usedBytes <= packed.maxBytes);
    assert.ok(packed.files.length >= 1);

    // Step 3 (author) is the LLM/agent's job in the real flow; SAMPLE_ARTIFACT
    // stands in for that output here, as in the walkthrough doc.
    const checked = check(SAMPLE_ARTIFACT, { routeId });
    assert.ok(checked.results.length >= 1);

    const captured = learn.captureFromCheck(SAMPLE_ARTIFACT, { routeId });
    assert.ok(captured.addedCount >= 0);
    assert.ok(existsSync(learningFile));
  });
});
