// Type declarations for the design-ai Agent SDK — Phase A (read-only).
// Hand-written, zero-build: no TypeScript toolchain is required to produce or
// ship these. They mirror the runtime shapes exercised by cli/sdk/index.test.mjs
// (the semver anchor). The twelve exported names and their return-shape top-level
// keys are the stable, semver-covered surface; deeper nested shapes follow the
// same JSON the CLI's `--json` mode emits.
//
// Import: `import { route, search } from "@design-ai/cli/sdk";`

// ── Shared building blocks ────────────────────────────────────────────────

/** A curated reference (skill/agent/knowledge/command) and whether it exists on disk. */
export interface RouteReference {
  path: string;
  exists: boolean;
}

/** One reference-coverage tally (available vs total) within a route explanation. */
export interface CoverageCount {
  available: number;
  total: number;
}

export interface ReferenceCoverage {
  command: CoverageCount;
  skills: CoverageCount;
  agents: CoverageCount;
  knowledge: CoverageCount;
  total: CoverageCount;
}

export interface ScoreBreakdownEntry {
  label: string;
  value: number;
}

export interface RouteExplanation {
  summary: string;
  scoreBreakdown: ScoreBreakdownEntry[];
  referenceCoverage: ReferenceCoverage;
  missingReferences: string[];
}

/** Advisory brief-relevant knowledge recalled by the shared lexical scorer. */
export interface RelatedKnowledge {
  id: string;
  score: number;
  matchedTokens: string[];
}

export type RouteConfidence = "high" | "medium" | "low" | "catalog" | "forced";

export interface RouteResult {
  id: string;
  label: string;
  score: number;
  confidence: RouteConfidence;
  matchedKeywords: string[];
  command: RouteReference | null;
  skills: RouteReference[];
  agents: RouteReference[];
  knowledge: RouteReference[];
  keywords: string[];
  explanation: RouteExplanation;
  /** Present only when `route(brief, { explain: true })` is requested. */
  relatedKnowledge?: RelatedKnowledge[];
  /** Present only when a route was forced via `routeId`. */
  forced?: boolean;
  /** Present only when the fallback route was used. */
  fallback?: boolean;
}

export interface RouteCatalog {
  version: string;
  routes: RouteResult[];
}

// ── prompt / pack ─────────────────────────────────────────────────────────

export interface ReferenceExample {
  relPath: string;
  title: string;
  category: string;
  score: number;
  preview: string;
}

/** A single recalled learning-profile entry. */
export interface LearningRecallEntry {
  id: string;
  category: string;
  score: number;
  matchedTokens: string[];
  text: string;
}

/** A single recalled shipped-corpus knowledge entry. */
export interface CorpusRecallEntry {
  id: string;
  score: number;
  matchedTokens: string[];
}

/** Recall block embedded in a prompt plan when `withRecall: true`. */
export interface PromptRecall {
  query: string;
  mode: string;
  candidateCount: number;
  selectedCount: number;
  selected: CorpusRecallEntry[];
  markdown: string;
}

/** A stored learning-profile entry, as surfaced in a prompt plan's learning context. */
export interface LearningEntry {
  id: string;
  category: string;
  text: string;
  source: string;
  createdAt: string;
}

export interface LearningSelection {
  mode: string;
  query: string;
  candidateCount: number;
  matchedCount: number;
  queryTokenCount: number;
  fallbackEnabled: boolean;
  selectedCount: number;
  fallbackCount: number;
  selected: LearningRecallEntry[];
}

export interface LearningAuditSummary {
  status: string;
  failures: number;
  warnings: number;
}

/** Learning context embedded in a prompt plan when `withLearning: true`. */
export interface LearningContext {
  file: string;
  category: string;
  limit: number;
  query: string;
  selection: LearningSelection;
  entries: LearningEntry[];
  empty: boolean;
  auditSummary: LearningAuditSummary;
  markdown: string;
}

export interface PromptPlan {
  brief: string;
  version: string;
  route: RouteResult;
  slashCommand: string;
  referenceExamples: ReferenceExample[];
  filesToRead: string[];
  checklist: string[];
  qualityCommand: string;
  prompt: string;
  /** Present only when `prompt(brief, { withLearning: true })` is requested. */
  learningContext?: LearningContext;
  /** Present only when `prompt(brief, { withRecall: true })` is requested. */
  recall?: PromptRecall;
}

