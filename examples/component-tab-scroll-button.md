# `TabScrollButton` - spec

> Direct upstream component: MUI `TabScrollButton`. Parent pattern references: Ant Design `Tabs`, MUI `Tabs`, shadcn-ui `tabs`.

## Purpose

`TabScrollButton` is the overflow affordance used by scrollable tab lists. It moves the tab strip left/right or up/down when there are more tabs than fit in the available space.

It is a supporting control for `Tabs`, not a tab and not page navigation.

## Anatomy

```
Tabs
├── Start TabScrollButton    optional; appears when content can scroll backward
├── TabList
│   ├── Tab
│   ├── Tab
│   └── Tab
└── End TabScrollButton      optional; appears when content can scroll forward
```

| Part | Required | Purpose |
| --- | --- | --- |
| Root | yes | Scroll command container. |
| Direction icon | yes | Communicates scroll direction. |
| Start/end slot | optional | Allows custom icons while preserving behavior. |

## API

```tsx
<TabScrollButton
  direction="right"
  orientation="horizontal"
  disabled={!canScrollForward}
  aria-label="다음 탭 보기"
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | - | Optional custom content. Usually omit and use icon slots. |
| `classes` | `Partial<TabScrollButtonClasses>` | - | Style override hooks for MUI-style implementations. |
| `direction` | `"left" \| "right"` | required | Visual/behavioral scroll direction. |
| `disabled` | `boolean` | `false` | Disabled when the tab strip cannot scroll further in that direction. |
| `orientation` | `"horizontal" \| "vertical"` | required | Tab list orientation. |
| `slots` | `{ StartScrollButtonIcon?, EndScrollButtonIcon? }` | `{}` | Custom start/end icon components. |
| `slotProps` | `{ startScrollButtonIcon?, endScrollButtonIcon? }` | `{}` | Props forwarded to icon slots. |
| `sx` | `SxProps<Theme>` | - | MUI system override. Prefer tokens for shared design-system code. |

Inherits most `ButtonBase` props in MUI, except native button behavior is intentionally customized.

## API choices made

- Keep `direction` and `orientation` required because icon rotation and scroll behavior depend on both.
- Keep `disabled` explicit so first/last scroll limits are represented in DOM and visuals.
- Do not expose `onScrollTabs` in this spec; the parent `Tabs` component should own scroll position and click handlers.
- Do not treat `TabScrollButton` as a `Tabs.Trigger`. It must stay outside the tab roving-focus model.

## States

| State | Trigger | Visual rule |
| --- | --- | --- |
| Hidden | No overflow in that direction | Do not render, or render with zero interaction and no layout jump depending on parent Tabs strategy. |
| Default | Overflow available | Icon uses secondary text color; fixed control width/height. |
| Hover | Pointer over enabled control | Subtle background. |
| Focus-visible | Keyboard focus if implemented as a real button | 2px focus ring with at least 3:1 contrast. |
| Active | Press | Pressed background; scroll distance remains deterministic. |
| Disabled | At scroll limit | Muted or transparent; no activation. |
| Vertical | `orientation="vertical"` | Icon rotates to indicate up/down movement. |
| RTL | Directional context | Horizontal start/end behavior mirrors with text direction. |

## Tokens consumed

```
--color-bg-default
--color-bg-subtle
--color-text-secondary
--color-text-disabled
--color-focus-ring
--space-xs
--space-sm
--tabs-scroll-button-size
--icon-size-sm
--radius-sm
--motion-fast
```

If `--tabs-scroll-button-size` does not exist, map it to the tab trigger height for the current size.

## Accessibility

- The control must not be part of the `role="tablist"` roving focus sequence.
- If your implementation makes it user-clickable, render a real `<button type="button">` with labels such as `aria-label="이전 탭 보기"` and `aria-label="다음 탭 보기"`.
- If matching MUI's internal presentational pattern, ensure the same scroll action is available through pointer drag/trackpad scroll and tab-list arrow-key navigation.
- Disabled controls need native `disabled` or `aria-disabled="true"` plus suppressed activation.
- Touch target must be at least 44x44 on mobile.
- Icons are decorative when the button has an accessible label; set icon `aria-hidden="true"`.

### Keyboard

| Key | Behavior |
| --- | --- |
| `Tab` | Enters active tab, not every tab and not hidden scroll controls, unless scroll controls are implemented as visible buttons. |
| `Enter` / `Space` | Activates the scroll button only when it is a focusable real button. |
| Arrow keys | Move between tabs through the parent Tabs pattern. |

## Layout rules

| Rule | Value |
| --- | --- |
| Horizontal size | Fixed inline size matching the parent density; commonly 40px equivalent. |
| Vertical size | Full tab-list width with fixed block size. |
| Position | At the start/end edge of the scroll container. |
| Overlay | Avoid covering tab labels; reserve space or use gradient mask plus button. |
| Motion | Smooth scroll is allowed, but disable it for `prefers-reduced-motion`. |

## Code example

```tsx
function ScrollableTabsHeader({ tabs, value, onValueChange }: Props) {
  return (
    <Tabs value={value} onValueChange={onValueChange} variant="underline">
      <TabScrollButton
        direction="left"
        orientation="horizontal"
        disabled={!canScrollBack}
        aria-label="이전 탭 보기"
        onClick={scrollBack}
      />
      <Tabs.List>
        {tabs.map((tab) => (
          <Tabs.Trigger key={tab.value} value={tab.value}>
            {tab.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      <TabScrollButton
        direction="right"
        orientation="horizontal"
        disabled={!canScrollForward}
        aria-label="다음 탭 보기"
        onClick={scrollForward}
      />
    </Tabs>
  );
}
```

## Edge cases

- **No overflow**: hide both controls or keep reserved space consistently. Do not show disabled arrows forever in compact mobile UIs.
- **RTL**: visual arrows and scroll math must be tested together; browser `scrollLeft` behavior differs by engine.
- **Vertical tabs**: rotate or swap icons so the control reads as up/down, not left/right.
- **Touch devices**: horizontal swipe/drag should work even when scroll buttons are hidden.
- **Many tabs**: keep arrow-key navigation functional for all tabs, including off-screen tabs.
- **Reduced motion**: use instant scroll instead of smooth scrolling.
- **High contrast mode**: do not rely on opacity alone for disabled state; pair with `disabled` semantics.

## Don't

- Don't render scroll buttons as tabs.
- Don't include scroll buttons in the tab count announced to screen readers.
- Don't use a "More" dropdown as the first solution for overflowed tabs.
- Don't hide off-screen tabs from the accessibility tree if they are still part of the tab set.

## References

- MUI direct source: [`refs/mui/packages/mui-material/src/TabScrollButton/TabScrollButton.d.ts`](../refs/mui/packages/mui-material/src/TabScrollButton/TabScrollButton.d.ts)
- MUI implementation: [`refs/mui/packages/mui-material/src/TabScrollButton/TabScrollButton.js`](../refs/mui/packages/mui-material/src/TabScrollButton/TabScrollButton.js)
- MUI tabs source: [`refs/mui/packages/mui-material/src/Tabs/`](../refs/mui/packages/mui-material/src/Tabs/)
- Ant Design parent pattern: [`refs/ant-design/components/tabs/`](../refs/ant-design/components/tabs/)
- shadcn-ui parent pattern: [`refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/tabs.tsx`](../refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/tabs.tsx)
- Accessibility baseline: [`knowledge/a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md)

## Cross-reference

- [examples/component-tabs.md](component-tabs.md)
- [examples/component-tab.md](component-tab.md)
- [WAI-ARIA Tabs Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)
