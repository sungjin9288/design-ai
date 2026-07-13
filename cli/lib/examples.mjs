// Worked example discovery for `design-ai examples`.

import {
  readFileSync,
} from "node:fs";
import path from "node:path";

import { assertKnownRouteId } from "./route-catalog.mjs";
import { buildPreview, walkMarkdown } from "./search.mjs";
import { unknownOptionMessage } from "./suggest.mjs";

const DEFAULT_LIMIT = 12;
const EXAMPLES_OPTIONS = ["-h", "--help", "--json", "--route", "--limit"];

const ROUTE_EXAMPLE_QUERIES = {
  "design-review": "dogfood review audit",
  "design-engineering-review": "design engineering interface craft polish motion interaction review",
  "design-from-brief": "dogfood design system",
  "component-spec": "component",
  "palette-from-brand": "palette",
  "motion-design": "motion loading transition lottie",
  "illustration": "illustration empty state",
  "print": "print business card packaging",
  "video": "video hero player",
  "game-ui": "game hud menu",
  "conversational": "chat voice conversational",
  "spatial": "spatial",
  "document-from-brief": "doc tutorial how-to explanation",
  "slide-deck": "slide deck",
  "handoff-spec": "handoff spec component",
  "design-system-qa": "dogfood findings qa",
  "figma-token-sync": "token palette",
  "design-pr-review": "dogfood findings review",
  "stability-review": "dogfood findings release",
  "agentic-design-development": "agentic design development reference mining artifact contract approval gate mcp sdk internal skill",
  "flow-design": "flow report block moderation onboarding",
  "dashboard-design": "dashboard settlement admin data table KPI",
  "marketing-page": "landing hero pricing email template saas",
};

const ROUTE_CATEGORY_BOOSTS = {
  "component-spec": ["component"],
  "palette-from-brand": ["palette"],
  "print": ["print"],
  "document-from-brief": ["document"],
  "slide-deck": ["slide"],
  "design-system-qa": ["case-study", "report"],
  "design-pr-review": ["case-study", "report"],
  "stability-review": ["case-study", "report"],
};

const CANONICAL_ROUTE_EXAMPLES = {
  "design-review": ["examples/report-example.md"],
  "design-engineering-review": ["examples/design-engineering-review-command-palette.md"],
  "design-from-brief": ["examples/dogfood-korean-fintech-system.md"],
  "component-spec": ["examples/component-button.md"],
  "palette-from-brand": ["examples/palette-saas-violet.md"],
  "motion-design": ["examples/component-carousel.md"],
  "spatial": ["examples/component-spatial-panel.md"],
  "print": ["examples/print-business-card-spec.md", "examples/print-packaging-spec.md"],
  "game-ui": ["examples/component-game-menu.md"],
  "slide-deck": ["examples/slide-deck-example.md"],
  "figma-token-sync": ["examples/palette-saas-violet.md"],
  "agentic-design-development": ["examples/agentic-design-development-reference-mining.md"],
  "flow-design": ["examples/flow-design-report-block.md"],
  "dashboard-design": ["examples/dashboard-design-settlement.md"],
  "marketing-page": ["examples/marketing-page-saas-landing.md"],
};

export function parseExamplesArgs(args) {
  const out = {
    queryParts: [],
    routeId: "",
    limit: DEFAULT_LIMIT,
    json: false,
    help: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "-h" || arg === "--help") {
      out.help = true;
    } else if (arg === "--json") {
      out.json = true;
    } else if (arg === "--route") {
      const routeId = args[i + 1];
      if (!routeId || routeId.startsWith("--")) throw new Error("--route expects a route id");
      out.routeId = routeId;
      i += 1;
    } else if (arg === "--limit") {
      const limit = Number(args[i + 1]);
      if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw new Error("--limit expects an integer from 1 to 100");
      }
      out.limit = limit;
      i += 1;
    } else if (arg.startsWith("--")) {
      throw new Error(unknownOptionMessage("examples", arg, EXAMPLES_OPTIONS));
    } else {
      out.queryParts.push(arg);
    }
  }

  return {
    ...out,
    query: out.queryParts.join(" ").trim(),
  };
}

function firstHeading(content, fallback) {
  const heading = content.split("\n").find((line) => /^#\s+/.test(line.trim()));
  if (heading) return heading.replace(/^#\s+/, "").trim();
  return fallback;
}

function categoryFor(relPath) {
  const name = path.basename(relPath, ".md");
  if (name.startsWith("component-")) return "component";
  if (name.startsWith("palette-")) return "palette";
  if (name.startsWith("print-")) return "print";
  if (name.startsWith("doc-")) return "document";
  if (name.startsWith("slide-")) return "slide";
  if (name.includes("dogfood")) return "case-study";
  if (name.includes("report")) return "report";
  if (name.includes("email")) return "email";
  return "example";
}

function queryTerms(query) {
  return query
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length >= 2);
}

function firstUsefulLine(content) {
  return content
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith("---") && !line.startsWith("#")) || "";
}

