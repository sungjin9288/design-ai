# `Code` (inline + block) — spec

> Citing Ant Design `Typography.Text code` (inline) / `pre` (block), MUI (composition), shadcn-ui (composition with shiki/prism)

## Purpose

Renders code with monospace font + appropriate styling. Two variants:

| Variant | Use |
| --- | --- |
| **Inline** | Code within prose (`const x = 1`) |
| **Block** | Standalone code blocks with optional syntax highlighting + copy button |

## Anatomy

### Inline

```
This is some `inline code` within text.
```

A short, monospace token in the flow of text.

### Block

```
┌──────────────────────────────────────────────────┐
│ TypeScript                              [Copy]   │
├──────────────────────────────────────────────────┤
│ 1  type User = {                                 │
│ 2    name: string;                               │
│ 3    email: string;                              │
│ 4  };                                            │
└──────────────────────────────────────────────────┘
```

| Slot | Required | Notes |
| --- | --- | --- |
| Language label | optional | Header showing the language |
| Copy button | optional | Top-right corner |
| Line numbers | optional | Left gutter |
| Code content | yes | Highlighted or plain |

## API

### Inline

```tsx
<Code inline>const x = 1</Code>
```

Or as a tagged element:

```tsx
<code>{value}</code>      {/* native */}
<Code>{value}</Code>      {/* component */}
```

### Block

```tsx
<Code language="typescript" showLineNumbers showCopyButton>
{`type User = {
  name: string;
  email: string;
};`}
</Code>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `string` | — | Code content |
| `inline` | `boolean` | `false` | Inline vs block |
| `language` | `string` | — | Syntax highlighting language (e.g., `"typescript"`, `"python"`, `"bash"`) |
| `showLineNumbers` | `boolean` | `false` | |
| `showCopyButton` | `boolean` | `true` (block only) | |
| `theme` | `"light" \| "dark" \| "auto"` | `"auto"` | Highlighter theme |
| `wrapLines` | `boolean` | `false` | Soft-wrap long lines vs horizontal scroll |
| `highlightLines` | `number[]` | — | Line numbers to highlight |

## Syntax highlighting

Use a library — don't roll your own:
- **Shiki** (best for static / SSR — uses VS Code engine)
- **Prism** (lighter weight, more themes)
- **highlight.js** (largest language coverage)

For React: `react-syntax-highlighter` wraps these.

For server-rendered (Next.js, SvelteKit): Shiki is best — pre-renders highlighted HTML on the server, no client JS needed.

## States

| State | Visual |
| --- | --- |
| Default | Code visible |
| Hover (block) | Copy button appears (or stays visible) |
| Copy clicked | Brief "복사됨!" toast or button text change |
| Copy failed | "복사 실패" inline |

## Tokens consumed

```
--font-mono                   (e.g., "SFMono-Regular, Consolas, ...")
--color-bg-code               (block bg — slightly tinted)
--color-bg-inline-code        (inline bg — subtle highlight)
--color-text-primary          (default code text)
--color-text-secondary        (line numbers)
--color-syntax-*              (syntax highlight tokens — keyword, string, comment, etc.)
--color-bg-elevated           (header bg, copy button bg)
--space-sm, --space-md
--radius-md                   (block corners)
--font-size-sm, --font-size-base
```

For inline: typically a subtle background tint (`--color-bg-subtle`) and slightly smaller font (90%).

For block: full-bleed monospace, dedicated background, comfortable padding.

## Sizes

Inline: matches surrounding text but slightly smaller (font-size 90%).

Block:
| Prop | Compact | Default | Comfortable |
| --- | --- | --- | --- |
| Font | 12px | 14px | 16px |
| Line height | 1.4 | 1.6 | 1.8 |
| Padding | 12px | 16px | 20px |

## Accessibility

- Inline: native `<code>` element. No special wiring needed.
- Block: `<pre><code>` (semantic).
- Copy button: `<button>` with `aria-label="복사"` (with success feedback).
- For users navigating with screen readers: code blocks are read character-by-character. This is desired for code reading.

```html
<pre>
  <code class="language-typescript">
    const x = 1;
  </code>
</pre>
```

For language announcement:
```html
<pre aria-label="TypeScript code">
  <code>...</code>
</pre>
```

## Code example

```tsx
// Inline
<p>
  Set <Code>NODE_ENV</Code> to <Code>production</Code> for deployment.
</p>

// Block with syntax highlighting
<Code language="typescript" showCopyButton>
  {`const greet = (name: string) => \`안녕, \${name}!\`;`}
</Code>

// Long block with line numbers
<Code language="python" showLineNumbers showCopyButton wrapLines>
{`def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)`}
</Code>

// Highlighted lines (e.g., showing a diff)
<Code language="js" highlightLines={[2, 3]}>
{`function add(a, b) {
  // ⚠ subtle bug here
  return a + b + 1;
}`}
</Code>
```

## Edge cases

- **Very long lines**: default to horizontal scroll (no wrap). User can opt into wrap.
- **Multi-line inline code**: defaults to inline behavior; force inline-block to keep it on one line.
- **Code with HTML special chars** (`<`, `>`, `&`): the renderer must escape these. Library handles.
- **Code containing the copy-target itself**: copy returns the original string, not the rendered HTML.
- **Print**: code blocks should print readably — fix font + page-break-inside: avoid.

## Don't

- Don't show syntax-highlighted code in critical UI paths (first paint) without SSR — flicker.
- Don't omit copy button on documentation block (huge UX win).
- Don't truncate code blocks. Show all or scroll.
- Don't apply syntax highlighting to non-code (e.g., shell output that's not a command).
- Don't use raw `<code>` in screen readers without context — wrap with description.

## References

- Ant Design: [`Typography.Text code`](../docs/reference/ant-design.md#typography) — inline. Block code: just use HTML `<pre>` with optional CSS.
- MUI: no dedicated Code component. Use `<code>` or `<Typography component="pre">`.
- shadcn-ui: no built-in. Compose with `react-syntax-highlighter` + Tailwind.

Common libraries:
- `react-syntax-highlighter` — React wrapper for Prism / Highlight.js
- `shiki` — VS Code's highlighter, server-side rendering
- `prism-react-renderer` — lightweight Prism wrapper

## Cross-reference

- [`examples/component-typography.md`](component-typography.md) — text rendering primitives
- [`knowledge/typography/type-scale-fundamentals.md`](../knowledge/typography/type-scale-fundamentals.md) — monospace font choices
