# 회사 웹사이트 Intake Template

첫 Website Improvement dogfood 전에 이 template을 채웁니다. 민감한 credential, private token, production secret, 고객 데이터는 이 문서에 적지 않습니다.

## Site Profile

| 항목 | 값 |
|---|---|
| 사이트 이름 | |
| Live URL | |
| 대상 repo URL | |
| 대상 repo local path | |
| Figma URL | |
| 배포 플랫폼 | `vercel` / `netlify` / `cloudflare` / `other` / `none` |
| Sentry 프로젝트 | |
| CMS | `sanity` / `contentful` / `wordpress` / `shopify` / `none` / `other` |
| Database | `supabase` / `neon` / `postgres` / `none` / `other` |

## 우선순위 페이지

첫 pilot에서는 2-5개 페이지를 고릅니다. 전환, 신뢰, 가입, 문의, 구매, 온보딩에 영향을 주는 페이지부터 시작합니다.

| 우선순위 | Path 또는 URL | 중요한 이유 |
|---:|---|---|
| 1 | `/` | |
| 2 | | |
| 3 | | |
| 4 | | |
| 5 | | |

## 주요 사용자 흐름

| 우선순위 | Flow | 성공 신호 |
|---:|---|---|
| 1 | | |
| 2 | | |
| 3 | | |

## Brand And Content Notes

| 영역 | 메모 |
|---|---|
| 브랜드 톤 | |
| 타이포그래피 제약 | |
| 컬러 제약 | |
| 한국어 카피 규칙 | |
| 법무 또는 compliance 문구 | |
| 신뢰 요소 | |
| 경쟁사 또는 레퍼런스 | |

## MCP Readiness Notes

각 외부 시스템을 `required`, `optional`, `unused`, `unavailable` 중 하나로 표시합니다.

| 시스템 | 상태 | 근거 또는 fallback |
|---|---|---|
| GitHub | | |
| Figma | | |
| Browser / Playwright | | |
| Chrome DevTools | | |
| 배포 플랫폼 | | |
| Sentry | | |
| Database | | |
| CMS | | |
| 협업 도구 | | |
| 리서치 도구 | | |

## 초기 Audit Findings

실제로 확인한 finding만 기록합니다. Lighthouse, axe, crawler, analytics를 실제로 실행하지 않았다면 해당 결과를 만들어 쓰지 않습니다.

| Category | Finding | Evidence | Page |
|---|---|---|---|
| Visual design | | | |
| UX flow | | | |
| Responsive | | | |
| Accessibility | | | |
| Performance | | | |
| SEO | | | |
| Technical quality | | | |
| Runtime issues | | | |
| Content quality | | | |

## 첫 Bundle Commands

placeholder를 바꾼 뒤 `design-ai` repo에서 실행합니다.

```bash
design-ai site --init \
  --name "<site name>" \
  --live-url <live-url> \
  --local-path <absolute-target-repo-path> \
  --page / \
  --page <priority-page-2> \
  --flow "<primary user flow>" \
  --next-actions \
  --out website-next-actions.md \
  --force
```

```bash
design-ai site --init \
  --name "<site name>" \
  --live-url <live-url> \
  --local-path <absolute-target-repo-path> \
  --page / \
  --page <priority-page-2> \
  --flow "<primary user flow>" \
  --bundle \
  --out website-handoff-bundle \
  --strict \
  --force
```

```bash
design-ai site website-handoff-bundle --bundle-check --strict --json --out website-bundle-check.json --force
design-ai site website-handoff-bundle --bundle-handoff --strict --out target-repo-handoff.md --force
```

## Target Repo Verification Plan

구현 전에 채워서 target-repo agent가 명확한 quality gate를 갖게 합니다.

| Gate | 명령 또는 수동 확인 | Pilot 필수 |
|---|---|---:|
| Install | | 예 |
| Lint | | 예 |
| Typecheck | | 가능하면 |
| Unit tests | | 가능하면 |
| Build | | 예 |
| Browser smoke | | 예 |
| Accessibility spot check | | 예 |
| Deployment preview | | 가능하면 |

## Stop Conditions

아래 질문 중 하나라도 불명확하면 target repo 수정 전에 멈춥니다.

- 어떤 repo와 branch를 수정해야 하는가?
- 첫 번째로 구현할 single task는 무엇인가?
- 어떤 verification command가 반드시 통과해야 하는가?
- 어떤 credential 또는 production system이 off limits인가?
- target-repo pass 이후 implementation evidence를 어디에 기록해야 하는가?
