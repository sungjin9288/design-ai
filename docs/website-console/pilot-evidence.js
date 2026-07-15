(function (global) {
  "use strict";

  var shared = global.DesignAiWebsiteConsoleSourceBundle;
  var implementation = global.DesignAiWebsiteConsoleImplementationEvidence;
  var claimClasses = ["real", "synthetic", "inferred", "unverified"];

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

  function same(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function timestamp(value, allowEmpty) {
    if (!text(value, allowEmpty)) return false;
    if (allowEmpty && value === "") return true;
    var parsed = new Date(value);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
  }

  function sourceArtifact(value, normalizer) {
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

  function normalizePilotRecord(value) {
    if (!exactKeys(value, [
      "kind", "schemaVersion", "project", "consent", "timeline", "findingDecisions",
      "approvalEvents", "outcome", "claims",
    ]) || value.kind !== "design-ai-pilot-record" || value.schemaVersion !== 1) return null;

    if (!exactKeys(value.project, ["name", "repositoryUrl", "pilotClass"])
      || !text(value.project.name, false) || !text(value.project.repositoryUrl, false)
      || ["internal-dogfood", "external-pilot"].indexOf(value.project.pilotClass) === -1) return null;

    if (!exactKeys(value.consent, ["status", "approver", "identity", "reference", "approvedAt", "evidenceCollection", "targetMutation"])
      || value.consent.status !== "approved" || value.consent.identity !== "self-declared"
      || !text(value.consent.approver, false) || !text(value.consent.reference, false)
      || !timestamp(value.consent.approvedAt, false)
      || value.consent.evidenceCollection !== true || value.consent.targetMutation !== true) return null;

    if (!exactKeys(value.timeline, ["pilotStartedAt", "firstUsefulArtifactAt", "implementationCompletedAt"])
      || !timestamp(value.timeline.pilotStartedAt, false)
      || !timestamp(value.timeline.firstUsefulArtifactAt, false)
      || !timestamp(value.timeline.implementationCompletedAt, false)
      || value.timeline.firstUsefulArtifactAt < value.timeline.pilotStartedAt
      || value.timeline.implementationCompletedAt < value.timeline.firstUsefulArtifactAt) return null;

    if (!Array.isArray(value.findingDecisions) || !value.findingDecisions.every(function (item) {
      return exactKeys(item, ["findingId", "decision", "summary", "reference"])
        && text(item.findingId, false)
        && ["accepted", "rejected", "unresolved"].indexOf(item.decision) !== -1
        && text(item.summary, false) && text(item.reference, false);
    })) return null;
    if (new Set(value.findingDecisions.map(function (item) { return item.findingId; })).size !== value.findingDecisions.length) return null;

    if (!Array.isArray(value.approvalEvents) || !value.approvalEvents.length
      || !value.approvalEvents.every(function (item) {
        var approved = item.status === "approved";
        return exactKeys(item, ["gateId", "status", "occurredAt", "reference"])
          && text(item.gateId, false)
          && ["approved", "not-required", "pending"].indexOf(item.status) !== -1
          && timestamp(item.occurredAt, !approved)
          && (approved || item.occurredAt === "")
          && text(item.reference, false);
      })) return null;
    if (new Set(value.approvalEvents.map(function (item) { return item.gateId; })).size !== value.approvalEvents.length) return null;

    if (!exactKeys(value.outcome, ["implementationStatus", "productionStatus", "feedback"])
      || ["complete", "partial", "blocked"].indexOf(value.outcome.implementationStatus) === -1
      || ["not-deployed", "deployed-unverified", "production-verified"].indexOf(value.outcome.productionStatus) === -1
      || !exactKeys(value.outcome.feedback, ["status", "summary", "reference"])
      || ["collected", "not-collected"].indexOf(value.outcome.feedback.status) === -1
      || !text(value.outcome.feedback.summary, false)
      || !text(value.outcome.feedback.reference, value.outcome.feedback.status === "not-collected")) return null;

    if (!Array.isArray(value.claims) || value.claims.length !== claimClasses.length
      || !value.claims.every(function (item) {
        return exactKeys(item, ["class", "statement", "reference"])
          && claimClasses.indexOf(item.class) !== -1
          && text(item.statement, false) && text(item.reference, false);
      })
      || !same(value.claims.map(function (item) { return item.class; }).sort(), claimClasses.slice().sort())) return null;
    return clone(value);
  }

  function count(value) {
    return Number.isInteger(value) && value >= 0;
  }

  function validMetrics(metrics, record, evidence) {
    if (!exactKeys(metrics, ["timeToFirstUsefulArtifact", "findingPrecision", "approvalFriction", "implementation", "unresolvedRisk"])) return false;
    var accepted = record.findingDecisions.filter(function (item) { return item.decision === "accepted"; }).length;
    var rejected = record.findingDecisions.filter(function (item) { return item.decision === "rejected"; }).length;
    var unresolved = record.findingDecisions.filter(function (item) { return item.decision === "unresolved"; }).length;
    var evaluated = accepted + rejected;
    var expectedTime = {
      milliseconds: new Date(record.timeline.firstUsefulArtifactAt) - new Date(record.timeline.pilotStartedAt),
      startedAt: record.timeline.pilotStartedAt,
      completedAt: record.timeline.firstUsefulArtifactAt,
    };
    var expectedPrecision = {
      accepted: accepted,
      rejected: rejected,
      unresolved: unresolved,
      evaluated: evaluated,
      precision: evaluated ? accepted / evaluated : null,
    };
    var expectedFriction = {
      total: record.approvalEvents.length,
      approved: record.approvalEvents.filter(function (item) { return item.status === "approved"; }).length,
      notRequired: record.approvalEvents.filter(function (item) { return item.status === "not-required"; }).length,
      pending: record.approvalEvents.filter(function (item) { return item.status === "pending"; }).length,
    };
    return same(metrics.timeToFirstUsefulArtifact, expectedTime)
      && same(metrics.findingPrecision, expectedPrecision)
      && same(metrics.approvalFriction, expectedFriction)
      && exactKeys(metrics.implementation, ["status", "evidenceStatus"])
      && metrics.implementation.status === record.outcome.implementationStatus
      && metrics.implementation.evidenceStatus === evidence.status
      && exactKeys(metrics.unresolvedRisk, ["count", "items"])
      && count(metrics.unresolvedRisk.count)
      && metrics.unresolvedRisk.count === evidence.remainingRisks.length
      && same(metrics.unresolvedRisk.items, evidence.remainingRisks);
  }

  function validClaims(claims, record) {
    if (!exactKeys(claims, claimClasses)) return false;
    return claimClasses.every(function (claimClass) {
      var expected = record.claims.filter(function (item) { return item.class === claimClass; })
        .map(function (item) { return { statement: item.statement, reference: item.reference }; });
      return same(claims[claimClass], expected);
    });
  }

  function expectedIssues(record, evidence, workflow) {
    var issues = [];
    var approval = evidence.approval.value;
    var intake = approval.proposal.value.intake.value;
    function add(level, id, message) {
      issues.push({ level: level, id: id, message: message });
    }
    if (workflow.sha256 !== intake.receipt.reviewWorkflowSha256) {
      add("fail", "pilot-review-workflow-drift", "P6 review workflow does not match the SHA-256 link preserved by the P9 intake.");
    }
    if (record.project.repositoryUrl !== evidence.observed.repositoryUrl) {
      add("fail", "pilot-project-repository-drift", "Pilot project repository does not match the P11 implementation evidence.");
    }
    if (record.timeline.implementationCompletedAt !== evidence.request.value.implementationCompletedAt) {
      add("fail", "pilot-completion-time-drift", "Pilot completion time does not match the P11 implementation evidence request.");
    }
    var findingIds = workflow.value.report.findings.map(function (finding) { return finding.id; });
    var decisionIds = record.findingDecisions.map(function (decision) { return decision.findingId; });
    if (!same(findingIds, decisionIds)) {
      add("fail", "pilot-finding-review-incomplete", "Pilot finding decisions must preserve every P6 finding in original order.");
    }
    var expectedEvents = approval.approvalGates.map(function (gate) {
      return { gateId: gate.id, status: gate.status };
    });
    var actualEvents = record.approvalEvents.map(function (event) {
      return { gateId: event.gateId, status: event.status };
    });
    if (!same(expectedEvents, actualEvents)) {
      add("fail", "pilot-approval-history-drift", "Pilot approval events must preserve every P10 gate and its status in original order.");
    }
    var expectedImplementationStatus = evidence.status === "evidence-complete"
      ? "complete" : evidence.status === "attention-required" ? "partial" : "blocked";
    if (record.outcome.implementationStatus !== expectedImplementationStatus) {
      add("fail", "pilot-implementation-status-drift", "Pilot implementation status overstates or understates the P11 evidence status.");
    }
    if (evidence.status !== "evidence-complete") {
      add("warn", "pilot-implementation-evidence-incomplete", "P11 implementation evidence still contains gaps or blocking issues.");
    }
    if (record.findingDecisions.some(function (decision) { return decision.decision === "unresolved"; })) {
      add("warn", "pilot-finding-decision-unresolved", "At least one reviewed finding remains unresolved.");
    }
    if (record.outcome.productionStatus === "production-verified") {
      add("warn", "pilot-production-proof-not-verified", "This read-only operation cannot independently verify a production-quality claim.");
    }
    if (record.outcome.feedback.status === "collected") {
      add("warn", "pilot-feedback-source-not-verified", "Feedback is source-referenced but respondent identity and consent to publish are not independently verified.");
    }
    return issues;
  }

  function expectedNextAction(status) {
    if (status === "blocked") {
      return { id: "pilot-evidence-repair-required", status: "blocked", summary: "Repair source or linkage drift before using this pilot evidence." };
    }
    if (status === "attention-required") {
      return { id: "pilot-evidence-gaps-remain", status: "pending", summary: "Resolve or explicitly retain the listed evidence gaps before making broader claims." };
    }
    return { id: "pilot-evidence-complete", status: "complete", summary: "The bounded pilot evidence is complete; broader adoption and production claims remain outside this contract." };
  }

  function validBoundary(value) {
    return exactKeys(value, [
      "mode", "localWrites", "targetRepoMutation", "externalWrites", "networkCalls",
      "identityVerified", "feedbackVerified", "adoptionEstablished", "productionQualityEstablished",
    ]) && value.mode === "read-only-pilot-evidence"
      && ["localWrites", "targetRepoMutation", "externalWrites", "networkCalls", "identityVerified", "feedbackVerified", "adoptionEstablished", "productionQualityEstablished"]
        .every(function (key) { return value[key] === false; });
  }

  function normalizePilotEvidence(value) {
    if (!exactKeys(value, [
      "kind", "schemaVersion", "status", "implementationEvidence", "reviewWorkflow", "record",
      "project", "consent", "metrics", "claims", "issues", "nextAction", "boundary",
    ]) || value.kind !== "design-ai-pilot-evidence" || value.schemaVersion !== 1
      || ["evidence-complete", "attention-required", "blocked"].indexOf(value.status) === -1) return null;
    var evidence = sourceArtifact(value.implementationEvidence, implementation.normalizeImplementationEvidence);
    var workflow = sourceArtifact(value.reviewWorkflow, shared.normalizeReviewWorkflow);
    var record = sourceArtifact(value.record, normalizePilotRecord);
    if (!evidence || !workflow || !record
      || !same(value.project, record.value.project) || !same(value.consent, record.value.consent)
      || value.reviewWorkflow.sha256 !== evidence.value.approval.value.proposal.value.intake.value.receipt.reviewWorkflowSha256
      || !validMetrics(value.metrics, record.value, evidence.value)
      || !validClaims(value.claims, record.value)) return null;
    if (!Array.isArray(value.issues) || !value.issues.every(function (item) {
      return exactKeys(item, ["level", "id", "message"])
        && ["warn", "fail"].indexOf(item.level) !== -1
        && text(item.id, false) && text(item.message, false);
    }) || !same(value.issues, expectedIssues(record.value, evidence.value, workflow))) return null;
    var expectedStatus = value.issues.some(function (item) { return item.level === "fail"; })
      ? "blocked" : value.issues.length ? "attention-required" : "evidence-complete";
    var expectedNext = expectedNextAction(expectedStatus);
    if (value.status !== expectedStatus
      || !exactKeys(value.nextAction, ["id", "status", "summary"])
      || !same(value.nextAction, expectedNext)
      || !validBoundary(value.boundary)) return null;
    return clone(value);
  }

  global.DesignAiWebsiteConsolePilotEvidence = Object.freeze({
    normalizePilotRecord: normalizePilotRecord,
    normalizePilotEvidence: normalizePilotEvidence,
  });
})(typeof window !== "undefined" ? window : globalThis);
