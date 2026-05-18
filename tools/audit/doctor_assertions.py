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


def assert_doctor_report_clean(report: dict, *, context: str) -> None:
    summary = report.get("summary", {})
    if summary.get("fail", 0) != 0 or summary.get("warn", 0) != 0:
        raise SystemExit(f"doctor reported warning(s) or failure(s) after {context}")

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


def _passing_report() -> dict:
    return {
        "summary": {"pass": len(EXPECTED_DOCTOR_PASS_LABELS), "warn": 0, "fail": 0},
        "checks": [
            {"label": label, "status": "PASS"}
            for label in sorted(EXPECTED_DOCTOR_PASS_LABELS)
        ],
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
    _expect_assertion_failure(
        warning_report,
        context=context,
        expected="warning",
    )

    failed_check_report = _passing_report()
    for check in failed_check_report["checks"]:
        if check["label"] == "Node runtime":
            check["status"] = "FAIL"
            break
    _expect_assertion_failure(
        failed_check_report,
        context=context,
        expected="Node runtime=FAIL",
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
