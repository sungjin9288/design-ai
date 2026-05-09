<!-- hand-written -->
---
title: Game UI fundamentals (diegetic, non-diegetic, spatial, meta)
applies_to: [game-ui, hud, game-design]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Game UI fundamentals

Game UI follows different rules from product UI. Game UI exists *while* the player is doing something else (playing). It must convey information without breaking immersion, work with controllers / touch / keyboard, and adapt to genre conventions.

This file is the foundation for [`hud-design.md`](hud-design.md), [`menu-systems.md`](menu-systems.md), [`korean-gaming-conventions.md`](korean-gaming-conventions.md), and [`game-accessibility.md`](game-accessibility.md).

## Four UI categories (Mark Russell taxonomy)

A canonical model for game UI. Every game UI element fits one quadrant:

| | **Spatial** (in 3D world) | **Non-spatial** (overlay) |
| --- | --- | --- |
| **Diegetic** (exists in the fiction) | Spatial diegetic — Dead Space's hologram health on character's spine | Non-spatial diegetic — Far Cry 2's GPS held by the character |
| **Non-diegetic** (exists for the player only) | Spatial non-diegetic — XCOM movement grid drawn on the world | Non-spatial non-diegetic — classic HUD (health bar in corner) |

### Why this matters

- **Diegetic UI** keeps players immersed. The character interacts with it; the player doesn't break frame.
- **Non-diegetic UI** is faster + clearer but breaks immersion.
- **Spatial UI** is more natural in 3D worlds; **non-spatial** is more readable.

Most games mix all four. Pick the right tool per element:
- Health: typically non-spatial non-diegetic (bar in corner).
- Quest waypoint: often spatial non-diegetic (arrow in 3D world).
- Inventory: usually non-diegetic menu, but Resident Evil 4's case is a famous diegetic inventory.

## Reading distance — TV vs handheld vs mobile

| Platform | Reading distance | Min text size |
| --- | --- | --- |
| **Mobile (handheld)** | 30-50cm | 14sp |
| **PC monitor** | 50-100cm | 12-14pt |
| **Console (TV, 10-foot UI)** | 2-4m | 28-32pt+ |
| **VR headset** | (visual angle, not distance) | per platform spec |

10-foot UI (TV gaming) requires bigger fonts than designers expect. PS5 / Xbox UI defaults to 28-32pt for body. Test on actual TV at distance.

For Korean PC bang (PC방) culture: monitors at standard PC distance; designs for desktop monitor distance work.

For Korean mobile gaming (huge market): same as global mobile; readable at 30-50cm.

## Genre conventions

Game UI follows genre. Players expect certain UI in certain genres; deviating without reason is friction.

### FPS (first-person shooter)

| Element | Position |
| --- | --- |
| Crosshair | Center |
| Health | Bottom-left or bottom-right corner |
| Ammo | Bottom-right corner |
| Mini-map | Top-left or top-right corner |
| Objective | Top center |
| Score / killfeed | Right side or bottom-left |

Examples: Call of Duty, CS, Valorant.

### RPG / MMO

| Element | Position |
| --- | --- |
| Health / mana / stamina | Bottom-left (player avatar) |
| Quick action bars | Bottom center (1-9 keys) |
| Mini-map | Top-right |
| Quest log | Right side or top-right |
| Chat | Bottom-left |
| Target frame | Top-center or top-left |

Examples: WoW, Lost Ark, Final Fantasy XIV. Korean MMOs (Lineage, MapleStory) inherit this layout heavily.

### Mobile gacha / RPG

| Element | Position |
| --- | --- |
| Currencies | Top of screen (3-5 of them) |
| Energy / stamina | Top |
| Battle controls | Bottom (large, thumb-reachable) |
| Skill buttons | Right side (thumb zone) |
| Auto-battle / 2x speed | Bottom-right (essential for gacha) |
| Quest indicators | Around character or floating |

Examples: 원신 (Genshin), 명일방주 (Arknights), Korean genres like 리니지M, 오딘.

### Casual / puzzle

| Element | Position |
| --- | --- |
| Score / lives | Top |
| Pause | Top-corner |
| Power-ups | Bottom |

Examples: Candy Crush, anipang, 카카오프렌즈게임.

### Strategy (RTS / 4X)

| Element | Position |
| --- | --- |
| Mini-map | Bottom-left or bottom-right |
| Resource counters | Top |
| Selected unit panel | Bottom-center |
| Build menu | Bottom-right |
| Tech tree / overlays | Modal full-screen |

Examples: Starcraft, Civilization. Korean Starcraft heritage means competitive RTS UI culture is strong.

## HUD vs menu vs in-world

| Type | Use |
| --- | --- |
| **HUD (Heads-Up Display)** | Always visible during gameplay; status / context |
| **Menu** | Navigated to; not visible during gameplay |
| **In-world / spatial** | Embedded in 3D world (waypoints, dialogue bubbles) |
| **Modal interrupt** | Pauses gameplay (death screen, inventory full) |

Avoid putting too much in HUD — visual noise during play. Prefer menus for detailed views.

## Information density

