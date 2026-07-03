# `NavigationMenu` — spec

> Synthesized from shadcn-ui `navigation-menu` (Radix) and patterns from MUI / Ant menu primitives. Top-of-page horizontal navigation with optional megamenu / dropdown panels. Common in marketing sites and B2B SaaS app headers.

## When to use

- **Marketing site top nav** with Product / Solutions / Resources mega-panels.
- **SaaS app header** for top-level sections.
- **Documentation site** primary nav.

When NOT to use:
- Vertical nav contexts → `Sidebar`.
- Action menus → `DropdownMenu`.
- Mobile-only contexts → `MobileNavigation` (separate component).

## Anatomy

```
[Logo]   Product ▾   Solutions ▾   Pricing   Docs   [Sign in]
              ↓
              ┌────────────────────────────────────┐
              │ Product overview          [→]      │
              │ A platform for...                  │
              │                                    │
              │ Components       Themes            │
              │ Templates        Pricing           │
              │                                    │
              │ Featured: New design tokens       │
              └────────────────────────────────────┘
                  (mega-menu panel, hover/click triggered)
```

## API

```tsx
<NavigationMenu>
  <NavigationMenu.List>
    <NavigationMenu.Item>
      <NavigationMenu.Trigger>Product</NavigationMenu.Trigger>
      <NavigationMenu.Content>
        <ul className="grid gap-2 p-4 md:w-[500px] grid-cols-2">
          <li>
            <NavigationMenu.Link href="/components">
              <h3>Components</h3>
              <p>Pre-built primitives.</p>
            </NavigationMenu.Link>
          </li>
          <li>
            <NavigationMenu.Link href="/themes">
              <h3>Themes</h3>
              <p>Beautiful color palettes.</p>
            </NavigationMenu.Link>
          </li>
        </ul>
      </NavigationMenu.Content>
    </NavigationMenu.Item>

    <NavigationMenu.Item>
      <NavigationMenu.Link href="/pricing">Pricing</NavigationMenu.Link>
    </NavigationMenu.Item>

    <NavigationMenu.Item>
      <NavigationMenu.Link href="/docs">Docs</NavigationMenu.Link>
    </NavigationMenu.Item>
  </NavigationMenu.List>

  <NavigationMenu.Indicator /> {/* Animated underline */}
  <NavigationMenu.Viewport /> {/* Container for active panel */}
</NavigationMenu>
```

## Composition

| Part | Purpose |
| --- | --- |
| `NavigationMenu` | Wrapper |
| `List` | Horizontal list of top-level items |
| `Item` | Wrapper for a top-level entry |
| `Trigger` | Hover/click target that opens a panel |
| `Content` | Mega-menu panel content |
| `Link` | A direct navigation link (no panel) |
| `Indicator` | Animated underline / arrow pointing at active item |
| `Viewport` | Single shared container that panels animate into |

## Trigger modes

### Hover (marketing default)

Hover trigger → panel opens after 200ms. Mouse-leave → closes after 300ms (graceful).

### Click (for product apps)

Tap-or-click only. More predictable; preferred when nav has many panels.

### Mobile

NavigationMenu doesn't translate to mobile directly. On small screens:
- Collapse to a hamburger menu that opens a `Sheet`.
- Or use `MobileNavigation` (separate component).

## Mega-menu layouts

### List

```
┌─────────────────────────┐
│ Item 1                  │
│ Item 2                  │
│ Item 3                  │
│ ─────                   │
│ Featured: ...           │
└─────────────────────────┘
```

### Grid (most common)

```
┌──────────────┬──────────────┐
│ Components   │ Themes       │
│ Pre-built... │ Color...     │
├──────────────┼──────────────┤
│ Templates    │ Pricing      │
│ Starter...   │ Plans...     │
└──────────────┴──────────────┘
```

### Featured + grid

```
┌─────────────┬───────────────────┐
│             │ Components        │
│  Hero       │ Themes            │
│  Promo      │ Templates         │
│  + image    │ Pricing           │
│             │                   │
└─────────────┴───────────────────┘
```

## States

| State | Visual |
| --- | --- |
| Resting | All triggers visible, no panel |
| Trigger hover | Underline indicator slides under hovered item |
| Panel open | Content visible below; Indicator points at active trigger |
| Switching panels | Indicator slides; Content cross-fades |
| Closing | Indicator hides; Content fades |

## Animations

```
Indicator: 200ms slide between triggers (transform: translateX)
Panel: 250ms cross-fade + slight slide (translateY -4px → 0)
Reduced motion: instant
```

## Tokens consumed

