// Next-step stage/command/action summaries for the bundle-handoff operator runbook.

export function buildNextStepState({
  stageByKey,
  commandByKey,
  stageActionRows,
  stageHumanLineByKey,
  stageHumanLineDisplayRowByKey,
}) {
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
  const nextStageHumanLineSummary = nextStage ? {
    stageKey: nextStage.key,
    line: nextStageHumanLine,
    hasEvidenceProgress: (nextActionEvidenceProgressSummary.itemCount || 0) > 0,
    evidenceProgressStatus: nextActionEvidenceProgressSummary.status || "",
    evidenceProgressLabel: nextActionEvidenceProgressSummary.progressLabel || "",
    firstUncheckedEvidenceItemLabel: nextActionEvidenceProgressSummary.firstUncheckedItemLabel || "",
  } : {};
  const nextStageIdentity = {
    nextStageLabel: nextStageField("label"),
    nextStageSummary: nextStageField("reason"),
    nextStageHumanLine,
    nextStageHumanLineDisplayRow,
    nextStageHumanLineSummary,
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
  const nextStageEvidenceCaptureFieldMetadata = {
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
  };
  const nextStageEvidenceCapturePayload = {
    nextStageActionEvidenceCaptureFieldPayloadNamespaces: nextActionListField("actionEvidenceCaptureFieldPayloadNamespaces"),
    nextStageActionEvidenceCaptureFieldPayloadPaths: nextActionListField("actionEvidenceCaptureFieldPayloadPaths"),
    nextStageActionEvidenceCapturePayloadNamespaces: nextActionListField("actionEvidenceCapturePayloadNamespaces"),
    nextStageActionEvidenceCapturePayloadNamespaceCount: nextActionNumberField("actionEvidenceCapturePayloadNamespaceCount"),
    nextStageActionEvidenceCapturePayloadTemplate: nextActionObjectField("actionEvidenceCapturePayloadTemplate"),
    nextStageActionEvidenceCapturePayloadFlatTemplate: nextActionObjectField("actionEvidenceCapturePayloadFlatTemplate"),
    nextStageActionEvidenceCapturePayloadBindings: nextActionListField("actionEvidenceCapturePayloadBindings"),
  };
  const nextStageEvidenceCaptureValidation = {
    nextStageActionEvidenceCaptureValidationSpecs: nextActionListField("actionEvidenceCaptureValidationSpecs"),
    nextStageActionEvidenceCaptureInitialValidationStates: nextActionListField("actionEvidenceCaptureInitialValidationStates"),
    nextStageActionEvidenceCaptureInitialValidationDisplayMetadata: nextActionListField("actionEvidenceCaptureInitialValidationDisplayMetadata"),
    nextStageActionEvidenceCaptureInitialValidationChecklist: nextActionListField("actionEvidenceCaptureInitialValidationChecklist"),
    nextStageActionEvidenceCaptureInitialValidationChecklistSummary: nextActionObjectField("actionEvidenceCaptureInitialValidationChecklistSummary"),
    nextStageActionEvidenceCaptureInitialValidationSummary: nextActionObjectField("actionEvidenceCaptureInitialValidationSummary"),
  };
  const nextStageEvidenceCaptureFieldRules = {
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
  };
  const nextStageEvidenceCaptureFieldCounts = {
    nextStageActionEvidenceCaptureFieldCount: nextActionNumberField("actionEvidenceCaptureFieldCount"),
    nextStageActionRequiredEvidenceCaptureFieldCount: nextActionNumberField("actionRequiredEvidenceCaptureFieldCount"),
    nextStageActionOptionalEvidenceCaptureFieldCount: nextActionNumberField("actionOptionalEvidenceCaptureFieldCount"),
    nextStageActionHasEvidenceCaptureFields: nextActionBooleanField("actionHasEvidenceCaptureFields"),
  };
  const nextStageEvidenceCapture = {
    ...nextStageEvidenceCaptureFieldMetadata,
    ...nextStageEvidenceCapturePayload,
    ...nextStageEvidenceCaptureValidation,
    ...nextStageEvidenceCaptureFieldRules,
    ...nextStageEvidenceCaptureFieldCounts,
  };
  const nextStageClassification = {
    nextStageKind: nextStageField("kind"),
    nextStageRequired: nextStage?.required === true,
    nextStageRunPolicy: nextStageField("runPolicy"),
    nextStageSafetyLevel: nextStageField("safetyLevel"),
  };
  const nextStageCommandMetadata = {
    nextStageCommandCount,
    nextStageCommandLabels: nextStageCommandValues((command) => command.label),
    nextStageCommands: nextStageCommandValues((command) => command.command),
    nextStageCommandArgsList: nextStageCommandValues((command) => command.commandArgs),
    nextStageCommandRunPolicies: nextStageCommandValues((command) => command.runPolicy),
    nextStageCommandSafetyLevels: nextStageCommandValues((command) => command.safety?.safetyLevel || ""),
  };
  const nextStageExecutionContext = {
    nextStageOutputFiles: nextStageListField("outputFiles"),
    nextStageHasCommands: nextStageCommandCount > 0,
    nextStageManual: nextStageCommandCount === 0,
    nextStageWritesLocalFile: nextStageBooleanField("writesLocalFile"),
    nextStageExternalCalls: nextStageBooleanField("externalCalls"),
    nextStageTargetRepoMutation: nextStageBooleanField("targetRepoMutation"),
    nextStageCommandKeys: nextStageListField("commandKeys"),
  };
  const nextStageCommandSummary = {
    ...nextStageClassification,
    ...nextStageCommandMetadata,
    ...nextStageExecutionContext,
  };
  const nextCommandSummary = {
    nextCommand: nextCommandField("command"),
    nextCommandArgs: nextCommandListField("commandArgs"),
    nextCommandRunPolicy: nextCommandField("runPolicy"),
    nextCommandSafetyLevel: nextCommandSafety?.safetyLevel || "",
    nextCommandSafety,
    nextCommandEntry,
  };
  const nextActionCoreSummary = {
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
  };
  const nextActionEvidenceCaptureFieldMetadata = {
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
  };
  const nextActionEvidenceCapturePayload = {
    nextActionEvidenceCaptureFieldPayloadNamespaces: nextActionListField("actionEvidenceCaptureFieldPayloadNamespaces"),
    nextActionEvidenceCaptureFieldPayloadPaths: nextActionListField("actionEvidenceCaptureFieldPayloadPaths"),
    nextActionEvidenceCapturePayloadNamespaces: nextActionListField("actionEvidenceCapturePayloadNamespaces"),
    nextActionEvidenceCapturePayloadNamespaceCount: nextActionNumberField("actionEvidenceCapturePayloadNamespaceCount"),
    nextActionEvidenceCapturePayloadTemplate: nextActionObjectField("actionEvidenceCapturePayloadTemplate"),
    nextActionEvidenceCapturePayloadFlatTemplate: nextActionObjectField("actionEvidenceCapturePayloadFlatTemplate"),
    nextActionEvidenceCapturePayloadBindings: nextActionListField("actionEvidenceCapturePayloadBindings"),
  };
  const nextActionEvidenceCaptureValidation = {
    nextActionEvidenceCaptureValidationSpecs: nextActionListField("actionEvidenceCaptureValidationSpecs"),
    nextActionEvidenceCaptureInitialValidationStates: nextActionListField("actionEvidenceCaptureInitialValidationStates"),
    nextActionEvidenceCaptureInitialValidationDisplayMetadata: nextActionListField("actionEvidenceCaptureInitialValidationDisplayMetadata"),
    nextActionEvidenceCaptureInitialValidationChecklist: nextActionListField("actionEvidenceCaptureInitialValidationChecklist"),
    nextActionEvidenceCaptureInitialValidationChecklistSummary: nextActionObjectField("actionEvidenceCaptureInitialValidationChecklistSummary"),
    nextActionEvidenceCaptureInitialValidationSummary: nextActionObjectField("actionEvidenceCaptureInitialValidationSummary"),
  };
  const nextActionEvidenceCaptureFieldRules = {
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
  };
  const nextActionEvidenceCaptureFieldCounts = {
    nextActionEvidenceCaptureFieldCount: nextActionNumberField("actionEvidenceCaptureFieldCount"),
    nextActionRequiredEvidenceCaptureFieldCount: nextActionNumberField("actionRequiredEvidenceCaptureFieldCount"),
    nextActionOptionalEvidenceCaptureFieldCount: nextActionNumberField("actionOptionalEvidenceCaptureFieldCount"),
    nextActionHasEvidenceCaptureFields: nextActionBooleanField("actionHasEvidenceCaptureFields"),
  };
  const nextActionRunContext = {
    nextActionRunPolicy: nextStageField("runPolicy"),
    nextActionSafetyLevel: nextStageField("safetyLevel"),
  };
  const nextActionSummary = {
    ...nextActionCoreSummary,
    ...nextActionEvidenceCaptureFieldMetadata,
    ...nextActionEvidenceCapturePayload,
    ...nextActionEvidenceCaptureValidation,
    ...nextActionEvidenceCaptureFieldRules,
    ...nextActionEvidenceCaptureFieldCounts,
    ...nextActionRunContext,
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
  return { nextActionSummary, nextStepSummary };
}
