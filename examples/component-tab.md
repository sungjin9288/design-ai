# `Tab` — spec

> Synthesized from MUI `Tab`. A single tab inside a `Tabs` set. Used for top-level navigation within a section ("개요 / 활동 / 멤버") and for bottom navigation patterns.

## When to use

- Mutually exclusive views of the same context (account → profile / security / billing).
- Switching between datasets in a dashboard.
- For top-level app navigation, prefer dedicated nav (drawer, top bar) — Tabs are within-page.

## When NOT to use

- 2 options → use `ToggleButtonGroup` or `Radio`.
- 7+ options → switch to a dropdown or a sidebar.

## Anatomy

```
[Tab1]  [Tab2]  [Tab3]
─────  ─────  ─────
        ▔▔▔        ← indicator under selected
```

## API

```tsx
<Tabs value={tab} onChange={(_, v) => setTab(v)} aria-label="account sections">
  <Tab label="프로필" value="profile" />
  <Tab label="보안" value="security" />
  <Tab label="결제" value="billing" disabled />
</Tabs>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | `ReactNode` | — | Tab label |
| `value` | `any` | — | Identifies tab; matched against parent `Tabs.value` |
| `icon` | `ReactNode` | — | Leading icon (above label by default) |
| `iconPosition` | `'top' \| 'bottom' \| 'start' \| 'end'` | `'top'` | Icon placement |
| `disabled` | `boolean` | `false` | Non-interactive |
| `wrapped` | `boolean` | `false` | Allow text to wrap to 2 lines |
| `href` | `string` | — | Render as link (use for tabs that map to routes) |

## States

| State | Visual |
| --- | --- |
| Default | fg-muted, no underline |
| Hover | fg-default |
| Focus-visible | fg-default + ring |
| Selected | fg-primary, underline indicator |
| Disabled | reduced opacity |

## Tokens consumed

```
--tab-fg-default          /* fg-muted */
--tab-fg-selected         /* fg-primary OR fg-default — design-system choice */
--tab-indicator-color     /* brand */
--tab-indicator-height    /* 2px */
--tab-min-width-72        /* default min */
--tab-min-height-48       /* touch */
```

## Accessibility

- Renders `role="tab"` inside `role="tablist"`. Selected = `aria-selected="true"`.
- Keyboard: ArrowLeft/Right cycle between tabs. Home/End jump.
- For tabs with associated panels: `aria-controls="panel-id"` + matching `role="tabpanel"` + `aria-labelledby="tab-id"`.
- Disabled tabs are skipped in keyboard nav by default.

## Edge cases

- **Long labels in Korean** — Hangul is wider; expect tabs to overflow. Use `<Tabs variant="scrollable">` for horizontal scroll on overflow.
- **Mobile narrow viewport** — `variant="fullWidth"` distributes tabs evenly; OK for ≤ 4 tabs. For 5+, switch to scrollable.
- **Icon + label** — label first then icon-only on narrow → use `useMediaQuery` to switch `iconPosition`.
- **Nested tabs** — discouraged but possible. Aria gets confusing; consider a sub-nav pattern instead.

## Code example

```tsx
function AccountTabs() {
  const [tab, setTab] = useState('profile');
  const navigate = useNavigate();

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
      <Tabs
        value={tab}
        onChange={(_, v) => { setTab(v); navigate(`/account/${v}`); }}
        aria-label="계정 설정"
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label="프로필" value="profile" />
        <Tab label="보안" value="security" />
        <Tab label="결제" value="billing" />
        <Tab label="알림" value="notifications" />
        <Tab label="개인정보" value="privacy" />
      </Tabs>
    </Box>
  );
}
```

## Don't

- Don't use Tabs for binary on/off — use `Switch` or `ToggleButton`.
- Don't put 2 separate Tabs sets on the same screen — confuses keyboard navigation.
- Don't use Tab text as the page heading — they have separate semantics.

## References

- MUI: [`Tab`](../refs/mui/packages/mui-material/src/Tab/) + [`Tabs`](../refs/mui/packages/mui-material/src/Tabs/)

## Cross-reference

- [`component-tabs.md`](component-tabs.md)
- [`component-bottom-navigation.md`](component-bottom-navigation.md)
- [`knowledge/patterns/mobile-navigation.md`](../knowledge/patterns/mobile-navigation.md)
