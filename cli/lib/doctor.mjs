// Environment diagnostics for `design-ai doctor`.

import { spawnSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
  readlinkSync,
} from "node:fs";
import path from "node:path";

import {
  DESIGN_AI_HOME,
  CLAUDE_HOME,
  SYMLINK_PREFIX,
} from "./paths.mjs";

export const STATUS = {
  PASS: "PASS",
  WARN: "WARN",
  FAIL: "FAIL",
};

function exists(p) {
  try {
    return existsSync(p);
  } catch {
    return false;
  }
}

function safeReadJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

function addCheck(checks, status, label, detail, action = "") {
  checks.push({ status, label, detail, action });
}

export function summarizeChecks(checks) {
  return checks.reduce(
    (acc, check) => {
      acc[check.status.toLowerCase()] += 1;
      return acc;
    },
    { pass: 0, warn: 0, fail: 0 },
  );
}

export function isNodeVersionSupported(version = process.versions.node) {
  const major = Number(String(version).split(".")[0]);
  return Number.isFinite(major) && major >= 18;
}

function commandAvailable(command, args = ["--version"]) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    timeout: 5000,
  });
  return {
    ok: result.status === 0,
    version: (result.stdout || result.stderr || "").trim().split("\n")[0],
    error: result.error?.message || "",
  };
}

