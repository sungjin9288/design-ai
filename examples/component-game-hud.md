<!-- hand-written -->
# `GameHUD` (custom — composable in-game heads-up display) — spec

> Composable HUD shell with slots for health / resources / mini-map / cooldowns / notifications. Genre-agnostic; configure via slot composition. Pairs with [`knowledge/game-ui/hud-design.md`](../knowledge/game-ui/hud-design.md).

## Purpose

Game HUDs are typically hand-coded per game; cross-genre reuse rare. But within a single game's surfaces (story mode + multiplayer + practice), HUD elements should share a primitive layer.

`GameHUD` provides:
1. **Slot-based composition** — drop elements into anchored regions.
2. **Customization layer** — players reposition / hide.
3. **Reduced-motion respect**.
4. **Color-blind / contrast modes**.
5. **UI scale** option.
6. **Cross-platform input awareness** (PC keys / controller buttons).

## Anatomy

```
┌──────────────────────────────────────────┐
│ [top-left]                  [top-right]  │   ← anchored slots
│                                          │
│                                          │
│                                          │
│                [center-overlay]          │   ← e.g., crosshair, prompts
│                                          │
│                                          │
│                                          │
│ [bottom-left]            [bottom-right]  │
│ [bottom-center]                          │
└──────────────────────────────────────────┘
```

Nine anchored regions: 4 corners + 4 sides + 1 center. Each accepts ReactNode children.

## API

```tsx
<GameHUD
  scale={uiScale}
  reduceMotion={a11y.reduceMotion}
  colorBlindMode={a11y.colorBlindMode}
  contrastMode={a11y.contrastMode}
  inputType={inputType}     // "keyboard" | "controller-xbox" | "controller-ps" | "touch"
>
  <HUDSlot anchor="bottom-left">
    <PlayerFrame />
    <Buffs />
  </HUDSlot>

  <HUDSlot anchor="bottom-center">
    <Hotbar slots={9} />
  </HUDSlot>

  <HUDSlot anchor="top-right">
    <MiniMap />
    <QuestTracker />
  </HUDSlot>

  <HUDSlot anchor="bottom-right">
    <CombatLog />
  </HUDSlot>

  <HUDSlot anchor="center-overlay">
    <Crosshair />
  </HUDSlot>
</GameHUD>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `scale` | `number` | `1.0` | UI scale (0.5-2.0) |
| `reduceMotion` | `boolean` | system pref | Disable HUD animations |
| `colorBlindMode` | `"none" \| "protanopia" \| "deuteranopia" \| "tritanopia"` | `"none"` | CSS filter applied |
| `contrastMode` | `"normal" \| "high"` | `"normal"` | High-contrast theme |
| `inputType` | `"keyboard" \| "controller-xbox" \| "controller-ps" \| "touch"` | auto-detect | Determines button prompts |
| `customizable` | `boolean` | `true` | Enable player drag-positioning |
| `editing` | `boolean` | `false` | Edit mode (drag handles visible) |
| `children` | `HUDSlot[]` | — | Composed slot content |

## HUDSlot

```tsx
<HUDSlot
  anchor="bottom-left"
  offset={{ x: 16, y: 16 }}
  hidden={false}
  customId="player-frame-cluster"   // for save/restore
>
  {children}
</HUDSlot>
```

## Element primitives (ship with HUD)

### HealthBar

```tsx
<HealthBar
  current={hp}
  max={maxHp}
  showNumbers
  damageDelay={300}     // ms before bar drops to new value
  recentDamage           // shows secondary bar for last hit
  criticalThreshold={0.25}  // <25% pulses
  segmented={false}     // Zelda-hearts style if true
/>
```

### ResourceCounter (ammo / mana / etc.)

```tsx
<ResourceCounter
  icon={<AmmoIcon />}
  current={30}
  reserve={120}
  format="X / Y"        // or "X" or "X•Y"
  outOfState="reload"   // changes display when 0
/>
```

### Crosshair

```tsx
<Crosshair
  shape="dot"           // "dot" | "plus" | "T" | "custom"
  color="#FFFF00"
  size={4}
  spread={recoilSpread} // dynamic spread
  hitMarker={lastHit}
/>
```

### MiniMap

```tsx
<MiniMap
  rotation="follow-player"  // or "fixed-north"
  size={200}
  zoom={zoomLevel}
  markers={[
    { type: "ally", x, y },
    { type: "enemy", x, y, visible: true },
    { type: "objective", x, y },
  ]}
/>
```

### Hotbar

```tsx
<Hotbar
  slots={9}
  bindings={{ 1: skillId, 2: skillId, ... }}
  inputType={inputType}   // shows 1-9 keys or button icons
  cooldowns={cooldownState}
/>
```

### Buffs

```tsx
<Buffs
  active={[
    { id, icon, durationMs, stacks, type: "buff" | "debuff" },
    ...
  ]}
  layout="horizontal"
  showTimer
