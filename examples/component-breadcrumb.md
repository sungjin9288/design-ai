# `Breadcrumb` — spec

> Citing Ant Design `Breadcrumb`, MUI `Breadcrumbs`, shadcn-ui `breadcrumb`

## Purpose

Shows the user's location in a hierarchy. Each segment is a navigable ancestor, except the last (current page).

## When NOT to use

- Single-level apps (no hierarchy to show).
- Mobile-first apps where the back button is the primary nav metaphor (Korean consumer apps especially — breadcrumb is rare on KR mobile).
- Linear flows (use a stepper / progress, not breadcrumbs).

Breadcrumbs are a **desktop / web-app** pattern. Use sparingly on mobile.

## Anatomy

```
Home  /  Projects  /  Aurora  /  Settings
 ↑       ↑              ↑           ↑
 link    link           link        current (not a link, bold)
```

Or with more visual breathing room:

```
🏠 Home  ›  📁 Projects  ›  Aurora  ›  Settings
```

| Slot | Required | Notes |
| --- | --- | --- |
| Crumb (link) | yes (≥ 1) | Each ancestor — clickable |
| Separator | yes | `/`, `›`, `→`, or chevron icon |
| Current crumb | yes | Last item — not a link, marked with `aria-current="page"` |
| Icon (per crumb) | optional | Home icon, folder icon for context |
| Truncation indicator | optional | `…` when path is long |

## API

```tsx
<Breadcrumb>
  <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
  <Breadcrumb.Item href="/projects">Projects</Breadcrumb.Item>
  <Breadcrumb.Item href="/projects/aurora">Aurora</Breadcrumb.Item>
  <Breadcrumb.Item current>Settings</Breadcrumb.Item>
</Breadcrumb>
```

Or imperative:

```tsx
<Breadcrumb
  items={[
    { label: "Home", href: "/" },
    { label: "Projects", href: "/projects" },
    { label: "Aurora", href: "/projects/aurora" },
    { label: "Settings", current: true },
  ]}
  separator="/"
  maxItems={6}
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `BreadcrumbItem[]` | — | (Imperative API) |
| `separator` | `string \| ReactNode` | `"/"` | Between items |
| `maxItems` | `number` | `8` | When exceeded, collapse middle items into `…` |
| `itemsBeforeCollapse` | `number` | `1` | How many items to show at the start when collapsed |
| `itemsAfterCollapse` | `number` | `1` | How many at the end |

```tsx
type BreadcrumbItem = {
  label: string | ReactNode;
  href?: string;
  icon?: ReactNode;
  onClick?: () => void;
  current?: boolean;
};
```

## Truncation behavior

When `items.length > maxItems`:

```
Home / ... / Aurora / Settings
```

Click on `…` to expand (popover with the hidden items) or just hover to peek.

For very long path with smaller `maxItems`:
- Show first 1, ellipsis, last 2 by default.
- `itemsBeforeCollapse=1, itemsAfterCollapse=2` for typical web app.

## Sizes

| Size | Font | Spacing between |
| --- | --- | --- |
| `sm` | 12px | 4px |
| `md` (default) | 13–14px | 8px |
| `lg` | 16px | 12px |

Default to `md` for desktop, `sm` for dense admin tools.

## States

| State | Visual |
| --- | --- |
| Default link | `--color-text-secondary`, no underline |
| Hover | `--color-text-primary`, underline |
| Focus-visible | 2px ring around the link |
| Current (last item) | `--color-text-primary`, **bold** weight |
| Disabled | Grayed out, no events (rare) |

The current item is **never** a link. It's where the user is.

## Tokens consumed

```
--color-text-primary
--color-text-secondary
--color-text-tertiary           (separator)
--space-xs, --space-sm
--font-size-sm, --font-size-base
--font-weight-medium             (current item bold)
--color-focus-ring
```

## Accessibility

- Wrap in `<nav aria-label="Breadcrumb">`.
- Render as `<ol>` (ordered list — semantically correct because the order matters).
- Each item is `<li>`.
- Each link is `<a>` (or router-Link). The current item is just text — **not a disabled link**.
- Current item: `aria-current="page"`.
- Don't put separators in the same `<a>` as the link text — separators should be `aria-hidden="true"` on the parent `<li>` or on a separate visual element.

```html
<nav aria-label="Breadcrumb">
  <ol>
    <li><a href="/">Home</a></li>
    <li aria-hidden="true">/</li>
    <li><a href="/projects">Projects</a></li>
    <li aria-hidden="true">/</li>
    <li aria-current="page">Settings</li>
  </ol>
