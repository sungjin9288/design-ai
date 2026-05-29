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
      reportNotes: String(source.reportNotes || ""),
    };
    if (workspace.siteProfile.viewports.length === 0) {
      workspace.siteProfile.viewports = ["desktop"];
    }
    return workspace;
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
    return {
      pages: appState.workspace.siteProfile.pages.length,
      done: done,
      blocked: blocked,
      tasks: appState.workspace.refactorTasks.length,
      requiredMcp: requiredMcp,
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
      "<button type=\"button\" class=\"button\" data-action=\"import-click\">Import JSON</button>",
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
    return panel("Handoff Report", "Draft the before/after and verification report after target repo implementation work.", [
      "<div class=\"field field--wide\" style=\"margin-bottom: 12px;\">",
      "<label for=\"reportNotes\">Report notes</label>",
      "<textarea id=\"reportNotes\" data-field=\"reportNotes\">" + escapeHtml(appState.workspace.reportNotes) + "</textarea>",
      "</div>",
      "<div class=\"button-row\" style=\"margin-bottom: 8px;\">",
      "<button type=\"button\" class=\"button button--primary\" data-action=\"copy-report\">Copy report</button>",
      "<button type=\"button\" class=\"button\" data-action=\"download-report\">Export .md</button>",
      "</div>",
      "<pre class=\"report-preview\" data-output=\"report\">" + escapeHtml(report) + "</pre>",
    ].join(""));
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
    if (path === "siteProfile.pages" || path === "siteProfile.userFlows") {
      target[key] = textToLines(value);
    } else {
      target[key] = value;
    }
  }

  function generateTasksFromFindings() {
    var workspace = appState.workspace;
    var existingIds = new Set(workspace.refactorTasks.map(function (task) { return task.id; }));
    var created = [];
    auditCategories.forEach(function (category) {
      var row = workspace.auditChecklist[category.id];
      var findings = row.findings.length ? row.findings : row.notes ? [row.notes] : [];
      if (findings.length === 0) return;
      var id = "task-" + category.id;
      if (existingIds.has(id)) return;
      var task = taskFromCategory(category, findings[0]);
      created.push(task);
      existingIds.add(id);
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
      "- Not recorded in this MVP. Add implementation notes after running Codex in the target repo.",
      "",
      "## Verification results",
      "",
      "- Not recorded in this MVP. Paste target repo lint/typecheck/build, Browser QA, and deployment checks here.",
      "",
      "## Remaining risks",
      "",
      "- MCP readiness gaps may limit verification depth.",
      "- Copy or brand changes may require stakeholder review.",
      "- Automated performance/accessibility tooling is outside this MVP unless run in the target repo.",
      "",
      "## Notes",
      "",
      appState.workspace.reportNotes || "No notes recorded.",
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
    }
  }

  function handleImport(event) {
    var file = event.target.files && event.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        appState.workspace = normalizeWorkspace(JSON.parse(String(reader.result || "")));
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
