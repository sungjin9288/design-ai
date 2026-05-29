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
  formatRouteJson,
  parseRouteArgs,
  readRouteManifestVersion,
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
    "skills/website-improvement/SKILL.md",
    "skills/component-spec-writer/SKILL.md",
    "skills/color-palette/SKILL.md",
    "skills/design-system-builder/SKILL.md",
    "skills/handoff-spec/SKILL.md",
    "agents/a11y-reviewer.md",
    "agents/design-critic.md",
    "agents/component-architect.md",
    "knowledge/PRINCIPLES.md",
    "knowledge/patterns/ux-guidelines.md",
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
  ];

  for (const file of files) {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    writeFileSync(path.join(root, file), file.endsWith(".json") ? '{"version":"x"}' : "");
  }

  return root;
}

test("parseRouteArgs supports brief, limit, and json", () => {
  assert.deepEqual(parseRouteArgs(["audit", "signup", "--limit", "2", "--json"]), {
    briefParts: ["audit", "signup"],
    brief: "audit signup",
    fromFile: "",
    stdin: false,
    list: false,
    explain: false,
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
    limit: 3,
    json: true,
    help: false,
    index: undefined,
  });

  assert.equal(parseRouteArgs(["list", "patterns"]).brief, "list patterns");
  assert.equal(parseRouteArgs(["spec", "Button", "--explain"]).explain, true);
});

test("parseRouteArgs rejects invalid options", () => {
  assert.throws(() => parseRouteArgs(["x", "--limit", "0"]), /--limit/);
  assert.throws(() => parseRouteArgs(["x", "--bad"]), /Unknown route option/);
  assert.throws(() => parseRouteArgs(["x", "--limt", "2"]), /Did you mean `--limit`\?/);
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
