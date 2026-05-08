<!-- hand-written -->
---
title: Conversational UI fundamentals (turn-taking, intents, context, modalities)
applies_to: [conversational-ui, voice, chat, ai-chat]
---

# Conversational UI fundamentals

Conversational UI is design for back-and-forth exchanges. Voice assistants (Siri, Bixby), chatbots (customer support), AI chat (ChatGPT, Claude), and voice-controlled features in apps all share a foundation: a turn-taking exchange where each side has limited information about the other.

This file is the foundation for [`voice-ui-patterns.md`](voice-ui-patterns.md), [`chatbot-design.md`](chatbot-design.md), [`ai-chat-interfaces.md`](ai-chat-interfaces.md), and [`korean-voice-conventions.md`](korean-voice-conventions.md).

## Modalities

| Modality | Examples |
| --- | --- |
| **Voice-only** | Smart speakers (Echo, Nest), in-car assistants |
| **Voice + visual** | Phone assistants (Siri, Bixby) — voice input, visual response |
| **Text-only chat** | SMS bots, Slack bots, in-app chatbots |
| **Multimodal AI chat** | ChatGPT (text + image upload + voice), Claude (text + image) |
| **Hybrid (voice → text)** | Voice search → text results |

Each modality has different constraints. Voice can't show a list of 20 options; chat can't convey vocal warmth. Pick the modality that matches the task.

## Turn-taking

Conversation is **turn-based**:

```
User:    [request]
System:  [response]
User:    [follow-up or new request]
System:  [response]
```

The system must:
1. **Detect end of turn** — when has the user finished speaking / typing?
2. **Respond appropriately** — relevant, paced, complete.
3. **Yield turn** — signal "your turn" via prompt, cursor, or pause.

For voice: end-of-utterance detection is hard. Pauses can be thinking, not finishing.

For chat: end of turn is "Send" button or Enter. Easy.

## Intents and slots (the canonical model)

Most voice / chatbot systems classify input via **intents**:

```
User: "Set a timer for 5 minutes"

Intent:        SET_TIMER
Slots:         duration: 5 minutes
```

The system maps utterance → intent + parameters → action.

| Concept | Definition |
| --- | --- |
| **Intent** | What the user wants (action / question type) |
| **Slot / entity** | Specific values (time, amount, name) |
| **Context** | Prior turns; user state; system state |
| **Confidence** | How sure the system is about the interpretation |

For LLM-based systems (ChatGPT, Claude): intents are implicit. The model interprets natural language end-to-end. But for product features (smart-home control, customer support), explicit intent + slot architecture is cheaper / more reliable.

## Conversational design principles

### 1. One thing per turn

Don't ask for two pieces of info in one turn:

✗ "What's your name and email?"
✓ "What's your name?" → user answers → "And your email?"

For visual chat: more info OK per turn (UI can hold a list). Voice: stricter.

### 2. Confirmation for destructive / costly actions

```
User: "Delete all my photos"
System: "Are you sure? This will delete 1,247 photos and can't be undone."
User: "Yes"
System: [does it]
```

Confirmation friction prevents accidents.

### 3. Graceful failure

When the system doesn't understand:

| Bad | Good |
| --- | --- |
| "Error" | "Sorry, I didn't catch that. Could you say it differently?" |
| Silence | Visible "Thinking..." indicator |
| Repeat exactly the same prompt | Try a re-phrase or offer alternatives |

After 2-3 failures: hand off to alternative (text input, human agent, settings menu).

### 4. Context-awareness

Remember context within a session:

```
User: "What's the weather in Seoul?"
System: "Sunny, 12°C."
User: "What about tomorrow?"   ← "tomorrow's weather in Seoul"
System: "Tomorrow in Seoul: cloudy, 9°C."
```

Don't make the user repeat "Seoul" every turn.

### 5. Be honest about capabilities

Don't pretend to know more than you do:

