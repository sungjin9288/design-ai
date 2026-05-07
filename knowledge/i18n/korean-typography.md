<!-- hand-written -->
---
title: Korean (Hangul) typography for product UI
applies_to: [korean-market, hangul, cjk, web, mobile]
---

# Korean (Hangul) typography for product UI

Designing for Korean users requires deliberate adjustments. Latin defaults from MUI, Ant Design, or Tailwind do not translate. This is the floor.

## Why Hangul is different

- **Glyph shape**: Hangul is composed of jamo blocks stacked in roughly square cells. Latin glyphs sit on a baseline; Hangul fills the cell.
- **Vertical metrics**: descenders (받침, batchim) reach noticeably lower than Latin descenders. Default Latin `line-height` truncates them or makes adjacent lines feel cramped.
- **Optical weight**: Korean fonts at the same numeric weight (e.g., 400) read **lighter** than Latin sans-serif. A "regular" Hangul body looks thin next to "regular" Inter.
- **Width**: Hangul characters are roughly fixed-width per syllable block. Reading speed depends more on line length than on tracking.
- **No italics**: traditional Hangul has no italic form. Italicized Hangul looks broken and is non-idiomatic. Use weight or color for emphasis instead.

## Type scale adjustments

Start from your Latin scale, then apply:

| Property | Latin default | Korean adjustment |
| --- | --- | --- |
| `line-height` (body) | 1.5 | **1.6–1.7** |
| `line-height` (headings 24+px) | 1.3 | **1.4** |
| `letter-spacing` (body) | `0` or `-0.005em` | **`0`** (don't tighten) |
| `letter-spacing` (caps/labels) | `0.05em` | **`0`** — no all-caps in Hangul anyway |
| `font-weight` (body emphasis) | 500 (Medium) | **600** (SemiBold) — 500 reads too light |
| `font-weight` (UI labels) | 500 | **500–600** depending on font |

## Recommended typefaces

### Free / open-source (Korean-only)

| Font | License | Best for | Notes |
| --- | --- | --- | --- |
| **Pretendard** | OFL | Universal — body, UI, headings | De facto Korean Inter. Excellent variable. Pairs with itself for Latin (Pretendard mixes Inter glyphs). **Default recommendation.** |
| **Noto Sans Korean** (Noto Sans KR) | OFL | Body, system fallback | Google's pan-CJK. Heavy file size in static; use variable. |
| **Spoqa Han Sans Neo** | OFL | UI, formal product | Spoqa's UI-focused face. 7 weights. Slightly more rigid than Pretendard. |
| **Apple SD Gothic Neo** | system | iOS / macOS only | iOS native. Use for native apps only. |

### Free fonts to avoid for product UI

- **Nanum Gothic** — designed for print legibility, lower x-height, looks dated in product UIs.
- **Malgun Gothic** — Windows system. Renders inconsistently across platforms.
- **Black Han Sans** etc. — display-only, not for body.

### Pairing strategy

For Korean-primary products with English secondary content:

```css
font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI',
             'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif;
```

Pretendard's design covers Latin and Hangul in matched proportions, so a single stack handles both. **Do not** pair `Inter` (Latin) + `Spoqa Han Sans` (Hangul) — the Latin x-heights mismatch.

For Korean-secondary products (English-primary with KR locale):

```css
font-family: Inter, -apple-system, 'Apple SD Gothic Neo',
             'Noto Sans KR', sans-serif;
```

Inter is Latin-only. The OS / Noto fallback handles Hangul. This is acceptable but the size-mismatch between Inter and Noto KR will be visible — tune `font-size-adjust: 0.5` (browser support 2024+) or accept the small inconsistency.

## Numerical readout

Korean readers expect:
- **Numbers in Latin glyphs** (`1234`), not Hangul number words.
- **Comma thousands separator** (`1,234,567`) — same as US.
- **Won symbol**: `₩` prefix or `원` suffix. `₩1,200` is more "fintech/Western"; `1,200원` is more "consumer/local". Pick one and be consistent.
- **Date format**: `2026년 5월 7일` (formal), `2026.05.07` (compact), `2026-05-07` (technical). Default to `YYYY.MM.DD` for most product UIs.
- **Phone**: `010-1234-5678` (mobile), `02-1234-5678` (Seoul landline). Hyphenated, never spaces.

## Common product UI strings — bar for tone

| Action | Casual / friendly | Polite / formal |
| --- | --- | --- |
| Save | 저장 | 저장하기 |
| Delete | 삭제 | 삭제하기 |
| Cancel | 취소 | 취소 |
| Confirm | 확인 | 확인 |
| Sign in | 로그인 | 로그인 |
| Sign out | 로그아웃 | 로그아웃 |
| Sign up | 가입 | 회원가입 |
| Submit | 제출 | 제출하기 |
| Loading | 로딩 중 | 불러오는 중 |
| Error | 오류 | 오류가 발생했습니다 |

Casual tone fits B2C, social, fintech consumer apps. Polite/formal fits enterprise, healthcare, finance B2B.

Avoid:
- Mixing tones within a screen.
- Direct translation of "Submit" (use 등록/저장 depending on context, rarely 제출 outside formal forms).
- Loanword preference where a clean Korean exists (저장 over 세이브).

## Layout adjustments

- **Form labels**: above inputs (not beside) — Korean labels often run longer than English equivalents.
- **Button width**: minimum padding inline 16px. Korean labels like "회원가입하기" need width; tight buttons crop awkwardly.
- **Truncation**: Korean truncation with `…` reads cleanly per syllable; mid-word break is rare. CSS `text-overflow: ellipsis` works.
- **Word break**: avoid `word-break: break-all` for Hangul — it breaks mid-syllable. Use `word-break: keep-all` (browser-supported, prevents breaking inside a Hangul syllable cluster).
- **Justified text**: `text-align: justify` rarely looks good with Hangul; whitespace gaps are jarring. Stick to `left`.

## Readability check

A Korean body paragraph is readable when:
- 14–16 px font-size on web, 15–17 pt on mobile native.
- Line length ≈ 35–40 Hangul characters per line (vs ~70 Latin characters).
- 1.6+ line-height.
- Sufficient `paragraph-spacing` (≥ 1em) — Hangul paragraphs blur together without it.

## Cross-reference

- [knowledge/typography/type-scale-fundamentals.md](../typography/type-scale-fundamentals.md) — base scale knowledge
- [knowledge/typography/font-pairings.md](../typography/font-pairings.md) — Latin pairings (apply Korean adjustments on top)
- [knowledge/i18n/korean-publishing.md](korean-publishing.md) — store-listing / submission considerations
