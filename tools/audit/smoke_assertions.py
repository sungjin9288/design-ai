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
    "learn",
    "workspace",
    "site",
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
    "ws": "workspace",
    "v": "version",
}
EXPECTED_HELP_PAYLOAD_KEYS = ["usage", "topics", "aliases"]
EXPECTED_HELP_TOPIC_KEYS = ["topic", "usage", "description", "aliases"]
EXPECTED_HELP_TOPIC_USAGES = {
    "install": "design-ai install [--json]",
    "update": "design-ai update [--dry-run] [--json]",
    "uninstall": "design-ai uninstall [--json]",
    "status": "design-ai status [--json]",
    "list": "design-ai list [skills|commands|agents] [--json]",
    "search": "design-ai search <query> [--dir kind] [--limit N] [--json]",
    "show": "design-ai show <file[:line]> [--lines N:M] [--context N] [--json]",
    "route": "design-ai route <brief|--from-file file|--stdin|--list> [--limit N]",
    "routes": "design-ai routes [--json]",
    "prompt": "design-ai prompt <brief|--from-file file|--stdin> [--route id] [--with-learning] [--learning-category kind] [--learning-limit N] [--out file]",
    "pack": "design-ai pack <brief|--from-file file|--stdin> [--route id] [--with-learning] [--learning-category kind] [--learning-limit N] [--max-bytes N]",
    "check": "design-ai check <artifact.md|--stdin|--examples> [--route id|--all-routes] [--learn]",
    "audit": "design-ai audit [--strict] [--quiet] [--json]",
    "doctor": "design-ai doctor [--strict] [--json] [--fix]",
    "examples": "design-ai examples [query] [--route id] [--limit N] [--json]",
    "learn": "design-ai learn [--init|--remember text|--feedback text|--list|--export|--query text|--explain|--backup|--redact|--verify|--diff|--restore|--restore-backups [--prune]|--import|--audit [--fix]|--curate|--stats|--usage|--eval-template|--eval|--forget id|--clear] [--json|--report] [--out file]",
    "workspace": "design-ai workspace [--root path] [--learning-file path] [--learning-usage path] [--learning-eval path] [--strict] [--json]",
    "site": "design-ai site <workspace.json|--stdin> [--strict] [--json|--mcp-check|--mcp-plan|--tasks|--bundle|--report|--prompts|--prompt id [--task id]] [--out file] | site <bundle-dir> --bundle-check [--json] | site <bundle-dir> --bundle-compare other-bundle-dir [--json] | site <bundle-dir> --bundle-handoff [--json] | site --sample [--out file] | site --prompt-list [--json]",
    "version": "design-ai version [--json]",
    "help": "design-ai help [command|--json]",
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
    "prompt": ("Usage:", "design-ai prompt <brief> [--route id] [--with-learning] [--learning-category kind] [--learning-limit N] [--json] [--out file] [--force]"),
    "pack": ("Usage:", "design-ai pack <brief> [--route id] [--with-learning] [--learning-category kind] [--learning-limit N] [--max-bytes N] [--json] [--out file] [--force]"),
    "check": ("Usage:", "design-ai check <artifact.md>", "design-ai check --examples --all-routes", "--learn"),
    "audit": ("Usage:", "design-ai audit [--strict] [--quiet] [--json]"),
    "doctor": ("Usage:", "design-ai doctor [--strict] [--json] [--fix]"),
    "examples": ("Usage:", "design-ai examples [query] [--route id] [--limit N] [--json]"),
    "learn": (
        "Usage:",
        "design-ai learn [--list] [--category kind] [--query text] [--explain] [--limit N] [--json] [--out file] [--force]",
        "design-ai learn --init [--yes|--dry-run] [--json] [--out file] [--force]",
        "design-ai learn --feedback text [--outcome keep|improve|avoid] [--category kind] [--json] [--out file] [--force]",
        "design-ai learn --feedback --from-file notes.md [--outcome keep|improve|avoid] [--category kind] [--json] [--out file] [--force]",
        "cat notes.md | design-ai learn --feedback --stdin [--outcome keep|improve|avoid] [--category kind] [--json] [--out file] [--force]",
        "design-ai learn --backup [--json] [--out file] [--force]",
        "design-ai learn --redact [--json] [--out file] [--force]",
        "design-ai learn --redact --from-file learning-backup.json [--json] [--out file] [--force]",
        "cat learning-backup.json | design-ai learn --redact --stdin [--json] [--out file] [--force]",
        "design-ai learn --verify --from-file learning.json [--json] [--out file] [--force]",
        "cat learning.json | design-ai learn --verify --stdin [--json] [--out file] [--force]",
        "design-ai learn --diff --from-file learning.json [--json] [--out file] [--force]",
        "cat learning.json | design-ai learn --diff --stdin [--json] [--out file] [--force]",
        "design-ai learn --restore --from-file learning-backup.json [--dry-run|--yes] [--backup-file path] [--json] [--out file] [--force]",
        "cat learning-backup.json | design-ai learn --restore --stdin [--dry-run|--yes] [--backup-file path] [--json] [--out file] [--force]",
        "design-ai learn --restore-backups [--limit N] [--json] [--out file] [--force]",
        "design-ai learn --restore-backups --prune [--keep N] [--dry-run|--yes] [--json] [--out file] [--force]",
        "design-ai learn --import --from-file learning.json --dry-run [--json] [--out file] [--force]",
        "cat learning.json | design-ai learn --import --stdin --yes [--json] [--out file] [--force]",
        "--feedback",
        "--init",
        "--outcome",
        "--backup",
        "--redact",
        "--verify",
        "--diff",
        "--restore",
        "--restore-backups",
        "--prune",
        "--keep N",
        "--backup-file",
        "--import",
        "--out file",
        "--force",
        "design-ai learn --audit [--json] [--out file] [--force]",
        "design-ai learn --audit --fix --dry-run [--json] [--out file] [--force]",
        "design-ai learn --audit --fix --yes [--json] [--out file] [--force]",
        "design-ai learn --curate [--dry-run|--yes] [--usage-file path] [--json|--report] [--out file] [--force]",
        "--fix",
        "--dry-run",
        "--curate",
        "--report",
        "design-ai learn --curate --report --out learning-curation-report.md",
        "design-ai learn --stats [--json] [--out file] [--force]",
        "design-ai learn --usage [--limit N] [--usage-file path] [--json] [--out file] [--force]",
        "--usage",
        "--usage-file path",
        "design-ai learn --eval-template [--query text] [--category kind] [--limit N] [--json] [--out file] [--force]",
        "--eval-template",
        "design-ai learn --eval --from-file eval.json [--category kind] [--limit N] [--strict] [--json] [--out file] [--force]",
        "cat eval.json | design-ai learn --eval --stdin [--category kind] [--limit N] [--strict] [--json]",
        "--eval",
        "--strict",
        "design-ai learn --forget id-or-number --yes [--json] [--out file] [--force]",
        "local memory, not model training or fine-tuning",
    ),
    "workspace": (
        "Usage:",
        "design-ai workspace [--root path] [--learning-file path] [--learning-usage path] [--learning-eval path] [--strict] [--json]",
        "--learning-file path",
        "--learning-usage path",
        "without changing files",
    ),
    "site": (
        "Usage:",
        "design-ai site <workspace.json> [--strict] [--json]",
        "cat workspace.json | design-ai site --stdin [--strict] [--json]",
        "design-ai site --sample [--out file] [--force]",
        "design-ai site --prompt-list [--json] [--out file] [--force]",
        "design-ai site <workspace.json> --mcp-check [--strict] [--json] [--out file] [--force]",
        "design-ai site <workspace.json> --mcp-plan [--strict] [--out file] [--force]",
        "design-ai site <workspace.json> --tasks [--out file] [--force]",
        "design-ai site <workspace.json> --bundle --out dir [--strict] [--force]",
        "design-ai site <bundle-dir> --bundle-check [--strict] [--json] [--out file] [--force]",
        "design-ai site <bundle-dir> --bundle-compare other-bundle-dir [--strict] [--json] [--out file] [--force]",
        "design-ai site <bundle-dir> --bundle-handoff [--strict] [--json] [--out file] [--force]",
        "design-ai site <workspace.json> --prompt template-id [--task id-or-number] [--out file] [--force]",
        "--sample",
        "--prompt-list",
        "--mcp-check",
        "--mcp-plan",
        "--tasks",
        "--bundle",
        "--bundle-check",
        "--bundle-compare",
        "--bundle-handoff",
        "--report",
        "--prompts",
        "--prompt id",
        "--task id",
        "--out file",
    ),
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
    "improve homepage conversion and SEO",
    "prompt <brief|--from-file file|--stdin>",
    "--route website-improvement",
    "pack <brief|--from-file file|--stdin>",
    "check <artifact.md|--stdin|--examples>",
    "examples [query]",
    "learn [--init|--remember text|--feedback text|--list|--export|--query text|--explain|--backup|--redact|--verify|--diff|--restore|--restore-backups [--prune]|--import|--audit [--fix]|--curate|--stats|--usage|--eval-template|--eval|--forget id|--clear] [--json|--report] [--out file]",
    "workspace [--root path] [--learning-file path] [--learning-usage path] [--learning-eval path] [--strict] [--json]",
    "site <workspace.json|--stdin>",
    "site --sample",
    "site --prompt-list",
    "[--json|--mcp-check|--mcp-plan|--tasks|--bundle|--report|--prompts|--prompt id [--task id]]",
    "site <bundle-dir> --bundle-check",
    "site <bundle-dir> --bundle-compare",
    "site <bundle-dir> --bundle-handoff",
    "Environment overrides:",
    "Quickstart:",
    "Docs:",
    f"Plugin:  {EXPECTED_PLUGIN_INVENTORY_SUMMARY}",
)
EXPECTED_VERSION_FRAGMENTS = (
    "design-ai CLI:",
    "Plugin / corpus:",
    "4.51.0",
    "Source:",
)
EXPECTED_INSTALL_OUTPUT_FRAGMENTS = (
    "design-ai installer",
    "Source:",
    "Target:",
    "Prefix:",
    "Installing from:",
    "Installed 20 skills",
    "Installed 4 agents",
    "Installed 17 slash commands",
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
    "Skills: 20 installed",
    "Agents: 4 installed",
    "Slash commands: 17 installed",
)
EXPECTED_DOCTOR_STRICT_OUTPUT_FRAGMENTS = (
    "design-ai doctor",
    "Diagnose install and runtime health",
    "Source:",
    "Target:",
    "Prefix:",
    "Source layout: complete",
    "Version alignment: 4.51.0",
    "Manifest paths: 41 referenced artifact(s) exist",
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
    "Installed skills: 20/20 installed",
    "Installed agents: 4/4 installed",
    "Installed slash commands: 17/17 installed",
    f"Summary: {len(EXPECTED_DOCTOR_PASS_LABELS)} pass, 0 warning(s), 0 failure(s)",
)
EXPECTED_UNINSTALL_OUTPUT_FRAGMENTS = (
    "design-ai uninstaller",
    "Uninstalling design-ai from",
    "Removed 41 design-ai symlinks",
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
    ("ws", "--help"),
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
    ("learn", "--jsn", "--json"),
    ("workspace", "--jsn", "--json"),
    ("site", "--jsn", "--json"),
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
        "website-improvement",
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
        "website-improvement",
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
EXPECTED_STATUS_SECTION_LABELS = {
    "skills": "Skills",
    "agents": "Agents",
    "commands": "Slash commands",
}
EXPECTED_STATUS_TARGET_DIR_BASENAMES = {
    "skills": "skills",
    "agents": "agents",
    "commands": "commands",
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
    "website-improvement",
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
EXPECTED_ROUTE_AGENTS = (
    EXPECTED_ROUTE_AGENT,
    EXPECTED_PROMPT_A11Y_AGENT,
)
EXPECTED_ROUTE_KNOWLEDGE_FILES = (
    "knowledge/PRINCIPLES.md",
    "knowledge/components/INDEX.md",
    "knowledge/components/shadcn-registry.md",
    EXPECTED_ROUTE_KNOWLEDGE,
)
EXPECTED_REFERENCE_EXAMPLES = (
    (EXPECTED_EXAMPLES_HIT, "`Button` - spec", EXPECTED_EXAMPLES_CATEGORY, 81, "# `Button` - spec"),
    (
        "examples/component-list-item-button.md",
        "`ListItemButton` - spec",
        EXPECTED_EXAMPLES_CATEGORY,
        53,
        "# `ListItemButton` - spec",
    ),
)
EXPECTED_PROMPT_FILES = (
    "AGENTS.md",
    EXPECTED_ROUTE_COMMAND,
    EXPECTED_ROUTE_SKILL,
    EXPECTED_PROMPT_PLAYBOOK,
    EXPECTED_ROUTE_AGENT,
    EXPECTED_PROMPT_A11Y_AGENT,
    *EXPECTED_ROUTE_KNOWLEDGE_FILES,
    *(example[0] for example in EXPECTED_REFERENCE_EXAMPLES),
)
EXPECTED_ROUTE_ENTRY_KEYS = [
    "id",
    "label",
    "score",
    "confidence",
    "matchedKeywords",
    "command",
    "skills",
    "agents",
    "knowledge",
    "keywords",
    "explanation",
]
EXPECTED_PROMPT_ROUTE_ENTRY_KEYS = [*EXPECTED_ROUTE_ENTRY_KEYS, "forced"]
EXPECTED_ROUTE_REFERENCE_KEYS = ["path", "exists"]
EXPECTED_ROUTE_EXPLANATION_KEYS = ["summary", "scoreBreakdown", "referenceCoverage", "missingReferences"]
EXPECTED_ROUTE_SCORE_BREAKDOWN_KEYS = ["label", "value"]
EXPECTED_ROUTE_COVERAGE_KEYS = ["command", "skills", "agents", "knowledge", "total"]
EXPECTED_ROUTE_COVERAGE_COUNT_KEYS = ["available", "total"]
EXPECTED_PROMPT_PAYLOAD_KEYS = [
    "brief",
    "version",
    "route",
    "slashCommand",
    "referenceExamples",
    "filesToRead",
    "checklist",
    "qualityCommand",
    "prompt",
]
EXPECTED_REFERENCE_EXAMPLE_KEYS = ["relPath", "title", "category", "score", "preview"]
EXPECTED_PACK_PAYLOAD_KEYS = [
    "brief",
    "version",
    "maxBytes",
    "usedBytes",
    "summary",
    "warnings",
    "plan",
    "files",
    "markdown",
]
EXPECTED_PACK_SUMMARY_KEYS = [
    "totalFiles",
    "includedFiles",
    "truncatedFiles",
    "missingFiles",
    "usedBytes",
    "maxBytes",
    "remainingBytes",
    "usedRatio",
    "status",
]
EXPECTED_PACK_FILE_KEYS = ["path", "bytes", "includedBytes", "included", "truncated", "content"]
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
EXPECTED_CHECK_REPORT_KEYS = [
    "filePath",
    "routeId",
    "status",
    "passes",
    "warnings",
    "failures",
    "total",
    "score",
    "results",
]
EXPECTED_CHECK_RESULT_KEYS = ["id", "title", "level", "passed", "message"]
EXPECTED_CHECK_RESULT_KEYS_WITH_EVIDENCE = [*EXPECTED_CHECK_RESULT_KEYS, "evidence"]
EXPECTED_CHECK_EXAMPLES_PAYLOAD_KEYS = [
    "mode",
    "routeId",
    "query",
    "limit",
    "status",
    "total",
    "passed",
    "warned",
    "failed",
    "examples",
]
EXPECTED_CHECK_EXAMPLE_ENTRY_KEYS = ["example", "report"]
EXPECTED_WORKSPACE_PAYLOAD_KEYS = ["context", "git", "repository", "learning", "learningUsage", "learningEval", "release", "nextActions"]
EXPECTED_WORKSPACE_CONTEXT_KEYS = ["cwd", "root", "sourceRoot", "packageName", "version"]
EXPECTED_WORKSPACE_GIT_KEYS = [
    "isRepo",
    "root",
    "branch",
    "clean",
    "upstream",
    "ahead",
    "behind",
    "remote",
    "lastCommit",
    "statusShort",
    "reason",
]
EXPECTED_WORKSPACE_REPOSITORY_KEYS = [
    "slug",
    "url",
    "expectedRemoteUrl",
    "packageRepositoryUrl",
    "packageHomepage",
    "packageBugsUrl",
    "pluginHomepage",
    "pluginRepository",
    "metadataAligned",
    "remoteUrl",
    "remoteSlug",
    "remoteAligned",
    "issues",
]
EXPECTED_WORKSPACE_LEARNING_KEYS = [
    "file",
    "exists",
    "updatedAt",
    "count",
    "categoryCounts",
    "sourceCounts",
    "latestEntry",
    "auditSummary",
    "error",
]
EXPECTED_WORKSPACE_LEARNING_USAGE_KEYS = [
    "file",
    "usageFile",
    "exists",
    "profileExists",
    "profileFile",
    "version",
    "updatedAt",
    "eventCount",
    "profileEntryCount",
    "usedEntryCount",
    "unusedEntryCount",
    "staleSelectedEntryCount",
    "commandCounts",
    "routeCounts",
    "categoryCounts",
    "auditStatusCounts",
    "latestEvent",
    "privacy",
    "recommendations",
    "readiness",
    "error",
]
EXPECTED_WORKSPACE_LEARNING_USAGE_EVENT_KEYS = [
    "id",
    "command",
    "routeId",
    "category",
    "limit",
    "selectedEntryIds",
    "selectedCount",
    "candidateCount",
    "matchedCount",
    "fallbackCount",
    "queryTokenCount",
    "auditStatus",
    "briefHash",
    "createdAt",
]
EXPECTED_WORKSPACE_LEARNING_USAGE_PRIVACY_KEYS = [
    "storesRawBriefText",
    "storesBriefHash",
    "storesSelectedEntryIds",
]
EXPECTED_WORKSPACE_LEARNING_USAGE_READINESS_KEYS = [
    "status",
    "reason",
    "profileFile",
    "profileFileMatches",
    "staleSelectedEntryCount",
]
EXPECTED_WORKSPACE_LEARNING_EVAL_KEYS = [
    "source",
    "file",
    "status",
    "caseCount",
    "passed",
    "warned",
    "failed",
    "generatedAt",
    "sourceProfile",
    "profileExists",
    "profileEntryCount",
    "auditSummary",
    "privacy",
    "error",
    "freshness",
]
EXPECTED_WORKSPACE_LEARNING_EVAL_SOURCE_PROFILE_KEYS = [
    "file",
    "exists",
    "entryCount",
    "auditStatus",
    "category",
    "queryPresent",
    "limit",
]
EXPECTED_WORKSPACE_LEARNING_EVAL_PRIVACY_KEYS = [
    "storesRawBriefText",
    "storesBriefHash",
    "exposesMatchedTokens",
]
EXPECTED_WORKSPACE_LEARNING_EVAL_FRESHNESS_KEYS = [
    "status",
    "stale",
    "reason",
    "profileUpdatedAt",
    "checkpointGeneratedAt",
    "sourceProfileFile",
    "sourceProfileEntryCount",
]
EXPECTED_WORKSPACE_RELEASE_KEYS = ["packageName", "version", "scripts", "available", "missing"]
EXPECTED_WORKSPACE_AUDIT_SUMMARY_KEYS = ["status", "failures", "warnings"]
EXPECTED_WORKSPACE_ACTION_KEYS = ["level", "text"]
EXPECTED_WORKSPACE_ACTION_KEYS_WITH_COMMAND = [*EXPECTED_WORKSPACE_ACTION_KEYS, "command"]
EXPECTED_SITE_PAYLOAD_KEYS = [
    "filePath",
    "valid",
    "status",
    "site",
    "counts",
    "auditStatusCounts",
    "mcpStatusCounts",
    "taskPriorityCounts",
    "requiredMcp",
    "topTasks",
    "issues",
]
EXPECTED_SITE_PROFILE_KEYS = [
    "id",
    "name",
    "liveUrl",
    "repoUrl",
    "localPath",
    "deployProvider",
    "cms",
    "database",
    "pages",
    "userFlows",
    "viewports",
]
EXPECTED_SITE_COUNTS_KEYS = [
    "pages",
    "userFlows",
    "viewports",
    "auditCategories",
    "auditFindings",
    "refactorTasks",
    "requiredMcp",
    "optionalMcp",
    "unavailableMcp",
]
EXPECTED_SITE_TOP_TASK_KEYS = ["id", "title", "priority", "category", "impact", "effort", "pages"]
EXPECTED_SITE_ISSUE_KEYS = ["level", "id", "message"]
EXPECTED_SITE_SAMPLE_KEYS = [
    "version",
    "updatedAt",
    "siteProfile",
    "auditChecklist",
    "mcpReadiness",
    "refactorTasks",
    "reportNotes",
]
EXPECTED_SITE_SAMPLE_PROFILE_KEYS = [
    "id",
    "name",
    "liveUrl",
    "repoUrl",
    "localPath",
    "figmaUrl",
    "brandNotes",
    "deployProvider",
    "sentryProject",
    "cms",
    "database",
    "pages",
    "userFlows",
    "viewports",
]
EXPECTED_SITE_SAMPLE_TASK_KEYS = [
    "id",
    "title",
    "category",
    "problem",
    "evidence",
    "impact",
    "effort",
    "priority",
    "pages",
    "recommendedMcp",
    "codexPrompt",
    "verification",
    "risks",
]
EXPECTED_SITE_PROMPT_TEMPLATE_PAYLOAD_KEYS = ["count", "templates"]
EXPECTED_SITE_PROMPT_TEMPLATE_KEYS = [
    "id",
    "label",
    "agent",
    "output",
    "description",
    "taskSelectable",
]
EXPECTED_SITE_PROMPT_TEMPLATE_IDS = [
    "codex-repo-intake",
    "codex-implementation",
    "codex-visual-qa",
    "codex-deployment",
    "claude-design-review",
    "claude-competitor",
    "claude-copy-ux",
    "handoff-report",
]
EXPECTED_SITE_MCP_CHECK_PAYLOAD_KEYS = [
    "filePath",
    "status",
    "workspaceStatus",
    "site",
    "counts",
    "items",
    "taskGaps",
    "workspaceIssues",
    "nextActions",
]
EXPECTED_SITE_MCP_CHECK_SITE_KEYS = ["name", "liveUrl", "repoUrl", "localPath"]
EXPECTED_SITE_MCP_CHECK_COUNTS_KEYS = [
    "total",
    "required",
    "optional",
    "ready",
    "missing",
    "unused",
    "unavailable",
    "taskGaps",
]
EXPECTED_SITE_MCP_CHECK_ITEM_KEYS = [
    "key",
    "label",
    "requestedStatus",
    "state",
    "level",
    "evidence",
    "actions",
]
EXPECTED_SITE_MCP_CHECK_TASK_GAP_KEYS = ["taskId", "title", "mcp", "status", "level", "message"]
EXPECTED_REPOSITORY_SLUG = "sungjin9288/design-ai"
EXPECTED_REPOSITORY_URL = f"https://github.com/{EXPECTED_REPOSITORY_SLUG}"


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
    if command_name == "learn":
        return ["learn", option]
    if command_name == "workspace":
        return ["workspace", option]
    if command_name == "site":
        return ["site", "workspace.json", option]
    raise SystemExit(f"unsupported unknown option smoke command: {command_name}")


def passing_list_catalog_output(kind: str = "skills") -> str:
    items = EXPECTED_LIST_CATALOG[kind]
    return "\n".join([
        "",
        "  design-ai catalog",
        "",
        "Plugin: design-ai v4.51.0",
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
            "version": "4.51.0",
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
        "version": "4.51.0",
        "routes": [
            {
                "id": EXPECTED_ROUTE_ID,
                "label": EXPECTED_ROUTE_LABEL,
                "score": len(EXPECTED_ROUTE_MATCHED_KEYWORDS),
                "confidence": "high",
                "matchedKeywords": list(EXPECTED_ROUTE_MATCHED_KEYWORDS),
                "command": {"path": EXPECTED_ROUTE_COMMAND, "exists": True},
                "skills": [{"path": EXPECTED_ROUTE_SKILL, "exists": True}],
                "agents": [
                    {"path": path, "exists": True}
                    for path in EXPECTED_ROUTE_AGENTS
                ],
                "knowledge": [
                    {"path": path, "exists": True}
                    for path in EXPECTED_ROUTE_KNOWLEDGE_FILES
                ],
                "keywords": [
                    "component",
                    "button",
                    "input",
                    "modal",
                    "dialog",
                    "table",
                    "form",
                    "dropdown",
                    "select",
                    "spec",
                    "api",
                    "props",
                    "컴포넌트",
                    "버튼",
                    "입력",
                    "모달",
                    "폼",
                    "테이블",
                    "스펙",
                ],
                "explanation": {
                    "summary": "Matched 4 keywords: component, button, spec, api.",
                    "scoreBreakdown": [
                        {
                            "label": "keyword matches",
                            "value": len(EXPECTED_ROUTE_MATCHED_KEYWORDS),
                        },
                    ],
                    "referenceCoverage": {
                        "command": {"available": 1, "total": 1},
                        "skills": {"available": 1, "total": 1},
                        "agents": {"available": len(EXPECTED_ROUTE_AGENTS), "total": len(EXPECTED_ROUTE_AGENTS)},
                        "knowledge": {
                            "available": len(EXPECTED_ROUTE_KNOWLEDGE_FILES),
                            "total": len(EXPECTED_ROUTE_KNOWLEDGE_FILES),
                        },
                        "total": {
                            "available": 1 + 1 + len(EXPECTED_ROUTE_AGENTS) + len(EXPECTED_ROUTE_KNOWLEDGE_FILES),
                            "total": 1 + 1 + len(EXPECTED_ROUTE_AGENTS) + len(EXPECTED_ROUTE_KNOWLEDGE_FILES),
                        },
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
        "Corpus version: 4.51.0",
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
                "scoreBreakdown": [
                    {
                        "label": "keyword matches",
                        "value": 0,
                    },
                ],
                "referenceCoverage": {
                    "command": {"available": 0, "total": 0},
                    "skills": {"available": 0, "total": 0},
                    "agents": {"available": 0, "total": 0},
                    "knowledge": {"available": 1, "total": 1},
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
                "agents": [
                    {"path": path, "exists": True}
                    for path in EXPECTED_ROUTE_AGENTS
                ],
                "knowledge": [
                    {"path": path, "exists": True}
                    for path in EXPECTED_ROUTE_KNOWLEDGE_FILES
                ],
                "keywords": ["component", "button", "spec", "api"],
                "explanation": {
                    "summary": "Catalog listing; no task brief was scored.",
                    "scoreBreakdown": [
                        {
                            "label": "keyword matches",
                            "value": 0,
                        },
                    ],
                    "referenceCoverage": {
                        "command": {"available": 1, "total": 1},
                        "skills": {"available": 1, "total": 1},
                        "agents": {"available": len(EXPECTED_ROUTE_AGENTS), "total": len(EXPECTED_ROUTE_AGENTS)},
                        "knowledge": {
                            "available": len(EXPECTED_ROUTE_KNOWLEDGE_FILES),
                            "total": len(EXPECTED_ROUTE_KNOWLEDGE_FILES),
                        },
                        "total": {
                            "available": 1 + 1 + len(EXPECTED_ROUTE_AGENTS) + len(EXPECTED_ROUTE_KNOWLEDGE_FILES),
                            "total": 1 + 1 + len(EXPECTED_ROUTE_AGENTS) + len(EXPECTED_ROUTE_KNOWLEDGE_FILES),
                        },
                    },
                    "missingReferences": [],
                },
            })
        routes.append(route)

    return json.dumps({
        "version": "4.51.0",
        "routes": routes,
    })


def passing_prompt_payload() -> dict:
    return {
        "brief": EXPECTED_ROUTE_BRIEF,
        "version": "4.51.0",
        "route": {
            "id": EXPECTED_ROUTE_ID,
            "label": EXPECTED_ROUTE_LABEL,
            "score": 0,
            "confidence": "forced",
            "matchedKeywords": [],
            "command": {"path": EXPECTED_ROUTE_COMMAND, "exists": True},
            "skills": [{"path": EXPECTED_ROUTE_SKILL, "exists": True}],
            "agents": [
                {"path": path, "exists": True}
                for path in EXPECTED_ROUTE_AGENTS
            ],
            "knowledge": [
                {"path": path, "exists": True}
                for path in EXPECTED_ROUTE_KNOWLEDGE_FILES
            ],
            "keywords": [
                "component",
                "button",
                "input",
                "modal",
                "dialog",
                "table",
                "form",
                "dropdown",
                "select",
                "spec",
                "api",
                "props",
                "컴포넌트",
                "버튼",
                "입력",
                "모달",
                "폼",
                "테이블",
                "스펙",
            ],
            "explanation": {
                "summary": "Route selected explicitly with --route.",
                "scoreBreakdown": [
                    {
                        "label": "keyword matches",
                        "value": 0,
                    },
                ],
                "referenceCoverage": {
                    "command": {"available": 1, "total": 1},
                    "skills": {"available": 1, "total": 1},
                    "agents": {"available": len(EXPECTED_ROUTE_AGENTS), "total": len(EXPECTED_ROUTE_AGENTS)},
                    "knowledge": {
                        "available": len(EXPECTED_ROUTE_KNOWLEDGE_FILES),
                        "total": len(EXPECTED_ROUTE_KNOWLEDGE_FILES),
                    },
                    "total": {
                        "available": 1 + 1 + len(EXPECTED_ROUTE_AGENTS) + len(EXPECTED_ROUTE_KNOWLEDGE_FILES),
                        "total": 1 + 1 + len(EXPECTED_ROUTE_AGENTS) + len(EXPECTED_ROUTE_KNOWLEDGE_FILES),
                    },
                },
                "missingReferences": [],
            },
            "forced": True,
        },
        "slashCommand": EXPECTED_PROMPT_SLASH_COMMAND,
        "referenceExamples": [
            {
                "relPath": rel_path,
                "title": title,
                "category": category,
                "score": score,
                "preview": preview,
            }
            for rel_path, title, category, score, preview in EXPECTED_REFERENCE_EXAMPLES
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
        "Corpus version: 4.51.0",
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
        "version": "4.51.0",
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
        "Corpus version: 4.51.0",
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
                "title": f"{result_id} fixture",
                "level": "pass",
                "passed": True,
                "message": "fixture pass",
                **({"evidence": "fixture evidence"} if result_id == "content-depth" else {}),
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


def assert_smoke_json_keys(
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


def assert_list_catalog_json(raw: str, *, kind: str, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)

    expected_items = EXPECTED_LIST_CATALOG.get(kind)
    if expected_items is None:
        raise SystemExit(f"unsupported list catalog kind for smoke assertion: {kind}")

    try:
        catalog = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"list catalog JSON after {context} is not valid JSON: {error}") from error

    catalog = assert_smoke_json_keys(
        catalog,
        ["name", "version", "kind", "sections"],
        label="top-level",
        context=context,
        command_label="list catalog JSON",
    )
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
    section = assert_smoke_json_keys(
        section,
        ["kind", "count", "items"],
        label="section",
        context=context,
        command_label="list catalog JSON",
    )
    if section.get("kind") != kind:
        raise SystemExit(f"list catalog JSON after {context} section kind differs from expected {kind}")
    if type(section.get("count")) is not int:
        raise SystemExit(f"list catalog JSON after {context} section count is invalid")
    if section.get("count") != len(expected_items):
        raise SystemExit(f"list catalog JSON after {context} section count differs from expected {len(expected_items)}")

    items = section.get("items")
    if not isinstance(items, list):
        raise SystemExit(f"list catalog JSON after {context} items is not a list")
    observed_names = []
    for item in items:
        item = assert_smoke_json_keys(
            item,
            ["name", "path", "description"],
            label="item",
            context=context,
            command_label="list catalog JSON",
        )
        observed_names.append(item.get("name"))
        if item.get("path") != list_catalog_item_path(kind, str(item.get("name", ""))):
            raise SystemExit(f"list catalog JSON after {context} item path differs for {item.get('name')}")
        if not isinstance(item.get("description"), str) or not item["description"]:
            raise SystemExit(f"list catalog JSON after {context} item description is missing for {item.get('name')}")

    if tuple(observed_names) != expected_items:
        raise SystemExit(f"list catalog JSON after {context} item order differs from expected {kind} catalog")


def assert_route_smoke_json_keys(
    value: object,
    expected_keys: list[str],
    *,
    label: str,
    context: str,
    payload_name: str,
) -> dict[str, object]:
    if not isinstance(value, dict):
        raise SystemExit(f"{payload_name} after {context} {label} is not an object")
    if list(value) != expected_keys:
        raise SystemExit(f"{payload_name} after {context} {label} keys changed")
    return value


def is_route_smoke_non_negative_int(value: object) -> bool:
    return type(value) is int and value >= 0


def is_route_smoke_positive_int(value: object) -> bool:
    return type(value) is int and value >= 1


def is_route_smoke_non_negative_number(value: object) -> bool:
    return type(value) in (int, float) and value >= 0


def assert_route_smoke_reference_coverage(
    value: object,
    *,
    label: str,
    context: str,
    payload_name: str,
) -> None:
    coverage = assert_route_smoke_json_keys(
        value,
        EXPECTED_ROUTE_COVERAGE_KEYS,
        label=label,
        context=context,
        payload_name=payload_name,
    )
    total_available = 0
    total_count = 0
    for key in EXPECTED_ROUTE_COVERAGE_KEYS:
        count = assert_route_smoke_json_keys(
            coverage.get(key),
            EXPECTED_ROUTE_COVERAGE_COUNT_KEYS,
            label=f"{label} {key}",
            context=context,
            payload_name=payload_name,
        )
        available = count.get("available")
        total = count.get("total")
        if not is_route_smoke_non_negative_int(available) or not is_route_smoke_non_negative_int(total):
            raise SystemExit(f"{payload_name} after {context} {label} reference coverage count is invalid")
        if available > total:
            raise SystemExit(f"{payload_name} after {context} {label} reference coverage count is inconsistent")
        if key != "total":
            total_available += available
            total_count += total

    total = coverage["total"]
    if total["available"] != total_available or total["total"] != total_count:
        raise SystemExit(f"{payload_name} after {context} {label} total reference coverage is inconsistent")
    if total["available"] != total["total"] or total["total"] < 1:
        raise SystemExit(f"{payload_name} after {context} {label} does not report full reference coverage")


def assert_route_smoke_explanation(
    value: object,
    *,
    expected_summary_fragment: str,
    context: str,
    payload_name: str,
    label: str = "explanation",
) -> None:
    explanation = assert_route_smoke_json_keys(
        value,
        EXPECTED_ROUTE_EXPLANATION_KEYS,
        label=label,
        context=context,
        payload_name=payload_name,
    )
    summary = explanation.get("summary")
    if not isinstance(summary, str) or expected_summary_fragment not in summary:
        raise SystemExit(f"{payload_name} after {context} {label} summary differs from expected content")

    score_breakdown = explanation.get("scoreBreakdown")
    if not isinstance(score_breakdown, list) or not score_breakdown:
        raise SystemExit(f"{payload_name} after {context} {label} scoreBreakdown is not a non-empty list")
    for score_entry in score_breakdown:
        score_entry = assert_route_smoke_json_keys(
            score_entry,
            EXPECTED_ROUTE_SCORE_BREAKDOWN_KEYS,
            label=f"{label} scoreBreakdown entry",
            context=context,
            payload_name=payload_name,
        )
        if not isinstance(score_entry.get("label"), str) or not score_entry["label"]:
            raise SystemExit(f"{payload_name} after {context} {label} scoreBreakdown label is missing")
        if not is_route_smoke_non_negative_int(score_entry.get("value")):
            raise SystemExit(f"{payload_name} after {context} {label} scoreBreakdown value is invalid")

    assert_route_smoke_reference_coverage(
        explanation.get("referenceCoverage"),
        label=label,
        context=context,
        payload_name=payload_name,
    )
    if explanation.get("missingReferences") != []:
        raise SystemExit(f"{payload_name} after {context} contains missing references")


def assert_route_reference_entry(
    entry: object,
    *,
    label: str,
    context: str,
    payload_name: str,
) -> dict[str, object]:
    entry = assert_route_smoke_json_keys(
        entry,
        EXPECTED_ROUTE_REFERENCE_KEYS,
        label=label,
        context=context,
        payload_name=payload_name,
    )
    if not isinstance(entry.get("path"), str) or not entry["path"]:
        raise SystemExit(f"{payload_name} after {context} {label} path is missing")
    if not isinstance(entry.get("exists"), bool):
        raise SystemExit(f"{payload_name} after {context} {label} exists flag is invalid")
    return entry


def find_existing_path(entries: object, path: str, *, context: str, label: str) -> None:
    if not isinstance(entries, list):
        raise SystemExit(f"route JSON after {context} {label} is not a list")

    for entry in entries:
        entry = assert_route_reference_entry(
            entry,
            label=f"{label} entry",
            context=context,
            payload_name="route JSON",
        )
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

    payload = assert_route_smoke_json_keys(
        payload,
        ["brief", "version", "routes"],
        label="top-level",
        context=context,
        payload_name="route JSON",
    )

    if payload.get("brief") != EXPECTED_ROUTE_BRIEF:
        raise SystemExit(f"route JSON after {context} brief differs from expected brief")

    version = payload.get("version")
    if not isinstance(version, str) or not version or version == "unknown":
        raise SystemExit(f"route JSON after {context} version is missing")

    routes = payload.get("routes")
    if not isinstance(routes, list) or len(routes) != 1:
        raise SystemExit(f"route JSON after {context} does not contain exactly one route")

    route = assert_route_smoke_json_keys(
        routes[0],
        EXPECTED_ROUTE_ENTRY_KEYS,
        label="route",
        context=context,
        payload_name="route JSON",
    )

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
    if not is_route_smoke_non_negative_int(score) or score < len(EXPECTED_ROUTE_MATCHED_KEYWORDS):
        raise SystemExit(f"route JSON after {context} score is lower than expected keyword coverage")

    command = assert_route_reference_entry(
        route.get("command"),
        label="command",
        context=context,
        payload_name="route JSON",
    )
    if command.get("path") != EXPECTED_ROUTE_COMMAND or command.get("exists") is not True:
        raise SystemExit(f"route JSON after {context} command differs from expected available command")

    find_existing_path(route.get("skills"), EXPECTED_ROUTE_SKILL, context=context, label="skills")
    find_existing_path(route.get("agents"), EXPECTED_ROUTE_AGENT, context=context, label="agents")
    find_existing_path(route.get("knowledge"), EXPECTED_ROUTE_KNOWLEDGE, context=context, label="knowledge")

    keywords = route.get("keywords")
    if not isinstance(keywords, list) or not all(isinstance(keyword, str) for keyword in keywords):
        raise SystemExit(f"route JSON after {context} keywords is not a string list")
    if not all(keyword in keywords for keyword in ("component", "button", "spec")):
        raise SystemExit(f"route JSON after {context} keywords differ from expected discovery terms")

    assert_route_smoke_explanation(
        route.get("explanation"),
        expected_summary_fragment="Matched",
        context=context,
        payload_name="route JSON",
    )


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

    payload = assert_route_smoke_json_keys(
        payload,
        ["version", "routes"],
        label="top-level",
        context=context,
        payload_name="route catalog JSON",
    )

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
        route_entry = route_by_id.get(route_id)
        if not isinstance(route_entry, dict):
            raise SystemExit(f"route catalog JSON after {context} is missing expected route: {route_id}")
        route = assert_route_smoke_json_keys(
            route_entry,
            EXPECTED_ROUTE_ENTRY_KEYS,
            label=f"route {route_id}",
            context=context,
            payload_name="route catalog JSON",
        )

        if route.get("confidence") != "catalog":
            raise SystemExit(f"route catalog JSON after {context} route is not marked as catalog: {route_id}")
        if route.get("matchedKeywords") != []:
            raise SystemExit(f"route catalog JSON after {context} route has matched keywords in catalog mode: {route_id}")
        if route.get("score") != 0:
            raise SystemExit(f"route catalog JSON after {context} route score differs from catalog mode: {route_id}")

        label = route.get("label")
        if not isinstance(label, str) or not label:
            raise SystemExit(f"route catalog JSON after {context} route label is missing: {route_id}")

        command = route.get("command")
        if command is not None:
            assert_route_reference_entry(
                command,
                label=f"route {route_id} command",
                context=context,
                payload_name="route catalog JSON",
            )

        for section in ("skills", "agents", "knowledge"):
            entries = route.get(section)
            if not isinstance(entries, list):
                raise SystemExit(f"route catalog JSON after {context} route {section} is not a list: {route_id}")
            for entry in entries:
                assert_route_reference_entry(
                    entry,
                    label=f"route {route_id} {section} entry",
                    context=context,
                    payload_name="route catalog JSON",
                )

        keywords = route.get("keywords")
        if not isinstance(keywords, list) or not keywords or not all(isinstance(keyword, str) for keyword in keywords):
            raise SystemExit(f"route catalog JSON after {context} route keywords differ from expected discovery terms: {route_id}")

        assert_route_smoke_explanation(
            route.get("explanation"),
            expected_summary_fragment="Catalog listing",
            context=context,
            payload_name="route catalog JSON",
            label=f"route {route_id} explanation",
        )

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
        entry = assert_route_reference_entry(
            entry,
            label=f"{label} entry",
            context=context,
            payload_name=payload_name,
        )
        if entry.get("path") == path:
            if entry.get("exists") is not True:
                raise SystemExit(f"{payload_name} after {context} {label} path is not available: {path}")
            return

    raise SystemExit(f"{payload_name} after {context} is missing expected {label} path: {path}")


def assert_prompt_payload_component_spec(payload: object, *, context: str, payload_name: str) -> None:
    payload = assert_route_smoke_json_keys(
        payload,
        EXPECTED_PROMPT_PAYLOAD_KEYS,
        label="top-level",
        context=context,
        payload_name=payload_name,
    )

    if payload.get("brief") != EXPECTED_ROUTE_BRIEF:
        raise SystemExit(f"{payload_name} after {context} brief differs from expected brief")

    version = payload.get("version")
    if not isinstance(version, str) or not version or version == "unknown":
        raise SystemExit(f"{payload_name} after {context} version is missing")

    route = assert_route_smoke_json_keys(
        payload.get("route"),
        EXPECTED_PROMPT_ROUTE_ENTRY_KEYS,
        label="route",
        context=context,
        payload_name=payload_name,
    )

    if route.get("id") != EXPECTED_ROUTE_ID:
        raise SystemExit(f"{payload_name} after {context} route differs from expected route")

    if route.get("label") != EXPECTED_ROUTE_LABEL:
        raise SystemExit(f"{payload_name} after {context} route label differs from expected label")

    if route.get("confidence") != "forced" or route.get("forced") is not True:
        raise SystemExit(f"{payload_name} after {context} route is not marked as forced")

    score = route.get("score")
    if not is_route_smoke_non_negative_int(score):
        raise SystemExit(f"{payload_name} after {context} route score is invalid")

    if route.get("matchedKeywords") != []:
        raise SystemExit(f"{payload_name} after {context} forced route matchedKeywords differ from expected empty list")

    command = assert_route_reference_entry(
        route.get("command"),
        label="command",
        context=context,
        payload_name=payload_name,
    )
    if command.get("path") != EXPECTED_ROUTE_COMMAND or command.get("exists") is not True:
        raise SystemExit(f"{payload_name} after {context} command differs from expected available command")

    find_payload_path(route.get("skills"), EXPECTED_ROUTE_SKILL, context=context, payload_name=payload_name, label="skills")
    find_payload_path(route.get("agents"), EXPECTED_ROUTE_AGENT, context=context, payload_name=payload_name, label="agents")
    find_payload_path(route.get("knowledge"), EXPECTED_ROUTE_KNOWLEDGE, context=context, payload_name=payload_name, label="knowledge")

    keywords = route.get("keywords")
    if not isinstance(keywords, list) or not all(isinstance(keyword, str) for keyword in keywords):
        raise SystemExit(f"{payload_name} after {context} route keywords is not a string list")
    if not all(keyword in keywords for keyword in ("component", "button", "spec")):
        raise SystemExit(f"{payload_name} after {context} route keywords differ from expected discovery terms")

    assert_route_smoke_explanation(
        route.get("explanation"),
        expected_summary_fragment="Route selected explicitly",
        context=context,
        payload_name=payload_name,
        label="route explanation",
    )

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

    for example in examples:
        example = assert_route_smoke_json_keys(
            example,
            EXPECTED_REFERENCE_EXAMPLE_KEYS,
            label="reference example",
            context=context,
            payload_name=payload_name,
        )
        score = example.get("score")
        if not is_route_smoke_positive_int(score):
            raise SystemExit(f"{payload_name} after {context} reference example score is invalid")
        preview = example.get("preview")
        if not isinstance(preview, str) or not preview:
            raise SystemExit(f"{payload_name} after {context} reference example preview is missing")

    first_example = examples[0]

    if first_example.get("relPath") != EXPECTED_EXAMPLES_HIT:
        raise SystemExit(f"{payload_name} after {context} first reference example differs from expected hit")

    example_title = first_example.get("title")
    if not isinstance(example_title, str) or EXPECTED_EXAMPLES_TITLE_FRAGMENT not in example_title:
        raise SystemExit(f"{payload_name} after {context} first reference example title differs from expected title")

    files_to_read = payload.get("filesToRead")
    if not isinstance(files_to_read, list) or not all(isinstance(item, str) for item in files_to_read):
        raise SystemExit(f"{payload_name} after {context} filesToRead is not a string list")

    if files_to_read != list(EXPECTED_PROMPT_FILES):
        raise SystemExit(f"{payload_name} after {context} filesToRead differs from expected route plan")

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

    payload = assert_route_smoke_json_keys(
        payload,
        EXPECTED_PACK_PAYLOAD_KEYS,
        label="top-level",
        context=context,
        payload_name="pack JSON",
    )

    if payload.get("brief") != EXPECTED_ROUTE_BRIEF:
        raise SystemExit(f"pack JSON after {context} brief differs from expected brief")

    version = payload.get("version")
    if not isinstance(version, str) or not version or version == "unknown":
        raise SystemExit(f"pack JSON after {context} version is missing")

    if not is_route_smoke_positive_int(payload.get("maxBytes")) or payload.get("maxBytes") != EXPECTED_PACK_MAX_BYTES:
        raise SystemExit(f"pack JSON after {context} maxBytes differs from expected budget")

    used_bytes = payload.get("usedBytes")
    if not is_route_smoke_positive_int(used_bytes) or used_bytes > EXPECTED_PACK_MAX_BYTES:
        raise SystemExit(f"pack JSON after {context} usedBytes is outside expected budget")

    summary = assert_route_smoke_json_keys(
        payload.get("summary"),
        EXPECTED_PACK_SUMMARY_KEYS,
        label="summary",
        context=context,
        payload_name="pack JSON",
    )

    for field in ("totalFiles", "includedFiles", "truncatedFiles", "missingFiles", "usedBytes", "maxBytes", "remainingBytes"):
        if not is_route_smoke_non_negative_int(summary.get(field)):
            raise SystemExit(f"pack JSON after {context} summary {field} is invalid")

    if not is_route_smoke_non_negative_number(summary.get("usedRatio")):
        raise SystemExit(f"pack JSON after {context} summary usedRatio is invalid")

    if summary.get("usedBytes") != used_bytes or summary.get("maxBytes") != EXPECTED_PACK_MAX_BYTES:
        raise SystemExit(f"pack JSON after {context} summary budget differs from top-level budget")

    if summary.get("missingFiles") != 0:
        raise SystemExit(f"pack JSON after {context} contains missing context files")

    if summary.get("status") != "partial":
        raise SystemExit(f"pack JSON after {context} status differs from expected partial status")

    total_files = summary.get("totalFiles")
    included_files = summary.get("includedFiles")
    if included_files != total_files:
        raise SystemExit(f"pack JSON after {context} does not include every expected context file")
    if total_files != len(EXPECTED_PROMPT_FILES):
        raise SystemExit(f"pack JSON after {context} total file count differs from expected context plan")

    truncated_files = summary.get("truncatedFiles")
    if truncated_files < 1:
        raise SystemExit(f"pack JSON after {context} does not report truncated context files")

    plan = payload.get("plan")
    assert_prompt_payload_component_spec(plan, context=context, payload_name="pack JSON plan")

    files = payload.get("files")
    if not isinstance(files, list):
        raise SystemExit(f"pack JSON after {context} files is not a list")

    file_paths = []
    for file_entry in files:
        file_entry = assert_route_smoke_json_keys(
            file_entry,
            EXPECTED_PACK_FILE_KEYS,
            label="file entry",
            context=context,
            payload_name="pack JSON",
        )
        file_path = file_entry.get("path")
        if isinstance(file_path, str):
            file_paths.append(file_path)
        else:
            raise SystemExit(f"pack JSON after {context} file entry path is missing")
        if not is_route_smoke_positive_int(file_entry.get("bytes")):
            raise SystemExit(f"pack JSON after {context} has invalid bytes for {file_path}")
        if not is_route_smoke_positive_int(file_entry.get("includedBytes")):
            raise SystemExit(f"pack JSON after {context} has invalid includedBytes for {file_path}")
        if file_entry.get("included") is not True:
            raise SystemExit(f"pack JSON after {context} did not include expected context file: {file_path}")
        if not isinstance(file_entry.get("truncated"), bool):
            raise SystemExit(f"pack JSON after {context} file entry truncated flag is invalid")
        if not isinstance(file_entry.get("content"), str) or not file_entry["content"]:
            raise SystemExit(f"pack JSON after {context} file entry content is missing")

    if file_paths != list(EXPECTED_PROMPT_FILES):
        raise SystemExit(f"pack JSON after {context} context file order differs from expected route plan")

    warnings = payload.get("warnings")
    if not isinstance(warnings, list) or not warnings or not all(isinstance(warning, str) for warning in warnings):
        raise SystemExit(f"pack JSON after {context} warnings is not a non-empty string list")
    if not any("Truncated context file" in warning for warning in warnings):
        raise SystemExit(f"pack JSON after {context} does not report truncation warnings")
    if not any(f"{EXPECTED_PACK_MAX_BYTES}/{EXPECTED_PACK_MAX_BYTES}" in warning for warning in warnings):
        raise SystemExit(f"pack JSON after {context} does not report context budget exhaustion")

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


def assert_check_json_keys(value: object, expected_keys: list[str], *, label: str, context: str) -> dict[str, object]:
    if not isinstance(value, dict):
        raise SystemExit(f"{label} after {context} is not an object")
    if list(value) != expected_keys:
        raise SystemExit(f"{label} after {context} keys changed")
    return value


def is_check_json_non_negative_int(value: object) -> bool:
    return type(value) is int and value >= 0


def is_check_json_positive_int(value: object) -> bool:
    return type(value) is int and value > 0


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
    report = assert_check_json_keys(
        report,
        EXPECTED_CHECK_REPORT_KEYS,
        label=f"{label} report",
        context=context,
    )

    file_path = report.get("filePath")
    if not isinstance(file_path, str) or not file_path.endswith(expected_file_suffix):
        raise SystemExit(f"{label} after {context} report file path differs from expected artifact")

    if report.get("routeId") != EXPECTED_ROUTE_ID:
        raise SystemExit(f"{label} after {context} report routeId differs from expected route")

    if report.get("status") != "pass":
        raise SystemExit(f"{label} after {context} report status is not pass")

    for key in ("passes", "warnings", "failures", "total"):
        if not is_check_json_non_negative_int(report.get(key)):
            raise SystemExit(f"{label} after {context} report {key} is invalid")

    if report.get("warnings") != 0 or report.get("failures") != 0:
        raise SystemExit(f"{label} after {context} report contains warnings or failures")

    passes = report.get("passes")
    total = report.get("total")
    if passes != total or total != len(EXPECTED_CHECK_RESULT_IDS):
        raise SystemExit(f"{label} after {context} report pass count differs from expected total")

    score = report.get("score")
    if not isinstance(score, str) or score != f"{passes}/{total}":
        raise SystemExit(f"{label} after {context} report score differs from expected score")

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

    if len(results) != len(EXPECTED_CHECK_RESULT_IDS):
        raise SystemExit(f"{label} after {context} result count differs from expected contract")

    for index, expected_result_id in enumerate(EXPECTED_CHECK_RESULT_IDS):
        raw_result = results[index]
        if not isinstance(raw_result, dict):
            raise SystemExit(f"{label} after {context} result entry is not an object")
        if raw_result.get("id") != expected_result_id:
            raise SystemExit(
                f"{label} after {context} result order differs from expected check: {expected_result_id}"
            )
        expected_result_keys = (
            EXPECTED_CHECK_RESULT_KEYS_WITH_EVIDENCE
            if expected_result_id == "content-depth"
            else EXPECTED_CHECK_RESULT_KEYS
        )
        result = assert_check_json_keys(
            raw_result,
            expected_result_keys,
            label=f"{label} result entry",
            context=context,
        )
        if not isinstance(result.get("title"), str) or not result["title"]:
            raise SystemExit(f"{label} after {context} result title is missing: {expected_result_id}")
        if type(result.get("passed")) is not bool:
            raise SystemExit(f"{label} after {context} result passed flag is invalid: {expected_result_id}")
        if not isinstance(result.get("message"), str) or not result["message"]:
            raise SystemExit(f"{label} after {context} result message is missing: {expected_result_id}")
        if "evidence" in expected_result_keys and (
            not isinstance(result.get("evidence"), str) or not result["evidence"]
        ):
            raise SystemExit(f"{label} after {context} result evidence is missing: {expected_result_id}")
        if result.get("level") != "pass" or result.get("passed") is not True:
            raise SystemExit(f"{label} after {context} result is not pass: {expected_result_id}")


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

    payload = assert_check_json_keys(
        payload,
        EXPECTED_CHECK_EXAMPLES_PAYLOAD_KEYS,
        label="check examples JSON top-level",
        context=context,
    )

    if payload.get("mode") != "examples":
        raise SystemExit(f"check examples JSON after {context} mode differs from expected examples mode")

    if payload.get("routeId") != EXPECTED_ROUTE_ID:
        raise SystemExit(f"check examples JSON after {context} routeId differs from expected route")

    if payload.get("query") != EXPECTED_EXAMPLES_EFFECTIVE_QUERY:
        raise SystemExit(f"check examples JSON after {context} query differs from expected query")

    if not is_check_json_positive_int(payload.get("limit")):
        raise SystemExit(f"check examples JSON after {context} limit is invalid")
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
        if not is_check_json_non_negative_int(payload.get(key)):
            raise SystemExit(f"check examples JSON after {context} {key} is invalid")
        if payload.get(key) != expected:
            raise SystemExit(f"check examples JSON after {context} {key} differs from expected count")

    examples = payload.get("examples")
    if not isinstance(examples, list) or len(examples) != 1:
        raise SystemExit(f"check examples JSON after {context} does not contain exactly one example")

    item = examples[0]
    item = assert_check_json_keys(
        item,
        EXPECTED_CHECK_EXAMPLE_ENTRY_KEYS,
        label="check examples JSON example entry",
        context=context,
    )

    example = assert_check_json_keys(
        item.get("example"),
        EXPECTED_REFERENCE_EXAMPLE_KEYS,
        label="check examples JSON example metadata",
        context=context,
    )

    if example.get("relPath") != EXPECTED_EXAMPLES_HIT:
        raise SystemExit(f"check examples JSON after {context} example path differs from expected hit")

    if example.get("category") != EXPECTED_EXAMPLES_CATEGORY:
        raise SystemExit(f"check examples JSON after {context} example category differs from expected category")

    title = example.get("title")
    if not isinstance(title, str) or EXPECTED_EXAMPLES_TITLE_FRAGMENT not in title:
        raise SystemExit(f"check examples JSON after {context} example title differs from expected title")

    if not is_check_json_positive_int(example.get("score")):
        raise SystemExit(f"check examples JSON after {context} example score is invalid")

    if not isinstance(example.get("preview"), str) or not example["preview"]:
        raise SystemExit(f"check examples JSON after {context} example preview is missing")

    assert_component_spec_check_report(
        item.get("report"),
        context=context,
        label="check examples JSON",
        expected_file_suffix=EXPECTED_EXAMPLES_HIT,
    )

    report = item["report"]
    report_status_counts = {
        "passed": 1 if report.get("status") == "pass" else 0,
        "warned": 1 if report.get("status") == "warn" else 0,
        "failed": 1 if report.get("status") == "fail" else 0,
    }
    if (
        payload.get("total") != len(examples)
        or payload.get("passed") != report_status_counts["passed"]
        or payload.get("warned") != report_status_counts["warned"]
        or payload.get("failed") != report_status_counts["failed"]
    ):
        raise SystemExit(f"check examples JSON after {context} summary counts do not match example reports")


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
                "usage": EXPECTED_HELP_TOPIC_USAGES[topic],
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
        "  prompt <brief|--from-file file|--stdin> [--route id] [--with-learning] [--learning-category kind] [--learning-limit N] [--out file]",
        "    Generate a ready-to-use agent prompt",
        "  pack <brief|--from-file file|--stdin> [--route id] [--with-learning] [--learning-category kind] [--learning-limit N] [--max-bytes N]",
        "    Generate prompt plus bounded context with summary",
        "  check <artifact.md|--stdin|--examples> [--route id|--all-routes] [--learn]",
        "    Check generated Markdown artifact quality; add --issues-only or --learn",
        "  examples [query] [--route id] [--limit N] [--json]                     Find worked examples for a route or query",
        "  learn [--init|--remember text|--feedback text|--list|--export|--query text|--explain|--backup|--redact|--verify|--diff|--restore|--restore-backups [--prune]|--import|--audit [--fix]|--curate|--stats|--usage|--eval-template|--eval|--forget id|--clear] [--json|--report] [--out file]",
        "    Manage local learning preferences, usage reports, and eval checkpoints for prompt personalization",
        "  workspace [--root path] [--learning-file path] [--learning-usage path] [--learning-eval path] [--strict] [--json]",
        "    Show read-only local dogfood readiness: git, repository, learning usage, eval checkpoints, and release scripts",
        "  site <workspace.json|--stdin> [--strict] [--json|--mcp-check|--mcp-plan|--tasks|--bundle|--report|--prompts|--prompt id [--task id]] [--out file] | site <bundle-dir> --bundle-check [--json] | site <bundle-dir> --bundle-compare other-bundle-dir [--json] | site <bundle-dir> --bundle-handoff [--json] | site --sample [--out file] | site --prompt-list [--json]",
        "    Validate Website Improvement Console exports and generate handoff artifacts",
        "",
        "Environment overrides:",
        "Quickstart:",
        "  $ design-ai route \"improve homepage conversion and SEO\" --explain",
        "  $ design-ai prompt \"improve homepage conversion\" --route website-improvement",
        "Docs:    https://github.com/sungjin9288/design-ai",
        f"Plugin:  {EXPECTED_PLUGIN_INVENTORY_SUMMARY} (UI/UX, website improvement, motion,",
    ])


def passing_version_output() -> str:
    return "\n".join([
        "design-ai CLI:    4.51.0",
        "Plugin / corpus:  4.51.0",
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
                "cli": "4.51.0",
                "plugin": "4.51.0",
                "aligned": True,
            },
        },
        ensure_ascii=False,
        indent=2,
    )


def passing_workspace_json() -> str:
    return json.dumps(
        {
            "context": {
                "cwd": "/tmp/project",
                "root": "/tmp/project",
                "sourceRoot": "/tmp/design-ai",
                "packageName": "@design-ai/cli",
                "version": "4.51.0",
            },
            "git": {
                "isRepo": False,
                "root": "/tmp/project",
                "branch": "",
                "clean": True,
                "upstream": "",
                "ahead": 0,
                "behind": 0,
                "remote": "",
                "lastCommit": None,
                "statusShort": [],
                "reason": "not a git repository",
            },
            "repository": {
                "slug": EXPECTED_REPOSITORY_SLUG,
                "url": EXPECTED_REPOSITORY_URL,
                "expectedRemoteUrl": f"{EXPECTED_REPOSITORY_URL}.git",
                "packageRepositoryUrl": f"git+{EXPECTED_REPOSITORY_URL}.git",
                "packageHomepage": f"{EXPECTED_REPOSITORY_URL}#readme",
                "packageBugsUrl": f"{EXPECTED_REPOSITORY_URL}/issues",
                "pluginHomepage": EXPECTED_REPOSITORY_URL,
                "pluginRepository": EXPECTED_REPOSITORY_URL,
                "metadataAligned": True,
                "remoteUrl": "",
                "remoteSlug": "",
                "remoteAligned": None,
                "issues": [],
            },
            "learning": {
                "file": "/tmp/learning.json",
                "exists": False,
                "updatedAt": "",
                "count": 0,
                "categoryCounts": {},
                "sourceCounts": {},
                "latestEntry": None,
                "auditSummary": {
                    "status": "pass",
                    "failures": 0,
                    "warnings": 0,
                },
                "error": "",
            },
            "learningUsage": None,
            "learningEval": None,
            "release": {
                "packageName": "@design-ai/cli",
                "version": "4.51.0",
                "scripts": {
                    "test": "node --test cli/lib/*.test.mjs",
                    "audit:strict": "python3 -B tools/audit/run-all.py --strict",
                    "release:metadata": "python3 -B tools/audit/release-metadata.py",
                    "package:smoke": "python3 -B tools/audit/package-smoke.py --pack",
                    "ci:local": "python3 -B tools/audit/local-ci.py",
                },
                "available": [
                    "test",
                    "audit:strict",
                    "release:metadata",
                    "package:smoke",
                    "ci:local",
                ],
                "missing": [],
            },
            "nextActions": [
                {
                    "level": "warn",
                    "text": "Open design-ai from a git workspace before preparing shared changes.",
                },
                {
                    "level": "info",
                    "text": "Run CLI unit tests before handing this phase off.",
                    "command": "npm test",
                },
            ],
        },
        ensure_ascii=False,
        indent=2,
    )


def passing_site_json() -> str:
    return json.dumps(
        {
            "filePath": "stdin",
            "valid": True,
            "status": "pass",
            "site": {
                "id": "sample-korean-saas",
                "name": "Korean SaaS marketing site",
                "liveUrl": "https://example.com",
                "repoUrl": "https://github.com/acme/korean-saas-site",
                "localPath": "/Users/you/dev/korean-saas-site",
                "deployProvider": "vercel",
                "cms": "sanity",
                "database": "none",
                "pages": ["/", "/pricing", "/signup", "/docs"],
                "userFlows": [
                    "Visitor compares pricing and starts signup",
                    "Existing customer finds feature proof before contacting sales",
                ],
                "viewports": ["desktop", "tablet", "mobile"],
            },
            "counts": {
                "pages": 4,
                "userFlows": 2,
                "viewports": 3,
                "auditCategories": 9,
                "auditFindings": 3,
                "refactorTasks": 1,
                "requiredMcp": 3,
                "optionalMcp": 6,
                "unavailableMcp": 0,
            },
            "auditStatusCounts": {
                "todo": 7,
                "in-progress": 2,
                "done": 0,
                "blocked": 0,
            },
            "mcpStatusCounts": {
                "required": 3,
                "optional": 6,
                "unused": 1,
                "unavailable": 0,
            },
            "taskPriorityCounts": {
                "p0": 0,
                "p1": 1,
                "p2": 0,
                "p3": 0,
            },
            "requiredMcp": ["github", "browser", "deploy"],
            "topTasks": [
                {
                    "id": "task-homepage-cta",
                    "title": "Clarify homepage CTA hierarchy",
                    "priority": "p1",
                    "category": "visual-design",
                    "impact": "high",
                    "effort": "medium",
                    "pages": ["/"],
                },
            ],
            "issues": [
                {
                    "level": "pass",
                    "id": "workspace-ready",
                    "message": "Workspace is ready for report and prompt generation",
                },
            ],
        },
        ensure_ascii=False,
        indent=2,
    )


def passing_site_sample_json() -> str:
    return json.dumps(
        {
            "version": 1,
            "updatedAt": "2026-05-30T00:00:00.000Z",
            "siteProfile": {
                "id": "sample-korean-saas",
                "name": "Korean SaaS marketing site",
                "liveUrl": "https://example.com",
                "repoUrl": "https://github.com/acme/korean-saas-site",
                "localPath": "/Users/you/dev/korean-saas-site",
                "figmaUrl": "https://figma.com/file/example",
                "brandNotes": "Quiet B2B SaaS tone, Pretendard typography, dense but readable Korean product copy, indigo accent only for action and focus.",
                "deployProvider": "vercel",
                "sentryProject": "acme/korean-saas-web",
                "cms": "sanity",
                "database": "none",
                "pages": ["/", "/pricing", "/signup", "/docs"],
                "userFlows": [
                    "Visitor compares pricing and starts signup",
                    "Existing customer finds feature proof before contacting sales",
                ],
                "viewports": ["desktop", "tablet", "mobile"],
            },
            "auditChecklist": {
                "visual-design": {
                    "status": "in-progress",
                    "notes": "Hero hierarchy and CTA contrast need review before company pilot.",
                    "findings": ["Primary CTA competes with secondary link on the homepage"],
                },
                "ux-flow": {"status": "todo", "notes": "Map visitor path from landing page to pricing and signup.", "findings": []},
                "responsive": {"status": "todo", "notes": "Check 1440, 1024, 390, and 360 width layouts.", "findings": []},
                "accessibility": {
                    "status": "todo",
                    "notes": "Keyboard and focus audit required for nav, pricing toggle, and forms.",
                    "findings": ["Focus state is not yet documented for the mobile menu"],
                },
                "performance": {"status": "todo", "notes": "Run Lighthouse after visual pass.", "findings": []},
                "seo": {"status": "todo", "notes": "Inspect title, description, heading order, canonical, OG.", "findings": []},
                "technical-quality": {"status": "todo", "notes": "Confirm component reuse before editing target repo.", "findings": []},
                "runtime-issues": {"status": "todo", "notes": "Open console/network once preview deploy is available.", "findings": []},
                "content-quality": {
                    "status": "in-progress",
                    "notes": "Copy should lead with proof and reduce generic SaaS phrasing.",
                    "findings": ["Pricing page does not explain plan fit in the first viewport"],
                },
            },
            "mcpReadiness": {
                "github": "required",
                "figma": "optional",
                "browser": "required",
                "chromeDevtools": "optional",
                "deploy": "required",
                "sentry": "optional",
                "database": "unused",
                "cms": "optional",
                "collaboration": "optional",
                "research": "optional",
            },
            "refactorTasks": [
                {
                    "id": "task-homepage-cta",
                    "title": "Clarify homepage CTA hierarchy",
                    "category": "visual-design",
                    "problem": "Primary and secondary actions compete in the hero, which weakens the visitor's first decision.",
                    "evidence": "Sample finding: Primary CTA competes with secondary link on the homepage.",
                    "impact": "high",
                    "effort": "medium",
                    "priority": "p1",
                    "pages": ["/"],
                    "recommendedMcp": ["browser", "figma"],
                    "codexPrompt": "Inspect the target homepage implementation, preserve existing design system patterns, and revise the hero CTA hierarchy so the primary signup action is visually dominant while the secondary action remains available.",
                    "verification": [
                        "Run target repo lint/build",
                        "Verify desktop/tablet/mobile hero layout",
                        "Confirm focus indicators and text contrast",
                    ],
                    "risks": ["Could change conversion copy without stakeholder approval"],
                },
            ],
            "reportNotes": "MVP audit is a planning console. Run the generated prompts inside the target website repo before marking implementation complete.",
        },
        ensure_ascii=False,
        indent=2,
    )


def passing_site_tasks_json() -> str:
    payload = json.loads(passing_site_sample_json())
    payload["updatedAt"] = "2026-05-30T00:01:00.000Z"
    payload["refactorTasks"].extend([
        {
            "id": "task-accessibility",
            "title": "Resolve Accessibility finding",
            "category": "accessibility",
            "problem": "Focus state is not yet documented for the mobile menu",
            "evidence": "Audit finding captured in the Website Improvement Console.",
            "impact": "high",
            "effort": "medium",
            "priority": "p0",
            "pages": ["/", "/pricing", "/signup"],
            "recommendedMcp": ["browser", "chromeDevtools"],
            "codexPrompt": "You are working in the target website repo, not in design-ai.\nSite: Korean SaaS marketing site\nLive URL: https://example.com\nCategory: Accessibility\nProblem: Focus state is not yet documented for the mobile menu\n\nInspect the target repo first. Reuse existing architecture, UI components, state patterns, styling conventions, and design tokens. Do not add dependencies unless the existing codebase clearly requires them.\n\nImplement the smallest safe improvement, then verify desktop/tablet/mobile behavior, keyboard focus, screen-reader semantics where relevant, and the target repo's lint/typecheck/build commands.",
            "verification": [
                "Tab through all interactive controls",
                "Confirm visible focus and accessible names",
                "Run target repo lint/typecheck/build when available",
            ],
            "risks": [
                "Target repo architecture may constrain the fix",
                "Manual stakeholder review may be needed before changing copy or brand language",
            ],
        },
        {
            "id": "task-content-quality",
            "title": "Resolve Content Quality finding",
            "category": "content-quality",
            "problem": "Pricing page does not explain plan fit in the first viewport",
            "evidence": "Audit finding captured in the Website Improvement Console.",
            "impact": "medium",
            "effort": "medium",
            "priority": "p1",
            "pages": ["/", "/pricing", "/signup"],
            "recommendedMcp": ["figma", "research", "cms"],
            "codexPrompt": "You are working in the target website repo, not in design-ai.\nSite: Korean SaaS marketing site\nLive URL: https://example.com\nCategory: Content Quality\nProblem: Pricing page does not explain plan fit in the first viewport\n\nInspect the target repo first. Reuse existing architecture, UI components, state patterns, styling conventions, and design tokens. Do not add dependencies unless the existing codebase clearly requires them.\n\nImplement the smallest safe improvement, then verify desktop/tablet/mobile behavior, keyboard focus, screen-reader semantics where relevant, and the target repo's lint/typecheck/build commands.",
            "verification": [
                "Read the page as a first-time visitor",
                "Check whether claims have concrete proof",
                "Run target repo lint/typecheck/build when available",
            ],
            "risks": [
                "Target repo architecture may constrain the fix",
                "Manual stakeholder review may be needed before changing copy or brand language",
            ],
        },
    ])
    return json.dumps(payload, ensure_ascii=False, indent=2)


def passing_site_prompt_markdown() -> str:
    return """# Codex implementation prompt
Site profile:
- Name: Korean SaaS marketing site
- Live URL: https://example.com
- Repo URL: https://github.com/acme/korean-saas-site
- Local path: /Users/you/dev/korean-saas-site
- Figma URL: https://figma.com/file/example
- Deploy: vercel
- Sentry: acme/korean-saas-web
- CMS: sanity
- Database: none
- Viewports: desktop, tablet, mobile

Priority pages:
- /
- /pricing
- /signup
- /docs

User flows:
- Visitor compares pricing and starts signup
- Existing customer finds feature proof before contacting sales

Brand/design notes:
Quiet B2B SaaS tone, Pretendard typography, dense but readable Korean product copy, indigo accent only for action and focus.

Selected task:
- Task ID: task-homepage-cta
- Title: Clarify homepage CTA hierarchy
- Category: Visual Design
- Problem: Primary and secondary actions compete in the hero, which weakens the visitor's first decision.
- Evidence: Sample finding: Primary CTA competes with secondary link on the homepage.
- Impact: high
- Effort: medium
- Priority: p1
- Pages: /
- Recommended MCP: browser, figma

Verification:
- Run target repo lint/build
- Verify desktop/tablet/mobile hero layout
- Confirm focus indicators and text contrast

Risks:
- Could change conversion copy without stakeholder approval

Rules:
- Work in the target website repository, not in this design-ai repository.
- Inspect existing architecture, components, state, styling, and design tokens before editing.
- Keep changes scoped and avoid new dependencies unless clearly justified.
- Preserve accessibility: keyboard reachability, visible focus, semantic HTML, screen-reader labels, and WCAG 2.1 AA contrast.
- Verify desktop, tablet, and mobile layouts.

Implement the smallest safe fix. After editing, run the target repo's most relevant lint/typecheck/build/test command and summarize changed files plus verification.
"""


def passing_site_prompt_templates_json() -> str:
    templates = [
        {
            "id": "codex-repo-intake",
            "label": "Codex repo intake",
            "agent": "codex",
            "output": "Repository inspection plan",
            "description": "Inspect the target website repo and return structure, likely touch points, risks, and verification commands.",
            "taskSelectable": False,
        },
        {
            "id": "codex-implementation",
            "label": "Codex implementation",
            "agent": "codex",
            "output": "Focused implementation prompt",
            "description": "Implement the selected website improvement task in the target repo with scoped verification.",
            "taskSelectable": True,
        },
        {
            "id": "codex-visual-qa",
            "label": "Codex visual QA",
            "agent": "codex",
            "output": "Browser/Playwright QA checklist",
            "description": "Verify priority pages across configured viewports for layout, focus, console, and asset issues.",
            "taskSelectable": False,
        },
        {
            "id": "codex-deployment",
            "label": "Codex deployment verification",
            "agent": "codex",
            "output": "Deployment verification prompt",
            "description": "Check preview or production deployment, logs, metadata, user flows, and remaining launch risks.",
            "taskSelectable": False,
        },
        {
            "id": "claude-design-review",
            "label": "Claude design review",
            "agent": "claude",
            "output": "Senior design critique",
            "description": "Review visual hierarchy, layout rhythm, typography, CTA clarity, responsive behavior, and accessibility concerns.",
            "taskSelectable": False,
        },
        {
            "id": "claude-competitor",
            "label": "Claude competitor research",
            "agent": "claude",
            "output": "Competitor opportunity map",
            "description": "Compare relevant peer sites for structure, conversion path, proof, pricing, tone, content, and SEO positioning.",
            "taskSelectable": False,
        },
        {
            "id": "claude-copy-ux",
            "label": "Claude copy/UX critique",
            "agent": "claude",
            "output": "Copy and UX improvement notes",
            "description": "Critique copy, information architecture, trust signals, CTA language, and conversion flow.",
            "taskSelectable": False,
        },
        {
            "id": "handoff-report",
            "label": "Final handoff report",
            "agent": "codex-or-claude",
            "output": "Final handoff report prompt",
            "description": "Generate a final report covering target site info, audit summary, recommendations, executed work, verification, risks, and next actions.",
            "taskSelectable": False,
        },
    ]
    return json.dumps({"count": len(templates), "templates": templates}, ensure_ascii=False, indent=2)


def passing_site_mcp_check_json() -> str:
    items = [
        {
            "key": "github",
            "label": "GitHub",
            "requestedStatus": "required",
            "state": "ready",
            "level": "pass",
            "evidence": [
                "repoUrl: https://github.com/acme/korean-saas-site",
                "localPath: /Users/you/dev/korean-saas-site",
            ],
            "actions": [],
        },
        {
            "key": "figma",
            "label": "Figma",
            "requestedStatus": "optional",
            "state": "ready",
            "level": "pass",
            "evidence": ["figmaUrl: https://figma.com/file/example"],
            "actions": [],
        },
        {
            "key": "browser",
            "label": "Browser/Playwright",
            "requestedStatus": "required",
            "state": "ready",
            "level": "pass",
            "evidence": ["liveUrl: https://example.com", "viewports: desktop, tablet, mobile"],
            "actions": [],
        },
        {
            "key": "chromeDevtools",
            "label": "Chrome DevTools",
            "requestedStatus": "optional",
            "state": "ready",
            "level": "pass",
            "evidence": ["liveUrl: https://example.com"],
            "actions": [],
        },
        {
            "key": "deploy",
            "label": "Deploy",
            "requestedStatus": "required",
            "state": "ready",
            "level": "pass",
            "evidence": ["deployProvider: vercel", "liveUrl: https://example.com"],
            "actions": [],
        },
        {
            "key": "sentry",
            "label": "Sentry",
            "requestedStatus": "optional",
            "state": "ready",
            "level": "pass",
            "evidence": ["sentryProject: acme/korean-saas-web"],
            "actions": [],
        },
        {
            "key": "database",
            "label": "Database",
            "requestedStatus": "unused",
            "state": "unused",
            "level": "pass",
            "evidence": ["Marked unused in mcpReadiness."],
            "actions": [],
        },
        {
            "key": "cms",
            "label": "CMS",
            "requestedStatus": "optional",
            "state": "ready",
            "level": "pass",
            "evidence": ["cms: sanity"],
            "actions": [],
        },
        {
            "key": "collaboration",
            "label": "Collaboration",
            "requestedStatus": "optional",
            "state": "ready",
            "level": "pass",
            "evidence": ["Optional collaboration is tracked in handoff notes for this local MVP."],
            "actions": [],
        },
        {
            "key": "research",
            "label": "Research",
            "requestedStatus": "optional",
            "state": "ready",
            "level": "pass",
            "evidence": ["liveUrl: https://example.com"],
            "actions": [],
        },
    ]
    return json.dumps(
        {
            "filePath": "stdin",
            "status": "pass",
            "workspaceStatus": "pass",
            "site": {
                "name": "Korean SaaS marketing site",
                "liveUrl": "https://example.com",
                "repoUrl": "https://github.com/acme/korean-saas-site",
                "localPath": "/Users/you/dev/korean-saas-site",
            },
            "counts": {
                "total": 10,
                "required": 3,
                "optional": 6,
                "ready": 9,
                "missing": 0,
                "unused": 1,
                "unavailable": 0,
                "taskGaps": 0,
            },
            "items": items,
            "taskGaps": [],
            "workspaceIssues": [],
            "nextActions": [],
        },
        ensure_ascii=False,
        indent=2,
    )


def passing_site_mcp_plan_markdown() -> str:
    return """# Website improvement MCP action plan: Korean SaaS marketing site

## Summary
- Source: stdin
- Status: pass
- Workspace status: pass
- Live URL: https://example.com
- Repo: https://github.com/acme/korean-saas-site
- Ready MCP: 9/10
- Missing MCP: 0
- Task/MCP gaps: 0

## Readiness Matrix
| MCP | Requested | State | Level | Evidence |
| --- | --- | --- | --- | --- |
| GitHub | required | ready | pass | repoUrl: https://github.com/acme/korean-saas-site; localPath: /Users/you/dev/korean-saas-site |
| Figma | optional | ready | pass | figmaUrl: https://figma.com/file/example |
| Browser/Playwright | required | ready | pass | liveUrl: https://example.com; viewports: desktop, tablet, mobile |

## Blocking Items
- No blocking readiness issues.

## Warnings
- No optional readiness or task/MCP warnings.

## Task/MCP Alignment
| Task | Priority / impact | Recommended MCP | Readiness state |
| --- | --- | --- | --- |
| task-homepage-cta | p1 / high | browser, figma | browser: ready, figma: ready |

## Execution Sequence
1. Fix every blocking item before target-repo implementation handoff.
2. Resolve warnings that affect the next selected refactor task, or mark the MCP unused when it is intentionally out of scope.
3. Re-run the strict readiness gate and keep the JSON output with the handoff package.
4. Generate or refresh starter tasks, then export the selected Codex implementation prompt.
5. Run target-repo lint/typecheck/build plus desktop, tablet, mobile, keyboard, and screen-reader verification after implementation.

## Commands
- `design-ai site <workspace.json> --mcp-check --strict --json`
- `design-ai site <workspace.json> --tasks --out website-workspace.tasks.json`
- `design-ai site <workspace.json> --prompt codex-implementation --task 1 --out codex-implementation.md`
- `design-ai site <workspace.json> --report --out website-handoff.md`

## Boundaries
- This plan is deterministic and local.
- It does not call external MCPs, mutate the target website repo, run Lighthouse/axe, capture screenshots, or write to deployment/CMS/Sentry systems.
- Run the generated Codex/Claude prompts in the target website workflow after this readiness plan is clean.
"""


def passing_workspace_strict_clean_json() -> str:
    payload = json.loads(passing_workspace_json())
    payload["git"] = {
        "isRepo": True,
        "root": "/tmp/workspace-strict-repo",
        "branch": "main",
        "clean": True,
        "upstream": "origin/main",
        "ahead": 0,
        "behind": 0,
        "remote": f"{EXPECTED_REPOSITORY_URL}.git",
        "lastCommit": {
            "hash": "abc1234",
            "subject": "feat: workspace strict smoke fixture",
        },
        "statusShort": [],
        "reason": "",
    }
    payload["repository"]["remoteUrl"] = f"{EXPECTED_REPOSITORY_URL}.git"
    payload["repository"]["remoteSlug"] = EXPECTED_REPOSITORY_SLUG
    payload["repository"]["remoteAligned"] = True
    payload["nextActions"] = [
        {
            "level": "pass",
            "text": "Git workspace is clean and synced.",
        },
        {
            "level": "info",
            "text": "Capture reviewed feedback after checks to make dogfood runs improve over time.",
            "command": "design-ai check artifact.md --learn --yes",
        },
        {
            "level": "info",
            "text": "Run CLI unit tests before handing this phase off.",
            "command": "npm test",
        },
    ]
    return json.dumps(payload, ensure_ascii=False, indent=2)


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
        "✓  Version alignment: 4.51.0",
        "✓  Manifest paths: 41 referenced artifact(s) exist",
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
        "✓  Installed skills: 20/20 installed",
        "✓  Installed agents: 4/4 installed",
        "✓  Installed slash commands: 17/17 installed",
        "",
        f"ℹ  Summary: {len(EXPECTED_DOCTOR_PASS_LABELS)} pass, 0 warning(s), 0 failure(s)",
        "",
    ])


def passing_install_output() -> str:
    return "\n".join([
        "",
        "  design-ai installer",
        "  v4.51.0",
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
        "Installed 20 skills (prefix: smoke-design-)",
        "Installed 4 agents (prefix: smoke-design-)",
        "Installed 17 slash commands (prefix: /smoke-design-)",
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
        "Skills: 20 installed",
        "Agents: 4 installed",
        "Slash commands: 17 installed",
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
                "installed": 41,
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
        "Removed 41 design-ai symlinks",
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

    catalog = assert_smoke_json_keys(
        catalog,
        EXPECTED_HELP_PAYLOAD_KEYS,
        label="top-level",
        context=context,
        command_label="help JSON",
    )

    raw_topics = catalog.get("topics")
    if not isinstance(raw_topics, list):
        raise SystemExit(f"help JSON after {context} does not contain a topics array")

    raw_aliases = catalog.get("aliases")
    if not isinstance(raw_aliases, dict):
        raise SystemExit(f"help JSON after {context} does not contain an aliases object")
    if list(raw_aliases) != list(EXPECTED_HELP_ALIASES):
        raise SystemExit(f"help JSON after {context} alias order differs from expected order")

    raw_usage = catalog.get("usage")
    if raw_usage != EXPECTED_HELP_USAGE:
        raise SystemExit(f"help JSON after {context} usage differs from expected usage")

    if raw_aliases != EXPECTED_HELP_ALIASES:
        raise SystemExit(f"help JSON after {context} aliases differ from expected aliases")

    topics: list[str] = []
    topic_aliases: dict[str, str] = {}
    for item in raw_topics:
        item = assert_smoke_json_keys(
            item,
            EXPECTED_HELP_TOPIC_KEYS,
            label="topic entry",
            context=context,
            command_label="help JSON",
        )
        topic = item.get("topic")
        if not isinstance(topic, str) or not topic:
            raise SystemExit(f"help JSON after {context} contains an invalid topic entry")
        usage = item.get("usage")
        expected_usage = EXPECTED_HELP_TOPIC_USAGES.get(topic)
        if expected_usage is None:
            if not isinstance(usage, str) or not usage:
                raise SystemExit(f"help JSON after {context} topic {topic} has invalid usage")
        elif usage != expected_usage:
            raise SystemExit(f"help JSON after {context} usage differs for topic {topic}")
        description = item.get("description")
        if not isinstance(description, str) or not description:
            raise SystemExit(f"help JSON after {context} topic {topic} has invalid description")
        aliases = item.get("aliases")
        if not isinstance(aliases, list) or not all(isinstance(alias, str) and alias for alias in aliases):
            raise SystemExit(f"help JSON after {context} topic {topic} has invalid aliases")
        if topic in EXPECTED_HELP_TOPIC_USAGES:
            expected_aliases = [
                alias
                for alias, target in EXPECTED_HELP_ALIASES.items()
                if target == topic
            ]
            if aliases != expected_aliases:
                raise SystemExit(f"help JSON after {context} aliases differ for topic {topic}")
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

    payload = assert_smoke_json_keys(
        payload,
        ["context", "versions"],
        label="top-level",
        context=context,
        command_label="version JSON",
    )

    version_context = assert_smoke_json_keys(
        payload.get("context"),
        ["sourceRoot"],
        label="context",
        context=context,
        command_label="version JSON",
    )
    if not isinstance(version_context.get("sourceRoot"), str) or not version_context["sourceRoot"]:
        raise SystemExit(f"version JSON after {context} sourceRoot is missing")

    versions = assert_smoke_json_keys(
        payload.get("versions"),
        ["cli", "plugin", "aligned"],
        label="versions",
        context=context,
        command_label="version JSON",
    )
    for key in ("cli", "plugin"):
        value = versions.get(key)
        if not isinstance(value, str) or not re.fullmatch(r"\d+\.\d+\.\d+", value):
            raise SystemExit(f"version JSON after {context} {key} version differs from expected semver")
    if versions.get("aligned") is not True:
        raise SystemExit(f"version JSON after {context} versions are not aligned")
    if versions["cli"] != versions["plugin"]:
        raise SystemExit(f"version JSON after {context} CLI and plugin versions differ")


def assert_workspace_json(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"workspace JSON after {context} is not valid JSON: {error}") from error

    payload = assert_smoke_json_keys(
        payload,
        EXPECTED_WORKSPACE_PAYLOAD_KEYS,
        label="top-level",
        context=context,
        command_label="workspace JSON",
    )

    workspace_context = assert_smoke_json_keys(
        payload.get("context"),
        EXPECTED_WORKSPACE_CONTEXT_KEYS,
        label="context",
        context=context,
        command_label="workspace JSON",
    )
    if workspace_context.get("packageName") != "@design-ai/cli":
        raise SystemExit(f"workspace JSON after {context} packageName differs from expected package")
    if workspace_context.get("version") != "4.51.0":
        raise SystemExit(f"workspace JSON after {context} version differs from expected release version")
    for key in ("cwd", "root", "sourceRoot"):
        if not isinstance(workspace_context.get(key), str) or not workspace_context[key]:
            raise SystemExit(f"workspace JSON after {context} context {key} is missing")

    git = assert_smoke_json_keys(
        payload.get("git"),
        EXPECTED_WORKSPACE_GIT_KEYS,
        label="git",
        context=context,
        command_label="workspace JSON",
    )
    if type(git.get("isRepo")) is not bool:
        raise SystemExit(f"workspace JSON after {context} git isRepo is not boolean")
    if type(git.get("clean")) is not bool:
        raise SystemExit(f"workspace JSON after {context} git clean is not boolean")
    for key in ("ahead", "behind"):
        if not is_lifecycle_json_non_negative_int(git.get(key)):
            raise SystemExit(f"workspace JSON after {context} git {key} is invalid")
    if not isinstance(git.get("statusShort"), list):
        raise SystemExit(f"workspace JSON after {context} git statusShort is not a list")

    repository = assert_smoke_json_keys(
        payload.get("repository"),
        EXPECTED_WORKSPACE_REPOSITORY_KEYS,
        label="repository",
        context=context,
        command_label="workspace JSON",
    )
    expected_repository_values = {
        "slug": EXPECTED_REPOSITORY_SLUG,
        "url": EXPECTED_REPOSITORY_URL,
        "expectedRemoteUrl": f"{EXPECTED_REPOSITORY_URL}.git",
        "packageRepositoryUrl": f"git+{EXPECTED_REPOSITORY_URL}.git",
        "packageHomepage": f"{EXPECTED_REPOSITORY_URL}#readme",
        "packageBugsUrl": f"{EXPECTED_REPOSITORY_URL}/issues",
        "pluginHomepage": EXPECTED_REPOSITORY_URL,
        "pluginRepository": EXPECTED_REPOSITORY_URL,
    }
    for key, expected in expected_repository_values.items():
        if repository.get(key) != expected:
            raise SystemExit(f"workspace JSON after {context} repository {key} differs from expected canonical value")
    if repository.get("metadataAligned") is not True:
        raise SystemExit(f"workspace JSON after {context} repository metadata is not aligned")
    if repository.get("remoteAligned") not in (True, False, None):
        raise SystemExit(f"workspace JSON after {context} repository remoteAligned is invalid")
    if not isinstance(repository.get("issues"), list):
        raise SystemExit(f"workspace JSON after {context} repository issues is not a list")

    learning = assert_smoke_json_keys(
        payload.get("learning"),
        EXPECTED_WORKSPACE_LEARNING_KEYS,
        label="learning",
        context=context,
        command_label="workspace JSON",
    )
    if not isinstance(learning.get("file"), str) or not learning["file"]:
        raise SystemExit(f"workspace JSON after {context} learning file is missing")
    if type(learning.get("exists")) is not bool:
        raise SystemExit(f"workspace JSON after {context} learning exists is not boolean")
    if not isinstance(learning.get("updatedAt"), str):
        raise SystemExit(f"workspace JSON after {context} learning updatedAt is not a string")
    if not is_lifecycle_json_non_negative_int(learning.get("count")):
        raise SystemExit(f"workspace JSON after {context} learning count is invalid")
    assert_smoke_json_keys(
        learning.get("auditSummary"),
        EXPECTED_WORKSPACE_AUDIT_SUMMARY_KEYS,
        label="learning auditSummary",
        context=context,
        command_label="workspace JSON",
    )

    learning_usage = payload.get("learningUsage")
    if learning_usage is not None:
        learning_usage = assert_smoke_json_keys(
            learning_usage,
            EXPECTED_WORKSPACE_LEARNING_USAGE_KEYS,
            label="learningUsage",
            context=context,
            command_label="workspace JSON",
        )
        for key in ("file", "usageFile", "profileFile", "updatedAt"):
            if not isinstance(learning_usage.get(key), str):
                raise SystemExit(f"workspace JSON after {context} learningUsage {key} is not a string")
        if not learning_usage.get("file") or not learning_usage.get("usageFile"):
            raise SystemExit(f"workspace JSON after {context} learningUsage file paths are missing")
        for key in ("exists", "profileExists"):
            if type(learning_usage.get(key)) is not bool:
                raise SystemExit(f"workspace JSON after {context} learningUsage {key} is not boolean")
        for key in (
            "version",
            "eventCount",
            "profileEntryCount",
            "usedEntryCount",
            "unusedEntryCount",
            "staleSelectedEntryCount",
        ):
            if not is_lifecycle_json_non_negative_int(learning_usage.get(key)):
                raise SystemExit(f"workspace JSON after {context} learningUsage {key} is invalid")
        for key in ("commandCounts", "routeCounts", "categoryCounts", "auditStatusCounts"):
            if not isinstance(learning_usage.get(key), dict):
                raise SystemExit(f"workspace JSON after {context} learningUsage {key} is not an object")
        latest_event = learning_usage.get("latestEvent")
        if latest_event is not None:
            latest_event = assert_smoke_json_keys(
                latest_event,
                EXPECTED_WORKSPACE_LEARNING_USAGE_EVENT_KEYS,
                label="learningUsage latestEvent",
                context=context,
                command_label="workspace JSON",
            )
            if not isinstance(latest_event.get("briefHash"), str) or not latest_event["briefHash"]:
                raise SystemExit(f"workspace JSON after {context} learningUsage latestEvent briefHash is missing")
            if "brief" in latest_event or "query" in latest_event:
                raise SystemExit(f"workspace JSON after {context} learningUsage latestEvent exposes raw brief/query text")
            if not isinstance(latest_event.get("selectedEntryIds"), list):
                raise SystemExit(f"workspace JSON after {context} learningUsage latestEvent selectedEntryIds is not a list")
        privacy = assert_smoke_json_keys(
            learning_usage.get("privacy"),
            EXPECTED_WORKSPACE_LEARNING_USAGE_PRIVACY_KEYS,
            label="learningUsage privacy",
            context=context,
            command_label="workspace JSON",
        )
        if privacy.get("storesRawBriefText") is not False or privacy.get("storesBriefHash") is not True:
            raise SystemExit(f"workspace JSON after {context} learningUsage privacy flags changed")
        if privacy.get("storesSelectedEntryIds") is not True:
            raise SystemExit(f"workspace JSON after {context} learningUsage selected id privacy flag changed")
        if not isinstance(learning_usage.get("recommendations"), list):
            raise SystemExit(f"workspace JSON after {context} learningUsage recommendations is not a list")
        readiness = assert_smoke_json_keys(
            learning_usage.get("readiness"),
            EXPECTED_WORKSPACE_LEARNING_USAGE_READINESS_KEYS,
            label="learningUsage readiness",
            context=context,
            command_label="workspace JSON",
        )
        if readiness.get("status") not in ("pass", "warn", "unknown", "fail"):
            raise SystemExit(f"workspace JSON after {context} learningUsage readiness status is invalid")
        if not isinstance(readiness.get("reason"), str):
            raise SystemExit(f"workspace JSON after {context} learningUsage readiness reason is not a string")
        if type(readiness.get("profileFileMatches")) is not bool:
            raise SystemExit(f"workspace JSON after {context} learningUsage readiness profileFileMatches is not boolean")
        if not is_lifecycle_json_non_negative_int(readiness.get("staleSelectedEntryCount")):
            raise SystemExit(f"workspace JSON after {context} learningUsage readiness staleSelectedEntryCount is invalid")

    learning_eval = payload.get("learningEval")
    if learning_eval is not None:
        learning_eval = assert_smoke_json_keys(
            learning_eval,
            EXPECTED_WORKSPACE_LEARNING_EVAL_KEYS,
            label="learningEval",
            context=context,
            command_label="workspace JSON",
        )
        if learning_eval.get("status") not in ("pass", "warn", "fail"):
            raise SystemExit(f"workspace JSON after {context} learningEval status is invalid")
        for key in ("caseCount", "passed", "warned", "failed", "profileEntryCount"):
            if not is_lifecycle_json_non_negative_int(learning_eval.get(key)):
                raise SystemExit(f"workspace JSON after {context} learningEval {key} is invalid")
        if not isinstance(learning_eval.get("source"), str) or not learning_eval["source"]:
            raise SystemExit(f"workspace JSON after {context} learningEval source is missing")
        if not isinstance(learning_eval.get("file"), str) or not learning_eval["file"]:
            raise SystemExit(f"workspace JSON after {context} learningEval file is missing")
        if type(learning_eval.get("profileExists")) is not bool:
            raise SystemExit(f"workspace JSON after {context} learningEval profileExists is not boolean")
        if not isinstance(learning_eval.get("generatedAt"), str):
            raise SystemExit(f"workspace JSON after {context} learningEval generatedAt is not a string")
        source_profile = learning_eval.get("sourceProfile")
        if source_profile is not None:
            source_profile = assert_smoke_json_keys(
                source_profile,
                EXPECTED_WORKSPACE_LEARNING_EVAL_SOURCE_PROFILE_KEYS,
                label="learningEval sourceProfile",
                context=context,
                command_label="workspace JSON",
            )
            if not isinstance(source_profile.get("file"), str):
                raise SystemExit(f"workspace JSON after {context} learningEval sourceProfile file is not a string")
            if source_profile.get("exists") not in (True, False, None):
                raise SystemExit(f"workspace JSON after {context} learningEval sourceProfile exists is invalid")
            if source_profile.get("entryCount") is not None and not is_lifecycle_json_non_negative_int(source_profile.get("entryCount")):
                raise SystemExit(f"workspace JSON after {context} learningEval sourceProfile entryCount is invalid")
            if type(source_profile.get("queryPresent")) is not bool:
                raise SystemExit(f"workspace JSON after {context} learningEval sourceProfile queryPresent is not boolean")
            if source_profile.get("limit") is not None and not is_lifecycle_json_non_negative_int(source_profile.get("limit")):
                raise SystemExit(f"workspace JSON after {context} learningEval sourceProfile limit is invalid")
        assert_smoke_json_keys(
            learning_eval.get("auditSummary"),
            EXPECTED_WORKSPACE_AUDIT_SUMMARY_KEYS,
            label="learningEval auditSummary",
            context=context,
            command_label="workspace JSON",
        )
        privacy = assert_smoke_json_keys(
            learning_eval.get("privacy"),
            EXPECTED_WORKSPACE_LEARNING_EVAL_PRIVACY_KEYS,
            label="learningEval privacy",
            context=context,
            command_label="workspace JSON",
        )
        if privacy.get("storesRawBriefText") is not False or privacy.get("storesBriefHash") is not True:
            raise SystemExit(f"workspace JSON after {context} learningEval privacy flags changed")
        if type(privacy.get("exposesMatchedTokens")) is not bool:
            raise SystemExit(f"workspace JSON after {context} learningEval exposesMatchedTokens is not boolean")
        freshness = assert_smoke_json_keys(
            learning_eval.get("freshness"),
            EXPECTED_WORKSPACE_LEARNING_EVAL_FRESHNESS_KEYS,
            label="learningEval freshness",
            context=context,
            command_label="workspace JSON",
        )
        if freshness.get("status") not in ("pass", "warn", "unknown"):
            raise SystemExit(f"workspace JSON after {context} learningEval freshness status is invalid")
        if type(freshness.get("stale")) is not bool:
            raise SystemExit(f"workspace JSON after {context} learningEval freshness stale is not boolean")
        for key in ("reason", "profileUpdatedAt", "checkpointGeneratedAt", "sourceProfileFile"):
            if not isinstance(freshness.get(key), str):
                raise SystemExit(f"workspace JSON after {context} learningEval freshness {key} is not a string")
        if freshness.get("sourceProfileEntryCount") is not None and not is_lifecycle_json_non_negative_int(freshness.get("sourceProfileEntryCount")):
            raise SystemExit(f"workspace JSON after {context} learningEval freshness sourceProfileEntryCount is invalid")

    release = assert_smoke_json_keys(
        payload.get("release"),
        EXPECTED_WORKSPACE_RELEASE_KEYS,
        label="release",
        context=context,
        command_label="workspace JSON",
    )
    if release.get("packageName") != "@design-ai/cli" or release.get("version") != "4.51.0":
        raise SystemExit(f"workspace JSON after {context} release package metadata differs from expected values")
    if not isinstance(release.get("scripts"), dict):
        raise SystemExit(f"workspace JSON after {context} release scripts is not an object")
    for required_script in ("test", "audit:strict", "release:metadata", "package:smoke", "ci:local"):
        if required_script not in release.get("available", []):
            raise SystemExit(f"workspace JSON after {context} release missing available script {required_script}")
        if required_script not in release.get("scripts", {}):
            raise SystemExit(f"workspace JSON after {context} release scripts missing {required_script}")
    if not isinstance(release.get("missing"), list):
        raise SystemExit(f"workspace JSON after {context} release missing is not a list")

    next_actions = payload.get("nextActions")
    if not isinstance(next_actions, list) or not next_actions:
        raise SystemExit(f"workspace JSON after {context} nextActions is empty")
    for action in next_actions:
        if not isinstance(action, dict):
            raise SystemExit(f"workspace JSON after {context} nextActions entry is not an object")
        expected_keys = EXPECTED_WORKSPACE_ACTION_KEYS_WITH_COMMAND if "command" in action else EXPECTED_WORKSPACE_ACTION_KEYS
        action = assert_smoke_json_keys(
            action,
            expected_keys,
            label="nextActions entry",
            context=context,
            command_label="workspace JSON",
        )
        if action.get("level") not in ("pass", "info", "warn", "fail"):
            raise SystemExit(f"workspace JSON after {context} next action level is invalid")
        if not isinstance(action.get("text"), str) or not action["text"]:
            raise SystemExit(f"workspace JSON after {context} next action text is missing")


def assert_workspace_strict_success_json(
    raw: str,
    *,
    returncode: int,
    context: str,
    cmd: list[str],
) -> None:
    if returncode != 0:
        raise SystemExit(f"workspace strict JSON after {context} expected exit code 0, got {returncode}")
    assert_workspace_json(raw, context=context, cmd=cmd)
    payload = json.loads(raw)
    strict_issues = [
        action
        for action in payload.get("nextActions", [])
        if isinstance(action, dict) and action.get("level") in ("warn", "fail")
    ]
    if strict_issues:
        raise SystemExit(f"workspace strict JSON after {context} contains readiness warnings/failures")


def assert_workspace_strict_failure_json(
    raw: str,
    *,
    returncode: int,
    context: str,
    cmd: list[str],
) -> None:
    if returncode != 1:
        raise SystemExit(f"workspace strict JSON after {context} expected exit code 1, got {returncode}")
    assert_workspace_json(raw, context=context, cmd=cmd)
    payload = json.loads(raw)
    has_strict_issue = any(
        isinstance(action, dict) and action.get("level") in ("warn", "fail")
        for action in payload.get("nextActions", [])
    )
    if not has_strict_issue:
        raise SystemExit(f"workspace strict JSON after {context} is missing a strict readiness issue")


def assert_site_json(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"site JSON after {context} is not valid JSON: {error}") from error

    payload = assert_smoke_json_keys(
        payload,
        EXPECTED_SITE_PAYLOAD_KEYS,
        label="top-level",
        context=context,
        command_label="site JSON",
    )
    if payload.get("valid") is not True or payload.get("status") != "pass":
        raise SystemExit(f"site JSON after {context} expected pass-valid summary")
    if not isinstance(payload.get("filePath"), str) or not payload["filePath"]:
        raise SystemExit(f"site JSON after {context} filePath is missing")

    site = assert_smoke_json_keys(
        payload.get("site"),
        EXPECTED_SITE_PROFILE_KEYS,
        label="site",
        context=context,
        command_label="site JSON",
    )
    expected_site = {
        "id": "sample-korean-saas",
        "name": "Korean SaaS marketing site",
        "liveUrl": "https://example.com",
        "repoUrl": "https://github.com/acme/korean-saas-site",
        "localPath": "/Users/you/dev/korean-saas-site",
        "deployProvider": "vercel",
        "cms": "sanity",
        "database": "none",
    }
    for key, expected in expected_site.items():
        if site.get(key) != expected:
            raise SystemExit(f"site JSON after {context} site {key} differs from expected sample workspace")
    if site.get("pages") != ["/", "/pricing", "/signup", "/docs"]:
        raise SystemExit(f"site JSON after {context} pages differ from expected sample workspace")
    if site.get("viewports") != ["desktop", "tablet", "mobile"]:
        raise SystemExit(f"site JSON after {context} viewports differ from expected sample workspace")
    if not isinstance(site.get("userFlows"), list) or len(site["userFlows"]) != 2:
        raise SystemExit(f"site JSON after {context} userFlows differ from expected sample workspace")

    counts = assert_smoke_json_keys(
        payload.get("counts"),
        EXPECTED_SITE_COUNTS_KEYS,
        label="counts",
        context=context,
        command_label="site JSON",
    )
    expected_counts = {
        "pages": 4,
        "userFlows": 2,
        "viewports": 3,
        "auditCategories": 9,
        "auditFindings": 3,
        "refactorTasks": 1,
        "requiredMcp": 3,
        "optionalMcp": 6,
        "unavailableMcp": 0,
    }
    for key, expected in expected_counts.items():
        if counts.get(key) != expected:
            raise SystemExit(f"site JSON after {context} count {key} differs from expected sample workspace")

    if payload.get("requiredMcp") != ["github", "browser", "deploy"]:
        raise SystemExit(f"site JSON after {context} requiredMcp differs from expected sample workspace")

    top_tasks = payload.get("topTasks")
    if not isinstance(top_tasks, list) or len(top_tasks) != 1:
        raise SystemExit(f"site JSON after {context} topTasks must contain one sample task")
    top_task = assert_smoke_json_keys(
        top_tasks[0],
        EXPECTED_SITE_TOP_TASK_KEYS,
        label="topTasks entry",
        context=context,
        command_label="site JSON",
    )
    if top_task.get("title") != "Clarify homepage CTA hierarchy" or top_task.get("priority") != "p1":
        raise SystemExit(f"site JSON after {context} top task differs from expected sample workspace")
    if top_task.get("pages") != ["/"]:
        raise SystemExit(f"site JSON after {context} top task pages differ from expected sample workspace")

    issues = payload.get("issues")
    if not isinstance(issues, list) or len(issues) != 1:
        raise SystemExit(f"site JSON after {context} issues must contain one pass issue")
    issue = assert_smoke_json_keys(
        issues[0],
        EXPECTED_SITE_ISSUE_KEYS,
        label="issues entry",
        context=context,
        command_label="site JSON",
    )
    if issue.get("level") != "pass" or issue.get("id") != "workspace-ready":
        raise SystemExit(f"site JSON after {context} pass issue differs from expected workspace-ready issue")


def assert_site_sample_json(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"site sample JSON after {context} is not valid JSON: {error}") from error

    payload = assert_smoke_json_keys(
        payload,
        EXPECTED_SITE_SAMPLE_KEYS,
        label="top-level",
        context=context,
        command_label="site sample JSON",
    )
    if payload.get("version") != 1:
        raise SystemExit(f"site sample JSON after {context} expected workspace version 1")
    if not isinstance(payload.get("updatedAt"), str) or not payload["updatedAt"]:
        raise SystemExit(f"site sample JSON after {context} updatedAt is missing")

    profile = assert_smoke_json_keys(
        payload.get("siteProfile"),
        EXPECTED_SITE_SAMPLE_PROFILE_KEYS,
        label="siteProfile",
        context=context,
        command_label="site sample JSON",
    )
    expected_profile = {
        "id": "sample-korean-saas",
        "name": "Korean SaaS marketing site",
        "liveUrl": "https://example.com",
        "repoUrl": "https://github.com/acme/korean-saas-site",
        "localPath": "/Users/you/dev/korean-saas-site",
        "figmaUrl": "https://figma.com/file/example",
        "deployProvider": "vercel",
        "sentryProject": "acme/korean-saas-web",
        "cms": "sanity",
        "database": "none",
    }
    for key, expected in expected_profile.items():
        if profile.get(key) != expected:
            raise SystemExit(f"site sample JSON after {context} profile {key} differs from expected sample workspace")
    if profile.get("pages") != ["/", "/pricing", "/signup", "/docs"]:
        raise SystemExit(f"site sample JSON after {context} pages differ from expected sample workspace")
    if profile.get("viewports") != ["desktop", "tablet", "mobile"]:
        raise SystemExit(f"site sample JSON after {context} viewports differ from expected sample workspace")
    if not isinstance(profile.get("brandNotes"), str) or "Pretendard" not in profile["brandNotes"]:
        raise SystemExit(f"site sample JSON after {context} brand notes must remain descriptive")

    checklist = payload.get("auditChecklist")
    if not isinstance(checklist, dict) or len(checklist) != 9:
        raise SystemExit(f"site sample JSON after {context} auditChecklist must contain all nine audit categories")
    if checklist.get("visual-design", {}).get("status") != "in-progress":
        raise SystemExit(f"site sample JSON after {context} visual-design status differs from expected sample workspace")

    readiness = payload.get("mcpReadiness")
    if not isinstance(readiness, dict) or readiness.get("github") != "required" or readiness.get("browser") != "required":
        raise SystemExit(f"site sample JSON after {context} required MCP readiness differs from expected sample workspace")

    tasks = payload.get("refactorTasks")
    if not isinstance(tasks, list) or len(tasks) != 1:
        raise SystemExit(f"site sample JSON after {context} expected one sample refactor task")
    task = assert_smoke_json_keys(
        tasks[0],
        EXPECTED_SITE_SAMPLE_TASK_KEYS,
        label="refactorTasks entry",
        context=context,
        command_label="site sample JSON",
    )
    if task.get("title") != "Clarify homepage CTA hierarchy" or task.get("priority") != "p1":
        raise SystemExit(f"site sample JSON after {context} task differs from expected sample workspace")
    if "browser" not in task.get("recommendedMcp", []):
        raise SystemExit(f"site sample JSON after {context} task should recommend browser MCP")

    if not isinstance(payload.get("reportNotes"), str) or "target website repo" not in payload["reportNotes"]:
        raise SystemExit(f"site sample JSON after {context} reportNotes must preserve target repo boundary")


def assert_site_tasks_json(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"site tasks JSON after {context} is not valid JSON: {error}") from error

    payload = assert_smoke_json_keys(
        payload,
        EXPECTED_SITE_SAMPLE_KEYS,
        label="top-level",
        context=context,
        command_label="site tasks JSON",
    )
    profile = assert_smoke_json_keys(
        payload.get("siteProfile"),
        EXPECTED_SITE_SAMPLE_PROFILE_KEYS,
        label="siteProfile",
        context=context,
        command_label="site tasks JSON",
    )
    if profile.get("name") != "Korean SaaS marketing site":
        raise SystemExit(f"site tasks JSON after {context} profile differs from expected sample workspace")

    tasks = payload.get("refactorTasks")
    if not isinstance(tasks, list) or len(tasks) != 3:
        raise SystemExit(f"site tasks JSON after {context} expected three refactor tasks after generation")
    task_ids = [task.get("id") for task in tasks if isinstance(task, dict)]
    if task_ids != ["task-homepage-cta", "task-accessibility", "task-content-quality"]:
        raise SystemExit(f"site tasks JSON after {context} task ids differ from expected generated starter tasks")

    accessibility = assert_smoke_json_keys(
        tasks[1],
        EXPECTED_SITE_SAMPLE_TASK_KEYS,
        label="generated accessibility task",
        context=context,
        command_label="site tasks JSON",
    )
    if accessibility.get("priority") != "p0" or accessibility.get("impact") != "high":
        raise SystemExit(f"site tasks JSON after {context} accessibility task priority/impact differs from expected generated task")
    if "chromeDevtools" not in accessibility.get("recommendedMcp", []):
        raise SystemExit(f"site tasks JSON after {context} accessibility task should recommend Chrome DevTools")
    if "target website repo" not in accessibility.get("codexPrompt", ""):
        raise SystemExit(f"site tasks JSON after {context} generated Codex prompt must preserve target repo boundary")

    content = assert_smoke_json_keys(
        tasks[2],
        EXPECTED_SITE_SAMPLE_TASK_KEYS,
        label="generated content task",
        context=context,
        command_label="site tasks JSON",
    )
    if content.get("category") != "content-quality" or content.get("priority") != "p1":
        raise SystemExit(f"site tasks JSON after {context} content task differs from expected generated task")


def assert_site_prompt_markdown(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    stripped = raw.lstrip()
    if stripped.startswith("{") or stripped.startswith("["):
        raise SystemExit(f"site prompt markdown after {context} looks like JSON output")
    assert_contains_fragments(
        raw,
        (
            "# Codex implementation prompt",
            "Site profile:",
            "Korean SaaS marketing site",
            "Selected task:",
            "Task ID: task-homepage-cta",
            "Clarify homepage CTA hierarchy",
            "Work in the target website repository, not in this design-ai repository.",
            "Verify desktop, tablet, and mobile layouts.",
            "lint/typecheck/build/test",
        ),
        context=context,
        label="site prompt markdown",
    )
    forbidden_fragments = (
        "# Website improvement prompt bundle",
        "## codex-repo-intake",
        "## claude-competitor",
    )
    for fragment in forbidden_fragments:
        if fragment in raw:
            raise SystemExit(f"site prompt markdown after {context} unexpectedly contains bundle fragment: {fragment}")


def assert_site_prompt_templates_json(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"site prompt templates JSON after {context} is not valid JSON: {error}") from error

    payload = assert_smoke_json_keys(
        payload,
        EXPECTED_SITE_PROMPT_TEMPLATE_PAYLOAD_KEYS,
        label="top-level",
        context=context,
        command_label="site prompt templates JSON",
    )
    if payload.get("count") != 8:
        raise SystemExit(f"site prompt templates JSON after {context} expected eight templates")

    templates = payload.get("templates")
    if not isinstance(templates, list) or len(templates) != 8:
        raise SystemExit(f"site prompt templates JSON after {context} templates must contain eight entries")
    ids = []
    for template in templates:
        item = assert_smoke_json_keys(
            template,
            EXPECTED_SITE_PROMPT_TEMPLATE_KEYS,
            label="templates entry",
            context=context,
            command_label="site prompt templates JSON",
        )
        ids.append(item.get("id"))
        if not isinstance(item.get("description"), str) or not item["description"]:
            raise SystemExit(f"site prompt templates JSON after {context} template description is missing")
        if type(item.get("taskSelectable")) is not bool:
            raise SystemExit(f"site prompt templates JSON after {context} taskSelectable must be boolean")

    if ids != EXPECTED_SITE_PROMPT_TEMPLATE_IDS:
        raise SystemExit(f"site prompt templates JSON after {context} template ids changed")
    implementation = templates[1]
    if implementation.get("id") != "codex-implementation" or implementation.get("taskSelectable") is not True:
        raise SystemExit(f"site prompt templates JSON after {context} codex-implementation must remain task selectable")
    if implementation.get("agent") != "codex":
        raise SystemExit(f"site prompt templates JSON after {context} codex-implementation agent changed")


def assert_site_mcp_check_json(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"site mcp-check JSON after {context} is not valid JSON: {error}") from error

    payload = assert_smoke_json_keys(
        payload,
        EXPECTED_SITE_MCP_CHECK_PAYLOAD_KEYS,
        label="top-level",
        context=context,
        command_label="site mcp-check JSON",
    )
    if payload.get("status") != "pass" or payload.get("workspaceStatus") != "pass":
        raise SystemExit(f"site mcp-check JSON after {context} should pass for the sample workspace")

    site = assert_smoke_json_keys(
        payload.get("site"),
        EXPECTED_SITE_MCP_CHECK_SITE_KEYS,
        label="site",
        context=context,
        command_label="site mcp-check JSON",
    )
    if site.get("name") != "Korean SaaS marketing site" or site.get("liveUrl") != "https://example.com":
        raise SystemExit(f"site mcp-check JSON after {context} sample site identity changed")

    counts = assert_smoke_json_keys(
        payload.get("counts"),
        EXPECTED_SITE_MCP_CHECK_COUNTS_KEYS,
        label="counts",
        context=context,
        command_label="site mcp-check JSON",
    )
    expected_counts = {
        "total": 10,
        "required": 3,
        "optional": 6,
        "ready": 9,
        "missing": 0,
        "unused": 1,
        "unavailable": 0,
        "taskGaps": 0,
    }
    for key, value in expected_counts.items():
        if counts.get(key) != value:
            raise SystemExit(f"site mcp-check JSON after {context} count {key} changed")

    items = payload.get("items")
    if not isinstance(items, list) or len(items) != 10:
        raise SystemExit(f"site mcp-check JSON after {context} should include ten MCP items")
    item_keys = []
    for item in items:
        checked = assert_smoke_json_keys(
            item,
            EXPECTED_SITE_MCP_CHECK_ITEM_KEYS,
            label="items entry",
            context=context,
            command_label="site mcp-check JSON",
        )
        item_keys.append(checked.get("key"))
        if checked.get("level") != "pass":
            raise SystemExit(f"site mcp-check JSON after {context} sample item should pass: {checked.get('key')}")
        if not isinstance(checked.get("evidence"), list) or not isinstance(checked.get("actions"), list):
            raise SystemExit(f"site mcp-check JSON after {context} item evidence/actions must be arrays")

    if item_keys != [key for key, _label in (
        ("github", "GitHub"),
        ("figma", "Figma"),
        ("browser", "Browser/Playwright"),
        ("chromeDevtools", "Chrome DevTools"),
        ("deploy", "Deploy"),
        ("sentry", "Sentry"),
        ("database", "Database"),
        ("cms", "CMS"),
        ("collaboration", "Collaboration"),
        ("research", "Research"),
    )]:
        raise SystemExit(f"site mcp-check JSON after {context} MCP item order changed")

    if not isinstance(payload.get("taskGaps"), list) or payload["taskGaps"]:
        raise SystemExit(f"site mcp-check JSON after {context} should not report sample task gaps")
    if not isinstance(payload.get("workspaceIssues"), list) or payload["workspaceIssues"]:
        raise SystemExit(f"site mcp-check JSON after {context} should not report sample workspace issues")
    if not isinstance(payload.get("nextActions"), list):
        raise SystemExit(f"site mcp-check JSON after {context} nextActions must be an array")


def assert_site_mcp_plan_markdown(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    stripped = raw.lstrip()
    if stripped.startswith("{") or stripped.startswith("["):
        raise SystemExit(f"site mcp-plan markdown after {context} looks like JSON output")

    assert_contains_fragments(
        raw,
        (
            "# Website improvement MCP action plan: Korean SaaS marketing site",
            "## Readiness Matrix",
            "| GitHub | required | ready | pass |",
            "## Blocking Items",
            "No blocking readiness issues.",
            "## Task/MCP Alignment",
            "task-homepage-cta",
            "## Execution Sequence",
            "design-ai site <workspace.json> --mcp-check --strict --json",
            "does not call external MCPs, mutate the target website repo",
        ),
        context=context,
        label="site mcp-plan markdown",
    )


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


def normalize_lifecycle_path(value: str) -> str:
    return value.replace("\\", "/").rstrip("/")


def assert_lifecycle_context(
    value: object,
    *,
    prefix: str,
    context: str,
    command_label: str,
) -> dict[str, str]:
    lifecycle_context = assert_lifecycle_json_keys(
        value,
        ["sourceRoot", "claudeHome", "prefix"],
        label="context",
        context=context,
        command_label=command_label,
    )
    source_root = lifecycle_context.get("sourceRoot")
    if not isinstance(source_root, str) or not source_root:
        raise SystemExit(f"{command_label} after {context} sourceRoot is missing")
    claude_home = lifecycle_context.get("claudeHome")
    if not isinstance(claude_home, str) or not claude_home:
        raise SystemExit(f"{command_label} after {context} claudeHome is missing")
    if lifecycle_context.get("prefix") != prefix:
        raise SystemExit(f"{command_label} after {context} prefix differs from expected {prefix}")

    normalized_source_root = normalize_lifecycle_path(source_root)
    normalized_claude_home = normalize_lifecycle_path(claude_home)
    if normalized_source_root == normalized_claude_home:
        raise SystemExit(f"{command_label} after {context} sourceRoot and claudeHome must differ")
    if normalized_source_root.startswith(f"{normalized_claude_home}/"):
        raise SystemExit(f"{command_label} after {context} sourceRoot is inside claudeHome")
    if normalized_claude_home.startswith(f"{normalized_source_root}/"):
        raise SystemExit(f"{command_label} after {context} claudeHome is inside sourceRoot")

    return {
        "sourceRoot": source_root,
        "claudeHome": claude_home,
        "prefix": prefix,
    }


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

    assert_lifecycle_context(
        payload.get("context"),
        prefix=prefix,
        context=context,
        command_label="install JSON",
    )

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

    assert_lifecycle_context(
        payload.get("context"),
        prefix=prefix,
        context=context,
        command_label="update dry-run JSON",
    )

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
    if type(git_pull.get("sourceIsGitClone")) is not bool:
        raise SystemExit(f"update dry-run JSON after {context} sourceIsGitClone is not boolean")
    if type(git_pull.get("wouldRun")) is not bool:
        raise SystemExit(f"update dry-run JSON after {context} gitPull wouldRun is not boolean")
    if git_pull.get("wouldRun") != git_pull.get("sourceIsGitClone"):
        raise SystemExit(f"update dry-run JSON after {context} gitPull wouldRun does not match clone state")
    expected_git_command = ["git", "pull", "--ff-only"] if git_pull.get("wouldRun") else []
    if git_pull.get("command") != expected_git_command:
        raise SystemExit(f"update dry-run JSON after {context} gitPull command differs from clone state")
    expected_git_reason = "source is a git clone" if git_pull.get("sourceIsGitClone") else "source is not a git clone"
    if git_pull.get("reason") != expected_git_reason:
        raise SystemExit(f"update dry-run JSON after {context} gitPull reason differs from clone state")

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
    if install.get("reason") != "install.sh is available":
        raise SystemExit(f"update dry-run JSON after {context} install reason differs from expected install readiness")

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
    if re.search(r"\b(?:Skills|Agents|Slash commands):\s+0 installed\b", raw) or "target dir does not exist" in raw:
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

    status_context = assert_lifecycle_context(
        payload.get("context"),
        prefix=prefix,
        context=context,
        command_label="status JSON",
    )

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
        if section.get("label") != EXPECTED_STATUS_SECTION_LABELS[kind]:
            raise SystemExit(f"status JSON after {context} section label differs for {kind}")
        target_dir = section.get("targetDir")
        if not isinstance(target_dir, str) or not target_dir:
            raise SystemExit(f"status JSON after {context} targetDir is missing for {kind}")
        normalized_claude_home = normalize_lifecycle_path(status_context["claudeHome"])
        normalized_target_dir = normalize_lifecycle_path(target_dir)
        if (
            normalized_target_dir == normalized_claude_home
            or not normalized_target_dir.startswith(f"{normalized_claude_home}/")
        ):
            raise SystemExit(f"status JSON after {context} targetDir is outside claudeHome for {kind}")
        if normalized_target_dir.rsplit("/", 1)[-1] != EXPECTED_STATUS_TARGET_DIR_BASENAMES[kind]:
            raise SystemExit(f"status JSON after {context} targetDir basename differs for {kind}")
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

    assert_lifecycle_context(
        payload.get("context"),
        prefix=prefix,
        context=context,
        command_label="uninstall JSON",
    )

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
        lambda: assert_list_catalog_json(json.dumps([]), kind="skills", context=context, cmd=[*list_cmd, "--json"]),
        expected="top-level is not an object",
        scope="smoke assertions",
    )
    reordered_list_catalog = json.loads(passing_list_catalog_json("skills"))
    reordered_list_catalog = {
        "version": reordered_list_catalog["version"],
        "name": reordered_list_catalog["name"],
        "kind": reordered_list_catalog["kind"],
        "sections": reordered_list_catalog["sections"],
    }
    expect_self_test_failure(
        lambda: assert_list_catalog_json(
            json.dumps(reordered_list_catalog),
            kind="skills",
            context=context,
            cmd=[*list_cmd, "--json"],
        ),
        expected="top-level keys changed",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_list_catalog_json(
            passing_list_catalog_json("skills").replace('"count": 20', '"count": 19'),
            kind="skills",
            context=context,
            cmd=[*list_cmd, "--json"],
        ),
        expected="section count differs",
        scope="smoke assertions",
    )
    bool_list_count_catalog = json.loads(passing_list_catalog_json("skills"))
    bool_list_count_catalog["sections"][0]["count"] = True
    expect_self_test_failure(
        lambda: assert_list_catalog_json(
            json.dumps(bool_list_count_catalog),
            kind="skills",
            context=context,
            cmd=[*list_cmd, "--json"],
        ),
        expected="section count is invalid",
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
    missing_item_description_catalog = json.loads(passing_list_catalog_json("skills"))
    del missing_item_description_catalog["sections"][0]["items"][0]["description"]
    expect_self_test_failure(
        lambda: assert_list_catalog_json(
            json.dumps(missing_item_description_catalog),
            kind="skills",
            context=context,
            cmd=[*list_cmd, "--json"],
        ),
        expected="item keys changed",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_list_catalog_output(
            passing_list_catalog_output("skills").replace("skills (20)", "skills (19)"),
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
    route_reordered_top_level = json.loads(passing_route_json())
    route_reordered_top_level = {
        "version": route_reordered_top_level["version"],
        "brief": route_reordered_top_level["brief"],
        "routes": route_reordered_top_level["routes"],
    }
    expect_self_test_failure(
        lambda: assert_route_json_component_spec(json.dumps(route_reordered_top_level), context=context, cmd=route_cmd),
        expected="top-level keys changed",
        scope="smoke assertions",
    )
    route_missing_route_key = json.loads(passing_route_json())
    del route_missing_route_key["routes"][0]["keywords"]
    expect_self_test_failure(
        lambda: assert_route_json_component_spec(json.dumps(route_missing_route_key), context=context, cmd=route_cmd),
        expected="route keys changed",
        scope="smoke assertions",
    )
    route_extra_result = json.loads(passing_route_json())
    route_extra_result["routes"].append(dict(route_extra_result["routes"][0]))
    expect_self_test_failure(
        lambda: assert_route_json_component_spec(json.dumps(route_extra_result), context=context, cmd=route_cmd),
        expected="exactly one route",
        scope="smoke assertions",
    )
    route_bool_score = json.loads(passing_route_json())
    route_bool_score["routes"][0]["score"] = True
    expect_self_test_failure(
        lambda: assert_route_json_component_spec(json.dumps(route_bool_score), context=context, cmd=route_cmd),
        expected="score is lower",
        scope="smoke assertions",
    )
    route_bool_score_breakdown = json.loads(passing_route_json())
    route_bool_score_breakdown["routes"][0]["explanation"]["scoreBreakdown"][0]["value"] = True
    expect_self_test_failure(
        lambda: assert_route_json_component_spec(json.dumps(route_bool_score_breakdown), context=context, cmd=route_cmd),
        expected="scoreBreakdown value is invalid",
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
        expected="keys changed",
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
    route_catalog_reordered_top_level = json.loads(passing_route_catalog_json())
    route_catalog_reordered_top_level = {
        "routes": route_catalog_reordered_top_level["routes"],
        "version": route_catalog_reordered_top_level["version"],
    }
    expect_self_test_failure(
        lambda: assert_route_catalog_json(json.dumps(route_catalog_reordered_top_level), context=context, cmd=route_catalog_cmd),
        expected="top-level keys changed",
        scope="smoke assertions",
    )
    route_catalog_missing_route_key = json.loads(passing_route_catalog_json())
    del route_catalog_missing_route_key["routes"][0]["keywords"]
    expect_self_test_failure(
        lambda: assert_route_catalog_json(json.dumps(route_catalog_missing_route_key), context=context, cmd=route_catalog_cmd),
        expected="keys changed",
        scope="smoke assertions",
    )
    route_catalog_bool_score = json.loads(passing_route_catalog_json())
    route_catalog_bool_score["routes"][0]["score"] = True
    expect_self_test_failure(
        lambda: assert_route_catalog_json(json.dumps(route_catalog_bool_score), context=context, cmd=route_catalog_cmd),
        expected="score differs",
        scope="smoke assertions",
    )
    route_catalog_bool_coverage = json.loads(passing_route_catalog_json())
    route_catalog_bool_coverage["routes"][0]["explanation"]["referenceCoverage"]["knowledge"]["available"] = True
    expect_self_test_failure(
        lambda: assert_route_catalog_json(json.dumps(route_catalog_bool_coverage), context=context, cmd=route_catalog_cmd),
        expected="reference coverage count is invalid",
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
        expected="filesToRead differs",
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
    prompt_reordered_top_level = json.loads(passing_prompt_json())
    prompt_reordered_top_level = {
        "version": prompt_reordered_top_level["version"],
        "brief": prompt_reordered_top_level["brief"],
        "route": prompt_reordered_top_level["route"],
        "slashCommand": prompt_reordered_top_level["slashCommand"],
        "referenceExamples": prompt_reordered_top_level["referenceExamples"],
        "filesToRead": prompt_reordered_top_level["filesToRead"],
        "checklist": prompt_reordered_top_level["checklist"],
        "qualityCommand": prompt_reordered_top_level["qualityCommand"],
        "prompt": prompt_reordered_top_level["prompt"],
    }
    expect_self_test_failure(
        lambda: assert_prompt_json_component_spec(json.dumps(prompt_reordered_top_level), context=context, cmd=prompt_cmd),
        expected="top-level keys changed",
        scope="smoke assertions",
    )
    prompt_missing_route_key = json.loads(passing_prompt_json())
    del prompt_missing_route_key["route"]["keywords"]
    expect_self_test_failure(
        lambda: assert_prompt_json_component_spec(json.dumps(prompt_missing_route_key), context=context, cmd=prompt_cmd),
        expected="route keys changed",
        scope="smoke assertions",
    )
    prompt_bool_route_score = json.loads(passing_prompt_json())
    prompt_bool_route_score["route"]["score"] = True
    expect_self_test_failure(
        lambda: assert_prompt_json_component_spec(json.dumps(prompt_bool_route_score), context=context, cmd=prompt_cmd),
        expected="route score is invalid",
        scope="smoke assertions",
    )
    prompt_bool_example_score = json.loads(passing_prompt_json())
    prompt_bool_example_score["referenceExamples"][0]["score"] = True
    expect_self_test_failure(
        lambda: assert_prompt_json_component_spec(json.dumps(prompt_bool_example_score), context=context, cmd=prompt_cmd),
        expected="reference example score is invalid",
        scope="smoke assertions",
    )
    prompt_missing_example_preview = json.loads(passing_prompt_json())
    del prompt_missing_example_preview["referenceExamples"][0]["preview"]
    expect_self_test_failure(
        lambda: assert_prompt_json_component_spec(json.dumps(prompt_missing_example_preview), context=context, cmd=prompt_cmd),
        expected="reference example keys changed",
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
        expected="context file order differs",
        scope="smoke assertions",
    )
    pack_no_warning = json.loads(passing_pack_json())
    pack_no_warning["warnings"] = []
    expect_self_test_failure(
        lambda: assert_pack_json_component_spec(json.dumps(pack_no_warning), context=context, cmd=pack_cmd),
        expected="warnings is not a non-empty string list",
        scope="smoke assertions",
    )
    pack_missing_summary_key = json.loads(passing_pack_json())
    del pack_missing_summary_key["summary"]["usedRatio"]
    expect_self_test_failure(
        lambda: assert_pack_json_component_spec(json.dumps(pack_missing_summary_key), context=context, cmd=pack_cmd),
        expected="summary keys changed",
        scope="smoke assertions",
    )
    pack_bool_used_bytes = json.loads(passing_pack_json())
    pack_bool_used_bytes["usedBytes"] = True
    expect_self_test_failure(
        lambda: assert_pack_json_component_spec(json.dumps(pack_bool_used_bytes), context=context, cmd=pack_cmd),
        expected="usedBytes is outside expected budget",
        scope="smoke assertions",
    )
    pack_bool_summary_total = json.loads(passing_pack_json())
    pack_bool_summary_total["summary"]["totalFiles"] = True
    expect_self_test_failure(
        lambda: assert_pack_json_component_spec(json.dumps(pack_bool_summary_total), context=context, cmd=pack_cmd),
        expected="summary totalFiles is invalid",
        scope="smoke assertions",
    )
    pack_bool_file_included_bytes = json.loads(passing_pack_json())
    pack_bool_file_included_bytes["files"][0]["includedBytes"] = True
    expect_self_test_failure(
        lambda: assert_pack_json_component_spec(json.dumps(pack_bool_file_included_bytes), context=context, cmd=pack_cmd),
        expected="invalid includedBytes",
        scope="smoke assertions",
    )
    pack_missing_file_content = json.loads(passing_pack_json())
    del pack_missing_file_content["files"][0]["content"]
    expect_self_test_failure(
        lambda: assert_pack_json_component_spec(json.dumps(pack_missing_file_content), context=context, cmd=pack_cmd),
        expected="file entry keys changed",
        scope="smoke assertions",
    )
    pack_missing_budget_warning = json.loads(passing_pack_json())
    pack_missing_budget_warning["warnings"] = [
        warning
        for warning in pack_missing_budget_warning["warnings"]
        if f"{EXPECTED_PACK_MAX_BYTES}/{EXPECTED_PACK_MAX_BYTES}" not in warning
    ]
    expect_self_test_failure(
        lambda: assert_pack_json_component_spec(json.dumps(pack_missing_budget_warning), context=context, cmd=pack_cmd),
        expected="context budget exhaustion",
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
    check_reordered_top_level = json.loads(passing_check_examples_json())
    check_reordered_top_level = {
        "routeId": check_reordered_top_level["routeId"],
        "mode": check_reordered_top_level["mode"],
        "query": check_reordered_top_level["query"],
        "limit": check_reordered_top_level["limit"],
        "status": check_reordered_top_level["status"],
        "total": check_reordered_top_level["total"],
        "passed": check_reordered_top_level["passed"],
        "warned": check_reordered_top_level["warned"],
        "failed": check_reordered_top_level["failed"],
        "examples": check_reordered_top_level["examples"],
    }
    expect_self_test_failure(
        lambda: assert_check_examples_json_component_spec(
            json.dumps(check_reordered_top_level),
            context=context,
            cmd=check_examples_cmd,
        ),
        expected="top-level after smoke assertion self-test keys changed",
        scope="smoke assertions",
    )
    check_bool_total = json.loads(passing_check_examples_json())
    check_bool_total["total"] = True
    expect_self_test_failure(
        lambda: assert_check_examples_json_component_spec(json.dumps(check_bool_total), context=context, cmd=check_examples_cmd),
        expected="total is invalid",
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
    check_missing_entry_key = json.loads(passing_check_examples_json())
    del check_missing_entry_key["examples"][0]["report"]
    expect_self_test_failure(
        lambda: assert_check_examples_json_component_spec(json.dumps(check_missing_entry_key), context=context, cmd=check_examples_cmd),
        expected="example entry after smoke assertion self-test keys changed",
        scope="smoke assertions",
    )
    check_missing_preview = json.loads(passing_check_examples_json())
    del check_missing_preview["examples"][0]["example"]["preview"]
    expect_self_test_failure(
        lambda: assert_check_examples_json_component_spec(json.dumps(check_missing_preview), context=context, cmd=check_examples_cmd),
        expected="example metadata after smoke assertion self-test keys changed",
        scope="smoke assertions",
    )
    check_bool_example_score = json.loads(passing_check_examples_json())
    check_bool_example_score["examples"][0]["example"]["score"] = True
    expect_self_test_failure(
        lambda: assert_check_examples_json_component_spec(json.dumps(check_bool_example_score), context=context, cmd=check_examples_cmd),
        expected="example score is invalid",
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
    artifact_missing_report_key = json.loads(passing_check_artifact_json())
    del artifact_missing_report_key["score"]
    expect_self_test_failure(
        lambda: assert_check_artifact_json_component_spec(
            json.dumps(artifact_missing_report_key),
            context=context,
            cmd=check_artifact_cmd,
        ),
        expected="report after smoke assertion self-test keys changed",
        scope="smoke assertions",
    )
    artifact_bool_passes = json.loads(passing_check_artifact_json())
    artifact_bool_passes["passes"] = True
    expect_self_test_failure(
        lambda: assert_check_artifact_json_component_spec(json.dumps(artifact_bool_passes), context=context, cmd=check_artifact_cmd),
        expected="report passes is invalid",
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
    artifact_extra_result = json.loads(passing_check_artifact_json())
    artifact_extra_result["results"].append(dict(artifact_extra_result["results"][-1]))
    expect_self_test_failure(
        lambda: assert_check_artifact_json_component_spec(json.dumps(artifact_extra_result), context=context, cmd=check_artifact_cmd),
        expected="result count differs",
        scope="smoke assertions",
    )
    artifact_reordered_result = json.loads(passing_check_artifact_json())
    artifact_reordered_result["results"][0], artifact_reordered_result["results"][1] = (
        artifact_reordered_result["results"][1],
        artifact_reordered_result["results"][0],
    )
    expect_self_test_failure(
        lambda: assert_check_artifact_json_component_spec(json.dumps(artifact_reordered_result), context=context, cmd=check_artifact_cmd),
        expected="result order differs",
        scope="smoke assertions",
    )
    artifact_missing_result_key = json.loads(passing_check_artifact_json())
    del artifact_missing_result_key["results"][0]["message"]
    expect_self_test_failure(
        lambda: assert_check_artifact_json_component_spec(json.dumps(artifact_missing_result_key), context=context, cmd=check_artifact_cmd),
        expected="result entry after smoke assertion self-test keys changed",
        scope="smoke assertions",
    )
    artifact_invalid_passed = json.loads(passing_check_artifact_json())
    artifact_invalid_passed["results"][0]["passed"] = "true"
    expect_self_test_failure(
        lambda: assert_check_artifact_json_component_spec(json.dumps(artifact_invalid_passed), context=context, cmd=check_artifact_cmd),
        expected="result passed flag is invalid",
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
        expected="top-level",
        scope="smoke assertions",
    )
    missing_aliases_object_catalog = {
        "usage": EXPECTED_HELP_USAGE,
        "topics": [],
        "aliases": [],
    }
    expect_self_test_failure(
        lambda: parse_help_topics(
            json.dumps(missing_aliases_object_catalog),
            context=context,
            cmd=help_cmd,
        ),
        expected="aliases object",
        scope="smoke assertions",
    )
    reordered_help_catalog = json.loads(passing_help_catalog_json())
    reordered_help_catalog = {
        "topics": reordered_help_catalog["topics"],
        "usage": reordered_help_catalog["usage"],
        "aliases": reordered_help_catalog["aliases"],
    }
    expect_self_test_failure(
        lambda: parse_help_topics(
            json.dumps(reordered_help_catalog),
            context=context,
            cmd=help_cmd,
        ),
        expected="top-level",
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
        expected="usage differs for topic install",
        scope="smoke assertions",
    )
    invalid_topic_key_catalog = json.loads(passing_help_catalog_json())
    topic_entry = invalid_topic_key_catalog["topics"][0]
    invalid_topic_key_catalog["topics"][0] = {
        "usage": topic_entry["usage"],
        "topic": topic_entry["topic"],
        "description": topic_entry["description"],
        "aliases": topic_entry["aliases"],
    }
    expect_self_test_failure(
        lambda: parse_help_topics(
            json.dumps(invalid_topic_key_catalog),
            context=context,
            cmd=help_cmd,
        ),
        expected="topic entry",
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
    alias_order_catalog = json.loads(passing_help_catalog_json())
    alias_items = list(alias_order_catalog["aliases"].items())
    alias_items[0], alias_items[1] = alias_items[1], alias_items[0]
    alias_order_catalog["aliases"] = dict(alias_items)
    expect_self_test_failure(
        lambda: parse_help_topics(
            json.dumps(alias_order_catalog),
            context=context,
            cmd=help_cmd,
        ),
        expected="alias order differs",
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
        expected="aliases differ for topic install",
        scope="smoke assertions",
    )
    alias_mapping_catalog = json.loads(passing_help_catalog_json())
    alias_mapping_catalog["topics"][1]["aliases"] = list(reversed(alias_mapping_catalog["topics"][1]["aliases"]))
    expect_self_test_failure(
        lambda: parse_help_topics(
            json.dumps(alias_mapping_catalog),
            context=context,
            cmd=help_cmd,
        ),
        expected="aliases differ for topic update",
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
        lambda: assert_version_json(json.dumps([]), context=context, cmd=[*version_cmd, "--json"]),
        expected="top-level is not an object",
        scope="smoke assertions",
    )
    reordered_version_payload = json.loads(passing_version_json())
    reordered_version_payload = {
        "versions": reordered_version_payload["versions"],
        "context": reordered_version_payload["context"],
    }
    expect_self_test_failure(
        lambda: assert_version_json(
            json.dumps(reordered_version_payload),
            context=context,
            cmd=[*version_cmd, "--json"],
        ),
        expected="top-level keys changed",
        scope="smoke assertions",
    )
    missing_version_context_key = json.loads(passing_version_json())
    missing_version_context_key["context"] = {}
    expect_self_test_failure(
        lambda: assert_version_json(
            json.dumps(missing_version_context_key),
            context=context,
            cmd=[*version_cmd, "--json"],
        ),
        expected="context keys changed",
        scope="smoke assertions",
    )
    reordered_versions_key_payload = json.loads(passing_version_json())
    versions_payload = reordered_versions_key_payload["versions"]
    reordered_versions_key_payload["versions"] = {
        "plugin": versions_payload["plugin"],
        "cli": versions_payload["cli"],
        "aligned": versions_payload["aligned"],
    }
    expect_self_test_failure(
        lambda: assert_version_json(
            json.dumps(reordered_versions_key_payload),
            context=context,
            cmd=[*version_cmd, "--json"],
        ),
        expected="versions keys changed",
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
            passing_version_json().replace('"plugin": "4.51.0"', '"plugin": "unknown"'),
            context=context,
            cmd=[*version_cmd, "--json"],
        ),
        expected="version differs from expected semver",
        scope="smoke assertions",
    )
    workspace_cmd = ["design-ai", "workspace", "--json"]
    assert_workspace_json(passing_workspace_json(), context=context, cmd=workspace_cmd)
    workspace_eval_payload = json.loads(passing_workspace_json())
    workspace_eval_payload["learningEval"] = {
        "source": "/tmp/learning-eval.json",
        "file": "/tmp/learning.json",
        "status": "pass",
        "caseCount": 1,
        "passed": 1,
        "warned": 0,
        "failed": 0,
        "generatedAt": "2026-05-22T00:00:02.000Z",
        "sourceProfile": {
            "file": "/tmp/learning.json",
            "exists": True,
            "entryCount": 1,
            "auditStatus": "pass",
            "category": "",
            "queryPresent": False,
            "limit": 6,
        },
        "profileExists": True,
        "profileEntryCount": 1,
        "auditSummary": {
            "status": "pass",
            "failures": 0,
            "warnings": 0,
        },
        "privacy": {
            "storesRawBriefText": False,
            "storesBriefHash": True,
            "exposesMatchedTokens": False,
        },
        "error": "",
        "freshness": {
            "status": "pass",
            "stale": False,
            "reason": "",
            "profileUpdatedAt": "",
            "checkpointGeneratedAt": "2026-05-22T00:00:02.000Z",
            "sourceProfileFile": "/tmp/learning.json",
            "sourceProfileEntryCount": 1,
        },
    }
    assert_workspace_json(json.dumps(workspace_eval_payload), context=context, cmd=workspace_cmd)
    workspace_usage_payload = json.loads(passing_workspace_json())
    workspace_usage_payload["learningUsage"] = {
        "file": "/tmp/learning.json",
        "usageFile": "/tmp/learning.usage.json",
        "exists": True,
        "profileExists": True,
        "profileFile": "/tmp/learning.json",
        "version": 1,
        "updatedAt": "2026-05-22T00:00:04.000Z",
        "eventCount": 1,
        "profileEntryCount": 1,
        "usedEntryCount": 1,
        "unusedEntryCount": 0,
        "staleSelectedEntryCount": 0,
        "commandCounts": {"prompt": 1},
        "routeCounts": {"component-spec": 1},
        "categoryCounts": {"accessibility": 1},
        "auditStatusCounts": {"pass": 1},
        "latestEvent": {
            "id": "learn-use-workspace-keyboard",
            "command": "prompt",
            "routeId": "component-spec",
            "category": "accessibility",
            "limit": 1,
            "selectedEntryIds": ["learn-workspace-keyboard"],
            "selectedCount": 1,
            "candidateCount": 1,
            "matchedCount": 1,
            "fallbackCount": 0,
            "queryTokenCount": 6,
            "auditStatus": "pass",
            "briefHash": "b20206b62f51bb23",
            "createdAt": "2026-05-22T00:00:04.000Z",
        },
        "privacy": {
            "storesRawBriefText": False,
            "storesBriefHash": True,
            "storesSelectedEntryIds": True,
        },
        "recommendations": [],
        "readiness": {
            "status": "pass",
            "reason": "",
            "profileFile": "/tmp/learning.json",
            "profileFileMatches": True,
            "staleSelectedEntryCount": 0,
        },
        "error": "",
    }
    assert_workspace_json(json.dumps(workspace_usage_payload), context=context, cmd=workspace_cmd)
    assert_workspace_strict_failure_json(
        passing_workspace_json(),
        returncode=1,
        context=context,
        cmd=["design-ai", "workspace", "--strict", "--json"],
    )
    assert_workspace_strict_success_json(
        passing_workspace_strict_clean_json(),
        returncode=0,
        context=context,
        cmd=["design-ai", "workspace", "--strict", "--json"],
    )
    expect_self_test_failure(
        lambda: assert_workspace_json("\x1b[31m{}", context=context, cmd=workspace_cmd),
        expected="ANSI escape",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_workspace_strict_failure_json(
            passing_workspace_json(),
            returncode=0,
            context=context,
            cmd=["design-ai", "workspace", "--strict", "--json"],
        ),
        expected="expected exit code 1",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_workspace_strict_failure_json(
            passing_workspace_strict_clean_json(),
            returncode=1,
            context=context,
            cmd=["design-ai", "workspace", "--strict", "--json"],
        ),
        expected="missing a strict readiness issue",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_workspace_strict_success_json(
            passing_workspace_json(),
            returncode=0,
            context=context,
            cmd=["design-ai", "workspace", "--strict", "--json"],
        ),
        expected="readiness warnings/failures",
        scope="smoke assertions",
    )
    reordered_workspace_payload = json.loads(passing_workspace_json())
    reordered_workspace_payload = {
        "git": reordered_workspace_payload["git"],
        "context": reordered_workspace_payload["context"],
        "repository": reordered_workspace_payload["repository"],
        "learning": reordered_workspace_payload["learning"],
        "learningUsage": reordered_workspace_payload["learningUsage"],
        "learningEval": reordered_workspace_payload["learningEval"],
        "release": reordered_workspace_payload["release"],
        "nextActions": reordered_workspace_payload["nextActions"],
    }
    expect_self_test_failure(
        lambda: assert_workspace_json(
            json.dumps(reordered_workspace_payload),
            context=context,
            cmd=workspace_cmd,
        ),
        expected="top-level keys changed",
        scope="smoke assertions",
    )
    stale_workspace_payload = json.loads(passing_workspace_json())
    stale_workspace_payload["repository"]["packageRepositoryUrl"] = "git+https://github.com/stale/design-ai.git"
    expect_self_test_failure(
        lambda: assert_workspace_json(
            json.dumps(stale_workspace_payload),
            context=context,
            cmd=workspace_cmd,
        ),
        expected="canonical value",
        scope="smoke assertions",
    )
    unaligned_workspace_payload = json.loads(passing_workspace_json())
    unaligned_workspace_payload["repository"]["metadataAligned"] = False
    expect_self_test_failure(
        lambda: assert_workspace_json(
            json.dumps(unaligned_workspace_payload),
            context=context,
            cmd=workspace_cmd,
        ),
        expected="metadata is not aligned",
        scope="smoke assertions",
    )
    missing_workspace_script_payload = json.loads(passing_workspace_json())
    missing_workspace_script_payload["release"]["available"].remove("ci:local")
    expect_self_test_failure(
        lambda: assert_workspace_json(
            json.dumps(missing_workspace_script_payload),
            context=context,
            cmd=workspace_cmd,
        ),
        expected="missing available script ci:local",
        scope="smoke assertions",
    )
    site_cmd = ["design-ai", "site", "--stdin", "--json"]
    assert_site_json(passing_site_json(), context=context, cmd=site_cmd)
    site_sample_cmd = ["design-ai", "site", "--sample"]
    assert_site_sample_json(passing_site_sample_json(), context=context, cmd=site_sample_cmd)
    site_tasks_cmd = ["design-ai", "site", "--stdin", "--tasks"]
    assert_site_tasks_json(passing_site_tasks_json(), context=context, cmd=site_tasks_cmd)
    site_prompt_cmd = ["design-ai", "site", "--stdin", "--prompt", "codex-implementation", "--task", "task-homepage-cta"]
    assert_site_prompt_markdown(passing_site_prompt_markdown(), context=context, cmd=site_prompt_cmd)
    site_prompt_templates_cmd = ["design-ai", "site", "--prompt-list", "--json"]
    assert_site_prompt_templates_json(passing_site_prompt_templates_json(), context=context, cmd=site_prompt_templates_cmd)
    site_mcp_check_cmd = ["design-ai", "site", "--stdin", "--mcp-check", "--json"]
    assert_site_mcp_check_json(passing_site_mcp_check_json(), context=context, cmd=site_mcp_check_cmd)
    site_mcp_plan_cmd = ["design-ai", "site", "--stdin", "--mcp-plan"]
    assert_site_mcp_plan_markdown(passing_site_mcp_plan_markdown(), context=context, cmd=site_mcp_plan_cmd)
    expect_self_test_failure(
        lambda: assert_site_json("\x1b[31m{}", context=context, cmd=site_cmd),
        expected="ANSI escape",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_site_sample_json("\x1b[31m{}", context=context, cmd=site_sample_cmd),
        expected="ANSI escape",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_site_tasks_json("\x1b[31m{}", context=context, cmd=site_tasks_cmd),
        expected="ANSI escape",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_site_prompt_markdown("\x1b[31m# Codex implementation prompt", context=context, cmd=site_prompt_cmd),
        expected="ANSI escape",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_site_prompt_templates_json("\x1b[31m{}", context=context, cmd=site_prompt_templates_cmd),
        expected="ANSI escape",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_site_mcp_check_json("\x1b[31m{}", context=context, cmd=site_mcp_check_cmd),
        expected="ANSI escape",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_site_mcp_plan_markdown("\x1b[31m# Website improvement MCP action plan", context=context, cmd=site_mcp_plan_cmd),
        expected="ANSI escape",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_site_json(json.dumps([]), context=context, cmd=site_cmd),
        expected="top-level is not an object",
        scope="smoke assertions",
    )
    reordered_site_payload = json.loads(passing_site_json())
    reordered_site_payload = {
        "status": reordered_site_payload["status"],
        "valid": reordered_site_payload["valid"],
        "filePath": reordered_site_payload["filePath"],
        "site": reordered_site_payload["site"],
        "counts": reordered_site_payload["counts"],
        "auditStatusCounts": reordered_site_payload["auditStatusCounts"],
        "mcpStatusCounts": reordered_site_payload["mcpStatusCounts"],
        "taskPriorityCounts": reordered_site_payload["taskPriorityCounts"],
        "requiredMcp": reordered_site_payload["requiredMcp"],
        "topTasks": reordered_site_payload["topTasks"],
        "issues": reordered_site_payload["issues"],
    }
    expect_self_test_failure(
        lambda: assert_site_json(
            json.dumps(reordered_site_payload),
            context=context,
            cmd=site_cmd,
        ),
        expected="top-level keys changed",
        scope="smoke assertions",
    )
    stale_site_payload = json.loads(passing_site_json())
    stale_site_payload["site"]["name"] = "Different site"
    expect_self_test_failure(
        lambda: assert_site_json(
            json.dumps(stale_site_payload),
            context=context,
            cmd=site_cmd,
        ),
        expected="sample workspace",
        scope="smoke assertions",
    )
    missing_site_task_payload = json.loads(passing_site_json())
    missing_site_task_payload["topTasks"] = []
    expect_self_test_failure(
        lambda: assert_site_json(
            json.dumps(missing_site_task_payload),
            context=context,
            cmd=site_cmd,
        ),
        expected="one sample task",
        scope="smoke assertions",
    )
    stale_site_sample_payload = json.loads(passing_site_sample_json())
    stale_site_sample_payload["siteProfile"]["name"] = "Different site"
    expect_self_test_failure(
        lambda: assert_site_sample_json(
            json.dumps(stale_site_sample_payload),
            context=context,
            cmd=site_sample_cmd,
        ),
        expected="sample workspace",
        scope="smoke assertions",
    )
    missing_site_sample_task_payload = json.loads(passing_site_sample_json())
    missing_site_sample_task_payload["refactorTasks"] = []
    expect_self_test_failure(
        lambda: assert_site_sample_json(
            json.dumps(missing_site_sample_task_payload),
            context=context,
            cmd=site_sample_cmd,
        ),
        expected="one sample refactor task",
        scope="smoke assertions",
    )
    stale_site_tasks_payload = json.loads(passing_site_tasks_json())
    stale_site_tasks_payload["refactorTasks"] = stale_site_tasks_payload["refactorTasks"][:1]
    expect_self_test_failure(
        lambda: assert_site_tasks_json(
            json.dumps(stale_site_tasks_payload),
            context=context,
            cmd=site_tasks_cmd,
        ),
        expected="three refactor tasks",
        scope="smoke assertions",
    )
    broken_site_tasks_payload = json.loads(passing_site_tasks_json())
    broken_site_tasks_payload["refactorTasks"][1]["codexPrompt"] = "Work somewhere else."
    expect_self_test_failure(
        lambda: assert_site_tasks_json(
            json.dumps(broken_site_tasks_payload),
            context=context,
            cmd=site_tasks_cmd,
        ),
        expected="target repo boundary",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_site_prompt_markdown(
            passing_site_prompt_markdown().replace("Work in the target website repository, not in this design-ai repository.", "Work in this repo."),
            context=context,
            cmd=site_prompt_cmd,
        ),
        expected="target website repository",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_site_prompt_markdown(
            f"# Website improvement prompt bundle\n\n{passing_site_prompt_markdown()}",
            context=context,
            cmd=site_prompt_cmd,
        ),
        expected="bundle fragment",
        scope="smoke assertions",
    )
    reordered_site_prompt_templates_payload = json.loads(passing_site_prompt_templates_json())
    reordered_site_prompt_templates_payload = {
        "templates": reordered_site_prompt_templates_payload["templates"],
        "count": reordered_site_prompt_templates_payload["count"],
    }
    expect_self_test_failure(
        lambda: assert_site_prompt_templates_json(
            json.dumps(reordered_site_prompt_templates_payload),
            context=context,
            cmd=site_prompt_templates_cmd,
        ),
        expected="top-level keys changed",
        scope="smoke assertions",
    )
    stale_site_prompt_templates_payload = json.loads(passing_site_prompt_templates_json())
    stale_site_prompt_templates_payload["templates"][1]["taskSelectable"] = False
    expect_self_test_failure(
        lambda: assert_site_prompt_templates_json(
            json.dumps(stale_site_prompt_templates_payload),
            context=context,
            cmd=site_prompt_templates_cmd,
        ),
        expected="task selectable",
        scope="smoke assertions",
    )
    reordered_site_mcp_check_payload = json.loads(passing_site_mcp_check_json())
    reordered_site_mcp_check_payload = {
        "status": reordered_site_mcp_check_payload["status"],
        "filePath": reordered_site_mcp_check_payload["filePath"],
        "workspaceStatus": reordered_site_mcp_check_payload["workspaceStatus"],
        "site": reordered_site_mcp_check_payload["site"],
        "counts": reordered_site_mcp_check_payload["counts"],
        "items": reordered_site_mcp_check_payload["items"],
        "taskGaps": reordered_site_mcp_check_payload["taskGaps"],
        "workspaceIssues": reordered_site_mcp_check_payload["workspaceIssues"],
        "nextActions": reordered_site_mcp_check_payload["nextActions"],
    }
    expect_self_test_failure(
        lambda: assert_site_mcp_check_json(
            json.dumps(reordered_site_mcp_check_payload),
            context=context,
            cmd=site_mcp_check_cmd,
        ),
        expected="top-level keys changed",
        scope="smoke assertions",
    )
    stale_site_mcp_check_payload = json.loads(passing_site_mcp_check_json())
    stale_site_mcp_check_payload["items"][1]["state"] = "missing"
    stale_site_mcp_check_payload["items"][1]["level"] = "warn"
    expect_self_test_failure(
        lambda: assert_site_mcp_check_json(
            json.dumps(stale_site_mcp_check_payload),
            context=context,
            cmd=site_mcp_check_cmd,
        ),
        expected="sample item should pass",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_site_mcp_plan_markdown(
            passing_site_mcp_plan_markdown().replace("does not call external MCPs, mutate the target website repo", "mutates the target repo"),
            context=context,
            cmd=site_mcp_plan_cmd,
        ),
        expected="missing expected content",
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
                "Installed slash commands: 17/17 installed",
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
            passing_install_output().replace("Installed 20 skills", "Installed 19 skills"),
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
            passing_install_json("smoke-design-").replace('"total": 41', '"total": 40'),
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
    install_payload_same_context = json.loads(passing_install_json("smoke-design-"))
    install_payload_same_context["context"]["claudeHome"] = "/tmp/design-ai"
    expect_self_test_failure(
        lambda: assert_install_json(
            json.dumps(install_payload_same_context),
            prefix="smoke-design-",
            context=context,
            cmd=[*install_cmd, "--json"],
        ),
        expected="sourceRoot and claudeHome must differ",
        scope="smoke assertions",
    )
    install_payload_wrong_counts = json.loads(passing_install_json("smoke-design-"))
    install_payload_wrong_counts["result"]["installed"]["skills"] = 19
    install_payload_wrong_counts["result"]["installed"]["commands"] = 18
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
    update_payload_reordered = json.loads(passing_update_dry_run_json("smoke-design-"))
    update_payload_reordered = {
        "plan": update_payload_reordered["plan"],
        "context": update_payload_reordered["context"],
        "result": update_payload_reordered["result"],
    }
    expect_self_test_failure(
        lambda: assert_update_dry_run_json(
            json.dumps(update_payload_reordered),
            prefix="smoke-design-",
            context=context,
            cmd=[*update_cmd, "--json"],
        ),
        expected="top-level keys changed",
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
    update_payload_source_inside_target = json.loads(passing_update_dry_run_json("smoke-design-"))
    update_payload_source_inside_target["context"]["sourceRoot"] = "/tmp/claude-home/source"
    expect_self_test_failure(
        lambda: assert_update_dry_run_json(
            json.dumps(update_payload_source_inside_target),
            prefix="smoke-design-",
            context=context,
            cmd=[*update_cmd, "--json"],
        ),
        expected="sourceRoot is inside claudeHome",
        scope="smoke assertions",
    )
    update_plan_reordered = json.loads(passing_update_dry_run_json("smoke-design-"))
    update_plan_reordered["plan"] = {
        "install": update_plan_reordered["plan"]["install"],
        "gitPull": update_plan_reordered["plan"]["gitPull"],
    }
    expect_self_test_failure(
        lambda: assert_update_dry_run_json(
            json.dumps(update_plan_reordered),
            prefix="smoke-design-",
            context=context,
            cmd=[*update_cmd, "--json"],
        ),
        expected="plan keys changed",
        scope="smoke assertions",
    )
    update_git_would_run_int = json.loads(passing_update_dry_run_json("smoke-design-"))
    update_git_would_run_int["plan"]["gitPull"]["wouldRun"] = 0
    expect_self_test_failure(
        lambda: assert_update_dry_run_json(
            json.dumps(update_git_would_run_int),
            prefix="smoke-design-",
            context=context,
            cmd=[*update_cmd, "--json"],
        ),
        expected="gitPull wouldRun is not boolean",
        scope="smoke assertions",
    )
    update_git_clone_missing_command = json.loads(passing_update_dry_run_json("smoke-design-"))
    update_git_clone_missing_command["plan"]["gitPull"]["sourceIsGitClone"] = True
    update_git_clone_missing_command["plan"]["gitPull"]["wouldRun"] = True
    update_git_clone_missing_command["plan"]["gitPull"]["reason"] = "source is a git clone"
    expect_self_test_failure(
        lambda: assert_update_dry_run_json(
            json.dumps(update_git_clone_missing_command),
            prefix="smoke-design-",
            context=context,
            cmd=[*update_cmd, "--json"],
        ),
        expected="gitPull command differs",
        scope="smoke assertions",
    )
    update_git_reason_drift = json.loads(passing_update_dry_run_json("smoke-design-"))
    update_git_reason_drift["plan"]["gitPull"]["reason"] = "git work skipped"
    expect_self_test_failure(
        lambda: assert_update_dry_run_json(
            json.dumps(update_git_reason_drift),
            prefix="smoke-design-",
            context=context,
            cmd=[*update_cmd, "--json"],
        ),
        expected="gitPull reason differs",
        scope="smoke assertions",
    )
    update_install_missing_reason = json.loads(passing_update_dry_run_json("smoke-design-"))
    del update_install_missing_reason["plan"]["install"]["reason"]
    expect_self_test_failure(
        lambda: assert_update_dry_run_json(
            json.dumps(update_install_missing_reason),
            prefix="smoke-design-",
            context=context,
            cmd=[*update_cmd, "--json"],
        ),
        expected="install keys changed",
        scope="smoke assertions",
    )
    update_install_reason_drift = json.loads(passing_update_dry_run_json("smoke-design-"))
    update_install_reason_drift["plan"]["install"]["reason"] = "installer exists"
    expect_self_test_failure(
        lambda: assert_update_dry_run_json(
            json.dumps(update_install_reason_drift),
            prefix="smoke-design-",
            context=context,
            cmd=[*update_cmd, "--json"],
        ),
        expected="install reason differs",
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
            passing_status_output().replace("Skills: 20 installed", "Skills: 0 installed"),
            context=context,
            cmd=status_cmd,
        ),
        expected="missing installed symlinks",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_status_output(
            passing_status_output().replace("Slash commands: 17 installed", "Slash commands: 15 installed"),
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
            passing_status_json("smoke-design-").replace('"installed": 41', '"installed": 40'),
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
    status_payload_target_inside_source = json.loads(passing_status_json("smoke-design-"))
    status_payload_target_inside_source["context"]["claudeHome"] = "/tmp/design-ai/claude-home"
    expect_self_test_failure(
        lambda: assert_status_json(
            json.dumps(status_payload_target_inside_source),
            prefix="smoke-design-",
            context=context,
            cmd=[*status_cmd, "--json"],
        ),
        expected="claudeHome is inside sourceRoot",
        scope="smoke assertions",
    )
    status_payload_label_drift = json.loads(passing_status_json("smoke-design-"))
    status_payload_label_drift["sections"][0]["label"] = "Skill links"
    expect_self_test_failure(
        lambda: assert_status_json(
            json.dumps(status_payload_label_drift),
            prefix="smoke-design-",
            context=context,
            cmd=[*status_cmd, "--json"],
        ),
        expected="section label differs",
        scope="smoke assertions",
    )
    status_payload_outside_target = json.loads(passing_status_json("smoke-design-"))
    status_payload_outside_target["sections"][0]["targetDir"] = "/tmp/other-claude-home/skills"
    expect_self_test_failure(
        lambda: assert_status_json(
            json.dumps(status_payload_outside_target),
            prefix="smoke-design-",
            context=context,
            cmd=[*status_cmd, "--json"],
        ),
        expected="targetDir is outside claudeHome",
        scope="smoke assertions",
    )
    status_payload_wrong_target_basename = json.loads(passing_status_json("smoke-design-"))
    status_payload_wrong_target_basename["sections"][0]["targetDir"] = "/tmp/claude-home/not-skills"
    expect_self_test_failure(
        lambda: assert_status_json(
            json.dumps(status_payload_wrong_target_basename),
            prefix="smoke-design-",
            context=context,
            cmd=[*status_cmd, "--json"],
        ),
        expected="targetDir basename differs",
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
            passing_uninstall_output().replace("Removed 41 design-ai symlinks", "Removed 40 design-ai symlinks"),
            context=context,
            cmd=uninstall_cmd,
        ),
        expected="missing expected content",
        scope="smoke assertions",
    )
    expect_self_test_failure(
        lambda: assert_uninstall_json(
            passing_uninstall_json("smoke-design-").replace('"removed": 41', '"removed": 40'),
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
    uninstall_payload_target_inside_source = json.loads(passing_uninstall_json("smoke-design-"))
    uninstall_payload_target_inside_source["context"]["claudeHome"] = "/tmp/design-ai/claude-home"
    expect_self_test_failure(
        lambda: assert_uninstall_json(
            json.dumps(uninstall_payload_target_inside_source),
            prefix="smoke-design-",
            context=context,
            cmd=[*uninstall_cmd, "--json"],
        ),
        expected="claudeHome is inside sourceRoot",
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
        "design-ai help ws && "
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
        "design-ai ws --help && "
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
