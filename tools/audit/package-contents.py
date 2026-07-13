#!/usr/bin/env python3
"""
Verify the npm package dry-run contents before publishing.

This turns the human "scan npm pack output" release step into a deterministic
gate. It checks that required runtime files, every plugin manifest path, and
skill sidecar docs are included, while test/build/cache-only files stay out of
the tarball.

Usage:
  python3 tools/audit/package-contents.py
  python3 tools/audit/package-contents.py --json
  python3 tools/audit/package-contents.py --self-test
  npm pack --dry-run --json | python3 tools/audit/package-contents.py --pack-json -
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PACKAGE_JSON = ROOT / "package.json"
PLUGIN_JSON = ROOT / ".claude-plugin" / "plugin.json"

MAX_PACKAGE_SIZE_MB = 15
MAX_PACKAGE_SIZE_BYTES = MAX_PACKAGE_SIZE_MB * 1024 * 1024
CATALOG_COUNT_LABELS = {
    "skills": "skill",
    "commands": "command",
    "agents": "agent",
}
CATALOG_COUNT_SECTIONS = {
    "skill": "skills",
    "skills": "skills",
    "command": "commands",
    "commands": "commands",
    "agent": "agents",
    "agents": "agents",
}
CATALOG_COUNT_RE = re.compile(
    r"\b(?P<count>\d+)\s+(?:(?:review|slash)\s+)?"
    r"(?P<section>skills?|commands?|agents?)\b"
)
MARKDOWN_LINK_RE = re.compile(r"\[([^\]]*)\]\(([^)\s]+?)(?:#[^)]+)?\)")
INLINE_CODE_RE = re.compile(r"`[^`]*`")
EXTERNAL_LINK_PREFIXES = ("http://", "https://", "mailto:", "ftp://", "tel:")

REQUIRED_PATHS = {
    "package.json",
    "README.md",
    "README.ko.md",
    "LICENSE",
    "AGENTS.md",
    "AGENTS.ko.md",
    "CLAUDE.md",
    "CHANGELOG.md",
    "install.sh",
    ".claude-plugin/plugin.json",
    "cli/bin/design-ai.mjs",
    "cli/bin/design-ai-mcp.mjs",
    "cli/lib/capability-manifest.json",
    "cli/lib/capability-manifest.mjs",
    "cli/lib/dispatch.mjs",
    "cli/lib/mcp-server.mjs",
    "cli/lib/plugin-manifest.mjs",
    "cli/lib/route-operation.mjs",
    "cli/lib/route-catalog.mjs",
    "knowledge/PRINCIPLES.md",
    "examples/README.md",
    "skills/component-spec-writer/PLAYBOOK.md",
    "commands/design-from-brief.md",
    "docs/DISTRIBUTION.md",
    "docs/DISTRIBUTION.ko.md",
    "docs/QUICKSTART.md",
    "docs/QUICKSTART.ko.md",
    "docs/USING.md",
    "docs/USING.ko.md",
    "docs/website-console/index.html",
    "docs/website-console/app.js",
    "docs/website-console/source-bundle.js",
    "docs/website-console/styles.css",
    "tools/audit/run-all.py",
    "tools/audit/frontmatter-check.py",
    "tools/audit/link-check.py",
    "tools/audit/korean-copy-check.py",
    "tools/audit/raw-hex-check.py",
    "tools/audit/integration-check.py",
    "tools/audit/stale-check.py",
    "tools/audit/check-coverage.py",
    "tools/audit/capability_manifest.py",
    "tools/audit/doctor_assertions.py",
    "tools/audit/smoke_assertions.py",
    "tools/audit/example-qa.py",
    "tools/audit/local-ci.py",
    "tools/audit/package-contents.py",
    "tools/audit/package-smoke.py",
    "tools/audit/registry-smoke.py",
    "tools/audit/release-metadata.py",
}

FORBIDDEN_PREFIXES = (
    "refs/",
    ".git/",
    ".github/",
    "node_modules/",
    "tools/extractors/",
)

CLONE_ONLY_COMMANDS = {"extract-tokens"}
CLONE_ONLY_PACKAGE_PATHS = {"commands/extract-tokens.md"}

FORBIDDEN_SUFFIXES = (
    ".pyc",
    ".tgz",
    ".test.mjs",
    ".test.js",
    ".spec.mjs",
    ".spec.js",
)

FORBIDDEN_SEGMENTS = (
    "/__pycache__/",
    "/node_modules/",
)


def parse_pack_payload(raw: str, *, source: str) -> dict:
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        print(raw, file=sys.stderr)
        raise SystemExit(f"failed to parse npm pack JSON from {source}: {error}") from error

    if isinstance(payload, list):
        if len(payload) != 1:
            raise SystemExit(f"expected exactly one npm pack result from {source}, got {len(payload)}")
        return payload[0]

    if isinstance(payload, dict):
        return payload

    raise SystemExit(f"expected npm pack JSON object or single-item array from {source}")


def run_npm_pack_dry_run() -> dict:
    result = subprocess.run(
        ["npm", "pack", "--dry-run", "--json"],
        cwd=ROOT,
        text=True,
        capture_output=True,
    )

    if result.returncode != 0:
        if result.stdout:
            print(result.stdout, end="")
        if result.stderr:
            print(result.stderr, end="", file=sys.stderr)
        raise SystemExit(f"npm pack --dry-run --json failed with exit code {result.returncode}")

    return parse_pack_payload(result.stdout, source="npm pack --dry-run --json")


def load_pack_json(pack_json: str) -> dict:
    if pack_json == "-":
        return parse_pack_payload(sys.stdin.read(), source="stdin")

    pack_json_path = Path(pack_json).resolve()
    try:
        raw = pack_json_path.read_text(encoding="utf-8")
    except OSError as error:
        raise SystemExit(f"failed to read npm pack JSON fixture: {pack_json_path}") from error

    return parse_pack_payload(raw, source=str(pack_json_path))


def load_manifest_paths() -> set[str]:
    manifest = load_plugin_json()
    required: set[str] = set()

    for section in ("skills", "commands", "agents"):
        entries = manifest.get(section, [])
        if not isinstance(entries, list):
            raise SystemExit(f"plugin manifest section is not a list: {section}")
        for entry in entries:
            path = entry.get("path") if isinstance(entry, dict) else None
            if not path:
                raise SystemExit(f"plugin manifest entry in {section} is missing path")
            required.add(path)

    return required


def load_skill_sidecar_paths() -> set[str]:
    required: set[str] = set()
    skills_root = ROOT / "skills"
    for file_path in skills_root.glob("*/*.md"):
        if file_path.name in {"SKILL.md", "PLAYBOOK.md", "TEMPLATE.md"}:
            required.add(file_path.relative_to(ROOT).as_posix())
    return required


def load_required_paths() -> set[str]:
    return REQUIRED_PATHS | load_manifest_paths() | load_skill_sidecar_paths()


def load_run_all_audit_scripts() -> list[str]:
    text = (ROOT / "tools/audit/run-all.py").read_text(encoding="utf-8")
    match = re.search(
        r"AUDITS: tuple\[AuditSpec, \.\.\.\] = \(\n(?P<body>.*?)\n\)\n\n\n@dataclass",
        text,
        re.DOTALL,
    )
    if not match:
        raise SystemExit("failed to locate AUDITS tuple in tools/audit/run-all.py")
    return re.findall(r'script="([^"]+\.py)"', match.group("body"))


def load_package_json() -> dict:
    return json.loads(PACKAGE_JSON.read_text(encoding="utf-8"))


def load_plugin_json() -> dict:
    return json.loads(PLUGIN_JSON.read_text(encoding="utf-8"))


def matches_package_files_exclusion(path: str, pattern: str) -> bool:
    normalized_pattern = pattern.rstrip("/")
    if path == normalized_pattern or path.startswith(f"{normalized_pattern}/"):
        return True
    if pattern == "**/__pycache__/**":
        return "/__pycache__/" in f"/{path}"
    if pattern == "**/*.pyc":
        return path.endswith(".pyc")
    if "/**/*" in pattern:
        prefix, suffix = pattern.split("/**/*", 1)
        return path.startswith(f"{prefix}/") and path.endswith(suffix)
    return False


def load_package_file_fixture_paths(package_json: dict) -> set[str]:
    package_files = package_json.get("files")
    if not isinstance(package_files, list):
        raise SystemExit("package.json files field is not a list")

    included: set[str] = set()
    exclusions: list[str] = []
    for entry in package_files:
        if not isinstance(entry, str) or not entry:
            raise SystemExit("package.json files field contains a non-string entry")
        if entry.startswith("!"):
            exclusions.append(entry[1:])
            continue

        path = entry.rstrip("/")
        absolute_path = ROOT / path
        if absolute_path.is_file():
            included.add(path)
        elif absolute_path.is_dir():
            for file_path in absolute_path.rglob("*"):
                if file_path.is_file():
                    included.add(file_path.relative_to(ROOT).as_posix())

    for exclusion in exclusions:
        included = {
            path
            for path in included
            if not matches_package_files_exclusion(path, exclusion)
        }

    included.add("package.json")
    return included


def format_catalog_count(count: int, singular: str) -> str:
    return f"{count} {singular}{'' if count == 1 else 's'}"


def catalog_counts_from_manifest(plugin_json: dict) -> tuple[dict[str, int], list[str]]:
    counts: dict[str, int] = {}
    errors: list[str] = []
    for section in CATALOG_COUNT_LABELS:
        entries = plugin_json.get(section)
        if not isinstance(entries, list):
            errors.append(f"plugin manifest section is not a list: {section}")
            continue
        counts[section] = len(entries)
    return counts, errors


def catalog_count_mentions(description: str) -> dict[str, list[tuple[int, str]]]:
    mentions: dict[str, list[tuple[int, str]]] = {}
    for match in CATALOG_COUNT_RE.finditer(description):
        section = CATALOG_COUNT_SECTIONS[match.group("section")]
        mentions.setdefault(section, []).append((int(match.group("count")), match.group(0)))
    return mentions


def replace_first_catalog_count(description: str, section: str, count: int) -> str:
    replaced = False

    def replace(match: re.Match[str]) -> str:
        nonlocal replaced
        if replaced or CATALOG_COUNT_SECTIONS[match.group("section")] != section:
            return match.group(0)

        replaced = True
        return match.group(0).replace(match.group("count"), str(count), 1)

    updated = CATALOG_COUNT_RE.sub(replace, description)
    if not replaced:
        raise SystemExit(f"self-test failed: fixture description is missing {section} count")
    return updated


def metadata_inventory_errors(package_json: dict, plugin_json: dict) -> list[str]:
    expected_counts, errors = catalog_counts_from_manifest(plugin_json)
    if errors:
        return errors

    descriptions = {
        "package.json description": package_json.get("description"),
        ".claude-plugin/plugin.json description": plugin_json.get("description"),
    }
    for label, description in descriptions.items():
        if not isinstance(description, str) or not description.strip():
            errors.append(f"{label} is missing")
            continue

        mentions = catalog_count_mentions(description)
        for section, expected_count in expected_counts.items():
            expected_label = format_catalog_count(expected_count, CATALOG_COUNT_LABELS[section])
            section_mentions = mentions.get(section, [])
            if not section_mentions:
                errors.append(f"{label} missing catalog count: {expected_label}")
                continue

            for count, phrase in section_mentions:
                if count != expected_count:
                    errors.append(
                        f"{label} catalog count mismatch: {phrase} != {expected_label}"
                    )

    return errors


def clone_only_inventory_errors(plugin_json: dict) -> list[str]:
    commands = plugin_json.get("commands")
    if not isinstance(commands, list):
        return ["plugin manifest section is not a list: commands"]

    errors: list[str] = []
    for entry in commands:
        if isinstance(entry, dict) and entry.get("name") in CLONE_ONLY_COMMANDS:
            errors.append(f"clone-only command is publicly listed: {entry['name']}")
    return errors


def is_forbidden(path: str) -> bool:
    if path in CLONE_ONLY_PACKAGE_PATHS:
        return True
    if path.startswith(FORBIDDEN_PREFIXES):
        return True
    if path.endswith(FORBIDDEN_SUFFIXES):
        return True
    normalized = f"/{path}"
    return any(segment in normalized for segment in FORBIDDEN_SEGMENTS)


def is_external_link(url: str) -> bool:
    return url.startswith(EXTERNAL_LINK_PREFIXES)


def is_anchor_only_link(url: str) -> bool:
    return url.startswith("#")


def is_refs_link(url: str) -> bool:
    """refs/ links are intentionally excluded from package/runtime closure checks."""
    return "refs/" in url


def normalize_package_link_target(source_path: Path, link: str) -> tuple[str | None, str | None]:
    """Resolve a markdown link target to a repo-relative package path.

    Returns (target_path, error). Links that are intentionally skipped return
    (None, None). Only concrete files are checked against the package file list;
    directory links remain valid because npm pack reports files, not directories.
    """
    if is_external_link(link) or is_anchor_only_link(link) or is_refs_link(link):
        return None, None

    normalized_link = link.split("?", 1)[0].split("#", 1)[0]
    if not normalized_link:
        return None, None

    resolved = (source_path.parent / normalized_link).resolve()
    try:
        relative = resolved.relative_to(ROOT)
    except ValueError:
        return None, (
            f"packaged markdown link points outside repository: "
            f"{source_path.relative_to(ROOT).as_posix()} -> {link}"
        )

    if not resolved.exists() or not resolved.is_file():
        return None, None

    return relative.as_posix(), None


def packaged_markdown_link_errors(file_paths: set[str]) -> list[str]:
    errors: list[str] = []
    markdown_paths = sorted(path for path in file_paths if path.endswith(".md"))

    for markdown_path in markdown_paths:
        source_path = ROOT / markdown_path
        if not source_path.is_file():
            continue

        in_code_block = False
        text = source_path.read_text(encoding="utf-8")
        for line in text.splitlines():
            if line.strip().startswith("```"):
                in_code_block = not in_code_block
                continue
            if in_code_block:
                continue

            line_without_code = INLINE_CODE_RE.sub("", line)
            for match in MARKDOWN_LINK_RE.finditer(line_without_code):
                _, link = match.groups()
                target_path, target_error = normalize_package_link_target(source_path, link)
                if target_error:
                    errors.append(target_error)
                    continue
                if target_path is None:
                    continue
                if target_path not in file_paths:
                    errors.append(
                        "packaged markdown link target is not included: "
                        f"{markdown_path} -> {link} ({target_path})"
                    )

    return errors


def format_bytes(size: int) -> str:
    if size >= 1024 * 1024:
        return f"{size / 1024 / 1024:.1f} MB"
    if size >= 1024:
        return f"{size / 1024:.1f} KB"
    return f"{size} B"


def verify_package_contents(
    pack: dict,
    *,
    package_json: dict | None = None,
    plugin_json: dict | None = None,
    required_paths: set[str] | None = None,
) -> dict:
    files = pack.get("files", [])
    if not isinstance(files, list):
        raise SystemExit("npm pack JSON did not include a files array")

    file_paths = {entry.get("path") for entry in files if isinstance(entry, dict)}
    file_paths.discard(None)

    package_json = package_json or load_package_json()
    plugin_json = plugin_json or load_plugin_json()
    required_paths = required_paths or load_required_paths()

    errors: list[str] = []
    missing = sorted(path for path in required_paths if path not in file_paths)
    forbidden = sorted(path for path in file_paths if is_forbidden(path))
    markdown_link_errors = packaged_markdown_link_errors(file_paths)

    package_size = int(pack.get("size") or 0)
    if package_size > MAX_PACKAGE_SIZE_BYTES:
        errors.append(
            f"package size {format_bytes(package_size)} exceeds {MAX_PACKAGE_SIZE_MB} MB limit"
        )

    if pack.get("name") != package_json.get("name"):
        errors.append(f"package name mismatch: {pack.get('name')} != {package_json.get('name')}")
    if pack.get("version") != package_json.get("version"):
        errors.append(
            f"package version mismatch: {pack.get('version')} != {package_json.get('version')}"
        )
    if plugin_json.get("version") != package_json.get("version"):
        errors.append(
            "plugin manifest version mismatch: "
            f"{plugin_json.get('version')} != {package_json.get('version')}"
        )
    errors.extend(metadata_inventory_errors(package_json, plugin_json))
    errors.extend(clone_only_inventory_errors(plugin_json))

    if missing:
        errors.append("missing required package path(s): " + ", ".join(missing))
    if forbidden:
        errors.append("forbidden package path(s): " + ", ".join(forbidden))
    errors.extend(markdown_link_errors)

    return {
        "name": pack.get("name"),
        "version": pack.get("version"),
        "plugin_version": plugin_json.get("version"),
        "filename": pack.get("filename"),
        "file_count": len(file_paths),
        "package_size": package_size,
        "unpacked_size": int(pack.get("unpackedSize") or 0),
        "missing": missing,
        "forbidden": forbidden,
        "markdown_link_errors": markdown_link_errors,
        "errors": errors,
    }


def assert_condition(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f"self-test failed: {message}")


def run_self_test() -> int:
    package_json = load_package_json()
    plugin_json = load_plugin_json()
    required_paths = sorted(load_required_paths())
    package_file_paths = sorted(load_package_file_fixture_paths(package_json))
    assert_condition(
        any(path.endswith("/PLAYBOOK.md") for path in required_paths),
        "skill playbook paths should be part of required package contents",
    )
    assert_condition(
        any(path.endswith("/TEMPLATE.md") for path in required_paths),
        "skill template paths should be part of required package contents when present",
    )
    assert_condition(
        "tools/audit/smoke_assertions.py" in required_paths,
        "shared smoke assertion helper should be required package contents",
    )
    assert_condition(
        "tools/audit/check-coverage.py" in required_paths,
        "coverage audit script should be required package contents",
    )
    for localized_entrypoint in (
        "README.ko.md",
        "AGENTS.ko.md",
        "docs/QUICKSTART.ko.md",
        "docs/USING.ko.md",
        "docs/DISTRIBUTION.ko.md",
    ):
        assert_condition(
            localized_entrypoint in required_paths,
            f"{localized_entrypoint} should be required package contents",
        )
    run_all_audit_paths = {
        f"tools/audit/{script}"
        for script in load_run_all_audit_scripts()
    }
    missing_run_all_audit_paths = sorted(
        path for path in run_all_audit_paths if path not in required_paths
    )
    assert_condition(
        len(run_all_audit_paths) == 8,
        "run-all.py should still enumerate eight repository audits",
    )
    assert_condition(
        not missing_run_all_audit_paths,
        "run-all.py audit scripts should be required package contents: "
        + ", ".join(missing_run_all_audit_paths),
    )
    missing_fixture_paths = sorted(
        path for path in required_paths if path not in package_file_paths
    )
    assert_condition(
        not missing_fixture_paths,
        "package.json files fixture should include all required package contents: "
        + ", ".join(missing_fixture_paths),
    )

    passing_pack = {
        "name": package_json["name"],
        "version": package_json["version"],
        "filename": "fixture.tgz",
        "size": 1024,
        "unpackedSize": 4096,
        "files": [{"path": path} for path in package_file_paths],
    }
    passing_summary = verify_package_contents(
        passing_pack,
        package_json=package_json,
        plugin_json=plugin_json,
        required_paths=set(required_paths),
    )
    assert_condition(
        passing_summary["errors"] == [],
        "complete fixture should pass without errors",
    )

    clone_only_manifest = {
        **plugin_json,
        "commands": [
            *plugin_json["commands"],
            {"name": "extract-tokens", "path": "commands/extract-tokens.md"},
        ],
    }
    clone_only_manifest_summary = verify_package_contents(
        passing_pack,
        package_json=package_json,
        plugin_json=clone_only_manifest,
        required_paths=set(required_paths),
    )
    assert_condition(
        "clone-only command is publicly listed: extract-tokens"
        in "\n".join(clone_only_manifest_summary["errors"]),
        "extract-tokens should not be publicly listed in the plugin manifest",
    )

    clone_only_tarball_summary = verify_package_contents(
        {
            **passing_pack,
            "files": [*passing_pack["files"], {"path": "commands/extract-tokens.md"}],
        },
        package_json=package_json,
        plugin_json=plugin_json,
        required_paths=set(required_paths),
    )
    assert_condition(
        "commands/extract-tokens.md" in clone_only_tarball_summary["forbidden"],
        "extract-tokens should not be included in the npm tarball",
    )

    missing_markdown_target_paths = set(package_file_paths)
    missing_markdown_target_paths.remove("AGENTS.ko.md")
    missing_markdown_required_paths = set(required_paths)
    missing_markdown_required_paths.remove("AGENTS.ko.md")
    missing_markdown_target_summary = verify_package_contents(
        {
            **passing_pack,
            "files": [{"path": path} for path in sorted(missing_markdown_target_paths)],
        },
        package_json=package_json,
        plugin_json=plugin_json,
        required_paths=missing_markdown_required_paths,
    )
    assert_condition(
        "docs/USING.ko.md -> ../AGENTS.ko.md"
        in "\n".join(missing_markdown_target_summary["markdown_link_errors"]),
        "packaged markdown links should fail when their existing target is not packaged",
    )

    failing_pack = {
        "name": package_json["name"],
        "version": "0.0.0",
        "filename": "bad-fixture.tgz",
        "size": MAX_PACKAGE_SIZE_BYTES + 1,
        "unpackedSize": 0,
        "files": [
            {"path": "package.json"},
            {"path": "refs/source.md"},
            {"path": "cli/lib/check.test.mjs"},
        ],
    }
    mismatched_plugin_json = {**plugin_json, "version": "0.0.0"}
    failing_summary = verify_package_contents(
        failing_pack,
        package_json=package_json,
        plugin_json=mismatched_plugin_json,
        required_paths=set(required_paths),
    )
    joined_errors = "\n".join(failing_summary["errors"])

    assert_condition(
        any(path.endswith("plugin.json") for path in failing_summary["missing"]),
        "incomplete fixture should report missing manifest/runtime paths",
    )
    assert_condition(
        "refs/source.md" in failing_summary["forbidden"],
        "forbidden refs/ path should be detected",
    )
    assert_condition(
        "cli/lib/check.test.mjs" in failing_summary["forbidden"],
        "forbidden CLI test file should be detected",
    )
    assert_condition(
        "package size" in joined_errors,
        "oversized package should be reported",
    )
    assert_condition(
        "package version mismatch" in joined_errors,
        "version mismatch should be reported",
    )
    assert_condition(
        "plugin manifest version mismatch" in joined_errors,
        "plugin manifest version mismatch should be reported",
    )

    stale_package_json = {
        **package_json,
        "description": replace_first_catalog_count(
            package_json["description"],
            "skills",
            len(plugin_json["skills"]) - 1,
        ),
    }
    stale_package_summary = verify_package_contents(
        passing_pack,
        package_json=stale_package_json,
        plugin_json=plugin_json,
        required_paths=set(required_paths),
    )
    assert_condition(
        "package.json description catalog count mismatch"
        in "\n".join(stale_package_summary["errors"]),
        "stale package.json inventory count should be reported",
    )

    stale_plugin_json = {
        **plugin_json,
        "description": replace_first_catalog_count(
            plugin_json["description"],
            "agents",
            len(plugin_json["agents"]) - 1,
        ),
    }
    stale_plugin_summary = verify_package_contents(
        passing_pack,
        package_json=package_json,
        plugin_json=stale_plugin_json,
        required_paths=set(required_paths),
    )
    assert_condition(
        ".claude-plugin/plugin.json description catalog count mismatch"
        in "\n".join(stale_plugin_summary["errors"]),
        "stale plugin manifest inventory count should be reported",
    )

    print("Package contents self-test passed")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true", help="Print machine-readable summary")
    parser.add_argument(
        "--self-test",
        action="store_true",
        help="Run built-in success and failure fixture checks without invoking npm pack",
    )
    parser.add_argument(
        "--pack-json",
        metavar="FILE",
        help="Read npm pack --json output from a fixture file instead of running npm pack; use - for stdin",
    )
    args = parser.parse_args()

    if args.self_test:
        return run_self_test()

    pack = load_pack_json(args.pack_json) if args.pack_json else run_npm_pack_dry_run()
    summary = verify_package_contents(pack)
    if args.json:
        print(json.dumps(summary, ensure_ascii=False, indent=2))
    elif summary["errors"]:
        print("Package contents check failed:")
        for error in summary["errors"]:
            print(f"- {error}")
    else:
        print(
            "Package contents check passed: "
            f"{summary['name']}@{summary['version']}, "
            f"{summary['file_count']} files, "
            f"packed {format_bytes(summary['package_size'])}, "
            f"unpacked {format_bytes(summary['unpacked_size'])}"
        )

    return 1 if summary["errors"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
