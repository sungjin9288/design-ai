// Generated bundle contract helpers for Website Improvement handoff bundles.

import {
  existsSync,
  readFileSync,
  statSync,
} from "node:fs";
import path from "node:path";

import { addIssue } from "./site-analysis.mjs";
import { buildSiteHandoffBundle } from "./site-bundle-build.mjs";
import { SITE_BUNDLE_CHECKSUM_FILES } from "./site-content.mjs";
import {
  sha256Hex,
  shortDigest,
} from "./site-bundle-files.mjs";

export function emptyBundleGeneratedContract(source = "") {
  return {
    available: false,
    source: source || "",
    expectedFiles: SITE_BUNDLE_CHECKSUM_FILES.length,
    verifiedFiles: 0,
    driftFiles: [],
    files: [],
  };
}

export function buildBundleGeneratedContract(directory, workspace, source) {
  const contractSource = source || "website-workspace.tasks.json";
  const expectedBundle = buildSiteHandoffBundle(workspace, { filePath: contractSource });
  const expectedFiles = new Map(expectedBundle.files.map((file) => [file.path, file.content]));
  const files = SITE_BUNDLE_CHECKSUM_FILES.map((filePath) => {
    const expectedContent = expectedFiles.get(filePath);
    const expectedDigest = typeof expectedContent === "string" ? sha256Hex(expectedContent) : "";
    const targetPath = path.join(directory, filePath);
    const present = existsSync(targetPath) && statSync(targetPath).isFile();
    const actualDigest = present ? sha256Hex(readFileSync(targetPath, "utf8")) : "";
    return {
      path: filePath,
      present,
      matches: Boolean(present && expectedDigest && actualDigest === expectedDigest),
      expectedDigest,
      actualDigest,
    };
  });
  return {
    available: true,
    source: contractSource,
    expectedFiles: SITE_BUNDLE_CHECKSUM_FILES.length,
    verifiedFiles: files.filter((file) => file.matches).length,
    driftFiles: files.filter((file) => file.present && !file.matches).map((file) => file.path),
    files,
  };
}

export function addBundleGeneratedContractIssues(generatedContract, issues) {
  if (!generatedContract.available) return;
  for (const file of generatedContract.files) {
    if (!file.present || file.matches) continue;
    addIssue(
      issues,
      "fail",
      `bundle-generated-${file.path}`,
      `${file.path} does not match the current CLI-generated bundle contract (expected ${shortDigest(file.expectedDigest)}, actual ${shortDigest(file.actualDigest)})`,
    );
  }
}

export function formatGeneratedContractDriftLines(generatedContract) {
  const driftFiles = generatedContract.files.filter((file) => file.present && !file.matches);
  if (driftFiles.length === 0) return ["- none"];
  return driftFiles.map((file) => `- ${file.path}: expected ${shortDigest(file.expectedDigest)}, actual ${shortDigest(file.actualDigest)}`);
}

export function formatGeneratedContractDriftSummary(generatedContract) {
  if (!generatedContract.driftFiles.length) return "none";
  return generatedContract.driftFiles.join(", ");
}
