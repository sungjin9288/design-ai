# 실제 파일럿 증빙

`design-ai review-pilot`은 한 번의 리뷰-구현 파일럿을 정리하되, 운영자가
기록한 활동을 외부 채택이나 운영 품질 주장으로 바꾸지 않습니다. 정확한
JSON 원본 세 개를 읽어 `design-ai-pilot-evidence` v1을 만듭니다.

## 입력

1. `review-evidence`가 만든 `design-ai-implementation-evidence` v1
2. intake 영수증이 SHA-256으로 연결한 원본 `design-ai-review-workflow` v1
3. 운영자가 작성한 `design-ai-pilot-record` v1

후속 단계에는 P6 원문이 아니라 해시 연결만 남으므로 리뷰 워크플로우를
별도 입력으로 받습니다. 파일럿 기록에는 동의, 시간, finding 판단, 승인
이력, 결과, 주장 분류를 적습니다. 이 기록이 P6나 P11의 기계 증빙을
대체하지는 않습니다.

## 파일럿 기록 템플릿

```json
{
  "kind": "design-ai-pilot-record",
  "schemaVersion": 1,
  "project": {
    "name": "Website Console 내부 검증",
    "repositoryUrl": "https://github.com/example/design-ai.git",
    "pilotClass": "internal-dogfood"
  },
  "consent": {
    "status": "approved",
    "approver": "project-owner",
    "identity": "self-declared",
    "reference": "작업 승인 기록",
    "approvedAt": "2026-07-15T00:00:00.000Z",
    "evidenceCollection": true,
    "targetMutation": true
  },
  "timeline": {
    "pilotStartedAt": "2026-07-15T00:00:00.000Z",
    "firstUsefulArtifactAt": "2026-07-15T00:01:00.000Z",
    "implementationCompletedAt": "2026-07-15T00:10:00.000Z"
  },
  "findingDecisions": [
    {
      "findingId": "finding-id-from-workflow",
      "decision": "accepted",
      "summary": "승인한 범위 안에서 finding을 구현했습니다.",
      "reference": "리뷰 판단 기록"
    }
  ],
  "approvalEvents": [
    {
      "gateId": "source-inspection",
      "status": "approved",
      "occurredAt": "2026-07-15T00:02:00.000Z",
      "reference": "범위 승인 기록"
    }
  ],
  "outcome": {
    "implementationStatus": "complete",
    "productionStatus": "not-deployed",
    "feedback": {
      "status": "not-collected",
      "summary": "외부 사용자 피드백을 수집하지 않았습니다.",
      "reference": ""
    }
  },
  "claims": [
    { "class": "real", "statement": "지정한 저장소에서 파일럿을 실행했습니다.", "reference": "구현 증빙" },
    { "class": "synthetic", "statement": "패키지 fixture는 합성 증빙입니다.", "reference": "package smoke" },
    { "class": "inferred", "statement": "다른 에이전트도 연결된 계약을 재사용할 수 있다고 추론합니다.", "reference": "contract parity" },
    { "class": "unverified", "statement": "외부 채택과 운영 결과는 확인하지 않았습니다.", "reference": "pilot boundary" }
  ]
}
```

워크플로우의 모든 finding과 범위 승인서의 모든 gate를 원본 순서대로 한
번씩 기록해야 합니다. 승인된 gate에는 UTC 시각을 적고, `pending`과
`not-required`의 `occurredAt`은 빈 문자열로 둡니다.

## CLI

```bash
design-ai review-pilot implementation-evidence.json \
  --workflow review-workflow.json \
  --record pilot-record.json \
  --json > pilot-evidence.json
```

명령 자체는 세 파일만 읽습니다. 출력 파일 작성, 저장소 변경, 네트워크
호출, release 작업을 하지 않습니다. 위 리다이렉션은 운영자가 제어합니다.

## SDK와 MCP

SDK `recordPilotEvidence()`와 MCP `design_ai_review_pilot`도 같은 세 JSON
원문과 참조를 받습니다. Website Console은 결과의 바이트와 해시를 다시
검증하고 원문을 그대로 내보내며, 파일럿을 지우면 P11부터 P6까지의 원본
단계를 복원합니다.

## 결과 해석

- 첫 유효 산출물 시간은 기록한 UTC 타임라인에서 계산합니다.
- finding precision은 수용·거절·미해결 판단의 비율이며 품질 점수가 아닙니다.
- approval friction은 승인·불필요·대기 gate 수를 그대로 보존합니다.
- 구현 상태는 P11 증빙 상태와 일치해야 합니다.
- 미해결 위험은 P11의 remaining risk에서 가져옵니다.
- 주장은 real, synthetic, inferred, unverified로 나눕니다.

`evidence-complete`는 제한된 원본들이 서로 일치한다는 뜻입니다. 신원,
피드백, 채택, 운영 품질, 사업 성과를 독립적으로 확인했다는 뜻이 아닙니다.
`attention-required`는 남은 근거 공백을 보존하고, `blocked`는 원본이나
연결 drift를 먼저 고쳐야 한다는 뜻입니다.

## 증빙 체크리스트

- [ ] 소유자 동의가 증빙 수집과 대상 변경을 모두 포함합니다.
- [ ] P6와 P11은 변경되지 않은 정확한 원본입니다.
- [ ] 모든 finding 판단과 approval gate를 원본 순서로 기록했습니다.
- [ ] runtime, 접근성, 키보드, 반응형 증빙 상태가 명확합니다.
- [ ] 실제·합성·추론·미확인 주장을 분리했습니다.
- [ ] commit, push, deployment, external write의 별도 gate를 유지합니다.

