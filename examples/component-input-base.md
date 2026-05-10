# `InputBase` — spec (DRAFT — scaffolded 2026-05-11 via TS-AST)

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
> - **mui**: `refs/mui/packages/mui-material/src/InputBase/InputBase.d.ts` (5 interface(s), 1 component(s))

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
<InputBase>
  {children}
</InputBase>
```

### Props

| Prop | Type | Default | Required | Source(s) | Description |
| --- | --- | --- | --- | --- | --- |
| `'aria-describedby'` | `string \| undefined` | — | — | mui | (fill in) |
| `'aria-label'` | `string \| undefined` | — | — | mui | (fill in) |
| `autoComplete` | `string \| undefined` | — | — | mui | This prop helps users to fill forms faster, especially on mobile devices.
The name can be confusing, as it's more like an autofill.
You can learn more about it [following the specification](https://html.spec.whatwg.org/multipage/form-contro |
| `autoFocus` | `boolean \| undefined` | — | — | mui | If `true`, the `input` element is focused during the first mount. |
| `classes` | `Partial<InputBaseClasses> \| undefined` | — | — | mui | Override or extend the styles applied to the component. |
| `color` | `\| OverridableStringUnion< 'primary' \| 'secondary' ` | — | — | mui | The color of the component.
It supports both default and custom theme colors, which can be added as shown in the
[palette customization guide](https://mui.com/material-ui/customization/palette/#custom-colors).
The prop defaults to the value |
| `defaultValue` | `unknown` | — | — | mui | The default value. Use when the component is not controlled. |
| `disableInjectingGlobalStyles` | `boolean \| undefined` | `false` | — | mui | If `true`, GlobalStyles for the auto-fill keyframes will not be injected/removed on mount/unmount. Make sure to inject them at the top of your application.
This option is intended to help with boosting the initial rendering performance if y |
| `disabled` | `boolean \| undefined` | — | — | mui | If `true`, the component is disabled.
The prop defaults to the value (`false`) inherited from the parent FormControl component. |
| `endAdornment` | `React.ReactNode` | — | — | mui | End `InputAdornment` for this component. |
| `error` | `boolean \| undefined` | — | — | mui | If `true`, the `input` will indicate an error.
The prop defaults to the value (`false`) inherited from the parent FormControl component. |
| `fullWidth` | `boolean \| undefined` | `false` | — | mui | If `true`, the `input` will take up the full width of its container. |
| `id` | `string \| undefined` | — | — | mui | The id of the `input` element. |
| `inputComponent` | `React.ElementType<InputBaseComponentProps> \| undef` | `'input'` | — | mui | The component used for the `input` element.
Either a string to use a HTML element or a component. |
| `inputProps` | `InputBaseComponentProps \| undefined` | `{}` | — | mui | [Attributes](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input#attributes) applied to the `input` element. |
| `inputRef` | `React.Ref<any> \| undefined` | — | — | mui | Pass a ref to the `input` element. |
| `margin` | `'dense' \| 'none' \| undefined` | — | — | mui | If `dense`, will adjust vertical spacing. This is normally obtained via context from
FormControl.
The prop defaults to the value (`'none'`) inherited from the parent FormControl component. |
| `maxRows` | `string \| number \| undefined` | — | — | mui | Maximum number of rows to display when multiline option is set to true. |
| `minRows` | `string \| number \| undefined` | — | — | mui | Minimum number of rows to display when multiline option is set to true. |
| `multiline` | `boolean \| undefined` | `false` | — | mui | If `true`, a [TextareaAutosize](https://mui.com/material-ui/react-textarea-autosize/) element is rendered. |
| `name` | `string \| undefined` | — | — | mui | Name attribute of the `input` element. |
| `placeholder` | `string \| undefined` | — | — | mui | The short hint displayed in the `input` before the user enters a value. |
| `readOnly` | `boolean \| undefined` | — | — | mui | It prevents the user from changing the value of the field
(not from interacting with the field). |
| `renderSuffix` | `\| ((state: { disabled?: boolean \| undefined; error` | — | — | mui | (fill in) |
| `required` | `boolean \| undefined` | — | — | mui | If `true`, the `input` element is required.
The prop defaults to the value (`false`) inherited from the parent FormControl component. |
| `rows` | `string \| number \| undefined` | — | — | mui | Number of rows to display when multiline option is set to true. |
| `size` | `OverridableStringUnion<'small' \| 'medium', InputBa` | — | — | mui | The size of the component. |
| `slotProps` | `\| { root?: \| (React.HTMLAttributes<HTMLDivElement>` | `{}` | — | mui | The extra props for the slot components.
You can override the existing props or add new ones. |
| `slots` | `\| { root?: React.ElementType \| undefined; input?: ` | `{}` | — | mui | The components used for each slot inside. |
| `startAdornment` | `React.ReactNode` | — | — | mui | Start `InputAdornment` for this component. |
| `sx` | `SxProps<Theme> \| undefined` | — | — | mui | The system prop that allows defining system overrides as well as additional CSS styles. |
| `type` | `string \| undefined` | `'text'` | — | mui | Type of the `input` element. It should be [a valid HTML5 input type](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input#input_types). |
| `value` | `unknown` | — | — | mui | The value of the `input` element, required for a controlled component. |

### Events

| Event | Type | Source(s) | Description |
| --- | --- | --- | --- |
| `onBlur` | `React.FocusEventHandler<HTMLInputElement \| HTMLTextAreaEleme` | mui | Callback fired when the `input` is blurred.

Notice that the first argument (event) might be undefined. |
| `onChange` | `React.ChangeEventHandler<HTMLTextAreaElement \| HTMLInputElem` | mui | Callback fired when the value is changed. |
| `onFocus` | `React.FocusEventHandler<HTMLInputElement \| HTMLTextAreaEleme` | mui | (fill in) |
| `onInvalid` | `React.FormEventHandler<HTMLInputElement \| HTMLTextAreaElemen` | mui | Callback fired when the `input` doesn't satisfy its constraints. |
| `onKeyDown` | `React.KeyboardEventHandler<HTMLTextAreaElement \| HTMLInputEl` | mui | (fill in) |
| `onKeyUp` | `React.KeyboardEventHandler<HTMLTextAreaElement \| HTMLInputEl` | mui | (fill in) |

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

- Mui: [`InputBase.d.ts`](../refs/mui/packages/mui-material/src/InputBase/InputBase.d.ts)

## Cross-reference

- [`knowledge/components/INDEX.md`](../knowledge/components/INDEX.md)
- (Add 2-3 related component specs)
