---
description: Spec game UI — HUD, menus, inventory, store, settings — across genres + platforms. Korean conventions (확률 표시, 본인인증, PC bang) and accessibility built in.
---

You will produce a game UI spec for the surface described in `$ARGUMENTS`.

## Input

Parse `$ARGUMENTS`. Expect:
- A surface (e.g., "FPS HUD", "gacha store", "MMO inventory", "pause menu", "main menu").
- Optionally: genre, platform(s), input methods, audience (Korean / international), monetization type.

If ambiguous, ask one clarifying question — but only one. Otherwise apply reasonable defaults and proceed.

## Steps

1. **Classify genre + surface** to pick layout conventions.

2. **Apply the [game-ui-designer playbook](../skills/game-ui-designer/PLAYBOOK.md)**:
   - Pick layout per genre.
   - Spec for each platform (UI scale, reading distance, input).
   - Define interaction states.
   - Plan accessibility (subtitles, color-blind, scale, remap, reduce-motion).
   - Apply Korean compliance if KR market (확률 표시, 본인인증, GRAC, 자막).
   - Spec performance budget + UI audio.

3. **Output** using the structure in PLAYBOOK.md step 10.

## Done when

- Genre + surface + platform(s) + input(s) explicit.
- Layout + element positioning specified.
- Interaction states (default / focus / press / disabled) defined.
- Input handling for each platform with button prompts.
- Accessibility options addressed.
- Korean compliance if applicable.
- Performance budget specified.
- UI audio defined.
- "Don't" catches 2-3 misuses.
- Verification phase from PLAYBOOK.md passes.