// ── artifact ─────────────────────────────────────────────────────────────

export type ArtifactMode = "implementation-plan" | "critique-loop" | "design-contract";

export interface ArtifactWorkflowStep {
  title: string;
  purpose: string;
  evidence: string;
}

export interface ArtifactApproval {
  status: "pending-human-approval";
  requiresApproval: string[];
}

export interface ArtifactVerification {
  command: string;
  checklist: string[];
}

export interface DesignArtifact {
  kind: "design-ai-artifact";
  schemaVersion: 1;
  mode: ArtifactMode;
  title: string;
  brief: string;
  route: RouteResult;
  outputFile: string;
  sourceFiles: string[];
  workflow: ArtifactWorkflowStep[];
  outputSections: string[];
  approval: ArtifactApproval;
  verification: ArtifactVerification;
  markdown: string;
}

// ── start ────────────────────────────────────────────────────────────────

export interface StartOptions {
  routeId?: string;
  siteName?: string;
  repoUrl?: string;
  localPath?: string;
  url?: string;
  screenshots?: string[];
  locale?: string;
  viewports?: string[];
}

export interface StartContext {
  siteName: string;
  repoUrl: string;
  localPath: string;
  url: string;
  screenshots: string[];
  locale: string;
  viewports: string[];
}

// ── design quality inspection ───────────────────────────────────────────

export type DesignQualityStatus = "pass" | "warning" | "fail" | "unverified";
export type DesignQualityLensId =
  | "purpose-frequency"
  | "response"
  | "spatial-continuity"
  | "interruptibility"
  | "timing-cohesion"
  | "performance"
  | "accessibility"
  | "responsive-resilience";

export interface DesignQualityEvidence {
  kind: "brief" | "code" | "runtime" | "screenshot" | "accessibility" | "manual" | "design-contract";
  reference: string;
  observation: string;
}

export interface DesignQualityLens {
  id: DesignQualityLensId;
  status: DesignQualityStatus;
  summary: string;
  evidence: DesignQualityEvidence[];
}

export interface DesignQualityFinding {
  id: string;
  lens: DesignQualityLensId;
  severity: "p0" | "p1" | "p2" | "p3";
  status: "confirmed" | "unverified";
  title: string;
  location: string;
  before: string;
  after: string;
  why: string;
  evidence: DesignQualityEvidence[];
  verification: string[];
}

export interface InspectHtmlOptions {
  sourceRef: string;
  brief: string;
  name?: string;
  locale?: string;
  viewports?: string[];
  generatedAt?: string;
  /** Apply one shipped Korean product review pack by id. */
  reviewPack?: string;
}

export interface ReviewHtmlOptions extends InspectHtmlOptions {
  siteName?: string;
  repoUrl?: string;
  localPath?: string;
  url?: string;
  screenshots?: string[];
}

export interface DesignQualityReport {
  kind: "design-ai-quality-report";
  schemaVersion: 1;
  generatedAt: string;
  subject: { name: string; type: "page"; source: string };
  context: { brief: string; routeId: "design-engineering-review"; locale: string; viewports: string[] };
  boundary: {
    mode: "read-only";
    targetRepoMutation: false;
    externalWrites: false;
    localEvidenceWrites: false;
    localEvidencePath: null;
    notes: string[];
  };
  sources: DesignQualityEvidence[];
  lenses: DesignQualityLens[];
  findings: DesignQualityFinding[];
  summary: {
    status: DesignQualityStatus;
    confirmedFindings: number;
    unverifiedFindings: number;
    blockingFindings: number;
    nextAction: string;
  };
  approval: { status: "pending"; requiredBefore: string[] };
}