✗ "Yes, I can help you book a hotel" (when you can't)
✓ "I can search hotels, but you'll need to book on the hotel's site."

Misrepresentation breaks trust permanently.

### 6. Respect user time

- Voice: don't make users sit through long preamble.
- Chat: don't message-bomb (5 short messages = noise; one combined message is better).
- AI chat: stream tokens so user sees response forming, not just a blank screen.

## Streaming responses

For LLM-based chat, **stream the response token-by-token** rather than waiting for full completion:

```
[blank screen for 8 seconds] vs [text appears word-by-word starting at 200ms]
```

Streaming feels 10× faster even at the same total latency. Users see progress; mind fills in.

For voice: stream audio similarly (start speaking before full response is generated, hide TTS latency).

## Latency budgets

| Modality | Acceptable latency |
| --- | --- |
| **Voice (assistant)** | < 1 second to first audio |
| **Chat (typing indicator)** | < 500ms to typing indicator |
| **Chat (first response token)** | < 1 second |
| **AI chat full response** | streamed; total 5-30s OK |
| **Wake word detection** | < 200ms |

Beyond the budget: users assume broken / abandon.

## Affordances

For voice: how does the user know they can talk?
- **Wake word** ("Hey Siri", "OK Google", "헤이 빅스비").
- **Tap-to-talk** button (visible mic icon, button press, holding).
- **Always listening** mode (controversial; privacy concerns).

For chat:
- **Persistent input field** at bottom.
- **Suggested prompts** (chips above input) lower friction.
- **"Type a message..." placeholder** with hint of capabilities.

## Personality and voice

Conversational UI has personality. Define:

| Dimension | Examples |
| --- | --- |
| **Formality** | Casual ("Hey!") vs Formal ("How may I assist you?") |
| **Verbosity** | Terse vs Discursive |
| **Warmth** | Professional vs Warm |
| **Humor** | None vs Dry vs Playful |
| **Emoji** | Never vs Rare vs Frequent |

For Korean fintech: 해요체 friendly; minimal humor; emoji rare.
For Korean entertainment: 해체 / 해요체 casual; some humor; more emoji.
For Korean B2B: 합쇼체 formal; no humor; no emoji.

Pick deliberately and document. Don't let each engineer / writer pick differently.

## Speech-to-text (STT) and text-to-speech (TTS)

For voice UIs:

### STT (recognition)

- **Confidence scores** — each transcription has a confidence; below threshold = "Sorry, I didn't catch that".
- **Language model bias** — train STT on domain (medical, legal, fintech terms).
- **Noise robustness** — test in real environments (kitchen, car, street).
- **Latency** — STT runs in background; final transcript at end of utterance.

### TTS (synthesis)

- **Voice choice** — male / female / neutral; per-language.
- **Persona consistency** — use one voice per assistant; users build relationship.
- **Prosody** — emphasis, pauses, intonation matter. SSML allows control.
- **Latency** — pre-render common phrases; stream long ones.

For Korean: Naver Clova, Samsung Bixby, Google TTS Korean, ElevenLabs Korean — all available. Test for naturalness; some still sound robotic.

## Errors and recovery

### Voice errors

| Error | Recovery |
| --- | --- |
| Couldn't hear | "Sorry, could you say that again?" |
| Heard but didn't understand | "I'm not sure what you meant. Did you mean X or Y?" |
| Understood but can't do | "I can't do X. I can help with Y or Z." |
| System failure | "Something went wrong. Try again later or say 'help' for options." |

### Chat errors

| Error | Recovery |
| --- | --- |
| Network error | Retry button + offline indicator |
| AI response failed | "Couldn't generate response. Try again?" |
| Rate limited | "You've sent a lot of messages. Wait a minute." |
| Inappropriate content | "I can't help with that. Try rephrasing." |

After repeated failures: offer alternative (text input, human agent, web link).

## Privacy and consent

Voice especially has privacy implications:

- **Always-on listening** disclosure required.
- **Recording retention** disclosure (where stored, how long, who can access).
- **Opt-in for voice training** (using user audio to improve models).
- **Wake word false-positive** transparency — Apple, Amazon publish how often Siri / Alexa false-trigger.

For Korean market:
- Personal Information Protection Act (개인정보보호법) compliance.
- Consent flows for voice recording / storage.
- Right-to-delete for voice data.

For chat:
- Disclose if conversations are stored / used for training.
- Allow deletion.
- Clear what's visible to humans (support agents, training reviewers).

## Multilingual and code-switching

Korean conversational UI often has mixed Korean + English:

```
User: "맥북 프로 16인치 가격 알려줘"
User: "Schedule a meeting with 김철수 at 3pm"
```

System must:
- Handle code-switching (mixed language input).
- Preserve names / proper nouns in source language.
- Choose response language (match user's primary, or per query).

Modern LLMs handle this natively. Older intent-based bots struggle.

## Accessibility

### Voice UI accessibility

- **Visual transcript** of voice (deaf / hard-of-hearing).
- **Text alternative input** for users who can't speak (motor disability, voice issues).
- **Visual feedback** of audio (listening, processing, responding states).
- **Adjustable TTS speed**.

### Chat UI accessibility

- Standard text accessibility (contrast, screen reader support).
- Skip-to-content (long histories).
- ARIA live regions for new messages.
- Keyboard nav for messages (Up / Down to navigate).

For multimodal: provide both modalities. Voice-only excludes deaf users; text-only excludes low-vision / motor-impaired users.

## Don't

- Don't treat voice like a typed-command interface ("syntax errors" don't translate).
- Don't ignore confidence scores — low-confidence guesses are worse than asking.
- Don't bury error recovery in obscure phrases.
- Don't break context within a session.
- Don't lie about capabilities.
- Don't force users into long preamble before action.
- Don't leak privacy ("Did you say X?" loud in public is awkward).
- Don't ship without graceful degradation when backend is down.

## Cross-reference

- [`knowledge/conversational/voice-ui-patterns.md`](voice-ui-patterns.md) — voice-specific
- [`knowledge/conversational/chatbot-design.md`](chatbot-design.md) — text chat
- [`knowledge/conversational/ai-chat-interfaces.md`](ai-chat-interfaces.md) — LLM chat
- [`knowledge/conversational/korean-voice-conventions.md`](korean-voice-conventions.md) — KR
- [`knowledge/i18n/korean-document-style.md`](../i18n/korean-document-style.md) — honorific level
- [`knowledge/a11y/keyboard-and-focus.md`](../a11y/keyboard-and-focus.md) — keyboard a11y
