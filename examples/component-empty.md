# `Empty` — spec

> Synthesized from Ant Design `Empty` and shadcn-ui `empty`. The canonical "no data" placeholder. A simpler primitive than [`EmptyState`](component-empty-state.md) — no illustration registry, no required title/description structure. Use as a building block.

## Empty vs EmptyState

| | `Empty` (this spec) | `EmptyState` |
| --- | --- | --- |
| Origin | Ant + shadcn primitive | design-ai custom (Korean fintech-aware) |
| Illustration | Optional, free-form | Registry-backed, typesafe names |
| Voice rules | None enforced | KR voice + 해요체 default |
| Use | Inline within a component (table empty, dropdown empty) | Full-page or section-level surfaces |

For most pages: use `EmptyState`. For inline empty within a component: use `Empty`.

## Anatomy

```
        [optional image / icon]

           No data found

      Try a different search.
```

## API

```tsx
<Empty>
  No items
</Empty>

<Empty
  image={<SearchIcon className="text-muted size-12" />}
  description="No results match your search."
>
  <Button onClick={clearFilters}>Clear filters</Button>
</Empty>

<Empty image="default">
  No projects yet
</Empty>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `image` | `ReactNode \| "default" \| "presented"` | `"default"` | Visual; `"default"` = generic empty graphic, `"presented"` = simpler, custom node = override |
| `description` | `ReactNode` | — | Text explanation |
| `children` | `ReactNode` | — | Action(s) — typically buttons |
| `imageStyle` | `CSSProperties` | — | Style override on image |

## Variants

### Default (with image)

Generic empty illustration above text. Suitable for page-level empty.

### Image-only

`image="presented"` shows simpler graphic (often just an icon). Use inline / in dense surfaces.

### No image

`image={null}` shows just text. Use for very dense contexts (table cell empty, dropdown "no results").

## States

Stateless. Empty is purely presentational.

## Tokens consumed

```
--color-fg-default                 (description)
--color-fg-muted                   (default image / icon)
--space-md, --space-lg
--font-size-sm, --font-size-base
```

## Accessibility

- Container: `role="status"` so screen reader announces "Empty" content.
- Image: `aria-hidden="true"` if decorative; `alt` text only if conveying additional meaning.
- Don't use `role="alert"` — empty isn't an error.

## Use cases

### Inside a Table

```tsx
<Table>
  <TableBody>
    {rows.length === 0 ? (
      <TableRow>
        <TableCell colSpan={columns.length}>
          <Empty description="No data" />
        </TableCell>
      </TableRow>
    ) : rows.map(...)}
  </TableBody>
</Table>
```

### Inside a Combobox / Dropdown

```tsx
<Combobox.Empty>
  <Empty image={null} description="No matches" />
</Combobox.Empty>
```

### Inside a List / feed

```tsx
{notifications.length === 0 && (
  <Empty
    image={<BellIcon className="text-muted size-10" />}
    description="No notifications yet."
  />
)}
```

### Page-level — prefer EmptyState

```tsx
{/* For full pages, use EmptyState — registry-backed illustrations + Korean voice */}
<EmptyState
  size="lg"
  illustration="no-projects"
  title="첫 프로젝트를 시작해 보세요"
  description="프로젝트를 만들면 팀과 함께 작업할 수 있어요."
  primaryAction={{ label: "프로젝트 만들기", onClick: createProject }}
/>
```

See [`component-empty-state.md`](component-empty-state.md).

## Korean conventions

For inline `Empty`:
- "데이터가 없어요" (해요체) / "데이터가 없습니다" (합쇼체)
- "결과가 없어요" / "결과가 없습니다"
- "해당하는 항목이 없어요"

Match the surrounding component's voice level.

## Edge cases

- **Inside a scrollable list**: Empty shouldn't fill the entire scroll viewport (looks broken). Cap at ~200px tall; align to top.
- **Loading state**: don't show Empty while data is loading — show Skeleton or Spinner instead. Empty is for "loaded with zero results", not "still loading".
- **Empty in a dropdown / command palette**: keep it brief, no image (single-line is fine).
- **Action button inside Empty**: works, but consider whether the user can act from this surface OR they need to navigate away. If "Create" works inline → button. If user needs to go to /create → link.
- **Reduced motion**: not applicable — Empty is static.
- **Dark mode**: tokens cascade; verify default image SVG visible against dark bg.

## Don't

- Don't use Empty for errors. Use Result with status="error" or an error pattern.
- Don't show Empty before data has loaded. Show loading state first.
- Don't make inline Empty as large as a full-page EmptyState. Match scale.
- Don't omit description for non-obvious empty states. Tell users why.
- Don't put long copy in inline Empty. Keep it < 1 sentence.

## References

- Ant: [`Empty`](../refs/ant-design/components/empty)
- shadcn-ui: [`empty`](../refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/empty.tsx)

## Cross-reference

- [`examples/component-empty-state.md`](component-empty-state.md) — full-page custom variant with KR voice + illustration registry
- [`examples/component-result.md`](component-result.md) — for error / success full-page surfaces
- [`examples/component-table.md`](component-table.md) — common consumer of inline Empty
