# Session log

A single-page narrative of how design-ai grew from v2.0 (foundation) to v4.55 (mature, dogfooded, 90%+ canonical coverage, a website improvement control tower, public registry Website Console smoke coverage including MCP probe output-file persistence with shared assertion helpers and release metadata guards, MCP probe action plan parity with structured MCP action plan JSON export, output-file persistence, and release metadata guards, verified Website Console evidence metadata, generated bundle contract verification with per-file diagnostics, repair preview/apply, repair report output-file persistence, repair report command guidance, executable repair guidance smoke coverage, shared repair guidance smoke helpers, shared repair report assertion helpers, release metadata guard coverage for shared repair guidance smoke helpers and shared repair report assertion helpers, and privacy-preserving local learning restore rollback / pruning / diff / usage / eval / restore-backup readiness gates with public registry smoke coverage). Useful for adopters, contributors, and future maintainers.

For per-version detail, see [`CHANGELOG.md`](../CHANGELOG.md).
For per-phase detail, see [`docs/ROADMAP.md`](ROADMAP.md).

- **Phase 549 (unreleased)** — Added apply-plan manual-apply status tone fields so wrappers can style apply badges without maintaining local status-tone mapping.
- **Phase 548 (unreleased)** — Added apply-plan manual-apply status label fields so wrappers can render apply badges without maintaining a local enum-to-label map.
- **Phase 547 (unreleased)** — Added apply-plan manual-apply status enum fields so wrappers can render apply badges without recomputing readiness and blocked states.
- **Phase 546 (unreleased)** — Added apply-plan manual-apply blocked reason code/message fields so wrappers can render disabled patch-apply copy without recomputing candidate and precondition state.
- **Phase 545 (unreleased)** — Added apply-plan manual-apply readiness booleans so wrappers can gate patch-apply affordances without recomputing candidate and required-pending precondition state.
- **Phase 544 (unreleased)** — Added apply-plan satisfied, pending, and required-pending precondition count fields so wrappers can render checklist enabled/disabled summaries without recomputing row state.
- **Phase 543 (unreleased)** — Added apply-plan precondition count fields so wrappers can render checklist summaries without recounting compact precondition objects.
- **Phase 542 (unreleased)** — Added apply-plan `decision.commandOutputArtifactApplyPreconditionsByKey` and `decision.nextCommandOutputArtifactApplyPreconditions` so wrappers can consume compact `{ id, label, required }` checklist items without zipping parallel arrays.
- **Phase 541 (unreleased)** — Added apply-plan `decision.commandOutputArtifactApplyPreconditionLabelsByKey` and `decision.nextCommandOutputArtifactApplyPreconditionLabels` so wrappers can render patch-apply checklist copy without hard-coding labels for precondition ids.
- **Phase 540 (unreleased)** — Added apply-plan `decision.commandOutputArtifactApplyPreconditionIdsByKey` and `decision.nextCommandOutputArtifactApplyPreconditionIds` so wrappers can render ordered patch-apply checklist items without recombining review and clean-workspace booleans.
- **Phase 539 (unreleased)** — Added apply-plan `decision.commandOutputArtifactRequiresCleanWorkspaceBeforeApplyByKey` and `decision.nextCommandOutputArtifactRequiresCleanWorkspaceBeforeApply` so wrappers can require clean workspaces before manual patch-preview apply without confusing preview generation safety with apply safety.
- **Phase 538 (unreleased)** — Added apply-plan `decision.commandOutputArtifactReviewInstructionByKey` and `decision.nextCommandOutputArtifactReviewInstruction` so wrappers can render artifact-specific review guidance without hard-coding Markdown report or patch-preview copy.
- **Phase 537 (unreleased)** — Added apply-plan `decision.commandOutputArtifactRequiresManualReviewByKey` and `decision.nextCommandOutputArtifactRequiresManualReview` so wrappers can require human review before applying patch previews without parsing command keys or manual-apply candidate flags.
- **Phase 536 (unreleased)** — Added apply-plan `decision.commandOutputArtifactManualApplyCandidateByKey` and `decision.nextCommandOutputArtifactManualApplyCandidate` so wrappers can show manual-apply affordances only for patch previews without parsing artifact disposition strings.
- **Phase 535 (unreleased)** — Added apply-plan `decision.commandOutputArtifactDispositionByKey` and `decision.nextCommandOutputArtifactDisposition` so wrappers can distinguish review-only artifacts from manual-apply previews without hard-coding command keys.
- **Phase 534 (unreleased)** — Added apply-plan `decision.commandOutputArtifactMediaTypeByKey` and `decision.nextCommandOutputArtifactMediaType` so wrappers can configure Markdown and diff viewers/downloads without parsing file extensions or artifact type strings.
- **Phase 533 (unreleased)** — Added apply-plan `decision.commandOutputArtifactActionByKey` and `decision.nextCommandOutputArtifactAction` so wrappers can choose Markdown report rendering or unified diff preview rendering without deriving UI behavior from artifact type strings.
- **Phase 532 (unreleased)** — Added apply-plan `decision.commandOutputArtifactTypeByKey` and `decision.nextCommandOutputArtifactType` so wrappers can distinguish Markdown reports from unified diff previews without parsing file extensions.
- **Phase 531 (unreleased)** — Added apply-plan `decision.commandOutputArtifactByKey` and `decision.nextCommandOutputArtifact` so wrappers can display selected preview artifact targets without parsing `--out` arguments.
- **Phase 530 (unreleased)** — Added apply-plan `decision.commandDescriptionByKey` and `decision.nextCommandDescription` so wrappers can render selected preview command tooltips or secondary descriptions without hard-coding command semantics.
- **Phase 529 (unreleased)** — Added apply-plan `decision.commandDisplayLabelByKey` and `decision.nextCommandDisplayLabel` so wrappers can render selected preview command labels without deriving UI copy from camelCase keys.
- **Phase 528 (unreleased)** — Added apply-plan `decision.commandStringByKey` so wrappers can display or copy selected preview command strings by key without scanning arrays.
- **Phase 527 (unreleased)** — Added apply-plan `decision.commandArgsByKey` so wrappers can retrieve selected preview command argv by key without scanning arrays.
- **Phase 526 (unreleased)** — Added apply-plan `decision.commandSafetyLevelByKey` so wrappers can validate selected preview command safety levels by key without scanning arrays.
- **Phase 525 (unreleased)** — Added apply-plan `decision.commandRunPolicyByKey` so wrappers can validate selected preview command run policies by key without scanning arrays.
- **Phase 524 (unreleased)** — Added apply-plan `decision.commandStepByKey` so wrappers can validate selected preview command order by key without scanning arrays.
- **Phase 523 (unreleased)** — Added apply-plan decision command step metadata so compact selected preview commands preserve their original command-sequence order.
- **Phase 522 (unreleased)** — Added apply-plan `decision.nextCommandSafety` so wrappers consuming the separate `nextCommand*` fields can gate the selected optional preview command directly.
- **Phase 521 (unreleased)** — Added nested safety objects to compact apply-plan decision commands so wrappers can gate `decision.commands`, `decision.commandByKey`, and `decision.nextCommandEntry` without jumping to the full command sequence.
- **Phase 520 (unreleased)** — Added apply-plan `decision.nextCommandEntry` so wrappers can consume the selected optional preview command as one compact command object.
- **Phase 519 (unreleased)** — Added apply-plan decision command lookup and next-command metadata so wrappers can retrieve optional preview commands without scanning `decision.commands`.
- **Phase 518 (unreleased)** — Added compact apply-plan decision command handoffs so local AI/agent wrappers can offer optional preview commands directly from `stageSelection.decision`.
- **Phase 517 (unreleased)** — Added apply-plan `stageSelection.decision.safety` so local AI/agent wrappers can gate the selected branch from the decision object itself.
- **Phase 516 (unreleased)** — Added apply-plan `stageSelection.decision` enum so local AI/agent wrappers can branch to the optional preview stage without combining strategy text and stage summaries.
- **Phase 515 (unreleased)** — Added compact apply-plan selected-stage summaries so local AI/agent wrappers can inspect optional preview, required manual, and required command-bearing branches without scanning the full stage list.
- **Phase 514 (unreleased)** — Added apply-plan operator runbook `stageSelection` summary metadata so local AI/agent wrappers can consume optional preview, required manual edit, and required command-gate selection from one object.
- **Phase 513 (unreleased)** — Added apply-plan operator runbook required-stage handoff fields so local AI/agent wrappers can distinguish optional preview artifacts from required manual edits and the next required command-bearing review gate.
- **Phase 512 (unreleased)** — Added apply-plan operator runbook `stageKeys` and `stageByKey` so local AI/agent wrappers can retrieve named runbook stages without scanning the ordered stage array.
- **Phase 511 (unreleased)** — Added apply-plan `operatorRunbook` stages so local AI/agent wrappers can follow optional preview artifacts, manual skill edits, review readiness, and strict gate order without inferring operator workflow from prose.
- **Phase 510 (unreleased)** — Added apply-plan `commandSequenceKeys` and `commandSequenceByKey` so local AI/agent wrappers can retrieve named follow-up commands directly without scanning the ordered sequence array.
- **Phase 509 (unreleased)** — Added apply-plan `commandSequenceSummary` so local AI/agent wrappers can branch on executable/blocked state, local output writes, mutation flags, and external-AI boundaries without reducing the full sequence array.
- **Phase 508 (unreleased)** — Added apply-plan `commandSequence` and per-step run-policy/safety metadata so local AI/agent wrappers can execute the full follow-up handoff in deterministic order without parsing prose.
- **Phase 507 (unreleased)** — Added apply-plan `nextCommandRunPolicy` and `nextCommandSafety` metadata so local AI/agent wrappers can verify the selected follow-up command is read-only and non-mutating before execution.
- **Phase 506 (unreleased)** — Added `nextCommandKey`, `nextCommand`, and `nextCommandArgs` to skill proposal apply-plan `commandContract` output so local AI/agent wrappers can run the first safe read-only review-check command without parsing prose.
- **Phase 505 (unreleased)** — Added top-level apply-plan `commandContract` check summary counts (`checkCount`, `passCount`, `warningCount`) so local AI/agent wrappers can read command readiness without reducing the full checks array.
- **Phase 504 (unreleased)** — Added fail-focused `commandContract` diagnostics for skill proposal apply-plan outputs, including `failureCount`, `failedCheckIds`, `failedChecks`, and deterministic next-action guidance.
- **Phase 503 (unreleased)** — Added release metadata guard coverage for packed-tarball human apply-plan `Command contract` smoke wording.
- **Phase 502 (unreleased)** — Added default human output and packed-tarball smoke coverage for skill proposal apply-plan command contract summaries.
- **Phase 501 (unreleased)** — Added self-describing `commandContract` metadata and Markdown summaries for skill proposal apply-plan follow-up commands so local automation can validate required keys, review-file context, suffixes, and read-only flags.
- **Phase 500 (unreleased)** — Consolidated skill proposal apply-plan follow-up command generation and expanded unit/package-smoke coverage for every machine-readable `commandArgs` path.
- **Phase 499 (unreleased)** — Added context-preserving apply-plan follow-up commands and machine-readable `commandArgs` for `learn --propose-skills --apply-plan` manual skill proposal handoffs.
- **Phase 498 (unreleased)** — Added read-only `design-ai learn --propose-skills --review-file skill-proposals.review.json --apply-plan` accepted proposal manual apply plans plus packed-tarball smoke and release metadata guard coverage.
- **Phase 497 (unreleased)** — Added packed-tarball smoke and release metadata guard coverage for `design-ai learn --propose-skills --review-file skill-proposals.review.json --review-check --report --out skill-proposal-review-check.md` Markdown readiness reports.
- **Phase 496 (unreleased)** — Added read-only `design-ai learn --propose-skills --review-file skill-proposals.review.json --review-check` review-file readiness checks plus packed-tarball smoke and release metadata guard coverage.
- **Phase 495 (unreleased)** — Recorded full `npm run release:check` evidence after the learning readiness status-count index change, confirming unit tests, strict audits, package contents, release metadata, release self-tests, and packed-tarball installed-bin/one-shot smoke still pass together.
- **Phase 494 (unreleased)** — Added learning readiness status count indexes to `learn --signals` and focused `learn --agent-backlog` JSON/Markdown reports, with package smoke assertions for packaged status-count contract coverage.
- **Phase 493 (unreleased)** — Recorded full `npm run release:check` evidence after the public registry learning readiness Markdown report guard, confirming unit tests, strict audits, package contents, release metadata, release self-tests, and packed-tarball installed-bin/one-shot smoke still pass together.
- **Phase 492 (unreleased)** — Added public registry smoke and release metadata guard coverage for learning readiness Markdown report `Readiness check index` sections in `learn --signals --report` and focused `learn --agent-backlog --report`.
- **Phase 491 (unreleased)** — Added packed-tarball smoke and release metadata guard coverage for readiness check index sections in learning signal and focused agent backlog Markdown reports.
- **Phase 490 (unreleased)** — Added readiness check index sections to learning signal and focused agent backlog Markdown reports so human review artifacts expose required/optional ids and per-id status/required lookup.
- **Phase 489 (unreleased)** — Added release metadata guard coverage and release-facing docs wording for packed-tarball check index JSON field coverage in focused agent backlog readiness output.
- **Phase 488 (unreleased)** — Added automation-friendly learning readiness check indexes (`requiredCheckIds`, `optionalCheckIds`, `checkStatusById`, `checkRequiredById`) for `learn --signals` and focused `learn --agent-backlog` JSON.
- **Phase 487 (unreleased)** — Added packed-tarball smoke and release metadata guard coverage for focused agent backlog `optionalGapDetails` so no-command check-capture optional gaps preserve structured reason, next-condition, and no-placeholder-mutation policy.
- **Phase 486 (unreleased)** — Added structured `readiness.optionalGapDetails` and Markdown optional-gap guidance so missing check-capture evidence remains advisory with explicit next-condition and no-placeholder-mutation policy.
- **Phase 485 (unreleased)** — Recorded full `npm run release:check` evidence after the agent backlog readiness release metadata guard, confirming unit tests, strict audits, package contents, release metadata, release self-tests, and packed-tarball installed-bin/one-shot smoke still pass together.
- **Phase 484 (unreleased)** — Added release metadata guard coverage for packed-tarball `design-ai learn --agent-backlog` readiness summary and check-capture optional-gap smoke wording across release-facing docs.
- **Phase 483 (unreleased)** — Added packed-tarball package smoke assertions and self-test drift coverage for focused `design-ai learn --agent-backlog` readiness summaries in JSON and Markdown reports.
- **Phase 482 (unreleased)** — Passed learning signal readiness summaries through focused `design-ai learn --agent-backlog` JSON and Markdown reports so local AI/agent handoffs expose required gates and optional evidence gaps in one payload.
- **Phase 481 (unreleased)** — Added structured `design-ai learn --signals` readiness summaries in JSON and Markdown reports, separating required AI/agent gates from optional evidence gaps such as missing check-capture entries.
- **Phase 480 (unreleased)** — Recorded full `npm run release:check` evidence after the optional refresh-only agent backlog closeout, confirming unit tests, strict audits, whitespace checks, package contents, release metadata, release self-tests, and packed-tarball smoke still pass together.
- **Phase 479 (unreleased)** — Recorded post-commit release evidence for the optional refresh-only agent backlog package smoke assertion, including `release:self-test`, `package:check`, and focused backlog clear-state verification.
- **Phase 478 (unreleased)** — Added packed-tarball smoke assertions for optional refresh-only agent backlog no-command JSON so installed-bin and one-shot paths verify the status-metadata runbook selection reason.
- **Phase 477 (unreleased)** — Added release metadata guards for optional refresh-only agent backlog runbook selection semantics so release-facing docs keep no-command refresh output framed as status metadata, not executable handoff work.
- **Phase 476 (unreleased)** — Clarified focused agent backlog operator runbook selection reasons so optional refresh-only no-command states read as status metadata, not executable handoff work.
- **Phase 475 (unreleased)** — Clarified focused agent backlog operator handoff reasons so completed no-command states distinguish optional refresh metadata from executable handoff work.
- **Phase 474 (unreleased)** — Clarified focused agent backlog next-command alignment reasons so optional refresh-only no-command states no longer claim that the operator runbook has no command.
- **Phase 473 (unreleased)** — Aligned focused agent backlog no-command completion across `operatorRunbook` and `commandEffectReview` by making refresh-only runbook commands optional when no command-bearing action exists.
- **Phase 472 (unreleased)** — Marked focused agent backlog no-command handoff states as ready and complete, with explicit `hasCommand`/`complete` JSON fields and optional refresh semantics for local automation.
- **Phase 471 (unreleased)** — Stabilized focused agent backlog regression tests so environment-dependent workspace readiness actions no longer break full `npm test` while still checking target metadata and ranking contracts.
- **Phase 470 (unreleased)** — Removed the placeholder check-capture seed command from focused agent backlog actions so absent `check:*` captures remain advisory instead of becoming a mutation-capable next command.
- **Phase 469 (unreleased)** — Aligned focused agent backlog eval replay with executed `learning-eval-report.json` evidence so template-only checkpoints emit a concrete `learn --eval --out` handoff and stop warning once the sibling report exists.
- **Phase 468 (unreleased)** — Split `design-ai workspace` git status into active changes and ignored untracked local portfolio/evidence artifacts so separate-thread output files do not block dogfood readiness.
- **Phase 467 (unreleased)** — Classified focused agent backlog workspace `--learning-usage` arguments as usage sidecar targets so readiness handoffs expose both profile and usage paths.
- **Phase 466 (unreleased)** — Reclassified focused agent backlog `--with-learning` usage-record commands as local-state mutations, exposing learning profile and usage sidecar env targets before review-before-mutation execution.
- **Phase 465 (unreleased)** — Aligned agent backlog learning eval bootstrap with workspace readiness by targeting the active profile's sibling `learning-eval.json` and auto-detecting that sibling checkpoint in signal registry eval summaries.
- **Phase 464 (unreleased)** — Split first-run agent backlog profile initialization into an explicit `--dry-run` preview command and reviewed `applyCommand` metadata for the confirmed `--yes` profile write.
- **Phase 463 (unreleased)** — Scoped focused agent backlog operator gates to the current next queue command so read-only handoffs can be `ready` while later file-write or mutation commands still retain review metadata.
- **Phase 462 (unreleased)** — Adjusted local agent development backlog ranking so missing learning profile initialization becomes the ranked next action before eval checkpoint bootstrap, matching the safe execution queue.
- **Phase 461 (unreleased)** — Added compact `operatorHandoff.state` metadata to focused agent backlog output so automation can branch on ready, gate-required, review-required, or no-command handoff states without parsing prose.
- **Phase 460 (unreleased)** — Made agent backlog refresh commands context-aware so `operatorHandoff.refreshCommand` preserves `--from-file`, learning profile, and usage sidecar arguments for the same local signal scope.
- **Phase 459 (unreleased)** — Added `operatorHandoff.refreshCommand` metadata so local AI/agent automation can refresh focused backlog state after the selected handoff command without traversing the operator runbook stages.
- **Phase 458 (unreleased)** — Added an explicit `actionPlan.executionQueue.operatorHandoff.decision` enum so local AI/agent automation can branch on `run-operator-gate`, `run-shared-command`, `run-operator-command`, `run-queue-command`, or `none` without parsing prose.
- **Phase 457 (unreleased)** — Added `actionPlan.executionQueue.operatorHandoff` metadata to focused `design-ai learn --agent-backlog` output so automation can consume one deterministic next-command decision without rebuilding it from queue, runbook, and alignment fields.
- **Phase 456 (unreleased)** — Added `actionPlan.executionQueue.nextCommandAlignment` metadata to focused `design-ai learn --agent-backlog` output so automation can see whether the operator runbook starts with the same command as the safety-ordered queue or a required before-stage gate.
- **Phase 455 (unreleased)** — Added `actionPlan.executionQueue.operatorRunbook.nextCommandSelection` metadata to focused `design-ai learn --agent-backlog` output so automation can distinguish operator stage-order next commands from queue-level safety-ordered recommended commands.
- **Phase 454 (unreleased)** — Added `actionPlan.executionQueue.nextCommandSelection` metadata to focused `design-ai learn --agent-backlog` output so automation can distinguish ranked next actions from safety-ordered recommended commands.
- **Phase 453 (unreleased)** — Added queue-level `actionPlan.executionQueue.nextCommandArgs` to focused `design-ai learn --agent-backlog` output so local automation can consume the safest queued next command without parsing `nextCommand`.
- **Phase 452 (unreleased)** — Added structured `commandArgs` and `nextCommandArgs` metadata to focused `design-ai learn --agent-backlog` command handoff surfaces so local automation can consume reviewed commands without reparsing shell strings.
- **Phase 451 (unreleased)** — Added deterministic operator-runbook next-command metadata to focused `design-ai learn --agent-backlog` output so local operators can start with the first required `before` gate when present instead of jumping directly to the backlog action command.
- **Phase 450 (unreleased)** — Added deterministic `executionQueue.operatorRunbook` stages to focused `design-ai learn --agent-backlog` output so local operators can follow before/execute/after/refresh backlog handoff steps without rebuilding them from separate gate and command-manifest fields.
- **Phase 449 (unreleased)** — Added deterministic `commandEffectReview.gateRunbook` buckets to focused `design-ai learn --agent-backlog` output so local runbooks can execute before/after/refresh gates without filtering flat command lists.
- **Phase 448 (unreleased)** — Added deterministic `commandEffectReview.gatePhaseSummary` metadata to focused `design-ai learn --agent-backlog` output so local runbooks can read gate counts, required counts, and before/after/refresh coverage without parsing labels.
- **Phase 447 (unreleased)** — Added deterministic `phase` and `required` metadata to focused `design-ai learn --agent-backlog` gate commands so local operator runbooks can distinguish before-execution, after-execution, and backlog-refresh checks.
- **Phase 446 (unreleased)** — Added deterministic `commandEffectReview.gateCommands` to focused `design-ai learn --agent-backlog` outputs so operator review guidance includes concrete clean-workspace, diff-inspection, and backlog-refresh gates.
- **Phase 445 (unreleased)** — Added deterministic `commandEffectReview` guidance to focused `design-ai learn --agent-backlog` outputs so aggregate command target exposure becomes an operator-facing review headline and checklist.
- **Phase 444 (unreleased)** — Added queue-level `commandEffectSummary` metadata to focused `design-ai learn --agent-backlog` outputs so operators can review aggregate output/profile/usage targets and mutation flags before opening each command manifest entry.
- **Phase 443 (unreleased)** — Added command manifest effect metadata to focused `design-ai learn --agent-backlog` outputs so operators can see output targets, profile targets, usage targets, mutation flags, and review reasons without parsing shell text.
- **Phase 442 (unreleased)** — Added command manifest run-policy metadata to focused `design-ai learn --agent-backlog` execution queues, human output, Markdown reports, and package smoke assertions.
- **Phase 441 (unreleased)** — Added explicit ordered queue metadata, recommended next action output, and queue order reporting to focused `design-ai learn --agent-backlog` action plans, human output, Markdown reports, and package smoke assertions.
- **Phase 440 (unreleased)** — Added execution queue grouping and recommended next command output to focused `design-ai learn --agent-backlog` action plans, human output, Markdown reports, and package smoke assertions.
- **Phase 439 (unreleased)** — Added aggregate safety summary counts to focused `design-ai learn --agent-backlog` action plans, human output, Markdown reports, and package smoke assertions.
- **Phase 438 (unreleased)** — Added command safety classification to focused `design-ai learn --agent-backlog` action plans, human output, Markdown reports, and package smoke assertions.
- **Phase 437 (unreleased)** — Added action plan export to focused `design-ai learn --agent-backlog` JSON, Markdown, human output, and package smoke assertions.
- **Phase 436 (unreleased)** — Added release metadata guard coverage for focused `design-ai learn --agent-backlog` package smoke phrases covering Markdown reports, JSON `--out`, and strict gates.
- **Phase 435 (unreleased)** — Added focused read-only `design-ai learn --agent-backlog` reports with JSON, Markdown, strict gate, output-file persistence, unit coverage, and packed-tarball smoke coverage for installed-bin and one-shot package paths.
- **Phase 434 (unreleased)** — Recorded full `npm run release:check` evidence after the learning signal and skill proposal package smoke release metadata guard phases.
- **Phase 433 (unreleased)** — Added release metadata guard coverage for the packed-tarball learn signals JSON `--out` file-write confirmation smoke phrase.
- **Phase 432 (unreleased)** — Added release metadata guard coverage for the packed-tarball learn skill proposals JSON `--out` file-write confirmation smoke phrase.
- **Phase 431 (unreleased)** — Added release metadata guard coverage for the packed-tarball `design-ai learn --propose-skills --review-file skill-proposals.review.json --json` read-only review decision join smoke phrase.
- **Phase 430 (unreleased)** — Added release metadata guard coverage for the packed-tarball `design-ai learn --signals --report --out learning-signals.md` Markdown signal report smoke phrase.
- **Phase 429 (unreleased)** — Added `design-ai learn --signals --report --out learning-signals.md` Markdown signal registry handoffs plus packed-tarball smoke coverage for local AI/agent backlog report artifacts.
- **Phase 428 (unreleased)** — Added `design-ai learn --propose-skills --review-template --out skill-proposals.review.json` JSON review-file scaffolds plus packed-tarball smoke coverage for unresolved skill proposal decision templates.
- **Phase 427 (unreleased)** — Added read-only `design-ai learn --propose-skills --review-file skill-proposals.review.json` proposal review state joins plus packed-tarball smoke coverage for applied/rejected decision handling.
- **Phase 426 (unreleased)** — Added packed-tarball smoke coverage for `design-ai learn --propose-skills --patch --out skill-proposals.patch` unified diff handoffs in installed-bin and one-shot package paths.
- **Phase 425 (unreleased)** — Added preview-only `design-ai learn --propose-skills --patch` unified diff handoffs so repeated check-capture skill proposals can be reviewed before any manual skill edit.
- **Phase 424 (unreleased)** — Added packed-tarball smoke coverage for `design-ai learn --propose-skills --min-evidence 3 --json` threshold skipping in installed-bin and one-shot package paths.
- **Phase 423 (unreleased)** — Added `design-ai learn --propose-skills --min-evidence N` so preview-only skill proposal thresholds can be tuned for stricter or earlier local AI/agent learning review.
- **Phase 422 (unreleased)** — Isolated local portfolio/evidence output artifacts from link audit and npm package contents checks so `npm run release:check` passes without deleting portfolio files.
- **Phase 421 (unreleased)** — Added release metadata guard coverage for the packed-tarball `design-ai learn --propose-skills --report --out skill-proposals.md` Markdown review artifact smoke phrase.
- **Phase 420 (unreleased)** — Added packed-tarball smoke coverage for `design-ai learn --propose-skills --report --out skill-proposals.md` so installed-bin and one-shot package paths verify Markdown review artifact persistence.
- **Phase 419 (unreleased)** — Added `design-ai learn --propose-skills --report --out skill-proposals.md` so preview-only skill proposal evidence can be saved as a Markdown review artifact before manual skill edits.
- **Phase 418 (unreleased)** — Recorded full `npm run release:self-test` chain evidence after the strict skill proposal package smoke metadata guard.
- **Phase 417 (unreleased)** — Added release metadata guard coverage for the packed-tarball `design-ai learn --propose-skills --strict --json` expected-failure smoke phrase so release-facing docs keep the strict skill proposal readiness gate visible.
- **Phase 416 (unreleased)** — Added packed-tarball smoke coverage for `design-ai learn --propose-skills --strict --json` so installed-bin and one-shot package paths verify the preview-only skill proposal readiness gate after packaging.
- **Phase 415 (unreleased)** — Added `design-ai learn --propose-skills --strict` so preview-only skill proposal review can fail a local AI/agent development readiness gate without mutating learning profiles or skill files.
- **Phase 414 (unreleased)** — Added release metadata guard coverage for the packed-tarball `design-ai learn --signals --strict --json` smoke phrase so release-facing docs keep the strict local AI/agent readiness gate visible.
- **Phase 413 (unreleased)** — Added packed-tarball smoke coverage for `design-ai learn --signals --strict --json` so installed-bin and one-shot package paths verify the local AI/agent readiness gate after packaging.
- **Phase 412 (unreleased)** — Added `design-ai learn --signals --strict` so the local learning signal registry and deterministic agent development backlog can fail a readiness gate without mutating files or calling external AI APIs.
- **Phase 411 (unreleased)** — Added deterministic `agentDevelopment` backlog actions to `design-ai learn --signals`, ranking local AI/agent development next steps across profile audit, usage, eval harness, check-capture skill evolution, and workspace readiness without mutating files or calling external AI APIs.
- **Phase 410 (unreleased)** — Recorded the post-Phase 409 scope decision boundary so future work chooses between push/Real-CI launch, deeper AI learning architecture, or broader product-surface expansion instead of continuing redundant release hardening.
- **Phase 409 (unreleased)** — Ran the full `npm run release:check` gate after the release-facing docs Product Readiness release policy full gate evidence guard and recorded the passing evidence.
- **Phase 408 (unreleased)** — Added release-facing docs and release metadata guard coverage for Product Readiness release policy full gate evidence `npm run release:check` wording.

