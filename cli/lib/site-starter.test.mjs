// Tests for site init/intake workspace starters and prompt templates.

import { test } from "node:test";
import assert from "node:assert/strict";

import {
  analyzeSiteWorkspace,
  buildSiteInitNextActionsReport,
  buildSiteIntakeNextActionsReport,
  buildSiteIntakeTemplateMarkdown,
  createSiteWorkspaceFromInitOptions,
  createSiteWorkspaceFromIntakeMarkdown,
  formatSiteIntakeTemplateJson,
  formatSiteNextActionsHuman,
  formatSiteNextActionsJson,
  formatSitePromptTemplatesHuman,
  formatSitePromptTemplatesJson,
  generateSiteRefactorTasks,
} from "./site.mjs";

test("createSiteWorkspaceFromInitOptions creates a valid real-project workspace", () => {
  const workspace = createSiteWorkspaceFromInitOptions({
    name: "Company marketing site",
    liveUrl: "https://example.com",
    repoUrl: "https://github.com/acme/site",
    localPath: "/Users/sungjin/dev/acme-site",
    figmaUrl: "https://figma.com/file/acme",
    brandNotes: "Korean B2B SaaS tone",
    deployProvider: "vercel",
    sentryProject: "acme/site",
    cms: "sanity",
    database: "supabase",
    pages: ["/", "/pricing", "/pricing"],
    userFlows: ["Visitor compares plans and starts signup"],
    viewports: ["desktop", "mobile"],
  });
  const { summary } = analyzeSiteWorkspace(workspace, { filePath: "company.json" });

  assert.equal(workspace.version, 1);
  assert.match(workspace.updatedAt, /^\d{4}-\d{2}-\d{2}T/);
  assert.equal(workspace.siteProfile.id, "company-marketing-site");
  assert.equal(workspace.siteProfile.name, "Company marketing site");
  assert.equal(workspace.siteProfile.liveUrl, "https://example.com");
  assert.deepEqual(workspace.siteProfile.pages, ["/", "/pricing"]);
  assert.deepEqual(workspace.siteProfile.viewports, ["desktop", "mobile"]);
  assert.equal(workspace.mcpReadiness.github, "required");
  assert.equal(workspace.mcpReadiness.browser, "required");
  assert.equal(workspace.mcpReadiness.deploy, "required");
  assert.equal(workspace.mcpReadiness.figma, "optional");
  assert.equal(workspace.mcpReadiness.cms, "optional");
  assert.equal(workspace.mcpReadiness.database, "optional");
  assert.deepEqual(workspace.refactorTasks, []);
  assert.match(workspace.auditChecklist["ux-flow"].notes, /Visitor compares plans/);
  assert.match(workspace.reportNotes, /design-ai site --init/);
  assert.equal(summary.status, "pass");
  assert.equal(summary.counts.pages, 2);
  assert.equal(summary.counts.refactorTasks, 0);

  const minimal = createSiteWorkspaceFromInitOptions({
    name: "Internal site",
    liveUrl: "https://internal.example.com",
  });
  assert.deepEqual(minimal.siteProfile.pages, ["/"]);
  assert.deepEqual(minimal.siteProfile.viewports, ["desktop", "tablet", "mobile"]);
  assert.equal(minimal.mcpReadiness.github, "optional");
  assert.equal(minimal.mcpReadiness.deploy, "unused");
  assert.equal(minimal.mcpReadiness.figma, "unused");
  assert.equal(minimal.mcpReadiness.cms, "unused");
  assert.equal(minimal.mcpReadiness.database, "unused");

  const greenfield = createSiteWorkspaceFromInitOptions({
    name: "Greenfield homepage",
    repoUrl: "https://github.com/acme/greenfield-site",
    deployProvider: "vercel",
  });
  const greenfieldSummary = analyzeSiteWorkspace(greenfield, { filePath: "greenfield.json" }).summary;
  assert.equal(greenfield.siteProfile.liveUrl, "");
  assert.equal(greenfield.mcpReadiness.github, "required");
  assert.equal(greenfield.mcpReadiness.browser, "required");
  assert.equal(greenfield.mcpReadiness.deploy, "required");
  assert.equal(greenfieldSummary.status, "pass");
});

