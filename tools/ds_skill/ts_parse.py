"""Dependency-free TypeScript/JSX fact readers.

These readers recognise a deliberately small, explicit subset of syntax. Structure
is matched on a masked copy of the source in which comments and string contents
are blanked with offsets preserved, so text inside comments, strings, and
templates can never look like an export. Literal values are then read from the
original text at the same offsets. Anything unrecognised is reported by the
caller instead of being guessed.
"""
from __future__ import annotations

import re

IDENT = r"[A-Za-z_$][A-Za-z0-9_$]*"
REEXPORT_RE = re.compile(
    r"export\s+(?P<type>type\s+)?\{(?P<names>[^}]*)\}\s*from\s*(?P<q>['\"])(?P<spec>[^'\"\n]*)(?P=q)"
)
STAR_RE = re.compile(r"export\s+\*\s+from\s*(?P<q>['\"])(?P<spec>[^'\"\n]*)(?P=q)")
LOCAL_EXPORT_RE = re.compile(
    rf"export\s+(?:declare\s+)?(?:async\s+|abstract\s+)?(?P<kind>function|const|let|class)\s+(?P<name>{IDENT})"
)
LOCAL_LIST_RE = re.compile(r"export\s+\{(?P<names>[^}]*)\}\s*(?!\s*from)(?=;|\n|$)")
UNION_ALIAS_RE = re.compile(rf"(?:export\s+)?type\s+(?P<name>{IDENT})\s*=\s*(?P<body>[^;=]+);")
LITERAL_RE = re.compile(r"""^\s*(['"])(?P<value>[^'"]*)\1\s*$""")
PROP_RE = re.compile(rf"^\s*(?:readonly\s+)?(?P<name>{IDENT})(?P<optional>\??)\s*:\s*(?P<type>[^;\s][^;]*);?\s*$")
MEMBER_START_RE = re.compile(rf"^\s*(?:readonly\s+)?(?P<name>{IDENT})\??\s*[:(]")
IMPORT_RE = re.compile(
    r"import\s+(?P<type>type\s+)?\{(?P<names>[^}]*)\}\s*from\s*(?P<q>['\"])(?P<spec>[^'\"\n]*)(?P=q)"
)
ATTR_RE = re.compile(rf"({IDENT})\s*=\s*(?:\{{\s*)?(['\"])([^'\"\n]*)\2")


def mask(text: str, strings: bool = True) -> str:
    """Blank comments (and, when requested, string contents) keeping offsets.

    Single- and double-quoted strings end at a newline, so a stray apostrophe in
    JSX text cannot hide the following lines. Template literals may span lines.
    """
    out = list(text)
    index, length, quote = 0, len(text), None
    while index < length:
        char = text[index]
        if quote:
            if char == "\\" and index + 1 < length and text[index + 1] != "\n":
                if strings:
                    out[index:index + 2] = "  "
                index += 2
                continue
            if char == quote or (char == "\n" and quote != "`"):
                quote = None
            elif strings and char != "\n":
                out[index] = " "
            index += 1
            continue
        if char in "'\"`":
            quote = char
        elif text.startswith("//", index):
            end = text.find("\n", index)
            end = length if end == -1 else end
            out[index:end] = " " * (end - index)
            index = end
            continue
        elif text.startswith("/*", index):
            index = _blank_block(text, out, index)
            continue
        index += 1
    return "".join(out)


def _blank_block(text: str, out: list[str], index: int) -> int:
    end = text.find("*/", index + 2)
    end = len(text) if end == -1 else end + 2
    out[index:end] = [c if c == "\n" else " " for c in text[index:end]]
    return end


def strip_comments(text: str) -> str:
    """Blank JS comments but keep string contents (for token references in styles)."""
    return mask(text, strings=False)


def strip_css_comments(text: str) -> str:
    """Blank only `/* */` comments; `//` is not a CSS comment (for example in URLs)."""
    out, index = list(text), 0
    while True:
        index = text.find("/*", index)
        if index == -1:
            return "".join(out)
        index = _blank_block(text, out, index)


def split_names(raw: str) -> list[tuple[str, str]]:
    """Return (exported, local) pairs from `A, B as C, type D` lists."""
    pairs: list[tuple[str, str]] = []
    for part in raw.split(","):
        part = re.sub(r"^\s*type\s+", "", part).strip()
        if not part:
            continue
        match = re.fullmatch(rf"({IDENT})(?:\s+as\s+({IDENT}))?", part)
        if match:
            local, exported = match.group(1), match.group(2) or match.group(1)
            pairs.append((exported, local))
    return pairs