## At a glance

| Surface | v2.0 (start) | v3.12 | v4.55 (now) |
|---|---|---|---|
| Knowledge files | 55 | 91 | 92 |
| Worked examples | 83 | 160 | 223 |
| Skills | 12 | 19 | 20 |
| Slash commands | 8 | 15 | 17 |
| Review agents | 4 | 4 | 4 |
| Component coverage | ~24% | 55.3% | 90.5% |
| Distribution channels | 1 (manual) | 4 | 4 (npm / Homebrew / git / VS Code) |
| Integration walkthroughs | 0 | 5 (EN+KO) | 5 (EN+KO) |
| Site languages | 0 | 2 | 2 (EN+KO) |
| CI audits | 4 | 6 | 8 |
| CLI / extension unit tests | 0 | 0 | 170+ |
| VS Code integration tests | 0 | 0 | 8 (e2e infra) |
| Dogfood findings docs | 1 | 1 | 5 |

## The arc

v2.0 was the foundation: design tokens, components synthesized from Ant + MUI + shadcn, UX patterns, accessibility, Korean i18n. The corpus could already turn an LLM into a senior product designer for Korean fintech / SaaS.

v3.x extended the corpus across **six adjacent design domains** (motion, illustration, print, video, game UI, conversational, spatial), then made the result **distributable** (npm CLI, Homebrew tap, public doc site, VS Code extension), then **localized for the primary market** (Korean translations of high-traffic pages + integration walkthroughs), then **prepared for stable release** (versioned frontmatter, stale-content audit, release checklist).

## Phase log

### Active after v4.55 — Agent eval, learning signals, skill proposals, MCP probes, workflow graphs, and handoff evidence

