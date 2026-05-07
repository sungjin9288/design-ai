<!-- hand-written -->
---
title: Error states
applies_to: [web, mobile, all-ui]
---

# Error states

Errors are the screens users see when something didn't go right. They're load-bearing: a good error keeps the user in the flow; a bad error makes them leave.

## The seven kinds of error

Different causes need different UIs. Don't conflate them.

| Kind | Cause | UI tier | User can fix? |
| --- | --- | --- | --- |
| **Validation** | User input doesn't match rules | Inline (next to field) | Yes — fix input |
| **Network / connectivity** | No internet, request failed to leave | Full-page or inline banner | Sort of — wait for connection |
| **Server / 5xx** | Backend crashed, timeout | Full-page or banner | No — retry, escalate |
| **Permission / 403** | User lacks access | Full-page with explanation | Maybe — request access |
| **Not found / 404** | Resource doesn't exist | Full-page | No — navigate elsewhere |
| **Conflict / 409** | Stale data, concurrent edit | Inline modal or banner | Yes — refresh + reapply |
| **Quota / 429** | Rate limit, plan limit | Banner with upgrade or wait | Yes — wait or upgrade |

## Anatomy

```
┌──────────────────────────────────────────────────┐
│              [error icon — soft]                 │
│                                                  │
│         Title — what happened                    │
│                                                  │
│      Description — what to do (1 sentence)       │
│                                                  │
│           [Primary action] [Secondary]           │
│                                                  │
│        (Optional: Error code · contact)          │
└──────────────────────────────────────────────────┘
```

| Slot | Required | Notes |
| --- | --- | --- |
| Icon | recommended | Matches kind. Soft, not aggressive. |
| Title | yes | Plain language: "저장할 수 없어요" not "Error 500" |
| Description | yes | What user can do. 1 sentence. |
| Primary action | yes | Most likely recovery — "다시 시도", "Refresh", "Sign in" |
| Secondary action | optional | Alternative path — "Contact support", "Go back" |
| Error code | dev-mode only | Hide in prod unless support asks |

## Copy guidelines

### Tone — apologetic but not abject

| Korean | English | Use |
| --- | --- | --- |
| "오류가 발생했어요. 다시 시도해 주세요." | "Something went wrong. Please try again." | Generic |
| "잠시 후 다시 시도해 주세요." | "Please try again in a moment." | Server / temporary |
| "네트워크 연결을 확인해 주세요." | "Check your network connection." | Connectivity |
| "권한이 없습니다. 관리자에게 문의해 주세요." | "You don't have access. Contact your admin." | Permission |
| "찾을 수 없는 페이지입니다." | "Page not found." | 404 |

Don't:
- "Oops!" — twee, content-free.
- "Error 500" — exposing tech detail. (Optionally show small "Error code: 500" at the bottom for support reference.)
- "Something terrible happened" — alarming.
- "User error" — blames the user.

### Error message rules

1. **Specific over generic**: "Email must include @" beats "Invalid email."
2. **Actionable**: Tell the user what to do, not just what's wrong.
3. **Don't blame the user**: "This file is too large" is fine. "You uploaded a file that's too large" is not.
4. **Korean tone**: polite (존댓말), end errors with `~해 주세요` or `~합니다`.

## By error kind

### Validation (inline)

See [`patterns/form-design.md`](form-design.md) — handled at the field level, not as a separate screen.

### Network / connectivity

```
┌─────────────────────────────────────────┐
│ ⚠ 인터넷 연결이 불안정합니다             │
│   잠시 후 다시 시도해 주세요.             │
│                                          │
│   [다시 시도]                            │
└─────────────────────────────────────────┘
```

- Banner at top OR full-screen if it blocks all interaction.
- Auto-retry with backoff (1s, 2s, 4s, 8s, then stop).
- If user is offline (browser detects): show "오프라인 상태" banner that auto-clears when online.
- Don't aggressive-toast every failed background request — collapse to one persistent indicator.

### Server / 5xx

```
┌─────────────────────────────────────────┐
│ ⚠ 일시적인 문제가 발생했어요              │
│   잠시 후 다시 시도해 주세요. 문제가 계속되면 │
│   고객센터로 문의해 주세요.                │
│                                          │
│   [다시 시도]   [고객센터]                │
│                                          │
│   Error: 500 (req: a1b2c3d4)            │  ← small, optional
└─────────────────────────────────────────┘
```

- Include a request ID or error code (small text at bottom) so support can trace.
- Two actions: retry + contact support.
- For long-running operations (file upload, video processing): preserve user's work if possible. Don't blow away unsaved state on a 500.

### Permission / 403

```
┌─────────────────────────────────────────┐
│ 🔒 접근 권한이 없습니다                   │
│    이 항목을 보려면 관리자 권한이 필요합니다.│
│                                          │
│   [관리자에게 권한 요청]   [돌아가기]      │
└─────────────────────────────────────────┘
```

- Don't expose what the user **can't** see (security through obscurity).
- Provide the path to access (request flow, support contact).
- For SaaS multi-tenant: clarify which org/team they need access in.

### Not found / 404

```
┌─────────────────────────────────────────┐
│              [illustration: 🗺 lost]      │
│                                          │
│         찾을 수 없는 페이지입니다          │
│                                          │
│   주소를 확인하거나 홈으로 돌아가 주세요.   │
│                                          │
│   [홈으로]    [검색]                      │
└─────────────────────────────────────────┘
```

- Branded 404 (use product personality for consumer apps).
- Always offer a path forward — home, search, recent activity.
- Don't show error code "404" prominently — describe in plain language.
- For deep linking gone bad: detect common patterns and route helpfully ("Did you mean /projects/123?").

### Conflict / 409

