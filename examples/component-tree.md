# `Tree` (TreeView) — spec

> Citing Ant Design `Tree`, MUI `TreeView` (X package), shadcn-ui (no built-in)

## Purpose

Hierarchical data with expandable nodes. Used for: file explorers, organization charts, category trees, taxonomy editors, navigation sidebars with nested sections.

## When Tree vs alternatives

| Pattern | Use |
| --- | --- |
| **Tree** | True parent-child hierarchy with arbitrary depth |
| **Accordion** | Two-level grouping where the inner items are flat |
| **Cascader / multi-level select** | Picking ONE leaf from a hierarchy |
| **Nested list** | Display-only hierarchy, no expand/collapse |
| **Sidebar nav** | Fixed structure (≤ 2 levels usually) |

Use Tree when nodes can be expanded/collapsed, possibly selected, possibly draggable.

## Anatomy

```
▾ 📁 Root
  ▾ 📁 Folder 1
    📄 file-a.tsx
    📄 file-b.tsx
  ▸ 📁 Folder 2
  ▸ 📁 Folder 3
▸ 📁 Archived
```

| Slot | Required | Notes |
| --- | --- | --- |
| Expand toggle | yes | Chevron `▸` / `▾` (rotates on expand) |
| Icon | optional | Folder / file / custom |
| Label | yes | Node display name |
| Trailing meta | optional | Count, badge, actions on hover |
| Indent | yes | Per depth level (typically 16–20px) |

## API

```tsx
<Tree
  data={treeData}
  selectedKeys={selected}
  onSelect={setSelected}
  expandedKeys={expanded}
  onExpand={setExpanded}
  multiSelect={false}
  draggable
/>

// where treeData is:
type TreeNode = {
  key: string;
  label: ReactNode;
  icon?: ReactNode;
  children?: TreeNode[];
  disabled?: boolean;
  isLeaf?: boolean;        // override (children may exist but not visible — async load)
  meta?: ReactNode;
};
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `data` | `TreeNode[]` | — | Hierarchical data |
| `selectedKeys` | `string[]` | `[]` | Selected node keys |
| `onSelect` | `(keys, node) => void` | — | |
| `expandedKeys` | `string[]` | computed | Open nodes |
| `onExpand` | `(keys) => void` | — | |
| `defaultExpandedKeys` | `string[]` | `[]` | Initial open |
| `defaultExpandAll` | `boolean` | `false` | Expand everything on mount |
| `multiSelect` | `boolean` | `false` | Allow multiple selection (Ctrl/Shift modifiers) |
| `checkable` | `boolean` | `false` | Render checkboxes on each node |
| `checkedKeys` | `string[]` | `[]` | Checked items (with checkable) |
| `onCheck` | `(keys, info) => void` | — | |
| `searchable` | `boolean` | `false` | Render search input above; auto-expands matching paths |
| `searchValue` | `string` | — | Controlled search |
| `draggable` | `boolean` | `false` | Drag-and-drop reordering |
| `onDrop` | `(info) => void` | — | |
| `loadData` | `(node) => Promise<TreeNode[]>` | — | Async lazy-load children on expand |
| `density` | `"compact" \| "comfortable"` | `"comfortable"` | |
| `showLine` | `boolean` | `false` | Render guide lines connecting parent → children |

## Modes — selection vs check

| Mode | Use |
| --- | --- |
| **Selection** (`onSelect`) | Pick a single (or with multiSelect: multiple) node — file explorer "open this file" |
| **Check** (`checkable: true`) | Check sub-trees — permission editor "include these folders" |

You can combine — Tree with selectable nodes + checkboxes, but it's heavy. Pick one as primary.

### Check semantics

When `checkable`:
- Checking a parent checks all descendants.
- Unchecking a parent unchecks all descendants.
- Children with mixed states → parent shows **indeterminate** (─).
- "Strictly mode" (independent parent/child checks): set `checkStrictly={true}` for permission editors that need this.

## Behavior

### Expand / collapse

- Click chevron: toggle expand for that node.
- Click label: select (don't expand). Chevron handles expand.
- Some products: double-click label to expand. Convention.

### Single selection

- Click a node: select. Highlights row.
- Click again: deselect (or stays — depends on UX).

### Multi-selection

- `Ctrl+click` (or `Cmd`): toggle individual.
- `Shift+click`: select range from last selected to clicked.
- `Click` (no modifier): replace selection with single.

### Async lazy-load

When `loadData` is set, expanding a node fetches its children:

```tsx
<Tree
  data={treeData}
  loadData={async (node) => {
    const children = await api.fetchChildren(node.key);
    return children;
  }}
/>
```

Show spinner on the expanding node while fetching. Cache results — don't re-fetch on subsequent expands of the same node (unless explicitly invalidated).

### Search

Filter the tree by label. Auto-expand paths containing matches. Highlight matched substring.

When all matches in a subtree, that path is fully expanded. Other paths collapse.

```
search: "minji"

▾ 📁 Root
  ▾ 📁 Team
    👤 김**민지** (matched)
  📁 Archived (collapsed — no matches inside)
