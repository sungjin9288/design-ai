import { spawn } from "node:child_process";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { inflateSync } from "node:zlib";

import {
  BROWSER_CHECKS,
  BROWSER_PROBE_STATUSES,
  validateBrowserVerification,
} from "./browser-verification-contract.mjs";
import { readDesignQualityReport } from "./design-quality-contract.mjs";

const DEFAULT_VIEWPORTS = Object.freeze([
  Object.freeze({ name: "mobile", width: 390, height: 844 }),
  Object.freeze({ name: "desktop", width: 1440, height: 900 }),
]);
const MAX_ADAPTER_OUTPUT_BYTES = 2_000_000;
const MAX_STRUCTURED_ARTIFACT_BYTES = 20_000_000;
const DEFAULT_TIMEOUT_MS = 120_000;
const TERMINATION_GRACE_MS = 1_000;
const RUNNER_OWNED_FILES = new Set([
  "request.json",
  "adapter-output.json",
  "adapter.log",
  "browser-verification.json",
  "boundary-violation.json",
]);
const PNG_EVIDENCE_CHUNKS = new Set(["IHDR", "IDAT", "IEND"]);
const CRC32_TABLE = Object.freeze(Array.from({ length: 256 }, (_, value) => {
  let checksum = value;
  for (let bit = 0; bit < 8; bit += 1) {
    checksum = checksum & 1 ? 0xedb88320 ^ (checksum >>> 1) : checksum >>> 1;
  }
  return checksum >>> 0;
}));

function normalizedTimestamp(value) {
  return new Date(value).toISOString();
}

function runIdAt(timestamp, id) {
  return `${timestamp.replaceAll(":", "-").replace(".000Z", "Z")}-${id.slice(0, 8)}`;
}

