// Read-only linked-code inspection for the Website Improvement preview loop.

import {
  lstatSync,
  readFileSync,
  realpathSync,
} from "node:fs";
import path from "node:path";

const PACKAGE_MANIFEST_LIMIT = 1_000_000;
const START_SCRIPT_NAMES = ["dev", "preview", "start"];
const PROJECT_FILES = [
  ["pnpm-lock.yaml", "pnpm"],
  ["yarn.lock", "yarn"],
  ["bun.lock", "bun"],
  ["bun.lockb", "bun"],
  ["package-lock.json", "npm"],
  ["npm-shrinkwrap.json", "npm"],
];
const FRAMEWORK_PACKAGES = [
  ["next", "Next.js"],
  ["@remix-run/react", "Remix"],
  ["@sveltejs/kit", "SvelteKit"],
  ["nuxt", "Nuxt"],
  ["astro", "Astro"],
  ["vite", "Vite"],
  ["@angular/core", "Angular"],
  ["react-scripts", "Create React App"],
];

function fileExists(filePath) {
  try {
    return lstatSync(filePath).isFile();
  } catch {
    return false;
  }
}

function shellQuote(value) {
  const text = String(value || "");
  return /^[A-Za-z0-9_./:@+-]+$/.test(text)
    ? text
    : `'${text.replaceAll("'", `'\"'\"'`)}'`;
}

function readPackageManifest(root, issues) {
  const manifestPath = path.join(root, "package.json");
  let entry;

  try {
    entry = lstatSync(manifestPath);
  } catch (error) {
    if (error.code === "ENOENT") return null;
    issues.push({
      level: "fail",
      id: "package-manifest-unavailable",
      message: `Could not inspect package.json metadata: ${error.message}`,
    });
    return null;
  }

  if (entry.isSymbolicLink()) {
    issues.push({
      level: "fail",
      id: "package-manifest-symlink",
      message: "Linked preview does not follow a symbolic-link package.json.",
    });
    return null;
  }
  if (!entry.isFile()) return null;

  try {
    if (entry.size > PACKAGE_MANIFEST_LIMIT) {
      issues.push({
        level: "fail",
        id: "package-manifest-too-large",
        message: "package.json is larger than the 1 MB linked-preview metadata limit.",
      });
      return null;
    }
    const value = JSON.parse(readFileSync(manifestPath, "utf8"));
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("package.json root must be an object");
    }
    return value;
  } catch (error) {
    issues.push({
      level: "fail",
      id: "package-manifest-invalid",
      message: `Could not read package.json metadata: ${error.message}`,
    });
    return null;
  }
}

function detectPackageManager(root, manifest) {
  const declared = String(manifest?.packageManager || "").split("@")[0];
  if (["npm", "pnpm", "yarn", "bun"].includes(declared)) return declared;

  const lockfile = PROJECT_FILES.find(([fileName]) => fileExists(path.join(root, fileName)));
  return lockfile ? lockfile[1] : manifest ? "npm" : "";
}

function detectFramework(manifest) {
  const dependencies = {
    ...(manifest?.dependencies || {}),
    ...(manifest?.devDependencies || {}),
  };
  const match = FRAMEWORK_PACKAGES.find(([packageName]) => packageName in dependencies);
  return match ? match[1] : "Unknown";
}

function collectScripts(manifest, packageManager) {
  const scripts = manifest?.scripts && typeof manifest.scripts === "object"
    ? manifest.scripts
    : {};
  return Object.entries(scripts)
    .filter(([name, command]) => name && typeof command === "string" && command.trim())
    .map(([name, command]) => ({
      name,
      command: command.trim(),
      run: `${packageManager || "npm"} run ${name}`,
    }));
}

function linkedPreviewStatus(issues) {
  if (issues.some((issue) => issue.level === "fail")) return "fail";
  if (issues.some((issue) => issue.level === "warn")) return "warn";
  return "pass";
}

function stageStatus(condition, ready = "manual") {
  return condition ? ready : "blocked";
}

