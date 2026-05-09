<!-- hand-written -->
---
title: AI chat interfaces (ChatGPT, Claude, LLM-based UX)
applies_to: [ai-chat, llm, chatgpt, conversational]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# AI chat interfaces

LLM-based chat (ChatGPT, Claude, Gemini, Perplexity, character.ai) has its own emerging UX conventions. Different from rule-based chatbots: more capable, more open-ended, but with novel UX challenges around hallucinations, latency, context length, and trust.

Read [`conversational-ui-fundamentals.md`](conversational-ui-fundamentals.md) and [`chatbot-design.md`](chatbot-design.md) first.

## What's different about AI chat

vs traditional chatbot:
- **Free-form input** — users type anything, model interprets.
- **Long-form output** — paragraphs, code, lists, not just one-line replies.
- **Streamed responses** — token-by-token, not waiting for completion.
- **Multi-turn context** — system holds prior messages within session.
- **Multimodal** — image upload, file analysis, voice (varies by model).
- **Hallucinations** — model can be confidently wrong.
- **Cost per token** — long conversations expensive.

These shape the UI.

## Anatomy of an AI chat UI

```
┌──────────────────────────────────────────┐
│ [Brand] Chat                       [⚙ ⏷] │   ← header (model selector)
├──────────────────────────────────────────┤
│ [Sidebar]  │  Today                       │
│            │  ─────                       │
│ + New chat │                              │
│            │  User: How do I fix...?      │
│ Today      │                              │
│ • Chat 1   │  Assistant: To fix this...   │
│ • Chat 2   │  [code block]                │
│            │  [continue][regenerate][copy]│
│ Yesterday  │                              │
│ • Chat 3   │  ───── input ─────           │
│            │ [Type a message...]    [▶]   │
│            │ [Attach] [Voice] [Search]    │
└──────────────────────────────────────────┘
```

## Input affordances

### Multi-line input

Most AI chat allows multi-line input (Shift+Enter for newline; Enter to send):

```
[Long multi-line text area, expanding as user types]
[Send button]
```

For complex queries, code paste, full-document review.

### Attachments

- **Image upload** (Claude, GPT-4o): drag-drop or button.
- **File upload** (PDFs, docs, code): paid tiers; drag-drop.
- **Multiple files** in one message.
- **Visible attachments** above input field as chips before send.

### Slash commands / mentions

Some AI tools have:
- **Slash commands** — `/help`, `/reset`, `/model gpt-4`.
- **Mentions** — `@persona` or `@tool` to invoke specific AI / tool.
- **Sample prompts** — pre-written suggestion chips.

For developer tools (Cursor, Claude Code): slash commands are core.

### Voice input

Increasingly common (ChatGPT voice mode, Claude voice on mobile):
- Tap-to-talk.
- Real-time transcription preview.
- Voice + text hybrid.

## Output rendering

AI responses are richer than chatbot replies:

| Element | Render |
| --- | --- |
| **Markdown** | Bold, italic, lists, headings rendered |
| **Code blocks** | Syntax-highlighted; with copy button |
| **Inline code** | Monospace |
| **Math (LaTeX)** | Rendered with KaTeX / MathJax |
| **Tables** | Proper HTML tables |
| **Links** | Clickable, sometimes with preview |
| **Mermaid diagrams** | Rendered if requested |
| **Images** | Inline if generated / referenced |

Don't show raw markdown — render it.

For Korean: same markdown rendering; Korean text in code blocks works (Pretendard / Monaspace Argon supports Korean monospace if needed).

## Streaming responses

The single most important UX difference:

```
[blank screen — bad]
   ↓
[• word           ]  ← starts at 200ms
[• word word      ]
[• word word word ]  ← user reads while it streams
[...]
```

Implementation:
- **Server-Sent Events (SSE)** stream tokens.
- **Render incrementally** — append to message bubble.
- **Cursor / blinking** indicator at end of streaming text.
- **Stop button** — let user halt mid-stream.

Streaming makes 30-second responses feel acceptable. Without streaming, 30s feels broken.

## Stop / regenerate / continue

Standard controls below an AI response:

| Action | Use |
| --- | --- |
| **Stop generating** | While streaming; halt response |
| **Regenerate** | New response to same prompt |
| **Continue** | Long response truncated; ask for more |
| **Copy** | Copy entire response or code block |
| **Edit** (user message) | Edit user's prior message; regenerates everything after |
| **Branch** | Save current path; explore alternative |
| **Share** | Share conversation link |

Place inline below each AI response, not in a hidden menu.

## Context length and truncation

Models have context limits (8k, 32k, 128k, 200k+ tokens). Long conversations exceed:

- **Sliding window** — drop oldest messages when over limit.
- **Summarization** — auto-summarize old messages, keep recent.
- **Visible indicator** — "context near limit" warning.
- **Manual reset** — "New chat" button always visible.

For long conversations: file uploads or "memory" features offload context.

## Hallucination handling

LLMs confidently produce wrong answers. UX mitigations:

- **Source citations** — show which docs / web results informed the answer.
- **Confidence indicators** — vague when unsure.
- **Disclaimers** — "AI can make mistakes. Verify important info."
- **Verifiable claims** — direct quotes / page references.
- **User feedback** — thumbs up/down to improve.

For factual products (search, research): always provide citations.
For creative products (writing, ideation): less critical.

