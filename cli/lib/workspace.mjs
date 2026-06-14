// Local dogfood workspace diagnostics for `design-ai workspace`.

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  defaultLearningFile,
  defaultLearningUsageFile,
  learningEvalReport,
  listLearningRestoreBackups,
  learningStats,
  learningUsageStats,
} from "./learn.mjs";
import { DESIGN_AI_HOME } from "./paths.mjs";
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

const RELEASE_SCRIPT_NAMES = [
  "test",
  "audit:strict",
  "release:metadata",
  "release:self-test",
  "package:smoke",
  "release:check",
  "ci:local",
];

const UNIQUE_RELEASE_SCRIPT_NAMES = [...new Set(RELEASE_SCRIPT_NAMES)];
const CANONICAL_REPOSITORY_SLUG = "sungjin9288/design-ai";
const CANONICAL_REPOSITORY_URL = `https://github.com/${CANONICAL_REPOSITORY_SLUG}`;
const DEFAULT_LEARNING_EVAL_FILE = "learning-eval.json";
const DEFAULT_LEARNING_CURATION_REPORT_FILE = "learning-curation-report.md";
const DEFAULT_RESTORE_BACKUP_KEEP = 5;
const IGNORED_LOCAL_ARTIFACT_EXACT_PATHS = new Set([
  "DEV_LOG.md",
  "docs/case-study.md",
  "docs/evidence-checklist.md",
  "docs/evidence-gallery.md",
  "docs/implementation-evidence.md",
  "docs/interview-story.md",
  "docs/project-card.md",
  "docs/project-roadmap.md",
  "docs/readme-improvement.md",
  "docs/resume-bullets.md",
  "links.md",
  "portfolio_manifest.md",
]);
const IGNORED_LOCAL_ARTIFACT_PREFIXES = [
  "_portfolio_export/",
  "evidence/",
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

function runGitCommand(args, { cwd }) {
  const result = spawnSync("git", args, {
    cwd,
    encoding: "utf8",
    timeout: 5000,
  });
  return {
    ok: result.status === 0,
    status: result.status,
    stdout: result.stdout || "",
    stderr: result.stderr || "",
    error: result.error?.message || "",
  };
}

function splitLines(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean);
}

function trimOutput(result) {
  return String(result?.stdout || "").trim();
}

function parseAheadBehind(text) {
  const [behindRaw, aheadRaw] = String(text || "").trim().split(/\s+/);
  const behind = Number(behindRaw);
  const ahead = Number(aheadRaw);
  return {
    ahead: Number.isInteger(ahead) ? ahead : 0,
    behind: Number.isInteger(behind) ? behind : 0,
  };
}

function parseLastCommit(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return null;
  const [hash, ...subjectParts] = trimmed.split("\t");
  return {
    hash: hash || "",
    subject: subjectParts.join("\t").trim(),
  };
}

function parseUntrackedStatusPath(line) {
  const text = String(line || "");
  if (!text.startsWith("?? ")) return "";
  return text.slice(3).trim();
}

function isIgnoredLocalArtifactStatus(line) {
  const filePath = parseUntrackedStatusPath(line);
  if (!filePath) return false;
  if (IGNORED_LOCAL_ARTIFACT_EXACT_PATHS.has(filePath)) return true;
  return IGNORED_LOCAL_ARTIFACT_PREFIXES.some((prefix) => filePath === prefix.slice(0, -1) || filePath.startsWith(prefix));
}

function splitGitStatusShort(statusShort) {
  const activeStatusShort = [];
  const ignoredStatusShort = [];
  for (const line of statusShort) {
    if (isIgnoredLocalArtifactStatus(line)) {
      ignoredStatusShort.push(line);
    } else {
      activeStatusShort.push(line);
    }
  }
  return { activeStatusShort, ignoredStatusShort };
}

