# game-ui-designer — playbook

Design and spec game UI — HUD, menus, inventory, store, settings, in-world UI. Output is a UI spec a game designer / engineer can implement against, accounting for genre conventions, target platform(s), input methods, and accessibility.

## When to use

- "Design the HUD for our top-down RPG."
- "Spec the inventory system for our gacha mobile game."
- "What menu structure should our FPS use?"
- "Design the Korean gacha store with 확률 표시."
- "Plan accessibility for our action game."

## Inputs (ask if missing)

1. **Genre** — FPS / RPG / MMO / gacha / casual / strategy / racing / fighting.
2. **Platform(s)** — PC / console / mobile / VR; combinations.
3. **Input method(s)** — keyboard+mouse / controller / touch / mixed.
4. **Audience** — Korean / international / mixed; casual / hardcore.
5. **Surface** — HUD / main menu / pause / inventory / settings / store / character screen.
6. **Monetization** — F2P + gacha / premium / battle pass / ads.
7. **Brand voice** — cinematic realistic / anime / cartoon / pixel.
8. **Accessibility scope** — full WCAG / minimum / target features.

## Steps

### 1. Classify genre + surface

| Genre | Read |
| --- | --- |
| FPS / TPS / Action | [`hud-design.md`](../../knowledge/game-ui/hud-design.md) §FPS HUD |
| RPG / MMO | [`hud-design.md`](../../knowledge/game-ui/hud-design.md) §MMO HUD + [`menu-systems.md`](../../knowledge/game-ui/menu-systems.md) |
| Mobile gacha | [`hud-design.md`](../../knowledge/game-ui/hud-design.md) §Mobile gacha + [`korean-gaming-conventions.md`](../../knowledge/game-ui/korean-gaming-conventions.md) |
| Casual / puzzle | [`hud-design.md`](../../knowledge/game-ui/hud-design.md) §Casual |
| Strategy | [`hud-design.md`](../../knowledge/game-ui/hud-design.md) §Strategy |

Always read [`game-ui-fundamentals.md`](../../knowledge/game-ui/game-ui-fundamentals.md). If Korean: [`korean-gaming-conventions.md`](../../knowledge/game-ui/korean-gaming-conventions.md). Always plan accessibility per [`game-accessibility.md`](../../knowledge/game-ui/game-accessibility.md).

### 2. Spec platform(s)

For each platform:

| Platform | UI scale | Reading distance | Input |
| --- | --- | --- | --- |
| PC monitor | 1× | 50-100cm | Mouse + keyboard |
| Console (TV) | 1.3-1.5× | 2-4m | Controller |
| Mobile portrait | 1× | 30cm | Touch (thumb zones) |
| Mobile landscape | 1× | 30-50cm | Touch (both thumbs) |
| VR | per platform | (visual angle) | Motion controllers |

For cross-platform: design UI that scales without retooling.

### 3. Pick layout per genre

Use canonical layouts from `hud-design.md`. Don't reinvent unless specific game design requires.

For HUD, anchor major elements:
- **Bottom-left**: typically player status (HP/MP).
- **Bottom-right**: ammo / resources.
- **Bottom-center**: hotbar (RPG/MMO).
- **Top-left** OR **top-right**: mini-map.
- **Top-center**: objective.
- **Center**: crosshair (FPS) or empty.

For menus, pick standard structure. Settings menu has near-universal section breakdown.

### 4. Spec input handling

Per platform:

- **Keyboard**: define hotkeys; consistent with genre conventions.
- **Controller**: button-prompt mappings (Xbox / PS variants); focus management.
- **Touch**: thumb zones; tap targets ≥ 44pt; gesture support.

Show button prompts for the active input. Detect at runtime.

### 5. Spec interaction states

For every interactive element:
- **Default** — resting.
- **Hovered / focused** — visible cue.
- **Pressed** — feedback.
- **Disabled** — grayed.
- **Selected** — current.

Plus genre-specific:
- **Cooldown** — sweep / fade for skills.
- **Locked** — for unowned items / unranked features.
- **New** — badge for unviewed.

### 6. Plan accessibility

Per [`game-accessibility.md`](../../knowledge/game-ui/game-accessibility.md):

