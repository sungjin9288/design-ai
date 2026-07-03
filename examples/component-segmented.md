# `Segmented` (Toggle button group) — spec

> Citing Ant Design `Segmented`, MUI `ToggleButtonGroup`, shadcn-ui `toggle-group`

## Purpose

A row of mutually exclusive options shown as connected buttons. Pick one. Used for: view mode (List / Grid), time range (오늘 / 7일 / 30일), filter sort, density toggle (Compact / Standard / Comfortable).

## When Segmented vs alternatives

| Pattern | Use |
| --- | --- |
| **Segmented** | 2–5 short options, mutually exclusive, frequently switched |
| **Tabs** | 3–6 sections of content (more weight, often span the page) |
| **Select** | 6+ options, less-frequent switching |
| **Radio group** | Form input — submit later |
| **Switch** | Binary on/off, immediate effect |

Segmented is the iOS-native pattern (also called "segmented control"). Compact, immediate, ideal for dashboard-style filters.

## Anatomy

```
┌─────────────────────────────────────┐
│ ┌─────┐ ┌────┐ ┌───┐                │
│ │오늘 │ │ 주 │ │ 월 │                │  ← all three inside a container, active filled
│ └─────┘ └────┘ └───┘                │
└─────────────────────────────────────┘

With icons:
┌─────────────────────────────────────┐
│ ┌──────┐ ┌──────┐ ┌──────┐         │
│ │ ☰ List│ │ ⊞ Grid│ │ ☰ Card│         │
│ └──────┘ └──────┘ └──────┘         │
└─────────────────────────────────────┘
```

## API

```tsx
<Segmented
  value={view}
  onValueChange={setView}
  options={[
    { value: "today", label: "오늘" },
    { value: "week", label: "이번 주" },
    { value: "month", label: "이번 달" },
  ]}
  size="md"
/>

<Segmented
  value={layout}
  onValueChange={setLayout}
  options={[
    { value: "list", label: "List", icon: <ListIcon /> },
    { value: "grid", label: "Grid", icon: <GridIcon /> },
  ]}
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string \| number` | — | Active option |
| `onValueChange` | `(value) => void` | — | |
| `options` | `Option[]` or `string[]` | — | List of choices |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | |
| `disabled` | `boolean` | `false` | Disables all |
| `block` | `boolean` | `false` | Stretches to full width (each option equal-flex) |

```ts
type Option = {
  value: string | number;
  label: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
};
```

## Sizes

| Size | Height | Font | Padding-x |
| --- | --- | --- | --- |
| `sm` | 28px | 12px | 8px |
| `md` (default) | 32px | 14px | 12px |
| `lg` | 40px | 16px | 16px |

## States

| State | Visual |
| --- | --- |
| Default (inactive option) | Transparent bg, neutral text |
| Active option | Filled bg `--color-bg-default` (lighter than container), darker text |
| Hover (inactive) | Slight bg shift |
| Focus-visible | 2px ring on the active or focused option |
| Disabled | All options muted |

The container background is slightly darker than the page (`--color-bg-subtle`); the active option is lighter (`--color-bg-default`) — creating an "indented vs raised" visual distinction.

## Tokens consumed

```
--color-bg-subtle           (container bg)
--color-bg-default          (active option bg)
--color-text-primary        (active option text)
--color-text-secondary      (inactive option)
--color-focus-ring
--space-xs, --space-sm
--radius-md                 (container)
--radius-sm                 (option pills inside)
--motion-fast, --easing-out  (active indicator slide)
```

## Active indicator transition

When the user clicks a different option, the white "indicator" can slide to the new position (~150ms ease-out). This is iOS-native polish but requires layout-stable rendering.

```css
.segmented-item {
  transition: background-color 150ms ease-out;
}
```

For more sophisticated animation: animate a positioned "indicator" element rather than each item's bg.

## Accessibility

- Container: `role="radiogroup"` (since options are mutually exclusive).
- Each option: `role="radio"`, `aria-checked={value === option.value}`.
- Container `aria-label` describes the group ("View mode" / "Time range").

### Keyboard

| Key | Behavior |
| --- | --- |
| `Tab` | Reach the active option (single tab stop) |
| `←` / `→` (or `↑` / `↓`) | Move focus + select next/previous |
| `Home` / `End` | First / last |
| `Space` | Activate focused option (if not auto-activate) |

By default: auto-activate (focus = select). For expensive operations: manual mode requires Space/Enter.

## Mobile patterns

Works fine on touch — each option is large enough. For very many options (5+), wraps to multiple rows or scrolls horizontally.

For Korean apps: short labels (1–4 syllables) work best.

## Common usage

| Where | Options |
| --- | --- |
| Time filter on dashboard | "오늘 / 7일 / 30일 / 사용자 지정" |
| View mode toggle | "List / Grid / Card" |
| Density | "Compact / Standard / Comfortable" |
| Theme | "Light / Dark / System" |
| Currency display (KR fintech) | "₩ / 원 / Korean number" |
| Stock convention | "Korean (red=up) / Western" |

## Don't

- Don't use Segmented for 6+ options. Use Select.
- Don't use for binary on/off. Use Switch.
- Don't use as in-page navigation between separate views. Use Tabs.
- Don't use long labels. Stay under ~10 chars per option.
- Don't disable the currently-active option. Disable the inactive ones if needed.

## References

- Ant Design: [`refs/ant-design/components/segmented/`](../docs/reference/ant-design.md#segmented) — `Segmented` with options, sizes, block mode, custom rendering. Modern Ant addition.
- MUI: [`refs/mui/packages/mui-material/src/ToggleButtonGroup/`](../docs/reference/mui.md#toggle-button-group) — supports both single and multiple. Set `exclusive={true}` for segmented behavior.
- shadcn-ui: [`refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/`](../docs/reference/shadcn-ui.md) — `toggle-group.tsx`. Radix Toggle Group primitive.

## Cross-reference

- [`examples/component-tabs.md`](component-tabs.md) — when sections are heavier
- [`examples/component-form-controls.md`](component-form-controls.md) — radio group alternative for forms
- [`examples/component-button.md`](component-button.md) — single-button alternative
