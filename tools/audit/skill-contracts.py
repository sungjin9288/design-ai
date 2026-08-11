#!/usr/bin/env python3
"""Validate Agent Skills structure, inventory parity, and durable guidance."""
from __future__ import annotations

import argparse
import json
import re
import sys
import tempfile
from pathlib import Path

from markdown_contracts import markdown_headings, split_frontmatter


ROOT = Path(__file__).resolve().parents[2]
SKILLS_DIR = ROOT / "skills"
PLUGIN_MANIFEST = ROOT / ".claude-plugin" / "plugin.json"
CAPABILITY_MANIFEST = ROOT / "cli" / "lib" / "capability-manifest.json"

NAME_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
XML_TAG_PATTERN = re.compile(r"<[^>]+>")
PLAYBOOK_LINK = "[PLAYBOOK.md](PLAYBOOK.md)"
MAX_SKILL_LINES = 500
MAX_PLAYBOOK_LINES = 400

TIME_SENSITIVE_PATTERNS: tuple[tuple[re.Pattern[str], str], ...] = (
    (re.compile(r"\bAs of (?:early |mid-|late )?20\d{2}\b", re.IGNORECASE), "dated capability claim"),
    (re.compile(r"\bdefault 20\d{2}\+\b", re.IGNORECASE), "dated default claim"),
    (re.compile(r"\$\d+(?:\.\d+)?/(?:mo|month)\b", re.IGNORECASE), "hard-coded recurring price"),
)


def read_json_object(path: Path, label: str) -> tuple[dict[str, object] | None, list[str]]:
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return None, [f"{label}: file is missing: {path}"]
    except json.JSONDecodeError as error:
        return None, [f"{label}: invalid JSON at line {error.lineno}, column {error.colno}"]
    if not isinstance(value, dict):
        return None, [f"{label}: root must be an object"]
    return value, []


def list_skill_directories(root: Path) -> list[Path]:
    skills_dir = root / "skills"
    if not skills_dir.is_dir():
        return []
    return sorted(
        path
        for path in skills_dir.iterdir()
        if path.is_dir() and ((path / "SKILL.md").exists() or (path / "PLAYBOOK.md").exists())
    )


def manifest_skill_names(value: object, *, label: str) -> tuple[list[str], list[str]]:
    if not isinstance(value, list):
        return [], [f"{label}: skills must be an array"]
    names: list[str] = []
    errors: list[str] = []
    for index, item in enumerate(value):
        if not isinstance(item, dict) or not isinstance(item.get("name"), str):
            errors.append(f"{label}: skills[{index}] must contain a string name")
            continue
        name = item["name"]
        expected_path = f"skills/{name}/SKILL.md"
        if item.get("path") != expected_path:
            errors.append(f"{label}: {name} path must be {expected_path}")
        names.append(name)
    return names, errors


def duplicate_names(names: list[str]) -> list[str]:
    seen: set[str] = set()
    duplicates: set[str] = set()
    for name in names:
        if name in seen:
            duplicates.add(name)
        seen.add(name)
    return sorted(duplicates)


def validate_inventory(root: Path) -> list[str]:
    plugin, errors = read_json_object(root / ".claude-plugin" / "plugin.json", "plugin manifest")
    capability, capability_errors = read_json_object(
        root / "cli" / "lib" / "capability-manifest.json",
        "capability manifest",
    )
    errors.extend(capability_errors)
    if plugin is None or capability is None:
        return errors

    plugin_names, plugin_errors = manifest_skill_names(plugin.get("skills"), label="plugin manifest")
    errors.extend(plugin_errors)
    install = capability.get("install")
    capability_names = install.get("skills") if isinstance(install, dict) else None
    if not isinstance(capability_names, list) or not all(isinstance(name, str) for name in capability_names):
        errors.append("capability manifest: install.skills must be an array of strings")
        capability_names = []

    directory_names = [path.name for path in list_skill_directories(root)]
    plugin_duplicates = duplicate_names(plugin_names)
    capability_duplicates = duplicate_names(capability_names)
    if plugin_duplicates:
        errors.append(f"skill inventory: plugin manifest contains duplicate skill names: {plugin_duplicates}")
    if capability_duplicates:
        errors.append(f"skill inventory: capability manifest contains duplicate skill names: {capability_duplicates}")
    if plugin_names != capability_names:
        errors.append("skill inventory: plugin manifest and capability manifest order differ")
    if set(plugin_names) != set(directory_names):
        missing = sorted(set(plugin_names) - set(directory_names))
        extra = sorted(set(directory_names) - set(plugin_names))
        errors.append(f"skill inventory: directory parity failed; missing={missing}, extra={extra}")
    return errors


