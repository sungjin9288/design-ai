// Draft-first image workflow. A provider receives no request until all boundary checks pass.

import { randomUUID } from "node:crypto";
import { assertPromptLineage, assertPromptRequest } from "./image-prompt-contract.mjs";
import { createImageAssetStore, hashImagePrompt } from "./image-asset-manifest.mjs";
import { assertProviderReferenceDescriptor, executeImageProvider } from "./image-provider.mjs";

export class ImageDraftError extends Error { constructor(message) { super(message); this.name = "ImageDraftError"; } }

export function createImageWorkflow({ client, provider, assetStore = createImageAssetStore(), executeProvider = executeImageProvider, idFactory = randomUUID, now = () => new Date().toISOString() } = {}) {
  if (!client || typeof client.recommend !== "function" || typeof client.compose !== "function" || typeof client.validate !== "function") throw new TypeError("Prompt Guide client is required");
  if (!assetStore || typeof assetStore.getReferenceDescriptor !== "function") throw new TypeError("image asset store is required");
  const drafts = new Map();
  const jobs = new Map();
  function providerSettings(request) { return { size: request.metadata.size || request.aspectRatio || "1:1", quality: request.metadata.quality || "standard" }; }

  async function resolveReferences(request) {
    if (request.taskType !== "editing") return [];
    if (typeof assetStore.root !== "string") throw new ImageDraftError("editing source assets require a configured local asset root");
    const descriptors = await Promise.all(request.referenceAssetIds.map((assetId) => assetStore.getReferenceDescriptor(assetId)));
    if (descriptors.some((descriptor) => !descriptor)) throw new ImageDraftError("every editing source asset must exist in the local asset store");
    try { return descriptors.map((descriptor) => assertProviderReferenceDescriptor(descriptor, { assetRoot: assetStore.root })); }
    catch (error) { throw new ImageDraftError(error.message); }
  }

  async function composeDraft(rawRequest, { requestId, correlationId } = {}) {
    const request = assertPromptRequest(rawRequest);
    const referenceAssets = (await resolveReferences(request)).map((asset) => Object.freeze({ ...asset }));
    const recommendation = await client.recommend(request, { requestId, correlationId });
    const compiled = await client.compose(request, { requestId, correlationId });
    let lineage;
    try { lineage = assertPromptLineage(request, recommendation, compiled); } catch (error) { throw new ImageDraftError(error.message); }
    const validation = await client.validate({ ...request, compiled: lineage.compiled }, { requestId, correlationId });
    const draft = { draftId: idFactory(), request: lineage.request, recommendation: lineage.recommendation, compiled: lineage.compiled, validation, referenceAssets, approved: false, consumed: false, createdAt: now() };
    drafts.set(draft.draftId, draft);
    return publicDraft(draft);
  }

  function publicDraft(draft) {
    const compiled = {
      promptId: draft.compiled.promptId,
      taskType: draft.compiled.taskType,
      selectedTemplateId: draft.compiled.selectedTemplateId,
      selectedTemplateVersion: draft.compiled.selectedTemplateVersion,
      catalogVersion: draft.compiled.catalogVersion,
      language: draft.compiled.language,
      compiledPrompt: draft.compiled.compiledPrompt,
      negativeConstraints: draft.compiled.negativeConstraints,
      provenance: draft.compiled.provenance,
      responseVersion: draft.compiled.responseVersion,
      createdAt: draft.compiled.createdAt,
    };
    return {
      draftId: draft.draftId,
      taskType: draft.request.taskType,
      recommendation: draft.recommendation,
      compiled,
      validation: draft.validation,
      output: providerSettings(draft.request),
      executable: draft.validation.valid && !draft.consumed,
      createdAt: draft.createdAt,
    };
  }

  function approveDraft(draftId) {
    const draft = drafts.get(draftId);
    if (!draft) throw new ImageDraftError("image draft was not found");
    if (!draft.validation.valid) throw new ImageDraftError("invalid Prompt Guide draft cannot be approved");
    if (draft.consumed) throw new ImageDraftError("image draft has already been consumed");
    draft.approved = true;
    return publicDraft(draft);
  }

  async function executeDraft(draftId, { approved = false, createdBy = "local-operator" } = {}) {
    const draft = drafts.get(draftId);
    if (!draft) throw new ImageDraftError("image draft was not found");
    if (!approved) throw new ImageDraftError("explicit draft approval is required before provider execution");
    const referenceAssets = await resolveReferences(draft.request);
    if (referenceAssets.length !== draft.referenceAssets.length || referenceAssets.some((asset, index) => Object.keys(asset).some((key) => asset[key] !== draft.referenceAssets[index][key]))) {
      throw new ImageDraftError("editing source assets changed since draft composition; compose a new draft before approval");
    }
    approveDraft(draftId);
    draft.consumed = true;
    const request = draft.request;
    const providerInput = {
      prompt: draft.compiled.compiledPrompt,
      negativeConstraints: request.negativeConstraints,
      ...providerSettings(request),
      referenceAssets,
      providerOptions: request.metadata.providerOptions && typeof request.metadata.providerOptions === "object" ? request.metadata.providerOptions : {},
    };
    const jobId = idFactory();
    const job = { jobId, draftId, status: "running", createdAt: now() };
    jobs.set(jobId, job);
    try {
      const providerResult = await executeProvider({ provider, input: providerInput, assetRoot: assetStore.root });
      const assetId = idFactory();
      const manifest = {
        assetId, jobId, taskType: request.taskType, sourceAssetIds: request.referenceAssetIds,
        promptId: draft.compiled.promptId, selectedTemplateId: draft.compiled.selectedTemplateId,
        selectedTemplateVersion: draft.compiled.selectedTemplateVersion, catalogVersion: draft.compiled.catalogVersion,
        acceptedResponseVersion: draft.compiled.responseVersion, compiledPromptHash: hashImagePrompt(draft.compiled.compiledPrompt),
        provider: providerResult.provider, model: providerResult.model,
        providerParameters: { size: providerInput.size, quality: providerInput.quality }, provenance: draft.compiled.provenance,
        createdAt: now(), createdBy, reviewStatus: "draft", rightsStatus: "original-generated",
      };
      const persisted = await assetStore.persist({ manifest, mediaType: providerResult.mediaType, bytes: providerResult.bytes });
      Object.assign(job, { status: "succeeded", assetId, asset: persisted, completedAt: now() });
      return { ...job, manifest };
    } catch (error) {
      Object.assign(job, { status: "failed", error: error.name === "Error" ? "Image provider failed" : error.name, completedAt: now() });
      throw error;
    }
  }

  return { composeDraft, approveDraft, executeDraft, getDraft: (id) => drafts.get(id) ? publicDraft(drafts.get(id)) : null, getJob: (id) => jobs.get(id) || null, listAssets: () => assetStore.list(), getAsset: (id) => assetStore.get(id), assetStore };
}
