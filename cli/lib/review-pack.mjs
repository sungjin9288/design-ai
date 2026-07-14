import {
  listProductReviewPacks,
  loadProductReviewPack,
} from "./product-review-pack.mjs";
import { unknownOptionMessage } from "./suggest.mjs";

const OPTIONS = ["-h", "--help", "--json"];

export function parseReviewPackArgs(args) {
  const parsed = { id: "", json: false, help: false };
  for (const arg of args) {
    if (arg === "-h" || arg === "--help") parsed.help = true;
    else if (arg === "--json") parsed.json = true;
    else if (arg.startsWith("-")) throw new Error(unknownOptionMessage("review-pack", arg, OPTIONS));
    else if (!parsed.id) parsed.id = arg;
    else throw new Error(`review-pack accepts one pack id; received unexpected argument: ${arg}`);
  }
  return parsed;
}

export function buildReviewPackResult(parsed) {
  if (parsed.id) return loadProductReviewPack(parsed.id);
  return {
    kind: "design-ai-product-review-pack-list",
    schemaVersion: 1,
    packs: listProductReviewPacks(),
  };
}

export function renderReviewPackMarkdown(result) {
  if (result.kind === "design-ai-product-review-pack-list") {
    return [
      "# Korean product review packs",
      "",
      ...result.packs.map((pack) => (
        `- **${pack.id}** revision ${pack.revision} — ${pack.summary} (${pack.criteriaCount} criteria; ${pack.benchmark})`
      )),
    ].join("\n");
  }

  return [
    `# ${result.name}`,
    "",
    result.summary,
    "",
    `- Pack: ${result.id}`,
    `- Revision: ${result.revision}`,
    `- Domain: ${result.domain}`,
    `- Locale: ${result.locale}`,
    `- Viewports: ${result.viewports.map((viewport) => `${viewport.name} ${viewport.width}×${viewport.height}`).join(", ")}`,
    `- Boundary: ${result.boundary.mode}; no target repository mutation or external write`,
    "",
    "## Criteria",
    "",
    ...result.criteria.map((criterion) => (
      `- **${criterion.title}** — ${criterion.mode}, ${criterion.severity}; ${criterion.question}`
    )),
    "",
    "## Benchmark",
    "",
    `- Source: ${result.benchmark.source}`,
    `- Expected findings: ${result.benchmark.expectedFindingIds.length}`,
  ].join("\n");
}
