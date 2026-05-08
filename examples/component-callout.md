# `Callout` (info/warning/note in docs) — spec

> Doc-specific component. Highlights important asides in long-form content. Distinct from `Alert` (which is for product UI feedback) — Callout is for **documentation prose**.

## Purpose

Marks a passage as important info, warning, tip, or note. Visually distinct from body text but doesn't break reading flow.

## When Callout vs Alert vs Blockquote

| Use Callout | Use Alert | Use Blockquote |
| --- | --- | --- |
| Long-form docs | Product UI feedback | Quote from another source |
| Tip, note, warning, danger inside reading | Real-time notification | Attribution matters |

## Anatomy

```
┌──────────────────────────────────────────────────────┐
│ ℹ Note                                                │  ← icon + label header
│                                                       │
│ The body text of the callout. May span multiple       │
│ paragraphs and contain code, lists, links.            │
└──────────────────────────────────────────────────────┘
   subtle bg, accent left-border
```

## API

```mdx
<Callout type="note">
  This is an important note.
</Callout>

<Callout type="warning" title="Custom title">
  Be careful — this can lose data.
</Callout>

<Callout type="tip">
  💡 You can also use the keyboard shortcut.
</Callout>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `type` | `"note" \| "tip" \| "info" \| "warning" \| "danger" \| "success"` | `"note"` | Visual + icon |
| `title` | `string` | derived from type | Header text (override) |
| `children` | `ReactNode` | — | Body |
| `compact` | `boolean` | `false` | Single-line variant |

## Type → visual mapping

| Type | Icon | Border | Bg tint | Use |
| --- | --- | --- | --- | --- |
| `note` | ℹ | `--color-info` | `--color-info-subtle-bg` | Side commentary |
| `tip` | 💡 | `--color-success` | `--color-success-subtle-bg` | Useful trick / shortcut |
| `info` | ℹ | `--color-info` | `--color-info-subtle-bg` | Background context |
| `warning` | ⚠ | `--color-warning` | `--color-warning-subtle-bg` | Pay attention; potentially problematic |
| `danger` | 🛑 | `--color-error` | `--color-error-subtle-bg` | Will cause harm if ignored |
| `success` | ✓ | `--color-success` | `--color-success-subtle-bg` | Confirmation / "this worked" |

## Tokens consumed

```
--color-info-subtle-bg, --color-info
--color-warning-subtle-bg, --color-warning
--color-error-subtle-bg, --color-error
--color-success-subtle-bg, --color-success
--color-text-primary
--color-text-secondary
--space-md, --space-base
--radius-md
--font-size-base
```

## Sizes

Body 16–18px (matches surrounding doc body). Title slightly bolder (semibold).

For compact variant: 14px, single-line, useful for inline tips.

## Korean callouts

| Type | Korean header |
| --- | --- |
| note | 참고 |
| tip | 팁 |
| info | 안내 |
| warning | 주의 |
| danger | 위험 / 경고 |
| success | 완료 |

For Korean docs: per [`knowledge/i18n/korean-document-style.md`](../knowledge/i18n/korean-document-style.md), use formal tone (`~합니다 / 입니다`).

```mdx
<Callout type="warning" title="주의">
  이 작업은 되돌릴 수 없습니다. 신중히 진행해 주세요.
</Callout>
```

## Accessibility

- Render as `<aside>` with `aria-label="Note"` (or appropriate per type).
- For `danger` / `warning`: `role="alert"` if the callout's appearance should interrupt reading flow.
- For passive types (note, tip, info): no role needed — just an `<aside>`.
- Icon: `aria-hidden="true"` (header label conveys meaning).

## Don't

- Don't overuse — every paragraph as callout = noise.
- Don't nest callouts (callout inside callout).
- Don't use `danger` for non-destructive info.
- Don't put primary CTAs in callouts.
- Don't use color alone to convey type — icon + label do the work.

## References

Most documentation tools (Docusaurus, Notion, GitBook, MDX-based sites) ship a Callout component. The variation is mostly in `type` naming.

- Docusaurus: `:::note`, `:::tip`, `:::info`, `:::warning`, `:::danger`
- GitBook: `<hint type="info|warning|danger|success">...</hint>`
- Notion: built-in callout block with icon

For design-ai's docs: MDX-based callout matching this spec.

## Cross-reference

- [`examples/component-alert.md`](component-alert.md) — for product UI feedback (different)
- [`examples/component-blockquote.md`](component-blockquote.md) — for quotations
- [`knowledge/patterns/document-typography.md`](../knowledge/patterns/document-typography.md)
- [`knowledge/i18n/korean-document-style.md`](../knowledge/i18n/korean-document-style.md) — Korean callout headers
