# `Anchor` (scrollspy / TOC) — spec

> Citing Ant Design `Anchor`, MUI (no built-in), shadcn-ui (no built-in)

## Purpose

A side-rail navigation that highlights the current section as the user scrolls through long-form content. Used for: documentation pages, terms of service, long articles, settings sections.

## Anatomy

```
┌──────────────────────────────────────────┐
│                                  ┌─────┐ │
│  Section 1 heading               │ §1  │ │
│  Body text...                    │ §2  │ │  ← TOC sidebar
│                                  │ §3  │ │     (active highlighted)
│  Section 2 heading               │ §4  │ │
│  Body text...                    └─────┘ │
│                                          │
│  Section 3 heading (current)             │
│  Body text...                            │
└──────────────────────────────────────────┘
```

| Slot | Required | Notes |
| --- | --- | --- |
| Anchor list | yes | TOC items with hierarchy |
| Active indicator | yes | Highlights the section the user is reading |
| Click to scroll | yes | Clicking an item scrolls smoothly to its target |

## API

```tsx
<Anchor
  items={[
    { key: "intro", title: "소개", href: "#intro" },
    { key: "install", title: "설치", href: "#install" },
    {
      key: "usage",
      title: "사용법",
      href: "#usage",
      children: [
        { key: "basic", title: "기본 사용", href: "#basic" },
        { key: "advanced", title: "고급 사용", href: "#advanced" },
      ],
    },
  ]}
  affix
  offsetTop={64}
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | `AnchorItem[]` | — | TOC entries (hierarchical) |
| `affix` | `boolean` | `true` | Stick to viewport on scroll |
| `offsetTop` | `number` | `0` | Top offset when sticky (e.g., for header) |
| `bounds` | `number` | `5` | Threshold for active detection |
| `targetOffset` | `number` | — | Account for sticky header on click-scroll |
| `onChange` | `(key: string) => void` | — | Active item changes |
| `onClick` | `(e, item) => void` | — | |
| `direction` | `"vertical" \| "horizontal"` | `"vertical"` | |

```ts
type AnchorItem = {
  key: string;
  title: string;
  href: string;          // CSS selector (e.g., "#section-1") or full URL
  children?: AnchorItem[];
  target?: string;       // For external links
};
```

## Behavior

### Active section detection

Uses `IntersectionObserver` (modern browsers) or scroll listener:
- Watch each target section as user scrolls.
- The "active" section is the one currently in viewport.
- For overlapping sections: typically the one closest to top (or above the bounds threshold).

### Click to scroll

Clicking an anchor item scrolls smoothly to its target:

```js
const target = document.querySelector(item.href);
target.scrollIntoView({ behavior: "smooth", block: "start" });
```

For sticky headers: subtract the header height from scroll position via `scroll-margin-top: <headerHeight>` on target elements.

## States

| State | Visual |
| --- | --- |
| Default (inactive) | Light text |
| Active | Bold + accent color + colored left-border indicator |
| Hover | Slightly darker text |
| Focus-visible | 2px ring around item |

## Tokens consumed

```
--color-text-secondary      (inactive items)
--color-text-primary         (active item)
--color-primary-default      (active indicator border)
--color-bg-default
--color-focus-ring
--space-xs, --space-sm
--font-size-sm
--motion-fast                 (scroll behavior)
```

## Sizes

Typical width: 200–280px (desktop). Each item: ~32–40px height.

For dense docs with many sections: 240px width, 28px row height.

## Accessibility

- Container: `<nav aria-label="목차">`.
- TOC: `<ol>` with hierarchical nesting.
- Each item: `<a href>` (links).
- Current section: `aria-current="location"`.

```html
<nav aria-label="목차">
  <ol>
    <li><a href="#intro">소개</a></li>
    <li><a href="#install" aria-current="location">설치</a></li>
    <li>
      <a href="#usage">사용법</a>
      <ol>
        <li><a href="#basic">기본 사용</a></li>
      </ol>
    </li>
  </ol>
</nav>
```

### Keyboard

| Key | Behavior |
| --- | --- |
| `Tab` | Move through items |
| `Enter` | Activate (scroll to target) |

## Mobile

For mobile: typically hide Anchor (long-form on mobile uses different patterns — read top-to-bottom, no jumping). If shown:
- Render as collapsible drawer ("목차") on the side.
- Or: button at top "목차 보기" → opens dialog with TOC.

## Don't

- Don't show Anchor for content that's < 1 page tall.
- Don't auto-scroll the active item out of view in the rail (use `scroll-behavior: smooth` to keep it visible).
- Don't break browser back/forward — use URL hash sync.
- Don't render Anchor without unique `id`s on target sections.

## Code example

```tsx
function DocsPage({ headings }: Props) {
  return (
    <div className="grid grid-cols-[1fr_240px] gap-8">
      <article>
        {headings.map(h => (
          <section key={h.id} id={h.id} style={{ scrollMarginTop: 80 }}>
            <h2>{h.title}</h2>
            {h.content}
          </section>
        ))}
      </article>
      <Anchor
        affix
        offsetTop={64}
        targetOffset={80}
        items={headings.map(h => ({ key: h.id, title: h.title, href: `#${h.id}` }))}
      />
    </div>
  );
}
```

## References

- Ant Design: [`refs/ant-design/components/anchor/`](../docs/reference/ant-design.md#anchor) — `Anchor`, `Anchor.Link`. Solid implementation.
- MUI / shadcn-ui: no built-in. Compose with `IntersectionObserver` + custom CSS.

## Cross-reference

- [`examples/component-affix.md`](component-affix.md) — sticky positioning (Anchor uses)
- [`knowledge/patterns/list-and-feed.md`](../knowledge/patterns/list-and-feed.md) — sticky section headers
- [`knowledge/a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md)
