<!-- hand-written -->
# `ChatInterface` (custom — generic chat UI for chatbot / AI / live agent) — spec

> Reusable chat shell for chatbots, AI chat (LLM), and live customer support. Handles message rendering (markdown, code, attachments), streaming, suggested chips, typing indicators, and Korean conversational conventions. Pairs with [`knowledge/conversational/chatbot-design.md`](../knowledge/conversational/chatbot-design.md) and [`knowledge/conversational/ai-chat-interfaces.md`](../knowledge/conversational/ai-chat-interfaces.md).

## Purpose

Chat UIs are similar across products — chatbot, AI chat, live support — but differ in details. `ChatInterface` provides:
1. **Message list** with virtualization for long histories.
2. **Bot / user / agent** message styling.
3. **Markdown rendering** (for AI / rich bot messages).
4. **Streaming response** support.
5. **Suggested chips** (quick replies).
6. **Typing indicator**.
7. **Attachment** support.
8. **Korean voice conventions** baked in.

## Anatomy

```
┌──────────────────────────────────┐
│ [avatar] Brand Bot          [×]  │   ← header
├──────────────────────────────────┤
│                                  │
│  [Bot bubble]                    │
│  안녕하세요! 무엇을 도와드릴까요? │
│  ▼                               │
│  [상품 문의] [배송] [기타]         │   ← suggested chips
│                                  │
│                                  │
│                User bubble [▶]   │
│                  배송 언제 와요? │
│                                  │
│  [Bot typing...]                 │   ← typing indicator
│                                  │
├──────────────────────────────────┤
│ [📎] [Type a message...]   [▶]   │   ← input
└──────────────────────────────────┘
```

## API

```tsx
<ChatInterface
  messages={messages}
  onSend={handleSend}
  agentName="Aera Bot"
  agentAvatar="/avatar.png"
  variant="ai"                  // "chatbot" | "ai" | "live-agent"
  isTyping={isTyping}
  isStreaming={isStreaming}
  suggestions={suggestedChips}
  onSuggestionClick={handleSuggestion}
  attachments
  voice                          // enable voice input
  locale="ko-KR"
  honorificLevel="해요체"         // "합쇼체" | "해요체"
/>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `messages` | `Message[]` | `[]` | Conversation history |
| `onSend` | `(text: string, attachments?: File[]) => void` | — | Send handler |
| `agentName` | `string` | — | Display name (Bot / Agent name) |
| `agentAvatar` | `string` | — | Avatar URL |
| `variant` | `"chatbot" \| "ai" \| "live-agent"` | `"chatbot"` | Visual style preset |
| `isTyping` | `boolean` | `false` | Show typing indicator |
| `isStreaming` | `boolean` | `false` | Last message is streaming (cursor + stop button) |
| `onStop` | `() => void` | — | Stop streaming |
| `suggestions` | `Suggestion[]` | `[]` | Quick-reply chips |
| `onSuggestionClick` | `(s) => void` | — | Chip handler |
| `attachments` | `boolean` | `false` | Allow file / image attachment |
| `voice` | `boolean` | `false` | Show voice input button |
| `locale` | `string` | `"ko-KR"` | For date formatting + Korean rendering |
| `honorificLevel` | `"합쇼체" \| "해요체"` | `"해요체"` | Affects placeholder text |
| `inputPlaceholder` | `string` | locale default | Override input placeholder |
| `maxLength` | `number` | `4000` | Input character limit |
| `disabled` | `boolean` | `false` | Disable input (e.g., closed conversation) |

```ts
type Message = {
  id: string;
  role: "user" | "bot" | "agent" | "system";
  content: string | RichContent;
  timestamp: number;
  attachments?: Attachment[];
  status?: "sending" | "sent" | "failed" | "streaming";
};

type RichContent = {
  text?: string;
  markdown?: string;        // rendered with markdown
  card?: CardData;          // structured card
  carousel?: CardData[];    // multi-card carousel
};

