#!/usr/bin/env python3
"""
Check that internal markdown links resolve to existing files.

Scans all .md files in the repo (excluding refs/) for `](path)` patterns.
Reports broken links.

Doesn't check external URLs (would require HTTP fetches).

Usage:
  python3 tools/audit/link-check.py [--fix-suggestions]
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

# Match markdown links: [text](url) — only relative URLs, not http(s).
# Use * (not +) for the text so links survive after we strip inline code spans
# from `[`text`](url)` → `[](url)`. Surfaced in v4.7 mkdocs build dogfood:
# the previous + quantifier silently skipped any link whose text was wrapped
# in backticks, masking real broken links.
LINK_RE = re.compile(r"\[([^\]]*)\]\(([^)\s]+?)(?:#[^)]+)?\)")
SKIP_PATH_MARKERS = (
    "refs/",
    ".claude/",
    "evidence/",
    "_portfolio_export/",
    "site-src/",
    "/site/",
    "node_modules/",
    "vscode-extension/.vscode-test/",
)


def is_skipped_repo_path(path: Path) -> bool:
    path_text = path.as_posix()
    return any(marker in path_text for marker in SKIP_PATH_MARKERS)


def is_external(url: str) -> bool:
    return url.startswith(("http://", "https://", "mailto:", "ftp://", "tel:"))


def is_anchor_only(url: str) -> bool:
    return url.startswith("#")


def is_refs_path(url: str) -> bool:
    """refs/ is gitignored — links into it are conditional and shouldn't fail."""
    return "refs/" in url


def resolve_link(source_file: Path, link: str) -> Path | None:
    """Resolve a link relative to the source file's directory.
    Returns the resolved Path or None if it's not a file path (e.g., external)."""
    if is_external(link) or is_anchor_only(link) or is_refs_path(link):
        return None
    # Strip query strings
    link = link.split("?")[0].split("#")[0]
    if not link:
        return None
    return (source_file.parent / link).resolve()


def find_similar(broken: Path) -> list[Path]:
    """Find files with similar names — for fix suggestions."""
    name = broken.name
    if not name.endswith(".md"):
        return []
    # Search anywhere in the repo
    candidates = []
    for p in ROOT.rglob(name):
        if is_skipped_repo_path(p):
            continue
        candidates.append(p)
    return candidates[:3]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--fix-suggestions", action="store_true", help="Suggest similar files for broken links")
    args = parser.parse_args()

    files = [
        p for p in ROOT.rglob("*.md")
        if not is_skipped_repo_path(p)
    ]

    broken: list[tuple[Path, str, int]] = []  # (source, link, line)
    files_checked = 0

    for path in files:
        files_checked += 1
        text = path.read_text(encoding="utf-8")
        in_code_block = False
        for line_num, line in enumerate(text.splitlines(), 1):
            # Skip code blocks — links there are illustrative, not real
            if line.strip().startswith("```"):
                in_code_block = not in_code_block
                continue
            if in_code_block:
                continue
            # Strip inline code spans (`...`) before matching — markdown syntax
            # examples inside backticks are not real links.
            line_no_code = re.sub(r"`[^`]*`", "", line)
            for match in LINK_RE.finditer(line_no_code):
                _, url = match.groups()
                if is_external(url) or is_anchor_only(url) or is_refs_path(url):
                    continue
                resolved = resolve_link(path, url)
                if resolved is None:
                    continue
                if not resolved.exists():
                    rel_source = path.relative_to(ROOT)
                    broken.append((rel_source, url, line_num))

    print(f"Checked {files_checked} files")
    if broken:
        print(f"\n{len(broken)} broken links:\n")
        # Group by source file
        by_source: dict[Path, list[tuple[str, int]]] = {}
        for source, link, line_num in broken:
            by_source.setdefault(source, []).append((link, line_num))

        for source in sorted(by_source.keys(), key=str):
            print(f"\n{source}:")
            for link, line_num in by_source[source]:
                print(f"  line {line_num}: {link}")
                if args.fix_suggestions:
                    target = (ROOT / source).parent / link
                    similar = find_similar(target)
                    if similar:
                        for s in similar:
                            print(f"    → maybe: {s.relative_to(ROOT)}")
        sys.exit(1)
    else:
        print("All internal links resolve ✓")


if __name__ == "__main__":
    main()
