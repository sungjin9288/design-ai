<!-- hand-written -->
---
title: Mobile navigation patterns
applies_to: [mobile, ios, android, react-native, responsive-web]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Mobile navigation patterns

The four primary mobile navigation patterns, when to use each, and the rules they obey. Skipping these conventions makes the app read as foreign.

## The four patterns

| Pattern | Use when | Examples |
| --- | --- | --- |
| **Bottom tab bar** | 3–5 top-level destinations equally important | Toss, Instagram, KakaoTalk, banking apps |
| **Top app bar** | Single primary destination per screen with secondary actions | Settings, detail screens, compose |
| **Drawer (hamburger)** | 5+ destinations, secondary frequency | Gmail, Slack channels |
| **Stack-only** | Linear flows (onboarding, multi-step forms, checkout) | Wizards |

## Bottom tab bar

The dominant pattern for Korean consumer apps. **Default for any consumer mobile product with multiple top-level sections.**

### Rules

| Rule | Detail |
| --- | --- |
| Tab count | **3–5**. 6+ becomes a scroll target on iOS or hamburger on Android. |
| Always present | At every top-level screen. Hidden on detail / modal / form screens. |
| Persistent across navigation within a tab | Stack pushes inside a tab keep the bar visible. |
| Active state | Highlighted color + filled icon (vs outlined inactive) + bold label. |
| Labels | **Always show** — Korean apps include Korean labels. Icon-only is acceptable for Western iOS-native style but reads as foreign in KR. |
| Height | iOS: 49pt + safe-area-inset-bottom. Android: 56–64dp. RN: ~56–60 + insets. |

### Tab anatomy

```
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│   🏠    │ │   📊    │ │   ➕    │ │   🔔    │ │   👤    │
│   홈    │ │  통계   │ │  추가   │ │  알림   │ │   MY   │
└─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
   active     inactive   center      inactive   inactive
```

| Part | Spec |
| --- | --- |
| Icon | 24×24 typical. Filled when active, outlined when inactive. |
| Label | 11–12px font, weight 500 active / 400 inactive. |
| Spacing | Equal-width tabs, label centered under icon. |
| Active color | `--color-primary-default` |
| Inactive color | `--color-text-tertiary` |

### Center-tab variants

Korean apps frequently elevate the center tab as a primary action:

```
┌─────────┐ ┌─────────┐ ┌─────╮ ╭─────┐ ┌─────────┐ ┌─────────┐
│   홈    │ │  검색   │ │  ╲ ╱     │ │  알림   │ │   MY    │
│         │ │         │ │  ┌─┐     │ │         │ │         │
│         │ │         │ │  │+│     │ │         │ │         │
│         │ │         │ │  └─┘     │ │         │ │         │
└─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
```

The center is a **floating action**, raised by 8–12px, with a colored background (often primary). It's a separate button, not a tab — it triggers a modal or compose screen rather than navigating to a destination.

Use when there's a clear "create / send / 추가" primary action that would otherwise be buried.

### Hiding the tab bar

Hide on:
- Modal screens
- Forms (so keyboard + footer button can claim space)
- Full-bleed media viewers
- Onboarding

Don't hide on:
- Top-level destinations (always show)
- Stack pushes within a tab (keep visible)
- Settings (it's still browsing)

### Don't

- Don't put 6+ tabs. If you have 6, your app has 5 destinations + something that should be in a menu.
- Don't change tab order across screens.
- Don't have a "More" tab as the 5th — find the meaningful 4 or 5 and commit.
- Don't use the tab bar as a loading indicator (animating active state).
- Don't gate tabs behind login state. Show all tabs; auth-walled tabs go to login screen on tap.

## Top app bar

The header strip with title and actions on most non-tab screens.

### Anatomy

```
┌──────────────────────────────────────────────────┐
│  ←   Screen title              ⋮       ✕ Close   │
└──────────────────────────────────────────────────┘
```

| Slot | Use |
| --- | --- |
| Left | Back button (chevron + optional label) OR Close (✕) on modal screens OR menu button (≡) on top-level |
| Center | Screen title (truncate if long, no wrap) |
| Right | Up to 2 action buttons (search, share, more menu) |

### Rules

- Height: 44pt (iOS) / 56dp (Android). RN: ~56 + status bar inset.
- One title per bar. No subtitle unless absolutely needed; if it's needed, the design likely needs a hero block, not a stuffed bar.
- Right-side actions: max 2 visible. 3+ goes into a `⋮` (kebab) menu.
- Title alignment: centered (iOS / KR consumer convention) or left (Android Material 3).

### Variants

| Variant | Use |
| --- | --- |
| Standard | Most screens |
| Large title (iOS native) | Top of stack, sets tone for content. Collapses to standard on scroll. |
| Search-as-bar | Replace the title with a search input (e.g., "🔍 search...") |
| Tabs-in-bar | Bottom of bar has segmented control or scrollable tabs |

### Don't

- Don't put the back button on the right.
- Don't omit the back button on inner screens. Even if the system back gesture works, users want a tappable affordance.
- Don't use the title as a navigation menu (Android pre-Material 3 convention is dead — don't revive).
- Don't put primary CTAs in the header. Headers are for navigation and meta-actions; primary CTAs go in the body or footer.

