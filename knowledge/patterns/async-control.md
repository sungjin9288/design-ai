<!-- hand-written -->
---
title: Async control patterns
applies_to: [web, mobile, all-ui]
version: 1.0.0
last_updated: 2026-07
stability: stable
---

# Async control patterns

Every action that talks to a server has an in-flight life. This file is about that life — the moment between the tap and the answer — not about the error screen at the end (see [`patterns/error-states.md`](error-states.md) for that). Get the in-flight state wrong and you get the two most common async bugs in product UIs: double submits and stuck spinners.

## The async action lifecycle

Every async action moves through the same four states. Model them explicitly; do not infer "loading" from the absence of data.

```
 idle ──trigger──▶ pending ──┬──▶ success ──▶ idle
   ▲                         │
   └─────────────────────────┴──▶ error ────▶ idle (retryable)
```

| State | The control shows | The user can |
| --- | --- | --- |
| **idle** | Its normal, enabled label | Trigger the action |
| **pending** | Busy affordance + disabled | Wait, or cancel (if cancellable) |
| **success** | Brief confirmation, then idle | Continue |
| **error** | Recovery affordance | Retry or recover — see `error-states.md` |

Rule: a control never sits in `pending` forever. Every request has a timeout that forces it to `error`.

## Action controls during pending

The trigger control (button, menu item, toggle) is where most async bugs live.

| Do | Don't |
| --- | --- |
| Disable the control while its own action is in flight | Leave it clickable and hope |
| Show a busy affordance **inside or beside** the control | Replace the whole screen with a spinner for a single button |
| Keep the label readable — swap to a present-progressive verb | Blank the label to just a spinner (the user forgets what they clicked) |
| Restore the control on success **and** error | Leave it disabled after a failed request |

Label swap, Korean and English:

| Idle | Pending | Done |
| --- | --- | --- |
| 저장 | 저장 중… | 저장됨 |
| 불러오기 | 불러오는 중… | — |
| 결제하기 | 결제 처리 중… | 결제 완료 |
| 제출 | 제출 중… | — |

```
┌─────────────────┐      ┌─────────────────┐
│     저장         │  →   │  ◌ 저장 중…      │   (disabled, spinner leads label)
└─────────────────┘      └─────────────────┘
```

## Double-submit prevention

The single most important async rule: **a control that started an action cannot start it again until that action resolves.** Disabling on `pending` handles the fast double-tap. Also guard the handler itself, because disabled is a UI state that a determined tap (or a slow render) can beat.

```tsx
function SubmitButton({ onSubmit }) {
  const [status, setStatus] = useState("idle"); // idle | pending | error

  async function handleClick() {
    if (status === "pending") return;   // guard: not just the disabled attr
    setStatus("pending");
    try {
      await onSubmit();
      setStatus("idle");
    } catch (err) {
      setStatus("error");               // hand off to error-states.md
    }
  }

  return (
    <Button onClick={handleClick} disabled={status === "pending"} aria-busy={status === "pending"}>
      {status === "pending" ? "저장 중…" : "저장"}
    </Button>
  );
}
```

For money and irreversible actions (payment, transfer, delete), double-submit guarding is a correctness requirement, not a nicety. Pair the client guard with a server-side idempotency key — cite [`patterns/money-and-amount.md`](money-and-amount.md).

## Choosing a loading affordance by duration

Match the indicator to how long the wait actually is. Guessing wrong is worse than no indicator.

| Expected wait | Affordance | Why |
| --- | --- | --- |
| < 100ms | **Nothing** | Faster than perception; a flashed spinner reads as a glitch |
| 100ms – 1s | **In-place busy** (button spinner, subtle) | Confirms the tap registered |
| 1s – 10s | **Skeleton** (for content) or **progress** (for known-length work) | Shows shape/position; feels faster than a spinner |
| > 10s | **Progress + cancel + background option** | Let the user leave and be notified |
| Unknown length | **Indeterminate spinner with a timeout** | Never an infinite bar |

Spinner vs skeleton: a spinner says "something is happening"; a skeleton says "*this* is what's coming and where." Prefer skeletons for content regions (lists, cards, detail panes) — see [`patterns/list-and-feed.md`](list-and-feed.md). Reserve spinners for actions and small inline waits.

Anti-flicker: if you show a delayed spinner (only after 100–300ms), also hold it for a minimum (~300ms) once shown, so a request that resolves at 310ms doesn't flash. Delay-in, min-hold-out.

## Optimistic updates

Apply the change in the UI immediately, before the server confirms, then reconcile.

Use optimistic when: the action almost always succeeds, is cheap to reverse, and the wait would break flow — likes, toggles, reordering, adding a to-do, marking read.

Do **not** use optimistic when: the action is money, irreversible, or the server is the source of truth for the result (payment, booking a seat, submitting an exam). There, show real `pending` and wait.

```
tap ─▶ update UI now ─▶ fire request ─┬─ ok:   keep, drop the "syncing" mark
                                      └─ fail: roll back to prior value + show why
```

Rules:
- Keep the pre-action value so you can roll back exactly.
- Mark optimistic items as unconfirmed (subtle) until the server agrees, so a rollback isn't a jarring surprise.
- On rollback, tell the user what reverted and why — a silent snap-back looks like a bug.

## Debounce and throttle for async-triggering input

Input that fires requests as the user types or drags must be rate-limited, or it floods the server and races itself.

| Technique | Fires | Use for |
| --- | --- | --- |
| **Debounce** (wait for a pause) | Once, after input stops for N ms | Search-as-you-type (250–350ms), autosave (500ms–2s) |
| **Throttle** (at most every N ms) | On a steady cadence | Drag/scroll-driven fetches, live position updates |
| **Leading + trailing** | Immediately, then once more at the end | Feels responsive but still settles |