export function buildSiteLinkedPreviewReport(workspace, { filePath = "<workspace.json>" } = {}) {
  const profile = workspace?.siteProfile || {};
  const configuredPath = String(profile.localPath || "").trim();
  const issues = [];
  let resolvedPath = "";
  let exists = false;
  let isDirectory = false;
  let isSymbolicLink = false;
  let manifest = null;
  let staticEntry = false;

  if (!configuredPath) {
    issues.push({
      level: "fail",
      id: "linked-path-missing",
      message: "siteProfile.localPath is required for linked preview inspection.",
    });
  } else if (!path.isAbsolute(configuredPath)) {
    issues.push({
      level: "fail",
      id: "linked-path-not-absolute",
      message: "siteProfile.localPath must be an absolute path.",
    });
  } else {
    try {
      const entry = lstatSync(configuredPath);
      exists = true;
      isSymbolicLink = entry.isSymbolicLink();
      if (isSymbolicLink) {
        issues.push({
          level: "fail",
          id: "linked-path-symlink",
          message: "Linked preview does not follow symbolic links. Use the resolved target directory path explicitly.",
        });
      } else {
        isDirectory = entry.isDirectory();
        resolvedPath = realpathSync(configuredPath);
        if (!isDirectory) {
          issues.push({
            level: "fail",
            id: "linked-path-not-directory",
            message: "siteProfile.localPath must point to a directory.",
          });
        }
      }
    } catch (error) {
      issues.push({
        level: "fail",
        id: "linked-path-unavailable",
        message: `Could not inspect siteProfile.localPath: ${error.message}`,
      });
    }
  }

  if (isDirectory && !isSymbolicLink) {
    manifest = readPackageManifest(resolvedPath, issues);
    staticEntry = fileExists(path.join(resolvedPath, "index.html"));
    if (!manifest && !staticEntry && !issues.some((issue) => issue.level === "fail")) {
      issues.push({
        level: "warn",
        id: "linked-project-entry-missing",
        message: "No package.json or root index.html was found. Add an explicit preview command in the target repo before runtime verification.",
      });
    }
  }

  const packageManager = detectPackageManager(resolvedPath, manifest);
  const scripts = collectScripts(manifest, packageManager);
  const startScript = START_SCRIPT_NAMES.map((name) => scripts.find((script) => script.name === name)).find(Boolean) || null;
  const startCommand = startScript?.run || (staticEntry ? "python3 -m http.server 4173" : "");
  if (isDirectory && !startCommand && !issues.some((issue) => issue.level === "fail")) {
    issues.push({
      level: "warn",
      id: "preview-command-missing",
      message: "No dev, preview, or start script is available for the manual preview step.",
    });
  }
  if (isDirectory && startCommand && !issues.some((issue) => issue.level === "fail")) {
    issues.push({
      level: "pass",
      id: "linked-project-ready",
      message: "Linked project metadata is ready for an operator-controlled preview start.",
    });
  }

  const refreshTarget = filePath === "--stdin" ? "<workspace.json>" : filePath;
  const linkedReady = isDirectory && !isSymbolicLink && !issues.some((issue) => issue.level === "fail");
  const startReady = linkedReady && Boolean(startCommand);

  return {
    kind: "website-improvement-linked-preview",
    version: 1,
    status: linkedPreviewStatus(issues),
    source: {
      workspace: filePath,
      siteId: String(profile.id || ""),
      siteName: String(profile.name || ""),
    },
    linkedCode: {
      configuredPath,
      resolvedPath,
      exists,
      directory: isDirectory,
      symbolicLink: isSymbolicLink,
      manifest: manifest ? "package.json" : "",
      staticEntry: staticEntry ? "index.html" : "",
      packageManager,
      framework: manifest ? detectFramework(manifest) : (staticEntry ? "Static HTML" : "Unknown"),
      scripts,
      startScript: startScript?.name || "",
      startCommand,
    },
    preview: {
      url: String(profile.liveUrl || ""),
      configured: Boolean(String(profile.liveUrl || "").trim()),
      processStatus: "not-started",
      probeStatus: "not-run",
      verificationStatus: "not-recorded",
    },
    stages: [
      { id: "link-code", label: "Link code folder", status: linkedReady ? "pass" : "blocked" },
      { id: "inspect-project", label: "Inspect project metadata", status: linkedReady ? "pass" : "blocked" },
      { id: "start-preview", label: "Start preview manually", status: stageStatus(startReady), command: startCommand },
      { id: "verify-browser", label: "Verify responsive, accessibility, and runtime behavior", status: stageStatus(startReady) },
      { id: "record-evidence", label: "Record target-repo verification evidence", status: stageStatus(startReady) },
    ],
    commands: {
      refresh: `design-ai site ${shellQuote(refreshTarget)} --linked-preview --json`,
      start: startCommand,
    },
    boundaries: {
      readOnly: true,
      externalCalls: false,
      targetRepoMutation: false,
      startsPreviewProcess: false,
      readsSourceFiles: false,
      metadataFiles: ["package.json", "supported root lockfile", "index.html existence"],
      approvalRequiredBeforeTargetRepoMutation: true,
    },
    issues,
  };
}

export function formatSiteLinkedPreviewJson(report) {
  return JSON.stringify(report, null, 2);
}

export function formatSiteLinkedPreviewHuman(report) {
  const lines = [
    "# Linked Code Preview Readiness",
    "",
    `Status: ${report.status}`,
    `Site: ${report.source.siteName || "not provided"}`,
    `Linked path: ${report.linkedCode.resolvedPath || report.linkedCode.configuredPath || "not provided"}`,
    `Project: ${report.linkedCode.framework} / ${report.linkedCode.packageManager || "no package manager"}`,
    `Preview URL: ${report.preview.url || "not provided"}`,
    `Preview process: ${report.preview.processStatus}; browser probe: ${report.preview.probeStatus}; evidence: ${report.preview.verificationStatus}`,
    "",
    "## Manual loop",
    ...report.stages.map((stage) => `- [${stage.status}] ${stage.label}${stage.command ? `: ${stage.command}` : ""}`),
    "",
    "## Boundaries",
    "- Reads root project metadata only.",
    "- Does not start a process, call an external service, scan source files, or mutate the target repository.",
    "- Target-repository changes still require explicit approval.",
    "",
    "## Issues",
    ...report.issues.map((issue) => `- [${issue.level}] ${issue.id}: ${issue.message}`),
  ];
  return lines.join("\n");
}
