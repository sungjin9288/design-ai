# conversational-ui-designer — playbook

Design and spec a conversational UI — voice assistant, chatbot, AI chat (LLM-based), or live-agent chat. Output is a markdown spec covering modality, intent model, persona, error handling, accessibility, and Korean conventions where applicable.

## When to use

- "Design a chatbot for our customer support."
- "Spec a voice search feature for our app."
- "Plan AI chat onboarding for our product."
- "Build a Bixby Capsule for our service."
- "Design KakaoTalk Channel chatbot."

## Inputs (ask if missing)

1. **Type** — voice assistant / chatbot / AI chat / live agent / hybrid.
2. **Modality** — voice-only / voice + visual / text-only / multimodal.
3. **Use case** — customer support / FAQ deflection / lead capture / transactional / AI help.
4. **Audience** — Korean / international / mixed.
5. **Brand voice** — formal (합쇼체) / friendly (해요체) / casual.
6. **Backend** — rule-based / intent-based (Dialogflow / Rasa) / LLM (GPT / Claude / HyperCLOVA) / hybrid.
7. **Platform** — own app / KakaoTalk channel / Bixby Capsule / Slack / web embed.
8. **Existing brand** — voice + persona constraints.

## Steps

### 1. Pick the type

| Type | Read |
| --- | --- |
| Voice assistant / smart speaker / IVR | [`voice-ui-patterns.md`](../../knowledge/conversational/voice-ui-patterns.md) |
| Chatbot (rule / intent / hybrid) | [`chatbot-design.md`](../../knowledge/conversational/chatbot-design.md) |
| AI chat (LLM) | [`ai-chat-interfaces.md`](../../knowledge/conversational/ai-chat-interfaces.md) |
| Korean market | [`korean-voice-conventions.md`](../../knowledge/conversational/korean-voice-conventions.md) |

Always read [`conversational-ui-fundamentals.md`](../../knowledge/conversational/conversational-ui-fundamentals.md).

### 2. Spec the modality

| Modality | Affordance |
| --- | --- |
| Voice-only | Wake word OR push-to-talk; auditory feedback |
| Voice + visual | Voice in, visual out; tap-to-talk |
| Text-only | Persistent input; suggested chips |
| Multimodal AI | Text + image + voice; streaming |

Make modality explicit. Affects everything downstream.

### 3. Define persona

| Dimension | Decide |
| --- | --- |
| Honorific level (KR) | 합쇼체 / 해요체 |
| Formality | Formal / friendly / casual |
| Verbosity | Terse / discursive |
| Warmth | Professional / warm |
| Emoji use | Never / rare / frequent |
| Address user | 고객님 / 회원님 / [name]님 |
| Bot self-identity | "저는 [봇 이름]" / "[브랜드] 봇" |

For Korean B2C fintech: 해요체, friendly, terse-warm, 고객님, no emoji.
For Korean B2B: 합쇼체, formal, professional, 회원님.

### 4. Spec turn-taking model

For voice / IVR:
- Wake word OR tap-to-talk activation.
- End-of-utterance detection (silence timeout).
- Multi-turn dialogue with slot-filling.
- Confirmation for destructive actions.

For chat:
- Persistent input.
- Send on Enter / button.
- Bot responds with typing indicator → message.
- Suggested chips reduce typing.

For AI chat:
- Streaming response (token-by-token).
- Stop / regenerate / continue.
- Markdown render.
- Long context handling.

### 5. Plan intent / NLU

For rule-based:
- Decision tree of buttons.

For intent-based:
- Top intents (5-30 typically).
- Slot definitions per intent.
- Training utterances per intent (10-50 each).
- Fallback intent.

For LLM-based:
- System prompt defining persona + constraints.
- Tool definitions (if function calling).
- Context window management.
- Hallucination mitigations (citations, confidence).

For hybrid: buttons + intent + LLM fallback + human handoff.

### 6. Plan error recovery

For each failure type:
- Misheard / no speech → retry prompt.
- Misclassified intent → "Did you mean X?" with options.
- No matching intent → fallback to LLM OR human handoff.
- Backend error → graceful retry / alternate path.
- Repeated failures (2-3) → human handoff.

### 7. Plan multi-turn flows

For complex tasks (booking, troubleshooting):
- Slot-filling order.
- Confirmation step.
- Cancel / restart at any point.
- Save partial progress.

Sketch as a flow diagram.

