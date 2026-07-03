# `CssBaseline` — spec

> Synthesized from MUI `CssBaseline`, with theme-provider patterns cross-checked against Ant Design `ConfigProvider` and shadcn-ui global CSS variables. `CssBaseline` is an app-shell reset and baseline layer, not a visible component.

## When to use

- At the root of an app, documentation site, design-system preview, or embedded product shell that needs one predictable global baseline.
- When typography, background, body margin, `box-sizing`, and color-scheme behavior must align with the active theme.
- Before authoring component specs or examples that assume semantic tokens are present.

When NOT to use:
- Inside repeated components, cards, modals, or individual pages.
- As a replacement for component-level tokens.
- In a microfrontend without agreeing on reset ownership with the host app.
- To erase browser focus outlines or form-control semantics.

## Anatomy

```
CssBaseline
├── html baseline
├── universal box-sizing inheritance
├── body typography / color / background
├── optional color-scheme integration
├── theme style overrides
└── children passthrough
```

| Part | Purpose | Required | Default if omitted |
| --- | --- | --- | --- |
| `html` rules | Font smoothing, `box-sizing`, text-size adjustment, optional `color-scheme`. | yes | installed by baseline |
| Universal box sizing | Makes descendants inherit `border-box`. | yes | installed by baseline |
| `body` rules | Removes margin and applies theme text/background + body typography. | yes | installed by baseline |
| Print rule | Uses a print-safe background. | yes | installed by baseline |
| Children | Lets the baseline wrap an app subtree. | no | renders global styles only |

## API

```tsx
<ThemeProvider theme={theme}>
  <CssBaseline enableColorScheme />
  <AppShell />
</ThemeProvider>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | Optional subtree rendered after global styles. Prefer placing app content as a sibling for clarity. |
| `enableColorScheme` | `boolean` | `false` | Applies CSS `color-scheme` from the active theme mode or color scheme. |

## API choices made

- Keep the API intentionally tiny. Global reset behavior should be configured through theme tokens and theme overrides, not per-instance props.
- Prefer one root-level baseline per rendering island. Multiple baselines can duplicate global style tags and make debug order harder.
- Enable `color-scheme` only when light/dark tokens have been recomputed and tested. It affects native controls, scrollbars, and form affordances.
- Treat baseline as infrastructure. Product teams should not customize it to solve one-page layout problems.

## Baseline contract

| Area | Rule |
| --- | --- |
| Box model | `html` uses `border-box`; all elements and pseudo-elements inherit it. |
| Body margin | Body margin is zero so app shells own spacing explicitly. |
| Typography | Body text inherits the theme's body typography token. Korean-heavy apps should use the Korean line-height rule from the typography knowledge base. |
| Color | Body foreground/background come from semantic tokens, not raw color values. |
| Bold text | `strong` and `b` use the theme bold weight. |
| Print | Body background becomes print-safe so large tinted app backgrounds do not waste ink. |
| Backdrop | Fullscreen backdrop inherits the app background for browser fullscreen cases. |

## Tokens consumed

```css
--color-bg-default
--color-text-primary
--color-bg-print
--font-family-body
--font-size-body
--line-height-body
--font-weight-bold
--color-scheme
```

## Accessibility

- **Contrast**: `--color-text-primary` on `--color-bg-default` must meet at least 4.5:1 for body text; UI outlines and separators must meet at least 3:1.
- **Focus**: never remove outlines or focus-visible styles in baseline. Component focus rings must remain visible above the baseline background.
- **Zoom**: do not disable browser zoom. Text-size adjustment should not prevent users from increasing text.
- **Native controls**: when `enableColorScheme` is on, verify checkboxes, selects, scrollbars, date inputs, and autofill in both light and dark themes.
- **Reduced motion**: baseline may define default motion tokens, but it must not introduce page-level animation. Motion belongs to components and must respect `prefers-reduced-motion`.
- **Language**: baseline does not set document language. Korean apps still need `<html lang="ko">`.

## Code example — root baseline

```tsx
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";

export function RootApp() {
  return (
    <ThemeProvider theme={appTheme}>
      <CssBaseline enableColorScheme />
      <AppShell />
    </ThemeProvider>
  );
}
```

```css
html {
  box-sizing: border-box;
}

*, *::before, *::after {
  box-sizing: inherit;
}

body {
  margin: 0;
  color: var(--color-text-primary);
  background: var(--color-bg-default);
  font-family: var(--font-family-body);
  font-size: var(--font-size-body);
  line-height: var(--line-height-body);
}
```

## Edge cases

- **Microfrontends**: one shell should own baseline. Child apps can consume tokens but should not inject a competing reset unless isolated by Shadow DOM.
- **SSR ordering**: global baseline styles must load before component styles that depend on them; otherwise first paint may show mismatched background or margin.
- **Dark mode**: do not invert colors mechanically. Recompute semantic tokens and then enable `color-scheme`.
- **Third-party widgets**: global `box-sizing` can affect embedded widgets. Put third-party surfaces inside an isolation wrapper if needed.
- **Print**: verify invoices, receipts, and reports. Product apps often need print-specific layout beyond baseline background.
- **Korean typography**: set body line-height around 1.6 for Hangul-heavy reading surfaces, while dense product controls can use tighter component-specific rhythm.

## Don't

- Don't mount `CssBaseline` inside every route or layout segment.
- Don't use baseline overrides to style one component family.
- Don't remove focus outlines, resize behavior, or native control affordances globally.
- Don't define raw colors in baseline; use semantic tokens and check contrast.

## References

- MUI: [`CssBaseline.d.ts`](../docs/reference/mui.md#css-baseline), [`CssBaseline.js`](../docs/reference/mui.md#css-baseline), [`ThemeProvider.tsx`](../docs/reference/mui.md#styles)
- Ant Design: [`config-provider/index.en-US.md`](../docs/reference/ant-design.md#config-provider), [`theme/index.tsx`](../docs/reference/ant-design.md#theme)
- shadcn-ui: [`theme-provider.tsx`](../docs/reference/shadcn-ui.md), [`globals.css`](../docs/reference/shadcn-ui.md)
- Knowledge: [`a11y/contrast.md`](../knowledge/a11y/contrast.md), [`i18n/korean-typography.md`](../knowledge/i18n/korean-typography.md), [`design-tokens/tailwind-v4.md`](../knowledge/design-tokens/tailwind-v4.md)
