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

  function extractStartPlanPayload(value) {
    if (!value || typeof value !== "object") return null;
    if (value.kind !== "design-ai-start" || value.schemaVersion !== 1) return null;
    if (!value.brief || !value.route || !value.route.id) return null;
    if (!value.designContract || value.designContract.kind !== "design-ai-artifact") return null;
    if (value.designContract.schemaVersion !== 1 || value.designContract.mode !== "design-contract") return null;
    if (!value.designContract.route || value.designContract.route.id !== value.route.id) return null;
    if (!value.review || value.review.status !== "playbook-ready-not-run" || value.review.executed !== false) return null;
    if (!value.pathway || !nonEmptyString(value.pathway.command)) return null;

    var performed = value.effects && value.effects.performed;
    if (!performed || !validCorpusReads(performed.reads)) return null;
    if (!emptyArray(performed.localWrites)) return null;
    if (!emptyArray(performed.targetRepoMutations)) return null;
    if (!emptyArray(performed.externalActions)) return null;

    var intended = value.effects && value.effects.intended;
    if (!intended || !Array.isArray(intended.reads)) return null;
    if (!Array.isArray(intended.localWrites)) return null;
    if (!Array.isArray(intended.targetRepoMutations)) return null;
    if (!Array.isArray(intended.externalActions)) return null;
    if (!Array.isArray(value.effects.approvalRequiredBefore)) return null;
    return value;
  }

  function nonEmptyString(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  function validCorpusReads(reads) {
    return Array.isArray(reads) && reads.every(function (read) {
      return read && read.kind === "design-ai-corpus" && nonEmptyString(read.reference);
    });
  }

  function emptyArray(value) {
    return Array.isArray(value) && value.length === 0;
  }

  function normalizeStartPlan(value) {
    var plan = extractStartPlanPayload(value);
    return plan ? JSON.parse(JSON.stringify(plan)) : null;
  }

  function buildStartPlanJson(value) {
    var plan = normalizeStartPlan(value);
    if (!plan) throw new Error("Invalid design-ai start plan");
    return JSON.stringify(plan, null, 2);
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

  function exactKeys(value, keys) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    var actual = Object.keys(value);
    return actual.length === keys.length && keys.every(function (key) {
      return Object.prototype.hasOwnProperty.call(value, key);
    });
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  var REVIEW_WORKFLOW_STAGES = [
    { id: "plan", status: "complete", artifactKind: "design-ai-start" },
    { id: "static-review", status: "complete", artifactKind: "design-ai-quality-report" },
    { id: "browser-verification", status: "not-run", artifactKind: null },
    { id: "implementation-handoff", status: "not-started", artifactKind: null },
  ];

  function isDigest(value) {
    return typeof value === "string" && /^[a-f0-9]{64}$/.test(value);
  }

  function sha256Text(input) {
    // Workflow import is synchronous, so linkage validation uses a small local
    // SHA-256 implementation instead of weakening the contract or adding a dependency.
    var ascii = unescape(encodeURIComponent(input));
    var words = [];
    var hash = [
      1779033703, 3144134277, 1013904242, 2773480762,
      1359893119, 2600822924, 528734635, 1541459225,
    ];
    var constants = [];
    var isComposite = {};
    var candidate = 2;

    for (var primeCount = 0; primeCount < 64; candidate += 1) {
      if (!isComposite[candidate]) {
        for (var multiple = candidate * candidate; multiple < 313; multiple += candidate) isComposite[multiple] = true;
        constants[primeCount] = (Math.pow(candidate, 1 / 3) % 1 * 0x100000000) | 0;
        primeCount += 1;
      }
    }

    var bitLength = ascii.length * 8;
    for (var index = 0; index < ascii.length; index += 1) {
      words[index >> 2] |= ascii.charCodeAt(index) << ((3 - index) % 4) * 8;
    }
    words[bitLength >> 5] |= 0x80 << (24 - bitLength % 32);
    words[((bitLength + 64 >> 9) << 4) + 15] = bitLength;

    for (var block = 0; block < words.length; block += 16) {
      var schedule = words.slice(block, block + 16);
      var working = hash.slice(0);
      for (var round = 0; round < 64; round += 1) {
        var word = round < 16 ? schedule[round] : (
          ((schedule[round - 15] >>> 7) | (schedule[round - 15] << 25))
          ^ ((schedule[round - 15] >>> 18) | (schedule[round - 15] << 14))
          ^ (schedule[round - 15] >>> 3)
        ) + schedule[round - 7] + (
          ((schedule[round - 2] >>> 17) | (schedule[round - 2] << 15))
          ^ ((schedule[round - 2] >>> 19) | (schedule[round - 2] << 13))
          ^ (schedule[round - 2] >>> 10)
        ) + schedule[round - 16];
        schedule[round] = word | 0;
        var sigma1 = ((working[4] >>> 6) | (working[4] << 26))
          ^ ((working[4] >>> 11) | (working[4] << 21))
          ^ ((working[4] >>> 25) | (working[4] << 7));
        var choice = (working[4] & working[5]) ^ (~working[4] & working[6]);
        var temp1 = (working[7] + sigma1 + choice + constants[round] + schedule[round]) | 0;
        var sigma0 = ((working[0] >>> 2) | (working[0] << 30))
          ^ ((working[0] >>> 13) | (working[0] << 19))
          ^ ((working[0] >>> 22) | (working[0] << 10));
        var majority = (working[0] & working[1]) ^ (working[0] & working[2]) ^ (working[1] & working[2]);
        var temp2 = (sigma0 + majority) | 0;
        working = [(temp1 + temp2) | 0, working[0], working[1], working[2], (working[3] + temp1) | 0, working[4], working[5], working[6]];
      }
      for (var hashIndex = 0; hashIndex < 8; hashIndex += 1) hash[hashIndex] = (hash[hashIndex] + working[hashIndex]) | 0;
    }

    return hash.map(function (part) {
      return ("00000000" + (part >>> 0).toString(16)).slice(-8);
    }).join("");
  }

  function reviewWorkflowDigest(value) {
    return sha256Text(JSON.stringify(value));
  }

  function hasCanonicalReviewStages(stages) {
    return Array.isArray(stages) && stages.length === REVIEW_WORKFLOW_STAGES.length
      && stages.every(function (stage, index) {
        var expected = REVIEW_WORKFLOW_STAGES[index];
        return exactKeys(stage, ["id", "status", "artifactKind"])
          && stage.id === expected.id
          && stage.status === expected.status
          && stage.artifactKind === expected.artifactKind;
      });
  }

  function normalizeReviewWorkflow(value) {
    if (!exactKeys(value, [
      "kind", "schemaVersion", "status", "source", "plan", "report", "linkage", "stages", "nextAction", "boundary",
    ])) return null;
    if (value.kind !== "design-ai-review-workflow" || value.schemaVersion !== 1 || value.status !== "static-review-complete") return null;
    if (!exactKeys(value.source, ["reference", "sha256", "bytes"])
      || !hasText(value.source.reference)
      || !isDigest(value.source.sha256)
      || !Number.isInteger(value.source.bytes)
      || value.source.bytes < 1) return null;

    var plan = normalizeStartPlan(value.plan);
    var report = normalizeQualityReport(value.report);
    if (!plan || !report || plan.route.id !== "design-review" || report.context.routeId !== "design-engineering-review") return null;

    if (!exactKeys(value.linkage, [
      "status", "briefMatch", "localeMatch", "viewportMatch", "sourceReferenceMatch", "planSha256", "designContractSha256", "reportSha256",
    ]) || value.linkage.status !== "pass") return null;
    var linkageFlags = ["briefMatch", "localeMatch", "viewportMatch", "sourceReferenceMatch"];
    for (var linkageIndex = 0; linkageIndex < linkageFlags.length; linkageIndex += 1) {
      if (value.linkage[linkageFlags[linkageIndex]] !== true) return null;
    }
    if (![value.linkage.planSha256, value.linkage.designContractSha256, value.linkage.reportSha256].every(isDigest)) return null;
    if (plan.brief !== report.context.brief
      || plan.context.locale !== report.context.locale
      || JSON.stringify(plan.context.viewports) !== JSON.stringify(report.context.viewports)
      || value.source.reference !== report.subject.source
      || !report.sources[0]
      || report.sources[0].reference !== value.source.reference
      || value.linkage.planSha256 !== reviewWorkflowDigest(value.plan)
      || value.linkage.designContractSha256 !== reviewWorkflowDigest(value.plan.designContract)
      || value.linkage.reportSha256 !== reviewWorkflowDigest(value.report)) return null;

    if (!hasCanonicalReviewStages(value.stages)) return null;
    if (!exactKeys(value.nextAction, ["id", "status", "summary", "approvalRequiredBefore"])
      || value.nextAction.id !== "human-review-required"
      || value.nextAction.status !== "pending"
      || value.nextAction.summary !== report.summary.nextAction
      || JSON.stringify(value.nextAction.approvalRequiredBefore) !== JSON.stringify(report.approval.requiredBefore)) return null;
    if (!exactKeys(value.boundary, ["mode", "localWrites", "targetRepoMutation", "externalWrites"])
      || value.boundary.mode !== "read-only"
      || value.boundary.localWrites !== false
      || value.boundary.targetRepoMutation !== false
      || value.boundary.externalWrites !== false) return null;
    return clone(value);
  }

  var QUALITY_LENSES = [
    "purpose-frequency", "response", "spatial-continuity", "interruptibility",
    "timing-cohesion", "performance", "accessibility", "responsive-resilience",
  ];
  var QUALITY_STATUSES = ["pass", "warning", "fail", "unverified"];
  var EVIDENCE_KINDS = ["brief", "code", "runtime", "screenshot", "accessibility", "manual", "design-contract"];
  var BROWSER_CHECKS = [
    "responsive", "keyboard", "accessibility", "reduced-motion", "loading", "error", "repeated-action",
  ];
  var BROWSER_STATUSES = ["pass", "fail", "unverified"];
  var ARTIFACT_KINDS = ["screenshot", "accessibility", "trace", "log", "result"];

  function hasText(value) {
    return typeof value === "string" && /\S/.test(value);
  }

  function isTimestamp(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false;
    var parsed = Date.parse(value);
    return !Number.isNaN(parsed) && new Date(parsed).toISOString() === value;
  }

  function isTextArray(value, allowEmpty) {
    return Array.isArray(value)
      && (allowEmpty !== false || value.length > 0)
      && value.every(hasText);
  }

  function hasUniqueValues(value) {
    return new Set(value).size === value.length;
  }

  function isEvidence(value) {
    return exactKeys(value, ["kind", "reference", "observation"])
      && EVIDENCE_KINDS.includes(value.kind)
      && hasText(value.reference)
      && hasText(value.observation);
  }

  function isEvidenceArray(value) {
    return Array.isArray(value) && value.length > 0 && value.every(isEvidence);
  }

  function expectedQualityStatus(lenses) {
    var statuses = new Set(lenses.map(function (lens) { return lens.status; }));
    if (statuses.has("fail")) return "fail";
    if (statuses.has("warning")) return "warning";
    if (statuses.has("unverified")) return "unverified";
    return "pass";
  }

  function normalizeQualityReport(value) {
    if (!exactKeys(value, [
      "kind", "schemaVersion", "generatedAt", "subject", "context", "boundary",
      "sources", "lenses", "findings", "summary", "approval",
    ])) return null;
    if (value.kind !== "design-ai-quality-report" || value.schemaVersion !== 1) return null;
    if (!isTimestamp(value.generatedAt)) return null;
    if (!exactKeys(value.subject, ["name", "type", "source"])
      || !hasText(value.subject.name)
      || !["artifact", "component", "flow", "page", "application"].includes(value.subject.type)
      || !hasText(value.subject.source)) return null;
    if (!exactKeys(value.context, ["brief", "routeId", "locale", "viewports"])) return null;
    if (![value.context.brief, value.context.routeId, value.context.locale].every(hasText)
      || !isTextArray(value.context.viewports, false)
      || !hasUniqueValues(value.context.viewports)) return null;
    if (!exactKeys(value.boundary, [
      "mode", "targetRepoMutation", "externalWrites", "localEvidenceWrites", "localEvidencePath", "notes",
    ])) return null;
    if (!["read-only", "local-evidence-write"].includes(value.boundary.mode)
      || value.boundary.targetRepoMutation !== false
      || value.boundary.externalWrites !== false
      || typeof value.boundary.localEvidenceWrites !== "boolean"
      || !isTextArray(value.boundary.notes, true)) return null;
    if (value.boundary.mode === "read-only"
      && (value.boundary.localEvidenceWrites !== false || value.boundary.localEvidencePath !== null)) return null;
    if (value.boundary.mode === "local-evidence-write"
      && (value.boundary.localEvidenceWrites !== true || !hasText(value.boundary.localEvidencePath))) return null;
    if (!isEvidenceArray(value.sources) || !Array.isArray(value.lenses) || value.lenses.length !== QUALITY_LENSES.length) return null;
    if (!value.lenses.every(function (lens) {
      return exactKeys(lens, ["id", "status", "summary", "evidence"])
        && QUALITY_LENSES.includes(lens.id)
        && QUALITY_STATUSES.includes(lens.status)
        && hasText(lens.summary)
        && isEvidenceArray(lens.evidence);
    })) return null;
    if (!hasUniqueValues(value.lenses.map(function (lens) { return lens.id; }))) return null;
    if (!QUALITY_LENSES.every(function (id) { return value.lenses.some(function (lens) { return lens.id === id; }); })) return null;
    if (!Array.isArray(value.findings) || !value.findings.every(function (finding) {
      return exactKeys(finding, [
        "id", "lens", "severity", "status", "title", "location", "before", "after", "why", "evidence", "verification",
      ])
        && [finding.id, finding.title, finding.location, finding.before, finding.after, finding.why].every(hasText)
        && QUALITY_LENSES.includes(finding.lens)
        && ["p0", "p1", "p2", "p3"].includes(finding.severity)
        && ["confirmed", "unverified"].includes(finding.status)
        && isEvidenceArray(finding.evidence)
        && isTextArray(finding.verification, false);
    })) return null;
    if (!hasUniqueValues(value.findings.map(function (finding) { return finding.id; }))) return null;
    var lensStatus = new Map(value.lenses.map(function (lens) { return [lens.id, lens.status]; }));
    if (value.findings.some(function (finding) {
      return lensStatus.get(finding.lens) === "pass"
        || (finding.status === "confirmed" && lensStatus.get(finding.lens) === "unverified")
        || (finding.status === "confirmed" && finding.severity === "p0" && lensStatus.get(finding.lens) !== "fail");
    })) return null;
    if (!exactKeys(value.summary, [
      "status", "confirmedFindings", "unverifiedFindings", "blockingFindings", "nextAction",
    ])) return null;
    if (value.summary.status !== expectedQualityStatus(value.lenses) || !hasText(value.summary.nextAction)) return null;
    if (value.summary.confirmedFindings !== value.findings.filter(function (finding) {
      return finding && finding.status === "confirmed";
    }).length) return null;
    if (value.summary.unverifiedFindings !== value.findings.filter(function (finding) {
      return finding && finding.status === "unverified";
    }).length) return null;
    if (value.summary.blockingFindings !== value.findings.filter(function (finding) {
      return finding && finding.severity === "p0";
    }).length) return null;
    if (!exactKeys(value.approval, ["status", "requiredBefore"])
      || !["not-required", "pending", "approved"].includes(value.approval.status)
      || !isTextArray(value.approval.requiredBefore, true)) return null;
    if (value.approval.status === "pending" && value.approval.requiredBefore.length === 0) return null;
    if (value.approval.status === "not-required" && value.approval.requiredBefore.length > 0) return null;
    return clone(value);
  }

  function isRelativeArtifactPath(value) {
    if (!hasText(value) || /^(?:[\\/]|[A-Za-z]:[\\/])/.test(value)) return false;
    return !value.split(/[\\/]/).includes("..");
  }

  function isBrowserArtifact(value) {
    return exactKeys(value, ["kind", "path"])
      && ARTIFACT_KINDS.includes(value.kind)
      && isRelativeArtifactPath(value.path);
  }

  function normalizeBrowserVerification(value) {
    if (!exactKeys(value, [
      "kind", "schemaVersion", "sourceReport", "approval", "run", "boundary",
      "viewports", "probes", "findings", "summary",
    ])) return null;
    if (value.kind !== "design-ai-browser-verification" || value.schemaVersion !== 1) return null;
    if (!exactKeys(value.sourceReport, ["path", "sha256", "postRunDigestMatch"])) return null;
    if (!hasText(value.sourceReport.path) || !/^[a-f0-9]{64}$/.test(String(value.sourceReport.sha256 || ""))) return null;
    if (value.sourceReport.postRunDigestMatch !== true) return null;
    if (!exactKeys(value.approval, ["status", "reference"])
      || value.approval.status !== "approved"
      || !hasText(value.approval.reference)) return null;
    if (!exactKeys(value.run, ["id", "url", "startedAt", "completedAt", "tool"])
      || !hasText(value.run.id)
      || !hasText(value.run.url)
      || !isTimestamp(value.run.startedAt)
      || !isTimestamp(value.run.completedAt)
      || value.run.completedAt < value.run.startedAt
      || !exactKeys(value.run.tool, ["name", "version"])
      || !hasText(value.run.tool.name)
      || !hasText(value.run.tool.version)) return null;
    if (!exactKeys(value.boundary, [
      "mode", "targetRoot", "requestedNetworkPolicy", "adapterAttestation",
      "sourceReportDigestMatchedAfterRun", "localEvidenceWrites", "localEvidencePath", "notes",
    ])) return null;
    if (value.boundary.mode !== "local-evidence-write"
      || !hasText(value.boundary.targetRoot)
      || value.boundary.sourceReportDigestMatchedAfterRun !== true
      || value.boundary.localEvidenceWrites !== true
      || !hasText(value.boundary.localEvidencePath)
      || !isTextArray(value.boundary.notes, true)) return null;
    var policy = value.boundary.requestedNetworkPolicy;
    if (!exactKeys(policy, ["allowedOrigin", "allowedMethods", "blockCrossOrigin", "blockWebSockets", "blockDownloads"])
      || !hasText(policy.allowedOrigin)
      || JSON.stringify(policy.allowedMethods) !== JSON.stringify(["GET", "HEAD"])
      || policy.blockCrossOrigin !== true
      || policy.blockWebSockets !== true
      || policy.blockDownloads !== true) return null;
    var attestation = value.boundary.adapterAttestation;
    if (!exactKeys(attestation, ["networkPolicy", "targetRepoMutation", "externalWrites"])
      || !["attested", "unverified"].includes(attestation.networkPolicy)
      || attestation.targetRepoMutation !== "unverified"
      || attestation.externalWrites !== "unverified") return null;
    if (!Array.isArray(value.viewports) || value.viewports.length === 0 || !value.viewports.every(function (viewport) {
      return exactKeys(viewport, ["name", "width", "height"])
        && typeof viewport.name === "string"
        && /^[a-z0-9][a-z0-9-]*$/i.test(viewport.name)
        && Number.isInteger(viewport.width)
        && viewport.width >= 240
        && Number.isInteger(viewport.height)
        && viewport.height >= 240;
    })) return null;
    var viewportNames = value.viewports.map(function (viewport) { return viewport.name; });
    if (!hasUniqueValues(viewportNames)) return null;
    if (!Array.isArray(value.probes) || value.probes.length === 0 || !value.probes.every(function (probe) {
      var artifactsValid = Array.isArray(probe.artifacts) && probe.artifacts.length > 0 && probe.artifacts.every(isBrowserArtifact);
      var requiredKind = probe.check === "responsive" ? "screenshot" : probe.check === "accessibility" ? "accessibility" : null;
      return exactKeys(probe, ["id", "check", "status", "viewport", "observedAt", "observation", "artifacts", "findingIds"])
        && hasText(probe.id)
        && BROWSER_CHECKS.includes(probe.check)
        && BROWSER_STATUSES.includes(probe.status)
        && viewportNames.includes(probe.viewport)
        && probe.id === probe.check + ":" + probe.viewport
        && isTimestamp(probe.observedAt)
        && probe.observedAt >= value.run.startedAt
        && probe.observedAt <= value.run.completedAt
        && hasText(probe.observation)
        && artifactsValid
        && !(probe.status === "pass" && requiredKind && !probe.artifacts.some(function (artifact) { return artifact.kind === requiredKind; }))
        && isTextArray(probe.findingIds, true)
        && hasUniqueValues(probe.findingIds);
    })) return null;
    if (!hasUniqueValues(value.probes.map(function (probe) { return probe.id; }))) return null;
    if (value.viewports.some(function (viewport) {
      return BROWSER_CHECKS.some(function (check) {
        return value.probes.filter(function (probe) { return probe.viewport === viewport.name && probe.check === check; }).length !== 1;
      });
    })) return null;
    var probeIds = value.probes.map(function (probe) { return probe.id; });
    if (!Array.isArray(value.findings) || !value.findings.every(function (finding) {
      return exactKeys(finding, ["id", "probeId", "sourceFindingIds", "status", "title", "observation", "artifacts"])
        && hasText(finding.id)
        && probeIds.includes(finding.probeId)
        && isTextArray(finding.sourceFindingIds, true)
        && hasUniqueValues(finding.sourceFindingIds)
        && ["confirmed", "unverified"].includes(finding.status)
        && hasText(finding.title)
        && hasText(finding.observation)
        && Array.isArray(finding.artifacts)
        && finding.artifacts.length > 0
        && finding.artifacts.every(isBrowserArtifact);
    })) return null;
    var findingIds = value.findings.map(function (finding) { return finding.id; });
    if (!hasUniqueValues(findingIds)) return null;
    if (value.probes.some(function (probe) {
      var linked = value.findings.filter(function (finding) { return finding.probeId === probe.id; });
      var expectedCount = probe.status === "pass" ? 0 : 1;
      if (linked.length !== expectedCount || probe.findingIds.length !== expectedCount) return true;
      return probe.findingIds.some(function (findingId) {
        var finding = value.findings.find(function (item) { return item.id === findingId; });
        var expectedStatus = probe.status === "fail" ? "confirmed" : "unverified";
        return !finding || finding.probeId !== probe.id || finding.status !== expectedStatus;
      });
    })) return null;
    if (!exactKeys(value.summary, ["status", "passed", "failed", "unverified", "nextAction"])) return null;
    var counts = {
      passed: value.probes.filter(function (probe) { return probe.status === "pass"; }).length,
      failed: value.probes.filter(function (probe) { return probe.status === "fail"; }).length,
      unverified: value.probes.filter(function (probe) { return probe.status === "unverified"; }).length,
    };
    var expectedStatus = counts.failed > 0 ? "fail" : counts.unverified > 0 ? "unverified" : "pass";
    if (value.summary.status !== expectedStatus
      || value.summary.passed !== counts.passed
      || value.summary.failed !== counts.failed
      || value.summary.unverified !== counts.unverified
      || !hasText(value.summary.nextAction)) return null;
    return clone(value);
  }

  function normalizeReviewHandoffArtifact(value, normalizeValue) {
    if (!exactKeys(value, ["reference", "sha256", "bytes", "source", "value"])) return null;
    if (!hasText(value.reference)
      || !isDigest(value.sha256)
      || !Number.isInteger(value.bytes)
      || value.bytes < 1
      || !hasText(value.source)) return null;
    var sourceBytes = unescape(encodeURIComponent(value.source)).length;
    if (sourceBytes !== value.bytes || sha256Text(value.source) !== value.sha256) return null;
    var parsed;
    try {
      parsed = JSON.parse(value.source);
    } catch (error) {
      return null;
    }
    var normalized = normalizeValue(parsed);
    if (!normalized
      || JSON.stringify(normalized) !== JSON.stringify(value.value)
      || JSON.stringify(parsed) !== JSON.stringify(value.value)) return null;
    return clone(value);
  }

  function expectedReviewHandoffStages(hasBrowserVerification) {
    return [
      { id: "plan", status: "complete", artifactKind: "design-ai-start" },
      { id: "static-review", status: "complete", artifactKind: "design-ai-quality-report" },
      {
        id: "browser-verification",
        status: hasBrowserVerification ? "complete" : "not-run",
        artifactKind: hasBrowserVerification ? "design-ai-browser-verification" : null,
      },
      { id: "implementation-handoff", status: "prepared", artifactKind: "design-ai-review-handoff" },
    ];
  }

  function normalizeReviewHandoff(value) {
    if (!exactKeys(value, [
      "kind", "schemaVersion", "status", "recipient", "artifacts", "linkage", "stages", "nextAction", "boundary",
    ])) return null;
    if (value.kind !== "design-ai-review-handoff" || value.schemaVersion !== 1) return null;
    if (!exactKeys(value.recipient, ["name", "delivery", "consumerValidation"])
      || !hasText(value.recipient.name)
      || value.recipient.delivery !== "not-delivered"
      || value.recipient.consumerValidation !== "pending") return null;
    if (!exactKeys(value.artifacts, ["reviewWorkflow", "qualityReport", "browserVerification"])) return null;

    var workflowArtifact = normalizeReviewHandoffArtifact(value.artifacts.reviewWorkflow, normalizeReviewWorkflow);
    if (!workflowArtifact) return null;
    var hasBrowserVerification = value.artifacts.browserVerification !== null;
    if ((value.artifacts.qualityReport !== null) !== hasBrowserVerification) return null;
    var qualityArtifact = null;
    var browserArtifact = null;
    if (hasBrowserVerification) {
      qualityArtifact = normalizeReviewHandoffArtifact(value.artifacts.qualityReport, normalizeQualityReport);
      browserArtifact = normalizeReviewHandoffArtifact(
        value.artifacts.browserVerification,
        normalizeBrowserVerification,
      );
      if (!qualityArtifact || !browserArtifact) return null;
    }

    var expectedStatus = hasBrowserVerification ? "browser-evidence-prepared" : "static-evidence-prepared";
    if (value.status !== expectedStatus) return null;
    if (!exactKeys(value.linkage, [
      "status", "reviewWorkflowArtifactSha256", "qualityReportArtifactSha256",
      "browserVerificationArtifactSha256", "qualityReportArtifactMatch",
      "browserSourceReportMatch", "viewportCoverage",
    ]) || value.linkage.status !== "pass") return null;
    if (value.linkage.reviewWorkflowArtifactSha256 !== reviewWorkflowDigest(workflowArtifact.value)
      || value.linkage.qualityReportArtifactSha256 !== workflowArtifact.value.linkage.reportSha256) return null;

    if (hasBrowserVerification) {
      var declaredViewports = workflowArtifact.value.report.context.viewports.slice().sort();
      var observedViewports = browserArtifact.value.viewports.map(function (viewport) {
        return viewport.name;
      }).sort();
      if (JSON.stringify(qualityArtifact.value) !== JSON.stringify(workflowArtifact.value.report)
        || browserArtifact.value.sourceReport.sha256 !== qualityArtifact.sha256
        || JSON.stringify(observedViewports) !== JSON.stringify(declaredViewports)
        || value.linkage.browserVerificationArtifactSha256 !== reviewWorkflowDigest(browserArtifact.value)
        || value.linkage.qualityReportArtifactMatch !== true
        || value.linkage.browserSourceReportMatch !== true
        || value.linkage.viewportCoverage !== "pass") return null;
    } else if (value.linkage.browserVerificationArtifactSha256 !== null
      || value.linkage.qualityReportArtifactMatch !== null
      || value.linkage.browserSourceReportMatch !== null
      || value.linkage.viewportCoverage !== "not-run") return null;

    var expectedStages = expectedReviewHandoffStages(hasBrowserVerification);
    if (JSON.stringify(value.stages) !== JSON.stringify(expectedStages)) return null;
    if (!exactKeys(value.nextAction, ["id", "status", "summary", "approvalRequiredBefore"])
      || value.nextAction.id !== "consumer-validation-required"
      || value.nextAction.status !== "pending"
      || !hasText(value.nextAction.summary)
      || !isTextArray(value.nextAction.approvalRequiredBefore, true)) return null;
    var browserVerificationPassed = hasBrowserVerification
      && browserArtifact.value.summary.status === "pass";
    var expectedApprovals = workflowArtifact.value.nextAction.approvalRequiredBefore.filter(function (requirement) {
      return !browserVerificationPassed || !requirement.toLowerCase().includes("browser");
    });
    if (JSON.stringify(value.nextAction.approvalRequiredBefore) !== JSON.stringify(expectedApprovals)) return null;
    if (!exactKeys(value.boundary, ["mode", "localWrites", "targetRepoMutation", "externalWrites", "deliveryPerformed"])
      || value.boundary.mode !== "read-only"
      || value.boundary.localWrites !== false
      || value.boundary.targetRepoMutation !== false
      || value.boundary.externalWrites !== false
      || value.boundary.deliveryPerformed !== false) return null;
    return clone(value);
  }

  function normalizeReviewHandoffReceipt(value) {
    if (!exactKeys(value, [
      "kind", "schemaVersion", "status", "consumer", "handoff", "evidence",
      "remainingApprovals", "nextAction", "boundary",
    ])) return null;
    if (value.kind !== "design-ai-review-handoff-receipt"
      || value.schemaVersion !== 1
      || value.status !== "contract-validated") return null;
    var handoffArtifact = normalizeReviewHandoffArtifact(value.handoff, normalizeReviewHandoff);
    if (!handoffArtifact) return null;
    if (!exactKeys(value.consumer, [
      "name", "expectedRecipient", "recipientMatch", "identity", "contractValidation", "acceptance",
    ])
      || !hasText(value.consumer.name)
      || value.consumer.expectedRecipient !== handoffArtifact.value.recipient.name
      || value.consumer.name !== value.consumer.expectedRecipient
      || value.consumer.recipientMatch !== true
      || value.consumer.identity !== "self-declared"
      || value.consumer.contractValidation !== "pass"
      || value.consumer.acceptance !== "not-claimed") return null;

    var reportSummary = handoffArtifact.value.artifacts.reviewWorkflow.value.report.summary;
    var browserStatus = handoffArtifact.value.artifacts.browserVerification
      ? handoffArtifact.value.artifacts.browserVerification.value.summary.status
      : "not-run";
    if (!exactKeys(value.evidence, [
      "qualityStatus", "confirmedFindings", "unverifiedFindings", "browserStatus",
    ])
      || value.evidence.qualityStatus !== reportSummary.status
      || value.evidence.confirmedFindings !== reportSummary.confirmedFindings
      || value.evidence.unverifiedFindings !== reportSummary.unverifiedFindings
      || value.evidence.browserStatus !== browserStatus) return null;
    if (!isTextArray(value.remainingApprovals, true)
      || JSON.stringify(value.remainingApprovals)
        !== JSON.stringify(handoffArtifact.value.nextAction.approvalRequiredBefore)) return null;
    if (!exactKeys(value.nextAction, ["id", "status", "summary", "implementationAuthorized"])
      || value.nextAction.id !== "target-repo-intake-required"
      || value.nextAction.status !== "pending"
      || !hasText(value.nextAction.summary)
      || value.nextAction.implementationAuthorized !== false) return null;
    if (!exactKeys(value.boundary, [
      "mode", "localWrites", "targetRepoMutation", "externalWrites", "transportVerified",
      "consumerIdentityVerified", "acceptanceRecorded", "implementationStarted",
    ])
      || value.boundary.mode !== "read-only"
      || value.boundary.localWrites !== false
      || value.boundary.targetRepoMutation !== false
      || value.boundary.externalWrites !== false
      || value.boundary.transportVerified !== false
      || value.boundary.consumerIdentityVerified !== false
      || value.boundary.acceptanceRecorded !== false
      || value.boundary.implementationStarted !== false) return null;
    return clone(value);
  }

  function buildImportedArtifactJson(value, rawJson) {
    var raw = String(rawJson || "");
    if (raw) {
      try {
        if (JSON.stringify(JSON.parse(raw)) === JSON.stringify(value)) return raw;
      } catch (error) {
        // Fall through to the normalized representation.
      }
    }
    return JSON.stringify(value, null, 2);
  }

  global.DesignAiWebsiteConsoleSourceBundle = Object.freeze({
    normalizeStartPlan: normalizeStartPlan,
    extractStartPlanPayload: extractStartPlanPayload,
    buildStartPlanJson: buildStartPlanJson,
    normalizeRunbookSourceBundle: normalizeRunbookSourceBundle,
    extractSourceBundleProvenancePayload: extractSourceBundleProvenancePayload,
    extractSourceBundleRevalidationGatePayload: extractSourceBundleRevalidationGatePayload,
    sourceBundleNeedsRevalidation: sourceBundleNeedsRevalidation,
    buildSourceBundleRevalidationGate: buildSourceBundleRevalidationGate,
    buildSourceBundleJson: buildSourceBundleJson,
    buildSourceBundleRevalidationGateJson: buildSourceBundleRevalidationGateJson,
    normalizeQualityReport: normalizeQualityReport,
    normalizeReviewWorkflow: normalizeReviewWorkflow,
    normalizeReviewHandoff: normalizeReviewHandoff,
    normalizeReviewHandoffReceipt: normalizeReviewHandoffReceipt,
    normalizeBrowserVerification: normalizeBrowserVerification,
    buildImportedArtifactJson: buildImportedArtifactJson,
  });
})(typeof window !== "undefined" ? window : globalThis);
