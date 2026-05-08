# `Kbd` — spec

> Synthesized from shadcn-ui `kbd` and the HTML5 `<kbd>` element. Renders a keyboard shortcut as a small key cap. Used in tooltips, command palettes, dropdown menu shortcuts, documentation.

## When to use

- **Inline keyboard shortcut** in tooltips: "⌘ S to save".
- **Command palette / dropdown menu shortcuts**: right-aligned shortcut hint.
- **Documentation**: "Press ⌘ K to open the command palette".
- **Help overlays**: keyboard shortcut cheatsheets.

## Anatomy

```
[ ⌘ ] [ K ]    or    [ Ctrl ] [ K ]    or    [ ⇧ ] [ ⌘ ] [ P ]
```

A small bordered + shadowed key cap with the key label inside.

## API

```tsx
<Kbd>⌘</Kbd> <Kbd>K</Kbd>

<Kbd combo>
  <Kbd.Key>⇧</Kbd.Key>
  <Kbd.Key>⌘</Kbd.Key>
  <Kbd.Key>P</Kbd.Key>
</Kbd>

<Kbd shortcut="cmd+k" />  {/* Helper that auto-renders cmd / ctrl based on platform */}
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `size` | `"sm" \| "md"` | `"sm"` | Size of the key cap |
| `variant` | `"default" \| "outline"` | `"default"` | Visual style |
| `shortcut` | `string` | — | Convenience: parses "cmd+k" → renders ⌘ K |
| `children` | `ReactNode` | — | Manual content (one key or multiple `<Kbd.Key>`) |

## Platform-aware shortcut parser

```tsx
function Kbd({ shortcut }: { shortcut?: string }) {
  if (!shortcut) return /* manual */;

  const isMac = /Mac/.test(navigator.platform);
  const keys = shortcut.split("+").map(k => {
    const lower = k.toLowerCase();
    if (lower === "cmd" || lower === "meta") return isMac ? "⌘" : "Ctrl";
    if (lower === "ctrl") return "Ctrl";
    if (lower === "shift") return "⇧";
    if (lower === "alt" || lower === "option") return isMac ? "⌥" : "Alt";
    if (lower === "enter") return "↵";
    if (lower === "esc") return "Esc";
    if (lower === "tab") return "⇥";
    if (lower === "space") return "␣";
    if (lower === "backspace") return "⌫";
    return k.toUpperCase();
  });

  return <kbd>{keys.map((k, i) => <span key={i}>{k}</span>)}</kbd>;
}
```

## Symbols (Mac convention)

| Key | Symbol |
| --- | --- |
| Cmd / Meta | ⌘ (U+2318) |
| Shift | ⇧ (U+21E7) |
| Option / Alt | ⌥ (U+2325) |
| Control | ⌃ (U+2303) |
| Enter / Return | ↵ (U+21B5) or ⏎ (U+23CE) |
| Escape | Esc |
| Tab | ⇥ (U+21E5) |
| Space | ␣ (U+2423) |
| Backspace | ⌫ (U+232B) |
| Delete | ⌦ (U+2326) |
| Up / Down / Left / Right | ↑ ↓ ← → |
| Caps Lock | ⇪ (U+21EA) |
| Function | Fn |

For Windows / Linux: use text labels — "Ctrl", "Alt", "Shift", "Win".

## States

Stateless. `<kbd>` is presentational.

## Tokens consumed

```
--kbd-bg               (key cap bg, slightly different from page bg)
--kbd-fg               (text on key)
--kbd-border           (key border)
--kbd-shadow           (subtle inset shadow for "cap" effect)
--radius-sm            (key corners)
--font-family-mono     (typically monospace for the key label)
--font-size-xs
--space-xxs            (key padding)
```

## CSS

```css
kbd, .kbd {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  font-family: var(--font-family-mono);
  font-size: var(--font-size-xs);
  line-height: 1.4;
  background: var(--kbd-bg);
  color: var(--kbd-fg);
  border: 1px solid var(--kbd-border);
  border-radius: var(--radius-sm);
  box-shadow: 0 1px 0 var(--kbd-border), 0 1px 0 inset rgba(255, 255, 255, 0.5);
  min-width: 1.5em;
  justify-content: center;
}

kbd + kbd {
  margin-left: 2px;
}
```

## Accessibility

- Use the semantic `<kbd>` element. Screen readers announce as "keyboard input".
- For complex shortcuts: wrap in a `<span>` with `aria-label` describing the shortcut, since reading individual symbols may be confusing.

```html
<span aria-label="Command K">
  <kbd>⌘</kbd><kbd>K</kbd>
</span>
```

- Don't rely on visual symbols alone for non-Mac users; provide text fallback.

## Code example

```tsx
function ShortcutTooltip({ children, shortcut }: Props) {
  return (
    <Tooltip>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Content>
        Save  <Kbd shortcut="cmd+s" />
      </Tooltip.Content>
    </Tooltip>
  );
}

function CommandList() {
  return (
    <DropdownMenu>
      <DropdownMenu.Trigger>Actions</DropdownMenu.Trigger>
      <DropdownMenu.Content>
        <DropdownMenu.Item>
          New file <DropdownMenu.Shortcut><Kbd shortcut="cmd+n" /></DropdownMenu.Shortcut>
        </DropdownMenu.Item>
        <DropdownMenu.Item>
          Open <DropdownMenu.Shortcut><Kbd shortcut="cmd+o" /></DropdownMenu.Shortcut>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}
```

## Edge cases

- **Korean keyboard mapping**: 한영 toggle uses dedicated key; can render as "한/영". Most app shortcuts use Latin characters even on Korean keyboards.
- **Ctrl + Cmd ambiguity**: prefer one canonical name per platform. Don't say "Cmd / Ctrl" — render the platform-correct symbol.
- **Mobile**: shortcut display rare on touch (no keyboard); hide or replace with alternative gesture description.
- **Multi-key combos**: render each key in its own `<kbd>`; combine with small gap.
- **Very long key labels** (e.g., "Backspace"): use the label not symbol in such cases.

## Don't

- Don't render shortcut as plain text. The boxed appearance is the affordance.
- Don't use Mac symbols on Windows users (or vice-versa). Detect platform.
- Don't make the cap so small the label is unreadable.
- Don't put non-keyboard things in `<kbd>` (it's specifically for keys).

## References

- HTML5 `<kbd>` element
- shadcn-ui: `kbd` component
- Apple HIG: keyboard shortcut conventions

## Cross-reference

- [`examples/component-tooltip.md`](component-tooltip.md) — common consumer
- [`examples/component-dropdown.md`](component-dropdown.md) — Shortcut sub-component
- [`examples/component-command.md`](component-command.md) — heavy shortcut display
- [`knowledge/a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md)
