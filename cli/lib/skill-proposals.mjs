// Preview-only skill evolution proposal builder for local learning/check signals.

import { existsSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";

import {
  defaultLearningFile,
  defaultLearningUsageFile,
  loadLearningProfile,
} from "./learn.mjs";
import { PACKAGE_ROOT } from "./paths.mjs";
import { routeById } from "./route.mjs";
import { learningSignalRegistry } from "./signals.mjs";

const DEFAULT_MIN_EVIDENCE_COUNT = 2;
const CATEGORY_FALLBACK_SKILLS = {
  accessibility: "skills/ux-audit/SKILL.md",
  korean: "skills/design-system-builder/SKILL.md",
  workflow: "skills/handoff-spec/SKILL.md",
  brand: "skills/design-critique/SKILL.md",
  constraint: "skills/handoff-spec/SKILL.md",
  preference: "skills/design-critique/SKILL.md",
  other: "skills/design-critique/SKILL.md",
};

function stableHash(value, length = 10) {
  return createHash("sha256").update(String(value)).digest("hex").slice(0, length);
}

function slug(value) {
  return String(value || "skill")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 44) || "skill";
}

function previewText(text, maxLength = 180) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1)}...`;
}

function routeIdFromSource(source) {
  const text = String(source || "").trim();
  if (!text.startsWith("check:")) return "";
  const routeId = text.slice("check:".length).trim();
  if (!routeId || routeId === "artifact") return "";
  return routeId;
}

function issueTitleFromText(text) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  const match = normalized.match(/^Improve future outputs by addressing\s+([^:]+):/i);
  return match ? match[1].trim() : "";
}

function routeSkillPath(routeId, sourceRoot) {
  if (!routeId) return "";
  try {
    const route = routeById({ routeId, sourceRoot });
    const firstExistingSkill = (route.skills || []).find((skill) => skill.exists);
    return firstExistingSkill?.path || route.skills?.[0]?.path || "";
  } catch {
    return "";
  }
}

function candidateSkillForEntry(entry, sourceRoot) {
  const routeId = routeIdFromSource(entry.source);
  const routeSkill = routeSkillPath(routeId, sourceRoot);
  return {
    routeId,
    skillPath: routeSkill || CATEGORY_FALLBACK_SKILLS[entry.category] || CATEGORY_FALLBACK_SKILLS.other,
  };
}

function riskForGroup(group) {
  if (group.routeIds.size > 1) return "medium";
  if (group.entries.length >= 5) return "medium";
  if (group.skillPath === "skills/design-system-builder/SKILL.md") return "medium";
  return "low";
}

function instructionDeltaForGroup(group) {
  const titleText = [...group.titles].join(" ").toLowerCase();
  if (group.category === "accessibility") {
    return "Add a pre-handoff accessibility checkpoint: when the artifact includes UI behavior, explicitly cover keyboard reachability, visible focus state, screen-reader semantics, and WCAG 2.1 AA contrast.";
  }
  if (group.category === "korean") {
    return "Add a Korean-context checkpoint: when Korean users or copy are in scope, explicitly verify Hangul typography, line-height, honorific level, local density conventions, and Korean copy risks.";
  }
  if (titleText.includes("responsive") || titleText.includes("mobile") || titleText.includes("viewport")) {
    return "Add a responsive QA checkpoint: describe desktop, tablet, and mobile behavior, likely breakpoint risks, and the verification command before handoff.";
  }
  if (group.category === "workflow") {
    return "Add a workflow QA checkpoint: convert recurring artifact warnings into evidence, next action, verification command, and residual risk before final handoff.";
  }
  if (group.category === "brand") {
    return "Add a brand-fit checkpoint: state brand tone, visual density, copy posture, and any mismatch risk when the task includes product or marketing artifacts.";
  }
  if (group.category === "constraint") {
    return "Add a guardrail checkpoint: restate operator constraints, dependency limits, and external-system boundaries before proposing implementation changes.";
  }
  return "Add a learned-preference checkpoint: fold repeated local feedback into the skill's final review checklist with evidence and a verification step.";
}

function verificationCommandForGroup(group) {
  const routeId = [...group.routeIds].sort()[0] || "";
  if (routeId) {
    return `node cli/bin/design-ai.mjs check --examples --route ${routeId} --limit 1 --strict --json`;
  }
  return "node cli/bin/design-ai.mjs check --examples --route design-from-brief --limit 1 --strict --json";
}

function evidenceForEntry(entry) {
  return {
    kind: "check-capture",
    entryId: entry.id,
    category: entry.category,
    source: entry.source || "check:artifact",
    routeId: routeIdFromSource(entry.source) || "",
    title: issueTitleFromText(entry.text),
    createdAt: entry.createdAt || "",
    textPreview: previewText(entry.text),
  };
}

function groupCheckCaptureEntries(entries, sourceRoot) {
  const groups = new Map();
  for (const entry of entries) {
    const candidate = candidateSkillForEntry(entry, sourceRoot);
    const key = `${candidate.skillPath}\n${entry.category || "other"}`;
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        skillPath: candidate.skillPath,
        category: entry.category || "other",
        entries: [],
        routeIds: new Set(),
        sources: new Set(),
        titles: new Set(),
      });
    }
    const group = groups.get(key);
    group.entries.push(entry);
    if (candidate.routeId) group.routeIds.add(candidate.routeId);
    if (entry.source) group.sources.add(entry.source);
    const title = issueTitleFromText(entry.text);
    if (title) group.titles.add(title);
  }
  return [...groups.values()];
}

function proposalFromGroup(group) {
  const evidence = group.entries
    .slice()
    .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
    .slice(0, 5)
    .map(evidenceForEntry);
  const routeLabel = [...group.routeIds].sort().join(", ") || "artifact";
  const title = `Update ${group.skillPath} for repeated ${group.category} check captures`;
  const hashInput = `${group.skillPath}|${group.category}|${[...group.sources].sort().join(",")}|${[...group.titles].sort().join(",")}`;
  return {
    id: `skill-proposal-${slug(path.basename(path.dirname(group.skillPath) || group.skillPath))}-${stableHash(hashInput)}`,
    candidateSkill: path.basename(path.dirname(group.skillPath) || group.skillPath),
    candidateSkillPath: group.skillPath,
    title,
    riskLevel: riskForGroup(group),
    category: group.category,
    routeIds: [...group.routeIds].sort(),
    evidenceSources: evidence,
    sourceIssueCount: group.entries.length,
    proposedInstructionDelta: instructionDeltaForGroup(group),
    verificationCommand: verificationCommandForGroup(group),
    rationale: `Repeated ${group.category} check captures were recorded for ${routeLabel}; preview this delta before editing the skill file.`,
  };
}

function skippedFromGroup(group, minEvidenceCount) {
  return {
    candidateSkillPath: group.skillPath,
    category: group.category,
    sourceIssueCount: group.entries.length,
    reason: `Needs at least ${minEvidenceCount} related check-capture entries before proposing a skill edit.`,
    evidenceSources: group.entries
      .slice()
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
      .slice(0, 3)
      .map(evidenceForEntry),
  };
}

function proposalStatus({ signalStatus, proposalCount }) {
  if (signalStatus === "fail") return "fail";
  if (signalStatus && signalStatus !== "pass") return "warn";
  if (proposalCount > 0) return "warn";
  return "pass";
}

export function buildSkillEvolutionProposals({
  filePath = defaultLearningFile(),
  usageFile = "",
  signalSource = "",
  root = process.cwd(),
  sourceRoot = PACKAGE_ROOT,
  now = new Date(),
  minEvidenceCount = DEFAULT_MIN_EVIDENCE_COUNT,
  signalRegistryProvider = learningSignalRegistry,
} = {}) {
  const resolvedFile = path.resolve(filePath);
  const resolvedUsageFile = path.resolve(usageFile || defaultLearningUsageFile(resolvedFile));
  const generatedAt = (now instanceof Date ? now : new Date(now)).toISOString();
  const profile = loadLearningProfile(resolvedFile);
  const checkEntries = (profile.entries || [])
    .filter((entry) => String(entry.source || "").startsWith("check:"));
  const groups = groupCheckCaptureEntries(checkEntries, sourceRoot);
  const proposals = groups
    .filter((group) => group.entries.length >= minEvidenceCount)
    .map(proposalFromGroup)
    .sort((a, b) => (
      b.sourceIssueCount - a.sourceIssueCount
      || a.candidateSkillPath.localeCompare(b.candidateSkillPath)
      || a.category.localeCompare(b.category)
    ));
  const skipped = groups
    .filter((group) => group.entries.length < minEvidenceCount)
    .map((group) => skippedFromGroup(group, minEvidenceCount))
    .sort((a, b) => a.candidateSkillPath.localeCompare(b.candidateSkillPath) || a.category.localeCompare(b.category));
  const registry = signalRegistryProvider({
    filePath: resolvedFile,
    usageFile: resolvedUsageFile,
    signalSource,
    root,
    now,
  });
  const signalStatus = registry.status || "unknown";
  const status = proposalStatus({
    signalStatus,
    proposalCount: proposals.length,
  });

  return {
    version: 1,
    generatedAt,
    file: resolvedFile,
    usageFile: resolvedUsageFile,
    signalSource: registry.signalSource || (signalSource ? path.resolve(signalSource) : path.resolve(root)),
    dryRun: true,
    applied: false,
    minEvidenceCount,
    checkCaptureCount: checkEntries.length,
    candidateCount: groups.length,
    count: proposals.length,
    proposalCount: proposals.length,
    skippedCount: skipped.length,
    status,
    signalStatus,
    proposals,
    skipped,
    recommendations: proposals.length === 0
      ? [{
        level: "info",
        text: "No repeated check-capture groups crossed the proposal threshold yet. Keep capturing explicit check --learn --yes warnings/failures before editing skills.",
      }]
      : [{
        level: "info",
        text: "Review proposed instruction deltas manually. This command is preview-only and does not edit skill files.",
      }],
    privacy: {
      mutatesProfile: false,
      mutatesSkillFiles: false,
      callsExternalAiApis: false,
      storesRawBriefText: false,
      exposesEntryTextPreview: true,
    },
  };
}

function listItem(label, value) {
  return `- ${label}: ${value}`;
}

function yesNo(value) {
  return value ? "yes" : "no";
}

function normalizePatchPath(filePath) {
  return String(filePath || "").replace(/\\/g, "/");
}

function readSkillLines(skillPath, sourceRoot) {
  const absolutePath = path.resolve(sourceRoot, skillPath);
  if (!existsSync(absolutePath)) {
    return {
      exists: false,
      absolutePath,
      lines: [],
    };
  }
  const text = readFileSync(absolutePath, "utf8");
  return {
    exists: true,
    absolutePath,
    lines: text.split(/\r?\n/),
  };
}

function patchSectionForProposal(proposal) {
  const routes = Array.isArray(proposal.routeIds) && proposal.routeIds.length > 0
    ? proposal.routeIds.join(", ")
    : "artifact";
  return [
    "",
    `## Local Learning Proposal: ${proposal.id}`,
    "",
    "<!-- Generated by design-ai learn --propose-skills --patch. Review manually before applying. -->",
    "",
    `- Category: ${proposal.category}`,
    `- Routes: ${routes}`,
    `- Risk: ${proposal.riskLevel}`,
    `- Evidence count: ${proposal.sourceIssueCount}`,
    `- Proposed instruction: ${proposal.proposedInstructionDelta}`,
    `- Verification: \`${proposal.verificationCommand}\``,
  ];
}

