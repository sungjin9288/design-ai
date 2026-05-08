# `Item` — spec

> Synthesized from shadcn-ui `item` (a flexible list-item primitive). The "Item family" — `Item`, `ItemMedia`, `ItemContent`, `ItemTitle`, `ItemDescription`, `ItemActions`, `ItemSeparator`, `ItemHeader`, `ItemFooter`. The atomic building block for lists, tables-of-things, settings rows, account rows, search results.

## When to use

- **Settings rows** (with leading icon, title, description, trailing chevron / switch).
- **Account / profile rows** (avatar + name + role + actions).
- **Search results** (icon / image + title + meta + actions).
- **List rows** in any list-of-entities surface (mail inbox, notifications, files).

When NOT to use:
- Data-grid rows — use `Table`.
- Card-style entities — use `Card`.
- Pure text list — use `<ul>` / `<ol>`.

## Anatomy

```
┌────────────────────────────────────┐
│ [icon] [title]              [⋮]    │   ← single-line, with action
│        [description]                 │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ [avatar 40px]  Sungjin Park         │  ← list / contact pattern
│                Senior Designer       │
│                                  ▶  │
└────────────────────────────────────┘
```

## API

```tsx
<Item>
  <ItemMedia>
    <Avatar src={user.avatar} />
  </ItemMedia>
  <ItemContent>
    <ItemTitle>{user.name}</ItemTitle>
    <ItemDescription>{user.role}</ItemDescription>
  </ItemContent>
  <ItemActions>
    <Button variant="ghost" size="icon">
      <ChevronRightIcon />
    </Button>
  </ItemActions>
</Item>
```

## Composition

| Part | Purpose |
| --- | --- |
| `Item` | Outer row wrapper |
| `ItemMedia` | Leading visual (icon, avatar, image) |
| `ItemContent` | Middle text region (Title + Description) |
| `ItemTitle` | Primary text |
| `ItemDescription` | Secondary muted text |
| `ItemActions` | Trailing action(s) (button, switch, count, chevron) |
| `ItemHeader` | Above-content metadata (date, author) |
| `ItemFooter` | Below-content secondary content |
| `ItemSeparator` | Divider between consecutive Items |

## Variants

### Density

| Density | Padding | Typical Title size |
| --- | --- | --- |
| `comfortable` (default) | `--space-md` | 14-16px |
| `compact` | `--space-sm` | 13-14px |
| `relaxed` | `--space-lg` | 16-18px |

### Interactive

```tsx
<Item asChild>
  <a href={`/users/${user.id}`}>...</a>
</Item>

<Item interactive onClick={onClick}>...</Item>
```

When interactive, the entire row is the click target (block link pattern).

### Selectable

```tsx
<Item selected={isSelected} onSelect={handleSelect}>
  ...
</Item>
```

Used in selection lists (mail, files). Selected state has highlight bg + persistent indicator.

## States

| State | Visual |
| --- | --- |
| Default | Resting |
| Hover (interactive) | Subtle bg shift |
| Pressed | Deeper bg (touch) or stable (mouse) |
| Focus-visible | 2px focus ring on the entire row |
| Selected | Persistent bg highlight + brand-color indicator |
| Disabled | Reduced opacity, no events, `aria-disabled` |

## Tokens consumed

```
--item-bg                          (default; transparent)
--item-bg-hover                    (interactive hover)
--item-bg-selected                 (selected state)
--item-fg                          (Title)
--item-fg-muted                    (Description)
--item-padding-y                   (varies by density)
--item-padding-x                   (typically --space-md)
--item-gap                         (between Media / Content / Actions)
--item-divider                     (Separator color)
--space-sm, --space-md, --space-lg
--radius-md                        (rounded item highlight)
--motion-fast                      (hover transition)
```

## Accessibility

- `Item`:
  - If interactive (clickable row): use real `<a>` or `<button>`. Apply `block` styles. Focus goes to the wrapper.
  - If non-interactive: plain `<li>` inside parent `<ul>` / `<ol>`.
  - For multi-action items (selectable + has trailing actions): outer is `<button>` for select, but Trailing buttons inside can't be nested. Use a different pattern (separate select + actions, or label-for-checkbox pattern).