- **Phase 435 (unreleased)** — Added focused read-only `design-ai learn --agent-backlog` reports with JSON, Markdown, strict gate, output-file persistence, unit coverage, and packed-tarball smoke coverage for installed-bin and one-shot package paths.
- **Phase 434 (unreleased)** — Recorded full `npm run release:check` evidence after the learning signal and skill proposal package smoke release metadata guard phases.
- **Phase 433 (unreleased)** — Added release metadata guard coverage for the packed-tarball learn signals JSON `--out` file-write confirmation smoke phrase.
- **Phase 432 (unreleased)** — Added release metadata guard coverage for the packed-tarball learn skill proposals JSON `--out` file-write confirmation smoke phrase.
- **Phase 431 (unreleased)** — Added release metadata guard coverage for the packed-tarball `design-ai learn --propose-skills --review-file skill-proposals.review.json --json` read-only review decision join smoke phrase.
- **Phase 430 (unreleased)** — Added release metadata guard coverage for the packed-tarball `design-ai learn --signals --report --out learning-signals.md` Markdown signal report smoke phrase.
- **Phase 429 (unreleased)** — Added `design-ai learn --signals --report --out learning-signals.md` Markdown signal registry handoffs plus packed-tarball smoke coverage for local AI/agent backlog report artifacts.
- **Phase 428 (unreleased)** — Added `design-ai learn --propose-skills --review-template --out skill-proposals.review.json` JSON review-file scaffolds plus packed-tarball smoke coverage for unresolved skill proposal decision templates.
- **Phase 427 (unreleased)** — Added read-only `design-ai learn --propose-skills --review-file skill-proposals.review.json` proposal review state joins plus packed-tarball smoke coverage for applied/rejected decision handling.
- **Phase 426 (unreleased)** — Added packed-tarball smoke coverage for `design-ai learn --propose-skills --patch --out skill-proposals.patch` unified diff handoffs in installed-bin and one-shot package paths.
- **Phase 425 (unreleased)** — Added preview-only `design-ai learn --propose-skills --patch` unified diff handoffs so repeated check-capture skill proposals can be reviewed before any manual skill edit.
- **Phase 424 (unreleased)** — Added packed-tarball smoke coverage for `design-ai learn --propose-skills --min-evidence 3 --json` threshold skipping in installed-bin and one-shot package paths.
- **Phase 423 (unreleased)** — Added `design-ai learn --propose-skills --min-evidence N` so preview-only skill proposal thresholds can be tuned for stricter or earlier local AI/agent learning review.
- **Phase 422 (unreleased)** — Isolated local portfolio/evidence output artifacts from link audit and npm package contents checks so `npm run release:check` passes without deleting portfolio files.
- **Phase 421 (unreleased)** — Added release metadata guard coverage for the packed-tarball `design-ai learn --propose-skills --report --out skill-proposals.md` Markdown review artifact smoke phrase.
- **Phase 420 (unreleased)** — Added packed-tarball smoke coverage for `design-ai learn --propose-skills --report --out skill-proposals.md` so installed-bin and one-shot package paths verify Markdown review artifact persistence.
- **Phase 419 (unreleased)** — Added `design-ai learn --propose-skills --report --out skill-proposals.md` so preview-only skill proposal evidence can be saved as a Markdown review artifact before manual skill edits.
- **Phase 418 (unreleased)** — Recorded full `npm run release:self-test` chain evidence after the strict skill proposal package smoke metadata guard.
- **Phase 417 (unreleased)** — Added release metadata guard coverage for the packed-tarball `design-ai learn --propose-skills --strict --json` expected-failure smoke phrase so release-facing docs keep the strict skill proposal readiness gate visible.
- **Phase 416 (unreleased)** — Added packed-tarball smoke coverage for `design-ai learn --propose-skills --strict --json` so installed-bin and one-shot package paths verify the preview-only skill proposal readiness gate after packaging.
- **Phase 415 (unreleased)** — Added `design-ai learn --propose-skills --strict` so preview-only skill proposal review can fail a local AI/agent development readiness gate without mutating learning profiles or skill files.
- **Phase 414 (unreleased)** — Added release metadata guard coverage for the packed-tarball `design-ai learn --signals --strict --json` smoke phrase so release-facing docs keep the strict local AI/agent readiness gate visible.
- **Phase 413 (unreleased)** — Added packed-tarball smoke coverage for `design-ai learn --signals --strict --json` so installed-bin and one-shot package paths verify the local AI/agent readiness gate after packaging.
- **Phase 412 (unreleased)** — Added `design-ai learn --signals --strict` so the local learning signal registry and deterministic agent development backlog can fail a readiness gate without mutating files or calling external AI APIs.
- **Phase 411 (unreleased)** — Added deterministic `agentDevelopment` backlog actions to `design-ai learn --signals`, ranking local AI/agent development next steps across profile audit, usage, eval harness, check-capture skill evolution, and workspace readiness without mutating files or calling external AI APIs.
- **Phase 410 (unreleased)** — Recorded the post-Phase 409 scope decision boundary so future work chooses between push/Real-CI launch, deeper AI learning architecture, or broader product-surface expansion instead of continuing redundant release hardening.
- **Phase 407 (unreleased)** — Recorded full `npm run release:check` gate evidence after the Product Readiness release policy full gate evidence guard.
- **Phase 406 (unreleased)** — Added Product Readiness and release metadata guard coverage for full `npm run release:check` evidence after the release-facing policy docs Product Readiness release policy full gate evidence guard.
- **Phase 405 (unreleased)** — Recorded full `npm run release:check` gate evidence after release-facing docs and release metadata guard coverage for Product Readiness release policy full gate `npm run release:check` evidence.
- **Phase 404 (unreleased)** — Added release-facing docs and release metadata guard coverage for Product Readiness release policy full gate `npm run release:check` evidence after Website Console bundle boundary metadata full `release:check` evidence.
- **Phase 403 (unreleased)** — Recorded full `npm run release:check` gate evidence after the Product Readiness release policy full gate guard for Website Console bundle boundary metadata full `release:check` evidence.
- **Phase 402 (unreleased)** — Added Product Readiness release metadata guard coverage for full `npm run release:check` evidence after the release-facing policy docs Website Console bundle boundary metadata full `release:check` evidence guard.
- **Phase 401 (unreleased)** — Recorded full `npm run release:check` gate evidence after the release-facing policy docs guard for Website Console bundle boundary metadata full `release:check` evidence.
- **Phase 400 (unreleased)** — Added release-facing docs and release metadata guard coverage for full `npm run release:check` evidence after Website Console bundle boundary metadata guards and full `release:self-test` evidence recording.
- **Phase 399 (unreleased)** — Added Product Readiness release metadata guard coverage for full `npm run release:check` evidence after Website Console bundle boundary metadata `release:check` guards and full `release:self-test` evidence recording.
- **Phase 398 (unreleased)** — Recorded full `npm run release:check` gate evidence after Product Readiness and release-facing policy docs guards plus full `release:self-test` evidence recording for Website Console bundle boundary metadata `release:check` evidence.
- **Phase 397 (unreleased)** — Recorded full `npm run release:self-test` chain evidence after Product Readiness and release-facing policy docs guards for Website Console bundle boundary metadata `release:check` evidence.
- **Phase 396 (unreleased)** — Added release-facing docs and release metadata guard coverage for full `npm run release:check` evidence after Website Console bundle boundary metadata guard phases.
- **Phase 395 (unreleased)** — Added Product Readiness release metadata guard coverage for full `npm run release:check` evidence after Website Console bundle boundary metadata guard phases.
- **Phase 394 (unreleased)** — Recorded full `npm run release:check` gate evidence after Product Readiness and release-facing policy docs guards for Website Console bundle-check JSON/human and bundle-handoff JSON/prompt boundary metadata wording.
- **Phase 393 (unreleased)** — Added release-facing docs and release metadata guard coverage for Website Console bundle-check JSON/human and bundle-handoff JSON/prompt boundary metadata wording.
- **Phase 392 (unreleased)** — Added Product Readiness release metadata guard coverage for Website Console bundle-check JSON/human and bundle-handoff JSON/prompt boundary metadata wording.
- **Phase 391 (unreleased)** — Added Website Console bundle-handoff boundary metadata to JSON and target-repo prompt output, preserving deterministic-local, no-external-call, and no-target-repo-mutation handoff generation boundaries with unit and package smoke assertion coverage.
- **Phase 390 (unreleased)** — Added Website Console bundle-check boundary metadata to JSON/human output, preserving deterministic-local, no-external-call, and no-target-repo-mutation handoff boundaries with unit and package smoke assertion coverage.
- **Phase 389 (unreleased)** — Recorded full `npm run release:check` gate evidence after Product Readiness and release-facing policy docs guards for Website Console bundle `mcp-probes.json` saved-payload `release:check` evidence.
- **Phase 388 (unreleased)** — Recorded full `npm run release:self-test` chain evidence after Product Readiness and release-facing policy docs guards for Website Console bundle `mcp-probes.json` saved-payload `release:check` evidence.
- **Phase 387 (unreleased)** — Added release-facing docs and release metadata guard coverage for Website Console bundle `mcp-probes.json` saved-payload `npm run release:check` evidence.
- **Phase 386 (unreleased)** — Added Product Readiness release metadata guard coverage for full `npm run release:check` evidence after the Website Console bundle `mcp-probes.json` saved-payload guard phases.
- **Phase 385 (unreleased)** — Recorded full `npm run release:check` gate evidence after the Website Console bundle `mcp-probes.json` saved-payload guard phases.
- **Phase 384 (unreleased)** — Recorded full `npm run release:self-test` chain evidence after the Website Console bundle `mcp-probes.json` saved-payload guard phases.
- **Phase 383 (unreleased)** — Added Product Readiness and release metadata guard coverage for the bundled Website Console `mcp-probes.json` saved probe evidence payload boundary.
- **Phase 382 (unreleased)** — Added release metadata guard coverage for the bundled Website Console `mcp-probes.json` saved probe evidence payload wording, keeping docs clear that bundle files are not the full MCP check probe CLI response.
- **Phase 381 (unreleased)** — Fixed package smoke validation for bundled Website Console `mcp-probes.json` by asserting the saved probe evidence payload instead of the full MCP check probe CLI response.
- **Phase 380 (unreleased)** — Recorded full `npm run release:self-test` chain evidence after the Website Console MCP probe count guard phases.
- **Phase 379 (unreleased)** — Added Product Readiness and release metadata guard coverage for Website Console MCP probe count self-test coverage wording.
- **Phase 378 (unreleased)** — Added release metadata guard coverage for the package smoke self-test wording around Website Console bundle MCP probe counts.
- **Phase 377 (unreleased)** — Added release metadata guard coverage for the shared smoke assertion self-test wording around Website Console next-actions MCP probe counts.
- **Phase 376 (unreleased)** — Added shared smoke assertion self-test drift coverage for Website Console next-actions MCP probe counts.
- **Phase 375 (unreleased)** — Completed package smoke self-test drift coverage for all Website Console bundle MCP probe count assertion surfaces.
- **Phase 374 (unreleased)** — Added package smoke self-test drift fixtures for Website Console bundle-check/compare/handoff MCP probe count assertions.
- **Phase 373 (unreleased)** — Added real `runSite` human `--bundle-compare` coverage for the left/right MCP probe count summary.
- **Phase 372 (unreleased)** — Added left/right MCP probe count summaries to Website Console bundle-compare human output.
- **Phase 371 (unreleased)** — Added release metadata guard coverage for Website Console bundle-check/compare/handoff `mcpProbeCounts` probe count telemetry across release-facing docs.
- **Phase 370 (unreleased)** — Added release metadata guard coverage for Website Console next-actions `mcpProbeCounts` probe count telemetry across release-facing docs.
- **Phase 369 (unreleased)** — Added `mcpProbeCounts` to Website Console next-actions JSON/human output and shared smoke assertions, making read-only probe pass/warn/fail counts visible before bundle export.
- **Phase 368 (unreleased)** — Added `mcpProbeCounts` to Website Console bundle-check, bundle-compare, and bundle-handoff JSON/prompt contracts, with summary-to-`mcp-probes.json` count validation and package smoke assertions.
- **Phase 367 (unreleased)** — Added `mcp-probes.json` to Website Console handoff bundles and included MCP probe evidence in summary metadata, checksum/generated contract verification, repair, compare, and target-repo handoff validation.
- **Phase 366 (unreleased)** — Extended Website Console next-actions with read-only MCP probe readiness, `mcpProbeStatus`, `counts.probeGaps`, probe follow-up commands, and probe-gap action ranking before target-repo handoff.
- **Phase 365 (unreleased)** — Added release policy guard coverage for the release metadata JSON `product_readiness_checked: true` Product Readiness summary phrase across release-facing docs.
- **Phase 364 (unreleased)** — Exposed Product Readiness guard coverage in release metadata JSON through `product_readiness_checked: true`.
- **Phase 363 (unreleased)** — Added release metadata guard coverage for Product Readiness warning-state Website Console bundle-compare strict wording so readiness status cannot regress to generic bundle comparison coverage.
- **Phase 362 (unreleased)** — Clarified Product Readiness public-registry Website Console coverage so the post-publish smoke summary explicitly includes warning-state bundle-compare strict smoke coverage instead of only generic bundle-check/compare/handoff/repair wording.
- **Phase 361 (unreleased)** — Clarified Product Readiness so Website Console bundle-compare completion status explicitly includes warning-state strict smoke coverage for identical warning bundles that keep `sameBundle: true` while exiting non-zero under `--strict`.
- **Phase 360 (unreleased)** — Added release metadata guard coverage for the warning-state Website Console bundle-compare strict smoke phrase so release-facing docs cannot drop the packed-tarball/public-registry warning strict contract.
- **Phase 359 (unreleased)** — Added packed-tarball and public-registry smoke coverage for warning-state Website Console bundle-compare strict failures, so identical warning bundles keep `sameBundle: true` and `digestMatch: true` while exiting non-zero under `--strict`.
- **Phase 358 (unreleased)** — Added warning-only strict exit unit coverage for Website Console bundle repair apply so regeneration that cannot clear optional MCP readiness warnings makes `--bundle-repair --yes --strict --json` exit non-zero with `bundle-repair-verify-fail`.
- **Phase 357 (unreleased)** — Preserved warning-state bundle-check results in Website Console bundle compare, so identical warning bundles keep `sameBundle: true` but make `--bundle-compare --strict --json` exit non-zero with left/right warning issues.
- **Phase 356 (unreleased)** — Added warning-only strict exit unit coverage for Website Console bundle handoff prompts so valid bundles with optional MCP readiness warnings make `--bundle-handoff --strict --json` exit non-zero and preserve warning context in the target-repo payload.
- **Phase 355 (unreleased)** — Added warning-only strict exit unit coverage for Website Console handoff bundle checks so valid bundles with optional MCP readiness warnings make `--bundle-check --strict --json` exit non-zero and report `bundle-readiness-warn`.
- **Phase 354 (unreleased)** — Added warning-only strict exit unit coverage for Website Console handoff bundle generation so optional MCP readiness warnings make `--bundle --strict` exit non-zero while preserving warning status in generated bundle files.
- **Phase 353 (unreleased)** — Added warning-only strict exit unit coverage for Website Console workflow graph exports so optional MCP readiness warnings make `--graph --strict --json` exit non-zero while preserving graph `mcpStatus: "warn"`.
- **Phase 352 (unreleased)** — Added warning-only strict exit unit coverage for Website Console MCP readiness checks so optional MCP readiness warnings make `--mcp-check --strict --json` exit non-zero at the source gate.
- **Phase 351 (unreleased)** — Added warning-only strict exit unit coverage for Website Console MCP action plans so optional MCP readiness warnings make `--mcp-plan --strict --json` exit non-zero.
- **Phase 350 (unreleased)** — Added warning-only strict exit unit coverage for Website Console next-actions so optional MCP readiness warnings still make `--next-actions --strict --json` exit non-zero.
- **Phase 349 (unreleased)** — Added action rank sequence unit coverage for Website Console next-actions so pass, warning, and blocking action lists renumber from 1 after severity sorting.
- **Phase 348 (unreleased)** — Added top-task cap unit coverage for Website Console next-actions so four-task workspaces keep the full task count while exposing only the three highest-priority tasks.
- **Phase 347 (unreleased)** — Added multi-task priority selection unit coverage for Website Console next-actions so P0 refactor tasks sort ahead of P1/P2 tasks and drive the first implementation action.
- **Phase 346 (unreleased)** — Added stdin command-target unit coverage for Website Console next-actions so JSON follow-up commands use `<workspace.json>` placeholders when the source is `stdin`.
- **Phase 345 (unreleased)** — Added full JSON command-set unit coverage for Website Console next-actions, covering summary, MCP check/plan, task generation, implementation prompt, handoff report, and bundle follow-up commands.
- **Phase 344 (unreleased)** — Added warning-state CLI unit coverage for Website Console next-actions so missing optional MCP readiness evidence and task/MCP gaps route operators to `--mcp-plan --out mcp-action-plan.md`.
- **Phase 343 (unreleased)** — Added implementation evidence CLI unit coverage for Website Console next-actions so missing executed work or verification results recommends `--report --out website-handoff.md`, while evidence-ready workspaces skip that reminder.
- **Phase 342 (unreleased)** — Added no-task CLI unit coverage for Website Console next-actions so empty `refactorTasks` workspaces recommend generating starter tasks before implementation prompts.
- **Phase 341 (unreleased)** — Added fail-state CLI unit coverage for Website Console next-actions so missing required MCP readiness ranks as the first blocking action and `--next-actions --strict --json` exits non-zero.
- **Phase 340 (unreleased)** — Added direct CLI help unit coverage for the `design-ai site <workspace.json> --next-actions [--json] [--out file] [--force]` Usage line so command discovery stays aligned with next-actions output-file workflows.
- **Phase 339 (unreleased)** — Added direct CLI unit coverage for `design-ai site <workspace.json> --next-actions --out file --force` human Markdown output-file persistence, including forced overwrite replacement and non-JSON saved output checks.
- **Phase 338 (unreleased)** — Added release metadata guard coverage for the `design-ai site website-workspace.json --next-actions --out website-next-actions.md` next-actions Markdown help example across release-facing docs.
- **Phase 337 (unreleased)** — Added `design-ai site --help` and shared help-topic smoke coverage for the human next-actions Markdown output-file example, plus English/Korean Website Improvement docs guidance.
- **Phase 336 (unreleased)** — Added packed-tarball and public-registry smoke coverage for `design-ai site --stdin --next-actions --out file --force` human Markdown output-file persistence, plus release metadata guard coverage for the human output-file smoke phrase.
- **Phase 335 (unreleased)** — Added release metadata guard coverage for the `design-ai site --stdin --next-actions --json --out file --force` next-action output-file smoke phrase across release-facing docs.
- **Phase 334 (unreleased)** — Added packed-tarball and public-registry output-file smoke coverage for `design-ai site --stdin --next-actions --json --out file --force`, reusing a shared file-output assertion for write confirmation, forced overwrite replacement, and saved next-action JSON drift checks.
- **Phase 333 (unreleased)** — Added release metadata guard coverage for the public registry `design-ai site --stdin --next-actions --json` next-action operator checklist smoke phrase across release-facing docs.
- **Phase 332 (unreleased)** — Added public-registry `npm exec --package @design-ai/cli@<version>` smoke coverage for `design-ai site --stdin --next-actions --json`, reusing the shared next-action JSON assertions already used by packed-tarball smoke.
- **Phase 331 (unreleased)** — Added installed-bin and one-shot `npm exec --package <tarball>` package smoke coverage for `design-ai site --stdin --next-actions --json`, backed by shared JSON assertions for local/read-only boundaries, ranked actions, and emitted follow-up commands.
- **Phase 330 (unreleased)** — Added `design-ai site --next-actions [--json]`, a deterministic local operator checklist for workspace validation, MCP readiness, task gaps, implementation prompt prep, evidence handoff, and bundle export before target-repo work.
- **Phase 329 (unreleased)** — Added release metadata guard coverage for shared MCP action plan command mapping self-test coverage, so release-facing docs must keep Phase 328's common assertion parity visible.
- **Phase 328 (unreleased)** — Added shared smoke assertion self-test parity for action-plan emitted `mcpCheckProbesJsonOut` and `mcpPlanProbesJsonOut` command mapping, catching JSON archive command drift before package/public-registry smoke.
- **Phase 327 (unreleased)** — Added release metadata guard coverage for MCP action plan emitted check JSON command smoke coverage, so release-facing docs must keep Phase 323's `mcpCheckProbesJsonOut` execution visible.
- **Phase 326 (unreleased)** — Added package and registry smoke self-test negative drift fixtures for action-plan emitted readiness probe JSON and self-archive JSON output boundaries.
- **Phase 325 (unreleased)** — Added release metadata guard coverage for MCP action plan emitted self-archive command smoke coverage, so release-facing docs must keep Phase 324's `mcpPlanProbesJsonOut` execution visible.
- **Phase 324 (unreleased)** — Executed the `mcpPlanProbesJsonOut` self-archive command emitted by structured MCP action plan JSON in package and public-registry smoke.
- **Phase 323 (unreleased)** — Executed the `mcpCheckProbesJsonOut` command emitted by structured MCP action plan JSON in package and public-registry smoke, preserving machine-readable MCP readiness probe JSON directly from action-plan payloads.
- **Phase 322 (unreleased)** — Added package and registry smoke self-test negative drift fixtures so action-plan emitted human readiness report output fails if it loses `Probe commands` guidance.
- **Phase 321 (unreleased)** — Hardened package and registry smoke self-tests so the action-plan emitted `mcpCheckProbesHumanOut` command is replayed through the same human readiness report file-output assertions used by distribution smoke.
- **Phase 320 (unreleased)** — Executed the `mcpCheckProbesHumanOut` command emitted by structured MCP action plan JSON in packed-tarball and public-registry smoke, preserving the human readiness report from action-plan payloads as well as MCP check probe payloads.
- **Phase 319 (unreleased)** — Added release metadata guard coverage for MCP action plan human report output command parity, so release-facing docs must keep Phase 318's `mcpCheckProbesHumanOut` action-plan JSON command contract visible.
- **Phase 318 (unreleased)** — Added `mcpCheckProbesHumanOut` to structured MCP action plan JSON commands, keeping human readiness report preservation discoverable from both MCP check probe payloads and MCP action-plan payloads.
- **Phase 317 (unreleased)** — Added release metadata guard coverage for the embedded MCP check probe human report output command, so release-facing docs must keep the `mcpCheckProbesHumanOut` command contract visible beside human guidance and output-file smoke coverage.
- **Phase 316 (unreleased)** — Added `mcpCheckProbesHumanOut` to probe-enabled MCP check JSON and human `Probe commands`, then executed that embedded command in packed-tarball and public-registry smoke to preserve the human readiness probe report.
- **Phase 315 (unreleased)** — Added unit, packed-tarball, and public-registry smoke coverage for `design-ai site --stdin --mcp-check --probes --out file`, preserving the human MCP readiness probe report and its `Probe commands` guidance.
- **Phase 314 (unreleased)** — Added shared packed-tarball and public-registry smoke coverage for `design-ai site --stdin --mcp-check --probes` human output, including the `Probe commands` guidance introduced in Phase 313.
- **Phase 313 (unreleased)** — Added human-readable `Probe commands` guidance to `design-ai site --mcp-check --probes`, giving operators the same readiness JSON save, probe action plan JSON, and action plan save commands that probe JSON already exposes while leaving default MCP check output unchanged.
- **Phase 312 (unreleased)** — Added release metadata guard coverage for executable embedded MCP check probe command smoke coverage, so release-facing docs must distinguish smoke-executed payload commands from static embedded command guidance.
- **Phase 311 (unreleased)** — Updated package and public-registry smoke to execute the embedded commands emitted by `design-ai site --mcp-check --probes --json`, covering readiness probe `--out`, action-plan JSON, and action-plan JSON `--out` paths from the payload itself.
- **Phase 310 (unreleased)** — Added release metadata guard coverage for embedded MCP check probe next-step commands, so release-facing docs must keep the `mcp-check --probes --json` command payload contract tied to MCP readiness probe `--out` guidance.
- **Phase 309 (unreleased)** — Added embedded preservation and next-step commands to `design-ai site --mcp-check --probes --json`, while keeping the default non-probe MCP check JSON shape unchanged and adding shared smoke assertion coverage for the probe command contract.
- **Phase 308 (unreleased)** — Added release metadata guard coverage for embedded MCP action plan probe output-file commands, so release-facing docs must keep the structured JSON command contract tied to MCP probe action plan `--out` guidance.
- **Phase 307 (unreleased)** — Added `mcpCheckProbesJsonOut` and `mcpPlanProbesJsonOut` commands to structured Website Console MCP action plan JSON, with unit and shared smoke assertion coverage for the saved-probe command contract.
- **Phase 306 (unreleased)** — Added release metadata guard coverage for shared Website Console site help topic example smoke assertions, so release-facing docs must keep the command-specific `design-ai help site` MCP probe JSON `--out` example contract visible.
- **Phase 305 (unreleased)** — Updated shared package/public-registry smoke assertions so command-specific `design-ai help site` output must retain MCP probe JSON `--out` examples, with a drift fixture for losing the saved probe command.
- **Phase 304 (unreleased)** — Added release metadata guard coverage for probe-capable Website Console site help usage, so release-facing docs must keep the help JSON catalog wording tied to the `--mcp-check [--probes]` and `--mcp-plan [--probes] [--json]` discovery contract.
- **Phase 303 (unreleased)** — Updated shared package/public-registry smoke assertions so help JSON and main help output must retain probe-capable Website Console site usage, with a drift fixture for stale probe-less site usage.
- **Phase 302 (unreleased)** — Updated top-level `design-ai help` and `design-ai help --json` site usage so MCP probe support is visible as `--mcp-check [--probes]` and `--mcp-plan [--probes] [--json]` before opening command-specific help.
- **Phase 301 (unreleased)** — Added `design-ai site --help` examples for saving MCP readiness probe JSON and MCP probe action plan JSON with `--out file`, then pinned those examples in help and site command tests.
- **Phase 300 (unreleased)** — Added release metadata guard coverage for shared Website Console MCP probe output-file smoke assertions. Release-facing docs now have to mention the shared helper contract next to MCP readiness probe JSON `--out` smoke guidance.
- **Phase 299 (unreleased)** — Shared the Website Console MCP probe output-file smoke assertions. `smoke_assertions.py` now owns the write confirmation plus saved JSON payload contract for MCP readiness probe JSON and MCP probe action plan JSON, while package and registry smoke keep their runner-specific command execution paths.
- **Phase 298 (unreleased)** — Added Website Console MCP readiness probe JSON output-file persistence smoke. Packed-tarball installed-bin, one-shot npm exec, and public registry smoke now verify `design-ai site --stdin --mcp-check --probes --json --out file --force` write confirmation plus saved read-only MCP probe payload contract.
- **Phase 297 (unreleased)** — Added Website Console MCP probe action plan JSON output-file persistence smoke. Packed-tarball installed-bin, one-shot npm exec, and public registry smoke now verify `design-ai site --stdin --mcp-plan --probes --json --out file --force` write confirmation plus saved `website-improvement-mcp-action-plan` payload contract.
- **Phase 296 (unreleased)** — Added structured Website Console MCP action plan JSON export. `design-ai site --mcp-plan [--probes] --json` now emits a deterministic `website-improvement-mcp-action-plan` payload, with package/public registry smoke and release metadata guard coverage for the probe JSON path.
- **Phase 295 (unreleased)** — Added release metadata guard coverage for public registry Website Console MCP probe action plan guidance. Post-publish docs now have to mention MCP probe action plan coverage next to MCP readiness probes and the base MCP action plan.
- **Phase 294 (unreleased)** — Added Website Console MCP probe action plan smoke parity. Packed-tarball and public-registry smoke now run `design-ai site --stdin --mcp-plan --probes` and validate the shared read-only Markdown probe section, while release metadata guards the matching release-policy docs phrase.
- **Phase 293 (unreleased)** — Added public registry Website Console MCP probe smoke parity. `registry-smoke.py` now runs `design-ai site --stdin --mcp-check --probes --json` from the published package path and validates the shared read-only probe contract.
- **Phase 292 (unreleased)** — Added release metadata guard coverage for shared Website Console repair report assertion helpers. Release-facing docs now name the shared report assertion helper contract next to bundle repair preview/apply, repair report `--out file` persistence, and shared repair guidance smoke helper coverage.
- **Phase 291 (unreleased)** — Shared the Website Console repair report smoke assertions. Package and registry smoke now use the same helper contract for report command shape, expected output paths, preview payloads, and applied repair payloads while retaining their runner-specific execution paths.
- **Phase 290 (unreleased)** — Added release metadata guard coverage for shared Website Console repair guidance smoke helpers. Release-facing docs now name the shared helper contract next to bundle repair preview/apply and repair report `--out file` smoke coverage, and `release-metadata.py --self-test` has a drift fixture for that phrase.
- **Phase 289 (unreleased)** — Shared the Website Console repair guidance smoke helpers. `smoke_assertions.py` now owns `repairGuidance` command parsing and `--out` path extraction, with self-test drift fixtures, while package and registry smoke import the same helper contract.
- **Phase 288 (unreleased)** — Added executable Website Console repair guidance smoke coverage. Package and registry smoke now parse the emitted `previewReportCommand` and `applyReportCommand`, map them onto the installed-bin or `npm exec --package` runner, execute the guidance commands directly, and verify the preview/applied report files.
- **Phase 287 (unreleased)** — Added Website Console bundle repair report command guidance. `repairGuidance` now includes `previewReportCommand` and `applyReportCommand`, and human/prompt outputs show `--bundle-repair ... --out file` commands that save preview/applied repair evidence beside the handoff bundle instead of inside it. Site unit coverage plus package and registry smoke assertions now guard the command shape.
- **Phase 286 (unreleased)** — Added Website Console bundle repair report output persistence. `design-ai site <bundle-dir> --bundle-repair [--yes] [--json] --out file [--force]` now saves preview/applied repair reports with the existing safe file-write contract, while preview remains read-only and apply still requires `--yes`. Package and registry smoke now verify repair report `--out file` behavior through installed-bin, one-shot `npm exec --package <tarball>`, and public registry paths.
- **Phase 285 (unreleased)** — Added Website Console bundle repair preview/apply. `design-ai site <bundle-dir> --bundle-repair --json` previews a local repair without mutating files, while `--bundle-repair --yes --json` rewrites only the handoff bundle directory from embedded `website-workspace.tasks.json` and re-runs bundle-check verification. Package and registry smoke now verify drift recovery through installed-bin, one-shot `npm exec --package <tarball>`, and public registry paths.
- **Phase 284 (unreleased)** — Added deterministic Website Console bundle repair guidance. `design-ai site <bundle-dir> --bundle-check --json` now exposes a `repairGuidance` block with a local regenerate command, strict verify command, mutation scope, target-repo mutation flag, and external-call flag; `--bundle-handoff` carries the same guidance into JSON and the target-repo handoff prompt. Package smoke verifies the guidance in installed-bin and one-shot `npm exec --package <tarball>` paths.
- **Phase 283 (unreleased)** — Added per-file generated contract diagnostics for Website Console handoff bundles. `design-ai site <bundle-dir> --bundle-check --json` now exposes a `generatedContract` block with expected/actual SHA-256 digests and drift file paths; `--bundle-compare` and `--bundle-handoff` carry generated drift summaries forward. Package smoke now verifies diagnostics and empty drift lists in installed-bin and one-shot `npm exec --package <tarball>` paths.
- **Phase 282 (unreleased)** — Added generated bundle contract verification for Website Console handoff bundles. `design-ai site <bundle-dir> --bundle-check --json` now verifies that the seven checksum-managed bundle artifacts match the current CLI output from `website-workspace.tasks.json`; `--bundle-compare` and `--bundle-handoff` carry generated contract counts forward. Package smoke now verifies those counts in installed-bin and one-shot `npm exec --package <tarball>` paths.
- **Phase 281 (unreleased)** — Added verified bundle evidence metadata for Website Console handoff bundles. `design-ai site <bundle-dir> --bundle-check --json`, `--bundle-compare other-bundle-dir --json`, and `--bundle-handoff --json` now expose `implementationEvidence` counts, and bundle-check fails when summary evidence counts drift from `website-workspace.tasks.json`. Package smoke now verifies non-empty evidence counts through evidence bundle check, compare, and handoff JSON in installed-bin and one-shot `npm exec --package <tarball>` paths.
- **Phase 280 (unreleased)** — Expanded packed-tarball Website Console evidence smoke coverage. Package smoke now verifies non-empty `implementationEvidence` through `design-ai site --stdin --report`, `--tasks`, and `--bundle --out` in both installed-bin and one-shot `npm exec --package <tarball>` paths, with self-test drift fixtures for evidence payload and Markdown assertions.
- **Phase 279 (unreleased)** — Added CLI and bundle export support for Website Console handoff evidence. `design-ai site` now preserves `implementationEvidence`, reports evidence counts in JSON summaries, carries evidence through generated task workspaces and bundles, and renders executed work, verification results, remaining risks, and next actions in CLI-generated handoff reports.
- **Phase 278 (unreleased)** — Added browser-local Website Console handoff evidence tracking. The `Handoff Report` tab now records executed work, verification results, remaining risks, and next actions in localStorage, shows compact evidence counts, and injects operator-entered target-repo evidence into copied/exported Markdown reports while staying dependency-free and target-repo safe.
- **Phase 277 (unreleased)** — Added static Website Console workflow graph rendering. The browser app now has a `Workflow Graph` tab with 35-node / 67-edge sample coverage, lane-based node groups, boundary markers, a complete edge table, and graph JSON copy/export actions while staying dependency-free, local/read-only, and target-repo safe.
- **Phase 276 (unreleased)** — Added `design-ai site --graph [--json]` workflow graph export for Website Improvement workspaces. The graph includes workspace, site profile, audit, MCP readiness, refactor task, prompt template, handoff report, bundle, and target-repo nodes with deterministic edges, while staying local/read-only with no external MCP calls, target-repo mutation, workflow runtime dependency, crawling, or added dependencies. Packed-tarball smoke covers graph JSON in installed-bin and one-shot package paths.
- **Phase 275 (unreleased)** — Added opt-in `design-ai site --mcp-check --probes` and `design-ai site --mcp-plan --probes` reports for Website Console MCP readiness. Probes check GitHub repo references, Figma URLs, Browser smoke targets, and deployment provider references as a separate read-only `probes` JSON block without changing the default MCP check shape, calling external MCPs, writing to outside systems, or adding dependencies. Packed-tarball smoke covers probe JSON in installed-bin and one-shot package paths.
- **Phase 274 (unreleased)** — Added preview-only `design-ai learn --propose-skills` reports that convert repeated check-capture learning signals into candidate skill instruction deltas with evidence sources, verification commands, and risk levels. The command rejects `--yes`, does not mutate `learning.json`, and does not edit skill files. Packed-tarball smoke now covers human, JSON, and `--out` proposal reports in installed-bin and one-shot package paths.
- **Phase 273 (unreleased)** — Added read-only `design-ai learn --signals` registry reports that join learning profile audit state, learning usage sidecar activity, route/prompt/pack/learning eval signal files, check learning capture entries, and workspace readiness without mutating `learning.json`. Packed-tarball smoke now covers human, JSON, and `--out` signal registry reports in installed-bin and one-shot package paths.
- **Phase 272 (unreleased)** — Added deterministic `design-ai prompt --eval-template`, `design-ai prompt --eval`, `design-ai pack --eval-template`, and `design-ai pack --eval` checkpoints. Prompt eval protects expected routes, required files, checklist items, prompt fragments, and learning context; pack eval protects planned files, included context files, and context status without dumping full context bodies into eval JSON. Packed-tarball smoke now covers route/prompt/pack eval checkpoints in installed-bin and one-shot package paths.
- **Phase 271 (unreleased)** — Added deterministic `design-ai route --eval-template` and `design-ai route --eval` checkpoints after reviewing Hermes/Harness-centered agent references. This gives design-ai a read-only route conformance gate before deeper prompt, learning, skill-evolution, and Website Console eval work.

