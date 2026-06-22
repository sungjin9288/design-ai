# Evidence Checklist

## 1. 검증 완료 기능

| 체크 | 기능 | 증거 |
|---|---|---|
| 완료 | CLI 실행 화면 | `evidence/screenshots/cli-execution-screen.png` |
| 완료 | Website Console 화면 | `evidence/screenshots/website-console-priority.png` |
| 조건부 완료 | VS Code Extension surface 화면 | `evidence/screenshots/vscode-extension-surface-evidence.png` |
| 완료 | 생성된 design artifact 화면 | `evidence/screenshots/generated-design-artifact.png` |
| 완료 | audit 결과 화면 | `evidence/screenshots/audit-results-evidence.png`, `evidence/cli-logs/release-check.log` |
| 완료 | CLI version JSON 출력 | `evidence/cli-logs/cli-version-json.log` |
| 완료 | CLI help 출력 | `evidence/cli-logs/cli-help.log` |
| 완료 | skill catalog JSON 출력 | `evidence/cli-logs/cli-list-skills.log` |
| 완료 | route recommendation JSON 출력 | `evidence/cli-logs/cli-route-json.log` |
| 완료 | knowledge search JSON 출력 | `evidence/cli-logs/cli-search-json.log` |
| 완료 | prompt artifact 생성 | `evidence/output-artifacts/button-component-prompt.md` |
| 완료 | pack artifact 생성 | `evidence/output-artifacts/landing-audit-pack.md` |
| 완료 | Website Console sample workspace 생성 | `evidence/output-artifacts/website-workspace-sample.json` |
| 완료 | Website Console next actions 생성 | `evidence/output-artifacts/website-next-actions.md` |
| 완료 | Website Console 화면 렌더링 | `evidence/screenshots/website-console-home.png` |
| 완료 | Website Console 접근성 snapshot | `evidence/screenshots/website-console-accessibility-snapshot.md` |
| 완료 | Mermaid architecture diagram | `evidence/architecture/current-architecture.md` |
| 완료 | Mermaid CLI sequence diagram | `evidence/architecture/cli-sequence.md` |
| 완료 | Node unit test suite | `evidence/cli-logs/npm-test.log` |
| 완료 | full release gate | `evidence/cli-logs/release-check.log` |
| 완료 | VS Code Extension compile | `evidence/cli-logs/vscode-extension-compile.log` |
| 완료 | VS Code Extension unit test | `evidence/cli-logs/vscode-extension-npm-test.log` |
| 완료 | whitespace diff check | `evidence/cli-logs/git-diff-check.log` |
| 확인 완료 | public npm registry status | `evidence/cli-logs/npm-registry-status.log` - 현재 `E404` |
| 확인 완료 | GitHub Pages 최신 배포 | `evidence/cli-logs/github-pages-status.log` - 현재 HTTP `404` |
| 확인 완료 | VS Code Marketplace 배포 | `evidence/cli-logs/vscode-marketplace-status.log` - 현재 listing 없음 |

## 2. 해당 없음

| 항목 | 이유 | 기록 |
|---|---|---|
| API response capture | HTTP API 프로젝트가 아님 | `evidence/api-responses/not-applicable.md` |
| DB query evidence | DB 구현 근거 없음 | `docs/implementation-evidence.md` |
| auth flow evidence | auth 구현 근거 없음 | `docs/implementation-evidence.md` |

## 3. 검증 필요

| 항목 | 이유 | 다음 확인 방법 |
|---|---|---|
| live VS Code Extension screenshot | 현재 환경에서 `code` CLI와 VS Code 앱 경로 확인 불가 | VS Code 설치 환경에서 extension host 실행 후 캡처 |
| 사용자 피드백/성과 수치 | repo 내부에 정량 evidence 없음 | issue, analytics, download, feedback 근거 확보 |

## 4. 민감정보 제외 점검

- `.env`: evidence 포함 없음
- API key: 실제 key 형태 패턴 포함 없음
- token/password/credential 파일: evidence 포함 없음
- 개인정보/고객사/기관 내부자료: 포함 없음
- dependency/build folders: evidence 포함 없음
