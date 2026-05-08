# `Banner` — spec

> A persistent in-page or app-wide notification strip. Distinct from `Alert` (page-level inline message) and `Toast` (transient floating notification). Used for upgrade prompts, system status, cookie consent, ongoing announcements.

## Banner vs Alert vs Toast

| | Banner | Alert | Toast |
| --- | --- | --- | --- |
| Position | Top of page or app-wide strip | Inline within page content | Floating, usually corner |
| Persistence | Persistent until dismissed (or context changes) | Visible while relevant | Auto-dismisses (3-7s) |
| Width | Full-width edge-to-edge | Constrained to content area | Card-width |
| Use | System-level announcements | Page-level state info | Action confirmation |
| Dismissible | Often (but persistent until dismissed) | Sometimes | Yes (auto + manual) |

## Common Banner use cases

- **System status**: "We're experiencing degraded performance."
- **Cookie / consent**: "We use cookies. [Accept] [Customize]"
- **Trial / upgrade**: "Your trial ends in 3 days. [Upgrade]"
- **Migration / version**: "We've updated our terms. [Read more]"
- **Maintenance window**: "Scheduled maintenance: Sunday 2am UTC."
- **Promo / announcement**: "Save 30% on annual plans."
- **Korean spam law (정보통신망법)**: marketing consent banner where required.

## Anatomy

```
┌─────────────────────────────────────────────────────────┐
│ ⚠  Your trial ends in 3 days. Upgrade now to keep access. │
│                                            [Upgrade] [×] │
└─────────────────────────────────────────────────────────┘
   (above the page content; full-width)
```

## API

```tsx
<Banner
  variant="warning"
  icon={<ClockIcon />}
  dismissible
  onDismiss={handleDismiss}
  action={
    <Button size="sm" variant="primary" onClick={handleUpgrade}>
      Upgrade
    </Button>
  }
>
  <strong>Your trial ends in 3 days.</strong>
  <span>Upgrade now to keep access.</span>
</Banner>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `"info" \| "success" \| "warning" \| "error" \| "promo" \| "neutral"` | `"info"` | Visual treatment |
| `icon` | `ReactNode` | per variant | Leading icon |
| `dismissible` | `boolean` | `false` | Show dismiss × |
| `onDismiss` | `() => void` | — | Dismiss callback |
| `action` | `ReactNode` | — | Right-aligned action(s) |
| `position` | `"top" \| "bottom" \| "inline"` | `"top"` | Where in the layout |
| `sticky` | `boolean` | `false` | Stick to viewport edge |
| `id` | `string` | — | For dismissal persistence (localStorage) |

## Variants

| Variant | Color | Use |
| --- | --- | --- |
| `info` | Blue | General announcements, info |
| `success` | Green | Positive milestones (account verified) |
| `warning` | Amber | Time-sensitive (trial expiring) |
| `error` | Red | System issues (degraded service) |
| `promo` | Brand | Marketing, discounts |
| `neutral` | Gray | Quiet announcements |

## States

| State | Visual |
| --- | --- |
| Default | Per variant; full-width strip |
| Dismissing | Slide / fade out 200ms |
| Hidden (dismissed) | Removed; remembered via `id` + localStorage |

## Persistence

For dismissible banners, persist dismissal across sessions:

```tsx
const [dismissed, setDismissed] = useLocalStorage(`banner-dismissed-${id}`, false);

if (dismissed) return null;

