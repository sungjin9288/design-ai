// Shared test helpers for the workspace.* test suite.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

export function ok(stdout = "") {
  return { ok: true, status: 0, stdout, stderr: "", error: "" };
}


export function fail(stderr = "") {
  return { ok: false, status: 1, stdout: "", stderr, error: "" };
}


export function fakeGit(responses) {
  return (args) => responses[args.join(" ")] || fail("unexpected git command");
}


export function withTempDir(fn) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-ai-workspace-"));
  const cleanup = () => rmSync(dir, { recursive: true, force: true });
  try {
    const result = fn(dir);
    if (result && typeof result.then === "function") {
      return result.finally(cleanup);
    }
    cleanup();
    return result;
  } catch (error) {
    cleanup();
    throw error;
  }
}

export function writeSourceMetadata(sourceRoot, scripts = {}) {
  mkdirSync(path.join(sourceRoot, ".claude-plugin"), { recursive: true });
  writeFileSync(
    path.join(sourceRoot, "package.json"),
    JSON.stringify({
      name: "@design-ai/cli",
      version: "4.13.0",
      repository: { type: "git", url: "git+https://github.com/sungjin9288/design-ai.git" },
      homepage: "https://github.com/sungjin9288/design-ai#readme",
      bugs: { url: "https://github.com/sungjin9288/design-ai/issues" },
      scripts,
    }),
    "utf8",
  );
  writeFileSync(
    path.join(sourceRoot, ".claude-plugin", "plugin.json"),
    JSON.stringify({
      version: "4.13.0",
      homepage: "https://github.com/sungjin9288/design-ai",
      repository: "https://github.com/sungjin9288/design-ai",
    }),
    "utf8",
  );
}


export function fullReleaseScripts() {
  return {
    test: "node --test cli/lib/*.test.mjs",
    "audit:strict": "python3 -B tools/audit/run-all.py --strict",
    "release:metadata": "python3 -B tools/audit/release-metadata.py",
    "release:self-test": "npm run smoke:assertions:self-test",
    "package:smoke": "python3 -B tools/audit/package-smoke.py --pack",
    "release:check": "npm test && npm run audit:strict",
    "ci:local": "python3 -B tools/audit/local-ci.py",
  };
}

export async function captureConsole(fn) {
  const lines = [];
  const originalLog = console.log;
  const originalExitCode = process.exitCode;
  console.log = (...args) => {
    lines.push(args.join(" "));
  };
  process.exitCode = undefined;
  try {
    await fn();
    return {
      stdout: lines.join("\n"),
      exitCode: process.exitCode,
    };
  } finally {
    console.log = originalLog;
    process.exitCode = originalExitCode;
  }
}

export async function captureStdout(fn) {
  const { stdout } = await captureConsole(fn);
  return stdout;
}