```
┌─────────────────────────────────────────┐
│ ⓘ 다른 곳에서 이미 수정되었습니다          │
│   최신 내용을 불러오고 다시 저장해 주세요.   │
│                                          │
│   [최신 불러오기]  [내 변경사항 보기]      │
└─────────────────────────────────────────┘
```

- Don't silently overwrite. The user must decide.
- For collaborative editing (Google Docs-style): merge automatically when possible; ask for choice when not.
- Show what's in conflict if possible (your version vs theirs).

### Quota / 429

```
┌─────────────────────────────────────────┐
│ ⓘ 사용 한도에 도달했습니다                 │
│   1시간 후 다시 사용 가능합니다.            │
│   더 많이 사용하려면 플랜을 업그레이드하세요.│
│                                          │
│   [플랜 업그레이드]   [대기]               │
└─────────────────────────────────────────┘
```

- Be specific about the limit (which? when reset?).
- Offer upgrade path if applicable.
- Don't block the entire UI — only the rate-limited action.

## Layout

| Pattern | Use |
| --- | --- |
| **Inline** (next to field, in card) | Validation, conflict on a specific field |
| **Banner** (page-top strip) | Network, partial server failure, quota |
| **Full-page replace** | 404, 500 on critical path, permission |
| **Modal / overlay** | Conflict during save (must decide) |
| **Toast** | Background failures with auto-recovery (rare for errors — toast is for success/info) |

For mobile: prefer inline + banner over full-page modal. Full-page consumes valuable vertical space.

## Recovery actions

Every error needs at least one user-actionable recovery. The order of preference:

1. **Retry** — when the operation can be retried (network, server)
2. **Refresh / Reload** — when the state is stale (conflict)
3. **Navigate elsewhere** — when the resource isn't recoverable (404, permission)
4. **Contact support** — last resort, with context preserved

Never just "OK" or "Dismiss" with no path forward.

## Error code visibility

| Audience | Show error code? |
| --- | --- |
| End users | No — plain language |
| Internal users / admin | Yes, in dev mode |
| Support flow | Yes — copy-to-clipboard affordance |

For support handoff: render a small expandable "Technical details" section:
```
> Technical details
> Code: 500
> Request ID: a1b2c3d4-e5f6-7890
> Timestamp: 2026-05-07 14:32:01 KST
> [Copy details]
```

## Logging vs displaying

The error message you SHOW to users is different from what you LOG to the server:

- **Log everything** (stack trace, request, user ID, browser).
- **Show only what helps the user** (cause + recovery).

Don't expose stack traces or technical jargon in user-facing errors.

## Tokens consumed

```
--color-error             (icon, accent border)
--color-error-subtle-bg   (banner bg)
--color-warning           (for 429 / quota — not full error)
--color-text-primary      (title)
--color-text-secondary    (description)
--color-text-tertiary     (technical details, error code)
--color-bg-default
--color-bg-elevated
--space-md, --space-base
--radius-md
```

## Accessibility

- Error containers: `role="alert"` (assertive) for blocking errors; `role="status"` (polite) for inline / banner.
- Title is a heading (`<h2>` or appropriate).
- Recovery action button: standard accessibility.
- Don't auto-focus the error icon — focus the recovery button.
- For form errors: announced via `aria-describedby` linking input to error text. See [`patterns/form-design.md`](form-design.md).

## Korean considerations

Per [`knowledge/i18n/korean-product-conventions.md`](../i18n/korean-product-conventions.md):
- Polite (존댓말) tone — "~해 주세요" / "~합니다".
- "고객센터" (customer center) is the standard term for support.
- Customer service hours stated when contact is the recommended action.
- For payment errors: cite [`knowledge/i18n/korean-payments.md`](../i18n/korean-payments.md) — specific failure-mode messages.
- 1:1 inquiry is a standard expectation: provide that path, not just email.

## Code example

```tsx
function PageContent() {
  const { data, error, retry } = useData();

  if (error?.type === "404") {
    return <NotFoundPage />;
  }
  if (error?.type === "permission") {
    return <PermissionDeniedPage />;
  }
  if (error?.type === "network") {
    return (
      <Banner intent="warning">
        <Banner.Title>인터넷 연결이 불안정합니다</Banner.Title>
        <Banner.Description>잠시 후 다시 시도해 주세요.</Banner.Description>
        <Banner.Action onClick={retry}>다시 시도</Banner.Action>
      </Banner>
    );
  }
  if (error) {
    return (
      <ErrorState
        title="일시적인 문제가 발생했어요"
        description="잠시 후 다시 시도해 주세요."
        primaryAction={{ label: "다시 시도", onClick: retry }}
        secondaryAction={{ label: "고객센터", href: "/support" }}
        errorCode={error.code}
        requestId={error.requestId}
      />
    );
  }

  return <Content data={data} />;
}
```

## Don't

- Don't show "Error 500" to end users.
- Don't conflate empty states with errors. They're different.
- Don't provide an "OK" button as the only action — what's "OK" about an error?
- Don't auto-retry indefinitely without a stop.
- Don't lose the user's work on a server error mid-action — preserve form state, draft, etc.
- Don't expose stack traces, internal IDs without copy affordance, or English error messages in Korean apps.
- Don't blame the user. Don't shout (no all-caps).
- Don't pop up a modal for every minor failure. Use inline / banner where the failure happens.

## Cross-reference

- [`knowledge/patterns/empty-states.md`](empty-states.md) — when there's no data, but it's not an error
- [`knowledge/patterns/form-design.md`](form-design.md) — validation errors at the field level
- [`knowledge/i18n/korean-payments.md`](../i18n/korean-payments.md) — payment-specific error messages
- [`knowledge/i18n/korean-product-conventions.md`](../i18n/korean-product-conventions.md) — Korean tone