## Trust and disclosure

Be transparent:
- **AI-generated label** — small but visible.
- **Model version** — "Powered by GPT-4o" / "Claude 3.5 Sonnet".
- **Data usage policy** — does prompt training happen? Disclose.
- **Conversation storage** — retained / deletable.

## Chat history sidebar

Sidebar shows past conversations:

```
[+ New chat]

Today
• Working on the design system
• Help with React component
• ...

Yesterday
• Korean language practice
• ...

Last week
• ...
```

Features:
- **Search** through history.
- **Rename** conversations.
- **Delete** individual or all.
- **Export** conversation.
- **Pinned / favorites** at top.

## Multi-modal output

Some AI models output more than text:

| Output | Render |
| --- | --- |
| **Generated image** (DALL-E, Imagen) | Inline image with download |
| **Generated audio** (TTS, music) | Audio player |
| **Generated code execution** (Code Interpreter, Artifacts) | Sandboxed runtime, output rendering |
| **Generated documents** (Claude Artifacts) | Side-pane preview |

For Claude / GPT artifacts (live HTML / React preview): split-pane interface, code on left, preview on right.

## Suggestions / next steps

After a response, suggest follow-ups:

```
[AI response about React performance]

Ask follow-up:
[Show me an example with hooks] [What about Vue?] [Profile this code]
```

Reduces typing for common follow-ups.

## Voice mode UX

ChatGPT / Claude voice modes:

| Element | Behavior |
| --- | --- |
| Activation | Mic icon or wake word (varies) |
| Visual | Animated orb / wave during listening / speaking |
| Interruption | User can interrupt AI mid-speech |
| Transcript | Optional visible text |
| Modes | "push to talk" or "open conversation" |

Voice mode latency target: < 1 second to first audio for natural feel. Hard to achieve with full LLM round-trip + TTS.

## Mobile vs desktop

| Surface | Differences |
| --- | --- |
| Mobile | Vertical stack; full-screen chat; voice prominent |
| Desktop | Sidebar + main; multi-column; keyboard shortcuts |
| Tablet | Either; usually closer to desktop |

For developer tools (Cursor, Claude Code): heavy keyboard shortcuts, side-by-side code + chat, multi-window.

## Memory / personalization

Modern AI tools have "memory":
- **Persistent memory** — model remembers facts across sessions.
- **Custom instructions** — user-defined preferences applied to all chats.
- **Project / Workspace** — scoped memory + files for related work.

UX:
- **Memory indicator** — visible when memory used / created.
- **Edit / delete memory** — user can manage.
- **Per-project scope** — separate from general memory.

## Keyboard shortcuts (desktop)

| Shortcut | Action |
| --- | --- |
| Cmd/Ctrl + Enter | Send |
| Shift + Enter | Newline |
| Cmd/Ctrl + K | New chat |
| Cmd/Ctrl + L | Focus input |
| Cmd/Ctrl + Shift + O | New chat |
| Cmd/Ctrl + / | Show shortcuts |
| Esc | Close current modal / cancel generation |
| Up arrow | Edit last message |

For developer tools: more shortcuts (Vim-style, multi-cursor).

## Korean AI chat

Korean LLM products (2024+):
- **HyperCLOVA X** (Naver) — Korean-strong LLM.
- **Bixby Text Call** (Samsung) — AI text generation in messaging.
- **A.X / Kakao i** (Kakao) — Korean assistant.
- **GPT / Claude / Gemini** Korean support — adequate to strong.

For Korean AI chat UI:
- Korean primary; English code / technical content OK.
- 해요체 default tone (friendly).
- Pretendard / NanumSquare / Apple SD Gothic Neo for body.
- Korean code-block content rendered correctly (Pretendard JetBrains Mono / Monaspace Argon).

## Common AI chat mistakes

- **No streaming** — feels broken at 5+ second responses.
- **Hidden controls** — regenerate / stop in submenu.
- **Truncated responses without "continue"** — frustrating.
- **No copy button** — users can't copy code / responses.
- **Markdown not rendered** — raw asterisks / brackets visible.
- **No history search** — users can't find past chat.
- **No disclaimer** — users trust AI as authoritative.
- **No way to start fresh** — context grows indefinitely.
- **No model identification** — users don't know what they're using.

## Don't

- Don't ship without streaming.
- Don't hide stop / regenerate / copy.
- Don't render raw markdown.
- Don't pretend the AI is infallible. Disclose.
- Don't truncate without "continue" affordance.
- Don't lose chat history without warning.
- Don't make context-management opaque. Show when limits hit.
- Don't ship without keyboard shortcuts on desktop.

## Cross-reference

- [`knowledge/conversational/conversational-ui-fundamentals.md`](conversational-ui-fundamentals.md) — fundamentals
- [`knowledge/conversational/voice-ui-patterns.md`](voice-ui-patterns.md) — voice
- [`knowledge/conversational/chatbot-design.md`](chatbot-design.md) — traditional bots
- [`knowledge/conversational/korean-voice-conventions.md`](korean-voice-conventions.md) — KR
- [`examples/component-chat-interface.md`](../../examples/component-chat-interface.md) — chat UI spec
- [`examples/component-voice-input.md`](../../examples/component-voice-input.md) — voice input
- [`knowledge/patterns/technical-writing.md`](../patterns/technical-writing.md) — markdown rendering
