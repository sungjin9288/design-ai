// Tests for cli/lib/route.mjs task routing.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  buildRouteEvalTemplate,
  formatRouteJson,
  parseRouteArgs,
  readRouteManifestVersion,
  routeEvalReport,
  routeCatalog,
  routeById,
  routeBrief,
  suggestRouteId,
} from "./route.mjs";

function makeFixture() {
  const root = mkdtempSync(path.join(tmpdir(), "design-ai-route-"));
  const files = [
    ".claude-plugin/plugin.json",
    "commands/design-review.md",
    "commands/website-improvement.md",
    "commands/component-spec.md",
    "commands/design-from-brief.md",
    "skills/ux-audit/SKILL.md",
    "skills/design-critique/SKILL.md",
    "skills/design-engineering-review/SKILL.md",
    "skills/motion-designer/SKILL.md",
    "skills/website-improvement/SKILL.md",
    "skills/component-spec-writer/SKILL.md",
    "skills/color-palette/SKILL.md",
    "skills/design-system-builder/SKILL.md",
    "skills/website-improvement/PLAYBOOK.md",
    "skills/handoff-spec/SKILL.md",
    "agents/a11y-reviewer.md",
    "agents/design-critic.md",
    "agents/component-architect.md",
    "knowledge/PRINCIPLES.md",
    "knowledge/patterns/ux-guidelines.md",
    "knowledge/patterns/agentic-design-workflows.md",
    "knowledge/patterns/interface-craft.md",
    "knowledge/motion/principles.md",
    "knowledge/motion/micro-interactions.md",
    "knowledge/patterns/design-system-qa.md",
    "knowledge/patterns/technical-writing.md",
    "knowledge/a11y/contrast.md",
    "knowledge/a11y/keyboard-and-focus.md",
    "knowledge/layout/spacing-and-grid.md",
    "knowledge/patterns/report-design.md",
    "docs/MCP-INTEGRATION.md",
    "docs/WEBSITE-IMPROVEMENT.md",
    "knowledge/components/INDEX.md",
    "knowledge/components/shadcn-registry.md",
    "knowledge/patterns/ui-reasoning.md",
    "knowledge/patterns/styles-catalog.md",
    "knowledge/layout/spacing-and-grid.md",
    "knowledge/typography/type-scale-fundamentals.md",
    "docs/AGENT-DEVELOPMENT.md",
    "docs/SDK.md",
  ];

  for (const file of files) {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    writeFileSync(path.join(root, file), file.endsWith(".json") ? '{"version":"x"}' : "");
  }

  return root;
}

// Fixture with textual knowledge content so the lexical recall used by
// --explain related-knowledge produces deterministic hits. One curated
// component-spec knowledge file ("keyboard-and-focus") is loaded with the
// query terms so we can assert it is DEDUPED out of relatedKnowledge.
function makeRecallFixture() {
  const root = makeFixture();
  const contentByFile = {
    // Curated for component-spec (COMMON_KNOWLEDGE + route.knowledge) — must be deduped.
    "knowledge/a11y/keyboard-and-focus.md": "# Keyboard and focus\nbutton component keyboard focus accessibility spec",
    "knowledge/components/INDEX.md": "# Components\ncomponent button spec api",
    // Generated coverage table — NOT curated for component-spec, ranks high on the
    // query terms, but must be excluded from recall as a generated index doc.
    "knowledge/COVERAGE.md": "# Coverage\nbutton component spec accessibility coverage table",
    // NOT curated — eligible related-knowledge hits.
    "knowledge/patterns/component-testing.md": "# Component testing\nbutton component spec accessibility keyboard tests",
    "knowledge/patterns/form-controls.md": "# Form controls\nbutton input component spec accessibility api",
    "knowledge/motion/button-motion.md": "# Button motion\nbutton component spec interaction",
    "knowledge/patterns/copywriting.md": "# Copywriting\ncomponent button spec label microcopy",
  };
  for (const [file, text] of Object.entries(contentByFile)) {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    writeFileSync(path.join(root, file), text);
  }
  return root;
}

const RECALL_BRIEF = "Spec a Button component API with keyboard accessibility";

