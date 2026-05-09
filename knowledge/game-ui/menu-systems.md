<!-- hand-written -->
---
title: Menu systems (main menu, pause, inventory, settings, store)
applies_to: [game-ui, menus, navigation]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Menu systems

Menus in games are full-screen interfaces players navigate to (not glanced at like HUD). Different rules: density, depth, visual hierarchy.

Read [`game-ui-fundamentals.md`](game-ui-fundamentals.md) first.

## Menu types

| Menu | When |
| --- | --- |
| **Main menu** | Game launch; before play |
| **Pause menu** | During gameplay; suspended state |
| **Inventory** | Open via key; manage items |
| **Character / stats** | Manage character build |
| **Settings** | Audio / video / control / a11y options |
| **Store** | Buy items / unlock content |
| **Social / friends** | Online play |
| **Leaderboards** | Compare with others |
| **Achievements** | Unlocked progress |
| **Tutorial / help** | Learn mechanics |

Each has conventions players expect.

## Main menu

The first thing players see. Sets tone.

### Common items

```
┌──────────────────────────┐
│                          │
│    [GAME LOGO]           │
│                          │
│                          │
│      ▶ Continue          │   ← if save exists
│        New Game          │
│        Load Game         │
│        Multiplayer       │   (if applicable)
│        Store             │   (if applicable)
│        Settings          │
│        Credits           │
│        Quit              │
│                          │
│                          │
│  [news / version info]   │
└──────────────────────────┘
```

### Hierarchy

- **Continue / Play** is the most-used; top.
- **New Game** is rare (most sessions resume); below.
- **Settings** is necessary but not primary.
- **Quit** at bottom (lowest priority on desktop / console; sometimes hidden on mobile).

For mobile / always-online games: "Quit" is rarely shown (just close app); main menu often skipped entirely (auto-progress to lobby / character select).

### Background

- **Cinematic**: animated background, ambient music. Premium feel.
- **Static**: single beautiful frame. Cheaper.
- **Live render**: in-game character on idle animation.
- **Procedural**: shifts each session.

For Korean MMOs: often shows the player's character with all gear visible (motivates investment).

## Pause menu

```
┌──────────────────────────┐
│                          │
│   PAUSED                 │
│                          │
│    Resume                │
│    Restart               │
│    Settings              │
│    Quit to main menu     │
│                          │
└──────────────────────────┘
```

Or modern variant — show pause options + map / progress / inventory tabs:

```
┌──────────────────────────────────────┐
│ [Resume] [Map] [Inventory] [Settings]│
│                                      │
│           [active tab content]       │
│                                      │
└──────────────────────────────────────┘
```

Pause menu rules:
- **Pause is a single key** (Esc / Start / Menu button).
- **Confirmation for destructive actions** (Quit → "Are you sure? Unsaved progress will be lost.")
- **In multiplayer**: doesn't actually pause game; instead opens menu while game continues. Show this clearly.

## Inventory

The most-iterated game menu. Many design patterns:

### Grid

```
┌─────────────────────────────┐
│  [Item slot grid 8×6 ]      │
│  [Tabs: Weapons | Armor | ] │
└─────────────────────────────┘
```

Most common. Drag-and-drop on PC; tap on mobile.

### List

```
┌─────────────────────────────┐
│  ▶ [icon] Iron Sword  +5 ATK│
│    [icon] Wooden Bow  +3 ATK│
│    [icon] Leather Armor +2  │
│  ...                        │
└─────────────────────────────┘
```

For fewer items / mobile / simpler UX.

### Tetris (Resident Evil 4 / Escape from Tarkov)

Items have shapes; rotate / pack into limited grid. Adds gameplay; expensive UI.

### Stacked panel (Korean MMO style)

Multi-tab inventory:
- Main bag (primary stash).
- Crafting materials tab.
- Quest items tab.
- Consumables tab.
- Currency tab.
- Premium / paid items tab.

