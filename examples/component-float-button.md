# `FloatButton` (FAB — Floating Action Button) — spec

> Citing Ant Design `FloatButton`, MUI `Fab`, shadcn-ui (composition)

## Purpose

A round floating button anchored to the screen edge (typically bottom-right). Used for the **single most important action** on the screen — compose new message, add new item, scroll-to-top.

## When FAB vs alternatives

| Pattern | Use |
| --- | --- |
| **FAB** | One primary action, mobile-primary product |
| **Bottom CTA** (full-width footer button) | Form submit, "Pay" — context-specific |
| **Header action button** | When the action is contextual to the page header |
| **Inline button in list** | Per-item actions |

A FAB **must be the single most important action**. Don't use it for navigation. Don't have multiple FABs at the same time.

## Anatomy

```
[viewport]
                                   ┌─────┐
                                   │  +  │   ← FAB
                                   └─────┘
                                   ▼ tap

With expand menu:
                                   ┌────┐
                                   │ 📷 │  ← child action
                                   └────┘
                                   ┌────┐
                                   │ 📝 │
                                   └────┘
                                   ┌─────┐
                                   │  ✕  │  ← rotated FAB (close)
                                   └─────┘
```

| Slot | Required | Notes |
| --- | --- | --- |
| Icon | yes | Single, recognizable (+, 📝, 📷, ↑) |
| Label | optional | "Extended FAB" — text alongside icon |
| Child actions | optional | Speed-dial menu when tapped |

## API

```tsx
<FloatButton
  icon={<PlusIcon />}
  onClick={openAddModal}
  position="bottom-right"
  label="Add"
/>

// With expand menu (Speed Dial)
<FloatButton.Group icon={<PlusIcon />} position="bottom-right">
  <FloatButton.Item icon={<CameraIcon />} label="사진" onClick={takePhoto} />
  <FloatButton.Item icon={<PenIcon />} label="메모" onClick={addNote} />
  <FloatButton.Item icon={<MicIcon />} label="음성" onClick={recordVoice} />
</FloatButton.Group>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `icon` | `ReactNode` | — | Required |
| `label` | `string` | — | Extended-FAB label |
| `onClick` | `() => void` | — | |
| `position` | `"bottom-right" \| "bottom-left" \| "bottom-center"` | `"bottom-right"` | Screen-edge anchor |
| `offset` | `[number, number]` | `[16, 16]` (mobile) / `[24, 24]` (desktop) | px from edge |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | |
| `variant` | `"primary" \| "secondary" \| "tonal"` | `"primary"` | |
| `disabled` | `boolean` | `false` | |
| `tooltip` | `string` | — | Optional hover hint (desktop) |

## Sizes

| Size | Diameter | Icon | Use |
| --- | --- | --- | --- |
| `sm` | 40px | 20px | Inline / dense |
| `md` (default) | 56px | 24px | Standard mobile FAB |
| `lg` | 64px | 28px | Tablet / hero |

Material 3's "extended FAB" with label: ~48px height + label text padding.

## States

| State | Visual |
| --- | --- |
| Default | Resting; raised shadow |
| Hover | Slight scale up + shadow deepen |
| Pressed | Scale 0.96 |
| Focus-visible | 2px ring around |
| Expanded (Speed Dial open) | Backdrop dim, child actions visible above, FAB rotates to ✕ |

## Tokens consumed

```
--color-primary-default       (default FAB bg)
--color-on-primary             (icon)
--color-bg-elevated           (tonal variant)
--color-text-primary
--color-focus-ring
--space-md, --space-base
--radius-full                  (circular)
--radius-lg                    (extended FAB)
--shadow-3                     (elevation when raised)
--shadow-4                     (elevation when expanded)
--motion-fast, --easing-out
--z-fab                        (above content, below modals)
```

## Safe area on mobile

iOS / Android devices have safe-area insets (home bar, notches). FAB position must respect them:

```css
.fab {
  position: fixed;
  bottom: max(16px, calc(16px + env(safe-area-inset-bottom)));
  right: max(16px, calc(16px + env(safe-area-inset-right)));
}
```

In RN: use `useSafeAreaInsets()` hook.

## Bottom navigation interplay

If your app has a bottom-tab-bar (per [`knowledge/patterns/mobile-navigation.md`](../knowledge/patterns/mobile-navigation.md)), the FAB sits **above the tab bar** with `bottom: tabBarHeight + 16`.

For the "center action" tab (elevated tab in middle of tab bar): that's a different pattern — not a FAB, integrated into nav.

## Accessibility

- Render as `<button>` with `aria-label` (icon-only).
- For Speed Dial: parent button has `aria-haspopup="menu" aria-expanded`. Children are `role="menuitem"`.
- Focus order: FAB is reachable via Tab.
- High contrast mode: ensure icon visible against bg color.

### Keyboard

- `Tab` reaches FAB.
- `Enter` / `Space` activates.
- For Speed Dial: arrow keys move through children, `Esc` closes.

## Variants

### `primary` (default)

Filled with `--color-primary-default`, on-primary icon. Highest emphasis.

### `secondary`

Filled with secondary brand or neutral elevated. Use when there's a more important primary CTA elsewhere on the page.

### `tonal` (Material 3)

Subtle bg (`--color-primary-subtle-bg`), primary icon. Less emphasis but still elevated.

## Code example

```tsx
// Standard FAB — add new
<FloatButton
  icon={<PlusIcon />}
  aria-label="새 거래 추가"
  onClick={openAddTransaction}
/>

// Extended (label visible)
<FloatButton
  icon={<PenIcon />}
  label="작성"
  onClick={openCompose}
/>

// Scroll to top variant
<FloatButton
  icon={<ArrowUpIcon />}
  aria-label="맨 위로"
  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
  hidden={scrollY < 200}     // only show when scrolled
/>

// Speed dial
<FloatButton.Group icon={<PlusIcon />}>
  <FloatButton.Item icon={<CameraIcon />} label="사진 촬영" onClick={takePhoto} />
  <FloatButton.Item icon={<NoteIcon />} label="메모 작성" onClick={addNote} />
  <FloatButton.Item icon={<MicIcon />} label="음성 녹음" onClick={recordVoice} />
</FloatButton.Group>
```

## Don't

- Don't have multiple FABs visible at once.
- Don't use FAB for navigation — that's a tab.
- Don't use for destructive actions — too easy to tap accidentally.
- Don't use FAB on screens where its action wouldn't make sense (settings page, etc.). Show only where the action is contextual.
- Don't omit `aria-label` for icon-only.
- Don't ignore safe-area-inset on mobile.
- Don't put FAB so close to bottom-tab-bar that taps overlap.

## References

- Ant Design: [`refs/ant-design/components/float-button/`](../docs/reference/ant-design.md#float-button) — `FloatButton`, `FloatButton.Group` (speed dial), `FloatButton.BackTop`. Most flexible.
- MUI: [`refs/mui/packages/mui-material/src/Fab/`](../docs/reference/mui.md#fab) — `Fab` with `variant="circular" | "extended"`, color, size. Material-aligned.
- shadcn-ui: no built-in. Compose with `Button` + Tailwind `fixed bottom-4 right-4 rounded-full`.

## Cross-reference

- [`knowledge/patterns/mobile-navigation.md`](../knowledge/patterns/mobile-navigation.md) — center-tab variant
- [`examples/component-button.md`](component-button.md) — for non-FAB buttons
- [`knowledge/a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md) — touch target sizing
