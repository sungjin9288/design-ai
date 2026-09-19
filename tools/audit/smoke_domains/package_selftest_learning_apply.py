"""Package smoke self-test: learn apply-plan evidence, identity, and artifact contracts."""
from __future__ import annotations

import json

from pathlib import Path
from smoke_assertions import expect_self_test_failure
from smoke_domains.package_learning_skill_proposal import (
    assert_skill_proposal_min_evidence_json,
    assert_skill_proposal_patch,
    assert_skill_proposal_report_human,
    assert_skill_proposal_report_json,
    assert_skill_proposal_report_markdown,
)
from smoke_domains.package_learning_skill_proposal_apply import assert_skill_proposal_apply_plan_json
from smoke_domains.package_learning_skill_proposal_apply_reports import (
    assert_skill_proposal_apply_plan_human,
    assert_skill_proposal_apply_plan_markdown,
)
from smoke_domains.package_learning_skill_proposal_review import (
    assert_skill_proposal_review_check_json,
    assert_skill_proposal_review_check_markdown,
    assert_skill_proposal_review_json,
    assert_skill_proposal_review_template_json,
)


def _self_test_learn_apply_plan_evidence(context, learn_skill_proposals_cmd, learning_profile_path, learning_skill_proposal_apply_plan_payload, learning_skill_proposal_apply_plan_review_path, learning_skill_proposal_payload, learning_skill_proposal_review_check_markdown, learning_skill_proposal_review_check_payload, learning_skill_proposal_review_path, learning_usage_path, tmp):
    """Package smoke self-test: learn apply-plan evidence-threshold contracts."""
    learning_skill_proposal_apply_plan_human = "\n".join([
        "  design-ai learn",
        "  Skill proposal apply plan",
        "",
        "Manual apply tasks:",
        "- skill-proposal-component-spec-writer-abcdef1234: skills/component-spec-writer/SKILL.md",
        "",
        "Follow-up commands:",
        f"- reviewCheckJson: design-ai learn --propose-skills --file {learning_profile_path} --usage-file {learning_usage_path} --from-file {Path(tmp)} --review-file {learning_skill_proposal_apply_plan_review_path} --review-check --json",
        "",
        "Command contract:",
        "- valid: yes",
        "- status: pass",
        "- required keys: reviewCheckJson, reviewCheckReport, proposalPatchPreview, strictGate",
        "- forbidden flags: --yes",
        "- check count: 18",
        "- pass count: 18",
        "- warning count: 0",
        "- failure count: 0",
        "- failed checks: none",
        "- next command key: reviewCheckJson",
        "- next command policy: preview-only",
        "- next command safety: read-only",
        f"- next command: design-ai learn --propose-skills --file {learning_profile_path} --usage-file {learning_usage_path} --from-file {Path(tmp)} --review-file {learning_skill_proposal_apply_plan_review_path} --review-check --json",
        "- command sequence count: 4",
        "- command sequence keys: reviewCheckJson, reviewCheckReport, proposalPatchPreview, strictGate",
        "- command sequence policy: mixed-preview-local-output",
        "- command sequence executable: yes",
        "- command sequence local outputs: 2",
        "- command sequence mutates profile: no",
        "- command sequence mutates review file: no",
        "- command sequence mutates skill files: no",
        "- command sequence calls external AI APIs: no",
        "- operator runbook stages: 4",
        "- operator runbook keys: previewArtifacts, manualSkillEdit, reviewReadiness, strictGate",
        "- operator runbook required stages: 3",
        "- operator runbook next stage: previewArtifacts",
        "- operator runbook next required stage: manualSkillEdit",
        "- operator runbook next required command stage: reviewReadiness",
        "- operator runbook stage selection: optional-preview-before-required-manual-edit",
        "- operator runbook decision: offer-optional-preview",
        "- operator runbook decision safety: local-output",
        "- operator runbook decision commands: reviewCheckReport, proposalPatchPreview",
        "- operator runbook decision next command: reviewCheckReport",
        "- operator runbook selected stage: previewArtifacts (optional, local-output-preview)",
        "Command sequence:",
        "- 1. reviewCheckJson: preview-only / read-only",
        "- 2. reviewCheckReport: output-artifact / local-output",
        "- 3. proposalPatchPreview: output-artifact / local-output",
        "- 4. strictGate: strict-readiness-gate / read-only",
        "Operator runbook:",
        "- 1. previewArtifacts: optional / local-output-preview / reviewCheckReport, proposalPatchPreview",
        "- 2. manualSkillEdit: required / manual-review / manual",
        "- 3. reviewReadiness: required / read-only-check / reviewCheckJson",
        "- 4. strictGate: required / read-only-gate / strictGate",
        "- next action: Run reviewCheckJson after manual skill edits, then use strictGate before marking proposals applied.",
        "",
        "Privacy: apply plan is read-only and does not mutate learning.json, review files, or skill files.",
    ])
    assert_skill_proposal_apply_plan_human(
        learning_skill_proposal_apply_plan_human,
        context=context,
        cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan"],
    )
    learning_skill_proposal_apply_plan_markdown = "\n".join([
        "# Skill Proposal Apply Plan",
        "",
        "- Generated: 2026-06-11T00:10:00.000Z",
        "- Status: warn",
        "- Proposal status: warn",
        "- Signal status: pass",
        f"- File: {learning_profile_path}",
        f"- Usage sidecar: {learning_usage_path}",
        f"- Signal source: {Path(tmp)}",
        f"- Review file: {learning_skill_proposal_apply_plan_review_path}",
        "- Accepted proposals: 1",
        "- Pending review: 1",
        "- Reviewed: 1",
        "",
        "## Manual Apply Tasks",
        "",
        "### Update skills/component-spec-writer/SKILL.md for repeated accessibility check captures",
        "",
        "- Candidate skill: skills/component-spec-writer/SKILL.md",
        "",
        "Manual steps:",
        "- After the skill edit and verification pass, update the review decision from `accepted` to `applied`.",
        "",
        "## Follow-up Commands",
        "",
        f"- reviewCheckJson: `design-ai learn --propose-skills --file {learning_profile_path} --usage-file {learning_usage_path} --from-file {Path(tmp)} --review-file {learning_skill_proposal_apply_plan_review_path} --review-check --json`",
        "",
        "## Command Contract",
        "",
        "- Valid: yes",
        "- Required keys: reviewCheckJson, reviewCheckReport, proposalPatchPreview, strictGate",
        "- Check count: 18",
        "- Pass count: 18",
        "- Warning count: 0",
        "- Failure count: 0",
        "- Failed checks: none",
        "- Next command key: reviewCheckJson",
        "- Next command policy: preview-only",
        "- Next command safety: read-only",
        f"- Next command: `design-ai learn --propose-skills --file {learning_profile_path} --usage-file {learning_usage_path} --from-file {Path(tmp)} --review-file {learning_skill_proposal_apply_plan_review_path} --review-check --json`",
        "- Command sequence count: 4",
        "- Command sequence keys: reviewCheckJson, reviewCheckReport, proposalPatchPreview, strictGate",
        "- Command sequence policy: mixed-preview-local-output",
        "- Command sequence executable: yes",
        "- Command sequence local outputs: 2",
        "- Command sequence mutates profile: no",
        "- Command sequence mutates review file: no",
        "- Command sequence mutates skill files: no",
        "- Command sequence calls external AI APIs: no",
        "- Operator runbook stages: 4",
        "- Operator runbook keys: previewArtifacts, manualSkillEdit, reviewReadiness, strictGate",
        "- Operator runbook required stages: 3",
        "- Operator runbook next stage: previewArtifacts",
        "- Operator runbook next required stage: manualSkillEdit",
        "- Operator runbook next required command stage: reviewReadiness",
        "- Operator runbook stage selection: optional-preview-before-required-manual-edit",
        "- Operator runbook decision: offer-optional-preview",
        "- Operator runbook decision safety: local-output",
        "- Operator runbook decision commands: reviewCheckReport, proposalPatchPreview",
        "- Operator runbook decision next command: reviewCheckReport",
        "- Operator runbook selected stage: previewArtifacts (optional, local-output-preview)",
        "",
        "Command sequence:",
        "- 1. reviewCheckJson (preview-only / read-only): `design-ai learn --propose-skills",
        "- 2. reviewCheckReport (output-artifact / local-output): `design-ai learn --propose-skills",
        "- 3. proposalPatchPreview (output-artifact / local-output): `design-ai learn --propose-skills",
        "- 4. strictGate (strict-readiness-gate / read-only): `design-ai learn --propose-skills",
        "",
        "Operator runbook:",
        "- 1. previewArtifacts (optional / local-output-preview): reviewCheckReport, proposalPatchPreview",
        "- 2. manualSkillEdit (required / manual-review): manual",
        "- 3. reviewReadiness (required / read-only-check): reviewCheckJson",
        "- 4. strictGate (required / read-only-gate): strictGate",
        "- Next action: Run reviewCheckJson after manual skill edits, then use strictGate before marking proposals applied.",
        "",
        "## Privacy And Boundaries",
        "",
        "- Mutates learning profile: no",
        "- Mutates review file: no",
        "- Mutates skill files: no",
        "- Calls external AI APIs: no",
    ])
    assert_skill_proposal_apply_plan_markdown(
        learning_skill_proposal_apply_plan_markdown,
        profile_path=learning_profile_path,
        usage_path=learning_usage_path,
        review_path=learning_skill_proposal_apply_plan_review_path,
        context=context,
        cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--report"],
    )
    assert_skill_proposal_review_template_json(
        json.dumps({
            "version": 1,
            "generatedAt": "2026-06-11T00:00:00.000Z",
            "source": "design-ai learn --propose-skills --review-template",
            "proposalFile": str(learning_profile_path),
            "usageFile": str(learning_usage_path),
            "signalSource": str(Path(tmp)),
            "reviewFile": "",
            "reviewPolicy": {
                "clearsStrict": ["applied", "rejected"],
                "remainsPending": ["accepted", "deferred"],
            },
            "summary": {
                "proposalCount": 1,
                "pendingReviewCount": 1,
                "reviewedCount": 0,
                "templateDecisionCount": 1,
            },
            "decisions": [
                {
                    "proposalId": "skill-proposal-component-spec-writer-abcdef1234",
                    "status": "deferred",
                    "reviewedAt": "",
                    "reviewer": "",
                    "note": "Review skills/component-spec-writer/SKILL.md: Update skills/component-spec-writer/SKILL.md for repeated accessibility check captures",
                },
            ],
        }),
        profile_path=learning_profile_path,
        usage_path=learning_usage_path,
        context=context,
        cmd=[*learn_skill_proposals_cmd[:-1], "--review-template"],
    )
    assert_skill_proposal_min_evidence_json(
        json.dumps({
            **learning_skill_proposal_payload,
            "minEvidenceCount": 3,
            "count": 0,
            "proposalCount": 0,
            "skippedCount": 1,
            "proposals": [],
            "skipped": [
                {
                    "candidateSkillPath": "skills/component-spec-writer/SKILL.md",
                    "category": "accessibility",
                    "sourceIssueCount": 2,
                    "reason": "Needs at least 3 related check-capture entries before proposing a skill edit.",
                },
            ],
        }),
        profile_path=learning_profile_path,
        usage_path=learning_usage_path,
        context=context,
        cmd=[*learn_skill_proposals_cmd[:-1], "--min-evidence", "3", "--json"],
    )
    assert_skill_proposal_report_human(
        "\n".join([
            "design-ai learn",
            "Skill evolution proposals",
            f"Signal source: {Path(tmp)}",
            "Status: warn",
            "Proposed skill deltas:",
            "skills/component-spec-writer/SKILL.md",
            "No changes made. This command is preview-only",
        ]),
        context=context,
        cmd=learn_skill_proposals_cmd,
    )
    learning_skill_proposal_markdown = "\n".join([
        "# Skill Evolution Proposal Report",
        "",
        "- Generated: 2026-06-02T00:00:03.000Z",
        f"- File: {learning_profile_path}",
        f"- Usage sidecar: {learning_usage_path}",
        f"- Signal source: {Path(tmp)}",
        "- Status: warn",
        "- Signal status: pass",
        "- Check capture entries: 2",
        "- Candidate groups: 1",
        "- Proposal count: 1",
        "- Skipped groups: 0",
        "- Dry run: yes",
        "- Applied: no",
        "",
        "## Proposed Skill Deltas",
        "",
        "### Update skills/component-spec-writer/SKILL.md for repeated accessibility check captures",
        "",
        "- Proposal id: skill-proposal-component-spec-writer-abc123",
        "- Candidate skill: skills/component-spec-writer/SKILL.md",
        "- Category: accessibility",
        "- Routes: component-spec",
        "- Risk: low",
        "- Source issues: 2",
        "- Rationale: Repeated accessibility check captures were recorded for component-spec.",
        "",
        "Proposed instruction delta:",
        "",
        "> Add a pre-handoff accessibility checkpoint.",
        "",
        "Verification:",
        "",
        "```bash",
        "node cli/bin/design-ai.mjs check --examples --route component-spec --limit 1 --strict --json",
        "```",
        "",
        "Evidence:",
        "- `learn-skill-proposal-a` [accessibility] check:component-spec",
        "",
        "## Skipped Groups",
        "",
        "No candidate groups were skipped.",
        "",
        "## Privacy And Boundaries",
        "",
        "- Mutates learning profile: no",
        "- Mutates skill files: no",
        "- Calls external AI APIs: no",
        "- Stores raw brief text: no",
        "- Includes entry text preview: yes",
        "",
        "## Next Steps",
        "",
        "- This report is preview-only evidence; it does not apply changes.",
    ])
    assert_skill_proposal_report_markdown(
        learning_skill_proposal_markdown,
        profile_path=learning_profile_path,
        usage_path=learning_usage_path,
        context=context,
        cmd=learn_skill_proposals_cmd,
    )
    learning_skill_proposal_patch = "\n".join([
        "# design-ai skill proposal patch preview",
        "# Preview-only output from `design-ai learn --propose-skills --patch`.",
        "# Review manually before applying. This command does not edit skill files.",
        "",
        "diff --git a/skills/component-spec-writer/SKILL.md b/skills/component-spec-writer/SKILL.md",
        "--- a/skills/component-spec-writer/SKILL.md",
        "+++ b/skills/component-spec-writer/SKILL.md",
        "@@ -7,1 +7,10 @@",
        " See [PLAYBOOK.md](PLAYBOOK.md).",
        "+",
        "+## Local Learning Proposal: skill-proposal-component-spec-writer-abc123",
        "+",
        "+<!-- Generated by design-ai learn --propose-skills --patch. Review manually before applying. -->",
        "+",
        "+- Category: accessibility",
        "+- Routes: component-spec",
        "+- Risk: low",
        "+- Evidence count: 2",
        "+- Proposed instruction: Add a pre-handoff accessibility checkpoint.",
        "+- Verification: `node cli/bin/design-ai.mjs check --examples --route component-spec --limit 1 --strict --json`",
    ])
    assert_skill_proposal_patch(
        learning_skill_proposal_patch,
        context=context,
        cmd=[*learn_skill_proposals_cmd[:-1], "--patch"],
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_report_json(
            json.dumps({
                **learning_skill_proposal_payload,
                "proposals": [],
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            context=context,
            cmd=learn_skill_proposals_cmd,
        ),
        expected="learn skill proposals JSON should include the repeated component-spec skill delta",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_review_json(
            json.dumps({
                **learning_skill_proposal_payload,
                "reviewFile": str(learning_skill_proposal_review_path),
                "pendingReviewCount": 1,
                "reviewedCount": 1,
                "review": {
                    **learning_skill_proposal_payload["review"],
                    "file": str(learning_skill_proposal_review_path),
                    "exists": True,
                    "matchedCount": 1,
                    "pendingCount": 1,
                },
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_review_path,
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_review_path), "--json"],
        ),
        expected="learn skill proposals review JSON should join applied review decisions",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_review_check_json(
            json.dumps({
                **learning_skill_proposal_review_check_payload,
                "status": "warn",
                "summary": {
                    **learning_skill_proposal_review_check_payload["summary"],
                    "status": "warn",
                    "warnings": 1,
                },
                "checks": [
                    *learning_skill_proposal_review_check_payload["checks"][:-1],
                    {
                        "id": "no-stale-review-decisions",
                        "level": "warn",
                        "passed": False,
                        "message": "Review file contains decisions for proposals that are no longer current.",
                        "evidence": {"staleCount": 1},
                    },
                ],
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_review_path,
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_review_path), "--review-check", "--json"],
        ),
        expected="learn skill proposal review-check JSON should report pass review-file readiness",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_review_check_markdown(
            learning_skill_proposal_review_check_markdown.replace(
                "- Mutates skill files: no",
                "- Mutates skill files: yes",
            ),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_review_path,
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_review_path), "--review-check", "--report"],
        ),
        expected="learn skill proposal review-check Markdown report missing '- Mutates skill files: no'",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_json(
            json.dumps({
                **learning_skill_proposal_apply_plan_payload,
                "acceptedCount": 0,
                "count": 0,
                "tasks": [],
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            signal_source=Path(tmp),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
        ),
        expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_json(
            json.dumps({
                **learning_skill_proposal_apply_plan_payload,
                "commandContract": {
                    **learning_skill_proposal_apply_plan_payload["commandContract"],
                    "operatorRunbook": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                        "stageSelection": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                            "decision": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                "commandOutputArtifactRequiresManualReviewByKey": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandOutputArtifactRequiresManualReviewByKey"],
                                    "proposalPatchPreview": False,
                                },
                            },
                        },
                    },
                },
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            signal_source=Path(tmp),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
        ),
        expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_json(
            json.dumps({
                **learning_skill_proposal_apply_plan_payload,
                "commandContract": {
                    **learning_skill_proposal_apply_plan_payload["commandContract"],
                    "operatorRunbook": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                        "stageSelection": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                            "decision": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                "commandOutputArtifactManualApplyStatusToneByKey": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandOutputArtifactManualApplyStatusToneByKey"],
                                    "proposalPatchPreview": "success",
                                },
                            },
                        },
                    },
                },
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            signal_source=Path(tmp),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
        ),
        expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
        scope="package smoke",
    )
    return learning_skill_proposal_apply_plan_human, learning_skill_proposal_apply_plan_markdown, learning_skill_proposal_markdown, learning_skill_proposal_patch


