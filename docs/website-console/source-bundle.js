(function (global) {
  "use strict";

  function normalizeRunbookSourceBundle(value) {
    if (!value || typeof value !== "object") return null;
    return {
      directory: String(value.directory || ""),
      sourceWorkspace: String(value.sourceWorkspace || ""),
      siteName: String(value.siteName || ""),
      status: String(value.status || "unknown"),
      valid: value.valid === true,
      workspaceStatus: String(value.workspaceStatus || ""),
      mcpStatus: String(value.mcpStatus || ""),
      mcpProbeStatus: String(value.mcpProbeStatus || ""),
      checksumAlgorithm: String(value.checksumAlgorithm || ""),
      checksumBundleDigest: String(value.checksumBundleDigest || ""),
      verifiedChecksumFiles: Number(value.verifiedChecksumFiles || 0),
      expectedChecksumFiles: Number(value.expectedChecksumFiles || 0),
      verifiedGeneratedFiles: Number(value.verifiedGeneratedFiles || 0),
      expectedGeneratedFiles: Number(value.expectedGeneratedFiles || 0),
      issueCount: Number(value.issueCount || 0),
      warningCount: Number(value.warningCount || 0),
      failureCount: Number(value.failureCount || 0),
      strictCheckCommand: String(value.strictCheckCommand || ""),
      strictHandoffCommand: String(value.strictHandoffCommand || ""),
    };
  }

  function extractSourceBundleProvenancePayload(value) {
    if (!value || typeof value !== "object") return null;
    if (value.type === "website-improvement-source-bundle-provenance") return value.sourceBundle;
    if (!value.siteProfile && !value.operatorRunbook && !(value.bundle && value.bundle.operatorRunbook) && value.sourceBundle) {
      return value.sourceBundle;
    }
    return null;
  }

  function extractSourceBundleRevalidationGatePayload(value) {
    if (!value || typeof value !== "object") return null;
    if (value.type !== "website-improvement-source-bundle-revalidation-gate") return null;
    var sourceBundle = value.sourceBundle && typeof value.sourceBundle === "object" ? value.sourceBundle : {};
    var gate = value.revalidationGate && typeof value.revalidationGate === "object" ? value.revalidationGate : {};
    return {
      directory: sourceBundle.directory || "",
      sourceWorkspace: sourceBundle.sourceWorkspace || "",
      siteName: sourceBundle.siteName || "",
      checksumBundleDigest: sourceBundle.checksumBundleDigest || "",
      status: sourceBundle.status || gate.status || "unknown",
      valid: false,
      failureCount: Number(gate.failureCount || 0),
      warningCount: Number(gate.warningCount || 0),
      issueCount: Number(gate.issueCount || 0),
      strictCheckCommand: gate.strictCheckCommand || "",
    };
  }

  function buildSourceBundleJson(sourceBundle) {
    return JSON.stringify({
      type: "website-improvement-source-bundle-provenance",
      version: 1,
      source: "source-bundle-provenance",
      sourceBundle: sourceBundle || null,
      revalidationGate: buildSourceBundleRevalidationGate(sourceBundle),
    }, null, 2);
  }

  function buildSourceBundleRevalidationGateJson(sourceBundle) {
    return JSON.stringify({
      type: "website-improvement-source-bundle-revalidation-gate",
      version: 1,
      source: "source-bundle-revalidation-gate",
      sourceBundle: sourceBundle ? {
        directory: sourceBundle.directory || "",
        sourceWorkspace: sourceBundle.sourceWorkspace || "",
        siteName: sourceBundle.siteName || "",
        checksumBundleDigest: sourceBundle.checksumBundleDigest || "",
        status: sourceBundle.status || "unknown",
        valid: sourceBundle.valid === true,
      } : null,
      revalidationGate: buildSourceBundleRevalidationGate(sourceBundle),
    }, null, 2);
  }

  function sourceBundleNeedsRevalidation(sourceBundle) {
    if (!sourceBundle) return false;
    return sourceBundle.valid !== true || Number(sourceBundle.failureCount || 0) > 0;
  }

  function buildSourceBundleRevalidationGate(sourceBundle) {
    if (!sourceBundle) {
      return {
        required: false,
        status: "not-provided",
        valid: false,
        failureCount: 0,
        warningCount: 0,
        issueCount: 0,
        strictCheckCommand: "",
        strictCheckCommandAvailable: false,
        reason: "source-bundle-not-provided",
        message: "No source bundle provenance recorded.",
      };
    }
    var failureCount = Number(sourceBundle.failureCount || 0);
    var warningCount = Number(sourceBundle.warningCount || 0);
    var issueCount = Number(sourceBundle.issueCount || 0);
    var required = sourceBundleNeedsRevalidation(sourceBundle);
    var status = (sourceBundle.status || "unknown") + "/" + (sourceBundle.valid ? "valid" : "invalid");
    var strictCheckCommandAvailable = Boolean(sourceBundle.strictCheckCommand);
    return {
      required: required,
      status: status,
      valid: sourceBundle.valid === true,
      failureCount: failureCount,
      warningCount: warningCount,
      issueCount: issueCount,
      strictCheckCommand: String(sourceBundle.strictCheckCommand || ""),
      strictCheckCommandAvailable: strictCheckCommandAvailable,
      reason: required
        ? strictCheckCommandAvailable ? "revalidation-required" : "revalidation-required-command-missing"
        : "revalidation-not-required",
      message: required
        ? "Run the strict bundle check before target-repo execution."
        : "Source bundle revalidation is not required.",
    };
  }

  global.DesignAiWebsiteConsoleSourceBundle = Object.freeze({
    normalizeRunbookSourceBundle: normalizeRunbookSourceBundle,
    extractSourceBundleProvenancePayload: extractSourceBundleProvenancePayload,
    extractSourceBundleRevalidationGatePayload: extractSourceBundleRevalidationGatePayload,
    sourceBundleNeedsRevalidation: sourceBundleNeedsRevalidation,
    buildSourceBundleRevalidationGate: buildSourceBundleRevalidationGate,
    buildSourceBundleJson: buildSourceBundleJson,
    buildSourceBundleRevalidationGateJson: buildSourceBundleRevalidationGateJson,
  });
})(typeof window !== "undefined" ? window : globalThis);
