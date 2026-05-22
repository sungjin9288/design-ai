"""Shared assertions for design-ai package and registry smoke tests."""
from __future__ import annotations

import argparse
import json
import re
import shlex
import sys
import tempfile
from pathlib import Path
from typing import Callable

from doctor_assertions import EXPECTED_DOCTOR_PASS_LABELS, assert_doctor_report_clean

ANSI_ESCAPE_RE = re.compile(r"\x1b\[[0-?]*[ -/]*[@-~]")
ROOT = Path(__file__).resolve().parents[2]
PLUGIN_MANIFEST = ROOT / ".claude-plugin" / "plugin.json"
PLUGIN_INVENTORY_SECTIONS = (
    ("skills", "skill"),
    ("commands", "command"),
    ("agents", "agent"),
)
OUTPUT_FORCE_OVERWRITE_SENTINEL = "__design-ai-smoke-force-overwrite-sentinel__"


def load_plugin_manifest() -> dict[str, object]:
    try:
        return json.loads(PLUGIN_MANIFEST.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise SystemExit(f"failed to load plugin manifest for smoke assertions: {PLUGIN_MANIFEST}") from error


def count_manifest_section(manifest: dict[str, object], section: str) -> int:
    items = manifest.get(section)
    return len(items) if isinstance(items, list) else 0


def format_inventory_count(count: int, singular: str) -> str:
    return f"{count} {singular}{'' if count == 1 else 's'}"


def build_plugin_inventory_summary(manifest: dict[str, object]) -> str:
    return ", ".join(
        format_inventory_count(count_manifest_section(manifest, section), singular)
        for section, singular in PLUGIN_INVENTORY_SECTIONS
    )


EXPECTED_PLUGIN_INVENTORY_SUMMARY = build_plugin_inventory_summary(load_plugin_manifest())
EXPECTED_HELP_TOPICS = (
    "install",
    "update",
    "uninstall",
    "status",
    "list",
    "search",
    "show",
    "route",
    "routes",
    "prompt",
    "pack",
    "check",
    "audit",
    "doctor",
    "examples",
    "version",
    "help",
)
EXPECTED_HELP_USAGE = "design-ai help [command|--json]"
EXPECTED_HELP_ALIASES = {
    "i": "install",
    "upgrade": "update",
    "u": "update",
    "remove": "uninstall",
    "rm": "uninstall",
    "s": "status",
    "ls": "list",
    "find": "search",
    "cat": "show",
    "recommend": "route",
    "lint": "check",
    "a": "audit",
    "diag": "doctor",
    "example": "examples",
    "ex": "examples",
    "v": "version",
}
EXPECTED_HELP_TOPIC_FRAGMENTS = {
    "install": ("Usage:", "design-ai install [--json]"),
    "update": ("Usage:", "design-ai update [--dry-run] [--json]"),
    "uninstall": ("Usage:", "design-ai uninstall [--json]"),
    "status": ("Usage:", "design-ai status [--json]"),
    "list": ("Usage:", "design-ai list [skills|commands|agents]"),
    "search": ("Usage:", "design-ai search <query> [--limit N] [--dir kind] [--json]"),
    "show": ("Usage:", "design-ai show <file[:line|start-end]> [--lines N:M] [--context N] [--json]"),
    "route": ("Usage:", "design-ai route <brief>", "design-ai route --list [--json]"),
    "routes": ("Usage:", "design-ai routes [--json]", "Equivalent to: design-ai route --list"),
    "prompt": ("Usage:", "design-ai prompt <brief> [--route id] [--json] [--out file] [--force]"),
    "pack": ("Usage:", "design-ai pack <brief> [--route id] [--max-bytes N] [--json] [--out file] [--force]"),
    "check": ("Usage:", "design-ai check <artifact.md>", "design-ai check --examples --all-routes"),
    "audit": ("Usage:", "design-ai audit [--strict] [--quiet] [--json]"),
    "doctor": ("Usage:", "design-ai doctor [--strict] [--json] [--fix]"),
    "examples": ("Usage:", "design-ai examples [query] [--route id] [--limit N] [--json]"),
    "version": ("Usage:", "design-ai version [--json]"),
    "help": ("Usage:", "design-ai help [command]", "design-ai help --json"),
}
EXPECTED_MAIN_HELP_FRAGMENTS = (
    "design-ai",
    "Senior product designer for Claude Code",
    "Usage:  design-ai <command> [args]",
    "design-ai help [command|--json]",
    "install",
    "search <query>",
    "show <file[:line]>",
    "route <brief|--from-file file|--stdin|--list>",
    "prompt <brief|--from-file file|--stdin>",
    "pack <brief|--from-file file|--stdin>",
    "check <artifact.md|--stdin|--examples>",
    "examples [query]",
    "Environment overrides:",
    "Quickstart:",
    "Docs:",
    f"Plugin:  {EXPECTED_PLUGIN_INVENTORY_SUMMARY}",
)
EXPECTED_VERSION_FRAGMENTS = (
    "design-ai CLI:",
    "Plugin / corpus:",
    "4.13.0",
    "Source:",
)
EXPECTED_INSTALL_OUTPUT_FRAGMENTS = (
    "design-ai installer",
    "Source:",
    "Target:",
    "Prefix:",
    "Installing from:",
    "Installed 19 skills",
    "Installed 4 agents",
    "Installed 16 slash commands",
    "Installed. Restart Claude Code",
    "design-ai status",
)
EXPECTED_UPDATE_DRY_RUN_OUTPUT_FRAGMENTS = (
    "design-ai update dry run",
    "Source:",
    "Target:",
    "Prefix:",
    "Git:",
    "Install:",
    "Dry run complete. No files changed.",
)
EXPECTED_STATUS_OUTPUT_FRAGMENTS = (
    "design-ai status",
    "Source:",
    "Target:",
    "Prefix:",
    "Skills: 19 installed",
    "Agents: 4 installed",
    "Slash commands: 16 installed",
)
EXPECTED_DOCTOR_STRICT_OUTPUT_FRAGMENTS = (
    "design-ai doctor",
    "Diagnose install and runtime health",
    "Source:",
    "Target:",
    "Prefix:",
    "Source layout: complete",
    "Version alignment: 4.13.0",
    "Manifest paths: 39 referenced artifact(s) exist",
    "Node runtime:",
    "Python runtime:",
    "Audit runner: tools/audit/run-all.py found",
    "Audit scripts: 8 repository audit script(s) found",
    "Doctor assertions helper: tools/audit/doctor_assertions.py found",
    "Smoke assertions helper: tools/audit/smoke_assertions.py found",
    "Example QA audit: tools/audit/example-qa.py found",
    "Package contents check: tools/audit/package-contents.py found",
    "Package smoke check: tools/audit/package-smoke.py found",
    "Registry smoke check: tools/audit/registry-smoke.py found",
    "Installed skills: 19/19 installed",
    "Installed agents: 4/4 installed",
    "Installed slash commands: 16/16 installed",
    f"Summary: {len(EXPECTED_DOCTOR_PASS_LABELS)} pass, 0 warning(s), 0 failure(s)",
)
EXPECTED_UNINSTALL_OUTPUT_FRAGMENTS = (
    "design-ai uninstaller",
    "Uninstalling design-ai from",
    "Removed 39 design-ai symlinks",
    "Done. To remove the design-ai source",
    "Source location:",
)
EXPECTED_COMMAND_ALIAS_COMMANDS = (
    ("i", "--help"),
    ("upgrade", "--help"),
    ("u", "--help"),
    ("remove", "--help"),
    ("rm", "--help"),
    ("s", "--help"),
    ("ls", "--help"),
    ("find", "--help"),
    ("cat", "--help"),
    ("recommend", "--help"),
    ("lint", "--help"),
    ("a", "--help"),
    ("diag", "--help"),
    ("example", "--help"),
    ("ex", "--help"),
    ("v", "--help"),
    ("--version",),
    ("-v",),
    ("--help",),
    ("-h",),
)
EXPECTED_UNKNOWN_COMMAND = "docter"
EXPECTED_UNKNOWN_COMMAND_SUGGESTION = "doctor"
EXPECTED_UNKNOWN_HELP_TOPIC = "serach"
EXPECTED_UNKNOWN_HELP_TOPIC_SUGGESTION = "search"
EXPECTED_UNKNOWN_LIST_DOMAIN = "skillz"
EXPECTED_UNKNOWN_LIST_DOMAIN_SUGGESTION = "skills"
EXPECTED_UNKNOWN_ROUTE_ID = "component-spce"
EXPECTED_UNKNOWN_ROUTE_ID_SUGGESTION = "component-spec"
EXPECTED_SEARCH_DIRS = (
    "knowledge",
    "examples",
    "skills",
    "docs",
    "agents",
    "commands",
)
EXPECTED_UNKNOWN_SEARCH_DIR = "knowlege"
EXPECTED_UNKNOWN_SEARCH_DIR_SUGGESTION = "knowledge"
EXPECTED_UNKNOWN_OPTION_SMOKES = (
    ("install", "--jsn", "--json"),
    ("update", "--hlep", "--help"),
    ("list", "--jsno", "--json"),
    ("status", "--jsn", "--json"),
    ("uninstall", "--jsn", "--json"),
    ("route", "--limt", "--limit"),
    ("prompt", "--rout", "--route"),
    ("pack", "--max-byte", "--max-bytes"),
    ("check", "--rout", "--route"),
    ("examples", "--rouet", "--route"),
    ("search", "--dr", "--dir"),
    ("show", "--line", "--lines"),
    ("audit", "--strct", "--strict"),
    ("version", "--jsn", "--json"),
    ("doctor", "--jsn", "--json"),
)
EXPECTED_LIST_CATALOG = {
    "skills": (
        "design-system-builder",
        "component-spec-writer",
        "color-palette",
        "ux-audit",
        "design-critique",
        "handoff-spec",
        "design-system-qa",
        "design-pr-review",
        "figma-token-sync",
        "design-broadcast",
        "document-author",
        "slide-deck-author",
        "motion-designer",
        "illustration-designer",
        "print-designer",
        "video-designer",
        "game-ui-designer",
        "conversational-ui-designer",
        "spatial-designer",
    ),
    "commands": (
        "design-from-brief",
        "iterate",
        "document-from-brief",
        "slide-deck",
        "design-review",
        "palette-from-brand",
        "component-spec",
        "extract-tokens",
        "motion-design",
        "illustration",
        "print",
        "video",
        "game-ui",
        "conversational",
        "spatial",
        "stability-review",
    ),
    "agents": (
        "design-critic",
        "a11y-reviewer",
        "component-architect",
        "token-extractor",
    ),
}
EXPECTED_ERROR_PREFIX = "\u2717"
EXPECTED_CORPUS_SEARCH_QUERY = "Pretendard"
EXPECTED_CORPUS_SEARCH_HIT = "knowledge/PRINCIPLES.md"
EXPECTED_CORPUS_SEARCH_PREVIEW = "Pretendard for Korean primary"
EXPECTED_CORPUS_SHOW_TARGET = "knowledge/PRINCIPLES.md:1"
EXPECTED_CORPUS_SHOW_REL_PATH = "knowledge/PRINCIPLES.md"
EXPECTED_CORPUS_SHOW_TEXT = "<!-- hand-written -->"
EXPECTED_CORPUS_SHOW_RANGE = "1:2"
EXPECTED_CORPUS_SHOW_RANGE_END_TEXT = "---"
EXPECTED_EXAMPLES_ROUTE = "component-spec"
EXPECTED_EXAMPLES_EFFECTIVE_QUERY = "component"
EXPECTED_EXAMPLES_HIT = "examples/component-button.md"
EXPECTED_EXAMPLES_CATEGORY = "component"
EXPECTED_EXAMPLES_TITLE_FRAGMENT = "Button"
EXPECTED_ROUTE_BRIEF = "Spec a Button component API with keyboard accessibility"
EXPECTED_ROUTE_ID = "component-spec"
EXPECTED_ROUTE_LABEL = "Component spec"
EXPECTED_ROUTE_COMMAND = "commands/component-spec.md"
EXPECTED_ROUTE_SKILL = "skills/component-spec-writer/SKILL.md"
EXPECTED_ROUTE_AGENT = "agents/component-architect.md"
EXPECTED_ROUTE_KNOWLEDGE = "knowledge/a11y/keyboard-and-focus.md"
EXPECTED_ROUTE_MATCHED_KEYWORDS = ("component", "button", "spec", "api")
EXPECTED_FUNCTIONAL_ALIAS_TARGETS = {
    "ls": "list",
    "find": "search",
    "cat": "show",
    "recommend": "route",
    "example": "examples",
    "ex": "examples",
    "lint": "check",
}
EXPECTED_FUNCTIONAL_ALIAS_ASSERTIONS = frozenset((
    "list-skills",
    "search-json",
    "show-json-line",
    "route-json",
    "examples-json",
    "examples-human",
    "check-examples-json",
))
EXPECTED_FUNCTIONAL_ALIAS_SMOKES = (
    ("ls skills", ("ls", "skills"), "list-skills"),
    ("find corpus", ("find", EXPECTED_CORPUS_SEARCH_QUERY, "--dir", "knowledge", "--limit", "1", "--json"), "search-json"),
    ("cat corpus", ("cat", EXPECTED_CORPUS_SHOW_TARGET, "--context", "0", "--json"), "show-json-line"),
    ("recommend route", ("recommend", EXPECTED_ROUTE_BRIEF, "--limit", "1", "--json"), "route-json"),
    ("example route", ("example", "--route", EXPECTED_EXAMPLES_ROUTE, "--limit", "1", "--json"), "examples-json"),
    ("ex route", ("ex", "--route", EXPECTED_EXAMPLES_ROUTE, "--limit", "1"), "examples-human"),
    (
        "lint examples",
        ("lint", "--examples", "--route", EXPECTED_ROUTE_ID, "--limit", "1", "--strict", "--json"),
        "check-examples-json",
    ),
)
EXPECTED_ROUTE_CATALOG_IDS = (
    "design-review",
    "design-from-brief",
    "component-spec",
    "palette-from-brand",
    "motion-design",
    "illustration",
    "print",
    "video",
    "game-ui",
    "conversational",
    "spatial",
    "document-from-brief",
    "slide-deck",
    "handoff-spec",
    "design-system-qa",
    "figma-token-sync",
    "design-pr-review",
    "stability-review",
)
EXPECTED_PROMPT_SLASH_COMMAND = "/design-component-spec"
EXPECTED_PROMPT_QUALITY_COMMAND = "design-ai check output.md --route component-spec --strict"
EXPECTED_PROMPT_PLAYBOOK = "skills/component-spec-writer/PLAYBOOK.md"
EXPECTED_PROMPT_A11Y_AGENT = "agents/a11y-reviewer.md"
EXPECTED_PROMPT_FILES = (
    "AGENTS.md",
    EXPECTED_ROUTE_COMMAND,
    EXPECTED_ROUTE_SKILL,
    EXPECTED_PROMPT_PLAYBOOK,
    EXPECTED_ROUTE_AGENT,
    EXPECTED_PROMPT_A11Y_AGENT,
    "knowledge/PRINCIPLES.md",
    EXPECTED_ROUTE_KNOWLEDGE,
    EXPECTED_EXAMPLES_HIT,
)
EXPECTED_PACK_MAX_BYTES = 1000
EXPECTED_AUDIT_SCRIPTS = (
    "frontmatter-check.py",
    "link-check.py",
    "korean-copy-check.py",
    "raw-hex-check.py",
    "integration-check.py",
    "stale-check.py",
    "check-coverage.py",
    "example-qa.py",
)
EXPECTED_AUDIT_NAMES = (
    "frontmatter",
    "link",
    "korean-copy",
    "raw-hex",
    "integration",
    "stale",
    "coverage",
    "example-qa",
)
EXPECTED_AUDIT_COUNT = len(EXPECTED_AUDIT_SCRIPTS)
EXPECTED_CHECK_ARTIFACT_NAME = "component-artifact.md"
EXPECTED_CHECK_EXAMPLES_LIMIT = 1
EXPECTED_NUMERIC_VALUE_SMOKES = (
    ("route limit", ("route", EXPECTED_ROUTE_BRIEF, "--limit", "0", "--json"), "--limit expects an integer from 1 to 10"),
    ("search limit", ("search", EXPECTED_CORPUS_SEARCH_QUERY, "--limit", "0"), "--limit expects an integer from 1 to 500"),
    ("examples limit", ("examples", "--route", EXPECTED_EXAMPLES_ROUTE, "--limit", "0"), "--limit expects an integer from 1 to 100"),
    ("check limit", ("check", "--examples", "--route", EXPECTED_ROUTE_ID, "--limit", "26"), "--limit expects an integer from 1 to 25"),
    ("pack max bytes", ("pack", EXPECTED_ROUTE_BRIEF, "--max-bytes", "999"), "--max-bytes expects an integer from 1000 to 1000000"),
    ("show context", ("show", EXPECTED_CORPUS_SHOW_TARGET, "--context", "101"), "--context expects an integer from 0 to 100"),
)
EXPECTED_CHECK_RESULT_IDS = (
    "content-depth",
    "unresolved-markers",
    "source-grounding",
    "contrast",
    "keyboard-focus",
    "responsive",
    "screen-reader",
    "dont-section",
    "korean-context",
    "route-component-spec-component-contract",
)


def format_cmd(cmd: list[str]) -> str:
    return shlex.join(cmd)


def load_run_all_audit_scripts() -> tuple[str, ...]:
    text = (ROOT / "tools/audit/run-all.py").read_text(encoding="utf-8")
    match = re.search(
        r"AUDITS: tuple\[AuditSpec, \.\.\.\] = \(\n(?P<body>.*?)\n\)\n\n\n@dataclass",
        text,
        re.DOTALL,
    )
    if not match:
        raise SystemExit("failed to locate AUDITS tuple in tools/audit/run-all.py")

    return tuple(re.findall(r'script="([^"]+\.py)"', match.group("body")))


def assert_no_ansi(output: str, cmd: list[str]) -> None:
    if ANSI_ESCAPE_RE.search(output):
        raise SystemExit(f"NO_COLOR command emitted ANSI escape sequence: {format_cmd(cmd)}")


def assert_contains_fragments(raw: str, fragments: tuple[str, ...], *, context: str, label: str) -> None:
    missing = [fragment for fragment in fragments if fragment not in raw]
    if missing:
        raise SystemExit(
            f"{label} after {context} missing expected content: {' | '.join(missing)}"
        )


def passing_unknown_command_output() -> str:
    return "\n".join([
        f"Unknown command: {EXPECTED_UNKNOWN_COMMAND}",
        f"Did you mean `design-ai {EXPECTED_UNKNOWN_COMMAND_SUGGESTION}`?",
        "Run `design-ai help` for usage.",
    ])


def passing_unknown_help_topic_output() -> str:
    return "\n".join([
        f"{EXPECTED_ERROR_PREFIX} Unknown help topic: {EXPECTED_UNKNOWN_HELP_TOPIC}",
        f"Did you mean `design-ai help {EXPECTED_UNKNOWN_HELP_TOPIC_SUGGESTION}`?",
        "Run `design-ai help` to list available commands.",
    ])


def passing_unknown_list_domain_output() -> str:
    return "\n".join([
        f"{EXPECTED_ERROR_PREFIX} Unknown domain: {EXPECTED_UNKNOWN_LIST_DOMAIN}",
        "domain expects one of: skills, commands, agents",
        f"Received: {EXPECTED_UNKNOWN_LIST_DOMAIN}",
        f"Did you mean `{EXPECTED_UNKNOWN_LIST_DOMAIN_SUGGESTION}`?",
    ])


def passing_unknown_route_id_output() -> str:
    return "\n".join([
        f"{EXPECTED_ERROR_PREFIX} Unknown route id: {EXPECTED_UNKNOWN_ROUTE_ID}.",
        f"Did you mean `{EXPECTED_UNKNOWN_ROUTE_ID_SUGGESTION}`?",
        f"Available routes: {', '.join(EXPECTED_ROUTE_CATALOG_IDS)}",
    ])


def passing_search_dir_value_output() -> str:
    return "\n".join([
        f"{EXPECTED_ERROR_PREFIX} --dir expects one of: {', '.join(EXPECTED_SEARCH_DIRS)}",
        f"Received: {EXPECTED_UNKNOWN_SEARCH_DIR}",
        f"Did you mean `{EXPECTED_UNKNOWN_SEARCH_DIR_SUGGESTION}`?",
    ])


def passing_unknown_option_output(command_name: str, option: str, suggestion: str) -> str:
    return "\n".join([
        f"{EXPECTED_ERROR_PREFIX} Unknown {command_name} option: {option}",
        f"Did you mean `{suggestion}`?",
    ])


def passing_numeric_value_output(expected_message: str) -> str:
    return f"{EXPECTED_ERROR_PREFIX} {expected_message}"


def unknown_option_args(command_name: str, option: str) -> list[str]:
    if command_name == "install":
        return ["install", option]
    if command_name == "update":
        return ["update", option]
    if command_name == "list":
        return ["list", option]
    if command_name == "status":
        return ["status", option]
    if command_name == "uninstall":
        return ["uninstall", option]
    if command_name == "route":
        return ["route", EXPECTED_ROUTE_BRIEF, option, "1", "--json"]
    if command_name == "prompt":
        return ["prompt", EXPECTED_ROUTE_BRIEF, option, EXPECTED_ROUTE_ID]
    if command_name == "pack":
        return ["pack", EXPECTED_ROUTE_BRIEF, option, str(EXPECTED_PACK_MAX_BYTES)]
    if command_name == "check":
        return ["check", "--examples", option, EXPECTED_ROUTE_ID]
    if command_name == "examples":
        return ["examples", option, EXPECTED_EXAMPLES_ROUTE]
    if command_name == "search":
        return ["search", EXPECTED_CORPUS_SEARCH_QUERY, option, "knowledge"]
    if command_name == "show":
        return ["show", EXPECTED_CORPUS_SHOW_TARGET, option, "1:2"]
    if command_name == "audit":
        return ["audit", option]
    if command_name == "version":
        return ["version", option]
    if command_name == "doctor":
        return ["doctor", option]
    raise SystemExit(f"unsupported unknown option smoke command: {command_name}")


def passing_list_catalog_output(kind: str = "skills") -> str:
    items = EXPECTED_LIST_CATALOG[kind]
    return "\n".join([
        "",
        "  design-ai catalog",
        "",
        "Plugin: design-ai v4.13.0",
        "",
        "",
        f"{kind} ({len(items)})",
        "────────────────────────────────────────",
        *(f"  {item}" for item in items),
        "",
    ])


def list_catalog_item_path(kind: str, name: str) -> str:
    if kind == "skills":
        return f"skills/{name}/SKILL.md"
    if kind == "commands":
        return f"commands/{name}.md"
    if kind == "agents":
        return f"agents/{name}.md"
    raise SystemExit(f"unsupported list catalog kind for smoke fixture: {kind}")


def passing_list_catalog_json(kind: str = "skills") -> str:
    items = [
        {
            "name": item,
            "path": list_catalog_item_path(kind, item),
            "description": f"{item} description",
        }
        for item in EXPECTED_LIST_CATALOG[kind]
    ]
    return json.dumps(
        {
            "name": "design-ai",
            "version": "4.13.0",
            "kind": kind,
            "sections": [
                {
                    "kind": kind,
                    "count": len(items),
                    "items": items,
                }
            ],
        },
        ensure_ascii=False,
        indent=2,
    )


def passing_output_overwrite_failure_output(path: str = "/tmp/existing.md") -> str:
    return "\n".join([
        f"{EXPECTED_ERROR_PREFIX} Output file already exists: {path}. Use --force to overwrite.",
        "",
    ])


def passing_output_write_success_output(path: str = "/tmp/output.json") -> str:
    return "\n".join([
        f"✓  Wrote {path}",
        "",
    ])


def assert_unknown_command_failure(
    raw: str,
    *,
    returncode: int,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    if returncode != 1:
        raise SystemExit(
            f"unknown command after {context} exited with {returncode}, expected 1: {format_cmd(cmd)}"
        )

    expected_lines = passing_unknown_command_output().splitlines()
    missing = [line for line in expected_lines if line not in raw]
    if missing:
        raise SystemExit(
            f"unknown command after {context} missing expected output: {' | '.join(missing)}"
        )


def assert_unknown_help_topic_failure(
    raw: str,
    *,
    returncode: int,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    if returncode != 1:
        raise SystemExit(
            f"unknown help topic after {context} exited with {returncode}, expected 1: {format_cmd(cmd)}"
        )

    expected_lines = passing_unknown_help_topic_output().splitlines()
    missing = [line for line in expected_lines if line not in raw]
    if missing:
        raise SystemExit(
            f"unknown help topic after {context} missing expected output: {' | '.join(missing)}"
        )


def assert_unknown_list_domain_failure(
    raw: str,
    *,
    returncode: int,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    if returncode != 1:
        raise SystemExit(
            f"unknown list domain after {context} exited with {returncode}, expected 1: {format_cmd(cmd)}"
        )

    expected_lines = passing_unknown_list_domain_output().splitlines()
    missing = [line for line in expected_lines if line not in raw]
    if missing:
        raise SystemExit(
            f"unknown list domain after {context} missing expected output: {' | '.join(missing)}"
        )


def assert_unknown_route_id_failure(
    raw: str,
    *,
    returncode: int,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    if returncode != 1:
        raise SystemExit(
            f"unknown route id after {context} exited with {returncode}, expected 1: {format_cmd(cmd)}"
        )

    expected_lines = passing_unknown_route_id_output().splitlines()
    missing = [line for line in expected_lines if line not in raw]
    if missing:
        raise SystemExit(
            f"unknown route id after {context} missing expected output: {' | '.join(missing)}"
        )


def assert_unknown_option_failure(
    raw: str,
    *,
    returncode: int,
    context: str,
    cmd: list[str],
    command_name: str,
    option: str,
    suggestion: str,
) -> None:
    assert_no_ansi(raw, cmd)
    if returncode != 1:
        raise SystemExit(
            f"unknown {command_name} option after {context} exited with {returncode}, expected 1: {format_cmd(cmd)}"
        )

    expected_lines = passing_unknown_option_output(command_name, option, suggestion).splitlines()
    missing = [line for line in expected_lines if line not in raw]
    if missing:
        raise SystemExit(
            f"unknown {command_name} option after {context} missing expected output: {' | '.join(missing)}"
        )


def assert_search_dir_value_failure(
    raw: str,
    *,
    returncode: int,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    if returncode != 1:
        raise SystemExit(
            f"search dir value after {context} exited with {returncode}, expected 1: {format_cmd(cmd)}"
        )

    expected_lines = passing_search_dir_value_output().splitlines()
    missing = [line for line in expected_lines if line not in raw]
    if missing:
        raise SystemExit(
            f"search dir value after {context} missing expected output: {' | '.join(missing)}"
        )


def assert_numeric_value_failure(
    raw: str,
    *,
    returncode: int,
    context: str,
    cmd: list[str],
    expected_message: str,
) -> None:
    assert_no_ansi(raw, cmd)
    if returncode != 1:
        raise SystemExit(
            f"numeric value after {context} exited with {returncode}, expected 1: {format_cmd(cmd)}"
        )

    expected_line = passing_numeric_value_output(expected_message)
    if expected_line not in raw:
        raise SystemExit(
            f"numeric value after {context} missing expected output: {expected_line}"
        )


def assert_output_overwrite_failure(
    raw: str,
    *,
    returncode: int,
    context: str,
    cmd: list[str],
    expected_path: str | None = None,
) -> None:
    assert_no_ansi(raw, cmd)
    if returncode != 1:
        raise SystemExit(
            f"output overwrite after {context} exited with {returncode}, expected 1: {format_cmd(cmd)}"
        )

    required_fragments = (
        EXPECTED_ERROR_PREFIX,
        "Output file already exists:",
        "Use --force to overwrite.",
    )
    if expected_path is not None:
        required_fragments = (*required_fragments, expected_path)
    assert_contains_fragments(
        raw,
        required_fragments,
        context=context,
        label="output overwrite failure",
    )


def assert_output_write_success(raw: str, *, context: str, cmd: list[str], expected_path: str) -> None:
    assert_no_ansi(raw, cmd)
    if raw.lstrip().startswith("{") or raw.lstrip().startswith("#"):
        raise SystemExit(f"output write success after {context} looks like artifact content")
    if "Output file already exists:" in raw or "Use --force to overwrite." in raw:
        raise SystemExit(f"output write success after {context} reported overwrite failure")

    assert_contains_fragments(
        raw,
        ("Wrote", expected_path),
        context=context,
        label="output write success",
    )


def seed_force_overwrite_target(output_path: Path, *, context: str, cmd: list[str]) -> None:
    if "--force" not in cmd:
        raise SystemExit(f"forced output overwrite after {context} requires --force: {format_cmd(cmd)}")
    try:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(f"{OUTPUT_FORCE_OVERWRITE_SENTINEL}\n", encoding="utf-8")
    except OSError as error:
        raise SystemExit(f"failed to seed forced output overwrite target after {context}: {output_path}") from error


def assert_force_overwrite_replaced(raw: str, *, context: str, cmd: list[str], expected_path: str) -> None:
    if OUTPUT_FORCE_OVERWRITE_SENTINEL in raw:
        raise SystemExit(
            "forced output overwrite after "
            f"{context} did not replace sentinel at {expected_path}: {format_cmd(cmd)}"
        )


def passing_doctor_report_json() -> str:
    return json.dumps({
        "context": {
            "sourceRoot": "/tmp/design-ai",
            "claudeHome": "/tmp/claude",
            "prefix": "design-",
            "expected": {
                "skills": 19,
                "agents": 4,
                "commands": 16,
            },
        },
        "checks": [
            {
                "status": "PASS",
                "label": label,
                "detail": f"{label} fixture passed",
                "action": "",
            }
            for label in sorted(EXPECTED_DOCTOR_PASS_LABELS)
        ],
        "summary": {"pass": len(EXPECTED_DOCTOR_PASS_LABELS), "warn": 0, "fail": 0},
        "fix": {
            "attempted": False,
            "applied": False,
            "reason": "",
        },
    })


def doctor_report_json_missing(label_to_remove: str) -> str:
    return json.dumps({
        "context": {
            "sourceRoot": "/tmp/design-ai",
            "claudeHome": "/tmp/claude",
            "prefix": "design-",
            "expected": {
                "skills": 19,
                "agents": 4,
                "commands": 16,
            },
        },
        "checks": [
            {
                "status": "PASS",
                "label": label,
                "detail": f"{label} fixture passed",
                "action": "",
            }
            for label in sorted(EXPECTED_DOCTOR_PASS_LABELS)
            if label != label_to_remove
        ],
        "summary": {"pass": len(EXPECTED_DOCTOR_PASS_LABELS) - 1, "warn": 0, "fail": 0},
        "fix": {
            "attempted": False,
            "applied": False,
            "reason": "",
        },
    })


def passing_search_json() -> str:
    return json.dumps({
        "query": EXPECTED_CORPUS_SEARCH_QUERY,
        "hits": [
            {
                "file": "/tmp/design-ai/knowledge/PRINCIPLES.md",
                "lineNumber": 29,
                "relPath": EXPECTED_CORPUS_SEARCH_HIT,
                "preview": EXPECTED_CORPUS_SEARCH_PREVIEW,
            }
        ],
    })


def passing_search_human_output() -> str:
    return "\n".join([
        "",
        "  design-ai search",
        f"  {EXPECTED_CORPUS_SEARCH_QUERY}",
        "",
        "Source: /tmp/design-ai",
        "Hits: 1",
        "",
        f"{EXPECTED_CORPUS_SEARCH_HIT}:29",
        f"  10. **{EXPECTED_CORPUS_SEARCH_PREVIEW}.** Pairs Hangul + Latin in matched proportions.",
        "",
    ])


def passing_show_json() -> str:
    return json.dumps({
        "file": "/tmp/design-ai/knowledge/PRINCIPLES.md",
        "relPath": EXPECTED_CORPUS_SHOW_REL_PATH,
        "start": 1,
        "end": 1,
        "totalLines": 109,
        "lines": [
            {"number": 1, "text": EXPECTED_CORPUS_SHOW_TEXT},
        ],
    })


def passing_show_range_json() -> str:
    return json.dumps({
        "file": "/tmp/design-ai/knowledge/PRINCIPLES.md",
        "relPath": EXPECTED_CORPUS_SHOW_REL_PATH,
        "start": 1,
        "end": 2,
        "totalLines": 109,
        "lines": [
            {"number": 1, "text": EXPECTED_CORPUS_SHOW_TEXT},
            {"number": 2, "text": EXPECTED_CORPUS_SHOW_RANGE_END_TEXT},
        ],
    })


def passing_show_human_output() -> str:
    return "\n".join([
        "",
        "  design-ai show",
        f"  {EXPECTED_CORPUS_SHOW_REL_PATH}",
        "",
        "Lines: 1-1 of 109",
        "",
        f"1 | {EXPECTED_CORPUS_SHOW_TEXT}",
        "",
    ])


def passing_show_range_human_output() -> str:
    return "\n".join([
        "",
        "  design-ai show",
        f"  {EXPECTED_CORPUS_SHOW_REL_PATH}",
        "",
        "Lines: 1-2 of 109",
        "",
        f"1 | {EXPECTED_CORPUS_SHOW_TEXT}",
        f"2 | {EXPECTED_CORPUS_SHOW_RANGE_END_TEXT}",
        "",
    ])


def passing_examples_json() -> str:
    return json.dumps({
        "query": "",
        "routeId": EXPECTED_EXAMPLES_ROUTE,
        "effectiveQuery": EXPECTED_EXAMPLES_EFFECTIVE_QUERY,
        "examples": [
            {
                "relPath": EXPECTED_EXAMPLES_HIT,
                "title": "`Button` - spec",
                "category": EXPECTED_EXAMPLES_CATEGORY,
                "score": 57,
                "preview": "Status: example artifact for component-spec-writer skill",
            }
        ],
    })


def passing_examples_human_output() -> str:
    return "\n".join([
        "",
        "  design-ai examples",
        f"  {EXPECTED_EXAMPLES_ROUTE}",
        "",
        f"Effective query: {EXPECTED_EXAMPLES_EFFECTIVE_QUERY}",
        "Examples: 1",
        "",
        f"1. `{EXPECTED_EXAMPLES_TITLE_FRAGMENT}` - spec ({EXPECTED_EXAMPLES_CATEGORY}, score 57)",
        f"   {EXPECTED_EXAMPLES_HIT}",
        "   > Status: example artifact for `component-spec-writer` skill",
        "",
    ])


def passing_route_json() -> str:
    return json.dumps({
        "brief": EXPECTED_ROUTE_BRIEF,
        "version": "4.13.0",
        "routes": [
            {
                "id": EXPECTED_ROUTE_ID,
                "label": EXPECTED_ROUTE_LABEL,
                "score": len(EXPECTED_ROUTE_MATCHED_KEYWORDS),
                "confidence": "high",
                "matchedKeywords": list(EXPECTED_ROUTE_MATCHED_KEYWORDS),
                "command": {"path": EXPECTED_ROUTE_COMMAND, "exists": True},
                "skills": [{"path": EXPECTED_ROUTE_SKILL, "exists": True}],
                "agents": [{"path": EXPECTED_ROUTE_AGENT, "exists": True}],
                "knowledge": [
                    {"path": "knowledge/PRINCIPLES.md", "exists": True},
                    {"path": EXPECTED_ROUTE_KNOWLEDGE, "exists": True},
                ],
                "explanation": {
                    "summary": "Matched 4 keywords: component, button, spec, api.",
                    "referenceCoverage": {
                        "total": {"available": 5, "total": 5},
                    },
                    "missingReferences": [],
                },
            }
        ],
    })


def passing_route_explain_human_output() -> str:
    return "\n".join([
        "",
        "  design-ai route",
        f"  {EXPECTED_ROUTE_BRIEF}",
        "",
        "Source: /tmp/design-ai",
        "Corpus version: 4.13.0",
        "",
        f"1. {EXPECTED_ROUTE_LABEL} (high, score {len(EXPECTED_ROUTE_MATCHED_KEYWORDS)})",
        f"   id:      {EXPECTED_ROUTE_ID}",
        f"   matched: {', '.join(EXPECTED_ROUTE_MATCHED_KEYWORDS)}",
        f"   why:     Matched {len(EXPECTED_ROUTE_MATCHED_KEYWORDS)} keywords: {', '.join(EXPECTED_ROUTE_MATCHED_KEYWORDS)}.",
        "   refs:    8/8 available",
        f"   command: ✓ {EXPECTED_ROUTE_COMMAND}",
        f"   skill:   ✓ {EXPECTED_ROUTE_SKILL}",
        f"   agent:   ✓ {EXPECTED_ROUTE_AGENT}",
        "   read:    ✓ knowledge/PRINCIPLES.md",
        f"   read:    ✓ {EXPECTED_ROUTE_KNOWLEDGE}",
        "",
    ])


def passing_route_catalog_json() -> str:
    routes = []
    for route_id in EXPECTED_ROUTE_CATALOG_IDS:
        route = {
            "id": route_id,
            "label": route_id.replace("-", " ").title(),
            "score": 0,
            "confidence": "catalog",
            "matchedKeywords": [],
            "command": None,
            "skills": [],
            "agents": [],
            "knowledge": [{"path": "knowledge/PRINCIPLES.md", "exists": True}],
            "keywords": [route_id],
            "explanation": {
                "summary": "Catalog listing; no task brief was scored.",
                "referenceCoverage": {
                    "total": {"available": 1, "total": 1},
                },
                "missingReferences": [],
            },
        }
        if route_id == EXPECTED_ROUTE_ID:
            route.update({
                "label": EXPECTED_ROUTE_LABEL,
                "command": {"path": EXPECTED_ROUTE_COMMAND, "exists": True},
                "skills": [{"path": EXPECTED_ROUTE_SKILL, "exists": True}],
                "agents": [{"path": EXPECTED_ROUTE_AGENT, "exists": True}],
                "knowledge": [
                    {"path": "knowledge/PRINCIPLES.md", "exists": True},
                    {"path": EXPECTED_ROUTE_KNOWLEDGE, "exists": True},
                ],
                "keywords": ["component", "button", "spec", "api"],
                "explanation": {
                    "summary": "Catalog listing; no task brief was scored.",
                    "referenceCoverage": {
                        "total": {"available": 5, "total": 5},
                    },
                    "missingReferences": [],
                },
            })
        routes.append(route)

    return json.dumps({
        "version": "4.13.0",
        "routes": routes,
    })


def passing_prompt_payload() -> dict:
    return {
        "brief": EXPECTED_ROUTE_BRIEF,
        "version": "4.13.0",
        "route": {
            "id": EXPECTED_ROUTE_ID,
            "label": EXPECTED_ROUTE_LABEL,
            "confidence": "forced",
            "matchedKeywords": [],
            "command": {"path": EXPECTED_ROUTE_COMMAND, "exists": True},
            "skills": [{"path": EXPECTED_ROUTE_SKILL, "exists": True}],
            "agents": [
                {"path": EXPECTED_ROUTE_AGENT, "exists": True},
                {"path": EXPECTED_PROMPT_A11Y_AGENT, "exists": True},
            ],
            "knowledge": [
                {"path": "knowledge/PRINCIPLES.md", "exists": True},
                {"path": EXPECTED_ROUTE_KNOWLEDGE, "exists": True},
            ],
            "explanation": {
                "summary": "Route selected explicitly with --route.",
                "referenceCoverage": {
                    "total": {"available": 5, "total": 5},
                },
                "missingReferences": [],
            },
            "forced": True,
        },
        "slashCommand": EXPECTED_PROMPT_SLASH_COMMAND,
        "referenceExamples": [
            {
                "relPath": EXPECTED_EXAMPLES_HIT,
                "title": "`Button` - spec",
                "category": EXPECTED_EXAMPLES_CATEGORY,
                "score": 81,
            }
        ],
        "filesToRead": list(EXPECTED_PROMPT_FILES),
        "checklist": [
            "Cover anatomy, variants, states, API, tokens, ARIA, keyboard behavior, and edge cases.",
            "Cite Ant Design, MUI, and shadcn-ui references when available.",
        ],
        "qualityCommand": EXPECTED_PROMPT_QUALITY_COMMAND,
        "prompt": "\n".join([
            "# design-ai task prompt",
            f"Task: {EXPECTED_ROUTE_BRIEF}",
            f"Selected route: {EXPECTED_ROUTE_LABEL} (forced)",
            f"Route id: {EXPECTED_ROUTE_ID}",
            f"{EXPECTED_PROMPT_SLASH_COMMAND} {EXPECTED_ROUTE_BRIEF}",
            "Reference examples:",
            f"- {EXPECTED_EXAMPLES_HIT} - `Button` - spec",
            EXPECTED_PROMPT_QUALITY_COMMAND,
            "Verification checklist:",
        ]),
    }


def passing_prompt_json() -> str:
    return json.dumps(passing_prompt_payload())


def passing_prompt_markdown_output() -> str:
    return "\n".join([
        "",
        "  design-ai prompt",
        f"  {EXPECTED_ROUTE_BRIEF}",
        "",
        "Source: /tmp/design",
        "Corpus version: 4.13.0",
        "",
        "# design-ai task prompt",
        f"Task: {EXPECTED_ROUTE_BRIEF}",
        f"Selected route: {EXPECTED_ROUTE_LABEL} (forced)",
        f"Route id: {EXPECTED_ROUTE_ID}",
        "Routing reason: Route selected explicitly with --route.",
        "Matched keywords: route selected via --route",
        "Preferred command:",
        f"{EXPECTED_PROMPT_SLASH_COMMAND} {EXPECTED_ROUTE_BRIEF}",
        "Reference examples:",
        f"- {EXPECTED_EXAMPLES_HIT} - `Button` - spec",
        "Before producing the artifact, read these files in order:",
        *(f"- {path}" for path in EXPECTED_PROMPT_FILES),
        "Execution rules:",
        "Suggested artifact QA command:",
        EXPECTED_PROMPT_QUALITY_COMMAND,
        "Verification checklist:",
        "- [ ] Cover anatomy, variants, states, API, tokens, ARIA, keyboard behavior, and edge cases.",
        "- [ ] Cite Ant Design, MUI, and shadcn-ui references when available.",
    ])


def passing_pack_json() -> str:
    return json.dumps({
        "brief": EXPECTED_ROUTE_BRIEF,
        "version": "4.13.0",
        "maxBytes": EXPECTED_PACK_MAX_BYTES,
        "usedBytes": EXPECTED_PACK_MAX_BYTES,
        "summary": {
            "totalFiles": len(EXPECTED_PROMPT_FILES),
            "includedFiles": len(EXPECTED_PROMPT_FILES),
            "truncatedFiles": 2,
            "missingFiles": 0,
            "usedBytes": EXPECTED_PACK_MAX_BYTES,
            "maxBytes": EXPECTED_PACK_MAX_BYTES,
            "remainingBytes": 0,
            "usedRatio": 1,
            "status": "partial",
        },
        "warnings": [
            "Truncated context file: AGENTS.md (80/13632 bytes included)",
            f"Context budget exhausted at {EXPECTED_PACK_MAX_BYTES}/{EXPECTED_PACK_MAX_BYTES} bytes",
        ],
        "plan": passing_prompt_payload(),
        "files": [
            {
                "path": path,
                "bytes": 100,
                "includedBytes": 50,
                "included": True,
                "truncated": path == "AGENTS.md",
                "content": f"fixture content for {path}",
            }
            for path in EXPECTED_PROMPT_FILES
        ],
        "markdown": "\n".join([
            "# design-ai prompt pack",
            "## Context Summary",
            EXPECTED_PROMPT_QUALITY_COMMAND,
            "## Context Files",
            "### AGENTS.md",
            f"### {EXPECTED_EXAMPLES_HIT}",
        ]),
    })


def passing_pack_markdown_output() -> str:
    return "\n".join([
        "",
        "  design-ai pack",
        f"  {EXPECTED_ROUTE_BRIEF}",
        "",
        "Source: /tmp/design",
        "Corpus version: 4.13.0",
        f"Context: partial, {EXPECTED_PACK_MAX_BYTES}/{EXPECTED_PACK_MAX_BYTES} bytes, 2 warnings",
        "",
        "# design-ai prompt pack",
        f"Brief: {EXPECTED_ROUTE_BRIEF}",
        f"Route: {EXPECTED_ROUTE_LABEL} (forced)",
        "Context status: partial",
        f"Context budget: {EXPECTED_PACK_MAX_BYTES}/{EXPECTED_PACK_MAX_BYTES} bytes (100% used)",
        "## Context Summary",
        "- Files: 9/9 included",
        "- Truncated files: 1",
        "- Missing files: 0",
        "- Remaining budget: 0 bytes",
        "Warnings:",
        "Truncated context file: AGENTS.md",
        f"Context budget exhausted at {EXPECTED_PACK_MAX_BYTES}/{EXPECTED_PACK_MAX_BYTES} bytes",
        "## Prompt",
        "# design-ai task prompt",
        f"Task: {EXPECTED_ROUTE_BRIEF}",
        f"Selected route: {EXPECTED_ROUTE_LABEL} (forced)",
        "Preferred command:",
        f"{EXPECTED_PROMPT_SLASH_COMMAND} {EXPECTED_ROUTE_BRIEF}",
        "Reference examples:",
        f"- {EXPECTED_EXAMPLES_HIT} - `Button` - spec",
        "Before producing the artifact, read these files in order:",
        *(f"- {path}" for path in EXPECTED_PROMPT_FILES),
        "Suggested artifact QA command:",
        EXPECTED_PROMPT_QUALITY_COMMAND,
        "## Context Files",
        "### AGENTS.md",
        f"### {EXPECTED_EXAMPLES_HIT}",
    ])


def passing_audit_strict_quiet_output() -> str:
    return "\n".join([
        "",
        "  design-ai audit",
        "  Run repository quality checks",
        "",
        "ℹ  Source: /tmp/design-ai",
        "ℹ  Runner: tools/audit/run-all.py",
        "",
        "",
        f"Running {EXPECTED_AUDIT_COUNT} audits from tools/audit/",
        "",
        "",
        "────────────────────────────────────────────────────────────",
        f"✓ All {EXPECTED_AUDIT_COUNT} audits passed in 2.00s",
    ])


def passing_audit_json(*, strict: bool = True, quiet: bool = True) -> str:
    audits = []
    for name, script in zip(EXPECTED_AUDIT_NAMES, EXPECTED_AUDIT_SCRIPTS):
        audits.append({
            "name": name,
            "script": script,
            "description": f"{name} fixture",
            "passed": True,
            "returncode": 0,
            "durationSeconds": 0.25,
            "strictArgs": ["--strict"] if name == "stale" and strict else [],
        })

    return json.dumps(
        {
            "context": {
                "root": "/tmp/design-ai",
                "auditDir": "tools/audit",
                "strict": strict,
                "quiet": quiet,
            },
            "audits": audits,
            "summary": {
                "total": EXPECTED_AUDIT_COUNT,
                "passed": EXPECTED_AUDIT_COUNT,
                "failed": 0,
                "durationSeconds": 2.0,
                "exitCode": 0,
            },
        },
        ensure_ascii=False,
        indent=2,
    )


def passing_check_artifact_content() -> str:
    return "\n".join([
        "# Button component spec",
        "",
        (
            "This component spec cites knowledge/components/INDEX.md and "
            "knowledge/a11y/keyboard-and-focus.md before making API decisions. "
            "The anatomy includes root, label, icon, and loading slots."
        ),
        "",
        (
            "Variants cover primary, secondary, destructive, and ghost. States cover "
            "hover, active, focus, disabled, and loading. The API uses props for "
            "variant, size, disabled, loading, and aria-label."
        ),
        "",
        (
            "The foreground/background pair is --color-primary-foreground on "
            "--color-primary-default with a measured 4.8:1 contrast ratio. "
            "Keyboard behavior supports Tab, Enter, and Space with focus-visible "
            "styling. Screen reader behavior uses aria-disabled and an accessible name."
        ),
        "",
        (
            "Responsive behavior covers mobile and desktop breakpoints. Do not use "
            "this component for destructive confirmation flows; use AlertDialog instead."
        ),
    ])


def passing_check_report_payload(*, file_path: str) -> dict:
    return {
        "filePath": file_path,
        "routeId": EXPECTED_ROUTE_ID,
        "status": "pass",
        "passes": len(EXPECTED_CHECK_RESULT_IDS),
        "warnings": 0,
        "failures": 0,
        "total": len(EXPECTED_CHECK_RESULT_IDS),
        "score": f"{len(EXPECTED_CHECK_RESULT_IDS)}/{len(EXPECTED_CHECK_RESULT_IDS)}",
        "results": [
            {
                "id": result_id,
                "level": "pass",
                "passed": True,
                "message": "fixture pass",
            }
            for result_id in EXPECTED_CHECK_RESULT_IDS
        ],
    }


def passing_check_artifact_json(file_path: str = EXPECTED_CHECK_ARTIFACT_NAME) -> str:
    return json.dumps(passing_check_report_payload(file_path=file_path))


def passing_check_examples_json() -> str:
    return json.dumps({
        "mode": "examples",
        "routeId": EXPECTED_ROUTE_ID,
        "query": EXPECTED_EXAMPLES_EFFECTIVE_QUERY,
        "limit": EXPECTED_CHECK_EXAMPLES_LIMIT,
        "status": "pass",
        "total": 1,
        "passed": 1,
        "warned": 0,
        "failed": 0,
        "examples": [
            {
                "example": {
                    "relPath": EXPECTED_EXAMPLES_HIT,
                    "title": "`Button` - spec",
                    "category": EXPECTED_EXAMPLES_CATEGORY,
                    "score": 57,
                    "preview": "Status: example artifact for component-spec-writer skill",
                },
                "report": passing_check_report_payload(file_path=f"/tmp/design-ai/{EXPECTED_EXAMPLES_HIT}"),
            }
        ],
    })


def passing_check_all_routes_issues_only_output() -> str:
    return "\n".join([
        "",
        "  design-ai check examples",
        "  all routes",
        "",
        "Source: /tmp/design-ai",
        "Status: pass",
        "Routes: 18 (0 fail, 0 warn, 18 pass)",
        "Examples: 18 (0 fail, 0 warn, 18 pass)",
        "",
    ])


def assert_corpus_json_keys(
    value: object,
    expected_keys: list[str],
    *,
    label: str,
    context: str,
    command_label: str,
) -> dict[str, object]:
    if not isinstance(value, dict):
        raise SystemExit(f"{command_label} after {context} {label} is not an object")
    if list(value) != expected_keys:
        raise SystemExit(f"{command_label} after {context} {label} keys changed")
    return value


def is_corpus_json_positive_int(value: object) -> bool:
    return type(value) is int and value >= 1


def assert_corpus_file_path(
    value: object,
    rel_path: str,
    *,
    label: str,
    context: str,
    command_label: str,
) -> None:
    if not isinstance(value, str) or not value:
        raise SystemExit(f"{command_label} after {context} {label} file is missing")
    if not Path(value).is_absolute():
        raise SystemExit(f"{command_label} after {context} {label} file is not absolute")
    if not value.endswith(rel_path):
        raise SystemExit(f"{command_label} after {context} {label} file differs from expected path")


def assert_search_json_contains_hit(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"failed to parse search JSON after {context}") from error

    payload = assert_corpus_json_keys(
        payload,
        ["query", "hits"],
        label="top-level",
        context=context,
        command_label="search JSON",
    )

    if payload.get("query") != EXPECTED_CORPUS_SEARCH_QUERY:
        raise SystemExit(f"search JSON after {context} query differs from expected query")

    hits = payload.get("hits")
    if not isinstance(hits, list):
        raise SystemExit(f"search JSON after {context} hits is not a list")
    if not hits:
        raise SystemExit(f"search JSON after {context} does not contain any hits")
    if len(hits) != 1:
        raise SystemExit(f"search JSON after {context} hit count differs from expected limit")

    for hit in hits:
        hit = assert_corpus_json_keys(
            hit,
            ["file", "lineNumber", "relPath", "preview"],
            label="hit",
            context=context,
            command_label="search JSON",
        )
        if hit.get("relPath") != EXPECTED_CORPUS_SEARCH_HIT:
            continue
        assert_corpus_file_path(
            hit.get("file"),
            EXPECTED_CORPUS_SEARCH_HIT,
            label="hit",
            context=context,
            command_label="search JSON",
        )
        preview = hit.get("preview")
        line_number = hit.get("lineNumber")
        if not is_corpus_json_positive_int(line_number):
            raise SystemExit(f"search JSON after {context} has invalid line number for expected hit")
        if not isinstance(preview, str) or EXPECTED_CORPUS_SEARCH_PREVIEW not in preview:
            raise SystemExit(f"search JSON after {context} has invalid preview for expected hit")
        return

    raise SystemExit(
        f"search JSON after {context} is missing expected hit: {EXPECTED_CORPUS_SEARCH_HIT}"
    )


def assert_search_human_output(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    if raw.lstrip().startswith("{"):
        raise SystemExit(f"search human output after {context} looks like JSON output")

    assert_contains_fragments(
        raw,
        (
            "design-ai search",
            EXPECTED_CORPUS_SEARCH_QUERY,
            "Hits: 1",
            f"{EXPECTED_CORPUS_SEARCH_HIT}:29",
            EXPECTED_CORPUS_SEARCH_PREVIEW,
        ),
        context=context,
        label="search human output",
    )


def assert_show_json_line(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"failed to parse show JSON after {context}") from error

    payload = assert_corpus_json_keys(
        payload,
        ["file", "relPath", "start", "end", "totalLines", "lines"],
        label="top-level",
        context=context,
        command_label="show JSON",
    )

    if payload.get("relPath") != EXPECTED_CORPUS_SHOW_REL_PATH:
        raise SystemExit(f"show JSON after {context} relPath differs from expected path")
    assert_corpus_file_path(
        payload.get("file"),
        EXPECTED_CORPUS_SHOW_REL_PATH,
        label="top-level",
        context=context,
        command_label="show JSON",
    )

    if not is_corpus_json_positive_int(payload.get("start")) or not is_corpus_json_positive_int(payload.get("end")):
        raise SystemExit(f"show JSON after {context} range uses invalid line numbers")
    if payload.get("start") != 1 or payload.get("end") != 1:
        raise SystemExit(f"show JSON after {context} range differs from expected line")
    if not is_corpus_json_positive_int(payload.get("totalLines")) or payload["totalLines"] < payload["end"]:
        raise SystemExit(f"show JSON after {context} totalLines is invalid")

    lines = payload.get("lines")
    if not isinstance(lines, list) or len(lines) != 1:
        raise SystemExit(f"show JSON after {context} does not contain exactly one line")

    line = assert_corpus_json_keys(
        lines[0],
        ["number", "text"],
        label="line",
        context=context,
        command_label="show JSON",
    )

    if not is_corpus_json_positive_int(line.get("number")):
        raise SystemExit(f"show JSON after {context} line number is invalid")
    if line.get("number") != 1 or line.get("text") != EXPECTED_CORPUS_SHOW_TEXT:
        raise SystemExit(f"show JSON after {context} line content differs from expected content")


def assert_show_json_range(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"failed to parse show range JSON after {context}") from error

    payload = assert_corpus_json_keys(
        payload,
        ["file", "relPath", "start", "end", "totalLines", "lines"],
        label="top-level",
        context=context,
        command_label="show range JSON",
    )

    if payload.get("relPath") != EXPECTED_CORPUS_SHOW_REL_PATH:
        raise SystemExit(f"show range JSON after {context} relPath differs from expected path")
    assert_corpus_file_path(
        payload.get("file"),
        EXPECTED_CORPUS_SHOW_REL_PATH,
        label="top-level",
        context=context,
        command_label="show range JSON",
    )

    if not is_corpus_json_positive_int(payload.get("start")) or not is_corpus_json_positive_int(payload.get("end")):
        raise SystemExit(f"show range JSON after {context} range uses invalid line numbers")
    if payload.get("start") != 1 or payload.get("end") != 2:
        raise SystemExit(f"show range JSON after {context} range differs from expected lines")
    if not is_corpus_json_positive_int(payload.get("totalLines")) or payload["totalLines"] < payload["end"]:
        raise SystemExit(f"show range JSON after {context} totalLines is invalid")

    lines = payload.get("lines")
    if not isinstance(lines, list) or len(lines) != 2:
        raise SystemExit(f"show range JSON after {context} does not contain exactly two lines")

    expected = (
        (1, EXPECTED_CORPUS_SHOW_TEXT),
        (2, EXPECTED_CORPUS_SHOW_RANGE_END_TEXT),
    )
    for line, (number, text) in zip(lines, expected, strict=True):
        line = assert_corpus_json_keys(
            line,
            ["number", "text"],
            label="line",
            context=context,
            command_label="show range JSON",
        )
        if not is_corpus_json_positive_int(line.get("number")):
            raise SystemExit(f"show range JSON after {context} line number is invalid")
        if line.get("number") != number or line.get("text") != text:
            raise SystemExit(f"show range JSON after {context} line content differs from expected content")


def assert_show_human_output(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    if raw.lstrip().startswith("{"):
        raise SystemExit(f"show human output after {context} looks like JSON output")

    assert_contains_fragments(
        raw,
        (
            "design-ai show",
            EXPECTED_CORPUS_SHOW_REL_PATH,
            "Lines: 1-1 of",
            f"1 | {EXPECTED_CORPUS_SHOW_TEXT}",
        ),
        context=context,
        label="show human output",
    )


def assert_show_human_range_output(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    if raw.lstrip().startswith("{"):
        raise SystemExit(f"show range human output after {context} looks like JSON output")

    assert_contains_fragments(
        raw,
        (
            "design-ai show",
            EXPECTED_CORPUS_SHOW_REL_PATH,
            "Lines: 1-2 of",
            f"1 | {EXPECTED_CORPUS_SHOW_TEXT}",
            f"2 | {EXPECTED_CORPUS_SHOW_RANGE_END_TEXT}",
        ),
        context=context,
        label="show range human output",
    )


def assert_examples_json_route_hit(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"failed to parse examples JSON after {context}") from error

    payload = assert_corpus_json_keys(
        payload,
        ["query", "routeId", "effectiveQuery", "examples"],
        label="top-level",
        context=context,
        command_label="examples JSON",
    )

    if payload.get("query") != "":
        raise SystemExit(f"examples JSON after {context} query differs from expected route-biased query")

    if payload.get("routeId") != EXPECTED_EXAMPLES_ROUTE:
        raise SystemExit(f"examples JSON after {context} routeId differs from expected route")

    effective_query = payload.get("effectiveQuery")
    if not isinstance(effective_query, str) or EXPECTED_EXAMPLES_EFFECTIVE_QUERY not in effective_query:
        raise SystemExit(f"examples JSON after {context} effectiveQuery differs from expected query")

    examples = payload.get("examples")
    if not isinstance(examples, list):
        raise SystemExit(f"examples JSON after {context} examples is not a list")
    if not examples:
        raise SystemExit(f"examples JSON after {context} does not contain any examples")
    if len(examples) != 1:
        raise SystemExit(f"examples JSON after {context} example count differs from expected limit")

    first = assert_corpus_json_keys(
        examples[0],
        ["relPath", "title", "category", "score", "preview"],
        label="example",
        context=context,
        command_label="examples JSON",
    )

    if first.get("relPath") != EXPECTED_EXAMPLES_HIT:
        raise SystemExit(f"examples JSON after {context} first example differs from expected hit")

    if first.get("category") != EXPECTED_EXAMPLES_CATEGORY:
        raise SystemExit(f"examples JSON after {context} category differs from expected category")

    title = first.get("title")
    if not isinstance(title, str) or EXPECTED_EXAMPLES_TITLE_FRAGMENT not in title:
        raise SystemExit(f"examples JSON after {context} title differs from expected title")

    score = first.get("score")
    if not is_corpus_json_positive_int(score):
        raise SystemExit(f"examples JSON after {context} score is not a positive integer")

    preview = first.get("preview")
    if not isinstance(preview, str) or not preview:
        raise SystemExit(f"examples JSON after {context} preview is missing")


def assert_examples_human_output(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    if raw.lstrip().startswith("{"):
        raise SystemExit(f"examples human output after {context} looks like JSON output")

    assert_contains_fragments(
        raw,
        (
            "design-ai examples",
            EXPECTED_EXAMPLES_ROUTE,
            f"Effective query: {EXPECTED_EXAMPLES_EFFECTIVE_QUERY}",
            "Examples: 1",
            EXPECTED_EXAMPLES_HIT,
            EXPECTED_EXAMPLES_TITLE_FRAGMENT,
            EXPECTED_EXAMPLES_CATEGORY,
            "Status: example artifact",
        ),
        context=context,
        label="examples human output",
    )


def assert_list_catalog_output(raw: str, *, kind: str, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)

    expected_items = EXPECTED_LIST_CATALOG.get(kind)
    if expected_items is None:
        raise SystemExit(f"unsupported list catalog kind for smoke assertion: {kind}")

    assert_contains_fragments(
        raw,
        (
            "design-ai catalog",
            f"{kind} ({len(expected_items)})",
        ),
        context=context,
        label="list catalog output",
    )

    if not re.search(r"Plugin:\s+design-ai v\d+\.\d+\.\d+", raw):
        raise SystemExit(f"list catalog output after {context} plugin version line differs from expected format")

    for item in expected_items:
        if not re.search(rf"^\s+{re.escape(item)}\s*$", raw, flags=re.MULTILINE):
            raise SystemExit(f"list catalog output after {context} is missing expected {kind} item: {item}")

    for other_kind in EXPECTED_LIST_CATALOG:
        if other_kind == kind:
            continue
        if re.search(rf"^{re.escape(other_kind)} \(\d+\)", raw, flags=re.MULTILINE):
            raise SystemExit(
                f"list catalog output after {context} included unexpected {other_kind} section for {kind} filter"
            )


def assert_list_catalog_json(raw: str, *, kind: str, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)

    expected_items = EXPECTED_LIST_CATALOG.get(kind)
    if expected_items is None:
        raise SystemExit(f"unsupported list catalog kind for smoke assertion: {kind}")

    try:
        catalog = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"list catalog JSON after {context} is not valid JSON: {error}") from error

    if list(catalog) != ["name", "version", "kind", "sections"]:
        raise SystemExit(f"list catalog JSON after {context} top-level keys changed")
    if catalog.get("name") != "design-ai":
        raise SystemExit(f"list catalog JSON after {context} plugin name is not design-ai")
    if not re.fullmatch(r"\d+\.\d+\.\d+", str(catalog.get("version", ""))):
        raise SystemExit(f"list catalog JSON after {context} version differs from expected semver")
    if catalog.get("kind") != kind:
        raise SystemExit(f"list catalog JSON after {context} kind differs from expected {kind}")

    sections = catalog.get("sections")
    if not isinstance(sections, list) or len(sections) != 1:
        raise SystemExit(f"list catalog JSON after {context} should contain exactly one section")

    section = sections[0]
    if not isinstance(section, dict):
        raise SystemExit(f"list catalog JSON after {context} section is not an object")
    if list(section) != ["kind", "count", "items"]:
        raise SystemExit(f"list catalog JSON after {context} section keys changed")
    if section.get("kind") != kind:
        raise SystemExit(f"list catalog JSON after {context} section kind differs from expected {kind}")
    if section.get("count") != len(expected_items):
        raise SystemExit(f"list catalog JSON after {context} section count differs from expected {len(expected_items)}")

    items = section.get("items")
    if not isinstance(items, list):
        raise SystemExit(f"list catalog JSON after {context} items is not a list")
    observed_names = []
    for item in items:
        if not isinstance(item, dict):
            raise SystemExit(f"list catalog JSON after {context} item is not an object")
        if list(item) != ["name", "path", "description"]:
            raise SystemExit(f"list catalog JSON after {context} item keys changed")
        observed_names.append(item.get("name"))
        if item.get("path") != list_catalog_item_path(kind, str(item.get("name", ""))):
            raise SystemExit(f"list catalog JSON after {context} item path differs for {item.get('name')}")
        if not isinstance(item.get("description"), str) or not item["description"]:
            raise SystemExit(f"list catalog JSON after {context} item description is missing for {item.get('name')}")

    if tuple(observed_names) != expected_items:
        raise SystemExit(f"list catalog JSON after {context} item order differs from expected {kind} catalog")


def find_existing_path(entries: object, path: str, *, context: str, label: str) -> None:
    if not isinstance(entries, list):
        raise SystemExit(f"route JSON after {context} {label} is not a list")

    for entry in entries:
        if not isinstance(entry, dict):
            continue
        if entry.get("path") == path:
            if entry.get("exists") is not True:
                raise SystemExit(f"route JSON after {context} {label} path is not available: {path}")
            return

    raise SystemExit(f"route JSON after {context} is missing expected {label} path: {path}")


def assert_route_json_component_spec(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"failed to parse route JSON after {context}") from error

    if not isinstance(payload, dict):
        raise SystemExit(f"route JSON after {context} is not an object")

    if payload.get("brief") != EXPECTED_ROUTE_BRIEF:
        raise SystemExit(f"route JSON after {context} brief differs from expected brief")

    version = payload.get("version")
    if not isinstance(version, str) or not version or version == "unknown":
        raise SystemExit(f"route JSON after {context} version is missing")

    routes = payload.get("routes")
    if not isinstance(routes, list) or len(routes) != 1:
        raise SystemExit(f"route JSON after {context} does not contain exactly one route")

    route = routes[0]
    if not isinstance(route, dict):
        raise SystemExit(f"route JSON after {context} contains an invalid route entry")

    if route.get("id") != EXPECTED_ROUTE_ID:
        raise SystemExit(f"route JSON after {context} first route differs from expected route")

    if route.get("label") != EXPECTED_ROUTE_LABEL:
        raise SystemExit(f"route JSON after {context} label differs from expected label")

    if route.get("confidence") != "high":
        raise SystemExit(f"route JSON after {context} confidence differs from expected confidence")

    matched = route.get("matchedKeywords")
    if not isinstance(matched, list):
        raise SystemExit(f"route JSON after {context} matchedKeywords is not a list")
    missing_keywords = [keyword for keyword in EXPECTED_ROUTE_MATCHED_KEYWORDS if keyword not in matched]
    if missing_keywords:
        raise SystemExit(
            f"route JSON after {context} is missing expected matched keyword(s): {', '.join(missing_keywords)}"
        )

    score = route.get("score")
    if not isinstance(score, int) or score < len(EXPECTED_ROUTE_MATCHED_KEYWORDS):
        raise SystemExit(f"route JSON after {context} score is lower than expected keyword coverage")

    command = route.get("command")
    if not isinstance(command, dict):
        raise SystemExit(f"route JSON after {context} command is not an object")
    if command.get("path") != EXPECTED_ROUTE_COMMAND or command.get("exists") is not True:
        raise SystemExit(f"route JSON after {context} command differs from expected available command")

    find_existing_path(route.get("skills"), EXPECTED_ROUTE_SKILL, context=context, label="skills")
    find_existing_path(route.get("agents"), EXPECTED_ROUTE_AGENT, context=context, label="agents")
    find_existing_path(route.get("knowledge"), EXPECTED_ROUTE_KNOWLEDGE, context=context, label="knowledge")

    explanation = route.get("explanation")
    if not isinstance(explanation, dict):
        raise SystemExit(f"route JSON after {context} explanation is not an object")

    summary = explanation.get("summary")
    if not isinstance(summary, str) or "Matched" not in summary:
        raise SystemExit(f"route JSON after {context} explanation summary differs from expected match summary")

    missing_references = explanation.get("missingReferences")
    if missing_references != []:
        raise SystemExit(f"route JSON after {context} contains missing references")

    coverage = explanation.get("referenceCoverage")
    total = coverage.get("total") if isinstance(coverage, dict) else None
    if not isinstance(total, dict) or total.get("available") != total.get("total") or total.get("total", 0) < 1:
        raise SystemExit(f"route JSON after {context} does not report full reference coverage")


def assert_route_explain_human_output(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    if raw.lstrip().startswith("{"):
        raise SystemExit(f"route explain human output after {context} looks like JSON output")

    assert_contains_fragments(
        raw,
        (
            "design-ai route",
            EXPECTED_ROUTE_BRIEF,
            EXPECTED_ROUTE_LABEL,
            f"id:      {EXPECTED_ROUTE_ID}",
            f"matched: {', '.join(EXPECTED_ROUTE_MATCHED_KEYWORDS)}",
            f"why:     Matched {len(EXPECTED_ROUTE_MATCHED_KEYWORDS)} keywords: {', '.join(EXPECTED_ROUTE_MATCHED_KEYWORDS)}.",
            "refs:",
            f"command: ✓ {EXPECTED_ROUTE_COMMAND}",
            f"skill:   ✓ {EXPECTED_ROUTE_SKILL}",
            f"agent:   ✓ {EXPECTED_ROUTE_AGENT}",
            "read:    ✓ knowledge/PRINCIPLES.md",
            f"read:    ✓ {EXPECTED_ROUTE_KNOWLEDGE}",
        ),
        context=context,
        label="route explain human output",
    )


def assert_route_catalog_json(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"failed to parse route catalog JSON after {context}") from error

    if not isinstance(payload, dict):
        raise SystemExit(f"route catalog JSON after {context} is not an object")

    version = payload.get("version")
    if not isinstance(version, str) or not version or version == "unknown":
        raise SystemExit(f"route catalog JSON after {context} version is missing")

    routes = payload.get("routes")
    if not isinstance(routes, list) or not routes:
        raise SystemExit(f"route catalog JSON after {context} does not contain route entries")
    if not all(isinstance(route, dict) for route in routes):
        raise SystemExit(f"route catalog JSON after {context} contains a non-object route entry")

    route_ids = [
        route.get("id")
        for route in routes
    ]
    if route_ids != list(EXPECTED_ROUTE_CATALOG_IDS):
        raise SystemExit(f"route catalog JSON after {context} route ids differ from expected catalog order")

    if len(set(route_ids)) != len(route_ids):
        raise SystemExit(f"route catalog JSON after {context} contains duplicate route ids")

    route_by_id = {route.get("id"): route for route in routes if isinstance(route, dict)}
    for route_id in EXPECTED_ROUTE_CATALOG_IDS:
        route = route_by_id.get(route_id)
        if not isinstance(route, dict):
            raise SystemExit(f"route catalog JSON after {context} is missing expected route: {route_id}")

        if route.get("confidence") != "catalog":
            raise SystemExit(f"route catalog JSON after {context} route is not marked as catalog: {route_id}")
        if route.get("matchedKeywords") != []:
            raise SystemExit(f"route catalog JSON after {context} route has matched keywords in catalog mode: {route_id}")

        label = route.get("label")
        if not isinstance(label, str) or not label:
            raise SystemExit(f"route catalog JSON after {context} route label is missing: {route_id}")

        explanation = route.get("explanation")
        if not isinstance(explanation, dict):
            raise SystemExit(f"route catalog JSON after {context} route explanation is not an object: {route_id}")
        summary = explanation.get("summary")
        if not isinstance(summary, str) or "Catalog listing" not in summary:
            raise SystemExit(f"route catalog JSON after {context} route explanation summary differs from expected catalog mode: {route_id}")
        if explanation.get("missingReferences") != []:
            raise SystemExit(f"route catalog JSON after {context} route contains missing references: {route_id}")
        coverage = explanation.get("referenceCoverage")
        total = coverage.get("total") if isinstance(coverage, dict) else None
        available_count = total.get("available") if isinstance(total, dict) else None
        total_count = total.get("total") if isinstance(total, dict) else None
        if (
            not isinstance(available_count, int)
            or not isinstance(total_count, int)
            or total_count <= 0
            or available_count != total_count
        ):
            raise SystemExit(f"route catalog JSON after {context} route does not report full reference coverage: {route_id}")

    component_route = route_by_id[EXPECTED_ROUTE_ID]
    if component_route.get("label") != EXPECTED_ROUTE_LABEL:
        raise SystemExit(f"route catalog JSON after {context} component route label differs from expected label")
    command = component_route.get("command")
    if not isinstance(command, dict) or command.get("path") != EXPECTED_ROUTE_COMMAND or command.get("exists") is not True:
        raise SystemExit(f"route catalog JSON after {context} component route command differs from expected available command")

    find_existing_path(component_route.get("skills"), EXPECTED_ROUTE_SKILL, context=context, label="component route skills")
    find_existing_path(component_route.get("agents"), EXPECTED_ROUTE_AGENT, context=context, label="component route agents")
    find_existing_path(component_route.get("knowledge"), EXPECTED_ROUTE_KNOWLEDGE, context=context, label="component route knowledge")

    keywords = component_route.get("keywords")
    if not isinstance(keywords, list) or not all(keyword in keywords for keyword in ("component", "button", "spec")):
        raise SystemExit(f"route catalog JSON after {context} component route keywords differ from expected discovery terms")


def find_payload_path(entries: object, path: str, *, context: str, payload_name: str, label: str) -> None:
    if not isinstance(entries, list):
        raise SystemExit(f"{payload_name} after {context} {label} is not a list")

    for entry in entries:
        if not isinstance(entry, dict):
            continue
        if entry.get("path") == path:
            if entry.get("exists") is not True:
                raise SystemExit(f"{payload_name} after {context} {label} path is not available: {path}")
            return

    raise SystemExit(f"{payload_name} after {context} is missing expected {label} path: {path}")


def assert_prompt_payload_component_spec(payload: object, *, context: str, payload_name: str) -> None:
    if not isinstance(payload, dict):
        raise SystemExit(f"{payload_name} after {context} is not an object")

    if payload.get("brief") != EXPECTED_ROUTE_BRIEF:
        raise SystemExit(f"{payload_name} after {context} brief differs from expected brief")

    version = payload.get("version")
    if not isinstance(version, str) or not version or version == "unknown":
        raise SystemExit(f"{payload_name} after {context} version is missing")

    route = payload.get("route")
    if not isinstance(route, dict):
        raise SystemExit(f"{payload_name} after {context} route is not an object")

    if route.get("id") != EXPECTED_ROUTE_ID:
        raise SystemExit(f"{payload_name} after {context} route differs from expected route")

    if route.get("label") != EXPECTED_ROUTE_LABEL:
        raise SystemExit(f"{payload_name} after {context} route label differs from expected label")

    if route.get("confidence") != "forced" or route.get("forced") is not True:
        raise SystemExit(f"{payload_name} after {context} route is not marked as forced")

    command = route.get("command")
    if not isinstance(command, dict):
        raise SystemExit(f"{payload_name} after {context} command is not an object")
    if command.get("path") != EXPECTED_ROUTE_COMMAND or command.get("exists") is not True:
        raise SystemExit(f"{payload_name} after {context} command differs from expected available command")

    find_payload_path(route.get("skills"), EXPECTED_ROUTE_SKILL, context=context, payload_name=payload_name, label="skills")
    find_payload_path(route.get("agents"), EXPECTED_ROUTE_AGENT, context=context, payload_name=payload_name, label="agents")
    find_payload_path(route.get("knowledge"), EXPECTED_ROUTE_KNOWLEDGE, context=context, payload_name=payload_name, label="knowledge")

    explanation = route.get("explanation")
    if not isinstance(explanation, dict):
        raise SystemExit(f"{payload_name} after {context} route explanation is not an object")

    if explanation.get("missingReferences") != []:
        raise SystemExit(f"{payload_name} after {context} route contains missing references")

    coverage = explanation.get("referenceCoverage")
    total = coverage.get("total") if isinstance(coverage, dict) else None
    if not isinstance(total, dict) or total.get("available") != total.get("total") or total.get("total", 0) < 1:
        raise SystemExit(f"{payload_name} after {context} does not report full route reference coverage")

    slash_command = payload.get("slashCommand")
    if (
        not isinstance(slash_command, str)
        or not slash_command.startswith("/")
        or not slash_command.endswith("component-spec")
    ):
        raise SystemExit(f"{payload_name} after {context} slash command differs from expected command")

    examples = payload.get("referenceExamples")
    if not isinstance(examples, list) or not examples:
        raise SystemExit(f"{payload_name} after {context} does not contain reference examples")

    first_example = examples[0]
    if not isinstance(first_example, dict):
        raise SystemExit(f"{payload_name} after {context} contains an invalid reference example")

    if first_example.get("relPath") != EXPECTED_EXAMPLES_HIT:
        raise SystemExit(f"{payload_name} after {context} first reference example differs from expected hit")

    example_title = first_example.get("title")
    if not isinstance(example_title, str) or EXPECTED_EXAMPLES_TITLE_FRAGMENT not in example_title:
        raise SystemExit(f"{payload_name} after {context} first reference example title differs from expected title")

    files_to_read = payload.get("filesToRead")
    if not isinstance(files_to_read, list) or not all(isinstance(item, str) for item in files_to_read):
        raise SystemExit(f"{payload_name} after {context} filesToRead is not a string list")

    if not files_to_read or files_to_read[0] != "AGENTS.md":
        raise SystemExit(f"{payload_name} after {context} filesToRead does not start with AGENTS.md")

    missing_files = [path for path in EXPECTED_PROMPT_FILES if path not in files_to_read]
    if missing_files:
        raise SystemExit(
            f"{payload_name} after {context} is missing expected file(s): {', '.join(missing_files)}"
        )

    if len(files_to_read) != len(set(files_to_read)):
        raise SystemExit(f"{payload_name} after {context} filesToRead contains duplicate paths")

    checklist = payload.get("checklist")
    if not isinstance(checklist, list) or not all(isinstance(item, str) for item in checklist):
        raise SystemExit(f"{payload_name} after {context} checklist is not a string list")

    expected_checklist_fragments = (
        "Cover anatomy, variants, states",
        "Cite Ant Design, MUI, and shadcn-ui references",
    )
    for fragment in expected_checklist_fragments:
        if not any(fragment in item for item in checklist):
            raise SystemExit(f"{payload_name} after {context} checklist is missing expected item: {fragment}")

    if payload.get("qualityCommand") != EXPECTED_PROMPT_QUALITY_COMMAND:
        raise SystemExit(f"{payload_name} after {context} quality command differs from expected command")

    prompt = payload.get("prompt")
    if not isinstance(prompt, str):
        raise SystemExit(f"{payload_name} after {context} prompt is not a string")

    expected_prompt_fragments = (
        "# design-ai task prompt",
        slash_command,
        "Reference examples:",
        EXPECTED_EXAMPLES_HIT,
        EXPECTED_PROMPT_QUALITY_COMMAND,
        "Verification checklist:",
    )
    for fragment in expected_prompt_fragments:
        if fragment not in prompt:
            raise SystemExit(f"{payload_name} after {context} prompt is missing expected content: {fragment}")


def assert_prompt_json_component_spec(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"failed to parse prompt JSON after {context}") from error

    assert_prompt_payload_component_spec(payload, context=context, payload_name="prompt JSON")


def assert_prompt_markdown_component_spec(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    if raw.lstrip().startswith("{"):
        raise SystemExit(f"prompt markdown after {context} looks like JSON output")

    required_fragments = (
        "design-ai prompt",
        EXPECTED_ROUTE_BRIEF,
        "Corpus version:",
    )
    assert_contains_fragments(raw, required_fragments, context=context, label="prompt markdown")
    assert_prompt_markdown_body_component_spec(raw, context=context, cmd=cmd)


def assert_prompt_markdown_body_component_spec(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    if raw.lstrip().startswith("{"):
        raise SystemExit(f"prompt markdown body after {context} looks like JSON output")

    required_fragments = (
        "# design-ai task prompt",
        f"Task: {EXPECTED_ROUTE_BRIEF}",
        f"Selected route: {EXPECTED_ROUTE_LABEL} (forced)",
        f"Route id: {EXPECTED_ROUTE_ID}",
        "Routing reason: Route selected explicitly with --route.",
        "Matched keywords: route selected via --route",
        "Preferred command:",
        "Reference examples:",
        EXPECTED_EXAMPLES_HIT,
        "Before producing the artifact, read these files in order:",
        *EXPECTED_PROMPT_FILES,
        "Execution rules:",
        "Suggested artifact QA command:",
        EXPECTED_PROMPT_QUALITY_COMMAND,
        "Verification checklist:",
        "Cover anatomy, variants, states",
        "Cite Ant Design, MUI, and shadcn-ui references",
    )
    assert_contains_fragments(raw, required_fragments, context=context, label="prompt markdown body")

    command_pattern = rf"/[A-Za-z0-9_-]*{re.escape(EXPECTED_ROUTE_ID)}\s+{re.escape(EXPECTED_ROUTE_BRIEF)}"
    if not re.search(command_pattern, raw):
        raise SystemExit(f"prompt markdown body after {context} preferred command differs from expected route command")


def assert_pack_json_component_spec(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"failed to parse pack JSON after {context}") from error

    if not isinstance(payload, dict):
        raise SystemExit(f"pack JSON after {context} is not an object")

    if payload.get("brief") != EXPECTED_ROUTE_BRIEF:
        raise SystemExit(f"pack JSON after {context} brief differs from expected brief")

    version = payload.get("version")
    if not isinstance(version, str) or not version or version == "unknown":
        raise SystemExit(f"pack JSON after {context} version is missing")

    if payload.get("maxBytes") != EXPECTED_PACK_MAX_BYTES:
        raise SystemExit(f"pack JSON after {context} maxBytes differs from expected budget")

    used_bytes = payload.get("usedBytes")
    if not isinstance(used_bytes, int) or used_bytes < 1 or used_bytes > EXPECTED_PACK_MAX_BYTES:
        raise SystemExit(f"pack JSON after {context} usedBytes is outside expected budget")

    summary = payload.get("summary")
    if not isinstance(summary, dict):
        raise SystemExit(f"pack JSON after {context} summary is not an object")

    if summary.get("missingFiles") != 0:
        raise SystemExit(f"pack JSON after {context} contains missing context files")

    if summary.get("status") != "partial":
        raise SystemExit(f"pack JSON after {context} status differs from expected partial status")

    total_files = summary.get("totalFiles")
    included_files = summary.get("includedFiles")
    if not isinstance(total_files, int) or not isinstance(included_files, int) or included_files != total_files:
        raise SystemExit(f"pack JSON after {context} does not include every expected context file")

    truncated_files = summary.get("truncatedFiles")
    if not isinstance(truncated_files, int) or truncated_files < 1:
        raise SystemExit(f"pack JSON after {context} does not report truncated context files")

    plan = payload.get("plan")
    assert_prompt_payload_component_spec(plan, context=context, payload_name="pack JSON plan")

    files = payload.get("files")
    if not isinstance(files, list):
        raise SystemExit(f"pack JSON after {context} files is not a list")

    file_paths = []
    for file_entry in files:
        if not isinstance(file_entry, dict):
            raise SystemExit(f"pack JSON after {context} contains an invalid file entry")
        file_path = file_entry.get("path")
        if isinstance(file_path, str):
            file_paths.append(file_path)
        if file_path in ("AGENTS.md", EXPECTED_EXAMPLES_HIT):
            if file_entry.get("included") is not True:
                raise SystemExit(f"pack JSON after {context} did not include expected context file: {file_path}")
            included_bytes = file_entry.get("includedBytes")
            if not isinstance(included_bytes, int) or included_bytes < 1:
                raise SystemExit(f"pack JSON after {context} has invalid includedBytes for {file_path}")

    missing_files = [path for path in EXPECTED_PROMPT_FILES if path not in file_paths]
    if missing_files:
        raise SystemExit(
            f"pack JSON after {context} is missing expected context file(s): {', '.join(missing_files)}"
        )

    warnings = payload.get("warnings")
    if not isinstance(warnings, list) or not any(
        isinstance(warning, str) and "Truncated context file" in warning
        for warning in warnings
    ):
        raise SystemExit(f"pack JSON after {context} does not report truncation warnings")

    markdown = payload.get("markdown")
    if not isinstance(markdown, str):
        raise SystemExit(f"pack JSON after {context} markdown is not a string")

    expected_markdown_fragments = (
        "# design-ai prompt pack",
        "## Context Summary",
        EXPECTED_PROMPT_QUALITY_COMMAND,
        "## Context Files",
        "### AGENTS.md",
        f"### {EXPECTED_EXAMPLES_HIT}",
    )
    for fragment in expected_markdown_fragments:
        if fragment not in markdown:
            raise SystemExit(f"pack JSON after {context} markdown is missing expected content: {fragment}")


def assert_pack_markdown_component_spec(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    if raw.lstrip().startswith("{"):
        raise SystemExit(f"pack markdown after {context} looks like JSON output")

    required_fragments = (
        "design-ai pack",
        f"Context: partial, {EXPECTED_PACK_MAX_BYTES}/{EXPECTED_PACK_MAX_BYTES} bytes",
    )
    assert_contains_fragments(raw, required_fragments, context=context, label="pack markdown")
    assert_pack_markdown_body_component_spec(raw, context=context, cmd=cmd)


def assert_pack_markdown_body_component_spec(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    if raw.lstrip().startswith("{"):
        raise SystemExit(f"pack markdown body after {context} looks like JSON output")

    required_fragments = (
        "# design-ai prompt pack",
        f"Brief: {EXPECTED_ROUTE_BRIEF}",
        f"Route: {EXPECTED_ROUTE_LABEL} (forced)",
        "Context status: partial",
        f"Context budget: {EXPECTED_PACK_MAX_BYTES}/{EXPECTED_PACK_MAX_BYTES} bytes",
        "## Context Summary",
        "- Missing files: 0",
        "Warnings:",
        "Truncated context file:",
        f"Context budget exhausted at {EXPECTED_PACK_MAX_BYTES}/{EXPECTED_PACK_MAX_BYTES} bytes",
        "## Prompt",
        "# design-ai task prompt",
        f"Task: {EXPECTED_ROUTE_BRIEF}",
        f"Selected route: {EXPECTED_ROUTE_LABEL} (forced)",
        "Reference examples:",
        EXPECTED_EXAMPLES_HIT,
        EXPECTED_PROMPT_QUALITY_COMMAND,
        "## Context Files",
        "### AGENTS.md",
        f"### {EXPECTED_EXAMPLES_HIT}",
        *EXPECTED_PROMPT_FILES,
    )
    assert_contains_fragments(raw, required_fragments, context=context, label="pack markdown body")

    command_pattern = rf"/[A-Za-z0-9_-]*{re.escape(EXPECTED_ROUTE_ID)}\s+{re.escape(EXPECTED_ROUTE_BRIEF)}"
    if not re.search(command_pattern, raw):
        raise SystemExit(f"pack markdown body after {context} preferred command differs from expected route command")


def assert_audit_strict_quiet_output(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)

    required_fragments = (
        "design-ai audit",
        "Run repository quality checks",
        "Runner: tools/audit/run-all.py",
        f"Running {EXPECTED_AUDIT_COUNT} audits from tools/audit/",
        f"All {EXPECTED_AUDIT_COUNT} audits passed",
    )
    missing = [fragment for fragment in required_fragments if fragment not in raw]
    if missing:
        raise SystemExit(
            f"audit output after {context} missing expected content: {' | '.join(missing)}"
        )

    if not re.search(rf"All {EXPECTED_AUDIT_COUNT} audits passed in \d+(?:\.\d+)?s", raw):
        raise SystemExit(f"audit output after {context} success summary differs from expected format")

    if re.search(r"\bfailed\b|audit\(s\) failed|✗", raw, flags=re.IGNORECASE):
        raise SystemExit(f"audit output after {context} reports failures")


def assert_audit_json_keys(value: object, expected_keys: list[str], *, label: str, context: str) -> dict[str, object]:
    if not isinstance(value, dict):
        raise SystemExit(f"audit JSON after {context} {label} is not an object")
    if list(value) != expected_keys:
        raise SystemExit(f"audit JSON after {context} {label} keys changed")
    return value


def is_audit_json_non_negative_int(value: object) -> bool:
    return type(value) is int and value >= 0


def is_audit_json_non_negative_number(value: object) -> bool:
    return type(value) in (int, float) and value >= 0


def assert_audit_json(
    raw: str,
    *,
    context: str,
    cmd: list[str],
    strict: bool = True,
    quiet: bool = True,
) -> None:
    assert_no_ansi(raw, cmd)

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"audit JSON after {context} is not valid JSON: {error}") from error

    payload = assert_audit_json_keys(payload, ["context", "audits", "summary"], label="top-level", context=context)

    audit_context = assert_audit_json_keys(
        payload.get("context"),
        ["root", "auditDir", "strict", "quiet"],
        label="context",
        context=context,
    )
    if not isinstance(audit_context.get("root"), str) or not audit_context["root"]:
        raise SystemExit(f"audit JSON after {context} root is missing")
    if audit_context.get("auditDir") != "tools/audit":
        raise SystemExit(f"audit JSON after {context} auditDir differs from expected tools/audit")
    if audit_context.get("strict") is not strict:
        raise SystemExit(f"audit JSON after {context} strict flag differs from expected {strict}")
    if audit_context.get("quiet") is not quiet:
        raise SystemExit(f"audit JSON after {context} quiet flag differs from expected {quiet}")

    audits = payload.get("audits")
    if not isinstance(audits, list):
        raise SystemExit(f"audit JSON after {context} audits is not a list")
    if len(audits) != EXPECTED_AUDIT_COUNT:
        raise SystemExit(f"audit JSON after {context} audit count differs from expected {EXPECTED_AUDIT_COUNT}")

    expected_pairs = tuple(zip(EXPECTED_AUDIT_NAMES, EXPECTED_AUDIT_SCRIPTS))
    for index, audit in enumerate(audits):
        audit = assert_audit_json_keys(
            audit,
            [
                "name",
                "script",
                "description",
                "passed",
                "returncode",
                "durationSeconds",
                "strictArgs",
            ],
            label="audit entry",
            context=context,
        )
        expected_name, expected_script = expected_pairs[index]
        if audit.get("name") != expected_name or audit.get("script") != expected_script:
            raise SystemExit(f"audit JSON after {context} audit order differs from run-all.py")
        if not isinstance(audit.get("description"), str) or not audit["description"]:
            raise SystemExit(f"audit JSON after {context} audit description is missing for {expected_name}")
        if type(audit.get("passed")) is not bool:
            raise SystemExit(f"audit JSON after {context} passed flag is not boolean for {expected_name}")
        if type(audit.get("returncode")) is not int:
            raise SystemExit(f"audit JSON after {context} returncode is not an integer for {expected_name}")
        if audit.get("passed") is not True or audit.get("returncode") != 0:
            raise SystemExit(f"audit JSON after {context} reports failed audit {expected_name}")
        if not is_audit_json_non_negative_number(audit.get("durationSeconds")):
            raise SystemExit(f"audit JSON after {context} duration is invalid for {expected_name}")
        if not isinstance(audit.get("strictArgs"), list) or not all(isinstance(arg, str) for arg in audit["strictArgs"]):
            raise SystemExit(f"audit JSON after {context} strictArgs is invalid for {expected_name}")
        expected_strict_args = ["--strict"] if expected_name == "stale" and strict else []
        if audit.get("strictArgs") != expected_strict_args:
            raise SystemExit(f"audit JSON after {context} strictArgs differ for {expected_name}")

    summary = assert_audit_json_keys(
        payload.get("summary"),
        ["total", "passed", "failed", "durationSeconds", "exitCode"],
        label="summary",
        context=context,
    )
    for key in ("total", "passed", "failed", "exitCode"):
        if not is_audit_json_non_negative_int(summary.get(key)):
            raise SystemExit(f"audit JSON after {context} summary {key} is invalid")
    if summary.get("total") != EXPECTED_AUDIT_COUNT:
        raise SystemExit(f"audit JSON after {context} summary total differs")
    passed_count = sum(1 for audit in audits if audit.get("passed") is True)
    failed_count = len(audits) - passed_count
    if summary.get("total") != len(audits):
        raise SystemExit(f"audit JSON after {context} summary total does not match audit entries")
    if summary.get("passed") != passed_count or summary.get("failed") != failed_count:
        raise SystemExit(f"audit JSON after {context} summary counts do not match audit entries")
    if summary.get("passed") != EXPECTED_AUDIT_COUNT or summary.get("failed") != 0:
        raise SystemExit(f"audit JSON after {context} summary pass/fail counts differ")
    if not is_audit_json_non_negative_number(summary.get("durationSeconds")):
        raise SystemExit(f"audit JSON after {context} summary duration is invalid")
    if summary.get("exitCode") != 0:
        raise SystemExit(f"audit JSON after {context} summary exitCode is non-zero")


def assert_component_spec_check_report(
    report: object,
    *,
    context: str,
    label: str,
    expected_file_suffix: str,
) -> None:
    if not isinstance(report, dict):
        raise SystemExit(f"{label} after {context} report is not an object")

    if report.get("routeId") != EXPECTED_ROUTE_ID:
        raise SystemExit(f"{label} after {context} report routeId differs from expected route")

    if report.get("status") != "pass":
        raise SystemExit(f"{label} after {context} report status is not pass")

    if report.get("warnings") != 0 or report.get("failures") != 0:
        raise SystemExit(f"{label} after {context} report contains warnings or failures")

    passes = report.get("passes")
    total = report.get("total")
    if not isinstance(passes, int) or not isinstance(total, int) or passes != total or total < len(EXPECTED_CHECK_RESULT_IDS):
        raise SystemExit(f"{label} after {context} report pass count differs from expected total")

    score = report.get("score")
    if not isinstance(score, str) or score != f"{passes}/{total}":
        raise SystemExit(f"{label} after {context} report score differs from expected score")

    file_path = report.get("filePath")
    if not isinstance(file_path, str) or not file_path.endswith(expected_file_suffix):
        raise SystemExit(f"{label} after {context} report file path differs from expected artifact")

    results = report.get("results")
    if not isinstance(results, list):
        raise SystemExit(f"{label} after {context} report results is not a list")

    result_by_id = {
        result.get("id"): result
        for result in results
        if isinstance(result, dict) and isinstance(result.get("id"), str)
    }
    missing_results = [result_id for result_id in EXPECTED_CHECK_RESULT_IDS if result_id not in result_by_id]
    if missing_results:
        raise SystemExit(
            f"{label} after {context} is missing expected result(s): {', '.join(missing_results)}"
        )

    for result_id in EXPECTED_CHECK_RESULT_IDS:
        result = result_by_id[result_id]
        if result.get("level") != "pass" or result.get("passed") is not True:
            raise SystemExit(f"{label} after {context} result is not pass: {result_id}")


def assert_check_artifact_json_component_spec(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"failed to parse check artifact JSON after {context}") from error

    if not isinstance(payload, dict):
        raise SystemExit(f"check artifact JSON after {context} is not an object")

    assert_component_spec_check_report(
        payload,
        context=context,
        label="check artifact JSON",
        expected_file_suffix=EXPECTED_CHECK_ARTIFACT_NAME,
    )


def assert_check_stdin_json_component_spec(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"failed to parse check stdin JSON after {context}") from error

    if not isinstance(payload, dict):
        raise SystemExit(f"check stdin JSON after {context} is not an object")

    assert_component_spec_check_report(
        payload,
        context=context,
        label="check stdin JSON",
        expected_file_suffix="stdin",
    )


def assert_check_examples_json_component_spec(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"failed to parse check examples JSON after {context}") from error

    if not isinstance(payload, dict):
        raise SystemExit(f"check examples JSON after {context} is not an object")

    if payload.get("mode") != "examples":
        raise SystemExit(f"check examples JSON after {context} mode differs from expected examples mode")

    if payload.get("routeId") != EXPECTED_ROUTE_ID:
        raise SystemExit(f"check examples JSON after {context} routeId differs from expected route")

    if payload.get("query") != EXPECTED_EXAMPLES_EFFECTIVE_QUERY:
        raise SystemExit(f"check examples JSON after {context} query differs from expected query")

    if payload.get("limit") != EXPECTED_CHECK_EXAMPLES_LIMIT:
        raise SystemExit(f"check examples JSON after {context} limit differs from expected limit")

    if payload.get("status") != "pass":
        raise SystemExit(f"check examples JSON after {context} status is not pass")

    expected_counts = {
        "total": 1,
        "passed": 1,
        "warned": 0,
        "failed": 0,
    }
    for key, expected in expected_counts.items():
        if payload.get(key) != expected:
            raise SystemExit(f"check examples JSON after {context} {key} differs from expected count")

    examples = payload.get("examples")
    if not isinstance(examples, list) or len(examples) != 1:
        raise SystemExit(f"check examples JSON after {context} does not contain exactly one example")

    item = examples[0]
    if not isinstance(item, dict):
        raise SystemExit(f"check examples JSON after {context} contains an invalid example entry")

    example = item.get("example")
    if not isinstance(example, dict):
        raise SystemExit(f"check examples JSON after {context} example metadata is not an object")

    if example.get("relPath") != EXPECTED_EXAMPLES_HIT:
        raise SystemExit(f"check examples JSON after {context} example path differs from expected hit")

    if example.get("category") != EXPECTED_EXAMPLES_CATEGORY:
        raise SystemExit(f"check examples JSON after {context} example category differs from expected category")

    title = example.get("title")
    if not isinstance(title, str) or EXPECTED_EXAMPLES_TITLE_FRAGMENT not in title:
        raise SystemExit(f"check examples JSON after {context} example title differs from expected title")

    assert_component_spec_check_report(
        item.get("report"),
        context=context,
        label="check examples JSON",
        expected_file_suffix=EXPECTED_EXAMPLES_HIT,
    )


def assert_check_all_routes_issues_only_output(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    if raw.lstrip().startswith("{"):
        raise SystemExit(f"check all-routes issues-only output after {context} looks like JSON output")

    required_fragments = (
        "design-ai check examples",
        "all routes",
        "Status: pass",
        "Routes:",
        "Examples:",
    )
    assert_contains_fragments(
        raw,
        required_fragments,
        context=context,
        label="check all-routes issues-only output",
    )

    if not re.search(r"Routes:\s+\d+ \(0 fail, 0 warn, \d+ pass\)", raw):
        raise SystemExit(f"check all-routes issues-only output after {context} route summary differs from expected pass format")

    if not re.search(r"Examples:\s+\d+ \(0 fail, 0 warn, \d+ pass\)", raw):
        raise SystemExit(f"check all-routes issues-only output after {context} example summary differs from expected pass format")

    if re.search(r"^\s*[✓!]?\s+[a-z0-9-]+:\s+(?:pass|warn|fail)\b", raw, flags=re.MULTILINE):
        raise SystemExit(f"check all-routes issues-only output after {context} printed per-route rows despite no issues")


def passing_help_catalog_json() -> str:
    return json.dumps({
        "usage": EXPECTED_HELP_USAGE,
        "topics": [
            {
                "topic": topic,
                "usage": f"design-ai {topic}",
                "description": f"{topic} help topic",
                "aliases": [
                    alias
                    for alias, target in EXPECTED_HELP_ALIASES.items()
                    if target == topic
                ],
            }
            for topic in EXPECTED_HELP_TOPICS
        ],
        "aliases": EXPECTED_HELP_ALIASES,
    })


def passing_help_topic_output(topic: str = "search") -> str:
    canonical_topic = EXPECTED_HELP_ALIASES.get(topic, topic)
    fragments = EXPECTED_HELP_TOPIC_FRAGMENTS[canonical_topic]
    return "\n".join([
        " ".join(fragments[:2]),
        "",
        *(fragments[2:] or ("Options:",)),
        "",
    ])


def passing_main_help_output() -> str:
    return "\n".join([
        "",
        "  design-ai",
        "  Senior product designer for Claude Code",
        "",
        "Usage:  design-ai <command> [args]",
        "        design-ai help [command|--json]",
        "",
        "  install                                                                Symlink design-ai into Claude Code (~/.claude)",
        "  search <query> [--dir kind] [--limit N] [--json]                       Search the local markdown corpus",
        "  show <file[:line]> [--lines N:M] [--context N] [--json]                Print a corpus file or line range",
        "  route <brief|--from-file file|--stdin|--list> [--limit N]              Recommend commands, skills, and knowledge; add --explain",
        "  prompt <brief|--from-file file|--stdin> [--route id] [--out file]      Generate a ready-to-use agent prompt",
        "  pack <brief|--from-file file|--stdin> [--route id] [--max-bytes N]     Generate prompt plus bounded context with summary",
        "  check <artifact.md|--stdin|--examples> [--route id|--all-routes]       Check generated Markdown artifact quality; add --issues-only",
        "  examples [query] [--route id] [--limit N] [--json]                     Find worked examples for a route or query",
        "",
        "Environment overrides:",
        "Quickstart:",
        "Docs:    https://github.com/sungjin/design-ai",
        f"Plugin:  {EXPECTED_PLUGIN_INVENTORY_SUMMARY} (UI/UX, motion,",
    ])


def passing_version_output() -> str:
    return "\n".join([
        "design-ai CLI:    4.13.0",
        "Plugin / corpus:  4.13.0",
        "Source:           /tmp/design-ai",
        "",
    ])


def passing_version_json() -> str:
    return json.dumps(
        {
            "context": {
                "sourceRoot": "/tmp/design-ai",
            },
            "versions": {
                "cli": "4.13.0",
                "plugin": "4.13.0",
                "aligned": True,
            },
        },
        ensure_ascii=False,
        indent=2,
    )


def passing_doctor_strict_output() -> str:
    return "\n".join([
        "",
        "  design-ai doctor",
        "  Diagnose install and runtime health",
        "",
        "ℹ  Source: /tmp/design-ai",
        "ℹ  Target: /tmp/claude-home",
        "ℹ  Prefix: smoke-design-",
        "",
        "✓  Source layout: complete at /tmp/design-ai",
        "✓  Version alignment: 4.13.0",
        "✓  Manifest paths: 39 referenced artifact(s) exist",
        "✓  Node runtime: v24.13.1",
        "✓  Python runtime: Python 3.12.12",
        "✓  Audit runner: tools/audit/run-all.py found",
        "✓  Audit scripts: 8 repository audit script(s) found",
        "✓  Doctor assertions helper: tools/audit/doctor_assertions.py found",
        "✓  Smoke assertions helper: tools/audit/smoke_assertions.py found",
        "✓  Example QA audit: tools/audit/example-qa.py found",
        "✓  Package contents check: tools/audit/package-contents.py found",
        "✓  Package smoke check: tools/audit/package-smoke.py found",
        "✓  Registry smoke check: tools/audit/registry-smoke.py found",
        "✓  Installed skills: 19/19 installed",
        "✓  Installed agents: 4/4 installed",
        "✓  Installed slash commands: 16/16 installed",
        "",
        f"ℹ  Summary: {len(EXPECTED_DOCTOR_PASS_LABELS)} pass, 0 warning(s), 0 failure(s)",
        "",
    ])


def passing_install_output() -> str:
    return "\n".join([
        "",
        "  design-ai installer",
        "  v4.13.0",
        "",
        "Source: /tmp/design-ai",
        "Target: /tmp/claude-home",
        "Prefix: smoke-design-",
        "",
        "design-ai installer",
        "Senior product designer for Claude Code",
        "Installing from: /tmp/design-ai",
        "Target:          /tmp/claude-home",
        "Symlink prefix:  smoke-design-",
        "Installed 19 skills (prefix: smoke-design-)",
        "Installed 4 agents (prefix: smoke-design-)",
        "Installed 16 slash commands (prefix: /smoke-design-)",
        "Done. Restart Claude Code (or open a new session) to pick up changes.",
        "Installed. Restart Claude Code (or open a new session) to pick up changes.",
        "Or: design-ai status",
        "",
    ])


def expected_installed_counts() -> dict[str, int]:
    return {
        "skills": len(EXPECTED_LIST_CATALOG["skills"]),
        "agents": len(EXPECTED_LIST_CATALOG["agents"]),
        "commands": len(EXPECTED_LIST_CATALOG["commands"]),
        "total": expected_installed_symlink_count(),
    }


def passing_install_json(prefix: str = "smoke-design-") -> str:
    return json.dumps(
        {
            "context": {
                "sourceRoot": "/tmp/design-ai",
                "claudeHome": "/tmp/claude-home",
                "prefix": prefix,
            },
            "result": {
                "installed": expected_installed_counts(),
            },
        },
        ensure_ascii=False,
        indent=2,
    )


def passing_update_dry_run_output() -> str:
    return "\n".join([
        "",
        "  design-ai update dry run",
        "",
        "Source: /tmp/design-ai",
        "Target: /tmp/claude-home",
        "Prefix: smoke-design-",
        "",
        "Git: skipped; source is not a git clone.",
        "Install: would run bash /tmp/design-ai/install.sh install",
        "",
        "Dry run complete. No files changed.",
        "",
    ])


def passing_update_dry_run_json(prefix: str = "smoke-design-") -> str:
    return json.dumps(
        {
            "context": {
                "sourceRoot": "/tmp/design-ai",
                "claudeHome": "/tmp/claude-home",
                "prefix": prefix,
            },
            "plan": {
                "gitPull": {
                    "sourceIsGitClone": False,
                    "wouldRun": False,
                    "command": [],
                    "reason": "source is not a git clone",
                },
                "install": {
                    "installScriptExists": True,
                    "wouldRun": True,
                    "installScript": "/tmp/design-ai/install.sh",
                    "command": ["bash", "/tmp/design-ai/install.sh", "install"],
                    "reason": "install.sh is available",
                },
            },
            "result": {
                "dryRun": True,
                "mutating": False,
                "ready": True,
            },
        },
        ensure_ascii=False,
        indent=2,
    )


def passing_status_output() -> str:
    return "\n".join([
        "",
        "  design-ai status",
        "",
        "Source: /tmp/design-ai",
        "Target: /tmp/claude-home",
        "Prefix: smoke-design-",
        "",
        "Skills: 19 installed",
        "Agents: 4 installed",
        "Slash commands: 16 installed",
        "",
    ])


def status_entry_name(kind: str, name: str, prefix: str) -> str:
    if kind == "skills":
        return f"{prefix}{name}"
    if kind in ("agents", "commands"):
        return f"{prefix}{name}.md"
    raise SystemExit(f"unsupported status kind for smoke fixture: {kind}")


def passing_status_json(prefix: str = "smoke-design-") -> str:
    sections = []
    for kind, label, target_dir in (
        ("skills", "Skills", "/tmp/claude-home/skills"),
        ("agents", "Agents", "/tmp/claude-home/agents"),
        ("commands", "Slash commands", "/tmp/claude-home/commands"),
    ):
        entries = [
            status_entry_name(kind, item, prefix)
            for item in sorted(EXPECTED_LIST_CATALOG[kind])
        ]
        sections.append({
            "kind": kind,
            "label": label,
            "targetDir": target_dir,
            "targetExists": True,
            "installed": len(entries),
            "entries": entries,
        })
    return json.dumps(
        {
            "context": {
                "sourceRoot": "/tmp/design-ai",
                "claudeHome": "/tmp/claude-home",
                "prefix": prefix,
            },
            "sections": sections,
            "summary": {
                "installed": 39,
                "missingSections": 0,
                "emptySections": 0,
            },
        },
        ensure_ascii=False,
        indent=2,
    )


def passing_uninstall_output() -> str:
    return "\n".join([
        "",
        "  design-ai uninstaller",
        "",
        "design-ai installer",
        "Senior product designer for Claude Code",
        "Uninstalling design-ai from /tmp/claude-home",
        "Removed 39 design-ai symlinks",
        "Done. To remove the design-ai source, delete its directory manually.",
        "Source location: /tmp/design-ai",
        "",
    ])


def expected_installed_symlink_count() -> int:
    return sum(len(items) for items in EXPECTED_LIST_CATALOG.values())


def passing_uninstall_json(prefix: str = "smoke-design-") -> str:
    return json.dumps(
        {
            "context": {
                "sourceRoot": "/tmp/design-ai",
                "claudeHome": "/tmp/claude-home",
                "prefix": prefix,
            },
            "result": {
                "removed": expected_installed_symlink_count(),
            },
        },
        ensure_ascii=False,
        indent=2,
    )


def passing_install_lifecycle_output() -> str:
    return "\n".join([
        passing_install_output(),
        passing_status_output(),
        passing_uninstall_output(),
    ])


def passing_install_doctor_lifecycle_output() -> str:
    return "\n".join([
        passing_install_output(),
        passing_doctor_strict_output(),
        passing_status_output(),
        passing_uninstall_output(),
    ])


def parse_help_topics(raw: str, *, context: str, cmd: list[str]) -> list[str]:
    assert_no_ansi(raw, cmd)
    try:
        catalog = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"failed to parse help JSON after {context}") from error

    if not isinstance(catalog, dict):
        raise SystemExit(f"help JSON after {context} is not an object")

    raw_topics = catalog.get("topics")
    if not isinstance(raw_topics, list):
        raise SystemExit(f"help JSON after {context} does not contain a topics array")

    raw_aliases = catalog.get("aliases")
    if not isinstance(raw_aliases, dict):
        raise SystemExit(f"help JSON after {context} does not contain an aliases object")

    raw_usage = catalog.get("usage")
    if raw_usage != EXPECTED_HELP_USAGE:
        raise SystemExit(f"help JSON after {context} usage differs from expected usage")

    if raw_aliases != EXPECTED_HELP_ALIASES:
        raise SystemExit(f"help JSON after {context} aliases differ from expected aliases")

    topics: list[str] = []
    topic_aliases: dict[str, str] = {}
    for item in raw_topics:
        topic = item.get("topic") if isinstance(item, dict) else None
        if not isinstance(topic, str) or not topic:
            raise SystemExit(f"help JSON after {context} contains an invalid topic entry")
        usage = item.get("usage")
        if not isinstance(usage, str) or not usage:
            raise SystemExit(f"help JSON after {context} topic {topic} has invalid usage")
        description = item.get("description")
        if not isinstance(description, str) or not description:
            raise SystemExit(f"help JSON after {context} topic {topic} has invalid description")
        aliases = item.get("aliases")
        if not isinstance(aliases, list) or not all(isinstance(alias, str) and alias for alias in aliases):
            raise SystemExit(f"help JSON after {context} topic {topic} has invalid aliases")
        for alias in aliases:
            if raw_aliases.get(alias) != topic:
                raise SystemExit(
                    f"help JSON after {context} alias {alias} does not map to topic {topic}"
                )
            if alias in topic_aliases:
                raise SystemExit(f"help JSON after {context} contains duplicate alias: {alias}")
            topic_aliases[alias] = topic
        topics.append(topic)

    if len(set(topics)) != len(topics):
        raise SystemExit(f"help JSON after {context} contains duplicate topics")

    missing_expected = [topic for topic in EXPECTED_HELP_TOPICS if topic not in topics]
    if missing_expected:
        raise SystemExit(
            f"help JSON after {context} is missing expected topic(s): {', '.join(missing_expected)}"
        )

    unexpected_topics = [topic for topic in topics if topic not in EXPECTED_HELP_TOPICS]
    if unexpected_topics:
        raise SystemExit(
            f"help JSON after {context} contains unexpected topic(s): {', '.join(unexpected_topics)}"
        )

    if topics != list(EXPECTED_HELP_TOPICS):
        raise SystemExit(f"help JSON after {context} topic order differs from expected order")

    if topic_aliases != EXPECTED_HELP_ALIASES:
        raise SystemExit(f"help JSON after {context} topic aliases differ from expected aliases")

    return topics


def assert_help_topic_output(raw: str, *, topic: str, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    if raw.lstrip().startswith("{"):
        raise SystemExit(f"help topic output for {topic} after {context} looks like JSON output")
    if "Unknown help topic" in raw:
        raise SystemExit(f"help topic output for {topic} after {context} reported an unknown topic")

    canonical_topic = EXPECTED_HELP_ALIASES.get(topic, topic)
    fragments = EXPECTED_HELP_TOPIC_FRAGMENTS.get(canonical_topic)
    if fragments is None:
        raise SystemExit(f"help topic output after {context} cannot validate unsupported topic: {topic}")

    assert_contains_fragments(
        raw,
        fragments,
        context=context,
        label=f"help topic output for {topic}",
    )


def assert_main_help_output(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    if raw.lstrip().startswith("{"):
        raise SystemExit(f"main help output after {context} looks like JSON output")
    if "Unknown command" in raw or "Unknown help topic" in raw:
        raise SystemExit(f"main help output after {context} reported an unknown command/topic")

    assert_contains_fragments(
        raw,
        EXPECTED_MAIN_HELP_FRAGMENTS,
        context=context,
        label="main help output",
    )


def assert_version_output(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    if raw.lstrip().startswith("{"):
        raise SystemExit(f"version output after {context} looks like JSON output")

    assert_contains_fragments(
        raw,
        EXPECTED_VERSION_FRAGMENTS,
        context=context,
        label="version output",
    )


def assert_version_json(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"version JSON after {context} is not valid JSON: {error}") from error

    if list(payload) != ["context", "versions"]:
        raise SystemExit(f"version JSON after {context} top-level keys changed")

    version_context = payload.get("context")
    if not isinstance(version_context, dict):
        raise SystemExit(f"version JSON after {context} context is not an object")
    if list(version_context) != ["sourceRoot"]:
        raise SystemExit(f"version JSON after {context} context keys changed")
    if not isinstance(version_context.get("sourceRoot"), str) or not version_context["sourceRoot"]:
        raise SystemExit(f"version JSON after {context} sourceRoot is missing")

    versions = payload.get("versions")
    if not isinstance(versions, dict):
        raise SystemExit(f"version JSON after {context} versions is not an object")
    if list(versions) != ["cli", "plugin", "aligned"]:
        raise SystemExit(f"version JSON after {context} version keys changed")
    for key in ("cli", "plugin"):
        value = versions.get(key)
        if not isinstance(value, str) or not re.fullmatch(r"\d+\.\d+\.\d+", value):
            raise SystemExit(f"version JSON after {context} {key} version differs from expected semver")
    if versions.get("aligned") is not True:
        raise SystemExit(f"version JSON after {context} versions are not aligned")
    if versions["cli"] != versions["plugin"]:
        raise SystemExit(f"version JSON after {context} CLI and plugin versions differ")


def assert_doctor_strict_output(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    if raw.lstrip().startswith("{"):
        raise SystemExit(f"doctor strict output after {context} looks like JSON output")

    assert_contains_fragments(
        raw,
        EXPECTED_DOCTOR_STRICT_OUTPUT_FRAGMENTS,
        context=context,
        label="doctor strict output",
    )


def assert_install_output(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    if "Skipping " in raw or "non-symlink already exists" in raw:
        raise SystemExit(f"install output after {context} reported skipped symlink creation")

    assert_contains_fragments(
        raw,
        EXPECTED_INSTALL_OUTPUT_FRAGMENTS,
        context=context,
        label="install output",
    )


def assert_lifecycle_json_keys(
    value: object,
    expected_keys: list[str],
    *,
    label: str,
    context: str,
    command_label: str,
) -> dict[str, object]:
    if not isinstance(value, dict):
        raise SystemExit(f"{command_label} after {context} {label} is not an object")
    if list(value) != expected_keys:
        raise SystemExit(f"{command_label} after {context} {label} keys changed")
    return value


def is_lifecycle_json_non_negative_int(value: object) -> bool:
    return type(value) is int and value >= 0


def assert_install_json(raw: str, *, prefix: str, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"install JSON after {context} is not valid JSON: {error}") from error

    payload = assert_lifecycle_json_keys(
        payload,
        ["context", "result"],
        label="top-level",
        context=context,
        command_label="install JSON",
    )

    install_context = assert_lifecycle_json_keys(
        payload.get("context"),
        ["sourceRoot", "claudeHome", "prefix"],
        label="context",
        context=context,
        command_label="install JSON",
    )
    if not isinstance(install_context.get("sourceRoot"), str) or not install_context["sourceRoot"]:
        raise SystemExit(f"install JSON after {context} sourceRoot is missing")
    if not isinstance(install_context.get("claudeHome"), str) or not install_context["claudeHome"]:
        raise SystemExit(f"install JSON after {context} claudeHome is missing")
    if install_context.get("prefix") != prefix:
        raise SystemExit(f"install JSON after {context} prefix differs from expected {prefix}")

    result = assert_lifecycle_json_keys(
        payload.get("result"),
        ["installed"],
        label="result",
        context=context,
        command_label="install JSON",
    )

    installed = assert_lifecycle_json_keys(
        result.get("installed"),
        ["skills", "agents", "commands", "total"],
        label="installed",
        context=context,
        command_label="install JSON",
    )
    for key in ("skills", "agents", "commands", "total"):
        if not is_lifecycle_json_non_negative_int(installed.get(key)):
            raise SystemExit(f"install JSON after {context} installed {key} is invalid")
    if installed["total"] != installed["skills"] + installed["agents"] + installed["commands"]:
        raise SystemExit(f"install JSON after {context} installed total does not match section counts")
    if installed != expected_installed_counts():
        raise SystemExit(f"install JSON after {context} installed counts differ from expected install set")


def assert_update_dry_run_output(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    if raw.lstrip().startswith("{"):
        raise SystemExit(f"update dry-run output after {context} looks like JSON output")
    if "Pulling latest from git" in raw or "Re-running install.sh" in raw:
        raise SystemExit(f"update dry-run output after {context} reported mutating update work")

    assert_contains_fragments(
        raw,
        EXPECTED_UPDATE_DRY_RUN_OUTPUT_FRAGMENTS,
        context=context,
        label="update dry-run output",
    )


def assert_update_dry_run_json(raw: str, *, prefix: str, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"update dry-run JSON after {context} is not valid JSON: {error}") from error

    payload = assert_lifecycle_json_keys(
        payload,
        ["context", "plan", "result"],
        label="top-level",
        context=context,
        command_label="update dry-run JSON",
    )

    update_context = assert_lifecycle_json_keys(
        payload.get("context"),
        ["sourceRoot", "claudeHome", "prefix"],
        label="context",
        context=context,
        command_label="update dry-run JSON",
    )
    if not isinstance(update_context.get("sourceRoot"), str) or not update_context["sourceRoot"]:
        raise SystemExit(f"update dry-run JSON after {context} sourceRoot is missing")
    if not isinstance(update_context.get("claudeHome"), str) or not update_context["claudeHome"]:
        raise SystemExit(f"update dry-run JSON after {context} claudeHome is missing")
    if update_context.get("prefix") != prefix:
        raise SystemExit(f"update dry-run JSON after {context} prefix differs from expected {prefix}")

    plan = assert_lifecycle_json_keys(
        payload.get("plan"),
        ["gitPull", "install"],
        label="plan",
        context=context,
        command_label="update dry-run JSON",
    )

    git_pull = assert_lifecycle_json_keys(
        plan.get("gitPull"),
        ["sourceIsGitClone", "wouldRun", "command", "reason"],
        label="gitPull",
        context=context,
        command_label="update dry-run JSON",
    )
    if not isinstance(git_pull.get("sourceIsGitClone"), bool):
        raise SystemExit(f"update dry-run JSON after {context} sourceIsGitClone is not boolean")
    if git_pull.get("wouldRun") != git_pull.get("sourceIsGitClone"):
        raise SystemExit(f"update dry-run JSON after {context} gitPull wouldRun does not match clone state")
    expected_git_command = ["git", "pull", "--ff-only"] if git_pull.get("wouldRun") else []
    if git_pull.get("command") != expected_git_command:
        raise SystemExit(f"update dry-run JSON after {context} gitPull command differs from clone state")
    if not isinstance(git_pull.get("reason"), str) or not git_pull["reason"]:
        raise SystemExit(f"update dry-run JSON after {context} gitPull reason is missing")

    install = assert_lifecycle_json_keys(
        plan.get("install"),
        ["installScriptExists", "wouldRun", "installScript", "command", "reason"],
        label="install",
        context=context,
        command_label="update dry-run JSON",
    )
    if install.get("installScriptExists") is not True:
        raise SystemExit(f"update dry-run JSON after {context} install script is missing")
    if install.get("wouldRun") is not True:
        raise SystemExit(f"update dry-run JSON after {context} install wouldRun is not true")
    if not isinstance(install.get("installScript"), str) or not install["installScript"].endswith("install.sh"):
        raise SystemExit(f"update dry-run JSON after {context} installScript is invalid")
    if install.get("command") != ["bash", install["installScript"], "install"]:
        raise SystemExit(f"update dry-run JSON after {context} install command changed")
    if not isinstance(install.get("reason"), str) or not install["reason"]:
        raise SystemExit(f"update dry-run JSON after {context} install reason is missing")

    result = assert_lifecycle_json_keys(
        payload.get("result"),
        ["dryRun", "mutating", "ready"],
        label="result",
        context=context,
        command_label="update dry-run JSON",
    )
    if result != {"dryRun": True, "mutating": False, "ready": True}:
        raise SystemExit(f"update dry-run JSON after {context} result summary changed")


def assert_status_output(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    if "0 installed" in raw or "target dir does not exist" in raw:
        raise SystemExit(f"status output after {context} reported missing installed symlinks")

    assert_contains_fragments(
        raw,
        EXPECTED_STATUS_OUTPUT_FRAGMENTS,
        context=context,
        label="status output",
    )


def assert_status_json(raw: str, *, prefix: str, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"status JSON after {context} is not valid JSON: {error}") from error

    payload = assert_lifecycle_json_keys(
        payload,
        ["context", "sections", "summary"],
        label="top-level",
        context=context,
        command_label="status JSON",
    )

    status_context = assert_lifecycle_json_keys(
        payload.get("context"),
        ["sourceRoot", "claudeHome", "prefix"],
        label="context",
        context=context,
        command_label="status JSON",
    )
    if not isinstance(status_context.get("sourceRoot"), str) or not status_context["sourceRoot"]:
        raise SystemExit(f"status JSON after {context} sourceRoot is missing")
    if not isinstance(status_context.get("claudeHome"), str) or not status_context["claudeHome"]:
        raise SystemExit(f"status JSON after {context} claudeHome is missing")
    if status_context.get("prefix") != prefix:
        raise SystemExit(f"status JSON after {context} prefix differs from expected {prefix}")

    sections = payload.get("sections")
    if not isinstance(sections, list):
        raise SystemExit(f"status JSON after {context} sections is not a list")
    expected_kinds = ("skills", "agents", "commands")
    if len(sections) != len(expected_kinds):
        raise SystemExit(f"status JSON after {context} section count differs from expected install order")
    if tuple(section.get("kind") for section in sections if isinstance(section, dict)) != expected_kinds:
        raise SystemExit(f"status JSON after {context} section order differs from expected install order")

    total_installed = 0
    for section in sections:
        section = assert_lifecycle_json_keys(
            section,
            ["kind", "label", "targetDir", "targetExists", "installed", "entries"],
            label="section",
            context=context,
            command_label="status JSON",
        )
        kind = section.get("kind")
        if kind not in EXPECTED_LIST_CATALOG:
            raise SystemExit(f"status JSON after {context} contains unsupported section kind: {kind}")
        if not isinstance(section.get("label"), str) or not section["label"]:
            raise SystemExit(f"status JSON after {context} section label is missing for {kind}")
        if not isinstance(section.get("targetDir"), str) or not section["targetDir"]:
            raise SystemExit(f"status JSON after {context} targetDir is missing for {kind}")
        if section.get("targetExists") is not True:
            raise SystemExit(f"status JSON after {context} target dir is missing for {kind}")
        if not is_lifecycle_json_non_negative_int(section.get("installed")):
            raise SystemExit(f"status JSON after {context} installed count is invalid for {kind}")
        expected_entries = tuple(
            status_entry_name(kind, item, prefix)
            for item in sorted(EXPECTED_LIST_CATALOG[kind])
        )
        entries = section.get("entries")
        if not isinstance(entries, list):
            raise SystemExit(f"status JSON after {context} entries is not a list for {kind}")
        if tuple(entries) != expected_entries:
            raise SystemExit(f"status JSON after {context} entries differ from expected {kind} install set")
        if section.get("installed") != len(expected_entries):
            raise SystemExit(f"status JSON after {context} installed count differs for {kind}")
        total_installed += len(expected_entries)

    summary = assert_lifecycle_json_keys(
        payload.get("summary"),
        ["installed", "missingSections", "emptySections"],
        label="summary",
        context=context,
        command_label="status JSON",
    )
    for key in ("installed", "missingSections", "emptySections"):
        if not is_lifecycle_json_non_negative_int(summary.get(key)):
            raise SystemExit(f"status JSON after {context} summary {key} is invalid")
    if summary.get("installed") != total_installed:
        raise SystemExit(f"status JSON after {context} summary installed count differs")
    if summary.get("missingSections") != 0:
        raise SystemExit(f"status JSON after {context} summary reports missing sections")
    if summary.get("emptySections") != 0:
        raise SystemExit(f"status JSON after {context} summary reports empty sections")


def assert_uninstall_output(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)

    assert_contains_fragments(
        raw,
        EXPECTED_UNINSTALL_OUTPUT_FRAGMENTS,
        context=context,
        label="uninstall output",
    )


def assert_uninstall_json(raw: str, *, prefix: str, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"uninstall JSON after {context} is not valid JSON: {error}") from error

    payload = assert_lifecycle_json_keys(
        payload,
        ["context", "result"],
        label="top-level",
        context=context,
        command_label="uninstall JSON",
    )

    uninstall_context = assert_lifecycle_json_keys(
        payload.get("context"),
        ["sourceRoot", "claudeHome", "prefix"],
        label="context",
        context=context,
        command_label="uninstall JSON",
    )
    if not isinstance(uninstall_context.get("sourceRoot"), str) or not uninstall_context["sourceRoot"]:
        raise SystemExit(f"uninstall JSON after {context} sourceRoot is missing")
    if not isinstance(uninstall_context.get("claudeHome"), str) or not uninstall_context["claudeHome"]:
        raise SystemExit(f"uninstall JSON after {context} claudeHome is missing")
    if uninstall_context.get("prefix") != prefix:
        raise SystemExit(f"uninstall JSON after {context} prefix differs from expected {prefix}")

    result = assert_lifecycle_json_keys(
        payload.get("result"),
        ["removed"],
        label="result",
        context=context,
        command_label="uninstall JSON",
    )
    if not is_lifecycle_json_non_negative_int(result.get("removed")):
        raise SystemExit(f"uninstall JSON after {context} removed count is invalid")
    if result.get("removed") != expected_installed_symlink_count():
        raise SystemExit(f"uninstall JSON after {context} removed count differs from expected install set")


def assert_install_lifecycle_output(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_install_output(raw, context=context, cmd=cmd)
    assert_status_output(raw, context=context, cmd=cmd)
    assert_uninstall_output(raw, context=context, cmd=cmd)


def assert_install_doctor_lifecycle_output(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_install_output(raw, context=context, cmd=cmd)
    assert_doctor_strict_output(raw, context=context, cmd=cmd)
    assert_status_output(raw, context=context, cmd=cmd)
    assert_uninstall_output(raw, context=context, cmd=cmd)


def assert_command_alias_output(raw: str, *, command: tuple[str, ...], context: str, cmd: list[str]) -> None:
    if command in (("--version",), ("-v",)):
        assert_version_output(raw, context=context, cmd=cmd)
        return

    if command in (("--help",), ("-h",)):
        assert_main_help_output(raw, context=context, cmd=cmd)
        return

    if len(command) == 2 and command[1] == "--help":
        assert_help_topic_output(raw, topic=command[0], context=context, cmd=cmd)
        return

    raise SystemExit(f"command alias output after {context} cannot validate unsupported command: {command}")


def help_topic_script(topics: list[str]) -> str:
    if not topics:
        raise SystemExit("help topic script requires at least one topic")
    return " && ".join(f"design-ai help {shlex.quote(topic)}" for topic in topics)


def help_alias_script() -> str:
    return help_topic_script(list(EXPECTED_HELP_ALIASES))


def design_ai_command_script(commands: list[tuple[str, ...]] | tuple[tuple[str, ...], ...]) -> str:
    if not commands:
        raise SystemExit("design-ai command script requires at least one command")
    rendered = []
    for command in commands:
        if not command or not all(isinstance(part, str) and part for part in command):
            raise SystemExit("design-ai command script contains an invalid command")
        rendered.append(" ".join(shlex.quote(part) for part in ("design-ai", *command)))
    return " && ".join(rendered)


def command_alias_script() -> str:
    return design_ai_command_script(EXPECTED_COMMAND_ALIAS_COMMANDS)


def validate_functional_alias_smoke_cases(
    cases: tuple[tuple[str, tuple[str, ...], str], ...] = EXPECTED_FUNCTIONAL_ALIAS_SMOKES,
) -> dict[str, str]:
    observed: dict[str, str] = {}
    for label, alias_command, assertion_name in cases:
        if not isinstance(label, str) or not label:
            raise SystemExit("functional alias smoke contains an invalid label")
        if not alias_command or not all(isinstance(part, str) and part for part in alias_command):
            raise SystemExit(f"functional alias smoke {label} contains an invalid command")
        if assertion_name not in EXPECTED_FUNCTIONAL_ALIAS_ASSERTIONS:
            raise SystemExit(
                f"functional alias smoke {label} has unsupported assertion: {assertion_name}"
            )

        alias = alias_command[0]
        target = EXPECTED_HELP_ALIASES.get(alias)
        if target is None:
            raise SystemExit(f"functional alias smoke {label} does not use a documented help alias: {alias}")
        if alias in observed:
            raise SystemExit(f"functional alias smoke duplicates alias: {alias}")
        observed[alias] = target

    if observed != EXPECTED_FUNCTIONAL_ALIAS_TARGETS:
        raise SystemExit("functional alias smoke cases differ from expected alias target coverage")

    return observed


def functional_alias_script() -> str:
    validate_functional_alias_smoke_cases()
    return design_ai_command_script(tuple(command for _, command, _ in EXPECTED_FUNCTIONAL_ALIAS_SMOKES))


def assert_functional_alias_smokes(
    command_factory: Callable[..., list[str]],
    *,
    run_command: Callable[..., object],
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    validate_functional_alias_smoke_cases()
    for label, alias_command, assertion_name in EXPECTED_FUNCTIONAL_ALIAS_SMOKES:
        cmd = command_factory(*alias_command)
        result = run_command(cmd, cwd=cwd, env=env)
        stdout = getattr(result, "stdout", None)
        if not isinstance(stdout, str):
            raise SystemExit(f"functional alias smoke after {context} {label} did not return stdout text")

        case_context = f"{context} {label}"
        if assertion_name == "list-skills":
            assert_list_catalog_output(stdout, kind="skills", context=case_context, cmd=cmd)
        elif assertion_name == "search-json":
            assert_search_json_contains_hit(stdout, context=case_context, cmd=cmd)
        elif assertion_name == "show-json-line":
            assert_show_json_line(stdout, context=case_context, cmd=cmd)
        elif assertion_name == "route-json":
            assert_route_json_component_spec(stdout, context=case_context, cmd=cmd)
        elif assertion_name == "examples-json":
            assert_examples_json_route_hit(stdout, context=case_context, cmd=cmd)
        elif assertion_name == "examples-human":
            assert_examples_human_output(stdout, context=case_context, cmd=cmd)
        elif assertion_name == "check-examples-json":
            assert_check_examples_json_component_spec(stdout, context=case_context, cmd=cmd)
        else:
            raise SystemExit(
                f"functional alias smoke after {context} {label} has unsupported assertion: {assertion_name}"
            )


def assert_doctor_json_clean(
    raw: str,
    *,
    context: str,
    cmd: list[str],
    parse_error_message: str,
    print_raw_on_failure: bool = True,
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        report = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(parse_error_message) from error

    try:
        assert_doctor_report_clean(report, context=context)
    except SystemExit:
        if print_raw_on_failure:
            print(raw, file=sys.stderr)
        raise


def expect_self_test_failure(action: Callable[[], object], *, expected: str, scope: str) -> None:
    try:
        action()
    except SystemExit as error:
        if expected not in str(error):
            raise
    else:
        raise SystemExit(f"self-test failed: expected {scope} failure containing {expected!r}")


def run_self_test() -> None:
    context = "smoke assertion self-test"
    cmd = ["design-ai", "doctor", "--json"]
    help_cmd = ["design-ai", "help", "--json"]
    parse_error_message = f"failed to parse doctor JSON after {context}"

    assert_no_ansi("plain output", cmd)
    if build_plugin_inventory_summary({
        "skills": [{"name": "a"}, {"name": "b"}],
        "commands": [{"name": "c"}],
        "agents": [],
    }) != "2 skills, 1 command, 0 agents":
        raise SystemExit("plugin inventory summary formatting self-test failed")
    expect_self_test_failure(
        lambda: assert_no_ansi("\x1b[31mred", cmd),
        expected="ANSI escape",
        scope="smoke assertions",
    )
    assert_unknown_command_failure(
        passing_unknown_command_output(),
        returncode=1,
        context=context,
        cmd=["design-ai", EXPECTED_UNKNOWN_COMMAND],
    )
    expect_self_test_failure(
        lambda: assert_unknown_command_failure(
            passing_unknown_command_output(),
            returncode=0,
            context=context,
            cmd=["design-ai", EXPECTED_UNKNOWN_COMMAND],
        ),
        expected="expected 1",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_unknown_command_failure(
            f"Unknown command: {EXPECTED_UNKNOWN_COMMAND}",
            returncode=1,
            context=context,
            cmd=["design-ai", EXPECTED_UNKNOWN_COMMAND],
        ),
        expected="missing expected output",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_unknown_command_failure(
            "\x1b[31mred",
            returncode=1,
            context=context,
            cmd=["design-ai", EXPECTED_UNKNOWN_COMMAND],
        ),
        expected="ANSI escape",
        scope="smoke assertions",
    )
    assert_unknown_help_topic_failure(
        passing_unknown_help_topic_output(),
        returncode=1,
        context=context,
        cmd=["design-ai", "help", EXPECTED_UNKNOWN_HELP_TOPIC],
    )
    expect_self_test_failure(
        lambda: assert_unknown_help_topic_failure(
            passing_unknown_help_topic_output(),
            returncode=0,
            context=context,
            cmd=["design-ai", "help", EXPECTED_UNKNOWN_HELP_TOPIC],
        ),
        expected="expected 1",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_unknown_help_topic_failure(
            f"{EXPECTED_ERROR_PREFIX} Unknown help topic: {EXPECTED_UNKNOWN_HELP_TOPIC}",
            returncode=1,
            context=context,
            cmd=["design-ai", "help", EXPECTED_UNKNOWN_HELP_TOPIC],
        ),
        expected="missing expected output",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_unknown_help_topic_failure(
            "\x1b[31mred",
            returncode=1,
            context=context,
            cmd=["design-ai", "help", EXPECTED_UNKNOWN_HELP_TOPIC],
        ),
        expected="ANSI escape",
        scope="smoke assertions",
    )
    assert_unknown_list_domain_failure(
        passing_unknown_list_domain_output(),
        returncode=1,
        context=context,
        cmd=["design-ai", "list", EXPECTED_UNKNOWN_LIST_DOMAIN],
    )
    expect_self_test_failure(
        lambda: assert_unknown_list_domain_failure(
            passing_unknown_list_domain_output(),
            returncode=0,
            context=context,
            cmd=["design-ai", "list", EXPECTED_UNKNOWN_LIST_DOMAIN],
        ),
        expected="expected 1",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_unknown_list_domain_failure(
            f"{EXPECTED_ERROR_PREFIX} Unknown domain: {EXPECTED_UNKNOWN_LIST_DOMAIN}",
            returncode=1,
            context=context,
            cmd=["design-ai", "list", EXPECTED_UNKNOWN_LIST_DOMAIN],
        ),
        expected="missing expected output",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_unknown_list_domain_failure(
            "\x1b[31mred",
            returncode=1,
            context=context,
            cmd=["design-ai", "list", EXPECTED_UNKNOWN_LIST_DOMAIN],
        ),
        expected="ANSI escape",
        scope="smoke assertions",
    )
    assert_unknown_route_id_failure(
        passing_unknown_route_id_output(),
        returncode=1,
        context=context,
        cmd=["design-ai", "prompt", EXPECTED_ROUTE_BRIEF, "--route", EXPECTED_UNKNOWN_ROUTE_ID],
    )
    expect_self_test_failure(
        lambda: assert_unknown_route_id_failure(
            passing_unknown_route_id_output(),
            returncode=0,
            context=context,
            cmd=["design-ai", "prompt", EXPECTED_ROUTE_BRIEF, "--route", EXPECTED_UNKNOWN_ROUTE_ID],
        ),
        expected="expected 1",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_unknown_route_id_failure(
            f"{EXPECTED_ERROR_PREFIX} Unknown route id: {EXPECTED_UNKNOWN_ROUTE_ID}.",
            returncode=1,
            context=context,
            cmd=["design-ai", "prompt", EXPECTED_ROUTE_BRIEF, "--route", EXPECTED_UNKNOWN_ROUTE_ID],
        ),
        expected="missing expected output",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_unknown_route_id_failure(
            "\x1b[31mred",
            returncode=1,
            context=context,
            cmd=["design-ai", "prompt", EXPECTED_ROUTE_BRIEF, "--route", EXPECTED_UNKNOWN_ROUTE_ID],
        ),
        expected="ANSI escape",
        scope="smoke assertions",
    )
    for command_name, option, suggestion in EXPECTED_UNKNOWN_OPTION_SMOKES:
        option_cmd = ["design-ai", *unknown_option_args(command_name, option)]
        assert_unknown_option_failure(
            passing_unknown_option_output(command_name, option, suggestion),
            returncode=1,
            context=context,
            cmd=option_cmd,
            command_name=command_name,
            option=option,
            suggestion=suggestion,
        )
    expect_self_test_failure(
        lambda: assert_unknown_option_failure(
            passing_unknown_option_output("route", "--limt", "--limit"),
            returncode=0,
            context=context,
            cmd=["design-ai", *unknown_option_args("route", "--limt")],
            command_name="route",
            option="--limt",
            suggestion="--limit",
        ),
        expected="expected 1",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_unknown_option_failure(
            f"{EXPECTED_ERROR_PREFIX} Unknown route option: --limt",
            returncode=1,
            context=context,
            cmd=["design-ai", *unknown_option_args("route", "--limt")],
            command_name="route",
            option="--limt",
            suggestion="--limit",
        ),
        expected="missing expected output",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_unknown_option_failure(
            "\x1b[31mred",
            returncode=1,
            context=context,
            cmd=["design-ai", *unknown_option_args("route", "--limt")],
            command_name="route",
            option="--limt",
            suggestion="--limit",
        ),
        expected="ANSI escape",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: unknown_option_args("missing", "--bad"),
        expected="unsupported unknown option smoke command",
        scope="smoke assertions",
    )
    search_dir_cmd = [
        "design-ai",
        "search",
        EXPECTED_CORPUS_SEARCH_QUERY,
        "--dir",
        EXPECTED_UNKNOWN_SEARCH_DIR,
    ]
    assert_search_dir_value_failure(
        passing_search_dir_value_output(),
        returncode=1,
        context=context,
        cmd=search_dir_cmd,
    )
    expect_self_test_failure(
        lambda: assert_search_dir_value_failure(
            passing_search_dir_value_output(),
            returncode=0,
            context=context,
            cmd=search_dir_cmd,
        ),
        expected="expected 1",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_search_dir_value_failure(
            f"{EXPECTED_ERROR_PREFIX} --dir expects one of: {', '.join(EXPECTED_SEARCH_DIRS)}",
            returncode=1,
            context=context,
            cmd=search_dir_cmd,
        ),
        expected="missing expected output",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_search_dir_value_failure(
            "\x1b[31mred",
            returncode=1,
            context=context,
            cmd=search_dir_cmd,
        ),
        expected="ANSI escape",
        scope="smoke assertions",
    )
    for label, args, expected_message in EXPECTED_NUMERIC_VALUE_SMOKES:
        numeric_cmd = ["design-ai", *args]
        assert_numeric_value_failure(
            passing_numeric_value_output(expected_message),
            returncode=1,
            context=context,
            cmd=numeric_cmd,
            expected_message=expected_message,
        )
    expect_self_test_failure(
        lambda: assert_numeric_value_failure(
            passing_numeric_value_output(EXPECTED_NUMERIC_VALUE_SMOKES[0][2]),
            returncode=0,
            context=context,
            cmd=["design-ai", *EXPECTED_NUMERIC_VALUE_SMOKES[0][1]],
            expected_message=EXPECTED_NUMERIC_VALUE_SMOKES[0][2],
        ),
        expected="expected 1",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_numeric_value_failure(
            f"{EXPECTED_ERROR_PREFIX} wrong range",
            returncode=1,
            context=context,
            cmd=["design-ai", *EXPECTED_NUMERIC_VALUE_SMOKES[0][1]],
            expected_message=EXPECTED_NUMERIC_VALUE_SMOKES[0][2],
        ),
        expected="missing expected output",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_numeric_value_failure(
            "\x1b[31mred",
            returncode=1,
            context=context,
            cmd=["design-ai", *EXPECTED_NUMERIC_VALUE_SMOKES[0][1]],
            expected_message=EXPECTED_NUMERIC_VALUE_SMOKES[0][2],
        ),
        expected="ANSI escape",
        scope="smoke assertions",
    )

    list_cmd = ["design-ai", "list", "skills"]
    assert_list_catalog_output(passing_list_catalog_output("skills"), kind="skills", context=context, cmd=list_cmd)
    assert_list_catalog_json(
        passing_list_catalog_json("skills"),
        kind="skills",
        context=context,
        cmd=[*list_cmd, "--json"],
    )
    expect_self_test_failure(
        lambda: assert_list_catalog_output("\x1b[31mred", kind="skills", context=context, cmd=list_cmd),
        expected="ANSI escape",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_list_catalog_json("\x1b[31mred", kind="skills", context=context, cmd=[*list_cmd, "--json"]),
        expected="ANSI escape",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_list_catalog_json(
            passing_list_catalog_json("skills").replace('"count": 19', '"count": 18'),
            kind="skills",
            context=context,
            cmd=[*list_cmd, "--json"],
        ),
        expected="section count differs",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_list_catalog_json(
            passing_list_catalog_json("skills").replace('"name": "component-spec-writer"', '"name": "component-spec"'),
            kind="skills",
            context=context,
            cmd=[*list_cmd, "--json"],
        ),
        expected="item path differs",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_list_catalog_output(
            passing_list_catalog_output("skills").replace("skills (19)", "skills (18)"),
            kind="skills",
            context=context,
            cmd=list_cmd,
        ),
        expected="missing expected content",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_list_catalog_output(
            passing_list_catalog_output("skills").replace("  component-spec-writer", "  component-spec"),
            kind="skills",
            context=context,
            cmd=list_cmd,
        ),
        expected="missing expected skills item",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_list_catalog_output(
            passing_list_catalog_output("skills") + "\n" + passing_list_catalog_output("commands"),
            kind="skills",
            context=context,
            cmd=list_cmd,
        ),
        expected="unexpected commands section",
        scope="smoke assertions",
    )

    overwrite_cmd = [
        "design-ai",
        "prompt",
        EXPECTED_ROUTE_BRIEF,
        "--route",
        EXPECTED_ROUTE_ID,
        "--out",
        "/tmp/existing.md",
    ]
    assert_output_overwrite_failure(
        passing_output_overwrite_failure_output(),
        returncode=1,
        context=context,
        cmd=overwrite_cmd,
        expected_path="/tmp/existing.md",
    )
    expect_self_test_failure(
        lambda: assert_output_overwrite_failure(
            passing_output_overwrite_failure_output(),
            returncode=0,
            context=context,
            cmd=overwrite_cmd,
            expected_path="/tmp/existing.md",
        ),
        expected="expected 1",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_output_overwrite_failure(
            f"{EXPECTED_ERROR_PREFIX} Output file already exists: /tmp/existing.md.",
            returncode=1,
            context=context,
            cmd=overwrite_cmd,
            expected_path="/tmp/existing.md",
        ),
        expected="missing expected content",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_output_overwrite_failure(
            passing_output_overwrite_failure_output(),
            returncode=1,
            context=context,
            cmd=overwrite_cmd,
            expected_path="/tmp/other.md",
        ),
        expected="missing expected content",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_output_overwrite_failure(
            "\x1b[31mred",
            returncode=1,
            context=context,
            cmd=overwrite_cmd,
            expected_path="/tmp/existing.md",
        ),
        expected="ANSI escape",
        scope="smoke assertions",
    )
    assert_output_write_success(
        passing_output_write_success_output("/tmp/output.json"),
        context=context,
        cmd=["design-ai", "prompt", EXPECTED_ROUTE_BRIEF, "--out", "/tmp/output.json"],
        expected_path="/tmp/output.json",
    )
    expect_self_test_failure(
        lambda: assert_output_write_success(
            passing_output_write_success_output("/tmp/output.json"),
            context=context,
            cmd=["design-ai", "prompt", EXPECTED_ROUTE_BRIEF, "--out", "/tmp/output.json"],
            expected_path="/tmp/other.json",
        ),
        expected="missing expected content",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_output_write_success(
            passing_output_overwrite_failure_output("/tmp/output.json"),
            context=context,
            cmd=["design-ai", "prompt", EXPECTED_ROUTE_BRIEF, "--out", "/tmp/output.json"],
            expected_path="/tmp/output.json",
        ),
        expected="overwrite failure",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_output_write_success(
            passing_prompt_json(),
            context=context,
            cmd=["design-ai", "prompt", EXPECTED_ROUTE_BRIEF, "--out", "/tmp/output.json"],
            expected_path="/tmp/output.json",
        ),
        expected="artifact content",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_output_write_success(
            "\x1b[31mred",
            context=context,
            cmd=["design-ai", "prompt", EXPECTED_ROUTE_BRIEF, "--out", "/tmp/output.json"],
            expected_path="/tmp/output.json",
        ),
        expected="ANSI escape",
        scope="smoke assertions",
    )
    force_cmd = [
        "design-ai",
        "prompt",
        EXPECTED_ROUTE_BRIEF,
        "--out",
        "/tmp/output.json",
        "--force",
    ]
    with tempfile.TemporaryDirectory(prefix="design-ai-smoke-force-overwrite-self-test-") as tmp:
        force_output_path = Path(tmp) / "nested" / "output.json"
        seed_force_overwrite_target(force_output_path, context=context, cmd=force_cmd)
        if force_output_path.read_text(encoding="utf-8") != f"{OUTPUT_FORCE_OVERWRITE_SENTINEL}\n":
            raise SystemExit("smoke assertions self-test failed to seed forced overwrite sentinel")
    assert_force_overwrite_replaced(
        passing_prompt_json(),
        context=context,
        cmd=force_cmd,
        expected_path="/tmp/output.json",
    )
    expect_self_test_failure(
        lambda: seed_force_overwrite_target(
            Path("/tmp/output.json"),
            context=context,
            cmd=["design-ai", "prompt", EXPECTED_ROUTE_BRIEF, "--out", "/tmp/output.json"],
        ),
        expected="requires --force",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_force_overwrite_replaced(
            f"{OUTPUT_FORCE_OVERWRITE_SENTINEL}\n",
            context=context,
            cmd=force_cmd,
            expected_path="/tmp/output.json",
        ),
        expected="did not replace sentinel",
        scope="smoke assertions",
    )

    assert_doctor_json_clean(
        passing_doctor_report_json(),
        context=context,
        cmd=cmd,
        parse_error_message=parse_error_message,
    )
    expect_self_test_failure(
        lambda: assert_doctor_json_clean(
            "{",
            context=context,
            cmd=cmd,
            parse_error_message=parse_error_message,
        ),
        expected="failed to parse doctor JSON",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_doctor_json_clean(
            doctor_report_json_missing("Smoke assertions helper"),
            context=context,
            cmd=cmd,
            parse_error_message=parse_error_message,
            print_raw_on_failure=False,
        ),
        expected="Smoke assertions helper=missing",
        scope="smoke assertions",
    )

    search_cmd = ["design-ai", "search", EXPECTED_CORPUS_SEARCH_QUERY, "--dir", "knowledge", "--limit", "1", "--json"]
    assert_search_json_contains_hit(passing_search_json(), context=context, cmd=search_cmd)
    expect_self_test_failure(
        lambda: assert_search_json_contains_hit("{", context=context, cmd=search_cmd),
        expected="failed to parse search JSON",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_search_json_contains_hit(json.dumps([]), context=context, cmd=search_cmd),
        expected="not an object",
        scope="smoke assertions",
    )
    search_wrong_query = json.loads(passing_search_json())
    search_wrong_query["query"] = "Inter"
    expect_self_test_failure(
        lambda: assert_search_json_contains_hit(json.dumps(search_wrong_query), context=context, cmd=search_cmd),
        expected="query differs",
        scope="smoke assertions",
    )
    search_missing_hit = json.loads(passing_search_json())
    search_missing_hit["hits"] = []
    expect_self_test_failure(
        lambda: assert_search_json_contains_hit(json.dumps(search_missing_hit), context=context, cmd=search_cmd),
        expected="does not contain any hits",
        scope="smoke assertions",
    )
    search_invalid_preview = json.loads(passing_search_json())
    search_invalid_preview["hits"][0]["preview"] = "Korean font"
    expect_self_test_failure(
        lambda: assert_search_json_contains_hit(json.dumps(search_invalid_preview), context=context, cmd=search_cmd),
        expected="invalid preview",
        scope="smoke assertions",
    )
    search_missing_hit_key = json.loads(passing_search_json())
    del search_missing_hit_key["hits"][0]["file"]
    expect_self_test_failure(
        lambda: assert_search_json_contains_hit(json.dumps(search_missing_hit_key), context=context, cmd=search_cmd),
        expected="hit keys changed",
        scope="smoke assertions",
    )
    search_bool_line_number = json.loads(passing_search_json())
    search_bool_line_number["hits"][0]["lineNumber"] = True
    expect_self_test_failure(
        lambda: assert_search_json_contains_hit(json.dumps(search_bool_line_number), context=context, cmd=search_cmd),
        expected="invalid line number",
        scope="smoke assertions",
    )
    search_relative_file = json.loads(passing_search_json())
    search_relative_file["hits"][0]["file"] = EXPECTED_CORPUS_SEARCH_HIT
    expect_self_test_failure(
        lambda: assert_search_json_contains_hit(json.dumps(search_relative_file), context=context, cmd=search_cmd),
        expected="file is not absolute",
        scope="smoke assertions",
    )
    search_extra_hit = json.loads(passing_search_json())
    search_extra_hit["hits"].append(dict(search_extra_hit["hits"][0]))
    expect_self_test_failure(
        lambda: assert_search_json_contains_hit(json.dumps(search_extra_hit), context=context, cmd=search_cmd),
        expected="hit count differs",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_search_json_contains_hit("\x1b[31m{}", context=context, cmd=search_cmd),
        expected="ANSI escape",
        scope="smoke assertions",
    )
    search_human_cmd = ["design-ai", "search", EXPECTED_CORPUS_SEARCH_QUERY, "--dir", "knowledge", "--limit", "1"]
    assert_search_human_output(passing_search_human_output(), context=context, cmd=search_human_cmd)
    expect_self_test_failure(
        lambda: assert_search_human_output(passing_search_json(), context=context, cmd=search_human_cmd),
        expected="looks like JSON",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_search_human_output(
            passing_search_human_output().replace(f"{EXPECTED_CORPUS_SEARCH_HIT}:29", "knowledge/missing.md:1"),
            context=context,
            cmd=search_human_cmd,
        ),
        expected="missing expected content",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_search_human_output("\x1b[31mred", context=context, cmd=search_human_cmd),
        expected="ANSI escape",
        scope="smoke assertions",
    )

    show_cmd = ["design-ai", "show", EXPECTED_CORPUS_SHOW_TARGET, "--context", "0", "--json"]
    assert_show_json_line(passing_show_json(), context=context, cmd=show_cmd)
    expect_self_test_failure(
        lambda: assert_show_json_line("{", context=context, cmd=show_cmd),
        expected="failed to parse show JSON",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_show_json_line(json.dumps([]), context=context, cmd=show_cmd),
        expected="not an object",
        scope="smoke assertions",
    )
    show_wrong_path = json.loads(passing_show_json())
    show_wrong_path["relPath"] = "knowledge/WRONG.md"
    expect_self_test_failure(
        lambda: assert_show_json_line(json.dumps(show_wrong_path), context=context, cmd=show_cmd),
        expected="relPath differs",
        scope="smoke assertions",
    )
    show_wrong_line = json.loads(passing_show_json())
    show_wrong_line["lines"][0]["text"] = "# Design-AI principles"
    expect_self_test_failure(
        lambda: assert_show_json_line(json.dumps(show_wrong_line), context=context, cmd=show_cmd),
        expected="line content differs",
        scope="smoke assertions",
    )
    show_missing_file_key = json.loads(passing_show_json())
    del show_missing_file_key["file"]
    expect_self_test_failure(
        lambda: assert_show_json_line(json.dumps(show_missing_file_key), context=context, cmd=show_cmd),
        expected="top-level keys changed",
        scope="smoke assertions",
    )
    show_bool_start = json.loads(passing_show_json())
    show_bool_start["start"] = True
    expect_self_test_failure(
        lambda: assert_show_json_line(json.dumps(show_bool_start), context=context, cmd=show_cmd),
        expected="range uses invalid line numbers",
        scope="smoke assertions",
    )
    show_bool_line_number = json.loads(passing_show_json())
    show_bool_line_number["lines"][0]["number"] = True
    expect_self_test_failure(
        lambda: assert_show_json_line(json.dumps(show_bool_line_number), context=context, cmd=show_cmd),
        expected="line number is invalid",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_show_json_line("\x1b[31m{}", context=context, cmd=show_cmd),
        expected="ANSI escape",
        scope="smoke assertions",
    )

    show_range_cmd = [
        "design-ai",
        "show",
        EXPECTED_CORPUS_SHOW_REL_PATH,
        "--lines",
        EXPECTED_CORPUS_SHOW_RANGE,
        "--json",
    ]
    assert_show_json_range(passing_show_range_json(), context=context, cmd=show_range_cmd)
    expect_self_test_failure(
        lambda: assert_show_json_range("{", context=context, cmd=show_range_cmd),
        expected="failed to parse show range JSON",
        scope="smoke assertions",
    )
    show_range_wrong_end = json.loads(passing_show_range_json())
    show_range_wrong_end["end"] = 1
    expect_self_test_failure(
        lambda: assert_show_json_range(json.dumps(show_range_wrong_end), context=context, cmd=show_range_cmd),
        expected="range differs",
        scope="smoke assertions",
    )
    show_range_missing_line = json.loads(passing_show_range_json())
    show_range_missing_line["lines"] = show_range_missing_line["lines"][:1]
    expect_self_test_failure(
        lambda: assert_show_json_range(json.dumps(show_range_missing_line), context=context, cmd=show_range_cmd),
        expected="exactly two lines",
        scope="smoke assertions",
    )
    show_range_wrong_text = json.loads(passing_show_range_json())
    show_range_wrong_text["lines"][1]["text"] = "missing"
    expect_self_test_failure(
        lambda: assert_show_json_range(json.dumps(show_range_wrong_text), context=context, cmd=show_range_cmd),
        expected="line content differs",
        scope="smoke assertions",
    )
    show_range_bool_line_number = json.loads(passing_show_range_json())
    show_range_bool_line_number["lines"][1]["number"] = True
    expect_self_test_failure(
        lambda: assert_show_json_range(json.dumps(show_range_bool_line_number), context=context, cmd=show_range_cmd),
        expected="line number is invalid",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_show_json_range("\x1b[31m{}", context=context, cmd=show_range_cmd),
        expected="ANSI escape",
        scope="smoke assertions",
    )

    show_human_cmd = ["design-ai", "show", EXPECTED_CORPUS_SHOW_TARGET, "--context", "0"]
    assert_show_human_output(passing_show_human_output(), context=context, cmd=show_human_cmd)
    expect_self_test_failure(
        lambda: assert_show_human_output(passing_show_json(), context=context, cmd=show_human_cmd),
        expected="looks like JSON",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_show_human_output(
            passing_show_human_output().replace(EXPECTED_CORPUS_SHOW_TEXT, "# Missing"),
            context=context,
            cmd=show_human_cmd,
        ),
        expected="missing expected content",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_show_human_output("\x1b[31mred", context=context, cmd=show_human_cmd),
        expected="ANSI escape",
        scope="smoke assertions",
    )

    show_range_human_cmd = [
        "design-ai",
        "show",
        EXPECTED_CORPUS_SHOW_REL_PATH,
        "--lines",
        EXPECTED_CORPUS_SHOW_RANGE,
    ]
    assert_show_human_range_output(passing_show_range_human_output(), context=context, cmd=show_range_human_cmd)
    expect_self_test_failure(
        lambda: assert_show_human_range_output(passing_show_range_json(), context=context, cmd=show_range_human_cmd),
        expected="looks like JSON",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_show_human_range_output(
            passing_show_range_human_output().replace(EXPECTED_CORPUS_SHOW_RANGE_END_TEXT, "missing"),
            context=context,
            cmd=show_range_human_cmd,
        ),
        expected="show range human output",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_show_human_range_output("\x1b[31mred", context=context, cmd=show_range_human_cmd),
        expected="ANSI escape",
        scope="smoke assertions",
    )

    examples_cmd = ["design-ai", "examples", "--route", EXPECTED_EXAMPLES_ROUTE, "--limit", "1", "--json"]
    assert_examples_json_route_hit(passing_examples_json(), context=context, cmd=examples_cmd)
    expect_self_test_failure(
        lambda: assert_examples_json_route_hit("{", context=context, cmd=examples_cmd),
        expected="failed to parse examples JSON",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_examples_json_route_hit(json.dumps([]), context=context, cmd=examples_cmd),
        expected="not an object",
        scope="smoke assertions",
    )
    examples_wrong_route = json.loads(passing_examples_json())
    examples_wrong_route["routeId"] = "design-review"
    expect_self_test_failure(
        lambda: assert_examples_json_route_hit(json.dumps(examples_wrong_route), context=context, cmd=examples_cmd),
        expected="routeId differs",
        scope="smoke assertions",
    )
    examples_empty = json.loads(passing_examples_json())
    examples_empty["examples"] = []
    expect_self_test_failure(
        lambda: assert_examples_json_route_hit(json.dumps(examples_empty), context=context, cmd=examples_cmd),
        expected="does not contain any examples",
        scope="smoke assertions",
    )
    examples_wrong_hit = json.loads(passing_examples_json())
    examples_wrong_hit["examples"][0]["relPath"] = "examples/component-accordion.md"
    expect_self_test_failure(
        lambda: assert_examples_json_route_hit(json.dumps(examples_wrong_hit), context=context, cmd=examples_cmd),
        expected="first example differs",
        scope="smoke assertions",
    )
    examples_bad_score = json.loads(passing_examples_json())
    examples_bad_score["examples"][0]["score"] = 0
    expect_self_test_failure(
        lambda: assert_examples_json_route_hit(json.dumps(examples_bad_score), context=context, cmd=examples_cmd),
        expected="score is not a positive integer",
        scope="smoke assertions",
    )
    examples_bool_score = json.loads(passing_examples_json())
    examples_bool_score["examples"][0]["score"] = True
    expect_self_test_failure(
        lambda: assert_examples_json_route_hit(json.dumps(examples_bool_score), context=context, cmd=examples_cmd),
        expected="score is not a positive integer",
        scope="smoke assertions",
    )
    examples_missing_preview = json.loads(passing_examples_json())
    del examples_missing_preview["examples"][0]["preview"]
    expect_self_test_failure(
        lambda: assert_examples_json_route_hit(json.dumps(examples_missing_preview), context=context, cmd=examples_cmd),
        expected="example keys changed",
        scope="smoke assertions",
    )
    examples_extra_hit = json.loads(passing_examples_json())
    examples_extra_hit["examples"].append(dict(examples_extra_hit["examples"][0]))
    expect_self_test_failure(
        lambda: assert_examples_json_route_hit(json.dumps(examples_extra_hit), context=context, cmd=examples_cmd),
        expected="example count differs",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_examples_json_route_hit("\x1b[31m{}", context=context, cmd=examples_cmd),
        expected="ANSI escape",
        scope="smoke assertions",
    )
    examples_human_cmd = ["design-ai", "examples", "--route", EXPECTED_EXAMPLES_ROUTE, "--limit", "1"]
    assert_examples_human_output(passing_examples_human_output(), context=context, cmd=examples_human_cmd)
    expect_self_test_failure(
        lambda: assert_examples_human_output(passing_examples_json(), context=context, cmd=examples_human_cmd),
        expected="looks like JSON",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_examples_human_output(
            passing_examples_human_output().replace(EXPECTED_EXAMPLES_HIT, "examples/component-accordion.md"),
            context=context,
            cmd=examples_human_cmd,
        ),
        expected="missing expected content",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_examples_human_output("\x1b[31mred", context=context, cmd=examples_human_cmd),
        expected="ANSI escape",
        scope="smoke assertions",
    )

    route_cmd = ["design-ai", "route", EXPECTED_ROUTE_BRIEF, "--limit", "1", "--json"]
    assert_route_json_component_spec(passing_route_json(), context=context, cmd=route_cmd)
    expect_self_test_failure(
        lambda: assert_route_json_component_spec("{", context=context, cmd=route_cmd),
        expected="failed to parse route JSON",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_route_json_component_spec(json.dumps([]), context=context, cmd=route_cmd),
        expected="not an object",
        scope="smoke assertions",
    )
    route_unknown_version = json.loads(passing_route_json())
    route_unknown_version["version"] = "unknown"
    expect_self_test_failure(
        lambda: assert_route_json_component_spec(json.dumps(route_unknown_version), context=context, cmd=route_cmd),
        expected="version is missing",
        scope="smoke assertions",
    )
    route_wrong_id = json.loads(passing_route_json())
    route_wrong_id["routes"][0]["id"] = "design-review"
    expect_self_test_failure(
        lambda: assert_route_json_component_spec(json.dumps(route_wrong_id), context=context, cmd=route_cmd),
        expected="first route differs",
        scope="smoke assertions",
    )
    route_missing_keyword = json.loads(passing_route_json())
    route_missing_keyword["routes"][0]["matchedKeywords"] = ["component", "button"]
    expect_self_test_failure(
        lambda: assert_route_json_component_spec(json.dumps(route_missing_keyword), context=context, cmd=route_cmd),
        expected="missing expected matched keyword",
        scope="smoke assertions",
    )
    route_missing_command = json.loads(passing_route_json())
    route_missing_command["routes"][0]["command"]["exists"] = False
    expect_self_test_failure(
        lambda: assert_route_json_component_spec(json.dumps(route_missing_command), context=context, cmd=route_cmd),
        expected="command differs",
        scope="smoke assertions",
    )
    route_missing_references = json.loads(passing_route_json())
    route_missing_references["routes"][0]["explanation"]["missingReferences"] = [EXPECTED_ROUTE_SKILL]
    expect_self_test_failure(
        lambda: assert_route_json_component_spec(json.dumps(route_missing_references), context=context, cmd=route_cmd),
        expected="contains missing references",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_route_json_component_spec("\x1b[31m{}", context=context, cmd=route_cmd),
        expected="ANSI escape",
        scope="smoke assertions",
    )

    route_explain_cmd = ["design-ai", "route", EXPECTED_ROUTE_BRIEF, "--limit", "1", "--explain"]
    assert_route_explain_human_output(passing_route_explain_human_output(), context=context, cmd=route_explain_cmd)
    expect_self_test_failure(
        lambda: assert_route_explain_human_output(passing_route_json(), context=context, cmd=route_explain_cmd),
        expected="looks like JSON",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_route_explain_human_output(
            passing_route_explain_human_output().replace("refs:", "coverage:"),
            context=context,
            cmd=route_explain_cmd,
        ),
        expected="route explain human output",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_route_explain_human_output("\x1b[31mred", context=context, cmd=route_explain_cmd),
        expected="ANSI escape",
        scope="smoke assertions",
    )

    route_catalog_cmd = ["design-ai", "routes", "--json"]
    assert_route_catalog_json(passing_route_catalog_json(), context=context, cmd=route_catalog_cmd)
    expect_self_test_failure(
        lambda: assert_route_catalog_json("{", context=context, cmd=route_catalog_cmd),
        expected="failed to parse route catalog JSON",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_route_catalog_json(json.dumps([]), context=context, cmd=route_catalog_cmd),
        expected="not an object",
        scope="smoke assertions",
    )
    route_catalog_non_object_entry = json.loads(passing_route_catalog_json())
    route_catalog_non_object_entry["routes"].append("invalid")
    expect_self_test_failure(
        lambda: assert_route_catalog_json(json.dumps(route_catalog_non_object_entry), context=context, cmd=route_catalog_cmd),
        expected="non-object route entry",
        scope="smoke assertions",
    )
    route_catalog_unknown_version = json.loads(passing_route_catalog_json())
    route_catalog_unknown_version["version"] = "unknown"
    expect_self_test_failure(
        lambda: assert_route_catalog_json(json.dumps(route_catalog_unknown_version), context=context, cmd=route_catalog_cmd),
        expected="version is missing",
        scope="smoke assertions",
    )
    route_catalog_missing_route = json.loads(passing_route_catalog_json())
    route_catalog_missing_route["routes"] = [
        route
        for route in route_catalog_missing_route["routes"]
        if route["id"] != EXPECTED_ROUTE_ID
    ]
    expect_self_test_failure(
        lambda: assert_route_catalog_json(json.dumps(route_catalog_missing_route), context=context, cmd=route_catalog_cmd),
        expected="route ids differ",
        scope="smoke assertions",
    )
    route_catalog_wrong_confidence = json.loads(passing_route_catalog_json())
    route_catalog_wrong_confidence["routes"][0]["confidence"] = "high"
    expect_self_test_failure(
        lambda: assert_route_catalog_json(json.dumps(route_catalog_wrong_confidence), context=context, cmd=route_catalog_cmd),
        expected="not marked as catalog",
        scope="smoke assertions",
    )
    route_catalog_missing_reference = json.loads(passing_route_catalog_json())
    route_catalog_missing_reference["routes"][0]["explanation"]["missingReferences"] = ["commands/missing.md"]
    expect_self_test_failure(
        lambda: assert_route_catalog_json(json.dumps(route_catalog_missing_reference), context=context, cmd=route_catalog_cmd),
        expected="contains missing references",
        scope="smoke assertions",
    )
    route_catalog_missing_coverage = json.loads(passing_route_catalog_json())
    route_catalog_missing_coverage["routes"][0]["explanation"]["referenceCoverage"]["total"] = {}
    expect_self_test_failure(
        lambda: assert_route_catalog_json(json.dumps(route_catalog_missing_coverage), context=context, cmd=route_catalog_cmd),
        expected="full reference coverage",
        scope="smoke assertions",
    )
    route_catalog_wrong_component_path = json.loads(passing_route_catalog_json())
    component_route = next(route for route in route_catalog_wrong_component_path["routes"] if route["id"] == EXPECTED_ROUTE_ID)
    component_route["command"]["exists"] = False
    expect_self_test_failure(
        lambda: assert_route_catalog_json(json.dumps(route_catalog_wrong_component_path), context=context, cmd=route_catalog_cmd),
        expected="component route command differs",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_route_catalog_json("\x1b[31m{}", context=context, cmd=route_catalog_cmd),
        expected="ANSI escape",
        scope="smoke assertions",
    )

    prompt_cmd = ["design-ai", "prompt", EXPECTED_ROUTE_BRIEF, "--route", EXPECTED_ROUTE_ID, "--json"]
    assert_prompt_json_component_spec(passing_prompt_json(), context=context, cmd=prompt_cmd)
    expect_self_test_failure(
        lambda: assert_prompt_json_component_spec("{", context=context, cmd=prompt_cmd),
        expected="failed to parse prompt JSON",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_prompt_json_component_spec(json.dumps([]), context=context, cmd=prompt_cmd),
        expected="not an object",
        scope="smoke assertions",
    )
    prompt_wrong_route = json.loads(passing_prompt_json())
    prompt_wrong_route["route"]["id"] = "design-review"
    expect_self_test_failure(
        lambda: assert_prompt_json_component_spec(json.dumps(prompt_wrong_route), context=context, cmd=prompt_cmd),
        expected="route differs",
        scope="smoke assertions",
    )
    prompt_missing_file = json.loads(passing_prompt_json())
    prompt_missing_file["filesToRead"].remove(EXPECTED_ROUTE_SKILL)
    expect_self_test_failure(
        lambda: assert_prompt_json_component_spec(json.dumps(prompt_missing_file), context=context, cmd=prompt_cmd),
        expected="missing expected file",
        scope="smoke assertions",
    )
    prompt_missing_example = json.loads(passing_prompt_json())
    prompt_missing_example["referenceExamples"] = []
    expect_self_test_failure(
        lambda: assert_prompt_json_component_spec(json.dumps(prompt_missing_example), context=context, cmd=prompt_cmd),
        expected="does not contain reference examples",
        scope="smoke assertions",
    )
    prompt_bad_quality = json.loads(passing_prompt_json())
    prompt_bad_quality["qualityCommand"] = "design-ai check output.md --strict"
    expect_self_test_failure(
        lambda: assert_prompt_json_component_spec(json.dumps(prompt_bad_quality), context=context, cmd=prompt_cmd),
        expected="quality command differs",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_prompt_json_component_spec("\x1b[31m{}", context=context, cmd=prompt_cmd),
        expected="ANSI escape",
        scope="smoke assertions",
    )

    prompt_markdown_cmd = ["design-ai", "prompt", EXPECTED_ROUTE_BRIEF, "--route", EXPECTED_ROUTE_ID]
    assert_prompt_markdown_component_spec(
        passing_prompt_markdown_output(),
        context=context,
        cmd=prompt_markdown_cmd,
    )
    expect_self_test_failure(
        lambda: assert_prompt_markdown_component_spec(
            "{",
            context=context,
            cmd=prompt_markdown_cmd,
        ),
        expected="looks like JSON output",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_prompt_markdown_component_spec(
            passing_prompt_markdown_output().replace(EXPECTED_PROMPT_QUALITY_COMMAND, "design-ai check output.md --strict"),
            context=context,
            cmd=prompt_markdown_cmd,
        ),
        expected="missing expected content",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_prompt_markdown_component_spec(
            passing_prompt_markdown_output().replace(EXPECTED_PROMPT_SLASH_COMMAND, "/design-review"),
            context=context,
            cmd=prompt_markdown_cmd,
        ),
        expected="preferred command differs",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_prompt_markdown_component_spec("\x1b[31m{}", context=context, cmd=prompt_markdown_cmd),
        expected="ANSI escape",
        scope="smoke assertions",
    )
    prompt_markdown_body = "# design-ai task prompt" + passing_prompt_markdown_output().split(
        "# design-ai task prompt",
        1,
    )[1]
    assert_prompt_markdown_body_component_spec(
        prompt_markdown_body,
        context=context,
        cmd=prompt_markdown_cmd,
    )
    expect_self_test_failure(
        lambda: assert_prompt_markdown_body_component_spec(
            "{",
            context=context,
            cmd=prompt_markdown_cmd,
        ),
        expected="looks like JSON output",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_prompt_markdown_body_component_spec(
            prompt_markdown_body.replace(EXPECTED_PROMPT_QUALITY_COMMAND, "design-ai check output.md --strict"),
            context=context,
            cmd=prompt_markdown_cmd,
        ),
        expected="missing expected content",
        scope="smoke assertions",
    )

    pack_cmd = [
        "design-ai",
        "pack",
        EXPECTED_ROUTE_BRIEF,
        "--route",
        EXPECTED_ROUTE_ID,
        "--max-bytes",
        str(EXPECTED_PACK_MAX_BYTES),
        "--json",
    ]
    assert_pack_json_component_spec(passing_pack_json(), context=context, cmd=pack_cmd)
    expect_self_test_failure(
        lambda: assert_pack_json_component_spec("{", context=context, cmd=pack_cmd),
        expected="failed to parse pack JSON",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_pack_json_component_spec(json.dumps([]), context=context, cmd=pack_cmd),
        expected="not an object",
        scope="smoke assertions",
    )
    pack_complete = json.loads(passing_pack_json())
    pack_complete["summary"]["status"] = "complete"
    expect_self_test_failure(
        lambda: assert_pack_json_component_spec(json.dumps(pack_complete), context=context, cmd=pack_cmd),
        expected="status differs",
        scope="smoke assertions",
    )
    pack_missing_context = json.loads(passing_pack_json())
    pack_missing_context["summary"]["missingFiles"] = 1
    expect_self_test_failure(
        lambda: assert_pack_json_component_spec(json.dumps(pack_missing_context), context=context, cmd=pack_cmd),
        expected="contains missing context files",
        scope="smoke assertions",
    )
    pack_missing_file = json.loads(passing_pack_json())
    pack_missing_file["files"] = [
        file_entry
        for file_entry in pack_missing_file["files"]
        if file_entry["path"] != EXPECTED_EXAMPLES_HIT
    ]
    expect_self_test_failure(
        lambda: assert_pack_json_component_spec(json.dumps(pack_missing_file), context=context, cmd=pack_cmd),
        expected="missing expected context file",
        scope="smoke assertions",
    )
    pack_no_warning = json.loads(passing_pack_json())
    pack_no_warning["warnings"] = []
    expect_self_test_failure(
        lambda: assert_pack_json_component_spec(json.dumps(pack_no_warning), context=context, cmd=pack_cmd),
        expected="does not report truncation warnings",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_pack_json_component_spec("\x1b[31m{}", context=context, cmd=pack_cmd),
        expected="ANSI escape",
        scope="smoke assertions",
    )

    pack_markdown_cmd = [
        "design-ai",
        "pack",
        EXPECTED_ROUTE_BRIEF,
        "--route",
        EXPECTED_ROUTE_ID,
        "--max-bytes",
        str(EXPECTED_PACK_MAX_BYTES),
    ]
    assert_pack_markdown_component_spec(
        passing_pack_markdown_output(),
        context=context,
        cmd=pack_markdown_cmd,
    )
    expect_self_test_failure(
        lambda: assert_pack_markdown_component_spec(
            "{",
            context=context,
            cmd=pack_markdown_cmd,
        ),
        expected="looks like JSON output",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_pack_markdown_component_spec(
            passing_pack_markdown_output().replace("Context status: partial", "Context status: complete"),
            context=context,
            cmd=pack_markdown_cmd,
        ),
        expected="missing expected content",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_pack_markdown_component_spec(
            passing_pack_markdown_output().replace(EXPECTED_PROMPT_SLASH_COMMAND, "/design-review"),
            context=context,
            cmd=pack_markdown_cmd,
        ),
        expected="preferred command differs",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_pack_markdown_component_spec("\x1b[31m{}", context=context, cmd=pack_markdown_cmd),
        expected="ANSI escape",
        scope="smoke assertions",
    )
    pack_markdown_body = "# design-ai prompt pack" + passing_pack_markdown_output().split(
        "# design-ai prompt pack",
        1,
    )[1]
    assert_pack_markdown_body_component_spec(
        pack_markdown_body,
        context=context,
        cmd=pack_markdown_cmd,
    )
    expect_self_test_failure(
        lambda: assert_pack_markdown_body_component_spec(
            "{",
            context=context,
            cmd=pack_markdown_cmd,
        ),
        expected="looks like JSON output",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_pack_markdown_body_component_spec(
            pack_markdown_body.replace("Context status: partial", "Context status: complete"),
            context=context,
            cmd=pack_markdown_cmd,
        ),
        expected="missing expected content",
        scope="smoke assertions",
    )

    audit_cmd = ["design-ai", "audit", "--strict", "--quiet"]
    run_all_audit_scripts = load_run_all_audit_scripts()
    if run_all_audit_scripts != EXPECTED_AUDIT_SCRIPTS:
        raise SystemExit(
            "smoke assertions self-test failed: EXPECTED_AUDIT_SCRIPTS differs from "
            "tools/audit/run-all.py AUDITS"
        )
    if EXPECTED_AUDIT_COUNT != len(run_all_audit_scripts):
        raise SystemExit(
            "smoke assertions self-test failed: EXPECTED_AUDIT_COUNT differs from "
            "tools/audit/run-all.py AUDITS"
        )
    assert_audit_strict_quiet_output(passing_audit_strict_quiet_output(), context=context, cmd=audit_cmd)
    assert_audit_json(passing_audit_json(), context=context, cmd=[*audit_cmd, "--json"])
    expect_self_test_failure(
        lambda: assert_audit_strict_quiet_output(
            passing_audit_strict_quiet_output().replace("Runner: tools/audit/run-all.py", "Runner: missing.py"),
            context=context,
            cmd=audit_cmd,
        ),
        expected="missing expected content",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_audit_strict_quiet_output(
            passing_audit_strict_quiet_output().replace(
                f"✓ All {EXPECTED_AUDIT_COUNT} audits passed in 2.00s",
                f"✗ 1/{EXPECTED_AUDIT_COUNT} audit(s) failed in 2.00s",
            ),
            context=context,
            cmd=audit_cmd,
        ),
        expected="missing expected content",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_audit_strict_quiet_output(
            passing_audit_strict_quiet_output().replace("2.00s", "eventually"),
            context=context,
            cmd=audit_cmd,
        ),
        expected="success summary differs",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_audit_strict_quiet_output("\x1b[31m{}", context=context, cmd=audit_cmd),
        expected="ANSI escape",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_audit_json("\x1b[31m{}", context=context, cmd=[*audit_cmd, "--json"]),
        expected="ANSI escape",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_audit_json(
            passing_audit_json().replace('"failed": 0', '"failed": 1'),
            context=context,
            cmd=[*audit_cmd, "--json"],
        ),
        expected="summary counts do not match audit entries",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_audit_json(
            passing_audit_json().replace('"script": "frontmatter-check.py"', '"script": "missing.py"', 1),
            context=context,
            cmd=[*audit_cmd, "--json"],
        ),
        expected="audit order differs",
        scope="smoke assertions",
    )
    audit_payload = json.loads(passing_audit_json())
    expect_self_test_failure(
        lambda: assert_audit_json(
            json.dumps(["context", "audits", "summary"]),
            context=context,
            cmd=[*audit_cmd, "--json"],
        ),
        expected="top-level is not an object",
        scope="smoke assertions",
    )
    audit_payload_without_strict_args = json.loads(passing_audit_json())
    del audit_payload_without_strict_args["audits"][0]["strictArgs"]
    expect_self_test_failure(
        lambda: assert_audit_json(
            json.dumps(audit_payload_without_strict_args),
            context=context,
            cmd=[*audit_cmd, "--json"],
        ),
        expected="audit entry keys changed",
        scope="smoke assertions",
    )
    audit_payload_bool_duration = json.loads(passing_audit_json())
    audit_payload_bool_duration["audits"][0]["durationSeconds"] = True
    expect_self_test_failure(
        lambda: assert_audit_json(
            json.dumps(audit_payload_bool_duration),
            context=context,
            cmd=[*audit_cmd, "--json"],
        ),
        expected="duration is invalid",
        scope="smoke assertions",
    )
    audit_payload_bool_summary = json.loads(passing_audit_json())
    audit_payload_bool_summary["summary"]["total"] = True
    expect_self_test_failure(
        lambda: assert_audit_json(
            json.dumps(audit_payload_bool_summary),
            context=context,
            cmd=[*audit_cmd, "--json"],
        ),
        expected="summary total is invalid",
        scope="smoke assertions",
    )
    audit_payload_string_passed = json.loads(passing_audit_json())
    audit_payload_string_passed["audits"][0]["passed"] = "true"
    expect_self_test_failure(
        lambda: assert_audit_json(
            json.dumps(audit_payload_string_passed),
            context=context,
            cmd=[*audit_cmd, "--json"],
        ),
        expected="passed flag is not boolean",
        scope="smoke assertions",
    )
    audit_payload["summary"]["passed"] = EXPECTED_AUDIT_COUNT - 1
    expect_self_test_failure(
        lambda: assert_audit_json(
            json.dumps(audit_payload),
            context=context,
            cmd=[*audit_cmd, "--json"],
        ),
        expected="summary counts do not match audit entries",
        scope="smoke assertions",
    )

    check_examples_cmd = [
        "design-ai",
        "check",
        "--examples",
        "--route",
        EXPECTED_ROUTE_ID,
        "--limit",
        str(EXPECTED_CHECK_EXAMPLES_LIMIT),
        "--strict",
        "--json",
    ]
    assert_check_examples_json_component_spec(passing_check_examples_json(), context=context, cmd=check_examples_cmd)
    expect_self_test_failure(
        lambda: assert_check_examples_json_component_spec("{", context=context, cmd=check_examples_cmd),
        expected="failed to parse check examples JSON",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_check_examples_json_component_spec(json.dumps([]), context=context, cmd=check_examples_cmd),
        expected="not an object",
        scope="smoke assertions",
    )
    check_wrong_route = json.loads(passing_check_examples_json())
    check_wrong_route["routeId"] = "design-review"
    expect_self_test_failure(
        lambda: assert_check_examples_json_component_spec(json.dumps(check_wrong_route), context=context, cmd=check_examples_cmd),
        expected="routeId differs",
        scope="smoke assertions",
    )
    check_warn_status = json.loads(passing_check_examples_json())
    check_warn_status["status"] = "warn"
    expect_self_test_failure(
        lambda: assert_check_examples_json_component_spec(json.dumps(check_warn_status), context=context, cmd=check_examples_cmd),
        expected="status is not pass",
        scope="smoke assertions",
    )
    check_wrong_example = json.loads(passing_check_examples_json())
    check_wrong_example["examples"][0]["example"]["relPath"] = "examples/component-accordion.md"
    expect_self_test_failure(
        lambda: assert_check_examples_json_component_spec(json.dumps(check_wrong_example), context=context, cmd=check_examples_cmd),
        expected="example path differs",
        scope="smoke assertions",
    )
    check_report_warning = json.loads(passing_check_examples_json())
    check_report_warning["examples"][0]["report"]["warnings"] = 1
    expect_self_test_failure(
        lambda: assert_check_examples_json_component_spec(json.dumps(check_report_warning), context=context, cmd=check_examples_cmd),
        expected="warnings or failures",
        scope="smoke assertions",
    )
    check_missing_result = json.loads(passing_check_examples_json())
    check_missing_result["examples"][0]["report"]["results"] = [
        result
        for result in check_missing_result["examples"][0]["report"]["results"]
        if result["id"] != "contrast"
    ]
    expect_self_test_failure(
        lambda: assert_check_examples_json_component_spec(json.dumps(check_missing_result), context=context, cmd=check_examples_cmd),
        expected="missing expected result",
        scope="smoke assertions",
    )
    check_failed_result = json.loads(passing_check_examples_json())
    check_failed_result["examples"][0]["report"]["results"][0]["level"] = "warn"
    expect_self_test_failure(
        lambda: assert_check_examples_json_component_spec(json.dumps(check_failed_result), context=context, cmd=check_examples_cmd),
        expected="result is not pass",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_check_examples_json_component_spec("\x1b[31m{}", context=context, cmd=check_examples_cmd),
        expected="ANSI escape",
        scope="smoke assertions",
    )

    check_all_routes_issues_cmd = [
        "design-ai",
        "check",
        "--examples",
        "--all-routes",
        "--limit",
        "1",
        "--issues-only",
    ]
    assert_check_all_routes_issues_only_output(
        passing_check_all_routes_issues_only_output(),
        context=context,
        cmd=check_all_routes_issues_cmd,
    )
    expect_self_test_failure(
        lambda: assert_check_all_routes_issues_only_output(
            "{",
            context=context,
            cmd=check_all_routes_issues_cmd,
        ),
        expected="looks like JSON output",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_check_all_routes_issues_only_output(
            passing_check_all_routes_issues_only_output().replace("Status: pass", "Status: warn"),
            context=context,
            cmd=check_all_routes_issues_cmd,
        ),
        expected="missing expected content",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_check_all_routes_issues_only_output(
            passing_check_all_routes_issues_only_output().replace(
                "Routes: 18 (0 fail, 0 warn, 18 pass)",
                "Routes: 18 (0 fail, 1 warn, 17 pass)",
            ),
            context=context,
            cmd=check_all_routes_issues_cmd,
        ),
        expected="route summary differs",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_check_all_routes_issues_only_output(
            passing_check_all_routes_issues_only_output() + "✓ component-spec: pass (0 fail, 0 warn, 1 pass)\n",
            context=context,
            cmd=check_all_routes_issues_cmd,
        ),
        expected="printed per-route rows",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_check_all_routes_issues_only_output("\x1b[31m{}", context=context, cmd=check_all_routes_issues_cmd),
        expected="ANSI escape",
        scope="smoke assertions",
    )

    check_artifact_cmd = [
        "design-ai",
        "check",
        EXPECTED_CHECK_ARTIFACT_NAME,
        "--route",
        EXPECTED_ROUTE_ID,
        "--strict",
        "--json",
    ]
    assert_check_artifact_json_component_spec(passing_check_artifact_json(), context=context, cmd=check_artifact_cmd)
    expect_self_test_failure(
        lambda: assert_check_artifact_json_component_spec("{", context=context, cmd=check_artifact_cmd),
        expected="failed to parse check artifact JSON",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_check_artifact_json_component_spec(json.dumps([]), context=context, cmd=check_artifact_cmd),
        expected="not an object",
        scope="smoke assertions",
    )
    artifact_wrong_route = json.loads(passing_check_artifact_json())
    artifact_wrong_route["routeId"] = "design-review"
    expect_self_test_failure(
        lambda: assert_check_artifact_json_component_spec(json.dumps(artifact_wrong_route), context=context, cmd=check_artifact_cmd),
        expected="routeId differs",
        scope="smoke assertions",
    )
    artifact_warn_status = json.loads(passing_check_artifact_json())
    artifact_warn_status["status"] = "warn"
    expect_self_test_failure(
        lambda: assert_check_artifact_json_component_spec(json.dumps(artifact_warn_status), context=context, cmd=check_artifact_cmd),
        expected="status is not pass",
        scope="smoke assertions",
    )
    artifact_report_warning = json.loads(passing_check_artifact_json())
    artifact_report_warning["warnings"] = 1
    expect_self_test_failure(
        lambda: assert_check_artifact_json_component_spec(json.dumps(artifact_report_warning), context=context, cmd=check_artifact_cmd),
        expected="warnings or failures",
        scope="smoke assertions",
    )
    artifact_wrong_file = json.loads(passing_check_artifact_json())
    artifact_wrong_file["filePath"] = "component-other.md"
    expect_self_test_failure(
        lambda: assert_check_artifact_json_component_spec(json.dumps(artifact_wrong_file), context=context, cmd=check_artifact_cmd),
        expected="file path differs",
        scope="smoke assertions",
    )
    artifact_missing_result = json.loads(passing_check_artifact_json())
    artifact_missing_result["results"] = [
        result
        for result in artifact_missing_result["results"]
        if result["id"] != "contrast"
    ]
    expect_self_test_failure(
        lambda: assert_check_artifact_json_component_spec(json.dumps(artifact_missing_result), context=context, cmd=check_artifact_cmd),
        expected="missing expected result",
        scope="smoke assertions",
    )
    artifact_failed_result = json.loads(passing_check_artifact_json())
    artifact_failed_result["results"][0]["passed"] = False
    expect_self_test_failure(
        lambda: assert_check_artifact_json_component_spec(json.dumps(artifact_failed_result), context=context, cmd=check_artifact_cmd),
        expected="result is not pass",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_check_artifact_json_component_spec("\x1b[31m{}", context=context, cmd=check_artifact_cmd),
        expected="ANSI escape",
        scope="smoke assertions",
    )

    check_stdin_cmd = [
        "design-ai",
        "check",
        "--stdin",
        "--route",
        EXPECTED_ROUTE_ID,
        "--strict",
        "--json",
    ]
    assert_check_stdin_json_component_spec(
        passing_check_artifact_json(file_path="stdin"),
        context=context,
        cmd=check_stdin_cmd,
    )
    expect_self_test_failure(
        lambda: assert_check_stdin_json_component_spec("{", context=context, cmd=check_stdin_cmd),
        expected="failed to parse check stdin JSON",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_check_stdin_json_component_spec(json.dumps([]), context=context, cmd=check_stdin_cmd),
        expected="not an object",
        scope="smoke assertions",
    )
    stdin_wrong_file = json.loads(passing_check_artifact_json(file_path="stdin"))
    stdin_wrong_file["filePath"] = EXPECTED_CHECK_ARTIFACT_NAME
    expect_self_test_failure(
        lambda: assert_check_stdin_json_component_spec(json.dumps(stdin_wrong_file), context=context, cmd=check_stdin_cmd),
        expected="file path differs",
        scope="smoke assertions",
    )
    stdin_failed_result = json.loads(passing_check_artifact_json(file_path="stdin"))
    stdin_failed_result["results"][0]["level"] = "warn"
    expect_self_test_failure(
        lambda: assert_check_stdin_json_component_spec(json.dumps(stdin_failed_result), context=context, cmd=check_stdin_cmd),
        expected="result is not pass",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_check_stdin_json_component_spec("\x1b[31m{}", context=context, cmd=check_stdin_cmd),
        expected="ANSI escape",
        scope="smoke assertions",
    )

    assert parse_help_topics(
        passing_help_catalog_json(),
        context=context,
        cmd=help_cmd,
    ) == list(EXPECTED_HELP_TOPICS)
    expect_self_test_failure(
        lambda: parse_help_topics("{", context=context, cmd=help_cmd),
        expected="failed to parse help JSON",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: parse_help_topics(json.dumps([]), context=context, cmd=help_cmd),
        expected="not an object",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: parse_help_topics(
            json.dumps({"topics": []}),
            context=context,
            cmd=help_cmd,
        ),
        expected="aliases object",
        scope="smoke assertions",
    )
    invalid_root_usage_catalog = json.loads(passing_help_catalog_json())
    invalid_root_usage_catalog["usage"] = "design-ai help"
    expect_self_test_failure(
        lambda: parse_help_topics(
            json.dumps(invalid_root_usage_catalog),
            context=context,
            cmd=help_cmd,
        ),
        expected="usage differs",
        scope="smoke assertions",
    )
    invalid_usage_catalog = json.loads(passing_help_catalog_json())
    invalid_usage_catalog["topics"][0]["usage"] = ""
    expect_self_test_failure(
        lambda: parse_help_topics(
            json.dumps(invalid_usage_catalog),
            context=context,
            cmd=help_cmd,
        ),
        expected="invalid usage",
        scope="smoke assertions",
    )
    invalid_alias_catalog = json.loads(passing_help_catalog_json())
    invalid_alias_catalog["aliases"]["i"] = "route"
    expect_self_test_failure(
        lambda: parse_help_topics(
            json.dumps(invalid_alias_catalog),
            context=context,
            cmd=help_cmd,
        ),
        expected="aliases differ",
        scope="smoke assertions",
    )
    missing_topic_alias_catalog = json.loads(passing_help_catalog_json())
    missing_topic_alias_catalog["topics"][0]["aliases"] = []
    expect_self_test_failure(
        lambda: parse_help_topics(
            json.dumps(missing_topic_alias_catalog),
            context=context,
            cmd=help_cmd,
        ),
        expected="topic aliases differ",
        scope="smoke assertions",
    )
    alias_mapping_catalog = json.loads(passing_help_catalog_json())
    alias_mapping_catalog["topics"][0]["aliases"].append("find")
    expect_self_test_failure(
        lambda: parse_help_topics(
            json.dumps(alias_mapping_catalog),
            context=context,
            cmd=help_cmd,
        ),
        expected="does not map",
        scope="smoke assertions",
    )
    missing_topic_catalog = json.loads(passing_help_catalog_json())
    missing_topic_catalog["topics"] = [
        topic
        for topic in missing_topic_catalog["topics"]
        if topic["topic"] != "pack"
    ]
    expect_self_test_failure(
        lambda: parse_help_topics(
            json.dumps(missing_topic_catalog),
            context=context,
            cmd=help_cmd,
        ),
        expected="missing expected topic",
        scope="smoke assertions",
    )
    unexpected_topic_catalog = json.loads(passing_help_catalog_json())
    unexpected_topic_catalog["topics"].append({
        "topic": "new-topic",
        "usage": "design-ai new-topic",
        "description": "new-topic help topic",
        "aliases": [],
    })
    expect_self_test_failure(
        lambda: parse_help_topics(
            json.dumps(unexpected_topic_catalog),
            context=context,
            cmd=help_cmd,
        ),
        expected="unexpected topic",
        scope="smoke assertions",
    )
    reordered_topic_catalog = json.loads(passing_help_catalog_json())
    reordered_topic_catalog["topics"][0], reordered_topic_catalog["topics"][1] = (
        reordered_topic_catalog["topics"][1],
        reordered_topic_catalog["topics"][0],
    )
    expect_self_test_failure(
        lambda: parse_help_topics(
            json.dumps(reordered_topic_catalog),
            context=context,
            cmd=help_cmd,
        ),
        expected="topic order differs",
        scope="smoke assertions",
    )
    duplicate_topic_catalog = json.loads(passing_help_catalog_json())
    duplicate_topic_catalog["topics"].append(duplicate_topic_catalog["topics"][-1])
    expect_self_test_failure(
        lambda: parse_help_topics(
            json.dumps(duplicate_topic_catalog),
            context=context,
            cmd=help_cmd,
        ),
        expected="duplicate topics",
        scope="smoke assertions",
    )
    help_topic_cmd = ["design-ai", "help", "search"]
    assert_help_topic_output(
        passing_help_topic_output("search"),
        topic="search",
        context=context,
        cmd=help_topic_cmd,
    )
    assert_help_topic_output(
        passing_help_topic_output("find"),
        topic="find",
        context=context,
        cmd=["design-ai", "help", "find"],
    )
    expect_self_test_failure(
        lambda: assert_help_topic_output(
            passing_help_catalog_json(),
            topic="search",
            context=context,
            cmd=help_topic_cmd,
        ),
        expected="looks like JSON",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_help_topic_output(
            "Unknown help topic: search",
            topic="search",
            context=context,
            cmd=help_topic_cmd,
        ),
        expected="reported an unknown topic",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_help_topic_output(
            passing_help_topic_output("search").replace("design-ai search <query>", "design-ai search"),
            topic="search",
            context=context,
            cmd=help_topic_cmd,
        ),
        expected="missing expected content",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_help_topic_output("\x1b[31mred", topic="search", context=context, cmd=help_topic_cmd),
        expected="ANSI escape",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_help_topic_output(
            passing_help_topic_output("search"),
            topic="unknown",
            context=context,
            cmd=["design-ai", "help", "unknown"],
        ),
        expected="unsupported topic",
        scope="smoke assertions",
    )
    main_help_cmd = ["design-ai", "help"]
    assert_main_help_output(passing_main_help_output(), context=context, cmd=main_help_cmd)
    expect_self_test_failure(
        lambda: assert_main_help_output(passing_help_catalog_json(), context=context, cmd=main_help_cmd),
        expected="looks like JSON",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_main_help_output("Unknown command: help", context=context, cmd=main_help_cmd),
        expected="reported an unknown",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_main_help_output(
            passing_main_help_output().replace("Quickstart:", "Getting started:"),
            context=context,
            cmd=main_help_cmd,
        ),
        expected="missing expected content",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_main_help_output("\x1b[31mred", context=context, cmd=main_help_cmd),
        expected="ANSI escape",
        scope="smoke assertions",
    )
    version_cmd = ["design-ai", "version"]
    assert_version_output(passing_version_output(), context=context, cmd=version_cmd)
    assert_version_json(passing_version_json(), context=context, cmd=[*version_cmd, "--json"])
    expect_self_test_failure(
        lambda: assert_version_output(passing_help_catalog_json(), context=context, cmd=version_cmd),
        expected="looks like JSON",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_version_output(
            passing_version_output().replace("Plugin / corpus:", "Plugin:"),
            context=context,
            cmd=version_cmd,
        ),
        expected="missing expected content",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_version_output("\x1b[31mred", context=context, cmd=version_cmd),
        expected="ANSI escape",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_version_json("\x1b[31m{}", context=context, cmd=[*version_cmd, "--json"]),
        expected="ANSI escape",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_version_json(
            passing_version_json().replace('"aligned": true', '"aligned": false'),
            context=context,
            cmd=[*version_cmd, "--json"],
        ),
        expected="versions are not aligned",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_version_json(
            passing_version_json().replace('"plugin": "4.13.0"', '"plugin": "unknown"'),
            context=context,
            cmd=[*version_cmd, "--json"],
        ),
        expected="version differs from expected semver",
        scope="smoke assertions",
    )
    assert_command_alias_output(
        passing_help_topic_output("find"),
        command=("find", "--help"),
        context=context,
        cmd=["design-ai", "find", "--help"],
    )
    assert_command_alias_output(
        passing_version_output(),
        command=("--version",),
        context=context,
        cmd=["design-ai", "--version"],
    )
    assert_command_alias_output(
        passing_main_help_output(),
        command=("--help",),
        context=context,
        cmd=["design-ai", "--help"],
    )
    expect_self_test_failure(
        lambda: assert_command_alias_output(
            passing_main_help_output(),
            command=("bad",),
            context=context,
            cmd=["design-ai", "bad"],
        ),
        expected="unsupported command",
        scope="smoke assertions",
    )
    doctor_strict_cmd = ["design-ai", "doctor", "--strict"]
    assert_doctor_strict_output(
        passing_doctor_strict_output(),
        context=context,
        cmd=doctor_strict_cmd,
    )
    expect_self_test_failure(
        lambda: assert_doctor_strict_output(
            passing_doctor_report_json(),
            context=context,
            cmd=doctor_strict_cmd,
        ),
        expected="looks like JSON",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_doctor_strict_output(
            passing_doctor_strict_output().replace(
                "Installed slash commands: 16/16 installed",
                "Installed slash commands: 15/16 installed; 1 missing",
            ),
            context=context,
            cmd=doctor_strict_cmd,
        ),
        expected="missing expected content",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_doctor_strict_output(
            passing_doctor_strict_output().replace(
                f"Summary: {len(EXPECTED_DOCTOR_PASS_LABELS)} pass, 0 warning(s), 0 failure(s)",
                "Summary: 14 pass, 1 warning(s), 0 failure(s)",
            ),
            context=context,
            cmd=doctor_strict_cmd,
        ),
        expected="missing expected content",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_doctor_strict_output("\x1b[31mred", context=context, cmd=doctor_strict_cmd),
        expected="ANSI escape",
        scope="smoke assertions",
    )
    install_cmd = ["design-ai", "install"]
    assert_install_output(passing_install_output(), context=context, cmd=install_cmd)
    assert_install_json(
        passing_install_json("smoke-design-"),
        prefix="smoke-design-",
        context=context,
        cmd=[*install_cmd, "--json"],
    )
    update_cmd = ["design-ai", "update", "--dry-run"]
    assert_update_dry_run_output(
        passing_update_dry_run_output(),
        context=context,
        cmd=update_cmd,
    )
    assert_update_dry_run_json(
        passing_update_dry_run_json("smoke-design-"),
        prefix="smoke-design-",
        context=context,
        cmd=[*update_cmd, "--json"],
    )
    expect_self_test_failure(
        lambda: assert_install_output(
            passing_install_output().replace("Installed 19 skills", "Installed 18 skills"),
            context=context,
            cmd=install_cmd,
        ),
        expected="missing expected content",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_install_output(
            passing_install_output() + "\nSkipping smoke-design-foo: a non-symlink already exists",
            context=context,
            cmd=install_cmd,
        ),
        expected="skipped symlink",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_install_output("\x1b[31mred", context=context, cmd=install_cmd),
        expected="ANSI escape",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_install_json(
            passing_install_json("smoke-design-").replace('"total": 39', '"total": 38'),
            prefix="smoke-design-",
            context=context,
            cmd=[*install_cmd, "--json"],
        ),
        expected="installed total does not match section counts",
        scope="smoke assertions",
    )
    install_payload_bool_count = json.loads(passing_install_json("smoke-design-"))
    install_payload_bool_count["result"]["installed"]["skills"] = True
    expect_self_test_failure(
        lambda: assert_install_json(
            json.dumps(install_payload_bool_count),
            prefix="smoke-design-",
            context=context,
            cmd=[*install_cmd, "--json"],
        ),
        expected="installed skills is invalid",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_install_json(
            json.dumps(["context", "result"]),
            prefix="smoke-design-",
            context=context,
            cmd=[*install_cmd, "--json"],
        ),
        expected="top-level is not an object",
        scope="smoke assertions",
    )
    install_payload_wrong_counts = json.loads(passing_install_json("smoke-design-"))
    install_payload_wrong_counts["result"]["installed"]["skills"] = 18
    install_payload_wrong_counts["result"]["installed"]["total"] = 38
    expect_self_test_failure(
        lambda: assert_install_json(
            json.dumps(install_payload_wrong_counts),
            prefix="smoke-design-",
            context=context,
            cmd=[*install_cmd, "--json"],
        ),
        expected="installed counts differ",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_install_json(
            "\x1b[31mred",
            prefix="smoke-design-",
            context=context,
            cmd=[*install_cmd, "--json"],
        ),
        expected="ANSI escape",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_update_dry_run_output(
            passing_update_dry_run_output() + "\nPulling latest from git...",
            context=context,
            cmd=update_cmd,
        ),
        expected="mutating update work",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_update_dry_run_json(
            passing_update_dry_run_json("smoke-design-").replace('"ready": true', '"ready": false'),
            prefix="smoke-design-",
            context=context,
            cmd=[*update_cmd, "--json"],
        ),
        expected="result summary changed",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_update_dry_run_json(
            json.dumps(["context", "plan", "result"]),
            prefix="smoke-design-",
            context=context,
            cmd=[*update_cmd, "--json"],
        ),
        expected="top-level is not an object",
        scope="smoke assertions",
    )
    status_cmd = ["design-ai", "status"]
    assert_status_output(passing_status_output(), context=context, cmd=status_cmd)
    assert_status_json(
        passing_status_json("smoke-design-"),
        prefix="smoke-design-",
        context=context,
        cmd=[*status_cmd, "--json"],
    )
    expect_self_test_failure(
        lambda: assert_status_output(
            passing_status_output().replace("Skills: 19 installed", "Skills: 0 installed"),
            context=context,
            cmd=status_cmd,
        ),
        expected="missing installed symlinks",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_status_output(
            passing_status_output().replace("Slash commands: 16 installed", "Slash commands: 15 installed"),
            context=context,
            cmd=status_cmd,
        ),
        expected="missing expected content",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_status_json(
            "\x1b[31mred",
            prefix="smoke-design-",
            context=context,
            cmd=[*status_cmd, "--json"],
        ),
        expected="ANSI escape",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_status_json(
            passing_status_json("smoke-design-").replace('"installed": 39', '"installed": 38'),
            prefix="smoke-design-",
            context=context,
            cmd=[*status_cmd, "--json"],
        ),
        expected="summary installed count differs",
        scope="smoke assertions",
    )
    status_payload_bool_summary = json.loads(passing_status_json("smoke-design-"))
    status_payload_bool_summary["summary"]["missingSections"] = False
    expect_self_test_failure(
        lambda: assert_status_json(
            json.dumps(status_payload_bool_summary),
            prefix="smoke-design-",
            context=context,
            cmd=[*status_cmd, "--json"],
        ),
        expected="summary missingSections is invalid",
        scope="smoke assertions",
    )
    status_payload_bool_section = json.loads(passing_status_json("smoke-design-"))
    status_payload_bool_section["sections"][0]["installed"] = True
    expect_self_test_failure(
        lambda: assert_status_json(
            json.dumps(status_payload_bool_section),
            prefix="smoke-design-",
            context=context,
            cmd=[*status_cmd, "--json"],
        ),
        expected="installed count is invalid",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_status_json(
            json.dumps(["context", "sections", "summary"]),
            prefix="smoke-design-",
            context=context,
            cmd=[*status_cmd, "--json"],
        ),
        expected="top-level is not an object",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_status_json(
            passing_status_json("smoke-design-").replace("smoke-design-color-palette", "smoke-design-color"),
            prefix="smoke-design-",
            context=context,
            cmd=[*status_cmd, "--json"],
        ),
        expected="entries differ",
        scope="smoke assertions",
    )
    uninstall_cmd = ["design-ai", "uninstall"]
    assert_uninstall_output(passing_uninstall_output(), context=context, cmd=uninstall_cmd)
    assert_uninstall_json(
        passing_uninstall_json("smoke-design-"),
        prefix="smoke-design-",
        context=context,
        cmd=[*uninstall_cmd, "--json"],
    )
    expect_self_test_failure(
        lambda: assert_uninstall_output(
            passing_uninstall_output().replace("Removed 39 design-ai symlinks", "Removed 38 design-ai symlinks"),
            context=context,
            cmd=uninstall_cmd,
        ),
        expected="missing expected content",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_uninstall_json(
            passing_uninstall_json("smoke-design-").replace('"removed": 39', '"removed": 38'),
            prefix="smoke-design-",
            context=context,
            cmd=[*uninstall_cmd, "--json"],
        ),
        expected="removed count differs",
        scope="smoke assertions",
    )
    uninstall_payload_bool_removed = json.loads(passing_uninstall_json("smoke-design-"))
    uninstall_payload_bool_removed["result"]["removed"] = True
    expect_self_test_failure(
        lambda: assert_uninstall_json(
            json.dumps(uninstall_payload_bool_removed),
            prefix="smoke-design-",
            context=context,
            cmd=[*uninstall_cmd, "--json"],
        ),
        expected="removed count is invalid",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_uninstall_json(
            json.dumps(["context", "result"]),
            prefix="smoke-design-",
            context=context,
            cmd=[*uninstall_cmd, "--json"],
        ),
        expected="top-level is not an object",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_uninstall_json(
            "\x1b[31mred",
            prefix="smoke-design-",
            context=context,
            cmd=[*uninstall_cmd, "--json"],
        ),
        expected="ANSI escape",
        scope="smoke assertions",
    )
    assert_install_lifecycle_output(
        passing_install_lifecycle_output(),
        context=context,
        cmd=["sh", "-c", "design-ai install && design-ai status && design-ai uninstall"],
    )
    expect_self_test_failure(
        lambda: assert_install_lifecycle_output(
            passing_install_output() + passing_status_output(),
            context=context,
            cmd=["sh", "-c", "design-ai install && design-ai status"],
        ),
        expected="missing expected content",
        scope="smoke assertions",
    )
    assert_install_doctor_lifecycle_output(
        passing_install_doctor_lifecycle_output(),
        context=context,
        cmd=[
            "sh",
            "-c",
            "design-ai install && design-ai doctor --strict && design-ai status && design-ai uninstall",
        ],
    )
    expect_self_test_failure(
        lambda: assert_install_doctor_lifecycle_output(
            passing_install_lifecycle_output(),
            context=context,
            cmd=["sh", "-c", "design-ai install && design-ai status && design-ai uninstall"],
        ),
        expected="doctor strict output",
        scope="smoke assertions",
    )
    assert help_topic_script(["install", "route"]) == (
        "design-ai help install && design-ai help route"
    )
    assert help_topic_script(["route topic"]) == "design-ai help 'route topic'"
    expect_self_test_failure(
        lambda: help_topic_script([]),
        expected="requires at least one topic",
        scope="smoke assertions",
    )
    assert help_alias_script() == (
        "design-ai help i && "
        "design-ai help upgrade && "
        "design-ai help u && "
        "design-ai help remove && "
        "design-ai help rm && "
        "design-ai help s && "
        "design-ai help ls && "
        "design-ai help find && "
        "design-ai help cat && "
        "design-ai help recommend && "
        "design-ai help lint && "
        "design-ai help a && "
        "design-ai help diag && "
        "design-ai help example && "
        "design-ai help ex && "
        "design-ai help v"
    )
    assert design_ai_command_script([("find", "route topic"), ("cat", "knowledge/PRINCIPLES.md:1")]) == (
        "design-ai find 'route topic' && design-ai cat knowledge/PRINCIPLES.md:1"
    )
    expect_self_test_failure(
        lambda: design_ai_command_script([]),
        expected="requires at least one command",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: design_ai_command_script([("",)]),
        expected="invalid command",
        scope="smoke assertions",
    )
    assert command_alias_script() == (
        "design-ai i --help && "
        "design-ai upgrade --help && "
        "design-ai u --help && "
        "design-ai remove --help && "
        "design-ai rm --help && "
        "design-ai s --help && "
        "design-ai ls --help && "
        "design-ai find --help && "
        "design-ai cat --help && "
        "design-ai recommend --help && "
        "design-ai lint --help && "
        "design-ai a --help && "
        "design-ai diag --help && "
        "design-ai example --help && "
        "design-ai ex --help && "
        "design-ai v --help && "
        "design-ai --version && "
        "design-ai -v && "
        "design-ai --help && "
        "design-ai -h"
    )
    assert functional_alias_script() == (
        "design-ai ls skills && "
        "design-ai find Pretendard --dir knowledge --limit 1 --json && "
        "design-ai cat knowledge/PRINCIPLES.md:1 --context 0 --json && "
        "design-ai recommend 'Spec a Button component API with keyboard accessibility' --limit 1 --json && "
        "design-ai example --route component-spec --limit 1 --json && "
        "design-ai ex --route component-spec --limit 1 && "
        "design-ai lint --examples --route component-spec --limit 1 --strict --json"
    )
    assert validate_functional_alias_smoke_cases() == EXPECTED_FUNCTIONAL_ALIAS_TARGETS
    expect_self_test_failure(
        lambda: validate_functional_alias_smoke_cases((
            ("canonical search", ("search", EXPECTED_CORPUS_SEARCH_QUERY), "search-json"),
        )),
        expected="does not use a documented help alias",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: validate_functional_alias_smoke_cases((
            ("find with unsupported assertion", ("find", EXPECTED_CORPUS_SEARCH_QUERY), "missing-assertion"),
        )),
        expected="unsupported assertion",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: validate_functional_alias_smoke_cases(EXPECTED_FUNCTIONAL_ALIAS_SMOKES[:-1]),
        expected="differ from expected alias target coverage",
        scope="smoke assertions",
    )
    functional_alias_outputs = {
        ("design-ai", "ls", "skills"): passing_list_catalog_output("skills"),
        (
            "design-ai",
            "find",
            EXPECTED_CORPUS_SEARCH_QUERY,
            "--dir",
            "knowledge",
            "--limit",
            "1",
            "--json",
        ): passing_search_json(),
        (
            "design-ai",
            "cat",
            EXPECTED_CORPUS_SHOW_TARGET,
            "--context",
            "0",
            "--json",
        ): passing_show_json(),
        (
            "design-ai",
            "recommend",
            EXPECTED_ROUTE_BRIEF,
            "--limit",
            "1",
            "--json",
        ): passing_route_json(),
        (
            "design-ai",
            "example",
            "--route",
            EXPECTED_EXAMPLES_ROUTE,
            "--limit",
            "1",
            "--json",
        ): passing_examples_json(),
        (
            "design-ai",
            "ex",
            "--route",
            EXPECTED_EXAMPLES_ROUTE,
            "--limit",
            "1",
        ): passing_examples_human_output(),
        (
            "design-ai",
            "lint",
            "--examples",
            "--route",
            EXPECTED_ROUTE_ID,
            "--limit",
            "1",
            "--strict",
            "--json",
        ): passing_check_examples_json(),
    }
    functional_alias_calls = []
    functional_alias_cwd = Path("/tmp/design-ai-functional-alias-self-test")
    functional_alias_env = {"NO_COLOR": "1"}

    def fake_functional_alias_runner(
        cmd: list[str],
        *,
        cwd: Path | None = None,
        env: dict[str, str],
    ) -> object:
        if cwd != functional_alias_cwd:
            raise SystemExit("functional alias self-test cwd was not forwarded")
        if env != functional_alias_env:
            raise SystemExit("functional alias self-test env was not forwarded")
        functional_alias_calls.append(tuple(cmd))
        try:
            stdout = functional_alias_outputs[tuple(cmd)]
        except KeyError as error:
            raise SystemExit(f"functional alias self-test received unexpected command: {cmd}") from error
        return type("FunctionalAliasResult", (), {"stdout": stdout})()

    assert_functional_alias_smokes(
        lambda *args: ["design-ai", *args],
        run_command=fake_functional_alias_runner,
        cwd=functional_alias_cwd,
        env=functional_alias_env,
        context=context,
    )
    if functional_alias_calls != list(functional_alias_outputs):
        raise SystemExit("functional alias self-test command order differs from expected order")

    def fake_broken_functional_alias_runner(
        cmd: list[str],
        *,
        cwd: Path | None = None,
        env: dict[str, str],
    ) -> object:
        if tuple(cmd) == ("design-ai", "ls", "skills"):
            return type("FunctionalAliasResult", (), {"stdout": passing_list_catalog_output("commands")})()
        return fake_functional_alias_runner(cmd, cwd=cwd, env=env)

    expect_self_test_failure(
        lambda: assert_functional_alias_smokes(
            lambda *args: ["design-ai", *args],
            run_command=fake_broken_functional_alias_runner,
            cwd=functional_alias_cwd,
            env=functional_alias_env,
            context=context,
        ),
        expected="list catalog output",
        scope="smoke assertions",
    )

    print("Smoke assertions self-test passed")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--self-test", action="store_true", help="Run local smoke assertion fixtures")
    args = parser.parse_args()

    if args.self_test:
        run_self_test()
        return

    run_self_test()


if __name__ == "__main__":
    main()
