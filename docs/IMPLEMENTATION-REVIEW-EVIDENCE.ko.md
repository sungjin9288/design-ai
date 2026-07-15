# 구현 증빙

P11은 완료한 구현이 하나의 정확한 P10 승인 범위 안에 남아 있는지
확인합니다. 승인서와 증빙 요청을 읽고, 승인 당시 기준점과 현재 로컬 Git
상태를 비교하며, 요청에 적은 증빙 파일만 해시로 식별합니다.

이 단계는 구현, 테스트 실행, 애플리케이션 소스 읽기, 파일 쓰기, commit,
push, 배포, 네트워크 호출, release 승인을 수행하지 않습니다.

## 요청 작성

현재 변경 파일은 다음 명령의 정확한 결과와 함께 모두 기록합니다.

```bash
git -c core.quotepath=false status --short --untracked-files=all
```

승인서의 verification command를 같은 순서로 한 번씩 기록합니다. 실행하지
않은 명령은 `not-run`, 빈 timestamp, `null` exit code로 남깁니다.
accessibility, responsive, browser 관찰은 생략하지 말고 확인하지 못했다면
`unverified`로 명시합니다.

```json
{
  "kind": "design-ai-implementation-evidence-request",
  "schemaVersion": 1,
  "consumer": "implementation-agent",
  "implementationStartedAt": "2026-07-15T12:01:00.000Z",
  "implementationCompletedAt": "2026-07-15T12:20:00.000Z",
  "executedWork": [
    {
      "statusEntry": " M src/settings/view.tsx",
      "path": "src/settings/view.tsx",
      "summary": "기존 데이터 흐름을 바꾸지 않고 승인한 설정 동작을 명확하게 정리했습니다."
    },
    {
      "statusEntry": "?? evidence/test.log",
      "path": "evidence/test.log",
      "summary": "승인한 테스트 결과를 기록했습니다."
    }
  ],
  "verificationResults": [
    {
      "command": "npm test",
      "status": "pass",
      "startedAt": "2026-07-15T12:10:00.000Z",
      "completedAt": "2026-07-15T12:11:00.000Z",
      "exitCode": 0,
      "summary": "단위 테스트가 통과했습니다.",
      "artifacts": ["evidence/test.log"]
    }
  ],
  "observations": [
    {
      "id": "accessibility-check",
      "category": "accessibility",
      "status": "unverified",
      "summary": "이번 실행에서는 접근성을 확인하지 못했습니다.",
      "artifacts": []
    },
    {
      "id": "responsive-check",
      "category": "responsive",
      "status": "unverified",
      "summary": "이번 실행에서는 반응형 동작을 확인하지 못했습니다.",
      "artifacts": []
    },
    {
      "id": "browser-check",
      "category": "browser",
      "status": "unverified",
      "summary": "이번 실행에서는 브라우저 동작을 확인하지 못했습니다.",
      "artifacts": []
    }
  ],
  "remainingRisks": [
    {
      "severity": "p2",
      "summary": "반응형과 브라우저 동작 확인이 남아 있습니다."
    }
  ]
}
```

증빙 artifact는 승인서의 `files.change` 또는 `files.generated` selector가
허용한 정확한 상대 경로여야 합니다. 각 파일은 승인한 저장소 root 안의
일반 파일이어야 하며 symlink는 허용하지 않습니다.

## 증빙 확인

```bash
design-ai review-evidence implementation-scope-approval.json \
  --request implementation-evidence-request.json \
  --target-root /absolute/path/to/repo \
  --consumer implementation-agent \
  --json > /tmp/design-ai-implementation-evidence.json
```

출력 파일은 shell redirection이 만들며 P11 operation 자체는 아무것도 쓰지
않습니다.

결과 상태는 다음과 같습니다.

- `evidence-complete`: 범위, Git 상태, 검증, 관찰, 남은 위험에 빈틈이 없음
- `attention-required`: 실패하거나 실행하지 않은 검증, 미확인 관찰, 기존
  변경과의 겹침, 남은 위험이 있음
- `blocked`: 기준점이 달라졌거나, 변경 파일이 누락되거나 범위를 벗어났거나,
  artifact가 안전하지 않거나, 기록이 Git 상태와 모순됨

## MCP와 Website Console

MCP의 `design_ai_review_evidence`는 절대 경로인 `approvalPath`, `requestPath`,
`targetRoot`와 일치하는 `consumer`를 받습니다. 같은 in-process operation을
사용하며 CLI를 별도로 실행하지 않습니다.

Website Console은 결과 JSON 안의 승인서와 요청 원본을 다시 검증하고 원본
byte를 그대로 내보냅니다. 증빙을 지우면 승인 단계가 복원됩니다.

`구현 증빙 -> 범위 승인 -> 범위 제안서 -> 대상 저장소 intake`

## Release 경계

P11은 commit 전 증빙을 기록하지만 commit, push, 배포, migration 실행, 외부
쓰기 권한을 부여하지 않습니다. HEAD가 바뀌면 P10 승인은 만료되므로 증빙을
맞춰 쓰지 말고 intake, 제안서, 승인을 새로 만들어야 합니다.
