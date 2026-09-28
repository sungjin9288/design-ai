<!-- hand-written -->
---
title: Interface copy quality — review lens contract
applies_to: [web, mobile, all-ui, ux-audit, website-improvement, korean-market]
version: 1.0.0
last_updated: 2026-09
stability: beta
---

# Interface copy quality

This is the review contract for interface copy: button labels, form text,
errors, empty states, notifications, onboarding, and destructive confirmations.
It is a lens inside UX and website review, not a standalone command. The
[fixture set](interface-copy-fixtures.json) holds one Korean and one English
before/after case for every surface, and `npm run content:check` validates the
fixtures against this contract.

Copy is judged against the user's goal in that moment. A string is good when the
user knows what happened, what the control does, and what to do next, in the
product's own voice, and when a screen reader conveys the same meaning.

## Criteria

Every finding names exactly one criterion. Use these IDs verbatim.

| Criterion | The copy passes when | Typical failure |
| --- | --- | --- |
| `purpose` | Each control says what it does, and each message says what happened, in terms of the user's goal. | `확인`, `OK`, or `Next` on a button whose result the user cannot predict |
| `clarity` | It uses the user's words, one idea per string, and no internal codes or system jargon. | `Error 502`, `데이터 없음`, `Invalid input` |
| `concision` | The key information comes first and nothing repeats. Length follows the moment, not a character quota. | A welcome headline that runs to two lines before saying anything |
| `conversational-fit` | The tone suits the moment and the product voice. It never blames the user or cheers over a failure. | `Contact your administrator.` as the only path forward |
| `error-recovery` | A failure says what happened, keeps the user's input, and offers a concrete next action. | An error whose only button is `확인` |
| `accessibility` | The accessible name contains the visible label (WCAG 2.5.3), status changes are announced with the same meaning (WCAG 4.1.3), and nothing relies on color or an icon alone. | A button labelled `확인` whose accessible name is `버튼`; a toast announced as `Alert` |
| `localization` | No string is built by concatenation. It uses locale formats for numbers, dates, and money, handles plurals and Korean particles, and has no untranslated fragments. | `photo(s)`, `Welcome` inside a Korean screen |
| `korean-honorific-consistency` | One register holds across a flow: 해요체 for consumer products, 합쇼체 for formal or financial moments. Button labels stay register-neutral nouns or verb stems. | `입력하세요` next to `잘못된 입력입니다` in one form |

`korean-honorific-consistency` applies only to Korean copy. The register is a
property of the product voice, not of the moment: 해요체 for consumer products,
합쇼체 for formal products such as banking or government. Record it before the
review. A finding under this criterion quotes a sentence whose register differs
from the product register.

## Surfaces

Each surface has required parts, one primary control, and facts the copy must
convey. The primary control's accessible name must start with its visible label,
and the label must not be a generic acknowledgement such as `확인`, `Yes`, `OK`,
`Next`, or `Continue`.

| Surface | Required parts | Primary control | Must convey | Must also hold |
| --- | --- | --- | --- | --- |
| `button` | `label` | `label` | `action` | The label names the result. |
| `form` | `label`, `helper`, `error` | `label` | `object`, `format` | The error states the valid format; the helper gives an example when the format is not obvious. |
| `error` | `title`, `body`, `action` | `action` | `object`, `input-kept`, `action` | The body says whether the user's input is kept; the action retries or routes around the failure. |
| `empty-state` | `title`, `body`, `action` | `action` | `object`, `action` | It says why the space is empty and how it fills. |
| `notification` | `message`, `announcement` | — | `object`, `result` | The live-region announcement carries every conveyed fact. |
| `onboarding` | `title`, `body`, `action`, `secondary` | `action` | `action`, `skip` | The action names the first useful step, and `secondary` keeps skipping possible. |
| `destructive-confirmation` | `title`, `body`, `confirm`, `cancel` | `confirm` | `object`, `consequence`, `action` | The title names the object, the body states the irreversible consequence, and `confirm` repeats a key word of the title. |

