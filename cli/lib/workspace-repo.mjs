// Repository metadata and release-script readiness for `design-ai workspace`.

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import { DESIGN_AI_HOME } from "./paths.mjs";

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
