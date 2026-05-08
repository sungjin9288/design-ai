# `ScrollArea` — spec

> Synthesized from shadcn-ui `scroll-area` (Radix). Custom-styled scrollbar that replaces the platform default. Used when native scrollbars don't match the design system or when consistent cross-platform appearance is needed.

## When to use

- **Design-system-consistent scrollbars** across macOS / Windows / Linux (native scrollbars vary widely).
- **Always-visible scrollbars** (macOS hides them by default; some UIs need them visible).
- **Inside narrow surfaces** (sidebars, dropdowns) where native scrollbars look out of place.
- **Brand-aligned visual** — color-customized scrollbars.

When NOT to use:
- The whole document body — let the browser handle main scroll.
- Long-form reading content — native scroll is faster + more familiar.
- Mobile-primary surfaces — system scroll is deeply integrated with momentum + bounce.

## Anatomy

```
┌───────────────────────────┐
│ Content                   ▒│ ← thumb (scrollbar)
│  Item 1                   ▒│
│  Item 2                   ▒│
│  Item 3                   ▒│
│  ...                      ▒│
│                            │
└───────────────────────────┘
```

## API

```tsx
<ScrollArea className="h-72 w-48 rounded-md border">
  <div className="p-4">
    {items.map(item => (
      <div key={item.id}>{item.name}</div>
    ))}
  </div>
</ScrollArea>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `type` | `"auto" \| "always" \| "scroll" \| "hover"` | `"hover"` | Scrollbar visibility |
| `scrollHideDelay` | `number` | `600` | Ms before scrollbar hides (when type is `scroll`) |
| `dir` | `"ltr" \| "rtl"` | `"ltr"` | Direction (affects scroll position) |
| `children` | `ReactNode` | — | Scrolling content |

## Visibility modes

| `type` | Behavior |
| --- | --- |
| `auto` | Show only when content overflows |
| `always` | Always visible regardless of content |
| `scroll` | Visible while scrolling, fades after `scrollHideDelay` |
| `hover` (default) | Visible on hover or while scrolling |

## Composition

| Part | Purpose |
| --- | --- |
| `ScrollArea` | Wrapper with overflow control |
| `ScrollAreaViewport` | The clipping container (auto-rendered) |
| `ScrollAreaScrollbar` | The scrollbar track + thumb (auto-rendered) |
| `ScrollAreaThumb` | The draggable thumb (auto-rendered) |
| `ScrollAreaCorner` | Bottom-right corner when both axes scroll (auto-rendered) |

In practice, just use `<ScrollArea>` and let it manage subparts.

## Custom scrollbar styles

```css
[data-radix-scroll-area-scrollbar] {
  display: flex;
  user-select: none;
  touch-action: none;
  padding: 2px;
  background: transparent;
  transition: background 200ms ease;
}

[data-radix-scroll-area-scrollbar][data-orientation="vertical"] {
  width: 10px;
}

[data-radix-scroll-area-scrollbar][data-orientation="horizontal"] {
  height: 10px;
  flex-direction: column;
}

[data-radix-scroll-area-thumb] {
  flex: 1;
  background: var(--color-fg-muted);
  border-radius: 5px;
  position: relative;
  cursor: pointer;
}

[data-radix-scroll-area-thumb]:hover {
  background: var(--color-fg-default);
}
```

## Tokens consumed

```
--color-fg-muted               (scrollbar thumb default)
--color-fg-default             (thumb hover)
--color-bg-secondary           (scrollbar track, optional)
--space-xxs                    (scrollbar padding)
--motion-fast                  (visibility transition)
```

## States

| State | Visual |
| --- | --- |
| Resting (with `hover` type) | Scrollbar hidden |
| Hovered or scrolling | Scrollbar visible (fade in 100ms) |
| Thumb hover | Slightly darker / brighter thumb |
| Thumb dragged | Active state visual |
| Idle (after scroll) | Fades out (with `scroll` type) |

## Accessibility

- ScrollArea preserves native scroll keyboard handling (PageUp / PageDown / arrows / Space).
- Don't replace native scroll mechanics — only the visual appearance.
- Don't trap scroll inside without an obvious "exit" path (lock scroll OR document scroll, not both ambiguously).
- For overflow-only-on-hover patterns: ensure keyboard users can also access (Tab to focus content, arrow / PageDown to scroll).
- Mobile: respects native momentum scroll; thumb may be hidden on mobile (system handles it).

## Code example — Sidebar nav with custom scrollbar

```tsx
function Sidebar() {
  return (
    <aside className="sidebar">
      <header>
        <Logo />
      </header>

      <ScrollArea className="flex-1 px-2">
        <nav>
          <NavSection title="Workspace">
            {workspaceItems.map(item => <NavItem key={item.id} {...item} />)}
          </NavSection>
          <NavSection title="Projects">
            {projects.map(p => <NavItem key={p.id} {...p} />)}
          </NavSection>
        </nav>
      </ScrollArea>

      <footer>
        <UserMenu />
      </footer>
    </aside>
  );
}
```

## Code example — Chat history

```tsx
<ScrollArea type="always" className="chat-history">
  {messages.map(m => (
    <Message key={m.id} message={m} />
  ))}
</ScrollArea>
```

## Edge cases

- **Content exact height as ScrollArea**: scrollbar may briefly appear during render; use `type="auto"`.
- **Mac users with hidden scrollbars**: respect their preference; `type="hover"` works well.
- **Touch device**: native touch scroll preserved; styled thumb usually invisible.
- **Very long content (10,000+ items)**: virtualize content, not just the scrollbar (use react-virtual).
- **RTL**: scrollbar appears on left; content scrolls right-to-left.
- **Print**: native scroll; ScrollArea custom styling doesn't apply.
- **Mobile keyboard opens**: viewport shrinks; ScrollArea height adjusts via parent layout.

## Don't

- Don't replace document-level scroll with ScrollArea. Browsers + native scroll handle that better.
- Don't make custom scrollbars wildly different from system convention (users miss them).
- Don't make the thumb so small it's hard to grab (< 8px width).
- Don't disable native keyboard scroll keys.
- Don't trap scroll without an exit (avoid scroll-jacking).
- Don't add scroll-snap inside ScrollArea unless intentional — can interact unexpectedly with momentum.

## References

- shadcn-ui: [`scroll-area`](../refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/scroll-area.tsx) (Radix)
- CSS `scrollbar-color`, `scrollbar-width` properties (browser-specific styling alternative)

## Cross-reference

- [`examples/component-sidebar.md`](component-sidebar.md) — common consumer
- [`examples/component-chat-interface.md`](component-chat-interface.md) — chat history scroll
- [`examples/component-table.md`](component-table.md) — table with scrollable body
