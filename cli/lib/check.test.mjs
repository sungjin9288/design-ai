// Tests for cli/lib/check.mjs artifact quality checks.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  checkAllExampleArtifacts,
  checkArtifactContent,
  checkExampleArtifacts,
  parseCheckArgs,
} from "./check.mjs";

const GOOD_ARTIFACT = `
# Button component spec

This spec cites knowledge/components/INDEX.md and knowledge/a11y/keyboard-and-focus.md before making component decisions.

The primary foreground/background pair is --color-primary-foreground on --color-primary-default with a measured 4.8:1 contrast ratio. Keyboard behavior supports Tab order, Enter, Space, Escape, and a visible focus-visible outline. Screen reader behavior uses aria-expanded and aria-controls where disclosure is present.

Responsive behavior covers mobile and desktop breakpoints. The mobile layout keeps touch targets at 44px and the desktop layout keeps the same component anatomy.

Don't use this component for destructive confirmation flows; use an AlertDialog pattern instead. Avoid icon-only labels unless an accessible name is provided.
`;

test("parseCheckArgs supports file, stdin, strict, and json", () => {
  assert.deepEqual(parseCheckArgs(["artifact.md", "--strict", "--json"]), {
    target: "artifact.md",
    stdin: false,
    examples: false,
    allRoutes: false,
    issuesOnly: false,
    limit: 3,
    strict: true,
    routeId: "",
    json: true,
    help: false,
  });

  assert.deepEqual(parseCheckArgs(["--stdin"]), {
    target: "",
    stdin: true,
    examples: false,
    allRoutes: false,
    issuesOnly: false,
    limit: 3,
    strict: false,
    routeId: "",
    json: false,
    help: false,
  });

  assert.equal(parseCheckArgs(["artifact.md", "--route", "component-spec"]).routeId, "component-spec");
  assert.deepEqual(parseCheckArgs(["--examples", "--route", "component-spec", "--limit", "5"]).examples, true);
  assert.deepEqual(parseCheckArgs(["--examples", "--route", "component-spec", "--limit", "5"]).limit, 5);
  assert.deepEqual(parseCheckArgs(["--examples", "--all-routes", "--limit", "2"]).allRoutes, true);
  assert.deepEqual(parseCheckArgs(["--examples", "--all-routes", "--issues-only"]).issuesOnly, true);
});

test("parseCheckArgs rejects invalid argument combinations", () => {
  assert.throws(() => parseCheckArgs(["artifact.md", "--stdin"]), /either a file path or --stdin/);
  assert.throws(() => parseCheckArgs(["artifact.md", "--examples", "--route", "component-spec"]), /--examples by itself/);
  assert.throws(() => parseCheckArgs(["--examples"]), /--examples requires --route id or --all-routes/);
  assert.throws(() => parseCheckArgs(["--all-routes"]), /--all-routes is only supported with --examples/);
  assert.throws(() => parseCheckArgs(["--examples", "--route", "component-spec", "--all-routes"]), /either --route id or --all-routes/);
  assert.throws(() => parseCheckArgs(["artifact.md", "extra.md"]), /Unexpected argument/);
  assert.throws(() => parseCheckArgs(["artifact.md", "--route"]), /--route expects a route id/);
  assert.throws(() => parseCheckArgs(["artifact.md", "--limit", "2"]), /--limit is only supported with --examples/);
  assert.throws(() => parseCheckArgs(["--examples", "--route", "component-spec", "--limit", "26"]), /--limit expects/);
  assert.throws(() => parseCheckArgs(["--bad"]), /Unknown check option/);
  assert.throws(() => parseCheckArgs(["--examples", "--rout", "component-spec"]), /Did you mean `--route`\?/);
});

test("checkArtifactContent passes a grounded accessible artifact", () => {
  const report = checkArtifactContent({
    content: GOOD_ARTIFACT,
    filePath: "good.md",
  });

  assert.equal(report.status, "pass");
  assert.equal(report.failures, 0);
  assert.equal(report.warnings, 0);
  assert.equal(report.results.every((item) => item.level === "pass"), true);
});

test("checkArtifactContent fails unresolved markers and color without contrast ratio", () => {
  const report = checkArtifactContent({
    content: `
# Palette draft

TODO: fill in later.

Use #3366ff for the main action and #ffffff for text.
    `,
    filePath: "bad.md",
  });

  assert.equal(report.status, "fail");
  assert.ok(report.results.some((item) => item.id === "unresolved-markers" && item.level === "fail"));
  assert.ok(report.results.some((item) => item.id === "contrast" && item.level === "fail"));
});

test("checkArtifactContent warns when accessibility notes are missing", () => {
  const report = checkArtifactContent({
    content: `
# Design note

This output cites knowledge/PRINCIPLES.md and gives a concise recommendation with enough detail to review. It includes a contrast note but does not describe interaction details. Contrast is considered for the main foreground and background pair.
    `,
    filePath: "warn.md",
  });

  assert.equal(report.status, "warn");
  assert.equal(report.failures, 0);
  assert.ok(report.results.some((item) => item.id === "keyboard-focus" && item.level === "warn"));
  assert.ok(report.results.some((item) => item.id === "responsive" && item.level === "warn"));
});

