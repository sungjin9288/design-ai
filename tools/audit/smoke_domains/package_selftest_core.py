"""Package smoke self-test: check artifacts, site payloads, MCP probes, agent backlog, audit cleanup."""
from __future__ import annotations

import json
import tarfile

from capability_manifest import SOURCE_CAPABILITIES as EXPECTED_CAPABILITIES
from pathlib import Path
from smoke_assertions import (
    assert_output_write_success,
    assert_site_mcp_check_probes_human,
    assert_site_mcp_check_probes_human_file_output,
    assert_site_mcp_check_probes_json_file_output,
    assert_site_mcp_plan_probes_json_file_output,
    assert_site_next_actions_human_file_output,
    assert_site_next_actions_json_file_output,
    expect_self_test_failure,
    passing_doctor_report_json,
    passing_site_mcp_check_probes_human,
    passing_site_mcp_check_probes_json,
    passing_site_mcp_plan_json,
    passing_site_next_actions_human,
    passing_site_next_actions_json,
    site_mcp_probe_embedded_command,
)
from smoke_domains.package_learning_profile import assert_learning_feedback_json
from smoke_domains.package_learning_profile_audit import assert_learning_audit_cleanup_human
from smoke_domains.package_learning_profile_curation import assert_learning_curation_report
from smoke_domains.package_selftest_support import (
    assert_check_learning_capture_json,
    assert_doctor_report_file,
    assert_tarball_capability_manifest,
)


