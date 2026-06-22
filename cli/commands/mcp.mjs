// `design-ai mcp` — start the design-ai stdio MCP server.

import { startMcpStdioServer } from "../lib/mcp-server.mjs";

function printHelp() {
  console.log("Usage:  design-ai mcp\n");
  console.log("Starts the design-ai stdio MCP server for Claude Code, Codex, and other MCP clients.");
  console.log("The server writes only JSON-RPC messages to stdout; diagnostics go to stderr.");
  console.log("\nExamples:");
  console.log("  Claude Code:");
  console.log("  claude mcp add --transport stdio design-ai -- design-ai mcp");
  console.log("  Codex:");
  console.log("  codex mcp add design-ai -- design-ai mcp");
  console.log("  Local clone:");
  console.log("  node cli/bin/design-ai-mcp.mjs");
}

export async function runMcp(args) {
  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    return;
  }
  if (args.length > 0) {
    throw new Error("Usage: design-ai mcp");
  }
  startMcpStdioServer();
}
