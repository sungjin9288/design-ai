<!-- hand-written -->
---
title: Korean document style — voice, hierarchy, conventions
applies_to: [korean-docs, korean-reports, korean-presentations, korean-marketing-prose]
---

# Korean document style

How Korean documents differ from Latin / English ones in voice, hierarchy, formatting, and convention. Critical for any document going to a Korean audience.

## Honorific level (존댓말 vs 반말)

The first decision: which level of speech. Different from "polite vs casual" in English — Korean has structural levels.

| Level | When to use | Example |
| --- | --- | --- |
| **합쇼체** (~합니다 / ~입니다) | Formal — official documents, contracts, B2B reports, government, banking, business proposals | "본 보고서는 ... 분석합니다." |
| **해요체** (~해요 / ~예요) | Polite-casual — consumer apps, friendly product docs, customer-facing | "이 기능은 자동으로 동기화돼요." |
| **해체** (반말, ~해 / ~야) | **Don't use** in product docs / customer-facing | (avoid) |
| **하게체** / **하오체** | Archaic / regional. Avoid. | — |

For most product documentation: **합쇼체** is the default.
For consumer / friendly docs: **해요체** is acceptable.

### Mixing

Don't switch levels within a document. Pick one and commit.

Common error: mixing **하십시오체** ("주십시오" = please) with **해요체** in the same paragraph. Pick one register.

## Punctuation

Korean documents use **English punctuation conventions** when mixed with code or English terms:

```
✓ "API는 다음과 같이 작성됩니다: ..."
✓ "이 함수는 string을 반환합니다."
✗ "API는 다음과 같이 작성됩니다。 ..."   (Japanese punctuation, wrong)
✗ "이 함수는 string을 반환합니다.."     (double period)
```

For purely Korean prose (literary, traditional): the Korean punctuation `.` (full stop) and `,` (comma) work fine — they're Latin marks.

The Japanese-style `。` and `、` are NOT Korean — don't use.

## Hangul + English interleaving

Korean technical docs mix Korean and English heavily. Standard rules:

| Type | Convention |
| --- | --- |
| Code identifiers | English, monospace, no translation: `getUserById()` |
| Function descriptions | Korean prose around English code |
| Acronyms | English: API, URL, JSON, OAuth |
| Brand names | Original: Figma (not 피그마), GitHub (not 깃허브) |
| Technical terms with established Korean | Korean: 사용자 (user), 화면 (screen), 페이지 (page) |
| Newer terms with no established Korean | English in parens: 컴포지션 (composition) |

Example sentence:
```
"이 API는 사용자 ID를 받아 User 객체를 반환합니다."
```

Korean for "this API takes user ID and returns User object." Korean prose, English code, English-Korean technical terms.

## Spacing

Korean text has **specific spacing rules** (띄어쓰기). They differ from English. Common cases for product docs:

| Rule | Example |
| --- | --- |
| Particles attach to noun | `사용자가` (not `사용자 가`) |
| Compound noun: typically together | `로그인 화면` OK; `로그인화면` also OK in technical docs |
| Number + unit: separate | `5 ms`, `12 px`, `30 초` |
| Foreign word (loanword) + Korean: separate | `API 호출`, `JSON 파싱` |

Many subtle rules. For docs: use a Korean spell-checker / `하나님의서랍` / similar tool.

## Hierarchy structures

Korean documents use **numbered hierarchical sections** more than English ones:

```
1. 개요
   1.1. 배경
   1.2. 목적
2. 분석
   2.1. 현황
       2.1.1. 사용자 행동
       2.1.2. 매출 추이
   2.2. 문제점
3. 제안
   3.1. ...
```

Western docs often skip numbering past the title. Korean business docs (보고서, 제안서) standard practice is full numeric hierarchy.

For technical product docs: less strict — heading levels are enough.

## Heading-numbering equivalents

Korean documents may use these markers for sub-points:

| Marker | Use |
| --- | --- |
| 가, 나, 다, ... | Sub-bullet ordering (alphabetical equivalent) |
| ㄱ, ㄴ, ㄷ, ... | Older alphabetical |
| 1, 2, 3 | Standard numeric |
| ①, ②, ③ | Tight numeric (often used in compact specs) |
| ㉠, ㉡, ㉢ | Alternative — common in legal docs |

Most product / technical docs: `1, 2, 3` and `가, 나, 다` are sufficient.

## Document framing

### 보고서 (formal report)

Typical structure:

```
표지 (cover page)
  - Title
  - Subtitle / period
  - Author / dept
  - Date

목차 (table of contents)

I. 개요 (Overview)
II. 본론 (Body)
III. 결론 (Conclusion)
IV. 부록 (Appendix)
```

Each section uses Roman numeral I/II/III, then sub-numbers.

### 제안서 (proposal)

Sales / business proposal:

