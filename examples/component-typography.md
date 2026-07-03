# `Typography` (text primitive) — spec

> Citing Ant Design `Typography`, MUI `Typography`, shadcn-ui (composition with utility classes)

## Purpose

A semantic + style primitive for text. Wraps `<h1>`–`<h6>`, `<p>`, `<span>` with consistent variant-driven styling per the design system's type scale.

For most teams: **don't use a Typography component**. Apply utility classes (`text-xl font-semibold`) or use semantic HTML directly. Only reach for Typography when:
- You're consuming a design system that ships one (Ant, MUI).
- You need centralized type-variant changes propagating across the app.

## Anatomy

A Typography element is a single text node with:
- HTML semantic (h1, h2, p, span)
- Type scale variant (display, heading-lg, body, caption)
- Optional color, weight, alignment overrides
- Optional truncation, ellipsis, copyable

## API

```tsx
<Typography variant="display">우리 가계부</Typography>
<Typography variant="heading-md">최근 거래</Typography>
<Typography variant="body">설명 텍스트입니다.</Typography>
<Typography variant="body-sm" color="secondary">부가 정보</Typography>
<Typography variant="caption">2026.05.07</Typography>

// As different element
<Typography variant="heading-lg" as="h2">섹션 제목</Typography>

// Truncation
<Typography variant="body" truncate maxLines={2}>
  매우 긴 텍스트가 두 줄로 잘립니다 매우 긴 텍스트가 두 줄로 잘립니다 ...
</Typography>

// Copy
<Typography variant="body" copyable>
  abc123-def456
</Typography>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `"display" \| "heading-lg" \| "heading-md" \| "heading-sm" \| "body-lg" \| "body" \| "body-sm" \| "caption" \| "amount"` | `"body"` | Type scale variant |
| `as` | `"h1" \| ... \| "p" \| "span" \| "div"` | inferred from variant | Override HTML element |
| `color` | `"primary" \| "secondary" \| "tertiary" \| "disabled" \| "success" \| "warning" \| "error"` | `"primary"` | Semantic color |
| `weight` | `400 \| 500 \| 600 \| 700` | from variant | Override weight |
| `align` | `"left" \| "center" \| "right"` | `"left"` | |
| `truncate` | `boolean` | `false` | Single-line ellipsis |
| `maxLines` | `number` | — | Multi-line clamp |
| `copyable` | `boolean` | `false` | Render copy button next to text |

## Variants → defaults

Per [`knowledge/typography/type-scale-fundamentals.md`](../knowledge/typography/type-scale-fundamentals.md), with Korean +10% line-height adjustment:

| Variant | Tag | Size | Weight | Line-height |
| --- | --- | --- | --- | --- |
| `display` | h1 | 38px | 700 | 1.2 |
| `heading-lg` | h2 | 24px | 700 | 1.4 |
| `heading-md` | h3 | 20px | 600 | 1.4 |
| `heading-sm` | h4 | 17px | 600 | 1.4 |
| `body-lg` | p | 17px | 400 | 1.6 |
| `body` (default) | p | 15px | 400 | 1.6 |
| `body-sm` | p | 13px | 400 | 1.6 |
| `caption` | span | 12px | 400 | 1.5 |
| `amount` | span | varies | 600 | 1.2, tabular numerals |

## Color

| Color | Use |
| --- | --- |
| `primary` (default) | Body text, headings |
| `secondary` | Help text, captions |
| `tertiary` | Less-emphasized labels |
| `disabled` | Disabled state text |
| `success` / `warning` / `error` | Status text |

For **money colors** (`money-positive` / `money-negative`): use `<Amount>` component or specific class. Don't blur into Typography's color axis.

## Why semantic mapping by variant

`heading-lg` defaults to `<h2>`, not `<h1>` — most apps have one `<h1>` per page (page title). `heading-lg` is used for sub-section headings.

If you need different semantic: override with `as`. The visual stays consistent; the tag changes.

```tsx
{/* Page hero — h1 */}
<Typography variant="display" as="h1">대시보드</Typography>

