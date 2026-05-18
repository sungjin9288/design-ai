#!/usr/bin/env python3
"""
Verify release metadata before tagging.

This keeps the release checklist's manual version / changelog / roadmap scan
from drifting away from the actual package metadata and audit runner.

Usage:
  python3 tools/audit/release-metadata.py
  python3 tools/audit/release-metadata.py --json
  python3 tools/audit/release-metadata.py --self-test
"""
from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PACKAGE_JSON = ROOT / "package.json"
PLUGIN_JSON = ROOT / ".claude-plugin" / "plugin.json"
CHANGELOG = ROOT / "CHANGELOG.md"
ROADMAP = ROOT / "docs" / "ROADMAP.md"
RUN_ALL = ROOT / "tools" / "audit" / "run-all.py"

CHANGELOG_HEADER_RE = re.compile(
    r"^## v(?P<version>\d+\.\d+\.\d+) — (?P<title>.+?) "
    r"\((?P<date>\d{4}-(?P<month>\d{2}))\)\s*$",
    re.MULTILINE,
)
ROADMAP_HEADER_RE = re.compile(r"^## Phase .*\(v(?P<version>\d+\.\d+\.\d+)\).*$", re.MULTILINE)
VERSION_BUMP_RE = re.compile(
    r"`package\.json`\s+\+\s+`\.claude-plugin/plugin\.json`:\s+"
    r"(?P<from>\d+\.\d+\.\d+)\s+→\s+(?P<to>\d+\.\d+\.\d+)"
)
AUDIT_COUNT_RE = re.compile(r"\bAll\s+(?P<count>\d+)\s+audits?\s+pass(?:ed)?\b", re.IGNORECASE)
AUDIT_SCRIPT_RE = re.compile(r'script="([^"]+\.py)"')


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def load_audit_count(text: str | None = None) -> int:
    run_all_text = text if text is not None else RUN_ALL.read_text(encoding="utf-8")
    match = re.search(
        r"AUDITS: tuple\[AuditSpec, \.\.\.\] = \(\n(?P<body>.*?)\n\)\n\n\n@dataclass",
        run_all_text,
        re.DOTALL,
    )
    if not match:
        raise SystemExit("failed to locate AUDITS tuple in tools/audit/run-all.py")
    scripts = AUDIT_SCRIPT_RE.findall(match.group("body"))
    if not scripts:
        raise SystemExit("failed to locate audit script list in tools/audit/run-all.py")
    return len(scripts)


def first_changelog_entry(changelog_text: str) -> tuple[re.Match[str] | None, str]:
    match = CHANGELOG_HEADER_RE.search(changelog_text)
    if not match:
        return None, ""

    next_match = CHANGELOG_HEADER_RE.search(changelog_text, match.end())
    end = next_match.start() if next_match else len(changelog_text)
    return match, changelog_text[match.start():end]


def roadmap_entry_for_version(roadmap_text: str, version: str) -> str:
    for match in ROADMAP_HEADER_RE.finditer(roadmap_text):
        if match.group("version") != version:
            continue
        next_match = ROADMAP_HEADER_RE.search(roadmap_text, match.end())
        end = next_match.start() if next_match else len(roadmap_text)
        return roadmap_text[match.start():end]
    return ""


def validate_month(month: str) -> bool:
    return 1 <= int(month) <= 12


def audit_count_errors(label: str, entry: str, expected_count: int) -> list[str]:
    errors: list[str] = []
    mentions = [(int(match.group("count")), match.group(0)) for match in AUDIT_COUNT_RE.finditer(entry)]
    if not mentions:
        return [f"{label} is missing an audit-count verification statement"]

    for count, phrase in mentions:
        if count != expected_count:
            errors.append(f"{label} audit count mismatch: {phrase} != All {expected_count} audits pass")
    return errors


def required_section_errors(label: str, entry: str, sections: tuple[str, ...]) -> list[str]:
    return [f"{label} is missing required section: {section}" for section in sections if section not in entry]


