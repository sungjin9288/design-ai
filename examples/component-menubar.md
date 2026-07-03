# `Menubar` — spec

> Synthesized from shadcn-ui `menubar` (Radix). Persistent menu bar with multiple top-level menus — the canonical desktop "File / Edit / View / Help" pattern. Common in editor / power-user / desktop-style web apps.

## When to use

- **Desktop-style web apps** (Linear, Notion, Figma) emulating native app menus.
- **Editor surfaces** with many actions organized into File / Edit / View / Insert / Format / Help.
- **Web-as-OS** apps (cloud IDEs, design tools).

When NOT to use:
- Simple consumer apps — feels heavy.
- Mobile primary — desktop convention.
- Marketing sites — use `NavigationMenu`.

## Anatomy

```
┌─────────────────────────────────────────────────┐
│ File   Edit   View   Insert   Format   Help     │ ← Menubar
└──┬──────────────────────────────────────────────┘
   │
   ↓ click File
   ┌──────────────────┐
   │ New          ⌘N  │
   │ Open...      ⌘O  │
   │ Save         ⌘S  │
   │ Save As...   ⇧⌘S │
   │ ─────             │
   │ Close        ⌘W  │
   └──────────────────┘
```

## API

```tsx
<Menubar>
  <Menubar.Menu>
    <Menubar.Trigger>File</Menubar.Trigger>
    <Menubar.Content>
      <Menubar.Item onSelect={handleNew}>
        New <Menubar.Shortcut>⌘N</Menubar.Shortcut>
      </Menubar.Item>
      <Menubar.Item onSelect={handleOpen}>
        Open... <Menubar.Shortcut>⌘O</Menubar.Shortcut>
      </Menubar.Item>
      <Menubar.Separator />
      <Menubar.Sub>
        <Menubar.SubTrigger>Recent</Menubar.SubTrigger>
        <Menubar.SubContent>
          {recentFiles.map(f => (
            <Menubar.Item key={f.id} onSelect={() => open(f)}>{f.name}</Menubar.Item>
          ))}
        </Menubar.SubContent>
      </Menubar.Sub>
      <Menubar.Separator />
      <Menubar.Item onSelect={handleSave}>
        Save <Menubar.Shortcut>⌘S</Menubar.Shortcut>
      </Menubar.Item>
    </Menubar.Content>
  </Menubar.Menu>

  <Menubar.Menu>
    <Menubar.Trigger>Edit</Menubar.Trigger>
    <Menubar.Content>
      <Menubar.Item>Undo <Menubar.Shortcut>⌘Z</Menubar.Shortcut></Menubar.Item>
      <Menubar.Item>Redo <Menubar.Shortcut>⇧⌘Z</Menubar.Shortcut></Menubar.Item>
      <Menubar.Separator />
      <Menubar.Item>Cut <Menubar.Shortcut>⌘X</Menubar.Shortcut></Menubar.Item>
      <Menubar.Item>Copy <Menubar.Shortcut>⌘C</Menubar.Shortcut></Menubar.Item>
      <Menubar.Item>Paste <Menubar.Shortcut>⌘V</Menubar.Shortcut></Menubar.Item>
    </Menubar.Content>
  </Menubar.Menu>

  <Menubar.Menu>
    <Menubar.Trigger>View</Menubar.Trigger>
    <Menubar.Content>
      <Menubar.CheckboxItem checked={showGrid} onCheckedChange={setShowGrid}>
        Show Grid
      </Menubar.CheckboxItem>
      <Menubar.CheckboxItem checked={showRulers} onCheckedChange={setShowRulers}>
        Show Rulers
      </Menubar.CheckboxItem>
      <Menubar.Separator />
      <Menubar.RadioGroup value={zoom} onValueChange={setZoom}>
        <Menubar.RadioItem value="50">50%</Menubar.RadioItem>
        <Menubar.RadioItem value="100">100%</Menubar.RadioItem>
        <Menubar.RadioItem value="200">200%</Menubar.RadioItem>
      </Menubar.RadioGroup>
    </Menubar.Content>
  </Menubar.Menu>
</Menubar>
```

## Composition

| Part | Purpose |
| --- | --- |
| `Menubar` | Wrapper |
| `Menu` | Single top-level menu |
| `Trigger` | The button label (File, Edit, etc.) |
| `Content` | The dropdown panel |
| `Item`, `CheckboxItem`, `RadioGroup`, `RadioItem` | Same as DropdownMenu |
| `Sub`, `SubTrigger`, `SubContent` | Nested submenu |
| `Label`, `Separator`, `Shortcut` | Same |

Menubar is essentially a **horizontal row of DropdownMenu triggers** with extra keyboard handling (arrow keys move between menus while open).

## Behavior

### Hover-roving (the killer feature)

Once one menu is open, hovering an adjacent Trigger opens that menu (closing the previous). This makes File → Edit → View browsing feel native.

### Click-then-hover

Clicking a Trigger when no menu is open: opens it. Subsequent hovers on triggers swap menus.

Clicking outside: closes all.

## Keyboard contract

