"""Small Markdown contract helpers shared by repository audits."""
from __future__ import annotations

import re


def split_frontmatter(text: str) -> tuple[dict[str, object] | None, str]:
    """Parse flat YAML frontmatter and return it with the remaining Markdown body."""
    lines = text.splitlines()
    cursor = 0

    while cursor < len(lines):
        stripped = lines[cursor].strip()
        if stripped.startswith("<!--") and stripped.endswith("-->"):
            cursor += 1
            continue
        if not stripped:
            cursor += 1
            continue
        break

    if cursor >= len(lines) or lines[cursor].strip() != "---":
        return None, text

    frontmatter_lines: list[str] = []
    closing_index: int | None = None
    for index in range(cursor + 1, len(lines)):
        line = lines[index]
        if line.strip() == "---":
            closing_index = index
            break
        frontmatter_lines.append(line)

    if not frontmatter_lines or closing_index is None:
        return None, text

    frontmatter: dict[str, object] = {}
    current_list_key: str | None = None
    for line in frontmatter_lines:
        stripped = line.rstrip()
        if not stripped:
            current_list_key = None
            continue

        if current_list_key and stripped.lstrip().startswith("-"):
            item = stripped.lstrip()[1:].strip()
            if item:
                frontmatter[current_list_key] = list(frontmatter.get(current_list_key, [])) + [item]
            continue

        match = re.match(r"^([a-zA-Z_]+):\s*(.*)$", stripped)
        if not match:
            continue

        key, value = match.group(1), match.group(2).strip()
        if value == "":
            current_list_key = key
            frontmatter[key] = []
        elif value.startswith("[") and value.endswith("]"):
            inner = value[1:-1]
            frontmatter[key] = [
                item.strip().strip("\"'")
                for item in inner.split(",")
                if item.strip()
            ]
            current_list_key = None
        else:
            frontmatter[key] = value.strip().strip("\"'")
            current_list_key = None

    body = "\n".join(lines[closing_index + 1:]).lstrip("\n")
    return frontmatter, body


def parse_frontmatter(text: str) -> dict[str, object] | None:
    """Return parsed flat YAML frontmatter, or ``None`` when it is absent."""
    frontmatter, _ = split_frontmatter(text)
    return frontmatter


def markdown_headings(text: str, level: int | None = None) -> list[str]:
    """Return Markdown ATX heading text, optionally restricted to one level."""
    if level is None:
        pattern = r"^#{1,6}\s+(.+?)\s*$"
    else:
        pattern = rf"^#{{{level}}}\s+(.+?)\s*$"
    return [match.group(1).strip() for match in re.finditer(pattern, text, re.MULTILINE)]
