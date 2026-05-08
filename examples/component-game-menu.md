<!-- hand-written -->
# `GameMenu` (custom — composable game menu shell with focus / input handling) — spec

> Composable shell for main menu / pause menu / settings / inventory / store. Handles focus management for keyboard / controller / touch, button-prompt swapping, modal stacking, and reduced-motion. Pairs with [`knowledge/game-ui/menu-systems.md`](../knowledge/game-ui/menu-systems.md).

## Purpose

Game menus need behaviors web menus don't:
1. **Controller / d-pad navigation** with auto-focus.
2. **Button prompt** rendering ([A] Confirm, [B] Back) per platform.
3. **Modal stacking** (pause → settings → audio sub-menu).
4. **Tab navigation** with shoulder buttons (LB/RB).
5. **Auto-pause game** when opened.
6. **Smooth transitions** between menus.

`GameMenu` provides these primitives so each game menu screen doesn't reinvent.

## Anatomy

```
┌──────────────────────────────────────────┐
│ ← [Back]  TITLE              [LB]│[RB]   │   ← header w/ tabs
├──────────────────────────────────────────┤
│                                          │
│   [Menu items list]                      │
│   ▶ Selected item                        │
│     Item 2                               │
│     Item 3                               │
│                                          │
│   [Detail panel]                         │
│   Description of selected item           │
│                                          │
├──────────────────────────────────────────┤
│ [A] Confirm  [B] Back  [Y] Action        │   ← input prompts footer
└──────────────────────────────────────────┘
```

## API

```tsx
<GameMenu
  open={open}
  onClose={() => setOpen(false)}
  title="설정 / Settings"
  inputType={inputType}
  pauseGame
  variant="overlay"        // "fullscreen" | "overlay" | "modal"
  tabs={[
    { id: "video", label: "Video" },
    { id: "audio", label: "Audio" },
    { id: "controls", label: "Controls" },
    { id: "a11y", label: "Accessibility" },
  ]}
  activeTab={tab}
  onTabChange={setTab}
  prompts={[
    { button: "A", label: "Confirm", action: confirm },
    { button: "B", label: "Back", action: back },
    { button: "Y", label: "Reset", action: reset },
  ]}
>
  <GameMenuList>
    <GameMenuItem id="resolution" label="Resolution" value="1920x1080" />
    <GameMenuItem id="fullscreen" label="Fullscreen" value={true} type="toggle" />
    <GameMenuItem id="vsync" label="V-Sync" value="On" type="select" options={...} />
  </GameMenuList>
</GameMenu>
```

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `open` | `boolean` | — | Visibility |
| `onClose` | `() => void` | — | Back button / Esc |
| `title` | `string` | — | Menu title |
| `inputType` | `"keyboard" \| "controller-xbox" \| "controller-ps" \| "touch"` | auto | Determines prompts |
| `pauseGame` | `boolean` | `true` | Pause game world while menu open (single-player) |
| `variant` | `"fullscreen" \| "overlay" \| "modal"` | `"overlay"` | Visual treatment |
| `tabs` | `Tab[]` | `[]` | Tab definitions |
| `activeTab` | `string` | — | Current tab |
| `onTabChange` | `(id) => void` | — | Tab switch handler |
| `prompts` | `Prompt[]` | `[]` | Input prompt definitions for footer |
| `transitionDuration` | `number` | `200` | Open/close ms |
| `children` | `ReactNode` | — | Menu content |

## Variants

### `fullscreen`

Full-screen replacement for game render. Used for main menu, settings, large inventories.

### `overlay`

Semi-opaque overlay with menu panel. Game world dimmed but visible. Used for pause, in-game inventory.

### `modal`

Centered modal with backdrop. Used for confirmation dialogs, item detail.

## Components inside

### GameMenuList

```tsx
<GameMenuList orientation="vertical" wrapNav={true}>
  {items}
</GameMenuList>
```

Handles arrow key / d-pad navigation between children.

### GameMenuItem

```tsx
<GameMenuItem
  id="vsync"
  label="V-Sync"
  type="select"           // "button" | "toggle" | "select" | "slider" | "remap"
  value={value}
  options={["Off", "On", "Adaptive"]}
  onChange={(v) => setValue(v)}
  description="Synchronizes display refresh; reduces tearing"
  hotkey="V"              // optional keyboard shortcut
/>
```

| `type` | UI |
| --- | --- |
| `button` | Single action (Resume, Quit) |
| `toggle` | On / Off boolean |
| `select` | Dropdown / cycle options |
| `slider` | Range input |
| `remap` | Capture next button press |

### Tab strip

For tabbed menus:

```
[< L1]  Video  Audio  Controls  Accessibility  [R1 >]
                ───── ───────                      
                       active                       
```

L1 / R1 (or Q / E on PC) cycle tabs. Click / tap also works.

## Focus management

### Auto-focus on open

When menu opens, first interactive item auto-focused. Visible focus ring on controllers.

### Focus trap

Tab / arrow / d-pad cycles within menu. Doesn't escape to background game.

### Focus restoration on close

When menu closes, focus returns to whatever triggered it (or game window).

### Visible focus indicator

```css
.game-menu-item[data-focused="true"] {
  outline: 2px solid var(--game-menu-focus-color);
  background: var(--game-menu-focus-bg);
}
```

For controller users: focus indicator must be unmistakable. Bigger, brighter than typical web focus ring.

## Input handling

### Keyboard

