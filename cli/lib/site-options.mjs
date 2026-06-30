// Shared option catalogs for Website Improvement workspace helpers.

export const AUDIT_CATEGORIES = [
  {
    id: "visual-design",
    label: "Visual Design",
    defaultVerification: [
      "Compare spacing rhythm across target pages",
      "Check contrast ratios for key text pairs",
    ],
  },
  {
    id: "ux-flow",
    label: "UX Flow",
    defaultVerification: [
      "Complete the primary user flow on desktop and mobile",
      "Confirm one dominant CTA per decision point",
    ],
  },
  {
    id: "responsive",
    label: "Responsive QA",
    defaultVerification: [
      "Verify desktop, tablet, and mobile viewports",
      "Check text wrapping and touch targets",
    ],
  },
  {
    id: "accessibility",
    label: "Accessibility",
    defaultVerification: [
      "Tab through all interactive controls",
      "Confirm visible focus and accessible names",
    ],
  },
  {
    id: "performance",
    label: "Performance",
    defaultVerification: [
      "Run Lighthouse or deployment analytics when available",
      "Confirm image dimensions and lazy-loading",
    ],
  },
  {
    id: "seo",
    label: "SEO",
    defaultVerification: [
      "Inspect metadata for each priority page",
      "Validate heading order and canonical links",
    ],
  },
  {
    id: "technical-quality",
    label: "Technical Quality",
    defaultVerification: [
      "Inspect component ownership before editing",
      "Run target repo lint/typecheck/build",
    ],
  },
  {
    id: "runtime-issues",
    label: "Runtime Issues",
    defaultVerification: [
      "Open the site in Browser or Chrome DevTools",
      "Confirm console and network panels are clean",
    ],
  },
  {
    id: "content-quality",
    label: "Content Quality",
    defaultVerification: [
      "Read the page as a first-time visitor",
      "Check whether claims have concrete proof",
    ],
  },
];

export const MCP_ITEMS = [
  ["github", "GitHub"],
  ["figma", "Figma"],
  ["browser", "Browser/Playwright"],
  ["chromeDevtools", "Chrome DevTools"],
  ["deploy", "Deploy"],
  ["sentry", "Sentry"],
  ["database", "Database"],
  ["cms", "CMS"],
  ["collaboration", "Collaboration"],
  ["research", "Research"],
];

export const PRIORITY_OPTIONS = ["p0", "p1", "p2", "p3"];

export function categoryById(id) {
  return AUDIT_CATEGORIES.find((category) => category.id === id) || AUDIT_CATEGORIES[0];
}
