#!/usr/bin/env python3
"""
Extract Ant Design seed tokens into knowledge/design-tokens/ant-design.md.

Source: refs/ant-design/components/theme/themes/seed.ts
Output: knowledge/design-tokens/ant-design.md

Idempotent. Re-run after `git -C refs/ant-design pull`.
"""
from __future__ import annotations

import argparse
import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "refs/ant-design/components/theme/themes/seed.ts"
PRESET_SOURCE = ROOT / "refs/ant-design/components/theme/themes/seed.ts"
OUT = ROOT / "knowledge/design-tokens/ant-design.md"
SWATCH_STYLE = (
    "display:inline-block;width:0.875rem;height:0.875rem;"
    "border-radius:999px;border:1px solid rgba(0,0,0,.18);"
    "vertical-align:-0.125em;"
)


def parse_seed_tokens(text: str) -> dict[str, str]:
    """Pull `key: value,` lines out of the seedToken object literal.

    A template-literal value may span several lines (Ant's `fontFamily`); its
    lines are joined with single spaces and the backticks are dropped so the
    value renders inside one Markdown code span.
    """
    tokens: dict[str, str] = {}
    in_object = False
    pending_key: str | None = None
    pending_parts: list[str] = []
    for line in text.splitlines():
        stripped = line.strip()
        if pending_key is not None:
            pending_parts.append(stripped)
            if stripped.rstrip(",").endswith("`"):
                joined = " ".join(pending_parts).rstrip(",").strip("`")
                tokens[pending_key] = re.sub(r"\s+", " ", joined).strip()
                pending_key, pending_parts = None, []
            continue
        if "const seedToken" in stripped:
            in_object = True
            continue
        if in_object and stripped.startswith("}"):
            break
        if not in_object:
            continue
        # Skip comments and spread
        if stripped.startswith("//") or stripped.startswith("/*") or stripped.startswith("*"):
            continue
        if stripped.startswith("..."):
            continue
        match = re.match(r"^([a-zA-Z][a-zA-Z0-9]*):\s*(.+?),?\s*(?://.*)?$", stripped)
        if not match:
            continue
        key, value = match.groups()
        value = value.strip().rstrip(",")
        if value.startswith("`") and (len(value) == 1 or not value.endswith("`")):
            # Keep the raw first line: the regex above drops its trailing comma.
            pending_key, pending_parts = key, [stripped.split(":", 1)[1].strip()]
            continue
        if value.startswith("`") and value.endswith("`"):
            value = value.strip("`")
        tokens[key] = value
    return tokens


def parse_preset_colors(text: str) -> dict[str, str]:
    """Extract the defaultPresetColors map."""
    presets: dict[str, str] = {}
    in_object = False
    for line in text.splitlines():
        stripped = line.strip()
        if "defaultPresetColors" in stripped and "{" in stripped:
            in_object = True
            continue
        if in_object and stripped.startswith("}"):
            break
        if not in_object:
            continue
        if stripped.startswith("//") or stripped.startswith("*") or stripped.startswith("/*"):
            continue
        match = re.match(r"^([a-zA-Z][a-zA-Z0-9]*):\s*'([^']+)'", stripped)
        if match:
            name, hex_value = match.groups()
            presets[name] = hex_value
    return presets


