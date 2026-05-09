<!-- hand-written -->
---
title: Korean voice and conversational conventions
applies_to: [korean, voice, chatbot, conversational, kr-market]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Korean voice and conversational conventions

Korean voice and chat UIs have specific market patterns, regulatory requirements, and language conventions that differ from Western defaults.

Read [`conversational-ui-fundamentals.md`](conversational-ui-fundamentals.md) first.

## Korean voice assistant landscape

| Product | By | Strength |
| --- | --- | --- |
| **Bixby** | Samsung | Default on Galaxy phones; deep Korean language support; Bixby Capsules for 3rd-party integration |
| **Clova / 클로바** | Naver | Smart speakers (Friends, Wave, Slate); HyperCLOVA-powered |
| **NUGU** | SK Telecom | Smart speakers (NUGU Mini, Candle); SKT services integration |
| **GiGA Genie / 기가지니** | KT | Smart speakers; KT services |
| **Kakao i** | Kakao | Smart speaker (Kakao Mini); Kakao services (Talk, Map, T) |
| **HyperCLOVA X** | Naver | Korean-first LLM; conversational AI |
| **Apple Siri** | Apple | iOS; Korean support adequate |
| **Google Assistant** | Google | Android; Korean strong |
| **Amazon Alexa** | Amazon | Limited Korean market |