export interface ReviewWorkflow {
  kind: "design-ai-review-workflow";
  schemaVersion: 1;
  status: "static-review-complete";
  source: { reference: string; sha256: string; bytes: number };
  plan: StartPayload;
  report: DesignQualityReport;
  linkage: {
    status: "pass";
    briefMatch: true;
    localeMatch: true;
    viewportMatch: true;
    sourceReferenceMatch: true;
    planSha256: string;
    designContractSha256: string;
    reportSha256: string;
  };
  stages: Array<{
    id: "plan" | "static-review" | "browser-verification" | "implementation-handoff";
    status: "complete" | "not-run" | "not-started";
    artifactKind: "design-ai-start" | "design-ai-quality-report" | null;
  }>;
  nextAction: {
    id: "human-review-required";
    status: "pending";
    summary: string;
    approvalRequiredBefore: string[];
  };
  boundary: {
    mode: "read-only";
    localWrites: false;
    targetRepoMutation: false;
    externalWrites: false;
  };
}

export interface ReviewHandoffOptions {
  workflowRef: string;
  recipient: string;
  qualityReportSource?: string;
  qualityReportRef?: string;
  browserVerificationSource?: string;
  browserVerificationRef?: string;
}

export interface ReviewHandoffArtifact<T> {
  reference: string;
  sha256: string;
  bytes: number;
  source: string;
  value: T;
}

export interface BrowserVerification {
  kind: "design-ai-browser-verification";
  schemaVersion: 1;
  sourceReport: { path: string; sha256: string; postRunDigestMatch: true };
  approval: { status: "approved"; reference: string };
  run: {
    id: string;
    url: string;
    startedAt: string;
    completedAt: string;
    tool: { name: string; version: string };
  };
  boundary: Record<string, unknown>;
  viewports: Array<{ name: string; width: number; height: number }>;
  probes: Array<Record<string, unknown>>;
  findings: Array<Record<string, unknown>>;
  summary: {
    status: "pass" | "fail" | "unverified";
    passed: number;
    failed: number;
    unverified: number;
    nextAction: string;
  };
}

export interface ReviewHandoff {
  kind: "design-ai-review-handoff";
  schemaVersion: 1;
  status: "static-evidence-prepared" | "browser-evidence-prepared";
  recipient: {
    name: string;
    delivery: "not-delivered";
    consumerValidation: "pending";
  };
  artifacts: {
    reviewWorkflow: ReviewHandoffArtifact<ReviewWorkflow>;
    qualityReport: ReviewHandoffArtifact<DesignQualityReport> | null;
    browserVerification: ReviewHandoffArtifact<BrowserVerification> | null;
  };
  linkage: {
    status: "pass";
    reviewWorkflowArtifactSha256: string;
    qualityReportArtifactSha256: string;
    browserVerificationArtifactSha256: string | null;
    qualityReportArtifactMatch: true | null;
    browserSourceReportMatch: true | null;
    viewportCoverage: "pass" | "not-run";
  };
  stages: Array<{
    id: "plan" | "static-review" | "browser-verification" | "implementation-handoff";
    status: "complete" | "not-run" | "prepared";
    artifactKind: "design-ai-start" | "design-ai-quality-report" | "design-ai-browser-verification" | "design-ai-review-handoff" | null;
  }>;
  nextAction: {
    id: "consumer-validation-required";
    status: "pending";
    summary: string;
    approvalRequiredBefore: string[];
  };
  boundary: {
    mode: "read-only";
    localWrites: false;
    targetRepoMutation: false;
    externalWrites: false;
    deliveryPerformed: false;
  };
}

export interface VerifyReviewHandoffOptions {
  handoffRef: string;
  consumer: string;
}

export interface ReviewHandoffReceipt {
  kind: "design-ai-review-handoff-receipt";
  schemaVersion: 1;
  status: "contract-validated";
  consumer: {
    name: string;
    expectedRecipient: string;
    recipientMatch: true;
    identity: "self-declared";
    contractValidation: "pass";
    acceptance: "not-claimed";
  };
  handoff: ReviewHandoffArtifact<ReviewHandoff>;
  evidence: {
    qualityStatus: DesignQualityStatus;
    confirmedFindings: number;
    unverifiedFindings: number;
    browserStatus: "not-run" | "pass" | "fail" | "unverified";
  };
  remainingApprovals: string[];
  nextAction: {
    id: "target-repo-intake-required";
    status: "pending";
    summary: string;
    implementationAuthorized: false;
  };
  boundary: {
    mode: "read-only";
    localWrites: false;
    targetRepoMutation: false;
    externalWrites: false;
    transportVerified: false;
    consumerIdentityVerified: false;
    acceptanceRecorded: false;
    implementationStarted: false;
  };
}