export function collectGitReport({ root = process.cwd(), gitRunner = runGitCommand } = {}) {
  const resolvedRoot = path.resolve(root);
  const base = {
    isRepo: false,
    root: resolvedRoot,
    branch: "",
    clean: true,
    upstream: "",
    ahead: 0,
    behind: 0,
    remote: "",
    lastCommit: null,
    statusShort: [],
    allStatusShort: [],
    ignoredStatusShort: [],
    ignoredLocalArtifactCount: 0,
    hasIgnoredLocalArtifacts: false,
    reason: "",
  };

  const inside = gitRunner(["rev-parse", "--is-inside-work-tree"], { cwd: resolvedRoot });
  if (!inside.ok || trimOutput(inside) !== "true") {
    return {
      ...base,
      reason: inside.error || trimOutput(inside) || String(inside.stderr || "").trim() || "not a git repository",
    };
  }

  const repoRootResult = gitRunner(["rev-parse", "--show-toplevel"], { cwd: resolvedRoot });
  const repoRoot = repoRootResult.ok && trimOutput(repoRootResult)
    ? trimOutput(repoRootResult)
    : resolvedRoot;
  const branchResult = gitRunner(["branch", "--show-current"], { cwd: repoRoot });
  const statusResult = gitRunner(["status", "--short"], { cwd: repoRoot });
  const upstreamResult = gitRunner(["rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"], {
    cwd: repoRoot,
  });
  const remoteResult = gitRunner(["config", "--get", "remote.origin.url"], { cwd: repoRoot });
  const lastCommitResult = gitRunner(["log", "-1", "--pretty=%h%x09%s"], { cwd: repoRoot });

  let ahead = 0;
  let behind = 0;
  if (upstreamResult.ok && trimOutput(upstreamResult)) {
    const countsResult = gitRunner(["rev-list", "--left-right", "--count", "@{u}...HEAD"], {
      cwd: repoRoot,
    });
    if (countsResult.ok) {
      ({ ahead, behind } = parseAheadBehind(trimOutput(countsResult)));
    }
  }

  const statusShort = statusResult.ok ? splitLines(statusResult.stdout) : [];
  const { activeStatusShort, ignoredStatusShort } = splitGitStatusShort(statusShort);

  return {
    ...base,
    isRepo: true,
    root: repoRoot,
    branch: trimOutput(branchResult),
    clean: activeStatusShort.length === 0,
    upstream: upstreamResult.ok ? trimOutput(upstreamResult) : "",
    ahead,
    behind,
    remote: remoteResult.ok ? trimOutput(remoteResult) : "",
    lastCommit: lastCommitResult.ok ? parseLastCommit(lastCommitResult.stdout) : null,
    statusShort: activeStatusShort,
    allStatusShort: statusShort,
    ignoredStatusShort,
    ignoredLocalArtifactCount: ignoredStatusShort.length,
    hasIgnoredLocalArtifacts: ignoredStatusShort.length > 0,
    reason: "",
  };
}

