// Tests for cli/lib/pack.mjs prompt-context bundling.

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
  buildPackEvalTemplate,
  buildPromptPack,
  formatPackJson,
  packEvalReport,
  parsePackArgs,
} from "./pack.mjs";

function makeFixture() {
  const root = mkdtempSync(path.join(tmpdir(), "design-ai-pack-"));
  const files = {
    ".claude-plugin/plugin.json": '{"version":"test"}',
    "AGENTS.md": "# Agents\nFollow repo rules.",
    "commands/design-review.md": "# Review command",
    "commands/component-spec.md": "# Component command",
    "commands/website-improvement.md": "# Website command",
    "skills/ux-audit/SKILL.md": "# UX audit skill",
    "skills/ux-audit/PLAYBOOK.md": "# UX audit playbook",
    "skills/design-critique/SKILL.md": "# Critique skill",
    "skills/design-critique/PLAYBOOK.md": "# Critique playbook",
    "skills/website-improvement/SKILL.md": "# Website skill",
    "skills/website-improvement/PLAYBOOK.md": "# Website playbook",
    "skills/handoff-spec/SKILL.md": "# Handoff skill",
    "skills/handoff-spec/PLAYBOOK.md": "# Handoff playbook",
    "skills/component-spec-writer/SKILL.md": "# Component skill",
    "skills/component-spec-writer/PLAYBOOK.md": "# Component playbook",
    "agents/component-architect.md": "# Architect",
    "agents/a11y-reviewer.md": "# A11y",
    "agents/design-critic.md": "# Critic",
    "knowledge/PRINCIPLES.md": "# Principles",
    "knowledge/patterns/ux-guidelines.md": "# UX",
    "knowledge/layout/spacing-and-grid.md": "# Layout",
    "knowledge/patterns/report-design.md": "# Report",
    "docs/MCP-INTEGRATION.md": "# MCP",
    "docs/WEBSITE-IMPROVEMENT.md": "# Website improvement",
    "knowledge/a11y/contrast.md": "# Contrast",
    "knowledge/components/INDEX.md": "# Components",
    "knowledge/components/shadcn-registry.md": "# shadcn",
    "knowledge/a11y/keyboard-and-focus.md": "# Keyboard",
    "examples/component-button.md": "# Button example\nKeyboard, ARIA, responsive behavior, and contrast guidance.",
    "examples/component-modal.md": "# Modal example\nFocus trap and Escape behavior.",
    "examples/cases/dogfood-review.md": "# Dogfood review\nAudit findings and QA notes.",
  };

  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    writeFileSync(path.join(root, file), content);
  }

  return root;
}

test("parsePackArgs supports brief, max bytes, and json", () => {
  assert.deepEqual(parsePackArgs(["spec", "Button", "--max-bytes", "2000", "--json", "--out", "pack.json", "--force"]), {
    briefParts: ["spec", "Button"],
    brief: "spec Button",
    fromFile: "",
    stdin: false,
    routeId: "",
    maxBytes: 2000,
    json: true,
    outPath: "pack.json",
    force: true,
    withLearning: false,
    learningCategory: "",
    learningLimit: 0,
    withRecall: false,
    recallLimit: 0,
    evalTemplate: false,
    eval: false,
    strict: false,
    help: false,
    index: undefined,
  });
});

test("parsePackArgs supports file, stdin, and forced route sources", () => {
  assert.deepEqual(parsePackArgs(["--from-file", "brief.md", "--route", "design-review", "--max-bytes", "2000", "--out", "pack.md"]), {
    briefParts: [],
    brief: "",
    fromFile: "brief.md",
    stdin: false,
    routeId: "design-review",
    maxBytes: 2000,
    json: false,
    outPath: "pack.md",
    force: false,
    withLearning: false,
    learningCategory: "",
    learningLimit: 0,
    withRecall: false,
    recallLimit: 0,
    evalTemplate: false,
    eval: false,
    strict: false,
    help: false,
    index: undefined,
  });

  assert.deepEqual(parsePackArgs(["--stdin", "--json"]), {
    briefParts: [],
    brief: "",
    fromFile: "",
    stdin: true,
    routeId: "",
    maxBytes: 120000,
    json: true,
    outPath: "",
    force: false,
    withLearning: false,
    learningCategory: "",
    learningLimit: 0,
    withRecall: false,
    recallLimit: 0,
    evalTemplate: false,
    eval: false,
    strict: false,
    help: false,
    index: undefined,
  });
});

