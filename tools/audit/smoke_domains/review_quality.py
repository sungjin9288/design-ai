"""Shared P6 review-quality smoke assertions."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

from .assertion_helpers import assert_no_ansi, assert_smoke_json_keys


def assert_inspect_json(raw: str, *, context: str, cmd: list[str]) -> None:
    assert_no_ansi(raw, cmd)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"failed to parse inspect JSON after {context}") from error

    assert_smoke_json_keys(
        payload,
        ["kind", "schemaVersion", "generatedAt", "subject", "context", "boundary", "sources", "lenses", "findings", "summary", "approval"],
        label="top-level",
        context=context,
        command_label="inspect JSON",
    )
    if payload.get("kind") != "design-ai-quality-report" or payload.get("schemaVersion") != 1:
        raise SystemExit(f"inspect JSON after {context} kind or schema version changed")

    boundary = payload.get("boundary")
    if not (
        isinstance(boundary, dict)
        and boundary.get("mode") == "read-only"
        and boundary.get("targetRepoMutation") is False
        and boundary.get("externalWrites") is False
        and boundary.get("localEvidenceWrites") is False
    ):
        raise SystemExit(f"inspect JSON after {context} changed the read-only boundary")

    summary = payload.get("summary")
    if not (
        isinstance(summary, dict)
        and summary.get("status") == "fail"
        and summary.get("confirmedFindings") == 1
        and summary.get("unverifiedFindings") == 1
    ):
        raise SystemExit(f"inspect JSON after {context} lost the confirmed/unverified benchmark split")

    findings = payload.get("findings")
    if not (
        isinstance(findings, list)
        and len(findings) == 2
        and findings[0].get("status") == "confirmed"
        and findings[0].get("lens") == "accessibility"
        and findings[1].get("status") == "unverified"
    ):
        raise SystemExit(f"inspect JSON after {context} findings changed")

    expected_lenses = [
        "purpose-frequency",
        "response",
        "spatial-continuity",
        "interruptibility",
        "timing-cohesion",
        "performance",
        "accessibility",
        "responsive-resilience",
    ]
    lenses = payload.get("lenses")
    lens_ids = [item.get("id") for item in lenses] if isinstance(lenses, list) else []
    if lens_ids != expected_lenses:
        raise SystemExit(f"inspect JSON after {context} lens inventory changed")


def assert_review_comparison_json(
    raw: str,
    baseline_path: Path,
    candidate_path: Path,
    *,
    compact: bool,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        comparison = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"failed to parse review comparison JSON after {context}") from error

    expected_kind = "design-ai-review-comparison-summary" if compact else "design-ai-review-comparison"
    if (
        comparison.get("kind") != expected_kind
        or comparison.get("schemaVersion") != 1
        or comparison.get("status") != "attention-required"
    ):
        raise SystemExit(f"review comparison JSON after {context} changed identity or status")

    source_container = comparison.get("sources") if compact else comparison
    for field, source_path in (("baseline", baseline_path), ("candidate", candidate_path)):
        source_bytes = source_path.read_bytes()
        artifact = source_container.get(field, {}) if isinstance(source_container, dict) else {}
        if (
            artifact.get("reference") != str(source_path.resolve())
            or artifact.get("sha256") != hashlib.sha256(source_bytes).hexdigest()
            or artifact.get("bytes") != len(source_bytes)
        ):
            raise SystemExit(f"review comparison JSON after {context} lost {field} source identity")
        if not compact and (
            artifact.get("source") != source_bytes.decode("utf-8")
            or artifact.get("value") != json.loads(source_bytes)
        ):
            raise SystemExit(f"review comparison JSON after {context} changed {field} source content")

    summary = comparison.get("summary", {})
    if (
        summary.get("resolved") != 0
        or summary.get("persistent") != 2
        or summary.get("introduced") != 0
        or summary.get("uncertain") != 0
    ):
        raise SystemExit(f"review comparison JSON after {context} changed finding decisions")
    if comparison.get("approval") != {
        "status": "pending",
        "requiredBefore": ["target repository mutation", "commit", "push", "deployment", "external writes"],
    }:
        raise SystemExit(f"review comparison JSON after {context} changed its approval gate")
    boundary = comparison.get("boundary", {})
    if boundary != {
        "mode": "read-only-review-comparison",
        "localWrites": False,
        "targetRepoMutation": False,
        "externalWrites": False,
        "networkCalls": False,
        "boundedImprovementEstablished": False,
        "productionQualityEstablished": False,
        "adoptionEstablished": False,
    }:
        raise SystemExit(f"review comparison JSON after {context} expanded its claim or mutation boundary")
    if compact:
        representation = comparison.get("representation", {})
        if (
            representation.get("mode") != "compact"
            or representation.get("fullArtifactKind") != "design-ai-review-comparison"
            or representation.get("omittedFields") != [
                "baseline.source", "baseline.value", "candidate.source", "candidate.value",
            ]
        ):
            raise SystemExit(f"review comparison JSON after {context} changed compact representation evidence")


def review_workflow_digest(value: object) -> str:
    encoded = json.dumps(value, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(encoded).hexdigest()
