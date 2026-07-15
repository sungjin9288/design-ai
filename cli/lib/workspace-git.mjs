// Git working-tree readiness report for `design-ai workspace`.

import { spawnSync } from "node:child_process";
import path from "node:path";

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

export function runGitCommand(args, { cwd }) {
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

export function collectGitReport({
  root = process.cwd(),
  gitRunner = runGitCommand,
  ignoreLocalArtifacts = true,
} = {}) {
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
  const { activeStatusShort, ignoredStatusShort } = ignoreLocalArtifacts
    ? splitGitStatusShort(statusShort)
    : { activeStatusShort: statusShort, ignoredStatusShort: [] };

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
