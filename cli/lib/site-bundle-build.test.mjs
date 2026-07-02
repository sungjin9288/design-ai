// Tests for site workflow graph and handoff bundle build.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  analyzeSiteWorkspace,
  buildSiteHandoffBundle,
  buildSiteWorkflowGraph,
  createSampleSiteWorkspace,
  formatSiteWorkflowGraphJson,
  formatSiteWorkflowGraphMarkdown,
} from "./site.mjs";

test("buildSiteWorkflowGraph exports a deterministic portable workflow graph", () => {
  const workspace = createSampleSiteWorkspace();
  const { summary } = analyzeSiteWorkspace(workspace, { filePath: "sample.json" });
  const graph = buildSiteWorkflowGraph(workspace, summary);
  const duplicateGraph = buildSiteWorkflowGraph(workspace, summary);
  const json = JSON.parse(formatSiteWorkflowGraphJson(graph));
  const markdown = formatSiteWorkflowGraphMarkdown(graph);

  assert.deepEqual(graph, duplicateGraph);
  assert.deepEqual(Object.keys(json), [
    "version",
    "kind",
    "generatedAt",
    "filePath",
    "status",
    "workspaceStatus",
    "mcpStatus",
    "externalCalls",
    "site",
    "summary",
    "nodes",
    "edges",
    "boundaries",
  ]);
  assert.equal(graph.kind, "website-improvement-workflow-graph");
  assert.equal(graph.status, "pass");
  assert.equal(graph.externalCalls, false);
  assert.equal(graph.summary.nodeCount, 35);
  assert.equal(graph.summary.edgeCount, 67);
  assert.equal(graph.summary.taskCount, 3);
  assert.equal(graph.summary.generatedTaskCount, 2);
  assert.equal(graph.summary.promptTemplateCount, 8);
  assert.deepEqual(graph.nodes.map((node) => node.id).slice(0, 4), [
    "workspace:intake",
    "profile:sample-korean-saas",
    "audit:visual-design",
    "audit:ux-flow",
  ]);
  assert.ok(graph.nodes.some((node) => node.id === "task:task-accessibility" && node.type === "refactor-task"));
  assert.ok(graph.nodes.some((node) => node.id === "prompt:codex-implementation" && node.type === "prompt-template"));
  assert.ok(graph.nodes.some((node) => node.id === "handoff:target-repo" && node.status === "external"));
  assert.ok(graph.edges.some((edge) => edge.from === "task:task-homepage-cta" && edge.to === "prompt:codex-implementation"));
  assert.ok(graph.edges.some((edge) => edge.from === "handoff:bundle" && edge.to === "handoff:target-repo"));
  assert.deepEqual(graph.boundaries, [
    "deterministic-local",
    "no-external-mcp-calls",
    "no-target-repo-mutation",
    "no-new-dependencies",
  ]);

  assert.match(markdown, /# Website improvement workflow graph: Korean SaaS marketing site/);
  assert.match(markdown, /Nodes: 35/);
  assert.match(markdown, /Edges: 67/);
  assert.match(markdown, /No external MCP calls are made/);
});

test("buildSiteHandoffBundle creates a complete deterministic handoff package", () => {
  const workspace = createSampleSiteWorkspace();
  const { summary } = analyzeSiteWorkspace(workspace, { filePath: "stdin" });
  const bundle = buildSiteHandoffBundle(workspace, summary);
  const duplicateBundle = buildSiteHandoffBundle(workspace, summary);
  const files = Object.fromEntries(bundle.files.map((file) => [file.path, file.content]));

  assert.equal(bundle.status, "pass");
  assert.deepEqual(
    Object.fromEntries(duplicateBundle.files.map((file) => [file.path, file.content])),
    files,
  );
  assert.deepEqual(Object.keys(files), [
    "README.md",
    "summary.json",
    "website-workspace.tasks.json",
    "mcp-check.json",
    "mcp-probes.json",
    "mcp-action-plan.md",
    "website-handoff.md",
    "website-prompts.md",
    "codex-implementation.md",
  ]);
  assert.match(files["README.md"], /Website improvement handoff bundle/);
  assert.match(files["README.md"], /does not call external MCPs/);
  assert.match(files["README.md"], /MCP probes: 4\/4 passing/);
  assert.match(files["README.md"], /Strict-ready: yes/);
  assert.match(files["README.md"], /Recommended command: `design-ai site <bundle-dir> --bundle-handoff --strict --out target-repo-handoff\.md`/);
  assert.match(files["README.md"], /Target Repo Execution Checklist/);
  assert.match(files["README.md"], /Confirm target repo working directory/);
  assert.match(files["mcp-probes.json"], /"mode": "read-only-local"/);
  assert.match(files["mcp-probes.json"], /"externalCalls": false/);
  assert.match(files["mcp-action-plan.md"], /Website improvement MCP action plan/);
  assert.match(files["website-handoff.md"], /Website improvement handoff/);
  assert.match(files["website-prompts.md"], /Website improvement prompt bundle/);
  assert.match(files["codex-implementation.md"], /# Codex implementation prompt/);

  const summaryPayload = JSON.parse(files["summary.json"]);
  assert.equal(summaryPayload.status, "pass");
  assert.equal(summaryPayload.generatedAt, workspace.updatedAt);
  assert.deepEqual(summaryPayload.handoff, {
    strictReady: true,
    readiness: "ready-for-strict-handoff",
    recommendedCommand: "design-ai site <bundle-dir> --bundle-handoff --strict --out target-repo-handoff.md",
    strictCommand: "design-ai site <bundle-dir> --bundle-handoff --strict --out target-repo-handoff.md",
    draftCommand: "design-ai site <bundle-dir> --bundle-handoff --out target-repo-handoff.md",
    verifyCommand: "design-ai site <bundle-dir> --bundle-check --strict --json",
    note: "Use the strict handoff command before target-repo implementation.",
    executionChecklist: [
      {
        id: "confirm-target-repo",
        label: "Confirm target repo working directory",
        required: true,
        evidence: "State the target repo path and confirm it is not the design-ai repo before editing.",
      },
      {
        id: "inspect-architecture",
        label: "Inspect existing architecture and design system",
        required: true,
        evidence: "Name the routing, component, styling, token, and test/build surfaces inspected before implementation.",
      },
      {
        id: "apply-focused-task",
        label: "Apply one focused Website Improvement task",
        required: true,
        evidence: "Identify the completed task id/title, changed files, and why the scope stayed limited.",
      },
      {
        id: "verify-quality-gates",
        label: "Run target repo quality gates",
        required: true,
        evidence: "Record lint/typecheck/build/test results plus browser, viewport, accessibility, and deployment checks that were available.",
      },
      {
        id: "record-handoff-evidence",
        label: "Record implementation evidence and remaining risks",
        required: true,
        evidence: "Return executed work, verification results, remaining risks, next actions, and the bundle digest used.",
      },
    ],
  });
  assert.equal(summaryPayload.taskGeneration.totalTasks, 3);
  assert.equal(summaryPayload.taskGeneration.createdCount, 2);
  assert.equal(summaryPayload.mcp.probeStatus, "pass");
  assert.deepEqual(summaryPayload.mcp.probeCounts, {
    count: 4,
    pass: 4,
    warn: 0,
    fail: 0,
  });
  assert.deepEqual(summaryPayload.files, Object.keys(files));
  assert.equal(summaryPayload.checksums.algorithm, "sha256");
  assert.match(summaryPayload.checksums.bundleDigest, /^[a-f0-9]{64}$/);
  assert.deepEqual(Object.keys(summaryPayload.checksums.files), [
    "README.md",
    "website-workspace.tasks.json",
    "mcp-check.json",
    "mcp-probes.json",
    "mcp-action-plan.md",
    "website-handoff.md",
    "website-prompts.md",
    "codex-implementation.md",
  ]);
  for (const digest of Object.values(summaryPayload.checksums.files)) {
    assert.match(digest, /^[a-f0-9]{64}$/);
  }

  const tasksWorkspace = JSON.parse(files["website-workspace.tasks.json"]);
  assert.deepEqual(tasksWorkspace.refactorTasks.map((task) => task.id), [
    "task-homepage-cta",
    "task-accessibility",
    "task-content-quality",
  ]);
});