function browserEvidenceRoot() {
  return path.join(homedir(), ".design-ai", "evidence", "browser");
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function isLoopback(hostname) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

function readInputReport(reportPath) {
  if (typeof reportPath !== "string" || !reportPath.trim()) {
    throw new Error("browser verification requires a quality report path");
  }
  const resolved = path.resolve(reportPath);
  const stat = lstatSync(resolved);
  if (stat.isSymbolicLink() || !stat.isFile()) {
    throw new Error("browser verification quality report must be a regular, non-symbolic-link file");
  }
  const source = readFileSync(resolved);
  return { path: realpathSync(resolved), source, report: readDesignQualityReport(resolved), sha256: sha256(source) };
}

function readTargetRoot(targetRoot) {
  if (typeof targetRoot !== "string" || !targetRoot.trim()) {
    throw new Error("browser verification requires --target-root");
  }
  const resolved = path.resolve(targetRoot);
  const stat = lstatSync(resolved);
  if (stat.isSymbolicLink() || !stat.isDirectory()) {
    throw new Error("browser verification target root must be a regular, non-symbolic-link directory");
  }
  return realpathSync(resolved);
}

function selectedViewports(value) {
  const viewports = value?.length ? value : DEFAULT_VIEWPORTS;
  const normalized = viewports.map((viewport, index) => {
    if (!viewport || typeof viewport !== "object" || Array.isArray(viewport)) {
      throw new Error(`browser verification viewport ${index + 1} must be an object`);
    }
    if (typeof viewport.name !== "string" || !/^[a-z0-9][a-z0-9-]*$/i.test(viewport.name)) {
      throw new Error(`browser verification viewport ${index + 1} needs a simple name`);
    }
    if (!Number.isInteger(viewport.width) || !Number.isInteger(viewport.height)
      || viewport.width < 240 || viewport.height < 240) {
      throw new Error(`browser verification viewport ${viewport.name} must be at least 240x240`);
    }
    return { name: viewport.name, width: viewport.width, height: viewport.height };
  });
  if (new Set(normalized.map((viewport) => viewport.name)).size !== normalized.length) {
    throw new Error("browser verification viewport names must be unique");
  }
  return normalized;
}

function contains(parent, child) {
  const relative = path.relative(parent, child);
  return relative === "" || (!path.isAbsolute(relative) && relative !== ".." && !relative.startsWith(`..${path.sep}`));
}

function crc32(contents) {
  let checksum = 0xffffffff;
  for (const byte of contents) {
    checksum = CRC32_TABLE[(checksum ^ byte) & 0xff] ^ (checksum >>> 8);
  }
  return (checksum ^ 0xffffffff) >>> 0;
}

function pngPasses(header) {
  if (header.interlace === 0) return [[0, 0, 1, 1]];
  return [
    [0, 0, 8, 8],
    [4, 0, 8, 8],
    [0, 4, 4, 8],
    [2, 0, 4, 4],
    [0, 2, 2, 4],
    [1, 0, 2, 2],
    [0, 1, 1, 2],
  ];
}

function pngPassLength(size, start, step) {
  return size <= start ? 0 : Math.ceil((size - start) / step);
}

function hasValidPngScanlines(contents, header) {
  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[header.colorType];
  const bitsPerPixel = channels * header.bitDepth;
  let offset = 0;
  for (const [xStart, yStart, xStep, yStep] of pngPasses(header)) {
    const width = pngPassLength(header.width, xStart, xStep);
    const height = pngPassLength(header.height, yStart, yStep);
    if (width === 0 || height === 0) continue;
    const rowLength = Math.ceil((width * bitsPerPixel) / 8);
    for (let row = 0; row < height; row += 1) {
      if (offset + 1 + rowLength > contents.length || contents[offset] > 4) return false;
      offset += 1 + rowLength;
    }
  }
  return offset === contents.length;
}

function isCompletePng(contents) {
  if (contents.length < 45 || !contents.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))) {
    return false;
  }
  let offset = 8;
  let header = null;
  const imageData = [];
  let imageDataEnded = false;
  while (offset + 12 <= contents.length) {
    const length = contents.readUInt32BE(offset);
    const type = contents.subarray(offset + 4, offset + 8).toString("ascii");
    const end = offset + 12 + length;
    if (end > contents.length || !PNG_EVIDENCE_CHUNKS.has(type)) return false;
    const expectedCrc = contents.readUInt32BE(offset + 8 + length);
    const actualCrc = crc32(contents.subarray(offset + 4, offset + 8 + length));
    if (actualCrc !== expectedCrc) return false;
    if (type === "IHDR") {
      if (header || offset !== 8 || length !== 13) return false;
      const bitDepth = contents[offset + 16];
      const colorType = contents[offset + 17];
      const width = contents.readUInt32BE(offset + 8);
      const height = contents.readUInt32BE(offset + 12);
      const interlace = contents[offset + 20];
      if (width < 1
        || height < 1
        || bitDepth !== 8
        || !new Set([2, 6]).has(colorType)
        || contents[offset + 18] !== 0
        || contents[offset + 19] !== 0
        || !new Set([0, 1]).has(interlace)) return false;
      header = { width, height, bitDepth, colorType, interlace };
    }
    if (type === "IDAT" && header && length > 0) {
      if (imageDataEnded) return false;
      imageData.push(contents.subarray(offset + 8, offset + 8 + length));
    }
    if (type === "IEND") {
      if (!header || imageData.length === 0 || length !== 0 || end !== contents.length) return false;
      try {
        const pixels = inflateSync(Buffer.concat(imageData), {
          maxOutputLength: MAX_STRUCTURED_ARTIFACT_BYTES,
        });
        return hasValidPngScanlines(pixels, header);
      } catch {
        return false;
      }
    }
    if (imageData.length > 0 && type !== "IDAT") imageDataEnded = true;
    offset = end;
  }
  return false;
}

function isScreenshot(contents) {
  return isCompletePng(contents);
}

function isAccessibilityResult(contents) {
  try {
    const value = JSON.parse(contents.toString("utf8"));
    if (!value || typeof value !== "object") return false;
    return Array.isArray(value) ? value.length > 0 : Object.keys(value).length > 0;
  } catch {
    return false;
  }
}

function hasExpectedContent(kind, resolved, size) {
  if (size < 1) return false;
  if (kind !== "screenshot" && kind !== "accessibility") return true;
  if (size > MAX_STRUCTURED_ARTIFACT_BYTES) return false;
  const contents = readFileSync(resolved);
  return kind === "screenshot" ? isScreenshot(contents) : isAccessibilityResult(contents);
}

