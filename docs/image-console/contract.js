(function (root) {
  "use strict";
  function lines(value) { return String(value || "").split("\n").map(function (item) { return item.trim(); }).filter(Boolean); }
  function text(value) { return String(value || "").trim(); }
  function buildGenerationRequest(values) {
    return {
      taskType: "generation", domain: text(values.domain), outputType: text(values.outputType), intent: text(values.intent), language: text(values.language || "ko"),
      audience: text(values.audience), aspectRatio: text(values.aspectRatio), exactTexts: lines(values.exactTexts), constraints: lines(values.constraints), negativeConstraints: lines(values.negativeConstraints), metadata: { size: text(values.size || values.aspectRatio || "1:1"), quality: text(values.quality || "standard") },
    };
  }
  function buildEditingRequest(values) {
    var referenceAssetId = text(values.referenceAssetId);
    return {
      taskType: "editing", domain: text(values.domain), outputType: text(values.outputType), intent: text(values.intent), language: text(values.language || "ko"),
      aspectRatio: text(values.aspectRatio), exactTexts: lines(values.exactTexts), constraints: lines(values.constraints), negativeConstraints: lines(values.negativeConstraints),
      preserve: lines(values.preserve), modify: lines(values.modify), remove: lines(values.remove), add: lines(values.add), mustNotChange: lines(values.mustNotChange), referenceAssetIds: referenceAssetId ? [referenceAssetId] : [], metadata: { size: text(values.size || values.aspectRatio || "1:1"), quality: text(values.quality || "standard") },
    };
  }
  function actionableError(payload) {
    var error = payload && payload.error ? payload.error : payload || {};
    var message = text(error.message) || "The request could not be completed. Review the form and try again.";
    if (error.type === "PromptGuideRateLimitError" && error.retryAfter !== null && error.retryAfter !== undefined) return message + " Try again after " + error.retryAfter + " seconds.";
    if (Array.isArray(error.details) && error.details.length) return message + " " + error.details.map(function (item) { return item.field ? item.field + ": " + item.message : item.message; }).join(" ");
    return message;
  }
  root.DesignAiImageConsoleContract = { lines: lines, buildGenerationRequest: buildGenerationRequest, buildEditingRequest: buildEditingRequest, actionableError: actionableError };
}(window));
