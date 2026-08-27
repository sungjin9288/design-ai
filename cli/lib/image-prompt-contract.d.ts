export type ImageTaskType = "generation" | "editing";

export interface ImageEditingInstructions {
  preserve: string[];
  modify: string[];
  remove: string[];
  add: string[];
  mustNotChange: string[];
  referenceAssetIds: string[];
}

export interface ImagePromptMetadata {
  size?: string;
  quality?: string;
  providerOptions?: Record<string, unknown>;
}

export interface ImageReferenceAsset {
  assetId: string;
  assetPath: string;
  mediaType: "image/png" | "image/jpeg" | "image/webp";
  byteSize: number;
  sha256: `sha256:${string}`;
}

interface ImagePromptRequestBase {
  domain: string;
  outputType: string;
  intent: string;
  language: string;
  audience?: string;
  aspectRatio?: string;
  exactTexts?: string[];
  styles?: string[];
  scenes?: string[];
  constraints?: string[];
  negativeConstraints?: string[];
  metadata?: ImagePromptMetadata;
}

export interface ImageGenerationPromptRequest extends ImagePromptRequestBase {
  taskType: "generation";
  preserve?: never;
  modify?: never;
  remove?: never;
  add?: never;
  mustNotChange?: never;
  referenceAssetIds?: never;
}

export interface ImageEditingPromptRequest extends ImagePromptRequestBase {
  taskType: "editing";
  preserve?: string[];
  modify?: string[];
  remove?: string[];
  add?: string[];
  mustNotChange?: string[];
  referenceAssetIds: string[];
}

export type ImagePromptRequest = ImageGenerationPromptRequest | ImageEditingPromptRequest;

export interface PromptProvenance {
  sourceRepository: string;
  upstreamCommit: string;
  catalogVersion: string;
  overlayVersions: Record<string, unknown>;
}

export interface ImagePromptRecommendation {
  taskType: ImageTaskType;
  language: string;
  selectedTemplateId: string;
  selectedTemplateVersion: string;
  catalogVersion: string;
  reason: string;
  provenance: PromptProvenance;
  responseVersion: "v1";
}

export interface CompiledImagePrompt {
  promptId: string;
  taskType: ImageTaskType;
  language: string;
  selectedTemplateId: string;
  selectedTemplateVersion: string;
  catalogVersion: string;
  compiledPrompt: string;
  promptBlocks: unknown[];
  negativeConstraints: string[];
  evaluationCriteria: unknown[];
  provenance: PromptProvenance;
  responseVersion: "v1";
  createdAt: string;
}

export interface ImagePromptValidationResult {
  valid: boolean;
  errors: Array<{ code: string; message: string; field?: string }>;
  warnings: Array<{ code: string; message: string; field?: string }>;
  responseVersion: "v1";
}

export interface ImagePromptCatalogSummary {
  templateCount: number;
  catalogVersion: string;
  sourceRepository: string;
  upstreamCommit: string;
  overlayVersions: Record<string, unknown>;
  responseVersion: "v1";
}

export interface GeneratedAssetManifest {
  assetId: string;
  jobId: string;
  taskType: ImageTaskType;
  sourceAssetIds: string[];
  promptId: string;
  selectedTemplateId: string;
  selectedTemplateVersion: string;
  catalogVersion: string;
  acceptedResponseVersion: "v1";
  compiledPromptHash: `sha256:${string}`;
  provider: string;
  model: string;
  providerParameters: { size: string; quality: string };
  provenance: PromptProvenance;
  createdAt: string;
  createdBy: string;
  reviewStatus: "draft";
  rightsStatus: "original-generated";
}