function safeArtifact(runDir, artifact) {
  if (!artifact || typeof artifact !== "object" || Array.isArray(artifact)) return null;
  if (!new Set(["screenshot", "accessibility", "trace", "log", "result"]).has(artifact.kind)) return null;
  if (typeof artifact.path !== "string" || !artifact.path.trim()) return null;
  if (path.posix.isAbsolute(artifact.path) || path.win32.isAbsolute(artifact.path)) return null;
  if (artifact.path.split(/[\\/]/).includes("..")) return null;

  const normalizedPath = artifact.path.replaceAll("\\", "/");
  if (RUNNER_OWNED_FILES.has(normalizedPath)) return null;
  const resolved = path.resolve(runDir, artifact.path);
  if (!contains(runDir, resolved) || !existsSync(resolved)) return null;
  const stat = lstatSync(resolved);
  if (!stat.isFile() || stat.isSymbolicLink()) return null;
  const realRunDir = realpathSync(runDir);
  const realArtifact = realpathSync(resolved);
  if (!contains(realRunDir, realArtifact) || !hasExpectedContent(artifact.kind, resolved, stat.size)) return null;
  return { kind: artifact.kind, path: path.relative(runDir, resolved).replaceAll(path.sep, "/") };
}

function requiredArtifactKind(check) {
  if (check === "responsive") return "screenshot";
  if (check === "accessibility") return "accessibility";
  return null;
}

function expectedProbeId(check, viewport) {
  return `${check}:${viewport}`;
}

function adapterRequest({ runId, url, runDir, viewports }) {
  const origin = new URL(url).origin;
  return {
    kind: "design-ai-browser-probe-request",
    schemaVersion: 1,
    runId,
    url,
    outputDir: runDir,
    checks: [...BROWSER_CHECKS],
    viewports,
    networkPolicy: {
      allowedOrigin: origin,
      allowedMethods: ["GET", "HEAD"],
      blockCrossOrigin: true,
      blockWebSockets: true,
      blockDownloads: true,
    },
  };
}

function signalAdapter(child, signal) {
  try {
    if (child.pid) process.kill(-child.pid, signal);
    else child.kill(signal);
  } catch {
    try {
      child.kill(signal);
    } catch {
      // The process already exited.
    }
  }
}

function processGroupAlive(pid) {
  if (!pid) return false;
  try {
    process.kill(-pid, 0);
    return true;
  } catch (error) {
    return error?.code === "EPERM";
  }
}

function waitForProcessGroupExit(pid, timeoutMs) {
  return new Promise((resolve) => {
    const deadline = Date.now() + timeoutMs;
    const check = () => {
      if (!processGroupAlive(pid)) resolve(true);
      else if (Date.now() >= deadline) resolve(false);
      else setTimeout(check, 10);
    };
    check();
  });
}

function executeAdapter({ command, args, request, timeoutMs, terminationGraceMs }) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: request.outputDir,
      env: {
        PATH: process.env.PATH || "",
        HOME: process.env.HOME || "",
        DESIGN_AI_BROWSER_RUN_ID: request.runId,
        DESIGN_AI_BROWSER_OUTPUT_DIR: request.outputDir,
      },
      stdio: ["pipe", "pipe", "pipe"],
      detached: true,
    });
    const stdout = [];
    const stderr = [];
    let outputBytes = 0;
    let settled = false;
    let stopReason = "";
    let timer;
    let forceTimer;

    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearTimeout(forceTimer);
      resolve({
        ...result,
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8"),
      });
    };
    const forceStop = async () => {
      signalAdapter(child, "SIGKILL");
      const terminated = await waitForProcessGroupExit(child.pid, terminationGraceMs);
      finish({
        ok: false,
        reason: terminated
          ? stopReason
          : `${stopReason}; process-group termination could not be confirmed`,
      });
    };
    const stop = (reason) => {
      if (stopReason) return;
      stopReason = reason;
      signalAdapter(child, "SIGTERM");
      forceTimer = setTimeout(forceStop, terminationGraceMs);
    };
    const append = (chunks, chunk) => {
      outputBytes += chunk.length;
      if (outputBytes > MAX_ADAPTER_OUTPUT_BYTES) {
        stop(`adapter output exceeded ${MAX_ADAPTER_OUTPUT_BYTES} bytes`);
        return;
      }
      chunks.push(chunk);
    };
    child.stdout.on("data", (chunk) => append(stdout, chunk));
    child.stderr.on("data", (chunk) => append(stderr, chunk));
    child.on("error", (error) => {
      const reason = `adapter could not start: ${error.message}`;
      if (!child.pid) finish({ ok: false, reason });
      else stop(reason);
    });
    child.on("close", (code, signal) => {
      if (processGroupAlive(child.pid)) {
        stop(stopReason || "adapter left descendant processes running");
        return;
      }
      if (stopReason) finish({ ok: false, reason: stopReason });
      else if (code === 0) finish({ ok: true });
      else finish({ ok: false, reason: `adapter exited with ${signal ? `signal ${signal}` : `code ${code}`}` });
    });
    child.stdin.on("error", () => {});
    child.stdin.end(`${JSON.stringify(request)}\n`);
    timer = setTimeout(() => {
      stop(`adapter timed out after ${timeoutMs} ms`);
    }, timeoutMs);
  });
}

