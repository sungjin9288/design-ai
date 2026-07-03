# `Tabs` — spec

> Citing Ant Design `Tabs`, MUI `Tabs`, shadcn-ui `tabs`. Includes mobile bottom-tab variant.

## Purpose

Tabs let users switch between mutually exclusive views without navigating away. Different from navigation — tabs stay on the same screen.

Three variants in one spec, same a11y contract:

| Variant | Use |
| --- | --- |
| `tabs` (default) | In-page section switcher (Profile / Activity / Settings) |
| `segmented` (pill group) | Compact filter switch (오늘 / 이번 주 / 이번 달) |
| `bottom-tab-bar` (mobile) | App-level top destinations — see [knowledge/patterns/mobile-navigation.md](../knowledge/patterns/mobile-navigation.md) |

## Anatomy — `tabs` and `segmented`

```
┌─────────────────────────────────────────────────────┐
│ Profile  │ Activity  │ Settings                     │  ← TabList
├──────────┴────────────────────────────────────────── │  ← active indicator (underline or pill)
│                                                      │
│  TabPanel content for active tab                     │
│                                                      │
└─────────────────────────────────────────────────────┘
```

```tsx
<Tabs defaultValue="profile">
  <Tabs.List>
    <Tabs.Trigger value="profile">Profile</Tabs.Trigger>
    <Tabs.Trigger value="activity">Activity</Tabs.Trigger>
    <Tabs.Trigger value="settings">Settings</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="profile">...</Tabs.Content>
  <Tabs.Content value="activity">...</Tabs.Content>
  <Tabs.Content value="settings">...</Tabs.Content>
</Tabs>
```

## API

| Prop (root) | Type | Default | Description |
| --- | --- | --- | --- |
| `value` / `defaultValue` | `string` | — | Active tab. Controlled / uncontrolled. |
| `onValueChange` | `(value: string) => void` | — | Fires on change |
| `variant` | `"underline" \| "segmented" \| "card" \| "bottom-bar"` | `"underline"` | Visual treatment |
| `orientation` | `"horizontal" \| "vertical"` | `"horizontal"` | Side-tab pattern with vertical |
| `activationMode` | `"automatic" \| "manual"` | `"automatic"` | Auto-activate on focus (default) or wait for Enter/Space |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | |
| `fullWidth` | `boolean` | `false` | TabList stretches; each trigger gets equal width (segmented only) |

| Prop (trigger) | Type | Description |
| --- | --- | --- |
| `value` | `string` | Required. Matches `Tabs.Content` value. |
| `disabled` | `boolean` | |
| `iconStart` | `ReactNode` | Icon before label |
| `badge` | `ReactNode` | Count or status indicator |

## Variants

### `underline` (default — Ant / Material style)

Bottom border under active tab. The tab label sits above a shared baseline. Most common for in-page tab switching.

### `segmented` (iOS-native pill)

```
┌────────────────────────────────────────┐
│ ┌────────┐ ┌────────┐ ┌────────┐       │
│ │ Today  │ │  Week  │ │ Month  │       │
│ └────────┘ └────────┘ └────────┘       │
└────────────────────────────────────────┘
```

- All tabs in a single rounded container.
- Active tab has filled background.
- Use for: time-period filters, view-mode toggles (List / Grid), 3–5 short labels max.
- iOS-native segmented control is the visual reference.

### `card` (top-edge tabs)

Each tab is a card with a top border. Active card "merges" into the panel below. Less common; used in tabbed forms or settings panels.

### `bottom-bar` (mobile only)

See [knowledge/patterns/mobile-navigation.md](../knowledge/patterns/mobile-navigation.md). Same a11y contract; visual is fixed at bottom of viewport.

## States

| State | Visual |
| --- | --- |
| Default (inactive) | Muted text, no border/bg |
| Hover | Slight bg shift |
| Active | `--color-primary-default` text + indicator (underline or pill bg) |
| Focus-visible | 2px ring around the trigger |
| Disabled | 50% opacity, no events |

## Tokens consumed

```
--color-text-secondary    (inactive)
--color-text-primary      (hover)
--color-primary-default   (active)
--color-bg-subtle         (hover bg, segmented inactive bg)
--color-bg-default        (segmented active bg)
--space-md, --space-base
--radius-md               (segmented pills)
--motion-fast, --easing-out  (underline indicator slide)
```

