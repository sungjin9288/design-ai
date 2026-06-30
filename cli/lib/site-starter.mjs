// Starter artifacts for Website Improvement workspaces.

import {
  SITE_INTAKE_TEMPLATE_MARKDOWN,
  SITE_INTAKE_TEMPLATE_MARKDOWN_KO,
  SITE_INTAKE_TEMPLATE_SECTIONS,
} from "./site-content.mjs";
import { DEFAULT_IMPLEMENTATION_RISKS } from "./site-evidence.mjs";
import { SITE_INTAKE_TEMPLATE_LANGUAGE_OPTIONS } from "./site-options.mjs";

export function buildSiteIntakeTemplateMarkdown({ language = "en" } = {}) {
  if (!SITE_INTAKE_TEMPLATE_LANGUAGE_OPTIONS.includes(language)) {
    throw new Error(`language must be one of: ${SITE_INTAKE_TEMPLATE_LANGUAGE_OPTIONS.join(", ")}`);
  }
  return language === "ko" ? SITE_INTAKE_TEMPLATE_MARKDOWN_KO : SITE_INTAKE_TEMPLATE_MARKDOWN;
}

export function formatSiteIntakeTemplateJson({ language = "en" } = {}) {
  const content = buildSiteIntakeTemplateMarkdown({ language });
  return JSON.stringify({
    kind: "website-improvement-intake-template",
    version: 1,
    format: "markdown",
    language,
    recommendedFileName: language === "ko" ? "company-website-intake.ko.md" : "company-website-intake.md",
    sections: SITE_INTAKE_TEMPLATE_SECTIONS,
    privacy: {
      storesCredentials: false,
      storesProductionSecrets: false,
      storesCustomerData: false,
    },
    commands: {
      nextActions: "design-ai site --init --name \"<site name>\" --live-url <live-url> --local-path <absolute-target-repo-path> --next-actions --out website-next-actions.md --force",
      bundle: "design-ai site --init --name \"<site name>\" --live-url <live-url> --local-path <absolute-target-repo-path> --bundle --out website-handoff-bundle --strict --force",
      bundleCheck: "design-ai site website-handoff-bundle --bundle-check --strict --json --out website-bundle-check.json --force",
      bundleHandoff: "design-ai site website-handoff-bundle --bundle-handoff --strict --out target-repo-handoff.md --force",
    },
    content,
  }, null, 2);
}

export function createSampleSiteWorkspace() {
  return {
    version: 1,
    updatedAt: "2026-05-30T00:00:00.000Z",
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
      userFlows: [
        "Visitor compares pricing and starts signup",
        "Existing customer finds feature proof before contacting sales",
      ],
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
      responsive: {
        status: "todo",
        notes: "Check 1440, 1024, 390, and 360 width layouts.",
        findings: [],
      },
      accessibility: {
        status: "todo",
        notes: "Keyboard and focus audit required for nav, pricing toggle, and forms.",
        findings: ["Focus state is not yet documented for the mobile menu"],
      },
      performance: {
        status: "todo",
        notes: "Run Lighthouse after visual pass.",
        findings: [],
      },
      seo: {
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
        verification: [
          "Run target repo lint/build",
          "Verify desktop/tablet/mobile hero layout",
          "Confirm focus indicators and text contrast",
        ],
        risks: ["Could change conversion copy without stakeholder approval"],
      },
    ],
    implementationEvidence: {
      executedWork: [],
      verificationResults: [],
      remainingRisks: [...DEFAULT_IMPLEMENTATION_RISKS],
      nextActions: [],
    },
    reportNotes: "MVP audit is a planning console. Run the generated prompts inside the target website repo before marking implementation complete.",
  };
}
