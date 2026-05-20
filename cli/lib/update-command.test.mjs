// Tests for cli/commands/update.mjs option parsing.

import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  buildUpdateDryRunReport,
  formatUpdateDryRunJson,
  parseUpdateArgs,
} from "../commands/update.mjs";

test("parseUpdateArgs supports help output", () => {
  assert.deepEqual(parseUpdateArgs(["--help"]), {
    help: true,
    dryRun: false,
    json: false,
  });
  assert.deepEqual(parseUpdateArgs(["-h"]), {
    help: true,
    dryRun: false,
    json: false,
  });
  assert.deepEqual(parseUpdateArgs(["--dry-run", "--json"]), {
    help: false,
    dryRun: true,
    json: true,
  });
  assert.deepEqual(parseUpdateArgs([]), {
    help: false,
    dryRun: false,
    json: false,
  });
});

test("parseUpdateArgs rejects unknown options before git or install work", () => {
  assert.throws(
    () => parseUpdateArgs(["--hlep"]),
    /Did you mean `--help`\?/,
  );
  assert.throws(
    () => parseUpdateArgs(["unexpected"]),
    /Usage: design-ai update/,
  );
  assert.throws(
    () => parseUpdateArgs(["--json"]),
    /--json is only supported with --dry-run/,
  );
});

test("formatUpdateDryRunJson preserves plan order and localized paths", () => {
  const tmp = mkdtempSync(path.join(tmpdir(), "design-ai-update-"));
  const sourceRoot = path.join(tmp, "디자인");
  const installScript = path.join(sourceRoot, "install.sh");
  try {
    mkdirSync(path.join(sourceRoot, ".git"), { recursive: true });
    writeFileSync(installScript, "#!/usr/bin/env bash\n", "utf8");

    const formatted = formatUpdateDryRunJson(buildUpdateDryRunReport({
      sourceRoot,
      claudeHome: "/tmp/클로드",
      prefix: "디자인-",
      installScript,
    }));
    const parsed = JSON.parse(formatted);

    assert.deepEqual(Object.keys(parsed), ["context", "plan", "result"]);
    assert.deepEqual(Object.keys(parsed.context), ["sourceRoot", "claudeHome", "prefix"]);
    assert.deepEqual(Object.keys(parsed.plan), ["gitPull", "install"]);
    assert.deepEqual(Object.keys(parsed.plan.gitPull), [
      "sourceIsGitClone",
      "wouldRun",
      "command",
      "reason",
    ]);
    assert.deepEqual(Object.keys(parsed.plan.install), [
      "installScriptExists",
      "wouldRun",
      "installScript",
      "command",
      "reason",
    ]);
    assert.deepEqual(Object.keys(parsed.result), ["dryRun", "mutating", "ready"]);
    assert.equal(parsed.context.sourceRoot, sourceRoot);
    assert.equal(parsed.context.claudeHome, "/tmp/클로드");
    assert.equal(parsed.context.prefix, "디자인-");
    assert.deepEqual(parsed.plan.gitPull.command, ["git", "pull", "--ff-only"]);
    assert.deepEqual(parsed.plan.install.command, ["bash", installScript, "install"]);
    assert.deepEqual(parsed.result, {
      dryRun: true,
      mutating: false,
      ready: true,
    });
    assert.ok(formatted.includes("디자인-"));
    assert.ok(!formatted.includes("\\u"));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
