"""Mutation suite for tools/audit/interface-copy-contract.py.

Each case mutates a copy of the real contract or fixtures and requires the
validator to reject it with a named error. The counterexamples come from an
independent review of the first contract version.
"""
from __future__ import annotations

import copy
from types import ModuleType
from typing import Callable

REGISTER_CASES = {
    "계속 유지": None, "이해": None, "바다": None, "해지 불필요": None, "Error 502": None,
    "저장했어요.": "haeyo", "괜찮죠?": "haeyo", "저장했어요 😊": "haeyo", "들어가요(영업일 기준)": "haeyo",
    "입금됩니다.": "hapsyo", "해지하시겠습니까?": "hapsyo", "입력하시오": "hapsyo", "합시다.": "hapsyo",
    "업로드 중입니다…": "hapsyo", "잘못된 입력입니다 (E12)": "hapsyo",
    "저장했다.": "banmal", "사진을 올렸다": "banmal", "사진을 올렸어.": "banmal", "완료됐어!": "banmal",
    "사용할 수 있음": "eumseum",
}


def _fixture(data: dict, fixture_id: str) -> dict:
    return next(f for f in data["fixtures"] if f["id"] == fixture_id)


def _strings(data: dict, fixture_id: str, side: str = "after") -> dict:
    return _fixture(data, fixture_id)[side]["strings"]


def _drop_criterion(data: dict, criterion: str) -> None:
    for fixture in data["fixtures"]:
        fixture["findings"] = [f for f in fixture["findings"] if f["criterion"] != criterion]


Mutation = tuple[str, Callable[[dict], object], str]

FIXTURE_MUTATIONS: list[Mutation] = [
    ("drop a surface locale", lambda d: d["fixtures"].pop(), "missing en fixture"),
    ("unknown criterion", lambda d: d["fixtures"][0]["findings"][0].update(criterion="tone"), "unknown criterion"),
    ("ungrounded evidence", lambda d: d["fixtures"][0]["findings"][0].update(evidence="저장"), "not quoted from before"),
    ("empty evidence", lambda d: d["fixtures"][0]["findings"][0].update(evidence="", fix=""), "must not be empty"),
    ("fix in the wrong part", lambda d: _fixture(d, "error-payment-network-en")["findings"][2].update(part="title"),
     "evidence is not quoted from before.title"),
    ("fix missing from after", lambda d: d["fixtures"][0]["findings"][0].update(fix="보관"), "fix does not appear"),
    ("flagged substring kept", lambda d: _strings(d, "notification-photos-uploaded-en").update(
        message="3 photo(s) added to Album."), "flagged string still appears"),
    ("generic primary label", lambda d: d["fixtures"][1]["after"].update(strings={"label": "Yes, continue"},
                                                                          accessibleName="Yes, continue"), "is generic"),
    ("label not first in name", lambda d: d["fixtures"][1]["after"].update(accessibleName="Do not Save draft"),
     "must start with the visible label"),
    ("destructive verb not repeated", lambda d: _fixture(d, "destructive-close-savings-en")["after"].update(
        strings={**_strings(d, "destructive-close-savings-en"), "confirm": "Proceed now"}, accessibleName="Proceed now"),
     "repeat a key word of the title"),
    ("onboarding without skip", lambda d: _strings(d, "onboarding-team-invite-en").pop("secondary"),
     "missing required part secondary"),
    ("error drops input-kept", lambda d: _fixture(d, "error-payment-network-ko").update(
        mustConvey=[c for c in _fixture(d, "error-payment-network-ko")["mustConvey"] if c["role"] != "input-kept"]),
     "must convey the input-kept fact"),
    ("lost meaning", lambda d: d["fixtures"][0].update(mustConvey=[{"role": "action", "text": "발행"}]), "does not convey"),
    ("pair roles differ", lambda d: _fixture(d, "empty-saved-items-en")["mustConvey"].append(
        {"role": "result", "text": "keep it here"}), "same roles"),
    ("pair numbers differ", lambda d: _fixture(d, "destructive-close-savings-en")["mustConvey"][1].update(text="₩12,500"),
     "numbers differ for amount"),
    ("mixed after register", lambda d: _strings(d, "empty-saved-items-ko").update(
        body="마음에 드는 상품의 하트를 누르면 여기에 모아 볼 수 있습니다."), "after mixes registers"),
    ("register hidden by a clause", lambda d: _strings(d, "destructive-close-savings-ko").update(
        body="지금 해지하면 만기 이자 12,400원을 받지 못해요, 되돌릴 수 없습니다."), "after mixes registers"),
    ("register hidden by a parenthesis", lambda d: _strings(d, "destructive-close-savings-ko").update(
        body="지금 해지하면 만기 이자 12,400원을 받지 못하며 되돌릴 수 없습니다. 원금은 연결 계좌로 들어가요(영업일 기준)"),
     "after mixes registers"),
    ("banmal in after", lambda d: _strings(d, "notification-photos-uploaded-ko").update(
        message="사진 3장을 앨범에 올렸어.", announcement="사진 3장을 앨범에 올렸어."), "after mixes registers"),
    ("honorific evidence in product register", lambda d: _fixture(d, "error-payment-network-ko")["findings"][2].update(
        evidence="관리자에게 문의하세요."), "outside the haeyo register"),
    ("honorific in English", lambda d: d["fixtures"][1]["findings"][0].update(criterion="korean-honorific-consistency"),
     "applies only to Korean"),
    ("English fragment in Korean", lambda d: _strings(d, "onboarding-team-invite-ko").update(title="Welcome! 팀원을 초대해 보세요"),
     "English fragments"),
    ("score field", lambda d: d["fixtures"][0].update(readabilityScore=72), "score-like field"),
    ("unused criterion", lambda d: _drop_criterion(d, "concision"), "criterion concision has no fixture finding"),
    ("duplicate id", lambda d: d["fixtures"][1].update(id=d["fixtures"][0]["id"]), "duplicate fixture id"),
    ("announcement drift", lambda d: _strings(d, "notification-photos-uploaded-en").update(announcement="Upload complete."),
     "announcement does not convey"),
]

