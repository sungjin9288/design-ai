// Evidence capture helpers for Website Improvement bundle handoff runbooks.

export function getEvidenceCaptureFieldValueShape(field) {
  return {
    textarea: "long-text",
    text: "short-text",
    "file-path": "file-path",
    list: "string-list",
  }[field.inputType] || "text";
}

export function getEvidenceCaptureFieldEmptyValue(field) {
  return field.inputType === "list" ? [] : "";
}

export function getEvidenceCaptureFieldRequirementLabel(field) {
  return field.required ? "Required" : "Optional";
}

export function getEvidenceCaptureFieldAriaLabel(field) {
  return `${field.label} evidence (${field.required ? "required" : "optional"})`;
}

export function getEvidenceCaptureFieldHelpText(field) {
  return field.validationHint || field.placeholder || "";
}

export function getEvidenceCaptureFieldSectionKey(field) {
  return {
    strictBundleCheckOutput: "source-bundle-verification",
    bundleDigest: "source-bundle-verification",
    handoffJsonSnapshot: "handoff-snapshot",
    promptOutputFile: "handoff-prompt-output",
    selectedTaskId: "handoff-prompt-output",
    targetRepoChangedFiles: "target-repo-changes",
    targetRepoVerificationResults: "target-repo-verification",
    viewportAccessibilityNotes: "viewport-accessibility-qa",
    finalEvidenceRecord: "final-handoff-evidence",
    remainingRisks: "risk-record",
  }[field.key] || "general-evidence";
}

export function getEvidenceCaptureFieldSectionLabel(field) {
  return {
    "source-bundle-verification": "Source bundle verification",
    "handoff-snapshot": "Handoff snapshot",
    "handoff-prompt-output": "Handoff prompt output",
    "target-repo-changes": "Target repo changes",
    "target-repo-verification": "Target repo verification",
    "viewport-accessibility-qa": "Viewport and accessibility QA",
    "final-handoff-evidence": "Final handoff evidence",
    "risk-record": "Risk record",
    "general-evidence": "General evidence",
  }[getEvidenceCaptureFieldSectionKey(field)];
}

export function getEvidenceCaptureFieldPayloadNamespace(field) {
  return {
    strictBundleCheckOutput: "sourceBundle",
    bundleDigest: "sourceBundle",
    handoffJsonSnapshot: "handoffSnapshot",
    promptOutputFile: "handoffPrompt",
    selectedTaskId: "handoffPrompt",
    targetRepoChangedFiles: "targetRepo",
    targetRepoVerificationResults: "targetRepo",
    viewportAccessibilityNotes: "targetRepo",
    finalEvidenceRecord: "handoffEvidence",
    remainingRisks: "handoffEvidence",
  }[field.key] || "evidence";
}

export function getEvidenceCaptureFieldPayloadPath(field) {
  return {
    strictBundleCheckOutput: "sourceBundle.verification.strictBundleCheckOutput",
    bundleDigest: "sourceBundle.verification.bundleDigest",
    handoffJsonSnapshot: "handoffSnapshot.strictJson",
    promptOutputFile: "handoffPrompt.outputFile",
    selectedTaskId: "handoffPrompt.selectedTaskId",
    targetRepoChangedFiles: "targetRepo.changedFiles",
    targetRepoVerificationResults: "targetRepo.verificationResults",
    viewportAccessibilityNotes: "targetRepo.viewportAccessibilityNotes",
    finalEvidenceRecord: "handoffEvidence.finalRecord",
    remainingRisks: "handoffEvidence.remainingRisks",
  }[field.key] || `evidence.${field.key || "unknown"}`;
}

export function uniqueValues(values) {
  return Array.from(new Set(values));
}

export function cloneEvidenceCaptureValue(value) {
  return Array.isArray(value) ? [...value] : value;
}

function setPayloadTemplateValue(target, payloadPath, value) {
  const pathParts = String(payloadPath || "").split(".").filter(Boolean);
  if (pathParts.length === 0) {
    return target;
  }
  let cursor = target;
  pathParts.slice(0, -1).forEach((part) => {
    if (!cursor[part] || typeof cursor[part] !== "object" || Array.isArray(cursor[part])) {
      cursor[part] = {};
    }
    cursor = cursor[part];
  });
  cursor[pathParts[pathParts.length - 1]] = cloneEvidenceCaptureValue(value);
  return target;
}

