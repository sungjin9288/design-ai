"""Stage 4: render a project-local Agent Skill from the closed contract only.

Every name in the output comes from contract.json, and every interpolated value is
escaped so it stays inside its table cell or code span. The skill describes how to
use the design system; it never becomes a competing token authority, so each table
row points back to the source path and line that owns the value.
"""
from __future__ import annotations

import json
import shutil
from pathlib import Path

from common import (
    CONTRACT_FILE,
    PROVENANCE_FILE,
    SKILL_DIR,
    CompilerError,
    canonical_json,
    digest_json,
    expect_schema,
    guard_output,
    read_json,
    scoped_roots,
    sha256_bytes,
    write_json,
)
from contract import CONTRACT_SCHEMA, build_contract, load_bound_inputs
from scope import load_scope

PROVENANCE_SCHEMA = "design-ai.ds-skill.provenance/v1"


def load_current_contract(work: Path) -> dict:
    """Load contract.json and prove it still equals a rebuild from bound inputs."""
    contract = read_json(work / CONTRACT_FILE, "contract")
    expect_schema(contract, CONTRACT_SCHEMA, "contract")
    if digest_json(contract) != digest_json(build_contract(*load_bound_inputs(work))):
        raise CompilerError("contract does not match its facts; rerun the contract stage")
    return contract


def _cell(value: object) -> str:
    text = " ".join(str(value).split())
    return text.replace("|", "\\|")


def _code(value: object) -> str:
    return "`" + _cell(value).replace("`", "\\u0060") + "`"


def _props_text(props: list[dict]) -> str:
    if not props:
        return "—"
    parts = []
    for prop in props:
        name = _code(f"{prop['name']}{'?' if prop['optional'] else ''}")
        detail = " / ".join(_code(v) for v in prop["values"]) if prop["values"] else _code(prop["type"])
        parts.append(f"{name}: {detail}")
    return "<br>".join(parts)


def _where(source: dict) -> str:
    return _code(f"{source['path']}:{source['line']}")


def _import_line(component: dict) -> str:
    return _code("import { " + component["name"] + " } from " + json.dumps(component["import"]))


def render_components(contract: dict) -> str:
    package = contract["package"]["name"]
    lines = [f"# {_cell(package)} components", "", "Generated from contract.json. Do not edit by hand.", "",
             "| Component | Import | Props and allowed values | Source | Consumer usage |",
             "| --- | --- | --- | --- | --- |"]
    for c in contract["components"]:
        usage = "not measured" if c["usage"] is None else f"imports {c['usage']['imports']}, elements {c['usage']['elements']}"
        lines.append(f"| {_code(c['name'])} | {_import_line(c)} | {_props_text(c['props'])} | "
                     f"{_where(c['source'])} | {usage} |")
    lines += ["", "## Excluded or drifting names", ""]
    issues = [f"- {e['kind']} {_code(e['name'])} — excluded: {_cell(e['reason'])}" for e in contract["excluded"]]
    issues += [f"- {d['kind']} {_code(d['name'])} at {_code(d['location'])} — consumer drift, not part of the design system"
               for d in contract["drift"]]
    lines += issues or ["None."]
    return "\n".join(lines) + "\n"


def render_tokens(contract: dict) -> str:
    lines = [f"# {_cell(contract['package']['name'])} tokens", "",
             "Values are copied from the source line shown. The source file stays the authority.", "",
             "| Token | Value | Format | Source | Consumer references |", "| --- | --- | --- | --- | --- |"]
    for t in contract["tokens"]:
        usage = "not measured" if t["usage"] is None else str(t["usage"])
        lines.append(f"| {_code(t['name'])} | {_code(t['value'])} | {t['format']} | {_where(t['source'])} | {usage} |")
    if not contract["tokens"]:
        lines.append("| — | — | — | — | — |")
    return "\n".join(lines) + "\n"


