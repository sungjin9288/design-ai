<!-- hand-written -->
---
title: Chatbot design (rule-based, intent-driven, hybrid)
applies_to: [chatbot, conversational, customer-support]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Chatbot design

Chatbots are conversational text interfaces, often for customer support, FAQ deflection, lead capture, or transactional flows. This file covers traditional / intent-based / hybrid chatbots; for LLM-based AI chat (ChatGPT-style), see [`ai-chat-interfaces.md`](ai-chat-interfaces.md).

Read [`conversational-ui-fundamentals.md`](conversational-ui-fundamentals.md) first.

## Three architectures

### 1. Rule-based / button-driven

User clicks options; bot responds per scripted tree.

```
Bot:  "What can I help with?"
       [Order status]  [Returns]  [Other]
User: [taps "Order status"]
Bot:  "Please share your order number."
User: "ORD-12345"
Bot:  [looks up; responds with status]
```

Pros: predictable, cheap, no AI.
Cons: rigid; users escape via "Other" → human.

### 2. Intent-based (NLP / classifier)

User types free text; bot classifies intent and responds.

```
User: "Where's my package?"
[Intent: ORDER_STATUS]
Bot:  "Sure, let me check. What's your order number?"
```

Tools: Dialogflow, Rasa, Microsoft Bot Framework, Amazon Lex.

Pros: more natural; users don't have to find buttons.
Cons: misclassifies; needs training data; updates are work.

### 3. Hybrid (intent + buttons + LLM fallback)

Most modern chatbots:
- Buttons for common flows.
- Intent classification for typed input.
- LLM fallback when intent unknown.
- Human handoff when stuck.

```
User: [opens chat]
Bot:  "Hi! What can I help with?"
       [Order status]  [Returns]  [Other questions]

User: "I want to know about your shipping policy"
[Intent classified: SHIPPING_INFO; confidence 0.85]
Bot:  "We ship within 1-3 days for domestic..."
       [Track package]  [Talk to a human]
```

Pros: best of all. Cons: more engineering.

## Anatomy of a chatbot UI

```
┌──────────────────────────┐
│ Chat with Support      [×] │   ← header
├──────────────────────────┤
│  Bot: 안녕하세요! 무엇을      │
│       도와드릴까요?         │
│                          │
│  [상품 문의] [반품 문의] [기타]│   ← suggested chips
│                          │
│  User: 배송 언제 와요?      │
│                          │
│  Bot: 주문 번호를 알려주세요.│
│                          │
│  [Bot is typing...]       │   ← typing indicator
├──────────────────────────┤
│ Type a message...   [Send]│   ← input
└──────────────────────────┘
```

### Anatomy parts

| Part | Purpose |
| --- | --- |
| Header | Branding, agent identity, close button |
| Message list | Scrollable history of turns |
| Bot bubble | Bot messages; typically left-aligned, distinct color |
| User bubble | User messages; right-aligned, brand color |
| Suggested chips | Quick reply buttons below bot message |
| Typing indicator | "..." while bot processes |
| Input field | Text entry + Send button |
| Attachment | File / image upload (if supported) |

## Conversation patterns

### Greeting

First message sets tone:

| Style | Example |
| --- | --- |
| Helpful | "Hi! What can I help with today?" |
| Branded | "Welcome to [Brand]. How can we make your day better?" |
| Direct | "What's your question?" |
| Korean (해요체) | "안녕하세요! 무엇을 도와드릴까요?" |

Don't greet with feature list — overwhelms.

### Quick replies

Suggested next-step buttons. Reduces typing friction:

```
Bot: "What kind of issue?"
     [Login problem]  [Payment]  [Bug report]
```

Quick replies should:
- Be 3-5 max (more = scroll / paralysis).
- Cover 80% of common cases.
- Always include "Other / 기타" escape.

### Forms in chat

Long forms in chat = bad. Two patterns:

**Inline questions** (one-at-a-time):

```
Bot: "What's your name?"
User: "John"
Bot: "Email?"
User: "john@example.com"
```

OK for 2-4 fields. Above that, switch to form embed.

**Form card** (embedded):

```
Bot: "Please complete this:"
    ┌─────────────────────┐
    │ [Name field]        │
    │ [Email field]       │
    │ [Issue type ▼]      │
    │ [Description text]  │
    │      [Submit]       │
    └─────────────────────┘
```

For 5+ fields. Don't make user type "name", "email" via separate turns.

### Lists / cards

Bot can show rich card content (product list, search results):

```
Bot: "Found these for you:"

[Product card 1]   [Product card 2]   [Product card 3]
[image]            [image]            [image]
[name]             [name]             [name]
[price]            [price]            [price]
[Buy]              [Buy]              [Buy]
```

