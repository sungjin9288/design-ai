// Eval signal file discovery and summarization for the learning signal registry.

import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { defaultLearningFile } from "./learn.mjs";
import { worstStatus } from "./signals-shared.mjs";
import { defaultLearningEvalPath } from "./workspace.mjs";

export const DEFAULT_SIGNAL_EVAL_FILES = [
  "route-eval.json",
  "route-eval-report.json",
  "prompt-eval.json",
  "prompt-eval-report.json",
  "pack-eval.json",
  "pack-eval-report.json",
  "learning-eval.json",
  "learning-eval-report.json",
];
export function inferSignalKind(payload, filePath = "") {
  const sourceName = path.basename(filePath).toLowerCase();
  const cases = Array.isArray(payload?.cases) ? payload.cases : [];

  if (sourceName.includes("route")) return "route-eval";
  if (sourceName.includes("prompt")) return "prompt-eval";
  if (sourceName.includes("pack")) return "pack-eval";
  if (sourceName.includes("learning")) return "learning-eval";

  if (payload?.sourceRouteVersion) return "route-eval";
  if (payload?.sourcePromptVersion) return "prompt-eval";
  if (payload?.sourcePackVersion) return "pack-eval";
  if (payload?.sourceProfile) return "learning-eval";
  if (cases.some((item) => item && typeof item === "object" && "topRouteId" in item)) return "route-eval";
  if (cases.some((item) => item && typeof item === "object" && "missingPromptFragments" in item)) return "prompt-eval";
  if (cases.some((item) => item && typeof item === "object" && ("contextStatus" in item || "pack" in item))) return "pack-eval";
  if (cases.some((item) => item && typeof item === "object" && ("selectedEntryIds" in item || "expectedSelectedIds" in item))) return "learning-eval";

  return "unknown-eval";
}

export function summarizeCaseCounts(payload) {
  const summary = payload?.summary && typeof payload.summary === "object" ? payload.summary : null;
  const cases = Array.isArray(payload?.cases) ? payload.cases : [];
  if (summary) {
    return {
      caseCount: Number.isInteger(summary.total) ? summary.total : cases.length,
      passed: Number.isInteger(summary.pass) ? summary.pass : 0,
      warned: Number.isInteger(summary.warn) ? summary.warn : 0,
      failed: Number.isInteger(summary.fail) ? summary.fail : 0,
    };
  }

  return {
    caseCount: cases.length,
    passed: cases.filter((item) => item?.status === "pass").length,
    warned: cases.filter((item) => item?.status === "warn").length,
    failed: cases.filter((item) => item?.status === "fail").length,
  };
}

export function summarizeSignalEvalFile(filePath) {
  const resolvedFile = path.resolve(filePath);
  if (!existsSync(resolvedFile)) {
    return {
      file: resolvedFile,
      exists: false,
      kind: inferSignalKind(null, resolvedFile),
      shape: "missing",
      status: "missing",
      caseCount: 0,
      passed: 0,
      warned: 0,
      failed: 0,
      generatedAt: "",
      error: "",
    };
  }

  let payload = null;
  try {
    payload = JSON.parse(readFileSync(resolvedFile, "utf8"));
  } catch {
    return {
      file: resolvedFile,
      exists: true,
      kind: inferSignalKind(null, resolvedFile),
      shape: "invalid-json",
      status: "fail",
      caseCount: 0,
      passed: 0,
      warned: 0,
      failed: 0,
      generatedAt: "",
      error: "Signal eval file is not valid JSON.",
    };
  }

  const hasCases = Array.isArray(payload?.cases);
  const isReport = typeof payload?.status === "string" || Boolean(payload?.summary);
  const counts = summarizeCaseCounts(payload);
  const status = isReport
    ? String(payload.status || worstStatus([
      counts.failed > 0 ? "fail" : "",
      counts.warned > 0 ? "warn" : "",
      "pass",
    ])).trim()
    : "template";

  return {
    file: resolvedFile,
    exists: true,
    kind: inferSignalKind(payload, resolvedFile),
    shape: isReport ? "report" : "template",
    status: hasCases ? status : "fail",
    caseCount: counts.caseCount,
    passed: counts.passed,
    warned: counts.warned,
    failed: counts.failed,
    generatedAt: String(payload?.generatedAt || ""),
    error: hasCases ? "" : "Signal eval file must include a cases array.",
  };
}

export function resolveSignalFiles({ signalSource = "", root = process.cwd(), extraFiles = [] } = {}) {
  const resolvedSource = signalSource ? path.resolve(signalSource) : path.resolve(root);
  const resolvedExtraFiles = (Array.isArray(extraFiles) ? extraFiles : [])
    .filter(Boolean)
    .map((filePath) => path.resolve(filePath))
    .filter((filePath) => existsSync(filePath));
  const uniqueFiles = (files = []) => [...new Set([...files, ...resolvedExtraFiles])];
  if (existsSync(resolvedSource) && statSync(resolvedSource).isDirectory()) {
    return uniqueFiles(DEFAULT_SIGNAL_EVAL_FILES
      .map((fileName) => path.join(resolvedSource, fileName))
      .filter((filePath) => existsSync(filePath)));
  }
  if (signalSource) return uniqueFiles([resolvedSource]);
  return uniqueFiles([]);
}

export function evalReportPathForTemplate(filePath = "") {
  const resolvedFile = path.resolve(filePath);
  const dir = path.dirname(resolvedFile);
  const ext = path.extname(resolvedFile);
  const base = path.basename(resolvedFile, ext);
  if (base.endsWith("-report")) return resolvedFile;
  if (base.endsWith("-eval")) return path.join(dir, `${base}-report${ext || ".json"}`);
  return path.join(dir, `${base}-report${ext || ".json"}`);
}

export function defaultLearningEvalReportPath(filePath = defaultLearningFile()) {
  return evalReportPathForTemplate(defaultLearningEvalPath(filePath));
}

export function evalSignalEvidenceKey(file = {}) {
  return `${file.kind || "unknown-eval"}\n${path.dirname(file.file || "")}`;
}

export function summarizeEvalSignals(evalFiles = []) {
  const reportKeys = new Set(
    evalFiles
      .filter((item) => item.shape === "report")
      .map((item) => evalSignalEvidenceKey(item)),
  );
  const unresolvedTemplates = evalFiles.filter((item) => (
    item.shape === "template" && !reportKeys.has(evalSignalEvidenceKey(item))
  ));
  return {
    reports: evalFiles.filter((item) => item.shape === "report").length,
    templates: unresolvedTemplates.length,
    rawTemplates: evalFiles.filter((item) => item.shape === "template").length,
    templateFiles: unresolvedTemplates,
    failed: evalFiles.filter((item) => item.status === "fail").length,
    warned: evalFiles.filter((item) => item.status === "warn").length,
    passed: evalFiles.filter((item) => item.status === "pass").length,
  };
}