test("buildSiteInitNextActionsReport prepends a durable workspace save action", () => {
  const workspace = createSiteWorkspaceFromInitOptions({
    name: "Company marketing site",
    liveUrl: "https://example.com",
    repoUrl: "https://github.com/acme/site",
    deployProvider: "vercel",
    pages: ["/", "/pricing"],
    userFlows: ["Visitor compares plans and starts signup"],
    viewports: ["desktop", "mobile"],
  });
  const report = buildSiteInitNextActionsReport(workspace);
  const json = JSON.parse(formatSiteNextActionsJson(report));
  const human = formatSiteNextActionsHuman(report);

  assert.equal(json.kind, "website-improvement-next-actions");
  assert.equal(json.mode, "init-next-actions");
  assert.equal(json.filePath, "website-workspace.json");
  assert.equal(json.actions[0].title, "Save the generated Website Improvement workspace");
  assert.match(json.actions[0].command, /design-ai site --init/);
  assert.match(json.actions[0].command, /--out website-workspace\.json/);
  assert.equal(json.commands.createWorkspace, json.actions[0].command);
  assert.match(json.commands.tasks, /design-ai site website-workspace\.json --tasks/);
  assert.match(human, /Save the generated Website Improvement workspace/);
  assert.match(human, /This init next-action report is deterministic and local/);
});

test("createSiteWorkspaceFromIntakeMarkdown parses a filled Korean company intake", () => {
  const markdown = `# 회사 웹사이트 Intake Template

## Site Profile

| 항목 | 값 |
|---|---|
| 사이트 이름 | RAPA company site |
| Live URL | https://rapa.example.com |
| 대상 repo URL | https://github.com/acme/rapa-site |
| 대상 repo local path | /Users/sungjin/dev/rapa-site |
| Figma URL | https://figma.com/file/rapa |
| 배포 플랫폼 | vercel |
| Sentry 프로젝트 | acme/rapa-web |
| CMS | wordpress |
| Database | none |

## 우선순위 페이지

| 우선순위 | Path 또는 URL | 중요한 이유 |
|---:|---|---|
| 1 | / | 첫 인상과 CTA |
| 2 | /programs | 교육 과정 전환 |

## 주요 사용자 흐름

| 우선순위 | Flow | 성공 신호 |
|---:|---|---|
| 1 | 방문자가 교육 과정을 비교하고 신청 CTA를 클릭 | 신청 CTA 클릭 |

## Brand And Content Notes

| 영역 | 메모 |
|---|---|
| 브랜드 톤 | 공공기관 신뢰감과 명확한 한국어 카피 |
| 한국어 카피 규칙 | 과장 표현을 피하고 지원 요건을 먼저 보여줌 |

## MCP Readiness Notes

| 시스템 | 상태 | 근거 또는 fallback |
|---|---|---|
| GitHub | required | repo 접근 필요 |
| Figma | optional | 디자인 파일 확인 가능 |
| Browser / Playwright | required | 실제 페이지 QA |
| Chrome DevTools | optional | console/network 확인 |
| 배포 플랫폼 | required | Vercel preview 확인 |
| Sentry | optional | production issue 확인 |
| Database | unused | DB 없음 |
| CMS | required | WordPress 콘텐츠 |
| 협업 도구 | optional | 내부 피드백 |
| 리서치 도구 | unused | 이번 pilot 제외 |

## 초기 Audit Findings

| Category | Finding | Evidence | Page |
|---|---|---|---|
| Visual design | Hero CTA hierarchy is weak | Primary and secondary buttons compete | / |
| Accessibility | Mobile menu focus state is unclear | Keyboard focus ring not documented | / |
`;

  const workspace = createSiteWorkspaceFromIntakeMarkdown(markdown, {
    filePath: "company-website-intake.ko.md",
  });
  const { summary } = analyzeSiteWorkspace(workspace, { filePath: "website-workspace.json" });
  const taskWorkspace = generateSiteRefactorTasks(workspace).workspace;
  const nextActions = buildSiteIntakeNextActionsReport(workspace, summary, {
    intakePath: "company-website-intake.ko.md",
  });

  assert.equal(workspace.siteProfile.id, "rapa-company-site");
  assert.equal(workspace.siteProfile.name, "RAPA company site");
  assert.equal(workspace.siteProfile.liveUrl, "https://rapa.example.com");
  assert.equal(workspace.siteProfile.repoUrl, "https://github.com/acme/rapa-site");
  assert.equal(workspace.siteProfile.localPath, "/Users/sungjin/dev/rapa-site");
  assert.equal(workspace.siteProfile.deployProvider, "vercel");
  assert.equal(workspace.siteProfile.cms, "wordpress");
  assert.deepEqual(workspace.siteProfile.pages, ["/", "/programs"]);
  assert.deepEqual(workspace.siteProfile.userFlows, ["방문자가 교육 과정을 비교하고 신청 CTA를 클릭"]);
  assert.match(workspace.siteProfile.brandNotes, /공공기관 신뢰감/);
  assert.equal(workspace.mcpReadiness.github, "required");
  assert.equal(workspace.mcpReadiness.cms, "required");
  assert.equal(workspace.mcpReadiness.research, "unused");
  assert.equal(workspace.auditChecklist["visual-design"].status, "in-progress");
  assert.match(workspace.auditChecklist["visual-design"].findings[0], /Hero CTA hierarchy is weak/);
  assert.match(workspace.auditChecklist.accessibility.findings[0], /Keyboard focus ring not documented/);
  assert.match(workspace.reportNotes, /--from-intake company-website-intake\.ko\.md/);
  assert.equal(summary.status, "pass");
  assert.ok(taskWorkspace.refactorTasks.some((task) => task.id === "task-visual-design"));
  assert.ok(taskWorkspace.refactorTasks.some((task) => task.id === "task-accessibility"));
  assert.equal(nextActions.mode, "from-intake-next-actions");
  assert.equal(nextActions.actions[0].title, "Save the parsed Website Improvement workspace");
  assert.equal(nextActions.commands.createWorkspace, "design-ai site --from-intake company-website-intake.ko.md --out website-workspace.json --force");
});