export function buildEvidenceCapturePayloadTemplate(fields) {
  return fields.reduce(
    (template, field) => setPayloadTemplateValue(template, field.payloadPath, field.emptyValue),
    {},
  );
}

export function buildEvidenceCapturePayloadFlatTemplate(fields) {
  return Object.fromEntries(
    fields.map((field) => [field.payloadPath, cloneEvidenceCaptureValue(field.emptyValue)]),
  );
}

export function buildEvidenceCapturePayloadBindings(fields) {
  return fields.map((field) => ({
    key: field.key,
    label: field.label,
    payloadNamespace: field.payloadNamespace,
    payloadPath: field.payloadPath,
    inputType: field.inputType,
    valueShape: field.valueShape,
    acceptsMultiple: field.acceptsMultiple,
    required: field.required,
    requirementLabel: field.requirementLabel,
    emptyValue: cloneEvidenceCaptureValue(field.emptyValue),
    validationRule: field.validationRule,
    minLength: field.minLength,
    sectionKey: field.sectionKey,
    sectionLabel: field.sectionLabel,
    ariaLabel: field.ariaLabel,
  }));
}

function getEvidenceCaptureValidationFailureMessage(field) {
  return field.required
    ? `Provide ${field.label.toLowerCase()} before marking this action complete.`
    : `Optional: provide ${field.label.toLowerCase()} when available.`;
}

export function buildEvidenceCaptureValidationSpecs(fields) {
  return fields.map((field) => ({
    key: field.key,
    label: field.label,
    rule: field.validationRule,
    severity: field.required ? "error" : "info",
    required: field.required,
    allowsEmpty: !field.required,
    minLength: field.minLength,
    valueShape: field.valueShape,
    acceptsMultiple: field.acceptsMultiple,
    emptyValue: cloneEvidenceCaptureValue(field.emptyValue),
    message: field.validationHint,
    failureMessage: getEvidenceCaptureValidationFailureMessage(field),
  }));
}

function getEvidenceCaptureInitialValidationDisplay(status) {
  return {
    "missing-required": {
      statusLabel: "Missing required",
      statusTone: "danger",
      iconName: "alert-circle",
      actionLabel: "Provide evidence",
      helperText: "Required before completion",
    },
    "optional-empty": {
      statusLabel: "Optional empty",
      statusTone: "info",
      iconName: "info",
      actionLabel: "Add optional evidence",
      helperText: "Can remain empty",
    },
  }[status] || {
    statusLabel: "Unknown",
    statusTone: "neutral",
    iconName: "circle",
    actionLabel: "Review",
    helperText: "Review this field",
  };
}

export function buildEvidenceCaptureInitialValidationStates(fields) {
  return fields.map((field) => {
    const status = field.required ? "missing-required" : "optional-empty";
    const display = getEvidenceCaptureInitialValidationDisplay(status);
    return {
      key: field.key,
      label: field.label,
      rule: field.validationRule,
      status,
      statusLabel: display.statusLabel,
      statusTone: display.statusTone,
      iconName: display.iconName,
      actionLabel: display.actionLabel,
      helperText: display.helperText,
      valid: !field.required,
      blocking: field.required,
      severity: field.required ? "error" : "info",
      required: field.required,
      allowsEmpty: !field.required,
      touched: false,
      dirty: false,
      valuePresent: false,
      valueLength: 0,
      minLength: field.minLength,
      valueShape: field.valueShape,
      acceptsMultiple: field.acceptsMultiple,
      emptyValue: cloneEvidenceCaptureValue(field.emptyValue),
      payloadPath: field.payloadPath,
      message: field.required
        ? getEvidenceCaptureValidationFailureMessage(field)
        : field.validationHint,
    };
  });
}

export function buildEvidenceCaptureInitialValidationDisplayMetadata(fields) {
  return buildEvidenceCaptureInitialValidationStates(fields).map((state) => ({
    key: state.key,
    label: state.label,
    status: state.status,
    statusLabel: state.statusLabel,
    statusTone: state.statusTone,
    iconName: state.iconName,
    actionLabel: state.actionLabel,
    helperText: state.helperText,
    blocking: state.blocking,
    required: state.required,
    message: state.message,
  }));
}

