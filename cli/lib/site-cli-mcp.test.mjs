// Tests for runSite MCP readiness output flows.

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import assert from "node:assert/strict";

import { runSite } from "../commands/site.mjs";
import { createSampleSiteWorkspace } from "./site.mjs";
import { captureConsole, withTempDir } from "./site-test-support.mjs";

test("runSite prints and writes MCP readiness check output", async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, "workspace.json");
    const outFile = path.join(dir, "mcp-check.json");
    writeFileSync(file, JSON.stringify(createSampleSiteWorkspace()), "utf8");

    const jsonOutput = await captureConsole(() => runSite([file, "--mcp-check", "--json"]));
    const payload = JSON.parse(jsonOutput.stdout);
    assert.equal(payload.status, "pass");
    assert.equal(payload.items[0].key, "github");
    assert.equal(Object.hasOwn(payload, "probes"), false);
    assert.equal(jsonOutput.exitCode, undefined);

    const probeJsonOutput = await captureConsole(() => runSite([file, "--mcp-check", "--probes", "--json"]));
    const probePayload = JSON.parse(probeJsonOutput.stdout);
    assert.equal(probePayload.status, "pass");
    assert.equal(probePayload.probes.status, "pass");
    assert.equal(probePayload.probes.externalCalls, false);
    assert.match(probePayload.commands.mcpCheckProbesHumanOut, /--mcp-check --probes --out mcp-check-probes\.txt/);
    assert.match(probePayload.commands.mcpCheckProbesJsonOut, /--mcp-check --probes --json --out mcp-check-probes\.json/);
    assert.match(probePayload.commands.mcpPlanProbesJson, /--mcp-plan --probes --json/);
    assert.match(probePayload.commands.mcpPlanProbesJsonOut, /--mcp-plan --probes --json --out mcp-action-plan-probes\.json/);

    const humanOutput = await captureConsole(() => runSite([file, "--mcp-check"]));
    assert.match(humanOutput.stdout, /Website Improvement MCP readiness/);
    assert.match(humanOutput.stdout, /Task MCP gaps:\n- none/);
    assert.doesNotMatch(humanOutput.stdout, /Probe commands:/);

    const probeHumanOutput = await captureConsole(() => runSite([file, "--mcp-check", "--probes"]));
    assert.match(probeHumanOutput.stdout, /Read-only probes:/);
    assert.match(probeHumanOutput.stdout, /Browser smoke target/);
    assert.match(probeHumanOutput.stdout, /Probe commands:/);
    assert.match(probeHumanOutput.stdout, /--mcp-check --probes --out mcp-check-probes\.txt/);
    assert.match(probeHumanOutput.stdout, /--mcp-check --probes --json --out mcp-check-probes\.json/);
    assert.match(probeHumanOutput.stdout, /--mcp-plan --probes --json/);
    assert.match(probeHumanOutput.stdout, /--mcp-plan --probes --json --out mcp-action-plan-probes\.json/);

    const probeHumanOutFile = path.join(dir, "mcp-check-probes.txt");
    const probeHumanWriteOutput = await captureConsole(() => runSite([file, "--mcp-check", "--probes", "--out", probeHumanOutFile]));
    assert.match(probeHumanWriteOutput.stdout, /Wrote /);
    const probeHumanFile = readFileSync(probeHumanOutFile, "utf8");
    assert.match(probeHumanFile, /Read-only probes:/);
    assert.match(probeHumanFile, /Probe commands:/);
    assert.match(probeHumanFile, /--mcp-check --probes --json --out mcp-check-probes\.json/);

    const writeOutput = await captureConsole(() => runSite([file, "--mcp-check", "--json", "--out", outFile]));
    assert.match(writeOutput.stdout, /Wrote /);
    assert.equal(JSON.parse(readFileSync(outFile, "utf8")).status, "pass");
  });
});

test("runSite prints and writes MCP readiness action plan output", async () => {
  await withTempDir(async (dir) => {
    const file = path.join(dir, "workspace.json");
    const outFile = path.join(dir, "mcp-action-plan.md");
    writeFileSync(file, JSON.stringify(createSampleSiteWorkspace()), "utf8");

    const planOutput = await captureConsole(() => runSite([file, "--mcp-plan"]));
    assert.match(planOutput.stdout, /# Website improvement MCP action plan/);
    assert.match(planOutput.stdout, /## Execution Sequence/);
    assert.equal(planOutput.exitCode, undefined);

    const probePlanOutput = await captureConsole(() => runSite([file, "--mcp-plan", "--probes"]));
    assert.match(probePlanOutput.stdout, /## Read-Only Probes/);
    assert.match(probePlanOutput.stdout, /External calls: no/);

    const jsonOutput = await captureConsole(() => runSite([file, "--mcp-plan", "--probes", "--json"]));
    const json = JSON.parse(jsonOutput.stdout);
    assert.equal(json.kind, "website-improvement-mcp-action-plan");
    assert.equal(json.probes.status, "pass");
    assert.equal(json.externalCalls, false);
    assert.equal(json.targetRepoMutation, false);
    assert.match(json.commands.mcpCheck, /--mcp-check --strict --json/);
    assert.match(json.commands.mcpCheckProbesHumanOut, /--mcp-check --probes --out mcp-check-probes\.txt/);
    assert.match(json.commands.mcpCheckProbesJsonOut, /--mcp-check --probes --json --out mcp-check-probes\.json/);
    assert.match(json.commands.mcpPlanProbesJsonOut, /--mcp-plan --probes --json --out mcp-action-plan-probes\.json/);
    assert.equal(jsonOutput.exitCode, undefined);

    const writeOutput = await captureConsole(() => runSite([file, "--mcp-plan", "--out", outFile]));
    assert.match(writeOutput.stdout, /Wrote /);
    assert.match(readFileSync(outFile, "utf8"), /Task\/MCP Alignment/);
  });
});
