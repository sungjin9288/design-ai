<!-- hand-written -->
---
title: Onboarding patterns
applies_to: [web, mobile, all-ui]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Onboarding patterns

The user's first ~30 seconds with your product. Done well, they understand the value and complete a first action. Done badly, they bounce.

## The four onboarding moments

| Moment | Trigger | Goal |
| --- | --- | --- |
| **Account setup** | After signup, before first feature use | Account complete, profile filled, key permissions granted |
| **First-run** | First time the app opens | Understand the value, see the core action, complete a first task |
| **Feature discovery** | First time a feature is encountered | Understand what this feature does without leaving the screen |
| **Re-engagement** | After absence (≥ 7 days) | Show what's new, restore context |

These are NOT all "onboarding". Each needs different patterns.

## When you don't need onboarding

- Single-purpose tools (search engine, calculator)
- Apps where the UI explains itself in 2 seconds
- Returning users on familiar flows

If you can show the value within 2 seconds of opening the app, **don't gate it with onboarding**. Onboarding is a tax — pay it only when necessary.

## Account setup

Post-signup, pre-first-use. Goal: get the minimum necessary data to make the product work for this user.

### The Steve Krug rule for account setup

**Cut every field that isn't immediately necessary.** You can ask for more later.

| Don't ask now | Ask later |
| --- | --- |
| Full address (only at first checkout) | Phone number "for security" (only when 2FA setup) |
| Birthday (unless legally required) | Profile photo (after first action) |
| Bio / about | Notification preferences (when first relevant notification) |

### Multi-step wizard

For genuinely multi-step setup (e.g., onboarding to a fintech with bank connection):

```
[1. 본인인증]    [2. 계좌 연결]    [3. 카테고리 선택]    [4. 완료]
   ●               ○                ○                    ○
```

- Progress indicator (numbered or dots).
- Back button always available except on step 1.
- Skip option for non-essential steps with a note ("나중에 설정")
- Save progress between steps (localStorage).
- Total step count visible at start ("3분 소요").

Don't:
- Don't show 8+ steps. The user thinks "ugh" at step 4.
- Don't reset progress on back.
- Don't make every step required for entry.

### Smart defaults > asking

For each field, ask: "Can I derive this instead of asking?"

| Field | Derive from |
| --- | --- |
| Time zone | Browser / device |
| Language | Browser locale |
| Country | IP location (with prompt to confirm) |
| Currency | Country (KRW for KR, USD for US) |
| Notification frequency | Sensible default; let user adjust later |

### Korean account setup

Per [`knowledge/i18n/korean-product-conventions.md`](../i18n/korean-product-conventions.md):

- **Phone-first**: phone + SMS verification is the canonical primary identity.
- **KakaoTalk login** as a one-tap shortcut (above email).
- **Address** via Daum Postcode lookup, NOT free-form.
- **Marketing consent** as a separate, opt-in checkbox (legal — see [`korean-publishing.md`](../i18n/korean-publishing.md)).
- **본인인증** if required (financial / age-gated): use PASS or NICE, not roll-your-own.
- **DOB**: ask year only when possible; full DOB when legally required.

## First-run

User opens the app for the first time. Goal: aha moment + first action.

### The three patterns

| Pattern | Best for | Friction |
| --- | --- | --- |
| **Activation flow** (set up demo data, walk through one task) | Productivity, content tools | Medium |
| **Empty state with prompt** (drop into the main UI, empty state shows the path) | Most consumer apps | Low |
| **Tour with overlays** (highlights UI elements one at a time) | Complex products with non-obvious UI | High |

**Pick the lowest-friction pattern that achieves the goal.** Tours are the highest tax — use only when the UI genuinely needs explaining and an empty-state CTA can't carry the weight.

### Activation flow

For tools where the user genuinely needs setup before they can do anything:

1. Welcome screen (one screen, value prop, one CTA).
2. Connect / configure (1–3 screens).
3. Sample data or first action prompt.
4. Land in the populated main UI.

Don't:
- Don't make activation a 10-screen wall.
- Don't ask for permissions / payment before the user's seen the value.
- Don't skip the "completed" celebration — confirm "you're all set" before dropping into the UI.

### Empty state with prompt (recommended default)

Drop the user into the main UI. The empty state IS the onboarding:

```
[main UI chrome — nav, header]
┌────────────────────────────────────────┐
│       Welcome! Let's get started.       │
│                                          │
│            [illustration]                │
│                                          │
│       Add your first transaction.        │
│                                          │
│           [거래 추가]                     │
└────────────────────────────────────────┘
```

See [`empty-states.md`](empty-states.md) for the empty-state pattern. The first-time empty IS the first-run.

### Tour with overlays

Coachmark-style highlights pointing at UI elements:

```
[main UI in background]
[overlay dim except a callout area]
   ┌──────────────────┐
   │ 1/4              │
   │ 여기서 거래를      │
   │ 추가할 수 있어요    │
   │           [Next]  │
   └──────────────────┘
       ▼
   [Add button]
```

Rules:
- ≤ 5 steps. More than that, you're explaining the manual.
- "Skip" button always available.
- Don't dim the entire screen black — fades the user out of the product.
- Each step focuses on **one** UI element with a clear action.
- Don't tour features the user might never use — tour the core path.

