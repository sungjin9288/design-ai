// Prompt + context bundle generation for `design-ai pack`.

import { readFileSync } from "node:fs";

import { parseBriefSourceFlag } from "./brief.mjs";
import { normalizeCategory, parseLearningLimit } from "./learn.mjs";
import { parseRecallLimit } from "./recall.mjs";
import { SYMLINK_PREFIX } from "./paths.mjs";
import { parseOutputFlags } from "./output.mjs";
import { readRouteManifestVersion } from "./route.mjs";
import { buildPromptPlan } from "./prompt.mjs";
import { resolveShowFile } from "./show.mjs";
import { unknownOptionMessage } from "./suggest.mjs";

const DEFAULT_MAX_BYTES = 120_000;
const PACK_EVAL_VERSION = 1;
const PACK_OPTIONS = [
  "-h",
  "--help",
  "--json",
  "--eval-template",
  "--eval",
  "--strict",
  "--from-file",
  "--stdin",
  "--out",
  "--force",
  "--max-bytes",
  "--route",
  "--with-learning",
  "--learning-category",
  "--learning-limit",
  "--with-recall",
  "--recall-limit",
];

export function parsePackArgs(args) {
  const out = {
    briefParts: [],
    fromFile: "",
    stdin: false,
    routeId: "",
    maxBytes: DEFAULT_MAX_BYTES,
    json: false,
    outPath: "",
    force: false,
    withLearning: false,
    learningCategory: "",
    learningLimit: 0,
    withRecall: false,
    recallLimit: 0,
    evalTemplate: false,
    eval: false,
    strict: false,
    help: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "-h" || arg === "--help") {
      out.help = true;
    } else if (arg === "--json") {
      out.json = true;
    } else if (arg === "--with-learning") {
      out.withLearning = true;
    } else if (arg === "--with-recall") {
      out.withRecall = true;
    } else if (arg === "--recall-limit") {
      const limit = args[i + 1];
      if (!limit || limit.startsWith("--")) throw new Error("--recall-limit expects an integer from 1 to 20");
      try {
        out.recallLimit = parseRecallLimit(limit);
      } catch {
        throw new Error("--recall-limit expects an integer from 1 to 20");
      }
      i += 1;
    } else if (arg === "--eval-template") {
      out.evalTemplate = true;
    } else if (arg === "--eval") {
      out.eval = true;
    } else if (arg === "--strict") {
      out.strict = true;
    } else if (arg === "--learning-category") {
      const category = args[i + 1];
      if (!category || category.startsWith("--")) throw new Error("--learning-category expects a category");
      out.learningCategory = normalizeCategory(category);
      i += 1;
    } else if (arg === "--learning-limit") {
      const limit = args[i + 1];
      if (!limit || limit.startsWith("--")) throw new Error("--learning-limit expects an integer from 1 to 100");
      try {
        out.learningLimit = parseLearningLimit(limit);
      } catch {
        throw new Error("--learning-limit expects an integer from 1 to 100");
      }
      i += 1;
    } else {
      out.index = i;
      if (parseBriefSourceFlag(args, out) || parseOutputFlags(args, out)) {
        i = out.index;
        continue;
      }

      if (arg === "--max-bytes") {
        const maxBytes = Number(args[i + 1]);
        if (!Number.isInteger(maxBytes) || maxBytes < 1000 || maxBytes > 1_000_000) {
          throw new Error("--max-bytes expects an integer from 1000 to 1000000");
        }
        out.maxBytes = maxBytes;
        i += 1;
      } else if (arg === "--route") {
        const routeId = args[i + 1];
        if (!routeId || routeId.startsWith("--")) throw new Error("--route expects a route id");
        out.routeId = routeId;
        i += 1;
      } else if (arg.startsWith("--")) {
        throw new Error(unknownOptionMessage("pack", arg, PACK_OPTIONS));
      } else {
        out.briefParts.push(arg);
      }
    }
  }

  if ((out.learningCategory || out.learningLimit) && !out.withLearning) {
    throw new Error("--learning-category and --learning-limit require --with-learning");
  }
  if (out.recallLimit && !out.withRecall) {
    throw new Error("--recall-limit requires --with-recall");
  }
  if (out.eval && out.evalTemplate) {
    throw new Error("Choose either --eval-template or --eval, not both");
  }
  if (out.strict && !out.eval) {
    throw new Error("--strict can only be used with --eval");
  }
  if (out.evalTemplate && (out.briefParts.length > 0 || out.fromFile || out.stdin || out.routeId || out.withLearning || out.withRecall)) {
    throw new Error("--eval-template cannot be combined with a brief, --from-file, --stdin, --route, --with-learning, or --with-recall");
  }
  if (out.eval && (!out.fromFile && !out.stdin)) {
    throw new Error("--eval requires --from-file or --stdin");
  }
  if (out.eval && (out.briefParts.length > 0 || out.routeId || out.withLearning || out.withRecall)) {
    throw new Error("--eval cannot be combined with an inline brief, --route, --with-learning, or --with-recall");
  }

  return {
    ...out,
    index: undefined,
    brief: out.briefParts.join(" ").trim(),
  };
}

