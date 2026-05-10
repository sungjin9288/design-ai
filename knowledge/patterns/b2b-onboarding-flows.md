<!-- hand-written -->
---
title: B2B onboarding flows — pacing, sensitive data, bilingual
applies_to: [onboarding, forms, b2b, korean]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# B2B onboarding flows

Onboarding for B2B SaaS — especially HR / payroll / finance products handling sensitive employee data — has constraints that consumer onboarding doesn't. This file covers the decisions that recur across Korean B2B onboarding products.

This file emerged from the v4.7 dogfood test (Korean HR onboarding scenario). Pairs with [`onboarding.md`](onboarding.md) (general) and [`form-design.md`](form-design.md).

## What's different from B2C

| Concern | B2C | B2B (especially HR / fintech) |
| --- | --- | --- |
| Data sensitivity | Email / name | 주민등록번호 / 통장 사본 / 계약서 |
| Verification flow | Self-driven | HR mediates; admin approves |
| Multi-step pacing | 2-3 steps | 5-9 steps (legal disclosures) |
| Auto-save | Optional | Required (long flows; resume next day) |
| Locale | Single | Often KR primary + EN toggle (international hires) |
| Audit trail | Light | Required (when, who, what changed) |
| Dropout cost | User abandons app | HR has to re-onboard (high cost per drop) |

## Pacing

### 5-9 steps is the band

Fewer than 5: typically missing legal disclosures. More than 9: completion drops sharply.

Standard Korean HR onboarding sequence:

1. **계정 생성 / 본인 확인** — email + password OR SSO via company IdP. Usually pre-set by HR.
2. **기본 정보** — 이름 / 사번 / 입사일 / 부서.
3. **연락처 / 주소** — phone, address, emergency contact.
4. **신분증 업로드** — 주민등록증 or 운전면허증 (필수). Front + back.
5. **계좌 정보** — 통장 사본 + 계좌번호 (for payroll). Bank verification API where available.
6. **계약서 확인 + 서명** — read PDF, e-signature. 청약철회 disclosure.
7. **세무 / 보험** — 4대보험 가입, 부양가족 등록 (if applicable).
8. **IT 계정 / 장비 신청** — laptop model, software access requests.
9. **입사 첫 주 체크리스트** — onboarding tasks scheduled with manager.

### Pace markers

Show "X / N" prominently. New hires *will* abandon mid-flow if they can't see the end.

```tsx
<Stack direction="row" alignItems="center" gap={1}>
  <Typography variant="caption" color="text.secondary">
    3 / 9
  </Typography>
  <LinearProgress value={(3/9)*100} sx={{ flex: 1 }} />
</Stack>
```

Not "Step 3 of 9" in English on Korean UI. Use "3 / 9" or "3단계 / 9단계".

## Auto-save

### Why required, not optional

A new hire fills out their info Friday afternoon. They get pulled into orientation. They don't return until Monday. If their work was lost: they're frustrated, HR is frustrated, and it leaks into the new-job experience.

### Strategy

- **Auto-save on field blur** — Fire a debounced save (500ms after last change). Show a subtle "저장됨 5분 전" indicator.
- **Server-side draft state** — Persist to DB, not just localStorage. Cross-device resume.
- **Resume notification** — On return, show a Dialog: "이전에 작성한 내용이 있어요. 이어서 할까요?"

### Don't

- Don't auto-submit. Auto-save is "we won't lose your work"; submit is explicit user intent.
- Don't show "Saving..." every 2 seconds. Aggregate to a single subtle indicator.

## Sensitive data fields

### 주민등록번호 (Resident Registration Number)

- 13 digits, two parts (6-7 with hyphen).
- **Mask after first 6 digits** in the UI (`123456-*******`). Show full only when actively editing AND the field has focus.
- **Don't autocomplete** (`autocomplete="off"`).
- **Don't log** in any audit / analytics. Server-side: hash before storage; never log plain.
- For non-Korean hires, provide alternate "Tax ID" / passport number flow.

### 통장 사본 (Bankbook copy)

- Upload accepts PDF / JPG / PNG.
- Max size 5 MB.
- Show preview after upload (privacy: blur account number partially).
- Provide "사진 다시 찍기" button — phone uploads often have glare.

