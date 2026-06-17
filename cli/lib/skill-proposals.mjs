// Preview-only skill evolution proposal builder for local learning/check signals.

import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

import {
  defaultLearningFile,
  defaultLearningUsageFile,
  loadLearningProfile,
} from "./learn.mjs";
import { PACKAGE_ROOT } from "./paths.mjs";
import { routeById } from "./route.mjs";
import { learningSignalRegistry } from "./signals.mjs";

const DEFAULT_MIN_EVIDENCE_COUNT = 2;
const REVIEW_STATUSES = ["accepted", "rejected", "applied", "deferred"];
const REVIEW_CLEAR_STATUSES = new Set(["rejected", "applied"]);
const APPLY_PLAN_FOLLOW_UP_COMMAND_SPECS = Object.freeze({
  reviewCheckJson: ["--review-check", "--json"],
  reviewCheckReport: ["--review-check", "--report", "--out", "skill-proposal-review-check.md"],
  proposalPatchPreview: ["--patch", "--out", "skill-proposals.patch"],
  strictGate: ["--strict", "--json"],
});
const APPLY_PLAN_FOLLOW_UP_COMMAND_POLICIES = Object.freeze({
  reviewCheckJson: "preview-only",
  reviewCheckReport: "output-artifact",
  proposalPatchPreview: "output-artifact",
  strictGate: "strict-readiness-gate",
});
const APPLY_PLAN_FOLLOW_UP_COMMAND_DISPLAY_LABELS = Object.freeze({
  reviewCheckJson: "Review check JSON",
  reviewCheckReport: "Review check Markdown report",
  proposalPatchPreview: "Skill proposal patch preview",
  strictGate: "Strict proposal readiness gate",
});
const APPLY_PLAN_FOLLOW_UP_COMMAND_DESCRIPTIONS = Object.freeze({
  reviewCheckJson: "Check proposal review readiness as machine-readable JSON without writing local files.",
  reviewCheckReport: "Generate a Markdown review-check artifact for accepted proposal readiness.",
  proposalPatchPreview: "Generate a unified diff preview for accepted skill proposal edits.",
  strictGate: "Run the strict proposal readiness gate before marking accepted proposals applied.",
});
const APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACTS = Object.freeze({
  reviewCheckReport: "skill-proposal-review-check.md",
  proposalPatchPreview: "skill-proposals.patch",
});
const APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_TYPES = Object.freeze({
  reviewCheckReport: "markdown-report",
  proposalPatchPreview: "unified-diff",
});
const APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_ACTIONS = Object.freeze({
  reviewCheckReport: "render-markdown-report",
  proposalPatchPreview: "render-unified-diff-preview",
});
const APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_MEDIA_TYPES = Object.freeze({
  reviewCheckReport: "text/markdown",
  proposalPatchPreview: "text/x-diff",
});
const APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_DISPOSITIONS = Object.freeze({
  reviewCheckReport: "review-only",
  proposalPatchPreview: "manual-apply-preview",
});
const APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_MANUAL_APPLY_CANDIDATES = Object.freeze({
  reviewCheckReport: false,
  proposalPatchPreview: true,
});
const APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_REQUIRES_MANUAL_REVIEW = Object.freeze({
  reviewCheckReport: false,
  proposalPatchPreview: true,
});
const APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_REVIEW_INSTRUCTIONS = Object.freeze({
  reviewCheckReport: "Review the Markdown readiness report before changing proposal review status.",
  proposalPatchPreview: "Review the unified diff manually before applying any skill-file edits.",
});
const APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_REQUIRES_CLEAN_WORKSPACE_BEFORE_APPLY = Object.freeze({
  reviewCheckReport: false,
  proposalPatchPreview: true,
});
const APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_APPLY_PRECONDITION_IDS = Object.freeze({
  reviewCheckReport: Object.freeze([]),
  proposalPatchPreview: Object.freeze(["manual-review", "clean-workspace"]),
});
const APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_APPLY_PRECONDITION_LABELS = Object.freeze({
  reviewCheckReport: Object.freeze([]),
  proposalPatchPreview: Object.freeze(["Manual review completed", "Clean workspace confirmed"]),
});
const APPLY_PLAN_BASE_COMMAND = Object.freeze(["design-ai", "learn", "--propose-skills"]);
const APPLY_PLAN_FORBIDDEN_FLAGS = Object.freeze(["--yes"]);
const CATEGORY_FALLBACK_SKILLS = {
  accessibility: "skills/ux-audit/SKILL.md",
  korean: "skills/design-system-builder/SKILL.md",
  workflow: "skills/handoff-spec/SKILL.md",
  brand: "skills/design-critique/SKILL.md",
  constraint: "skills/handoff-spec/SKILL.md",
  preference: "skills/design-critique/SKILL.md",
  other: "skills/design-critique/SKILL.md",
};

function stableHash(value, length = 10) {
  return createHash("sha256").update(String(value)).digest("hex").slice(0, length);
}

function slug(value) {
  return String(value || "skill")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 44) || "skill";
}

