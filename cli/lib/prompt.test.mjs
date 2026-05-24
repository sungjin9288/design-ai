// Tests for cli/lib/prompt.mjs prompt generation.

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
  buildPromptPlan,
  formatPromptJson,
  parsePromptArgs,
} from "./prompt.mjs";

function makeFixture() {
  const root = mkdtempSync(path.join(tmpdir(), "design-ai-prompt-"));
  const files = [
    ".claude-plugin/plugin.json",
    "commands/design-review.md",
    "commands/component-spec.md",
    "skills/ux-audit/SKILL.md",
    "skills/design-critique/SKILL.md",
    "skills/component-spec-writer/SKILL.md",
    "skills/component-spec-writer/PLAYBOOK.md",
    "skills/ux-audit/PLAYBOOK.md",
    "skills/design-critique/PLAYBOOK.md",
    "agents/component-architect.md",
    "agents/a11y-reviewer.md",
    "agents/design-critic.md",
    "knowledge/PRINCIPLES.md",
    "knowledge/patterns/ux-guidelines.md",
    "knowledge/a11y/contrast.md",
    "knowledge/components/INDEX.md",
    "knowledge/components/shadcn-registry.md",
    "knowledge/a11y/keyboard-and-focus.md",
    "examples/component-button.md",
    "examples/component-modal.md",
    "examples/cases/dogfood-review.md",
  ];

  for (const file of files) {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    writeFileSync(path.join(root, file), file.endsWith(".json") ? '{"version":"test"}' : "");
  }

  return root;
}

test("parsePromptArgs supports brief and json", () => {
  assert.deepEqual(parsePromptArgs(["spec", "Button", "--json", "--out", "prompt.json", "--force"]), {
    briefParts: ["spec", "Button"],
    brief: "spec Button",
    fromFile: "",
    stdin: false,
    routeId: "",
    json: true,
    outPath: "prompt.json",
    force: true,
    withLearning: false,
    learningCategory: "",
    learningLimit: 0,
    help: false,
    index: undefined,
  });
});

test("parsePromptArgs supports file, stdin, and forced route sources", () => {
  assert.deepEqual(parsePromptArgs(["--from-file", "brief.md", "--route", "design-review", "--out", "prompt.md"]), {
    briefParts: [],
    brief: "",
    fromFile: "brief.md",
    stdin: false,
    routeId: "design-review",
    json: false,
    outPath: "prompt.md",
    force: false,
    withLearning: false,
    learningCategory: "",
    learningLimit: 0,
    help: false,
    index: undefined,
  });

  assert.deepEqual(parsePromptArgs(["--stdin", "--json"]), {
    briefParts: [],
    brief: "",
    fromFile: "",
    stdin: true,
    routeId: "",
    json: true,
    outPath: "",
    force: false,
    withLearning: false,
    learningCategory: "",
    learningLimit: 0,
    help: false,
    index: undefined,
  });
});

test("parsePromptArgs supports explicit learning context", () => {
  const parsed = parsePromptArgs([
    "spec",
    "Button",
    "--with-learning",
    "--learning-category",
    "korean",
    "--learning-limit",
    "5",
    "--json",
  ]);

  assert.equal(parsed.withLearning, true);
  assert.equal(parsed.learningCategory, "korean");
  assert.equal(parsed.learningLimit, 5);
  assert.equal(parsed.brief, "spec Button");
  assert.equal(parsed.json, true);
});

test("parsePromptArgs rejects unknown options", () => {
  assert.throws(() => parsePromptArgs(["spec", "--bad"]), /Unknown prompt option/);
  assert.throws(() => parsePromptArgs(["spec", "--rout", "component-spec"]), /Did you mean `--route`\?/);
  assert.throws(() => parsePromptArgs(["spec", "--route"]), /--route expects a route id/);
  assert.throws(() => parsePromptArgs(["spec", "--learning-category", "korean"]), /require --with-learning/);
  assert.throws(() => parsePromptArgs(["spec", "--with-learning", "--learning-category", "private"]), /category expects one of:/);
  assert.throws(() => parsePromptArgs(["spec", "--with-learning", "--learning-limit", "0"]), /--learning-limit expects an integer from 1 to 100/);
});

