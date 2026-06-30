// Prompt and handoff report builders for Website Improvement workspaces.

import { normalizeImplementationEvidence } from "./site-evidence.mjs";
import { SITE_PROMPT_TEMPLATE_IDS, SITE_PROMPT_TEMPLATES } from "./site-content.mjs";
import { AUDIT_CATEGORIES, MCP_ITEMS, PRIORITY_OPTIONS, categoryById } from "./site-options.mjs";
import { markdownList } from "./site-strings.mjs";

export function profileBlock(workspace) {
  const profile = workspace.siteProfile;
  return [
    "Site profile:",
    `- Name: ${profile.name}`,
    `- Live URL: ${profile.liveUrl || "not provided"}`,
    `- Repo URL: ${profile.repoUrl || "not provided"}`,
    `- Local path: ${profile.localPath || "not provided"}`,
    `- Figma URL: ${profile.figmaUrl || "not provided"}`,
    `- Deploy: ${profile.deployProvider}`,
    `- Sentry: ${profile.sentryProject || "not provided"}`,
    `- CMS: ${profile.cms}`,
    `- Database: ${profile.database}`,
    `- Viewports: ${profile.viewports.join(", ")}`,
    "",
    "Priority pages:",
    markdownList(profile.pages, "No pages listed"),
    "",
    "User flows:",
    markdownList(profile.userFlows, "No user flows listed"),
    "",
    "Brand/design notes:",
    profile.brandNotes || "No brand notes provided.",
  ].join("\n");
}

function auditBlock(workspace) {
  return AUDIT_CATEGORIES.map((category) => {
    const row = workspace.auditChecklist[category.id];
    return [
      `- ${category.label} [${row.status}]`,
      `  Notes: ${row.notes || "none"}`,
      `  Findings: ${row.findings.length ? row.findings.join("; ") : "none"}`,
    ].join("\n");
  }).join("\n");
}

export function mcpBlock(workspace) {
  return MCP_ITEMS.map(([key, label]) => `- ${label}: ${workspace.mcpReadiness[key]}`).join("\n");
}

function taskBlock(task) {
  if (!task) return "No refactor task selected. Use the Refactor Plan section first.";
  return [
    "Selected task:",
    `- Task ID: ${task.id}`,
    `- Title: ${task.title}`,
    `- Category: ${categoryById(task.category).label}`,
    `- Problem: ${task.problem}`,
    `- Evidence: ${task.evidence || "not provided"}`,
    `- Impact: ${task.impact}`,
    `- Effort: ${task.effort}`,
    `- Priority: ${task.priority}`,
    `- Pages: ${task.pages.join(", ") || "not specified"}`,
    `- Recommended MCP: ${task.recommendedMcp.join(", ") || "none"}`,
    "",
    "Verification:",
    markdownList(task.verification, "Run target repo verification"),
    "",
    "Risks:",
    markdownList(task.risks, "No risks listed"),
  ].join("\n");
}

function primaryTask(workspace) {
  return orderedRefactorTasks(workspace)[0] || null;
}

export function orderedRefactorTasks(workspace) {
  return workspace.refactorTasks
    .map((task, index) => ({ task, index }))
    .sort((a, b) => {
      const priorityDelta = PRIORITY_OPTIONS.indexOf(a.task.priority) - PRIORITY_OPTIONS.indexOf(b.task.priority);
      if (priorityDelta !== 0) return priorityDelta;
      return a.index - b.index;
    })
    .map((item) => item.task);
}

export function resolveSitePromptTask(workspace, selector = "") {
  const tasks = orderedRefactorTasks(workspace);
  const trimmed = String(selector || "").trim();
  if (!trimmed) return primaryTask(workspace);

  const byId = workspace.refactorTasks.find((task) => task.id === trimmed);
  if (byId) return byId;

  if (/^[1-9]\d*$/.test(trimmed)) {
    const index = Number.parseInt(trimmed, 10) - 1;
    if (tasks[index]) return tasks[index];
  }

  const ids = tasks.map((task, index) => `${index + 1}:${task.id}`).join(", ");
  throw new Error(`Unknown refactor task: ${trimmed}. Use one of: ${ids || "no tasks available"}`);
}

