// Skill proposal review-state loading and review checks for `design-ai learn --propose-skills`.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const REVIEW_STATUSES = ["accepted", "rejected", "applied", "deferred"];
const REVIEW_CLEAR_STATUSES = new Set(["rejected", "applied"]);

export function proposalStatus({ signalStatus, proposalCount }) {
  if (signalStatus === "fail") return "fail";
  if (signalStatus && signalStatus !== "pass") return "warn";
  if (proposalCount > 0) return "warn";
  return "pass";
}

function normalizeReviewStatus(rawStatus) {
  const status = String(rawStatus || "").trim().toLowerCase();
  return REVIEW_STATUSES.includes(status) ? status : "";
}

function emptyProposalReviewState(reviewFile = "") {
  return {
    file: reviewFile ? path.resolve(reviewFile) : "",
    exists: false,
    status: reviewFile ? "missing" : "not-configured",
    decisionCount: 0,
    matchedCount: 0,
    staleCount: 0,
    pendingCount: 0,
    acceptedCount: 0,
    rejectedCount: 0,
    appliedCount: 0,
    deferredCount: 0,
    clearedCount: 0,
    warnings: [],
    decisionsByProposalId: new Map(),
  };
}

export function loadSkillProposalReviewState(reviewFile = "") {
  if (!reviewFile) return emptyProposalReviewState();
  const resolvedFile = path.resolve(reviewFile);
  if (!existsSync(resolvedFile)) return emptyProposalReviewState(resolvedFile);

  const state = emptyProposalReviewState(resolvedFile);
  state.exists = true;
  state.status = "pass";

  let rawPayload = null;
  try {
    rawPayload = JSON.parse(readFileSync(resolvedFile, "utf8"));
  } catch {
    return {
      ...state,
      status: "fail",
      warnings: [`Review file is not valid JSON: ${resolvedFile}`],
    };
  }

  const rawDecisions = Array.isArray(rawPayload?.decisions)
    ? rawPayload.decisions
    : Array.isArray(rawPayload?.reviews)
      ? rawPayload.reviews
      : [];

  if (!Array.isArray(rawPayload?.decisions) && !Array.isArray(rawPayload?.reviews)) {
    state.status = "warn";
    state.warnings.push("Review file should contain a decisions array.");
  }

  rawDecisions.forEach((decision, index) => {
    const proposalId = String(decision?.proposalId || decision?.id || "").trim();
    const status = normalizeReviewStatus(decision?.status);
    if (!proposalId) {
      state.status = state.status === "fail" ? "fail" : "warn";
      state.warnings.push(`Decision ${index + 1} is missing proposalId.`);
      return;
    }
    if (!status) {
      state.status = state.status === "fail" ? "fail" : "warn";
      state.warnings.push(`Decision ${proposalId} has unsupported status; use ${REVIEW_STATUSES.join(", ")}.`);
      return;
    }
    state.decisionsByProposalId.set(proposalId, {
      proposalId,
      status,
      reviewedAt: String(decision?.reviewedAt || decision?.createdAt || "").trim(),
      reviewer: String(decision?.reviewer || "").trim(),
      note: String(decision?.note || decision?.reason || "").trim(),
    });
  });

  state.decisionCount = state.decisionsByProposalId.size;
  return state;
}

export function applySkillProposalReviewState(proposals, reviewState) {
  const decisions = reviewState?.decisionsByProposalId instanceof Map
    ? reviewState.decisionsByProposalId
    : new Map();
  const currentProposalIds = new Set(proposals.map((proposal) => proposal.id));
  const reviewedProposals = proposals.map((proposal) => {
    const decision = decisions.get(proposal.id);
    const reviewStatus = decision?.status || "pending";
    const reviewClearsStrict = REVIEW_CLEAR_STATUSES.has(reviewStatus);
    return {
      ...proposal,
      reviewStatus,
      reviewClearsStrict,
      ...(decision ? { reviewDecision: decision } : {}),
    };
  });

  const counts = {
    matchedCount: reviewedProposals.filter((proposal) => proposal.reviewDecision).length,
    staleCount: [...decisions.keys()].filter((proposalId) => !currentProposalIds.has(proposalId)).length,
    pendingCount: reviewedProposals.filter((proposal) => !proposal.reviewClearsStrict).length,
    acceptedCount: reviewedProposals.filter((proposal) => proposal.reviewStatus === "accepted").length,
    rejectedCount: reviewedProposals.filter((proposal) => proposal.reviewStatus === "rejected").length,
    appliedCount: reviewedProposals.filter((proposal) => proposal.reviewStatus === "applied").length,
    deferredCount: reviewedProposals.filter((proposal) => proposal.reviewStatus === "deferred").length,
    clearedCount: reviewedProposals.filter((proposal) => proposal.reviewClearsStrict).length,
  };

  return {
    proposals: reviewedProposals,
    review: {
      file: reviewState?.file || "",
      exists: Boolean(reviewState?.exists),
      status: reviewState?.status || "not-configured",
      decisionCount: reviewState?.decisionCount || 0,
      warnings: reviewState?.warnings || [],
      ...counts,
    },
  };
}

