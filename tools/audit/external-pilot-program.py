#!/usr/bin/env python3
"""Validate the P14 external-pilot launch boundary."""

from __future__ import annotations

import argparse
import copy
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_PROGRAM = ROOT / "docs" / "pilots" / "external" / "program.json"

EXPECTED_SEGMENTS = [
    "marketing-site",
    "app-workflow",
    "korean-commerce-fintech",
]
EXPECTED_MEASURES = [
    "time-to-first-useful-artifact",
    "finding-decisions",
    "approval-friction",
    "implementation-completion",
    "unresolved-risk",
    "participant-feedback",
]
ARTIFACT_KEYS = [
    "intake",
    "consent",
    "workflow",
    "implementationEvidence",
    "pilotRecord",
    "pilotEvidence",
    "feedback",
]


def require_keys(value: dict, keys: list[str], field: str) -> None:
    if not isinstance(value, dict) or sorted(value) != sorted(keys):
        raise ValueError(f"{field} keys must be exactly: {', '.join(keys)}")


def require_non_empty_strings(values: list[str], field: str, minimum: int) -> None:
    if not isinstance(values, list) or len(values) < minimum:
        raise ValueError(f"{field} must contain at least {minimum} entries")
    if any(not isinstance(value, str) or not value.strip() for value in values):
        raise ValueError(f"{field} entries must be non-empty strings")


def validate_slot(slot: dict, index: int) -> None:
    field = f"slots[{index}]"
    require_keys(
        slot,
        [
            "id",
            "segment",
            "status",
            "recruitment",
            "owner",
            "consent",
            "target",
            "measures",
            "stopConditions",
            "artifacts",
        ],
        field,
    )
    if slot["status"] != "awaiting-owner":
        raise ValueError(f"{field}.status must remain awaiting-owner before real consent")
    if not isinstance(slot["id"], str) or not slot["id"].strip():
        raise ValueError(f"{field}.id must be a non-empty string")

    recruitment = slot["recruitment"]
    require_keys(recruitment, ["message", "eligibility", "dataBoundary"], f"{field}.recruitment")
    if not isinstance(recruitment["message"], str) or not recruitment["message"].strip():
        raise ValueError(f"{field}.recruitment.message must be a non-empty string")
    require_non_empty_strings(recruitment["eligibility"], f"{field}.recruitment.eligibility", 4)
    require_non_empty_strings(recruitment["dataBoundary"], f"{field}.recruitment.dataBoundary", 3)

    owner = slot["owner"]
    require_keys(owner, ["status", "relationship", "contactReference"], f"{field}.owner")
    if owner != {
        "status": "not-identified",
        "relationship": "external-required",
        "contactReference": "",
    }:
        raise ValueError(f"{field}.owner must not imply an identified participant")

    consent = slot["consent"]
    require_keys(
        consent,
        ["status", "approver", "reference", "approvedAt", "evidenceCollection", "targetMutation"],
        f"{field}.consent",
    )
    expected_consent = {
        "status": "not-collected",
        "approver": "",
        "reference": "",
        "approvedAt": "",
        "evidenceCollection": False,
        "targetMutation": False,
    }
    if consent != expected_consent:
        raise ValueError(f"{field}.consent must remain empty and unapproved")

    target = slot["target"]
    require_keys(target, ["repositoryUrl", "localPath", "artifact", "allowedSelectors"], f"{field}.target")
    if target != {"repositoryUrl": "", "localPath": "", "artifact": "", "allowedSelectors": []}:
        raise ValueError(f"{field}.target must remain empty before owner consent")

    measures = slot["measures"]
    if not isinstance(measures, list) or [measure.get("id") for measure in measures] != EXPECTED_MEASURES:
        raise ValueError(f"{field}.measures must preserve the canonical measurement order")
    for measure_index, measure in enumerate(measures):
        measure_field = f"{field}.measures[{measure_index}]"
        require_keys(measure, ["id", "status", "value", "method"], measure_field)
        if measure["status"] != "not-measured" or measure["value"] != "":
            raise ValueError(f"{measure_field} must not contain a result before participation")
        if not isinstance(measure["method"], str) or not measure["method"].strip():
            raise ValueError(f"{measure_field}.method must explain how evidence will be derived")

    require_non_empty_strings(slot["stopConditions"], f"{field}.stopConditions", 5)
    require_keys(slot["artifacts"], ARTIFACT_KEYS, f"{field}.artifacts")
    if slot["artifacts"] != {key: "" for key in ARTIFACT_KEYS}:
        raise ValueError(f"{field}.artifacts must remain empty before participation")


def validate_program(program: dict) -> dict:
    require_keys(
        program,
        ["kind", "schemaVersion", "status", "claimBoundary", "decisionRule", "slots"],
        "program",
    )
    if program["kind"] != "design-ai-external-pilot-program" or program["schemaVersion"] != 1:
        raise ValueError("program must be design-ai-external-pilot-program v1")
    if program["status"] != "recruitment-ready-no-participants":
        raise ValueError("program status must keep participation explicitly unverified")
    if not isinstance(program["claimBoundary"], str) or "no identified owner" not in program["claimBoundary"]:
        raise ValueError("program claimBoundary must state that no owner is identified")

    rule = program["decisionRule"]
    require_keys(
        rule,
        ["minimumIndependentPilotRecords", "requireDistinctProjectOwners", "selection", "adoptionClaim"],
        "decisionRule",
    )
    if rule["minimumIndependentPilotRecords"] != 2 or rule["requireDistinctProjectOwners"] is not True:
        raise ValueError("decisionRule must require two independent records from distinct owners")
    if rule["adoptionClaim"] != "blocked-until-real-participation":
        raise ValueError("decisionRule must block adoption claims before real participation")
    if not isinstance(rule["selection"], str) or not rule["selection"].strip():
        raise ValueError("decisionRule.selection must explain the capability threshold")

    slots = program["slots"]
    if not isinstance(slots, list) or any(not isinstance(slot, dict) for slot in slots):
        raise ValueError("program slots must be an array of objects")
    if [slot.get("segment") for slot in slots] != EXPECTED_SEGMENTS:
        raise ValueError("program must contain the three canonical pilot segments in order")
    if len({slot.get("id") for slot in slots}) != 3:
        raise ValueError("program slots must use three unique ids")
    for index, slot in enumerate(slots):
        validate_slot(slot, index)
    return program


def load_program(path: Path) -> dict:
    return validate_program(json.loads(path.read_text(encoding="utf-8")))


def run_self_test() -> None:
    program = load_program(DEFAULT_PROGRAM)

    claimed_consent = copy.deepcopy(program)
    claimed_consent["slots"][0]["consent"]["status"] = "approved"
    try:
        validate_program(claimed_consent)
    except ValueError:
        pass
    else:
        raise AssertionError("self-test accepted consent without a complete consent record")

    invented_measure = copy.deepcopy(program)
    invented_measure["slots"][1]["measures"][0]["value"] = "90 seconds"
    try:
        validate_program(invented_measure)
    except ValueError:
        pass
    else:
        raise AssertionError("self-test accepted an invented measurement")

    print("External pilot program self-test passed")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("path", nargs="?", type=Path, default=DEFAULT_PROGRAM)
    parser.add_argument("--self-test", action="store_true")
    args = parser.parse_args()

    if args.self_test:
        run_self_test()
        return

    program = load_program(args.path)
    print(
        "External pilot program check passed: "
        f"{len(program['slots'])} recruitment-ready slots, 0 participants, adoption claim blocked"
    )


if __name__ == "__main__":
    main()
