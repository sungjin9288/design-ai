// Stage dependency and requirement metadata for Website Improvement bundle handoff runbooks.

export function getStageLabel(stages, stageKey) {
  return stages.find((stage) => stage.key === stageKey)?.label || stageKey;
}

export function getStageActionPrerequisiteKeys(stage) {
  return ({
    verifySourceBundle: [],
    refreshHandoffSnapshot: [],
    writeEffectiveTaskPrompt: ["verifySourceBundle"],
    executeInTargetRepo: ["verifySourceBundle", "writeEffectiveTaskPrompt"],
    recordEvidence: ["executeInTargetRepo"],
  }[stage.key] || []);
}

export function getStageActionPrerequisiteLabels(stage, stages) {
  return getStageActionPrerequisiteKeys(stage).map((stageKey) => getStageLabel(stages, stageKey));
}

export function getStageActionBlockedStageKeys(stage, stages) {
  return stages
    .filter((candidate) => getStageActionPrerequisiteKeys(candidate).includes(stage.key))
    .map((candidate) => candidate.key);
}

export function getStageActionDependencyReasonCode(stage) {
  return getStageActionPrerequisiteKeys(stage).length > 0 ? "requires-prerequisite-actions" : "";
}

export function getStageActionDependencyReason(stage) {
  return ({
    writeEffectiveTaskPrompt: "Complete Verify source bundle integrity before writing the selected task prompt.",
    executeInTargetRepo: "Complete Verify source bundle integrity and Write effective task handoff prompt before implementing in the target website repo.",
    recordEvidence: "Complete Execute the task in the target website repo before recording implementation evidence.",
  }[stage.key] || "");
}

export function getStageActionCompletionCriteria(stage) {
  return ({
    verifySourceBundle: [
      "Strict bundle check status is pass.",
      "Checksum and generated-file drift counts are zero.",
    ],
    refreshHandoffSnapshot: [
      "Strict handoff JSON can be regenerated without target-repo mutation.",
    ],
    writeEffectiveTaskPrompt: [
      "Selected task handoff prompt is written to the expected local Markdown output file.",
      "Output command remains local-output-file only.",
    ],
    executeInTargetRepo: [
      "Target website repo has scoped implementation changes for the selected task.",
      "Target repo lint/typecheck/build or equivalent verification has been run.",
    ],
    recordEvidence: [
      "Changed files, verification commands, viewport checks, accessibility checks, remaining risks, and bundle digest are recorded.",
    ],
  }[stage.key] || []);
}

export function getStageActionEvidenceRequirements(stage) {
  return ({
    verifySourceBundle: [
      "Strict bundle-check command output or JSON status.",
      "Bundle digest and zero drift counts.",
    ],
    refreshHandoffSnapshot: [
      "Refreshed strict handoff JSON snapshot when a wrapper consumes the latest contract.",
    ],
    writeEffectiveTaskPrompt: [
      "Generated prompt output file path.",
      "Selected task id and output filename.",
    ],
    executeInTargetRepo: [
      "Target repo changed file list.",
      "Target repo verification command results.",
      "Viewport and accessibility check notes for affected pages.",
    ],
    recordEvidence: [
      "Final evidence record includes changed files, verification, viewport/accessibility checks, risks, and bundle digest.",
    ],
  }[stage.key] || []);
}
