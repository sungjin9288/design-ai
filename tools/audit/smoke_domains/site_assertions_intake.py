from __future__ import annotations

import json

from .site_contracts import (
    EXPECTED_SITE_INTAKE_TEMPLATE_COMMAND_KEYS,
    EXPECTED_SITE_INTAKE_TEMPLATE_KEYS,
    EXPECTED_SITE_INTAKE_TEMPLATE_PRIVACY_KEYS,
    EXPECTED_SITE_SAMPLE_KEYS,
    EXPECTED_SITE_SAMPLE_PROFILE_KEYS,
    EXPECTED_SITE_SAMPLE_TASK_KEYS,
)

from .assertion_helpers import (
    assert_no_ansi,
    assert_output_write_success,
    assert_smoke_json_keys,
)


def assert_site_intake_template_json(raw: str, *, context: str, cmd: list[str], language: str = "en") -> None:
    assert_no_ansi(raw, cmd)

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"site intake template JSON after {context} is not valid JSON: {error}") from error

    payload = assert_smoke_json_keys(
        payload,
        EXPECTED_SITE_INTAKE_TEMPLATE_KEYS,
        label="top-level",
        context=context,
        command_label="site intake template JSON",
    )
    if payload.get("kind") != "website-improvement-intake-template":
        raise SystemExit(f"site intake template JSON after {context} kind changed")
    if payload.get("version") != 1:
        raise SystemExit(f"site intake template JSON after {context} expected version 1")
    if payload.get("format") != "markdown":
        raise SystemExit(f"site intake template JSON after {context} expected markdown format")
    if payload.get("language") != language:
        raise SystemExit(f"site intake template JSON after {context} expected language {language}")
    expected_file_name = "company-website-intake.ko.md" if language == "ko" else "company-website-intake.md"
    if payload.get("recommendedFileName") != expected_file_name:
        raise SystemExit(f"site intake template JSON after {context} recommended file name changed")

    sections = payload.get("sections")
    if not isinstance(sections, list) or len(sections) < 8:
        raise SystemExit(f"site intake template JSON after {context} expected section metadata")
    for section in ("site-profile", "priority-pages", "mcp-readiness-notes", "stop-conditions"):
        if section not in sections:
            raise SystemExit(f"site intake template JSON after {context} missing section metadata: {section}")

    privacy = assert_smoke_json_keys(
        payload.get("privacy"),
        EXPECTED_SITE_INTAKE_TEMPLATE_PRIVACY_KEYS,
        label="privacy",
        context=context,
        command_label="site intake template JSON",
    )
    for key in EXPECTED_SITE_INTAKE_TEMPLATE_PRIVACY_KEYS:
        if privacy.get(key) is not False:
            raise SystemExit(f"site intake template JSON after {context} privacy flag {key} must remain false")

    commands = assert_smoke_json_keys(
        payload.get("commands"),
        EXPECTED_SITE_INTAKE_TEMPLATE_COMMAND_KEYS,
        label="commands",
        context=context,
        command_label="site intake template JSON",
    )
    if "design-ai site --init" not in commands.get("bundle", "") or "--bundle --out website-handoff-bundle" not in commands.get("bundle", ""):
        raise SystemExit(f"site intake template JSON after {context} bundle command changed")
    if "--bundle-check --strict --json" not in commands.get("bundleCheck", ""):
        raise SystemExit(f"site intake template JSON after {context} bundle check command changed")

    content = payload.get("content")
    assert_site_intake_template_markdown(content, context=context, cmd=cmd, language=language)


def assert_site_intake_template_markdown(raw: object, *, context: str, cmd: list[str], language: str = "en") -> None:
    if not isinstance(raw, str):
        raise SystemExit(f"site intake template Markdown after {context} did not emit text")
    assert_no_ansi(raw, cmd)
    if raw.lstrip().startswith("{"):
        raise SystemExit(f"site intake template Markdown after {context} unexpectedly emitted JSON")
    if language == "ko":
        required_fragments = [
            "# 회사 웹사이트 Intake Template",
            "## Site Profile",
            "## 우선순위 페이지",
            "## 주요 사용자 흐름",
            "## MCP Readiness Notes",
            "## 초기 Audit Findings",
            "## 첫 Bundle Commands",
            "## Target Repo Verification Plan",
            "## Stop Conditions",
            "design-ai site --init",
            "--bundle",
            "--out website-handoff-bundle",
        ]
    else:
        required_fragments = [
            "# Company Website Intake Template",
            "## Site Profile",
            "## Priority Pages",
            "## Primary User Flows",
            "## MCP Readiness Notes",
            "## Initial Audit Findings",
            "## First Bundle Commands",
            "## Target Repo Verification Plan",
            "## Stop Conditions",
            "design-ai site --init",
            "--bundle",
            "--out website-handoff-bundle",
        ]
    for fragment in required_fragments:
        if fragment not in raw:
            raise SystemExit(f"site intake template Markdown after {context} missing fragment: {fragment!r}")


def assert_site_intake_template_markdown_file_output(
    raw_stdout: str,
    file_contents: str,
    *,
    output_path: str,
    context: str,
    cmd: list[str],
    language: str = "en",
) -> None:
    assert_output_write_success(raw_stdout, context=context, cmd=cmd, expected_path=output_path)
    assert_site_intake_template_markdown(
        file_contents,
        context=f"{context} out file",
        cmd=cmd,
        language=language,
    )


def assert_site_intake_template_json_file_output(
    raw_stdout: str,
    file_contents: str,
    *,
    output_path: str,
    context: str,
    cmd: list[str],
    language: str = "en",
) -> None:
    assert_output_write_success(raw_stdout, context=context, cmd=cmd, expected_path=output_path)
    assert_site_intake_template_json(
        file_contents,
        context=f"{context} out file",
        cmd=cmd,
        language=language,
    )


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
