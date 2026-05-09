<!-- hand-written -->
---
title: HUD design (in-game heads-up display elements)
applies_to: [game-ui, hud, in-game]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# HUD design

The HUD (Heads-Up Display) is the always-visible overlay during gameplay. It tells the player what they need to know without breaking the flow.

Read [`game-ui-fundamentals.md`](game-ui-fundamentals.md) first.

## What goes in HUD vs not

In HUD (always visible during play):
- Health / mana / stamina.
- Crosshair / aim reticle.
- Ammo / current weapon.
- Currency / score.
- Mini-map / radar (genre-dependent).
- Cooldowns of active skills.
- Critical alerts (low health, no ammo).

NOT in HUD (open via menu):
- Full inventory.
- Stats / character sheet.
- Settings.
- Friends list.
- Quest details (summary OK, details menu).

The HUD competes with gameplay for attention. Less is more.

## HUD layout patterns

### FPS HUD

```
                                           [mini-map]
[objective banner ───────────────────────]
                                              [killfeed]
                                              [ ... ]
                                              [ ... ]
                       [crosshair]
                                              [target damage]


[health bar] [armor]                          [ammo] [grenades]
```

Compact. Center stays clear for aim. Information clusters in corners.

### MMO / RPG HUD

```
[player frame: HP / MP / stamina]               [mini-map]
[buffs / debuffs]                               [target frame]
[chat ────]                                     [quest tracker]
                                                [...]
                                                [combat log]
[hotbar 1 (1-9 keys)]                           [hotbar 2 (F1-F9)]
[hotbar 3 (Shift+1-9)]
```

Dense. Player has many concurrent inputs to track. Modular — players reposition / hide elements.

### Mobile gacha HUD

```
[currency 1]  [currency 2]  [currency 3]  [stamina/energy] [profile]

                  [main game area]
                  [character / scene]


[skill 1] [skill 2] [skill 3]   [auto] [2x speed] [pause]
```

Currencies prominent (gacha = always selling). Auto-battle + speed control essential. Skills in thumb zone.

### Mobile casual HUD

```
[score]                         [pause]
[lives ❤❤❤]                     [coins]


            [game board]



[power-ups: 3 buttons]
```

Minimal. Score + lives + power-ups; nothing else.

## Health bars

The single most-iterated UI element in games.

### Bar types

| Type | Use |
| --- | --- |
| **Linear bar** | Default; "X HP / Y HP" or just bar |
| **Segmented bar** | Each segment is a hit (Zelda hearts) |
| **Circular** | Cinematic; matches icon style |
| **Layered** | Shield + health + barrier separately |
| **Radial / context** | Gear of War's blood-vignetting |
| **Diegetic** | Health on character body / vehicle (Far Cry, Forza) |

### Health bar rules

- **Damage delay** — when hit, bar drops to new value over 200-400ms (not instant). Player sees the damage happen.
- **Recent damage indicator** — second bar showing damage taken in last 1-2s (Tekken-style). Helps player track combo damage.
- **Color shift** — green→yellow→red as health drops. Color blind alt: shape / pattern change.
- **Critical state** — visual emphasis when < 25% (pulse, screen edge red).
- **Regen** — animated fill if regenerating.
- **Permanent damage cap** — for games with overheal / shield: separate visual.

### Korean MMO health bar tradition

- Often labeled with exact numbers ("8420 / 12000 HP").
- Multiple buffs / debuffs stacked underneath.
- Frame heavy / decorated (gold leaf borders for high-tier characters).

## Ammo / resource counters

```
[icon] 30 / 120
       ▲    ▲
   current  reserve
```

Counter rules:
- Tabular numerals (digit alignment): `font-feature-settings: "tnum"`.
- Reload state: visible animation / icon swap during reload.
- Out of ammo: emphasis (red, pulse, "RELOAD" prompt).
- Different ammo types: icon + count per type, or active-type only.

## Crosshair / reticle

For shooters:
- **Static dot**: precision shooting (Valorant, CS).
- **Dynamic spread**: expands during recoil (CoD, Apex).
- **Hit marker**: brief X-shape on hit.
- **Damage indicator**: outer ring pulses red when taking damage from a direction.

Customizable:
- Color (bright red, neon yellow, white).
- Shape (dot, plus, T, custom).
- Outline (for visibility on any background).

Required for accessibility.

## Mini-map

| Element | Notes |
| --- | --- |
| Player marker | Center; rotates with view OR fixed-north |
| Allies | Blue dots / icons |
| Enemies | Red (when visible) |
| Objectives | Yellow / gold marker |
| POI / quest | Distinct icons |
| Compass | N / E / S / W; or angle indicator |

