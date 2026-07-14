import assert from "node:assert/strict";
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";

import {
  BROWSER_VERIFICATION_SCHEMA,
  validateBrowserVerification,
} from "./browser-verification-contract.mjs";
import { runBrowserVerification } from "./browser-verification-runner.mjs";
import { parseBrowserVerificationArgs, parseBrowserViewport } from "./browser-verification.mjs";
import { PACKAGE_ROOT } from "./paths.mjs";

function tempWorkspace() {
  const root = mkdtempSync(path.join(tmpdir(), "design-ai-browser-verification-"));
  const targetRoot = path.join(root, "target");
  const evidenceRoot = path.join(root, "evidence");
  const reportPath = path.join(root, "quality-report.json");
  mkdirSync(targetRoot);
  cpSync(
    path.join(PACKAGE_ROOT, "examples", "benchmarks", "korean-fintech-settings", "quality-report.json"),
    reportPath,
  );
  return { root, targetRoot, evidenceRoot, reportPath };
}

function writeAdapter(root, body) {
  const adapter = path.join(root, "adapter.mjs");
  writeFileSync(adapter, `#!/usr/bin/env node\n${body}\n`);
  chmodSync(adapter, 0o755);
  return adapter;
}

function completeAdapter(root, {
  observedAt = "2026-07-14T00:00:30.000Z",
  screenshotBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg==",
} = {}) {
  return writeAdapter(root, String.raw`
let input = "";
for await (const chunk of process.stdin) input += chunk;
const request = JSON.parse(input);
const probes = [];
for (const viewport of request.viewports) {
  for (const check of request.checks) {
    const kind = check === "responsive" ? "screenshot" : check === "accessibility" ? "accessibility" : "trace";
    const file = check + "-" + viewport.name + (kind === "screenshot" ? ".png" : kind === "accessibility" ? ".json" : ".txt");
    const contents = kind === "screenshot"
      ? Buffer.from(${JSON.stringify(screenshotBase64)}, "base64")
      : kind === "accessibility"
        ? JSON.stringify({ role: "document", name: viewport.name })
        : check + " " + viewport.name + "\\n";
    await import("node:fs").then(({ writeFileSync }) => writeFileSync(file, contents));
    probes.push({
      check,
      viewport: viewport.name,
      status: check === "repeated-action" && viewport.name === "mobile" ? "fail" : "pass",
      observedAt: ${JSON.stringify(observedAt)},
      observation: check + " observed at " + viewport.name,
      artifacts: [{ kind, path: file }],
    });
  }
}
process.stdout.write(JSON.stringify({
  kind: "design-ai-browser-probe-result",
  schemaVersion: 1,
  tool: { name: "fake-browser", version: "1.0.0" },
  policy: {
    allowedOrigin: request.networkPolicy.allowedOrigin,
    allowedMethods: request.networkPolicy.allowedMethods,
    crossOrigin: "blocked",
    webSockets: "blocked",
    downloads: "blocked",
  },
  probes,
}));`);
}

function deterministicOptions(workspace, adapter) {
  const times = [new Date("2026-07-14T00:00:00.000Z"), new Date("2026-07-14T00:01:00.000Z")];
  return {
    approved: true,
    approvalRef: "human: browser run approved for test",
    reportPath: workspace.reportPath,
    targetRoot: workspace.targetRoot,
    url: "http://127.0.0.1:4173/settings",
    adapter,
    adapterArgs: [],
    viewports: [
      { name: "mobile", width: 390, height: 844 },
      { name: "desktop", width: 1440, height: 900 },
    ],
    evidenceRoot: workspace.evidenceRoot,
    randomUUID: () => "12345678-1234-1234-1234-123456789abc",
    now: () => times.shift(),
  };
}

