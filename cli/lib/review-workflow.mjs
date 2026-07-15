import { inspectHtml } from "./design-quality-inspector.mjs";
import {
  canonicalReviewStages,
  reviewSourceDigest,
  reviewWorkflowDigest,
  validateReviewWorkflow,
} from "./review-workflow-contract.mjs";
import { buildStartPayload } from "./start-operation.mjs";

function requiredText(value, field) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${field} must be a non-empty string`);
  }
  return value.trim();
}

function optionalText(value, field) {
  if (value === undefined || value === null || value === "") return "";
  return requiredText(value, field);
}

function textList(value, field, fallback = []) {
  if (value === undefined || value === null) return [...fallback];
  if (!Array.isArray(value)) throw new Error(`${field} must be an array`);
  const items = value.map((item, index) => requiredText(item, `${field}[${index}]`));
  return [...new Set(items)];
}

export function buildReviewWorkflow(source, options) {
  if (typeof source !== "string" || source.trim() === "") {
    throw new Error("source must be a non-empty string");
  }
  const html = source;
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    throw new Error("review options must be an object");
  }

  const brief = requiredText(options.brief, "brief");
  const sourceRef = requiredText(options.sourceRef, "sourceRef");
  const locale = optionalText(options.locale, "locale") || "en";
  const viewports = textList(options.viewports, "viewports", ["mobile", "desktop"]);
  if (viewports.length === 0) throw new Error("viewports must be a non-empty array");

  const plan = buildStartPayload({
    brief,
    sourceRoot: requiredText(options.sourceRoot, "sourceRoot"),
    prefix: requiredText(options.prefix, "prefix"),
    routeId: "design-review",
    context: {
      siteName: optionalText(options.siteName, "siteName"),
      repoUrl: optionalText(options.repoUrl, "repoUrl"),
      localPath: optionalText(options.localPath, "localPath"),
      url: optionalText(options.url, "url"),
      screenshots: textList(options.screenshots, "screenshots"),
      locale,
      viewports,
    },
  });
  const report = inspectHtml(html, {
    sourceRef,
    brief,
    name: optionalText(options.name, "name") || undefined,
    locale,
    viewports,
    generatedAt: optionalText(options.generatedAt, "generatedAt") || undefined,
    reviewPack: optionalText(options.reviewPack, "reviewPack") || undefined,
  });

  const workflow = {
    kind: "design-ai-review-workflow",
    schemaVersion: 1,
    status: "static-review-complete",
    source: {
      reference: sourceRef,
      sha256: reviewSourceDigest(html),
      bytes: Buffer.byteLength(html, "utf8"),
    },
    plan,
    report,
    linkage: {
      status: "pass",
      briefMatch: true,
      localeMatch: true,
      viewportMatch: true,
      sourceReferenceMatch: true,
      planSha256: reviewWorkflowDigest(plan),
      designContractSha256: reviewWorkflowDigest(plan.designContract),
      reportSha256: reviewWorkflowDigest(report),
    },
    stages: canonicalReviewStages(),
    nextAction: {
      id: "human-review-required",
      status: "pending",
      summary: report.summary.nextAction,
      approvalRequiredBefore: [...report.approval.requiredBefore],
    },
    boundary: {
      mode: "read-only",
      localWrites: false,
      targetRepoMutation: false,
      externalWrites: false,
    },
  };

  return validateReviewWorkflow(workflow, { source: html });
}
