<!-- hand-written -->
---
title: Trust & safety moderation patterns
applies_to: [web, mobile, community, social]
version: 1.0.0
last_updated: 2026-07
stability: stable
---

# Trust & safety moderation patterns

Report and block are the two user-facing safety controls every community product ships. They look small — a menu item and a confirm dialog — but they carry legal obligations (Korea's 정보통신망법), retaliation risk, and abuse vectors that most flows get wrong. This file covers the report flow, moderation status communication, block semantics, and abuse prevention. For the in-flight states of the submit action itself, see [`patterns/async-control.md`](async-control.md).

## Report flow

### Entry and reach

- Entry point: the overflow menu (⋯) on every reportable object — post, comment, profile, DM. Reporting is not a destructive action on the reporter's data; do not style it in destructive red.
- Never hide or bury the report entry to reduce report volume. Reach is a safety property; volume is a moderation-capacity problem, solved by triage, not by friction.
- The whole flow completes in **two taps plus optional text**: open → pick a reason → submit. No review-summary step, no login-wall re-prompt mid-flow.

### Reason taxonomy

Pick 5–6 fixed reasons plus "other". More granularity belongs to the moderation back office, not the reporter.

| Reason | Typical scope |
| --- | --- |
| 스팸/광고 (spam/ads) | Commercial flooding, link farms |
| 욕설·혐오 (abuse/hate) | Harassment, slurs, hate speech |
| 성적 콘텐츠 (sexual content) | NSFW where prohibited |
| 사기·사칭 (fraud/impersonation) | Scams, fake identity |
| 개인정보 노출 (privacy exposure) | Doxxing, leaked personal data |
| 기타 (other) | Free text, 200–500 chars |

- Single-select radio group in a mobile bottom sheet / desktop centered modal (~480px max width).
- "기타" reveals its text area only when selected — progressive disclosure keeps the sheet short.
- Submit stays disabled until a reason is selected.

### After submit

- Immediate acknowledgment: toast or confirmation view — "신고가 접수되었어요. 검토 후 알려드릴게요."
- **Reporter-side soft-hide**: blur or collapse the reported content in the reporter's own feed immediately. This is a client-side courtesy, not a moderation verdict — never present it as "removed".
- Let the reporter optionally block the author from the confirmation view (block and report are independent actions; offer, don't bundle).

## Moderation status communication

Reports move through a visible pipeline. Silence after a report is the top driver of "reporting does nothing" distrust.

```
접수됨 (received) ──▶ 검토 중 (in review) ──▬▶ 조치 완료 (actioned)
                                       └──▶ 기각 (declined)
```

- Surface status in a "신고 내역" (my reports) list — my page or notification center — and push a notification on each transition.
- Status badges use **color + text**, never color alone.
- On 조치 완료, say *that* action was taken, not *what* action ("커뮤니티 가이드라인 위반으로 조치했어요"). Detailing sanctions invites retaliation and gaming.
- On 기각, offer a path to re-report with more context rather than a dead end.

### Korean regulatory floor (정보통신망법)

For services operating in Korea:

- **제44조의2 (임시조치)**: when someone claims a post violates their rights (defamation, privacy), the operator may temporarily blind the content for **up to 30 days** while the dispute is assessed. Design implication: a distinct "임시조치됨" state exists between received and actioned — the content is hidden from everyone, the author is notified with the legal basis and an objection path (이의제기).
- State the expected handling window in the report confirmation ("접수 후 30일 이내 처리"), because the statute anchors user expectations.
- The author of blinded content must see *why* (which clause, who requested category-wise — not the reporter's identity) and *how to object*. An unexplained disappearance is both a UX failure and a legal-risk amplifier.
- Youth-protection categories (청소년유해매체물) carry separate labeling/age-gate duties — treat them as a distinct moderation outcome, not a generic "removed".

## Block semantics

Define the blast radius precisely and document it in the confirm dialog — vague blocking erodes trust in both directions.

| Interaction | After A blocks B |
| --- | --- |
| B views A's profile/posts | Hidden or minimal profile ("게시물이 없어요" 패턴), never "A님이 회원님을 차단했어요" |
| B comments on / DMs A | Blocked at the composer, generic failure copy |
| A sees B's content | Hidden from feeds, search, and notifications |
| Existing follows | Auto-severed both ways |
| Shared spaces (same thread/group) | B's content collapsed for A ("차단한 사용자의 댓글이에요" + 펼치기) |

- **Non-notification principle**: never tell B they were blocked — notification invites retaliation. Accept that B may infer it; do not confirm it.
- Block ≠ report: block is personal distance (immediate, reversible, no review); report is a moderation request (queued, reviewed). Keep the verbs and flows separate.
- Confirm dialog states the scope in one line ("서로의 게시물이 보이지 않고 DM을 보낼 수 없어요"), with focus trap, `Escape` to cancel, and the confirm button carrying the specific verb ("차단하기", never "확인").
- Unblock lives in 설정 > 차단 목록, one confirm, and does **not** restore severed follows — say so.

## Abuse prevention (the reporter side is also an attack surface)

- Rate-limit reports per user per hour; throttle silently past the limit (accept-but-queue) rather than showing "신고 한도 초과", which teaches the abuser the threshold.
- Brigading (mass-report campaigns) means report *count* must never auto-action content by itself; visible counters invite pile-ons — do not show "n명이 신고했어요".
- False-report patterns feed the reporter's own trust score in the back office; the UI stays neutral either way.
- Never let the reported author see who reported them — in any state, including 임시조치 notices and moderation appeals.

## Accessibility floor

- Reason list: `role="radiogroup"`, arrow-key navigation, first radio takes initial focus when the sheet opens.
- Sheet/modal: focus trap, `Escape` closes, `aria-modal="true"`; returning focus to the triggering ⋯ menu on close.
- Status changes announce via `aria-live="polite"` (submit confirmation, status transitions surfaced in-page).
- Touch targets ≥ 44×44px for reason rows and the block confirm actions; 8px spacing grid.
- Status badges and blur overlays meet 4.5:1 contrast; blurred-content notices remain readable text, not just a visual effect.

## Don't

- Don't hide the report entry to suppress report volume — triage capacity is the fix, reach is non-negotiable.
- Don't notify the blocked user, ever — the non-notification principle exists to prevent retaliation.
- Don't show report counts on content — it invites brigading.
- Don't expand the reporter-facing taxonomy past ~6 reasons — classification depth belongs to the moderation back office.
- Don't present the reporter-side soft-hide as a moderation verdict — "숨김" is personal, "조치" is institutional.
- Don't leave 임시조치 unexplained to the author — the legal basis and objection path are part of the design, not legal fine print.
