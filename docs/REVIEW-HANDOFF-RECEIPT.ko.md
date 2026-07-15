# 리뷰 인계 검증 영수증

지정된 수신자가 전달받은 handoff 원본을 실제로 파싱하고 다시 검증했다는 근거가
필요할 때 검증 영수증을 사용합니다. 영수증은 원본 handoff를 수정하지 않는 별도의
결정적 계약입니다.

## CLI

```bash
design-ai review-handoff-verify review-handoff.json \
  --consumer implementation-agent \
  --json > review-handoff-receipt.json
```

consumer는 `review-handoff.json`의 `recipient.name`과 정확히 같아야 합니다. 다른
이름, 변경된 원본 바이트, 해시 불일치, 유효하지 않은 내부 근거, 바뀐 승인 조건은
모두 거부합니다. 명령은 지정한 JSON 파일 하나만 읽고 아무 파일도 쓰지 않습니다.
출력 파일은 shell redirection이 만듭니다.

## 계약

`design-ai-review-handoff-receipt` v1은 다음 내용을 기록합니다.

| 필드 | 의미 |
|---|---|
| `consumer` | handoff 수신자와 일치하는 자기 선언 consumer, 통과한 계약 검증, 수락하지 않았다는 경계 |
| `handoff` | 원본 문자열, 참조, 바이트 수, SHA-256 해시, 파싱된 handoff 값 |
| `evidence` | 검증된 handoff에서 가져온 품질 finding 수와 브라우저 상태 |
| `remainingApprovals` | handoff에 남아 있던 승인 조건을 그대로 보존한 목록 |
| `nextAction` | 대상 저장소 확인 대기와 아직 허가되지 않은 구현 |
| `boundary` | 로컬 쓰기, 대상 수정, 외부 쓰기, 신원 증명, 수락, 구현이 없는 경계 |

`status: contract-validated`는 전달한 계약이 내부적으로 유효하고 지정 수신자와
이름이 맞는다는 사실만 증명합니다. 누가 명령을 실행했는지, 파일이 어떻게
전달됐는지, 수신자가 작업을 수락했는지, 대상 저장소를 확인했는지는 증명하지
않습니다.

## SDK

```js
import { readFileSync } from "node:fs";
import { verifyReviewHandoff } from "@design-ai/cli/sdk";

const handoffSource = readFileSync("review-handoff.json", "utf8");
const receipt = verifyReviewHandoff(handoffSource, {
  handoffRef: "review-handoff.json",
  consumer: "implementation-agent",
});
```

## MCP

`design_ai_verify_review_handoff`에 `handoffSource`, `handoffRef`, `consumer`를
전달합니다. Claude, Codex와 다른 MCP client도 CLI와 SDK가 사용하는 같은
in-process validator를 사용합니다. CLI를 실행하거나 외부 서비스에 연결하지
않습니다.

## Website Console

`review-handoff-receipt.json`을 가져오면 Console이 영수증을 먼저 검증하고 내부
handoff, workflow, 근거를 복원합니다. receipt와 handoff 원본 바이트를 모두
보존하며, 다시 내보낼 때 receipt를 재포맷하지 않습니다. 영수증을 지우면 원본
handoff 화면으로 돌아갑니다.

## 안전하게 이어가기

검증 뒤에도 수신자는 선언된 대상 저장소를 확인하고 남은 승인을 해결한 다음,
별도의 구현 workflow를 시작해야 합니다. 코드 변경, 테스트, 커밋, 푸시, 배포
증빙은 그 후속 workflow가 담당합니다.
