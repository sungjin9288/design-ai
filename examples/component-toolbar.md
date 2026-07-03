# `Toolbar` — spec

> Synthesized from MUI `Toolbar`. A horizontal container for buttons + controls — the action row in app bars, editors, dialog footers.

## When to use

- Top-bar toolbar in app shells (next to logo).
- Editor / canvas toolbar (formatting buttons, tools).
- Dialog action footers (Confirm / Cancel buttons).
- Anywhere a horizontal cluster of related controls lives.

When NOT to use:
- Single button (use Button alone).
- Navigation menus (use NavigationMenu / Menubar).

## Anatomy

```
[Logo]   [⚙][↶][↷][·][B][I][U][·][🔗]   [Save] [Close]
   left              center                       right
```

Three slots: leading / main / trailing. Items spaced via gap or `space-between` justification.

## API

```tsx
<Toolbar>
  <IconButton aria-label="설정"><SettingsIcon /></IconButton>
  <IconButton aria-label="실행 취소"><UndoIcon /></IconButton>
  <Separator orientation="vertical" />
  <ToggleGroup type="multiple">
    <ToggleGroup.Item value="bold"><BoldIcon /></ToggleGroup.Item>
    <ToggleGroup.Item value="italic"><ItalicIcon /></ToggleGroup.Item>
  </ToggleGroup>
  <Box flex={1} />  {/* push right */}
  <Button>Save</Button>
</Toolbar>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `"default" \| "compact" \| "dense"` | `"default"` | Padding density |
| `disableGutters` | `boolean` | `false` | Remove horizontal padding |
| `as` | element | `"div"` | Render as |

## States

Stateless. Children carry their own states.

## Tokens consumed

```
--toolbar-bg
--toolbar-fg
--toolbar-border-bottom            (when used as app bar)
--toolbar-min-height               (typically 56-64px)
--space-sm                         (item gap)
```

## Accessibility

- `role="toolbar" aria-label="..."` on the Toolbar wrapper. Required.
- Each child remains independently focusable.
- Roving tabindex (optional): only one child tabbable at a time; arrow keys move focus among children. Standard for editor toolbars.
- Touch target ≥ 44pt for primary mobile.

## Korean labels

- 도구 모음 (toolbar) — Korean term, rarely user-visible
- 편집 / 보기 / 삽입 — typical menu / toolbar action names
- aria-label in Korean for icon-only buttons

## Code example — editor toolbar

```tsx
<Toolbar role="toolbar" aria-label="텍스트 서식">
  <IconButton aria-label="실행 취소" onClick={undo}><UndoIcon /></IconButton>
  <IconButton aria-label="다시 실행" onClick={redo}><RedoIcon /></IconButton>
  <Separator orientation="vertical" />
  <ToggleGroup type="multiple" value={formats} onValueChange={setFormats}>
    <ToggleGroup.Item value="bold" aria-label="굵게"><BoldIcon /></ToggleGroup.Item>
    <ToggleGroup.Item value="italic" aria-label="기울임"><ItalicIcon /></ToggleGroup.Item>
    <ToggleGroup.Item value="underline" aria-label="밑줄"><UnderlineIcon /></ToggleGroup.Item>
  </ToggleGroup>
</Toolbar>
```

## Don't

- Don't omit `role="toolbar"` for accessibility.
- Don't pile up 20+ controls — group via overflow menu.
- Don't make Toolbar height inconsistent across pages.

## References

- MUI: [`Toolbar`](../docs/reference/mui.md#toolbar)
- WAI-ARIA: [Toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/)

## Cross-reference

- [`examples/component-app-bar.md`](component-app-bar.md) — top app bar pattern
- [`examples/component-button-group.md`](component-button-group.md) — joined button cluster
- [`examples/component-toggle.md`](component-toggle.md) — formatting toggles