- Arrow keys / WASD: navigate.
- Enter / Space: confirm.
- Esc: back.
- Tab / Shift+Tab: alternative navigation.
- Letter shortcuts (V for V-Sync) when defined.

### Controller (Xbox)

- D-pad / left stick: navigate.
- A: confirm.
- B: back.
- Y: secondary action (reset, more info).
- X: tertiary.
- LB / RB: tab cycle.
- Start / Menu button: close.

### Controller (PlayStation)

- D-pad / left stick: navigate.
- ✕ (X): confirm.
- ◯ (Circle): back.
- △ (Triangle): secondary.
- □ (Square): tertiary.
- L1 / R1: tab cycle.
- Options: close.

### Touch

- Tap: select / confirm.
- Tap "Back" button (top-left).
- Swipe between tabs.
- Long-press for context menu (optional).

## Button prompt rendering

```tsx
<InputPrompt button="A" inputType="controller-xbox" /> → [A]
<InputPrompt button="A" inputType="controller-ps" />   → [✕]
<InputPrompt button="A" inputType="keyboard" />        → [Enter]
<InputPrompt button="A" inputType="touch" />           → [Confirm] (text label)
```

Common abstract names: `confirm`, `cancel`, `secondary`, `tertiary`, `tab-prev`, `tab-next`, `menu`. Component maps to platform.

## States

| State | Visual |
| --- | --- |
| Closed | Hidden |
| Opening | Fade-in + scale 200ms |
| Open | Steady state |
| Tab transition | Cross-fade content 150ms |
| Closing | Fade-out 200ms |
| Reduced motion | Instant open / close |

## Tokens consumed

```
--game-menu-bg-overlay           (semi-opaque backdrop)
--game-menu-bg-panel             (menu panel bg)
--game-menu-fg-default           (text)
--game-menu-fg-emphasis          (selected / hover)
--game-menu-focus-color          (focus ring)
--game-menu-focus-bg             (focus bg)
--game-menu-divider              (between sections)
--game-menu-prompts-bg           (footer prompts bg)
--game-menu-anim-fade            (200ms by default)
--game-menu-ease                 (ease-out)
```

## Accessibility

- **Focus visible** at all times during keyboard / controller use.
- **Screen reader**: each menu item announced as it's focused.
- **High contrast** mode swaps tokens.
- **Reduced motion** disables transitions.
- **Localizable** all labels.
- **Subtitle for menu sounds** if SFX-driven menus (rare but exists).
- **Touch targets** ≥ 44pt on mobile.

## Implementation hints

```tsx
function GameMenu({ open, onClose, title, inputType, prompts, children, ... }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Focus trap
  useFocusTrap(containerRef, { active: open, onEscape: onClose });

  // Auto-focus first interactive on open
  useEffect(() => {
    if (open) {
      const first = containerRef.current?.querySelector<HTMLElement>("[data-focusable='true']");
      first?.focus();
    }
  }, [open]);

  // Pause game when open (single-player only)
  useEffect(() => {
    if (open) gameState.pause();
    else gameState.resume();
  }, [open]);

  if (!open) return null;

  return (
    <div className="game-menu-backdrop" onClick={onClose} role="dialog" aria-label={title}>
      <div ref={containerRef} className="game-menu-panel" onClick={e => e.stopPropagation()}>
        <GameMenuHeader title={title} onBack={onClose} tabs={...} />
        <GameMenuBody>{children}</GameMenuBody>
        <GameMenuPrompts prompts={prompts} inputType={inputType} />
      </div>
    </div>
  );
}
```

## Edge cases

- **Multiplayer game**: don't pause world; show menu over live game with semi-transparency.
- **Network disconnect mid-menu**: handle gracefully; usually return to title.
- **Multiple menus stacked** (settings → audio submenu): manage stack; `B` / Esc pops stack one level.
- **Controller disconnect**: fall back to keyboard prompts; alert player.
- **Cross-platform game**: detect controller type and swap prompts; some games allow manual override.
- **Save/load mid-menu**: confirm before allowing destructive actions.
- **Tab content lazy-load**: don't render all tabs at mount; load on activate.

## Korean game menu specifics

- 자막 toggle prominent (often top of accessibility).
- 본인인증 button visible on account / login menus.
- 확률 표시 (probability) link from gacha menus.
- VIP / 출석 banners commonly integrated into main menu.

## Don't

- Don't hard-code one input type. Detect and swap.
- Don't break the back button. Esc / B should always work.
- Don't lock the player out of menu (must be openable any time game is running).
- Don't delay critical menus (settings) behind cinematics.
- Don't omit input prompts. Players need to know which buttons work.
- Don't use small touch targets (< 44pt) on mobile.
- Don't auto-pause in multiplayer.
- Don't make settings unsearchable past 50 items.

## Cross-reference

- [`knowledge/game-ui/menu-systems.md`](../knowledge/game-ui/menu-systems.md) — menu types
- [`knowledge/game-ui/game-ui-fundamentals.md`](../knowledge/game-ui/game-ui-fundamentals.md) — input methods
- [`knowledge/game-ui/game-accessibility.md`](../knowledge/game-ui/game-accessibility.md) — a11y
- [`knowledge/game-ui/korean-gaming-conventions.md`](../knowledge/game-ui/korean-gaming-conventions.md) — KR
- [`examples/component-game-hud.md`](component-game-hud.md) — HUD primitive
- [`knowledge/a11y/keyboard-and-focus.md`](../knowledge/a11y/keyboard-and-focus.md) — focus management
