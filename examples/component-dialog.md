# `Dialog` — spec (DRAFT — scaffolded 2026-05-10 via TS-AST)

> **Draft scaffold** generated from upstream sources via the TypeScript
> Compiler API. The **API table below is parsed directly from the source's
> typed declarations** — props / types / defaults / `@deprecated` markers
> are accurate and trustworthy.
>
> The **narrative sections** (when to use, anatomy, tokens, accessibility,
> edge cases, code example) are placeholders. A maintainer should fill
> them in based on actual usage and remove this banner before declaring
> the spec polished.
>
> Sources analyzed:
> - **mui**: `refs/mui/packages/mui-material/src/Dialog/Dialog.d.ts` (9 interface(s), 1 component(s))
> - **shadcn-ui**: `refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/dialog.tsx` (0 interface(s), 10 component(s))

## When to use

(Fill in: what user need does this serve? What's the canonical use case?
When to use vs sibling components?)

## Anatomy

(Fill in: ASCII diagram of the component's parts.)

```
[diagram here]
```

## API

```tsx
<Dialog>
  {children}
</Dialog>
```

### Props

| Prop | Type | Default | Required | Source(s) | Description |
| --- | --- | --- | --- | --- | --- |
| `open` | `ModalProps['open']` | — | ✓ | mui | If `true`, the component is shown. |
| `'aria-describedby'` | `string \| undefined` | — | — | mui | The id(s) of the element(s) that describe the dialog. |
| `'aria-labelledby'` | `string \| undefined` | — | — | mui | The id(s) of the element(s) that label the dialog. |
| `'aria-modal'` | `boolean \| 'true' \| 'false' \| undefined` | `true` | — | mui | Informs assistive technologies that the element is modal.
It's added on the element with role="dialog". |
| `PaperComponent` | `React.JSXElementConstructor<PaperProps> \| undefine` | `Paper` | — | mui | The component used to render the body of the dialog. |
| `children` | `React.ReactNode` | — | — | mui | Dialog children, usually the included sub-components. |
| `classes` | `Partial<DialogClasses> \| undefined` | — | — | mui | Override or extend the styles applied to the component. |
| `fullScreen` | `boolean \| undefined` | `false` | — | mui | If `true`, the dialog is full-screen. |
| `fullWidth` | `boolean \| undefined` | `false` | — | mui | If `true`, the dialog stretches to `maxWidth`.

Notice that the dialog width grow is limited by the default margin. |
| `maxWidth` | `Breakpoint \| false \| undefined` | `'sm'` | — | mui | Determine the max-width of the dialog.
The dialog width grows with the size of the screen.
Set to `false` to disable `maxWidth`. |
| `role` | `'dialog' \| 'alertdialog' \| undefined` | `'dialog'` | — | mui | The ARIA role for the dialog element.
The main dialog role is `dialog`, but `alertdialog` can be used if the content of the dialog requires immediate attention.
See https://www.w3.org/TR/wai-aria-1.2/#dialog and https://www.w3.org/TR/wai-ar |
| `scroll` | `'body' \| 'paper' \| undefined` | `'paper'` | — | mui | Determine the container for scrolling the dialog. |
| `sx` | `SxProps<Theme> \| undefined` | — | — | mui | The system prop that allows defining system overrides as well as additional CSS styles. |
| `transitionDuration` | `TransitionProps['timeout'] \| undefined` | `{
enter: theme.transitions.duration.enteringScreen,
exit: theme.transitions.duration.leavingScreen,
}` | — | mui | The duration for the transition, in milliseconds.
You may specify a single timeout for all transitions, or individually with an object. |

### Events

| Event | Type | Source(s) | Description |
| --- | --- | --- | --- |
| `onClose` | `ModalProps['onClose'] \| undefined` | mui | Callback fired when the component requests to be closed. |

## Variants

(Fill in: visual variants — size / color / shape / etc.)

## States

| State | Visual |
| --- | --- |
| Default | (fill in) |
| Hover | (fill in) |
| Focus-visible | 2px focus ring; cite [keyboard-and-focus.md](../knowledge/a11y/keyboard-and-focus.md) |
| Active | (fill in) |
| Disabled | reduced opacity; `aria-disabled="true"` |

## Tokens consumed

(Fill in. List every token this component reads. Flag missing tokens.)

```
--color-bg-default
--color-fg-default
--space-md
--radius-md
```

## Accessibility

- Semantic element: (fill in)
- ARIA: (fill in)
- Keyboard: (fill in — cite [keyboard-and-focus.md](../knowledge/a11y/keyboard-and-focus.md))
- Touch target: ≥ 44pt for primary mobile / ≥ 24px for desktop AA

## Edge cases

(Fill in 3+ edge cases.)

## Code example

```tsx
// Fill in a concrete usage example
```

## Don't

- (Fill in 2-3 specific misuses.)

## References

- Mui: [`Dialog.d.ts`](../refs/mui/packages/mui-material/src/Dialog/Dialog.d.ts)
- Shadcn-Ui: [`dialog.tsx`](../refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/dialog.tsx)

## Cross-reference

- [`knowledge/components/INDEX.md`](../knowledge/components/INDEX.md)
- (Add 2-3 related component specs)
