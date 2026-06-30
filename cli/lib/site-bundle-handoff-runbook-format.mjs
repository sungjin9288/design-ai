// Human-readable formatting for Website Improvement bundle handoff runbooks.

export function formatBundleHandoffOperatorRunbookLines(operatorRunbook) {
  if (!operatorRunbook || !Array.isArray(operatorRunbook.stages) || operatorRunbook.stages.length === 0) {
    return ["- No operator runbook is available."];
  }
  if (Array.isArray(operatorRunbook.stageHumanLines) && operatorRunbook.stageHumanLines.length === operatorRunbook.stages.length) {
    return operatorRunbook.stageHumanLines;
  }
  return operatorRunbook.stages.map((stage) => {
    const checklistSummary = stage.actionEvidenceCaptureInitialValidationChecklistSummary
      || operatorRunbook.stageActionEvidenceCaptureInitialValidationChecklistSummaryByKey?.[stage.key];
    return formatBundleHandoffOperatorRunbookStageLine(stage, checklistSummary);
  });
}

export function formatBundleHandoffOperatorRunbookStageLine(stage, checklistSummary = null) {
  const commands = Array.isArray(stage.commands) ? stage.commands : [];
  const outputFiles = Array.isArray(stage.outputFiles) ? stage.outputFiles : [];
  const required = stage.required ? "required" : "optional";
  const commandText = commands.length
    ? ` command: \`${commands[0].command}\``
    : " command: manual";
  const outputText = outputFiles.length ? ` output: ${outputFiles.join(", ")}` : "";
  const evidenceText = checklistSummary?.itemCount > 0
    ? ` evidence: ${checklistSummary.progressLabel}, ${checklistSummary.statusLabel}${
      checklistSummary.firstUncheckedItemLabel ? `; next: ${checklistSummary.firstUncheckedItemLabel}` : ""
    }`
    : "";
  return `- ${stage.step}. ${stage.key} (${required}, ${stage.runPolicy || stage.kind}): ${stage.label}.${commandText}${outputText}${evidenceText}`;
}
