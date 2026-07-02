import {
  getStageActionAffordance,
  getStageActionButtonLabel,
  getStageActionDisabledReason,
  getStageActionDisabledReasonCode,
  getStageActionEnabled,
  getStageActionEvidenceTarget,
  getStageActionEvidenceTargetLabel,
  getStageActionInstruction,
  getStageActionLabel,
  getStageActionStatus,
  getStageActionStatusLabel,
  getStageActionStatusTone,
  getStageActionType,
} from "./site-bundle-handoff-runbook-actions.mjs";
import {
  buildEvidenceCaptureInitialValidationChecklist,
  buildEvidenceCaptureInitialValidationChecklistSummary,
  buildEvidenceCaptureInitialValidationDisplayMetadata,
  buildEvidenceCaptureInitialValidationStates,
  buildEvidenceCaptureInitialValidationSummary,
  buildEvidenceCapturePayloadBindings,
  buildEvidenceCapturePayloadFlatTemplate,
  buildEvidenceCapturePayloadTemplate,
  buildEvidenceCaptureValidationSpecs,
  uniqueValues,
} from "./site-bundle-handoff-runbook-evidence.mjs";
import {
  getStageActionEvidenceCaptureFields,
} from "./site-bundle-handoff-runbook-evidence-fields.mjs";
import {
  formatBundleHandoffOperatorRunbookStageLine,
} from "./site-bundle-handoff-runbook-format.mjs";
import {
  getStageActionBlockedStageKeys,
  getStageActionCompletionCriteria,
  getStageActionDependencyReason,
  getStageActionDependencyReasonCode,
  getStageActionEvidenceRequirements,
  getStageActionPrerequisiteKeys,
  getStageActionPrerequisiteLabels,
  getStageLabel,
} from "./site-bundle-handoff-runbook-stage-metadata.mjs";

import { buildActionSummary } from "./site-bundle-handoff-runbook-action-summary.mjs";
import { buildStageHumanLineMaps } from "./site-bundle-handoff-runbook-human-lines.mjs";
import {
  buildStageActionDependencyMaps,
  buildStageActionEvidenceCaptureMaps,
  buildStageActionEvidenceMaps,
  buildStageActionStatusMaps,
  buildStageExecutionMaps,
  buildStageIdentityMaps,
  callsExternalSystem,
  hasCommands,
  isManualStage,
  isOptionalStage,
  isRequiredStage,
  mutatesTargetRepo,
  usesLocalOutputRunPolicy,
  usesReadOnlyRunPolicy,
} from "./site-bundle-handoff-runbook-maps.mjs";
import { buildNextStepState } from "./site-bundle-handoff-runbook-next-step.mjs";