test("browser verification parser keeps explicit approval, adapter args, and viewport dimensions", () => {
  assert.deepEqual(parseBrowserVerificationArgs([
    "quality-report.json",
    "--url", "http://localhost:4173",
    "--target-root", "/tmp/site",
    "--adapter", "node",
    "--adapter-arg", "adapter.mjs",
    "--adapter-arg", "--quiet",
    "--approval-ref", "human: approved",
    "--viewport", "phone=390x844",
    "--yes",
    "--json",
  ]), {
    reportPath: "quality-report.json",
    url: "http://localhost:4173",
    targetRoot: "/tmp/site",
    approvalRef: "human: approved",
    adapter: "node",
    adapterArgs: ["adapter.mjs", "--quiet"],
    viewports: [{ name: "phone", width: 390, height: 844 }],
    approved: true,
    json: true,
    help: false,
  });
  assert.throws(() => parseBrowserViewport("phone:390x844"), /name=WIDTHxHEIGHT/);
  assert.throws(
    () => parseBrowserVerificationArgs(["report.json", "--viewport", "phone=390x844", "--viewport", "phone=400x900"]),
    /names must not repeat/,
  );
});

test("browser verification records a complete run and links failed probes to source findings", async () => {
  const workspace = tempWorkspace();
  const adapter = completeAdapter(workspace.root);
  const sourceBefore = readFileSync(workspace.reportPath);
  try {
    const { report, reportFile } = await runBrowserVerification(deterministicOptions(workspace, adapter));
    assert.equal(report.summary.status, "fail");
    assert.equal(report.summary.passed, 13);
    assert.equal(report.summary.failed, 1);
    assert.equal(report.summary.unverified, 0);
    assert.equal(report.probes.length, 14);
    assert.equal(report.run.tool.name, "fake-browser");
    assert.equal(report.boundary.adapterAttestation.networkPolicy, "attested");
    assert.equal(report.boundary.adapterAttestation.targetRepoMutation, "unverified");
    assert.equal(report.boundary.adapterAttestation.externalWrites, "unverified");
    assert.equal(report.boundary.sourceReportDigestMatchedAfterRun, true);
    assert.equal(report.approval.reference, "human: browser run approved for test");
    assert.equal(report.sourceReport.postRunDigestMatch, true);
    const finding = report.findings.find((item) => item.probeId === "repeated-action:mobile");
    assert.deepEqual(finding.sourceFindingIds, ["runtime-interaction-proof-missing"]);
    assert.equal(finding.artifacts[0].kind, "trace");
    assert.equal(existsSync(reportFile), true);
    assert.deepEqual(readFileSync(workspace.reportPath), sourceBefore);
    assert.deepEqual(validateBrowserVerification(JSON.parse(readFileSync(reportFile, "utf8"))), report);
    const forged = structuredClone(report);
    forged.probes.find((probe) => probe.status === "pass").findingIds.push(finding.id);
    assert.throws(() => validateBrowserVerification(forged), /must link 0 finding/);
    const unsafeArtifact = structuredClone(report);
    unsafeArtifact.probes[0].artifacts[0].path = "/tmp/outside.png";
    assert.throws(() => validateBrowserVerification(unsafeArtifact), /relative path without parent traversal/);
    const missingProbe = structuredClone(report);
    missingProbe.probes.splice(0, 1);
    assert.throws(() => validateBrowserVerification(missingProbe), /must contain one responsive probe/);
    const invalidViewport = structuredClone(report);
    invalidViewport.viewports[0].width = 200;
    assert.throws(() => validateBrowserVerification(invalidViewport), /at least 240/);
    const wrongProbeId = structuredClone(report);
    wrongProbeId.probes[0].id = "responsive:wrong";
    assert.throws(() => validateBrowserVerification(wrongProbeId), /must match check:viewport/);
    const wrongPassArtifact = structuredClone(report);
    const responsivePass = wrongPassArtifact.probes.find(
      (probe) => probe.check === "responsive" && probe.status === "pass",
    );
    responsivePass.artifacts[0].kind = "result";
    assert.throws(() => validateBrowserVerification(wrongPassArtifact), /requires a screenshot artifact/);
    const futureProbe = structuredClone(report);
    futureProbe.probes[0].observedAt = "2026-07-14T00:02:00.000Z";
    assert.throws(() => validateBrowserVerification(futureProbe), /within the run interval/);
  } finally {
    rmSync(workspace.root, { recursive: true, force: true });
  }
});

