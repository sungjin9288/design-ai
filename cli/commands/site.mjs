// `design-ai site` — validate Website Improvement Console exports and generate handoff artifacts.

import {
  buildSiteHandoffReport,
  buildSiteHandoffBundle,
  buildSiteInitNextActionsReport,
  buildSiteIntakeTemplateMarkdown,
  buildSiteBundleCompareReport,
  buildSiteBundleCheckReport,
  buildSiteBundleHandoffReport,
  buildSiteBundleRepairAppliedReport,
  buildSiteBundleRepairBundle,
  buildSiteBundleRepairPreview,
  buildSiteMcpActionPlan,
  buildSiteMcpActionPlanData,
  buildSiteNextActionsReport,
  buildSiteMcpCheckReport,
  buildSitePrompt,
  buildSitePromptBundle,
  buildSiteReport,
  buildSiteWorkflowGraph,
  analyzeSiteWorkspace,
  createSiteWorkspaceFromInitOptions,
  createSampleSiteWorkspace,
  formatSiteJson,
  formatSiteIntakeTemplateJson,
  formatSiteBundleCompareHuman,
  formatSiteBundleCompareJson,
  formatSiteBundleCheckHuman,
  formatSiteBundleCheckJson,
  formatSiteBundleHandoffHuman,
  formatSiteBundleHandoffJson,
  formatSiteBundleRepairHuman,
  formatSiteBundleRepairJson,
  formatSiteMcpCheckHuman,
  formatSiteMcpCheckJson,
  formatSiteMcpActionPlanJson,
  formatSiteNextActionsHuman,
  formatSiteNextActionsJson,
  formatSitePromptTemplatesHuman,
  formatSitePromptTemplatesJson,
  formatSiteWorkflowGraphJson,
  formatSiteWorkflowGraphMarkdown,
  generateSiteRefactorTasks,
  parseSiteArgs,
} from "../lib/site.mjs";
import { writeOutputFile, writeOutputFiles } from "../lib/output.mjs";
import { dim, error, header, info, success, warn } from "../lib/log.mjs";

