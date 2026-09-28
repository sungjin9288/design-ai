"""Stage 5: mechanically verify the generated skill against source and contract.

The chain is closed end to end: the source is re-extracted and must equal the
stored facts and usage, the contract must equal a rebuild from those facts, and
every generated file must equal a fresh render of the contract. Each check reports
its own failures; a missing or unreadable input is a failure, never a pass.
"""
from __future__ import annotations

import importlib.util
import json
import re
import sys
from pathlib import Path

from common import (
    FACTS_FILE,
    PROVENANCE_FILE,
    USAGE_FILE,
    VERIFY_FILE,
    CompilerError,
    digest_json,
    read_json,
    resolve_inside,
    sha256_bytes,
    write_json,
)
from facts import extract_facts
from generate import load_current_contract, render_all, skill_directory
from scope import load_scope
from usage import extract_usage

VERIFY_SCHEMA = "design-ai.ds-skill.verify/v1"
AUDIT_DIR = Path(__file__).resolve().parents[1] / "audit"
CHECK_IDS = ("digest-chain", "source-reextraction", "fact-anchors", "provenance",
             "rendered-from-contract", "agent-skill-contract")


def _load_skill_validator():
    sys.path.insert(0, str(AUDIT_DIR))
    spec = importlib.util.spec_from_file_location("skill_contracts", AUDIT_DIR / "skill-contracts.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.validate_skill_directory


def _names(facts: dict) -> set[str]:
    return ({f"component {c['name']}" for c in facts["components"]} | {f"token {t['name']}={t['value']}" for t in facts["tokens"]}
            | {f"icon {i['path']}" for i in facts["icons"]} | {f"unresolved {u['name']}" for u in facts["unresolved"]})


def _difference(label: str, stored: dict, fresh: dict) -> list[str]:
    if digest_json(stored) == digest_json(fresh):
        return []
    stored_files = {f["path"]: f["sha256"] for f in stored.get("files", [])}
    fresh_files = {f["path"]: f["sha256"] for f in fresh.get("files", [])}
    failures = [f"{label}: {path} changed, added, or removed since extraction"
                for path in sorted(set(stored_files) | set(fresh_files)) if stored_files.get(path) != fresh_files.get(path)]
    if "components" in stored:
        failures += [f"{label}: stored only: {n}" for n in sorted(_names(stored) - _names(fresh))]
        failures += [f"{label}: source only: {n}" for n in sorted(_names(fresh) - _names(stored))]
    return failures or [f"{label}: stored file differs from a fresh extraction"]


def check_reextraction(work: Path, scope: dict) -> list[str]:
    """Re-read the scoped source and require byte-identical facts and usage."""
    stored = read_json(work / FACTS_FILE, "facts")
    fresh = extract_facts(scope)
    failures = _difference("facts", stored, fresh)
    if scope.get("consumer"):
        failures += _difference("usage", read_json(work / USAGE_FILE, "usage"), extract_usage(scope, fresh))
    return failures


def _line(root: Path, source: dict) -> str:
    try:
        path = resolve_inside(root, source["path"], "recorded source path")
        return path.read_text(encoding="utf-8").splitlines()[source["line"] - 1]
    except (CompilerError, OSError, IndexError, UnicodeDecodeError):
        return ""


def check_anchors(root: Path, contract: dict) -> list[str]:
    failures = []
    for c in contract["components"]:
        if not re.search(rf"\b{re.escape(c['name'])}\b", _line(root, c["source"])):
            failures.append(f"component {c['name']} not found at {c['source']['path']}:{c['source']['line']}")
    for t in contract["tokens"]:
        line = _line(root, t["source"])
        if t["format"] == "css-custom-property":
            matched = t["name"] in line and t["value"] in " ".join(line.split())
        else:
            matched = json.dumps(t["name"].split(".")[-1]) in line
        if not matched:
            failures.append(f"token {t['name']} does not match {t['source']['path']}:{t['source']['line']}")
    for icon in contract["icons"]:
        try:
            path = resolve_inside(root, icon["path"], "icon path")
        except CompilerError as error:
            failures.append(str(error))
            continue
        if not path.is_file() or sha256_bytes(path.read_bytes()) != icon["sha256"]:
            failures.append(f"icon {icon['name']} asset is missing or changed: {icon['path']}")
    return failures


def _actual_files(skill_dir: Path) -> set[str]:
    return {p.relative_to(skill_dir).as_posix() for p in skill_dir.rglob("*") if p.is_file() or p.is_symlink()}


def check_provenance(work: Path, contract: dict, skill_dir: Path) -> list[str]:
    provenance = read_json(work / PROVENANCE_FILE, "provenance")
    failures = []
    if provenance.get("contractDigest") != digest_json(contract):
        failures.append("provenance is bound to a different contract")
    expected = provenance.get("files", {})
    for extra in sorted(_actual_files(skill_dir) - set(expected)):
        failures.append(f"{extra}: not produced by the generator")
    for relative, digest in sorted(expected.items()):
        path = skill_dir / relative
        if not path.is_file() or path.is_symlink():
            failures.append(f"{relative}: missing")
        elif sha256_bytes(path.read_bytes()) != digest:
            failures.append(f"{relative}: edited after generation")
    return failures


def check_rendered(contract: dict, skill_dir: Path) -> list[str]:
    """Every file must equal a fresh render of the contract, so no text can exist outside it."""
    expected = render_all(contract)
    failures = [f"{extra}: not rendered from the contract" for extra in sorted(_actual_files(skill_dir) - set(expected))]
    for relative, text in sorted(expected.items()):
        path = skill_dir / relative
        if not path.is_file() or path.is_symlink():
            failures.append(f"{relative}: missing")
        elif path.read_text(encoding="utf-8") != text:
            failures.append(f"{relative}: differs from the contract rendering")
    return failures


def run_checks(work: Path) -> dict:
    checks: list[dict] = []

    def record(check_id: str, action) -> object:
        try:
            result = action()
        except (CompilerError, OSError, KeyError, TypeError, ValueError, json.JSONDecodeError) as error:
            checks.append({"id": check_id, "status": "fail", "failures": [str(error)]})
            return None
        failures = result if isinstance(result, list) else []
        checks.append({"id": check_id, "status": "fail" if failures else "pass", "failures": failures})
        return result

    def chain() -> tuple[dict, dict, Path]:
        contract = load_current_contract(work)
        scope = load_scope(work)
        return contract, scope, skill_directory(work, scope, contract)

    bound = record("digest-chain", chain)
    contract = bound[0] if bound else None
    if bound:
        _, scope, skill_dir = bound
        root = Path(scope["designSystem"]["root"])
        record("source-reextraction", lambda: check_reextraction(work, scope))
        record("fact-anchors", lambda: check_anchors(root, contract))
        record("provenance", lambda: check_provenance(work, contract, skill_dir))
        record("rendered-from-contract", lambda: check_rendered(contract, skill_dir))
        validate = _load_skill_validator()
        record("agent-skill-contract", lambda: validate(skill_dir, work))
    complete = [c["id"] for c in checks] == list(CHECK_IDS)
    status = "pass" if complete and all(c["status"] == "pass" for c in checks) else "fail"
    return {"schema": VERIFY_SCHEMA, "status": status,
            "contractDigest": digest_json(contract) if isinstance(contract, dict) else None, "checks": checks}


def write_verify(work: Path) -> dict:
    report = run_checks(work)
    write_json(work / VERIFY_FILE, report)
    return report
