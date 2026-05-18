# `BorderBeam` — spec

> Synthesized from Ant Design `BorderBeam`, with host-surface guidance cross-checked against MUI `Paper` / `Card` and shadcn-ui `Card`. `BorderBeam` is a decorative emphasis layer, not a semantic status, focus, or validation border.

## When to use

- A single container needs controlled visual emphasis: featured AI panel, recommended card, login panel, onboarding highlight, or primary dashboard module.
- The surface already has a clear semantic role and the beam only increases visual salience.
- The child host is a real DOM element or a component that forwards its ref to a DOM element.

When NOT to use:
- Validation, focus, selected, error, success, warning, or destructive state. Use semantic border/status tokens instead.
- Dense dashboards with many cards. More than one or two beams on a viewport reads as noise.
- Motion-sensitive or high-focus workflows where a moving border competes with reading or data entry.
- Containers whose root cannot provide a stable DOM ref, position context, or border radius.

## Anatomy

```
BorderBeam
├── Child host element
│   ├── Existing surface content
│   └── Beam effect layer (portal, aria-hidden)
└── Gradient / inset / radius CSS variables
```

| Part | Purpose | Required | Default if omitted |
| --- | --- | --- | --- |
| Child host | The decorated element that receives the portal layer. | yes | Plain text or non-ref children render without the beam. |
| Beam effect layer | Absolutely-positioned visual border effect inside the host. | internal | Hidden until browser support and host resolution pass. |
| Gradient | Beam color or gradient stops. | no | Uses primary theme gradient. |
| Inset offset | Moves the effect outward from the host edge. | no | Inferred from host border width. |
| Radius bridge | Mirrors the host border radius for alignment. | internal | Reads computed radius during initialization. |

## API

```tsx
<BorderBeam
  color={[
    { color: "var(--color-primary-default)", percent: 0 },
    { color: "var(--color-accent-default)", percent: 100 },
  ]}
  outset={0}
>
  <section className="featured-panel">
    <h2>AI review ready</h2>
    <p>3 design-system risks need review.</p>
  </section>
</BorderBeam>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | Decorated content. Must resolve to a single host DOM element for the beam to render. |
| `color` | `string \| { color: string; percent: number }[]` | theme primary gradient | Solid beam color or ordered gradient stops. `percent` is authored as `0` to `100`; implementation maps it into the visible beam segment. |
| `outset` | `number \| string` | host border width | Offset from the container edge. Use `0` when the host clips overflow or already owns a visible border. |
| `className` | `string` | — | Class applied to the beam effect layer, not the child host. |
| `style` | `CSSProperties` | — | Inline styles for the beam effect layer, including custom CSS variables. |
| `prefixCls` | `string` | design-system prefix | Advanced namespace override. Prefer provider-level configuration. |

## API choices made

- Keep the API intentionally small. `BorderBeam` should decorate a surface; it should not become a full Card variant system.
- Keep `color` as either one semantic token string or explicit gradient stops. Do not add `intent="success"` / `intent="error"` because that would imply semantic status.
- Treat `outset` as an alignment escape hatch. Most product code should rely on host border inference or set `outset={0}` for clipped cards.
- Do not expose speed, direction, or looping props by default. Constant decorative motion should be rare, reduced-motion-safe, and globally governed by motion tokens.

## States

| State | Trigger | Visual / behavior |
| --- | --- | --- |
| Default | Host resolves and browser supports required CSS masking / offset-path | Beam layer renders around the host, `pointer-events: none`, `aria-hidden="true"`. |
| Unsupported CSS | Browser lacks mask or offset-path support | Beam stays hidden; child content remains unchanged. |
| Missing host | Plain text, fragment, non-ref component, or SVG child | Beam is skipped; child content still renders. |
| Hover | Pointer over host | No built-in change. Host component may own its normal hover state. |
| Focus-visible | Keyboard focus on host or child control | Beam must not replace the 2px focus ring. Focus ring keeps at least 3:1 contrast per `keyboard-and-focus.md`. |
| Active | Pointer / keyboard activation on host content | No built-in change. Interactive child components own active feedback. |
| Disabled | Disabled content inside host | Beam should usually be removed; a disabled surface should not attract attention. |
| Loading | Async content inside host | Keep only if it helps identify the active module; never use the beam as loading progress. |
| Error | Error content inside host | Remove or recolor through semantic error UI; do not use decorative beam as the only error indicator. |
| Reduced motion | `prefers-reduced-motion: reduce` | Hide the moving effect or freeze it into a non-moving border highlight. |

## Variants

### Emphasis level

| Level | Use | Visual rule |
| --- | --- | --- |
| `subtle` | Secondary highlight, recommendation card | Low-opacity token gradient, no extra shadow. |
| `default` | One primary featured surface | Primary to accent gradient, one beam per viewport region. |
| `campaign` | Marketing or onboarding hero module | Stronger gradient is allowed, but still respects reduced motion and contrast. |

### Host surface

| Host | Rule |
| --- | --- |
| Card / Paper | Put radius and `position: relative` on the actual root element. |
| Button / link card | Keep the focus ring outside or above the beam; do not rely on the beam for focus. |
| Modal / dialog | Avoid except for onboarding. Motion around modal edges can distract from the task. |
| Data table / form | Avoid. Continuous motion is disruptive for scanning and input. |

## Tokens consumed

```css
--color-primary-default
--color-primary-hover
--color-accent-default
--color-focus-ring
--color-border-emphasis
--radius-md
--radius-lg
--border-width-sm
--motion-duration-slow
--motion-easing-linear
```

If your design system does not have `--color-border-emphasis`, map the default beam to primary/accent tokens and keep semantic status tokens separate.

## Accessibility

- **Semantics**: the beam layer is decorative and must render with `aria-hidden="true"`.
- **Keyboard**: `BorderBeam` itself is not focusable and adds no keyboard behavior. Any interactive child keeps its native keyboard contract.
- **Focus**: never use the moving beam as focus indication. Interactive descendants need a visible 2px focus ring with at least 3:1 contrast against adjacent colors.
- **Reduced motion**: hide the moving beam for `prefers-reduced-motion: reduce`, or replace it with a static border. This follows `motion/principles.md`.
- **Pointer behavior**: the effect layer uses `pointer-events: none` so it cannot block clicks, text selection, or hover states on the host.
- **Contrast**: because the beam is decorative, it does not carry required information. If a design uses border color to communicate state, provide text/icon redundancy and at least 3:1 non-text contrast.
- **Screen readers**: no announcement is needed for beam appearance. Announce only the actual state or content change inside the host.
- **Touch target**: if the decorated host is interactive, keep the host target at least 44x44 on mobile and at least 24x24 for WCAG 2.2 AA web minimum.

## Code example — featured module

```tsx
type FeaturedModuleProps = {
  title: string;
  description: string;
  action: React.ReactNode;
};

