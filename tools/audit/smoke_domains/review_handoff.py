"""P7 handoff and P8 receipt smoke assertions."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

from .assertion_helpers import assert_no_ansi, assert_smoke_json_keys
from .review_quality import review_workflow_digest


def assert_review_handoff_json(
    raw: str,
    workflow_path: Path,
    *,
    recipient: str,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        handoff = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"failed to parse review handoff JSON after {context}") from error

    assert_smoke_json_keys(
        handoff,
        [
            "kind", "schemaVersion", "status", "recipient", "artifacts",
            "linkage", "stages", "nextAction", "boundary",
        ],
        label="top-level",
        context=context,
        command_label="review handoff JSON",
    )
    if (
        handoff.get("kind") != "design-ai-review-handoff"
        or handoff.get("schemaVersion") != 1
        or handoff.get("status") != "static-evidence-prepared"
    ):
        raise SystemExit(f"review handoff JSON after {context} changed its contract identity")
    if handoff.get("recipient") != {
        "name": recipient,
        "delivery": "not-delivered",
        "consumerValidation": "pending",
    }:
        raise SystemExit(f"review handoff JSON after {context} changed its pending recipient state")

    artifacts = handoff.get("artifacts")
    if not isinstance(artifacts, dict) or set(artifacts) != {
        "reviewWorkflow", "qualityReport", "browserVerification",
    }:
        raise SystemExit(f"review handoff JSON after {context} changed its artifact inventory")
    workflow_artifact = artifacts.get("reviewWorkflow")
    workflow_source = workflow_path.read_text(encoding="utf-8")
    if not isinstance(workflow_artifact, dict) or set(workflow_artifact) != {
        "reference", "sha256", "bytes", "source", "value",
    }:
        raise SystemExit(f"review handoff JSON after {context} changed its workflow artifact shape")
    if (
        workflow_artifact.get("reference") != str(workflow_path.resolve())
        or workflow_artifact.get("source") != workflow_source
        or workflow_artifact.get("sha256") != hashlib.sha256(workflow_source.encode("utf-8")).hexdigest()
        or workflow_artifact.get("bytes") != len(workflow_source.encode("utf-8"))
    ):
        raise SystemExit(f"review handoff JSON after {context} lost exact workflow source identity")
    try:
        workflow_value = json.loads(workflow_source)
    except json.JSONDecodeError as error:
        raise SystemExit(f"review handoff source workflow after {context} is invalid JSON") from error
    if workflow_artifact.get("value") != workflow_value:
        raise SystemExit(f"review handoff JSON after {context} changed its embedded workflow value")
    if artifacts.get("qualityReport") is not None or artifacts.get("browserVerification") is not None:
        raise SystemExit(f"review handoff JSON after {context} added undeclared browser evidence")

    linkage = handoff.get("linkage")
    expected_linkage = {
        "status": "pass",
        "reviewWorkflowArtifactSha256": review_workflow_digest(workflow_value),
        "qualityReportArtifactSha256": workflow_value.get("linkage", {}).get("reportSha256"),
        "browserVerificationArtifactSha256": None,
        "qualityReportArtifactMatch": None,
        "browserSourceReportMatch": None,
        "viewportCoverage": "not-run",
    }
    if linkage != expected_linkage:
        raise SystemExit(f"review handoff JSON after {context} changed artifact linkage evidence")
    if handoff.get("stages") != [
        {"id": "plan", "status": "complete", "artifactKind": "design-ai-start"},
        {"id": "static-review", "status": "complete", "artifactKind": "design-ai-quality-report"},
        {"id": "browser-verification", "status": "not-run", "artifactKind": None},
        {"id": "implementation-handoff", "status": "prepared", "artifactKind": "design-ai-review-handoff"},
    ]:
        raise SystemExit(f"review handoff JSON after {context} changed its stage sequence")
    if handoff.get("nextAction") != {
        "id": "consumer-validation-required",
        "status": "pending",
        "summary": f"Deliver this prepared handoff to {recipient}, then validate it before implementation.",
        "approvalRequiredBefore": workflow_value.get("nextAction", {}).get("approvalRequiredBefore"),
    }:
        raise SystemExit(f"review handoff JSON after {context} changed its consumer gate")
    if handoff.get("boundary") != {
        "mode": "read-only",
        "localWrites": False,
        "targetRepoMutation": False,
        "externalWrites": False,
        "deliveryPerformed": False,
    }:
        raise SystemExit(f"review handoff JSON after {context} changed its undelivered boundary")


def assert_review_handoff_receipt_json(
    raw: str,
    handoff_path: Path,
    *,
    consumer: str,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        receipt = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"failed to parse review handoff receipt JSON after {context}") from error

    assert_smoke_json_keys(
        receipt,
        [
            "kind", "schemaVersion", "status", "consumer", "handoff", "evidence",
            "remainingApprovals", "nextAction", "boundary",
        ],
        label="top-level",
        context=context,
        command_label="review handoff receipt JSON",
    )
    if (
        receipt.get("kind") != "design-ai-review-handoff-receipt"
        or receipt.get("schemaVersion") != 1
        or receipt.get("status") != "contract-validated"
    ):
        raise SystemExit(f"review handoff receipt JSON after {context} changed its contract identity")

    handoff_source = handoff_path.read_text(encoding="utf-8")
    try:
        handoff_value = json.loads(handoff_source)
    except json.JSONDecodeError as error:
        raise SystemExit(f"review handoff receipt source after {context} is invalid JSON") from error
    if receipt.get("consumer") != {
        "name": consumer,
        "expectedRecipient": consumer,
        "recipientMatch": True,
        "identity": "self-declared",
        "contractValidation": "pass",
        "acceptance": "not-claimed",
    }:
        raise SystemExit(f"review handoff receipt JSON after {context} changed its consumer boundary")
    handoff_artifact = receipt.get("handoff")
    if not isinstance(handoff_artifact, dict) or set(handoff_artifact) != {
        "reference", "sha256", "bytes", "source", "value",
    }:
        raise SystemExit(f"review handoff receipt JSON after {context} changed its handoff artifact")
    if (
        handoff_artifact.get("reference") != str(handoff_path.resolve())
        or handoff_artifact.get("source") != handoff_source
        or handoff_artifact.get("value") != handoff_value
        or handoff_artifact.get("sha256") != hashlib.sha256(handoff_source.encode("utf-8")).hexdigest()
        or handoff_artifact.get("bytes") != len(handoff_source.encode("utf-8"))
    ):
        raise SystemExit(f"review handoff receipt JSON after {context} lost exact handoff identity")

    report_summary = handoff_value["artifacts"]["reviewWorkflow"]["value"]["report"]["summary"]
    browser_artifact = handoff_value["artifacts"]["browserVerification"]
    browser_status = browser_artifact["value"]["summary"]["status"] if browser_artifact else "not-run"
    if receipt.get("evidence") != {
        "qualityStatus": report_summary["status"],
        "confirmedFindings": report_summary["confirmedFindings"],
        "unverifiedFindings": report_summary["unverifiedFindings"],
        "browserStatus": browser_status,
    }:
        raise SystemExit(f"review handoff receipt JSON after {context} changed its evidence summary")
    if receipt.get("remainingApprovals") != handoff_value["nextAction"]["approvalRequiredBefore"]:
        raise SystemExit(f"review handoff receipt JSON after {context} changed remaining approvals")
    if receipt.get("nextAction") != {
        "id": "target-repo-intake-required",
        "status": "pending",
        "summary": "Inspect the declared target repository before any implementation begins.",
        "implementationAuthorized": False,
    }:
        raise SystemExit(f"review handoff receipt JSON after {context} changed its next action")
    if receipt.get("boundary") != {
        "mode": "read-only",
        "localWrites": False,
        "targetRepoMutation": False,
        "externalWrites": False,
        "transportVerified": False,
        "consumerIdentityVerified": False,
        "acceptanceRecorded": False,
        "implementationStarted": False,
    }:
        raise SystemExit(f"review handoff receipt JSON after {context} exceeded its proof boundary")
