"""Ordered Website Console smoke phases shared by local executors."""
from __future__ import annotations

SITE_SMOKE_PLAN = (
    "summary-json",
    "linked-preview-json",
    "next-actions-json",
    "next-actions-json-out",
    "next-actions-markdown-out",
    "sample-json",
    "intake-template-json",
    "intake-template-markdown",
    "intake-template-korean",
    "init-json",
    "from-intake-json",
    "from-intake-tasks",
    "init-bundle",
    "prompt-list-json",
    "mcp-check-json",
    "mcp-probes-json",
    "mcp-probes-markdown",
    "mcp-plan-json",
    "workflow-graph-json",
    "handoff-bundle",
    "bundle-check",
    "bundle-compare",
    "bundle-handoff",
    "bundle-repair",
    "tasks-json",
    "prompt-markdown",
)

EXECUTOR_NAMES = ("installed-bin", "npm-exec")


class SiteSmokePhaseAuthority:
    """Advance the Website Console smoke plan from real executor blocks."""

    def __init__(self, executor: str) -> None:
        self.plan = site_smoke_plan(executor)
        self.executor = executor
        self._next_index = 0

    def advance(self, phase: str) -> None:
        if phase not in self.plan:
            raise SystemExit(
                f"Website Console smoke phase unknown for {self.executor}: {phase}"
            )
        if self._next_index >= len(self.plan):
            raise SystemExit(
                f"Website Console smoke phase duplicate for {self.executor}: {phase}"
            )
        expected = self.plan[self._next_index]
        if phase != expected:
            raise SystemExit(
                f"Website Console smoke phase order changed for {self.executor}: "
                f"expected {expected}, got {phase}"
            )
        self._next_index += 1

    def finish(self) -> None:
        if self._next_index != len(self.plan):
            missing = self.plan[self._next_index:]
            raise SystemExit(
                f"Website Console smoke phase missing for {self.executor}: {missing!r}"
            )


def site_smoke_plan(executor: str) -> tuple[str, ...]:
    if executor not in EXECUTOR_NAMES:
        raise ValueError(f"unsupported Website Console smoke executor: {executor}")
    return SITE_SMOKE_PLAN


def assert_site_smoke_plan(
    executor: str,
    *,
    actual: tuple[str, ...],
) -> tuple[str, ...]:
    authority = SiteSmokePhaseAuthority(executor)
    for phase in actual:
        authority.advance(phase)
    authority.finish()
    return authority.plan
