// Local dogfood workspace diagnostics for `design-ai workspace`.

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { defaultLearningFile, learningEvalReport, learningStats } from "./learn.mjs";
import { DESIGN_AI_HOME } from "./paths.mjs";
import { unknownOptionMessage } from "./suggest.mjs";

export const WORKSPACE_OPTIONS = [
  "-h",
  "--help",
  "--json",
  "--strict",
  "--root",
  "--learning-file",
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

export function parseWorkspaceArgs(args) {
  const flags = {
    help: false,
    json: false,
    strict: false,
    root: "",
    learningFilePath: "",
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
        "Usage: design-ai workspace [--root path] [--learning-file path] [--learning-eval path] [--strict] [--json]",
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

  return {
    ...base,
    isRepo: true,
    root: repoRoot,
    branch: trimOutput(branchResult),
    clean: statusShort.length === 0,
    upstream: upstreamResult.ok ? trimOutput(upstreamResult) : "",
    ahead,
    behind,
    remote: remoteResult.ok ? trimOutput(remoteResult) : "",
    lastCommit: lastCommitResult.ok ? parseLastCommit(lastCommitResult.stdout) : null,
    statusShort,
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

function action(level, text, command = "") {
  return command ? { level, text, command } : { level, text };
}

export function quoteShellArg(value) {
  const text = String(value ?? "");
  if (/^[A-Za-z0-9_@%+=:,./-]+$/u.test(text)) return text;
  return `'${text.replace(/'/gu, "'\\''")}'`;
}

export function buildWorkspaceNextActions({ git, repository, learning, learningEval, release }) {
  const actions = [];

  if (!git.isRepo) {
    actions.push(action("warn", "Open design-ai from a git workspace before preparing shared changes."));
  } else {
    if (!git.clean) {
      actions.push(action("warn", "Review local changes before committing or pushing.", "git status --short"));
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
    actions.push(action("warn", "Review local learning profile audit warnings before dogfooding prompts.", "design-ai learn --audit"));
  } else if (learning.count === 0) {
    actions.push(action("info", "Capture reviewed feedback after checks to make dogfood runs improve over time.", "design-ai check artifact.md --learn --yes"));
  } else if (!learningEval) {
    actions.push(action(
      "info",
      "Generate a local learning eval checkpoint before relying on personalized prompt context.",
      `design-ai learn --eval-template --file ${quoteShellArg(learning.file)} --out learning-eval.json`,
    ));
  }

  if (learningEval) {
    const evalCommand = `design-ai learn --eval --from-file ${quoteShellArg(learningEval.source)} --file ${quoteShellArg(learningEval.file)} --strict`;
    if (learningEval.error) {
      actions.push(action("fail", "Fix the local learning eval checkpoint before using workspace readiness as a gate.", evalCommand));
    } else if (learningEval.status === "fail") {
      actions.push(action("fail", "Review failed local learning eval checkpoint cases before trusting prompt/pack selection.", evalCommand));
    } else if (learningEval.status === "warn") {
      actions.push(action("warn", "Review local learning eval checkpoint warnings before relying on personalized prompt context.", evalCommand));
    } else {
      actions.push(action("pass", "Learning eval checkpoints pass.", evalCommand));
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
  learningEvalPath = "",
  gitRunner = runGitCommand,
  learningStatsProvider = learningStats,
  learningEvalReportProvider = learningEvalReport,
} = {}) {
  const resolvedRoot = path.resolve(root);
  const resolvedSourceRoot = path.resolve(sourceRoot);
  const git = collectGitReport({ root: resolvedRoot, gitRunner });
  const learning = collectLearningReport({
    filePath: learningFilePath,
    learningStatsProvider,
  });
  const learningEval = collectLearningEvalReport({
    learningFilePath,
    learningEvalPath,
    learningEvalReportProvider,
  });
  const release = collectReleaseScriptReport({ sourceRoot: resolvedSourceRoot });
  const repository = collectRepositoryReport({ sourceRoot: resolvedSourceRoot, git });
  const nextActions = buildWorkspaceNextActions({ git, repository, learning, learningEval, release });

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
    learningEval,
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
    learningEval: report.learningEval || null,
    release: report.release,
    nextActions: report.nextActions,
  }, null, 2);
}