### v4.55 — Public registry Website Console smoke coverage

- **v4.55 (Phase 270)** — Extended `npm run registry:smoke` so the public `npm exec --package @design-ai/cli@<version>` path verifies `design-ai site` Website Console export validation, sample workspace generation, prompt template listing, MCP readiness checks, MCP action plans, handoff bundles, bundle-check/compare/handoff, refactor task generation, and task-selected prompt output.

### v4.54 — Public registry workspace restore backup readiness smoke

- **v4.54 (Phase 269)** — Extended `npm run registry:smoke` so the public `npm exec --package @design-ai/cli@<version>` path verifies `design-ai workspace` restore-backups readiness, sibling rollback backup inventory, latest restore preview command, prune candidate readiness, and preview-first prune next action metadata.

### v4.53 — Workspace learning restore backup readiness

- **v4.53 (Phase 268)** — Added `design-ai workspace` readiness for sibling learning restore rollback backups, including `learningRestoreBackups` JSON inventory, latest backup metadata, read-only privacy flags, and preview-first prune next actions when older rollback backups exceed the default keep count.

### v4.52 — Public registry learning restore smoke

- **v4.52 (Phase 267)** — Extended post-publish registry smoke so the public `npm exec --package @design-ai/cli@<version>` path verifies learning restore preview/apply behavior, rollback backup creation, restore-backups inventory, and restore-backups prune preview/apply cleanup.

