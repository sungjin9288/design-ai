// Tests for cli/commands/status.mjs install-state reporting.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  collectStatusReport,
  formatStatusJson,
  parseStatusArgs,
} from "../commands/status.mjs";

function createStatusFixture() {
  const tmp = mkdtempSync(path.join(tmpdir(), "design-ai-status-"));
  const sourceRoot = path.join(tmp, "source");
  const claudeHome = path.join(tmp, "claude");
  const foreignRoot = path.join(tmp, "foreign");

  mkdirSync(path.join(sourceRoot, "skills", "color-palette"), { recursive: true });
  mkdirSync(path.join(sourceRoot, "skills", "ux-audit"), { recursive: true });
  mkdirSync(path.join(sourceRoot, "agents"), { recursive: true });
  mkdirSync(path.join(sourceRoot, "commands"), { recursive: true });
  mkdirSync(foreignRoot, { recursive: true });

  writeFileSync(path.join(sourceRoot, "agents", "design-critic.md"), "# agent\n");
  writeFileSync(path.join(sourceRoot, "commands", "component-spec.md"), "# command\n");
  writeFileSync(path.join(foreignRoot, "not-design-ai.md"), "# foreign\n");

  mkdirSync(path.join(claudeHome, "skills"), { recursive: true });
  mkdirSync(path.join(claudeHome, "agents"), { recursive: true });
  mkdirSync(path.join(claudeHome, "commands"), { recursive: true });

  symlinkSync(
    path.join(sourceRoot, "skills", "ux-audit"),
    path.join(claudeHome, "skills", "smoke-design-ux-audit"),
  );
  symlinkSync(
    path.join(sourceRoot, "skills", "color-palette"),
    path.join(claudeHome, "skills", "smoke-design-color-palette"),
  );
  symlinkSync(
    path.join(sourceRoot, "agents", "design-critic.md"),
    path.join(claudeHome, "agents", "smoke-design-design-critic.md"),
  );
  symlinkSync(
    path.join(sourceRoot, "commands", "component-spec.md"),
    path.join(claudeHome, "commands", "smoke-design-component-spec.md"),
  );
  symlinkSync(
    path.join(foreignRoot, "not-design-ai.md"),
    path.join(claudeHome, "commands", "smoke-design-foreign.md"),
  );

  return { tmp, sourceRoot, claudeHome };
}

test("parseStatusArgs supports json and help output", () => {
  assert.deepEqual(parseStatusArgs(["--json"]), {
    help: false,
    json: true,
  });
  assert.deepEqual(parseStatusArgs(["--help"]), {
    help: true,
    json: false,
  });
});

test("parseStatusArgs rejects unknown options with json suggestions", () => {
  assert.throws(
    () => parseStatusArgs(["--jsn"]),
    /Did you mean `--json`\?/,
  );
  assert.throws(
    () => parseStatusArgs(["unexpected"]),
    /Usage: design-ai status \[--json\]/,
  );
});

test("formatStatusJson preserves install report order and sorted entries", () => {
  const { tmp, sourceRoot, claudeHome } = createStatusFixture();
  try {
    const report = collectStatusReport({
      sourceRoot,
      claudeHome,
      prefix: "smoke-design-",
      targets: [
        { kind: "skills", label: "Skills", dir: path.join(claudeHome, "skills") },
        { kind: "agents", label: "Agents", dir: path.join(claudeHome, "agents") },
        { kind: "commands", label: "Slash commands", dir: path.join(claudeHome, "commands") },
      ],
    });
    const formatted = formatStatusJson(report);
    const parsed = JSON.parse(formatted);

    assert.deepEqual(Object.keys(parsed), ["context", "sections", "summary"]);
    assert.deepEqual(Object.keys(parsed.context), ["sourceRoot", "claudeHome", "prefix"]);
    assert.deepEqual(Object.keys(parsed.sections[0]), [
      "kind",
      "label",
      "targetDir",
      "targetExists",
      "installed",
      "entries",
    ]);
    assert.deepEqual(Object.keys(parsed.summary), ["installed", "missingSections", "emptySections"]);
    assert.equal(parsed.context.prefix, "smoke-design-");
    assert.deepEqual(parsed.sections.map((section) => section.kind), ["skills", "agents", "commands"]);
    assert.deepEqual(parsed.sections[0].entries, [
      "smoke-design-color-palette",
      "smoke-design-ux-audit",
    ]);
    assert.equal(parsed.sections[2].installed, 1);
    assert.deepEqual(parsed.sections[2].entries, ["smoke-design-component-spec.md"]);
    assert.deepEqual(parsed.summary, {
      installed: 4,
      missingSections: 0,
      emptySections: 0,
    });
    assert.match(formatted, /"sections": \[\n    \{\n      "kind": "skills",/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("formatStatusJson preserves missing sections and readable localized paths", () => {
  const formatted = formatStatusJson(collectStatusReport({
    sourceRoot: "/tmp/디자인",
    claudeHome: "/tmp/클로드",
    prefix: "디자인-",
    targets: [
      { kind: "skills", label: "스킬", dir: "/tmp/없는-스킬" },
    ],
  }));
  const parsed = JSON.parse(formatted);

  assert.equal(parsed.context.sourceRoot, "/tmp/디자인");
  assert.equal(parsed.context.claudeHome, "/tmp/클로드");
  assert.equal(parsed.context.prefix, "디자인-");
  assert.equal(parsed.sections[0].targetExists, false);
  assert.equal(parsed.sections[0].installed, 0);
  assert.deepEqual(parsed.summary, {
    installed: 0,
    missingSections: 1,
    emptySections: 0,
  });
  assert.ok(formatted.includes("디자인-"));
  assert.ok(!formatted.includes("\\u"));
});