### 8. Plan handoff to human (if applicable)

- Always-available "human" request.
- Context transfer (agent sees prior conversation).
- Wait time displayed.
- Off-hours behavior.
- Escalation triggers (failed N times, sensitive topic, user request).

### 9. Korean compliance (if applicable)

- **개인정보보호법** — voice recording / chat history consent + retention.
- **정보통신망법** — proactive marketing messages disclosed.
- **자본시장법 / 금융소비자보호법** — financial product disclaimers.
- **KakaoTalk Channel** rules (if deployed there).
- 자막 / TTS in Korean — verify pronunciation of brand / product names.

### 10. Plan accessibility

- Voice + text alt always available.
- Visual feedback for listening / processing.
- Transcript visible (deaf users).
- Reduced-motion handling.
- Adjustable TTS speed.
- High contrast / large text support.
- Keyboard navigation.

### 11. Output

```markdown
# Conversational UI spec: <surface>

> Type: <voice / chatbot / AI chat / live agent>
> Modality: <voice-only / voice+visual / text-only / multimodal>
> Use case: <support / FAQ / transactional / AI help>
> Audience: <KR / international>
> Backend: <rule / intent / LLM / hybrid>
> Platform: <own app / KakaoTalk / Bixby / web>

## Persona
<honorific level, formality, warmth, emoji, user addressing>

## Modality + affordances
<wake word / tap-to-talk / persistent input>

## Top intents (or LLM system prompt summary)
<5-30 intents with sample utterances>

## Conversation flows
<key multi-turn flows: support, transaction, AI ask>

## Error recovery
<for each failure: retry / fallback / handoff>

## Human handoff
<trigger criteria, transition UX>

## Korean compliance (if applicable)
<개인정보보호법, 정보통신망법, 자본시장법>

## Accessibility
<text alt, transcript visible, reduced motion, keyboard>

## UI components needed
<reference component-chat-interface, component-voice-input, etc>

## Don't
<2-3 specific misuses>
```

## Source files this skill reads

- [`knowledge/conversational/conversational-ui-fundamentals.md`](../../knowledge/conversational/conversational-ui-fundamentals.md)
- [`knowledge/conversational/voice-ui-patterns.md`](../../knowledge/conversational/voice-ui-patterns.md)
- [`knowledge/conversational/chatbot-design.md`](../../knowledge/conversational/chatbot-design.md)
- [`knowledge/conversational/ai-chat-interfaces.md`](../../knowledge/conversational/ai-chat-interfaces.md)
- [`knowledge/conversational/korean-voice-conventions.md`](../../knowledge/conversational/korean-voice-conventions.md)
- [`knowledge/i18n/korean-document-style.md`](../../knowledge/i18n/korean-document-style.md) — honorific level
- [`knowledge/i18n/korean-typography.md`](../../knowledge/i18n/korean-typography.md) — IME, fonts
- [`knowledge/patterns/email-design.md`](../../knowledge/patterns/email-design.md) — KR ad disclosure
- [`examples/component-chat-interface.md`](../../examples/component-chat-interface.md)
- [`examples/component-voice-input.md`](../../examples/component-voice-input.md)

## Verification phase (run before declaring done)

- [ ] Is the type (voice / chatbot / AI / live) explicit?
- [ ] Is the modality (voice / text / multi) explicit?
- [ ] Is the persona defined (honorific level, formality, warmth, emoji)?
- [ ] Is turn-taking model explicit (wake word / tap / persistent / streaming)?
- [ ] Are top intents OR LLM system prompt summary documented?
- [ ] Are key conversation flows mapped?
- [ ] Is error recovery specified for each failure type?
- [ ] Is human handoff path defined?
- [ ] If Korean: are 개인정보보호법 / 정보통신망법 / 자본시장법 addressed?
- [ ] If Korean: is honorific level + 고객님 / 회원님 / [name]님 specified?
- [ ] Is accessibility addressed (text alt, transcript, reduced motion)?
- [ ] Are required UI components listed?
- [ ] Does "Don't" catch 2-3 specific misuses?

## Done when

- One markdown spec, < 500 lines.
- Type + modality + use case + audience explicit.
- Persona defined.
- Turn-taking model specified.
- Top intents / system prompt documented.
- Conversation flows mapped.
- Error recovery + human handoff defined.
- Korean compliance addressed if applicable.
- Accessibility addressed.
- "Don't" section.
- Verification passes.
