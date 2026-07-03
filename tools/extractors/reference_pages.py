#!/usr/bin/env python3
"""
Generate upstream reference pages for the refs/ sources cited by the corpus.

Reference-link policy (docs/PRODUCT-READINESS.md): knowledge and examples
pages do not link into the gitignored refs/ mirrors directly. They link to
these generated pages instead, and each entry here links to the same path in
the upstream GitHub repository (blob/tree at HEAD, the default branch).

Sources scanned (same roots as the sibling extractors):
  refs/ant-design/components/
  refs/mui/packages/mui-material/src/
  refs/shadcn-ui/apps/v4/registry/new-york-v4/ui/
  refs/awesome-design-md/design-md/

Output:
  docs/reference/ant-design.md
  docs/reference/mui.md
  docs/reference/shadcn-ui.md
  docs/reference/awesome-design-md.md
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

from component_index import to_kebab

ROOT = Path(__file__).resolve().parents[2]
OUT_DIR = ROOT / "docs/reference"

GENERATED_MARKER = "<!-- generated: tools/extractors/reference_pages.py — do not edit by hand -->"
ANCHOR_SAFE_RE = re.compile(r"^[a-z0-9_-]+$")


def anchor_slug(name: str) -> str:
    """Slug for a markdown heading, matching Python-Markdown's toc slugify.

    Lowercase, drop characters outside [\\w\\s-] (e.g. the dot in
    ``linear.app`` → ``linearapp``), collapse whitespace to hyphens.
    """
    value = name.lower()
    value = re.sub(r"[^\w\s-]", "", value)
    return re.sub(r"\s+", "-", value.strip())


@dataclass(frozen=True)
class Entry:
    anchor: str          # heading text == rendered anchor slug
    display: str         # native upstream name
    upstream_path: str   # path inside the upstream repo
    is_dir: bool
    files: tuple[str, ...] = ()  # optional per-entry file listing


@dataclass(frozen=True)
class Source:
    key: str             # output page stem, e.g. "ant-design"
    title: str
    upstream_repo: str   # e.g. "ant-design/ant-design"
    refs_root: str       # local mirror root, relative to repo root
    description: str


SOURCES: tuple[Source, ...] = (
    Source(
        key="ant-design",
        title="Ant Design source reference",
        upstream_repo="ant-design/ant-design",
        refs_root="refs/ant-design",
        description="Mature enterprise component API with a dense token system.",
    ),
    Source(
        key="mui",
        title="MUI (Material UI) source reference",
        upstream_repo="mui/material-ui",
        refs_root="refs/mui",
        description="Material Design React reference implementation.",
    ),
    Source(
        key="shadcn-ui",
        title="shadcn/ui source reference",
        upstream_repo="shadcn-ui/ui",
        refs_root="refs/shadcn-ui",
        description="Modern Radix-based copy-paste component model.",
    ),
    Source(
        key="awesome-design-md",
        title="awesome-design-md brand reference",
        upstream_repo="VoltAgent/awesome-design-md",
        refs_root="refs/awesome-design-md",
        description="Curated markdown design notes for real-world brands.",
    ),
)


def upstream_url(repo: str, path: str, *, is_dir: bool) -> str:
    kind = "tree" if is_dir else "blob"
    return f"https://github.com/{repo}/{kind}/HEAD/{path}"


# ----- scanning -----
#
# Ant/MUI/shadcn scans are supersets of tools/extractors/component_index.py's
# scans (same roots, same prefix skips, but no MUI internals skip list), so
# every anchor linked from knowledge/components/INDEX.md exists here.

def scan_ant() -> list[Entry]:
    src = ROOT / "refs/ant-design/components"
    entries: list[Entry] = []
    for child in sorted(src.iterdir()):
        if not child.is_dir():
            continue
        if child.name.startswith(("_", ".")) or child.name == "__tests__":
            continue
        entries.append(Entry(
            anchor=to_kebab(child.name),
            display=child.name,
            upstream_path=f"components/{child.name}",
            is_dir=True,
        ))
    return entries


def scan_mui() -> list[Entry]:
    src = ROOT / "refs/mui/packages/mui-material/src"
    entries: list[Entry] = []
    for child in sorted(src.iterdir()):
        if not child.is_dir():
            continue
        if child.name.startswith(("_", ".")):
            continue
        entries.append(Entry(
            anchor=to_kebab(child.name),
            display=child.name,
            upstream_path=f"packages/mui-material/src/{child.name}",
            is_dir=True,
        ))
    return entries


def scan_shadcn() -> list[Entry]:
    src = ROOT / "refs/shadcn-ui/apps/v4/registry/new-york-v4/ui"
    entries: list[Entry] = []
    for child in sorted(src.iterdir()):
        if not child.is_file() or child.suffix not in {".tsx", ".ts"}:
            continue
        entries.append(Entry(
            anchor=to_kebab(child.stem),
            display=child.name,
            upstream_path=f"apps/v4/registry/new-york-v4/ui/{child.name}",
            is_dir=False,
        ))
    return entries


def scan_awesome() -> list[Entry]:
    src = ROOT / "refs/awesome-design-md/design-md"
    entries: list[Entry] = []
    for brand_dir in sorted(src.iterdir()):
        if not brand_dir.is_dir():
            continue
        files = tuple(sorted(
            f.name for f in brand_dir.iterdir() if f.suffix == ".md"
        ))
        entries.append(Entry(
            anchor=anchor_slug(brand_dir.name),
            display=brand_dir.name,
            upstream_path=f"design-md/{brand_dir.name}",
            is_dir=True,
            files=files,
        ))
    return entries


SCANNERS = {
    "ant-design": scan_ant,
    "mui": scan_mui,
    "shadcn-ui": scan_shadcn,
    "awesome-design-md": scan_awesome,
}


# ----- validation -----

def validate_entries(source: Source, entries: list[Entry]) -> None:
    if not entries:
        raise SystemExit(f"{source.key}: no entries found under {source.refs_root}")
    seen: set[str] = set()
    for entry in entries:
        if not ANCHOR_SAFE_RE.match(entry.anchor):
            raise SystemExit(
                f"{source.key}: anchor {entry.anchor!r} (from {entry.display!r}) "
                "is not a stable heading slug"
            )
        if entry.anchor in seen:
            raise SystemExit(f"{source.key}: duplicate anchor {entry.anchor!r}")
        seen.add(entry.anchor)


# ----- rendering -----

def render(source: Source, entries: list[Entry]) -> str:
    lines = [
        GENERATED_MARKER,
        "",
        f"# {source.title}",
        "",
        source.description,
        "",
        f"Generated index of `{source.refs_root}/` sources cited by the knowledge "
        "corpus. The local mirror is gitignored; every entry below links to the "
        "same path in the upstream repository.",
        "",
        f"- Upstream: [{source.upstream_repo}](https://github.com/{source.upstream_repo})",
        "- License: see the upstream repository's license file",
        f"- Local mirror: `{source.refs_root}/` "
        "(refresh with `./tools/extractors/run-all.sh`)",
        "",
        f"Entries: {len(entries)}",
    ]

    for entry in entries:
        url = upstream_url(source.upstream_repo, entry.upstream_path, is_dir=entry.is_dir)
        local = f"{source.refs_root}/{entry.upstream_path}" + ("/" if entry.is_dir else "")
        lines.extend([
            "",
            f"## {entry.anchor}",
            "",
            f"- Upstream: [`{entry.upstream_path}`]({url})",
            f"- Local mirror: `{local}`",
        ])
        if entry.files:
            file_links = ", ".join(
                f"[`{name}`]"
                f"({upstream_url(source.upstream_repo, f'{entry.upstream_path}/{name}', is_dir=False)})"
                for name in entry.files
            )
            lines.append(f"- Files: {file_links}")

    lines.append("")
    return "\n".join(lines)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for source in SOURCES:
        refs_root = ROOT / source.refs_root
        if not refs_root.exists():
            raise SystemExit(
                f"Source not found: {refs_root} — clone refs/ before running "
                "tools/extractors/reference_pages.py"
            )
        entries = SCANNERS[source.key]()
        validate_entries(source, entries)
        out_path = OUT_DIR / f"{source.key}.md"
        out_path.write_text(render(source, entries), encoding="utf-8")
        print(f"  wrote {out_path.relative_to(ROOT)} ({len(entries)} entries)")


if __name__ == "__main__":
    main()
