// Tests for cli/commands/help.mjs top-level command discovery output.

import { readFileSync } from "node:fs";
import { test } from "node:test";
import assert from "node:assert/strict";

import { auditScriptLabel } from "../commands/audit.mjs";
import {
  HELP_ALIASES,
  HELP_TOPICS,
  buildHelpCatalog,
  buildPluginInventorySummary,
  formatHelpJson,
  runHelp,
} from "../commands/help.mjs";
import { REPOSITORY_AUDIT_SCRIPTS } from "./doctor.mjs";
import { PLUGIN_MANIFEST } from "./paths.mjs";

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

test("runHelp lists advanced options supported by command parsers", async () => {
  const output = await captureStdout(() => runHelp([]));
  const pluginManifest = JSON.parse(readFileSync(PLUGIN_MANIFEST, "utf8"));
  const pluginInventory = buildPluginInventorySummary(pluginManifest);

  assert.match(output, /Usage:\s+design-ai <command> \[args\]/);
  assert.match(output, /design-ai help \[command\|--json\]/);
  assert.match(output, /install \[--json\]/);
  assert.match(output, /update \[--dry-run\] \[--json\]/);
  assert.match(output, /audit \[--strict\] \[--quiet\] \[--json\]/);
  assert.match(output, /version \[--json\]/);
  assert.match(output, /uninstall \[--json\]/);
  assert.match(output, /status \[--json\]/);
  assert.match(output, /list \[skills\|commands\|agents\] \[--json\]/);
  assert.match(output, /search <query> \[--dir kind\] \[--limit N\] \[--json\]/);
  assert.match(output, /show <file\[:line\]> \[--lines N:M\] \[--context N\] \[--json\]/);
  assert.match(output, /route <brief\|--from-file file\|--stdin\|--list> \[--limit N\]/);
  assert.match(output, /prompt <brief\|--from-file file\|--stdin> \[--route id\] \[--with-learning\] \[--learning-category kind\] \[--learning-limit N\] \[--out file\]/);
  assert.match(output, /pack <brief\|--from-file file\|--stdin> \[--route id\] \[--with-learning\] \[--learning-category kind\] \[--learning-limit N\] \[--max-bytes N\]/);
  assert.match(output, /check <artifact\.md\|--stdin\|--examples> \[--route id\|--all-routes\]/);
  assert.match(output, /examples \[query\] \[--route id\] \[--limit N\] \[--json\]/);
  assert.match(output, /learn \[--remember text\|--list\|--export\|--audit \[--fix\]\|--stats\|--forget id\|--clear\] \[--json\]/);
  assert.match(
    output,
    /prompt <brief\|--from-file file\|--stdin> \[--route id\] \[--with-learning\] \[--learning-category kind\] \[--learning-limit N\] \[--out file\]\n\s+Generate a ready-to-use agent prompt/,
  );
  assert.match(
    output,
    /pack <brief\|--from-file file\|--stdin> \[--route id\] \[--with-learning\] \[--learning-category kind\] \[--learning-limit N\] \[--max-bytes N\]\n\s+Generate prompt plus bounded context with summary/,
  );
  assert.match(
    output,
    /learn \[--remember text\|--list\|--export\|--audit \[--fix\]\|--stats\|--forget id\|--clear\] \[--json\]\s+Manage local learning preferences for prompt personalization/,
  );
  assert.ok(
    output.includes(`Plugin:  ${pluginInventory} (UI/UX, motion,`),
    "top-level help should summarize plugin inventory from .claude-plugin/plugin.json",
  );
});

test("buildPluginInventorySummary formats manifest section counts", () => {
  assert.equal(
    buildPluginInventorySummary({
      skills: [{ name: "a" }, { name: "b" }],
      commands: [{ name: "c" }],
      agents: [],
    }),
    "2 skills, 1 command, 0 agents",
  );
});

test("runHelp emits a machine-readable help topic catalog", async () => {
  const output = await captureStdout(() => runHelp(["--json"]));
  const catalog = JSON.parse(output);

  assert.equal(catalog.usage, "design-ai help [command|--json]");
  assert.deepEqual(catalog.topics.map((topic) => topic.topic), HELP_TOPICS);
  assert.deepEqual(catalog.aliases, HELP_ALIASES);
  assert.equal(
    catalog.topics.find((topic) => topic.topic === "route").usage,
    "design-ai route <brief|--from-file file|--stdin|--list> [--limit N]",
  );
  assert.equal(
    catalog.topics.find((topic) => topic.topic === "learn").usage,
    "design-ai learn [--remember text|--list|--export|--audit [--fix]|--stats|--forget id|--clear] [--json]",
  );
  assert.deepEqual(catalog.topics.find((topic) => topic.topic === "search").aliases, ["find"]);
});

