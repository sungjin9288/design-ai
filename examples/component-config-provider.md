# `ConfigProvider` — spec

> Synthesized from Ant Design `ConfigProvider`, with theme-provider analogs cross-checked against MUI `ThemeProvider` / `CssBaseline` and shadcn-ui's `next-themes` + CSS-variable setup. `ConfigProvider` is the app-level configuration boundary for tokens, locale, direction, portals, and component defaults.

## When to use

- At the root of a product app, admin console, design-system preview, or package demo that needs consistent theme, locale, direction, and component defaults.
- Around an isolated subtree that must intentionally override density, disabled state, popup container, or theme tokens.
- For Korean products where locale, typography, form validation messages, and portal behavior must be consistent across modals, pickers, notifications, and tables.

When NOT to use:
- To style one component instance. Use that component's props or tokens.
- Around every page or card. Provider nesting creates unclear precedence and harder debugging.
- As a substitute for `<html lang>` / `<html dir>`. Provider context and document metadata must agree.
- For static notification/modal calls without a holder strategy; they may render outside the provider context.

## Anatomy

```
ConfigProvider
├── Theme tokens
├── Locale package
├── Direction
├── Component defaults
├── Portal / popup containers
├── CSP / style injection config
└── App subtree
```

| Part | Purpose | Required | Default if omitted |
| --- | --- | --- | --- |
| Theme | Semantic tokens, algorithms, component token overrides. | no | library defaults |
| Locale | Component language, date-related labels, validation copy hooks. | no | default library locale |
| Direction | `ltr` or `rtl` layout context. | no | `ltr` |
| Component defaults | Shared defaults such as size, disabled state, variant, and per-component config. | no | component defaults |
| Portal config | Controls where popups, dropdowns, affix/anchor targets render. | no | document body/window |
| CSP config | Supplies nonce for dynamic style behavior when CSP is enabled. | no | no nonce |
| Children | App subtree receiving context. | yes | nothing rendered |

## API

```tsx
<ConfigProvider
  locale={koKR}
  direction="ltr"
  componentSize="middle"
  theme={appTheme}
  getPopupContainer={(trigger) => trigger?.parentElement ?? document.body}
>
  <App />
</ConfigProvider>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | Subtree that consumes the provider context. |
| `theme` | `ThemeConfig` | — | Global and component-level design tokens. |
| `locale` | locale object | — | Language package for component copy and date/picker UI. |
| `direction` | `"ltr" \| "rtl"` | `"ltr"` | Layout direction. Mirror document `dir` when using RTL. |
| `componentSize` | `"small" \| "middle" \| "large"` | — | Default component density/size. |
| `componentDisabled` | `boolean` | — | Disables supported child components by default. Use for temporary locked subtrees only. |
| `variant` | `"outlined" \| "filled" \| "borderless"` | — | Default data-entry visual variant in Ant Design. |
| `virtual` | `boolean` | `true` | Enables virtual scrolling for supported long lists. |
| `prefixCls` | `string` | `"ant"` | Class prefix for microfrontend or white-label isolation. |
| `iconPrefixCls` | `string` | `"anticon"` | Icon class prefix. |
| `getPopupContainer` | `(trigger?) => HTMLElement \| ShadowRoot` | `document.body` | Popup parent for dropdown-like overlays. |
| `getTargetContainer` | `() => HTMLElement \| Window \| ShadowRoot` | `window` | Scroll target for Affix / Anchor style components. |
| `popupMatchSelectWidth` | `boolean \| number` | library default | Select dropdown width behavior; `false` can also disable virtual scroll. |
| `popupOverflow` | `"viewport" \| "scroll"` | `"viewport"` | Popup overflow strategy for select-like components. |
| `renderEmpty` | `(componentName) => ReactNode` | — | Shared empty state renderer. |
| `csp` | `{ nonce: string }` | — | Nonce for dynamic style injection under strict CSP. |
| `button`, `form`, `input`, `select`, `table`, ... | component config objects | — | Per-component default props, classNames, styles, icons, and behavior hooks. |
| `warning` | `{ strict: boolean }` | — | Warning aggregation behavior for deprecated usage. |

Static helpers:

| API | Purpose |
| --- | --- |
| `ConfigProvider.config(...)` | Sets global static config such as prefix, icon prefix, theme, and holder rendering for static APIs. |
| `ConfigProvider.useConfig()` | Reads current component disabled and size context for custom wrappers. |

## API choices made

- Use one root provider as the default. Nested providers are allowed only for scoped overrides such as embedded previews, RTL examples, or disabled demo blocks.
- Keep token ownership in `theme`; avoid raw CSS overrides in every component config unless the upstream component exposes a semantic slot that needs a default.
- Use `componentSize` to express product density, not ad hoc per-component padding. Korean consumer/mobile UIs can be denser, but touch targets still need 44x44 on mobile.
- Treat `getPopupContainer` as infrastructure. It should solve clipping, Shadow DOM, or modal stacking problems without breaking focus management.
- Prefer hook/holder-based static APIs so messages, notifications, and confirms inherit provider context.

## Configuration modes

| Mode | Use | Required checks |
| --- | --- | --- |
| Default app shell | Product-wide tokens, locale, density, popup behavior. | Contrast, focus rings, portal stack, SSR hydration. |
| Korean locale | `locale={koKR}` plus Korean typography and validation copy. | `<html lang="ko">`, date formats, form errors, IME behavior. |
| RTL preview | Arabic/Hebrew preview or component QA. | `<html dir="rtl">`, icon mirroring, placement names, keyboard order. |
| Locked subtree | Temporarily disabled controls during maintenance or pending workflow. | Explain disabled reason and keep readable text contrast. |
| Microfrontend | Prefix class names and portal targets. | CSS isolation, z-index, duplicate baseline, static API context. |

## Tokens consumed

```css
--color-primary-default
--color-primary-hover
--color-bg-default
--color-bg-elevated
--color-text-primary
--color-text-muted
--color-border-default
--color-focus-ring
--font-family-body
--font-size-body
--line-height-body
--radius-md
--motion-fast
--z-popover
--z-modal
--density-scale
```

## Accessibility

- **Contrast**: provider theme must guarantee 4.5:1 body text contrast and 3:1 focus/outline/UI contrast across every supported color scheme.
- **Focus**: portal components rendered through `getPopupContainer` must keep focus trap, Escape handling, and restore-focus behavior.
- **Locale**: provider locale does not replace document metadata. Set `<html lang="ko">` for Korean products and align date/number formatting with the locale.
- **Direction**: provider `direction="rtl"` should be paired with document `dir="rtl"` in full-app RTL mode. Direction-only demos may scope it locally but must test placement and icon mirroring.
- **Disabled subtree**: a globally disabled area still needs readable text and explanation. Do not hide disabled controls from assistive tech if they communicate state.
- **CSP**: when strict CSP is enabled, configure `csp.nonce` so dynamic style effects do not silently fail.
- **Motion**: theme motion tokens must respect `prefers-reduced-motion`; provider-level theme changes should not animate every component unless explicitly allowed.

## Code example — Korean product shell

```tsx
import { ConfigProvider, App as AntApp } from "antd";
import koKR from "antd/locale/ko_KR";