export function buildBundleHandoffCommandManifest({
  sourceBundle,
  taskCatalog,
  defaultTask = null,
  selectedTask = null,
  effectiveTask = null,
} = {}) {
  const commands = [];
  const pushCommand = (entry) => {
    if (!entry || !entry.command || !Array.isArray(entry.commandArgs) || entry.commandArgs.length === 0) return;
    commands.push(entry);
  };
  const sourceValue = (field, fallback = "") => sourceBundle?.[field] || fallback;
  const pushSourceCommand = (key, label, commandKey, argsKey, policyKey, safetyKey) => {
    const safety = sourceValue(safetyKey, null);
    pushCommand({
      key,
      scope: "source-bundle",
      label,
      command: sourceValue(commandKey),
      commandArgs: sourceValue(argsKey, []),
      runPolicy: sourceValue(policyKey),
      safety,
      strict: Boolean(safety?.strict),
      taskId: "",
      outputFile: "",
      defaultTask: false,
      selectedTask: false,
      effectiveTask: false,
    });
  };
  const pushTaskCommand = (task, { strict = false } = {}) => {
    if (!task?.id) return;
    const commandKey = strict ? "strictHandoffCommand" : "handoffCommand";
    const argsKey = strict ? "strictHandoffCommandArgs" : "handoffCommandArgs";
    const policyKey = strict ? "strictHandoffCommandRunPolicy" : "handoffCommandRunPolicy";
    const safetyKey = strict ? "strictHandoffCommandSafety" : "handoffCommandSafety";
    const taskValue = (field, fallback = "") => task[field] || fallback;
    const safety = taskValue(safetyKey, null);
    pushCommand({
      key: `task.${task.id}.handoff.${strict ? "strict" : "default"}`,
      scope: "task-handoff",
      label: `${strict ? "Strict " : ""}Task handoff: ${task.id}`,
      command: taskValue(commandKey),
      commandArgs: taskValue(argsKey, []),
      runPolicy: taskValue(policyKey),
      safety,
      strict,
      taskId: task.id,
      taskNumber: Number.isInteger(task.number) ? task.number : null,
      outputFile: task.handoffOutFile || safety?.outputFile || "",
      defaultTask: task.id === defaultTask?.id,
      selectedTask: task.id === selectedTask?.id,
      effectiveTask: task.id === effectiveTask?.id,
    });
  };

  pushSourceCommand("source.bundleCheck", "Bundle check JSON", "checkCommand", "checkCommandArgs", "checkCommandRunPolicy", "checkCommandSafety");
  pushSourceCommand("source.bundleCheck.strict", "Strict bundle check JSON", "strictCheckCommand", "strictCheckCommandArgs", "strictCheckCommandRunPolicy", "strictCheckCommandSafety");
  pushSourceCommand("source.bundleHandoff", "Bundle handoff JSON", "handoffCommand", "handoffCommandArgs", "handoffCommandRunPolicy", "handoffCommandSafety");
  pushSourceCommand("source.bundleHandoff.strict", "Strict bundle handoff JSON", "strictHandoffCommand", "strictHandoffCommandArgs", "strictHandoffCommandRunPolicy", "strictHandoffCommandSafety");
  for (const task of taskCatalog?.items || []) {
    pushTaskCommand(task);
    pushTaskCommand(task, { strict: true });
  }

  const countBy = (predicate) => commands.filter(predicate).length;
  const isSourceBundleCommand = (command) => command.scope === "source-bundle";
  const isTaskHandoffCommand = (command) => command.scope === "task-handoff";
  const usesReadOnlyRunPolicy = (command) => command.runPolicy === "read-only";
  const usesLocalOutputRunPolicy = (command) => command.runPolicy === "writes-local-file";
  const hasExternalCallSafety = (command) => command.safety?.externalCalls === true;
  const hasTargetRepoMutationSafety = (command) => command.safety?.targetRepoMutation === true;
  const requiresCleanWorkspaceSafety = (command) => command.safety?.requiresCleanWorkspace === true;
  const requiresReviewBeforeMutationSafety = (command) => command.safety?.requiresReviewBeforeMutation === true;
  const effectiveTaskId = effectiveTask?.id || "";
  const selectedTaskId = selectedTask?.id || "";
  const defaultTaskId = defaultTask?.id || "";
  const manifestCountSummary = {
    commandCount: commands.length,
    sourceCommandCount: countBy(isSourceBundleCommand),
    taskCommandCount: countBy(isTaskHandoffCommand),
    readOnlyCount: countBy(usesReadOnlyRunPolicy),
    localOutputFileCount: countBy(usesLocalOutputRunPolicy),
    externalCallCount: countBy(hasExternalCallSafety),
    targetRepoMutationCount: countBy(hasTargetRepoMutationSafety),
    requiresCleanWorkspaceCount: countBy(requiresCleanWorkspaceSafety),
    requiresReviewBeforeMutationCount: countBy(requiresReviewBeforeMutationSafety),
  };
  const manifestTaskSelection = {
    defaultTaskId,
    selectedTaskId,
    effectiveTaskId,
  };
  const manifestStrictCommandKeys = {
    defaultStrictTaskCommandKey: defaultTaskId ? `task.${defaultTaskId}.handoff.strict` : "",
    selectedStrictTaskCommandKey: selectedTaskId ? `task.${selectedTaskId}.handoff.strict` : "",
    effectiveStrictTaskCommandKey: effectiveTaskId ? `task.${effectiveTaskId}.handoff.strict` : "",
  };
  return {
    version: 1,
    source: "bundle-handoff",
    ...manifestCountSummary,
    ...manifestTaskSelection,
    ...manifestStrictCommandKeys,
    commands,
  };
}