export function skillProposalStatus({ signalStatus, reviewStatus, pendingReviewCount, reviewWarnings }) {
  if (signalStatus === "fail" || reviewStatus === "fail") return "fail";
  if (signalStatus && signalStatus !== "pass") return "warn";
  if (reviewWarnings > 0) return "warn";
  if (pendingReviewCount > 0) return "warn";
  return "pass";
}

function reviewCheck({ id, level = "pass", passed = true, message, evidence = {} }) {
  return {
    id,
    level,
    passed,
    message,
    evidence,
  };
}

function summarizeReviewChecks(checks) {
  const failures = checks.filter((check) => check.level === "fail").length;
  const warnings = checks.filter((check) => check.level === "warn").length;
  return {
    status: failures > 0 ? "fail" : warnings > 0 ? "warn" : "pass",
    failures,
    warnings,
    passes: checks.filter((check) => check.level === "pass").length,
    total: checks.length,
  };
}

export function buildSkillProposalReviewCheck(payload, {
  generatedAt = new Date(),
} = {}) {
  const generatedAtText = generatedAt instanceof Date ? generatedAt.toISOString() : String(generatedAt || "");
  const review = payload.review || {};
  const reviewFile = payload.reviewFile || review.file || "";
  const warnings = Array.isArray(review.warnings) ? review.warnings : [];
  const checks = [];

  checks.push(reviewCheck({
    id: "review-file-configured",
    level: reviewFile ? "pass" : "fail",
    passed: Boolean(reviewFile),
    message: reviewFile ? "A skill proposal review file is configured." : "No review file was provided.",
    evidence: { reviewFile },
  }));
  checks.push(reviewCheck({
    id: "review-file-exists",
    level: review.exists ? "pass" : "fail",
    passed: Boolean(review.exists),
    message: review.exists ? "The review file exists." : "The review file does not exist.",
    evidence: { reviewFile, exists: Boolean(review.exists) },
  }));
  checks.push(reviewCheck({
    id: "review-file-valid",
    level: review.status === "fail" ? "fail" : warnings.length > 0 || review.status === "warn" ? "warn" : "pass",
    passed: review.status === "pass",
    message: review.status === "pass"
      ? "The review file is valid and has a decisions array."
      : `Review file status is ${review.status || "unknown"}.`,
    evidence: { reviewStatus: review.status || "unknown", warnings },
  }));
  checks.push(reviewCheck({
    id: "current-proposals-cleared",
    level: (payload.pendingReviewCount || 0) > 0 ? "warn" : "pass",
    passed: (payload.pendingReviewCount || 0) === 0,
    message: (payload.pendingReviewCount || 0) === 0
      ? "All current proposals are applied or rejected."
      : "Some current proposals are still pending, accepted, or deferred.",
    evidence: {
      proposalCount: payload.proposalCount || 0,
      pendingReviewCount: payload.pendingReviewCount || 0,
      clearedCount: review.clearedCount || 0,
    },
  }));
  checks.push(reviewCheck({
    id: "no-stale-review-decisions",
    level: (review.staleCount || 0) > 0 ? "warn" : "pass",
    passed: (review.staleCount || 0) === 0,
    message: (review.staleCount || 0) === 0
      ? "No stale review decisions were found."
      : "Review file contains decisions for proposals that are no longer current.",
    evidence: {
      staleCount: review.staleCount || 0,
      decisionCount: review.decisionCount || 0,
      matchedCount: review.matchedCount || 0,
    },
  }));

  const summary = summarizeReviewChecks(checks);
  return {
    version: 1,
    kind: "skill-proposal-review-check",
    generatedAt: generatedAtText,
    file: payload.file,
    usageFile: payload.usageFile,
    signalSource: payload.signalSource,
    reviewFile,
    status: summary.status,
    proposalStatus: payload.status,
    signalStatus: payload.signalStatus,
    proposalCount: payload.proposalCount || 0,
    pendingReviewCount: payload.pendingReviewCount || 0,
    reviewedCount: payload.reviewedCount || 0,
    review,
    summary,
    checks,
    recommendations: summary.status === "pass"
      ? [{
        level: "info",
        text: "Review decisions clear the current skill proposal gate. Re-run proposal verification after any manual skill edit.",
      }]
      : [{
        level: "warning",
        text: "Refresh the review file from `--review-template`, then mark current proposals as applied or rejected after manual review.",
      }],
    privacy: {
      mutatesProfile: false,
      mutatesSkillFiles: false,
      callsExternalAiApis: false,
      storesRawBriefText: false,
      exposesEntryTextPreview: false,
    },
  };
}
