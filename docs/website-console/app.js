(function () {
  "use strict";

  var STORAGE_KEY = "design-ai.website-console.v1";
  var ACTIVE_TAB_KEY = "design-ai.website-console.active-tab";
  var SELECTED_TEMPLATE_KEY = "design-ai.website-console.prompt-template";

  var auditCategories = [
    {
      id: "visual-design",
      label: "Visual Design",
      description: "Layout, type, color, spacing, and hierarchy.",
      defaultVerification: ["Compare spacing rhythm across target pages", "Check contrast ratios for key text pairs"],
    },
    {
      id: "ux-flow",
      label: "UX Flow",
      description: "Navigation, CTA, forms, conversion path, and confusion points.",
      defaultVerification: ["Complete the primary user flow on desktop and mobile", "Confirm one dominant CTA per decision point"],
    },
    {
      id: "responsive",
      label: "Responsive QA",
      description: "Desktop, tablet, and mobile layout behavior.",
      defaultVerification: ["Verify desktop, tablet, and mobile viewports", "Check text wrapping and touch targets"],
    },
    {
      id: "accessibility",
      label: "Accessibility",
      description: "Keyboard, focus, contrast, semantic HTML, ARIA.",
      defaultVerification: ["Tab through all interactive controls", "Confirm visible focus and accessible names"],
    },
    {
      id: "performance",
      label: "Performance",
      description: "Core Web Vitals, images, bundles, rendering bottlenecks.",
      defaultVerification: ["Run Lighthouse or deployment analytics when available", "Confirm image dimensions and lazy-loading"],
    },
    {
      id: "seo",
      label: "SEO",
      description: "Title, description, headings, canonical, OG, sitemap.",
      defaultVerification: ["Inspect metadata for each priority page", "Validate heading order and canonical links"],
    },
    {
      id: "technical-quality",
      label: "Technical Quality",
      description: "Components, style duplication, dead code, dependency risk.",
      defaultVerification: ["Inspect component ownership before editing", "Run target repo lint/typecheck/build"],
    },
    {
      id: "runtime-issues",
      label: "Runtime Issues",
      description: "Console, network, hydration, broken asset failures.",
      defaultVerification: ["Open the site in Browser or Chrome DevTools", "Confirm console and network panels are clean"],
    },
    {
      id: "content-quality",
      label: "Content Quality",
      description: "Copy clarity, IA, proof, trust, and CTA language.",
      defaultVerification: ["Read the page as a first-time visitor", "Check whether claims have concrete proof"],
    },
  ];

  var mcpItems = [
    ["github", "GitHub", "Repo, issues, PRs, code review"],
    ["figma", "Figma", "Design files, tokens, component reference"],
    ["browser", "Browser/Playwright", "Page interaction and visual verification"],
    ["chromeDevtools", "Chrome DevTools", "Console, network, performance debugging"],
    ["deploy", "Deploy", "Vercel, Netlify, Cloudflare previews and logs"],
    ["sentry", "Sentry", "Production error and performance traces"],
    ["database", "Database", "Supabase, Neon, Postgres schema and data dependencies"],
    ["cms", "CMS", "Sanity, Contentful, WordPress, Shopify content"],
    ["collaboration", "Collaboration", "Notion, Slack, Linear, Jira feedback flow"],
    ["research", "Research", "Firecrawl, Tavily, Apify competitor research"],
  ];

  var deployOptions = ["vercel", "netlify", "cloudflare", "other", "none"];
  var cmsOptions = ["sanity", "contentful", "wordpress", "shopify", "none", "other"];
  var databaseOptions = ["supabase", "neon", "postgres", "none", "other"];
  var viewportOptions = ["desktop", "tablet", "mobile"];
  var statusOptions = ["todo", "in-progress", "done", "blocked"];
  var mcpStatusOptions = ["required", "optional", "unused", "unavailable"];
  var priorityOptions = ["p0", "p1", "p2", "p3"];
  var impactOptions = ["high", "medium", "low"];
  var effortOptions = ["high", "medium", "low"];

  var tabs = [
    ["profile", "Site Profile"],
    ["audit", "Audit Checklist"],
    ["mcp", "MCP Matrix"],
    ["graph", "Workflow Graph"],
    ["tasks", "Refactor Plan"],
    ["prompts", "Prompt Generator"],
    ["report", "Handoff Report"],
  ];

  var templates = [
    ["codex-repo-intake", "Codex repo intake"],
    ["codex-implementation", "Codex implementation"],
    ["codex-visual-qa", "Codex visual QA"],
    ["codex-deployment", "Codex deployment verification"],
    ["claude-design-review", "Claude design review"],
    ["claude-competitor", "Claude competitor research"],
    ["claude-copy-ux", "Claude copy/UX critique"],
    ["handoff-report", "Final handoff report"],
  ];

  var appState = {
    workspace: loadWorkspace(),
    activeTab: localStorage.getItem(ACTIVE_TAB_KEY) || "profile",
    selectedTemplate: localStorage.getItem(SELECTED_TEMPLATE_KEY) || "codex-repo-intake",
    runbookActionFilter: "all",
    runbookEvidenceFilter: "all",
    message: "",
  };

  function createDefaultChecklist() {
    return auditCategories.reduce(function (acc, item) {
      acc[item.id] = {
        status: "todo",
        notes: "",
        findings: [],
      };
      return acc;
    }, {});
  }

  function createDefaultWorkspace() {
    return {
      version: 1,
      updatedAt: new Date().toISOString(),
      siteProfile: {
        id: "sample-korean-saas",
        name: "Korean SaaS marketing site",
        liveUrl: "https://example.com",
        repoUrl: "https://github.com/acme/korean-saas-site",
        localPath: "/Users/you/dev/korean-saas-site",
        figmaUrl: "https://figma.com/file/example",
        brandNotes: "Quiet B2B SaaS tone, Pretendard typography, dense but readable Korean product copy, indigo accent only for action and focus.",
        deployProvider: "vercel",
        sentryProject: "acme/korean-saas-web",
        cms: "sanity",
        database: "none",
        pages: ["/", "/pricing", "/signup", "/docs"],
        userFlows: ["Visitor compares pricing and starts signup", "Existing customer finds feature proof before contacting sales"],
        viewports: ["desktop", "tablet", "mobile"],
      },
      auditChecklist: {
        "visual-design": {
          status: "in-progress",
          notes: "Hero hierarchy and CTA contrast need review before company pilot.",
          findings: ["Primary CTA competes with secondary link on the homepage"],
        },
        "ux-flow": {
          status: "todo",
          notes: "Map visitor path from landing page to pricing and signup.",
          findings: [],
        },
        "responsive": {
          status: "todo",
          notes: "Check 1440, 1024, 390, and 360 width layouts.",
          findings: [],
        },
        "accessibility": {
          status: "todo",
          notes: "Keyboard and focus audit required for nav, pricing toggle, and forms.",
          findings: ["Focus state is not yet documented for the mobile menu"],
        },
        "performance": {
          status: "todo",
          notes: "Run Lighthouse after visual pass.",
          findings: [],
        },
        "seo": {
          status: "todo",
          notes: "Inspect title, description, heading order, canonical, OG.",
          findings: [],
        },
        "technical-quality": {
          status: "todo",
          notes: "Confirm component reuse before editing target repo.",
          findings: [],
        },
        "runtime-issues": {
          status: "todo",
          notes: "Open console/network once preview deploy is available.",
          findings: [],
        },
        "content-quality": {
          status: "in-progress",
          notes: "Copy should lead with proof and reduce generic SaaS phrasing.",
          findings: ["Pricing page does not explain plan fit in the first viewport"],
        },
      },
      mcpReadiness: {
        github: "required",
        figma: "optional",
        browser: "required",
        chromeDevtools: "optional",
        deploy: "required",
        sentry: "optional",
        database: "unused",
        cms: "optional",
        collaboration: "optional",
        research: "optional",
      },
      refactorTasks: [
        {
          id: "task-homepage-cta",
          title: "Clarify homepage CTA hierarchy",
          category: "visual-design",
          problem: "Primary and secondary actions compete in the hero, which weakens the visitor's first decision.",
          evidence: "Sample finding: Primary CTA competes with secondary link on the homepage.",
          impact: "high",
          effort: "medium",
          priority: "p1",
          pages: ["/"],
          recommendedMcp: ["browser", "figma"],
          codexPrompt: "Inspect the target homepage implementation, preserve existing design system patterns, and revise the hero CTA hierarchy so the primary signup action is visually dominant while the secondary action remains available.",
          verification: ["Run target repo lint/build", "Verify desktop/tablet/mobile hero layout", "Confirm focus indicators and text contrast"],
          risks: ["Could change conversion copy without stakeholder approval"],
        },
      ],
      implementationEvidence: {
        executedWork: [],
        verificationResults: [],
        remainingRisks: [
          "MCP readiness gaps may limit verification depth.",
          "Copy or brand changes may require stakeholder review.",
          "Automated performance/accessibility tooling is outside this MVP unless run in the target repo.",
        ],
        nextActions: [],
      },
      operatorRunbook: null,
      reportNotes: "MVP audit is a planning console. Run the generated prompts inside the target website repo before marking implementation complete.",
    };
  }

  function normalizeWorkspace(raw) {
    var fallback = createDefaultWorkspace();
    var source = raw && typeof raw === "object" ? raw : {};
    var profile = source.siteProfile && typeof source.siteProfile === "object" ? source.siteProfile : {};
    var workspace = {
      version: 1,
      updatedAt: source.updatedAt || new Date().toISOString(),
      siteProfile: {
        id: String(profile.id || fallback.siteProfile.id),
        name: String(profile.name || fallback.siteProfile.name),
        liveUrl: String(profile.liveUrl || ""),
        repoUrl: String(profile.repoUrl || ""),
        localPath: String(profile.localPath || ""),
        figmaUrl: String(profile.figmaUrl || ""),
        brandNotes: String(profile.brandNotes || ""),
        deployProvider: normalizeEnum(profile.deployProvider, deployOptions, "none"),
        sentryProject: String(profile.sentryProject || ""),
        cms: normalizeEnum(profile.cms, cmsOptions, "none"),
        database: normalizeEnum(profile.database, databaseOptions, "none"),
        pages: normalizeStringArray(profile.pages, fallback.siteProfile.pages),
        userFlows: normalizeStringArray(profile.userFlows, fallback.siteProfile.userFlows),
        viewports: normalizeStringArray(profile.viewports, fallback.siteProfile.viewports).filter(function (item) {
          return viewportOptions.indexOf(item) !== -1;
        }),
      },
      auditChecklist: normalizeChecklist(source.auditChecklist || fallback.auditChecklist),
      mcpReadiness: normalizeMcp(source.mcpReadiness || fallback.mcpReadiness),
      refactorTasks: normalizeTasks(source.refactorTasks || fallback.refactorTasks),
      implementationEvidence: normalizeImplementationEvidence(source.implementationEvidence || fallback.implementationEvidence),
      operatorRunbook: normalizeOperatorRunbook(source.operatorRunbook || (source.bundle && source.bundle.operatorRunbook), source),
      reportNotes: String(source.reportNotes || ""),
    };
    if (workspace.siteProfile.viewports.length === 0) {
      workspace.siteProfile.viewports = ["desktop"];
    }
    return workspace;
  }

  function normalizeOperatorRunbook(value, container) {
    if (!value || typeof value !== "object") return null;
    var sourceBundle = normalizeRunbookSourceBundle(value.sourceBundle || (container && container.sourceBundle) || (container && container.bundle && container.bundle.sourceBundle));
    var rows = Array.isArray(value.stageHumanLineDisplayRows)
      ? value.stageHumanLineDisplayRows.map(normalizeRunbookRow).filter(function (row) { return row.key; })
      : [];
    var rowByKey = rows.reduce(function (acc, row) {
      acc[row.key] = row;
      return acc;
    }, {});
    var actionStatusKeys = ["ready", "optional", "manual", "blocked"];
    var evidenceProgressStatusKeys = ["blocked", "ready"];
    var actionStatusIndex = fillRunbookKeyIndexFromRows(
      normalizeRunbookKeyIndex(value.stageHumanLineDisplayRowKeysByActionStatus, actionStatusKeys),
      rows,
      "actionStatus",
      actionStatusKeys,
    );
    var evidenceProgressStatusIndex = fillRunbookKeyIndexFromRows(
      normalizeRunbookKeyIndex(value.stageHumanLineDisplayRowKeysByEvidenceProgressStatus, evidenceProgressStatusKeys),
      rows,
      "evidenceProgressStatus",
      evidenceProgressStatusKeys,
    );
    return {
      version: Number(value.version || 1),
      source: String(value.source || "bundle-handoff"),
      stageCount: Number(value.stageCount || rows.length),
      commandStageCount: Number(value.commandStageCount || 0),
      manualStageCount: Number(value.manualStageCount || 0),
      requiredStageCount: Number(value.requiredStageCount || 0),
      optionalStageCount: Number(value.optionalStageCount || 0),
      readOnlyCommandStageCount: Number(value.readOnlyCommandStageCount || 0),
      localOutputCommandStageCount: Number(value.localOutputCommandStageCount || 0),
      externalCallCommandStageCount: Number(value.externalCallCommandStageCount || 0),
      targetRepoMutationCommandStageCount: Number(value.targetRepoMutationCommandStageCount || 0),
      effectiveTaskId: String(value.effectiveTaskId || ""),
      effectiveStrictTaskCommandKey: String(value.effectiveStrictTaskCommandKey || ""),
      sourceBundle: sourceBundle,
      nextStageKey: String(value.nextStageKey || ""),
      nextCommandKey: String(value.nextCommandKey || ""),
      nextStageHumanLine: String(value.nextStageHumanLine || ""),
      nextStageHumanLineDisplayRow: normalizeRunbookRow(value.nextStageHumanLineDisplayRow || rowByKey[value.nextStageKey] || {}),
      stageHumanLineDisplayRows: rows,
      stageHumanLineDisplayRowByKey: rowByKey,
      stageHumanLineDisplayRowSummary: normalizePlainObject(value.stageHumanLineDisplayRowSummary),
      stageHumanLineDisplayRowKeysByActionStatus: actionStatusIndex,
      stageHumanLineDisplayRowKeysByEvidenceProgressStatus: evidenceProgressStatusIndex,
    };
  }

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

  function normalizeRunbookRow(value) {
    var row = value && typeof value === "object" ? value : {};
    return {
      step: Number(row.step || 0),
      key: String(row.key || ""),
      label: String(row.label || ""),
      line: String(row.line || ""),
      required: row.required === true,
      manual: row.manual === true,
      commandCount: Number(row.commandCount || 0),
      actionType: String(row.actionType || ""),
      actionLabel: String(row.actionLabel || ""),
      actionStatus: String(row.actionStatus || ""),
      actionStatusLabel: String(row.actionStatusLabel || ""),
      actionStatusTone: String(row.actionStatusTone || ""),
      hasEvidenceProgress: row.hasEvidenceProgress === true,
      evidenceProgressStatus: String(row.evidenceProgressStatus || ""),
      evidenceProgressStatusLabel: String(row.evidenceProgressStatusLabel || ""),
      evidenceProgressStatusTone: String(row.evidenceProgressStatusTone || ""),
      evidenceProgressIconName: String(row.evidenceProgressIconName || ""),
      evidenceProgressLabel: String(row.evidenceProgressLabel || ""),
      evidenceCompletionPercent: Number(row.evidenceCompletionPercent || 0),
      firstUncheckedEvidenceItemLabel: String(row.firstUncheckedEvidenceItemLabel || ""),
    };
  }

  function normalizePlainObject(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function normalizeRunbookKeyIndex(value, keys) {
    var source = normalizePlainObject(value);
    return keys.reduce(function (acc, key) {
      acc[key] = normalizeStringArray(source[key], []);
      return acc;
    }, {});
  }

  function fillRunbookKeyIndexFromRows(index, rows, statusField, keys) {
    keys.forEach(function (key) {
      if (index[key] && index[key].length) return;
      index[key] = rows.filter(function (row) {
        return row[statusField] === key;
      }).map(function (row) {
        return row.key;
      });
    });
    return index;
  }

  function extractOperatorRunbookPayload(value) {
    if (!value || typeof value !== "object") return null;
    if (value.operatorRunbook) return value.operatorRunbook;
    if (value.bundle && value.bundle.operatorRunbook) return value.bundle.operatorRunbook;
    return null;
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
      valid: sourceBundle.valid === true || gate.valid === true,
      failureCount: Number(gate.failureCount || 0),
      warningCount: Number(gate.warningCount || 0),
      issueCount: Number(gate.issueCount || 0),
      strictCheckCommand: gate.strictCheckCommand || "",
    };
  }

  function createSourceBundleOnlyRunbook(sourceBundle, source) {
    return normalizeOperatorRunbook({
      version: 1,
      source: source || "source-bundle-provenance",
      sourceBundle: sourceBundle,
      stageCount: 0,
      stageHumanLineDisplayRows: [],
    });
  }

  function normalizeImplementationEvidence(value) {
    var fallback = createDefaultWorkspace().implementationEvidence;
    var source = value && typeof value === "object" ? value : {};
    return {
      executedWork: normalizeStringArray(source.executedWork, []),
      verificationResults: normalizeStringArray(source.verificationResults, []),
      remainingRisks: normalizeStringArray(source.remainingRisks, fallback.remainingRisks),
      nextActions: normalizeStringArray(source.nextActions, []),
    };
  }

  function normalizeChecklist(value) {
    var fallback = createDefaultChecklist();
    return auditCategories.reduce(function (acc, item) {
      var row = value && value[item.id] && typeof value[item.id] === "object" ? value[item.id] : {};
      acc[item.id] = {
        status: normalizeEnum(row.status, statusOptions, fallback[item.id].status),
        notes: String(row.notes || ""),
        findings: normalizeStringArray(row.findings, []),
      };
      return acc;
    }, {});
  }

  function normalizeMcp(value) {
    return mcpItems.reduce(function (acc, item) {
      var key = item[0];
      acc[key] = normalizeEnum(value && value[key], mcpStatusOptions, "unused");
      return acc;
    }, {});
  }

  function normalizeTasks(value) {
    if (!Array.isArray(value)) return [];
    return value.map(function (task, index) {
      var item = task && typeof task === "object" ? task : {};
      return {
        id: String(item.id || "task-" + Date.now() + "-" + index),
        title: String(item.title || "Untitled website improvement task"),
        category: normalizeEnum(item.category, auditCategories.map(function (category) { return category.id; }), "ux-flow"),
        problem: String(item.problem || ""),
        evidence: String(item.evidence || ""),
        impact: normalizeEnum(item.impact, impactOptions, "medium"),
        effort: normalizeEnum(item.effort, effortOptions, "medium"),
        priority: normalizeEnum(item.priority, priorityOptions, "p2"),
        pages: normalizeStringArray(item.pages, []),
        recommendedMcp: normalizeStringArray(item.recommendedMcp, []),
        codexPrompt: String(item.codexPrompt || ""),
        verification: normalizeStringArray(item.verification, []),
        risks: normalizeStringArray(item.risks, []),
      };
    });
  }

  function normalizeEnum(value, allowed, fallback) {
    return allowed.indexOf(value) === -1 ? fallback : value;
  }

  function normalizeStringArray(value, fallback) {
    var source = Array.isArray(value) ? value : fallback || [];
    return source
      .map(function (item) { return String(item || "").trim(); })
      .filter(Boolean);
  }

  function loadWorkspace() {
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return createDefaultWorkspace();
      return normalizeWorkspace(JSON.parse(stored));
    } catch (error) {
      return createDefaultWorkspace();
    }
  }

  function saveWorkspace() {
    appState.workspace.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState.workspace, null, 2));
  }

  function setMessage(text) {
    appState.message = text;
    render();
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/'/g, "&#39;");
  }

  function linesToText(items) {
    return normalizeStringArray(items, []).join("\n");
  }

  function textToLines(text) {
    return String(text || "")
      .split(/\r?\n/)
      .map(function (line) { return line.trim(); })
      .filter(Boolean);
  }

  function categoryById(id) {
    return auditCategories.find(function (item) { return item.id === id; }) || auditCategories[0];
  }

  function optionList(options, selected) {
    return options.map(function (option) {
      return "<option value=\"" + escapeAttr(option) + "\"" + (option === selected ? " selected" : "") + ">" + escapeHtml(labelize(option)) + "</option>";
    }).join("");
  }

  function labelize(value) {
    return String(value || "").replace(/-/g, " ").replace(/\b\w/g, function (char) {
      return char.toUpperCase();
    });
  }

  function badge(value) {
    return "<span class=\"badge badge--" + escapeAttr(value) + "\">" + escapeHtml(labelize(value)) + "</span>";
  }

  function pill(value, prefix) {
    return "<span class=\"pill pill--" + escapeAttr(value) + "\">" + escapeHtml(prefix ? prefix + " " + labelize(value) : labelize(value)) + "</span>";
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
        var count = id === "audit" ? metrics.done + "/" + auditCategories.length
          : id === "tasks" ? String(metrics.tasks)
            : id === "mcp" ? String(metrics.requiredMcp)
              : id === "graph" ? String(metrics.graphNodes)
                : id === "report" && (metrics.evidence || metrics.runbookStages) ? String(metrics.evidence || metrics.runbookStages)
                  : "";
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
      "<button type=\"button\" class=\"button\" data-action=\"import-click\">Import workspace/runbook JSON</button>",
      "<input class=\"sr-only\" type=\"file\" accept=\"application/json,.json\" id=\"import-file\" data-action=\"import-file\">",
      "<button type=\"button\" class=\"button button--danger\" data-action=\"reset-sample\">Reset sample</button>",
      appState.message ? "<p class=\"field\"><small>" + escapeHtml(appState.message) + "</small></p>" : "",
      "</div>",
      "</aside>",
    ].join("");
  }

  function renderTopbar(metrics) {
    var profile = appState.workspace.siteProfile;
    return [
      "<section class=\"topbar\" aria-label=\"Workspace summary\">",
      "<div>",
      "<h2>" + escapeHtml(tabs.find(function (tab) { return tab[0] === appState.activeTab; })[1]) + "</h2>",
      "<p>" + escapeHtml(profile.name) + " is tracked locally. Use this app to prepare website improvement work before switching into the target repo.</p>",
      "</div>",
      "<div class=\"topbar__meta\">",
      badge(appState.workspace.version === 1 ? "done" : "blocked"),
      "<span class=\"badge badge--optional\">Updated " + escapeHtml(formatDate(appState.workspace.updatedAt)) + "</span>",
      "</div>",
      "</section>",
      "<section class=\"summary-strip\" aria-label=\"Workspace metrics\">",
      metric("Pages", metrics.pages, "Priority URLs tracked"),
      metric("Audit done", metrics.done + "/" + auditCategories.length, metrics.blocked + " blocked"),
      metric("Tasks", metrics.tasks, "Refactor plan items"),
      metric("Required MCP", metrics.requiredMcp, "Connections to prepare"),
      "</section>",
    ].join("");
  }

  function metric(label, value, note) {
    return [
      "<div class=\"metric\">",
      "<div class=\"metric__label\">" + escapeHtml(label) + "</div>",
      "<div class=\"metric__value\">" + escapeHtml(value) + "</div>",
      "<div class=\"metric__note\">" + escapeHtml(note) + "</div>",
      "</div>",
    ].join("");
  }

  function formatDate(value) {
    try {
      return new Date(value).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      return "now";
    }
  }

  function renderActivePanel() {
    if (appState.activeTab === "profile") return renderProfile();
    if (appState.activeTab === "audit") return renderAudit();
    if (appState.activeTab === "mcp") return renderMcp();
    if (appState.activeTab === "graph") return renderGraph();
    if (appState.activeTab === "tasks") return renderTasks();
    if (appState.activeTab === "prompts") return renderPrompts();
    return renderReport();
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

  function boundaryItem(title, body) {
    return "<div><h4>" + escapeHtml(title) + "</h4><p>" + escapeHtml(body) + "</p></div>";
  }

  function textField(label, path, value, extraClass) {
    return [
      "<div class=\"field " + escapeAttr(extraClass || "") + "\">",
      "<label for=\"" + escapeAttr(path) + "\">" + escapeHtml(label) + "</label>",
      "<input id=\"" + escapeAttr(path) + "\" type=\"text\" value=\"" + escapeAttr(value) + "\" data-field=\"" + escapeAttr(path) + "\">",
      "</div>",
    ].join("");
  }

  function selectField(label, path, options, value) {
    return [
      "<div class=\"field\">",
      "<label for=\"" + escapeAttr(path) + "\">" + escapeHtml(label) + "</label>",
      "<select id=\"" + escapeAttr(path) + "\" data-field=\"" + escapeAttr(path) + "\">",
      optionList(options, value),
      "</select>",
      "</div>",
    ].join("");
  }

  function textareaField(label, path, value, extraClass, help) {
    return [
      "<div class=\"field " + escapeAttr(extraClass || "") + "\">",
      "<label for=\"" + escapeAttr(path) + "\">" + escapeHtml(label) + "</label>",
      "<textarea id=\"" + escapeAttr(path) + "\" data-field=\"" + escapeAttr(path) + "\">" + escapeHtml(value) + "</textarea>",
      help ? "<small>" + escapeHtml(help) + "</small>" : "",
      "</div>",
    ].join("");
  }

  function renderViewportField(selected) {
    return [
      "<fieldset class=\"field field--wide checkbox-row\">",
      "<legend>Viewport coverage</legend>",
      viewportOptions.map(function (viewport) {
        return [
          "<label class=\"checkbox-pill\">",
          "<input type=\"checkbox\" value=\"" + escapeAttr(viewport) + "\" data-viewport=\"" + escapeAttr(viewport) + "\"" + (selected.indexOf(viewport) !== -1 ? " checked" : "") + ">",
          escapeHtml(labelize(viewport)),
          "</label>",
        ].join("");
      }).join(""),
      "</fieldset>",
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

  function mcpAdvice(key, status) {
    if (status === "required") return "Prepare auth and verify access before assigning implementation work.";
    if (status === "optional") return "Use when available; prompt should include a manual fallback.";
    if (status === "unavailable") return "Keep the task manual and mention the missing integration as a risk.";
    return key === "browser" ? "Manual screenshot review only; no runtime interaction expected." : "Not needed for the current site scope.";
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

  function renderGraphLanes(graph) {
    var lanes = [
      ["intake", "Intake", ["workspace", "site-profile"]],
      ["audit", "Audit", ["audit-category"]],
      ["mcp", "MCP", ["mcp-readiness"]],
      ["tasks", "Tasks", ["refactor-task"]],
      ["prompts", "Prompts", ["prompt-template"]],
      ["handoff", "Handoff", ["handoff-report", "handoff-bundle", "target-repo"]],
    ];
    return [
      "<div class=\"graph-lanes\" aria-label=\"Workflow graph lanes\">",
      lanes.map(function (lane) {
        var nodes = graph.nodes.filter(function (node) {
          return lane[2].indexOf(node.type) !== -1;
        });
        return [
          "<section class=\"graph-lane\" aria-label=\"" + escapeAttr(lane[1]) + " nodes\">",
          "<div class=\"graph-lane__header\">",
          "<strong>" + escapeHtml(lane[1]) + "</strong>",
          "<span>" + nodes.length + "</span>",
          "</div>",
          "<ol>",
          nodes.map(renderGraphNode).join(""),
          "</ol>",
          "</section>",
        ].join("");
      }).join(""),
      "</div>",
    ].join("");
  }

  function renderGraphNode(node) {
    return [
      "<li class=\"graph-node graph-node--" + escapeAttr(node.type) + "\">",
      "<div class=\"graph-node__top\">",
      "<span class=\"graph-node__id\">" + escapeHtml(node.id) + "</span>",
      badge(node.status),
      "</div>",
      "<strong>" + escapeHtml(node.label) + "</strong>",
      renderGraphNodeMeta(node),
      "</li>",
    ].join("");
  }

  function renderGraphNodeMeta(node) {
    if (node.type === "audit-category") {
      return "<small>" + escapeHtml(node.data.findingCount + " finding(s)") + "</small>";
    }
    if (node.type === "mcp-readiness") {
      return "<small>" + escapeHtml(node.data.requestedStatus + " / " + node.data.state) + "</small>";
    }
    if (node.type === "refactor-task") {
      return "<small>" + escapeHtml(node.data.priority + " · " + node.data.category) + "</small>";
    }
    if (node.type === "prompt-template") {
      return "<small>" + escapeHtml(node.data.agent + " · " + node.data.output) + "</small>";
    }
    if (node.type === "target-repo") {
      return "<small>" + escapeHtml(node.data.repoUrl || node.data.localPath || "external repo boundary") + "</small>";
    }
    return "<small>" + escapeHtml(node.type) + "</small>";
  }

  function renderTaskRow(task) {
    var category = categoryById(task.category);
    return [
      "<article class=\"task-row\">",
      "<div>",
      "<h4>" + escapeHtml(task.title) + "</h4>",
      "<p>" + escapeHtml(task.problem) + "</p>",
      "<div class=\"task-meta\">",
      pill(task.priority, ""),
      pill(task.impact, "Impact"),
      pill(task.effort, "Effort"),
      "<span class=\"pill\">" + escapeHtml(category.label) + "</span>",
      task.pages.length ? "<span class=\"pill\">" + escapeHtml(task.pages.join(", ")) + "</span>" : "",
      "</div>",
      task.evidence ? "<p style=\"margin-top: 8px;\"><strong>Evidence:</strong> " + escapeHtml(task.evidence) + "</p>" : "",
      "<details style=\"margin-top: 8px;\"><summary>Codex prompt and verification</summary><p>" + escapeHtml(task.codexPrompt) + "</p><ul>" + task.verification.map(function (item) { return "<li>" + escapeHtml(item) + "</li>"; }).join("") + "</ul></details>",
      "</div>",
      "<div class=\"task-actions\">",
      "<button type=\"button\" class=\"button\" data-action=\"copy-task\" data-task=\"" + escapeAttr(task.id) + "\">Copy prompt</button>",
      "<button type=\"button\" class=\"button button--danger\" data-action=\"remove-task\" data-task=\"" + escapeAttr(task.id) + "\">Remove</button>",
      "</div>",
      "</article>",
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
      "<textarea class=\"output-box\" readonly data-output=\"prompt\">" + escapeHtml(promptText) + "</textarea>",
      "</div>",
      "</div>",
    ].join(""));
  }

  function renderReport() {
    var report = buildHandoffReport();
    var evidence = appState.workspace.implementationEvidence;
    return [
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

  function renderRunbookMetadata(runbook) {
    var sourceBundle = runbook.sourceBundle || {};
    var gateRequired = runbook.sourceBundle && sourceBundleNeedsRevalidation(runbook.sourceBundle);
    return [
      "<div class=\"graph-boundaries\" aria-label=\"Operator runbook metadata\">",
      "<span class=\"pill\">Source: " + escapeHtml(runbook.source || "bundle-handoff") + "</span>",
      "<span class=\"pill\">Task: " + escapeHtml(runbook.effectiveTaskId || "not specified") + "</span>",
      "<span class=\"pill\">Strict command: " + escapeHtml(runbook.effectiveStrictTaskCommandKey || "not specified") + "</span>",
      "<span class=\"pill\">Command stages: " + escapeHtml(String(runbook.commandStageCount || 0)) + "</span>",
      "<span class=\"pill\">Manual stages: " + escapeHtml(String(runbook.manualStageCount || 0)) + "</span>",
      "<span class=\"pill\">Read-only: " + escapeHtml(String(runbook.readOnlyCommandStageCount || 0)) + "</span>",
      "<span class=\"pill\">Local output: " + escapeHtml(String(runbook.localOutputCommandStageCount || 0)) + "</span>",
      sourceBundle.status ? "<span class=\"pill\">Bundle: " + escapeHtml(sourceBundle.status + "/" + (sourceBundle.valid ? "valid" : "invalid")) + "</span>" : "",
      runbook.sourceBundle ? "<span class=\"badge badge--" + escapeAttr(gateRequired ? "warn" : "pass") + "\">Gate: " + escapeHtml(gateRequired ? "required" : "not required") + "</span>" : "",
      sourceBundle.checksumBundleDigest ? "<span class=\"pill\">Digest: " + escapeHtml(shortDisplay(sourceBundle.checksumBundleDigest, 12)) + "</span>" : "",
      sourceBundle.expectedGeneratedFiles ? "<span class=\"pill\">Generated: " + escapeHtml(String(sourceBundle.verifiedGeneratedFiles || 0) + "/" + String(sourceBundle.expectedGeneratedFiles)) + "</span>" : "",
      "</div>",
    ].filter(Boolean).join("");
  }

  function renderRunbookSourceBundleDetails(runbook) {
    var sourceBundle = runbook.sourceBundle;
    if (!sourceBundle) return "";
    var checkCommand = sourceBundle.strictCheckCommand || "";
    var handoffCommand = sourceBundle.strictHandoffCommand || "";
    return [
      "<div class=\"runbook-source-bundle\" aria-label=\"Source bundle provenance\">",
      "<div class=\"runbook-source-bundle__header\"><div><strong>Source Bundle</strong><span>" + escapeHtml(sourceBundle.directory || "No source directory recorded") + "</span></div><div class=\"runbook-line-actions\"><button type=\"button\" class=\"button row-copy-button\" data-action=\"copy-runbook-source-bundle\">Copy bundle</button><button type=\"button\" class=\"button row-copy-button\" data-action=\"download-runbook-source-bundle\">Export bundle</button><button type=\"button\" class=\"button row-copy-button\" data-action=\"copy-runbook-source-bundle-json\">Copy JSON</button><button type=\"button\" class=\"button row-copy-button\" data-action=\"download-runbook-source-bundle-json\">Export JSON</button></div></div>",
      "<div class=\"table-wrap\">",
      "<table>",
      "<caption class=\"sr-only\">Source bundle provenance details</caption>",
      "<tbody>",
      sourceBundleCopyRow("Source", runbook.source || "source-bundle-provenance", "copy-runbook-source-marker"),
      sourceBundleRow("Status", (sourceBundle.status || "unknown") + "/" + (sourceBundle.valid ? "valid" : "invalid")),
      sourceBundleRow("Workspace", sourceBundle.workspaceStatus || "not recorded"),
      sourceBundleRow("MCP", [sourceBundle.mcpStatus, sourceBundle.mcpProbeStatus].filter(Boolean).join(" / ") || "not recorded"),
      sourceBundleRow("Checksum", sourceBundle.checksumBundleDigest || "not recorded"),
      sourceBundleRow("Checksum files", String(sourceBundle.verifiedChecksumFiles || 0) + "/" + String(sourceBundle.expectedChecksumFiles || 0)),
      sourceBundleRow("Generated files", String(sourceBundle.verifiedGeneratedFiles || 0) + "/" + String(sourceBundle.expectedGeneratedFiles || 0)),
      sourceBundleRow("Diagnostics", String(sourceBundle.failureCount || 0) + " failures, " + String(sourceBundle.warningCount || 0) + " warnings, " + String(sourceBundle.issueCount || 0) + " issues"),
      sourceBundleRevalidationRow(sourceBundle),
      sourceBundleCommandRow("Strict check command", checkCommand, "copy-runbook-source-check-command"),
      sourceBundleCommandRow("Strict handoff command", handoffCommand, "copy-runbook-source-handoff-command"),
      "</tbody>",
      "</table>",
      "</div>",
      "</div>",
    ].join("");
  }

  function sourceBundleRow(label, value) {
    return [
      "<tr>",
      "<th scope=\"row\">" + escapeHtml(label) + "</th>",
      "<td>" + escapeHtml(value || "not recorded") + "</td>",
      "</tr>",
    ].join("");
  }

  function sourceBundleCopyRow(label, value, action) {
    return [
      "<tr>",
      "<th scope=\"row\">" + escapeHtml(label) + "</th>",
      "<td class=\"runbook-line-cell\">",
      "<code>" + escapeHtml(value || "not recorded") + "</code>",
      "<div class=\"runbook-line-actions\"><button type=\"button\" class=\"button row-copy-button\" data-action=\"" + escapeAttr(action) + "\">Copy source</button></div>",
      "</td>",
      "</tr>",
    ].join("");
  }

  function sourceBundleCommandRow(label, command, action) {
    return [
      "<tr>",
      "<th scope=\"row\">" + escapeHtml(label) + "</th>",
      "<td class=\"runbook-line-cell\">",
      command ? "<code>" + escapeHtml(command) + "</code><div class=\"runbook-line-actions\"><button type=\"button\" class=\"button row-copy-button\" data-action=\"" + escapeAttr(action) + "\">Copy command</button></div>" : "<span class=\"muted\">not recorded</span>",
      "</td>",
      "</tr>",
    ].join("");
  }

  function sourceBundleRevalidationRow(sourceBundle) {
    var required = sourceBundleNeedsRevalidation(sourceBundle);
    var label = required ? "required" : "not required";
    var tone = required ? "warn" : "pass";
    return [
      "<tr>",
      "<th scope=\"row\">Revalidation gate</th>",
      "<td class=\"runbook-line-cell\">",
      "<span class=\"badge badge--" + escapeAttr(tone) + "\">" + escapeHtml(label) + "</span>",
      "<span class=\"runbook-revalidation-detail\">" + escapeHtml(formatSourceBundleRevalidationSummary(sourceBundle)) + "</span>",
      "<div class=\"runbook-line-actions\"><button type=\"button\" class=\"button row-copy-button\" data-action=\"copy-runbook-source-revalidation-gate\">Copy gate</button><button type=\"button\" class=\"button row-copy-button\" data-action=\"download-runbook-source-revalidation-gate\">Export gate</button></div>",
      "</td>",
      "</tr>",
    ].join("");
  }

  function renderRunbookSourceBundleWarning(runbook) {
    var sourceBundle = runbook.sourceBundle;
    if (!sourceBundle) return "";
    var failureCount = Number(sourceBundle.failureCount || 0);
    if (!sourceBundleNeedsRevalidation(sourceBundle)) return "";
    return [
      "<div class=\"runbook-source-bundle-warning\" role=\"alert\">",
      "<strong>Source bundle needs revalidation</strong>",
      "<span>Status is " + escapeHtml((sourceBundle.status || "unknown") + "/" + (sourceBundle.valid ? "valid" : "invalid")) + " with " + escapeHtml(String(failureCount)) + " failures. Run the strict bundle check before target-repo execution.</span>",
      sourceBundle.strictCheckCommand ? "<code>" + escapeHtml(sourceBundle.strictCheckCommand) + "</code>" : "",
      "</div>",
    ].filter(Boolean).join("");
  }

  function renderRunbookProvenanceOnlyNotice(runbook, rows) {
    if (rows.length || !runbook.sourceBundle) return "";
    var message = runbook.source === "source-bundle-revalidation-gate"
      ? "This gate-only import contains source-bundle identity, diagnostics, and guard commands only. Import a full bundle handoff JSON when you need stage rows for target-repo execution."
      : "This import contains source-bundle identity, diagnostics, and guard commands only. Import a full bundle handoff JSON when you need stage rows for target-repo execution.";
    return [
      "<div class=\"runbook-provenance-only\" role=\"status\">",
      "<strong>Provenance-only review</strong>",
      "<span>Source: <code>" + escapeHtml(runbook.source || "source-bundle-provenance") + "</code></span>",
      "<span>" + escapeHtml(message) + "</span>",
      "</div>",
    ].join("");
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

  function renderRunbookFilterButton(type, value, count, selected) {
    var label = value === "all" ? "All" : labelize(value);
    return [
      "<button type=\"button\" class=\"filter-chip\" data-runbook-filter-type=\"" + escapeAttr(type) + "\" data-runbook-filter-value=\"" + escapeAttr(value) + "\" aria-pressed=\"" + (selected ? "true" : "false") + "\">",
      "<span>" + escapeHtml(label) + "</span>",
      "<strong>" + escapeHtml(String(count)) + "</strong>",
      "</button>",
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

  function renderRunbookRows(rows, totalRows) {
    if (!rows.length) {
      return totalRows
        ? "<div class=\"empty-state\">No operator runbook rows match the selected filters.</div>"
        : "<div class=\"empty-state\">The imported runbook did not include display-ready rows.</div>";
    }
    return [
      "<div class=\"table-wrap\">",
      "<table>",
      "<caption class=\"sr-only\">Filtered operator runbook stages</caption>",
      "<thead><tr><th>Stage</th><th>Action</th><th>Evidence</th><th>Copy-ready line</th></tr></thead>",
      "<tbody>",
      rows.map(function (row) {
        return [
          "<tr>",
          "<td><strong>" + escapeHtml(row.step + ". " + row.label) + "</strong><br><code>" + escapeHtml(row.key) + "</code></td>",
          "<td>" + badge(row.actionStatus || "planned") + "<br><small>" + escapeHtml(row.actionLabel || row.actionType) + "</small></td>",
          "<td>" + badge(row.evidenceProgressStatus || "planned") + "<br><small>" + escapeHtml(row.evidenceProgressLabel || "No progress") + "</small></td>",
          "<td class=\"runbook-line-cell\"><small>" + escapeHtml(row.line) + "</small><div class=\"runbook-line-actions\"><button type=\"button\" class=\"button row-copy-button\" data-action=\"copy-runbook-row-markdown\" data-runbook-row-key=\"" + escapeAttr(row.key) + "\">Copy row</button><button type=\"button\" class=\"button row-copy-button\" data-action=\"download-runbook-row-markdown\" data-runbook-row-key=\"" + escapeAttr(row.key) + "\">Export row</button><button type=\"button\" class=\"button row-copy-button\" data-action=\"copy-runbook-row-line\" data-runbook-row-key=\"" + escapeAttr(row.key) + "\">Copy line</button></div></td>",
          "</tr>",
        ].join("");
      }).join(""),
      "</tbody>",
      "</table>",
      "</div>",
    ].join("");
  }

  function syncReportPreview() {
    var output = document.querySelector("[data-output='report']");
    if (output) {
      output.textContent = buildHandoffReport();
    }
  }

  function panel(title, subtitle, body) {
    return [
      "<section class=\"panel\">",
      "<div class=\"panel__header\"><div><h3>" + escapeHtml(title) + "</h3><p>" + escapeHtml(subtitle) + "</p></div></div>",
      "<div class=\"panel__body\">",
      body,
      "</div>",
      "</section>",
    ].join("");
  }

  function setByPath(root, path, value) {
    var parts = path.split(".");
    var target = root;
    for (var i = 0; i < parts.length - 1; i += 1) {
      target = target[parts[i]];
    }
    var key = parts[parts.length - 1];
    if (
      path === "siteProfile.pages" ||
      path === "siteProfile.userFlows" ||
      path === "implementationEvidence.executedWork" ||
      path === "implementationEvidence.verificationResults" ||
      path === "implementationEvidence.remainingRisks" ||
      path === "implementationEvidence.nextActions"
    ) {
      target[key] = textToLines(value);
    } else {
      target[key] = value;
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

  function recommendedMcpForCategory(categoryId) {
    var map = {
      "visual-design": ["browser", "figma"],
      "ux-flow": ["browser", "github"],
      responsive: ["browser", "chromeDevtools"],
      accessibility: ["browser", "chromeDevtools"],
      performance: ["chromeDevtools", "deploy"],
      seo: ["browser", "deploy"],
      "technical-quality": ["github"],
      "runtime-issues": ["browser", "chromeDevtools", "sentry"],
      "content-quality": ["figma", "research", "cms"],
    };
    return map[categoryId] || ["github"];
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

  function markdownList(items, fallback) {
    var normalized = normalizeStringArray(items, []);
    if (normalized.length === 0) return "- " + fallback;
    return normalized.map(function (item) { return "- " + item; }).join("\n");
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

  function taskBlock(task) {
    if (!task) return "No refactor task selected. Use the Refactor Plan section first.";
    return [
      "Selected task:",
      "- Title: " + task.title,
      "- Category: " + categoryById(task.category).label,
      "- Problem: " + task.problem,
      "- Evidence: " + (task.evidence || "not provided"),
      "- Impact: " + task.impact,
      "- Effort: " + task.effort,
      "- Priority: " + task.priority,
      "- Pages: " + (task.pages.join(", ") || "not specified"),
      "- Recommended MCP: " + (task.recommendedMcp.join(", ") || "none"),
      "",
      "Verification:",
      markdownList(task.verification, "Run target repo verification"),
      "",
      "Risks:",
      markdownList(task.risks, "No risks listed"),
    ].join("\n");
  }

  function primaryTask() {
    var tasks = appState.workspace.refactorTasks.slice();
    var rank = { p0: 0, p1: 1, p2: 2, p3: 3 };
    tasks.sort(function (a, b) {
      return rank[a.priority] - rank[b.priority];
    });
    return tasks[0] || null;
  }

  function orderedTasks(workspace) {
    var rank = { p0: 0, p1: 1, p2: 2, p3: 3 };
    return workspace.refactorTasks.slice().sort(function (a, b) {
      var priority = rank[a.priority] - rank[b.priority];
      if (priority !== 0) return priority;
      return a.title.localeCompare(b.title);
    });
  }

  function cloneWorkspace(workspace) {
    return normalizeWorkspace(JSON.parse(JSON.stringify(workspace)));
  }

  function workflowTasks(workspace) {
    var graphWorkspace = cloneWorkspace(workspace);
    var existingIds = new Set(graphWorkspace.refactorTasks.map(function (task) { return task.id; }));
    var existingCategories = new Set(graphWorkspace.refactorTasks.map(function (task) { return task.category; }));
    var created = [];
    auditCategories.forEach(function (category) {
      if (existingCategories.has(category.id)) return;
      var row = graphWorkspace.auditChecklist[category.id];
      if (!row || row.findings.length === 0) return;
      var id = "task-" + category.id;
      if (existingIds.has(id)) return;
      var task = taskFromCategoryForWorkspace(graphWorkspace, category, row.findings[0]);
      graphWorkspace.refactorTasks.push(task);
      created.push(task);
      existingIds.add(id);
      existingCategories.add(category.id);
    });
    return {
      workspace: graphWorkspace,
      tasks: orderedTasks(graphWorkspace),
      created: created,
    };
  }

  function taskFromCategoryForWorkspace(workspace, category, finding) {
    var priority = category.id === "accessibility" || category.id === "runtime-issues" ? "p0" : "p1";
    var impact = priority === "p0" ? "high" : "medium";
    return {
      id: "task-" + category.id,
      title: "Resolve " + category.label + " finding",
      category: category.id,
      problem: finding,
      evidence: "Audit finding captured in the Website Improvement Console.",
      impact: impact,
      effort: "medium",
      priority: priority,
      pages: workspace.siteProfile.pages.slice(0, 3),
      recommendedMcp: recommendedMcpForCategory(category.id),
      codexPrompt: buildCodexTaskPromptForWorkspace(workspace, category.id, finding),
      verification: category.defaultVerification.concat(["Run target repo lint/typecheck/build when available"]),
      risks: ["Target repo architecture may constrain the fix", "Manual stakeholder review may be needed before changing copy or brand language"],
    };
  }

  function buildCodexTaskPromptForWorkspace(workspace, categoryId, finding) {
    return [
      "You are working in the target website repo, not in design-ai.",
      "Site: " + workspace.siteProfile.name,
      "Live URL: " + workspace.siteProfile.liveUrl,
      "Category: " + categoryById(categoryId).label,
      "Problem: " + finding,
      "",
      "Inspect the target repo first. Reuse existing architecture, UI components, state patterns, styling conventions, and design tokens. Do not add dependencies unless the existing codebase clearly requires them.",
      "",
      "Implement the smallest safe improvement, then verify desktop/tablet/mobile behavior, keyboard focus, screen-reader semantics where relevant, and the target repo's lint/typecheck/build commands.",
    ].join("\n");
  }

  function combineStatus(left, right) {
    if (left === "fail" || right === "fail") return "fail";
    if (left === "warn" || right === "warn") return "warn";
    return "pass";
  }

  function workflowNode(id, type, label, status, data) {
    return {
      id: id,
      type: type,
      label: label,
      status: status,
      data: data || {},
    };
  }

  function workflowEdge(from, to, type, label) {
    return {
      id: from + "->" + to + ":" + type,
      from: from,
      to: to,
      type: type,
      label: label,
    };
  }

  function profileNodeId(profile) {
    return "profile:" + (profile.id || "site");
  }

  function workspaceStatus(workspace) {
    var hasProfile = Boolean(workspace.siteProfile.name && workspace.siteProfile.liveUrl);
    var blocked = auditCategories.some(function (category) {
      return workspace.auditChecklist[category.id].status === "blocked";
    });
    if (!hasProfile) return "fail";
    return blocked ? "warn" : "pass";
  }

  function mcpState(key, status, profile) {
    if (status === "unused") return "not-needed";
    if (status === "unavailable") return "missing";
    if (key === "github") return profile.repoUrl || profile.localPath ? "ready" : "needs-evidence";
    if (key === "figma") return profile.figmaUrl ? "ready" : "needs-evidence";
    if (key === "deploy") return profile.deployProvider !== "none" ? "ready" : "needs-evidence";
    if (key === "sentry") return profile.sentryProject ? "ready" : "needs-evidence";
    return "declared";
  }

  function mcpLevel(requestedStatus, state) {
    if (requestedStatus === "unavailable") return "fail";
    if (requestedStatus === "required" && state === "needs-evidence") return "warn";
    return "pass";
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
      nodes.push(workflowNode(promptId, "prompt-template", template[1], "ready", {
        id: template[0],
        agent: template[0].indexOf("claude") === 0 ? "Claude" : "Codex",
        output: template[0] === "handoff-report" ? "report" : "prompt",
        description: template[1],
        taskSelectable: template[0] === "codex-implementation",
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

    var map = {
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

  function formatEmptyRunbookRowsMessage(settings, provenanceOnly, source) {
    if (settings.filtered) return "No operator runbook rows match the selected filters.";
    if (provenanceOnly) return "This provenance-only artifact (source: " + (source || "source-bundle-provenance") + ") contains source-bundle identity, diagnostics, and guard commands only. Import a full bundle handoff JSON when target-repo execution stage rows are required.";
    return "No display-ready rows included.";
  }

  function buildSourceBundleMarkdown(sourceBundle, source) {
    if (!sourceBundle) return "No source bundle provenance recorded.";
    return [
      "# Website improvement source bundle provenance",
      "",
      sourceBundleMarkdownRow("Source", source || "source-bundle-provenance"),
      sourceBundleMarkdownRow("Directory", sourceBundle.directory),
      sourceBundleMarkdownRow("Source workspace", sourceBundle.sourceWorkspace),
      sourceBundleMarkdownRow("Site name", sourceBundle.siteName),
      sourceBundleMarkdownRow("Status", (sourceBundle.status || "unknown") + "/" + (sourceBundle.valid ? "valid" : "invalid")),
      sourceBundleMarkdownRow("Workspace status", sourceBundle.workspaceStatus),
      sourceBundleMarkdownRow("MCP status", sourceBundle.mcpStatus),
      sourceBundleMarkdownRow("MCP probe status", sourceBundle.mcpProbeStatus),
      sourceBundleMarkdownRow("Checksum algorithm", sourceBundle.checksumAlgorithm),
      sourceBundleMarkdownRow("Checksum bundle digest", sourceBundle.checksumBundleDigest),
      sourceBundleMarkdownRow("Checksum files", String(sourceBundle.verifiedChecksumFiles || 0) + "/" + String(sourceBundle.expectedChecksumFiles || 0)),
      sourceBundleMarkdownRow("Generated files", String(sourceBundle.verifiedGeneratedFiles || 0) + "/" + String(sourceBundle.expectedGeneratedFiles || 0)),
      sourceBundleMarkdownRow("Diagnostics", String(sourceBundle.failureCount || 0) + " failures, " + String(sourceBundle.warningCount || 0) + " warnings, " + String(sourceBundle.issueCount || 0) + " issues"),
      sourceBundleMarkdownRow("Strict bundle check command", sourceBundle.strictCheckCommand),
      sourceBundleMarkdownRow("Strict bundle handoff command", sourceBundle.strictHandoffCommand),
      sourceBundleMarkdownRow("Revalidation gate", formatSourceBundleRevalidationMarkdown(sourceBundle)),
    ].join("\n");
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

  function sourceBundleMarkdownRow(label, value) {
    return "- " + label + ": " + (value || "not recorded");
  }

  function buildOperatorRunbookRowMarkdown(row) {
    return [
      "### " + row.step + ". " + row.label,
      "",
      "- Key: `" + row.key + "`",
      "- Action: " + (row.actionStatusLabel || row.actionStatus || "unknown") + " / " + (row.actionLabel || row.actionType || "unknown"),
      "- Evidence: " + (row.evidenceProgressStatusLabel || row.evidenceProgressStatus || "unknown") + " / " + (row.evidenceProgressLabel || "No progress"),
      row.firstUncheckedEvidenceItemLabel ? "- Next evidence item: " + row.firstUncheckedEvidenceItemLabel : "",
      "",
      row.line,
    ].filter(Boolean).join("\n");
  }

  function formatSourceBundleMarkdownStatus(sourceBundle) {
    if (!sourceBundle) return "not provided";
    var status = (sourceBundle.status || "unknown") + "/" + (sourceBundle.valid ? "valid" : "invalid");
    var digest = sourceBundle.checksumBundleDigest ? "; digest " + sourceBundle.checksumBundleDigest : "";
    var directory = sourceBundle.directory ? "; directory " + sourceBundle.directory : "";
    return status + digest + directory;
  }

  function formatSourceBundleMarkdownCommand(sourceBundle, key) {
    if (!sourceBundle || !sourceBundle[key]) return "not provided";
    return sourceBundle[key];
  }

  function sourceBundleNeedsRevalidation(sourceBundle) {
    if (!sourceBundle) return false;
    return sourceBundle.valid !== true || Number(sourceBundle.failureCount || 0) > 0;
  }

  function formatSourceBundleRevalidationMarkdown(sourceBundle) {
    if (!sourceBundle) return "not provided";
    if (!sourceBundleNeedsRevalidation(sourceBundle)) return "not required";
    var failureCount = Number(sourceBundle.failureCount || 0);
    var status = (sourceBundle.status || "unknown") + "/" + (sourceBundle.valid ? "valid" : "invalid");
    var command = sourceBundle.strictCheckCommand ? "; run " + sourceBundle.strictCheckCommand : "";
    return "required; status " + status + "; failures " + String(failureCount) + command;
  }

  function formatSourceBundleRevalidationSummary(sourceBundle) {
    if (!sourceBundle) return "not provided";
    if (!sourceBundleNeedsRevalidation(sourceBundle)) return "not required";
    return sourceBundle.strictCheckCommand
      ? "required - run strict check before target-repo execution"
      : "required - strict check command not recorded";
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

  function shortDisplay(value, maxLength) {
    var text = String(value || "");
    var limit = Number(maxLength || 12);
    if (text.length <= limit) return text;
    return text.slice(0, limit) + "...";
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

  function safeFileSegment(value) {
    return String(value || "row")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "row";
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
    if (action === "export-workspace") {
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
        var parsed = JSON.parse(String(reader.result || ""));
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
        appState.workspace = normalizeWorkspace(parsed);
        appState.runbookActionFilter = "all";
        appState.runbookEvidenceFilter = "all";
        saveWorkspace();
        setMessage("Workspace JSON imported.");
      } catch (error) {
        setMessage("Import failed. Use a valid Website Improvement workspace JSON file.");
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
}());