export function buildBundleHandoffOperatorRunbook(commandManifest) {
  const commands = Array.isArray(commandManifest?.commands) ? commandManifest.commands : [];
  const commandByKey = new Map(commands.map((command) => [command.key, command]));
  const buildStage = ({
    step,
    key,
    label,
    kind,
    required,
    commandKeys = [],
    reason,
    manual = false,
  }) => {
    const stageCommands = commandKeys
      .map((commandKey) => commandByKey.get(commandKey))
      .filter(Boolean);
    const firstCommand = stageCommands[0] || null;
    const firstCommandSafety = firstCommand?.safety || null;
    const commandHasSafetyFlag = (command, field) => command.safety?.[field] === true;
    const commandCount = stageCommands.length;
    const stageIdentity = {
      step,
      key,
      label,
      kind,
      required,
    };
    const stageCommandSummary = {
      commandKeys,
      commands: stageCommands,
      commandCount,
      runPolicy: manual ? "manual-target-repo" : (firstCommand?.runPolicy || ""),
      safetyLevel: manual ? "operator-controlled-target-repo" : (firstCommandSafety?.safetyLevel || ""),
    };
    const stageSafetySummary = {
      writesLocalFile: stageCommands.some((command) => commandHasSafetyFlag(command, "writesLocalFile")),
      outputFiles: stageCommands.map((command) => command.outputFile).filter(Boolean),
      externalCalls: stageCommands.some((command) => commandHasSafetyFlag(command, "externalCalls")),
      targetRepoMutation: stageCommands.some((command) => commandHasSafetyFlag(command, "targetRepoMutation")),
    };
    return {
      ...stageIdentity,
      ...stageCommandSummary,
      ...stageSafetySummary,
      reason,
    };
  };
  const effectiveStrictTaskCommandKey = commandManifest?.effectiveStrictTaskCommandKey || "";
  const stages = [
    buildStage({
      step: 1,
      key: "verifySourceBundle",
      label: "Verify source bundle integrity",
      kind: "read-only-gate",
      required: true,
      commandKeys: ["source.bundleCheck.strict"],
      reason: "Confirm the bundle still matches its checksum and generated-file contract before handoff execution.",
    }),
    buildStage({
      step: 2,
      key: "refreshHandoffSnapshot",
      label: "Refresh strict handoff JSON snapshot",
      kind: "read-only-preview",
      required: false,
      commandKeys: ["source.bundleHandoff.strict"],
      reason: "Regenerate the machine-readable handoff snapshot when a wrapper or GUI needs the latest JSON contract.",
    }),
    buildStage({
      step: 3,
      key: "writeEffectiveTaskPrompt",
      label: "Write effective task handoff prompt",
      kind: "local-output",
      required: true,
      commandKeys: effectiveStrictTaskCommandKey ? [effectiveStrictTaskCommandKey] : [],
      reason: "Create the selected task prompt as a local file before moving into the target website repository.",
    }),
    buildStage({
      step: 4,
      key: "executeInTargetRepo",
      label: "Execute the task in the target website repo",
      kind: "manual-target-repo",
      required: true,
      manual: true,
      reason: "Open the generated task prompt in the target repo, inspect architecture first, then implement and verify there.",
    }),
    buildStage({
      step: 5,
      key: "recordEvidence",
      label: "Record implementation evidence",
      kind: "manual-reporting",
      required: true,
      manual: true,
      reason: "Return changed files, verification commands, browser/viewport checks, remaining risks, and the bundle digest.",
    }),
  ];
  const commandStages = stages.filter(hasCommands);
  const stageActionRows = stages.map((stage) => {
    const prerequisiteKeys = getStageActionPrerequisiteKeys(stage);
    const blockedStageKeys = getStageActionBlockedStageKeys(stage, stages);
    const completionCriteria = getStageActionCompletionCriteria(stage);
    const evidenceRequirements = getStageActionEvidenceRequirements(stage);
    const evidenceCaptureFields = getStageActionEvidenceCaptureFields(stage);
    const evidenceFieldValues = (field) => evidenceCaptureFields.map((evidenceField) => evidenceField[field]);
    const evidenceCaptureSectionKeys = uniqueValues(evidenceFieldValues("sectionKey"));
    const evidenceCaptureSectionLabels = uniqueValues(evidenceFieldValues("sectionLabel"));
    const evidenceCapturePayloadNamespaces = uniqueValues(evidenceFieldValues("payloadNamespace"));
    const requiredEvidenceCaptureFields = evidenceCaptureFields.filter((field) => field.required);
    const optionalEvidenceCaptureFields = evidenceCaptureFields.filter((field) => !field.required);
    const actionEvidenceSummary = {
      actionEvidenceRequirements: evidenceRequirements,
      actionEvidenceRequirementCount: evidenceRequirements.length,
      actionRequiresEvidence: evidenceRequirements.length > 0,
      actionEvidenceTarget: getStageActionEvidenceTarget(stage),
      actionEvidenceTargetLabel: getStageActionEvidenceTargetLabel(stage),
    };
    const actionIdentity = {
      step: stage.step,
      key: stage.key,
      label: stage.label,
    };
    const actionStatusSummary = {
      actionType: getStageActionType(stage),
      actionLabel: getStageActionLabel(stage),
      actionInstruction: getStageActionInstruction(stage),
      actionButtonLabel: getStageActionButtonLabel(stage),
      actionAffordance: getStageActionAffordance(stage),
      actionEnabled: getStageActionEnabled(stage),
      actionStatus: getStageActionStatus(stage),
      actionStatusLabel: getStageActionStatusLabel(stage),
      actionStatusTone: getStageActionStatusTone(stage),
      actionDisabledReasonCode: getStageActionDisabledReasonCode(stage),
      actionDisabledReason: getStageActionDisabledReason(stage),
    };
    const actionDependencySummary = {
      actionPrerequisiteKeys: prerequisiteKeys,
      actionPrerequisiteLabels: getStageActionPrerequisiteLabels(stage, stages),
      actionPrerequisiteCount: prerequisiteKeys.length,
      actionHasPrerequisites: prerequisiteKeys.length > 0,
      actionDependencyReasonCode: getStageActionDependencyReasonCode(stage),
      actionDependencyReason: getStageActionDependencyReason(stage),
      actionBlockedStageKeys: blockedStageKeys,
      actionBlockedStageLabels: blockedStageKeys.map((stageKey) => getStageLabel(stages, stageKey)),
      actionBlockedStageCount: blockedStageKeys.length,
      actionBlocksStages: blockedStageKeys.length > 0,
      actionCompletionCriteria: completionCriteria,
      actionCompletionCriteriaCount: completionCriteria.length,
      actionHasCompletionCriteria: completionCriteria.length > 0,
    };
    const actionEvidenceCaptureSummary = {
      actionEvidenceCaptureFields: evidenceCaptureFields,
      actionEvidenceCaptureFieldKeys: evidenceFieldValues("key"),
      actionEvidenceCaptureFieldLabels: evidenceFieldValues("label"),
      actionEvidenceCaptureFieldPlaceholders: evidenceFieldValues("placeholder"),
      actionEvidenceCaptureFieldRequirementLabels: evidenceFieldValues("requirementLabel"),
      actionEvidenceCaptureFieldAriaLabels: evidenceFieldValues("ariaLabel"),
      actionEvidenceCaptureFieldHelpTexts: evidenceFieldValues("helpText"),
      actionEvidenceCaptureFieldSectionKeys: evidenceFieldValues("sectionKey"),
      actionEvidenceCaptureFieldSectionLabels: evidenceFieldValues("sectionLabel"),
      actionEvidenceCaptureSectionKeys: evidenceCaptureSectionKeys,
      actionEvidenceCaptureSectionLabels: evidenceCaptureSectionLabels,
      actionEvidenceCaptureSectionCount: evidenceCaptureSectionKeys.length,
      actionEvidenceCaptureFieldPayloadNamespaces: evidenceFieldValues("payloadNamespace"),
      actionEvidenceCaptureFieldPayloadPaths: evidenceFieldValues("payloadPath"),
      actionEvidenceCapturePayloadNamespaces: evidenceCapturePayloadNamespaces,
      actionEvidenceCapturePayloadNamespaceCount: evidenceCapturePayloadNamespaces.length,
      actionEvidenceCapturePayloadTemplate: buildEvidenceCapturePayloadTemplate(evidenceCaptureFields),
      actionEvidenceCapturePayloadFlatTemplate: buildEvidenceCapturePayloadFlatTemplate(evidenceCaptureFields),
      actionEvidenceCapturePayloadBindings: buildEvidenceCapturePayloadBindings(evidenceCaptureFields),
      actionEvidenceCaptureValidationSpecs: buildEvidenceCaptureValidationSpecs(evidenceCaptureFields),
      actionEvidenceCaptureInitialValidationStates: buildEvidenceCaptureInitialValidationStates(evidenceCaptureFields),
      actionEvidenceCaptureInitialValidationDisplayMetadata: buildEvidenceCaptureInitialValidationDisplayMetadata(evidenceCaptureFields),
      actionEvidenceCaptureInitialValidationChecklist: buildEvidenceCaptureInitialValidationChecklist(evidenceCaptureFields),
      actionEvidenceCaptureInitialValidationChecklistSummary: buildEvidenceCaptureInitialValidationChecklistSummary(evidenceCaptureFields),
      actionEvidenceCaptureInitialValidationSummary: buildEvidenceCaptureInitialValidationSummary(evidenceCaptureFields),
      actionEvidenceCaptureFieldInputTypes: evidenceFieldValues("inputType"),
      actionEvidenceCaptureFieldValueShapes: evidenceFieldValues("valueShape"),
      actionEvidenceCaptureFieldAcceptsMultiple: evidenceFieldValues("acceptsMultiple"),
      actionEvidenceCaptureFieldDefaultValues: evidenceFieldValues("defaultValue"),
      actionEvidenceCaptureFieldEmptyValues: evidenceFieldValues("emptyValue"),
      actionEvidenceCaptureFieldValidationRules: evidenceFieldValues("validationRule"),
      actionEvidenceCaptureFieldMinLengths: evidenceFieldValues("minLength"),
      actionEvidenceCaptureFieldExamples: evidenceFieldValues("example"),
      actionEvidenceCaptureFieldValidationHints: evidenceFieldValues("validationHint"),
      actionRequiredEvidenceCaptureFieldKeys: requiredEvidenceCaptureFields.map((field) => field.key),
      actionOptionalEvidenceCaptureFieldKeys: optionalEvidenceCaptureFields.map((field) => field.key),
      actionEvidenceCaptureFieldCount: evidenceCaptureFields.length,
      actionRequiredEvidenceCaptureFieldCount: requiredEvidenceCaptureFields.length,
      actionOptionalEvidenceCaptureFieldCount: optionalEvidenceCaptureFields.length,
      actionHasEvidenceCaptureFields: evidenceCaptureFields.length > 0,
    };
    const actionExecutionSummary = {
      required: stage.required,
      runPolicy: stage.runPolicy,
      safetyLevel: stage.safetyLevel,
      commandKeys: stage.commandKeys,
      commandCount: stage.commandCount,
      outputFiles: stage.outputFiles,
      manual: isManualStage(stage),
      writesLocalFile: stage.writesLocalFile,
      externalCalls: stage.externalCalls,
      targetRepoMutation: stage.targetRepoMutation,
    };

    return {
      ...actionIdentity,
      ...actionStatusSummary,
      ...actionDependencySummary,
      ...actionEvidenceSummary,
      ...actionEvidenceCaptureSummary,
      ...actionExecutionSummary,
    };
  });
  const stageIdentityMaps = buildStageIdentityMaps(stages);
  const stageActionStatusMaps = buildStageActionStatusMaps(stageActionRows);
  const stageActionDependencyMaps = buildStageActionDependencyMaps(stageActionRows);
  const stageActionEvidenceMaps = buildStageActionEvidenceMaps(stageActionRows);
  const stageActionEvidenceCaptureMaps = buildStageActionEvidenceCaptureMaps(stageActionRows);
  const stageHumanLineMaps = buildStageHumanLineMaps(
    stages,
    stageActionRows,
    stageActionEvidenceCaptureMaps.stageActionEvidenceCaptureInitialValidationChecklistSummaryByKey,
  );
  const stageExecutionMaps = buildStageExecutionMaps(stages);
  const { nextActionSummary, nextStepSummary } = buildNextStepState({
    stageByKey: stageIdentityMaps.stageByKey,
    commandByKey,
    stageActionRows,
    stageHumanLineByKey: stageHumanLineMaps.stageHumanLineByKey,
    stageHumanLineDisplayRowByKey: stageHumanLineMaps.stageHumanLineDisplayRowByKey,
  });
  const actionSummary = buildActionSummary({
    stages,
    commandStages,
    stageActionRows,
    stageHumanLineMaps,
    nextActionSummary,
  });
  const countBy = (predicate) => stages.filter(predicate).length;
  const runbookCountSummary = {
    stageCount: stages.length,
    commandStageCount: commandStages.length,
    manualStageCount: countBy(isManualStage),
    requiredStageCount: countBy(isRequiredStage),
    optionalStageCount: countBy(isOptionalStage),
    readOnlyCommandStageCount: countBy(usesReadOnlyRunPolicy),
    localOutputCommandStageCount: countBy(usesLocalOutputRunPolicy),
    externalCallCommandStageCount: countBy(callsExternalSystem),
    targetRepoMutationCommandStageCount: countBy(mutatesTargetRepo),
    effectiveTaskId: commandManifest?.effectiveTaskId || "",
    effectiveStrictTaskCommandKey,
  };
  return {
    version: 1,
    source: "bundle-handoff",
    ...runbookCountSummary,
    ...stageIdentityMaps,
    ...stageHumanLineMaps,
    ...stageActionStatusMaps,
    ...stageActionDependencyMaps,
    ...stageActionEvidenceMaps,
    ...stageActionEvidenceCaptureMaps,
    actionSummary,
    ...stageExecutionMaps,
    ...nextStepSummary,
    stages,
  };
}

export {
  formatBundleHandoffOperatorRunbookLines,
} from "./site-bundle-handoff-runbook-format.mjs";