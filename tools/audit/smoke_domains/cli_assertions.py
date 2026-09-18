"""CLI smoke assertions shared verbatim by package and registry smoke.

Both executables ran byte-identical copies of these checks against identically
resolved dependencies. Keeping one copy stops a CLI output change from updating
one executable and leaving the other asserting stale behavior — a drift the
self-tests cannot detect, because their fixtures move with the stale assertion.

Assertions whose dependencies differ per executable (learning fixtures and the
Website Console workspace fixture) intentionally stay in their own executable.
"""
from __future__ import annotations

import json

from pathlib import Path
from smoke_assertions import (
    EXPECTED_CORPUS_SEARCH_QUERY,
    EXPECTED_RANKED_SEARCH_LIMIT,
    EXPECTED_ROUTE_BRIEF,
    assert_audit_json,
    assert_audit_strict_quiet_output,
    assert_check_all_routes_issues_only_output,
    assert_check_artifact_json_component_spec,
    assert_check_examples_json_component_spec,
    assert_check_stdin_json_component_spec,
    assert_command_alias_output,
    assert_examples_human_output,
    assert_examples_json_route_hit,
    assert_force_overwrite_replaced,
    assert_help_topic_output,
    assert_install_doctor_lifecycle_output,
    assert_list_catalog_json,
    assert_list_catalog_output,
    assert_main_help_output,
    assert_no_ansi,
    assert_numeric_value_failure,
    assert_output_overwrite_failure,
    assert_output_write_success,
    assert_pack_json_component_spec,
    assert_pack_markdown_body_component_spec,
    assert_pack_markdown_component_spec,
    assert_prompt_json_component_spec,
    assert_prompt_markdown_body_component_spec,
    assert_prompt_markdown_component_spec,
    assert_ranked_search_json,
    assert_route_catalog_json,
    assert_route_explain_human_output,
    assert_route_json_component_spec,
    assert_search_human_output,
    assert_search_json_contains_hit,
    assert_show_human_output,
    assert_show_human_range_output,
    assert_show_json_line,
    assert_show_json_range,
    assert_site_bundle_compare_warning_strict_json,
    assert_site_prompt_templates_json,
    assert_site_sample_json,
    assert_start_json,
    assert_unknown_option_failure,
    assert_update_dry_run_json,
    assert_update_dry_run_output,
    assert_version_json,
    assert_version_output,
    assert_workspace_json,
    assert_workspace_strict_failure_json,
    passing_check_artifact_content,
    seed_force_overwrite_target,
)
from smoke_domains.cli_runner import (
    run_expected_failure,
    run_plain,
    run_plain_with_input,
)
from smoke_domains.site_validators import assert_site_mcp_probe_counts