def _self_test_learn_apply_plan_identity(context, learn_skill_proposals_cmd, learning_profile_path, learning_skill_proposal_apply_plan_payload, learning_skill_proposal_apply_plan_review_path, learning_usage_path, tmp) -> None:
    """Package smoke self-test: learn apply-plan identity contracts."""
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_json(
            json.dumps({
                **learning_skill_proposal_apply_plan_payload,
                "commandContract": {
                    **learning_skill_proposal_apply_plan_payload["commandContract"],
                    "operatorRunbook": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                        "stageSelection": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                            "decision": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                "commandOutputArtifactManualApplyStatusLabelByKey": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandOutputArtifactManualApplyStatusLabelByKey"],
                                    "proposalPatchPreview": "Ready to apply",
                                },
                            },
                        },
                    },
                },
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            signal_source=Path(tmp),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
        ),
        expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_json(
            json.dumps({
                **learning_skill_proposal_apply_plan_payload,
                "commandContract": {
                    **learning_skill_proposal_apply_plan_payload["commandContract"],
                    "operatorRunbook": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                        "stageSelection": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                            "decision": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                "commandOutputArtifactManualApplyStatusByKey": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandOutputArtifactManualApplyStatusByKey"],
                                    "proposalPatchPreview": "ready",
                                },
                            },
                        },
                    },
                },
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            signal_source=Path(tmp),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
        ),
        expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_json(
            json.dumps({
                **learning_skill_proposal_apply_plan_payload,
                "commandContract": {
                    **learning_skill_proposal_apply_plan_payload["commandContract"],
                    "operatorRunbook": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                        "stageSelection": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                            "decision": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                "commandOutputArtifactManualApplyBlockedReasonCodeByKey": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandOutputArtifactManualApplyBlockedReasonCodeByKey"],
                                    "proposalPatchPreview": "",
                                },
                            },
                        },
                    },
                },
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            signal_source=Path(tmp),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
        ),
        expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_json(
            json.dumps({
                **learning_skill_proposal_apply_plan_payload,
                "commandContract": {
                    **learning_skill_proposal_apply_plan_payload["commandContract"],
                    "operatorRunbook": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                        "stageSelection": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                            "decision": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                "commandOutputArtifactManualApplyReadyByKey": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandOutputArtifactManualApplyReadyByKey"],
                                    "proposalPatchPreview": True,
                                },
                            },
                        },
                    },
                },
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            signal_source=Path(tmp),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
        ),
        expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_json(
            json.dumps({
                **learning_skill_proposal_apply_plan_payload,
                "commandContract": {
                    **learning_skill_proposal_apply_plan_payload["commandContract"],
                    "operatorRunbook": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                        "stageSelection": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                            "decision": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                "commandOutputArtifactPendingApplyPreconditionCountByKey": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandOutputArtifactPendingApplyPreconditionCountByKey"],
                                    "proposalPatchPreview": 1,
                                },
                            },
                        },
                    },
                },
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            signal_source=Path(tmp),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
        ),
        expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_json(
            json.dumps({
                **learning_skill_proposal_apply_plan_payload,
                "commandContract": {
                    **learning_skill_proposal_apply_plan_payload["commandContract"],
                    "operatorRunbook": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                        "stageSelection": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                            "decision": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                "commandOutputArtifactApplyPreconditionCountByKey": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandOutputArtifactApplyPreconditionCountByKey"],
                                    "proposalPatchPreview": 1,
                                },
                            },
                        },
                    },
                },
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            signal_source=Path(tmp),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
        ),
        expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_json(
            json.dumps({
                **learning_skill_proposal_apply_plan_payload,
                "commandContract": {
                    **learning_skill_proposal_apply_plan_payload["commandContract"],
                    "operatorRunbook": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                        "stageSelection": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                            "decision": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                "commandOutputArtifactApplyPreconditionsByKey": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandOutputArtifactApplyPreconditionsByKey"],
                                    "proposalPatchPreview": [
                                        {"id": "manual-review", "label": "Manual review completed", "required": True},
                                    ],
                                },
                            },
                        },
                    },
                },
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            signal_source=Path(tmp),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
        ),
        expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_json(
            json.dumps({
                **learning_skill_proposal_apply_plan_payload,
                "commandContract": {
                    **learning_skill_proposal_apply_plan_payload["commandContract"],
                    "operatorRunbook": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                        "stageSelection": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                            "decision": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                "commandOutputArtifactApplyPreconditionLabelsByKey": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandOutputArtifactApplyPreconditionLabelsByKey"],
                                    "proposalPatchPreview": ["Manual review completed"],
                                },
                            },
                        },
                    },
                },
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            signal_source=Path(tmp),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
        ),
        expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_json(
            json.dumps({
                **learning_skill_proposal_apply_plan_payload,
                "commandContract": {
                    **learning_skill_proposal_apply_plan_payload["commandContract"],
                    "operatorRunbook": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                        "stageSelection": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                            "decision": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                "commandOutputArtifactApplyPreconditionIdsByKey": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandOutputArtifactApplyPreconditionIdsByKey"],
                                    "proposalPatchPreview": ["manual-review"],
                                },
                            },
                        },
                    },
                },
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            signal_source=Path(tmp),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
        ),
        expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_json(
            json.dumps({
                **learning_skill_proposal_apply_plan_payload,
                "commandContract": {
                    **learning_skill_proposal_apply_plan_payload["commandContract"],
                    "operatorRunbook": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                        "stageSelection": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                            "decision": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                "commandOutputArtifactRequiresCleanWorkspaceBeforeApplyByKey": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandOutputArtifactRequiresCleanWorkspaceBeforeApplyByKey"],
                                    "proposalPatchPreview": False,
                                },
                            },
                        },
                    },
                },
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            signal_source=Path(tmp),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
        ),
        expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_json(
            json.dumps({
                **learning_skill_proposal_apply_plan_payload,
                "commandContract": {
                    **learning_skill_proposal_apply_plan_payload["commandContract"],
                    "operatorRunbook": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                        "stageSelection": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                            "decision": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                "commandOutputArtifactReviewInstructionByKey": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandOutputArtifactReviewInstructionByKey"],
                                    "proposalPatchPreview": "",
                                },
                            },
                        },
                    },
                },
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            signal_source=Path(tmp),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
        ),
        expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_json(
            json.dumps({
                **learning_skill_proposal_apply_plan_payload,
                "commandContract": {
                    **learning_skill_proposal_apply_plan_payload["commandContract"],
                    "operatorRunbook": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                        "stageSelection": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                            "decision": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                "commandOutputArtifactManualApplyCandidateByKey": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandOutputArtifactManualApplyCandidateByKey"],
                                    "proposalPatchPreview": False,
                                },
                            },
                        },
                    },
                },
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            signal_source=Path(tmp),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
        ),
        expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_json(
            json.dumps({
                **learning_skill_proposal_apply_plan_payload,
                "commandContract": {
                    **learning_skill_proposal_apply_plan_payload["commandContract"],
                    "operatorRunbook": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                        "stageSelection": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                            "decision": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                "commandOutputArtifactDispositionByKey": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandOutputArtifactDispositionByKey"],
                                    "proposalPatchPreview": "review-only",
                                },
                            },
                        },
                    },
                },
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            signal_source=Path(tmp),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
        ),
        expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_json(
            json.dumps({
                **learning_skill_proposal_apply_plan_payload,
                "commandContract": {
                    **learning_skill_proposal_apply_plan_payload["commandContract"],
                    "operatorRunbook": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                        "stageSelection": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                            "decision": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                "commandOutputArtifactMediaTypeByKey": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandOutputArtifactMediaTypeByKey"],
                                    "proposalPatchPreview": "text/plain",
                                },
                            },
                        },
                    },
                },
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            signal_source=Path(tmp),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
        ),
        expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_json(
            json.dumps({
                **learning_skill_proposal_apply_plan_payload,
                "commandContract": {
                    **learning_skill_proposal_apply_plan_payload["commandContract"],
                    "operatorRunbook": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                        "stageSelection": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                            "decision": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                "commandOutputArtifactActionByKey": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandOutputArtifactActionByKey"],
                                    "proposalPatchPreview": "download-file",
                                },
                            },
                        },
                    },
                },
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            signal_source=Path(tmp),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
        ),
        expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
        scope="package smoke",
    )