Each tab is its own grid. Tab switching is fast; common Korean MMO UX.

### Item detail

Hover (PC) or tap (mobile) shows full item info:

```
┌──────────────────────┐
│ [item icon, large]   │
│                      │
│ Iron Sword           │
│ Common Weapon        │
│                      │
│ + 5 Attack           │
│ + 1 Crit Chance      │
│ Durability: 40/40    │
│                      │
│ "A simple iron blade │
│  forged in ..."      │
│                      │
│ [Equip] [Drop] [Sell]│
└──────────────────────┘
```

For comparison (equip new vs current): show side-by-side.

### Inventory rules

- **Sort options**: by type, by rarity, by recently acquired.
- **Search / filter**: as inventory grows.
- **Auto-equip / loadout**: save preset configurations.
- **Stack** identical items (potions × 5).
- **Limit stack size** (gameplay constraint, often 99 or 999).
- **Highlight new items** (unviewed badge).

For Korean MMOs: inventory is large (often 100+ slots). Sorting + filtering critical.

## Settings menu

Sections (common):

| Section | Settings |
| --- | --- |
| **Video / Display** | Resolution, refresh, FOV, V-Sync, fullscreen mode, brightness, gamma |
| **Audio** | Master volume, music, SFX, voice chat, dialogue, subtitle volume |
| **Controls** | Remap keys / buttons, sensitivity, invert axis, deadzone |
| **Gameplay** | Difficulty, HUD options, tutorial toggles, language |
| **Network** | Region, NAT, ping limit |
| **Accessibility** | Subtitles, color-blind, screen reader, motion reduction, contrast |
| **Account** | Username, profile, link to social |
| **Credits / About** | Game info, version, legal |

### Settings UX

- **Apply / Cancel**: changes preview but require confirm.
- **Reset to defaults**: per-section button.
- **Search**: large settings menus benefit from search ("subtitle" → finds it).
- **Tooltips / explanations**: especially for technical settings (anti-aliasing levels).

### Korean MMO settings

Korean MMOs often have hundreds of settings:
- HUD scale per element.
- Combat number visibility.
- Specific notification toggles.
- Performance presets.
- Multiple input mappings (PC + controller + mobile-controller hybrid).

Search becomes essential.

## Store / shop

For games with monetization:

```
┌──────────────────────────────────────────┐
│  [Tabs: Featured | Bundles | Cosmetics ] │
│                                          │
│  [Featured promotion banner]             │
│                                          │
│  [Item card] [Item card] [Item card]     │
│  [Item card] [Item card] [Item card]     │
│                                          │
│  [Currency: 💎 1240]    [Buy gems]       │
└──────────────────────────────────────────┘
```

Store UX:
- **Hero promotion** at top.
- **Currency balance** always visible.
- **Buy currency** path always 1-2 taps from anywhere in store.
- **Item card** shows: image, name, price (in real currency or premium currency).
- **Limited time** banners with countdown.
- **Confirmation** before purchase (especially expensive items).

### Korean gacha store

Korean mobile gacha specifics:
- **확률 표시** (probability disclosure) — REQUIRED by 게임산업진흥에관한법률 (Game Industry Promotion Act).
- **누적 보상** (pity / cumulative rewards) — UI showing how many more pulls until guaranteed item.
- **이벤트 타이머** — limited-time banners with prominent countdown.
- **첫 결제 보상** (first-purchase bonuses).
- **VIP / 출석** — daily login + VIP tier rewards.

See [`korean-gaming-conventions.md`](korean-gaming-conventions.md) for regulatory details.

## Quest / mission menu

```
┌──────────────────────────────────────┐
│ [Tabs: Active | Available | Done ]   │
│                                      │
│ ▶ Defeat the dragon                  │
│   Talk to elder afterward            │
│   ─────────────                       │
│   Reward: 500 gold, Sword            │
│   [Track] [Abandon]                   │
│                                      │
│   Find 5 rare herbs                  │
│   3/5 collected                      │
│ ...                                  │
└──────────────────────────────────────┘
```

