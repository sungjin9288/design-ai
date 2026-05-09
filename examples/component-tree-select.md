# `TreeSelect` — spec

> Synthesized from Ant Design `TreeSelect`. A select-style dropdown that opens a tree view for hierarchical selection. Distinct from `Cascader` (level-by-level columns) and `Tree` (full-page).

## TreeSelect vs Cascader vs Tree

| | TreeSelect | Cascader | Tree |
| --- | --- | --- | --- |
| Trigger | Single dropdown | Single dropdown with column drilldown | Full-page or panel |
| Hierarchy | Whole tree visible (collapsible) | Level-at-a-time | Whole tree visible |
| Multi-select | Yes | Variable | Yes |
| Search | Yes | Yes | Yes |
| Use | Department / category picker (deep tree) | Region / address (consistent depth) | File browser / hierarchy management |

## Anatomy

```
[ Engineering / Frontend  ▾ ]    ← trigger field with selected path
                                    
       ↓ open
       ┌──────────────────────┐
       │  ⌕ Search...          │
       │ ───────────────       │
       │  ▶ Engineering         │
       │    ▼ Frontend         │
       │       ● React (selected) │
       │       ○ Vue              │
       │       ○ Svelte           │
       │    ▶ Backend             │
       │  ▶ Design                 │
       │  ▶ Marketing              │
       └──────────────────────┘
```

## API

```tsx
<TreeSelect
  value={selectedKey}
  onChange={setSelectedKey}
  treeData={[
    {
      title: "Engineering",
      key: "eng",
      children: [
        {
          title: "Frontend",
          key: "fe",
          children: [
            { title: "React", key: "react" },
            { title: "Vue", key: "vue" },
          ],
        },
        { title: "Backend", key: "be" },
      ],
    },
    { title: "Design", key: "design" },
  ]}
  treeDefaultExpandAll
  showSearch
  placeholder="부서 선택"
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string \| string[]` | controlled | Selected key(s) |
| `onChange` | `(value) => void` | — | Callback |
| `treeData` | `TreeNode[]` | — | Hierarchy |
| `multiple` | `boolean` | `false` | Multi-select |
| `treeCheckable` | `boolean` | `false` | Show checkbox per node (multi-select with parent ↔ children sync) |
| `showSearch` | `boolean` | `false` | Filter input |
| `treeDefaultExpandAll` | `boolean` | `false` | Expand all on mount |
| `treeDefaultExpandedKeys` | `string[]` | `[]` | Initial expanded |
| `placeholder` | `string` | — | When no selection |
| `disabled` | `boolean` | `false` | — |

## Variants

### Single-select

One value, single click. No checkboxes.

### Multi-select with checkboxes (`treeCheckable`)

Click parent → all children checked.
Half-checked when some children selected.
Selected items shown as chips in trigger.

### Search

Type filters tree to matching nodes (and their ancestors so the path is visible).

## States

Same family as Combobox + Tree:
- Trigger states (default, focus, error, disabled).
- Open / closed.
- Hover / selected nodes.
- Expanded / collapsed branches.

## Tokens consumed

```
--tree-select-bg                   (panel)
--tree-select-bg-hover
--tree-select-bg-selected
--tree-select-checkbox-bg          (multi-select)
--tree-select-line                 (tree connector lines, optional)
--tree-select-search-bg            (filter input)
--space-xs, --space-sm
--font-size-sm
--motion-fast
--z-overlay
```

## Accessibility

- Trigger: `<button role="combobox" aria-haspopup="tree" aria-expanded>`.
- Tree: `role="tree"` with `<li role="treeitem" aria-expanded="true|false" aria-selected>` items.
- Keyboard:
  - Tab into trigger; Enter opens.
  - Arrow keys navigate within tree (Down/Up moves to next/prev visible node; Right expands; Left collapses).
  - Enter selects.
  - Esc closes.
- For multi-select with checkboxes: each checkbox is independent focusable.
- Touch target ≥ 36pt per node.

## Code example — KR organizational tree

```tsx
function DepartmentSelect() {
  return (
    <Field>
      <Label>부서</Label>
      <TreeSelect
        value={department}
        onChange={setDepartment}
        showSearch
        placeholder="부서를 선택해 주세요"
        treeData={[
          {
            title: "엔지니어링",
            key: "eng",
            children: [
              { title: "프론트엔드", key: "fe" },
              { title: "백엔드", key: "be" },
              { title: "데이터", key: "data" },
              { title: "데브옵스", key: "ops" },
            ],
          },
          {
            title: "디자인",
            key: "design",
            children: [
              { title: "프로덕트", key: "product-design" },
              { title: "브랜드", key: "brand" },
              { title: "리서치", key: "research" },
            ],
          },
          {
            title: "마케팅",
            key: "marketing",
            children: [
              { title: "그로스", key: "growth" },
              { title: "콘텐츠", key: "content" },
            ],
          },
        ]}
      />
    </Field>
  );
}
```

## Edge cases

- **Very deep tree (5+ levels)**: visual gets cramped. Consider Cascader instead.
- **Very wide tree at one level (50+ siblings)**: virtualize the visible nodes.
- **Async tree data**: load children on expand. Show loading state per node.
- **Search filters deeply**: ensure path-to-match is highlighted; expand intermediate ancestors.
- **Multi-select with checkbox + parent-child sync**: clicking parent checks all descendants. Half-check parent when some descendants checked.
- **Reduced motion**: skip expand/collapse animation.

## Don't

- Don't use TreeSelect when Cascader is appropriate (consistent depth, e.g., region selection).
- Don't show 1000+ flat nodes — that's a Combobox + virtualization.
- Don't auto-collapse user's manual expansions on re-open. Persist state.
- Don't omit search for trees > 20 nodes.

## References

- Ant: [`TreeSelect`](../refs/ant-design/components/tree-select)
- WAI-ARIA: [Tree pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/)

## Cross-reference

- [`examples/component-tree.md`](component-tree.md) — full-page tree
- [`examples/component-cascader.md`](component-cascader.md) — column-by-column
- [`examples/component-combobox.md`](component-combobox.md) — flat selectable
- [`examples/component-select.md`](component-select.md) — flat selectable variant