| Key | Action |
| --- | --- |
| Tab into Menubar | Focus first Trigger |
| Tab away | Focus exits Menubar |
| `←` / `→` (when menu closed) | Move focus between Triggers |
| `Enter` / `Space` / `↓` | Open focused menu |
| `←` / `→` (when menu open) | Close current, open adjacent menu |
| `↓` / `↑` (within menu) | Navigate items |
| `Esc` | Close menu, focus stays on Trigger |
| Letter key (when menu open) | Jump to item starting with letter |
| Letter key (when no menu open + Trigger has accelerator like `_F_ile`) | Open that menu |

## States

| State | Visual |
| --- | --- |
| Resting | All triggers visible, none active |
| Trigger focus (keyboard) | Visible focus ring |
| Trigger hover | Subtle bg shift |
| Menu open | Active Trigger highlighted, panel below visible |
| Item hover | Bg highlight |
| Item disabled | Reduced opacity |
| Item destructive | Red text |

## Tokens consumed

```
--menubar-bg                    (slightly different from main bg, e.g. tinted)
--menubar-fg
--menubar-fg-muted              (separators, shortcuts)
--menubar-trigger-hover-bg
--menubar-trigger-active-bg     (when its menu is open)
--menubar-content-bg            (dropdown panel)
--menubar-item-hover-bg
--menubar-error-fg              (destructive items)
--menubar-border
--radius-md
--shadow-overlay
--space-xs, --space-sm
--font-size-sm
--motion-fast                   (open/close)
--ease-out
--z-overlay
```

## Accessibility

- Menubar wrapper: `role="menubar"`.
- Trigger: `role="menuitem"` with `aria-haspopup="true" aria-expanded`.
- Content: `role="menu"`.
- Item: `role="menuitem"` (or `menuitemcheckbox` / `menuitemradio`).
- Roving tabindex on triggers (only one tabbable at a time).
- Clear visual focus ring.
- Keyboard fully usable without mouse.

## Mobile

Menubar doesn't translate to mobile. On small screens:
- Replace with a hamburger trigger that opens a Sheet.
- Or move all actions into a CommandPalette accessible via hotkey.

## Korean apps

- 메뉴바 (menubar) typical in Korean desktop-style web apps.
- Trigger labels: 파일 / 편집 / 보기 / 도구 / 도움말 (canonical pattern from native KR software).
- 합쇼체 typical for menu items in formal apps; 해요체 for casual.
- Hangul on accelerator keys: omit underline-letter pattern (Korean characters can't be single-letter accelerators); use Cmd/Ctrl + Latin letter shortcuts.

## Code example

```tsx
function EditorHeader() {
  return (
    <header className="editor-header">
      <Logo />
      <Menubar>
        <Menubar.Menu>
          <Menubar.Trigger>파일</Menubar.Trigger>
          <Menubar.Content>
            <Menubar.Item onSelect={newDoc}>
              새 문서 <Menubar.Shortcut>⌘N</Menubar.Shortcut>
            </Menubar.Item>
            <Menubar.Item onSelect={openDoc}>
              열기... <Menubar.Shortcut>⌘O</Menubar.Shortcut>
            </Menubar.Item>
            <Menubar.Separator />
            <Menubar.Item onSelect={save}>
              저장 <Menubar.Shortcut>⌘S</Menubar.Shortcut>
            </Menubar.Item>
          </Menubar.Content>
        </Menubar.Menu>

        <Menubar.Menu>
          <Menubar.Trigger>편집</Menubar.Trigger>
          {/* ... */}
        </Menubar.Menu>

        <Menubar.Menu>
          <Menubar.Trigger>도움말</Menubar.Trigger>
          {/* ... */}
        </Menubar.Menu>
      </Menubar>
    </header>
  );
}
```

## Edge cases

- **Many menus (8+)**: feels cluttered. Group or move to CommandPalette.
- **Long menus (20+ items)**: split into submenus (e.g., File > Recent).
- **Disabled menu** (no items applicable in current context): Trigger grayed; clicking does nothing.
- **Menubar in collapsed sidebar layout**: hide Menubar entirely on narrow screens.
- **Multi-window app**: each window has its own Menubar instance with its own state.
- **Reduced motion**: skip open/close transitions.

## Don't

- Don't use Menubar in mobile-primary apps. Wrong convention.
- Don't omit shortcuts on common actions — power users expect them.
- Don't have inconsistent shortcuts (different across menus for same action).
- Don't put primary CTAs in Menubar — they should be visible buttons.
- Don't have only one menu — that's a DropdownMenu.
- Don't disable Esc to close.

## References

- shadcn-ui: [`menubar`](../docs/reference/shadcn-ui.md#menubar) (Radix)
- Patterns: macOS native menubar, VS Code, Figma desktop apps
- WAI-ARIA: [Menubar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/)

## Cross-reference

- [`examples/component-dropdown.md`](component-dropdown.md) — single-menu variant
- [`examples/component-command.md`](component-command.md) — keyboard-first alternative
- [`examples/component-navigation-menu.md`](component-navigation-menu.md) — for marketing nav
- [`knowledge/a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md)
