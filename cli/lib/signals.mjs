// Public learning signal surface for `design-ai learn --signals` — re-exports the signals-* modules.

export {
  DEFAULT_SIGNAL_EVAL_FILES,
  summarizeSignalEvalFile,
} from "./signals-eval.mjs";

export {
  agentBacklogReport,
  learningSignalRegistry,
} from "./signals-registry.mjs";

export {
  renderAgentBacklogReport,
  renderLearningSignalReport,
} from "./signals-render.mjs";