### v4.51 — Learning restore backup pruning

- **v4.51 (Phase 266)** — Added preview-first `learn --restore-backups --prune` cleanup for older sibling restore rollback backups, keeping the newest backups by default and deleting only older backup files after explicit `--yes`.

### v4.50 — Learning restore backup inventory

- **v4.50 (Phase 265)** — Added read-only `learn --restore-backups` inventory for sibling restore rollback backups, including backup audit status, entry counts, timestamps, and restore dry-run preview commands.

### v4.49 — Learning restore rollback backup

- **v4.49 (Phase 264)** — Added automatic rollback backup creation for confirmed `learn --restore --yes` profile replacement, plus `--backup-file` path override and rollback preview command metadata.

### v4.48 — Learning profile restore

- **v4.48 (Phase 263)** — Added preview-first `learn --restore --from-file/--stdin` full-profile replacement so portable backups can be verified, diffed, and then applied only after explicit `--yes`; source audit failures remain previewable but block apply.

### v4.47 — Learning profile diff

- **v4.47 (Phase 262)** — Added read-only `learn --diff --from-file/--stdin` profile comparison so portable learning profiles can be reviewed for profile-only entries, comparison-only entries, metadata drift, and id conflicts before import or restore decisions.

### v4.46 — Workspace curation report next actions

- **v4.46 (Phase 261)** — Added workspace next actions that pair learning profile audit and usage sidecar curation warnings with `learn --curate --report --out learning-curation-report.md` Markdown report artifact commands before applying archive cleanup.

### v4.45 — Learning curation Markdown reports

- **v4.45 (Phase 260)** — Added `learn --curate --report` so archive-first local learning curation can be saved as a readable Markdown audit trail before applying any profile cleanup.

### v4.44 — Workspace learning curation next actions

- **v4.44 (Phase 259)** — Connected `workspace` learning audit and usage sidecar warnings to usage-aware `learn --curate --usage-file` next actions, and added curation review metadata for usage sidecars recorded against another profile path.

### v4.43 — Learning usage curation review

- **v4.43 (Phase 258)** — Added usage-aware learning curation review so `learn --curate` reports stale usage sidecar ids and unused active entries as advisory review hints without auto-archiving them.

### v4.42 — Workspace learning usage readiness

- **v4.42 (Phase 257)** — Added workspace learning usage sidecar readiness so `workspace` reports prompt/pack usage event counts, stale selected ids, profile mismatch, and privacy metadata from explicit or sibling `learning.usage.json` files.

### v4.41 — Workspace learning eval freshness guard

- **v4.41 (Phase 256)** — Added workspace learning eval freshness checks so a passing checkpoint warns when it predates the active learning profile, was generated from another profile path, or records a different source entry count.

### v4.40 — Workspace learning eval sibling checkpoint discovery

- **v4.40 (Phase 255)** — Added sibling `learning-eval.json` auto-detection for `design-ai workspace` and aligned eval-template next actions to write checkpoints beside the selected learning profile.

### v4.39 — Workspace learning eval command path quoting

- **v4.39 (Phase 254)** — Added shell-safe path quoting for `design-ai workspace` learning eval next-action commands so `--file` and `--from-file` paths with spaces or apostrophes remain copy/paste safe.

### v4.38 — Workspace learning eval-template hints

- **v4.38 (Phase 253)** — Added `design-ai workspace` next-action guidance for generating a local `learn --eval-template` checkpoint when a clean learning profile has entries but no `--learning-eval` checkpoint is supplied.

### v4.37 — Public registry learning eval template smoke

- **v4.37 (Phase 252)** — Extended post-publish registry smoke so the public `npm exec --package @design-ai/cli@<version>` path verifies `design-ai learn --eval-template` checkpoint generation and re-runs the generated checkpoint through `design-ai learn --eval --strict --json`.

### v4.36 — Learning eval template generation

- **v4.36 (Phase 251)** — Added `design-ai learn --eval-template` so active local learning profiles can generate runnable checkpoint JSON, write it with `--out`, and immediately validate it through `learn --eval --strict`.

### v4.35 — Public registry workspace learning eval smoke

- **v4.35 (Phase 250)** — Extended post-publish registry smoke so the public `npm exec --package @design-ai/cli@<version>` path verifies `design-ai workspace --learning-eval <checkpoint.json> --strict --json` checkpoint summaries from a clean workspace fixture.

### v4.34 — Workspace learning eval readiness

- **v4.34 (Phase 249)** — Added `design-ai workspace --learning-eval <checkpoint.json>` so dogfood readiness snapshots can include local learning-selection checkpoint status beside git, repository metadata, learning audit state, release scripts, and next actions. `workspace --strict` now treats eval warnings/failures as readiness issues without mutating `learning.json`.

### v4.33 — Local learning eval strict gate

- **v4.33 (Phase 248)** — Added `design-ai learn --eval --strict` so deterministic learning-selection checkpoint reports can fail CI or internal release gates when a case warns or fails. Strict mode prints or writes the report first, preserves read-only `learning.json` behavior, and keeps eval output privacy-preserving by exposing brief hashes and selected ids instead of raw brief/query text.

### v4.32 — Local learning eval checkpoints

- **v4.32 (Phase 247)** — Added `design-ai learn --eval --from-file <checkpoint.json>` and stdin support to validate deterministic learning-selection checkpoints without mutating `learning.json`. Reports expose brief hashes, selected ids, per-case status, and privacy metadata while omitting raw brief/query text and matched tokens. Package smoke verifies human, JSON, and `--out` report paths through installed-bin and one-shot `npm exec --package <tarball>`.

### v4.31 — Local learning usage report

- **v4.31 (Phase 246)** — Added `design-ai learn --usage [--usage-file path]` to summarize local prompt/pack learning sidecar activity without mutating `learning.json`. The report exposes event counts, command / route / category distribution, selected entry counts, unused active entries, stale selected ids, recent event hashes, and explicit privacy metadata. Package smoke verifies human, JSON, and `--out` report paths through installed-bin and one-shot `npm exec --package <tarball>`.

### v4.30 — Local learning usage sidecar

- **v4.30 (Phase 245)** — Added privacy-preserving learning usage sidecar recording for `prompt --with-learning` and `pack --with-learning`. Usage events store selected entry ids, command, route, counts, audit status, and short brief hashes in `learning.usage.json` without raw brief text. Package smoke verifies sidecar output through installed-bin and one-shot `npm exec --package <tarball>` paths.

### v4.29 — Local learning archive-first curation

- **v4.29 (Phase 244)** — Added `design-ai learn --curate` preview/apply flow to archive duplicate and sensitive learning entries into sibling `*.archive.json` files before removing them from the active profile. Package smoke verifies curation preview/apply behavior and archive persistence through installed-bin and one-shot `npm exec --package <tarball>` paths.

### v4.28 — Website improvement target-repo bundle handoff prompt

- **v4.28 (Phase 243)** — Added `design-ai site <bundle-dir> --bundle-handoff [--strict] [--json]` to turn a verified Website Improvement handoff bundle into a target-repo Codex prompt with bundle-check status, SHA-256 bundle digest, implementation prompt content, operating rules, supporting context, and required final response evidence. Package smoke verifies bundle-handoff JSON through installed-bin and one-shot `npm exec --package <tarball>` paths.

### v4.27 — Website improvement handoff bundle compare

- **v4.27 (Phase 242)** — Added `design-ai site <bundle-dir> --bundle-compare <other-bundle-dir> [--strict] [--json]` to validate and compare two Website Improvement handoff bundles by bundle digest, checksum-level changed files, and summary metadata drift. Package smoke verifies bundle-compare JSON through installed-bin and one-shot `npm exec --package <tarball>` paths.

### v4.26 — Website improvement handoff bundle fingerprint verification

- **v4.26 (Phase 241)** — Added `summary.json.checksums.bundleDigest` to Website Improvement handoff bundles as a deterministic SHA-256 fingerprint of the ordered checksum manifest. `design-ai site <bundle-dir> --bundle-check --strict --json` now verifies that bundle digest against both the manifest and the current bundle files, while human output prints the digest for quick archive or handoff comparison. Package smoke verifies bundle digest presence through installed-bin and one-shot `npm exec --package <tarball>` paths.

### v4.25 — Website improvement handoff bundle checksum verification

- **v4.25 (Phase 240)** — Added SHA-256 checksum manifesting to Website Improvement handoff bundles. `design-ai site --bundle --out <dir>` now records checksums in `summary.json`, and `design-ai site <bundle-dir> --bundle-check --strict --json` recomputes them so copied, edited, or partially transferred bundles fail before target-repo handoff. Package smoke verifies checksum manifest shape and verified checksum counts through installed-bin and one-shot `npm exec --package <tarball>` paths.

### v4.24 — Website improvement handoff bundle verification

- **v4.24 (Phase 239)** — Added `design-ai site <bundle-dir> --bundle-check [--strict] [--json]` so generated Website Improvement handoff bundles can be checked for file manifest completeness, JSON consistency, recomputed MCP readiness, task counts, and required Markdown anchors before target-repo handoff. Package smoke now verifies bundle-check JSON through installed-bin and one-shot `npm exec --package <tarball>` paths after bundle generation.

### v4.23 — Website improvement handoff bundle export

- **v4.23 (Phase 238)** — Added `design-ai site --bundle --out <dir> [--strict] [--force]` so Website Improvement workspace JSON can become a complete local handoff directory with generated tasks, MCP readiness JSON, MCP action plan, handoff report, prompt bundle, focused Codex implementation prompt, summary metadata, and explicit no-external-call boundaries. Package smoke now verifies the bundle path through installed-bin and one-shot `npm exec --package <tarball>` paths while preserving the local/operator boundary.