function previewText(text, maxLength = 180) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1)}...`;
}

function applyPreconditionsForCommandKey(commandKey) {
  const ids = APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_APPLY_PRECONDITION_IDS[commandKey] || [];
  const labels = APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_APPLY_PRECONDITION_LABELS[commandKey] || [];
  return ids.map((id, index) => ({
    id,
    label: labels[index] || id,
    required: true,
  }));
}

function applyPreconditionIsSatisfied(precondition) {
  return precondition?.satisfied === true;
}

function manualApplyBlockedReason({ manualApplyCandidate, requiredPendingApplyPreconditionCount }) {
  if (!manualApplyCandidate) {
    return {
      code: "not-manual-apply-candidate",
      message: "This output artifact is review-only and cannot be applied.",
    };
  }
  if (requiredPendingApplyPreconditionCount > 0) {
    return {
      code: "required-preconditions-pending",
      message: "Complete required apply preconditions before applying this patch preview.",
    };
  }
  return { code: "", message: "" };
}

function manualApplyStatus({ manualApplyCandidate, manualApplyReady }) {
  if (manualApplyReady) return "ready";
  if (manualApplyCandidate) return "blocked";
  return "not-applicable";
}

function manualApplyStatusLabel(status) {
  if (status === "ready") return "Ready to apply";
  if (status === "blocked") return "Blocked";
  return "Review only";
}

function manualApplyStatusTone(status) {
  if (status === "ready") return "success";
  if (status === "blocked") return "warning";
  return "neutral";
}

function routeIdFromSource(source) {
  const text = String(source || "").trim();
  if (!text.startsWith("check:")) return "";
  const routeId = text.slice("check:".length).trim();
  if (!routeId || routeId === "artifact") return "";
  return routeId;
}

function issueTitleFromText(text) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  const match = normalized.match(/^Improve future outputs by addressing\s+([^:]+):/i);
  return match ? match[1].trim() : "";
}

function routeSkillPath(routeId, sourceRoot) {
  if (!routeId) return "";
  try {
    const route = routeById({ routeId, sourceRoot });
    const firstExistingSkill = (route.skills || []).find((skill) => skill.exists);
    return firstExistingSkill?.path || route.skills?.[0]?.path || "";
  } catch {
    return "";
  }
}

function candidateSkillForEntry(entry, sourceRoot) {
  const routeId = routeIdFromSource(entry.source);
  const routeSkill = routeSkillPath(routeId, sourceRoot);
  return {
    routeId,
    skillPath: routeSkill || CATEGORY_FALLBACK_SKILLS[entry.category] || CATEGORY_FALLBACK_SKILLS.other,
  };
}

function riskForGroup(group) {
  if (group.routeIds.size > 1) return "medium";
  if (group.entries.length >= 5) return "medium";
  if (group.skillPath === "skills/design-system-builder/SKILL.md") return "medium";
  return "low";
}

function instructionDeltaForGroup(group) {
  const titleText = [...group.titles].join(" ").toLowerCase();
  if (group.category === "accessibility") {
    return "Add a pre-handoff accessibility checkpoint: when the artifact includes UI behavior, explicitly cover keyboard reachability, visible focus state, screen-reader semantics, and WCAG 2.1 AA contrast.";
  }
  if (group.category === "korean") {
    return "Add a Korean-context checkpoint: when Korean users or copy are in scope, explicitly verify Hangul typography, line-height, honorific level, local density conventions, and Korean copy risks.";
  }
  if (titleText.includes("responsive") || titleText.includes("mobile") || titleText.includes("viewport")) {
    return "Add a responsive QA checkpoint: describe desktop, tablet, and mobile behavior, likely breakpoint risks, and the verification command before handoff.";
  }
  if (group.category === "workflow") {
    return "Add a workflow QA checkpoint: convert recurring artifact warnings into evidence, next action, verification command, and residual risk before final handoff.";
  }
  if (group.category === "brand") {
    return "Add a brand-fit checkpoint: state brand tone, visual density, copy posture, and any mismatch risk when the task includes product or marketing artifacts.";
  }
  if (group.category === "constraint") {
    return "Add a guardrail checkpoint: restate operator constraints, dependency limits, and external-system boundaries before proposing implementation changes.";
  }
  return "Add a learned-preference checkpoint: fold repeated local feedback into the skill's final review checklist with evidence and a verification step.";
}

function verificationCommandForGroup(group) {
  const routeId = [...group.routeIds].sort()[0] || "";
  if (routeId) {
    return `node cli/bin/design-ai.mjs check --examples --route ${routeId} --limit 1 --strict --json`;
  }
  return "node cli/bin/design-ai.mjs check --examples --route design-from-brief --limit 1 --strict --json";
}

function evidenceForEntry(entry) {
  return {
    kind: "check-capture",
    entryId: entry.id,
    category: entry.category,
    source: entry.source || "check:artifact",
    routeId: routeIdFromSource(entry.source) || "",
    title: issueTitleFromText(entry.text),
    createdAt: entry.createdAt || "",
    textPreview: previewText(entry.text),
  };
}

function groupCheckCaptureEntries(entries, sourceRoot) {
  const groups = new Map();
  for (const entry of entries) {
    const candidate = candidateSkillForEntry(entry, sourceRoot);
    const key = `${candidate.skillPath}\n${entry.category || "other"}`;
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        skillPath: candidate.skillPath,
        category: entry.category || "other",
        entries: [],
        routeIds: new Set(),
        sources: new Set(),
        titles: new Set(),
      });
    }
    const group = groups.get(key);
    group.entries.push(entry);
    if (candidate.routeId) group.routeIds.add(candidate.routeId);
    if (entry.source) group.sources.add(entry.source);
    const title = issueTitleFromText(entry.text);
    if (title) group.titles.add(title);
  }
  return [...groups.values()];
}

function proposalFromGroup(group) {
  const evidence = group.entries
    .slice()
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
    .slice(0, 5)
    .map(evidenceForEntry);
  const routeLabel = [...group.routeIds].sort().join(", ") || "artifact";
  const title = `Update ${group.skillPath} for repeated ${group.category} check captures`;
  const hashInput = `${group.skillPath}|${group.category}|${[...group.sources].sort().join(",")}|${[...group.titles].sort().join(",")}`;
  return {
    id: `skill-proposal-${slug(path.basename(path.dirname(group.skillPath) || group.skillPath))}-${stableHash(hashInput)}`,
    candidateSkill: path.basename(path.dirname(group.skillPath) || group.skillPath),
    candidateSkillPath: group.skillPath,
    title,
    riskLevel: riskForGroup(group),
    category: group.category,
    routeIds: [...group.routeIds].sort(),
    evidenceSources: evidence,
    sourceIssueCount: group.entries.length,
    proposedInstructionDelta: instructionDeltaForGroup(group),
    verificationCommand: verificationCommandForGroup(group),
    rationale: `Repeated ${group.category} check captures were recorded for ${routeLabel}; preview this delta before editing the skill file.`,
  };
}

function skippedFromGroup(group, minEvidenceCount) {
  return {
    candidateSkillPath: group.skillPath,
    category: group.category,
    sourceIssueCount: group.entries.length,
    reason: `Needs at least ${minEvidenceCount} related check-capture entries before proposing a skill edit.`,
    evidenceSources: group.entries
      .slice()
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
      .slice(0, 3)
      .map(evidenceForEntry),
  };
}

function proposalStatus({ signalStatus, proposalCount }) {
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

function applySkillProposalReviewState(proposals, reviewState) {
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

function skillProposalStatus({ signalStatus, reviewStatus, pendingReviewCount, reviewWarnings }) {
  if (signalStatus === "fail" || reviewStatus === "fail") return "fail";
  if (signalStatus && signalStatus !== "pass") return "warn";
  if (reviewWarnings > 0) return "warn";
  if (pendingReviewCount > 0) return "warn";
  return "pass";
}

export function buildSkillEvolutionProposals({
  filePath = defaultLearningFile(),
  usageFile = "",
  signalSource = "",
  root = process.cwd(),
  sourceRoot = PACKAGE_ROOT,
  now = new Date(),
  minEvidenceCount = DEFAULT_MIN_EVIDENCE_COUNT,
  reviewFile = "",
  signalRegistryProvider = learningSignalRegistry,
} = {}) {
  const resolvedFile = path.resolve(filePath);
  const resolvedUsageFile = path.resolve(usageFile || defaultLearningUsageFile(resolvedFile));
  const generatedAt = (now instanceof Date ? now : new Date(now)).toISOString();
  const profile = loadLearningProfile(resolvedFile);
  const checkEntries = (profile.entries || [])
    .filter((entry) => String(entry.source || "").startsWith("check:"));
  const groups = groupCheckCaptureEntries(checkEntries, sourceRoot);
  const rawProposals = groups
    .filter((group) => group.entries.length >= minEvidenceCount)
    .map(proposalFromGroup)
    .sort((a, b) => (
      b.sourceIssueCount - a.sourceIssueCount
      || a.candidateSkillPath.localeCompare(b.candidateSkillPath)
      || a.category.localeCompare(b.category)
    ));
  const skipped = groups
    .filter((group) => group.entries.length < minEvidenceCount)
    .map((group) => skippedFromGroup(group, minEvidenceCount))
    .sort((a, b) => a.candidateSkillPath.localeCompare(b.candidateSkillPath) || a.category.localeCompare(b.category));
  const registry = signalRegistryProvider({
    filePath: resolvedFile,
    usageFile: resolvedUsageFile,
    signalSource,
    root,
    now,
  });
  const signalStatus = registry.status || "unknown";
  const reviewState = loadSkillProposalReviewState(reviewFile);
  const reviewed = applySkillProposalReviewState(rawProposals, reviewState);
  const proposals = reviewed.proposals;
  const status = reviewFile
    ? skillProposalStatus({
      signalStatus,
      reviewStatus: reviewed.review.status,
      pendingReviewCount: reviewed.review.pendingCount,
      reviewWarnings: reviewed.review.warnings.length,
    })
    : proposalStatus({
      signalStatus,
      proposalCount: proposals.length,
    });

  return {
    version: 1,
    generatedAt,
    file: resolvedFile,
    usageFile: resolvedUsageFile,
    signalSource: registry.signalSource || (signalSource ? path.resolve(signalSource) : path.resolve(root)),
    dryRun: true,
    applied: false,
    minEvidenceCount,
    checkCaptureCount: checkEntries.length,
    candidateCount: groups.length,
    count: proposals.length,
    proposalCount: proposals.length,
    skippedCount: skipped.length,
    pendingReviewCount: reviewed.review.pendingCount,
    reviewedCount: reviewed.review.matchedCount,
    reviewFile: reviewed.review.file,
    review: reviewed.review,
    status,
    signalStatus,
    proposals,
    skipped,
    recommendations: proposals.length === 0
      ? [{
        level: "info",
        text: "No repeated check-capture groups crossed the proposal threshold yet. Keep capturing explicit check --learn --yes warnings/failures before editing skills.",
      }]
      : reviewed.review.pendingCount === 0 && reviewFile
        ? [{
          level: "info",
          text: "All current skill proposals are marked applied or rejected in the review file. Re-run strict checks after any manual skill edits.",
        }]
      : [{
        level: "info",
        text: "Review proposed instruction deltas manually. Mark applied or rejected decisions in the review file to clear the strict proposal gate.",
      }],
    privacy: {
      mutatesProfile: false,
      mutatesSkillFiles: false,
      callsExternalAiApis: false,
      storesRawBriefText: false,
      exposesEntryTextPreview: true,
    },
  };
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

function shellQuote(value) {
  const text = String(value ?? "");
  if (/^[A-Za-z0-9_./:=@%+-]+$/.test(text)) return text;
  return `'${text.replace(/'/g, "'\\''")}'`;
}

function commandFromArgs(args) {
  return args.map(shellQuote).join(" ");
}

function proposalContextArgs(payload = {}) {
  const args = [];
  if (payload.file) args.push("--file", payload.file);
  if (payload.usageFile) args.push("--usage-file", payload.usageFile);
  if (payload.signalSource) args.push("--from-file", payload.signalSource);
  return args;
}

function commandForReviewFile(payload, extraArgs = []) {
  const reviewFile = payload.reviewFile || payload.review?.file || "skill-proposals.review.json";
  const args = [
    "design-ai",
    "learn",
    "--propose-skills",
    ...proposalContextArgs(payload),
    "--review-file",
    reviewFile,
    ...extraArgs,
  ];
  return {
    command: commandFromArgs(args),
    commandArgs: args.map((item) => String(item)),
  };
}

function applyPlanFollowUpCommands(payload, reviewFile) {
  const context = { ...payload, reviewFile };
  return Object.fromEntries(Object.entries(APPLY_PLAN_FOLLOW_UP_COMMAND_SPECS).map(([key, extraArgs]) => [
    key,
    commandForReviewFile(context, extraArgs),
  ]));
}

function argsEndWith(args, suffix) {
  if (!Array.isArray(args) || args.length < suffix.length) return false;
  return suffix.every((item, index) => args[args.length - suffix.length + index] === item);
}

function argsStartWith(args, prefix) {
  if (!Array.isArray(args) || args.length < prefix.length) return false;
  return prefix.every((item, index) => args[index] === item);
}

function commandArgCheck({ id, passed, message, evidence = {} }) {
  return {
    id,
    level: passed ? "pass" : "fail",
    passed,
    message,
    evidence,
  };
}

