// Action metadata helpers for Website Improvement bundle handoff runbooks.

export function getStageActionType(stage) {
  if (stage.commandCount > 0 && stage.writesLocalFile) return "write-local-output";
  if (stage.commandCount > 0 && stage.required) return "run-local-gate";
  if (stage.commandCount > 0) return "refresh-local-preview";
  if (stage.kind === "manual-target-repo") return "manual-target-repo";
  if (stage.kind === "manual-reporting") return "manual-evidence";
  return "review-stage";
}

export function getStageActionLabel(stage) {
  return {
    verifySourceBundle: "Run strict bundle check",
    refreshHandoffSnapshot: "Refresh strict handoff JSON",
    writeEffectiveTaskPrompt: "Write selected task prompt",
    executeInTargetRepo: "Implement in target repo",
    recordEvidence: "Record verification evidence",
  }[stage.key] || stage.label;
}

export function getStageActionInstruction(stage) {
  return {
    verifySourceBundle: "Run the strict local bundle check and resolve any checksum or generated-file drift before handoff.",
    refreshHandoffSnapshot: "Optional: regenerate the strict handoff JSON snapshot when a wrapper or GUI needs the latest contract.",
    writeEffectiveTaskPrompt: "Write the selected task prompt to a local Markdown file before switching into the target website repo.",
    executeInTargetRepo: "Manual: open the generated prompt in the target website repo, inspect architecture, implement the scoped task, and run target-repo verification.",
    recordEvidence: "Manual: record changed files, verification commands, viewport checks, accessibility checks, remaining risks, and the bundle digest.",
  }[stage.key] || stage.reason;
}

export function getStageActionButtonLabel(stage) {
  return {
    verifySourceBundle: "Run Check",
    refreshHandoffSnapshot: "Refresh JSON",
    writeEffectiveTaskPrompt: "Write Prompt",
    executeInTargetRepo: "Open Target Repo",
    recordEvidence: "Record Evidence",
  }[stage.key] || getStageActionLabel(stage);
}

export function getStageActionAffordance(stage) {
  if (stage.commandCount > 0 && stage.writesLocalFile) return "local-output-button";
  if (stage.commandCount > 0 && stage.required) return "primary-command-button";
  if (stage.commandCount > 0) return "secondary-command-button";
  if (stage.kind === "manual-target-repo") return "manual-target-repo-step";
  if (stage.kind === "manual-reporting") return "manual-evidence-step";
  return "review-step";
}

export function getStageActionEnabled(stage) {
  return stage.commandCount > 0;
}

export function getStageActionStatus(stage) {
  if (stage.commandCount > 0 && stage.required) return "ready";
  if (stage.commandCount > 0) return "optional";
  if (stage.kind === "manual-target-repo" || stage.kind === "manual-reporting") return "manual";
  return "blocked";
}

export function getStageActionStatusLabel(stage) {
  return {
    ready: "Ready",
    optional: "Optional",
    manual: "Manual",
    blocked: "Blocked",
  }[getStageActionStatus(stage)];
}

export function getStageActionStatusTone(stage) {
  return {
    ready: "success",
    optional: "neutral",
    manual: "info",
    blocked: "danger",
  }[getStageActionStatus(stage)];
}

export function getStageActionDisabledReasonCode(stage) {
  if (getStageActionEnabled(stage)) return "";
  if (stage.kind === "manual-target-repo") return "manual-target-repo-step";
  if (stage.kind === "manual-reporting") return "manual-evidence-step";
  return "missing-local-command";
}

export function getStageActionDisabledReason(stage) {
  return {
    "manual-target-repo-step": "No local design-ai command is available for this stage; execute the generated prompt inside the target website repo.",
    "manual-evidence-step": "No local design-ai command is available for this stage; record evidence after target-repo implementation and verification.",
    "missing-local-command": "No local command is available for this stage.",
  }[getStageActionDisabledReasonCode(stage)] || "";
}

export function getStageActionEvidenceTarget(stage) {
  return {
    verifySourceBundle: "local-command-output",
    refreshHandoffSnapshot: "local-command-output",
    writeEffectiveTaskPrompt: "local-output-file",
    executeInTargetRepo: "target-repo-working-tree",
    recordEvidence: "handoff-evidence-record",
  }[stage.key] || "not-applicable";
}

export function getStageActionEvidenceTargetLabel(stage) {
  return {
    "local-command-output": "Local command output",
    "local-output-file": "Local output file",
    "target-repo-working-tree": "Target repo working tree",
    "handoff-evidence-record": "Handoff evidence record",
    "not-applicable": "Not applicable",
  }[getStageActionEvidenceTarget(stage)];
}
