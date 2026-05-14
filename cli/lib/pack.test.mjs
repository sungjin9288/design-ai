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
  buildPromptPack,
  parsePackArgs,
} from "./pack.mjs";

function makeFixture() {
  const root = mkdtempSync(path.join(tmpdir(), "design-ai-pack-"));
  const files = {
    ".claude-plugin/plugin.json": '{"version":"test"}',
    "AGENTS.md": "# Agents\nFollow repo rules.",
    "commands/design-review.md": "# Review command",
    "commands/component-spec.md": "# Component command",
    "skills/ux-audit/SKILL.md": "# UX audit skill",
    "skills/ux-audit/PLAYBOOK.md": "# UX audit playbook",
    "skills/design-critique/SKILL.md": "# Critique skill",
    "skills/design-critique/PLAYBOOK.md": "# Critique playbook",
    "skills/component-spec-writer/SKILL.md": "# Component skill",
    "skills/component-spec-writer/PLAYBOOK.md": "# Component playbook",
    "agents/component-architect.md": "# Architect",
    "agents/a11y-reviewer.md": "# A11y",
    "agents/design-critic.md": "# Critic",
    "knowledge/PRINCIPLES.md": "# Principles",
    "knowledge/patterns/ux-guidelines.md": "# UX",
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
    help: false,
    index: undefined,
  });
});

test("parsePackArgs rejects invalid options", () => {
  assert.throws(() => parsePackArgs(["spec", "--max-bytes", "999"]), /--max-bytes/);
  assert.throws(() => parsePackArgs(["spec", "--route"]), /--route expects a route id/);
  assert.throws(() => parsePackArgs(["spec", "--bad"]), /Unknown pack option/);
  assert.throws(() => parsePackArgs(["spec", "--max-byets", "2000"]), /Did you mean `--max-bytes`\?/);
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
