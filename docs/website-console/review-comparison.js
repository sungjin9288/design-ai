(function (global) {
  "use strict";

  var shared = global.DesignAiWebsiteConsoleSourceBundle;
  var comparisonStatuses = ["improved", "unchanged", "attention-required", "regressed"];
  // Mirrors cli/lib/review-comparison-contract.mjs: v2 adds `unconfirmed` for a lens
  // that failed or warned before and lacks evidence after; v1 keeps `evidence-lost`.
  var v1LensChanges = ["unchanged", "improved", "regressed", "evidence-gained", "evidence-lost"];
  var lensChanges = { 1: v1LensChanges, 2: v1LensChanges.concat(["unconfirmed"]) };

  function object(value) {
    return value && typeof value === "object" && !Array.isArray(value);
  }

  function exactKeys(value, keys) {
    return object(value)
      && JSON.stringify(Object.keys(value).sort()) === JSON.stringify(keys.slice().sort());
  }

  function text(value) {
    return typeof value === "string" && value.trim().length > 0;
  }

  // Matches the Node contract's isDeepStrictEqual for JSON values: object key order
  // does not matter, array order does. Tagged arrays of sorted entries keep the
  // encoding unambiguous without building objects from untrusted keys.
  function canonical(value) {
    if (Array.isArray(value)) return ["array", value.map(canonical)];
    if (!object(value)) return value;
    return ["object", Object.keys(value).sort().map(function (key) { return [key, canonical(value[key])]; })];
  }

  function same(left, right) {
    return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));
  }

  // Finding and lens ids are arbitrary strings, so lookups must not reach
  // Object.prototype names such as "constructor" or "__proto__".
  function lookup() {
    return Object.create(null);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function sourceArtifact(value) {
    if (!exactKeys(value, ["reference", "sha256", "bytes", "source", "value"])
      || !text(value.reference)
      || !/^[a-f0-9]{64}$/.test(value.sha256)
      || !Number.isInteger(value.bytes) || value.bytes < 1
      || !text(value.source)
      || shared.utf8ByteLength(value.source) !== value.bytes
      || shared.sha256Text(value.source) !== value.sha256) return null;
    try {
      var parsed = JSON.parse(value.source);
      var normalized = shared.normalizeQualityReport(parsed);
      return normalized && same(parsed, value.value) && same(normalized, value.value)
        ? clone(value)
        : null;
    } catch (error) {
      return null;
    }
  }

  function comparable(baseline, candidate) {
    // Reports from different schema versions carry different lens sets and cannot be compared.
    if (baseline.schemaVersion !== candidate.schemaVersion) return false;
    if (!same(baseline.subject, candidate.subject) || !same(baseline.context, candidate.context)) return false;
    var baselineLenses = lookup();
    baseline.findings.forEach(function (finding) {
      baselineLenses[finding.id] = finding.lens;
    });
    return candidate.findings.every(function (finding) {
      return !baselineLenses[finding.id] || baselineLenses[finding.id] === finding.lens;
    });
  }

  function lensChange(before, after, version) {
    if (before === after) return "unchanged";
    if (before === "unverified") return "evidence-gained";
    if (after === "unverified") return version >= 2 && before !== "pass" ? "unconfirmed" : "evidence-lost";
    var rank = { pass: 0, warning: 1, fail: 2 };
    return rank[after] < rank[before] ? "improved" : "regressed";
  }

  function expectedLensTransitions(baseline, candidate, version) {
    return baseline.lenses.map(function (beforeLens) {
      var afterLens = candidate.lenses.find(function (lens) { return lens.id === beforeLens.id; });
      return {
        id: beforeLens.id,
        before: beforeLens.status,
        after: afterLens.status,
        change: lensChange(beforeLens.status, afterLens.status, version),
      };
    });
  }

  function resolvedFinding(finding, afterLensStatus) {
    return {
      id: finding.id,
      lens: finding.lens,
      beforeStatus: finding.status,
      beforeSeverity: finding.severity,
      afterLensStatus: afterLensStatus,
      reason: "The finding is absent and its candidate lens passes.",
    };
  }

  function uncertainFinding(finding, afterLensStatus) {
    return {
      id: finding.id,
      lens: finding.lens,
      beforeStatus: finding.status,
      beforeSeverity: finding.severity,
      afterLensStatus: afterLensStatus,
      reason: "The finding is absent, but its candidate lens does not pass.",
    };
  }

  function expectedFindingChanges(baseline, candidate) {
    var beforeById = lookup();
    var afterById = lookup();
    var afterLensById = lookup();
    baseline.findings.forEach(function (finding) { beforeById[finding.id] = finding; });
    candidate.findings.forEach(function (finding) { afterById[finding.id] = finding; });
    candidate.lenses.forEach(function (lens) { afterLensById[lens.id] = lens.status; });
    var changes = { resolved: [], persistent: [], introduced: [], uncertain: [] };

    baseline.findings.forEach(function (before) {
      var after = afterById[before.id];
      if (after) {
        changes.persistent.push({
          id: before.id,
          lens: before.lens,
          beforeStatus: before.status,
          afterStatus: after.status,
          beforeSeverity: before.severity,
          afterSeverity: after.severity,
          reason: "The finding remains in the candidate report.",
        });
        return;
      }
      var afterLensStatus = afterLensById[before.lens];
      if (afterLensStatus === "pass") {
        changes.resolved.push(resolvedFinding(before, afterLensStatus));
      } else {
        changes.uncertain.push(uncertainFinding(before, afterLensStatus));
      }
    });

    candidate.findings.forEach(function (after) {
      if (beforeById[after.id]) return;
      changes.introduced.push({
        id: after.id,
        lens: after.lens,
        afterStatus: after.status,
        afterSeverity: after.severity,
        reason: "The finding appears only in the candidate report.",
      });
    });
    return changes;
  }

  function expectedStatus(transitions, findings) {
    var hasRegression = transitions.some(function (transition) {
      return transition.change === "regressed" || transition.change === "evidence-lost";
    }) || findings.introduced.some(function (finding) { return finding.afterStatus === "confirmed"; });
    if (hasRegression) return "regressed";
    var unconfirmed = transitions.some(function (transition) { return transition.change === "unconfirmed"; });
    if (unconfirmed || findings.persistent.length || findings.introduced.length || findings.uncertain.length) {
      return "attention-required";
    }
    return findings.resolved.length ? "improved" : "unchanged";
  }

  function expectedSummary(status, findings, transitions) {
    var onlyUnconfirmed = !findings.persistent.length && !findings.introduced.length && !findings.uncertain.length
      && transitions.some(function (transition) { return transition.change === "unconfirmed"; });
    var nextAction = status === "regressed"
      ? "Review introduced findings and regressed or evidence-lost lenses before release approval."
      : status === "attention-required" && onlyUnconfirmed
        ? "Collect runtime evidence for unconfirmed lenses before treating the change as resolved."
        : status === "attention-required"
        ? "Resolve persistent and introduced findings, or collect evidence for uncertain findings."
        : status === "improved"
          ? "Preserve this comparison with implementation evidence; broader production claims remain separate."
          : "No verified finding change was established; decide whether another iteration is needed.";
    return {
      status: status,
      resolved: findings.resolved.length,
      persistent: findings.persistent.length,
      introduced: findings.introduced.length,
      uncertain: findings.uncertain.length,
      nextAction: nextAction,
    };
  }

  function validApproval(value) {
    return exactKeys(value, ["status", "requiredBefore"])
      && value.status === "pending"
      && same(value.requiredBefore, ["target repository mutation", "commit", "push", "deployment", "external writes"]);
  }

  function validBoundary(value, status) {
    return exactKeys(value, [
      "mode", "localWrites", "targetRepoMutation", "externalWrites", "networkCalls",
      "boundedImprovementEstablished", "productionQualityEstablished", "adoptionEstablished",
    ])
      && value.mode === "read-only-review-comparison"
      && value.localWrites === false
      && value.targetRepoMutation === false
      && value.externalWrites === false
      && value.networkCalls === false
      && value.boundedImprovementEstablished === (status === "improved")
      && value.productionQualityEstablished === false
      && value.adoptionEstablished === false;
  }

  function normalizeReviewComparison(value) {
    if (!shared || typeof shared.normalizeQualityReport !== "function"
      || !exactKeys(value, [
        "kind", "schemaVersion", "status", "baseline", "candidate", "context",
        "lensTransitions", "findings", "summary", "approval", "boundary",
      ])
      || value.kind !== "design-ai-review-comparison"
      || (value.schemaVersion !== 1 && value.schemaVersion !== 2)
      || comparisonStatuses.indexOf(value.status) === -1) return null;

    var baseline = sourceArtifact(value.baseline);
    var candidate = sourceArtifact(value.candidate);
    if (!baseline || !candidate || !comparable(baseline.value, candidate.value)) return null;

    var expectedContext = {
      subject: baseline.value.subject,
      brief: baseline.value.context.brief,
      routeId: baseline.value.context.routeId,
      locale: baseline.value.context.locale,
      viewports: baseline.value.context.viewports,
    };
    var transitions = expectedLensTransitions(baseline.value, candidate.value, value.schemaVersion);
    var findings = expectedFindingChanges(baseline.value, candidate.value);
    var status = expectedStatus(transitions, findings);
    var summary = expectedSummary(status, findings, transitions);

    if (!same(value.context, expectedContext)
      || !Array.isArray(value.lensTransitions) || value.lensTransitions.length !== baseline.value.lenses.length
      || value.lensTransitions.some(function (transition) {
        return !exactKeys(transition, ["id", "before", "after", "change"])
          || lensChanges[value.schemaVersion].indexOf(transition.change) === -1;
      })
      || !exactKeys(value.findings, ["resolved", "persistent", "introduced", "uncertain"])
      || !["resolved", "persistent", "introduced", "uncertain"].every(function (key) {
        return Array.isArray(value.findings[key]);
      })
      || !same(value.lensTransitions, transitions)
      || !same(value.findings, findings)
      || value.status !== status
      || !same(value.summary, summary)
      || !validApproval(value.approval)
      || !validBoundary(value.boundary, status)) return null;
    return clone(value);
  }

  global.DesignAiWebsiteConsoleReviewComparison = Object.freeze({
    normalizeReviewComparison: normalizeReviewComparison,
  });
}(typeof window !== "undefined" ? window : globalThis));
