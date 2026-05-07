#!/usr/bin/env python3
"""
Build a unified component index across ant-design, mui, shadcn-ui.

For each component, record:
  - name (canonical, kebab-case)
  - presence in each library
  - source path(s)
  - first-line description from each library's component README/index doc

Output:
  knowledge/components/INDEX.md
  knowledge/components/index.json   (machine-readable)
"""
from __future__ import annotations

import json
from collections import defaultdict
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ANT_DIR = ROOT / "refs/ant-design/components"
MUI_DIR = ROOT / "refs/mui/packages/mui-material/src"
SHADCN_DIR = ROOT / "refs/shadcn-ui/apps/v4/registry/new-york-v4/ui"

OUT_MD = ROOT / "knowledge/components/INDEX.md"
OUT_JSON = ROOT / "knowledge/components/index.json"

# ----- normalization -----

ALIASES = {
    # canonical : aliases across libs
    "button": ["button"],
    "input": ["input", "text-field", "textfield"],
    "select": ["select"],
    "checkbox": ["checkbox"],
    "radio": ["radio", "radio-group"],
    "switch": ["switch"],
    "slider": ["slider"],
    "modal": ["modal", "dialog"],
    "drawer": ["drawer"],
    "popover": ["popover"],
    "tooltip": ["tooltip"],
    "table": ["table"],
    "tabs": ["tabs"],
    "tag": ["tag", "chip"],
    "badge": ["badge"],
    "avatar": ["avatar"],
    "card": ["card"],
    "menu": ["menu", "navigation-menu", "dropdown-menu"],
    "breadcrumb": ["breadcrumb", "breadcrumbs"],
    "pagination": ["pagination"],
    "steps": ["steps", "stepper"],
    "alert": ["alert"],
    "progress": ["progress", "linear-progress", "circular-progress"],
    "skeleton": ["skeleton"],
    "form": ["form"],
    "date-picker": ["date-picker", "datepicker", "calendar"],
    "tree": ["tree", "tree-view"],
    "transfer": ["transfer"],
    "upload": ["upload"],
    "rate": ["rate", "rating"],
    "accordion": ["collapse", "accordion"],
    "spin": ["spin", "circular-progress"],
    "tour": ["tour"],
    "watermark": ["watermark"],
    "anchor": ["anchor"],
    "back-top": ["back-top", "fab"],
    "auto-complete": ["auto-complete", "autocomplete"],
    "cascader": ["cascader"],
    "color-picker": ["color-picker"],
    "carousel": ["carousel"],
    "image": ["image"],
    "list": ["list"],
    "descriptions": ["descriptions"],
    "statistic": ["statistic"],
    "result": ["result"],
    "empty": ["empty"],
    "divider": ["divider"],
    "space": ["space", "stack"],
    "typography": ["typography"],
    "layout": ["layout", "container"],
    "grid": ["grid"],
    "popconfirm": ["popconfirm"],
    "qr-code": ["qr-code"],
    "segmented": ["segmented", "toggle-button-group"],
    "splitter": ["splitter"],
    "calendar-grid": ["calendar"],
    "float-button": ["float-button", "fab"],
    "config-provider": ["config-provider"],
    "app": ["app"],
}


def to_kebab(name: str) -> str:
    out = []
    for i, c in enumerate(name):
        if c.isupper() and i > 0 and not name[i - 1].isupper():
            out.append("-")
        out.append(c.lower())
    return "".join(out)


def canonicalize(name: str) -> str:
    name = to_kebab(name)
    for canon, aliases in ALIASES.items():
        if name in aliases:
            return canon
    return name


# ----- scanning -----

def scan_ant() -> dict[str, dict]:
    found: dict[str, dict] = {}
    if not ANT_DIR.exists():
        return found
    for child in sorted(ANT_DIR.iterdir()):
        if not child.is_dir():
            continue
        if child.name.startswith("_") or child.name.startswith("."):
            continue
        if child.name == "__tests__":
            continue
        canon = canonicalize(child.name)
        rel = child.relative_to(ROOT)
        found[canon] = {"name": child.name, "path": str(rel)}
    return found


