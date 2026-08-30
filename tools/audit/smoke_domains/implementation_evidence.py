"""P11 implementation-evidence assertion contract."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

from .assertion_helpers import assert_no_ansi


def assert_implementation_evidence_json(
    raw: str,
    approval_path: Path,
    request_path: Path,
    target_root: Path,
    *,
    consumer: str,
    context: str,
    cmd: list[str],
) -> None:
    assert_no_ansi(raw, cmd)
    try:
        evidence = json.loads(raw)
    except json.JSONDecodeError as error:
        raise SystemExit(f"failed to parse implementation evidence after {context}") from error

    if (
        evidence.get("kind") != "design-ai-implementation-evidence"
        or evidence.get("schemaVersion") != 1
        or evidence.get("status") != "attention-required"
        or evidence.get("consumer") != consumer
    ):
        raise SystemExit(f"implementation evidence after {context} changed identity or status")
    for field, source_path in (("approval", approval_path), ("request", request_path)):
        source = source_path.read_text(encoding="utf-8")
        artifact = evidence.get(field, {})
        if (
            artifact.get("reference") != str(source_path.resolve())
            or artifact.get("source") != source
            or artifact.get("sha256") != hashlib.sha256(source.encode("utf-8")).hexdigest()
            or artifact.get("bytes") != len(source.encode("utf-8"))
            or artifact.get("value") != json.loads(source)
        ):
            raise SystemExit(f"implementation evidence after {context} changed {field} source identity")
    observed = evidence.get("observed", {})
    changes = observed.get("worktreeChanges", [])
    if (
        observed.get("targetPath") != str(target_root)
        or observed.get("branch") != "main"
        or len(changes) != 1
        or changes[0].get("path") != "src/settings/view.tsx"
        or changes[0].get("reported") is not True
        or changes[0].get("selector") != "src/settings/**/*.tsx"
    ):
        raise SystemExit(f"implementation evidence after {context} changed observed Git evidence")
    verification = evidence.get("verification", {})
    if (
        verification.get("expectedCommands") != ["npm test", "npm run build"]
        or verification.get("summary") != {"pass": 0, "fail": 0, "notRun": 2}
        or len(evidence.get("observations", [])) != 3
        or evidence.get("artifacts") != []
        or not evidence.get("issues")
    ):
        raise SystemExit(f"implementation evidence after {context} promoted missing proof")
    boundary = evidence.get("boundary", {})
    if (
        boundary.get("mode") != "read-only-evidence"
        or boundary.get("verificationCommandsExecuted") != []
        or boundary.get("evidenceFilesRead") != []
        or boundary.get("applicationSourceRead") is not False
    ):
        raise SystemExit(f"implementation evidence after {context} changed its read boundary")
    for field in [
        "localWrites", "targetRepoMutation", "externalWrites", "networkCalls",
        "implementationPerformed", "commitAuthorized", "commitPerformed",
        "pushAuthorized", "pushPerformed", "deploymentAuthorized", "deploymentPerformed",
    ]:
        if boundary.get(field) is not False:
            raise SystemExit(f"implementation evidence after {context} expanded {field}")
