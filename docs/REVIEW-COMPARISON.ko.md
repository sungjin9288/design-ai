# 검증 가능한 디자인 반복

디자인 변경 뒤에는 코드가 달라졌는지보다 디자인 근거가 어떻게 달라졌는지가
더 중요합니다. 리뷰 비교는 이 질문에 답하기 위한 읽기 전용 작업입니다.

두 개의 정확한 `design-ai-quality-report` v1 산출물을 비교합니다. 원본 보고서를
그대로 보존하고 같은 대상과 검토 맥락인지 확인한 뒤, 별도의
`design-ai-review-comparison` v1 산출물을 만듭니다.

## 두 리뷰 비교하기

```bash
design-ai review-compare baseline-quality-report.json \
  --candidate candidate-quality-report.json \
  --json > review-comparison.json
```

명령은 지정한 두 일반 파일만 읽습니다. 셸에서 표준 출력을 리다이렉트하지 않는
한 파일을 쓰지 않고, 네트워크를 호출하거나 저장소를 바꾸지 않습니다.

다른 에이전트가 판단만 필요하고 중복된 원문 전체는 필요하지 않다면 compact
출력을 사용합니다.

```bash
design-ai review-compare baseline-quality-report.json \
  --candidate candidate-quality-report.json \
  --compact \
  --json
```

## 반드시 같아야 하는 맥락

다음 항목이 다르면 비교 판단을 만들기 전에 실패합니다.

- 대상의 종류, 이름, 참조;
- brief와 review route;
- locale;
- 선언한 viewport 집합.

같은 finding id는 같은 lens에 속해야 합니다. 다른 lens에서 id를 다시 쓰는 것은
개선이 아니라 계약 변경입니다.

## Finding 판단 기준

| 판단 | 의미 |
| --- | --- |
| `resolved` | baseline finding이 사라졌고 candidate lens가 통과했습니다. |
| `persistent` | 같은 finding이 candidate에도 남아 있습니다. |
| `introduced` | candidate에만 새 finding이 나타났습니다. |
| `uncertain` | baseline finding은 사라졌지만 candidate lens가 경고, 실패, 근거 부족 상태입니다. |

불확실 상태는 정적 신호가 사라진 것을 해결로 꾸미지 못하게 합니다. 예를 들어
접근 가능한 이름 경고가 사라져도 접근성 lens가 통과할 근거가 없다면 개선이
확정되지 않습니다.

여덟 개 lens는 각각 `unchanged`, `improved`, `regressed`, `evidence-gained`,
`evidence-lost` 가운데 하나의 변화를 기록합니다.

## 전체 상태 읽기

| 상태 | 의미 |
| --- | --- |
| `regressed` | lens가 악화되었거나 근거를 잃었거나 확인된 finding이 추가됐습니다. |
| `attention-required` | 명확한 악화는 없지만 지속, 추가, 불확실 finding이 남았습니다. |
| `improved` | 하나 이상의 finding이 해결됐고 미해결 비교 판단이 없습니다. |
| `unchanged` | 검증된 finding 변화가 없습니다. |

전체 상태는 출시 판단을 돕는 정보이지 보편적인 디자인 점수가 아닙니다.
`improved`도 두 보고서 사이에서 확인된 제한된 개선만 뜻합니다. 운영 품질과
사용자 채택은 별도 근거가 필요합니다.

## 에이전트에서 같은 작업 사용하기

### Node.js SDK

```js
import { readFileSync } from "node:fs";
import { compareReviews } from "@design-ai/cli/sdk";

const baselineSource = readFileSync("baseline-quality-report.json", "utf8");
const candidateSource = readFileSync("candidate-quality-report.json", "utf8");

const comparison = compareReviews(baselineSource, candidateSource, {
  baselineRef: "baseline-quality-report.json",
  candidateRef: "candidate-quality-report.json",
  compact: true,
});
```

### MCP

`design_ai_compare_reviews`에 두 JSON 원문과 참조를 전달합니다. 기본값은 compact
출력입니다. 원문 전체 봉투가 필요할 때만 `compact: false`를 사용합니다.

### Website Console

전체 `review-comparison.json`을 Website Console로 가져옵니다. Console은 내부의
두 quality report를 다시 검증하고 원본 식별 정보, lens 변화, finding 판단, 승인
gate, 경계를 표시합니다. 내보내기는 처음 가져온 JSON 바이트를 그대로 돌려줍니다.
원문이 빠진 compact summary는 브라우저에서 완전한 재검증이 불가능하므로 받지
않습니다.

비교 패널은 키보드로 접근할 수 있고, 보이는 조작 요소는 최소 44픽셀 높이를
유지하며, 모바일 너비에서 가로 넘침 없이 쌓입니다.

## 권한과 주장 경계

다음 작업은 비교가 끝난 뒤에도 승인 대기 상태입니다.

- 대상 저장소 수정;
- commit과 push;
- deployment;
- 외부 쓰기.

비교 작업은 로컬 쓰기, 대상 수정, 외부 쓰기, 네트워크 호출을 수행하지 않습니다.
두 보고서에 이미 담긴 근거를 넘어 runtime 동작을 확인하지 않으며, 운영 품질,
고객 채택, 사업 성과를 증명하지 않습니다.

## 권장 반복 흐름

1. 구현 전에 baseline quality report를 보존합니다.
2. 승인된 변경만 구현합니다.
3. 같은 대상과 맥락으로 candidate report를 만듭니다.
4. 두 원본 보고서를 비교합니다.
5. 악화와 불확실을 해결하거나 수용 이유를 기록합니다.
6. 비교 결과를 구현, 브라우저, 출시 증빙과 함께 보관합니다.
