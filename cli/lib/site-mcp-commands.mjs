// Command helpers for Website Improvement MCP readiness flows.

export function siteMcpCommandTarget(filePath) {
  return filePath === "stdin" ? "<workspace.json>" : filePath;
}

export function buildSiteMcpProbeCommandSet(commandTarget) {
  return {
    mcpCheckProbesHumanOut: `design-ai site ${commandTarget} --mcp-check --probes --out mcp-check-probes.txt`,
    mcpCheckProbesJsonOut: `design-ai site ${commandTarget} --mcp-check --probes --json --out mcp-check-probes.json`,
    mcpPlanProbesJson: `design-ai site ${commandTarget} --mcp-plan --probes --json`,
    mcpPlanProbesJsonOut: `design-ai site ${commandTarget} --mcp-plan --probes --json --out mcp-action-plan-probes.json`,
  };
}

export function buildSiteNextActionCommandSet(commandTarget) {
  return {
    summary: `design-ai site ${commandTarget} --json`,
    mcpCheck: `design-ai site ${commandTarget} --mcp-check --strict --json`,
    mcpPlan: `design-ai site ${commandTarget} --mcp-plan --out mcp-action-plan.md`,
    mcpCheckProbes: `design-ai site ${commandTarget} --mcp-check --probes --json --out mcp-check-probes.json`,
    mcpPlanProbes: `design-ai site ${commandTarget} --mcp-plan --probes --json --out mcp-action-plan-probes.json`,
    tasks: `design-ai site ${commandTarget} --tasks --out website-workspace.tasks.json`,
    implementationPrompt: `design-ai site ${commandTarget} --prompt codex-implementation --task 1 --out codex-implementation.md`,
    handoffReport: `design-ai site ${commandTarget} --report --out website-handoff.md`,
    handoffBundle: `design-ai site ${commandTarget} --bundle --out website-handoff-bundle`,
  };
}
