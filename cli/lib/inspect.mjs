import { readFileSync, lstatSync, realpathSync } from "node:fs";
import path from "node:path";

import { inspectHtml } from "./design-quality-inspector.mjs";
import { unknownOptionMessage } from "./suggest.mjs";

const MAX_SOURCE_BYTES = 1_000_000;
const INSPECT_OPTIONS = ["-h", "--help", "--brief", "--name", "--locale", "--viewport", "--review-pack", "--json"];

function containsPath(parentPath, childPath) {
  const relative = path.relative(parentPath, childPath);
  return relative === "" || (!path.isAbsolute(relative) && relative !== ".." && !relative.startsWith(`..${path.sep}`));
}

function sharedPathBoundary(cwd, sourcePath) {
  let boundary = path.resolve(cwd);
  while (!containsPath(boundary, sourcePath)) {
    const parentPath = path.dirname(boundary);
    if (parentPath === boundary) return boundary;
    boundary = parentPath;
  }
  return boundary;
}

function requiredOption(args, index, option) {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${option} requires a value`);
  return value;
}

export function parseInspectArgs(args) {
  const parsed = { sourcePath: "", brief: "", name: "", locale: "en", viewports: [], reviewPack: "", json: false, help: false };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "-h" || arg === "--help") parsed.help = true;
    else if (arg === "--json") parsed.json = true;
    else if (["--brief", "--name", "--locale", "--viewport", "--review-pack"].includes(arg)) {
      const value = requiredOption(args, index, arg);
      index += 1;
      if (arg === "--brief") parsed.brief = value;
      if (arg === "--name") parsed.name = value;
      if (arg === "--locale") parsed.locale = value;
      if (arg === "--viewport") parsed.viewports.push(value);
      if (arg === "--review-pack") parsed.reviewPack = value;
    } else if (arg.startsWith("-")) {
      throw new Error(unknownOptionMessage("inspect", arg, INSPECT_OPTIONS));
    } else if (!parsed.sourcePath) {
      parsed.sourcePath = arg;
    } else {
      throw new Error(`inspect accepts one HTML source file; received unexpected argument: ${arg}`);
    }
  }
  return parsed;
}

export function readInspectSource(sourcePath, cwd = process.cwd()) {
  if (!sourcePath) throw new Error("inspect requires an HTML source file");
  const resolvedPath = path.resolve(cwd, sourcePath);
  if (![".html", ".htm"].includes(path.extname(resolvedPath).toLowerCase())) {
    throw new Error("inspect currently supports .html and .htm files only");
  }

  const stat = lstatSync(resolvedPath);
  if (stat.isSymbolicLink()) {
    throw new Error("inspect does not follow symbolic links in the source path");
  }
  if (!stat.isFile()) throw new Error("inspect source must be a regular file");

  const cwdPath = path.resolve(cwd);
  const boundary = sharedPathBoundary(realpathSync(cwdPath), realpathSync(resolvedPath));
  let currentPath = path.dirname(resolvedPath);
  while (currentPath !== cwdPath) {
    const parentPath = path.dirname(currentPath);
    const filesystemAlias = parentPath === path.parse(currentPath).root;
    if (lstatSync(currentPath).isSymbolicLink() && !filesystemAlias) {
      throw new Error("inspect does not follow symbolic links in the source path");
    }
    if (realpathSync(currentPath) === boundary) break;
    if (parentPath === currentPath) break;
    currentPath = parentPath;
  }
  if (stat.size > MAX_SOURCE_BYTES) {
    throw new Error(`inspect source exceeds the ${MAX_SOURCE_BYTES}-byte limit`);
  }

  return {
    source: readFileSync(resolvedPath, "utf8"),
    sourceRef: path.isAbsolute(sourcePath)
      ? realpathSync(resolvedPath)
      : path.normalize(sourcePath).replaceAll(path.sep, "/"),
  };
}

export function buildInspectReport(parsed, cwd = process.cwd()) {
  if (!parsed.brief) throw new Error("inspect requires --brief");
  const input = readInspectSource(parsed.sourcePath, cwd);
  return inspectHtml(input.source, {
    sourceRef: input.sourceRef,
    brief: parsed.brief,
    name: parsed.name || undefined,
    locale: parsed.locale,
    viewports: parsed.viewports.length > 0 ? parsed.viewports : undefined,
    reviewPack: parsed.reviewPack || undefined,
  });
}

export function formatInspectJson(report) {
  return JSON.stringify(report, null, 2);
}

export function renderInspectMarkdown(report) {
  const lines = [
    `# ${report.subject.name} design quality report`,
    "",
    `- Status: ${report.summary.status}`,
    `- Source: ${report.subject.source}`,
    `- Confirmed findings: ${report.summary.confirmedFindings}`,
    `- Unverified findings: ${report.summary.unverifiedFindings}`,
    `- Boundary: ${report.boundary.mode}; no target repository mutation or external write`,
    "",
    "## Findings",
    "",
  ];

  for (const finding of report.findings) {
    lines.push(
      `### ${finding.severity.toUpperCase()} ${finding.title}`,
      "",
      `- Status: ${finding.status}`,
      `- Location: ${finding.location}`,
      `- Before: ${finding.before}`,
      `- After: ${finding.after}`,
      `- Why: ${finding.why}`,
      `- Verification: ${finding.verification.join(" ")}`,
      "",
    );
  }
  lines.push("## Next action", "", report.summary.nextAction);
  return lines.join("\n");
}
