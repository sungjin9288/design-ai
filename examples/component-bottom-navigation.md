# `BottomNavigation` — spec

> Synthesized from MUI `BottomNavigation` and the iOS / Android tab bar pattern. Persistent tab bar at the bottom of mobile / responsive apps. The canonical mobile primary navigation.

## When to use

- **Mobile primary navigation** with 3-5 top-level destinations.
- **Touch-thumb-friendly** placement (bottom = thumb-zone).
- **Tab-style switching** between same-level views (Home / Search / Profile).

When NOT to use:
- Desktop primary navigation (use Sidebar or NavigationMenu).
- Hierarchical navigation (BottomNav is flat — for hierarchy use Sidebar).
- More than 5 destinations (overcrowds; group via "More" tab).

## Anatomy

```
┌─────────────────────────────────────┐
│                                     │
│  [content area]                     │
│                                     │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│   [🏠]  [🔍]  [➕]  [🔔3]  [👤]      │  ← BottomNavigation
│   Home  Search Add  Inbox Profile   │     (5 tabs max)
└─────────────────────────────────────┘
            ↑
       active tab indicated
```

## API

```tsx
<BottomNavigation value={tab} onValueChange={setTab}>
  <BottomNavigation.Item value="home">
    <HomeIcon />
    <span>Home</span>
  </BottomNavigation.Item>
  <BottomNavigation.Item value="search">
    <SearchIcon />
    <span>Search</span>
  </BottomNavigation.Item>
  <BottomNavigation.Item value="add" elevated>
    <PlusIcon />
  </BottomNavigation.Item>
  <BottomNavigation.Item value="inbox" badgeCount={3}>
    <InboxIcon />
    <span>Inbox</span>
  </BottomNavigation.Item>
  <BottomNavigation.Item value="profile">
    <UserIcon />
    <span>Profile</span>
  </BottomNavigation.Item>
</BottomNavigation>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string` | controlled | Active tab value |
| `onValueChange` | `(value: string) => void` | — | Tab switch callback |
| `showLabels` | `"always" \| "selected" \| "never"` | `"always"` | When labels are visible |
| `safeArea` | `boolean` | `true` | Add iOS home-indicator padding |
| `elevation` | `0 \| 1 \| 2` | `1` | Shadow above the bar |

