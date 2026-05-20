// Tests for cli/commands/install.mjs install result reporting.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildInstallReport,
  formatInstallJson,
  parseInstallArgs,
  parseInstalledCounts,
} from "../commands/install.mjs";

test("parseInstallArgs supports json and help output", () => {
  assert.deepEqual(parseInstallArgs(["--json"]), {
    help: false,
    json: true,
  });
  assert.deepEqual(parseInstallArgs(["--help"]), {
    help: true,
    json: false,
  });
});

test("parseInstallArgs rejects unknown options with json suggestions", () => {
  assert.throws(
    () => parseInstallArgs(["--jsn"]),
    /Did you mean `--json`\?/,
  );
  assert.throws(
    () => parseInstallArgs(["unexpected"]),
    /Usage: design-ai install \[--json\]/,
  );
});

test("parseInstalledCounts extracts install counts from installer output", () => {
  assert.deepEqual(
    parseInstalledCounts([
      "Installed 19 skills (prefix: smoke-design-)",
      "Installed 4 agents (prefix: smoke-design-)",
      "Installed 16 slash commands (prefix: /smoke-design-)",
    ].join("\n")),
    {
      skills: 19,
      agents: 4,
      commands: 16,
      total: 39,
    },
  );
  assert.throws(
    () => parseInstalledCounts("Installed 19 skills"),
    /missing installed agents count/,
  );
});

test("formatInstallJson preserves key order and readable localized paths", () => {
  const formatted = formatInstallJson(buildInstallReport({
    sourceRoot: "/tmp/디자인",
    claudeHome: "/tmp/클로드",
    prefix: "디자인-",
    installed: {
      skills: 19,
      agents: 4,
      commands: 16,
      total: 39,
    },
  }));
  const parsed = JSON.parse(formatted);

  assert.deepEqual(Object.keys(parsed), ["context", "result"]);
  assert.deepEqual(Object.keys(parsed.context), ["sourceRoot", "claudeHome", "prefix"]);
  assert.deepEqual(Object.keys(parsed.result), ["installed"]);
  assert.deepEqual(Object.keys(parsed.result.installed), ["skills", "agents", "commands", "total"]);
  assert.equal(parsed.context.sourceRoot, "/tmp/디자인");
  assert.equal(parsed.context.claudeHome, "/tmp/클로드");
  assert.equal(parsed.context.prefix, "디자인-");
  assert.deepEqual(parsed.result.installed, {
    skills: 19,
    agents: 4,
    commands: 16,
    total: 39,
  });
  assert.ok(formatted.includes("디자인-"));
  assert.ok(!formatted.includes("\\u"));
});
