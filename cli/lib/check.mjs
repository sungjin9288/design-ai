// Generated artifact quality checks for `design-ai check`.

import {
  readFileSync,
} from "node:fs";
import path from "node:path";

import { listExamples } from "./examples.mjs";
import { assertKnownRouteId, ROUTES } from "./route.mjs";
import { unknownOptionMessage } from "./suggest.mjs";

const DEFAULT_EXAMPLE_LIMIT = 3;
const CHECK_OPTIONS = [
  "-h",
  "--help",
  "--stdin",
  "--examples",
  "--all-routes",
  "--issues-only",
  "--strict",
  "--route",
  "--limit",
  "--json",
];

export function parseCheckArgs(args) {
  const out = {
    target: "",
    stdin: false,
    examples: false,
    allRoutes: false,
    issuesOnly: false,
    limit: DEFAULT_EXAMPLE_LIMIT,
    strict: false,
    routeId: "",
    json: false,
    help: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "-h" || arg === "--help") {
      out.help = true;
    } else if (arg === "--stdin") {
      out.stdin = true;
    } else if (arg === "--examples") {
      out.examples = true;
    } else if (arg === "--all-routes") {
      out.allRoutes = true;
    } else if (arg === "--issues-only") {
      out.issuesOnly = true;
    } else if (arg === "--strict") {
      out.strict = true;
    } else if (arg === "--route") {
      const routeId = args[i + 1];
      if (!routeId || routeId.startsWith("--")) throw new Error("--route expects a route id");
      out.routeId = routeId;
      i += 1;
    } else if (arg === "--limit") {
      const limit = Number(args[i + 1]);
      if (!Number.isInteger(limit) || limit < 1 || limit > 25) {
        throw new Error("--limit expects an integer from 1 to 25");
      }
      out.limit = limit;
      i += 1;
    } else if (arg === "--json") {
      out.json = true;
    } else if (arg.startsWith("--")) {
      throw new Error(unknownOptionMessage("check", arg, CHECK_OPTIONS));
    } else if (!out.target) {
      out.target = arg;
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }

  if (out.stdin && out.target) {
    throw new Error("Use either a file path or --stdin, not both");
  }
  if (out.examples && (out.target || out.stdin)) {
    throw new Error("Use --examples by itself, not with a file path or --stdin");
  }
  if (out.allRoutes && !out.examples) {
    throw new Error("--all-routes is only supported with --examples");
  }
  if (out.examples && !out.routeId && !out.allRoutes) {
    throw new Error("--examples requires --route id or --all-routes");
  }
  if (out.routeId && out.allRoutes) {
    throw new Error("Use either --route id or --all-routes, not both");
  }
  if (!out.examples && out.limit !== DEFAULT_EXAMPLE_LIMIT) {
    throw new Error("--limit is only supported with --examples");
  }

  return out;
}

function has(pattern, content) {
  return pattern.test(content);
}

function hasAny(patterns, content) {
  return patterns.some((pattern) => has(pattern, content));
}

function result({ id, title, passed, severity, passMessage, failMessage, evidence = "" }) {
  return {
    id,
    title,
    level: passed ? "pass" : severity,
    passed,
    message: passed ? passMessage : failMessage,
    ...(evidence ? { evidence } : {}),
  };
}

