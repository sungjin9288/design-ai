// Static Website Improvement content catalogs shared by the site CLI helpers.

export const SITE_PROMPT_TEMPLATE_IDS = [
  "codex-repo-intake",
  "codex-implementation",
  "codex-visual-qa",
  "codex-deployment",
  "claude-design-review",
  "claude-competitor",
  "claude-copy-ux",
  "handoff-report",
];

export const SITE_BUNDLE_FILES = [
  "README.md",
  "summary.json",
  "website-workspace.tasks.json",
  "mcp-check.json",
  "mcp-probes.json",
  "mcp-action-plan.md",
  "website-handoff.md",
  "website-prompts.md",
  "codex-implementation.md",
];

export const SITE_BUNDLE_CHECKSUM_FILES = SITE_BUNDLE_FILES.filter((filePath) => filePath !== "summary.json");

export const SITE_PROMPT_TEMPLATES = [
  {
    id: "codex-repo-intake",
    label: "Codex repo intake",
    agent: "codex",
    output: "Repository inspection plan",
    description: "Inspect the target website repo and return structure, likely touch points, risks, and verification commands.",
    taskSelectable: false,
  },
  {
    id: "codex-implementation",
    label: "Codex implementation",
    agent: "codex",
    output: "Focused implementation prompt",
    description: "Implement the selected website improvement task in the target repo with scoped verification.",
    taskSelectable: true,
  },
  {
    id: "codex-visual-qa",
    label: "Codex visual QA",
    agent: "codex",
    output: "Browser/Playwright QA checklist",
    description: "Verify priority pages across configured viewports for layout, focus, console, and asset issues.",
    taskSelectable: false,
  },
  {
    id: "codex-deployment",
    label: "Codex deployment verification",
    agent: "codex",
    output: "Deployment verification prompt",
    description: "Check preview or production deployment, logs, metadata, user flows, and remaining launch risks.",
    taskSelectable: false,
  },
  {
    id: "claude-design-review",
    label: "Claude design review",
    agent: "claude",
    output: "Senior design critique",
    description: "Review visual hierarchy, layout rhythm, typography, CTA clarity, responsive behavior, and accessibility concerns.",
    taskSelectable: false,
  },
  {
    id: "claude-competitor",
    label: "Claude competitor research",
    agent: "claude",
    output: "Competitor opportunity map",
    description: "Compare relevant peer sites for structure, conversion path, proof, pricing, tone, content, and SEO positioning.",
    taskSelectable: false,
  },
  {
    id: "claude-copy-ux",
    label: "Claude copy/UX critique",
    agent: "claude",
    output: "Copy and UX improvement notes",
    description: "Critique copy, information architecture, trust signals, CTA language, and conversion flow.",
    taskSelectable: false,
  },
  {
    id: "handoff-report",
    label: "Final handoff report",
    agent: "codex-or-claude",
    output: "Final handoff report prompt",
    description: "Generate a final report covering target site info, audit summary, recommendations, executed work, verification, risks, and next actions.",
    taskSelectable: false,
  },
];

if (SITE_PROMPT_TEMPLATE_IDS.join("\n") !== SITE_PROMPT_TEMPLATES.map((template) => template.id).join("\n")) {
  throw new Error("SITE_PROMPT_TEMPLATES must match SITE_PROMPT_TEMPLATE_IDS order");
}