function patchForSkillFile(skillPath, proposals, { sourceRoot }) {
  const normalizedSkillPath = normalizePatchPath(skillPath);
  const file = readSkillLines(normalizedSkillPath, sourceRoot);
  const currentLines = file.lines.slice();
  if (currentLines.length > 0 && currentLines[currentLines.length - 1] === "") {
    currentLines.pop();
  }
  const addedLines = proposals.flatMap(patchSectionForProposal);
  const fromPath = `a/${normalizedSkillPath}`;
  const toPath = `b/${normalizedSkillPath}`;
  const lines = [
    `diff --git ${fromPath} ${toPath}`,
    `--- ${file.exists ? fromPath : "/dev/null"}`,
    `+++ ${toPath}`,
  ];

  if (currentLines.length === 0) {
    lines.push(`@@ -0,0 +1,${addedLines.length} @@`);
    for (const addedLine of addedLines) {
      lines.push(`+${addedLine}`);
    }
    return lines;
  }

  const contextLine = currentLines[currentLines.length - 1];
  lines.push(`@@ -${currentLines.length},1 +${currentLines.length},${addedLines.length + 1} @@`);
  lines.push(` ${contextLine}`);
  for (const addedLine of addedLines) {
    lines.push(`+${addedLine}`);
  }
  return lines;
}

