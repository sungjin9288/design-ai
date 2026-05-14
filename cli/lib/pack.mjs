// Prompt + context bundle generation for `design-ai pack`.

import { readFileSync } from "node:fs";

import { parseBriefSourceFlag } from "./brief.mjs";
import { SYMLINK_PREFIX } from "./paths.mjs";
import { parseOutputFlags } from "./output.mjs";
import { buildPromptPlan } from "./prompt.mjs";
import { resolveShowFile } from "./show.mjs";

const DEFAULT_MAX_BYTES = 120_000;

export function parsePackArgs(args) {
  const out = {
    briefParts: [],
    fromFile: "",
    stdin: false,
    routeId: "",
    maxBytes: DEFAULT_MAX_BYTES,
    json: false,
    outPath: "",
    force: false,
    help: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "-h" || arg === "--help") {
      out.help = true;
    } else if (arg === "--json") {
      out.json = true;
    } else {
      out.index = i;
      if (parseBriefSourceFlag(args, out) || parseOutputFlags(args, out)) {
        i = out.index;
        continue;
      }

      if (arg === "--max-bytes") {
        const maxBytes = Number(args[i + 1]);
        if (!Number.isInteger(maxBytes) || maxBytes < 1000 || maxBytes > 1_000_000) {
          throw new Error("--max-bytes expects an integer from 1000 to 1000000");
        }
        out.maxBytes = maxBytes;
        i += 1;
      } else if (arg === "--route") {
        const routeId = args[i + 1];
        if (!routeId || routeId.startsWith("--")) throw new Error("--route expects a route id");
        out.routeId = routeId;
        i += 1;
      } else if (arg.startsWith("--")) {
        throw new Error(`Unknown pack option: ${arg}`);
      } else {
        out.briefParts.push(arg);
      }
    }
  }

  return {
    ...out,
    index: undefined,
    brief: out.briefParts.join(" ").trim(),
  };
}

function takeUtf8(content, maxBytes) {
  const buf = Buffer.from(content, "utf8");
  if (buf.byteLength <= maxBytes) {
    return {
      content,
      bytes: buf.byteLength,
      truncated: false,
    };
  }

  const sliced = buf.subarray(0, Math.max(0, maxBytes)).toString("utf8");
  return {
    content: sliced,
    bytes: Buffer.byteLength(sliced, "utf8"),
    truncated: true,
  };
}

function buildContextSummary({ files, maxBytes, usedBytes }) {
  const includedFiles = files.filter((file) => file.included).length;
  const truncatedFiles = files.filter((file) => file.truncated).length;
  const missingFiles = files.filter((file) => file.error).length;
  const status = missingFiles === files.length
    ? "incomplete"
    : missingFiles > 0 || truncatedFiles > 0
      ? "partial"
      : "complete";

  return {
    totalFiles: files.length,
    includedFiles,
    truncatedFiles,
    missingFiles,
    usedBytes,
    maxBytes,
    remainingBytes: Math.max(0, maxBytes - usedBytes),
    usedRatio: maxBytes > 0 ? usedBytes / maxBytes : 0,
    status,
  };
}

function buildContextWarnings({ files, maxBytes, usedBytes }) {
  const warnings = [];

  for (const file of files) {
    if (file.error) {
      warnings.push(`Missing context file: ${file.path} (${file.error})`);
    } else if (file.truncated) {
      warnings.push(`Truncated context file: ${file.path} (${file.includedBytes}/${file.bytes} bytes included)`);
    }
  }

  if (usedBytes >= maxBytes && files.some((file) => file.truncated)) {
    warnings.push(`Context budget exhausted at ${usedBytes}/${maxBytes} bytes`);
  }

  return warnings;
}

export function buildPromptPack({ brief, sourceRoot, prefix = SYMLINK_PREFIX, maxBytes = DEFAULT_MAX_BYTES, routeId = "" }) {
  const plan = buildPromptPlan({ brief, sourceRoot, prefix, routeId });
  const files = [];
  let usedBytes = 0;

  for (let i = 0; i < plan.filesToRead.length; i += 1) {
    const relPath = plan.filesToRead[i];
    try {
      const resolved = resolveShowFile({ sourceRoot, target: relPath });
      const raw = readFileSync(resolved.file, "utf8");
      const rawBytes = Buffer.byteLength(raw, "utf8");
      const remaining = Math.max(0, maxBytes - usedBytes);
      const remainingFiles = plan.filesToRead.length - i;
      const fileBudget = Math.ceil(remaining / remainingFiles);
      const taken = takeUtf8(raw, fileBudget);
      usedBytes += taken.bytes;

      files.push({
        path: resolved.relPath,
        bytes: rawBytes,
        includedBytes: taken.bytes,
        included: taken.bytes > 0,
        truncated: taken.truncated || taken.bytes < rawBytes,
        content: taken.content,
      });
    } catch (err) {
      files.push({
        path: relPath,
        bytes: 0,
        includedBytes: 0,
        included: false,
        truncated: false,
        error: err.message,
        content: "",
      });
    }
  }

  const summary = buildContextSummary({ files, maxBytes, usedBytes });
  const warnings = buildContextWarnings({ files, maxBytes, usedBytes });

  return {
    brief,
    version: plan.version,
    maxBytes,
    usedBytes,
    summary,
    warnings,
    plan,
    files,
    markdown: renderPromptPack({ plan, files, summary, warnings }),
  };
}

function formatPercent(ratio) {
  return `${Math.round(ratio * 100)}%`;
}

export function renderPromptPack({ plan, files, summary, warnings = [] }) {
  const lines = [];
  lines.push("# design-ai prompt pack");
  lines.push("");
  lines.push(`Brief: ${plan.brief}`);
  lines.push(`Route: ${plan.route.label} (${plan.route.forced ? "forced" : plan.route.confidence})`);
  lines.push(`Context status: ${summary.status}`);
  lines.push(`Context budget: ${summary.usedBytes}/${summary.maxBytes} bytes (${formatPercent(summary.usedRatio)} used)`);
  lines.push("");
  lines.push("## Context Summary");
  lines.push("");
  lines.push(`- Files: ${summary.includedFiles}/${summary.totalFiles} included`);
  lines.push(`- Truncated files: ${summary.truncatedFiles}`);
  lines.push(`- Missing files: ${summary.missingFiles}`);
  lines.push(`- Remaining budget: ${summary.remainingBytes} bytes`);

  if (warnings.length > 0) {
    lines.push("");
    lines.push("Warnings:");
    for (const warning of warnings) {
      lines.push(`- ${warning}`);
    }
  }

  lines.push("");
  lines.push("## Prompt");
  lines.push("");
  lines.push(plan.prompt);
  lines.push("");
  lines.push("## Context Files");
  lines.push("");

  for (const file of files) {
    lines.push(`### ${file.path}`);
    if (file.error) {
      lines.push("");
      lines.push(`_Not included: ${file.error}_`);
      lines.push("");
      continue;
    }

    lines.push("");
    lines.push(`_Included ${file.includedBytes}/${file.bytes} bytes${file.truncated ? "; truncated" : ""}._`);
    lines.push("");
    lines.push("````markdown");
    lines.push(file.content);
    lines.push("````");
    lines.push("");
  }

  return lines.join("\n");
}