### v4.22 — Website improvement MCP action plan export

- **v4.22 (Phase 237)** — Added `design-ai site --mcp-plan [--strict] [--out file]` so local MCP readiness results can become a Markdown action plan with blocking items, warnings, task/MCP alignment, execution sequence, follow-up commands, and explicit no-external-call boundaries. Package smoke now verifies MCP action plan output through installed-bin and one-shot `npm exec --package <tarball>` paths while preserving the local/operator boundary.

### v4.21 — Website improvement MCP readiness check

- **v4.21 (Phase 236)** — Added `design-ai site --mcp-check [--strict] [--json]` so Website Improvement workspace JSON can be checked for local MCP readiness evidence and task/MCP gaps before implementation handoff. Package smoke now verifies MCP readiness JSON output through installed-bin and one-shot `npm exec --package <tarball>` paths while preserving the local/operator boundary.

### v4.20 — Website improvement prompt template listing

- **v4.20 (Phase 235)** — Added `design-ai site --prompt-list [--json]` so operators can discover the eight Website Improvement prompt template ids, target agent, output type, description, and task-selection support before exporting a single prompt. Package smoke now verifies prompt template listing through installed-bin and one-shot `npm exec --package <tarball>` paths while preserving the local/operator boundary.

### v4.19 — Website improvement single prompt task selection

- **v4.19 (Phase 234)** — Added `design-ai site --prompt codex-implementation --task <id-or-number>` so Website Improvement workspace JSON can export an implementation prompt for a specific refactor task. Package smoke now verifies task-selected prompt generation through installed-bin and one-shot `npm exec --package <tarball>` paths while preserving the local/operator boundary.

### v4.18 — Website improvement single prompt export

- **v4.18 (Phase 233)** — Added `design-ai site --prompt <template-id>` so Website Improvement workspace JSON can export one focused Codex or Claude prompt without producing the full bundle. Package smoke verifies `design-ai site --stdin --prompt codex-implementation` through installed-bin and one-shot `npm exec --package <tarball>` paths while preserving the local/operator boundary.

### v4.17 — Website improvement CLI refactor task generation

- **v4.17 (Phase 232)** — Added `design-ai site --tasks` so Website Improvement workspace JSON can be expanded with deterministic starter refactor tasks from audit findings. The CLI now supports a file-first path from `--sample` to edited workspace JSON, generated refactor plan, prompt bundle, and handoff report while preserving the local/operator boundary.

### v4.16 — Website improvement CLI bootstrap

- **v4.16 (Phase 231)** — Added `design-ai site --sample` so Website Improvement workspace JSON can be generated from the CLI before opening the static console. The sample mode supports stdout and safe `--out` / `--force` file writing, and package smoke now verifies the path from installed-bin and one-shot `npm exec --package <tarball>`. The command preserves the local/operator boundary: no target repo mutation, external MCP calls, backend storage, embeddings, fine-tuning, or new dependencies.

### v4.15 — Website improvement CLI handoff

- **v4.15 (Phase 230)** — Added `design-ai site` for Website Improvement Console JSON exports, including schema/readiness validation, `--strict` gating, machine-readable `--json` summaries, Markdown handoff report generation, Codex/Claude prompt bundle generation, and packed-tarball smoke coverage for installed-bin plus one-shot `npm exec --package <tarball>` paths. The command preserves the v4.14 MVP boundary: no target repo mutation, external MCP calls, backend storage, embeddings, fine-tuning, or new dependencies.

### v4.14 — Website improvement control tower

- **v4.14 (Phase 229)** — Added a zero-dependency static Web App under `docs/website-console/` for Site Profile management, audit checklist tracking, MCP readiness, refactor task generation, eight Codex/Claude prompt templates, JSON export/import, and Markdown handoff reports. Added `website-improvement` as a route, skill, slash command, docs page, and worked example while keeping target website repo edits, external MCP writes, crawling, Lighthouse/axe, visual diff, embeddings, fine-tuning, backend sync, and new dependencies outside MVP scope.

### v2.x — Domain expansion

The corpus had product UI / design system depth. v2.x added six adjacent domains every modern designer needs.

- **v2.1 (Phase 12)** — Motion design depth. 5 knowledge files, 4 component specs, motion-designer skill, /motion-design command. Covered CSS / Framer Motion / GSAP / Lottie / Rive decision tree. Reduced-motion-safe by default.
- **v2.2 (Phase 13)** — Illustration systems. Style / voice / mascot / SVG optimization. Korean fintech mascot conventions (Kakao Friends, Toss money characters).
- **v2.3 (Phase 14)** — Print / physical design. CMYK, bleed, business cards, brochures, packaging. Korean print conventions (명함 90×50, KFDA / KATS regulatory, 분리배출 표시).
- **v2.4 (Phase 15)** — Video content. Codecs, captions, marketing / social / in-product. Korean video conventions (자막, 표시광고법 ad disclosure, KFDA / KFTC compliance).
- **v2.5 (Phase 16)** — Game UI. Russell taxonomy, HUD design, menu systems, accessibility. Korean gaming conventions (PC bang, 확률 표시 mandatory, GRAC ratings, gacha pity).
- **v2.6 (Phase 17)** — Voice / conversational UI. Voice assistants, chatbots, AI chat (LLM). Korean voice ecosystem (Bixby / Clova / NUGU / Kakao i), 해요체 vs 합쇼체.
- **v2.7 (Phase 18)** — AR / VR / spatial design. Milgram continuum, comfort zones, locomotion, mobile AR vs headset MR. Korean Galaxy XR context.

By v2.7, the corpus covered every adjacent domain a modern designer encounters. 91 knowledge files, 99 worked examples.

### v3.0 → v3.4 — Distribution

The corpus existed; nobody could install it. v3.x made it real.

- **v3.0 (Phase 19)** — Stabilization. `.claude-plugin/plugin.json` Claude Code plugin manifest. `install.sh` automated installer. CHANGELOG.md, LICENSE, QUICKSTART.md. CI now ran 5 audits.
- **v3.1 (Phase 20)** — NPM CLI distribution. `@design-ai/cli` npm package; `npx @design-ai/cli install` — adopters could go from zero to installed in one command.
- **v3.2 (Phase 21)** — Public doc site. mkdocs-material on GitHub Pages with brand-colored palette, Pretendard for Korean, full nav covering all 91 knowledge files + 99 examples.
- **v3.3 (Phase 22)** — Component coverage push. 23.6% → 30.7% (47 → 61 of 199 canonical components). 13 new specs covering shadcn flagship primitives (sidebar, command, sheet, dropdown, navigation-menu, etc.).
- **v3.4 (Phase 23)** — Multi-agent integration + Homebrew. Worked walkthroughs for Codex CLI / Cursor / Aider / SDK proving the "model-agnostic" tagline. Homebrew formula. Integration audit added to CI.

### v3.5 → v3.7 — Coverage acceleration

Build the leverage tool, then push coverage further.

- **v3.5 (Phase 24)** — Component spec scaffolder + coverage 30.7% → 36.2%. Built `tools/extractors/component_spec_scaffold.py` to scaffold drafts from upstream sources. Wrote 11 manual specs.
- **v3.6 (Phase 25)** — Korean i18n. README.ko.md, QUICKSTART.ko.md, DISTRIBUTION.ko.md, AGENTS.ko.md. mkdocs-static-i18n plugin; `/ko/` paths on the doc site. Direct lever for the user's stated 시장성 / 대중성 goal.
- **v3.7 (Phase 26)** — Coverage 36.2% → 45.2%. 18 specs across form / layout / overlay / navigation / utility primitives. Halfway-to-100% milestone.

### v3.8 — VS Code

- **v3.8 (Phase 27)** — VS Code extension. Full TypeScript scaffold with 4 sidebar trees (Skills / Knowledge / Examples / Walkthroughs), 8 commands, 2 settings (path / language). Vendor-neutral — pairs with Copilot Chat / Cursor / Continue / any AI assistant.

### v3.9 → v3.10 — Coverage + Korean depth

- **v3.9 (Phase 28)** — Coverage 45.2% → 55.3%. 18 specs (Switch / Tag / Snackbar / Sonner / Textarea / Popconfirm / Popper / SwipeableDrawer / Resizable / ImageList / BackTop / ClickAwayListener / Toolbar / Step / Zoom / SpeedDialAction / Slide). Majority canonical coverage.
- **v3.10 (Phase 29)** — Korean walkthroughs. Translated all 5 integration walkthroughs (Codex / Cursor / Aider / SDK / VS Code) to Korean. Korean copy check now scans 26 files.

### v3.11 → v3.12 — Release readiness

- **v3.11 (Phase 30)** — Versioned knowledge frontmatter. Migration script added `version: 1.0.0` + `last_updated: 2026-05` + `stability: stable` to all 91 knowledge files. Foundation for v4.0 stability + adopter version pinning.
- **v3.12 (Phase 31)** — Release readiness. `tools/audit/stale-check.py` operationalizes versioning (warn at 6mo, error at 12mo). `docs/RELEASE-CHECKLIST.md` codifies pre-release ritual. This SESSION-LOG.md.

### v4.0 — Stable graduation

- **v4.0 (Phase 32)** — Graduation release. No code changes from v3.12; just promotes the corpus to API-stable across 8 surfaces (knowledge / skills / commands / agents / CLI / plugin manifest / VS Code config / doc URLs). `docs/MIGRATION-v4.md` documents the deprecation policy: deprecate in 4.x → maintain in 4.x → remove in 5.0.

### v4.1 → v4.2 — Localization + launch prep

- **v4.1 (Phase 33)** — Korean adopter / contributor docs. `USING.ko.md` / `CONTRIBUTING.ko.md` / `ARCHITECTURE.ko.md` round out the foundational doc set in Korean. KR adopters now have full sense-making path without English friction.
- **v4.2 (Phase 34)** — Launch kit. Drafts ready for Show HN / dev.to / OKKY / hashnode KR / r/korea / r/programming / Twitter EN+KO threads. Per-channel tone matrix, posting cadence, FAQ, press kit. Posting is owner action (held until product-ready).

### v4.3 → v4.6 — Internal completeness

- **v4.3 (Phase 35)** — Internal completeness. Standardized 19/19 skill verification headings. Added `tools/audit/run-all.py` unified runner (~0.8s for all 6). 16 CLI unit tests. VS Code language toggle + corpus search command.
- **v4.4 (Phase 36)** — Component spec extractor v2 (TS AST). Replaced regex with TypeScript Compiler API. Correctly handles generics, intersection types, destructured defaults, JSDoc tags. Per-prop provenance from Ant + MUI + shadcn. Foundation for v4.5's coverage push.
- **v4.5 (Phase 37)** — Coverage 55.3% → 68.8%. 27 new specs (8 polished, 19 honest DRAFTs). Family-completion focus: Form / List / Dialog / Card / Accordion / Menu families all complete.
- **v4.6 (Phase 38)** — Stability re-review automation. Quarterly ritual operationalized: `stability-review.py` report + `promote-stability.py` + `bump-last-updated.py` bulk tools. `/stability-review` slash command. `docs/CONTRIBUTING.md` 5-step ritual.

### v4.7 → v4.8 — Dogfood-driven hardening

- **v4.7 (Phase 39)** — Dogfood v4 (Korean B2B HR onboarding scenario). 5 corpus gaps surfaced and fixed inline: missing LoadingButton spec, stability-review false positive, b2b-onboarding knowledge file, KR B2B SaaS palette row, v2 banner accuracy claim. v3 vs v4 dogfood time: 3-5x faster on Form/Dialog/List work.
- **v4.8 (Phases 40-42)** — Three-surface dogfood: VS Code extension + npm distribution + mkdocs site build. Each surface surfaced real bugs (search preview lost matches past column 120, missing icon.png, tools/migrations/ not in npm allowlist, **link-check.py false-negative across entire audit history**, two missing flagship primitives — Dialog parent and Stack — that v4.5 family-completion claimed were shipped). All fixed.

### v4.9 — Polish + 80% coverage

- **v4.9 (Phases 43-44)** — Polished 18 of 21 v4.5/v4.7 DRAFT specs (only 3 accordion subs intentionally remain). Coverage push 68.8% → 80.9%. 26 new fully-polished specs. Every flagship MUI primitive now covered with parent + family children.

### v4.10 → v4.13 — Release hardening, drift tooling, and 90% coverage