def scan_mui() -> dict[str, dict]:
    found: dict[str, dict] = {}
    if not MUI_DIR.exists():
        return found
    for child in sorted(MUI_DIR.iterdir()):
        if not child.is_dir():
            continue
        if child.name.startswith("_") or child.name.startswith("."):
            continue
        # Skip internals/utilities
        skip = {"styles", "internal", "themeCssVarsAugmentation",
                "DefaultPropsProvider", "generateUtilityClass", "transitions",
                "useScrollTrigger", "useMediaQuery", "usePagination",
                "useAutocomplete", "useFormControl", "useTouchRipple",
                "ScopedCssBaseline", "GlobalStyles", "InitColorSchemeScript",
                "PigmentContainer", "PigmentGrid", "PigmentHidden",
                "PigmentStack", "useColorScheme", "useTheme", "useThemeProps",
                "Hidden", "Modal", "Portal"}
        if child.name in skip:
            continue
        canon = canonicalize(child.name)
        rel = child.relative_to(ROOT)
        found[canon] = {"name": child.name, "path": str(rel)}
    return found


def scan_shadcn() -> dict[str, dict]:
    found: dict[str, dict] = {}
    if not SHADCN_DIR.exists():
        return found
    for child in sorted(SHADCN_DIR.iterdir()):
        if not child.is_file():
            continue
        if child.suffix not in {".tsx", ".ts"}:
            continue
        name = child.stem
        canon = canonicalize(name)
        rel = child.relative_to(ROOT)
        found[canon] = {"name": name, "path": str(rel)}
    return found


# ----- rendering -----

def render(merged: dict[str, dict]) -> str:
    today = date.today().isoformat()
    rows = ["| Component | Ant Design | MUI | shadcn-ui |",
            "| --- | --- | --- | --- |"]
    for canon in sorted(merged):
        entry = merged[canon]
        ant = f"[`{entry['ant']['name']}`]({entry['ant']['path']})" if "ant" in entry else "—"
        mui = f"[`{entry['mui']['name']}`]({entry['mui']['path']})" if "mui" in entry else "—"
        sh = f"[`{entry['shadcn']['name']}`]({entry['shadcn']['path']})" if "shadcn" in entry else "—"
        rows.append(f"| **{canon}** | {ant} | {mui} | {sh} |")
    table = "\n".join(rows)

    counts = defaultdict(int)
    for entry in merged.values():
        if "ant" in entry:
            counts["ant"] += 1
        if "mui" in entry:
            counts["mui"] += 1
        if "shadcn" in entry:
            counts["shadcn"] += 1

    return f"""---
title: Component index across libraries
sources:
  - refs/ant-design/components/
  - refs/mui/packages/mui-material/src/
  - refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/
extracted_at: {today}
applies_to: [react, design-system]
---

# Component index

Cross-reference of components across Ant Design, MUI, and shadcn-ui. Use this when picking a reference implementation for a new component, comparing API patterns, or filling gaps.

**Coverage**: Ant Design {counts['ant']}, MUI {counts['mui']}, shadcn-ui {counts['shadcn']}, {len(merged)} canonical components.

{table}

## How to use

1. Pick a canonical component name from the leftmost column.
2. Open the linked source file for the library closest to your stack.
3. For API patterns: prefer Ant Design's exhaustive prop coverage as a checklist.
4. For accessibility: prefer shadcn-ui (Radix-based, a11y is upstream).
5. For visual polish: prefer MUI (Material 3 alignment, motion built-in).

When designing a new component **not** in this list, scan all three libraries' similar components first — the patterns are usually composable.
"""


def main() -> None:
    ant = scan_ant()
    mui = scan_mui()
    shadcn = scan_shadcn()

    merged: dict[str, dict] = defaultdict(dict)
    for canon, entry in ant.items():
        merged[canon]["ant"] = entry
    for canon, entry in mui.items():
        merged[canon]["mui"] = entry
    for canon, entry in shadcn.items():
        merged[canon]["shadcn"] = entry

    OUT_MD.parent.mkdir(parents=True, exist_ok=True)
    OUT_MD.write_text(render(dict(merged)), encoding="utf-8")
    OUT_JSON.write_text(json.dumps(dict(merged), indent=2, sort_keys=True), encoding="utf-8")

    print(f"  wrote {OUT_MD.relative_to(ROOT)} ({len(merged)} canonical components)")
    print(f"  wrote {OUT_JSON.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
