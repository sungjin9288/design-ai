# `Layout` (page chrome) — spec

> Citing Ant Design `Layout`, MUI (composition), shadcn-ui (composition)

## Purpose

The top-level page structure: header / sidebar / main / footer. Used as the root of any standard product page. Provides slot-based composition for consistent app chrome.

## When Layout vs CSS Grid

Layout component vs CSS Grid (`grid-template-areas`): both work. The Layout component:
- Pre-defines the slots (Header, Sidebar, Content, Footer)
- Applies sticky/fixed positioning consistently
- Handles responsive collapse (sidebar → drawer on mobile)

For dashboards with a fixed shape, Layout simplifies the wiring.

## Anatomy

```
┌──────────────────────────────────────────────────┐
│ Layout.Header (sticky)                           │
├──────────┬───────────────────────────────────────┤
│          │                                        │
│ Layout.  │   Layout.Content                       │
│ Sider    │                                        │
│          │                                        │
│          │                                        │
├──────────┴───────────────────────────────────────┤
│ Layout.Footer (optional)                          │
└──────────────────────────────────────────────────┘
```

| Slot | Required | Notes |
| --- | --- | --- |
| `Layout` | yes | Root container |
| `Layout.Header` | optional | Top app bar (typically with `AppBar` inside) |
| `Layout.Sider` | optional | Sidebar nav (collapsible) |
| `Layout.Content` | yes | Main page content |
| `Layout.Footer` | optional | Footer (rare on apps; common on marketing) |

## API

```tsx
<Layout>
  <Layout.Header>
    <AppBar leading={<Logo />} actions={[...]} />
  </Layout.Header>
  <Layout>
    <Layout.Sider width={240} collapsible>
      <SideNav />
    </Layout.Sider>
    <Layout.Content>
      <PageContent />
    </Layout.Content>
  </Layout>
  <Layout.Footer>
    <SiteFooter />
  </Layout.Footer>
</Layout>
```

| Prop (Layout) | Type | Default | Description |
| --- | --- | --- | --- |
| `direction` | `"column" \| "row"` | `"column"` | Children stack vertically or horizontally |

| Prop (Sider) | Type | Default | Description |
| --- | --- | --- | --- |
| `width` | `number \| string` | `200` | Expanded width |
| `collapsedWidth` | `number` | `64` | Width when collapsed |
| `collapsible` | `boolean` | `false` | Show toggle |
| `collapsed` | `boolean` | — | Controlled |
| `defaultCollapsed` | `boolean` | `false` | |
| `breakpoint` | `string` | `"md"` | Auto-collapse below this width |
| `onCollapse` | `(collapsed) => void` | — | |
| `position` | `"left" \| "right"` | `"left"` | |

| Prop (Header / Footer) | Type | Default | Description |
| --- | --- | --- | --- |
| `position` | `"static" \| "sticky" \| "fixed"` | `"static"` | |

## Behavior

### Sider collapse

- Manual: user clicks toggle button.
- Auto-collapse: at viewport breakpoint, sider collapses to icon-only or hides entirely.
- Mobile: typically hide entirely; replace with hamburger that opens a Drawer.

### Layout nesting

You can nest `Layout` inside `Layout` to combine row + column flows:

```tsx
<Layout>          {/* column */}
  <Layout.Header />
  <Layout>        {/* row */}
    <Layout.Sider />
    <Layout.Content />
  </Layout>
</Layout>
```

This is the canonical "header + sidebar + content" pattern.

## Responsive patterns

| Viewport | Recommended layout |
| --- | --- |
| < 768 (mobile) | Header + Content; Sider hidden, opens via drawer |
| 768–1024 (tablet) | Header + collapsed Sider (icon-only) + Content |
| > 1024 (desktop) | Header + expanded Sider + Content |

Use `breakpoint="md"` on Sider for auto-collapse.

## States

The Layout component doesn't have visual states. The Sider has expanded/collapsed.

## Tokens consumed

```
--color-bg-default          (Content bg)
--color-bg-elevated         (Header, Sider bg)
--color-bg-subtle           (Footer bg)
--color-border-default      (between regions)
--color-text-primary
--space-md, --space-base
--motion-default            (Sider collapse animation)
```

## Sizes

| Region | Default size |
| --- | --- |
| Header height | 56px (mobile) / 64px (desktop) |
| Sider width | 200–280px |
| Sider collapsed | 64px |
| Footer height | 64–96px |

Content fills remaining space.

## Accessibility

- `<Layout>` renders as `<div>` (or root structural element).
- `Layout.Header` → `<header>` with `role="banner"`.
- `Layout.Sider` → `<nav>` with `aria-label="Main navigation"`.
- `Layout.Content` → `<main>` with `id="main-content"`.
- `Layout.Footer` → `<footer>` with `role="contentinfo"`.
- Provide a "Skip to main content" link before the header — keyboard users skip nav.

```html
<a href="#main-content" class="sr-only-focusable">본문으로 건너뛰기</a>
```

## Code example

```tsx
function AppLayout({ children }: Props) {
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage("sidebar-collapsed", false);

  return (
    <Layout>
      <Layout.Header position="sticky">
        <AppBar
          leading={<Logo />}
          title={<NavLinks />}
          actions={[<Notifications />, <ProfileMenu />]}
        />
      </Layout.Header>

      <Layout direction="row">
        <Layout.Sider
          width={240}
          collapsedWidth={64}
          collapsible
          collapsed={sidebarCollapsed}
          onCollapse={setSidebarCollapsed}
          breakpoint="md"
          position="left"
        >
          <SideNav collapsed={sidebarCollapsed} />
        </Layout.Sider>

        <Layout.Content>
          <a href="#main-content" className="sr-only-focusable">
            본문으로 건너뛰기
          </a>
          <main id="main-content">
            {children}
          </main>
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
```

## Don't

- Don't ship without a "Skip to main content" link.
- Don't put critical content in the Sider only — mobile users may not see it.
- Don't auto-collapse the sider on every page load — persist user preference.
- Don't omit `<main>` — accessibility requires it.

## References

- Ant Design: [`refs/ant-design/components/layout/`](../docs/reference/ant-design.md#layout) — `Layout`, `Layout.Header`, `Layout.Sider`, `Layout.Content`, `Layout.Footer`. Most exhaustive.
- MUI: no dedicated Layout — compose with `<Box>` + `<Drawer>` + `<AppBar>`.
- shadcn-ui: no built-in. Use `resizable` + custom layout.

## Cross-reference

- [`examples/component-app-bar.md`](component-app-bar.md) — fits inside Layout.Header
- [`examples/component-drawer.md`](component-drawer.md) — mobile alternative to Sider
- [`examples/component-splitter.md`](component-splitter.md) — when sider needs resize
- [`knowledge/layout/spacing-and-grid.md`](../knowledge/layout/spacing-and-grid.md) — broader layout system
