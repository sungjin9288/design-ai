// Human-readable stage line rows and summaries for the bundle-handoff operator runbook.

import {
  formatBundleHandoffOperatorRunbookStageLine,
} from "./site-bundle-handoff-runbook-format.mjs";
import {
  byKey,
  hasCommands,
  isManualStage,
  isOptionalStage,
  isRequiredStage,
} from "./site-bundle-handoff-runbook-maps.mjs";

export function buildStageHumanLineMaps(
  stages,
  stageActionRows,
  stageActionEvidenceCaptureInitialValidationChecklistSummaryByKey,
) {
  const stageHumanLines = stages.map((stage) => formatBundleHandoffOperatorRunbookStageLine(
    stage,
    stageActionEvidenceCaptureInitialValidationChecklistSummaryByKey[stage.key],
  ));
  const stageHumanLineByKey = byKey(stages, (_stage, index) => stageHumanLines[index]);
  const stageHumanLineDisplayRows = stages.map((stage, index) => {
    const actionRow = stageActionRows[index];
    const evidenceProgress = actionRow.actionEvidenceCaptureInitialValidationChecklistSummary;
    const displayRowIdentity = {
      step: stage.step,
      key: stage.key,
      label: stage.label,
      line: stageHumanLines[index],
    };
    const displayRowExecutionContext = {
      required: stage.required,
      manual: isManualStage(stage),
      commandCount: stage.commandCount,
    };
    const displayRowActionStatus = {
      actionType: actionRow.actionType,
      actionLabel: actionRow.actionLabel,
      actionStatus: actionRow.actionStatus,
      actionStatusLabel: actionRow.actionStatusLabel,
      actionStatusTone: actionRow.actionStatusTone,
    };
    const displayRowEvidenceProgress = {
      hasEvidenceProgress: evidenceProgress.itemCount > 0,
      evidenceProgressStatus: evidenceProgress.status || "",
      evidenceProgressStatusLabel: evidenceProgress.statusLabel || "",
      evidenceProgressStatusTone: evidenceProgress.statusTone || "",
      evidenceProgressIconName: evidenceProgress.iconName || "",
      evidenceProgressLabel: evidenceProgress.progressLabel || "",
      evidenceCompletionPercent: evidenceProgress.completionPercent ?? 0,
      firstUncheckedEvidenceItemLabel: evidenceProgress.firstUncheckedItemLabel || "",
    };
    return {
      ...displayRowIdentity,
      ...displayRowExecutionContext,
      ...displayRowActionStatus,
      ...displayRowEvidenceProgress,
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
  const stageHumanLineDisplayRowCountSummary = {
    count: stageHumanLineDisplayRows.length,
    byKeyCount: Object.keys(stageHumanLineDisplayRowByKey).length,
    requiredCount: countDisplayRows(isRequiredDisplayRow),
    optionalCount: countDisplayRows(isOptionalDisplayRow),
    commandCount: countDisplayRows(hasCommandDisplayRow),
    manualCount: countDisplayRows(isManualDisplayRow),
  };
  const stageHumanLineDisplayRowActionStatusSummary = {
    readyActionStatusCount: countDisplayRows(hasReadyActionStatus),
    optionalActionStatusCount: countDisplayRows(hasOptionalActionStatus),
    manualActionStatusCount: countDisplayRows(hasManualActionStatus),
    blockedActionStatusCount: countDisplayRows(hasBlockedActionStatus),
  };
  const stageHumanLineDisplayRowEvidenceProgressSummary = {
    evidenceProgressCount: countDisplayRows(hasDisplayRowEvidenceProgress),
    blockedEvidenceProgressCount: countDisplayRows(hasBlockedDisplayRowEvidenceProgress),
    readyEvidenceProgressCount: countDisplayRows(hasReadyDisplayRowEvidenceProgress),
  };
  const stageHumanLineDisplayRowFirstKeySummary = {
    firstRowKey: stageHumanLineDisplayRows[0]?.key || "",
    firstReadyActionRowKey: firstDisplayRowKey(hasReadyActionStatus),
    firstOptionalActionRowKey: firstDisplayRowKey(hasOptionalActionStatus),
    firstManualActionRowKey: firstDisplayRowKey(hasManualActionStatus),
    firstBlockedEvidenceProgressRowKey: firstDisplayRowKey(hasBlockedDisplayRowEvidenceProgress),
    firstReadyEvidenceProgressRowKey: firstDisplayRowKey(hasReadyDisplayRowEvidenceProgress),
  };
  const stageHumanLineDisplayRowSummary = {
    ...stageHumanLineDisplayRowCountSummary,
    ...stageHumanLineDisplayRowActionStatusSummary,
    ...stageHumanLineDisplayRowEvidenceProgressSummary,
    ...stageHumanLineDisplayRowFirstKeySummary,
  };
  const stageHumanLineCountSummary = {
    count: stageHumanLines.length,
    byKeyCount: Object.keys(stageHumanLineByKey).length,
    requiredCount: countBy(isRequiredStage),
    optionalCount: countBy(isOptionalStage),
    commandCount: countBy(hasCommands),
    manualCount: countBy(isManualStage),
  };
  const stageHumanLineEvidenceProgressSummary = {
    evidenceProgressCount: countActions(hasEvidenceProgress),
    blockedEvidenceProgressCount: countActions(hasBlockedEvidenceProgress),
    readyEvidenceProgressCount: countActions(hasReadyEvidenceProgress),
  };
  const stageHumanLineFirstValueSummary = {
    firstStageKey: stages[0]?.key || "",
    firstLine: stageHumanLines[0] || "",
    firstEvidenceProgressStageKey: firstActionKey(hasEvidenceProgress),
    firstBlockedEvidenceProgressStageKey: firstActionKey(hasBlockedEvidenceProgress),
  };
  const stageHumanLineSummary = {
    ...stageHumanLineCountSummary,
    ...stageHumanLineEvidenceProgressSummary,
    ...stageHumanLineFirstValueSummary,
  };
  return {
    stageHumanLines,
    stageHumanLineByKey,
    stageHumanLineDisplayRows,
    stageHumanLineDisplayRowByKey,
    stageHumanLineDisplayRowKeysByActionStatus,
    stageHumanLineDisplayRowKeysByEvidenceProgressStatus,
    stageHumanLineDisplayRowSummary,
    stageHumanLineSummary,
  };
}