function buildApplyPlanCommandContract(followUpCommands, reviewFile) {
  const requiredKeys = Object.keys(APPLY_PLAN_FOLLOW_UP_COMMAND_SPECS);
  const commandArgs = Object.fromEntries(Object.entries(followUpCommands).map(([key, value]) => [
    key,
    Array.isArray(value?.commandArgs) ? value.commandArgs : [],
  ]));
  const missingCommandKeys = requiredKeys.filter((key) => !Array.isArray(commandArgs[key]) || commandArgs[key].length === 0);
  const unexpectedCommandKeys = Object.keys(commandArgs).filter((key) => !requiredKeys.includes(key));
  const checks = [
    commandArgCheck({
      id: "required-command-keys-present",
      passed: missingCommandKeys.length === 0,
      message: missingCommandKeys.length === 0
        ? "All required apply-plan follow-up commands are present."
        : "Some required apply-plan follow-up commands are missing.",
      evidence: { requiredKeys, missingCommandKeys },
    }),
    commandArgCheck({
      id: "no-unexpected-command-keys",
      passed: unexpectedCommandKeys.length === 0,
      message: unexpectedCommandKeys.length === 0
        ? "No unexpected apply-plan follow-up commands are present."
        : "Unexpected apply-plan follow-up command keys were found.",
      evidence: { unexpectedCommandKeys },
    }),
  ];

  for (const key of requiredKeys) {
    const args = commandArgs[key] || [];
    const reviewFileIndex = args.indexOf("--review-file");
    checks.push(commandArgCheck({
      id: `${key}-base-command`,
      passed: argsStartWith(args, APPLY_PLAN_BASE_COMMAND),
      message: `${key} starts with design-ai learn --propose-skills.`,
      evidence: { commandArgs: args.slice(0, APPLY_PLAN_BASE_COMMAND.length) },
    }));
    checks.push(commandArgCheck({
      id: `${key}-review-file-context`,
      passed: Boolean(reviewFile) && reviewFileIndex >= 0 && args[reviewFileIndex + 1] === reviewFile,
      message: `${key} preserves the configured review file.`,
      evidence: { reviewFile, commandReviewFile: reviewFileIndex >= 0 ? args[reviewFileIndex + 1] || "" : "" },
    }));
    checks.push(commandArgCheck({
      id: `${key}-expected-suffix`,
      passed: argsEndWith(args, APPLY_PLAN_FOLLOW_UP_COMMAND_SPECS[key]),
      message: `${key} ends with the expected action flags.`,
      evidence: { expectedSuffix: APPLY_PLAN_FOLLOW_UP_COMMAND_SPECS[key], actualSuffix: args.slice(-APPLY_PLAN_FOLLOW_UP_COMMAND_SPECS[key].length) },
    }));
    checks.push(commandArgCheck({
      id: `${key}-read-only-flags`,
      passed: APPLY_PLAN_FORBIDDEN_FLAGS.every((flag) => !args.includes(flag)),
      message: `${key} does not include write/apply confirmation flags.`,
      evidence: { forbiddenFlags: APPLY_PLAN_FORBIDDEN_FLAGS },
    }));
  }

  const failures = checks.filter((check) => check.level === "fail").length;
  const warnings = checks.filter((check) => check.level === "warn").length;
  const passes = checks.filter((check) => check.level === "pass").length;
  const checkCount = checks.length;
  const failedChecks = checks
    .filter((check) => check.level === "fail")
    .map((check) => ({
      id: check.id,
      message: check.message,
      evidence: check.evidence || {},
    }));
  const nextCommandKey = failures > 0 ? "" : "reviewCheckJson";
  const nextCommand = nextCommandKey ? followUpCommands[nextCommandKey]?.command || "" : "";
  const nextCommandArgs = nextCommandKey ? commandArgs[nextCommandKey] || [] : [];
  const nextCommandRunPolicy = nextCommandKey ? "preview-only" : "";
  const nextCommandSafety = nextCommandKey
    ? {
      level: "read-only",
      writesLocalFiles: false,
      mutatesLocalState: false,
      mutatesProfile: false,
      mutatesReviewFile: false,
      mutatesSkillFiles: false,
      callsExternalAiApis: false,
      requiresCleanWorkspace: false,
      reason: "The next apply-plan follow-up command only checks proposal review readiness and does not mutate local state.",
    }
    : {};
  const commandSequence = failures > 0
    ? []
    : requiredKeys.map((key, index) => {
      const writesOutputArtifact = key === "reviewCheckReport" || key === "proposalPatchPreview";
      return {
        step: index + 1,
        key,
        command: followUpCommands[key]?.command || "",
        commandArgs: commandArgs[key] || [],
        runPolicy: APPLY_PLAN_FOLLOW_UP_COMMAND_POLICIES[key] || "preview-only",
        safety: {
          level: writesOutputArtifact ? "local-output" : "read-only",
          writesLocalFiles: writesOutputArtifact,
          writesOutputArtifact,
          mutatesLocalState: writesOutputArtifact,
          mutatesProfile: false,
          mutatesReviewFile: false,
          mutatesSkillFiles: false,
          callsExternalAiApis: false,
          requiresCleanWorkspace: false,
          reason: writesOutputArtifact
            ? "This follow-up command writes a local preview artifact with --out but does not mutate learning, review, or skill files."
            : "This follow-up command validates readiness without writing local files or mutating local state.",
        },
      };
    });
  const commandSequenceSummary = {
    executable: failures === 0,
    blocked: failures > 0,
    stepCount: commandSequence.length,
    readOnlyStepCount: commandSequence.filter((item) => item.safety?.level === "read-only").length,
    localOutputStepCount: commandSequence.filter((item) => item.safety?.level === "local-output").length,
    writesLocalFiles: commandSequence.some((item) => Boolean(item.safety?.writesLocalFiles)),
    writesOutputArtifacts: commandSequence.some((item) => Boolean(item.safety?.writesOutputArtifact)),
    mutatesProfile: commandSequence.some((item) => Boolean(item.safety?.mutatesProfile)),
    mutatesReviewFile: commandSequence.some((item) => Boolean(item.safety?.mutatesReviewFile)),
    mutatesSkillFiles: commandSequence.some((item) => Boolean(item.safety?.mutatesSkillFiles)),
    callsExternalAiApis: commandSequence.some((item) => Boolean(item.safety?.callsExternalAiApis)),
    requiresCleanWorkspace: commandSequence.some((item) => Boolean(item.safety?.requiresCleanWorkspace)),
    runPolicy: failures > 0 ? "blocked" : "mixed-preview-local-output",
    reason: failures > 0
      ? "Command contract failures must be fixed before running follow-up commands."
      : "The sequence combines read-only readiness checks with local output artifact previews; it does not mutate learning, review, or skill files.",
  };
  const commandSequenceKeys = commandSequence.map((item) => item.key);
  const commandSequenceByKey = Object.fromEntries(commandSequence.map((item) => [item.key, item]));
  const operatorRunbookStages = failures > 0
    ? []
    : [
      {
        step: 1,
        key: "previewArtifacts",
        label: "Generate optional review artifacts",
        kind: "local-output-preview",
        required: false,
        commandKeys: ["reviewCheckReport", "proposalPatchPreview"],
        commands: ["reviewCheckReport", "proposalPatchPreview"].map((key) => commandSequenceByKey[key]),
        reason: "Optional Markdown review and patch preview artifacts can be generated before manual skill edits.",
      },
      {
        step: 2,
        key: "manualSkillEdit",
        label: "Apply accepted skill deltas manually",
        kind: "manual-review",
        required: true,
        commandKeys: [],
        commands: [],
        reason: "No apply-plan command mutates skill files; the operator must manually edit accepted skill deltas after review.",
      },
      {
        step: 3,
        key: "reviewReadiness",
        label: "Run review readiness check",
        kind: "read-only-check",
        required: true,
        commandKeys: ["reviewCheckJson"],
        commands: [commandSequenceByKey.reviewCheckJson],
        reason: "Run the read-only review check after manual skill edits to verify proposal review state.",
      },
      {
        step: 4,
        key: "strictGate",
        label: "Run strict readiness gate",
        kind: "read-only-gate",
        required: true,
        commandKeys: ["strictGate"],
        commands: [commandSequenceByKey.strictGate],
        reason: "Run the strict gate before marking accepted proposals applied.",
      },
    ];
  const operatorRunbookStageKeys = operatorRunbookStages.map((stage) => stage.key);
  const operatorRunbookStageByKey = Object.fromEntries(operatorRunbookStages.map((stage) => [stage.key, stage]));
  const summarizeOperatorRunbookStage = (stage) => {
    if (!stage) return {};
    const commandSafetyItems = stage.commands
      .map((command) => command?.safety)
      .filter((safety) => safety && typeof safety === "object");
    const writesLocalFiles = commandSafetyItems.some((safety) => Boolean(safety.writesLocalFiles));
    const writesOutputArtifacts = commandSafetyItems.some((safety) => Boolean(safety.writesOutputArtifact));
    const mutatesLocalState = commandSafetyItems.some((safety) => Boolean(safety.mutatesLocalState));
    const mutatesProfile = commandSafetyItems.some((safety) => Boolean(safety.mutatesProfile));
    const mutatesReviewFile = commandSafetyItems.some((safety) => Boolean(safety.mutatesReviewFile));
    const mutatesSkillFiles = commandSafetyItems.some((safety) => Boolean(safety.mutatesSkillFiles));
    const callsExternalAiApis = commandSafetyItems.some((safety) => Boolean(safety.callsExternalAiApis));
    const requiresCleanWorkspace = commandSafetyItems.some((safety) => Boolean(safety.requiresCleanWorkspace));
    return {
      key: stage.key,
      step: stage.step,
      label: stage.label,
      kind: stage.kind,
      required: stage.required,
      hasCommands: stage.commandKeys.length > 0,
      commandCount: stage.commandKeys.length,
      commandKeys: stage.commandKeys,
      writesLocalFiles,
      writesOutputArtifacts,
      mutatesLocalState,
      mutatesProfile,
      mutatesReviewFile,
      mutatesSkillFiles,
      callsExternalAiApis,
      requiresCleanWorkspace,
      reason: stage.reason,
    };
  };
  const nextStage = failures > 0
    ? null
    : operatorRunbookStageByKey.previewArtifacts || null;
  const nextRequiredStage = failures > 0
    ? null
    : operatorRunbookStages.find((stage) => stage.required) || null;
  const nextRequiredCommandStage = failures > 0
    ? null
    : operatorRunbookStages.find((stage) => stage.required && stage.commandKeys.length > 0) || null;
  const nextStageSummary = summarizeOperatorRunbookStage(nextStage);
  const nextRequiredStageSummary = summarizeOperatorRunbookStage(nextRequiredStage);
  const nextRequiredCommandStageSummary = summarizeOperatorRunbookStage(nextRequiredCommandStage);
  const summarizeDecisionCommand = (command) => command
    ? {
      step: command.step,
      key: command.key,
      command: command.command,
      commandArgs: command.commandArgs,
      runPolicy: command.runPolicy,
      safetyLevel: command.safety?.level || "",
      safety: {
        level: command.safety?.level || "",
        writesLocalFiles: Boolean(command.safety?.writesLocalFiles),
        writesOutputArtifact: Boolean(command.safety?.writesOutputArtifact),
        mutatesLocalState: Boolean(command.safety?.mutatesLocalState),
        mutatesProfile: Boolean(command.safety?.mutatesProfile),
        mutatesReviewFile: Boolean(command.safety?.mutatesReviewFile),
        mutatesSkillFiles: Boolean(command.safety?.mutatesSkillFiles),
        callsExternalAiApis: Boolean(command.safety?.callsExternalAiApis),
        requiresCleanWorkspace: Boolean(command.safety?.requiresCleanWorkspace),
        reason: command.safety?.reason || "",
      },
      writesLocalFiles: Boolean(command.safety?.writesLocalFiles),
      writesOutputArtifact: Boolean(command.safety?.writesOutputArtifact),
      mutatesLocalState: Boolean(command.safety?.mutatesLocalState),
      mutatesProfile: Boolean(command.safety?.mutatesProfile),
      mutatesReviewFile: Boolean(command.safety?.mutatesReviewFile),
      mutatesSkillFiles: Boolean(command.safety?.mutatesSkillFiles),
      callsExternalAiApis: Boolean(command.safety?.callsExternalAiApis),
      requiresCleanWorkspace: Boolean(command.safety?.requiresCleanWorkspace),
    }
    : {};
  const decisionCommands = failures > 0
    ? []
    : (nextStage?.commands || []).map((command) => summarizeDecisionCommand(command));
  const decisionCommandByKey = Object.fromEntries(decisionCommands.map((command) => [command.key, command]));
  const decisionCommandStepByKey = Object.fromEntries(decisionCommands.map((command) => [command.key, command.step]));
  const decisionCommandRunPolicyByKey = Object.fromEntries(
    decisionCommands.map((command) => [command.key, command.runPolicy]),
  );
  const decisionCommandSafetyLevelByKey = Object.fromEntries(
    decisionCommands.map((command) => [command.key, command.safetyLevel]),
  );
  const decisionCommandArgsByKey = Object.fromEntries(
    decisionCommands.map((command) => [command.key, command.commandArgs]),
  );
  const decisionCommandStringByKey = Object.fromEntries(
    decisionCommands.map((command) => [command.key, command.command]),
  );
  const decisionCommandDisplayLabelByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      APPLY_PLAN_FOLLOW_UP_COMMAND_DISPLAY_LABELS[command.key] || command.key,
    ]),
  );
  const decisionCommandDescriptionByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      APPLY_PLAN_FOLLOW_UP_COMMAND_DESCRIPTIONS[command.key] || "",
    ]),
  );
  const decisionCommandOutputArtifactByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACTS[command.key] || "",
    ]),
  );
  const decisionCommandOutputArtifactTypeByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_TYPES[command.key] || "",
    ]),
  );
  const decisionCommandOutputArtifactActionByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_ACTIONS[command.key] || "",
    ]),
  );
  const decisionCommandOutputArtifactMediaTypeByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_MEDIA_TYPES[command.key] || "",
    ]),
  );
  const decisionCommandOutputArtifactDispositionByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_DISPOSITIONS[command.key] || "",
    ]),
  );
  const decisionCommandOutputArtifactManualApplyCandidateByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_MANUAL_APPLY_CANDIDATES[command.key] || false,
    ]),
  );
  const decisionCommandOutputArtifactRequiresManualReviewByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_REQUIRES_MANUAL_REVIEW[command.key] || false,
    ]),
  );
  const decisionCommandOutputArtifactReviewInstructionByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_REVIEW_INSTRUCTIONS[command.key] || "",
    ]),
  );
  const decisionCommandOutputArtifactRequiresCleanWorkspaceBeforeApplyByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_REQUIRES_CLEAN_WORKSPACE_BEFORE_APPLY[command.key] || false,
    ]),
  );
  const decisionCommandOutputArtifactApplyPreconditionIdsByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      [...(APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_APPLY_PRECONDITION_IDS[command.key] || [])],
    ]),
  );
  const decisionCommandOutputArtifactApplyPreconditionLabelsByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      [...(APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_APPLY_PRECONDITION_LABELS[command.key] || [])],
    ]),
  );
  const decisionCommandOutputArtifactApplyPreconditionsByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      applyPreconditionsForCommandKey(command.key),
    ]),
  );
  const decisionCommandOutputArtifactApplyPreconditionCountByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      decisionCommandOutputArtifactApplyPreconditionsByKey[command.key]?.length || 0,
    ]),
  );
  const decisionCommandOutputArtifactRequiredApplyPreconditionCountByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      (decisionCommandOutputArtifactApplyPreconditionsByKey[command.key] || [])
        .filter((precondition) => precondition.required).length,
    ]),
  );
  const decisionCommandOutputArtifactSatisfiedApplyPreconditionCountByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      (decisionCommandOutputArtifactApplyPreconditionsByKey[command.key] || [])
        .filter((precondition) => applyPreconditionIsSatisfied(precondition)).length,
    ]),
  );
  const decisionCommandOutputArtifactPendingApplyPreconditionCountByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      (decisionCommandOutputArtifactApplyPreconditionsByKey[command.key] || [])
        .filter((precondition) => !applyPreconditionIsSatisfied(precondition)).length,
    ]),
  );
  const decisionCommandOutputArtifactRequiredPendingApplyPreconditionCountByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      (decisionCommandOutputArtifactApplyPreconditionsByKey[command.key] || [])
        .filter((precondition) => precondition.required && !applyPreconditionIsSatisfied(precondition)).length,
    ]),
  );
  const decisionCommandOutputArtifactManualApplyReadyByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      Boolean(decisionCommandOutputArtifactManualApplyCandidateByKey[command.key])
        && (decisionCommandOutputArtifactRequiredPendingApplyPreconditionCountByKey[command.key] || 0) === 0,
    ]),
  );
  const decisionCommandOutputArtifactManualApplyStatusByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      manualApplyStatus({
        manualApplyCandidate: Boolean(decisionCommandOutputArtifactManualApplyCandidateByKey[command.key]),
        manualApplyReady: Boolean(decisionCommandOutputArtifactManualApplyReadyByKey[command.key]),
      }),
    ]),
  );
  const decisionCommandOutputArtifactManualApplyStatusLabelByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      manualApplyStatusLabel(decisionCommandOutputArtifactManualApplyStatusByKey[command.key]),
    ]),
  );
  const decisionCommandOutputArtifactManualApplyStatusToneByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      manualApplyStatusTone(decisionCommandOutputArtifactManualApplyStatusByKey[command.key]),
    ]),
  );
  const decisionCommandOutputArtifactManualApplyBlockedReasonByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      manualApplyBlockedReason({
        manualApplyCandidate: Boolean(decisionCommandOutputArtifactManualApplyCandidateByKey[command.key]),
        requiredPendingApplyPreconditionCount: decisionCommandOutputArtifactRequiredPendingApplyPreconditionCountByKey[command.key] || 0,
      }).message,
    ]),
  );
  const decisionCommandOutputArtifactManualApplyBlockedReasonCodeByKey = Object.fromEntries(
    decisionCommands.map((command) => [
      command.key,
      manualApplyBlockedReason({
        manualApplyCandidate: Boolean(decisionCommandOutputArtifactManualApplyCandidateByKey[command.key]),
        requiredPendingApplyPreconditionCount: decisionCommandOutputArtifactRequiredPendingApplyPreconditionCountByKey[command.key] || 0,
      }).code,
    ]),
  );
  const decisionNextCommand = decisionCommands[0] || {};
  const decisionNextCommandDisplayLabel = decisionNextCommand.key
    ? decisionCommandDisplayLabelByKey[decisionNextCommand.key] || decisionNextCommand.key
    : "";
  const decisionNextCommandDescription = decisionNextCommand.key
    ? decisionCommandDescriptionByKey[decisionNextCommand.key] || ""
    : "";
  const decisionNextCommandOutputArtifact = decisionNextCommand.key
    ? decisionCommandOutputArtifactByKey[decisionNextCommand.key] || ""
    : "";
  const decisionNextCommandOutputArtifactType = decisionNextCommand.key
    ? decisionCommandOutputArtifactTypeByKey[decisionNextCommand.key] || ""
    : "";
  const decisionNextCommandOutputArtifactAction = decisionNextCommand.key
    ? decisionCommandOutputArtifactActionByKey[decisionNextCommand.key] || ""
    : "";
  const decisionNextCommandOutputArtifactMediaType = decisionNextCommand.key
    ? decisionCommandOutputArtifactMediaTypeByKey[decisionNextCommand.key] || ""
    : "";
  const decisionNextCommandOutputArtifactDisposition = decisionNextCommand.key
    ? decisionCommandOutputArtifactDispositionByKey[decisionNextCommand.key] || ""
    : "";
  const decisionNextCommandOutputArtifactManualApplyCandidate = decisionNextCommand.key
    ? decisionCommandOutputArtifactManualApplyCandidateByKey[decisionNextCommand.key] || false
    : false;
  const decisionNextCommandOutputArtifactRequiresManualReview = decisionNextCommand.key
    ? decisionCommandOutputArtifactRequiresManualReviewByKey[decisionNextCommand.key] || false
    : false;
  const decisionNextCommandOutputArtifactReviewInstruction = decisionNextCommand.key
    ? decisionCommandOutputArtifactReviewInstructionByKey[decisionNextCommand.key] || ""
    : "";
  const decisionNextCommandOutputArtifactRequiresCleanWorkspaceBeforeApply = decisionNextCommand.key
    ? decisionCommandOutputArtifactRequiresCleanWorkspaceBeforeApplyByKey[decisionNextCommand.key] || false
    : false;
  const decisionNextCommandOutputArtifactApplyPreconditionIds = decisionNextCommand.key
    ? decisionCommandOutputArtifactApplyPreconditionIdsByKey[decisionNextCommand.key] || []
    : [];
  const decisionNextCommandOutputArtifactApplyPreconditionLabels = decisionNextCommand.key
    ? decisionCommandOutputArtifactApplyPreconditionLabelsByKey[decisionNextCommand.key] || []
    : [];
  const decisionNextCommandOutputArtifactApplyPreconditions = decisionNextCommand.key
    ? decisionCommandOutputArtifactApplyPreconditionsByKey[decisionNextCommand.key] || []
    : [];
  const decisionNextCommandOutputArtifactApplyPreconditionCount = decisionNextCommand.key
    ? decisionCommandOutputArtifactApplyPreconditionCountByKey[decisionNextCommand.key] || 0
    : 0;
  const decisionNextCommandOutputArtifactRequiredApplyPreconditionCount = decisionNextCommand.key
    ? decisionCommandOutputArtifactRequiredApplyPreconditionCountByKey[decisionNextCommand.key] || 0
    : 0;
  const decisionNextCommandOutputArtifactSatisfiedApplyPreconditionCount = decisionNextCommand.key
    ? decisionCommandOutputArtifactSatisfiedApplyPreconditionCountByKey[decisionNextCommand.key] || 0
    : 0;
  const decisionNextCommandOutputArtifactPendingApplyPreconditionCount = decisionNextCommand.key
    ? decisionCommandOutputArtifactPendingApplyPreconditionCountByKey[decisionNextCommand.key] || 0
    : 0;
  const decisionNextCommandOutputArtifactRequiredPendingApplyPreconditionCount = decisionNextCommand.key
    ? decisionCommandOutputArtifactRequiredPendingApplyPreconditionCountByKey[decisionNextCommand.key] || 0
    : 0;
  const decisionNextCommandOutputArtifactManualApplyReady = decisionNextCommand.key
    ? decisionCommandOutputArtifactManualApplyReadyByKey[decisionNextCommand.key] || false
    : false;
  const decisionNextCommandOutputArtifactManualApplyStatus = decisionNextCommand.key
    ? decisionCommandOutputArtifactManualApplyStatusByKey[decisionNextCommand.key] || "not-applicable"
    : "not-applicable";
  const decisionNextCommandOutputArtifactManualApplyStatusLabel = decisionNextCommand.key
    ? decisionCommandOutputArtifactManualApplyStatusLabelByKey[decisionNextCommand.key] || "Review only"
    : "Review only";
  const decisionNextCommandOutputArtifactManualApplyStatusTone = decisionNextCommand.key
    ? decisionCommandOutputArtifactManualApplyStatusToneByKey[decisionNextCommand.key] || "neutral"
    : "neutral";
  const decisionNextCommandOutputArtifactManualApplyBlockedReason = decisionNextCommand.key
    ? decisionCommandOutputArtifactManualApplyBlockedReasonByKey[decisionNextCommand.key] || ""
    : "";
  const decisionNextCommandOutputArtifactManualApplyBlockedReasonCode = decisionNextCommand.key
    ? decisionCommandOutputArtifactManualApplyBlockedReasonCodeByKey[decisionNextCommand.key] || ""
    : "";
  const operatorRunbookStageSelection = failures > 0
    ? {}
    : {
      strategy: "optional-preview-before-required-manual-edit",
      decision: {
        action: "offer-optional-preview",
        stageKey: "previewArtifacts",
        stageKind: "local-output-preview",
        required: false,
        hasCommands: true,
        commandCount: decisionCommands.length,
        commandKeys: ["reviewCheckReport", "proposalPatchPreview"],
        commands: decisionCommands,
        commandByKey: decisionCommandByKey,
        commandStepByKey: decisionCommandStepByKey,
        commandRunPolicyByKey: decisionCommandRunPolicyByKey,
        commandSafetyLevelByKey: decisionCommandSafetyLevelByKey,
        commandArgsByKey: decisionCommandArgsByKey,
        commandStringByKey: decisionCommandStringByKey,
        commandDisplayLabelByKey: decisionCommandDisplayLabelByKey,
        commandDescriptionByKey: decisionCommandDescriptionByKey,
        commandOutputArtifactByKey: decisionCommandOutputArtifactByKey,
        commandOutputArtifactTypeByKey: decisionCommandOutputArtifactTypeByKey,
        commandOutputArtifactActionByKey: decisionCommandOutputArtifactActionByKey,
        commandOutputArtifactMediaTypeByKey: decisionCommandOutputArtifactMediaTypeByKey,
        commandOutputArtifactDispositionByKey: decisionCommandOutputArtifactDispositionByKey,
        commandOutputArtifactManualApplyCandidateByKey: decisionCommandOutputArtifactManualApplyCandidateByKey,
        commandOutputArtifactRequiresManualReviewByKey: decisionCommandOutputArtifactRequiresManualReviewByKey,
        commandOutputArtifactReviewInstructionByKey: decisionCommandOutputArtifactReviewInstructionByKey,
        commandOutputArtifactRequiresCleanWorkspaceBeforeApplyByKey: decisionCommandOutputArtifactRequiresCleanWorkspaceBeforeApplyByKey,
        commandOutputArtifactApplyPreconditionIdsByKey: decisionCommandOutputArtifactApplyPreconditionIdsByKey,
        commandOutputArtifactApplyPreconditionLabelsByKey: decisionCommandOutputArtifactApplyPreconditionLabelsByKey,
        commandOutputArtifactApplyPreconditionsByKey: decisionCommandOutputArtifactApplyPreconditionsByKey,
        commandOutputArtifactApplyPreconditionCountByKey: decisionCommandOutputArtifactApplyPreconditionCountByKey,
        commandOutputArtifactRequiredApplyPreconditionCountByKey: decisionCommandOutputArtifactRequiredApplyPreconditionCountByKey,
        commandOutputArtifactSatisfiedApplyPreconditionCountByKey: decisionCommandOutputArtifactSatisfiedApplyPreconditionCountByKey,
        commandOutputArtifactPendingApplyPreconditionCountByKey: decisionCommandOutputArtifactPendingApplyPreconditionCountByKey,
        commandOutputArtifactRequiredPendingApplyPreconditionCountByKey: decisionCommandOutputArtifactRequiredPendingApplyPreconditionCountByKey,
        commandOutputArtifactManualApplyReadyByKey: decisionCommandOutputArtifactManualApplyReadyByKey,
        commandOutputArtifactManualApplyStatusByKey: decisionCommandOutputArtifactManualApplyStatusByKey,
        commandOutputArtifactManualApplyStatusLabelByKey: decisionCommandOutputArtifactManualApplyStatusLabelByKey,
        commandOutputArtifactManualApplyStatusToneByKey: decisionCommandOutputArtifactManualApplyStatusToneByKey,
        commandOutputArtifactManualApplyBlockedReasonByKey: decisionCommandOutputArtifactManualApplyBlockedReasonByKey,
        commandOutputArtifactManualApplyBlockedReasonCodeByKey: decisionCommandOutputArtifactManualApplyBlockedReasonCodeByKey,
        nextCommandEntry: decisionNextCommand,
        nextCommandKey: decisionNextCommand.key || "",
        nextCommandDisplayLabel: decisionNextCommandDisplayLabel,
        nextCommandDescription: decisionNextCommandDescription,
        nextCommandOutputArtifact: decisionNextCommandOutputArtifact,
        nextCommandOutputArtifactType: decisionNextCommandOutputArtifactType,
        nextCommandOutputArtifactAction: decisionNextCommandOutputArtifactAction,
        nextCommandOutputArtifactMediaType: decisionNextCommandOutputArtifactMediaType,
        nextCommandOutputArtifactDisposition: decisionNextCommandOutputArtifactDisposition,
        nextCommandOutputArtifactManualApplyCandidate: decisionNextCommandOutputArtifactManualApplyCandidate,
        nextCommandOutputArtifactRequiresManualReview: decisionNextCommandOutputArtifactRequiresManualReview,
        nextCommandOutputArtifactReviewInstruction: decisionNextCommandOutputArtifactReviewInstruction,
        nextCommandOutputArtifactRequiresCleanWorkspaceBeforeApply: decisionNextCommandOutputArtifactRequiresCleanWorkspaceBeforeApply,
        nextCommandOutputArtifactApplyPreconditionIds: decisionNextCommandOutputArtifactApplyPreconditionIds,
        nextCommandOutputArtifactApplyPreconditionLabels: decisionNextCommandOutputArtifactApplyPreconditionLabels,
        nextCommandOutputArtifactApplyPreconditions: decisionNextCommandOutputArtifactApplyPreconditions,
        nextCommandOutputArtifactApplyPreconditionCount: decisionNextCommandOutputArtifactApplyPreconditionCount,
        nextCommandOutputArtifactRequiredApplyPreconditionCount: decisionNextCommandOutputArtifactRequiredApplyPreconditionCount,
        nextCommandOutputArtifactSatisfiedApplyPreconditionCount: decisionNextCommandOutputArtifactSatisfiedApplyPreconditionCount,
        nextCommandOutputArtifactPendingApplyPreconditionCount: decisionNextCommandOutputArtifactPendingApplyPreconditionCount,
        nextCommandOutputArtifactRequiredPendingApplyPreconditionCount: decisionNextCommandOutputArtifactRequiredPendingApplyPreconditionCount,
        nextCommandOutputArtifactManualApplyReady: decisionNextCommandOutputArtifactManualApplyReady,
        nextCommandOutputArtifactManualApplyStatus: decisionNextCommandOutputArtifactManualApplyStatus,
        nextCommandOutputArtifactManualApplyStatusLabel: decisionNextCommandOutputArtifactManualApplyStatusLabel,
        nextCommandOutputArtifactManualApplyStatusTone: decisionNextCommandOutputArtifactManualApplyStatusTone,
        nextCommandOutputArtifactManualApplyBlockedReason: decisionNextCommandOutputArtifactManualApplyBlockedReason,
        nextCommandOutputArtifactManualApplyBlockedReasonCode: decisionNextCommandOutputArtifactManualApplyBlockedReasonCode,
        nextCommandStep: decisionNextCommand.step || 0,
        nextCommand: decisionNextCommand.command || "",
        nextCommandArgs: decisionNextCommand.commandArgs || [],
        nextCommandRunPolicy: decisionNextCommand.runPolicy || "",
        nextCommandSafetyLevel: decisionNextCommand.safetyLevel || "",
        nextCommandSafety: decisionNextCommand.safety || {},
        runPolicy: "optional-local-output-preview",
        safety: {
          level: nextStageSummary.writesLocalFiles ? "local-output" : "read-only",
          writesLocalFiles: nextStageSummary.writesLocalFiles,
          writesOutputArtifacts: nextStageSummary.writesOutputArtifacts,
          mutatesLocalState: nextStageSummary.mutatesLocalState,
          mutatesProfile: nextStageSummary.mutatesProfile,
          mutatesReviewFile: nextStageSummary.mutatesReviewFile,
          mutatesSkillFiles: nextStageSummary.mutatesSkillFiles,
          callsExternalAiApis: nextStageSummary.callsExternalAiApis,
          requiresCleanWorkspace: nextStageSummary.requiresCleanWorkspace,
          reason: "The selected decision only writes optional local preview artifacts and does not mutate learning, review, or skill files.",
        },
        nextRequiredStageKey: nextRequiredStage?.key || "",
        nextRequiredCommandStageKey: nextRequiredCommandStage?.key || "",
        requiresOperatorActionBeforeRequiredCommands: true,
        reason: "Offer optional local preview artifacts first; the required path still starts with manual skill edits before read-only command gates.",
      },
      stageOrder: operatorRunbookStageKeys,
      nextStageKey: "previewArtifacts",
      nextStageCommandKeys: ["reviewCheckReport", "proposalPatchPreview"],
      nextStage: nextStageSummary,
      nextRequiredStageKey: nextRequiredStage?.key || "",
      nextRequiredStageCommandKeys: nextRequiredStage?.commandKeys || [],
      nextRequiredStage: nextRequiredStageSummary,
      nextRequiredCommandStageKey: nextRequiredCommandStage?.key || "",
      nextRequiredCommandStageCommandKeys: nextRequiredCommandStage?.commandKeys || [],
      nextRequiredCommandStage: nextRequiredCommandStageSummary,
      reason: "Offer optional local preview artifacts first, then require the manual skill edit before read-only review and strict gates.",
    };
  const operatorRunbook = {
    version: 1,
    executable: failures === 0,
    blocked: failures > 0,
    stageCount: operatorRunbookStages.length,
    requiredStageCount: operatorRunbookStages.filter((stage) => stage.required).length,
    commandStageCount: operatorRunbookStages.filter((stage) => stage.commandKeys.length > 0).length,
    nextStageKey: failures > 0 ? "" : "previewArtifacts",
    nextStageCommandKeys: failures > 0 ? [] : ["reviewCheckReport", "proposalPatchPreview"],
    nextRequiredStageKey: nextRequiredStage?.key || "",
    nextRequiredStageCommandKeys: nextRequiredStage?.commandKeys || [],
    nextRequiredCommandStageKey: nextRequiredCommandStage?.key || "",
    nextRequiredCommandStageCommandKeys: nextRequiredCommandStage?.commandKeys || [],
    stageSelection: operatorRunbookStageSelection,
    stageKeys: operatorRunbookStageKeys,
    stageByKey: operatorRunbookStageByKey,
    stages: operatorRunbookStages,
    reason: failures > 0
      ? "Command contract failures must be fixed before running the operator runbook."
      : "Generate optional local review artifacts, apply accepted skill deltas manually, then run read-only review and strict readiness gates.",
  };
  return {
    version: 1,
    valid: failures === 0,
    status: failures > 0 ? "fail" : "pass",
    commandCount: Object.keys(commandArgs).length,
    requiredKeys,
    missingCommandKeys,
    unexpectedCommandKeys,
    baseCommand: [...APPLY_PLAN_BASE_COMMAND],
    reviewFileRequired: true,
    reviewFile,
    forbiddenFlags: [...APPLY_PLAN_FORBIDDEN_FLAGS],
    checkCount,
    passCount: passes,
    warningCount: warnings,
    failureCount: failures,
    failedCheckIds: failedChecks.map((check) => check.id),
    failedChecks,
    nextCommandKey,
    nextCommand,
    nextCommandArgs,
    nextCommandRunPolicy,
    nextCommandSafety,
    commandSequenceCount: commandSequence.length,
    commandSequence,
    commandSequenceSummary,
    commandSequenceKeys,
    commandSequenceByKey,
    operatorRunbook,
    nextAction: failures > 0
      ? "Fix command contract failures before running follow-up commands."
      : "Run reviewCheckJson after manual skill edits, then use strictGate before marking proposals applied.",
    checks,
    summary: {
      failures,
      warnings,
      passes,
      total: checkCount,
    },
  };
}

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

