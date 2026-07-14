import { parseBriefSourceFlag } from "./brief.mjs";
import { unknownOptionMessage } from "./suggest.mjs";

const START_OPTIONS = [
  "-h",
  "--help",
  "--json",
  "--route",
  "--from-file",
  "--stdin",
  "--site-name",
  "--repo-url",
  "--local-path",
  "--url",
  "--screenshot",
  "--locale",
  "--viewport",
];

function optionValue(args, index, option) {
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${option} expects a value`);
  return value;
}

export function parseStartArgs(args) {
  const out = {
    briefParts: [],
    fromFile: "",
    stdin: false,
    routeId: "",
    siteName: "",
    repoUrl: "",
    localPath: "",
    url: "",
    screenshots: [],
    locale: "",
    viewports: [],
    json: false,
    help: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    out.index = index;
    if (arg === "-h" || arg === "--help") {
      out.help = true;
    } else if (arg === "--json") {
      out.json = true;
    } else if (arg === "--route") {
      out.routeId = optionValue(args, index, arg);
      index += 1;
    } else if (arg === "--site-name") {
      out.siteName = optionValue(args, index, arg);
      index += 1;
    } else if (arg === "--repo-url") {
      out.repoUrl = optionValue(args, index, arg);
      index += 1;
    } else if (arg === "--local-path") {
      out.localPath = optionValue(args, index, arg);
      index += 1;
    } else if (arg === "--url") {
      out.url = optionValue(args, index, arg);
      index += 1;
    } else if (arg === "--screenshot") {
      out.screenshots.push(optionValue(args, index, arg));
      index += 1;
    } else if (arg === "--locale") {
      out.locale = optionValue(args, index, arg);
      index += 1;
    } else if (arg === "--viewport") {
      out.viewports.push(optionValue(args, index, arg));
      index += 1;
    } else if (parseBriefSourceFlag(args, out)) {
      index = out.index;
    } else if (arg.startsWith("--")) {
      throw new Error(unknownOptionMessage("start", arg, START_OPTIONS));
    } else {
      out.briefParts.push(arg);
    }
  }

  const { index: _index, ...parsed } = out;
  return parsed;
}

function renderList(items, emptyText, renderItem) {
  if (items.length === 0) return `- ${emptyText}`;
  return items.map(renderItem).join("\n");
}

export function renderStartMarkdown(payload) {
  const context = payload.context;
  const references = payload.effects.intended.reads;
  return [
    `# Start: ${payload.brief}`,
    "",
    "> Read-only composition plan. Declared repositories, URLs, and screenshots were not inspected.",
    "",
    "## Context",
    "",
    `- Route: \`${payload.route.id}\` (${payload.route.label})`,
    `- Locale: \`${context.locale || "not provided"}\``,
    `- Viewports: ${context.viewports.length ? context.viewports.map((item) => `\`${item}\``).join(", ") : "not provided"}`,
    "",
    "## Declared references",
    "",
    renderList(references, "No external or local project references provided.", (item) => `- ${item.kind}: \`${item.reference}\` (${item.status})`),
    "",
    "## Selected pathway",
    "",
    `- ID: \`${payload.pathway.id}\``,
    `- Status: \`${payload.pathway.status}\``,
    `- Reason: ${payload.pathway.reason}`,
    `- Next command: \`${payload.pathway.command}\``,
    ...(payload.pathway.missingInputs.length ? [`- Missing inputs: ${payload.pathway.missingInputs.join(", ")}`] : []),
    "",
    "## Execution boundary",
    "",
    `- Performed local writes: ${payload.effects.performed.localWrites.length}`,
    `- Performed target-repo mutations: ${payload.effects.performed.targetRepoMutations.length}`,
    `- Performed external actions: ${payload.effects.performed.externalActions.length}`,
    `- Intended reference reads: ${payload.effects.intended.reads.length}`,
    `- Intended local writes: ${payload.effects.intended.localWrites.length}`,
    "",
    "## Review state",
    "",
    `- Status: \`${payload.review.status}\``,
    "- No design artifact, repository, page, screenshot, or runtime behavior was reviewed by this command.",
    "",
    "## Design contract",
    "",
    payload.designContract.markdown,
  ].join("\n");
}

export function formatStartJson(payload) {
  return JSON.stringify(payload, null, 2);
}
