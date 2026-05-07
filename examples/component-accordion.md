# `Accordion` (Collapse) — spec

> Citing Ant Design `Collapse`, MUI `Accordion`, shadcn-ui `accordion`

## Purpose

A vertically stacked set of expandable sections. User clicks a header to reveal/hide the body. Optimized for content that's organized into named sections but doesn't all need to be visible at once.

## When Accordion vs Tabs vs always-visible

| Use Accordion | Use Tabs | Always visible |
| --- | --- | --- |
| Content sections that don't need parallel comparison | Sections that user switches between | Critical info that must always be visible |
| FAQ, settings groups, expandable details | Profile / Activity / Settings (mutually exclusive views) | Hero, primary data |

Don't use accordion for navigation between distinct screens — that's tabs or pages.

## Anatomy

```
┌──────────────────────────────────────────────────┐
│ ▾  Section 1 title                               │  ← Header (button)
├──────────────────────────────────────────────────┤
│    Section 1 content...                          │  ← Body (revealed when expanded)
│                                                   │
└──────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────┐
│ ▸  Section 2 title                               │  ← Collapsed
└──────────────────────────────────────────────────┘
```

| Slot | Required | Notes |
| --- | --- | --- |
| Trigger (header) | yes | Clickable; title + chevron. |
| Body | yes | Hidden when collapsed. |
| Chevron | yes (visual) | Rotates 90° on expand. |
| Icon (leading) | optional | Per-section icon. |
| Description (in header) | optional | Subtitle on header. |

## API

```tsx
<Accordion type="single" defaultValue="section-1" collapsible>
  <Accordion.Item value="section-1">
    <Accordion.Trigger>Section 1 title</Accordion.Trigger>
    <Accordion.Content>
      Body content for section 1.
    </Accordion.Content>
  </Accordion.Item>
  <Accordion.Item value="section-2">
    <Accordion.Trigger>Section 2 title</Accordion.Trigger>
    <Accordion.Content>
      Body content for section 2.
    </Accordion.Content>
  </Accordion.Item>
</Accordion>
```

| Prop (root) | Type | Default | Description |
| --- | --- | --- | --- |
| `type` | `"single" \| "multiple"` | `"single"` | Single: only one section open at a time. Multiple: any combination. |
| `value` / `defaultValue` | `string` (single) / `string[]` (multiple) | — | Open section(s) |
| `onValueChange` | `(value) => void` | — | |
| `collapsible` | `boolean` | `true` | When `single`: allow closing the open section (vs. always one open) |
| `disabled` | `boolean` | `false` | Disables all sections |

| Prop (Item) | Type | Description |
| --- | --- | --- |
| `value` | `string` | Required. Unique key. |
| `disabled` | `boolean` | Disables this section |

## Variants

| Variant | Use |
| --- | --- |
| `bordered` (default) | 1px border around each item |
| `borderless` | No borders, hairline divider between items only |
| `card` | Each item is a card with shadow + radius |
| `flush` | Edge-to-edge, no border, divider between items (mobile-friendly) |

For settings-list patterns: `flush` is most common.

## States

| State | Trigger | Body | Chevron |
| --- | --- | --- | --- |
| Collapsed | resting | hidden, height 0 | →/▸ |
| Expanding | click on trigger | animating to natural height (200ms) | rotating |
| Expanded | settled | natural height | ↓/▾ |
| Collapsing | click on open trigger | animating to 0 (200ms) | rotating |
| Disabled | `disabled={true}` | hidden | muted |
| Hover | mouse-over header | bg slightly darker | — |
| Focus-visible | keyboard tab | 2px ring on header | — |

### Animating height

Use `grid-template-rows: 0fr → 1fr` (CSS-only, modern):

```css
.accordion-content {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 200ms ease-out;
}
.accordion-content[data-state="open"] {
  grid-template-rows: 1fr;
}
.accordion-content > * {
  overflow: hidden;
}
```

