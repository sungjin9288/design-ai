#!/usr/bin/env python3
"""
Catalog the shadcn-ui registry — list all UI components, blocks, and charts.

Source:
  refs/shadcn-ui/apps/v4/registry/new-york-v4/

Output:
  knowledge/components/shadcn-registry.md
"""
from __future__ import annotations

from collections import defaultdict
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
REG = ROOT / "refs/shadcn-ui/apps/v4/registry/new-york-v4"
OUT = ROOT / "knowledge/components/shadcn-registry.md"


def list_top(directory: Path, ext: set[str] | None = None) -> list[str]:
    if not directory.exists():
        return []
    out: list[str] = []
    for child in sorted(directory.iterdir()):
        if child.is_file():
            if ext is None or child.suffix in ext:
                out.append(child.stem)
        elif child.is_dir():
            out.append(child.name)
    return out


def render(sections: dict[str, list[str]]) -> str:
    today = date.today().isoformat()
    parts = [f"""---
title: shadcn-ui registry catalog
source: refs/shadcn-ui/apps/v4/registry/new-york-v4/
upstream: https://github.com/shadcn-ui/ui/tree/main/apps/v4/registry/new-york-v4
extracted_at: {today}
applies_to: [react, tailwindcss, radix-ui]
---

# shadcn-ui registry catalog (new-york-v4)

shadcn-ui is **not** an installable package — it's a registry of source files you copy into your project. The "new-york-v4" style is the modern default. Each entry below is a component you can `npx shadcn add <name>`.

"""]

    for section, items in sections.items():
        if not items:
            continue
        parts.append(f"## {section} ({len(items)})\n\n")
        # 4-column grid via tables for readability
        cols = 4
        rows: list[list[str]] = [[] for _ in range((len(items) + cols - 1) // cols)]
        for i, item in enumerate(items):
            rows[i // cols].append(f"`{item}`")
        # Pad
        for r in rows:
            while len(r) < cols:
                r.append("")
        parts.append("| " + " | ".join([" "] * cols) + " |\n")
        parts.append("| " + " | ".join(["---"] * cols) + " |\n")
        for r in rows:
            parts.append("| " + " | ".join(r) + " |\n")
        parts.append("\n")

    parts.append("""## How to use

```bash
npx shadcn@latest add button card dialog
```

Components land in `components/ui/`. Edit them — they are yours, not a dependency.

## When to pick shadcn over MUI/Ant

- You want Tailwind, not CSS-in-JS.
- You want to **own** the component code.
- You're using Radix primitives or Headless UI elsewhere.
- You want minimal bundle (no theme runtime).

## When NOT to pick shadcn

- You need RTL out of the box (less polished than MUI/Ant).
- You need form/data-table primitives that are deeply pre-wired (use Ant Design Form/Table).
- You ship to non-React frameworks.
""")
    return "".join(parts)


def main() -> None:
    if not REG.exists():
        raise SystemExit(f"Registry not found: {REG}")

    sections = {
        "UI primitives": list_top(REG / "ui", {".tsx", ".ts"}),
        "Blocks": list_top(REG / "blocks"),
        "Charts": list_top(REG / "charts", {".tsx"}),
        "Hooks": list_top(REG / "hooks", {".tsx", ".ts"}),
        "Examples": list_top(REG / "examples", {".tsx"}),
    }

    total = sum(len(v) for v in sections.values())
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(render(sections), encoding="utf-8")
    print(f"  wrote {OUT.relative_to(ROOT)} ({total} entries)")


if __name__ == "__main__":
    main()
