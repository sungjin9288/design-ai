# 회사 웹사이트 Dogfood Runbook

실제 회사 웹사이트에 `design-ai`를 처음 적용할 때 이 runbook을 사용합니다. 목표는 이 repo에서 검증된 Website Improvement handoff bundle을 만들고, 생성된 구현 프롬프트를 대상 웹사이트 repo 안에서 실행하는 것입니다.

이 repo는 계획과 handoff control tower 역할만 합니다. 대상 웹사이트 소스 코드를 이 repo로 복사하지 않습니다.

## 필수 Intake

첫 bundle을 만들기 전에 아래 값을 모읍니다.

사이트 정보가 아직 정리되지 않았다면 [회사 웹사이트 Intake Template](COMPANY-WEBSITE-INTAKE-TEMPLATE.ko.md)을 먼저 채웁니다.

| 항목 | 필수 | 예시 |
|---|---:|---|
| 사이트 이름 | 예 | `Company marketing site` |
| Live URL | 예 | `https://www.example.com` |
| 대상 repo URL 또는 local path | 예 | `https://github.com/company/site` 또는 `/Users/me/work/site` |
| 우선순위 페이지 | 예 | `/`, `/pricing`, `/contact` |
| 주요 사용자 흐름 | 예 | `방문자가 요금제를 비교하고 데모를 요청한다` |
| Figma URL | 선택 | `https://www.figma.com/file/...` |
| 배포 플랫폼 | 선택 | `vercel`, `netlify`, `cloudflare`, `other`, `none` |
| CMS / DB / Sentry 메모 | 선택 | `Sanity`, `Supabase`, `Sentry project slug` |
| 브랜드 제약 | 선택 | 톤, 타이포그래피, 컬러, 법무 문구, 한국어 카피 규칙 |

## 1단계: Workspace와 Bundle 생성

`design-ai` repo에서 실행합니다.

intake template을 이미 작성했다면 먼저 workspace로 변환합니다.

```bash
design-ai site --from-intake company-website-intake.ko.md --out website-workspace.json --force
design-ai site --from-intake company-website-intake.ko.md --next-actions --out website-next-actions.md --force
```

intake 파일이 아직 없다면 direct `--init` field를 사용합니다.

```bash
design-ai site --init \
  --name "Company marketing site" \
  --live-url https://www.example.com \
  --repo-url https://github.com/company/site \
  --page / \
  --page /pricing \
  --page /contact \
  --flow "Visitor compares plans and requests a demo" \
  --next-actions \
  --out website-next-actions.md
```

이어서 portable handoff bundle을 생성합니다.

```bash
design-ai site --from-intake company-website-intake.ko.md \
  --bundle \
  --out website-handoff-bundle \
  --strict \
  --force
```

또는 direct field로 bundle을 생성합니다.

```bash
design-ai site --init \
  --name "Company marketing site" \
  --live-url https://www.example.com \
  --repo-url https://github.com/company/site \
  --page / \
  --page /pricing \
  --page /contact \
  --flow "Visitor compares plans and requests a demo" \
  --bundle \
  --out website-handoff-bundle \
  --strict
```

대상 repo가 이미 로컬에 clone되어 있다면 `--repo-url`보다 `--local-path /absolute/path/to/site`를 우선 사용합니다.

## 2단계: Target Repo 작업 전 Bundle 검증

```bash
design-ai site website-handoff-bundle --bundle-check --strict --json --out website-bundle-check.json
design-ai site website-handoff-bundle --bundle-handoff --strict --out target-repo-handoff.md
```

`bundle-check`가 통과해야 구현으로 넘어갑니다. handoff prompt에는 아래 항목이 반드시 포함되어야 합니다.

- target repo 확인 규칙
- architecture와 design system 사전 점검
- 한 번에 하나의 focused task 범위
- target repo에서 실행할 quality gate 명령
- 구현 evidence와 remaining risk 기록 요구사항

## 3단계: 대상 웹사이트 Repo에서 실행

대상 웹사이트 repo를 Codex 또는 Claude Code로 열고 `target-repo-handoff.md`를 붙여넣습니다.

구현 agent는 반드시 아래 순서를 지킵니다.

1. 대상 repo path와 현재 branch를 확인합니다.
2. 수정 전에 framework, routing, styling, component, design token 구조를 점검합니다.
3. 넓은 redesign이 아니라 하나의 focused refactor task만 적용합니다.
4. 대상 repo의 관련 검증을 실행합니다: lint, typecheck, tests, build, browser smoke, deployment preview verification.
5. 변경 파일, 검증 결과, 필요한 screenshot, 남은 risk, 다음 추천 task를 반환합니다.

## 4단계: Evidence를 design-ai로 회수

target repo 구현 뒤 evidence를 Website Improvement Console 또는 workspace JSON에 다시 기록합니다.

| Evidence 영역 | 기록할 내용 |
|---|---|
| 실행한 작업 | 변경된 페이지/컴포넌트, commit/PR 링크, scope 결정 |
| 검증 결과 | 실행한 명령, pass/fail 상태, browser 또는 deployment smoke 메모 |
| 남은 리스크 | 검증하지 못한 항목, production data dependency, 남은 접근성/SEO 이슈 |
| 다음 작업 | 다음 task 후보와 우선순위 이유 |

그다음 report를 다시 생성합니다.

```bash
design-ai site website-workspace.json --report --out website-handoff.md --force
design-ai site website-workspace.json --bundle --out website-handoff-bundle.after --strict
design-ai site website-handoff-bundle --bundle-compare website-handoff-bundle.after --strict --json
```

## Stop Conditions

아래 조건에서는 구현 전에 멈춥니다.

- 대상 repo path가 불명확합니다.
- Live URL이 열리지 않거나 다른 사이트를 가리킵니다.
- `--strict` bundle check가 실패합니다.
- required MCP readiness가 `unavailable`인데 수동 fallback이 없습니다.
- 대상 repo에 실행 가능한 검증 명령도, 수동 smoke 경로도 없습니다.
- 요청 변경이 credential, production write, destructive migration 승인을 필요로 합니다.

## 첫 Pilot 완료 기준

첫 회사 dogfood는 아래 조건이 모두 충족될 때 완료입니다.

- 검증된 `website-handoff-bundle`이 존재합니다.
- `target-repo-handoff.md`가 실제 target repo 안에서 사용됐습니다.
- 하나의 focused improvement task가 구현되고 검증됐습니다.
- evidence가 Website Improvement workspace로 다시 기록됐습니다.
- 최종 `website-handoff.md` report에 변경 사항, 통과한 검증, 남은 risk, 다음 작업이 기록됐습니다.