test("buildSiteIntakeTemplateMarkdown emits a company pilot intake form", () => {
  const markdown = buildSiteIntakeTemplateMarkdown();
  const json = JSON.parse(formatSiteIntakeTemplateJson());

  assert.match(markdown, /^# Company Website Intake Template/);
  assert.match(markdown, /Keep sensitive credentials, private tokens, production secrets, and customer data out of this document/);
  assert.match(markdown, /## Site Profile/);
  assert.match(markdown, /## Priority Pages/);
  assert.match(markdown, /## MCP Readiness Notes/);
  assert.match(markdown, /design-ai site --init \\/);
  assert.match(markdown, /design-ai site website-handoff-bundle --bundle-check --strict --json/);
  assert.match(markdown, /## Target Repo Verification Plan/);
  assert.match(markdown, /## Stop Conditions/);

  assert.deepEqual(Object.keys(json), [
    "kind",
    "version",
    "format",
    "language",
    "recommendedFileName",
    "sections",
    "privacy",
    "commands",
    "content",
  ]);
  assert.equal(json.kind, "website-improvement-intake-template");
  assert.equal(json.version, 1);
  assert.equal(json.format, "markdown");
  assert.equal(json.language, "en");
  assert.equal(json.recommendedFileName, "company-website-intake.md");
  assert.deepEqual(json.privacy, {
    storesCredentials: false,
    storesProductionSecrets: false,
    storesCustomerData: false,
  });
  assert.equal(json.sections.includes("first-bundle-commands"), true);
  assert.match(json.commands.bundle, /--bundle --out website-handoff-bundle --strict/);
  assert.equal(json.content, markdown);

  const koreanMarkdown = buildSiteIntakeTemplateMarkdown({ language: "ko" });
  const koreanJson = JSON.parse(formatSiteIntakeTemplateJson({ language: "ko" }));
  assert.match(koreanMarkdown, /^# 회사 웹사이트 Intake Template/);
  assert.match(koreanMarkdown, /민감한 credential, private token, production secret, 고객 데이터/);
  assert.match(koreanMarkdown, /## 우선순위 페이지/);
  assert.match(koreanMarkdown, /## 주요 사용자 흐름/);
  assert.match(koreanMarkdown, /## 초기 Audit Findings/);
  assert.match(koreanMarkdown, /design-ai site --init \\/);
  assert.equal(koreanJson.language, "ko");
  assert.equal(koreanJson.recommendedFileName, "company-website-intake.ko.md");
  assert.equal(koreanJson.content, koreanMarkdown);
});

test("formatSitePromptTemplates lists all Website Improvement prompt templates", () => {
  const human = formatSitePromptTemplatesHuman();
  const json = JSON.parse(formatSitePromptTemplatesJson());

  assert.match(human, /Website Improvement prompt templates/);
  assert.match(human, /1\. implementation-plan/);
  assert.match(human, /3\. design-contract/);
  assert.match(human, /5\. codex-implementation/);
  assert.match(human, /Task selectable: yes/);
  assert.match(human, /design-ai site <workspace\.json> --prompt codex-implementation --task <id-or-number>/);

  assert.deepEqual(Object.keys(json), ["count", "templates"]);
  assert.equal(json.count, 11);
  assert.deepEqual(json.templates.map((template) => template.id), [
    "implementation-plan",
    "critique-loop",
    "design-contract",
    "codex-repo-intake",
    "codex-implementation",
    "codex-visual-qa",
    "codex-deployment",
    "claude-design-review",
    "claude-competitor",
    "claude-copy-ux",
    "handoff-report",
  ]);
  assert.equal(json.templates[0].taskSelectable, true);
  assert.equal(json.templates[0].agent, "codex-or-claude");
  assert.equal(json.templates[4].taskSelectable, true);
  assert.equal(json.templates[4].agent, "codex");
});
