// `design-ai site` — validate Website Improvement Console exports and generate handoff artifacts.

import {
  buildSiteHandoffReport,
  buildSiteMcpActionPlan,
  buildSiteMcpCheckReport,
  buildSitePrompt,
  buildSitePromptBundle,
  buildSiteReport,
  createSampleSiteWorkspace,
  formatSiteJson,
  formatSiteMcpCheckHuman,
  formatSiteMcpCheckJson,
  formatSitePromptTemplatesHuman,
  formatSitePromptTemplatesJson,
  generateSiteRefactorTasks,
  parseSiteArgs,
} from "../lib/site.mjs";
import { writeOutputFile } from "../lib/output.mjs";
import { dim, error, header, info, success, warn } from "../lib/log.mjs";

function printHelp() {
  console.log("Usage:  design-ai site <workspace.json> [--strict] [--json]");
  console.log("        cat workspace.json | design-ai site --stdin [--strict] [--json]");
  console.log("        design-ai site --sample [--out file] [--force]");
  console.log("        design-ai site --prompt-list [--json] [--out file] [--force]");
  console.log("        design-ai site <workspace.json> --mcp-check [--strict] [--json] [--out file] [--force]");
  console.log("        design-ai site <workspace.json> --mcp-plan [--strict] [--out file] [--force]");
  console.log("        design-ai site <workspace.json> --tasks [--out file] [--force]");
  console.log("        design-ai site <workspace.json> --report [--out file] [--force]");
  console.log("        design-ai site <workspace.json> --prompts [--out file] [--force]");
  console.log("        design-ai site <workspace.json> --prompt template-id [--task id-or-number] [--out file] [--force]\n");
  console.log("Validates Website Improvement Console JSON exports and turns them into local handoff artifacts.\n");
  console.log("Options:");
  console.log("  --stdin     Read workspace JSON from standard input");
  console.log("  --sample    Emit a valid sample Website Improvement workspace JSON");
  console.log("  --prompt-list");
  console.log("              List Website Improvement prompt template ids and intended use");
  console.log("  --mcp-check");
  console.log("              Check MCP readiness evidence and task/MCP gaps without external MCP calls");
  console.log("  --mcp-plan");
  console.log("              Generate a Markdown MCP readiness action plan without external MCP calls");
  console.log("  --tasks     Emit workspace JSON with starter refactor tasks generated from audit findings");
  console.log("  --strict    Exit non-zero when validation warnings or failures are present");
  console.log("  --json      Emit a machine-readable validation summary");
  console.log("  --report    Generate a Markdown website improvement handoff report");
  console.log("  --prompts   Generate a Markdown bundle of Codex and Claude prompts");
  console.log("  --prompt id Generate one Markdown prompt template");
  console.log("              id: codex-repo-intake, codex-implementation, codex-visual-qa, codex-deployment, claude-design-review, claude-competitor, claude-copy-ux, handoff-report");
  console.log("  --task id   Select a refactor task by id or 1-based top-task number; requires --prompt codex-implementation");
  console.log("  --out file  Write --json, --sample, --prompt-list, --mcp-check, --mcp-plan, --tasks, --report, --prompts, or --prompt output to a file");
  console.log("  --force     Overwrite an existing --out file");
  console.log("");
  console.log("Examples:");
  console.log("  design-ai site --sample --out website-workspace.json");
  console.log("  design-ai site --prompt-list --json");
  console.log("  design-ai site website-workspace.json --mcp-check --json");
  console.log("  design-ai site website-workspace.json --mcp-plan --out mcp-action-plan.md");
  console.log("  design-ai site website-workspace.json --tasks --out website-workspace.tasks.json");
  console.log("  design-ai site website-workspace.json --json");
  console.log("  design-ai site website-workspace.json --report --out handoff.md");
  console.log("  design-ai site website-workspace.json --prompts --out prompts.md");
  console.log("  design-ai site website-workspace.json --prompt codex-implementation --out codex-implementation.md");
  console.log("  design-ai site website-workspace.json --prompt codex-implementation --task task-accessibility --out task-accessibility.md");
}

function printIssue(issue) {
  const line = `${issue.id}: ${issue.message}`;
  if (issue.level === "pass") {
    success(line);
  } else if (issue.level === "warn") {
    warn(line);
  } else {
    error(line);
  }
}

