"""Ordered P11 implementation-evidence smoke phases."""
from __future__ import annotations

IMPLEMENTATION_EVIDENCE_SMOKE_PLAN = (
    "implementation-evidence-request",
    "review-evidence",
)

EXECUTOR_NAMES = ("installed-bin", "npm-exec")


class ImplementationEvidenceSmokePhaseAuthority:
    """Advance the canonical P11 sequence from its existing executor blocks."""

    def __init__(self, executor: str) -> None:
        self.plan = implementation_evidence_smoke_plan(executor)
        self.executor = executor
        self._next_index = 0

    def advance(self, phase: str) -> None:
        if phase not in self.plan:
            raise SystemExit(f"Implementation evidence smoke phase unknown for {self.executor}: {phase}")
        if self._next_index >= len(self.plan):
            raise SystemExit(f"Implementation evidence smoke phase duplicate for {self.executor}: {phase}")
        expected = self.plan[self._next_index]
        if phase != expected:
            raise SystemExit(
                f"Implementation evidence smoke phase order changed for {self.executor}: "
                f"expected {expected}, got {phase}"
            )
        self._next_index += 1

    def finish(self) -> None:
        if self._next_index != len(self.plan):
            missing = self.plan[self._next_index:]
            raise SystemExit(
                f"Implementation evidence smoke phase missing for {self.executor}: {missing!r}"
            )


def implementation_evidence_smoke_plan(executor: str) -> tuple[str, ...]:
    if executor not in EXECUTOR_NAMES:
        raise ValueError(f"unsupported implementation evidence smoke executor: {executor}")
    return IMPLEMENTATION_EVIDENCE_SMOKE_PLAN


def assert_implementation_evidence_smoke_plan(
    executor: str,
    *,
    actual: tuple[str, ...],
) -> tuple[str, ...]:
    authority = ImplementationEvidenceSmokePhaseAuthority(executor)
    for phase in actual:
        authority.advance(phase)
    authority.finish()
    return authority.plan