type Suggestion = { id: string; label: string };
```

## Variants

### `chatbot`

Standard chatbot — friendly, branded, button-driven.
- Bot avatar visible.
- Suggested chips heavy.
- Markdown light or off.
- Typing indicator.

### `ai`

AI chat (LLM-based) — long-form, streamed, markdown-rich.
- No bot avatar OR minimal.
- Markdown / code blocks rendered.
- Streaming with cursor.
- Stop / regenerate / copy controls.
- Sidebar history (separate component).

### `live-agent`

Live support — human on the other side.
- Agent name + photo.
- Read receipts.
- Attachments common.
- Typing indicator.
- "Agent left the chat" state.

## States

| State | Visual |
| --- | --- |
| Empty (first time) | Greeting from bot + suggested chips |
| Active conversation | Messages stacked; latest at bottom |
| User typing | Input field active |
| Bot processing | Typing indicator (dots animation) |
| Streaming response | Last bot bubble grows; cursor at end; "Stop" button |
| Send failed | "Failed to send. Retry" on user message |
| Disabled | Input grayed out |
| End of conversation | Banner: "Chat ended" |

## Tokens consumed

```
--chat-bg                       (background)
--chat-bubble-bot-bg            (bot bubble)
--chat-bubble-bot-fg            (bot text)
--chat-bubble-user-bg           (user bubble — typically brand color)
--chat-bubble-user-fg           (user text)
--chat-bubble-agent-bg          (live agent bubble)
--chat-input-bg                 (input field)
--chat-input-fg                 (input text)
--chat-suggestion-bg            (chip bg)
--chat-suggestion-bg-hover
--chat-divider                  (separators)
--chat-timestamp-fg             (small timestamps)
--chat-typing-dot-color
--space-xs, --space-sm, --space-md
--radius-md, --radius-lg
--font-size-base, --font-size-sm
--motion-fast, --motion-medium
--ease-out
```

## Message rendering

### Plain text

```tsx
<MessageBubble role="bot">
  <p>안녕하세요! 무엇을 도와드릴까요?</p>
</MessageBubble>
```

### Markdown (AI variant)

```tsx
<MessageBubble role="bot">
  <Markdown>
    {`Here's how to fix it:

1. First, install the package
2. Then run \`npm start\`

\`\`\`js
const x = 5;
\`\`\`
    `}
  </Markdown>
</MessageBubble>
```

Renders headings, lists, bold, code blocks (syntax highlighted, copy button), links, tables.

### Card

```tsx
<MessageBubble role="bot">
  <ChatCard
    image="/product.jpg"
    title="Product Name"
    subtitle="Description"
    price="₩50,000"
    actions={[
      { label: "Buy", action: handleBuy },
      { label: "Details", action: handleDetails },
    ]}
  />
</MessageBubble>
```

### Carousel

```tsx
<MessageBubble role="bot">
  <ChatCarousel cards={cards} />
</MessageBubble>
```

Horizontal scroll on mobile; arrow buttons on desktop.

### Streaming

```tsx
<MessageBubble role="bot" status="streaming">
  <Markdown stream>
    {streamingContent}
  </Markdown>
  <StreamCursor />
</MessageBubble>
```

Renders incrementally. Append tokens to `streamingContent`.

## Suggested chips

```tsx
<Suggestions>
  {suggestions.map(s => (
    <Suggestion key={s.id} onClick={() => onSuggestionClick(s)}>
      {s.label}
    </Suggestion>
  ))}
</Suggestions>
```

Rules:
- 3-5 chips max.
- Clear under last bot message.
- Disappear after user sends a message (or shortly after).
- Korean copy: short ("배송 문의" not "배송에 대해 문의하기").

## Typing indicator

```
●○○  (dot animation)
```

Standard 3-dot loop:
- 200ms per cycle.
- Three dots fade in sequence.
- Position: under bot avatar / left side.
- Hide when message arrives.

## Input

```tsx
<ChatInput
  value={input}
  onChange={setInput}
  onSend={handleSend}
  placeholder={inputPlaceholder ?? "메시지를 입력해 주세요..."}
  attachments={attachments}
  onAttach={handleAttach}
  voice={voice}
  onVoice={handleVoice}
  maxLength={4000}
  disabled={disabled}
  multiline
/>
```

Behavior:
- Enter sends; Shift+Enter newline.
- Auto-grow up to 5 lines, then scroll.
- Char counter visible if > 80% of max.
- Voice button replaces send when input empty (some patterns).

For Korean IME: handle composition events properly. Don't send mid-composition (handle `compositionstart` / `compositionend`).

## Attachments

```tsx
<AttachmentPreview
  files={pendingAttachments}
  onRemove={handleRemove}
