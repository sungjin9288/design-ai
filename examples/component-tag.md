# `Tag` — spec

> Synthesized from Ant Design `Tag`. Closeable label / chip for filters, attributes, or selected items. See [`component-tag-badge.md`](component-tag-badge.md) for Tag + Badge comparison.

## Tag vs Badge

> Tag = removable / interactive. Badge = passive indicator.

- Filter chips ("Marketing × Sales × ×"): Tag.
- Notification count: Badge.
- Selected items in multi-select: Tag.
- Status indicator on a parent: Badge.

## Anatomy

```
[ React ×]   [ TypeScript ×]   [ + Add tag ]
   ↑ closeable
```

## API

```tsx
<Tag>React</Tag>
<Tag closable onClose={() => removeTag("react")}>React</Tag>
<Tag color="error">Failed</Tag>
<Tag color="success">Active</Tag>
<Tag icon={<CheckIcon />}>Verified</Tag>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `closable` | `boolean` | `false` | Show × button |
| `onClose` | `() => void` | — | Close callback |
| `color` | `"default" \| "brand" \| "success" \| "warning" \| "error" \| "info"` | `"default"` | Color preset |
| `icon` | `ReactNode` | — | Leading icon |
| `bordered` | `boolean` | `true` | Border style |
| `size` | `"sm" \| "md"` | `"md"` | — |
| `disabled` | `boolean` | `false` | — |

## States

| State | Visual |
| --- | --- |
| Default | Filled / outlined per variant |
| Hover (closable) | Subtle shift |
| Close button hover | Distinct hover on × |
| Disabled | Reduced opacity, no events |

## Tokens consumed

```
--tag-bg-default / -brand / -success / -warning / -error / -info
--tag-fg-default / ...
--tag-border-default / ...
--radius-sm                       (slightly less rounded than chips)
--space-xxs                       (icon gap)
--font-size-sm
```

## Accessibility

- For removable: `<button aria-label="Remove {label}">×</button>` inside the tag.
- For non-interactive: just `<span>`; no role needed.
- If tags are filterable: wrap group in `<div role="group" aria-label="Active filters">`.

## Code example — filter chips

```tsx
<div role="group" aria-label="활성 필터">
  {filters.map(f => (
    <Tag
      key={f.id}
      closable
      onClose={() => removeFilter(f.id)}
      color="brand"
    >
      {f.label}
    </Tag>
  ))}
</div>
```

## Korean conventions

- 태그 / 필터: 합쇼체 / 해요체 either; tag labels are usually nouns.
- Status colors same as global conventions.

## Don't

- Don't use Tag for primary CTAs.
- Don't pile up 20+ tags inline. Wrap or paginate.
- Don't omit `aria-label` on close button.

## References

- Ant: [`Tag`](../refs/ant-design/components/tag)

## Cross-reference

- [`examples/component-tag-badge.md`](component-tag-badge.md) — combined spec
- [`examples/component-badge.md`](component-badge.md) — passive indicator
