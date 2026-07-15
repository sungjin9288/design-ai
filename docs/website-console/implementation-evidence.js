(function (global) {
  "use strict";

  var shared = global.DesignAiWebsiteConsoleSourceBundle;
  var scope = global.DesignAiWebsiteConsoleImplementationScope;
  var statuses = ["evidence-complete", "attention-required", "blocked"];

  function object(value) {
    return value && typeof value === "object" && !Array.isArray(value);
  }

  function exactKeys(value, keys) {
    return object(value)
      && JSON.stringify(Object.keys(value).sort()) === JSON.stringify(keys.slice().sort());
  }

  function text(value, allowEmpty) {
    return typeof value === "string" && (allowEmpty || value.trim().length > 0);
  }

  function textList(value) {
    return Array.isArray(value) && value.every(function (item) { return text(item, false); });
  }

  function same(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function canonicalTimestamp(value) {
    if (!text(value, false)) return false;
    var parsed = new Date(value);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
  }

  function safePath(value) {
    return text(value, false)
      && value.charAt(0) !== "/"
      && !/^[A-Za-z]:[\\/]/.test(value)
      && value.split(/[\\/]/).indexOf("..") === -1
      && !/[\\\0\r\n*?]/.test(value);
  }

  function pathList(value) {
    return Array.isArray(value) && value.every(safePath) && new Set(value).size === value.length;
  }

  function normalizeRequest(value) {
    if (!exactKeys(value, [
      "kind", "schemaVersion", "consumer", "implementationStartedAt", "implementationCompletedAt",
      "executedWork", "verificationResults", "observations", "remainingRisks",
    ]) || value.kind !== "design-ai-implementation-evidence-request"
      || value.schemaVersion !== 1
      || !text(value.consumer, false)
      || !canonicalTimestamp(value.implementationStartedAt)
      || !canonicalTimestamp(value.implementationCompletedAt)
      || value.implementationCompletedAt < value.implementationStartedAt) return null;

    if (!Array.isArray(value.executedWork) || value.executedWork.length === 0
      || !value.executedWork.every(function (item) {
        return exactKeys(item, ["statusEntry", "path", "summary"])
          && text(item.statusEntry, false) && !/[\0\r\n]/.test(item.statusEntry)
          && safePath(item.path) && text(item.summary, false);
      })) return null;
    var workPaths = value.executedWork.map(function (item) { return item.path; });
    if (new Set(workPaths).size !== workPaths.length) return null;

    if (!Array.isArray(value.verificationResults) || !value.verificationResults.every(function (item) {
      if (!exactKeys(item, ["command", "status", "startedAt", "completedAt", "exitCode", "summary", "artifacts"])
        || !text(item.command, false) || /[\0\r\n]/.test(item.command)
        || ["pass", "fail", "not-run"].indexOf(item.status) === -1
        || !text(item.summary, false) || !pathList(item.artifacts)) return false;
      if (item.status === "not-run") return item.startedAt === "" && item.completedAt === "" && item.exitCode === null;
      return canonicalTimestamp(item.startedAt)
        && canonicalTimestamp(item.completedAt)
        && item.completedAt >= item.startedAt
        && Number.isInteger(item.exitCode)
        && (item.status === "pass" ? item.exitCode === 0 : item.exitCode !== 0);
    })) return null;
    var commands = value.verificationResults.map(function (item) { return item.command; });
    if (new Set(commands).size !== commands.length) return null;

    if (!Array.isArray(value.observations) || !value.observations.every(function (item) {
      return exactKeys(item, ["id", "category", "status", "summary", "artifacts"])
        && text(item.id, false)
        && ["accessibility", "responsive", "browser", "runtime", "manual"].indexOf(item.category) !== -1
        && ["confirmed", "unverified"].indexOf(item.status) !== -1
        && text(item.summary, false)
        && pathList(item.artifacts)
        && (item.status !== "confirmed" || item.artifacts.length > 0);
    })) return null;
    var ids = value.observations.map(function (item) { return item.id; });
    if (new Set(ids).size !== ids.length) return null;
    if (!["accessibility", "responsive", "browser"].every(function (category) {
      return value.observations.some(function (item) { return item.category === category; });
    })) return null;

    if (!Array.isArray(value.remainingRisks) || !value.remainingRisks.every(function (item) {
      return exactKeys(item, ["severity", "summary"])
        && ["p0", "p1", "p2", "p3"].indexOf(item.severity) !== -1
        && text(item.summary, false);
    })) return null;
    return clone(value);
  }

  function normalizeArtifact(value, normalizer) {
    if (!exactKeys(value, ["reference", "sha256", "bytes", "source", "value"])
      || !text(value.reference, false)
      || !/^[a-f0-9]{64}$/.test(value.sha256)
      || !Number.isInteger(value.bytes) || value.bytes < 1
      || !text(value.source, false)
      || shared.utf8ByteLength(value.source) !== value.bytes
      || shared.sha256Text(value.source) !== value.sha256) return null;
    try {
      var parsed = JSON.parse(value.source);
      var normalized = normalizer(parsed);
      return normalized && same(parsed, value.value) && same(normalized, value.value) ? clone(value) : null;
    } catch (error) {
      return null;
    }
  }

  function validBaseline(value) {
    return exactKeys(value, ["targetPath", "repositoryUrl", "branch", "head", "worktreeChanges"])
      && text(value.targetPath, false) && text(value.repositoryUrl, false)
      && text(value.branch, false) && text(value.head, false) && textList(value.worktreeChanges);
  }

  function validObserved(value) {
    return exactKeys(value, ["targetPath", "repositoryUrl", "branch", "head", "worktreeChanges"])
      && text(value.targetPath, false) && text(value.repositoryUrl, false)
      && text(value.branch, false) && text(value.head, false)
      && Array.isArray(value.worktreeChanges)
      && value.worktreeChanges.every(function (item) {
        return exactKeys(item, ["statusEntry", "path", "preExisting", "reported", "selector"])
          && text(item.statusEntry, false) && safePath(item.path)
          && typeof item.preExisting === "boolean" && typeof item.reported === "boolean"
          && text(item.selector, true);
      });
  }

  function validBoundary(value) {
    var keys = [
      "mode", "localWrites", "targetRepoMutation", "applicationSourceRead", "evidenceFilesRead",
      "gitCommands", "verificationCommandsExecuted", "externalWrites", "networkCalls", "implementationPerformed",
      "commitAuthorized", "commitPerformed", "pushAuthorized", "pushPerformed", "deploymentAuthorized", "deploymentPerformed",
    ];
    var falseKeys = [
      "localWrites", "targetRepoMutation", "applicationSourceRead", "externalWrites", "networkCalls", "implementationPerformed",
      "commitAuthorized", "commitPerformed", "pushAuthorized", "pushPerformed", "deploymentAuthorized", "deploymentPerformed",
    ];
    return exactKeys(value, keys)
      && value.mode === "read-only-evidence"
      && textList(value.evidenceFilesRead)
      && textList(value.gitCommands)
      && Array.isArray(value.verificationCommandsExecuted)
      && value.verificationCommandsExecuted.length === 0
      && falseKeys.every(function (key) { return value[key] === false; });
  }

  function normalizeEvidence(value) {
    if (!exactKeys(value, [
      "kind", "schemaVersion", "status", "consumer", "approval", "request", "baseline", "observed",
      "executedWork", "verification", "observations", "artifacts", "remainingRisks", "issues", "nextAction", "boundary",
    ]) || value.kind !== "design-ai-implementation-evidence" || value.schemaVersion !== 1
      || statuses.indexOf(value.status) === -1 || !text(value.consumer, false)) return null;
    var approval = normalizeArtifact(value.approval, scope.normalizeImplementationScopeApproval);
    var request = normalizeArtifact(value.request, normalizeRequest);
    if (!approval || !request || value.consumer !== request.value.consumer
      || value.consumer !== approval.value.proposal.value.consumer.name) return null;
    if (!validBaseline(value.baseline)
      || !same(value.baseline, approval.value.proposal.value.baseline)
      || !validObserved(value.observed)
      || !same(value.executedWork, request.value.executedWork)
      || !same(value.observations, request.value.observations)
      || !same(value.remainingRisks, request.value.remainingRisks)) return null;

    if (!exactKeys(value.verification, ["expectedCommands", "results", "summary"])
      || !same(value.verification.expectedCommands, approval.value.proposal.value.scope.verificationCommands)
      || !same(value.verification.results, request.value.verificationResults)
      || !exactKeys(value.verification.summary, ["pass", "fail", "notRun"])) return null;
    var expectedSummary = {
      pass: request.value.verificationResults.filter(function (item) { return item.status === "pass"; }).length,
      fail: request.value.verificationResults.filter(function (item) { return item.status === "fail"; }).length,
      notRun: request.value.verificationResults.filter(function (item) { return item.status === "not-run"; }).length,
    };
    if (!same(value.verification.summary, expectedSummary)) return null;

    if (!Array.isArray(value.artifacts) || !value.artifacts.every(function (item) {
      return exactKeys(item, ["path", "sha256", "bytes"])
        && safePath(item.path) && /^[a-f0-9]{64}$/.test(item.sha256)
        && Number.isInteger(item.bytes) && item.bytes > 0;
    })) return null;
    var requestedArtifacts = Array.from(new Set(
      request.value.verificationResults.reduce(function (all, item) { return all.concat(item.artifacts); }, [])
        .concat(request.value.observations.reduce(function (all, item) { return all.concat(item.artifacts); }, [])),
    ));
    var recordedArtifacts = value.artifacts.map(function (item) { return item.path; });
    if (new Set(recordedArtifacts).size !== recordedArtifacts.length
      || !recordedArtifacts.every(function (item) { return requestedArtifacts.indexOf(item) !== -1; })) return null;
    if (!Array.isArray(value.issues) || !value.issues.every(function (item) {
      return exactKeys(item, ["level", "id", "message"])
        && ["warn", "fail"].indexOf(item.level) !== -1
        && text(item.id, false) && text(item.message, false);
    })) return null;
    var expectedStatus = value.issues.some(function (item) { return item.level === "fail"; })
      ? "blocked" : value.issues.length ? "attention-required" : "evidence-complete";
    var claimNeedsAttention = request.value.verificationResults.some(function (item) { return item.status !== "pass"; })
      || request.value.observations.some(function (item) { return item.status === "unverified"; })
      || request.value.remainingRisks.length > 0;
    if (value.status !== expectedStatus || (claimNeedsAttention && value.issues.length === 0)) return null;

    if (!exactKeys(value.nextAction, ["id", "status", "summary", "approvalRequiredBefore"])
      || !text(value.nextAction.id, false) || !text(value.nextAction.status, false)
      || !text(value.nextAction.summary, false)
      || !same(value.nextAction.approvalRequiredBefore, approval.value.decision.remainingGateIds)
      || !validBoundary(value.boundary)) return null;
    var remaining = approval.value.decision.remainingGateIds;
    var expectedNext = value.status === "blocked"
      ? ["implementation-evidence-repair-required", "blocked"]
      : value.status === "attention-required"
        ? ["implementation-evidence-gaps-remain", "pending"]
        : remaining.indexOf("commit") !== -1
          ? ["commit-approval-required", "ready"]
          : remaining.length > 0
            ? ["release-approval-required", "ready"]
            : ["implementation-evidence-complete", "complete"];
    if (value.nextAction.id !== expectedNext[0] || value.nextAction.status !== expectedNext[1]) return null;
    return clone(value);
  }

  global.DesignAiWebsiteConsoleImplementationEvidence = Object.freeze({
    normalizeImplementationEvidenceRequest: normalizeRequest,
    normalizeImplementationEvidence: normalizeEvidence,
  });
})(typeof window !== "undefined" ? window : globalThis);
