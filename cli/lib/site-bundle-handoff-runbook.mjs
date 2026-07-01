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
  const pushSourceCommand = (key, label, commandKey, argsKey, policyKey, safetyKey) => {
    pushCommand({
      key,
      scope: "source-bundle",
      label,
      command: sourceBundle?.[commandKey] || "",
      commandArgs: sourceBundle?.[argsKey] || [],
      runPolicy: sourceBundle?.[policyKey] || "",
      safety: sourceBundle?.[safetyKey] || null,
      strict: Boolean(sourceBundle?.[safetyKey]?.strict),
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
    pushCommand({
      key: `task.${task.id}.handoff.${strict ? "strict" : "default"}`,
      scope: "task-handoff",
      label: `${strict ? "Strict " : ""}Task handoff: ${task.id}`,
      command: task[commandKey] || "",
      commandArgs: task[argsKey] || [],
      runPolicy: task[policyKey] || "",
      safety: task[safetyKey] || null,
      strict,
      taskId: task.id,
      taskNumber: Number.isInteger(task.number) ? task.number : null,
      outputFile: task.handoffOutFile || task[safetyKey]?.outputFile || "",
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
  const effectiveTaskId = effectiveTask?.id || "";
  const selectedTaskId = selectedTask?.id || "";
  const defaultTaskId = defaultTask?.id || "";
  return {
    version: 1,
    source: "bundle-handoff",
    commandCount: commands.length,
    sourceCommandCount: countBy((command) => command.scope === "source-bundle"),
    taskCommandCount: countBy((command) => command.scope === "task-handoff"),
    readOnlyCount: countBy((command) => command.runPolicy === "read-only"),
    localOutputFileCount: countBy((command) => command.runPolicy === "writes-local-file"),
    externalCallCount: countBy((command) => command.safety?.externalCalls === true),
    targetRepoMutationCount: countBy((command) => command.safety?.targetRepoMutation === true),
    requiresCleanWorkspaceCount: countBy((command) => command.safety?.requiresCleanWorkspace === true),
    requiresReviewBeforeMutationCount: countBy((command) => command.safety?.requiresReviewBeforeMutation === true),
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
    return {
      step,
      key,
      label,
      kind,
      required,
      commandKeys,
      commands: stageCommands,
      commandCount: stageCommands.length,
      runPolicy: manual ? "manual-target-repo" : (stageCommands[0]?.runPolicy || ""),
      safetyLevel: manual ? "operator-controlled-target-repo" : (stageCommands[0]?.safety?.safetyLevel || ""),
      writesLocalFile: stageCommands.some((command) => command.safety?.writesLocalFile === true),
      outputFiles: stageCommands.map((command) => command.outputFile).filter(Boolean),
      externalCalls: stageCommands.some((command) => command.safety?.externalCalls === true),
      targetRepoMutation: stageCommands.some((command) => command.safety?.targetRepoMutation === true),
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
  const commandStages = stages.filter((stage) => stage.commandCount > 0);
  const stageActionRows = stages.map((stage) => {
    const prerequisiteKeys = getStageActionPrerequisiteKeys(stage);
    const blockedStageKeys = getStageActionBlockedStageKeys(stage, stages);
    const completionCriteria = getStageActionCompletionCriteria(stage);
    const evidenceRequirements = getStageActionEvidenceRequirements(stage);
    const evidenceCaptureFields = getStageActionEvidenceCaptureFields(stage);
    const evidenceCaptureSectionKeys = uniqueValues(evidenceCaptureFields.map((field) => field.sectionKey));
    const evidenceCapturePayloadNamespaces = uniqueValues(evidenceCaptureFields.map((field) => field.payloadNamespace));
    const requiredEvidenceCaptureFields = evidenceCaptureFields.filter((field) => field.required);
    const optionalEvidenceCaptureFields = evidenceCaptureFields.filter((field) => !field.required);

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
      actionEvidenceRequirements: evidenceRequirements,
      actionEvidenceRequirementCount: evidenceRequirements.length,
      actionRequiresEvidence: evidenceRequirements.length > 0,
      actionEvidenceTarget: getStageActionEvidenceTarget(stage),
      actionEvidenceTargetLabel: getStageActionEvidenceTargetLabel(stage),
      actionEvidenceCaptureFields: evidenceCaptureFields,
      actionEvidenceCaptureFieldKeys: evidenceCaptureFields.map((field) => field.key),
      actionEvidenceCaptureFieldLabels: evidenceCaptureFields.map((field) => field.label),
      actionEvidenceCaptureFieldPlaceholders: evidenceCaptureFields.map((field) => field.placeholder),
      actionEvidenceCaptureFieldRequirementLabels: evidenceCaptureFields.map((field) => field.requirementLabel),
      actionEvidenceCaptureFieldAriaLabels: evidenceCaptureFields.map((field) => field.ariaLabel),
      actionEvidenceCaptureFieldHelpTexts: evidenceCaptureFields.map((field) => field.helpText),
      actionEvidenceCaptureFieldSectionKeys: evidenceCaptureFields.map((field) => field.sectionKey),
      actionEvidenceCaptureFieldSectionLabels: evidenceCaptureFields.map((field) => field.sectionLabel),
      actionEvidenceCaptureSectionKeys: evidenceCaptureSectionKeys,
      actionEvidenceCaptureSectionLabels: uniqueValues(evidenceCaptureFields.map((field) => field.sectionLabel)),
      actionEvidenceCaptureSectionCount: evidenceCaptureSectionKeys.length,
      actionEvidenceCaptureFieldPayloadNamespaces: evidenceCaptureFields.map((field) => field.payloadNamespace),
      actionEvidenceCaptureFieldPayloadPaths: evidenceCaptureFields.map((field) => field.payloadPath),
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
      actionEvidenceCaptureFieldInputTypes: evidenceCaptureFields.map((field) => field.inputType),
      actionEvidenceCaptureFieldValueShapes: evidenceCaptureFields.map((field) => field.valueShape),
      actionEvidenceCaptureFieldAcceptsMultiple: evidenceCaptureFields.map((field) => field.acceptsMultiple),
      actionEvidenceCaptureFieldDefaultValues: evidenceCaptureFields.map((field) => field.defaultValue),
      actionEvidenceCaptureFieldEmptyValues: evidenceCaptureFields.map((field) => field.emptyValue),
      actionEvidenceCaptureFieldValidationRules: evidenceCaptureFields.map((field) => field.validationRule),
      actionEvidenceCaptureFieldMinLengths: evidenceCaptureFields.map((field) => field.minLength),
      actionEvidenceCaptureFieldExamples: evidenceCaptureFields.map((field) => field.example),
      actionEvidenceCaptureFieldValidationHints: evidenceCaptureFields.map((field) => field.validationHint),
      actionRequiredEvidenceCaptureFieldKeys: requiredEvidenceCaptureFields.map((field) => field.key),
      actionOptionalEvidenceCaptureFieldKeys: optionalEvidenceCaptureFields.map((field) => field.key),
      actionEvidenceCaptureFieldCount: evidenceCaptureFields.length,
      actionRequiredEvidenceCaptureFieldCount: requiredEvidenceCaptureFields.length,
      actionOptionalEvidenceCaptureFieldCount: optionalEvidenceCaptureFields.length,
      actionHasEvidenceCaptureFields: evidenceCaptureFields.length > 0,
      required: stage.required,
      runPolicy: stage.runPolicy,
      safetyLevel: stage.safetyLevel,
      commandKeys: stage.commandKeys,
      commandCount: stage.commandCount,
      outputFiles: stage.outputFiles,
      manual: stage.commandCount === 0,
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
      manual: stage.commandCount === 0,
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
    ready: displayRowKeysBy((row) => row.actionStatus === "ready"),
    optional: displayRowKeysBy((row) => row.actionStatus === "optional"),
    manual: displayRowKeysBy((row) => row.actionStatus === "manual"),
    blocked: displayRowKeysBy((row) => row.actionStatus === "blocked"),
  };
  const stageHumanLineDisplayRowKeysByEvidenceProgressStatus = {
    blocked: displayRowKeysBy((row) => row.evidenceProgressStatus === "blocked"),
    ready: displayRowKeysBy((row) => row.evidenceProgressStatus === "ready"),
  };
  const stageHumanLineDisplayRowSummary = {
    count: stageHumanLineDisplayRows.length,
    byKeyCount: Object.keys(stageHumanLineDisplayRowByKey).length,
    requiredCount: countDisplayRows((row) => row.required),
    optionalCount: countDisplayRows((row) => !row.required),
    commandCount: countDisplayRows((row) => row.commandCount > 0),
    manualCount: countDisplayRows((row) => row.manual),
    readyActionStatusCount: countDisplayRows((row) => row.actionStatus === "ready"),
    optionalActionStatusCount: countDisplayRows((row) => row.actionStatus === "optional"),
    manualActionStatusCount: countDisplayRows((row) => row.actionStatus === "manual"),
    blockedActionStatusCount: countDisplayRows((row) => row.actionStatus === "blocked"),
    evidenceProgressCount: countDisplayRows((row) => row.hasEvidenceProgress),
    blockedEvidenceProgressCount: countDisplayRows((row) => row.evidenceProgressStatus === "blocked"),
    readyEvidenceProgressCount: countDisplayRows((row) => row.evidenceProgressStatus === "ready"),
    firstRowKey: stageHumanLineDisplayRows[0]?.key || "",
    firstReadyActionRowKey: firstDisplayRowKey((row) => row.actionStatus === "ready"),
    firstOptionalActionRowKey: firstDisplayRowKey((row) => row.actionStatus === "optional"),
    firstManualActionRowKey: firstDisplayRowKey((row) => row.actionStatus === "manual"),
    firstBlockedEvidenceProgressRowKey: firstDisplayRowKey((row) => row.evidenceProgressStatus === "blocked"),
    firstReadyEvidenceProgressRowKey: firstDisplayRowKey((row) => row.evidenceProgressStatus === "ready"),
  };
  const stageHumanLineSummary = {
    count: stageHumanLines.length,
    byKeyCount: Object.keys(stageHumanLineByKey).length,
    requiredCount: countBy((stage) => stage.required),
    optionalCount: countBy((stage) => !stage.required),
    commandCount: countBy((stage) => stage.commandCount > 0),
    manualCount: countBy((stage) => stage.commandCount === 0),
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
  const stageHasCommandsByKey = byKey(stages, (stage) => stage.commandCount > 0);
  const stageManualByKey = byKey(stages, (stage) => stage.commandCount === 0);
  const stageWritesLocalFileByKey = stageFieldByKey("writesLocalFile");
  const stageExternalCallsByKey = stageFieldByKey("externalCalls");
  const stageTargetRepoMutationByKey = stageFieldByKey("targetRepoMutation");
  const commandStageKeys = stageKeysBy((stage) => stage.commandCount > 0);
  const manualStageKeys = stageKeysBy((stage) => stage.commandCount === 0);
  const nextStageKey = "verifySourceBundle";
  const nextCommandKey = "source.bundleCheck.strict";
  const nextStage = stageByKey[nextStageKey] || null;
  const nextStageActionRow = stageActionRows.find((stage) => stage.key === nextStageKey) || null;
  const nextCommandEntry = commandByKey.get(nextCommandKey) || null;
  const nextActionValue = (field, fallback = "") => nextStageActionRow?.[field] || fallback;
  const nextActionList = (field) => nextActionValue(field, []);
  const nextActionObject = (field) => nextActionValue(field, {});
  const nextActionCount = (field) => nextActionValue(field, 0);
  const nextActionFlag = (field) => nextStageActionRow?.[field] === true;
  const nextStageValue = (field, fallback = "") => nextStage?.[field] || fallback;
  const nextStageCommandList = (getValue) => nextStage?.commands?.map(getValue) || [];
  const nextActionEvidenceProgressSummary = nextActionObject("actionEvidenceCaptureInitialValidationChecklistSummary");
  const sumActions = (getValue) => stageActionRows.reduce((sum, stage) => sum + getValue(stage), 0);
  const maxActionValue = (getValue) => Math.max(0, ...stageActionRows.map(getValue));
  const countEvidenceCaptureFields = (predicate) => sumActions(
    (stage) => stage.actionEvidenceCaptureFields.filter(predicate).length,
  );
  const countPayloadBindings = (predicate) => sumActions(
    (stage) => stage.actionEvidenceCapturePayloadBindings.filter(predicate).length,
  );
  const countValidationSpecs = (predicate) => sumActions(
    (stage) => stage.actionEvidenceCaptureValidationSpecs.filter(predicate).length,
  );
  const countInitialValidationStates = (predicate) => sumActions(
    (stage) => stage.actionEvidenceCaptureInitialValidationStates.filter(predicate).length,
  );
  const countInitialDisplayRows = (predicate) => sumActions(
    (stage) => stage.actionEvidenceCaptureInitialValidationDisplayMetadata.filter(predicate).length,
  );
  const countInitialChecklistItems = (predicate) => sumActions(
    (stage) => stage.actionEvidenceCaptureInitialValidationChecklist.filter(predicate).length,
  );
  const maxEvidenceCaptureFieldValue = (getValue) => Math.max(
    0,
    ...stageActionRows.flatMap((stage) => stage.actionEvidenceCaptureFields.map(getValue)),
  );
  const firstStageKey = (predicate) => stages.find(predicate)?.key || "";
  const actionSummary = {
    totalActionCount: stages.length,
    commandActionCount: commandStages.length,
    manualActionCount: countBy((stage) => stage.commandCount === 0),
    enabledActionCount: countActions((stage) => stage.actionEnabled),
    disabledActionCount: countActions((stage) => !stage.actionEnabled),
    manualDisabledActionCount: countActions((stage) => !stage.actionEnabled && stage.manual),
    actionWithPrerequisiteCount: countActions((stage) => stage.actionHasPrerequisites),
    maxActionPrerequisiteCount: maxActionValue((stage) => stage.actionPrerequisiteCount),
    actionWithDependencyReasonCount: countActions((stage) => stage.actionDependencyReasonCode),
    actionBlockingOtherActionCount: countActions((stage) => stage.actionBlocksStages),
    maxActionBlockedStageCount: maxActionValue((stage) => stage.actionBlockedStageCount),
    actionWithCompletionCriteriaCount: countActions((stage) => stage.actionHasCompletionCriteria),
    totalActionCompletionCriteriaCount: sumActions((stage) => stage.actionCompletionCriteriaCount),
    maxActionCompletionCriteriaCount: maxActionValue((stage) => stage.actionCompletionCriteriaCount),
    actionRequiringEvidenceCount: countActions((stage) => stage.actionRequiresEvidence),
    totalActionEvidenceRequirementCount: sumActions((stage) => stage.actionEvidenceRequirementCount),
    maxActionEvidenceRequirementCount: maxActionValue((stage) => stage.actionEvidenceRequirementCount),
    localCommandEvidenceActionCount: countActions((stage) => stage.actionEvidenceTarget === "local-command-output"),
    localOutputEvidenceActionCount: countActions((stage) => stage.actionEvidenceTarget === "local-output-file"),
    targetRepoEvidenceActionCount: countActions((stage) => stage.actionEvidenceTarget === "target-repo-working-tree"),
    handoffRecordEvidenceActionCount: countActions((stage) => stage.actionEvidenceTarget === "handoff-evidence-record"),
    actionWithEvidenceCaptureFieldCount: countActions((stage) => stage.actionHasEvidenceCaptureFields),
    actionWithRequiredEvidenceCaptureFieldCount: countActions((stage) => stage.actionRequiredEvidenceCaptureFieldCount > 0),
    actionWithOptionalEvidenceCaptureFieldCount: countActions((stage) => stage.actionOptionalEvidenceCaptureFieldCount > 0),
    totalActionEvidenceCaptureFieldCount: sumActions((stage) => stage.actionEvidenceCaptureFieldCount),
    totalRequiredActionEvidenceCaptureFieldCount: sumActions((stage) => stage.actionRequiredEvidenceCaptureFieldCount),
    totalOptionalActionEvidenceCaptureFieldCount: sumActions((stage) => stage.actionOptionalEvidenceCaptureFieldCount),
    maxActionEvidenceCaptureFieldCount: maxActionValue((stage) => stage.actionEvidenceCaptureFieldCount),
    textareaEvidenceCaptureFieldCount: countEvidenceCaptureFields((field) => field.inputType === "textarea"),
    textEvidenceCaptureFieldCount: countEvidenceCaptureFields((field) => field.inputType === "text"),
    filePathEvidenceCaptureFieldCount: countEvidenceCaptureFields((field) => field.inputType === "file-path"),
    listEvidenceCaptureFieldCount: countEvidenceCaptureFields((field) => field.inputType === "list"),
    longTextEvidenceCaptureFieldCount: countEvidenceCaptureFields((field) => field.valueShape === "long-text"),
    shortTextEvidenceCaptureFieldCount: countEvidenceCaptureFields((field) => field.valueShape === "short-text"),
    filePathValueEvidenceCaptureFieldCount: countEvidenceCaptureFields((field) => field.valueShape === "file-path"),
    stringListEvidenceCaptureFieldCount: countEvidenceCaptureFields((field) => field.valueShape === "string-list"),
    multiValueEvidenceCaptureFieldCount: countEvidenceCaptureFields((field) => field.acceptsMultiple),
    singleValueEvidenceCaptureFieldCount: countEvidenceCaptureFields((field) => !field.acceptsMultiple),
    emptyStringEvidenceCaptureFieldCount: countEvidenceCaptureFields((field) => field.emptyValue === ""),
    emptyListEvidenceCaptureFieldCount: countEvidenceCaptureFields((field) => Array.isArray(field.emptyValue)),
    placeholderEvidenceCaptureFieldCount: countEvidenceCaptureFields((field) => field.placeholder),
    ariaLabelEvidenceCaptureFieldCount: countEvidenceCaptureFields((field) => field.ariaLabel),
    helpTextEvidenceCaptureFieldCount: countEvidenceCaptureFields((field) => field.helpText),
    sectionedEvidenceCaptureFieldCount: countEvidenceCaptureFields((field) => field.sectionKey),
    uniqueEvidenceCaptureSectionCount: uniqueValues(stageActionRows.flatMap((stage) => stage.actionEvidenceCaptureSectionKeys)).length,
    actionWithMultipleEvidenceCaptureSectionCount: countActions((stage) => stage.actionEvidenceCaptureSectionCount > 1),
    maxActionEvidenceCaptureSectionCount: maxActionValue((stage) => stage.actionEvidenceCaptureSectionCount),
    payloadMappedEvidenceCaptureFieldCount: countEvidenceCaptureFields((field) => field.payloadPath),
    uniqueEvidenceCapturePayloadNamespaceCount: uniqueValues(stageActionRows.flatMap((stage) => stage.actionEvidenceCapturePayloadNamespaces)).length,
    actionWithMultipleEvidenceCapturePayloadNamespaceCount: countActions((stage) => stage.actionEvidenceCapturePayloadNamespaceCount > 1),
    maxActionEvidenceCapturePayloadNamespaceCount: maxActionValue((stage) => stage.actionEvidenceCapturePayloadNamespaceCount),
    actionWithEvidenceCapturePayloadTemplateCount: countActions((stage) => Object.keys(stage.actionEvidenceCapturePayloadFlatTemplate).length > 0),
    evidenceCapturePayloadTemplatePathCount: sumActions((stage) => Object.keys(stage.actionEvidenceCapturePayloadFlatTemplate).length),
    maxActionEvidenceCapturePayloadTemplatePathCount: maxActionValue((stage) => Object.keys(stage.actionEvidenceCapturePayloadFlatTemplate).length),
    actionWithEvidenceCapturePayloadBindingCount: countActions((stage) => stage.actionEvidenceCapturePayloadBindings.length > 0),
    evidenceCapturePayloadBindingCount: sumActions((stage) => stage.actionEvidenceCapturePayloadBindings.length),
    requiredEvidenceCapturePayloadBindingCount: countPayloadBindings((binding) => binding.required),
    optionalEvidenceCapturePayloadBindingCount: countPayloadBindings((binding) => !binding.required),
    multiValueEvidenceCapturePayloadBindingCount: countPayloadBindings((binding) => binding.acceptsMultiple),
    actionWithEvidenceCaptureValidationSpecCount: countActions((stage) => stage.actionEvidenceCaptureValidationSpecs.length > 0),
    evidenceCaptureValidationSpecCount: sumActions((stage) => stage.actionEvidenceCaptureValidationSpecs.length),
    requiredEvidenceCaptureValidationSpecCount: countValidationSpecs((spec) => spec.required),
    optionalEvidenceCaptureValidationSpecCount: countValidationSpecs((spec) => !spec.required),
    errorEvidenceCaptureValidationSpecCount: countValidationSpecs((spec) => spec.severity === "error"),
    infoEvidenceCaptureValidationSpecCount: countValidationSpecs((spec) => spec.severity === "info"),
    multiValueEvidenceCaptureValidationSpecCount: countValidationSpecs((spec) => spec.acceptsMultiple),
    actionWithEvidenceCaptureInitialValidationStateCount: countActions((stage) => stage.actionEvidenceCaptureInitialValidationStates.length > 0),
    evidenceCaptureInitialValidationStateCount: sumActions((stage) => stage.actionEvidenceCaptureInitialValidationStates.length),
    validInitialEvidenceCaptureStateCount: countInitialValidationStates((state) => state.valid),
    invalidInitialEvidenceCaptureStateCount: countInitialValidationStates((state) => !state.valid),
    blockingInitialEvidenceCaptureStateCount: countInitialValidationStates((state) => state.blocking),
    optionalEmptyInitialEvidenceCaptureStateCount: countInitialValidationStates((state) => state.status === "optional-empty"),
    missingRequiredInitialEvidenceCaptureStateCount: countInitialValidationStates((state) => state.status === "missing-required"),
    pristineInitialEvidenceCaptureStateCount: countInitialValidationStates((state) => !state.dirty && !state.touched),
    actionWithEvidenceCaptureInitialValidationDisplayMetadataCount: countActions((stage) => stage.actionEvidenceCaptureInitialValidationDisplayMetadata.length > 0),
    evidenceCaptureInitialValidationDisplayMetadataCount: sumActions((stage) => stage.actionEvidenceCaptureInitialValidationDisplayMetadata.length),
    dangerInitialEvidenceCaptureDisplayMetadataCount: countInitialDisplayRows((display) => display.statusTone === "danger"),
    infoInitialEvidenceCaptureDisplayMetadataCount: countInitialDisplayRows((display) => display.statusTone === "info"),
    blockingInitialEvidenceCaptureDisplayMetadataCount: countInitialDisplayRows((display) => display.blocking),
    nonBlockingInitialEvidenceCaptureDisplayMetadataCount: countInitialDisplayRows((display) => !display.blocking),
    actionWithEvidenceCaptureInitialValidationSummaryCount: countActions((stage) => stage.actionEvidenceCaptureInitialValidationSummary.fieldCount > 0),
    blockedInitialEvidenceCaptureSummaryActionCount: countActions((stage) => stage.actionEvidenceCaptureInitialValidationSummary.status === "blocked"),
    readyInitialEvidenceCaptureSummaryActionCount: countActions((stage) => stage.actionEvidenceCaptureInitialValidationSummary.status === "ready"),
    completableInitialEvidenceCaptureSummaryActionCount: countActions((stage) => stage.actionEvidenceCaptureInitialValidationSummary.canCompleteInitially),
    nonCompletableInitialEvidenceCaptureSummaryActionCount: countActions((stage) => !stage.actionEvidenceCaptureInitialValidationSummary.canCompleteInitially),
    initialEvidenceCaptureSummaryBlockingFieldCount: sumActions((stage) => stage.actionEvidenceCaptureInitialValidationSummary.blockingCount),
    initialEvidenceCaptureSummaryMissingRequiredFieldCount: sumActions((stage) => stage.actionEvidenceCaptureInitialValidationSummary.missingRequiredCount),
    initialEvidenceCaptureSummaryOptionalEmptyFieldCount: sumActions((stage) => stage.actionEvidenceCaptureInitialValidationSummary.optionalEmptyCount),
    actionWithEvidenceCaptureInitialValidationChecklistCount: countActions((stage) => stage.actionEvidenceCaptureInitialValidationChecklist.length > 0),
    evidenceCaptureInitialValidationChecklistItemCount: sumActions((stage) => stage.actionEvidenceCaptureInitialValidationChecklist.length),
    checkedInitialEvidenceCaptureChecklistItemCount: countInitialChecklistItems((item) => item.checkedInitially),
    uncheckedInitialEvidenceCaptureChecklistItemCount: countInitialChecklistItems((item) => !item.checkedInitially),
    blockingInitialEvidenceCaptureChecklistItemCount: countInitialChecklistItems((item) => item.completionBlocking),
    nonBlockingInitialEvidenceCaptureChecklistItemCount: countInitialChecklistItems((item) => !item.completionBlocking),
    requiredInitialEvidenceCaptureChecklistItemCount: countInitialChecklistItems((item) => item.required),
    optionalInitialEvidenceCaptureChecklistItemCount: countInitialChecklistItems((item) => !item.required),
    actionWithEvidenceCaptureInitialValidationChecklistSummaryCount: countActions((stage) => stage.actionEvidenceCaptureInitialValidationChecklistSummary.itemCount > 0),
    blockedInitialEvidenceCaptureChecklistSummaryActionCount: countActions((stage) => stage.actionEvidenceCaptureInitialValidationChecklistSummary.status === "blocked"),
    readyInitialEvidenceCaptureChecklistSummaryActionCount: countActions((stage) => stage.actionEvidenceCaptureInitialValidationChecklistSummary.status === "ready"),
    completeInitialEvidenceCaptureChecklistSummaryActionCount: countActions((stage) => stage.actionEvidenceCaptureInitialValidationChecklistSummary.allCheckedInitially),
    incompleteInitialEvidenceCaptureChecklistSummaryActionCount: countActions((stage) => !stage.actionEvidenceCaptureInitialValidationChecklistSummary.allCheckedInitially),
    initialEvidenceCaptureChecklistSummaryCheckedItemCount: sumActions((stage) => stage.actionEvidenceCaptureInitialValidationChecklistSummary.checkedCount),
    initialEvidenceCaptureChecklistSummaryUncheckedItemCount: sumActions((stage) => stage.actionEvidenceCaptureInitialValidationChecklistSummary.uncheckedCount),
    initialEvidenceCaptureChecklistSummaryBlockingUncheckedItemCount: sumActions((stage) => stage.actionEvidenceCaptureInitialValidationChecklistSummary.blockingUncheckedCount),
    humanLineCount: stageHumanLineSummary.count,
    humanLineByKeyCount: stageHumanLineSummary.byKeyCount,
    humanLineWithEvidenceProgressCount: stageHumanLineSummary.evidenceProgressCount,
    humanLineWithBlockedEvidenceProgressCount: stageHumanLineSummary.blockedEvidenceProgressCount,
    humanLineWithReadyEvidenceProgressCount: stageHumanLineSummary.readyEvidenceProgressCount,
    humanLineDisplayRowCount: stageHumanLineDisplayRows.length,
    humanLineDisplayRowByKeyCount: Object.keys(stageHumanLineDisplayRowByKey).length,
    humanLineDisplayRowWithEvidenceProgressCount: stageHumanLineDisplayRowSummary.evidenceProgressCount,
    humanLineDisplayRowWithBlockedEvidenceProgressCount: stageHumanLineDisplayRowSummary.blockedEvidenceProgressCount,
    humanLineDisplayRowWithReadyEvidenceProgressCount: stageHumanLineDisplayRowSummary.readyEvidenceProgressCount,
    humanLineDisplayRowReadyActionCount: stageHumanLineDisplayRowSummary.readyActionStatusCount,
    humanLineDisplayRowManualActionCount: stageHumanLineDisplayRowSummary.manualActionStatusCount,
    validatedEvidenceCaptureFieldCount: countEvidenceCaptureFields((field) => field.validationRule),
    requiredValidatedEvidenceCaptureFieldCount: countEvidenceCaptureFields((field) => field.required && field.validationRule),
    optionalValidatedEvidenceCaptureFieldCount: countEvidenceCaptureFields((field) => !field.required && field.validationRule),
    minEvidenceCaptureFieldLengthTotal: sumActions(
      (stage) => stage.actionEvidenceCaptureFields.reduce((fieldSum, field) => fieldSum + field.minLength, 0),
    ),
    maxEvidenceCaptureFieldMinLength: maxEvidenceCaptureFieldValue((field) => field.minLength),
    requiredActionCount: countBy((stage) => stage.required),
    optionalActionCount: countBy((stage) => !stage.required),
    readOnlyActionCount: countBy((stage) => stage.runPolicy === "read-only"),
    localOutputActionCount: countBy((stage) => stage.runPolicy === "writes-local-file"),
    outputFileActionCount: countBy((stage) => stage.outputFiles.length > 0),
    externalCallActionCount: countBy((stage) => stage.externalCalls),
    targetRepoMutationActionCount: countBy((stage) => stage.targetRepoMutation),
    nextActionKey: nextStageKey,
    nextActionType: nextActionValue("actionType"),
    nextActionLabel: nextActionValue("actionLabel"),
    nextActionEnabled: nextActionFlag("actionEnabled"),
    nextActionStatus: nextActionValue("actionStatus"),
    nextActionStatusLabel: nextActionValue("actionStatusLabel"),
    nextActionStatusTone: nextActionValue("actionStatusTone"),
    nextActionDisabledReasonCode: nextActionValue("actionDisabledReasonCode"),
    nextActionPrerequisiteKeys: nextActionList("actionPrerequisiteKeys"),
    nextActionPrerequisiteLabels: nextActionList("actionPrerequisiteLabels"),
    nextActionPrerequisiteCount: nextActionCount("actionPrerequisiteCount"),
    nextActionHasPrerequisites: nextActionFlag("actionHasPrerequisites"),
    nextActionDependencyReasonCode: nextActionValue("actionDependencyReasonCode"),
    nextActionDependencyReason: nextActionValue("actionDependencyReason"),
    nextActionBlockedStageKeys: nextActionList("actionBlockedStageKeys"),
    nextActionBlockedStageLabels: nextActionList("actionBlockedStageLabels"),
    nextActionBlockedStageCount: nextActionCount("actionBlockedStageCount"),
    nextActionBlocksStages: nextActionFlag("actionBlocksStages"),
    nextActionCompletionCriteria: nextActionList("actionCompletionCriteria"),
    nextActionCompletionCriteriaCount: nextActionCount("actionCompletionCriteriaCount"),
    nextActionHasCompletionCriteria: nextActionFlag("actionHasCompletionCriteria"),
    nextActionEvidenceRequirements: nextActionList("actionEvidenceRequirements"),
    nextActionEvidenceRequirementCount: nextActionCount("actionEvidenceRequirementCount"),
    nextActionRequiresEvidence: nextActionFlag("actionRequiresEvidence"),
    nextActionEvidenceTarget: nextActionValue("actionEvidenceTarget"),
    nextActionEvidenceTargetLabel: nextActionValue("actionEvidenceTargetLabel"),
    nextActionEvidenceCaptureFields: nextActionList("actionEvidenceCaptureFields"),
    nextActionEvidenceCaptureFieldKeys: nextActionList("actionEvidenceCaptureFieldKeys"),
    nextActionEvidenceCaptureFieldLabels: nextActionList("actionEvidenceCaptureFieldLabels"),
    nextActionEvidenceCaptureFieldPlaceholders: nextActionList("actionEvidenceCaptureFieldPlaceholders"),
    nextActionEvidenceCaptureFieldRequirementLabels: nextActionList("actionEvidenceCaptureFieldRequirementLabels"),
    nextActionEvidenceCaptureFieldAriaLabels: nextActionList("actionEvidenceCaptureFieldAriaLabels"),
    nextActionEvidenceCaptureFieldHelpTexts: nextActionList("actionEvidenceCaptureFieldHelpTexts"),
    nextActionEvidenceCaptureFieldSectionKeys: nextActionList("actionEvidenceCaptureFieldSectionKeys"),
    nextActionEvidenceCaptureFieldSectionLabels: nextActionList("actionEvidenceCaptureFieldSectionLabels"),
    nextActionEvidenceCaptureSectionKeys: nextActionList("actionEvidenceCaptureSectionKeys"),
    nextActionEvidenceCaptureSectionLabels: nextActionList("actionEvidenceCaptureSectionLabels"),
    nextActionEvidenceCaptureSectionCount: nextActionCount("actionEvidenceCaptureSectionCount"),
    nextActionEvidenceCaptureFieldPayloadNamespaces: nextActionList("actionEvidenceCaptureFieldPayloadNamespaces"),
    nextActionEvidenceCaptureFieldPayloadPaths: nextActionList("actionEvidenceCaptureFieldPayloadPaths"),
    nextActionEvidenceCapturePayloadNamespaces: nextActionList("actionEvidenceCapturePayloadNamespaces"),
    nextActionEvidenceCapturePayloadNamespaceCount: nextActionCount("actionEvidenceCapturePayloadNamespaceCount"),
    nextActionEvidenceCapturePayloadTemplate: nextActionObject("actionEvidenceCapturePayloadTemplate"),
    nextActionEvidenceCapturePayloadFlatTemplate: nextActionObject("actionEvidenceCapturePayloadFlatTemplate"),
    nextActionEvidenceCapturePayloadBindings: nextActionList("actionEvidenceCapturePayloadBindings"),
    nextActionEvidenceCaptureValidationSpecs: nextActionList("actionEvidenceCaptureValidationSpecs"),
    nextActionEvidenceCaptureInitialValidationStates: nextActionList("actionEvidenceCaptureInitialValidationStates"),
    nextActionEvidenceCaptureInitialValidationDisplayMetadata: nextActionList("actionEvidenceCaptureInitialValidationDisplayMetadata"),
    nextActionEvidenceCaptureInitialValidationChecklist: nextActionList("actionEvidenceCaptureInitialValidationChecklist"),
    nextActionEvidenceCaptureInitialValidationChecklistSummary: nextActionObject("actionEvidenceCaptureInitialValidationChecklistSummary"),
    nextActionEvidenceCaptureInitialValidationSummary: nextActionObject("actionEvidenceCaptureInitialValidationSummary"),
    nextActionEvidenceCaptureFieldInputTypes: nextActionList("actionEvidenceCaptureFieldInputTypes"),
    nextActionEvidenceCaptureFieldValueShapes: nextActionList("actionEvidenceCaptureFieldValueShapes"),
    nextActionEvidenceCaptureFieldAcceptsMultiple: nextActionList("actionEvidenceCaptureFieldAcceptsMultiple"),
    nextActionEvidenceCaptureFieldDefaultValues: nextActionList("actionEvidenceCaptureFieldDefaultValues"),
    nextActionEvidenceCaptureFieldEmptyValues: nextActionList("actionEvidenceCaptureFieldEmptyValues"),
    nextActionEvidenceCaptureFieldValidationRules: nextActionList("actionEvidenceCaptureFieldValidationRules"),
    nextActionEvidenceCaptureFieldMinLengths: nextActionList("actionEvidenceCaptureFieldMinLengths"),
    nextActionEvidenceCaptureFieldExamples: nextActionList("actionEvidenceCaptureFieldExamples"),
    nextActionEvidenceCaptureFieldValidationHints: nextActionList("actionEvidenceCaptureFieldValidationHints"),
    nextActionRequiredEvidenceCaptureFieldKeys: nextActionList("actionRequiredEvidenceCaptureFieldKeys"),
    nextActionOptionalEvidenceCaptureFieldKeys: nextActionList("actionOptionalEvidenceCaptureFieldKeys"),
    nextActionEvidenceCaptureFieldCount: nextActionCount("actionEvidenceCaptureFieldCount"),
    nextActionRequiredEvidenceCaptureFieldCount: nextActionCount("actionRequiredEvidenceCaptureFieldCount"),
    nextActionOptionalEvidenceCaptureFieldCount: nextActionCount("actionOptionalEvidenceCaptureFieldCount"),
    nextActionHasEvidenceCaptureFields: nextActionFlag("actionHasEvidenceCaptureFields"),
    nextActionRunPolicy: nextStageValue("runPolicy"),
    nextActionSafetyLevel: nextStageValue("safetyLevel"),
    firstRequiredCommandStageKey: firstStageKey((stage) => stage.required && stage.commandCount > 0),
    firstLocalOutputStageKey: firstStageKey((stage) => stage.writesLocalFile),
    firstManualStageKey: firstStageKey((stage) => stage.commandCount === 0),
    firstRequiredManualStageKey: firstStageKey((stage) => stage.required && stage.commandCount === 0),
    firstEvidenceStageKey: firstStageKey((stage) => stage.kind === "manual-reporting"),
    firstActionWithPrerequisiteKey: firstActionKey((stage) => stage.actionHasPrerequisites),
    firstManualActionWithPrerequisiteKey: firstActionKey((stage) => stage.manual && stage.actionHasPrerequisites),
    firstEvidenceActionWithPrerequisiteKey: firstActionKey((stage) => stage.actionType === "manual-evidence" && stage.actionHasPrerequisites),
    firstActionWithDependencyReasonKey: firstActionKey((stage) => stage.actionDependencyReasonCode),
    firstActionBlockingOtherActionKey: firstActionKey((stage) => stage.actionBlocksStages),
    firstActionWithCompletionCriteriaKey: firstActionKey((stage) => stage.actionHasCompletionCriteria),
    firstManualActionWithCompletionCriteriaKey: firstActionKey((stage) => stage.manual && stage.actionHasCompletionCriteria),
    firstActionRequiringEvidenceKey: firstActionKey((stage) => stage.actionRequiresEvidence),
    firstManualActionRequiringEvidenceKey: firstActionKey((stage) => stage.manual && stage.actionRequiresEvidence),
    firstEvidenceRecordingActionKey: firstActionKey((stage) => stage.actionType === "manual-evidence" && stage.actionRequiresEvidence),
    firstTargetRepoEvidenceActionKey: firstActionKey((stage) => stage.actionEvidenceTarget === "target-repo-working-tree"),
    firstLocalOutputEvidenceActionKey: firstActionKey((stage) => stage.actionEvidenceTarget === "local-output-file"),
    firstActionWithEvidenceCaptureFieldKey: firstActionKey((stage) => stage.actionHasEvidenceCaptureFields),
    firstActionWithOptionalEvidenceCaptureFieldKey: firstActionKey((stage) => stage.actionOptionalEvidenceCaptureFieldCount > 0),
    firstManualActionWithEvidenceCaptureFieldKey: firstActionKey((stage) => stage.manual && stage.actionHasEvidenceCaptureFields),
    firstTextareaEvidenceCaptureActionKey: firstActionKey((stage) => stage.actionEvidenceCaptureFields.some((field) => field.inputType === "textarea")),
    firstMultiValueEvidenceCaptureActionKey: firstActionKey((stage) => stage.actionEvidenceCaptureFields.some((field) => field.acceptsMultiple)),
    firstValidationRuleEvidenceCaptureActionKey: firstActionKey((stage) => stage.actionEvidenceCaptureFields.some((field) => field.validationRule)),
    requiresTargetRepoWork: stages.some((stage) => stage.kind === "manual-target-repo"),
    requiresEvidenceReturn: stages.some((stage) => stage.kind === "manual-reporting"),
    externalCalls: stages.some((stage) => stage.externalCalls),
    targetRepoMutation: stages.some((stage) => stage.targetRepoMutation),
  };
  return {
    version: 1,
    source: "bundle-handoff",
    stageCount: stages.length,
    commandStageCount: commandStages.length,
    manualStageCount: countBy((stage) => stage.commandCount === 0),
    requiredStageCount: countBy((stage) => stage.required),
    optionalStageCount: countBy((stage) => !stage.required),
    readOnlyCommandStageCount: countBy((stage) => stage.runPolicy === "read-only"),
    localOutputCommandStageCount: countBy((stage) => stage.runPolicy === "writes-local-file"),
    externalCallCommandStageCount: countBy((stage) => stage.externalCalls),
    targetRepoMutationCommandStageCount: countBy((stage) => stage.targetRepoMutation),
    effectiveTaskId: commandManifest?.effectiveTaskId || "",
    effectiveStrictTaskCommandKey,
    stageKeys,
    stageByKey,
    stageLabelByKey,
    stageSummaryByKey,
    stageHumanLines,
    stageHumanLineByKey,
    stageHumanLineDisplayRows,
    stageHumanLineDisplayRowByKey,
    stageHumanLineDisplayRowKeysByActionStatus,
    stageHumanLineDisplayRowKeysByEvidenceProgressStatus,
    stageHumanLineDisplayRowSummary,
    stageHumanLineSummary,
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
    stageActionEvidenceRequirementsByKey,
    stageActionEvidenceRequirementCountByKey,
    stageActionRequiresEvidenceByKey,
    stageActionEvidenceTargetByKey,
    stageActionEvidenceTargetLabelByKey,
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
    actionSummary,
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
    nextStageKey,
    nextStage,
    nextStageLabel: nextStage?.label || "",
    nextStageSummary: nextStage?.reason || "",
    nextStageHumanLine: nextStage ? stageHumanLineByKey[nextStage.key] || "" : "",
    nextStageHumanLineDisplayRow: nextStage ? stageHumanLineDisplayRowByKey[nextStage.key] || {} : {},
    nextStageHumanLineSummary: nextStage ? {
      stageKey: nextStage.key,
      line: stageHumanLineByKey[nextStage.key] || "",
      hasEvidenceProgress: (nextActionEvidenceProgressSummary.itemCount || 0) > 0,
      evidenceProgressStatus: nextActionEvidenceProgressSummary.status || "",
      evidenceProgressLabel: nextActionEvidenceProgressSummary.progressLabel || "",
      firstUncheckedEvidenceItemLabel: nextActionEvidenceProgressSummary.firstUncheckedItemLabel || "",
    } : {},
    nextStageActionType: nextActionValue("actionType"),
    nextStageActionLabel: nextActionValue("actionLabel"),
    nextStageActionInstruction: nextActionValue("actionInstruction"),
    nextStageActionButtonLabel: nextActionValue("actionButtonLabel"),
    nextStageActionAffordance: nextActionValue("actionAffordance"),
    nextStageActionEnabled: nextActionFlag("actionEnabled"),
    nextStageActionStatus: nextActionValue("actionStatus"),
    nextStageActionStatusLabel: nextActionValue("actionStatusLabel"),
    nextStageActionStatusTone: nextActionValue("actionStatusTone"),
    nextStageActionDisabledReasonCode: nextActionValue("actionDisabledReasonCode"),
    nextStageActionDisabledReason: nextActionValue("actionDisabledReason"),
    nextStageActionPrerequisiteKeys: nextActionList("actionPrerequisiteKeys"),
    nextStageActionPrerequisiteLabels: nextActionList("actionPrerequisiteLabels"),
    nextStageActionPrerequisiteCount: nextActionCount("actionPrerequisiteCount"),
    nextStageActionHasPrerequisites: nextActionFlag("actionHasPrerequisites"),
    nextStageActionDependencyReasonCode: nextActionValue("actionDependencyReasonCode"),
    nextStageActionDependencyReason: nextActionValue("actionDependencyReason"),
    nextStageActionBlockedStageKeys: nextActionList("actionBlockedStageKeys"),
    nextStageActionBlockedStageLabels: nextActionList("actionBlockedStageLabels"),
    nextStageActionBlockedStageCount: nextActionCount("actionBlockedStageCount"),
    nextStageActionBlocksStages: nextActionFlag("actionBlocksStages"),
    nextStageActionCompletionCriteria: nextActionList("actionCompletionCriteria"),
    nextStageActionCompletionCriteriaCount: nextActionCount("actionCompletionCriteriaCount"),
    nextStageActionHasCompletionCriteria: nextActionFlag("actionHasCompletionCriteria"),
    nextStageActionEvidenceRequirements: nextActionList("actionEvidenceRequirements"),
    nextStageActionEvidenceRequirementCount: nextActionCount("actionEvidenceRequirementCount"),
    nextStageActionRequiresEvidence: nextActionFlag("actionRequiresEvidence"),
    nextStageActionEvidenceTarget: nextActionValue("actionEvidenceTarget"),
    nextStageActionEvidenceTargetLabel: nextActionValue("actionEvidenceTargetLabel"),
    nextStageActionEvidenceCaptureFields: nextActionList("actionEvidenceCaptureFields"),
    nextStageActionEvidenceCaptureFieldKeys: nextActionList("actionEvidenceCaptureFieldKeys"),
    nextStageActionEvidenceCaptureFieldLabels: nextActionList("actionEvidenceCaptureFieldLabels"),
    nextStageActionEvidenceCaptureFieldPlaceholders: nextActionList("actionEvidenceCaptureFieldPlaceholders"),
    nextStageActionEvidenceCaptureFieldRequirementLabels: nextActionList("actionEvidenceCaptureFieldRequirementLabels"),
    nextStageActionEvidenceCaptureFieldAriaLabels: nextActionList("actionEvidenceCaptureFieldAriaLabels"),
    nextStageActionEvidenceCaptureFieldHelpTexts: nextActionList("actionEvidenceCaptureFieldHelpTexts"),
    nextStageActionEvidenceCaptureFieldSectionKeys: nextActionList("actionEvidenceCaptureFieldSectionKeys"),
    nextStageActionEvidenceCaptureFieldSectionLabels: nextActionList("actionEvidenceCaptureFieldSectionLabels"),
    nextStageActionEvidenceCaptureSectionKeys: nextActionList("actionEvidenceCaptureSectionKeys"),
    nextStageActionEvidenceCaptureSectionLabels: nextActionList("actionEvidenceCaptureSectionLabels"),
    nextStageActionEvidenceCaptureSectionCount: nextActionCount("actionEvidenceCaptureSectionCount"),
    nextStageActionEvidenceCaptureFieldPayloadNamespaces: nextActionList("actionEvidenceCaptureFieldPayloadNamespaces"),
    nextStageActionEvidenceCaptureFieldPayloadPaths: nextActionList("actionEvidenceCaptureFieldPayloadPaths"),
    nextStageActionEvidenceCapturePayloadNamespaces: nextActionList("actionEvidenceCapturePayloadNamespaces"),
    nextStageActionEvidenceCapturePayloadNamespaceCount: nextActionCount("actionEvidenceCapturePayloadNamespaceCount"),
    nextStageActionEvidenceCapturePayloadTemplate: nextActionObject("actionEvidenceCapturePayloadTemplate"),
    nextStageActionEvidenceCapturePayloadFlatTemplate: nextActionObject("actionEvidenceCapturePayloadFlatTemplate"),
    nextStageActionEvidenceCapturePayloadBindings: nextActionList("actionEvidenceCapturePayloadBindings"),
    nextStageActionEvidenceCaptureValidationSpecs: nextActionList("actionEvidenceCaptureValidationSpecs"),
    nextStageActionEvidenceCaptureInitialValidationStates: nextActionList("actionEvidenceCaptureInitialValidationStates"),
    nextStageActionEvidenceCaptureInitialValidationDisplayMetadata: nextActionList("actionEvidenceCaptureInitialValidationDisplayMetadata"),
    nextStageActionEvidenceCaptureInitialValidationChecklist: nextActionList("actionEvidenceCaptureInitialValidationChecklist"),
    nextStageActionEvidenceCaptureInitialValidationChecklistSummary: nextActionObject("actionEvidenceCaptureInitialValidationChecklistSummary"),
    nextStageActionEvidenceCaptureInitialValidationSummary: nextActionObject("actionEvidenceCaptureInitialValidationSummary"),
    nextStageActionEvidenceCaptureFieldInputTypes: nextActionList("actionEvidenceCaptureFieldInputTypes"),
    nextStageActionEvidenceCaptureFieldValueShapes: nextActionList("actionEvidenceCaptureFieldValueShapes"),
    nextStageActionEvidenceCaptureFieldAcceptsMultiple: nextActionList("actionEvidenceCaptureFieldAcceptsMultiple"),
    nextStageActionEvidenceCaptureFieldDefaultValues: nextActionList("actionEvidenceCaptureFieldDefaultValues"),
    nextStageActionEvidenceCaptureFieldEmptyValues: nextActionList("actionEvidenceCaptureFieldEmptyValues"),
    nextStageActionEvidenceCaptureFieldValidationRules: nextActionList("actionEvidenceCaptureFieldValidationRules"),
    nextStageActionEvidenceCaptureFieldMinLengths: nextActionList("actionEvidenceCaptureFieldMinLengths"),
    nextStageActionEvidenceCaptureFieldExamples: nextActionList("actionEvidenceCaptureFieldExamples"),
    nextStageActionEvidenceCaptureFieldValidationHints: nextActionList("actionEvidenceCaptureFieldValidationHints"),
    nextStageActionRequiredEvidenceCaptureFieldKeys: nextActionList("actionRequiredEvidenceCaptureFieldKeys"),
    nextStageActionOptionalEvidenceCaptureFieldKeys: nextActionList("actionOptionalEvidenceCaptureFieldKeys"),
    nextStageActionEvidenceCaptureFieldCount: nextActionCount("actionEvidenceCaptureFieldCount"),
    nextStageActionRequiredEvidenceCaptureFieldCount: nextActionCount("actionRequiredEvidenceCaptureFieldCount"),
    nextStageActionOptionalEvidenceCaptureFieldCount: nextActionCount("actionOptionalEvidenceCaptureFieldCount"),
    nextStageActionHasEvidenceCaptureFields: nextActionFlag("actionHasEvidenceCaptureFields"),
    nextStageKind: nextStageValue("kind"),
    nextStageRequired: nextStage?.required === true,
    nextStageRunPolicy: nextStageValue("runPolicy"),
    nextStageSafetyLevel: nextStageValue("safetyLevel"),
    nextStageCommandCount: nextStageValue("commandCount", 0),
    nextStageCommandLabels: nextStageCommandList((command) => command.label),
    nextStageCommands: nextStageCommandList((command) => command.command),
    nextStageCommandArgsList: nextStageCommandList((command) => command.commandArgs),
    nextStageCommandRunPolicies: nextStageCommandList((command) => command.runPolicy),
    nextStageCommandSafetyLevels: nextStageCommandList((command) => command.safety?.safetyLevel || ""),
    nextStageOutputFiles: nextStage?.outputFiles || [],
    nextStageHasCommands: (nextStage?.commandCount || 0) > 0,
    nextStageManual: (nextStage?.commandCount || 0) === 0,
    nextStageWritesLocalFile: nextStage?.writesLocalFile === true,
    nextStageExternalCalls: nextStage?.externalCalls === true,
    nextStageTargetRepoMutation: nextStage?.targetRepoMutation === true,
    nextStageCommandKeys: nextStage?.commandKeys || [],
    nextCommandKey,
    nextCommand: nextCommandEntry?.command || "",
    nextCommandArgs: nextCommandEntry?.commandArgs || [],
    nextCommandRunPolicy: nextCommandEntry?.runPolicy || "",
    nextCommandSafetyLevel: nextCommandEntry?.safety?.safetyLevel || "",
    nextCommandSafety: nextCommandEntry?.safety || null,
    nextCommandEntry,
    stages,
  };
}

export {
  formatBundleHandoffOperatorRunbookLines,
} from "./site-bundle-handoff-runbook-format.mjs";