function policyMatches(actual, expected) {
  const keys = ["allowedOrigin", "allowedMethods", "crossOrigin", "webSockets", "downloads"];
  return actual
    && typeof actual === "object"
    && !Array.isArray(actual)
    && Object.keys(actual).length === keys.length
    && keys.every((key) => Object.hasOwn(actual, key))
    && actual.allowedOrigin === expected.allowedOrigin
    && Array.isArray(actual.allowedMethods)
    && actual.allowedMethods.length === expected.allowedMethods.length
    && actual.allowedMethods.every((method, index) => method === expected.allowedMethods[index])
    && actual.crossOrigin === "blocked"
    && actual.webSockets === "blocked"
    && actual.downloads === "blocked";
}

function parseAdapterPayload(execution, requestedPolicy) {
  if (!execution.ok) return { ok: false, reason: execution.reason };
  let payload;
  try {
    payload = JSON.parse(execution.stdout);
  } catch (error) {
    return { ok: false, reason: `adapter returned invalid JSON: ${error.message}` };
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, reason: "adapter result must be an object" };
  }
  if (payload.kind !== "design-ai-browser-probe-result" || payload.schemaVersion !== 1) {
    return { ok: false, reason: "adapter result must use design-ai-browser-probe-result schemaVersion 1" };
  }
  if (!payload.tool || typeof payload.tool.name !== "string" || !payload.tool.name.trim()) {
    return { ok: false, reason: "adapter result must name its tool" };
  }
  if (typeof payload.tool.version !== "string" || !payload.tool.version.trim()) {
    return { ok: false, reason: "adapter result must name its tool version" };
  }
  if (!Array.isArray(payload.probes)) return { ok: false, reason: "adapter result probes must be an array" };
  if (!policyMatches(payload.policy, requestedPolicy)) {
    return { ok: false, reason: "adapter result must attest to the exact requested origin, methods, and blocked network surfaces" };
  }
  return { ok: true, payload };
}

function fallbackArtifact(outputFile) {
  return [{ kind: "result", path: path.basename(outputFile) }];
}

function normalizeProbe({ raw, check, viewport, runDir, outputFile, startedAt, completedAt }) {
  const fallback = fallbackArtifact(outputFile);
  if (!raw) {
    return {
      id: expectedProbeId(check, viewport),
      check,
      status: "unverified",
      viewport,
      observedAt: completedAt,
      observation: "The adapter did not return this required probe.",
      artifacts: fallback,
      findingIds: [],
    };
  }

  const status = BROWSER_PROBE_STATUSES.includes(raw.status) ? raw.status : "unverified";
  let observedAt = completedAt;
  let observedWithinRun = false;
  try {
    const candidate = normalizedTimestamp(raw.observedAt);
    observedWithinRun = candidate >= startedAt && candidate <= completedAt;
    if (observedWithinRun) observedAt = candidate;
  } catch {
    // Invalid adapter timestamps are represented as unverified evidence below.
  }
  const artifacts = Array.isArray(raw.artifacts)
    ? raw.artifacts.map((artifact) => safeArtifact(runDir, artifact)).filter(Boolean)
    : [];
  const requiredKind = requiredArtifactKind(check);
  const hasRequiredArtifact = !requiredKind || artifacts.some((artifact) => artifact.kind === requiredKind);
  const complete = typeof raw.observation === "string" && raw.observation.trim() && artifacts.length > 0 && hasRequiredArtifact;
  const finalStatus = !observedWithinRun
    ? "unverified"
    : complete
      ? status
      : status === "fail" ? "fail" : "unverified";
  const observation = !observedWithinRun
    ? `The adapter timestamp for ${check} was outside this run interval; the probe remains unverified.`
    : complete
      ? raw.observation.trim()
      : `Adapter evidence was incomplete for ${check}; the probe remains ${finalStatus}.`;

  return {
    id: expectedProbeId(check, viewport),
    check,
    status: finalStatus,
    viewport,
    observedAt,
    observation,
    artifacts: artifacts.length > 0 ? artifacts : fallback,
    findingIds: [],
  };
}