test("unavailable adapters produce unverified evidence instead of a false pass", async () => {
  const workspace = tempWorkspace();
  try {
    const { report, reportFile } = await runBrowserVerification(
      deterministicOptions(workspace, path.join(workspace.root, "missing-adapter")),
    );
    assert.equal(report.summary.status, "unverified");
    assert.equal(report.summary.passed, 0);
    assert.equal(report.summary.failed, 0);
    assert.equal(report.summary.unverified, 14);
    assert.equal(report.boundary.adapterAttestation.networkPolicy, "unverified");
    assert.equal(report.findings.every((finding) => finding.status === "unverified"), true);
    assert.equal(existsSync(reportFile), true);
  } finally {
    rmSync(workspace.root, { recursive: true, force: true });
  }
});

test("browser verification requires an exact network-policy attestation", async () => {
  const workspace = tempWorkspace();
  const adapter = writeAdapter(workspace.root, String.raw`
let input = "";
for await (const chunk of process.stdin) input += chunk;
const request = JSON.parse(input);
process.stdout.write(JSON.stringify({
  kind: "design-ai-browser-probe-result",
  schemaVersion: 1,
  tool: { name: "partial-policy-adapter", version: "1.0.0" },
  policy: {
    allowedOrigin: request.networkPolicy.allowedOrigin,
    allowedMethods: request.networkPolicy.allowedMethods,
    crossOrigin: "blocked",
    webSockets: "blocked",
    downloads: "blocked",
    uncheckedSurface: "unknown",
  },
  probes: [],
}));`);
  try {
    const { report } = await runBrowserVerification(deterministicOptions(workspace, adapter));
    assert.equal(report.summary.status, "unverified");
    assert.equal(report.summary.unverified, 14);
    assert.equal(report.boundary.adapterAttestation.networkPolicy, "unverified");
  } finally {
    rmSync(workspace.root, { recursive: true, force: true });
  }
});

test("browser verification rejects mislabeled and runner-owned artifacts", async () => {
  const workspace = tempWorkspace();
  const adapter = writeAdapter(workspace.root, String.raw`
let input = "";
for await (const chunk of process.stdin) input += chunk;
const request = JSON.parse(input);
const probes = [];
for (const viewport of request.viewports) {
  for (const check of request.checks) {
    const file = check === "responsive"
      ? "request.json"
      : check === "accessibility"
        ? "accessibility-" + viewport.name + ".json"
        : check + "-" + viewport.name + ".txt";
    if (file !== "request.json") {
      const contents = check === "accessibility" ? "{}" : "not structured evidence\n";
      await import("node:fs").then(({ writeFileSync }) => writeFileSync(file, contents));
    }
    probes.push({
      check,
      viewport: viewport.name,
      status: "pass",
      observedAt: "2026-07-14T00:00:30.000Z",
      observation: check + " observed",
      artifacts: [{
        kind: check === "responsive" ? "screenshot" : check === "accessibility" ? "accessibility" : "trace",
        path: file,
      }],
    });
  }
}
process.stdout.write(JSON.stringify({
  kind: "design-ai-browser-probe-result",
  schemaVersion: 1,
  tool: { name: "mislabeling-adapter", version: "1.0.0" },
  policy: {
    allowedOrigin: request.networkPolicy.allowedOrigin,
    allowedMethods: request.networkPolicy.allowedMethods,
    crossOrigin: "blocked",
    webSockets: "blocked",
    downloads: "blocked",
  },
  probes,
}));`);
  try {
    const { report } = await runBrowserVerification(deterministicOptions(workspace, adapter));
    assert.equal(report.summary.status, "unverified");
    assert.equal(report.summary.passed, 10);
    assert.equal(report.summary.unverified, 4);
    assert.equal(
      report.probes
        .filter((probe) => new Set(["responsive", "accessibility"]).has(probe.check))
        .every((probe) => probe.status === "unverified"),
      true,
    );
  } finally {
    rmSync(workspace.root, { recursive: true, force: true });
  }
});

