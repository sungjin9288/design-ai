// Shared design artifact planning for CLI, SDK, MCP, and Website Console adapters.

import { parseBriefSourceFlag } from "./brief.mjs";
import { parseOutputFlags } from "./output.mjs";
import { buildPromptPlan } from "./prompt.mjs";
import { unknownOptionMessage } from "./suggest.mjs";

export const ARTIFACT_MODES = [
  "implementation-plan",
  "critique-loop",
  "design-contract",
];

const ARTIFACT_OPTIONS = [
  "-h",
  "--help",
  "--json",
  "--route",
  "--from-file",
  "--stdin",
  "--out",
  "--force",
];

const MODE_DEFINITIONS = {
  "implementation-plan": {
    title: "Implementation plan",
    outputFile: "implementation-plan.md",
    workflow: [
      {
        title: "Read the current state",
        purpose: "Inspect the source of truth, existing architecture, constraints, and verification commands before proposing changes.",
        evidence: "List the files, runtime surfaces, assumptions, and risks that define the implementation boundary.",
      },
      {
        title: "Define the change",
        purpose: "Choose the smallest coherent scope that satisfies the brief without replacing established patterns.",
        evidence: "Name the files to change, expected behavior, exclusions, and approval-sensitive decisions.",
      },
      {
        title: "Implement after the gate",
        purpose: "Make the agreed change in dependency order and keep unrelated work untouched.",
        evidence: "Record the changed files and the observable behavior each change creates.",
      },
      {
        title: "Verify the result",
        purpose: "Run focused checks first, then the broadest practical repository gate.",
        evidence: "Capture commands, outcomes, browser or runtime observations, and remaining risk.",
      },
    ],
    outputSections: ["Context", "Scope", "Implementation steps", "Verification", "Risks and approval boundaries"],
  },
  "critique-loop": {
    title: "Critique loop",
    outputFile: "critique-loop.md",
    workflow: [
      {
        title: "Observe before judging",
        purpose: "Inspect the artifact in its real context and name the user goal, audience, and constraints.",
        evidence: "Record the first, second, and third visual or interaction signals and any unverified behavior.",
      },
      {
        title: "Name the highest-impact gap",
        purpose: "Separate problem fit, hierarchy, craft, accessibility, and responsive concerns, then choose one lead issue.",
        evidence: "State the before condition, its user impact, and the evidence behind the finding.",
      },
      {
        title: "Revise one decision",
        purpose: "Apply the single strongest recommendation while preserving deliberate tradeoffs and existing system rules.",
        evidence: "Describe before, after, why, and the exact artifact or code change.",
      },
      {
        title: "Re-observe and close the loop",
        purpose: "Review the revised result under the same conditions and check for regressions.",
        evidence: "Record verification results, unresolved findings, and the next highest-impact decision only if another loop is needed.",
      },
    ],
    outputSections: ["Decision and audience", "Observed evidence", "Top recommendation", "Revision", "Verification and remaining risk"],
  },
  "design-contract": {
    title: "Agent-readable design contract",
    outputFile: "DESIGN.md",
    workflow: [
      {
        title: "Ground the product intent",
        purpose: "Capture the product, audience, brand character, supported artifact modes, and source hierarchy without inventing missing facts.",
        evidence: "Mark each decision as confirmed, inferred, or unresolved and cite the source of truth.",
      },
      {
        title: "Define visual foundations",
        purpose: "Express color, typography, spacing, layout, iconography, and imagery as semantic rules agents can apply consistently.",
        evidence: "Include token names, contrast requirements, responsive behavior, and concrete examples where evidence exists.",
      },
      {
        title: "Define component and motion behavior",
        purpose: "Name the component patterns, interaction states, motion tiers, and reduced-motion behavior that carry the product character.",
        evidence: "Record keyboard, focus, screen-reader, touch-target, loading, empty, error, and interruption expectations.",
      },
      {
        title: "Set boundaries and ownership",
        purpose: "List anti-patterns, approval gates, asset and licensing boundaries, maintenance owner, and update triggers.",
        evidence: "Provide a short verification checklist agents can run before shipping generated work.",
      },
    ],
    outputSections: [
      "Product intent and audience",
      "Brand principles and artifact modes",
      "Color, typography, spacing, and layout",
      "Components, states, and motion",
      "Accessibility and responsive behavior",
      "Anti-patterns, ownership, and verification",
    ],
  },
};

export function artifactModeDefinition(mode) {
  const definition = MODE_DEFINITIONS[mode];
  if (!definition) {
    throw new Error(`Unknown artifact mode: ${mode}. Use one of: ${ARTIFACT_MODES.join(", ")}`);
  }
  return definition;
}