function takeUtf8(content, maxBytes) {
  const buf = Buffer.from(content, "utf8");
  if (buf.byteLength <= maxBytes) {
    return {
      content,
      bytes: buf.byteLength,
      truncated: false,
    };
  }

  const sliced = buf.subarray(0, Math.max(0, maxBytes)).toString("utf8");
  return {
    content: sliced,
    bytes: Buffer.byteLength(sliced, "utf8"),
    truncated: true,
  };
}

function buildContextSummary({ files, maxBytes, usedBytes }) {
  const includedFiles = files.filter((file) => file.included).length;
  const truncatedFiles = files.filter((file) => file.truncated).length;
  const missingFiles = files.filter((file) => file.error).length;
  const status = missingFiles === files.length
    ? "incomplete"
    : missingFiles > 0 || truncatedFiles > 0
      ? "partial"
      : "complete";

  return {
    totalFiles: files.length,
    includedFiles,
    truncatedFiles,
    missingFiles,
    usedBytes,
    maxBytes,
    remainingBytes: Math.max(0, maxBytes - usedBytes),
    usedRatio: maxBytes > 0 ? usedBytes / maxBytes : 0,
    status,
  };
}

function buildContextWarnings({ files, maxBytes, usedBytes }) {
  const warnings = [];

  for (const file of files) {
    if (file.error) {
      warnings.push(`Missing context file: ${file.path} (${file.error})`);
    } else if (file.truncated) {
      warnings.push(`Truncated context file: ${file.path} (${file.includedBytes}/${file.bytes} bytes included)`);
    }
  }

  if (usedBytes >= maxBytes && files.some((file) => file.truncated)) {
    warnings.push(`Context budget exhausted at ${usedBytes}/${maxBytes} bytes`);
  }

  return warnings;
}

export function buildPromptPack({
  brief,
  sourceRoot,
  prefix = SYMLINK_PREFIX,
  maxBytes = DEFAULT_MAX_BYTES,
  routeId = "",
  withLearning = false,
  learningFilePath = "",
  learningCategory = "",
  learningLimit = 0,
  withRecall = false,
  recallLimit = 0,
}) {
  const plan = buildPromptPlan({
    brief,
    sourceRoot,
    prefix,
    routeId,
    withLearning,
    learningFilePath,
    learningCategory,
    learningLimit,
    withRecall,
    recallLimit,
  });
  const files = [];
  let usedBytes = 0;

  for (let i = 0; i < plan.filesToRead.length; i += 1) {
    const relPath = plan.filesToRead[i];
    try {
      const resolved = resolveShowFile({ sourceRoot, target: relPath });
      const raw = readFileSync(resolved.file, "utf8");
      const rawBytes = Buffer.byteLength(raw, "utf8");
      const remaining = Math.max(0, maxBytes - usedBytes);
      const remainingFiles = plan.filesToRead.length - i;
      const fileBudget = Math.ceil(remaining / remainingFiles);
      const taken = takeUtf8(raw, fileBudget);
      usedBytes += taken.bytes;

      files.push({
        path: resolved.relPath,
        bytes: rawBytes,
        includedBytes: taken.bytes,
        included: taken.bytes > 0,
        truncated: taken.truncated || taken.bytes < rawBytes,
        content: taken.content,
      });
    } catch (err) {
      files.push({
        path: relPath,
        bytes: 0,
        includedBytes: 0,
        included: false,
        truncated: false,
        error: err.message,
        content: "",
      });
    }
  }

  const summary = buildContextSummary({ files, maxBytes, usedBytes });
  const warnings = buildContextWarnings({ files, maxBytes, usedBytes });

  return {
    brief,
    version: plan.version,
    maxBytes,
    usedBytes,
    summary,
    warnings,
    plan,
    files,
    markdown: renderPromptPack({ plan, files, summary, warnings }),
  };
}

