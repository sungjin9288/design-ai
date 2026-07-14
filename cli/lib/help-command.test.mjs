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
  assert.match(output, /search <query\|--eval-template\|--eval> \[--dir kind\] \[--limit N\] \[--ranked\] \[--embeddings \[--provider "cmd args"\]\] \[--strict\] \[--json\]/);
  assert.match(output, /index \[--build\|--status\|--verify\] \[--json\] \[--embeddings \[--provider "cmd args"\]\]/);
  assert.match(output, /show <file\[:line\]> \[--lines N:M\] \[--context N\] \[--json\]/);
  assert.match(output, /route <brief\|--from-file file\|--stdin\|--list\|--eval-template\|--eval> \[--limit N\]/);
  assert.match(output, /prompt <brief\|--from-file file\|--stdin\|--eval-template\|--eval> \[--route id\] \[--with-learning\] \[--learning-category kind\] \[--learning-limit N\] \[--with-recall\] \[--recall-limit N\] \[--out file\]/);
  assert.match(output, /pack <brief\|--from-file file\|--stdin\|--eval-template\|--eval> \[--route id\] \[--with-learning\] \[--learning-category kind\] \[--learning-limit N\] \[--with-recall\] \[--recall-limit N\] \[--max-bytes N\]/);
  assert.match(output, /check <artifact\.md\|--stdin\|--examples> \[--route id\|--all-routes\] \[--learn\]/);
  assert.match(output, /inspect <source\.html> --brief text \[--name name\] \[--locale locale\] \[--viewport name\] \[--json\]/);
  assert.match(output, /verify-browser <quality-report\.json> --url loopback-url --target-root path --adapter executable --approval-ref text --yes \[--json\]/);
  assert.match(output, /examples \[query\] \[--route id\] \[--limit N\] \[--json\]/);
  assert.match(output, /learn \[--init\|--remember text\|--feedback text\|--list\|--export\|--query text\|--explain\|--recall query\|--backup\|--redact\|--verify\|--diff\|--restore\|--restore-backups \[--prune\]\|--import\|--audit \[--fix\]\|--curate\|--stats\|--usage\|--signals \[--strict\]\|--agent-backlog \[--strict\]\|--propose-skills \[--min-evidence N\] \[--review-file path\] \[--review-check\|--apply-plan\] \[--strict\]\|--eval-template\|--eval \[--strict\]\|--forget id\|--clear\] \[--json\|--report\|--patch\|--review-template\] \[--out file\]/);
  assert.match(output, /workspace \[--root path\] \[--learning-file path\] \[--learning-usage path\] \[--learning-eval path\] \[--strict\] \[--json\]/);
  assert.match(output, /site --init --name name \[--live-url url\] \[--repo-url url\|--local-path path\] \[--next-actions\]/);
  assert.match(output, /mcp\s+Start the stdio MCP server for Claude Code, Codex, and other MCP clients/);
  assert.match(
    output,
    /prompt <brief\|--from-file file\|--stdin\|--eval-template\|--eval> \[--route id\] \[--with-learning\] \[--learning-category kind\] \[--learning-limit N\] \[--with-recall\] \[--recall-limit N\] \[--out file\]\n\s+Generate a ready-to-use agent prompt and prompt-plan eval checkpoints/,
  );
  assert.match(
    output,
    /pack <brief\|--from-file file\|--stdin\|--eval-template\|--eval> \[--route id\] \[--with-learning\] \[--learning-category kind\] \[--learning-limit N\] \[--with-recall\] \[--recall-limit N\] \[--max-bytes N\]\n\s+Generate prompt plus bounded context and prompt-pack eval checkpoints/,
  );
  assert.match(
    output,
    /learn \[--init\|--remember text\|--feedback text\|--list\|--export\|--query text\|--explain\|--recall query\|--backup\|--redact\|--verify\|--diff\|--restore\|--restore-backups \[--prune\]\|--import\|--audit \[--fix\]\|--curate\|--stats\|--usage\|--signals \[--strict\]\|--agent-backlog \[--strict\]\|--propose-skills \[--min-evidence N\] \[--review-file path\] \[--review-check\|--apply-plan\] \[--strict\]\|--eval-template\|--eval \[--strict\]\|--forget id\|--clear\] \[--json\|--report\|--patch\|--review-template\] \[--out file\]\s+Manage local learning preferences, usage reports, signal registry, agent backlog, skill proposals, and eval checkpoints for prompt personalization/,
  );
  assert.ok(
    output.includes(`Plugin:  ${pluginInventory} (UI/UX, website improvement, motion,`),
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
    "design-ai route <brief|--from-file file|--stdin|--list|--eval-template|--eval> [--limit N]",
  );
  assert.equal(
    catalog.topics.find((topic) => topic.topic === "prompt").usage,
    "design-ai prompt <brief|--from-file file|--stdin|--eval-template|--eval> [--route id] [--with-learning] [--learning-category kind] [--learning-limit N] [--with-recall] [--recall-limit N] [--out file]",
  );
  assert.equal(
    catalog.topics.find((topic) => topic.topic === "pack").usage,
    "design-ai pack <brief|--from-file file|--stdin|--eval-template|--eval> [--route id] [--with-learning] [--learning-category kind] [--learning-limit N] [--with-recall] [--recall-limit N] [--max-bytes N]",
  );
  assert.equal(
    catalog.topics.find((topic) => topic.topic === "learn").usage,
    "design-ai learn [--init|--remember text|--feedback text|--list|--export|--query text|--explain|--recall query|--backup|--redact|--verify|--diff|--restore|--restore-backups [--prune]|--import|--audit [--fix]|--curate|--stats|--usage|--signals [--strict]|--agent-backlog [--strict]|--propose-skills [--min-evidence N] [--review-file path] [--review-check|--apply-plan] [--strict]|--eval-template|--eval [--strict]|--forget id|--clear] [--json|--report|--patch|--review-template] [--out file]",
  );
  assert.equal(
    catalog.topics.find((topic) => topic.topic === "check").usage,
    "design-ai check <artifact.md|--stdin|--examples> [--route id|--all-routes] [--learn]",
  );
  assert.equal(
    catalog.topics.find((topic) => topic.topic === "inspect").usage,
    "design-ai inspect <source.html> --brief text [--name name] [--locale locale] [--viewport name] [--json]",
  );
  assert.equal(
    catalog.topics.find((topic) => topic.topic === "verify-browser").usage,
    "design-ai verify-browser <quality-report.json> --url loopback-url --target-root path --adapter executable --approval-ref text --yes [--json]",
  );
  assert.equal(
    catalog.topics.find((topic) => topic.topic === "workspace").usage,
    "design-ai workspace [--root path] [--learning-file path] [--learning-usage path] [--learning-eval path] [--strict] [--json]",
  );
  assert.equal(
    catalog.topics.find((topic) => topic.topic === "site").usage,
    "design-ai site <workspace.json|--stdin> [--strict] [--json|--mcp-check [--probes]|--mcp-plan [--probes] [--json]|--linked-preview [--json]|--next-actions [--json]|--graph|--tasks|--bundle|--report|--prompts|--prompt id [--task id]] [--out file] | site <bundle-dir> --bundle-check [--json] | site <bundle-dir> --bundle-compare other-bundle-dir [--json] | site <bundle-dir> --bundle-handoff [--task id] [--json] | site <bundle-dir> --bundle-repair [--yes] [--json] [--out file] | site --init --name name [--live-url url] [--repo-url url|--local-path path] [--next-actions] [--out file] | site --init --name name [--live-url url] [--repo-url url|--local-path path] --bundle --out dir | site --from-intake file.md|--stdin [--json|--next-actions [--json]|--tasks|--bundle [--tasks] --out dir] [--out file] | site --intake-template [--language en|ko] [--json] [--out file] | site --sample [--out file] | site --prompt-list [--json]",
  );
  assert.equal(
    catalog.topics.find((topic) => topic.topic === "mcp").usage,
    "design-ai mcp",
  );
  assert.deepEqual(catalog.topics.find((topic) => topic.topic === "search").aliases, ["find"]);
  assert.deepEqual(catalog.topics.find((topic) => topic.topic === "workspace").aliases, ["ws"]);
  assert.deepEqual(catalog.topics.find((topic) => topic.topic === "site").aliases, []);
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
  assert.equal(
    catalog.topics.find((topic) => topic.topic === "site").usage,
    "design-ai site <workspace.json|--stdin> [--strict] [--json|--mcp-check [--probes]|--mcp-plan [--probes] [--json]|--linked-preview [--json]|--next-actions [--json]|--graph|--tasks|--bundle|--report|--prompts|--prompt id [--task id]] [--out file] | site <bundle-dir> --bundle-check [--json] | site <bundle-dir> --bundle-compare other-bundle-dir [--json] | site <bundle-dir> --bundle-handoff [--task id] [--json] | site <bundle-dir> --bundle-repair [--yes] [--json] [--out file] | site --init --name name [--live-url url] [--repo-url url|--local-path path] [--next-actions] [--out file] | site --init --name name [--live-url url] [--repo-url url|--local-path path] --bundle --out dir | site --from-intake file.md|--stdin [--json|--next-actions [--json]|--tasks|--bundle [--tasks] --out dir] [--out file] | site --intake-template [--language en|ko] [--json] [--out file] | site --sample [--out file] | site --prompt-list [--json]",
  );
  assert.equal(
    catalog.topics.find((topic) => topic.topic === "mcp").usage,
    "design-ai mcp",
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
  assert.match(routeOutput, /design-ai route --eval-template \[--json\]/);
  assert.match(routeOutput, /design-ai route --eval --from-file route-eval\.json \[--strict\] \[--json\]/);
  assert.match(routeOutput, /design-ai route --from-file brief\.md \[--limit N\] \[--explain\] \[--json\]/);
  assert.match(routeOutput, /cat brief\.md \| design-ai route --stdin \[--limit N\] \[--explain\] \[--json\]/);
  assert.match(routeOutput, /--eval-template\s+Generate a runnable route eval checkpoint JSON template/);
  assert.match(routeOutput, /--eval\s+Run deterministic route-selection checkpoint cases/);
  assert.doesNotMatch(routeOutput, /Environment overrides:/);

  const promptOutput = await captureStdout(() => runHelp(["prompt"]));
  assert.match(promptOutput, /design-ai prompt <brief> \[--route id\] \[--with-learning\] \[--learning-category kind\] \[--learning-limit N\] \[--with-recall\] \[--recall-limit N\] \[--json\] \[--out file\] \[--force\]/);
  assert.match(promptOutput, /design-ai prompt --eval-template \[--json\] \[--out file\] \[--force\]/);
  assert.match(promptOutput, /design-ai prompt --eval --from-file prompt-eval\.json \[--strict\] \[--json\] \[--out file\] \[--force\]/);
  assert.match(promptOutput, /cat brief\.md \| design-ai prompt --stdin \[--route id\] \[--with-learning\] \[--learning-category kind\] \[--learning-limit N\] \[--with-recall\] \[--recall-limit N\] \[--json\]/);
  assert.match(promptOutput, /--learning-category kind\s+Include only one learning category; requires --with-learning/);
  assert.match(promptOutput, /--learning-limit N\s+Limit included learning entries, 1-100; requires --with-learning/);
  assert.match(promptOutput, /--with-recall\s+Include brief-relevant corpus knowledge files recalled from the shipped design corpus/);
  assert.match(promptOutput, /--recall-limit N\s+Limit recalled corpus knowledge files, 1-20; requires --with-recall/);
  assert.match(promptOutput, /--eval-template\s+Generate a runnable prompt eval checkpoint JSON template/);
  assert.match(promptOutput, /--eval\s+Run deterministic prompt-plan checkpoint cases/);

  const packOutput = await captureStdout(() => runHelp(["pack"]));
  assert.match(packOutput, /design-ai pack <brief> \[--route id\] \[--with-learning\] \[--learning-category kind\] \[--learning-limit N\] \[--with-recall\] \[--recall-limit N\] \[--max-bytes N\] \[--json\] \[--out file\] \[--force\]/);
  assert.match(packOutput, /design-ai pack --eval-template \[--json\] \[--out file\] \[--force\]/);
  assert.match(packOutput, /design-ai pack --eval --from-file pack-eval\.json \[--strict\] \[--json\] \[--out file\] \[--force\]/);
  assert.match(packOutput, /cat brief\.md \| design-ai pack --stdin \[--route id\] \[--with-learning\] \[--learning-category kind\] \[--learning-limit N\] \[--with-recall\] \[--recall-limit N\] \[--max-bytes N\] \[--json\]/);
  assert.match(packOutput, /--learning-category kind\s+Include only one learning category; requires --with-learning/);
  assert.match(packOutput, /--learning-limit N\s+Limit included learning entries, 1-100; requires --with-learning/);
  assert.match(packOutput, /--with-recall\s+Include brief-relevant corpus knowledge files recalled from the shipped design corpus/);
  assert.match(packOutput, /--recall-limit N\s+Limit recalled corpus knowledge files, 1-20; requires --with-recall/);
  assert.match(packOutput, /--eval-template\s+Generate a runnable pack eval checkpoint JSON template/);
  assert.match(packOutput, /--eval\s+Run deterministic prompt-pack checkpoint cases/);

  const learnOutput = await captureStdout(() => runHelp(["learn"]));
  assert.match(learnOutput, /Usage:\s+design-ai learn \[--list\] \[--category kind\] \[--query text\] \[--explain\] \[--limit N\] \[--json\] \[--out file\] \[--force\]/);
  assert.match(learnOutput, /design-ai learn --recall query \[--limit N\] \[--category kind\] \[--json\]/);
  assert.match(learnOutput, /--recall query\s+Read-only combined recall: top corpus knowledge files plus local learning entries ranked for the query/);
  assert.match(learnOutput, /design-ai learn --init \[--yes\|--dry-run\] \[--json\] \[--out file\] \[--force\]/);
  assert.match(learnOutput, /--init\s+Preview or apply starter local learning entries for dogfood use/);
  assert.match(learnOutput, /design-ai learn --feedback text \[--outcome keep\|improve\|avoid\] \[--category kind\] \[--json\] \[--out file\] \[--force\]/);
  assert.match(learnOutput, /design-ai learn --feedback --from-file notes\.md \[--outcome keep\|improve\|avoid\] \[--category kind\] \[--json\] \[--out file\] \[--force\]/);
  assert.match(learnOutput, /cat notes\.md \| design-ai learn --feedback --stdin \[--outcome keep\|improve\|avoid\] \[--category kind\] \[--json\] \[--out file\] \[--force\]/);
  assert.match(learnOutput, /--feedback text\s+Convert outcome feedback into a reusable local learning note/);
  assert.match(learnOutput, /--outcome kind\s+Feedback outcome: keep, improve, avoid\. Default: improve/);
  assert.match(learnOutput, /--query text\s+Filter list\/export output to entries whose category or text matches the query/);
  assert.match(learnOutput, /--explain\s+With --list, include selection score, matched tokens, and reason/);
  assert.match(learnOutput, /design-ai learn --backup \[--json\] \[--out file\] \[--force\]/);
  assert.match(learnOutput, /--backup\s+Print a full portable learning-profile backup; use --json for importable JSON/);
  assert.match(learnOutput, /design-ai learn --redact \[--json\] \[--out file\] \[--force\]/);
  assert.match(learnOutput, /design-ai learn --redact --from-file learning-backup\.json \[--json\] \[--out file\] \[--force\]/);
  assert.match(learnOutput, /cat learning-backup\.json \| design-ai learn --redact --stdin \[--json\] \[--out file\] \[--force\]/);
  assert.match(learnOutput, /--redact\s+Print a portable JSON backup with sensitive-looking text redacted/);
  assert.match(learnOutput, /--from-file file\s+Read remember\/feedback text or import\/verify\/diff\/restore\/redact JSON from a file/);
  assert.match(learnOutput, /--out file\s+Write JSON output to a file, export Markdown for --export, or learning review report Markdown/);
  assert.match(learnOutput, /--force\s+Overwrite an existing --out file, or an existing --backup-file during --restore/);
  assert.match(learnOutput, /design-ai learn --verify --from-file learning\.json \[--json\] \[--out file\] \[--force\]/);
  assert.match(learnOutput, /cat learning\.json \| design-ai learn --verify --stdin \[--json\] \[--out file\] \[--force\]/);
  assert.match(learnOutput, /--verify\s+Validate a portable learning JSON payload without importing it/);
  assert.match(learnOutput, /design-ai learn --import --from-file learning\.json --dry-run \[--json\] \[--out file\] \[--force\]/);
  assert.match(learnOutput, /cat learning\.json \| design-ai learn --import --stdin --yes \[--json\] \[--out file\] \[--force\]/);

  const workspaceOutput = await captureStdout(() => runHelp(["workspace"]));
  assert.match(workspaceOutput, /Usage:\s+design-ai workspace \[--root path\] \[--learning-file path\] \[--learning-usage path\] \[--learning-eval path\] \[--strict\] \[--json\]/);
  assert.match(workspaceOutput, /--learning-file path\s+Inspect a specific learning profile/);
  assert.match(workspaceOutput, /--learning-usage path\s+Include a read-only local learning usage sidecar summary/);
  assert.match(workspaceOutput, /--learning-eval path\s+Include a read-only local learning eval checkpoint summary/);
  assert.match(workspaceOutput, /--strict\s+Exit non-zero when readiness warnings or failures are present/);

  const siteOutput = await captureStdout(() => runHelp(["site"]));
  assert.match(siteOutput, /Usage:\s+design-ai site <workspace\.json> \[--strict\] \[--json\]/);
  assert.match(siteOutput, /cat workspace\.json \| design-ai site --stdin \[--strict\] \[--json\]/);
  assert.match(siteOutput, /design-ai site --from-intake file\.md\|--stdin \[--json\|--next-actions \[--json\]\|--tasks\|--bundle \[--tasks\] --out dir\] \[--out file\] \[--strict\] \[--force\]/);
  assert.match(siteOutput, /design-ai site --intake-template \[--language en\|ko\] \[--json\] \[--out file\] \[--force\]/);
  assert.match(siteOutput, /design-ai site --sample \[--out file\] \[--force\]/);
  assert.match(siteOutput, /design-ai site --prompt-list \[--json\] \[--out file\] \[--force\]/);
  assert.match(siteOutput, /design-ai site <workspace\.json> --mcp-check \[--probes\] \[--strict\] \[--json\] \[--out file\] \[--force\]/);
  assert.match(siteOutput, /design-ai site <workspace\.json> --mcp-plan \[--probes\] \[--strict\] \[--json\] \[--out file\] \[--force\]/);
  assert.match(siteOutput, /design-ai site <workspace\.json> --next-actions \[--json\] \[--out file\] \[--force\]/);
  assert.match(siteOutput, /design-ai site <workspace\.json> --graph \[--json\] \[--out file\] \[--force\]/);
  assert.match(siteOutput, /design-ai site <workspace\.json> --tasks \[--out file\] \[--force\]/);
  assert.match(siteOutput, /design-ai site <workspace\.json> --bundle --out dir \[--strict\] \[--force\]/);
  assert.match(siteOutput, /design-ai site <bundle-dir> --bundle-check \[--strict\] \[--json\] \[--out file\] \[--force\]/);
  assert.match(siteOutput, /design-ai site <bundle-dir> --bundle-compare other-bundle-dir \[--strict\] \[--json\] \[--out file\] \[--force\]/);
  assert.match(siteOutput, /design-ai site <bundle-dir> --bundle-handoff \[--task id-or-number\] \[--strict\] \[--json\] \[--out file\] \[--force\]/);
  assert.match(siteOutput, /design-ai site <bundle-dir> --bundle-repair \[--yes\] \[--strict\] \[--json\] \[--out file\] \[--force\]/);
  assert.match(siteOutput, /design-ai site <workspace\.json> --prompt template-id \[--task id-or-number\] \[--out file\] \[--force\]/);
  assert.match(siteOutput, /--intake-template\s+Emit a blank company website intake Markdown template/);
  assert.match(siteOutput, /--sample\s+Emit a valid sample Website Improvement workspace JSON/);
  assert.match(siteOutput, /--prompt-list\s+List Website Improvement prompt template ids/);
  assert.match(siteOutput, /--mcp-check\s+Check MCP readiness evidence and task\/MCP gaps/);
  assert.match(siteOutput, /--probes\s+Add read-only local URL\/path\/tool-handoff probes/);
  assert.match(siteOutput, /--mcp-plan\s+Generate a Markdown or JSON MCP readiness action plan/);
  assert.match(siteOutput, /--next-actions\s+Generate a prioritized local next-action list/);
  assert.match(siteOutput, /design-ai site website-workspace\.json --mcp-check --probes --json --out mcp-check-probes\.json/);
  assert.match(siteOutput, /design-ai site website-workspace\.json --mcp-plan --probes --json --out mcp-action-plan-probes\.json/);
  assert.match(siteOutput, /design-ai site website-workspace\.json --linked-preview --json --out linked-preview\.json/);
  assert.match(siteOutput, /design-ai site website-workspace\.json --next-actions --json/);
  assert.match(siteOutput, /design-ai site website-workspace\.json --next-actions --out website-next-actions\.md/);
  assert.match(siteOutput, /cat company-website-intake\.ko\.md \| design-ai site --from-intake --stdin --out website-workspace\.json --force/);
  assert.match(siteOutput, /cat company-website-intake\.ko\.md \| design-ai site --from-intake --stdin --next-actions --out website-next-actions\.md --force/);
  assert.match(siteOutput, /design-ai site --from-intake company-website-intake\.ko\.md --tasks --out website-workspace\.tasks\.json/);
  assert.match(siteOutput, /cat company-website-intake\.ko\.md \| design-ai site --from-intake --stdin --tasks --out website-workspace\.tasks\.json --force/);
  assert.match(siteOutput, /cat company-website-intake\.ko\.md \| design-ai site --from-intake --stdin --bundle --tasks --out website-handoff-bundle/);
  assert.match(siteOutput, /--graph\s+Export a portable Website Improvement workflow graph/);
  assert.match(siteOutput, /--tasks\s+Emit workspace JSON with starter refactor tasks generated from audit findings/);
  assert.match(siteOutput, /--bundle\s+Write a complete local handoff bundle directory/);
  assert.match(siteOutput, /--bundle-check\s+Validate a generated handoff bundle directory/);
  assert.match(siteOutput, /--bundle-compare dir\s+Compare two generated handoff bundles/);
  assert.match(siteOutput, /--bundle-handoff\s+Generate a target-repo Codex handoff prompt/);
  assert.match(siteOutput, /--bundle-repair\s+Preview or apply local handoff bundle regeneration/);
  assert.match(siteOutput, /--yes\s+With --bundle-repair, rewrite the handoff bundle directory/);
  assert.match(siteOutput, /--report\s+Generate a Markdown website improvement handoff report/);
  assert.match(siteOutput, /--prompts\s+Generate a Markdown bundle of Codex and Claude prompts/);
  assert.match(siteOutput, /--prompt id Generate one Markdown prompt template/);
  assert.match(siteOutput, /--task id\s+Select a refactor task by id or 1-based top-task number/);
  assert.match(siteOutput, /--out file\s+Write --json, --init, --intake-template, --sample, --prompt-list, --mcp-check, --mcp-plan, --linked-preview, --next-actions, --graph, --tasks, --bundle, --bundle-check, --bundle-compare, --bundle-handoff, --bundle-repair, --report, --prompts, or --prompt output to a file or directory/);
  assert.match(learnOutput, /design-ai learn --diff --from-file learning\.json \[--json\] \[--out file\] \[--force\]/);
  assert.match(learnOutput, /cat learning\.json \| design-ai learn --diff --stdin \[--json\] \[--out file\] \[--force\]/);
  assert.match(learnOutput, /--diff\s+Compare the active profile against a portable learning JSON payload without importing it/);
  assert.match(learnOutput, /design-ai learn --diff --from-file learning-backup\.json --json/);
  assert.match(learnOutput, /design-ai learn --restore --from-file learning-backup\.json \[--dry-run\|--yes\] \[--backup-file path\] \[--json\] \[--out file\] \[--force\]/);
  assert.match(learnOutput, /cat learning-backup\.json \| design-ai learn --restore --stdin \[--dry-run\|--yes\] \[--backup-file path\] \[--json\] \[--out file\] \[--force\]/);
  assert.match(learnOutput, /--restore\s+Preview or apply replacing the active profile with a portable learning JSON payload/);
  assert.match(learnOutput, /design-ai learn --restore-backups \[--limit N\] \[--json\] \[--out file\] \[--force\]/);
  assert.match(learnOutput, /design-ai learn --restore-backups --prune \[--keep N\] \[--dry-run\|--yes\] \[--json\] \[--out file\] \[--force\]/);
  assert.match(learnOutput, /--restore-backups\s+List sibling restore rollback backups for the active learning profile/);
  assert.match(learnOutput, /--prune\s+With --restore-backups, preview or delete older rollback backup files/);
  assert.match(learnOutput, /--keep N\s+With --restore-backups --prune, keep the N newest backups\. Default: 5/);
  assert.match(learnOutput, /--backup-file path\s+With --restore, override the automatic rollback backup file path/);
  assert.match(learnOutput, /design-ai learn --restore --from-file learning-backup\.json --dry-run/);
  assert.match(learnOutput, /design-ai learn --restore --from-file learning-backup\.json --yes --backup-file learning-before-restore\.json/);
  assert.match(learnOutput, /design-ai learn --restore-backups --prune --keep 5/);
  assert.match(learnOutput, /design-ai learn --restore-backups --prune --keep 5 --yes/);
  assert.match(learnOutput, /--import\s+Merge entries from a JSON learning profile or learn --export --json payload/);
  assert.match(learnOutput, /design-ai learn --audit \[--json\] \[--out file\] \[--force\]/);
  assert.match(learnOutput, /design-ai learn --audit --fix --dry-run \[--json\] \[--out file\] \[--force\]/);
  assert.match(learnOutput, /design-ai learn --audit --fix --yes \[--json\] \[--out file\] \[--force\]/);
  assert.match(learnOutput, /design-ai learn --curate \[--dry-run\|--yes\] \[--usage-file path\] \[--json\|--report\] \[--out file\] \[--force\]/);
  assert.match(learnOutput, /--fix\s+With --audit, prepare or apply safe cleanup suggestions/);
  assert.match(learnOutput, /--curate\s+Preview or apply archive-first curation for duplicate\/sensitive entries, plus usage review hints/);
  assert.match(learnOutput, /--report\s+With --curate, --signals, --agent-backlog, or --propose-skills, emit a Markdown review report instead of human console output/);
  assert.match(learnOutput, /--dry-run\s+Preview --init, --import, --restore, --curate, --restore-backups --prune, or --audit --fix without changing files/);
  assert.match(learnOutput, /design-ai learn --init --yes --json/);
  assert.match(learnOutput, /design-ai learn --curate --yes --json/);
  assert.match(learnOutput, /design-ai learn --curate --report --out learning-curation-report\.md/);
  assert.match(learnOutput, /design-ai learn --stats \[--json\] \[--out file\] \[--force\]/);
  assert.match(learnOutput, /--stats\s+Summarize profile counts, recency, and audit status without changing it/);
  assert.match(learnOutput, /design-ai learn --usage \[--limit N\] \[--usage-file path\] \[--json\] \[--out file\] \[--force\]/);
  assert.match(learnOutput, /--usage\s+Summarize prompt\/pack --with-learning usage sidecar events without changing files/);
  assert.match(learnOutput, /design-ai learn --signals \[--from-file signal-file-or-dir\] \[--usage-file path\] \[--strict\] \[--json\|--report\] \[--out file\] \[--force\]/);
  assert.match(learnOutput, /--signals\s+Summarize local learning, usage, eval, check-capture, agent backlog, and workspace readiness signals without changing files/);
  assert.match(learnOutput, /design-ai learn --agent-backlog \[--from-file signal-file-or-dir\] \[--usage-file path\] \[--strict\] \[--json\|--report\] \[--out file\] \[--force\]/);
  assert.match(learnOutput, /--agent-backlog\s+Emit a focused local AI\/agent development backlog from the signal registry without changing files/);
  assert.match(learnOutput, /design-ai learn --propose-skills \[--from-file signal-file-or-dir\] \[--usage-file path\] \[--review-file path\] \[--review-check\|--apply-plan\] \[--min-evidence N\] \[--strict\] \[--json\|--report\|--patch\|--review-template\] \[--out file\] \[--force\]/);
  assert.match(learnOutput, /--propose-skills\s+Preview skill instruction deltas from repeated check-capture learning signals without changing files/);
  assert.match(learnOutput, /--patch\s+With --propose-skills, emit a preview-only unified diff handoff without editing skill files/);
  assert.match(learnOutput, /--review-check\s+With --propose-skills, verify the review file against current proposals without changing files/);
  assert.match(learnOutput, /--apply-plan\s+With --propose-skills, turn accepted review decisions into a read-only manual apply plan/);
  assert.match(learnOutput, /--review-template\s+With --propose-skills, emit a JSON proposal review-file template without changing review decisions/);
  assert.match(learnOutput, /--usage-file path\s+Override the learning usage sidecar path used by --usage, --curate, --signals, --agent-backlog, or --propose-skills/);
  assert.match(learnOutput, /--review-file path\s+With --propose-skills, read proposal review decisions without changing the review file/);
  assert.match(learnOutput, /--min-evidence N\s+With --propose-skills, require N related check-capture entries before emitting a proposal\. Default: 2/);
  assert.match(learnOutput, /design-ai learn --eval-template \[--query text\] \[--category kind\] \[--limit N\] \[--json\] \[--out file\] \[--force\]/);
  assert.match(learnOutput, /--eval-template\s+Generate a runnable learning eval checkpoint from the active profile/);
  assert.match(learnOutput, /design-ai learn --eval --from-file eval\.json \[--category kind\] \[--limit N\] \[--strict\] \[--json\] \[--out file\] \[--force\]/);
  assert.match(learnOutput, /--eval\s+Run deterministic learning-selection checkpoint cases without changing files/);
  assert.match(learnOutput, /--strict\s+With --eval, --signals, --agent-backlog, or --propose-skills, exit non-zero when any checkpoint, signal, backlog, or proposal gate warns or fails/);
  assert.match(learnOutput, /design-ai learn --eval-template --query "keyboard accessibility" --out learning-eval\.json/);
  assert.match(learnOutput, /design-ai learn --eval --from-file learning-eval\.json --strict --json/);
  assert.match(learnOutput, /design-ai learn --signals --from-file \. --json/);
  assert.match(learnOutput, /design-ai learn --signals --from-file \. --report --out learning-signals\.md/);
  assert.match(learnOutput, /design-ai learn --agent-backlog --from-file \. --report --out agent-backlog\.md/);
  assert.match(learnOutput, /design-ai learn --propose-skills --from-file \. --min-evidence 3 --json/);
  assert.match(learnOutput, /design-ai learn --propose-skills --from-file \. --strict --json/);
  assert.match(learnOutput, /design-ai learn --propose-skills --from-file \. --review-file skill-proposals\.review\.json --strict --json/);
  assert.match(learnOutput, /design-ai learn --propose-skills --from-file \. --review-file skill-proposals\.review\.json --review-check --json/);
  assert.match(learnOutput, /design-ai learn --propose-skills --from-file \. --review-file skill-proposals\.review\.json --apply-plan --json/);
  assert.match(learnOutput, /design-ai learn --propose-skills --from-file \. --review-template --out skill-proposals\.review\.json/);
  assert.match(learnOutput, /design-ai learn --propose-skills --from-file \. --report --out skill-proposals\.md/);
  assert.match(learnOutput, /design-ai learn --propose-skills --from-file \. --patch --out skill-proposals\.patch/);
  assert.match(learnOutput, /design-ai learn --list --query "keyboard accessibility" --explain --json/);
  assert.match(learnOutput, /design-ai learn --export --query "pricing page" --limit 3/);
  assert.match(learnOutput, /design-ai learn --forget id-or-number --yes \[--json\] \[--out file\] \[--force\]/);
  assert.match(learnOutput, /design-ai learn --clear --yes \[--json\] \[--out file\] \[--force\]/);
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