export function buildSitePrompt(workspace, templateId, { taskSelector = "" } = {}) {
  const profile = profileBlock(workspace);
  const audit = auditBlock(workspace);
  const mcp = mcpBlock(workspace);
  const task = taskBlock(resolveSitePromptTask(workspace, taskSelector));
  const commonRules = [
    "Rules:",
    "- Work in the target website repository, not in this design-ai repository.",
    "- Inspect existing architecture, components, state, styling, and design tokens before editing.",
    "- Keep changes scoped and avoid new dependencies unless clearly justified.",
    "- Preserve accessibility: keyboard reachability, visible focus, semantic HTML, screen-reader labels, and WCAG 2.1 AA contrast.",
    "- Verify desktop, tablet, and mobile layouts.",
  ].join("\n");

  const map = {
    "codex-repo-intake": [
      "# Codex repo intake prompt",
      profile,
      "",
      "Goal: inspect the target website repo and produce a concise implementation plan for website improvement work.",
      "",
      commonRules,
      "",
      "Read first:",
      "- package/dependency manifest",
      "- app/router entrypoints",
      "- layout and design system primitives",
      "- styling/token setup",
      "- test/build scripts",
      "",
      "Return: repo structure, routing, reusable components, state/data model, likely touch points, risks, and exact verification commands.",
    ],
    "codex-implementation": [
      "# Codex implementation prompt",
      profile,
      "",
      task,
      "",
      commonRules,
      "",
      "Implement the smallest safe fix. After editing, run the target repo's most relevant lint/typecheck/build/test command and summarize changed files plus verification.",
    ],
    "codex-visual-qa": [
      "# Codex visual QA prompt",
      profile,
      "",
      "Audit checklist state:",
      audit,
      "",
      `Use Browser/Playwright if available. Verify the priority pages across ${workspace.siteProfile.viewports.join(", ")}. Check layout, typography, CTA hierarchy, forms, focus indicators, console errors, and broken assets.`,
    ],
    "codex-deployment": [
      "# Codex deployment verification prompt",
      profile,
      "",
      "MCP readiness:",
      mcp,
      "",
      "Verify the deployment or preview URL, runtime logs, environment assumptions, SEO metadata, and major user flows. Report pass/fail evidence and remaining launch risks.",
    ],
    "claude-design-review": [
      "# Claude design review prompt",
      profile,
      "",
      "Review the live site or screenshots as a senior product designer. Focus on visual hierarchy, layout rhythm, typography, color, spacing, CTA clarity, responsive behavior, and accessibility concerns. Provide one best path and cite concrete evidence.",
    ],
    "claude-competitor": [
      "# Claude competitor research prompt",
      profile,
      "",
      "Research 3-5 relevant competitors or peer websites. Compare homepage structure, conversion path, proof points, pricing presentation, visual tone, content clarity, and SEO positioning. Return a concise opportunity map, not a generic benchmark.",
    ],
    "claude-copy-ux": [
      "# Claude copy/UX critique prompt",
      profile,
      "",
      "Critique the site's copy, information architecture, trust signals, CTA language, and conversion flow. Rewrite only the highest-impact sections and explain why the edits reduce user uncertainty.",
    ],
    "handoff-report": [
      "# Final handoff report prompt",
      profile,
      "",
      "Refactor plan:",
      workspace.refactorTasks.map((item) => `- [${item.priority}] ${item.title}: ${item.problem}`).join("\n") || "- No tasks listed",
      "",
      "Create a final handoff report with target site info, audit summary, priority recommendations, executed work, verification results, remaining risks, and next actions.",
    ],
  };

  return (map[templateId] || map["codex-repo-intake"]).join("\n");
}

export function buildSitePromptBundle(workspace) {
  return [
    `# Website improvement prompt bundle: ${workspace.siteProfile.name}`,
    "",
    "> Generated by design-ai site from a Website Improvement Console workspace export.",
    "",
    ...SITE_PROMPT_TEMPLATE_IDS.flatMap((templateId) => [
      `## ${templateId}`,
      "",
      buildSitePrompt(workspace, templateId),
      "",
    ]),
  ].join("\n").trimEnd();
}

