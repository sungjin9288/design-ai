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
    help: false,
    index: undefined,
  });
});

test("parsePromptArgs rejects unknown options", () => {
  assert.throws(() => parsePromptArgs(["spec", "--bad"]), /Unknown prompt option/);
  assert.throws(() => parsePromptArgs(["spec", "--route"]), /--route expects a route id/);
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