export function formatPackJson(pack) {
  return JSON.stringify(pack, null, 2);
}

function isoTimestamp(now = new Date()) {
  return (now instanceof Date ? now : new Date(now)).toISOString();
}

export function buildPackEvalTemplate({ sourceRoot, generatedAt = new Date() } = {}) {
  return {
    version: PACK_EVAL_VERSION,
    generatedAt: isoTimestamp(generatedAt),
    sourcePackVersion: sourceRoot ? readRouteManifestVersion(sourceRoot) : "unknown",
    description: "Deterministic prompt-pack checkpoints for design-ai context bundles.",
    cases: [
      {
        id: "component-spec-pack",
        brief: "Spec a Button component API with variants, states, props, and keyboard accessibility",
        expectedRouteId: "component-spec",
        maxBytes: 400000,
        requireContextStatus: "complete",
        requiredFiles: [
          "AGENTS.md",
          "commands/component-spec.md",
          "skills/component-spec-writer/SKILL.md",
          "skills/component-spec-writer/PLAYBOOK.md",
          "knowledge/PRINCIPLES.md",
        ],
        requiredIncludedFiles: [
          "AGENTS.md",
          "commands/component-spec.md",
          "skills/component-spec-writer/PLAYBOOK.md",
        ],
      },
      {
        id: "website-improvement-pack",
        brief: "Improve a SaaS homepage with website audit, SEO, performance, MCP readiness, refactor plan, and handoff report",
        expectedRouteId: "website-improvement",
        maxBytes: 400000,
        requireContextStatus: "complete",
        requiredFiles: [
          "AGENTS.md",
          "commands/website-improvement.md",
          "skills/website-improvement/SKILL.md",
          "skills/website-improvement/PLAYBOOK.md",
          "docs/WEBSITE-IMPROVEMENT.md",
        ],
        requiredIncludedFiles: [
          "AGENTS.md",
          "commands/website-improvement.md",
          "skills/website-improvement/PLAYBOOK.md",
        ],
      },
    ],
  };
}

function packEvalStatus(counts) {
  if (counts.fail > 0) return "fail";
  if (counts.warn > 0) return "warn";
  return "pass";
}

function normalizePackEvalPayload(evalText, source = "pack-eval.json") {
  let payload;
  try {
    payload = JSON.parse(evalText);
  } catch (err) {
    throw new Error(`Could not parse pack eval JSON from ${source}: ${err.message}`);
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Pack eval payload must be a JSON object");
  }
  if (payload.version !== PACK_EVAL_VERSION) {
    throw new Error(`Pack eval payload version must be ${PACK_EVAL_VERSION}`);
  }
  if (!Array.isArray(payload.cases)) {
    throw new Error("Pack eval payload must include a cases array");
  }

  return payload;
}

function normalizeStringList(rawValue, label, id) {
  if (rawValue === undefined || rawValue === null) return [];
  if (!Array.isArray(rawValue)) {
    throw new Error(`Pack eval case ${id} ${label} must be an array`);
  }
  return rawValue.map((item) => String(item || "").trim()).filter(Boolean);
}

