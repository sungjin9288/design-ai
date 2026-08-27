(function () {
  "use strict";
  var contract = window.DesignAiImageConsoleContract;
  var state = { draftId: null, composing: false, revision: 0 };
  var generationTab = document.getElementById("generation-tab");
  var editingTab = document.getElementById("editing-tab");
  var generationPanel = document.getElementById("generation-panel");
  var editingPanel = document.getElementById("editing-panel");
  var sourceAsset = document.getElementById("reference-asset-id");
  var status = document.getElementById("status");
  var errorBox = document.getElementById("error");
  var prompt = document.getElementById("compiled-prompt");
  var details = document.getElementById("draft-details");
  var approval = document.getElementById("draft-approval");
  var execute = document.getElementById("execute-draft");
  var tabs = [generationTab, editingTab];
  function values(form) { return Object.fromEntries(new FormData(form).entries()); }
  function setError(message) { errorBox.hidden = !message; errorBox.textContent = message || ""; }
  function resetDraft() { state.draftId = null; approval.checked = false; approval.disabled = true; execute.disabled = true; details.hidden = true; prompt.value = ""; setError(""); }
  function invalidateDraft() { var active = state.draftId || state.composing; state.revision += 1; state.composing = false; if (!active) return; resetDraft(); status.textContent = "The form changed. Compose and validate a new draft before approval."; }
  function setMode(mode, focus) {
    var generation = mode === "generation";
    generationPanel.hidden = !generation;
    editingPanel.hidden = generation;
    generationTab.setAttribute("aria-selected", String(generation));
    editingTab.setAttribute("aria-selected", String(!generation));
    generationTab.tabIndex = generation ? 0 : -1;
    editingTab.tabIndex = generation ? -1 : 0;
    generationTab.className = generation ? "button button--primary" : "button button--secondary";
    editingTab.className = generation ? "button button--secondary" : "button button--primary";
    state.revision += 1; state.composing = false; resetDraft();
    status.textContent = "Complete a form to create a draft.";
    if (focus) (generation ? generationTab : editingTab).focus();
  }
  function assetLabel(asset) {
    return [asset.assetId, asset.taskType, asset.model, asset.createdAt].filter(function (value) { return value !== undefined && value !== null && String(value).trim() !== ""; }).map(String).join(" — ");
  }
  function renderDetails(draft) {
    details.replaceChildren();
    [["Template", draft.recommendation.selectedTemplateId + " · " + draft.recommendation.selectedTemplateVersion], ["Catalog", draft.recommendation.catalogVersion], ["Output", draft.output.size + " · " + draft.output.quality], ["Response", draft.compiled.responseVersion], ["Recommendation", draft.recommendation.reason]].forEach(function (pair) {
      var term = document.createElement("dt"); var definition = document.createElement("dd");
      term.textContent = pair[0]; definition.textContent = pair[1]; details.append(term, definition);
    });
    details.hidden = false;
  }
  async function request(url, body) {
    var response = await fetch(url, { method: body ? "POST" : "GET", headers: body ? { "content-type": "application/json", accept: "application/json" } : { accept: "application/json" }, body: body ? JSON.stringify(body) : undefined });
    var payload;
    try { payload = await response.json(); } catch { throw { error: { message: "The local gateway returned an invalid response." } }; }
    if (!response.ok) throw payload;
    return payload;
  }
  async function loadAssets() {
    try {
      var result = await request("/api/image/assets");
      sourceAsset.replaceChildren();
      var placeholder = document.createElement("option"); placeholder.value = "";
      if (!result.assets.length) { placeholder.textContent = "No local assets are available yet"; sourceAsset.append(placeholder); sourceAsset.disabled = true; return; }
      placeholder.textContent = "Choose a stored asset"; sourceAsset.append(placeholder);
      result.assets.forEach(function (asset) { var option = document.createElement("option"); option.value = asset.assetId; option.textContent = assetLabel(asset); sourceAsset.append(option); });
      sourceAsset.disabled = false;
    } catch (payload) {
      sourceAsset.replaceChildren(); var option = document.createElement("option"); option.value = ""; option.textContent = "Local assets could not be loaded"; sourceAsset.append(option); sourceAsset.disabled = true;
      setError(contract.actionableError(payload));
    }
  }
  async function submit(form) {
    if (form.dataset.mode === "editing" && sourceAsset.disabled) {
      status.textContent = "Draft was not created; no provider job was started.";
      setError("No local source asset is available. Generate and save an image before starting an edit.");
      return;
    }
    if (!form.reportValidity()) return;
    var revision = state.revision + 1; state.revision = revision; state.composing = true; resetDraft(); status.textContent = "Composing and validating the Prompt Guide draft…";
    try {
      var body = form.dataset.mode === "editing" ? contract.buildEditingRequest(values(form)) : contract.buildGenerationRequest(values(form));
      var draft = await request("/api/image/compose", body);
      if (revision !== state.revision) return;
      state.composing = false;
      state.draftId = draft.draftId; prompt.value = draft.compiled.compiledPrompt; renderDetails(draft);
      if (draft.validation.valid) { status.textContent = "Draft validated. Review the preview before approving one provider execution."; approval.disabled = false; }
      else { status.textContent = "Draft needs changes before it can be executed."; setError(draft.validation.errors.map(function (item) { return item.message; }).join(" ")); }
    } catch (payload) { if (revision !== state.revision) return; state.composing = false; status.textContent = "Draft was not created; no provider job was started."; setError(contract.actionableError(payload)); }
  }
  function onTabKeydown(event) {
    var current = tabs.indexOf(event.currentTarget);
    var next = null;
    if (event.key === "ArrowRight") next = (current + 1) % tabs.length;
    if (event.key === "ArrowLeft") next = (current + tabs.length - 1) % tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabs.length - 1;
    if (next === null) return;
    event.preventDefault(); setMode(next === 0 ? "generation" : "editing", true);
  }
  generationTab.addEventListener("click", function () { setMode("generation"); });
  editingTab.addEventListener("click", function () { setMode("editing"); });
  tabs.forEach(function (tab) { tab.addEventListener("keydown", onTabKeydown); });
  generationPanel.addEventListener("submit", function (event) { event.preventDefault(); submit(generationPanel); });
  editingPanel.addEventListener("submit", function (event) { event.preventDefault(); submit(editingPanel); });
  [generationPanel, editingPanel].forEach(function (form) { form.addEventListener("input", invalidateDraft); form.addEventListener("change", invalidateDraft); });
  approval.addEventListener("change", function () { execute.disabled = !approval.checked || !state.draftId; });
  execute.addEventListener("click", async function () {
    if (!state.draftId || !approval.checked) return;
    execute.disabled = true; setError(""); status.textContent = "Running one approved local provider job…";
    try { var job = await request("/api/image/jobs", { draftId: state.draftId, approved: true }); status.textContent = "Image asset " + job.assetId + " was generated as a draft for review."; approval.disabled = true; loadAssets(); }
    catch (payload) { state.draftId = null; approval.checked = false; approval.disabled = true; execute.disabled = true; status.textContent = "The provider job was not completed. Compose a new draft before trying again."; setError(contract.actionableError(payload)); }
  });
  loadAssets();
}());