Tracking: one quest can be "tracked" — its waypoint and HUD reminder show.

For story-heavy games: chronological / chapter-organized; player can replay completed.

## Character / stats

```
┌──────────────────────────────────────┐
│ [Character render]                   │
│ Level 24                             │
│ ───────────                           │
│ HP    1450    INT  120               │
│ MP    540     WIS  85                │
│ STR   145     LUK  20                │
│                                      │
│ [Equipment slots]                    │
│ Weapon: [Iron Sword]                 │
│ Helmet: [empty]                      │
│ ...                                  │
│                                      │
│ [Skill tree]                         │
└──────────────────────────────────────┘
```

For RPGs / MMOs: very dense. Often multi-tab (Stats / Equipment / Skills / Talents / Loadouts).

## Tutorial / help

Modern games avoid traditional tutorial menus; integrate teaching into gameplay. But some still have:
- **First-run tutorial** — initial sequence.
- **Help / how-to-play** — reference accessed from main menu.
- **Tooltips** — hover-triggered hints.
- **Codex / journal** — lore + game systems explained.

Allow skip.

## Navigation patterns

### PC mouse + keyboard

- Click to navigate.
- Tab / arrows for keyboard.
- Esc to back / close.
- Enter to confirm.

### Console (controller)

- D-pad / left stick to navigate.
- A / X to confirm.
- B / O to back / cancel.
- Y / △ for context action (often).
- Triggers / shoulders for tab switching.
- Back button toggles overlay (map, inventory).

Show button prompts at all times: bottom of screen "[A] Confirm [B] Back".

### Mobile (touch)

- Tap to select / activate.
- Long-press for context menu.
- Swipe between tabs.
- Pinch to zoom (if applicable, like world maps).
- Bottom-bar always thumb-reachable.

## Transitions between menus

Smooth transitions reduce jarring:
- **Cross-fade** (200-300ms).
- **Slide** (left / right for tab nav, up / down for hierarchy).
- **Zoom** (entering submenu = zoom in).
- **Stack** (modals over current screen, dim background).

Don't transition longer than 400ms — feels slow when navigating quickly.

## Modal interrupts

Some events demand attention even outside menus:
- **Achievement popup** — center of screen, dismissable.
- **Reward unlock** — celebratory, dismissable after viewing.
- **Login bonus** — daily, requires acknowledgment.
- **Network disconnection** — full overlay until reconnected or accepted.
- **Update available** — patch notes / download prompt.

Allow dismissing; don't trap player.

## Korean MMO menu density

Korean MMOs tend to have many concurrent sub-windows on screen:

```
[chat]  [main game]  [quest list]
        [inventory]      [skill]
[mini-map]    [party]    [auction]
```

Players reposition / dock / hide. Customization is heavy. Western players can find this overwhelming; Korean players accept.

## Don't

- Don't make settings menus 200 items deep without search.
- Don't put "Quit" before "Continue" in main menu.
- Don't skip confirmation on destructive actions.
- Don't disable "skip cinematic" — let players skip after first watch.
- Don't make inventories that take 30 seconds to navigate.
- Don't hide critical settings (subtitle toggle, color-blind) deep in menus.
- Don't break the back button (Esc, B button) — should always work.
- Don't auto-pop store on every launch.

## Cross-reference

- [`knowledge/game-ui/game-ui-fundamentals.md`](game-ui-fundamentals.md) — categories
- [`knowledge/game-ui/hud-design.md`](hud-design.md) — HUD vs menu
- [`knowledge/game-ui/korean-gaming-conventions.md`](korean-gaming-conventions.md) — KR market
- [`knowledge/game-ui/game-accessibility.md`](game-accessibility.md) — settings / a11y
- [`examples/component-game-menu.md`](../../examples/component-game-menu.md) — menu spec