CONTRACT_MUTATIONS: list[tuple[str, Callable[[str], str], str]] = [
    ("score rule removed", lambda t: t.replace("No readability score becomes", "A readability score becomes"),
     "readability-score rule"),
    ("fixture link removed", lambda t: t.replace("(interface-copy-fixtures.json)", "(fixtures.json)"),
     "must link interface-copy-fixtures.json"),
    ("criterion dropped", lambda t: t.replace("| `concision` |", "| concision |"), "must define 8 criteria"),
    ("unknown role", lambda t: t.replace("| `action` | The label names the result. |", "| `mood` | The label names the result. |"),
     "must list conveyed-fact roles"),
]


def run_self_test(validator: ModuleType) -> int:
    text, data = validator.load()
    baseline = validator.validate(text, data)
    if baseline:
        raise SystemExit("interface copy self-test: repository fixtures must pass first:\n  " + "\n  ".join(baseline))
    for sentence, expected in REGISTER_CASES.items():
        actual = validator.korean_register(sentence)
        if actual != expected:
            raise SystemExit(f"interface copy self-test: {sentence!r} classified as {actual!r}, expected {expected!r}")
    for label, mutate, expected in FIXTURE_MUTATIONS:
        mutated = copy.deepcopy(data)
        mutate(mutated)
        _expect(label, validator.validate(text, mutated), expected)
    for label, mutate, expected in CONTRACT_MUTATIONS:
        _expect(label, validator.validate(mutate(text), data), expected)
    total = len(FIXTURE_MUTATIONS) + len(CONTRACT_MUTATIONS)
    print(f"Interface copy contract self-test passed: {len(REGISTER_CASES)} register cases, {total} mutations rejected")
    return 0


def _expect(label: str, errors: list[str], expected: str) -> None:
    if not any(expected in error for error in errors):
        raise SystemExit(f"interface copy self-test: {label} was not rejected with {expected!r}: {errors}")
