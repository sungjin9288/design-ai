# `Textarea` — spec

> Synthesized from shadcn-ui `textarea` and HTML5 `<textarea>`. Multi-line text input. Distinct from `Input` (single line) and rich text editors.

## When to use

- Multi-line text: comments, descriptions, messages, addresses.
- Code / config snippets (use a code editor for syntax highlighting).
- Long-form notes.

## Anatomy

```
┌──────────────────────────────────┐
│ Description                      │   ← Label (separate)
└──────────────────────────────────┘
┌──────────────────────────────────┐
│                                  │
│ Textarea content...              │
│                                  │
│                                  │
└──────────────────────────────────┘
   2-5 rows visible by default; scrolls or grows.
```

## API

```tsx
<Textarea
  rows={4}
  placeholder="Tell us about yourself..."
  value={bio}
  onChange={(e) => setBio(e.target.value)}
  maxLength={500}
/>

<Textarea autoResize />   {/* MUI's textarea-autosize variant */}
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `rows` | `number` | `3` | Visible row count |
| `maxRows` | `number` | — | Cap when autoResize=true |
| `minRows` | `number` | `1` | Floor when autoResize=true |
| `autoResize` | `boolean` | `false` | Grow with content (MUI textarea-autosize) |
| `value` / `onChange` | controlled | — | Standard input props |
| `placeholder` | `string` | — | — |
| `maxLength` | `number` | — | Char limit + counter |
| `disabled` / `readOnly` | `boolean` | — | — |
| `resize` | `"none" \| "vertical" \| "horizontal" \| "both"` | `"vertical"` | CSS resize behavior |

## Variants

### Fixed rows

```tsx
<Textarea rows={3} />
```

Standard. User can resize (per `resize` prop) or scroll if content overflows.

### Auto-resize (MUI textarea-autosize)

```tsx
<Textarea autoResize minRows={2} maxRows={8} />
```

Grows with content up to `maxRows`, then scrolls.

### With character counter

```tsx
const [text, setText] = useState("");
<Textarea
  value={text}
  onChange={(e) => setText(e.target.value)}
  maxLength={500}
/>
<FieldDescription>{text.length} / 500</FieldDescription>
```

Show counter when approaching max (>80%).

## States

| State | Visual |
| --- | --- |
| Default | Border + transparent bg |
| Focused | Brand-color border ring |
| Filled | Same as default with content |
| Disabled | Reduced opacity, no events |
| Read-only | No focus ring, muted bg |
| Error | Red border |

## Tokens consumed

```
--textarea-bg
--textarea-fg
--textarea-placeholder
--textarea-border
--textarea-border-focus           (brand)
--textarea-border-error
--textarea-resize-handle          (drag corner)
--radius-md
--space-sm                        (padding)
--font-size-base
--font-family-text                (or monospace for code)
--motion-fast
```

## Accessibility

- Always use `<label htmlFor>` linking. Or `aria-label` for inline.
- `aria-invalid="true"` when error.
- `aria-describedby` references help text + error.
- For maxLength: `aria-label` should NOT include "(max 500)" — visible counter is enough.
- Korean IME composition: don't fire onChange / submit during composition.

## Korean IME

```tsx
const [composing, setComposing] = useState(false);

<Textarea
  value={text}
  onChange={(e) => !composing && setText(e.target.value)}
  onCompositionStart={() => setComposing(true)}
  onCompositionEnd={(e) => {
    setComposing(false);
    setText(e.currentTarget.value);
  }}
/>
```

Critical for Hangul input — composition events span multiple keystrokes.

## Code example

```tsx
<Field>
  <Label htmlFor="bio">자기소개</Label>
  <Textarea
    id="bio"
    rows={4}
    maxLength={500}
    placeholder="자기소개를 입력해 주세요"
    {...register("bio")}
  />
  <FieldDescription>
    {watch("bio")?.length ?? 0} / 500
  </FieldDescription>
</Field>
```

## Don't

- Don't omit `<label>`.
- Don't auto-grow beyond viewport. Cap with `maxRows`.
- Don't use Textarea for rich-text needs (bold / italic / link). Use a real RTE.
- Don't ignore Korean IME composition events.

## References

- HTML5 `<textarea>`
- shadcn-ui: [`textarea`](../docs/reference/shadcn-ui.md#textarea)
- MUI: TextareaAutosize

## Cross-reference

- [`examples/component-input.md`](component-input.md) — single-line variant
- [`examples/component-textarea-autosize.md`](component-textarea-autosize.md) — autoResize specifics
- [`examples/component-field.md`](component-field.md) — common wrapper