Debounce is about *when to fire*; cancellation (next section) is about *what to do with requests already in flight*. You need both.

## Cancellation and out-of-order responses

Two requests fired in order can return out of order. Without cancellation, an older, slower response overwrites a newer one — the classic "I typed 서울, it shows 서" bug.

- Cancel the previous in-flight request when a new one supersedes it (`AbortController` on the web).
- Cancel in-flight requests when the component unmounts or the user navigates away.
- If you cannot cancel, **guard on apply**: tag each request and ignore any response that isn't the latest.

```tsx
useEffect(() => {
  const controller = new AbortController();
  fetchResults(query, { signal: controller.signal })
    .then(setResults)
    .catch(ignoreAbort);
  return () => controller.abort(); // supersede on new query / unmount
}, [query]);
```

## Concurrency policy

When the same action can be triggered while one is running, decide the policy on purpose:

| Policy | Behavior | Use for |
| --- | --- | --- |
| **Block** | Ignore new triggers until the current resolves | Submits, payments (with double-submit guard) |
| **Latest-wins** | Cancel the running one, keep only the newest | Search, filters, autosave |
| **Queue** | Run in order, one at a time | Ordered writes that must all land |
| **Parallel** | Let all run | Independent reads |

Default to **block** for writes and **latest-wins** for reads unless you have a reason otherwise.

## Timeouts and the stuck-spinner failure

A spinner with no timeout is a trap: on a dropped connection it spins forever and the user is stuck.

- Give every request a client timeout (e.g. 10–30s by operation).
- On timeout, transition to `error` with a retry — hand off to [`patterns/error-states.md`](error-states.md) (network/server section, retry with backoff).
- For genuinely long work (video processing, exports), don't hold a spinner — move to a **background job** pattern: acknowledge, let the user leave, notify on completion.

## Perceived performance

The felt speed of an async UI is mostly about what you show during the wait:

- **Optimistic UI** — instant for reversible actions (above).
- **Skeletons** — for content; show structure, not a void.
- **Stale-while-revalidate** — show the last known data immediately, refresh in the background, swap in quietly. Mark it subtly as refreshing so a change isn't startling.
- **Progressive reveal** — render what's ready (shell, then data) instead of blocking on the slowest piece.

## Tokens consumed

```
--color-accent            (spinner, progress fill)
--color-text-secondary    (pending label, "저장 중…")
--color-text-tertiary     (unconfirmed / optimistic mark, "동기화 중")
--color-bg-subtle         (skeleton base)
--color-bg-elevated       (skeleton shimmer highlight)
--radius-md
--space-xs, --space-sm
--duration-fast           (spinner delay-in / min-hold)
--easing-standard
```

## Accessibility

- Set `aria-busy="true"` on a control or region while its action is pending; clear it when resolved.
- Announce state changes politely: a visually-hidden `role="status"` (`aria-live="polite"`) region saying "저장 중" then "저장됨". Do not use `assertive` for routine progress — reserve that for errors (see `error-states.md`).
- Keep the control's accessible name stable and meaningful during pending — the label swap ("저장" → "저장 중…") is fine; an icon-only spinner with no name is not.
- On success that removes the control (e.g. a submit that navigates), move focus deliberately to the next logical element; never drop focus to `<body>`.
- Respect `prefers-reduced-motion`: swap spinners/shimmer for a static or fade indicator.
- Disabled-while-pending must still be perceivable — don't rely on color alone; the busy affordance carries the meaning.

## Korean considerations

Per [`knowledge/i18n/korean-product-conventions.md`](../i18n/korean-product-conventions.md):
- Progress labels use the present-progressive `~중…`: "저장 중…", "불러오는 중…", "처리 중…", "결제 처리 중…".
- Keep pending labels short — Korean verbs + `중…` stay compact, so the button width rarely jumps.
- For payment and transfer flows, show explicit real `pending` (never optimistic) and a clear "결제 처리 중…" state; cite [`knowledge/i18n/korean-payments.md`](../i18n/korean-payments.md) for the surrounding flow and failure messages.
- Dense Korean B2B layouts favor in-place busy affordances (inline spinner, row-level skeleton) over full-page blocking overlays — cite [`knowledge/i18n/korean-product-conventions.md`](../i18n/korean-product-conventions.md) on density.

## Don't

- Don't leave a control clickable during its own async action — the double-submit bug.
- Don't guard double-submit with the disabled attribute alone; guard the handler too.
- Don't show a spinner for a sub-100ms wait — it reads as a flicker.
- Don't show a spinner that can spin forever — every request has a timeout.
- Don't blank a button to a bare spinner; keep a readable pending label.
- Don't use optimistic updates for money, payments, or irreversible actions.
- Don't let an older response overwrite a newer one — cancel or guard-on-apply.
- Don't hold a full-screen spinner for long work — move it to a background job with notify.
- Don't roll back an optimistic change silently — say what reverted and why.
- Don't announce routine progress with `aria-live="assertive"` — that's for errors.

## Cross-reference

- [`knowledge/patterns/error-states.md`](error-states.md) — where the `error` state goes: recovery, retry-with-backoff, network/server messages
- [`knowledge/patterns/form-design.md`](form-design.md) — submit buttons, validation-in-flight, form-level pending
- [`knowledge/patterns/list-and-feed.md`](list-and-feed.md) — skeletons, pull-to-refresh, infinite scroll loading
- [`knowledge/patterns/empty-states.md`](empty-states.md) — the resolved-but-no-data end state, distinct from loading
- [`knowledge/patterns/money-and-amount.md`](money-and-amount.md) — why money actions use real pending + idempotency, never optimistic
- [`knowledge/i18n/korean-payments.md`](../i18n/korean-payments.md) — payment in-flight and failure states
