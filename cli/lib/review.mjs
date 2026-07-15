import { readInspectSource } from "./inspect.mjs";
import { buildReviewWorkflow } from "./review-workflow.mjs";
import { unknownOptionMessage } from "./suggest.mjs";

const REVIEW_OPTIONS = [
  "-h",
  "--help",
  "--brief",
  "--name",
  "--locale",
  "--viewport",
  "--review-pack",
  "--site-name",
  "--repo-url",
  "--local-path",
  "--url",
  "--screenshot",
  "--json",
];

function optionValue(args, index, option) {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${option} requires a value`);
  return value;
}

export function parseReviewArgs(args) {
  const parsed = {
    sourcePath: "",
    brief: "",
    name: "",
    locale: "en",
    viewports: [],
    reviewPack: "",
    siteName: "",
    repoUrl: "",
    localPath: "",
    url: "",
    screenshots: [],
    json: false,
    help: false,
  };

  const scalarOptions = new Map([
    ["--brief", "brief"],
    ["--name", "name"],
    ["--locale", "locale"],
    ["--review-pack", "reviewPack"],
    ["--site-name", "siteName"],
    ["--repo-url", "repoUrl"],
    ["--local-path", "localPath"],
    ["--url", "url"],
  ]);

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "-h" || arg === "--help") {
      parsed.help = true;
    } else if (arg === "--json") {
      parsed.json = true;
    } else if (scalarOptions.has(arg)) {
      parsed[scalarOptions.get(arg)] = optionValue(args, index, arg);
      index += 1;
    } else if (arg === "--viewport" || arg === "--screenshot") {
      const value = optionValue(args, index, arg);
      (arg === "--viewport" ? parsed.viewports : parsed.screenshots).push(value);
      index += 1;
    } else if (arg.startsWith("-")) {
      throw new Error(unknownOptionMessage("review", arg, REVIEW_OPTIONS));
    } else if (!parsed.sourcePath) {
      parsed.sourcePath = arg;
    } else {
      throw new Error(`review accepts one HTML source file; received unexpected argument: ${arg}`);
    }
  }
  return parsed;
}

export function buildReviewReport(parsed, {
  cwd = process.cwd(),
  sourceRoot,
  prefix,
  generatedAt,
} = {}) {
  if (!parsed.brief) throw new Error("review requires --brief");
  const input = readInspectSource(parsed.sourcePath, cwd);
  return buildReviewWorkflow(input.source, {
    sourceRef: input.sourceRef,
    brief: parsed.brief,
    name: parsed.name || undefined,
    locale: parsed.locale,
    viewports: parsed.viewports.length > 0 ? parsed.viewports : undefined,
    reviewPack: parsed.reviewPack || undefined,
    siteName: parsed.siteName || undefined,
    repoUrl: parsed.repoUrl || undefined,
    localPath: parsed.localPath || undefined,
    url: parsed.url || undefined,
    screenshots: parsed.screenshots,
    sourceRoot,
    prefix,
    generatedAt,
  });
}

export function formatReviewJson(workflow) {
  return JSON.stringify(workflow, null, 2);
}

export function renderReviewMarkdown(workflow) {
  const { plan, report, source, linkage, nextAction, boundary } = workflow;
  const lines = [
    `# ${report.subject.name} review workflow`,
    "",
    `- Workflow: ${workflow.status}`,
    `- Quality: ${report.summary.status}`,
    `- Route: ${plan.route.id}`,
    `- Source: ${source.reference} (${source.bytes} bytes, SHA-256 ${source.sha256})`,
    `- Findings: ${report.summary.confirmedFindings} confirmed, ${report.summary.unverifiedFindings} unverified`,
    `- Linkage: ${linkage.status}`,
    `- Boundary: ${boundary.mode}; no local write, target-repository mutation, or external write`,
    "",
    "## Review sequence",
    "",
    ...workflow.stages.map((stage) => `- ${stage.id}: ${stage.status}`),
    "",
    "## Findings",
    "",
  ];

  for (const finding of report.findings) {
    lines.push(
      `### ${finding.severity.toUpperCase()} ${finding.title}`,
      "",
      `- Status: ${finding.status}`,
      `- Location: ${finding.location}`,
      `- Before: ${finding.before}`,
      `- After: ${finding.after}`,
      `- Why: ${finding.why}`,
      `- Verification: ${finding.verification.join(" ")}`,
      "",
    );
  }

  lines.push(
    "## Next action",
    "",
    `- Action: ${nextAction.id}`,
    `- Status: ${nextAction.status}`,
    `- ${nextAction.summary}`,
    ...nextAction.approvalRequiredBefore.map((gate) => `- Approval required before ${gate}.`),
  );
  return lines.join("\n");
}