export function buildSiteBundleImplementationPrompt(workspace) {
  const tasks = orderedRefactorTasks(workspace);
  if (tasks.length > 0) {
    return buildSitePrompt(workspace, "codex-implementation", { taskSelector: "1" });
  }

  return [
    "# Codex implementation prompt",
    profileBlock(workspace),
    "",
    mcpBlock(workspace),
    "",
    "Task ID: no-refactor-task-yet",
    "Goal: inspect the target website repository, confirm the website improvement workspace facts, and produce concrete audit findings before implementation starts.",
    "",
    "Rules:",
    "- Work in the target website repository, not in this design-ai repository.",
    "- Do not modify production code until you identify specific audit findings and implementation tasks.",
    "- Inspect existing architecture, components, state, styling, and design tokens before proposing edits.",
    "- Preserve accessibility: keyboard reachability, visible focus, semantic HTML, screen-reader labels, and WCAG 2.1 AA contrast.",
    "- Verify desktop, tablet, and mobile layouts before recommending implementation scope.",
    "",
    "Next step:",
    "- Add audit findings to the Website Improvement workspace, then run `design-ai site website-workspace.json --tasks --out website-workspace.tasks.json` and regenerate this implementation prompt with `design-ai site website-workspace.tasks.json --prompt codex-implementation --task 1 --out codex-implementation.md`.",
  ].join("\n");
}

export function formatSitePromptTemplatesJson() {
  return JSON.stringify({
    count: SITE_PROMPT_TEMPLATES.length,
    templates: SITE_PROMPT_TEMPLATES,
  }, null, 2);
}

export function formatSitePromptTemplatesHuman() {
  return [
    "Website Improvement prompt templates",
    "",
    ...SITE_PROMPT_TEMPLATES.flatMap((template, index) => [
      `${index + 1}. ${template.id}`,
      `   Label: ${template.label}`,
      `   Agent: ${template.agent}`,
      `   Output: ${template.output}`,
      `   Task selectable: ${template.taskSelectable ? "yes" : "no"}`,
      `   ${template.description}`,
    ]),
    "",
    "Use:",
    "  design-ai site <workspace.json> --prompt <template-id>",
    "  design-ai site <workspace.json> --prompt codex-implementation --task <id-or-number>",
  ].join("\n");
}

export function buildSiteHandoffReport(workspace) {
  const profile = workspace.siteProfile;
  const tasks = workspace.refactorTasks;
  const evidence = normalizeImplementationEvidence(workspace.implementationEvidence);
  return [
    `# Website improvement handoff: ${profile.name}`,
    "",
    "> Generated by design-ai site from a Website Improvement Console workspace export.",
    "",
    "## Target site",
    "",
    `- Live URL: ${profile.liveUrl || "not provided"}`,
    `- Repo URL: ${profile.repoUrl || "not provided"}`,
    `- Local path: ${profile.localPath || "not provided"}`,
    `- Figma URL: ${profile.figmaUrl || "not provided"}`,
    `- Deploy provider: ${profile.deployProvider}`,
    `- CMS: ${profile.cms}`,
    `- Database: ${profile.database}`,
    `- Viewports: ${profile.viewports.join(", ")}`,
    "",
    "## Diagnostic summary",
    "",
    auditBlock(workspace),
    "",
    "## MCP Readiness",
    "",
    mcpBlock(workspace),
    "",
    "## Priority improvement plan",
    "",
    tasks.length ? tasks.map((task) => [
      `### [${task.priority.toUpperCase()}] ${task.title}`,
      "",
      `- Category: ${categoryById(task.category).label}`,
      `- Impact: ${task.impact}`,
      `- Effort: ${task.effort}`,
      `- Pages: ${task.pages.join(", ") || "not specified"}`,
      `- MCP: ${task.recommendedMcp.join(", ") || "none"}`,
      `- Problem: ${task.problem}`,
      `- Evidence: ${task.evidence || "not provided"}`,
      "",
      "Verification:",
      markdownList(task.verification, "Run target repo verification"),
      "",
      "Risks:",
      markdownList(task.risks, "No risks listed"),
    ].join("\n")).join("\n\n") : "No refactor tasks generated yet.",
    "",
    "## Executed work",
    "",
    markdownList(evidence.executedWork, "Not recorded yet. Add implementation notes after running Codex in the target repo."),
    "",
    "## Verification results",
    "",
    markdownList(evidence.verificationResults, "Not recorded yet. Paste target repo lint/typecheck/build, Browser QA, and deployment checks here."),
    "",
    "## Remaining risks",
    "",
    markdownList(evidence.remainingRisks, "No remaining risks recorded."),
    "",
    "## Next actions",
    "",
    markdownList(evidence.nextActions, "No next actions recorded."),
    "",
    "## Notes",
    "",
    workspace.reportNotes || "No notes recorded.",
  ].join("\n");
}
