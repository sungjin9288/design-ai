// Tests for cli/lib/doctor.mjs diagnostics helpers.

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  REPOSITORY_AUDIT_SCRIPTS,
  STATUS,
  collectDoctorReport,
  inspectExpectedLinks,
  isNodeVersionSupported,
  summarizeChecks,
} from "./doctor.mjs";

function writeJson(filePath, value) {
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function createMinimalSource({
  includeDoctorAssertionsAudit = true,
  includeSmokeAssertionsAudit = true,
  includeExampleQaAudit = true,
  includePackageContentsAudit = true,
  includePackageSmokeAudit = true,
  includeRegistrySmokeAudit = true,
  missingRepositoryAuditScript = "",
} = {}) {
  const tmp = mkdtempSync(path.join(tmpdir(), "design-ai-doctor-"));
  const sourceRoot = path.join(tmp, "source");

  mkdirSync(path.join(sourceRoot, ".claude-plugin"), { recursive: true });
  mkdirSync(path.join(sourceRoot, "skills"), { recursive: true });
  mkdirSync(path.join(sourceRoot, "agents"), { recursive: true });
  mkdirSync(path.join(sourceRoot, "commands"), { recursive: true });
  mkdirSync(path.join(sourceRoot, "tools", "audit"), { recursive: true });

  writeJson(path.join(sourceRoot, "package.json"), { version: "1.2.3" });
  writeJson(path.join(sourceRoot, ".claude-plugin", "plugin.json"), {
    version: "1.2.3",
    skills: [],
    commands: [],
    agents: [],
  });
  writeFileSync(path.join(sourceRoot, "install.sh"), "#!/usr/bin/env bash\n");
  writeFileSync(path.join(sourceRoot, "tools", "audit", "run-all.py"), "# audit runner\n");

  for (const script of REPOSITORY_AUDIT_SCRIPTS) {
    if (script === missingRepositoryAuditScript) continue;
    if (script === "example-qa.py" && !includeExampleQaAudit) continue;
    writeFileSync(path.join(sourceRoot, "tools", "audit", script), `# ${script}\n`);
  }

  if (includeDoctorAssertionsAudit) {
    writeFileSync(
      path.join(sourceRoot, "tools", "audit", "doctor_assertions.py"),
      "# doctor assertions\n",
    );
  }
  if (includeSmokeAssertionsAudit) {
    writeFileSync(
      path.join(sourceRoot, "tools", "audit", "smoke_assertions.py"),
      "# smoke assertions\n",
    );
  }
  if (includePackageContentsAudit) {
    writeFileSync(
      path.join(sourceRoot, "tools", "audit", "package-contents.py"),
      "# package contents\n",
    );
  }
  if (includePackageSmokeAudit) {
    writeFileSync(path.join(sourceRoot, "tools", "audit", "package-smoke.py"), "# package smoke\n");
  }
  if (includeRegistrySmokeAudit) {
    writeFileSync(
      path.join(sourceRoot, "tools", "audit", "registry-smoke.py"),
      "# registry smoke\n",
    );
  }

  return { tmp, sourceRoot };
}

function checkByLabel(report, label) {
  const check = report.checks.find((candidate) => candidate.label === label);
  assert.ok(check, `Expected check "${label}" to exist`);
  return check;
}

test("isNodeVersionSupported enforces Node 18+", () => {
  assert.equal(isNodeVersionSupported("18.0.0"), true);
  assert.equal(isNodeVersionSupported("20.11.1"), true);
  assert.equal(isNodeVersionSupported("17.9.1"), false);
  assert.equal(isNodeVersionSupported("not-a-version"), false);
});

test("summarizeChecks counts pass, warn, and fail states", () => {
  const summary = summarizeChecks([
    { status: STATUS.PASS },
    { status: STATUS.PASS },
    { status: STATUS.WARN },
    { status: STATUS.FAIL },
  ]);

  assert.deepEqual(summary, { pass: 2, warn: 1, fail: 1 });
});

test("inspectExpectedLinks reports missing target directory", () => {
  const tmp = mkdtempSync(path.join(tmpdir(), "design-ai-doctor-"));
  try {
    const result = inspectExpectedLinks({
      targetDir: path.join(tmp, "missing"),
      sourceRoot: path.join(tmp, "source"),
      prefix: "design-",
      itemNames: ["a", "b"],
    });

    assert.deepEqual(result, {
      targetExists: false,
      expected: 2,
      installed: 0,
      missing: 2,
      blocked: 0,
      wrongTarget: 0,
    });
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("collectDoctorReport passes source layout when required audit scripts exist", () => {
  const { tmp, sourceRoot } = createMinimalSource();
  try {
    const report = collectDoctorReport({
      sourceRoot,
      claudeHome: path.join(tmp, "claude"),
      prefix: "design-",
    });

    assert.equal(checkByLabel(report, "Source layout").status, STATUS.PASS);
    assert.equal(checkByLabel(report, "Audit runner").status, STATUS.PASS);
    assert.equal(checkByLabel(report, "Audit scripts").status, STATUS.PASS);
    assert.equal(checkByLabel(report, "Doctor assertions helper").status, STATUS.PASS);
    assert.equal(checkByLabel(report, "Smoke assertions helper").status, STATUS.PASS);
    assert.equal(checkByLabel(report, "Example QA audit").status, STATUS.PASS);
    assert.equal(checkByLabel(report, "Package contents check").status, STATUS.PASS);
    assert.equal(checkByLabel(report, "Package smoke check").status, STATUS.PASS);
    assert.equal(checkByLabel(report, "Registry smoke check").status, STATUS.PASS);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("collectDoctorReport fails when a run-all dependency audit script is missing", () => {
  const { tmp, sourceRoot } = createMinimalSource({ missingRepositoryAuditScript: "link-check.py" });
  try {
    const report = collectDoctorReport({
      sourceRoot,
      claudeHome: path.join(tmp, "claude"),
      prefix: "design-",
    });
    const auditScriptsCheck = checkByLabel(report, "Audit scripts");

    assert.equal(checkByLabel(report, "Source layout").status, STATUS.FAIL);
    assert.equal(auditScriptsCheck.status, STATUS.FAIL);
    assert.match(auditScriptsCheck.detail, /1\/7 missing: link-check\.py/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("collectDoctorReport fails when example QA audit script is missing", () => {
  const { tmp, sourceRoot } = createMinimalSource({ includeExampleQaAudit: false });
  try {
    const report = collectDoctorReport({
      sourceRoot,
      claudeHome: path.join(tmp, "claude"),
      prefix: "design-",
    });
    const exampleQaCheck = checkByLabel(report, "Example QA audit");

    assert.equal(checkByLabel(report, "Source layout").status, STATUS.FAIL);
    assert.equal(exampleQaCheck.status, STATUS.FAIL);
    assert.match(exampleQaCheck.detail, /example-qa\.py missing/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("collectDoctorReport fails when doctor assertions helper is missing", () => {
  const { tmp, sourceRoot } = createMinimalSource({ includeDoctorAssertionsAudit: false });
  try {
    const report = collectDoctorReport({
      sourceRoot,
      claudeHome: path.join(tmp, "claude"),
      prefix: "design-",
    });
    const helperCheck = checkByLabel(report, "Doctor assertions helper");

    assert.equal(checkByLabel(report, "Source layout").status, STATUS.FAIL);
    assert.equal(helperCheck.status, STATUS.FAIL);
    assert.match(helperCheck.detail, /doctor_assertions\.py missing/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("collectDoctorReport fails when smoke assertions helper is missing", () => {
  const { tmp, sourceRoot } = createMinimalSource({ includeSmokeAssertionsAudit: false });
  try {
    const report = collectDoctorReport({
      sourceRoot,
      claudeHome: path.join(tmp, "claude"),
      prefix: "design-",
    });
    const helperCheck = checkByLabel(report, "Smoke assertions helper");

    assert.equal(checkByLabel(report, "Source layout").status, STATUS.FAIL);
    assert.equal(helperCheck.status, STATUS.FAIL);
    assert.match(helperCheck.detail, /smoke_assertions\.py missing/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("collectDoctorReport fails when package contents audit script is missing", () => {
  const { tmp, sourceRoot } = createMinimalSource({ includePackageContentsAudit: false });
  try {
    const report = collectDoctorReport({
      sourceRoot,
      claudeHome: path.join(tmp, "claude"),
      prefix: "design-",
    });
    const packageContentsCheck = checkByLabel(report, "Package contents check");

    assert.equal(checkByLabel(report, "Source layout").status, STATUS.FAIL);
    assert.equal(packageContentsCheck.status, STATUS.FAIL);
    assert.match(packageContentsCheck.detail, /package-contents\.py missing/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("collectDoctorReport fails when package smoke script is missing", () => {
  const { tmp, sourceRoot } = createMinimalSource({ includePackageSmokeAudit: false });
  try {
    const report = collectDoctorReport({
      sourceRoot,
      claudeHome: path.join(tmp, "claude"),
      prefix: "design-",
    });
    const packageSmokeCheck = checkByLabel(report, "Package smoke check");

    assert.equal(checkByLabel(report, "Source layout").status, STATUS.FAIL);
    assert.equal(packageSmokeCheck.status, STATUS.FAIL);
    assert.match(packageSmokeCheck.detail, /package-smoke\.py missing/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("collectDoctorReport fails when registry smoke script is missing", () => {
  const { tmp, sourceRoot } = createMinimalSource({ includeRegistrySmokeAudit: false });
  try {
    const report = collectDoctorReport({
      sourceRoot,
      claudeHome: path.join(tmp, "claude"),
      prefix: "design-",
    });
    const registrySmokeCheck = checkByLabel(report, "Registry smoke check");

    assert.equal(checkByLabel(report, "Source layout").status, STATUS.FAIL);
    assert.equal(registrySmokeCheck.status, STATUS.FAIL);
    assert.match(registrySmokeCheck.detail, /registry-smoke\.py missing/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("inspectExpectedLinks separates installed, missing, blocked, and foreign links", () => {
  const tmp = mkdtempSync(path.join(tmpdir(), "design-ai-doctor-"));
  try {
    const sourceRoot = path.join(tmp, "source");
    const targetDir = path.join(tmp, "target");
    const outsideRoot = path.join(tmp, "outside");
    mkdirSync(path.join(sourceRoot, "a"), { recursive: true });
    mkdirSync(path.join(sourceRoot, "b"), { recursive: true });
    mkdirSync(outsideRoot, { recursive: true });
    mkdirSync(targetDir, { recursive: true });

    symlinkSync(path.join(sourceRoot, "a"), path.join(targetDir, "design-a"), "dir");
    writeFileSync(path.join(targetDir, "design-b"), "blocks install");
    symlinkSync(outsideRoot, path.join(targetDir, "design-d"), "dir");

    const result = inspectExpectedLinks({
      targetDir,
      sourceRoot,
      prefix: "design-",
      itemNames: ["a", "b", "c", "d"],
    });

    assert.deepEqual(result, {
      targetExists: true,
      expected: 4,
      installed: 1,
      missing: 1,
      blocked: 1,
      wrongTarget: 1,
    });
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
