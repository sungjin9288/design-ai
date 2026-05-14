// Tests for cli/lib/examples.mjs worked example discovery.

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
  listExamples,
  parseExamplesArgs,
} from "./examples.mjs";

function makeFixture() {
  const root = mkdtempSync(path.join(tmpdir(), "design-ai-examples-"));
  const files = {
    "examples/README.md": "# Examples",
    "examples/component-button.md": "# Button\n\nKeyboard focus, aria-label, and responsive button behavior.",
    "examples/component-carousel.md": "# Carousel\n\nMotion transition uses 250ms ease-out, reduced motion handling, and responsive slides.",
    "examples/component-game-hud.md": "# GameHUD\n\nGame HUD overlay for score and status.",
    "examples/component-game-menu.md": "# GameMenu\n\nGame menu with keyboard focus, controller input, and responsive pause navigation.",
    "examples/component-menu.md": "# Menu\n\nGeneric menu component.",
    "examples/palette-saas-violet.md": "# SaaS violet palette\n\nOKLCH colors with 4.8:1 contrast.",
    "examples/print-business-card-spec.md": "# Business card\n\nCMYK print guidance.",
    "examples/cases/dogfood-v4.md": "# Dogfood review\n\nAudit and QA findings.",
  };

  for (const [file, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    writeFileSync(path.join(root, file), content);
  }

  return root;
}

test("parseExamplesArgs supports query, route, limit, and json", () => {
  assert.deepEqual(parseExamplesArgs(["button", "spec", "--route", "component-spec", "--limit", "3", "--json"]), {
    queryParts: ["button", "spec"],
    query: "button spec",
    routeId: "component-spec",
    limit: 3,
    json: true,
    help: false,
  });
});

test("parseExamplesArgs rejects invalid options", () => {
  assert.throws(() => parseExamplesArgs(["--route"]), /--route expects a route id/);
  assert.throws(() => parseExamplesArgs(["--limit", "0"]), /--limit/);
  assert.throws(() => parseExamplesArgs(["--bad"]), /Unknown examples option/);
  assert.throws(() => parseExamplesArgs(["--rouet", "component-spec"]), /Did you mean `--route`\?/);
});

test("listExamples searches examples and excludes README", () => {
  const root = makeFixture();
  try {
    const result = listExamples({
      designAiPath: root,
      query: "button",
      limit: 5,
    });

    assert.equal(result.examples.length, 1);
    assert.equal(result.examples[0].relPath, path.join("examples", "component-button.md"));
    assert.equal(result.examples[0].category, "component");
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("listExamples can bias results by route id", () => {
  const root = makeFixture();
  try {
    const result = listExamples({
      designAiPath: root,
      routeId: "palette-from-brand",
      limit: 5,
    });

    assert.equal(result.routeId, "palette-from-brand");
    assert.ok(result.effectiveQuery.includes("palette"));
    assert.equal(result.examples[0].relPath, path.join("examples", "palette-saas-violet.md"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("listExamples prefers canonical route examples over alphabetical component matches", () => {
  const root = makeFixture();
  try {
    writeFileSync(path.join(root, "examples", "component-accordion.md"), "# Accordion\n\nComponent with Korean text but no citation or contrast.");

    const result = listExamples({
      designAiPath: root,
      routeId: "component-spec",
      limit: 5,
    });

    assert.equal(result.examples[0].relPath, path.join("examples", "component-button.md"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("listExamples prefers the canonical motion example over generic motion matches", () => {
  const root = makeFixture();
  try {
    const result = listExamples({
      designAiPath: root,
      routeId: "motion-design",
      limit: 5,
    });

    assert.equal(result.examples[0].relPath, path.join("examples", "component-carousel.md"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("listExamples prefers the canonical game UI example over generic menus", () => {
  const root = makeFixture();
  try {
    const result = listExamples({
      designAiPath: root,
      routeId: "game-ui",
      limit: 5,
    });

    assert.equal(result.examples[0].relPath, path.join("examples", "component-game-menu.md"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("listExamples boosts route category and skips scaffolded drafts", () => {
  const root = makeFixture();
  try {
    writeFileSync(path.join(root, "examples", "component-command.md"), "# Command Palette\n\nPalette command component.");
    writeFileSync(path.join(root, "examples", "component-draft.md"), "# Draft\n\nDRAFT — scaffolded 2026-05-10 via TS-AST\n\nButton component.");

    const paletteResult = listExamples({
      designAiPath: root,
      routeId: "palette-from-brand",
      limit: 5,
    });
    const componentResult = listExamples({
      designAiPath: root,
      query: "button component",
      limit: 5,
    });

    assert.equal(paletteResult.examples[0].relPath, path.join("examples", "palette-saas-violet.md"));
    assert.equal(componentResult.examples.some((example) => example.relPath.endsWith("component-draft.md")), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("listExamples prefers exact component stem matches over related variants", () => {
  const root = makeFixture();
  try {
    writeFileSync(path.join(root, "examples", "component-button-group.md"), "# ButtonGroup\n\nButton component group.");

    const result = listExamples({
      designAiPath: root,
      query: "button component",
      routeId: "component-spec",
      limit: 5,
    });

    assert.equal(result.examples[0].relPath, path.join("examples", "component-button.md"));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("listExamples rejects unknown route ids", () => {
  const root = makeFixture();
  try {
    assert.throws(
      () => listExamples({ designAiPath: root, routeId: "component-spce" }),
      /Did you mean `component-spec`\?/,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