Or animate `max-height` (but it's CSS-hostile for variable content).

Radix's accordion uses CSS variables `--radix-collapsible-content-height` for the natural height — paste-ready.

## Sizes

| Size | Header height | Font | Padding |
| --- | --- | --- | --- |
| `sm` | 40px | 14px | 12px |
| `md` (default) | 48px | 15px | 16px |
| `lg` | 56px | 16px | 20px |

For mobile-touch: `md` minimum.

## Tokens consumed

```
--color-bg-default
--color-bg-subtle           (header hover, body bg in some variants)
--color-bg-elevated         (card variant)
--color-text-primary
--color-text-secondary
--color-border-default
--color-focus-ring
--space-md, --space-base
--radius-md
--motion-default            (200ms expand/collapse)
--easing-in-out
--shadow-card               (card variant)
```

## Accessibility — WAI-ARIA Disclosure / Accordion pattern

- Each header is a `<button>` with `aria-expanded="true|false"`.
- Header has `aria-controls={bodyId}` linking to the body element.
- Body has `id={bodyId}`, `role="region"`, `aria-labelledby={headerId}`.
- For `type="single"`: this is the canonical Disclosure pattern.
- For `type="multiple"`: same pattern, just multiple `aria-expanded="true"` allowed.

### Keyboard

| Key | Behavior |
| --- | --- |
| `Tab` | Move focus through headers (skip hidden body) |
| `Enter` / `Space` | Toggle the focused section |
| `↑` / `↓` | Move focus between accordion headers (Radix convention; some implementations use Tab only) |
| `Home` / `End` | First / last header |

### Reduced motion

Disable height transition. Toggle is instant (no 200ms).

## Code example

```tsx
// FAQ pattern
<Accordion type="single" collapsible>
  <Accordion.Item value="how-to-cancel">
    <Accordion.Trigger>구독을 어떻게 해지하나요?</Accordion.Trigger>
    <Accordion.Content>
      설정 → 구독 관리 → 해지하기에서 언제든 해지할 수 있습니다.
    </Accordion.Content>
  </Accordion.Item>
  <Accordion.Item value="refund">
    <Accordion.Trigger>환불은 어떻게 받나요?</Accordion.Trigger>
    <Accordion.Content>
      디지털 콘텐츠 7일 이내 환불 가능합니다. 고객센터로 문의해 주세요.
    </Accordion.Content>
  </Accordion.Item>
</Accordion>

// Settings sections (multiple)
<Accordion type="multiple" defaultValue={["account", "notifications"]}>
  <Accordion.Item value="account">
    <Accordion.Trigger>계정</Accordion.Trigger>
    <Accordion.Content>...</Accordion.Content>
  </Accordion.Item>
  <Accordion.Item value="notifications">
    <Accordion.Trigger>알림</Accordion.Trigger>
    <Accordion.Content>...</Accordion.Content>
  </Accordion.Item>
  <Accordion.Item value="security">
    <Accordion.Trigger>보안</Accordion.Trigger>
    <Accordion.Content>...</Accordion.Content>
  </Accordion.Item>
</Accordion>
```

## Edge cases

- **Long body content scrolls into view as it expands**: scrolling the new content into view on expand is helpful for long sections — but only if it's currently below the fold.
- **Animating height with content that loads async**: as content arrives, the body re-animates if user is watching. Consider rendering all content (display:none) if heights need to be exact.
- **Nested accordions**: avoid. Re-design the hierarchy.
- **Accordion inside a modal**: works, but ensure the modal's max-height accommodates the expanded content.
- **One section open by default**: `defaultValue="..."` for type="single". Useful for FAQ where the most-asked question is open.
- **Close-all when scrolling**: anti-pattern. User-driven open/close should persist.

## Don't

- Don't use Accordion for primary navigation.
- Don't put critical CTAs only inside accordions — users won't expand to find them.
- Don't auto-collapse a section while user is reading.
- Don't show > 8 accordion items at once. Use sections + headings or a different layout.
- Don't render accordion bodies as `display: none` if they have form state — state is lost. Use `hidden` attribute or keep mounted with `aria-hidden` + visibility.
- Don't combine controlled + uncontrolled modes — pick one.

## References

- Ant Design: [`refs/ant-design/components/collapse/`](../refs/ant-design/components/collapse/) — `Collapse` + `Collapse.Panel`. `accordion` prop forces single. Has nice `expandIcon` customization.
- MUI: [`refs/mui/packages/mui-material/src/Accordion/`](../refs/mui/packages/mui-material/src/Accordion/) — `Accordion`, `AccordionSummary`, `AccordionDetails`, `AccordionActions`. Solid composition.
- shadcn-ui: [`refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/accordion.tsx`](../refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/accordion.tsx) — Radix Accordion primitive. Cleanest a11y. **Default for new projects.**

## Cross-reference

- [examples/component-tabs.md](component-tabs.md) — alternative for non-stackable view-switching
- [WAI-ARIA Accordion Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/)
- [WAI-ARIA Disclosure Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/)
