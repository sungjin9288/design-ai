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
  return {
    version: 1,
    source: "bundle-handoff",
    commandCount: commands.length,
    sourceCommandCount: countBy(isSourceBundleCommand),
    taskCommandCount: countBy(isTaskHandoffCommand),
    readOnlyCount: countBy(usesReadOnlyRunPolicy),
    localOutputFileCount: countBy(usesLocalOutputRunPolicy),
    externalCallCount: countBy(hasExternalCallSafety),
    targetRepoMutationCount: countBy(hasTargetRepoMutationSafety),
    requiresCleanWorkspaceCount: countBy(requiresCleanWorkspaceSafety),
    requiresReviewBeforeMutationCount: countBy(requiresReviewBeforeMutationSafety),
    defaultTaskId,
    selectedTaskId,
    effectiveTaskId,
    defaultStrictTaskCommandKey: defaultTaskId ? `task.${defaultTaskId}.handoff.strict` : "",
    selectedStrictTaskCommandKey: selectedTaskId ? `task.${selectedTaskId}.handoff.strict` : "",
    effectiveStrictTaskCommandKey: effectiveTaskId ? `task.${effectiveTaskId}.handoff.strict` : "",
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
    return {
      step,
      key,
      label,
      kind,
      required,
      commandKeys,
      commands: stageCommands,
      commandCount: stageCommands.length,
      runPolicy: manual ? "manual-target-repo" : (firstCommand?.runPolicy || ""),
      safetyLevel: manual ? "operator-controlled-target-repo" : (firstCommandSafety?.safetyLevel || ""),
      writesLocalFile: stageCommands.some((command) => commandHasSafetyFlag(command, "writesLocalFile")),
      outputFiles: stageCommands.map((command) => command.outputFile).filter(Boolean),
      externalCalls: stageCommands.some((command) => commandHasSafetyFlag(command, "externalCalls")),
      targetRepoMutation: stageCommands.some((command) => commandHasSafetyFlag(command, "targetRepoMutation")),
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
  const hasCommands = (stage) => stage.commandCount > 0;
  const isManualStage = (stage) => !hasCommands(stage);
  const isRequiredStage = (stage) => stage.required;
  const isOptionalStage = (stage) => !stage.required;
  const usesReadOnlyRunPolicy = (stage) => stage.runPolicy === "read-only";
  const usesLocalOutputRunPolicy = (stage) => stage.runPolicy === "writes-local-file";
  const hasOutputFile = (stage) => stage.outputFiles.length > 0;
  const callsExternalSystem = (stage) => stage.externalCalls;
  const mutatesTargetRepo = (stage) => stage.targetRepoMutation;
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

    return {
      step: stage.step,
      key: stage.key,
      label: stage.label,
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
      ...actionEvidenceSummary,
      ...actionEvidenceCaptureSummary,
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
  });
  const byKey = (rows, getValue) => Object.fromEntries(
    rows.map((row, index) => [row.key, getValue(row, index)]),
  );
  const fieldByKey = (rows, field) => byKey(rows, (row) => row[field]);
  const stageFieldByKey = (field) => fieldByKey(stages, field);
  const actionFieldByKey = (field) => fieldByKey(stageActionRows, field);
  const commandListByKey = (getValue) => byKey(stages, (stage) => stage.commands.map(getValue));
  const stageKeys = stages.map((stage) => stage.key);
  const stageByKey = byKey(stages, (stage) => stage);
  const stageLabelByKey = stageFieldByKey("label");
  const stageSummaryByKey = stageFieldByKey("reason");
  const stageActionTypeByKey = actionFieldByKey("actionType");
  const stageActionLabelByKey = actionFieldByKey("actionLabel");
  const stageActionInstructionsByKey = actionFieldByKey("actionInstruction");
  const stageActionButtonLabelsByKey = actionFieldByKey("actionButtonLabel");
  const stageActionAffordanceByKey = actionFieldByKey("actionAffordance");
  const stageActionEnabledByKey = actionFieldByKey("actionEnabled");
  const stageActionStatusByKey = actionFieldByKey("actionStatus");
  const stageActionStatusLabelsByKey = actionFieldByKey("actionStatusLabel");
  const stageActionStatusToneByKey = actionFieldByKey("actionStatusTone");
  const stageActionDisabledReasonCodeByKey = actionFieldByKey("actionDisabledReasonCode");
  const stageActionDisabledReasonByKey = actionFieldByKey("actionDisabledReason");
  const stageActionPrerequisiteKeysByKey = actionFieldByKey("actionPrerequisiteKeys");
  const stageActionPrerequisiteLabelsByKey = actionFieldByKey("actionPrerequisiteLabels");
  const stageActionPrerequisiteCountByKey = actionFieldByKey("actionPrerequisiteCount");
  const stageActionHasPrerequisitesByKey = actionFieldByKey("actionHasPrerequisites");
  const stageActionDependencyReasonCodeByKey = actionFieldByKey("actionDependencyReasonCode");
  const stageActionDependencyReasonByKey = actionFieldByKey("actionDependencyReason");
  const stageActionBlockedStageKeysByKey = actionFieldByKey("actionBlockedStageKeys");
  const stageActionBlockedStageLabelsByKey = actionFieldByKey("actionBlockedStageLabels");
  const stageActionBlockedStageCountByKey = actionFieldByKey("actionBlockedStageCount");
  const stageActionBlocksStagesByKey = actionFieldByKey("actionBlocksStages");
  const stageActionCompletionCriteriaByKey = actionFieldByKey("actionCompletionCriteria");
  const stageActionCompletionCriteriaCountByKey = actionFieldByKey("actionCompletionCriteriaCount");
  const stageActionHasCompletionCriteriaByKey = actionFieldByKey("actionHasCompletionCriteria");
  const stageActionEvidenceRequirementsByKey = actionFieldByKey("actionEvidenceRequirements");
  const stageActionEvidenceRequirementCountByKey = actionFieldByKey("actionEvidenceRequirementCount");
  const stageActionRequiresEvidenceByKey = actionFieldByKey("actionRequiresEvidence");
  const stageActionEvidenceTargetByKey = actionFieldByKey("actionEvidenceTarget");
  const stageActionEvidenceTargetLabelByKey = actionFieldByKey("actionEvidenceTargetLabel");
  const stageActionEvidenceCaptureFieldsByKey = actionFieldByKey("actionEvidenceCaptureFields");
  const stageActionEvidenceCaptureFieldKeysByKey = actionFieldByKey("actionEvidenceCaptureFieldKeys");
  const stageActionEvidenceCaptureFieldLabelsByKey = actionFieldByKey("actionEvidenceCaptureFieldLabels");
  const stageActionEvidenceCaptureFieldPlaceholdersByKey = actionFieldByKey("actionEvidenceCaptureFieldPlaceholders");
  const stageActionEvidenceCaptureFieldRequirementLabelsByKey = actionFieldByKey("actionEvidenceCaptureFieldRequirementLabels");
  const stageActionEvidenceCaptureFieldAriaLabelsByKey = actionFieldByKey("actionEvidenceCaptureFieldAriaLabels");
  const stageActionEvidenceCaptureFieldHelpTextsByKey = actionFieldByKey("actionEvidenceCaptureFieldHelpTexts");
  const stageActionEvidenceCaptureFieldSectionKeysByKey = actionFieldByKey("actionEvidenceCaptureFieldSectionKeys");
  const stageActionEvidenceCaptureFieldSectionLabelsByKey = actionFieldByKey("actionEvidenceCaptureFieldSectionLabels");
  const stageActionEvidenceCaptureSectionKeysByKey = actionFieldByKey("actionEvidenceCaptureSectionKeys");
  const stageActionEvidenceCaptureSectionLabelsByKey = actionFieldByKey("actionEvidenceCaptureSectionLabels");
  const stageActionEvidenceCaptureSectionCountByKey = actionFieldByKey("actionEvidenceCaptureSectionCount");
  const stageActionEvidenceCaptureFieldPayloadNamespacesByKey = actionFieldByKey("actionEvidenceCaptureFieldPayloadNamespaces");
  const stageActionEvidenceCaptureFieldPayloadPathsByKey = actionFieldByKey("actionEvidenceCaptureFieldPayloadPaths");
  const stageActionEvidenceCapturePayloadNamespacesByKey = actionFieldByKey("actionEvidenceCapturePayloadNamespaces");
  const stageActionEvidenceCapturePayloadNamespaceCountByKey = actionFieldByKey("actionEvidenceCapturePayloadNamespaceCount");
  const stageActionEvidenceCapturePayloadTemplateByKey = actionFieldByKey("actionEvidenceCapturePayloadTemplate");
  const stageActionEvidenceCapturePayloadFlatTemplateByKey = actionFieldByKey("actionEvidenceCapturePayloadFlatTemplate");
  const stageActionEvidenceCapturePayloadBindingsByKey = actionFieldByKey("actionEvidenceCapturePayloadBindings");
  const stageActionEvidenceCaptureValidationSpecsByKey = actionFieldByKey("actionEvidenceCaptureValidationSpecs");
  const stageActionEvidenceCaptureInitialValidationStatesByKey = actionFieldByKey("actionEvidenceCaptureInitialValidationStates");
  const stageActionEvidenceCaptureInitialValidationDisplayMetadataByKey = actionFieldByKey("actionEvidenceCaptureInitialValidationDisplayMetadata");
  const stageActionEvidenceCaptureInitialValidationChecklistByKey = actionFieldByKey("actionEvidenceCaptureInitialValidationChecklist");
  const stageActionEvidenceCaptureInitialValidationChecklistSummaryByKey = actionFieldByKey("actionEvidenceCaptureInitialValidationChecklistSummary");
  const stageActionEvidenceCaptureInitialValidationSummaryByKey = actionFieldByKey("actionEvidenceCaptureInitialValidationSummary");
  const stageHumanLines = stages.map((stage) => formatBundleHandoffOperatorRunbookStageLine(
    stage,
    stageActionEvidenceCaptureInitialValidationChecklistSummaryByKey[stage.key],
  ));
  const stageHumanLineByKey = byKey(stages, (_stage, index) => stageHumanLines[index]);
  const stageHumanLineDisplayRows = stages.map((stage, index) => {
    const actionRow = stageActionRows[index];
    const evidenceProgress = actionRow.actionEvidenceCaptureInitialValidationChecklistSummary;
    return {
      step: stage.step,
      key: stage.key,
      label: stage.label,
      line: stageHumanLines[index],
      required: stage.required,
      manual: isManualStage(stage),
      commandCount: stage.commandCount,
      actionType: actionRow.actionType,
      actionLabel: actionRow.actionLabel,
      actionStatus: actionRow.actionStatus,
      actionStatusLabel: actionRow.actionStatusLabel,
      actionStatusTone: actionRow.actionStatusTone,
      hasEvidenceProgress: evidenceProgress.itemCount > 0,
      evidenceProgressStatus: evidenceProgress.status || "",
      evidenceProgressStatusLabel: evidenceProgress.statusLabel || "",
      evidenceProgressStatusTone: evidenceProgress.statusTone || "",
      evidenceProgressIconName: evidenceProgress.iconName || "",
      evidenceProgressLabel: evidenceProgress.progressLabel || "",
      evidenceCompletionPercent: evidenceProgress.completionPercent ?? 0,
      firstUncheckedEvidenceItemLabel: evidenceProgress.firstUncheckedItemLabel || "",
    };
  });
  const stageHumanLineDisplayRowByKey = byKey(stageHumanLineDisplayRows, (row) => row);
  const countBy = (predicate) => stages.filter(predicate).length;
  const stageKeysBy = (predicate) => stages.filter(predicate).map((stage) => stage.key);
  const countActions = (predicate) => stageActionRows.filter(predicate).length;
  const firstActionKey = (predicate) => stageActionRows.find(predicate)?.key || "";
  const displayRowKeysBy = (predicate) => stageHumanLineDisplayRows.filter(predicate).map((row) => row.key);
  const countDisplayRows = (predicate) => stageHumanLineDisplayRows.filter(predicate).length;
  const firstDisplayRowKey = (predicate) => stageHumanLineDisplayRows.find(predicate)?.key || "";
  const isRequiredDisplayRow = (row) => row.required;
  const isOptionalDisplayRow = (row) => !row.required;
  const hasCommandDisplayRow = (row) => row.commandCount > 0;
  const isManualDisplayRow = (row) => row.manual;
  const hasReadyActionStatus = (row) => row.actionStatus === "ready";
  const hasOptionalActionStatus = (row) => row.actionStatus === "optional";
  const hasManualActionStatus = (row) => row.actionStatus === "manual";
  const hasBlockedActionStatus = (row) => row.actionStatus === "blocked";
  const hasDisplayRowEvidenceProgress = (row) => row.hasEvidenceProgress;
  const hasBlockedDisplayRowEvidenceProgress = (row) => row.evidenceProgressStatus === "blocked";
  const hasReadyDisplayRowEvidenceProgress = (row) => row.evidenceProgressStatus === "ready";
  const hasEvidenceProgress = (stage) => (
    stage.actionEvidenceCaptureInitialValidationChecklistSummary.itemCount > 0
  );
  const hasBlockedEvidenceProgress = (stage) => (
    stage.actionEvidenceCaptureInitialValidationChecklistSummary.status === "blocked"
  );
  const hasReadyEvidenceProgress = (stage) => (
    stage.actionEvidenceCaptureInitialValidationChecklistSummary.status === "ready"
  );
  const stageHumanLineDisplayRowKeysByActionStatus = {
    ready: displayRowKeysBy(hasReadyActionStatus),
    optional: displayRowKeysBy(hasOptionalActionStatus),
    manual: displayRowKeysBy(hasManualActionStatus),
    blocked: displayRowKeysBy(hasBlockedActionStatus),
  };
  const stageHumanLineDisplayRowKeysByEvidenceProgressStatus = {
    blocked: displayRowKeysBy(hasBlockedDisplayRowEvidenceProgress),
    ready: displayRowKeysBy(hasReadyDisplayRowEvidenceProgress),
  };
  const stageHumanLineDisplayRowSummary = {
    count: stageHumanLineDisplayRows.length,
    byKeyCount: Object.keys(stageHumanLineDisplayRowByKey).length,
    requiredCount: countDisplayRows(isRequiredDisplayRow),
    optionalCount: countDisplayRows(isOptionalDisplayRow),
    commandCount: countDisplayRows(hasCommandDisplayRow),
    manualCount: countDisplayRows(isManualDisplayRow),
    readyActionStatusCount: countDisplayRows(hasReadyActionStatus),
    optionalActionStatusCount: countDisplayRows(hasOptionalActionStatus),
    manualActionStatusCount: countDisplayRows(hasManualActionStatus),
    blockedActionStatusCount: countDisplayRows(hasBlockedActionStatus),
    evidenceProgressCount: countDisplayRows(hasDisplayRowEvidenceProgress),
    blockedEvidenceProgressCount: countDisplayRows(hasBlockedDisplayRowEvidenceProgress),
    readyEvidenceProgressCount: countDisplayRows(hasReadyDisplayRowEvidenceProgress),
    firstRowKey: stageHumanLineDisplayRows[0]?.key || "",
    firstReadyActionRowKey: firstDisplayRowKey(hasReadyActionStatus),
    firstOptionalActionRowKey: firstDisplayRowKey(hasOptionalActionStatus),
    firstManualActionRowKey: firstDisplayRowKey(hasManualActionStatus),
    firstBlockedEvidenceProgressRowKey: firstDisplayRowKey(hasBlockedDisplayRowEvidenceProgress),
    firstReadyEvidenceProgressRowKey: firstDisplayRowKey(hasReadyDisplayRowEvidenceProgress),
  };
  const stageHumanLineSummary = {
    count: stageHumanLines.length,
    byKeyCount: Object.keys(stageHumanLineByKey).length,
    requiredCount: countBy(isRequiredStage),
    optionalCount: countBy(isOptionalStage),
    commandCount: countBy(hasCommands),
    manualCount: countBy(isManualStage),
    evidenceProgressCount: countActions(hasEvidenceProgress),
    blockedEvidenceProgressCount: countActions(hasBlockedEvidenceProgress),
    readyEvidenceProgressCount: countActions(hasReadyEvidenceProgress),
    firstStageKey: stages[0]?.key || "",
    firstLine: stageHumanLines[0] || "",
    firstEvidenceProgressStageKey: firstActionKey(hasEvidenceProgress),
    firstBlockedEvidenceProgressStageKey: firstActionKey(hasBlockedEvidenceProgress),
  };
  const stageActionEvidenceCaptureFieldInputTypesByKey = actionFieldByKey("actionEvidenceCaptureFieldInputTypes");
  const stageActionEvidenceCaptureFieldValueShapesByKey = actionFieldByKey("actionEvidenceCaptureFieldValueShapes");
  const stageActionEvidenceCaptureFieldAcceptsMultipleByKey = actionFieldByKey("actionEvidenceCaptureFieldAcceptsMultiple");
  const stageActionEvidenceCaptureFieldDefaultValuesByKey = actionFieldByKey("actionEvidenceCaptureFieldDefaultValues");
  const stageActionEvidenceCaptureFieldEmptyValuesByKey = actionFieldByKey("actionEvidenceCaptureFieldEmptyValues");
  const stageActionEvidenceCaptureFieldValidationRulesByKey = actionFieldByKey("actionEvidenceCaptureFieldValidationRules");
  const stageActionEvidenceCaptureFieldMinLengthsByKey = actionFieldByKey("actionEvidenceCaptureFieldMinLengths");
  const stageActionEvidenceCaptureFieldExamplesByKey = actionFieldByKey("actionEvidenceCaptureFieldExamples");
  const stageActionEvidenceCaptureFieldValidationHintsByKey = actionFieldByKey("actionEvidenceCaptureFieldValidationHints");
  const stageActionRequiredEvidenceCaptureFieldKeysByKey = actionFieldByKey("actionRequiredEvidenceCaptureFieldKeys");
  const stageActionOptionalEvidenceCaptureFieldKeysByKey = actionFieldByKey("actionOptionalEvidenceCaptureFieldKeys");
  const stageActionEvidenceCaptureFieldCountByKey = actionFieldByKey("actionEvidenceCaptureFieldCount");
  const stageActionRequiredEvidenceCaptureFieldCountByKey = actionFieldByKey("actionRequiredEvidenceCaptureFieldCount");
  const stageActionOptionalEvidenceCaptureFieldCountByKey = actionFieldByKey("actionOptionalEvidenceCaptureFieldCount");
  const stageActionHasEvidenceCaptureFieldsByKey = actionFieldByKey("actionHasEvidenceCaptureFields");
  const stageKindByKey = stageFieldByKey("kind");
  const stageRequiredByKey = stageFieldByKey("required");
  const stageRunPolicyByKey = stageFieldByKey("runPolicy");
  const stageSafetyLevelByKey = stageFieldByKey("safetyLevel");
  const stageCommandCountByKey = stageFieldByKey("commandCount");
  const stageCommandKeysByKey = stageFieldByKey("commandKeys");
  const stageCommandLabelsByKey = commandListByKey((command) => command.label);
  const stageCommandStringsByKey = commandListByKey((command) => command.command);
  const stageCommandArgsByKey = commandListByKey((command) => command.commandArgs);
  const stageCommandRunPoliciesByKey = commandListByKey((command) => command.runPolicy);
  const stageCommandSafetyLevelsByKey = commandListByKey((command) => command.safety?.safetyLevel || "");
  const stageOutputFilesByKey = stageFieldByKey("outputFiles");
  const stageHasCommandsByKey = byKey(stages, hasCommands);
  const stageManualByKey = byKey(stages, isManualStage);
  const stageWritesLocalFileByKey = stageFieldByKey("writesLocalFile");
  const stageExternalCallsByKey = stageFieldByKey("externalCalls");
  const stageTargetRepoMutationByKey = stageFieldByKey("targetRepoMutation");
  const commandStageKeys = stageKeysBy(hasCommands);
  const manualStageKeys = stageKeysBy(isManualStage);
  const nextStageKey = "verifySourceBundle";
  const nextCommandKey = "source.bundleCheck.strict";
  const nextStage = stageByKey[nextStageKey] || null;
  const nextStageActionRow = stageActionRows.find((stage) => stage.key === nextStageKey) || null;
  const nextCommandEntry = commandByKey.get(nextCommandKey) || null;
  const nextActionField = (field, fallback = "") => nextStageActionRow?.[field] || fallback;
  const nextActionListField = (field) => nextActionField(field, []);
  const nextActionObjectField = (field) => nextActionField(field, {});
  const nextActionNumberField = (field) => nextActionField(field, 0);
  const nextActionBooleanField = (field) => nextStageActionRow?.[field] === true;
  const nextStageField = (field, fallback = "") => nextStage?.[field] || fallback;
  const nextStageListField = (field) => nextStageField(field, []);
  const nextStageBooleanField = (field) => nextStage?.[field] === true;
  const nextStageCommandValues = (getValue) => nextStage?.commands?.map(getValue) || [];
  const nextActionEvidenceProgressSummary = nextActionObjectField("actionEvidenceCaptureInitialValidationChecklistSummary");
  const nextStageHumanLine = nextStage ? stageHumanLineByKey[nextStage.key] || "" : "";
  const nextStageHumanLineDisplayRow = nextStage ? stageHumanLineDisplayRowByKey[nextStage.key] || {} : {};
  const nextStageCommandCount = nextStageField("commandCount", 0);
  const nextCommandField = (field, fallback = "") => nextCommandEntry?.[field] || fallback;
  const nextCommandListField = (field) => nextCommandField(field, []);
  const nextCommandSafety = nextCommandEntry?.safety || null;
  const nextStageIdentity = {
    nextStageLabel: nextStageField("label"),
    nextStageSummary: nextStageField("reason"),
    nextStageHumanLine,
    nextStageHumanLineDisplayRow,
    nextStageHumanLineSummary: nextStage ? {
      stageKey: nextStage.key,
      line: nextStageHumanLine,
      hasEvidenceProgress: (nextActionEvidenceProgressSummary.itemCount || 0) > 0,
      evidenceProgressStatus: nextActionEvidenceProgressSummary.status || "",
      evidenceProgressLabel: nextActionEvidenceProgressSummary.progressLabel || "",
      firstUncheckedEvidenceItemLabel: nextActionEvidenceProgressSummary.firstUncheckedItemLabel || "",
    } : {},
  };
  const nextStageActionStatus = {
    nextStageActionType: nextActionField("actionType"),
    nextStageActionLabel: nextActionField("actionLabel"),
    nextStageActionInstruction: nextActionField("actionInstruction"),
    nextStageActionButtonLabel: nextActionField("actionButtonLabel"),
    nextStageActionAffordance: nextActionField("actionAffordance"),
    nextStageActionEnabled: nextActionBooleanField("actionEnabled"),
    nextStageActionStatus: nextActionField("actionStatus"),
    nextStageActionStatusLabel: nextActionField("actionStatusLabel"),
    nextStageActionStatusTone: nextActionField("actionStatusTone"),
    nextStageActionDisabledReasonCode: nextActionField("actionDisabledReasonCode"),
    nextStageActionDisabledReason: nextActionField("actionDisabledReason"),
  };
  const nextStageActionDependencies = {
    nextStageActionPrerequisiteKeys: nextActionListField("actionPrerequisiteKeys"),
    nextStageActionPrerequisiteLabels: nextActionListField("actionPrerequisiteLabels"),
    nextStageActionPrerequisiteCount: nextActionNumberField("actionPrerequisiteCount"),
    nextStageActionHasPrerequisites: nextActionBooleanField("actionHasPrerequisites"),
    nextStageActionDependencyReasonCode: nextActionField("actionDependencyReasonCode"),
    nextStageActionDependencyReason: nextActionField("actionDependencyReason"),
    nextStageActionBlockedStageKeys: nextActionListField("actionBlockedStageKeys"),
    nextStageActionBlockedStageLabels: nextActionListField("actionBlockedStageLabels"),
    nextStageActionBlockedStageCount: nextActionNumberField("actionBlockedStageCount"),
    nextStageActionBlocksStages: nextActionBooleanField("actionBlocksStages"),
    nextStageActionCompletionCriteria: nextActionListField("actionCompletionCriteria"),
    nextStageActionCompletionCriteriaCount: nextActionNumberField("actionCompletionCriteriaCount"),
    nextStageActionHasCompletionCriteria: nextActionBooleanField("actionHasCompletionCriteria"),
  };
  const nextStageActionEvidence = {
    nextStageActionEvidenceRequirements: nextActionListField("actionEvidenceRequirements"),
    nextStageActionEvidenceRequirementCount: nextActionNumberField("actionEvidenceRequirementCount"),
    nextStageActionRequiresEvidence: nextActionBooleanField("actionRequiresEvidence"),
    nextStageActionEvidenceTarget: nextActionField("actionEvidenceTarget"),
    nextStageActionEvidenceTargetLabel: nextActionField("actionEvidenceTargetLabel"),
  };
  const nextStageEvidenceCapture = {
    nextStageActionEvidenceCaptureFields: nextActionListField("actionEvidenceCaptureFields"),
    nextStageActionEvidenceCaptureFieldKeys: nextActionListField("actionEvidenceCaptureFieldKeys"),
    nextStageActionEvidenceCaptureFieldLabels: nextActionListField("actionEvidenceCaptureFieldLabels"),
    nextStageActionEvidenceCaptureFieldPlaceholders: nextActionListField("actionEvidenceCaptureFieldPlaceholders"),
    nextStageActionEvidenceCaptureFieldRequirementLabels: nextActionListField("actionEvidenceCaptureFieldRequirementLabels"),
    nextStageActionEvidenceCaptureFieldAriaLabels: nextActionListField("actionEvidenceCaptureFieldAriaLabels"),
    nextStageActionEvidenceCaptureFieldHelpTexts: nextActionListField("actionEvidenceCaptureFieldHelpTexts"),
    nextStageActionEvidenceCaptureFieldSectionKeys: nextActionListField("actionEvidenceCaptureFieldSectionKeys"),
    nextStageActionEvidenceCaptureFieldSectionLabels: nextActionListField("actionEvidenceCaptureFieldSectionLabels"),
    nextStageActionEvidenceCaptureSectionKeys: nextActionListField("actionEvidenceCaptureSectionKeys"),
    nextStageActionEvidenceCaptureSectionLabels: nextActionListField("actionEvidenceCaptureSectionLabels"),
    nextStageActionEvidenceCaptureSectionCount: nextActionNumberField("actionEvidenceCaptureSectionCount"),
    nextStageActionEvidenceCaptureFieldPayloadNamespaces: nextActionListField("actionEvidenceCaptureFieldPayloadNamespaces"),
    nextStageActionEvidenceCaptureFieldPayloadPaths: nextActionListField("actionEvidenceCaptureFieldPayloadPaths"),
    nextStageActionEvidenceCapturePayloadNamespaces: nextActionListField("actionEvidenceCapturePayloadNamespaces"),
    nextStageActionEvidenceCapturePayloadNamespaceCount: nextActionNumberField("actionEvidenceCapturePayloadNamespaceCount"),
    nextStageActionEvidenceCapturePayloadTemplate: nextActionObjectField("actionEvidenceCapturePayloadTemplate"),
    nextStageActionEvidenceCapturePayloadFlatTemplate: nextActionObjectField("actionEvidenceCapturePayloadFlatTemplate"),
    nextStageActionEvidenceCapturePayloadBindings: nextActionListField("actionEvidenceCapturePayloadBindings"),
    nextStageActionEvidenceCaptureValidationSpecs: nextActionListField("actionEvidenceCaptureValidationSpecs"),
    nextStageActionEvidenceCaptureInitialValidationStates: nextActionListField("actionEvidenceCaptureInitialValidationStates"),
    nextStageActionEvidenceCaptureInitialValidationDisplayMetadata: nextActionListField("actionEvidenceCaptureInitialValidationDisplayMetadata"),
    nextStageActionEvidenceCaptureInitialValidationChecklist: nextActionListField("actionEvidenceCaptureInitialValidationChecklist"),
    nextStageActionEvidenceCaptureInitialValidationChecklistSummary: nextActionObjectField("actionEvidenceCaptureInitialValidationChecklistSummary"),
    nextStageActionEvidenceCaptureInitialValidationSummary: nextActionObjectField("actionEvidenceCaptureInitialValidationSummary"),
    nextStageActionEvidenceCaptureFieldInputTypes: nextActionListField("actionEvidenceCaptureFieldInputTypes"),
    nextStageActionEvidenceCaptureFieldValueShapes: nextActionListField("actionEvidenceCaptureFieldValueShapes"),
    nextStageActionEvidenceCaptureFieldAcceptsMultiple: nextActionListField("actionEvidenceCaptureFieldAcceptsMultiple"),
    nextStageActionEvidenceCaptureFieldDefaultValues: nextActionListField("actionEvidenceCaptureFieldDefaultValues"),
    nextStageActionEvidenceCaptureFieldEmptyValues: nextActionListField("actionEvidenceCaptureFieldEmptyValues"),
    nextStageActionEvidenceCaptureFieldValidationRules: nextActionListField("actionEvidenceCaptureFieldValidationRules"),
    nextStageActionEvidenceCaptureFieldMinLengths: nextActionListField("actionEvidenceCaptureFieldMinLengths"),
    nextStageActionEvidenceCaptureFieldExamples: nextActionListField("actionEvidenceCaptureFieldExamples"),
    nextStageActionEvidenceCaptureFieldValidationHints: nextActionListField("actionEvidenceCaptureFieldValidationHints"),
    nextStageActionRequiredEvidenceCaptureFieldKeys: nextActionListField("actionRequiredEvidenceCaptureFieldKeys"),
    nextStageActionOptionalEvidenceCaptureFieldKeys: nextActionListField("actionOptionalEvidenceCaptureFieldKeys"),
    nextStageActionEvidenceCaptureFieldCount: nextActionNumberField("actionEvidenceCaptureFieldCount"),
    nextStageActionRequiredEvidenceCaptureFieldCount: nextActionNumberField("actionRequiredEvidenceCaptureFieldCount"),
    nextStageActionOptionalEvidenceCaptureFieldCount: nextActionNumberField("actionOptionalEvidenceCaptureFieldCount"),
    nextStageActionHasEvidenceCaptureFields: nextActionBooleanField("actionHasEvidenceCaptureFields"),
  };
  const nextStageCommandSummary = {
    nextStageKind: nextStageField("kind"),
    nextStageRequired: nextStage?.required === true,
    nextStageRunPolicy: nextStageField("runPolicy"),
    nextStageSafetyLevel: nextStageField("safetyLevel"),
    nextStageCommandCount,
    nextStageCommandLabels: nextStageCommandValues((command) => command.label),
    nextStageCommands: nextStageCommandValues((command) => command.command),
    nextStageCommandArgsList: nextStageCommandValues((command) => command.commandArgs),
    nextStageCommandRunPolicies: nextStageCommandValues((command) => command.runPolicy),
    nextStageCommandSafetyLevels: nextStageCommandValues((command) => command.safety?.safetyLevel || ""),
    nextStageOutputFiles: nextStageListField("outputFiles"),
    nextStageHasCommands: nextStageCommandCount > 0,
    nextStageManual: nextStageCommandCount === 0,
    nextStageWritesLocalFile: nextStageBooleanField("writesLocalFile"),
    nextStageExternalCalls: nextStageBooleanField("externalCalls"),
    nextStageTargetRepoMutation: nextStageBooleanField("targetRepoMutation"),
    nextStageCommandKeys: nextStageListField("commandKeys"),
  };
  const nextCommandSummary = {
    nextCommand: nextCommandField("command"),
    nextCommandArgs: nextCommandListField("commandArgs"),
    nextCommandRunPolicy: nextCommandField("runPolicy"),
    nextCommandSafetyLevel: nextCommandSafety?.safetyLevel || "",
    nextCommandSafety,
    nextCommandEntry,
  };
  const nextActionSummary = {
    nextActionKey: nextStageKey,
    nextActionType: nextActionField("actionType"),
    nextActionLabel: nextActionField("actionLabel"),
    nextActionEnabled: nextActionBooleanField("actionEnabled"),
    nextActionStatus: nextActionField("actionStatus"),
    nextActionStatusLabel: nextActionField("actionStatusLabel"),
    nextActionStatusTone: nextActionField("actionStatusTone"),
    nextActionDisabledReasonCode: nextActionField("actionDisabledReasonCode"),
    nextActionPrerequisiteKeys: nextActionListField("actionPrerequisiteKeys"),
    nextActionPrerequisiteLabels: nextActionListField("actionPrerequisiteLabels"),
    nextActionPrerequisiteCount: nextActionNumberField("actionPrerequisiteCount"),
    nextActionHasPrerequisites: nextActionBooleanField("actionHasPrerequisites"),
    nextActionDependencyReasonCode: nextActionField("actionDependencyReasonCode"),
    nextActionDependencyReason: nextActionField("actionDependencyReason"),
    nextActionBlockedStageKeys: nextActionListField("actionBlockedStageKeys"),
    nextActionBlockedStageLabels: nextActionListField("actionBlockedStageLabels"),
    nextActionBlockedStageCount: nextActionNumberField("actionBlockedStageCount"),
    nextActionBlocksStages: nextActionBooleanField("actionBlocksStages"),
    nextActionCompletionCriteria: nextActionListField("actionCompletionCriteria"),
    nextActionCompletionCriteriaCount: nextActionNumberField("actionCompletionCriteriaCount"),
    nextActionHasCompletionCriteria: nextActionBooleanField("actionHasCompletionCriteria"),
    nextActionEvidenceRequirements: nextActionListField("actionEvidenceRequirements"),
    nextActionEvidenceRequirementCount: nextActionNumberField("actionEvidenceRequirementCount"),
    nextActionRequiresEvidence: nextActionBooleanField("actionRequiresEvidence"),
    nextActionEvidenceTarget: nextActionField("actionEvidenceTarget"),
    nextActionEvidenceTargetLabel: nextActionField("actionEvidenceTargetLabel"),
    nextActionEvidenceCaptureFields: nextActionListField("actionEvidenceCaptureFields"),
    nextActionEvidenceCaptureFieldKeys: nextActionListField("actionEvidenceCaptureFieldKeys"),
    nextActionEvidenceCaptureFieldLabels: nextActionListField("actionEvidenceCaptureFieldLabels"),
    nextActionEvidenceCaptureFieldPlaceholders: nextActionListField("actionEvidenceCaptureFieldPlaceholders"),
    nextActionEvidenceCaptureFieldRequirementLabels: nextActionListField("actionEvidenceCaptureFieldRequirementLabels"),
    nextActionEvidenceCaptureFieldAriaLabels: nextActionListField("actionEvidenceCaptureFieldAriaLabels"),
    nextActionEvidenceCaptureFieldHelpTexts: nextActionListField("actionEvidenceCaptureFieldHelpTexts"),
    nextActionEvidenceCaptureFieldSectionKeys: nextActionListField("actionEvidenceCaptureFieldSectionKeys"),
    nextActionEvidenceCaptureFieldSectionLabels: nextActionListField("actionEvidenceCaptureFieldSectionLabels"),
    nextActionEvidenceCaptureSectionKeys: nextActionListField("actionEvidenceCaptureSectionKeys"),
    nextActionEvidenceCaptureSectionLabels: nextActionListField("actionEvidenceCaptureSectionLabels"),
    nextActionEvidenceCaptureSectionCount: nextActionNumberField("actionEvidenceCaptureSectionCount"),
    nextActionEvidenceCaptureFieldPayloadNamespaces: nextActionListField("actionEvidenceCaptureFieldPayloadNamespaces"),
    nextActionEvidenceCaptureFieldPayloadPaths: nextActionListField("actionEvidenceCaptureFieldPayloadPaths"),
    nextActionEvidenceCapturePayloadNamespaces: nextActionListField("actionEvidenceCapturePayloadNamespaces"),
    nextActionEvidenceCapturePayloadNamespaceCount: nextActionNumberField("actionEvidenceCapturePayloadNamespaceCount"),
    nextActionEvidenceCapturePayloadTemplate: nextActionObjectField("actionEvidenceCapturePayloadTemplate"),
    nextActionEvidenceCapturePayloadFlatTemplate: nextActionObjectField("actionEvidenceCapturePayloadFlatTemplate"),
    nextActionEvidenceCapturePayloadBindings: nextActionListField("actionEvidenceCapturePayloadBindings"),
    nextActionEvidenceCaptureValidationSpecs: nextActionListField("actionEvidenceCaptureValidationSpecs"),
    nextActionEvidenceCaptureInitialValidationStates: nextActionListField("actionEvidenceCaptureInitialValidationStates"),
    nextActionEvidenceCaptureInitialValidationDisplayMetadata: nextActionListField("actionEvidenceCaptureInitialValidationDisplayMetadata"),
    nextActionEvidenceCaptureInitialValidationChecklist: nextActionListField("actionEvidenceCaptureInitialValidationChecklist"),
    nextActionEvidenceCaptureInitialValidationChecklistSummary: nextActionObjectField("actionEvidenceCaptureInitialValidationChecklistSummary"),
    nextActionEvidenceCaptureInitialValidationSummary: nextActionObjectField("actionEvidenceCaptureInitialValidationSummary"),
    nextActionEvidenceCaptureFieldInputTypes: nextActionListField("actionEvidenceCaptureFieldInputTypes"),
    nextActionEvidenceCaptureFieldValueShapes: nextActionListField("actionEvidenceCaptureFieldValueShapes"),
    nextActionEvidenceCaptureFieldAcceptsMultiple: nextActionListField("actionEvidenceCaptureFieldAcceptsMultiple"),
    nextActionEvidenceCaptureFieldDefaultValues: nextActionListField("actionEvidenceCaptureFieldDefaultValues"),
    nextActionEvidenceCaptureFieldEmptyValues: nextActionListField("actionEvidenceCaptureFieldEmptyValues"),
    nextActionEvidenceCaptureFieldValidationRules: nextActionListField("actionEvidenceCaptureFieldValidationRules"),
    nextActionEvidenceCaptureFieldMinLengths: nextActionListField("actionEvidenceCaptureFieldMinLengths"),
    nextActionEvidenceCaptureFieldExamples: nextActionListField("actionEvidenceCaptureFieldExamples"),
    nextActionEvidenceCaptureFieldValidationHints: nextActionListField("actionEvidenceCaptureFieldValidationHints"),
    nextActionRequiredEvidenceCaptureFieldKeys: nextActionListField("actionRequiredEvidenceCaptureFieldKeys"),
    nextActionOptionalEvidenceCaptureFieldKeys: nextActionListField("actionOptionalEvidenceCaptureFieldKeys"),
    nextActionEvidenceCaptureFieldCount: nextActionNumberField("actionEvidenceCaptureFieldCount"),
    nextActionRequiredEvidenceCaptureFieldCount: nextActionNumberField("actionRequiredEvidenceCaptureFieldCount"),
    nextActionOptionalEvidenceCaptureFieldCount: nextActionNumberField("actionOptionalEvidenceCaptureFieldCount"),
    nextActionHasEvidenceCaptureFields: nextActionBooleanField("actionHasEvidenceCaptureFields"),
    nextActionRunPolicy: nextStageField("runPolicy"),
    nextActionSafetyLevel: nextStageField("safetyLevel"),
  };
  const sumActions = (getValue) => stageActionRows.reduce((sum, stage) => sum + getValue(stage), 0);
  const maxActionValue = (getValue) => Math.max(0, ...stageActionRows.map(getValue));
  const countActionsWithItems = (field) => countActions((stage) => stage[field].length > 0);
  const sumActionItems = (field) => sumActions((stage) => stage[field].length);
  const sumActionItemValues = (field, getValue) => sumActions(
    (stage) => stage[field].reduce((sum, item) => sum + getValue(item), 0),
  );
  const countActionItems = (field, predicate) => sumActions(
    (stage) => stage[field].filter(predicate).length,
  );
  const countEvidenceCaptureFields = (predicate) => countActionItems("actionEvidenceCaptureFields", predicate);
  const countPayloadBindings = (predicate) => countActionItems("actionEvidenceCapturePayloadBindings", predicate);
  const countValidationSpecs = (predicate) => countActionItems("actionEvidenceCaptureValidationSpecs", predicate);
  const countInitialValidationStates = (predicate) => countActionItems("actionEvidenceCaptureInitialValidationStates", predicate);
  const countInitialDisplayRows = (predicate) => countActionItems("actionEvidenceCaptureInitialValidationDisplayMetadata", predicate);
  const countInitialChecklistItems = (predicate) => countActionItems("actionEvidenceCaptureInitialValidationChecklist", predicate);
  const countActionsBySummary = (field, predicate) => countActions((stage) => predicate(stage[field]));
  const sumSummaryValues = (field, getValue) => sumActions((stage) => getValue(stage[field]));
  const countInitialValidationSummaries = (predicate) => (
    countActionsBySummary("actionEvidenceCaptureInitialValidationSummary", predicate)
  );
  const sumInitialValidationSummaryValues = (getValue) => (
    sumSummaryValues("actionEvidenceCaptureInitialValidationSummary", getValue)
  );
  const countInitialChecklistSummaries = (predicate) => (
    countActionsBySummary("actionEvidenceCaptureInitialValidationChecklistSummary", predicate)
  );
  const sumInitialChecklistSummaryValues = (getValue) => (
    sumSummaryValues("actionEvidenceCaptureInitialValidationChecklistSummary", getValue)
  );
  const uniqueActionListValueCount = (field) => uniqueValues(stageActionRows.flatMap((stage) => stage[field])).length;
  const payloadTemplatePathCount = (stage) => Object.keys(stage.actionEvidenceCapturePayloadFlatTemplate).length;
  const maxActionItemValue = (field, getValue) => Math.max(
    0,
    ...stageActionRows.flatMap((stage) => stage[field].map(getValue)),
  );
  const maxEvidenceCaptureFieldValue = (getValue) => maxActionItemValue("actionEvidenceCaptureFields", getValue);
  const firstActionWithEvidenceCaptureField = (predicate) => (
    firstActionKey((stage) => stage.actionEvidenceCaptureFields.some(predicate))
  );
  const firstStageKey = (predicate) => stages.find(predicate)?.key || "";
  const isActionEnabled = (action) => action.actionEnabled;
  const isActionDisabled = (action) => !action.actionEnabled;
  const isManualDisabledAction = (action) => isActionDisabled(action) && action.manual;
  const hasActionPrerequisites = (action) => action.actionHasPrerequisites;
  const hasActionDependencyReason = (action) => action.actionDependencyReasonCode;
  const blocksOtherActions = (action) => action.actionBlocksStages;
  const hasActionCompletionCriteria = (action) => action.actionHasCompletionCriteria;
  const requiresActionEvidence = (action) => action.actionRequiresEvidence;
  const targetsLocalCommandEvidence = (action) => action.actionEvidenceTarget === "local-command-output";
  const targetsLocalOutputEvidence = (action) => action.actionEvidenceTarget === "local-output-file";
  const targetsTargetRepoEvidence = (action) => action.actionEvidenceTarget === "target-repo-working-tree";
  const targetsHandoffRecordEvidence = (action) => action.actionEvidenceTarget === "handoff-evidence-record";
  const hasActionEvidenceCaptureFields = (action) => action.actionHasEvidenceCaptureFields;
  const hasRequiredActionEvidenceCaptureFields = (action) => action.actionRequiredEvidenceCaptureFieldCount > 0;
  const hasOptionalActionEvidenceCaptureFields = (action) => action.actionOptionalEvidenceCaptureFieldCount > 0;
  const hasMultipleEvidenceCaptureSections = (action) => action.actionEvidenceCaptureSectionCount > 1;
  const hasMultipleEvidenceCapturePayloadNamespaces = (action) => action.actionEvidenceCapturePayloadNamespaceCount > 1;
  const hasEvidenceCapturePayloadTemplate = (action) => payloadTemplatePathCount(action) > 0;
  const isManualAction = (action) => action.manual;
  const isManualEvidenceAction = (action) => action.actionType === "manual-evidence";
  const usesTextareaInput = (field) => field.inputType === "textarea";
  const usesTextInput = (field) => field.inputType === "text";
  const usesFilePathInput = (field) => field.inputType === "file-path";
  const usesListInput = (field) => field.inputType === "list";
  const capturesLongText = (field) => field.valueShape === "long-text";
  const capturesShortText = (field) => field.valueShape === "short-text";
  const capturesFilePathValue = (field) => field.valueShape === "file-path";
  const capturesStringList = (field) => field.valueShape === "string-list";
  const acceptsMultipleValues = (item) => item.acceptsMultiple;
  const acceptsSingleValue = (item) => !item.acceptsMultiple;
  const hasEmptyStringValue = (field) => field.emptyValue === "";
  const hasEmptyListValue = (field) => Array.isArray(field.emptyValue);
  const hasPlaceholder = (field) => Boolean(field.placeholder);
  const hasAriaLabel = (field) => Boolean(field.ariaLabel);
  const hasHelpText = (field) => Boolean(field.helpText);
  const belongsToEvidenceCaptureSection = (field) => Boolean(field.sectionKey);
  const mapsToPayloadPath = (field) => Boolean(field.payloadPath);
  const isRequiredItem = (item) => item.required;
  const isOptionalItem = (item) => !item.required;
  const hasValidationRule = (item) => Boolean(item.validationRule);
  const isRequiredValidatedField = (field) => isRequiredItem(field) && hasValidationRule(field);
  const isOptionalValidatedField = (field) => isOptionalItem(field) && hasValidationRule(field);
  const isErrorValidationSpec = (spec) => spec.severity === "error";
  const isInfoValidationSpec = (spec) => spec.severity === "info";
  const isValidInitialState = (state) => state.valid;
  const isInvalidInitialState = (state) => !state.valid;
  const isBlockingInitialState = (state) => state.blocking;
  const isOptionalEmptyInitialState = (state) => state.status === "optional-empty";
  const isMissingRequiredInitialState = (state) => state.status === "missing-required";
  const isPristineInitialState = (state) => !state.dirty && !state.touched;
  const isDangerInitialDisplayRow = (display) => display.statusTone === "danger";
  const isInfoInitialDisplayRow = (display) => display.statusTone === "info";
  const isBlockingInitialDisplayRow = (display) => display.blocking;
  const isNonBlockingInitialDisplayRow = (display) => !display.blocking;
  const isInitiallyCheckedChecklistItem = (item) => item.checkedInitially;
  const isInitiallyUncheckedChecklistItem = (item) => !item.checkedInitially;
  const blocksChecklistCompletion = (item) => item.completionBlocking;
  const doesNotBlockChecklistCompletion = (item) => !item.completionBlocking;
  const actionCountSummary = {
    totalActionCount: stages.length,
    commandActionCount: commandStages.length,
    manualActionCount: countBy(isManualStage),
    enabledActionCount: countActions(isActionEnabled),
    disabledActionCount: countActions(isActionDisabled),
    manualDisabledActionCount: countActions(isManualDisabledAction),
  };
  const actionDependencySummary = {
    actionWithPrerequisiteCount: countActions(hasActionPrerequisites),
    maxActionPrerequisiteCount: maxActionValue((stage) => stage.actionPrerequisiteCount),
    actionWithDependencyReasonCount: countActions(hasActionDependencyReason),
    actionBlockingOtherActionCount: countActions(blocksOtherActions),
    maxActionBlockedStageCount: maxActionValue((stage) => stage.actionBlockedStageCount),
    actionWithCompletionCriteriaCount: countActions(hasActionCompletionCriteria),
    totalActionCompletionCriteriaCount: sumActions((stage) => stage.actionCompletionCriteriaCount),
    maxActionCompletionCriteriaCount: maxActionValue((stage) => stage.actionCompletionCriteriaCount),
  };
  const actionEvidenceSummary = {
    actionRequiringEvidenceCount: countActions(requiresActionEvidence),
    totalActionEvidenceRequirementCount: sumActions((stage) => stage.actionEvidenceRequirementCount),
    maxActionEvidenceRequirementCount: maxActionValue((stage) => stage.actionEvidenceRequirementCount),
    localCommandEvidenceActionCount: countActions(targetsLocalCommandEvidence),
    localOutputEvidenceActionCount: countActions(targetsLocalOutputEvidence),
    targetRepoEvidenceActionCount: countActions(targetsTargetRepoEvidence),
    handoffRecordEvidenceActionCount: countActions(targetsHandoffRecordEvidence),
  };
  const actionEvidenceCaptureFieldSummary = {
    actionWithEvidenceCaptureFieldCount: countActions(hasActionEvidenceCaptureFields),
    actionWithRequiredEvidenceCaptureFieldCount: countActions(hasRequiredActionEvidenceCaptureFields),
    actionWithOptionalEvidenceCaptureFieldCount: countActions(hasOptionalActionEvidenceCaptureFields),
    totalActionEvidenceCaptureFieldCount: sumActions((stage) => stage.actionEvidenceCaptureFieldCount),
    totalRequiredActionEvidenceCaptureFieldCount: sumActions((stage) => stage.actionRequiredEvidenceCaptureFieldCount),
    totalOptionalActionEvidenceCaptureFieldCount: sumActions((stage) => stage.actionOptionalEvidenceCaptureFieldCount),
    maxActionEvidenceCaptureFieldCount: maxActionValue((stage) => stage.actionEvidenceCaptureFieldCount),
    textareaEvidenceCaptureFieldCount: countEvidenceCaptureFields(usesTextareaInput),
    textEvidenceCaptureFieldCount: countEvidenceCaptureFields(usesTextInput),
    filePathEvidenceCaptureFieldCount: countEvidenceCaptureFields(usesFilePathInput),
    listEvidenceCaptureFieldCount: countEvidenceCaptureFields(usesListInput),
    longTextEvidenceCaptureFieldCount: countEvidenceCaptureFields(capturesLongText),
    shortTextEvidenceCaptureFieldCount: countEvidenceCaptureFields(capturesShortText),
    filePathValueEvidenceCaptureFieldCount: countEvidenceCaptureFields(capturesFilePathValue),
    stringListEvidenceCaptureFieldCount: countEvidenceCaptureFields(capturesStringList),
    multiValueEvidenceCaptureFieldCount: countEvidenceCaptureFields(acceptsMultipleValues),
    singleValueEvidenceCaptureFieldCount: countEvidenceCaptureFields(acceptsSingleValue),
    emptyStringEvidenceCaptureFieldCount: countEvidenceCaptureFields(hasEmptyStringValue),
    emptyListEvidenceCaptureFieldCount: countEvidenceCaptureFields(hasEmptyListValue),
    placeholderEvidenceCaptureFieldCount: countEvidenceCaptureFields(hasPlaceholder),
    ariaLabelEvidenceCaptureFieldCount: countEvidenceCaptureFields(hasAriaLabel),
    helpTextEvidenceCaptureFieldCount: countEvidenceCaptureFields(hasHelpText),
    sectionedEvidenceCaptureFieldCount: countEvidenceCaptureFields(belongsToEvidenceCaptureSection),
    uniqueEvidenceCaptureSectionCount: uniqueActionListValueCount("actionEvidenceCaptureSectionKeys"),
    actionWithMultipleEvidenceCaptureSectionCount: countActions(hasMultipleEvidenceCaptureSections),
    maxActionEvidenceCaptureSectionCount: maxActionValue((stage) => stage.actionEvidenceCaptureSectionCount),
    payloadMappedEvidenceCaptureFieldCount: countEvidenceCaptureFields(mapsToPayloadPath),
  };
  const actionEvidenceCapturePayloadSummary = {
    uniqueEvidenceCapturePayloadNamespaceCount: uniqueActionListValueCount("actionEvidenceCapturePayloadNamespaces"),
    actionWithMultipleEvidenceCapturePayloadNamespaceCount: countActions(hasMultipleEvidenceCapturePayloadNamespaces),
    maxActionEvidenceCapturePayloadNamespaceCount: maxActionValue((stage) => stage.actionEvidenceCapturePayloadNamespaceCount),
    actionWithEvidenceCapturePayloadTemplateCount: countActions(hasEvidenceCapturePayloadTemplate),
    evidenceCapturePayloadTemplatePathCount: sumActions(payloadTemplatePathCount),
    maxActionEvidenceCapturePayloadTemplatePathCount: maxActionValue(payloadTemplatePathCount),
    actionWithEvidenceCapturePayloadBindingCount: countActionsWithItems("actionEvidenceCapturePayloadBindings"),
    evidenceCapturePayloadBindingCount: sumActionItems("actionEvidenceCapturePayloadBindings"),
    requiredEvidenceCapturePayloadBindingCount: countPayloadBindings(isRequiredItem),
    optionalEvidenceCapturePayloadBindingCount: countPayloadBindings(isOptionalItem),
    multiValueEvidenceCapturePayloadBindingCount: countPayloadBindings(acceptsMultipleValues),
  };
  const actionEvidenceCaptureValidationSummary = {
    actionWithEvidenceCaptureValidationSpecCount: countActionsWithItems("actionEvidenceCaptureValidationSpecs"),
    evidenceCaptureValidationSpecCount: sumActionItems("actionEvidenceCaptureValidationSpecs"),
    requiredEvidenceCaptureValidationSpecCount: countValidationSpecs(isRequiredItem),
    optionalEvidenceCaptureValidationSpecCount: countValidationSpecs(isOptionalItem),
    errorEvidenceCaptureValidationSpecCount: countValidationSpecs(isErrorValidationSpec),
    infoEvidenceCaptureValidationSpecCount: countValidationSpecs(isInfoValidationSpec),
    multiValueEvidenceCaptureValidationSpecCount: countValidationSpecs(acceptsMultipleValues),
  };
  const actionEvidenceCaptureInitialStateSummary = {
    actionWithEvidenceCaptureInitialValidationStateCount: countActionsWithItems("actionEvidenceCaptureInitialValidationStates"),
    evidenceCaptureInitialValidationStateCount: sumActionItems("actionEvidenceCaptureInitialValidationStates"),
    validInitialEvidenceCaptureStateCount: countInitialValidationStates(isValidInitialState),
    invalidInitialEvidenceCaptureStateCount: countInitialValidationStates(isInvalidInitialState),
    blockingInitialEvidenceCaptureStateCount: countInitialValidationStates(isBlockingInitialState),
    optionalEmptyInitialEvidenceCaptureStateCount: countInitialValidationStates(isOptionalEmptyInitialState),
    missingRequiredInitialEvidenceCaptureStateCount: countInitialValidationStates(isMissingRequiredInitialState),
    pristineInitialEvidenceCaptureStateCount: countInitialValidationStates(isPristineInitialState),
  };
  const actionEvidenceCaptureInitialDisplaySummary = {
    actionWithEvidenceCaptureInitialValidationDisplayMetadataCount: countActionsWithItems("actionEvidenceCaptureInitialValidationDisplayMetadata"),
    evidenceCaptureInitialValidationDisplayMetadataCount: sumActionItems("actionEvidenceCaptureInitialValidationDisplayMetadata"),
    dangerInitialEvidenceCaptureDisplayMetadataCount: countInitialDisplayRows(isDangerInitialDisplayRow),
    infoInitialEvidenceCaptureDisplayMetadataCount: countInitialDisplayRows(isInfoInitialDisplayRow),
    blockingInitialEvidenceCaptureDisplayMetadataCount: countInitialDisplayRows(isBlockingInitialDisplayRow),
    nonBlockingInitialEvidenceCaptureDisplayMetadataCount: countInitialDisplayRows(isNonBlockingInitialDisplayRow),
  };
  const actionEvidenceCaptureInitialValidationSummary = {
    actionWithEvidenceCaptureInitialValidationSummaryCount: countInitialValidationSummaries((summary) => summary.fieldCount > 0),
    blockedInitialEvidenceCaptureSummaryActionCount: countInitialValidationSummaries((summary) => summary.status === "blocked"),
    readyInitialEvidenceCaptureSummaryActionCount: countInitialValidationSummaries((summary) => summary.status === "ready"),
    completableInitialEvidenceCaptureSummaryActionCount: countInitialValidationSummaries((summary) => summary.canCompleteInitially),
    nonCompletableInitialEvidenceCaptureSummaryActionCount: countInitialValidationSummaries((summary) => !summary.canCompleteInitially),
    initialEvidenceCaptureSummaryBlockingFieldCount: sumInitialValidationSummaryValues((summary) => summary.blockingCount),
    initialEvidenceCaptureSummaryMissingRequiredFieldCount: sumInitialValidationSummaryValues((summary) => summary.missingRequiredCount),
    initialEvidenceCaptureSummaryOptionalEmptyFieldCount: sumInitialValidationSummaryValues((summary) => summary.optionalEmptyCount),
  };
  const actionEvidenceCaptureInitialChecklistSummary = {
    actionWithEvidenceCaptureInitialValidationChecklistCount: countActionsWithItems("actionEvidenceCaptureInitialValidationChecklist"),
    evidenceCaptureInitialValidationChecklistItemCount: sumActionItems("actionEvidenceCaptureInitialValidationChecklist"),
    checkedInitialEvidenceCaptureChecklistItemCount: countInitialChecklistItems(isInitiallyCheckedChecklistItem),
    uncheckedInitialEvidenceCaptureChecklistItemCount: countInitialChecklistItems(isInitiallyUncheckedChecklistItem),
    blockingInitialEvidenceCaptureChecklistItemCount: countInitialChecklistItems(blocksChecklistCompletion),
    nonBlockingInitialEvidenceCaptureChecklistItemCount: countInitialChecklistItems(doesNotBlockChecklistCompletion),
    requiredInitialEvidenceCaptureChecklistItemCount: countInitialChecklistItems(isRequiredItem),
    optionalInitialEvidenceCaptureChecklistItemCount: countInitialChecklistItems(isOptionalItem),
    actionWithEvidenceCaptureInitialValidationChecklistSummaryCount: countInitialChecklistSummaries((summary) => summary.itemCount > 0),
    blockedInitialEvidenceCaptureChecklistSummaryActionCount: countInitialChecklistSummaries((summary) => summary.status === "blocked"),
    readyInitialEvidenceCaptureChecklistSummaryActionCount: countInitialChecklistSummaries((summary) => summary.status === "ready"),
    completeInitialEvidenceCaptureChecklistSummaryActionCount: countInitialChecklistSummaries((summary) => summary.allCheckedInitially),
    incompleteInitialEvidenceCaptureChecklistSummaryActionCount: countInitialChecklistSummaries((summary) => !summary.allCheckedInitially),
    initialEvidenceCaptureChecklistSummaryCheckedItemCount: sumInitialChecklistSummaryValues((summary) => summary.checkedCount),
    initialEvidenceCaptureChecklistSummaryUncheckedItemCount: sumInitialChecklistSummaryValues((summary) => summary.uncheckedCount),
    initialEvidenceCaptureChecklistSummaryBlockingUncheckedItemCount: sumInitialChecklistSummaryValues((summary) => summary.blockingUncheckedCount),
  };
  const humanLineActionSummary = {
    humanLineCount: stageHumanLineSummary.count,
    humanLineByKeyCount: stageHumanLineSummary.byKeyCount,
    humanLineWithEvidenceProgressCount: stageHumanLineSummary.evidenceProgressCount,
    humanLineWithBlockedEvidenceProgressCount: stageHumanLineSummary.blockedEvidenceProgressCount,
    humanLineWithReadyEvidenceProgressCount: stageHumanLineSummary.readyEvidenceProgressCount,
    humanLineDisplayRowCount: stageHumanLineDisplayRowSummary.count,
    humanLineDisplayRowByKeyCount: stageHumanLineDisplayRowSummary.byKeyCount,
    humanLineDisplayRowWithEvidenceProgressCount: stageHumanLineDisplayRowSummary.evidenceProgressCount,
    humanLineDisplayRowWithBlockedEvidenceProgressCount: stageHumanLineDisplayRowSummary.blockedEvidenceProgressCount,
    humanLineDisplayRowWithReadyEvidenceProgressCount: stageHumanLineDisplayRowSummary.readyEvidenceProgressCount,
    humanLineDisplayRowReadyActionCount: stageHumanLineDisplayRowSummary.readyActionStatusCount,
    humanLineDisplayRowManualActionCount: stageHumanLineDisplayRowSummary.manualActionStatusCount,
  };
  const evidenceCaptureValidatedFieldSummary = {
    validatedEvidenceCaptureFieldCount: countEvidenceCaptureFields(hasValidationRule),
    requiredValidatedEvidenceCaptureFieldCount: countEvidenceCaptureFields(isRequiredValidatedField),
    optionalValidatedEvidenceCaptureFieldCount: countEvidenceCaptureFields(isOptionalValidatedField),
    minEvidenceCaptureFieldLengthTotal: sumActionItemValues(
      "actionEvidenceCaptureFields",
      (field) => field.minLength,
    ),
    maxEvidenceCaptureFieldMinLength: maxEvidenceCaptureFieldValue((field) => field.minLength),
  };
  const actionRunPolicySummary = {
    requiredActionCount: countBy(isRequiredStage),
    optionalActionCount: countBy(isOptionalStage),
    readOnlyActionCount: countBy(usesReadOnlyRunPolicy),
    localOutputActionCount: countBy(usesLocalOutputRunPolicy),
    outputFileActionCount: countBy(hasOutputFile),
    externalCallActionCount: countBy(callsExternalSystem),
    targetRepoMutationActionCount: countBy(mutatesTargetRepo),
  };
  const firstActionLookupSummary = {
    firstRequiredCommandStageKey: firstStageKey((stage) => isRequiredStage(stage) && hasCommands(stage)),
    firstLocalOutputStageKey: firstStageKey((stage) => stage.writesLocalFile),
    firstManualStageKey: firstStageKey(isManualStage),
    firstRequiredManualStageKey: firstStageKey((stage) => isRequiredStage(stage) && isManualStage(stage)),
    firstEvidenceStageKey: firstStageKey((stage) => stage.kind === "manual-reporting"),
    firstActionWithPrerequisiteKey: firstActionKey(hasActionPrerequisites),
    firstManualActionWithPrerequisiteKey: firstActionKey((action) => isManualAction(action) && hasActionPrerequisites(action)),
    firstEvidenceActionWithPrerequisiteKey: firstActionKey((action) => isManualEvidenceAction(action) && hasActionPrerequisites(action)),
    firstActionWithDependencyReasonKey: firstActionKey(hasActionDependencyReason),
    firstActionBlockingOtherActionKey: firstActionKey(blocksOtherActions),
    firstActionWithCompletionCriteriaKey: firstActionKey(hasActionCompletionCriteria),
    firstManualActionWithCompletionCriteriaKey: firstActionKey((action) => isManualAction(action) && hasActionCompletionCriteria(action)),
    firstActionRequiringEvidenceKey: firstActionKey(requiresActionEvidence),
    firstManualActionRequiringEvidenceKey: firstActionKey((action) => isManualAction(action) && requiresActionEvidence(action)),
    firstEvidenceRecordingActionKey: firstActionKey((action) => isManualEvidenceAction(action) && requiresActionEvidence(action)),
    firstTargetRepoEvidenceActionKey: firstActionKey(targetsTargetRepoEvidence),
    firstLocalOutputEvidenceActionKey: firstActionKey(targetsLocalOutputEvidence),
    firstActionWithEvidenceCaptureFieldKey: firstActionKey(hasActionEvidenceCaptureFields),
    firstActionWithOptionalEvidenceCaptureFieldKey: firstActionKey(hasOptionalActionEvidenceCaptureFields),
    firstManualActionWithEvidenceCaptureFieldKey: firstActionKey((action) => isManualAction(action) && hasActionEvidenceCaptureFields(action)),
    firstTextareaEvidenceCaptureActionKey: firstActionWithEvidenceCaptureField(usesTextareaInput),
    firstMultiValueEvidenceCaptureActionKey: firstActionWithEvidenceCaptureField(acceptsMultipleValues),
    firstValidationRuleEvidenceCaptureActionKey: firstActionWithEvidenceCaptureField(hasValidationRule),
  };
  const actionBoundarySummary = {
    requiresTargetRepoWork: stages.some((stage) => stage.kind === "manual-target-repo"),
    requiresEvidenceReturn: stages.some((stage) => stage.kind === "manual-reporting"),
    externalCalls: stages.some(callsExternalSystem),
    targetRepoMutation: stages.some(mutatesTargetRepo),
  };
  const actionSummary = {
    ...actionCountSummary,
    ...actionDependencySummary,
    ...actionEvidenceSummary,
    ...actionEvidenceCaptureFieldSummary,
    ...actionEvidenceCapturePayloadSummary,
    ...actionEvidenceCaptureValidationSummary,
    ...actionEvidenceCaptureInitialStateSummary,
    ...actionEvidenceCaptureInitialDisplaySummary,
    ...actionEvidenceCaptureInitialValidationSummary,
    ...actionEvidenceCaptureInitialChecklistSummary,
    ...humanLineActionSummary,
    ...evidenceCaptureValidatedFieldSummary,
    ...actionRunPolicySummary,
    ...nextActionSummary,
    ...firstActionLookupSummary,
    ...actionBoundarySummary,
  };
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
  const stageIdentityMaps = {
    stageKeys,
    stageByKey,
    stageLabelByKey,
    stageSummaryByKey,
  };
  const stageHumanLineMaps = {
    stageHumanLines,
    stageHumanLineByKey,
    stageHumanLineDisplayRows,
    stageHumanLineDisplayRowByKey,
    stageHumanLineDisplayRowKeysByActionStatus,
    stageHumanLineDisplayRowKeysByEvidenceProgressStatus,
    stageHumanLineDisplayRowSummary,
    stageHumanLineSummary,
  };
  const stageActionStatusMaps = {
    stageActionRows,
    stageActionTypeByKey,
    stageActionLabelByKey,
    stageActionInstructionsByKey,
    stageActionButtonLabelsByKey,
    stageActionAffordanceByKey,
    stageActionEnabledByKey,
    stageActionStatusByKey,
    stageActionStatusLabelsByKey,
    stageActionStatusToneByKey,
    stageActionDisabledReasonCodeByKey,
    stageActionDisabledReasonByKey,
  };
  const stageActionDependencyMaps = {
    stageActionPrerequisiteKeysByKey,
    stageActionPrerequisiteLabelsByKey,
    stageActionPrerequisiteCountByKey,
    stageActionHasPrerequisitesByKey,
    stageActionDependencyReasonCodeByKey,
    stageActionDependencyReasonByKey,
    stageActionBlockedStageKeysByKey,
    stageActionBlockedStageLabelsByKey,
    stageActionBlockedStageCountByKey,
    stageActionBlocksStagesByKey,
    stageActionCompletionCriteriaByKey,
    stageActionCompletionCriteriaCountByKey,
    stageActionHasCompletionCriteriaByKey,
  };
  const stageActionEvidenceMaps = {
    stageActionEvidenceRequirementsByKey,
    stageActionEvidenceRequirementCountByKey,
    stageActionRequiresEvidenceByKey,
    stageActionEvidenceTargetByKey,
    stageActionEvidenceTargetLabelByKey,
  };
  const stageActionEvidenceCaptureMaps = {
    stageActionEvidenceCaptureFieldsByKey,
    stageActionEvidenceCaptureFieldKeysByKey,
    stageActionEvidenceCaptureFieldLabelsByKey,
    stageActionEvidenceCaptureFieldPlaceholdersByKey,
    stageActionEvidenceCaptureFieldRequirementLabelsByKey,
    stageActionEvidenceCaptureFieldAriaLabelsByKey,
    stageActionEvidenceCaptureFieldHelpTextsByKey,
    stageActionEvidenceCaptureFieldSectionKeysByKey,
    stageActionEvidenceCaptureFieldSectionLabelsByKey,
    stageActionEvidenceCaptureSectionKeysByKey,
    stageActionEvidenceCaptureSectionLabelsByKey,
    stageActionEvidenceCaptureSectionCountByKey,
    stageActionEvidenceCaptureFieldPayloadNamespacesByKey,
    stageActionEvidenceCaptureFieldPayloadPathsByKey,
    stageActionEvidenceCapturePayloadNamespacesByKey,
    stageActionEvidenceCapturePayloadNamespaceCountByKey,
    stageActionEvidenceCapturePayloadTemplateByKey,
    stageActionEvidenceCapturePayloadFlatTemplateByKey,
    stageActionEvidenceCapturePayloadBindingsByKey,
    stageActionEvidenceCaptureValidationSpecsByKey,
    stageActionEvidenceCaptureInitialValidationStatesByKey,
    stageActionEvidenceCaptureInitialValidationDisplayMetadataByKey,
    stageActionEvidenceCaptureInitialValidationChecklistByKey,
    stageActionEvidenceCaptureInitialValidationChecklistSummaryByKey,
    stageActionEvidenceCaptureInitialValidationSummaryByKey,
    stageActionEvidenceCaptureFieldInputTypesByKey,
    stageActionEvidenceCaptureFieldValueShapesByKey,
    stageActionEvidenceCaptureFieldAcceptsMultipleByKey,
    stageActionEvidenceCaptureFieldDefaultValuesByKey,
    stageActionEvidenceCaptureFieldEmptyValuesByKey,
    stageActionEvidenceCaptureFieldValidationRulesByKey,
    stageActionEvidenceCaptureFieldMinLengthsByKey,
    stageActionEvidenceCaptureFieldExamplesByKey,
    stageActionEvidenceCaptureFieldValidationHintsByKey,
    stageActionRequiredEvidenceCaptureFieldKeysByKey,
    stageActionOptionalEvidenceCaptureFieldKeysByKey,
    stageActionEvidenceCaptureFieldCountByKey,
    stageActionRequiredEvidenceCaptureFieldCountByKey,
    stageActionOptionalEvidenceCaptureFieldCountByKey,
    stageActionHasEvidenceCaptureFieldsByKey,
  };
  const stageExecutionMaps = {
    stageKindByKey,
    stageRequiredByKey,
    stageRunPolicyByKey,
    stageSafetyLevelByKey,
    stageCommandCountByKey,
    stageCommandKeysByKey,
    stageCommandLabelsByKey,
    stageCommandStringsByKey,
    stageCommandArgsByKey,
    stageCommandRunPoliciesByKey,
    stageCommandSafetyLevelsByKey,
    stageOutputFilesByKey,
    stageHasCommandsByKey,
    stageManualByKey,
    stageWritesLocalFileByKey,
    stageExternalCallsByKey,
    stageTargetRepoMutationByKey,
    commandStageKeys,
    manualStageKeys,
  };
  const nextStepSummary = {
    nextStageKey,
    nextStage,
    ...nextStageIdentity,
    ...nextStageActionStatus,
    ...nextStageActionDependencies,
    ...nextStageActionEvidence,
    ...nextStageEvidenceCapture,
    ...nextStageCommandSummary,
    nextCommandKey,
    ...nextCommandSummary,
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
