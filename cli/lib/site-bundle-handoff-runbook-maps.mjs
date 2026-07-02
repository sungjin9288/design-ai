// Stage/action key-map builders and stage predicates for the bundle-handoff operator runbook.

export const byKey = (rows, getValue) => Object.fromEntries(
  rows.map((row, index) => [row.key, getValue(row, index)]),
);
export const fieldByKey = (rows, field) => byKey(rows, (row) => row[field]);
export const hasCommands = (stage) => stage.commandCount > 0;
export const isManualStage = (stage) => !hasCommands(stage);
export const isRequiredStage = (stage) => stage.required;
export const isOptionalStage = (stage) => !stage.required;
export const usesReadOnlyRunPolicy = (stage) => stage.runPolicy === "read-only";
export const usesLocalOutputRunPolicy = (stage) => stage.runPolicy === "writes-local-file";
export const hasOutputFile = (stage) => stage.outputFiles.length > 0;
export const callsExternalSystem = (stage) => stage.externalCalls;
export const mutatesTargetRepo = (stage) => stage.targetRepoMutation;

export function buildStageIdentityMaps(stages) {
  const stageFieldByKey = (field) => fieldByKey(stages, field);
  const stageKeys = stages.map((stage) => stage.key);
  const stageByKey = byKey(stages, (stage) => stage);
  const stageLabelByKey = stageFieldByKey("label");
  const stageSummaryByKey = stageFieldByKey("reason");
  return {
    stageKeys,
    stageByKey,
    stageLabelByKey,
    stageSummaryByKey,
  };
}

export function buildStageActionStatusMaps(stageActionRows) {
  const actionFieldByKey = (field) => fieldByKey(stageActionRows, field);
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
  return {
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
}

export function buildStageActionDependencyMaps(stageActionRows) {
  const actionFieldByKey = (field) => fieldByKey(stageActionRows, field);
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
  return {
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
}

export function buildStageActionEvidenceMaps(stageActionRows) {
  const actionFieldByKey = (field) => fieldByKey(stageActionRows, field);
  const stageActionEvidenceRequirementsByKey = actionFieldByKey("actionEvidenceRequirements");
  const stageActionEvidenceRequirementCountByKey = actionFieldByKey("actionEvidenceRequirementCount");
  const stageActionRequiresEvidenceByKey = actionFieldByKey("actionRequiresEvidence");
  const stageActionEvidenceTargetByKey = actionFieldByKey("actionEvidenceTarget");
  const stageActionEvidenceTargetLabelByKey = actionFieldByKey("actionEvidenceTargetLabel");
  return {
    stageActionEvidenceRequirementsByKey,
    stageActionEvidenceRequirementCountByKey,
    stageActionRequiresEvidenceByKey,
    stageActionEvidenceTargetByKey,
    stageActionEvidenceTargetLabelByKey,
  };
}

export function buildStageActionEvidenceCaptureMaps(stageActionRows) {
  const actionFieldByKey = (field) => fieldByKey(stageActionRows, field);
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
  return {
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
}

export function buildStageExecutionMaps(stages) {
  const stageFieldByKey = (field) => fieldByKey(stages, field);
  const commandListByKey = (getValue) => byKey(stages, (stage) => stage.commands.map(getValue));
  const stageKeysBy = (predicate) => stages.filter(predicate).map((stage) => stage.key);
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
  return {
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
}