### Address (주소)

- Use 도로명 주소 (road name address) — government standard since 2014.
- Integrate Daum Postcode API or KakaoMap address search. Free for most use cases; cite [`knowledge/i18n/korean-product-conventions.md`](../i18n/korean-product-conventions.md).
- Don't require apartment / dong / ho — accept text input.

### Required disclosures

Korean labor law (근로기준법) + 개인정보보호법:

- **개인정보 수집 / 이용 동의** — checkbox + link to full text. Not pre-checked.
- **민감정보 (주민번호 / 계좌) 처리 동의** — separate checkbox.
- **마케팅 수신 동의** — opt-in (NOT opt-out). Default unchecked.
- **3rd-party data sharing** — list each recipient + purpose.

Cite [`knowledge/patterns/auth-flow-design.md`](auth-flow-design.md) for consent UX patterns.

## Bilingual KR + EN flows

### When to support both

- International hires (foreign nationals at Korean companies).
- Korean expats returning.
- Korean companies with English working language (some scaleups).

### Strategy

- **Toggle at top of every onboarding step**.
- **Default to KR** for `.kr` domain access; default to EN for non-KR locale.
- **Mirrored translation, not parallel screens** — same flow, just UI strings swapped.
- **Don't auto-translate** form labels. Hire a Korean-fluent EN translator who understands HR terminology (사번 → "employee ID" not "company number"; 부서 → "department" not "branch").

### Mixed-locale data

- Names: accept both Hangul AND Latin. Capture both ("English name (영문명)" optional field).
- Phone: KR format primary; international format for foreign hires (+82-10-...).
- Bank: KR banks always; some companies allow international account for foreign hires.

## State recovery / error recovery

### "Submit failed" on the final screen

Worst-case scenario in long onboarding. User has filled 9 screens, hits submit, network errors.

**Strategy**:
1. Don't reset any form state on error.
2. Surface error inline + as toast.
3. "다시 시도" button — re-submits the saved draft.
4. If repeated failures: "관리자에게 알리기" — sends the draft to HR via different channel.

### Mid-flow validation errors

Validate per-step (not per-field), AT submit click of "다음 단계":
- If invalid: highlight all bad fields at once. Don't drip them out one-at-a-time as user fixes each.
- Scroll to first invalid field. Focus it. Cite [`knowledge/a11y/keyboard-and-focus.md`](../a11y/keyboard-and-focus.md).

## What HR sees vs new hire sees

Two views of the same flow:

| New hire screen | HR admin view |
| --- | --- |
| Fill form | See completion % + flagged items |
| Upload documents | Review uploads + approve/reject |
| Sign contract | See timestamp + IP + signature image |
| Submit | Get notified; can edit on behalf of hire |

Build the HR side AFTER the hire side has been dogfooded with 5+ real users. The temptation is to build them together — but HR features need real flow understanding first.

## Don't

- Don't put 주민등록번호 in step 1. It's high-friction; ease in with name + email first.
- Don't show "0% complete" — show "1 / 9" so users feel progress immediately.
- Don't make the cancel button hard to find — users will close the tab if Esc doesn't work, losing draft state.
- Don't auto-translate KR ↔ EN — use a real translator.
- Don't ship without auto-save. Period.
- Don't log sensitive fields in any analytics, ever.
- Don't put marketing opt-in on the same screen as legal-required consents — separate, optional, unchecked.

## Cross-reference

- [`knowledge/patterns/onboarding.md`](onboarding.md) — general onboarding patterns
- [`knowledge/patterns/form-design.md`](form-design.md) — form pacing + validation
- [`knowledge/patterns/auth-flow-design.md`](auth-flow-design.md) — consent UX
- [`knowledge/i18n/korean-product-conventions.md`](../i18n/korean-product-conventions.md) — Korean form conventions
- [`knowledge/i18n/korean-payments.md`](../i18n/korean-payments.md) — bank account capture
- [`knowledge/a11y/keyboard-and-focus.md`](../a11y/keyboard-and-focus.md) — focus management
- [`examples/cases/dogfood-v4-korean-hr-onboarding.md`](../../examples/cases/dogfood-v4-korean-hr-onboarding.md) — worked example using this knowledge