def reexports(text: str) -> list[dict]:
    code = mask(text)

    def spec(match: re.Match) -> str:
        return text[match.start("spec"):match.end("spec")]

    found = [
        {"kind": "type" if m.group("type") else "named", "names": split_names(m.group("names")),
         "specifier": spec(m), "offset": m.start()}
        for m in REEXPORT_RE.finditer(code)
    ]
    found.extend({"kind": "star", "names": [], "specifier": spec(m), "offset": m.start()} for m in STAR_RE.finditer(code))
    return sorted(found, key=lambda item: item["offset"])


def local_exports(text: str) -> dict[str, int]:
    """Map value names declared and exported in this module to their offsets."""
    code = mask(text)
    names = {m.group("name"): m.start("name") for m in LOCAL_EXPORT_RE.finditer(code)}
    for match in LOCAL_LIST_RE.finditer(code):
        for exported, local in split_names(match.group("names")):
            declared = re.search(rf"(?:function|const|let|class)\s+{re.escape(local)}\b", code)
            if declared:
                names.setdefault(exported, declared.start())
    return names


def string_union_aliases(text: str) -> dict[str, list[str]]:
    """Return aliases whose whole body is a union of string literals."""
    aliases: dict[str, list[str]] = {}
    for match in UNION_ALIAS_RE.finditer(mask(text)):
        body = text[match.start("body"):match.end("body")]
        parts = [part for part in body.split("|") if part.strip()]
        literals = [LITERAL_RE.match(part) for part in parts]
        if literals and all(literals):
            aliases[match.group("name")] = [lit.group("value") for lit in literals]
    return aliases


def _block_after(code: str, open_index: int) -> tuple[int, int] | None:
    depth = 0
    for index in range(open_index, len(code)):
        depth += {"{": 1, "}": -1}.get(code[index], 0)
        if depth == 0:
            return open_index + 1, index
    return None


def props_of(text: str, type_name: str) -> tuple[list[dict], list[str]] | None:
    """Read top-level members of `interface T {}` or `type T = {}`.

    Returns (props, skipped member names) or None when the type is absent.
    """
    code = mask(text)
    header = re.search(
        rf"(?:interface\s+{re.escape(type_name)}\b[^{{]*|type\s+{re.escape(type_name)}\s*=\s*(?:[^{{;]*&\s*)?)\{{",
        code,
    )
    block = _block_after(code, header.end() - 1) if header else None
    if block is None:
        return None
    start, end = block
    aliases = string_union_aliases(text)
    props, skipped, depth, cursor = [], [], 0, start
    for masked_line in code[start:end].split("\n"):
        original = text[cursor:cursor + len(masked_line)]
        if depth == 0 and masked_line.strip():
            match = PROP_RE.match(masked_line)
            if match and "{" not in masked_line:
                props.append(_prop(PROP_RE.match(original) or match, aliases, cursor))
            elif not masked_line.lstrip().startswith(("|", "&", "}")):
                member = MEMBER_START_RE.match(masked_line)
                skipped.append(member.group("name") if member else masked_line.strip()[:40])
        depth += masked_line.count("{") - masked_line.count("}")
        cursor += len(masked_line) + 1
    return props, skipped


def _prop(match: re.Match, aliases: dict[str, list[str]], offset: int) -> dict:
    raw_type = " ".join(match.group("type").split())
    values = aliases.get(raw_type)
    if values is None:
        parts = [LITERAL_RE.match(part) for part in raw_type.split("|")]
        values = [part.group("value") for part in parts] if parts and all(parts) else None
    return {
        "name": match.group("name"),
        "optional": bool(match.group("optional")),
        "type": raw_type[:120],
        "values": values,
        "offset": offset,
    }


def named_imports(text: str, specifier: str) -> list[dict]:
    """Return value imports from exactly `specifier` with their local names and offsets."""
    imports: list[dict] = []
    for match in IMPORT_RE.finditer(mask(text)):
        if text[match.start("spec"):match.end("spec")] != specifier or match.group("type"):
            continue
        for exported, local in split_names(match.group("names")):
            imports.append({"imported": local, "local": exported, "offset": match.start()})
    return imports


def jsx_literal_props(text: str, local_name: str) -> list[dict]:
    """Return literal string props written on `<LocalName ...>` elements."""
    found: list[dict] = []
    for tag in re.finditer(rf"<{re.escape(local_name)}\b(?P<attrs>[^<>]*)>", mask(text)):
        attrs = text[tag.start("attrs"):tag.end("attrs")]
        for attr in ATTR_RE.finditer(attrs):
            found.append({"prop": attr.group(1), "value": attr.group(3), "offset": tag.start()})
        found.append({"prop": None, "value": None, "offset": tag.start()})
    return found


def nested_reexports(text: str) -> list[str]:
    """Specifiers a module re-exports itself; star-export targets do not follow them."""
    return [item["specifier"] for item in reexports(text) if item["kind"] != "type"]
