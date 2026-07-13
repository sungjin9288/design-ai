#!/usr/bin/env python3
"""
Coverage report — what's covered by knowledge/, examples/, and skills/.

Output:
  - Console summary
  - knowledge/COVERAGE.md (committed; auto-regenerable)

Run after any addition to the system to keep COVERAGE.md fresh.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import tempfile
from collections import defaultdict
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

# Some canonical index entries are not standalone public specs in practice.
# They are subcomponents, aliases, or rendering primitives already covered by a
# parent worked example. Count those only when the covering spec actually exists,
# and keep the mapping explicit so coverage remains auditable.
COVERAGE_ALIASES: dict[str, str] = {
    "bottom-navigation-action": "bottom-navigation",
    "card-action-area": "card",
    "col": "grid",
    "image-list-item": "image-list",
    "image-list-item-bar": "image-list",
    "input-group": "input",
    "input-label": "input",
    "list-item-secondary-action": "list-item",
    "native-select": "select",
    "pagination-item": "pagination",
    "qrcode": "qr-code",
    "row": "grid",
    "speed-dial-icon": "speed-dial",
    "svg-icon": "icon",
    "table-pagination-actions": "table-pagination",
    "toggle-group": "toggle",
}


# --- helpers -----------------------------------------------------------------

def list_md(directory: str) -> list[Path]:
    return sorted((ROOT / directory).rglob("*.md"))


def first_line_title(path: Path) -> str:
    """Return the first H1 (# ...) or filename if none."""
    for line in path.read_text(encoding="utf-8").splitlines():
        if line.startswith("# "):
            return line[2:].strip()
    return path.stem


def parse_frontmatter(path: Path) -> dict[str, str]:
    """Parse YAML frontmatter — keys/values only, no nested."""
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---"):
        return {}
    lines = text.splitlines()
    fm: dict[str, str] = {}
    inside = False
    for line in lines[1:]:
        if line.startswith("---"):
            break
        m = re.match(r"^([a-zA-Z_]+):\s*(.+)$", line)
        if m:
            fm[m.group(1)] = m.group(2).strip()
    return fm


def is_hand_written(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    return "<!-- hand-written -->" in text


# --- coverage analysis ------------------------------------------------------

def knowledge_coverage() -> dict:
    files = list_md("knowledge")
    by_category: dict[str, list[dict]] = defaultdict(list)
    hand_written = 0
    generated = 0
    for path in files:
        rel = path.relative_to(ROOT)
        category = rel.parts[1] if len(rel.parts) > 2 else "(root)"
        hw = is_hand_written(path)
        if hw:
            hand_written += 1
        else:
            generated += 1
        title = first_line_title(path)
        line_count = len(path.read_text(encoding="utf-8").splitlines())
        by_category[category].append({
            "path": str(rel),
            "title": title,
            "lines": line_count,
            "hand_written": hw,
        })
    return {
        "by_category": dict(by_category),
        "total": len(files),
        "hand_written": hand_written,
        "generated": generated,
    }


def component_coverage() -> dict:
    """Cross-reference INDEX.json with examples/ to find which canonical
    components have a worked spec."""
    index_path = ROOT / "knowledge/components/index.json"
    if not index_path.exists():
        return {"total": 0, "with_spec": 0, "by_component": {}}
    index = json.loads(index_path.read_text(encoding="utf-8"))

    examples = list(ROOT.glob("examples/component-*.md"))
    spec_components = {p.stem.replace("component-", "") for p in examples}

    direct_matched = []
    unmatched_specs = []
    for spec in spec_components:
        if spec in index:
            direct_matched.append(spec)
        else:
            # Spec exists but isn't a canonical component name (alias?)
            unmatched_specs.append(spec)

    alias_covered = {
        canonical: covering_spec
        for canonical, covering_spec in COVERAGE_ALIASES.items()
        if canonical in index
        and canonical not in direct_matched
        and covering_spec in spec_components
    }
    alias_targets = set(alias_covered.values())
    unmatched_specs = [
        spec for spec in unmatched_specs
        if spec not in alias_targets
    ]

    matched = sorted(set(direct_matched) | set(alias_covered))
    coverage_pct = round(len(matched) / max(len(index), 1) * 100, 1)

    return {
        "total_canonical": len(index),
        "with_spec": len(matched),
        "coverage_pct": coverage_pct,
        "specs": sorted(spec_components),
        "matched": matched,
        "direct_matched": sorted(direct_matched),
        "alias_covered": dict(sorted(alias_covered.items())),
        "unmatched_specs": sorted(unmatched_specs),
    }


def skill_coverage() -> dict:
    skills = sorted([d for d in (ROOT / "skills").iterdir() if d.is_dir() and (d / "PLAYBOOK.md").exists()])
    rows = []
    for skill in skills:
        playbook = skill / "PLAYBOOK.md"
        text = playbook.read_text(encoding="utf-8")
        # Strict: require canonical heading. Any "## Verification phase ..." level-2 heading.
        # Loose fallback (only counted with a warning): any "verification" subheading.
        has_canonical_verification = bool(
            re.search(r"^##\s+Verification phase\b", text, re.MULTILINE)
        )
        has_loose_verification = bool(
            re.search(r"^#{2,4}\s+.*[Vv]erification", text, re.MULTILINE)
        )
        has_verification = has_canonical_verification
        # Track loose-only cases as a soft signal — surfaced in console output below.
        loose_only = (not has_canonical_verification) and has_loose_verification
        has_template = (skill / "TEMPLATE.md").exists()
        has_skill_md = (skill / "SKILL.md").exists()
        rows.append({
            "name": skill.name,
            "has_playbook": True,
            "has_skill_md": has_skill_md,
            "has_template": has_template,
            "has_verification": has_verification,
            "loose_only": loose_only,
            "playbook_lines": len(text.splitlines()),
        })
    return {"skills": rows, "total": len(rows)}


def example_coverage() -> dict:
    examples = sorted((ROOT / "examples").glob("*.md"))
    examples = [p for p in examples if p.name != "README.md"]
    rows = []
    for path in examples:
        rel = path.relative_to(ROOT)
        title = first_line_title(path)
        lines = len(path.read_text(encoding="utf-8").splitlines())
        rows.append({
            "path": str(rel),
            "title": title,
            "lines": lines,
        })
    return {"examples": rows, "total": len(rows)}


def extractors_from_report(text: str) -> dict:
    match = re.search(
        r"^## Extractors\s*$\n(?P<section>.*?)(?=^## |\Z)",
        text,
        re.MULTILINE | re.DOTALL,
    )
    scripts = (
        re.findall(
            r"^- `tools/extractors/([^`]+)`$",
            match.group("section"),
            re.MULTILINE,
        )
        if match
        else []
    )
    return {"total": len(scripts), "scripts": scripts}


def extractor_coverage(coverage_path: Path | None = None) -> dict:
    extractor_dir = ROOT / "tools/extractors"
    if extractor_dir.is_dir():
        scripts = sorted(extractor_dir.glob("*.py"))
        return {"total": len(scripts), "scripts": [s.name for s in scripts]}

    if coverage_path and coverage_path.exists():
        return extractors_from_report(coverage_path.read_text(encoding="utf-8"))

    return {"total": 0, "scripts": []}


# --- rendering --------------------------------------------------------------

def existing_generated_at(text: str) -> str | None:
    match = re.search(r"^generated_at:\s*(\d{4}-\d{2}-\d{2})$", text, re.MULTILINE)
    return match.group(1) if match else None


def render(report: dict, *, generated_at: str | None = None) -> str:
    generated_at = generated_at or date.today().isoformat()
    knowledge = report["knowledge"]
    components = report["components"]
    skills = report["skills"]
    examples = report["examples"]
    extractors = report["extractors"]

    out = [f"""<!-- generated by tools/audit/check-coverage.py — do not hand-edit -->
---
title: Design-AI coverage report
generated_at: {generated_at}
---

# Coverage report

> Regenerated by `python3 tools/audit/check-coverage.py`. Don't hand-edit.

## Summary

| Layer | Count | Detail |
| --- | --- | --- |
| Knowledge files | {knowledge['total']} | {knowledge['hand_written']} hand-written + {knowledge['generated']} generated |
| Skills (PLAYBOOK + SKILL) | {skills['total']} | {sum(1 for s in skills['skills'] if s['has_verification'])} with verification phase |
| Worked examples | {examples['total']} | |
| Extractors | {extractors['total']} | |
| Canonical components | {components['total_canonical']} | indexed across Ant / MUI / shadcn |
| Components with worked spec | {components['with_spec']} | **{components['coverage_pct']}% spec coverage** ({len(components.get('alias_covered', {}))} via parent/alias specs) |

## Knowledge by category

| Category | Files | Hand-written | Generated |
| --- | --- | --- | --- |
"""]

    for category in sorted(knowledge["by_category"]):
        files = knowledge["by_category"][category]
        hw = sum(1 for f in files if f["hand_written"])
        gen = len(files) - hw
        out.append(f"| `{category}` | {len(files)} | {hw} | {gen} |\n")

    out.append("\n### File details\n\n")
    for category in sorted(knowledge["by_category"]):
        out.append(f"\n#### {category}\n\n")
        out.append("| File | Lines | Type | Title |\n")
        out.append("| --- | --- | --- | --- |\n")
        for f in knowledge["by_category"][category]:
            t = "hand-written" if f["hand_written"] else "generated"
            out.append(f"| [{f['path']}](../{f['path']}) | {f['lines']} | {t} | {f['title']} |\n")

    out.append("\n## Skills\n\n")
    out.append("| Skill | Playbook | SKILL.md | Template | Verification phase | Lines |\n")
    out.append("| --- | --- | --- | --- | --- | --- |\n")
    for s in skills["skills"]:
        playbook_path = f"skills/{s['name']}/PLAYBOOK.md"
        v = "✓" if s["has_verification"] else "—"
        sm = "✓" if s["has_skill_md"] else "—"
        tmpl = "✓" if s["has_template"] else "—"
        out.append(f"| [{s['name']}](../{playbook_path}) | ✓ | {sm} | {tmpl} | {v} | {s['playbook_lines']} |\n")

    out.append("\n## Worked examples\n\n")
    out.append("| File | Lines | Title |\n")
    out.append("| --- | --- | --- |\n")
    for e in examples["examples"]:
        out.append(f"| [{e['path']}](../{e['path']}) | {e['lines']} | {e['title']} |\n")

    out.append(f"\n## Component spec coverage\n\n")
    out.append(f"**{components['with_spec']} / {components['total_canonical']} canonical components have a worked spec ({components['coverage_pct']}%)**")
    if components.get("alias_covered"):
        out.append(f" — {len(components['alias_covered'])} are covered by parent/alias specs.")
    out.append("\n\n")
    out.append("Specs that match canonical names directly:\n\n")
    for spec in components.get("direct_matched", components["matched"]):
        out.append(f"- `{spec}` → [examples/component-{spec}.md](../examples/component-{spec}.md)\n")
    if components.get("alias_covered"):
        out.append("\nCanonical components covered by parent/alias specs:\n\n")
        out.append("| Canonical component | Covering spec |\n")
        out.append("| --- | --- |\n")
        for canonical, covering_spec in components["alias_covered"].items():
            out.append(f"| `{canonical}` | [examples/component-{covering_spec}.md](../examples/component-{covering_spec}.md) |\n")
    if components["unmatched_specs"]:
        out.append("\nSpecs that don't match the canonical index and are not used as coverage aliases:\n\n")
        for spec in components["unmatched_specs"]:
            out.append(f"- `{spec}`\n")

    out.append("\n## Extractors\n\n")
    for s in extractors["scripts"]:
        out.append(f"- `tools/extractors/{s}`\n")

    out.append("\n## Refresh\n\n")
    out.append("```bash\npython3 tools/audit/check-coverage.py\n```\n")

    return "".join(out)


def render_console(report: dict) -> str:
    knowledge = report["knowledge"]
    components = report["components"]
    skills = report["skills"]
    examples = report["examples"]
    extractors = report["extractors"]

    return f"""
=== design-ai coverage ===

Knowledge:    {knowledge['total']} files ({knowledge['hand_written']} hand-written, {knowledge['generated']} generated)
Skills:       {skills['total']} ({sum(1 for s in skills['skills'] if s['has_verification'])} with verification phase)
Examples:     {examples['total']}
Extractors:   {extractors['total']}
Components:   {components['with_spec']} / {components['total_canonical']} have worked specs ({components['coverage_pct']}%, {len(components.get('alias_covered', {}))} via parent/alias specs)

Skills missing verification phase (no canonical "## Verification phase" heading):
{chr(10).join('  - ' + s['name'] for s in skills['skills'] if not s['has_verification']) or '  (none)'}

Skills with non-canonical verification heading (use "## Verification phase ..." for consistency):
{chr(10).join('  - ' + s['name'] for s in skills['skills'] if s.get('loose_only')) or '  (none)'}

Wrote: knowledge/COVERAGE.md
"""


def write_report(report: dict, out_path: Path) -> str:
    rendered = expected_report_text(report, out_path)
    out_path.write_text(rendered, encoding="utf-8")
    return rendered


def expected_report_text(report: dict, out_path: Path) -> str:
    existing = out_path.read_text(encoding="utf-8") if out_path.exists() else ""
    preserved = existing_generated_at(existing) if existing else None
    rendered = render(report, generated_at=preserved)
    if rendered != existing:
        rendered = render(report)
    return rendered


def check_report(report: dict, out_path: Path) -> bool:
    if not out_path.exists():
        return False
    existing = out_path.read_text(encoding="utf-8")
    return existing == expected_report_text(report, out_path)


def build_report(coverage_path: Path | None = None) -> dict:
    return {
        "knowledge": knowledge_coverage(),
        "components": component_coverage(),
        "skills": skill_coverage(),
        "examples": example_coverage(),
        "extractors": extractor_coverage(coverage_path),
    }


def self_test_report(*, example_title: str = "Button") -> dict:
    return {
        "knowledge": {
            "by_category": {
                "a11y": [
                    {
                        "path": "knowledge/a11y/keyboard-and-focus.md",
                        "title": "Keyboard and focus",
                        "lines": 12,
                        "hand_written": True,
                    },
                ],
            },
            "total": 1,
            "hand_written": 1,
            "generated": 0,
        },
        "components": {
            "total_canonical": 1,
            "with_spec": 1,
            "coverage_pct": 100.0,
            "specs": ["button"],
            "matched": ["button"],
            "direct_matched": ["button"],
            "alias_covered": {},
            "unmatched_specs": [],
        },
        "skills": {
            "skills": [
                {
                    "name": "component-spec-writer",
                    "has_playbook": True,
                    "has_skill_md": True,
                    "has_template": True,
                    "has_verification": True,
                    "loose_only": False,
                    "playbook_lines": 42,
                },
            ],
            "total": 1,
        },
        "examples": {
            "examples": [
                {
                    "path": "examples/component-button.md",
                    "title": example_title,
                    "lines": 24,
                },
            ],
            "total": 1,
        },
        "extractors": {
            "total": 1,
            "scripts": ["component_index.py"],
        },
    }


def assert_self_test(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f"coverage self-test failed: {message}")


def run_self_test() -> int:
    preserved_date = "1999-01-01"
    report = self_test_report()

    assert_self_test(
        existing_generated_at(render(report, generated_at=preserved_date)) == preserved_date,
        "existing_generated_at should read generated_at from coverage frontmatter",
    )
    assert_self_test(
        existing_generated_at("title: no coverage frontmatter\n") is None,
        "existing_generated_at should return None when generated_at is absent",
    )
    assert_self_test(
        extractors_from_report(render(report))["scripts"] == ["component_index.py"],
        "packaged coverage should recover the clone-only extractor inventory",
    )

    with tempfile.TemporaryDirectory(prefix="design-ai-coverage-self-test-") as tmp:
        out_path = Path(tmp) / "COVERAGE.md"
        existing = render(report, generated_at=preserved_date)
        out_path.write_text(existing, encoding="utf-8")

        rendered = write_report(report, out_path)
        assert_self_test(
            rendered == existing and out_path.read_text(encoding="utf-8") == existing,
            "write_report should preserve an unchanged report without timestamp-only churn",
        )
        assert_self_test(check_report(report, out_path), "check_report should accept unchanged content")

        before_stale_check = out_path.read_text(encoding="utf-8")
        assert_self_test(
            not check_report(self_test_report(example_title="Updated Button"), out_path),
            "check_report should reject stale content",
        )
        assert_self_test(
            out_path.read_text(encoding="utf-8") == before_stale_check,
            "check_report should not mutate stale content",
        )
        changed = write_report(self_test_report(example_title="Updated Button"), out_path)
        assert_self_test(
            existing_generated_at(changed) == date.today().isoformat(),
            "write_report should refresh generated_at when report content changes",
        )
        assert_self_test(
            "Updated Button" in changed,
            "write_report should persist changed report content",
        )

        missing_path = Path(tmp) / "missing.md"
        assert_self_test(
            not check_report(report, missing_path) and not missing_path.exists(),
            "check_report should reject a missing report without creating it",
        )

    print("Coverage self-test passed")
    return 0


# --- main -------------------------------------------------------------------

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--self-test",
        action="store_true",
        help="Run built-in timestamp preservation fixtures without touching knowledge/COVERAGE.md",
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Fail when knowledge/COVERAGE.md differs without modifying it",
    )
    args = parser.parse_args()

    if args.self_test and args.check:
        parser.error("--self-test and --check cannot be combined")
    if args.self_test:
        return run_self_test()

    out_path = ROOT / "knowledge/COVERAGE.md"
    report = build_report(out_path)
    if args.check:
        if not check_report(report, out_path):
            print(
                "knowledge/COVERAGE.md is stale; run `npm run coverage:generate` and commit the result.",
                file=sys.stderr,
            )
            return 1
        print("Coverage report check passed: knowledge/COVERAGE.md is current")
        return 0

    write_report(report, out_path)
    print(render_console(report))
    return 0


if __name__ == "__main__":
    sys.exit(main())