export interface ImplementationScopeRequest {
  kind: "design-ai-implementation-scope-request";
  schemaVersion: 1;
  objective: string;
  intendedBehavior: string[];
  files: {
    inspect: string[];
    change: string[];
    generated: string[];
  };
  dependencies: Array<{
    name: string;
    action: "add" | "remove" | "upgrade";
    reason: string;
  }>;
  migrations: Array<{
    name: string;
    command: string;
    affectsExternalState: boolean;
  }>;
  externalWrites: Array<{
    system: string;
    action: string;
    destination: string;
  }>;
  verificationCommands: string[];
  risks: string[];
  preExistingChanges: Array<{
    statusEntry: string;
    owner: "user" | "unknown";
    handling: "preserve" | "allow-overlap" | "block";
  }>;
  release: {
    commit: boolean;
    push: boolean;
    deployment: boolean;
  };
}

export type ImplementationScopeGateId =
  | "source-inspection"
  | "target-files"
  | "pre-existing-changes"
  | "dependency-changes"
  | "migration-files"
  | "generated-files"
  | "external-writes"
  | "commit"
  | "push"
  | "deployment";

export interface ImplementationScopeGate {
  id: ImplementationScopeGateId;
  status: "not-required" | "pending" | "approved";
  summary: string;
}

export interface ImplementationScopeProposal {
  kind: "design-ai-implementation-scope-proposal";
  schemaVersion: 1;
  status: "approval-pending" | "blocked";
  consumer: {
    name: string;
    intakeConsumerMatch: true;
    identity: "self-declared";
  };
  intake: ReviewHandoffArtifact<unknown>;
  request: ReviewHandoffArtifact<ImplementationScopeRequest>;
  linkage: {
    status: "pass";
    intakeSha256: string;
    requestSha256: string;
    scopeDigest: string;
  };
  baseline: {
    targetPath: string;
    repositoryUrl: string;
    branch: string;
    head: string;
    worktreeChanges: string[];
  };
  scope: Omit<ImplementationScopeRequest, "kind" | "schemaVersion" | "preExistingChanges">;
  approvalGates: ImplementationScopeGate[];
  issues: Array<{
    level: "pass" | "warn" | "fail";
    id: string;
    message: string;
  }>;
  nextAction: {
    id: "human-scope-approval-required";
    status: "pending";
    summary: string;
    implementationAuthorized: false;
  };
  boundary: {
    mode: "read-only";
    localWrites: false;
    targetRepoMutation: false;
    externalWrites: false;
    networkCalls: false;
    applicationSourceRead: false;
    scopeApproved: false;
    implementationStarted: false;
  };
}

export interface ImplementationScopeApproval {
  kind: "design-ai-implementation-scope-approval";
  schemaVersion: 1;
  status: "approved-for-implementation";
  proposal: ReviewHandoffArtifact<ImplementationScopeProposal>;
  approver: {
    name: string;
    identity: "self-declared";
    reference: string;
    approvedAt: string;
  };
  decision: {
    status: "approved";
    proposalSha256: string;
    scopeDigest: string;
    authorizedGateIds: ImplementationScopeGateId[];
    remainingGateIds: ImplementationScopeGateId[];
  };
  authorization: {
    targetPath: string;
    repositoryUrl: string;
    branch: string;
    head: string;
    files: ImplementationScopeRequest["files"];
    expiresOnDrift: true;
  };
  approvalGates: ImplementationScopeGate[];
  nextAction: {
    id: "implementation-evidence-required";
    status: "ready";
    summary: string;
    implementationAuthorized: true;
    approvalRequiredBefore: ImplementationScopeGateId[];
  };
  boundary: {
    mode: "scope-approved";
    localWrites: false;
    targetRepoMutation: false;
    externalWrites: false;
    networkCalls: false;
    applicationSourceRead: false;
    scopeApproved: true;
    implementationStarted: false;
    sourceReadAuthorized: true;
    targetMutationAuthorized: true;
    externalWritesAuthorized: false;
    commitAuthorized: false;
    pushAuthorized: false;
    deploymentAuthorized: false;
  };
}

