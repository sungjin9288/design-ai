// CLI argument parsing for `design-ai workspace`.

import { unknownOptionMessage } from "./suggest.mjs";

export const WORKSPACE_OPTIONS = [
  "-h",
  "--help",
  "--json",
  "--strict",
  "--root",
  "--learning-file",
  "--learning-usage",
  "--learning-eval",
];

export function parseWorkspaceArgs(args) {
  const flags = {
    help: false,
    json: false,
    strict: false,
    root: "",
    learningFilePath: "",
    learningUsagePath: "",
    learningEvalPath: "",
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "-h" || arg === "--help") {
      flags.help = true;
      continue;
    }
    if (arg === "--json") {
      flags.json = true;
      continue;
    }
    if (arg === "--strict") {
      flags.strict = true;
      continue;
    }
    if (arg === "--root") {
      const root = args[i + 1];
      if (!root || root.startsWith("--")) throw new Error("--root expects a path");
      flags.root = root;
      i += 1;
      continue;
    }
    if (arg === "--learning-file") {
      const filePath = args[i + 1];
      if (!filePath || filePath.startsWith("--")) {
        throw new Error("--learning-file expects a path");
      }
      flags.learningFilePath = filePath;
      i += 1;
      continue;
    }
    if (arg === "--learning-usage") {
      const usagePath = args[i + 1];
      if (!usagePath || usagePath.startsWith("--")) {
        throw new Error("--learning-usage expects a path");
      }
      flags.learningUsagePath = usagePath;
      i += 1;
      continue;
    }
    if (arg === "--learning-eval") {
      const evalPath = args[i + 1];
      if (!evalPath || evalPath.startsWith("--")) {
        throw new Error("--learning-eval expects a path");
      }
      flags.learningEvalPath = evalPath;
      i += 1;
      continue;
    }

    throw new Error(
      `${unknownOptionMessage("workspace", arg, WORKSPACE_OPTIONS)}\n` +
        "Usage: design-ai workspace [--root path] [--learning-file path] [--learning-usage path] [--learning-eval path] [--strict] [--json]",
    );
  }

  return flags;
}