test("routeBrief attaches advisory relatedKnowledge only with explain=true", () => {
  const root = makeRecallFixture();
  try {
    const withExplain = routeBrief({ brief: RECALL_BRIEF, sourceRoot: root, explain: true });
    const top = withExplain[0];

    assert.equal(top.id, "component-spec");
    assert.ok(Array.isArray(top.relatedKnowledge));
    assert.ok(top.relatedKnowledge.length > 0 && top.relatedKnowledge.length <= 3);

    // Every related item lives under knowledge/ and carries id/score/matchedTokens.
    for (const item of top.relatedKnowledge) {
      assert.ok(item.id.startsWith("knowledge/"));
      assert.equal(typeof item.score, "number");
      assert.ok(Array.isArray(item.matchedTokens));
    }

    // Curated knowledge (incl. COMMON PRINCIPLES.md) is excluded from relatedKnowledge.
    const curated = top.knowledge.map((entry) => entry.path);
    for (const item of top.relatedKnowledge) {
      assert.ok(!curated.includes(item.id), `${item.id} should be deduped against curated set`);
    }
    assert.ok(!top.relatedKnowledge.some((item) => item.id === "knowledge/a11y/keyboard-and-focus.md"));

    // Deterministic: score desc, then id asc.
    const scores = top.relatedKnowledge.map((item) => item.score);
    for (let i = 1; i < scores.length; i += 1) assert.ok(scores[i] <= scores[i - 1]);

    // Default (no explain) has no relatedKnowledge key at all.
    const noExplain = routeBrief({ brief: RECALL_BRIEF, sourceRoot: root });
    assert.equal(Object.hasOwn(noExplain[0], "relatedKnowledge"), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("routeBrief relatedKnowledge excludes generated index/meta docs", () => {
  const root = makeRecallFixture();
  try {
    const routes = routeBrief({ brief: RECALL_BRIEF, sourceRoot: root, explain: true });
    const top = routes[0];
    assert.equal(top.id, "component-spec");
    const ids = top.relatedKnowledge.map((item) => item.id);
    // Generated coverage table is filtered out of the recall/injection surface even
    // though it is not part of the curated set and ranks on the query terms.
    assert.ok(!ids.includes("knowledge/COVERAGE.md"));
    assert.ok(!ids.includes("knowledge/components/INDEX.md"));
    // Real (non-index) knowledge still surfaces.
    assert.ok(ids.some((id) => id.startsWith("knowledge/patterns/")));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("routeBrief relatedKnowledge is empty when recall finds nothing", () => {
  const root = makeRecallFixture();
  try {
    // A brief that still keyword-routes (via "modal", a component-spec keyword) but
    // whose terms are absent from every knowledge file's text, so recall yields no
    // hits and relatedKnowledge is empty.
    const routes = routeBrief({ brief: "modal zzqqxx zzqqyy", sourceRoot: root, explain: true });
    assert.equal(routes[0].id, "component-spec");
    assert.deepEqual(routes[0].relatedKnowledge, []);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("routeBrief explain enrichment leaves routing ids and scores unchanged", () => {
  const root = makeRecallFixture();
  try {
    const plain = routeBrief({ brief: RECALL_BRIEF, sourceRoot: root });
    const explained = routeBrief({ brief: RECALL_BRIEF, sourceRoot: root, explain: true });

    assert.equal(plain.length, explained.length);
    for (let i = 0; i < plain.length; i += 1) {
      assert.equal(plain[i].id, explained[i].id);
      assert.equal(plain[i].score, explained[i].score);
      assert.equal(plain[i].confidence, explained[i].confidence);
      assert.deepEqual(plain[i].matchedKeywords, explained[i].matchedKeywords);
      assert.deepEqual(plain[i].knowledge, explained[i].knowledge);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("parseRouteArgs supports brief, limit, and json", () => {
  assert.deepEqual(parseRouteArgs(["audit", "signup", "--limit", "2", "--json"]), {
    briefParts: ["audit", "signup"],
    brief: "audit signup",
    fromFile: "",
    stdin: false,
    list: false,
    explain: false,
    evalTemplate: false,
    eval: false,
    strict: false,
    limit: 2,
    json: true,
    help: false,
    index: undefined,
  });
});

test("parseRouteArgs supports file and stdin brief sources", () => {
  assert.deepEqual(parseRouteArgs(["--from-file", "brief.md", "--limit", "2"]), {
    briefParts: [],
    brief: "",
    fromFile: "brief.md",
    stdin: false,
    list: false,
    explain: false,
    evalTemplate: false,
    eval: false,
    strict: false,
    limit: 2,
    json: false,
    help: false,
    index: undefined,
  });

  assert.deepEqual(parseRouteArgs(["--stdin", "--json"]), {
    briefParts: [],
    brief: "",
    fromFile: "",
    stdin: true,
    list: false,
    explain: false,
    evalTemplate: false,
    eval: false,
    strict: false,
    limit: 3,
    json: true,
    help: false,
    index: undefined,
  });
});

test("parseRouteArgs supports route catalog listing", () => {
  assert.deepEqual(parseRouteArgs(["--list", "--json"]), {
    briefParts: [],
    brief: "",
    fromFile: "",
    stdin: false,
    list: true,
    explain: false,
    evalTemplate: false,
    eval: false,
    strict: false,
    limit: 3,
    json: true,
    help: false,
    index: undefined,
  });

  assert.equal(parseRouteArgs(["list", "patterns"]).brief, "list patterns");
  assert.equal(parseRouteArgs(["spec", "Button", "--explain"]).explain, true);
});

test("parseRouteArgs supports route eval template and eval checkpoints", () => {
  assert.deepEqual(parseRouteArgs(["--eval-template", "--json"]), {
    briefParts: [],
    brief: "",
    fromFile: "",
    stdin: false,
    list: false,
    explain: false,
    evalTemplate: true,
    eval: false,
    strict: false,
    limit: 3,
    json: true,
    help: false,
    index: undefined,
  });

  assert.deepEqual(parseRouteArgs(["--eval", "--from-file", "route-eval.json", "--strict", "--json"]), {
    briefParts: [],
    brief: "",
    fromFile: "route-eval.json",
    stdin: false,
    list: false,
    explain: false,
    evalTemplate: false,
    eval: true,
    strict: true,
    limit: 3,
    json: true,
    help: false,
    index: undefined,
  });

  assert.equal(parseRouteArgs(["--eval", "--stdin", "--limit", "5"]).limit, 5);
});

test("parseRouteArgs rejects invalid options", () => {
  assert.throws(() => parseRouteArgs(["x", "--limit", "0"]), /--limit/);
  assert.throws(() => parseRouteArgs(["x", "--bad"]), /Unknown route option/);
  assert.throws(() => parseRouteArgs(["x", "--limt", "2"]), /Did you mean `--limit`\?/);
  assert.throws(() => parseRouteArgs(["--eval", "--eval-template"]), /Choose either --eval-template or --eval/);
  assert.throws(() => parseRouteArgs(["--strict"]), /--strict can only be used with --eval/);
  assert.throws(() => parseRouteArgs(["--eval"]), /--eval requires --from-file or --stdin/);
  assert.throws(() => parseRouteArgs(["--eval-template", "audit"]), /--eval-template cannot be combined/);
  assert.throws(() => parseRouteArgs(["--eval", "--from-file", "route-eval.json", "audit"]), /--eval cannot be combined/);
});

test("routeCatalog returns discoverable route ids", () => {
  const root = makeFixture();
  try {
    const routes = routeCatalog({ sourceRoot: root });

    assert.equal(routes.some((route) => route.id === "component-spec"), true);
    assert.equal(routes.some((route) => route.id === "design-review"), true);
    assert.equal(routes[0].confidence, "catalog");
    assert.equal(Array.isArray(routes[0].keywords), true);
    assert.equal(routes[0].explanation.summary, "Catalog listing; no task brief was scored.");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("dashboard route keeps chart knowledge available for forced and catalog results", () => {
  const sourceRoot = process.cwd();
  const expectedKnowledge = [
    "knowledge/patterns/chart-types.md",
    "knowledge/patterns/chart-color-encoding.md",
    "knowledge/patterns/realtime-data.md",
  ];
  const forced = routeById({ routeId: "dashboard-design", sourceRoot });
  const catalog = routeCatalog({ sourceRoot }).find((route) => route.id === "dashboard-design");

  assert.equal(forced.confidence, "forced");
  assert.equal(forced.forced, true);
  assert.equal(catalog?.confidence, "catalog");
  for (const knowledgePath of expectedKnowledge) {
    assert.equal(forced.knowledge.some((entry) => entry.path === knowledgePath && entry.exists), true);
    assert.equal(catalog?.knowledge.some((entry) => entry.path === knowledgePath && entry.exists), true);
  }
});

test("routeBrief recommends dashboard design for real-time chart briefs", () => {
  const [route] = routeBrief({
    brief: "Design a real-time time series chart with a legend and data visualization controls",
    sourceRoot: process.cwd(),
  });

  assert.equal(route.id, "dashboard-design");
  assert.ok(route.matchedKeywords.includes("chart"));
  assert.ok(route.matchedKeywords.includes("time series"));
});

test("routeBrief recommends design review for audit briefs", () => {
  const root = makeFixture();
  try {
    const routes = routeBrief({
      brief: "Audit a Figma signup screen for accessibility and UX",
      sourceRoot: root,
    });

    assert.equal(routes[0].id, "design-review");
    assert.ok(routes[0].matchedKeywords.includes("audit"));
    assert.equal(routes[0].command.exists, true);
    assert.ok(routes[0].explanation.summary.includes("Matched"));
    assert.equal(routes[0].explanation.scoreBreakdown[0].value, routes[0].score);
    assert.equal(routes[0].explanation.referenceCoverage.total.total > 0, true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("routeBrief recommends website improvement for site optimization briefs", () => {
  const root = makeFixture();
  try {
    const routes = routeBrief({
      brief: "Improve our website homepage SEO performance and MCP refactor plan",
      sourceRoot: root,
    });

    assert.equal(routes[0].id, "website-improvement");
    assert.ok(routes[0].matchedKeywords.includes("website"));
    assert.equal(routes[0].command.exists, true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("routeBrief recommends design engineering review for web and app quality briefs", () => {
  const root = makeFixture();
  try {
    const routes = routeBrief({
      brief: "웹/앱 디자인 퀄리티와 인터랙션 반응성을 리뷰해줘",
      sourceRoot: root,
    });

    assert.equal(routes[0].id, "design-engineering-review");
    assert.deepEqual(routes[0].matchedKeywords, ["디자인 퀄리티", "인터랙션 반응성"]);
    assert.equal(routes[0].score, 2);
    assert.equal(routes[0].skills[0].exists, true);
    assert.equal(routes[0].knowledge.some((entry) => entry.path === "knowledge/patterns/interface-craft.md" && entry.exists), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("routeBrief sends homepage implementation and refactor work to website improvement", () => {
  const root = makeFixture();
  try {
    for (const brief of [
      "Implement homepage for a new SaaS product in the existing repo",
      "Refactor homepage layout and CTA hierarchy in our current website",
      "신규 홈페이지 개발과 반응형 구현을 진행해줘",
      "기존 홈페이지 리팩토링과 접근성 개선을 진행해줘",
    ]) {
      const [route] = routeBrief({ brief, sourceRoot: root });
      assert.equal(route.id, "website-improvement", brief);
      assert.ok(["medium", "high"].includes(route.confidence), brief);
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("routeBrief recommends agentic design development for internal skill and feature development briefs", () => {
  const root = makeFixture();
  try {
    const routes = routeBrief({
      brief: "내부 스킬 및 우리 기능 디밸롭에 OpenTag React Bits 레퍼런스 분석을 사용하자",
      sourceRoot: root,
    });

    assert.equal(routes[0].id, "agentic-design-development");
    assert.ok(routes[0].matchedKeywords.includes("내부 스킬"));
    assert.ok(routes[0].matchedKeywords.includes("우리 기능"));
    assert.ok(["medium", "high"].includes(routes[0].confidence));
    assert.equal(routes[0].skills[0].exists, true);
    assert.equal(routes[0].knowledge.some((entry) => entry.path === "knowledge/patterns/agentic-design-workflows.md" && entry.exists), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("routeById returns a forced route and rejects unknown ids", () => {
  const root = makeFixture();
  try {
    const route = routeById({
      routeId: "component-spec",
      sourceRoot: root,
    });

    assert.equal(route.id, "component-spec");
    assert.equal(route.confidence, "forced");
    assert.equal(route.forced, true);
    assert.equal(route.command.exists, true);
    assert.equal(route.explanation.summary, "Route selected explicitly with --route.");

    assert.throws(
      () => routeById({ routeId: "missing-route", sourceRoot: root }),
      /Unknown route id/,
    );
    assert.throws(
      () => routeById({ routeId: "component-spce", sourceRoot: root }),
      /Did you mean `component-spec`\?/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("suggestRouteId suggests close route id typos", () => {
  assert.equal(suggestRouteId("component-spce"), "component-spec");
  assert.equal(suggestRouteId("desgin-review"), "design-review");
  assert.equal(suggestRouteId("palette-from-brnad"), "palette-from-brand");
  assert.equal(suggestRouteId("missing-route"), "");
});

test("routeBrief recommends component spec for component briefs", () => {
  const root = makeFixture();
  try {
    const routes = routeBrief({
      brief: "Spec a Button component API with keyboard accessibility",
      sourceRoot: root,
    });

    assert.equal(routes[0].id, "component-spec");
    assert.equal(routes[0].skills[0].exists, true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("formatRouteJson preserves route recommendation order and readable Korean keywords", () => {
  const root = makeFixture();
  try {
    const brief = "Spec a Button component API with keyboard accessibility";
    const payload = {
      brief,
      version: readRouteManifestVersion(root),
      routes: routeBrief({
        brief,
        sourceRoot: root,
        limit: 1,
      }),
    };
    const formatted = formatRouteJson(payload);
    const parsed = JSON.parse(formatted);

    assert.deepEqual(Object.keys(parsed), ["brief", "version", "routes"]);
    assert.equal(parsed.brief, brief);
    assert.deepEqual(Object.keys(parsed.routes[0]).slice(0, 8), [
      "id",
      "label",
      "score",
      "confidence",
      "matchedKeywords",
      "command",
      "skills",
      "agents",
    ]);
    assert.match(formatted, /"routes": \[\n    \{/);
    assert.match(formatted, /컴포넌트/);
    assert.doesNotMatch(formatted, /\\u[0-9a-fA-F]{4}/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("routeBrief does not match short spatial keyword inside another word", () => {
  const root = makeFixture();
  try {
    const routes = routeBrief({
      brief: "Spec a Button component API with keyboard accessibility",
      sourceRoot: root,
    });

    assert.equal(routes.some((route) => route.id === "spatial"), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("formatRouteJson preserves catalog payload order", () => {
  const root = makeFixture();
  try {
    const payload = {
      version: readRouteManifestVersion(root),
      routes: routeCatalog({ sourceRoot: root }),
    };
    const parsed = JSON.parse(formatRouteJson(payload));

    assert.deepEqual(Object.keys(parsed), ["version", "routes"]);
    assert.equal(parsed.routes[0].id, "design-review");
    assert.equal(parsed.routes[0].confidence, "catalog");
    assert.equal(parsed.routes[0].explanation.summary, "Catalog listing; no task brief was scored.");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("routeBrief falls back to design-from-brief for unmatched briefs", () => {
  const root = makeFixture();
  try {
    const routes = routeBrief({
      brief: "make something polished",
      sourceRoot: root,
    });

    assert.equal(routes[0].id, "design-from-brief");
    assert.equal(routes[0].fallback, true);
    assert.equal(routes[0].explanation.summary, "No route keywords matched; using the default design-from-brief workflow.");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("buildRouteEvalTemplate creates runnable route-selection checkpoints", () => {
  const root = makeFixture();
  try {
    const template = buildRouteEvalTemplate({ sourceRoot: root, generatedAt: new Date("2026-06-02T00:00:00.000Z") });

    assert.equal(template.version, 1);
    assert.equal(template.sourceRouteVersion, "x");
    assert.equal(template.generatedAt, "2026-06-02T00:00:00.000Z");
    assert.equal(template.cases.length >= 5, true);
    assert.equal(template.cases.some((testCase) => testCase.expectedRouteId === "website-improvement"), true);

    const report = routeEvalReport({
      evalText: JSON.stringify(template),
      source: "template",
      sourceRoot: root,
      generatedAt: new Date("2026-06-02T00:00:00.000Z"),
    });

    assert.equal(report.status, "pass");
    assert.equal(report.summary.fail, 0);
    assert.equal(report.cases.every((testCase) => testCase.topRouteId === testCase.expectedRouteId), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("routeEvalReport reports mismatched and invalid route checkpoints", () => {
  const root = makeFixture();
  try {
    const report = routeEvalReport({
      evalText: JSON.stringify({
        version: 1,
        cases: [
          {
            id: "bad-route",
            brief: "Spec a Button component API with keyboard accessibility",
            expectedRouteId: "website-improvement",
          },
          {
            id: "unknown-route",
            brief: "Audit a Figma signup flow",
            expectedRouteId: "missing-route",
          },
        ],
      }),
      source: "bad-route-eval.json",
      sourceRoot: root,
    });

    assert.equal(report.status, "fail");
    assert.equal(report.summary.fail, 2);
    assert.equal(report.cases[0].topRouteId, "component-spec");
    assert.match(report.cases[0].message, /Expected website-improvement/);
    assert.match(report.cases[1].message, /unknown/);

    assert.throws(
      () => routeEvalReport({
        evalText: JSON.stringify({ version: 999, cases: [] }),
        sourceRoot: root,
      }),
      /version must be 1/,
    );
    assert.throws(
      () => routeEvalReport({
        evalText: JSON.stringify({ version: 1, cases: [{ id: "empty" }] }),
        sourceRoot: root,
      }),
      /missing brief/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
