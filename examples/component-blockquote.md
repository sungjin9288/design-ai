# `Blockquote` — spec

> Doc-specific. For attributed quotations from other people. Distinct from `Callout` (which is editor-flagged content).

## Purpose

Render a quotation visually distinct from body text. Cite the source. Used in long-form articles, research reports (user quotes), case studies (customer quotes).

## Anatomy

```
   "
   The quote text, often slightly larger and styled
   distinctly from body. May span multiple lines.
   "

   — Attribution name, role
```

OR with bar accent:

```
│  The quote text. Bar on left signals quote.
│
│  — Attribution name
```

## API

```jsx
<Blockquote>
  <p>The quote text.</p>
  <Blockquote.Cite>Attribution name, role</Blockquote.Cite>
</Blockquote>

// Or with the cite prop
<Blockquote cite="https://example.com/source">
  The quote text.
</Blockquote>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | Quote content |
| `cite` | `string` | — | Source URL (renders as `<cite>` element) |
| `variant` | `"default" \| "pull-quote"` | `"default"` | |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | |

## Variants

### Default

Inline within reading flow:

```
> Body text body text body text...
> 
> "The quote text."
> — Source
> 
> Body text continues...
```

### Pull-quote

Larger, often centered, breaks up dense reading:

```
        "The quote text — larger,
         emphasized, distinct."

         — Source
```

Used in editorial / marketing prose to surface a key sentiment.

## Sizes

| Size | Font | Body context |
| --- | --- | --- |
| `sm` | matches body | Inline mention |
| `md` (default) | 1.125× body | Standard quote |
| `lg` (pull-quote) | 1.5× body | Editorial breaking-out |

## Style choices

| Style cue | Use |
| --- | --- |
| Italic body | Latin convention. Don't use for Hangul. |
| Larger size | Universal — signals quote |
| Left bar (border-left) | Modern, clean |
| Quote marks (large) | Editorial / marketing |
| Centered text | Pull-quote variant |
| Subtle bg tint | Differentiation in dense layouts |

For Korean: don't italicize (no italic Hangul). Use weight (`font-weight: 500`) or color shift.

## Tokens consumed

```
--color-text-primary
--color-text-secondary       (attribution)
--color-text-tertiary
--color-border-default       (left bar)
--color-bg-subtle             (optional bg tint)
--space-md, --space-base
--font-size-base, --font-size-lg, --font-size-xl
--font-weight-medium
```

## Accessibility

- Use semantic `<blockquote>` element. Ships with implicit role.
- Attribution: `<cite>` element. Renders as italic by default; override per language.
- Cite URL: optional `cite` attribute on `<blockquote>` for machine-readable source.

```html
<blockquote cite="https://example.com/source">
  <p>The quote text.</p>
  <footer><cite>— Source name</cite></footer>
</blockquote>
```

## Korean conventions

For quotations:
- Use double quotes `" "` or angle quotes `「 」` — double Latin is most common in modern Korean docs.
- Attribution: `— 이름` or `— 이름, 직책`.
- Don't italicize (Hangul has no italic form). Use weight or color.

```html
<blockquote>
  <p>"이 디자인은 정말 신선합니다."</p>
  <cite>— 김민지, 디자인 디렉터</cite>
</blockquote>
```

## Don't

- Don't italicize Hangul.
- Don't omit attribution. An unattributed quote is suspicious.
- Don't use blockquote for non-quotations (rule, tip, note — those are Callouts).
- Don't nest blockquotes. Quote-in-a-quote is rare; use prose.

## References

Universal HTML element. Most doc tools render `<blockquote>` consistently. Style varies.

## Cross-reference

- [`examples/component-callout.md`](component-callout.md) — for editor flags, not quotes
- [`knowledge/patterns/document-typography.md`](../knowledge/patterns/document-typography.md) — pull-quote rules
- [`knowledge/patterns/report-design.md`](../knowledge/patterns/report-design.md) — research quote patterns
