# `AccordionActions` - spec

> Direct upstream component: MUI `AccordionActions`. Parent pattern references: Ant Design `Collapse`, MUI `Accordion`, shadcn-ui `accordion`.

## Purpose

`AccordionActions` is the optional action row at the bottom of an expanded accordion panel. Use it for commands that apply only to the content inside that one panel, such as "Save section", "Reset", or "Learn more".

Do not use it for page-level actions. Page-level Save / Cancel belongs in the form footer or sticky page action bar.

## Anatomy

```
Accordion.Item
├── AccordionSummary          required; button that expands/collapses
├── AccordionDetails          required; body content
└── AccordionActions          optional; scoped commands for this panel
    ├── Secondary action      optional
    └── Primary action        optional
```

| Part | Required | Purpose |
| --- | --- | --- |
| Root | yes | Non-interactive row container. |
| Action item | no | Usually `Button`, `IconButton`, or link-styled command. |
| Alignment | yes | End-align actions in LTR; start/end flips in RTL via logical CSS. |

## API

```tsx
<Accordion.Item value="billing">
  <Accordion.Summary>결제 정보</Accordion.Summary>
  <Accordion.Details>
    <BillingFields />
  </Accordion.Details>
  <Accordion.Actions>
    <Button variant="ghost">초기화</Button>
    <Button>저장</Button>
  </Accordion.Actions>
</Accordion.Item>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | - | Action controls rendered in the row. |
| `classes` | `Partial<AccordionActionsClasses>` | - | Style override hooks for MUI-style implementations. |
| `disableSpacing` | `boolean` | `false` | Removes the default horizontal gap between action children. |
| `sx` | `SxProps<Theme>` | - | MUI system override. Prefer tokens for shared design-system code. |

## API choices made

- Keep the component as a thin container. It should not own action state, validation, or submit logic.
- Keep `disableSpacing` because MUI exposes it and dense admin forms sometimes need custom spacing.
- Do not add `align` unless product usage proves it is needed. End alignment is the default for commit/cancel rows.
- Do not add a `primaryAction` prop. Composition keeps button order, disabled state, and loading state explicit.

## States

| State | Trigger | Visual rule |
| --- | --- | --- |
| Default | Expanded parent panel | Top padding separates actions from body; row uses `display: flex`, `justify-content: flex-end`, gap token. |
| Hover | Mouse over child action | Container does not change; child action handles hover. |
| Focus-visible | Keyboard focus on child action | Child action shows a 2px focus ring with at least 3:1 contrast against the row background. |
| Active | Press child action | Child action handles pressed state. |
| Disabled | Child action disabled | Container unchanged; disabled action uses its own muted style and `aria-disabled` when not a native disabled control. |
| Loading | Child action loading | Loading belongs to the action button, not the container. |
| Error | Validation in panel | Show error near the field or panel summary; do not color the action row alone. |

## Tokens consumed

```
--color-bg-default
--color-border-default
--color-text-primary
--color-focus-ring
--space-sm
--space-md
--space-lg
--radius-md
```

If the row has a divider, use `--color-border-default`; do not introduce a new hairline color.

## Accessibility

- Root element is normally a `<div>` or `<footer>` inside the panel. It does not need a landmark role.
- If there are 3+ related commands, set `aria-label` on the row, for example `aria-label="결제 정보 작업"`.
- Keyboard order follows DOM order: accordion summary, details focusables, action buttons.
- Touch targets for actions must be at least 44x44 on mobile and 24x24 on desktop AA.
- Focus ring is owned by the child controls, but must remain visible against `--color-bg-default`.
- When the parent panel is collapsed, action controls must not remain tabbable.

## Layout rules

| Rule | Value |
| --- | --- |
| Direction | Row, wrap allowed only below 360px. |
| Alignment | End aligned with logical `justify-content: flex-end`. |
| Gap | `--space-sm` for dense; `--space-md` default. |
| Padding | Match `AccordionDetails` horizontal padding. |
| Divider | Optional top border when actions follow long content. |

## Code example

```tsx
<Accordion type="multiple" defaultValue={["notifications"]}>
  <Accordion.Item value="notifications">
    <Accordion.Summary>알림 설정</Accordion.Summary>
    <Accordion.Details>
      <NotificationPreferenceFields />
    </Accordion.Details>
    <Accordion.Actions aria-label="알림 설정 작업">
      <Button variant="ghost" onClick={resetNotificationPrefs}>
        기본값으로 되돌리기
      </Button>
      <Button onClick={saveNotificationPrefs} loading={isSaving}>
        저장
      </Button>
    </Accordion.Actions>
  </Accordion.Item>
</Accordion>
```

## Edge cases

- **Only one destructive action**: keep it visually separated from the primary action, and use the destructive button variant.
- **Panel contains a form**: the action row may contain `type="submit"` only if it is inside the same `<form>`.
- **Long localized labels**: allow buttons to wrap to two rows on narrow screens rather than shrinking below touch target size.
- **Nested accordions**: avoid nested action rows. Move nested commands into the nested panel content.
- **Collapsed state**: hidden actions must be removed from keyboard order via the parent accordion visibility strategy.
- **RTL**: use logical start/end spacing so action order and alignment mirror predictably.
- **Reduced motion**: no action-row-specific motion. Parent expand/collapse follows `Accordion` reduced-motion rules.

## Don't

- Don't put global page Save / Cancel only inside an accordion panel.
- Don't render more than one primary action in the row.
- Don't make the action row itself clickable.
- Don't use the row to display validation errors without field-level error text.

## References

- MUI direct source: [`refs/mui/packages/mui-material/src/AccordionActions/AccordionActions.d.ts`](../refs/mui/packages/mui-material/src/AccordionActions/AccordionActions.d.ts)
- MUI implementation: [`refs/mui/packages/mui-material/src/AccordionActions/AccordionActions.js`](../refs/mui/packages/mui-material/src/AccordionActions/AccordionActions.js)
- Parent MUI composition: [`refs/mui/packages/mui-material/src/Accordion/`](../refs/mui/packages/mui-material/src/Accordion/)
- Ant Design parent pattern: [`refs/ant-design/components/collapse/`](../refs/ant-design/components/collapse/)
- shadcn-ui parent pattern: [`refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/accordion.tsx`](../refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/accordion.tsx)
- Accessibility baseline: [`knowledge/a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md)

## Cross-reference

- [examples/component-accordion.md](component-accordion.md)
- [examples/component-button.md](component-button.md)