function normalizePackEvalCase(rawCase, index, defaultMaxBytes) {
  if (!rawCase || typeof rawCase !== "object" || Array.isArray(rawCase)) {
    throw new Error(`Pack eval case ${index + 1} must be a JSON object`);
  }

  const id = String(rawCase.id || `case-${index + 1}`).trim();
  const brief = String(rawCase.brief || "").trim();
  const expectedRouteId = String(rawCase.expectedRouteId || rawCase.expected || "").trim();
  const routeId = String(rawCase.routeId || "").trim();
  const maxBytes = rawCase.maxBytes === undefined || rawCase.maxBytes === null
    ? defaultMaxBytes
    : Number(rawCase.maxBytes);
  const requireContextStatus = String(rawCase.requireContextStatus || "").trim().toLowerCase();
  const learningCategory = String(rawCase.learningCategory || "").trim();
  const learningLimit = rawCase.learningLimit === undefined || rawCase.learningLimit === null
    ? 0
    : Number(rawCase.learningLimit);

  if (!id) throw new Error(`Pack eval case ${index + 1} is missing id`);
  if (!brief) throw new Error(`Pack eval case ${id} is missing brief`);
  if (!expectedRouteId) throw new Error(`Pack eval case ${id} is missing expectedRouteId`);
  if (!Number.isInteger(maxBytes) || maxBytes < 1000 || maxBytes > 1_000_000) {
    throw new Error(`Pack eval case ${id} maxBytes must be an integer from 1000 to 1000000`);
  }
  if (requireContextStatus && !["complete", "partial", "incomplete"].includes(requireContextStatus)) {
    throw new Error(`Pack eval case ${id} requireContextStatus must be complete, partial, or incomplete`);
  }
  if (learningLimit && (!Number.isInteger(learningLimit) || learningLimit < 1 || learningLimit > 100)) {
    throw new Error(`Pack eval case ${id} learningLimit must be an integer from 1 to 100`);
  }

  return {
    id,
    brief,
    expectedRouteId,
    routeId,
    maxBytes,
    requireContextStatus,
    requiredFiles: normalizeStringList(rawCase.requiredFiles, "requiredFiles", id),
    requiredIncludedFiles: normalizeStringList(rawCase.requiredIncludedFiles, "requiredIncludedFiles", id),
    withLearning: Boolean(rawCase.withLearning),
    requireLearningContext: Boolean(rawCase.requireLearningContext),
    learningCategory,
    learningLimit,
  };
}

function evaluatePackEvalCase(testCase, {
  sourceRoot,
  prefix = SYMLINK_PREFIX,
  learningFilePath = "",
}) {
  const pack = buildPromptPack({
    brief: testCase.brief,
    sourceRoot,
    prefix,
    maxBytes: testCase.maxBytes,
    routeId: testCase.routeId,
    withLearning: testCase.withLearning || testCase.requireLearningContext,
    learningFilePath,
    learningCategory: testCase.learningCategory,
    learningLimit: testCase.learningLimit,
  });

  const issues = [];
  const warnings = [];
  const routeId = pack?.plan?.route?.id || "";

  if (routeId !== testCase.expectedRouteId) {
    issues.push(`Expected route ${testCase.expectedRouteId}, but prompt pack selected ${routeId}.`);
  }

  const missingRequiredFiles = testCase.requiredFiles.filter((file) => !pack.plan.filesToRead.includes(file));
  if (missingRequiredFiles.length > 0) {
    issues.push(`Missing required files: ${missingRequiredFiles.join(", ")}`);
  }

  const includedPaths = pack.files.filter((file) => file.included && !file.error).map((file) => file.path);
  const missingIncludedFiles = testCase.requiredIncludedFiles.filter((file) => !includedPaths.includes(file));
  if (missingIncludedFiles.length > 0) {
    issues.push(`Missing included context files: ${missingIncludedFiles.join(", ")}`);
  }

  if (testCase.requireContextStatus && pack.summary.status !== testCase.requireContextStatus) {
    issues.push(`Expected context status ${testCase.requireContextStatus}, but got ${pack.summary.status}.`);
  } else if (!testCase.requireContextStatus && pack.summary.status !== "complete") {
    warnings.push(`Context status is ${pack.summary.status}.`);
  }

  const learningContext = pack?.plan?.learningContext || null;
  if (testCase.requireLearningContext && !learningContext) {
    issues.push("Expected learning context, but none was included.");
  } else if (testCase.withLearning && learningContext && learningContext.entries.length === 0) {
    warnings.push("Learning context was requested but selected no entries.");
  }

  const status = issues.length > 0 ? "fail" : warnings.length > 0 ? "warn" : "pass";

  return {
    id: testCase.id,
    status,
    message: issues[0] || warnings[0] || "Prompt pack matched expectations.",
    expectedRouteId: testCase.expectedRouteId,
    routeId,
    forcedRouteId: testCase.routeId,
    maxBytes: testCase.maxBytes,
    contextStatus: pack.summary.status,
    includedFiles: pack.summary.includedFiles,
    totalFiles: pack.summary.totalFiles,
    truncatedFiles: pack.summary.truncatedFiles,
    missingFiles: pack.summary.missingFiles,
    requiredFiles: testCase.requiredFiles,
    missingRequiredFiles,
    requiredIncludedFiles: testCase.requiredIncludedFiles,
    missingIncludedFiles,
    warnings: [
      ...warnings,
      ...pack.warnings,
    ],
    issues,
    brief: testCase.brief,
    pack: summarizeEvalPack(pack),
  };
}