export interface ProposeImplementationScopeOptions {
  intakeRef: string;
  requestRef: string;
  consumer: string;
}

export interface ApproveImplementationScopeOptions {
  proposalRef: string;
  approver: string;
  approvalRef: string;
  approvedAt: string;
  confirmed: true;
}

export interface ProductReviewPackSummary {
  id: string;
  revision: number;
  name: string;
  domain: "fintech" | "commerce" | "saas" | "content" | "game";
  locale: "ko-KR";
  summary: string;
  criteriaCount: number;
  benchmark: string;
}

export interface ProductReviewCriterion {
  id: string;
  lens: DesignQualityLensId;
  mode: "static-html" | "browser-required" | "scenario-required";
  severity: "p0" | "p1" | "p2" | "p3";
  title: string;
  question: string;
  evidence: string;
  verification: string[];
  falsePositiveNotes: string[];
}

export interface ProductReviewPack {
  kind: "design-ai-product-review-pack";
  schemaVersion: 1;
  revision: number;
  id: string;
  name: string;
  domain: ProductReviewPackSummary["domain"];
  locale: "ko-KR";
  summary: string;
  viewports: Array<{ name: "mobile" | "desktop"; width: number; height: number }>;
  knowledge: string[];
  criteria: ProductReviewCriterion[];
  benchmark: { source: string; expectedFindingIds: string[]; falsePositiveNotes: string[] };
  boundary: { mode: "read-only"; targetRepoMutation: false; externalWrites: false; notes: string[] };
}

export interface ProductReviewPackList {
  kind: "design-ai-product-review-pack-list";
  schemaVersion: 1;
  packs: ProductReviewPackSummary[];
}

export interface StartReference {
  kind: "repository-url" | "local-path" | "page-url" | "screenshot";
  reference: string;
  status: "declared-not-read";
}

export interface StartPathway {
  id: "website-improvement" | "design-review" | "implementation-plan";
  status: "needs-input" | "ready" | "playbook-ready";
  reason: string;
  missingInputs: string[];
  commandArgs: string[];
  command: string;
}

export interface StartPayload {
  kind: "design-ai-start";
  schemaVersion: 1;
  brief: string;
  context: StartContext;
  route: Pick<RouteResult, "id" | "label" | "confidence" | "matchedKeywords">;
  designContract: DesignArtifact;
  review: {
    status: "playbook-ready-not-run";
    routeId: string;
    executed: false;
    sourceFiles: string[];
  };
  pathway: StartPathway;
  effects: {
    performed: {
      reads: Array<{ kind: "design-ai-corpus"; reference: string }>;
      localWrites: never[];
      targetRepoMutations: never[];
      externalActions: never[];
    };
    intended: {
      reads: StartReference[];
      localWrites: Array<{ reference: string; status: "not-performed" }>;
      targetRepoMutations: never[];
      externalActions: Array<{ action: "inspect-reference"; reference: string; status: "not-performed" }>;
    };
    approvalRequiredBefore: string[];
  };
}

export interface PackSummary {
  totalFiles: number;
  includedFiles: number;
  truncatedFiles: number;
  missingFiles: number;
  usedBytes: number;
  maxBytes: number;
  remainingBytes: number;
  usedRatio: number;
  status: string;
}

export interface PackFile {
  path: string;
  bytes: number;
  includedBytes: number;
  included: boolean;
  truncated: boolean;
  content: string;
}

export interface Pack {
  brief: string;
  version: string;
  maxBytes: number;
  usedBytes: number;
  summary: PackSummary;
  warnings: string[];
  plan: PromptPlan;
  files: PackFile[];
  markdown: string;
}

// ── search ────────────────────────────────────────────────────────────────

/** A plain line hit (default `search`). */
export interface SearchHit {
  file: string;
  lineNumber: number;
  relPath: string;
  preview: string;
}

/** A ranked hit (`search(query, { ranked: true })`) with a BM25 score. */
export interface RankedSearchHit {
  relPath: string;
  file: string;
  score: number;
  matchedTokens: string[];
  preview: string;
}

// ── recall ────────────────────────────────────────────────────────────────

export interface RecallCorpus {
  candidateCount: number;
  selectedCount: number;
  selected: CorpusRecallEntry[];
}