function listItem(label, value) {
  return `- ${label}: ${value}`;
}

function yesNo(value) {
  return value ? "yes" : "no";
}

function normalizePatchPath(filePath) {
  return String(filePath || "").replace(/\\/g, "/");
}

function readSkillLines(skillPath, sourceRoot) {
  const absolutePath = path.resolve(sourceRoot, skillPath);
  if (!existsSync(absolutePath)) {
    return {
      exists: false,
      absolutePath,
      lines: [],
    };
  }
  const text = readFileSync(absolutePath, "utf8");
  return {
    exists: true,
    absolutePath,
    lines: text.split(/\r?\n/),
  };
}

function patchSectionForProposal(proposal) {
  const routes = Array.isArray(proposal.routeIds) && proposal.routeIds.length > 0
    ? proposal.routeIds.join(", ")
    : "artifact";
  return [
    "",
    `## Local Learning Proposal: ${proposal.id}`,
    "",
    "<!-- Generated by design-ai learn --propose-skills --patch. Review manually before applying. -->",
    "",
    `- Category: ${proposal.category}`,
    `- Routes: ${routes}`,
    `- Risk: ${proposal.riskLevel}`,
    `- Review status: ${proposal.reviewStatus || "pending"}`,
    `- Evidence count: ${proposal.sourceIssueCount}`,
    `- Proposed instruction: ${proposal.proposedInstructionDelta}`,
    `- Verification: \`${proposal.verificationCommand}\``,
  ];
}