- [ ] Subtitles + closed captions toggle + size + background options
- [ ] Color-blind mode (protanopia / deuteranopia / tritanopia)
- [ ] High contrast mode
- [ ] UI scale (50-200%)
- [ ] Remappable controls
- [ ] Toggle vs hold for sustained actions
- [ ] Reduced motion option
- [ ] Audio sliders per channel (master, music, dialogue, SFX)
- [ ] Visual sound indicators (for hearing-impaired in critical genres)
- [ ] Difficulty options (story mode for cognitive accessibility)

### 7. Korean compliance (if KR market)

- [ ] **확률 표시** — gacha probability disclosure (REQUIRED).
- [ ] **본인인증** — real-name verification flow.
- [ ] **GRAC rating** — game rating shown.
- [ ] 자막 default ON.
- [ ] **PC bang** detection + bonuses (PC games).
- [ ] **누적 보상 / 천장** — pity counter visible.
- [ ] **출석 / VIP** — daily login + tier system.

### 8. Spec performance

Game UI renders every frame. Performance matters:

- [ ] Sprite-based rendering (texture atlas)
- [ ] Update only on state change
- [ ] GPU animations
- [ ] Mobile: target 60fps with HUD overhead < 5ms / frame
- [ ] Console: scale tested at 4K
- [ ] Ultra-wide / multi-aspect-ratio tested

### 9. Spec audio

- [ ] Click / hover sounds defined
- [ ] Confirmation / error tones
- [ ] Notification sounds per type (level up, item drop, achievement)
- [ ] Spatial audio for VR

### 10. Output

```markdown
# Game UI spec: <surface>

> Genre: <FPS / RPG / MMO / gacha / casual / etc>
> Platform(s): <PC / console / mobile / VR>
> Input(s): <keyboard / controller / touch>
> Audience: <KR / international>

## Layout
<anchored regions, element positioning>

## Elements
<HUD elements OR menu sections, each with size, color, behavior>

## Interaction states
<default / hover / focused / pressed / disabled / etc>

## Input handling
<keyboard / controller / touch mappings>

## Accessibility
<subtitles, color-blind, contrast, scale, reduce-motion, remap>

## Korean compliance (if applicable)
<확률 표시, 본인인증, GRAC, 자막, PC bang>

## Performance budget
<frame ms, draw calls, mobile target>

## Audio
<UI sounds defined>

## Don't
<2-3 specific misuses>
```

## Source files this skill reads

- [`knowledge/game-ui/game-ui-fundamentals.md`](../../knowledge/game-ui/game-ui-fundamentals.md)
- [`knowledge/game-ui/hud-design.md`](../../knowledge/game-ui/hud-design.md)
- [`knowledge/game-ui/menu-systems.md`](../../knowledge/game-ui/menu-systems.md)
- [`knowledge/game-ui/korean-gaming-conventions.md`](../../knowledge/game-ui/korean-gaming-conventions.md)
- [`knowledge/game-ui/game-accessibility.md`](../../knowledge/game-ui/game-accessibility.md)
- [`knowledge/a11y/contrast.md`](../../knowledge/a11y/contrast.md)
- [`knowledge/a11y/keyboard-and-focus.md`](../../knowledge/a11y/keyboard-and-focus.md)
- [`knowledge/motion/principles.md`](../../knowledge/motion/principles.md)
- [`knowledge/i18n/korean-payments.md`](../../knowledge/i18n/korean-payments.md) — for 본인인증
- [`examples/component-game-hud.md`](../../examples/component-game-hud.md)
- [`examples/component-game-menu.md`](../../examples/component-game-menu.md)

## Verification phase (run before declaring done)

- [ ] Is the genre + surface explicit?
- [ ] Is the platform list explicit + UI scaling addressed?
- [ ] Does layout follow genre convention OR justify deviation?
- [ ] Are all input methods (keyboard / controller / touch) supported with prompts?
- [ ] Are interaction states (default / focus / press / disabled) defined?
- [ ] Are accessibility options addressed (subtitles, color-blind, scale, remap, reduce-motion)?
- [ ] If Korean: is 확률 표시 / 본인인증 / GRAC / 자막 covered?
- [ ] Is performance budget specified?
- [ ] Are UI audio sounds defined?
- [ ] Does "Don't" section catch 2-3 specific misuses?

## Done when

- One markdown spec, < 500 lines.
- Genre, platform(s), input(s), audience explicit.
- Layout (anchored regions / sections) defined.
- Interaction states specified.
- Input handling per platform.
- Accessibility plan.
- Korean compliance if applicable.
- Performance budget.
- "Don't" section.
- Verification passes.