export interface RecallLearning {
  mode: string;
  candidateCount: number;
  selectedCount: number;
  selected: LearningRecallEntry[];
}

export interface RecallResult {
  corpus: RecallCorpus;
  learning: RecallLearning;
}

// ── check ─────────────────────────────────────────────────────────────────

export type CheckLevel = "pass" | "warn" | "fail";

export interface CheckResult {
  id: string;
  title: string;
  level: CheckLevel;
  passed: boolean;
  message: string;
  /** Present only when the check has supporting evidence. */
  evidence?: string;
}

export interface CheckReport {
  filePath: string;
  /** Present only when a `routeId` was supplied. */
  routeId?: string;
  status: CheckLevel;
  passes: number;
  warnings: number;
  failures: number;
  total: number;
  /** Human-readable ratio, e.g. "6/8". */
  score: string;
  results: CheckResult[];
}

export interface VersionReport {
  cli: string;
  corpus: string;
}

// ── Option objects ────────────────────────────────────────────────────────

export interface RouteOptions {
  /** Max routes to return. Default 3, range 1–10. */
  limit?: number;
  /** Include the advisory explanation + related-knowledge section. Default false. */
  explain?: boolean;
}

export interface PromptOptions {
  /** Force a specific route id instead of scoring the brief. */
  routeId?: string;
  /** Include local learning-profile guidance (read-only; never recorded). Default false. */
  withLearning?: boolean;
  /** Restrict learning guidance to a category. */
  learningCategory?: string;
  /** Max learning entries. Range 1–100. */
  learningLimit?: number;
  /** Include a brief-relevant corpus recall block. Default false. */
  withRecall?: boolean;
  /** Max recall entries. Range 1–20. */
  recallLimit?: number;
}

export interface PackOptions extends PromptOptions {
  /** Byte budget for the bundled context files. Default 120000, range 1000–1000000. */
  maxBytes?: number;
}

export interface SearchOptions {
  /** Restrict to one corpus directory (must be a known search dir). */
  dir?: string;
  /** Max hits. Default 20, range 1–500. */
  limit?: number;
  /** Return ranked BM25 hits (score + matchedTokens) instead of plain line hits. */
  ranked?: boolean;
}

export interface RecallOptions {
  /** Max entries per side (corpus/learning). Range 1–20. */
  limit?: number;
  /** Restrict learning recall to a category. */
  category?: string;
}

export interface CheckOptions {
  /** Apply route-specific requirements for this route id. */
  routeId?: string;
  /** Validated for parity with the CLI; has no effect in-process (no exit code). */
  strict?: boolean;
}

export interface ArtifactOptions {
  /** Artifact operation to plan. */
  mode: ArtifactMode;
  /** Force a specific route id instead of scoring the brief. */
  routeId?: string;
}

// ── Read-only SDK verbs ───────────────────────────────────────────────────

/** Build a portable implementation, critique, or DESIGN.md artifact plan. */
export function artifact(brief: string, opts: ArtifactOptions): DesignArtifact;

/** Build one read-only route, design contract, review playbook, and next-step plan. */
export function start(brief: string, opts?: StartOptions): StartPayload;

/** Inspect supplied HTML without reading paths, running scripts, or writing files. */
export function inspectHtml(source: string, opts: InspectHtmlOptions): DesignQualityReport;

/** Compose one canonical plan and static HTML review without writing files or running a browser. */
export function reviewHtml(source: string, opts: ReviewHtmlOptions): ReviewWorkflow;

/** Prepare a self-validating review handoff without delivery, implementation, or writes. */
export function reviewHandoff(workflowSource: string, opts: ReviewHandoffOptions): ReviewHandoff;

/** Validate exact handoff bytes and return a bounded consumer receipt. */
export function verifyReviewHandoff(handoffSource: string, opts: VerifyReviewHandoffOptions): ReviewHandoffReceipt;

/** Bind exact intake and request sources into an immutable, unapproved implementation proposal. */
export function proposeImplementationScope(
  intakeSource: string,
  requestSource: string,
  opts: ProposeImplementationScopeOptions,
): ImplementationScopeProposal;