- `ItemTitle`: typically `<h3>` or `<h4>` if list is a section's content, or just text in a list of homogenous items.
- `ItemActions`: each action is an independent button with its own `aria-label`.
- Touch target: ≥ 44pt for the row OR the action(s).
- Selected state: `aria-selected="true"` (in selection list) or `aria-checked` if checkbox-style.

## Korean apps

Korean list patterns:
- **Account row**: avatar + name + role / phone + "더보기" arrow
- **Settings row**: icon + label + value (e.g., "언어 — 한국어 ▶") + chevron
- **Notification row**: icon + title (bold) + body (muted) + timestamp + unread dot
- **Transaction row** (fintech): merchant logo + name + amount (right) + date below — see [`examples/component-transaction-list-item.md`](component-transaction-list-item.md) for KR fintech specifics.

Common labels:
- 더보기 (more)
- 설정 (settings)
- 알림 (notifications)
- 자세히 (details)

## Code example — settings list

```tsx
function SettingsList() {
  return (
    <div role="list">
      <Item asChild interactive>
        <Link href="/settings/profile">
          <ItemMedia><UserIcon /></ItemMedia>
          <ItemContent>
            <ItemTitle>프로필</ItemTitle>
            <ItemDescription>이름, 사진, 자기소개</ItemDescription>
          </ItemContent>
          <ItemActions>
            <ChevronRightIcon className="text-muted" />
          </ItemActions>
        </Link>
      </Item>

      <ItemSeparator />

      <Item asChild interactive>
        <Link href="/settings/notifications">
          <ItemMedia><BellIcon /></ItemMedia>
          <ItemContent>
            <ItemTitle>알림</ItemTitle>
            <ItemDescription>이메일, 푸시, SMS 설정</ItemDescription>
          </ItemContent>
          <ItemActions>
            <ChevronRightIcon className="text-muted" />
          </ItemActions>
        </Link>
      </Item>

      <ItemSeparator />

      <Item>
        <ItemMedia><MoonIcon /></ItemMedia>
        <ItemContent>
          <ItemTitle>다크 모드</ItemTitle>
        </ItemContent>
        <ItemActions>
          <Switch checked={isDark} onCheckedChange={setIsDark} />
        </ItemActions>
      </Item>

      <ItemSeparator />

      <Item asChild interactive>
        <Link href="/help">
          <ItemMedia><QuestionIcon /></ItemMedia>
          <ItemContent>
            <ItemTitle>도움말</ItemTitle>
          </ItemContent>
          <ItemActions>
            <ChevronRightIcon className="text-muted" />
          </ItemActions>
        </Link>
      </Item>
    </div>
  );
}
```

## Edge cases

- **Long Title**: truncate with ellipsis (`overflow: hidden; text-overflow: ellipsis; white-space: nowrap`). Don't wrap unless ItemDescription expects to wrap too.
- **Long Description**: typically 1-2 lines; truncate with `-webkit-line-clamp`.
- **Multiple actions in ItemActions**: tightest is 2-3; if more, group into "More" menu.
- **Toggle / Switch in row**: the whole row clickable also toggles? Decide; consistency matters.
- **Selectable + interactive conflict**: can't have entire row as `<a>` AND `<button>` for select. Pattern: row is `<a>`, leading checkbox handles select.
- **RTL**: Media and Actions positions flip.
- **Reduced motion**: skip hover bg transition.

## Don't

- Don't pile up 4+ actions in ItemActions. Use overflow menu.
- Don't make Title and Description the same weight / size — hierarchy matters.
- Don't auto-truncate Description without showing user the rest is hidden (line-clamp + ellipsis OK; silent crop bad).
- Don't put inputs (text fields) inside ItemActions. Use a different pattern (or Field row).
- Don't omit `aria-label` on icon-only Action buttons.
- Don't make rows shorter than 44pt on mobile primary surfaces.

## References

- shadcn-ui: [`item`](../refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/item.tsx)
- iOS UITableViewCell; Material 3 List item

## Cross-reference

- [`examples/component-transaction-list-item.md`](component-transaction-list-item.md) — KR fintech specialization
- [`examples/component-card.md`](component-card.md) — for richer / card-style entities
- [`examples/component-table.md`](component-table.md) — for tabular data
- [`knowledge/patterns/list-and-feed.md`](../knowledge/patterns/list-and-feed.md)