export function buildEvidenceCaptureInitialValidationChecklist(fields) {
  return buildEvidenceCaptureInitialValidationStates(fields).map((state) => ({
    key: state.key,
    label: state.label,
    status: state.status,
    statusLabel: state.statusLabel,
    statusTone: state.statusTone,
    iconName: state.iconName,
    actionLabel: state.actionLabel,
    helperText: state.helperText,
    required: state.required,
    blocking: state.blocking,
    completionBlocking: state.blocking,
    checkedInitially: state.valid,
    disabled: false,
    message: state.message,
    payloadPath: state.payloadPath,
  }));
}

export function buildEvidenceCaptureInitialValidationChecklistSummary(fields) {
  const checklist = buildEvidenceCaptureInitialValidationChecklist(fields);
  const checkedItems = checklist.filter((item) => item.checkedInitially);
  const uncheckedItems = checklist.filter((item) => !item.checkedInitially);
  const blockingItems = checklist.filter((item) => item.completionBlocking);
  const blockingUncheckedItems = checklist.filter((item) => item.completionBlocking && !item.checkedInitially);
  const firstUncheckedItem = uncheckedItems[0];
  const status = blockingUncheckedItems.length > 0 ? "blocked" : "ready";
  const completionPercent = checklist.length > 0
    ? Math.round((checkedItems.length / checklist.length) * 100)
    : 100;
  return {
    status,
    statusLabel: status === "blocked" ? "Checklist blocked" : "Checklist ready",
    statusTone: status === "blocked" ? "danger" : "success",
    iconName: status === "blocked" ? "list-x" : "list-checks",
    actionLabel: status === "blocked" ? "Complete required evidence" : "Continue",
    helperText: status === "blocked"
      ? `${blockingUncheckedItems.length} required checklist item(s) need evidence before completion.`
      : "No required checklist items are unchecked on first render.",
    itemCount: checklist.length,
    checkedCount: checkedItems.length,
    uncheckedCount: uncheckedItems.length,
    requiredCount: checklist.filter((item) => item.required).length,
    optionalCount: checklist.filter((item) => !item.required).length,
    blockingCount: blockingItems.length,
    blockingUncheckedCount: blockingUncheckedItems.length,
    nonBlockingCount: checklist.filter((item) => !item.completionBlocking).length,
    completionPercent,
    progressLabel: `${checkedItems.length}/${checklist.length} complete`,
    allCheckedInitially: uncheckedItems.length === 0,
    hasUncheckedItems: uncheckedItems.length > 0,
    hasBlockingUncheckedItems: blockingUncheckedItems.length > 0,
    canCompleteInitially: blockingUncheckedItems.length === 0,
    firstUncheckedItemKey: firstUncheckedItem?.key || "",
    firstUncheckedItemLabel: firstUncheckedItem?.label || "",
    firstUncheckedItemMessage: firstUncheckedItem?.message || "",
  };
}

export function buildEvidenceCaptureInitialValidationSummary(fields) {
  const states = buildEvidenceCaptureInitialValidationStates(fields);
  const blockingStates = states.filter((state) => state.blocking);
  const firstBlockingState = blockingStates[0];
  const status = blockingStates.length > 0 ? "blocked" : "ready";
  return {
    status,
    statusLabel: status === "blocked" ? "Blocked by required evidence" : "Ready for completion",
    statusTone: status === "blocked" ? "danger" : "success",
    iconName: status === "blocked" ? "alert-circle" : "check-circle",
    actionLabel: status === "blocked" ? "Provide required evidence" : "Continue",
    helperText: status === "blocked"
      ? `${blockingStates.length} required evidence field(s) need input before completion.`
      : "No required evidence is missing on first render.",
    fieldCount: states.length,
    requiredCount: states.filter((state) => state.required).length,
    optionalCount: states.filter((state) => !state.required).length,
    validCount: states.filter((state) => state.valid).length,
    invalidCount: states.filter((state) => !state.valid).length,
    blockingCount: blockingStates.length,
    nonBlockingCount: states.filter((state) => !state.blocking).length,
    missingRequiredCount: states.filter((state) => state.status === "missing-required").length,
    optionalEmptyCount: states.filter((state) => state.status === "optional-empty").length,
    dangerDisplayCount: states.filter((state) => state.statusTone === "danger").length,
    infoDisplayCount: states.filter((state) => state.statusTone === "info").length,
    allFieldsPristine: states.every((state) => !state.dirty && !state.touched),
    canCompleteInitially: blockingStates.length === 0,
    firstBlockingFieldKey: firstBlockingState?.key || "",
    firstBlockingFieldLabel: firstBlockingState?.label || "",
    firstBlockingMessage: firstBlockingState?.message || "",
  };
}