export function parseArtifactArgs(args) {
  const out = {
    mode: "",
    briefParts: [],
    fromFile: "",
    stdin: false,
    routeId: "",
    json: false,
    outPath: "",
    force: false,
    help: false,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    out.index = i;
    if (arg === "-h" || arg === "--help") {
      out.help = true;
    } else if (arg === "--json") {
      out.json = true;
    } else if (arg === "--route") {
      const routeId = args[i + 1];
      if (!routeId || routeId.startsWith("--")) throw new Error("--route expects a route id");
      out.routeId = routeId;
      i += 1;
    } else if (parseBriefSourceFlag(args, out)) {
      i = out.index;
    } else if (parseOutputFlags(args, out)) {
      i = out.index;
    } else if (arg.startsWith("--")) {
      throw new Error(unknownOptionMessage("artifact", arg, ARTIFACT_OPTIONS));
    } else if (!out.mode) {
      out.mode = arg;
    } else {
      out.briefParts.push(arg);
    }
  }

  if (out.mode) artifactModeDefinition(out.mode);

  const { index: _index, ...parsed } = out;
  return parsed;
}

function renderSourceFiles(sourceFiles) {
  return sourceFiles.length
    ? sourceFiles.map((filePath) => `- \`${filePath}\``).join("\n")
    : "- No source files resolved. Stop and establish a source of truth before continuing.";
}

function renderWorkflow(workflow) {
  return workflow.flatMap((step, index) => [
    `### ${index + 1}. ${step.title}`,
    "",
    step.purpose,
    "",
    `**Evidence:** ${step.evidence}`,
    "",
  ]).join("\n").trimEnd();
}

function renderOutputSections(outputSections) {
  return outputSections.map((section) => `- ${section}`).join("\n");
}

export function renderArtifactMarkdown(artifact) {
  return [
    `# ${artifact.title}: ${artifact.brief}`,
    "",
    "> Generated by design-ai as a read-only planning artifact. It does not modify a repository or contact an external service.",
    "",
    "## Artifact contract",
    "",
    `- Kind: \`${artifact.kind}\``,
    `- Schema version: \`${artifact.schemaVersion}\``,
    `- Mode: \`${artifact.mode}\``,
    `- Route: \`${artifact.route.id}\` (${artifact.route.label})`,
    `- Output: \`${artifact.outputFile}\``,
    "- Mutation boundary: planning and local output only; target-repo edits and external writes require explicit approval.",
    "",
    "## Brief",
    "",
    artifact.brief,
    "",
    "## Source of truth",
    "",
    renderSourceFiles(artifact.sourceFiles),
    "",
    "## Workflow",
    "",
    renderWorkflow(artifact.workflow),
    "",
    "## Output structure",
    "",
    renderOutputSections(artifact.outputSections),
    "",
    "## Approval boundary",
    "",
    ...artifact.approval.requiresApproval.map((item) => `- Approval required before ${item}.`),
    "",
    "## Verification",
    "",
    `- Artifact check: \`${artifact.verification.command}\``,
    ...artifact.verification.checklist.map((item) => `- ${item}`),
  ].join("\n");
}

export function buildArtifact({
  mode,
  brief,
  sourceRoot,
  prefix,
  routeId = "",
}) {
  const definition = artifactModeDefinition(mode);
  const promptPlan = buildPromptPlan({ brief, sourceRoot, prefix, routeId });
  if (!promptPlan) throw new Error("Could not resolve a design route for the artifact brief");

  const artifact = {
    kind: "design-ai-artifact",
    schemaVersion: 1,
    mode,
    title: definition.title,
    brief,
    route: promptPlan.route,
    outputFile: definition.outputFile,
    sourceFiles: promptPlan.filesToRead,
    workflow: definition.workflow.map((step) => ({ ...step })),
    outputSections: [...definition.outputSections],
    approval: {
      status: "pending-human-approval",
      requiresApproval: [
        "editing a target repository",
        "installing or changing dependencies",
        "running migrations or changing persistent data",
        "creating commits, pushing, deploying, or writing to an external system",
      ],
    },
    verification: {
      command: promptPlan.qualityCommand.replace("output.md", definition.outputFile),
      checklist: promptPlan.checklist,
    },
  };

  return {
    ...artifact,
    markdown: renderArtifactMarkdown(artifact),
  };
}

export function formatArtifactJson(artifact) {
  return JSON.stringify(artifact, null, 2);
}