const appTheme = {
  token: semanticTokens,
  components: {
    Button: {
      borderRadius: semanticRadii.control,
    },
    Form: {
      itemMarginBottom: semanticSpacing.formRow,
    },
  },
};

export function ProductRoot() {
  return (
    <ConfigProvider
      locale={koKR}
      direction="ltr"
      componentSize="middle"
      theme={appTheme}
      getPopupContainer={(trigger) => trigger?.parentElement ?? document.body}
      renderEmpty={() => <EmptyState tone="quiet" title="표시할 데이터가 없습니다" />}
    >
      <AntApp>
        <AppRoutes />
      </AntApp>
    </ConfigProvider>
  );
}
```

## Edge cases

- **Static messages and confirms**: imperative APIs can render outside the React subtree. Use holder/hook patterns or configure `holderRender` so theme, prefix, and locale are inherited.
- **Portal clipping**: setting popup containers to a scroll parent can fix clipping but may break modal stacking. Verify Select, DatePicker, Tooltip, Popover, and Modal together.
- **SSR hydration**: theme algorithms, color mode, and generated class prefixes must match server and client output.
- **Nested providers**: inner overrides win locally, which is useful for demos but dangerous in production flows. Document every intentional nested provider.
- **Virtual scroll**: disabling virtual scroll may improve screen-reader predictability for small lists, but large datasets need virtualization for performance.
- **Prefix changes**: changing `prefixCls` after components are mounted can break snapshots, styles, and static APIs. Treat it as boot-time config.

## Don't

- Don't use `ConfigProvider` to patch one misaligned button.
- Don't put raw color values into component configs when semantic tokens exist.
- Don't assume provider locale changes native browser date/number formatting automatically.
- Don't point every popup to `trigger.parentElement` without a `document.body` fallback.
- Don't rely on provider `componentDisabled` for authorization. Security checks belong on the server and in route/action logic.

## References

- Ant Design: [`config-provider/index.en-US.md`](../docs/reference/ant-design.md#config-provider), [`config-provider/index.tsx`](../docs/reference/ant-design.md#config-provider), [`config-provider/context.ts`](../docs/reference/ant-design.md#config-provider), [`app/index.en-US.md`](../docs/reference/ant-design.md#app)
- MUI: [`ThemeProvider.tsx`](../docs/reference/mui.md#styles), [`CssBaseline.js`](../docs/reference/mui.md#css-baseline)
- shadcn-ui: [`theme-provider.tsx`](../docs/reference/shadcn-ui.md), [`globals.css`](../docs/reference/shadcn-ui.md)
- Knowledge: [`design-tokens/ant-design.md`](../knowledge/design-tokens/ant-design.md), [`a11y/contrast.md`](../knowledge/a11y/contrast.md), [`i18n/korean-product-conventions.md`](../knowledge/i18n/korean-product-conventions.md)
- Cross-reference: [`component-css-baseline.md`](component-css-baseline.md), [`component-empty-state.md`](component-empty-state.md), [`component-form.md`](component-form.md)
