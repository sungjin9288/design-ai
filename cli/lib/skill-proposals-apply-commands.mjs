// Apply-plan follow-up command specs and argument helpers for skill proposals.

export const APPLY_PLAN_FOLLOW_UP_COMMAND_SPECS = Object.freeze({
  reviewCheckJson: ["--review-check", "--json"],
  reviewCheckReport: ["--review-check", "--report", "--out", "skill-proposal-review-check.md"],
  proposalPatchPreview: ["--patch", "--out", "skill-proposals.patch"],
  strictGate: ["--strict", "--json"],
});
export const APPLY_PLAN_FOLLOW_UP_COMMAND_POLICIES = Object.freeze({
  reviewCheckJson: "preview-only",
  reviewCheckReport: "output-artifact",
  proposalPatchPreview: "output-artifact",
  strictGate: "strict-readiness-gate",
});
export const APPLY_PLAN_FOLLOW_UP_COMMAND_DISPLAY_LABELS = Object.freeze({
  reviewCheckJson: "Review check JSON",
  reviewCheckReport: "Review check Markdown report",
  proposalPatchPreview: "Skill proposal patch preview",
  strictGate: "Strict proposal readiness gate",
});
export const APPLY_PLAN_FOLLOW_UP_COMMAND_DESCRIPTIONS = Object.freeze({
  reviewCheckJson: "Check proposal review readiness as machine-readable JSON without writing local files.",
  reviewCheckReport: "Generate a Markdown review-check artifact for accepted proposal readiness.",
  proposalPatchPreview: "Generate a unified diff preview for accepted skill proposal edits.",
  strictGate: "Run the strict proposal readiness gate before marking accepted proposals applied.",
});
export const APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACTS = Object.freeze({
  reviewCheckReport: "skill-proposal-review-check.md",
  proposalPatchPreview: "skill-proposals.patch",
});
export const APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_TYPES = Object.freeze({
  reviewCheckReport: "markdown-report",
  proposalPatchPreview: "unified-diff",
});
export const APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_ACTIONS = Object.freeze({
  reviewCheckReport: "render-markdown-report",
  proposalPatchPreview: "render-unified-diff-preview",
});
export const APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_MEDIA_TYPES = Object.freeze({
  reviewCheckReport: "text/markdown",
  proposalPatchPreview: "text/x-diff",
});
export const APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_DISPOSITIONS = Object.freeze({
  reviewCheckReport: "review-only",
  proposalPatchPreview: "manual-apply-preview",
});
export const APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_MANUAL_APPLY_CANDIDATES = Object.freeze({
  reviewCheckReport: false,
  proposalPatchPreview: true,
});
export const APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_REQUIRES_MANUAL_REVIEW = Object.freeze({
  reviewCheckReport: false,
  proposalPatchPreview: true,
});
export const APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_REVIEW_INSTRUCTIONS = Object.freeze({
  reviewCheckReport: "Review the Markdown readiness report before changing proposal review status.",
  proposalPatchPreview: "Review the unified diff manually before applying any skill-file edits.",
});
export const APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_REQUIRES_CLEAN_WORKSPACE_BEFORE_APPLY = Object.freeze({
  reviewCheckReport: false,
  proposalPatchPreview: true,
});
export const APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_APPLY_PRECONDITION_IDS = Object.freeze({
  reviewCheckReport: Object.freeze([]),
  proposalPatchPreview: Object.freeze(["manual-review", "clean-workspace"]),
});
export const APPLY_PLAN_FOLLOW_UP_COMMAND_OUTPUT_ARTIFACT_APPLY_PRECONDITION_LABELS = Object.freeze({
  reviewCheckReport: Object.freeze([]),
  proposalPatchPreview: Object.freeze(["Manual review completed", "Clean workspace confirmed"]),
});
export const APPLY_PLAN_BASE_COMMAND = Object.freeze(["design-ai", "learn", "--propose-skills"]);
export const APPLY_PLAN_FORBIDDEN_FLAGS = Object.freeze(["--yes"]);

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

export function applyPlanFollowUpCommands(payload, reviewFile) {
  const context = { ...payload, reviewFile };
  return Object.fromEntries(Object.entries(APPLY_PLAN_FOLLOW_UP_COMMAND_SPECS).map(([key, extraArgs]) => [
    key,
    commandForReviewFile(context, extraArgs),
  ]));
}

export function argsEndWith(args, suffix) {
  if (!Array.isArray(args) || args.length < suffix.length) return false;
  return suffix.every((item, index) => args[args.length - suffix.length + index] === item);
}

export function argsStartWith(args, prefix) {
  if (!Array.isArray(args) || args.length < prefix.length) return false;
  return prefix.every((item, index) => args[index] === item);
}

export function commandArgCheck({ id, passed, message, evidence = {} }) {
  return {
    id,
    level: passed ? "pass" : "fail",
    passed,
    message,
    evidence,
  };
}