```
1. 회사 소개
2. 제안 요약
3. 제공 내용
   3.1. 범위
   3.2. 일정
   3.3. 비용
4. 기대 효과
5. 부록
```

### Tutorial / 튜토리얼

Friendlier, less hierarchical:

```
시작하기
첫 번째 단계
두 번째 단계
완료!
```

Headings can be questions ("이 단계는 무엇을 하나요?") or statements ("프로젝트를 만들어 봅시다").

## Numbers and statistics

Korean documents typically:
- Numerals in Arabic digits, separators with `,` (Western convention).
- Korean number names (만, 억) for very large display numbers.
- "약" (approximately) before estimated numbers.
- "이상" / "이하" for ranges ("100명 이상", "10% 이하").
- 백분율 / 퍼센트: `80%` (Latin) or `80퍼센트` (Korean) — both acceptable.

## Dates and times

| Format | Example | Use |
| --- | --- | --- |
| YYYY.MM.DD | `2026.05.08` | Compact — most product docs |
| YYYY년 M월 D일 | `2026년 5월 8일` | Formal |
| YYYY-MM-DD | `2026-05-08` | Technical / ISO |
| M월 D일 (요일) | `5월 8일 (목)` | Casual |

Time:
- 24-hour: `14:30` — most Korean docs.
- 12-hour: `오후 2:30` — older / formal.

Mix consistently within a doc.

## Currency

| Format | Use |
| --- | --- |
| `1,200,000원` | Suffix style (consumer / casual) |
| `₩1,200,000` | Prefix style (fintech / Western-coded) |
| `120만원` | Korean compact (만/억) |
| `1.2M원` | Mixed (rare in formal docs) |

Cite [`knowledge/patterns/money-and-amount.md`](../patterns/money-and-amount.md). Pick one and stay consistent.

## Korean technical writing tone

Per [`knowledge/patterns/technical-writing.md`](../patterns/technical-writing.md), but for Korean:

### Polite imperative

| English imperative | Korean (~합니다 / 합니다) |
| --- | --- |
| "Save the file." | "파일을 저장합니다." (declarative) / "파일을 저장하세요." (imperative) |
| "Run the command." | "명령어를 실행합니다." / "명령어를 실행하세요." |
| "Click the button." | "버튼을 클릭하세요." |

For instructional docs: imperative `~하세요` is standard.
For passive description: `~합니다` (the function does X).

### Voice attributes

For most product docs:
- **차분함 (calm)** — no hype.
- **명확함 (clarity)** — short sentences, one idea each.
- **친절함 (kind)** — guide the reader, don't lecture.

For Korean fintech / banking docs specifically:
- More formal (~합니다).
- Conservative palette / typography.
- Numbered structure.
- Disclaimers + legal language at the end.

## Common Korean document errors

### Particle errors
- 은/는 vs 이/가: subject vs topic. Subtle but matters.
- 을/를: object marker.
- 의 (overuse): "사용자의 데이터의 처리" feels stiff. Prefer compound: "사용자 데이터 처리".

### Repetition
Korean is **less tolerant of word repetition** than English. Vary verbs, find synonyms.

```
✗ "이 함수는 데이터를 받아서, 데이터를 처리하고, 데이터를 반환합니다."
✓ "이 함수는 데이터를 받아 처리한 후 결과를 반환합니다."
```

### Direct translation from English
Many phrases that are natural in English are awkward in Korean:

| Don't translate directly | Use instead |
| --- | --- |
| "Make sure to ..." | "반드시 ~합니다." |
| "Click here to ..." | "이곳을 클릭하면 ~됩니다." |
| "Note that ..." | "참고: ~", "주의: ~" |
| "By default, ..." | "기본값은 ~입니다." |
| "X will ..." (future tense for behavior) | "X가 ~합니다" (present tense, declarative) |

Read aloud — if it sounds like a translation, rewrite.

## Korean document templates

### Email — formal business

```
[받는 분 이름] 님,

안녕하세요. [회사명] [부서명] [본인 이름]입니다.

[본문 — 폐쇄형 문장 유지]

검토 후 회신 부탁드립니다.

감사합니다.

[본인 이름]
[직책 / 부서]
[연락처]
```

### Email — friendly product

```
안녕하세요, {{first_name}} 님.

[본문]

감사합니다.
{{Company name}} 드림
```

### Internal Slack / messenger

Casual ~해요 acceptable. Bullet points common.

## Cross-reference

- [`knowledge/i18n/korean-typography.md`](korean-typography.md) — type rules
- [`knowledge/i18n/korean-product-conventions.md`](korean-product-conventions.md) — broader Korean UX conventions
- [`knowledge/patterns/document-typography.md`](../patterns/document-typography.md) — visual styling
- [`knowledge/patterns/technical-writing.md`](../patterns/technical-writing.md) — voice rules
- [`knowledge/patterns/report-design.md`](../patterns/report-design.md) — report structure
- [국립국어원](https://www.korean.go.kr/) — official Korean language reference
