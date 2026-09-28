"""Stage 2: extract verified facts from the scoped design-system source.

A fact is recorded only when its name, value, and source line were read from a
file inside a declared directory. Public components come from the declared entry;
anything the readers cannot resolve is kept in `unresolved` with a reason.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

import ts_parse
from common import (
    FACTS_FILE,
    CompilerError,
    digest_json,
    is_within,
    line_of,
    read_source,
    relative_posix,
    walk_files,
    write_json,
)
from scope import load_scope

FACTS_SCHEMA = "design-ai.ds-skill.facts/v1"
MODULE_SUFFIXES = (".ts", ".tsx", "/index.ts", "/index.tsx")
CSS_PROPERTY_RE = re.compile(r"(?P<name>--[A-Za-z0-9_-]+)\s*:\s*(?P<value>[^;{}]+);")
JSON_TOKEN_RE = re.compile(r'"(?:[^"\\]|\\.)*"|[{}\[\]:,]')


def _source(path: str, line: int, ledger: dict[str, dict]) -> dict:
    return {"path": path, "line": line, "sha256": ledger[path]["sha256"]}


def _issue(kind: str, name: str, reason: str) -> dict:
    return {"kind": kind, "name": name, "reason": reason}


def _resolve_module(root: Path, importer: Path, specifier: str, allowed: list[Path]) -> Path | None:
    if not specifier.startswith("."):
        return None
    base = (importer.parent / specifier).resolve()
    for suffix in ("", *MODULE_SUFFIXES):
        candidate = Path(str(base) + suffix)
        if candidate.is_file() and is_within(candidate.resolve(), root):
            if any(is_within(candidate.resolve(), directory) for directory in allowed):
                return candidate.resolve()
    return None


def _package_facts(root: Path, ledger: dict[str, dict]) -> dict:
    text = read_source(root, root / "package.json", ledger)
    try:
        manifest = json.loads(text)
    except json.JSONDecodeError as error:
        raise CompilerError(f"package.json is not valid JSON: {error}") from error
    name, version = manifest.get("name"), manifest.get("version")
    if not isinstance(name, str) or not name:
        raise CompilerError("package.json must declare a package name")
    exports = manifest.get("exports")
    subpaths = sorted(exports) if isinstance(exports, dict) and all(k.startswith(".") for k in exports) else ["."]
    return {"name": name, "version": version if isinstance(version, str) else None,
            "exports": subpaths, "source": _source("package.json", 1, ledger)}


def _component(root: Path, name: str, module: Path, ledger: dict[str, dict]) -> tuple[dict | None, list[dict]]:
    """Return one component fact (or None) plus the issues found while reading it."""
    text = read_source(root, module, ledger)
    path = relative_posix(root, module)
    declared = ts_parse.local_exports(text)
    if name not in declared:
        return None, [_issue("component", name, f"no exported function, const, or class named {name} in {path}")]
    props, skipped = ts_parse.props_of(text, f"{name}Props") or ([], [])
    fact = {
        "name": name,
        "source": _source(path, line_of(text, declared[name]), ledger),
        "props": [
            {"name": p["name"], "optional": p["optional"], "type": p["type"], "values": p["values"],
             "line": line_of(text, p["offset"])}
            for p in props
        ],
    }
    issues = [_issue("prop", f"{name}.{member}", f"unsupported or multi-line member in {name}Props")
              for member in skipped]
    return fact, issues


def _star_targets(root: Path, module: Path, specifier: str, ledger: dict[str, dict]) -> tuple[list, list]:
    text = read_source(root, module, ledger)
    issues = [_issue("export", f"{specifier} -> {nested}", "nested re-export inside a star-exported module is not followed")
              for nested in ts_parse.nested_reexports(text)]
    return [(name, module, "") for name in sorted(ts_parse.local_exports(text))], issues


def _entry_exports(root: Path, entry: Path, allowed: list[Path], ledger: dict[str, dict]) -> tuple[list, list]:
    text = read_source(root, entry, ledger)
    targets: list[tuple[str, Path | None, str]] = []
    issues: list[dict] = []
    for item in ts_parse.reexports(text):
        if item["kind"] == "type":
            continue
        module = _resolve_module(root, entry, item["specifier"], allowed)
        if item["kind"] == "star":
            if module is None:
                issues.append(_issue("export", item["specifier"], "star export outside the declared component directories"))
                continue
            star_targets, star_issues = _star_targets(root, module, item["specifier"], ledger)
            targets.extend(star_targets)
            issues.extend(star_issues)
            continue
        for exported, local in item["names"]:
            if exported != local:
                targets.append((exported, None, f"renamed export {local} as {exported}"))
            else:
                reason = "" if module else f"module {item['specifier']} is outside the declared component directories"
                targets.append((exported, module, reason))
    targets.extend((name, entry, "") for name in sorted(ts_parse.local_exports(text)))
    components, unresolved = _collect(root, targets, ledger)
    return components, issues + unresolved


def _collect(root: Path, targets: list, ledger: dict[str, dict]) -> tuple[list, list]:
    components, unresolved = [], []
    for name, module, reason in targets:
        if not name[:1].isupper():
            continue
        if module is None:
            unresolved.append(_issue("component", name, reason))
            continue
        fact, issues = _component(root, name, module, ledger)
        unresolved.extend(issues)
        if fact is not None:
            components.append(fact)
    return sorted(components, key=lambda c: c["name"]), unresolved


def _css_tokens(root: Path, path: Path, ledger: dict[str, dict]) -> tuple[list, list]:
    text = read_source(root, path, ledger)
    code = ts_parse.strip_css_comments(text)
    relative = relative_posix(root, path)
    tokens = [
        {"name": m.group("name"), "value": " ".join(m.group("value").split()), "format": "css-custom-property",
         "source": _source(relative, line_of(text, m.start()), ledger)}
        for m in CSS_PROPERTY_RE.finditer(code)
    ]
    return tokens, []


def json_key_lines(text: str) -> dict[tuple[str, ...], int]:
    """Map every object key path to the line where that key is written."""
    lines: dict[tuple[str, ...], int] = {}
    stack: list[list] = []  # [bracket, current key, key path of this container]
    previous_string = None
    for match in JSON_TOKEN_RE.finditer(text):
        token = match.group(0)
        if token in ("{", "["):
            parent = stack[-1] if stack else None
            path = () if parent is None else parent[2] + ((parent[1],) if parent[0] == "{" else ())
            stack.append([token, None, path])
        elif token in ("}", "]") and stack:
            stack.pop()
        elif token == ":" and stack and previous_string is not None:
            key = json.loads(previous_string[0])
            stack[-1][1] = key
            lines[(*stack[-1][2], key)] = line_of(text, previous_string[1])
        previous_string = (token, match.start()) if token.startswith('"') else None
    return lines


def _json_tokens(root: Path, path: Path, ledger: dict[str, dict]) -> tuple[list, list]:
    text = read_source(root, path, ledger)
    relative = relative_posix(root, path)
    try:
        tree = json.loads(text)
    except json.JSONDecodeError as error:
        raise CompilerError(f"token file {relative} is not valid JSON: {error}") from error
    key_lines, tokens, issues = json_key_lines(text), [], []

    def visit(node: object, trail: tuple[str, ...]) -> None:
        if isinstance(node, dict) and "$value" in node:
            name, value = ".".join(trail), node["$value"]
            if isinstance(value, (str, int, float)) and not isinstance(value, bool):
                tokens.append({"name": name, "value": str(value), "format": "dtcg-json",
                               "source": _source(relative, key_lines.get(trail, 1), ledger)})
            else:
                issues.append(_issue("token", name, f"composite DTCG value in {relative} is not supported"))
        elif isinstance(node, dict):
            for key in sorted(node):
                if not key.startswith("$"):
                    visit(node[key], (*trail, key))

    visit(tree, ())
    return tokens, issues


def _tokens(root: Path, directories: list[Path], ledger: dict[str, dict]) -> tuple[list, list]:
    tokens, unresolved, seen = [], [], {}
    for directory in directories:
        for path in walk_files(root, directory, (".css", ".json")):
            reader = _css_tokens if path.suffix == ".css" else _json_tokens
            found, issues = reader(root, path, ledger)
            unresolved.extend(issues)
            for token in found:
                previous = seen.get(token["name"])
                if previous and previous["value"] != token["value"]:
                    unresolved.append(_issue("token", token["name"],
                                             f"conflicting values in {previous['source']['path']} and {token['source']['path']}"))
                elif not previous:
                    seen[token["name"]] = token
                    tokens.append(token)
    conflicted = {item["name"] for item in unresolved if item["kind"] == "token"}
    return sorted((t for t in tokens if t["name"] not in conflicted), key=lambda t: t["name"]), unresolved


def _icons(root: Path, directories: list[Path], ledger: dict[str, dict]) -> list[dict]:
    icons = []
    for directory in directories:
        for path in walk_files(root, directory, (".svg",)):
            read_source(root, path, ledger)
            relative = relative_posix(root, path)
            icons.append({"name": path.stem, "path": relative, "sha256": ledger[relative]["sha256"]})
    return sorted(icons, key=lambda icon: icon["path"])


def extract_facts(scope: dict) -> dict:
    ds = scope["designSystem"]
    root = Path(ds["root"]).resolve()
    ledger: dict[str, dict] = {}
    package = _package_facts(root, ledger)
    entry = (root / ds["entry"]).resolve()
    allowed = [(root / d).resolve() for d in ds["components"]]
    components, unresolved = _entry_exports(root, entry, allowed, ledger)
    tokens, token_issues = _tokens(root, [(root / d).resolve() for d in ds["tokens"]], ledger)
    icons = _icons(root, [(root / d).resolve() for d in ds["icons"]], ledger)
    return {
        "schema": FACTS_SCHEMA,
        "scopeDigest": digest_json(scope),
        "package": package,
        "components": components,
        "tokens": tokens,
        "icons": icons,
        "unresolved": sorted(unresolved + token_issues, key=lambda i: (i["kind"], i["name"], i["reason"])),
        "files": [ledger[key] for key in sorted(ledger)],
    }


def write_facts(work: Path) -> Path:
    facts = extract_facts(load_scope(work))
    target = work / FACTS_FILE
    write_json(target, facts)
    return target
