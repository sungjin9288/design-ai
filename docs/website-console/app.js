(function () {
  "use strict";

  var STORAGE_KEY = "design-ai.website-console.v1";
  var ACTIVE_TAB_KEY = "design-ai.website-console.active-tab";
  var SELECTED_TEMPLATE_KEY = "design-ai.website-console.prompt-template";
  var START_PLAN_KEY = "design-ai.website-console.start-plan";
  var QUALITY_REPORT_KEY = "design-ai.website-console.quality-report";
  var REVIEW_WORKFLOW_KEY = "design-ai.website-console.review-workflow";
  var REVIEW_HANDOFF_KEY = "design-ai.website-console.review-handoff";
  var REVIEW_HANDOFF_RECEIPT_KEY = "design-ai.website-console.review-handoff-receipt";
  var TARGET_REPO_INTAKE_KEY = "design-ai.website-console.target-repo-intake";
  var IMPLEMENTATION_SCOPE_PROPOSAL_KEY = "design-ai.website-console.implementation-scope-proposal";
  var IMPLEMENTATION_SCOPE_APPROVAL_KEY = "design-ai.website-console.implementation-scope-approval";
  var IMPLEMENTATION_EVIDENCE_KEY = "design-ai.website-console.implementation-evidence";
  var PILOT_EVIDENCE_KEY = "design-ai.website-console.pilot-evidence";
  var REVIEW_COMPARISON_KEY = "design-ai.website-console.review-comparison";
  var BROWSER_VERIFICATION_KEY = "design-ai.website-console.browser-verification";

  var CONSOLE_UNAVAILABLE_HTML = '<main id="main" class="loading-shell" tabindex="-1"><h1>Website Console unavailable</h1><p>Required local scripts did not load. Reload after updating the complete Website Console bundle.</p></main>';

  // Every sibling module is gated the same way: it must exist and expose the
  // functions this console calls. A partial bundle paints the failure into #app
  // before throwing, so the page never silently renders an empty shell.
  function requireConsoleModule(globalName, requiredFunctions, failureMessage) {
    var api = window[globalName];
    var ready = api && requiredFunctions.every(function (name) {
      return typeof api[name] === "function";
    });
    if (ready) return api;
    var failedApp = document.getElementById("app");
    if (failedApp) {
      failedApp.setAttribute("data-status", "error");
      failedApp.innerHTML = CONSOLE_UNAVAILABLE_HTML;
    }
    throw new Error(failureMessage);
  }

  var sourceBundleApi = requireConsoleModule(
    "DesignAiWebsiteConsoleSourceBundle",
    [
      "normalizeStartPlan",
      "extractStartPlanPayload",
      "buildStartPlanJson",
      "normalizeRunbookSourceBundle",
      "extractSourceBundleProvenancePayload",
      "extractSourceBundleRevalidationGatePayload",
      "sourceBundleNeedsRevalidation",
      "buildSourceBundleRevalidationGate",
      "buildSourceBundleJson",
      "buildSourceBundleRevalidationGateJson",
      "normalizeQualityReport",
      "normalizeReviewWorkflow",
      "normalizeReviewHandoff",
      "normalizeReviewHandoffReceipt",
      "normalizeTargetRepoIntake",
      "targetRepoIntakeMatchesReceipt",
      "normalizeBrowserVerification",
      "buildImportedArtifactJson",
    ],
    "Website Console source-bundle contract failed to load all required functions.",
  );
  var normalizeStartPlan = sourceBundleApi.normalizeStartPlan;
  var extractStartPlanPayload = sourceBundleApi.extractStartPlanPayload;
  var buildStartPlanJson = sourceBundleApi.buildStartPlanJson;
  var normalizeRunbookSourceBundle = sourceBundleApi.normalizeRunbookSourceBundle;
  var extractSourceBundleProvenancePayload = sourceBundleApi.extractSourceBundleProvenancePayload;
  var extractSourceBundleRevalidationGatePayload = sourceBundleApi.extractSourceBundleRevalidationGatePayload;
  var sourceBundleNeedsRevalidation = sourceBundleApi.sourceBundleNeedsRevalidation;
  var buildSourceBundleRevalidationGate = sourceBundleApi.buildSourceBundleRevalidationGate;
  var buildSourceBundleJson = sourceBundleApi.buildSourceBundleJson;
  var buildSourceBundleRevalidationGateJson = sourceBundleApi.buildSourceBundleRevalidationGateJson;
  var normalizeQualityReport = sourceBundleApi.normalizeQualityReport;
  var normalizeReviewWorkflow = sourceBundleApi.normalizeReviewWorkflow;
  var normalizeReviewHandoff = sourceBundleApi.normalizeReviewHandoff;
  var normalizeReviewHandoffReceipt = sourceBundleApi.normalizeReviewHandoffReceipt;
  var normalizeTargetRepoIntake = sourceBundleApi.normalizeTargetRepoIntake;
  var targetRepoIntakeMatchesReceipt = sourceBundleApi.targetRepoIntakeMatchesReceipt;
  var normalizeBrowserVerification = sourceBundleApi.normalizeBrowserVerification;
  var buildImportedArtifactJson = sourceBundleApi.buildImportedArtifactJson;
  var reviewComparisonApi = requireConsoleModule(
    "DesignAiWebsiteConsoleReviewComparison",
    ["normalizeReviewComparison"],
    "Website Console review-comparison contract failed to load.",
  );
  var normalizeReviewComparisonArtifact = reviewComparisonApi.normalizeReviewComparison;
  var implementationScopeApi = requireConsoleModule(
    "DesignAiWebsiteConsoleImplementationScope",
    ["normalizeImplementationScopeProposal", "normalizeImplementationScopeApproval"],
    "Website Console implementation-scope contract failed to load.",
  );
  var normalizeImplementationScopeProposal = implementationScopeApi.normalizeImplementationScopeProposal;
  var normalizeImplementationScopeApproval = implementationScopeApi.normalizeImplementationScopeApproval;
  var implementationEvidenceApi = requireConsoleModule(
    "DesignAiWebsiteConsoleImplementationEvidence",
    ["normalizeImplementationEvidence"],
    "Website Console implementation-evidence contract failed to load.",
  );
  var normalizeImplementationEvidenceArtifact = implementationEvidenceApi.normalizeImplementationEvidence;
  var pilotEvidenceApi = requireConsoleModule(
    "DesignAiWebsiteConsolePilotEvidence",
    ["normalizePilotEvidence"],
    "Website Console pilot-evidence contract failed to load.",
  );
  var normalizePilotEvidenceArtifact = pilotEvidenceApi.normalizePilotEvidence;
  var viewModelApi = requireConsoleModule(
    "DesignAiWebsiteConsoleViewModel",
    ["createDefaultWorkspace"],
    "Website Console view-model contract failed to load.",
  );
  var auditCategories = viewModelApi.auditCategories;
  var badge = viewModelApi.badge;
  var boundaryItem = viewModelApi.boundaryItem;
  var buildCodexTaskPromptForWorkspace = viewModelApi.buildCodexTaskPromptForWorkspace;
  var buildOperatorRunbookRowMarkdown = viewModelApi.buildOperatorRunbookRowMarkdown;
  var buildSourceBundleMarkdown = viewModelApi.buildSourceBundleMarkdown;
  var bytesToHex = viewModelApi.bytesToHex;
  var categoryById = viewModelApi.categoryById;
  var cloneWorkspace = viewModelApi.cloneWorkspace;
  var cmsOptions = viewModelApi.cmsOptions;
  var combineStatus = viewModelApi.combineStatus;
  var createDefaultChecklist = viewModelApi.createDefaultChecklist;
  var createDefaultWorkspace = viewModelApi.createDefaultWorkspace;
  var createSourceBundleOnlyRunbook = viewModelApi.createSourceBundleOnlyRunbook;
  var databaseOptions = viewModelApi.databaseOptions;
  var deployOptions = viewModelApi.deployOptions;
  var effortOptions = viewModelApi.effortOptions;
  var escapeAttr = viewModelApi.escapeAttr;
  var escapeHtml = viewModelApi.escapeHtml;
  var extractOperatorRunbookPayload = viewModelApi.extractOperatorRunbookPayload;
  var fillRunbookKeyIndexFromRows = viewModelApi.fillRunbookKeyIndexFromRows;
  var formatDate = viewModelApi.formatDate;
  var formatEmptyRunbookRowsMessage = viewModelApi.formatEmptyRunbookRowsMessage;
  var formatSourceBundleMarkdownCommand = viewModelApi.formatSourceBundleMarkdownCommand;
  var formatSourceBundleMarkdownStatus = viewModelApi.formatSourceBundleMarkdownStatus;
  var formatSourceBundleRevalidationMarkdown = viewModelApi.formatSourceBundleRevalidationMarkdown;
  var formatSourceBundleRevalidationSummary = viewModelApi.formatSourceBundleRevalidationSummary;
  var impactOptions = viewModelApi.impactOptions;
  var importedArtifact = viewModelApi.importedArtifact;
  var isWorkspacePayload = viewModelApi.isWorkspacePayload;
  var labelize = viewModelApi.labelize;
  var linesToText = viewModelApi.linesToText;
  var markdownList = viewModelApi.markdownList;
  var mcpAdvice = viewModelApi.mcpAdvice;
  var mcpItems = viewModelApi.mcpItems;
  var mcpLevel = viewModelApi.mcpLevel;
  var mcpState = viewModelApi.mcpState;
  var mcpStatusOptions = viewModelApi.mcpStatusOptions;
  var metric = viewModelApi.metric;
  var normalizeChecklist = viewModelApi.normalizeChecklist;
  var normalizeEnum = viewModelApi.normalizeEnum;
  var normalizeImplementationEvidence = viewModelApi.normalizeImplementationEvidence;
  var normalizeLinkedPreview = viewModelApi.normalizeLinkedPreview;
  var normalizeMcp = viewModelApi.normalizeMcp;
  var normalizeOperatorRunbook = viewModelApi.normalizeOperatorRunbook;
  var normalizePlainObject = viewModelApi.normalizePlainObject;
  var normalizeRunbookKeyIndex = viewModelApi.normalizeRunbookKeyIndex;
  var normalizeRunbookRow = viewModelApi.normalizeRunbookRow;
  var normalizeStringArray = viewModelApi.normalizeStringArray;
  var normalizeTasks = viewModelApi.normalizeTasks;
  var normalizeWorkspace = viewModelApi.normalizeWorkspace;
  var optionList = viewModelApi.optionList;
  var orderedTasks = viewModelApi.orderedTasks;
  var panel = viewModelApi.panel;
  var pill = viewModelApi.pill;
  var priorityOptions = viewModelApi.priorityOptions;
  var profileNodeId = viewModelApi.profileNodeId;
  var qualityStatusBadge = viewModelApi.qualityStatusBadge;
  var recommendedMcpForCategory = viewModelApi.recommendedMcpForCategory;
  var renderBrowserProbes = viewModelApi.renderBrowserProbes;
  var renderGraphLanes = viewModelApi.renderGraphLanes;
  var renderGraphNode = viewModelApi.renderGraphNode;
  var renderGraphNodeMeta = viewModelApi.renderGraphNodeMeta;
  var renderImplementationEvidence = viewModelApi.renderImplementationEvidence;
  var renderImplementationScopeApproval = viewModelApi.renderImplementationScopeApproval;
  var renderImplementationScopeProposal = viewModelApi.renderImplementationScopeProposal;
  var renderPilotEvidence = viewModelApi.renderPilotEvidence;
  var renderQualityFindings = viewModelApi.renderQualityFindings;
  var renderQualityReportArtifact = viewModelApi.renderQualityReportArtifact;
  var renderReviewComparisonArtifact = viewModelApi.renderReviewComparisonArtifact;
  var renderReviewHandoffReceipt = viewModelApi.renderReviewHandoffReceipt;
  var renderReviewHandoffSession = viewModelApi.renderReviewHandoffSession;
  var renderReviewWorkflowSession = viewModelApi.renderReviewWorkflowSession;
  var renderRunbookFilterButton = viewModelApi.renderRunbookFilterButton;
  var renderRunbookMetadata = viewModelApi.renderRunbookMetadata;
  var renderRunbookProvenanceOnlyNotice = viewModelApi.renderRunbookProvenanceOnlyNotice;
  var renderRunbookRows = viewModelApi.renderRunbookRows;
  var renderRunbookSourceBundleDetails = viewModelApi.renderRunbookSourceBundleDetails;
  var renderRunbookSourceBundleWarning = viewModelApi.renderRunbookSourceBundleWarning;
  var renderStartList = viewModelApi.renderStartList;
  var renderStartReferences = viewModelApi.renderStartReferences;
  var renderTargetRepoIntake = viewModelApi.renderTargetRepoIntake;
  var renderTaskRow = viewModelApi.renderTaskRow;
  var renderViewportField = viewModelApi.renderViewportField;
  var safeFileSegment = viewModelApi.safeFileSegment;
  var selectField = viewModelApi.selectField;
  var setByPath = viewModelApi.setByPath;
  var shortDisplay = viewModelApi.shortDisplay;
  var sourceBundleCommandRow = viewModelApi.sourceBundleCommandRow;
  var sourceBundleCopyRow = viewModelApi.sourceBundleCopyRow;
  var sourceBundleMarkdownRow = viewModelApi.sourceBundleMarkdownRow;
  var sourceBundleRevalidationRow = viewModelApi.sourceBundleRevalidationRow;
  var sourceBundleRow = viewModelApi.sourceBundleRow;
  var statusOptions = viewModelApi.statusOptions;
  var tabs = viewModelApi.tabs;
  var taskBlock = viewModelApi.taskBlock;
  var taskFromCategoryForWorkspace = viewModelApi.taskFromCategoryForWorkspace;
  var templates = viewModelApi.templates;
  var textField = viewModelApi.textField;
  var textToLines = viewModelApi.textToLines;
  var textareaField = viewModelApi.textareaField;
  var viewportOptions = viewModelApi.viewportOptions;
  var workflowEdge = viewModelApi.workflowEdge;
  var workflowNode = viewModelApi.workflowNode;
  var workflowTasks = viewModelApi.workflowTasks;
  var workspaceStatus = viewModelApi.workspaceStatus;

  var importedReviewComparison = loadImportedArtifact(REVIEW_COMPARISON_KEY, normalizeReviewComparisonArtifact);
  var importedPilotEvidence = loadImportedArtifact(PILOT_EVIDENCE_KEY, normalizePilotEvidenceArtifact);
  var importedImplementationEvidence = importedPilotEvidence
    ? importedArtifact(
      normalizeImplementationEvidenceArtifact(importedPilotEvidence.value.implementationEvidence.value),
      importedPilotEvidence.value.implementationEvidence.source,
    )
    : loadImportedArtifact(IMPLEMENTATION_EVIDENCE_KEY, normalizeImplementationEvidenceArtifact);
  var importedScopeApproval = importedImplementationEvidence
    ? importedArtifact(
      normalizeImplementationScopeApproval(importedImplementationEvidence.value.approval.value),
      importedImplementationEvidence.value.approval.source,
    )
    : loadImportedArtifact(IMPLEMENTATION_SCOPE_APPROVAL_KEY, normalizeImplementationScopeApproval);
  var importedScopeProposal = importedScopeApproval
    ? importedArtifact(
      normalizeImplementationScopeProposal(importedScopeApproval.value.proposal.value),
      importedScopeApproval.value.proposal.source,
    )
    : loadImportedArtifact(IMPLEMENTATION_SCOPE_PROPOSAL_KEY, normalizeImplementationScopeProposal);
  var importedTargetRepoIntake = importedScopeProposal
    ? importedArtifact(
      normalizeTargetRepoIntake(importedScopeProposal.value.intake.value),
      importedScopeProposal.value.intake.source,
    )
    : loadImportedArtifact(TARGET_REPO_INTAKE_KEY, normalizeTargetRepoIntake);
  var importedReviewReceipt = importedPilotEvidence ? null : loadImportedArtifact(
    REVIEW_HANDOFF_RECEIPT_KEY,
    normalizeReviewHandoffReceipt,
  );
  if (importedTargetRepoIntake && importedReviewReceipt
    && !targetRepoIntakeMatchesReceipt(importedTargetRepoIntake.value, importedReviewReceipt.rawJson)) {
    importedTargetRepoIntake = null;
    localStorage.removeItem(TARGET_REPO_INTAKE_KEY);
  }
  var importedReviewHandoff = importedPilotEvidence ? null : importedReviewReceipt
    ? importedArtifact(
      normalizeReviewHandoff(importedReviewReceipt.value.handoff.value),
      importedReviewReceipt.value.handoff.source,
    )
    : loadImportedArtifact(REVIEW_HANDOFF_KEY, normalizeReviewHandoff);
  var importedReviewWorkflow = importedPilotEvidence
    ? importedArtifact(
      normalizeReviewWorkflow(importedPilotEvidence.value.reviewWorkflow.value),
      importedPilotEvidence.value.reviewWorkflow.source,
    )
    : importedReviewHandoff
    ? importedArtifact(
      normalizeReviewWorkflow(importedReviewHandoff.value.artifacts.reviewWorkflow.value),
      importedReviewHandoff.value.artifacts.reviewWorkflow.source,
    )
    : loadImportedArtifact(REVIEW_WORKFLOW_KEY, normalizeReviewWorkflow);
  var appState = {
    workspace: loadWorkspace(),
    reviewComparison: importedReviewComparison,
    pilotEvidence: importedPilotEvidence,
    implementationEvidence: importedImplementationEvidence,
    implementationScopeApproval: importedScopeApproval,
    implementationScopeProposal: importedScopeProposal,
    targetRepoIntake: importedTargetRepoIntake,
    reviewReceipt: importedReviewReceipt,
    reviewHandoff: importedReviewHandoff,
    reviewWorkflow: importedReviewWorkflow,
    startPlan: importedReviewWorkflow
      ? normalizeStartPlan(importedReviewWorkflow.value.plan)
      : loadStartPlan(),
    qualityReport: importedReviewWorkflow
      ? importedArtifact(normalizeQualityReport(importedReviewWorkflow.value.report), "")
      : loadImportedArtifact(QUALITY_REPORT_KEY, normalizeQualityReport),
    browserVerification: importedReviewHandoff
      ? importedReviewHandoff.value.artifacts.browserVerification
        ? importedArtifact(
          normalizeBrowserVerification(importedReviewHandoff.value.artifacts.browserVerification.value),
          importedReviewHandoff.value.artifacts.browserVerification.source,
        )
        : null
      : loadImportedArtifact(BROWSER_VERIFICATION_KEY, normalizeBrowserVerification),
    qualityLink: { digestStatus: "not-checked", missingViewports: [] },
    activeTab: loadActiveTab(),
    selectedTemplate: localStorage.getItem(SELECTED_TEMPLATE_KEY) || "codex-repo-intake",
    runbookActionFilter: "all",
    runbookEvidenceFilter: "all",
    message: "",
  };

  function loadWorkspace() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return createDefaultWorkspace();
      return normalizeWorkspace(JSON.parse(stored));
    } catch (error) {
      return createDefaultWorkspace();
    }
  }

  function loadStartPlan() {
    try {
      var stored = localStorage.getItem(START_PLAN_KEY);
      return stored ? normalizeStartPlan(JSON.parse(stored)) : null;
    } catch (error) {
      return null;
    }
  }

  function loadImportedArtifact(key, normalize) {
    try {
      var rawJson = localStorage.getItem(key);
      if (!rawJson) return null;
      var value = normalize(JSON.parse(rawJson));
      return value ? { value: value, rawJson: rawJson } : null;
    } catch (error) {
      return null;
    }
  }

  function saveImportedArtifact(key, artifact) {
    if (!artifact) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, buildImportedArtifactJson(artifact.value, artifact.rawJson));
  }

  function clearReviewWorkflowSession() {
    appState.pilotEvidence = null;
    saveImportedArtifact(PILOT_EVIDENCE_KEY, null);
    clearImplementationScopeProposalSession();
    appState.targetRepoIntake = null;
    saveImportedArtifact(TARGET_REPO_INTAKE_KEY, null);
    appState.reviewReceipt = null;
    saveImportedArtifact(REVIEW_HANDOFF_RECEIPT_KEY, null);
    appState.reviewHandoff = null;
    saveImportedArtifact(REVIEW_HANDOFF_KEY, null);
    appState.reviewWorkflow = null;
    saveImportedArtifact(REVIEW_WORKFLOW_KEY, null);
    appState.startPlan = loadStartPlan();
    appState.qualityReport = loadImportedArtifact(QUALITY_REPORT_KEY, normalizeQualityReport);
  }

  function clearReviewHandoffSession() {
    appState.pilotEvidence = null;
    saveImportedArtifact(PILOT_EVIDENCE_KEY, null);
    clearImplementationScopeProposalSession();
    appState.targetRepoIntake = null;
    saveImportedArtifact(TARGET_REPO_INTAKE_KEY, null);
    appState.reviewReceipt = null;
    saveImportedArtifact(REVIEW_HANDOFF_RECEIPT_KEY, null);
    appState.reviewHandoff = null;
    saveImportedArtifact(REVIEW_HANDOFF_KEY, null);
    appState.reviewWorkflow = loadImportedArtifact(REVIEW_WORKFLOW_KEY, normalizeReviewWorkflow);
    appState.startPlan = appState.reviewWorkflow
      ? normalizeStartPlan(appState.reviewWorkflow.value.plan)
      : loadStartPlan();
    appState.qualityReport = appState.reviewWorkflow
      ? importedArtifact(normalizeQualityReport(appState.reviewWorkflow.value.report), "")
      : loadImportedArtifact(QUALITY_REPORT_KEY, normalizeQualityReport);
    appState.browserVerification = loadImportedArtifact(BROWSER_VERIFICATION_KEY, normalizeBrowserVerification);
  }

  function clearReviewReceiptSession() {
    appState.pilotEvidence = null;
    saveImportedArtifact(PILOT_EVIDENCE_KEY, null);
    clearImplementationScopeProposalSession();
    appState.targetRepoIntake = null;
    saveImportedArtifact(TARGET_REPO_INTAKE_KEY, null);
    appState.reviewReceipt = null;
    saveImportedArtifact(REVIEW_HANDOFF_RECEIPT_KEY, null);
    appState.reviewHandoff = loadImportedArtifact(REVIEW_HANDOFF_KEY, normalizeReviewHandoff);
    if (!appState.reviewHandoff) {
      clearReviewHandoffSession();
      return;
    }
    var handoff = appState.reviewHandoff.value;
    appState.reviewWorkflow = importedArtifact(
      normalizeReviewWorkflow(handoff.artifacts.reviewWorkflow.value),
      handoff.artifacts.reviewWorkflow.source,
    );
    appState.startPlan = normalizeStartPlan(handoff.artifacts.reviewWorkflow.value.plan);
    appState.qualityReport = importedArtifact(
      normalizeQualityReport(handoff.artifacts.reviewWorkflow.value.report),
      handoff.artifacts.qualityReport ? handoff.artifacts.qualityReport.source : "",
    );
    appState.browserVerification = handoff.artifacts.browserVerification
      ? importedArtifact(
        normalizeBrowserVerification(handoff.artifacts.browserVerification.value),
        handoff.artifacts.browserVerification.source,
      )
      : null;
  }

  function clearTargetRepoIntakeSession() {
    clearImplementationScopeProposalSession();
    appState.targetRepoIntake = null;
    saveImportedArtifact(TARGET_REPO_INTAKE_KEY, null);
  }

  function clearImplementationScopeApprovalSession() {
    appState.pilotEvidence = null;
    saveImportedArtifact(PILOT_EVIDENCE_KEY, null);
    appState.implementationEvidence = null;
    saveImportedArtifact(IMPLEMENTATION_EVIDENCE_KEY, null);
    appState.implementationScopeApproval = null;
    saveImportedArtifact(IMPLEMENTATION_SCOPE_APPROVAL_KEY, null);
    appState.implementationScopeProposal = loadImportedArtifact(
      IMPLEMENTATION_SCOPE_PROPOSAL_KEY,
      normalizeImplementationScopeProposal,
    );
    if (appState.implementationScopeProposal) {
      appState.targetRepoIntake = importedArtifact(
        normalizeTargetRepoIntake(appState.implementationScopeProposal.value.intake.value),
        appState.implementationScopeProposal.value.intake.source,
      );
    }
  }

  function clearImplementationScopeProposalSession() {
    appState.pilotEvidence = null;
    saveImportedArtifact(PILOT_EVIDENCE_KEY, null);
    appState.implementationEvidence = null;
    saveImportedArtifact(IMPLEMENTATION_EVIDENCE_KEY, null);
    appState.implementationScopeApproval = null;
    saveImportedArtifact(IMPLEMENTATION_SCOPE_APPROVAL_KEY, null);
    appState.implementationScopeProposal = null;
    saveImportedArtifact(IMPLEMENTATION_SCOPE_PROPOSAL_KEY, null);
    appState.targetRepoIntake = loadImportedArtifact(TARGET_REPO_INTAKE_KEY, normalizeTargetRepoIntake);
  }

  function clearImplementationEvidenceSession() {
    appState.pilotEvidence = null;
    saveImportedArtifact(PILOT_EVIDENCE_KEY, null);
    appState.implementationEvidence = null;
    saveImportedArtifact(IMPLEMENTATION_EVIDENCE_KEY, null);
  }

  function clearPilotEvidenceSession() {
    appState.pilotEvidence = null;
    saveImportedArtifact(PILOT_EVIDENCE_KEY, null);
    appState.implementationEvidence = loadImportedArtifact(
      IMPLEMENTATION_EVIDENCE_KEY,
      normalizeImplementationEvidenceArtifact,
    );
  }

  function saveStartPlan() {
    if (appState.startPlan) {
      localStorage.setItem(START_PLAN_KEY, buildStartPlanJson(appState.startPlan));
    } else {
      localStorage.removeItem(START_PLAN_KEY);
    }
  }

  function loadActiveTab() {
    var stored = localStorage.getItem(ACTIVE_TAB_KEY);
    return tabs.some(function (tab) { return tab[0] === stored; }) ? stored : "start";
  }

  function saveWorkspace() {
    appState.workspace.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState.workspace, null, 2));
  }

  function setMessage(text) {
    appState.message = text;
    render();
  }

  function metricData() {
    var checklist = appState.workspace.auditChecklist;
    var done = auditCategories.filter(function (item) { return checklist[item.id].status === "done"; }).length;
    var blocked = auditCategories.filter(function (item) { return checklist[item.id].status === "blocked"; }).length;
    var requiredMcp = mcpItems.filter(function (item) {
      return appState.workspace.mcpReadiness[item[0]] === "required";
    }).length;
    var evidence = appState.workspace.implementationEvidence;
    var evidenceCount = evidence.executedWork.length + evidence.verificationResults.length;
    var runbook = appState.workspace.operatorRunbook;
    var graph = buildWorkflowGraph();
    return {
      pages: appState.workspace.siteProfile.pages.length,
      done: done,
      blocked: blocked,
      tasks: appState.workspace.refactorTasks.length,
      requiredMcp: requiredMcp,
      evidence: evidenceCount,
      runbookStages: runbook ? runbook.stageCount || runbook.stageHumanLineDisplayRows.length : 0,
      graphNodes: graph.summary.nodeCount,
      graphEdges: graph.summary.edgeCount,
    };
  }

  function render() {
    var root = document.getElementById("app");
    if (!root) return;
    var metrics = metricData();
    root.dataset.status = "ready";
    root.innerHTML = [
      "<div class=\"workspace\">",
      renderSidebar(metrics),
      "<main id=\"main\" class=\"main\" tabindex=\"-1\">",
      renderTopbar(metrics),
      renderActivePanel(),
      "</main>",
      "</div>",
      "<div class=\"sr-only\" aria-live=\"polite\">" + escapeHtml(appState.message) + "</div>",
    ].join("");
  }

  function renderSidebar(metrics) {
    return [
      "<aside class=\"sidebar\" aria-label=\"Website console sections\">",
      "<div class=\"brand\">",
      "<span class=\"brand__eyebrow\">design-ai</span>",
      "<h1>Website Console</h1>",
      "<p>Local control tower for site audits, MCP readiness, prompts, and handoff reports.</p>",
      "</div>",
      "<ul class=\"nav-list\">",
      tabs.map(function (tab) {
        var id = tab[0];
        var label = tab[1];
        var count = sidebarCount(id, metrics);
        return [
          "<li>",
          "<button type=\"button\" class=\"nav-button\" data-nav=\"" + escapeAttr(id) + "\" aria-current=\"" + (appState.activeTab === id ? "page" : "false") + "\">",
          "<span>" + escapeHtml(label) + "</span>",
          count ? "<span class=\"nav-count\">" + escapeHtml(count) + "</span>" : "",
          "</button>",
          "</li>",
        ].join("");
      }).join(""),
      "</ul>",
      "<div class=\"sidebar-actions\">",
      "<button type=\"button\" class=\"button button--primary\" data-action=\"export-workspace\">Export JSON</button>",
      "<button type=\"button\" class=\"button\" data-action=\"import-click\" aria-label=\"Import review comparison, pilot evidence, implementation evidence, scope approval, scope proposal, target intake, review receipt, handoff, workflow, quality, browser, start, workspace, runbook, or preview JSON\">Import JSON</button>",
      "<input class=\"sr-only\" type=\"file\" accept=\"application/json,.json\" id=\"import-file\" data-action=\"import-file\">",
      "<button type=\"button\" class=\"button button--danger\" data-action=\"reset-sample\">Reset sample</button>",
      appState.message ? "<p class=\"field\"><small>" + escapeHtml(appState.message) + "</small></p>" : "",
      "</div>",
      "</aside>",
    ].join("");
  }

  function sidebarCount(id, metrics) {
    if (id === "start") return appState.startPlan ? "1" : "";
    if (id === "quality") {
      var reviewCount = appState.reviewWorkflow || appState.qualityReport ? 1 : 0;
      var artifactCount = reviewCount + (appState.reviewComparison ? 1 : 0) + (appState.browserVerification ? 1 : 0);
      return artifactCount ? String(artifactCount) : "";
    }
    if (id === "audit") return metrics.done + "/" + auditCategories.length;
    if (id === "tasks") return String(metrics.tasks);
    if (id === "mcp") return String(metrics.requiredMcp);
    if (id === "graph") return String(metrics.graphNodes);
    if (id === "report" && (metrics.evidence || metrics.runbookStages)) {
      return String(metrics.evidence || metrics.runbookStages);
    }
    return "";
  }

  function renderTopbar(metrics) {
    var profile = appState.workspace.siteProfile;
    var isStart = appState.activeTab === "start";
    var isQuality = appState.activeTab === "quality";
    var startDescription = appState.startPlan
      ? "Review the imported route, design contract, declared context, and next safe command. No declared reference has been inspected."
      : "Generate a read-only start JSON in the CLI, then import it here to review the route, contract, and execution boundary.";
    var description = isStart
      ? startDescription
      : isQuality
        ? "Inspect exact review evidence and verified before-and-after decisions. Missing runtime proof remains unverified."
        : profile.name + " is tracked locally. Use this app to prepare website improvement work before switching into the target repo.";
    var metadata = isStart
      ? renderStartMetadata()
      : isQuality
        ? "<span class=\"badge badge--optional\">Browser-local evidence</span><span class=\"badge badge--optional\">No semantic merge</span>"
        : badge(appState.workspace.version === 1 ? "done" : "blocked")
          + "<span class=\"badge badge--optional\">Updated " + escapeHtml(formatDate(appState.workspace.updatedAt)) + "</span>";
    return [
      "<section class=\"topbar\" aria-label=\"Workspace summary\">",
      "<div>",
      "<h2>" + escapeHtml(tabs.find(function (tab) { return tab[0] === appState.activeTab; })[1]) + "</h2>",
      "<p>" + escapeHtml(description) + "</p>",
      "</div>",
      "<div class=\"topbar__meta\">",
      metadata,
      "</div>",
      "</section>",
      isStart || isQuality ? "" : [
      "<section class=\"summary-strip\" aria-label=\"Workspace metrics\">",
      metric("Pages", metrics.pages, "Priority URLs tracked"),
      metric("Audit done", metrics.done + "/" + auditCategories.length, metrics.blocked + " blocked"),
      metric("Tasks", metrics.tasks, "Refactor plan items"),
      metric("Required MCP", metrics.requiredMcp, "Connections to prepare"),
      "</section>",
      ].join(""),
    ].join("");
  }

  function renderStartMetadata() {
    var statusClass = appState.startPlan ? "pass" : "optional";
    var statusLabel = appState.startPlan ? "Plan ready" : "Awaiting JSON";
    return "<span class=\"badge badge--" + statusClass + "\">" + statusLabel + "</span>"
      + "<span class=\"badge badge--optional\">Browser-local state</span>";
  }

  function renderActivePanel() {
    if (appState.activeTab === "start") return renderStart();
    if (appState.activeTab === "quality") return renderQualityReview();
    if (appState.activeTab === "profile") return renderProfile();
    if (appState.activeTab === "audit") return renderAudit();
    if (appState.activeTab === "mcp") return renderMcp();
    if (appState.activeTab === "graph") return renderGraph();
    if (appState.activeTab === "tasks") return renderTasks();
    if (appState.activeTab === "prompts") return renderPrompts();
    return renderReport();
  }

  function renderStart() {
    var plan = appState.startPlan;
    if (!plan) {
      var example = "design-ai start \"Improve the Korean fintech account settings flow\" --local-path /absolute/path/to/repo --locale ko-KR --viewport mobile --viewport desktop --json";
      return panel("Start with one brief", "Create one route, one design contract, and one explicit next step before any target work begins.", [
        "<div class=\"notice\">The command reads the design-ai corpus only. Declared repositories, URLs, and screenshots remain uninspected until a later approved step.</div>",
        "<pre class=\"report-preview start-command\"><code>" + escapeHtml(example) + "</code></pre>",
        "<div class=\"button-row start-actions start-actions--compact\"><button type=\"button\" class=\"button button--primary\" data-action=\"copy-start-example\">Copy start command</button></div>",
        "<div class=\"graph-boundaries\" aria-label=\"Start command boundaries\"><span class=\"pill\">Read-only planning</span><span class=\"pill\">No repository scan</span><span class=\"pill\">No browser request</span><span class=\"pill\">No target mutation</span></div>",
      ].join(""));
    }

    var route = plan.route || {};
    var review = plan.review || {};
    var pathway = plan.pathway || {};
    var effects = plan.effects || {};
    var performed = effects.performed || {};
    var intended = effects.intended || {};
    var references = Array.isArray(intended.reads) ? intended.reads : [];
    var approvals = Array.isArray(effects.approvalRequiredBefore) ? effects.approvalRequiredBefore : [];
    var contract = plan.designContract || {};
    return panel("Start plan", "Review the selected route and execution boundary before copying the next command.", [
      "<div class=\"evidence-summary\" aria-label=\"Start plan summary\">",
      metric("Route", route.label || route.id || "unknown", route.confidence || "not recorded"),
      metric("Review", review.executed ? "executed" : "not run", review.status || "not recorded"),
      metric("Next step", pathway.status || "not recorded", pathway.id || "no pathway"),
      metric("Declared refs", references.length, "0 inspected by start"),
      "</div>",
      "<div class=\"graph-boundaries\" aria-label=\"Start plan boundaries\"><span class=\"badge badge--pass\">Read-only start</span><span class=\"pill\">" + escapeHtml(String((performed.reads || []).length)) + " corpus files read</span><span class=\"pill\">0 local writes</span><span class=\"pill\">0 target mutations</span><span class=\"pill\">0 external actions</span></div>",
      "<div class=\"grid-2 start-details\">",
      "<div><h4>Brief</h4><p>" + escapeHtml(plan.brief) + "</p><h4>Next command</h4><pre class=\"report-preview start-command\"><code>" + escapeHtml(pathway.command || "No command available") + "</code></pre></div>",
      "<div><h4>Declared references</h4>" + renderStartReferences(references) + "<h4>Approval gates</h4>" + renderStartList(approvals, "No additional approval gates recorded.") + "</div>",
      "</div>",
      "<div class=\"button-row start-actions\"><button type=\"button\" class=\"button button--primary\" data-action=\"copy-start-command\">Copy next command</button><button type=\"button\" class=\"button\" data-action=\"copy-start-contract\">Copy design contract</button><button type=\"button\" class=\"button\" data-action=\"download-start-plan\">Export start JSON</button><button type=\"button\" class=\"button button--danger\" data-action=\"clear-start-plan\">Clear start plan</button></div>",
      contract.markdown ? "<details class=\"start-contract\"><summary>Review design contract</summary><pre class=\"report-preview\">" + escapeHtml(contract.markdown) + "</pre></details>" : "",
    ].join(""));
  }

  function renderQualityReview() {
    var reviewComparisonArtifact = appState.reviewComparison;
    var pilotEvidenceArtifact = appState.pilotEvidence;
    var implementationEvidenceArtifact = appState.implementationEvidence;
    var scopeApprovalArtifact = appState.implementationScopeApproval;
    var scopeProposalArtifact = appState.implementationScopeProposal;
    var targetRepoIntakeArtifact = appState.targetRepoIntake;
    var reviewReceiptArtifact = appState.reviewReceipt;
    var reviewHandoffArtifact = appState.reviewHandoff;
    var reviewWorkflowArtifact = appState.reviewWorkflow;
    var qualityArtifact = appState.qualityReport;
    var browserArtifact = appState.browserVerification;
    if (!reviewComparisonArtifact && !pilotEvidenceArtifact && !implementationEvidenceArtifact && !scopeApprovalArtifact && !scopeProposalArtifact && !targetRepoIntakeArtifact
      && !reviewReceiptArtifact && !reviewHandoffArtifact
      && !reviewWorkflowArtifact && !qualityArtifact && !browserArtifact) {
      return panel("Import review evidence", "Import a canonical review workflow, quality-report JSON, or optional browser-verification JSON without changing either contract.", [
        "<pre class=\"report-preview start-command\"><code>design-ai inspect page.html --brief \"Review Korean product flow\" --review-pack korean-fintech --locale ko-KR --viewport mobile --viewport desktop --json</code></pre>",
        "<div class=\"graph-boundaries\" aria-label=\"Quality review boundaries\"><span class=\"pill\">Raw JSON preserved</span><span class=\"pill\">No semantic merge</span><span class=\"pill\">No browser run</span><span class=\"pill\">No target mutation</span></div>",
      ].join(""));
    }

    return [
      reviewComparisonArtifact
        ? renderReviewComparisonArtifact(reviewComparisonArtifact.value)
        : "",
      pilotEvidenceArtifact
        ? renderPilotEvidence(pilotEvidenceArtifact.value)
        : implementationEvidenceArtifact
          ? renderImplementationEvidence(implementationEvidenceArtifact.value)
        : scopeApprovalArtifact
          ? renderImplementationScopeApproval(scopeApprovalArtifact.value)
          : scopeProposalArtifact
            ? renderImplementationScopeProposal(scopeProposalArtifact.value)
            : targetRepoIntakeArtifact
              ? renderTargetRepoIntake(targetRepoIntakeArtifact.value)
              : "",
      reviewReceiptArtifact
        ? renderReviewHandoffReceipt(reviewReceiptArtifact.value)
        : "",
      reviewHandoffArtifact
        ? renderReviewHandoffSession(reviewHandoffArtifact.value)
        : reviewWorkflowArtifact ? renderReviewWorkflowSession(reviewWorkflowArtifact.value) : "",
      qualityArtifact
        ? renderQualityReportArtifact(qualityArtifact.value)
        : panel("Quality report", "The browser sidecar cannot replace its source quality report.", "<div class=\"empty-state\">Import the exact source quality-report JSON to verify the sidecar digest and declared viewport coverage.</div>"),
      browserArtifact
        ? renderBrowserVerificationArtifact(browserArtifact.value)
        : panel("Browser verification", "Runtime evidence remains separate and optional.", "<div class=\"empty-state\">No browser-verification JSON imported. Static and runtime-unknown findings remain unchanged.</div>"),
      "<div class=\"button-row\">",
      reviewComparisonArtifact
        ? "<button type=\"button\" class=\"button button--primary\" data-action=\"download-review-comparison\">Export original comparison JSON</button><button type=\"button\" class=\"button button--danger\" data-action=\"clear-review-comparison\">Clear review comparison</button>"
        : "",
      pilotEvidenceArtifact
        ? "<button type=\"button\" class=\"button button--primary\" data-action=\"download-pilot-evidence\">Export original pilot JSON</button><button type=\"button\" class=\"button button--danger\" data-action=\"clear-pilot-evidence\">Clear pilot evidence</button>"
        : implementationEvidenceArtifact
          ? "<button type=\"button\" class=\"button button--primary\" data-action=\"download-implementation-evidence\">Export original evidence JSON</button><button type=\"button\" class=\"button button--danger\" data-action=\"clear-implementation-evidence\">Clear implementation evidence</button>"
        : scopeApprovalArtifact
          ? "<button type=\"button\" class=\"button button--primary\" data-action=\"download-scope-approval\">Export original approval JSON</button><button type=\"button\" class=\"button button--danger\" data-action=\"clear-scope-approval\">Clear scope approval</button>"
          : scopeProposalArtifact
          ? "<button type=\"button\" class=\"button button--primary\" data-action=\"download-scope-proposal\">Export original proposal JSON</button><button type=\"button\" class=\"button button--danger\" data-action=\"clear-scope-proposal\">Clear scope proposal</button>"
          : targetRepoIntakeArtifact
            ? "<button type=\"button\" class=\"button button--primary\" data-action=\"download-target-intake\">Export original intake JSON</button><button type=\"button\" class=\"button button--danger\" data-action=\"clear-target-intake\">Clear target intake</button>"
          : reviewReceiptArtifact
          ? "<button type=\"button\" class=\"button button--primary\" data-action=\"download-review-receipt\">Export original receipt JSON</button><button type=\"button\" class=\"button button--danger\" data-action=\"clear-review-receipt\">Clear validation receipt</button>"
        : reviewHandoffArtifact
          ? "<button type=\"button\" class=\"button button--primary\" data-action=\"download-review-handoff\">Export original handoff JSON</button><button type=\"button\" class=\"button button--danger\" data-action=\"clear-review-handoff\">Clear review handoff</button>"
        : reviewWorkflowArtifact
        ? "<button type=\"button\" class=\"button button--primary\" data-action=\"download-review-workflow\">Export original review JSON</button><button type=\"button\" class=\"button button--danger\" data-action=\"clear-review-workflow\">Clear review workflow</button>"
        : qualityArtifact
        ? "<button type=\"button\" class=\"button button--primary\" data-action=\"download-quality-report\">Export original quality JSON</button><button type=\"button\" class=\"button button--danger\" data-action=\"clear-quality-report\">Clear quality report</button>"
        : "",
      browserArtifact
        ? "<button type=\"button\" class=\"button\" data-action=\"download-browser-verification\">Export original browser JSON</button><button type=\"button\" class=\"button button--danger\" data-action=\"clear-browser-verification\">Clear browser evidence</button>"
        : "",
      "</div>",
    ].join("");
  }

  function renderBrowserVerificationArtifact(report) {
    var link = appState.qualityLink;
    var viewportNote = link.missingViewports.length
      ? "Missing: " + link.missingViewports.join(", ")
      : "Declared quality viewports covered";
    return panel("Browser verification", "Approved local evidence sidecar. It remains independent from the quality report.", [
      "<div class=\"evidence-summary\" aria-label=\"Browser verification summary\">",
      metric("Status", report.summary.status, report.summary.nextAction),
      metric("Passed", report.summary.passed, "Probe results"),
      metric("Failed", report.summary.failed, "Probe results"),
      metric("Unverified", report.summary.unverified, "Probe results"),
      "</div>",
      "<div class=\"graph-boundaries\" aria-label=\"Browser verification linkage\">" + qualityStatusBadge(report.summary.status) + "<span class=\"pill\">Digest " + escapeHtml(link.digestStatus) + "</span><span class=\"pill\">" + escapeHtml(viewportNote) + "</span><span class=\"pill\">Approved: " + escapeHtml(report.approval.reference) + "</span></div>",
      "<div class=\"notice\">The sidecar does not resolve purpose-frequency or spatial-continuity by itself. Unmapped and missing-viewport evidence remains unverified.</div>",
      "<h4>Runtime probes</h4>",
      renderBrowserProbes(report.probes),
    ].join(""));
  }

  function refreshQualityLink() {
    var qualityArtifact = appState.qualityReport;
    var browserArtifact = appState.browserVerification;
    var qualityViewports = qualityArtifact ? qualityArtifact.value.context.viewports : [];
    var browserViewports = browserArtifact ? browserArtifact.value.viewports.map(function (viewport) {
      return viewport.name;
    }) : [];
    appState.qualityLink.missingViewports = qualityViewports.filter(function (viewport) {
      return browserViewports.indexOf(viewport) === -1;
    });

    if (!qualityArtifact || !browserArtifact) {
      appState.qualityLink.digestStatus = "not-checked";
      render();
      return Promise.resolve();
    }
    if (!window.crypto || !window.crypto.subtle || typeof TextEncoder === "undefined") {
      appState.qualityLink.digestStatus = "unavailable";
      render();
      return Promise.resolve();
    }
    return window.crypto.subtle.digest("SHA-256", new TextEncoder().encode(qualityArtifact.rawJson)).then(function (digest) {
      appState.qualityLink.digestStatus = bytesToHex(digest) === browserArtifact.value.sourceReport.sha256
        ? "matched"
        : "mismatch";
      render();
    }).catch(function () {
      appState.qualityLink.digestStatus = "unavailable";
      render();
    });
  }

  function renderProfile() {
    var profile = appState.workspace.siteProfile;
    return [
      panel("Site Profile", "Baseline inputs used by audits, tasks, prompts, and handoff reports.", [
        "<div class=\"form-grid\">",
        textField("Site name", "siteProfile.name", profile.name),
        textField("Live URL", "siteProfile.liveUrl", profile.liveUrl),
        textField("Repo URL", "siteProfile.repoUrl", profile.repoUrl),
        textField("Local path", "siteProfile.localPath", profile.localPath),
        textField("Figma URL", "siteProfile.figmaUrl", profile.figmaUrl),
        textField("Sentry project", "siteProfile.sentryProject", profile.sentryProject),
        selectField("Deploy platform", "siteProfile.deployProvider", deployOptions, profile.deployProvider),
        selectField("CMS", "siteProfile.cms", cmsOptions, profile.cms),
        selectField("Database", "siteProfile.database", databaseOptions, profile.database),
        textareaField("Design system / brand notes", "siteProfile.brandNotes", profile.brandNotes, "field--wide"),
        textareaField("Pages", "siteProfile.pages", linesToText(profile.pages), "field--wide", "One path or URL per line."),
        textareaField("User flows", "siteProfile.userFlows", linesToText(profile.userFlows), "field--wide", "One flow per line."),
        renderViewportField(profile.viewports),
        "</div>",
      ].join("")),
      panel("MVP Boundary", "This app coordinates work; target repo code changes happen in the target website repository.", [
        "<div class=\"notice\">No crawling, Lighthouse, axe, visual diff, MCP writes, backend sync, embeddings, or fine-tuning run in this MVP.</div>",
        "<div class=\"grid-3\">",
        boundaryItem("Local first", "State stays in browser localStorage and can be exported as JSON."),
        boundaryItem("Prompt led", "Codex and Claude prompts are generated from the current profile, findings, and tasks."),
        boundaryItem("Repo safe", "This design-ai repo does not include or mutate the target website source code."),
        "</div>",
      ].join("")),
    ].join("");
  }

  function renderAudit() {
    var checklist = appState.workspace.auditChecklist;
    return panel("Audit Pipeline", "Track professional site diagnostics before translating findings into implementation tasks.", [
      "<div class=\"table-wrap\">",
      "<table>",
      "<thead><tr><th>Category</th><th>Status</th><th>Notes</th><th>Findings</th></tr></thead>",
      "<tbody>",
      auditCategories.map(function (category) {
        var row = checklist[category.id];
        return [
          "<tr>",
          "<td><strong>" + escapeHtml(category.label) + "</strong><br><small>" + escapeHtml(category.description) + "</small></td>",
          "<td><select data-audit-status=\"" + escapeAttr(category.id) + "\">" + optionList(statusOptions, row.status) + "</select><br><br>" + badge(row.status) + "</td>",
          "<td><textarea data-audit-notes=\"" + escapeAttr(category.id) + "\">" + escapeHtml(row.notes) + "</textarea></td>",
          "<td><textarea data-audit-findings=\"" + escapeAttr(category.id) + "\">" + escapeHtml(linesToText(row.findings)) + "</textarea><small>One finding per line.</small></td>",
          "</tr>",
        ].join("");
      }).join(""),
      "</tbody>",
      "</table>",
      "</div>",
      "<div class=\"button-row\" style=\"margin-top: 16px;\">",
      "<button type=\"button\" class=\"button button--primary\" data-action=\"generate-tasks\">Generate starter tasks</button>",
      "<button type=\"button\" class=\"button\" data-action=\"mark-audit-todo\">Mark all todo</button>",
      "</div>",
    ].join(""));
  }

  function renderMcp() {
    var readiness = appState.workspace.mcpReadiness;
    return panel("MCP Readiness Matrix", "Classify what the website improvement workflow needs before implementation begins.", [
      "<div class=\"table-wrap\">",
      "<table>",
      "<thead><tr><th>MCP</th><th>Use case</th><th>Status</th><th>Operational note</th></tr></thead>",
      "<tbody>",
      mcpItems.map(function (item) {
        var key = item[0];
        var label = item[1];
        var description = item[2];
        var status = readiness[key];
        return [
          "<tr>",
          "<td><strong>" + escapeHtml(label) + "</strong></td>",
          "<td>" + escapeHtml(description) + "</td>",
          "<td><select data-mcp=\"" + escapeAttr(key) + "\">" + optionList(mcpStatusOptions, status) + "</select><br><br>" + badge(status) + "</td>",
          "<td>" + escapeHtml(mcpAdvice(key, status)) + "</td>",
          "</tr>",
        ].join("");
      }).join(""),
      "</tbody>",
      "</table>",
      "</div>",
    ].join(""));
  }

  function renderTasks() {
    var tasks = appState.workspace.refactorTasks;
    return panel("Refactor Plan", "Starter work items generated from audit findings and refined before sending to Codex.", [
      "<div class=\"button-row\" style=\"margin-bottom: 12px;\">",
      "<button type=\"button\" class=\"button button--primary\" data-action=\"generate-tasks\">Generate from findings</button>",
      "<button type=\"button\" class=\"button\" data-action=\"add-task\">Add manual task</button>",
      "</div>",
      tasks.length === 0 ? "<div class=\"empty-state\">No refactor tasks yet. Add findings in Audit Checklist and generate starter tasks.</div>" : "",
      "<div class=\"task-list\">",
      tasks.map(renderTaskRow).join(""),
      "</div>",
    ].join(""));
  }

  function renderGraph() {
    var graph = buildWorkflowGraph();
    return [
      panel("Workflow Graph", "Render the local Website Improvement workflow before exporting it for CLI or target-repo handoff.", [
        "<div class=\"button-row\" style=\"margin-bottom: 12px;\">",
        "<button type=\"button\" class=\"button button--primary\" data-action=\"copy-graph-json\">Copy graph JSON</button>",
        "<button type=\"button\" class=\"button\" data-action=\"download-graph-json\">Export graph JSON</button>",
        "</div>",
        "<div class=\"graph-summary\" aria-label=\"Workflow graph summary\">",
        metric("Nodes", graph.summary.nodeCount, "Workspace graph items"),
        metric("Edges", graph.summary.edgeCount, "Workflow dependencies"),
        metric("Tasks", graph.summary.taskCount, graph.summary.generatedTaskCount + " generated candidate(s)"),
        metric("Required MCP", graph.summary.requiredMcpCount, graph.mcpStatus + " readiness"),
        "</div>",
        "<div class=\"graph-boundaries\" aria-label=\"Workflow boundaries\">",
        graph.boundaries.map(function (item) {
          return "<span class=\"pill\">" + escapeHtml(item) + "</span>";
        }).join(""),
        "</div>",
        renderGraphLanes(graph),
      ].join("")),
      panel("Workflow Edges", "Deterministic edge list used by the portable graph export.", [
        "<div class=\"table-wrap graph-edge-table\">",
        "<table>",
        "<thead><tr><th>From</th><th>To</th><th>Type</th><th>Label</th></tr></thead>",
        "<tbody>",
        graph.edges.map(function (edge) {
          return [
            "<tr>",
            "<td><code>" + escapeHtml(edge.from) + "</code></td>",
            "<td><code>" + escapeHtml(edge.to) + "</code></td>",
            "<td>" + escapeHtml(edge.type) + "</td>",
            "<td>" + escapeHtml(edge.label) + "</td>",
            "</tr>",
          ].join("");
        }).join(""),
        "</tbody>",
        "</table>",
        "</div>",
      ].join("")),
    ].join("");
  }

  function renderPrompts() {
    var promptText = buildPrompt(appState.selectedTemplate);
    return panel("Prompt Generator", "Generate execution-ready prompts for Codex and Claude from the current workspace.", [
      "<div class=\"template-layout\">",
      "<div class=\"template-list\" role=\"group\" aria-label=\"Prompt templates\">",
      templates.map(function (template) {
        var id = template[0];
        var label = template[1];
        return "<button type=\"button\" class=\"template-button\" data-template=\"" + escapeAttr(id) + "\" aria-pressed=\"" + (id === appState.selectedTemplate ? "true" : "false") + "\">" + escapeHtml(label) + "</button>";
      }).join(""),
      "</div>",
      "<div>",
      "<div class=\"button-row\" style=\"margin-bottom: 8px;\">",
      "<button type=\"button\" class=\"button button--primary\" data-action=\"copy-prompt\">Copy prompt</button>",
      "<button type=\"button\" class=\"button\" data-action=\"download-prompt\">Export .md</button>",
      "</div>",
      "<textarea class=\"output-box\" readonly data-output=\"prompt\" aria-label=\"Generated prompt\">" + escapeHtml(promptText) + "</textarea>",
      "</div>",
      "</div>",
    ].join(""));
  }

  function renderReport() {
    var report = buildHandoffReport();
    var evidence = appState.workspace.implementationEvidence;
    return [
      renderLinkedPreview(),
      renderOperatorRunbook(),
      panel("Handoff Report", "Draft the before/after and verification report after target repo implementation work.", [
        "<div class=\"evidence-summary\" aria-label=\"Implementation evidence summary\">",
        metric("Executed", evidence.executedWork.length, "Target repo changes"),
        metric("Verified", evidence.verificationResults.length, "Checks recorded"),
        metric("Risks", evidence.remainingRisks.length, "Open items"),
        metric("Next", evidence.nextActions.length, "Follow-up steps"),
        "</div>",
        "<div class=\"form-grid evidence-grid\">",
        textareaField("Executed work", "implementationEvidence.executedWork", linesToText(evidence.executedWork), "", "One completed target-repo change per line."),
        textareaField("Verification results", "implementationEvidence.verificationResults", linesToText(evidence.verificationResults), "", "One command, browser check, deployment check, or manual QA result per line."),
        textareaField("Remaining risks", "implementationEvidence.remainingRisks", linesToText(evidence.remainingRisks), "", "One unresolved risk or dependency per line."),
        textareaField("Next actions", "implementationEvidence.nextActions", linesToText(evidence.nextActions), "", "One follow-up task per line."),
        "</div>",
        "<div class=\"field field--wide\" style=\"margin-bottom: 12px;\">",
        "<label for=\"reportNotes\">Report notes</label>",
        "<textarea id=\"reportNotes\" data-field=\"reportNotes\">" + escapeHtml(appState.workspace.reportNotes) + "</textarea>",
        "</div>",
        "<div class=\"button-row\" style=\"margin-bottom: 8px;\">",
        "<button type=\"button\" class=\"button button--primary\" data-action=\"copy-report\">Copy report</button>",
        "<button type=\"button\" class=\"button\" data-action=\"download-report\">Export .md</button>",
        "</div>",
        "<pre class=\"report-preview\" data-output=\"report\">" + escapeHtml(report) + "</pre>",
      ].join("")),
    ].join("");
  }

  function renderLinkedPreview() {
    var report = appState.workspace.linkedPreview;
    if (!report) {
      return panel("Linked Code Preview", "Import a read-only `design-ai site <workspace.json> --linked-preview --json` report before starting a target-repo preview.", [
        "<div class=\"empty-state\">No linked preview report imported. The console cannot read a local project folder directly from the browser.</div>",
      ].join(""));
    }
    var linkedCode = report.linkedCode;
    var preview = report.preview;
    var statusTone = report.status === "pass" ? "pass" : report.status === "warn" ? "warn" : "blocked";
    return panel("Linked Code Preview", "Use the inspected command manually, then verify the running page and record evidence in the target repository.", [
      "<div class=\"evidence-summary\" aria-label=\"Linked preview readiness summary\">",
      metric("Readiness", report.status, "Metadata inspection"),
      metric("Framework", linkedCode.framework, linkedCode.packageManager || "No package manager"),
      metric("Process", preview.processStatus, "No process started by design-ai"),
      metric("Evidence", preview.verificationStatus, "Browser probe " + preview.probeStatus),
      "</div>",
      "<div class=\"graph-boundaries\" aria-label=\"Linked preview boundaries\">",
      "<span class=\"badge badge--" + escapeAttr(statusTone) + "\">Status: " + escapeHtml(report.status) + "</span>",
      "<span class=\"pill\">Read-only metadata</span>",
      "<span class=\"pill\">No process spawn</span>",
      "<span class=\"pill\">No target-repo mutation</span>",
      "</div>",
      "<div class=\"runbook-source-bundle\" aria-label=\"Linked preview details\">",
      "<div class=\"table-wrap\"><table><caption class=\"sr-only\">Linked preview details</caption><tbody>",
      sourceBundleRow("Linked path", linkedCode.resolvedPath || linkedCode.configuredPath || "not provided"),
      sourceBundleRow("Preview URL", preview.url || "not provided"),
      sourceBundleCommandRow("Manual start command", report.commands.start, "copy-linked-preview-start"),
      sourceBundleCommandRow("Refresh metadata command", report.commands.refresh, "copy-linked-preview-refresh"),
      "</tbody></table></div></div>",
      "<div class=\"button-row\" style=\"margin-bottom: 12px;\">",
      "<button type=\"button\" class=\"button\" data-action=\"download-linked-preview\">Export preview JSON</button>",
      "<button type=\"button\" class=\"button button--danger\" data-action=\"clear-linked-preview\">Clear preview report</button>",
      "</div>",
      "<div class=\"runbook-list\" aria-label=\"Linked preview stages\">",
      report.stages.map(function (stage) {
        return "<div class=\"runbook-row\"><div><strong>" + escapeHtml(stage.label) + "</strong><small>" + escapeHtml(stage.id) + "</small></div><span class=\"pill\">" + escapeHtml(stage.status) + "</span></div>";
      }).join(""),
      "</div>",
      "<div class=\"notice\">This report proves metadata readiness only. A configured URL is not browser verification, and no runtime evidence is recorded until you add it below.</div>",
    ].join(""));
  }

  function renderOperatorRunbook() {
    var runbook = appState.workspace.operatorRunbook;
    if (!runbook) {
      return panel("Operator Runbook", "Import `design-ai site <bundle-dir> --bundle-handoff --json` to inspect the target-repo handoff stages in this console.", [
        "<div class=\"empty-state\">No operator runbook imported. Use the sidebar Import JSON action with a bundle handoff JSON output.</div>",
      ].join(""));
    }
    var summary = runbook.stageHumanLineDisplayRowSummary || {};
    var rows = runbook.stageHumanLineDisplayRows || [];
    var filteredRows = filterRunbookRows(runbook);
    var rowActionsDisabled = rows.length ? "" : " disabled aria-disabled=\"true\"";
    var nextLineDisabled = runbook.nextStageHumanLine ? "" : " disabled aria-disabled=\"true\"";
    return panel("Operator Runbook", "Review the verified bundle handoff stages before switching into the target website repo.", [
      "<div class=\"evidence-summary\" aria-label=\"Operator runbook summary\">",
      metric("Stages", runbook.stageCount || rows.length, (runbook.requiredStageCount || 0) + " required"),
      metric("Manual", summary.manualCount || 0, "Target-repo or evidence steps"),
      metric("Blocked evidence", summary.blockedEvidenceProgressCount || 0, "Rows needing evidence"),
      metric("Next", runbook.nextStageKey || "none", runbook.nextCommandKey || "No command"),
      "</div>",
      renderRunbookMetadata(runbook),
      renderRunbookSourceBundleDetails(runbook),
      renderRunbookSourceBundleWarning(runbook),
      renderRunbookProvenanceOnlyNotice(runbook, rows),
      "<div class=\"button-row\" style=\"margin-bottom: 12px;\">",
      "<button type=\"button\" class=\"button button--primary\" data-action=\"copy-runbook\">Copy runbook</button>",
      "<button type=\"button\" class=\"button\" data-action=\"download-runbook\">Export runbook .md</button>",
      "<button type=\"button\" class=\"button\" data-action=\"copy-filtered-runbook\"" + rowActionsDisabled + ">Copy filtered rows</button>",
      "<button type=\"button\" class=\"button\" data-action=\"download-filtered-runbook\"" + rowActionsDisabled + ">Export filtered .md</button>",
      "<button type=\"button\" class=\"button\" data-action=\"copy-next-runbook-line\"" + nextLineDisabled + ">Copy next line</button>",
      "<button type=\"button\" class=\"button button--danger\" data-action=\"clear-runbook\">Clear runbook</button>",
      "</div>",
      rows.length ? renderRunbookStatusIndex(runbook, filteredRows.length, rows.length) : "",
      renderRunbookRows(filteredRows, rows.length),
    ].filter(Boolean).join(""));
  }

  function renderRunbookStatusIndex(runbook, visibleCount, totalCount) {
    var actionIndex = runbook.stageHumanLineDisplayRowKeysByActionStatus || {};
    var evidenceIndex = runbook.stageHumanLineDisplayRowKeysByEvidenceProgressStatus || {};
    var actionOptions = [["all", totalCount], ["ready", (actionIndex.ready || []).length], ["optional", (actionIndex.optional || []).length], ["manual", (actionIndex.manual || []).length], ["blocked", (actionIndex.blocked || []).length]];
    var evidenceOptions = [["all", totalCount], ["blocked", (evidenceIndex.blocked || []).length], ["ready", (evidenceIndex.ready || []).length]];
    var filtersActive = appState.runbookActionFilter !== "all" || appState.runbookEvidenceFilter !== "all";
    return [
      "<div class=\"runbook-filter\" aria-label=\"Operator runbook row filters\">",
      "<div class=\"runbook-filter__summary\"><span><strong>" + escapeHtml(String(visibleCount)) + "</strong> of " + escapeHtml(String(totalCount)) + " rows shown</span><button type=\"button\" class=\"button reset-filter-button\" data-action=\"reset-runbook-filters\"" + (filtersActive ? "" : " disabled aria-disabled=\"true\"") + ">Reset filters</button></div>",
      "<div class=\"runbook-filter__group\" role=\"group\" aria-label=\"Filter by action status\">",
      "<span class=\"runbook-filter__label\">Action</span>",
      actionOptions.map(function (option) {
        return renderRunbookFilterButton("action", option[0], option[1], appState.runbookActionFilter === option[0]);
      }).join(""),
      "</div>",
      "<div class=\"runbook-filter__group\" role=\"group\" aria-label=\"Filter by evidence progress\">",
      "<span class=\"runbook-filter__label\">Evidence</span>",
      evidenceOptions.map(function (option) {
        return renderRunbookFilterButton("evidence", option[0], option[1], appState.runbookEvidenceFilter === option[0]);
      }).join(""),
      "</div>",
      "</div>",
    ].join("");
  }

  function filterRunbookRows(runbook) {
    var rows = runbook.stageHumanLineDisplayRows || [];
    var actionFilter = appState.runbookActionFilter || "all";
    var evidenceFilter = appState.runbookEvidenceFilter || "all";
    var actionKeys = actionFilter === "all" ? null : (runbook.stageHumanLineDisplayRowKeysByActionStatus || {})[actionFilter] || [];
    var evidenceKeys = evidenceFilter === "all" ? null : (runbook.stageHumanLineDisplayRowKeysByEvidenceProgressStatus || {})[evidenceFilter] || [];
    return rows.filter(function (row) {
      return (!actionKeys || actionKeys.indexOf(row.key) !== -1) && (!evidenceKeys || evidenceKeys.indexOf(row.key) !== -1);
    });
  }

  function syncReportPreview() {
    var output = document.querySelector("[data-output='report']");
    if (output) {
      output.textContent = buildHandoffReport();
    }
  }

  function generateTasksFromFindings() {
    var workspace = appState.workspace;
    var existingIds = new Set(workspace.refactorTasks.map(function (task) { return task.id; }));
    var existingCategories = new Set(workspace.refactorTasks.map(function (task) { return task.category; }));
    var created = [];
    auditCategories.forEach(function (category) {
      if (existingCategories.has(category.id)) return;
      var row = workspace.auditChecklist[category.id];
      var findings = row.findings;
      if (findings.length === 0) return;
      var id = "task-" + category.id;
      if (existingIds.has(id)) return;
      var task = taskFromCategory(category, findings[0]);
      created.push(task);
      existingIds.add(id);
      existingCategories.add(category.id);
    });
    workspace.refactorTasks = workspace.refactorTasks.concat(created);
    saveWorkspace();
    setMessage(created.length + " starter task(s) generated.");
  }

  function taskFromCategory(category, finding) {
    var profile = appState.workspace.siteProfile;
    var priority = category.id === "accessibility" || category.id === "runtime-issues" ? "p0" : "p1";
    var impact = priority === "p0" ? "high" : "medium";
    var recommendedMcp = recommendedMcpForCategory(category.id);
    return {
      id: "task-" + category.id,
      title: "Resolve " + category.label + " finding",
      category: category.id,
      problem: finding,
      evidence: "Audit finding captured in the Website Improvement Console.",
      impact: impact,
      effort: "medium",
      priority: priority,
      pages: profile.pages.slice(0, 3),
      recommendedMcp: recommendedMcp,
      codexPrompt: buildCodexTaskPrompt(category.id, finding),
      verification: category.defaultVerification.concat(["Run target repo lint/typecheck/build when available"]),
      risks: ["Target repo architecture may constrain the fix", "Manual stakeholder review may be needed before changing copy or brand language"],
    };
  }

  function buildCodexTaskPrompt(categoryId, finding) {
    var profile = appState.workspace.siteProfile;
    return [
      "You are working in the target website repo, not in design-ai.",
      "Site: " + profile.name,
      "Live URL: " + profile.liveUrl,
      "Category: " + categoryById(categoryId).label,
      "Problem: " + finding,
      "",
      "Inspect the target repo first. Reuse existing architecture, UI components, state patterns, styling conventions, and design tokens. Do not add dependencies unless the existing codebase clearly requires them.",
      "",
      "Implement the smallest safe improvement, then verify desktop/tablet/mobile behavior, keyboard focus, screen-reader semantics where relevant, and the target repo's lint/typecheck/build commands.",
    ].join("\n");
  }

  function addManualTask() {
    var category = "ux-flow";
    var task = {
      id: "task-manual-" + Date.now(),
      title: "Manual website improvement task",
      category: category,
      problem: "Describe the website issue before sending this task to Codex.",
      evidence: "",
      impact: "medium",
      effort: "medium",
      priority: "p2",
      pages: appState.workspace.siteProfile.pages.slice(0, 1),
      recommendedMcp: ["github", "browser"],
      codexPrompt: buildCodexTaskPrompt(category, "Describe the website issue before sending this task to Codex."),
      verification: ["Run target repo lint/typecheck/build", "Verify desktop/tablet/mobile behavior"],
      risks: ["Task needs more evidence before implementation"],
    };
    appState.workspace.refactorTasks.push(task);
    saveWorkspace();
    setMessage("Manual task added.");
  }

  function removeTask(taskId) {
    appState.workspace.refactorTasks = appState.workspace.refactorTasks.filter(function (task) {
      return task.id !== taskId;
    });
    saveWorkspace();
    setMessage("Task removed.");
  }

  function profileBlock() {
    var profile = appState.workspace.siteProfile;
    return [
      "Site profile:",
      "- Name: " + profile.name,
      "- Live URL: " + (profile.liveUrl || "not provided"),
      "- Repo URL: " + (profile.repoUrl || "not provided"),
      "- Local path: " + (profile.localPath || "not provided"),
      "- Figma URL: " + (profile.figmaUrl || "not provided"),
      "- Deploy: " + profile.deployProvider,
      "- Sentry: " + (profile.sentryProject || "not provided"),
      "- CMS: " + profile.cms,
      "- Database: " + profile.database,
      "- Viewports: " + profile.viewports.join(", "),
      "",
      "Priority pages:",
      markdownList(profile.pages, "No pages listed"),
      "",
      "User flows:",
      markdownList(profile.userFlows, "No user flows listed"),
      "",
      "Brand/design notes:",
      profile.brandNotes || "No brand notes provided.",
    ].join("\n");
  }

  function auditBlock() {
    return auditCategories.map(function (category) {
      var row = appState.workspace.auditChecklist[category.id];
      return [
        "- " + category.label + " [" + row.status + "]",
        "  Notes: " + (row.notes || "none"),
        "  Findings: " + (row.findings.length ? row.findings.join("; ") : "none"),
      ].join("\n");
    }).join("\n");
  }

  function mcpBlock() {
    return mcpItems.map(function (item) {
      return "- " + item[1] + ": " + appState.workspace.mcpReadiness[item[0]];
    }).join("\n");
  }

  function primaryTask() {
    var tasks = appState.workspace.refactorTasks.slice();
    var rank = { p0: 0, p1: 1, p2: 2, p3: 3 };
    tasks.sort(function (a, b) {
      return rank[a.priority] - rank[b.priority];
    });
    return tasks[0] || null;
  }

  function buildWorkflowGraph() {
    var taskResult = workflowTasks(appState.workspace);
    var workspace = taskResult.workspace;
    var profile = workspace.siteProfile;
    var workspaceLevel = workspaceStatus(workspace);
    var nodes = [];
    var edges = [];
    var profileId = profileNodeId(profile);
    var mcpNodes = [];

    nodes.push(workflowNode("workspace:intake", "workspace", "Workspace intake", workspaceLevel, {
      version: workspace.version,
      updatedAt: workspace.updatedAt,
      source: "localStorage",
      workspaceStatus: workspaceLevel,
    }));
    nodes.push(workflowNode(profileId, "site-profile", profile.name, workspaceLevel, {
      id: profile.id,
      liveUrl: profile.liveUrl,
      repoUrl: profile.repoUrl,
      localPath: profile.localPath,
      figmaUrl: profile.figmaUrl,
      deployProvider: profile.deployProvider,
      cms: profile.cms,
      database: profile.database,
      pages: profile.pages,
      userFlows: profile.userFlows,
      viewports: profile.viewports,
      brandNotes: profile.brandNotes,
    }));
    edges.push(workflowEdge("workspace:intake", profileId, "profile", "Workspace defines the target site profile"));

    auditCategories.forEach(function (category) {
      var row = workspace.auditChecklist[category.id];
      var nodeId = "audit:" + category.id;
      nodes.push(workflowNode(nodeId, "audit-category", category.label, row.status, {
        category: category.id,
        notes: row.notes,
        findings: row.findings,
        findingCount: row.findings.length,
        defaultVerification: category.defaultVerification,
      }));
      edges.push(workflowEdge(profileId, nodeId, "audit-input", "Site context drives this audit category"));
    });

    mcpItems.forEach(function (item) {
      var key = item[0];
      var status = workspace.mcpReadiness[key];
      var state = mcpState(key, status, profile);
      var level = mcpLevel(status, state);
      var node = workflowNode("mcp:" + key, "mcp-readiness", item[1], level, {
        key: key,
        requestedStatus: status,
        state: state,
        evidence: item[2],
        actions: mcpAdvice(key, status),
      });
      mcpNodes.push(node);
      nodes.push(node);
      edges.push(workflowEdge(profileId, node.id, "readiness-input", "Site profile provides MCP readiness evidence"));
    });

    taskResult.tasks.forEach(function (task) {
      var taskNodeId = "task:" + task.id;
      nodes.push(workflowNode(taskNodeId, "refactor-task", task.title, "planned", {
        id: task.id,
        category: task.category,
        problem: task.problem,
        evidence: task.evidence,
        impact: task.impact,
        effort: task.effort,
        priority: task.priority,
        pages: task.pages,
        recommendedMcp: task.recommendedMcp,
        codexPrompt: task.codexPrompt,
        verification: task.verification,
        risks: task.risks,
      }));
      edges.push(workflowEdge("audit:" + task.category, taskNodeId, "finding-to-task", "Audit finding informs this refactor task"));
      edges.push(workflowEdge(profileId, taskNodeId, "site-context", "Site profile scopes this refactor task"));
      task.recommendedMcp.forEach(function (key) {
        if (workspace.mcpReadiness[key]) {
          edges.push(workflowEdge("mcp:" + key, taskNodeId, "mcp-support", "MCP readiness supports task execution"));
        }
      });
    });

    templates.forEach(function (template) {
      var promptId = "prompt:" + template[0];
      var artifactTemplate = ["implementation-plan", "critique-loop", "design-contract"].indexOf(template[0]) >= 0;
      nodes.push(workflowNode(promptId, "prompt-template", template[1], "ready", {
        id: template[0],
        agent: artifactTemplate ? "Codex or Claude" : template[0].indexOf("claude") === 0 ? "Claude" : "Codex",
        output: template[0] === "handoff-report" ? "report" : "prompt",
        description: template[1],
        taskSelectable: ["codex-implementation", "implementation-plan", "critique-loop"].indexOf(template[0]) >= 0,
      }));
      edges.push(workflowEdge(profileId, promptId, "profile-context", "Prompt template receives site profile context"));
    });

    taskResult.tasks.forEach(function (task) {
      edges.push(workflowEdge("task:" + task.id, "prompt:codex-implementation", "implementation-prompt", "Task can be exported as a Codex implementation prompt"));
    });

    nodes.push(workflowNode("handoff:report", "handoff-report", "Handoff report", "ready", {
      output: "website-handoff.md",
      purpose: "Summarize site state, audit findings, priority improvements, verification, and remaining risk",
    }));
    nodes.push(workflowNode("handoff:bundle", "handoff-bundle", "Local handoff bundle", "ready", {
      output: "website-handoff-bundle",
      purpose: "Package the local Website Improvement plan without mutating the target repo",
    }));
    nodes.push(workflowNode("handoff:target-repo", "target-repo", "Target website repo", "external", {
      repoUrl: profile.repoUrl,
      localPath: profile.localPath,
      boundary: "Implementation happens outside the design-ai repository",
    }));
    edges.push(workflowEdge(profileId, "handoff:report", "handoff-input", "Site profile anchors the handoff report"));
    taskResult.tasks.forEach(function (task) {
      edges.push(workflowEdge("task:" + task.id, "handoff:report", "handoff-input", "Refactor task is summarized in the handoff report"));
    });
    mcpNodes.filter(function (node) {
      return node.data.requestedStatus !== "unused";
    }).forEach(function (node) {
      edges.push(workflowEdge(node.id, "handoff:report", "readiness-input", "MCP readiness is summarized in the handoff report"));
    });
    templates.forEach(function (template) {
      edges.push(workflowEdge("prompt:" + template[0], "handoff:target-repo", "agent-prompt", "Prompt can be used in the target website workflow"));
    });
    edges.push(workflowEdge("handoff:report", "handoff:bundle", "bundle-input", "Handoff report can be packaged into a local bundle"));
    edges.push(workflowEdge("handoff:bundle", "handoff:target-repo", "handoff", "Verified bundle can become target-repo implementation context"));

    var mcpStatus = mcpNodes.some(function (node) { return node.status === "fail"; }) ? "fail"
      : mcpNodes.some(function (node) { return node.status === "warn"; }) ? "warn"
        : "pass";
    var status = combineStatus(workspaceLevel, mcpStatus);
    return {
      version: 1,
      kind: "website-improvement-workflow-graph",
      generatedAt: workspace.updatedAt,
      filePath: "localStorage",
      status: status,
      workspaceStatus: workspaceLevel,
      mcpStatus: mcpStatus,
      externalCalls: false,
      site: {
        id: profile.id,
        name: profile.name,
        liveUrl: profile.liveUrl,
        repoUrl: profile.repoUrl,
        localPath: profile.localPath,
      },
      summary: {
        status: status,
        workspaceStatus: workspaceLevel,
        mcpStatus: mcpStatus,
        nodeCount: nodes.length,
        edgeCount: edges.length,
        auditCategoryCount: auditCategories.length,
        taskCount: taskResult.tasks.length,
        generatedTaskCount: taskResult.created.length,
        requiredMcpCount: mcpItems.filter(function (item) { return workspace.mcpReadiness[item[0]] === "required"; }).length,
        promptTemplateCount: templates.length,
      },
      nodes: nodes,
      edges: edges,
      boundaries: [
        "deterministic-local",
        "no-external-mcp-calls",
        "no-target-repo-mutation",
        "no-new-dependencies",
      ],
    };
  }

  function buildPrompt(templateId) {
    var profile = profileBlock();
    var audit = auditBlock();
    var mcp = mcpBlock();
    var task = taskBlock(primaryTask());
    var commonRules = [
      "Rules:",
      "- Work in the target website repository, not in this design-ai repository.",
      "- Inspect existing architecture, components, state, styling, and design tokens before editing.",
      "- Keep changes scoped and avoid new dependencies unless clearly justified.",
      "- Preserve accessibility: keyboard reachability, visible focus, semantic HTML, screen-reader labels, and WCAG 2.1 AA contrast.",
      "- Verify desktop, tablet, and mobile layouts.",
    ].join("\n");

    function artifactPrompt(mode) {
      var definitions = {
        "implementation-plan": {
          title: "Implementation plan",
          output: "implementation-plan.md",
          steps: ["Read the current state", "Define the change", "Implement after the gate", "Verify the result"],
          sections: ["Context", "Scope", "Implementation steps", "Verification", "Risks and approval boundaries"],
        },
        "critique-loop": {
          title: "Critique loop",
          output: "critique-loop.md",
          steps: ["Observe before judging", "Name the highest-impact gap", "Revise one decision", "Re-observe and close the loop"],
          sections: ["Decision and audience", "Observed evidence", "Top recommendation", "Revision", "Verification and remaining risk"],
        },
        "design-contract": {
          title: "Agent-readable design contract",
          output: "DESIGN.md",
          steps: ["Ground the product intent", "Define visual foundations", "Define component and motion behavior", "Set boundaries and ownership"],
          sections: ["Product intent and audience", "Brand principles and artifact modes", "Color, typography, spacing, and layout", "Components, states, and motion", "Accessibility and responsive behavior", "Anti-patterns, ownership, and verification"],
        },
      };
      var definition = definitions[mode];
      var taskSummary = task || "No refactor task selected. Establish one from the audit evidence before implementation.";
      return [
        "# " + definition.title + ": " + appState.workspace.siteProfile.name,
        "",
        "> Generated by design-ai as a read-only planning artifact. It does not modify a repository or contact an external service.",
        "",
        "## Artifact contract",
        "",
        "- Kind: `design-ai-artifact`",
        "- Schema version: `1`",
        "- Mode: `" + mode + "`",
        "- Route: `website-improvement` (Website improvement)",
        "- Output: `" + definition.output + "`",
        "- Mutation boundary: planning and local output only; target-repo edits and external writes require explicit approval.",
        "",
        "## Brief",
        "",
        profile,
        "",
        taskSummary,
        "",
        "## Source of truth",
        "",
        "- Website Console site profile, audit checklist, MCP matrix, and refactor plan",
        "- Target repository architecture, components, tokens, and verification scripts",
        "",
        "## Workflow",
        "",
        definition.steps.map(function (step, index) { return (index + 1) + ". " + step; }).join("\n"),
        "",
        "## Output structure",
        "",
        definition.sections.map(function (section) { return "- " + section; }).join("\n"),
        "",
        "## Approval boundary",
        "",
        "- Approval required before editing the target repository, changing dependencies, running migrations, committing, pushing, deploying, or writing to an external system.",
        "",
        "## Verification",
        "",
        "- Run the target repository's focused tests and broad release gate.",
        "- Verify keyboard, focus, screen-reader, WCAG 2.1 AA contrast, reduced motion, and configured viewports.",
        "- Record commands, results, browser evidence, and remaining risk.",
      ].join("\n");
    }

    var map = {
      "implementation-plan": [artifactPrompt("implementation-plan")],
      "critique-loop": [artifactPrompt("critique-loop")],
      "design-contract": [artifactPrompt("design-contract")],
      "codex-repo-intake": [
        "# Codex repo intake prompt",
        profile,
        "",
        "Goal: inspect the target website repo and produce a concise implementation plan for website improvement work.",
        "",
        commonRules,
        "",
        "Read first:",
        "- package/dependency manifest",
        "- app/router entrypoints",
        "- layout and design system primitives",
        "- styling/token setup",
        "- test/build scripts",
        "",
        "Return: repo structure, routing, reusable components, state/data model, likely touch points, risks, and exact verification commands.",
      ],
      "codex-implementation": [
        "# Codex implementation prompt",
        profile,
        "",
        task,
        "",
        commonRules,
        "",
        "Implement the smallest safe fix. After editing, run the target repo's most relevant lint/typecheck/build/test command and summarize changed files plus verification.",
      ],
      "codex-visual-qa": [
        "# Codex visual QA prompt",
        profile,
        "",
        "Audit checklist state:",
        audit,
        "",
        "Use Browser/Playwright if available. Verify the priority pages across " + appState.workspace.siteProfile.viewports.join(", ") + ". Check layout, typography, CTA hierarchy, forms, focus indicators, console errors, and broken assets.",
      ],
      "codex-deployment": [
        "# Codex deployment verification prompt",
        profile,
        "",
        "MCP readiness:",
        mcp,
        "",
        "Verify the deployment or preview URL, runtime logs, environment assumptions, SEO metadata, and major user flows. Report pass/fail evidence and remaining launch risks.",
      ],
      "claude-design-review": [
        "# Claude design review prompt",
        profile,
        "",
        "Review the live site or screenshots as a senior product designer. Focus on visual hierarchy, layout rhythm, typography, color, spacing, CTA clarity, responsive behavior, and accessibility concerns. Provide one best path and cite concrete evidence.",
      ],
      "claude-competitor": [
        "# Claude competitor research prompt",
        profile,
        "",
        "Research 3-5 relevant competitors or peer websites. Compare homepage structure, conversion path, proof points, pricing presentation, visual tone, content clarity, and SEO positioning. Return a concise opportunity map, not a generic benchmark.",
      ],
      "claude-copy-ux": [
        "# Claude copy/UX critique prompt",
        profile,
        "",
        "Critique the site's copy, information architecture, trust signals, CTA language, and conversion flow. Rewrite only the highest-impact sections and explain why the edits reduce user uncertainty.",
      ],
      "handoff-report": [
        "# Final handoff report prompt",
        profile,
        "",
        "Refactor plan:",
        appState.workspace.refactorTasks.map(function (item) {
          return "- [" + item.priority + "] " + item.title + ": " + item.problem;
        }).join("\n") || "- No tasks listed",
        "",
        "Create a final handoff report with target site info, audit summary, priority recommendations, executed work, verification results, remaining risks, and next actions.",
      ],
    };

    return (map[templateId] || map["codex-repo-intake"]).join("\n");
  }

  function buildHandoffReport() {
    var profile = appState.workspace.siteProfile;
    var tasks = appState.workspace.refactorTasks;
    var evidence = appState.workspace.implementationEvidence;
    return [
      "# Website improvement handoff: " + profile.name,
      "",
      "> Generated by design-ai Website Improvement Console.",
      "",
      "## Target site",
      "",
      "- Live URL: " + (profile.liveUrl || "not provided"),
      "- Repo URL: " + (profile.repoUrl || "not provided"),
      "- Local path: " + (profile.localPath || "not provided"),
      "- Figma URL: " + (profile.figmaUrl || "not provided"),
      "- Deploy provider: " + profile.deployProvider,
      "- CMS: " + profile.cms,
      "- Database: " + profile.database,
      "- Viewports: " + profile.viewports.join(", "),
      "",
      "## Diagnostic summary",
      "",
      auditBlock(),
      "",
      "## Linked code preview",
      "",
      buildLinkedPreviewMarkdown(),
      "",
      "## MCP Readiness",
      "",
      mcpBlock(),
      "",
      "## Priority improvement plan",
      "",
      tasks.length ? tasks.map(function (task) {
        return [
          "### [" + task.priority.toUpperCase() + "] " + task.title,
          "",
          "- Category: " + categoryById(task.category).label,
          "- Impact: " + task.impact,
          "- Effort: " + task.effort,
          "- Pages: " + (task.pages.join(", ") || "not specified"),
          "- MCP: " + (task.recommendedMcp.join(", ") || "none"),
          "- Problem: " + task.problem,
          "- Evidence: " + (task.evidence || "not provided"),
          "",
          "Verification:",
          markdownList(task.verification, "Run target repo verification"),
          "",
          "Risks:",
          markdownList(task.risks, "No risks listed"),
        ].join("\n");
      }).join("\n\n") : "No refactor tasks generated yet.",
      "",
      "## Executed work",
      "",
      markdownList(evidence.executedWork, "Not recorded yet. Add implementation notes after running Codex in the target repo."),
      "",
      "## Verification results",
      "",
      markdownList(evidence.verificationResults, "Not recorded yet. Paste target repo lint/typecheck/build, Browser QA, and deployment checks here."),
      "",
      "## Remaining risks",
      "",
      markdownList(evidence.remainingRisks, "No remaining risks recorded."),
      "",
      "## Next actions",
      "",
      markdownList(evidence.nextActions, "No next actions recorded."),
      "",
      "## Notes",
      "",
      appState.workspace.reportNotes || "No notes recorded.",
    ].join("\n");
  }

  function buildLinkedPreviewMarkdown() {
    var report = appState.workspace.linkedPreview;
    if (!report) return "Not imported. Generate `design-ai site <workspace.json> --linked-preview --json` before starting a local preview.";
    return [
      "- Readiness: " + report.status,
      "- Linked path: " + (report.linkedCode.resolvedPath || report.linkedCode.configuredPath || "not provided"),
      "- Project: " + report.linkedCode.framework + " / " + (report.linkedCode.packageManager || "no package manager"),
      "- Manual start command: " + (report.commands.start || "not available"),
      "- Preview URL: " + (report.preview.url || "not provided"),
      "- Runtime state: process " + report.preview.processStatus + ", browser probe " + report.preview.probeStatus + ", evidence " + report.preview.verificationStatus,
      "- Boundary: metadata only; no process start, external call, source scan, or target-repo mutation.",
    ].join("\n");
  }

  function buildOperatorRunbookMarkdown(options) {
    var runbook = appState.workspace.operatorRunbook;
    if (!runbook) return "No operator runbook imported.";
    var settings = options && typeof options === "object" ? options : {};
    var allRows = runbook.stageHumanLineDisplayRows || [];
    var rows = settings.filtered ? filterRunbookRows(runbook) : allRows;
    var actionFilter = appState.runbookActionFilter || "all";
    var evidenceFilter = appState.runbookEvidenceFilter || "all";
    var provenanceOnly = allRows.length === 0 && !!runbook.sourceBundle;
    return [
      settings.filtered ? "# Website improvement operator runbook - filtered rows" : "# Website improvement operator runbook",
      "",
      "- Source: " + runbook.source,
      "- Provenance-only: " + (provenanceOnly ? "yes" : "no"),
      "- Stages: " + (runbook.stageCount || allRows.length),
      "- Rows included: " + rows.length + " of " + allRows.length,
      "- Effective task: " + (runbook.effectiveTaskId || "not specified"),
      "- Strict task command key: " + (runbook.effectiveStrictTaskCommandKey || "not specified"),
      "- Source bundle status: " + formatSourceBundleMarkdownStatus(runbook.sourceBundle),
      "- Strict bundle check command: " + formatSourceBundleMarkdownCommand(runbook.sourceBundle, "strictCheckCommand"),
      "- Strict bundle handoff command: " + formatSourceBundleMarkdownCommand(runbook.sourceBundle, "strictHandoffCommand"),
      "- Source bundle revalidation: " + formatSourceBundleRevalidationMarkdown(runbook.sourceBundle),
      "- Action filter: " + (settings.filtered ? actionFilter : "all"),
      "- Evidence filter: " + (settings.filtered ? evidenceFilter : "all"),
      "- Next stage: " + (runbook.nextStageKey || "none"),
      "- Next command: " + (runbook.nextCommandKey || "none"),
      "",
      "## Stages",
      "",
      rows.length ? rows.map(buildOperatorRunbookRowMarkdown).join("\n\n") : formatEmptyRunbookRowsMessage(settings, provenanceOnly, runbook.source),
    ].join("\n");
  }

  function copyText(text, successMessage) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () {
        setMessage(successMessage);
      }).catch(function () {
        fallbackCopy(text, successMessage);
      });
      return;
    }
    fallbackCopy(text, successMessage);
  }

  function fallbackCopy(text, successMessage) {
    var temp = document.createElement("textarea");
    temp.value = text;
    temp.setAttribute("readonly", "readonly");
    temp.style.position = "fixed";
    temp.style.left = "-9999px";
    document.body.appendChild(temp);
    temp.select();
    try {
      document.execCommand("copy");
      setMessage(successMessage);
    } catch (error) {
      setMessage("Copy failed. Select the text manually.");
    }
    document.body.removeChild(temp);
  }

  function downloadFile(name, content, type) {
    var blob = new Blob([content], { type: type || "text/plain" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleInput(event) {
    var target = event.target;
    if (!target) return;

    if (target.matches("[data-field]")) {
      setByPath(appState.workspace, target.dataset.field, target.value);
      saveWorkspace();
      syncReportPreview();
      return;
    }

    if (target.matches("[data-viewport]")) {
      var viewport = target.dataset.viewport;
      var viewports = appState.workspace.siteProfile.viewports;
      if (target.checked && viewports.indexOf(viewport) === -1) {
        viewports.push(viewport);
      } else if (!target.checked) {
        appState.workspace.siteProfile.viewports = viewports.filter(function (item) {
          return item !== viewport;
        });
      }
      if (appState.workspace.siteProfile.viewports.length === 0) {
        appState.workspace.siteProfile.viewports = ["desktop"];
      }
      saveWorkspace();
      render();
      return;
    }

    if (target.matches("[data-audit-status]")) {
      appState.workspace.auditChecklist[target.dataset.auditStatus].status = target.value;
      saveWorkspace();
      render();
      return;
    }

    if (target.matches("[data-audit-notes]")) {
      appState.workspace.auditChecklist[target.dataset.auditNotes].notes = target.value;
      saveWorkspace();
      return;
    }

    if (target.matches("[data-audit-findings]")) {
      appState.workspace.auditChecklist[target.dataset.auditFindings].findings = textToLines(target.value);
      saveWorkspace();
      return;
    }

    if (target.matches("[data-mcp]")) {
      appState.workspace.mcpReadiness[target.dataset.mcp] = target.value;
      saveWorkspace();
      render();
    }
  }

  function handleClick(event) {
    var button = event.target.closest("button");
    if (!button) return;

    if (button.dataset.nav) {
      appState.activeTab = button.dataset.nav;
      localStorage.setItem(ACTIVE_TAB_KEY, appState.activeTab);
      render();
      var activeButton = document.querySelector(".nav-button[aria-current='page']");
      if (activeButton) {
        activeButton.focus({ preventScroll: true });
        activeButton.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
      return;
    }

    if (button.dataset.template) {
      appState.selectedTemplate = button.dataset.template;
      localStorage.setItem(SELECTED_TEMPLATE_KEY, appState.selectedTemplate);
      render();
      return;
    }

    if (button.dataset.runbookFilterType) {
      if (button.dataset.runbookFilterType === "action") {
        appState.runbookActionFilter = button.dataset.runbookFilterValue || "all";
      } else if (button.dataset.runbookFilterType === "evidence") {
        appState.runbookEvidenceFilter = button.dataset.runbookFilterValue || "all";
      }
      render();
      return;
    }

    var action = button.dataset.action;
    if (!action) return;
    if (action === "copy-start-example") {
      copyText("design-ai start \"Improve the Korean fintech account settings flow\" --local-path /absolute/path/to/repo --locale ko-KR --viewport mobile --viewport desktop --json", "Start command copied.");
    } else if (action === "copy-start-command") {
      copyText(appState.startPlan && appState.startPlan.pathway.command || "", "Next command copied.");
    } else if (action === "copy-start-contract") {
      copyText(appState.startPlan && appState.startPlan.designContract.markdown || "", "Design contract copied.");
    } else if (action === "download-start-plan") {
      if (appState.startPlan) {
        downloadFile("design-ai-start.json", buildStartPlanJson(appState.startPlan), "application/json");
        setMessage("Start JSON exported.");
      }
    } else if (action === "clear-start-plan") {
      appState.startPlan = null;
      saveStartPlan();
      setMessage("Start plan cleared.");
    } else if (action === "download-review-comparison") {
      if (appState.reviewComparison) {
        downloadFile("design-ai-review-comparison.json", appState.reviewComparison.rawJson, "application/json");
        setMessage("Original review-comparison JSON exported without reformatting.");
      }
    } else if (action === "clear-review-comparison") {
      appState.reviewComparison = null;
      saveImportedArtifact(REVIEW_COMPARISON_KEY, null);
      setMessage("Review comparison cleared. Other review evidence remains available.");
    } else if (action === "download-review-workflow") {
      if (appState.reviewWorkflow) {
        downloadFile("design-ai-review-workflow.json", appState.reviewWorkflow.rawJson, "application/json");
        setMessage("Original review-workflow JSON exported without reformatting.");
      }
    } else if (action === "clear-review-workflow") {
      clearReviewWorkflowSession();
      refreshQualityLink();
      setMessage("Review workflow cleared. Direct Start and Quality imports remain available.");
    } else if (action === "download-review-handoff") {
      if (appState.reviewHandoff) {
        downloadFile("design-ai-review-handoff.json", appState.reviewHandoff.rawJson, "application/json");
        setMessage("Original review-handoff JSON exported without reformatting.");
      }
    } else if (action === "clear-review-handoff") {
      clearReviewHandoffSession();
      refreshQualityLink();
      setMessage("Review handoff cleared. Direct review imports restored.");
    } else if (action === "download-review-receipt") {
      if (appState.reviewReceipt) {
        downloadFile("design-ai-review-handoff-receipt.json", appState.reviewReceipt.rawJson, "application/json");
        setMessage("Original review-handoff receipt JSON exported without reformatting.");
      }
    } else if (action === "clear-review-receipt") {
      clearReviewReceiptSession();
      refreshQualityLink();
      setMessage("Validation receipt cleared. Original review handoff restored.");
    } else if (action === "download-pilot-evidence") {
      if (appState.pilotEvidence) {
        downloadFile("design-ai-pilot-evidence.json", appState.pilotEvidence.rawJson, "application/json");
        setMessage("Original pilot-evidence JSON exported without reformatting.");
      }
    } else if (action === "clear-pilot-evidence") {
      clearPilotEvidenceSession();
      refreshQualityLink();
      setMessage("Pilot evidence cleared. Original implementation evidence restored.");
    } else if (action === "download-implementation-evidence") {
      if (appState.implementationEvidence) {
        downloadFile("design-ai-implementation-evidence.json", appState.implementationEvidence.rawJson, "application/json");
        setMessage("Original implementation-evidence JSON exported without reformatting.");
      }
    } else if (action === "clear-implementation-evidence") {
      clearImplementationEvidenceSession();
      refreshQualityLink();
      setMessage("Implementation evidence cleared. Original implementation-scope approval restored.");
    } else if (action === "download-scope-approval") {
      if (appState.implementationScopeApproval) {
        downloadFile("design-ai-implementation-scope-approval.json", appState.implementationScopeApproval.rawJson, "application/json");
        setMessage("Original implementation-scope approval JSON exported without reformatting.");
      }
    } else if (action === "clear-scope-approval") {
      clearImplementationScopeApprovalSession();
      refreshQualityLink();
      setMessage("Scope approval cleared. Original implementation-scope proposal restored.");
    } else if (action === "download-scope-proposal") {
      if (appState.implementationScopeProposal) {
        downloadFile("design-ai-implementation-scope-proposal.json", appState.implementationScopeProposal.rawJson, "application/json");
        setMessage("Original implementation-scope proposal JSON exported without reformatting.");
      }
    } else if (action === "clear-scope-proposal") {
      clearImplementationScopeProposalSession();
      refreshQualityLink();
      setMessage("Scope proposal cleared. Original target-repository intake restored.");
    } else if (action === "download-target-intake") {
      if (appState.targetRepoIntake) {
        downloadFile("design-ai-target-repo-intake.json", appState.targetRepoIntake.rawJson, "application/json");
        setMessage("Original target-repository intake JSON exported without reformatting.");
      }
    } else if (action === "clear-target-intake") {
      clearTargetRepoIntakeSession();
      refreshQualityLink();
      setMessage("Target repository intake cleared. Earlier review evidence remains available.");
    } else if (action === "download-quality-report") {
      if (appState.qualityReport) {
        downloadFile("design-ai-quality-report.json", appState.qualityReport.rawJson, "application/json");
        setMessage("Original quality-report JSON exported without reformatting.");
      }
    } else if (action === "clear-quality-report") {
      appState.qualityReport = null;
      saveImportedArtifact(QUALITY_REPORT_KEY, null);
      refreshQualityLink();
      setMessage("Quality report cleared.");
    } else if (action === "download-browser-verification") {
      if (appState.browserVerification) {
        downloadFile("design-ai-browser-verification.json", appState.browserVerification.rawJson, "application/json");
        setMessage("Original browser-verification JSON exported without reformatting.");
      }
    } else if (action === "clear-browser-verification") {
      appState.browserVerification = null;
      saveImportedArtifact(BROWSER_VERIFICATION_KEY, null);
      refreshQualityLink();
      setMessage("Browser verification cleared.");
    } else if (action === "export-workspace") {
      downloadFile("design-ai-website-workspace.json", JSON.stringify(appState.workspace, null, 2), "application/json");
      setMessage("Workspace JSON exported.");
    } else if (action === "import-click") {
      document.getElementById("import-file").click();
    } else if (action === "reset-sample") {
      appState.workspace = createDefaultWorkspace();
      saveWorkspace();
      setMessage("Sample workspace restored.");
    } else if (action === "generate-tasks") {
      generateTasksFromFindings();
    } else if (action === "mark-audit-todo") {
      auditCategories.forEach(function (category) {
        appState.workspace.auditChecklist[category.id].status = "todo";
      });
      saveWorkspace();
      setMessage("Audit statuses reset to todo.");
    } else if (action === "add-task") {
      addManualTask();
    } else if (action === "remove-task") {
      removeTask(button.dataset.task);
    } else if (action === "copy-task") {
      var task = appState.workspace.refactorTasks.find(function (item) { return item.id === button.dataset.task; });
      copyText(task ? task.codexPrompt : "", "Task prompt copied.");
    } else if (action === "copy-prompt") {
      copyText(buildPrompt(appState.selectedTemplate), "Prompt copied.");
    } else if (action === "download-prompt") {
      downloadFile(appState.selectedTemplate + ".md", buildPrompt(appState.selectedTemplate), "text/markdown");
      setMessage("Prompt exported.");
    } else if (action === "copy-report") {
      copyText(buildHandoffReport(), "Handoff report copied.");
    } else if (action === "download-report") {
      downloadFile("website-improvement-handoff.md", buildHandoffReport(), "text/markdown");
      setMessage("Handoff report exported.");
    } else if (action === "copy-linked-preview-start") {
      var startReport = appState.workspace.linkedPreview;
      copyText(startReport && startReport.commands.start || "", "Manual preview command copied.");
    } else if (action === "copy-linked-preview-refresh") {
      var refreshReport = appState.workspace.linkedPreview;
      copyText(refreshReport && refreshReport.commands.refresh || "", "Linked preview refresh command copied.");
    } else if (action === "download-linked-preview") {
      if (appState.workspace.linkedPreview) {
        downloadFile("website-linked-preview.json", JSON.stringify(appState.workspace.linkedPreview, null, 2), "application/json");
        setMessage("Linked preview JSON exported.");
      }
    } else if (action === "clear-linked-preview") {
      appState.workspace.linkedPreview = null;
      saveWorkspace();
      setMessage("Linked preview report cleared.");
    } else if (action === "copy-runbook") {
      copyText(buildOperatorRunbookMarkdown(), "Operator runbook copied.");
    } else if (action === "download-runbook") {
      downloadFile("website-operator-runbook.md", buildOperatorRunbookMarkdown(), "text/markdown");
      setMessage("Operator runbook exported.");
    } else if (action === "copy-filtered-runbook") {
      var filteredCopyRunbook = appState.workspace.operatorRunbook;
      if (filteredCopyRunbook && (filteredCopyRunbook.stageHumanLineDisplayRows || []).length) {
        copyText(buildOperatorRunbookMarkdown({ filtered: true }), "Filtered operator runbook rows copied.");
      } else {
        setMessage("Filtered runbook rows unavailable.");
      }
    } else if (action === "download-filtered-runbook") {
      var filteredExportRunbook = appState.workspace.operatorRunbook;
      if (filteredExportRunbook && (filteredExportRunbook.stageHumanLineDisplayRows || []).length) {
        downloadFile("website-operator-runbook.filtered.md", buildOperatorRunbookMarkdown({ filtered: true }), "text/markdown");
        setMessage("Filtered operator runbook exported.");
      } else {
        setMessage("Filtered runbook rows unavailable.");
      }
    } else if (action === "copy-runbook-row-markdown") {
      var markdownRunbook = appState.workspace.operatorRunbook;
      var markdownRow = markdownRunbook && markdownRunbook.stageHumanLineDisplayRowByKey
        ? markdownRunbook.stageHumanLineDisplayRowByKey[button.dataset.runbookRowKey]
        : null;
      if (markdownRow && markdownRow.line) {
        copyText(buildOperatorRunbookRowMarkdown(markdownRow), "Runbook row Markdown copied.");
      } else {
        setMessage("Runbook row Markdown unavailable.");
      }
    } else if (action === "download-runbook-row-markdown") {
      var exportRunbook = appState.workspace.operatorRunbook;
      var exportRow = exportRunbook && exportRunbook.stageHumanLineDisplayRowByKey
        ? exportRunbook.stageHumanLineDisplayRowByKey[button.dataset.runbookRowKey]
        : null;
      if (exportRow && exportRow.line) {
        downloadFile("website-operator-runbook." + safeFileSegment(exportRow.key) + ".md", buildOperatorRunbookRowMarkdown(exportRow), "text/markdown");
        setMessage("Runbook row Markdown exported.");
      } else {
        setMessage("Runbook row Markdown unavailable.");
      }
    } else if (action === "copy-runbook-row-line") {
      var rowRunbook = appState.workspace.operatorRunbook;
      var row = rowRunbook && rowRunbook.stageHumanLineDisplayRowByKey
        ? rowRunbook.stageHumanLineDisplayRowByKey[button.dataset.runbookRowKey]
        : null;
      if (row && row.line) {
        copyText(row.line, "Runbook row line copied.");
      } else {
        setMessage("Runbook row line unavailable.");
      }
    } else if (action === "copy-next-runbook-line") {
      var runbook = appState.workspace.operatorRunbook;
      if (runbook && runbook.nextStageHumanLine) {
        copyText(runbook.nextStageHumanLine, "Next runbook line copied.");
      } else {
        setMessage("Next runbook line unavailable.");
      }
    } else if (action === "copy-runbook-source-check-command") {
      var checkRunbook = appState.workspace.operatorRunbook;
      var checkSourceBundle = checkRunbook && checkRunbook.sourceBundle;
      if (checkSourceBundle && checkSourceBundle.strictCheckCommand) {
        copyText(checkSourceBundle.strictCheckCommand, "Strict bundle check command copied.");
      } else {
        setMessage("Strict bundle check command unavailable.");
      }
    } else if (action === "copy-runbook-source-handoff-command") {
      var handoffRunbook = appState.workspace.operatorRunbook;
      var handoffSourceBundle = handoffRunbook && handoffRunbook.sourceBundle;
      if (handoffSourceBundle && handoffSourceBundle.strictHandoffCommand) {
        copyText(handoffSourceBundle.strictHandoffCommand, "Strict bundle handoff command copied.");
      } else {
        setMessage("Strict bundle handoff command unavailable.");
      }
    } else if (action === "copy-runbook-source-marker") {
      var sourceMarkerRunbook = appState.workspace.operatorRunbook;
      copyText((sourceMarkerRunbook && sourceMarkerRunbook.source) || "source-bundle-provenance", "Runbook source marker copied.");
    } else if (action === "copy-runbook-source-bundle") {
      var sourceBundleRunbook = appState.workspace.operatorRunbook;
      copyText(buildSourceBundleMarkdown(sourceBundleRunbook && sourceBundleRunbook.sourceBundle, sourceBundleRunbook && sourceBundleRunbook.source), "Source bundle Markdown copied.");
    } else if (action === "download-runbook-source-bundle") {
      var exportSourceBundleRunbook = appState.workspace.operatorRunbook;
      downloadFile("website-source-bundle-provenance.md", buildSourceBundleMarkdown(exportSourceBundleRunbook && exportSourceBundleRunbook.sourceBundle, exportSourceBundleRunbook && exportSourceBundleRunbook.source), "text/markdown");
      setMessage("Source bundle Markdown exported.");
    } else if (action === "copy-runbook-source-bundle-json") {
      var sourceBundleJsonRunbook = appState.workspace.operatorRunbook;
      copyText(buildSourceBundleJson(sourceBundleJsonRunbook && sourceBundleJsonRunbook.sourceBundle), "Source bundle JSON copied.");
    } else if (action === "download-runbook-source-bundle-json") {
      var exportSourceBundleJsonRunbook = appState.workspace.operatorRunbook;
      downloadFile("website-source-bundle-provenance.json", buildSourceBundleJson(exportSourceBundleJsonRunbook && exportSourceBundleJsonRunbook.sourceBundle), "application/json");
      setMessage("Source bundle JSON exported.");
    } else if (action === "copy-runbook-source-revalidation-gate") {
      var sourceBundleGateRunbook = appState.workspace.operatorRunbook;
      var sourceBundleGate = sourceBundleGateRunbook && sourceBundleGateRunbook.sourceBundle;
      if (sourceBundleGate) {
        copyText(buildSourceBundleRevalidationGateJson(sourceBundleGate), "Source bundle gate JSON copied.");
      } else {
        setMessage("Source bundle gate unavailable.");
      }
    } else if (action === "download-runbook-source-revalidation-gate") {
      var exportSourceBundleGateRunbook = appState.workspace.operatorRunbook;
      var exportSourceBundleGate = exportSourceBundleGateRunbook && exportSourceBundleGateRunbook.sourceBundle;
      if (exportSourceBundleGate) {
        downloadFile("website-source-bundle-revalidation-gate.json", buildSourceBundleRevalidationGateJson(exportSourceBundleGate), "application/json");
        setMessage("Source bundle gate JSON exported.");
      } else {
        setMessage("Source bundle gate unavailable.");
      }
    } else if (action === "clear-runbook") {
      appState.workspace.operatorRunbook = null;
      appState.runbookActionFilter = "all";
      appState.runbookEvidenceFilter = "all";
      saveWorkspace();
      setMessage("Operator runbook cleared.");
    } else if (action === "reset-runbook-filters") {
      appState.runbookActionFilter = "all";
      appState.runbookEvidenceFilter = "all";
      render();
      setMessage("Runbook filters reset.");
    } else if (action === "copy-graph-json") {
      copyText(JSON.stringify(buildWorkflowGraph(), null, 2), "Workflow graph JSON copied.");
    } else if (action === "download-graph-json") {
      downloadFile("website-workflow-graph.json", JSON.stringify(buildWorkflowGraph(), null, 2), "application/json");
      setMessage("Workflow graph JSON exported.");
    }
  }

  function handleImport(event) {
    var file = event.target.files && event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var rawJson = String(reader.result || "");
        var parsed = JSON.parse(rawJson);
        var importedReviewComparison = normalizeReviewComparisonArtifact(parsed);
        if (importedReviewComparison) {
          appState.reviewComparison = importedArtifact(importedReviewComparison, rawJson);
          appState.activeTab = "quality";
          localStorage.setItem(ACTIVE_TAB_KEY, appState.activeTab);
          saveImportedArtifact(REVIEW_COMPARISON_KEY, appState.reviewComparison);
          setMessage("Review comparison imported. Exact source identity, finding decisions, approval gates, and claim boundaries preserved.");
          return;
        }
        var importedPilotEvidence = normalizePilotEvidenceArtifact(parsed);
        if (importedPilotEvidence) {
          var pilotImplementationEvidence = normalizeImplementationEvidenceArtifact(
            importedPilotEvidence.implementationEvidence.value,
          );
          var pilotApproval = normalizeImplementationScopeApproval(pilotImplementationEvidence.approval.value);
          var pilotProposal = normalizeImplementationScopeProposal(pilotApproval.proposal.value);
          var pilotWorkflow = normalizeReviewWorkflow(importedPilotEvidence.reviewWorkflow.value);
          appState.pilotEvidence = importedArtifact(importedPilotEvidence, rawJson);
          appState.implementationEvidence = importedArtifact(
            pilotImplementationEvidence,
            importedPilotEvidence.implementationEvidence.source,
          );
          appState.implementationScopeApproval = importedArtifact(
            pilotApproval,
            pilotImplementationEvidence.approval.source,
          );
          appState.implementationScopeProposal = importedArtifact(
            pilotProposal,
            pilotApproval.proposal.source,
          );
          appState.targetRepoIntake = importedArtifact(
            normalizeTargetRepoIntake(pilotProposal.intake.value),
            pilotProposal.intake.source,
          );
          appState.reviewReceipt = null;
          appState.reviewHandoff = null;
          appState.reviewWorkflow = importedArtifact(
            pilotWorkflow,
            importedPilotEvidence.reviewWorkflow.source,
          );
          appState.startPlan = normalizeStartPlan(pilotWorkflow.plan);
          appState.qualityReport = importedArtifact(normalizeQualityReport(pilotWorkflow.report), "");
          appState.browserVerification = null;
          appState.activeTab = "quality";
          localStorage.setItem(ACTIVE_TAB_KEY, appState.activeTab);
          saveImportedArtifact(PILOT_EVIDENCE_KEY, appState.pilotEvidence);
          saveImportedArtifact(IMPLEMENTATION_EVIDENCE_KEY, appState.implementationEvidence);
          saveImportedArtifact(IMPLEMENTATION_SCOPE_APPROVAL_KEY, appState.implementationScopeApproval);
          saveImportedArtifact(IMPLEMENTATION_SCOPE_PROPOSAL_KEY, appState.implementationScopeProposal);
          saveImportedArtifact(TARGET_REPO_INTAKE_KEY, appState.targetRepoIntake);
          saveImportedArtifact(REVIEW_HANDOFF_RECEIPT_KEY, null);
          saveImportedArtifact(REVIEW_HANDOFF_KEY, null);
          saveImportedArtifact(REVIEW_WORKFLOW_KEY, appState.reviewWorkflow);
          refreshQualityLink();
          setMessage("Pilot evidence imported. Exact P6 and P11 sources, consent, metrics, and claim boundaries preserved.");
          return;
        }
        appState.pilotEvidence = null;
        saveImportedArtifact(PILOT_EVIDENCE_KEY, null);
        var importedImplementationEvidence = normalizeImplementationEvidenceArtifact(parsed);
        if (importedImplementationEvidence) {
          var evidenceApproval = normalizeImplementationScopeApproval(importedImplementationEvidence.approval.value);
          var evidenceProposal = normalizeImplementationScopeProposal(evidenceApproval.proposal.value);
          appState.implementationEvidence = importedArtifact(importedImplementationEvidence, rawJson);
          appState.implementationScopeApproval = importedArtifact(
            evidenceApproval,
            importedImplementationEvidence.approval.source,
          );
          appState.implementationScopeProposal = importedArtifact(
            evidenceProposal,
            evidenceApproval.proposal.source,
          );
          appState.targetRepoIntake = importedArtifact(
            normalizeTargetRepoIntake(evidenceProposal.intake.value),
            evidenceProposal.intake.source,
          );
          appState.activeTab = "quality";
          localStorage.setItem(ACTIVE_TAB_KEY, appState.activeTab);
          saveImportedArtifact(IMPLEMENTATION_EVIDENCE_KEY, appState.implementationEvidence);
          saveImportedArtifact(IMPLEMENTATION_SCOPE_APPROVAL_KEY, appState.implementationScopeApproval);
          saveImportedArtifact(IMPLEMENTATION_SCOPE_PROPOSAL_KEY, appState.implementationScopeProposal);
          saveImportedArtifact(TARGET_REPO_INTAKE_KEY, appState.targetRepoIntake);
          refreshQualityLink();
          setMessage("Implementation evidence imported. Exact approval, request, Git observations, and remaining release gates preserved.");
          return;
        }
        var importedScopeApproval = normalizeImplementationScopeApproval(parsed);
        if (importedScopeApproval) {
          appState.implementationEvidence = null;
          saveImportedArtifact(IMPLEMENTATION_EVIDENCE_KEY, null);
          var approvedProposal = normalizeImplementationScopeProposal(importedScopeApproval.proposal.value);
          appState.implementationScopeApproval = importedArtifact(importedScopeApproval, rawJson);
          appState.implementationScopeProposal = importedArtifact(
            approvedProposal,
            importedScopeApproval.proposal.source,
          );
          appState.targetRepoIntake = importedArtifact(
            normalizeTargetRepoIntake(approvedProposal.intake.value),
            approvedProposal.intake.source,
          );
          appState.activeTab = "quality";
          localStorage.setItem(ACTIVE_TAB_KEY, appState.activeTab);
          saveImportedArtifact(IMPLEMENTATION_SCOPE_APPROVAL_KEY, appState.implementationScopeApproval);
          saveImportedArtifact(IMPLEMENTATION_SCOPE_PROPOSAL_KEY, appState.implementationScopeProposal);
          saveImportedArtifact(TARGET_REPO_INTAKE_KEY, appState.targetRepoIntake);
          refreshQualityLink();
          setMessage("Implementation-scope approval imported. Exact proposal linkage and remaining release gates preserved.");
          return;
        }
        var importedScopeProposal = normalizeImplementationScopeProposal(parsed);
        if (importedScopeProposal) {
          appState.implementationEvidence = null;
          saveImportedArtifact(IMPLEMENTATION_EVIDENCE_KEY, null);
          appState.implementationScopeApproval = null;
          saveImportedArtifact(IMPLEMENTATION_SCOPE_APPROVAL_KEY, null);
          appState.implementationScopeProposal = importedArtifact(importedScopeProposal, rawJson);
          appState.targetRepoIntake = importedArtifact(
            normalizeTargetRepoIntake(importedScopeProposal.intake.value),
            importedScopeProposal.intake.source,
          );
          appState.activeTab = "quality";
          localStorage.setItem(ACTIVE_TAB_KEY, appState.activeTab);
          saveImportedArtifact(IMPLEMENTATION_SCOPE_PROPOSAL_KEY, appState.implementationScopeProposal);
          saveImportedArtifact(TARGET_REPO_INTAKE_KEY, appState.targetRepoIntake);
          refreshQualityLink();
          setMessage("Implementation-scope proposal imported. Exact intake, request, selectors, risks, and pending gates preserved.");
          return;
        }
        var importedTargetRepoIntake = normalizeTargetRepoIntake(parsed);
        if (importedTargetRepoIntake) {
          if (appState.reviewReceipt
            && !targetRepoIntakeMatchesReceipt(importedTargetRepoIntake, appState.reviewReceipt.rawJson)) {
            throw new Error("Target repository intake does not match the imported receipt source.");
          }
          appState.implementationEvidence = null;
          appState.implementationScopeApproval = null;
          appState.implementationScopeProposal = null;
          saveImportedArtifact(IMPLEMENTATION_EVIDENCE_KEY, null);
          saveImportedArtifact(IMPLEMENTATION_SCOPE_APPROVAL_KEY, null);
          saveImportedArtifact(IMPLEMENTATION_SCOPE_PROPOSAL_KEY, null);
          appState.targetRepoIntake = importedArtifact(importedTargetRepoIntake, rawJson);
          appState.activeTab = "quality";
          localStorage.setItem(ACTIVE_TAB_KEY, appState.activeTab);
          saveImportedArtifact(TARGET_REPO_INTAKE_KEY, appState.targetRepoIntake);
          refreshQualityLink();
          setMessage("Target repository intake imported. Receipt digest, bounded metadata, and Git state preserved.");
          return;
        }
        var importedReviewReceipt = normalizeReviewHandoffReceipt(parsed);
        if (importedReviewReceipt) {
          var receiptHandoff = importedReviewReceipt.handoff.value;
          clearImplementationScopeProposalSession();
          appState.targetRepoIntake = null;
          saveImportedArtifact(TARGET_REPO_INTAKE_KEY, null);
          appState.reviewReceipt = importedArtifact(importedReviewReceipt, rawJson);
          appState.reviewHandoff = importedArtifact(
            normalizeReviewHandoff(receiptHandoff),
            importedReviewReceipt.handoff.source,
          );
          appState.reviewWorkflow = importedArtifact(
            normalizeReviewWorkflow(receiptHandoff.artifacts.reviewWorkflow.value),
            receiptHandoff.artifacts.reviewWorkflow.source,
          );
          appState.startPlan = normalizeStartPlan(receiptHandoff.artifacts.reviewWorkflow.value.plan);
          appState.qualityReport = importedArtifact(
            normalizeQualityReport(receiptHandoff.artifacts.reviewWorkflow.value.report),
            receiptHandoff.artifacts.qualityReport
              ? receiptHandoff.artifacts.qualityReport.source
              : "",
          );
          appState.browserVerification = receiptHandoff.artifacts.browserVerification
            ? importedArtifact(
              normalizeBrowserVerification(receiptHandoff.artifacts.browserVerification.value),
              receiptHandoff.artifacts.browserVerification.source,
            )
            : null;
          appState.activeTab = "quality";
          localStorage.setItem(ACTIVE_TAB_KEY, appState.activeTab);
          saveImportedArtifact(REVIEW_HANDOFF_RECEIPT_KEY, appState.reviewReceipt);
          saveImportedArtifact(REVIEW_HANDOFF_KEY, appState.reviewHandoff);
          refreshQualityLink();
          setMessage("Canonical review-handoff receipt imported. Exact receipt and nested handoff bytes preserved.");
          return;
        }
        var importedReviewHandoff = normalizeReviewHandoff(parsed);
        if (importedReviewHandoff) {
          clearImplementationScopeProposalSession();
          appState.targetRepoIntake = null;
          saveImportedArtifact(TARGET_REPO_INTAKE_KEY, null);
          appState.reviewReceipt = null;
          saveImportedArtifact(REVIEW_HANDOFF_RECEIPT_KEY, null);
          appState.reviewHandoff = importedArtifact(importedReviewHandoff, rawJson);
          appState.reviewWorkflow = importedArtifact(
            normalizeReviewWorkflow(importedReviewHandoff.artifacts.reviewWorkflow.value),
            importedReviewHandoff.artifacts.reviewWorkflow.source,
          );
          appState.startPlan = normalizeStartPlan(importedReviewHandoff.artifacts.reviewWorkflow.value.plan);
          appState.qualityReport = importedArtifact(
            normalizeQualityReport(importedReviewHandoff.artifacts.reviewWorkflow.value.report),
            importedReviewHandoff.artifacts.qualityReport
              ? importedReviewHandoff.artifacts.qualityReport.source
              : "",
          );
          appState.browserVerification = importedReviewHandoff.artifacts.browserVerification
            ? importedArtifact(
              normalizeBrowserVerification(importedReviewHandoff.artifacts.browserVerification.value),
              importedReviewHandoff.artifacts.browserVerification.source,
            )
            : null;
          appState.activeTab = "quality";
          localStorage.setItem(ACTIVE_TAB_KEY, appState.activeTab);
          saveImportedArtifact(REVIEW_HANDOFF_KEY, appState.reviewHandoff);
          refreshQualityLink();
          setMessage("Canonical review-handoff JSON imported. Source bytes and pending delivery boundary preserved.");
          return;
        }
        var importedReviewWorkflow = normalizeReviewWorkflow(parsed);
        if (importedReviewWorkflow) {
          clearImplementationScopeProposalSession();
          appState.targetRepoIntake = null;
          saveImportedArtifact(TARGET_REPO_INTAKE_KEY, null);
          appState.reviewReceipt = null;
          saveImportedArtifact(REVIEW_HANDOFF_RECEIPT_KEY, null);
          appState.reviewHandoff = null;
          saveImportedArtifact(REVIEW_HANDOFF_KEY, null);
          appState.reviewWorkflow = importedArtifact(importedReviewWorkflow, rawJson);
          appState.startPlan = normalizeStartPlan(importedReviewWorkflow.plan);
          appState.qualityReport = importedArtifact(normalizeQualityReport(importedReviewWorkflow.report), "");
          appState.activeTab = "quality";
          localStorage.setItem(ACTIVE_TAB_KEY, appState.activeTab);
          saveImportedArtifact(REVIEW_WORKFLOW_KEY, appState.reviewWorkflow);
          refreshQualityLink();
          setMessage("Canonical review-workflow JSON imported. Envelope bytes preserved; nested Start and Quality contracts render by value.");
          return;
        }
        var importedQualityReport = normalizeQualityReport(parsed);
        if (importedQualityReport) {
          clearReviewWorkflowSession();
          appState.qualityReport = importedArtifact(importedQualityReport, rawJson);
          appState.activeTab = "quality";
          localStorage.setItem(ACTIVE_TAB_KEY, appState.activeTab);
          saveImportedArtifact(QUALITY_REPORT_KEY, appState.qualityReport);
          refreshQualityLink();
          setMessage("Canonical quality-report JSON imported. Original bytes preserved.");
          return;
        }
        var importedBrowserVerification = normalizeBrowserVerification(parsed);
        if (importedBrowserVerification) {
          if (appState.reviewHandoff) clearReviewHandoffSession();
          appState.browserVerification = importedArtifact(importedBrowserVerification, rawJson);
          appState.activeTab = "quality";
          localStorage.setItem(ACTIVE_TAB_KEY, appState.activeTab);
          saveImportedArtifact(BROWSER_VERIFICATION_KEY, appState.browserVerification);
          refreshQualityLink();
          setMessage("Canonical browser-verification JSON imported as a separate sidecar.");
          return;
        }
        var importedStartPlan = normalizeStartPlan(extractStartPlanPayload(parsed));
        if (importedStartPlan) {
          clearReviewWorkflowSession();
          appState.startPlan = importedStartPlan;
          appState.activeTab = "start";
          localStorage.setItem(ACTIVE_TAB_KEY, appState.activeTab);
          saveStartPlan();
          setMessage("Read-only start JSON imported. Start tab opened.");
          return;
        }
        var importedLinkedPreview = normalizeLinkedPreview(parsed);
        if (importedLinkedPreview && !parsed.siteProfile) {
          appState.workspace.linkedPreview = importedLinkedPreview;
          appState.activeTab = "report";
          localStorage.setItem(ACTIVE_TAB_KEY, appState.activeTab);
          saveWorkspace();
          setMessage("Linked preview readiness JSON imported. Report tab opened.");
          return;
        }
        var importedRunbook = normalizeOperatorRunbook(extractOperatorRunbookPayload(parsed), parsed);
        if (importedRunbook && !parsed.siteProfile) {
          appState.workspace.operatorRunbook = importedRunbook;
          appState.runbookActionFilter = "all";
          appState.runbookEvidenceFilter = "all";
          appState.activeTab = "report";
          localStorage.setItem(ACTIVE_TAB_KEY, appState.activeTab);
          saveWorkspace();
          setMessage("Bundle handoff operator runbook imported. Report tab opened.");
          return;
        }
        var importedGateSourceBundle = normalizeRunbookSourceBundle(extractSourceBundleRevalidationGatePayload(parsed));
        if (importedGateSourceBundle && !parsed.siteProfile) {
          if (appState.workspace.operatorRunbook) {
            appState.workspace.operatorRunbook.sourceBundle = importedGateSourceBundle;
            if (!(appState.workspace.operatorRunbook.stageHumanLineDisplayRows || []).length) {
              appState.workspace.operatorRunbook.source = "source-bundle-revalidation-gate";
            }
          } else {
            appState.workspace.operatorRunbook = createSourceBundleOnlyRunbook(importedGateSourceBundle, "source-bundle-revalidation-gate");
          }
          appState.activeTab = "report";
          localStorage.setItem(ACTIVE_TAB_KEY, appState.activeTab);
          saveWorkspace();
          setMessage("Source bundle revalidation gate JSON imported. Report tab opened.");
          return;
        }
        var importedSourceBundle = normalizeRunbookSourceBundle(extractSourceBundleProvenancePayload(parsed));
        if (importedSourceBundle && !parsed.siteProfile) {
          if (appState.workspace.operatorRunbook) {
            appState.workspace.operatorRunbook.sourceBundle = importedSourceBundle;
            if (!(appState.workspace.operatorRunbook.stageHumanLineDisplayRows || []).length) {
              appState.workspace.operatorRunbook.source = "source-bundle-provenance";
            }
          } else {
            appState.workspace.operatorRunbook = createSourceBundleOnlyRunbook(importedSourceBundle);
          }
          appState.activeTab = "report";
          localStorage.setItem(ACTIVE_TAB_KEY, appState.activeTab);
          saveWorkspace();
          setMessage("Source bundle provenance JSON imported. Report tab opened.");
          return;
        }
        if (!isWorkspacePayload(parsed)) {
          throw new Error("Unknown JSON contract");
        }
        appState.workspace = normalizeWorkspace(parsed);
        appState.runbookActionFilter = "all";
        appState.runbookEvidenceFilter = "all";
        saveWorkspace();
        setMessage("Workspace JSON imported.");
      } catch (error) {
        setMessage("Import failed. Use a canonical review comparison, target intake, review receipt, handoff, workflow, quality, browser, start, Website Improvement workspace, runbook, or linked preview JSON file.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  }

  document.addEventListener("input", handleInput);
  document.addEventListener("change", function (event) {
    if (event.target && event.target.matches("[data-action='import-file']")) {
      handleImport(event);
    } else {
      handleInput(event);
    }
  });
  document.addEventListener("click", handleClick);

  render();
  refreshQualityLink();
}());
