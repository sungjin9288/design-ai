(function (global) {
  "use strict";

  var shared = global.DesignAiWebsiteConsoleSourceBundle;
  var implementationGateIds = [
    "source-inspection", "target-files", "pre-existing-changes",
    "dependency-changes", "migration-files", "generated-files",
  ];
  var releaseGateIds = ["external-writes", "commit", "push", "deployment"];

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

  function textList(value, allowEmpty) {
    return Array.isArray(value)
      && (allowEmpty || value.length > 0)
      && value.every(text)
      && new Set(value).size === value.length;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function same(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
  }

  function safeSelector(value) {
    return text(value)
      && value.charAt(0) !== "/"
      && !/^[A-Za-z]:[\\/]/.test(value)
      && value.split(/[\\/]/).indexOf("..") === -1
      && !/[\0\r\n]/.test(value);
  }

  function oneLine(value) {
    return text(value) && !/[\0\r\n]/.test(value);
  }

  function canonicalTimestamp(value) {
    if (!text(value)) return false;
    var parsed = new Date(value);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
  }

  function normalizeRequest(value) {
    if (!exactKeys(value, [
      "kind", "schemaVersion", "objective", "intendedBehavior", "files",
      "dependencies", "migrations", "externalWrites", "verificationCommands",
      "risks", "preExistingChanges", "release",
    ]) || value.kind !== "design-ai-implementation-scope-request"
      || value.schemaVersion !== 1
      || !text(value.objective)
      || !textList(value.intendedBehavior, false)) return null;

    if (!exactKeys(value.files, ["inspect", "change", "generated"])
      || !textList(value.files.inspect, true)
      || !textList(value.files.change, false)
      || !textList(value.files.generated, true)
      || !value.files.inspect.concat(value.files.change, value.files.generated).every(safeSelector)
      || !value.files.change.every(function (selector) {
        return value.files.inspect.indexOf(selector) !== -1;
      })) return null;

    if (!Array.isArray(value.dependencies) || !value.dependencies.every(function (item) {
      return exactKeys(item, ["name", "action", "reason"])
        && text(item.name)
        && ["add", "remove", "upgrade"].indexOf(item.action) !== -1
        && text(item.reason);
    })) return null;
    var dependencyKeys = value.dependencies.map(function (item) {
      return item.action + ":" + item.name;
    });
    if (new Set(dependencyKeys).size !== dependencyKeys.length) return null;

    if (!Array.isArray(value.migrations) || !value.migrations.every(function (item) {
      return exactKeys(item, ["name", "command", "affectsExternalState"])
        && text(item.name)
        && oneLine(item.command)
        && typeof item.affectsExternalState === "boolean";
    })) return null;
    if (!Array.isArray(value.externalWrites) || !value.externalWrites.every(function (item) {
      return exactKeys(item, ["system", "action", "destination"])
        && text(item.system) && text(item.action) && text(item.destination);
    })) return null;
    if (!textList(value.verificationCommands, false)
      || !value.verificationCommands.every(oneLine)
      || !textList(value.risks, false)) return null;

    if (!Array.isArray(value.preExistingChanges) || !value.preExistingChanges.every(function (item) {
      return exactKeys(item, ["statusEntry", "owner", "handling"])
        && text(item.statusEntry)
        && ["user", "unknown"].indexOf(item.owner) !== -1
        && ["preserve", "allow-overlap", "block"].indexOf(item.handling) !== -1;
    })) return null;
    var statusEntries = value.preExistingChanges.map(function (item) { return item.statusEntry; });
    if (new Set(statusEntries).size !== statusEntries.length) return null;
    if (!exactKeys(value.release, ["commit", "push", "deployment"])
      || ![value.release.commit, value.release.push, value.release.deployment].every(function (item) {
        return typeof item === "boolean";
      })) return null;
    return clone(value);
  }

  function normalizeArtifact(value, normalizer) {
    if (!exactKeys(value, ["reference", "sha256", "bytes", "source", "value"])
      || !text(value.reference)
      || !/^[a-f0-9]{64}$/.test(value.sha256)
      || !Number.isInteger(value.bytes)
      || value.bytes < 1
      || !text(value.source)
      || shared.utf8ByteLength(value.source) !== value.bytes
      || shared.sha256Text(value.source) !== value.sha256) return null;
    try {
      var parsed = JSON.parse(value.source);
      var normalized = normalizer(parsed);
      return normalized && same(parsed, value.value) && same(normalized, value.value)
        ? clone(value)
        : null;
    } catch (error) {
      return null;
    }
  }

  function gate(id, required, summary) {
    return { id: id, status: required ? "pending" : "not-required", summary: summary };
  }

  function expectedGates(request) {
    return [
      gate("source-inspection", true, "Read only the approved file selectors during implementation."),
      gate("target-files", true, "Mutate only the approved change and generated-file selectors."),
      gate("pre-existing-changes", request.preExistingChanges.length > 0, "Respect the recorded ownership and handling of every pre-existing change."),
      gate("dependency-changes", request.dependencies.length > 0, "Apply only the declared dependency changes; installation and network access remain separate."),
      gate("migration-files", request.migrations.length > 0, "Create or edit only declared migration files; running external-state migrations remains separate."),
      gate("generated-files", request.files.generated.length > 0, "Write only the declared generated-file selectors."),
      gate("external-writes", request.externalWrites.length > 0 || request.migrations.some(function (item) {
        return item.affectsExternalState;
      }), "External writes require a separate explicit approval and execution record."),
      gate("commit", request.release.commit, "Creating a commit requires a separate explicit gate."),
      gate("push", request.release.push, "Pushing changes requires a separate explicit gate."),
      gate("deployment", request.release.deployment, "Deployment requires a separate explicit gate."),
    ];
  }

  function expectedIssues(intake, request) {
    var issues = [];
    if (intake.status === "blocked") issues.push({ level: "fail", id: "intake-blocked", message: "The target repository intake is blocked and cannot advance to scope approval." });
    if (!intake.git.branch) issues.push({ level: "fail", id: "named-branch-required", message: "A named branch is required before implementation scope can be approved." });
    if (intake.git.changes.truncated) issues.push({ level: "fail", id: "worktree-evidence-truncated", message: "The intake did not enumerate every worktree change, so ownership is incomplete." });
    if (!same(request.preExistingChanges.map(function (item) { return item.statusEntry; }), intake.git.changes.entries)) {
      issues.push({ level: "fail", id: "worktree-ownership-mismatch", message: "Every pre-existing worktree change must appear once and in intake order." });
    }
    request.preExistingChanges.forEach(function (change) {
      if (change.owner === "unknown" || change.handling === "block") {
        issues.push({ level: "fail", id: "worktree-ownership-unresolved", message: "Pre-existing change remains unresolved: " + change.statusEntry });
      } else if (change.handling === "allow-overlap") {
        issues.push({ level: "warn", id: "worktree-overlap-needs-approval", message: "The approved implementation may overlap this user-owned change: " + change.statusEntry });
      }
    });
    if (request.migrations.some(function (item) { return item.affectsExternalState; })) {
      issues.push({ level: "warn", id: "external-state-migration-not-authorized", message: "Migration files may be scoped, but running a migration against external state remains unauthorized." });
    }
    if (!issues.length) issues.push({ level: "pass", id: "scope-ready-for-approval", message: "Repository identity, file selectors, verification, risks, and existing-change ownership are ready for human approval." });
    return issues;
  }

  function requestScope(request) {
    return {
      objective: request.objective,
      intendedBehavior: request.intendedBehavior.slice(),
      files: clone(request.files),
      dependencies: clone(request.dependencies),
      migrations: clone(request.migrations),
      externalWrites: clone(request.externalWrites),
      verificationCommands: request.verificationCommands.slice(),
      risks: request.risks.slice(),
      release: clone(request.release),
    };
  }

  function normalizeProposal(value) {
    if (!exactKeys(value, [
      "kind", "schemaVersion", "status", "consumer", "intake", "request",
      "linkage", "baseline", "scope", "approvalGates", "issues", "nextAction", "boundary",
    ]) || value.kind !== "design-ai-implementation-scope-proposal" || value.schemaVersion !== 1) return null;
    var intake = normalizeArtifact(value.intake, shared.normalizeTargetRepoIntake);
    var request = normalizeArtifact(value.request, normalizeRequest);
    if (!intake || !request) return null;
    if (!exactKeys(value.consumer, ["name", "intakeConsumerMatch", "identity"])
      || value.consumer.name !== intake.value.consumer.name
      || value.consumer.intakeConsumerMatch !== true
      || value.consumer.identity !== "self-declared") return null;
    var scope = requestScope(request.value);
    if (!exactKeys(value.linkage, ["status", "intakeSha256", "requestSha256", "scopeDigest"])
      || value.linkage.status !== "pass"
      || value.linkage.intakeSha256 !== intake.sha256
      || value.linkage.requestSha256 !== request.sha256
      || value.linkage.scopeDigest !== shared.sha256Text(JSON.stringify(scope))) return null;
    var expectedBaseline = {
      targetPath: intake.value.target.declaredPath,
      repositoryUrl: intake.value.target.declaredRepositoryUrl,
      branch: intake.value.git.branch,
      head: intake.value.git.head ? intake.value.git.head.hash : "",
      worktreeChanges: intake.value.git.changes.entries.slice(),
    };
    var issues = expectedIssues(intake.value, request.value);
    if (!same(value.baseline, expectedBaseline)
      || !same(value.scope, scope)
      || !same(value.approvalGates, expectedGates(request.value))
      || !same(value.issues, issues)
      || value.status !== (issues.some(function (item) { return item.level === "fail"; }) ? "blocked" : "approval-pending")) return null;
    if (!exactKeys(value.nextAction, ["id", "status", "summary", "implementationAuthorized"])
      || value.nextAction.id !== "human-scope-approval-required"
      || value.nextAction.status !== "pending"
      || !text(value.nextAction.summary)
      || value.nextAction.implementationAuthorized !== false) return null;
    if (!exactKeys(value.boundary, ["mode", "localWrites", "targetRepoMutation", "externalWrites", "networkCalls", "applicationSourceRead", "scopeApproved", "implementationStarted"])
      || value.boundary.mode !== "read-only"
      || [value.boundary.localWrites, value.boundary.targetRepoMutation, value.boundary.externalWrites, value.boundary.networkCalls, value.boundary.applicationSourceRead, value.boundary.scopeApproved, value.boundary.implementationStarted].some(Boolean)) return null;
    return clone(value);
  }

  function normalizeApproval(value) {
    if (!exactKeys(value, ["kind", "schemaVersion", "status", "proposal", "approver", "decision", "authorization", "approvalGates", "nextAction", "boundary"])
      || value.kind !== "design-ai-implementation-scope-approval"
      || value.schemaVersion !== 1
      || value.status !== "approved-for-implementation") return null;
    var proposal = normalizeArtifact(value.proposal, normalizeProposal);
    if (!proposal || proposal.value.status !== "approval-pending") return null;
    if (!exactKeys(value.approver, ["name", "identity", "reference", "approvedAt"])
      || !text(value.approver.name)
      || value.approver.identity !== "self-declared"
      || !text(value.approver.reference)
      || !canonicalTimestamp(value.approver.approvedAt)) return null;
    var gates = proposal.value.approvalGates.map(function (item) {
      var approved = implementationGateIds.indexOf(item.id) !== -1 && item.status === "pending";
      return { id: item.id, status: approved ? "approved" : item.status, summary: item.summary };
    });
    var authorized = gates.filter(function (item) { return item.status === "approved"; }).map(function (item) { return item.id; });
    var remaining = gates.filter(function (item) {
      return releaseGateIds.indexOf(item.id) !== -1 && item.status === "pending";
    }).map(function (item) { return item.id; });
    if (!exactKeys(value.decision, ["status", "proposalSha256", "scopeDigest", "authorizedGateIds", "remainingGateIds"])
      || value.decision.status !== "approved"
      || value.decision.proposalSha256 !== proposal.sha256
      || value.decision.scopeDigest !== shared.sha256Text(JSON.stringify(proposal.value.scope))
      || !same(value.decision.authorizedGateIds, authorized)
      || !same(value.decision.remainingGateIds, remaining)) return null;
    var expectedAuthorization = {
      targetPath: proposal.value.baseline.targetPath,
      repositoryUrl: proposal.value.baseline.repositoryUrl,
      branch: proposal.value.baseline.branch,
      head: proposal.value.baseline.head,
      files: clone(proposal.value.scope.files),
      expiresOnDrift: true,
    };
    if (!same(value.authorization, expectedAuthorization) || !same(value.approvalGates, gates)) return null;
    if (!exactKeys(value.nextAction, ["id", "status", "summary", "implementationAuthorized", "approvalRequiredBefore"])
      || value.nextAction.id !== "implementation-evidence-required"
      || value.nextAction.status !== "ready"
      || !text(value.nextAction.summary)
      || value.nextAction.implementationAuthorized !== true
      || !same(value.nextAction.approvalRequiredBefore, remaining)) return null;
    if (!exactKeys(value.boundary, ["mode", "localWrites", "targetRepoMutation", "externalWrites", "networkCalls", "applicationSourceRead", "scopeApproved", "implementationStarted", "sourceReadAuthorized", "targetMutationAuthorized", "externalWritesAuthorized", "commitAuthorized", "pushAuthorized", "deploymentAuthorized"])
      || value.boundary.mode !== "scope-approved"
      || value.boundary.scopeApproved !== true
      || value.boundary.sourceReadAuthorized !== true
      || value.boundary.targetMutationAuthorized !== true
      || [value.boundary.localWrites, value.boundary.targetRepoMutation, value.boundary.externalWrites, value.boundary.networkCalls, value.boundary.applicationSourceRead, value.boundary.implementationStarted, value.boundary.externalWritesAuthorized, value.boundary.commitAuthorized, value.boundary.pushAuthorized, value.boundary.deploymentAuthorized].some(Boolean)) return null;
    return clone(value);
  }

  global.DesignAiWebsiteConsoleImplementationScope = Object.freeze({
    normalizeImplementationScopeRequest: normalizeRequest,
    normalizeImplementationScopeProposal: normalizeProposal,
    normalizeImplementationScopeApproval: normalizeApproval,
  });
})(typeof window !== "undefined" ? window : globalThis);
