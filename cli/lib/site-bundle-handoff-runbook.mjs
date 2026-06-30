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
  const getStageActionPrerequisiteKeys = (stage) => ({
    verifySourceBundle: [],
    refreshHandoffSnapshot: [],
    writeEffectiveTaskPrompt: ["verifySourceBundle"],
    executeInTargetRepo: ["verifySourceBundle", "writeEffectiveTaskPrompt"],
    recordEvidence: ["executeInTargetRepo"],
  }[stage.key] || []);
  const getStageLabel = (stageKey) => stages.find((stage) => stage.key === stageKey)?.label || stageKey;
  const getStageActionPrerequisiteLabels = (stage) => getStageActionPrerequisiteKeys(stage).map(getStageLabel);
  const getStageActionBlockedStageKeys = (stage) => stages
    .filter((candidate) => getStageActionPrerequisiteKeys(candidate).includes(stage.key))
    .map((candidate) => candidate.key);
  const getStageActionDependencyReasonCode = (stage) => (
    getStageActionPrerequisiteKeys(stage).length > 0 ? "requires-prerequisite-actions" : ""
  );
  const getStageActionDependencyReason = (stage) => ({
    writeEffectiveTaskPrompt: "Complete Verify source bundle integrity before writing the selected task prompt.",
    executeInTargetRepo: "Complete Verify source bundle integrity and Write effective task handoff prompt before implementing in the target website repo.",
    recordEvidence: "Complete Execute the task in the target website repo before recording implementation evidence.",
  }[stage.key] || "");
  const getStageActionCompletionCriteria = (stage) => ({
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
  const getStageActionEvidenceRequirements = (stage) => ({
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
  const stageActionRows = stages.map((stage) => ({
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
    actionPrerequisiteKeys: getStageActionPrerequisiteKeys(stage),
    actionPrerequisiteLabels: getStageActionPrerequisiteLabels(stage),
    actionPrerequisiteCount: getStageActionPrerequisiteKeys(stage).length,
    actionHasPrerequisites: getStageActionPrerequisiteKeys(stage).length > 0,
    actionDependencyReasonCode: getStageActionDependencyReasonCode(stage),
    actionDependencyReason: getStageActionDependencyReason(stage),
    actionBlockedStageKeys: getStageActionBlockedStageKeys(stage),
    actionBlockedStageLabels: getStageActionBlockedStageKeys(stage).map(getStageLabel),
    actionBlockedStageCount: getStageActionBlockedStageKeys(stage).length,
    actionBlocksStages: getStageActionBlockedStageKeys(stage).length > 0,
    actionCompletionCriteria: getStageActionCompletionCriteria(stage),
    actionCompletionCriteriaCount: getStageActionCompletionCriteria(stage).length,
    actionHasCompletionCriteria: getStageActionCompletionCriteria(stage).length > 0,
    actionEvidenceRequirements: getStageActionEvidenceRequirements(stage),
    actionEvidenceRequirementCount: getStageActionEvidenceRequirements(stage).length,
    actionRequiresEvidence: getStageActionEvidenceRequirements(stage).length > 0,
    actionEvidenceTarget: getStageActionEvidenceTarget(stage),
    actionEvidenceTargetLabel: getStageActionEvidenceTargetLabel(stage),
    actionEvidenceCaptureFields: getStageActionEvidenceCaptureFields(stage),
    actionEvidenceCaptureFieldKeys: getStageActionEvidenceCaptureFields(stage).map((field) => field.key),
    actionEvidenceCaptureFieldLabels: getStageActionEvidenceCaptureFields(stage).map((field) => field.label),
    actionEvidenceCaptureFieldPlaceholders: getStageActionEvidenceCaptureFields(stage).map((field) => field.placeholder),
    actionEvidenceCaptureFieldRequirementLabels: getStageActionEvidenceCaptureFields(stage).map((field) => field.requirementLabel),
    actionEvidenceCaptureFieldAriaLabels: getStageActionEvidenceCaptureFields(stage).map((field) => field.ariaLabel),
    actionEvidenceCaptureFieldHelpTexts: getStageActionEvidenceCaptureFields(stage).map((field) => field.helpText),
    actionEvidenceCaptureFieldSectionKeys: getStageActionEvidenceCaptureFields(stage).map((field) => field.sectionKey),
    actionEvidenceCaptureFieldSectionLabels: getStageActionEvidenceCaptureFields(stage).map((field) => field.sectionLabel),
    actionEvidenceCaptureSectionKeys: uniqueValues(getStageActionEvidenceCaptureFields(stage).map((field) => field.sectionKey)),
    actionEvidenceCaptureSectionLabels: uniqueValues(getStageActionEvidenceCaptureFields(stage).map((field) => field.sectionLabel)),
    actionEvidenceCaptureSectionCount: uniqueValues(getStageActionEvidenceCaptureFields(stage).map((field) => field.sectionKey)).length,
    actionEvidenceCaptureFieldPayloadNamespaces: getStageActionEvidenceCaptureFields(stage).map((field) => field.payloadNamespace),
    actionEvidenceCaptureFieldPayloadPaths: getStageActionEvidenceCaptureFields(stage).map((field) => field.payloadPath),
    actionEvidenceCapturePayloadNamespaces: uniqueValues(getStageActionEvidenceCaptureFields(stage).map((field) => field.payloadNamespace)),
    actionEvidenceCapturePayloadNamespaceCount: uniqueValues(getStageActionEvidenceCaptureFields(stage).map((field) => field.payloadNamespace)).length,
    actionEvidenceCapturePayloadTemplate: buildEvidenceCapturePayloadTemplate(getStageActionEvidenceCaptureFields(stage)),
    actionEvidenceCapturePayloadFlatTemplate: buildEvidenceCapturePayloadFlatTemplate(getStageActionEvidenceCaptureFields(stage)),
    actionEvidenceCapturePayloadBindings: buildEvidenceCapturePayloadBindings(getStageActionEvidenceCaptureFields(stage)),
    actionEvidenceCaptureValidationSpecs: buildEvidenceCaptureValidationSpecs(getStageActionEvidenceCaptureFields(stage)),
    actionEvidenceCaptureInitialValidationStates: buildEvidenceCaptureInitialValidationStates(getStageActionEvidenceCaptureFields(stage)),
    actionEvidenceCaptureInitialValidationDisplayMetadata: buildEvidenceCaptureInitialValidationDisplayMetadata(getStageActionEvidenceCaptureFields(stage)),
    actionEvidenceCaptureInitialValidationChecklist: buildEvidenceCaptureInitialValidationChecklist(getStageActionEvidenceCaptureFields(stage)),
    actionEvidenceCaptureInitialValidationChecklistSummary: buildEvidenceCaptureInitialValidationChecklistSummary(getStageActionEvidenceCaptureFields(stage)),
    actionEvidenceCaptureInitialValidationSummary: buildEvidenceCaptureInitialValidationSummary(getStageActionEvidenceCaptureFields(stage)),
    actionEvidenceCaptureFieldInputTypes: getStageActionEvidenceCaptureFields(stage).map((field) => field.inputType),
    actionEvidenceCaptureFieldValueShapes: getStageActionEvidenceCaptureFields(stage).map((field) => field.valueShape),
    actionEvidenceCaptureFieldAcceptsMultiple: getStageActionEvidenceCaptureFields(stage).map((field) => field.acceptsMultiple),
    actionEvidenceCaptureFieldDefaultValues: getStageActionEvidenceCaptureFields(stage).map((field) => field.defaultValue),
    actionEvidenceCaptureFieldEmptyValues: getStageActionEvidenceCaptureFields(stage).map((field) => field.emptyValue),
    actionEvidenceCaptureFieldValidationRules: getStageActionEvidenceCaptureFields(stage).map((field) => field.validationRule),
    actionEvidenceCaptureFieldMinLengths: getStageActionEvidenceCaptureFields(stage).map((field) => field.minLength),
    actionEvidenceCaptureFieldExamples: getStageActionEvidenceCaptureFields(stage).map((field) => field.example),
    actionEvidenceCaptureFieldValidationHints: getStageActionEvidenceCaptureFields(stage).map((field) => field.validationHint),
    actionRequiredEvidenceCaptureFieldKeys: getStageActionEvidenceCaptureFields(stage).filter((field) => field.required).map((field) => field.key),
    actionOptionalEvidenceCaptureFieldKeys: getStageActionEvidenceCaptureFields(stage).filter((field) => !field.required).map((field) => field.key),
    actionEvidenceCaptureFieldCount: getStageActionEvidenceCaptureFields(stage).length,
    actionRequiredEvidenceCaptureFieldCount: getStageActionEvidenceCaptureFields(stage).filter((field) => field.required).length,
    actionOptionalEvidenceCaptureFieldCount: getStageActionEvidenceCaptureFields(stage).filter((field) => !field.required).length,
    actionHasEvidenceCaptureFields: getStageActionEvidenceCaptureFields(stage).length > 0,
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
  }));
  const stageKeys = stages.map((stage) => stage.key);
  const stageByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage]));
  const stageLabelByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.label]));
  const stageSummaryByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.reason]));
  const stageActionTypeByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionType]));
  const stageActionLabelByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionLabel]));
  const stageActionInstructionsByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionInstruction]));
  const stageActionButtonLabelsByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionButtonLabel]));
  const stageActionAffordanceByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionAffordance]));
  const stageActionEnabledByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEnabled]));
  const stageActionStatusByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionStatus]));
  const stageActionStatusLabelsByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionStatusLabel]));
  const stageActionStatusToneByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionStatusTone]));
  const stageActionDisabledReasonCodeByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionDisabledReasonCode]));
  const stageActionDisabledReasonByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionDisabledReason]));
  const stageActionPrerequisiteKeysByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionPrerequisiteKeys]));
  const stageActionPrerequisiteLabelsByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionPrerequisiteLabels]));
  const stageActionPrerequisiteCountByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionPrerequisiteCount]));
  const stageActionHasPrerequisitesByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionHasPrerequisites]));
  const stageActionDependencyReasonCodeByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionDependencyReasonCode]));
  const stageActionDependencyReasonByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionDependencyReason]));
  const stageActionBlockedStageKeysByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionBlockedStageKeys]));
  const stageActionBlockedStageLabelsByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionBlockedStageLabels]));
  const stageActionBlockedStageCountByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionBlockedStageCount]));
  const stageActionBlocksStagesByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionBlocksStages]));
  const stageActionCompletionCriteriaByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionCompletionCriteria]));
  const stageActionCompletionCriteriaCountByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionCompletionCriteriaCount]));
  const stageActionHasCompletionCriteriaByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionHasCompletionCriteria]));
  const stageActionEvidenceRequirementsByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceRequirements]));
  const stageActionEvidenceRequirementCountByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceRequirementCount]));
  const stageActionRequiresEvidenceByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionRequiresEvidence]));
  const stageActionEvidenceTargetByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceTarget]));
  const stageActionEvidenceTargetLabelByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceTargetLabel]));
  const stageActionEvidenceCaptureFieldsByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureFields]));
  const stageActionEvidenceCaptureFieldKeysByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureFieldKeys]));
  const stageActionEvidenceCaptureFieldLabelsByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureFieldLabels]));
  const stageActionEvidenceCaptureFieldPlaceholdersByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureFieldPlaceholders]));
  const stageActionEvidenceCaptureFieldRequirementLabelsByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureFieldRequirementLabels]));
  const stageActionEvidenceCaptureFieldAriaLabelsByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureFieldAriaLabels]));
  const stageActionEvidenceCaptureFieldHelpTextsByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureFieldHelpTexts]));
  const stageActionEvidenceCaptureFieldSectionKeysByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureFieldSectionKeys]));
  const stageActionEvidenceCaptureFieldSectionLabelsByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureFieldSectionLabels]));
  const stageActionEvidenceCaptureSectionKeysByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureSectionKeys]));
  const stageActionEvidenceCaptureSectionLabelsByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureSectionLabels]));
  const stageActionEvidenceCaptureSectionCountByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureSectionCount]));
  const stageActionEvidenceCaptureFieldPayloadNamespacesByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureFieldPayloadNamespaces]));
  const stageActionEvidenceCaptureFieldPayloadPathsByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureFieldPayloadPaths]));
  const stageActionEvidenceCapturePayloadNamespacesByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCapturePayloadNamespaces]));
  const stageActionEvidenceCapturePayloadNamespaceCountByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCapturePayloadNamespaceCount]));
  const stageActionEvidenceCapturePayloadTemplateByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCapturePayloadTemplate]));
  const stageActionEvidenceCapturePayloadFlatTemplateByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCapturePayloadFlatTemplate]));
  const stageActionEvidenceCapturePayloadBindingsByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCapturePayloadBindings]));
  const stageActionEvidenceCaptureValidationSpecsByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureValidationSpecs]));
  const stageActionEvidenceCaptureInitialValidationStatesByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureInitialValidationStates]));
  const stageActionEvidenceCaptureInitialValidationDisplayMetadataByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureInitialValidationDisplayMetadata]));
  const stageActionEvidenceCaptureInitialValidationChecklistByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureInitialValidationChecklist]));
  const stageActionEvidenceCaptureInitialValidationChecklistSummaryByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureInitialValidationChecklistSummary]));
  const stageActionEvidenceCaptureInitialValidationSummaryByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureInitialValidationSummary]));
  const stageHumanLines = stages.map((stage) => formatBundleHandoffOperatorRunbookStageLine(
    stage,
    stageActionEvidenceCaptureInitialValidationChecklistSummaryByKey[stage.key],
  ));
  const stageHumanLineByKey = Object.fromEntries(stages.map((stage, index) => [stage.key, stageHumanLines[index]]));
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
  const stageHumanLineDisplayRowByKey = Object.fromEntries(stageHumanLineDisplayRows.map((row) => [row.key, row]));
  const stageHumanLineDisplayRowKeysByActionStatus = {
    ready: stageHumanLineDisplayRows.filter((row) => row.actionStatus === "ready").map((row) => row.key),
    optional: stageHumanLineDisplayRows.filter((row) => row.actionStatus === "optional").map((row) => row.key),
    manual: stageHumanLineDisplayRows.filter((row) => row.actionStatus === "manual").map((row) => row.key),
    blocked: stageHumanLineDisplayRows.filter((row) => row.actionStatus === "blocked").map((row) => row.key),
  };
  const stageHumanLineDisplayRowKeysByEvidenceProgressStatus = {
    blocked: stageHumanLineDisplayRows.filter((row) => row.evidenceProgressStatus === "blocked").map((row) => row.key),
    ready: stageHumanLineDisplayRows.filter((row) => row.evidenceProgressStatus === "ready").map((row) => row.key),
  };
  const stageHumanLineDisplayRowSummary = {
    count: stageHumanLineDisplayRows.length,
    byKeyCount: Object.keys(stageHumanLineDisplayRowByKey).length,
    requiredCount: stageHumanLineDisplayRows.filter((row) => row.required).length,
    optionalCount: stageHumanLineDisplayRows.filter((row) => !row.required).length,
    commandCount: stageHumanLineDisplayRows.filter((row) => row.commandCount > 0).length,
    manualCount: stageHumanLineDisplayRows.filter((row) => row.manual).length,
    readyActionStatusCount: stageHumanLineDisplayRows.filter((row) => row.actionStatus === "ready").length,
    optionalActionStatusCount: stageHumanLineDisplayRows.filter((row) => row.actionStatus === "optional").length,
    manualActionStatusCount: stageHumanLineDisplayRows.filter((row) => row.actionStatus === "manual").length,
    blockedActionStatusCount: stageHumanLineDisplayRows.filter((row) => row.actionStatus === "blocked").length,
    evidenceProgressCount: stageHumanLineDisplayRows.filter((row) => row.hasEvidenceProgress).length,
    blockedEvidenceProgressCount: stageHumanLineDisplayRows.filter((row) => row.evidenceProgressStatus === "blocked").length,
    readyEvidenceProgressCount: stageHumanLineDisplayRows.filter((row) => row.evidenceProgressStatus === "ready").length,
    firstRowKey: stageHumanLineDisplayRows[0]?.key || "",
    firstReadyActionRowKey: stageHumanLineDisplayRows.find((row) => row.actionStatus === "ready")?.key || "",
    firstOptionalActionRowKey: stageHumanLineDisplayRows.find((row) => row.actionStatus === "optional")?.key || "",
    firstManualActionRowKey: stageHumanLineDisplayRows.find((row) => row.actionStatus === "manual")?.key || "",
    firstBlockedEvidenceProgressRowKey: stageHumanLineDisplayRows.find((row) => row.evidenceProgressStatus === "blocked")?.key || "",
    firstReadyEvidenceProgressRowKey: stageHumanLineDisplayRows.find((row) => row.evidenceProgressStatus === "ready")?.key || "",
  };
  const stageHumanLineSummary = {
    count: stageHumanLines.length,
    byKeyCount: Object.keys(stageHumanLineByKey).length,
    requiredCount: stages.filter((stage) => stage.required).length,
    optionalCount: stages.filter((stage) => !stage.required).length,
    commandCount: stages.filter((stage) => stage.commandCount > 0).length,
    manualCount: stages.filter((stage) => stage.commandCount === 0).length,
    evidenceProgressCount: stageActionRows.filter((stage) => stage.actionEvidenceCaptureInitialValidationChecklistSummary.itemCount > 0).length,
    blockedEvidenceProgressCount: stageActionRows.filter((stage) => stage.actionEvidenceCaptureInitialValidationChecklistSummary.status === "blocked").length,
    readyEvidenceProgressCount: stageActionRows.filter((stage) => stage.actionEvidenceCaptureInitialValidationChecklistSummary.status === "ready").length,
    firstStageKey: stages[0]?.key || "",
    firstLine: stageHumanLines[0] || "",
    firstEvidenceProgressStageKey: stageActionRows.find((stage) => stage.actionEvidenceCaptureInitialValidationChecklistSummary.itemCount > 0)?.key || "",
    firstBlockedEvidenceProgressStageKey: stageActionRows.find((stage) => stage.actionEvidenceCaptureInitialValidationChecklistSummary.status === "blocked")?.key || "",
  };
  const stageActionEvidenceCaptureFieldInputTypesByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureFieldInputTypes]));
  const stageActionEvidenceCaptureFieldValueShapesByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureFieldValueShapes]));
  const stageActionEvidenceCaptureFieldAcceptsMultipleByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureFieldAcceptsMultiple]));
  const stageActionEvidenceCaptureFieldDefaultValuesByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureFieldDefaultValues]));
  const stageActionEvidenceCaptureFieldEmptyValuesByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureFieldEmptyValues]));
  const stageActionEvidenceCaptureFieldValidationRulesByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureFieldValidationRules]));
  const stageActionEvidenceCaptureFieldMinLengthsByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureFieldMinLengths]));
  const stageActionEvidenceCaptureFieldExamplesByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureFieldExamples]));
  const stageActionEvidenceCaptureFieldValidationHintsByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureFieldValidationHints]));
  const stageActionRequiredEvidenceCaptureFieldKeysByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionRequiredEvidenceCaptureFieldKeys]));
  const stageActionOptionalEvidenceCaptureFieldKeysByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionOptionalEvidenceCaptureFieldKeys]));
  const stageActionEvidenceCaptureFieldCountByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionEvidenceCaptureFieldCount]));
  const stageActionRequiredEvidenceCaptureFieldCountByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionRequiredEvidenceCaptureFieldCount]));
  const stageActionOptionalEvidenceCaptureFieldCountByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionOptionalEvidenceCaptureFieldCount]));
  const stageActionHasEvidenceCaptureFieldsByKey = Object.fromEntries(stageActionRows.map((stage) => [stage.key, stage.actionHasEvidenceCaptureFields]));
  const stageKindByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.kind]));
  const stageRequiredByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.required]));
  const stageRunPolicyByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.runPolicy]));
  const stageSafetyLevelByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.safetyLevel]));
  const stageCommandCountByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.commandCount]));
  const stageCommandKeysByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.commandKeys]));
  const stageCommandLabelsByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.commands.map((command) => command.label)]));
  const stageCommandStringsByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.commands.map((command) => command.command)]));
  const stageCommandArgsByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.commands.map((command) => command.commandArgs)]));
  const stageCommandRunPoliciesByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.commands.map((command) => command.runPolicy)]));
  const stageCommandSafetyLevelsByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.commands.map((command) => command.safety?.safetyLevel || "")]));
  const stageOutputFilesByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.outputFiles]));
  const stageHasCommandsByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.commandCount > 0]));
  const stageManualByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.commandCount === 0]));
  const stageWritesLocalFileByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.writesLocalFile]));
  const stageExternalCallsByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.externalCalls]));
  const stageTargetRepoMutationByKey = Object.fromEntries(stages.map((stage) => [stage.key, stage.targetRepoMutation]));
  const commandStageKeys = commandStages.map((stage) => stage.key);
  const manualStageKeys = stages.filter((stage) => stage.commandCount === 0).map((stage) => stage.key);
  const nextStageKey = "verifySourceBundle";
  const nextCommandKey = "source.bundleCheck.strict";
  const nextStage = stageByKey[nextStageKey] || null;
  const nextStageActionRow = stageActionRows.find((stage) => stage.key === nextStageKey) || null;
  const nextCommandEntry = commandByKey.get(nextCommandKey) || null;
  const countBy = (predicate) => stages.filter(predicate).length;
  const firstStageKey = (predicate) => stages.find(predicate)?.key || "";
  const actionSummary = {
    totalActionCount: stages.length,
    commandActionCount: commandStages.length,
    manualActionCount: countBy((stage) => stage.commandCount === 0),
    enabledActionCount: stageActionRows.filter((stage) => stage.actionEnabled).length,
    disabledActionCount: stageActionRows.filter((stage) => !stage.actionEnabled).length,
    manualDisabledActionCount: stageActionRows.filter((stage) => !stage.actionEnabled && stage.manual).length,
    actionWithPrerequisiteCount: stageActionRows.filter((stage) => stage.actionHasPrerequisites).length,
    maxActionPrerequisiteCount: Math.max(0, ...stageActionRows.map((stage) => stage.actionPrerequisiteCount)),
    actionWithDependencyReasonCount: stageActionRows.filter((stage) => stage.actionDependencyReasonCode).length,
    actionBlockingOtherActionCount: stageActionRows.filter((stage) => stage.actionBlocksStages).length,
    maxActionBlockedStageCount: Math.max(0, ...stageActionRows.map((stage) => stage.actionBlockedStageCount)),
    actionWithCompletionCriteriaCount: stageActionRows.filter((stage) => stage.actionHasCompletionCriteria).length,
    totalActionCompletionCriteriaCount: stageActionRows.reduce((sum, stage) => sum + stage.actionCompletionCriteriaCount, 0),
    maxActionCompletionCriteriaCount: Math.max(0, ...stageActionRows.map((stage) => stage.actionCompletionCriteriaCount)),
    actionRequiringEvidenceCount: stageActionRows.filter((stage) => stage.actionRequiresEvidence).length,
    totalActionEvidenceRequirementCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceRequirementCount, 0),
    maxActionEvidenceRequirementCount: Math.max(0, ...stageActionRows.map((stage) => stage.actionEvidenceRequirementCount)),
    localCommandEvidenceActionCount: stageActionRows.filter((stage) => stage.actionEvidenceTarget === "local-command-output").length,
    localOutputEvidenceActionCount: stageActionRows.filter((stage) => stage.actionEvidenceTarget === "local-output-file").length,
    targetRepoEvidenceActionCount: stageActionRows.filter((stage) => stage.actionEvidenceTarget === "target-repo-working-tree").length,
    handoffRecordEvidenceActionCount: stageActionRows.filter((stage) => stage.actionEvidenceTarget === "handoff-evidence-record").length,
    actionWithEvidenceCaptureFieldCount: stageActionRows.filter((stage) => stage.actionHasEvidenceCaptureFields).length,
    actionWithRequiredEvidenceCaptureFieldCount: stageActionRows.filter((stage) => stage.actionRequiredEvidenceCaptureFieldCount > 0).length,
    actionWithOptionalEvidenceCaptureFieldCount: stageActionRows.filter((stage) => stage.actionOptionalEvidenceCaptureFieldCount > 0).length,
    totalActionEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFieldCount, 0),
    totalRequiredActionEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionRequiredEvidenceCaptureFieldCount, 0),
    totalOptionalActionEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionOptionalEvidenceCaptureFieldCount, 0),
    maxActionEvidenceCaptureFieldCount: Math.max(0, ...stageActionRows.map((stage) => stage.actionEvidenceCaptureFieldCount)),
    textareaEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFields.filter((field) => field.inputType === "textarea").length, 0),
    textEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFields.filter((field) => field.inputType === "text").length, 0),
    filePathEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFields.filter((field) => field.inputType === "file-path").length, 0),
    listEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFields.filter((field) => field.inputType === "list").length, 0),
    longTextEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFields.filter((field) => field.valueShape === "long-text").length, 0),
    shortTextEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFields.filter((field) => field.valueShape === "short-text").length, 0),
    filePathValueEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFields.filter((field) => field.valueShape === "file-path").length, 0),
    stringListEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFields.filter((field) => field.valueShape === "string-list").length, 0),
    multiValueEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFields.filter((field) => field.acceptsMultiple).length, 0),
    singleValueEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFields.filter((field) => !field.acceptsMultiple).length, 0),
    emptyStringEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFields.filter((field) => field.emptyValue === "").length, 0),
    emptyListEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFields.filter((field) => Array.isArray(field.emptyValue)).length, 0),
    placeholderEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFields.filter((field) => field.placeholder).length, 0),
    ariaLabelEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFields.filter((field) => field.ariaLabel).length, 0),
    helpTextEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFields.filter((field) => field.helpText).length, 0),
    sectionedEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFields.filter((field) => field.sectionKey).length, 0),
    uniqueEvidenceCaptureSectionCount: uniqueValues(stageActionRows.flatMap((stage) => stage.actionEvidenceCaptureSectionKeys)).length,
    actionWithMultipleEvidenceCaptureSectionCount: stageActionRows.filter((stage) => stage.actionEvidenceCaptureSectionCount > 1).length,
    maxActionEvidenceCaptureSectionCount: Math.max(0, ...stageActionRows.map((stage) => stage.actionEvidenceCaptureSectionCount)),
    payloadMappedEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFields.filter((field) => field.payloadPath).length, 0),
    uniqueEvidenceCapturePayloadNamespaceCount: uniqueValues(stageActionRows.flatMap((stage) => stage.actionEvidenceCapturePayloadNamespaces)).length,
    actionWithMultipleEvidenceCapturePayloadNamespaceCount: stageActionRows.filter((stage) => stage.actionEvidenceCapturePayloadNamespaceCount > 1).length,
    maxActionEvidenceCapturePayloadNamespaceCount: Math.max(0, ...stageActionRows.map((stage) => stage.actionEvidenceCapturePayloadNamespaceCount)),
    actionWithEvidenceCapturePayloadTemplateCount: stageActionRows.filter((stage) => Object.keys(stage.actionEvidenceCapturePayloadFlatTemplate).length > 0).length,
    evidenceCapturePayloadTemplatePathCount: stageActionRows.reduce((sum, stage) => sum + Object.keys(stage.actionEvidenceCapturePayloadFlatTemplate).length, 0),
    maxActionEvidenceCapturePayloadTemplatePathCount: Math.max(0, ...stageActionRows.map((stage) => Object.keys(stage.actionEvidenceCapturePayloadFlatTemplate).length)),
    actionWithEvidenceCapturePayloadBindingCount: stageActionRows.filter((stage) => stage.actionEvidenceCapturePayloadBindings.length > 0).length,
    evidenceCapturePayloadBindingCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCapturePayloadBindings.length, 0),
    requiredEvidenceCapturePayloadBindingCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCapturePayloadBindings.filter((binding) => binding.required).length, 0),
    optionalEvidenceCapturePayloadBindingCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCapturePayloadBindings.filter((binding) => !binding.required).length, 0),
    multiValueEvidenceCapturePayloadBindingCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCapturePayloadBindings.filter((binding) => binding.acceptsMultiple).length, 0),
    actionWithEvidenceCaptureValidationSpecCount: stageActionRows.filter((stage) => stage.actionEvidenceCaptureValidationSpecs.length > 0).length,
    evidenceCaptureValidationSpecCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureValidationSpecs.length, 0),
    requiredEvidenceCaptureValidationSpecCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureValidationSpecs.filter((spec) => spec.required).length, 0),
    optionalEvidenceCaptureValidationSpecCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureValidationSpecs.filter((spec) => !spec.required).length, 0),
    errorEvidenceCaptureValidationSpecCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureValidationSpecs.filter((spec) => spec.severity === "error").length, 0),
    infoEvidenceCaptureValidationSpecCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureValidationSpecs.filter((spec) => spec.severity === "info").length, 0),
    multiValueEvidenceCaptureValidationSpecCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureValidationSpecs.filter((spec) => spec.acceptsMultiple).length, 0),
    actionWithEvidenceCaptureInitialValidationStateCount: stageActionRows.filter((stage) => stage.actionEvidenceCaptureInitialValidationStates.length > 0).length,
    evidenceCaptureInitialValidationStateCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationStates.length, 0),
    validInitialEvidenceCaptureStateCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationStates.filter((state) => state.valid).length, 0),
    invalidInitialEvidenceCaptureStateCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationStates.filter((state) => !state.valid).length, 0),
    blockingInitialEvidenceCaptureStateCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationStates.filter((state) => state.blocking).length, 0),
    optionalEmptyInitialEvidenceCaptureStateCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationStates.filter((state) => state.status === "optional-empty").length, 0),
    missingRequiredInitialEvidenceCaptureStateCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationStates.filter((state) => state.status === "missing-required").length, 0),
    pristineInitialEvidenceCaptureStateCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationStates.filter((state) => !state.dirty && !state.touched).length, 0),
    actionWithEvidenceCaptureInitialValidationDisplayMetadataCount: stageActionRows.filter((stage) => stage.actionEvidenceCaptureInitialValidationDisplayMetadata.length > 0).length,
    evidenceCaptureInitialValidationDisplayMetadataCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationDisplayMetadata.length, 0),
    dangerInitialEvidenceCaptureDisplayMetadataCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationDisplayMetadata.filter((display) => display.statusTone === "danger").length, 0),
    infoInitialEvidenceCaptureDisplayMetadataCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationDisplayMetadata.filter((display) => display.statusTone === "info").length, 0),
    blockingInitialEvidenceCaptureDisplayMetadataCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationDisplayMetadata.filter((display) => display.blocking).length, 0),
    nonBlockingInitialEvidenceCaptureDisplayMetadataCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationDisplayMetadata.filter((display) => !display.blocking).length, 0),
    actionWithEvidenceCaptureInitialValidationSummaryCount: stageActionRows.filter((stage) => stage.actionEvidenceCaptureInitialValidationSummary.fieldCount > 0).length,
    blockedInitialEvidenceCaptureSummaryActionCount: stageActionRows.filter((stage) => stage.actionEvidenceCaptureInitialValidationSummary.status === "blocked").length,
    readyInitialEvidenceCaptureSummaryActionCount: stageActionRows.filter((stage) => stage.actionEvidenceCaptureInitialValidationSummary.status === "ready").length,
    completableInitialEvidenceCaptureSummaryActionCount: stageActionRows.filter((stage) => stage.actionEvidenceCaptureInitialValidationSummary.canCompleteInitially).length,
    nonCompletableInitialEvidenceCaptureSummaryActionCount: stageActionRows.filter((stage) => !stage.actionEvidenceCaptureInitialValidationSummary.canCompleteInitially).length,
    initialEvidenceCaptureSummaryBlockingFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationSummary.blockingCount, 0),
    initialEvidenceCaptureSummaryMissingRequiredFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationSummary.missingRequiredCount, 0),
    initialEvidenceCaptureSummaryOptionalEmptyFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationSummary.optionalEmptyCount, 0),
    actionWithEvidenceCaptureInitialValidationChecklistCount: stageActionRows.filter((stage) => stage.actionEvidenceCaptureInitialValidationChecklist.length > 0).length,
    evidenceCaptureInitialValidationChecklistItemCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationChecklist.length, 0),
    checkedInitialEvidenceCaptureChecklistItemCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationChecklist.filter((item) => item.checkedInitially).length, 0),
    uncheckedInitialEvidenceCaptureChecklistItemCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationChecklist.filter((item) => !item.checkedInitially).length, 0),
    blockingInitialEvidenceCaptureChecklistItemCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationChecklist.filter((item) => item.completionBlocking).length, 0),
    nonBlockingInitialEvidenceCaptureChecklistItemCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationChecklist.filter((item) => !item.completionBlocking).length, 0),
    requiredInitialEvidenceCaptureChecklistItemCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationChecklist.filter((item) => item.required).length, 0),
    optionalInitialEvidenceCaptureChecklistItemCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationChecklist.filter((item) => !item.required).length, 0),
    actionWithEvidenceCaptureInitialValidationChecklistSummaryCount: stageActionRows.filter((stage) => stage.actionEvidenceCaptureInitialValidationChecklistSummary.itemCount > 0).length,
    blockedInitialEvidenceCaptureChecklistSummaryActionCount: stageActionRows.filter((stage) => stage.actionEvidenceCaptureInitialValidationChecklistSummary.status === "blocked").length,
    readyInitialEvidenceCaptureChecklistSummaryActionCount: stageActionRows.filter((stage) => stage.actionEvidenceCaptureInitialValidationChecklistSummary.status === "ready").length,
    completeInitialEvidenceCaptureChecklistSummaryActionCount: stageActionRows.filter((stage) => stage.actionEvidenceCaptureInitialValidationChecklistSummary.allCheckedInitially).length,
    incompleteInitialEvidenceCaptureChecklistSummaryActionCount: stageActionRows.filter((stage) => !stage.actionEvidenceCaptureInitialValidationChecklistSummary.allCheckedInitially).length,
    initialEvidenceCaptureChecklistSummaryCheckedItemCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationChecklistSummary.checkedCount, 0),
    initialEvidenceCaptureChecklistSummaryUncheckedItemCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationChecklistSummary.uncheckedCount, 0),
    initialEvidenceCaptureChecklistSummaryBlockingUncheckedItemCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureInitialValidationChecklistSummary.blockingUncheckedCount, 0),
    humanLineCount: stageHumanLineSummary.count,
    humanLineByKeyCount: stageHumanLineSummary.byKeyCount,
    humanLineWithEvidenceProgressCount: stageHumanLineSummary.evidenceProgressCount,
    humanLineWithBlockedEvidenceProgressCount: stageHumanLineSummary.blockedEvidenceProgressCount,
    humanLineWithReadyEvidenceProgressCount: stageHumanLineSummary.readyEvidenceProgressCount,
    humanLineDisplayRowCount: stageHumanLineDisplayRows.length,
    humanLineDisplayRowByKeyCount: Object.keys(stageHumanLineDisplayRowByKey).length,
    humanLineDisplayRowWithEvidenceProgressCount: stageHumanLineDisplayRows.filter((row) => row.hasEvidenceProgress).length,
    humanLineDisplayRowWithBlockedEvidenceProgressCount: stageHumanLineDisplayRowSummary.blockedEvidenceProgressCount,
    humanLineDisplayRowWithReadyEvidenceProgressCount: stageHumanLineDisplayRowSummary.readyEvidenceProgressCount,
    humanLineDisplayRowReadyActionCount: stageHumanLineDisplayRowSummary.readyActionStatusCount,
    humanLineDisplayRowManualActionCount: stageHumanLineDisplayRowSummary.manualActionStatusCount,
    validatedEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFields.filter((field) => field.validationRule).length, 0),
    requiredValidatedEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFields.filter((field) => field.required && field.validationRule).length, 0),
    optionalValidatedEvidenceCaptureFieldCount: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFields.filter((field) => !field.required && field.validationRule).length, 0),
    minEvidenceCaptureFieldLengthTotal: stageActionRows.reduce((sum, stage) => sum + stage.actionEvidenceCaptureFields.reduce((fieldSum, field) => fieldSum + field.minLength, 0), 0),
    maxEvidenceCaptureFieldMinLength: Math.max(0, ...stageActionRows.flatMap((stage) => stage.actionEvidenceCaptureFields.map((field) => field.minLength))),
    requiredActionCount: countBy((stage) => stage.required),
    optionalActionCount: countBy((stage) => !stage.required),
    readOnlyActionCount: countBy((stage) => stage.runPolicy === "read-only"),
    localOutputActionCount: countBy((stage) => stage.runPolicy === "writes-local-file"),
    outputFileActionCount: countBy((stage) => stage.outputFiles.length > 0),
    externalCallActionCount: countBy((stage) => stage.externalCalls),
    targetRepoMutationActionCount: countBy((stage) => stage.targetRepoMutation),
    nextActionKey: nextStageKey,
    nextActionType: nextStageActionRow?.actionType || "",
    nextActionLabel: nextStageActionRow?.actionLabel || "",
    nextActionEnabled: nextStageActionRow?.actionEnabled === true,
    nextActionStatus: nextStageActionRow?.actionStatus || "",
    nextActionStatusLabel: nextStageActionRow?.actionStatusLabel || "",
    nextActionStatusTone: nextStageActionRow?.actionStatusTone || "",
    nextActionDisabledReasonCode: nextStageActionRow?.actionDisabledReasonCode || "",
    nextActionPrerequisiteKeys: nextStageActionRow?.actionPrerequisiteKeys || [],
    nextActionPrerequisiteLabels: nextStageActionRow?.actionPrerequisiteLabels || [],
    nextActionPrerequisiteCount: nextStageActionRow?.actionPrerequisiteCount || 0,
    nextActionHasPrerequisites: nextStageActionRow?.actionHasPrerequisites === true,
    nextActionDependencyReasonCode: nextStageActionRow?.actionDependencyReasonCode || "",
    nextActionDependencyReason: nextStageActionRow?.actionDependencyReason || "",
    nextActionBlockedStageKeys: nextStageActionRow?.actionBlockedStageKeys || [],
    nextActionBlockedStageLabels: nextStageActionRow?.actionBlockedStageLabels || [],
    nextActionBlockedStageCount: nextStageActionRow?.actionBlockedStageCount || 0,
    nextActionBlocksStages: nextStageActionRow?.actionBlocksStages === true,
    nextActionCompletionCriteria: nextStageActionRow?.actionCompletionCriteria || [],
    nextActionCompletionCriteriaCount: nextStageActionRow?.actionCompletionCriteriaCount || 0,
    nextActionHasCompletionCriteria: nextStageActionRow?.actionHasCompletionCriteria === true,
    nextActionEvidenceRequirements: nextStageActionRow?.actionEvidenceRequirements || [],
    nextActionEvidenceRequirementCount: nextStageActionRow?.actionEvidenceRequirementCount || 0,
    nextActionRequiresEvidence: nextStageActionRow?.actionRequiresEvidence === true,
    nextActionEvidenceTarget: nextStageActionRow?.actionEvidenceTarget || "",
    nextActionEvidenceTargetLabel: nextStageActionRow?.actionEvidenceTargetLabel || "",
    nextActionEvidenceCaptureFields: nextStageActionRow?.actionEvidenceCaptureFields || [],
    nextActionEvidenceCaptureFieldKeys: nextStageActionRow?.actionEvidenceCaptureFieldKeys || [],
    nextActionEvidenceCaptureFieldLabels: nextStageActionRow?.actionEvidenceCaptureFieldLabels || [],
    nextActionEvidenceCaptureFieldPlaceholders: nextStageActionRow?.actionEvidenceCaptureFieldPlaceholders || [],
    nextActionEvidenceCaptureFieldRequirementLabels: nextStageActionRow?.actionEvidenceCaptureFieldRequirementLabels || [],
    nextActionEvidenceCaptureFieldAriaLabels: nextStageActionRow?.actionEvidenceCaptureFieldAriaLabels || [],
    nextActionEvidenceCaptureFieldHelpTexts: nextStageActionRow?.actionEvidenceCaptureFieldHelpTexts || [],
    nextActionEvidenceCaptureFieldSectionKeys: nextStageActionRow?.actionEvidenceCaptureFieldSectionKeys || [],
    nextActionEvidenceCaptureFieldSectionLabels: nextStageActionRow?.actionEvidenceCaptureFieldSectionLabels || [],
    nextActionEvidenceCaptureSectionKeys: nextStageActionRow?.actionEvidenceCaptureSectionKeys || [],
    nextActionEvidenceCaptureSectionLabels: nextStageActionRow?.actionEvidenceCaptureSectionLabels || [],
    nextActionEvidenceCaptureSectionCount: nextStageActionRow?.actionEvidenceCaptureSectionCount || 0,
    nextActionEvidenceCaptureFieldPayloadNamespaces: nextStageActionRow?.actionEvidenceCaptureFieldPayloadNamespaces || [],
    nextActionEvidenceCaptureFieldPayloadPaths: nextStageActionRow?.actionEvidenceCaptureFieldPayloadPaths || [],
    nextActionEvidenceCapturePayloadNamespaces: nextStageActionRow?.actionEvidenceCapturePayloadNamespaces || [],
    nextActionEvidenceCapturePayloadNamespaceCount: nextStageActionRow?.actionEvidenceCapturePayloadNamespaceCount || 0,
    nextActionEvidenceCapturePayloadTemplate: nextStageActionRow?.actionEvidenceCapturePayloadTemplate || {},
    nextActionEvidenceCapturePayloadFlatTemplate: nextStageActionRow?.actionEvidenceCapturePayloadFlatTemplate || {},
    nextActionEvidenceCapturePayloadBindings: nextStageActionRow?.actionEvidenceCapturePayloadBindings || [],
    nextActionEvidenceCaptureValidationSpecs: nextStageActionRow?.actionEvidenceCaptureValidationSpecs || [],
    nextActionEvidenceCaptureInitialValidationStates: nextStageActionRow?.actionEvidenceCaptureInitialValidationStates || [],
    nextActionEvidenceCaptureInitialValidationDisplayMetadata: nextStageActionRow?.actionEvidenceCaptureInitialValidationDisplayMetadata || [],
    nextActionEvidenceCaptureInitialValidationChecklist: nextStageActionRow?.actionEvidenceCaptureInitialValidationChecklist || [],
    nextActionEvidenceCaptureInitialValidationChecklistSummary: nextStageActionRow?.actionEvidenceCaptureInitialValidationChecklistSummary || {},
    nextActionEvidenceCaptureInitialValidationSummary: nextStageActionRow?.actionEvidenceCaptureInitialValidationSummary || {},
    nextActionEvidenceCaptureFieldInputTypes: nextStageActionRow?.actionEvidenceCaptureFieldInputTypes || [],
    nextActionEvidenceCaptureFieldValueShapes: nextStageActionRow?.actionEvidenceCaptureFieldValueShapes || [],
    nextActionEvidenceCaptureFieldAcceptsMultiple: nextStageActionRow?.actionEvidenceCaptureFieldAcceptsMultiple || [],
    nextActionEvidenceCaptureFieldDefaultValues: nextStageActionRow?.actionEvidenceCaptureFieldDefaultValues || [],
    nextActionEvidenceCaptureFieldEmptyValues: nextStageActionRow?.actionEvidenceCaptureFieldEmptyValues || [],
    nextActionEvidenceCaptureFieldValidationRules: nextStageActionRow?.actionEvidenceCaptureFieldValidationRules || [],
    nextActionEvidenceCaptureFieldMinLengths: nextStageActionRow?.actionEvidenceCaptureFieldMinLengths || [],
    nextActionEvidenceCaptureFieldExamples: nextStageActionRow?.actionEvidenceCaptureFieldExamples || [],
    nextActionEvidenceCaptureFieldValidationHints: nextStageActionRow?.actionEvidenceCaptureFieldValidationHints || [],
    nextActionRequiredEvidenceCaptureFieldKeys: nextStageActionRow?.actionRequiredEvidenceCaptureFieldKeys || [],
    nextActionOptionalEvidenceCaptureFieldKeys: nextStageActionRow?.actionOptionalEvidenceCaptureFieldKeys || [],
    nextActionEvidenceCaptureFieldCount: nextStageActionRow?.actionEvidenceCaptureFieldCount || 0,
    nextActionRequiredEvidenceCaptureFieldCount: nextStageActionRow?.actionRequiredEvidenceCaptureFieldCount || 0,
    nextActionOptionalEvidenceCaptureFieldCount: nextStageActionRow?.actionOptionalEvidenceCaptureFieldCount || 0,
    nextActionHasEvidenceCaptureFields: nextStageActionRow?.actionHasEvidenceCaptureFields === true,
    nextActionRunPolicy: nextStage?.runPolicy || "",
    nextActionSafetyLevel: nextStage?.safetyLevel || "",
    firstRequiredCommandStageKey: firstStageKey((stage) => stage.required && stage.commandCount > 0),
    firstLocalOutputStageKey: firstStageKey((stage) => stage.writesLocalFile),
    firstManualStageKey: firstStageKey((stage) => stage.commandCount === 0),
    firstRequiredManualStageKey: firstStageKey((stage) => stage.required && stage.commandCount === 0),
    firstEvidenceStageKey: firstStageKey((stage) => stage.kind === "manual-reporting"),
    firstActionWithPrerequisiteKey: stageActionRows.find((stage) => stage.actionHasPrerequisites)?.key || "",
    firstManualActionWithPrerequisiteKey: stageActionRows.find((stage) => stage.manual && stage.actionHasPrerequisites)?.key || "",
    firstEvidenceActionWithPrerequisiteKey: stageActionRows.find((stage) => stage.actionType === "manual-evidence" && stage.actionHasPrerequisites)?.key || "",
    firstActionWithDependencyReasonKey: stageActionRows.find((stage) => stage.actionDependencyReasonCode)?.key || "",
    firstActionBlockingOtherActionKey: stageActionRows.find((stage) => stage.actionBlocksStages)?.key || "",
    firstActionWithCompletionCriteriaKey: stageActionRows.find((stage) => stage.actionHasCompletionCriteria)?.key || "",
    firstManualActionWithCompletionCriteriaKey: stageActionRows.find((stage) => stage.manual && stage.actionHasCompletionCriteria)?.key || "",
    firstActionRequiringEvidenceKey: stageActionRows.find((stage) => stage.actionRequiresEvidence)?.key || "",
    firstManualActionRequiringEvidenceKey: stageActionRows.find((stage) => stage.manual && stage.actionRequiresEvidence)?.key || "",
    firstEvidenceRecordingActionKey: stageActionRows.find((stage) => stage.actionType === "manual-evidence" && stage.actionRequiresEvidence)?.key || "",
    firstTargetRepoEvidenceActionKey: stageActionRows.find((stage) => stage.actionEvidenceTarget === "target-repo-working-tree")?.key || "",
    firstLocalOutputEvidenceActionKey: stageActionRows.find((stage) => stage.actionEvidenceTarget === "local-output-file")?.key || "",
    firstActionWithEvidenceCaptureFieldKey: stageActionRows.find((stage) => stage.actionHasEvidenceCaptureFields)?.key || "",
    firstActionWithOptionalEvidenceCaptureFieldKey: stageActionRows.find((stage) => stage.actionOptionalEvidenceCaptureFieldCount > 0)?.key || "",
    firstManualActionWithEvidenceCaptureFieldKey: stageActionRows.find((stage) => stage.manual && stage.actionHasEvidenceCaptureFields)?.key || "",
    firstTextareaEvidenceCaptureActionKey: stageActionRows.find((stage) => stage.actionEvidenceCaptureFields.some((field) => field.inputType === "textarea"))?.key || "",
    firstMultiValueEvidenceCaptureActionKey: stageActionRows.find((stage) => stage.actionEvidenceCaptureFields.some((field) => field.acceptsMultiple))?.key || "",
    firstValidationRuleEvidenceCaptureActionKey: stageActionRows.find((stage) => stage.actionEvidenceCaptureFields.some((field) => field.validationRule))?.key || "",
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
      hasEvidenceProgress: (nextStageActionRow?.actionEvidenceCaptureInitialValidationChecklistSummary?.itemCount || 0) > 0,
      evidenceProgressStatus: nextStageActionRow?.actionEvidenceCaptureInitialValidationChecklistSummary?.status || "",
      evidenceProgressLabel: nextStageActionRow?.actionEvidenceCaptureInitialValidationChecklistSummary?.progressLabel || "",
      firstUncheckedEvidenceItemLabel: nextStageActionRow?.actionEvidenceCaptureInitialValidationChecklistSummary?.firstUncheckedItemLabel || "",
    } : {},
    nextStageActionType: nextStageActionRow?.actionType || "",
    nextStageActionLabel: nextStageActionRow?.actionLabel || "",
    nextStageActionInstruction: nextStageActionRow?.actionInstruction || "",
    nextStageActionButtonLabel: nextStageActionRow?.actionButtonLabel || "",
    nextStageActionAffordance: nextStageActionRow?.actionAffordance || "",
    nextStageActionEnabled: nextStageActionRow?.actionEnabled === true,
    nextStageActionStatus: nextStageActionRow?.actionStatus || "",
    nextStageActionStatusLabel: nextStageActionRow?.actionStatusLabel || "",
    nextStageActionStatusTone: nextStageActionRow?.actionStatusTone || "",
    nextStageActionDisabledReasonCode: nextStageActionRow?.actionDisabledReasonCode || "",
    nextStageActionDisabledReason: nextStageActionRow?.actionDisabledReason || "",
    nextStageActionPrerequisiteKeys: nextStageActionRow?.actionPrerequisiteKeys || [],
    nextStageActionPrerequisiteLabels: nextStageActionRow?.actionPrerequisiteLabels || [],
    nextStageActionPrerequisiteCount: nextStageActionRow?.actionPrerequisiteCount || 0,
    nextStageActionHasPrerequisites: nextStageActionRow?.actionHasPrerequisites === true,
    nextStageActionDependencyReasonCode: nextStageActionRow?.actionDependencyReasonCode || "",
    nextStageActionDependencyReason: nextStageActionRow?.actionDependencyReason || "",
    nextStageActionBlockedStageKeys: nextStageActionRow?.actionBlockedStageKeys || [],
    nextStageActionBlockedStageLabels: nextStageActionRow?.actionBlockedStageLabels || [],
    nextStageActionBlockedStageCount: nextStageActionRow?.actionBlockedStageCount || 0,
    nextStageActionBlocksStages: nextStageActionRow?.actionBlocksStages === true,
    nextStageActionCompletionCriteria: nextStageActionRow?.actionCompletionCriteria || [],
    nextStageActionCompletionCriteriaCount: nextStageActionRow?.actionCompletionCriteriaCount || 0,
    nextStageActionHasCompletionCriteria: nextStageActionRow?.actionHasCompletionCriteria === true,
    nextStageActionEvidenceRequirements: nextStageActionRow?.actionEvidenceRequirements || [],
    nextStageActionEvidenceRequirementCount: nextStageActionRow?.actionEvidenceRequirementCount || 0,
    nextStageActionRequiresEvidence: nextStageActionRow?.actionRequiresEvidence === true,
    nextStageActionEvidenceTarget: nextStageActionRow?.actionEvidenceTarget || "",
    nextStageActionEvidenceTargetLabel: nextStageActionRow?.actionEvidenceTargetLabel || "",
    nextStageActionEvidenceCaptureFields: nextStageActionRow?.actionEvidenceCaptureFields || [],
    nextStageActionEvidenceCaptureFieldKeys: nextStageActionRow?.actionEvidenceCaptureFieldKeys || [],
    nextStageActionEvidenceCaptureFieldLabels: nextStageActionRow?.actionEvidenceCaptureFieldLabels || [],
    nextStageActionEvidenceCaptureFieldPlaceholders: nextStageActionRow?.actionEvidenceCaptureFieldPlaceholders || [],
    nextStageActionEvidenceCaptureFieldRequirementLabels: nextStageActionRow?.actionEvidenceCaptureFieldRequirementLabels || [],
    nextStageActionEvidenceCaptureFieldAriaLabels: nextStageActionRow?.actionEvidenceCaptureFieldAriaLabels || [],
    nextStageActionEvidenceCaptureFieldHelpTexts: nextStageActionRow?.actionEvidenceCaptureFieldHelpTexts || [],
    nextStageActionEvidenceCaptureFieldSectionKeys: nextStageActionRow?.actionEvidenceCaptureFieldSectionKeys || [],
    nextStageActionEvidenceCaptureFieldSectionLabels: nextStageActionRow?.actionEvidenceCaptureFieldSectionLabels || [],
    nextStageActionEvidenceCaptureSectionKeys: nextStageActionRow?.actionEvidenceCaptureSectionKeys || [],
    nextStageActionEvidenceCaptureSectionLabels: nextStageActionRow?.actionEvidenceCaptureSectionLabels || [],
    nextStageActionEvidenceCaptureSectionCount: nextStageActionRow?.actionEvidenceCaptureSectionCount || 0,
    nextStageActionEvidenceCaptureFieldPayloadNamespaces: nextStageActionRow?.actionEvidenceCaptureFieldPayloadNamespaces || [],
    nextStageActionEvidenceCaptureFieldPayloadPaths: nextStageActionRow?.actionEvidenceCaptureFieldPayloadPaths || [],
    nextStageActionEvidenceCapturePayloadNamespaces: nextStageActionRow?.actionEvidenceCapturePayloadNamespaces || [],
    nextStageActionEvidenceCapturePayloadNamespaceCount: nextStageActionRow?.actionEvidenceCapturePayloadNamespaceCount || 0,
    nextStageActionEvidenceCapturePayloadTemplate: nextStageActionRow?.actionEvidenceCapturePayloadTemplate || {},
    nextStageActionEvidenceCapturePayloadFlatTemplate: nextStageActionRow?.actionEvidenceCapturePayloadFlatTemplate || {},
    nextStageActionEvidenceCapturePayloadBindings: nextStageActionRow?.actionEvidenceCapturePayloadBindings || [],
    nextStageActionEvidenceCaptureValidationSpecs: nextStageActionRow?.actionEvidenceCaptureValidationSpecs || [],
    nextStageActionEvidenceCaptureInitialValidationStates: nextStageActionRow?.actionEvidenceCaptureInitialValidationStates || [],
    nextStageActionEvidenceCaptureInitialValidationDisplayMetadata: nextStageActionRow?.actionEvidenceCaptureInitialValidationDisplayMetadata || [],
    nextStageActionEvidenceCaptureInitialValidationChecklist: nextStageActionRow?.actionEvidenceCaptureInitialValidationChecklist || [],
    nextStageActionEvidenceCaptureInitialValidationChecklistSummary: nextStageActionRow?.actionEvidenceCaptureInitialValidationChecklistSummary || {},
    nextStageActionEvidenceCaptureInitialValidationSummary: nextStageActionRow?.actionEvidenceCaptureInitialValidationSummary || {},
    nextStageActionEvidenceCaptureFieldInputTypes: nextStageActionRow?.actionEvidenceCaptureFieldInputTypes || [],
    nextStageActionEvidenceCaptureFieldValueShapes: nextStageActionRow?.actionEvidenceCaptureFieldValueShapes || [],
    nextStageActionEvidenceCaptureFieldAcceptsMultiple: nextStageActionRow?.actionEvidenceCaptureFieldAcceptsMultiple || [],
    nextStageActionEvidenceCaptureFieldDefaultValues: nextStageActionRow?.actionEvidenceCaptureFieldDefaultValues || [],
    nextStageActionEvidenceCaptureFieldEmptyValues: nextStageActionRow?.actionEvidenceCaptureFieldEmptyValues || [],
    nextStageActionEvidenceCaptureFieldValidationRules: nextStageActionRow?.actionEvidenceCaptureFieldValidationRules || [],
    nextStageActionEvidenceCaptureFieldMinLengths: nextStageActionRow?.actionEvidenceCaptureFieldMinLengths || [],
    nextStageActionEvidenceCaptureFieldExamples: nextStageActionRow?.actionEvidenceCaptureFieldExamples || [],
    nextStageActionEvidenceCaptureFieldValidationHints: nextStageActionRow?.actionEvidenceCaptureFieldValidationHints || [],
    nextStageActionRequiredEvidenceCaptureFieldKeys: nextStageActionRow?.actionRequiredEvidenceCaptureFieldKeys || [],
    nextStageActionOptionalEvidenceCaptureFieldKeys: nextStageActionRow?.actionOptionalEvidenceCaptureFieldKeys || [],
    nextStageActionEvidenceCaptureFieldCount: nextStageActionRow?.actionEvidenceCaptureFieldCount || 0,
    nextStageActionRequiredEvidenceCaptureFieldCount: nextStageActionRow?.actionRequiredEvidenceCaptureFieldCount || 0,
    nextStageActionOptionalEvidenceCaptureFieldCount: nextStageActionRow?.actionOptionalEvidenceCaptureFieldCount || 0,
    nextStageActionHasEvidenceCaptureFields: nextStageActionRow?.actionHasEvidenceCaptureFields === true,
    nextStageKind: nextStage?.kind || "",
    nextStageRequired: nextStage?.required === true,
    nextStageRunPolicy: nextStage?.runPolicy || "",
    nextStageSafetyLevel: nextStage?.safetyLevel || "",
    nextStageCommandCount: nextStage?.commandCount || 0,
    nextStageCommandLabels: nextStage?.commands?.map((command) => command.label) || [],
    nextStageCommands: nextStage?.commands?.map((command) => command.command) || [],
    nextStageCommandArgsList: nextStage?.commands?.map((command) => command.commandArgs) || [],
    nextStageCommandRunPolicies: nextStage?.commands?.map((command) => command.runPolicy) || [],
    nextStageCommandSafetyLevels: nextStage?.commands?.map((command) => command.safety?.safetyLevel || "") || [],
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