function safeReadJsonFile(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function safeReadPackageJson(sourceRoot) {
  return safeReadJsonFile(path.join(sourceRoot, "package.json"));
}

function safeReadPluginJson(sourceRoot) {
  return safeReadJsonFile(path.join(sourceRoot, ".claude-plugin", "plugin.json"));
}

export function collectReleaseScriptReport({ sourceRoot = DESIGN_AI_HOME } = {}) {
  const packageJson = safeReadPackageJson(sourceRoot);
  const scripts = packageJson?.scripts && typeof packageJson.scripts === "object"
    ? packageJson.scripts
    : {};
  const available = UNIQUE_RELEASE_SCRIPT_NAMES.filter((name) => typeof scripts[name] === "string");
  const missing = UNIQUE_RELEASE_SCRIPT_NAMES.filter((name) => typeof scripts[name] !== "string");

  return {
    packageName: packageJson?.name || "",
    version: packageJson?.version || "",
    scripts: Object.fromEntries(available.map((name) => [name, scripts[name]])),
    available,
    missing,
  };
}

export function normalizeRepositoryUrl(value) {
  let text = String(value || "").trim();
  if (!text) return "";
  if (text.startsWith("git+")) text = text.slice(4);
  text = text.replace(/\.git$/u, "");

  const scpMatch = text.match(/^git@github\.com:(?<slug>[^/]+\/[^/]+)$/u);
  if (scpMatch?.groups?.slug) return `https://github.com/${scpMatch.groups.slug}`;

  const sshMatch = text.match(/^ssh:\/\/git@github\.com\/(?<slug>[^/]+\/[^/]+)$/u);
  if (sshMatch?.groups?.slug) return `https://github.com/${sshMatch.groups.slug}`;

  const httpsMatch = text.match(/^https?:\/\/github\.com\/(?<slug>[^/]+\/[^/]+)$/u);
  if (httpsMatch?.groups?.slug) return `https://github.com/${httpsMatch.groups.slug}`;

  return text;
}

export function repositorySlugFromUrl(value) {
  const normalized = normalizeRepositoryUrl(value);
  const match = normalized.match(/^https:\/\/github\.com\/(?<slug>[^/]+\/[^/]+)$/u);
  return match?.groups?.slug || "";
}

export function collectRepositoryReport({
  sourceRoot = DESIGN_AI_HOME,
  git = null,
} = {}) {
  const packageJson = safeReadPackageJson(sourceRoot) || {};
  const pluginJson = safeReadPluginJson(sourceRoot) || {};
  const expectedPackageRepositoryUrl = `git+${CANONICAL_REPOSITORY_URL}.git`;
  const expectedPackageHomepage = `${CANONICAL_REPOSITORY_URL}#readme`;
  const expectedPackageBugsUrl = `${CANONICAL_REPOSITORY_URL}/issues`;
  const expectedPluginUrl = CANONICAL_REPOSITORY_URL;

  const packageRepositoryUrl = typeof packageJson.repository === "object" && packageJson.repository
    ? packageJson.repository.url || ""
    : "";
  const packageHomepage = packageJson.homepage || "";
  const packageBugsUrl = typeof packageJson.bugs === "object" && packageJson.bugs
    ? packageJson.bugs.url || ""
    : "";
  const pluginHomepage = pluginJson.homepage || "";
  const pluginRepository = pluginJson.repository || "";

  const metadataChecks = [
    ["package.repository.url", packageRepositoryUrl, expectedPackageRepositoryUrl],
    ["package.homepage", packageHomepage, expectedPackageHomepage],
    ["package.bugs.url", packageBugsUrl, expectedPackageBugsUrl],
    ["plugin.homepage", pluginHomepage, expectedPluginUrl],
    ["plugin.repository", pluginRepository, expectedPluginUrl],
  ].map(([label, actual, expected]) => ({
    label,
    actual,
    expected,
    aligned: actual === expected,
  }));

  const issues = metadataChecks
    .filter((check) => !check.aligned)
    .map((check) => `${check.label} mismatch: ${check.actual || "missing"} != ${check.expected}`);

  const remoteUrl = git?.remote || "";
  const remoteSlug = repositorySlugFromUrl(remoteUrl);
  const remoteAligned = git?.isRepo && remoteUrl ? remoteSlug === CANONICAL_REPOSITORY_SLUG : null;
  if (remoteAligned === false) {
    issues.push(`git remote origin points to ${remoteSlug || remoteUrl}, expected ${CANONICAL_REPOSITORY_SLUG}`);
  }

  return {
    slug: CANONICAL_REPOSITORY_SLUG,
    url: CANONICAL_REPOSITORY_URL,
    expectedRemoteUrl: `${CANONICAL_REPOSITORY_URL}.git`,
    packageRepositoryUrl,
    packageHomepage,
    packageBugsUrl,
    pluginHomepage,
    pluginRepository,
    metadataAligned: metadataChecks.every((check) => check.aligned),
    remoteUrl,
    remoteSlug,
    remoteAligned,
    issues,
  };
}

export function collectLearningReport({
  filePath = defaultLearningFile(),
  learningStatsProvider = learningStats,
} = {}) {
  const resolvedFile = path.resolve(filePath);
  try {
    const stats = learningStatsProvider({ filePath: resolvedFile });
    return {
      file: stats.file || resolvedFile,
      exists: Boolean(stats.exists),
      updatedAt: stats.updatedAt || "",
      count: Number.isInteger(stats.count) ? stats.count : 0,
      categoryCounts: stats.categoryCounts || {},
      sourceCounts: stats.sourceCounts || {},
      latestEntry: stats.latestEntry || null,
      auditSummary: stats.auditSummary || { status: "pass", failures: 0, warnings: 0 },
      error: "",
    };
  } catch (error) {
    return {
      file: resolvedFile,
      exists: existsSync(resolvedFile),
      updatedAt: "",
      count: 0,
      categoryCounts: {},
      sourceCounts: {},
      latestEntry: null,
      auditSummary: { status: "fail", failures: 1, warnings: 0 },
      error: error?.message || String(error),
    };
  }
}

export function collectLearningEvalReport({
  learningFilePath = defaultLearningFile(),
  learningEvalPath = "",
  learningEvalReportProvider = learningEvalReport,
} = {}) {
  if (!learningEvalPath) return null;

  const resolvedEvalPath = path.resolve(learningEvalPath);
  const resolvedLearningFile = path.resolve(learningFilePath);
  try {
    const evalText = readFileSync(resolvedEvalPath, "utf8");
    const report = learningEvalReportProvider({
      filePath: resolvedLearningFile,
      evalText,
      source: resolvedEvalPath,
    });
    return {
      source: resolvedEvalPath,
      file: report.file,
      status: report.status,
      caseCount: report.caseCount,
      passed: report.passed,
      warned: report.warned,
      failed: report.failed,
      generatedAt: report.generatedAt || "",
      sourceProfile: report.sourceProfile || null,
      profileExists: report.profileExists,
      profileEntryCount: report.profileEntryCount,
      auditSummary: report.auditSummary,
      privacy: report.privacy,
      error: "",
    };
  } catch (error) {
    return {
      source: resolvedEvalPath,
      file: resolvedLearningFile,
      status: "fail",
      caseCount: 0,
      passed: 0,
      warned: 0,
      failed: 0,
      generatedAt: "",
      sourceProfile: null,
      profileExists: existsSync(resolvedLearningFile),
      profileEntryCount: 0,
      auditSummary: { status: "fail", failures: 1, warnings: 0 },
      privacy: {
        storesRawBriefText: false,
        storesBriefHash: true,
        exposesMatchedTokens: false,
      },
      error: error?.message || String(error),
    };
  }
}

export function assessLearningRestoreBackupReadiness({
  totalCount = 0,
  keep = DEFAULT_RESTORE_BACKUP_KEEP,
  error = "",
} = {}) {
  if (error) {
    return {
      status: "fail",
      reason: "restore-backup-inventory-error",
      keep,
      totalCount,
      pruneCandidateCount: 0,
    };
  }

  if (totalCount <= 0) {
    return {
      status: "unknown",
      reason: "no restore rollback backups found",
      keep,
      totalCount,
      pruneCandidateCount: 0,
    };
  }

  const pruneCandidateCount = Math.max(0, totalCount - keep);
  if (pruneCandidateCount > 0) {
    return {
      status: "warn",
      reason: `${pruneCandidateCount} older restore rollback backup(s) can be pruned`,
      keep,
      totalCount,
      pruneCandidateCount,
    };
  }

  return {
    status: "pass",
    reason: "",
    keep,
    totalCount,
    pruneCandidateCount,
  };
}

export function collectLearningRestoreBackupsReport({
  learningFilePath = defaultLearningFile(),
  limit = DEFAULT_RESTORE_BACKUP_KEEP,
  keep = DEFAULT_RESTORE_BACKUP_KEEP,
  learningRestoreBackupsProvider = listLearningRestoreBackups,
} = {}) {
  const resolvedLearningFile = path.resolve(learningFilePath);

  try {
    const inventory = learningRestoreBackupsProvider({
      filePath: resolvedLearningFile,
      limit,
    });
    const totalCount = Number.isInteger(inventory.totalCount) ? inventory.totalCount : 0;
    if (totalCount <= 0) return null;

    const backups = Array.isArray(inventory.backups) ? inventory.backups : [];
    const readiness = assessLearningRestoreBackupReadiness({ totalCount, keep });

    return {
      file: inventory.file || resolvedLearningFile,
      directory: inventory.directory || path.dirname(resolvedLearningFile),
      pattern: inventory.pattern || "",
      generatedAt: inventory.generatedAt || "",
      limit: Number.isInteger(inventory.limit) ? inventory.limit : limit,
      totalCount,
      count: Number.isInteger(inventory.count) ? inventory.count : backups.length,
      latestBackup: backups[0] || null,
      backups,
      readiness,
      privacy: inventory.privacy || {
        storesRawBriefText: false,
        exposesEntryTextPreview: false,
        mutatesProfile: false,
      },
      error: "",
    };
  } catch (error) {
    const message = error?.message || String(error);
    return {
      file: resolvedLearningFile,
      directory: path.dirname(resolvedLearningFile),
      pattern: "",
      generatedAt: "",
      limit,
      totalCount: 0,
      count: 0,
      latestBackup: null,
      backups: [],
      readiness: assessLearningRestoreBackupReadiness({ totalCount: 0, keep, error: message }),
      privacy: {
        storesRawBriefText: false,
        exposesEntryTextPreview: false,
        mutatesProfile: false,
      },
      error: message,
    };
  }
}

export function defaultLearningEvalPath(learningFilePath = defaultLearningFile()) {
  return path.join(path.dirname(path.resolve(learningFilePath)), DEFAULT_LEARNING_EVAL_FILE);
}

export function defaultLearningUsagePath(learningFilePath = defaultLearningFile()) {
  return defaultLearningUsageFile(learningFilePath);
}

function action(level, text, command = "") {
  return command ? { level, text, command } : { level, text };
}

export function quoteShellArg(value) {
  const text = String(value ?? "");
  if (/^[A-Za-z0-9_@%+=:,./-]+$/u.test(text)) return text;
  return `'${text.replace(/'/gu, "'\\''")}'`;
}

function pushUniqueAction(actions, nextAction) {
  if (nextAction.command && actions.some((item) => item.command === nextAction.command)) return;
  actions.push(nextAction);
}

function learningCurationCommand(learning, learningUsage = null) {
  const usagePart = learningUsage?.usageFile
    ? ` --usage-file ${quoteShellArg(learningUsage.usageFile)}`
    : "";
  return `design-ai learn --curate --file ${quoteShellArg(learning.file)}${usagePart}`;
}

export function defaultLearningCurationReportPath(learningFilePath = defaultLearningFile()) {
  return path.join(path.dirname(path.resolve(learningFilePath)), DEFAULT_LEARNING_CURATION_REPORT_FILE);
}

function learningCurationReportCommand(learning, learningUsage = null) {
  return `${learningCurationCommand(learning, learningUsage)} --report --out ${quoteShellArg(defaultLearningCurationReportPath(learning.file))}`;
}

function learningRestoreBackupsCommand(learning) {
  return `design-ai learn --restore-backups --file ${quoteShellArg(learning.file)}`;
}

function learningRestoreBackupPruneCommand(learning, keep = DEFAULT_RESTORE_BACKUP_KEEP) {
  return `${learningRestoreBackupsCommand(learning)} --prune --keep ${keep}`;
}

function parsedTimestamp(value) {
  const time = Date.parse(String(value || ""));
  return Number.isNaN(time) ? null : time;
}

export function assessLearningEvalFreshness({ learning, learningEval } = {}) {
  const profileUpdatedAt = learning?.updatedAt || "";
  const checkpointGeneratedAt = learningEval?.generatedAt || "";
  const sourceProfile = learningEval?.sourceProfile || null;
  const issues = [];

  if (!learningEval) return null;

  if (sourceProfile?.file && path.resolve(sourceProfile.file) !== path.resolve(learning?.file || "")) {
    issues.push("source-profile-file-mismatch");
  }

  if (
    Number.isInteger(sourceProfile?.entryCount)
    && Number.isInteger(learning?.count)
    && sourceProfile.entryCount !== learning.count
  ) {
    issues.push("source-profile-entry-count-changed");
  }

  const profileUpdatedTime = parsedTimestamp(profileUpdatedAt);
  const checkpointGeneratedTime = parsedTimestamp(checkpointGeneratedAt);
  if (
    profileUpdatedTime !== null
    && checkpointGeneratedTime !== null
    && profileUpdatedTime > checkpointGeneratedTime
  ) {
    issues.push("profile-updated-after-checkpoint");
  }

  if (issues.length > 0) {
    return {
      status: "warn",
      stale: true,
      reason: issues.join(", "),
      profileUpdatedAt,
      checkpointGeneratedAt,
      sourceProfileFile: sourceProfile?.file || "",
      sourceProfileEntryCount: Number.isInteger(sourceProfile?.entryCount) ? sourceProfile.entryCount : null,
    };
  }

  if (!checkpointGeneratedAt && !sourceProfile) {
    return {
      status: "unknown",
      stale: false,
      reason: "checkpoint metadata unavailable",
      profileUpdatedAt,
      checkpointGeneratedAt,
      sourceProfileFile: "",
      sourceProfileEntryCount: null,
    };
  }

  return {
    status: "pass",
    stale: false,
    reason: "",
    profileUpdatedAt,
    checkpointGeneratedAt,
    sourceProfileFile: sourceProfile?.file || "",
    sourceProfileEntryCount: Number.isInteger(sourceProfile?.entryCount) ? sourceProfile.entryCount : null,
  };
}

export function collectLearningUsageReport({
  learningFilePath = defaultLearningFile(),
  learningUsagePath = "",
  learningUsageStatsProvider = learningUsageStats,
} = {}) {
  if (!learningUsagePath) return null;

  const resolvedLearningFile = path.resolve(learningFilePath);
  const resolvedUsagePath = path.resolve(learningUsagePath);
  try {
    const stats = learningUsageStatsProvider({
      filePath: resolvedLearningFile,
      usageFile: resolvedUsagePath,
    });
    return {
      file: stats.file || resolvedLearningFile,
      usageFile: stats.usageFile || resolvedUsagePath,
      exists: Boolean(stats.exists),
      profileExists: Boolean(stats.profileExists),
      profileFile: stats.profileFile || resolvedLearningFile,
      version: Number.isInteger(stats.version) ? stats.version : 1,
      updatedAt: stats.updatedAt || "",
      eventCount: Number.isInteger(stats.eventCount) ? stats.eventCount : 0,
      profileEntryCount: Number.isInteger(stats.profileEntryCount) ? stats.profileEntryCount : 0,
      usedEntryCount: Number.isInteger(stats.usedEntryCount) ? stats.usedEntryCount : 0,
      unusedEntryCount: Number.isInteger(stats.unusedEntryCount) ? stats.unusedEntryCount : 0,
      staleSelectedEntryCount: Number.isInteger(stats.staleSelectedEntryCount) ? stats.staleSelectedEntryCount : 0,
      commandCounts: stats.commandCounts || {},
      routeCounts: stats.routeCounts || {},
      categoryCounts: stats.categoryCounts || {},
      auditStatusCounts: stats.auditStatusCounts || {},
      latestEvent: stats.latestEvent || null,
      privacy: stats.privacy || {
        storesRawBriefText: false,
        storesBriefHash: true,
        storesSelectedEntryIds: true,
      },
      recommendations: Array.isArray(stats.recommendations) ? stats.recommendations : [],
      readiness: assessLearningUsageReadiness({ learningFilePath: resolvedLearningFile, usage: stats }),
      error: "",
    };
  } catch (error) {
    return {
      file: resolvedLearningFile,
      usageFile: resolvedUsagePath,
      exists: existsSync(resolvedUsagePath),
      profileExists: existsSync(resolvedLearningFile),
      profileFile: resolvedLearningFile,
      version: 1,
      updatedAt: "",
      eventCount: 0,
      profileEntryCount: 0,
      usedEntryCount: 0,
      unusedEntryCount: 0,
      staleSelectedEntryCount: 0,
      commandCounts: {},
      routeCounts: {},
      categoryCounts: {},
      auditStatusCounts: {},
      latestEvent: null,
      privacy: {
        storesRawBriefText: false,
        storesBriefHash: true,
        storesSelectedEntryIds: true,
      },
      recommendations: [],
      readiness: {
        status: "fail",
        reason: "usage-sidecar-error",
        profileFile: resolvedLearningFile,
        profileFileMatches: true,
        staleSelectedEntryCount: 0,
      },
      error: error?.message || String(error),
    };
  }
}

export function assessLearningUsageReadiness({ learningFilePath = defaultLearningFile(), usage } = {}) {
  if (!usage) return null;

  const resolvedLearningFile = path.resolve(learningFilePath);
  const profileFile = usage.profileFile ? path.resolve(usage.profileFile) : "";
  const profileFileMatches = profileFile ? profileFile === resolvedLearningFile : true;
  const staleSelectedEntryCount = Number.isInteger(usage.staleSelectedEntryCount)
    ? usage.staleSelectedEntryCount
    : 0;
  const issues = [];

  if (!profileFileMatches) issues.push("usage-profile-file-mismatch");
  if (staleSelectedEntryCount > 0) issues.push("stale-selected-entry-ids");

  if (issues.length > 0) {
    return {
      status: "warn",
      reason: issues.join(", "),
      profileFile: usage.profileFile || "",
      profileFileMatches,
      staleSelectedEntryCount,
    };
  }

  if (!usage.exists || usage.eventCount === 0) {
    return {
      status: "unknown",
      reason: usage.exists ? "usage sidecar has no events" : "usage sidecar unavailable",
      profileFile: usage.profileFile || "",
      profileFileMatches,
      staleSelectedEntryCount,
    };
  }

  return {
    status: "pass",
    reason: "",
    profileFile: usage.profileFile || "",
    profileFileMatches,
    staleSelectedEntryCount,
  };
}

export function buildWorkspaceNextActions({
  git,
  repository,
  learning,
  learningUsage,
  learningEval,
  learningRestoreBackups,
  release,
}) {
  const actions = [];

  if (!git.isRepo) {
    actions.push(action("warn", "Open design-ai from a git workspace before preparing shared changes."));
  } else {
    if (!git.clean) {
      actions.push(action("warn", "Review local changes before committing or pushing.", "git status --short"));
    } else if (git.hasIgnoredLocalArtifacts) {
      actions.push(action("info", "Ignored local portfolio/evidence artifacts are present and excluded from workspace readiness.", "git status --short"));
    } else if (!git.upstream && git.branch) {
      actions.push(action("warn", "Set an upstream branch before sharing dogfood work.", `git push -u origin ${git.branch}`));
    } else if (git.behind > 0) {
      actions.push(action("warn", "Rebase or merge remote changes before continuing release work.", "git pull --rebase"));
    } else if (git.ahead > 0) {
      actions.push(action("info", "Push committed local work when the current phase is ready.", "git push"));
    } else {
      actions.push(action("pass", "Git workspace is clean and synced."));
    }
  }

  if (repository && !repository.metadataAligned) {
    actions.push(action("fail", "Fix package/plugin repository metadata before preparing shared dogfood builds.", "npm run release:metadata"));
  } else if (repository?.remoteAligned === false) {
    actions.push(action("warn", "Verify git remote points at the canonical design-ai repository before pushing.", "git remote -v"));
  }

  if (release.missing.length > 0) {
    actions.push(action("fail", `Restore required release script(s): ${release.missing.join(", ")}`));
  }

  if (learning.error) {
    actions.push(action("fail", "Repair the local learning profile before relying on personalized prompt context.", "design-ai learn --audit"));
  } else if (learning.auditSummary.status !== "pass") {
    pushUniqueAction(actions, action(
      "warn",
      "Preview archive-first learning curation before dogfooding prompts.",
      learningCurationCommand(learning, learningUsage),
    ));
    pushUniqueAction(actions, action(
      "info",
      "Save a Markdown learning curation report before applying archive actions.",
      learningCurationReportCommand(learning, learningUsage),
    ));
  } else if (learning.count === 0) {
    actions.push(action("info", "Capture reviewed feedback after checks to make dogfood runs improve over time.", "design-ai check artifact.md --learn --yes"));
  } else if (!learningEval) {
    actions.push(action(
      "info",
      "Generate a local learning eval checkpoint before relying on personalized prompt context.",
      `design-ai learn --eval-template --file ${quoteShellArg(learning.file)} --out ${quoteShellArg(defaultLearningEvalPath(learning.file))}`,
    ));
  }

  if (learningUsage) {
    const usageCommand = `design-ai learn --usage --file ${quoteShellArg(learningUsage.file)} --usage-file ${quoteShellArg(learningUsage.usageFile)}`;
    if (learningUsage.error) {
      actions.push(action("fail", "Repair the local learning usage sidecar before trusting prompt/pack usage analytics.", usageCommand));
    } else if (learningUsage.readiness?.status === "warn") {
      pushUniqueAction(actions, action(
        "warn",
        "Preview usage-aware learning curation before curating learning entries.",
        learningCurationCommand(learning, learningUsage),
      ));
      pushUniqueAction(actions, action(
        "info",
        "Save a Markdown usage-aware learning curation report before applying archive actions.",
        learningCurationReportCommand(learning, learningUsage),
      ));
    } else if (learningUsage.readiness?.status === "pass") {
      actions.push(action("pass", "Learning usage sidecar is aligned with the active profile.", usageCommand));
    } else {
      actions.push(action("info", "Record prompt/pack --with-learning usage before judging which learning entries are useful.", usageCommand));
    }
  } else if (!learning.error && learning.auditSummary.status === "pass" && learning.count > 0) {
    actions.push(action(
      "info",
      "Run prompt or pack with --with-learning to create a local learning usage sidecar.",
      "design-ai prompt \"your brief\" --with-learning",
    ));
  }

  if (learningEval) {
    const evalCommand = `design-ai learn --eval --from-file ${quoteShellArg(learningEval.source)} --file ${quoteShellArg(learningEval.file)} --strict`;
    const regenerateCommand = `design-ai learn --eval-template --file ${quoteShellArg(learningEval.file)} --out ${quoteShellArg(learningEval.source)} --force`;
    if (learningEval.error) {
      actions.push(action("fail", "Fix the local learning eval checkpoint before using workspace readiness as a gate.", evalCommand));
    } else if (learningEval.status === "fail") {
      actions.push(action("fail", "Review failed local learning eval checkpoint cases before trusting prompt/pack selection.", evalCommand));
    } else if (learningEval.status === "warn") {
      actions.push(action("warn", "Review local learning eval checkpoint warnings before relying on personalized prompt context.", evalCommand));
    } else if (learningEval.freshness?.status === "warn") {
      actions.push(action("warn", "Regenerate the local learning eval checkpoint because the learning profile changed after it was created.", regenerateCommand));
    } else {
      actions.push(action("pass", "Learning eval checkpoints pass.", evalCommand));
    }
  }

  if (learningRestoreBackups) {
    const readiness = learningRestoreBackups.readiness || {};
    if (learningRestoreBackups.error) {
      actions.push(action("fail", "Repair the learning restore rollback backup inventory before relying on restore readiness.", learningRestoreBackupsCommand(learning)));
    } else if (readiness.pruneCandidateCount > 0) {
      actions.push(action(
        "info",
        "Preview pruning older learning restore rollback backups after keeping the newest recovery points.",
        learningRestoreBackupPruneCommand(learning, readiness.keep || DEFAULT_RESTORE_BACKUP_KEEP),
      ));
    } else if (learningRestoreBackups.totalCount > 0) {
      actions.push(action("pass", "Learning restore rollback backups are available for rollback review.", learningRestoreBackupsCommand(learning)));
    }
  }

  if (release.available.includes("test")) {
    actions.push(action("info", "Run CLI unit tests before handing this phase off.", "npm test"));
  }
  if (release.available.includes("audit:strict")) {
    actions.push(action("info", "Run the strict repository audit before repo cleanup or team distribution.", "npm run audit:strict"));
  }
  if (release.available.includes("package:smoke")) {
    actions.push(action("info", "Use package smoke before publishing or testing the packed install path.", "npm run package:smoke"));
  }

  return actions;
}

export function hasWorkspaceStrictIssues(report) {
  return (report?.nextActions || []).some((item) => item.level === "fail" || item.level === "warn");
}

export function collectWorkspaceReport({
  root = process.cwd(),
  sourceRoot = DESIGN_AI_HOME,
  learningFilePath = defaultLearningFile(),
  learningUsagePath = "",
  learningEvalPath = "",
  gitRunner = runGitCommand,
  learningStatsProvider = learningStats,
  learningUsageStatsProvider = learningUsageStats,
  learningEvalReportProvider = learningEvalReport,
  learningRestoreBackupsProvider = listLearningRestoreBackups,
} = {}) {
  const resolvedRoot = path.resolve(root);
  const resolvedSourceRoot = path.resolve(sourceRoot);
  const resolvedLearningFile = path.resolve(learningFilePath);
  const resolvedLearningUsagePath = learningUsagePath || (
    existsSync(defaultLearningUsagePath(resolvedLearningFile)) ? defaultLearningUsagePath(resolvedLearningFile) : ""
  );
  const resolvedLearningEvalPath = learningEvalPath || (
    existsSync(defaultLearningEvalPath(resolvedLearningFile)) ? defaultLearningEvalPath(resolvedLearningFile) : ""
  );
  const git = collectGitReport({ root: resolvedRoot, gitRunner });
  const learning = collectLearningReport({
    filePath: resolvedLearningFile,
    learningStatsProvider,
  });
  const learningUsage = collectLearningUsageReport({
    learningFilePath: resolvedLearningFile,
    learningUsagePath: resolvedLearningUsagePath,
    learningUsageStatsProvider,
  });
  const learningEval = collectLearningEvalReport({
    learningFilePath: resolvedLearningFile,
    learningEvalPath: resolvedLearningEvalPath,
    learningEvalReportProvider,
  });
  const learningRestoreBackups = collectLearningRestoreBackupsReport({
    learningFilePath: resolvedLearningFile,
    learningRestoreBackupsProvider,
  });
  const learningEvalWithFreshness = learningEval
    ? {
        ...learningEval,
        freshness: assessLearningEvalFreshness({ learning, learningEval }),
      }
    : null;
  const release = collectReleaseScriptReport({ sourceRoot: resolvedSourceRoot });
  const repository = collectRepositoryReport({ sourceRoot: resolvedSourceRoot, git });
  const nextActions = buildWorkspaceNextActions({
    git,
    repository,
    learning,
    learningUsage,
    learningEval: learningEvalWithFreshness,
    learningRestoreBackups,
    release,
  });

  return {
    context: {
      cwd: process.cwd(),
      root: resolvedRoot,
      sourceRoot: resolvedSourceRoot,
      packageName: release.packageName,
      version: release.version,
    },
    git,
    repository,
    learning,
    learningUsage,
    learningEval: learningEvalWithFreshness,
    learningRestoreBackups,
    release,
    nextActions,
  };
}

export function formatWorkspaceJson(report) {
  return JSON.stringify({
    context: report.context,
    git: report.git,
    repository: report.repository,
    learning: report.learning,
    learningUsage: report.learningUsage || null,
    learningEval: report.learningEval || null,
    learningRestoreBackups: report.learningRestoreBackups || null,
    release: report.release,
    nextActions: report.nextActions,
  }, null, 2);
}