const ROUTE_REQUIREMENTS = {
  "design-review": [
    {
      id: "review-findings",
      title: "Design review finding structure",
      required: [
        { label: "issue or finding", patterns: [/\b(issue|finding|problem|risk)\b/i, /문제|리스크|이슈/] },
        { label: "severity or priority", patterns: [/\b(severity|priority|impact|p[0-3])\b/i, /심각도|우선순위|영향/] },
        { label: "recommended fix", patterns: [/\b(fix|recommend|change|adjust|replace)\b/i, /수정|개선|권장|제안/] },
      ],
    },
  ],
  "design-from-brief": [
    {
      id: "design-system-foundation",
      title: "Design-system foundation coverage",
      required: [
        { label: "design tokens", patterns: [/\btoken/i, /토큰/] },
        { label: "component baseline", patterns: [/\bcomponent/i, /컴포넌트/] },
        { label: "handoff or implementation", patterns: [/\b(handoff|implementation|developer|engineering)\b/i, /핸드오프|구현|개발/] },
      ],
    },
  ],
  "component-spec": [
    {
      id: "component-contract",
      title: "Component contract coverage",
      required: [
        { label: "anatomy or slots", patterns: [/\b(anatomy|structure|slot)\b/i, /구조|슬롯/] },
        { label: "variants or states", patterns: [/\b(variant|state|disabled|hover|active)\b/i, /변형|상태|비활성/] },
        { label: "API or props", patterns: [/\b(api|props?|property|attribute)\b/i, /속성|프로퍼티/] },
      ],
    },
  ],
  "palette-from-brand": [
    {
      id: "palette-token-contract",
      title: "Palette token contract",
      required: [
        { label: "semantic tokens", patterns: [/\bsemantic\b.*\btoken|\b--color-[a-z0-9-]+/i, /시맨틱.*토큰|의미.*토큰/] },
        { label: "primitive palette", patterns: [/\bprimitive\b|\bscale\b|\bpalette\b/i, /프리미티브|팔레트/] },
        { label: "contrast ratios", patterns: [/\b\d+(?:\.\d+)?:1\b/] },
      ],
    },
  ],
  "motion-design": [
    {
      id: "motion-spec",
      title: "Motion specification coverage",
      required: [
        { label: "duration", patterns: [/\b\d+\s*ms\b|\bduration\b/i, /지속시간|듀레이션/] },
        { label: "easing", patterns: [/\beas(?:e|ing)|cubic-bezier|spring\b/i, /이징/] },
        { label: "reduced motion", patterns: [/\b(prefers-reduced-motion|reduced motion)\b/i, /모션 감소|움직임 감소/] },
      ],
    },
  ],
  illustration: [
    {
      id: "illustration-system",
      title: "Illustration system coverage",
      required: [
        { label: "style system", patterns: [/\b(style|visual language|system)\b/i, /스타일|시각 언어|시스템/] },
        { label: "usage context", patterns: [/\b(usage|use case|placement|context)\b/i, /사용처|맥락|배치/] },
        { label: "accessibility or alt text", patterns: [/\b(alt text|accessibility|decorative)\b/i, /대체 텍스트|접근성|장식/] },
      ],
    },
  ],
  print: [
    {
      id: "print-production",
      title: "Print production constraints",
      required: [
        { label: "CMYK", patterns: [/\bcmyk\b/i] },
        { label: "bleed", patterns: [/\bbleed\b/i, /도련/] },
        { label: "DPI or resolution", patterns: [/\b(dpi|resolution|300dpi)\b/i, /해상도/] },
      ],
    },
  ],
  video: [
    {
      id: "video-production",
      title: "Video production constraints",
      required: [
        { label: "resolution or aspect ratio", patterns: [/\b(resolution|aspect ratio|9:16|16:9|1:1)\b/i, /해상도|비율/] },
        { label: "framerate", patterns: [/\b(frame ?rate|fps)\b/i, /프레임/] },
        { label: "captions or subtitles", patterns: [/\b(caption|subtitle|srt)\b/i, /자막/] },
      ],
    },
  ],
  "game-ui": [
    {
      id: "game-ui-surface",
      title: "Game UI surface coverage",
      required: [
        { label: "HUD or menu surface", patterns: [/\b(hud|menu|inventory|store)\b/i, /HUD|메뉴|인벤토리|상점/] },
        { label: "platform or viewport", patterns: [/\b(platform|desktop|mobile|console|viewport)\b/i, /플랫폼|모바일|데스크톱/] },
        { label: "game accessibility", patterns: [/\b(accessibility|color-blind|remap|subtitle)\b/i, /접근성|색각|리맵|자막/] },
      ],
    },
  ],
  conversational: [
    {
      id: "conversation-flow",
      title: "Conversation flow coverage",
      required: [
        { label: "intents", patterns: [/\b(intent|utterance)\b/i, /의도|발화/] },
        { label: "fallback or error recovery", patterns: [/\b(fallback|error|repair|clarif)\w*\b/i, /폴백|오류|재질문/] },
        { label: "turn-taking", patterns: [/\b(turn-taking|conversation flow|dialogue)\b/i, /턴|대화 흐름/] },
      ],
    },
  ],
  spatial: [
    {
      id: "spatial-comfort",
      title: "Spatial comfort and interaction coverage",
      required: [
        { label: "comfort", patterns: [/\b(comfort|motion sickness|vestibular)\b/i, /편안함|멀미/] },
        { label: "depth, distance, or FOV", patterns: [/\b(depth|distance|fov|field of view)\b/i, /깊이|거리|시야각/] },
        { label: "input or locomotion", patterns: [/\b(input|gesture|controller|locomotion)\b/i, /입력|제스처|컨트롤러|이동/] },
      ],
    },
  ],
  "document-from-brief": [
    {
      id: "document-structure",
      title: "Document structure coverage",
      required: [
        { label: "Diataxis type", patterns: [/\b(diataxis|tutorial|how-to|reference|explanation)\b/i, /튜토리얼|하우투|레퍼런스|설명/] },
        { label: "audience", patterns: [/\b(audience|reader|user)\b/i, /독자|대상/] },
        { label: "structure", patterns: [/\b(structure|section|outline)\b/i, /구조|섹션|개요/] },
      ],
    },
  ],
  "slide-deck": [
    {
      id: "deck-story",
      title: "Deck story coverage",
      required: [
        { label: "slides", patterns: [/\bslide\b/i, /슬라이드/] },
        { label: "message-led title", patterns: [/\b(message|takeaway|headline|title)\b/i, /메시지|핵심|제목/] },
        { label: "audience or purpose", patterns: [/\b(audience|purpose|objective)\b/i, /청중|목적/] },
      ],
    },
  ],
  "handoff-spec": [
    {
      id: "handoff-implementation",
      title: "Handoff implementation coverage",
      required: [
        { label: "implementation details", patterns: [/\b(implementation|engineering|developer)\b/i, /구현|개발/] },
        { label: "tokens", patterns: [/\btoken/i, /토큰/] },
        { label: "states or specs", patterns: [/\b(state|spec|variant)\b/i, /상태|스펙|변형/] },
      ],
    },
  ],
  "design-system-qa": [
    {
      id: "qa-layers",
      title: "Design-system QA layers",
      required: [
        { label: "token or type checks", patterns: [/\b(token|type)\b/i, /토큰|타입/] },
        { label: "accessibility checks", patterns: [/\b(a11y|accessibility|aria)\b/i, /접근성/] },
        { label: "visual or regression checks", patterns: [/\b(visual|regression|snapshot|storybook)\b/i, /시각|회귀|스토리북/] },
      ],
    },
  ],
  "figma-token-sync": [
    {
      id: "figma-token-sync",
      title: "Figma token sync coverage",
      required: [
        { label: "Figma variables", patterns: [/\b(figma|variable)\b/i, /피그마|변수/] },
        { label: "token mapping", patterns: [/\b(token|mapping|alias)\b/i, /토큰|매핑|별칭/] },
        { label: "sync workflow", patterns: [/\b(sync|export|import|source of truth)\b/i, /동기화|내보내기|가져오기|원천/] },
      ],
    },
  ],
  "design-pr-review": [
    {
      id: "pr-review-evidence",
      title: "Design PR review evidence",
      required: [
        { label: "diff or changed files", patterns: [/\b(diff|changed files?|files?)\b/i, /변경 파일|diff/] },
        { label: "impact", patterns: [/\b(impact|risk|regression)\b/i, /영향|리스크|회귀/] },
        { label: "validation", patterns: [/\b(test|validation|verified|check)\b/i, /테스트|검증/] },
      ],
    },
  ],
  "stability-review": [
    {
      id: "stability-release",
      title: "Stability review coverage",
      required: [
        { label: "release or checklist", patterns: [/\b(release|checklist|launch)\b/i, /릴리스|체크리스트|출시/] },
        { label: "audit or tests", patterns: [/\b(audit|test|validation)\b/i, /감사|테스트|검증/] },
        { label: "staleness or version", patterns: [/\b(stale|version|drift|outdated)\b/i, /오래된|버전|드리프트/] },
      ],
    },
  ],
};

