"""P10 implementation-scope smoke assertions."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

from .assertion_helpers import assert_no_ansi, assert_smoke_json_keys


def assert_implementation_scope_proposal_json(
    raw: str,
    intake_path: Path,
    request_path: Path,
    *,
    consumer: str,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        proposal = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"failed to parse implementation scope proposal after {context}") from error

    assert_smoke_json_keys(
        proposal,
        [
            "kind", "schemaVersion", "status", "consumer", "intake", "request",
            "linkage", "baseline", "scope", "approvalGates", "issues", "nextAction", "boundary",
        ],
        label="top-level",
        context=context,
        command_label="implementation scope proposal JSON",
    )
    if (
        proposal.get("kind") != "design-ai-implementation-scope-proposal"
        or proposal.get("schemaVersion") != 1
        or proposal.get("status") != "approval-pending"
        or proposal.get("consumer") != {
            "name": consumer,
            "intakeConsumerMatch": True,
            "identity": "self-declared",
        }
    ):
        raise SystemExit(f"implementation scope proposal after {context} changed identity or status")

    for field, source_path in (("intake", intake_path), ("request", request_path)):
        source = source_path.read_text(encoding="utf-8")
        artifact = proposal.get(field, {})
        if (
            artifact.get("reference") != str(source_path.resolve())
            or artifact.get("source") != source
            or artifact.get("sha256") != hashlib.sha256(source.encode("utf-8")).hexdigest()
            or artifact.get("bytes") != len(source.encode("utf-8"))
            or artifact.get("value") != json.loads(source)
        ):
            raise SystemExit(f"implementation scope proposal after {context} changed {field} source identity")

    gates = {gate.get("id"): gate.get("status") for gate in proposal.get("approvalGates", [])}
    if gates.get("source-inspection") != "pending" or gates.get("target-files") != "pending":
        raise SystemExit(f"implementation scope proposal after {context} changed implementation gates")
    if gates.get("external-writes") != "pending" or gates.get("commit") != "pending" or gates.get("push") != "pending":
        raise SystemExit(f"implementation scope proposal after {context} changed release gates")
    if proposal.get("nextAction", {}).get("implementationAuthorized") is not False:
        raise SystemExit(f"implementation scope proposal after {context} authorized implementation early")
    if proposal.get("boundary") != {
        "mode": "read-only",
        "localWrites": False,
        "targetRepoMutation": False,
        "externalWrites": False,
        "networkCalls": False,
        "applicationSourceRead": False,
        "scopeApproved": False,
        "implementationStarted": False,
    }:
        raise SystemExit(f"implementation scope proposal after {context} exceeded its read-only boundary")


def assert_implementation_scope_approval_json(
    raw: str,
    proposal_path: Path,
    *,
    approver: str,
    approval_ref: str,
    approved_at: str,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        approval = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"failed to parse implementation scope approval after {context}") from error

    if (
        approval.get("kind") != "design-ai-implementation-scope-approval"
        or approval.get("schemaVersion") != 1
        or approval.get("status") != "approved-for-implementation"
        or approval.get("approver") != {
            "name": approver,
            "identity": "self-declared",
            "reference": approval_ref,
            "approvedAt": approved_at,
        }
    ):
        raise SystemExit(f"implementation scope approval after {context} changed identity or decision")
    proposal_source = proposal_path.read_text(encoding="utf-8")
    proposal_artifact = approval.get("proposal", {})
    if (
        proposal_artifact.get("source") != proposal_source
        or proposal_artifact.get("sha256") != hashlib.sha256(proposal_source.encode("utf-8")).hexdigest()
        or proposal_artifact.get("bytes") != len(proposal_source.encode("utf-8"))
        or proposal_artifact.get("value") != json.loads(proposal_source)
    ):
        raise SystemExit(f"implementation scope approval after {context} changed proposal identity")
    decision = approval.get("decision", {})
    if decision.get("authorizedGateIds") != ["source-inspection", "target-files"]:
        raise SystemExit(f"implementation scope approval after {context} changed implementation authority")
    if decision.get("remainingGateIds") != ["external-writes", "commit", "push"]:
        raise SystemExit(f"implementation scope approval after {context} changed remaining release gates")
    boundary = approval.get("boundary", {})
    if boundary.get("targetRepoMutation") is not False or boundary.get("implementationStarted") is not False:
        raise SystemExit(f"implementation scope approval after {context} claimed implementation work")
    for field in ["externalWritesAuthorized", "commitAuthorized", "pushAuthorized", "deploymentAuthorized"]:
        if boundary.get(field) is not False:
            raise SystemExit(f"implementation scope approval after {context} expanded {field}")
