# `ButtonBase` — spec

> Synthesized from MUI `ButtonBase`, with public action-button guidance cross-checked against Ant Design `Button` and shadcn-ui `Button`. `ButtonBase` is a low-level interactive primitive for building design-system controls, not a product-facing component.

## When to use

- Building a new design-system primitive such as `IconButton`, `CardActionArea`, `ListItemButton`, `Tab`, `StepButton`, or a toolbar control.
- You need native button/link semantics, focus-visible handling, disabled behavior, and optional press/ripple feedback without inheriting a visual Button style.
- You are authoring a library layer where the consumer owns the visual treatment.

When NOT to use:
- Product actions such as "저장", "결제하기", or "삭제" — use `Button`.
- Icon-only actions — use `IconButton` so the accessible name, size, and variant contract are already enforced.
- Links inside body copy — use `Link`.
- Toggle formatting controls — use `Toggle` / `ToggleGroup`.

## Anatomy

```
ButtonBase
├── Root interactive element (`button` by default)
├── Focus-visible state bridge
├── Optional TouchRipple layer
└── Children
```

| Part | Purpose | Required | Default if omitted |
| --- | --- | --- | --- |
| Root | Receives events, disabled state, `tabIndex`, and semantic element choice. | yes | `<button type="button">` |
| Focus-visible bridge | Applies keyboard-only focus state and exposes `onFocusVisible`. | yes | internal state/class |
| TouchRipple | Optional visual feedback layer for pointer/keyboard press. | no | rendered unless ripple is disabled |
| Children | The visual content supplied by the composed component. | no | empty interactive shell; avoid in product code |

## API

```tsx
<ButtonBase
  component="button"
  type="button"
  focusVisibleClassName="focus-visible"
  onFocusVisible={handleFocusVisible}
>
  <span className="toolbar-button-content">정렬</span>
</ButtonBase>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | Visual content. The composed component must provide text or an accessible label. |
| `component` | `React.ElementType` | `"button"` | Root element override. Use sparingly and preserve keyboard behavior. |
| `href` | `string` | — | Switches the root toward link behavior in MUI's overload. |
| `LinkComponent` | `React.ElementType` | `"a"` | Router-aware link component when `href` / `to` is present. |
| `type` | `string` | `"button"` | Native button type. Keep the default unless submitting a form intentionally. |
| `disabled` | `boolean` | `false` | Removes interaction. Non-native roots still need `aria-disabled` handling. |
| `tabIndex` | `number` | `0` | Keyboard order override. Avoid positive values. |
| `focusVisibleClassName` | `string` | — | Class applied for keyboard focus-visible styling. |
| `onFocusVisible` | `(event) => void` | — | Fires when focus was reached through keyboard-like interaction. |
| `action` | `ref` | — | Imperative handle; supports `focusVisible()`. |
| `centerRipple` | `boolean` | `false` | Centers ripple instead of starting from pointer location. |
| `focusRipple` | `boolean` | `false` | Adds keyboard-focus ripple feedback. |
| `disableRipple` | `boolean` | `false` | Removes ripple. Must be paired with an explicit focus-visible visual. |
| `disableTouchRipple` | `boolean` | `false` | Removes touch ripple while keeping other focus behavior. |
| `TouchRippleProps` | `object` | — | Props passed to the ripple layer. Treat as advanced. |
| `touchRippleRef` | `ref` | — | Imperative access to ripple actions. Treat as internal. |
| `nativeButton` | `boolean` | inferred | Declares whether a custom component renders a real `<button>`. |
| `sx` / `classes` | system styles | — | MUI-specific style extension points. Prefer local component tokens in this repo. |

## API choices made

- Keep `ButtonBase` **advanced/internal**. Product teams should rarely import it directly because it has no visible affordance by itself.
- Preserve MUI's polymorphic `component` / `LinkComponent` model, but document it as a semantic responsibility: if the root is not a native button or anchor, the wrapper must recreate keyboard activation and ARIA state.
- Do not expose visual variants here. Variants belong to composed controls (`Button`, `IconButton`, `Toggle`) so the primitive stays stable.
- Treat ripple as optional decoration. Focus-visible is mandatory whether ripple is on or off.

## States

| State | Trigger | Visual / behavior |
| --- | --- | --- |
| Default | resting | Transparent reset; composed component owns size, color, and layout. |
| Hover | pointer hover | Optional consumer style using `--color-bg-action-hover`; not defined by the base. |
| Focus-visible | keyboard focus | 2px outline using `--color-focus-ring`, offset 2px, contrast at least 3:1 against adjacent surfaces. |
| Active | pointer or keyboard press | Optional pressed layer or ripple; do not rely on motion alone. |
| Disabled | `disabled` | Remove pointer activation, suppress ripple, expose disabled semantics. |
| Link mode | `href` / `to` | Behaves as navigation; do not attach form-submit semantics. |

## Tokens consumed

`ButtonBase` itself should consume only primitive interaction tokens. Composed controls map these to real visual tokens.

```css
--color-focus-ring
--color-bg-action-hover
--color-bg-action-active
--color-text-primary
--space-1
--space-2
--radius-sm
--motion-fast
--easing-out
```

## Accessibility

- **Semantic element**: default to `<button type="button">`; use `<a>` only for navigation.
- **Keyboard**: `Tab` reaches the control, `Enter` and `Space` activate button semantics. Custom roots must implement both keys.
- **Focus**: visible focus is non-negotiable. If `disableRipple` is true, add a separate focus-visible style; otherwise keyboard users lose the only visible cue.
- **Disabled**: native `disabled` is enough for real buttons; custom roots need `aria-disabled="true"`, suppressed events, and removal from activation shortcuts.
- **Touch target**: composed controls must provide at least 44x44 mobile hit area and at least 24x24 WCAG AA web target size.
- **Name**: icon-only composition requires `aria-label`; decorative icons inside a text label need `aria-hidden="true"`.
- **Toggle state**: expose `aria-pressed` only for two-state buttons. Do not put `aria-selected` on generic buttons.

## Code example — design-system toolbar button

```tsx
type ToolbarButtonProps = {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
  children: React.ReactNode;
};