function printHelp() {
  console.log("Usage:  design-ai site <workspace.json> [--strict] [--json]");
  console.log("        cat workspace.json | design-ai site --stdin [--strict] [--json]");
  console.log("        design-ai site --init --name name --live-url url [--repo-url url|--local-path path] [--out file] [--force]");
  console.log("        design-ai site --init --name name --live-url url --next-actions [--json] [--out file] [--force]");
  console.log("        design-ai site --init --name name --live-url url --bundle --out dir [--strict] [--force]");
  console.log("        design-ai site --intake-template [--json] [--out file] [--force]");
  console.log("        design-ai site --sample [--out file] [--force]");
  console.log("        design-ai site --prompt-list [--json] [--out file] [--force]");
  console.log("        design-ai site <workspace.json> --mcp-check [--probes] [--strict] [--json] [--out file] [--force]");
  console.log("        design-ai site <workspace.json> --mcp-plan [--probes] [--strict] [--json] [--out file] [--force]");
  console.log("        design-ai site <workspace.json> --next-actions [--json] [--out file] [--force]");
  console.log("        design-ai site <workspace.json> --graph [--json] [--out file] [--force]");
  console.log("        design-ai site <workspace.json> --tasks [--out file] [--force]");
  console.log("        design-ai site <workspace.json> --bundle --out dir [--strict] [--force]");
  console.log("        design-ai site <bundle-dir> --bundle-check [--strict] [--json] [--out file] [--force]");
  console.log("        design-ai site <bundle-dir> --bundle-compare other-bundle-dir [--strict] [--json] [--out file] [--force]");
  console.log("        design-ai site <bundle-dir> --bundle-handoff [--strict] [--json] [--out file] [--force]");
  console.log("        design-ai site <bundle-dir> --bundle-repair [--yes] [--strict] [--json] [--out file] [--force]");
  console.log("        design-ai site <workspace.json> --report [--out file] [--force]");
  console.log("        design-ai site <workspace.json> --prompts [--out file] [--force]");
  console.log("        design-ai site <workspace.json> --prompt template-id [--task id-or-number] [--out file] [--force]\n");
  console.log("Validates Website Improvement Console JSON exports and turns them into local handoff artifacts.\n");
  console.log("Options:");
  console.log("  --stdin     Read workspace JSON from standard input");
  console.log("  --init      Generate a real-project Website Improvement workspace JSON from CLI fields");
  console.log("  --name text Site name for --init");
  console.log("  --live-url url");
  console.log("              Live website URL for --init");
  console.log("  --repo-url url");
  console.log("              Target website repository URL for --init; this repo is not mutated");
  console.log("  --local-path path");
  console.log("              Target website local path for --init; this repo is not mutated");
  console.log("  --figma-url url");
  console.log("              Figma reference URL for --init");
  console.log("  --brand-notes text");
  console.log("              Design system, brand, voice, or constraint notes for --init");
  console.log("  --deploy provider");
  console.log("              Deployment provider for --init: vercel, netlify, cloudflare, other, none");
  console.log("  --sentry project");
  console.log("              Sentry project reference for --init");
  console.log("  --cms kind  CMS for --init: sanity, contentful, wordpress, shopify, none, other");
  console.log("  --database kind");
  console.log("              Database for --init: supabase, neon, postgres, none, other");
  console.log("  --page path Add a priority page for --init; repeatable");
  console.log("  --flow text Add a key user flow for --init; repeatable");
  console.log("  --viewport kind");
  console.log("              Add a viewport for --init: desktop, tablet, mobile; repeatable");
  console.log("  --intake-template");
  console.log("              Emit a blank company website intake Markdown template before --init or --bundle");
  console.log("  --sample    Emit a valid sample Website Improvement workspace JSON");
  console.log("  --prompt-list");
  console.log("              List Website Improvement prompt template ids and intended use");
  console.log("  --mcp-check");
  console.log("              Check MCP readiness evidence and task/MCP gaps without external MCP calls");
  console.log("  --probes");
  console.log("              Add read-only local URL/path/tool-handoff probes to --mcp-check or --mcp-plan; no external writes or MCP calls");
  console.log("  --mcp-plan");
  console.log("              Generate a Markdown or JSON MCP readiness action plan without external MCP calls");
  console.log("  --next-actions");
  console.log("              Generate a prioritized local next-action list from validation, MCP readiness, and refactor tasks; can be combined with --init");
  console.log("  --graph");
  console.log("              Export a portable Website Improvement workflow graph without external MCP calls");
  console.log("  --tasks     Emit workspace JSON with starter refactor tasks generated from audit findings");
  console.log("  --bundle    Write a complete local handoff bundle directory; can be combined with --init");
  console.log("  --bundle-check");
  console.log("              Validate a generated handoff bundle directory, including SHA-256 checksums");
  console.log("  --bundle-compare dir");
  console.log("              Compare two generated handoff bundles by bundle digest, checksums, and summary metadata");
  console.log("  --bundle-handoff");
  console.log("              Generate a target-repo Codex handoff prompt from a validated handoff bundle");
  console.log("  --bundle-repair");
  console.log("              Preview or apply local handoff bundle regeneration from embedded website-workspace.tasks.json");
  console.log("  --yes       With --bundle-repair, rewrite the handoff bundle directory and re-run bundle-check");
  console.log("  --strict    Exit non-zero when validation warnings or failures are present");
  console.log("  --json      Emit a machine-readable validation summary");
  console.log("  --report    Generate a Markdown website improvement handoff report");
  console.log("  --prompts   Generate a Markdown bundle of Codex and Claude prompts");
  console.log("  --prompt id Generate one Markdown prompt template");
  console.log("              id: codex-repo-intake, codex-implementation, codex-visual-qa, codex-deployment, claude-design-review, claude-competitor, claude-copy-ux, handoff-report");
  console.log("  --task id   Select a refactor task by id or 1-based top-task number; requires --prompt codex-implementation");
  console.log("  --out file  Write --json, --init, --intake-template, --sample, --prompt-list, --mcp-check, --mcp-plan, --next-actions, --graph, --tasks, --bundle, --bundle-check, --bundle-compare, --bundle-handoff, --bundle-repair, --report, --prompts, or --prompt output to a file or directory");
  console.log("  --force     Overwrite an existing --out file");
  console.log("");
  console.log("Examples:");
  console.log("  design-ai site --init --name \"Company marketing site\" --live-url https://example.com --repo-url https://github.com/acme/site --page / --page /pricing --flow \"Visitor compares plans and starts signup\" --out website-workspace.json");
  console.log("  design-ai site --init --name \"Company marketing site\" --live-url https://example.com --repo-url https://github.com/acme/site --next-actions --out website-next-actions.md");
  console.log("  design-ai site --init --name \"Company marketing site\" --live-url https://example.com --repo-url https://github.com/acme/site --bundle --out website-handoff-bundle");
  console.log("  design-ai site --intake-template --out company-website-intake.md");
  console.log("  design-ai site --sample --out website-workspace.json");
  console.log("  design-ai site --prompt-list --json");
  console.log("  design-ai site website-workspace.json --mcp-check --json");
  console.log("  design-ai site website-workspace.json --mcp-check --probes --json");
  console.log("  design-ai site website-workspace.json --mcp-check --probes --json --out mcp-check-probes.json");
  console.log("  design-ai site website-workspace.json --mcp-plan --out mcp-action-plan.md");
  console.log("  design-ai site website-workspace.json --mcp-plan --probes --json");
  console.log("  design-ai site website-workspace.json --mcp-plan --probes --json --out mcp-action-plan-probes.json");
  console.log("  design-ai site website-workspace.json --next-actions --json");
  console.log("  design-ai site website-workspace.json --next-actions --out website-next-actions.md");
  console.log("  design-ai site website-workspace.json --graph --json --out website-workflow-graph.json");
  console.log("  design-ai site website-workspace.json --tasks --out website-workspace.tasks.json");
  console.log("  design-ai site website-workspace.json --bundle --out website-handoff-bundle");
  console.log("  design-ai site website-handoff-bundle --bundle-check --json");
  console.log("  design-ai site website-handoff-bundle --bundle-compare website-handoff-bundle.previous --json");
  console.log("  design-ai site website-handoff-bundle --bundle-handoff --out target-repo-prompt.md");
  console.log("  design-ai site website-handoff-bundle --bundle-repair --json");
  console.log("  design-ai site website-handoff-bundle --bundle-repair --json --out bundle-repair-preview.json");
  console.log("  design-ai site website-handoff-bundle --bundle-repair --yes --json");
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
  console.log(`  ${dim("$")} design-ai site ${summary.filePath} --graph --json --out website-workflow-graph.json`);
  console.log(`  ${dim("$")} design-ai site ${summary.filePath} --bundle --out website-handoff-bundle`);
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

  if (parsed.init) {
    const workspace = createSiteWorkspaceFromInitOptions(parsed.initProfile);
    let content = `${JSON.stringify(workspace, null, 2)}\n`;
    let status = "pass";
    if (parsed.bundle) {
      const { summary } = analyzeSiteWorkspace(workspace, { filePath: "website-workspace.json" });
      const bundle = buildSiteHandoffBundle(workspace, summary);
      status = bundle.status;
      const written = writeOutputFiles({
        outPath: parsed.outPath,
        files: bundle.files,
        force: parsed.force,
      });
      success(`Wrote Website Improvement handoff bundle to ${written.directory} (${written.files.length} files)`);
    } else if (parsed.nextActions) {
      const nextActionsReport = buildSiteInitNextActionsReport(workspace, {
        filePath: "website-workspace.json",
        status: "pass",
        issues: [{
          level: "pass",
          id: "workspace-ready",
          message: "Generated init workspace is ready to save before continuing.",
        }],
      });
      status = nextActionsReport.status;
      content = `${parsed.json ? formatSiteNextActionsJson(nextActionsReport) : formatSiteNextActionsHuman(nextActionsReport)}\n`;
    }
    if (parsed.bundle) {
      // Bundle output writes multiple files above.
    } else if (parsed.outPath) {
      const written = writeOutputFile({
        outPath: parsed.outPath,
        content,
        force: parsed.force,
      });
      success(`Wrote ${written}`);
    } else {
      console.log(content.trimEnd());
    }
    if (shouldFail({ status }, parsed.strict)) {
      process.exitCode = 1;
    }
    return;
  }

  if (parsed.intakeTemplate) {
    const content = `${parsed.json ? formatSiteIntakeTemplateJson() : buildSiteIntakeTemplateMarkdown()}\n`;
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

  if (parsed.bundleCheck) {
    const bundleReport = buildSiteBundleCheckReport({
      target: parsed.target,
    });
    const content = `${parsed.json ? formatSiteBundleCheckJson(bundleReport) : formatSiteBundleCheckHuman(bundleReport)}\n`;
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
    if (shouldFail(bundleReport, parsed.strict)) {
      process.exitCode = 1;
    }
    return;
  }

  if (parsed.bundleCompareTarget) {
    const compareReport = buildSiteBundleCompareReport({
      target: parsed.target,
      compareTarget: parsed.bundleCompareTarget,
    });
    const content = `${parsed.json ? formatSiteBundleCompareJson(compareReport) : formatSiteBundleCompareHuman(compareReport)}\n`;
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
    if (shouldFail(compareReport, parsed.strict)) {
      process.exitCode = 1;
    }
    return;
  }

  if (parsed.bundleHandoff) {
    const handoffReport = buildSiteBundleHandoffReport({
      target: parsed.target,
    });
    const content = `${parsed.json ? formatSiteBundleHandoffJson(handoffReport) : formatSiteBundleHandoffHuman(handoffReport)}\n`;
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
    if (shouldFail(handoffReport, parsed.strict)) {
      process.exitCode = 1;
    }
    return;
  }

  if (parsed.bundleRepair) {
    let repairReport;
    if (parsed.yes) {
      const repair = buildSiteBundleRepairBundle({
        target: parsed.target,
      });
      if (!repair.bundle) {
        repairReport = repair.preview;
      } else {
        const written = writeOutputFiles({
          outPath: repair.preview.directory,
          files: repair.bundle.files,
          force: true,
        });
        repairReport = buildSiteBundleRepairAppliedReport({
          beforeReport: repair.beforeReport,
          written,
        });
      }
    } else {
      repairReport = buildSiteBundleRepairPreview({
        target: parsed.target,
      });
    }
    const content = `${parsed.json ? formatSiteBundleRepairJson(repairReport) : formatSiteBundleRepairHuman(repairReport)}\n`;
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
    if (shouldFail(repairReport, parsed.strict)) {
      process.exitCode = 1;
    }
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
    const mcpReport = buildSiteMcpCheckReport(workspace, summary, { probes: parsed.probes });
    status = mcpReport.status;
    content = `${parsed.json ? formatSiteMcpCheckJson(mcpReport) : formatSiteMcpCheckHuman(mcpReport)}\n`;
  } else if (parsed.mcpPlan) {
    const mcpPlan = buildSiteMcpActionPlanData(workspace, summary, { probes: parsed.probes });
    status = mcpPlan.status;
    content = `${parsed.json ? formatSiteMcpActionPlanJson(mcpPlan) : buildSiteMcpActionPlan(workspace, summary, { probes: parsed.probes })}\n`;
  } else if (parsed.nextActions) {
    const nextActionsReport = buildSiteNextActionsReport(workspace, summary);
    status = nextActionsReport.status;
    content = `${parsed.json ? formatSiteNextActionsJson(nextActionsReport) : formatSiteNextActionsHuman(nextActionsReport)}\n`;
  } else if (parsed.graph) {
    const graph = buildSiteWorkflowGraph(workspace, summary);
    status = graph.status;
    content = `${parsed.json ? formatSiteWorkflowGraphJson(graph) : formatSiteWorkflowGraphMarkdown(graph)}\n`;
  } else if (parsed.report) {
    content = `${buildSiteHandoffReport(workspace)}\n`;
  } else if (parsed.prompts) {
    content = `${buildSitePromptBundle(workspace)}\n`;
  } else if (parsed.promptTemplate) {
    content = `${buildSitePrompt(workspace, parsed.promptTemplate, { taskSelector: parsed.taskSelector })}\n`;
  } else if (parsed.tasks) {
    content = `${JSON.stringify(generateSiteRefactorTasks(workspace).workspace, null, 2)}\n`;
  } else if (parsed.bundle) {
    const bundle = buildSiteHandoffBundle(workspace, summary);
    status = bundle.status;
    const written = writeOutputFiles({
      outPath: parsed.outPath,
      files: bundle.files,
      force: parsed.force,
    });
    success(`Wrote Website Improvement handoff bundle to ${written.directory} (${written.files.length} files)`);
  } else if (parsed.json) {
    content = `${formatSiteJson(summary)}\n`;
  }

  if (parsed.bundle) {
    // Bundle output writes multiple files above.
  } else if (parsed.outPath) {
    const written = writeOutputFile({
      outPath: parsed.outPath,
      content,
      force: parsed.force,
    });
    success(`Wrote ${written}`);
  } else if (parsed.mcpCheck || parsed.mcpPlan || parsed.nextActions || parsed.graph || parsed.report || parsed.prompts || parsed.promptTemplate || parsed.tasks || parsed.json) {
    console.log(content.trimEnd());
  } else {
    printHumanSummary(summary);
  }

  if (shouldFail({ ...summary, status }, parsed.strict)) {
    process.exitCode = 1;
  }
}
