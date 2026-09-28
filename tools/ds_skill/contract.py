"""Stage 3: close the generation contract over verified facts.

The contract is the only vocabulary the generator may use. It binds to the exact
facts and usage digests; a changed scope or fact file invalidates it.
"""
from __future__ import annotations

from pathlib import Path

from common import (
    CONTRACT_FILE,
    FACTS_FILE,
    USAGE_FILE,
    CompilerError,
    digest_json,
    expect_schema,
    read_json,
    write_json,
)
from facts import FACTS_SCHEMA
from scope import load_scope
from usage import USAGE_SCHEMA

CONTRACT_SCHEMA = "design-ai.ds-skill.contract/v1"
RULES = (
    "Generated references may name only the package, components, props, values, tokens, icons, and paths listed here.",
    "Unresolved source and consumer drift stay excluded; they are reported, never guessed.",
    "The design-system source remains the token authority; generated references are derived and must not be edited by hand.",
)


def load_bound_inputs(work: Path) -> tuple[dict, dict, dict | None]:
    """Load scope, facts, and optional usage, refusing any broken digest link."""
    scope = load_scope(work)
    facts = read_json(work / FACTS_FILE, "facts")
    expect_schema(facts, FACTS_SCHEMA, "facts")
    if facts.get("scopeDigest") != digest_json(scope):
        raise CompilerError("facts were extracted under a different scope; rerun the facts stage")
    usage = None
    if scope.get("consumer"):
        usage = read_json(work / USAGE_FILE, "usage")
        expect_schema(usage, USAGE_SCHEMA, "usage")
        if usage.get("factsDigest") != digest_json(facts):
            raise CompilerError("usage was measured against different facts; rerun the facts stage")
    return scope, facts, usage


def _component_entry(component: dict, package: str, usage: dict | None) -> dict:
    measured = (usage or {}).get("components", {}).get(component["name"])
    return {
        "name": component["name"],
        "import": package,
        "source": {"path": component["source"]["path"], "line": component["source"]["line"]},
        "props": [
            {"name": p["name"], "optional": p["optional"], "values": p["values"],
             "type": None if p["values"] else p["type"]}
            for p in component["props"]
        ],
        "usage": None if usage is None else {
            "imports": measured["imports"] if measured else 0,
            "elements": measured["elements"] if measured else 0,
        },
    }


def build_contract(scope: dict, facts: dict, usage: dict | None) -> dict:
    package = facts["package"]["name"]
    if not facts["components"] and not facts["tokens"]:
        raise CompilerError("no verified component or token facts; widen the scope or fix the entry")
    return {
        "schema": CONTRACT_SCHEMA,
        "skillName": scope["skillName"],
        "factsDigest": digest_json(facts),
        "usageDigest": digest_json(usage) if usage is not None else None,
        "package": {"name": package, "version": facts["package"]["version"], "exports": facts["package"]["exports"]},
        "components": [_component_entry(c, package, usage) for c in facts["components"]],
        "tokens": [
            {"name": t["name"], "value": t["value"], "format": t["format"],
             "source": {"path": t["source"]["path"], "line": t["source"]["line"]},
             "usage": None if usage is None else usage["tokens"].get(t["name"], 0)}
            for t in facts["tokens"]
        ],
        "icons": [{"name": i["name"], "path": i["path"], "sha256": i["sha256"]} for i in facts["icons"]],
        "excluded": facts["unresolved"],
        "drift": [] if usage is None else usage["drift"],
        "rules": list(RULES),
    }


def write_contract(work: Path) -> Path:
    scope, facts, usage = load_bound_inputs(work)
    target = work / CONTRACT_FILE
    write_json(target, build_contract(scope, facts, usage))
    return target
