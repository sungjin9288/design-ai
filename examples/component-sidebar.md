# `Sidebar` — spec

> Synthesized from shadcn-ui `sidebar` (the flagship Radix-based primitive). A persistent navigation panel — collapsible, themed, often the primary nav surface in dashboards / docs sites / IDE-style apps.

## When to use Sidebar vs Drawer

| | Sidebar | Drawer |
| --- | --- | --- |
| Persistence | Always visible (collapsible) | Modal or persistent; usually toggled |
| Use | Primary navigation in apps | Secondary nav, mobile-only nav |
| Desktop | Standard | Sometimes overkill |
| Mobile | Becomes a sheet | Full-screen takeover |

## Anatomy

```
┌────────────┬───────────────────────────┐
│ [logo]     │                           │
│ ──────     │                           │
│ Header     │                           │
│            │                           │
│ Workspace  │                           │
│  ▶ Project │      Main content         │
│    Inbox   │                           │
│    Tasks   │                           │
│            │                           │
│ Settings   │                           │
│ ──────     │                           │
│ [user]     │                           │
└────────────┴───────────────────────────┘
       ↑
   Sidebar
```

## API

```tsx
<Sidebar>
  <Sidebar.Header>
    <Logo />
    <WorkspaceSwitcher />
  </Sidebar.Header>

  <Sidebar.Content>
    <Sidebar.Group>
      <Sidebar.GroupLabel>Workspace</Sidebar.GroupLabel>
      <Sidebar.Menu>
        <Sidebar.MenuItem>
          <Sidebar.MenuButton href="/projects" active>
            <FolderIcon /> Projects
          </Sidebar.MenuButton>
          <Sidebar.MenuSub>
            <Sidebar.MenuSubItem href="/projects/active">Active</Sidebar.MenuSubItem>
            <Sidebar.MenuSubItem href="/projects/archive">Archive</Sidebar.MenuSubItem>
          </Sidebar.MenuSub>
        </Sidebar.MenuItem>
        <Sidebar.MenuItem>
          <Sidebar.MenuButton href="/inbox">
            <InboxIcon /> Inbox
            <Sidebar.MenuBadge>12</Sidebar.MenuBadge>
          </Sidebar.MenuButton>
        </Sidebar.MenuItem>
      </Sidebar.Menu>
    </Sidebar.Group>
  </Sidebar.Content>

  <Sidebar.Footer>
    <UserMenu />
  </Sidebar.Footer>
</Sidebar>

<SidebarTrigger /> {/* in main content header — toggles sidebar */}
```

## Composition

| Part | Purpose |
| --- | --- |
| `Sidebar` | Wrapper |
| `Header` | Top section (logo, workspace switcher) |
| `Content` | Scrollable middle (groups + menus) |
| `Footer` | Bottom section (user menu, settings) |
| `Group` | Logical section |
| `GroupLabel` | Section heading |
| `Menu` | List of items |
| `MenuItem` | Single item wrapper |
| `MenuButton` | Clickable item |
| `MenuSub` | Nested sub-menu (collapsible) |
| `MenuSubItem` | Sub-menu item |
| `MenuBadge` | Count / indicator on menu item |
| `MenuAction` | Right-aligned secondary action (e.g., "More" menu) |
| `Separator` | Visual divider |
| `Trigger` | Renders elsewhere; toggles sidebar |

## States

| State | Visual |
| --- | --- |
| Expanded (default desktop) | Full width with labels |
| Collapsed (icon-only) | ~64px width; only icons visible |
| Mobile (offcanvas) | Off-screen by default; opens as Sheet on trigger |
| Item active | Highlighted bg + brand-color indicator |
| Item hover | Subtle bg shift |
| Sub-menu collapsed | Hidden, parent item shows chevron |
| Sub-menu expanded | Items revealed, parent chevron rotated |

## Variants

### Width modes

```tsx
<Sidebar variant="sidebar" />      // standard fixed
<Sidebar variant="floating" />     // detached, with shadow
<Sidebar variant="inset" />        // inset within rounded shell
```

### Collapsibility

```tsx
<Sidebar collapsible="offcanvas" />  // mobile-style: slides off-canvas
<Sidebar collapsible="icon" />       // collapses to icon-only
<Sidebar collapsible="none" />       // always full width
```

### Side

```tsx
<Sidebar side="left" />   // default
<Sidebar side="right" />  // for tools / settings panels
```

## Responsive behavior