export function ToolbarButton({
  label,
  selected = false,
  disabled = false,
  onPress,
  children,
}: ToolbarButtonProps) {
  return (
    <ButtonBase
      type="button"
      disabled={disabled}
      aria-label={label}
      aria-pressed={selected}
      focusVisibleClassName="toolbar-button-focus-visible"
      className="toolbar-button"
      onClick={onPress}
    >
      {children}
    </ButtonBase>
  );
}
```

```css
.toolbar-button {
  min-width: 44px;
  min-height: 44px;
  border-radius: var(--radius-sm);
  color: var(--color-text-primary);
}

.toolbar-button:hover {
  background: var(--color-bg-action-hover);
}

.toolbar-button[aria-pressed="true"] {
  background: var(--color-bg-action-active);
}

.toolbar-button-focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}
```

## Edge cases

- **Inside a form**: omit `type` and a native button may submit unexpectedly in some wrappers. Keep `type="button"` for non-submit actions.
- **Router links**: pass a router-aware `LinkComponent`, but keep anchor semantics when the action navigates.
- **Disabled links**: anchors do not support native `disabled`; use `aria-disabled`, remove `href` or intercept activation, and keep the visual disabled state.
- **Nested interactive children**: never put another button, input, select, or link inside `ButtonBase`.
- **No ripple**: disabling ripple is fine for quiet UIs, but the focus-visible ring must still be explicit.
- **Korean dense toolbars**: reduce visual padding if needed, but keep the hit target through invisible padding or `::before` hit area.

## Don't

- Don't import `ButtonBase` in product pages when `Button`, `IconButton`, or `Link` fits.
- Don't render a `<div>` root unless you also implement role, tab stop, disabled suppression, and keyboard activation.
- Don't remove focus outlines globally to make ripple the only state indicator.
- Don't use ripple or pressed animation as the only selected-state signal.

## References

- MUI: [`ButtonBase.d.ts`](../refs/mui/packages/mui-material/src/ButtonBase/ButtonBase.d.ts), [`ButtonBase.js`](../refs/mui/packages/mui-material/src/ButtonBase/ButtonBase.js), [`useButtonBase.ts`](../refs/mui/packages/mui-material/src/ButtonBase/useButtonBase.ts)
- Ant Design: [`Button.tsx`](../refs/ant-design/components/button/Button.tsx), [`button/index.en-US.md`](../refs/ant-design/components/button/index.en-US.md)
- shadcn-ui: [`button.tsx`](../refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/button.tsx)
- Knowledge: [`a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md), [`layout/spacing-and-grid.md`](../knowledge/layout/spacing-and-grid.md)
- Cross-reference: [`component-button.md`](component-button.md), [`component-icon-button.md`](component-icon-button.md), [`component-toggle.md`](component-toggle.md)
