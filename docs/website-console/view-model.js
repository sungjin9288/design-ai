/**
 * Website Console view model: option catalogs and the pure derivation and
 * markup helpers that depend only on their arguments.
 *
 * Extracted from app.js so the console shell keeps DOM wiring, storage, and
 * mutable app state while these stay independently readable and testable.
 * Load after source-bundle.js and before app.js.
 */
(function (global) {
  "use strict";

  var sourceBundleApi = global.DesignAiWebsiteConsoleSourceBundle;
  var viewModelSourceNames = [
    "buildImportedArtifactJson",
    "normalizeRunbookSourceBundle",
    "sourceBundleNeedsRevalidation",
  ];
  if (!sourceBundleApi || !viewModelSourceNames.every(function (name) {
    return typeof sourceBundleApi[name] === "function";
  })) {
    // Leave the global undefined and return. app.js owns the single visible
    // failure path for a partial console bundle; throwing here would bypass it.
    return;
  }
  var buildImportedArtifactJson = sourceBundleApi.buildImportedArtifactJson;
  var normalizeRunbookSourceBundle = sourceBundleApi.normalizeRunbookSourceBundle;
  var sourceBundleNeedsRevalidation = sourceBundleApi.sourceBundleNeedsRevalidation;

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
    ["start", "Start"],
    ["quality", "Quality Review"],
    ["profile", "Site Profile"],
    ["audit", "Audit Checklist"],
    ["mcp", "MCP Matrix"],
    ["graph", "Workflow Graph"],
    ["tasks", "Refactor Plan"],
    ["prompts", "Prompt Generator"],
    ["report", "Handoff Report"],
  ];

  var templates = [
    ["implementation-plan", "Implementation plan"],
    ["critique-loop", "Critique loop"],
    ["design-contract", "Agent-readable DESIGN.md"],
    ["codex-repo-intake", "Codex repo intake"],
    ["codex-implementation", "Codex implementation"],
    ["codex-visual-qa", "Codex visual QA"],
    ["codex-deployment", "Codex deployment verification"],
    ["claude-design-review", "Claude design review"],
    ["claude-competitor", "Claude competitor research"],
    ["claude-copy-ux", "Claude copy/UX critique"],
    ["handoff-report", "Final handoff report"],
  ];

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
      linkedPreview: null,
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
      linkedPreview: normalizeLinkedPreview(source.linkedPreview),
      reportNotes: String(source.reportNotes || ""),
    };
    if (workspace.siteProfile.viewports.length === 0) {
      workspace.siteProfile.viewports = ["desktop"];
    }
    return workspace;
  }

  function normalizeLinkedPreview(value) {
    if (!value || typeof value !== "object" || value.kind !== "website-improvement-linked-preview") return null;
    var linkedCode = value.linkedCode && typeof value.linkedCode === "object" ? value.linkedCode : {};
    var preview = value.preview && typeof value.preview === "object" ? value.preview : {};
    var commands = value.commands && typeof value.commands === "object" ? value.commands : {};
    var source = value.source && typeof value.source === "object" ? value.source : {};
    return {
      kind: "website-improvement-linked-preview",
      version: 1,
      status: ["pass", "warn", "fail"].indexOf(value.status) === -1 ? "fail" : value.status,
      source: {
        workspace: String(source.workspace || ""),
        siteId: String(source.siteId || ""),
        siteName: String(source.siteName || ""),
      },
      linkedCode: {
        configuredPath: String(linkedCode.configuredPath || ""),
        resolvedPath: String(linkedCode.resolvedPath || ""),
        packageManager: String(linkedCode.packageManager || ""),
        framework: String(linkedCode.framework || "Unknown"),
        startScript: String(linkedCode.startScript || ""),
        startCommand: String(linkedCode.startCommand || ""),
      },
      preview: {
        url: String(preview.url || ""),
        processStatus: String(preview.processStatus || "not-started"),
        probeStatus: String(preview.probeStatus || "not-run"),
        verificationStatus: String(preview.verificationStatus || "not-recorded"),
      },
      stages: Array.isArray(value.stages) ? value.stages.map(function (stage) {
        return {
          id: String(stage && stage.id || ""),
          label: String(stage && stage.label || ""),
          status: String(stage && stage.status || "blocked"),
          command: String(stage && stage.command || ""),
        };
      }).filter(function (stage) { return stage.id && stage.label; }) : [],
      commands: {
        refresh: String(commands.refresh || ""),
        start: String(commands.start || ""),
      },
      boundaries: value.boundaries && typeof value.boundaries === "object" ? value.boundaries : {},
      issues: Array.isArray(value.issues) ? value.issues.map(function (issue) {
        return {
          level: String(issue && issue.level || "warn"),
          id: String(issue && issue.id || ""),
          message: String(issue && issue.message || ""),
        };
      }).filter(function (issue) { return issue.id; }) : [],
    };
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
        id: String(item.id || "task-" + (index + 1)),
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

  function importedArtifact(value, rawJson) {
    return { value: value, rawJson: buildImportedArtifactJson(value, rawJson) };
  }

  function isWorkspacePayload(value) {
    return Boolean(value)
      && typeof value === "object"
      && !Array.isArray(value)
      && value.version === 1
      && value.siteProfile
      && typeof value.siteProfile === "object";
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

  function renderStartReferences(references) {
    if (!references.length) return "<div class=\"empty-state empty-state--compact\">No repository, URL, or screenshot was declared.</div>";
    return "<ul class=\"start-list\">" + references.map(function (item) {
      return "<li><strong>" + escapeHtml(item.kind || "reference") + ":</strong> <code>" + escapeHtml(item.reference || "") + "</code><span class=\"pill\">" + escapeHtml(item.status || "declared-not-read") + "</span></li>";
    }).join("") + "</ul>";
  }

  function renderStartList(items, emptyMessage) {
    if (!items.length) return "<div class=\"empty-state empty-state--compact\">" + escapeHtml(emptyMessage) + "</div>";
    return "<ul class=\"start-list\">" + items.map(function (item) {
      return "<li>" + escapeHtml(item) + "</li>";
    }).join("") + "</ul>";
  }

  function qualityStatusBadge(status) {
    var tone = status;
    if (["warning", "attention-required"].indexOf(status) !== -1) tone = "warn";
    else if (["complete", "evidence-complete", "pass", "contract-validated", "ready-for-scope-review", "improved"].indexOf(status) !== -1) tone = "pass";
    else if (["blocked", "regressed"].indexOf(status) !== -1) tone = "fail";
    else if (["prepared", "not-delivered", "not-run", "not-started", "pending", "unverified", "unchanged"].indexOf(status) !== -1) tone = "optional";
    return "<span class=\"badge badge--" + escapeAttr(tone || "optional") + "\">" + escapeHtml(labelize(status || "unknown")) + "</span>";
  }

  function renderReviewComparisonArtifact(comparison) {
    var sourceRows = [
      "Baseline: " + comparison.baseline.reference + " / " + comparison.baseline.sha256 + " / " + comparison.baseline.bytes + " bytes",
      "Candidate: " + comparison.candidate.reference + " / " + comparison.candidate.sha256 + " / " + comparison.candidate.bytes + " bytes",
    ];
    var transitions = comparison.lensTransitions.map(function (transition) {
      return transition.id + ": " + transition.before + " to " + transition.after + " (" + transition.change + ")";
    });
    var findingRows = ["resolved", "persistent", "introduced", "uncertain"].reduce(function (rows, category) {
      return rows.concat(comparison.findings[category].map(function (finding) {
        return category + ": " + finding.id + " / " + finding.lens;
      }));
    }, []);
    return panel("Verified Design Iteration", "Exact before-and-after reports are compared without turning missing evidence into improvement claims.", [
      "<div class=\"evidence-summary\" aria-label=\"Review comparison summary\">",
      metric("Status", comparison.status, comparison.summary.nextAction),
      metric("Resolved", comparison.summary.resolved, "Candidate lens passes"),
      metric("Persistent", comparison.summary.persistent, "Finding remains"),
      metric("Introduced", comparison.summary.introduced, "Candidate-only findings"),
      "</div>",
      "<div class=\"graph-boundaries\" aria-label=\"Review comparison boundary\">" + qualityStatusBadge(comparison.status) + "<span class=\"pill\">Read-only comparison</span><span class=\"pill\">" + escapeHtml(String(comparison.summary.uncertain)) + " uncertain</span><span class=\"pill\">No production-quality claim</span><span class=\"pill\">No adoption claim</span></div>",
      "<div class=\"grid-2 start-details\"><div><h4>Exact sources</h4>" + renderStartList(sourceRows, "No sources recorded.") + "<h4>Finding decisions</h4>" + renderStartList(findingRows, "No finding changes recorded.") + "</div><div><h4>Lens transitions</h4>" + renderStartList(transitions, "No lens transitions recorded.") + "<h4>Approval gates</h4>" + renderStartList(comparison.approval.requiredBefore, "No approval gates recorded.") + "</div></div>",
    ].join(""));
  }

  function renderPilotEvidence(evidence) {
    var precision = evidence.metrics.findingPrecision;
    var approvals = evidence.metrics.approvalFriction;
    var claims = ["real", "synthetic", "inferred", "unverified"].map(function (claimClass) {
      return labelize(claimClass) + ": " + evidence.claims[claimClass][0].statement;
    });
    return panel("Real Pilot Evidence", "One consented pilot is linked to the exact P6 review and P11 implementation evidence. Customer adoption, identity, feedback, and production quality are not upgraded by this record.", [
      "<div class=\"evidence-summary\" aria-label=\"Pilot evidence summary\">",
      metric("Status", evidence.status, evidence.project.pilotClass),
      metric("First useful artifact", evidence.metrics.timeToFirstUsefulArtifact.milliseconds + " ms", "Measured from recorded timestamps"),
      metric("Finding review", precision.accepted + " accepted", precision.rejected + " rejected / " + precision.unresolved + " unresolved"),
      metric("Approval gates", approvals.approved + " approved", approvals.pending + " pending"),
      "</div>",
      "<dl class=\"evidence-list\"><div><dt>Project</dt><dd>" + escapeHtml(evidence.project.name) + "</dd></div><div><dt>Repository</dt><dd><code>" + escapeHtml(evidence.project.repositoryUrl) + "</code></dd></div><div><dt>Consent</dt><dd>" + escapeHtml(evidence.consent.reference) + "</dd></div><div><dt>Implementation</dt><dd>" + escapeHtml(evidence.metrics.implementation.status) + "</dd></div></dl>",
      "<div class=\"grid-2 start-details\"><div><h4>Claim classes</h4>" + renderStartList(claims, "No claims recorded.") + "</div><div><h4>Unresolved risk</h4>" + renderStartList(evidence.metrics.unresolvedRisk.items.map(function (item) { return item.severity + ": " + item.summary; }), "No unresolved implementation risk recorded.") + "</div></div>",
      "<div class=\"graph-boundaries\" aria-label=\"Pilot evidence boundary\">" + qualityStatusBadge(evidence.status) + "<span class=\"pill\">Self-declared consent</span><span class=\"pill\">No identity proof</span><span class=\"pill\">No adoption claim</span><span class=\"pill\">No production-quality claim</span><span class=\"pill\">No writes</span></div>",
    ].join(""));
  }

  function renderImplementationScopeProposal(proposal) {
    var pendingGates = proposal.approvalGates.filter(function (gate) {
      return gate.status === "pending";
    }).map(function (gate) { return labelize(gate.id); });
    return panel("Implementation Scope Proposal", "The exact intake and request are linked. Application source and target files remain untouched until this proposal is approved separately.", [
      "<div class=\"evidence-summary\" aria-label=\"Implementation scope proposal summary\">",
      metric("Status", proposal.status, "Human approval required"),
      metric("Change selectors", proposal.scope.files.change.length, "Bounded target files"),
      metric("Verification", proposal.scope.verificationCommands.length, "Commands declared"),
      metric("Risks", proposal.scope.risks.length, "Recorded before implementation"),
      "</div>",
      "<dl class=\"evidence-list\"><div><dt>Objective</dt><dd>" + escapeHtml(proposal.scope.objective) + "</dd></div><div><dt>Target</dt><dd><code>" + escapeHtml(proposal.baseline.targetPath) + "</code></dd></div><div><dt>Branch and head</dt><dd><code>" + escapeHtml((proposal.baseline.branch || "detached") + " @ " + (proposal.baseline.head || "unknown")) + "</code></dd></div></dl>",
      "<div class=\"grid-2 start-details\"><div><h4>Approved-file candidates</h4>" + renderStartList(proposal.scope.files.change.concat(proposal.scope.files.generated), "No file selectors recorded.") + "</div><div><h4>Pending gates</h4>" + renderStartList(pendingGates, "No pending gates recorded.") + "</div></div>",
      "<div class=\"graph-boundaries\" aria-label=\"Implementation scope proposal boundary\"><span class=\"pill\">Read-only</span><span class=\"pill\">No source read</span><span class=\"pill\">No target mutation</span><span class=\"pill\">No network</span><span class=\"pill\">Implementation unauthorized</span></div>",
    ].join(""));
  }

  function renderImplementationEvidence(evidence) {
    var verification = evidence.verification.summary;
    var work = evidence.executedWork.map(function (item) {
      return item.path + " — " + item.summary;
    });
    var issues = evidence.issues.map(function (item) {
      return "[" + item.level + "] " + item.message;
    });
    return panel("Implementation Evidence", "The approved baseline was compared with local Git state and declared evidence files. This read-only review did not run commands or perform implementation or release actions.", [
      "<div class=\"evidence-summary\" aria-label=\"Implementation evidence summary\">",
      metric("Status", evidence.status, evidence.nextAction.status),
      metric("Changed files", evidence.observed.worktreeChanges.length, "Compared with approved baseline"),
      metric("Verification", verification.pass + " pass", verification.fail + " fail / " + verification.notRun + " not run"),
      metric("Issues", evidence.issues.length, "Missing proof remains visible"),
      "</div>",
      "<dl class=\"evidence-list\"><div><dt>Target</dt><dd><code>" + escapeHtml(evidence.observed.targetPath) + "</code></dd></div><div><dt>Branch and head</dt><dd><code>" + escapeHtml(evidence.observed.branch + " @ " + evidence.observed.head) + "</code></dd></div><div><dt>Next action</dt><dd>" + escapeHtml(evidence.nextAction.summary) + "</dd></div></dl>",
      "<div class=\"grid-2 start-details\"><div><h4>Executed work</h4>" + renderStartList(work, "No executed work recorded.") + "</div><div><h4>Evidence gaps</h4>" + renderStartList(issues, "No evidence gaps recorded.") + "</div></div>",
      "<div class=\"graph-boundaries\" aria-label=\"Implementation evidence boundary\">" + qualityStatusBadge(evidence.status) + "<span class=\"pill\">Read-only evidence</span><span class=\"pill\">No source read</span><span class=\"pill\">No command execution</span><span class=\"pill\">Commit pending</span><span class=\"pill\">Push pending</span><span class=\"pill\">Deployment pending</span></div>",
    ].join(""));
  }

  function renderImplementationScopeApproval(approval) {
    var files = approval.authorization.files.change.concat(approval.authorization.files.generated);
    var remaining = approval.decision.remainingGateIds.map(labelize);
    return panel("Implementation Scope Approval", "The named approver authorized only the linked selectors. This approval operation did not read source, mutate the target, commit, push, deploy, or write externally.", [
      "<div class=\"evidence-summary\" aria-label=\"Implementation scope approval summary\">",
      metric("Status", approval.status, "Implementation selectors only"),
      metric("Approver", approval.approver.name, approval.approver.reference),
      metric("Authorized gates", approval.decision.authorizedGateIds.length, "Source inspection and target files"),
      metric("Remaining gates", remaining.length, "Release authority separate"),
      "</div>",
      "<dl class=\"evidence-list\"><div><dt>Target</dt><dd><code>" + escapeHtml(approval.authorization.targetPath) + "</code></dd></div><div><dt>Approved at</dt><dd>" + escapeHtml(approval.approver.approvedAt) + "</dd></div><div><dt>Proposal SHA-256</dt><dd><code>" + escapeHtml(approval.proposal.sha256) + "</code></dd></div></dl>",
      "<div class=\"grid-2 start-details\"><div><h4>Authorized selectors</h4>" + renderStartList(files, "No mutation selectors authorized.") + "</div><div><h4>Still requires approval</h4>" + renderStartList(remaining, "No release gates requested.") + "</div></div>",
      "<div class=\"graph-boundaries\" aria-label=\"Implementation scope approval boundary\"><span class=\"badge badge--pass\">Scope approved</span><span class=\"pill\">No mutation performed</span><span class=\"pill\">No external write</span><span class=\"pill\">Commit pending</span><span class=\"pill\">Push pending</span><span class=\"pill\">Deployment pending</span></div>",
    ].join(""));
  }

  function renderTargetRepoIntake(intake) {
    var targetPath = intake.target.resolvedPath || intake.target.declaredPath;
    return panel("Target Repository Intake", "Only declared root metadata and local Git state were inspected. Application source, preview, network, and implementation remain untouched.", [
      "<div class=\"evidence-summary\" aria-label=\"Target repository intake summary\">",
      metric("Status", intake.status, "Scope review only"),
      metric("Project", intake.project.framework, intake.project.packageManager || "No package manager"),
      metric("Git", intake.git.branch || "Detached", intake.git.clean ? "Clean working tree" : "Existing changes"),
      metric("Remote", intake.git.remoteMatch ? "Matched" : "Mismatch", "Repository URL"),
      "</div>",
      "<dl class=\"evidence-list\"><div><dt>Target</dt><dd><code>" + escapeHtml(targetPath) + "</code></dd></div><div><dt>Receipt SHA-256</dt><dd><code>" + escapeHtml(intake.receipt.sha256) + "</code></dd></div><div><dt>Metadata files read</dt><dd>" + escapeHtml(intake.inspection.metadataFilesRead.join(", ") || "None") + "</dd></div><div><dt>Existing changes</dt><dd>" + escapeHtml(String(intake.git.changes.total)) + "</dd></div></dl>",
      "<ol class=\"review-session\" aria-label=\"Target repository intake timeline\">",
      "<li><span class=\"review-session__stage\">Receipt validation</span>" + qualityStatusBadge("pass") + "</li>",
      "<li><span class=\"review-session__stage\">Root metadata</span>" + qualityStatusBadge(intake.project.metadataStatus) + "</li>",
      "<li><span class=\"review-session__stage\">Git state</span>" + qualityStatusBadge(intake.git.status) + "</li>",
      "<li><span class=\"review-session__stage\">Implementation scope</span>" + qualityStatusBadge(intake.nextAction.status) + "</li>",
      "</ol>",
      "<div class=\"graph-boundaries\" aria-label=\"Target repository intake boundary\"><span class=\"pill\">Read-only</span><span class=\"pill\">No source read</span><span class=\"pill\">No preview</span><span class=\"pill\">No network</span><span class=\"pill\">Implementation unauthorized</span></div>",
    ].join(""));
  }

  function renderReviewHandoffReceipt(receipt) {
    return panel("Consumer Validation Receipt", "The named consumer revalidated the exact handoff contract. Identity, transport, acceptance, and implementation remain unverified.", [
      "<div class=\"evidence-summary\" aria-label=\"Review handoff receipt summary\">",
      metric("Consumer", receipt.consumer.name, "Matches the named recipient"),
      metric("Contract", receipt.consumer.contractValidation, receipt.status),
      metric("Identity", receipt.consumer.identity, "No identity proof"),
      metric("Acceptance", receipt.consumer.acceptance, "No implementation approval"),
      "</div>",
      "<ol class=\"review-session\" aria-label=\"Review handoff receipt timeline\">",
      "<li><span class=\"review-session__stage\">Handoff contract</span>" + qualityStatusBadge(receipt.consumer.contractValidation) + "</li>",
      "<li><span class=\"review-session__stage\">Target repo intake</span>" + qualityStatusBadge(receipt.nextAction.status) + "</li>",
      "<li><span class=\"review-session__stage\">Implementation</span>" + qualityStatusBadge(receipt.boundary.implementationStarted ? "started" : "not-started") + "</li>",
      "</ol>",
      "<div class=\"graph-boundaries\" aria-label=\"Review handoff receipt boundary\"><span class=\"pill\">" + escapeHtml(receipt.boundary.mode) + "</span><span class=\"pill\">Identity unverified</span><span class=\"pill\">Acceptance not claimed</span><span class=\"pill\">No target mutation</span></div>",
    ].join(""));
  }

  function renderReviewHandoffSession(handoff) {
    var stageLabels = {
      plan: "Plan",
      "static-review": "Static review",
      "browser-verification": "Browser verification",
      "implementation-handoff": "Implementation handoff",
    };
    return panel("Prepared Handoff", "The transfer is self-validating but has not been delivered or accepted by the recipient.", [
      "<div class=\"evidence-summary\" aria-label=\"Review handoff summary\">",
      metric("Recipient", handoff.recipient.name, "Named destination only"),
      metric("Delivery", handoff.recipient.delivery, "No transport performed"),
      metric("Consumer validation", handoff.recipient.consumerValidation, "Recipient must revalidate"),
      metric("Linkage", handoff.linkage.status, handoff.status),
      "</div>",
      "<ol class=\"review-session\" aria-label=\"Review handoff timeline\">",
      handoff.stages.map(function (stage) {
        return "<li><span class=\"review-session__stage\">" + escapeHtml(stageLabels[stage.id]) + "</span>" + qualityStatusBadge(stage.status) + "</li>";
      }).join(""),
      "<li><span class=\"review-session__stage\">Consumer validation</span>" + qualityStatusBadge(handoff.recipient.consumerValidation) + "</li>",
      "</ol>",
      "<div class=\"graph-boundaries\" aria-label=\"Review handoff boundary\"><span class=\"pill\">" + escapeHtml(handoff.boundary.mode) + "</span><span class=\"pill\">Not delivered</span><span class=\"pill\">No target mutation</span><span class=\"pill\">No external write</span></div>",
    ].join(""));
  }

  function renderReviewWorkflowSession(workflow) {
    var stageLabels = {
      plan: "Plan",
      "static-review": "Static review",
      "browser-verification": "Browser verification",
      "implementation-handoff": "Implementation handoff",
    };
    return panel("Review Session", "Original review-workflow envelope bytes are preserved. Start and Quality render the nested contracts by value.", [
      "<ol class=\"review-session\" aria-label=\"Review Session timeline\">",
      workflow.stages.map(function (stage) {
        return "<li><span class=\"review-session__stage\">" + escapeHtml(stageLabels[stage.id]) + "</span>" + qualityStatusBadge(stage.status) + "</li>";
      }).join(""),
      "<li><span class=\"review-session__stage\">Linkage</span>" + qualityStatusBadge(workflow.linkage.status) + "</li>",
      "<li><span class=\"review-session__stage\">Human review</span>" + qualityStatusBadge(workflow.nextAction.status) + "</li>",
      "</ol>",
      "<div class=\"graph-boundaries\" aria-label=\"Review workflow boundary\"><span class=\"pill\">" + escapeHtml(workflow.boundary.mode) + "</span><span class=\"pill\">No local writes</span><span class=\"pill\">No target mutation</span><span class=\"pill\">No external write</span></div>",
    ].join(""));
  }

  function renderQualityReportArtifact(report) {
    var packSources = report.sources.filter(function (source) {
      return source && source.kind === "design-contract" && /^product-packs\//.test(source.reference || "");
    });
    var approvals = report.approval && Array.isArray(report.approval.requiredBefore)
      ? report.approval.requiredBefore
      : [];
    return panel("Quality report", "Canonical static findings and unresolved evidence from the imported source contract.", [
      "<div class=\"evidence-summary\" aria-label=\"Quality report summary\">",
      metric("Status", report.summary.status, report.summary.nextAction),
      metric("Confirmed", report.summary.confirmedFindings, "Supported static evidence"),
      metric("Unverified", report.summary.unverifiedFindings, "Runtime or scenario evidence needed"),
      metric(
        "Review pack",
        packSources.length
          ? packSources[0].reference.replace(/^product-packs\//, "").replace(/\.json#revision-/, " r")
          : "none",
        "Opt-in only",
      ),
      "</div>",
      "<div class=\"graph-boundaries\" aria-label=\"Quality report boundary\">" + qualityStatusBadge(report.summary.status) + "<span class=\"pill\">" + escapeHtml(report.boundary.mode) + "</span><span class=\"pill\">No target mutation</span><span class=\"pill\">No external write</span></div>",
      "<h4>Findings</h4>",
      renderQualityFindings(report.findings),
      "<h4>Approval gates</h4>",
      renderStartList(approvals, "No approval gates recorded."),
    ].join(""));
  }

  function renderQualityFindings(findings) {
    if (!findings.length) return "<div class=\"empty-state empty-state--compact\">No findings recorded.</div>";
    return "<div class=\"quality-findings\">" + findings.map(function (finding) {
      return [
        "<details class=\"quality-finding\">",
        "<summary><span>" + escapeHtml(finding.severity.toUpperCase() + " " + finding.title) + "</span>" + qualityStatusBadge(finding.status) + "</summary>",
        "<dl><dt>Lens</dt><dd>" + escapeHtml(finding.lens) + "</dd><dt>Location</dt><dd><code>" + escapeHtml(finding.location) + "</code></dd><dt>Current evidence</dt><dd>" + escapeHtml(finding.before) + "</dd><dt>Expected state</dt><dd>" + escapeHtml(finding.after) + "</dd><dt>Why</dt><dd>" + escapeHtml(finding.why) + "</dd></dl>",
        "<h5>Verification</h5>" + renderStartList(finding.verification || [], "No verification steps recorded."),
        "</details>",
      ].join("");
    }).join("") + "</div>";
  }

  function renderBrowserProbes(probes) {
    if (!probes.length) return "<div class=\"empty-state empty-state--compact\">No runtime probes recorded.</div>";
    return "<ul class=\"start-list\">" + probes.map(function (probe) {
      return "<li><strong>" + escapeHtml(probe.check + " / " + probe.viewport) + ":</strong> " + escapeHtml(probe.observation) + qualityStatusBadge(probe.status) + "</li>";
    }).join("") + "</ul>";
  }

  function bytesToHex(bytes) {
    return Array.from(new Uint8Array(bytes)).map(function (byte) {
      return byte.toString(16).padStart(2, "0");
    }).join("");
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

  function mcpAdvice(key, status) {
    if (status === "required") return "Prepare auth and verify access before assigning implementation work.";
    if (status === "optional") return "Use when available; prompt should include a manual fallback.";
    if (status === "unavailable") return "Keep the task manual and mention the missing integration as a risk.";
    return key === "browser" ? "Manual screenshot review only; no runtime interaction expected." : "Not needed for the current site scope.";
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
      "<div class=\"runbook-source-bundle__header\"><div><strong>Source Bundle</strong><span>" + escapeHtml(sourceBundle.directory || "No source directory recorded") + "</span></div><div class=\"runbook-line-actions\"><button type=\"button\" class=\"button row-copy-button\" data-action=\"copy-runbook-source-bundle\">Copy Markdown</button><button type=\"button\" class=\"button row-copy-button\" data-action=\"download-runbook-source-bundle\">Export Markdown</button><button type=\"button\" class=\"button row-copy-button\" data-action=\"copy-runbook-source-bundle-json\">Copy provenance JSON</button><button type=\"button\" class=\"button row-copy-button\" data-action=\"download-runbook-source-bundle-json\">Export provenance JSON</button></div></div>",
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
      "<div class=\"runbook-line-actions\"><button type=\"button\" class=\"button row-copy-button\" data-action=\"copy-runbook-source-revalidation-gate\">Copy gate JSON</button><button type=\"button\" class=\"button row-copy-button\" data-action=\"download-runbook-source-revalidation-gate\">Export gate JSON</button></div>",
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

  function renderRunbookFilterButton(type, value, count, selected) {
    var label = value === "all" ? "All" : labelize(value);
    return [
      "<button type=\"button\" class=\"filter-chip\" data-runbook-filter-type=\"" + escapeAttr(type) + "\" data-runbook-filter-value=\"" + escapeAttr(value) + "\" aria-pressed=\"" + (selected ? "true" : "false") + "\">",
      "<span>" + escapeHtml(label) + "</span>",
      "<strong>" + escapeHtml(String(count)) + "</strong>",
      "</button>",
    ].join("");
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

  function markdownList(items, fallback) {
    var normalized = normalizeStringArray(items, []);
    if (normalized.length === 0) return "- " + fallback;
    return normalized.map(function (item) { return "- " + item; }).join("\n");
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

  function shortDisplay(value, maxLength) {
    var text = String(value || "");
    var limit = Number(maxLength || 12);
    if (text.length <= limit) return text;
    return text.slice(0, limit) + "...";
  }

  function safeFileSegment(value) {
    return String(value || "row")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "row";
  }

  global.DesignAiWebsiteConsoleViewModel = Object.freeze({
    auditCategories: auditCategories,
    badge: badge,
    boundaryItem: boundaryItem,
    buildCodexTaskPromptForWorkspace: buildCodexTaskPromptForWorkspace,
    buildOperatorRunbookRowMarkdown: buildOperatorRunbookRowMarkdown,
    buildSourceBundleMarkdown: buildSourceBundleMarkdown,
    bytesToHex: bytesToHex,
    categoryById: categoryById,
    cloneWorkspace: cloneWorkspace,
    cmsOptions: cmsOptions,
    combineStatus: combineStatus,
    createDefaultChecklist: createDefaultChecklist,
    createDefaultWorkspace: createDefaultWorkspace,
    createSourceBundleOnlyRunbook: createSourceBundleOnlyRunbook,
    databaseOptions: databaseOptions,
    deployOptions: deployOptions,
    effortOptions: effortOptions,
    escapeAttr: escapeAttr,
    escapeHtml: escapeHtml,
    extractOperatorRunbookPayload: extractOperatorRunbookPayload,
    fillRunbookKeyIndexFromRows: fillRunbookKeyIndexFromRows,
    formatDate: formatDate,
    formatEmptyRunbookRowsMessage: formatEmptyRunbookRowsMessage,
    formatSourceBundleMarkdownCommand: formatSourceBundleMarkdownCommand,
    formatSourceBundleMarkdownStatus: formatSourceBundleMarkdownStatus,
    formatSourceBundleRevalidationMarkdown: formatSourceBundleRevalidationMarkdown,
    formatSourceBundleRevalidationSummary: formatSourceBundleRevalidationSummary,
    impactOptions: impactOptions,
    importedArtifact: importedArtifact,
    isWorkspacePayload: isWorkspacePayload,
    labelize: labelize,
    linesToText: linesToText,
    markdownList: markdownList,
    mcpAdvice: mcpAdvice,
    mcpItems: mcpItems,
    mcpLevel: mcpLevel,
    mcpState: mcpState,
    mcpStatusOptions: mcpStatusOptions,
    metric: metric,
    normalizeChecklist: normalizeChecklist,
    normalizeEnum: normalizeEnum,
    normalizeImplementationEvidence: normalizeImplementationEvidence,
    normalizeLinkedPreview: normalizeLinkedPreview,
    normalizeMcp: normalizeMcp,
    normalizeOperatorRunbook: normalizeOperatorRunbook,
    normalizePlainObject: normalizePlainObject,
    normalizeRunbookKeyIndex: normalizeRunbookKeyIndex,
    normalizeRunbookRow: normalizeRunbookRow,
    normalizeStringArray: normalizeStringArray,
    normalizeTasks: normalizeTasks,
    normalizeWorkspace: normalizeWorkspace,
    optionList: optionList,
    orderedTasks: orderedTasks,
    panel: panel,
    pill: pill,
    priorityOptions: priorityOptions,
    profileNodeId: profileNodeId,
    qualityStatusBadge: qualityStatusBadge,
    recommendedMcpForCategory: recommendedMcpForCategory,
    renderBrowserProbes: renderBrowserProbes,
    renderGraphLanes: renderGraphLanes,
    renderGraphNode: renderGraphNode,
    renderGraphNodeMeta: renderGraphNodeMeta,
    renderImplementationEvidence: renderImplementationEvidence,
    renderImplementationScopeApproval: renderImplementationScopeApproval,
    renderImplementationScopeProposal: renderImplementationScopeProposal,
    renderPilotEvidence: renderPilotEvidence,
    renderQualityFindings: renderQualityFindings,
    renderQualityReportArtifact: renderQualityReportArtifact,
    renderReviewComparisonArtifact: renderReviewComparisonArtifact,
    renderReviewHandoffReceipt: renderReviewHandoffReceipt,
    renderReviewHandoffSession: renderReviewHandoffSession,
    renderReviewWorkflowSession: renderReviewWorkflowSession,
    renderRunbookFilterButton: renderRunbookFilterButton,
    renderRunbookMetadata: renderRunbookMetadata,
    renderRunbookProvenanceOnlyNotice: renderRunbookProvenanceOnlyNotice,
    renderRunbookRows: renderRunbookRows,
    renderRunbookSourceBundleDetails: renderRunbookSourceBundleDetails,
    renderRunbookSourceBundleWarning: renderRunbookSourceBundleWarning,
    renderStartList: renderStartList,
    renderStartReferences: renderStartReferences,
    renderTargetRepoIntake: renderTargetRepoIntake,
    renderTaskRow: renderTaskRow,
    renderViewportField: renderViewportField,
    safeFileSegment: safeFileSegment,
    selectField: selectField,
    setByPath: setByPath,
    shortDisplay: shortDisplay,
    sourceBundleCommandRow: sourceBundleCommandRow,
    sourceBundleCopyRow: sourceBundleCopyRow,
    sourceBundleMarkdownRow: sourceBundleMarkdownRow,
    sourceBundleRevalidationRow: sourceBundleRevalidationRow,
    sourceBundleRow: sourceBundleRow,
    statusOptions: statusOptions,
    tabs: tabs,
    taskBlock: taskBlock,
    taskFromCategoryForWorkspace: taskFromCategoryForWorkspace,
    templates: templates,
    textField: textField,
    textToLines: textToLines,
    textareaField: textareaField,
    viewportOptions: viewportOptions,
    workflowEdge: workflowEdge,
    workflowNode: workflowNode,
    workflowTasks: workflowTasks,
    workspaceStatus: workspaceStatus,
  });
})(typeof window !== "undefined" ? window : globalThis);
