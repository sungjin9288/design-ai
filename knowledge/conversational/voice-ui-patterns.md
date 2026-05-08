<!-- hand-written -->
---
title: Voice UI patterns (smart speakers, in-app voice, IVR)
applies_to: [voice-ui, smart-speaker, ivr, voice-assistant]
---

# Voice UI patterns

Voice user interfaces (VUIs) — smart speakers (Echo, Nest, NUGU), phone assistants (Siri, Google Assistant, Bixby, Clova), in-app voice features, IVR (interactive voice response phone systems), in-car voice control.

Read [`conversational-ui-fundamentals.md`](conversational-ui-fundamentals.md) first.

## Voice-only vs voice + visual

| Modality | Constraints |
| --- | --- |
| **Voice-only** (smart speaker, in-car) | No visual; no list of options; rely on memory |
| **Voice + visual** (phone assistant) | Voice input, visual response; richer feedback |
| **Voice + ambient screen** (Echo Show) | Hybrid; visual supports voice |

Pick the lowest common denominator. If your skill must work on Echo (audio only), don't design assuming visual.

## Five voice UI patterns

### 1. Wake word activation

```
User: "Hey Siri, set a timer for 5 minutes."
```

Wake words: "Hey Siri", "OK Google", "Alexa", "Hey Bixby", "Hi Clova", "Hey NUGU".

Design:
- **Auditory feedback** when wake word detected (chime, light pulse).
- **Visual feedback** for visual-capable devices (animation, listening indicator).
- **Timeout** — wake state lasts 6-10s; if no speech, returns to idle.
- **False positive handling** — if wake fires accidentally, user can say "nevermind" or just stay silent.

### 2. Tap-to-talk

```
[User taps mic icon]
[Holds while speaking]
[Releases when done]
```

Or push-and-release (continuous listen until silence).

Design:
- **Visual press feedback** during listening.
- **Visualization** of audio level (waveform or pulse).
- **Cancel** option (slide off button or back press).
- **Auto-end** on silence (1-2 seconds of quiet).

### 3. Conversational follow-up

After response, briefly remain listening for follow-up:

```
User: "What's the weather?"
System: "62°F, sunny."
[brief pause; mic stays open]
User: "What about tomorrow?"
System: "Tomorrow: 58°F, cloudy."
```

Reduces "Hey Siri" repetition. Risk: false-trigger from background noise.

### 4. Multi-turn dialogue

```
User: "Book a flight to Seoul."
System: "Sure. What dates?"
User: "Next Friday, returning Sunday."
System: "Departing from where?"
User: "San Francisco."
System: "Found 12 flights. Cheapest is..."
```

System tracks slot-filling progress; asks only what's missing.

For complex tasks (flight booking, meal planning): multi-turn is necessary. Keep turns short; confirm at end.

### 5. Voice search → visual results

```
User: "Find me Korean restaurants nearby."
[voice → text → search query]
[visual results displayed]
```

Voice as input modality only; results are visual. Common in mobile apps (search by voice, browse results).

## Smart speaker UX (audio-only)

For Echo, Nest, etc.:

### Information density

You can convey ~15-30 words before user attention drifts. Be concise:

✗ "I found 5 Korean restaurants nearby. The first is Han Yang at 123 Main Street, with a 4.5-star rating, $$$ price, open until 10pm. The second is Bibim, located at 456..."

✓ "I found 5 Korean spots. Top result: Han Yang, 4.5 stars, half a mile away. Want details on it?"

### Lists

| Length | Pattern |
| --- | --- |
| 1 result | "I found one: X." |
| 2-3 results | Read all briefly: "I found three. First: X. Second: Y. Third: Z." |
| 4-7 results | Read 2-3, ask: "Want to hear more?" |
| 8+ results | Summarize: "I found 12. Want me to read them?" |

Don't read 12-item lists by default.

### Audio cues

- **Earcon** (short tone) for wake / acknowledgment.
- **Different chime** for error vs success.
- **Voice timbre** consistent across all responses.

### Proactive notifications

Smart speakers can announce:
- Reminders ("Your package arrived").
- Notifications ("Email from John").

Risks:
- Noisy household: announcements during conversation = rude.
- Privacy: "Email from John about your medical results" announced loudly.

Design:
- **Quiet hours** setting.
- **Notification style** option (silent vs chime vs full announcement).
- **Privacy filter** — sensitive content not announced.

## Phone assistant UX (voice + visual)

Siri, Google Assistant, Bixby on phones:

### Visual response anatomy

```
┌─────────────────────────┐
│  [User: "What's the     │
│   weather in Seoul?"]   │   ← transcribed user input
├─────────────────────────┤
│                         │
│  [Sunny icon]           │
│  Seoul: 12°C            │   ← visual response
│  Sunny                  │
│  H: 15°C  L: 5°C        │
│                         │
│  [More details ↓]       │
└─────────────────────────┘
```

Voice spoken simultaneously: "Sunny, 12 degrees in Seoul."

### Action buttons

Voice can suggest actions; visual provides buttons:

```
"I found a cafe nearby. Want directions?"
[Get directions]  [Call]  [Save for later]
```