```
--color-bg-default
--color-fg-default
--color-fg-muted              (panel description text)
--color-bg-overlay             (panel bg)
--color-bg-overlay-hover       (panel item hover)
--color-brand-default          (active indicator)
--color-border-default
--radius-md
--shadow-overlay
--space-md, --space-lg
--font-size-base
--font-weight-medium
--motion-medium                (panel transition)
--ease-out
--z-overlay
```

## Accessibility

- Wrapper: `<nav aria-label="Main">`.
- List: `<ul role="menubar">`.
- Item: `<li>` containing either `<NavigationMenu.Trigger>` or `<NavigationMenu.Link>`.
- Trigger: `<button aria-haspopup="true" aria-expanded="...">`.
- Content: `role="menu"` (or just rendered list).
- Active page: `aria-current="page"` on the corresponding link.
- Keyboard:
  - Tab moves between top-level items.
  - Enter / Space on Trigger opens panel; arrows navigate within panel.
  - Esc closes panel.
- For touch: hover doesn't fire; panels open on tap (close on second tap of same trigger or outside).

## Mobile fallback pattern

```tsx
function ResponsiveNav() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  if (isDesktop) {
    return <NavigationMenu>...</NavigationMenu>;
  }

  return (
    <Sheet>
      <Sheet.Trigger asChild>
        <Button variant="ghost"><MenuIcon /></Button>
      </Sheet.Trigger>
      <Sheet.Content side="right">
        <MobileNavList items={navItems} />
      </Sheet.Content>
    </Sheet>
  );
}
```

## Code example (marketing site)

```tsx
function MarketingHeader() {
  return (
    <header className="site-header">
      <Logo />

      <NavigationMenu>
        <NavigationMenu.List>
          <NavigationMenu.Item>
            <NavigationMenu.Trigger>Product</NavigationMenu.Trigger>
            <NavigationMenu.Content>
              <div className="mega-grid">
                <div className="featured">
                  <Image src="/hero.jpg" alt="" />
                  <h3>What's new</h3>
                  <p>v3.2 just shipped — explore the spatial design domain.</p>
                  <a href="/changelog">See changelog →</a>
                </div>
                <ul className="links">
                  <li><a href="/components">Components</a></li>
                  <li><a href="/themes">Themes</a></li>
                  <li><a href="/templates">Templates</a></li>
                </ul>
              </div>
            </NavigationMenu.Content>
          </NavigationMenu.Item>

          <NavigationMenu.Item>
            <NavigationMenu.Link href="/pricing">Pricing</NavigationMenu.Link>
          </NavigationMenu.Item>

          <NavigationMenu.Item>
            <NavigationMenu.Link href="/docs">Docs</NavigationMenu.Link>
          </NavigationMenu.Item>
        </NavigationMenu.List>

        <NavigationMenu.Indicator />
        <NavigationMenu.Viewport />
      </NavigationMenu>

      <div className="actions">
        <a href="/login">Sign in</a>
        <Button asChild><a href="/signup">Sign up</a></Button>
      </div>
    </header>
  );
}
```

## Edge cases

- **Single-item nav** (only one trigger): NavigationMenu is overkill. Just use a button.
- **Trigger with active sub-route**: highlight Trigger when child route active (`aria-current="true"` if any descendant link matches current URL).
- **Mega-panel taller than viewport**: cap height; scroll inside panel.
- **Panel with images**: lazy-load; image-loading shouldn't block panel paint.
- **Hover into panel from trigger**: panel must remain open during hover-traversal; use `closeDelay`.
- **Mobile breakpoint switch mid-session**: re-render with appropriate component.
- **RTL**: flip indicator direction + alignment.

## Don't

- Don't use NavigationMenu for in-app navigation when a Sidebar is more appropriate. Top nav for marketing-feel + flat sites; sidebar for app-shell.
- Don't pack 7+ top-level items. Group via mega-menu or rethink IA.
- Don't ship without a mobile fallback. Top nav doesn't work on phones.
- Don't omit `aria-current` on active links.
- Don't have hover-only triggers on touch devices.
- Don't disable Esc to close panels.

## References

- shadcn-ui: [`navigation-menu`](../docs/reference/shadcn-ui.md#navigation-menu) (Radix)
- Patterns: Stripe, Linear, Vercel marketing nav

## Cross-reference

- [`examples/component-sidebar.md`](component-sidebar.md) — vertical nav
- [`examples/component-app-bar.md`](component-app-bar.md) — top app bar
- [`examples/component-sheet.md`](component-sheet.md) — mobile fallback
- [`knowledge/patterns/mobile-navigation.md`](../knowledge/patterns/mobile-navigation.md)
- [`knowledge/patterns/landing-hero-design.md`](../knowledge/patterns/landing-hero-design.md)