function isInsidePath(parent, child) {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

function listDirs(dir) {
  if (!exists(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function listMarkdownFiles(dir) {
  if (!exists(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => name.endsWith(".md") && name !== "README.md")
    .sort();
}

function expectedItems(sourceRoot) {
  return {
    skills: listDirs(path.join(sourceRoot, "skills")),
    agents: listMarkdownFiles(path.join(sourceRoot, "agents")),
    commands: listMarkdownFiles(path.join(sourceRoot, "commands")),
  };
}

export function inspectExpectedLinks({ targetDir, sourceRoot, prefix, itemNames }) {
  if (!exists(targetDir)) {
    return {
      targetExists: false,
      expected: itemNames.length,
      installed: 0,
      missing: itemNames.length,
      blocked: 0,
      wrongTarget: 0,
    };
  }

  let installed = 0;
  let missing = 0;
  let blocked = 0;
  let wrongTarget = 0;

  for (const itemName of itemNames) {
    const target = path.join(targetDir, `${prefix}${itemName}`);
    let stat;
    try {
      stat = lstatSync(target);
    } catch {
      missing += 1;
      continue;
    }

    if (!stat.isSymbolicLink()) {
      blocked += 1;
      continue;
    }

    const linkTarget = readlinkSync(target);
    const resolved = path.resolve(targetDir, linkTarget);
    if (isInsidePath(sourceRoot, resolved)) {
      installed += 1;
    } else {
      wrongTarget += 1;
    }
  }

  return {
    targetExists: true,
    expected: itemNames.length,
    installed,
    missing,
    blocked,
    wrongTarget,
  };
}

function addLinkCheck(checks, label, result) {
  if (!result.targetExists) {
    addCheck(
      checks,
      STATUS.WARN,
      label,
      `target directory is missing; expected ${result.expected} link(s)`,
      "Run `design-ai install`.",
    );
    return;
  }

  if (result.blocked > 0 || result.wrongTarget > 0) {
    addCheck(
      checks,
      STATUS.FAIL,
      label,
      `${result.installed}/${result.expected} installed; ${result.blocked} blocked path(s), ${result.wrongTarget} stale/foreign link(s)`,
      "Resolve the conflicting target paths, then run `design-ai install`.",
    );
    return;
  }

  if (result.installed === result.expected) {
    addCheck(checks, STATUS.PASS, label, `${result.installed}/${result.expected} installed`);
    return;
  }

  addCheck(
    checks,
    STATUS.WARN,
    label,
    `${result.installed}/${result.expected} installed; ${result.missing} missing`,
    "Run `design-ai install`.",
  );
}

export function collectDoctorReport(options = {}) {
  const sourceRoot = options.sourceRoot || DESIGN_AI_HOME;
  const claudeHome = options.claudeHome || CLAUDE_HOME;
  const prefix = options.prefix || SYMLINK_PREFIX;
  const checks = [];

  const paths = {
    packageJson: path.join(sourceRoot, "package.json"),
    pluginManifest: path.join(sourceRoot, ".claude-plugin", "plugin.json"),
    installScript: path.join(sourceRoot, "install.sh"),
    auditRunner: path.join(sourceRoot, "tools", "audit", "run-all.py"),
    doctorAssertionsAudit: path.join(sourceRoot, "tools", "audit", "doctor_assertions.py"),
    smokeAssertionsAudit: path.join(sourceRoot, "tools", "audit", "smoke_assertions.py"),
    exampleQaAudit: path.join(sourceRoot, "tools", "audit", "example-qa.py"),
    packageContentsAudit: path.join(sourceRoot, "tools", "audit", "package-contents.py"),
    packageSmokeAudit: path.join(sourceRoot, "tools", "audit", "package-smoke.py"),
    registrySmokeAudit: path.join(sourceRoot, "tools", "audit", "registry-smoke.py"),
    skillsDir: path.join(sourceRoot, "skills"),
    agentsDir: path.join(sourceRoot, "agents"),
    commandsDir: path.join(sourceRoot, "commands"),
  };

  const required = [
    paths.packageJson,
    paths.pluginManifest,
    paths.installScript,
    paths.auditRunner,
    paths.doctorAssertionsAudit,
    paths.smokeAssertionsAudit,
    paths.exampleQaAudit,
    paths.packageContentsAudit,
    paths.packageSmokeAudit,
    paths.registrySmokeAudit,
    paths.skillsDir,
    paths.agentsDir,
    paths.commandsDir,
  ];
  const missingRequired = required.filter((p) => !exists(p));

  if (missingRequired.length === 0) {
    addCheck(checks, STATUS.PASS, "Source layout", `complete at ${sourceRoot}`);
  } else {
    addCheck(
      checks,
      STATUS.FAIL,
      "Source layout",
      `${missingRequired.length} required path(s) missing`,
      "Ensure DESIGN_AI_HOME points at the design-ai repo or npm package root.",
    );
  }

  const pkg = safeReadJson(paths.packageJson);
  const manifest = safeReadJson(paths.pluginManifest);

  if (!pkg) {
    addCheck(checks, STATUS.FAIL, "package.json", "missing or invalid JSON");
  }
  if (!manifest) {
    addCheck(checks, STATUS.FAIL, "Plugin manifest", "missing or invalid JSON");
  }
  if (pkg && manifest) {
    if (pkg.version === manifest.version) {
      addCheck(checks, STATUS.PASS, "Version alignment", `${pkg.version}`);
    } else {
      addCheck(
        checks,
        STATUS.FAIL,
        "Version alignment",
        `package.json=${pkg.version || "unknown"}, plugin.json=${manifest.version || "unknown"}`,
        "Align package.json and .claude-plugin/plugin.json before release.",
      );
    }

    const manifestEntries = [
      ...(manifest.skills || []),
      ...(manifest.commands || []),
      ...(manifest.agents || []),
    ];
    const missingManifestPaths = manifestEntries
      .map((entry) => entry.path)
      .filter(Boolean)
      .filter((entryPath) => !exists(path.join(sourceRoot, entryPath)));

    if (missingManifestPaths.length === 0) {
      addCheck(
        checks,
        STATUS.PASS,
        "Manifest paths",
        `${manifestEntries.length} referenced artifact(s) exist`,
      );
    } else {
      addCheck(
        checks,
        STATUS.FAIL,
        "Manifest paths",
        `${missingManifestPaths.length} referenced artifact(s) missing`,
        "Fix .claude-plugin/plugin.json paths or restore the missing files.",
      );
    }
  }

  if (isNodeVersionSupported()) {
    addCheck(checks, STATUS.PASS, "Node runtime", `v${process.versions.node}`);
  } else {
    addCheck(
      checks,
      STATUS.FAIL,
      "Node runtime",
      `v${process.versions.node}; expected >=18`,
      "Install Node.js 18 or newer.",
    );
  }

  const python = commandAvailable("python3");
  if (python.ok) {
    addCheck(checks, STATUS.PASS, "Python runtime", python.version || "python3 available");
  } else {
    addCheck(
      checks,
      STATUS.FAIL,
      "Python runtime",
      python.error || "python3 not available",
      "Install python3 to run `design-ai audit`.",
    );
  }

  if (exists(paths.auditRunner)) {
    addCheck(checks, STATUS.PASS, "Audit runner", "tools/audit/run-all.py found");
  } else {
    addCheck(
      checks,
      STATUS.FAIL,
      "Audit runner",
      "tools/audit/run-all.py missing",
      "Reinstall design-ai or restore tools/audit/.",
    );
  }

  if (exists(paths.doctorAssertionsAudit)) {
    addCheck(
      checks,
      STATUS.PASS,
      "Doctor assertions helper",
      "tools/audit/doctor_assertions.py found",
    );
  } else {
    addCheck(
      checks,
      STATUS.FAIL,
      "Doctor assertions helper",
      "tools/audit/doctor_assertions.py missing",
      "Reinstall design-ai or restore tools/audit/doctor_assertions.py.",
    );
  }

  if (exists(paths.smokeAssertionsAudit)) {
    addCheck(
      checks,
      STATUS.PASS,
      "Smoke assertions helper",
      "tools/audit/smoke_assertions.py found",
    );
  } else {
    addCheck(
      checks,
      STATUS.FAIL,
      "Smoke assertions helper",
      "tools/audit/smoke_assertions.py missing",
      "Reinstall design-ai or restore tools/audit/smoke_assertions.py.",
    );
  }

  if (exists(paths.exampleQaAudit)) {
    addCheck(checks, STATUS.PASS, "Example QA audit", "tools/audit/example-qa.py found");
  } else {
    addCheck(
      checks,
      STATUS.FAIL,
      "Example QA audit",
      "tools/audit/example-qa.py missing",
      "Reinstall design-ai or restore tools/audit/example-qa.py.",
    );
  }

  if (exists(paths.packageContentsAudit)) {
    addCheck(
      checks,
      STATUS.PASS,
      "Package contents check",
      "tools/audit/package-contents.py found",
    );
  } else {
    addCheck(
      checks,
      STATUS.FAIL,
      "Package contents check",
      "tools/audit/package-contents.py missing",
      "Reinstall design-ai or restore tools/audit/package-contents.py.",
    );
  }

  if (exists(paths.packageSmokeAudit)) {
    addCheck(checks, STATUS.PASS, "Package smoke check", "tools/audit/package-smoke.py found");
  } else {
    addCheck(
      checks,
      STATUS.FAIL,
      "Package smoke check",
      "tools/audit/package-smoke.py missing",
      "Reinstall design-ai or restore tools/audit/package-smoke.py.",
    );
  }

  if (exists(paths.registrySmokeAudit)) {
    addCheck(
      checks,
      STATUS.PASS,
      "Registry smoke check",
      "tools/audit/registry-smoke.py found",
    );
  } else {
    addCheck(
      checks,
      STATUS.FAIL,
      "Registry smoke check",
      "tools/audit/registry-smoke.py missing",
      "Reinstall design-ai or restore tools/audit/registry-smoke.py.",
    );
  }

  const items = expectedItems(sourceRoot);
  addLinkCheck(
    checks,
    "Installed skills",
    inspectExpectedLinks({
      targetDir: path.join(claudeHome, "skills"),
      sourceRoot,
      prefix,
      itemNames: items.skills,
    }),
  );
  addLinkCheck(
    checks,
    "Installed agents",
    inspectExpectedLinks({
      targetDir: path.join(claudeHome, "agents"),
      sourceRoot,
      prefix,
      itemNames: items.agents,
    }),
  );
  addLinkCheck(
    checks,
    "Installed slash commands",
    inspectExpectedLinks({
      targetDir: path.join(claudeHome, "commands"),
      sourceRoot,
      prefix,
      itemNames: items.commands,
    }),
  );

  return {
    context: {
      sourceRoot,
      claudeHome,
      prefix,
      expected: {
        skills: items.skills.length,
        agents: items.agents.length,
        commands: items.commands.length,
      },
    },
    checks,
    summary: summarizeChecks(checks),
  };
}
