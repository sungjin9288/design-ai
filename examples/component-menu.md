# `Menu` — spec

> Synthesized from Ant Design `Menu`. The structured navigation menu primitive — distinct from `DropdownMenu` (action overlay), `NavigationMenu` (top horizontal), and `Sidebar` (app shell).

## When to use

- Sidebar navigation menu with hierarchical items + active state.
- App-level navigation rendered as a vertical or horizontal menu.
- As an alternative to `Sidebar` for simpler app shells.

When NOT to use:
- Triggered popup of actions → `DropdownMenu`.
- Marketing top nav with mega-menus → `NavigationMenu`.
- Persistent collapsible sidebar → `Sidebar`.

## Anatomy

```
┌─────────────────────────┐
│ ▶ Dashboard              │
│ ▼ Workspace             │
│   ▶ Projects             │
│   ▶ Members              │
│   ▶ Settings             │
│ ▶ Inbox                  │
│ ▶ Help                  │
└─────────────────────────┘
```

## API

```tsx
<Menu mode="vertical" selected={["projects"]} onSelect={onSelect}>
  <Menu.Item key="dashboard" icon={<HomeIcon />}>
    Dashboard
  </Menu.Item>
  <Menu.SubMenu key="workspace" icon={<FolderIcon />} title="Workspace">
    <Menu.Item key="projects">Projects</Menu.Item>
    <Menu.Item key="members">Members</Menu.Item>
    <Menu.Item key="settings">Settings</Menu.Item>
  </Menu.SubMenu>
  <Menu.Item key="inbox" icon={<InboxIcon />}>
    Inbox
  </Menu.Item>
</Menu>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `mode` | `"vertical" \| "horizontal" \| "inline"` | `"vertical"` | Layout |
| `selected` | `string[]` | controlled | Active item keys |
| `onSelect` | `(key: string) => void` | — | Selection callback |
| `expanded` | `string[]` | controlled | Open SubMenu keys |
| `onExpandChange` | `(keys: string[]) => void` | — | SubMenu toggle |
| `theme` | `"light" \| "dark"` | `"light"` | Color scheme |

## Composition

| Part | Purpose |
| --- | --- |
| `Menu` | Outer wrapper |
| `Item` | Single menu item |
| `SubMenu` | Group with nested items (collapsible) |
| `ItemGroup` | Visual grouping with heading |
| `Divider` | Visual separator |

## Modes

### `vertical` (default)

Sidebar-style. Items stacked top-to-bottom.

### `horizontal`

Top-nav style. Items in a row.

### `inline` (with collapsibles)

Like `vertical` but SubMenus expand inline (push items below). Vs vertical's pop-out submenu.

## States

| State | Visual |
| --- | --- |
| Default | Standard text + icon |
| Hover | Bg shift |
| Selected (active) | Brand-color highlight + indicator |
| Disabled | Reduced opacity |
| Submenu collapsed | Chevron right; no children visible |
| Submenu expanded | Chevron down; children visible |

## Tokens consumed

```
--menu-bg                          (light or dark)
--menu-fg
--menu-fg-muted                    (group headings)
--menu-bg-hover
--menu-bg-active                   (selected)
--menu-fg-active
--menu-active-indicator            (left-border or bg)
--menu-divider
--space-sm, --space-md
--motion-fast
```

## Accessibility

- `<nav aria-label="Main">` outer.
- `<ul role="menu">` items list.
- `<li role="menuitem">` each item.
- Submenu trigger: `aria-expanded` + `aria-haspopup`.
- Active item: `aria-current="page"` (for nav links).
- Keyboard: Tab navigates; arrow keys within (configurable); Enter/Space activates.

## Korean apps

- 메뉴 항목: 홈 / 워크스페이스 / 받은편지함 / 도움말 / 설정 (typical ordering)
- Active state visualization: left-border 색상 막대 + 배경 강조 (KR enterprise convention)
- 합쇼체 / 해요체 not relevant (menu items are nouns)

## Don't

- Don't use Menu for action overlays. Use DropdownMenu.
- Don't use Menu for marketing nav. Use NavigationMenu.
- Don't omit `aria-current` on the active item.
- Don't pile up 4+ levels of nested SubMenu. Flatten or refactor.

## References

- Ant: [`Menu`](../refs/ant-design/components/menu)
- WAI-ARIA: Menu pattern (different from menubar)

## Cross-reference

- [`examples/component-dropdown.md`](component-dropdown.md) — overlay action menu
- [`examples/component-navigation-menu.md`](component-navigation-menu.md) — marketing nav
- [`examples/component-sidebar.md`](component-sidebar.md) — app shell sidebar
- [`examples/component-menubar.md`](component-menubar.md) — desktop File/Edit/View
