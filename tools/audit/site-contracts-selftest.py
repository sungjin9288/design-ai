#!/usr/bin/env python3
"""Run isolated positive and negative fixtures for the Website Console smoke domain."""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path
from typing import Callable

from smoke_domains import site_contracts
from smoke_domains.site_contracts import EXPECTED_SITE_BUNDLE_MCP_PROBE_IDS
from smoke_domains.site_runner import (
    SITE_SMOKE_PLAN,
    SiteSmokePhaseAuthority,
    assert_site_smoke_plan,
)
from smoke_domains.site_validators import (
    assert_site_bundle_mcp_probes_payload,
    assert_site_repair_apply_report_payload,
    assert_site_repair_guidance_report_contract,
    assert_site_repair_preview_report_payload,
    site_guidance_command,
    site_mcp_probe_embedded_command,
)


# Review contract and command-order changes explicitly before updating this digest.
SITE_CONTRACT_SNAPSHOT_SHA256 = "3e68a2f32e6ee1b3c5d1cb0311ad96d60c8107df8a9129e55e3b312aa00312d7"


def site_contract_snapshot() -> str:
    expected_fields = {
        name: value
        for name, value in sorted(vars(site_contracts).items())
        if name.startswith("EXPECTED_SITE_")
    }
    reference_cmd = ["npm", "exec", "--", "design-ai", "site", "--stdin", "--json"]
    guidance_command = "design-ai site workspace.json --bundle-repair --json"
    probe_payload = {
        "commands": {
            "mcpCheckProbesJsonOut": (
                "design-ai site <workspace.json> --mcp-check --probes --json --out mcp-check-probes.json"
            )
        }
    }
    payload = {
        "expectedFields": expected_fields,
        "guidanceCommand": site_guidance_command(guidance_command, reference_cmd, context="snapshot"),
        "probeCommand": site_mcp_probe_embedded_command(
            probe_payload,
            "mcpCheckProbesJsonOut",
            reference_cmd,
            context="snapshot",
            output_path="/tmp/mcp-check-probes.json",
        ),
    }
    return json.dumps(payload, ensure_ascii=False, separators=(",", ":"))


def expect_system_exit(callback: Callable[[], object], expected: str) -> None:
    try:
        callback()
    except SystemExit as error:
        if expected not in str(error):
            raise SystemExit(
                f"site contracts self-test expected {expected!r}, got {str(error)!r}"
            ) from error
        return
    raise SystemExit(f"site contracts self-test expected failure containing {expected!r}")


def run_self_test() -> int:
    assert_site_smoke_plan("installed-bin", actual=SITE_SMOKE_PLAN)
    assert_site_smoke_plan("npm-exec", actual=SITE_SMOKE_PLAN)
    expect_system_exit(
        lambda: assert_site_smoke_plan("installed-bin", actual=SITE_SMOKE_PLAN[:-1]),
        "phase missing",
    )
    expect_system_exit(
        lambda: assert_site_smoke_plan("installed-bin", actual=SITE_SMOKE_PLAN + (SITE_SMOKE_PLAN[-1],)),
        "phase duplicate",
    )
    expect_system_exit(
        lambda: assert_site_smoke_plan(
            "installed-bin",
            actual=(SITE_SMOKE_PLAN[1], SITE_SMOKE_PLAN[0], *SITE_SMOKE_PLAN[2:]),
        ),
        "phase order changed",
    )
    unknown_authority = SiteSmokePhaseAuthority("npm-exec")
    unknown_authority.advance(SITE_SMOKE_PLAN[0])
    expect_system_exit(
        lambda: unknown_authority.advance("unknown-phase"),
        "phase unknown",
    )
    snapshot = site_contract_snapshot()
    digest = hashlib.sha256(snapshot.encode("utf-8")).hexdigest()
    if digest != SITE_CONTRACT_SNAPSHOT_SHA256:
        raise SystemExit(
            "site contracts self-test snapshot changed: "
            f"expected {SITE_CONTRACT_SNAPSHOT_SHA256}, got {digest}"
        )

    bundle_dir = Path("/tmp/smoke-bundle")
    guidance = {
        "available": True,
        "targetRepoMutation": False,
        "externalCalls": False,
        "applyCommand": "design-ai site smoke-bundle --bundle-repair --yes --json",
        "previewReportCommand": (
            "design-ai site smoke-bundle --bundle-repair --json --out /tmp/smoke-bundle-repair-preview.json"
        ),
        "applyReportCommand": (
            "design-ai site smoke-bundle --bundle-repair --yes --json --out /tmp/smoke-bundle-repair-applied.json"
        ),
    }
    assert_site_repair_guidance_report_contract(guidance, bundle_dir=bundle_dir, context="self-test")
    assert_site_repair_preview_report_payload({"dryRun": True, "applied": False}, context="self-test")
    assert_site_repair_apply_report_payload(
        {
            "status": "pass",
            "dryRun": False,
            "applied": True,
            "before": {"status": "fail"},
            "after": {"status": "pass", "generatedDriftFiles": []},
            "written": {"count": 9},
        },
        context="self-test",
    )
    probe_items = [
        {
            "id": probe_id,
            "key": probe_id,
            "label": probe_id,
            "requestedStatus": "required",
            "level": "pass",
            "passed": True,
            "message": "verified",
            "evidence": ["fixture"],
            "actions": [],
        }
        for probe_id in EXPECTED_SITE_BUNDLE_MCP_PROBE_IDS
    ]
    probe_payload = {
        "enabled": True,
        "mode": "read-only-local",
        "externalCalls": False,
        "status": "pass",
        "count": 4,
        "pass": 4,
        "warn": 0,
        "fail": 0,
        "items": probe_items,
    }
    assert_site_bundle_mcp_probes_payload(probe_payload, context="self-test")
    expect_system_exit(
        lambda: site_guidance_command("design-ai learn --stats", ["design-ai", "site"], context="self-test"),
        "not a design-ai site command",
    )
    expect_system_exit(
        lambda: site_mcp_probe_embedded_command({}, "mcpPlanProbesJson", ["design-ai", "site"], context="self-test"),
        "missing commands",
    )
    expect_system_exit(
        lambda: assert_site_repair_preview_report_payload(
            {"dryRun": False, "applied": False},
            context="self-test",
        ),
        "payload changed",
    )
    expect_system_exit(
        lambda: assert_site_bundle_mcp_probes_payload(
            {**probe_payload, "status": "warn"},
            context="self-test",
        ),
        "status changed",
    )
    print("Site smoke contracts self-test passed")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--self-test", action="store_true", help="Run isolated site contract fixtures")
    args = parser.parse_args()
    if not args.self_test:
        parser.error("--self-test is required")
    return run_self_test()


if __name__ == "__main__":
    sys.exit(main())
