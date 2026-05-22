"""Shared assertions for design-ai doctor JSON reports used by smoke tests."""
from __future__ import annotations

import argparse

EXPECTED_DOCTOR_PASS_LABELS = {
    "Source layout",
    "Version alignment",
    "Manifest paths",
    "Node runtime",
    "Python runtime",
    "Audit runner",
    "Audit scripts",
    "Doctor assertions helper",
    "Smoke assertions helper",
    "Example QA audit",
    "Package contents check",
    "Package smoke check",
    "Registry smoke check",
    "Installed skills",
    "Installed agents",
    "Installed slash commands",
}


def _assert_keys(value: dict, expected: list[str], *, label: str, context: str) -> None:
    actual = list(value)
    if actual != expected:
        raise SystemExit(
            f"doctor JSON {label} keys changed after {context}: "
            f"expected {expected}, got {actual}"
        )


def _assert_non_empty_string(value: object, *, label: str, context: str) -> None:
    if not isinstance(value, str) or not value:
        raise SystemExit(f"doctor JSON {label} after {context} is missing or not a string")


def _assert_non_negative_int(value: object, *, label: str, context: str) -> None:
    if type(value) is not int or value < 0:
        raise SystemExit(f"doctor JSON {label} after {context} is missing or not a non-negative integer")


def assert_doctor_report_clean(report: dict, *, context: str) -> None:
    if not isinstance(report, dict):
        raise SystemExit(f"doctor JSON after {context} is not an object")

    _assert_keys(report, ["context", "checks", "summary", "fix"], label="top-level", context=context)

    report_context = report["context"]
    if not isinstance(report_context, dict):
        raise SystemExit(f"doctor JSON context after {context} is not an object")
    _assert_keys(
        report_context,
        ["sourceRoot", "claudeHome", "prefix", "expected"],
        label="context",
        context=context,
    )
    _assert_non_empty_string(report_context.get("sourceRoot"), label="context.sourceRoot", context=context)
    _assert_non_empty_string(report_context.get("claudeHome"), label="context.claudeHome", context=context)
    _assert_non_empty_string(report_context.get("prefix"), label="context.prefix", context=context)

    expected = report_context["expected"]
    if not isinstance(expected, dict):
        raise SystemExit(f"doctor JSON context.expected after {context} is not an object")
    _assert_keys(expected, ["skills", "agents", "commands"], label="context.expected", context=context)
    for key in ("skills", "agents", "commands"):
        _assert_non_negative_int(expected.get(key), label=f"context.expected.{key}", context=context)

    checks = report["checks"]
    if not isinstance(checks, list) or not checks:
        raise SystemExit(f"doctor JSON checks after {context} is missing or empty")
    for index, check in enumerate(checks):
        if not isinstance(check, dict):
            raise SystemExit(f"doctor JSON checks[{index}] after {context} is not an object")
        _assert_keys(check, ["status", "label", "detail", "action"], label=f"checks[{index}]", context=context)
        if check.get("status") not in {"PASS", "WARN", "FAIL"}:
            raise SystemExit(f"doctor JSON checks[{index}].status after {context} is invalid")
        _assert_non_empty_string(check.get("label"), label=f"checks[{index}].label", context=context)
        _assert_non_empty_string(check.get("detail"), label=f"checks[{index}].detail", context=context)
        if not isinstance(check.get("action"), str):
            raise SystemExit(f"doctor JSON checks[{index}].action after {context} is not a string")

    summary = report.get("summary", {})
    if not isinstance(summary, dict):
        raise SystemExit(f"doctor JSON summary after {context} is not an object")
    _assert_keys(summary, ["pass", "warn", "fail"], label="summary", context=context)
    for key in ("pass", "warn", "fail"):
        _assert_non_negative_int(summary.get(key), label=f"summary.{key}", context=context)

    actual_summary = {
        "pass": sum(1 for check in checks if check.get("status") == "PASS"),
        "warn": sum(1 for check in checks if check.get("status") == "WARN"),
        "fail": sum(1 for check in checks if check.get("status") == "FAIL"),
    }
    if summary != actual_summary:
        raise SystemExit(
            f"doctor JSON summary after {context} does not match check statuses: "
            f"expected {actual_summary}, got {summary}"
        )

    fix = report["fix"]
    if not isinstance(fix, dict):
        raise SystemExit(f"doctor JSON fix after {context} is not an object")
    _assert_keys(fix, ["attempted", "applied", "reason"], label="fix", context=context)
    if not isinstance(fix.get("attempted"), bool) or not isinstance(fix.get("applied"), bool):
        raise SystemExit(f"doctor JSON fix booleans after {context} are invalid")
    if not isinstance(fix.get("reason"), str):
        raise SystemExit(f"doctor JSON fix.reason after {context} is not a string")

    check_statuses = {
        check.get("label"): check.get("status")
        for check in report.get("checks", [])
        if isinstance(check, dict)
    }
    missing_or_failed = sorted(
        f"{label}={check_statuses.get(label, 'missing')}"
        for label in EXPECTED_DOCTOR_PASS_LABELS
        if check_statuses.get(label) != "PASS"
    )
    if missing_or_failed:
        raise SystemExit(
            f"doctor did not report every required {context} check as PASS: "
            + ", ".join(missing_or_failed)
        )

    if summary.get("fail", 0) != 0 or summary.get("warn", 0) != 0:
        raise SystemExit(f"doctor reported warning(s) or failure(s) after {context}")