const CHECK_LENSES = Object.freeze({
  responsive: ["responsive-resilience"],
  keyboard: ["accessibility"],
  accessibility: ["accessibility"],
  "reduced-motion": ["timing-cohesion"],
  loading: ["response", "performance"],
  error: ["response"],
  "repeated-action": ["interruptibility"],
});

function sourceFindingIdsFor(check, sourceReport) {
  const lenses = new Set(CHECK_LENSES[check] || []);
  return sourceReport.findings
    .filter((finding) => finding.status === "unverified" && (
      lenses.has(finding.lens) || finding.id === "runtime-evidence-not-collected"
    ))
    .map((finding) => finding.id);
}

function findingsFor(probes, sourceReport) {
  const findings = [];
  for (const probe of probes) {
    if (probe.status === "pass") continue;
    const id = `${probe.status}-${probe.id}`;
    probe.findingIds.push(id);
    findings.push({
      id,
      probeId: probe.id,
      sourceFindingIds: sourceFindingIdsFor(probe.check, sourceReport),
      status: probe.status === "fail" ? "confirmed" : "unverified",
      title: probe.status === "fail"
        ? `${probe.check} check failed at ${probe.viewport}`
        : `${probe.check} check needs evidence at ${probe.viewport}`,
      observation: probe.observation,
      artifacts: probe.artifacts,
    });
  }
  return findings;
}

function summaryFor(probes) {
  const passed = probes.filter((probe) => probe.status === "pass").length;
  const failed = probes.filter((probe) => probe.status === "fail").length;
  const unverified = probes.filter((probe) => probe.status === "unverified").length;
  if (failed > 0) {
    return { status: "fail", passed, failed, unverified, nextAction: "Fix the confirmed failures, then run the same adapter profile again." };
  }
  if (unverified > 0) {
    return { status: "unverified", passed, failed, unverified, nextAction: "Collect the missing artifacts and rerun every unverified probe." };
  }
  return { status: "pass", passed, failed, unverified, nextAction: "Preserve this run with the implementation handoff evidence." };
}

function unavailableProbes({ viewports, completedAt, outputFile, reason }) {
  return viewports.flatMap((viewport) => BROWSER_CHECKS.map((check) => ({
    id: expectedProbeId(check, viewport.name),
    check,
    status: "unverified",
    viewport: viewport.name,
    observedAt: completedAt,
    observation: reason,
    artifacts: fallbackArtifact(outputFile),
    findingIds: [],
  })));
}

function normalizedProbes({ payload, viewports, runDir, outputFile, startedAt, completedAt }) {
  const byKey = new Map();
  const duplicates = new Set();
  for (const raw of payload.probes) {
    const key = `${raw?.check}:${raw?.viewport}`;
    if (byKey.has(key)) {
      duplicates.add(key);
      continue;
    }
    byKey.set(key, raw);
  }
  return viewports.flatMap((viewport) => BROWSER_CHECKS.map((check) => normalizeProbe({
    raw: duplicates.has(`${check}:${viewport.name}`) ? null : byKey.get(`${check}:${viewport.name}`),
    check,
    viewport: viewport.name,
    runDir,
    outputFile,
    startedAt,
    completedAt,
  })));
}

