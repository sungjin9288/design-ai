"""P9 target-repository intake smoke assertion."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

from .assertion_helpers import assert_no_ansi, assert_smoke_json_keys


def assert_target_repo_intake_json(
    raw: str,
    receipt_path: Path,
    target_root: Path,
    *,
    consumer: str,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        intake = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"failed to parse target repo intake JSON after {context}") from error

    assert_smoke_json_keys(
        intake,
        [
            "kind", "schemaVersion", "status", "consumer", "receipt", "target", "project",
            "git", "inspection", "issues", "remainingApprovals", "nextAction", "boundary",
        ],
        label="top-level",
        context=context,
        command_label="target repo intake JSON",
    )
    if (
        intake.get("kind") != "design-ai-target-repo-intake"
        or intake.get("schemaVersion") != 1
        or intake.get("status") != "ready-for-scope-review"
    ):
        raise SystemExit(f"target repo intake JSON after {context} changed its contract identity")

    receipt_source = receipt_path.read_text(encoding="utf-8")
    receipt_value = json.loads(receipt_source)
    receipt_link = intake.get("receipt")
    if receipt_link != {
        "reference": str(receipt_path.resolve()),
        "sha256": hashlib.sha256(receipt_source.encode("utf-8")).hexdigest(),
        "bytes": len(receipt_source.encode("utf-8")),
        "kind": "design-ai-review-handoff-receipt",
        "schemaVersion": 1,
        "status": "contract-validated",
        "consumer": consumer,
        "handoffSha256": receipt_value["handoff"]["sha256"],
        "reviewWorkflowSha256": receipt_value["handoff"]["value"]["artifacts"]["reviewWorkflow"]["sha256"],
        "remainingApprovals": receipt_value["remainingApprovals"],
    }:
        raise SystemExit(f"target repo intake JSON after {context} changed its receipt linkage")
    if intake.get("consumer") != {
        "name": consumer,
        "receiptConsumerMatch": True,
        "identity": "self-declared",
    }:
        raise SystemExit(f"target repo intake JSON after {context} changed its consumer boundary")

    target = intake.get("target", {})
    if (
        target.get("declaredPath") != str(target_root)
        or target.get("resolvedPath") != str(target_root.resolve())
        or target.get("pathMatch") is not True
        or target.get("repositoryUrlMatch") is not True
    ):
        raise SystemExit(f"target repo intake JSON after {context} changed its target identity")
    project = intake.get("project", {})
    if (
        project.get("metadataStatus") != "pass"
        or project.get("manifest") != "package.json"
        or project.get("packageManager") != "pnpm"
        or project.get("framework") != "Vite"
        or project.get("startCommand") != "pnpm run dev"
    ):
        raise SystemExit(f"target repo intake JSON after {context} changed project metadata")
    git = intake.get("git", {})
    if (
        git.get("status") != "pass"
        or git.get("repository") is not True
        or git.get("targetWithinRepository") is not True
        or git.get("branch") != "main"
        or git.get("clean") is not True
        or git.get("remoteMatch") is not True
        or git.get("changes") != {"total": 0, "entries": [], "truncated": False}
    ):
        raise SystemExit(f"target repo intake JSON after {context} changed Git evidence")
    inspection = intake.get("inspection", {})
    if (
        inspection.get("scope") != "root-metadata-and-git-state"
        or inspection.get("metadataFilesRead") != ["package.json"]
        or inspection.get("applicationSourceFilesRead") != []
        or not inspection.get("gitCommands")
    ):
        raise SystemExit(f"target repo intake JSON after {context} changed its inspection boundary")
    if any(issue.get("level") in {"warn", "fail"} for issue in intake.get("issues", [])):
        raise SystemExit(f"target repo intake JSON after {context} reported unexpected readiness issues")
    expected_approvals = list(dict.fromkeys([
        *receipt_value["remainingApprovals"],
        "implementation scope",
    ]))
    if intake.get("remainingApprovals") != receipt_value["remainingApprovals"]:
        raise SystemExit(f"target repo intake JSON after {context} changed remaining approvals")
    if intake.get("nextAction") != {
        "id": "implementation-scope-approval-required",
        "status": "pending",
        "summary": "Review the proposed files, scope, risks, and verification commands before implementation.",
        "approvalRequiredBefore": expected_approvals,
        "implementationAuthorized": False,
    }:
        raise SystemExit(f"target repo intake JSON after {context} changed its scope gate")
    if intake.get("boundary") != {
        "mode": "read-only",
        "localWrites": False,
        "targetRepoMutation": False,
        "externalWrites": False,
        "networkCalls": False,
        "previewStarted": False,
        "applicationSourceRead": False,
        "consumerIdentityVerified": False,
        "implementationStarted": False,
    }:
        raise SystemExit(f"target repo intake JSON after {context} exceeded its read-only boundary")
