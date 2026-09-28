"""Stage 2b: measure how the optional consumer repository uses the design system.

Usage is evidence about the consumer, not a design-system authority. Imports,
literal prop values, and token references that do not match a verified fact are
reported as drift; they never enter the closed contract.
"""
from __future__ import annotations

import json
import os
import re
from pathlib import Path

import ts_parse
from common import USAGE_FILE, digest_json, line_of, read_source, relative_posix, walk_files, write_json

USAGE_SCHEMA = "design-ai.ds-skill.usage/v1"
CODE_SUFFIXES = (".ts", ".tsx", ".js", ".jsx")
STYLE_SUFFIXES = (".css", ".scss")
TOKEN_REF_RE = re.compile(r"var\(\s*(--[A-Za-z0-9_-]+)")
MAX_LABEL = 60


def safe_label(value: str) -> str:
    """Render consumer-controlled text as one inert line: escaped, no backticks or pipes, bounded."""
    escaped = json.dumps(value, ensure_ascii=False)[1:-1].replace("`", "\\u0060").replace("|", "\\u007c")
    return escaped if len(escaped) <= MAX_LABEL else escaped[: MAX_LABEL - 1] + "…"


def token_prefix(names: list[str]) -> str | None:
    """Longest shared `--segment-` prefix of the CSS token names, if any."""
    css = [name for name in names if name.startswith("--")]
    if not css:
        return None
    prefix = os.path.commonprefix(css)
    cut = prefix.rfind("-")
    return prefix[: cut + 1] if cut > 2 else None


def _code_usage(root: Path, path: Path, facts: dict, ledger: dict, report: dict) -> None:
    text = read_source(root, path, ledger)
    relative = safe_label(relative_posix(root, path))
    known = {c["name"]: c for c in facts["components"]}
    for item in ts_parse.named_imports(text, facts["package"]["name"]):
        location = f"{relative}:{line_of(text, item['offset'])}"
        component = known.get(item["imported"])
        if component is None:
            report["drift"].append({"kind": "unknown-import", "name": item["imported"], "location": location})
            continue
        entry = report["components"].setdefault(item["imported"], {"imports": 0, "elements": 0, "propValues": {}})
        entry["imports"] += 1
        _element_usage(text, relative, item["local"], component, entry, report)


def _element_usage(text: str, relative: str, local: str, component: dict, entry: dict, report: dict) -> None:
    allowed = {p["name"]: p["values"] for p in component["props"]}
    for use in ts_parse.jsx_literal_props(text, local):
        if use["prop"] is None:
            entry["elements"] += 1
            continue
        values = entry["propValues"].setdefault(use["prop"], {})
        values[use["value"]] = values.get(use["value"], 0) + 1
        expected = allowed.get(use["prop"])
        if expected is not None and use["value"] not in expected:
            report["drift"].append({
                "kind": "unknown-prop-value", "name": f"{component['name']}.{use['prop']}={safe_label(use['value'])}",
                "location": f"{relative}:{line_of(text, use['offset'])}",
            })


def _style_usage(root: Path, path: Path, facts: dict, prefix: str | None, ledger: dict, report: dict) -> None:
    text = read_source(root, path, ledger)
    known = {t["name"] for t in facts["tokens"]}
    relative = safe_label(relative_posix(root, path))
    code = ts_parse.strip_css_comments(text) if path.suffix == ".css" else ts_parse.strip_comments(text)
    for match in TOKEN_REF_RE.finditer(code):
        name = match.group(1)
        if name in known:
            report["tokens"][name] = report["tokens"].get(name, 0) + 1
        elif prefix and name.startswith(prefix):
            report["drift"].append({"kind": "unknown-token", "name": name,
                                    "location": f"{relative}:{line_of(text, match.start())}"})


def extract_usage(scope: dict, facts: dict) -> dict | None:
    consumer = scope.get("consumer")
    if not consumer:
        return None
    root = Path(consumer["root"]).resolve()
    prefix = token_prefix([t["name"] for t in facts["tokens"]])
    ledger: dict[str, dict] = {}
    report: dict = {"components": {}, "tokens": {}, "drift": []}
    for relative in consumer["sources"]:
        directory = (root / relative).resolve()
        for path in walk_files(root, directory, CODE_SUFFIXES + STYLE_SUFFIXES):
            if path.suffix in CODE_SUFFIXES:
                _code_usage(root, path, facts, ledger, report)
                _style_usage(root, path, facts, prefix, ledger, report)
            else:
                _style_usage(root, path, facts, prefix, ledger, report)
    return {
        "schema": USAGE_SCHEMA,
        "scopeDigest": facts["scopeDigest"],
        "factsDigest": digest_json(facts),
        "components": {name: report["components"][name] for name in sorted(report["components"])},
        "tokens": {name: report["tokens"][name] for name in sorted(report["tokens"])},
        "drift": sorted(report["drift"], key=lambda d: (d["location"], d["kind"], d["name"])),
        "files": [ledger[key] for key in sorted(ledger)],
    }


def write_usage(work: Path, scope: dict, facts: dict) -> Path | None:
    usage = extract_usage(scope, facts)
    target = work / USAGE_FILE
    if usage is None:
        if target.exists():
            target.unlink()
        return None
    write_json(target, usage)
    return target