- **v4.10 (Phases 45-47)** — VS Code real-instance e2e infrastructure, SESSION-LOG refresh, and component extractor v3 cross-source conflict detection.
- **v4.11 (Phase 48)** — CI wiring. Audit, unit tests, VS Code e2e, and informational conflict-check moved into GitHub workflows.
- **v4.12 (Phase 49)** — Reconciliation mode. `component_spec_reconcile.py` proposes unified API rows and can safely apply HIGH-confidence updates.
- **v4.13 (Phases 50-113)** — Closed all DRAFT spec debt, added raw-hex example hygiene, reached 90%+ canonical coverage, documented summary-first drift review, synced Korean maintenance docs, refreshed upstream refs, added `BorderBeam` coverage after Ant Design expanded the canonical index to 200, added a self-tested local CI parity gate for push-readiness, removed generated Ant Design swatch hash-link noise from MkDocs builds, tightened public docs links before Real-CI, narrowed MkDocs warnings to intentional `refs/` source links, made that non-`refs/` warning baseline enforceable inside `npm run ci:local`, reduced successful local CI docs output to a compact warning-policy summary, aligned the GitHub Pages docs workflow with the same docs-only policy path, added a local drift check so that workflow cannot silently bypass the policy later, tightened that check to inspect workflow commands and path entries, made Korean top-level site inputs trigger docs deployment, expanded the invariant to cover the main corpus directory triggers, capped the remaining refs-only MkDocs warning stream at the accepted 632-warning baseline, synced Korean distribution guidance with that warning-policy cap, added release metadata coverage so bilingual distribution policy drift fails before tagging, made that guard accept natural Korean policy terms without losing strictness, expanded it across README, RELEASE-CHECKLIST, and Distribution docs, required those docs to keep the `ci:local` command handoff, made the required policy-doc coverage set fail closed, rejected unexpected policy-doc coverage entries, fixed the checked docs order as deterministic release metadata, converted missing policy-doc files into structured loader errors, extended that structured input loading to package/plugin manifests plus CHANGELOG/ROADMAP, converted audit-count source failures into structured metadata errors, self-tested the human pass/fail output formatter, self-tested the release metadata JSON formatter plus summary key order, converted release metadata phrase validation to a shared table-driven guard path, self-tested that phrase guard table for label drift and invalid term groups, added a self-tested `design-ai check` JSON formatter for artifact/examples reports, added a self-tested `design-ai route` JSON formatter for recommendation/catalog reports, added a self-tested `design-ai prompt` JSON formatter for inferred/forced prompt plans, added a self-tested `design-ai pack` JSON formatter for complete/partial prompt-context bundles, added a self-tested `design-ai examples` JSON formatter for route-biased worked-example discovery, added a self-tested `design-ai search` JSON formatter for corpus search hits, added a self-tested `design-ai show` JSON formatter for corpus file output, guarded release-facing docs against dropping that corpus discovery JSON guidance, guarded release-facing docs against dropping explicit show-lines and route-explain smoke guidance, guarded release-facing docs against dropping suggestion and numeric range failure smoke guidance, guarded release-facing docs against dropping prompt/pack output-file confirmation smoke guidance, added a self-tested `design-ai help` JSON formatter for command discovery catalogs, guarded release-facing docs against dropping that help JSON topic catalog guidance, guarded release-facing docs against dropping command and functional alias smoke guidance, guarded release-facing docs against dropping command-specific help topic smoke guidance, added a self-tested `design-ai doctor` JSON formatter for install-health diagnostics, guarded release-facing docs against dropping that doctor strict diagnostics guidance, added self-tested `design-ai list --json` catalog output for shipped skills, commands, and agents, guarded release-facing docs against dropping that list JSON catalog guidance, added self-tested `design-ai status --json` install-state output for installed symlink verification, guarded release-facing docs against dropping that status JSON install-state guidance, added self-tested `design-ai audit --json` repository-gate output for CI/release automation, guarded release-facing docs against dropping that audit strict-quiet smoke guidance, added self-tested `design-ai version --json` metadata output for version-alignment automation, guarded release-facing README docs against dropping that version JSON smoke guidance, added self-tested `design-ai install --json` lifecycle output for install-count automation, guarded release-facing docs against dropping that install JSON smoke guidance, added self-tested `design-ai uninstall --json` lifecycle output for removal-count automation, guarded release-facing docs against dropping that uninstall JSON smoke guidance, made `design-ai update` reject unknown options before git/install lifecycle work starts, added human/JSON `design-ai update --dry-run` preview output so update smoke can validate planned git/install work without mutations, and guarded release-facing docs against dropping that update dry-run smoke guidance.
- **v4.13 (Phase 114)** — Guarded release-facing docs against dropping top-level help smoke guidance.
- **v4.13 (Phase 115)** — Guarded release-facing docs against dropping human version smoke guidance.
- **v4.13 (Phase 116)** — Guarded release-facing docs against dropping check examples/artifact/stdin/all-routes smoke guidance.
- **v4.13 (Phase 117)** — Guarded release-facing docs against dropping route JSON/catalog/stdin smoke guidance.
- **v4.13 (Phase 118)** — Guarded release-facing docs against dropping prompt/pack JSON/markdown/from-file/stdin smoke guidance.
- **v4.13 (Phase 119)** — Guarded release-facing docs against dropping human install/status/uninstall lifecycle smoke guidance.
- **v4.13 (Phase 120)** — Guarded release-facing docs against dropping unknown command/help/list/search-dir failure smoke guidance.
- **v4.13 (Phase 121)** — Guarded release-facing docs against dropping packed-tarball `npm exec --package <tarball>` smoke guidance.
- **v4.13 (Phase 122)** — Guarded release-facing docs against dropping public registry `npm exec --package @design-ai/cli@<version>` smoke guidance.
- **v4.13 (Phase 123)** — Guarded release-facing docs against dropping package contents check guidance.
- **v4.13 (Phase 124)** — Guarded release-facing docs against dropping CLI unit test guidance.
- **v4.13 (Phase 125)** — Guarded release-facing docs against dropping all-eight repository audit gate guidance.
- **v4.13 (Phase 126)** — Guarded release-facing docs against dropping whitespace check guidance.
- **v4.13 (Phase 127)** — Guarded release-facing docs against dropping release self-test guidance.
- **v4.13 (Phase 128)** — Guarded release-facing docs against dropping packed-tarball installed-bin smoke guidance.
- **v4.13 (Phase 129)** — Guarded release-facing docs against dropping release metadata check guidance.
- **v4.13 (Phase 130)** — Guarded release-facing docs against dropping packed-tarball smoke gate guidance.
- **v4.13 (Phase 131)** — Guarded release-facing docs against dropping the `release:check` core gate command.
- **v4.13 (Phase 132)** — Guarded release-facing docs against dropping the post-publish `registry:smoke` command.
- **v4.13 (Phase 133)** — Guarded release-facing docs against dropping the local `package:smoke` command.
- **v4.13 (Phase 134)** — Guarded release-facing docs against dropping the local `package:check` command.
- **v4.13 (Phase 135)** — Guarded release-facing docs against dropping the local `release:metadata` command.
- **v4.13 (Phase 136)** — Guarded release-facing docs against dropping the local `release:self-test` command.
- **v4.13 (Phase 137)** — Guarded release-facing docs against dropping the local `git diff --check` command.
- **v4.13 (Phase 138)** — Guarded release-facing docs against dropping the local `npm test` command.
- **v4.13 (Phase 139)** — Guarded release-facing docs against dropping the local `npm run audit:strict` command.
- **v4.13 (Phase 140)** — Split local `npm run ci:local` command drift from MkDocs warning-policy drift.
- **v4.13 (Phase 141)** — Guarded release-facing docs against dropping the local `design-ai help` command.
- **v4.13 (Phase 142)** — Split `design-ai help --json` command drift from help JSON topic catalog drift.
- **v4.13 (Phase 143)** — Split `design-ai version --json` command drift from machine-readable version metadata drift.
- **v4.13 (Phase 144)** — Split `design-ai install --json` command drift from machine-readable install lifecycle output drift.
- **v4.13 (Phase 145)** — Split `design-ai uninstall --json` command drift from machine-readable uninstall lifecycle output drift.
- **v4.13 (Phase 146)** — Split `design-ai status --json` command drift from machine-readable install-state output drift.
- **v4.13 (Phase 147)** — Split `design-ai audit --strict --quiet --json` command drift from machine-readable repository-audit output drift.
- **v4.13 (Phase 148)** — Split `design-ai doctor --strict` command drift from human diagnostics wording drift.
- **v4.13 (Phase 149)** — Split update dry-run command, JSON command, and machine-readable update plan drift.
- **v4.13 (Phase 150)** — Split command alias smoke drift from functional alias smoke drift.
- **v4.13 (Phase 151)** — Split list JSON mode drift from list catalog domain drift.
- **v4.13 (Phase 152)** — Split route JSON output, route catalog output, and route stdin input drift.
- **v4.13 (Phase 153)** — Split show-lines output drift from route-explain output drift.
- **v4.13 (Phase 154)** — Split unknown command, help-topic, list-domain, and search-dir failure drift.
- **v4.13 (Phase 155)** — Split route-id suggestion, option suggestion, value suggestion, and numeric range failure drift.
- **v4.13 (Phase 156)** — Split prompt JSON, prompt markdown, prompt from-file, prompt stdin, pack JSON, pack markdown, pack from-file, and pack stdin drift.
- **v4.13 (Phase 157)** — Split prompt/pack forced output-file and prompt/pack file-write confirmation drift.
- **v4.13 (Phase 158)** — Split check examples, check artifact, check stdin, and check all-routes output drift.
- **v4.13 (Phase 159)** — Split human install, human status, and human uninstall output drift.
- **v4.13 (Phase 160)** — Split human audit strict-quiet output drift.
- **v4.13 (Phase 161)** — Split human update dry-run output drift.
- **v4.13 (Phase 162)** — Split human doctor strict diagnostics output drift.
- **v4.13 (Phase 163)** — Split doctor JSON command and machine-readable diagnostics output drift.
- **v4.13 (Phase 164)** — Hardened doctor JSON smoke assertions for schema shape and summary consistency.
- **v4.13 (Phase 165)** — Hardened audit JSON smoke assertions for payload type, entry schema, numeric contracts, and summary consistency.
- **v4.13 (Phase 166)** — Hardened lifecycle JSON smoke assertions for payload type, nested key shape, exact integer counts, and install/status/uninstall summary consistency.
- **v4.13 (Phase 167)** — Hardened corpus discovery JSON smoke assertions for search/show/examples key shape, file paths, exact integer fields, and limit-bound counts.
- **v4.13 (Phase 168)** — Hardened route/prompt/pack JSON smoke assertions for recommendation and prompt-bundle key shape, exact numeric fields, reference coverage consistency, and context file order.
- **v4.13 (Phase 169)** — Hardened check JSON smoke assertions for artifact/stdin/example report key shape, exact result order, count consistency, and example metadata contracts.
- **v4.13 (Phase 170)** — Hardened help/list/version JSON smoke assertions for command-discovery key shape, alias/topic order, catalog item contracts, and version metadata keys.
- **v4.13 (Phase 171)** — Hardened update dry-run JSON smoke assertions for exact git/install plan key order, boolean contracts, command arrays, and readiness reasons.
- **v4.13 (Phase 172)** — Hardened status JSON smoke assertions for exact install-state section labels and Claude-home target directory contracts.
- **v4.13 (Phase 173)** — Hardened lifecycle JSON smoke assertions for source/target context separation across install, update dry-run, status, and uninstall reports.
- **v4.13 (Phase 174)** — Documented product readiness boundaries: core design consulting workflows are locally release-ready, while AI model training and personalization remain outside shipped scope.
- **v4.13 (Phase 175)** — Added local learning profile MVP: `design-ai learn` stores explicit local preferences, and `prompt`/`pack --with-learning` inject them only when requested.
- **v4.13 (Phase 176)** — Added learning profile management controls: list/export filtering, confirmed single-entry forget, and confirmed full-profile clear.
- **v4.13 (Phase 177)** — Added learning profile audit controls: read-only `learn --audit` inspection for profile shape, duplicates, timestamp gaps, long notes, and possible sensitive content.
- **v4.13 (Phase 178)** — Added scoped learning prompt injection: `prompt`/`pack --with-learning` now accept category and limit filters before including local preferences.
- **v4.13 (Phase 179)** — Added learning profile stats summaries: read-only `learn --stats` reports counts, category/source distribution, recency, and audit status.
- **v4.13 (Phase 180)** — Added learned-context audit summaries: `learn --export`, `prompt --with-learning`, and `pack --with-learning` now carry profile audit status and warn when injected preferences come from a warning-bearing profile.
- **v4.13 (Phase 181)** — Added learning audit cleanup suggestions: `learn --audit` now emits read-only remediation guidance plus safe `--forget` commands when warning entries can be removed unambiguously.
- **v4.13 (Phase 182)** — Added package smoke coverage for learning audit cleanup suggestions: packed-tarball installed-bin and one-shot npm exec paths now verify `learn --audit` JSON suggestions plus human Suggested cleanup output, and release metadata now guards the release-facing docs phrase.
- **v4.13 (Phase 183)** — Added the learning audit safe fix loop: `learn --audit --fix --dry-run` previews unambiguous cleanup, `--fix --yes` applies only safe entry removals, and package smoke verifies dry-run/apply JSON behavior through installed-bin and npm exec tarball paths.
- **v4.13 (Phase 184)** — Added explicit feedback learning: `learn --feedback` records keep/improve/avoid guidance as local learning entries, and package smoke verifies feedback JSON behavior through installed-bin and npm exec tarball paths.
- **v4.13 (Phase 185)** — Added feedback input-source smoke coverage: `learn --feedback` help now documents file/stdin capture, and package smoke verifies inline, `--from-file`, and `--stdin` feedback entries through installed-bin and npm exec tarball paths.
- **v4.13 (Phase 186)** — Added portable learning profile import: `learn --import` previews and applies JSON profile merges from `--from-file` / `--stdin`, skips duplicate category+text entries, remints conflicting ids, and package smoke verifies import through installed-bin and npm exec tarball paths.
- **v4.13 (Phase 187)** — Added portable learning profile backup: `learn --backup --json` emits a full import-compatible profile backup with audit summary, and package smoke verifies backup JSON through installed-bin and npm exec tarball paths.
- **v4.13 (Phase 188)** — Added portable learning import verification: `learn --verify` validates backup/import JSON from `--from-file` or `--stdin` without touching the target profile, package smoke verifies verify JSON through installed-bin and npm exec tarball paths, and transient one-shot npm cache ENOENT failures retry with a fresh cache.
- **v4.13 (Phase 189)** — Added redacted portable learning backup: `learn --redact --json` emits an import-compatible profile with sensitive-looking entry text replaced by redaction markers, and package smoke verifies redact JSON through installed-bin and npm exec tarball paths.
- **v4.13 (Phase 190)** — Added redaction source portability: `learn --redact` can redact portable learning JSON from `--from-file` or `--stdin` without mutating the active local profile, and package smoke verifies local, file, and stdin redaction through installed-bin and npm exec tarball paths.
- **v4.13 (Phase 191)** — Added safe learn output files: JSON-producing learn actions and export Markdown can write to `--out` with `--force` overwrite control, and package smoke covers backup/redact file-write paths through installed-bin and npm exec tarball paths.
- **v4.13 (Phase 192)** — Added brief-relevant learning selection: `prompt`/`pack --with-learning` rank local entries against the current brief before recency fallback, expose selection metadata, and package smoke verifies prompt/pack JSON behavior through installed-bin and npm exec tarball paths.
- **v4.13 (Phase 193)** — Added release metadata guard coverage for brief-relevant learning selection: release-facing docs now have a drift check so the prompt/pack learning relevance smoke guidance cannot silently disappear.
- **v4.13 (Phase 194)** — Added explainable learning selection metadata: `prompt`/`pack --with-learning --json` now reports selected entry scores, matched tokens, and brief-match versus recency-fallback reasons, with package smoke coverage.
- **v4.13 (Phase 195)** — Added query-filtered learning inspection: `learn --list --query` and `learn --export --query` return matching local preference entries without recency fallback, with package smoke coverage.
- **v4.13 (Phase 196)** — Added explainable learning list inspection: `learn --list --query --explain --json` now reports selection score, matched tokens, and match reason before users export or inject learned context, with package smoke coverage.
- **v4.13 (Phase 197)** — Added release metadata guard coverage for query-filtered learning explanation/export: release-facing docs now have a drift check so the `learn --list --explain` / `learn --export` smoke guidance cannot silently disappear.
- **v4.13 (Phase 198)** — Added human output package smoke for query-filtered learning explanation: packed-tarball installed-bin and npm exec paths now verify `learn --list --query --explain` human output as well as JSON metadata.
- **v4.13 (Phase 199)** — Added learning stats package smoke: packed-tarball installed-bin and npm exec paths now verify human and JSON `learn --stats` profile summaries plus release metadata wording.
- **v4.13 (Phase 200)** — Added public registry learning stats smoke: post-publish `registry:smoke` now verifies human and JSON `learn --stats` profile summaries from the published npm package path, with release metadata wording protection.
- **v4.13 (Phase 201)** — Added public registry learning backup smoke: post-publish `registry:smoke` now verifies JSON `learn --backup` portable profile output from the published npm package path, with release metadata wording protection.
- **v4.13 (Phase 202)** — Added public registry learning verify smoke: post-publish `registry:smoke` now verifies JSON `learn --verify` portable profile validation from file and stdin input through the published npm package path, with release metadata wording protection.
- **v4.13 (Phase 203)** — Added auto feedback capture for local AI learning: `design-ai check --learn --yes` now converts warning/failure artifact QA results into local learning entries, with installed-bin and one-shot package smoke coverage plus release metadata wording protection.
- **v4.13 (Phase 204)** — Added internal dogfood workspace mode: `design-ai workspace` now reports read-only git, learning profile, release-script readiness, and next-action hints for solo/internal dogfood before repo cleanup or push.
- **v4.13 (Phase 205)** — Added starter learning profile bootstrap: `design-ai learn --init` previews deterministic dogfood preference entries, while `--init --yes` writes them through the existing local learning schema and skips duplicates.
- **v4.13 (Phase 206)** — Added public registry check learning capture smoke: post-publish `registry:smoke` now verifies `design-ai check --learn --yes --json` output and persisted learning profile entries from the published npm package path.
- **v4.13 (Phase 207)** — Added a Pages-disabled docs workflow guard: MkDocs build verification still runs on pushes, but artifact upload and Pages deployment are skipped when GitHub Pages has not been enabled.
- **v4.13 (Phase 208)** — Added GitHub Actions Node 24 opt-in: audit, docs, publish, and release workflows now force the upcoming JavaScript action runtime, with local CI self-test coverage to prevent drift.
- **v4.13 (Phase 209)** — Upgraded official GitHub Actions refs to Node 24-compatible major versions and added local CI action-ref drift coverage for stale or missing required action refs.
- **v4.13 (Phase 210)** — Retired the temporary GitHub Actions Node 24 opt-in after official action refs reached Node 24-compatible major versions, leaving local CI to guard the actual workflow pins.
- **v4.13 (Phase 211)** — Aligned public repository metadata and docs to `sungjin9288/design-ai`, with release metadata guards for stale package, plugin, and release-policy repository references.
- **v4.13 (Phase 212)** — Added workspace repository alignment diagnostics: `design-ai workspace` now reports canonical repository remote/package/plugin metadata alignment, with package smoke covering workspace JSON in installed-bin and one-shot npm exec paths.
- **v4.13 (Phase 213)** — Added workspace strict readiness gating: `design-ai workspace --strict` now exits non-zero on readiness warnings/failures while keeping the command read-only.
- **v4.13 (Phase 214)** — Added packed-tarball workspace strict smoke coverage: installed-bin and one-shot npm exec paths now verify strict JSON failure and clean-success readiness behavior.
- **v4.13 (Phase 215)** — Added release metadata guard coverage for workspace strict package smoke guidance, preventing release-facing docs from dropping strict readiness failure/success coverage.
- **v4.13 (Phase 216)** — Added public registry workspace strict smoke coverage: post-publish registry smoke now verifies strict JSON failure and clean-success readiness behavior from the published package path.
- **v4.13 (Phase 217)** — Added public registry learning audit cleanup smoke coverage: post-publish registry smoke now verifies learn audit cleanup suggestions, dry-run cleanup previews, and confirmed cleanup persistence from the published package path.
- **v4.13 (Phase 218)** — Added public registry portable learning import/redact smoke coverage: post-publish registry smoke now verifies learn import dry-run/apply behavior plus learn redact file/stdin/output-file redaction behavior from the published package path.
- **v4.13 (Phase 219)** — Added public registry learning feedback/init smoke coverage: post-publish registry smoke now verifies feedback inline/file/stdin capture plus starter profile preview/apply/duplicate-skip behavior from the published package path.
- **v4.13 (Phase 220)** — Added public registry learning relevance/query smoke coverage: post-publish registry smoke now verifies query-filtered learn list/export output plus brief-relevant prompt/pack learning selection from the published package path.
- **v4.13 (Phase 221)** — Added public registry learning backup output-file smoke coverage: post-publish registry smoke now verifies `learn --backup --json --out --force` confirmation and persisted portable backup JSON from the published package path.
- **v4.13 (Phase 222)** — Added public registry learning verify output-file smoke coverage: post-publish registry smoke now verifies `learn --verify --from-file --json --out --force` confirmation and persisted portable verification JSON from the published package path.
- **v4.13 (Phase 223)** — Added packed-tarball learning verify output-file smoke coverage: pre-publish package smoke now verifies `learn --verify --from-file --json --out --force` confirmation and persisted portable verification JSON from installed-bin and one-shot npm exec paths.
- **v4.13 (Phase 224)** — Added packed-tarball learning stats output-file smoke coverage: pre-publish package smoke now verifies `learn --stats --json --out --force` confirmation and persisted profile summary JSON from installed-bin and one-shot npm exec paths.
- **v4.13 (Phase 225)** — Added public registry learning stats output-file smoke coverage: post-publish registry smoke now verifies `learn --stats --json --out --force` confirmation and persisted profile summary JSON from the published npm package path.
- **v4.13 (Phase 226)** — Added learning audit output-file smoke coverage: packed-tarball and public registry smoke now verify `learn --audit --json --out --force` confirmation and persisted cleanup-suggestion JSON artifacts.
- **v4.13 (Phase 227)** — Added learning import output-file smoke coverage: packed-tarball and public registry smoke now verify `learn --import --dry-run --json --out --force` confirmation and persisted import preview JSON artifacts.
- **v4.13 (Phase 228)** — Added learning feedback output-file smoke coverage: packed-tarball and public registry smoke now verify `learn --feedback --json --out --force` confirmation, persisted feedback JSON artifacts, and the matching profile write.
- **v4.29 (Phase 244)** — Added archive-first learning curation: `learn --curate` previews duplicate/sensitive profile cleanup and `learn --curate --yes` moves candidates to a sibling archive JSON instead of deleting them, with unit and package-smoke coverage.
- **v4.30 (Phase 245)** — Added privacy-preserving learning usage sidecar: `prompt --with-learning` and `pack --with-learning` now record selected entry ids, command, route, counts, audit status, and short brief hashes in `learning.usage.json`, with unit and package-smoke coverage.
- **v4.31 (Phase 246)** — Added read-only learning usage reports: `learn --usage` summarizes sidecar events, selected entry counts, unused active entries, stale selected ids, recent hashes, and privacy metadata, with unit and package-smoke coverage.
- **v4.32 (Phase 247)** — Added read-only learning eval checkpoints: `learn --eval` validates expected and avoided selected ids against deterministic brief-relevance selection, while reporting brief hashes instead of raw brief text.
- **v4.33 (Phase 248)** — Added strict learning eval gating: `learn --eval --strict` keeps report output read-only and privacy-preserving, then exits non-zero when any checkpoint warns or fails.
- **v4.34 (Phase 249)** — Added workspace learning eval readiness: `workspace --learning-eval` includes checkpoint summaries in local dogfood readiness and lets `workspace --strict` fail on eval warning/failure states.
- **v4.35 (Phase 250)** — Added public registry workspace learning eval smoke: `registry-smoke` now verifies `workspace --learning-eval` checkpoint summaries from the published npm package path.
- **v4.36 (Phase 251)** — Added learning eval template generation: `learn --eval-template` creates runnable checkpoint JSON from the active profile so local learning gates are easier to maintain.
- **v4.37 (Phase 252)** — Added public registry learning eval-template smoke: `registry-smoke` now verifies generated checkpoint templates and strict eval replay from the published npm package path.
- **v4.38 (Phase 253)** — Added workspace learning eval-template hints: populated, audit-clean learning profiles now get a read-only next action for generating a local checkpoint before relying on personalized prompt context.
- **v4.39 (Phase 254)** — Added shell-safe workspace learning eval commands: next actions quote learning profile and checkpoint paths before presenting copy/pasteable eval-template or eval commands.
- **v4.40 (Phase 255)** — Added workspace sibling learning eval checkpoint discovery: `workspace` auto-loads `learning-eval.json` beside the selected profile when present and suggests the same sibling path for eval-template generation.
- **v4.41 (Phase 256)** — Added workspace learning eval freshness guard: `workspace` warns when checkpoint metadata is older than the active profile, points at another source profile, or records a different source entry count.
- **v4.42 (Phase 257)** — Added workspace learning usage readiness: `workspace` auto-loads sibling `learning.usage.json`, accepts `--learning-usage`, and warns when usage sidecar metadata points at another profile or stale selected entry ids.
- **v4.43 (Phase 258)** — Added learning usage curation review: `learn --curate` accepts `--usage-file`, surfaces stale selected ids and unused active entries, and keeps usage telemetry advisory-only.
- **v4.44 (Phase 259)** — Added workspace learning curation next actions: `workspace` now points learning profile audit warnings and usage sidecar drift to usage-aware `learn --curate --usage-file` previews.
- **v4.45 (Phase 260)** — Added learning curation Markdown reports: `learn --curate --report --out` writes a privacy-preserving review artifact with archive candidates, usage hints, and next steps.
- **v4.46 (Phase 261)** — Added workspace curation report next actions: `workspace` now suggests privacy-preserving Markdown curation report artifacts alongside learning profile and usage sidecar curation warnings.
- **v4.47 (Phase 262)** — Added read-only learning profile diff: `learn --diff --from-file/--stdin` compares active and portable profiles before import or restore decisions.
- **v4.48 (Phase 263)** — Added preview-first learning profile restore: `learn --restore --from-file/--stdin` replaces the active profile only with explicit `--yes` after source audit and diff review.
- **v4.49 (Phase 264)** — Added restore rollback backups: confirmed `learn --restore --yes` writes the previous active profile to a rollback file before replacement, with `--backup-file` override and rollback preview command metadata.
- **v4.50 (Phase 265)** — Added restore rollback backup inventory: `learn --restore-backups` lists sibling rollback files, audits each candidate, and prints restore dry-run preview commands.
- **v4.51 (Phase 266)** — Added restore rollback backup pruning: `learn --restore-backups --prune` previews older rollback backup deletion candidates and applies cleanup only with `--yes`.
- **v4.52 (Phase 267)** — Added public registry learning restore smoke: `registry-smoke` now verifies restore preview/apply, rollback backup creation, restore-backups inventory, and restore-backups prune behavior from the published npm package path.

