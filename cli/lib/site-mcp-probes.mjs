// Read-only MCP probe helpers for Website Improvement workspaces.

import { existsSync, statSync } from "node:fs";

function parseHttpUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed;
  } catch {
    return null;
  }
}

function probeLevel({ passed, requestedStatus }) {
  if (passed) return "pass";
  return requestedStatus === "required" ? "fail" : "warn";
}

function probeStatus(items) {
  if (items.some((item) => item.level === "fail")) return "fail";
  if (items.some((item) => item.level === "warn")) return "warn";
  return "pass";
}

function githubRepoSlug(repoUrl) {
  const parsed = parseHttpUrl(repoUrl);
  if (!parsed) return "";
  const host = parsed.hostname.toLowerCase();
  if (host !== "github.com" && !host.endsWith(".github.com")) return "";
  const parts = parsed.pathname.replace(/^\/+|\/+$/g, "").replace(/\.git$/i, "").split("/");
  if (parts.length < 2 || !parts[0] || !parts[1]) return "";
  return `${parts[0]}/${parts[1]}`;
}

function figmaFileReference(figmaUrl) {
  const parsed = parseHttpUrl(figmaUrl);
  if (!parsed) return "";
  const host = parsed.hostname.toLowerCase();
  if (host !== "figma.com" && !host.endsWith(".figma.com")) return "";
  const parts = parsed.pathname.replace(/^\/+|\/+$/g, "").split("/");
  const supportedKinds = new Set(["design", "file", "board", "slides", "make"]);
  if (parts.length < 2 || !supportedKinds.has(parts[0]) || !parts[1]) return "";
  return `${parts[0]}/${parts[1]}`;
}

function pathExistsAsDirectory(localPath) {
  const raw = String(localPath || "").trim();
  if (!raw) return false;
  try {
    return existsSync(raw) && statSync(raw).isDirectory();
  } catch {
    return false;
  }
}

function buildProbeItem({ id, key, label, requestedStatus, passed, message, evidence = [], actions = [] }) {
  const level = probeLevel({ passed, requestedStatus });
  return {
    id,
    key,
    label,
    requestedStatus,
    level,
    passed,
    message,
    evidence,
    actions: passed ? [] : actions,
  };
}

function buildSiteMcpProbeItems(workspace) {
  const profile = workspace.siteProfile;
  const liveUrl = parseHttpUrl(profile.liveUrl);
  const repoSlug = githubRepoSlug(profile.repoUrl);
  const localRepoAvailable = pathExistsAsDirectory(profile.localPath);
  const figmaRef = figmaFileReference(profile.figmaUrl);
  const deployConfigured = profile.deployProvider !== "none";
  const repoPreviewSource = Boolean(repoSlug || localRepoAvailable);
  const browserTargetReady = Boolean((liveUrl || repoPreviewSource) && profile.viewports.length > 0);

  return [
    buildProbeItem({
      id: "github-repo-reference",
      key: "github",
      label: "GitHub repo reference",
      requestedStatus: workspace.mcpReadiness.github,
      passed: Boolean(repoSlug || localRepoAvailable),
      message: repoSlug || localRepoAvailable
        ? "Target repo reference is parseable for Codex handoff."
        : "Target repo reference is not probe-ready.",
      evidence: [
        repoSlug ? `github repo: ${repoSlug}` : "",
        localRepoAvailable ? `localPath exists: ${profile.localPath}` : "",
      ].filter(Boolean),
      actions: ["Add a github.com owner/repo URL or an existing local repo path before implementation handoff."],
    }),
    buildProbeItem({
      id: "figma-url-reference",
      key: "figma",
      label: "Figma file reference",
      requestedStatus: workspace.mcpReadiness.figma,
      passed: Boolean(figmaRef),
      message: figmaRef
        ? "Figma URL is parseable for design-context handoff."
        : "Figma URL is missing or not parseable.",
      evidence: figmaRef ? [`figma reference: ${figmaRef}`] : [],
      actions: ["Add a figma.com design/file/board/slides/make URL or mark Figma unused."],
    }),
    buildProbeItem({
      id: "browser-smoke-target",
      key: "browser",
      label: "Browser smoke target",
      requestedStatus: workspace.mcpReadiness.browser,
      passed: browserTargetReady,
      message: browserTargetReady
        ? liveUrl
          ? "Browser smoke target and viewport set are ready for manual or MCP-driven QA."
          : "Target repo and viewport set are ready to start a local preview before Browser/Playwright QA."
        : "Browser smoke target is incomplete.",
      evidence: [
        liveUrl ? `liveUrl host: ${liveUrl.hostname}` : "",
        !liveUrl && repoSlug ? `preview source repo: ${repoSlug}` : "",
        !liveUrl && localRepoAvailable ? `preview source localPath: ${profile.localPath}` : "",
        profile.viewports.length ? `viewports: ${profile.viewports.join(", ")}` : "",
      ].filter(Boolean),
      actions: ["Add a valid liveUrl or target repo reference and at least one viewport before Browser/Playwright QA."],
    }),
    buildProbeItem({
      id: "deploy-provider-reference",
      key: "deploy",
      label: "Deployment provider reference",
      requestedStatus: workspace.mcpReadiness.deploy,
      passed: deployConfigured,
      message: deployConfigured
        ? liveUrl
          ? "Deployment provider and live URL are configured for verification handoff."
          : "Deployment provider is configured; live verification remains pending until preview or production deployment."
        : "Deployment provider is not configured.",
      evidence: [
        `deployProvider: ${profile.deployProvider}`,
        liveUrl ? `liveUrl host: ${liveUrl.hostname}` : "",
      ].filter(Boolean),
      actions: ["Set siteProfile.deployProvider before implementation handoff, then add liveUrl before deployment verification."],
    }),
  ];
}

export function buildSiteMcpProbeReport(workspace) {
  const items = buildSiteMcpProbeItems(workspace)
    .filter((item) => item.requestedStatus !== "unused" && item.requestedStatus !== "unavailable");
  const status = probeStatus(items);
  return {
    enabled: true,
    mode: "read-only-local",
    externalCalls: false,
    status,
    count: items.length,
    pass: items.filter((item) => item.level === "pass").length,
    warn: items.filter((item) => item.level === "warn").length,
    fail: items.filter((item) => item.level === "fail").length,
    items,
  };
}