def _self_test_check_site_and_mcp(context, tmp):
    """Package smoke self-test: check artifacts, site payloads, and MCP probe contracts."""
    tarball_root = Path(tmp) / "tarball-root" / "package" / "cli" / "lib"
    tarball_root.mkdir(parents=True)
    packed_manifest_path = tarball_root / "capability-manifest.json"
    packed_manifest_path.write_text(
        json.dumps(EXPECTED_CAPABILITIES),
        encoding="utf-8",
    )
    packed_manifest_tarball = Path(tmp) / "capability-manifest.tgz"
    with tarfile.open(packed_manifest_tarball, "w:gz") as archive:
        archive.add(
            packed_manifest_path,
            arcname="package/cli/lib/capability-manifest.json",
        )
    assert_tarball_capability_manifest(packed_manifest_tarball)

    drifted_capabilities = json.loads(json.dumps(EXPECTED_CAPABILITIES))
    drifted_capabilities["routes"][0] = "design-review-drifted"
    packed_manifest_path.write_text(
        json.dumps(drifted_capabilities),
        encoding="utf-8",
    )
    drifted_manifest_tarball = Path(tmp) / "capability-manifest-drifted.tgz"
    with tarfile.open(drifted_manifest_tarball, "w:gz") as archive:
        archive.add(
            packed_manifest_path,
            arcname="package/cli/lib/capability-manifest.json",
        )
    expect_self_test_failure(
        lambda: assert_tarball_capability_manifest(drifted_manifest_tarball),
        expected="differs from the verified source contract",
        scope="package smoke packed capability manifest",
    )

    report_path = Path(tmp) / "doctor.json"
    report_path.write_text(passing_doctor_report_json(), encoding="utf-8")
    assert_doctor_report_file(report_path, context=context)
    expect_self_test_failure(
        lambda: assert_doctor_report_file(Path(tmp) / "missing.json", context=context),
        expected="failed to read doctor JSON",
        scope="package smoke",
    )

    site_next_actions_out_path = Path(tmp) / "site-next-actions.json"
    site_next_actions_out_path.write_text(passing_site_next_actions_json(), encoding="utf-8")
    site_next_actions_out_cmd = [
        "design-ai",
        "site",
        "--stdin",
        "--next-actions",
        "--json",
        "--out",
        str(site_next_actions_out_path),
        "--force",
    ]
    assert_site_next_actions_json_file_output(
        f"Wrote {site_next_actions_out_path}\n",
        site_next_actions_out_path.read_text(encoding="utf-8"),
        output_path=str(site_next_actions_out_path),
        context=f"{context} site next-actions JSON out",
        cmd=site_next_actions_out_cmd,
    )
    site_next_actions_human_out_path = Path(tmp) / "site-next-actions.md"
    site_next_actions_human_out_path.write_text(passing_site_next_actions_human(), encoding="utf-8")
    site_next_actions_human_out_cmd = [
        "design-ai",
        "site",
        "--stdin",
        "--next-actions",
        "--out",
        str(site_next_actions_human_out_path),
        "--force",
    ]
    assert_site_next_actions_human_file_output(
        f"Wrote {site_next_actions_human_out_path}\n",
        site_next_actions_human_out_path.read_text(encoding="utf-8"),
        output_path=str(site_next_actions_human_out_path),
        context=f"{context} site next-actions human out",
        cmd=site_next_actions_human_out_cmd,
    )
    expect_self_test_failure(
        lambda: assert_site_next_actions_human_file_output(
            f"Wrote {site_next_actions_human_out_path}\n",
            passing_site_next_actions_human().replace("does not call external MCPs", "may call external MCPs"),
            output_path=str(site_next_actions_human_out_path),
            context=f"{context} site next-actions human out",
            cmd=site_next_actions_human_out_cmd,
        ),
        expected="missing fragment",
        scope="package smoke",
    )

    site_mcp_check_probes_out_path = Path(tmp) / "site-mcp-check-probes.json"
    site_mcp_check_probes_out_path.write_text(passing_site_mcp_check_probes_json(), encoding="utf-8")
    site_mcp_check_probes_out_cmd = [
        "design-ai",
        "site",
        "--stdin",
        "--mcp-check",
        "--probes",
        "--json",
        "--out",
        str(site_mcp_check_probes_out_path),
        "--force",
    ]
    assert_site_mcp_check_probes_json_file_output(
        f"Wrote {site_mcp_check_probes_out_path}\n",
        site_mcp_check_probes_out_path.read_text(encoding="utf-8"),
        output_path=str(site_mcp_check_probes_out_path),
        context=f"{context} site mcp-check probes JSON out",
        cmd=site_mcp_check_probes_out_cmd,
    )
    assert_site_mcp_check_probes_human(
        passing_site_mcp_check_probes_human(),
        context=f"{context} site mcp-check probes human",
        cmd=["design-ai", "site", "--stdin", "--mcp-check", "--probes"],
    )
    site_mcp_check_probes_human_out_path = Path(tmp) / "site-mcp-check-probes.txt"
    site_mcp_check_probes_human_out_path.write_text(passing_site_mcp_check_probes_human(), encoding="utf-8")
    site_mcp_check_probes_human_out_cmd = [
        "design-ai",
        "site",
        "--stdin",
        "--mcp-check",
        "--probes",
        "--out",
        str(site_mcp_check_probes_human_out_path),
        "--force",
    ]
    assert_site_mcp_check_probes_human_file_output(
        f"Wrote {site_mcp_check_probes_human_out_path}\n",
        site_mcp_check_probes_human_out_path.read_text(encoding="utf-8"),
        output_path=str(site_mcp_check_probes_human_out_path),
        context=f"{context} site mcp-check probes human out",
        cmd=site_mcp_check_probes_human_out_cmd,
    )
    expect_self_test_failure(
        lambda: assert_site_mcp_check_probes_json_file_output(
            f"Wrote {site_mcp_check_probes_out_path}\n",
            site_mcp_check_probes_out_path.read_text(encoding="utf-8").replace(
                '"externalCalls": false',
                '"externalCalls": true',
            ),
            output_path=str(site_mcp_check_probes_out_path),
            context=f"{context} site mcp-check probes JSON out",
            cmd=site_mcp_check_probes_out_cmd,
        ),
        expected="without external calls",
        scope="package smoke",
    )

    site_mcp_plan_json_out_path = Path(tmp) / "site-mcp-plan-probes.json"
    site_mcp_plan_json_out_path.write_text(passing_site_mcp_plan_json(probes=True), encoding="utf-8")
    site_mcp_plan_json_out_cmd = [
        "design-ai",
        "site",
        "--stdin",
        "--mcp-plan",
        "--probes",
        "--json",
        "--out",
        str(site_mcp_plan_json_out_path),
        "--force",
    ]
    assert_site_mcp_plan_probes_json_file_output(
        f"Wrote {site_mcp_plan_json_out_path}\n",
        site_mcp_plan_json_out_path.read_text(encoding="utf-8"),
        output_path=str(site_mcp_plan_json_out_path),
        context=f"{context} site mcp-plan probes JSON out",
        cmd=site_mcp_plan_json_out_cmd,
    )
    site_mcp_plan_human_out_path = Path(tmp) / "site-mcp-plan-probes-human.txt"
    site_mcp_plan_human_out_path.write_text(passing_site_mcp_check_probes_human(), encoding="utf-8")
    site_mcp_plan_human_out_cmd = site_mcp_probe_embedded_command(
        json.loads(passing_site_mcp_plan_json(probes=True)),
        "mcpCheckProbesHumanOut",
        ["design-ai", "site", "--stdin", "--mcp-plan", "--probes", "--json"],
        output_path=str(site_mcp_plan_human_out_path),
        context=f"{context} site mcp-plan probes emitted human out command",
    )
    assert_site_mcp_check_probes_human_file_output(
        f"Wrote {site_mcp_plan_human_out_path}\n",
        site_mcp_plan_human_out_path.read_text(encoding="utf-8"),
        output_path=str(site_mcp_plan_human_out_path),
        context=f"{context} site mcp-plan probes emitted human out",
        cmd=site_mcp_plan_human_out_cmd,
    )
    site_mcp_plan_check_json_out_path = Path(tmp) / "site-mcp-plan-probes-check.json"
    site_mcp_plan_check_json_out_path.write_text(passing_site_mcp_check_probes_json(), encoding="utf-8")
    site_mcp_plan_check_json_out_cmd = site_mcp_probe_embedded_command(
        json.loads(passing_site_mcp_plan_json(probes=True)),
        "mcpCheckProbesJsonOut",
        ["design-ai", "site", "--stdin", "--mcp-plan", "--probes", "--json"],
        output_path=str(site_mcp_plan_check_json_out_path),
        context=f"{context} site mcp-plan probes emitted check JSON out command",
    )
    assert_site_mcp_check_probes_json_file_output(
        f"Wrote {site_mcp_plan_check_json_out_path}\n",
        site_mcp_plan_check_json_out_path.read_text(encoding="utf-8"),
        output_path=str(site_mcp_plan_check_json_out_path),
        context=f"{context} site mcp-plan probes emitted check JSON out",
        cmd=site_mcp_plan_check_json_out_cmd,
    )
    site_mcp_plan_emitted_json_out_path = Path(tmp) / "site-mcp-plan-probes-emitted.json"
    site_mcp_plan_emitted_json_out_path.write_text(passing_site_mcp_plan_json(probes=True), encoding="utf-8")
    site_mcp_plan_emitted_json_out_cmd = site_mcp_probe_embedded_command(
        json.loads(passing_site_mcp_plan_json(probes=True)),
        "mcpPlanProbesJsonOut",
        ["design-ai", "site", "--stdin", "--mcp-plan", "--probes", "--json"],
        output_path=str(site_mcp_plan_emitted_json_out_path),
        context=f"{context} site mcp-plan probes emitted plan JSON out command",
    )
    assert_site_mcp_plan_probes_json_file_output(
        f"Wrote {site_mcp_plan_emitted_json_out_path}\n",
        site_mcp_plan_emitted_json_out_path.read_text(encoding="utf-8"),
        output_path=str(site_mcp_plan_emitted_json_out_path),
        context=f"{context} site mcp-plan probes emitted plan JSON out",
        cmd=site_mcp_plan_emitted_json_out_cmd,
    )
    expect_self_test_failure(
        lambda: assert_site_mcp_check_probes_human_file_output(
            f"Wrote {site_mcp_plan_human_out_path}\n",
            site_mcp_plan_human_out_path.read_text(encoding="utf-8").replace(
                "Probe commands:",
                "Probe notes:",
            ),
            output_path=str(site_mcp_plan_human_out_path),
            context=f"{context} site mcp-plan probes emitted human out",
            cmd=site_mcp_plan_human_out_cmd,
        ),
        expected="Probe commands",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_site_mcp_check_probes_json_file_output(
            f"Wrote {site_mcp_plan_check_json_out_path}\n",
            site_mcp_plan_check_json_out_path.read_text(encoding="utf-8").replace(
                '"externalCalls": false',
                '"externalCalls": true',
            ),
            output_path=str(site_mcp_plan_check_json_out_path),
            context=f"{context} site mcp-plan probes emitted check JSON out",
            cmd=site_mcp_plan_check_json_out_cmd,
        ),
        expected="external calls",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_site_mcp_plan_probes_json_file_output(
            f"Wrote {site_mcp_plan_emitted_json_out_path}\n",
            site_mcp_plan_emitted_json_out_path.read_text(encoding="utf-8").replace(
                '"targetRepoMutation": false',
                '"targetRepoMutation": true',
            ),
            output_path=str(site_mcp_plan_emitted_json_out_path),
            context=f"{context} site mcp-plan probes emitted plan JSON out",
            cmd=site_mcp_plan_emitted_json_out_cmd,
        ),
        expected="local/read-only",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_site_mcp_plan_probes_json_file_output(
            f"Wrote {site_mcp_plan_json_out_path}\n",
            site_mcp_plan_json_out_path.read_text(encoding="utf-8").replace(
                '"externalCalls": false',
                '"externalCalls": true',
            ),
            output_path=str(site_mcp_plan_json_out_path),
            context=f"{context} site mcp-plan probes JSON out",
            cmd=site_mcp_plan_json_out_cmd,
        ),
        expected="local/read-only",
        scope="package smoke",
    )

    check_learning_profile_path = Path(tmp) / "check-learning.json"
    check_learning_entries = [
        {
            "id": "learn-check-keyboard",
            "category": "accessibility",
            "text": "Improve future outputs by addressing Keyboard and focus behavior: No keyboard or focus behavior note detected.",
            "source": "check:artifact",
            "createdAt": "2026-05-22T00:00:00.000Z",
        },
        {
            "id": "learn-check-responsive",
            "category": "workflow",
            "text": "Improve future outputs by addressing Responsive behavior: No mobile/desktop/responsive behavior note detected.",
            "source": "check:artifact",
            "createdAt": "2026-05-22T00:00:01.000Z",
        },
        {
            "id": "learn-check-screen-reader",
            "category": "accessibility",
            "text": "Improve future outputs by addressing Screen-reader semantics: No screen-reader or ARIA behavior note detected.",
            "source": "check:artifact",
            "createdAt": "2026-05-22T00:00:02.000Z",
        },
        {
            "id": "learn-check-misuse",
            "category": "workflow",
            "text": "Improve future outputs by addressing Misuse guidance: No Don't/avoid/anti-pattern guidance detected.",
            "source": "check:artifact",
            "createdAt": "2026-05-22T00:00:03.000Z",
        },
    ]
    check_learning_profile_path.write_text(
        json.dumps(
            {
                "version": 1,
                "updatedAt": "2026-05-22T00:00:03.000Z",
                "entries": check_learning_entries,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    check_learning_cmd = [
        "design-ai",
        "check",
        "check-learning.md",
        "--learn",
        "--yes",
        "--learning-file",
        str(check_learning_profile_path),
        "--json",
    ]
    check_learning_payload = {
        "filePath": "/tmp/check-learning.md",
        "status": "warn",
        "passes": 5,
        "warnings": 4,
        "failures": 0,
        "total": 9,
        "score": "5/9",
        "results": [],
        "learningCapture": {
            "file": str(check_learning_profile_path),
            "dryRun": False,
            "applied": True,
            "source": "check:artifact",
            "candidateCount": 4,
            "addedCount": 4,
            "skippedCount": 0,
            "count": 4,
            "entries": check_learning_entries,
            "skipped": [],
        },
    }
    assert_check_learning_capture_json(
        json.dumps(check_learning_payload),
        profile_path=check_learning_profile_path,
        expected_file_suffix="check-learning.md",
        context=context,
        cmd=check_learning_cmd,
    )
    expect_self_test_failure(
        lambda: assert_check_learning_capture_json(
            json.dumps({
                **check_learning_payload,
                "learningCapture": {
                    **check_learning_payload["learningCapture"],
                    "addedCount": 3,
                },
            }),
            profile_path=check_learning_profile_path,
            expected_file_suffix="check-learning.md",
            context=context,
            cmd=check_learning_cmd,
        ),
        expected="check learning capture counts changed",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_check_learning_capture_json(
            json.dumps({
                **check_learning_payload,
                "learningCapture": {
                    **check_learning_payload["learningCapture"],
                    "source": "check:component-spec",
                },
            }),
            profile_path=check_learning_profile_path,
            expected_file_suffix="check-learning.md",
            context=context,
            cmd=check_learning_cmd,
        ),
        expected="check learning capture metadata changed",
        scope="package smoke",
    )

    learning_profile_path = Path(tmp) / "learning.json"
    learn_feedback_cmd = [
        "design-ai",
        "learn",
        "--feedback",
        "Keep audit findings short and evidence-led",
        "--outcome",
        "keep",
        "--file",
        str(learning_profile_path),
        "--json",
    ]
    learning_feedback_payload = {
        "file": str(learning_profile_path),
        "feedback": {
            "outcome": "keep",
            "category": "workflow",
            "instruction": "Repeat in future outputs: Keep audit findings short and evidence-led",
        },
        "entry": {
            "id": "learn-feedback",
            "category": "workflow",
            "text": "Repeat in future outputs: Keep audit findings short and evidence-led",
            "source": "feedback:keep",
            "createdAt": "2026-05-22T00:00:00.000Z",
        },
        "count": 1,
    }
    assert_learning_feedback_json(
        json.dumps(learning_feedback_payload),
        profile_path=learning_profile_path,
        outcome="keep",
        category="workflow",
        expected_instruction="Repeat in future outputs: Keep audit findings short and evidence-led",
        expected_count=1,
        context=context,
        cmd=learn_feedback_cmd,
    )
    learning_feedback_out_path = Path(tmp) / "learning-feedback-out.json"
    learning_feedback_out_path.write_text(json.dumps(learning_feedback_payload), encoding="utf-8")
    learn_feedback_out_cmd = [
        "design-ai",
        "learn",
        "--feedback",
        "Keep audit findings short and evidence-led",
        "--outcome",
        "keep",
        "--file",
        str(learning_profile_path),
        "--json",
        "--out",
        str(learning_feedback_out_path),
        "--force",
    ]
    assert_output_write_success(
        f"Wrote {learning_feedback_out_path}\n",
        context=f"{context} feedback out",
        cmd=learn_feedback_out_cmd,
        expected_path=str(learning_feedback_out_path),
    )
    assert_learning_feedback_json(
        learning_feedback_out_path.read_text(encoding="utf-8"),
        profile_path=learning_profile_path,
        outcome="keep",
        category="workflow",
        expected_instruction="Repeat in future outputs: Keep audit findings short and evidence-led",
        expected_count=1,
        context=f"{context} feedback out file",
        cmd=learn_feedback_out_cmd,
    )
    return learn_feedback_cmd, learn_feedback_out_cmd, learning_feedback_out_path, learning_feedback_payload, learning_profile_path


def _self_test_learn_agent_backlog(learning_profile_path, learning_usage_path, tmp):
    """Package smoke self-test: learn agent-backlog readiness contracts."""
    learn_agent_backlog_cmd = [
        "design-ai",
        "learn",
        "--agent-backlog",
        "--file",
        str(learning_profile_path),
        "--usage-file",
        str(learning_usage_path),
        "--from-file",
        str(Path(tmp)),
        "--json",
    ]
    agent_backlog_refresh_args = [
        "design-ai",
        "learn",
        "--agent-backlog",
        "--from-file",
        str(Path(tmp)),
        "--file",
        str(learning_profile_path),
        "--usage-file",
        str(learning_usage_path),
        "--strict",
        "--json",
    ]
    agent_backlog_refresh_command = " ".join(agent_backlog_refresh_args)
    return agent_backlog_refresh_args, agent_backlog_refresh_command, learn_agent_backlog_cmd


def _self_test_learn_audit_cleanup(context, learn_curate_report_cmd, learning_profile_path) -> None:
    """Package smoke self-test: learn audit cleanup contracts."""
    assert_learning_curation_report(
        "\n".join([
            "# Learning Curation Report",
            "- Mode: preview",
            "- Archive candidates: 2",
            "## Archive Candidates",
            "- `learn-b`: duplicate-entry",
            "- `learn-c`: sensitive-content",
            "## Usage Review",
            "Usage sidecars store selected entry ids and short brief hashes",
            "- Review archive candidates, then rerun `design-ai learn --curate --yes` only if the proposed archive actions are correct.",
        ]),
        context=context,
        cmd=learn_curate_report_cmd,
    )
    expect_self_test_failure(
        lambda: assert_learning_curation_report(
            "# Learning Curation Report\n- Mode: preview\n",
            context=context,
            cmd=learn_curate_report_cmd,
        ),
        expected="learn curate report missing 'Archive candidates: 2'",
        scope="package smoke",
    )
    learn_audit_human_cmd = ["design-ai", "learn", "--audit", "--file", str(learning_profile_path)]
    assert_learning_audit_cleanup_human(
        "\n".join([
            "design-ai learn",
            "Local learning profile audit",
            "Status: warn",
            "Suggested cleanup:",
            "- remove-duplicate (learn-b): Remove the duplicate entry.",
            "  design-ai learn --file /tmp/learning.json --forget learn-b --yes",
            "- remove-or-redact-sensitive-content (learn-c): Remove sensitive content.",
            "  design-ai learn --file /tmp/learning.json --forget learn-c --yes",
        ]),
        context=context,
        cmd=learn_audit_human_cmd,
    )
    expect_self_test_failure(
        lambda: assert_learning_audit_cleanup_human(
            "Local learning profile audit\nStatus: warn\n",
            context=context,
            cmd=learn_audit_human_cmd,
        ),
        expected="learn audit human output missing 'Suggested cleanup:'",
        scope="package smoke",
    )
