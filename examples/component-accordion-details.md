# `AccordionDetails` - spec

> Direct upstream component: MUI `AccordionDetails`. Parent pattern references: Ant Design `Collapse`, MUI `Accordion`, shadcn-ui `accordion`.

## Purpose

`AccordionDetails` is the body container for the expanded content of one accordion item. It holds text, forms, lists, or supporting controls that are disclosed by `AccordionSummary`.

Use it when content is secondary until the user chooses to expand the section. Keep critical information visible outside the accordion.

## Anatomy

```
Accordion.Item
├── AccordionSummary       expands/collapses the section
└── AccordionDetails       revealed body region
    ├── Body content
    ├── Inline controls
    └── Optional nested layout
```

| Part | Required | Purpose |
| --- | --- | --- |
| Root | yes | Body wrapper linked to the summary through the parent item. |
| Content | yes | Any readable or interactive content. |
| Region semantics | parent-owned | `role="region"` and labels usually belong to the collapsible content wrapper, not an inner styling div. |

## API

```tsx
<Accordion.Item value="security">
  <Accordion.Summary>보안</Accordion.Summary>
  <Accordion.Details>
    <p>2단계 인증과 로그인 알림을 관리합니다.</p>
    <SecuritySettings />
  </Accordion.Details>
</Accordion.Item>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | - | Body content for the expanded panel. |
| `classes` | `Partial<AccordionDetailsClasses>` | - | Style override hooks for MUI-style implementations. |
| `sx` | `SxProps<Theme>` | - | MUI system override. Prefer tokens for shared design-system code. |

## API choices made

- Keep `AccordionDetails` layout-only. Expansion state, `aria-expanded`, and keyboard behavior stay on `AccordionSummary` / parent item.
- Do not add `padding`, `variant`, or `scroll` props. Use parent accordion variants and tokenized CSS.
- Do not make the details wrapper focusable by default. Focus should move to meaningful content inside.

## States

| State | Trigger | Visual rule |
| --- | --- | --- |
| Collapsed | Parent item closed | Details content is hidden and not keyboard reachable. |
| Expanding | Parent item opens | Body follows parent expand motion; no separate fade unless specified by parent. |
| Expanded | Parent item open | Content uses readable spacing and inherits text color. |
| Focus-visible | Focusable child receives focus | Child shows visible focus; details wrapper remains neutral. |
| Disabled | Parent item disabled | Details remain collapsed unless parent allows disabled expanded display; text is not independently disabled. |
| Loading | Async content inside | Use skeleton or progress inside details, not on the wrapper. |
| Error | Form/list error inside | Show error near the failing field/section and reflect status in summary if needed. |

## Tokens consumed

```
--color-bg-default
--color-bg-subtle
--color-text-primary
--color-text-secondary
--color-border-default
--color-focus-ring
--space-sm
--space-md
--space-lg
--radius-md
--motion-default
--easing-in-out
```

## Accessibility

- The accordion content wrapper should have `id`, `role="region"` when the panel is substantial, and `aria-labelledby` pointing to the summary button.
- Do not add a second unlabeled `region` inside `AccordionDetails`.
- Hidden details must not leave form fields, links, or buttons in the tab order.
- If content is short plain text, `role="region"` is optional; overusing regions makes screen-reader navigation noisy.
- Keyboard behavior is inherited from the parent accordion: `Tab` enters visible focusable content, and `Enter` / `Space` toggles the summary.
- Touch target rules apply to controls inside details: at least 44x44 on mobile.

## Layout rules

| Rule | Value |
| --- | --- |
| Padding | Match parent size: `sm` 12px, `md` 16px, `lg` 20px equivalent tokens. |
| Text | Body text uses `--color-text-primary`; helper copy uses `--color-text-secondary`. |
| Width | Fill parent item width. Avoid fixed widths inside details. |
| Scroll | Prefer page scroll. Only create inner scroll if the panel is inside a constrained modal/drawer. |
| Forms | Preserve field state across collapse unless product explicitly discards edits. |

## Code example

```tsx
<Accordion type="single" collapsible defaultValue="account">
  <Accordion.Item value="account">
    <Accordion.Summary>계정 정보</Accordion.Summary>
    <Accordion.Details>
      <Stack gap="md">
        <Text tone="secondary">
          이름과 연락처는 본인인증 이후에만 변경할 수 있습니다.
        </Text>
        <AccountProfileFields />
      </Stack>
    </Accordion.Details>
  </Accordion.Item>
</Accordion>
```

## Edge cases

- **Async body data**: render a skeleton inside the expanded details. Do not collapse the panel while loading.
- **Form state**: keep fields mounted or persist their values before unmounting, otherwise collapse can discard edits.
- **Very long content**: consider splitting into separate accordion items or a dedicated page.
- **Nested accordions**: avoid by improving information architecture; if unavoidable, nested summaries must have distinct labels.
- **Tables inside details**: ensure horizontal overflow is keyboard accessible and not clipped by the accordion item.
- **High contrast mode**: body/background boundaries must remain visible through border or spacing, not color alone.
- **Print**: print styles should expand important details or provide a clear "collapsed content omitted" rule.

## Don't

- Don't make `AccordionDetails` itself a button, link, or focus target.
- Don't put critical CTAs only inside details.
- Don't add independent expand/collapse logic inside the details wrapper.
- Don't hide validation errors by collapsing the panel after submit.

## References

- MUI direct source: [`refs/mui/packages/mui-material/src/AccordionDetails/AccordionDetails.d.ts`](../refs/mui/packages/mui-material/src/AccordionDetails/AccordionDetails.d.ts)
- MUI implementation: [`refs/mui/packages/mui-material/src/AccordionDetails/AccordionDetails.js`](../refs/mui/packages/mui-material/src/AccordionDetails/AccordionDetails.js)
- Parent MUI composition: [`refs/mui/packages/mui-material/src/Accordion/`](../refs/mui/packages/mui-material/src/Accordion/)
- Ant Design parent pattern: [`refs/ant-design/components/collapse/`](../refs/ant-design/components/collapse/)
- shadcn-ui parent pattern: [`refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/accordion.tsx`](../refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/accordion.tsx)
- Accessibility baseline: [`knowledge/a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md)

## Cross-reference

- [examples/component-accordion.md](component-accordion.md)
- [knowledge/patterns/form-design.md](../knowledge/patterns/form-design.md)