def _passing_report() -> dict:
    return {
        "context": {
            "sourceRoot": "/tmp/design-ai",
            "claudeHome": "/tmp/claude",
            "prefix": "design-",
            "expected": {
                "skills": 19,
                "agents": 4,
                "commands": 16,
            },
        },
        "checks": [
            {
                "status": "PASS",
                "label": label,
                "detail": f"{label} fixture passed",
                "action": "",
            }
            for label in sorted(EXPECTED_DOCTOR_PASS_LABELS)
        ],
        "summary": {"pass": len(EXPECTED_DOCTOR_PASS_LABELS), "warn": 0, "fail": 0},
        "fix": {
            "attempted": False,
            "applied": False,
            "reason": "",
        },
    }


def _expect_assertion_failure(report: dict, *, context: str, expected: str) -> None:
    try:
        assert_doctor_report_clean(report, context=context)
    except SystemExit as error:
        if expected not in str(error):
            raise
    else:
        raise SystemExit(f"self-test failed: expected doctor assertion failure containing {expected!r}")


def run_self_test(*, context: str = "doctor assertion self-test", quiet: bool = False) -> None:
    assert_doctor_report_clean(_passing_report(), context=context)

    missing_report = _passing_report()
    missing_report["summary"]["pass"] -= 1
    missing_report["checks"] = [
        check
        for check in missing_report["checks"]
        if check["label"] != "Registry smoke check"
    ]
    _expect_assertion_failure(
        missing_report,
        context=context,
        expected="Registry smoke check=missing",
    )

    warning_report = _passing_report()
    warning_report["summary"]["warn"] = 1
    warning_report["summary"]["pass"] -= 1
    warning_report["checks"][0]["status"] = "WARN"
    _expect_assertion_failure(
        warning_report,
        context=context,
        expected="WARN",
    )

    failed_check_report = _passing_report()
    for check in failed_check_report["checks"]:
        if check["label"] == "Node runtime":
            check["status"] = "FAIL"
            break
    failed_check_report["summary"]["pass"] -= 1
    failed_check_report["summary"]["fail"] = 1
    _expect_assertion_failure(
        failed_check_report,
        context=context,
        expected="Node runtime=FAIL",
    )

    missing_fix_report = _passing_report()
    missing_fix_report.pop("fix")
    _expect_assertion_failure(
        missing_fix_report,
        context=context,
        expected="top-level keys changed",
    )

    mismatched_summary_report = _passing_report()
    mismatched_summary_report["summary"]["pass"] -= 1
    _expect_assertion_failure(
        mismatched_summary_report,
        context=context,
        expected="does not match check statuses",
    )

    changed_check_shape_report = _passing_report()
    changed_check_shape_report["checks"][0].pop("action")
    _expect_assertion_failure(
        changed_check_shape_report,
        context=context,
        expected="checks[0] keys changed",
    )

    if not quiet:
        print("Doctor assertions self-test passed")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--self-test",
        action="store_true",
        help="Run local doctor JSON assertion fixtures",
    )
    args = parser.parse_args()

    if args.self_test:
        run_self_test()
        return

    run_self_test()


if __name__ == "__main__":
    main()
