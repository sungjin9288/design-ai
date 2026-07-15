#!/usr/bin/env python3
"""Load and validate the canonical design-ai capability identity contract."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CAPABILITY_MANIFEST_PATH = ROOT / "cli" / "lib" / "capability-manifest.json"
EXPECTED_COUNTS = {
    "routes": 24,
    "install.skills": 21,
    "install.commands": 16,
    "install.agents": 4,
    "mcp.tools": 29,
    "mcp.learningProfileWriteTools": 3,
    "sdk.exports": 20,
    "sdk.learnMethods": 3,
}


def _validate_string_array(value: object, field: str) -> list[str]:
    if not isinstance(value, list) or any(
        not isinstance(item, str) or not item.strip()
        for item in value
    ):
        raise SystemExit(f"capability manifest {field} must be an array of non-empty strings")
    if len(set(value)) != len(value):
        raise SystemExit(f"capability manifest {field} must not contain duplicates")
    expected_count = EXPECTED_COUNTS[field]
    if len(value) != expected_count:
        raise SystemExit(
            f"capability manifest {field} must contain {expected_count} entries, got {len(value)}"
        )
    return value


def validate_capability_manifest(manifest: object) -> dict[str, object]:
    if not isinstance(manifest, dict):
        raise SystemExit("capability manifest must be a JSON object")
    if manifest.get("schemaVersion") != 1:
        raise SystemExit("capability manifest schemaVersion must be 1")
    if set(manifest) != {"schemaVersion", "routes", "install", "mcp", "sdk"}:
        raise SystemExit("capability manifest root sections changed")

    install = manifest.get("install")
    mcp = manifest.get("mcp")
    sdk = manifest.get("sdk")
    if not isinstance(install, dict) or set(install) != {"skills", "commands", "agents"}:
        raise SystemExit("capability manifest install sections changed")
    if not isinstance(mcp, dict) or set(mcp) != {"tools", "learningProfileWriteTools"}:
        raise SystemExit("capability manifest mcp sections changed")
    if not isinstance(sdk, dict) or set(sdk) != {"exports", "learnMethods"}:
        raise SystemExit("capability manifest sdk sections changed")

    _validate_string_array(manifest.get("routes"), "routes")
    _validate_string_array(install.get("skills"), "install.skills")
    _validate_string_array(install.get("commands"), "install.commands")
    _validate_string_array(install.get("agents"), "install.agents")
    tools = _validate_string_array(mcp.get("tools"), "mcp.tools")
    write_tools = _validate_string_array(
        mcp.get("learningProfileWriteTools"),
        "mcp.learningProfileWriteTools",
    )
    _validate_string_array(sdk.get("exports"), "sdk.exports")
    _validate_string_array(sdk.get("learnMethods"), "sdk.learnMethods")
    if not set(write_tools).issubset(tools):
        raise SystemExit("capability manifest learning write tools must be listed in mcp.tools")
    return manifest


def load_capability_manifest(path: Path = CAPABILITY_MANIFEST_PATH) -> dict[str, object]:
    try:
        manifest = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        raise SystemExit(f"failed to load capability manifest: {path}") from error
    return validate_capability_manifest(manifest)


SOURCE_CAPABILITIES = load_capability_manifest()


def _expect_failure(manifest: object, expected: str) -> None:
    try:
        validate_capability_manifest(manifest)
    except SystemExit as error:
        if expected not in str(error):
            raise SystemExit(f"self-test expected {expected!r}, got {error!s}") from error
        return
    raise SystemExit(f"self-test expected capability validation failure: {expected}")


def run_self_test() -> None:
    validate_capability_manifest(json.loads(json.dumps(SOURCE_CAPABILITIES)))

    cases = []
    invalid = json.loads(json.dumps(SOURCE_CAPABILITIES))
    invalid["schemaVersion"] = 2
    cases.append((invalid, "schemaVersion must be 1"))
    invalid = json.loads(json.dumps(SOURCE_CAPABILITIES))
    invalid["unexpected"] = []
    cases.append((invalid, "root sections changed"))
    invalid = json.loads(json.dumps(SOURCE_CAPABILITIES))
    invalid["routes"][0] = "   "
    cases.append((invalid, "non-empty strings"))
    invalid = json.loads(json.dumps(SOURCE_CAPABILITIES))
    invalid["routes"][-1] = invalid["routes"][0]
    cases.append((invalid, "must not contain duplicates"))
    invalid = json.loads(json.dumps(SOURCE_CAPABILITIES))
    invalid["install"]["commands"].pop()
    cases.append((invalid, "must contain 16 entries"))
    invalid = json.loads(json.dumps(SOURCE_CAPABILITIES))
    invalid["mcp"]["learningProfileWriteTools"][-1] = "design_ai_unknown_write"
    cases.append((invalid, "must be listed in mcp.tools"))

    for manifest, expected in cases:
        _expect_failure(manifest, expected)
    print("Capability manifest self-test passed")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()
    if args.self_test:
        run_self_test()
        return
    print(f"Capability manifest passed: {CAPABILITY_MANIFEST_PATH}")


if __name__ == "__main__":
    main()