test("browser verification waits for a timed-out adapter process to terminate", async () => {
  const workspace = tempWorkspace();
  const pidFile = path.join(workspace.root, "adapter.pid");
  const adapter = writeAdapter(workspace.root, String.raw`
const { spawn } = await import("node:child_process");
const descendant = spawn(process.execPath, [
  "-e",
  "process.on('SIGTERM', () => {}); setInterval(() => {}, 1000);",
], { stdio: "ignore" });
await import("node:fs").then(({ writeFileSync }) => writeFileSync(
  process.argv[2],
  JSON.stringify({ leader: process.pid, descendant: descendant.pid }),
));
let input = "";
for await (const chunk of process.stdin) input += chunk;
process.on("SIGTERM", () => {});
setInterval(() => {}, 1_000);`);
  const options = deterministicOptions(workspace, adapter);
  options.adapterArgs = [pidFile];
  options.timeoutMs = 1_000;
  options.terminationGraceMs = 100;
  try {
    const { report } = await runBrowserVerification(options);
    assert.equal(report.summary.status, "unverified");
    if (process.platform !== "win32") {
      const pids = JSON.parse(readFileSync(pidFile, "utf8"));
      assert.throws(() => process.kill(pids.leader, 0), /ESRCH/);
      assert.throws(() => process.kill(pids.descendant, 0), /ESRCH/);
    }
  } finally {
    rmSync(workspace.root, { recursive: true, force: true });
  }
});

test("browser verification rejects truncated and data-free screenshots", async () => {
  const workspace = tempWorkspace();
  const adapter = completeAdapter(workspace.root, {
    screenshotBase64: "iVBORw0KGgo=",
  });
  try {
    const { report } = await runBrowserVerification(deterministicOptions(workspace, adapter));
    const responsive = report.probes.filter((probe) => probe.check === "responsive");
    assert.equal(responsive.length, 2);
    assert.equal(responsive.every((probe) => probe.status === "unverified"), true);

    rmSync(workspace.evidenceRoot, { recursive: true, force: true });
    const headerOnlyAdapter = completeAdapter(workspace.root, {
      screenshotBase64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAAAAAAAAAAAElFTkQAAAAA",
    });
    const headerOnly = await runBrowserVerification(deterministicOptions(workspace, headerOnlyAdapter));
    assert.equal(
      headerOnly.report.probes
        .filter((probe) => probe.check === "responsive")
        .every((probe) => probe.status === "unverified"),
      true,
    );

    rmSync(workspace.evidenceRoot, { recursive: true, force: true });
    const undersizedPixelsAdapter = completeAdapter(workspace.root, {
      screenshotBase64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACUlEQVR4nGMAAAABAAFe/335AAAAAElFTkSuQmCC",
    });
    const undersizedPixels = await runBrowserVerification(
      deterministicOptions(workspace, undersizedPixelsAdapter),
    );
    assert.equal(
      undersizedPixels.report.probes
        .filter((probe) => probe.check === "responsive")
        .every((probe) => probe.status === "unverified"),
      true,
    );

    rmSync(workspace.evidenceRoot, { recursive: true, force: true });
    const corruptCrcAdapter = completeAdapter(workspace.root, {
      screenshotBase64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAeFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/iZk9HQAAAABJRU5ErkJggg==",
    });
    const corruptCrc = await runBrowserVerification(
      deterministicOptions(workspace, corruptCrcAdapter),
    );
    assert.equal(
      corruptCrc.report.probes
        .filter((probe) => probe.check === "responsive")
        .every((probe) => probe.status === "unverified"),
      true,
    );

    for (const unsupportedBase64 of [
      "/9j/wAAICAABAAEB/9oAAgD/2Q==",
      "UklGRhIAAABXRUJQVlA4TAYAAAAvAAAAAAA=",
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAMAAAAoyzS7AAAACklEQVR4nGNgAAAAAgABSK+kcQAAAABJRU5ErkJggg==",
    ]) {
      rmSync(workspace.evidenceRoot, { recursive: true, force: true });
      const unsupportedAdapter = completeAdapter(workspace.root, {
        screenshotBase64: unsupportedBase64,
      });
      const unsupported = await runBrowserVerification(
        deterministicOptions(workspace, unsupportedAdapter),
      );
      assert.equal(
        unsupported.report.probes
          .filter((probe) => probe.check === "responsive")
          .every((probe) => probe.status === "unverified"),
        true,
      );
    }
  } finally {
    rmSync(workspace.root, { recursive: true, force: true });
  }
});

