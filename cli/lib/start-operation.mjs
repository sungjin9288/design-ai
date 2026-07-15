import path from "node:path";

import { buildArtifact } from "./artifact.mjs";
import { buildRoutePayload } from "./route-operation.mjs";
import { buildSiteInitArgs, buildSiteInitCommand } from "./site-next-actions.mjs";
import { validateStartPayload } from "./start-contract.mjs";

function optionalText(value, field) {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") throw new Error(`${field} must be a string`);
  return value.trim();
}

function textList(value, field) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new Error(`${field} must be an array`);
  const normalized = value.map((item, index) => {
    const text = optionalText(item, `${field}[${index}]`);
    if (!text) throw new Error(`${field}[${index}] must be a non-empty string`);
    return text;
  });
  return [...new Set(normalized)];
}

function commandValue(value) {
  const text = String(value || "");
  if (/^[A-Za-z0-9_./:@+-]+$/.test(text)) return text;
  return `'${text.replaceAll("'", "'\"'\"'")}'`;
}

function designAiCommand(args) {
  return ["design-ai", ...args].map(commandValue).join(" ");
}

function normalizeContext(context = {}) {
  if (!context || typeof context !== "object" || Array.isArray(context)) {
    throw new Error("start context must be an object");
  }

  const normalized = {
    siteName: optionalText(context.siteName, "siteName"),
    repoUrl: optionalText(context.repoUrl, "repoUrl"),
    localPath: optionalText(context.localPath, "localPath"),
    url: optionalText(context.url, "url"),
    screenshots: textList(context.screenshots, "screenshots"),
    locale: optionalText(context.locale, "locale"),
    viewports: textList(context.viewports, "viewports"),
  };

  if (normalized.localPath && !path.isAbsolute(normalized.localPath)) {
    throw new Error("localPath must be an absolute path");
  }
  return normalized;
}

function declaredReferences(context) {
  const references = [];
  if (context.repoUrl) references.push({ kind: "repository-url", reference: context.repoUrl, status: "declared-not-read" });
  if (context.localPath) references.push({ kind: "local-path", reference: context.localPath, status: "declared-not-read" });
  if (context.url) references.push({ kind: "page-url", reference: context.url, status: "declared-not-read" });
  for (const screenshot of context.screenshots) {
    references.push({ kind: "screenshot", reference: screenshot, status: "declared-not-read" });
  }
  return references;
}

function routeSummary(route) {
  return {
    id: route.id,
    label: route.label,
    confidence: route.confidence,
    matchedKeywords: [...route.matchedKeywords],
  };
}

function routeSources(route) {
  return [...route.skills, ...route.agents, ...route.knowledge]
    .filter((item) => item.exists)
    .map((item) => item.path);
}

function websiteProfile(context) {
  return {
    name: context.siteName,
    liveUrl: context.url,
    repoUrl: context.repoUrl,
    localPath: context.localPath,
    figmaUrl: "",
    brandNotes: "",
    deployProvider: "none",
    sentryProject: "",
    cms: "none",
    database: "none",
    pages: [],
    userFlows: [],
    viewports: context.viewports,
  };
}

function buildPathway(route, brief, context) {
  if (route.id === "website-improvement") {
    if (!context.siteName) {
      const language = context.locale.toLowerCase().startsWith("ko") ? "ko" : "en";
      const commandArgs = ["site", "--intake-template", "--language", language, "--json"];
      return {
        id: "website-improvement",
        status: "needs-input",
        reason: "A site name is required before design-ai can prepare a deterministic workspace command.",
        missingInputs: ["siteName"],
        commandArgs,
        command: designAiCommand(commandArgs),
      };
    }
    const commandArgs = buildSiteInitArgs(websiteProfile(context));
    return {
      id: "website-improvement",
      status: "ready",
      reason: "The existing Website Improvement workspace initializer owns the next local planning step.",
      missingInputs: [],
      commandArgs,
      command: buildSiteInitCommand(websiteProfile(context)),
    };
  }

  const reviewRoute = route.id === "design-engineering-review" || route.id === "design-review";
  const mode = reviewRoute ? "critique-loop" : "implementation-plan";
  const commandArgs = ["artifact", mode, brief, "--route", route.id, "--json"];
  return {
    id: reviewRoute ? "design-review" : "implementation-plan",
    status: "playbook-ready",
    reason: reviewRoute
      ? "The selected review skill is ready, but no artifact or runtime behavior has been inspected."
      : "The selected route is ready for an implementation plan after the design contract is reviewed.",
    missingInputs: [],
    commandArgs,
    command: designAiCommand(commandArgs),
  };
}

function intendedEffects(references, pathway) {
  const externalReads = references.filter((item) => /^https?:\/\//i.test(item.reference));
  return {
    reads: references,
    localWrites: pathway.id === "website-improvement" && pathway.status === "ready"
      ? [{ reference: "website-workspace.json", status: "not-performed" }]
      : [],
    targetRepoMutations: [],
    externalActions: externalReads.map((item) => ({
      action: "inspect-reference",
      reference: item.reference,
      status: "not-performed",
    })),
  };
}

export function buildStartPayload({
  brief,
  sourceRoot,
  prefix,
  routeId = "",
  context = {},
}) {
  const normalizedBrief = optionalText(brief, "brief");
  if (!normalizedBrief) throw new Error("Brief is empty");
  const normalizedContext = normalizeContext(context);
  const forcedRouteId = optionalText(routeId, "routeId");
  const selectedRouteId = forcedRouteId || buildRoutePayload({
    brief: normalizedBrief,
    sourceRoot,
    limit: 1,
    explain: false,
  }).routes[0]?.id;
  if (!selectedRouteId) throw new Error("No matching design route found");
  const designContract = buildArtifact({
    mode: "design-contract",
    brief: normalizedBrief,
    sourceRoot,
    prefix,
    routeId: selectedRouteId,
  });
  const selectedRoute = designContract.route;
  const references = declaredReferences(normalizedContext);
  const pathway = buildPathway(selectedRoute, normalizedBrief, normalizedContext);

  return validateStartPayload({
    kind: "design-ai-start",
    schemaVersion: 1,
    brief: normalizedBrief,
    context: normalizedContext,
    route: routeSummary(selectedRoute),
    designContract,
    review: {
      status: "playbook-ready-not-run",
      routeId: selectedRoute.id,
      executed: false,
      sourceFiles: routeSources(selectedRoute),
    },
    pathway,
    effects: {
      performed: {
        reads: designContract.sourceFiles.map((reference) => ({ kind: "design-ai-corpus", reference })),
        localWrites: [],
        targetRepoMutations: [],
        externalActions: [],
      },
      intended: intendedEffects(references, pathway),
      approvalRequiredBefore: [...designContract.approval.requiresApproval],
    },
  });
}