## Patterns that didn't work

### Generic English-first localization

Korean translations done in v3.6 / v3.10 / v4.1 are full translations adapted to natural Korean — not literal English-to-Korean. Earlier attempts at machine-assisted translation produced awkward output that the `korean-copy-check.py` audit specifically catches.

### Coverage push fatigue (v3.x phase)

5 coverage pushes (v3.3, v3.5, v3.7, v3.9 each contributed). The sixth would have diminishing returns. v3.11's pivot to versioned frontmatter (instead of yet-another-coverage-push) was the right call. **Resolved later** in v4.4 — the TS AST extractor v2 made each subsequent spec significantly cheaper to scaffold (v4.5 added 27, v4.9 added 24 more).

### Speculative skills before reference content (v2.x phase)

Early temptation was to ship more skills. But skills are thin — they're playbooks pointing at knowledge. Without the knowledge depth, skills produce generic output. The session prioritized knowledge depth (v2.x) before adding new skills. No new skills shipped after v2.7 — the only addition was the `/stability-review` command (v4.6, ritual-driven, not content-driven).

### "It's audited so it's correct" (v3.x → v4.8)

The 6 audits passed for hundreds of commits while `link-check.py` had a false-negative regex that **silently skipped every backtick-wrapped link reference** — the most common style in this corpus. Surfaced only when v4.8's mkdocs build dogfood emitted warnings the audit missed. Fixed with one regex character (`+` → `*`). 11 real broken links surfaced immediately. Lesson: trust audits AND dogfood in parallel; passing audits ≠ no broken links.

## Patterns that worked

### Dogfood drives next-pass quality (v4.x discovery)

Phases 39-42 (four dogfood passes — corpus / VS Code / npm / mkdocs) surfaced more real bugs in 4 commits than the previous 30 phases combined. Every dogfood found ≥3 actionable gaps. The ratio of "found-by-dogfood" to "found-by-audit" was high enough that future phases should plan dogfood as a first-class step, not afterthought.

### Honest DRAFT banners > false completeness

v2 extractor produced accurate API tables but placeholder narrative. v4.5 + v4.7 + v4.9 left ~24 DRAFT specs explicitly banner-marked, which was better than silently shipping incomplete specs as "done". v4.13 then closed the public DRAFT debt once the specs were polished enough to stand behind.

### One concern per phase (v2.0 onward)

Each phase had a single, focused theme. Not "v2.1: motion + illustration + print" — separate phases. Easier to commit, easier to revert, easier to explain. Held through v4.x except where two phases were truly inseparable (43+44 = polish + coverage; 40-42 = three surfaces of one dogfood pass).

### Korean market depth (v2.0 onward)

The user stated Korean primary audience early. Every domain phase included Korean conventions (typography, voice, regulatory, conventions). The translations in v3.6 / v3.10 / v4.1 were natural extensions of investments already made.

### Audit-driven quality (v2.0 onward)

Every phase that touched files passed the active audit gate before commit. The audits themselves grew from 4 → 8 over the session (added Korean copy, integration, stale, coverage, raw-hex hygiene, and example QA). Each new audit prevented a regression class. v4.8 strengthened the existing link-check.

### Distribution before mass content (v3.0 → v3.4)

v3.0-3.4 prioritized making the corpus *installable* before pushing more content. Coverage pushes happened only AFTER adopters could install the result. The trade-off was right: a 30% corpus that adopters can install beats a 70% corpus locked in a private repo. v4.x validated this — the dogfood passes (npm, mkdocs) only worked because distribution was solid.

### Versioning as foundation (v3.11 → v4.6)

v3.11's versioned frontmatter looks small but enabled v3.12's stale-check, v4.0's stability story, and v4.6's quarterly review automation. Foundation work compounds across multiple later phases.

### Integration walkthroughs as proof (v3.4 → v3.10)

The "model-agnostic" tagline was a claim until v3.4 added concrete walkthroughs for Codex / Cursor / Aider / SDK. Then it was demonstrated. v3.10 doubled down with Korean translations of those same walkthroughs.

## What's next (v4.13+)

v4.13+ leaves design-ai with 90%+ canonical coverage, no public DRAFT spec debt, a repeatable refs refresh path, a package smoke gate that covers inline/file/stdin learning feedback plus workspace JSON readiness, portable learning backup/redact/verify/import, portable learning verify/backup/redact/import/stats/audit output-file persistence, file/stdin redaction of existing portable backups, learning audit cleanup, safe fix behavior, archive-first `learn --curate` profile curation, local `learning.usage.json` sidecar recording for prompt/pack learning selection, public registry smoke coverage for check learning capture, learning feedback/init, portable learning verify/backup/import/stats/audit output-file persistence, portable learning import/redact, query-filtered learn list/export, brief-relevant prompt/pack learning selection, and learning audit cleanup, a Pages-disabled docs workflow guard, Node 24-compatible official action refs, retired temporary Node 24 opt-in state, canonical `sungjin9288/design-ai` repository metadata, workspace repository alignment diagnostics, `workspace --strict` readiness gating, and a local CI parity command that covers release, docs, and VS Code workflow surfaces. Logical paths:

1. **External launch** — publish only after owner review; announcement drafts already exist under `docs/announcements/`.
2. **Targeted upstream follow-up** — add specs only when upstream adds product-relevant primitives or HIGH/CRITICAL drift changes.
3. **Internal dogfood** — keep using `workspace --strict`, `learn --init`, `check --learn`, and release gates before company rollout.

When the owner is ready to publish externally, `npm run ci:local` and `npm run release:check` are the local gates, RELEASE-CHECKLIST is ritualized, announcements are drafted, and install paths are verified.

## Repo structure

```
design-ai/
├── AGENTS.md / AGENTS.ko.md           Universal entry points
├── CLAUDE.md                          Claude Code overlay
├── README.md / README.ko.md           Human entry points
├── CHANGELOG.md                       Release notes
├── LICENSE                            MIT
├── install.sh                         Symlink installer
├── package.json                       NPM CLI manifest
├── mkdocs.yml                         Doc site config
├── .claude-plugin/plugin.json         Plugin manifest
├── .github/workflows/                 CI (audit / publish / docs)
├── refs/                              Upstream sources (gitignored)
├── knowledge/  (92 files; generated coverage report + versioned corpus)
├── examples/   (220 files)
├── skills/     (20, all with verification phase)
├── agents/     (4)
├── commands/   (17)
├── docs/                              Architecture + integrations
├── tools/
│   ├── extractors/                   Source → knowledge pipeline
│   ├── audit/                        8 active audits + release helpers
│   ├── migrations/                   One-shot migration scripts
│   └── preview/                      HTML preview generator
├── cli/                               NPM CLI source
├── vscode-extension/                  VS Code extension source
└── Formula/design-ai.rb               Homebrew formula
```

## Cross-reference

- [`CHANGELOG.md`](../CHANGELOG.md) — per-version detail
- [`docs/ROADMAP.md`](ROADMAP.md) — per-phase detail
- [`docs/RELEASE-CHECKLIST.md`](RELEASE-CHECKLIST.md) — pre-release ritual
- [`docs/CONTRIBUTING.md`](CONTRIBUTING.md) — for contributors
- [`docs/USING.md`](USING.md) — for adopters
- [`docs/QUICKSTART.md`](QUICKSTART.md) — 5-minute start
