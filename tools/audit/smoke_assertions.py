"""Shared assertions for design-ai package and registry smoke tests."""
from __future__ import annotations

import argparse
import json
import re
import shlex
import sys
from typing import Callable

from doctor_assertions import EXPECTED_DOCTOR_PASS_LABELS, assert_doctor_report_clean

ANSI_ESCAPE_RE = re.compile(r"\x1b\[[0-?]*[ -/]*[@-~]")
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
EXPECTED_AUDIT_COUNT = 7
EXPECTED_CHECK_ARTIFACT_NAME = "component-artifact.md"
EXPECTED_CHECK_EXAMPLES_LIMIT = 1
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


def passing_output_overwrite_failure_output(path: str = "/tmp/existing.md") -> str:
    return "\n".join([
        f"{EXPECTED_ERROR_PREFIX} Output file already exists: {path}. Use --force to overwrite.",
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


def passing_doctor_report_json() -> str:
    return json.dumps({
        "summary": {"pass": len(EXPECTED_DOCTOR_PASS_LABELS), "warn": 0, "fail": 0},
        "checks": [
            {"label": label, "status": "PASS"}
            for label in sorted(EXPECTED_DOCTOR_PASS_LABELS)
        ],
    })


def doctor_report_json_missing(label_to_remove: str) -> str:
    return json.dumps({
        "summary": {"pass": len(EXPECTED_DOCTOR_PASS_LABELS) - 1, "warn": 0, "fail": 0},
        "checks": [
            {"label": label, "status": "PASS"}
            for label in sorted(EXPECTED_DOCTOR_PASS_LABELS)
            if label != label_to_remove
        ],
    })


def passing_search_json() -> str:
    return json.dumps({
        "query": EXPECTED_CORPUS_SEARCH_QUERY,
        "hits": [
            {
                "relPath": EXPECTED_CORPUS_SEARCH_HIT,
                "lineNumber": 29,
                "preview": EXPECTED_CORPUS_SEARCH_PREVIEW,
            }
        ],
    })


def passing_show_json() -> str:
    return json.dumps({
        "relPath": EXPECTED_CORPUS_SHOW_REL_PATH,
        "start": 1,
        "end": 1,
        "totalLines": 109,
        "lines": [
            {"number": 1, "text": EXPECTED_CORPUS_SHOW_TEXT},
        ],
    })


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


def assert_search_json_contains_hit(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"failed to parse search JSON after {context}") from error

    if not isinstance(payload, dict):
        raise SystemExit(f"search JSON after {context} is not an object")

    if payload.get("query") != EXPECTED_CORPUS_SEARCH_QUERY:
        raise SystemExit(f"search JSON after {context} query differs from expected query")

    hits = payload.get("hits")
    if not isinstance(hits, list) or not hits:
        raise SystemExit(f"search JSON after {context} does not contain any hits")

    for hit in hits:
        if not isinstance(hit, dict):
            continue
        if hit.get("relPath") != EXPECTED_CORPUS_SEARCH_HIT:
            continue
        preview = hit.get("preview")
        line_number = hit.get("lineNumber")
        if not isinstance(line_number, int) or line_number < 1:
            raise SystemExit(f"search JSON after {context} has invalid line number for expected hit")
        if not isinstance(preview, str) or EXPECTED_CORPUS_SEARCH_PREVIEW not in preview:
            raise SystemExit(f"search JSON after {context} has invalid preview for expected hit")
        return

    raise SystemExit(
        f"search JSON after {context} is missing expected hit: {EXPECTED_CORPUS_SEARCH_HIT}"
    )


def assert_show_json_line(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"failed to parse show JSON after {context}") from error

    if not isinstance(payload, dict):
        raise SystemExit(f"show JSON after {context} is not an object")

    if payload.get("relPath") != EXPECTED_CORPUS_SHOW_REL_PATH:
        raise SystemExit(f"show JSON after {context} relPath differs from expected path")

    if payload.get("start") != 1 or payload.get("end") != 1:
        raise SystemExit(f"show JSON after {context} range differs from expected line")

    lines = payload.get("lines")
    if not isinstance(lines, list) or len(lines) != 1:
        raise SystemExit(f"show JSON after {context} does not contain exactly one line")

    line = lines[0]
    if not isinstance(line, dict):
        raise SystemExit(f"show JSON after {context} contains an invalid line entry")

    if line.get("number") != 1 or line.get("text") != EXPECTED_CORPUS_SHOW_TEXT:
        raise SystemExit(f"show JSON after {context} line content differs from expected content")


def assert_examples_json_route_hit(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"failed to parse examples JSON after {context}") from error

    if not isinstance(payload, dict):
        raise SystemExit(f"examples JSON after {context} is not an object")

    if payload.get("routeId") != EXPECTED_EXAMPLES_ROUTE:
        raise SystemExit(f"examples JSON after {context} routeId differs from expected route")

    effective_query = payload.get("effectiveQuery")
    if not isinstance(effective_query, str) or EXPECTED_EXAMPLES_EFFECTIVE_QUERY not in effective_query:
        raise SystemExit(f"examples JSON after {context} effectiveQuery differs from expected query")

    examples = payload.get("examples")
    if not isinstance(examples, list) or not examples:
        raise SystemExit(f"examples JSON after {context} does not contain any examples")

    first = examples[0]
    if not isinstance(first, dict):
        raise SystemExit(f"examples JSON after {context} contains an invalid example entry")

    if first.get("relPath") != EXPECTED_EXAMPLES_HIT:
        raise SystemExit(f"examples JSON after {context} first example differs from expected hit")

    if first.get("category") != EXPECTED_EXAMPLES_CATEGORY:
        raise SystemExit(f"examples JSON after {context} category differs from expected category")

    title = first.get("title")
    if not isinstance(title, str) or EXPECTED_EXAMPLES_TITLE_FRAGMENT not in title:
        raise SystemExit(f"examples JSON after {context} title differs from expected title")

    score = first.get("score")
    if not isinstance(score, int) or score <= 0:
        raise SystemExit(f"examples JSON after {context} score is not a positive integer")


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

    list_cmd = ["design-ai", "list", "skills"]
    assert_list_catalog_output(passing_list_catalog_output("skills"), kind="skills", context=context, cmd=list_cmd)
    expect_self_test_failure(
        lambda: assert_list_catalog_output("\x1b[31mred", kind="skills", context=context, cmd=list_cmd),
        expected="ANSI escape",
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
    expect_self_test_failure(
        lambda: assert_search_json_contains_hit("\x1b[31m{}", context=context, cmd=search_cmd),
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
    expect_self_test_failure(
        lambda: assert_show_json_line("\x1b[31m{}", context=context, cmd=show_cmd),
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
    expect_self_test_failure(
        lambda: assert_examples_json_route_hit("\x1b[31m{}", context=context, cmd=examples_cmd),
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
    assert_audit_strict_quiet_output(passing_audit_strict_quiet_output(), context=context, cmd=audit_cmd)
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