```
Desktop (≥ 1024px):
  Expanded → user can collapse to icon mode

Tablet (768-1023px):
  Default to icon mode → user can expand

Mobile (< 768px):
  Offcanvas → invisible until trigger; opens as Sheet

```

State persists in localStorage so collapse preference survives sessions.

## Tokens consumed

```
--sidebar-width                  (default 16rem / 256px)
--sidebar-width-icon             (collapsed; default 4rem / 64px)
--sidebar-bg                     (sidebar background, slightly different from main)
--sidebar-fg                     (text)
--sidebar-fg-muted               (group labels)
--sidebar-item-hover-bg
--sidebar-item-active-bg
--sidebar-item-active-fg
--sidebar-border                 (right border)
--space-xs, --space-sm, --space-md
--motion-medium                  (collapse animation)
--ease-out
--z-fixed                        (when fixed-position)
```

shadcn names them `--sidebar-*` so they don't conflict with main app theme.

## Accessibility

- Sidebar: `<aside aria-label="Main navigation">`.
- Active item: `aria-current="page"` (not just visual).
- Menu: `<ul>` semantically; items as `<li>`.
- MenuButton: real `<a>` for nav links, `<button>` for actions.
- Sub-menus: `aria-expanded` on parent toggle, `aria-controls` referencing sub-menu id.
- Collapsed icon-only mode: each icon button needs `aria-label` (e.g., `<button aria-label="Inbox">`).
- Mobile offcanvas: opens as Sheet with focus trap.
- Keyboard: Tab navigates items; arrow keys can navigate within menu (optional, depends on design).

## Code example

```tsx
function AppShell({ children }: Props) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <Sidebar.Header>
          <Logo />
        </Sidebar.Header>
        <Sidebar.Content>
          <Sidebar.Group>
            <Sidebar.GroupLabel>Workspace</Sidebar.GroupLabel>
            <Sidebar.Menu>
              {workspaceItems.map(item => (
                <Sidebar.MenuItem key={item.path}>
                  <Sidebar.MenuButton href={item.path} active={pathname === item.path}>
                    <item.icon />
                    <span>{item.label}</span>
                    {item.count && <Sidebar.MenuBadge>{item.count}</Sidebar.MenuBadge>}
                  </Sidebar.MenuButton>
                </Sidebar.MenuItem>
              ))}
            </Sidebar.Menu>
          </Sidebar.Group>
        </Sidebar.Content>
        <Sidebar.Footer>
          <UserMenu />
        </Sidebar.Footer>
      </Sidebar>

      <main>
        <header>
          <SidebarTrigger />
          <h1>{pageTitle}</h1>
        </header>
        {children}
      </main>
    </SidebarProvider>
  );
}
```

## Korean apps

- Sidebar 너비: 한글 메뉴는 영문보다 약간 더 넓은 너비가 필요 (typically 18rem instead of 16rem).
- Group label: 한글 ("워크스페이스", "관리") works well; keep concise.
- Active item indicator: 좌측 색상 막대 + 배경 강조; classic KR enterprise pattern.

## Edge cases

- **Long item labels**: truncate with ellipsis; show full text in tooltip on hover.
- **Many items (50+)**: scroll inside Content; pin Header + Footer.
- **Nested too deep**: 3+ levels = navigation pain. Cap at 2 levels.
- **Sidebar in nested layouts**: only one Sidebar per layout root; nested sidebars indicate over-decomposition.
- **Cross-tab sync**: collapse state via localStorage works across tabs after refresh.
- **Reduced motion**: skip collapse animation; instant width change.
- **Right-to-left**: `side="right"` becomes `left`; borders swap.

## Don't

- Don't omit collapse on icon mode for desktop — power users need it.
- Don't put non-navigation items (status, ads) in Sidebar — that's main content territory.
- Don't lock to one width; respect collapse preference.
- Don't omit `aria-current="page"` on active items.
- Don't put 30 ungrouped items — use Group + GroupLabel.
- Don't overload icon-only mode with no tooltip — users see only icons.

## References

- shadcn-ui: [`sidebar`](../refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/sidebar.tsx) — flagship primitive
- Patterns: VS Code, Linear, Notion sidebars

## Cross-reference

- [`examples/component-drawer.md`](component-drawer.md) — modal nav alternative
- [`examples/component-sheet.md`](component-sheet.md) — mobile offcanvas variant
- [`examples/component-navigation-menu.md`](component-navigation-menu.md) — top nav alternative
- [`knowledge/patterns/mobile-navigation.md`](../knowledge/patterns/mobile-navigation.md)
