# `AccordionSummary` - spec

> Direct upstream component: MUI `AccordionSummary`. Parent pattern references: Ant Design `Collapse`, MUI `Accordion`, shadcn-ui `accordion`.

## Purpose

`AccordionSummary` is the interactive header for one accordion item. It names the section, communicates whether the section is expanded, and toggles the associated details panel.

This is the accessibility-critical part of the accordion. It must behave like a real button.

## Anatomy

```
AccordionSummary
├── Root button
│   ├── Leading icon          optional
│   ├── Content
│   │   ├── Title             required
│   │   └── Description       optional
│   └── Expand icon wrapper   required visual affordance
```

| Part | Required | Purpose |
| --- | --- | --- |
| Root button | yes | Receives focus and toggles the panel. |
| Title | yes | Short label for the section. |
| Description | optional | Secondary context; keep to one line when possible. |
| Expand icon | yes | Shows collapsed/expanded state visually. |
| Leading icon | optional | Helps scan settings/category accordions. |

## API

```tsx
<Accordion.Item value="privacy">
  <Accordion.Summary expandIcon={<ChevronDownIcon aria-hidden="true" />}>
    <Accordion.SummaryContent
      title="개인정보"
      description="프로필 공개 범위와 데이터 다운로드"
    />
  </Accordion.Summary>
  <Accordion.Details>
    <PrivacySettings />
  </Accordion.Details>
</Accordion.Item>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | - | Title/content rendered inside the summary button. |
| `classes` | `Partial<AccordionSummaryClasses>` | - | Style override hooks for MUI-style implementations. |
| `component` | `React.ElementType` | MUI default root | Overrides the root element. Must preserve button semantics. |
| `expandIcon` | `ReactNode` | - | Visual expand/collapse indicator. Mark decorative icons `aria-hidden`. |
| `slots` | `{ root?, content?, expandIconWrapper? }` | - | Slot component overrides for MUI-style implementations. |
| `slotProps` | `{ root?, content?, expandIconWrapper? }` | - | Props forwarded to summary slots. |
| `sx` | `SxProps<Theme>` | - | MUI system override. Prefer tokens for shared design-system code. |

Inherits button-like props from MUI `ButtonBase` in MUI implementations.

## API choices made

- Treat `AccordionSummary` as a button first and a layout row second.
- Keep `expandIcon` as a visual prop because Ant, MUI, and shadcn/Radix patterns all expose an expand affordance.
- Prefer composition for title/description rather than `title` and `description` props; complex summaries often need badges or metadata.
- Allow `component` only when semantics are preserved. A `<div>` without button behavior is not acceptable.

## States

| State | Trigger | Visual rule |
| --- | --- | --- |
| Collapsed | `aria-expanded="false"` | Title primary, icon points closed, details hidden. |
| Expanded | `aria-expanded="true"` | Icon rotates or swaps, row may use subtle active background. |
| Hover | Pointer over enabled summary | `--color-bg-subtle` background shift. |
| Focus-visible | Keyboard focus | 2px focus ring with at least 3:1 contrast against background. |
| Active | Press | Slight pressed background or transform-free pressed color. |
| Disabled | Parent item disabled | Muted text/icon, no toggle, expose disabled state. |
| Loading | Content inside panel loading | Summary may show a small trailing spinner, but still names the section. |
| Error | Panel contains error | Add error badge/text in summary and keep color paired with label/icon. |

## Tokens consumed

```
--color-bg-default
--color-bg-subtle
--color-text-primary
--color-text-secondary
--color-text-disabled
--color-border-default
--color-error
--color-focus-ring
--space-sm
--space-md
--space-lg
--radius-md
--motion-fast
--easing-in-out
```

## Accessibility

- Render a native `<button type="button">` whenever possible.
- Set `aria-expanded="true|false"` on the summary button.
- Set `aria-controls` to the details/content `id`.
- The details/content wrapper sets `aria-labelledby` back to the summary button `id`.
- Decorative expand icons use `aria-hidden="true"` and do not duplicate the label.
- Disabled summaries should use native `disabled` when possible; custom roots need `aria-disabled="true"` and must suppress activation.
- Minimum target: 44x44 on mobile, 24x24 on desktop AA.

### Keyboard

| Key | Behavior |
| --- | --- |
| `Tab` | Moves focus to each enabled summary in document order. |
| `Enter` / `Space` | Toggles the focused summary. |
| `ArrowUp` / `ArrowDown` | Optional parent-level shortcut to previous/next summary. |
| `Home` / `End` | Optional parent-level shortcut to first/last summary. |

## Layout rules

| Rule | Value |
| --- | --- |
| Height | `sm` 40px, `md` 48px, `lg` 56px minimum. |
| Title | Single line by default; wrap to two lines only for content-heavy admin UIs. |
| Description | Secondary text, one line, truncates before the expand icon. |
| Icon placement | Trailing in LTR; mirror with logical CSS in RTL. |
| Expand motion | 150-200ms rotation; remove rotation for `prefers-reduced-motion`. |

## Code example

```tsx
<Accordion.Item value="security" disabled={isLocked}>
  <Accordion.Summary
    id="security-summary"
    aria-controls="security-panel"
    expandIcon={<ChevronDownIcon aria-hidden="true" />}
  >
    <Stack gap="xs">
      <Text weight="semibold">보안</Text>
      <Text size="sm" tone={hasSecurityError ? "error" : "secondary"}>
        {hasSecurityError ? "확인이 필요한 항목이 있습니다" : "2단계 인증과 로그인 알림"}
      </Text>
    </Stack>
  </Accordion.Summary>
  <Accordion.Details id="security-panel" aria-labelledby="security-summary">
    <SecuritySettings />
  </Accordion.Details>
</Accordion.Item>
```

## Edge cases

- **Long title**: wrap title before hiding the expand icon. The icon must remain visible.
- **Icon-only summary**: avoid. If unavoidable, provide a specific `aria-label`.
- **Summary contains badge/count**: ensure the accessible name stays concise and does not repeat decorative count text.
- **Disabled but expanded**: allowed for read-only review states, but communicate why the row cannot be toggled.
- **RTL**: chevron placement and rotation should mirror; use logical properties.
- **Reduced motion**: state change remains instant; remove icon rotation animation.
- **Error state**: do not rely on red alone. Add text such as "오류" or an error icon with accessible text.

## Don't

- Don't render the summary as a clickable `<div>` without native button behavior.
- Don't put form fields or nested buttons inside the summary.
- Don't hide the expand icon when the row is collapsible.
- Don't use the summary as navigation to another page.

## References

- MUI direct source: [`refs/mui/packages/mui-material/src/AccordionSummary/AccordionSummary.d.ts`](../docs/reference/mui.md#accordion-summary)
- MUI implementation: [`refs/mui/packages/mui-material/src/AccordionSummary/AccordionSummary.js`](../docs/reference/mui.md#accordion-summary)
- Parent MUI composition: [`refs/mui/packages/mui-material/src/Accordion/`](../docs/reference/mui.md#accordion)
- Ant Design parent pattern: [`refs/ant-design/components/collapse/`](../docs/reference/ant-design.md#collapse)
- shadcn-ui parent pattern: [`refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/accordion.tsx`](../docs/reference/shadcn-ui.md#accordion)
- Accessibility baseline: [`knowledge/a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md)
- Motion baseline: [`knowledge/motion/principles.md`](../knowledge/motion/principles.md)

## Cross-reference

- [examples/component-accordion.md](component-accordion.md)
- [WAI-ARIA Accordion Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/)
- [WAI-ARIA Disclosure Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/)