User can voice-respond ("Yes") or tap.

## In-car voice UX

Voice in cars (Apple CarPlay, Android Auto, native):

### Constraints

- **Eyes on road**: minimal visual demand.
- **Hands on wheel**: voice or steering-wheel button.
- **Noisy environment**: STT robustness + clear TTS.
- **Distraction limits**: regulated in some jurisdictions.

### Patterns

- **Steering wheel button** activation (push-to-talk, no wake word).
- **Audio-only response by default**; visual for confirmation.
- **Single voice command per task**: "Call Mom" not "Open contacts and find Mom".

## IVR (Interactive Voice Response — phone systems)

"For sales, press 1. For support, press 2."

Largely deprecated for chatbots / live agents in 2024+, but still common.

### Best practices

- **Skip option** to a human at any time ("Press 0 for an operator").
- **Avoid deep menus** (max 3-4 levels).
- **Repeat option** at end of menu.
- **Caller ID-based** routing where possible (don't ask for account number you already know).

For Korean banking IVR: typically Korean voice menus, multi-tier, often with separate path for VIP customers.

## Korean voice assistants

| Assistant | By | Notes |
| --- | --- | --- |
| **Bixby** | Samsung | Default on Galaxy phones; Korean strong |
| **Clova / 클로바** | Naver | Smart speakers (Friends, Wave); Korean services |
| **NUGU** | SKT | Smart speakers (NUGU Mini, Candle); SKT services |
| **GiGA Genie / 기가지니** | KT | Smart speaker; KT services |
| **Kakao i** | Kakao | Smart speaker (Kakao Mini); Kakao services |
| **Siri / Google Assistant / Alexa** | International | Korean support of varying quality |

Korean assistants integrate with Korean services (Naver search, Kakao Talk, KT Olleh, SKT services). Western assistants integrate with global services (Apple, Google, Amazon).

For Korean B2C apps: voice features should consider Bixby Capsule integration if Samsung-priority audience.

## Voice + accessibility

Voice UIs help motor / vision accessibility but exclude others:

| Disability | Voice UI helpful? |
| --- | --- |
| Motor (typing hard) | Yes — voice replaces keyboard |
| Vision (can't see screen) | Yes — voice replaces visual |
| Deaf / hard-of-hearing | No — must offer text alt |
| Speech (can't speak) | No — must offer text alt |
| Cognitive (slow processing) | Variable — depends on pacing options |

Always offer text alternative input AND visual output. Voice can be primary but never exclusive.

## TTS voice selection

For your assistant's voice:

| Choice | Use |
| --- | --- |
| **Single voice** | Most consistent; users build relationship |
| **Voice options** (male / female / neutral) | More inclusive; users pick |
| **Voice cloning** (custom brand voice) | Distinctive but expensive + ethics |
| **Multilingual same-voice** | Consistent across locales |

For Korean assistants: typically single-voice default; Korean female warm tone common (Bixby default).

## SSML for prosody control

Speech Synthesis Markup Language adjusts TTS:

```xml
<speak>
  Hello! <break time="500ms"/> Today is
  <emphasis level="strong">Tuesday</emphasis>.
  The temperature is <say-as interpret-as="cardinal">72</say-as> degrees.
</speak>
```

Useful for:
- Pauses / breaks.
- Emphasis on key words.
- Numbers vs digits ("1.0" → "one point zero" vs "one dot zero").
- Dates: "2024-05-08" → "May 8, 2024" or "5월 8일".

Korean SSML same syntax; supports Korean prosody marks.

## Voice UI common mistakes

- **Too verbose responses** — users abandon.
- **Lists too long** — voice can't show 12 results.
- **No fallback** when STT fails repeatedly.
- **Wake word false positives** disrupting other audio.
- **Privacy violations** announcing sensitive content.
- **Inconsistent persona** (one response formal, next casual).
- **Ignoring code-switching** (mixed Korean / English) for Korean users.

## Don't

- Don't make voice the only way to do things. Always offer touch / text alt.
- Don't read 10-item lists by default. Summarize and offer to read.
- Don't ignore false positives — wake words are noisy.
- Don't drone on. Concise wins.
- Don't leak privacy via voice ("Email from doctor about test results").
- Don't break the "Hey Siri" ↔ "follow-up" expectation. Be consistent.
- Don't ship one voice for all locales. Localize per-language.
- Don't use only audio for critical actions (confirm with visual + voice when device permits).

## Cross-reference

- [`knowledge/conversational/conversational-ui-fundamentals.md`](conversational-ui-fundamentals.md) — fundamentals
- [`knowledge/conversational/chatbot-design.md`](chatbot-design.md) — text chat
- [`knowledge/conversational/ai-chat-interfaces.md`](ai-chat-interfaces.md) — LLM chat
- [`knowledge/conversational/korean-voice-conventions.md`](korean-voice-conventions.md) — KR
- [`knowledge/a11y/keyboard-and-focus.md`](../a11y/keyboard-and-focus.md) — alt access
- [`examples/component-voice-input.md`](../../examples/component-voice-input.md) — voice input spec
