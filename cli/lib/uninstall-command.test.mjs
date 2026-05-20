// Tests for cli/commands/uninstall.mjs uninstall result reporting.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildUninstallReport,
  formatUninstallJson,
  parseRemovedCount,
  parseUninstallArgs,
} from "../commands/uninstall.mjs";

test("parseUninstallArgs supports json and help output", () => {
  assert.deepEqual(parseUninstallArgs(["--json"]), {
    help: false,
    json: true,
  });
  assert.deepEqual(parseUninstallArgs(["--help"]), {
    help: true,
    json: false,
  });
});

test("parseUninstallArgs rejects unknown options with json suggestions", () => {
  assert.throws(
    () => parseUninstallArgs(["--jsn"]),
    /Did you mean `--json`\?/,
  );
  assert.throws(
    () => parseUninstallArgs(["unexpected"]),
    /Usage: design-ai uninstall \[--json\]/,
  );
});

test("parseRemovedCount extracts removed symlink count from installer output", () => {
  assert.equal(parseRemovedCount("Removed 39 design-ai symlinks"), 39);
  assert.equal(parseRemovedCount("\n✓  Removed 0 design-ai symlinks\n"), 0);
  assert.throws(
    () => parseRemovedCount("Done without a count"),
    /missing removed symlink count/,
  );
});

test("formatUninstallJson preserves key order and readable localized paths", () => {
  const formatted = formatUninstallJson(buildUninstallReport({
    sourceRoot: "/tmp/디자인",
    claudeHome: "/tmp/클로드",
    prefix: "디자인-",
    removed: 39,
  }));
  const parsed = JSON.parse(formatted);

  assert.deepEqual(Object.keys(parsed), ["context", "result"]);
  assert.deepEqual(Object.keys(parsed.context), ["sourceRoot", "claudeHome", "prefix"]);
  assert.deepEqual(Object.keys(parsed.result), ["removed"]);
  assert.equal(parsed.context.sourceRoot, "/tmp/디자인");
  assert.equal(parsed.context.claudeHome, "/tmp/클로드");
  assert.equal(parsed.context.prefix, "디자인-");
  assert.equal(parsed.result.removed, 39);
  assert.ok(formatted.includes("디자인-"));
  assert.ok(!formatted.includes("\\u"));
});