For B2C apps targeting Korean users: prioritize **Bixby** (Samsung's market share in KR is large), **Clova** (Naver ecosystem reach), and **Google Assistant** (Android global).

## Honorific level (존댓말)

The most important Korean conversational design choice:

| Level | Suffix | Use |
| --- | --- | --- |
| **합쇼체** | ~ㅂ니다 / ~습니다 | Formal; banking, government, premium B2B |
| **해요체** | ~해요 / ~예요 | Friendly polite; consumer apps, KakaoTalk channel bots |
| **해체** | ~해 / ~야 | Casual; rare in commercial UI; kid / friend characters |

### Default for product type

| Product | Default |
| --- | --- |
| Banking app voice | 합쇼체 |
| Fintech consumer (Toss, KakaoBank) | 해요체 |
| E-commerce chatbot | 해요체 |
| Customer support (formal company) | 합쇼체 |
| Customer support (casual brand) | 해요체 |
| Kids' content | 해요체 (slightly softer) |
| Government / civic | 합쇼체 |
| Smart speaker (Bixby, NUGU) | 해요체 |
| Voice navigation (T-map, Naver Map) | 해요체 |

### Don't mix levels

Switching between 해요체 and 합쇼체 in one bot's responses sounds inconsistent / sloppy. Pick one and apply throughout.

Exception: agent-handoff transitions where company voice (합쇼체) replaces bot voice (해요체) is acceptable as a deliberate handoff signal.

### Mixed in long-form content

For longer responses (FAQ answers, terms), 합쇼체 sometimes fits even when surrounding chat is 해요체:

```
User: 환불은 어떻게 받나요?

Bot: (해요체 conversational layer)
환불 절차를 안내해 드릴게요!

(합쇼체 formal section, often quoted/styled differently)
"주문일로부터 7일 이내에 반품 신청을 하셔야 합니다.
반품 신청 후 7일 이내에 배송이 회수되며..."

(다시 해요체)
더 궁금한 점이 있으면 알려주세요!
```

## Greeting patterns

| Time of day | Greeting |
| --- | --- |
| Anytime | 안녕하세요! |
| Morning | 좋은 아침이에요! |
| Late evening | 늦은 시간 죄송해요 (acknowledge after-hours) |

For chatbot greeting:
- "안녕하세요! [브랜드] 챗봇이에요. 무엇을 도와드릴까요?"
- "어떤 도움이 필요하세요?"
- "[브랜드]에 오신 것을 환영해요!"

For voice assistant: short, no preamble — "네, 듣고 있어요" or just chime.

## Confirmation phrases

| Action | Korean |
| --- | --- |
| Affirmation | "네", "확인했어요", "알겠어요" |
| Confirmation request | "...하시겠어요?" / "...할까요?" |
| Reassurance | "잠시만 기다려 주세요" / "확인 중이에요" |
| Apology | "죄송해요" / "죄송합니다" / "다시 말씀해 주시겠어요?" |
| Thanks | "감사해요" / "감사합니다" |

### Apology when bot doesn't understand

```
"죄송해요, 잘 못 알아들었어요. 다시 말씀해 주시겠어요?"
"제가 잘 이해하지 못했어요. 다른 방식으로 말씀해 주시겠어요?"
"음, 잘 모르겠어요. 도움이 필요하시면 [메뉴/연락처] 확인해 주세요."
```

## Code-switching (mixed Korean + English)

Korean speakers often code-switch:

```
"맥북 프로 16인치 가격 알려줘"        ← English brand + Korean
"Schedule a meeting with 김철수"      ← Korean name in English request
"오늘 저녁에 LA에 도착해"             ← English city in Korean
```

Bot must:
- Handle mixed-language input.
- Preserve proper nouns in source language.
- Choose response language (default: match user's primary).

LLM-based bots (HyperCLOVA, GPT-4, Claude) handle this natively. Older intent-based bots struggle.

## Korean-specific speech patterns

### 반말 (informal) detection

If user uses 반말 ("말해줘"), the bot must NOT respond in matching 반말 — looks rude. Stay in 해요체 / 합쇼체 always.

If brand voice is intentionally casual (Toss-style "money character" voice), 해요체 is the friendly endpoint.

### Honorifics for the user

Bot should use 님 to address the user:
- "고객님 안녕하세요"
- "[Username]님, 주문이 도착했어요!"
- 회원님 / 사용자님 / 고객님 (varies by brand)

### Not addressing the user
- "주문이 도착했어요" (good — passive)
- "당신의 주문이 도착했어요" (bad — 당신 is impersonal / formal-distant)

당신 is rarely used in Korean commercial UI. Avoid.

## Voice and TTS in Korean

### Voice characteristics

Most Korean assistants default to:
- **Female**, gentle.
- 20s-30s perceived age.
- Clear enunciation.
- 해요체 register.

Reasons:
- Cultural expectation (legacy from Japanese / Korean GPS / station announcements).
- Perceived warmth / approachability.
- Test results (most users prefer female voice for assistants in studies).

Modern apps offer choice: male voices, neutral voices, celebrity voices (premium).

### TTS quality

| Service | Korean TTS quality |
| --- | --- |
| **Naver Clova Voice** | Strong; many voice options |
| **Samsung Bixby TTS** | Strong; Galaxy default |
| **Google Cloud TTS** | Good; multiple Korean voices |
| **ElevenLabs** | Improving; voice cloning for Korean |
| **Apple Siri TTS** | Adequate; iOS only |
| **AWS Polly** | Adequate |
| **Typecast** | Korean-native; AI voice for content creation |

For brand voice: use Clova or Bixby for Korean-first; ElevenLabs for cloning.

### Pronunciation challenges

Hangul → speech challenges:
- **Number reading**: 1,000 = "천" or "1천" — context-dependent.
- **Date format**: "5월 8일" not "5/8".
- **Time**: "3시" not "3:00".
- **Currency**: "5,000원" → "오천 원" (read), not "5,000 won".
- **English brand names**: "Coca-Cola" → "코카콜라" or "코카-콜라" depending.
- **Acronyms**: read letter-by-letter or as Korean (e.g., NASA → "나사").

Modern Korean TTS handles most of this; test edge cases.

## STT (speech-to-text) Korean

Quality:
- **Naver Clova Speech** — strong for Korean.
- **Bixby STT** — strong; Galaxy ecosystem.
- **Google Cloud Speech** — strong; supports code-switching.
- **OpenAI Whisper** — open-source; excellent Korean.
- **Apple speech recognition** — adequate.

Issues:
- **Dialect** (Busan, Jeju) — quality varies; Whisper handles best.
- **Noise** — Korean characters are dense; mishears more common in noisy environments.
- **Code-switching** — depends on STT model.
- **Numbers in speech** — context-dependent ("이천이십사 년" = 2024).

## Korean regulatory

### Personal Information Protection Act (개인정보보호법)

For voice / chat that collects personal data:
- **Consent required** for collection.
- **Disclosure** of what's collected, why, how long stored, with whom shared.
- **Right to delete** voice recordings + chat history.
- **Encrypted storage** for sensitive data.

Voice assistants must disclose recording in privacy policy. Some require explicit "always listening" opt-in.

### Information network Act (정보통신망법)

For chatbot interactions:
- **Same rules as email marketing** if chatbot proactively pushes offers.
- **광고 disclosure** if chatbot promotes paid content.

### Financial product chatbot (자본시장법 / 금융소비자보호법)

If bot discusses investments / financial products:
- **Risk disclosure** required.
- **Advice qualifications** — bot can't give personalized investment advice without licensing.
- **Consumer protection** disclosures.

Korean fintech bots typically include extensive disclaimer text.

## KakaoTalk channel chatbot specifics

KakaoTalk is dominant in Korea; many businesses run chatbots there:

- Use Kakao i Open Builder OR Kakao Channel admin tools.
- 답변 시간 (response time hours) displayed.
- Persistent menu (always-visible bottom bar) with categories.
- Auto-greeting on first message.
- Can hand off to human within KakaoTalk.

Design:
- Stick to KakaoTalk message types (text, image, card, list).
- Don't replicate native UI in card format — looks broken.
- Test on KakaoTalk mobile app primarily (most users there).

## Common Korean chatbot / voice mistakes

- **Mixed honorific levels** — 해요 + 합쇼 in same conversation.
- **Wrong register for brand** — bank using 해체 / casual register.
- **Direct translation from English** — sounds unnatural.
- **당신 used as "you"** — too formal-distant.
- **No 님 attached to user** — feels rude.
- **English brand names not localized** — "Apple Pay" vs "애플 페이" inconsistency.
- **TTS mispronouncing user names** — verify common names.
- **Long preamble** — Korean voice users want directness.

## Don't

- Don't mix 해요체 and 합쇼체 within one bot's voice. Pick one.
- Don't translate Western chatbot scripts word-for-word. Adapt to Korean phrasing.
- Don't use 당신 as default "you". Use 고객님 / 회원님 / username + 님.
- Don't ignore code-switching. Korean users mix English freely.
- Don't ship voice in Korean without testing TTS pronunciation on brand / product names.
- Don't omit 개인정보보호법 disclosures for data-collecting voice / chat.
- Don't use 반말 in commercial UI even if user uses it. Stay polite.
- Don't make Bixby Capsule integration an afterthought for Samsung-priority audience.

## Cross-reference

- [`knowledge/conversational/conversational-ui-fundamentals.md`](conversational-ui-fundamentals.md) — fundamentals
- [`knowledge/conversational/voice-ui-patterns.md`](voice-ui-patterns.md) — voice
- [`knowledge/conversational/chatbot-design.md`](chatbot-design.md) — chatbot
- [`knowledge/conversational/ai-chat-interfaces.md`](ai-chat-interfaces.md) — AI chat
- [`knowledge/i18n/korean-document-style.md`](../i18n/korean-document-style.md) — honorific level
- [`knowledge/i18n/korean-typography.md`](../i18n/korean-typography.md) — Hangul typography
- [`knowledge/patterns/email-design.md`](../patterns/email-design.md) — KR ad disclosure
