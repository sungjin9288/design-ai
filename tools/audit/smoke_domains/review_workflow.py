"""Canonical P6 review-workflow smoke assertion."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

from .assertion_helpers import assert_no_ansi, assert_smoke_json_keys
from .review_quality import review_workflow_digest


def assert_review_workflow_json(
    raw: str,
    source_path: Path,
    *,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        workflow = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"failed to parse review workflow JSON after {context}") from error

    assert_smoke_json_keys(
        workflow,
        [
            "kind", "schemaVersion", "status", "source", "plan", "report",
            "linkage", "stages", "nextAction", "boundary",
        ],
        label="top-level",
        context=context,
        command_label="review workflow JSON",
    )
    if (
        workflow.get("kind") != "design-ai-review-workflow"
        or workflow.get("schemaVersion") != 1
        or workflow.get("status") != "static-review-complete"
    ):
        raise SystemExit(f"review workflow JSON after {context} changed its contract identity")

    source_bytes = source_path.read_bytes()
    source = workflow.get("source")
    expected_source = {
        "reference": str(source_path.resolve()),
        "sha256": hashlib.sha256(source_bytes).hexdigest(),
        "bytes": len(source_bytes),
    }
    if source != expected_source:
        raise SystemExit(f"review workflow JSON after {context} lost exact source identity")

    plan = workflow.get("plan")
    report = workflow.get("report")
    if not (
        isinstance(plan, dict)
        and plan.get("kind") == "design-ai-start"
        and plan.get("schemaVersion") == 1
        and isinstance(plan.get("route"), dict)
        and plan["route"].get("id") == "design-review"
        and isinstance(report, dict)
        and report.get("kind") == "design-ai-quality-report"
        and report.get("schemaVersion") == 1
        and isinstance(report.get("context"), dict)
        and report["context"].get("routeId") == "design-engineering-review"
    ):
        raise SystemExit(f"review workflow JSON after {context} changed its nested artifact identities")

    summary = report.get("summary")
    if not (
        isinstance(summary, dict)
        and summary.get("status") == "fail"
        and summary.get("confirmedFindings") == 1
        and summary.get("unverifiedFindings") == 1
    ):
        raise SystemExit(f"review workflow JSON after {context} lost confirmed and unverified evidence")

    linkage = workflow.get("linkage")
    expected_linkage = {
        "status": "pass",
        "briefMatch": True,
        "localeMatch": True,
        "viewportMatch": True,
        "sourceReferenceMatch": True,
        "planSha256": review_workflow_digest(plan),
        "designContractSha256": review_workflow_digest(plan.get("designContract")),
        "reportSha256": review_workflow_digest(report),
    }
    if linkage != expected_linkage:
        raise SystemExit(f"review workflow JSON after {context} changed artifact linkage evidence")

    expected_stages = [
        {"id": "plan", "status": "complete", "artifactKind": "design-ai-start"},
        {"id": "static-review", "status": "complete", "artifactKind": "design-ai-quality-report"},
        {"id": "browser-verification", "status": "not-run", "artifactKind": None},
        {"id": "implementation-handoff", "status": "not-started", "artifactKind": None},
    ]
    if workflow.get("stages") != expected_stages:
        raise SystemExit(f"review workflow JSON after {context} changed the canonical stage sequence")

    approval = report.get("approval")
    required_before = approval.get("requiredBefore") if isinstance(approval, dict) else None
    next_action = workflow.get("nextAction")
    if next_action != {
        "id": "human-review-required",
        "status": "pending",
        "summary": summary.get("nextAction"),
        "approvalRequiredBefore": required_before,
    }:
        raise SystemExit(f"review workflow JSON after {context} changed the human review gate")

    if workflow.get("boundary") != {
        "mode": "read-only",
        "localWrites": False,
        "targetRepoMutation": False,
        "externalWrites": False,
    }:
        raise SystemExit(f"review workflow JSON after {context} changed its read-only boundary")
