// Tests for cli/commands/version.mjs version metadata reporting.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  collectVersionReport,
  formatVersionJson,
  parseVersionArgs,
} from "../commands/version.mjs";

function createVersionFixture({ cli = "1.2.3", plugin = "1.2.3" } = {}) {
  const tmp = mkdtempSync(path.join(tmpdir(), "design-ai-version-"));
  const sourceRoot = path.join(tmp, "디자인");
  mkdirSync(path.join(sourceRoot, ".claude-plugin"), { recursive: true });
  writeFileSync(path.join(sourceRoot, "package.json"), JSON.stringify({ version: cli }), "utf8");
  writeFileSync(
    path.join(sourceRoot, ".claude-plugin", "plugin.json"),
    JSON.stringify({ version: plugin }),
    "utf8",
  );
  return { tmp, sourceRoot };
}

test("parseVersionArgs supports json and help output", () => {
  assert.deepEqual(parseVersionArgs(["--json"]), {
    help: false,
    json: true,
  });
  assert.deepEqual(parseVersionArgs(["--help"]), {
    help: true,
    json: false,
  });
});

test("parseVersionArgs rejects unknown options with json suggestions", () => {
  assert.throws(
    () => parseVersionArgs(["--jsn"]),
    /Did you mean `--json`\?/,
  );
  assert.throws(
    () => parseVersionArgs(["unexpected"]),
    /Usage: design-ai version \[--json\]/,
  );
});

test("formatVersionJson preserves key order and aligned versions", () => {
  const { tmp, sourceRoot } = createVersionFixture();
  try {
    const formatted = formatVersionJson(collectVersionReport({ sourceRoot }));
    const parsed = JSON.parse(formatted);

    assert.deepEqual(Object.keys(parsed), ["context", "versions"]);
    assert.deepEqual(Object.keys(parsed.context), ["sourceRoot"]);
    assert.deepEqual(Object.keys(parsed.versions), ["cli", "plugin", "aligned"]);
    assert.equal(parsed.context.sourceRoot, sourceRoot);
    assert.deepEqual(parsed.versions, {
      cli: "1.2.3",
      plugin: "1.2.3",
      aligned: true,
    });
    assert.ok(formatted.includes("디자인"));
    assert.ok(!formatted.includes("\\u"));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("formatVersionJson reports unknown and mismatched versions", () => {
  const { tmp, sourceRoot } = createVersionFixture({ cli: "1.2.3", plugin: "1.2.4" });
  try {
    const mismatched = JSON.parse(formatVersionJson(collectVersionReport({ sourceRoot })));
    assert.deepEqual(mismatched.versions, {
      cli: "1.2.3",
      plugin: "1.2.4",
      aligned: false,
    });

    const missing = JSON.parse(formatVersionJson(collectVersionReport({
      sourceRoot,
      packagePath: path.join(sourceRoot, "missing-package.json"),
    })));
    assert.deepEqual(missing.versions, {
      cli: "unknown",
      plugin: "1.2.4",
      aligned: false,
    });
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
