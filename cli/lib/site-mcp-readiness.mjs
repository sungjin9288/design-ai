// MCP readiness scoring helpers for Website Improvement workspaces.

function isLikelyHttpUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return false;
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function mcpReadinessEvidence(workspace, key) {
  const profile = workspace.siteProfile;
  const hasRepo = Boolean(profile.repoUrl || profile.localPath);
  const hasLiveUrl = isLikelyHttpUrl(profile.liveUrl);

  const map = {
    github: {
      ready: hasRepo,
      evidence: [
        profile.repoUrl ? `repoUrl: ${profile.repoUrl}` : "",
        profile.localPath ? `localPath: ${profile.localPath}` : "",
      ].filter(Boolean),
      actions: ["Add siteProfile.repoUrl or siteProfile.localPath before Codex implementation handoff."],
    },
    figma: {
      ready: Boolean(profile.figmaUrl),
      evidence: profile.figmaUrl ? [`figmaUrl: ${profile.figmaUrl}`] : [],
      actions: ["Add siteProfile.figmaUrl or mark Figma unused for this site."],
    },
    browser: {
      ready: (hasLiveUrl || hasRepo) && profile.viewports.length > 0,
      evidence: [
        hasLiveUrl ? `liveUrl: ${profile.liveUrl}` : "",
        !hasLiveUrl && profile.repoUrl ? `repoUrl preview source: ${profile.repoUrl}` : "",
        !hasLiveUrl && profile.localPath ? `localPath preview source: ${profile.localPath}` : "",
        profile.viewports.length ? `viewports: ${profile.viewports.join(", ")}` : "",
      ].filter(Boolean),
      actions: ["Add a live URL or target repo reference plus at least one viewport before Browser/Playwright QA."],
    },
    chromeDevtools: {
      ready: hasLiveUrl,
      evidence: hasLiveUrl ? [`liveUrl: ${profile.liveUrl}`] : [],
      actions: ["Add a valid siteProfile.liveUrl before Chrome DevTools debugging."],
    },
    deploy: {
      ready: profile.deployProvider !== "none",
      evidence: [
        `deployProvider: ${profile.deployProvider}`,
        hasLiveUrl ? `liveUrl: ${profile.liveUrl}` : "",
      ].filter(Boolean),
      actions: ["Set siteProfile.deployProvider before implementation handoff, then record liveUrl before deployment verification."],
    },
    sentry: {
      ready: Boolean(profile.sentryProject),
      evidence: profile.sentryProject ? [`sentryProject: ${profile.sentryProject}`] : [],
      actions: ["Add siteProfile.sentryProject or mark Sentry unused until production errors are in scope."],
    },
    database: {
      ready: profile.database !== "none",
      evidence: [`database: ${profile.database}`],
      actions: ["Set siteProfile.database to supabase, neon, postgres, or other when DB access is required."],
    },
    cms: {
      ready: profile.cms !== "none",
      evidence: [`cms: ${profile.cms}`],
      actions: ["Set siteProfile.cms to sanity, contentful, wordpress, shopify, or other when content access is required."],
    },
    collaboration: {
      ready: false,
      evidence: [],
      actions: ["Keep Collaboration optional/unused, or record the active Notion/Slack/Linear/Jira destination in reportNotes for handoff."],
    },
    research: {
      ready: hasLiveUrl,
      evidence: hasLiveUrl ? [`liveUrl: ${profile.liveUrl}`] : [],
      actions: ["Add siteProfile.liveUrl before competitor or external research prompts."],
    },
  };

  return map[key] || {
    ready: false,
    evidence: [],
    actions: [`Add readiness evidence for ${key}.`],
  };
}

export function mcpItemReport(workspace, key, label) {
  const requestedStatus = workspace.mcpReadiness[key];
  const check = mcpReadinessEvidence(workspace, key);

  if (requestedStatus === "unused") {
    return {
      key,
      label,
      requestedStatus,
      state: "unused",
      level: "pass",
      evidence: ["Marked unused in mcpReadiness."],
      actions: [],
    };
  }

  if (requestedStatus === "unavailable") {
    return {
      key,
      label,
      requestedStatus,
      state: "unavailable",
      level: "pass",
      evidence: ["Marked unavailable in mcpReadiness; generated prompts should not assume this MCP."],
      actions: [],
    };
  }

  if (key === "collaboration" && requestedStatus === "optional") {
    return {
      key,
      label,
      requestedStatus,
      state: "ready",
      level: "pass",
      evidence: ["Optional collaboration is tracked in handoff notes for this local MVP."],
      actions: [],
    };
  }

  if (check.ready) {
    return {
      key,
      label,
      requestedStatus,
      state: "ready",
      level: "pass",
      evidence: check.evidence,
      actions: [],
    };
  }

  return {
    key,
    label,
    requestedStatus,
    state: "missing",
    level: requestedStatus === "required" ? "fail" : "warn",
    evidence: check.evidence,
    actions: check.actions,
  };
}

export function siteMcpCheckStatus(items, taskGaps, workspaceIssues) {
  if (workspaceIssues.some((issue) => issue.level === "fail")) return "fail";
  if (items.some((item) => item.level === "fail")) return "fail";
  if (workspaceIssues.some((issue) => issue.level === "warn")) return "warn";
  if (items.some((item) => item.level === "warn") || taskGaps.length > 0) return "warn";
  return "pass";
}