test("parsePackArgs supports explicit learning context", () => {
  const parsed = parsePackArgs([
    "spec",
    "Button",
    "--with-learning",
    "--learning-category",
    "brand",
    "--learning-limit",
    "3",
    "--max-bytes",
    "2000",
  ]);

  assert.equal(parsed.withLearning, true);
  assert.equal(parsed.learningCategory, "brand");
  assert.equal(parsed.learningLimit, 3);
  assert.equal(parsed.brief, "spec Button");
  assert.equal(parsed.maxBytes, 2000);
});

test("parsePackArgs supports pack eval template and eval checkpoints", () => {
  assert.deepEqual(parsePackArgs(["--eval-template", "--json", "--out", "pack-eval.json", "--force"]), {
    briefParts: [],
    brief: "",
    fromFile: "",
    stdin: false,
    routeId: "",
    maxBytes: 120000,
    json: true,
    outPath: "pack-eval.json",
    force: true,
    withLearning: false,
    learningCategory: "",
    learningLimit: 0,
    withRecall: false,
    recallLimit: 0,
    evalTemplate: true,
    eval: false,
    strict: false,
    help: false,
    index: undefined,
  });

  assert.deepEqual(parsePackArgs(["--eval", "--from-file", "pack-eval.json", "--strict", "--json"]), {
    briefParts: [],
    brief: "",
    fromFile: "pack-eval.json",
    stdin: false,
    routeId: "",
    maxBytes: 120000,
    json: true,
    outPath: "",
    force: false,
    withLearning: false,
    learningCategory: "",
    learningLimit: 0,
    withRecall: false,
    recallLimit: 0,
    evalTemplate: false,
    eval: true,
    strict: true,
    help: false,
    index: undefined,
  });
});

test("parsePackArgs rejects invalid options", () => {
  assert.throws(() => parsePackArgs(["spec", "--max-bytes", "999"]), /--max-bytes/);
  assert.throws(() => parsePackArgs(["spec", "--route"]), /--route expects a route id/);
  assert.throws(() => parsePackArgs(["spec", "--bad"]), /Unknown pack option/);
  assert.throws(() => parsePackArgs(["spec", "--max-byets", "2000"]), /Did you mean `--max-bytes`\?/);
  assert.throws(() => parsePackArgs(["spec", "--learning-limit", "2"]), /require --with-learning/);
  assert.throws(() => parsePackArgs(["spec", "--with-learning", "--learning-category", "private"]), /category expects one of:/);
  assert.throws(() => parsePackArgs(["spec", "--with-learning", "--learning-limit", "0"]), /--learning-limit expects an integer from 1 to 100/);
  assert.throws(() => parsePackArgs(["--eval", "--eval-template"]), /Choose either --eval-template or --eval/);
  assert.throws(() => parsePackArgs(["--strict"]), /--strict can only be used with --eval/);
  assert.throws(() => parsePackArgs(["--eval"]), /--eval requires --from-file or --stdin/);
  assert.throws(() => parsePackArgs(["--eval-template", "spec"]), /--eval-template cannot be combined/);
  assert.throws(() => parsePackArgs(["--eval", "--from-file", "pack-eval.json", "spec"]), /--eval cannot be combined/);
});