```

## States — per node

| State | Visual |
| --- | --- |
| Default | Resting |
| Hover | Bg `--color-bg-subtle` |
| Selected | Bg `--color-primary-subtle-bg`, text `--color-primary-default` |
| Focus-visible | 2px ring on row |
| Loading (async) | Spinner replacing chevron |
| Disabled | Muted, no events |
| Drag-over (drop target) | Highlighted top/bottom border (insert above/below) or whole row (insert into) |

## Sizes / density

| Density | Row height | Indent per level |
| --- | --- | --- |
| `compact` | 24px | 16px |
| `comfortable` (default) | 32px | 20px |

For deep trees (10+ levels): `compact` is often the only readable choice. Render scrollable container.

## Tokens consumed

```
--color-bg-default
--color-bg-subtle              (hover)
--color-primary-subtle-bg       (selected)
--color-primary-default         (selected text, indeterminate check)
--color-text-primary
--color-text-secondary          (icon, secondary meta)
--color-text-tertiary           (chevron when collapsed)
--color-border-default          (drop indicator, guide lines)
--color-focus-ring
--space-xs, --space-sm
--font-size-sm, --font-size-base
--motion-fast                   (chevron rotate)
```

## Accessibility — WAI-ARIA Tree pattern

This is one of the more complex a11y patterns. Use Radix/Headless or a battle-tested primitive.

### ARIA structure

- `role="tree"` on the container.
- Each node: `role="treeitem"`, `aria-expanded={true|false|undefined}` (undefined for leaves), `aria-level={n}`, `aria-setsize={count}`, `aria-posinset={index}`.
- Selected: `aria-selected="true"`.
- Children container: `role="group"`.

### Keyboard

| Key | Behavior |
| --- | --- |
| `Tab` | Reach the tree (single tab stop) |
| `↓` / `↑` | Move focus to next / previous visible node |
| `→` | Expand if collapsed; if expanded, move to first child |
| `←` | Collapse if expanded; if leaf, move to parent |
| `Home` / `End` | First / last visible node |
| `Enter` / `Space` | Select / toggle check |
| `*` (asterisk) | Expand all siblings of focused node |
| Type-ahead | Jump to first node starting with typed character |

This is **the** WAI-ARIA tree pattern. Don't reinvent. Implement exactly.

### Screen reader

Announce on movement:
- Position: "node 2 of 5"
- Level: "level 2"
- Expansion state: "expanded" / "collapsed"
- Selection: "selected"

## Code example

```tsx
// File explorer
<Tree
  data={fileTree}
  selectedKeys={openFile ? [openFile.key] : []}
  onSelect={(keys, { node }) => setOpenFile(node.isLeaf ? node : null)}
  defaultExpandedKeys={["root"]}
  showLine
/>

// Permission editor with checkable
<Tree
  data={permissionTree}
  checkable
  checkedKeys={selectedPermissions}
  onCheck={setSelectedPermissions}
/>

// Async lazy-load
<Tree
  data={initialTree}
  loadData={async (node) => api.getChildren(node.key)}
/>

// Searchable team directory
<Tree
  data={orgTree}
  searchable
  searchValue={query}
  onSelect={(keys, { node }) => navigate(`/people/${node.key}`)}
/>
```

## Edge cases

- **Very deep trees (20+ levels)**: indent overflow horizontally. Allow horizontal scroll OR use breadcrumbs at the top showing path.
- **Many siblings (1000+)**: virtualize. Standard Tree libraries (react-arborist, MUI X TreeView) support virtualization.
- **Async load fails**: show retry inline next to the node. Don't blow up the whole tree.
- **Loading parent that already has children**: re-fetch silently OR ignore (depends on whether children are stale).
- **Drag-and-drop**: provide visual cues (drop indicator), prevent dropping a node into its own descendant.
- **Mobile**: tree UIs are often broken on touch — small targets, no hover. Switch to a drill-in list pattern (each level is its own screen with breadcrumb).
- **Empty tree**: render an empty state (see [`empty-states.md`](../knowledge/patterns/empty-states.md)).
- **Korean tree labels**: usually short (3–10 chars per node). Hangul renders cleanly at compact density.

## Don't

- Don't render a tree with no expand/collapse if all data is always visible. Use a list.
- Don't use a tree for navigation if depth > 3. The user gets lost.
- Don't auto-expand-all on mount for large trees (perf + visual chaos).
- Don't combine selection + multiselect + check + drag in one tree without strong UX. Pick the modes.
- Don't forget keyboard nav. Tree without arrow keys is broken.
- Don't put long labels that wrap. Truncate with title attribute.
- Don't use trees on mobile without testing the drill-in alternative.

## References

- Ant Design: [`refs/ant-design/components/tree/`](../docs/reference/ant-design.md#tree) — `Tree` with `Tree.DirectoryTree` for file-style. Most exhaustive (drag-drop, async, search, virtual). Heavy.
- MUI: `@mui/x-tree-view` (separate package) — `RichTreeView` (declarative), `SimpleTreeView` (composition). Excellent a11y.
- shadcn-ui: no built-in. Compose from primitives + headless library (react-arborist or @aria-tree).

API choices made:
- **`data` driven prop** (not children composition): trees are usually data-driven from API; declarative API matches.
- **`selectedKeys` + `checkedKeys` separate**: select and check are different semantics (selection = "current pointer", check = "included in operation").
- **`loadData` for async**: matches Ant's convention; explicit promise return is clearer than callbacks.

## Cross-reference

- [`knowledge/a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md) — tree keyboard contract
- [`knowledge/patterns/list-and-feed.md`](../knowledge/patterns/list-and-feed.md) — when flat list is enough
- [WAI-ARIA Tree Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/)
