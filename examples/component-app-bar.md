# `AppBar` (Top app bar / header) — spec

> Citing Ant Design (no dedicated — use Layout.Header), MUI `AppBar`, shadcn-ui (composition)

## Purpose

The persistent top bar of an app or page. Holds navigation context (back / menu), title, and primary actions (search, notifications, profile).

Applicable on web (page header) and mobile (top app bar). Different in shape but same role.

## When AppBar (full spec) vs alternatives

This is the more detailed primitive that the [mobile-navigation knowledge](../knowledge/patterns/mobile-navigation.md) referenced. Refer to that for **when** to use; this spec covers the **how**.

## Anatomy

```
Mobile (compact):
┌──────────────────────────────────────────┐
│ ←   화면 제목                  🔍  ⋮     │
└──────────────────────────────────────────┘

Desktop (wider):
┌────────────────────────────────────────────────────────────────┐
│ [logo]  Section nav                          🔍 [avatar] ⋮     │
└────────────────────────────────────────────────────────────────┘

With tabs:
┌──────────────────────────────────────────┐
│ ← Project Aurora                  ⋮      │
├──────────────────────────────────────────┤
│ Overview │ Tasks │ Files │ Settings      │  ← in-bar tabs
└──────────────────────────────────────────┘
```

| Slot | Required | Notes |
| --- | --- | --- |
| Leading | yes | Back / menu / logo |
| Title | yes | Page title (mobile) or section nav (desktop) |
| Trailing actions | optional | 1–3 visible icons + overflow menu |
| Tabs row | optional | Below the bar for sub-navigation |
| Search overlay | optional | Replaces title with search input |

## API

```tsx
<AppBar
  leading={<BackButton onClick={goBack} />}
  title="설정"
  actions={[
    { icon: <SearchIcon />, label: "검색", onClick: openSearch },
    { icon: <BellIcon />, label: "알림", onClick: openNotifications, badge: unreadCount },
    { type: "menu", items: [...] },
  ]}
  variant="standard"
/>

<AppBar
  leading={<Logo />}
  title={<NavLinks />}
  actions={[<Avatar src={user.photoUrl} />]}
  variant="standard"
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `leading` | `ReactNode` | — | Left slot (back/menu/logo) |
| `title` | `string \| ReactNode` | — | Center or left content |
| `actions` | `Action[]` | `[]` | Right-aligned actions |
| `tabs` | `ReactNode` | — | Bottom tabs row |
| `variant` | `"standard" \| "large" \| "compact" \| "search"` | `"standard"` | |
| `position` | `"static" \| "sticky" \| "fixed"` | `"sticky"` | |
| `elevation` | `0 \| 1 \| 2` | `0` | Shadow on scroll |
| `transparent` | `boolean` | `false` | When over hero image |

## Variants

### `standard` (default)

Single row, 56px (mobile) / 64px (desktop) tall. Title centered (mobile) or left (desktop).

### `large` (iOS-native large title)

Two rows: standard top + large title below. Collapses to standard on scroll. iOS-coded.

```
┌──────────────────────────────────────────┐
│ ←                          🔍  ⋮         │
│                                           │
│ Settings                                  │   ← large 28px title
│                                           │
└──────────────────────────────────────────┘
```

On scroll: collapses to standard with the title moving up.

### `compact`

40px tall — for desktop dense admin tools.

### `search`

Title slot replaced with a search input. Common on tap of a search icon.

## Sizes

| Variant | Mobile height | Desktop height |
| --- | --- | --- |
| `compact` | 48px | 40px |
| `standard` (default) | 56px | 64px |
| `large` | 56px + 56px expansion | (rare on desktop) |

Plus `env(safe-area-inset-top)` on iOS.

## States

| State | Visual |
| --- | --- |
| Default | Resting at top |
| Scrolled | Optional shadow appears (`elevation > 0`) |
| Search active | Title replaced with input, search icon → close |
| Actions overflow | When > 2 actions on mobile, collapses to `⋮` menu |

## Tokens consumed

```
--color-bg-default          (header surface)
--color-bg-elevated         (when elevated)
--color-text-primary        (title)
--color-text-secondary      (subtitle)
--color-border-default      (bottom border on scroll, alternative to shadow)
--space-md, --space-base
--shadow-card                (elevation when scrolled)
--motion-fast                (collapse animation)
--z-app-bar                  (above content, below modals)
```

## Mobile-specific

- **Safe area**: top inset must be respected. `padding-top: env(safe-area-inset-top)`.
- **Status bar coordination**: `<StatusBar barStyle="dark-content" />` on iOS to match light header.
- **Back button**: 44×44 pt minimum hit area. Icon (chevron) + optional label ("← Settings").
- **Title truncation**: 1 line max, truncate with `…`.
- **System back gesture**: respect Android system back. Don't override.

## Tabs in app bar

When the bar has secondary tabs:

```
┌──────────────────────────────────────────┐
│ ← Project Aurora                  ⋮      │
├──────────────────────────────────────────┤
│ Overview │ Tasks │ Files │ Settings      │
└──────────────────────────────────────────┘
```

Tabs are sticky too — both header + tab row stick. See [`examples/component-tabs.md`](component-tabs.md).

## Accessibility

- Render as `<header>` with `role="banner"` (or omit role; banner is implicit on `<header>` not nested).
- Title: `<h1>` for page-level header, `<h2>` for sub-page headers.
- Action buttons: `aria-label` for icon-only; tooltips on hover (desktop).
- Back button: `aria-label="뒤로"` or "Back".
- Skip link: provide "본문으로 건너뛰기" / "Skip to main content" before app bar for keyboard users.

### Keyboard

- `Tab` reaches actions in order: leading → title (if interactive) → tabs → actions.
- `Esc` in search-active: cancels search, returns to title view.

## Korean considerations

Standard back button label: `←` icon, no text (most common). Some apps add "이전" text.

Page titles: 1-3 words typical ("설정", "알림 설정", "프로필").

For chat/conversation headers: title shows the contact's name + online status:
```
← 김민지 ●           [📞] [...]
   오전 11:23 활동
