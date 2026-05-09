<!-- hand-written -->
---
title: Game accessibility (subtitles, color-blind, remap, motor, cognitive)
applies_to: [game-ui, accessibility, a11y]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Game accessibility

Games are entertainment for everyone. ~15% of the global population has some disability; for games specifically, the impact areas are vision, hearing, motor, and cognitive.

Modern AAA games (The Last of Us Part II, Forza Horizon, God of War Ragnarök) have raised the bar dramatically. Korean games are catching up, but still trail Western.

## The four axes

### 1. Vision

- **Low vision**: small text, low contrast.
- **Color blindness**: red-green most common.
- **Total blindness**: rare in games; some screen-reader-supported games exist.

### 2. Hearing

- **Deaf / hard-of-hearing**: missing audio cues, missing dialogue.
- **Sound sensitivity**: loud, sudden sounds.

### 3. Motor / physical

- **Limited dexterity**: rapid button presses, complex combos.
- **Single-hand**: many games assume two hands on controller.
- **Cognitive impact on motor**: tremor, RSI.

### 4. Cognitive

- **Reading speed**: subtitle pace.
- **Attention / focus**: complex HUDs.
- **Memory**: long sequences without notes.
- **Reaction time**: time-pressured mechanics.

## Universal options menu (the new standard)

Modern games surface accessibility options prominently. Often a separate top-level menu (not buried under "Options").

```
┌──────────────────────────────────┐
│ Accessibility                    │
│ ───────────                       │
│                                  │
│ Display                          │
│   • Subtitles            [On]   │
│   • Subtitle size        [Med]  │
│   • Subtitle background  [On]   │
│   • Color-blind mode     [Off]  │
│   • High contrast        [Off]  │
│   • Brightness           [50%]  │
│   • Reduce motion        [Off]  │
│                                  │
│ Audio                            │
│   • Visual sound indicators [Off]│
│   • Music volume         [80%]  │
│   • Voice volume         [100%] │
│                                  │
│ Controls                         │
│   • Remap buttons          ▶    │
│   • Toggle hold-to-press   [On] │
│   • Auto-aim             [Off]  │
│                                  │
│ Difficulty                       │
│   • Combat difficulty   [Normal]│
│   • Puzzle hints           [On] │
│   • Story mode             [Off]│
└──────────────────────────────────┘
```

## Subtitles + closed captions

Subtitles: dialogue. Closed captions: dialogue + audio cues ("[footsteps approaching]").

| Setting | Default | Options |
| --- | --- | --- |
| **On / off** | On | binary |
| **Size** | Medium | Small / Med / Large / X-Large |
| **Background** | Semi-transparent | None / Light / Dark / Black |
| **Color** | White | White / Yellow / Custom |
| **Speaker name** | On | binary |
| **Sound effect cues** | Off | binary |

For Korean games:
- 자막 default ON (high default expectation).
- Pretendard / NanumSquare; readable at distance.
- Color contrast WCAG AA minimum.

### Speaker labels

```
[Character name]: 안녕하세요!
```

Or color-coded per speaker:
```
[Hero — blue]: ...
[Villain — red]: ...
```

## Color-blind modes

Three main types:
- **Protanopia / Protanomaly**: red-blind / weak.
- **Deuteranopia / Deuteranomaly**: green-blind / weak.
- **Tritanopia / Tritanomaly**: blue-yellow blind.

Most common: red-green (deuteranopia ~6% of men).

### Approaches

| Approach | Pros | Cons |
| --- | --- | --- |
| **Color-blind preset filters** | Easy toggle | Affects whole game appearance |
| **Color-blind-aware design from start** | No filter needed | More design work upfront |
| **Custom color picker** | Player tunes individually | More complex UX |

Best practice: **don't rely on color alone**. Reinforce with shape, pattern, position, or text:

```
Red enemy:    [shape: skull icon] + red color
Green ally:   [shape: shield icon] + green color
```

Then color-blind filter is a backup, not the only way.

For Korean MMO context:
- Many enemies / allies use color exclusively. Modernize with shape redundancy.
- Damage type icons (fire / ice / lightning) help.

## Motor accessibility

### Remappable controls

EVERY button must be remappable. No exceptions.

### Toggle vs hold

For sustained actions (sprint, aim down sights):
- **Hold** is default (intuitive).
- **Toggle** option (less finger strain).

```
Sprint:  [Hold to sprint] / [Toggle sprint]
```

### Auto-aim / aim assist

- **Off / Low / Medium / High** levels.
- Helps reduced-dexterity players.
- Competitive games may disable in PvP for fairness.

### Reduce QTE (quick-time events)

