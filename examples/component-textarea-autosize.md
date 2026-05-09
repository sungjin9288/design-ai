# `TextareaAutosize` — spec

> Synthesized from MUI `TextareaAutosize`. A `<textarea>` that grows with its content. Sibling to `Textarea` (with optional `autoResize`); shipped as separate primitive in MUI for use without other Textarea behaviors.

## When to use

- Comment fields that should grow as user types.
- Chat input that expands to multiple lines.
- Form fields where content length varies wildly (description, bio).

## API

```tsx
<TextareaAutosize
  minRows={2}
  maxRows={8}
  placeholder="Type a message..."
  value={message}
  onChange={(e) => setMessage(e.target.value)}
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `minRows` | `number` | `1` | Floor — height matches at least this many rows |
| `maxRows` | `number` | — | Cap — past this, scroll inside |
| `value` / `onChange` | controlled | — | Standard textarea props |
| `placeholder` | `string` | — | — |

## Implementation note

CSS-only autoResize via field-sizing (modern):

```css
textarea {
  field-sizing: content;
  min-height: 2lh;
  max-height: 8lh;
}
```

`field-sizing: content` (CSS Working Draft, in Chrome / Safari / Firefox 2024+) handles this natively.

For older browsers: JS measurement via hidden cloned textarea OR a ref + scrollHeight.

```tsx
const ref = useRef<HTMLTextAreaElement>(null);

useEffect(() => {
  if (!ref.current) return;
  ref.current.style.height = "auto";
  ref.current.style.height = `${ref.current.scrollHeight}px`;
}, [value]);
```

## States

Same as Textarea. Grows in addition to standard states.

## Tokens consumed

Same as `component-textarea.md`. Plus:

```
--textarea-line-height            (lh unit base)
```

## Accessibility

- Same as Textarea — `<label>` linking, `aria-invalid`, IME handling.
- Resize handle (browser-default) usually visible. For `field-sizing: content`, no manual handle.

## Code example — chat input

```tsx
function ChatInput() {
  const [message, setMessage] = useState("");

  return (
    <div className="chat-input">
      <TextareaAutosize
        minRows={1}
        maxRows={5}
        placeholder="메시지를 입력하세요..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            send();
          }
        }}
      />
      <Button onClick={send}>Send</Button>
    </div>
  );
}
```

## Don't

- Don't auto-grow beyond viewport. Always set `maxRows`.
- Don't break Korean IME with Enter handler — check `isComposing` before submit.
- Don't measure on every keystroke without debouncing.

## References

- MUI: [`TextareaAutosize`](../refs/mui/packages/mui-material/src/TextareaAutosize)
- CSS `field-sizing` property (Working Draft)

## Cross-reference

- [`examples/component-textarea.md`](component-textarea.md)
- [`examples/component-chat-interface.md`](component-chat-interface.md)
