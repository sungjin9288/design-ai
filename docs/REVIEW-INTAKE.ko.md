# 대상 저장소 사전 점검

대상 저장소 사전 점검은 인계 검증 영수증을 받은 뒤 수행하는 첫 수신자 단계입니다.
영수증에 선언된 저장소와 실제 로컬 checkout이 같은지 확인하며, 지원하는 루트
metadata와 로컬 Git 상태만 읽습니다. 애플리케이션 소스 검토와 구현 전에 멈춥니다.

## CLI

먼저 원본 리뷰에 저장소 URL과 절대 경로를 선언해야 합니다.

```bash
design-ai review page.html \
  --brief "한국 핀테크 설정 검토" \
  --repo-url https://github.com/acme/settings \
  --local-path /absolute/path/to/settings \
  --json > review-workflow.json
```

인계 검증을 마친 뒤 같은 consumer와 경로로 사전 점검을 실행합니다.

```bash
design-ai review-intake review-handoff-receipt.json \
  --target-root /absolute/path/to/settings \
  --consumer implementation-agent \
  --json > target-repo-intake.json
```

consumer나 경로가 다르면 대상 저장소를 읽기 전에 거부합니다. 심볼릭 링크도 따라가지
않고 거부합니다.

## 산출물

`design-ai-target-repo-intake` v1에는 다음 정보가 들어갑니다.

| 필드 | 의미 |
|---|---|
| `receipt` | 영수증 참조, byte 수, SHA-256, consumer, handoff와 workflow digest |
| `target` | 선언 경로와 실제 경로, 선언 remote와 관찰 remote, 일치 여부 |
| `project` | 루트 `package.json`, 지원 lockfile, `index.html`, package manager, framework, scripts, start command |
| `git` | 저장소 루트, branch, upstream, ahead/behind, remote, 최근 commit, 기존 변경 사항 |
| `inspection` | 실행한 metadata/Git 검사와 비어 있는 application-source 목록 |
| `nextAction` | 대기 중인 구현 범위 승인 |
| `boundary` | preview, network, mutation, source review, implementation이 없는 read-only 경계 |

영수증 전체를 다시 넣지 않고 정확한 digest로 연결해 산출물 크기를 제한하면서 근거
사슬을 유지합니다.

## 상태 해석

- `ready-for-scope-review`: 경로와 remote가 일치하고, 이름 있는 branch의 깨끗한 Git
  저장소이며, 루트 metadata를 사용할 수 있습니다.
- `attention-required`: 계약은 유효하지만 기존 변경, detached HEAD, 불완전한 metadata를
  담당자가 먼저 판단해야 합니다.
- `blocked`: 대상이 없거나 안전하지 않거나, Git 저장소가 아니거나, 저장소 루트 밖에
  있거나, remote가 영수증과 다릅니다.

깨끗한 결과도 구현을 허가하지 않습니다. 다음 단계에서 수정할 파일, 변경 의도, 위험,
검증 명령을 제시하고 구현 범위를 명시적으로 승인받아야 합니다.

## MCP와 Website Console

MCP에서는 `design_ai_review_intake`에 절대 경로인 `receiptPath`, `targetRoot`,
`consumer`를 전달합니다. MCP server가 receipt 원본 바이트를 직접 읽으므로 큰
receipt를 tool request에 복제하지 않으며, CLI와 같은 operation과 계약을 사용합니다.

Agent SDK에는 이 기능을 노출하지 않습니다. 사전 점검은 로컬 프로젝트 파일시스템
경계를 소유하지만 SDK는 source string 중심의 adapter로 유지합니다.

Website Console에 `target-repo-intake.json`을 import하면 저장소 identity, project
metadata, Git 상태, 남은 scope gate를 검증해 보여주고 원본 JSON을 그대로 export합니다.
사전 점검만 지우면 이전 receipt, handoff, review 근거는 그대로 남습니다.

## 권한 경계

사전 점검은 애플리케이션 소스를 읽거나 dependency를 설치하거나 preview를 시작하거나
remote에 접속하지 않습니다. 대상 저장소를 수정하지 않고, handoff 수락이나 consumer
신원을 증명하지 않으며, 구현을 시작하지 않습니다. shell redirection은 대상 저장소 밖에
출력 파일을 만들 수 있지만 Design AI operation 자체는 어떤 파일도 쓰지 않습니다.
