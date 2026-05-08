---
description: Spec a conversational UI — voice assistant, chatbot, AI chat (LLM), or live-agent chat. Modality, persona, intents, flows, error recovery, accessibility; Korean conventions (Bixby / Clova / KakaoTalk channel) included.
---

You will produce a conversational UI spec for the surface described in `$ARGUMENTS`.

## Input

Parse `$ARGUMENTS`. Expect:
- Surface (e.g., "customer support chatbot", "voice search feature", "AI onboarding chat", "Bixby Capsule for ride hailing", "KakaoTalk channel bot").
- Optionally: type, modality, audience, brand voice, backend.

If ambiguous, ask one clarifying question — but only one. Otherwise apply reasonable defaults and proceed.

## Steps

1. **Pick the type** (voice / chatbot / AI / live agent / hybrid) and modality (voice-only / voice+visual / text-only / multimodal).

2. **Apply the [conversational-ui-designer playbook](../skills/conversational-ui-designer/PLAYBOOK.md)**:
   - Define persona (honorific level for Korean, formality, warmth).
   - Spec turn-taking model.
   - Document top intents OR LLM system prompt summary.
   - Map key conversation flows.
   - Plan error recovery.
   - Plan human handoff.
   - Apply Korean compliance if applicable (개인정보보호법, 정보통신망법, 자본시장법).
   - Plan accessibility.

3. **Output** using the structure in PLAYBOOK.md step 11.

## Done when

- Type + modality + use case + audience explicit.
- Persona (honorific level, formality, warmth, user addressing).
- Turn-taking model.
- Top intents / system prompt summary.
- Conversation flows mapped.
- Error recovery for each failure type.
- Human handoff path.
- Korean compliance addressed if applicable.
- Accessibility addressed.
- Required UI components listed.
- "Don't" catches 2-3 misuses.
- Verification phase from PLAYBOOK.md passes.
