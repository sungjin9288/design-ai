# 표준 디자인 리뷰 워크플로우

이미 HTML 산출물이 있고, 디자인 의도에서 리뷰 판단까지 하나의 근거 흐름으로
확인하고 싶을 때 표준 리뷰 워크플로우를 사용합니다.

이 워크플로우는 기존의 읽기 전용 시작 계획과 정적 품질 보고서를 결합합니다.
두 산출물을 새로운 요약 속에 숨기지 않습니다. 원래 계약을 그대로 유지하고
SHA-256 근거로 연결합니다.

## 리뷰 한 번 실행하기

```bash
design-ai review page.html \
  --brief "한국 계정 설정 흐름을 검토한다" \
  --locale ko-KR \
  --viewport mobile \
  --viewport desktop \
  --review-pack korean-fintech \
  --json > review-workflow.json
```

명령이 프로젝트에서 읽는 산출물은 지정한 HTML 파일 하나뿐입니다. 저장소,
페이지, 스크린샷 옵션은 계획에 기록하는 선언입니다. Design AI가 가져오거나
검사하지 않습니다.

터미널에서 바로 읽으려면 사람용 출력을 사용합니다.

```bash
design-ai review page.html \
  --brief "계정 설정 흐름을 검토한다" \
  --locale ko-KR
```

## 결과 읽기

`design-ai-review-workflow` v1에는 다음 내용이 들어 있습니다.

1. `source`: HTML 원본의 정확한 바이트 길이와 SHA-256 해시
2. `plan`: `design-review` 경로를 사용하는 원래 `design-ai-start` 계약
3. `report`: 원래 `design-ai-quality-report` 계약
4. `linkage`: 문맥 일치 결과와 계획, 디자인 계약, 보고서 해시
5. `stages`: 표준 리뷰 단계
6. `nextAction`: 사람이 결정해야 할 다음 행동과 승인 조건
7. `boundary`: 읽기 전용 효과 계약

단계는 실제 진행 상태만 말합니다.

| 단계 | 최초 상태 | 의미 |
|---|---|---|
| 계획 | `complete` | 경로와 디자인 계약이 준비됐습니다. |
| 정적 리뷰 | `complete` | 지원하는 마크업 근거를 검사했습니다. |
| 브라우저 검증 | `not-run` | 실제 동작은 아직 실행하지 않았습니다. |
| 구현 인계 | `not-started` | 대상 저장소 작업을 시작하지 않았습니다. |

`linkage`가 `pass`라는 뜻은 두 산출물의 brief, locale, viewport, source
reference가 같다는 뜻입니다. 디자인 리뷰를 통과했다는 뜻은 아닙니다.
품질 판단은 `report.summary.status`와 각 finding의 상태를 따로 읽어야 합니다.

## 에이전트에서 같은 워크플로우 사용하기

### Node.js SDK

```js
import { readFileSync } from "node:fs";
import { reviewHtml } from "@design-ai/cli/sdk";

const source = readFileSync("page.html", "utf8");
const workflow = reviewHtml(source, {
  sourceRef: "page.html",
  brief: "한국 계정 설정 흐름을 검토한다",
  locale: "ko-KR",
  viewports: ["mobile", "desktop"],
  reviewPack: "korean-fintech",
});
```

### MCP

같은 HTML과 문맥으로 `design_ai_review_html`을 호출합니다. Claude, Codex 또는
다른 MCP client가 CLI subprocess 없이 같은 계약을 받습니다.

```json
{
  "source": "<!doctype html>...",
  "sourceRef": "page.html",
  "brief": "한국 계정 설정 흐름을 검토한다",
  "locale": "ko-KR",
  "viewports": ["mobile", "desktop"],
  "reviewPack": "korean-fintech"
}
```

### Website Console

Website Console에서 `review-workflow.json`을 가져옵니다. Console은 원본 JSON
바이트를 보존하고, 내부의 계획과 품질 보고서, 순서가 있는 단계 흐름을
보여줍니다. 다시 내보낼 때도 재구성한 사본이 아니라 원본을 반환합니다.

## 권한 경계

이 워크플로우는 다음 경계를 지킵니다.

- CLI에서는 지정한 일반 HTML 파일 하나, SDK와 MCP에서는 전달받은 문자열만
  읽습니다.
- 패키지에 포함된 Design AI 코퍼스와 명시적으로 선택한 리뷰 팩만 읽습니다.
- script나 browser를 실행하지 않습니다.
- 선언한 저장소, URL, 스크린샷을 검사하지 않습니다.
- 로컬 근거 파일을 쓰지 않습니다.
- 대상 저장소를 수정하지 않습니다.
- 외부 서비스를 호출하지 않습니다.
- 학습 신호를 기록하지 않습니다.

locale만으로 제품 리뷰 팩을 고르지 않습니다. 해당 제품 계약이 실제로 적용될
때만 팩을 명시적으로 선택합니다.

브라우저 검증과 구현은 각각 별도의 승인이 필요한 다음 단계입니다. 각 단계의
근거 계약이 생기기 전에는 완료됐다고 표현하지 않습니다.

## 인수 확인

준비된 HTML fixture를 검토했을 때 source 해시가 보존되고, 모든 linkage가
통과하며, confirmed와 unverified finding이 분리되어야 합니다. 브라우저 검증은
`not-run`, 구현은 `not-started`여야 하며, 로컬·대상 저장소·외부 쓰기는 모두
없어야 합니다.