## Drawer (hamburger menu)

Side-panel that slides in. Use sparingly.

### When to use

- 5+ top-level destinations and they're not all equally accessed.
- Account / settings / less-frequent destinations live here.
- Apps with many "spaces" or "channels" (e.g., team chat with many rooms).

### When NOT to use

- Default consumer mobile app with 3–5 destinations: use bottom tab bar instead.
- Korean consumer apps: drawer is uncommon. Korean users prefer visible tabs.
- E-commerce: drawer reduces discoverability of categories.

### Anatomy

```
←─────────────  drawer (75–85% screen width)
│ ┌─────────┐
│ │ Avatar  │
│ │ Name    │
│ │ Email   │
│ └─────────┘
│ 
│ 🏠 Home
│ 📊 Statistics
│ ⚙  Settings
│ 🚪 Logout
│ 
└──────────────
```

- Width: 75–85% of screen. Don't go full-width (must show backdrop).
- Backdrop: 50% black. Tappable to close.
- Slide-in: 250ms ease-out from left (LTR) or right (RTL).
- Header section: user identity (avatar, name, email) — most common pattern.

### Don't

- Don't combine drawer + bottom tabs. Pick one as primary.
- Don't put main app navigation in a drawer if the user uses it more than 3x per session — they'll resent the extra tap. Move to a tab.

## Stack-only navigation

For linear flows: onboarding (4–5 screens), multi-step forms, checkout, signup.

- No tab bar visible.
- Top app bar shows progress (1/4, 2/4, ...) or step name.
- Back button always available (don't trap user without an exit).
- Final screen has a clear "complete" affordance — not just disappearing.
- Skipping: provide an "Skip" affordance for non-critical onboarding screens, but never for required setup.

## Back navigation

Mobile back has multiple sources:

| Source | Behavior |
| --- | --- |
| Header back button (`←`) | Standard pop-stack |
| iOS swipe-from-edge gesture | System-native; respect it |
| Android system back button | OS-level; must respect |
| Android system back gesture | Newer Android; respect |
| In-page link / button | Application-defined |

**Always** make these all work consistently. The system back must:
- Pop one stack level at a time.
- Close modals if open.
- Close the keyboard before popping if the keyboard is visible (some prefer popping immediately).
- Show a confirmation if there's unsaved work (`이 화면을 나가시겠습니까? 작성 중인 내용이 사라집니다.`).

Don't:
- Don't intercept Android back to do nothing.
- Don't remap back to "go to home" — it's pop-stack semantically everywhere else.
- Don't show a custom back button without also handling system back.

## Search behavior

Korean consumer apps **search heavily**. Make search prominent.

### Patterns

| Pattern | Use |
| --- | --- |
| Persistent search at top of screen | Apps where search is the primary action (Naver, e-commerce) |
| Search icon in app bar → opens overlay | Apps where search is secondary (gmail, banking) |
| Tab dedicated to search | Multi-purpose apps (Instagram, KakaoTalk has chat search but not a tab) |

### Search overlay (icon-tap-to-open variant)

```
┌─────────────────────────────────────────────────┐
│ ←  🔍 [               type to search          ] │
├─────────────────────────────────────────────────┤
│ 최근 검색어                                      │
│ • previous query 1                       ✕      │
│ • previous query 2                       ✕      │
│ ─────                                            │
│ 추천 검색어                                       │
│ • trending 1                                    │
│ • trending 2                                    │
└─────────────────────────────────────────────────┘
```

Must include:
- Recent searches (with clear-each + clear-all)
- Recommended / trending (if applicable)
- Clear input button (✕) when input has value
- Cancel / back to close

Search type-ahead: debounce 200–300ms, cancel previous request on new keystroke.

## Modal screens

Different from inline modal/dialog. A "modal screen" takes over the full screen, often presented from below (iOS sheet style):

- Used for: compose, settings detail, photo viewer, camera.
- Presentation: slide up from bottom (iOS) or fade (Android typically).
- Dismissal: explicit Close (✕) or Cancel button. iOS swipe-down gesture on sheet handle. Don't rely on backdrop tap (no backdrop visible above status bar).
- Header pattern: ✕ on left, "Save" / primary action on right.

### Sheet variants (iOS 15+ and pull-up sheets in apps)

```
                        ╱─╲ (drag handle)
┌───────────────────────────────────────────┐
│         ✕         Title              Save │
│                                           │
│  body content                             │
│                                           │
└───────────────────────────────────────────┘
```

- Pull-handle indicator at top.
- Detents: 25%, 50%, 90% sizes (user can drag to resize).
- Use for: filter panels, location pickers, brief forms.

## Cross-reference

- [knowledge/i18n/korean-product-conventions.md](../i18n/korean-product-conventions.md) — KR navigation conventions
- [knowledge/platforms/react-native.md](../platforms/react-native.md) — RN-specific implementation
- [knowledge/a11y/keyboard-and-focus.md](../a11y/keyboard-and-focus.md) — focus on route change
- [knowledge/motion/principles.md](../motion/principles.md) — drawer/sheet timing