return <Banner id={id} dismissible onDismiss={() => setDismissed(true)}>...</Banner>;
```

Reset dismissal when the underlying content changes (new `id` for new announcement).

## Position variants

### `top` (default)

Above all content. Typically sticky or scrolls with page top.

### `bottom`

Bottom of viewport. Common for cookie consent (less intrusive on first paint).

### `inline`

Within page content as a contextual block.

## Tokens consumed

```
--banner-bg-info               (variant bgs)
--banner-bg-success
--banner-bg-warning
--banner-bg-error
--banner-bg-promo              (often brand-color)
--banner-bg-neutral
--banner-fg                    (text on banner)
--banner-icon                  (icon color, slightly emphasized)
--banner-action                (action button styling)
--banner-dismiss               (× button color)
--space-md                     (banner padding)
--font-size-sm                 (typically smaller than body)
--font-weight-medium           (slight emphasis)
--motion-medium                (dismiss animation)
--ease-out
--z-banner                     (above content, below modals)
```

## Accessibility

- `<div role="status">` for non-urgent (info, promo, neutral).
- `<div role="alert">` ONLY for time-sensitive errors / warnings (avoid otherwise — interrupts screen readers).
- Dismiss button: `<button aria-label="Dismiss banner">`.
- Action button: standard button accessibility.
- Don't auto-dismiss critical banners (system status). User must acknowledge or fix the issue.
- For trial-expiring / cookie consent: don't trap focus or block interaction — banner is informational, not a modal.
- Sufficient color contrast on all variants (WCAG AA minimum).

## Korean conventions

- 시스템 점검 안내 (system maintenance)
- 무료 체험 만료 안내 (trial expiration)
- 쿠키 / 마케팅 정보 수신 동의 (cookie / marketing consent — required by 정보통신망법)
- "확인" / "동의" / "거부" / "닫기" — typical Korean button labels
- 합쇼체 for formal banners ("점검을 진행합니다"); 해요체 for casual ("이벤트가 시작됐어요").

For 정보통신망법 marketing consent banner:
```
저희는 이메일 / SMS로 마케팅 정보를 보낼 수 있도록 동의를 요청합니다.
[동의] [거부] [자세히 보기]
```

## Code example — System status

```tsx
function SystemStatusBanner() {
  const { status } = useSystemStatus();

  if (status === "operational") return null;

  return (
    <Banner
      variant={status === "degraded" ? "warning" : "error"}
      icon={<AlertCircleIcon />}
      action={
        <a href="/status" className="link">
          {status === "degraded" ? "자세히 보기" : "상태 페이지"}
        </a>
      }
    >
      {status === "degraded"
        ? "일부 기능이 정상 작동하지 않고 있어요."
        : "서비스 장애가 발생했습니다. 빠르게 복구하겠습니다."}
    </Banner>
  );
}
```

## Code example — Promo banner

```tsx
function PromoBanner() {
  return (
    <Banner
      id="annual-discount-2025"
      variant="promo"
      dismissible
      icon={<SparklesIcon />}
      action={
        <Button size="sm" asChild>
          <a href="/pricing">자세히 보기</a>
        </Button>
      }
    >
      <strong>연간 결제 30% 할인</strong>
      {" "}
      <span>1월 31일까지 신규 가입자 대상.</span>
    </Banner>
  );
}
```

## Edge cases

- **Multiple banners stacked**: prioritize one (most important first); cap at 1-2 visible at any time.
- **Banner with action that requires modal confirmation**: action opens modal; banner stays until resolved.
- **Banner on print**: hide via `@media print`.
- **Mobile narrow width**: stack content (text + action) vertically; ensure action remains tappable (≥ 44pt).
- **RTL**: swap icon position (right) and action position (left); dismiss × stays on far end.
- **Keyboard nav**: Tab through Banner content (link, action, dismiss).
- **Screen-reader spam**: don't make banner update per-second (every counter tick announced); update at significant intervals.

## Don't

- Don't use Banner for transient confirmation. That's Toast.
- Don't put more than one primary action in a Banner.
- Don't use Banner inside content cards. That's an Alert.
- Don't trap focus or block interaction. Banner is informational.
- Don't auto-show after every page navigation (annoying). Show once, persist dismissal.
- Don't use Banner for required confirmation (terms acceptance) without a modal. Banner can dismiss too easily.
- Don't omit dismissal for non-critical banners — users hate persistent unkillable strips.

## References

- Patterns: GitHub system status banner, Stripe Trial banner, Vercel deploy notifications, KR cookie consent banners
- WAI-ARIA: `role="status"` for non-urgent, `role="alert"` for time-sensitive

## Cross-reference

- [`examples/component-alert.md`](component-alert.md) — inline page-level message
- [`examples/component-toast.md`](component-toast.md) — transient floating notification
- [`knowledge/patterns/email-design.md`](../knowledge/patterns/email-design.md) — KR 정보통신망법 marketing consent
- [`knowledge/i18n/korean-product-conventions.md`](../knowledge/i18n/korean-product-conventions.md)