Carousel-style or grid. Keep cards small; full detail behind tap.

### Confirmation

Before destructive / costly actions:

```
Bot: "Just to confirm: cancel order ORD-12345 for ₩50,000?"
User: [Yes, cancel]  [No, keep it]
```

## Korean chatbot conventions

- **Greeting**: "안녕하세요" + 해요체.
- **Confirmation**: 합쇼체 sometimes for formality ("주문을 취소하시겠습니까?").
- **Channel integration**: 카카오톡 채널 — bots common in KakaoTalk.
- **Customer service** chatbots heavy in fintech, e-commerce, telecom.

For 카카오톡 채널 bots:
- Use Kakao's bot builder (i 챗봇 / Kakao Channel).
- Persona consistency with the company's main brand.
- Often hand off to human after 2-3 unresolved turns.
- Operating hours displayed.

## Empty states / no-match

When bot doesn't understand:

| Recovery | Phrase |
| --- | --- |
| Re-ask | "Sorry, could you rephrase?" |
| Suggest | "I can help with: [Order] [Returns] [Returns]. Which?" |
| Hand-off | "Let me connect you with a human." |
| Search alternative | "Try asking differently or search our help center." |

After 2-3 failures: hand off, don't keep cycling.

## Human handoff

Critical for chatbot UX:

```
Bot: "Let me get a person to help. One moment..."
[connecting indicator]
[Human agent joins]
Agent: "Hi, I'm 김대리. How can I help?"
```

Design:
- **Always available** — user can request "human" at any point.
- **Context transfer** — agent sees the prior conversation; user doesn't repeat.
- **Wait time displayed** — "Estimated wait: 3 minutes" / "Position 4 in queue".
- **Off-hours behavior** — "We're closed; leave a message" or schedule callback.

## Personality

Bots should feel consistent:

| Pattern | Use |
| --- | --- |
| **Branded persona** | "I'm Aera Bot, here to help." |
| **Generic helpful** | Standard support tone |
| **Anonymous** | Just "Bot" or company name |

Don't pretend bot is a human. Disclose: "You're chatting with an AI assistant; switch to a human anytime."

For Korean: 자기소개 ("저는 [브랜드] 봇이에요") common; helps relationship.

## Persistent vs ephemeral

| Type | Use |
| --- | --- |
| **Persistent** (history saved) | Customer support; multi-session; transactional |
| **Ephemeral** (cleared on close) | One-shot help; non-sensitive |

For persistent:
- User can return and see history.
- Cross-device sync.
- Privacy: user can delete history.

For ephemeral:
- Less storage, simpler.
- User can't refer to past.
- Common for onboarding bots.

## Notification UX

For persistent chatbots that proactively message:

- **Notification badge** on chat icon when new bot message.
- **Sound / push** when bot messages user (configurable).
- **Quiet hours** — don't bot-message at 3am.

## Accessibility

- **ARIA live region** for new messages (screen reader announces).
- **Keyboard nav** — Tab to focus input; Up/Down to navigate messages.
- **Read aloud** option for users who prefer voice.
- **Adjustable text size**.
- **Color contrast** for bubble bg / text.
- **Suggested chips**: must be focusable + keyboard activatable.

## Performance

- **Streaming bot responses** when LLM-driven.
- **Lazy-load message history** when long.
- **Debounce typing indicator** updates.
- **Optimistic send** — show user's message immediately, retry if failed.

## Common chatbot mistakes

- **Hiding human handoff** — users get trapped.
- **Long preamble** — bot's first 3 messages before action.
- **Confusing "I" / "we"** — pretending bot has feelings or memories it doesn't.
- **Robotic confirmations** — "I have processed your request" vs "Done!"
- **Not handling typos** — strict matching breaks.
- **Forgetting context** within session.
- **Spam-style proactive messages**.

## Don't

- Don't pretend the bot is human.
- Don't make human handoff hidden / hard.
- Don't write the bot's first message as a feature menu.
- Don't run forms longer than 2-3 turns inline. Switch to form card.
- Don't ignore typos / variations.
- Don't push proactive messages outside business hours.
- Don't hide what data the bot stores. Be transparent.

## Cross-reference

- [`knowledge/conversational/conversational-ui-fundamentals.md`](conversational-ui-fundamentals.md) — fundamentals
- [`knowledge/conversational/voice-ui-patterns.md`](voice-ui-patterns.md) — voice
- [`knowledge/conversational/ai-chat-interfaces.md`](ai-chat-interfaces.md) — LLM-based
- [`knowledge/conversational/korean-voice-conventions.md`](korean-voice-conventions.md) — KR
- [`examples/component-chat-interface.md`](../../examples/component-chat-interface.md) — chat UI spec