Rotation:
- **Rotating mini-map**: easier for new players (always points the way they're facing).
- **Fixed north**: better for spatial memory; competitive players prefer.

Many games offer toggle.

## Damage numbers

Float-up text showing damage dealt:

```
Hit                       150
Critical                 320!
Heal              +84
Miss                    Miss
```

Style:
- White / yellow for damage.
- Red for critical / huge damage.
- Green for heal.
- Float up + fade over 800-1500ms.
- Stack to one side if many.

For "loot games" like Diablo / Path of Exile / Lost Ark: damage numbers are core; players read DPS from these.

For more cinematic games (RDR2, God of War): damage numbers off, hit feedback via animation / sound only.

## Cooldowns

Skill icons on hotbar with cooldown indicator:

```
┌──────┐
│ ⚔    │   ← skill icon
│      │
│  3.2 │   ← seconds remaining
└──────┘
   ▒▒▒▒    ← sweep / fill animation
```

Animation:
- **Radial sweep** (clock-face style): most common, intuitive.
- **Vertical fill**: bar fills bottom-to-top.
- **Desaturate + number**: icon grayed out + countdown number.

Players need to read cooldowns at-a-glance during combat. Don't make sweep too detailed; readability > beauty.

## Buffs / debuffs

Icons showing active effects:

```
[⏳ Speed +20% — 12s] [☠ Poison — 8s] [✨ Shield — 30s]
```

Layout:
- Row of icons; new buffs add to right.
- Timer overlay (number or bar).
- Color: green for buff, red for debuff, blue for neutral.
- Click / hover (PC) for description.
- Stacks: number badge "x3".

For high-density combat: 5-15+ buffs / debuffs simultaneous. Group by type (offensive, defensive, status).

## Floating quest markers

3D world markers:
- **Above NPCs**: ! (new quest), ? (turn-in), ... (in progress).
- **On waypoints**: floating diamond / arrow.
- **Compass markers**: indicator at top of screen for off-screen objectives.
- **World waypoint**: pillar of light reaching skyward.

Don't over-clutter. One active waypoint at a time, unless player explicitly multi-tracks.

## Notifications

Transient messages:

| Type | Style |
| --- | --- |
| Item picked up | "+ 5 gold" / "Got: [Item icon] Sword" |
| Quest update | "New quest: [Name]" with subtle banner |
| Achievement | Larger banner, satisfying sound, often persistent for 3-5s |
| Level up | Big celebration: particles, sound, persistent |
| Death | Modal full-screen interrupt |

Slide-in, hold, fade-out. Total duration:
- Item pickup: 1-2s.
- Quest update: 3-5s.
- Achievement: 4-6s.
- Level up: 5-10s with full effects.

Stack notifications (if many fire fast); newer pushes older down or replaces with summary ("+5 items").

## Subtitles / dialogue

| Style | Use |
| --- | --- |
| Bottom-center overlay | Most action / cinematic |
| Speech bubble (3D world) | Cute / cartoon |
| Side panel | Visual novels |
| Choice list | Branching dialogue |

Subtitle config (always): on/off, size, background opacity, speaker name. WCAG-aligned options.

For Korean: 자막 (subtitle) commonly bottom-center, white text + black outline + semi-opaque dark band, NanumSquare or Pretendard, larger than English equivalent.

## Adapting to widescreen / ultra-wide

Modern games support 16:9 / 21:9 / 32:9 ultra-wide. HUD must adapt:

- **Anchor HUD elements to screen edges** (not center percentages).
- **Stretch background** but anchor UI.
- **Fix FOV** — don't let ultra-wide give competitive advantage in PvP (clip to standard FOV).

For mobile: handle different aspect ratios (16:9 vs 18:9 vs 19.5:9 vs foldable).

## Customization

Modern games offer HUD customization:
- **Move elements** (drag positions).
- **Resize** (scale individual elements).
- **Hide** (toggle elements off — minimalist play).
- **Themes / skins** (purchased or unlocked).
- **Color presets** (color-blind modes, brightness presets).

Save customization per-player profile.

## Performance

HUD renders every frame. Performance matters:
- Use sprite-based rendering (texture atlas) — minimize draw calls.
- Update only when state changes (don't re-layout every frame).
- Animations on GPU when possible.
- Mobile: target 60fps; pre-budget UI overhead.

## Don't

- Don't put critical info in screen edges that get cropped on smaller TVs / mobile screens.
- Don't make health bars subtle — players need fast read.
- Don't auto-hide HUD with no opt-out.
- Don't ignore color-blind alternatives (shape / pattern).
- Don't over-decorate. Function over flourish.
- Don't lock HUD to one resolution. Scale via UI scale option.
- Don't put long text in HUD. Reserve text for menus / dialogue.
- Don't ignore audio. UI sounds matter as much as visual.

## Cross-reference

- [`knowledge/game-ui/game-ui-fundamentals.md`](game-ui-fundamentals.md) — categories, genres
- [`knowledge/game-ui/menu-systems.md`](menu-systems.md) — full menus
- [`knowledge/game-ui/korean-gaming-conventions.md`](korean-gaming-conventions.md) — KR conventions
- [`knowledge/game-ui/game-accessibility.md`](game-accessibility.md) — a11y in games
- [`knowledge/motion/principles.md`](../motion/principles.md) — animation
- [`examples/component-game-hud.md`](../../examples/component-game-hud.md) — HUD spec