function printHumanSummary(summary) {
  header("design-ai site", summary.site.name);
  info(`File: ${summary.filePath}`);
  info(`Status: ${summary.status}`);
  info(`Live URL: ${summary.site.liveUrl || "not provided"}`);
  info(`Repo: ${summary.site.repoUrl || summary.site.localPath || "not provided"}`);
  info(`Pages: ${summary.counts.pages} | flows: ${summary.counts.userFlows} | viewports: ${summary.site.viewports.join(", ")}`);
  info(`Audit: ${summary.counts.auditFindings} finding(s), ${summary.auditStatusCounts.done}/${summary.counts.auditCategories} done`);
  info(`Tasks: ${summary.counts.refactorTasks} | Required MCP: ${summary.requiredMcp.join(", ") || "none"}`);

  console.log("\nValidation:");
  for (const issue of summary.issues) {
    printIssue(issue);
  }

  console.log("\nTop tasks:");
  if (summary.topTasks.length === 0) {
    console.log(dim("No refactor tasks yet. Generate them in the Website Improvement Console."));
  } else {
    for (const [index, task] of summary.topTasks.entries()) {
      console.log(`${index + 1}. [${task.priority}] ${task.title} ${dim(`(${task.id}; ${task.category}, impact ${task.impact}, effort ${task.effort})`)}`);
    }
  }

  console.log("\nNext:");
  console.log(`  ${dim("$")} design-ai site ${summary.filePath} --report --out website-handoff.md`);
  console.log(`  ${dim("$")} design-ai site ${summary.filePath} --prompts --out website-prompts.md`);
  console.log(`  ${dim("$")} design-ai site ${summary.filePath} --prompt codex-implementation --task 1 --out codex-implementation.md`);
  console.log(`  ${dim("$")} design-ai site ${summary.filePath} --mcp-check --json`);
  console.log(`  ${dim("$")} design-ai site ${summary.filePath} --mcp-plan --out mcp-action-plan.md`);
}

function shouldFail(summary, strict) {
  if (summary.status === "fail") return true;
  if (strict && summary.status !== "pass") return true;
  return false;
}

export async function runSite(args) {
  const parsed = parseSiteArgs(args);
  if (parsed.help) {
    printHelp();
    return;
  }

  if (parsed.sample) {
    const content = `${JSON.stringify(createSampleSiteWorkspace(), null, 2)}\n`;
    if (parsed.outPath) {
      const written = writeOutputFile({
        outPath: parsed.outPath,
        content,
        force: parsed.force,
      });
      success(`Wrote ${written}`);
    } else {
      console.log(content.trimEnd());
    }
    return;
  }

  if (parsed.promptList) {
    const content = `${parsed.json ? formatSitePromptTemplatesJson() : formatSitePromptTemplatesHuman()}\n`;
    if (parsed.outPath) {
      const written = writeOutputFile({
        outPath: parsed.outPath,
        content,
        force: parsed.force,
      });
      success(`Wrote ${written}`);
    } else {
      console.log(content.trimEnd());
    }
    return;
  }

  if (!parsed.target && !parsed.stdin) {
    printHelp();
    process.exitCode = 1;
    return;
  }

  const report = buildSiteReport({
    target: parsed.target,
    stdin: parsed.stdin,
  });
  const { workspace, summary } = report;

  let content = "";
  let status = summary.status;
  if (parsed.mcpCheck) {
    const mcpReport = buildSiteMcpCheckReport(workspace, summary);
    status = mcpReport.status;
    content = `${parsed.json ? formatSiteMcpCheckJson(mcpReport) : formatSiteMcpCheckHuman(mcpReport)}\n`;
  } else if (parsed.mcpPlan) {
    const mcpReport = buildSiteMcpCheckReport(workspace, summary);
    status = mcpReport.status;
    content = `${buildSiteMcpActionPlan(workspace, summary)}\n`;
  } else if (parsed.report) {
    content = `${buildSiteHandoffReport(workspace)}\n`;
  } else if (parsed.prompts) {
    content = `${buildSitePromptBundle(workspace)}\n`;
  } else if (parsed.promptTemplate) {
    content = `${buildSitePrompt(workspace, parsed.promptTemplate, { taskSelector: parsed.taskSelector })}\n`;
  } else if (parsed.tasks) {
    content = `${JSON.stringify(generateSiteRefactorTasks(workspace).workspace, null, 2)}\n`;
  } else if (parsed.json) {
    content = `${formatSiteJson(summary)}\n`;
  }

  if (parsed.outPath) {
    const written = writeOutputFile({
      outPath: parsed.outPath,
      content,
      force: parsed.force,
    });
    success(`Wrote ${written}`);
  } else if (parsed.mcpCheck || parsed.mcpPlan || parsed.report || parsed.prompts || parsed.promptTemplate || parsed.tasks || parsed.json) {
    console.log(content.trimEnd());
  } else {
    printHumanSummary(summary);
  }

  if (shouldFail({ ...summary, status }, parsed.strict)) {
    process.exitCode = 1;
  }
}