test("browser verification rejects adapter timestamps outside the run interval", async () => {
  const workspace = tempWorkspace();
  const adapter = completeAdapter(workspace.root, {
    observedAt: "2026-07-14T00:02:00.000Z",
  });
  try {
    const { report } = await runBrowserVerification(deterministicOptions(workspace, adapter));
    assert.equal(report.summary.status, "unverified");
    assert.equal(report.summary.unverified, 14);
    assert.match(report.probes[0].observation, /outside this run interval/);
  } finally {
    rmSync(workspace.root, { recursive: true, force: true });
  }
});

test("browser verification schema mirrors representable validator constraints", () => {
  const artifact = BROWSER_VERIFICATION_SCHEMA.$defs.artifact.properties.path;
  const artifactPath = new RegExp(artifact.pattern);
  assert.equal(artifactPath.test("screens/mobile.png"), true);
  assert.equal(artifactPath.test("/tmp/mobile.png"), false);
  assert.equal(artifactPath.test("..\\mobile.png"), false);
  assert.equal(BROWSER_VERIFICATION_SCHEMA.properties.viewports.uniqueItems, true);
  assert.equal(BROWSER_VERIFICATION_SCHEMA.properties.probes.minItems, 7);
  assert.equal(BROWSER_VERIFICATION_SCHEMA.$defs.probe.properties.findingIds.uniqueItems, true);
  assert.equal(BROWSER_VERIFICATION_SCHEMA.$defs.probe.allOf.length, 2);
  assert.match(BROWSER_VERIFICATION_SCHEMA.$comment, /validateBrowserVerification/);
});

test("browser verification refuses execution without approval and rejects non-loopback URLs", async () => {
  const workspace = tempWorkspace();
  const adapter = completeAdapter(workspace.root);
  try {
    const unapproved = deterministicOptions(workspace, adapter);
    unapproved.approved = false;
    await assert.rejects(() => runBrowserVerification(unapproved), /without --yes/);
    assert.equal(existsSync(workspace.evidenceRoot), false);

    const external = deterministicOptions(workspace, adapter);
    external.url = "https://example.com/settings";
    await assert.rejects(() => runBrowserVerification(external), /loopback URLs only/);
    assert.equal(existsSync(workspace.evidenceRoot), false);
  } finally {
    rmSync(workspace.root, { recursive: true, force: true });
  }
});

test("browser verification rejects an evidence root that resolves inside the target", async () => {
  const workspace = tempWorkspace();
  const adapter = completeAdapter(workspace.root);
  const targetEvidence = path.join(workspace.targetRoot, "evidence");
  mkdirSync(targetEvidence);
  symlinkSync(targetEvidence, workspace.evidenceRoot);
  try {
    await assert.rejects(
      () => runBrowserVerification(deterministicOptions(workspace, adapter)),
      /resolves inside the target root/,
    );
  } finally {
    rmSync(workspace.root, { recursive: true, force: true });
  }
});

test("browser verification detects source report mutation by an external adapter", async () => {
  const workspace = tempWorkspace();
  const adapter = writeAdapter(workspace.root, String.raw`
let input = "";
for await (const chunk of process.stdin) input += chunk;
await import("node:fs").then(({ appendFileSync }) => appendFileSync(process.argv[2], "\n"));
process.stdout.write(JSON.stringify({
  kind: "design-ai-browser-probe-result",
  schemaVersion: 1,
  tool: { name: "mutating-adapter", version: "1.0.0" },
  policy: {
    allowedOrigin: "http://127.0.0.1:4173",
    allowedMethods: ["GET", "HEAD"],
    crossOrigin: "blocked",
    webSockets: "blocked",
    downloads: "blocked",
  },
  probes: [],
}));`);
  const options = deterministicOptions(workspace, adapter);
  options.adapterArgs = [workspace.reportPath];
  try {
    await assert.rejects(() => runBrowserVerification(options), /changed the source quality report/);
    const runDir = path.join(workspace.evidenceRoot, "2026-07-14T00-00-00Z-12345678");
    assert.equal(existsSync(path.join(runDir, "boundary-violation.json")), true);
  } finally {
    rmSync(workspace.root, { recursive: true, force: true });
  }
});