{/* Section header inside page — h2 */}
<Typography variant="heading-lg">최근 거래</Typography>

{/* Card title inside section — h3 */}
<Typography variant="heading-md">5월 7일 (목)</Typography>
```

## Truncation

Single-line truncation is straightforward:

```css
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

Multi-line (clamp):

```css
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

For Korean: line-clamp works cleanly with Hangul. `word-break: keep-all` ensures syllables don't break mid-word.

## Copyable

Adds a small copy icon next to the text. Useful for IDs, codes, addresses:

```tsx
<Typography variant="body" copyable>
  주문번호: ORD-2026-001234
</Typography>
```

Click → copies to clipboard, shows brief "복사됨!" toast.

## Accessibility

- HTML semantic preserved (h1, h2, p) — assistive tech navigates by heading hierarchy.
- Color is supplementary; don't encode meaning by color alone.
- Truncated text: `title` attribute provides full text on hover (and screen readers).

```html
<p title="Full long text...">Full long text that gets truncated...</p>
```

For copyable: the copy button has `aria-label="복사"`.

## Korean considerations

- Apply `word-break: keep-all` to body text — prevents Hangul mid-syllable breaks.
- Apply `font-feature-settings: 'tnum' 1` to amount variant.
- See [`knowledge/i18n/korean-typography.md`](../knowledge/i18n/korean-typography.md) for full Korean adjustments.

## Code example

```tsx
function TransactionDetail({ tx }: Props) {
  return (
    <article>
      <Typography variant="display" as="h1">
        ₩{formatKRW(tx.amount)}
      </Typography>
      <Typography variant="caption" color="secondary">
        {formatDate(tx.date)}
      </Typography>

      <Typography variant="heading-md" className="mt-6">
        상세
      </Typography>

      <dl className="mt-4">
        <dt><Typography variant="body-sm" color="secondary">상점</Typography></dt>
        <dd><Typography variant="body">{tx.merchant}</Typography></dd>

        <dt><Typography variant="body-sm" color="secondary">주문번호</Typography></dt>
        <dd>
          <Typography variant="body" copyable>
            {tx.orderId}
          </Typography>
        </dd>
      </dl>
    </article>
  );
}
```

## When NOT to use Typography component

For projects using **Tailwind**: utility classes (`text-xl font-semibold leading-relaxed`) are usually clearer than `<Typography variant="heading-md">`. The Typography component is a convention from CSS-in-JS / styled-components systems.

For **shadcn-ui projects**: skip Typography. Define type-scale classes in your global CSS / Tailwind config and use semantic HTML directly.

For **Ant Design / MUI projects**: Typography is canonical; use it.

## Don't

- Don't use Typography for layout (margin, padding). It's a text primitive.
- Don't override the default semantic (`as`) without reason — h1 is meaningful.
- Don't apply different variants to the same logical text role across the app — that's drift.
- Don't omit `aria-label` on copyable copy buttons.

## References

- Ant Design: [`refs/ant-design/components/typography/`](../docs/reference/ant-design.md#typography) — `Typography`, `Typography.Title`, `Typography.Text`, `Typography.Paragraph`. Most exhaustive: copyable, ellipsis with tooltip, editable.
- MUI: [`refs/mui/packages/mui-material/src/Typography/`](../docs/reference/mui.md#typography) — `Typography` with variants matching Material 3 (display, headline, title, body, label).
- shadcn-ui: no Typography component. Apply utility classes directly.

## Cross-reference

- [`knowledge/typography/type-scale-fundamentals.md`](../knowledge/typography/type-scale-fundamentals.md) — type scale rules
- [`knowledge/typography/mui-type-scale.md`](../knowledge/typography/mui-type-scale.md) — MUI variants
- [`knowledge/i18n/korean-typography.md`](../knowledge/i18n/korean-typography.md) — Korean adjustments
- [`examples/component-amount-input.md`](component-amount-input.md) — amount-specific text variant
- [`examples/component-code.md`](component-code.md) — code-specific text
