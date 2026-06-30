// Command and safety helpers for Website Improvement handoff bundles.

export function shellQuote(value) {
  const text = String(value || "");
  if (/^[A-Za-z0-9_./:@%+=,-]+$/.test(text)) return text;
  return `'${text.replaceAll("'", "'\"'\"'")}'`;
}

export function commandFromArgs(args) {
  return args.map((arg) => shellQuote(arg)).join(" ");
}

export function taskHandoffOutFile(task) {
  return `target-repo-${task.id}-handoff.md`;
}

export function buildBundleTaskHandoffCommandArgs(directory, task, { strict = false } = {}) {
  const args = [
    "design-ai",
    "site",
    String(directory || ""),
    "--bundle-handoff",
    "--task",
    String(task.id || ""),
  ];
  if (strict) args.push("--strict");
  args.push("--out", taskHandoffOutFile(task));
  return args;
}

export function buildBundleTaskHandoffCommand(directory, task, options = {}) {
  return commandFromArgs(buildBundleTaskHandoffCommandArgs(directory, task, options));
}

export function buildBundleTaskHandoffCommandSafety(task, { strict = false } = {}) {
  return {
    runPolicy: "writes-local-file",
    safetyLevel: "local-output-file",
    writesLocalFile: true,
    outputFile: taskHandoffOutFile(task),
    mutates: "local-output-file-only",
    externalCalls: false,
    targetRepoMutation: false,
    requiresCleanWorkspace: false,
    requiresReviewBeforeMutation: false,
    strict: Boolean(strict),
  };
}

export function buildBundleSourceCommandSafety({ strict = false } = {}) {
  return {
    runPolicy: "read-only",
    safetyLevel: "local-read-only",
    writesLocalFile: false,
    outputFile: "",
    mutates: "none",
    externalCalls: false,
    targetRepoMutation: false,
    requiresCleanWorkspace: false,
    requiresReviewBeforeMutation: false,
    strict: Boolean(strict),
  };
}

export function buildBundleCheckCommandArgs(directory, { strict = false } = {}) {
  const args = [
    "design-ai",
    "site",
    String(directory || ""),
    "--bundle-check",
  ];
  if (strict) args.push("--strict");
  args.push("--json");
  return args;
}

export function buildBundleCheckCommand(directory, options = {}) {
  return commandFromArgs(buildBundleCheckCommandArgs(directory, options));
}

export function buildBundleHandoffCommandArgs(directory, { strict = false } = {}) {
  const args = [
    "design-ai",
    "site",
    String(directory || ""),
    "--bundle-handoff",
  ];
  if (strict) args.push("--strict");
  args.push("--json");
  return args;
}

export function buildBundleHandoffCommand(directory, options = {}) {
  return commandFromArgs(buildBundleHandoffCommandArgs(directory, options));
}
