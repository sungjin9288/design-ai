# `DocPage` (full doc page layout) — spec

> The canonical layout for a single documentation page. Header + sidebar + body + right TOC + footer. Shipped by most doc-site frameworks (Docusaurus, Nextra, Mintlify, GitBook).

## Purpose

Standard layout for documentation sites. Differs from product app `Layout` ([`component-layout.md`](component-layout.md)) — DocPage is optimized for reading prose.

## Anatomy

```
┌────────────────────────────────────────────────────────────────────┐
│ [Brand]  [Search Cmd+K]  [Versions] [GitHub] [Theme]               │  ← top bar
├──────────────┬─────────────────────────────────────────┬───────────┤
│              │ Breadcrumb · Updated 2026-05-08          │           │
│ Sidebar nav  │                                          │ TOC       │
│              │ # Title                                  │           │
│ ▸ Section A  │                                          │ ▸ Anatomy │
│   ▸ Page 1   │ Lede paragraph (2 sentences).            │ ▸ API     │
│   ● Page 2   │                                          │ ▸ States  │
│ ▸ Section B  │ ## Anatomy                               │ ▸ Examples│
│              │ ...                                      │           │
│              │                                          │           │
│              │ ## API                                   │           │
│              │ ...                                      │           │
│              │                                          │           │
│              │ ── Prev / Next ───────────────────────── │           │
│              │ "Edit this page on GitHub"               │           │
└──────────────┴─────────────────────────────────────────┴───────────┘
```

| Region | Width | Sticky? |
| --- | --- | --- |
| Top bar | full | yes |
| Sidebar (left) | 240–280px | yes |
| Main body | 720–800px | no |
| TOC (right) | 200–240px | yes |
| Footer / prev-next | matches body | no |

## API

```tsx
<DocPage
  meta={{
    title: "Button",
    description: "The most-used UI control.",
    lastUpdated: "2026-05-08",
    editUrl: "https://github.com/.../button.mdx",
  }}
  sidebar={navTree}
  prevPage={{ title: "Avatar", href: "../avatar" }}
  nextPage={{ title: "Card", href: "../card" }}
>
  {/* MDX content */}
</DocPage>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `meta` | `{ title, description?, lastUpdated?, editUrl? }` | — | Page metadata |
| `sidebar` | `NavNode[]` | — | Left nav tree |
| `tocItems` | `{ id, level, text }[]` | derived from headings | Right TOC |
| `prevPage` / `nextPage` | `{ title, href }` | — | Footer pagination |
| `breadcrumb` | `BreadcrumbNode[]` | derived from URL | |
| `children` | `ReactNode` | — | Page MDX content |

## Sidebar nav

The left column. Lists site sections + pages within. Cite [`knowledge/patterns/information-architecture.md`](../knowledge/patterns/information-architecture.md):

- Max 3 levels deep.
- Active page highlighted (filled bg, primary text color).
- Active section auto-expanded.
- Collapsible on mobile.
- Sticky on desktop.

```tsx
const sidebar = [
  {
    title: "Getting started",
    children: [
      { title: "Installation", href: "/install" },
      { title: "Quick start", href: "/quickstart" },
    ],
  },
  {
    title: "Components",
    children: [
      { title: "Button", href: "/components/button" },
      { title: "Card", href: "/components/card" },
    ],
  },
];
```

## Right TOC (in-page)

Shows headings on the current page. Active section highlighted as user scrolls.

Cite [`examples/component-anchor.md`](component-anchor.md) — Anchor pattern. Default: show h2 + h3 only (h4+ creates noise).

## Body content

Cite [`knowledge/patterns/document-typography.md`](../knowledge/patterns/document-typography.md):

- Body 18px, line-height 1.6.
- Max-width ~720px.
- Headings with consistent vertical rhythm.
- Code blocks with copy button.
- Callouts where appropriate.

## Footer pagination

```
┌─────────────────────────────────────────────┐
│ ← Avatar                       Card →        │
└─────────────────────────────────────────────┘
```

Linear nav for sequential learners. Each link shows title; arrow direction indicates flow.

## "Edit on GitHub"

Link below the body or in a metadata strip. Open the source MDX for editing on GitHub.

```tsx
<a href={meta.editUrl}>Edit this page on GitHub</a>
```

For community contribution: this link is high-leverage.

## Search

Cmd+K → opens search overlay. See [`knowledge/patterns/search-ux.md`](../knowledge/patterns/search-ux.md).

For doc sites: integrate Algolia DocSearch (free for OSS), MeiliSearch, or Pagefind (no-server static search).

## Mobile patterns

Below `md` breakpoint:
- Sidebar collapses to drawer (`☰` opens).
- TOC hidden (replaced by floating "Sections" button OR inline at top of page).
- Body full-width minus margin.

## Theme toggle

Light / dark / system. Toggle in top-right.

For docs: dark mode is essential — many devs read docs at night, or prefer dark editors.

```tsx
<ThemeToggle current={theme} onChange={setTheme} />
```

## Tokens consumed

Inherits from the broader design system. Doc-specific:

```
--color-bg-default
--color-bg-elevated         (sidebar bg, slightly different from body)
--color-bg-subtle           (hover states)
--color-text-primary, --color-text-secondary, --color-text-tertiary
--color-primary-default     (active sidebar item)
--color-border-default      (between regions)
--space-* full scale
--font-* full scale (body 18px)
--shadow-card               (mobile drawer)
--motion-default
```

## Accessibility

- Top bar: `<header>` with `<nav aria-label="Site">`.
- Sidebar: `<aside>` or `<nav aria-label="Documentation">`.
- Body: `<main id="main-content">`.
- TOC: `<aside aria-label="On this page">`.
- Footer: `<footer>`.
- Skip link: "Skip to main content" before sidebar (keyboard users skip nav).

## Versioning UI

For docs with multiple versions:
- Version selector in top bar (dropdown).
- Banner on older-version pages: "You're viewing v1. The latest is v2 → [link]."
- 301 redirects from old URLs.

## Frameworks

| Framework | Best for |
| --- | --- |
| **Docusaurus** | OSS docs, MDX, well-maintained |
| **Nextra** | Next.js apps, MDX, modern |
| **Mintlify** | Hosted, paid, polished |
| **GitBook** | Hosted, non-engineer-friendly |
| **VitePress** | Vue ecosystem, fast |
| **Starlight** | Astro ecosystem |

For design-ai's docs: any of these works. Pick one.

## Don't

- Don't ship without search. Doc sites without search are unusable past 30 pages.
- Don't omit "Edit on GitHub" — drives community contributions.
- Don't break URLs on doc reorgs (301 redirect).
- Don't use full-width body for prose. Cap at ~720px.
- Don't omit dark mode.
- Don't have 4+ sidebar levels.

## Cross-reference

- [`knowledge/patterns/information-architecture.md`](../knowledge/patterns/information-architecture.md) — IA + nav
- [`knowledge/patterns/document-typography.md`](../knowledge/patterns/document-typography.md) — body text rules
- [`knowledge/patterns/search-ux.md`](../knowledge/patterns/search-ux.md) — search input
- [`examples/component-anchor.md`](component-anchor.md) — TOC pattern
- [`examples/component-breadcrumb.md`](component-breadcrumb.md) — breadcrumb
- [`examples/component-layout.md`](component-layout.md) — product app layout (different)