function summarizeEvalPack(pack) {
  return {
    brief: pack.brief,
    version: pack.version,
    maxBytes: pack.maxBytes,
    usedBytes: pack.usedBytes,
    summary: pack.summary,
    warnings: pack.warnings,
    plan: pack.plan,
    files: pack.files.map((file) => ({
      path: file.path,
      bytes: file.bytes,
      includedBytes: file.includedBytes,
      included: file.included,
      truncated: file.truncated,
      error: file.error || "",
    })),
    markdownBytes: Buffer.byteLength(pack.markdown || "", "utf8"),
  };
}

export function packEvalReport({
  evalText,
  source = "pack-eval.json",
  sourceRoot,
  prefix = SYMLINK_PREFIX,
  maxBytes = DEFAULT_MAX_BYTES,
  learningFilePath = "",
  generatedAt = new Date(),
}) {
  const payload = normalizePackEvalPayload(evalText, source);
  const normalizedCases = payload.cases.map((testCase, index) => normalizePackEvalCase(testCase, index, maxBytes));
  const cases = normalizedCases.map((testCase) => evaluatePackEvalCase(testCase, {
    sourceRoot,
    prefix,
    learningFilePath,
  }));
  const counts = cases.reduce(
    (acc, testCase) => ({
      ...acc,
      [testCase.status]: acc[testCase.status] + 1,
    }),
    { pass: 0, warn: 0, fail: 0 },
  );

  return {
    version: readRouteManifestVersion(sourceRoot),
    evalVersion: payload.version,
    source,
    generatedAt: isoTimestamp(generatedAt),
    status: packEvalStatus(counts),
    summary: {
      total: cases.length,
      pass: counts.pass,
      warn: counts.warn,
      fail: counts.fail,
    },
    cases,
  };
}

function formatPercent(ratio) {
  return `${Math.round(ratio * 100)}%`;
}

export function renderPromptPack({ plan, files, summary, warnings = [] }) {
  const lines = [];
  lines.push("# design-ai prompt pack");
  lines.push("");
  lines.push(`Brief: ${plan.brief}`);
  lines.push(`Route: ${plan.route.label} (${plan.route.forced ? "forced" : plan.route.confidence})`);
  lines.push(`Context status: ${summary.status}`);
  lines.push(`Context budget: ${summary.usedBytes}/${summary.maxBytes} bytes (${formatPercent(summary.usedRatio)} used)`);
  lines.push("");
  lines.push("## Context Summary");
  lines.push("");
  lines.push(`- Files: ${summary.includedFiles}/${summary.totalFiles} included`);
  lines.push(`- Truncated files: ${summary.truncatedFiles}`);
  lines.push(`- Missing files: ${summary.missingFiles}`);
  lines.push(`- Remaining budget: ${summary.remainingBytes} bytes`);

  if (warnings.length > 0) {
    lines.push("");
    lines.push("Warnings:");
    for (const warning of warnings) {
      lines.push(`- ${warning}`);
    }
  }

  lines.push("");
  lines.push("## Prompt");
  lines.push("");
  // plan.prompt already carries the --with-recall "## Recalled design knowledge"
  // section (rendered by renderPrompt). Recall respects the byte budget by being
  // subject to the same whole-pack takeUtf8(maxBytes) truncation as everything else —
  // there is no recall-specific budget carve-out.
  lines.push(plan.prompt);
  lines.push("");
  lines.push("## Context Files");
  lines.push("");

  for (const file of files) {
    lines.push(`### ${file.path}`);
    if (file.error) {
      lines.push("");
      lines.push(`_Not included: ${file.error}_`);
      lines.push("");
      continue;
    }

    lines.push("");
    lines.push(`_Included ${file.includedBytes}/${file.bytes} bytes${file.truncated ? "; truncated" : ""}._`);
    lines.push("");
    lines.push("````markdown");
    lines.push(file.content);
    lines.push("````");
    lines.push("");
  }

  return lines.join("\n");
}