/>
```

### CombatNotification

```tsx
<DamageNumber value={150} type="normal" />
<DamageNumber value={320} type="critical" />
<HealNumber value={84} />
```

Float up + fade.

## States

| State | Visual |
| --- | --- |
| Default | All anchored slots visible |
| Editing | Drag handles + reset positions visible |
| Reduced motion | All slot animations frozen |
| High contrast | Adjusted colors / borders |
| Color-blind filter | CSS filter on whole HUD |
| Hidden by player | Element-by-element hide via settings |

## Tokens consumed

```
--game-hud-scale                 (multiplier on all sizes)
--game-hud-bg-overlay            (semi-opaque slot bg)
--game-hud-fg-default            (default text)
--game-hud-fg-emphasis           (highlights)
--game-hud-color-hp-full         (green)
--game-hud-color-hp-mid          (yellow)
--game-hud-color-hp-low          (red)
--game-hud-color-hp-critical     (deep red, pulses)
--game-hud-color-mana            (blue)
--game-hud-color-stamina         (yellow)
--game-hud-color-shield          (cyan)
--game-hud-color-buff            (green tint)
--game-hud-color-debuff          (red tint)
--game-hud-color-ally            (blue)
--game-hud-color-enemy           (red)
--game-hud-color-rare            (blue)
--game-hud-color-epic            (purple)
--game-hud-color-legendary       (orange / gold)
--game-hud-font-numbers          (tabular numerals; tnum)
```

## Customization save/restore

Save customization state per profile:

```ts
type HUDProfile = {
  scale: number;
  slots: { [slotId: string]: { x: number; y: number; hidden: boolean; scale?: number } };
  contrastMode: "normal" | "high";
  colorBlindMode: ColorBlindMode;
  reduceMotion: boolean;
};

// Persist to local storage, sync to cloud save
```

Default presets:
- **Minimal** — all hide except health + crosshair.
- **Standard** — default layout.
- **MMO** — dense layout with 3 hotbars.
- **High visibility** — large UI scale + high contrast.

## Accessibility

- **Subtitle channel** is in HUD overlay, but typically a separate component (`<SubtitleOverlay />`).
- **Visual sound indicators** can be added as a HUDSlot child.
- **Color-blind filter**: applied via CSS filter (`filter: contrast / saturate / hue-rotate`) — affects whole HUD.
- **High-contrast mode**: swaps color tokens to higher-contrast values.
- **UI scale 50-200%**: all sizes derive from `--game-hud-scale`.
- **Keyboard navigation** of HUD elements (tab between slots) for screen reader / motor accessibility.

## Implementation hints

```tsx
function GameHUD({
  scale = 1,
  reduceMotion,
  colorBlindMode = "none",
  contrastMode = "normal",
  inputType = "auto",
  customizable = true,
  editing = false,
  children,
}: Props) {
  const detectedInput = useDetectedInputType();
  const effectiveInput = inputType === "auto" ? detectedInput : inputType;

  return (
    <div
      className="game-hud"
      data-scale={scale}
      data-reduce-motion={reduceMotion}
      data-contrast={contrastMode}
      data-color-blind={colorBlindMode}
      data-input={effectiveInput}
      data-editing={editing}
      style={{ "--game-hud-scale": scale } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

function HUDSlot({ anchor, offset = { x: 0, y: 0 }, hidden, customId, children }: SlotProps) {
  const customPos = useCustomPosition(customId);
  if (hidden) return null;

  return (
    <div
      className="game-hud__slot"
      data-anchor={anchor}
      style={{
        ...computeAnchor(anchor),
        transform: customPos ? `translate(${customPos.x}px, ${customPos.y}px)` : `translate(${offset.x}px, ${offset.y}px)`,
      }}
    >
      {children}
    </div>
  );
}
```

## CSS

```css
.game-hud {
  position: absolute;
  inset: 0;
  pointer-events: none;
  font-feature-settings: 'tnum';
  font-family: var(--game-hud-font, sans-serif);
}

.game-hud[data-color-blind="protanopia"]   { filter: var(--cb-protanopia-filter); }
.game-hud[data-color-blind="deuteranopia"] { filter: var(--cb-deuteranopia-filter); }
.game-hud[data-color-blind="tritanopia"]   { filter: var(--cb-tritanopia-filter); }

.game-hud[data-contrast="high"] { /* swap color tokens */ }

.game-hud__slot {
  position: absolute;
  pointer-events: auto;
}

.game-hud__slot[data-anchor="top-left"]      { top: 0; left: 0; }
.game-hud__slot[data-anchor="top-right"]     { top: 0; right: 0; }
.game-hud__slot[data-anchor="bottom-left"]   { bottom: 0; left: 0; }
.game-hud__slot[data-anchor="bottom-right"]  { bottom: 0; right: 0; }
.game-hud__slot[data-anchor="bottom-center"] { bottom: 0; left: 50%; transform: translateX(-50%); }
.game-hud__slot[data-anchor="center-overlay"] {
  top: 50%; left: 50%; transform: translate(-50%, -50%);
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .game-hud * { animation: none !important; transition: none !important; }
}
```

## Edge cases

- **Ultra-wide aspect ratios**: anchor to safe zones, not edge of screen.
- **Foldable devices**: re-anchor on display change.
- **Resolution scaling**: HUD scales independently of game render scale.
- **Modal overlays** (pause menu, inventory): HUD usually pauses or fades.
- **Cross-platform** (PC + console + mobile): same HUD; different input prompts.

## Don't

- Don't hard-code positions in pixels. Use anchors + scale.
- Don't override system reduced-motion.
- Don't lock customization. Let players move things.
- Don't ship without color-blind alternatives.
- Don't mix input prompts (Xbox + PS in same UI). Detect and swap.
- Don't render HUD inside game viewport — keep as overlay layer.
- Don't break HUD on resolution change. Test at 720p, 1080p, 1440p, 4K, ultra-wide.

## Cross-reference

- [`knowledge/game-ui/hud-design.md`](../knowledge/game-ui/hud-design.md) — HUD elements
- [`knowledge/game-ui/game-ui-fundamentals.md`](../knowledge/game-ui/game-ui-fundamentals.md) — categories
- [`knowledge/game-ui/game-accessibility.md`](../knowledge/game-ui/game-accessibility.md) — a11y
- [`knowledge/game-ui/korean-gaming-conventions.md`](../knowledge/game-ui/korean-gaming-conventions.md) — KR
- [`examples/component-game-menu.md`](component-game-menu.md) — pause / inventory menus