def render(tokens: dict[str, str], presets: dict[str, str]) -> str:
    today = date.today().isoformat()

    color_keys = [k for k in tokens if k.startswith("color")]
    font_keys = [k for k in tokens if k.startswith("font")]
    motion_keys = [k for k in tokens if k.startswith("motion")]
    size_keys = [k for k in tokens if k in {"sizeUnit", "sizeStep", "sizePopupArrow", "controlHeight"}]
    radius_keys = [k for k in tokens if k.startswith("borderRadius") or k == "borderRadius"]
    line_keys = [k for k in tokens if k.startswith("line")]
    focus_keys = [k for k in tokens if k.startswith("focus")]

    def table(keys: list[str]) -> str:
        if not keys:
            return "_(none)_\n"
        rows = ["| Token | Value |", "| --- | --- |"]
        for k in keys:
            v = tokens[k].replace("|", "\\|")
            rows.append(f"| `{k}` | `{v}` |")
        return "\n".join(rows) + "\n"

    preset_rows = ["| Name | Hex | Swatch |", "| --- | --- | --- |"]
    for name, hex_v in presets.items():
        preset_rows.append(
            f'| {name} | `{hex_v}` | <span aria-hidden="true" '
            f'style="{SWATCH_STYLE}background-color:{hex_v};"></span> |'
        )
    preset_table = "\n".join(preset_rows) + "\n"

    return f"""---
title: Ant Design seed tokens
source: refs/ant-design/components/theme/themes/seed.ts
upstream: https://github.com/ant-design/ant-design/blob/master/components/theme/themes/seed.ts
extracted_at: {today}
applies_to: [react, antd, design-system]
version: 1.1.0
last_updated: 2026-10
stability: stable
---

# Ant Design seed tokens

Ant Design uses a layered token model: **seed tokens** (raw inputs) → **map tokens** (derived scales) → **alias tokens** (semantic names). This file documents the seed layer — the inputs you change to retheme the entire system. For the derived surfaces, elevation, radius, and component rules, see [Beyond the seed layer](#beyond-the-seed-layer) below, which summarizes Ant's own `DESIGN.md`.

## Color seeds

{table(color_keys)}

## Preset palette anchors

Ant Design ships 12 preset color families. Each anchor below is the "primary" hue (rank 6 in a 10-step scale). The full ramp is generated at runtime by `genPresetColor`.

{preset_table}

## Typography

{table(font_keys)}

## Motion (cubic-bezier curves)

{table(motion_keys)}

## Sizing

{table(size_keys)}

## Border / radius

{table(radius_keys)}

## Lines

{table(line_keys)}

## Focus

{table(focus_keys)}

`focusOutline` (added in 6.6.0) turns the visible focus outline on or off. The alias `lineWidthFocus` follows it: `0` when `focusOutline` is `false`, otherwise `lineWidth * 3` (`refs/ant-design/components/theme/util/alias.ts`). Keep it `true` — turning it off removes the keyboard focus indicator WCAG 2.4.7 requires.

## Beyond the seed layer

Source: `refs/ant-design/DESIGN.md` (Ant's own design summary for the v6 light theme, shipped since 6.5.0) and `refs/ant-design/components/theme/util/alias.ts`.

- **Density first.** Base font size is 14 px, not 16, so a 1440 px window fits a sidebar, header, an eight-column table, and a detail pane. Only two weights appear in UI chrome: 400 and 600 (`fontWeightStrong`). Selected and active states use color and stroke, not weight.
- **Neutral text is alpha black**, not flat grey: `rgba(0,0,0,0.88 / 0.65 / 0.45 / 0.25)` for primary, secondary, tertiary, and disabled text, so text keeps blending over tinted cells.
- **Three surface layers:** `colorBgLayout` (`#F5F5F5`, page) → `colorBgContainer` (`#FFFFFF`, cards, tables, forms) → `colorBgElevated` (`#FFFFFF`, modals, dropdowns — told apart by shadow, not color). Read the token; never hard-code `#FFF` or `#FAFAFA`, or dark mode breaks.
- **Flat-first elevation.** Borders and tone carry hierarchy; shadows only on floating surfaces. Tiers: `boxShadowTertiary` (raised; its alphas rose to 0.05 / 0.03 / 0.03 in 6.x), `boxShadow` / `boxShadowSecondary` (popups), `boxShadowCard`, directional drawer and tab-overflow shadows, and `dropShadowPopover` (a `filter: drop-shadow` chain used by Tooltip and Popover styles; marked `@internal` in `theme/interface/alias.ts`, so do not depend on it).
- **Radius by component class:** controls 6 px, surfaces (card, modal, drawer, notification) 8 px, tags and tooltips 4 px, full pill only for avatars, badges, and dots, 0 px for tables. Do not mix radii on adjacent elements.
- **Color roles:** one `colorPrimary` action per screen; the 12 preset families are for tags, charts, and categories only, never for primary affordances.
- **Contrast caveat (Ant's own note):** white text on `#1677FF` and primary text on pale selected backgrounds fall below WCAG AA 4.5:1 for small text. For strict targets, darken `colorPrimary` via `ConfigProvider` rather than one-off colors.
- **New alias tokens in 6.x:** `fontHeight`, `fontHeightSM`, `fontHeightLG` = rounded `fontSize × lineHeight` for each size.

## Notes for designers

- `colorPrimary` drives the entire interactive surface — buttons, links, focus rings, selected states.
- `borderRadius: 6` is the system default. Components like `Button` and `Input` use this directly. Going to `0` produces the "wireframe" aesthetic; going to `12+` produces "soft/friendly".
- `controlHeight: 32` is the canonical input height. `controlHeightSM = controlHeight - 8 = 24`, `controlHeightLG = controlHeight + 8 = 40`. Match this when building custom controls so they align in forms.
- `sizeUnit: 4, sizeStep: 4` produces the spacing scale `4, 8, 12, 16, 20, 24, 32, 40, 48, 64`.
- Motion easings: `motionEaseOut` for entering UI, `motionEaseInOut` for sliding, `motionEaseOutCirc` for slide-up overlays.

## How to use this in a project

If your project uses `antd`, set `theme.token` directly:

```tsx
<ConfigProvider theme={{ token: {{ colorPrimary: '#7C3AED', borderRadius: 8 }} }}>
  <App />
</ConfigProvider>
```

If your project does not use `antd` but you want the same ramp model:

1. Pick a primary hex.
2. Use `tools/extractors/preset_color_ramp.py` (TODO) to generate the 10-step ramp.
3. Map ramps to semantic aliases (`color-primary`, `color-primary-hover`, …) using ranks `6/5/7` for default/hover/active.
"""