def render_icons(contract: dict) -> str:
    lines = [f"# {_cell(contract['package']['name'])} icons", "", "| Icon | Asset | SHA-256 |", "| --- | --- | --- |"]
    lines += [f"| {_code(i['name'])} | {_code(i['path'])} | {_code(i['sha256'])} |" for i in contract["icons"]]
    if not contract["icons"]:
        lines.append("| — | — | — |")
    return "\n".join(lines) + "\n"


def render_skill(contract: dict) -> str:
    package = _cell(contract["package"]["name"])
    description = (f"Apply the verified {package} design-system vocabulary of components, props, tokens, and icons. "
                   f"Use when building or reviewing UI code that imports {package} or references its tokens.")
    return "\n".join([
        "---", f"name: {contract['skillName']}", f"description: {json.dumps(description)}", "---", "",
        "Open and follow [PLAYBOOK.md](PLAYBOOK.md) as the executable workflow. Load only the reference "
        "file the task needs, and complete its verification and done criteria before reporting completion.", "",
    ])


def render_playbook(contract: dict) -> str:
    package, name = _code(contract["package"]["name"]), contract["skillName"]
    return "\n".join([
        f"# {name} — playbook", "",
        f"Generated from a closed contract over verified {package} source facts. Regenerate instead of editing.", "",
        "## When to use", "",
        f"- Writing or reviewing UI that imports {package}, uses its CSS tokens, or ships its icons.",
        "- Checking whether a component, prop value, token, or icon exists before using it.", "",
        "## Inputs", "",
        "- The UI task or diff under review.",
        "- The reference file for the family the task touches.", "",
        "## Workflow", "",
        "1. Look up every component, prop value, token, and icon in the references before using it.",
        "2. Use only names listed there. Treat an unlisted name as missing, not as an invitation to invent one.",
        "3. Import components exactly as the Import column shows.",
        "4. When the design system lacks what the task needs, report the gap instead of adding a local substitute.",
        "5. Leave consumer drift listed under excluded or drifting names unchanged unless the task owns it.", "",
        "## Source files this skill reads", "",
        "- [Components](references/components.md)",
        "- [Tokens](references/tokens.md)",
        "- [Icons](references/icons.md)",
        "- [Closed contract](references/contract.json)", "",
        "## Verification phase", "",
        "- Every component, prop value, token, and icon in the change appears in the references.",
        "- Imports match the listed import path exactly.",
        "- The compiler's verify stage passes before these references are trusted after a design-system update.", "",
        "## Done when", "",
        "- The change uses only listed vocabulary, and every gap is reported instead of invented.", "",
    ])


def render_all(contract: dict) -> dict[str, str]:
    """Every generated file, keyed by its path inside the skill directory."""
    return {
        "SKILL.md": render_skill(contract),
        "PLAYBOOK.md": render_playbook(contract),
        "references/components.md": render_components(contract),
        "references/tokens.md": render_tokens(contract),
        "references/icons.md": render_icons(contract),
        "references/contract.json": canonical_json(contract),
    }


def skill_directory(work: Path, scope: dict, contract: dict) -> Path:
    """Resolve the skill directory and refuse any location outside work/skill or inside a root."""
    base = work / SKILL_DIR
    roots = scoped_roots(scope)
    if base.exists():
        guard_output(base, work, roots)
    if (base / contract["skillName"]).is_symlink():
        raise CompilerError("skill directory must not be a symbolic link")
    return guard_output(base / contract["skillName"], work, roots)


def write_skill(work: Path) -> Path:
    contract = load_current_contract(work)
    skill_dir = skill_directory(work, load_scope(work), contract)
    if skill_dir.exists():
        shutil.rmtree(skill_dir)
    files = render_all(contract)
    for relative, text in files.items():
        target = skill_dir / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(text, encoding="utf-8")
    write_json(work / PROVENANCE_FILE, {
        "schema": PROVENANCE_SCHEMA, "skillName": contract["skillName"],
        "contractDigest": digest_json(contract),
        "files": {rel: sha256_bytes(text.encode("utf-8")) for rel, text in sorted(files.items())},
    })
    return skill_dir