/** Record explicit human approval for one exact proposal without performing implementation or release writes. */
export function approveImplementationScope(
  proposalSource: string,
  opts: ApproveImplementationScopeOptions,
): ImplementationScopeApproval;

/** Read one Korean product review pack, or list the available packs when id is omitted. */
export function reviewPack(id?: string, opts?: Record<string, never>): ProductReviewPack | ProductReviewPackList;

/** Recommend the best route(s), commands, skills, and knowledge for a brief. */
export function route(brief: string, opts?: RouteOptions): RouteResult[];

/** List the full route catalog independent of any brief. */
export function routes(): RouteCatalog;

/** Build a ready-to-use agent prompt plan from a brief. */
export function prompt(brief: string, opts?: PromptOptions): PromptPlan;

/** Build a prompt plan plus a bounded context-file bundle from a brief. */
export function pack(brief: string, opts?: PackOptions): Pack;

/** Search the local corpus. Returns ranked hits when `ranked: true`, else plain line hits. */
export function search(query: string, opts: SearchOptions & { ranked: true }): RankedSearchHit[];
export function search(query: string, opts?: SearchOptions): SearchHit[];

/** Recall brief-relevant corpus knowledge and local learning-profile entries. */
export function recall(query: string, opts?: RecallOptions): RecallResult;

/** Check a Markdown artifact's content for grounding, accessibility, and route requirements. */
export function check(artifact: string, opts?: CheckOptions): CheckReport;

/** Report the CLI package version and the plugin/corpus version. */
export function version(): VersionReport;

// ── learn.* (Phase B — local writes) ─────────────────────────────────────
//
// The ONLY writing verbs in the SDK. Each writes exclusively to the local
// learning profile (`DESIGN_AI_LEARNING_FILE` / defaultLearningFile()), never
// the network. There is no `filePath` or `now`/timestamp option on any of
// these — target a specific profile via the `DESIGN_AI_LEARNING_FILE` env
// var, exactly like the CLI. See docs/SDK.md "Phase B — local writes".

export interface LearnRememberOptions {
  /** Learning-profile category. Default "preference". */
  category?: string;
}

export interface LearnFeedbackOptions {
  /** Feedback outcome; normalized by the underlying lib (e.g. "keep" | "avoid" | "improve"). Default "improve". */
  outcome?: string;
  /** Learning-profile category. Default "workflow". */
  category?: string;
}

export interface LearnCaptureOptions {
  /** Add route-specific check requirements for this route id before capturing. */
  routeId?: string;
}

/** A single stored learning-profile entry, as written by learn.remember/feedback/captureFromCheck. */
export interface LearningProfileEntry {
  id: string;
  category: string;
  text: string;
  source: string;
  createdAt: string;
}

export interface LearningProfile {
  version: number;
  updatedAt: string;
  entries: LearningProfileEntry[];
}

/** Return shape of learn.remember() and learn.feedback(). */
export interface RememberResult {
  file: string;
  entry: LearningProfileEntry;
  profile: LearningProfile;
}

/** An entry skipped by learn.captureFromCheck() because it duplicates an existing profile entry. */
export interface CaptureSkippedEntry {
  category: string;
  text: string;
  source: string;
  reason: string;
}

/** Return shape of learn.captureFromCheck() — the `captureLearningEntries` result. */
export interface CaptureResult {
  file: string;
  dryRun: boolean;
  applied: boolean;
  source: string;
  candidateCount: number;
  addedCount: number;
  skippedCount: number;
  count: number;
  entries: LearningProfileEntry[];
  skipped: CaptureSkippedEntry[];
}

/**
 * Phase B: the explicit, opt-in LOCAL-WRITE namespace. `learn.remember`,
 * `learn.feedback`, and `learn.captureFromCheck` are the only SDK verbs that
 * write files — each writes only the local learning profile.
 */
export declare const learn: {
  /** Record a local learning-profile preference. */
  remember(text: string, opts?: LearnRememberOptions): RememberResult;
  /** Record feedback (keep/avoid/improve) as a local learning-profile entry. */
  feedback(text: string, opts?: LearnFeedbackOptions): RememberResult;
  /** Check a Markdown artifact and capture its non-pass results as local learning-profile entries. */
  captureFromCheck(artifact: string, opts?: LearnCaptureOptions): CaptureResult;
};