def _self_test_learn_apply_plan_artifacts(context, learn_skill_proposals_cmd, learning_profile_path, learning_skill_proposal_apply_plan_payload, learning_skill_proposal_apply_plan_review_path, learning_usage_path, tmp) -> None:
    """Package smoke self-test: learn apply-plan artifact contracts."""
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_json(
            json.dumps({
                **learning_skill_proposal_apply_plan_payload,
                "commandContract": {
                    **learning_skill_proposal_apply_plan_payload["commandContract"],
                    "operatorRunbook": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                        "stageSelection": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                            "decision": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                "commandDescriptionByKey": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandDescriptionByKey"],
                                    "reviewCheckReport": "Generate review report.",
                                },
                            },
                        },
                    },
                },
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            signal_source=Path(tmp),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
        ),
        expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_json(
            json.dumps({
                **learning_skill_proposal_apply_plan_payload,
                "commandContract": {
                    **learning_skill_proposal_apply_plan_payload["commandContract"],
                    "operatorRunbook": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                        "stageSelection": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                            "decision": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                "commandOutputArtifactTypeByKey": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandOutputArtifactTypeByKey"],
                                    "reviewCheckReport": "markdown",
                                },
                            },
                        },
                    },
                },
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            signal_source=Path(tmp),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
        ),
        expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_json(
            json.dumps({
                **learning_skill_proposal_apply_plan_payload,
                "commandContract": {
                    **learning_skill_proposal_apply_plan_payload["commandContract"],
                    "operatorRunbook": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                        "stageSelection": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                            "decision": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                "commandOutputArtifactByKey": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandOutputArtifactByKey"],
                                    "proposalPatchPreview": "proposal.patch",
                                },
                            },
                        },
                    },
                },
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            signal_source=Path(tmp),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
        ),
        expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_json(
            json.dumps({
                **learning_skill_proposal_apply_plan_payload,
                "commandContract": {
                    **learning_skill_proposal_apply_plan_payload["commandContract"],
                    "operatorRunbook": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                        "stageSelection": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                            "decision": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                "commandDisplayLabelByKey": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandDisplayLabelByKey"],
                                    "proposalPatchPreview": "Patch preview",
                                },
                            },
                        },
                    },
                },
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            signal_source=Path(tmp),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
        ),
        expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_json(
            json.dumps({
                **learning_skill_proposal_apply_plan_payload,
                "commandContract": {
                    **learning_skill_proposal_apply_plan_payload["commandContract"],
                    "operatorRunbook": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                        "stageCount": 3,
                    },
                },
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            signal_source=Path(tmp),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
        ),
        expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_json(
            json.dumps({
                **learning_skill_proposal_apply_plan_payload,
                "commandContract": {
                    **learning_skill_proposal_apply_plan_payload["commandContract"],
                    "operatorRunbook": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                        "stageSelection": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                            "decision": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                "commandStringByKey": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandStringByKey"],
                                    "reviewCheckReport": "design-ai learn --propose-skills --review-check --report",
                                },
                            },
                        },
                    },
                },
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            signal_source=Path(tmp),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
        ),
        expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_json(
            json.dumps({
                **learning_skill_proposal_apply_plan_payload,
                "commandContract": {
                    **learning_skill_proposal_apply_plan_payload["commandContract"],
                    "operatorRunbook": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                        "stageSelection": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                            "decision": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                "commandArgsByKey": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandArgsByKey"],
                                    "proposalPatchPreview": [
                                        "design-ai", "learn", "--propose-skills",
                                        "--patch",
                                    ],
                                },
                            },
                        },
                    },
                },
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            signal_source=Path(tmp),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
        ),
        expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_json(
            json.dumps({
                **learning_skill_proposal_apply_plan_payload,
                "commandContract": {
                    **learning_skill_proposal_apply_plan_payload["commandContract"],
                    "operatorRunbook": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                        "stageSelection": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                            "decision": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                "commandSafetyLevelByKey": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandSafetyLevelByKey"],
                                    "reviewCheckReport": "read-only",
                                },
                            },
                        },
                    },
                },
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            signal_source=Path(tmp),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
        ),
        expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_json(
            json.dumps({
                **learning_skill_proposal_apply_plan_payload,
                "commandContract": {
                    **learning_skill_proposal_apply_plan_payload["commandContract"],
                    "operatorRunbook": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                        "stageSelection": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                            "decision": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                "commandRunPolicyByKey": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandRunPolicyByKey"],
                                    "proposalPatchPreview": "preview-only",
                                },
                            },
                        },
                    },
                },
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            signal_source=Path(tmp),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
        ),
        expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_json(
            json.dumps({
                **learning_skill_proposal_apply_plan_payload,
                "commandContract": {
                    **learning_skill_proposal_apply_plan_payload["commandContract"],
                    "operatorRunbook": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                        "stageSelection": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                            "decision": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                "commandStepByKey": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commandStepByKey"],
                                    "reviewCheckReport": 3,
                                },
                            },
                        },
                    },
                },
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            signal_source=Path(tmp),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
        ),
        expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_json(
            json.dumps({
                **learning_skill_proposal_apply_plan_payload,
                "commandContract": {
                    **learning_skill_proposal_apply_plan_payload["commandContract"],
                    "operatorRunbook": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                        "stageSelection": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                            "decision": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                "nextCommandStep": 3,
                            },
                        },
                    },
                },
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            signal_source=Path(tmp),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
        ),
        expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_json(
            json.dumps({
                **learning_skill_proposal_apply_plan_payload,
                "commandContract": {
                    **learning_skill_proposal_apply_plan_payload["commandContract"],
                    "operatorRunbook": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                        "stageSelection": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                            "decision": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                "nextCommandSafety": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["nextCommandSafety"],
                                    "level": "read-only",
                                },
                            },
                        },
                    },
                },
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            signal_source=Path(tmp),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
        ),
        expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_json(
            json.dumps({
                **learning_skill_proposal_apply_plan_payload,
                "commandContract": {
                    **learning_skill_proposal_apply_plan_payload["commandContract"],
                    "operatorRunbook": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                        "stageSelection": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                            "decision": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                "commands": [
                                    {
                                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commands"][0],
                                        "safety": {
                                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commands"][0]["safety"],
                                            "reason": "drift",
                                        },
                                    },
                                    *learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["commands"][1:],
                                ],
                            },
                        },
                    },
                },
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            signal_source=Path(tmp),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
        ),
        expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_json(
            json.dumps({
                **learning_skill_proposal_apply_plan_payload,
                "commandContract": {
                    **learning_skill_proposal_apply_plan_payload["commandContract"],
                    "operatorRunbook": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                        "stageSelection": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                            "decision": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                "nextCommandEntry": {
                                    **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"]["nextCommandEntry"],
                                    "key": "proposalPatchPreview",
                                },
                            },
                        },
                    },
                },
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            signal_source=Path(tmp),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
        ),
        expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
        scope="package smoke",
    )
    expect_self_test_failure(
        lambda: assert_skill_proposal_apply_plan_json(
            json.dumps({
                **learning_skill_proposal_apply_plan_payload,
                "commandContract": {
                    **learning_skill_proposal_apply_plan_payload["commandContract"],
                    "operatorRunbook": {
                        **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"],
                        "stageSelection": {
                            **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"],
                            "decision": {
                                **learning_skill_proposal_apply_plan_payload["commandContract"]["operatorRunbook"]["stageSelection"]["decision"],
                                "commandByKey": {},
                            },
                        },
                    },
                },
            }),
            profile_path=learning_profile_path,
            usage_path=learning_usage_path,
            review_path=learning_skill_proposal_apply_plan_review_path,
            signal_source=Path(tmp),
            context=context,
            cmd=[*learn_skill_proposals_cmd[:-1], "--review-file", str(learning_skill_proposal_apply_plan_review_path), "--apply-plan", "--json"],
        ),
        expected="learn skill proposal apply-plan JSON should include accepted manual apply tasks",
        scope="package smoke",
    )