def has_heading(headings: list[str], expected: str) -> bool:
    expected_lower = expected.casefold()
    return any(heading.casefold() == expected_lower for heading in headings)


def has_heading_prefix(headings: list[str], prefixes: tuple[str, ...]) -> bool:
    lowered = tuple(prefix.casefold() for prefix in prefixes)
    return any(heading.casefold().startswith(lowered) for heading in headings)


def validate_durable_guidance(text: str, relative_path: Path) -> list[str]:
    errors: list[str] = []
    for pattern, label in TIME_SENSITIVE_PATTERNS:
        match = pattern.search(text)
        if match:
            errors.append(
                f"{relative_path}: {label} must be replaced with capability detection or a source check: {match.group(0)!r}"
            )
    return errors


def validate_skill_directory(skill_dir: Path, root: Path) -> list[str]:
    name = skill_dir.name
    skill_path = skill_dir / "SKILL.md"
    playbook_path = skill_dir / "PLAYBOOK.md"
    relative_skill = skill_path.relative_to(root)
    relative_playbook = playbook_path.relative_to(root)
    errors: list[str] = []

    if not skill_path.is_file():
        errors.append(f"{relative_skill}: file is missing")
        return errors
    if not playbook_path.is_file():
        errors.append(f"{relative_playbook}: file is missing")
        return errors

    skill_text = skill_path.read_text(encoding="utf-8")
    frontmatter, body = split_frontmatter(skill_text)
    if frontmatter is None:
        errors.append(f"{relative_skill}: valid YAML frontmatter is required")
    else:
        skill_name = frontmatter.get("name")
        description = frontmatter.get("description")
        if not isinstance(skill_name, str):
            errors.append(f"{relative_skill}: name must be a string")
        else:
            if skill_name != name:
                errors.append(f"{relative_skill}: name {skill_name!r} must match directory {name!r}")
            if len(skill_name) > 64 or not NAME_PATTERN.fullmatch(skill_name):
                errors.append(f"{relative_skill}: name must be <=64 lowercase alphanumeric/hyphen characters")
        if not isinstance(description, str) or not description.strip():
            errors.append(f"{relative_skill}: description must be a non-empty string")
        else:
            if len(description) > 1024:
                errors.append(f"{relative_skill}: description must be <=1024 characters")
            if XML_TAG_PATTERN.search(description):
                errors.append(f"{relative_skill}: description must not contain XML tags")
            if "use when" not in description.casefold():
                errors.append(f"{relative_skill}: description must state both what it does and 'Use when' to activate it")

    if len(skill_text.splitlines()) > MAX_SKILL_LINES:
        errors.append(f"{relative_skill}: exceeds the {MAX_SKILL_LINES}-line Agent Skills limit")
    if PLAYBOOK_LINK not in body:
        errors.append(f"{relative_skill}: body must directly link {PLAYBOOK_LINK}")
    if "executable workflow" not in body.casefold():
        errors.append(f"{relative_skill}: body must identify PLAYBOOK.md as the executable workflow")
    errors.extend(validate_durable_guidance(skill_text, relative_skill))

    playbook_text = playbook_path.read_text(encoding="utf-8")
    playbook_lines = playbook_text.splitlines()
    if len(playbook_lines) > MAX_PLAYBOOK_LINES:
        errors.append(f"{relative_playbook}: exceeds the repository {MAX_PLAYBOOK_LINES}-line topic limit")
    expected_title = f"# {name} — playbook"
    if not playbook_lines or playbook_lines[0].strip() != expected_title:
        errors.append(f"{relative_playbook}: first heading must be {expected_title!r}")

    headings = markdown_headings(playbook_text, level=2)
    for required in ("When to use", "Source files this skill reads", "Done when"):
        if not has_heading(headings, required):
            errors.append(f"{relative_playbook}: missing required '## {required}' section")
    if not has_heading_prefix(headings, ("Inputs",)):
        errors.append(f"{relative_playbook}: missing required Inputs section")
    if not has_heading_prefix(headings, ("Steps", "Workflow", "How to critique")):
        errors.append(f"{relative_playbook}: missing Steps, Workflow, or How to critique section")
    if not has_heading_prefix(headings, ("Verification phase",)):
        errors.append(f"{relative_playbook}: missing required Verification phase section")

    source_heading = re.search(
        r"^## Source files this skill reads\s*$\n(?P<section>.*?)(?=^## |\Z)",
        playbook_text,
        re.MULTILINE | re.DOTALL,
    )
    if source_heading and not re.search(r"\[[^\]]+\]\((?:\.\.?/|[A-Za-z0-9_-])", source_heading.group("section")):
        errors.append(f"{relative_playbook}: source section must link at least one local authority")

    errors.extend(validate_durable_guidance(playbook_text, relative_playbook))
    return errors


