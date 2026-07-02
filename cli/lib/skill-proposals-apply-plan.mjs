// Accepted-proposal apply plan assembly for `design-ai learn --propose-skills --apply-plan`.

import path from "node:path";

import { applyPlanFollowUpCommands } from "./skill-proposals-apply-commands.mjs";
import { buildApplyPlanCommandContract } from "./skill-proposals-apply-contract.mjs";

function acceptedProposalTask(proposal, index) {
  const routes = Array.isArray(proposal.routeIds) && proposal.routeIds.length > 0
    ? proposal.routeIds
    : ["artifact"];
  const evidenceSources = Array.isArray(proposal.evidenceSources) ? proposal.evidenceSources : [];
  return {
    id: `apply-${index + 1}-${proposal.id}`,
    proposalId: proposal.id,
    title: proposal.title,
    candidateSkill: proposal.candidateSkill || path.basename(path.dirname(proposal.candidateSkillPath || "")) || "unknown",
    candidateSkillPath: proposal.candidateSkillPath || "skills/unknown/SKILL.md",
    category: proposal.category || "workflow",
    riskLevel: proposal.riskLevel || "medium",
    routeIds: routes,
    sourceIssueCount: proposal.sourceIssueCount || evidenceSources.length,
    proposedInstructionDelta: proposal.proposedInstructionDelta || "",
    rationale: proposal.rationale || "",
    verificationCommand: proposal.verificationCommand || "node cli/bin/design-ai.mjs check --examples --strict --json",
    evidenceSources,
    reviewDecision: proposal.reviewDecision || {
      proposalId: proposal.id,
      status: proposal.reviewStatus || "accepted",
      reviewedAt: "",
      reviewer: "",
      note: "",
    },
    manualSteps: [
      `Open ${proposal.candidateSkillPath || "the candidate skill file"} and inspect the relevant checklist or playbook section.`,
      "Merge the proposed instruction delta manually instead of pasting duplicate generated text.",
      "Run the verification command and inspect any route-specific failures before marking the work complete.",
      "After the skill edit and verification pass, update the review decision from `accepted` to `applied`.",
    ],
    safetyChecklist: [
      "Do not edit learning.json as part of this apply plan.",
      "Do not call external AI APIs, embeddings, or fine-tuning jobs.",
      "Keep the skill delta scoped to the repeated check-capture evidence.",
      "Run the proposal review-check after updating the review file.",
    ],
  };
}

export function buildSkillProposalApplyPlan(payload, {
  generatedAt = new Date(),
} = {}) {
  const generatedAtText = generatedAt instanceof Date ? generatedAt.toISOString() : String(generatedAt || "");
  const review = payload.review || {};
  const reviewFile = payload.reviewFile || review.file || "";
  const acceptedProposals = Array.isArray(payload.proposals)
    ? payload.proposals.filter((proposal) => proposal.reviewStatus === "accepted")
    : [];
  const tasks = acceptedProposals.map(acceptedProposalTask);
  const reviewStatus = review.status || "unknown";
  const status = reviewStatus === "fail" || !reviewFile || review.exists === false
    ? "fail"
    : tasks.length > 0
      ? "warn"
      : "pass";
  const followUpCommands = applyPlanFollowUpCommands(payload, reviewFile);
  const commandContract = buildApplyPlanCommandContract(followUpCommands, reviewFile);

  return {
    version: 1,
    kind: "skill-proposal-apply-plan",
    generatedAt: generatedAtText,
    file: payload.file,
    usageFile: payload.usageFile,
    signalSource: payload.signalSource,
    reviewFile,
    status,
    proposalStatus: payload.status,
    signalStatus: payload.signalStatus,
    candidateCount: payload.candidateCount || 0,
    proposalCount: payload.proposalCount || 0,
    acceptedCount: tasks.length,
    count: tasks.length,
    pendingReviewCount: payload.pendingReviewCount || 0,
    reviewedCount: payload.reviewedCount || 0,
    review,
    tasks,
    commands: {
      reviewCheckJson: followUpCommands.reviewCheckJson.command,
      reviewCheckReport: followUpCommands.reviewCheckReport.command,
      proposalPatchPreview: followUpCommands.proposalPatchPreview.command,
      strictGate: followUpCommands.strictGate.command,
    },
    commandArgs: {
      reviewCheckJson: followUpCommands.reviewCheckJson.commandArgs,
      reviewCheckReport: followUpCommands.reviewCheckReport.commandArgs,
      proposalPatchPreview: followUpCommands.proposalPatchPreview.commandArgs,
      strictGate: followUpCommands.strictGate.commandArgs,
    },
    commandContract,
    recommendations: tasks.length > 0
      ? [{
        level: "warning",
        text: "Apply accepted proposal deltas manually, then mark each reviewed decision as applied only after verification passes.",
      }]
      : [{
        level: "info",
        text: "No accepted skill proposals are ready to apply. Mark reviewed proposals as accepted before generating an apply plan.",
      }],
    privacy: {
      mutatesProfile: false,
      mutatesReviewFile: false,
      mutatesSkillFiles: false,
      callsExternalAiApis: false,
      storesRawBriefText: false,
      exposesEntryTextPreview: true,
    },
  };
}