/>
```

Above input field, show pending attachments as chips with thumbnail. Remove via X button.

Inside messages: render image inline; PDF / file as card with icon.

## Accessibility

- **Live region** for new messages: `<div role="log" aria-live="polite">`.
- **Per-message labels**: `<article role="group" aria-labelledby="msg-id-author">`.
- **Send button**: `aria-label="메시지 전송"`.
- **Suggestion chips**: focusable, Enter to activate.
- **Stop streaming button**: focusable, Esc shortcut.
- **Read aloud option** for users who prefer voice (TTS button per message).
- **Adjustable text size** via parent (chat respects body font scaling).
- **Color contrast**: bot vs user bubbles meet WCAG AA against bg.

## Implementation hints

```tsx
function ChatInterface({ messages, onSend, isTyping, isStreaming, ... }: Props) {
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length]);

  return (
    <div className="chat-interface" data-variant={variant}>
      <ChatHeader name={agentName} avatar={agentAvatar} />
      <div ref={listRef} className="chat-list" role="log" aria-live="polite">
        {messages.map(m => (
          <MessageBubble key={m.id} message={m} variant={variant} />
        ))}
        {isTyping && <TypingIndicator />}
      </div>
      {suggestions.length > 0 && (
        <Suggestions suggestions={suggestions} onClick={onSuggestionClick} />
      )}
      <ChatInput
        onSend={onSend}
        placeholder={inputPlaceholder}
        disabled={disabled || isStreaming}
        // ...
      />
      {isStreaming && <StopButton onClick={onStop} />}
    </div>
  );
}
```

## Korean conventions

| Aspect | Default |
| --- | --- |
| Greeting | "안녕하세요! 무엇을 도와드릴까요?" |
| User addressing | "고객님" or "[username]님" |
| Honorific level | 해요체 default |
| Input placeholder | "메시지를 입력해 주세요..." |
| Send button label | "전송" or icon ▶ |
| Attach button | "파일 첨부" |
| Voice button | "음성으로 입력" |
| Stop button | "중지" |
| Typing indicator label | "[bot name]이(가) 입력 중..." |
| Failed send | "전송 실패. 다시 시도하시겠어요?" |

For Korean IME: don't trigger send on Enter while composition is active (Hangul composition mid-character). Listen to `compositionend` to allow send.

## Edge cases

- **Very long message history**: virtualize (react-window). Don't render 10,000 messages in DOM.
- **Network failure mid-send**: optimistic UI; show "Failed" with retry on user bubble.
- **Streaming canceled**: trim to last delivered token; show "stopped" indicator.
- **Switching between bot ↔ human**: visual transition (banner: "Connecting to agent..." → agent name appears).
- **Conversation timeout / agent left**: banner; input disabled with explanation.
- **Multiple attachments**: show as chip row above input.
- **Message reactions** (thumbs up/down on AI responses): inline icons.
- **Edit message** (AI variant — edit user's prior message regenerates everything after): warning + confirm.
- **Korean IME composition**: handle properly, don't double-send.
- **RTL languages**: layout flips; bubbles align right for LTR / left for RTL.

## Don't

- Don't render raw markdown for AI variant. Render it.
- Don't auto-scroll if user has scrolled up (let them read history).
- Don't disable copy. Users want to copy AI responses.
- Don't ignore Korean IME. Composition events matter.
- Don't show typing indicator for > 30 seconds. Show error if backend stuck.
- Don't lose user's draft on accidental close. Persist locally.
- Don't render inline scripts in markdown. Sanitize.
- Don't ship without keyboard shortcuts (desktop).

## Cross-reference

- [`knowledge/conversational/chatbot-design.md`](../knowledge/conversational/chatbot-design.md) — chatbot patterns
- [`knowledge/conversational/ai-chat-interfaces.md`](../knowledge/conversational/ai-chat-interfaces.md) — AI chat
- [`knowledge/conversational/conversational-ui-fundamentals.md`](../knowledge/conversational/conversational-ui-fundamentals.md) — fundamentals
- [`knowledge/conversational/korean-voice-conventions.md`](../knowledge/conversational/korean-voice-conventions.md) — KR
- [`examples/component-voice-input.md`](component-voice-input.md) — voice input
- [`knowledge/i18n/korean-typography.md`](../knowledge/i18n/korean-typography.md) — Hangul + IME