export function renderSkillEvolutionProposalPatch(payload, {
  sourceRoot = PACKAGE_ROOT,
} = {}) {
  const proposals = Array.isArray(payload.proposals) ? payload.proposals : [];
  const lines = [
    "# design-ai skill proposal patch preview",
    "# Preview-only output from `design-ai learn --propose-skills --patch`.",
    "# Review manually before applying. This command does not edit skill files.",
  ];

  if (proposals.length === 0) {
    lines.push("# No repeated check-capture groups crossed the proposal threshold.");
    return `${lines.join("\n")}\n`;
  }

  const proposalsBySkill = new Map();
  for (const proposal of proposals) {
    const skillPath = proposal.candidateSkillPath || "skills/unknown/SKILL.md";
    if (!proposalsBySkill.has(skillPath)) proposalsBySkill.set(skillPath, []);
    proposalsBySkill.get(skillPath).push(proposal);
  }

  for (const [skillPath, skillProposals] of [...proposalsBySkill.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    lines.push("");
    lines.push(...patchForSkillFile(skillPath, skillProposals, { sourceRoot }));
  }

  return `${lines.join("\n")}\n`;
}

export function renderSkillEvolutionProposalReport(payload, {
  generatedAt = new Date(),
} = {}) {
  const generatedAtText = generatedAt instanceof Date ? generatedAt.toISOString() : String(generatedAt || "");
  const lines = [
    "# Skill Evolution Proposal Report",
    "",
    listItem("Generated", generatedAtText),
    listItem("File", payload.file),
    listItem("Usage sidecar", payload.usageFile),
    listItem("Signal source", payload.signalSource),
    listItem("Status", payload.status),
    listItem("Signal status", payload.signalStatus),
    listItem("Minimum evidence", payload.minEvidenceCount),
    listItem("Check capture entries", payload.checkCaptureCount),
    listItem("Candidate groups", payload.candidateCount),
    listItem("Proposal count", payload.proposalCount),
    listItem("Skipped groups", payload.skippedCount),
    listItem("Dry run", yesNo(Boolean(payload.dryRun))),
    listItem("Applied", yesNo(Boolean(payload.applied))),
    "",
    "## Proposed Skill Deltas",
    "",
  ];

  if (!Array.isArray(payload.proposals) || payload.proposals.length === 0) {
    lines.push("No repeated check-capture groups crossed the proposal threshold.");
  } else {
    for (const proposal of payload.proposals) {
      const routes = Array.isArray(proposal.routeIds) && proposal.routeIds.length > 0
        ? proposal.routeIds.join(", ")
        : "artifact";
      lines.push(`### ${proposal.title}`);
      lines.push("");
      lines.push(listItem("Proposal id", proposal.id));
      lines.push(listItem("Candidate skill", proposal.candidateSkillPath));
      lines.push(listItem("Category", proposal.category));
      lines.push(listItem("Routes", routes));
      lines.push(listItem("Risk", proposal.riskLevel));
      lines.push(listItem("Source issues", proposal.sourceIssueCount));
      lines.push(listItem("Rationale", proposal.rationale));
      lines.push("");
      lines.push("Proposed instruction delta:");
      lines.push("");
      lines.push(`> ${proposal.proposedInstructionDelta}`);
      lines.push("");
      lines.push("Verification:");
      lines.push("");
      lines.push(`\`\`\`bash`);
      lines.push(proposal.verificationCommand);
      lines.push(`\`\`\``);
      lines.push("");
      lines.push("Evidence:");
      const evidenceSources = Array.isArray(proposal.evidenceSources) ? proposal.evidenceSources : [];
      for (const evidence of evidenceSources) {
        const title = evidence.title ? ` / ${evidence.title}` : "";
        lines.push(`- \`${evidence.entryId}\` [${evidence.category}] ${evidence.source}${title}`);
        if (evidence.createdAt) lines.push(`  - Captured: ${evidence.createdAt}`);
        if (evidence.textPreview) lines.push(`  - Preview: ${evidence.textPreview}`);
      }
      lines.push("");
    }
  }

  lines.push("## Skipped Groups", "");
  if (!Array.isArray(payload.skipped) || payload.skipped.length === 0) {
    lines.push("No candidate groups were skipped.");
  } else {
    for (const item of payload.skipped) {
      lines.push(`- \`${item.candidateSkillPath}\` [${item.category}]: ${item.reason}`);
      const evidenceSources = Array.isArray(item.evidenceSources) ? item.evidenceSources : [];
      for (const evidence of evidenceSources) {
        lines.push(`  - Evidence: \`${evidence.entryId}\` ${evidence.source}`);
      }
    }
  }

  lines.push("", "## Recommendations", "");
  if (!Array.isArray(payload.recommendations) || payload.recommendations.length === 0) {
    lines.push("No recommendations emitted.");
  } else {
    for (const recommendation of payload.recommendations) {
      lines.push(`- ${recommendation.level}: ${recommendation.text}`);
    }
  }

  const privacy = payload.privacy || {};
  lines.push("", "## Privacy And Boundaries", "");
  lines.push(listItem("Mutates learning profile", yesNo(Boolean(privacy.mutatesProfile))));
  lines.push(listItem("Mutates skill files", yesNo(Boolean(privacy.mutatesSkillFiles))));
  lines.push(listItem("Calls external AI APIs", yesNo(Boolean(privacy.callsExternalAiApis))));
  lines.push(listItem("Stores raw brief text", yesNo(Boolean(privacy.storesRawBriefText))));
  lines.push(listItem("Includes entry text preview", yesNo(Boolean(privacy.exposesEntryTextPreview))));

  lines.push("", "## Next Steps", "");
  if ((payload.proposalCount || 0) > 0) {
    lines.push("- Review each proposed instruction delta manually before editing any skill file.");
    lines.push("- Run the proposal verification command after applying an accepted skill edit.");
    lines.push("- Re-run `design-ai learn --propose-skills --strict --json` to confirm no pending proposal gate remains.");
  } else {
    lines.push("- Keep capturing explicit `design-ai check --learn --yes` warning/failure results until repeated evidence exists.");
    lines.push("- Re-run this report after new check-capture entries are added.");
  }
  lines.push("- This report is preview-only evidence; it does not apply changes.");

  return `${lines.join("\n")}\n`;
}