test("buildPromptPack includes prompt and context files", () => {
  const root = makeFixture();
  try {
    const pack = buildPromptPack({
      brief: "spec a Button component API",
      sourceRoot: root,
      prefix: "design-",
      maxBytes: 20_000,
    });

    assert.equal(pack.version, "test");
    assert.equal(pack.plan.route.id, "component-spec");
    assert.ok(pack.plan.checklist.some((item) => item.includes("anatomy, variants, states")));
    assert.equal(pack.summary.status, "complete");
    assert.equal(pack.summary.totalFiles, pack.files.length);
    assert.equal(pack.summary.includedFiles, pack.files.length);
    assert.equal(pack.summary.truncatedFiles, 0);
    assert.equal(pack.summary.missingFiles, 0);
    assert.deepEqual(pack.warnings, []);
    assert.ok(pack.files.some((file) => file.path === "AGENTS.md" && file.included));
    assert.ok(pack.files.some((file) => file.path === "examples/component-button.md" && file.included));
    assert.ok(pack.markdown.includes("# design-ai prompt pack"));
    assert.ok(pack.markdown.includes("## Context Summary"));
    assert.ok(pack.markdown.includes("Reference examples:"));
    assert.ok(pack.markdown.includes("Suggested artifact QA command:"));
    assert.ok(pack.markdown.includes("design-ai check output.md --route component-spec --strict"));
    assert.ok(pack.markdown.includes("Verification checklist:"));
    assert.ok(pack.markdown.includes("## Context Files"));
    assert.ok(pack.usedBytes > 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("buildPromptPack passes learning filters through to prompt plan", () => {
  const root = makeFixture();
  try {
    const learningFilePath = path.join(root, "learning.json");
    writeFileSync(learningFilePath, JSON.stringify({
      version: 1,
      updatedAt: "2026-05-22T00:00:01.000Z",
      entries: [
        {
          id: "learn-brand",
          category: "brand",
          text: "Use quiet brand language",
          source: "cli",
          createdAt: "2026-05-22T00:00:00.000Z",
        },
        {
          id: "learn-korean",
          category: "korean",
          text: "Prefer Korean mobile density",
          source: "cli",
          createdAt: "2026-05-22T00:00:01.000Z",
        },
      ],
    }), "utf8");

    const pack = buildPromptPack({
      brief: "audit Korean checkout UX",
      sourceRoot: root,
      maxBytes: 20_000,
      withLearning: true,
      learningFilePath,
      learningCategory: "brand",
      learningLimit: 1,
    });

    assert.equal(pack.plan.learningContext.category, "brand");
    assert.equal(pack.plan.learningContext.limit, 1);
    assert.equal(pack.plan.learningContext.query, "audit Korean checkout UX");
    assert.equal(pack.plan.learningContext.selection.mode, "brief-relevance");
    assert.equal(pack.plan.learningContext.selection.selectedCount, 1);
    assert.equal(pack.plan.learningContext.selection.fallbackCount, 1);
    assert.deepEqual(pack.plan.learningContext.selection.selected, [
      {
        id: "learn-brand",
        category: "brand",
        score: 0,
        matchedTokens: [],
        reason: "recency-fallback",
      },
    ]);
    assert.deepEqual(pack.plan.learningContext.entries.map((entry) => entry.id), ["learn-brand"]);
    assert.ok(pack.markdown.includes("[brand] Use quiet brand language"));
    assert.ok(pack.markdown.includes("Learning selection: brief relevance"));
    assert.ok(!pack.markdown.includes("Prefer Korean mobile density"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("formatPackJson preserves prompt pack order and readable Korean brief", () => {
  const root = makeFixture();
  try {
    const pack = buildPromptPack({
      brief: "컴포넌트 버튼 스펙 작성",
      sourceRoot: root,
      prefix: "design-",
      maxBytes: 20_000,
    });

    const formatted = formatPackJson(pack);
    const parsed = JSON.parse(formatted);

    assert.deepEqual(Object.keys(parsed), [
      "brief",
      "version",
      "maxBytes",
      "usedBytes",
      "summary",
      "warnings",
      "plan",
      "files",
      "markdown",
    ]);
    assert.deepEqual(Object.keys(parsed.summary), [
      "totalFiles",
      "includedFiles",
      "truncatedFiles",
      "missingFiles",
      "usedBytes",
      "maxBytes",
      "remainingBytes",
      "usedRatio",
      "status",
    ]);
    assert.deepEqual(Object.keys(parsed.plan).slice(0, 9), [
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
    assert.equal(parsed.plan.route.id, "component-spec");
    assert.equal(parsed.summary.status, "complete");
    assert.equal(parsed.files[0].path, "AGENTS.md");
    assert.ok(parsed.plan.prompt.includes("Task: 컴포넌트 버튼 스펙 작성"));
    assert.ok(parsed.markdown.includes("Brief: 컴포넌트 버튼 스펙 작성"));
    assert.match(formatted, /"files": \[\n    \{\n      "path": "AGENTS\.md"/);
    assert.ok(formatted.includes("컴포넌트"));
    assert.ok(!formatted.includes("\\u"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("buildPromptPack can force a route id", () => {
  const root = makeFixture();
  try {
    const pack = buildPromptPack({
      brief: "spec a Button component API",
      sourceRoot: root,
      prefix: "design-",
      routeId: "design-review",
      maxBytes: 20_000,
    });

    assert.equal(pack.plan.route.id, "design-review");
    assert.equal(pack.plan.route.forced, true);
    assert.ok(pack.markdown.includes("Selected route: Design review"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("formatPackJson preserves forced route and partial-context order", () => {
  const root = makeFixture();
  try {
    writeFileSync(path.join(root, "AGENTS.md"), `# Agents\n${"x".repeat(5000)}`);

    const pack = buildPromptPack({
      brief: "spec a Button component API",
      sourceRoot: root,
      prefix: "design-",
      routeId: "design-review",
      maxBytes: 1000,
    });

    const formatted = formatPackJson(pack);
    const parsed = JSON.parse(formatted);

    assert.equal(parsed.plan.route.id, "design-review");
    assert.equal(parsed.plan.route.confidence, "forced");
    assert.equal(parsed.plan.route.forced, true);
    assert.equal(parsed.summary.status, "partial");
    assert.ok(parsed.warnings.some((warning) => warning.includes("Truncated context file")));
    assert.deepEqual(Object.keys(parsed.files[0]), [
      "path",
      "bytes",
      "includedBytes",
      "included",
      "truncated",
      "content",
    ]);
    assert.deepEqual(Object.keys(parsed.plan.route).slice(-2), ["explanation", "forced"]);
    assert.match(formatted, /"warnings": \[\n    "Truncated context file:/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("buildPromptPack truncates files when byte budget is exhausted", () => {
  const root = makeFixture();
  try {
    writeFileSync(path.join(root, "AGENTS.md"), `# Agents\n${"x".repeat(5000)}`);

    const pack = buildPromptPack({
      brief: "spec a Button component API",
      sourceRoot: root,
      prefix: "design-",
      maxBytes: 1000,
    });

    assert.equal(pack.usedBytes <= 1000, true);
    assert.equal(pack.files.some((file) => file.truncated), true);
    assert.equal(pack.summary.status, "partial");
    assert.ok(pack.summary.truncatedFiles > 0);
    assert.ok(pack.warnings.some((warning) => warning.includes("Truncated context file")));
    assert.ok(pack.markdown.includes("Warnings:"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("buildPromptPack reports missing context files", () => {
  const root = makeFixture();
  try {
    rmSync(path.join(root, "knowledge/components/shadcn-registry.md"));
    mkdirSync(path.join(root, "knowledge/components/shadcn-registry.md"));

    const pack = buildPromptPack({
      brief: "spec a Button component API",
      sourceRoot: root,
      prefix: "design-",
      maxBytes: 20_000,
    });

    assert.equal(pack.summary.status, "partial");
    assert.equal(pack.summary.missingFiles, 1);
    assert.ok(pack.files.some((file) => file.path === "knowledge/components/shadcn-registry.md" && file.error));
    assert.ok(pack.warnings.some((warning) => warning.includes("Missing context file: knowledge/components/shadcn-registry.md")));
    assert.ok(pack.markdown.includes("_Not included:"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("buildPackEvalTemplate creates runnable prompt-pack checkpoints", () => {
  const root = makeFixture();
  try {
    const template = buildPackEvalTemplate({ sourceRoot: root, generatedAt: new Date("2026-06-02T00:00:00.000Z") });

    assert.equal(template.version, 1);
    assert.equal(template.sourcePackVersion, "test");
    assert.equal(template.generatedAt, "2026-06-02T00:00:00.000Z");
    assert.equal(template.cases.length >= 2, true);

    const report = packEvalReport({
      evalText: JSON.stringify(template),
      source: "pack-eval.json",
      sourceRoot: root,
      generatedAt: new Date("2026-06-02T00:00:00.000Z"),
    });

    assert.equal(report.status, "pass");
    assert.equal(report.summary.fail, 0);
    assert.equal(report.cases.every((testCase) => testCase.routeId === testCase.expectedRouteId), true);
    assert.equal(report.cases.every((testCase) => testCase.contextStatus === "complete"), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("packEvalReport reports route, planned-file, included-file, and payload failures", () => {
  const root = makeFixture();
  try {
    const report = packEvalReport({
      evalText: JSON.stringify({
        version: 1,
        cases: [
          {
            id: "bad-pack",
            brief: "Spec a Button component API",
            expectedRouteId: "website-improvement",
            requiredFiles: ["missing.md"],
            requiredIncludedFiles: ["missing-context.md"],
            requireContextStatus: "incomplete",
          },
        ],
      }),
      source: "bad-pack-eval.json",
      sourceRoot: root,
    });

    assert.equal(report.status, "fail");
    assert.equal(report.summary.fail, 1);
    assert.equal(report.cases[0].routeId, "component-spec");
    assert.match(report.cases[0].message, /Expected route website-improvement/);
    assert.deepEqual(report.cases[0].missingRequiredFiles, ["missing.md"]);
    assert.deepEqual(report.cases[0].missingIncludedFiles, ["missing-context.md"]);

    assert.throws(
      () => packEvalReport({ evalText: JSON.stringify({ version: 999, cases: [] }), sourceRoot: root }),
      /version must be 1/,
    );
    assert.throws(
      () => packEvalReport({ evalText: JSON.stringify({ version: 1, cases: [{ id: "empty" }] }), sourceRoot: root }),
      /missing brief/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("buildPromptPack injects corpus recall with --with-recall", () => {
  const root = makeFixture();
  try {
    const pack = buildPromptPack({
      brief: "spec a Button component API with keyboard accessibility",
      sourceRoot: root,
      prefix: "design-",
      withRecall: true,
      recallLimit: 3,
    });

    assert.ok(pack.plan.recall, "recall context should be present on the pack plan");
    assert.equal(pack.plan.recall.mode, "lexical");
    assert.ok(pack.plan.recall.selectedCount >= 1);
    assert.ok(pack.plan.recall.selectedCount <= 3);
    assert.match(pack.markdown, /## Recalled design knowledge/);
    assert.ok(pack.markdown.includes(pack.plan.recall.selected[0].id));

    const plain = buildPromptPack({
      brief: "spec a Button component API with keyboard accessibility",
      sourceRoot: root,
      prefix: "design-",
    });
    assert.equal(plain.plan.recall, undefined, "recall key is conditional on --with-recall");
    assert.ok(!plain.markdown.includes("## Recalled design knowledge"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("parsePackArgs rejects --recall-limit without --with-recall", () => {
  assert.throws(() => parsePackArgs(["spec", "--recall-limit", "5"]), /--recall-limit requires --with-recall/);
  assert.throws(() => parsePackArgs(["spec", "--with-recall", "--recall-limit", "21"]), /--recall-limit expects an integer from 1 to 20/);
  const parsed = parsePackArgs(["spec", "Button", "--with-recall", "--recall-limit", "3"]);
  assert.equal(parsed.withRecall, true);
  assert.equal(parsed.recallLimit, 3);
});