For QTEs (rapid button presses):
- **Hold instead of press repeatedly** option.
- **Auto-complete** option.
- **Disable** option (may skip cinematic).

### Difficulty options

Common tiers:
- **Story mode** — minimal challenge; focus on narrative.
- **Easy** — forgiving.
- **Normal** — default.
- **Hard** — challenging.
- **Expert / Nightmare** — punishing.

Difficulty should be changeable mid-game. Don't lock players into a choice from main menu.

## Cognitive accessibility

### HUD options

- **HUD on / off** toggle.
- **Element-level toggles** (hide compass but show health).
- **HUD scale** (50%-200%).
- **Damage number visibility**.

### Hint systems

For puzzles:
- **Auto-hint after N seconds**.
- **Manual hint button**.
- **Walkthrough mode** (full solve).

Don't lock progression behind cognitively-difficult puzzle.

### Tutorial

- **Skip tutorial** (after first time).
- **Replay tutorial** (open via menu).
- **Tooltips toggle**.

### Save anywhere / save often

Don't require players to play 30+ minutes between saves. Allow:
- **Manual save anywhere**.
- **Auto-save frequently**.
- **Cloud save** for cross-device.

## Hearing accessibility

### Visual sound indicators

Show direction-of-sound for important audio cues:

```
[player center]
              ↗ footsteps (faint)
   ←  gunshot (loud)
```

Direction + intensity visualization. Critical for FPS deaf players.

### Subtitled SFX

Closed captions extend to:

```
[door creaking]
[distant explosion]
[heart beating fast]
```

Less common; Last of Us Part II does this well.

### Audio sliders

Per-channel:
- Master.
- Music.
- Dialogue.
- SFX.
- Ambient.
- Voice chat (multiplayer).

Player can mute music, keep dialogue audible.

## Motion sickness / reduced motion

- **Camera shake** off / reduced.
- **Field of view** adjustable (wider FOV = less nausea for some).
- **Motion blur** off.
- **Chromatic aberration** off.
- **Head bob** off.
- **Vignette** off.

For VR specifically: comfort options critical (teleport vs smooth locomotion, reduced peripheral vision).

## Color contrast in game UI

WCAG-aligned guidelines:
- **Body text**: 4.5:1 contrast against background.
- **Large text** (18pt+): 3:1.
- **HUD numbers**: 4.5:1 minimum.
- **Subtitles**: 7:1 (higher because over moving backgrounds).

Use a contrast checker. Don't ship with low-contrast UI.

## Korean game accessibility

Korean games have historically had less accessibility focus. Catching up:
- 자막 toggles standard.
- Color-blind options increasingly common.
- Auto-battle helps motor-impaired (functional accessibility).
- Localized subtitles (Korean / Japanese / Chinese / English).

Areas where Korean games often lag:
- Screen reader support (rare).
- Visual sound indicators (rare).
- Comprehensive remap (some games).

Korean players with disabilities increasingly demand parity. Catching up to Western standards is a 2024+ trend.

## Testing for accessibility

Recommended:
- **Test with players with disabilities**. AbleGamers, Special Effect provide consulting.
- **Color-blind simulation tools** (Sim Daltonism, Color Oracle).
- **Play with mute** (subtitle test).
- **Play with one hand** (motor test).
- **Play at low resolution / blurred** (vision test).

## Resources

- **AbleGamers** — accessibility consulting + community.
- **Special Effect** — UK-based gaming accessibility.
- **Game Accessibility Guidelines** (gameaccessibilityguidelines.com) — comprehensive checklist.
- **CVAA** — US Communications and Video Accessibility Act; affects some online gaming.
- **EU EAA** — EU Accessibility Act; mobile games included from 2025.

## Don't

- Don't bury accessibility in submenus. Top-level menu.
- Don't lock difficulty.
- Don't make accessibility opt-in for everything. Some defaults should be on (subtitles).
- Don't rely only on color for crucial info.
- Don't make remapping require an external tool.
- Don't skip QTE accessibility.
- Don't make tutorials non-skippable.
- Don't ignore Korean players with disabilities. Same demands, same standards.

## Cross-reference

- [`knowledge/game-ui/game-ui-fundamentals.md`](game-ui-fundamentals.md) — fundamentals
- [`knowledge/game-ui/hud-design.md`](hud-design.md) — HUD a11y
- [`knowledge/game-ui/menu-systems.md`](menu-systems.md) — settings menu
- [`knowledge/game-ui/korean-gaming-conventions.md`](korean-gaming-conventions.md) — KR market
- [`knowledge/a11y/contrast.md`](../a11y/contrast.md) — color contrast standards
- [`knowledge/a11y/keyboard-and-focus.md`](../a11y/keyboard-and-focus.md) — keyboard / focus