</nav>
```

### Keyboard

- `Tab` reaches each link in order.
- `Enter` activates link.
- Separators are not focusable.

## Code example

```tsx
// Basic
<Breadcrumb>
  <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
  <Breadcrumb.Item href="/products">Products</Breadcrumb.Item>
  <Breadcrumb.Item current>Wireless Mouse</Breadcrumb.Item>
</Breadcrumb>

// With router (Next.js / React Router)
<Breadcrumb>
  <Breadcrumb.Item asChild><Link href="/">Home</Link></Breadcrumb.Item>
  <Breadcrumb.Item asChild><Link href="/products">Products</Link></Breadcrumb.Item>
  <Breadcrumb.Item current>Wireless Mouse</Breadcrumb.Item>
</Breadcrumb>

// With icons
<Breadcrumb>
  <Breadcrumb.Item href="/" icon={<HomeIcon />}>Home</Breadcrumb.Item>
  <Breadcrumb.Item href="/projects" icon={<FolderIcon />}>Projects</Breadcrumb.Item>
  <Breadcrumb.Item current>Aurora</Breadcrumb.Item>
</Breadcrumb>

// Truncation
<Breadcrumb maxItems={4} itemsBeforeCollapse={1} itemsAfterCollapse={2}>
  <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
  <Breadcrumb.Item href="/level1">Level 1</Breadcrumb.Item>
  <Breadcrumb.Item href="/level1/level2">Level 2</Breadcrumb.Item>
  <Breadcrumb.Item href="/level1/level2/level3">Level 3</Breadcrumb.Item>
  <Breadcrumb.Item href="/level1/level2/level3/level4">Level 4</Breadcrumb.Item>
  <Breadcrumb.Item current>Current</Breadcrumb.Item>
</Breadcrumb>
{/* Renders: Home / ... / Level 4 / Current */}
```

## Edge cases

- **Long path that wraps to two lines**: don't wrap by default; truncate via `maxItems`. If wrapping is needed, it's a sign the hierarchy is too deep.
- **Crumb labels longer than 30 chars**: truncate individual labels with `…`, full text in `title`.
- **Dynamically loaded labels** (URL has IDs, real names load async): show ID or "Loading..." in the meantime; replace with real name. Don't shift width drastically.
- **Mobile**: can collapse to "← Back" link on narrow screens, or hide entirely.
- **RTL**: separator direction flips (`›` becomes `‹`). Use a directional character or two icons.
- **Korean labels**: Korean breadcrumbs work cleanly. Common: "홈 / 프로젝트 / Aurora / 설정".
- **No URL** (current page is not addressable): only the last item shows; previous crumbs may or may not be present.

## Don't

- Don't make the current page a link to itself. It's a no-op + bad a11y.
- Don't use breadcrumbs as the only navigation. They supplement, not replace, sidebars/menus.
- Don't show breadcrumbs on top-level pages (no hierarchy).
- Don't include "more menus" in breadcrumb dropdowns. Keep them flat — collapsed-items popover is the only complex pattern.
- Don't put filters or actions in breadcrumbs.
- Don't use breadcrumbs for chronological steps (signup step 2 of 4) — that's a stepper.

## References

- Ant Design: [`refs/ant-design/components/breadcrumb/`](../docs/reference/ant-design.md#breadcrumb) — `Breadcrumb` + `Breadcrumb.Item` + `Breadcrumb.Separator`. `itemRender` for custom rendering.
- MUI: [`refs/mui/packages/mui-material/src/Breadcrumbs/`](../docs/reference/mui.md#breadcrumbs) — `Breadcrumbs` (note plural) with `separator`, `maxItems`, `itemsBeforeCollapse`, `itemsAfterCollapse`. Built-in collapse logic.
- shadcn-ui: [`refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/breadcrumb.tsx`](../docs/reference/shadcn-ui.md#breadcrumb) — primitive: `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator`, `BreadcrumbEllipsis`. Most flexible.

## Cross-reference

- [knowledge/patterns/mobile-navigation.md](../knowledge/patterns/mobile-navigation.md) — mobile prefers back button over breadcrumb
- [knowledge/a11y/keyboard-and-focus.md](../knowledge/a11y/keyboard-and-focus.md)