function patchForSkillFile(skillPath, proposals, { sourceRoot }) {
  const normalizedSkillPath = normalizePatchPath(skillPath);
  const file = readSkillLines(normalizedSkillPath, sourceRoot);
  const currentLines = file.lines.slice();
  if (currentLines.length > 0 && currentLines[currentLines.length - 1] === "") {
    currentLines.pop();
  }
  const addedLines = proposals.flatMap(patchSectionForProposal);
  const fromPath = `a/${normalizedSkillPath}`;
  const toPath = `b/${normalizedSkillPath}`;
  const lines = [
    `diff --git ${fromPath} ${toPath}`,
    `--- ${file.exists ? fromPath : "/dev/null"}`,
    `+++ ${toPath}`,
  ];

  if (currentLines.length === 0) {
    lines.push(`@@ -0,0 +1,${addedLines.length} @@`);
    for (const addedLine of addedLines) {
      lines.push(`+${addedLine}`);
    }
    return lines;
  }

  const contextLine = currentLines[currentLines.length - 1];
  lines.push(`@@ -${currentLines.length},1 +${currentLines.length},${addedLines.length + 1} @@`);
  lines.push(` ${contextLine}`);
  for (const addedLine of addedLines) {
    lines.push(`+${addedLine}`);
  }
  return lines;
}