test("buildPromptPlan creates a slash command prompt for component specs", () => {
  const root = makeFixture();
  try {
    const plan = buildPromptPlan({
      brief: "spec a Button component API",
      sourceRoot: root,
      prefix: "design-",
    });

    assert.equal(plan.version, "test");
    assert.equal(plan.route.id, "component-spec");
    assert.equal(plan.slashCommand, "/design-component-spec");
    assert.equal(plan.qualityCommand, "design-ai check output.md --route component-spec --strict");
    assert.equal(plan.filesToRead[0], "AGENTS.md");
    assert.ok(plan.filesToRead.includes("commands/component-spec.md"));
    assert.ok(plan.filesToRead.includes("skills/component-spec-writer/PLAYBOOK.md"));
    assert.ok(plan.filesToRead.includes("knowledge/PRINCIPLES.md"));
    assert.ok(plan.filesToRead.includes("examples/component-button.md"));
    assert.ok(plan.referenceExamples.some((example) => example.relPath === "examples/component-button.md"));
    assert.ok(plan.prompt.includes("/design-component-spec spec a Button component API"));
    assert.ok(plan.prompt.includes("Route id: component-spec"));
    assert.ok(plan.prompt.includes("Reference examples:"));
    assert.ok(plan.prompt.includes("examples/component-button.md"));
    assert.ok(plan.prompt.includes("Routing reason: Matched"));
    assert.ok(plan.prompt.includes("Suggested artifact QA command:"));
    assert.ok(plan.prompt.includes("design-ai check output.md --route component-spec --strict"));
    assert.ok(plan.prompt.includes("Verification checklist:"));
    assert.ok(plan.checklist.some((item) => item.includes("anatomy, variants, states")));
    assert.ok(plan.prompt.includes("Run the playbook verification checklist"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("formatPromptJson preserves prompt plan order and readable Korean brief", () => {
  const root = makeFixture();
  try {
    const plan = buildPromptPlan({
      brief: "컴포넌트 버튼 스펙 작성",
      sourceRoot: root,
      prefix: "design-",
    });

    const formatted = formatPromptJson(plan);
    const parsed = JSON.parse(formatted);

    assert.deepEqual(Object.keys(parsed), [
      "brief",
      "version",
      "route",
      "slashCommand",
      "referenceExamples",
      "filesToRead",
      "checklist",
      "qualityCommand",
      "prompt",
    ]);
    assert.deepEqual(Object.keys(parsed.route).slice(0, 8), [
      "id",
      "label",
      "score",
      "confidence",
      "matchedKeywords",
      "command",
      "skills",
      "agents",
    ]);
    assert.equal(parsed.route.id, "component-spec");
    assert.ok(parsed.route.matchedKeywords.includes("컴포넌트"));
    assert.ok(parsed.prompt.includes("Task: 컴포넌트 버튼 스펙 작성"));
    assert.match(formatted, /"filesToRead": \[\n    "AGENTS\.md"/);
    assert.ok(formatted.includes("컴포넌트"));
    assert.ok(!formatted.includes("\\u"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("buildPromptPlan can filter explicit learning context", () => {
  const root = makeFixture();
  try {
    const learningFilePath = path.join(root, "learning.json");
    writeFileSync(learningFilePath, JSON.stringify({
      version: 1,
      updatedAt: "2026-05-22T00:00:02.000Z",
      entries: [
        {
          id: "learn-brand",
          category: "brand",
          text: "Use quiet brand language",
          source: "cli",
          createdAt: "2026-05-22T00:00:00.000Z",
        },
        {
          id: "learn-korean-old",
          category: "korean",
          text: "Prefer Korean mobile density",
          source: "cli",
          createdAt: "2026-05-22T00:00:01.000Z",
        },
        {
          id: "learn-korean-new",
          category: "korean",
          text: "Use KakaoTalk-style consent copy",
          source: "cli",
          createdAt: "2026-05-22T00:00:02.000Z",
        },
      ],
    }), "utf8");

    const plan = buildPromptPlan({
      brief: "audit Korean checkout UX",
      sourceRoot: root,
      withLearning: true,
      learningFilePath,
      learningCategory: "korean",
      learningLimit: 1,
    });

    assert.equal(plan.learningContext.category, "korean");
    assert.equal(plan.learningContext.limit, 1);
    assert.equal(plan.learningContext.query, "audit Korean checkout UX");
    assert.equal(plan.learningContext.selection.mode, "brief-relevance");
    assert.deepEqual(plan.learningContext.entries.map((entry) => entry.id), ["learn-korean-new"]);
    assert.ok(plan.prompt.includes("[korean] Use KakaoTalk-style consent copy"));
    assert.ok(plan.prompt.includes("Learning selection: brief relevance"));
    assert.ok(!plan.prompt.includes("Use quiet brand language"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("buildPromptPlan can force a route id", () => {
  const root = makeFixture();
  try {
    const plan = buildPromptPlan({
      brief: "spec a Button component API",
      sourceRoot: root,
      prefix: "design-",
      routeId: "design-review",
    });

    assert.equal(plan.route.id, "design-review");
    assert.equal(plan.route.forced, true);
    assert.equal(plan.slashCommand, "/design-design-review");
    assert.equal(plan.qualityCommand, "design-ai check output.md --route design-review --strict");
    assert.ok(plan.filesToRead.includes("commands/design-review.md"));
    assert.ok(plan.referenceExamples.some((example) => example.relPath === "examples/cases/dogfood-review.md"));
    assert.ok(plan.prompt.includes("Selected route: Design review"));
    assert.ok(plan.prompt.includes("Route id: design-review"));
    assert.ok(plan.prompt.includes("Routing reason: Route selected explicitly with --route."));
    assert.ok(plan.prompt.includes("route selected via --route"));
    assert.ok(plan.checklist.some((item) => item.includes("highest-impact issue")));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("formatPromptJson preserves forced route prompt plan order", () => {
  const root = makeFixture();
  try {
    const plan = buildPromptPlan({
      brief: "spec a Button component API",
      sourceRoot: root,
      prefix: "design-",
      routeId: "design-review",
    });

    const formatted = formatPromptJson(plan);
    const parsed = JSON.parse(formatted);

    assert.equal(parsed.route.id, "design-review");
    assert.equal(parsed.route.confidence, "forced");
    assert.equal(parsed.route.forced, true);
    assert.deepEqual(Object.keys(parsed.route).slice(-2), ["explanation", "forced"]);
    assert.equal(parsed.slashCommand, "/design-design-review");
    assert.equal(parsed.qualityCommand, "design-ai check output.md --route design-review --strict");
    assert.ok(parsed.prompt.includes("Selected route: Design review"));
    assert.match(formatted, /"route": \{\n    "id": "design-review"/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