A conveyed fact has a role (`object`, `action`, `result`, `format`,
`consequence`, `amount`, `input-kept`, or `skip`) and the exact text that carries
it. The Korean and English versions of one case must convey the same roles with
the same numbers.

## How to review

1. **State the user goal and the voice.** Write down the moment ("the payment
   just failed", "the list is empty on first visit") and the product register.
2. **Collect the exact strings.** Record the visible text, the accessible name of
   each control, and any live-region announcement. If you can only see a
   screenshot and not the accessible name, mark accessibility findings
   `unverified` instead of guessing.
3. **Walk the surface row.** Check the required parts and the primary-control
   rule first, then the eight criteria.
4. **Write one finding per defect.** Quote the exact current string as evidence,
   name the criterion, explain the user impact, and give the replacement string.
5. **Keep meaning across locales.** When the product ships Korean and English,
   the replacement in each locale must convey the same facts: object, amount,
   consequence, and next action. Do not translate word for word.

## Finding format

| Field | Rule |
| --- | --- |
| `criterion` | One ID from the criteria table |
| `surface` | One ID from the surfaces table; a fixture records it once for all its findings |
| `part` | The required part that holds the string, or `accessibleName` |
| `severity` | `p0`–`p3`, as in the [design-quality contract](../../docs/DESIGN-QUALITY-CONTRACT.md) |
| `evidence` | The exact current string from that part, quoted |
| `why` | The user impact in one or two sentences |
| `fix` | The exact replacement string for the same part |
| `verification` | How to confirm the fix: re-read, screen-reader pass, or locale check |

A finding without a quoted current string stays `unverified`.

## Readability scores are context, not verdicts

No readability score becomes a substitute for the user goal or for evidence.
Formulas such as Flesch reading ease do not model Korean, UI fragments, or task
context. You may record one as background, but it never passes or fails a string,
never ranks findings, and never becomes an aggregate copy grade. Each finding
stands on its own quoted evidence and criterion.

## Korean specifics

- **Register.** 해요체 (`저장했어요`) is the default for consumer products.
  합쇼체 (`저장했습니다`) suits formal products such as banking or government.
  Never mix registers in one flow. Avoid 음슴체 (`사용할 수 있음`) in sentences,
  and use 반말 only when the brand voice explicitly defines it.
- **Buttons.** Use a noun (`저장`, `삭제`) or a verb stem with `-기`
  (`다시 결제하기`). Keep one style per product.
- **Particles with variables.** `{name}을(를)` reads as machine text. Choose the
  particle from the final consonant in code, or rewrite the sentence so no
  particle follows the variable.
- **Numbers.** Write money as `12,400원` and counts with counters (`사진 3장`).
- **No English fragments** such as `Welcome` or `Error` in Korean UI unless they
  are brand names. List the brand terms with the review.

See [Korean product conventions](../i18n/korean-product-conventions.md) and
[Korean document style](../i18n/korean-document-style.md) for the wider rules.

## Don't

- Don't use `확인`, `OK`, `Yes`, or `Next` when the label can name the result.
- Don't blame the user (`잘못 입력하셨습니다`) or cheer over a failure.
- Don't show internal codes without a plain explanation and a copy affordance.
- Don't let the accessible name drift from the visible label.
- Don't treat a shorter string as better without checking that it still carries
  the object, consequence, and next action.

## Cross-reference

- [`knowledge/patterns/error-states.md`](error-states.md) — error anatomy and recovery actions
- [`knowledge/patterns/empty-states.md`](empty-states.md) — the four kinds of empty
- [`knowledge/patterns/form-design.md`](form-design.md) — field labels, helpers, and validation timing
- [`knowledge/patterns/onboarding.md`](onboarding.md) — first-run and feature discovery
- [`knowledge/patterns/technical-writing.md`](technical-writing.md) — voice and sentence rules for docs
- [`knowledge/conversational/korean-voice-conventions.md`](../conversational/korean-voice-conventions.md) — honorific levels in conversational UI
- [`knowledge/a11y/keyboard-and-focus.md`](../a11y/keyboard-and-focus.md) — focus handling for dialogs and toasts
