#!/usr/bin/env python3
"""
Build an index of brand design references in awesome-design-md.

Source:
  refs/awesome-design-md/design-md/<brand>/

Output:
  knowledge/patterns/brand-references.md
"""
from __future__ import annotations

from datetime import date
from pathlib import Path

from reference_pages import anchor_slug

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "refs/awesome-design-md/design-md"
OUT = ROOT / "knowledge/patterns/brand-references.md"
UPSTREAM = "https://github.com/VoltAgent/awesome-design-md"

# Reference-link policy (docs/PRODUCT-READINESS.md): link to the generated
# upstream reference page instead of the gitignored refs/ mirror. Relative
# path from knowledge/patterns/ to docs/reference/awesome-design-md.md.
REFERENCE_PAGE = "../../docs/reference/awesome-design-md.md"


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"Source not found: {SRC}")

    today = date.today().isoformat()
    brands: list[tuple[str, list[str]]] = []
    for brand_dir in sorted(SRC.iterdir()):
        if not brand_dir.is_dir():
            continue
        files = sorted([f.name for f in brand_dir.iterdir() if f.suffix == ".md"])
        brands.append((brand_dir.name, files))

    out = [f"""---
title: Brand reference index
source: refs/awesome-design-md/design-md/
upstream: {UPSTREAM}
extracted_at: {today}
applies_to: [art-direction, brand-research]
version: 1.0.0
last_updated: 2026-05
stability: stable
---

# Brand reference index

Curated design notes on {len(brands)} brands. When designing for a comparable category, open the brand's notes for token references, voice, and visual cues.

| Brand | Files |
| --- | --- |
"""]

    for brand, files in brands:
        link = f"{REFERENCE_PAGE}#{anchor_slug(brand)}"
        files_str = ", ".join(f"[`{f}`]({link})" for f in files) if files else "—"
        out.append(f"| **[{brand}]({link})** | {files_str} |")

    out.append("\n## How to use\n")
    out.append("""
1. Designing in a category? Find the closest comparable brand above.
2. Read the markdown files for that brand — colors, type, voice, image direction.
3. Cite, paraphrase, adapt — don't copy verbatim.
4. Cross-reference with `knowledge/colors/palettes-by-product-type.md` to find a matching palette starting point.
""")

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("\n".join(out), encoding="utf-8")
    print(f"  wrote {OUT.relative_to(ROOT)} ({len(brands)} brands)")


if __name__ == "__main__":
    main()
