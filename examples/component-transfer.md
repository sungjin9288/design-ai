# `Transfer` (dual list) — spec

> Citing Ant Design `Transfer`, MUI (no built-in), shadcn-ui (no built-in)

## Purpose

Two side-by-side lists with arrows to move items between them. Used for: permission editors (available roles → assigned roles), team assignment, tag selection (available tags → applied tags), feature flags (available features → enabled features).

## When Transfer vs alternatives

| Pattern | Use |
| --- | --- |
| **Transfer** | User explicitly moves items between TWO lists; both sides matter |
| **Multi-Select** | User picks from many; UI shows selected as tags only |
| **Checkbox list** | Simpler — just toggle each item |
| **Tree (with check)** | Hierarchical permissions; tree shape matters |

Transfer is a power-user pattern. Most consumer UIs should use Multi-Select instead.

## Anatomy

```
┌──────────────────┐                   ┌──────────────────┐
│ Available (12)   │                   │ Assigned (3)     │
│ ▣ Search...      │                   │ ▣ Search...      │
├──────────────────┤                   ├──────────────────┤
│ ☐ Item A          │      [→  ]       │ ☑ Item D          │
│ ☐ Item B          │      [→→]       │ ☑ Item E          │
│ ☑ Item C          │   [←]  [←←]      │ ☑ Item F          │
│ ☐ Item D          │                   │                   │
│ ...               │                   │                   │
└──────────────────┘                   └──────────────────┘
   Select all (1)                          Remove all (0)
```

| Slot | Required | Notes |
| --- | --- | --- |
| Source list (left) | yes | Available items |
| Target list (right) | yes | Selected/assigned items |
| Movement arrows (center) | yes | Single + bulk move buttons |
| Search per side | optional | Filter within each list |
| Header per side | yes | Title + count + select-all |
| Item checkbox | yes | Multi-select before move |

## API

```tsx
<Transfer
  source={availableItems}
  target={selectedItemKeys}
  onChange={setSelectedItemKeys}
  searchable
  titles={["사용 가능한 권한", "할당된 권한"]}
  itemRender={(item) => <PermissionItem item={item} />}
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `source` | `Item[]` | — | All possible items |
| `target` | `string[]` | `[]` | Keys currently in the target side |
| `onChange` | `(targetKeys: string[]) => void` | — | |
| `titles` | `[string, string]` | `["Source", "Target"]` | Header labels per side |
| `searchable` | `boolean` | `false` | Search inputs |
| `itemRender` | `(item) => ReactNode` | default | Custom rendering |
| `disabled` | `boolean` | `false` | |
| `oneWay` | `boolean` | `false` | Items only move source → target (no return) |

```ts
type Item = {
  key: string;
  label: string;
  description?: string;
  disabled?: boolean;
  data?: unknown;
};
```

## Behavior

### Movement

1. User checks items in source list.
2. Click `→` to move selected items to target.
3. Reverse with `←`.
4. Bulk: `→→` (move all visible), `←←` (return all).

### Search

Per-side search filters that side's visible items. Doesn't affect the other side. Combined search across both: typically not provided (different lists, different intent).

## States

| State | Visual |
| --- | --- |
| Default | Both lists rendered |
| Item checked (in source) | Move-right arrow enabled |
| Item checked (in target) | Move-left arrow enabled |
| Empty source side | "모든 항목이 할당되었습니다" |
| Empty target side | "할당된 항목이 없습니다" |
| Disabled | Both lists muted |

## Accessibility

- Each side: `<section>` with `<h3>` heading.
- Lists: `role="listbox" aria-multiselectable="true"`.
- Items: `role="option"`, `aria-selected="true|false"`.
- Movement buttons: `<button>` with `aria-label`.

### Keyboard

| Key | Behavior |
| --- | --- |
| `Tab` | Reach search → list → arrows → other list (in order) |
| `↑` / `↓` | Move within list |
| `Space` | Toggle item selected |
| `Enter` (on arrow) | Apply movement |

## Mobile pattern

Transfer's two-side layout doesn't fit mobile. Switch to:

```
[Single tab list with toggles]
"Available" tab          "Assigned" tab
   Item A  [→ Add]            Item D  [✕]
   Item B  [→ Add]            Item E  [✕]
   Item C  [✓ Added]          Item F  [✕]
```

Or a simpler "tap to toggle" pattern:

```
☐ Item A    (tap to add)
☐ Item B
☑ Item D    (tap to remove)
☑ Item E
```

## Don't

- Don't use Transfer for < 10 items. Use Checkbox list — simpler.
- Don't use for non-symmetric "both sides matter" cases. If user only cares about one side, use Multi-Select.
- Don't omit per-side counts — users want to know how many they've selected.
- Don't disable items in source after moving — make it clear they're already in target by hiding or disabling consistently.

## References

- Ant Design: [`refs/ant-design/components/transfer/`](../docs/reference/ant-design.md#transfer) — `Transfer`. Most exhaustive; supports tree-like (`Transfer.TableTransfer`).
- MUI / shadcn-ui: no built-in.

## Cross-reference

- [`examples/component-form-controls.md`](component-form-controls.md) — Checkbox list alternative
- [`examples/component-select.md`](component-select.md) — Multi-Select alternative
- [`examples/component-tree.md`](component-tree.md) — for hierarchical permission pickers
