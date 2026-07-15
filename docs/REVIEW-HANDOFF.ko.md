# 리뷰 근거 인계

한 에이전트가 표준 리뷰를 준비하고 다른 에이전트나 담당자가 구현 여부를
결정할 때 리뷰 인계를 사용합니다. 인계에는 원본 JSON과 파싱된 값을 함께
보관하고 모든 해시를 검증합니다. 전송이나 구현은 시작하지 않습니다.

## 정적 인계 준비하기

먼저 표준 리뷰를 만듭니다.

```bash
design-ai review page.html \
  --brief "한국 계정 설정 흐름을 검토한다" \
  --locale ko-KR \
  --viewport mobile \
  --viewport desktop \
  --json > review-workflow.json
```

그다음 받을 대상을 명시합니다.

```bash
design-ai review-handoff review-workflow.json \
  --recipient implementation-agent \
  --json > review-handoff.json
```

출력 파일은 shell redirection이 씁니다. `design-ai review-handoff` 명령은
지정한 workflow 파일만 읽습니다. 결과를 전송하거나 대상 저장소를 검사하거나
구현을 시작하지 않습니다.

## 브라우저 근거 연결하기

브라우저 근거는 선택 사항입니다. 근거가 있다면 browser runner가 사용한 정확한
품질 보고서와 verification sidecar를 함께 전달합니다.

```bash
design-ai review-handoff review-workflow.json \
  --recipient implementation-agent \
  --quality-report quality-report.json \
  --browser-verification browser-verification.json \
  --json > review-handoff.json
```

다음 조건을 모두 충족해야 두 파일을 받아들입니다.

1. 품질 보고서의 값이 review workflow 안의 보고서와 같습니다.
2. 품질 보고서 원본 바이트의 해시가 browser sidecar에 기록된 해시와 같습니다.
3. 브라우저 근거가 review workflow에 선언된 모든 viewport를 포함합니다.

한 파일만 전달하면 실패합니다. 바이트 변경, 파싱된 값의 차이, 해시 불일치,
viewport 누락도 모두 실패합니다.

실패하거나 미확인 상태인 브라우저 보고서도 인계 근거로 보존할 수 있지만,
브라우저 승인 조건은 해제되지 않습니다. 해당 조건은 browser summary가
`pass`일 때만 해제됩니다.

## 계약 읽기

`design-ai-review-handoff` v1에는 다음 내용이 들어 있습니다.

| 필드 | 의미 |
|---|---|
| `recipient` | 받을 대상과 `not-delivered` 상태, 수신자 검증 대기 상태 |
| `artifacts` | 각 산출물의 원본 문자열, 바이트 수, SHA-256 해시, 참조, 파싱된 값 |
| `linkage` | workflow, 품질 보고서, 브라우저 근거 사이의 값과 원본 바이트 검증 결과 |
| `stages` | 완료된 계획과 정적 리뷰, 선택적 브라우저 상태, 준비된 구현 인계 |
| `nextAction` | 구현 전에 수신자가 수행해야 할 검증 |
| `boundary` | 로컬 쓰기, 대상 수정, 외부 쓰기, 전송이 없는 읽기 전용 경계 |

`prepared`는 전송 완료를 뜻하지 않습니다. `linkage.status: pass`도 디자인이
리뷰를 통과했다는 뜻이 아닙니다. 변경을 결정하기 전에 내부 품질 요약과 finding을
따로 읽어야 합니다.

## 에이전트에서 같은 작업 사용하기

### Node.js SDK

```js
import { readFileSync } from "node:fs";
import { reviewHandoff } from "@design-ai/cli/sdk";

const workflowSource = readFileSync("review-workflow.json", "utf8");
const handoff = reviewHandoff(workflowSource, {
  workflowRef: "review-workflow.json",
  recipient: "implementation-agent",
});
```

브라우저 근거를 연결할 때는 `qualityReportSource`, `qualityReportRef`,
`browserVerificationSource`, `browserVerificationRef`도 전달합니다. 두 source는
항상 함께 있어야 합니다.

### MCP

정확한 workflow JSON 문자열과 참조, 수신자를 `design_ai_review_handoff`에
전달합니다. 선택형 quality와 browser source도 같은 짝 계약을 따릅니다.
Claude, Codex 또는 다른 MCP client는 CLI subprocess 없이 인계를 받습니다.

### Website Console

Website Console에서 `review-handoff.json`을 가져옵니다. Console은 내부 source를
모두 다시 검증하고 수신자와 단계 경계를 보여줍니다. 다시 내보낼 때는 원본
handoff 바이트를 재포맷하지 않고 반환합니다. 인계를 지우면 개별 review import를
다시 사용할 수 있습니다.

## 수신자 확인 목록

구현 전에 받는 에이전트나 검토자는 다음 순서로 확인해야 합니다.

1. `design-ai review-handoff-verify`로 handoff 계약을 다시 검증합니다.
2. confirmed finding과 unverified finding을 나눠 읽습니다.
3. 수신자와 요청 범위가 여전히 맞는지 확인합니다.
4. `nextAction.approvalRequiredBefore`에 남은 승인을 받습니다.
5. 별도의 권한 경계 안에서 대상 저장소를 검사합니다.

그 뒤에만 별도 구현 작업을 시작할 수 있습니다. 이 인계만으로 전송, 수락,
대상 저장소 검사, 코드 수정, 테스트, 커밋, 푸시, 배포, 외부 쓰기가 끝났다고
표현하지 않습니다.

CLI, SDK, MCP, Website Console 검증 흐름은
[리뷰 인계 검증 영수증](REVIEW-HANDOFF-RECEIPT.ko.md)을 참고하세요.