export function FeaturedModule({ title, description, action }: FeaturedModuleProps) {
  return (
    <BorderBeam
      color={[
        { color: "var(--color-primary-default)", percent: 0 },
        { color: "var(--color-accent-default)", percent: 100 },
      ]}
      outset={0}
    >
      <section className="featured-module" aria-labelledby="featured-module-title">
        <div>
          <h2 id="featured-module-title">{title}</h2>
          <p>{description}</p>
        </div>
        {action}
      </section>
    </BorderBeam>
  );
}
```

```css
.featured-module {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
  background: var(--color-bg-elevated);
}

.featured-module:focus-within {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .ant-border-beam::before {
    display: none;
  }
}
```

## Edge cases

- **Non-ref child**: function components must forward a ref to the real DOM root, or the beam cannot mount.
- **Plain text / fragment**: render content without decoration. Do not wrap automatically because it can change layout and semantics.
- **Static positioning**: the beam may inject, but deterministic placement needs `position: relative` on the host.
- **Overflow clipping**: use `outset={0}` when the host has `overflow: hidden`; negative offsets can be clipped unpredictably.
- **Changing radius**: radius is read during initialization. If responsive or state-driven radius changes matter, set the final radius on the host before mount or remount the decorated host.
- **Custom gradient stops**: clamp authored `percent` to `0..100`; preserve a transparent tail so the beam has a visible fade.
- **RTL**: the decorative direction does not need semantic mirroring. If brand motion direction matters, define it in the motion system rather than per component.
- **Print**: hide the beam in print; decorative motion and gradients do not belong on invoices, reports, or contracts.
- **Korean B2B sensitive-data surfaces**: use sparingly. One highlighted review panel is acceptable; continuous decoration around HR or payroll forms can reduce perceived seriousness.

## Don't

- Don't use `BorderBeam` as a substitute for focus-visible, selected, validation, or status borders.
- Don't decorate every card in a grid.
- Don't pass literal brand hex values in product code; use semantic color tokens.
- Don't wrap a component that cannot forward a DOM ref and then treat the missing beam as a rendering bug.
- Don't animate around long-form reading, tables, or data-entry forms unless the user explicitly requested a guided highlight.

## References

- Ant Design: [`BorderBeam.tsx`](../refs/ant-design/components/border-beam/BorderBeam.tsx), [`BorderBeamEffect.tsx`](../refs/ant-design/components/border-beam/BorderBeamEffect.tsx), [`border-beam/index.en-US.md`](../refs/ant-design/components/border-beam/index.en-US.md), [`border-beam/style/index.ts`](../refs/ant-design/components/border-beam/style/index.ts)
- MUI: [`Paper.d.ts`](../refs/mui/packages/mui-material/src/Paper/Paper.d.ts), [`Card.d.ts`](../refs/mui/packages/mui-material/src/Card/Card.d.ts)
- shadcn-ui: [`card.tsx`](../refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/card.tsx)
- Knowledge: [`a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md), [`motion/principles.md`](../knowledge/motion/principles.md), [`components/INDEX.md`](../knowledge/components/INDEX.md)
- Cross-reference: [`component-card.md`](component-card.md), [`component-paper.md`](component-paper.md), [`component-button-base.md`](component-button-base.md)
