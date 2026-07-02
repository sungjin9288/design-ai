// Aggregate action summary metrics for the bundle-handoff operator runbook.

import { uniqueValues } from "./site-bundle-handoff-runbook-evidence.mjs";
import {
  callsExternalSystem,
  hasCommands,
  hasOutputFile,
  isManualStage,
  isOptionalStage,
  isRequiredStage,
  mutatesTargetRepo,
  usesLocalOutputRunPolicy,
  usesReadOnlyRunPolicy,
} from "./site-bundle-handoff-runbook-maps.mjs";

export function buildActionSummary({
  stages,
  commandStages,
  stageActionRows,
  stageHumanLineMaps,
  nextActionSummary,
}) {
  const { stageHumanLineDisplayRowSummary, stageHumanLineSummary } = stageHumanLineMaps;
  const countBy = (predicate) => stages.filter(predicate).length;
  const countActions = (predicate) => stageActionRows.filter(predicate).length;
  const firstActionKey = (predicate) => stageActionRows.find(predicate)?.key || "";
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
  return {
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
}