def validate_repository(root: Path = ROOT) -> tuple[int, list[str]]:
    errors = validate_inventory(root)
    skill_dirs = list_skill_directories(root)
    for skill_dir in skill_dirs:
        errors.extend(validate_skill_directory(skill_dir, root))
    return len(skill_dirs), errors


def write_fixture(root: Path) -> None:
    skill_dir = root / "skills" / "test-skill"
    skill_dir.mkdir(parents=True)
    (root / ".claude-plugin").mkdir(parents=True)
    (root / "cli" / "lib").mkdir(parents=True)
    (root / ".claude-plugin" / "plugin.json").write_text(
        json.dumps({"skills": [{"name": "test-skill", "path": "skills/test-skill/SKILL.md"}]}),
        encoding="utf-8",
    )
    (root / "cli" / "lib" / "capability-manifest.json").write_text(
        json.dumps({"install": {"skills": ["test-skill"]}}),
        encoding="utf-8",
    )
    (skill_dir / "SKILL.md").write_text(
        """---
name: test-skill
description: Validate one fixture. Use when a repository needs a structural skill check.
---

Open and follow [PLAYBOOK.md](PLAYBOOK.md) as the executable workflow.
""",
        encoding="utf-8",
    )
    (skill_dir / "PLAYBOOK.md").write_text(
        """# test-skill — playbook

## When to use

- Validate a fixture.

## Inputs

- One repository.

## Steps

1. Read the source.

## Source files this skill reads

- [README](../../README.md)

## Verification phase

- [ ] The fixture passed.

## Done when

- The report exists.
""",
        encoding="utf-8",
    )


def expect_error(root: Path, expected: str) -> None:
    _, errors = validate_repository(root)
    if expected not in "\n".join(errors):
        raise SystemExit(f"skill contract self-test failed: expected {expected!r}, got {errors!r}")


def run_self_test() -> int:
    with tempfile.TemporaryDirectory(prefix="design-ai-skill-contracts-") as temp_dir:
        root = Path(temp_dir)
        write_fixture(root)
        count, errors = validate_repository(root)
        if count != 1 or errors:
            raise SystemExit(f"skill contract self-test failed: valid fixture rejected: {errors!r}")

        skill_path = root / "skills" / "test-skill" / "SKILL.md"
        valid_skill = skill_path.read_text(encoding="utf-8")
        skill_path.write_text(valid_skill.replace(" Use when", " Apply when"), encoding="utf-8")
        expect_error(root, "description must state both what it does")
        skill_path.write_text(valid_skill, encoding="utf-8")

        skill_path.write_text(valid_skill.replace(PLAYBOOK_LINK, "PLAYBOOK.md"), encoding="utf-8")
        expect_error(root, "body must directly link")
        skill_path.write_text(valid_skill, encoding="utf-8")

        skill_path.write_text(valid_skill.replace("---", "---invalid", 1), encoding="utf-8")
        expect_error(root, "valid YAML frontmatter is required")
        skill_path.write_text(valid_skill, encoding="utf-8")

        playbook_path = root / "skills" / "test-skill" / "PLAYBOOK.md"
        valid_playbook = playbook_path.read_text(encoding="utf-8")
        playbook_path.write_text(valid_playbook.replace("## Done when", "## Finished"), encoding="utf-8")
        expect_error(root, "missing required '## Done when'")
        playbook_path.write_text(valid_playbook + "\nUse the $149/mo plan.\n", encoding="utf-8")
        expect_error(root, "hard-coded recurring price")
        playbook_path.write_text(valid_playbook, encoding="utf-8")

        capability_path = root / "cli" / "lib" / "capability-manifest.json"
        capability_path.write_text(json.dumps({"install": {"skills": ["other-skill"]}}), encoding="utf-8")
        expect_error(root, "plugin manifest and capability manifest order differ")
        capability_path.write_text(
            json.dumps({"install": {"skills": ["test-skill", "test-skill"]}}),
            encoding="utf-8",
        )
        expect_error(root, "capability manifest contains duplicate skill names")

    print("Skill contract self-test passed")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--self-test", action="store_true", help="Run isolated mutation fixtures")
    args = parser.parse_args()
    if args.self_test:
        return run_self_test()

    count, errors = validate_repository()
    print(f"Checked {count} skills")
    if errors:
        print(f"\n{len(errors)} issues:\n")
        for error in errors:
            print(f"  {error}")
        return 1
    print("All skill contracts valid")
    return 0


if __name__ == "__main__":
    sys.exit(main())
