// Deterministic task routing for `design-ai route`.

import {
  existsSync,
  readFileSync,
} from "node:fs";
import path from "node:path";

import { parseBriefSourceFlag } from "./brief.mjs";
import { rankedSearchCorpus } from "./search-ranked.mjs";
import { suggestNearest, unknownOptionMessage } from "./suggest.mjs";

function exists(p) {
  try {
    return existsSync(p);
  } catch {
    return false;
  }
}

const COMMON_KNOWLEDGE = [
  "knowledge/PRINCIPLES.md",
];
const ROUTE_OPTIONS = [
  "-h",
  "--help",
  "--json",
  "--list",
  "--explain",
  "--eval-template",
  "--eval",
  "--strict",
  "--from-file",
  "--stdin",
  "--limit",
];
const ROUTE_EVAL_VERSION = 1;
const ROUTE_EVAL_DEFAULT_LIMIT = 3;
// Advisory "Related knowledge" recall (docs/AI-LEARNING-PHASE2.md, "Phase A
// implementation review" Q3): under `--explain` only, surface the top corpus
// knowledge/ files recalled by the shipped deterministic lexical scorer that the
// route's curated `knowledge` list does NOT already point to. Purely additive —
// it never changes route selection, ids, scores, or the curated list. Restricted
// to knowledge/ so it surfaces design knowledge, not docs/QUICKSTART. The recall
// pulls RELATED_KNOWLEDGE_RECALL_LIMIT candidates then keeps the top
// RELATED_KNOWLEDGE_KEEP after excluding the curated set.
const RELATED_KNOWLEDGE_DIRS = ["knowledge"];
const RELATED_KNOWLEDGE_RECALL_LIMIT = 10;
const RELATED_KNOWLEDGE_KEEP = 3;
const CONFIDENCE_ORDER = {
  low: 1,
  medium: 2,
  high: 3,
};