function matchLine(content, terms) {
  if (terms.length === 0) return firstUsefulLine(content);
  const lines = content.split("\n");
  return lines.find((line) => {
    const lower = line.toLowerCase();
    return terms.some((term) => lower.includes(term));
  }) || firstUsefulLine(content);
}

function scoreExample({ relPath, title, content }, terms) {
  if (terms.length === 0) return 0;
  const haystack = `${relPath}\n${title}`.toLowerCase();
  const contentLower = content.toLowerCase();
  const stem = path.basename(relPath, ".md").replace(/^component-/, "");
  return terms.reduce((score, term) => {
    if (stem === term) return score + 12;
    if (stem.startsWith(`${term}-`)) return score + 2;
    if (haystack.includes(term)) return score + 4;
    if (contentLower.includes(term)) return score + 1;
    return score;
  }, 0);
}

function routeBoost(routeId, category) {
  if (!routeId) return 0;
  return ROUTE_CATEGORY_BOOSTS[routeId]?.includes(category) ? 8 : 0;
}

function canonicalBoost(routeId, relPath) {
  if (!routeId) return 0;
  return CANONICAL_ROUTE_EXAMPLES[routeId]?.includes(relPath) ? 20 : 0;
}

function has(pattern, content) {
  return pattern.test(content);
}

function qualityBoost(content) {
  let score = 0;
  if (has(/\b(?:knowledge|refs)\/[A-Za-z0-9._/-]+\.md\b|PRINCIPLES\.md\b/, content)) score += 3;
  if (has(/\b\d+(?:\.\d+)?:1\b/, content)) score += 3;
  if (has(/\b(keyboard|focus|tab order|tab key|escape|arrow key|focus-visible)\b/i, content)) score += 2;
  if (has(/\b(responsive|mobile|desktop|tablet|breakpoint|viewport)\b/i, content)) score += 2;
  if (has(/\b(screen reader|assistive technolog|aria-|aria\b|sr-only|role=)\b/i, content)) score += 2;
  if (has(/\b(don't|do not|avoid|anti-pattern|misuse)\b/i, content)) score += 1;
  return score;
}

function routeQualityBoost(routeId, content) {
  if (routeId === "component-spec") {
    let score = 0;
    if (has(/\b(anatomy|structure|slot)\b/i, content)) score += 4;
    if (has(/\b(variant|state|disabled|hover|active)\b/i, content)) score += 4;
    if (has(/\b(api|props?|property|attribute)\b/i, content)) score += 4;
    return score;
  }

  if (routeId === "palette-from-brand") {
    let score = 0;
    if (has(/\bsemantic\b.*\btoken|\b--color-[a-z0-9-]+/i, content)) score += 4;
    if (has(/\bprimitive\b|\bscale\b|\bpalette\b/i, content)) score += 4;
    if (has(/\b\d+(?:\.\d+)?:1\b/, content)) score += 4;
    return score;
  }

  return 0;
}

function isDraftExample(content) {
  return /DRAFT\s+[—-]\s+scaffolded/i.test(content);
}

export function listExamples({ designAiPath, query = "", routeId = "", limit = DEFAULT_LIMIT }) {
  assertKnownRouteId(routeId);

  const routeQuery = routeId ? ROUTE_EXAMPLE_QUERIES[routeId] || routeId : "";
  const effectiveQuery = [query, routeQuery].filter(Boolean).join(" ").trim();
  const terms = queryTerms(effectiveQuery);
  const examplesRoot = path.join(designAiPath, "examples");
  const files = walkMarkdown(examplesRoot).filter((file) => path.basename(file) !== "README.md");
  const examples = [];

  for (const file of files) {
    let content;
    try {
      content = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    if (isDraftExample(content)) continue;
    const relPath = path.relative(designAiPath, file);
    const title = firstHeading(content, path.basename(file, ".md"));
    const category = categoryFor(relPath);
    const previewLine = matchLine(content, terms);
    const textScore = scoreExample({ relPath, title, content }, terms);
    const structuralScore = routeBoost(routeId, category) + canonicalBoost(routeId, relPath);
    const score = textScore
      + structuralScore
      + qualityBoost(content)
      + routeQualityBoost(routeId, content);
    if (terms.length > 0 && textScore + structuralScore === 0) continue;

    examples.push({
      relPath,
      title,
      category,
      score,
      preview: buildPreview(previewLine, terms[0] || ""),
    });
  }

  examples.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.relPath.localeCompare(b.relPath);
  });

  return {
    query,
    routeId,
    effectiveQuery,
    examples: examples.slice(0, limit),
  };
}

export function formatExamplesJson(payload) {
  return JSON.stringify(payload, null, 2);
}