def assert_unknown_option_smoke(
    cmd: list[str],
    *,
    command_name: str,
    option: str,
    suggestion: str,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    run_expected_failure(
        cmd,
        cwd=cwd,
        env=env,
        context=context,
        assertion=lambda raw, *, returncode, context, cmd: assert_unknown_option_failure(
            raw,
            returncode=returncode,
            context=context,
            cmd=cmd,
            command_name=command_name,
            option=option,
            suggestion=suggestion,
        ),
    )


def assert_numeric_value_smoke(
    cmd: list[str],
    *,
    expected_message: str,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    run_expected_failure(
        cmd,
        cwd=cwd,
        env=env,
        context=context,
        assertion=lambda raw, *, returncode, context, cmd: assert_numeric_value_failure(
            raw,
            returncode=returncode,
            context=context,
            cmd=cmd,
            expected_message=expected_message,
        ),
    )


def assert_help_topic_smoke(
    cmd: list[str],
    *,
    topic: str,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_help_topic_output(result.stdout, topic=topic, context=context, cmd=cmd)


def assert_main_help_smoke(cmd: list[str], *, env: dict[str, str], cwd: Path | None = None, context: str) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_main_help_output(result.stdout, context=context, cmd=cmd)


def assert_version_smoke(cmd: list[str], *, env: dict[str, str], cwd: Path | None = None, context: str) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_version_output(result.stdout, context=context, cmd=cmd)


def assert_version_json_smoke(cmd: list[str], *, env: dict[str, str], cwd: Path | None = None, context: str) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_version_json(result.stdout, context=context, cmd=cmd)


def assert_workspace_json_smoke(cmd: list[str], *, env: dict[str, str], cwd: Path | None = None, context: str) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_workspace_json(result.stdout, context=context, cmd=cmd)


def assert_site_sample_json_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_site_sample_json(result.stdout, context=context, cmd=cmd)


def assert_site_prompt_templates_json_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_site_prompt_templates_json(result.stdout, context=context, cmd=cmd)


def assert_site_bundle_compare_warning_strict_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    run_expected_failure(
        cmd,
        cwd=cwd,
        env=env,
        context=context,
        assertion=assert_site_bundle_compare_warning_strict_json,
    )


def assert_site_bundle_check_json_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
    expected_evidence_counts: dict[str, int] | None = None,
) -> None:
    if expected_evidence_counts is None:
        expected_evidence_counts = {
            "executedWork": 0,
            "verificationResults": 0,
            "remainingRisks": 3,
            "nextActions": 0,
        }
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_no_ansi(result.stdout, cmd)
    payload = json.loads(result.stdout)
    if payload.get("status") != "pass" or payload.get("valid") is not True:
        raise SystemExit(f"site bundle check after {context} expected pass/valid output")
    if payload.get("externalCalls") is not False or payload.get("targetRepoMutation") is not False:
        raise SystemExit(f"site bundle check after {context} boundary flags changed")
    boundaries = payload.get("boundaries")
    if (
        not isinstance(boundaries, list)
        or "deterministic-local" not in boundaries
        or "no-external-mcp-calls" not in boundaries
        or "no-target-repo-mutation" not in boundaries
    ):
        raise SystemExit(f"site bundle check after {context} boundary list changed: {boundaries!r}")
    if payload.get("counts", {}).get("presentFiles") != 9:
        raise SystemExit(f"site bundle check after {context} expected 9 present files")
    if payload.get("counts", {}).get("verifiedChecksumFiles") != 8:
        raise SystemExit(f"site bundle check after {context} expected 8 verified checksum files")
    if payload.get("counts", {}).get("checksumFailures") != 0:
        raise SystemExit(f"site bundle check after {context} expected no checksum failures")
    if payload.get("counts", {}).get("verifiedGeneratedFiles") != 8:
        raise SystemExit(f"site bundle check after {context} expected 8 current-contract generated files")
    if payload.get("counts", {}).get("generatedFailures") != 0:
        raise SystemExit(f"site bundle check after {context} expected no generated bundle contract failures")
    generated_contract = payload.get("generatedContract")
    if not isinstance(generated_contract, dict) or generated_contract.get("available") is not True:
        raise SystemExit(f"site bundle check after {context} generated contract diagnostics missing")
    if generated_contract.get("expectedFiles") != 8 or generated_contract.get("verifiedFiles") != 8:
        raise SystemExit(f"site bundle check after {context} generated contract file counts changed")
    if generated_contract.get("driftFiles") != []:
        raise SystemExit(f"site bundle check after {context} expected no generated contract drift files")
    generated_files = generated_contract.get("files")
    if not isinstance(generated_files, list) or len(generated_files) != 8:
        raise SystemExit(f"site bundle check after {context} expected 8 generated contract file diagnostics")
    for item in generated_files:
        if item.get("present") is not True or item.get("matches") is not True:
            raise SystemExit(f"site bundle check after {context} generated contract file did not match: {item!r}")
        for key in ("expectedDigest", "actualDigest"):
            digest = item.get(key)
            if not isinstance(digest, str) or len(digest) != 64 or any(char not in "0123456789abcdef" for char in digest):
                raise SystemExit(f"site bundle check after {context} generated contract {key} is not a SHA-256 hex digest")
    repair_guidance = payload.get("repairGuidance")
    if not isinstance(repair_guidance, dict) or repair_guidance.get("available") is not True:
        raise SystemExit(f"site bundle check after {context} repair guidance missing")
    if repair_guidance.get("targetRepoMutation") is not False or repair_guidance.get("externalCalls") is not False:
        raise SystemExit(f"site bundle check after {context} repair guidance boundary flags changed")
    repair_command = repair_guidance.get("command")
    verify_command = repair_guidance.get("verifyCommand")
    if (
        not isinstance(repair_command, str)
        or "website-workspace.tasks.json --bundle --out " not in repair_command
        or " --force" not in repair_command
    ):
        raise SystemExit(f"site bundle check after {context} repair command changed: {repair_command!r}")
    if not isinstance(verify_command, str) or "--bundle-check --strict --json" not in verify_command:
        raise SystemExit(f"site bundle check after {context} repair verify command changed: {verify_command!r}")
    if payload.get("summary", {}).get("totalTasks") != 3:
        raise SystemExit(f"site bundle check after {context} expected 3 tasks")
    if payload.get("summary", {}).get("siteName") != "Korean SaaS marketing site":
        raise SystemExit(f"site bundle check after {context} site name changed")
    evidence_counts = payload.get("summary", {}).get("implementationEvidence")
    if not isinstance(evidence_counts, dict):
        raise SystemExit(f"site bundle check after {context} implementationEvidence counts missing")
    for key, expected in expected_evidence_counts.items():
        if evidence_counts.get(key) != expected:
            raise SystemExit(f"site bundle check after {context} evidence count {key} changed: {evidence_counts.get(key)!r}")
    if payload.get("summary", {}).get("checksumAlgorithm") != "sha256":
        raise SystemExit(f"site bundle check after {context} checksum algorithm changed")
    bundle_digest = payload.get("summary", {}).get("checksumBundleDigest")
    if not isinstance(bundle_digest, str) or len(bundle_digest) != 64:
        raise SystemExit(f"site bundle check after {context} bundle digest changed")
    if payload.get("mcpStatus") != "pass":
        raise SystemExit(f"site bundle check after {context} MCP status changed")
    if payload.get("mcpProbeStatus") != "pass":
        raise SystemExit(f"site bundle check after {context} MCP probe status changed")
    assert_site_mcp_probe_counts(
        payload.get("mcpProbeCounts"),
        context=context,
        label="site bundle check",
    )
    assert_site_mcp_probe_counts(
        payload.get("summary", {}).get("mcpProbeCounts"),
        context=context,
        label="site bundle check summary",
    )
    issue_ids = [issue.get("id") for issue in payload.get("issues", [])]
    if issue_ids != ["bundle-ready"]:
        raise SystemExit(f"site bundle check after {context} expected bundle-ready only, got {issue_ids!r}")


def assert_site_bundle_compare_json_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
    expected_evidence_counts: dict[str, int] | None = None,
) -> None:
    if expected_evidence_counts is None:
        expected_evidence_counts = {
            "executedWork": 0,
            "verificationResults": 0,
            "remainingRisks": 3,
            "nextActions": 0,
        }
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_no_ansi(result.stdout, cmd)
    payload = json.loads(result.stdout)
    if payload.get("status") != "pass" or payload.get("valid") is not True:
        raise SystemExit(f"site bundle compare after {context} expected pass/valid output")
    if payload.get("sameBundle") is not True or payload.get("digestMatch") is not True:
        raise SystemExit(f"site bundle compare after {context} expected identical bundle digest")
    if payload.get("counts", {}).get("changedFiles") != 0:
        raise SystemExit(f"site bundle compare after {context} expected no changed files")
    for side in ("left", "right"):
        digest = payload.get(side, {}).get("checksumBundleDigest")
        if not isinstance(digest, str) or len(digest) != 64:
            raise SystemExit(f"site bundle compare after {context} {side} bundle digest changed")
        if payload.get(side, {}).get("siteName") != "Korean SaaS marketing site":
            raise SystemExit(f"site bundle compare after {context} {side} site name changed")
        assert_site_mcp_probe_counts(
            payload.get(side, {}).get("mcpProbeCounts"),
            context=context,
            label=f"site bundle compare {side}",
        )
        if payload.get(side, {}).get("verifiedGeneratedFiles") != 8 or payload.get(side, {}).get("generatedFailures") != 0:
            raise SystemExit(f"site bundle compare after {context} {side} generated bundle contract verification changed")
        if payload.get(side, {}).get("generatedDriftFiles") != []:
            raise SystemExit(f"site bundle compare after {context} {side} generated bundle contract drift changed")
        evidence_counts = payload.get(side, {}).get("implementationEvidence")
        if not isinstance(evidence_counts, dict):
            raise SystemExit(f"site bundle compare after {context} {side} implementationEvidence counts missing")
        for key, expected in expected_evidence_counts.items():
            if evidence_counts.get(key) != expected:
                raise SystemExit(f"site bundle compare after {context} {side} evidence count {key} changed: {evidence_counts.get(key)!r}")
    issue_ids = [issue.get("id") for issue in payload.get("issues", [])]
    if issue_ids != ["bundle-compare-identical"]:
        raise SystemExit(f"site bundle compare after {context} expected bundle-compare-identical only, got {issue_ids!r}")


def assert_workspace_strict_failure_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    run_expected_failure(
        cmd,
        cwd=cwd,
        env=env,
        context=context,
        assertion=assert_workspace_strict_failure_json,
    )


def assert_command_alias_smoke(
    cmd: list[str],
    *,
    command: tuple[str, ...],
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_command_alias_output(result.stdout, command=command, context=context, cmd=cmd)


def assert_update_dry_run_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_update_dry_run_output(result.stdout, context=context, cmd=cmd)


def assert_update_dry_run_json_smoke(
    cmd: list[str],
    *,
    prefix: str,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_update_dry_run_json(result.stdout, prefix=prefix, context=context, cmd=cmd)


def assert_install_lifecycle_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_install_doctor_lifecycle_output(result.stdout, context=context, cmd=cmd)


def assert_search_smoke(cmd: list[str], *, env: dict[str, str], cwd: Path | None = None, context: str) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_search_json_contains_hit(result.stdout, context=context, cmd=cmd)


def assert_search_human_smoke(cmd: list[str], *, env: dict[str, str], cwd: Path | None = None, context: str) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_search_human_output(result.stdout, context=context, cmd=cmd)


def assert_show_smoke(cmd: list[str], *, env: dict[str, str], cwd: Path | None = None, context: str) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_show_json_line(result.stdout, context=context, cmd=cmd)


def assert_show_human_smoke(cmd: list[str], *, env: dict[str, str], cwd: Path | None = None, context: str) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_show_human_output(result.stdout, context=context, cmd=cmd)


def assert_show_range_smoke(cmd: list[str], *, env: dict[str, str], cwd: Path | None = None, context: str) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_show_json_range(result.stdout, context=context, cmd=cmd)


def assert_show_human_range_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_show_human_range_output(result.stdout, context=context, cmd=cmd)


def assert_examples_smoke(cmd: list[str], *, env: dict[str, str], cwd: Path | None = None, context: str) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_examples_json_route_hit(result.stdout, context=context, cmd=cmd)


def assert_examples_human_smoke(cmd: list[str], *, env: dict[str, str], cwd: Path | None = None, context: str) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_examples_human_output(result.stdout, context=context, cmd=cmd)


def assert_list_smoke(
    cmd: list[str],
    *,
    kind: str,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_list_catalog_output(result.stdout, kind=kind, context=context, cmd=cmd)


def assert_list_json_smoke(
    cmd: list[str],
    *,
    kind: str,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_list_catalog_json(result.stdout, kind=kind, context=context, cmd=cmd)


def write_smoke_brief(brief_path: Path) -> None:
    brief_path.write_text(f"{EXPECTED_ROUTE_BRIEF}\n", encoding="utf-8")


def assert_route_smoke(cmd: list[str], *, env: dict[str, str], cwd: Path | None = None, context: str) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_route_json_component_spec(result.stdout, context=context, cmd=cmd)


def assert_route_explain_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_route_explain_human_output(result.stdout, context=context, cmd=cmd)


def assert_route_catalog_smoke(cmd: list[str], *, env: dict[str, str], cwd: Path | None = None, context: str) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_route_catalog_json(result.stdout, context=context, cmd=cmd)


def assert_route_stdin_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain_with_input(
        cmd,
        input_text=f"{EXPECTED_ROUTE_BRIEF}\n",
        cwd=cwd,
        env=env,
    )
    assert_route_json_component_spec(result.stdout, context=context, cmd=cmd)


def assert_audit_smoke(cmd: list[str], *, env: dict[str, str], cwd: Path | None = None, context: str) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_audit_strict_quiet_output(result.stdout, context=context, cmd=cmd)


def assert_audit_json_smoke(cmd: list[str], *, env: dict[str, str], cwd: Path | None = None, context: str) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_audit_json(result.stdout, context=context, cmd=cmd)


def assert_check_examples_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_check_examples_json_component_spec(result.stdout, context=context, cmd=cmd)


def assert_check_all_routes_issues_only_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_check_all_routes_issues_only_output(result.stdout, context=context, cmd=cmd)


def write_check_artifact(artifact_path: Path) -> None:
    artifact_path.write_text(passing_check_artifact_content(), encoding="utf-8")


def assert_check_artifact_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_check_artifact_json_component_spec(result.stdout, context=context, cmd=cmd)


def assert_check_stdin_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain_with_input(
        cmd,
        input_text=passing_check_artifact_content(),
        cwd=cwd,
        env=env,
    )
    assert_check_stdin_json_component_spec(result.stdout, context=context, cmd=cmd)


def read_output_file(output_path: Path, *, context: str, label: str) -> str:
    try:
        return output_path.read_text(encoding="utf-8")
    except OSError as error:
        raise SystemExit(f"failed to read {label} output after {context}: {output_path}") from error


def read_json_output_file(output_path: Path, *, context: str) -> str:
    return read_output_file(output_path, context=context, label="JSON")


def read_markdown_output_file(output_path: Path, *, context: str) -> str:
    return read_output_file(output_path, context=context, label="Markdown")


def read_forced_output_file(output_path: Path, *, context: str, cmd: list[str], label: str) -> str:
    content = read_output_file(output_path, context=context, label=label)
    assert_force_overwrite_replaced(content, context=context, cmd=cmd, expected_path=str(output_path))
    return content


def read_forced_json_output_file(output_path: Path, *, context: str, cmd: list[str]) -> str:
    return read_forced_output_file(output_path, context=context, cmd=cmd, label="JSON")


def read_forced_markdown_output_file(output_path: Path, *, context: str, cmd: list[str]) -> str:
    return read_forced_output_file(output_path, context=context, cmd=cmd, label="Markdown")


def assert_output_overwrite_smoke(
    cmd: list[str],
    output_path: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    run_expected_failure(
        cmd,
        cwd=cwd,
        env=env,
        context=context,
        assertion=lambda raw, *, returncode, context, cmd: assert_output_overwrite_failure(
            raw,
            returncode=returncode,
            context=context,
            cmd=cmd,
            expected_path=str(output_path),
        ),
    )


def assert_prompt_smoke(
    cmd: list[str],
    output_path: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    seed_force_overwrite_target(output_path, context=context, cmd=cmd)
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_output_write_success(result.stdout, context=context, cmd=cmd, expected_path=str(output_path))
    assert_prompt_json_component_spec(
        read_forced_json_output_file(output_path, context=context, cmd=cmd),
        context=context,
        cmd=cmd,
    )


def assert_start_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_start_json(result.stdout, context=context, cmd=cmd)


def assert_prompt_stdout_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_prompt_json_component_spec(result.stdout, context=context, cmd=cmd)


def assert_prompt_markdown_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_prompt_markdown_component_spec(result.stdout, context=context, cmd=cmd)


def assert_prompt_markdown_file_smoke(
    cmd: list[str],
    output_path: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    seed_force_overwrite_target(output_path, context=context, cmd=cmd)
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_output_write_success(result.stdout, context=context, cmd=cmd, expected_path=str(output_path))
    assert_prompt_markdown_body_component_spec(
        read_forced_markdown_output_file(output_path, context=context, cmd=cmd),
        context=context,
        cmd=cmd,
    )


def assert_prompt_stdin_smoke(
    cmd: list[str],
    output_path: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    seed_force_overwrite_target(output_path, context=context, cmd=cmd)
    result = run_plain_with_input(
        cmd,
        input_text=f"{EXPECTED_ROUTE_BRIEF}\n",
        cwd=cwd,
        env=env,
    )
    assert_output_write_success(result.stdout, context=context, cmd=cmd, expected_path=str(output_path))
    assert_prompt_json_component_spec(
        read_forced_json_output_file(output_path, context=context, cmd=cmd),
        context=context,
        cmd=cmd,
    )


def assert_pack_smoke(
    cmd: list[str],
    output_path: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    seed_force_overwrite_target(output_path, context=context, cmd=cmd)
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_output_write_success(result.stdout, context=context, cmd=cmd, expected_path=str(output_path))
    assert_pack_json_component_spec(
        read_forced_json_output_file(output_path, context=context, cmd=cmd),
        context=context,
        cmd=cmd,
    )


def assert_pack_stdout_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_pack_json_component_spec(result.stdout, context=context, cmd=cmd)


def assert_pack_markdown_smoke(
    cmd: list[str],
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_pack_markdown_component_spec(result.stdout, context=context, cmd=cmd)


def assert_pack_markdown_file_smoke(
    cmd: list[str],
    output_path: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    seed_force_overwrite_target(output_path, context=context, cmd=cmd)
    result = run_plain(cmd, cwd=cwd, env=env)
    assert_output_write_success(result.stdout, context=context, cmd=cmd, expected_path=str(output_path))
    assert_pack_markdown_body_component_spec(
        read_forced_markdown_output_file(output_path, context=context, cmd=cmd),
        context=context,
        cmd=cmd,
    )


def assert_pack_stdin_smoke(
    cmd: list[str],
    output_path: Path,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
) -> None:
    seed_force_overwrite_target(output_path, context=context, cmd=cmd)
    result = run_plain_with_input(
        cmd,
        input_text=f"{EXPECTED_ROUTE_BRIEF}\n",
        cwd=cwd,
        env=env,
    )
    assert_output_write_success(result.stdout, context=context, cmd=cmd, expected_path=str(output_path))
    assert_pack_json_component_spec(
        read_forced_json_output_file(output_path, context=context, cmd=cmd),
        context=context,
        cmd=cmd,
    )


def assert_search_embeddings_no_provider_fallback_smoke(
    command_factory,
    *,
    env: dict[str, str],
    cwd: Path | None = None,
    context: str,
    config_file: Path,
) -> None:
    """`search --ranked --embeddings` with no provider configured (flag or config)
    degrades to the lexical backend with a notice and exit code 0."""
    fallback_env = env.copy()
    # Same isolation rationale as assert_embeddings_off_by_default_smoke: point at a
    # config path guaranteed not to exist rather than trusting the ambient environment.
    fallback_env["DESIGN_AI_CONFIG_FILE"] = str(config_file)

    search_cmd = command_factory(
        "search",
        EXPECTED_CORPUS_SEARCH_QUERY,
        "--dir",
        "knowledge",
        "--limit",
        str(EXPECTED_RANKED_SEARCH_LIMIT),
        "--ranked",
        "--embeddings",
        "--json",
    )
    result = run_plain(search_cmd, cwd=cwd, env=fallback_env)
    assert_ranked_search_json(
        result.stdout,
        context=f"{context} payload",
        cmd=search_cmd,
        expected_backend="lexical",
    )
    payload = json.loads(result.stdout)
    if "embedding provider" not in payload.get("notice", "") and "no embedding provider configured" not in payload.get("notice", ""):
        raise SystemExit(f"search ranked JSON after {context} fallback notice does not mention the missing provider")