def assert_condition(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f"ant-design token self-test failed: {message}")


def run_self_test() -> int:
    sample = """
const defaultPresetColors = {
  blue: '#1677FF',
  green: '#52C41A',
};

const seedToken = {
  colorPrimary: '#1677ff',
  fontFamily: `-apple-system, 'Segoe UI', Roboto,
'Noto Sans', sans-serif,
'Noto Color Emoji'`,
  fontFamilyCode: `'SFMono-Regular', monospace`,
  fontSize: 14,
  motion: true,
  sizeUnit: 4,
  borderRadius: 6,
  lineWidth: 1,
  focusOutline: true,
};
"""
    tokens = parse_seed_tokens(sample)
    presets = parse_preset_colors(sample)
    output = render(tokens, presets)

    assert_condition(tokens["colorPrimary"] == "'#1677ff'", "seed color should parse")
    assert_condition(
        tokens["fontFamily"] == "-apple-system, 'Segoe UI', Roboto, 'Noto Sans', sans-serif, 'Noto Color Emoji'",
        "multi-line template literal should join into one value without backticks",
    )
    assert_condition(tokens["fontFamilyCode"] == "'SFMono-Regular', monospace", "one-line template literal should drop backticks")
    assert_condition(tokens["fontSize"] == "14", "token after a multi-line literal should still parse")
    assert_condition("| `focusOutline` | `true` |" in output, "focus seed should render in the Focus table")
    assert_condition("``" not in output.split("## Beyond the seed layer")[0], "no doubled backticks in token tables")
    assert_condition(presets["blue"] == "#1677FF", "preset color should parse")
    assert_condition("![](#" not in output, "swatch output should not create hash image links")
    assert_condition("background-color:#1677FF" in output, "swatch should render as inline HTML")
    assert_condition('aria-hidden="true"' in output, "decorative swatch should be hidden from assistive tech")

    print("Ant Design token extractor self-test passed")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--self-test", action="store_true", help="Run local parser/render checks.")
    args = parser.parse_args()

    if args.self_test:
        return run_self_test()

    if not SOURCE.exists():
        raise SystemExit(f"Source not found: {SOURCE}")
    text = SOURCE.read_text(encoding="utf-8")
    tokens = parse_seed_tokens(text)
    presets = parse_preset_colors(text)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(render(tokens, presets), encoding="utf-8")
    print(f"  wrote {OUT.relative_to(ROOT)} ({len(tokens)} tokens, {len(presets)} presets)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
