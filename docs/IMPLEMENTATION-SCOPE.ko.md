# 구현 범위 승인

P10은 검증된 대상 저장소 intake를 변경 불가능한 제안서로 만들고, 사람의
승인을 두 번째 artifact로 기록합니다. 제안과 승인 작업은 모두 읽기 전용이며
애플리케이션 소스를 읽거나 대상 저장소를 수정하지 않습니다.

## 1. 요청서 작성

`implementation-scope-request.json`에 목적, 의도한 동작, 확인할 파일, 바꿀
파일, 생성 파일, dependency, migration, 외부 쓰기, 검증 명령, 위험, 기존
worktree 변경의 소유권, release 요청을 기록합니다. 전체 예시는 영문 문서의
[요청서 예시](IMPLEMENTATION-SCOPE.md#1-write-the-request)를 참고하세요.

변경 selector는 반드시 `files.inspect`에도 있어야 합니다. 상대 selector에는
상위 경로 이동을 넣을 수 없습니다. P9에 기록된 worktree 항목은 같은 순서로
한 번씩 기록해야 하며, 소유권이 불명확하면 승인이 차단됩니다.

## 2. 제안서 생성

```bash
design-ai review-scope target-repo-intake.json \
  --request implementation-scope-request.json \
  --consumer codex \
  --json > implementation-scope-proposal.json
```

파일은 shell redirection이 만듭니다. 명령은 지정한 JSON 두 개만 읽습니다.
제안서는 원본 문자열, SHA-256, byte 수, 값, 저장소 baseline, selector, 위험,
검증 명령, gate 상태를 함께 보존합니다.

## 3. 승인 기록

제안서를 검토한 뒤 실행합니다.

```bash
design-ai review-scope-approve implementation-scope-proposal.json \
  --approver "product owner" \
  --approval-ref "approved in task" \
  --approved-at "2026-07-15T12:00:00.000Z" \
  --yes \
  --json > implementation-scope-approval.json
```

시간은 UTC ISO 표준형이어야 합니다. 승인은 기록된 selector에 한해서만 소스
확인과 대상 파일 수정을 허용합니다. branch, head, repository, 범위가 달라지면
승인은 만료됩니다.

## 권한 경계

| Gate | P10 결과 |
| --- | --- |
| 소스 확인, 대상 파일 | 승인 artifact로 허용 |
| 기존 변경, dependency, migration 파일, 생성 파일 | 요청서에 명시한 경우에만 허용 |
| 외부 쓰기, commit, push, deployment | 별도 승인 전까지 대기 |
| 외부 상태에 migration 실행 | migration 파일 승인의 범위 밖 |

승인 명령 자체는 소스 확인, 대상 수정, commit, push, deployment, migration 실행,
network 호출, 외부 쓰기를 수행하지 않습니다.

## SDK, MCP, Website Console

SDK는 `proposeImplementationScope()`와 `approveImplementationScope()`를
제공합니다. MCP는 같은 함수를 프로세스 내부에서 호출하는
`design_ai_review_scope`, `design_ai_approve_review_scope`를 제공합니다.

Website Console에 제안서나 승인 JSON을 가져오면 중첩된 원본과 파생 gate를
다시 검증하고, 원본 byte를 그대로 내보냅니다. 현재 artifact를 지우면 이전
단계가 복원됩니다.

`승인 -> 제안서 -> 대상 저장소 intake`

## P11 시작 전 확인

- branch, head, remote, worktree가 승인 당시와 같은지 확인합니다.
- 승인한 selector만 읽고 수정합니다.
- 범위가 넓어지면 멈추고 새 제안서를 만듭니다.
- commit, push, deployment, 외부 쓰기는 각각 별도 gate로 남깁니다.
- 실행 명령, 결과, artifact, 확인하지 못한 항목을 P11 근거로 기록합니다.
