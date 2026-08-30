"""Pure P11 implementation-evidence request fixtures."""
from __future__ import annotations


def implementation_evidence_request_fixture(status_entry: str) -> dict[str, object]:
    return {
        "kind": "design-ai-implementation-evidence-request",
        "schemaVersion": 1,
        "consumer": "package-smoke-agent",
        "implementationStartedAt": "2026-07-15T12:01:00.000Z",
        "implementationCompletedAt": "2026-07-15T12:02:00.000Z",
        "executedWork": [
            {
                "statusEntry": status_entry,
                "path": "src/settings/view.tsx",
                "summary": "Implemented the approved settings action.",
            }
        ],
        "verificationResults": [
            {
                "command": command,
                "status": "not-run",
                "startedAt": "",
                "completedAt": "",
                "exitCode": None,
                "summary": "Not run during package contract smoke.",
                "artifacts": [],
            }
            for command in ["npm test", "npm run build"]
        ],
        "observations": [
            {
                "id": "a11y",
                "category": "accessibility",
                "status": "unverified",
                "summary": "Not exercised.",
                "artifacts": [],
            },
            {
                "id": "responsive",
                "category": "responsive",
                "status": "unverified",
                "summary": "Not exercised.",
                "artifacts": [],
            },
            {
                "id": "browser",
                "category": "browser",
                "status": "unverified",
                "summary": "Not exercised.",
                "artifacts": [],
            },
        ],
        "remainingRisks": [],
    }
