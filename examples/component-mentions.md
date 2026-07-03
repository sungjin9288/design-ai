# `Mention` (@-trigger autocomplete) — spec

> Citing Ant Design `Mentions`, MUI (no built-in), shadcn-ui (composition with `command`)

## Purpose

A textarea-style input where typing a trigger character (`@`, `#`, `:`) opens a popover with suggestions. The picked suggestion is inserted into the text as a "mention chip" (highlighted token).

Used for: comments, chat, descriptions with @-mentions of users, #-tags, :emoji shortcodes, /commands.

## Anatomy

```
┌──────────────────────────────────────────────────────┐
│ Hey @mi|                                              │  ← cursor after @mi
└──────────────────────────────────────────────────────┘
            │
            ▼
       ┌──────────────────┐
       │ ▶ 김민지 (@minji) │  ← active suggestion
       │   김민호 (@minho) │
       │   민혜진 (@hye)   │
       └──────────────────┘

After picking "김민지":
┌──────────────────────────────────────────────────────┐
│ Hey [김민지]                                          │  ← chip rendered as highlighted token
└──────────────────────────────────────────────────────┘
```

## API

```tsx
<Mention
  value={text}
  onValueChange={setText}
  triggers={[
    {
      char: "@",
      onSearch: (query) => searchUsers(query),
      renderItem: (user) => <UserItem user={user} />,
      onSelect: (user) => ({ value: `@${user.username}`, label: user.name, data: user }),
    },
    {
      char: "#",
      onSearch: (query) => searchTags(query),
    },
  ]}
  placeholder="댓글을 작성하세요..."
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string` | — | Text content (with chips encoded as tokens) |
| `onValueChange` | `(value: string, mentions: Mention[]) => void` | — | Returns plain text + structured mentions |
| `triggers` | `Trigger[]` | — | Per-trigger config |
| `placeholder` | `string` | — | |
| `multiline` | `boolean` | `true` | Textarea vs input |
| `maxLength` | `number` | — | |
| `disabled` | `boolean` | `false` | |

```ts
type Trigger = {
  char: string;                    // "@", "#", ":", "/"
  onSearch: (query: string) => Promise<Option[]>;
  renderItem?: (item: Option) => ReactNode;
  onSelect: (item: Option) => { value: string; label: string; data?: unknown };
};

type Mention = {
  trigger: string;
  value: string;
  data: unknown;       // The original Option's data
  position: { start: number; end: number };
};
```

## Behavior

### Trigger detection

When user types a trigger char:
1. Detect cursor position immediately after.
2. Open popover anchored at cursor.
3. As user continues typing, send query (the chars after trigger) to `onSearch`.
4. Show suggestions in popover.

### Picking a suggestion

When user selects a suggestion (click or Enter):
1. Replace `@query` with the chip representation.
2. Close popover.
3. Cursor advances past the chip.
4. The chip is **non-editable** as a unit — backspace deletes the whole chip, not character-by-character.

### Cancelling

Type `Esc`, click outside, or type a space: closes popover, leaves typed text as-is (no chip created).

## Storage format

Two common storage approaches:

### A. Plain text + structured mentions

```ts
{
  text: "Hey @minji and @minho, please review",
  mentions: [
    { trigger: "@", value: "minji", position: { start: 4, end: 10 } },
    { trigger: "@", value: "minho", position: { start: 15, end: 21 } },
  ]
}
```

Mentions array references positions in the text. Render-time: replace those positions with chips.

### B. Markdown-like syntax

```
"Hey @[김민지](minji) and @[김민호](minho)"
```

Storage is plain string with markup. Easier for back-end indexing; harder to render WYSIWYG live.

For chat (sub-second updates): A. For documents: either.

## States

| State | Visual |
| --- | --- |
| Empty | Placeholder, no popover |
| Typing (no trigger) | Standard textarea |
| Trigger typed | Popover opens at cursor |
| Searching | Spinner in popover |
| Has suggestions | List visible |
| Picked | Chip inserted; popover closed |
| Empty results | "결과 없음" or hide popover |

## Accessibility — WAI-ARIA Combobox pattern

For the dropdown:
- Container has `role="combobox"` characteristics applied to the textarea + popover.
- Each suggestion: `role="option"`, `aria-selected` on highlighted.
- Use `aria-activedescendant` on the textarea pointing at the highlighted option.

### Keyboard

| Key | Behavior |
| --- | --- |
| Type trigger char | Opens popover at cursor |
| `↓` / `↑` | Move highlight (in popover) |
| `Enter` | Pick highlighted suggestion |
| `Esc` | Close popover; keep typed text |
| `Backspace` (after a chip) | Deletes the chip (whole unit) |
| `Backspace` (during search) | Deletes character; if last trigger char deleted, close popover |

### Screen reader

When chip inserted: announce via live region: "김민지 mentioned" or similar.

## Korean considerations

- `@` is the standard mention trigger (universal).
- `#` for hashtags works; some apps use Korean characters as triggers but stick with `@`/`#` for compatibility.
- Korean usernames: typically `@박민지` (full name) or `@minji` (romanized). Both should work.
- IME composition: don't fire suggestions during composition. Wait for `compositionend`. See [`knowledge/i18n/korean-typography.md`](../knowledge/i18n/korean-typography.md).
- Chip rendering: Korean names sometimes longer (3-4 chars) — chip width adapts.

## Don't

- Don't make chips editable as text. Backspace deletes whole chip, single Tab moves through.
- Don't use Mentions for fields where suggestions are NOT inserted as text. Use AutoComplete.
- Don't allow free-text @-mentions that bypass the picker (creates broken mentions). Either pick from suggestions OR show error.
- Don't render chips with critical styling that breaks copy-paste — they should stringify gracefully.

## References

- Ant Design: [`refs/ant-design/components/mentions/`](../docs/reference/ant-design.md#mentions) — `Mentions`. Multi-trigger support, async data.
- MUI: no built-in. Use `react-mentions` or build on Slate.
- shadcn-ui: no built-in. Compose with `command` (cmdk) + textarea + custom popover positioning.

## Cross-reference

- [`examples/component-auto-complete.md`](component-auto-complete.md) — when no trigger character is needed
- [`examples/component-select.md`](component-select.md) — combobox pattern
- [`knowledge/i18n/korean-typography.md`](../knowledge/i18n/korean-typography.md) — IME composition
- [`knowledge/patterns/search-ux.md`](../knowledge/patterns/search-ux.md) — typeahead patterns
