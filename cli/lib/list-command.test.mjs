// Tests for cli/commands/list.mjs catalog domain helpers.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  LIST_KINDS,
  buildListCatalog,
  formatListJson,
  parseListArgs,
  runList,
} from "../commands/list.mjs";
import { expectedValueMessage } from "./suggest.mjs";

async function captureStdout(fn) {
  const lines = [];
  const originalLog = console.log;
  console.log = (...args) => {
    lines.push(args.join(" "));
  };
  try {
    await fn();
  } finally {
    console.log = originalLog;
  }
  return lines.join("\n");
}

test("LIST_KINDS keeps supported catalog domains explicit", () => {
  assert.deepEqual(LIST_KINDS, ["skills", "commands", "agents"]);
});

test("parseListArgs supports domain prefixes and json output", () => {
  assert.deepEqual(parseListArgs(["skills", "--json"]), {
    help: false,
    json: true,
    kind: "skills",
  });
  assert.deepEqual(parseListArgs(["--json", "comm"]), {
    help: false,
    json: true,
    kind: "commands",
  });
  assert.deepEqual(parseListArgs(["--help"]), {
    help: true,
    json: false,
    kind: "",
  });
});

test("list domain suggestion points close typos to supported domains", () => {
  assert.match(
    expectedValueMessage("domain", "skillz", LIST_KINDS),
    /Did you mean `skills`\?/,
  );
});

test("runList rejects unknown domains before loading the manifest", async () => {
  await assert.rejects(
    () => runList(["skillz"]),
    /Did you mean `skills`\?/,
  );
});

test("runList rejects unknown options before loading the manifest", async () => {
  await assert.rejects(
    () => runList(["--jsno"]),
    /Did you mean `--json`\?/,
  );
});

test("runList prints help before validating other list args", async () => {
  const output = await captureStdout(() => runList(["--help", "--jsno"]));

  assert.match(output, /Usage:\s+design-ai list \[skills\|commands\|agents\] \[--json\]/);
  assert.match(output, /--json\s+Emit machine-readable catalog entries/);
});

test("formatListJson preserves full catalog order and item order", async () => {
  const output = await captureStdout(() => runList(["--json"]));
  const catalog = JSON.parse(output);

  assert.deepEqual(Object.keys(catalog), ["name", "version", "kind", "sections"]);
  assert.equal(catalog.name, "design-ai");
  assert.equal(catalog.kind, null);
  assert.deepEqual(catalog.sections.map((section) => section.kind), LIST_KINDS);
  assert.deepEqual(Object.keys(catalog.sections[0]), ["kind", "count", "items"]);
  assert.deepEqual(Object.keys(catalog.sections[0].items[0]), [
    "name",
    "path",
    "description",
  ]);
  assert.equal(catalog.sections[0].kind, "skills");
  assert.equal(catalog.sections[0].count, 19);
  assert.equal(catalog.sections[0].items[0].name, "design-system-builder");
  assert.equal(catalog.sections[1].count, 16);
  assert.equal(catalog.sections[2].count, 4);
  assert.match(output, /"sections": \[\n    \{\n      "kind": "skills",/);
});

test("formatListJson preserves filtered catalog order and readable localized text", () => {
  const formatted = formatListJson(buildListCatalog({
    name: "디자인",
    version: "1.0.0",
    skills: [
      {
        name: "색상",
        path: "skills/color/SKILL.md",
        description: "한국어 색상 팔레트 설명",
      },
    ],
    commands: [],
    agents: [],
  }, "skills"));
  const catalog = JSON.parse(formatted);

  assert.deepEqual(Object.keys(catalog), ["name", "version", "kind", "sections"]);
  assert.equal(catalog.name, "디자인");
  assert.equal(catalog.kind, "skills");
  assert.deepEqual(catalog.sections.map((section) => section.kind), ["skills"]);
  assert.equal(catalog.sections[0].items[0].description, "한국어 색상 팔레트 설명");
  assert.ok(formatted.includes("한국어 색상 팔레트 설명"));
  assert.ok(!formatted.includes("\\u"));
});