export function renderSkillEvolutionProposalPatch(payload, {
  sourceRoot = PACKAGE_ROOT,
} = {}) {
  const proposals = Array.isArray(payload.proposals)
    ? payload.proposals.filter((proposal) => !proposal.reviewClearsStrict)
    : [];
  const lines = [
    "# design-ai skill proposal patch preview",
    "# Preview-only output from `design-ai learn --propose-skills --patch`.",
    "# Review manually before applying. This command does not edit skill files.",
  ];

  if (proposals.length === 0) {
    lines.push((payload.proposalCount || 0) > 0
      ? "# No pending skill proposal deltas remain after review-file decisions."
      : "# No repeated check-capture groups crossed the proposal threshold.");
    return `${lines.join("\n")}\n`;
  }

  const proposalsBySkill = new Map();
  for (const proposal of proposals) {
    const skillPath = proposal.candidateSkillPath || "skills/unknown/SKILL.md";
    if (!proposalsBySkill.has(skillPath)) proposalsBySkill.set(skillPath, []);
    proposalsBySkill.get(skillPath).push(proposal);
  }

  for (const [skillPath, skillProposals] of [...proposalsBySkill.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    lines.push("");
    lines.push(...patchForSkillFile(skillPath, skillProposals, { sourceRoot }));
  }

  return `${lines.join("\n")}\n`;
}

export function renderSkillProposalReviewTemplate(payload, {
  generatedAt = new Date(),
} = {}) {
  const generatedAtText = generatedAt instanceof Date ? generatedAt.toISOString() : String(generatedAt || "");
  const proposals = Array.isArray(payload.proposals)
    ? payload.proposals.filter((proposal) => !proposal.reviewClearsStrict)
    : [];
  const decisions = proposals.map((proposal) => ({
    proposalId: proposal.id,
    status: proposal.reviewStatus && proposal.reviewStatus !== "pending" ? proposal.reviewStatus : "deferred",
    reviewedAt: "",
    reviewer: "",
    note: `Review ${proposal.candidateSkillPath}: ${proposal.title}`,
  }));

  return `${JSON.stringify({
    version: 1,
    generatedAt: generatedAtText,
    source: "design-ai learn --propose-skills --review-template",
    proposalFile: payload.file || "",
    usageFile: payload.usageFile || "",
    signalSource: payload.signalSource || "",
    reviewFile: payload.reviewFile || "",
    reviewPolicy: {
      clearsStrict: ["applied", "rejected"],
      remainsPending: ["accepted", "deferred"],
    },
    summary: {
      proposalCount: payload.proposalCount || 0,
      pendingReviewCount: payload.pendingReviewCount ?? proposals.length,
      reviewedCount: payload.reviewedCount || 0,
      templateDecisionCount: decisions.length,
    },
    decisions,
  }, null, 2)}\n`;
}

export function renderSkillEvolutionProposalReport(payload, {
  generatedAt = new Date(),
} = {}) {
  const generatedAtText = generatedAt instanceof Date ? generatedAt.toISOString() : String(generatedAt || "");
  const lines = [
    "# Skill Evolution Proposal Report",
    "",
    listItem("Generated", generatedAtText),
    listItem("File", payload.file),
    listItem("Usage sidecar", payload.usageFile),
    listItem("Signal source", payload.signalSource),
    listItem("Status", payload.status),
    listItem("Signal status", payload.signalStatus),
    listItem("Minimum evidence", payload.minEvidenceCount),
    listItem("Check capture entries", payload.checkCaptureCount),
    listItem("Candidate groups", payload.candidateCount),
    listItem("Proposal count", payload.proposalCount),
    listItem("Skipped groups", payload.skippedCount),
    listItem("Pending review", payload.pendingReviewCount ?? payload.proposalCount ?? 0),
    listItem("Reviewed", payload.reviewedCount ?? 0),
    listItem("Dry run", yesNo(Boolean(payload.dryRun))),
    listItem("Applied", yesNo(Boolean(payload.applied))),
    "",
    "## Proposed Skill Deltas",
    "",
  ];

  if (!Array.isArray(payload.proposals) || payload.proposals.length === 0) {
    lines.push("No repeated check-capture groups crossed the proposal threshold.");
  } else {
    for (const proposal of payload.proposals) {
      const routes = Array.isArray(proposal.routeIds) && proposal.routeIds.length > 0
        ? proposal.routeIds.join(", ")
        : "artifact";
      lines.push(`### ${proposal.title}`);
      lines.push("");
      lines.push(listItem("Proposal id", proposal.id));
      lines.push(listItem("Candidate skill", proposal.candidateSkillPath));
      lines.push(listItem("Category", proposal.category));
      lines.push(listItem("Routes", routes));
      lines.push(listItem("Risk", proposal.riskLevel));
      lines.push(listItem("Review status", proposal.reviewStatus || "pending"));
      if (proposal.reviewDecision?.reviewedAt) lines.push(listItem("Reviewed at", proposal.reviewDecision.reviewedAt));
      if (proposal.reviewDecision?.reviewer) lines.push(listItem("Reviewer", proposal.reviewDecision.reviewer));
      if (proposal.reviewDecision?.note) lines.push(listItem("Review note", proposal.reviewDecision.note));
      lines.push(listItem("Source issues", proposal.sourceIssueCount));
      lines.push(listItem("Rationale", proposal.rationale));
      lines.push("");
      lines.push("Proposed instruction delta:");
      lines.push("");
      lines.push(`> ${proposal.proposedInstructionDelta}`);
      lines.push("");
      lines.push("Verification:");
      lines.push("");
      lines.push(`\`\`\`bash`);
      lines.push(proposal.verificationCommand);
      lines.push(`\`\`\``);
      lines.push("");
      lines.push("Evidence:");
      const evidenceSources = Array.isArray(proposal.evidenceSources) ? proposal.evidenceSources : [];
      for (const evidence of evidenceSources) {
        const title = evidence.title ? ` / ${evidence.title}` : "";
        lines.push(`- \`${evidence.entryId}\` [${evidence.category}] ${evidence.source}${title}`);
        if (evidence.createdAt) lines.push(`  - Captured: ${evidence.createdAt}`);
        if (evidence.textPreview) lines.push(`  - Preview: ${evidence.textPreview}`);
      }
      lines.push("");
    }
  }

  const review = payload.review || {};
  lines.push("## Review File", "");
  if (review.file) {
    lines.push(listItem("File", review.file));
    lines.push(listItem("Exists", yesNo(Boolean(review.exists))));
    lines.push(listItem("Status", review.status || "unknown"));
    lines.push(listItem("Decisions", review.decisionCount || 0));
    lines.push(listItem("Matched", review.matchedCount || 0));
    lines.push(listItem("Stale", review.staleCount || 0));
    lines.push(listItem("Pending", review.pendingCount ?? 0));
    lines.push(listItem("Applied", review.appliedCount || 0));
    lines.push(listItem("Rejected", review.rejectedCount || 0));
    lines.push(listItem("Accepted", review.acceptedCount || 0));
    lines.push(listItem("Deferred", review.deferredCount || 0));
    if (Array.isArray(review.warnings) && review.warnings.length > 0) {
      lines.push("");
      lines.push("Warnings:");
      for (const warning of review.warnings) lines.push(`- ${warning}`);
    }
  } else {
    lines.push("No review file was provided.");
  }
  lines.push("");

  lines.push("## Skipped Groups", "");
  if (!Array.isArray(payload.skipped) || payload.skipped.length === 0) {
    lines.push("No candidate groups were skipped.");
  } else {
    for (const item of payload.skipped) {
      lines.push(`- \`${item.candidateSkillPath}\` [${item.category}]: ${item.reason}`);
      const evidenceSources = Array.isArray(item.evidenceSources) ? item.evidenceSources : [];
      for (const evidence of evidenceSources) {
        lines.push(`  - Evidence: \`${evidence.entryId}\` ${evidence.source}`);
      }
    }
  }

  lines.push("", "## Recommendations", "");
  if (!Array.isArray(payload.recommendations) || payload.recommendations.length === 0) {
    lines.push("No recommendations emitted.");
  } else {
    for (const recommendation of payload.recommendations) {
      lines.push(`- ${recommendation.level}: ${recommendation.text}`);
    }
  }

  const privacy = payload.privacy || {};
  lines.push("", "## Privacy And Boundaries", "");
  lines.push(listItem("Mutates learning profile", yesNo(Boolean(privacy.mutatesProfile))));
  lines.push(listItem("Mutates skill files", yesNo(Boolean(privacy.mutatesSkillFiles))));
  lines.push(listItem("Calls external AI APIs", yesNo(Boolean(privacy.callsExternalAiApis))));
  lines.push(listItem("Stores raw brief text", yesNo(Boolean(privacy.storesRawBriefText))));
  lines.push(listItem("Includes entry text preview", yesNo(Boolean(privacy.exposesEntryTextPreview))));

  lines.push("", "## Next Steps", "");
  if ((payload.proposalCount || 0) > 0) {
    lines.push("- Review each proposed instruction delta manually before editing any skill file.");
    lines.push("- Mark resolved proposals as `applied` or `rejected` in the review file to clear the strict proposal gate.");
    lines.push("- Run the proposal verification command after applying an accepted skill edit.");
    lines.push("- Re-run `design-ai learn --propose-skills --strict --json` to confirm no pending proposal gate remains.");
  } else {
    lines.push("- Keep capturing explicit `design-ai check --learn --yes` warning/failure results until repeated evidence exists.");
    lines.push("- Re-run this report after new check-capture entries are added.");
  }
  lines.push("- This report is preview-only evidence; it does not apply changes.");

  return `${lines.join("\n")}\n`;
}

export function renderSkillProposalApplyPlanReport(payload, {
  generatedAt = new Date(),
} = {}) {
  const generatedAtText = generatedAt instanceof Date ? generatedAt.toISOString() : String(generatedAt || "");
  const lines = [
    "# Skill Proposal Apply Plan",
    "",
    listItem("Generated", generatedAtText),
    listItem("Status", payload.status),
    listItem("Proposal status", payload.proposalStatus),
    listItem("Signal status", payload.signalStatus),
    listItem("File", payload.file),
    listItem("Usage sidecar", payload.usageFile),
    listItem("Signal source", payload.signalSource),
    listItem("Review file", payload.reviewFile || "not configured"),
    listItem("Accepted proposals", payload.acceptedCount || 0),
    listItem("Pending review", payload.pendingReviewCount || 0),
    listItem("Reviewed", payload.reviewedCount || 0),
    "",
    "## Manual Apply Tasks",
    "",
  ];

  if (!Array.isArray(payload.tasks) || payload.tasks.length === 0) {
    lines.push("No accepted skill proposals are ready for manual apply.");
  } else {
    for (const task of payload.tasks) {
      lines.push(`### ${task.title}`);
      lines.push("");
      lines.push(listItem("Proposal id", task.proposalId));
      lines.push(listItem("Candidate skill", task.candidateSkillPath));
      lines.push(listItem("Category", task.category));
      lines.push(listItem("Routes", (task.routeIds || []).join(", ") || "artifact"));
      lines.push(listItem("Risk", task.riskLevel));
      lines.push(listItem("Source issues", task.sourceIssueCount));
      if (task.reviewDecision?.reviewer) lines.push(listItem("Reviewer", task.reviewDecision.reviewer));
      if (task.reviewDecision?.reviewedAt) lines.push(listItem("Reviewed at", task.reviewDecision.reviewedAt));
      if (task.reviewDecision?.note) lines.push(listItem("Review note", task.reviewDecision.note));
      if (task.rationale) lines.push(listItem("Rationale", task.rationale));
      lines.push("");
      lines.push("Proposed instruction delta:");
      lines.push("");
      lines.push(`> ${task.proposedInstructionDelta}`);
      lines.push("");
      lines.push("Manual steps:");
      for (const step of task.manualSteps || []) lines.push(`- ${step}`);
      lines.push("");
      lines.push("Verification:");
      lines.push("");
      lines.push("```bash");
      lines.push(task.verificationCommand);
      lines.push("```");
      lines.push("");
      lines.push("Safety checklist:");
      for (const item of task.safetyChecklist || []) lines.push(`- ${item}`);
      lines.push("");
      lines.push("Evidence:");
      for (const evidence of task.evidenceSources || []) {
        const title = evidence.title ? ` / ${evidence.title}` : "";
        lines.push(`- \`${evidence.entryId}\` [${evidence.category}] ${evidence.source}${title}`);
        if (evidence.textPreview) lines.push(`  - Preview: ${evidence.textPreview}`);
      }
      lines.push("");
    }
  }

  lines.push("## Follow-up Commands", "");
  const commands = payload.commands || {};
  for (const [label, command] of Object.entries(commands)) {
    lines.push(listItem(label, `\`${command}\``));
  }

  const commandContract = payload.commandContract || {};
  lines.push("", "## Command Contract", "");
  lines.push(listItem("Valid", yesNo(Boolean(commandContract.valid))));
  lines.push(listItem("Status", commandContract.status || "unknown"));
  lines.push(listItem("Command count", commandContract.commandCount || 0));
  lines.push(listItem("Check count", commandContract.checkCount || 0));
  lines.push(listItem("Pass count", commandContract.passCount || 0));
  lines.push(listItem("Warning count", commandContract.warningCount || 0));
  lines.push(listItem("Required keys", (commandContract.requiredKeys || []).join(", ") || "none"));
  lines.push(listItem("Review file required", yesNo(Boolean(commandContract.reviewFileRequired))));
  lines.push(listItem("Forbidden flags", (commandContract.forbiddenFlags || []).join(", ") || "none"));
  lines.push(listItem("Failure count", commandContract.failureCount || 0));
  lines.push(listItem("Failed checks", (commandContract.failedCheckIds || []).join(", ") || "none"));
  lines.push(listItem("Next command key", commandContract.nextCommandKey || "none"));
  lines.push(listItem("Next command policy", commandContract.nextCommandRunPolicy || "none"));
  if (commandContract.nextCommandSafety?.level) lines.push(listItem("Next command safety", commandContract.nextCommandSafety.level));
  if (commandContract.nextCommand) lines.push(listItem("Next command", `\`${commandContract.nextCommand}\``));
  lines.push(listItem("Command sequence count", commandContract.commandSequenceCount || 0));
  lines.push(listItem("Command sequence keys", (commandContract.commandSequenceKeys || []).join(", ") || "none"));
  const sequenceSummary = commandContract.commandSequenceSummary || {};
  lines.push(listItem("Command sequence policy", sequenceSummary.runPolicy || "none"));
  lines.push(listItem("Command sequence executable", yesNo(Boolean(sequenceSummary.executable))));
  lines.push(listItem("Command sequence local outputs", sequenceSummary.localOutputStepCount || 0));
  lines.push(listItem("Command sequence mutates profile", yesNo(Boolean(sequenceSummary.mutatesProfile))));
  lines.push(listItem("Command sequence mutates review file", yesNo(Boolean(sequenceSummary.mutatesReviewFile))));
  lines.push(listItem("Command sequence mutates skill files", yesNo(Boolean(sequenceSummary.mutatesSkillFiles))));
  lines.push(listItem("Command sequence calls external AI APIs", yesNo(Boolean(sequenceSummary.callsExternalAiApis))));
  const operatorRunbook = commandContract.operatorRunbook || {};
  lines.push(listItem("Operator runbook stages", operatorRunbook.stageCount || 0));
  lines.push(listItem("Operator runbook keys", (operatorRunbook.stageKeys || []).join(", ") || "none"));
  lines.push(listItem("Operator runbook required stages", operatorRunbook.requiredStageCount || 0));
  lines.push(listItem("Operator runbook next stage", operatorRunbook.nextStageKey || "none"));
  lines.push(listItem("Operator runbook next required stage", operatorRunbook.nextRequiredStageKey || "none"));
  lines.push(listItem("Operator runbook next required command stage", operatorRunbook.nextRequiredCommandStageKey || "none"));
  if (operatorRunbook.stageSelection?.strategy) {
    lines.push(listItem("Operator runbook stage selection", operatorRunbook.stageSelection.strategy));
    if (operatorRunbook.stageSelection.decision?.action) {
      lines.push(listItem("Operator runbook decision", operatorRunbook.stageSelection.decision.action));
      if (operatorRunbook.stageSelection.decision.safety?.level) {
        lines.push(listItem("Operator runbook decision safety", operatorRunbook.stageSelection.decision.safety.level));
      }
      if (Array.isArray(operatorRunbook.stageSelection.decision.commands)) {
        lines.push(listItem("Operator runbook decision commands", operatorRunbook.stageSelection.decision.commands.map((command) => command.key).join(", ") || "none"));
      }
      if (operatorRunbook.stageSelection.decision.nextCommandKey) {
        lines.push(listItem("Operator runbook decision next command", operatorRunbook.stageSelection.decision.nextCommandKey));
      }
    }
    if (operatorRunbook.stageSelection.nextStage?.key) {
      const nextStageLabel = operatorRunbook.stageSelection.nextStage.required ? "required" : "optional";
      lines.push(listItem("Operator runbook selected stage", `${operatorRunbook.stageSelection.nextStage.key} (${nextStageLabel}, ${operatorRunbook.stageSelection.nextStage.kind})`));
    }
  }
  const commandSequence = Array.isArray(commandContract.commandSequence) ? commandContract.commandSequence : [];
  if (commandSequence.length > 0) {
    lines.push("");
    lines.push("Command sequence:");
    for (const item of commandSequence) {
      const safetyLevel = item.safety?.level || "unknown";
      lines.push(`- ${item.step}. ${item.key} (${item.runPolicy || "unknown"} / ${safetyLevel}): \`${item.command}\``);
    }
  }
  const runbookStages = Array.isArray(operatorRunbook.stages) ? operatorRunbook.stages : [];
  if (runbookStages.length > 0) {
    lines.push("");
    lines.push("Operator runbook:");
    for (const stage of runbookStages) {
      const required = stage.required ? "required" : "optional";
      const commandKeys = Array.isArray(stage.commandKeys) && stage.commandKeys.length > 0
        ? stage.commandKeys.join(", ")
        : "manual";
      lines.push(`- ${stage.step}. ${stage.key} (${required} / ${stage.kind || "unknown"}): ${commandKeys}`);
    }
  }
  if (commandContract.nextAction) lines.push(listItem("Next action", commandContract.nextAction));
  const missingCommandKeys = Array.isArray(commandContract.missingCommandKeys) ? commandContract.missingCommandKeys : [];
  const unexpectedCommandKeys = Array.isArray(commandContract.unexpectedCommandKeys) ? commandContract.unexpectedCommandKeys : [];
  if (missingCommandKeys.length > 0) lines.push(listItem("Missing command keys", missingCommandKeys.join(", ")));
  if (unexpectedCommandKeys.length > 0) lines.push(listItem("Unexpected command keys", unexpectedCommandKeys.join(", ")));
  const failedChecks = Array.isArray(commandContract.failedChecks) ? commandContract.failedChecks : [];
  if (failedChecks.length > 0) {
    lines.push("");
    lines.push("Failed command checks:");
    for (const check of failedChecks) {
      lines.push(`- ${check.id}: ${check.message}`);
    }
  }

  lines.push("", "## Recommendations", "");
  for (const recommendation of payload.recommendations || []) {
    lines.push(`- ${recommendation.level}: ${recommendation.text}`);
  }

  const privacy = payload.privacy || {};
  lines.push("", "## Privacy And Boundaries", "");
  lines.push(listItem("Mutates learning profile", yesNo(Boolean(privacy.mutatesProfile))));
  lines.push(listItem("Mutates review file", yesNo(Boolean(privacy.mutatesReviewFile))));
  lines.push(listItem("Mutates skill files", yesNo(Boolean(privacy.mutatesSkillFiles))));
  lines.push(listItem("Calls external AI APIs", yesNo(Boolean(privacy.callsExternalAiApis))));
  lines.push(listItem("Stores raw brief text", yesNo(Boolean(privacy.storesRawBriefText))));
  lines.push(listItem("Includes entry text preview", yesNo(Boolean(privacy.exposesEntryTextPreview))));

  return `${lines.join("\n")}\n`;
}

export function renderSkillProposalReviewCheckReport(payload, {
  generatedAt = new Date(),
} = {}) {
  const generatedAtText = generatedAt instanceof Date ? generatedAt.toISOString() : String(generatedAt || "");
  const lines = [
    "# Skill Proposal Review Check",
    "",
    listItem("Generated", generatedAtText),
    listItem("Status", payload.status),
    listItem("Proposal status", payload.proposalStatus),
    listItem("Signal status", payload.signalStatus),
    listItem("File", payload.file),
    listItem("Usage sidecar", payload.usageFile),
    listItem("Signal source", payload.signalSource),
    listItem("Review file", payload.reviewFile || "not configured"),
    listItem("Proposals", payload.proposalCount),
    listItem("Pending review", payload.pendingReviewCount),
    listItem("Reviewed", payload.reviewedCount),
    "",
    "## Checks",
    "",
  ];

  for (const check of payload.checks || []) {
    lines.push(`- ${check.level}: ${check.id} - ${check.message}`);
  }

  const review = payload.review || {};
  lines.push("", "## Review Summary", "");
  lines.push(listItem("Exists", yesNo(Boolean(review.exists))));
  lines.push(listItem("Status", review.status || "unknown"));
  lines.push(listItem("Decisions", review.decisionCount || 0));
  lines.push(listItem("Matched", review.matchedCount || 0));
  lines.push(listItem("Stale", review.staleCount || 0));
  lines.push(listItem("Applied", review.appliedCount || 0));
  lines.push(listItem("Rejected", review.rejectedCount || 0));
  lines.push(listItem("Accepted", review.acceptedCount || 0));
  lines.push(listItem("Deferred", review.deferredCount || 0));
  if (Array.isArray(review.warnings) && review.warnings.length > 0) {
    lines.push("", "Warnings:");
    for (const warning of review.warnings) lines.push(`- ${warning}`);
  }

  lines.push("", "## Recommendations", "");
  for (const recommendation of payload.recommendations || []) {
    lines.push(`- ${recommendation.level}: ${recommendation.text}`);
  }

  lines.push("", "## Privacy And Boundaries", "");
  lines.push(listItem("Mutates learning profile", yesNo(Boolean(payload.privacy?.mutatesProfile))));
  lines.push(listItem("Mutates skill files", yesNo(Boolean(payload.privacy?.mutatesSkillFiles))));
  lines.push(listItem("Calls external AI APIs", yesNo(Boolean(payload.privacy?.callsExternalAiApis))));
  lines.push(listItem("Stores raw brief text", yesNo(Boolean(payload.privacy?.storesRawBriefText))));

  return `${lines.join("\n")}\n`;
}
