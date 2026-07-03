# `HoverCard` — spec

> Synthesized from shadcn-ui `hover-card` (Radix). Hover-triggered floating card showing rich preview content. Distinct from Tooltip (text only) and Popover (click-triggered).

## When to use

- **User profile preview** on @-mention hover.
- **Link preview** before navigation.
- **Glossary** — hover term, see definition.
- **Card-style metadata** — hover an entity, see image + summary + actions.

When NOT to use:
- Mobile-primary contexts — hover doesn't exist on touch (long-press feels heavy).
- Critical info — hover is supplemental; user must be able to access without it.
- Quick text only — use Tooltip (lighter, faster).
- User-initiated content — use Popover (click-triggered).

## Anatomy

```
[hover trigger]
        ↓
        ┌──────────────────────┐
        │ [avatar]             │
        │ User Name            │
        │ @username            │
        │                      │
        │ Joined 2024          │
        │ Following 234        │
        │                      │
        │ [Follow]  [Message]  │
        └──────────────────────┘
```

## API

```tsx
<HoverCard openDelay={400} closeDelay={300}>
  <HoverCard.Trigger asChild>
    <a href={`/users/${user.id}`}>@{user.username}</a>
  </HoverCard.Trigger>
  <HoverCard.Content>
    <div className="hover-card-content">
      <Avatar src={user.avatar} />
      <h4>{user.name}</h4>
      <p>@{user.username}</p>
      <p>{user.bio}</p>
      <div className="actions">
        <button>Follow</button>
        <button>Message</button>
      </div>
    </div>
  </HoverCard.Content>
</HoverCard>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `openDelay` | `number` | `700` | Ms hover before opening (don't trigger on glancing-pass) |
| `closeDelay` | `number` | `300` | Ms after leave before closing (allows mouse to enter card) |
| `defaultOpen` | `boolean` | `false` | Open initially (rare) |
| `open` | `boolean` | controlled | Controlled state |
| `onOpenChange` | `(open: boolean) => void` | — | State callback |

## Composition

| Part | Purpose |
| --- | --- |
| `Trigger` | Hover target |
| `Content` | The floating card |
| `Arrow` (optional) | Caret pointing at trigger |
| `Portal` | Render outside parent (default behavior) |

Free-form children inside Content — no enforced sub-parts (unlike DropdownMenu).

## Open / close behavior

```
User hovers trigger
  ↓ wait openDelay (700ms default)
Card opens with fade + scale (200ms)
User mouses out of trigger
  ↓ wait closeDelay (300ms)
  ↓ during delay, if mouse enters Card, cancel close
Card closes if mouse hasn't entered Card
User mouses out of Card
  ↓ wait closeDelay
Card closes
```

The closeDelay + Card-as-hover-target pattern is critical. Without it, users can't reach the card content.

## Positioning

Same as DropdownMenu:
- Default: `bottom-start`.
- `align`, `side` configurable.
- Auto-flip on collision.
- 8px collision padding.

For inline triggers (within paragraphs of text): consider `align="start"` to anchor to the trigger's left edge.

## States

| State | Visual |
| --- | --- |
| Closed | Trigger visible; card hidden |
| Hover (within openDelay) | Trigger styled (e.g., underline) but card still hidden |
| Opening | Card fades + scales in (200ms) |
| Open | Card visible |
| Closing | Reverse (150ms) |

No focus management — HoverCard is hover-only. For keyboard / focus equivalent, use Tooltip OR pair with a Popover triggered by focus.

## Tokens consumed

```
--color-bg-overlay
--color-fg-on-overlay
--color-border-overlay
--radius-md
--shadow-overlay
--space-md, --space-lg
--font-size-sm, --font-size-base
--motion-medium                (200ms open/close)
--ease-out
--z-overlay
```

## Accessibility

- HoverCard is **decorative / supplemental**. The same content must be reachable elsewhere (linked profile page, accessible label, etc.).
- Trigger remains a normal interactive element (link, button) — its activation must work without hover.
- Don't put critical actions ONLY in the HoverCard. Buttons inside should also exist on the destination page.
- For keyboard users: hovering doesn't fire on `focus` by default. If you need focus-equivalent, use `Popover` or add a dedicated keyboard shortcut.
- For touch: hover doesn't exist; HoverCard is silently no-op on mobile. Don't ship critical info inside.
- `aria-label` on Trigger should describe the destination, not "show preview" (hover is internal mechanic).

## Mobile behavior

By default, HoverCard does nothing on touch devices. Options:
- **Tap once = preview, tap again = navigate** (pattern used by some social apps; confusing).
- **Long-press = preview** (similar to ContextMenu; non-obvious).
- **Don't show on mobile** — fall back to direct navigation.

Default and recommended: **don't show on mobile**. Style the trigger so users see it's tappable, navigate them to a full page on tap.

## Code example

```tsx
function MentionLink({ user }: { user: User }) {
  return (
    <HoverCard openDelay={500} closeDelay={300}>
      <HoverCard.Trigger asChild>
        <a href={`/users/${user.id}`} className="mention">
          @{user.username}
        </a>
      </HoverCard.Trigger>
      <HoverCard.Content className="mention-preview">
        <div className="header">
          <Avatar src={user.avatar} size="lg" />
          <div>
            <h4>{user.name}</h4>
            <p className="username">@{user.username}</p>
          </div>
        </div>
        <p className="bio">{user.bio}</p>
        <dl className="stats">
          <dt>Following</dt><dd>{user.following}</dd>
          <dt>Followers</dt><dd>{user.followers}</dd>
        </dl>
        <div className="actions">
          <FollowButton userId={user.id} />
        </div>
      </HoverCard.Content>
    </HoverCard>
  );
}
```

## Edge cases

- **Trigger inside scrollable container**: card may scroll out of view; `Portal` keeps it visible.
- **Async content** (fetch user data on hover): show skeleton inside card while loading.
- **Trigger removed during open**: card auto-closes.
- **Multiple hover-cards in close proximity**: respect `openDelay` so glancing through doesn't open a chain.
- **Card content larger than viewport**: cap height; scroll inside card OR truncate.
- **Right-to-left**: positioning flips automatically.
- **Reduced motion**: skip fade + scale; instant show / hide.

## Don't

- Don't put critical info or actions only inside HoverCard.
- Don't trigger on click — that's Popover.
- Don't trigger on focus — use Tooltip for that, or pair with Popover.
- Don't make HoverCard the only way to view a profile — link the trigger to the full page.
- Don't ship without `openDelay` — mouse-passing through triggers an avalanche of cards.
- Don't disable on mobile silently without a fallback path.
- Don't autofocus inside HoverCard — content is non-interactive aside from links.

## References

- shadcn-ui: [`hover-card`](../docs/reference/shadcn-ui.md#hover-card) (Radix)
- Patterns: Twitter / X profile previews on @mention hover
- Patterns: GitHub PR review preview on commit hash hover

## Cross-reference

- [`examples/component-tooltip.md`](component-tooltip.md) — text-only hover hint
- [`examples/component-popover.md`](component-popover.md) — click-triggered floating content
- [`examples/component-dropdown.md`](component-dropdown.md) — menu-style overlay