```

## Code example

```tsx
// Settings screen
<AppBar
  leading={<BackButton aria-label="뒤로" onClick={() => navigate(-1)} />}
  title="설정"
  position="sticky"
/>

// Conversation screen
<AppBar
  leading={<BackButton onClick={() => navigate("/chats")} />}
  title={
    <div className="flex items-center gap-2">
      <Avatar src={contact.photoUrl} alt={contact.name} size="sm" status={contact.online ? "online" : "offline"} />
      <span>{contact.name}</span>
    </div>
  }
  actions={[
    { icon: <PhoneIcon />, label: "통화", onClick: callContact },
    { icon: <VideoIcon />, label: "영상통화", onClick: videoCall },
    { type: "menu", items: chatMenuItems },
  ]}
/>

// Desktop with section nav
<AppBar
  leading={<Logo />}
  title={
    <nav>
      <NavLink to="/dashboard">대시보드</NavLink>
      <NavLink to="/transactions">거래</NavLink>
      <NavLink to="/cards">카드</NavLink>
    </nav>
  }
  actions={[
    { icon: <SearchIcon />, onClick: openSearch },
    { icon: <BellIcon />, badge: 3, onClick: openNotifications },
    <Avatar src={user.photoUrl} alt={user.name} />,
  ]}
/>
```

## Don't

- Don't put primary CTAs in the app bar (those go in body).
- Don't hide the back button on inner screens.
- Don't show 4+ visible action icons on mobile — overflow to ⋮ menu.
- Don't put long titles. 1 line max.
- Don't omit safe-area-inset on iOS — content overlaps the notch.
- Don't make the app bar transparent without ensuring text-on-content contrast.

## References

- Ant Design: no dedicated AppBar — use `Layout.Header` + custom composition.
- MUI: [`refs/mui/packages/mui-material/src/AppBar/`](../docs/reference/mui.md#app-bar) — `AppBar` with `position`, `color`, `elevation`. Material-aligned.
- shadcn-ui: no built-in. Compose with custom header structure.

## Cross-reference

- [`knowledge/patterns/mobile-navigation.md`](../knowledge/patterns/mobile-navigation.md) — when AppBar is used in nav patterns
- [`examples/component-tabs.md`](component-tabs.md) — sub-tabs within AppBar
- [`examples/component-affix.md`](component-affix.md) — sticky positioning