## Item

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string` | required | Identifies the tab |
| `icon` | `ReactNode` | from children | Icon |
| `label` | `string` | from children | Label text |
| `badgeCount` | `number` | — | Notification count overlay |
| `badge` | `ReactNode` | — | Custom badge override |
| `disabled` | `boolean` | `false` | Disabled |
| `elevated` | `boolean` | `false` | Center "elevated" style (FAB-like, common for primary CTA) |

## Variants

### `showLabels="always"` (default)

All labels visible always.

### `showLabels="selected"`

Only the active tab shows its label; others icon-only. iOS-classic style. Common in Apple's apps.

### `showLabels="never"`

Icon-only across the bar. Used in dense interfaces or when labels are obvious.

## States

| State | Visual |
| --- | --- |
| Default | Icon + label, muted color |
| Active (selected) | Icon + label, brand color, slightly larger or bold |
| Hover (web) | Subtle bg shift |
| Active press (touch) | Slight scale + bg shift |
| Disabled | Reduced opacity, no events |
| Badge | Dot or count overlay on icon |

## Tokens consumed

```
--bottom-nav-bg                    (bar bg, often slightly elevated from page)
--bottom-nav-fg-default            (inactive icon + label)
--bottom-nav-fg-active             (active = brand color)
--bottom-nav-divider               (top border separating from content)
--bottom-nav-shadow                (subtle upward shadow)
--bottom-nav-height                (typically 56-64px + safe area)
--bottom-nav-icon-size             (24-28px)
--bottom-nav-label-size            (10-12px)
--space-xs, --space-sm
--motion-fast                      (active state transition)
--ease-out
--z-fixed                          (above content, below modals)
```

## Accessibility

- Wrapper: `<nav aria-label="Primary navigation">` (or contextual label).
- Items: `<button>` if state-only, `<a>` if URL-routed.
- Active: `aria-current="page"`.
- Icon-only items: `aria-label` required.
- Touch target: ≥ 44×44pt per item (mobile primary).
- Focus visible on keyboard nav.
- Respect safe-area: `padding-bottom: env(safe-area-inset-bottom)` for iPhone home indicator.

## iOS / Android conventions

| Aspect | iOS | Android |
| --- | --- | --- |
| Position | Bottom | Bottom |
| Height | 49pt + safe area | 56dp |
| Icon style | Outline (inactive) / filled (active) | Filled or outlined (Material 3) |
| Label | Below icon | Below icon (M2) or hidden if active-only (M3) |
| Active indicator | Color shift | Color shift + pill behind icon (M3) |
| Center FAB | Common for primary action | "Floating" elevated button common |

For native-feel design: respect platform expectations (iOS = sharper; Android M3 = soft pill behind active icon).

## Korean app conventions

Korean B2C apps (Toss, KakaoBank, Coupang, Baemin):
- 4-5 tabs typical.
- 한글 labels short (2-4 chars: 홈 / 검색 / 알림 / 마이페이지).
- Center "Add" or primary action elevated (FAB-style) common in some apps.
- Badge count for messages / orders prominent.

```
[🏠 홈] [🔍 검색] [➕] [🔔 알림] [👤 MY]
```

For 토스-style fintech: simple, brand-color active, no decorative effects.
For 카카오-style consumer: warmer, mascot-friendly, often with subtle animations on tap.

## Code example

```tsx
function MobileAppShell() {
  const [tab, setTab] = useState("home");
  const [unreadCount, setUnreadCount] = useState(0);

  return (
    <div className="app">
      <main>{renderTab(tab)}</main>
      <BottomNavigation value={tab} onValueChange={setTab}>
        <BottomNavigation.Item value="home">
          <HomeIcon />
          <span>홈</span>
        </BottomNavigation.Item>
        <BottomNavigation.Item value="search">
          <SearchIcon />
          <span>검색</span>
        </BottomNavigation.Item>
        <BottomNavigation.Item value="inbox" badgeCount={unreadCount}>
          <InboxIcon />
          <span>알림</span>
        </BottomNavigation.Item>
        <BottomNavigation.Item value="profile">
          <UserIcon />
          <span>MY</span>
        </BottomNavigation.Item>
      </BottomNavigation>
    </div>
  );
}
```

## Edge cases

- **Page-aware bottom nav**: hide on certain screens (camera, full-screen video). Use `display: none` OR an in-shell variant.
- **Keyboard open** (mobile virtual keyboard): bottom nav should hide so keyboard doesn't obscure it AND doesn't push the input field below the keyboard.
- **Long Korean label** (보관함, 즐겨찾기): truncate with ellipsis OR drop label at small viewport.
- **5+ tabs needed**: don't expand bar; group into "More" with a Sheet menu.
- **Tab switches modify URL**: yes, always use real URLs so back-button works.
- **Initial route mismatch**: parse current URL → set initial `value`.
- **Reduced motion**: skip active-state animation.
- **Landscape orientation on phone**: hide bottom nav (rare orientation; prioritize content).

## Don't

- Don't use BottomNav for hierarchy navigation. Tabs at the same conceptual level.
- Don't put 6+ tabs. 3-5 max; group rest into More.
- Don't omit `aria-label` on icon-only items.
- Don't make BottomNav float (transparent bg over content) — bad for legibility.
- Don't ignore safe-area on iOS — content cuts off behind home indicator.
- Don't auto-hide on scroll without user research; users hunt for the bar.
- Don't omit active state visual — users need orientation.

## References

- MUI: [`BottomNavigation`](../docs/reference/mui.md#bottom-navigation)
- iOS: UITabBar; Apple HIG → "Tab Bars"
- Material 3: NavigationBar component
- Patterns: Toss, KakaoBank, Instagram, Twitter

## Cross-reference

- [`examples/component-tabs.md`](component-tabs.md) — non-mobile-first tab variant
- [`examples/component-app-bar.md`](component-app-bar.md) — top-of-screen counterpart
- [`examples/component-sidebar.md`](component-sidebar.md) — desktop nav
- [`knowledge/patterns/mobile-navigation.md`](../knowledge/patterns/mobile-navigation.md)