function routeRequirementResult(routeId, requirement, text) {
  const missing = requirement.required
    .filter((item) => !hasAny(item.patterns, text))
    .map((item) => item.label);
  const passed = missing.length === 0;

  return result({
    id: `route-${routeId}-${requirement.id}`,
    title: `Route: ${requirement.title}`,
    passed,
    severity: "warn",
    passMessage: "Route-specific requirement is covered.",
    failMessage: "Route-specific requirement is missing expected evidence.",
    evidence: passed ? "" : `Missing: ${missing.join(", ")}`,
  });
}

function routeRequirements(routeId) {
  if (!routeId) return [];
  assertKnownRouteId(routeId);

  return ROUTE_REQUIREMENTS[routeId] || [];
}

function summarize(results) {
  const failures = results.filter((item) => item.level === "fail").length;
  const warnings = results.filter((item) => item.level === "warn").length;
  const passes = results.filter((item) => item.level === "pass").length;
  const status = failures > 0 ? "fail" : warnings > 0 ? "warn" : "pass";

  return {
    status,
    passes,
    warnings,
    failures,
    total: results.length,
    score: `${passes}/${results.length}`,
  };
}

export function checkArtifactContent({ content, filePath = "stdin", routeId = "" }) {
  const text = String(content || "");
  const trimmed = text.trim();
  const hasColorEvidence = has(/#[0-9a-f]{3,8}\b|--color-|oklch\(|rgba?\(|hsla?\(/i, text);
  const hasContrastRatio = has(/\b\d+(?:\.\d+)?:1\b/, text);
  const hasGrounding = has(/\b(?:knowledge|refs)\/[A-Za-z0-9._/-]+\.md\b|PRINCIPLES\.md\b/, text);
  const hasKeyboardFocus = has(/\b(keyboard|focus|tab order|tab key|escape|arrow key|focus-visible)\b/i, text);
  const hasResponsive = has(/\b(responsive|mobile|desktop|tablet|breakpoint|viewport)\b/i, text);
  const hasScreenReader = has(/\b(screen reader|assistive technolog|aria-|aria\b|sr-only|role=)\b/i, text);
  const hasDontSection = has(/\b(don't|do not|avoid|anti-pattern|misuse)\b/i, text);
  const hasHangul = has(/[\u3131-\uD79D]/, text);
  const hasKoreanConsideration = has(/\b(korean|hangul|korea|kr)\b|[\u3131-\uD79D].*(한국|한글|해요체|합쇼체|본인인증|카카오|토스|네이버|명함)/i, text);
  const hasUnresolvedMarker = has(/\b(TODO|TBD|FIXME)\b|\{\{[^}]+\}\}|<\s*(?:TODO|TBD|FIXME)[^>]*>/i, text);

  const contrastPassed = hasColorEvidence ? hasContrastRatio : hasContrastRatio || has(/\bcontrast\b/i, text);

  const baseResults = [
    result({
      id: "content-depth",
      title: "Meaningful artifact depth",
      passed: trimmed.length >= 200,
      severity: "fail",
      passMessage: "Artifact has enough content to audit.",
      failMessage: "Artifact is too short to verify meaningfully.",
      evidence: `${trimmed.length} characters`,
    }),
    result({
      id: "unresolved-markers",
      title: "No unresolved placeholders",
      passed: !hasUnresolvedMarker,
      severity: "fail",
      passMessage: "No TODO/TBD/FIXME or template placeholders detected.",
      failMessage: "Unresolved TODO/TBD/FIXME or template placeholder detected.",
    }),
    result({
      id: "source-grounding",
      title: "Knowledge/source grounding",
      passed: hasGrounding,
      severity: "warn",
      passMessage: "Artifact cites checked knowledge or reference files.",
      failMessage: "No knowledge/ or refs/ citation detected.",
    }),
    result({
      id: "contrast",
      title: "Explicit contrast handling",
      passed: contrastPassed,
      severity: hasColorEvidence ? "fail" : "warn",
      passMessage: "Contrast handling is explicit.",
      failMessage: hasColorEvidence
        ? "Color values or color tokens are present without an explicit contrast ratio."
        : "No explicit contrast note or ratio detected.",
    }),
    result({
      id: "keyboard-focus",
      title: "Keyboard and focus behavior",
      passed: hasKeyboardFocus,
      severity: "warn",
      passMessage: "Keyboard/focus behavior is mentioned.",
      failMessage: "No keyboard or focus behavior note detected.",
    }),
    result({
      id: "responsive",
      title: "Responsive behavior",
      passed: hasResponsive,
      severity: "warn",
      passMessage: "Responsive behavior is mentioned.",
      failMessage: "No mobile/desktop/responsive behavior note detected.",
    }),
    result({
      id: "screen-reader",
      title: "Screen-reader semantics",
      passed: hasScreenReader,
      severity: "warn",
      passMessage: "Screen-reader or ARIA behavior is mentioned.",
      failMessage: "No screen-reader or ARIA behavior note detected.",
    }),
    result({
      id: "dont-section",
      title: "Misuse guidance",
      passed: hasDontSection,
      severity: "warn",
      passMessage: "Artifact includes misuse or avoidance guidance.",
      failMessage: "No Don't/avoid/anti-pattern guidance detected.",
    }),
    result({
      id: "korean-context",
      title: "Korean context when relevant",
      passed: !hasHangul || hasKoreanConsideration,
      severity: "warn",
      passMessage: hasHangul ? "Korean-specific context is mentioned." : "No Korean text detected; rule is not applicable.",
      failMessage: "Korean text is present without Korean-specific UX, copy, or market consideration.",
    }),
  ];
  const routeResults = routeRequirements(routeId).map((requirement) => routeRequirementResult(routeId, requirement, text));
  const results = [...baseResults, ...routeResults];

  return {
    filePath,
    ...(routeId ? { routeId } : {}),
    ...summarize(results),
    results,
  };
}

function summarizeExampleReports(reports) {
  const failed = reports.filter((item) => item.report.status === "fail").length;
  const warned = reports.filter((item) => item.report.status === "warn").length;
  const passed = reports.filter((item) => item.report.status === "pass").length;
  const status = reports.length === 0 ? "fail" : failed > 0 ? "fail" : warned > 0 ? "warn" : "pass";

  return {
    status,
    total: reports.length,
    passed,
    warned,
    failed,
  };
}

export function checkExampleArtifacts({ designAiPath, routeId, limit = DEFAULT_EXAMPLE_LIMIT }) {
  if (!routeId) {
    throw new Error("--examples requires --route id");
  }

  const discovered = listExamples({
    designAiPath,
    routeId,
    limit,
  });
  const reports = discovered.examples.map((example) => {
    const absolutePath = path.join(designAiPath, example.relPath);
    const content = readFileSync(absolutePath, "utf8");
    return {
      example,
      report: checkArtifactContent({
        content,
        filePath: absolutePath,
        routeId,
      }),
    };
  });
  const summary = summarizeExampleReports(reports);

  return {
    mode: "examples",
    routeId,
    query: discovered.effectiveQuery,
    limit,
    status: summary.status,
    ...summary,
    examples: reports,
    ...(reports.length === 0 ? { message: "No examples matched the selected route." } : {}),
  };
}

function summarizeRouteReports(routes) {
  const failedRoutes = routes.filter((item) => item.status === "fail").length;
  const warnedRoutes = routes.filter((item) => item.status === "warn").length;
  const passedRoutes = routes.filter((item) => item.status === "pass").length;
  const status = failedRoutes > 0 ? "fail" : warnedRoutes > 0 ? "warn" : "pass";
  const totalExamples = routes.reduce((sum, route) => sum + route.total, 0);
  const failedExamples = routes.reduce((sum, route) => sum + route.failed, 0);
  const warnedExamples = routes.reduce((sum, route) => sum + route.warned, 0);
  const passedExamples = routes.reduce((sum, route) => sum + route.passed, 0);

  return {
    status,
    totalRoutes: routes.length,
    passedRoutes,
    warnedRoutes,
    failedRoutes,
    totalExamples,
    passedExamples,
    warnedExamples,
    failedExamples,
  };
}

export function checkAllExampleArtifacts({ designAiPath, limit = DEFAULT_EXAMPLE_LIMIT }) {
  const routes = ROUTES.map((route) => checkExampleArtifacts({
    designAiPath,
    routeId: route.id,
    limit,
  }));
  const summary = summarizeRouteReports(routes);

  return {
    mode: "examples-all-routes",
    limit,
    ...summary,
    routes,
  };
}