test("checkArtifactContent adds route-specific checks when routeId is provided", () => {
  const report = checkArtifactContent({
    content: `
# Button component spec

This spec cites knowledge/components/INDEX.md and knowledge/a11y/keyboard-and-focus.md. The anatomy has root, label, icon, and loading slots. Variants cover primary, secondary, destructive, and ghost. States cover hover, active, focus, disabled, and loading. The API uses props for variant, size, disabled, loading, and aria-label.

The foreground/background pair is --color-primary-foreground on --color-primary-default with a measured 4.8:1 contrast ratio. Keyboard behavior supports Tab, Enter, and Space with focus-visible styling. Screen reader behavior uses aria-disabled and an accessible name.

Responsive behavior covers mobile and desktop. Don't use the component for destructive confirmation flows.
    `,
    filePath: "button.md",
    routeId: "component-spec",
  });

  assert.equal(report.status, "pass");
  assert.equal(report.routeId, "component-spec");
  assert.ok(report.results.some((item) => item.id === "route-component-spec-component-contract" && item.level === "pass"));
});

test("checkArtifactContent warns about missing route-specific evidence", () => {
  const report = checkArtifactContent({
    content: GOOD_ARTIFACT,
    filePath: "button.md",
    routeId: "palette-from-brand",
  });

  assert.equal(report.status, "warn");
  assert.ok(report.results.some((item) => item.id === "route-palette-from-brand-palette-token-contract" && item.level === "warn"));
});

test("checkArtifactContent rejects unknown route ids", () => {
  assert.throws(
    () => checkArtifactContent({ content: GOOD_ARTIFACT, routeId: "component-spce" }),
    /Did you mean `component-spec`\?/,
  );
});

test("checkExampleArtifacts checks route examples as a batch", () => {
  const root = mkdtempSync(path.join(tmpdir(), "design-ai-check-examples-"));
  try {
    const examplePath = path.join(root, "examples/component-button.md");
    mkdirSync(path.dirname(examplePath), { recursive: true });
    writeFileSync(examplePath, `
# Button component spec

This component spec cites knowledge/components/INDEX.md and knowledge/a11y/keyboard-and-focus.md. The anatomy has root, label, icon, and loading slots. Variants cover primary, secondary, destructive, and ghost. States cover hover, active, focus, disabled, and loading. The API uses props for variant, size, disabled, loading, and aria-label.

The foreground/background pair is --color-primary-foreground on --color-primary-default with a measured 4.8:1 contrast ratio. Keyboard behavior supports Tab, Enter, and Space with focus-visible styling. Screen reader behavior uses aria-disabled and an accessible name.

Responsive behavior covers mobile and desktop. Don't use the component for destructive confirmation flows.
    `);

    const report = checkExampleArtifacts({
      designAiPath: root,
      routeId: "component-spec",
      limit: 1,
    });

    assert.equal(report.mode, "examples");
    assert.equal(report.status, "pass");
    assert.equal(report.total, 1);
    assert.equal(report.examples[0].example.relPath, "examples/component-button.md");
    assert.equal(report.examples[0].report.status, "pass");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("checkAllExampleArtifacts summarizes every route", () => {
  const root = mkdtempSync(path.join(tmpdir(), "design-ai-check-all-examples-"));
  try {
    const examplePath = path.join(root, "examples/component-button.md");
    mkdirSync(path.dirname(examplePath), { recursive: true });
    writeFileSync(examplePath, `
# Button component spec

This component spec cites knowledge/components/INDEX.md and knowledge/a11y/keyboard-and-focus.md. The anatomy has root, label, icon, and loading slots. Variants cover primary, secondary, destructive, and ghost. States cover hover, active, focus, disabled, and loading. The API uses props for variant, size, disabled, loading, and aria-label.

The foreground/background pair is --color-primary-foreground on --color-primary-default with a measured 4.8:1 contrast ratio. Keyboard behavior supports Tab, Enter, and Space with focus-visible styling. Screen reader behavior uses aria-disabled and an accessible name.

Responsive behavior covers mobile and desktop. Don't use the component for destructive confirmation flows.
    `);

    const report = checkAllExampleArtifacts({
      designAiPath: root,
      limit: 1,
    });
    const componentRoute = report.routes.find((route) => route.routeId === "component-spec");

    assert.equal(report.mode, "examples-all-routes");
    assert.equal(report.totalRoutes > 1, true);
    assert.equal(report.failedRoutes > 0, true);
    assert.equal(componentRoute.status, "pass");
    assert.equal(componentRoute.examples[0].example.relPath, "examples/component-button.md");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
