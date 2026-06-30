// File, digest, and validation helpers for Website Improvement handoff bundles.

import {
  existsSync,
  readFileSync,
  statSync,
} from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

import { SITE_BUNDLE_CHECKSUM_FILES } from "./site-content.mjs";

function addIssue(issues, level, id, message) {
  issues.push({ level, id, message });
}

export function sha256Hex(content) {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

export function shortDigest(digest) {
  return digest ? String(digest).slice(0, 12) : "missing";
}

export function buildBundleDigest(checksumFiles) {
  const manifest = SITE_BUNDLE_CHECKSUM_FILES.map((filePath) => `${filePath}\t${checksumFiles[filePath] || ""}`).join("\n");
  return sha256Hex(`${manifest}\n`);
}

export function buildBundleChecksums(files) {
  const checksumFiles = Object.fromEntries(
    files
      .filter((file) => file.path !== "summary.json")
      .map((file) => [file.path, sha256Hex(file.content)]),
  );
  return {
    algorithm: "sha256",
    bundleDigest: buildBundleDigest(checksumFiles),
    files: checksumFiles,
  };
}

export function readBundleFile(directory, relativePath, issues) {
  const target = path.join(directory, relativePath);
  if (!existsSync(target)) {
    addIssue(issues, "fail", `bundle-missing-${relativePath}`, `Bundle file is missing: ${relativePath}`);
    return null;
  }
  if (!statSync(target).isFile()) {
    addIssue(issues, "fail", `bundle-file-${relativePath}`, `Bundle path must be a file: ${relativePath}`);
    return null;
  }
  return readFileSync(target, "utf8");
}

export function parseBundleJson(directory, relativePath, issues) {
  const text = readBundleFile(directory, relativePath, issues);
  if (text === null) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    addIssue(issues, "fail", `bundle-json-${relativePath}`, `Bundle JSON is invalid in ${relativePath}: ${error.message}`);
    return null;
  }
}

export function arraysEqual(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right)) return false;
  if (left.length !== right.length) return false;
  return left.every((item, index) => item === right[index]);
}

export function addBundleMarkdownIssue(directory, relativePath, fragments, issues) {
  const text = readBundleFile(directory, relativePath, issues);
  if (text === null) return;
  for (const fragment of fragments) {
    if (!text.includes(fragment)) {
      addIssue(issues, "fail", `bundle-markdown-${relativePath}`, `${relativePath} is missing required text: ${fragment}`);
    }
  }
}

export function readBundleTextIfPresent(directory, relativePath) {
  const targetPath = path.join(directory, relativePath);
  if (!existsSync(targetPath) || !statSync(targetPath).isFile()) return "";
  return readFileSync(targetPath, "utf8").trim();
}