test("formatHelpJson preserves help catalog order and alias map order", () => {
  const formatted = formatHelpJson(buildHelpCatalog());
  const catalog = JSON.parse(formatted);

  assert.deepEqual(Object.keys(catalog), ["usage", "topics", "aliases"]);
  assert.deepEqual(Object.keys(catalog.topics[0]), [
    "topic",
    "usage",
    "description",
    "aliases",
  ]);
  assert.deepEqual(catalog.topics.map((topic) => topic.topic), HELP_TOPICS);
  assert.deepEqual(Object.keys(catalog.aliases), Object.keys(HELP_ALIASES));
  assert.equal(
    catalog.topics.find((topic) => topic.topic === "install").usage,
    "design-ai install [--json]",
  );
  assert.equal(
    catalog.topics.find((topic) => topic.topic === "update").usage,
    "design-ai update [--dry-run] [--json]",
  );
  assert.equal(
    catalog.topics.find((topic) => topic.topic === "version").usage,
    "design-ai version [--json]",
  );
  assert.equal(
    catalog.topics.find((topic) => topic.topic === "uninstall").usage,
    "design-ai uninstall [--json]",
  );
  assert.equal(
    catalog.topics.find((topic) => topic.topic === "audit").usage,
    "design-ai audit [--strict] [--quiet] [--json]",
  );
  assert.equal(
    catalog.topics.find((topic) => topic.topic === "status").usage,
    "design-ai status [--json]",
  );
  assert.equal(
    catalog.topics.find((topic) => topic.topic === "list").usage,
    "design-ai list [skills|commands|agents] [--json]",
  );
  assert.equal(
    catalog.topics.find((topic) => topic.topic === "show").usage,
    "design-ai show <file[:line]> [--lines N:M] [--context N] [--json]",
  );
  assert.match(formatted, /"topics": \[\n    \{\n      "topic": "install",/);
});

test("formatHelpJson keeps localized help text readable", () => {
  const formatted = formatHelpJson({
    usage: "design-ai 도움말",
    topics: [
      {
        topic: "도움말",
        usage: "design-ai help",
        description: "한국어 도움말 설명",
        aliases: ["도움"],
      },
    ],
    aliases: {
      도움: "help",
    },
  });
  const catalog = JSON.parse(formatted);

  assert.equal(catalog.usage, "design-ai 도움말");
  assert.equal(catalog.topics[0].description, "한국어 도움말 설명");
  assert.deepEqual(catalog.aliases, { 도움: "help" });
  assert.ok(formatted.includes("한국어 도움말 설명"));
  assert.ok(!formatted.includes("\\u"));
});

test("runHelp delegates command topics to command-specific help", async () => {
  const routeOutput = await captureStdout(() => runHelp(["route"]));
  assert.match(routeOutput, /Usage:\s+design-ai route <brief>/);
  assert.match(routeOutput, /design-ai route --list \[--json\]/);
  assert.match(routeOutput, /design-ai route --from-file brief\.md \[--limit N\] \[--explain\] \[--json\]/);
  assert.match(routeOutput, /cat brief\.md \| design-ai route --stdin \[--limit N\] \[--explain\] \[--json\]/);
  assert.doesNotMatch(routeOutput, /Environment overrides:/);

  const promptOutput = await captureStdout(() => runHelp(["prompt"]));
  assert.match(promptOutput, /design-ai prompt <brief> \[--route id\] \[--with-learning\] \[--learning-category kind\] \[--learning-limit N\] \[--json\] \[--out file\] \[--force\]/);
  assert.match(promptOutput, /cat brief\.md \| design-ai prompt --stdin \[--route id\] \[--with-learning\] \[--learning-category kind\] \[--learning-limit N\] \[--json\]/);
  assert.match(promptOutput, /--learning-category kind\s+Include only one learning category; requires --with-learning/);
  assert.match(promptOutput, /--learning-limit N\s+Limit included learning entries, 1-100; requires --with-learning/);

  const packOutput = await captureStdout(() => runHelp(["pack"]));
  assert.match(packOutput, /design-ai pack <brief> \[--route id\] \[--with-learning\] \[--learning-category kind\] \[--learning-limit N\] \[--max-bytes N\] \[--json\] \[--out file\] \[--force\]/);
  assert.match(packOutput, /cat brief\.md \| design-ai pack --stdin \[--route id\] \[--with-learning\] \[--learning-category kind\] \[--learning-limit N\] \[--max-bytes N\] \[--json\]/);
  assert.match(packOutput, /--learning-category kind\s+Include only one learning category; requires --with-learning/);
  assert.match(packOutput, /--learning-limit N\s+Limit included learning entries, 1-100; requires --with-learning/);

  const learnOutput = await captureStdout(() => runHelp(["learn"]));
  assert.match(learnOutput, /Usage:\s+design-ai learn \[--list\] \[--category kind\] \[--limit N\] \[--json\]/);
  assert.match(learnOutput, /design-ai learn --audit \[--json\]/);
  assert.match(learnOutput, /design-ai learn --audit --fix --dry-run \[--json\]/);
  assert.match(learnOutput, /design-ai learn --audit --fix --yes \[--json\]/);
  assert.match(learnOutput, /--fix\s+With --audit, prepare or apply safe cleanup suggestions/);
  assert.match(learnOutput, /--dry-run\s+Preview --audit --fix cleanup without changing the profile/);
  assert.match(learnOutput, /design-ai learn --stats \[--json\]/);
  assert.match(learnOutput, /--stats\s+Summarize profile counts, recency, and audit status without changing it/);
  assert.match(learnOutput, /design-ai learn --forget id-or-number --yes \[--json\]/);
  assert.match(learnOutput, /design-ai learn --clear --yes \[--json\]/);
  assert.match(learnOutput, /local memory, not model training or fine-tuning/);

  const installOutput = await captureStdout(() => runHelp(["install"]));
  assert.match(installOutput, /Usage:\s+design-ai install \[--json\]/);
  assert.match(installOutput, /Symlinks design-ai skills/);
  assert.match(installOutput, /--json\s+Emit machine-readable install result/);

  const updateOutput = await captureStdout(() => runHelp(["update"]));
  assert.match(updateOutput, /Usage:\s+design-ai update \[--dry-run\] \[--json\]/);
  assert.match(updateOutput, /--dry-run\s+Preview git\/install actions without changing files/);
  assert.match(updateOutput, /--json\s+Emit machine-readable dry-run plan; requires --dry-run/);

  const uninstallOutput = await captureStdout(() => runHelp(["uninstall"]));
  assert.match(uninstallOutput, /Usage:\s+design-ai uninstall \[--json\]/);
  assert.match(uninstallOutput, /--json\s+Emit machine-readable uninstall result/);

  const auditOutput = await captureStdout(() => runHelp(["audit"]));
  const auditLabels = REPOSITORY_AUDIT_SCRIPTS.map(auditScriptLabel).join(", ");
  assert.match(auditOutput, /Usage:\s+design-ai audit \[--strict\] \[--quiet\] \[--json\]/);
  assert.match(auditOutput, /--json\s+Emit machine-readable audit results/);
  assert.ok(
    auditOutput.includes(`Runs the same ${REPOSITORY_AUDIT_SCRIPTS.length} repository audits used by CI:`),
    "audit help should describe the repository audit count from the shared script list",
  );
  assert.ok(
    auditOutput.includes(`  ${auditLabels}`),
    "audit help should list labels derived from the shared repository audit scripts",
  );
  assert.doesNotMatch(auditOutput, /same seven repository audits/);
});

test("runHelp exposes usage output for every supported help topic", async () => {
  for (const topic of HELP_TOPICS) {
    const output = await captureStdout(() => runHelp([topic]));
    assert.match(output, /Usage:\s+design-ai/, `expected usage output for help topic ${topic}`);
    assert.doesNotMatch(output, /Unknown help topic/, `expected known help topic ${topic}`);
  }
});

test("runHelp aliases match their canonical help topics", async () => {
  for (const [alias, topic] of Object.entries(HELP_ALIASES)) {
    assert.equal(HELP_TOPICS.includes(topic), true, `${topic} should be a help topic`);
    assert.equal(HELP_TOPICS.includes(alias), false, `${alias} should stay an alias`);

    const aliasOutput = await captureStdout(() => runHelp([alias]));
    const topicOutput = await captureStdout(() => runHelp([topic]));
    assert.equal(aliasOutput, topicOutput, `${alias} should resolve to help topic ${topic}`);
  }
});

test("runHelp supports aliases and suggestions for help topics", async () => {
  const aliasOutput = await captureStdout(() => runHelp(["find"]));
  assert.match(aliasOutput, /Usage:\s+design-ai search <query>/);

  await assert.rejects(
    () => runHelp(["serach"]),
    /Did you mean `design-ai help search`\?/,
  );
});