export const ROUTES = [
  {
    id: "design-review",
    label: "Design review",
    command: "commands/design-review.md",
    skills: ["skills/ux-audit/SKILL.md", "skills/design-critique/SKILL.md"],
    agents: ["agents/a11y-reviewer.md", "agents/design-critic.md"],
    knowledge: [
      "knowledge/patterns/ux-guidelines.md",
      "knowledge/a11y/contrast.md",
      "knowledge/a11y/keyboard-and-focus.md",
    ],
    keywords: ["audit", "review", "critique", "figma", "screenshot", "ux", "a11y", "accessibility", "리뷰", "감사", "평가", "비평", "접근성", "스크린샷"],
  },
  {
    id: "website-improvement",
    label: "Website improvement",
    command: "commands/website-improvement.md",
    skills: ["skills/website-improvement/SKILL.md", "skills/ux-audit/SKILL.md", "skills/handoff-spec/SKILL.md"],
    agents: ["agents/a11y-reviewer.md", "agents/design-critic.md"],
    knowledge: [
      "knowledge/patterns/ux-guidelines.md",
      "knowledge/a11y/contrast.md",
      "knowledge/a11y/keyboard-and-focus.md",
      "knowledge/layout/spacing-and-grid.md",
      "knowledge/patterns/report-design.md",
      "docs/MCP-INTEGRATION.md",
      "docs/WEBSITE-IMPROVEMENT.md",
    ],
    keywords: ["website", "webpage", "homepage", "landing", "seo", "performance", "lighthouse", "core web vitals", "mcp", "refactor plan", "handoff report", "site profile", "웹사이트", "홈페이지", "랜딩", "성능", "검색엔진", "개선", "리팩터"],
  },
  {
    id: "design-from-brief",
    label: "Design system from brief",
    command: "commands/design-from-brief.md",
    skills: ["skills/color-palette/SKILL.md", "skills/design-system-builder/SKILL.md", "skills/handoff-spec/SKILL.md"],
    knowledge: [
      "knowledge/patterns/ui-reasoning.md",
      "knowledge/patterns/styles-catalog.md",
      "knowledge/layout/spacing-and-grid.md",
      "knowledge/typography/type-scale-fundamentals.md",
    ],
    keywords: ["brief", "design system", "brand", "tokens", "foundation", "app", "product", "startup", "서비스", "브랜드", "디자인 시스템", "토큰", "앱", "프로덕트"],
  },
  {
    id: "component-spec",
    label: "Component spec",
    command: "commands/component-spec.md",
    skills: ["skills/component-spec-writer/SKILL.md"],
    agents: ["agents/component-architect.md", "agents/a11y-reviewer.md"],
    knowledge: [
      "knowledge/components/INDEX.md",
      "knowledge/components/shadcn-registry.md",
      "knowledge/a11y/keyboard-and-focus.md",
    ],
    keywords: ["component", "button", "input", "modal", "dialog", "table", "form", "dropdown", "select", "spec", "api", "props", "컴포넌트", "버튼", "입력", "모달", "폼", "테이블", "스펙"],
  },
  {
    id: "palette-from-brand",
    label: "Palette from brand",
    command: "commands/palette-from-brand.md",
    skills: ["skills/color-palette/SKILL.md"],
    knowledge: [
      "knowledge/colors/color-theory.md",
      "knowledge/a11y/contrast.md",
      "knowledge/design-tokens/tailwind-v4.md",
    ],
    keywords: ["color", "palette", "theme", "dark mode", "hex", "oklch", "색", "색상", "컬러", "팔레트", "다크모드"],
  },
  {
    id: "motion-design",
    label: "Motion design",
    command: "commands/motion-design.md",
    skills: ["skills/motion-designer/SKILL.md"],
    knowledge: [
      "knowledge/motion/principles.md",
      "knowledge/motion/micro-interactions.md",
      "knowledge/motion/choreography-depth.md",
    ],
    keywords: ["motion", "animation", "transition", "framer", "gsap", "lottie", "모션", "애니메이션", "전환", "인터랙션"],
  },
  {
    id: "illustration",
    label: "Illustration",
    command: "commands/illustration.md",
    skills: ["skills/illustration-designer/SKILL.md"],
    knowledge: [
      "knowledge/illustration/illustration-systems.md",
      "knowledge/illustration/spot-illustrations.md",
      "knowledge/illustration/mascot-design.md",
    ],
    keywords: ["illustration", "mascot", "svg", "empty state", "hero art", "일러스트", "마스코트", "캐릭터", "빈 상태"],
  },
  {
    id: "print",
    label: "Print design",
    command: "commands/print.md",
    skills: ["skills/print-designer/SKILL.md"],
    knowledge: [
      "knowledge/print/print-fundamentals.md",
      "knowledge/print/stationery.md",
      "knowledge/print/packaging.md",
    ],
    keywords: ["print", "business card", "brochure", "packaging", "poster", "cmyk", "bleed", "인쇄", "명함", "브로셔", "패키지", "포스터"],
  },
  {
    id: "video",
    label: "Video design",
    command: "commands/video.md",
    skills: ["skills/video-designer/SKILL.md"],
    knowledge: [
      "knowledge/video/video-fundamentals.md",
      "knowledge/video/marketing-video.md",
      "knowledge/video/social-and-short-form.md",
    ],
    keywords: ["video", "reels", "shorts", "tiktok", "caption", "subtitles", "영상", "비디오", "릴스", "쇼츠", "자막"],
  },
  {
    id: "game-ui",
    label: "Game UI",
    command: "commands/game-ui.md",
    skills: ["skills/game-ui-designer/SKILL.md"],
    knowledge: [
      "knowledge/game-ui/game-ui-fundamentals.md",
      "knowledge/game-ui/hud-design.md",
      "knowledge/game-ui/menu-systems.md",
    ],
    keywords: ["game", "hud", "inventory", "gacha", "cooldown", "게임", "인벤토리", "확률", "뽑기"],
  },
  {
    id: "conversational",
    label: "Conversational UI",
    command: "commands/conversational.md",
    skills: ["skills/conversational-ui-designer/SKILL.md"],
    knowledge: [
      "knowledge/conversational/ai-chat-interfaces.md",
      "knowledge/conversational/chatbot-design.md",
      "knowledge/conversational/korean-voice-conventions.md",
    ],
    keywords: ["chatbot", "voice", "assistant", "ai chat", "conversation", "챗봇", "대화", "음성", "어시스턴트"],
  },
  {
    id: "spatial",
    label: "Spatial design",
    command: "commands/spatial.md",
    skills: ["skills/spatial-designer/SKILL.md"],
    knowledge: [
      "knowledge/spatial/spatial-design-fundamentals.md",
      "knowledge/spatial/vr-patterns.md",
      "knowledge/spatial/ar-patterns.md",
    ],
    keywords: ["spatial", "vr", "ar", "xr", "vision pro", "webxr", "immersive", "공간", "증강현실", "가상현실"],
  },
  {
    id: "document-from-brief",
    label: "Documentation",
    command: "commands/document-from-brief.md",
    skills: ["skills/document-author/SKILL.md"],
    knowledge: [
      "knowledge/patterns/information-architecture.md",
      "knowledge/patterns/technical-writing.md",
      "knowledge/patterns/document-typography.md",
    ],
    keywords: ["documentation", "docs", "guide", "manual", "readme", "diataxis", "문서", "가이드", "매뉴얼", "기술문서"],
  },
  {
    id: "slide-deck",
    label: "Slide deck",
    command: "commands/slide-deck.md",
    skills: ["skills/slide-deck-author/SKILL.md"],
    knowledge: [
      "knowledge/patterns/slide-deck-design.md",
      "knowledge/patterns/report-design.md",
    ],
    keywords: ["slide", "deck", "presentation", "pitch", "ppt", "슬라이드", "발표", "제안서", "피치덱"],
  },
  {
    id: "handoff-spec",
    label: "Design handoff",
    command: null,
    skills: ["skills/handoff-spec/SKILL.md"],
    knowledge: [
      "knowledge/patterns/technical-writing.md",
      "knowledge/design-tokens/ant-design.md",
    ],
    keywords: ["handoff", "engineering", "developer", "implementation spec", "dev spec", "핸드오프", "개발 전달", "개발자"],
  },
  {
    id: "design-system-qa",
    label: "Design system QA",
    command: null,
    skills: ["skills/design-system-qa/SKILL.md"],
    knowledge: [
      "knowledge/patterns/design-system-qa.md",
      "knowledge/a11y/keyboard-and-focus.md",
    ],
    keywords: ["qa", "test", "regression", "visual regression", "storybook", "contract", "테스트", "회귀", "품질"],
  },
  {
    id: "figma-token-sync",
    label: "Figma token sync",
    command: null,
    skills: ["skills/figma-token-sync/SKILL.md"],
    knowledge: [
      "knowledge/design-tokens/ant-design.md",
      "knowledge/design-tokens/tailwind-v4.md",
    ],
    keywords: ["figma token", "token sync", "variables", "figma variables", "피그마 토큰", "토큰 동기화", "변수"],
  },
  {
    id: "design-pr-review",
    label: "Design PR review",
    command: null,
    skills: ["skills/design-pr-review/SKILL.md"],
    knowledge: [
      "knowledge/patterns/design-system-qa.md",
      "knowledge/a11y/contrast.md",
    ],
    keywords: ["pull request", "pr", "github", "diff", "code review", "깃허브", "코드 리뷰", "PR"],
  },
  {
    id: "stability-review",
    label: "Stability review",
    command: "commands/stability-review.md",
    skills: [],
    knowledge: [
      "docs/RELEASE-CHECKLIST.md",
      "docs/CONTRIBUTING.md",
    ],
    keywords: ["release", "stability", "stale", "quarterly", "launch", "릴리스", "안정화", "오래된", "출시"],
  },
];