For complex products (Figma, Linear, AfterEffects), tours can run 6–8 steps but with clear "you can come back later" affordances.

### The "skip" question

Always allow skipping onboarding. The user has already committed to opening your app — don't make them work harder.

```
[Skip]    [Next]
```

For users who skip:
- Drop into the empty state (which then carries the "first action" prompt).
- Don't force the tour back onto them.
- Optionally: a small `?` button in the header that reopens the tour.

## Feature discovery (in-context)

When a user encounters a feature for the first time **inside** the app:

| Pattern | Use |
| --- | --- |
| **Inline tooltip** (one-time, dismissable) | Small affordance — "여기에서 정렬할 수 있어요" |
| **Coachmark dot** | Indicates "new" without text until clicked |
| **What's new banner** | Top of page, dismissable |
| **Spotlight modal** | Major feature — dedicated screen, bigger ask |

Don't:
- Don't show 3 tooltips at once.
- Don't auto-show on every visit. Show once, dismiss, never again.
- Don't gate the feature behind the tooltip — let the user use it without reading.

Persistence: store dismissals in user state (server-side or localStorage). A returning user shouldn't see the same coachmark forever.

## Re-engagement

User has been away for ≥ 7 days. They open the app. What changed?

```
┌────────────────────────────────────────┐
│ 오랜만이에요!                            │
│                                          │
│ 그동안 새로 추가된 기능을 확인해 보세요.   │
│   • 새 차트 (지난 주 추가)                │
│   • 다크모드 지원                         │
│                                          │
│ [확인]                                    │
└────────────────────────────────────────┘
```

- Brief, not a tour.
- Optionally: restore last-viewed context ("계속하기: Aurora 프로젝트").
- Don't force them to read every release note.

For absences > 30 days:
- Show "what's new" banner persistently for the session.
- Optionally: re-introduce key flows that may have changed.

## Sample data vs blank slate

For products where the user creates content (note-taking, project management):

| Approach | Pro | Con |
| --- | --- | --- |
| **Blank slate** | Authentic — user owns from day 1 | Empty feels intimidating |
| **Sample data** | Demonstrates value, easy to explore | User has to delete it; "demo project" residue |
| **Templated start** | Halfway — pre-filled structure, user adds real content | Best for productivity tools |

Best practice for most consumer tools: **blank slate** with a strong empty state. The empty state's CTA is the first action.

For tools where the value lives in seeing data populated (analytics, dashboards): **sample data** with clear labels ("Demo data — replace with yours").

## Tokens consumed

```
--color-bg-default
--color-bg-elevated         (modal / coachmark bg)
--color-bg-overlay          (dim overlay for tour)
--color-text-primary
--color-primary-default     (coachmark accent, CTAs)
--space-lg, --space-xl
--radius-lg
--shadow-modal              (coachmarks elevated above page)
```

## Accessibility

- All onboarding content is keyboard-reachable. Tab through every step.
- Tour overlays: focus moves into the coachmark on appearance. Escape dismisses.
- Skip is reachable in tab order.
- Coachmark text is announced via `role="dialog" aria-labelledby`.
- Don't trap focus indefinitely — there must always be an escape.

## Korean considerations

- Polite tone ("~해 주세요") in instructions.
- "환영합니다" / "오랜만이에요" common openers.
- Length: Korean is more verbose; budget more vertical space.
- Tour text typically 1–2 lines max per step.

## Code example

```tsx
function App() {
  const user = useUser();
  const onboardingState = useOnboardingState(user.id);

  if (!user.isVerified) return <AccountVerification />;
  if (!user.isProfileComplete) return <ProfileSetupWizard />;

  return (
    <>
      <MainApp />
      {onboardingState.shouldShowFirstRun && (
        <FirstRunTour onComplete={onboardingState.markFirstRunDone} onSkip={onboardingState.markFirstRunDone} />
      )}
      {onboardingState.unseenFeatures.map(f => (
        <FeatureCoachmark key={f.id} feature={f} onDismiss={() => onboardingState.markFeatureSeen(f.id)} />
      ))}
    </>
  );
}
```

## Don't

- Don't ask for everything upfront. Defer everything you can.
- Don't gate the product behind multi-screen tutorials before showing value.
- Don't show onboarding to returning users.
- Don't tour every feature. Tour the core path; let discovery happen inline.
- Don't auto-show notification permission prompt on app open. Wait for the moment it's relevant.
- Don't force email verification before user can use the product (allow limited use, escalate later).
- Don't assume the user remembers your last release. They don't.
- Don't use marketing language during functional onboarding ("Revolutionary new way to...").

## Cross-reference

- [`knowledge/patterns/empty-states.md`](empty-states.md) — first-time empty IS first-run for most apps
- [`knowledge/patterns/form-design.md`](form-design.md) — multi-step form pattern
- [`knowledge/i18n/korean-product-conventions.md`](../i18n/korean-product-conventions.md) — Korean account-setup expectations
- [`knowledge/i18n/korean-publishing.md`](../i18n/korean-publishing.md) — required permission disclosures (Android)
