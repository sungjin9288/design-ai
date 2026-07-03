# `Tag` + `Badge` — combined spec

> Two sibling status indicators. Same family, distinct purposes — speccing together avoids duplicate decisions.
>
> Citing Ant Design `Tag` + `Badge`, MUI `Chip` + `Badge`, shadcn-ui `badge`

## Semantic difference

| Component | Use | Interactive? |
| --- | --- | --- |
| **Tag** | Inline label or pill — categorize content, attribute, filter | Often (closable, clickable) |
| **Badge** | Small dot or count overlaid on another element (icon, avatar) | No (decorative status indicator) |

Picking the wrong one is common. A "3 new messages" indicator on a notification icon = **Badge**. A "Premium" label inline with a username = **Tag**.

## Tag

### Anatomy

```
Static:        ┌──────────┐
              │  Premium │
              └──────────┘

With icon:    ┌──────────────┐
              │ ★ Featured   │
              └──────────────┘

Closable:     ┌──────────────┐
              │ tag1      ✕  │
              └──────────────┘

Color tag:    ●━━━━━━━━━━●  Critical    [colored dot + text]
```

### API

```tsx
<Tag>Premium</Tag>
<Tag color="success">Completed</Tag>
<Tag closable onClose={() => removeTag(id)}>{tagText}</Tag>
<Tag iconStart={<StarIcon />} variant="solid">Featured</Tag>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | Tag label |
| `variant` | `"subtle" \| "outlined" \| "solid"` | `"subtle"` | Visual emphasis |
| `color` | `"default" \| "primary" \| "success" \| "warning" \| "error" \| "info"` or hex | `"default"` | Semantic color |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | |
| `closable` | `boolean` | `false` | Show ✕ |
| `onClose` | `(e) => void` | — | |
| `onClick` | `(e) => void` | — | If set, makes tag clickable (cursor + hover) |
| `iconStart` / `iconEnd` | `ReactNode` | — | |
| `disabled` | `boolean` | `false` | |

### Sizes

| Size | Height | Font | Padding-x |
| --- | --- | --- | --- |
| `sm` | 20px | 11px | 6px |
| `md` (default) | 24px | 12px | 8px |
| `lg` | 28px | 13px | 10px |

### Variants

| Variant | Subtle | Outlined | Solid |
| --- | --- | --- | --- |
| Background | `--color-<color>-subtle-bg` | transparent | `--color-<color>` |
| Border | none | `1px --color-<color>` | none |
| Text | `--color-text-primary` (or color-specific) | `--color-<color>` | `--color-on-<color>` |

`subtle` is the default — least visually noisy. Use `outlined` for important categorization. Use `solid` for "Premium" / "Featured" / status that needs to dominate.

### When to use Tag

- Category labels: "디자인", "엔지니어링", "마케팅"
- Status: "Active", "Archived", "Pending"
- Filter chips (in a filter bar): "Color: Red ✕", "Size: M ✕"
- Premium / status indicators: "Pro", "Enterprise"
- Multi-select selected values inside a Combobox

### When NOT to use Tag

- For interactive primary actions — that's a Button.
- For navigation — that's a Link or Breadcrumb item.
- For a container — that's a Card or Box.

## Badge

### Anatomy

```
Dot indicator:               Count badge:                Standalone:

   📨 ●                          📨 (3)                    [New]
                              max 99+: 📨 (99+)

Status dot on avatar:         New indicator on tab:
   ● 김민지                     설정 ●
```

### API

```tsx
<Badge variant="dot" color="success" />               {/* dot only */}
<Badge count={3}>{<NotificationIcon />}</Badge>        {/* count overlay */}
<Badge count={142} max={99} showZero={false} />        {/* shows "99+" */}
<Badge content="NEW" color="primary" />                {/* text content */}
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `count` | `number` | — | Numeric value to show |
| `max` | `number` | `99` | Above this, show "max+" (e.g., "99+") |
| `showZero` | `boolean` | `false` | Render even when count is 0 |
| `content` | `ReactNode` | — | Text/element instead of count (e.g., "NEW") |
| `variant` | `"dot" \| "count"` | inferred | Dot if no count/content; otherwise count |
| `color` | `"primary" \| "success" \| "warning" \| "error" \| "info"` | `"error"` | |
| `size` | `"sm" \| "md"` | `"md"` | |
| `placement` | `"top-right" \| "top-left" \| "bottom-right" \| "bottom-left"` | `"top-right"` | When wrapping a child |
| `offset` | `[number, number]` | `[0, 0]` | Fine-tune placement |
| `children` | `ReactElement` | — | The element being badged |

### Sizes

| Size | Dot | Count badge height |
| --- | --- | --- |
| `sm` | 6px | 16px |
| `md` (default) | 8px | 18px |

The count badge wraps tightly around 1–2 digits. For 3-digit + show "99+".

### Placement

When `<Badge>` wraps a child element, it positions absolutely relative to the child:

```
┌──────────┐
│   📨   ● │   ← top-right (default)
└──────────┘
```

Use `offset` to fine-tune (badges often need -4px / -4px to overlap nicely).

### When to use Badge

- Notification count on icons (mail, bell)
- Online status dot on avatars
- "New" indicator on tabs / menu items
- Cart count
- Unread count on chat list items

### When NOT to use Badge

- Inline text labels — use Tag
- Standalone status — use Tag
- Long text (4+ chars) — use Tag

## States

### Tag states