export function routeIds() {
  return ROUTES.map((route) => route.id);
}

export function suggestRouteId(routeId, ids = routeIds()) {
  return suggestNearest(routeId, ids);
}

export function unknownRouteIdMessage(routeId, ids = routeIds()) {
  const suggestion = suggestRouteId(routeId, ids);
  const lines = [`Unknown route id: ${routeId}.`];
  if (suggestion) lines.push(`Did you mean \`${suggestion}\`?`);
  lines.push(`Available routes: ${ids.join(", ")}`);
  return lines.join("\n");
}

export function assertKnownRouteId(routeId, { allowEmpty = true } = {}) {
  if (!routeId && allowEmpty) return;
  if (ROUTES.some((route) => route.id === routeId)) return;
  throw new Error(unknownRouteIdMessage(routeId));
}

export function parseRouteArgs(args) {
  const out = {
    briefParts: [],
    fromFile: "",
    stdin: false,
    list: false,
    explain: false,
    evalTemplate: false,
    eval: false,
    strict: false,
    limit: 3,
    json: false,
    help: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    out.index = i;
    if (arg === "-h" || arg === "--help") {
      out.help = true;
    } else if (arg === "--json") {
      out.json = true;
    } else if (arg === "--list") {
      out.list = true;
    } else if (arg === "--explain") {
      out.explain = true;
    } else if (arg === "--eval-template") {
      out.evalTemplate = true;
    } else if (arg === "--eval") {
      out.eval = true;
    } else if (arg === "--strict") {
      out.strict = true;
    } else if (parseBriefSourceFlag(args, out)) {
      i = out.index;
    } else if (arg === "--limit") {
      const limit = Number(args[i + 1]);
      if (!Number.isInteger(limit) || limit < 1 || limit > 10) {
        throw new Error("--limit expects an integer from 1 to 10");
      }
      out.limit = limit;
      i += 1;
    } else if (arg.startsWith("--")) {
      throw new Error(unknownOptionMessage("route", arg, ROUTE_OPTIONS));
    } else {
      out.briefParts.push(arg);
    }
  }

  if (out.eval && out.evalTemplate) {
    throw new Error("Choose either --eval-template or --eval, not both");
  }
  if (out.strict && !out.eval) {
    throw new Error("--strict can only be used with --eval");
  }
  if (out.evalTemplate && (out.fromFile || out.stdin || out.list || out.briefParts.length > 0)) {
    throw new Error("--eval-template cannot be combined with a brief, --from-file, --stdin, or --list");
  }
  if (out.eval && (!out.fromFile && !out.stdin)) {
    throw new Error("--eval requires --from-file or --stdin");
  }
  if (out.eval && (out.briefParts.length > 0 || out.list)) {
    throw new Error("--eval cannot be combined with an inline brief or --list");
  }

  return {
    ...out,
    index: undefined,
    brief: out.briefParts.join(" ").trim(),
  };
}