def release_metadata_summary(
    *,
    package_json: dict,
    plugin_json: dict,
    changelog_text: str,
    roadmap_text: str,
    audit_count: int,
) -> dict:
    errors: list[str] = []
    version = package_json.get("version")
    plugin_version = plugin_json.get("version")

    if not isinstance(version, str) or not version:
        errors.append("package.json version is missing")
        version = ""
    if plugin_version != version:
        errors.append(f"plugin manifest version mismatch: {plugin_version} != {version}")

    changelog_match, changelog_entry = first_changelog_entry(changelog_text)
    changelog_version = changelog_match.group("version") if changelog_match else None
    changelog_date = changelog_match.group("date") if changelog_match else None
    if not changelog_match:
        errors.append("CHANGELOG.md top entry is missing a vX.Y.Z release heading")
    else:
        if changelog_version != version:
            errors.append(f"CHANGELOG.md top version mismatch: {changelog_version} != {version}")
        if not validate_month(changelog_match.group("month")):
            errors.append(f"CHANGELOG.md top release month is invalid: {changelog_date}")

    if changelog_entry:
        errors.extend(
            required_section_errors(
                "CHANGELOG.md top entry",
                changelog_entry,
                ("### Verified", "### Versions", "### What this enables"),
            )
        )
        version_bump = VERSION_BUMP_RE.search(changelog_entry)
        if not version_bump:
            errors.append("CHANGELOG.md top entry is missing package/plugin version bump line")
        elif version_bump.group("to") != version:
            errors.append(
                "CHANGELOG.md top entry version bump target mismatch: "
                f"{version_bump.group('to')} != {version}"
            )
        errors.extend(audit_count_errors("CHANGELOG.md top entry", changelog_entry, audit_count))

    roadmap_entry = roadmap_entry_for_version(roadmap_text, version)
    if not roadmap_entry:
        errors.append(f"docs/ROADMAP.md is missing a current release entry for v{version}")
    else:
        errors.extend(
            required_section_errors(
                "docs/ROADMAP.md current entry",
                roadmap_entry,
                ("### Verified", "### Versions", "### What this enables", "### What's still ahead"),
            )
        )
        errors.extend(audit_count_errors("docs/ROADMAP.md current entry", roadmap_entry, audit_count))

    return {
        "version": version,
        "plugin_version": plugin_version,
        "changelog_version": changelog_version,
        "changelog_date": changelog_date,
        "roadmap_entry_found": bool(roadmap_entry),
        "audit_count": audit_count,
        "errors": errors,
    }


def assert_condition(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f"self-test failed: {message}")


def run_self_test() -> int:
    package_json = {"version": "1.2.3"}
    plugin_json = {"version": "1.2.3"}
    changelog = """# Changelog

## v1.2.3 — Fixture release (2026-05)

### Verified
- All 8 audits pass.

### Versions
- `package.json` + `.claude-plugin/plugin.json`: 1.2.2 → 1.2.3.

### What this enables
- Fixture release metadata can be verified.

## v1.2.2 — Previous release (2026-04)
"""
    roadmap = """# Roadmap

## Phase 99 — Fixture release (v1.2.3) ✓ shipped

### Versions
- `package.json` + `.claude-plugin/plugin.json`: 1.2.2 → 1.2.3.

### Verified
- All 8 audits pass.

### What this enables
- Fixture roadmap metadata can be verified.

### What's still ahead
- Continue fixture hardening.
"""
    passing = release_metadata_summary(
        package_json=package_json,
        plugin_json=plugin_json,
        changelog_text=changelog,
        roadmap_text=roadmap,
        audit_count=8,
    )
    assert_condition(passing["errors"] == [], "complete fixture should pass without errors")

    failing = release_metadata_summary(
        package_json=package_json,
        plugin_json={"version": "1.2.2"},
        changelog_text=changelog.replace("All 8 audits pass.", "All 7 audits pass."),
        roadmap_text=roadmap.replace("(v1.2.3)", "(v1.2.2)"),
        audit_count=8,
    )
    joined_errors = "\n".join(failing["errors"])
    assert_condition("plugin manifest version mismatch" in joined_errors, "plugin mismatch should fail")
    assert_condition("CHANGELOG.md top entry audit count mismatch" in joined_errors, "stale audit count should fail")
    assert_condition("docs/ROADMAP.md is missing a current release entry" in joined_errors, "missing roadmap entry should fail")

    run_all_fixture = """AUDITS: tuple[AuditSpec, ...] = (
    AuditSpec(name="frontmatter", script="frontmatter-check.py"),
    AuditSpec(name="link", script="link-check.py"),
)


@dataclass
class AuditResult:
    spec=AuditSpec(name="fixture", script="fixture.py")
"""
    assert_condition(
        load_audit_count(run_all_fixture) == 2,
        "audit count should parse only the AUDITS tuple and ignore self-test fixtures",
    )

    print("Release metadata self-test passed")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true", help="Print machine-readable summary")
    parser.add_argument("--self-test", action="store_true", help="Run local fixture checks")
    args = parser.parse_args()

    if args.self_test:
        return run_self_test()

    summary = release_metadata_summary(
        package_json=load_json(PACKAGE_JSON),
        plugin_json=load_json(PLUGIN_JSON),
        changelog_text=CHANGELOG.read_text(encoding="utf-8"),
        roadmap_text=ROADMAP.read_text(encoding="utf-8"),
        audit_count=load_audit_count(),
    )

    if args.json:
        print(json.dumps(summary, ensure_ascii=False, indent=2))
    elif summary["errors"]:
        print("Release metadata check failed:")
        for error in summary["errors"]:
            print(f"- {error}")
    else:
        print(
            "Release metadata check passed: "
            f"v{summary['version']}, "
            f"{summary['audit_count']} audits, "
            f"CHANGELOG {summary['changelog_date']}"
        )

    return 1 if summary["errors"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