export async function runBrowserVerification(options) {
  if (!options?.approved) {
    throw new Error("Refusing to start browser verification without --yes");
  }
  if (process.platform === "win32") {
    throw new Error("browser verification adapters currently require macOS or Linux process-group control");
  }
  if (typeof options.url !== "string" || !options.url.trim()) {
    throw new Error("browser verification requires --url");
  }
  const target = new URL(options.url);
  if (!new Set(["http:", "https:"]).has(target.protocol) || target.username || target.password) {
    throw new Error("browser verification requires an http(s) URL without embedded credentials");
  }
  if (!isLoopback(target.hostname)) {
    throw new Error("browser verification currently accepts loopback URLs only");
  }
  if (typeof options.adapter !== "string" || !options.adapter.trim()) {
    throw new Error("browser verification requires --adapter");
  }
  if (typeof options.approvalRef !== "string" || !options.approvalRef.trim()) {
    throw new Error("browser verification requires --approval-ref");
  }

  const input = readInputReport(options.reportPath);
  const targetRoot = readTargetRoot(options.targetRoot);

  const viewports = selectedViewports(options.viewports);
  const startedAt = normalizedTimestamp(options.now?.() || new Date());
  const id = runIdAt(startedAt, (options.randomUUID || randomUUID)());
  const evidenceRoot = path.resolve(options.evidenceRoot || browserEvidenceRoot());
  if (contains(targetRoot, evidenceRoot)) {
    throw new Error("browser verification evidence directory must stay outside the target root");
  }
  mkdirSync(evidenceRoot, { recursive: true, mode: 0o700 });
  const realEvidenceRoot = realpathSync(evidenceRoot);
  if (contains(targetRoot, realEvidenceRoot)) {
    throw new Error("browser verification evidence directory resolves inside the target root");
  }
  const runDir = path.join(realEvidenceRoot, id);
  mkdirSync(runDir, { mode: 0o700 });

  const request = adapterRequest({ runId: id, url: target.href, runDir, viewports });
  const requestFile = path.join(runDir, "request.json");
  const outputFile = path.join(runDir, "adapter-output.json");
  const logFile = path.join(runDir, "adapter.log");
  const reportFile = path.join(runDir, "browser-verification.json");
  writeFileSync(requestFile, `${JSON.stringify(request, null, 2)}\n`, { mode: 0o600 });

  const execution = await executeAdapter({
    command: options.adapter,
    args: options.adapterArgs || [],
    request,
    timeoutMs: options.timeoutMs || DEFAULT_TIMEOUT_MS,
    terminationGraceMs: options.terminationGraceMs || TERMINATION_GRACE_MS,
  });
  writeFileSync(outputFile, execution.stdout || `${JSON.stringify({ error: execution.reason || "No adapter output" }, null, 2)}\n`, { mode: 0o600 });
  writeFileSync(logFile, execution.stderr || execution.reason || "Adapter completed without stderr output.\n", { mode: 0o600 });

  const completedAt = normalizedTimestamp(options.now?.() || new Date());
  const parsed = parseAdapterPayload(execution, request.networkPolicy);
  const probes = parsed.ok
    ? normalizedProbes({ payload: parsed.payload, viewports, runDir, outputFile, startedAt, completedAt })
    : unavailableProbes({ viewports, completedAt, outputFile, reason: parsed.reason });
  const findings = findingsFor(probes, input.report);
  const postRunDigestMatch = sha256(readFileSync(input.path)) === input.sha256;
  if (!postRunDigestMatch) {
    const incidentFile = path.join(runDir, "boundary-violation.json");
    writeFileSync(incidentFile, `${JSON.stringify({
      kind: "design-ai-browser-boundary-violation",
      sourceReport: input.path,
      observation: "The source quality report changed while the external adapter was running.",
    }, null, 2)}\n`, { mode: 0o600 });
    throw new Error(`browser adapter changed the source quality report; evidence: ${incidentFile}`);
  }
  const report = validateBrowserVerification({
    kind: "design-ai-browser-verification",
    schemaVersion: 1,
    sourceReport: { path: input.path, sha256: input.sha256, postRunDigestMatch: true },
    approval: { status: "approved", reference: options.approvalRef.trim() },
    run: {
      id,
      url: target.href,
      startedAt,
      completedAt,
      tool: parsed.ok
        ? { name: parsed.payload.tool.name.trim(), version: parsed.payload.tool.version.trim() }
        : { name: path.basename(options.adapter), version: "unavailable" },
    },
    boundary: {
      mode: "local-evidence-write",
      targetRoot,
      requestedNetworkPolicy: request.networkPolicy,
      adapterAttestation: {
        networkPolicy: parsed.ok ? "attested" : "unverified",
        targetRepoMutation: "unverified",
        externalWrites: "unverified",
      },
      sourceReportDigestMatchedAfterRun: true,
      localEvidenceWrites: true,
      localEvidencePath: runDir,
      notes: [
        "The runner confines its own writes to the dedicated Design AI evidence directory.",
        "The runner compares the source report digest after adapter exit; mutation restored before exit remains unverified.",
        "The adapter attests to the requested network policy; Design AI does not sandbox or independently verify it.",
        "Target-repository mutation and external writes by the user-supplied adapter remain unverified.",
      ],
    },
    viewports,
    probes,
    findings,
    summary: summaryFor(probes),
  });
  writeFileSync(reportFile, `${JSON.stringify(report, null, 2)}\n`, { mode: 0o600 });
  return { report, reportFile };
}

export function defaultBrowserViewports() {
  return DEFAULT_VIEWPORTS.map((viewport) => ({ ...viewport }));
}
