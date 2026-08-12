from __future__ import annotations

import json

from .site_contracts import (
    EXPECTED_SITE_SAMPLE_KEYS,
    EXPECTED_SITE_SAMPLE_PROFILE_KEYS,
    EXPECTED_SITE_SAMPLE_TASK_KEYS,
)

from .assertion_helpers import (
    assert_no_ansi,
    assert_smoke_json_keys,
)


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

    evidence = payload.get("implementationEvidence")
    if not isinstance(evidence, dict):
        raise SystemExit(f"site sample JSON after {context} implementationEvidence must be an object")
    for key in ("executedWork", "verificationResults", "remainingRisks", "nextActions"):
        if not isinstance(evidence.get(key), list):
            raise SystemExit(f"site sample JSON after {context} implementationEvidence.{key} must be an array")
    if evidence.get("executedWork") or evidence.get("verificationResults") or evidence.get("nextActions"):
        raise SystemExit(f"site sample JSON after {context} sample evidence should start empty")
    if len(evidence.get("remainingRisks", [])) != 3 or "MCP readiness gaps" not in evidence["remainingRisks"][0]:
        raise SystemExit(f"site sample JSON after {context} sample remaining risks changed")

    if not isinstance(payload.get("reportNotes"), str) or "target website repo" not in payload["reportNotes"]:
        raise SystemExit(f"site sample JSON after {context} reportNotes must preserve target repo boundary")


def assert_site_project_workspace_json(
    raw: str,
    *,
    context: str,
    cmd: list[str],
    command_label: str,
    provenance_fragment: str,
    expected_viewports: list[str],
) -> None:
    assert_no_ansi(raw, cmd)

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"{command_label} after {context} is not valid JSON: {error}") from error

    payload = assert_smoke_json_keys(
        payload,
        EXPECTED_SITE_SAMPLE_KEYS,
        label="top-level",
        context=context,
        command_label=command_label,
    )
    if payload.get("version") != 1:
        raise SystemExit(f"{command_label} after {context} expected workspace version 1")
    if not isinstance(payload.get("updatedAt"), str) or not payload["updatedAt"]:
        raise SystemExit(f"{command_label} after {context} updatedAt is missing")

    profile = assert_smoke_json_keys(
        payload.get("siteProfile"),
        EXPECTED_SITE_SAMPLE_PROFILE_KEYS,
        label="siteProfile",
        context=context,
        command_label=command_label,
    )
    expected_profile = {
        "id": "company-marketing-site",
        "name": "Company marketing site",
        "liveUrl": "https://example.com",
        "repoUrl": "https://github.com/acme/site",
        "localPath": "",
        "figmaUrl": "",
        "deployProvider": "vercel",
        "sentryProject": "",
        "cms": "none",
        "database": "none",
    }
    for key, expected in expected_profile.items():
        if profile.get(key) != expected:
            raise SystemExit(f"{command_label} after {context} profile {key} differs from expected project workspace")
    if profile.get("pages") != ["/", "/pricing"]:
        raise SystemExit(f"{command_label} after {context} pages differ from expected project workspace")
    if profile.get("userFlows") != ["Visitor compares plans and starts signup"]:
        raise SystemExit(f"{command_label} after {context} user flows differ from expected project workspace")
    if profile.get("viewports") != expected_viewports:
        raise SystemExit(f"{command_label} after {context} viewports differ from expected project workspace")
    if not isinstance(profile.get("brandNotes"), str):
        raise SystemExit(f"{command_label} after {context} brand notes must be a string")

    checklist = payload.get("auditChecklist")
    if not isinstance(checklist, dict) or len(checklist) != 9:
        raise SystemExit(f"{command_label} after {context} auditChecklist must contain all nine audit categories")
    if any(row.get("status") != "todo" for row in checklist.values() if isinstance(row, dict)):
        raise SystemExit(f"{command_label} after {context} checklist rows should start in todo state")
    if "Visitor compares plans" not in checklist.get("ux-flow", {}).get("notes", ""):
        raise SystemExit(f"{command_label} after {context} UX flow notes should include the provided flow")

    readiness = payload.get("mcpReadiness")
    if not isinstance(readiness, dict):
        raise SystemExit(f"{command_label} after {context} mcpReadiness must be an object")
    expected_readiness = {
        "github": "required",
        "browser": "required",
        "deploy": "required",
        "figma": "unused",
        "cms": "unused",
        "database": "unused",
    }
    for key, expected in expected_readiness.items():
        if readiness.get(key) != expected:
            raise SystemExit(f"{command_label} after {context} MCP readiness {key} differs from expected project workspace")

    tasks = payload.get("refactorTasks")
    if tasks != []:
        raise SystemExit(f"{command_label} after {context} refactorTasks should start empty")

    evidence = payload.get("implementationEvidence")
    if not isinstance(evidence, dict):
        raise SystemExit(f"{command_label} after {context} implementationEvidence must be an object")
    if evidence.get("executedWork") or evidence.get("verificationResults"):
        raise SystemExit(f"{command_label} after {context} implementation evidence should start empty")
    if len(evidence.get("remainingRisks", [])) != 3:
        raise SystemExit(f"{command_label} after {context} remaining risks should use the default risk set")
    if not any("--mcp-check --probes --json" in item for item in evidence.get("nextActions", [])):
        raise SystemExit(f"{command_label} after {context} nextActions should include the MCP probe command")
    if not isinstance(payload.get("reportNotes"), str) or provenance_fragment not in payload["reportNotes"]:
        raise SystemExit(f"{command_label} after {context} reportNotes must preserve command provenance")


def assert_site_init_json(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_site_project_workspace_json(
        raw,
        context=context,
        cmd=cmd,
        command_label="site init JSON",
        provenance_fragment="design-ai site --init",
        expected_viewports=["desktop", "mobile"],
    )


def assert_site_from_intake_json(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_site_project_workspace_json(
        raw,
        context=context,
        cmd=cmd,
        command_label="site from-intake JSON",
        provenance_fragment="design-ai site --from-intake",
        expected_viewports=["desktop", "tablet", "mobile"],
    )