function keywordHits(text, keywords) {
  const lower = text.toLowerCase();
  return keywords.filter((keyword) => keywordMatches(lower, keyword));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function keywordMatches(lowerText, keyword) {
  const lowerKeyword = keyword.toLowerCase();
  const isSimpleLatin = /^[a-z0-9+#.]+$/.test(lowerKeyword);

  if (isSimpleLatin) {
    const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(lowerKeyword)}($|[^a-z0-9])`);
    return pattern.test(lowerText);
  }

  return lowerText.includes(lowerKeyword);
}

function confidence(score) {
  if (score >= 4) return "high";
  if (score >= 2) return "medium";
  return "low";
}

function pathStatus(sourceRoot, paths) {
  return paths.map((relPath) => ({
    path: relPath,
    exists: exists(path.join(sourceRoot, relPath)),
  }));
}

function countAvailable(entries) {
  return entries.filter((entry) => entry.exists).length;
}

function referenceCoverage({ command, skills, agents, knowledge }) {
  const commandTotal = command ? 1 : 0;
  const commandAvailable = command?.exists ? 1 : 0;
  const sections = {
    command: { available: commandAvailable, total: commandTotal },
    skills: { available: countAvailable(skills), total: skills.length },
    agents: { available: countAvailable(agents), total: agents.length },
    knowledge: { available: countAvailable(knowledge), total: knowledge.length },
  };
  const total = Object.values(sections).reduce(
    (acc, section) => ({
      available: acc.available + section.available,
      total: acc.total + section.total,
    }),
    { available: 0, total: 0 },
  );

  return {
    ...sections,
    total,
  };
}

function missingReferences({ command, skills, agents, knowledge }) {
  return [
    ...(command ? [command] : []),
    ...skills,
    ...agents,
    ...knowledge,
  ].filter((entry) => !entry.exists).map((entry) => entry.path);
}

function explanationSummary({ hits, forced, fallback, catalog }) {
  if (forced) return "Route selected explicitly with --route.";
  if (fallback) return "No route keywords matched; using the default design-from-brief workflow.";
  if (catalog) return "Catalog listing; no task brief was scored.";
  return `Matched ${hits.length} keyword${hits.length === 1 ? "" : "s"}: ${hits.join(", ")}.`;
}

function routeExplanation({ hits, command, skills, agents, knowledge, forced = false, fallback = false, catalog = false }) {
  const coverage = referenceCoverage({ command, skills, agents, knowledge });
  return {
    summary: explanationSummary({ hits, forced, fallback, catalog }),
    scoreBreakdown: [
      { label: "keyword matches", value: hits.length },
    ],
    referenceCoverage: coverage,
    missingReferences: missingReferences({ command, skills, agents, knowledge }),
  };
}

// Advisory related-knowledge recall for a single route. REUSES rankedSearchCorpus
// (the shipped deterministic lexical scorer — score desc, id asc) scoped to
// knowledge/, excludes the route's curated knowledge relPaths, and keeps the top
// RELATED_KNOWLEDGE_KEEP remaining. Returns [] on empty brief or no hits.
function relatedKnowledgeFor({ brief, sourceRoot, curatedRelPaths }) {
  const query = String(brief || "").trim();
  if (!query) return [];

  const curated = new Set(curatedRelPaths);
  const { hits } = rankedSearchCorpus({
    query,
    dirs: RELATED_KNOWLEDGE_DIRS,
    limit: RELATED_KNOWLEDGE_RECALL_LIMIT,
    designAiPath: sourceRoot,
    // Recall/injection surface: keep generated index/meta docs (COVERAGE.md,
    // INDEX.md, docs/reference/*) out of the advisory related-knowledge list.
    excludeGeneratedIndex: true,
  });

  return hits
    .filter((hit) => !curated.has(hit.relPath))
    .slice(0, RELATED_KNOWLEDGE_KEEP)
    .map((hit) => ({
      id: hit.relPath,
      score: hit.score,
      matchedTokens: hit.matchedTokens,
    }));
}

function routeToResult(route, sourceRoot, hits, options = {}) {
  const command = route.command
    ? { path: route.command, exists: exists(path.join(sourceRoot, route.command)) }
    : null;
  const skills = pathStatus(sourceRoot, route.skills || []);
  const agents = pathStatus(sourceRoot, route.agents || []);
  const knowledge = pathStatus(sourceRoot, [...COMMON_KNOWLEDGE, ...(route.knowledge || [])]);
  const forced = Boolean(options.forced);
  const fallback = Boolean(options.fallback);
  const catalog = Boolean(options.catalog);

  // Advisory related-knowledge is attached ONLY when explain is requested, so the
  // default `route` JSON stays byte-unchanged. `knowledge` already merges
  // COMMON_KNOWLEDGE + route.knowledge, so its relPaths are the dedupe set.
  const relatedKnowledge = options.explain
    ? relatedKnowledgeFor({
      brief: options.brief || "",
      sourceRoot,
      curatedRelPaths: knowledge.map((entry) => entry.path),
    })
    : null;

  return {
    id: route.id,
    label: route.label,
    score: hits.length,
    confidence: confidence(hits.length),
    matchedKeywords: hits,
    command,
    skills,
    agents,
    knowledge,
    keywords: route.keywords,
    explanation: routeExplanation({ hits, command, skills, agents, knowledge, forced, fallback, catalog }),
    ...(relatedKnowledge ? { relatedKnowledge } : {}),
    ...(forced ? { forced: true } : {}),
    ...(fallback ? { fallback: true } : {}),
  };
}

export function routeCatalog({ sourceRoot }) {
  return ROUTES.map((route) => ({
    ...routeToResult(route, sourceRoot, [], { catalog: true }),
    confidence: "catalog",
  }));
}

export function routeById({ routeId, sourceRoot }) {
  assertKnownRouteId(routeId, { allowEmpty: false });
  const route = ROUTES.find((item) => item.id === routeId);

  return {
    ...routeToResult(route, sourceRoot, [], { forced: true }),
    confidence: "forced",
  };
}

function fallbackResult(sourceRoot, options = {}) {
  const route = ROUTES.find((item) => item.id === "design-from-brief");
  return {
    ...routeToResult(route, sourceRoot, [], { fallback: true, ...options }),
    confidence: "low",
  };
}

export function routeBrief({ brief, sourceRoot, limit = 3, explain = false }) {
  const normalized = brief.trim();
  if (!normalized) return [];

  // Only compute advisory related-knowledge under --explain; keep the default
  // routing (keyword scoring, ordering, selection) completely unchanged.
  const resultOptions = explain ? { explain: true, brief: normalized } : {};

  const scored = ROUTES
    .map((route) => ({ route, hits: keywordHits(normalized, route.keywords) }))
    .filter((item) => item.hits.length > 0)
    .sort((a, b) => {
      if (b.hits.length !== a.hits.length) return b.hits.length - a.hits.length;
      return a.route.label.localeCompare(b.route.label);
    })
    .slice(0, limit)
    .map((item) => routeToResult(item.route, sourceRoot, item.hits, resultOptions));

  if (scored.length > 0) return scored;
  return [fallbackResult(sourceRoot, resultOptions)];
}

function isoTimestamp(now = new Date()) {
  return (now instanceof Date ? now : new Date(now)).toISOString();
}

export function buildRouteEvalTemplate({ sourceRoot, generatedAt = new Date() } = {}) {
  return {
    version: ROUTE_EVAL_VERSION,
    generatedAt: isoTimestamp(generatedAt),
    sourceRouteVersion: sourceRoot ? readRouteManifestVersion(sourceRoot) : "unknown",
    description: "Deterministic route-selection checkpoints for design-ai agent routing.",
    cases: [
      {
        id: "design-review-a11y",
        brief: "Audit and review a Figma signup flow for accessibility, keyboard focus, screen reader behavior, critique, and UX risk",
        expectedRouteId: "design-review",
        minConfidence: "high",
      },
      {
        id: "website-improvement-control-tower",
        brief: "Improve a website homepage with SEO, performance, MCP readiness, and a refactor plan",
        expectedRouteId: "website-improvement",
        minConfidence: "high",
      },
      {
        id: "component-spec-contract",
        brief: "Spec a Button component API with variants, props, states, and keyboard accessibility",
        expectedRouteId: "component-spec",
        minConfidence: "medium",
      },
      {
        id: "learning-design-system-qa",
        brief: "Audit our design system QA with visual regression, token contract tests, and accessibility coverage",
        expectedRouteId: "design-system-qa",
        minConfidence: "medium",
      },
      {
        id: "korean-palette",
        brief: "Generate a Korean SaaS color palette with semantic tokens, dark mode, and contrast ratios",
        expectedRouteId: "palette-from-brand",
        minConfidence: "medium",
      },
      {
        id: "motion-spec",
        brief: "Spec motion, animation, and transition behavior with duration, easing, choreography, Framer guidance, and reduced motion support",
        expectedRouteId: "motion-design",
        minConfidence: "high",
      },
    ],
  };
}

function routeEvalStatus(counts) {
  if (counts.fail > 0) return "fail";
  if (counts.warn > 0) return "warn";
  return "pass";
}

function normalizeRouteEvalPayload(evalText, source = "route-eval.json") {
  let payload;
  try {
    payload = JSON.parse(evalText);
  } catch (err) {
    throw new Error(`Could not parse route eval JSON from ${source}: ${err.message}`);
  }

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new Error("Route eval payload must be a JSON object");
  }
  if (payload.version !== ROUTE_EVAL_VERSION) {
    throw new Error(`Route eval payload version must be ${ROUTE_EVAL_VERSION}`);
  }
  if (!Array.isArray(payload.cases)) {
    throw new Error("Route eval payload must include a cases array");
  }

  return payload;
}

function normalizeRouteEvalCase(rawCase, index) {
  if (!rawCase || typeof rawCase !== "object" || Array.isArray(rawCase)) {
    throw new Error(`Route eval case ${index + 1} must be a JSON object`);
  }

  const id = String(rawCase.id || `case-${index + 1}`).trim();
  const brief = String(rawCase.brief || "").trim();
  const expectedRouteId = String(rawCase.expectedRouteId || rawCase.expected || "").trim();
  const minConfidence = String(rawCase.minConfidence || "").trim().toLowerCase();
  const limit = rawCase.limit === undefined || rawCase.limit === null
    ? ROUTE_EVAL_DEFAULT_LIMIT
    : Number(rawCase.limit);

  if (!id) throw new Error(`Route eval case ${index + 1} is missing id`);
  if (!brief) throw new Error(`Route eval case ${id} is missing brief`);
  if (!expectedRouteId) throw new Error(`Route eval case ${id} is missing expectedRouteId`);
  if (minConfidence && !Object.hasOwn(CONFIDENCE_ORDER, minConfidence)) {
    throw new Error(`Route eval case ${id} has invalid minConfidence: ${minConfidence}`);
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 10) {
    throw new Error(`Route eval case ${id} limit must be an integer from 1 to 10`);
  }

  return {
    id,
    brief,
    expectedRouteId,
    minConfidence,
    limit,
  };
}

function evaluateRouteEvalCase(testCase, sourceRoot, defaultLimit) {
  let expectedKnown = true;
  try {
    assertKnownRouteId(testCase.expectedRouteId, { allowEmpty: false });
  } catch {
    expectedKnown = false;
  }

  const limit = testCase.limit || defaultLimit || ROUTE_EVAL_DEFAULT_LIMIT;
  const routes = routeBrief({
    brief: testCase.brief,
    sourceRoot,
    limit,
  });
  const topRoute = routes[0] || null;
  const expectedRank = routes.findIndex((route) => route.id === testCase.expectedRouteId);

  let status = "pass";
  let message = "Expected route selected.";

  if (!expectedKnown) {
    status = "fail";
    message = `Expected route id is unknown: ${testCase.expectedRouteId}`;
  } else if (!topRoute) {
    status = "fail";
    message = "No route recommendation was produced.";
  } else if (topRoute.id !== testCase.expectedRouteId) {
    status = "fail";
    message = expectedRank >= 0
      ? `Expected route appeared at rank ${expectedRank + 1}, but top route was ${topRoute.id}.`
      : `Expected ${testCase.expectedRouteId}, but top route was ${topRoute.id}.`;
  } else if (
    testCase.minConfidence
    && CONFIDENCE_ORDER[topRoute.confidence] < CONFIDENCE_ORDER[testCase.minConfidence]
  ) {
    status = "warn";
    message = `Top route matched, but confidence ${topRoute.confidence} is below ${testCase.minConfidence}.`;
  }

  return {
    id: testCase.id,
    status,
    message,
    expectedRouteId: testCase.expectedRouteId,
    topRouteId: topRoute?.id || "",
    topConfidence: topRoute?.confidence || "",
    topScore: topRoute?.score || 0,
    expectedRank,
    matchedKeywords: topRoute?.matchedKeywords || [],
    brief: testCase.brief,
    routes,
  };
}

export function routeEvalReport({
  evalText,
  source = "route-eval.json",
  sourceRoot,
  limit = ROUTE_EVAL_DEFAULT_LIMIT,
  generatedAt = new Date(),
}) {
  const payload = normalizeRouteEvalPayload(evalText, source);
  const normalizedCases = payload.cases.map((testCase, index) => normalizeRouteEvalCase(testCase, index));
  const results = normalizedCases.map((testCase) => evaluateRouteEvalCase(testCase, sourceRoot, limit));
  const counts = results.reduce(
    (acc, result) => ({
      ...acc,
      [result.status]: acc[result.status] + 1,
    }),
    { pass: 0, warn: 0, fail: 0 },
  );
  const summary = {
    total: results.length,
    pass: counts.pass,
    warn: counts.warn,
    fail: counts.fail,
  };

  return {
    version: readRouteManifestVersion(sourceRoot),
    evalVersion: payload.version,
    source,
    generatedAt: isoTimestamp(generatedAt),
    status: routeEvalStatus(counts),
    summary,
    cases: results,
  };
}

export function readRouteManifestVersion(sourceRoot) {
  try {
    const manifest = JSON.parse(readFileSync(path.join(sourceRoot, ".claude-plugin", "plugin.json"), "utf8"));
    return manifest.version || "unknown";
  } catch {
    return "unknown";
  }
}

export function formatRouteJson(payload) {
  return JSON.stringify(payload, null, 2);
}