## Sizes

| Size | Trigger height | Font | Padding-x |
| --- | --- | --- | --- |
| `sm` | 32px | 13px | 12px |
| `md` | 40px | 14px | 16px |
| `lg` | 48px | 16px | 20px |

## Accessibility — WAI-ARIA Tabs Pattern

Critical contract — get this exactly right:

- `Tabs.List` has `role="tablist"`.
- Each `Tabs.Trigger` has `role="tab"`, `aria-selected="true|false"`, `aria-controls="<panel-id>"`.
- Each `Tabs.Content` has `role="tabpanel"`, `aria-labelledby="<trigger-id>"`, `tabIndex={0}`.

### Keyboard

| Key | Behavior |
| --- | --- |
| `Tab` | Moves into the tab list. Inside the list, focus goes to the active trigger. Tabs again to leave the list (NOT cycle through tabs). |
| `←` / `→` | Move focus between triggers (horizontal) |
| `↑` / `↓` | Move focus between triggers (vertical) |
| `Home` / `End` | First / last trigger |
| `Enter` / `Space` | Activate the focused trigger (manual mode only) |

### `activationMode`

- `"automatic"` (default): focus a trigger → tab activates. Faster scanning. Good for quick browse.
- `"manual"`: focus moves but tab doesn't activate until Enter/Space. Use when activating is expensive (loads heavy content, makes API call).

### Screen reader

- Active tab announces "selected".
- TabList reads as "tab list" with N tabs.
- TabPanel content is announced when activated (via `aria-controls` link).
- Don't add custom `aria-live` to tab content — switching tabs is user-driven.

## Edge cases

- **Many tabs (> 5–6)**: scroll horizontally with overflow. Add chevrons (`<` `>`) to scroll. **Don't** use a "More" tab as a dropdown — accessibility breaks.
- **Tab content height varies**: panel height adjusts on switch; consider `min-height` on the container to prevent layout shift between tab activations.
- **Lazy loading panels**: render only the active panel for performance, but **mount** all on first activation if you need form state preserved across switches. Trade-off: memory vs. data loss on switch.
- **URL sync**: tab state often syncs to URL hash or query (`?tab=settings`). Use shadcn/Radix `Tabs` with `value` controlled from `useSearchParams`. Browser back/forward then works.
- **RTL**: arrow keys reverse, indicator direction reverses. Use logical CSS.
- **Korean labels**: shorter is better for tabs (1–2 syllables). "프로필" (profile), "활동" (activity), "설정" (settings).

## Don't

- Don't put more than 5–6 tabs in a row without scroll. Consider whether a sidebar or different navigation fits better.
- Don't use tabs as a substitute for navigation. Tabs stay on the same screen; navigation changes URL/screen.
- Don't add an "All" tab if it shows a union — show "All" by default and let users filter.
- Don't load all tab content eagerly if any tab is expensive.
- Don't use bottom-tab-bar variant for in-page switching. It's reserved for app-level navigation.
- Don't combine tabs + breadcrumbs at the same level — pick one.

## References

- Ant Design: [`refs/ant-design/components/tabs/`](../docs/reference/ant-design.md#tabs) — `Tabs`, `Tabs.TabPane`, supports `card`/`line`/`editable-card` variants. Most variants out of the box.
- MUI: [`refs/mui/packages/mui-material/src/Tabs/`](../docs/reference/mui.md#tabs) — `Tabs` + `Tab` + `TabPanel` (separately). MUI has good `scrollable` props.
- shadcn-ui: [`refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/tabs.tsx`](../docs/reference/shadcn-ui.md#tabs) — Radix Tabs primitive. Cleanest a11y. **Default for new projects.**

API choices made:
- **Composition with `Tabs.Trigger` / `Tabs.Content`** matching value strings — Radix pattern, lowest surface area.
- **`activationMode` exposed** rather than hard-coded — different UIs benefit from different defaults.
- **`bottom-bar` listed as a variant** rather than a separate component — same WAI-ARIA pattern, just a positioning detail.

## Cross-reference

- [knowledge/patterns/mobile-navigation.md](../knowledge/patterns/mobile-navigation.md) — bottom-tab-bar specifics
- [WAI-ARIA Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)
- [knowledge/a11y/keyboard-and-focus.md](../knowledge/a11y/keyboard-and-focus.md)
