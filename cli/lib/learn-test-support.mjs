// Shared test helpers for the learn.* test suite.

import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

export function withTempDir(fn) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-ai-learn-test-"));
  try {
    return fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export async function withTempDirAsync(fn) {
  const dir = mkdtempSync(path.join(tmpdir(), "design-ai-learn-test-"));
  try {
    return await fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

export async function captureStdout(fn) {
  const lines = [];
  const originalLog = console.log;
  console.log = (...args) => {
    lines.push(args.join(" "));
  };
  try {
    await fn();
  } finally {
    console.log = originalLog;
  }
  return lines.join("\n");
}

export async function withLearningEnv({ learningFile, usageFile }, fn) {
  const previousLearningFile = process.env.DESIGN_AI_LEARNING_FILE;
  const previousUsageFile = process.env.DESIGN_AI_LEARNING_USAGE_FILE;
  process.env.DESIGN_AI_LEARNING_FILE = learningFile;
  process.env.DESIGN_AI_LEARNING_USAGE_FILE = usageFile;
  try {
    return await fn();
  } finally {
    if (previousLearningFile === undefined) {
      delete process.env.DESIGN_AI_LEARNING_FILE;
    } else {
      process.env.DESIGN_AI_LEARNING_FILE = previousLearningFile;
    }
    if (previousUsageFile === undefined) {
      delete process.env.DESIGN_AI_LEARNING_USAGE_FILE;
    } else {
      process.env.DESIGN_AI_LEARNING_USAGE_FILE = previousUsageFile;
    }
  }
}