| State | Visual |
| --- | --- |
| Default | Resting |
| Hover (clickable) | Slight bg darken |
| Focus-visible (clickable) | 2px ring |
| Closing | Optional fade-out 100ms |
| Disabled | 50% opacity |

### Badge states

| State | Visual |
| --- | --- |
| Default | Always visible (with count > 0 or dot) |
| Animating in | 150ms scale 0.7 → 1 + opacity |
| Hidden | When count = 0 and `!showZero`, badge unmounts |

## Tokens consumed

```
--color-bg-default
--color-bg-subtle
--color-text-primary
--color-text-secondary
--color-on-primary, --color-on-success, etc.
--color-primary-default, --color-primary-subtle-bg
--color-success, --color-success-subtle-bg
--color-warning, --color-warning-subtle-bg
--color-error, --color-error-subtle-bg
--color-info, --color-info-subtle-bg
--color-border-default
--color-focus-ring
--space-xs, --space-sm
--radius-md (Tag)
--radius-full (Badge dot, Badge count)
--font-size-xs, --font-size-sm
--font-weight-medium
--motion-fast
```

## Accessibility

### Tag

- If purely decorative (e.g., category label): regular `<span>`, no special role.
- If clickable: `<button>` semantics.
- If closable: the close button has its own `aria-label="<tag content> 제거"`.
- Color is not the only signal — pair with text or icon. (e.g., "Critical" tag should have icon AND red color.)

### Badge

- For count badges: include screen-reader text. The visual count can be `aria-hidden`; the actual announcement should be richer.

```html
<button aria-label="알림, 새 알림 3개">
  <BellIcon aria-hidden="true" />
  <span class="badge" aria-hidden="true">3</span>
</button>
```

- For dot indicators: `aria-label` on the parent describes the status.
- Don't put critical info only in a badge — visually small, easily missed.

## Code examples

```tsx
// Multi-select tags inside a Combobox
<div className="tags-input">
  {selectedTags.map(tag => (
    <Tag key={tag} closable onClose={() => removeTag(tag)}>{tag}</Tag>
  ))}
  <input ... />
</div>

// Filter bar
<div className="filter-bar">
  Active filters:
  {activeFilters.map(f => (
    <Tag key={f.key} variant="outlined" closable onClose={() => clearFilter(f.key)}>
      {f.label}: {f.value}
    </Tag>
  ))}
</div>

// Status tag in a list
<TableCell>
  {row.status === "active" && <Tag color="success">활성</Tag>}
  {row.status === "pending" && <Tag color="warning">대기 중</Tag>}
  {row.status === "archived" && <Tag color="default">보관됨</Tag>}
</TableCell>

// Notification count on bell icon
<Badge count={notificationCount} max={99}>
  <button aria-label={`알림 ${notificationCount}개`}>
    <BellIcon />
  </button>
</Badge>

// Online dot on avatar
<Badge variant="dot" color="success" placement="bottom-right">
  <Avatar src={user.photoUrl} alt={user.name} />
</Badge>

// "NEW" indicator on a menu item
<MenuItem>
  새 기능
  <Badge content="NEW" color="primary" size="sm" />
</MenuItem>
```

## Edge cases

- **Tag with very long text**: cap with `max-width` + `text-overflow: ellipsis`. Provide `title` for full text.
- **Badge count flickering** (count changes rapidly): debounce updates to avoid visual jitter.
- **Badge over a clickable child**: badge should be `pointer-events: none` so clicks reach the child.
- **Tag click + close button click**: stop propagation on close button so tag's onClick doesn't fire.
- **Many tags wrapping**: use flex with gap, allow wrapping. Don't truncate the row of tags.
- **Korean tag text**: typically short (1–4 syllables) — fits easily.

## Don't

- Don't use Tag for buttons.
- Don't use Badge for decorative effect — meaning required.
- Don't combine 4+ colors of tags in one row — picks one or two semantic colors.
- Don't show "0" count badge unless `showZero` (visual noise).
- Don't put images / videos in a Tag. Text + small icon only.
- Don't use Badge as the only indicator for critical info.
- Don't omit screen reader text for count badges.

## References

- Ant Design: [`refs/ant-design/components/tag/`](../docs/reference/ant-design.md#tag) (Tag) + [`refs/ant-design/components/badge/`](../docs/reference/ant-design.md#badge) (Badge). Both well-developed; Tag has `Tag.CheckableTag` for filter-style.
- MUI: `Chip` (closest to Tag) + `Badge`. MUI Chip has `clickable`, `deletable`, `avatar` slot — most flexible.
- shadcn-ui: [`refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/badge.tsx`](../docs/reference/shadcn-ui.md#badge) — minimal Tag-equivalent. shadcn doesn't have a separate Tag/Badge distinction; user composes.

API choices made:
- **Tag and Badge as separate components**: matches Ant + MUI; clearer than a single "Pill" with a `mode` flag.
- **Tag's `color` accepts hex** in addition to semantic names — for category-colored tags (e.g., a project color).
- **Badge's `count` + `max`**: matches Ant convention. `99+` is the universal display.
- **Combined spec**: shared visual language and tokens; avoids triplicate maintenance for nearly-identical pieces.

## Cross-reference

- [`examples/component-button.md`](component-button.md) — when interactive emphasis matters more than category
- [`examples/component-avatar.md`](component-avatar.md) — Badge on Avatar pattern
- [`examples/component-form-controls.md`](component-form-controls.md) — Tag in multi-select
- [`knowledge/a11y/contrast.md`](../knowledge/a11y/contrast.md) — color tags must clear AA
