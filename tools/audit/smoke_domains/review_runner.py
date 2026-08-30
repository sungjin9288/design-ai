"""Ordered P6–P10 smoke phases shared by package executors."""
from __future__ import annotations

REVIEW_SMOKE_PLAN = (
    "review-workflow",
    "review-handoff",
    "review-handoff-receipt",
    "target-repo-intake",
    "implementation-scope-proposal",
    "implementation-scope-approval",
)

EXECUTOR_NAMES = ("installed-bin", "npm-exec")


class ReviewSmokePhaseAuthority:
    """Advance the canonical P6–P10 sequence from real executor blocks."""

    def __init__(self, executor: str) -> None:
        self.plan = review_smoke_plan(executor)
        self.executor = executor
        self._next_index = 0

    def advance(self, phase: str) -> None:
        if phase not in self.plan:
            raise SystemExit(f"Review smoke phase unknown for {self.executor}: {phase}")
        if self._next_index >= len(self.plan):
            raise SystemExit(f"Review smoke phase duplicate for {self.executor}: {phase}")
        expected = self.plan[self._next_index]
        if phase != expected:
            raise SystemExit(
                f"Review smoke phase order changed for {self.executor}: "
                f"expected {expected}, got {phase}"
            )
        self._next_index += 1

    def finish(self) -> None:
        if self._next_index != len(self.plan):
            missing = self.plan[self._next_index:]
            raise SystemExit(f"Review smoke phase missing for {self.executor}: {missing!r}")


def review_smoke_plan(executor: str) -> tuple[str, ...]:
    if executor not in EXECUTOR_NAMES:
        raise ValueError(f"unsupported review smoke executor: {executor}")
    return REVIEW_SMOKE_PLAN


def assert_review_smoke_plan(executor: str, *, actual: tuple[str, ...]) -> tuple[str, ...]:
    authority = ReviewSmokePhaseAuthority(executor)
    for phase in actual:
        authority.advance(phase)
    authority.finish()
    return authority.plan