| Genre | HUD density |
| --- | --- |
| FPS | Low (focus on aim) |
| Racing | Medium (speed, position, lap) |
| RPG / MMO | High (player chose this complexity) |
| Casual | Low (don't overwhelm) |
| Strategy | Very high (resources + units + tech) |

For Korean MMORPG (Lost Ark, BDO, Lineage M): players accept very dense HUDs. Western audiences sometimes find these "cluttered."

## Visual language

### Color coding

Universal:
- **Red**: damage, danger, enemy, low health.
- **Green**: friendly, healthy, success, nature.
- **Yellow / orange**: warning, neutral, special.
- **Blue**: mana, ally, info.
- **Purple / gold**: rare / legendary item rarity.

Korean inversion alert: in **stock charts**, Korean convention has red=up, blue=down (opposite of Western). But in games, red=damage / blue=mana follows global convention.

### Item rarity color tiers (canonical)

```
Common      → Gray / White
Uncommon    → Green
Rare        → Blue
Epic        → Purple
Legendary   → Orange / Gold
Mythic      → Red / Rainbow
```

Most games use this. Players read rarity instantly via color. Don't invent your own without good reason.

### Iconography

- **Currency icons**: gold coin (yellow), gem (purple/blue), special (varies).
- **Stats icons**: heart (HP), drop (mana / blood / poison), star (XP), shield (defense).
- **Action icons**: standardized across genres (settings = gear, inventory = bag, map = globe).

Icons in games are larger than product UI (24-32px common; 48-64px for action buttons). Mobile especially.

## Animation in game UI

Game UI animates more than product UI:
- **Damage numbers** float up + fade.
- **XP bar** fills smoothly (200-400ms ease-out).
- **Item drops** bounce / glow.
- **Notifications** slide in + auto-dismiss.
- **Skill cooldowns** sweep around an icon.

Style depends on genre:
- **Realistic / cinematic**: subtle, fast.
- **Anime / fantasy**: dramatic, longer durations, particle effects.
- **Casual / cute**: bouncy, playful.

See [`knowledge/motion/principles.md`](../motion/principles.md) for general motion rules; game UI extends with more dramatic motion.

## Audio in game UI

Sound effects are part of UI:
- **Click**: every button press has audio feedback.
- **Hover** (PC / console): subtle hover sound.
- **Confirmation**: positive ding for success, negative buzz for error.
- **Notifications**: distinctive sound per type (level-up vs damage vs achievement).

For VR / immersive games: spatial audio matters even more; sounds should emit from where they appear.

## Input methods

Game UI must work with whatever input the platform supports:

| Input | Constraint |
| --- | --- |
| **Mouse + keyboard (PC)** | Pointing precise; many keys available |
| **Controller (console)** | D-pad / sticks; fewer buttons; needs focus management |
| **Touch (mobile)** | Direct manipulation; thumb zones; no hover |
| **VR controllers** | 6DOF pointing; raycast UI; physical gestures |

### Cross-platform UI

Many modern games ship on PC + console + mobile. UI must adapt:

- **PC**: hover affordances, right-click context menus, keyboard shortcuts.
- **Console**: focus rings, button prompts ("Press X to open"), tab nav.
- **Mobile**: bigger tap targets (44pt+), thumb-zone bottom controls.

Defer to platform conventions. Don't force PC-style mouse-driven UI on console; don't force controller-style on mobile.

### Button prompts

Console UI shows controller button icons:
- Xbox: A, B, X, Y.
- PlayStation: ✕ (X), ◯ (Circle), △ (Triangle), □ (Square).
- Switch: A, B, X, Y (different positions from Xbox).
- Generic: "Confirm", "Cancel", "Back".

For cross-platform: detect controller type and swap icons. Don't assume Xbox.

## State persistence

Game UI persists state across:
- Sessions (settings, progress).
- Death + respawn (HUD state, current target).
- Match transitions (lobby → game → results).

Save state at meaningful checkpoints. Lose-progress-on-crash is the worst game UX.

## Korean game market notes

(Detail in [`korean-gaming-conventions.md`](korean-gaming-conventions.md).)

Quick context:
- **Mobile gacha + MMO** dominate Korean revenue.
- **PC bang (PC방)** culture: PCs at low/free hourly rates; competitive games dominant.
- **Major studios**: NEXON (메이플스토리, FIFA Online), NCSoft (리니지, 길드워), Krafton (배틀그라운드 / PUBG), Smilegate (크로스파이어, 로스트아크), Pearl Abyss (검은사막).
- **Mobile-first audience**: heavy auto-battle, gacha, daily login rewards.

## Accessibility intro

(Detail in [`game-accessibility.md`](game-accessibility.md).)

Game UI accessibility:
- Subtitles + closed captions (always option).
- Color-blind modes (color-coding redundant with shape / pattern).
- Remappable controls.
- Adjustable text size + UI scale.
- High-contrast mode.
- Reduced motion option.

2024+: accessibility is increasingly expected; Last of Us Part II / Forza Horizon raised the bar.

## Don't

- Don't break genre conventions without strong reason. Players expect HP bottom-left in MMOs.
- Don't ignore platform conventions (PC vs console vs mobile have different defaults).
- Don't make HUD so dense it competes with gameplay attention.
- Don't skip button prompts on console.
- Don't use only color to encode meaning (color-blind exclusion).
- Don't auto-advance dialogue. Player controls the pace.
- Don't lock UI to one resolution. Scale for different screens.
- Don't forget audio. Game UI is auditory + visual.

## Cross-reference

- [`knowledge/game-ui/hud-design.md`](hud-design.md) — HUD elements
- [`knowledge/game-ui/menu-systems.md`](menu-systems.md) — main menu, pause, inventory
- [`knowledge/game-ui/korean-gaming-conventions.md`](korean-gaming-conventions.md) — KR market
- [`knowledge/game-ui/game-accessibility.md`](game-accessibility.md) — a11y in games
- [`knowledge/motion/principles.md`](../motion/principles.md) — motion fundamentals
- [`knowledge/a11y/keyboard-and-focus.md`](../a11y/keyboard-and-focus.md) — focus / keyboard
